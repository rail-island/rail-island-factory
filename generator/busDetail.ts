// The fine detail every procedural bus built by assembleBus carries (busAssembly.ts):
// lathe-turned wheels with a tyre's bevelled shoulders, a dished steel rim, wheel
// nuts and a hub cap; a rubber trim round each wheel arch; mudflaps behind the
// rear wheels; amber side markers between the axles; and the route displays in
// the first right-hand window and the rear window. Spent from the 10,000-triangle
// road-vehicle budget where the game's camera sees it: the wheels and the sides.
// See docs/models/buses.md.

import { ngon, type MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { archOutline, halfWidth, type Arch } from "./busBody.ts";
import { AXLE_FACTOR, bentSlab, endSlab, sideSlab, type BusFrame } from "./busKit.ts";
import { grown, type JointRig } from "./rig.ts";
import { block } from "./vehicleParts.ts";

/** The materials the detail adds to a bus's palette. */
export const BUS_DETAIL_PALETTE: Record<string, MaterialSpec> = {
  // side markers: amber, but never blinking (no lamp role)
  marker: { color: "#ff9a2e", roughness: 0.3 },
  archTrim: { color: "#202124", roughness: 0.85 },
  nut: { color: "#7d8187", metallic: 0.4, roughness: 0.4 },
  // rear reflectors: red, but never lit (no lamp role)
  reflector: { color: "#a3141e", roughness: 0.35 },
};

/** One triangle a, b, c, wound to face along `out`; nothing if it has no area. */
function orient(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, out: Vec3): void {
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nn: Vec3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  if (Math.hypot(nn[0], nn[1], nn[2]) < 1e-10) return;
  if (nn[0] * out[0] + nn[1] * out[1] + nn[2] * out[2] >= 0) m.tri(mat, a, b, c);
  else m.tri(mat, a, c, b);
}

/** How many sides a wheel is turned with: the tyre's 16-gon, a flat side down. */
const WHEEL_SIDES = 16;

/**
 * A solid of revolution about the axis through (x, y) along z: the profile's
 * points are (w, r) -- w outward from `z0` toward the wheel's face `face` (+1 or
 * -1), r from the axis -- and segment i is painted mats[i]. The profile runs from
 * the axis round to the axis, so the solid is closed; its corners stand at the
 * tyre's 16-gon angles, a flat side down.
 */
function lathe(m: MeshBuilder, x: number, y: number, z0: number, face: number, profile: Array<[number, number]>, mats: string[]): void {
  const n = WHEEL_SIDES;
  const ang = (j: number): number => -Math.PI / 2 + Math.PI / n + (2 * Math.PI * j) / n;
  const P = (j: number, w: number, r: number): Vec3 => [x + r * Math.cos(ang(j)), y + r * Math.sin(ang(j)), z0 + face * w];
  // the profile's winding in (w, r), closed along the axis: outward is to its right or left
  let area = 0;
  for (let i = 0; i < profile.length; i++) {
    const [a0, b0] = profile[i]!;
    const [a1, b1] = profile[(i + 1) % profile.length]!;
    area += a0 * b1 - a1 * b0;
  }
  const sgn = area > 0 ? 1 : -1;
  for (let i = 0; i + 1 < profile.length; i++) {
    const [w0, r0] = profile[i]!;
    const [w1, r1] = profile[i + 1]!;
    // the segment's outward normal in (w, r)
    const [nw, nr] = [sgn * (r1 - r0), -sgn * (w1 - w0)];
    for (let j = 0; j < n; j++) {
      const mid = (ang(j) + ang(j + 1)) / 2;
      const out: Vec3 = [nr * Math.cos(mid), nr * Math.sin(mid), face * nw];
      const a = P(j, w0, r0);
      const b = P(j + 1, w0, r0);
      const c = P(j + 1, w1, r1);
      const d = P(j, w1, r1);
      orient(m, mats[i]!, a, b, c, out);
      orient(m, mats[i]!, a, c, d, out);
    }
  }
}

/**
 * A detailed wheel at axle x, its tyre spanning z0..z1. The tyre's shoulders are
 * bevelled; a wheel seen from outside (`face` +1 or -1, its outer side) shows its
 * sidewall and, in the tyre's bore, a dished steel rim with `nuts` wheel nuts round
 * the hub and a hub cap at most 3 cm proud of the tyre (within the plain wheel's
 * 4 cm, busKit.ts busWheel). An inner twin (`face` null) is the plain 16-gon.
 *
 * The rim, hub and nuts are what the eye follows round, so they are drawn as the
 * rolling part `spin` (rolling.ts, MeshCore.spin) on the wheel's axle, turned by the
 * bus's `rolling` clip; the tyre, rings about the axle, stays with the part that
 * carries the wheel.
 */
export function detailedBusWheel(m: MeshBuilder, x: number, radius: number, z0: number, z1: number, face: number | null, spin?: string, nuts = 10): void {
  const R = radius;
  const y = R * AXLE_FACTOR;
  const W = z1 - z0;
  const c = Math.min(0.035, W * 0.15);
  if (face === null) {
    // hidden behind its outer twin: the plain 16-gon
    const tyre = ngon(WHEEL_SIDES, R, Math.PI / WHEEL_SIDES, x, y);
    m.sweep("rubber", "z", tyre, z0, tyre, z1);
    return;
  }
  // drawn from its inner face outward
  const f = face;
  const zi = f > 0 ? z0 : z1;
  // the tyre: a ring with a bore the rim sits in
  const bore = 0.64 * R;
  lathe(m, x, y, zi, f, [[0, bore], [0, 0.9 * R], [c, R], [W - c, R], [W, 0.9 * R], [W, bore], [0, bore]], ["rubber", "rubber", "rubber", "rubber", "rubber", "rubber"]);
  const rim = (): void => {
    lathe(m, x, y, zi, f, [
      // the rim's back and its flange, reaching into the tyre past the bore
      [W - 0.07, 0], [W - 0.07, 0.65 * R], [W - 0.008, 0.65 * R],
      // its dish, sunk into the tyre's face
      [W - 0.03, 0.56 * R], [W - 0.05, 0.52 * R], [W - 0.05, 0.29 * R],
      // the hub, proud of the face
      [W - 0.02, 0.24 * R], [W + 0.03, 0.18 * R], [W + 0.03, 0],
    ], ["rim", "rim", "rim", "rim", "rim", "hub", "hub", "hub"]);
    // the wheel nuts on the dish, sunk into it
    const zf = zi + f * W;
    for (let k = 0; k < nuts; k++) {
      const a = (2 * Math.PI * k) / nuts;
      const cx = x + 0.4 * R * Math.cos(a);
      const cy = y + 0.4 * R * Math.sin(a);
      // a hexagonal prism, its back hidden in the dish: six sides and the face
      const hex: Vec3[] = [];
      for (let i = 0; i < 6; i++) hex.push([cx + 0.022 * Math.cos(a + (i * Math.PI) / 3), cy + 0.022 * Math.sin(a + (i * Math.PI) / 3), zf - f * 0.028]);
      const back = hex.map(([px, py]): Vec3 => [px, py, zf - f * 0.056]);
      const out = (i: number): Vec3 => [Math.cos(a + ((i + 0.5) * Math.PI) / 3), Math.sin(a + ((i + 0.5) * Math.PI) / 3), 0];
      for (let i = 0; i < 6; i++) {
        const j = (i + 1) % 6;
        orient(m, "nut", hex[i]!, hex[j]!, back[j]!, out(i));
        orient(m, "nut", hex[i]!, back[j]!, back[i]!, out(i));
      }
      for (let i = 1; i < 5; i++) orient(m, "nut", hex[0]!, hex[i]!, hex[i + 1]!, [0, 0, f]);
    }
  };
  if (spin) m.spin(spin, [x, y, (z0 + z1) / 2], rim);
  else rim();
}

/** The z range a..b (both >= 0) on side `s`, low end first. */
const onSide = (s: number, a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);

/** What the detail needs to know of a bus beyond its frame. */
export interface DetailBus {
  frame: BusFrame;
  arches: Arch[];
  /** The rear (not steered) axles' x and their tyres' inner z. */
  rear: Array<{ x: number; inner: number }>;
  /** The doorways, which the trims and markers keep clear of. */
  doorways: Array<{ s: number; x0: number; x1: number }>;
  /** Side glass (`s`, x and y ranges) and end glass (`end`, z and y ranges), as noted for the distant model. */
  glass: Array<{ s: number; x: [number, number]; y: [number, number] }>;
  ends: Array<{ end: number; z: [number, number]; y: [number, number] }>;
}

/**
 * A rubber trim round arch `a` on side `s`: a strip 4.5 cm wide a centimetre
 * proud of the shell, from the rear foot round the crown to the front foot, 5 mm
 * outside the notch so it never covers the opening.
 */
function archTrim(m: MeshBuilder, f: BusFrame, s: number, a: Arch): void {
  const bottom = Math.min(...f.section.map(([, y]) => y)) + 0.03;
  const line: Array<[number, number]> = [[a.x - a.half, bottom], ...archOutline(a), [a.x + a.half, bottom]];
  // the outward (away from the opening) normal of each segment, then of each corner
  const segN = line.slice(0, -1).map(([x0, y0], i) => {
    const [x1, y1] = line[i + 1]!;
    const l = Math.hypot(x1 - x0, y1 - y0);
    return [-(y1 - y0) / l, (x1 - x0) / l] as [number, number];
  });
  const proud = 0.012;
  const at = (x: number, y: number): Vec3 => [x, y, s * (halfWidth(f.section, y) + proud)];
  const rows: Array<[Vec3, Vec3]> = line.map(([x, y], i) => {
    const na = segN[Math.max(0, i - 1)]!;
    const nb = segN[Math.min(segN.length - 1, i)]!;
    let [nx, ny] = [na[0] + nb[0], na[1] + nb[1]];
    const l = Math.hypot(nx, ny);
    [nx, ny] = [nx / l, ny / l];
    // a mitre: as wide along the corner's normal as the strip is across its segments
    const k = 1 / Math.max(0.5, nx * nb[0] + ny * nb[1]);
    return [at(x + nx * 0.005 * k, y + ny * 0.005 * k), at(x + nx * 0.05 * k, y + ny * 0.05 * k)];
  });
  bentSlab(m, "archTrim", rows, [0, 0, -s * (proud + 0.03)]);
}

/** Draws the detail of the section lo..hi: its arches' trims and mudflaps, the markers between its arches. */
export function drawBusDetail(m: MeshBuilder, b: DetailBus, lo: number, hi: number): void {
  const f = b.frame;
  const clearOfDoors = (s: number, x0: number, x1: number): boolean => b.doorways.every((d) => d.s !== s || x1 < d.x0 - 0.05 || x0 > d.x1 + 0.05);
  const arches = b.arches.filter((a) => a.x >= lo && a.x <= hi).sort((p, q) => p.x - q.x);
  m.scope("arch trims", () => {
    for (const a of arches) for (const s of [-1, 1]) {
      if (clearOfDoors(s, a.x - a.half - 0.06, a.x + a.half + 0.06)) archTrim(m, f, s, a);
    }
  });
  m.scope("mudflaps", () => {
    for (const r of b.rear) {
      if (r.x < lo || r.x > hi) continue;
      const a = b.arches.find((q) => Math.abs(q.x - r.x) < 1e-6);
      if (!a) continue;
      const hw = halfWidth(f.section, a.side);
      // hung from the arch's rear wall, sunk 1.5 cm into it, behind the tyres
      for (const s of [-1, 1]) block(m, "rubber", a.x - a.half - 0.015, a.x - a.half + 0.012, 0.16, a.side, ...onSide(s, r.inner - 0.02, hw - 0.03));
    }
  });
  m.scope("side markers", () => {
    for (let i = 0; i + 1 < arches.length; i++) {
      const [p, q] = [arches[i]!, arches[i + 1]!];
      const gap = [p.x + p.half + 0.1, q.x - q.half - 0.1];
      if (gap[1]! - gap[0]! < 1.2) continue;
      const x = (gap[0]! + gap[1]!) / 2;
      const y = Math.min(p.side, q.side) - 0.08;
      for (const s of [-1, 1]) if (clearOfDoors(s, x - 0.06, x + 0.06)) sideSlab(m, "marker", f, s, x - 0.05, x + 0.05, y - 0.03, y + 0.03, 0.014);
    }
  });
}

/**
 * The route displays: in the top front corner of the frontmost right-hand window
 * of the section lo..hi, if it has the bus's frontmost one, and in the top right
 * corner of the rear window (`tail` the section's rear is the bus's).
 */
export function drawRouteDisplays(m: MeshBuilder, b: DetailBus, lo: number, hi: number): void {
  const right = b.glass.filter((g) => g.s > 0 && g.x[1] - g.x[0] > 0.9).sort((p, q) => q.x[1] - p.x[1])[0];
  if (right && right.x[1] >= lo && right.x[1] <= hi) m.scope("side route display", () => {
    const [x1, y1] = [right.x[1] - 0.04, right.y[1] - 0.04];
    const h = Math.min(0.24, (right.y[1] - right.y[0]) * 0.4);
    sideSlab(m, "sign", b.frame, 1, x1 - 0.72, x1, y1 - h, y1, 0.034);
    sideSlab(m, "signText", b.frame, 1, x1 - 0.64, x1 - 0.08, y1 - h * 0.68, y1 - h * 0.32, 0.038);
  });
  const sideXs = b.frame.side.map(([x]) => x);
  const tail = Math.min(...sideXs);
  const rear = b.ends.find((e) => e.end < 0);
  if (rear && tail >= lo - 1e-6 && tail <= hi) m.scope("rear route display", () => {
    const [z1, y1] = [rear.z[1] - 0.06, rear.y[1] - 0.04];
    const h = Math.min(0.22, (rear.y[1] - rear.y[0]) * 0.45);
    endSlab(m, "sign", b.frame, -1, z1 - 0.5, z1, y1 - h, y1, 0.03);
    endSlab(m, "signText", b.frame, -1, z1 - 0.42, z1 - 0.08, y1 - h * 0.7, y1 - h * 0.3, 0.034);
  });
}

// --- the joint --------------------------------------------------------------------------

/** The bellows' fold pitch, metres a ridge (photographs of a Karosa B 941: about 25 over 1.9 m). */
const FOLD_PITCH = 0.075;
/** The frame ring round the bellows' middle: its width and how far it stands out of the valleys. */
const JOINT_FRAME = { width: 0.07, extra: 0.02 };

/**
 * The bellows' outline with its upper corners rounded: each corner above the floor
 * cut back along both its edges (a convex outline stays convex).
 */
function roundedProfile(profile: Array<[number, number]>): Array<[number, number]> {
  const floor = Math.min(...profile.map(([, y]) => y));
  const n = profile.length;
  const out: Array<[number, number]> = [];
  profile.forEach(([z, y], i) => {
    if (y < floor + 0.1) {
      out.push([z, y]);
      return;
    }
    const [za, ya] = profile[(i + n - 1) % n]!;
    const [zb, yb] = profile[(i + 1) % n]!;
    const la = Math.hypot(za - z, ya - y);
    const lb = Math.hypot(zb - z, yb - y);
    const c = Math.min(0.09, la / 3, lb / 3);
    out.push([z + ((za - z) * c) / la, y + ((ya - y) * c) / la], [z + ((zb - z) * c) / lb, y + ((yb - y) * c) / lb]);
  });
  return out;
}

/**
 * A confirmed bus's bellows between the section ends `front` and `rear`: the spec's
 * outline with its upper corners rounded, a ridge every FOLD_PITCH, and the frame
 * ring round its middle (rig.ts JointRig.frame).
 */
export function detailedJoint(i: number, front: number, rear: number, b: { profile: Array<[number, number]>; folds: number; depth: number }): JointRig {
  const folds = Math.max(b.folds, Math.round((front - rear - JOINT_FRAME.width) / FOLD_PITCH));
  return {
    node: `joint${i}`,
    sections: [i, i + 1],
    front, rear,
    profile: roundedProfile(b.profile),
    folds,
    depth: b.depth,
    material: "bellows",
    frame: { width: JOINT_FRAME.width, depth: b.depth + JOINT_FRAME.extra },
  };
}

/**
 * The bellows' frame on a section's end at x, the gap on side `dir` (-1 behind it,
 * +1 ahead): a ring round the bellows' outline, from 1 cm inside the shell to 3 cm
 * into the gap, its outside flush with the ridges' frame, its inside within the valleys.
 */
export function jointCollar(m: MeshBuilder, j: JointRig, x: number, dir: number): void {
  const outer = grown(j.profile, j.frame!.depth - 0.008);
  const inner = grown(j.profile, -0.035);
  const [xa, xb] = [x - dir * 0.01, x + dir * 0.03];
  const n = outer.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += outer[i]![0] * outer[(i + 1) % n]![1] - outer[(i + 1) % n]![0] * outer[i]![1];
  const sgn = area > 0 ? 1 : -1;
  const P = ([z, y]: [number, number], px: number): Vec3 => [px, y, z];
  for (let i = 0; i < n; i++) {
    const i1 = (i + 1) % n;
    const [o0, o1, n0, n1] = [outer[i]!, outer[i1]!, inner[i]!, inner[i1]!];
    // the edge's outward normal in (z, y)
    const nz = sgn * (o1[1] - o0[1]);
    const ny = -sgn * (o1[0] - o0[0]);
    orient(m, "frame", P(o0, xa), P(o1, xa), P(o1, xb), [0, ny, nz]);
    orient(m, "frame", P(o0, xa), P(o1, xb), P(o0, xb), [0, ny, nz]);
    orient(m, "frame", P(n0, xa), P(n1, xa), P(n1, xb), [0, -ny, -nz]);
    orient(m, "frame", P(n0, xa), P(n1, xb), P(n0, xb), [0, -ny, -nz]);
    for (const [px, nx] of [[xb, dir], [xa, -dir]] as const) {
      orient(m, "frame", P(o0, px), P(o1, px), P(n1, px), [nx, 0, 0]);
      orient(m, "frame", P(o0, px), P(n1, px), P(n0, px), [nx, 0, 0]);
    }
  }
}

/**
 * The turntable under the hinge at x: a round dark plate about the hinge's
 * vertical, so the sections turn about it without meeting it, clear of both
 * ends of the gap `gap` and under the bellows' floor.
 */
export function turntable(m: MeshBuilder, x: number, gap: number, b: { profile: Array<[number, number]>; depth: number }): void {
  const floor = Math.min(...b.profile.map(([, y]) => y)) - b.depth;
  const r = Math.min(0.75, gap / 2 - 0.08);
  const ring = ngon(16, r, Math.PI / 16, x, 0);
  const y0 = Math.max(0.2, floor - 0.12);
  m.prism("under", ring, y0, floor - 0.02);
  // a prism has no bottom: seen from the road it needs one
  m.cap("under", ring, y0, false);
}
