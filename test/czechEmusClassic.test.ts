// The older Czech electric units: the CD 451 (generator/emu451.ts), the CD 460
// (generator/emu460.ts) and the CD 470 double-deck prototype (generator/emu470.ts).
// See docs/models/czech-emus-classic.md.
import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { cd451, CD451_PARAMS, EMU451_DESIGNS, K_X as K_X_451, length451, NUMBERS_451 } from "../generator/emu451";
import { cd460, CD460_PARAMS, CARS_460, EMU460_DESIGNS, length460, number460, raised460 } from "../generator/emu460";
import { cd470, CD470_PARAMS, EMU470_DESIGNS, K_X as K_X_470, length470, NUMBERS_470 } from "../generator/emu470";
import { tractionCheckDigit } from "../generator/emuParts";
import { emuComparison, EMU_TRANSFERS } from "../generator/emuComparison";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

function built(mesh: MeshBuilder, id: string) {
  return { stats: glbStats(mesh.toGlb(id)), nodes: leaves(mesh.sourceTree(id, id).root) };
}

/** The x centre of every wheelset's axle (its first sweep), ascending. */
function axles(nodes: LeafNode[]): number[] {
  return nodes
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 1000) / 1000)
    .sort((a, b) => a - b);
}

const bounds = (nodes: LeafNode[], pattern: RegExp) => {
  const ns = nodes.filter((n) => pattern.test(n.id) && n.tri[1] > 0);
  return { min: [0, 1, 2].map((k) => Math.min(...ns.map((n) => n.min![k]!))), max: [0, 1, 2].map((k) => Math.max(...ns.map((n) => n.max![k]!))), count: ns.length };
};

/** Each pantograph's collector head: its x and its top. */
function heads(nodes: LeafNode[]): Array<{ x: number; top: number }> {
  const names = [...new Set(nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/")).map((n) => n.id.split("/")[2]!))];
  return names.map((name) => {
    const b = bounds(nodes, new RegExp(`^roof-equipment/pantographs/${name}/head/`));
    return { x: (b.min[0]! + b.max[0]!) / 2, top: b.max[1]! };
  });
}

const DESIGNS = [...EMU451_DESIGNS, ...EMU460_DESIGNS, ...EMU470_DESIGNS];

describe("the older Czech electric units", () => {
  it("are three parametric rail designs with their reference folders", () => {
    expect(DESIGNS.map((d) => d.id)).toEqual(["proc-vehicle-cd-451", "proc-vehicle-cd-460", "proc-vehicle-cd-470"]);
    for (const d of DESIGNS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "electric" });
    expect(DESIGNS.map((d) => d.references)).toEqual(["cd-451", "cd-460", "cd-470"]);
    expect(CD451_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["unit", "motorCar", ["motorCar", "trailer"]]]);
    expect(CD460_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "motorCar", ["motorCar", "trailer"]],
      ["livery", "cd", ["cd", "cd003", "cd007", "csd"]],
    ]);
    expect(CD470_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["unit", "motorCar", ["motorCar", "trailer"]]]);
  });

  for (const d of DESIGNS)
    it.each(paramCombinations(d.params).map((c) => [JSON.stringify(c), c] as const))(`${d.id} %s stands on the rail, centred, inside the envelope and the budget`, (_, combo: ParamValues) => {
      const { stats: s, nodes } = built(d.build(combo), d.id);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
      expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[1]).toBeLessThanOrEqual(6.5);
      expect(s.triangles).toBeLessThanOrEqual(16_000);
      expect(s.triangles).toBeGreaterThan(4_000);
      const fixed = nodes.filter((n) => !n.id.startsWith("roof-equipment/pantographs/") && n.tri[1] > 0);
      expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
    });

  it("CD 451: the four-car set is the published 95.29 m over the couplers; low floor, bogies and the roof", () => {
    expect(2 * length451("motorCar") + 2 * length451("trailer")).toBeCloseTo(95.29, 3);
    for (const unit of ["motorCar", "trailer"] as const) {
      const { stats: s, nodes } = built(cd451({ unit }), "proc-vehicle-cd-451");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length451(unit), 3);
      const body = bounds(nodes, /^body\/[a-z-]*band\//);
      expect(body.max[2] - body.min[2]).toBeCloseTo(3.0, 3);
      // the motor car's roof at 3.8 m (XML), the trailer's at 3.9 m
      expect(body.max[1]).toBeCloseTo(unit === "motorCar" ? 3.8 : 3.9, 3);
      // the low floor between the bogies: 0.4 m under the motor car, 0.2 m under the trailer
      expect(body.min[1]).toBeCloseTo(unit === "motorCar" ? 0.4 : 0.2, 3);
      const a = axles(nodes);
      expect(a.length).toBe(4);
      const wb = unit === "motorCar" ? 2.5 : 2.4;
      expect(a[1]! - a[0]!).toBeCloseTo(wb, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(wb, 3);
      // the XML's bogie centres (4.4 and 22.6 m; 2.4 and 22.1 m), scaled with the length
      const pivots = (a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2;
      expect(pivots).toBeCloseTo((unit === "motorCar" ? 18.2 : 19.7) * K_X_451, 3);
    }
  });

  it("CD 451: the motor car has one raised diamond pantograph over its inner bogie, the cab and coupler at +X", () => {
    const { stats: s, nodes } = built(cd451(), "proc-vehicle-cd-451");
    const h = heads(nodes);
    expect(h.length).toBe(1);
    expect(h[0]!.top).toBeGreaterThan(5.5);
    expect(h[0]!.x).toBeLessThan(-8);
    expect(bounds(nodes, /^cab\/coupler\//).max[0]).toBeCloseTo(s.max[0], 3);
    // the lamp pods stand forward of the nose's corners
    expect(bounds(nodes, /^cab\/lamp-pods\/right\//).max[0]).toBeGreaterThan(bounds(nodes, /^body\/nose\/light-band\//).max[0] - 0.4);
    expect(heads(built(cd451({ unit: "trailer" }), "t").nodes).length).toBe(0);
  });

  it("CD 460: five 24.5 m cars make the published 122.5 m set; the cab's windscreen leans forward over the lower front", () => {
    expect(2 * length460("motorCar") + 3 * length460("trailer")).toBeCloseTo(122.5, 3);
    const { stats: s, nodes } = built(cd460(), "proc-vehicle-cd-460");
    expect(s.max[0] - s.min[0]).toBeCloseTo(24.5, 3);
    const body = bounds(nodes, /^body\/[a-z-]*band\//);
    expect(body.max[1]).toBeCloseTo(4.0, 3);
    expect(body.max[2] - body.min[2]).toBeCloseTo(3.0, 3);
    // the cab's upper face stands 0.3 m further forward at 3.6 m than at 1.8 m, over the lower front
    const cab = bounds(nodes, /^body\/cab\//);
    const lower = bounds(nodes, /^body\/lower-front\//);
    expect(cab.max[0] - lower.max[0]).toBeCloseTo(0.1, 3);
    // buffers at the cab, 1.75 m apart
    const right = bounds(nodes, /^cab\/buffers\/buffers\/right\/head\//);
    const left = bounds(nodes, /^cab\/buffers\/buffers\/left\/head\//);
    expect((right.min[2]! + right.max[2]!) / 2 - (left.min[2]! + left.max[2]!) / 2).toBeCloseTo(1.75, 3);
    expect(right.max[0]).toBeCloseTo(s.max[0], 3);
    // the trailer's centre door well drops to 0.3 m
    expect(bounds(built(cd460({ unit: "trailer" }), "t").nodes, /^body\/[a-z-]*band\//).min[1]).toBeCloseTo(0.3, 3);
  });

  it("CD 460: the motor car has two pantographs, exactly one raised: the inner one, or the cab one on 460 007", () => {
    for (const livery of ["cd", "cd003", "cd007", "csd"] as const) {
      const h = heads(built(cd460({ livery }), "proc-vehicle-cd-460").nodes);
      expect(h.length).toBe(2);
      const up = h.filter((p) => p.top > 5.5);
      expect(up.length).toBe(1);
      expect(h.filter((p) => p.top < 4.8).length).toBe(1);
      expect(Math.sign(up[0]!.x)).toBe(raised460(livery) === "rear" ? -1 : 1);
      expect(heads(built(cd460({ unit: "trailer", livery }), "t").nodes).length).toBe(0);
    }
  });

  it("CD 460: the liveries share one body and repaint it", () => {
    for (const unit of ["motorCar", "trailer"] as const) {
      const body = (livery: string) => bounds(built(cd460({ unit, livery }), "x").nodes, /^body\//);
      for (const livery of ["cd003", "cd007", "csd"]) {
        expect(body(livery).min).toEqual(body("cd").min);
        expect(body(livery).max).toEqual(body("cd").max);
      }
    }
    const colour = (livery: string) => {
      const tree = cd460({ livery }).sourceTree("x", "x");
      return tree.colors[tree.materials.indexOf("band")];
    };
    expect(colour("cd")).toBe("#7195ea");
    expect(colour("csd")).toBe("#2b5238");
    expect(CARS_460.length).toBe(8);
  });

  it("CD 470: 26.4 m cars make the published 132 m set; the double-deck trailer reaches 4.7 m with two rows of windows", () => {
    expect(2 * length470("motorCar") + 3 * length470("trailer")).toBeCloseTo(132, 3);
    for (const unit of ["motorCar", "trailer"] as const) {
      const { stats: s, nodes } = built(cd470({ unit }), "proc-vehicle-cd-470");
      expect(s.max[0] - s.min[0]).toBeCloseTo(26.4, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band\//);
      expect(body.max[1]).toBeCloseTo(unit === "motorCar" ? 4.1 : 4.7, 3);
      expect(body.min[1]).toBeCloseTo(0.3, 3);
      const a = axles(nodes);
      expect(a.length).toBe(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.4, 3);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo((unit === "motorCar" ? 17.4 : 18.4) * K_X_470, 2);
      // rectangular buffers at both ends of every car
      expect(nodes.filter((n) => /buffers\/(left|right)\/head\//.test(n.id)).length).toBe(4);
    }
    const trailer = built(cd470({ unit: "trailer" }), "t").nodes;
    expect(bounds(trailer, /^body\/right-side\/upper-windows\/window-\d+\/glass/).min[1]).toBeGreaterThan(3.3);
    expect(bounds(trailer, /^body\/right-side\/lower-windows\/window-\d+\/glass/).max[1]).toBeLessThan(2.4);
  });

  it("CD 470: the motor car's rear pantograph is raised, the cab one folded; the inner end rises to the trailer's roof", () => {
    const { nodes } = built(cd470(), "proc-vehicle-cd-470");
    const h = heads(nodes).sort((p, q) => p.x - q.x);
    expect(h.length).toBe(2);
    expect(h[0]!.top).toBeGreaterThan(5.5);
    expect(h[1]!.top).toBeLessThan(4.8);
    const raised = bounds(nodes, /^roof-equipment\/raised-roof\//);
    expect(raised.max[1]).toBeCloseTo(4.7, 3);
    expect(raised.min[0]).toBeLessThan(-10);
  });

  it("carry valid running numbers", () => {
    expect(NUMBERS_451).toEqual({ motorCar: "451 032-7", trailer: "051 032-1" });
    expect(number460("cd", "motorCar")).toBe("460 071-4");
    expect(number460("cd003", "motorCar")).toBe("460 003-7");
    expect(number460("cd007", "motorCar")).toBe("460 007-8");
    expect(number460("csd", "motorCar")).toBe("460 045-8");
    expect(number460("cd", "trailer")).toBe(`063 071-${tractionCheckDigit("063071")}`);
    expect(NUMBERS_470.motorCar).toBe("470 001-9");
  });

  it.each(["cd_451", "cd_460", "cd_470"])("%s: the default car's measured boxes keep their native positions", (key) => {
    expect(EMU_TRANSFERS.some((t) => t.key === key)).toBe(true);
    const rows = emuComparison(key, true);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    // a few landmarks: the doors, a window and the front, each within a pixel of its native box
    for (const id of ["S05", "S11", "F01", "R01"].filter((x) => rows.some((r) => r.id === x))) {
      const r = rows.find((x) => x.id === id)!;
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${key} ${id} ${r.element} ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
    }
  });
});
