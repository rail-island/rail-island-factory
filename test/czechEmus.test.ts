// The Czech electric units: the CD 471 CityElefant set (generator/emu471.ts) and
// the CD 680 Pendolino (generator/emu680.ts). See docs/models/czech-emus.md.
import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { cd471, CD471_PARAMS, EMU471_DESIGNS, elefantNumber, K_Y } from "../generator/emu471";
import { cd680, CD680_PARAMS, EMU680_DESIGNS } from "../generator/emu680";
import { tractionCheckDigit } from "../generator/emuParts";
import { EMU_TRANSFERS, emuComparison, readEmuLandmarks } from "../generator/emuComparison";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";
import { sample } from "./catalogCache";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

function built(mesh: MeshBuilder, id: string) {
  const glb = mesh.toGlb(id);
  return { stats: glbStats(glb), nodes: leaves(mesh.sourceTree(id, id).root) };
}

/** The x centre of every wheelset's axle (its first sweep), ascending. */
function axles(nodes: LeafNode[]): number[] {
  return nodes
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 1000) / 1000)
    .sort((a, b) => a - b);
}

const bounds = (nodes: LeafNode[], pattern: RegExp) => {
  const ns = nodes.filter((n) => pattern.test(n.id));
  return { min: [0, 1, 2].map((k) => Math.min(...ns.map((n) => n.min![k]!))), max: [0, 1, 2].map((k) => Math.max(...ns.map((n) => n.max![k]!))), count: ns.length };
};

describe("the Czech electric units", () => {
  const designs = [...EMU471_DESIGNS, ...EMU680_DESIGNS];

  it("are two parametric rail designs with their reference folders", () => {
    expect(designs.map((d) => d.id)).toEqual(["proc-vehicle-cd-471", "proc-vehicle-cd-680"]);
    for (const d of designs) {
      expect(d.catalog).toMatchObject({ category: "Rail vehicles" });
      expect(d.references).toMatch(/^cd-(471|680)$/);
    }
    expect(CD471_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "motorCar", ["motorCar", "trailer", "drivingTrailer"]],
      ["variant", "cd471", ["cd471", "cd675"]],
    ]);
    expect(CD680_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["unit", "endCar", ["endCar", "car683", "car685", "car686"]]]);
  });

  for (const d of designs)
    it.each(sample(paramCombinations(d.params)).map((c) => [JSON.stringify(c), c] as const))(`${d.id} %s stands on the rail, centred, inside the envelope and the budget`, (_, combo: ParamValues) => {
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

  it("CD 471: 26.05 m cab cars and a 25.7 m trailer over their couplers, 4.635 m high, 2.82 m wide", () => {
    for (const [unit, length] of [["motorCar", 26.05], ["trailer", 25.7], ["drivingTrailer", 26.05]] as const) {
      const { stats: s, nodes } = built(cd471({ unit }), "proc-vehicle-cd-471");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band/);
      expect(body.max[1]).toBeCloseTo(4.635, 3);
      expect(body.max[2] - body.min[2]).toBeCloseTo(2.82, 3);
      // the bogie pivots 19.0 m apart (published), the motor bogies' wheelbase 2.6 m, the trailers' 2.4 m
      const a = axles(nodes);
      expect(a.length).toBe(4);
      const wb = unit === "motorCar" ? 2.6 : 2.4;
      expect(a[1]! - a[0]!).toBeCloseTo(wb, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(wb, 3);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(19.0, 3);
    }
  });

  it("CD 471: the low floor between the bogies drops to 0.2 m (scaled), the ends stay at 0.9 m", () => {
    const { nodes } = built(cd471(), "proc-vehicle-cd-471");
    // the low floor's skirt: swept whole, or wall by wall where the cabin behind the doorways stands (docs/models/interiors.md)
    const skirt = bounds(nodes, /^body\/skirtdark-band\/(sweep|facets)-/);
    expect(skirt.min[1]).toBeCloseTo(0.2 * K_Y, 3);
    // the drop spans the XML's 14.9 m between the slopes (body 5.0 .. 19.9 m)
    expect(skirt.max[0] - skirt.min[0]).toBeCloseTo(14.9, 2);
    // both decks have windows: upper above 3.3 m, lower below 2.1 m
    const upper = bounds(nodes, /^body\/right-side\/upper-windows\/window-\d+\/glass/);
    const lower = bounds(nodes, /^body\/right-side\/lower-windows\/window-\d+\/glass/);
    expect(upper.min[1]).toBeGreaterThan(3.3);
    expect(lower.max[1]).toBeLessThan(2.1);
    expect(lower.min[1]).toBeGreaterThan(1.0);
  });

  it("CD 471: only the motor car has a pantograph, raised over the inner bogie; the cabs face +X", () => {
    for (const unit of ["motorCar", "trailer", "drivingTrailer"] as const) {
      const { stats: s, nodes } = built(cd471({ unit }), "proc-vehicle-cd-471");
      const panto = nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
      if (unit === "motorCar") {
        const head = bounds(nodes, /^roof-equipment\/pantographs\/pantograph\/head\//);
        expect(head.max[1]).toBeGreaterThan(5.5);
        expect(head.max[0]).toBeLessThan(-8); // over the inner (-X) bogie
      } else expect(panto.length).toBe(0);
      const coupler = bounds(nodes, /^cab\/coupler\//);
      if (unit === "trailer") expect(coupler.count).toBe(0);
      else expect(coupler.max[0]).toBeCloseTo(s.max[0], 5);
    }
  });

  it("CD 471 and the vlakosimdb CD 675 share one body: same bounds, different paint and numbers", () => {
    for (const unit of ["motorCar", "trailer", "drivingTrailer"] as const) {
      const a = built(cd471({ unit, variant: "cd471" }), "a").stats;
      const b = built(cd471({ unit, variant: "cd675" }), "b").stats;
      expect(b.min).toEqual(a.min);
      expect(b.max).toEqual(a.max);
    }
    const mats = (v: string) => new Set(cd471({ variant: v }).sourceTree("x", "x").materials);
    expect(mats("cd471").has("blue")).toBe(true);
    expect(mats("cd675").has("blue")).toBe(false);
    expect(mats("cd675").has("red")).toBe(true);
  });

  it("carries valid running numbers", () => {
    expect(elefantNumber("cd471", "motorCar")).toBe("471 014-1");
    expect(elefantNumber("cd471", "trailer")).toBe("071 014-5");
    expect(elefantNumber("cd471", "drivingTrailer")).toBe("971 014-6");
    expect(elefantNumber("cd675", "motorCar")).toBe("675 001-2");
    expect(tractionCheckDigit("163244")).toBe(7);
    expect(tractionCheckDigit("150222")).toBe(8);
  });

  it("CD 680: 27.7 m end car and 25.9 m intermediate cars, 2.8 m wide, the tapered tilting body", () => {
    for (const [unit, length] of [["endCar", 27.7], ["car683", 25.9], ["car685", 25.9], ["car686", 25.9]] as const) {
      const { stats: s, nodes } = built(cd680({ unit }), "proc-vehicle-cd-680");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band/);
      expect(body.max[2] - body.min[2]).toBeCloseTo(2.8, 3);
      // the tumblehome starts at the window band (1.9 m), where the body is widest: 1.5 * 2.8 / 3
      const band = bounds(nodes, /^body\/band-band/);
      expect(band.max[2]).toBeCloseTo((1.5 * 2.8) / 3, 3);
      const roof = bounds(nodes, /^body\/dark-band/);
      expect(roof.max[1]).toBeCloseTo(3.6, 3);
      // wheelsets 2.7 m apart on each bogie
      const a = axles(nodes);
      expect(a.length).toBe(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.7, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(2.7, 3);
      const panto = nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
      expect(panto.length > 0).toBe(unit === "endCar" || unit === "car685");
    }
    // the 683 has its kitchen section: fewer windows than the 686
    const windows = (unit: string) => built(cd680({ unit }), "x").nodes.filter((n) => /^body\/right-side\/windows\/window-\d+\//.test(n.id)).length;
    expect(windows("car683")).toBeLessThan(windows("car686"));
  });

  it.each(EMU_TRANSFERS.map((t) => [t.key] as const))("%s matches its native BMP landmarks within their pixel tolerances once the documented scales are undone", (key) => {
    const t = EMU_TRANSFERS.find((x) => x.key === key)!;
    const rows = emuComparison(key, true);
    expect(rows.length).toBe(readEmuLandmarks(t).length);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });
});
