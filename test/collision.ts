// Triangle-triangle intersection between parts of a posed model, for the rig's
// clearance tests (test/rig.test.ts): which triangles of one set cut through
// which of another. A uniform grid finds the candidates; a pair counts when an
// edge of either triangle crosses the other's interior.

import type * as THREE from "three";

export type V3 = [number, number, number];
export type Tri = [V3, V3, V3];

/** Every triangle of `root` in world space, with the rig node it belongs to (its nearest ancestor in `nodes`). */
export function worldTriangles(root: THREE.Object3D, nodes: ReadonlySet<string>): Array<{ t: Tri; owner: string }> {
  root.updateMatrixWorld(true);
  const out: Array<{ t: Tri; owner: string }> = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh) return;
    let owner: THREE.Object3D | null = mesh;
    while (owner && !nodes.has(owner.name)) owner = owner.parent;
    const pos = mesh.geometry.getAttribute("position");
    const e = mesh.matrixWorld.elements;
    const at = (i: number): V3 => {
      const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
      return [e[0]! * x + e[4]! * y + e[8]! * z + e[12]!, e[1]! * x + e[5]! * y + e[9]! * z + e[13]!, e[2]! * x + e[6]! * y + e[10]! * z + e[14]!];
    };
    for (let i = 0; i + 2 < pos.count; i += 3) out.push({ t: [at(i), at(i + 1), at(i + 2)], owner: owner?.name ?? "" });
  });
  return out;
}

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Whether segment p-q crosses the interior of triangle abc (touching does not count). */
function segmentCrosses(p: V3, q: V3, [a, b, c]: Tri): boolean {
  const e1 = sub(b, a);
  const e2 = sub(c, a);
  const d = sub(q, p);
  const h = cross(d, e2);
  const det = dot(e1, h);
  if (Math.abs(det) < 1e-12) return false;
  const s = sub(p, a);
  const u = dot(s, h) / det;
  if (u < 1e-6 || u > 1 - 1e-6) return false;
  const k = cross(s, e1);
  const v = dot(d, k) / det;
  if (v < 1e-6 || u + v > 1 - 1e-6) return false;
  const t = dot(e2, k) / det;
  return t > 1e-6 && t < 1 - 1e-6;
}

function crosses(a: Tri, b: Tri): boolean {
  for (let i = 0; i < 3; i++) if (segmentCrosses(a[i]!, a[(i + 1) % 3]!, b)) return true;
  for (let i = 0; i < 3; i++) if (segmentCrosses(b[i]!, b[(i + 1) % 3]!, a)) return true;
  return false;
}

function bounds(t: Tri): { lo: V3; hi: V3 } {
  const lo: V3 = [0, 1, 2].map((k) => Math.min(t[0][k]!, t[1][k]!, t[2][k]!)) as V3;
  const hi: V3 = [0, 1, 2].map((k) => Math.max(t[0][k]!, t[1][k]!, t[2][k]!)) as V3;
  return { lo, hi };
}

/** The pairs "i:j" of a triangle of `a` and one of `b` that cut through each other. */
export function intersectingPairs(a: readonly Tri[], b: readonly Tri[], cell = 0.3): Set<string> {
  const grid = new Map<string, number[]>();
  const cells = (t: Tri, visit: (key: string) => void): void => {
    const { lo, hi } = bounds(t);
    for (let x = Math.floor(lo[0] / cell); x <= Math.floor(hi[0] / cell); x++) {
      for (let y = Math.floor(lo[1] / cell); y <= Math.floor(hi[1] / cell); y++) {
        for (let z = Math.floor(lo[2] / cell); z <= Math.floor(hi[2] / cell); z++) visit(`${x},${y},${z}`);
      }
    }
  };
  b.forEach((t, j) => cells(t, (key) => {
    const list = grid.get(key);
    if (list) list.push(j);
    else grid.set(key, [j]);
  }));
  const out = new Set<string>();
  a.forEach((t, i) => {
    const { lo, hi } = bounds(t);
    const seen = new Set<number>();
    cells(t, (key) => {
      for (const j of grid.get(key) ?? []) {
        if (seen.has(j)) continue;
        seen.add(j);
        const o = bounds(b[j]!);
        if (o.lo[0] > hi[0] || o.hi[0] < lo[0] || o.lo[1] > hi[1] || o.hi[1] < lo[1] || o.lo[2] > hi[2] || o.hi[2] < lo[2]) continue;
        if (crosses(t, b[j]!)) out.add(`${i}:${j}`);
      }
    });
  });
  return out;
}

/**
 * Parallel rays along `dir`, `spacing` apart, over everything `tris` covers:
 * where the first triangle a ray meets faces away from it, the ray has come in
 * through a hole and sees the inside of the model. Returns those rays' hit
 * points (none for a closed model; three.js culls back faces, so each would
 * show as a see-through gap).
 */
export function insideSeen(tris: readonly Tri[], dir: V3, spacing: number): V3[] {
  const l = Math.hypot(...dir);
  const d: V3 = [dir[0] / l, dir[1] / l, dir[2] / l];
  // a frame across the rays
  const helper: V3 = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const u = cross(helper, d);
  const ul = Math.hypot(...u);
  const uu: V3 = [u[0] / ul, u[1] / ul, u[2] / ul];
  const vv = cross(d, uu);
  const cell = 0.2;
  const grid = new Map<string, number[]>();
  let lo = [Infinity, Infinity];
  let hi = [-Infinity, -Infinity];
  let far = 0;
  tris.forEach((t, i) => {
    const pu = t.map((p) => dot(p, uu));
    const pv = t.map((p) => dot(p, vv));
    far = Math.max(far, ...t.map((p) => Math.abs(dot(p, d))));
    const [u0, u1, v0, v1] = [Math.min(...pu), Math.max(...pu), Math.min(...pv), Math.max(...pv)];
    lo = [Math.min(lo[0]!, u0), Math.min(lo[1]!, v0)];
    hi = [Math.max(hi[0]!, u1), Math.max(hi[1]!, v1)];
    for (let a = Math.floor(u0 / cell); a <= Math.floor(u1 / cell); a++) {
      for (let b = Math.floor(v0 / cell); b <= Math.floor(v1 / cell); b++) {
        const key = `${a},${b}`;
        const list = grid.get(key);
        if (list) list.push(i);
        else grid.set(key, [i]);
      }
    }
  });
  const seen: V3[] = [];
  // half a step in from the outline, so no ray runs along a face at the edge of it
  for (let a = lo[0]! + spacing / 2; a <= hi[0]!; a += spacing) {
    for (let b = lo[1]! + spacing / 2; b <= hi[1]!; b += spacing) {
      const origin: V3 = [0, 1, 2].map((k) => a * uu[k]! + b * vv[k]! - (far + 1) * d[k]!) as V3;
      let best = Infinity;
      let back = false;
      for (const i of grid.get(`${Math.floor(a / cell)},${Math.floor(b / cell)}`) ?? []) {
        const [p0, p1, p2] = tris[i]!;
        const e1 = sub(p1, p0);
        const e2 = sub(p2, p0);
        const h = cross(d, e2);
        const det = dot(e1, h);
        if (Math.abs(det) < 1e-12) continue;
        const s = sub(origin, p0);
        const w = dot(s, h) / det;
        if (w < 0 || w > 1) continue;
        const k = cross(s, e1);
        const v = dot(d, k) / det;
        if (v < 0 || w + v > 1) continue;
        const t = dot(e2, k) / det;
        if (t <= 0 || t > best + 1e-9) continue;
        // on a tie (an edge two faces share) the front one wins: that is what shows
        const away = dot(cross(e1, e2), d) > 0;
        back = t < best - 1e-9 ? away : back && away;
        best = Math.min(best, t);
      }
      if (back) seen.push([0, 1, 2].map((k) => origin[k]! + best * d[k]!) as V3);
    }
  }
  return seen;
}
