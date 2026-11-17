import { describe, it, expect } from "vitest";
import { CZ_DMUS } from "../generator/czDmus.ts";
import { K810, cd810Number } from "../generator/dmu810.ts";
import { K812, cd812Number, cd812Train } from "../generator/dmu812.ts";
import { cd843Number, cd843Train } from "../generator/dmu843.ts";
import { K131, M131_NUMBERS, m131Train } from "../generator/dmuM131.ts";
import { K240, M240_NUMBER } from "../generator/dmuM240.ts";
import { K296, m296Number } from "../generator/dmuM296.ts";
import { DMU_COMPARED, compare, mae } from "../generator/dmuComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";
import { sample } from "./catalogCache";
import { glbStats } from "../generator/glbStats.ts";
import { lodBudget } from "../generator/lod.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
const built = new Map<string, ReturnType<typeof buildNow>>();
function build(id: string, params?: ParamValues) {
  const key = `${id} ${JSON.stringify(params ?? {})}`;
  if (!built.has(key)) built.set(key, buildNow(id, params));
  return built.get(key)!;
}
function buildNow(id: string, params?: ParamValues) {
  const d = CZ_DMUS.find((x) => x.id === id)!;
  const mesh = d.build(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree(id, d.title).root) };
}
const valid = (number: string): boolean => {
  const digits = [...number.replace(/\D/g, "")].map(Number);
  const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
  return /^\d{3} \d{3}-\d$/.test(number) && (10 - (sum % 10)) % 10 === digits[6];
};
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// published lengths over the buffers and the axles' x (assets/<folder>/SOURCES.md), wheel radii
const SPECS: Record<string, (p: ParamValues) => { lob: number; axles: number[]; radii: number[] }> = {
  "proc-vehicle-cd-810": () => ({ lob: 13.97, axles: [-4.0, 4.0], radii: [0.42] }),
  "proc-vehicle-cd-812": () => ({ lob: 14.47, axles: [(3.35 - 7.5) * K812, (11.6 - 7.5) * K812], radii: [0.42] }),
  "proc-vehicle-cd-843": (p) => ({ lob: 25.2, axles: [-9.8, -7.4, 7.4, 9.8], radii: p.unit === "trailer" || p.unit === "drivingTrailer" ? [0.42] : [0.46] }),
  "proc-vehicle-csd-m131": () => ({ lob: 12.1, axles: [(2.3 - 5.85) * K131, (9.0 - 5.85) * K131], radii: [0.45] }),
  "proc-vehicle-csd-m240": () => ({ lob: 18.5, axles: [-6.183 - 1.0, -6.183 + 1.0, 6.183 - 1.05, 6.183 + 1.05], radii: [0.45] }),
  "proc-vehicle-csd-m296": () => ({ lob: 24.79, axles: [-9.8, -7.4, 7.4, 9.8], radii: [0.46, 0.42] }),
};

describe("Czech diesel railcars from vlakosimdb", () => {
  it("registers the six designs with their parameters and defaults", () => {
    expect(CZ_DMUS.map((d) => d.id)).toEqual(["proc-vehicle-cd-810", "proc-vehicle-cd-812", "proc-vehicle-cd-843", "proc-vehicle-csd-m131", "proc-vehicle-csd-m240", "proc-vehicle-csd-m296"]);
    const values = (id: string) => (CZ_DMUS.find((d) => d.id === id)!.params ?? []).map((p) => [p.name, p.default, p.values.map((v) => v.value)]);
    expect(values("proc-vehicle-cd-810")).toEqual([["livery", "red", ["red", "yellowBand", "blueWhite", "ivoryBand", "cdBlue"]]]);
    expect(values("proc-vehicle-cd-812")).toEqual([["unit", "motorCar", ["motorCar", "drivingTrailer", "train"]], ["cars", "2", ["2", "3", "4", "5", "6", "7", "8"]]]);
    expect(values("proc-vehicle-cd-843")).toEqual([["unit", "motorCar", ["motorCar", "drivingTrailer", "trailer", "train"]], ["cars", "3", ["2", "3", "4", "5", "6", "7", "8"]], ["livery", "red", ["red", "cdBlue"]]]);
    expect(values("proc-vehicle-csd-m131")).toEqual([["unit", "motorCar", ["motorCar", "trailer", "train"]], ["cars", "2", ["2", "3", "4", "5", "6", "7", "8"]]]);
    expect(values("proc-vehicle-csd-m240")).toEqual([]);
    expect(values("proc-vehicle-csd-m296")).toEqual([["variant", "m296", ["m296", "cd853", "cd854", "cd854Blue"]]]);
    for (const d of CZ_DMUS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "diesel" });
  });

  for (const d of CZ_DMUS)
    // the full trains: "the full trains" below
    for (const params of sample(paramCombinations(d.params)).filter((p) => p.unit !== "train"))
      it(`${d.id} ${JSON.stringify(params)}: length, running gear, envelope and budget`, () => {
        const spec = SPECS[d.id]!(params);
        const { mesh, tris, nodes } = build(d.id, params);
        expect(mesh.triangleCount()).toBeLessThanOrEqual(16000);
        const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
        expect(Math.max(...xs)).toBeCloseTo(spec.lob / 2, 4);
        expect(Math.min(...xs)).toBeCloseTo(-spec.lob / 2, 4);
        expect(Math.min(...tris.flatMap((t) => t.p.map((p) => p[1])))).toBeCloseTo(0, 5);
        expect(Math.max(...tris.flatMap((t) => t.p.map((p) => p[1])))).toBeLessThanOrEqual(4.7);
        const z = tris.flatMap((t) => t.p.map((p) => p[2]));
        expect(Math.max(...z) - Math.min(...z)).toBeLessThanOrEqual(3.1);
        expect(Math.max(...z) + Math.min(...z)).toBeCloseTo(0, 5);
        // the wheel treads: steel sweeps a wheel diameter high, standing on the rail, 1.435 m gauge
        const treads = nodes.filter((n) => n.id.startsWith("running-gear/") && n.material === "steel" && spec.radii.some((r) => Math.abs(n.max![1] - n.min![1] - 2 * r * Math.cos(Math.PI / 24)) < 0.002));
        expect(treads).toHaveLength(2 * spec.axles.length);
        const axles = [...new Set(treads.map((n) => r3((n.min![0] + n.max![0]) / 2)))].sort((a, b) => a - b);
        expect(axles).toHaveLength(spec.axles.length);
        axles.forEach((x, i) => expect(x).toBeCloseTo(spec.axles[i]!, 2));
        for (const n of treads) {
          expect(n.min![1]).toBeCloseTo(0, 5);
          expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
        }
      });

  it("builds the 843's three cars to one 24.1 m body and 17.2 m bogie pivots", () => {
    for (const unit of ["motorCar", "drivingTrailer", "trailer"]) {
      const body = build("proc-vehicle-cd-843", { unit }).nodes.filter((n) => n.id.startsWith("shell/"));
      expect(Math.max(...body.map((n) => n.max![0])) - Math.min(...body.map((n) => n.min![0])), unit).toBeCloseTo(24.1, 3);
    }
    // the cabs: two on the motor car, one at +X on the driving trailer, none on the trailer
    const cabs = (unit: string) => ["front-end", "rear-end"].filter((e) => build("proc-vehicle-cd-843", { unit }).nodes.some((n) => n.id.startsWith(`${e}/cab/`)));
    expect(cabs("motorCar")).toEqual(["front-end", "rear-end"]);
    expect(cabs("drivingTrailer")).toEqual(["front-end"]);
    expect(cabs("trailer")).toEqual([]);
  });

  it("keeps the motor cars' engines and roof equipment off their trailers", () => {
    const has = (id: string, params: ParamValues, prefix: string) => build(id, params).nodes.some((n) => n.id.startsWith(prefix));
    expect(has("proc-vehicle-csd-m131", { unit: "motorCar" }, "roof-equipment/radiator")).toBe(true);
    expect(has("proc-vehicle-csd-m131", { unit: "trailer" }, "roof-equipment/")).toBe(false);
    expect(has("proc-vehicle-cd-843", { unit: "motorCar" }, "underframe/power-pack-1")).toBe(true);
    expect(has("proc-vehicle-cd-843", { unit: "trailer" }, "underframe/power-pack-1")).toBe(false);
    expect(has("proc-vehicle-cd-812", { unit: "motorCar" }, "roof-equipment/exhaust")).toBe(true);
    expect(has("proc-vehicle-cd-812", { unit: "drivingTrailer" }, "roof-equipment/")).toBe(false);
    expect(has("proc-vehicle-cd-812", { unit: "drivingTrailer" }, "underframe/engine")).toBe(false);
  });

  it("gives the 810 liveries the same body and the 812 / 912 their longer one", () => {
    // tip to tip of the cab ends' skins
    const length = (id: string, params: ParamValues) => {
      const body = build(id, params).nodes.filter((n) => n.max && /^(front|rear)-end\/skin\//.test(n.id));
      return Math.max(...body.map((n) => n.max![0])) - Math.min(...body.map((n) => n.min![0]));
    };
    for (const livery of ["red", "yellowBand", "blueWhite", "ivoryBand", "cdBlue"]) expect(length("proc-vehicle-cd-810", { livery })).toBeCloseTo(13.103, 2);
    for (const unit of ["motorCar", "drivingTrailer"]) expect(length("proc-vehicle-cd-812", { unit })).toBeCloseTo(14.0 * K812, 2);
  });

  it("draws the cab faces from the photographs: windscreens, lamps, plough and apron", () => {
    const front = (id: string, params: ParamValues, prefix: string) => build(id, params).nodes.filter((n) => n.max && n.id.startsWith(prefix));
    const box = (ns: ReturnType<typeof front>) => ({
      min: [0, 1, 2].map((k) => Math.min(...ns.map((n) => n.min![k]!))),
      max: [0, 1, 2].map((k) => Math.max(...ns.map((n) => n.max![k]!))),
    });
    for (const livery of ["red", "yellowBand", "blueWhite", "ivoryBand", "cdBlue"]) {
      // the snow plough under the buffer beam: across most of the face, its foot 0.18 m over the rail, ahead of the face
      const plough = box(front("proc-vehicle-cd-810", { livery }, "front-end/plough/"));
      expect(plough.min[1]).toBeCloseTo(0.18, 3);
      expect(plough.max[2] - plough.min[2]).toBeGreaterThan(2.7);
      expect(plough.max[0]).toBeGreaterThan((12.9 - 6.65) * K810);
      expect(front("proc-vehicle-cd-810", { livery }, "front-end/plough/edge").length).toBeGreaterThan(0);
      // two windscreen panes either side of the pillar, each about 1.2 m wide
      for (const [i, s] of [[1, 1], [2, -1]] as const) {
        const pane = box(front("proc-vehicle-cd-810", { livery }, `front-end/skin/pane-${i}-glass`));
        expect(pane.max[2] - pane.min[2]).toBeGreaterThan(1.1);
        expect(s * (pane.min[2] + pane.max[2])).toBeGreaterThan(0);
      }
      expect(front("proc-vehicle-cd-810", { livery }, "rear-end/lamps/").length).toBeGreaterThan(0);
    }
    for (const unit of ["motorCar", "drivingTrailer"]) {
      // the 812's apron reaches 0.24 m, its windscreen nearly the face's width, the lamp mask under it
      expect(box(front("proc-vehicle-cd-812", { unit }, "front-end/apron/")).min[1]).toBeCloseTo(0.24, 3);
      const ws = box(front("proc-vehicle-cd-812", { unit }, "front-end/skin/windscreen-glass"));
      expect(ws.max[2] - ws.min[2]).toBeGreaterThan(2.4);
      const mask = box(front("proc-vehicle-cd-812", { unit }, "front-end/skin/mask"));
      expect(mask.max[1]).toBeLessThan(ws.min[1]);
      expect(front("proc-vehicle-cd-812", { unit }, "front-end/lamps/").length).toBeGreaterThan(0);
    }
  });

  it("draws the 854's own cab ends and the 843's roof headlamp box", () => {
    const nodes = (id: string, params: ParamValues, re: RegExp) => build(id, params).nodes.filter((n) => n.max && re.test(n.id));
    const box = (ns: ReturnType<typeof nodes>) => ({
      min: [0, 1, 2].map((k) => Math.min(...ns.map((n) => n.min![k]!))),
      max: [0, 1, 2].map((k) => Math.max(...ns.map((n) => n.max![k]!))),
    });
    const tip = (24.3 - 12.45) * K296;
    for (const variant of ["cd854", "cd854Blue"])
      for (const end of ["front-end", "rear-end"]) {
        const at = `${variant} ${end}`;
        // two windscreens either side of the pillar, each about 1 m wide; no gangway door
        const mids = [1, 2].map((i) => {
          const ws = box(nodes("proc-vehicle-csd-m296", { variant }, new RegExp(`^${end}/windscreen-${i}/glass`)));
          expect(ws.max[2] - ws.min[2], at).toBeGreaterThan(0.85);
          return (ws.min[2] + ws.max[2]) / 2;
        });
        expect(mids[0]! * mids[1]!, at).toBeLessThan(-0.16);
        expect(nodes("proc-vehicle-csd-m296", { variant }, new RegExp(`^${end}/gangway-door`)).length, at).toBe(0);
        // the headlamp box stands out over the face's top; the apron reaches 0.3 m
        const lamp = box(nodes("proc-vehicle-csd-m296", { variant }, new RegExp(`^${end}/top-lamp/`)));
        expect(end === "front-end" ? lamp.max[0] : -lamp.min[0], at).toBeGreaterThan(tip + 0.1);
        expect(lamp.max[2] - lamp.min[2], at).toBeGreaterThan(0.9);
        expect(box(nodes("proc-vehicle-csd-m296", { variant }, new RegExp(`^${end}/apron/`))).min[1], at).toBeCloseTo(0.3, 3);
        expect(nodes("proc-vehicle-csd-m296", { variant }, new RegExp(`^${end}/(front-number|front-emblem|lamps)/`)).length, at).toBeGreaterThan(0);
      }
    // the M 296.1 and the 853 keep the gangway front
    for (const variant of ["m296", "cd853"]) {
      expect(nodes("proc-vehicle-csd-m296", { variant }, /^front-end\/gangway-door/).length, variant).toBeGreaterThan(0);
      expect(nodes("proc-vehicle-csd-m296", { variant }, /^front-end\/windscreen/).length, variant).toBe(0);
    }
    // the 843's and 943's cab ends carry the headlamp box over the windows in every livery; gangway ends do not
    for (const livery of ["red", "cdBlue"]) {
      for (const unit of ["motorCar", "drivingTrailer"]) {
        const lamp = box(nodes("proc-vehicle-cd-843", { unit, livery }, /^front-end\/top-lamp\//));
        expect(lamp.max[2] - lamp.min[2], `${unit} ${livery}`).toBeCloseTo(0.82, 2);
        expect(lamp.min[1], `${unit} ${livery}`).toBeGreaterThan(3.3);
        expect(nodes("proc-vehicle-cd-843", { unit, livery }, /^front-end\/top-lamp\/lamps/).length).toBeGreaterThan(0);
      }
      expect(nodes("proc-vehicle-cd-843", { unit: "motorCar", livery }, /^rear-end\/top-lamp\//).length).toBeGreaterThan(0);
      expect(nodes("proc-vehicle-cd-843", { unit: "drivingTrailer", livery }, /^rear-end\/top-lamp\//).length).toBe(0);
      expect(nodes("proc-vehicle-cd-843", { unit: "trailer", livery }, /top-lamp/).length).toBe(0);
    }
  });

  it("paints CD's blue over the cars' own bodies, with the logo where photographed", () => {
    const ids = (id: string, params: ParamValues, re: RegExp) => build(id, params).nodes.filter((n) => re.test(n.id)).map((n) => n.id);
    const windows = (id: string, params: ParamValues) => ids(id, params, /\/windows\//).sort();
    // the blue 854 is the 854's body and layout; the blue 843 cars the red ones'
    expect(windows("proc-vehicle-csd-m296", { variant: "cd854Blue" })).toEqual(windows("proc-vehicle-csd-m296", { variant: "cd854" }));
    for (const unit of ["motorCar", "drivingTrailer", "trailer"]) {
      expect(windows("proc-vehicle-cd-843", { unit, livery: "cdBlue" }), unit).toEqual(windows("proc-vehicle-cd-843", { unit }));
      // the emblem on both sides; the wordmark after it on the motor car and the driving trailer, as photographed
      expect(ids("proc-vehicle-cd-843", { unit, livery: "cdBlue" }, /^body\/(right|left)-side\/emblem\//).length, unit).toBeGreaterThan(0);
      expect(ids("proc-vehicle-cd-843", { unit, livery: "cdBlue" }, /^body\/right-side\/wordmark\//).length > 0, unit).toBe(unit !== "trailer");
    }
    // a cab front carries the number and the emblem, and the light blue over the roof's end
    for (const unit of ["motorCar", "drivingTrailer"])
      for (const scope of ["front-number", "front-emblem", "hood"])
        expect(ids("proc-vehicle-cd-843", { unit, livery: "cdBlue" }, new RegExp(`^front-end/${scope}/`)).length, `${unit} ${scope}`).toBeGreaterThan(0);
    for (const [id, params] of [["proc-vehicle-cd-810", { livery: "cdBlue" }], ["proc-vehicle-csd-m296", { variant: "cd854Blue" }]] as const)
      expect(ids(id, params, /^body\/left-side\/wordmark\//).length, id).toBeGreaterThan(0);
  });

  it("covers the roof's rounding at every blue 843 / 943 cab end with the light blue, across its width", () => {
    // seen from above, the topmost surface over the last 0.5 m of a cab end: the light blue hood,
    // never the grey roof showing through it (it did over half the +X end, where the shell's
    // non-planar quads fold the other way than the hood's)
    const top = (tris: ReturnType<typeof build>["tris"], x: number, z: number): string => {
      let best = -Infinity;
      let mat = "";
      for (const t of tris) {
        const [a, b, c] = t.p;
        const d = (b[0] - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (b[2] - a[2]);
        if (Math.abs(d) < 1e-12) continue;
        const u = ((x - a[0]) * (c[2] - a[2]) - (c[0] - a[0]) * (z - a[2])) / d;
        const v = ((b[0] - a[0]) * (z - a[2]) - (x - a[0]) * (b[2] - a[2])) / d;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const y = a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1]);
        if (y > best) [best, mat] = [y, t.material];
      }
      return mat;
    };
    for (const unit of ["motorCar", "drivingTrailer"]) {
      const { tris } = build("proc-vehicle-cd-843", { unit, livery: "cdBlue" });
      const xs = tris.flatMap((t) => t.p.filter((p) => p[1] > 3).map((p) => p[0]));
      const ends: number[] = unit === "motorCar" ? [Math.max(...xs), Math.min(...xs)] : [Math.max(...xs)];
      for (const tip of ends)
        for (let i = 1; i <= 5; i++)
          for (let j = -6; j <= 6; j++) {
            const x = tip - Math.sign(tip) * 0.1 * i;
            expect(top(tris, x, 0.2 * j), `${unit} x=${x.toFixed(2)} z=${(0.2 * j).toFixed(1)}`).toBe("skyBlue");
          }
    }
  });

  it("carries valid running numbers", () => {
    for (const l of ["red", "yellowBand", "blueWhite", "ivoryBand", "cdBlue"] as const) expect(valid(cd810Number(l)), l).toBe(true);
    expect(cd810Number("cdBlue")).toBe("810 290-7");
    expect(cd810Number("yellowBand")).toBe("810 225-3");
    expect(cd810Number("ivoryBand")).toBe("810 545-4");
    expect(cd812Number("motorCar")).toBe("812 613-8");
    expect(cd812Number("drivingTrailer")).toBe("912 001-5");
    for (const u of ["motorCar", "drivingTrailer", "trailer"] as const) for (const l of ["red", "cdBlue"] as const) expect(valid(cd843Number(u, l)), `${u} ${l}`).toBe(true);
    expect([cd843Number("motorCar", "cdBlue"), cd843Number("drivingTrailer", "cdBlue")]).toEqual(["843 007-6", "943 010-9"]);
    expect(cd843Number("drivingTrailer")).toBe("943 002-6");
    expect(m296Number("cd853")).toBe("853 029-7");
    expect(valid(m296Number("cd854"))).toBe(true);
    expect(m296Number("cd854Blue")).toBe("854 023-9");
    // the pre-1988 CSD railcars carry their Kryspin designations
    expect(M131_NUMBERS.motorCar).toBe("M 131.1238");
    expect(M240_NUMBER).toBe("M 240.0113");
    expect(m296Number("m296")).toBe("M 296.1028");
  });

  it("matches the annotated native landmarks of each default car", () => {
    // the rows the model departs from on purpose, documented in assets/<folder>/COMPARISON.md
    const known = new Set(["proc-vehicle-cd-810 S09", "proc-vehicle-cd-810 F01", "proc-vehicle-cd-810 F02", "proc-vehicle-cd-812 S08", "proc-vehicle-cd-812 S11", "proc-vehicle-csd-m240 S04"]);
    const limits: Record<string, number> = { "proc-vehicle-cd-810": 0.8, "proc-vehicle-cd-812": 0.3, "proc-vehicle-cd-843": 0.2, "proc-vehicle-csd-m131": 0.4, "proc-vehicle-csd-m240": 0.5, "proc-vehicle-csd-m296": 0.5 };
    expect(DMU_COMPARED.map((d) => d.id)).toEqual(CZ_DMUS.map((d) => d.id));
    for (const d of DMU_COMPARED) {
      const rows = compare(d);
      expect(rows.length, d.id).toBeGreaterThanOrEqual(10);
      expect(mae(rows), d.id).toBeLessThanOrEqual(limits[d.id]!);
      for (const row of rows) {
        if (known.has(`${d.id} ${row.id}`)) continue;
        for (let i = 0; i < 4; i++) expect(Math.abs(row.model[i]! - row.source[i]!), `${d.id} ${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
      }
    }
  });

  it("scales the lengths to the published dimensions", () => {
    expect(K812).toBeCloseTo(14.47 / 15, 9);
    expect(K131 * 11.5).toBeCloseTo(12.1, 9);
    expect(K240 * 19.0).toBeCloseTo(18.5, 9);
    expect(K296 * 24.6).toBeCloseTo(24.79, 9);
  });
});

// The full trains (unit "train", `cars` 2 .. 8): one articulated vehicle, a car a section.
const TRAINS = [
  { id: "proc-vehicle-cd-812", lob: 14.47, formation: cd812Train, extra: {} },
  { id: "proc-vehicle-cd-843", lob: 25.2, formation: cd843Train, extra: {} },
  { id: "proc-vehicle-cd-843", lob: 25.2, formation: cd843Train, extra: { livery: "cdBlue" } },
  { id: "proc-vehicle-csd-m131", lob: 12.1, formation: m131Train, extra: {} },
] as const;

describe("the full trains", () => {
  it("lay out their cars by the formation rules", () => {
    const names = (f: (n: number) => Array<{ car: string; turned: boolean }>, n: number) => f(n).map((c) => (c.turned ? `${c.car}~` : c.car));
    // 812 + 912 pairs, an odd train ending in a second 812
    expect(names(cd812Train, 2)).toEqual(["motorCar", "drivingTrailer~"]);
    expect(names(cd812Train, 3)).toEqual(["motorCar", "drivingTrailer", "motorCar~"]);
    expect(names(cd812Train, 8)).toEqual(["motorCar", "drivingTrailer", "motorCar", "drivingTrailer", "motorCar", "drivingTrailer", "motorCar", "drivingTrailer~"]);
    // the 843 leading, 043s, the 943 at the rear up to four cars, a second 843 from five
    expect(names(cd843Train, 2)).toEqual(["motorCar", "drivingTrailer~"]);
    expect(names(cd843Train, 3)).toEqual(["motorCar", "trailer", "drivingTrailer~"]);
    expect(names(cd843Train, 4)).toEqual(["motorCar", "trailer", "trailer", "drivingTrailer~"]);
    expect(names(cd843Train, 5)).toEqual(["motorCar", "trailer", "trailer", "trailer", "motorCar~"]);
    expect(names(cd843Train, 8)).toEqual(["motorCar", ...Array(6).fill("trailer"), "motorCar~"]);
    // the railbus with up to two trailers, from four cars a motor car at each end
    expect(names(m131Train, 2)).toEqual(["motorCar", "trailer~"]);
    expect(names(m131Train, 3)).toEqual(["motorCar", "trailer", "trailer~"]);
    expect(names(m131Train, 4)).toEqual(["motorCar", "trailer", "trailer", "motorCar~"]);
    expect(names(m131Train, 8)).toEqual(["motorCar", ...Array(6).fill("trailer"), "motorCar~"]);
    // every length: the cars end to end over their coupling planes, centred on x = 0
    for (const { formation, lob } of TRAINS)
      for (let n = 2; n <= 8; n++) {
        const cars = formation(n);
        expect(cars).toHaveLength(n);
        expect(cars[0]!.hi).toBeCloseTo((n * lob) / 2, 9);
        expect(cars[n - 1]!.lo).toBeCloseTo((-n * lob) / 2, 9);
        cars.forEach((c, i) => {
          expect(c.hi - c.lo).toBeCloseTo(lob, 9);
          if (i > 0) expect(c.hi).toBeCloseTo(cars[i - 1]!.lo, 9);
        });
      }
  });

  for (const { id, lob, extra } of TRAINS)
    for (const n of [2, 3, 8])
      it(`${id} ${JSON.stringify(extra)} ${n} cars: sections, joints, supports, length, budget and distant model`, () => {
        const d = CZ_DMUS.find((x) => x.id === id)!;
        const params = { ...extra, unit: "train", cars: String(n) };
        const m = d.build(params);
        const rig = m.rig!;
        expect(rig.sections).toHaveLength(n);
        expect(rig.joints).toHaveLength(n - 1);
        // two axles or bogies a car, each a support of its own section
        expect(rig.supports).toHaveLength(2 * n);
        // the hinges at the coupling planes
        rig.sections!.slice(1).forEach((s, i) => expect(s.pivot[0]).toBeCloseTo((n * lob) / 2 - (i + 1) * lob, 6));
        const glb = m.toGlb("t");
        const s = glbStats(glb);
        expect(s.max[0]).toBeCloseTo((n * lob) / 2, 4);
        expect(s.min[0]).toBeCloseTo((-n * lob) / 2, 4);
        expect(s.min[1]).toBeCloseTo(0, 5);
        expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
        expect(s.triangles).toBeLessThanOrEqual(16000 * n);
        // deterministic
        expect(Buffer.from(d.build(params).toGlb("t")).equals(Buffer.from(glb))).toBe(true);
        // the distant model: the same sections, 100 triangles a car, 500 at most
        const low = d.buildLod!(params);
        const budget = Math.min(lodBudget(d), 100 * n);
        expect(lodBudget(d)).toBe(500);
        expect(low.triangleCount()).toBeLessThanOrEqual(budget);
        expect(low.triangleCount()).toBeGreaterThanOrEqual(budget * 0.7);
        expect(low.rig!.sections).toHaveLength(n);
        expect(low.rig!.joints).toHaveLength(n - 1);
      }, 120_000);

  it("states the game figures of every train: the cars' weights added up, the motor cars' power", () => {
    const car = { "proc-vehicle-cd-812": { motorCar: [20.7, 240], drivingTrailer: [20.7, 0] }, "proc-vehicle-cd-843": { motorCar: [56, 423], drivingTrailer: [25, 0], trailer: [25, 0] }, "proc-vehicle-csd-m131": { motorCar: [25, 155], trailer: [15, 0] } } as Record<string, Record<string, [number, number]>>;
    for (const { id, formation, extra } of TRAINS) {
      const d = CZ_DMUS.find((x) => x.id === id)!;
      const def = d.params!.find((p) => p.name === "cars")!.default;
      for (let n = 2; n <= 8; n++) {
        const want = { ...extra, unit: "train", ...(String(n) === def ? {} : { cars: String(n) }) };
        const v = d.game!.variants!.find((x) => JSON.stringify(Object.entries(x.params).sort()) === JSON.stringify(Object.entries(want).sort()));
        expect(v, `${id} ${n}`).toBeDefined();
        const cars = formation(n);
        expect(v!.weight).toBeCloseTo(cars.reduce((t, c) => t + car[id]![c.car]![0], 0), 6);
        expect(v!.power).toBe(cars.reduce((t, c) => t + car[id]![c.car]![1], 0));
      }
    }
  });
});
