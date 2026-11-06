// The fittings every procedural bus is assembled from (buses.ts): wheels,
// glazing, doors, lamps and mirrors laid on the shell of busBody.ts, and the
// palette they share. See docs/models/buses.md.

import { ngon, type MaterialSpec, type MeshBuilder, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { endAt, halfWidth, rectAB } from "./busBody.ts";

/** Materials every bus has; a design adds its livery's colours. */
export const BUS_BASE_PALETTE: Record<string, MaterialSpec> = {
  glass: { color: "#26323f", metallic: 0.2, roughness: 0.15, glass: true },
  glassDark: { color: "#161c24", metallic: 0.2, roughness: 0.15, glass: true },
  glassLight: { color: "#456d7a", metallic: 0.2, roughness: 0.15, glass: true },
  rubber: { color: "#1c1c1e", roughness: 0.95 },
  frame: { color: "#2b2d31", roughness: 0.6 },
  under: { color: "#26272a", roughness: 0.9 },
  rim: { color: "#a9adb2", metallic: 0.35, roughness: 0.45 },
  hub: { color: "#3a3c40", roughness: 0.6 },
  chrome: { color: "#d9dee4", metallic: 0.45, roughness: 0.25 },
  lampHead: { color: "#f3f5f6", roughness: 0.2, lamp: { role: "head" } },
  lampAmber: { color: "#ff9a2e", roughness: 0.3, lamp: { role: "indicator" } },
  lampRed: { color: "#c8202c", roughness: 0.3, lamp: { role: "tail" } },
  plate: { color: "#f2f2ee", roughness: 0.5 },
  plateYellow: { color: "#f2c21b", roughness: 0.5 },
  sign: { color: "#141414", roughness: 0.4 },
  signText: { color: "#ffb21e", roughness: 0.3 },
  bellows: { color: "#56585b", roughness: 0.9 },
  grille: { color: "#1e1f22", roughness: 0.7 },
};

/** The palette of a bus: the shared materials and the livery's. */
export function busPalette(livery: Record<string, string>): Record<string, MaterialSpec> {
  const out: Record<string, MaterialSpec> = { ...BUS_BASE_PALETTE };
  for (const [name, color] of Object.entries(livery)) out[name] = { color, roughness: 0.45, metallic: 0.1 };
  return out;
}

/** A tyre is a 16-gon standing on a flat side: its axle is this fraction of the radius up. */
export const AXLE_FACTOR = Math.cos(Math.PI / 16);

/**
 * One wheel at axle x, its tyre spanning z0..z1. A wheel seen from outside
 * (`face` +1 or -1, the outer side) gets a disc and a hub on that face; the inner
 * wheel of a pair shows none.
 */
export function busWheel(m: MeshBuilder, x: number, radius: number, z0: number, z1: number, face: number | null): void {
  const y = radius * AXLE_FACTOR;
  const tyre = ngon(16, radius, Math.PI / 16, x, y);
  m.sweep("rubber", "z", tyre, z0, tyre, z1);
  if (face === null) return;
  const f = face > 0 ? z1 : z0;
  const disc = ngon(12, radius * 0.56, 0, x, y);
  const hub = ngon(8, radius * 0.2, Math.PI / 8, x, y);
  // the steel disc just proud of the (solid) tyre's face, the hub proud of the disc
  m.sweep("rim", "z", disc, f - face * 0.01, disc, f + face * 0.012);
  m.sweep("hub", "z", hub, f, hub, f + face * 0.04);
}

/** An axle beam across the bus at x, between the wheels. */
export function axleBeam(m: MeshBuilder, x: number, radius: number, half: number, drive: boolean): void {
  const y = radius * AXLE_FACTOR;
  const beam = ngon(8, 0.07, Math.PI / 8, x, y);
  m.sweep("under", "z", beam, -half, beam, half);
  if (drive) {
    const diff = ngon(10, 0.2, 0, x, y);
    m.sweep("under", "z", diff, -0.2, diff, 0.2);
  }
}

/** The z range a..b (both >= 0) on the side `s` (+1 right, -1 left), low end first. */
export function onSide(s: number, a: number, b: number): [number, number] {
  return s > 0 ? [a, b] : [-b, -a];
}

/** Where things sit on a bus's outside, from its shell's outlines. */
export interface BusFrame {
  section: Array<[number, number]>;
  side: Array<[number, number]>;
  /**
   * The plan (x, z), when the end fittings wrap round its corners: a fitting then
   * stands on whichever of the side's rake and the plan's corner is further in. A
   * frame without it lays them on the side's rake alone, as if the ends were flat.
   */
  plan?: Array<[number, number]>;
}

/** The x where the line z = `at` meets the end (`end` +1 the nose, -1 the tail) of a convex (x, z) plan. */
export function planEnd(plan: ReadonlyArray<[number, number]>, z: number, end: 1 | -1): number {
  const xs: number[] = [];
  for (let i = 0; i < plan.length; i++) {
    const [x0, z0] = plan[i]!;
    const [x1, z1] = plan[(i + 1) % plan.length]!;
    if (z < Math.min(z0, z1) - 1e-9 || z > Math.max(z0, z1) + 1e-9) continue;
    if (Math.abs(z1 - z0) < 1e-9) xs.push(x0, x1);
    else xs.push(x0 + ((x1 - x0) * (z - z0)) / (z1 - z0));
  }
  if (!xs.length) return end > 0 ? -Infinity : Infinity;
  return end > 0 ? Math.max(...xs) : Math.min(...xs);
}

/** z0, the z of every corner of the frame's plan at that end strictly between z0 and z1, and z1: the columns an end slab bends at. */
function colsAt(f: BusFrame, end: 1 | -1, z0: number, z1: number): number[] {
  if (!f.plan) return [z0, z1];
  const xs = f.plan.map(([x]) => x);
  const tip = end > 0 ? Math.max(...xs) : Math.min(...xs);
  // the corners of this end: within 2 m of its tip
  const cuts = [...new Set(f.plan.filter(([x]) => Math.abs(x - tip) < 2).map(([, z]) => z).filter((z) => z > z0 + 1e-6 && z < z1 - 1e-6))].sort((a, b) => a - b);
  return [z0, ...cuts, z1];
}

/**
 * How deep a slab `proud` of the shell reaches into it by default: further the
 * prouder it is, so two stacked slabs (a pane on its frame) never share a back
 * face -- coplanar faces of two materials flicker (coplanar.ts).
 */
function backOf(proud: number): number {
  return 0.02 + proud;
}

/** The point at (x, y) on side `s`, `proud` off the shell. */
export function sidePoint(f: BusFrame, s: number, x: number, y: number, proud: number): Vec3 {
  return [x, y, s * (halfWidth(f.section, y) + proud)];
}

/** y0, every corner of an outline ([*, y] points) strictly between y0 and y1, and y1: the rows a slab bends at. */
function rowsAt(outline: Array<[number, number]>, y0: number, y1: number): number[] {
  const cuts = [...new Set(outline.map(([, y]) => y).filter((y) => y > y0 + 1e-6 && y < y1 - 1e-6))].sort((a, b) => a - b);
  return [y0, ...cuts, y1];
}

/**
 * A slab whose face bends along rows: `rows[k]` is the k-th edge across the
 * face (its two ends, in order), the face the strip of quads between them,
 * extruded by `depth` (the face looks away from it) and walled all round -- one
 * closed solid with no faces inside, so a slab laid across a corner of the shell
 * follows it without sinking into it or doubling a face.
 */
export function bentSlab(m: MeshBuilder, mat: string, rows: Array<[Vec3, Vec3]>, depth: Vec3): void {
  const ring = [rows[0]![0], ...rows.map((r) => r[1]), ...rows.slice(1).reverse().map((r) => r[0])];
  const nv: Vec3 = [0, 0, 0];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    nv[0] += (a[1] - b[1]) * (a[2] + b[2]);
    nv[1] += (a[2] - b[2]) * (a[0] + b[0]);
    nv[2] += (a[0] - b[0]) * (a[1] + b[1]);
  });
  const flip = nv[0] * depth[0] + nv[1] * depth[1] + nv[2] * depth[2] > 0;
  const moved = (p: Vec3): Vec3 => [p[0] + depth[0], p[1] + depth[1], p[2] + depth[2]];
  const face = (a: Vec3, b: Vec3, c: Vec3): void => (flip ? m.tri(mat, a, c, b) : m.tri(mat, a, b, c));
  for (let k = 0; k + 1 < rows.length; k++) {
    const [l0, r0] = rows[k]!;
    const [l1, r1] = rows[k + 1]!;
    face(l0, r0, r1);
    face(l0, r1, l1);
    face(moved(l0), moved(r1), moved(r0));
    face(moved(l0), moved(l1), moved(r1));
  }
  const f = flip ? [...ring].reverse() : ring;
  f.forEach((p, i) => {
    const q = f[(i + 1) % f.length]!;
    m.quad(mat, q, p, moved(p), moved(q));
  });
}

/**
 * A slab whose face bends both ways: `grid[r][c]` the face's points, rows by
 * columns, the face the quads between them, extruded by `depth` (the face looks
 * away from it) and walled round its edge only -- one closed solid, as bentSlab.
 */
export function gridSlab(m: MeshBuilder, mat: string, grid: Vec3[][], depth: Vec3): void {
  const R = grid.length;
  const C = grid[0]!.length;
  const ring: Vec3[] = [
    ...grid[0]!,
    ...grid.slice(1).map((row) => row[C - 1]!),
    ...[...grid[R - 1]!].reverse().slice(1),
    ...grid.slice(1, R - 1).reverse().map((row) => row[0]!),
  ];
  const nv: Vec3 = [0, 0, 0];
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % ring.length]!;
    nv[0] += (a[1] - b[1]) * (a[2] + b[2]);
    nv[1] += (a[2] - b[2]) * (a[0] + b[0]);
    nv[2] += (a[0] - b[0]) * (a[1] + b[1]);
  });
  const flip = nv[0] * depth[0] + nv[1] * depth[1] + nv[2] * depth[2] > 0;
  const moved = (p: Vec3): Vec3 => [p[0] + depth[0], p[1] + depth[1], p[2] + depth[2]];
  const face = (a: Vec3, b: Vec3, c: Vec3): void => (flip ? m.tri(mat, a, c, b) : m.tri(mat, a, b, c));
  for (let r = 0; r + 1 < R; r++) {
    for (let c = 0; c + 1 < C; c++) {
      const [a, b, cc, d] = [grid[r]![c]!, grid[r]![c + 1]!, grid[r + 1]![c + 1]!, grid[r + 1]![c]!];
      face(a, b, cc);
      face(a, cc, d);
      face(moved(a), moved(cc), moved(b));
      face(moved(a), moved(d), moved(cc));
    }
  }
  const w = flip ? [...ring].reverse() : ring;
  w.forEach((p, i) => {
    const q = w[(i + 1) % w.length]!;
    m.quad(mat, q, p, moved(p), moved(q));
  });
}

/**
 * A pane, panel or door leaf on a side: a slab over x0..x1, y0..y1 laid on the
 * shell (its corners follow the section's lean), `proud` out of it and `depth`
 * into it. Across a corner of the section it bends with it (bentSlab), so it
 * never sinks into the shell.
 */
export function sideSlab(m: MeshBuilder, mat: string, f: BusFrame, s: number, x0: number, x1: number, y0: number, y1: number, proud: number, depth = backOf(proud)): void {
  const ys = rowsAt(f.section, y0, y1);
  if (ys.length === 2) {
    const outline = rectAB(x0, x1, y0, y1).map(([x, y]) => sidePoint(f, s, x, y, proud));
    m.slab(mat, outline, [0, 0, -s * (proud + depth)]);
  } else bentSlab(m, mat, ys.map((y) => [sidePoint(f, s, x0, y, proud), sidePoint(f, s, x1, y, proud)]), [0, 0, -s * (proud + depth)]);
}

/** The point at (z, y) on an end (`end` +1 the nose, -1 the rear), `proud` out of it along x. */
export function endPoint(f: BusFrame, end: 1 | -1, z: number, y: number, proud: number): Vec3 {
  let x = endAt(f.side, y, end);
  if (f.plan) x = end > 0 ? Math.min(x, planEnd(f.plan, z, end)) : Math.max(x, planEnd(f.plan, z, end));
  return [x + end * proud, y, z];
}

/**
 * A slab on an end of the shell over z0..z1, y0..y1, following the end's rake,
 * `proud` out of it and `depth` into it along x, bent at the side outline's
 * corners like sideSlab.
 */
export function endSlab(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, z0: number, z1: number, y0: number, y1: number, proud: number, depth = backOf(proud)): void {
  const ys = rowsAt(f.side, y0, y1);
  // round a corner of the plan: one solid bent at its corners too
  const zs = colsAt(f, end, z0, z1);
  if (zs.length > 2) {
    gridSlab(m, mat, ys.map((y) => zs.map((z) => endPoint(f, end, z, y, proud))), [-end * (proud + depth), 0, 0]);
    return;
  }
  if (ys.length === 2) {
    const outline = rectAB(z0, z1, y0, y1).map(([z, y]) => endPoint(f, end, z, y, proud));
    m.slab(mat, outline, [-end * (proud + depth), 0, 0]);
  } else bentSlab(m, mat, ys.map((y) => [endPoint(f, end, z0, y, proud), endPoint(f, end, z1, y, proud)]), [-end * (proud + depth), 0, 0]);
}

/** A round lamp on an end: an n-gon lens (and an optional housing behind it). */
export function endLamp(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, z: number, y: number, r: number, proud: number, housing?: string, n = 10): void {
  const ring: Ring = ngon(n, r, 0, z, y);
  if (housing) {
    const outer = ngon(n, r + 0.025, 0, z, y);
    m.slab(housing, outer.map(([a, b]) => endPoint(f, end, a, b, proud - 0.01)), [-end * (proud + 0.02), 0, 0]);
  }
  m.slab(mat, ring.map(([a, b]) => endPoint(f, end, a, b, proud)), [-end * (proud + 0.02), 0, 0]);
}

/**
 * An outside mirror on side `s`, ahead of the nose's corner: an arm from inside
 * the body at its height (a raked front recedes) forward to the head, which hangs
 * `drop` below it on a short stem, its glass facing back. The head reaches out to
 * `reach` from the centre line at most (the road width rule: 1.35 m).
 */
export function mirror(m: MeshBuilder, f: BusFrame, s: number, nose: number, y: number, head: { h: number; w: number; drop: number; fwd?: number }): void {
  // both mirrors reach as far out, whatever height they hang at: the body's widest plus a little
  const reach = Math.min(Math.max(...f.section.map(([z]) => Math.abs(z))) + 0.08, 1.345);
  const fwd = head.fwd ?? 0.22;
  const zi = reach - head.w;
  const zs = (a: number, b: number): [number, number] => (s > 0 ? [a, b] : [-b, -a]);
  block(m, "frame", Math.min(nose, endAt(f.side, y, 1)) - 0.2, nose + fwd + 0.02, y - 0.02, y + 0.02, ...zs(zi + 0.02, zi + 0.06));
  const top = y - head.drop;
  // the stem from the arm down into the head
  block(m, "frame", nose + fwd - 0.01, nose + fwd + 0.01, top - 0.01, y, ...zs(zi + 0.03, zi + 0.05));
  block(m, "frame", nose + fwd - 0.03, nose + fwd + 0.04, top - head.h, top, ...zs(zi, reach));
  block(m, "glass", nose + fwd - 0.045, nose + fwd - 0.02, top - head.h + 0.02, top - 0.02, ...zs(zi + 0.02, reach - 0.02));
}

// --- end details: bars, wipers, badges ----------------------------------------------

/**
 * A flat polygon (z, y points, convex) on an end, `proud` of it and sunk `depth`
 * into it, following the end's rake. It must lie within one piece of the side
 * outline (a windscreen, a panel), where the end is flat.
 */
export function endShape(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, pts: Array<[number, number]>, proud: number, depth = backOf(proud)): void {
  m.slab(mat, pts.map(([z, y]) => endPoint(f, end, z, y, proud)), [-end * (proud + depth), 0, 0]);
}

/** A straight bar `w` wide on an end from (z, y) `a` to `b` (endShape). */
export function endBar(m: MeshBuilder, mat: string, f: BusFrame, end: 1 | -1, a: [number, number], b: [number, number], w: number, proud: number): void {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const [nz, ny] = [(-(b[1] - a[1]) / l) * (w / 2), ((b[0] - a[0]) / l) * (w / 2)];
  endShape(m, mat, f, end, [[a[0] + nz, a[1] + ny], [b[0] + nz, b[1] + ny], [b[0] - nz, b[1] - ny], [a[0] - nz, a[1] - ny]], proud);
}

/**
 * A windscreen wiper at rest on an end: its arm from the pivot at (z, y), `len`
 * long and rising `deg` degrees toward +z (negative: toward -z), the blade along
 * it, the spindle's cap over the pivot.
 */
export function wiper(m: MeshBuilder, f: BusFrame, end: 1 | -1, z: number, y: number, len: number, deg: number): void {
  const a = (deg * Math.PI) / 180;
  const at = (t: number): [number, number] => [z + Math.sign(deg || 1) * t * len * Math.cos(a), y + t * len * Math.abs(Math.sin(a))];
  endBar(m, "frame", f, end, at(0), at(0.82), 0.026, 0.03);
  endBar(m, "rubber", f, end, at(0.12), at(1), 0.018, 0.04);
  endLamp(m, "frame", f, end, z, y, 0.03, 0.046, undefined, 6);
}

/** A round badge on an end: a chrome disc in a dark ring, a three-pointed star on it if `star` (the Mercedes-Benz badge). */
export function endBadge(m: MeshBuilder, f: BusFrame, end: 1 | -1, z: number, y: number, r: number, proud: number, star = false): void {
  endLamp(m, "chrome", f, end, z, y, r, proud, "frame", 12);
  if (!star) return;
  for (const deg of [90, 210, 330]) {
    const a = (deg * Math.PI) / 180;
    endBar(m, "frame", f, end, [z, y], [z + Math.cos(a) * r * 0.85, y + Math.sin(a) * r * 0.85], r * 0.16, proud + 0.006);
  }
}

/** A maker's name on an end, read from afar: a row of short chrome strokes over z0..z1, `h` high from y. */
export function endLettering(m: MeshBuilder, f: BusFrame, end: 1 | -1, z0: number, z1: number, y: number, h: number, proud: number, mat = "chrome"): void {
  const n = Math.max(3, Math.round((z1 - z0) / 0.05));
  const w = (z1 - z0) / n;
  for (let i = 0; i < n; i++) endSlab(m, mat, f, end, z0 + i * w + w * 0.15, z0 + (i + 1) * w - w * 0.15, y, y + h, proud);
}

/** A convex (a, b) polygon cut by the half-plane na * a + nb * b <= c. */
function clipPoly(poly: Array<[number, number]>, na: number, nb: number, c: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]!;
    const q = poly[(i + 1) % poly.length]!;
    const dp = na * p[0] + nb * p[1] - c;
    const dq = na * q[0] + nb * q[1] - c;
    if (dp <= 1e-12) out.push(p);
    if ((dp < -1e-12 && dq > 1e-12) || (dp > 1e-12 && dq < -1e-12)) {
      const t = dp / (dp - dq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
    }
  }
  return out;
}

/** A closed convex outline moved outward by `d` along each corner's bisector. */
function grownOutline(poly: Array<[number, number]>, d: number): Array<[number, number]> {
  const n = poly.length;
  let area = 0;
  for (let i = 0; i < n; i++) area += poly[i]![0] * poly[(i + 1) % n]![1] - poly[(i + 1) % n]![0] * poly[i]![1];
  const s = area > 0 ? 1 : -1;
  const unit = (a: number, b: number): [number, number] => {
    const l = Math.hypot(a, b) || 1;
    return [a / l, b / l];
  };
  return poly.map(([a, b], i) => {
    const [pa, pb] = poly[(i + n - 1) % n]!;
    const [qa, qb] = poly[(i + 1) % n]!;
    const n1 = unit((b - pb) * s, -(a - pa) * s);
    const n2 = unit((qb - b) * s, -(qa - a) * s);
    const mm = unit(n1[0] + n2[0], n1[1] + n2[1]);
    const k = d / Math.max(0.3, mm[0] * n1[0] + mm[1] * n1[1]);
    return [a + mm[0] * k, b + mm[1] * k];
  });
}

/**
 * A front bumper wrapped round the nose's plan corners: the plan (x, z) grown by
 * `out`, within |z| <= `half` and reaching 0.6 m back from the nose (into the body).
 * The (x, z) outline, convex, for a prism and for a BusFrame plan its fittings stand on.
 */
export function wrappedBumper(plan: Array<[number, number]>, nose: number, out: number, half: number): Array<[number, number]> {
  let p = grownOutline(plan, out);
  p = clipPoly(p, -1, 0, -(nose - 0.6));
  p = clipPoly(p, 0, 1, half);
  return clipPoly(p, 0, -1, half);
}
