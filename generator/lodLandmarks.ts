// The shared helpers of the landmark, tower and skyscraper LODs (docs/models/lod.md):
// a distant church, cathedral, tower or skyscraper is its masses, roofs, spires,
// domes and colour bands, never its windows. Each design's `*Lod` builder lives
// next to its full build and draws with these.
//
// Metres, +Y up, ground at y = 0, as the full models. Every solid here is open
// underneath (nothing is seen from below) and every face is a planar convex
// polygon; a mass standing on another has no bottom, so no two faces of
// different colours share a plane.

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";

/** A lathe profile: (radius, y) from the bottom up; a radius of 0 closes it in a point. */
export type LodProfile = ReadonlyArray<readonly [r: number, y: number]>;

/**
 * A solid of revolution about (cx, cz): n-gon rings through `profile`, a point
 * where the radius reaches 0 and, unless `top` is false, a cap on a last ring
 * that stays open. A dome, an onion, a drum or a needle spire from afar.
 */
export function lodLathe(m: MeshBuilder, mat: string, cx: number, cz: number, profile: LodProfile, n: number, rot = 0, top = true): void {
  for (let i = 0; i + 1 < profile.length; i++) {
    const [r0, y0] = profile[i]!;
    const [r1, y1] = profile[i + 1]!;
    if (r1 <= 0) {
      m.spire(mat, ngon(n, r0, rot, cx, cz), y0, y1);
      return;
    }
    m.loft(mat, ngon(n, r0, rot, cx, cz), y0, ngon(n, r1, rot, cx, cz), y1, top && i + 2 === profile.length);
  }
}

/** A solid in one of the forms the skyscraper adapter draws. */
export type LodMass =
  /** A vertical prism over `ring`; its top cap in `top` (a roof colour), or none when false. */
  | { prism: Ring; y: readonly [number, number]; mat: string; top?: string | false }
  /** Walls between two rings of equal length (a taper or a twist), capped like a prism. */
  | { loft: readonly [Ring, Ring]; y: readonly [number, number]; mat: string; top?: string | false }
  /** A pointed roof or spire over `spire`. */
  | { spire: Ring; y: readonly [number, number]; mat: string };

/** Draws `masses` in order: the skyscraper adapter's one renderer. */
export function lodMasses(m: MeshBuilder, masses: readonly LodMass[]): void {
  for (const s of masses) {
    const [y0, y1] = s.y;
    if ("spire" in s) {
      m.spire(s.mat, s.spire, y0, y1);
      continue;
    }
    const [lower, upper] = "prism" in s ? [s.prism, s.prism] : s.loft;
    m.loft(s.mat, lower, y0, upper, y1, false);
    if (s.top !== false) m.cap(s.top ?? s.mat, upper, y1);
  }
}

/**
 * Colour bands up a shaft: the walls from y0 to y1 cut every `step` metres,
 * alternately `a` and `b` (b the thinner, `frac` of each step), as a curtain
 * wall's floor slabs or a tower's stripes read from afar. The rings may taper:
 * `ringAt(y)` gives the shaft's ring at each height.
 */
export function lodStripes(y0: number, y1: number, step: number, frac: number, a: string, b: string, ringAt: (y: number) => Ring): LodMass[] {
  const out: LodMass[] = [];
  const cuts: Array<[number, number, string]> = [];
  for (let y = y0; y < y1 - 1e-6; y += step) {
    const mid = Math.min(y1, y + step * (1 - frac));
    cuts.push([y, mid, a]);
    if (mid < y1 - 1e-6) cuts.push([mid, Math.min(y1, y + step), b]);
  }
  for (const [lo, hi, mat] of cuts) out.push({ loft: [ringAt(lo), ringAt(hi)], y: [lo, hi], mat, top: false });
  return out;
}
