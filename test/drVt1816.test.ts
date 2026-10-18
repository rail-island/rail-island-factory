// The DR VT 18.16 "Delfin" (generator/drVt1816.ts). See docs/models/dr-vt1816.md.
import { describe, expect, it } from "vitest";
import {
  VT1816_AXLES, VT1816_DESIGNS, VT1816_GAP, VT1816_LENGTH, VT1816_MAX_CARS, VT1816_MIN_CARS, VT1816_PARAMS, VT1816_POWER_BODY, VT1816_TRAILER_BODY,
  vt1816, vt1816Train, type Vt1816Car,
} from "../generator/drVt1816";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const CARS: Vt1816Car[] = ["powerCar", "dining", "firstClass", "trailer"];
const lengthOf = (car: Vt1816Car) => VT1816_LENGTH[car === "powerCar" ? "powerCar" : "trailer"];
const TRAIN_SIZES = Array.from({ length: VT1816_MAX_CARS - VT1816_MIN_CARS + 1 }, (_, i) => i + VT1816_MIN_CARS);
const axlesOf = (m: ReturnType<typeof vt1816>) =>
  leaves(m.sourceTree("vt1816", "VT 18.16").root)
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => (n.min![0] + n.max![0]) / 2)
    .sort((a, b) => a - b);

describe("the DR VT 18.16", () => {
  it("is one diesel unit design: the power car, three intermediate cars and the full train with its car count", () => {
    const [d] = VT1816_DESIGNS;
    expect(VT1816_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-dr-vt1816");
    expect(d!.references).toBe("dr-vt1816");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "diesel" });
    expect(VT1816_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "powerCar"], ["cars", "4"]]);
    expect(VT1816_PARAMS[0]!.values.map((v) => v.value)).toEqual([...CARS, "train"]);
    expect(VT1816_PARAMS[1]!.values.map((v) => v.value)).toEqual(TRAIN_SIZES.map(String));
    expect(VT1816_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
    for (const p of VT1816_PARAMS) for (const v of p.values) expect(v.title.length, v.title).toBeLessThanOrEqual(16);
  });

  it("makes the published 98.06 m four-car set: two power cars and two intermediate cars", () => {
    expect(2 * VT1816_LENGTH.powerCar + 2 * VT1816_LENGTH.trailer).toBeCloseTo(98.06, 2);
    expect(vt1816Train(4).map((c) => c.car)).toEqual(["powerCar", "firstClass", "dining", "powerCar"]);
  });

  for (const car of CARS)
    it(`${car}: stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
      const glb = vt1816({ unit: car }).toGlb("vt1816");
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.min[1]).toBeCloseTo(0, 2);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.min[0]).toBeCloseTo(-lengthOf(car) / 2, 2);
      expect(s.max[0]).toBeCloseTo(lengthOf(car) / 2, 2);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  for (const car of CARS)
    it(`${car}: rides on two bogies with the drawing's axles`, () => {
      const m = vt1816({ unit: car });
      expect(m.rig!.supports).toHaveLength(2);
      const power = car === "powerCar";
      const body = power ? VT1816_POWER_BODY : VT1816_TRAILER_BODY;
      const want = VT1816_AXLES[power ? "powerCar" : "trailer"].map((d) => body / 2 - d).sort((a, b) => a - b);
      const got = axlesOf(m);
      expect(got).toHaveLength(4);
      got.forEach((x, i) => expect(x).toBeCloseTo(want[i]!, 1));
    });

  it("gives the power car its nose, raised cockpit, portholes and the motor bogie's 4.0 m wheelbase", () => {
    const nodes = leaves(vt1816().sourceTree("vt1816", "VT 18.16").root);
    for (const scope of ["nose/headlights", "nose/emblem", "nose/running-number", "cockpit/windscreen", "cockpit/shell"]) expect(nodes.some((n) => n.id.startsWith(scope)), scope).toBe(true);
    for (const s of ["right-side", "left-side"]) expect(new Set(nodes.filter((n) => n.id.startsWith(`body/${s}/portholes/`)).map((n) => n.id.split("/")[3])).size).toBe(4);
    const [a1, a2] = VT1816_AXLES.powerCar;
    expect(a2! - a1!).toBeCloseTo(4.0, 6);
    const top = Math.max(...nodes.filter((n) => n.id.startsWith("cockpit/shell")).map((n) => n.max![1]));
    expect(top).toBeCloseTo(4.25, 2);
  });

  it("lays out the intermediate cars from the drawing and the type's entrances", () => {
    const count = (car: Vt1816Car, side: string, what: string) =>
      new Set(leaves(vt1816({ unit: car }).sourceTree("vt1816", "VT 18.16").root).filter((n) => n.id.startsWith(`body/${side}/${what}/`)).map((n) => n.id.split("/")[3])).size;
    // [right doors, left doors, right windows, left windows]
    const want: Record<Exclude<Vt1816Car, "powerCar">, number[]> = {
      // both sides' doors behind one gangway, one more on the left; the kitchen's window on the right
      dining: [1, 2, 11, 10],
      firstClass: [1, 2, 9, 9],
      // the VMe's two entrances diagonally opposite
      trailer: [1, 1, 10, 10],
    };
    for (const [car, [rd, ld, rw, lw]] of Object.entries(want) as Array<[Exclude<Vt1816Car, "powerCar">, number[]]>)
      expect([count(car, "right-side", "doors"), count(car, "left-side", "doors"), count(car, "right-side", "windows"), count(car, "left-side", "windows")], car).toEqual([rd, ld, rw, lw]);
  });

  for (const n of TRAIN_SIZES)
    it(`a ${n}-car train is articulated: a power car at each end, a section per car on its own bogies`, () => {
      const cars = vt1816Train(n);
      expect(cars).toHaveLength(n);
      expect(cars[0]!.car).toBe("powerCar");
      expect(cars[n - 1]).toMatchObject({ car: "powerCar", turned: true });
      expect(cars.slice(1, -1).every((c) => c.car !== "powerCar")).toBe(true);
      const m = vt1816({ unit: "train", cars: String(n) });
      const glb = m.toGlb("vt1816");
      const s = glbStats(glb);
      const total = cars.reduce((t, c) => t + lengthOf(c.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      // each hinge on the coupling plane between two cars; each joint over the 0.70 m between the bodies
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(cars[i]!.lo, 6));
      for (const j of rig.joints!) expect(j.front - j.rear).toBeCloseTo(0.7, 6);
      // two bogies a car, each carrying its own car only
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n <= 4) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("turns the trailing power car: its nose at -X, its motor bogie at the train's rear", () => {
    const axles = axlesOf(vt1816({ unit: "train", cars: "2" }));
    // the leading car's front axle 3.21 m behind its nose, the nose 0.35 m behind the train's +X coupler face
    const front = VT1816_LENGTH.powerCar - VT1816_GAP - VT1816_AXLES.powerCar[0]!;
    expect(axles).toHaveLength(8);
    expect(axles[axles.length - 1]).toBeCloseTo(front, 2);
    expect(axles[0]).toBeCloseTo(-front, 2);
  });

  it("builds the same bytes twice and keeps a valid distant model for every car and train", () => {
    expect(Buffer.from(vt1816({ unit: "train", cars: "3" }).toGlb("a")).equals(Buffer.from(vt1816({ unit: "train", cars: "3" }).toGlb("a")))).toBe(true);
    const d = VT1816_DESIGNS[0]!;
    for (const params of [...CARS.map((unit) => ({ unit })), ...TRAIN_SIZES.map((n) => ({ unit: "train", cars: String(n) }))]) {
      const low = buildLodModel(d, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(params.unit === "train" ? Math.min(lodBudget(d), 100 * Number(params.cars)) : 100);
      if (params.unit === "train") expect(low.rig!.sections).toHaveLength(Number(params.cars));
    }
  });
});
