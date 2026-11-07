// How far each wheelset of a rail vehicle stands off the track on a curve, as the
// game places it (rail-island-webapp, core/motion/RailPose.ts): every section
// lies on the chord between its two outermost supports, every bogie stands on the
// track at its own centre turned along it. Used by test/steamOnCurve.test.ts.
// Distances in studs: the game draws a model at 1.5 studs a metre.

import type { MeshBuilder } from "../generator/meshBuilder";
import { parseGlb } from "../generator/glbParse";

type GlbNode = { name: string; translation?: number[]; children?: number[] };

/**
 * Every wheelset of a steam vehicle (its `wheelset-<n>` parts, steamGear.ts): the
 * axle's model x and the bogie node it rides, or null for one on the body.
 */
export function steamAxles(m: MeshBuilder): Array<{ x: number; node: string | null }> {
  const nodes = (parseGlb(m.toGlb("t", "vehicle")).json.nodes ?? []) as GlbNode[];
  const parent = new Map<number, number>();
  nodes.forEach((n, i) => { for (const c of n.children ?? []) parent.set(c, i); });
  return nodes.flatMap((n, i) => {
    if (!/^wheelset-\d+$/.test(n.name)) return [];
    const p = parent.has(i) ? nodes[parent.get(i)!]! : null;
    const x = (n.translation?.[0] ?? 0) + (p?.translation?.[0] ?? 0);
    return [{ x, node: p && /^bogie\d+$/.test(p.name) ? p.name : null }];
  });
}

/** The game's vehicle scale: studs per metre of the model. */
export const STUDS_PER_M = 1.5;

type V2 = [number, number];

/** The point `q` studs along a circle of radius r from (0, 0), turning toward +y, and its tangent. */
function arc(q: number, r: number): { p: V2; t: V2 } {
  const a = q / r;
  return { p: [r * Math.sin(a), r - r * Math.cos(a)], t: [Math.cos(a), Math.sin(a)] };
}

/** Signed distance of p from the circle (positive outward). */
const off = (p: V2, r: number): number => Math.hypot(p[0], p[1] - r) - r;

export interface WheelOffset {
  /** The axle's model x, metres. */
  x: number;
  /** The bogie node it rides, or null for the body. */
  node: string | null;
  /** Off the track centre line, studs (positive outward). */
  offset: number;
}

/**
 * Every wheelset of a built rigid steam vehicle (one section) on a curve of
 * radius `r` studs, posed as the game poses it. Throws for an articulated vehicle.
 */
export function wheelOffsets(m: MeshBuilder, r: number): WheelOffset[] {
  const rig = m.rig;
  if (!rig?.supports) throw new Error("no supports");
  if (rig.sections?.length) throw new Error("an articulated vehicle");
  const axles = steamAxles(m);
  if (!axles.length) throw new Error("no wheelset parts");
  const nose = Math.max(...axles.map((a) => a.x), ...rig.supports.map((s) => s.x)) + 5;
  // track distance (studs) of a model x; the arc runs from the nose rearward
  const q = (x: number): number => (nose - x) * STUDS_PER_M;
  const xs = rig.supports.map((s) => s.x);
  const front = Math.max(...xs);
  const rear = Math.min(...xs);
  const a = arc(q(front), r).p;
  const b = arc(q(rear), r).p;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dir: V2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  // the body's point at model x: the chord's middle moved along it (RailPose.span)
  const qMid = (q(front) + q(rear)) / 2;
  const mid: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const body = (x: number): V2 => [mid[0] + dir[0] * (q(x) - qMid), mid[1] + dir[1] * (q(x) - qMid)];
  const pivots = new Map(rig.supports.filter((s) => s.node).map((s) => [s.node!, s.x] as const));
  return axles.map((ax) => {
    if (ax.node === null) return { x: ax.x, node: null, offset: off(body(ax.x), r) };
    const px = pivots.get(ax.node)!;
    const { p, t } = arc(q(px), r);
    const k = q(ax.x) - q(px);
    return { x: ax.x, node: ax.node, offset: off([p[0] + t[0] * k, p[1] + t[1] * k], r) };
  });
}

/** The body's offset from the track at model x (a point of the body, not a wheel), studs. */
export function bodyOffsetAt(m: MeshBuilder, r: number, x: number): number {
  const rig = m.rig!;
  const xs = rig.supports!.map((s) => s.x);
  const front = Math.max(...xs);
  const rear = Math.min(...xs);
  const nose = front + 20;
  const q = (v: number): number => (nose - v) * STUDS_PER_M;
  const a = arc(q(front), r).p;
  const b = arc(q(rear), r).p;
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const dir: V2 = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
  const qMid = (q(front) + q(rear)) / 2;
  const mid: V2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  return off([mid[0] + dir[0] * (q(x) - qMid), mid[1] + dir[1] * (q(x) - qMid)], r);
}
