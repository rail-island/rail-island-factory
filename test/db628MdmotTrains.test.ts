// The full trains of the DB 628 (generator/db628.ts) and the MAV MDmot
// (generator/mavMdmot.ts): formations, the articulated rig, lengths, budgets,
// determinism and the distant models. See docs/models/foreign-units.md.
import { describe, expect, it } from "vitest";
import { DB628_DESIGNS, DB628_LENGTH, DB628_MAX_CARS, DB628_MIN_CARS, db628, db628Train } from "../generator/db628";
import { MDMOT_DESIGNS, MDMOT_MAX_CARS, MDMOT_MIN_CARS, mavMdmot, mdmotLength, mdmotTrain } from "../generator/mavMdmot";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const DB_SIZES = range(DB628_MIN_CARS, DB628_MAX_CARS);
const MD_SIZES = range(MDMOT_MIN_CARS, MDMOT_MAX_CARS);

/** The model x of the leaves whose id matches, as [min, max]. */
function span(m: MeshBuilder, pattern: RegExp): [number, number] {
  const ns = leaves(m.sourceTree("x", "x").root).filter((n) => pattern.test(n.id) && n.tri[1] > 0);
  return [Math.min(...ns.map((n) => n.min![0])), Math.max(...ns.map((n) => n.max![0]))];
}

/** The rig checks every train shares: a section per car hinged on its coupling plane, a joint between two, two own bogies a car. */
function expectTrainRig(m: MeshBuilder, slots: ReadonlyArray<{ lo: number }>): void {
  const n = slots.length;
  const rig = m.rig!;
  expect(rig.sections).toHaveLength(n);
  expect(rig.joints).toHaveLength(n - 1);
  rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
  rig.joints!.forEach((j, i) => {
    expect(j.sections).toEqual([i, i + 1]);
    expect(j.front).toBeGreaterThan(slots[i]!.lo);
    expect(j.rear).toBeLessThan(slots[i]!.lo);
  });
  expect(rig.supports).toHaveLength(2 * n);
  for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
}

describe("the DB 628 full train", () => {
  it("pairs the cars into 628 units, the second of each turned; an odd train ends in a turned car", () => {
    expect(db628Train(2).map((s) => s.turned)).toEqual([false, true]);
    expect(db628Train(3).map((s) => s.turned)).toEqual([false, true, true]);
    expect(db628Train(4).map((s) => s.turned)).toEqual([false, true, false, true]);
    expect(db628Train(5).map((s) => s.turned)).toEqual([false, true, false, true, true]);
    for (const n of DB_SIZES) {
      const slots = db628Train(n);
      expect(slots).toHaveLength(n);
      expect(slots.every((s) => s.car === "motorCar")).toBe(true);
      // the train ends in a cab at both ends, centred, each car 22.70 m
      expect(slots[0]!.turned).toBe(false);
      expect(slots[n - 1]!.turned).toBe(true);
      expect(slots[0]!.hi).toBeCloseTo((n * DB628_LENGTH) / 2, 9);
      expect(slots[n - 1]!.lo).toBeCloseTo((-n * DB628_LENGTH) / 2, 9);
      for (const s of slots) expect(s.hi - s.lo).toBeCloseTo(DB628_LENGTH, 9);
    }
  });

  for (const n of DB_SIZES)
    it(`a ${n}-car train is one articulated vehicle, ${n} x 22.70 m over the cabs' buffers, within budget`, () => {
      const m = db628({ unit: "train", cars: String(n), livery: n % 2 ? "red" : "mint" });
      const glb = m.toGlb("x");
      const s = glbStats(glb);
      expect(s.min[0]).toBeCloseTo((-n * DB628_LENGTH) / 2, 2);
      expect(s.max[0]).toBeCloseTo((n * DB628_LENGTH) / 2, 2);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16_000 * n);
      expectTrainRig(m, db628Train(n));
      if (n <= 3) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("turns the rear car: its cab at the train's -X end, the inner ends meeting under a gangway bellows", () => {
    const m = db628({ unit: "train", cars: "2" });
    // the windscreens: the first car's at +X, the turned car's at -X
    expect(span(m, /^section0\/car-1\/cab\/windscreen/)[0]).toBeGreaterThan(20);
    expect(span(m, /^section1\/car-2\/cab\/windscreen/)[1]).toBeLessThan(-20);
    // the inner ends' gangway frames give way to the bellows; a lone car keeps its own
    expect(leaves(m.sourceTree("x", "x").root).some((n) => /\/rear-end\/gangway\//.test(n.id))).toBe(false);
    expect(leaves(db628().sourceTree("x", "x").root).some((n) => /^rear-end\/gangway\//.test(n.id))).toBe(true);
    expect(m.rig!.joints![0]!.front - m.rig!.joints![0]!.rear).toBeCloseTo(0.7, 6);
    // a cab coupled to a cab (two units) gets only the small bellows round the couplers
    const four = db628({ unit: "train", cars: "4" }).rig!.joints!;
    expect(four.map((j) => j.front - j.rear)).toEqual([expect.closeTo(0.7, 6), expect.closeTo(0.6, 6), expect.closeTo(0.7, 6)]);
  });

  it("builds the same bytes twice and keeps a distant model of every train", () => {
    const a = db628({ unit: "train", cars: "3" }).toGlb("a");
    expect(Buffer.from(a).equals(Buffer.from(db628({ unit: "train", cars: "3" }).toGlb("a")))).toBe(true);
    const d = DB628_DESIGNS[0]!;
    for (const n of DB_SIZES) {
      const low = buildLodModel(d, { unit: "train", cars: String(n) });
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(lodBudget(d), 100 * n));
      expect(low.rig!.sections).toHaveLength(n);
      expect(low.rig!.joints).toHaveLength(n - 1);
    }
  });

  it("states the game figures of every train in both liveries: 56 t and 423 kW a car", () => {
    const variants = d628Variants();
    for (const livery of ["mint", "red"])
      for (const n of DB_SIZES) {
        const params = { ...(n === 2 ? {} : { cars: String(n) }), ...(livery === "mint" ? {} : { livery }), unit: "train" };
        expect(variants.find((v) => JSON.stringify(v.params) === JSON.stringify(params))).toMatchObject({ weight: 56 * n, power: 423 * n });
      }
  });
});

const d628Variants = () => DB628_DESIGNS[0]!.game!.variants!;

describe("the MAV MDmot full train", () => {
  it("runs the motor car, the Bx trailers and the Ax, the driving trailer turned at the rear", () => {
    const cars = (n: number) => mdmotTrain(n).map((s) => s.car);
    expect(cars(2)).toEqual(["motorCar", "drivingTrailer"]);
    expect(cars(3)).toEqual(["motorCar", "trailerAx", "drivingTrailer"]);
    expect(cars(4)).toEqual(["motorCar", "trailerBx", "trailerAx", "drivingTrailer"]);
    expect(cars(6)).toEqual(["motorCar", "trailerBx", "trailerBx", "trailerBx", "trailerAx", "drivingTrailer"]);
    for (const n of MD_SIZES) {
      const slots = mdmotTrain(n);
      expect(slots.map((s) => s.turned)).toEqual(slots.map((_, k) => k === n - 1));
      const total = slots.reduce((t, s) => t + mdmotLength(s.car), 0);
      expect(slots[0]!.hi).toBeCloseTo(total / 2, 9);
      expect(slots[n - 1]!.lo).toBeCloseTo(-total / 2, 9);
    }
    // the published four-car set: 82.38 m
    expect(mdmotTrain(4)[0]!.hi * 2).toBeCloseTo(82.38, 6);
  });

  for (const n of MD_SIZES)
    it(`a ${n}-car train is one articulated vehicle over its buffers, within budget`, () => {
      const m = mavMdmot({ unit: "train", cars: String(n) });
      const glb = m.toGlb("x");
      const s = glbStats(glb);
      const slots = mdmotTrain(n);
      expect(s.min[0]).toBeCloseTo(slots[n - 1]!.lo, 2);
      expect(s.max[0]).toBeCloseTo(slots[0]!.hi, 2);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16_000 * n);
      expectTrainRig(m, slots);
      if (n <= 3) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("turns the driving trailer: its cab at -X; the trailers' gangways meet under a bellows", () => {
    const m = mavMdmot({ unit: "train", cars: "4" });
    const last = `section3/car-4`;
    expect(span(m, new RegExp(`^${last}/front-end/windscreens/`))[1]).toBeLessThan(-35);
    // gangway frames left out between the trailers, kept where the motor car's cab is coupled
    const gangways = leaves(m.sourceTree("x", "x").root).filter((n) => /\/gangway\//.test(n.id)).map((n) => n.id.split("/")[1]);
    expect([...new Set(gangways)]).toEqual(["car-2"]);
    expect(m.rig!.joints!.map((j) => j.front - j.rear)).toEqual([expect.closeTo(0.6, 6), expect.closeTo(1.4, 6), expect.closeTo(1.4, 6)]);
  });

  it("builds the same bytes twice and keeps a distant model of every train", () => {
    const a = mavMdmot({ unit: "train", cars: "5" }).toGlb("a");
    expect(Buffer.from(a).equals(Buffer.from(mavMdmot({ unit: "train", cars: "5" }).toGlb("a")))).toBe(true);
    const d = MDMOT_DESIGNS[0]!;
    for (const n of MD_SIZES) {
      const low = buildLodModel(d, { unit: "train", cars: String(n) });
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(lodBudget(d), 100 * n));
      expect(low.rig!.sections).toHaveLength(n);
    }
  });

  it("states the game figures of every train: 41 t a car, the motor car's 590 kW", () => {
    const variants = MDMOT_DESIGNS[0]!.game!.variants!;
    for (const n of MD_SIZES) {
      const params = n === 4 ? { unit: "train" } : { cars: String(n), unit: "train" };
      expect(variants.find((v) => JSON.stringify(v.params) === JSON.stringify(params))).toMatchObject({ weight: 41 * n, power: 590 });
    }
  });
});
