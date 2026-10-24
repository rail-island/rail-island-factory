// Passenger doors that open (docs/models/doors.md): how a door's leaves move
// from shut (0) to open (1) in each motion family -- folding, swinging (hinged)
// and plug (out, then along the side) -- and `openable`, which turns a door drawn
// at any opening into moving leaf parts and adds them to its side's `door` clip.
// The shut pose is the rest pose, so a thumbnail, the source tree and a consumer
// that plays no door clip see the vehicle as it always was. Apart from
// meshCore.ts so that only the designs drawn with the coach kit
// (csdCoachParts.ts) carry this code in their standalone JS model.

import { mechanism } from "./liftable.ts";
import type { DoorSide, MeshCore, Vec3 } from "./meshCore.ts";

/** How many opening doors each model has drawn, for their part names. */
const doorCount = new WeakMap<MeshCore, number>();

/** Opening samples of a door clip, plus the closing one. */
export const DOOR_SAMPLES = 8;

/** Which jamb of a door: the one at its low or its high x (Factory frame, before any turn). */
export type Jamb = "low" | "high";

/**
 * How a door's leaves open (the prototype's mechanism):
 * - `fold`: leaves hinged in pairs fold inward, each pair against its jamb -- two
 *   leaves fold against `from`, four make a pair at each jamb (a Tatra tram's door),
 *   three a pair at `from` and a single swinging leaf at the other jamb;
 * - `swing`: leaves hinged at their jamb swing inward -- one at `from`, two from
 *   both jambs (an older coach's double door);
 * - `plug`: leaves step `out` from the skin, then slide along it by their own
 *   width -- one toward `toward`, two apart (a modern unit's sliding plug door).
 */
export type DoorMotion =
  | { kind: "fold"; leaves: 2 | 3 | 4; from?: Jamb }
  | { kind: "swing"; leaves: 1 | 2; from?: Jamb }
  | { kind: "plug"; leaves: 1 | 2; toward?: Jamb; out?: number };

/** How far a folding or swinging leaf turns, open (radians). */
export const DOOR_FOLD_ANGLE = (80 * Math.PI) / 180;
/** How far a plug leaf steps out from the skin before it slides (metres). */
export const DOOR_PLUG_OUT = 0.08;
/** The part of a plug door's opening spent stepping out; the rest slides. */
const PLUG_STEP = 0.25;
/** The gap between two leaves of one door (metres). */
export const LEAF_GAP = 0.012;

/** One leaf: its x span (Factory frame) and how it moves with the opening. */
export interface Leaf {
  x0: number;
  x1: number;
  /** Where a point of the shut leaf goes at opening `o` (0..1); `hz` is the hinge line's z. */
  move: (o: number, hz: number) => (p: Vec3) => Vec3;
}

/** The rotation about the vertical line through (hx, hz) taking direction (dx, dz) to (ex, ez), then a shift. */
function turn(hx: number, hz: number, d: [number, number], e: [number, number], to: [number, number]): (p: Vec3) => Vec3 {
  const a = Math.atan2(d[0] * e[1] - d[1] * e[0], d[0] * e[0] + d[1] * e[1]);
  const [c, s] = [Math.cos(a), Math.sin(a)];
  return ([x, y, z]) => {
    const [rx, rz] = [x - hx, z - hz];
    return [to[0] + rx * c - rz * s, y, to[1] + rx * s + rz * c];
  };
}

/**
 * The leaves of a door spanning x0..x1 on side `s` (+1 the +Z side) and how
 * each moves. Inward is toward the car's centre line.
 */
export function doorLeaves(x0: number, x1: number, s: number, motion: DoorMotion): Leaf[] {
  const n = motion.leaves;
  const w = (x1 - x0 - (n - 1) * LEAF_GAP) / n;
  const span = (k: number): [number, number] => [x0 + k * (w + LEAF_GAP), x0 + k * (w + LEAF_GAP) + w];
  const out: Leaf[] = [];
  if (motion.kind === "plug") {
    const step = motion.out ?? DOOR_PLUG_OUT;
    for (let k = 0; k < n; k++) {
      // two leaves part; one slides toward its jamb
      const dir = n === 2 ? (k === 0 ? -1 : 1) : (motion.toward ?? "low") === "low" ? -1 : 1;
      const [a, b] = span(k);
      out.push({
        x0: a,
        x1: b,
        move: (o) => {
          const dz = s * step * Math.min(1, o / PLUG_STEP);
          const dx = dir * (w + LEAF_GAP) * Math.max(0, (o - PLUG_STEP) / (1 - PLUG_STEP));
          return ([x, y, z]) => [x + dx, y, z + dz];
        },
      });
    }
    return out;
  }
  // folding and swinging leaves: groups hinged at a jamb, leaf j of a group the j-th from it
  const from = motion.from ?? "low";
  // how many leaves hang at the low and at the high jamb
  const atFrom = motion.kind === "fold" ? 2 : 1;
  const atOther = n - atFrom;
  const [low, high] = from === "low" ? [atFrom, atOther] : [atOther, atFrom];
  const groups: Array<{ jamb: number; dir: number; leaves: number[] }> = [];
  if (low > 0) groups.push({ jamb: x0, dir: 1, leaves: Array.from({ length: low }, (_, j) => j) });
  if (high > 0) groups.push({ jamb: x1, dir: -1, leaves: Array.from({ length: high }, (_, j) => n - 1 - j) });
  for (const g of groups) {
    g.leaves.forEach((k, j) => {
      const [a, b] = span(k);
      out[k] = {
        x0: a,
        x1: b,
        move: (o, hz) => {
          const th = o * DOOR_FOLD_ANGLE;
          const along: [number, number] = [g.dir, 0];
          // the first leaf turns inward about the jamb; the second turns back out
          // from the first one's free edge, its own free edge kept on the door line
          const first: [number, number] = [g.dir * Math.cos(th), -s * Math.sin(th)];
          const near = g.dir > 0 ? a : b;
          if (j === 0) return turn(near, hz, along, first, [near, hz]);
          const knee: [number, number] = [g.jamb + (near - g.jamb) * Math.cos(th), hz - s * Math.abs(near - g.jamb) * Math.sin(th)];
          return turn(near, hz, along, [g.dir * Math.cos(th), s * Math.sin(th)], knee);
        },
      };
    });
  }
  return out;
}

/**
 * Draws a passenger door that opens as moving leaf parts: `draw(m, o)` draws
 * the door's moving pieces at opening `o` (0 shut, 1 open) through the builder
 * it is handed, every piece moved only rigidly (`MeshCore.moved` with a leaf's
 * `move`). The shut pose is drawn into `m` as the rest pose; the leaves become
 * parts `door<n>-<k>` (children of the part being drawn) and their tracks join
 * the clip `doors-<side>` (`doors-<side>-<part>` inside a car part), drive
 * `door`, where the side is the one the leaves stand on in the model.
 */
export function openable<T extends MeshCore>(m: T, draw: (m: T, open: number) => void): void {
  const n = (doorCount.get(m) ?? 0) + 1;
  doorCount.set(m, n);
  const { times, tracks, meanZ } = mechanism(m, `door${n}-`, DOOR_SAMPLES, 0, draw, `door ${n}`);
  if (!tracks.length) return;
  const side: DoorSide = meanZ >= 0 ? "right" : "left";
  const part = m.currentPartName();
  const name = part ? `doors-${side}-${part}` : `doors-${side}`;
  // every door of a car's side joins one clip (same times and drive by construction)
  const joined = m.animations().find((c) => c.name === name);
  if (joined) joined.tracks.push(...tracks);
  else m.animate({ name, times, tracks, drive: { drive: "door", side } });
}
