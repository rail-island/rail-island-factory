// The motion buttons of a character's model page (docs/site/catalog-site.md): a
// model with a `motion` clip (meshCore.ts ClipDrive) is a character, and every
// clip it carries gets a button named after the clip, played as the clip's drive
// and shape say -- nothing here knows the avatar or its clip names:
//
//   loop   a `time` or `distance` clip (idle, walk, run: in place, at its own pace,
//          which for a distance clip is the speed its drive states) and a `motion`
//          clip whose last sample repeats its first (fall): loops until another
//          button or Stop;
//   once   a `motion` clip that ends near where it starts (jump): plays once, then
//          the first `time` clip (idle) takes over, or the rest pose without one;
//   hold   a `motion` clip that ends in another pose (sit): eases into its end and
//          holds it.
//
// Pure: it reads clips as three.js AnimationClips carry them, no renderer.

/** How a button plays its clip. */
export type MotionPlay = "loop" | "once" | "hold";

export interface MotionButton {
  /** The clip's name. */
  name: string;
  /** The button's text: the clip's name with a capital. */
  label: string;
  play: MotionPlay;
  /** The clip's drive. */
  drive: string;
  /** A `distance` clip's pace, m/s. */
  speed?: number;
}

/** What the helper reads of a clip: three.js AnimationClip satisfies it. */
export interface ClipLike {
  name: string;
  tracks: ReadonlyArray<{ times: ArrayLike<number>; values: ArrayLike<number> }>;
}

type Drives = Record<string, { drive?: string; speed?: number }> | undefined;

/** A turn of more than this (radians) or a move of more than this (metres) between a clip's ends is another pose. */
export const NEAR_ANGLE = 0.5;
export const NEAR_DISTANCE = 0.1;
/** Two samples whose every value is this close are one pose: a closed loop (float32 noise aside). */
const SAME = 1e-4;

/**
 * The largest difference between a clip's first and last sample: the angle of any
 * rotation track, the distance of any other, and the largest difference of any one
 * value (a quaternion's sign aside).
 */
export function endGap(clip: ClipLike): { angle: number; distance: number; value: number } {
  let angle = 0;
  let distance = 0;
  let value = 0;
  for (const t of clip.tracks) {
    const n = t.times.length;
    const w = n ? t.values.length / n : 0;
    if (n < 2 || !Number.isInteger(w)) continue;
    const first = Array.from({ length: w }, (_, i) => t.values[i]!);
    const last = Array.from({ length: w }, (_, i) => t.values[(n - 1) * w + i]!);
    const flip = w === 4 && first.reduce((s, v, i) => s + v * last[i]!, 0) < 0 ? -1 : 1;
    value = Math.max(value, ...first.map((v, i) => Math.abs(v - flip * last[i]!)));
    if (w === 4) {
      const dot = Math.abs(first.reduce((s, v, i) => s + v * last[i]!, 0));
      angle = Math.max(angle, 2 * Math.acos(Math.min(1, dot)));
    } else {
      distance = Math.max(distance, Math.hypot(...first.map((v, i) => v - last[i]!)));
    }
  }
  return { angle, distance, value };
}

/** How a `motion` clip plays, from its shape. */
export function motionPlay(clip: ClipLike): MotionPlay {
  const gap = endGap(clip);
  if (gap.value < SAME) return "loop";
  return gap.angle <= NEAR_ANGLE && gap.distance <= NEAR_DISTANCE ? "once" : "hold";
}

/**
 * The buttons of a model's clips, in the model's clip order: none unless one of its
 * clips is a `motion` clip (a vehicle keeps its Start and Stop). A clip of a drive
 * that is not time, distance or motion gets no button.
 */
export function motionButtons(clips: readonly ClipLike[], drives: Drives): MotionButton[] {
  if (!clips.some((c) => drives?.[c.name]?.drive === "motion")) return [];
  const out: MotionButton[] = [];
  for (const clip of clips) {
    const d = drives?.[clip.name];
    const drive = d?.drive;
    if (drive !== "time" && drive !== "distance" && drive !== "motion") continue;
    out.push({
      name: clip.name,
      label: clip.name.charAt(0).toUpperCase() + clip.name.slice(1),
      play: drive === "motion" ? motionPlay(clip) : "loop",
      drive,
      ...(drive === "distance" && typeof d?.speed === "number" ? { speed: d.speed } : {}),
    });
  }
  return out;
}

/** The clip a one-shot motion returns to: the first `time` loop (idle), or null for the rest pose. */
export function restingMotion(buttons: readonly MotionButton[]): MotionButton | null {
  return buttons.find((b) => b.drive === "time") ?? null;
}

/** A button's tooltip: what it plays and, for a walk or run, its pace. */
export function motionTitle(b: MotionButton): string {
  const how = b.play === "loop" ? "in a loop" : b.play === "once" ? "once, then back" : "and hold its end";
  const pace = b.speed !== undefined ? ` in place at ${b.speed} m/s (${(b.speed * 3.6).toFixed(1)} km/h)` : "";
  return `Play ${b.name}${pace} ${how}`;
}
