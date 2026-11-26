// The Fuxing CR300BF (CRRC Changchun, the 250 km/h Fuxing, in service since December 2020) on the
// series kit (shinkansen.ts): its own cab face (seriesCab.ts) on the CR400BF's body - one smooth head
// from the skirt to the canopy, its tip low on a broad, upright snout that carries the coupler hatch
// (only a dark seam outline flush in the surface, its leaves' joint down the middle); the charcoal
// canopy covering the whole face down to the snout, its lower edge a broad U dipping over the snout's
// top and outlined in gold, the tall lamp strips at its lower corners, the gold China Railway emblem
// between them; the sky-blue body with the CR400BF's gold lines and wing. Narrowed from its real
// 3.36 m to the Shinkansen gauge's 3.3 m. See docs/models/china-units.md, "The CR300BF's body".
//
// Measured from assets/cr-cr300bf/ (SOURCES.md): 5038 from above at three quarters (the face: the U of
// the canopy, the snout's hatch seam, the lamps, the emblem, the windscreen and its roof light), 3119
// near side-on (the snout's upright front and the canopy's rake, the bands, the cab window; the window
// band about 210 px/m up at the nose), 3009 and 3008 at three quarters (the wing, the first window
// behind it and the door, the colours), 5038 at Zhengzhou (the snout's side seam). Heights over the
// rail, d behind the tip.

import type { MaterialSpec } from "./meshBuilder.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { NO_NOSE } from "./seriesHelpers.ts";

type Band = readonly [number, number, string];
const c = (hex: string, r = 0.4): MaterialSpec => paint(hex, r);

/** Where the face meets the body: the crown at full height just behind the canopy's end (9.0 m). */
const DJOIN = 9.4;
/** The end car and an intermediate car over their couplers (the CR400BF's shell); eight cars 208.9 m (about 209 m published). */
const END_LENGTH = 27.35;
const MID_LENGTH = 25.7;
/** The body's bottom, the skirt's top, belly, shoulder and crown; the half width (3.24 m in the gauge). */
const [B, A, Y, S, C, W] = [0.5, 0.85, 1.45, 3.0, 4.05, 1.62];

/** The livery's lines (3119's intermediate cars): the lower gold line, the upper one under the dark window band. */
const LINE2: readonly [number, number] = [1.66, 1.74];
const LINE1: readonly [number, number] = [1.875, 1.95];
const BAND: readonly [number, number] = [2.02, 2.92];

/**
 * The centre line's profile [y, d]: one smooth convex curve (3119 side on, 5038 at Zhengzhou) - the
 * snout's front nearly upright from 0.75 to 1.35 m with the tip at 1.05 m, rounding back 0.3 m to the
 * skirt below; above it the canopy leaning back ever more, past the snout's top (0.16 m back at 1.5 m),
 * the lamps (0.75 m at 1.95 m), the windscreen's foot (1.24 m at 2.25 m), flattening to the crown 9.4 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.3], [0.6, 0.15], [0.75, 0.05], [0.9, 0.01], [1.05, 0], [1.2, 0.015], [1.35, 0.06], [1.5, 0.16], [1.65, 0.32], [1.8, 0.52], [1.95, 0.75],
  [2.1, 0.99], [2.25, 1.24], [2.4, 1.5], [2.6, 1.86], [2.9, 2.45], [3.2, 3.2], [3.4, 3.8], [3.6, 4.6], [3.75, 5.4], [3.9, 6.45], [3.97, 7.3], [4.02, 8.3], [C, DJOIN],
];
const ROWS = PROFILE.map(([y]) => y);
/** The face a little inside the body's half width low down, round in plan at every height. */
const INSET: Pt[] = [[B, 0.12], [1.5, 0.06], [1.7, 0]];
const CORNER: Pt[] = [[B, 1.62], [C, 1.62]];
/** How far back the round plan reaches the body's full width, by height: the snout narrower and rounder than the CR400BF's hatch. */
const DEPTH: Pt[] = [[B, 1.9], [1.0, 2.1], [1.5, 2.4], [1.8, 2.6], [2.2, 2.7], [2.6, 2.5], [3.0, 2.3], [3.5, 2.05], [3.8, 1.5], [3.97, 0.8], [C, 0.05]];
/**
 * The coupler hatch's seam head-on (5038): the snout's front, a rounded box 1.56 m wide from 0.56 to
 * 1.7 m, flush in the face - right half, bottom centre round to top centre.
 */
const HATCH: Pt[] = [[0, 0.56], [0.5, 0.56], [0.68, 0.6], [0.76, 0.68], [0.78, 0.82], [0.78, 1.48], [0.76, 1.6], [0.68, 1.67], [0.5, 1.69], [0, 1.7]];

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

/**
 * The d behind the tip where a line on the round nose runs: head-on half width `w` at height y on the
 * face (the ellipse of the plan), or its d on the side past the corner. Rounded to 4 decimals.
 */
function edgeD(y: number, w: number | null, side?: number): number {
  if (w === null) return side!;
  const hw = (at(HALF, y) - at(INSET, y)) * 0.98, rd = at(DEPTH, y), k = Math.min(0.999, w / hw);
  return Math.round((at(PROFILE, y) + rd * (1 - Math.sqrt(1 - k * k))) * 1e4) / 1e4;
}

/**
 * The canopy's lower edge (5038 from above, 3008, 3119): a broad U over the snout's top - its bottom
 * 1.45 m up on the centre line, its corners at the hatch's (0.72 m out at 1.7 m) - then up the cheeks
 * beside the lamps, widening to the windscreen's lower corners (1.28 m at 2.5 m), and on the side rising
 * back over the cab window to the crown 9.0 m behind the tip. [y, half width on the face | null, d on the side].
 */
const CANOPY: ReadonlyArray<readonly [number, number | null, number?]> = [
  [1.46, 0.04], [1.47, 0.3], [1.49, 0.45], [1.53, 0.55], [1.6, 0.64], [1.68, 0.71], [1.75, 0.75], [1.8, 0.77], [1.9, 0.83], [2.0, 0.89], [2.1, 0.96],
  [2.2, 1.04], [2.3, 1.1], [2.4, 1.16], [2.5, 1.22], [2.6, 1.28],
  [2.75, null, 3.6], [2.9, null, 4.05], [3.05, null, 4.6], [3.2, null, 5.3], [3.35, null, 6.05], [3.5, null, 6.85], [3.7, null, 7.8], [3.9, null, 8.6], [C, null, 9.0],
];
const canopyEdge = (): Pt[] => CANOPY.map(([y, w, side]): Pt => [y, edgeD(y, w, side)]);
/** Its outline in gold, a thin border: 0.07 m wider head-on, 0.08 m lower on the sides, 0.05 m below the U's bottom. */
const borderEdge = (): Pt[] => {
  const out: Pt[] = [[1.4, edgeD(1.4, 0.02)]];
  for (const [y, w, side] of CANOPY) {
    const yy = Math.round((w === null ? y - 0.08 : y) * 1e4) / 1e4;
    if (yy > out[out.length - 1]![0] + 1e-6) out.push([yy, w === null ? side! : edgeD(y, w + 0.07)]);
  }
  return out;
};

/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The windscreen head-on (5038): a wide rounded box, its foot nearly level, its top arched under the roof light. */
const GLASS: Pt[] = mirror([[0, 2.26], [0.6, 2.27], [0.95, 2.31], [1.12, 2.42], [1.2, 2.6], [1.22, 2.9], [1.16, 3.18], [0.98, 3.4], [0.62, 3.53], [0, 3.57]]);
/** The tall headlight strip at each lower corner of the canopy, beside the emblem, its top leaning out (viewer's right). */
const LAMP: Pt[] = [[0.54, 1.84], [0.58, 1.8], [0.74, 1.8], [0.79, 1.85], [0.9, 2.2], [0.87, 2.25], [0.72, 2.25], [0.66, 2.2]];
/** The roof light over the windscreen (5038): a white bar, a little wider at its top. */
const ROOF_LIGHT: Pt[] = [[-0.38, 3.66], [0.38, 3.66], [0.44, 3.74], [-0.44, 3.74]];
const flip = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** Thin bars along a closed outline ([lat, y] points), each a decal: a seam or an emblem's ring. */
function outline(mat: string, pts: readonly Pt[], t: number, closed = true): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const out: Array<{ mat: string; pts: Pt[]; fine: number }> = [];
  for (let i = 0; i + (closed ? 0 : 1) < pts.length; i++) {
    const [a, b] = [pts[i]!, pts[(i + 1) % pts.length]!];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]], l = Math.hypot(dx, dy) || 1, [nx, ny] = [(-dy / l) * t, (dx / l) * t];
    out.push({ mat, pts: [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]], fine: 2 });
  }
  return out;
}
/** The coupler hatch's seams, flush on the face: the snout's outline and the leaves' joint down its middle. */
function hatchSeams(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [y0, y1] = [HATCH[0]![1], HATCH[HATCH.length - 1]![1]];
  // the joint in short pieces, each following the snout's curve over the tip
  const joint = Array.from({ length: 11 }, (_, i): Pt => [0, Math.round((y0 + ((y1 - y0) * i) / 10) * 1e4) / 1e4]);
  // the outline with a midpoint on each side, so its bars follow the snout's corners
  const ring = mirror(HATCH), r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  const fine = ring.flatMap((p, i): Pt[] => { const q = ring[(i + 1) % ring.length]!; return [p, [r4((p[0] + q[0]) / 2), r4((p[1] + q[1]) / 2)]]; });
  return [...outline("rubber", fine, 0.012), ...outline("rubber", joint, 0.009, false)];
}
/** The China Railway emblem on the canopy between the lamps: a ring, the rail's head across it and its web down the middle. */
function emblem(mat: string): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [cy, rx, ry] = [1.98, 0.15, 0.12];
  const ring = Array.from({ length: 16 }, (_, i): Pt => [rx * Math.cos((2 * Math.PI * i) / 16), cy + ry * Math.sin((2 * Math.PI * i) / 16)]);
  return [
    ...outline(mat, ring, 0.016),
    { mat, pts: [[-0.09, cy + 0.02], [0.09, cy + 0.02], [0.09, cy + 0.05], [-0.09, cy + 0.05]], fine: 2 },
    { mat, pts: [[-0.017, cy - 0.095], [0.017, cy - 0.095], [0.017, cy + 0.02], [-0.017, cy + 0.02]], fine: 2 },
    { mat, pts: [[-0.075, cy - 0.06], [0.075, cy - 0.06], [0.075, cy - 0.035], [-0.075, cy - 0.035]], fine: 2 },
  ];
}

const FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 3.2, reach: 0, first: 11.2, roofFrom: 9, wrap: true, cols: [2, 4, 1, 4], tolerance: 0.04,
  profile: PROFILE, corner: CORNER, cornerDepth: DEPTH, planInset: INSET, rows: ROWS,
  // the face sky blue, wrapped round onto the cab sides; the canopy and its outline are paint, the
  // lines, the wing and the band ahead of the join the livery's sweeps
  bands: () => [[0, 9, "body"]],
  lodBands: [[0, 1.6, "body"], [1.6, 9, "cabMask"]],
  // the distant model's end: the same smooth profile and plan on fewer rows
  lod: { profile: [[B, 0.3], [1.05, 0], [1.5, 0.16], [1.95, 0.75], [2.4, 1.5], [2.9, 2.45], [3.4, 3.8], [3.9, 6.45], [C, DJOIN]], corner: [[B, 1.4], [C, 1.62]], rows: [B, 1.05, 1.5, 1.95, 2.4, 2.9, 3.4, 3.9, C], cornerDepth: [[B, 1.9], [1.0, 2.1], [1.8, 2.6], [3.0, 2.3], [3.9, 1.0], [C, 0.05]] },
  paint: [
    // the grey underbody rising from the skirt toward the snout's foot (3119)
    { mat: "skirtG", front: [[B, 1.2], [0.7, 1.9], [0.85, 2.6], [1.0, 3.6]], back: [[B, DJOIN + 1], [1.0, DJOIN + 1]] },
    { mat: "line", front: borderEdge().map(([y]): Pt => [y, -9]), back: borderEdge() },
    { mat: "cabMask", front: canopyEdge().map(([y]): Pt => [y, -9]), back: canopyEdge() },
  ],
  fields: [
    { mat: "bfGlass", pts: GLASS },
    { mat: "lampHead", pts: LAMP }, { mat: "lampHead", pts: flip(LAMP) },
    { mat: "lampHead", pts: ROOF_LIGHT },
  ],
  decals: [
    ...emblem("line"),
    ...hatchSeams(),
  ],
  panes: [], lodGlass: { hw: 1.1, y: [2.27, 3.55] },
  wipers: [[[0.3, 2.3], [-0.1, 2.85]]],
};

/**
 * The side's paint ahead of the body (3009, 3119, 3008): the lower line runs on to a point under the
 * wing's tip; the wing - the upper line swept up from 2.7 m behind the tip to the band's top at 7.6 m -
 * holds the large teardrop cab window; behind the wing, in the band, the first window, its front edge
 * leaning with the wing's back edge, reaching back to the door. Later sweeps over earlier ones.
 */
const sweeps = (): NonNullable<ShinkansenLivery["endSweeps"]> => [
  // the lower line from its pointed front end on the nose's corner back to the join
  { mat: "line", front: [[LINE2[0], 3.1], [LINE2[0] + 0.04, 2.9], [LINE2[1], 3.0]], back: [[LINE2[0], DJOIN], [LINE2[1], DJOIN]], face: true },
  // the wing: its top edge the swept-up line, its back edge the band's front; the upper line on from it
  { mat: "line", front: [[LINE1[0], 2.62], [1.95, 2.85], [2.1, 3.4], [2.5, 4.45], [2.9, 5.55], [3.0, 5.85]], back: [[LINE1[0], 7.2], [2.4, 7.4], [3.0, 7.7]], face: true },
  { mat: "line", front: [[LINE1[0], 7.0], [LINE1[1], 7.0]], back: [[LINE1[0], DJOIN], [LINE1[1], DJOIN]] },
  // the dark window band from behind the wing back to the join
  { mat: "band", front: [[BAND[0], 7.2], [2.4, 7.4], [BAND[1], 7.7]], back: [[BAND[0], DJOIN], [BAND[1], DJOIN]] },
  // the large teardrop cab window in the wing, its point low at the front (3119: its rear 0.8 m tall)
  { mat: "cabGlass", front: [[2.2, 4.95], [2.26, 4.9], [2.4, 5.15], [2.6, 5.6], [2.75, 6.0], [2.84, 6.3]], back: [[2.2, 6.6], [2.3, 6.85], [2.45, 6.95], [2.7, 6.95], [2.8, 6.85], [2.84, 6.65]], face: true },
  // the first passenger window, on the face's side ahead of the join, leaning with the wing's back edge
  { mat: "cabGlass", front: [[2.1, 7.62], [2.14, 7.58], [2.5, 7.72], [2.78, 7.84], [2.82, 7.9]], back: [[2.1, DJOIN], [2.82, DJOIN]] },
];

const bands = (line: string): Band[] => [[0, 1.0, "skirtG"], [1.0, LINE2[0], "body"], [LINE2[0], LINE2[1], line], [LINE2[1], LINE1[0], "body"], [LINE1[0], LINE1[1], line], [LINE1[1], BAND[0], "body"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "body"]];

/** The glass of the windscreen: a grey reflection under the charcoal canopy (5038). */
const BF_GLASS: MaterialSpec = { color: "#56626e", metallic: 0.35, roughness: 0.08, glass: true };
/** The sky blue, the gold, the charcoal canopy and window band, the grey skirt (sampled from 3008, 3009 and 5038). */
const PALETTE = { body: c("#9cb8e2"), line: c("#c18a45", 0.35), band: c("#363a40", 0.35), cabMask: c("#202326", 0.25), bfGlass: BF_GLASS, roofG: c("#a3bee6", 0.5), skirtG: c("#7b838b", 0.6) };

const livery = (title: string, number: string): ShinkansenLivery => ({
  title, number, palette: PALETTE, bands: bands("line"), roof: "roofG", skirt: "skirtG", endSweeps: sweeps(),
});

/**
 * The end car's layout behind the join (d on the body, the tip's d less DJOIN): the first window's rear
 * end (the sweep draws its front ahead of the join), the door, eight windows at a 1.956 m pitch back to
 * near the rear end (3009, 3119); an intermediate car's door at its front end and eleven windows behind it.
 */
const r4 = (v: number) => Math.round(v * 1e4) / 1e4;
const END_WINDOWS: Array<[number, number]> = [[0.02, 0.62], ...Array.from({ length: 8 }, (_, i): [number, number] => { const a = 11.65 + 1.956 * i - DJOIN; return [r4(a), r4(a + 1.24)]; })];
const MID_WINDOWS: Array<[number, number]> = Array.from({ length: 11 }, (_, i): [number, number] => { const a = 2.6 + 1.956 * i; return [r4(a), r4(a + 1.25)]; });

export const CR300BF: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.96, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [[2.12, 2.78]], windowW: 1.24, pitch: 1.956,
  // plug doors with a tall rounded window high in the leaf (3009)
  door: [1.28, 3.2, 2.2, 3.05], doorW: 0.95, doorGlassW: 0.42, doorGlassR: 0.21,
  layout: {
    end: { doors: [[10.25 - DJOIN, 11.2 - DJOIN, -1]], windows: END_WINDOWS },
    middle: { doors: [[0.95, 1.9, 1]], windows: MID_WINDOWS },
  },
  // 17.5 m bogie centres, 920 mm wheels; the leading bogie under the cab window, the others 3.85 m in from the ends
  endBogies: [7.05 - DJOIN, 24.55 - DJOIN], midBogies: [3.85, 21.35], bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.5,
  liveries: {
    blue: livery("Fuxing blue", "CR300BF-3008"),
  },
  // 4M4T, 250 km/h; the skirts reach down to 0.5 m: no underfloor box below them
  weight: { end: 48, middle: 46 }, power: 680, maxspeed: 250,
};
