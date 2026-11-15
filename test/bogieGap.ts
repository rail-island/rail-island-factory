// Whether a rail vehicle's bogies show in their skirt gaps, seen from the side: for each bogie
// (a top-level `bogieN` node of the rig), the share of its wheels' length the body covers at a
// height, on its -X and +X halves. A bogie standing off its gap is covered on one half only (the
// VIRM's leading bogie under its cab face, a low floor reaching over a truck's inner wheel).
// Used by test/worldTrainsSuite.ts and test/bogieGaps.test.ts.

import { ident, mul, parseGlb, readAccessor, trs, xformPoint, type Mat4, type Vec3 } from "../generator/glbParse";

interface Tri { a: Vec3; b: Vec3; c: Vec3; top: string }

function triangles(glb: Uint8Array): Tri[] {
  const { json, bin } = parseGlb(glb);
  const out: Tri[] = [];
  const visit = (i: number, parent: Mat4, top: string): void => {
    const n = json.nodes![i]!;
    if (n.extras?.interior) return;
    const w = mul(parent, n.matrix ? (n.matrix as Mat4) : trs(n.translation, n.rotation, n.scale));
    if (n.mesh != null) for (const pr of json.meshes![n.mesh]!.primitives) {
      if ((pr.mode ?? 4) !== 4 || pr.attributes.POSITION == null) continue;
      const pos = readAccessor(json, bin, pr.attributes.POSITION);
      const idx = pr.indices != null ? readAccessor(json, bin, pr.indices) : Array.from({ length: pos.length / 3 }, (_, k) => k);
      const v = (k: number): Vec3 => xformPoint(w, [pos[3 * k]!, pos[3 * k + 1]!, pos[3 * k + 2]!]);
      for (let k = 0; k + 2 < idx.length; k += 3) out.push({ a: v(idx[k]!), b: v(idx[k + 1]!), c: v(idx[k + 2]!), top });
    }
    for (const ch of n.children ?? []) visit(ch, w, top);
  };
  for (const r of json.scenes?.[json.scene ?? 0]?.nodes ?? []) visit(r, ident(), (json.nodes![r] as { name?: string }).name ?? "");
  return out;
}

const inTri = (x: number, y: number, t: Tri): boolean => {
  const [ax, ay] = t.a, [bx, by] = t.b, [cx, cy] = t.c;
  const d = (bx - ax) * (cy - ay) - (cx - ax) * (by - ay);
  if (Math.abs(d) < 1e-12) return false;
  const u = ((bx - x) * (cy - y) - (cx - x) * (by - y)) / d, v = ((cx - x) * (ay - y) - (ax - x) * (cy - y)) / d;
  return u >= -1e-6 && v >= -1e-6 && u + v <= 1 + 1e-6;
};

export interface BogieCover { node: string; x: number; at: "axle" | "high"; lo: number; hi: number }

/**
 * Each bogie's cover by the body on its +Z side: at the axle's height (`axle`, at most 0.42 m) and at
 * 80 % of the wheels' height (`high`), the covered shares of its -X (`lo`) and +X (`hi`) halves.
 */
export function bogieCovers(glb: Uint8Array, supports: ReadonlyArray<{ x: number; node?: string }>): BogieCover[] {
  const all = triangles(glb);
  const out: BogieCover[] = [];
  for (const s of supports) {
    if (!s.node) continue;
    const ws = all.filter((t) => t.top === s.node).flatMap((t) => [t.a, t.b, t.c]).filter((p) => p[1] < 1.3);
    if (!ws.length) continue;
    const x0 = Math.min(...ws.map((p) => p[0])), x1 = Math.max(...ws.map((p) => p[0]));
    const zw = Math.max(...ws.filter((p) => p[1] < 0.9).map((p) => p[2]));
    const top = Math.max(...ws.filter((p) => Math.abs(p[2] - zw) < 0.4).map((p) => p[1]));
    for (const [at, y] of [["axle", Math.min(0.42, top * 0.55)], ["high", top * 0.8]] as const) {
      const body = all.filter((t) => !/^bogie/.test(t.top) && Math.min(t.a[2], t.b[2], t.c[2]) > zw + 0.01
        && Math.min(t.a[1], t.b[1], t.c[1]) <= y && Math.max(t.a[1], t.b[1], t.c[1]) >= y
        && Math.max(t.a[0], t.b[0], t.c[0]) >= x0 && Math.min(t.a[0], t.b[0], t.c[0]) <= x1);
      const N = 60;
      let lo = 0, hi = 0;
      for (let i = 0; i < N; i++) {
        if (body.some((t) => inTri(x0 + ((i + 0.5) / N) * (x1 - x0), y, t))) {
          if (i < N / 2) lo++;
          else hi++;
        }
      }
      out.push({ node: s.node, x: s.x, at, lo: lo / (N / 2), hi: hi / (N / 2) });
    }
  }
  return out;
}

/** The covers that stand a bogie off its gap: one half covered more than the other, by over 0.15 at the axle, 0.25 higher up. */
export const offGap = (c: BogieCover): boolean => Math.abs(c.lo - c.hi) > (c.at === "axle" ? 0.15 : 0.25);
