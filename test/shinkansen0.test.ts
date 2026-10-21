// The Shinkansen 0 series (generator/shinkansen0.ts). See docs/models/shinkansen-0.md.
import { describe, expect, it } from "vitest";
import {
  SHINKANSEN0_BOGIE_CENTRES, SHINKANSEN0_CARS, SHINKANSEN0_DESIGNS, SHINKANSEN0_LENGTH, SHINKANSEN0_LOD, SHINKANSEN0_PARAMS, SHINKANSEN0_WIRE,
  shinkansen0, shinkansen0Length, shinkansen0Train, type Shinkansen0Car,
} from "../generator/shinkansen0";
import { resolveParams } from "../generator/design";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const CARS: Shinkansen0Car[] = ["endCar", "motorCar", "pantographCar", "greenCar", "buffetCar"];
const LIVERIES = ["jnr", "freshGreen", "doctorYellow"];
const nodes = (params: Record<string, string>) => leaves(shinkansen0(params).sourceTree("s0", "0 series").root);
const axlesOf = (m: ReturnType<typeof shinkansen0>) =>
  leaves(m.sourceTree("s0", "0 series").root)
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => (n.min![0] + n.max![0]) / 2)
    .sort((a, b) => a - b);

describe("the Shinkansen 0 series", () => {
  it("is one electric unit design: five cars and the full train, the end car (a motor car) by default, three liveries", () => {
    const [d] = SHINKANSEN0_DESIGNS;
    expect(SHINKANSEN0_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-shinkansen-0");
    expect(d!.references).toBe("shinkansen-0");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "electric" });
    expect(SHINKANSEN0_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "endCar"], ["cars", "4"], ["livery", "jnr"]]);
    expect(SHINKANSEN0_PARAMS[0]!.values.map((v) => v.value)).toEqual([...CARS, "train"]);
    expect(SHINKANSEN0_PARAMS[1]!.values.map((v) => v.value)).toEqual(SHINKANSEN0_CARS.map(String));
    expect(SHINKANSEN0_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
    expect(SHINKANSEN0_PARAMS[2]!.values.map((v) => v.value)).toEqual(LIVERIES);
    // every car is powered: the default end car is the train's locomotive
    expect(d!.game).toMatchObject({ weight: 60, power: 740, maxspeed: 220 });
  });

  for (const livery of LIVERIES)
    for (const car of CARS)
      it(`${car} (${livery}): stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
        const glb = shinkansen0({ unit: car, livery }).toGlb("s0");
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[1]).toBeLessThanOrEqual(car === "pantographCar" ? SHINKANSEN0_WIRE + 0.01 : 4.7);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
        expect(s.max[0] - s.min[0]).toBeCloseTo(shinkansen0Length(car), 2);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      });

  it("rides every car on two bogies 17.5 m apart, 2.5 m wheelbase", () => {
    for (const car of CARS) {
      const m = shinkansen0({ unit: car });
      expect(m.rig!.supports).toHaveLength(2);
      const a = axlesOf(m);
      expect(a).toHaveLength(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.5, 2);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(SHINKANSEN0_BOGIE_CENTRES, 2);
    }
  });

  it("gives the end car its nose: the headlights, the windscreen, the cab's side windows; only the pantograph car its diamond pantograph", () => {
    const end = nodes({ unit: "endCar" });
    for (const scope of ["nose/headlights", "nose/windscreen", "nose/side-windows"]) expect(end.some((n) => n.id.startsWith(scope)), scope).toBe(true);
    // the nose tip is the car's +X end, ahead of the dome's cap
    expect(Math.max(...end.map((n) => n.max![0]))).toBeCloseTo(SHINKANSEN0_LENGTH.endCar / 2, 2);
    const pans = (params: Record<string, string>) => nodes(params).filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
    expect(pans({ unit: "endCar" })).toHaveLength(0);
    expect(pans({ unit: "motorCar" })).toHaveLength(0);
    const head = Math.max(...pans({ unit: "pantographCar" }).map((n) => n.max![1]));
    expect(head).toBeCloseTo(SHINKANSEN0_WIRE, 2);
  });

  it("forms its trains of motor pairs: an end car at each end, a pantograph in every pair, the buffet car in eight", () => {
    expect(SHINKANSEN0_CARS).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(shinkansen0Train(2).map((s) => s.car)).toEqual(["endCar", "endCar"]);
    expect(shinkansen0Train(3).map((s) => s.car)).toEqual(["endCar", "pantographCar", "endCar"]);
    expect(shinkansen0Train(4).map((s) => s.car)).toEqual(["endCar", "pantographCar", "pantographCar", "endCar"]);
    expect(shinkansen0Train(5).map((s) => s.car)).toEqual(["endCar", "pantographCar", "motorCar", "pantographCar", "endCar"]);
    expect(shinkansen0Train(7).map((s) => s.car)).toEqual(["endCar", "pantographCar", "motorCar", "pantographCar", "motorCar", "pantographCar", "endCar"]);
    const eight = shinkansen0Train(8);
    expect(eight.map((s) => s.car)).toEqual(["endCar", "pantographCar", "motorCar", "pantographCar", "buffetCar", "pantographCar", "pantographCar", "endCar"]);
    // one pantograph a pair of cars 2k, 2k + 1 (the two end cars of the shortest train have none); an odd train's last car shares the pantograph ahead of it
    for (const n of SHINKANSEN0_CARS.filter((k) => k >= 3)) {
      const slots = shinkansen0Train(n);
      expect(slots.filter((s) => s.pantograph)).toHaveLength(Math.floor(n / 2));
      for (let k = 0; k + 1 < n; k += 2) expect(Number(slots[k]!.pantograph) + Number(slots[k + 1]!.pantograph)).toBe(1);
      if (n % 2 === 1) expect(slots[n - 2]!.pantograph).toBe(true);
    }
    // 200.3 m: two end cars and six intermediate cars
    expect(eight[0]!.hi - eight[7]!.lo).toBeCloseTo(2 * 25.15 + 6 * 25.0, 6);
  });

  it("reads the retired 10- to 16-car trains of a saved map as the eight-car train", () => {
    for (const n of ["10", "12", "14", "16"]) expect(resolveParams(SHINKANSEN0_PARAMS, { unit: "train", cars: n })).toMatchObject({ unit: "train", cars: "8" });
    expect(resolveParams(SHINKANSEN0_PARAMS, { unit: "train" })).toMatchObject({ cars: "4" });
  });

  for (const n of SHINKANSEN0_CARS)
    it(`a ${n}-car train is articulated: an end car at each end, the rear one turned, a section per car on its own bogies`, () => {
      const slots = shinkansen0Train(n);
      expect(slots[n - 1]).toMatchObject({ car: "endCar", turned: true });
      const m = shinkansen0({ unit: "train", cars: String(n) });
      const glb = m.toGlb("s0");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + shinkansen0Length(slot.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      for (const j of rig.joints!) expect(j.front - j.rear).toBeCloseTo(0.5, 6);
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n <= 4) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("builds the same bytes twice and keeps a distant model for every car and train", () => {
    expect(Buffer.from(shinkansen0({ unit: "train", cars: "4" }).toGlb("a")).equals(Buffer.from(shinkansen0({ unit: "train", cars: "4" }).toGlb("a")))).toBe(true);
    const d = SHINKANSEN0_DESIGNS[0]!;
    for (const params of [...CARS.map((unit) => ({ unit })), ...SHINKANSEN0_CARS.map((n) => ({ unit: "train", cars: String(n) }))]) {
      const low = buildLodModel(d, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(params.unit === "train" ? Math.min(SHINKANSEN0_LOD, 100 * Number(params.cars)) : 100);
      if (params.unit === "train") expect(low.rig!.sections).toHaveLength(Number(params.cars));
    }
  });
});
