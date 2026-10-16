import { proceduralId } from "../generator/modelId.ts";
import fs from "node:fs";
import { describe, it, expect } from "vitest";
import { FREIGHT_WAGONS, HABIS_PARAMS, PAO_PARAMS, SQNS_PARAMS, SQNS_PINS } from "../generator/freightWagons";
import { FACCS_LIVERIES, FACCS_PARAMS, FALLS_LIVERIES, FALLS_PARAMS } from "../generator/hopperWagons";
import { FREIGHT_NUMBERS, clipSolidFaces } from "../generator/freightWagonParts";
import { FREIGHT_TRANSFERS } from "../generator/freightTransfers";
import { ALL_TRANSFERS, transferBuild } from "../generator/coachTransfers";
import { WAGON_CATALOG } from "../generator/wagons";
import { ALL_VEHICLES, designSource } from "../generator/generate";
import { coverageCombinations, paramCombinations } from "../generator/design";
import { uicCheckDigit } from "../generator/csdCoaches";
import { canStroke } from "../generator/strokeFont";
import { coachComparison, readLandmarks } from "../generator/csdCoachComparison";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));
const design = (id: string) => FREIGHT_WAGONS.find((d) => d.id === id)!;
const tree = (id: string, params?: Record<string, string>) => leaves(design(id).build(params).sourceTree(id, id).root);
const values = (specs: readonly { values: Array<{ value: string }> }[]) => specs[0]!.values.map((v) => v.value);

// Length over the buffer heads and the axle centres (Factory x) of each design: the XML
// bumpers and the wheel contact points of its geometry (see each SOURCES.md).
const MECHANICS: Record<string, { length: number; axles: number[] }> = {
  "proc-vehicle-sqns-container-wagon": { length: 19.8, axles: [-8.05, -6.25, 6.25, 8.05] },
  "proc-vehicle-pao-flat-wagon": { length: 15.3, axles: [-6.0, -4.1, 4.1, 6.0] },
  "proc-vehicle-habis-sliding-wall-wagon": { length: 23.2, axles: [-9.65, -7.85, 7.95, 9.75] },
  "proc-vehicle-hadgs-hopper-wagon": { length: 16.8, axles: [-6.4, -4.6, 4.5, 6.3] },
  "proc-vehicle-faccs-hopper-wagon": { length: 12.8, axles: [-5.15, -3.15, 3.15, 5.15] },
  "proc-vehicle-falls-hopper-wagon": { length: 13.5, axles: [-5.3, -3.3, 2.8, 4.8] },
  "proc-vehicle-wap-hopper-wagon": { length: 13.5, axles: [-4.2, -2.2, 2.9, 4.9] },
};

describe("container, flat, sliding-wall and hopper wagons transferred from vlakosimdb", () => {
  it("are registered as rail wagons with stable ids, their references and parameters", () => {
    expect(FREIGHT_WAGONS.map((d) => d.id)).toEqual(Object.keys(MECHANICS));
    for (const d of FREIGHT_WAGONS) {
      expect(ALL_VEHICLES).toContain(d);
      expect(designSource(proceduralId(d.id))).toBe("freightWagons.ts");
      expect(d.catalog).toEqual(WAGON_CATALOG);
      for (const f of ["SOURCES.md", "PHOTOS.md"]) expect(fs.existsSync(new URL(`../assets/${d.references}/${f}`, import.meta.url)), `${d.id} ${f}`).toBe(true);
    }
    expect(values(SQNS_PARAMS)).toEqual(["empty", "maersk"]);
    expect(values(PAO_PARAMS)).toEqual(["empty", "tubes"]);
    expect(values(HABIS_PARAMS)).toEqual(["tw1", "tw2"]);
    expect(values(FACCS_PARAMS)).toEqual(["cd", "viamont"]);
    expect(values(FALLS_PARAMS)).toEqual(["cd", "sd", "viamont"]);
    expect(SQNS_PARAMS[0]).toMatchObject({ name: "cargo", default: "empty" });
    expect(PAO_PARAMS[0]).toMatchObject({ name: "cargo", default: "tubes" });
    for (const p of [HABIS_PARAMS, FACCS_PARAMS, FALLS_PARAMS]) expect(p[0]!.name).toBe("livery");
    expect(design("proc-vehicle-hadgs-hopper-wagon").params).toBeUndefined();
    expect(design("proc-vehicle-wap-hopper-wagon").params?.[0]).toMatchObject({name:"cargo",default:"coal"});
    // the liveries name the vlakosimdb folder each one comes from
    expect(FACCS_LIVERIES.map((l) => l.source)).toEqual(["n_faccs", "viamont_faccs"]);
    expect(FALLS_LIVERIES.map((l) => l.source)).toEqual(["n_falls", "sd_falls", "viamont_falls"]);
  });

  it("measures each design's default and each load against the native BMPs", () => {
    for (const t of FREIGHT_TRANSFERS) expect(ALL_TRANSFERS).toContain(t);
    for (const d of FREIGHT_WAGONS) {
      const defaults = paramCombinations(d.params)[0]!;
      expect(FREIGHT_TRANSFERS.some((t) => t.id === d.id && JSON.stringify(t.params ?? {}) === JSON.stringify(defaults)), d.id).toBe(true);
    }
    // every cargo of the two loaded designs is one compared vlakosimdb vehicle
    for (const id of ["proc-vehicle-sqns-container-wagon"])
      expect(FREIGHT_TRANSFERS.filter((t) => t.id === id).map((t) => t.params!.cargo)).toEqual(values(design(id).params!));
  });

  it.each(FREIGHT_TRANSFERS.map((t) => [t.key] as const))("%s matches the native BMP landmarks within their pixel tolerances", (key) => {
    const rows = coachComparison(key);
    expect(rows.length).toBe(readLandmarks(key).length);
    expect(rows.length).toBeGreaterThanOrEqual(8);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(FREIGHT_WAGONS.flatMap((d) => coverageCombinations(d.params, d.finishParams).map((p) => [d.id, JSON.stringify(p)] as const)))(
    "%s %s builds inside the rail envelope and budget, without flicker",
    (id, params) => {
      const glb = design(id).build(JSON.parse(params)).toGlb(id, "vehicle");
      const s = glbStats(glb);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.triangles).toBeLessThanOrEqual(8000);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    },
  );

  it.each(Object.entries(MECHANICS))("%s keeps the XML length over buffers, its axle positions and 920 mm wheels on the rail", (id, want) => {
    for (const params of paramCombinations(design(id).params)) {
      const mesh = design(id).build(params);
      const s = glbStats(mesh.toGlb(id, "vehicle"));
      expect(s.max[0] - s.min[0]).toBeCloseTo(want.length, 3);
      expect(s.max[0] + s.min[0]).toBeCloseTo(0, 3);
      const nodes = leaves(mesh.sourceTree(id, id).root);
      // each wheelset's first primitive is its axle
      const xs = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id)).map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b);
      expect(xs).toEqual(want.axles);
      const treads = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-[2-5]$/.test(n.id) && n.material === "steel" && n.max![1] - n.min![1] > 0.7);
      expect(treads).toHaveLength(8);
      for (const t of treads) {
        expect(t.min![1]).toBeCloseTo(0, 5);
        expect(Math.min(Math.abs(t.min![2]), Math.abs(t.max![2]))).toBeCloseTo(0.665, 4);
      }
    }
  });

  it("carries exactly its own load: nothing on the empty Sqns, a 40 ft Maersk box on the pins, tubes or an empty deck on the Pao", () => {
    const top = (nodes: LeafNode[]) => Math.max(...nodes.map((n) => n.max![1]));
    expect(tree("proc-vehicle-sqns-container-wagon").filter((n) => n.id.startsWith("cargo/"))).toEqual([]);
    const box = tree("proc-vehicle-sqns-container-wagon", { cargo: "maersk" }).filter((n) => n.id.startsWith("cargo/box/"));
    expect(Math.max(...box.map((n) => n.max![0])) - Math.min(...box.map((n) => n.min![0]))).toBeCloseTo(12.192, 3);
    expect(Math.min(...box.map((n) => n.min![1]))).toBeCloseTo(1.303, 3);
    expect(top(box)).toBeCloseTo(1.3 + 2.591 - 0.003, 3);
    // the pins under the box's corner castings: the box ends over the 3.6 and 16.0 m pins
    expect(Math.min(...box.map((n) => n.min![0])) + 9.9).toBeGreaterThan(SQNS_PINS[1]!);
    expect(Math.max(...box.map((n) => n.max![0])) + 9.9).toBeLessThan(SQNS_PINS[5]! + 0.2);
    const tubes = tree("proc-vehicle-pao-flat-wagon").filter((n) => n.id.startsWith("cargo/"));
    expect(top(tubes)).toBeGreaterThan(1.68);
    expect(top(tubes)).toBeLessThanOrEqual(1.75); // the XML `load` hull reaches 1.7 m
    expect(tree("proc-vehicle-pao-flat-wagon", { cargo: "empty" }).filter((n) => n.id.startsWith("cargo/"))).toHaveLength(0);
  });

  it("varies a livery's paint only: each livery builds the same faces in other colours", () => {
    for (const id of ["proc-vehicle-habis-sliding-wall-wagon", "proc-vehicle-faccs-hopper-wagon"]) {
      const [a, b] = paramCombinations(design(id).params).map((p) => design(id).build(p).sourceTree(id, id));
      const shape = (t: typeof a) => leaves(t!.root).filter((n) => !n.id.includes("viamont")).map((n) => [n.id, n.min, n.max]);
      expect(shape(b)).toEqual(shape(a));
      expect(b!.colors).not.toEqual(a!.colors);
    }
    // the Falls liveries share the body; SD and Viamont add the lower panels
    const falls = paramCombinations(FALLS_PARAMS).map((p) => leaves(design("proc-vehicle-falls-hopper-wagon").build(p).sourceTree("f", "f").root).filter((n) => n.id.startsWith("body/upper/") || n.id.startsWith("body/lower/")));
    expect(falls[1]!.map((n) => [n.id, n.min, n.max])).toEqual(falls[0]!.map((n) => [n.id, n.min, n.max]));
    expect(falls[2]!.map((n) => [n.id, n.min, n.max])).toEqual(falls[0]!.map((n) => [n.id, n.min, n.max]));
  });

  it("carry valid UIC running numbers the stroke font can paint, on both sides", () => {
    for (const [key, { number }] of Object.entries(FREIGHT_NUMBERS)) {
      expect(number, key).toMatch(/^\d{2} \d{2} \d{4} \d{3}-\d$/);
      expect(uicCheckDigit(number), `${key} ${number}`).toBe(Number(number.slice(-1)));
      expect(canStroke(number), key).toBe(true);
    }
    expect(canStroke("MAERSK") && canStroke("TRANSWAGGON") && canStroke("VIAMONT") && canStroke("MAV")).toBe(true);
    for (const t of FREIGHT_TRANSFERS) {
      const nodes = leaves(transferBuild(t).sourceTree(t.id, t.title).root).filter((n) => /running-number|number\//.test(n.id));
      const sides = new Set(nodes.map((n) => Math.sign(n.min![2] + n.max![2])));
      expect(sides, t.key).toEqual(new Set([-1, 1]));
    }
  });

  it("reads MAERSK and TRANSWAGGON from outside on both sides", () => {
    for (const [id, params, prefix] of [
      ["proc-vehicle-sqns-container-wagon", { cargo: "maersk" }, (s: string) => `cargo/${s}-side-livery/lettering/`],
      ["proc-vehicle-habis-sliding-wall-wagon", undefined, (s: string) => `body/${s}-side/name-plate/`],
    ] as const) {
      for (const side of ["right", "left"]) {
        const ink = tree(id, params).filter((n) => n.id.startsWith(prefix(side)) && n.material === "ink");
        expect(ink.length, `${id} ${side}`).toBe(1);
        // the letters lie a few millimetres off their face, on the outside
        const z = ink[0]!.min![2];
        expect(Math.sign(z)).toBe(side === "right" ? 1 : -1);
        expect(ink[0]!.max![2]).toBeCloseTo(z, 6);
      }
    }
  });

  it("builds the JT7 clip solid of convex views and refuses a concave one", () => {
    const faces = clipSolidFaces({ section: [[-1, 0], [1, 0], [1, 2], [-1, 2]], elevation: [[0, 0], [4, 0], [4, 2], [0, 2]] });
    expect(faces).toHaveLength(6);
    // an elevation with a chamfered top corner adds one face
    expect(clipSolidFaces({ section: [[-1, 0], [1, 0], [1, 2], [-1, 2]], elevation: [[0, 0], [4, 0], [4, 1.5], [3.5, 2], [0, 2]] })).toHaveLength(7);
    // the Faccs elevation as the XML gives it flares outward: concave
    expect(() => clipSolidFaces({ elevation: [[3.3, 2.1], [2.0, 3.9], [2.1, 4.2], [10.7, 4.2], [10.8, 3.9], [9.5, 2.1], [9.2, 1.2], [3.6, 1.2]] })).toThrow(/not convex/);
  });
});
