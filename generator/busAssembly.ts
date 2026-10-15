// Puts a procedural bus together (buses.ts): the shell of every section, the
// fittings, the wheels, and -- what the game moves -- the steered front wheels
// and, for an articulated bus, the sections and the joints between them, each
// its own part with the rig that names them (rig.ts). See docs/models/buses.md.
//
// A rigid bus is one part, "body", with the two steered wheels inside it. An
// articulated bus is "section0" (with the steered wheels), "section1", ... and
// "joint0", ...: each section's pivot is its hinge with the section ahead, in
// the middle of the gap the joint covers.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { drawJoint, type JointRig, type SectionRig, type VehicleRig } from "./rig.ts";
import { drawShell, type Arch, type Paint } from "./busBody.ts";
import { AXLE_FACTOR, axleBeam, busWheel, onSide } from "./busKit.ts";
import { steeredWheels } from "./vehicleParts.ts";

/** One axle: where it is, and what it carries. */
export interface Axle {
  x: number;
  /** Twin tyres each side (a driven or heavily loaded axle). */
  dual: boolean;
  /** The steered front axle (exactly one per bus). */
  steer?: boolean;
  drive?: boolean;
}

/** A fitting: something drawn on a section, found by its x, in a named group. */
export interface Fitting {
  group: string;
  x: number;
  draw: () => void;
}

export interface BusSpec {
  palette: Record<string, MaterialSpec>;
  /** The full shell, every section's together: cut at the gaps. */
  section: Array<[number, number]>;
  side: Array<[number, number]>;
  plan: Array<[number, number]>;
  base: string;
  paint: Paint[];
  arches: Arch[];
  /** The rigid bodies' x ranges, front (largest x) first: one for a rigid bus. */
  bodies: Array<[number, number]>;
  axles: Axle[];
  wheelRadius: number;
  /** Tyre z ranges (outward, >= 0): a single front tyre, and a twin pair's inner and outer tyres. */
  tyres: { single: [number, number]; inner: [number, number]; outer: [number, number] };
  /** The bellows' inner cross-section (z, y), how many ridges it has and how deep. */
  bellows?: { profile: Array<[number, number]>; folds: number; depth: number };
  /** Hinge height above the road. */
  hingeY?: number;
  maxSteerDeg: number;
  maxBendDeg?: number;
  fittings: Fitting[];
}

/** Draws every fitting of `groups` whose x falls in lo..hi, a scope per group. */
function drawFittings(m: MeshBuilder, fittings: readonly Fitting[], lo: number, hi: number): void {
  const groups: string[] = [];
  for (const f of fittings) if (f.x >= lo && f.x <= hi && !groups.includes(f.group)) groups.push(f.group);
  for (const g of groups) m.scope(g, () => {
    for (const f of fittings) if (f.group === g && f.x >= lo && f.x <= hi) f.draw();
  });
}

/**
 * Builds the bus. `bind` receives the mesh builder before anything is drawn, so
 * the fittings' closures, written before it existed, can draw into it.
 */
export function assembleBus(spec: BusSpec, bind?: (m: MeshBuilder) => void): MeshBuilder {
  const m = new MeshBuilder(spec.palette);
  bind?.(m);
  const articulated = spec.bodies.length > 1;
  const steer = spec.axles.find((a) => a.steer);
  if (!steer) throw new Error("a bus needs a steered axle");
  const hingeY = spec.hingeY ?? 0.6;
  const sections: SectionRig[] = spec.bodies.map((_, i) => {
    if (i === 0) return { node: articulated ? "section0" : "body", pivot: [0, 0, 0] };
    const ahead = spec.bodies[i - 1]!;
    // the hinge: the middle of the gap between this body's front and the one ahead's rear
    const hi = spec.bodies[i]![1];
    return { node: `section${i}`, pivot: [(ahead[0] + hi) / 2, hingeY, 0] };
  });
  const r = spec.wheelRadius;
  const ay = r * AXLE_FACTOR;
  let wheelNodes: [string, string] = ["", ""];

  spec.bodies.forEach(([lo, hi], i) => {
    const node = sections[i]!.node;
    m.part(node, sections[i]!.pivot, () => {
      // the gaps are the cut: a section's shell stops at its own ends
      drawShell(m, {
        section: spec.section, side: spec.side, plan: spec.plan, base: spec.base, paint: spec.paint,
        arches: spec.arches, under: "under", x0: lo, x1: hi,
      });
      for (const a of spec.axles) {
        if (a.x < lo || a.x > hi) continue;
        m.scope(a.steer ? "front axle" : `axle ${a.x.toFixed(1)}`, () => {
          axleBeam(m, a.x, r, (a.dual ? spec.tyres.inner[0] : spec.tyres.single[0]) + 0.02, a.drive ?? false);
          if (a.steer) return; // its wheels are parts of their own
          for (const s of [-1, 1]) m.scope(s > 0 ? "right wheels" : "left wheels", () => {
            if (a.dual) {
              busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.inner), null);
              busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.outer), s);
            } else busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.single), s);
          });
        });
      }
      drawFittings(m, spec.fittings, lo, hi);
    });
    if (i === 0) {
      wheelNodes = steeredWheels(m, node, steer.x, ay, (s, z0, z1) => busWheel(m, steer.x, r, z0, z1, s), spec.tyres.single);
    }
  });

  const joints: JointRig[] = [];
  if (articulated) {
    if (!spec.bellows) throw new Error("an articulated bus needs its bellows");
    for (let i = 0; i + 1 < spec.bodies.length; i++) {
      const j: JointRig = {
        node: `joint${i}`,
        sections: [i, i + 1],
        front: spec.bodies[i]![0],
        rear: spec.bodies[i + 1]![1],
        profile: spec.bellows.profile,
        folds: spec.bellows.folds,
        depth: spec.bellows.depth,
        material: "bellows",
      };
      joints.push(j);
      m.part(j.node, [0, 0, 0], () => m.scope("bellows", () => drawJoint(m, j, sections)));
    }
  }

  // the axle the bus turns about: a rigid bus's rear one, an articulated bus's front section's
  const behind = spec.axles.filter((a) => !a.steer && a.x >= spec.bodies[0]![0] && a.x < steer.x);
  const pivotX = behind.length ? behind.reduce((s, a) => s + a.x, 0) / behind.length : steer.x - 5;
  const rig: VehicleRig = {
    steer: {
      nodes: wheelNodes,
      maxAngleDeg: spec.maxSteerDeg,
      wheelbase: steer.x - pivotX,
      track: spec.tyres.single[0] + spec.tyres.single[1],
    },
  };
  if (articulated) {
    rig.sections = sections;
    rig.joints = joints;
    rig.maxBendDeg = spec.maxBendDeg ?? 45;
  }
  m.rig = rig;
  return m;
}
