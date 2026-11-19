// The Regio 2N (Bombardier, later Alstom "Omneo", SNCF Z 55500 / Z 56300 / Z 57000 ...), drawn on
// the series kit (shinkansen.ts) with its own cab face (seriesCab.ts): the world's first articulated
// double-deck EMU, double-deck cars alternating with short single-deck "access" cars, every car
// joint on a Jacobs bogie. Four kinds of car (Bombardier's data sheet, assets/sncf-regio2n/SOURCES.md):
//
// - the double-deck end car (19.215 m over its couplers; `endCar`): the cab, the cab door, a window and
//   the access door of the single-level vestibule over the motor bogie, then the double deck in the
//   well (three lower windows, the stairs' blank panel ahead of them, the mezzanine window over the
//   rear Jacobs bogie);
// - the double-deck intermediate car (15.445 m; `middleCar`): no doors, the stairs' blank panel at its
//   front end, six windows on each deck, the mezzanine window at its rear end;
// - the single-deck intermediate car (10.02 m; `singleDeckCar`): the low floor at the platform (600 mm),
//   two 1.6 m double doors a side with a window outside each, the lower roof under the equipment
//   fairings and the pantograph;
// - the single-deck end car (14.3 m; `singleDeckEnd`): the same cab, then the single-level saloon (two
//   windows, the frosted toilet, one door, a window), a pantograph among its roof equipment.
//
// A train alternates them (`regio2nTrain`): with an even number of cars the double-deck end car leads
// and the single-deck one closes it (the 6-car "courte" 82.7 m, the 8-car "longue" 109.9 m); an odd
// number has a single-deck end car at both ends (the 7-car "moyenne" 95.0 m). The nose: the cab's tall
// rounded front, the windscreen raked back about 37 degrees and wrapped round its corners, the almond
// headlights at the foot of the mask, the open recess of the Scharfenberg coupler below; in the TER
// scheme the dark blue mask sweeping back over the cab sides into the upper band, in the Ile-de-France
// Mobilites scheme the white front with the light blue arch round the windscreen.
//
// Measured on the photographs in assets/sncf-regio2n/: the 8-car 057L side-on (Cramos; the cars'
// lengths give its scale, about 9.7 px/m along the train, the double-deck car 86 px/m on its 4x crop
// up the side), 003XL at Longueau (Hauts-de-France, the end car's layout by a 1-D projective fit over
// the face, the 1.6 m door and the car's joint; heights about 112 px/m on the 2x crop), Z 55503 (the
// single-deck end car, 214 px/m up its door at 3x), the noses of 117M at Beauvais, 070L at Cannes and
// 008R at Montereau, and 050R (IDFM) for the Transilien scheme. See docs/models/france-trains.md.
//
// Heights over the rail; on the face d behind its tip, on the body d behind the body's front end (the
// face's join on an end car, the coupling gap on an intermediate car); `t` marks d behind the tip.

import { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import {
  buildSeries, buildSeriesLod, drawSeriesCar, drawSeriesJointBogie, SERIES_GAP, seriesCarLod, seriesCarPalette,
  type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries,
} from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { articulate } from "./tramKit.ts";
import { EMU_CATALOG, enumParam } from "./emuParts.ts";
import { fitUnit } from "./lodUnits.ts";
import type { LodSections } from "./lodKit.ts";

/** Where the face meets the body, behind the tip; the coupling plane ahead of the tip (the coupler in its recess). */
const JOIN = 2.9;
const REACH = 0.2;
/** d behind the tip to d on an end car's body. */
const T = (t: number) => t - JOIN;

/** The car lengths over the couplers (Bombardier: the double-deck end car, the 15.445 m double-deck intermediate, the single-deck intermediate and end car). */
export const REGIO2N_LENGTHS = { dEnd: 19.215, dMid: 15.445, sMid: 10.02, sEnd: 14.3 } as const;

/** Heights: 4.32 m high; the double-deck cars 2.99 m wide, the single-deck 3.05 m. */
const C_D = 4.32;
const S_D = 3.95;
const C_S = 3.9;
const S_S = 3.35;
/** Belly, skirt top and bottom over the bogies and the ends; the low floor's well (double-deck cars). */
const Y = 0.95;
const A = 0.6;
const B = 0.47;

/** The window rows of the double-deck cars: lower deck, upper deck, the mezzanine over the joint. */
const LOWER: readonly [number, number] = [0.88, 1.88];
const UPPER: readonly [number, number] = [3.15, 3.92];
const MID: readonly [number, number] = [1.68, 2.6];
/** The single-deck cars' one row. */
const SINGLE: readonly [number, number] = [1.66, 2.6];

// ---------------------------------------------------------------------------
// The cab face

/**
 * The face's centre line (057L side-on, 070L / 117M / 008R three-quarter): the grey chin tucked under,
 * the front upright from 0.75 to 1.1 m round the coupler's recess, leaning back past the lamps, the
 * windscreen raked about 37 degrees from 2.05 m (0.35 m back) to 3.75 m (1.6 m back), the dome rounding
 * over to the crown 2.9 m behind the tip.
 */
const PROFILE: Pt[] = [
  [B, 0.16], [0.6, 0.06], [0.75, 0], [1.1, 0], [1.35, 0.03], [1.6, 0.1], [1.85, 0.22], [2.05, 0.35], [2.5, 0.65],
  [3.0, 0.97], [3.5, 1.32], [3.9, 1.65], [4.05, 1.86], [4.17, 2.12], [4.26, 2.45], [C_D, JOIN],
];
/** The windscreen's black surround and its glass; the band under it between the lamps; the coupler's recess. */
const SURROUND = [2.0, 3.97] as const;
const GLASS = [2.08, 3.89] as const;
const VISOR = [1.6, 2.0] as const;
const RECESS = [0.5, 1.46] as const;
/** The mask's foot on the face (TER: the blue below the lamps). */
const MASK_FOOT = 1.52;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.62, RECESS[0], RECESS[1], MASK_FOOT, VISOR[0], 1.75, 1.9, VISOR[1], SURROUND[0], GLASS[0], 2.9, 3.4, GLASS[1], SURROUND[1], 4.08, 4.12, 4.2])].sort((a, b) => a - b);

const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** The almond headlight on the viewer's right: low and narrow inside, rising to the corner. */
const ALMOND: Pt[] = [[0.5, 1.5], [0.75, 1.45], [1.02, 1.46], [1.25, 1.53], [1.41, 1.67], [1.47, 1.84], [1.41, 1.97], [1.2, 1.96], [0.95, 1.84], [0.7, 1.67]];
/** The rim's corners: the lens's, grown 5 cm, on six of them (a field's corners cost the face's grid). */
const RIM_AT = [0, 2, 4, 5, 6, 8];
/** A polygon grown about its centroid by k (m): the headlight's silver rim round its lens. */
const grown = (pts: readonly Pt[], k: number): Pt[] => {
  const [cl, cy] = [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  return pts.map(([l, y]): Pt => { const [dl, dy] = [l - cl, y - cy], r = Math.hypot(dl, dy); return [Math.round((l + (dl / r) * k) * 1e4) / 1e4, Math.round((y + (dy / r) * k) * 1e4) / 1e4]; });
};

const RIM: Pt[] = grown(ALMOND, 0.05).filter((_, i) => RIM_AT.includes(i));

const FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.2, reach: REACH, first: 4.3, roofFrom: C_D - 0.02, tolerance: 0.03, cols: [7, 4, 1, 1],
  profile: PROFILE,
  // round in plan: broad and flat low down, the corners sweeping further back up the windscreen, the dome round
  corner: [[B, 0.8], [1.1, 0.8], [1.9, 0.75], [2.5, 0.8], [3.2, 0.9], [3.9, 0.95], [4.15, 0.8], [C_D, 0.6]],
  cornerDepth: [[B, 1.15], [1.1, 1.05], [1.9, 0.95], [2.5, 1.05], [3.2, 1.2], [3.9, 1.2], [4.15, 0.8], [C_D, 0.25]],
  bulge: [[B, 0.05], [1.1, 0.08], [2.0, 0.1], [3.0, 0.08], [3.9, 0.04], [C_D, 0]],
  rows: ROWS,
  bands: () => [[0, 0.62, "skirtG"], [0.62, MASK_FOOT, "noseLow"], [MASK_FOOT, 9, "mask"]],
  lodBands: [[0, 0.62, "skirtG"], [0.62, MASK_FOOT, "noseLow"], [MASK_FOOT, SURROUND[0], "mask"], [SURROUND[0], SURROUND[1], "black"], [SURROUND[1], 9, "mask"]],
  lodGlass: { hw: 1.1, y: [GLASS[0], GLASS[1]] },
  fields: [
    // the arch round the windscreen (the light blue of IDFM; the mask's own blue in the TER scheme)
    { mat: "arch", pts: [[-1.46, 1.84], [-1.3, 1.92], [-1.25, 3.85], [-1.16, 4.0], [-1.32, 4.08], [-1.46, 3.8]] },
    { mat: "arch", pts: [[1.46, 1.84], [1.46, 3.8], [1.32, 4.08], [1.16, 4.0], [1.25, 3.85], [1.3, 1.92]] },
    { mat: "arch", pts: box(-1.18, 1.18, 3.99, 4.08) },
    // the headlights' silver rims (117M, 070L: teardrops about 0.95 m long, swept up and out from beside the recess to the corner)
    { mat: "lampRim", pts: RIM }, { mat: "lampRim", pts: mirror(RIM) },
  ],
  masks: [
    { lat: [-1.2, 1.2], y: SURROUND, r: 0.22, mat: "black" },
    { lat: [-0.58, 0.58], y: [1.66, VISOR[1]], r: 0.06, mat: "visor" },
    // the dark chin round the open recess of the coupler, its top rounded up to the mask
    { lat: [-0.74, 0.74], y: [0.47, 1.52], r: 0.15, mat: "chin" },
    { lat: [-0.62, 0.62], y: RECESS, r: 0.15, mat: "black" },
  ],
  panes: [{ lat: [-1.12, 1.12], y: GLASS, r: 0.18 }],
  decals: [
    { mat: "lampGlass", pts: ALMOND, fine: 5 }, { mat: "lampGlass", pts: mirror(ALMOND), fine: 5 },
    // the three lamps on the dome
    ...[-0.22, 0, 0.22].map((l) => ({ mat: "black", pts: box(l - 0.07, l + 0.07, 4.12, 4.2), fine: 1 })),
  ],
  lamps: [[-1.05, 1.72, 0.11, "lampHead"], [1.05, 1.72, 0.11, "lampHead"], [-1.3, 1.8, 0.06, "lampHead"], [1.3, 1.8, 0.06, "lampHead"], [-0.74, 1.57, 0.05, "lampRed"], [0.74, 1.57, 0.05, "lampRed"], [0, 4.16, 0.04, "lampHead"]],
  number: { lat: -0.38, y: 1.76, h: 0.08, mat: "white" },
  wipers: [[[-0.25, 2.15], [-0.9, 3.35]]],
};

// ---------------------------------------------------------------------------
// The cars' sides

/** A double door of two leaves from d (each leaf its own narrow window), the leaves sliding apart. */
const door = (d: number, w = 1.6): Array<readonly [number, number, number]> => [[d, d + w / 2, -1], [d + w / 2, d + w, 1]];

/** The double-deck end car (t behind the tip): cab door, vestibule window and door, the double deck. */
const DEND = {
  cabDoor: [4.3, 5.0] as const,
  vestibule: [5.6, 6.5] as const,
  door: 7.1,
  well: [9.0, 16.9] as const,
  lower: [[10.3, 11.7], [11.95, 13.35], [13.6, 15.0], [15.25, 15.85]] as Array<[number, number]>,
  upper: [[10.6, 11.2], [11.45, 12.85], [13.1, 14.5], [14.75, 16.15]] as Array<[number, number]>,
  mezzanine: [16.95, 17.95] as const,
  bogie: 5.3,
};
/** The single-deck end car (t behind the tip): cab door, two windows, the toilet's frosted panel, the door, a window. */
const SEND = {
  vestibule: [5.6, 6.5] as const,
  window: [8.0, 9.2] as const,
  toilet: [9.2, 10.05] as const,
  door: 10.3,
  rear: [12.15, 12.95] as const,
};
/** Bodies: the end cars' from the join to the inner gap, the intermediate cars' between their gaps. */
const DEND_L = REGIO2N_LENGTHS.dEnd - SERIES_GAP - JOIN - REACH;
const SEND_L = REGIO2N_LENGTHS.sEnd - SERIES_GAP - JOIN - REACH;
const DMID_L = REGIO2N_LENGTHS.dMid - 2 * SERIES_GAP;
const SMID_L = REGIO2N_LENGTHS.sMid - 2 * SERIES_GAP;

/** The double-deck intermediate car (body d): the stairs' panel at the front, six windows a deck, the mezzanine window at the rear. */
const DMID = {
  well: [2.1, 12.9] as const,
  lower: [[3.45, 4.85], [5.1, 6.5], [6.75, 8.15], [8.4, 9.8], [10.05, 11.45], [11.7, 12.4]] as Array<[number, number]>,
  upper: [[4.2, 4.85], [5.1, 6.5], [6.75, 8.15], [8.4, 9.8], [10.05, 11.45], [11.7, 12.75]] as Array<[number, number]>,
  mezzanine: [13.35, 14.45] as const,
};
/** The single-deck intermediate car (body d): a window, two doors either side of the toilet, a window - symmetric. */
const SMID = { windows: [[0.4, 1.8], [SMID_L - 1.8, SMID_L - 0.4]] as Array<[number, number]>, doors: [2.2, SMID_L - 2.2 - 1.6] as const };

const DEND_LAYOUT: SeriesLayout = {
  doors: door(T(DEND.door)),
  windows: [],
  rows: [DEND.lower.map(([a, e]): [number, number] => [T(a), T(e)]), DEND.upper.map(([a, e]): [number, number] => [T(a), T(e)]), [[T(DEND.vestibule[0]), T(DEND.vestibule[1])], [T(DEND.mezzanine[0]), T(DEND.mezzanine[1])]]],
};
const DMID_LAYOUT: SeriesLayout = { doors: [], windows: [], rows: [DMID.lower, DMID.upper, [[DMID.mezzanine[0], DMID.mezzanine[1]]]] };
const SEND_LAYOUT: SeriesLayout = {
  doors: door(T(SEND.door)),
  windows: [[T(SEND.vestibule[0]), T(SEND.vestibule[1])], [T(SEND.window[0]), T(SEND.window[1])], [T(SEND.rear[0]), T(SEND.rear[1])]],
};
const SMID_LAYOUT: SeriesLayout = { doors: [...door(SMID.doors[0]), ...door(SMID.doors[1])], windows: SMID.windows };

// ---------------------------------------------------------------------------
// Liveries

/** The TER scheme (Hauts-de-France, 003XL at Longueau; the national scheme's structure on 070L and 117M): silver, the dark blue mask and upper band, blue doors, the region's green. */
const TER_BLUE = "#26389a";
/** Ile-de-France Mobilites (008R, 050R): white and anthracite, the light blue line and arch. */
const IDFM_BLUE = "#18a6dd";

const TER_PALETTE = {
  body: c("#c3c7cb", 0.35), noseLow: c("#c3c7cb", 0.35), mask: c(TER_BLUE, 0.3), arch: c(TER_BLUE, 0.3), visor: c("#1c2340", 0.3), blue: c(TER_BLUE, 0.35),
  green: c("#7dbb3c", 0.4), winBand: c("#454b52", 0.4), skirtG: c("#3b3f44", 0.7), roofG: c("#a7abaf", 0.55), roofE: c("#8a8e92", 0.6),
  black: c("#16181a", 0.35), white: c("#f2f2f0", 0.4), lampGlass: { color: "#eef3f7", metallic: 0.2, roughness: 0.08, glass: true }, lampRim: c("#9da2a7", 0.3), chin: c("#2b2e32", 0.6), doorLeaf: c(TER_BLUE, 0.35), cabMask: c("#1d1f22", 0.3),
};
const IDFM_PALETTE = {
  body: c("#e6e8e9", 0.4), noseLow: c("#eef0f0", 0.4), mask: c("#eef0f0", 0.4), arch: c(IDFM_BLUE, 0.35), visor: c("#16181a", 0.3), blue: c(IDFM_BLUE, 0.35),
  anthracite: c("#4a4f56", 0.45), skirtG: c("#3b3f44", 0.7), roofG: c("#b4b8bb", 0.55), roofE: c("#8a8e92", 0.6),
  black: c("#16181a", 0.35), white: c("#f2f2f0", 0.4), lampGlass: { color: "#eef3f7", metallic: 0.2, roughness: 0.08, glass: true }, lampRim: c("#9da2a7", 0.3), chin: c("#2b2e32", 0.6), doorLeaf: c("#dfe2e4", 0.4), cabMask: c("#1d1f22", 0.3),
};

/** A field's rectangle in [d, y]. */
const rect = (d0: number, d1: number, y0: number, y1: number): Pt[] => [[d0, y0], [d1, y0], [d1, y1], [d0, y1]];

/** The TER upper band's foot on the double-deck cars and on the single-deck cars and end sections. */
const TER_BAND_D = 2.62;
const TER_BAND_S = 3.12;
/** The IDFM line between the anthracite and the white. */
const IDFM_LINE = [3.12, 3.2] as const;

/** The fields' foot: over the belly, where the side is flat along the whole car (the well's ramps curve below it). */
const FIELD_FOOT = Y + 0.02;

type Fields = Array<{ mat: string; pts: Pt[] }>;

/** The TER fields of a car kind (d on its body). */
function terFields(kind: Kind): Fields {
  switch (kind) {
    case "dEnd": {
      const [w0, w1] = [T(DEND.lower[0]![0]) - 0.7, T(DEND.lower[DEND.lower.length - 1]![1]) + 0.15];
      return [
        // the green round the vestibule's door, rising in a diagonal to the upper band
        { mat: "green", pts: [[T(DEND.cabDoor[1]) + 0.25, FIELD_FOOT], [T(DEND.door + 1.6) + 1.2, FIELD_FOOT], [T(DEND.door + 1.6) + 1.2, TER_BAND_D], [T(DEND.door + 1.6) + 0.4, TER_BAND_S], [T(DEND.cabDoor[1]) + 0.25, TER_BAND_S]] },
        // the upper deck's blue down to the band's foot, the lower deck's dark window band
        { mat: "blue", pts: [[T(DEND.door + 1.6) + 1.2, TER_BAND_D], [DEND_L, TER_BAND_D], [DEND_L, TER_BAND_S], [T(DEND.door + 1.6) + 0.4, TER_BAND_S]] },
        { mat: "winBand", pts: rect(w0, w1, LOWER[0] - 0.08, LOWER[1] + 0.1) },
        // the white stripe and the green over the rear end
        { mat: "white", pts: [[T(DEND.upper[1]![0]) - 0.2, 2.75], [T(DEND.upper[1]![0]) - 0.02, 2.75], [T(DEND.upper[1]![0]) + 0.25, S_D], [T(DEND.upper[1]![0]) + 0.07, S_D]] },
        { mat: "green", pts: [[T(DEND.mezzanine[0]) - 0.6, 2.75], [DEND_L, 2.75], [DEND_L, S_D], [T(DEND.mezzanine[0]) - 0.1, S_D]] },
      ];
    }
    case "dMid": {
      const [w0, w1] = [0.55, DMID.lower[DMID.lower.length - 1]![1] + 0.15];
      return [
        // the green over the stairs at the front, its top leaning into the blue
        { mat: "green", pts: [[0.02, FIELD_FOOT], [2.9, FIELD_FOOT], [2.9, TER_BAND_D], [2.5, S_D], [0.02, S_D]] },
        { mat: "blue", pts: [[2.9, TER_BAND_D], [DMID_L - 0.02, TER_BAND_D], [DMID_L - 0.02, 2.75], [2.5, 2.75]] },
        { mat: "winBand", pts: rect(w0 + 2.4, w1, LOWER[0] - 0.08, LOWER[1] + 0.1) },
        { mat: "white", pts: [[3.3, 2.75], [3.48, 2.75], [3.75, S_D], [3.57, S_D]] },
        { mat: "green", pts: [[DMID.mezzanine[0] - 2.2, 2.75], [DMID_L - 0.02, 2.75], [DMID_L - 0.02, S_D], [DMID.mezzanine[0] - 1.7, S_D]] },
      ];
    }
    case "sMid":
      // the green either end, outside the doors
      return [
        { mat: "green", pts: rect(0.02, SMID.doors[0] - 0.15, FIELD_FOOT, TER_BAND_S) },
        { mat: "green", pts: rect(SMID.doors[1] + 1.75, SMID_L - 0.02, FIELD_FOOT, TER_BAND_S) },
      ];
    case "sEnd":
      return [{ mat: "green", pts: rect(T(SEND.door) - 1.4, T(SEND.door) - 0.15, FIELD_FOOT, TER_BAND_S) }];
  }
}

/** The IDFM fields: the light blue frames of the doors. */
function idfmFields(kind: Kind): Fields {
  const doors = kind === "dEnd" ? [T(DEND.door)] : kind === "sEnd" ? [T(SEND.door)] : kind === "sMid" ? [...SMID.doors] : [];
  return doors.flatMap((d) => [
    { mat: "blue", pts: rect(d - 0.11, d - 0.02, FIELD_FOOT, IDFM_LINE[0]) },
    { mat: "blue", pts: rect(d + 1.62, d + 1.71, FIELD_FOOT, IDFM_LINE[0]) },
  ]);
}

type Kind = "dEnd" | "dMid" | "sMid" | "sEnd";

/** The TER mask sweeping back from the lamps over the cab side, up into the upper band (t behind the tip). */
const TER_SWEEP = { mat: "blue", front: [[MASK_FOOT, -9], [4.4, -9]] as Pt[], back: [[MASK_FOOT, 0.3], [1.95, 0.6], [2.3, 1.15], [2.7, 1.95], [TER_BAND_S, 2.9], [TER_BAND_S + 0.01, 9], [4.4, 9]] as Pt[] };
/** IDFM: the white cab side ahead of the anthracite's rising edge, the light blue arch sweeping back to the roof's edge. */
const IDFM_SWEEPS = [
  { mat: "white", front: [[0.62, -9], [IDFM_LINE[1], -9]] as Pt[], back: [[0.62, 3.6], [1.6, 4.75], [IDFM_LINE[0], 5.05], [IDFM_LINE[1], 5.05]] as Pt[] },
  { mat: "blue", front: [[1.84, 0.62], [2.6, 1.2], [3.4, 2.0], [S_D, 2.8]] as Pt[], back: [[1.84, 0.86], [2.6, 1.45], [3.4, 2.3], [S_D, 3.2]] as Pt[] },
];

function livery(kind: Kind, idfm: boolean): ShinkansenLivery {
  const single = kind === "sMid" || kind === "sEnd";
  if (!idfm) {
    return {
      title: "TER", number: "Z 55505", palette: TER_PALETTE, roof: "roofG", skirt: "skirtG",
      bands: [[0, 0.75, "skirtG"], [0.75, TER_BAND_S, "body"], [TER_BAND_S, 9, "blue"]],
      doors: [[0, 9, "doorLeaf"]],
      ...(kind === "dEnd" || kind === "sEnd" ? { endSweeps: [TER_SWEEP] } : {}),
      sideFields: { end: terFields(kind), middle: terFields(kind) },
      lodSides: single ? [[0, 0.75, "skirtG"], [0.75, TER_BAND_S, "body"], [TER_BAND_S, 9, "blue"]] : [[0, 0.75, "skirtG"], [0.75, LOWER[0], "body"], [LOWER[0], LOWER[1], "winBand"], [LOWER[1], TER_BAND_D, "body"], [TER_BAND_D, 9, "blue"]],
    };
  }
  return {
    title: "Transilien", number: "Z 57015", palette: IDFM_PALETTE, roof: "roofG", skirt: "skirtG",
    bands: [[0, 0.62, "skirtG"], [0.62, IDFM_LINE[0], "anthracite"], [IDFM_LINE[0], IDFM_LINE[1], "blue"], [IDFM_LINE[1], 9, "body"]],
    doors: [[0, IDFM_LINE[0], "doorLeaf"], [IDFM_LINE[0], IDFM_LINE[1], "blue"], [IDFM_LINE[1], 9, "body"]],
    ...(kind === "dEnd" || kind === "sEnd" ? { endSweeps: IDFM_SWEEPS } : {}),
    sideFields: { end: idfmFields(kind), middle: idfmFields(kind) },
  };
}

// ---------------------------------------------------------------------------
// Fittings

/** The roof equipment's fairings (body d spans) at a height, grilles across their tops. */
function fairings(m: MeshBuilder, X: (d: number) => number, spans: ReadonlyArray<readonly [number, number]>, y0: number, y1: number, hw: number): void {
  const at = (mat: string, d0: number, d1: number, ya: number, yb: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), ya, yb, z0, z1);
  m.scope("roof equipment", () => {
    for (const [d0, d1] of spans) {
      at("roofE", d0, d1, y0, y1, -hw, hw);
      for (let d = d0 + 0.25; d + 0.3 < d1; d += 0.6) at("black", d, d + 0.3, y1, y1 + 0.008, -hw + 0.12, hw - 0.12);
    }
  });
}

/** The cab end: the Scharfenberg coupler standing in its recess. */
function cabCoupler(m: MeshBuilder, X: (d: number) => number): void {
  m.scope("coupler", () => {
    const tip = X(-JOIN), k = Math.sign(tip - X(0));
    const out = (mat: string, a: number, e: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, -hw, hw);
    out("carbon", -0.55, 0.05, 0.9, 1.06, 0.09);
    out("carbon", 0.05, 0.18, 0.82, 1.14, 0.2);
  });
}

/** The pantograph's place on a single-deck car (body d): over the toilet between the doors (the end car's over its vestibule). */
const PANTO_D = SMID_L / 2;

function regio2nFittings(kind: Kind) {
  return (m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number }): void => {
    const L = car.length;
    if (car.end) cabCoupler(m, X);
    if (kind === "sMid" || kind === "sEnd") {
      // the fairings over the transformer, converters and resistors, open round the pantograph
      const from = kind === "sEnd" ? T(5.2) : 0.35;
      fairings(m, X, [[from, PANTO_D - 1.2], [PANTO_D + 1.2, L - 0.35]], C_S - 0.12, 4.25, 1.05);
    }
    if (kind === "dEnd") {
      // the cab and vestibule's roof: the equipment's grilles on both edges
      m.scope("roof grilles", () => {
        for (const sd of [1, -1]) for (const [d0, d1] of [[T(3.3), T(5.3)], [T(5.6), T(8.8)]] as const) {
          crownPane(m, b, X, sd, "roofE", [d0, d1], [0.55, 1.15], 0.005);
          for (let d = d0 + 0.2; d + 0.12 < d1; d += 0.45) crownPane(m, b, X, sd, "black", [d, d + 0.12], [0.6, 1.1], 0.009);
        }
      });
    }
    if (kind === "dEnd" || kind === "sEnd") {
      // the cab door's outline and window
      const [a, e] = [T(4.3), T(5.0)];
      m.scope("cab door", () => {
        for (const sd of [1, -1]) {
          sideDecal(m, b, X, sd, "black", [[a, 1.0], [a + 0.025, 1.0], [a + 0.025, 3.2], [a, 1.0], [a + 0.025, 3.2], [a, 3.2]], 0.005);
          sideDecal(m, b, X, sd, "black", [[e - 0.025, 1.0], [e, 1.0], [e, 3.2], [e - 0.025, 1.0], [e, 3.2], [e - 0.025, 3.2]], 0.005);
          sideDecal(m, b, X, sd, "black", [[a, 3.175], [e, 3.175], [e, 3.2], [a, 3.175], [e, 3.2], [a, 3.2]], 0.005);
          sideDecal(m, b, X, sd, "glass", [[a + 0.15, 2.0], [e - 0.15, 2.0], [e - 0.15, 2.85], [a + 0.15, 2.0], [e - 0.15, 2.85], [a + 0.15, 2.85]], 0.006);
        }
      });
    }
    if (kind === "sEnd") {
      // the toilet's frosted panel beside the big window
      m.scope("toilet window", () => {
        for (const sd of [1, -1]) sideDecal(m, b, X, sd, "black", [[T(SEND.toilet[0]), SINGLE[0]], [T(SEND.toilet[1]), SINGLE[0]], [T(SEND.toilet[1]), SINGLE[1]], [T(SEND.toilet[0]), SINGLE[0]], [T(SEND.toilet[1]), SINGLE[1]], [T(SEND.toilet[0]), SINGLE[1]]], 0.005);
      });
    }
  };
}

// ---------------------------------------------------------------------------
// The series: the double-deck cars (end and intermediate) and the single-deck ones

const common = {
  nose: NO_NOSE, windscreen: [0, 0, 0, 0] as const, lamps: [0, 0] as const, cabFace: FACE,
  B, A, Y, lean: 0.95, windowW: 1.4, pitch: 1.65,
  // the doors from the platform-level floor (600 mm), a narrow window in each leaf
  door: [0.62, 2.72, 1.3, 2.45] as const, doorW: 1.6, doorGlassW: 0.22,
  // Jacobs bogies under every joint, 840 mm wheels
  jacobs: true, bogieCentres: 0, wheelR: 0.42, wheelbase: 2.5,
  pantograph: "single" as const, maxspeed: 160,
};

const liveries = (kind: Kind) => ({ ter: livery(kind, false), transilien: livery(kind, true) });

/** The double-deck cars: the end car with the cab (and the motor bogie under its vestibule) and the intermediate car; no pantograph. */
export const REGIO2N_DD: ShinkansenSeries = {
  ...common,
  endLength: REGIO2N_LENGTHS.dEnd, midLength: REGIO2N_LENGTHS.dMid, W: 1.495, S: S_D, C: C_D,
  windows: [LOWER, UPPER, MID],
  layout: { end: DEND_LAYOUT, middle: DMID_LAYOUT },
  lowWell: { end: [T(DEND.well[0]), T(DEND.well[1])], middle: DMID.well, Y: 0.48, A: 0.4, B: 0.3, lodMat: "skirtG" },
  endBogies: [T(DEND.bogie), DEND_L + SERIES_GAP],
  traction: "none",
  liveries: liveries("dEnd"),
  fittings: regio2nFittings("dEnd"),
  weight: { end: 40, middle: 34 }, power: 720,
};
/** The double-deck intermediate car's own fittings and liveries (its series is REGIO2N_DD's). */
const REGIO2N_DMID: ShinkansenSeries = { ...REGIO2N_DD, liveries: liveries("dMid"), fittings: regio2nFittings("dMid") };

/** The single-deck cars: the end car (its cab section as tall as the double-deck cars') and the access car; the pantographs on their roofs. */
const REGIO2N_SD: ShinkansenSeries = {
  ...common,
  endLength: REGIO2N_LENGTHS.sEnd, midLength: REGIO2N_LENGTHS.sMid, W: 1.525, S: S_S, C: C_S,
  windows: [SINGLE],
  layout: { end: SEND_LAYOUT, middle: SMID_LAYOUT },
  endSection: { C: [[0, C_D], [T(5.05), C_D], [T(5.6), C_S]], S: [[0, S_D], [T(5.05), S_D], [T(5.6), S_S]], step: 0.5 },
  endBogies: [T(DEND.bogie), SEND_L + SERIES_GAP],
  pantographAt: PANTO_D,
  liveries: liveries("sMid"),
  fittings: regio2nFittings("sMid"),
  weight: { end: 34, middle: 29 }, power: 480,
};
/** The single-deck end car: its own liveries and fittings, its pantograph raised as a lone car. */
const REGIO2N_SEND: ShinkansenSeries = { ...REGIO2N_SD, liveries: liveries("sEnd"), fittings: regio2nFittings("sEnd"), endPantograph: true, power: 720 };

// ---------------------------------------------------------------------------
// The train

export type Regio2nKind = Kind;
export interface Regio2nSlot { kind: Kind; lo: number; hi: number; turned: boolean; pantograph: false | "raised" | "lowered" }

const LENGTH: Record<Kind, number> = REGIO2N_LENGTHS;

/**
 * The cars of an n-car train, front first, centred on x = 0: double-deck and single-deck cars
 * alternating; an even train led by the double-deck end car and closed by the single-deck one (the
 * 6-car "courte", the 8-car "longue"), an odd one with a single-deck end car at each end (the 7-car
 * "moyenne"). Two pantographs on the single-deck cars - the first and the last of them -, the rear
 * one raised.
 */
export function regio2nTrain(n: number): Regio2nSlot[] {
  const even = n % 2 === 0;
  const kinds: Kind[] = Array.from({ length: n }, (_, k): Kind => {
    if (k === n - 1) return "sEnd";
    if (k === 0) return even ? "dEnd" : "sEnd";
    return (k % 2 === 1) === even ? "sMid" : "dMid";
  });
  const singles = kinds.map((kd, k) => (kd === "sMid" || kd === "sEnd" ? k : -1)).filter((k) => k >= 0);
  const [first, last] = [singles[0]!, singles[singles.length - 1]!];
  let hi = kinds.reduce((a, kd) => a + LENGTH[kd], 0) / 2;
  return kinds.map((kind, k) => {
    const lo = hi - LENGTH[kind];
    const slot: Regio2nSlot = { kind, lo, hi, turned: k === n - 1, pantograph: k === last ? "raised" : k === first ? "lowered" : false };
    hi = lo;
    return slot;
  });
}

/** The series and end flag drawing a car kind. */
const seriesOf = (kind: Kind): { s: ShinkansenSeries; end: boolean } =>
  kind === "dEnd" ? { s: REGIO2N_DD, end: true } : kind === "dMid" ? { s: REGIO2N_DMID, end: false } : kind === "sMid" ? { s: REGIO2N_SD, end: false } : { s: REGIO2N_SEND, end: true };

/** The gangways' bellows: wide, from the access floor up past the mezzanine. */
const BELLOWS: Array<[number, number]> = [[-0.95, 0.62], [0.95, 0.62], [0.95, 3.1], [-0.95, 3.1]];
const HINGE_Y = 1.0;
const MAX_BEND = 10;

function drawTrain(m: MeshBuilder, key: string, n: number): MeshBuilder {
  const slots = regio2nTrain(n);
  const sections = slots.map((slot, k) => {
    const cx = (slot.lo + slot.hi) / 2;
    const { s, end } = seriesOf(slot.kind);
    // a car keeps its cab's bogie (an end car) and the joint's bogie behind it; the rear end car only its cab's
    const trucks = [end, !slot.turned];
    const draw = () => drawSeriesCar(m, s, key, { end, pantograph: slot.pantograph === "raised" ? true : slot.pantograph, rear: slot.turned, trucks, inside: [1, -1] });
    const placed = () => m.moved(([x, y, z]) => [x + cx, y, z], draw);
    return {
      x0: slot.lo + SERIES_GAP, x1: slot.hi - (k === 0 ? 0 : SERIES_GAP),
      draw: () => m.scope(`car ${k + 1}`, () => {
        if (slot.turned) m.turned(cx, placed);
        else placed();
        if (k + 1 < slots.length) m.scope("jacobs bogie", () => m.bogie(() => drawSeriesJointBogie(m, s, key, slot.lo), { sections: [k, k + 1] }));
      }),
    };
  });
  articulate({ m }, sections, HINGE_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND, slots.slice(0, -1).map((x) => x.lo));
  return m;
}

function trainLod(key: string, n: number): MeshBuilder {
  const slots = regio2nTrain(n);
  const built = slots.map((slot, k) => {
    const { s, end } = seriesOf(slot.kind);
    return seriesCarLod(s, key, { end, pantograph: slot.pantograph === "raised", cx: (slot.lo + slot.hi) / 2, turned: slot.turned, section: k });
  });
  const palette = Object.assign({}, ...(["dEnd", "dMid", "sMid", "sEnd"] as const).map((kd) => seriesCarPalette(seriesOf(kd).s, key)));
  const sections: LodSections = {
    pivots: slots.map((_, i): [number, number, number] => (i === 0 ? [0, 0, 0] : [slots[i - 1]!.lo, HINGE_Y, 0])),
    joints: slots.slice(0, -1).map((slot, i) => ({ sections: [i, i + 1] as [number, number], front: slot.lo + SERIES_GAP, rear: slots[i + 1]!.hi - SERIES_GAP, profile: BELLOWS })),
    maxBendDeg: MAX_BEND,
  };
  return fitUnit({ palette, bodies: built.map((x) => x.body), parts: built.flatMap((x) => x.parts), sections }, Math.min(500, 100 * n));
}

// ---------------------------------------------------------------------------
// The design

/** The train lengths: two end cars back to back up to the 8-car "longue" (the 10-car XL is longer than the game's eight). */
const CARS = [2, 3, 4, 5, 6, 7, 8];
const UNITS = { endCar: "End car", middleCar: "Middle car", singleDeckCar: "Single-deck car", singleDeckEnd: "Single-deck end", train: "Full train" };

export const REGIO2N_PARAMS: ParamSpec[] = [
  enumParam("unit", "Car", UNITS),
  { ...enumParam("cars", "Cars", Object.fromEntries(CARS.map((k) => [String(k), `${k} cars`]))), default: "4", when: { name: "unit", values: ["train"] } },
  enumParam("livery", "Livery", { ter: "TER", transilien: "Transilien" }),
];

const LONE: Record<string, Kind> = { endCar: "dEnd", middleCar: "dMid", singleDeckCar: "sMid", singleDeckEnd: "sEnd" };
/** A lone car is its series' lone end or intermediate car: the kit's own builder (its lone Jacobs axles, its pantograph). */
const loneValues = (kind: Kind, key: string): ParamValues => ({ unit: seriesOf(kind).end ? "endCar" : "middleCar", livery: key });

export function sncfRegio2n(v?: ParamValues): MeshBuilder {
  const p = resolveParams(REGIO2N_PARAMS, v);
  const key = p.livery!;
  if (p.unit !== "train") {
    const kind = LONE[p.unit!]!;
    return buildSeries(seriesOf(kind).s, KIT_PARAMS, loneValues(kind, key));
  }
  const palette = Object.assign({}, ...(["dEnd", "dMid", "sMid", "sEnd"] as const).map((kd) => seriesCarPalette(seriesOf(kd).s, key)));
  return drawTrain(new MeshBuilder(palette), key, Number(p.cars));
}

export function sncfRegio2nLod(v?: ParamValues): MeshBuilder {
  const p = resolveParams(REGIO2N_PARAMS, v);
  const key = p.livery!;
  if (p.unit !== "train") {
    const kind = LONE[p.unit!]!;
    return buildSeriesLod(seriesOf(kind).s, KIT_PARAMS, loneValues(kind, key));
  }
  return trainLod(key, Number(p.cars));
}

/** The kit's parameters a lone car is built with: the car (end or intermediate) and the livery. */
const KIT_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { endCar: "End car", middleCar: "Middle car" }), enumParam("livery", "Livery", { ter: "TER", transilien: "Transilien" })];

/** Weights (t; about 263 t empty for the 8-car "longue" on 18 axles) and power (kW: 2 x 360 kW a motor bogie, the cab bogies and those under the single-deck cars). */
const WEIGHT: Record<Kind, number> = { dEnd: 40, dMid: 34, sMid: 29, sEnd: 34 };
const POWER: Record<Kind, number> = { dEnd: 720, dMid: 0, sMid: 480, sEnd: 720 };

function game(): GameProperties {
  const variants: NonNullable<GameProperties["variants"]> = [];
  for (const key of ["ter", "transilien"]) {
    const base: ParamValues = key === "ter" ? {} : { livery: key };
    for (const [unit, kind] of Object.entries(LONE)) if (unit !== "endCar") variants.push({ params: { ...base, unit }, weight: WEIGHT[kind], power: POWER[kind] });
    for (const n of CARS) {
      const kinds = regio2nTrain(n).map((x) => x.kind);
      variants.push({ params: { ...(n === 4 ? {} : { cars: String(n) }), ...base, unit: "train" }, weight: kinds.reduce((a, kd) => a + WEIGHT[kd], 0), power: kinds.reduce((a, kd) => a + POWER[kd], 0) });
    }
  }
  return { weight: WEIGHT.dEnd, power: POWER.dEnd, maxspeed: 160, accel: null, variants };
}

export const REGIO2N_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-sncf-regio2n", title: "Regio 2N", build: sncfRegio2n, buildLod: sncfRegio2nLod, params: REGIO2N_PARAMS,
  lodTriangles: 500, game: game(), catalog: EMU_CATALOG, references: "sncf-regio2n",
};
