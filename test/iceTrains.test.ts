// The ICE 1 and ICE 2 full trains (`unit` `train`, generator/ice1.ts and generator/deIce2.ts):
// the formation of every length, one articulated vehicle of a section a car on its own bogies,
// centred, within the budgets, deterministic, its distant model; the lone cars unchanged.
import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { ICE1_DESIGNS, ice1, ice1Length, ice1Train } from "../generator/ice1";
import { dbIce2, dbIce2Train, ICE2_DESIGN, ICE2_DT, ICE2_PARAMS } from "../generator/deIce2";
import { MeshBuilder } from "../generator/meshBuilder";
import { buildSeries, drawSeriesEndCar, seriesEndCarPalette, seriesParams } from "../generator/shinkansen";
import { glbStats } from "../generator/glbStats";
import { findCoplanarOverlaps } from "../generator/coplanar";
import type { ParamValues, ProceduralDesign } from "../generator/design";

const ICE1 = ICE1_DESIGNS[0]!;
const hash = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const train = (n: number): ParamValues => ({ unit: "train", cars: String(n) });
const formation = (slots: Array<{ car: string; turned: boolean }>) => slots.map((s) => (s.turned ? `${s.car}*` : s.car));

/** The train's checks shared by both designs: sections, joints, supports, length, budget, the LOD. */
function checkTrain(d: ProceduralDesign, n: number, slots: Array<{ lo: number; hi: number }>, overlaps: boolean): void {
  const m = d.build(train(n));
  const glb = m.toGlb(d.id);
  const s = glbStats(glb);
  const rig = m.rig!;
  expect(rig.sections).toHaveLength(n);
  expect(rig.joints).toHaveLength(n - 1);
  // every car on its own two bogies, each a support of its section, front first in the sections
  expect(rig.supports).toHaveLength(2 * n);
  const bySection = [...rig.supports!].sort((a, b) => b.x - a.x).map((x) => x.sections);
  expect(bySection).toEqual(Array.from({ length: 2 * n }, (_, i) => [Math.floor(i / 2)]));
  // hinged at the coupling plane ahead of each car
  rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
  // centred on x = 0 over the coupling planes; the noses reach as far as the lone cars'
  expect(slots[0]!.hi).toBeCloseTo(-slots[n - 1]!.lo, 6);
  expect(s.max[0]).toBeGreaterThanOrEqual(slots[0]!.hi - 1e-3);
  expect(s.max[0]).toBeLessThan(slots[0]!.hi + 0.2);
  expect(s.min[0]).toBeLessThanOrEqual(slots[n - 1]!.lo + 1e-3);
  expect(s.min[0]).toBeGreaterThan(slots[n - 1]!.lo - 0.2);
  expect(s.min[1]).toBeCloseTo(0, 5);
  expect(m.triangleCount()).toBeLessThanOrEqual(16_000 * n);
  if (overlaps) expect(findCoplanarOverlaps(glb)).toEqual([]);
  const lod = d.buildLod!(train(n));
  expect(lod.triangleCount()).toBeGreaterThan(0);
  expect(lod.triangleCount()).toBeLessThanOrEqual(Math.min(500, 100 * n));
  expect(lod.rig?.sections).toHaveLength(n);
  expect(lod.rig?.joints).toHaveLength(n - 1);
  expect(findCoplanarOverlaps(lod.toGlb(d.id))).toEqual([]);
}

describe("ICE 1 full train", () => {
  it("lays out a power car at each end, coaches between, the restaurant car mid-train from five cars", () => {
    expect(formation(ice1Train(3))).toEqual(["powerCar", "coach", "powerCar*"]);
    expect(formation(ice1Train(4))).toEqual(["powerCar", "coach", "coach", "powerCar*"]);
    expect(formation(ice1Train(5))).toEqual(["powerCar", "coach", "restaurant", "coach", "powerCar*"]);
    expect(formation(ice1Train(6))).toEqual(["powerCar", "coach", "coach", "restaurant", "coach", "powerCar*"]);
    expect(formation(ice1Train(8))).toEqual(["powerCar", "coach", "coach", "coach", "restaurant", "coach", "coach", "powerCar*"]);
    for (let n = 3; n <= 8; n++) {
      const slots = ice1Train(n);
      expect(slots).toHaveLength(n);
      expect(slots[0]!.hi - slots[n - 1]!.lo).toBeCloseTo(2 * ice1Length("powerCar") + (n - 2) * ice1Length("coach"), 6);
      slots.slice(1).forEach((s, i) => expect(s.hi).toBe(slots[i]!.lo));
    }
    expect(() => ice1Train(2)).toThrow();
    expect(() => ice1Train(9)).toThrow();
  });

  for (const n of [3, 4, 5, 6, 7, 8])
    it(`${n} cars: one articulated vehicle, a section a car on its own bogies, in budget, its distant model`, () => checkTrain(ICE1, n, ice1Train(n), n <= 4));

  it("turns the rear power car (its nose at -X) and leaves the coaches' gangway frames to the bellows", () => {
    const m = ice1(train(4));
    const tree = m.sourceTree(ICE1.id, ICE1.title);
    const ids: Array<{ id: string; min?: number[]; max?: number[] }> = [];
    const walk = (n: any) => { if (n.children) n.children.forEach(walk); else ids.push(n); };
    walk(tree.root);
    const screens = ids.filter((n) => /\/cab\/windscreen\//.test(n.id));
    expect(Math.max(...screens.map((n) => n.max![0]))).toBeGreaterThan(40);
    expect(Math.min(...screens.map((n) => n.min![0]))).toBeLessThan(-40);
    // inside the train the coaches leave their gangway frames to the bellows
    expect(ids.some((n) => /\/car-2\/.*gangway/.test(n.id))).toBe(false);
    expect(ids.some((n) => /\/car-2\/.*coupler/.test(n.id))).toBe(true);
  });

  it("is deterministic and leaves the lone cars as they were", () => {
    expect(hash(ice1(train(5)).toGlb("x"))).toBe(hash(ice1(train(5)).toGlb("x")));
    // a lone coach keeps its gangway frames
    const walk = (n: any): string[] => (n.children ? n.children.flatMap(walk) : [n.id]);
    expect(walk(ice1({ unit: "coach" }).sourceTree("x", "x").root).some((id) => /gangway/.test(id))).toBe(true);
  });

  it("states each train's weight and power: its cars added up", () => {
    const v = ICE1.game!.variants!;
    expect(v.find((x) => JSON.stringify(x.params) === JSON.stringify({ unit: "train" }))).toMatchObject({ weight: 2 * 78 + 2 * 53, power: 2 * 9600 });
    expect(v.find((x) => x.params.cars === "5")).toMatchObject({ weight: 2 * 78 + 2 * 53 + 58, power: 2 * 9600 });
    for (const n of [3, 5, 6, 7, 8]) expect(v.filter((x) => x.params.unit === "train" && x.params.cars === String(n))).toHaveLength(1);
  });
});

describe("ICE 2 full train", () => {
  it("offers 2 .. 8 cars, four by default, after the lone cars", () => {
    expect(ICE2_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "powerCar", ["powerCar", "coach", "drivingTrailer", "train"]],
      ["cars", "4", ["2", "3", "4", "5", "6", "7", "8"]],
    ]);
  });

  it("lays out the power car, coaches and the driving trailer turned at the rear", () => {
    expect(formation(dbIce2Train(2))).toEqual(["powerCar", "drivingTrailer*"]);
    expect(formation(dbIce2Train(4))).toEqual(["powerCar", "coach", "coach", "drivingTrailer*"]);
    expect(formation(dbIce2Train(8))).toEqual(["powerCar", ...Array(6).fill("coach"), "drivingTrailer*"]);
    // the published half train: 205.36 m over the couplers
    const eight = dbIce2Train(8);
    expect(eight[0]!.hi - eight[7]!.lo).toBeCloseTo(205.36, 6);
    expect(() => dbIce2Train(1)).toThrow();
    expect(() => dbIce2Train(9)).toThrow();
  });

  for (const n of [2, 3, 4, 5, 6, 7, 8])
    it(`${n} cars: one articulated vehicle, a section a car on its own bogies, in budget, its distant model`, () => checkTrain(ICE2_DESIGN, n, dbIce2Train(n), n <= 4));

  it("draws the driving trailer as its lone car, byte for byte, and the train deterministically", () => {
    const params = seriesParams(ICE2_DT);
    const m = new MeshBuilder(seriesEndCarPalette(ICE2_DT, params, { unit: "endCar" }));
    drawSeriesEndCar(m, ICE2_DT, params, { unit: "endCar" });
    expect(hash(m.toGlb("x"))).toBe(hash(buildSeries(ICE2_DT, params, { unit: "endCar" }).toGlb("x")));
    expect(hash(dbIce2(train(3)).toGlb("x"))).toBe(hash(dbIce2(train(3)).toGlb("x")));
  });

  it("states each train's weight and power: its cars added up", () => {
    const v = ICE2_DESIGN.game!.variants!;
    expect(v.find((x) => JSON.stringify(x.params) === JSON.stringify({ unit: "train" }))).toMatchObject({ weight: 78 + 2 * 53 + 50, power: 4800 });
    expect(v.find((x) => x.params.cars === "2")).toMatchObject({ weight: 128, power: 4800 });
    expect(v.find((x) => x.params.cars === "8")).toMatchObject({ weight: 78 + 6 * 53 + 50, power: 4800 });
  });
});
