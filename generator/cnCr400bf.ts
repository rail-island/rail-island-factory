// The Fuxing CR400BF (CRRC Changchun, "Golden Phoenix") on the series kit (shinkansen.ts): its own
// cab face (seriesCab.ts) - one smooth, round "phoenix" head from the skirt to the canopy, its tip
// low at the coupler hatch (only a dark seam outline flush in the surface), the black canopy round the windscreen outlined in the livery's colour
// and narrowing to a point on the chin, the lamps at the windscreen's lower corners, the teardrop cab
// side window in the livery's "wing" - and its measured window and door layout. Narrowed from its
// real 3.36 m to the Shinkansen gauge's 3.3 m. See docs/models/china-units.md, "The CR400BF's body".
//
// Measured from assets/cr-cr400bf/ (SOURCES.md): the end car near side-on from above on the Yutingqiao
// bridge (a projective fit along the car through its tip, its coupling plane and the rear windows'
// pitch), the 5001 head-on telephoto (the canopy's outline, the lamps, the hatch), the A-3033 three
// quarters (the wing, the lines, the hatch's seam), the intermediate car of 5033 (bands, door window),
// the B-5155 true side view (the nose's profile, 22.4 px/m along the car), the 5017 near side-on (the
// nose's rise) and the G-5167 from above (the blunt round plan at the hatch). Heights over the rail, d
// behind the tip.

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
/** The end car over its couplers (27.09 m body) and an intermediate car (25.65 m); eight cars 209 m. */
const END_LENGTH = 27.35;
const MID_LENGTH = 25.7;
/** The body's bottom, the skirt's top, belly, shoulder and crown; the half width (3.24 m in the gauge). */
const [B, A, Y, S, C, W] = [0.5, 0.85, 1.45, 3.0, 4.05, 1.62];

/** The livery's lines (5033's intermediate car, the door 1.28 - 3.2 m): the lower line, the upper one, the dark window band. */
const LINE2: readonly [number, number] = [1.675, 1.75];
const LINE1: readonly [number, number] = [1.875, 1.95];
const BAND: readonly [number, number] = [2.02, 2.92];

/**
 * The centre line's profile [y, d]: one smooth convex curve (B-5155 side on, 5017, G-5167) - its tip
 * 1.0 m up at the coupler hatch, rounding back 0.3 m to the skirt below, and above it leaning back ever
 * more: over the hatch's top (0.18 m back at 1.45 m), past the canopy's chin (0.49 m at 1.75 m), 35
 * degrees at the lamps and flattening toward the crown 9.4 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.3], [0.7, 0.12], [0.85, 0.03], [1.0, 0], [1.15, 0.02], [1.3, 0.08], [1.45, 0.18], [1.6, 0.32], [1.75, 0.49], [1.9, 0.68], [2.05, 0.89],
  [2.2, 1.1], [2.35, 1.33], [2.6, 1.75], [2.9, 2.3], [3.2, 3.15], [3.4, 3.75], [3.6, 4.55], [3.75, 5.35], [3.9, 6.4], [3.97, 7.3], [4.02, 8.3], [C, DJOIN],
];
const ROWS = PROFILE.map(([y]) => y);
/** The face a little inside the body's half width low down, round in plan at every height (the 5167 view from above). */
const INSET: Pt[] = [[B, 0.12], [1.5, 0.06], [1.7, 0]];
const CORNER: Pt[] = [[B, 1.62], [C, 1.62]];
/** How far back the round plan reaches the body's full width, by height: blunt at the hatch (G-5167), longer above. */
const DEPTH: Pt[] = [[B, 1.5], [1.0, 1.6], [1.5, 2.1], [1.8, 2.5], [2.2, 2.7], [2.6, 2.5], [3.0, 2.3], [3.5, 2.05], [3.8, 1.5], [3.97, 0.8], [C, 0.05]];
/**
 * The coupler hatch's seam head-on (5001): a rounded box 1.8 m wide from 0.56 to 1.57 m, its top arched,
 * flush in the face - right half, bottom centre round to top centre.
 */
const HATCH: Pt[] = [[0, 0.56], [0.5, 0.56], [0.74, 0.6], [0.86, 0.72], [0.9, 0.95], [0.88, 1.22], [0.8, 1.4], [0.62, 1.51], [0.32, 1.56], [0, 1.57]];

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
 * The canopy's lower edge (5001 head-on, A-3033 and Yutingqiao from the side): a point on the chin at
 * 1.6 m, the shield widening to the lamps (1.0 m at 2.1 m, 1.45 m at 2.6 m), then on the side rising
 * back over the cab window to the crown 9.0 m behind the tip. [y, half width on the face | null, d on the side].
 */
const CANOPY: ReadonlyArray<readonly [number, number | null, number?]> = [
  [1.68, 0.06], [1.72, 0.22], [1.78, 0.36], [1.85, 0.48], [1.9, 0.58], [2.0, 0.76], [2.1, 0.92], [2.2, 1.06], [2.3, 1.18], [2.4, 1.28], [2.5, 1.37], [2.6, 1.44],
  [2.7, null, 4.3], [2.85, null, 5.2], [3.0, null, 6.1], [3.15, null, 6.9], [3.3, null, 7.55], [3.5, null, 8.15], [3.7, null, 8.6], [3.9, null, 8.85], [C, null, 9.0],
];
const canopyEdge = (): Pt[] => CANOPY.map(([y, w, side]): Pt => [y, edgeD(y, w, side)]);
/** Its outline in the livery's colour, a narrow border: 0.11 m wider head-on, 0.1 m lower on the sides, 0.06 m below the chin's point. */
const borderEdge = (): Pt[] => {
  const out: Pt[] = [[1.62, edgeD(1.62, 0.02)]];
  for (const [y, w, side] of CANOPY) {
    const yy = Math.round((w === null ? y - 0.1 : y) * 1e4) / 1e4;
    if (yy > out[out.length - 1]![0] + 1e-6) out.push([yy, w === null ? side! : edgeD(y, w + 0.11)]);
  }
  return out;
};

/** A polygon mirrored about the centre line, from its right half (bottom centre round to top centre). */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The windscreen head-on: its foot curving up to the lamps, its top under the canopy's crown. */
const GLASS: Pt[] = mirror([[0, 2.12], [0.5, 2.13], [0.85, 2.2], [1.05, 2.33], [1.2, 2.5], [1.28, 2.75], [1.25, 3.05], [1.1, 3.3], [0.8, 3.5], [0.4, 3.6], [0, 3.62]]);
/** The headlight strip at each lower corner of the windscreen, along the canopy's edge (viewer's right). */
const LAMP: Pt[] = [[0.74, 2.07], [0.92, 2.1], [1.05, 2.17], [1.14, 2.28], [1.12, 2.34], [0.98, 2.27], [0.84, 2.2], [0.72, 2.13]];
/** The red tail lamp above it, on the canopy's side. */
const TAIL: Pt[] = [[1.3, 2.56], [1.38, 2.62], [1.42, 2.82], [1.36, 2.84], [1.3, 2.68]];
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
/** The coupler hatch's seams, flush on the face: its outline and the leaves' joint down its middle. */
function hatchSeams(): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [y0, y1] = [HATCH[0]![1], HATCH[HATCH.length - 1]![1]];
  // the joint in short pieces, each following the nose's curve over the tip
  const joint = Array.from({ length: 11 }, (_, i): Pt => [0, Math.round((y0 + ((y1 - y0) * i) / 10) * 1e4) / 1e4]);
  // the outline with a midpoint on each side, so its bars follow the nose's corners
  const ring = mirror(HATCH), r4 = (v: number) => Math.round(v * 1e4) / 1e4;
  const fine = ring.flatMap((p, i): Pt[] => { const q = ring[(i + 1) % ring.length]!; return [p, [r4((p[0] + q[0]) / 2), r4((p[1] + q[1]) / 2)]]; });
  return [...outline("rubber", fine, 0.012), ...outline("rubber", joint, 0.009, false)];
}
/** The China Railway emblem on the chin: a ring, the rail's head across it and its web down the middle. */
function emblem(mat: string): Array<{ mat: string; pts: Pt[]; fine: number }> {
  const [cy, rx, ry] = [1.9, 0.13, 0.1];
  const ring = Array.from({ length: 16 }, (_, i): Pt => [rx * Math.cos((2 * Math.PI * i) / 16), cy + ry * Math.sin((2 * Math.PI * i) / 16)]);
  return [
    ...outline(mat, ring, 0.014),
    { mat, pts: [[-0.08, cy + 0.02], [0.08, cy + 0.02], [0.08, cy + 0.045], [-0.08, cy + 0.045]], fine: 2 },
    { mat, pts: [[-0.015, cy - 0.08], [0.015, cy - 0.08], [0.015, cy + 0.02], [-0.015, cy + 0.02]], fine: 2 },
    { mat, pts: [[-0.065, cy - 0.05], [0.065, cy - 0.05], [0.065, cy - 0.03], [-0.065, cy - 0.03]], fine: 2 },
  ];
}

const FACE: SeriesCabFace = {
  dJoin: DJOIN, dSide: 3.2, reach: 0, first: 12.9, roofFrom: 9, wrap: true, cols: [2, 4, 1, 4], tolerance: 0.04,
  profile: PROFILE, corner: CORNER, cornerDepth: DEPTH, planInset: INSET, rows: ROWS,
  // the face white, wrapped round onto the cab sides; the canopy and its outline are paint, the
  // lines, the wing and the band ahead of the join the livery's sweeps
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, 2.1, "white"], [2.1, 9, "cabMask"]],
  // the distant model's end: the same smooth profile and plan on fewer rows
  lod: { profile: [[B, 0.3], [1.0, 0], [1.45, 0.18], [1.9, 0.68], [2.35, 1.33], [2.9, 2.3], [3.4, 3.75], [3.9, 6.4], [C, DJOIN]], corner: [[B, 1.4], [C, 1.62]], rows: [B, 1.0, 1.45, 1.9, 2.35, 2.9, 3.4, 3.9, C], cornerDepth: [[B, 1.5], [1.0, 1.6], [1.8, 2.5], [3.0, 2.3], [3.9, 1.0], [C, 0.05]] },
  paint: [
    { mat: "line", front: borderEdge().map(([y]): Pt => [y, -9]), back: borderEdge() },
    { mat: "cabMask", front: canopyEdge().map(([y]): Pt => [y, -9]), back: canopyEdge() },
  ],
  fields: [
    { mat: "bfGlass", pts: GLASS },
    { mat: "lampHead", pts: LAMP }, { mat: "lampHead", pts: flip(LAMP) },
    { mat: "lampRed", pts: TAIL }, { mat: "lampRed", pts: flip(TAIL) },
  ],
  decals: [
    ...emblem("line"),
    ...hatchSeams(),
  ],
  panes: [], lodGlass: { hw: 1.1, y: [2.15, 3.6] },
  // the round main lamps at the strips' inner ends (5001 head-on)
  lamps: [[-0.86, 2.15, 0.055, "lampHead"], [0.86, 2.15, 0.055, "lampHead"]],
  wipers: [[[0.3, 2.17], [-0.12, 2.7]]],
  roofLamp: [0, 3.7, 0.06],
};

/**
 * The side's paint ahead of the body (A-3033, Yutingqiao, 5017): the dark band ends behind the wing;
 * the lower line runs on to a point under the wing's tip; the wing - the upper line swept up from 2.7 m
 * behind the tip to the band's top at 7.6 m - holds the teardrop cab window; the first passenger
 * window sits in the band ahead of the join. Later sweeps over earlier ones.
 */
const sweeps = (): NonNullable<ShinkansenLivery["endSweeps"]> => [
  // the lower line from its pointed front end on the nose's corner back to the join
  { mat: "line", front: [[LINE2[0], 3.05], [LINE2[0] + 0.035, 2.85], [LINE2[1], 2.95]], back: [[LINE2[0], DJOIN], [LINE2[1], DJOIN]], face: true },
  // the wing: its top edge the swept-up line, its back edge the band's front; the upper line on from it
  { mat: "line", front: [[LINE1[0], 2.62], [1.9, 2.72], [3.0, 7.6]], back: [[LINE1[0], 7.2], [2.4, 7.4], [3.0, 7.75]], face: true },
  { mat: "line", front: [[LINE1[0], 7.0], [LINE1[1], 7.0]], back: [[LINE1[0], DJOIN], [LINE1[1], DJOIN]] },
  // the dark window band from behind the wing back to the join
  { mat: "band", front: [[BAND[0], 7.2], [2.4, 7.4], [BAND[1], 7.72]], back: [[BAND[0], DJOIN], [BAND[1], DJOIN]] },
  // the teardrop cab window in the wing, its point low at the front
  { mat: "cabGlass", front: [[2.14, 4.75], [2.2, 4.85], [2.4, 5.3], [2.6, 5.75], [2.8, 6.2], [2.86, 6.42]], back: [[2.14, 6.55], [2.22, 6.78], [2.4, 6.9], [2.65, 6.9], [2.8, 6.8], [2.86, 6.6]], face: true },
  // the first passenger window, on the face's side ahead of the join
  { mat: "cabGlass", front: [[2.12, 7.86], [2.16, 7.82], [2.74, 7.82], [2.78, 7.86]], back: [[2.12, 8.94], [2.16, 8.98], [2.74, 8.98], [2.78, 8.94]] },
];

const bands = (line: string): Band[] => [[0, LINE2[0], "white"], [LINE2[0], LINE2[1], line], [LINE2[1], LINE1[0], "white"], [LINE1[0], LINE1[1], line], [LINE1[1], BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]];

/** The glass of the windscreen: a grey reflection under the black canopy (the photographs). */
const BF_GLASS: MaterialSpec = { color: "#3b4651", metallic: 0.35, roughness: 0.08, glass: true };
const PALETTE = { white: c("#f2f2ef"), band: c("#33373c", 0.35), cabMask: c("#17191c", 0.25), bfGlass: BF_GLASS, roofG: c("#e4e5e3", 0.55), skirtG: c("#d8d9d8", 0.6) };

const livery = (title: string, number: string, line: string): ShinkansenLivery => ({
  title, number, palette: { ...PALETTE, line: c(line, 0.35) }, bands: bands("line"), roof: "roofG", skirt: "skirtG", endSweeps: sweeps(),
});

/**
 * The end car's layout behind the join (d on the body, the tip's d less DJOIN): the second window of
 * the business section, the door behind it, four windows of the first class at a 1.95 m pitch and the
 * blank rear end; an intermediate car's eleven windows at 1.956 m and its one door at the rear end.
 */
const END_WINDOWS: Array<[number, number]> = [[9.51, 10.71], ...[16.2, 18.15, 20.1, 22.05].map((m): [number, number] => [m - 0.62, m + 0.62])].map(([a, b]): [number, number] => [Math.round((a - DJOIN) * 1e4) / 1e4, Math.round((b - DJOIN) * 1e4) / 1e4]);
const MID_WINDOWS: Array<[number, number]> = Array.from({ length: 11 }, (_, i): [number, number] => { const a = 1.84 + 1.956 * i; return [Math.round(a * 1e4) / 1e4, Math.round((a + 1.25) * 1e4) / 1e4]; });

export const CR400BF: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.96, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE,
  windows: [[2.12, 2.78]], windowW: 1.24, pitch: 1.956,
  // plug doors with a tall rounded window high in the leaf (5033)
  door: [1.28, 3.2, 2.2, 3.05], doorW: 0.95, doorGlassW: 0.42, doorGlassR: 0.21,
  layout: {
    end: { doors: [[11.93 - DJOIN, 12.88 - DJOIN, -1]], windows: END_WINDOWS },
    middle: { doors: [[23.8, 24.75, -1]], windows: MID_WINDOWS },
  },
  // 17.5 m bogie centres, 920 mm wheels; the leading bogie under the cab window, the others 3.85 m in from the ends
  endBogies: [7.05 - DJOIN, 24.55 - DJOIN], midBogies: [3.85, 21.35], bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.5,
  liveries: {
    gold: livery("Fuxing gold", "CR400BF-5001", "#c4923f"),
    red: livery("Fuxing red", "CR400BF-5033", "#c8102e"),
  },
  // the skirts reach down to 0.5 m: no underfloor box below them; the coupler hatch is the face's seams
  weight: { end: 52, middle: 50 }, power: 1250, maxspeed: 350,
};
