// The full train of a classic Czech EMU (the CD 451 and the CD 460): one unit, a
// motor car with its cab at each end and trailers between, the rear motor car
// turned - only cars joined by gangways; coupling units in multiple is left to the
// player. The train is one articulated vehicle (vehicle-rig.md): a bellows over
// each gangway. See docs/models/czech-emus-classic.md.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { drawJoint, type JointRig, type SectionRig, type VehicleRig } from "./rig.ts";

/** The train's own materials beyond its cars': the bellows. */
export const TRAIN_PALETTE: Record<string, MaterialSpec> = { bellows: { color: "#2a2b2d", roughness: 0.9 } };

export type ClassicCar = "motorCar" | "trailer";

/** A car of a train, front first: its span lo..hi over its coupling planes, whether it is turned. */
export interface ClassicSlot {
  car: ClassicCar;
  lo: number;
  hi: number;
  turned: boolean;
}

/**
 * The cars of a train of `n`, front first: a motor car with its cab leading,
 * n - 2 trailers, and a motor car turned (cab at the rear); the whole train
 * centred on x = 0.
 */
export function classicTrain(n: number, length: (car: ClassicCar) => number): ClassicSlot[] {
  if (!Number.isInteger(n) || n < 2) throw new Error(`a classic EMU train has at least 2 cars, not ${n}`);
  const cars = [
    { car: "motorCar" as const, turned: false },
    ...Array.from({ length: n - 2 }, () => ({ car: "trailer" as const, turned: false })),
    { car: "motorCar" as const, turned: true },
  ];
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
 * plane (the bellows run wall to wall), a cab end `cab` short of it.
 */
export function sectionSpans(slots: readonly ClassicSlot[], gangway: number, cab: number): Array<[number, number]> {
  return slots.map((s) => [s.lo + (cabBehind(s) ? cab : gangway), s.hi - (cabAhead(s) ? cab : gangway)]);
}

/**
 * Draws the train as one articulated vehicle (tramKit's `articulate`): every
 * section a part hinged at the coupling plane ahead of it, at `hingeY`, then a
 * bellows over every gangway, each a part.
 */
export function articulateTrain(m: MeshBuilder, slots: readonly ClassicSlot[], sections: readonly ClassicSection[], hingeY: number, bellows: Array<[number, number]>, maxBendDeg: number): VehicleRig {
  const rigSections: SectionRig[] = sections.map((_, i) => ({ node: `section${i}`, pivot: (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, hingeY, 0]) as Vec3 }));
  sections.forEach((s, i) => m.part(rigSections[i]!.node, rigSections[i]!.pivot, s.draw));
  const joints: JointRig[] = [];
  for (let i = 0; i + 1 < sections.length; i++) {
    const j: JointRig = { node: `joint${i}`, sections: [i, i + 1], front: sections[i]!.x0, rear: sections[i + 1]!.x1, profile: bellows, folds: 4, depth: 0.03, material: "bellows" };
    joints.push(j);
    m.part(j.node, [0, 0, 0], () => m.scope("bellows", () => drawJoint(m, j, rigSections)));
  }
  const rig: VehicleRig = { sections: rigSections, joints, maxBendDeg };
  m.rig = rig;
  return rig;
}
