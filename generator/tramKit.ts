// The shared builder of the trams and the metro car (trams.ts, metro.ts):
// bodies lofted from the vlakosimdb XML profiles, panels laid on them from
// boxes measured on the native BMPs, tram bogies, couplers, the two kinds of
// pantograph, and -- for an articulated tram -- the sections and the bellows
// between them as parts with a rig (rig.ts, docs/models/vehicle-rig.md).
//
// Source coordinates are the JT7 ones: x along the car from the cab end (the
// x_inc end, which the Factory makes the front), y up from the rail, z across
// (+z is the z_dec side). A tram's vlakosimdb drawing is not to scale, so every
// design maps it onto its published dimensions with one factor per axis:
//
//   X = (c - x) * kx,   Y = y * ky,   Z = -z * kz
//
// c the source x of the model's x = 0. The Factory side +Z (right) is the
// source -z side, painted by z_inc; the front (+X) is the x_inc end. A 180
// degree turn about Y, so nothing is mirrored. See docs/models/trams.md.

import { ngon, type MaterialSpec, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, sectionHalf, type Box, type Opening, type Pt, type Volume } from "./csdCoachParts.ts";
import { block } from "./vehicleParts.ts";
import { drawJoint, type JointRig, type SectionRig, type VehicleRig } from "./rig.ts";
import { liftable } from "./liftable.ts";
import type { DoorMotion } from "./doors.ts";

export type { Pt } from "./csdCoachParts.ts";

/** Native pixel edges [left, top, right, bottom] on a 0.1 m a pixel canvas. */
export type PxBox = [number, number, number, number];

/** How a design's source drawing maps onto the Factory frame (see the file header). */
export interface TramMap {
  /** Source x of the model's x = 0. */
  c: number;
  kx: number;
  ky: number;
  kz: number;
  /** Height of the side canvas (z_inc / z_dec / z_both) in source metres. */
  side: number;
  /** Height of the end canvas (x_inc / x_dec / x_both) in source metres. */
  end: number;
}

/** A body volume in source coordinates: plan (x, half width), elevation clamps (x, y), bands (y0, y1, material). */
export interface SourceVolume {
  plan: Pt[];
  top?: Pt[];
  bottom?: Pt[];
}

export const TRAM_PALETTE: Record<string, MaterialSpec> = {
  roof: { color: "#8a8d8f", roughness: 0.75 },
  frame: { color: "#b9bdbf", metallic: 0.2, roughness: 0.5 },
  glass: { color: "#26323c", metallic: 0.2, roughness: 0.15, glass: true },
  seam: { color: "#2a2c2e", roughness: 0.9 },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  bellows: { color: "#26272a", roughness: 0.95 },
  underframe: { color: "#26282a", roughness: 0.85 },
  bogie: { color: "#333538", roughness: 0.8 },
  spring: { color: "#55585c", metallic: 0.2, roughness: 0.6 },
  steel: { color: "#8c9198", metallic: 0.3, roughness: 0.45 },
  wheel: { color: "#46484b", metallic: 0.2, roughness: 0.6 },
  lampHead: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
  lampAmber: { color: "#e08a1e", roughness: 0.3, lamp: { role: "indicator" } },
  pantograph: { color: "#5b5f64", metallic: 0.3, roughness: 0.55 },
  insulator: { color: "#8a4a26", roughness: 0.4 },
  carbon: { color: "#2f3033", roughness: 0.7 },
  display: { color: "#141516", roughness: 0.4 },
  led: { color: "#e9a12a", roughness: 0.3 },
  marking: { color: "#1d1d1f", roughness: 0.6 },
  bumper: { color: "#4a2a20", roughness: 0.7 },
  roofBox: { color: "#6f7275", roughness: 0.7 },
  blue: { color: "#1048bf", roughness: 0.5 },
  white: { color: "#f2f2ee", roughness: 0.5 },
  doorGrey: { color: "#a7aaa6", roughness: 0.55 },
};

const lerp = (pts: Pt[], x: number): number => {
  if (x <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) {
    const [xa, ya] = pts[i - 1]!;
    const [xb, yb] = pts[i]!;
    if (x <= xb + 1e-9) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return pts[pts.length - 1]![1];
};

/** The polyline `pts` (ascending x) cut to a..b, its values at the cuts interpolated. */
export function clipLine(pts: Pt[], a: number, b: number): Pt[] {
  const inner = pts.filter(([x]) => x > a + 1e-6 && x < b - 1e-6);
  return [[a, lerp(pts, a)], ...inner, [b, lerp(pts, b)]];
}

/**
 * The two intersections of the circles about `a` (radius ra) and `b` (radius
 * rb) in a plane; the one on the side `pick` (+1 / -1) of the line a -> b.
 * A pantograph's knee, given its two arms' lengths.
 */
export function knee(a: [number, number], ra: number, b: [number, number], rb: number, pick: number): [number, number] {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy);
  const t = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - t * t));
  const mx = a[0] + (t * dx) / d;
  const my = a[1] + (t * dy) / d;
  // the left normal of a -> b is (-dy, dx)
  return [mx - (pick * h * dy) / d, my + (pick * h * dx) / d];
}

export class Tram extends Coach {
  constructor(palette: Record<string, MaterialSpec>, readonly map: TramMap) {
    super({ ...TRAM_PALETTE, ...palette }, 0);
  }

  /**
   * The coach builder's side panel, its pieces split at the plan's stations and
   * the section's corners -- but each split moved by half the panel's `proud`.
   * A door's seam, its leaf and the frame of a light inside it are closed slabs
   * of different materials; split at one plane, their hidden end faces would
   * coincide and fight (coplanar.ts). The offset keeps the pieces within a
   * millimetre of the skin.
   */
  override sidePanel(v: Volume, mat: string, s: number, b: Box, proud: number, depth = 0.04): void {
    const hw0 = Math.max(...v.section.map((p) => Math.abs(p[0])));
    const ys0 = v.section.map((p) => p[1]);
    const [minY, maxY] = [Math.min(...ys0), Math.max(...ys0)];
    const mid = (b.x0 + b.x1) / 2;
    const yLo = Math.max(minY, v.bottom ? lerp(v.bottom, mid) : -Infinity);
    const yHi = Math.min(maxY, v.top ? lerp(v.top, mid) : Infinity);
    const nudge = (val: number, edge: number, dir: number) => (Math.abs(val - edge) < 1e-6 ? val + dir * 0.005 : val);
    const xA = nudge(b.x0, v.plan[0]![0], 1);
    const xB = nudge(b.x1, v.plan[v.plan.length - 1]![0], -1);
    const yA = nudge(b.y0, yLo, 1);
    const yB = nudge(b.y1, yHi, -1);
    const shift = proud / 2;
    const xs = [xA, ...v.plan.map((p) => p[0] + shift).filter((x) => x > xA + 1e-6 && x < xB - 1e-6), xB];
    const ys = [yA, ...ys0.map((y) => y + shift).filter((y) => y > minY + 1e-6 && y < maxY - 1e-6 && y > yA + 1e-6 && y < yB - 1e-6), yB].sort((a, c) => a - c);
    const surf = (x: number, y: number): Vec3 => {
      const yy = Math.min(maxY - 1e-6, Math.max(minY + 1e-6, y));
      return [x, y, s * ((sectionHalf(v.section, yy) * lerp(v.plan, x)) / hw0 + proud)];
    };
    for (let i = 0; i + 1 < xs.length; i++)
      for (let j = 0; j + 1 < ys.length; j++) {
        const [x0, x1, y0, y1] = [xs[i]!, xs[i + 1]!, ys[j]!, ys[j + 1]!];
        this.m.slab(mat, [surf(x0, y0), surf(x1, y0), surf(x1, y1), surf(x0, y1)], [0, 0, -s * depth]);
      }
  }

  /** Source x, y, z to Factory. */
  fx(x: number): number {
    return (this.map.c - x) * this.map.kx;
  }
  fy(y: number): number {
    return y * this.map.ky;
  }
  fz(z: number): number {
    return -z * this.map.kz;
  }

  /** A side-view box in native pixels as a Factory box (x along, y up). */
  box(b: PxBox): Box {
    const H = this.map.side;
    return { x0: this.fx(b[2] / 10), x1: this.fx(b[0] / 10), y0: this.fy(H - b[3] / 10), y1: this.fy(H - b[1] / 10) };
  }

  /** An end-view box in native pixels (a 3 m wide canvas, source z from -1.5) as Factory (z across, y up). */
  endBox(b: PxBox): Box {
    const H = this.map.end;
    const za = this.fz(b[0] / 10 - 1.5);
    const zb = this.fz(b[2] / 10 - 1.5);
    return { x0: Math.min(za, zb), x1: Math.max(za, zb), y0: this.fy(H - b[3] / 10), y1: this.fy(H - b[1] / 10) };
  }

  /** The convex XML section (z, y) in Factory metres. */
  section(s: Pt[]): Pt[] {
    return s.map(([z, y]) => [z * this.map.kz, this.fy(y)]);
  }

  /**
   * A Factory volume from source profiles cut to the source x range a..b, with
   * its bands in source heights.
   */
  vol(name: string, section: Pt[], src: SourceVolume, a: number, b: number, bands: Array<[number, number, string]>): Volume {
    const flip = (pts: Pt[], k: (v: number) => number): Pt[] => clipLine(pts, a, b).map(([x, v]): Pt => [this.fx(x), k(v)]).reverse();
    return {
      name,
      section: this.section(section),
      plan: flip(src.plan, (h) => h * this.map.kz),
      ...(src.top ? { top: flip(src.top, (y) => this.fy(y)) } : {}),
      ...(src.bottom ? { bottom: flip(src.bottom, (y) => this.fy(y)) } : {}),
      bands: bands.map(([y0, y1, mat]) => [this.fy(y0), this.fy(y1), mat]),
    };
  }

  /** Framed windows on side s of v, one per native box; `sash` the source height of a horizontal bar. */
  windows(v: Volume, s: number, list: PxBox[], opts: { glass?: string; frame?: string; fw?: number; sash?: number } = {}): void {
    list.forEach((b, i) =>
      this.m.scope(`window ${i + 1}`, () =>
        this.window(v, s, this.box(b), { glass: opts.glass, frame: opts.frame, fw: opts.fw ?? 0.05, sash: opts.sash === undefined ? undefined : this.fy(opts.sash) }),
      ),
    );
  }

  /**
   * Folding doors on side s: the seam over the native box, the leaves in
   * `paint`, and one glazed light per leaf (`leaves` light boxes). With `opens`
   * (a motion, or one per door) they open, the lights riding on the leaves.
   */
  doors(v: Volume, s: number, list: Array<{ box: PxBox; lights: PxBox[] }>, paint: string, opts: { frame?: string; glass?: string; sash?: number; opens?: DoorMotion | ((d: { box: PxBox; lights: PxBox[] }) => DoorMotion) } = {}): void {
    const light = (b: Box) => this.window(v, s, b, { frame: opts.frame, glass: opts.glass, fw: 0.035, sash: opts.sash === undefined ? undefined : this.fy(opts.sash) });
    list.forEach((d, i) =>
      this.m.scope(`door ${i + 1}`, () => {
        if (opts.opens) {
          // the lights ride on the leaves (doors.ts)
          this.door(v, s, this.box(d.box), paint, {
            opens: typeof opts.opens === "function" ? opts.opens(d) : opts.opens,
            leafWork: (clip) =>
              d.lights.forEach((g, k) => {
                const b = clip(this.box(g));
                if (b) this.m.scope(`light ${k + 1}`, () => light(b));
              }),
          });
          return;
        }
        this.door(v, s, this.box(d.box), paint);
        d.lights.forEach((g, k) => this.m.scope(`light ${k + 1}`, () => light(this.box(g))));
      }),
    );
  }

  /** The doorways of `doors`' list on side s, for the volume they open into (`Volume.openings`). */
  doorOpenings(s: number, list: Array<{ box: PxBox }>): Opening[] {
    return list.map((d) => this.doorOpening(s, this.box(d.box)));
  }

  /** A painted side panel (a livery patch) over a native box, on side s. */
  paint(v: Volume, s: number, mat: string, b: PxBox, proud = 0.004): void {
    this.sidePanel(v, mat, s, this.box(b), proud, 0.003);
  }

  /** A painted end panel over an end-view native box, on end e (+1 front). */
  endPaint(v: Volume, e: number, mat: string, b: PxBox, proud = 0.004): void {
    this.endPanel(v, mat, e, this.endBox(b), proud, 0.003);
  }

  /**
   * The Factory x of v's end surface at |z| on end e: the end cap within its
   * half width, else the plan's tapered corner where its half width reaches |z|.
   */
  endX(v: Volume, e: number, z: number): number {
    const plan = e > 0 ? [...v.plan].reverse() : v.plan;
    const a = Math.abs(z);
    if (a <= plan[0]![1]) return plan[0]![0];
    for (let i = 1; i < plan.length; i++) {
      const [xa, ha] = plan[i - 1]!;
      const [xb, hb] = plan[i]!;
      if (a <= hb + 1e-9) return xa + ((a - ha) / Math.max(1e-9, hb - ha)) * (xb - xa);
    }
    return plan[plan.length - 1]![0];
  }

  /** A round lamp on end e at end-view pixel centre (u, v), housing and lens, on the end surface of v. */
  lamp(v: Volume, e: number, u: number, vv: number, r: number, lens: string): void {
    const z = this.fz(u / 10 - 1.5);
    // the surface may slope across the housing: seat it at its deeper edge
    const xEnd = e > 0 ? Math.min(this.endX(v, e, z - r), this.endX(v, e, z + r)) : Math.max(this.endX(v, e, z - r), this.endX(v, e, z + r));
    const y = this.fy(this.map.end - vv / 10);
    const housing = ngon(12, r * 1.3, 0, z, y);
    this.m.sweep("underframe", "x", housing, xEnd - e * 0.01, housing, xEnd + e * 0.03);
    const glass = ngon(12, r, 0, z, y);
    this.m.sweep(lens, "x", glass, xEnd + e * 0.03, glass, xEnd + e * 0.045);
  }

  /**
   * A round lamp on end e of v at Factory (z, y), facing out of the surface where
   * it sits -- the end cap, or a tapered corner of the plan, where `lamp()`'s lamp
   * along x would sink into the slope: housing and lens are rods along the
   * surface's normal, the lens's back inside the housing.
   */
  cornerLamp(v: Volume, e: number, z: number, y: number, r: number, lens: string): void {
    const plan = e > 0 ? [...v.plan].reverse() : v.plan;
    const a = Math.abs(z);
    const s = Math.sign(z);
    // the plan's segment at |z|: the end cap's normal is +-x
    let n: [number, number] = [e, 0];
    for (let i = 1; i < plan.length; i++) {
      const [xa, ha] = plan[i - 1]!;
      const [xb, hb] = plan[i]!;
      if (a > ha + 1e-9 && a <= hb + 1e-9) {
        // the outward normal of the segment (x, s * h) in the x-z plane
        const [dx, dz] = [xb - xa, s * (hb - ha)];
        const len = Math.hypot(dx, dz);
        n = [dz / len, -dx / len];
        // the one pointing out of the end and the side
        if (n[0] * e + n[1] * s < 0) n = [-n[0], -n[1]];
        break;
      }
    }
    const x = this.endX(v, e, z);
    const at = (d: number): Vec3 => [x + n[0] * d, y, z + n[1] * d];
    this.m.rod("underframe", at(-0.01), at(0.03), r * 1.3, 12);
    this.m.rod(lens, at(0.025), at(0.045), r, 12);
  }

  /**
   * A small rectangular lamp laid on side s of v -- a direction indicator on a cab
   * corner or a side repeater: a dark housing over the Factory box `b` (x along, y
   * up) and the lens inset in front of it. It follows the plan, so it sits on a
   * tapered cab corner as on the straight side. Keep the box clear of windows: the
   * housing stands 10 mm off the skin, the lens 20 mm (its back inside the housing).
   */
  sideLamp(v: Volume, s: number, b: Box, lens = "lampAmber"): void {
    this.sidePanel(v, "rubber", s, b, 0.01, 0.03);
    const k = 0.008;
    this.sidePanel(v, lens, s, { x0: b.x0 + k, x1: b.x1 - k, y0: b.y0 + k, y1: b.y1 - k }, 0.02, 0.012);
  }

  /**
   * A box on the end e of v at end-view pixels `b`, standing `out` proud of the
   * end at source x `at` (a destination sign, a bumper): drawn as a block.
   */
  endBlock(e: number, mat: string, b: PxBox, at: number, depth: number, out = 0): void {
    const eb = this.endBox(b);
    const x = this.fx(at) + e * out;
    const [x0, x1] = [x, x - e * depth].sort((p, q) => p - q) as [number, number];
    block(this.m, mat, x0, x1, eb.y0, eb.y1, eb.x0, eb.x1);
  }

  /** A roof box over source x0..x1 (y0..y1 source heights), `half` metres across each side of the centre line. */
  roofBox(mat: string, x0: number, x1: number, y0: number, y1: number, half: number, chamfer = 0.06): void {
    const [a, b] = [this.fx(x1), this.fx(x0)];
    const ya = this.fy(y0);
    const yb = this.fy(y1);
    const c = Math.min(chamfer, (yb - ya) / 2, half / 2);
    const s: Ring = [[-half, ya], [half, ya], [half, yb - c], [half - c, yb], [-half + c, yb], [-half, yb - c]];
    this.m.sweep(mat, "x", s, a, s, b);
  }

  /** A tram bogie at source x, wheelset centres `wb` apart (Factory metres), wheels of radius r, its bolster up to Factory `top`. */
  tramBogie(x: number, wb: number, r: number, top: number): void {
    this.m.bogie(() => this.tramBogieGeometry(x, wb, r, top));
  }

  private tramBogieGeometry(x: number, wb: number, r: number, top: number): void {
    this.bogie(this.fx(x), wb, r, top);
    // the traction motors and their drum brakes between the wheelsets
    const m = this.m;
    const ay = r * Math.cos(Math.PI / 24);
    const xc = this.fx(x);
    m.scope("motors", () => {
      for (const s of [-1, 1]) {
        const motor = ngon(10, 0.17, 0, xc + s * 0.33, ay + 0.02);
        m.sweep("bogie", "z", motor, -0.42, motor, 0.42);
      }
    });
  }

  /**
   * A central coupler on end e: the drawbar from Factory x `root` (under the
   * body) out to the head at `head`, at Factory height y.
   */
  coupler(e: number, root: number, head: number, y: number): void {
    const m = this.m;
    const [a, b] = [root, head - e * 0.08].sort((p, q) => p - q) as [number, number];
    block(m, "underframe", a, b, y - 0.05, y + 0.05, -0.05, 0.05);
    const [c, d] = [head - e * 0.08, head].sort((p, q) => p - q) as [number, number];
    block(m, "steel", c, d, y - 0.1, y + 0.08, -0.11, 0.11);
  }

  /**
   * A diamond (double-arm) pantograph centred at Factory x `xc` on a roof at
   * Factory `roof`, its collector at Factory height `head`: two rhombic frames, the
   * knees `reach` either side of the centre. Raised to the contact wire unless
   * `folded`; a raised one is a `liftable` mechanism the game lowers and raises,
   * folding down as far as its frames allow (diamondFolded).
   */
  diamond(xc: number, roof: number, head: number, opts: { base?: number; reach?: number; frameZ?: number; bow?: number; folded?: boolean } = {}): void {
    const folded = diamondFolded(roof, opts);
    if (opts.folded) diamondAt(this.m, xc, roof, folded, opts);
    else liftable(this.m, "pantograph", (mm, lift) => diamondAt(mm, xc, roof, folded + (head - folded) * lift, opts));
  }

  /**
   * A single-arm pantograph: its hinge at Factory x `xh`, the knee pointing
   * toward `dir` (+1 / -1 along x), the collector above `xc` at Factory `head`,
   * raised -- a `liftable` mechanism folding down to 0.5 m over the roof.
   */
  singleArm(xh: number, xc: number, dir: number, roof: number, head: number, bow = 0.8): void {
    const folded = roof + 0.5;
    liftable(this.m, "pantograph", (mm, lift) => singleArmAt(mm, xh, xc, dir, roof, folded + (head - folded) * lift, bow));
  }
}

type DiamondOpts = { base?: number; reach?: number; frameZ?: number; bow?: number };

/**
 * A diamond pantograph's frames at a collector height `head`: the base frame's
 * height, the collector's lift above it and each half's knee (x outward from the
 * centre, y above the base) -- the arm lengths fixed by the design pose (knees
 * at mid height of a 2.2 m lift, `reach` out).
 */
function diamondFrame(roof: number, head: number, opts: DiamondOpts): { base: number; lift: number; knee: [number, number]; bx: number; hx: number } {
  const base = roof + 0.22; // the base frame, on insulators
  const bx = opts.base ?? 0.5; // lower pivots, either side of the centre
  const hx = 0.14; // upper pivots under the head
  const reach = opts.reach ?? 1.2; // the knees when raised to 5.5 m above a 3.3 m base
  const lift0 = 2.2;
  const lower = Math.hypot(reach - bx, lift0 * 0.5);
  const upper = Math.hypot(reach - hx, lift0 * 0.5);
  const lift = head - base - 0.1;
  // in the half's own frame (x outward from the centre) the knee is outside the line
  return { base, lift, knee: knee([bx, 0.02], lower, [hx, lift], upper, -1), bx, hx };
}

/**
 * The lowest collector height a diamond pantograph folds to: the lowest at which
 * its knees still stand below the collector, a centimetre at a time -- lower than
 * that the fixed-length frames would cross over into a V.
 */
export function diamondFolded(roof: number, opts: DiamondOpts): number {
  for (let head = roof + 0.4; ; head += 0.01) {
    const f = diamondFrame(roof, head, opts);
    if (f.knee[1] <= f.lift - 0.08) return Math.round(head * 100) / 100;
  }
}

function diamondAt(m: MeshBuilder, xc: number, roof: number, head: number, opts: DiamondOpts): void {
  const fz = opts.frameZ ?? 0.36;
  const bow = opts.bow ?? 0.85;
  const { base, lift, knee: k, bx, hx } = diamondFrame(roof, head, opts);
  m.scope("base", () => {
    for (const s of [-1, 1]) block(m, "pantograph", xc - 0.62, xc + 0.62, base - 0.04, base, s * fz - 0.03, s * fz + 0.03);
    for (const dx of [-0.55, 0.55]) block(m, "pantograph", xc + dx - 0.03, xc + dx + 0.03, base - 0.04, base, -fz - 0.03, fz + 0.03);
    for (const dx of [-0.5, 0.5])
      for (const s of [-1, 1]) m.prism("insulator", ngon(8, 0.05, 0, xc + dx, s * fz), roof - 0.01, base - 0.04);
  });
  m.scope("frames", () => {
    for (const d of [-1, 1]) {
      for (const s of [-1, 1]) {
        m.rod("pantograph", [xc + d * bx, base + 0.02, s * fz], [xc + d * k[0], base + k[1], s * fz], 0.022, 6);
        m.rod("pantograph", [xc + d * k[0], base + k[1], s * fz], [xc + d * hx, base + lift, s * 0.12], 0.018, 6);
      }
      // the knee's cross tube
      const kt = ngon(6, 0.02, 0, xc + d * k[0], base + k[1]);
      m.sweep("pantograph", "z", kt, -fz - 0.02, kt, fz + 0.02);
    }
  });
  m.scope("collector", () => {
    const y = base + lift;
    block(m, "pantograph", xc - hx - 0.03, xc + hx + 0.03, y - 0.03, y + 0.02, -0.16, 0.16);
    // the bow: a carbon strip on a pan, its ends bent down into horns
    block(m, "pantograph", xc - 0.07, xc + 0.07, y + 0.02, y + 0.07, -bow, bow);
    block(m, "carbon", xc - 0.05, xc + 0.05, y + 0.07, y + 0.1, -bow + 0.05, bow - 0.05);
    for (const s of [-1, 1]) {
      const horn: Ring = [[-0.035, y + 0.07], [0.035, y + 0.07], [0.035, y - 0.13], [-0.035, y - 0.13]];
      const tip = horn.map(([u, v]): [number, number] => [u, v - 0.06]);
      const [a0, a1] = s > 0 ? [bow, bow + 0.16] : [-bow - 0.16, -bow];
      m.sweep("pantograph", "z", s > 0 ? horn.map(([u, v]) => [u + xc, v]) : tip.map(([u, v]) => [u + xc, v]), a0, s > 0 ? tip.map(([u, v]) => [u + xc, v]) : horn.map(([u, v]) => [u + xc, v]), a1);
    }
  });
}

function singleArmAt(m: MeshBuilder, xh: number, xc: number, dir: number, roof: number, head: number, bow: number): void {
  const base = roof + 0.2;
  const lower = 1.45;
  const upper = 1.6;
  const lift = head - base - 0.11; // the carbon strip's top at head
  // the left normal of hinge -> head points to -x, so a knee toward +x is on the right
  const k = knee([xh, base + 0.08], lower, [xc, base + lift], upper, -dir);
  m.scope("base", () => {
    for (const s of [-1, 1]) block(m, "pantograph", Math.min(xh, xc) - 0.35, Math.max(xh, xc) + 0.35, base - 0.04, base, s * 0.32 - 0.03, s * 0.32 + 0.03);
    for (const dx of [Math.min(xh, xc) - 0.25, Math.max(xh, xc) + 0.25])
      for (const s of [-1, 1]) m.prism("insulator", ngon(8, 0.045, 0, dx, s * 0.32), roof - 0.01, base - 0.04);
    const shaft = ngon(8, 0.035, 0, xh, base + 0.08);
    m.sweep("pantograph", "z", shaft, -0.34, shaft, 0.34);
  });
  m.scope("arms", () => {
    for (const s of [-1, 1]) m.rod("pantograph", [xh, base + 0.08, s * 0.22], [k[0], k[1], s * 0.05], 0.03, 6);
    const kt = ngon(6, 0.03, 0, k[0], k[1]);
    m.sweep("pantograph", "z", kt, -0.08, kt, 0.08);
    for (const s of [-1, 1]) m.rod("pantograph", [k[0], k[1], s * 0.04], [xc, base + lift, s * 0.25], 0.018, 6);
  });
  m.scope("collector", () => {
    const y = base + lift;
    block(m, "pantograph", xc - 0.06, xc + 0.06, y - 0.03, y + 0.03, -0.3, 0.3);
    block(m, "pantograph", xc - 0.06, xc + 0.06, y + 0.03, y + 0.08, -bow, bow);
    block(m, "carbon", xc - 0.045, xc + 0.045, y + 0.08, y + 0.11, -bow + 0.05, bow - 0.05);
    for (const s of [-1, 1]) {
      const [a0, a1] = s > 0 ? [bow, bow + 0.14] : [-bow - 0.14, -bow];
      const horn: Ring = [[xc - 0.03, y + 0.08], [xc + 0.03, y + 0.08], [xc + 0.03, y - 0.08], [xc - 0.03, y - 0.08]];
      m.sweep("pantograph", "z", horn, a0, horn, a1);
    }
  });
}

/** One rigid section of an articulated tram, in Factory x (front end x1 > rear end x0). */
export interface TramSection {
  x0: number;
  x1: number;
  draw: () => void;
}

/**
 * Draws an articulated tram: every section a part ("section0" front first, its
 * pivot the hinge with the section ahead, at `hingeY` in the middle of the gap
 * unless `hinges` gives each hinge's x -- a Jacobs bogie's centre),
 * then every bellows a part of its own, and sets the rig. See vehicle-rig.md.
 */
export function articulate(t: { m: MeshBuilder }, sections: TramSection[], hingeY: number, bellows: { profile: Array<[number, number]>; folds: number; depth: number }, maxBendDeg: number, hinges?: number[]): VehicleRig {
  const m = t.m;
  const rigSections: SectionRig[] = sections.map((s, i) => ({
    node: `section${i}`,
    pivot: i === 0 ? [0, 0, 0] : [hinges?.[i - 1] ?? (sections[i - 1]!.x0 + s.x1) / 2, hingeY, 0],
  }));
  sections.forEach((s, i) => m.part(rigSections[i]!.node, rigSections[i]!.pivot as Vec3, s.draw));
  const joints: JointRig[] = [];
  for (let i = 0; i + 1 < sections.length; i++) {
    const j: JointRig = {
      node: `joint${i}`,
      sections: [i, i + 1],
      front: sections[i]!.x0,
      rear: sections[i + 1]!.x1,
      profile: bellows.profile,
      folds: bellows.folds,
      depth: bellows.depth,
      material: "bellows",
    };
    joints.push(j);
    m.part(j.node, [0, 0, 0], () => m.scope("bellows", () => drawJoint(m, j, rigSections)));
  }
  const rig: VehicleRig = { sections: rigSections, joints, maxBendDeg };
  m.rig = rig;
  return rig;
}
