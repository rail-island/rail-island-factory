// A mechanism that moves between two poses, as a `state` clip of its rigid pieces
// (docs/models/animation.md): a pantograph from folded to raised. The design
// draws the mechanism at any lift from 0 to 1 through the builder it is handed;
// this samples it, finds each triangle's rigid motion, gathers the triangles that
// move alike into pieces, makes every moving piece a part pivoted where it moves
// least, draws the raised pose for real with each triangle in its piece's part,
// and adds the clip. Apart from meshCore.ts so that only the designs with a
// mechanism carry this code in their standalone JS model.

import type { AnimationTrack, MeshCore, Vec3 } from "./meshCore.ts";

/** Lift samples of a `liftable` mechanism's clip, plus the closing one. */
export const LIFT_SAMPLES = 8;

/** A rigid motion: p -> r p + t, r a row-major 3x3 rotation. */
interface Rigid {
  r: number[];
  t: Vec3;
}

function apply(m: Rigid, p: Vec3): Vec3 {
  const r = m.r;
  return [
    r[0]! * p[0] + r[1]! * p[1] + r[2]! * p[2] + m.t[0],
    r[3]! * p[0] + r[4]! * p[1] + r[5]! * p[2] + m.t[1],
    r[6]! * p[0] + r[7]! * p[1] + r[8]! * p[2] + m.t[2],
  ];
}

/** An orthonormal frame on triangle `t` of `pos` (columns: first edge, in-plane normal, face normal) and its centroid. */
function triFrame(pos: readonly number[], t: number): { f: number[]; c: Vec3 } {
  const a: Vec3 = [pos[t]!, pos[t + 1]!, pos[t + 2]!];
  const b: Vec3 = [pos[t + 3]!, pos[t + 4]!, pos[t + 5]!];
  const c: Vec3 = [pos[t + 6]!, pos[t + 7]!, pos[t + 8]!];
  const u: Vec3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v: Vec3 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const nrm = (w: Vec3): Vec3 => {
    const l = Math.hypot(w[0], w[1], w[2]);
    return [w[0] / l, w[1] / l, w[2] / l];
  };
  const cross = (p: Vec3, q: Vec3): Vec3 => [p[1] * q[2] - p[2] * q[1], p[2] * q[0] - p[0] * q[2], p[0] * q[1] - p[1] * q[0]];
  const e1 = nrm(u);
  const n = nrm(cross(u, v));
  const e2 = cross(n, e1);
  return { f: [e1[0], e2[0], n[0], e1[1], e2[1], n[1], e1[2], e2[2], n[2]], c: [(a[0] + b[0] + c[0]) / 3, (a[1] + b[1] + c[1]) / 3, (a[2] + b[2] + c[2]) / 3] };
}

/** The rigid motion taking triangle `t` of `from` onto triangle `t` of `to`; throws if it is not rigid. */
function rigidMotion(from: readonly number[], to: readonly number[], t: number, what: string): Rigid {
  const p = triFrame(from, t);
  const q = triFrame(to, t);
  // r = Fq Fp^T
  const r: number[] = [];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) r.push(q.f[i * 3]! * p.f[j * 3]! + q.f[i * 3 + 1]! * p.f[j * 3 + 1]! + q.f[i * 3 + 2]! * p.f[j * 3 + 2]!);
  const rc = apply({ r, t: [0, 0, 0] }, p.c);
  const m: Rigid = { r, t: [q.c[0] - rc[0], q.c[1] - rc[1], q.c[2] - rc[2]] };
  for (let k = 0; k < 9; k += 3) {
    const at = apply(m, [from[t + k]!, from[t + k + 1]!, from[t + k + 2]!]);
    if (Math.hypot(at[0] - to[t + k]!, at[1] - to[t + k + 1]!, at[2] - to[t + k + 2]!) > 2e-3) throw new Error(`liftable ${what}: a piece stretches as it lifts`);
  }
  return m;
}

function sameMotions(a: readonly Rigid[], b: readonly Rigid[]): boolean {
  for (let k = 0; k < a.length; k++) {
    for (let i = 0; i < 9; i++) if (Math.abs(a[k]!.r[i]! - b[k]!.r[i]!) > 1e-4) return false;
    for (let i = 0; i < 3; i++) if (Math.abs(a[k]!.t[i]! - b[k]!.t[i]!) > 1e-4) return false;
  }
  return true;
}

function isIdentity(m: Rigid): boolean {
  return m.r.every((v, i) => Math.abs(v - (i % 4 === 0 ? 1 : 0)) < 1e-6) && m.t.every((v) => Math.abs(v) < 1e-6);
}

/**
 * The point that moves least over the motions (a hinge's axis, nearest the
 * piece's centre), rounded to the millimetre: least squares of |r p + t - p|,
 * pulled weakly toward the centroid of `pts` so a translation alone is pivoted there.
 */
function leastMoved(motions: readonly Rigid[], pts: readonly number[]): Vec3 {
  const c: Vec3 = [0, 0, 0];
  for (let i = 0; i < pts.length; i += 3) for (let k = 0; k < 3; k++) c[k] += pts[i + k]! / (pts.length / 3);
  const lambda = 1e-3;
  const a = [lambda, 0, 0, 0, lambda, 0, 0, 0, lambda];
  const b = [lambda * c[0], lambda * c[1], lambda * c[2]];
  for (const m of motions) {
    const d = m.r.map((v, i) => v - (i % 4 === 0 ? 1 : 0)); // r - I
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) a[i * 3 + j] += d[0 * 3 + i]! * d[0 * 3 + j]! + d[1 * 3 + i]! * d[1 * 3 + j]! + d[2 * 3 + i]! * d[2 * 3 + j]!;
      b[i] -= d[0 * 3 + i]! * m.t[0] + d[1 * 3 + i]! * m.t[1] + d[2 * 3 + i]! * m.t[2];
    }
  }
  // Cramer's rule on the 3x3 system
  const det3 = (m: number[]): number =>
    m[0]! * (m[4]! * m[8]! - m[5]! * m[7]!) - m[1]! * (m[3]! * m[8]! - m[5]! * m[6]!) + m[2]! * (m[3]! * m[7]! - m[4]! * m[6]!);
  const det = det3(a);
  const out: Vec3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const m = a.slice();
    for (let i = 0; i < 3; i++) m[i * 3 + k] = b[i]!;
    out[k] = round3(det3(m) / det);
  }
  return out;
}

/** A rotation matrix (row-major) as an x, y, z, w quaternion. */
function quaternion(r: readonly number[]): [number, number, number, number] {
  const [m00, m01, m02, m10, m11, m12, m20, m21, m22] = r as [number, number, number, number, number, number, number, number, number];
  const tr = m00 + m11 + m22;
  let q: [number, number, number, number];
  if (tr > 0) {
    const s = Math.sqrt(tr + 1) * 2;
    q = [(m21 - m12) / s, (m02 - m20) / s, (m10 - m01) / s, s / 4];
  } else if (m00 > m11 && m00 > m22) {
    const s = Math.sqrt(1 + m00 - m11 - m22) * 2;
    q = [s / 4, (m01 + m10) / s, (m02 + m20) / s, (m21 - m12) / s];
  } else if (m11 > m22) {
    const s = Math.sqrt(1 + m11 - m00 - m22) * 2;
    q = [(m01 + m10) / s, s / 4, (m12 + m21) / s, (m02 - m20) / s];
  } else {
    const s = Math.sqrt(1 + m22 - m00 - m11) * 2;
    q = [(m02 + m20) / s, (m12 + m21) / s, s / 4, (m10 - m01) / s];
  }
  const l = Math.hypot(...q);
  return q.map((v) => v / l) as [number, number, number, number];
}

/**
 * Draws a mechanism that moves between two poses as a `state` clip: a pantograph
 * from folded (`draw(m, 0)`) to raised (`draw(m, 1)`). `draw` must draw through the
 * builder it is handed, at every lift the same primitives in the same order, each
 * piece moved only rigidly as the lift changes (an arm keeps its length; `rod`
 * draws one that does). The rest pose is the raised one, drawn into `m`; the
 * mechanism is sampled at LIFT_SAMPLES + 1 lifts, every rigid piece that moves
 * becomes its own part (`<name><n>-<k>`, a child of the part being drawn, if
 * any), and the clip `<name><n>` moves them from the folded pose at time 0 to the
 * raised one at time 1, drive `state`. Pieces that never move stay where they
 * are drawn. Throws for a piece that stretches.
 */
export function liftable<T extends MeshCore>(m: T, name: string, draw: (m: T, lift: number) => void): void {
  if (/[\s.:/\[\]]/.test(name)) throw new Error(`liftable "${name}": a name three.js cannot bind`);
  const n = m.nextLiftable();
  const lifts = Array.from({ length: LIFT_SAMPLES + 1 }, (_, k) => k / LIFT_SAMPLES);
  const poses = lifts.map((lift) => m.sampleDraw((s) => draw(s, lift)));
  const rest = poses[poses.length - 1]!;
  // per triangle, its rigid motion at every lift; clustered into pieces
  const pieces: Array<{ motions: Rigid[]; pts: number[] }> = [];
  const route = new Map<string, number[]>();
  for (const [mat, pos] of rest) {
    const ids: number[] = [];
    for (let t = 0; t < pos.length; t += 9) {
      const motions = poses.map((pose) => {
        const q = pose.get(mat);
        if (!q || q.length !== pos.length) throw new Error(`liftable "${name}": ${mat} draws a different number of triangles as it lifts`);
        return rigidMotion(pos, q, t, `${name} (${mat})`);
      });
      let piece = pieces.findIndex((p) => sameMotions(p.motions, motions));
      if (piece < 0) {
        pieces.push({ motions, pts: [] });
        piece = pieces.length - 1;
      }
      for (let k = 0; k < 9; k++) pieces[piece]!.pts.push(pos[t + k]!);
      ids.push(piece);
    }
    route.set(mat, ids);
  }
  // a moving piece becomes a part, pivoted where it moves least (a hinge)
  const partOf = new Map<number, number>();
  const tracks: AnimationTrack[] = [];
  let k = 0;
  pieces.forEach((p, i) => {
    if (p.motions.every(isIdentity)) return;
    const pivot = leastMoved(p.motions, p.pts);
    const partName = `${name}${n}-${++k}`;
    const { index, parentPivot } = m.movingPart(partName, pivot);
    partOf.set(i, index);
    const rotation: number[] = [];
    const translation: number[] = [];
    let prev: number[] | null = null;
    for (const motion of p.motions) {
      // one hemisphere throughout, so a sampler never turns the long way round
      let q: number[] = quaternion(motion.r);
      if (prev && q[0]! * prev[0]! + q[1]! * prev[1]! + q[2]! * prev[2]! + q[3]! * prev[3]! < 0) q = q.map((v) => -v);
      prev = q;
      rotation.push(...q);
      const at = apply(motion, pivot);
      translation.push(at[0] - parentPivot[0], at[1] - parentPivot[1], at[2] - parentPivot[2]);
    }
    tracks.push({ node: partName, path: "rotation", values: rotation }, { node: partName, path: "translation", values: translation });
  });
  // the rest pose, for real: every triangle routed to its piece's part
  m.drawRouted(new Map([...route].map(([mat, ids]) => [mat, ids.map((i) => partOf.get(i) ?? -1)])), () => draw(m, 1));
  if (tracks.length) m.animate({ name: `${name}${n}`, times: lifts, tracks, drive: { drive: "state" } });
}

/** Rounds to a millimetre (a pivot). */
function round3(v: number): number {
  return Math.round(v * 1000) / 1000;
}

