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
import { drawShell, halfWidth, type Arch, type Paint } from "./busBody.ts";
import { AXLE_FACTOR, axleBeam, busWheel, onSide, sideSlab, type BusFrame } from "./busKit.ts";
import { block, steeredWheels } from "./vehicleParts.ts";
import { busLod, emptyBusLodNotes, type BusLodNotes } from "./lodRoad.ts";

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

/** The bus's sections: a rigid bus's "body", an articulated bus's "section<i>" pivoted at its hinge (the distant model's too, lodRoad.ts). */
export function busSections(spec: Pick<BusSpec, "bodies" | "hingeY">): SectionRig[] {
  const articulated = spec.bodies.length > 1;
  const hingeY = spec.hingeY ?? 0.6;
  return spec.bodies.map((_, i) => {
    if (i === 0) return { node: articulated ? "section0" : "body", pivot: [0, 0, 0] };
    const ahead = spec.bodies[i - 1]!;
    // the hinge: the middle of the gap between this body's front and the one ahead's rear
    const hi = spec.bodies[i]![1];
    return { node: `section${i}`, pivot: [(ahead[0] + hi) / 2, hingeY, 0] };
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
  const sections = busSections(spec);
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
      spec.axles.forEach((a, ai) => {
        if (a.x < lo || a.x > hi) return;
        m.scope(a.steer ? "front axle" : `axle ${ai + 1}`, () => {
          axleBeam(m, a.x, r, (a.dual ? spec.tyres.inner[0] : spec.tyres.single[0]) + 0.02, a.drive ?? false);
          if (a.steer) return; // its wheels are parts of their own
          for (const s of [-1, 1]) m.scope(s > 0 ? "right wheels" : "left wheels", () => {
            if (a.dual) {
              busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.inner), null);
              busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.outer), s);
            } else busWheel(m, a.x, r, ...onSide(s, ...spec.tyres.single), s);
          });
        });
      });
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
      axles: [{ nodes: wheelNodes, wheelbase: steer.x - pivotX }],
      maxAngleDeg: spec.maxSteerDeg,
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

// --- drafting a bus: fittings first, the builder later -----------------------------

/** How a side window looks. Heights are metres above the road. */
export interface PaneStyle {
  /** The glass's height range. */
  glass: [number, number];
  /** A surround's height range (the rubber or frame round the glass); none for bonded glazing. */
  surround?: [number, number];
  /** How far the glass stops short of the surround's ends. */
  inset?: number;
  /** The height of a top-hung vent's lower rail, if the pane has one. */
  vent?: number;
  glassMat?: string;
  surroundMat?: string;
}

/** How a passenger door looks: leaves in a frame material, each with panes. */
export interface DoorStyle {
  bottom: number;
  top: number;
  leafMat: string;
  /** The glass in each leaf, height ranges. */
  panes: Array<[number, number]>;
  /** The opening's dark surround, if drawn. */
  surround?: string;
  /** A leaf's width at most: the door gets as many leaves as that needs. */
  leafWidth?: number;
  /** The number of leaves, whatever the width (a double door: 2). */
  leaves?: number;
}

/**
 * Collects a bus's fittings (glazing, doors, lamps, ...) before the mesh builder
 * exists -- they are found by their x and drawn into the section they fall in --
 * then builds it (assembleBus).
 */
export class BusDraft {
  readonly fittings: Fitting[] = [];
  /** What the distant model keeps of the fittings (lodRoad.ts busLod), recorded beside them. */
  readonly lod: BusLodNotes = emptyBusLodNotes();
  private builder: MeshBuilder | null = null;

  constructor(readonly frame: BusFrame) {}

  /** The mesh builder: only while the bus is being built. */
  get m(): MeshBuilder {
    if (!this.builder) throw new Error("a fitting drew outside build()");
    return this.builder;
  }

  fit(group: string, x: number, draw: () => void): void {
    this.fittings.push({ group, x, draw });
  }

  /** One side window over x0..x1 on side `s` (+1 right, -1 left). */
  pane(s: number, x0: number, x1: number, st: PaneStyle): void {
    const inset = st.inset ?? 0.06;
    this.lod.glass.push({ s, x: [x0 + inset, x1 - inset], y: [...st.glass] });
    this.fit(s > 0 ? "right windows" : "left windows", (x0 + x1) / 2, () => {
      if (st.surround) sideSlab(this.m, st.surroundMat ?? "frame", this.frame, s, x0, x1, st.surround[0], st.surround[1], 0.012);
      sideSlab(this.m, st.glassMat ?? "glass", this.frame, s, x0 + inset, x1 - inset, st.glass[0], st.glass[1], 0.022);
      if (st.vent !== undefined && x1 - x0 > 0.9) sideSlab(this.m, st.surroundMat ?? "frame", this.frame, s, x0 + inset - 0.02, x1 - inset + 0.02, st.vent, st.vent + 0.04, 0.03);
    });
  }

  /** Fills x0..x1 on side `s` with panes about `pitch` long, `gap` apart. */
  run(s: number, x0: number, x1: number, st: PaneStyle, pitch = 1.8, gap = 0.1): void {
    const n = Math.max(1, Math.round((x1 - x0) / pitch));
    const w = (x1 - x0) / n;
    for (let i = 0; i < n; i++) this.pane(s, x0 + i * w + gap / 2, x0 + (i + 1) * w - gap / 2, st);
  }

  /** A passenger door over x0..x1 on side `s` (the right, +1, by default). */
  /** A door x0..x1 on side `s`: its leaves `leaves`, else the style's count, else as many as its leaf width needs. */
  door(x0: number, x1: number, st: DoorStyle, s = 1, leaves = st.leaves ?? Math.max(1, Math.ceil((x1 - x0 - 0.06) / (st.leafWidth ?? 0.62) - 1e-9))): void {
    this.lod.doors.push({ s, x: [x0, x1], y: [st.bottom, st.top] });
    this.fit(s > 0 ? "right doors" : "left doors", (x0 + x1) / 2, () => {
      const m = this.m;
      if (st.surround) sideSlab(m, st.surround, this.frame, s, x0, x1, st.bottom - 0.04, st.top + 0.04, 0.01);
      const hw = halfWidth(this.frame.section, st.bottom + 0.2);
      const lw = (x1 - x0 - 0.06) / leaves;
      for (let l = 0; l < leaves; l++) {
        const a = x0 + 0.03 + l * lw;
        const b = a + lw - 0.02;
        block(m, st.leafMat, a, b, st.bottom, st.top, ...onSide(s, hw + 0.006, hw + 0.02));
        for (const [y0, y1] of st.panes) block(m, "glass", a + 0.06, b - 0.06, y0, y1, ...onSide(s, hw + 0.014, hw + 0.026));
      }
    });
  }

  /** Notes glass on an end (`end` +1 the nose, -1 the tail) for the distant model; draws nothing. */
  glaze(end: number, z0: number, z1: number, y0: number, y1: number): void {
    this.lod.ends.push({ end, z: [z0, z1], y: [y0, y1] });
  }

  /** Notes paint across an end the shell's panels do not carry (a bumper) for the distant model; draws nothing. */
  endPaint(end: number, y0: number, y1: number, mat: string): void {
    this.lod.endPaint.push({ end, y: [y0, y1], mat });
  }

  /** Notes a box on the roof for the distant model; draws nothing. */
  roofItem(x0: number, x1: number, z0: number, z1: number, y0: number, y1: number, mat: string): void {
    this.lod.roof.push({ x: [x0, x1], z: [z0, z1], y: [y0, y1], mat });
  }

  /** Notes a stretch of side `s` where something hides the windows, for the distant model; draws nothing. */
  cover(s: number, x0: number, x1: number): void {
    this.lod.covers.push({ s, x: [x0, x1] });
  }

  /** Notes paint laid on side `s` for the distant model, a rectangle or a convex outline (x, y); draws nothing. */
  sidePaint(s: number, mat: string, x: [number, number], y: [number, number]): void {
    this.lod.panels.push({ s, x, y, mat });
  }

  sideShape(s: number, mat: string, pts: Array<[number, number]>): void {
    this.lod.shapes.push({ s, pts, mat });
  }

  /** Builds the bus with these fittings. */
  build(spec: Omit<BusSpec, "fittings">): MeshBuilder {
    return assembleBus({ ...spec, fittings: this.fittings }, (b) => (this.builder = b));
  }

  /** Builds the bus's distant model (lodRoad.ts busLod) from the same description and the notes. */
  buildLod(spec: Omit<BusSpec, "fittings">): MeshBuilder {
    return busLod(spec, this.lod);
  }
}
