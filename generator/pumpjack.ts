// The oil pumpjack's moving mechanism (industry-oil-pump): the cranks turn, the
// pitman arms follow, the walking beam rocks on its saddle and the polished rod
// rises and falls under the horsehead. Like the steam running gear
// (steamGear.ts), every rigid link is a part pivoted at one joint and the clip
// samples one crank revolution; here the clip is a time loop, `PUMP_STROKE`
// seconds a stroke. See docs/models/animation.md.

import type { AnimationTrack } from "./meshCore.ts";

/** Samples per crank revolution; the clip has one more, closing the loop. */
export const PUMP_SAMPLES = 48;
/** Seconds per stroke (one crank revolution). */
export const PUMP_STROKE = 6;
/** The clip's name. */
export const PUMP_CLIP = "pumping";

type V2 = [number, number];

/**
 * The mechanism's joints in the side view (x along the beam, y up) for a samson
 * post `h` high: the crank axle `crank`, the crank pin at rest `pin` (crank
 * radius `radius`, level ahead of the axle, so the rest pose is mid-stroke with
 * the beam level), the beam's saddle bearing `saddle`,
 * the equalizer bearing at rest `equalizer`, and the horsehead's radius about the
 * saddle `head` (the polished rod hangs at that distance in front of it).
 */
export interface PumpjackLayout {
  crank: V2;
  radius: number;
  pin: V2;
  saddle: V2;
  equalizer: V2;
  head: number;
}

export function pumpjackLayout(h: number): PumpjackLayout {
  // the crank sits on the gear reducer behind the samson post, clear of its rear
  // legs; the beam's underside runs from h + 0.5 at its tail to h + 1 at its nose
  const crank: V2 = [-4.4, 1.9];
  const radius = 0.7;
  const pin: V2 = [crank[0] + radius, crank[1]];
  return { crank, radius, pin, saddle: [0, h + 0.75], equalizer: [pin[0], h + 0.75 + 0.05 * pin[0]], head: 5.5 };
}

/** One sample of the mechanism: the crank's turn, the pin, the beam's tilt (radians, + lifts the horsehead), the equalizer. */
export interface PumpjackPose {
  crank: number;
  pin: V2;
  beam: number;
  equalizer: V2;
}

const rot = (o: V2, p: V2, a: number): V2 => {
  const dx = p[0] - o[0], dy = p[1] - o[1], c = Math.cos(a), s = Math.sin(a);
  return [o[0] + dx * c - dy * s, o[1] + dx * s + dy * c];
};
const dist = (a: V2, b: V2): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/**
 * The mechanism at every sample of one revolution: the crank turns clockwise seen
 * from +Z, and the beam's tilt is solved (Newton's method from the previous
 * sample) so the pitman arm keeps its rest length - the distance from the pin to
 * the equalizer at rest.
 */
export function pumpjackPoses(l: PumpjackLayout): PumpjackPose[] {
  const pitman = dist(l.pin, l.equalizer);
  const poses: PumpjackPose[] = [];
  let beam = 0;
  for (let k = 0; k <= PUMP_SAMPLES; k++) {
    const crank = (-2 * Math.PI * k) / PUMP_SAMPLES;
    const pin = rot(l.crank, l.pin, crank);
    for (let i = 0; i < 30; i++) {
      const f = dist(rot(l.saddle, l.equalizer, beam), pin) - pitman;
      if (Math.abs(f) < 1e-12) break;
      const e = 1e-7;
      const d = (dist(rot(l.saddle, l.equalizer, beam + e), pin) - pitman - f) / e;
      beam -= f / d;
    }
    poses.push({ crank, pin, beam, equalizer: rot(l.saddle, l.equalizer, beam) });
  }
  return poses;
}

const quatZ = (a: number): number[] => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];

/**
 * The clip's tracks for the parts `cranks` (pivot: the crank axle), `beam`
 * (pivot: the saddle), `pitman-arms` (pivot: the pin at rest) and `polished-rod`
 * (pivot: `rodTop`, the rod's top under the horsehead).
 */
export function pumpjackTracks(l: PumpjackLayout, rodTop: [number, number, number]): { times: number[]; tracks: AnimationTrack[] } {
  const poses = pumpjackPoses(l);
  const times = poses.map((_, k) => (PUMP_STROKE * k) / PUMP_SAMPLES);
  const rest = Math.atan2(l.equalizer[1] - l.pin[1], l.equalizer[0] - l.pin[0]);
  // the crank's angle runs on to -2 pi rather than wrapping, so neighbouring
  // samples are a small turn apart and the last is the first pose again
  const tracks: AnimationTrack[] = [
    { node: "cranks", path: "rotation", values: poses.flatMap((p) => quatZ(p.crank)) },
    { node: "beam", path: "rotation", values: poses.flatMap((p) => quatZ(p.beam)) },
    { node: "pitman-arms", path: "translation", values: poses.flatMap((p) => [p.pin[0], p.pin[1], 0]) },
    { node: "pitman-arms", path: "rotation", values: poses.flatMap((p) => quatZ(Math.atan2(p.equalizer[1] - p.pin[1], p.equalizer[0] - p.pin[0]) - rest)) },
    { node: "polished-rod", path: "translation", values: poses.flatMap((p) => [rodTop[0], rodTop[1] + l.head * p.beam, rodTop[2]]) },
  ];
  return { times, tracks };
}
