// The foreign multiple units from vlakosimdb: the DB 628 (generator/db628.ts),
// the MAV MDmot set (generator/mavMdmot.ts), the ICE 1 (generator/ice1.ts) and
// the TGV (generator/tgv.ts). See docs/models/foreign-units.md.
import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { DB628_BOGIES, DB628_DESIGNS, DB628_PARAMS, DB628_WHEELBASE, db628 } from "../generator/db628";
import { nWagen } from "../generator/dbNWagen";
import { MDMOT_DESIGNS, MDMOT_PARAMS, mavMdmot } from "../generator/mavMdmot";
import { ICE1_DESIGNS, ICE1_PARAMS, ice1 } from "../generator/ice1";
import { TGV_COACH_LENGTH, TGV_DESIGNS, TGV_END_LENGTH, TGV_PARAMS, TGV_POWER_LENGTH, tgv } from "../generator/tgv";
import { tractionCheckDigit, tractionNumber } from "../generator/emuParts";
import { UNIT_TRANSFERS, readUnitLandmarks, unitComparison } from "../generator/unitComparison";
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

const designs = [...DB628_DESIGNS, ...MDMOT_DESIGNS, ...ICE1_DESIGNS, ...TGV_DESIGNS];

describe("the foreign multiple units", () => {
  it("are four parametric rail designs with their reference folders and defaults", () => {
    expect(designs.map((d) => d.id)).toEqual(["proc-vehicle-db-628", "proc-vehicle-mav-mdmot", "proc-vehicle-ice-1", "proc-vehicle-tgv"]);
    for (const d of designs) {
      // DB 628 and MAV MDmot are diesel units, ICE 1 and TGV electric
      const folder = [d.references!].flat()[0]!;
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: /^(db-628|mav-mdmot)$/.test(folder) ? "diesel" : "electric" });
      expect(folder).toMatch(/^(db-628|mav-mdmot|ice-1|tgv)$/);
    }
    // the 628 set's n-Wagen coaches bring their own photographs and native textures
    expect(DB628_DESIGNS[0]!.references).toEqual(["db-628", "db-n-wagen"]);
    const spec = (ps: typeof DB628_PARAMS) => ps.map((p) => [p.name, p.default, p.values.map((v) => v.value)]);
    expect(spec(DB628_PARAMS)).toEqual([
      ["unit", "motorCar", ["motorCar", "bn", "abn", "bdnrf"]],
      ["livery", "mint", ["mint", "red"]],
    ]);
    expect(spec(MDMOT_PARAMS)).toEqual([["unit", "motorCar", ["motorCar", "trailerAx", "trailerBx", "drivingTrailer"]]]);
    expect(spec(ICE1_PARAMS)).toEqual([["unit", "powerCar", ["powerCar", "coach", "restaurant"]]]);
    expect(spec(TGV_PARAMS)).toEqual([
      ["unit", "powerCar", ["powerCar", "set"]],
      ["cars", "1", ["1", "2", "3", "4", "5", "6"]],
      ["livery", "pse", ["pse", "atlantique"]],
    ]);
    // the car count applies to the trailer set only
    expect(TGV_PARAMS[1]!.when).toEqual({ name: "unit", values: ["set"] });
    expect(paramCombinations(TGV_PARAMS)).toHaveLength(2 + 6 * 2);
  });

  for (const d of designs)
    it.each(paramCombinations(d.params).map((c) => [JSON.stringify(c), c] as const))(`${d.id} %s stands on the rail, centred between its coupling faces, inside the envelope and the budget`, (_, combo: ParamValues) => {
      const { stats: s, nodes } = built(d.build(combo), d.id);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
      expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[1]).toBeLessThanOrEqual(6.5);
      // an articulated set is several cars: the budget is per car
      expect(s.triangles).toBeLessThanOrEqual(combo.unit === "set" ? Math.max(16_000, 4_000 * Number(combo.cars)) : 16_000);
      expect(s.triangles).toBeGreaterThan(2_000);
      const fixed = nodes.filter((n) => !n.id.startsWith("roof-equipment/pantographs/") && n.tri[1] > 0);
      expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
    });

  it("DB 628: 22.70 m from the cab's buffers to the short coupling, the 628.2's bogies, both liveries one body", () => {
    const { stats: s, nodes } = built(db628(), "proc-vehicle-db-628");
    expect(s.max[0] - s.min[0]).toBeCloseTo(22.7, 3);
    const body = bounds(nodes, /^body\/[a-z-]*band/);
    expect(body.max[2] - body.min[2]).toBeCloseTo(3.0, 3);
    expect(body.max[1]).toBeCloseTo(3.8, 3);
    const a = axles(nodes);
    expect(a.length).toBe(4);
    expect(a[1]! - a[0]!).toBeCloseTo(DB628_WHEELBASE, 3);
    expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(DB628_BOGIES[1] - DB628_BOGIES[0], 3);
    // the cab (buffers, windscreen) at +X, the short coupler at -X
    expect(bounds(nodes, /^cab\/buffers\//).max[0]).toBeCloseTo(s.max[0], 5);
    expect(bounds(nodes, /^rear-end\/coupler\//).min[0]).toBeCloseTo(s.min[0], 5);
    expect(bounds(nodes, /^cab\/windscreen/).min[0]).toBeGreaterThan(9.5);
    const red = built(db628({ livery: "red" }), "proc-vehicle-db-628");
    expect(red.stats.min).toEqual(s.min);
    expect(red.stats.max).toEqual(s.max);
    const mats = (livery: string) => new Set(db628({ livery }).sourceTree("x", "x").materials);
    expect(mats("mint").has("mint")).toBe(true);
    expect(mats("red").has("mint")).toBe(false);
    expect(mats("red").has("red")).toBe(true);
  });

  it("DB 628: the set's coaches are the n-Wagen in the matching paint (iv with mint, vr with red)", () => {
    for (const unit of ["bn", "abn", "bdnrf"])
      for (const [livery, paint] of [["mint", "iv"], ["red", "vr"]] as const) {
        const glb = db628({ unit, livery }).toGlb("x");
        expect(Buffer.from(glb).equals(Buffer.from(nWagen({ variant: unit, livery: paint }).toGlb("x"))), `${unit} ${livery}`).toBe(true);
      }
    expect(db628({ unit: "abn", livery: "mint" }).sourceTree("x", "x").materials).toContain("mint");
    expect(db628({ unit: "abn", livery: "red" }).sourceTree("x", "x").materials).not.toContain("mint");
  });

  it("DB 628: running numbers with valid check digits", () => {
    expect(tractionNumber("628", "289")).toBe("628 289-1");
    // 628 207-3 is legible on photo-628-207-front-dannenberg-1989.jpg
    expect(tractionNumber("628", "207")).toBe("628 207-3");
    expect(tractionNumber("628", "305")).toBe("628 305-5");
    // the CFL's 628 505-0 / 928 505-7 (de.wikipedia) check the scheme
    expect(tractionCheckDigit("628505")).toBe(0);
    expect(tractionCheckDigit("928505")).toBe(7);
  });

  it("MAV MDmot: the published lengths over buffers, 2.85 m bodies, the bogie spacings", () => {
    const cases = [
      ["motorCar", 15.52, 8.05, 2.4],
      ["trailerAx", 22.4, 15.5, 2.5],
      ["trailerBx", 22.4, 15.5, 2.5],
      ["drivingTrailer", 22.06, 15.5, 2.5],
    ] as const;
    for (const [unit, length, pivots, wb] of cases) {
      const { stats: s, nodes } = built(mavMdmot({ unit }), "proc-vehicle-mav-mdmot");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band/);
      expect(body.max[2] - body.min[2]).toBeCloseTo(2.85, 3);
      const a = axles(nodes);
      expect(a.length).toBe(4);
      expect(a[1]! - a[0]!).toBeCloseTo(wb, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(wb, 3);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(pivots, 3);
      // buffers at both ends
      expect(bounds(nodes, /^buffers\/front\/buffer-/).max[0]).toBeCloseTo(s.max[0], 5);
      expect(bounds(nodes, /^buffers\/rear\/buffer-/).min[0]).toBeCloseTo(s.min[0], 5);
    }
    // the motor car has two cabs, the driving trailer one at +X, the trailers none
    const cabs = (unit: string) => built(mavMdmot({ unit }), "x").nodes.filter((n) => /\/windscreens\//.test(n.id));
    expect(new Set(cabs("motorCar").map((n) => n.id.split("/")[0])).size).toBe(2);
    expect(bounds(cabs("drivingTrailer"), /./).min[0]).toBeGreaterThan(9);
    expect(cabs("trailerAx").length).toBe(0);
    // the Bx's first window is frosted, the Ax's is not
    const frosted = (unit: string) => built(mavMdmot({ unit }), "x").nodes.filter((n) => n.material === "frosted").length;
    expect(frosted("trailerBx")).toBeGreaterThan(0);
    expect(frosted("trailerAx")).toBe(0);
  });

  it("ICE 1: 20.56 m power car with its 11.46 m pivots and one raised pantograph; 26.4 m coaches, the restaurant's 4.3 m roof", () => {
    const p = built(ice1(), "proc-vehicle-ice-1");
    expect(p.stats.max[0] - p.stats.min[0]).toBeCloseTo(20.56, 3);
    const pa = axles(p.nodes);
    expect(pa[1]! - pa[0]!).toBeCloseTo(3.0, 3);
    expect((pa[2]! + pa[3]!) / 2 - (pa[0]! + pa[1]!) / 2).toBeCloseTo(11.46, 3);
    const head = bounds(p.nodes, /^roof-equipment\/pantographs\/pantograph\/head\//);
    expect(head.count).toBeGreaterThan(0);
    expect(head.max[1]).toBeGreaterThan(5.3);
    expect(head.max[0]).toBeLessThan(-4); // over the rear bogie: the nose is at +X
    expect(bounds(p.nodes, /^cab\/windscreen/).min[0]).toBeGreaterThan(7);
    for (const [unit, roof] of [["coach", 3.8], ["restaurant", 4.3]] as const) {
      const { stats: s, nodes } = built(ice1({ unit }), "proc-vehicle-ice-1");
      expect(s.max[0] - s.min[0]).toBeCloseTo(26.4, 3);
      expect(bounds(nodes, /^body\/[a-z-]*band/).max[1]).toBeCloseTo(roof, 3);
      const a = axles(nodes);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(19.0, 3);
      expect(nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/")).length).toBe(0);
    }
    // only the restaurant has the clerestory lights
    expect(built(ice1({ unit: "restaurant" }), "x").nodes.some((n) => /\/clerestory\//.test(n.id))).toBe(true);
    expect(built(ice1({ unit: "coach" }), "x").nodes.some((n) => /\/clerestory\//.test(n.id))).toBe(false);
  });

  it("TGV: published lengths, the power car's 14.0 m pivots and raised pantograph, the livery's roof", () => {
    for (const livery of ["pse", "atlantique"] as const) {
      const { stats: s, nodes } = built(tgv({ livery }), "proc-vehicle-tgv");
      expect(s.max[0] - s.min[0]).toBeCloseTo(TGV_POWER_LENGTH, 3);
      expect(bounds(nodes, /^body\/[a-z-]*band/).max[1]).toBeCloseTo(4.1, 3);
      expect(bounds(nodes, /^body\/[a-z-]*band/).max[2] * 2).toBeCloseTo(2.814, 3);
      const a = axles(nodes);
      expect(a[1]! - a[0]!).toBeCloseTo(3.0, 3);
      expect(((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2) / (TGV_POWER_LENGTH / 21.9)).toBeCloseTo(14.0, 3);
      const head = bounds(nodes, /^roof-equipment\/pantographs\/pantograph\/head\//);
      expect(head.max[0]).toBeLessThan(-6);
      expect(head.max[1]).toBeGreaterThan(5.0);
    }
    // the Atlantique's raised roof runs further back: more of its roof is high
    const high = (livery: string) => {
      const n = built(tgv({ livery }), "x").nodes.filter((x) => /^body\/roof-band/.test(x.id) && x.max![1] > 4.05);
      return Math.min(...n.map((x) => x.min![0]));
    };
    expect(high("atlantique")).toBeLessThan(high("pse") - 1.5);
    for (const cars of [1, 2, 3, 6]) {
      const { stats: s, nodes } = built(tgv({ unit: "set", cars: String(cars) }), "proc-vehicle-tgv");
      const length = cars === 1 ? TGV_END_LENGTH : 2 * TGV_END_LENGTH + (cars - 2) * TGV_COACH_LENGTH;
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const band = bounds(nodes, /(^|\/)body\/[a-z-]*band/);
      expect(band.max[2] * 2).toBeCloseTo(2.904, 3);
      expect(band.max[1]).toBeLessThanOrEqual(3.9);
    }
  });

  it("TGV: the trailer set rides on Jacobs bogies under its joints, each carrying the cars either side", () => {
    for (const cars of [2, 3, 6]) {
      const m = tgv({ unit: "set", cars: String(cars), livery: "atlantique" });
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(cars);
      expect(rig.joints).toHaveLength(cars - 1);
      const supports = [...rig.supports!].sort((a, b) => b.x - a.x);
      // the end coaches' own bogies at the ends, a Jacobs bogie under every joint
      expect(supports).toHaveLength(cars + 1);
      expect(supports.every((p) => p.node && p.axles === 2)).toBe(true);
      expect(supports[0]!.sections).toEqual([0]);
      expect(supports[cars]!.sections).toEqual([cars - 1]);
      for (let k = 1; k < cars; k++) {
        expect(supports[k]!.sections).toEqual([k - 1, k]);
        // the hinge is the Jacobs bogie's centre, on the joint plane
        expect(rig.sections![k]!.pivot[0]).toBeCloseTo(supports[k]!.x, 3);
      }
      const length = 2 * TGV_END_LENGTH + (cars - 2) * TGV_COACH_LENGTH;
      expect(supports[1]!.x).toBeCloseTo(length / 2 - TGV_END_LENGTH, 3);
      // a Jacobs bogie is a 3.0 m bogie centred on its joint
      const a = axles(leaves(m.sourceTree("x", "x").root));
      expect(a).toHaveLength(2 * (cars + 1));
      expect(a.some((x) => Math.abs(x - (supports[1]!.x - 1.5)) < 1e-3)).toBe(true);
      expect(a.some((x) => Math.abs(x - (supports[1]!.x + 1.5)) < 1e-3)).toBe(true);
    }
    // the set's last end coach is the first one turned: its coupler at -X
    const set = built(tgv({ unit: "set", cars: "3" }), "proc-vehicle-tgv");
    expect(bounds(set.nodes, /^section2\/car-3\/front-end\/coupler\//).min[0]).toBeCloseTo(set.stats.min[0], 2);
    expect(bounds(set.nodes, /^section0\/car-1\/front-end\/coupler\//).max[0]).toBeCloseTo(set.stats.max[0], 2);
  });

  it("TGV: a one-car set is an end coach on its own bogie at each end, coupled at both", () => {
    const one = tgv({ unit: "set", cars: "1" });
    const rig = one.rig!;
    expect(rig.sections).toBeUndefined();
    expect(rig.supports!.map((p) => [p.axles, p.sections])).toEqual([[2, [0]], [2, [0]]]);
    expect(rig.supports![0]!.x).toBeCloseTo(-rig.supports![1]!.x, 3);
    const b = built(one, "proc-vehicle-tgv");
    expect(bounds(b.nodes, /^front-end\/coupler\//).max[0]).toBeCloseTo(b.stats.max[0], 2);
    expect(bounds(b.nodes, /^rear-end\/coupler\//).min[0]).toBeCloseTo(b.stats.min[0], 2);
  });

  it.each(UNIT_TRANSFERS.map((t) => [t.key] as const))("%s matches its native BMP landmarks within their pixel tolerances once the documented scales are undone", (key) => {
    const t = UNIT_TRANSFERS.find((x) => x.key === key)!;
    const rows = unitComparison(key, true);
    expect(rows.length).toBe(readUnitLandmarks(t).length);
    expect(rows.length).toBeGreaterThanOrEqual(10);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows) {
      // a box held to a published dimension or a photograph says so, and stays near its pixels
      const limit = (r as { constraint?: string }).constraint ? 8 : r.tolerancePixels;
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(limit);
    }
  });
});
