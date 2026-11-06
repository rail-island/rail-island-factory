// The detailed ends of a refined world bus (worldBusKit.ts WorldBusSpec.detail;
// docs/models/world-buses-detail.md): what the kit draws on the nose and the tail
// of every bus that opts in, in place of its plain slabs - the windscreen with
// real wipers at rest, head lamps with round lenses in their housings, a slatted
// grille, the maker's badge, a bumper with its rubber strip, the plate, fog lamps
// and a tow eye's cover; at the rear the lamp columns in housings, the engine
// flap's seam, latches and louvres, the maker's name, the bumper with the plate,
// its lamp and the red reflectors. A design's own fittings (WorldBusSpec.extras,
// worldBusRefined.ts) are drawn after these.
//
// Proud of the shell (metres): housings 0.008, lamps and slats 0.016-0.02, round
// lenses 0.03, the bumper 0.03, what sits on it 0.038-0.045 -- every stack
// a few millimetres apart, so no two faces lie in one plane.

import type { MeshBuilder } from "./meshBuilder.ts";
import { endBadge, endBar, endLamp, endLettering, endSlab, wiper, type BusFrame } from "./busKit.ts";
import type { CityCtx } from "./cityBuses.ts";
import type { WorldBusSpec } from "./worldBusKit.ts";

/** A refined bus's choices for its ends; the kit's defaults otherwise. */
export interface EndFinish {
  /** The wipers at the windscreen's foot: each its pivot's z, length and angle (busKit.ts wiper). */
  wipers?: Array<[number, number, number]>;
  /** The badge on the nose: its centre's height and radius, a three-pointed star; null for none. */
  badge?: { y: number; r: number; star?: boolean } | null;
  /** The front and rear bumpers' height range; null for none (a design drawing its own). */
  bumper?: readonly [number, number] | null;
  /** The bumper's colour ("bumper" by default). */
  bumperMat?: string;
  /** Fog lamps in the front bumper. */
  fog?: boolean;
  /** The maker's name on the tail: its height and half width; null for none. */
  name?: { y: number; half: number } | null;
}

/** The bumper's height range of `s`: from just above its underside up to below its lamps, at most 22 cm. */
function bumperOf(s: WorldBusSpec, lampsFoot: number): readonly [number, number] | null {
  const fin = s.finish ?? {};
  if (fin.bumper === null) return null;
  if (fin.bumper) return fin.bumper;
  const y0 = s.floor + 0.015;
  const y1 = Math.min(lampsFoot - 0.05, y0 + 0.22);
  return y1 - y0 > 0.12 ? [y0, y1] : null;
}

/**
 * The windscreen on the nose `f` describes: its frame, the glass, the display behind
 * its top, the wipers at rest on its foot, an upper deck's front windows split by a
 * pillar.
 */
export function detailedGlazing(m: MeshBuilder, f: BusFrame, s: WorldBusSpec): void {
  const sc = s.screen;
  endSlab(m, "frame", f, 1, -sc.half - 0.05, sc.half + 0.05, sc.y0 - 0.04, sc.y1 + 0.03, 0.01);
  endSlab(m, "glass", f, 1, -sc.half, sc.half, sc.y0, sc.y1, 0.02);
  if (sc.sign) {
    endSlab(m, "sign", f, 1, -sc.half + 0.12, sc.half - 0.12, sc.sign[0], sc.sign[1], 0.026);
    // the route number left, the destination right
    endSlab(m, "signText", f, 1, -sc.half + 0.2, -sc.half + 0.45, sc.sign[0] + 0.04, sc.sign[1] - 0.04, 0.03);
    endSlab(m, "signText", f, 1, -sc.half + 0.6, sc.half - 0.3, (sc.sign[0] + sc.sign[1]) / 2 - 0.035, (sc.sign[0] + sc.sign[1]) / 2 + 0.035, 0.03);
  }
  const len = Math.min(1.05, sc.half * 0.88);
  const wipers = s.finish?.wipers ?? [[-sc.half + 0.14, len, 6], [0.08, len, 6]];
  for (const [z, l, deg] of wipers) wiper(m, f, 1, z, sc.y0 + 0.06, l, deg);
  if (sc.upper) {
    endSlab(m, "frame", f, 1, -sc.half - 0.05, sc.half + 0.05, sc.upper[0] - 0.04, sc.upper[1] + 0.03, 0.01);
    endSlab(m, "glass", f, 1, -sc.half, sc.half, sc.upper[0], sc.upper[1], 0.02);
    endSlab(m, "frame", f, 1, -0.035, 0.035, sc.upper[0] + 0.005, sc.upper[1] - 0.005, 0.03);
  }
}

/** The nose's lamps, grille, badge and bumper (not on a bonneted bus: its bonnet carries them). */
export function detailedNose(c: CityCtx, s: WorldBusSpec): void {
  const m = c.m();
  const f = c.frame;
  const hw = c.hw;
  const fin = s.finish ?? {};
  const l = s.lamps;
  const yc = (l.y0 + l.y1) / 2;
  for (const sd of [-1, 1]) {
    if (l.kind === "corner") {
      // a dark cluster: two round lenses under its glass, the indicator outside
      const w = l.w ?? 0.36;
      const zo = sd * (hw - 0.07);
      const zi = zo - sd * w;
      const [za, zb] = [Math.min(zi, zo), Math.max(zi, zo)];
      endSlab(m, "frame", f, 1, za - 0.02, zb + 0.02, l.y0 - 0.02, l.y1 + 0.02, 0.008);
      // kept clear of the indicator: the lenses' rings end inside 72 % of the cluster
      const rr = Math.min((l.y1 - l.y0) * 0.38, (0.72 * w - 0.065) / 4.3);
      for (const k of [0, 1]) endLamp(m, "lampHead", f, 1, zi + sd * (rr + 0.03 + k * rr * 2.3), yc, rr, 0.03, "chrome", 10);
      endSlab(m, "lampAmber", f, 1, sd > 0 ? zb - w * 0.28 : za, sd > 0 ? zb : za + w * 0.28, l.y0 + 0.01, l.y1 - 0.01, 0.018);
    } else {
      // round lamps in chrome rings on a dark bezel, the indicator outside
      const zc = sd * (hw - 0.32);
      const rr = (l.y1 - l.y0) / 2;
      endSlab(m, "frame", f, 1, zc - 0.24, zc + 0.24, l.y0 - 0.03, l.y1 + 0.03, 0.008);
      for (const dz of [-0.11, 0.11]) endLamp(m, "lampHead", f, 1, zc + dz, yc, rr * 0.78, 0.03, "chrome", 12);
      endSlab(m, "lampAmber", f, 1, sd * (hw - 0.06) - 0.035, sd * (hw - 0.06) + 0.035, l.y0, l.y1, 0.018);
    }
  }
  if (s.grille) {
    // a dark surround and its slats
    const [g0, g1, gh] = s.grille;
    endSlab(m, "frame", f, 1, -gh - 0.03, gh + 0.03, g0 - 0.03, g1 + 0.03, 0.008);
    const n = Math.max(2, Math.floor((g1 - g0) / 0.065));
    const p = (g1 - g0) / n;
    for (let i = 0; i < n; i++) endSlab(m, "grille", f, 1, -gh, gh, g0 + i * p + p * 0.2, g0 + (i + 1) * p - p * 0.2, 0.018);
  }
  const badge = fin.badge === undefined ? { y: (s.grille ? s.grille[1] : l.y1) + 0.12, r: 0.075 } : fin.badge;
  if (badge) endBadge(m, f, 1, 0, badge.y, badge.r, 0.026, badge.star ?? false);
  const bump = bumperOf(s, l.y0 - 0.02);
  if (bump) {
    const [b0, b1] = bump;
    endSlab(m, fin.bumperMat ?? "bumper", f, 1, -hw + 0.03, hw - 0.03, b0, b1, 0.03);
    // its rubber strip, the plate, the tow eye's cover, the fog lamps
    endSlab(m, "rubber", f, 1, -hw + 0.05, hw - 0.05, b1 - 0.04, b1 - 0.01, 0.038);
    const pm = (b0 + b1 - 0.04) / 2;
    endSlab(m, "plate", f, 1, -0.26, 0.26, pm - 0.055, pm + 0.055, 0.045);
    endSlab(m, "frame", f, 1, -0.5, -0.38, pm - 0.04, pm + 0.04, 0.042);
    if (fin.fog ?? true) for (const sd of [-1, 1]) endLamp(m, "lampHead", f, 1, sd * (hw - 0.3), pm, 0.04, 0.042, "frame", 10);
  } else {
    const py = Math.max(s.floor + 0.12, 0.38);
    endSlab(m, "plate", f, 1, -0.26, 0.26, py, py + 0.12, 0.016);
  }
}

/** The tail: its window, the engine flap with its louvres, seam and latches, the lamp columns, the name, the bumper. */
export function detailedRear(c: CityCtx, s: WorldBusSpec): void {
  const m = c.m();
  const f = c.frame;
  const hw = c.hw;
  const fin = s.finish ?? {};
  const b = s.back;
  if (b.window) {
    endSlab(m, "frame", f, -1, -b.window[2] - 0.05, b.window[2] + 0.05, b.window[0] - 0.04, b.window[1] + 0.04, 0.01);
    endSlab(m, "glassDark", f, -1, -b.window[2], b.window[2], b.window[0], b.window[1], 0.02);
    // the third brake lamp over it
    endSlab(m, "lampRed", f, -1, -0.2, 0.2, b.window[1] + 0.06, b.window[1] + 0.1, 0.016);
  }
  const zIn = hw - 0.28; // inside the lamp columns
  if (b.grille) {
    // the engine flap: a seam round it, its louvres, two latches
    const [g0, g1] = b.grille;
    const [y0, y1] = [g0 - 0.06, g1 + 0.06];
    const z = zIn - 0.06;
    for (const [a, bb] of [[[-z, y0], [z, y0]], [[-z, y1], [z, y1]], [[-z, y0], [-z, y1]], [[z, y0], [z, y1]]] as Array<[[number, number], [number, number]]>) endBar(m, "frame", f, -1, a, bb, 0.014, 0.012);
    const n = Math.max(2, Math.floor((g1 - g0) / 0.09));
    const p = (g1 - g0) / n;
    for (let i = 0; i < n; i++) endSlab(m, "grille", f, -1, -z + 0.08, z - 0.08, g0 + i * p + p * 0.18, g0 + (i + 1) * p - p * 0.18, 0.012);
    for (const sd of [-1, 1]) endSlab(m, "chrome", f, -1, sd * (z - 0.2) - 0.06, sd * (z - 0.2) + 0.06, y0 + 0.02, y0 + 0.05, 0.02);
  }
  for (const sd of [-1, 1]) {
    // the lamp column in its housing: reversing, red, brake, indicator (bottom up)
    const zc = sd * (hw - 0.13);
    const rows: Array<[string, number]> = [["lampHead", 0.1], ["lampRed", 0.14], ["lampRed", 0.14], ["lampAmber", 0.12]];
    const top = b.lamps + rows.reduce((t, [, h]) => t + h, 0);
    endSlab(m, "frame", f, -1, zc - 0.085, zc + 0.085, b.lamps - 0.02, top + 0.01, 0.008);
    let y = b.lamps;
    for (const [mat, h] of rows) {
      endSlab(m, mat, f, -1, zc - 0.07, zc + 0.07, y + 0.005, y + h - 0.01, 0.018);
      y += h;
    }
  }
  const name = fin.name === undefined ? { y: b.window ? b.window[0] - 0.16 : b.lamps + 0.62, half: 0.36 } : fin.name;
  if (name && !(b.grille && name.y > b.grille[0] - 0.1 && name.y < b.grille[1] + 0.1)) endLettering(m, f, -1, -name.half, name.half, name.y, 0.05, 0.016);
  const bump = bumperOf(s, b.lamps - 0.02);
  if (bump) {
    const [b0, b1] = bump;
    endSlab(m, fin.bumperMat ?? "bumper", f, -1, -hw + 0.03, hw - 0.03, b0, b1, 0.03);
    endSlab(m, "rubber", f, -1, -hw + 0.05, hw - 0.05, b1 - 0.04, b1 - 0.01, 0.038);
    const pm = (b0 + b1 - 0.04) / 2;
    endSlab(m, "plate", f, -1, -0.26, 0.26, pm - 0.055, pm + 0.055, 0.045);
    endSlab(m, "chrome", f, -1, -0.08, 0.08, pm + 0.06, pm + 0.085, 0.045);
    for (const sd of [-1, 1]) endLamp(m, "reflector", f, -1, sd * (hw - 0.2), pm, 0.04, 0.042, undefined, 8);
  } else {
    const py = Math.max(s.floor + 0.12, 0.38);
    endSlab(m, "plate", f, -1, -0.26, 0.26, py, py + 0.12, 0.016);
  }
}
