import { describe, it, expect } from "vitest";
import { CZ_DMUS } from "../generator/czDmus.ts";
import { K812, cd810Number } from "../generator/dmu810.ts";
import { cd843Number } from "../generator/dmu843.ts";
import { K131, M131_NUMBERS } from "../generator/dmuM131.ts";
import { K240, M240_NUMBER } from "../generator/dmuM240.ts";
import { K296, m296Number } from "../generator/dmuM296.ts";
import { DMU_COMPARED, compare, mae } from "../generator/dmuComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
function build(id: string, params?: ParamValues) {
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
  "proc-vehicle-cd-810": (p) =>
    p.variant === "cd812" || p.variant === "cd912"
      ? { lob: 14.47, axles: [(3.35 - 7.5) * K812, (11.6 - 7.5) * K812], radii: [0.42] }
      : { lob: 13.97, axles: [-4.0, 4.0], radii: [0.42] },
  "proc-vehicle-cd-843": (p) => ({ lob: 25.2, axles: [-9.8, -7.4, 7.4, 9.8], radii: p.unit === "trailer" || p.unit === "drivingTrailer" ? [0.42] : [0.46] }),
  "proc-vehicle-csd-m131": () => ({ lob: 12.1, axles: [(2.3 - 5.85) * K131, (9.0 - 5.85) * K131], radii: [0.45] }),
  "proc-vehicle-csd-m240": () => ({ lob: 18.5, axles: [-6.183 - 1.0, -6.183 + 1.0, 6.183 - 1.05, 6.183 + 1.05], radii: [0.45] }),
  "proc-vehicle-csd-m296": () => ({ lob: 24.79, axles: [-9.8, -7.4, 7.4, 9.8], radii: [0.46, 0.42] }),
};

describe("Czech diesel railcars from vlakosimdb", () => {
  it("registers the five designs with their parameters and defaults", () => {
    expect(CZ_DMUS.map((d) => d.id)).toEqual(["proc-vehicle-cd-810", "proc-vehicle-cd-843", "proc-vehicle-csd-m131", "proc-vehicle-csd-m240", "proc-vehicle-csd-m296"]);
    const values = (id: string) => (CZ_DMUS.find((d) => d.id === id)!.params ?? []).map((p) => [p.name, p.default, p.values.map((v) => v.value)]);
    expect(values("proc-vehicle-cd-810")).toEqual([["variant", "cd810", ["cd810", "cd812", "cd912"]], ["livery", "red", ["red", "yellowBand", "blueWhite", "ivoryBand"]]]);
    expect(values("proc-vehicle-cd-843")).toEqual([["unit", "motorCar", ["motorCar", "drivingTrailer", "trailer"]]]);
    expect(values("proc-vehicle-csd-m131")).toEqual([["unit", "motorCar", ["motorCar", "trailer"]]]);
    expect(values("proc-vehicle-csd-m240")).toEqual([]);
    expect(values("proc-vehicle-csd-m296")).toEqual([["variant", "m296", ["m296", "cd853", "cd854"]]]);
    for (const d of CZ_DMUS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "diesel" });
  });

  for (const d of CZ_DMUS)
    for (const params of paramCombinations(d.params))
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
    expect(has("proc-vehicle-cd-810", { variant: "cd812" }, "roof-equipment/exhaust")).toBe(true);
    expect(has("proc-vehicle-cd-810", { variant: "cd912" }, "roof-equipment/")).toBe(false);
  });

  it("gives the 810 liveries the same body and the 812 / 912 their longer one", () => {
    const length = (params: ParamValues) => {
      const body = build("proc-vehicle-cd-810", params).nodes.filter((n) => n.id.startsWith("shell/"));
      return Math.max(...body.map((n) => n.max![0])) - Math.min(...body.map((n) => n.min![0]));
    };
    for (const livery of ["red", "yellowBand", "blueWhite", "ivoryBand"]) expect(length({ livery })).toBeCloseTo(13.103, 2);
    expect(length({ variant: "cd812" })).toBeCloseTo(14.0 * K812, 2);
    expect(length({ variant: "cd912" })).toBeCloseTo(14.0 * K812, 2);
  });

  it("carries valid running numbers", () => {
    for (const l of ["red", "yellowBand", "blueWhite", "ivoryBand"] as const) expect(valid(cd810Number("cd810", l)), l).toBe(true);
    expect(cd810Number("cd810", "yellowBand")).toBe("810 225-3");
    expect(cd810Number("cd812", "red")).toBe("812 613-8");
    expect(valid(cd810Number("cd912", "red"))).toBe(true);
    for (const u of ["motorCar", "drivingTrailer", "trailer"] as const) expect(valid(cd843Number(u)), u).toBe(true);
    expect(cd843Number("drivingTrailer")).toBe("943 002-6");
    expect(m296Number("cd853")).toBe("853 029-7");
    expect(valid(m296Number("cd854"))).toBe(true);
    // the pre-1988 CSD railcars carry their Kryspin designations
    expect(M131_NUMBERS.motorCar).toBe("M 131.1238");
    expect(M240_NUMBER).toBe("M 240.0113");
    expect(m296Number("m296")).toBe("M 296.1028");
  });

  it("matches the annotated native landmarks of each default car", () => {
    // the rows the model departs from on purpose, documented in assets/<folder>/COMPARISON.md
    const known = new Set(["proc-vehicle-cd-810 S09", "proc-vehicle-cd-810 F02", "proc-vehicle-csd-m240 S04"]);
    const limits: Record<string, number> = { "proc-vehicle-cd-810": 0.8, "proc-vehicle-cd-843": 0.2, "proc-vehicle-csd-m131": 0.4, "proc-vehicle-csd-m240": 0.5, "proc-vehicle-csd-m296": 0.5 };
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
