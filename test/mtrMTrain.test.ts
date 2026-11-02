// The MTR M-Train (generator/mtrMTrain.ts). See docs/models/mtr-m-train.md.
import { describe, expect, it } from "vitest";
import {
  MTR_BODY, MTR_BOGIE_CENTRES, MTR_CARS, MTR_FORMATIONS, MTR_FRONT_COUPLER, MTR_GAP, MTR_LOD, MTR_M_TRAIN_DESIGNS, MTR_PARAMS, MTR_WIRE,
  mtrLayout, mtrLength, mtrMTrain, mtrTrain, type MtrCar,
} from "../generator/mtrMTrain";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const CARS: MtrCar[] = ["aCar", "bCar", "cCar", "dCar"];
const LIVERIES = ["refurbished", "retro"];
const nodes = (params: Record<string, string>) => leaves(mtrMTrain(params).sourceTree("m", "M-Train").root);
const axlesOf = (m: ReturnType<typeof mtrMTrain>) =>
  leaves(m.sourceTree("m", "M-Train").root)
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => (n.min![0] + n.max![0]) / 2)
    .sort((a, b) => a - b);

describe("the MTR M-Train", () => {
  it("is one electric unit design: four cars and the full train, the A cab car by default, two liveries", () => {
    const [d] = MTR_M_TRAIN_DESIGNS;
    expect(MTR_M_TRAIN_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-mtr-m-train");
    expect(d!.references).toBe("mtr-m-train");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "electric" });
    expect(MTR_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "aCar"], ["cars", "4"], ["livery", "refurbished"]]);
    expect(MTR_PARAMS[0]!.values.map((v) => v.value)).toEqual([...CARS, "train"]);
    expect(MTR_PARAMS[1]!.values.map((v) => v.value)).toEqual(MTR_CARS.map(String));
    expect(MTR_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
    expect(MTR_PARAMS[2]!.values.map((v) => v.value)).toEqual(LIVERIES);
    for (const p of MTR_PARAMS) for (const v of p.values) expect(v.title.length, v.title).toBeLessThanOrEqual(16);
    expect(d!.game).toMatchObject({ weight: 37, power: 340, maxspeed: 80, accel: 1.0 });
    // the D trailer has no power; the 8-car train's six motor cars 2,040 kW
    expect(d!.game!.variants).toContainEqual({ params: { unit: "dCar" }, weight: 27, power: 0 });
    expect(d!.game!.variants).toContainEqual({ params: { cars: "8", unit: "train" }, weight: 2 * 37 + 3 * 37 + 36 + 2 * 27, power: 6 * 340 });
  });

  for (const livery of LIVERIES)
    for (const car of CARS)
      it(`${car} (${livery}): stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
        const glb = mtrMTrain({ unit: car, livery }).toGlb("m");
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[1]).toBeLessThanOrEqual(car === "cCar" ? MTR_WIRE + 0.01 : 4.7);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
        expect(s.max[0] - s.min[0]).toBeCloseTo(mtrLength(car), 2);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      });

  it("is 22.85 m (A) and 22.0 m (B, C, D) over the bodies, on two bogies 2.5 m wheelbase", () => {
    expect(mtrLength("aCar")).toBeCloseTo(MTR_BODY.aCar + MTR_GAP + MTR_FRONT_COUPLER, 6);
    expect(mtrLength("dCar")).toBeCloseTo(MTR_BODY.middle + 2 * MTR_GAP, 6);
    for (const car of CARS) {
      const m = mtrMTrain({ unit: car });
      expect(m.rig!.supports).toHaveLength(2);
      const a = axlesOf(m);
      expect(a).toHaveLength(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.5, 2);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(MTR_BOGIE_CENTRES, 2);
    }
  });

  it("has five double-leaf doors a side on every car, each door's two leaves opening", () => {
    for (const car of CARS) {
      expect(mtrLayout(car).doors).toHaveLength(5);
      const m = mtrMTrain({ unit: car });
      const clips = m.animations().filter((c) => c.drive.drive === "door");
      expect(clips.map((c) => c.drive)).toEqual(expect.arrayContaining([{ drive: "door", side: "right" }, { drive: "door", side: "left" }]));
      // two leaves a door, five doors a side
      expect(new Set(clips.flatMap((c) => c.tracks.map((t) => t.node))).size).toBe(20);
    }
  });

  it("gives the A car its cab face and front coupler, only the C car its pantograph, raised to the game's wire", () => {
    const a = nodes({ unit: "aCar" });
    for (const scope of ["cab-end/mask", "cab-end/windscreens", "cab-end/bands", "cab-end/bumper-lamps", "front-coupler"]) expect(a.some((n) => n.id.startsWith(scope)), scope).toBe(true);
    expect(Math.max(...a.map((n) => n.max![0]))).toBeCloseTo(mtrLength("aCar") / 2, 2);
    const pans = (params: Record<string, string>) => nodes(params).filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
    for (const unit of ["aCar", "bCar", "dCar"]) expect(pans({ unit })).toHaveLength(0);
    expect(Math.max(...pans({ unit: "cCar" }).map((n) => n.max![1]))).toBeCloseTo(MTR_WIRE, 2);
  });

  it("forms its trains from the 8-car urban formation A-C+D+B-C+D+C-A, a C car in each half", () => {
    expect(MTR_CARS).toEqual([3, 4, 5, 6, 7, 8]);
    const letters = (n: number) => mtrTrain(n).map((s) => s.car[0]!.toUpperCase()).join("");
    expect(letters(8)).toBe("ACDBCDCA");
    expect(letters(4)).toBe("ACCA");
    expect(letters(3)).toBe("ACA");
    for (const n of MTR_CARS) {
      const slots = mtrTrain(n);
      expect(slots.map((s) => s.car)).toEqual(MTR_FORMATIONS[n]);
      expect(slots[0]!.car).toBe("aCar");
      expect(slots[n - 1]).toMatchObject({ car: "aCar", turned: true });
      expect(slots.filter((s) => s.turned)).toHaveLength(1);
      expect(slots.some((s) => s.car === "cCar")).toBe(true);
      // every car carries its own running number, of its own letter
      expect(new Set(slots.map((s) => s.number)).size).toBe(n);
      for (const s of slots) expect(s.number[0]).toBe(s.car[0]!.toUpperCase());
    }
    expect(mtrTrain(8).map((s) => s.number)).toEqual(["A169", "C169", "D602", "B456", "C456", "D619", "C164", "A164"]);
  });

  for (const n of MTR_CARS)
    it(`a ${n}-car train is articulated: a section per car on its own bogies, the rear A car turned`, () => {
      const slots = mtrTrain(n);
      const m = mtrMTrain({ unit: "train", cars: String(n) });
      const glb = m.toGlb("m");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + mtrLength(slot.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      for (const j of rig.joints!) expect(j.front - j.rear).toBeCloseTo(2 * MTR_GAP, 6);
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n <= 4) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("builds the same bytes twice and keeps a distant model for every car and train", () => {
    expect(Buffer.from(mtrMTrain({ unit: "train", cars: "4" }).toGlb("a")).equals(Buffer.from(mtrMTrain({ unit: "train", cars: "4" }).toGlb("a")))).toBe(true);
    const d = MTR_M_TRAIN_DESIGNS[0]!;
    for (const params of [...CARS.map((unit) => ({ unit })), ...MTR_CARS.map((n) => ({ unit: "train", cars: String(n) }))]) {
      const low = buildLodModel(d, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(params.unit === "train" ? Math.min(MTR_LOD, 100 * Number(params.cars)) : 100);
      if (params.unit === "train") expect(low.rig!.sections).toHaveLength(Number(params.cars));
    }
  });
});
