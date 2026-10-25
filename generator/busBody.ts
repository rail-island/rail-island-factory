// The body of a procedural bus (buses.ts): the vlakosimdb way of describing a
// bus shell -- a cross-section, a side elevation and a plan, each a convex
// outline, the shell being the solid inside all three (the XML's `alongx`,
// `alongz` and `alongy` clip polygons) -- turned into flat-shaded faces.
//
// The shell is a convex polyhedron, so it is built by clipping: a large box cut
// by every edge plane of the three outlines. It is cut further into paint cells
// (the livery's bands and panels, so every colour is its own faces rather than a
// texture) and into the wheel arches, which are notches out of the shell's
// bottom with a rounded top. Faces inside the shell are never drawn.
//
// Coordinates: metres, +X forward, +Y up, +Z to the right, wheels on y = 0, the
// body centred on z = 0. The nose is at the largest x.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";

/** A clip plane: points with n . p <= d are kept. `mat` paints the face it cuts, null leaves it undrawn. */
interface Plane {
  n: Vec3;
  d: number;
  mat: string | null;
}

interface Face {
  pts: Vec3[];
  mat: string | null;
}

const EPS = 1e-7;
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

/** The faces of an axis-aligned box, wound outward, all undrawn. */
function box(lo: Vec3, hi: Vec3): Face[] {
  const [x0, y0, z0] = lo;
  const [x1, y1, z1] = hi;
  const q = (a: Vec3, b: Vec3, c: Vec3, d: Vec3): Face => ({ pts: [a, b, c, d], mat: null });
  return [
    q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]), // -x
    q([x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]), // +x
    q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]), // -y
    q([x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]), // +y
    q([x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]), // -z
    q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]), // +z
  ];
}

/** Cuts a convex solid by a plane; the cut is closed by a face painted `plane.mat`. */
function clip(faces: Face[], plane: Plane): Face[] {
  const out: Face[] = [];
  const cut: Vec3[] = [];
  const dist = (p: Vec3): number => dot(plane.n, p) - plane.d;
  // a plane that cuts nothing adds no face (one the solid already has a face in, say)
  if (!faces.some((f) => f.pts.some((p) => dist(p) > EPS))) return faces;
  for (const f of faces) {
    const res: Vec3[] = [];
    for (let i = 0; i < f.pts.length; i++) {
      const a = f.pts[i]!;
      const b = f.pts[(i + 1) % f.pts.length]!;
      const da = dist(a);
      const db = dist(b);
      if (da <= EPS) res.push(a);
      if (Math.abs(da) <= EPS) cut.push(a);
      if ((da < -EPS && db > EPS) || (da > EPS && db < -EPS)) {
        const t = da / (da - db);
        const p: Vec3 = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        res.push(p);
        cut.push(p);
      }
    }
    // drop repeated points
    const clean = res.filter((p, i) => {
      const q = res[(i + 1) % res.length]!;
      return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) > 1e-9;
    });
    if (clean.length >= 3) out.push({ pts: clean, mat: f.mat });
  }
  const uniq: Vec3[] = [];
  for (const p of cut) if (!uniq.some((q) => Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) < 1e-7)) uniq.push(p);
  if (uniq.length >= 3) {
    // order the cut's points round their centroid, counter-clockwise about the plane's normal
    const c: Vec3 = [0, 0, 0];
    for (const p of uniq) for (let k = 0; k < 3; k++) c[k]! += p[k]! / uniq.length;
    const u = unit(Math.abs(plane.n[0]) < 0.9 ? cross(plane.n, [1, 0, 0]) : cross(plane.n, [0, 1, 0]));
    const v = cross(plane.n, u);
    const angle = (p: Vec3): number => Math.atan2(dot(sub(p, c), v), dot(sub(p, c), u));
    uniq.sort((a, b) => angle(a) - angle(b));
    out.push({ pts: uniq, mat: plane.mat });
  }
  return out;
}

/** The edge planes of a convex outline (a, b) lifted into 3D by `lift`, outward. */
function outlinePlanes(outline: Array<[number, number]>, lift: (a: number, b: number) => Vec3, mat: (i: number) => string | null): Plane[] {
  const n = outline.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [a0, b0] = outline[i]!;
    const [a1, b1] = outline[(i + 1) % n]!;
    area += a0 * b1 - a1 * b0;
  }
  const s = area > 0 ? 1 : -1;
  // a dent or a crossing would cut the solid away: every corner must turn the same way
  for (let i = 0; i < n; i++) {
    const [a0, b0] = outline[i]!;
    const [a1, b1] = outline[(i + 1) % n]!;
    const [a2, b2] = outline[(i + 2) % n]!;
    const turn = (a1 - a0) * (b2 - b1) - (b1 - b0) * (a2 - a1);
    if (turn * s < -1e-9) throw new Error(`a shell outline is not convex at point ${(i + 1) % n}`);
  }
  const planes: Plane[] = [];
  for (let i = 0; i < n; i++) {
    const [a0, b0] = outline[i]!;
    const [a1, b1] = outline[(i + 1) % n]!;
    if (Math.hypot(a1 - a0, b1 - b0) < 1e-9) continue;
    // outward normal of a counter-clockwise outline's edge is (db, -da)
    const n2 = unit(lift((b1 - b0) * s, -(a1 - a0) * s));
    planes.push({ n: n2, d: dot(n2, lift(a0, b0)), mat: mat(i) });
  }
  return planes;
}

/** Fan-triangulates the drawn faces of a solid. */
function draw(m: MeshBuilder, faces: Face[], name: string): void {
  m.scope(name, () => {
    for (const f of faces) {
      if (!f.mat) continue;
      for (let i = 1; i + 1 < f.pts.length; i++) m.tri(f.mat, f.pts[0]!, f.pts[i]!, f.pts[i + 1]!);
    }
  });
}

// --- the shell -------------------------------------------------------------------

/** A painted panel of the livery: a box in (x, y), across the whole width. */
export interface Paint {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  mat: string;
}

/** A wheel arch: the notch over an axle at `x`, `half` long either side, rounded to `top`. */
export interface Arch {
  x: number;
  half: number;
  /** Height of the notch's straight sides. */
  side: number;
  /** Height of the notch's crown. */
  top: number;
}

export interface Shell {
  /** Cross-section, (z, y): a convex outline. */
  section: Array<[number, number]>;
  /** Side elevation, (x, y): a convex outline. */
  side: Array<[number, number]>;
  /** Plan, (x, z): a convex outline. */
  plan: Array<[number, number]>;
  /** The colour of everything no panel covers. */
  base: string;
  /** Panels, later ones over earlier ones. */
  paint: Paint[];
  arches: Arch[];
  /** What the underside and the arches' insides are painted. */
  under: string;
  /** Extra cuts across the shell (a section's ends): only x0..x1 of it is drawn. */
  x0?: number;
  x1?: number;
  /**
   * Doorways through the sides (`s` +1 right), x0..x1 and y0..y1: the shell
   * leaves out its side wall over each, with the bus's cabin behind (interior.ts).
   */
  doorways?: Array<{ s: number; x0: number; x1: number; y0: number; y1: number }>;
}

/** How many straight pieces an arch's rounded crown is made of. */
const ARCH_STEPS = 6;

/** The arch's crown: (x, y) points from its rear foot round to its front foot. */
function archOutline(a: Arch): Array<[number, number]> {
  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= ARCH_STEPS; i++) {
    const t = Math.PI * (1 - i / ARCH_STEPS); // from the rear (pi) to the front (0)
    pts.push([a.x + a.half * Math.cos(t), a.side + (a.top - a.side) * Math.sin(t)]);
  }
  return pts;
}

/** Bottom of the shell at x: the arch's crown inside an arch, else -Infinity. */
function archBottom(arches: readonly Arch[], x: number): number {
  for (const a of arches) {
    if (x <= a.x - a.half || x >= a.x + a.half) continue;
    const pts = archOutline(a);
    for (let i = 0; i + 1 < pts.length; i++) {
      const [xa, ya] = pts[i]!;
      const [xb, yb] = pts[i + 1]!;
      if (x >= xa && x <= xb) return ya + ((yb - ya) * (x - xa)) / (xb - xa);
    }
  }
  return -Infinity;
}

/**
 * Draws the shell: one convex solid per paint cell, every face in its cell's
 * colour, the underside and the arches' insides in `under`. The cells are the
 * panels' x and y edges, the doorways' and the arches' pieces; neighbouring
 * cells of one colour at one height are merged. A cell over a doorway has no
 * side wall there.
 */
export function drawShell(m: MeshBuilder, s: Shell, name = "shell"): void {
  let lo = Infinity;
  let hi = -Infinity;
  for (const [x] of s.side) {
    lo = Math.min(lo, x);
    hi = Math.max(hi, x);
  }
  lo = Math.max(lo, s.x0 ?? -Infinity);
  hi = Math.min(hi, s.x1 ?? Infinity);
  let bottom = Infinity;
  let top = -Infinity;
  for (const [, y] of s.side) {
    bottom = Math.min(bottom, y);
    top = Math.max(top, y);
  }
  // the x and y cuts
  const xs = new Set<number>([lo, hi]);
  const ys = new Set<number>([bottom, top]);
  for (const p of s.paint) {
    for (const x of [p.x0, p.x1]) if (x > lo && x < hi) xs.add(x);
    for (const y of [p.y0, p.y1]) if (y > bottom && y < top) ys.add(y);
  }
  const doorways = s.doorways ?? [];
  for (const d of doorways) {
    for (const x of [d.x0, d.x1]) if (x > lo && x < hi) xs.add(x);
    for (const y of [d.y0, d.y1]) if (y > bottom && y < top) ys.add(y);
  }
  for (const a of s.arches) {
    for (const [x] of archOutline(a)) if (x > lo && x < hi) xs.add(x);
    // the arch's crown and feet cut the bands too, so a wall into the notch is no taller than the notch
    for (const y of [a.side, a.top]) if (y > bottom && y < top) ys.add(y);
  }
  const xcuts = [...xs].sort((a, b) => a - b);
  const ycuts = [...ys].sort((a, b) => a - b);
  const colour = (x: number, y: number): string => {
    let mat = s.base;
    for (const p of s.paint) if (x >= p.x0 && x <= p.x1 && y >= p.y0 && y <= p.y1) mat = p.mat;
    return mat;
  };
  const archAt = (x: number): Arch | undefined => s.arches.find((a) => x > a.x - a.half && x < a.x + a.half);

  const hull: Plane[] = [
    ...outlinePlanes(s.section, (z, y) => [0, y, z], () => "@"),
    // the side outline's bottom edge is the underside
    ...outlinePlanes(s.side, (x, y) => [x, y, 0], () => "@"),
    ...outlinePlanes(s.plan, (x, z) => [x, 0, z], () => "@"),
  ];
  const BIG = 1000;
  m.scope(name, () => {
    for (let yi = 0; yi + 1 < ycuts.length; yi++) {
      const ya = ycuts[yi]!;
      const yb = ycuts[yi + 1]!;
      // the x cells of this band, merged where colour, arch and doorway agree
      const cells: Array<{ x0: number; x1: number; mat: string; arch?: Arch; door?: number }> = [];
      for (let xi = 0; xi + 1 < xcuts.length; xi++) {
        const x0 = xcuts[xi]!;
        const x1 = xcuts[xi + 1]!;
        const xm = (x0 + x1) / 2;
        const arch = archAt(xm);
        // a band wholly inside an arch's notch -- the crown above its top at both
        // ends -- has nothing left; one the crown rises through is clipped by it
        if (arch && Math.min(archBottom(s.arches, x0 + 1e-6), archBottom(s.arches, x1 - 1e-6)) >= yb) {
          cells.push({ x0, x1, mat: "", arch });
          continue;
        }
        const mat = colour(xm, (ya + yb) / 2);
        const ym = (ya + yb) / 2;
        const di = doorways.findIndex((d) => xm > d.x0 && xm < d.x1 && ym > d.y0 && ym < d.y1);
        const door = di >= 0 ? di : undefined;
        const last = cells[cells.length - 1];
        if (last && !arch && !last.arch && last.mat === mat && last.door === door) last.x1 = x1;
        else cells.push({ x0, x1, mat, arch, ...(door !== undefined ? { door } : {}) });
      }
      cells.forEach((c, ci) => {
        if (!c.mat) return;
        // the bottom of this cell at either end, against which a neighbour's end face shows
        const bottomAt = (cell: (typeof cells)[number] | undefined, x: number): number =>
          !cell ? Infinity : !cell.mat ? Infinity : cell.arch ? archBottom(s.arches, x) : -Infinity;
        const prev = cells[ci - 1];
        const next = cells[ci + 1];
        // an end face is drawn only where it looks into a notch
        // (the shell's own ends: an end the shell is cut at, a section's, faces the gap)
        const showLo = ci === 0 || ya < bottomAt(prev, c.x0 - 1e-6) - 1e-6;
        const showHi = ci + 1 === cells.length || ya < bottomAt(next, c.x1 + 1e-6) - 1e-6;
        const planes: Plane[] = [
          // over a doorway the side facing out of it is left open
          ...hull.map((p) => ({ ...p, mat: p.n[1] < -0.9 ? s.under : c.door !== undefined && p.n[2] * doorways[c.door]!.s > 0.3 ? null : c.mat })),
          { n: [-1, 0, 0], d: -c.x0, mat: showLo ? c.mat : null },
          { n: [1, 0, 0], d: c.x1, mat: showHi ? c.mat : null },
          { n: [0, -1, 0], d: -ya, mat: ya <= bottom + 1e-9 ? s.under : null },
          { n: [0, 1, 0], d: yb, mat: yb >= top - 1e-9 ? c.mat : null },
        ];
        if (c.arch) {
          // the crown piece under this cell: y >= ya' + k (x - x0)
          const ya0 = archBottom(s.arches, c.x0 + 1e-9);
          const yb0 = archBottom(s.arches, c.x1 - 1e-9);
          const k = (yb0 - ya0) / (c.x1 - c.x0);
          const n = unit([k, -1, 0]);
          planes.push({ n, d: dot(n, [c.x0, ya0, 0]), mat: s.under });
        }
        let faces = box([-BIG, -BIG, -BIG], [BIG, BIG, BIG]);
        for (const p of planes) faces = clip(faces, p);
        if (faces.some((f) => f.pts.some((p) => Math.abs(p[0]) > BIG / 2))) throw new Error("open shell");
        draw(m, faces, `${c.mat} ${yi}.${ci}`);
      });
    }
  });
}

// --- placing things on the shell --------------------------------------------------

/** The half width of a cross-section at height y (its right-hand edge, interpolated). */
export function halfWidth(section: Array<[number, number]>, y: number): number {
  let best = 0;
  const n = section.length;
  for (let i = 0; i < n; i++) {
    const [za, ya] = section[i]!;
    const [zb, yb] = section[(i + 1) % n]!;
    if (Math.min(za, zb) < -1e-9) continue; // the right-hand half only
    if (y < Math.min(ya, yb) - 1e-9 || y > Math.max(ya, yb) + 1e-9) continue;
    const z = Math.abs(yb - ya) < 1e-9 ? Math.max(za, zb) : za + ((zb - za) * (y - ya)) / (yb - ya);
    best = Math.max(best, z);
  }
  return best;
}

/** The x of the side outline's front (`end` +1) or rear (-1) edge at height y. */
export function endAt(side: Array<[number, number]>, y: number, end: 1 | -1): number {
  let best = end > 0 ? -Infinity : Infinity;
  const n = side.length;
  for (let i = 0; i < n; i++) {
    const [xa, ya] = side[i]!;
    const [xb, yb] = side[(i + 1) % n]!;
    if (y < Math.min(ya, yb) - 1e-9 || y > Math.max(ya, yb) + 1e-9) continue;
    const x = Math.abs(yb - ya) < 1e-9 ? (end > 0 ? Math.max(xa, xb) : Math.min(xa, xb)) : xa + ((xb - xa) * (y - ya)) / (yb - ya);
    best = end > 0 ? Math.max(best, x) : Math.min(best, x);
  }
  return best;
}

/**
 * A flat panel on a side of the shell (`s` +1 right, -1 left): the outline's
 * corners (x, y) laid on the section at their heights, `proud` outward, `depth`
 * into the body. Keep a panel within one straight piece of the section.
 */
export function sidePanel(m: MeshBuilder, mat: string, section: Array<[number, number]>, s: number, corners: Array<[number, number]>, proud: number, depth = 0.04): void {
  const outline: Vec3[] = corners.map(([x, y]) => [x, y, s * (halfWidth(section, y) + proud)]);
  m.slab(mat, outline, [0, 0, -s * (proud + depth)]);
}

/** A rectangle's corners in (a, b). */
export function rectAB(a0: number, a1: number, b0: number, b1: number): Array<[number, number]> {
  return [[a0, b0], [a1, b0], [a1, b1], [a0, b1]];
}

/**
 * A flat panel on an end of the shell (`end` +1 the nose, -1 the rear): the
 * outline's (z, y) corners laid on the side outline's end edge at their heights,
 * `proud` outward along x, `depth` into the body. Keep it within one straight
 * piece of the end.
 */
export function endPanel(m: MeshBuilder, mat: string, side: Array<[number, number]>, end: 1 | -1, corners: Array<[number, number]>, proud: number, depth = 0.04): void {
  const outline: Vec3[] = corners.map(([z, y]) => [endAt(side, y, end) + end * proud, y, z]);
  // into the body along the face's normal, so the slab stays a prism
  const [a, b, c] = outline;
  let n = unit(cross(sub(b!, a!), sub(c!, a!)));
  if (n[0] * end < 0) n = [-n[0], -n[1], -n[2]];
  m.slab(mat, outline, [-n[0] * (proud + depth), -n[1] * (proud + depth), -n[2] * (proud + depth)]);
}
