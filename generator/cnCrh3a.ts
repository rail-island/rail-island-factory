// The CRH3A (CRRC Changchun's 250 km/h Hexie, in service since December 2017) on the series kit
// (shinkansen.ts): its own Chinese cab face (seriesCab.ts), not the Velaro's - one smooth head from the
// skirt to the roof: a broad rounded snout low on the face carrying the coupler hatch (only a dark seam
// outline flush in the surface), above it the face leaning back to the slanting almond lamp housings at
// its corners, the three grille slots between them, and the long raked windscreen wrapping round onto
// the cab sides; white with the dark navy window band, the single blue line under it ending in a
// pointed flag on the nose, and the gold "eye" round the cab side window. Narrowed from its real
// 3.36 m to the Shinkansen gauge's 3.3 m. See docs/models/china-units.md, "The CRH3A's body".
//
// Measured from assets/cr-crh3a/ (SOURCES.md), the Changchun sets CRH3A-5230 - 5257: 5238 at Chengdu
// East at three quarters from the front (the face: the snout and its seam, the lamps, the grille, the
// windscreen), 5253 at Guilin and at Chengjiayao and 5244 at Zhenjiang near side-on (the profile, the
// eye, the line and its flag, the band's front end with the CRH emblem, the door). Heights over the
// rail from the face's own span (skirt 0.45 m to crown 4.05 m), d behind the tip from the door.

import type { MaterialSpec } from "./meshBuilder.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { NO_NOSE } from "./seriesHelpers.ts";

type Band = readonly [number, number, string];
const c = (hex: string, r = 0.4): MaterialSpec => paint(hex, r);

/** Where the face meets the body: the crown at full height behind the eye (about 9.6 m). */
const DJOIN = 9.6;
/** The end car and an intermediate car over their couplers (the China standard's car spacing); eight cars about 209 m. */
const END_LENGTH = 27.35;
const MID_LENGTH = 25.7;
/** The body's bottom, the skirt's top, belly, shoulder and crown; the half width (3.24 m in the gauge). */
const [B, A, Y, S, C, W] = [0.5, 0.85, 1.45, 3.0, 4.05, 1.62];

/** The livery: the blue line, a white gap, the navy window band over the windows (5244, 5253). */
const LINE: readonly [number, number] = [1.74, 1.87];
const BAND: readonly [number, number] = [2.0, 2.95];

/**
 * The centre line's profile [y, d]: one smooth convex curve (5253 and 5244 near side-on) - the snout's
 * front nearly upright from 0.85 to 1.5 m with the tip at 1.2 m, rounding back 0.4 m to the skirt
 * below and over its top (1.95 m, 0.4 m back) into the face, leaning back at about 50 degrees past the
 * lamps to the windscreen's foot (2.68 m, 1.0 m back), then the windscreen ever more raked to its head
 * (3.75 m, 3.0 m back) and the roof reaching its full height about 5.5 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.42], [0.6, 0.24], [0.7, 0.13], [0.85, 0.05], [1.0, 0.012], [1.2, 0], [1.4, 0.02], [1.6, 0.08], [1.75, 0.16], [1.9, 0.28], [2.05, 0.4],
  [2.2, 0.55], [2.5, 0.85], [2.8, 1.2], [3.0, 1.45], [3.2, 1.75], [3.4, 2.1], [3.6, 2.55], [3.75, 3.0], [3.88, 3.6], [3.97, 4.3], [4.02, 5.1], [C, DJOIN],
];
const ROWS = PROFILE.map(([y]) => y);
/** The face a little inside the body's half width low down, round in plan at every height. */
const INSET: Pt[] = [[B, 0.12], [1.5, 0.06], [1.7, 0]];
const CORNER: Pt[] = [[B, 1.62], [C, 1.62]];
/** How far back the round plan reaches the body's full width, by height: the snout round, the lamps on broad corners. */
const DEPTH: Pt[] = [[B, 1.9], [1.0, 2.0], [1.5, 2.1], [1.9, 2.2], [2.3, 2.3], [2.7, 2.3], [3.0, 2.2], [3.5, 2.0], [3.8, 1.5], [3.97, 0.8], [C, 0.05]];
/**
 * The coupler hatch's seam head-on (5238): the snout's front, a box 1.7 m wide from 0.68 to 1.95 m
 * with broadly rounded top corners, flush in the face - right half, bottom centre round to top centre.
 */
const HATCH: Pt[] = [[0, 0.68], [0.6, 0.68], [0.77, 0.72], [0.85, 0.82], [0.85, 1.5], [0.82, 1.7], [0.7, 1.86], [0.48, 1.93], [0, 1.95]];

/** Linear interpolation in a [x, y] table (held past its ends). */
function at(t: readonly Pt[], x: number): number {
  if (x <= t[0]![0]) return t[0]![1];
  for (let i = 1; i < t.length; i++) {
    const [xa, ya] = t[i - 1]!, [xb, yb] = t[i]!;
    if (x <= xb) return xb - xa < 1e-9 ? yb : ya + ((x - xa) / (xb - xa)) * (yb - ya);
  }
  return t[t.length - 1]![1];
}
/** The body's half width by height (its section at the join, approximately). */
const HALF: Pt[] = [[B, W * 0.9], [A, W * 0.97], [Y, W], [S, W * 0.96], [3.5, 1.35], [3.85, 0.95], [C, 0.2]];
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;

/**
 * The d behind the tip where a line on the round nose runs: head-on half width `w` at height y on the
 * face (the ellipse of the plan), or its d on the side past the corner. Rounded to 4 decimals.
 */
function edgeD(y: number, w: number | null, side?: number): number {
  if (w === null) return side!;
  const hw = (at(HALF, y) - at(INSET, y)) * 0.98, rd = at(DEPTH, y), k = Math.min(0.999, w / hw);
  return r4(at(PROFILE, y) + rd * (1 - Math.sqrt(1 - k * k)));
}

/**
 * The windscreen (5238, 5253): on the face a wide box from its nearly level foot at 2.68 m (just over the lamps' outer ends), 2.3 m wide, to the
 * crown, wrapping round the corners onto the cab sides, where its lower edge rises steadily back to
 * the rounded rear end 5.35 m behind the tip, just over the eye's point and its upper edge runs along the roof's shoulder at about 3.72 m.
 * [y, half width on the face | null, d on the side]; its black frame 4 cm round it.
 */
const SCREEN: ReadonlyArray<readonly [number, number | null, number?]> = [
  [2.68, 1.15], [2.73, 1.28], [2.8, 1.36], [2.9, null, 3.0], [3.0, null, 4.0], [3.15, null, 4.7], [3.3, null, 5.1], [3.5, null, 5.35], [3.65, null, 5.35], [3.72, null, 5.15],
];
const screenEdge = (grow: number): Pt[] => SCREEN.map(([y, w, side]): Pt => [r4(y - (w === null ? 0 : grow)), w === null ? r4(side! + grow * 2) : edgeD(y, w + grow)]);

/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
const flip = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
/**
 * The lamp housing at each corner over the snout (5238 head-on, viewer's right): a slanting almond,
 * its pointed inner end low beside the hatch's top corner, its blunt outer end high on the corner.
 */
const LAMP: Pt[] = [[0.44, 2.05], [0.55, 2.0], [0.75, 2.04], [1.0, 2.16], [1.2, 2.31], [1.28, 2.42], [1.25, 2.52], [1.12, 2.52], [0.86, 2.4], [0.6, 2.24], [0.46, 2.13]];
/** The red tail light at the lamp's inner end and the white headlight in its outer half. */
const TAIL: Pt[] = [[0.53, 2.06], [0.62, 2.06], [0.7, 2.11], [0.7, 2.19], [0.6, 2.15]];
const HEAD: Pt[] = [[0.9, 2.22], [1.06, 2.3], [1.18, 2.4], [1.18, 2.47], [1.06, 2.43], [0.88, 2.32]];
/** The dark slot of the roof light on the crown over the windscreen (5244, 5238). */
const ROOF_SLOT: Pt[] = [[-0.36, 3.92], [0.36, 3.92], [0.3, 3.97], [-0.3, 3.97]];

/** Thin bars along a closed outline ([lat, y] points), each a decal: a seam. */
function outline(mat: string, pts: readonly Pt[], t: number, closed = true): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let i = 0; i + (closed ? 0 : 1) < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy) || 1, [nx, ny] = [(-dy / l) * t, (dx / l) * t];
    out.push({ mat, pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]], fine: 2 });
  }
  return out;
}
/** The coupler hatch's seam, flush on the face: the snout's outline, each side with a midpoint so its bars follow the curve. */
function hatchSeam(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const ring = mirror(HATCH);
  const fine = ring.flatMap((p, i): Pt[] => { const q = ring[(i + 1) % ring.length]!; return [p, [r4((p[0] + q[0]) / 2), r4((p[1] + q[1]) / 2)]]; });
  return outline("seam", fine, 0.011);
}
/** The three grille slots between the lamps (5238) and the inspection hatch's seam over them, under the windscreen. */
function grille(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const slots = [2.28, 2.34, 2.4].map((y) => ({ mat: "seam", pts: [[-0.26, y], [0.26, y], [0.26, y + 0.03], [-0.26, y + 0.03]] as Pt[], fine: 2 }));
  return [...slots, ...outline("seam", [[-0.42, 2.49], [0.42, 2.49], [0.42, 2.61], [-0.42, 2.61]], 0.008)];
}

const FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 3.4, reach: 0, first: 10.6, roofFrom: 9, wrap: true, cols: [2, 4, 1, 4], tolerance: 0.04,
  profile: PROFILE, corner: CORNER, cornerDepth: DEPTH, planInset: INSET, rows: ROWS,
  // the face white, wrapped round onto the cab sides; the windscreen and its frame are paint, the
  // line and its flag, the eye and the band ahead of the join the livery's sweeps
  bands: () => [[0, 9, "body"]],
  lodBands: [[0, 2.68, "body"], [2.68, 3.72, "screen"], [3.72, 9, "body"]],
  // the distant model's end: the same smooth profile and plan on fewer rows
  lod: { profile: [[B, 0.42], [0.85, 0.05], [1.2, 0], [1.6, 0.08], [2.05, 0.4], [2.5, 0.85], [3.0, 1.45], [3.4, 2.1], [3.75, 3.0], [3.97, 4.3], [C, DJOIN]], corner: [[B, 1.5], [C, 1.62]], rows: [B, 0.85, 1.2, 1.6, 2.05, 2.5, 3.0, 3.4, 3.75, 3.97, C], cornerDepth: [[B, 1.9], [1.5, 2.1], [2.3, 2.3], [3.0, 2.2], [3.8, 1.5], [C, 0.05]] },
  paint: [
    // the gold eye (above the shoulder, so the face's paint, not a sweep): the lower curve from the
    // front point dipping to 2.38 m, both curves meeting at the tail high on the roof's shoulder
    { mat: "gold", front: [[2.38, 6.9], [2.4, 6.3], [2.5, 5.7], [2.7, 5.9], [3.0, 6.35], [3.3, 7.1], [3.5, 8.0], [3.6, 8.95]], back: [[2.38, 6.95], [2.5, 7.55], [2.8, 8.05], [3.1, 8.4], [3.4, 8.75], [3.6, 8.97]] },
    // the cab window in the eye, a rounded box leaning back with the eye's front edge
    { mat: "cabGlass", front: [[2.5, 6.55], [2.55, 6.45], [3.1, 6.7], [3.18, 6.85]], back: [[2.5, 7.2], [2.55, 7.32], [3.1, 7.5], [3.18, 7.4]] },
    // the two square service hatches on each side of the nose behind the snout (5238, 5244): a seam outline
    ...[[3.55, 4.3], [4.5, 5.25]].flatMap(([a, e]) => [
      { mat: "seam", front: [[1.28, a!], [1.8, a!]] as Pt[], back: [[1.28, e!], [1.8, e!]] as Pt[] },
      { mat: "body", front: [[1.295, a! + 0.015], [1.785, a! + 0.015]] as Pt[], back: [[1.295, e! - 0.015], [1.785, e! - 0.015]] as Pt[] },
    ]),
    { mat: "frame", front: screenEdge(0.04).map(([y]): Pt => [y, -9]), back: screenEdge(0.04), top: 3.76 },
    { mat: "screen", front: screenEdge(0).map(([y]): Pt => [y, -9]), back: screenEdge(0), top: 3.72 },
  ],
  fields: [
    { mat: "lampCase", pts: LAMP }, { mat: "lampCase", pts: flip(LAMP) },
    { mat: "lampRed", pts: TAIL }, { mat: "lampRed", pts: flip(TAIL) },
    { mat: "lampHead", pts: HEAD }, { mat: "lampHead", pts: flip(HEAD) },
    { mat: "screen", pts: ROOF_SLOT },
  ],
  decals: [
    ...hatchSeam(),
    ...grille(),
  ],
  panes: [], lodGlass: { hw: 1.25, y: [2.68, 3.72] },
  wipers: [[[0.32, 2.72], [-0.12, 3.3]]],
};

/**
 * The side's paint ahead of the body (5244, 5253, 5238): the blue line from its pointed front end on
 * the nose's corner, its flag leaning back up from it; the gold eye round the cab window, its point low
 * at the front and its tail high at the back; the navy band's front end leaning forward at its foot,
 * its top corner rounded. Later sweeps over earlier ones.
 */
const sweeps = (): NonNullable<ShinkansenLivery["endSweeps"]> => [
  // the line, its front point at the foot, back to the join
  { mat: "stripe", front: [[LINE[0], 4.45], [LINE[1], 4.62]], back: [[LINE[0], DJOIN], [LINE[1], DJOIN]], face: true },
  // its flag: a sliver leaning back up from the line's top to a point 0.45 m over it
  { mat: "stripe", front: [[LINE[1] - 0.01, 4.61], [2.32, 5.22]], back: [[LINE[1] - 0.01, 4.98], [2.32, 5.24]], face: true },
  // the navy band's front end ahead of the join
  { mat: "band", front: [[BAND[0], 8.55], [2.6, 8.75], [2.8, 8.88], [2.9, 9.0], [BAND[1], 9.2]], back: [[BAND[0], DJOIN], [BAND[1], DJOIN]] },
];

const bands = (): Band[] => [[0, 0.62, "skirtG"], [0.62, LINE[0], "body"], [LINE[0], LINE[1], "stripe"], [LINE[1], BAND[0], "body"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "body"]];

/** The windscreen's glass: dark grey with a blue sheen (5238). */
const SCREEN_GLASS: MaterialSpec = { color: "#2a3442", metallic: 0.35, roughness: 0.08, glass: true };
/** White, the royal blue line, the navy band, the gold eye (sampled from 5253 and 5244). */
const PALETTE = {
  body: c("#eef0ef"), stripe: c("#1f48a8", 0.35), band: c("#222c44", 0.3), gold: c("#b28d58", 0.35), screen: SCREEN_GLASS, frame: c("#141619", 0.3),
  seam: c("#5a5f66", 0.5), lampCase: c("#1a1d22", 0.15), roofG: c("#e2e4e4", 0.55), skirtG: c("#8a8f94", 0.6),
};

const livery = (title: string, number: string): ShinkansenLivery => ({
  title, number, palette: PALETTE, bands: bands(), roof: "roofG", skirt: "skirtG", endSweeps: sweeps(),
  // the band and the line run on over the door leaves (5253 at Chengjiayao)
  doors: bands(),
  // the CRH emblem in white on the band's front end, ahead of the door
  endLettering: [{ text: "CRH", d: 9.2 - DJOIN, y: 2.27, h: 0.42, mat: "white" }],
});

/**
 * The end car's layout behind the join (d on the body, the tip's d less DJOIN): the door behind the
 * band's blank front end, eight windows at a 1.956 m pitch back to near the rear end; an intermediate
 * car's door at its front end and eleven windows behind it.
 */
const END_WINDOWS: Array<[number, number]> = Array.from({ length: 8 }, (_, i): [number, number] => { const a = 11.95 + 1.956 * i - DJOIN; return [r4(a), r4(a + 1.24)]; });
const MID_WINDOWS: Array<[number, number]> = Array.from({ length: 11 }, (_, i): [number, number] => { const a = 2.6 + 1.956 * i; return [r4(a), r4(a + 1.25)]; });

export const CRH3A: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.96, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [[2.12, 2.8]], windowW: 1.24, pitch: 1.956,
  // plug doors with a tall rounded window high in the leaf
  door: [1.28, 3.2, 2.2, 3.05], doorW: 0.95, doorGlassW: 0.42, doorGlassR: 0.21,
  layout: {
    end: { doors: [[10.65 - DJOIN, 11.6 - DJOIN, -1]], windows: END_WINDOWS },
    middle: { doors: [[0.95, 1.9, 1]], windows: MID_WINDOWS },
  },
  // 17.5 m bogie centres (the China standard's), 920 mm wheels; the leading bogie under the cab window
  endBogies: [7.05 - DJOIN, 24.55 - DJOIN], midBogies: [3.85, 21.35], bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.5,
  liveries: {
    white: livery("Hexie white", "CRH3A-5253"),
  },
  // 4M4T, 5,120 kW at the wheels, 250 km/h; the skirts reach down to 0.5 m
  weight: { end: 52, middle: 50 }, power: 640, maxspeed: 250,
};
