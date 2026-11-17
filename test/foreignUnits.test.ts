// The foreign multiple units from vlakosimdb: the DB 628 (generator/db628.ts),
// the MAV MDmot set (generator/mavMdmot.ts), the ICE 1 (generator/ice1.ts) and
// the TGV (generator/tgv.ts). See docs/models/foreign-units.md.
import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { DB628_BOGIES, DB628_DESIGNS, DB628_PARAMS, DB628_WHEELBASE, db628 } from "../generator/db628";
import { nWagen } from "../generator/dbNWagen";
import { MDMOT_DESIGNS, MDMOT_PARAMS, mavMdmot } from "../generator/mavMdmot";
import { ICE1_DESIGNS, ICE1_PARAMS, ice1 } from "../generator/ice1";
import { TGV_COACH_LENGTH, TGV_DESIGNS, TGV_END_LENGTH, TGV_LOD, TGV_PARAMS, TGV_POWER_LENGTH, tgv, tgvLod, tgvTrain } from "../generator/tgv";
import { tractionCheckDigit, tractionNumber } from "../generator/emuParts";
import { UNIT_TRANSFERS, readUnitLandmarks, unitComparison } from "../generator/unitComparison";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";
import { sample } from "./catalogCache";

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
      ["unit", "motorCar", ["motorCar", "bn", "abn", "bdnrf", "train"]],
      ["livery", "mint", ["mint", "red"]],
    ]);
    expect(spec(MDMOT_PARAMS)).toEqual([
      ["unit", "motorCar", ["motorCar", "trailerAx", "trailerBx", "drivingTrailer", "train"]],
      ["cars", "4", ["2", "3", "4", "5", "6", "7", "8"]],
    ]);
    expect(spec(ICE1_PARAMS)).toEqual([["unit", "powerCar", ["powerCar", "coach", "restaurant", "train"]], ["cars", "4", ["3", "4", "5", "6", "7", "8"]]]);
    expect(ICE1_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
    expect(spec(TGV_PARAMS)).toEqual([
      ["unit", "powerCar", ["powerCar", "set", "train"]],
      ["cars", "1", ["1", "2", "3", "4", "5", "6"]],
      ["trainCars", "4", ["3", "4", "5", "6", "7", "8"]],
      ["livery", "pse", ["pse", "atlantique"]],
    ]);
    // the set's car count applies to the trailer set only (a saved { unit: "set" } stays one car);
    // the full train's length, every vehicle counted, is a parameter of its own
    expect(TGV_PARAMS[1]!.when).toEqual({ name: "unit", values: ["set"] });
    expect(TGV_PARAMS[2]!.when).toEqual({ name: "unit", values: ["train"] });
    expect(paramCombinations(TGV_PARAMS)).toHaveLength(2 + 6 * 2 + 6 * 2);
  });

  for (const d of designs)
    it.each(sample(paramCombinations(d.params)).map((c) => [JSON.stringify(c), c] as const))(`${d.id} %s stands on the rail, centred between its coupling faces, inside the envelope and the budget`, (_, combo: ParamValues) => {
      const { stats: s, nodes } = built(d.build(combo), d.id);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
      expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[1]).toBeLessThanOrEqual(6.5);
      // an articulated set is several cars: the budget is per car
      expect(s.triangles).toBeLessThanOrEqual(combo.unit === "set" ? Math.max(16_000, 4_000 * Number(combo.cars)) : combo.unit === "train" ? 16_000 * Number(combo.trainCars ?? combo.cars ?? 2) : 16_000);
      expect(s.triangles).toBeGreaterThan(2_000);
      const fixed = nodes.filter((n) => !/(^|\/)roof-equipment\/pantographs\//.test(n.id) && n.tri[1] > 0);
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

  it("TGV: the full train is power car, trailer set and power car turned, 3 .. 8 vehicles", () => {
    const kinds = (n: number) => tgvTrain(n).map((s) => `${s.kind}${s.turned ? "*" : ""}`);
    expect(kinds(3)).toEqual(["powerCar", "endCoach", "powerCar*"]);
    expect(kinds(4)).toEqual(["powerCar", "endCoach", "endCoach*", "powerCar*"]);
    expect(kinds(8)).toEqual(["powerCar", "endCoach", "coach", "coach", "coach", "coach", "endCoach*", "powerCar*"]);
    for (let n = 3; n <= 8; n++) {
      const slots = tgvTrain(n);
      expect(slots).toHaveLength(n);
      // end to end, centred on x = 0
      for (let k = 1; k < n; k++) expect(slots[k]!.hi).toBeCloseTo(slots[k - 1]!.lo, 9);
      expect(slots[0]!.hi).toBeCloseTo(-slots[n - 1]!.lo, 9);
      const length = 2 * TGV_POWER_LENGTH + (n === 3 ? TGV_END_LENGTH : 2 * TGV_END_LENGTH + (n - 4) * TGV_COACH_LENGTH);
      expect(slots[0]!.hi - slots[n - 1]!.lo).toBeCloseTo(length, 9);
    }
    expect(() => tgvTrain(2)).toThrow();
    expect(() => tgvTrain(9)).toThrow();
  });

  it("TGV: the full train is one articulated vehicle: a section per vehicle, a bellows per gap, every bogie a support", () => {
    for (const n of [3, 4, 6, 8]) {
      const m = tgv({ unit: "train", trainCars: String(n), livery: n === 6 ? "atlantique" : "pse" });
      const rig = m.rig!;
      const slots = tgvTrain(n);
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      // hinged on the coupling plane or the Jacobs joint ahead of each car
      for (let k = 1; k < n; k++) expect(rig.sections![k]!.pivot[0]).toBeCloseTo(slots[k - 1]!.lo, 3);
      const supports = [...rig.supports!].sort((a, b) => b.x - a.x);
      // two bogies a power car; the end coaches' own bogies; a Jacobs bogie under each joint inside the set
      const trailers = n - 2;
      expect(supports).toHaveLength(4 + (trailers === 1 ? 2 : trailers + 1));
      expect(supports.every((p) => p.axles === 2)).toBe(true);
      expect(supports.slice(0, 2).map((p) => p.sections)).toEqual([[0], [0]]);
      expect(supports.slice(-2).map((p) => p.sections)).toEqual([[n - 1], [n - 1]]);
      expect(supports.filter((p) => p.sections!.length === 2)).toHaveLength(trailers === 1 ? 0 : trailers - 1);
      const { stats: s, nodes } = built(m, "proc-vehicle-tgv");
      expect(s.max[0] - s.min[0]).toBeCloseTo(slots[0]!.hi - slots[n - 1]!.lo, 2);
      expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
      expect(s.triangles).toBeLessThanOrEqual(16_000 * n);
      // the rear power car is turned: both noses (their windscreens) at the train's ends
      const screens = nodes.filter((x) => /\/cab\/windscreen\//.test(x.id) && x.tri[1] > 0);
      expect(Math.max(...screens.map((x) => x.max![0]))).toBeGreaterThan(s.max[0] - 4);
      expect(Math.min(...screens.map((x) => x.min![0]))).toBeLessThan(s.min[0] + 4);
      // the end coaches' gangways stay under the train's bellows; their couplers stay
      expect(nodes.some((x) => /\/gangway\//.test(x.id))).toBe(false);
      expect(nodes.filter((x) => /car-2\/front-end\/coupler\//.test(x.id)).length).toBeGreaterThan(0);
    }
  });

  it("TGV: the full train's bytes are deterministic and its lone cars unchanged by it", () => {
    const a = tgv({ unit: "train", trainCars: "5" }).toGlb("x");
    const b = tgv({ unit: "train", trainCars: "5" }).toGlb("x");
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    // the default train is four vehicles
    expect(Buffer.from(tgv({ unit: "train" }).toGlb("x")).equals(Buffer.from(tgv({ unit: "train", trainCars: "4" }).toGlb("x")))).toBe(true);
  });

  it("TGV: the full train's distant model keeps its sections and joints within 100 triangles a vehicle", () => {
    for (let n = 3; n <= 8; n++) {
      const full = tgv({ unit: "train", trainCars: String(n) }).rig!;
      const low = tgvLod({ unit: "train", trainCars: String(n) });
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(TGV_LOD, 100 * n));
      expect(low.rig!.sections!.map((x) => x.pivot)).toEqual(full.sections!.map((x) => x.pivot));
      expect(low.rig!.joints!.map((j) => j.sections)).toEqual(full.joints!.map((j) => j.sections));
    }
  });

  it("TGV: every train length states its game figures in both liveries", () => {
    const game = TGV_DESIGNS[0]!.game!;
    for (const livery of [undefined, "atlantique"])
      for (let n = 3; n <= 8; n++) {
        const params = { ...(livery ? { livery } : {}), ...(n === 4 ? {} : { trainCars: String(n) }), unit: "train" };
        const v = game.variants!.find((x) => JSON.stringify(x.params) === JSON.stringify(params));
        expect(v, JSON.stringify(params)).toBeDefined();
        expect(v!.power).toBe(2 * game.power!);
      }
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
