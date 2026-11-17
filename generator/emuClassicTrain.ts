// The full train of a classic Czech EMU (the CD 451 and the CD 460): units of a
// motor car with its cab at each end and trailers between, the rear motor car of
// a unit turned. A train longer than the prototype's basic unit is two units
// coupled cab to cab, as the units ran in multiple. The train is one articulated
// vehicle (vehicle-rig.md): a bellows over each gangway, a short joint over the
// coupled cabs' couplers. See docs/models/czech-emus-classic.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { drawJoint, type JointRig, type SectionRig, type VehicleRig } from "./rig.ts";

/** The train's own materials beyond its cars': the bellows and the coupler joints. */
export const TRAIN_PALETTE: Record<string, MaterialSpec> = { bellows: { color: "#2a2b2d", roughness: 0.9 } };

export type ClassicCar = "motorCar" | "trailer";

/** A car of a train, front first: its span lo..hi over its coupling planes, whether it is turned, its unit. */
export interface ClassicSlot {
  car: ClassicCar;
  lo: number;
  hi: number;
  turned: boolean;
  unit: number;
}

/**
 * The units a train of `n` cars is made of: one unit up to `basic` cars,
 * otherwise the fewest units of at most `basic` cars, as even as can be, the
 * longer ones in front (eight cars of the CD 451: 4 + 4; five: 3 + 2).
 */
export function classicUnits(n: number, basic: number): number[] {
  if (!Number.isInteger(n) || n < 2) throw new Error(`a classic EMU train has at least 2 cars, not ${n}`);
  const k = Math.ceil(n / basic);
  const small = Math.floor(n / k);
  return Array.from({ length: k }, (_, i) => small + (i < n - small * k ? 1 : 0));
}

/**
 * The cars of a train of `n`, front first: each unit a motor car with its cab
 * leading, its trailers, and a motor car turned (cab at the rear); the whole
 * train centred on x = 0.
 */
export function classicTrain(n: number, basic: number, length: (car: ClassicCar) => number): ClassicSlot[] {
  const cars = classicUnits(n, basic).flatMap((size, unit) => [
    { car: "motorCar" as const, turned: false, unit },
    ...Array.from({ length: size - 2 }, () => ({ car: "trailer" as const, turned: false, unit })),
    { car: "motorCar" as const, turned: true, unit },
  ]);
  let hi = cars.reduce((t, c) => t + length(c.car), 0) / 2;
  return cars.map((c) => {
    const lo = hi - length(c.car);
    const out = { ...c, lo, hi };
    hi = lo;
    return out;
  });
}

/** The distant model's budget of a train of `n`: 100 triangles a car, 300 at most up to five cars, 500 beyond. */
export const lodBudget = (n: number): number => Math.min(n > 5 ? 500 : 300, 100 * n);

/** Whether a slot's +X (front) end is its cab: a leading motor car's front, a turned one's rear. */
export const cabAhead = (s: ClassicSlot): boolean => s.car === "motorCar" && !s.turned;
export const cabBehind = (s: ClassicSlot): boolean => s.car === "motorCar" && s.turned;

/** A section of the train: its body's span (model x), how its joint behind it is drawn, and how it is drawn. */
export interface ClassicSection {
  x0: number;
  x1: number;
  draw: () => void;
}

/**
 * The sections' x spans of a train: a gangway end `gangway` short of its coupling
 * plane (the bellows run wall to wall), a coupled cab end `cab` short of it (the
 * coupler joint).
 */
export function sectionSpans(slots: readonly ClassicSlot[], gangway: number, cab: number): Array<[number, number]> {
  return slots.map((s) => [s.lo + (cabBehind(s) ? cab : gangway), s.hi - (cabAhead(s) ? cab : gangway)]);
}

/** Whether the joint behind slot i joins two units' cabs (a coupler joint, not a gangway's bellows). */
export const coupledCabs = (slots: readonly ClassicSlot[], i: number): boolean => cabBehind(slots[i]!) && cabAhead(slots[i + 1]!);

/**
 * Draws the train as one articulated vehicle (tramKit's `articulate`, with a
 * coupler joint between two units' cabs): every section a part hinged at the
 * coupling plane ahead of it, at `hingeY`, then every joint a part.
 */
export function articulateTrain(m: MeshBuilder, slots: readonly ClassicSlot[], sections: readonly ClassicSection[], hingeY: number, bellows: Array<[number, number]>, couplerJoint: Array<[number, number]>, maxBendDeg: number): VehicleRig {
  const rigSections: SectionRig[] = sections.map((_, i) => ({ node: `section${i}`, pivot: (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, hingeY, 0]) as Vec3 }));
  sections.forEach((s, i) => m.part(rigSections[i]!.node, rigSections[i]!.pivot, s.draw));
  const joints: JointRig[] = [];
  for (let i = 0; i + 1 < sections.length; i++) {
    const coupler = coupledCabs(slots, i);
    const j: JointRig = { node: `joint${i}`, sections: [i, i + 1], front: sections[i]!.x0, rear: sections[i + 1]!.x1, profile: coupler ? couplerJoint : bellows, folds: coupler ? 2 : 4, depth: coupler ? 0.02 : 0.03, material: "bellows" };
    joints.push(j);
    m.part(j.node, [0, 0, 0], () => m.scope(coupler ? "coupler joint" : "bellows", () => drawJoint(m, j, rigSections)));
  }
  const rig: VehicleRig = { sections: rigSections, joints, maxBendDeg };
  m.rig = rig;
  return rig;
}
