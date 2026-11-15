// The Class 390 Pendolino (Alstom, built 2001-2012 with Fiat's tilting technology) on the series kit
// (shinkansen.ts): the narrow tilting body, tucked in under the waist and drawn in strongly above the
// windows to the narrow roof; the rounded nose with its broad U-shaped plan, the black mask round the
// raked windscreen with its two grilles, the teardrop lamp clusters at its corners and the coupler cover
// under it; the cab door with its tall window behind the nose; small windows with rounded corners, a
// door at each end of every car; the Virgin (2002) and Avanti West Coast (2019) liveries after the
// photographs. Registered in ukUnits.ts. See docs/models/uk-trains.md and assets/br-class-390/SOURCES.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sideDecal, surfacePoint, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the cab face meets the body, behind the tip; the crown still rises behind it (`endCrown`). */
const DJOIN = 4.5;
/** The body's skirt top (the side's paint stops there, the grey valance under it) and shoulder. */
const A = 1.0;
const S = 3.12;
/** The belly: the side leans in from here to the shoulder (below it the kit's side panels would stand off the tuck). */
const Y = 1.25;
/** The passenger windows' sill and head (Rugeley photograph, 66.6 px/m: 1.96 - 2.58 m over the rail). */
const WINDOWS: readonly [number, number] = [1.92, 2.6];
/** Avanti's cantrail line (on every car) and its dark window band. */
const LINE: readonly [number, number] = [3.0, 3.04];
const BAND: readonly [number, number] = [1.86, 2.66];

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

// ---------------------------------------------------------------------------
// The cab face (head-on at Milton Keynes, 167 px/m at the lamps; side-on at Abington and Rugeley)

/** The black mask's foot (right half, from the centre): the smile's top over the coupler cover, rising over the lamps to the corners. */
const MASK_FOOT: Pt[] = [[0, 1.36], [0.3, 1.38], [0.48, 1.43], [0.6, 1.52], [0.7, 1.66], [0.8, 1.82], [0.9, 1.97], [1.0, 2.1]];
/** The mask's head over the windscreen (right half, from its side to the centre). */
const HEAD: Pt[] = [[0.92, 2.96], [0.78, 3.08], [0.45, 3.14], [0, 3.16]];

/** The yellow smile under the mask (Virgin): between its lower edge (right half, from the centre to lat 1.0) and the mask's foot. */
const smile = (lower: readonly Pt[]): Pt[] => [...mirror(lower), ...lower.slice(1), ...[...mirror(MASK_FOOT), ...MASK_FOOT.slice(1)].reverse()];
/** The mask's lower part over the smile, up to where the mask's paint round the windscreen takes over. */
const MASK: Pt[] = [...mirror(MASK_FOOT), ...MASK_FOOT.slice(1), [1.0, 2.16], [-1.0, 2.16]];
/** The thin line over the mask's head (Virgin's orange-red, Avanti's orange), as quads along the arc. */
const HEAD_ARC: Pt[] = [...HEAD, ...mirror(HEAD).slice(1)];
const TOP_LINE: Pt[][] = HEAD_ARC.slice(1).map((p, i): Pt[] => { const q = HEAD_ARC[i]!; return [q, p, [p[0], p[1] + 0.03], [q[0], q[1] + 0.03]]; });

/** A lamp cluster (viewer's right): a teardrop of dark glass, its point toward the centre and down. */
const LAMP: Pt[] = [[0.55, 1.45], [0.62, 1.39], [0.8, 1.37], [0.95, 1.42], [1.04, 1.55], [1.05, 1.68], [0.98, 1.8], [0.88, 1.84], [0.75, 1.78], [0.62, 1.62]];
/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The coupler cover's seams (its top is the mask's foot) and the coupler's slot; the lamp clusters, the grilles and the line over the mask. */
const DECALS: Array<{ mat: string; pts: Pt[]; fine?: number }> = [
  { mat: "rubber", pts: box(0.68, 0.7, 0.66, 1.36), fine: 1 }, { mat: "rubber", pts: box(-0.7, -0.68, 0.66, 1.36), fine: 1 },
  { mat: "rubber", pts: box(-0.6, 0.6, 0.6, 0.62), fine: 1 },
  { mat: "rubber", pts: [[0.6, 0.6], [0.7, 0.66], [0.68, 0.67], [0.6, 0.62]], fine: 1 }, { mat: "rubber", pts: [[-0.6, 0.62], [-0.68, 0.67], [-0.7, 0.66], [-0.6, 0.6]], fine: 1 },
  { mat: "black", pts: box(-0.04, 0.04, 0.68, 0.8), fine: 1 },
  { mat: "lampGlass", pts: LAMP, fine: 3 }, { mat: "lampGlass", pts: mirror(LAMP), fine: 3 },
  { mat: "grilleG", pts: box(0.3, 0.54, 1.72, 1.92), fine: 1 }, { mat: "grilleG", pts: box(-0.54, -0.3, 1.72, 1.92), fine: 1 },
  ...TOP_LINE.map((pts) => ({ mat: "topLine", pts, fine: 2 })),
];

/** The yellow strip's rear edge on the corners above the lamps, [y, d behind the tip], rising to the roof's edge beside the mask. */
const STRIP_BACK: Pt[] = [[2.13, 1.75], [2.4, 2.25], [2.7, 3.0], [3.0, 3.85], [3.1, 4.6]];

/**
 * The nose (head-on at Milton Keynes, side-on at Abington): the coupler cover's front 0.95 m over the
 * rail at the tip, the face rounding back over the lamps (1.37 - 1.84 m) to the windscreen's foot at
 * 2.13 m, 0.62 m behind the tip; the windscreen raked about 40 degrees to its head at 3.0 m, 1.7 m behind;
 * the dome over it reaching 3.48 m at the join 4.5 m behind the tip, the roof the body's 3.56 m 1.6 m
 * further back. In plan a broad U, as wide at the windscreen as at the lamps (2.3 m against the body's
 * 2.73 m): the face 0.55 - 0.6 m flat across, its corners swept back 1.4 - 1.9 m. The yellow is painted
 * round the corners up to its rear edge (`yellow`, [y, d] from its foot), the black mask over it from the
 * windscreen's foot, back along the cab's sides.
 */
function face390(o: { body: string; yellow: readonly Pt[]; smileLower?: readonly Pt[]; lodBands: SeriesCabFace["lodBands"]; extra: SeriesCabFace["decals"] }): SeriesCabFace {
  const y0 = o.yellow[0]![0];
  return {
    dJoin: DJOIN, dSide: 3.9, first: 10.3, roofFrom: 3.1, cols: [4, 3, 1, 1], tolerance: 0.05, wrap: true,
    profile: [[0.5, 0.42], [0.56, 0.2], [0.65, 0.06], [0.8, 0.01], [0.95, 0], [1.15, 0.02], [1.36, 0.08], [1.6, 0.2], [1.85, 0.38], [2.13, 0.62], [2.4, 0.9], [2.7, 1.25], [3.0, 1.7], [3.15, 2.15], [3.3, 2.85], [3.42, 3.7], [3.48, DJOIN]],
    corner: [[0.5, 0.8], [0.95, 0.75], [1.36, 0.75], [1.85, 0.75], [2.13, 0.75], [2.4, 0.75], [3.0, 0.75], [3.2, 0.7], [3.35, 0.55], [3.48, 0.35]],
    cornerDepth: [[0.5, 1.4], [0.95, 1.35], [1.36, 1.4], [1.85, 1.5], [2.13, 1.6], [2.4, 1.7], [3.0, 1.9], [3.2, 1.8], [3.35, 1.3], [3.48, 0.6]],
    paint: [
      // the body's colour down to the skirt ahead of the leading bogie (the cab sides' own skirt only behind it)
      { mat: o.body, front: [[0.52, 0.3], [A, 0.3]], back: [[0.52, 3.6], [A, 4.2]] },
      // the yellow over the front and round its corners, then the mask carried back beside the windscreen
      { mat: "smile", front: [[y0, -1], [3.1, -1]], back: [...o.yellow, ...STRIP_BACK] },
      { mat: "cabMask", front: [[2.13, -1], [3.1, -1]], back: [[2.13, 1.4], [2.4, 1.9], [2.7, 2.6], [3.0, 3.4], [3.1, 4.0]] },
    ],
    rows: [0.5, 0.65, 0.8, 0.95, 1.15, 1.36, 1.6, 1.85, 2.13, 2.4, 2.7, 3.0, 3.1, 3.2, 3.3, 3.42, 3.48],
    bands: (l) => l.front ?? l.bands,
    lodBands: o.lodBands,
    fields: [...(o.smileLower ? [{ mat: "smile", pts: smile(o.smileLower) }] : []), { mat: "cabMask", pts: MASK }],
    panes: [{ lat: [-0.77, 0.77], y: [2.13, 3.0], r: 0.22 }],
    decals: [...DECALS, ...(o.extra ?? [])],
    lamps: [[0.83, 1.6, 0.13, "lampHead"], [-0.83, 1.6, 0.13, "lampHead"], [0.65, 1.5, 0.045, "lampRed"], [-0.65, 1.5, 0.045, "lampRed"]],
    roofLamp: [0, 3.3, 0.07],
    // two wipers parked along the windscreen's foot
    wipers: [[[-0.58, 2.2], [0.08, 2.34]], [[0.12, 2.2], [0.72, 2.32]]],
  };
}

/** Virgin: the yellow smile under the mask (red below it to the bumper), round the lamps and up beside the mask; the red shield on the cover. */
const VIRGIN_FACE = face390({
  body: "vRed",
  yellow: [[1.3, 0.35], [1.6, 0.5], [1.85, 1.0]],
  smileLower: [[0, 0.8], [0.3, 0.82], [0.5, 0.87], [0.7, 0.97], [0.88, 1.12], [1.0, 1.3]],
  lodBands: [[0, 0.52, "skirtG"], [0.52, 0.85, "vRed"], [0.85, 1.4, "smile"], [1.4, 3.1, "cabMask"]],
  extra: [{ mat: "vRed", pts: [[-0.11, 1.31], [-0.11, 1.2], [0, 1.08], [0.11, 1.2], [0.11, 1.31]], fine: 1 }],
});

/** Avanti: the yellow over the whole lower front down to the bumper, round its corners (the name on the mask is not drawn). */
const AVANTI_FACE = face390({
  body: "avTeal",
  yellow: [[0.52, 0.42], [0.9, 0.45], [1.36, 0.5], [1.6, 0.6], [1.85, 1.0]],
  lodBands: [[0, 0.52, "skirtG"], [0.52, 1.4, "smile"], [1.4, 3.1, "cabMask"]],
  extra: [],
});

// ---------------------------------------------------------------------------
// Liveries

/** The cab side: the cab door's tall window (rounded, its head and sill raked) 5.3 - 6.1 m behind the tip, in a rubber frame. */
const cabWindow = (grow: number): { front: Pt[]; back: Pt[] } => ({
  front: [[2.3 - grow, 5.5 - grow], [2.45, 5.33 - grow], [2.9, 5.3 - grow], [3.04 + grow, 5.42 - grow]],
  back: [[2.3 - grow, 5.95 + grow], [2.45, 6.1 + grow], [2.9, 6.12 + grow], [3.04 + grow, 6.02 + grow]],
});
const CAB_GLASS = [{ mat: "rubber", ...cabWindow(0.035) }, { mat: "cabGlass", ...cabWindow(0) }];
/** The cab door's seams round the window. */
const CAB_DOOR = [
  { mat: "rubber", front: [[1.15, 5.08], [3.05, 5.08]] as Pt[], back: [[1.15, 5.1], [3.05, 5.1]] as Pt[] },
  { mat: "rubber", front: [[1.15, 6.33], [3.05, 6.33]] as Pt[], back: [[1.15, 6.35], [3.05, 6.35]] as Pt[] },
];

const SHARED = { rubber: c("#1e2023", 0.6), lampGlass: c("#3a4552", 0.1), cabGlass: { color: "#3b4856", metallic: 0.3, roughness: 0.08, glass: true }, grilleG: c("#3a3d41", 0.7), cabMask: c("#17191c", 0.25), smile: c("#f2b200", 0.4) };

/** Virgin's red over the end car's front, its rear edge leaning back, and the pale sweep behind it (d behind the tip). */
const V_EDGE: Pt[] = [[0.9, 6.4], [1.6, 6.65], [2.3, 7.05], [2.8, 7.45], [3.2, 7.9]];
type Sweep = { mat: string; front: Pt[]; back: Pt[]; top?: number };
const VIRGIN_SWEEPS: Sweep[] = [
  { mat: "vRed", front: [[0.9, -9], [3.2, -9]], back: V_EDGE },
  { mat: "vPale", front: V_EDGE, back: V_EDGE.map(([y, d]): Pt => [y, d + 0.32]) },
];

/**
 * Virgin Trains (2002, photographs of 390 013 at Stoke-on-Trent, 390 104 at Crewe, Milton Keynes): the
 * nose red with the yellow smile under the black mask and up its sides, the red carried back along the
 * end car to an edge leaning back 6.4 - 7.9 m behind the tip, a pale grey sweep behind it; the cars
 * silver with a red band under the dark grey roof; the windows apart on the silver.
 */
function virgin(): ShinkansenLivery {
  return {
    title: "Virgin", number: "390 013",
    palette: { ...SHARED, vRed: c("#cc1f2b"), vSilver: c("#a9adb1", 0.35), vPale: c("#dfe1e2", 0.4), topLine: c("#e2512a"), roofG: c("#3d4044", 0.5), skirtG: c("#55585c", 0.7), glass: c("#3a4651", 0.12) },
    bands: [[0, 2.9, "vSilver"], [2.9, 9, "vRed"]],
    front: [[0, 0.52, "skirtG"], [0.52, 9, "vRed"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      ...VIRGIN_SWEEPS,
      // the yellow strip carried from the mask's side back along the cab's roof edge
      { mat: "smile", front: [[2.96, -9], [3.1, -9]], back: [[2.96, 4.4], [3.1, 4.9]] },
      ...CAB_DOOR, ...CAB_GLASS,
    ],
    // the distant model: the red over the end car's front
    lodSideFields: { end: [{ d: [0, 7.2], bands: [[0, 9, "vRed"]] }] },
  };
}

/** Avanti's end car: the teal, the darker field round the windows, the white panel at the inner end with the coral flash at its foot. */
const AV_WHITE_FRONT: Pt[] = [[0.9, 18.4], [1.6, 18.95], [2.2, 19.8], [2.8, 20.7], [3.2, 21.4]];
/** Laid in this order, each over the last (the white first: its third place would put it level with the window frames). */
const AVANTI_SWEEPS: Sweep[] = [
  { mat: "avWhite", front: AV_WHITE_FRONT, back: [[0.9, 24.47], [3.2, 24.47]], top: LINE[0] },
  { mat: "avNavy", front: [[0.9, 15.3], [2.98, 11.9]], back: AV_WHITE_FRONT, top: LINE[0] },
  { mat: "avCoral", front: [[0.9, 17.85], [1.65, 18.8]], back: [[0.9, 18.4], [1.65, 19.0]], top: LINE[0] },
];
/**
 * Avanti West Coast (2019, photographs of 390 155 at Euston, 390 130 at Rugeley, 390 044 at Searchlight
 * Lane): dark teal, the yellow lower front, the black mask with the thin yellow strips and the orange line
 * over the windscreen, carried back along every car at the cantrail; the end car teal with a darker field
 * round its windows and a white panel at its inner end, its front edge curving back with a coral flash at
 * its foot; the intermediate cars white with the windows in a dark band, teal over their rear quarter
 * behind a curved edge with a coral wedge at its head; the triangle and the name behind the cab.
 */
function avanti(): ShinkansenLivery {
  return {
    title: "Avanti", number: "390 130",
    palette: { ...SHARED, avTeal: c("#21495a"), avNavy: c("#1b2c3d"), avWhite: c("#e9ecec", 0.4), avCoral: c("#ec6438"), topLine: c("#e2763a"), avBand: c("#13171c", 0.2), roofG: c("#6d7177", 0.55), skirtG: c("#4c4f52", 0.7), glass: c("#3a4651", 0.12) },
    bands: [[0, LINE[0], "avWhite"], [LINE[0], LINE[1], "topLine"], [LINE[1], 9, "avWhite"]],
    endBands: [[0, LINE[0], "avTeal"], [LINE[0], LINE[1], "topLine"], [LINE[1], 9, "avTeal"]],
    front: [[0, 0.52, "skirtG"], [0.52, 9, "avTeal"]],
    roof: "roofG", skirt: "skirtG",
    endSweeps: [...AVANTI_SWEEPS, ...CAB_DOOR, ...CAB_GLASS],
    // the distant model: the end car's white inner end, the intermediate car's teal rear quarter
    lodSideFields: {
      end: [{ d: [20.0, 24.5], bands: [[0, LINE[0], "avWhite"], [LINE[0], LINE[1], "topLine"], [LINE[1], 9, "avWhite"]] }],
      middle: [{ d: [18.9, 23.4], bands: [[0, LINE[0], "avTeal"], [LINE[0], LINE[1], "topLine"], [LINE[1], 9, "avTeal"]] }],
    },
    endLettering: [
      { text: "AVANTI", d: 8.5 - DJOIN, y: 1.86, h: 0.17, mat: "avWhite" },
      { text: "WEST COAST", d: 8.75 - DJOIN, y: 1.6, h: 0.15, mat: "avWhite" },
    ],
  };
}

// ---------------------------------------------------------------------------
// Fittings

/**
 * Paint on both sides between a front and a back edge ([y, d] by height, d on the body) from y0 to y1
 * (default the edges' own heights), in strips about 0.1 m tall laid on the body's own section (the tuck
 * under the belly as well as the side).
 */
function bodySweep(m: MeshBuilder, b: SliceBody, X: (d: number) => number, mat: string, front: readonly Pt[], back: readonly Pt[], proud: number, y0?: number, y1?: number): void {
  const at = (pts: readonly Pt[], y: number): number => {
    if (y <= pts[0]![0]) return pts[0]![1];
    for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!; return da + ((y - ya) / (yb - ya)) * (db - da); }
    return pts[pts.length - 1]![1];
  };
  const lo = y0 ?? Math.max(front[0]![0], back[0]![0]), hi = y1 ?? Math.min(front[front.length - 1]![0], back[back.length - 1]![0]);
  if (hi <= lo) return;
  const n = Math.max(1, Math.ceil((hi - lo) / 0.1));
  const tris: Pt[] = [];
  const end = b.length + 0.03;
  for (let i = 0; i < n; i++) {
    const [ya, yb] = [lo + ((hi - lo) * i) / n, lo + ((hi - lo) * (i + 1)) / n];
    const [fa, fb, ba, bb] = [at(front, ya), at(front, yb), at(back, ya), at(back, yb)].map((d) => Math.min(end, Math.max(-0.03, d))) as [number, number, number, number];
    if (ba - fa < 0.005 && bb - fb < 0.005) continue;
    tris.push([fa, ya], [ba, ya], [bb, yb], [fa, ya], [bb, yb], [fb, yb]);
  }
  const e = Math.sign(X(0) - X(1));
  for (const sd of [1, -1]) {
    const pts = tris.map(([d, y]): [number, number, number] => {
      const q = surfacePoint(b, d, y, sd);
      return [X(d) + e * q.n[0] * proud, y + q.n[1] * proud, sd * q.p[0] + q.n[2] * proud];
    });
    m.facets(mat, pts, [0, 0, sd]);
  }
}

/** The end car's sweeps under the belly, where the kit's own sweeps stop: from the skirt's top up to the belly. */
function lowSweeps(m: MeshBuilder, b: SliceBody, X: (d: number) => number, sweeps: readonly Sweep[]): void {
  m.scope("low sweeps", () => sweeps.forEach((w, i) => bodySweep(m, b, X, w.mat, w.front.map(([y, d]): Pt => [y, d - DJOIN]), w.back.map(([y, d]): Pt => [y, d - DJOIN]), 0.003 + 0.0015 * i, A, Y + 0.01)));
}

/** The roof's air-conditioning housings with their grilles, and the equipment under the floor. */
function roofAndUnder(m: MeshBuilder, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = 3.56;
  m.scope("roof equipment", () => {
    // the end car's long housing behind the cab, the others' over their front end
    const [d0, d1] = car.end ? [3.2, 10.6] : [0.9, 3.9];
    block(m, "roofG", X(d1), X(d0), C - 0.06, C + 0.12, -0.5, 0.5);
    for (const [g0, g1] of car.end ? [[3.6, 4.6], [8.8, 10.2]] : [[1.3, 2.6]]) block(m, "grilleG", X(g1!), X(g0!), C + 0.12, C + 0.135, -0.38, 0.38);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.2), X(car.trucks[0]! + 2.2), 0.36, 0.52, -1.0, 1.0));
}

/** Avanti's paint on the cars: the dark band round the windows, the intermediate car's teal rear quarter and coral wedge, the end car's triangle. */
function avantiFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [w0, w1] = car.end ? [END_WINDOWS[0]![0] - 0.25, END_WINDOWS[END_WINDOWS.length - 1]![1] + 0.25] : [MID_WINDOWS[0]![0] - 0.25, MID_WINDOWS[MID_WINDOWS.length - 1]![1] + 0.25];
  m.scope("window band", () => bodySweep(m, b, X, "avBand", [[BAND[0], w0], [BAND[1], w0]], [[BAND[0], w1], [BAND[1], w1]], 0.0053));
  if (!car.end) m.scope("rear quarter", () => {
    const L = car.length;
    // the white's rear edge, curving back toward its foot; the coral wedge at its head
    bodySweep(m, b, X, "avTeal", [[A - 0.1, L - 4.0], [1.6, L - 4.1], [2.3, L - 4.5], [BAND[1], L - 4.9], [LINE[0], L - 5.0]], [[A - 0.1, L + 0.2], [LINE[0], L + 0.2]], 0.003);
    bodySweep(m, b, X, "avCoral", [[BAND[1], L - 4.95], [LINE[0], L - 5.35]], [[BAND[1], L - 4.85], [LINE[0], L - 4.6]], 0.0052);
  });
  else {
    lowSweeps(m, b, X, AVANTI_SWEEPS);
    m.scope("triangle", () => {
    // the orange triangle's outline behind the cab: its point up, its long side leaning back to its foot
    const P: Pt[] = [[9.55 - DJOIN, 2.88], [9.98 - DJOIN, 1.62], [9.42 - DJOIN, 2.02]];
    const tris: Pt[] = [];
    for (let i = 0; i < 3; i++) {
      const [a, e] = [P[i]!, P[(i + 1) % 3]!];
      const [dx, dy] = [e[0] - a[0], e[1] - a[1]], k = 0.03 / Math.hypot(dx, dy);
      const [nx, ny] = [-dy * k, dx * k];
      tris.push(a, e, [e[0] + nx, e[1] + ny], a, [e[0] + nx, e[1] + ny], [a[0] + nx, a[1] + ny]);
    }
    for (const sd of [1, -1]) sideDecal(m, b, X, sd, "avCoral", tris, 0.005);
    });
  }
  roofAndUnder(m, X, car);
}

function virginFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) lowSweeps(m, b, X, VIRGIN_SWEEPS);
  roofAndUnder(m, X, car);
}

// ---------------------------------------------------------------------------
// The series

/** Windows n of them w wide, `pitch` apart, the first centred at d0 (body d). */
const windowRow = (d0: number, n: number, pitch: number, w: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, k) => [d0 + k * pitch - w / 2, d0 + k * pitch + w / 2] as const);

/** The end car's windows (Rugeley and Abington, 1.25 m wide, 1.83 m apart from 12.72 m behind the tip): the first-class car's five, the standard car's six. */
const END_WINDOWS = windowRow(12.72 - DJOIN, 5, 1.83, 1.25);
const REAR_WINDOWS = windowRow(12.72 - DJOIN, 6, 1.83, 1.25);
/** The intermediate car's eight (Abington: 1.35 m wide, 2.1 m apart, the first 5.15 m behind its front end). */
const MID_WINDOWS = windowRow(5.15, 8, 2.1, 1.35);
/** The end car's doors: behind the cab door (10.3 m behind the tip) and at the inner end. */
const END_DOORS: ReadonlyArray<readonly [number, number, number]> = [[10.3 - DJOIN, 11.25 - DJOIN, -1], [23.1 - DJOIN, 24.05 - DJOIN, 1]];

const BASE: ShinkansenSeries = {
  // 24.80 m end cars and 23.90 m intermediate cars over the couplers, 2.73 m wide, 3.56 m high (en.wikipedia
  // "British Rail Class 390"); widest at the waist, tucked in under it and drawn in over the windows to the
  // narrow roof (the head-on photograph at Milton Keynes)
  endLength: 24.8, midLength: 23.9, W: 1.365, Y, S, C: 3.56, lean: 0.84, B: 0.5, A,
  tiltSection: { wa: 0.985, wl: 0.88, roofPower: 2.2 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  endCrown: [[0, 3.48], [0.8, 3.53], [1.6, 3.56]],
  layout: {
    end: { doors: END_DOORS, windows: END_WINDOWS },
    middle: { doors: [[0.35, 1.3, -1], [22.1, 23.05, 1]], windows: MID_WINDOWS },
  },
  rearEnd: { layout: { doors: END_DOORS, windows: REAR_WINDOWS } },
  windows: [WINDOWS], windowW: 1.25, pitch: 1.83, windowCornerRadius: 0.12,
  door: [1.15, 3.0, 1.95, 2.72], doorW: 0.95, doorGlassW: 0.22, doorGlassR: 0.1,
  // Fiat SIG tilting bogies, 2.7 m wheelbase, 0.85 m wheels; the end car's 6.3 and 21.3 m behind the tip
  // (Rugeley), the intermediate car's 17.1 m apart
  bogieCentres: 17.1, wheelR: 0.425, wheelbase: 2.7, endBogies: [6.3 - DJOIN, 21.3 - DJOIN], midBogies: [3.15, 20.25],
  cars: [4, 6, 8],
  liveries: { virgin: virgin(), avanti: avanti() },
  weight: { end: 57, middle: 50 }, power: 850, maxspeed: 225,
};

/** The design's series (its parameters and figures): the Virgin face and fittings. */
export const C390: ShinkansenSeries = { ...BASE, cabFace: VIRGIN_FACE, fittings: virginFittings };
/** The Avanti livery's own face (the yellow lower front, the name on the mask) and its paint on the cars. */
export const C390_AVANTI: ShinkansenSeries = { ...BASE, cabFace: AVANTI_FACE, fittings: avantiFittings };
