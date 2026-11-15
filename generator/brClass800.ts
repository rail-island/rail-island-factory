// The Class 800 IET (Hitachi AT300, GWR and LNER Azuma) on the series kit (shinkansen.ts), with its own cab
// face (seriesCab.ts): the Hitachi nose - the yellow coupler cover standing out as a bullet under the lamps,
// the long raked windscreen, the lamp clusters at the face's corners - matched to the photographs and the
// side drawing in assets/br-class-800/ (SOURCES.md). Registered in ukUnits.ts. See docs/models/uk-trains.md.
//
// Heights over the rail, d behind the tip (the coupler cover's front, 1.0 m up). The driving cars are
// 25.85 m over the couplers, the intermediate cars 26.0 m, 2.7 m wide (Hitachi Review 63 (2014) via
// en.wikipedia); the layout along the cars is measured on the side drawing (photo-gwr-class-800-0.jpg,
// 9.73 px/m on a 26 m car), the heights and the nose on the photographs.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the cab face meets the body, behind the tip: the roof at full height there, the cab door just behind. */
const JOIN = 4.0;
const END_LENGTH = 25.85;
const MID_LENGTH = 26.0;
/** The kit's body of an intermediate car. */
const MID_BODY = MID_LENGTH - 0.5;

/** The window row (sill and head) and the band painted round it (LNER's red), the doors' sill and head. */
const WIN: readonly [number, number] = [2.12, 2.76];
const BAND: readonly [number, number] = [1.98, 2.88];
const DOOR_W = 0.9;

/**
 * The nose's centre line beside the coupler cover (photo-british-rail-class-800-gwr-kentish-town-west, head
 * on, 270 px/m at the cover; photo-edinburgh-...-800108 and the side drawing for d): the face 0.16 m behind
 * the cover's front low down, rising past the lamps to the yellow panel and the windscreen's foot at 2.3 m,
 * 0.95 m back; the glass raked about 28 degrees to its head at 3.2 m, 2.7 m back; the cab roof rounding to
 * the 3.65 m crown at the join, 4.0 m back (the drawing's cab door 4.1 m behind the tip). The cover itself
 * stands out of this surface (`reshape`, POD).
 */
const PROFILE: Pt[] = [
  [0.67, 0.48], [0.82, 0.26], [1.0, 0.16], [1.24, 0.18], [1.5, 0.3], [1.7, 0.42], [1.86, 0.5], [2.05, 0.66], [2.3, 0.95],
  [2.6, 1.45], [2.9, 2.0], [3.2, 2.7], [3.4, 3.15], [3.55, 3.55], [3.65, JOIN],
];

/** The plan: rounded right across (the corner is the whole half width), reaching full width this far behind the face line by height. */
const DEPTH: Pt[] = [[0.67, 3.0], [1.0, 3.1], [1.5, 2.9], [2.0, 2.5], [2.3, 2.3], [2.9, 1.7], [3.2, 1.2], [3.4, 0.75], [3.65, 0.05]];

/**
 * The coupler cover standing out of the face as a rounded pod (head on: 1.84 m across at its widest, two
 * thirds of the face, from the nose's foot to its arched top at 1.86 m, 0.6 of the face's height under the
 * windscreen), its front 0.16 m proud; and the snout drawn to a point in plan (the flanks a parabola behind
 * the centre line, 0.3 m deeper at the corners up to the windscreen's foot, none at the roof).
 */
const POD = { lat: 0.92, y: 1.24, h: 0.62, proud: 0.16 };
const vee = (y: number): number => (y <= 2.3 ? 0.3 : y >= 3.3 ? 0 : 0.3 * (3.3 - y));
function c800Reshape(lat: number, y: number, d: number): number {
  const r = Math.pow(lat / POD.lat, 2.4) + Math.pow(Math.abs(y - POD.y) / POD.h, 2.4);
  const pod = r < 1 ? POD.proud * Math.sqrt(1 - r) : 0;
  return Math.max(0, d + vee(y) * (lat / 1.35) ** 2 - pod);
}

/** A shape on the other side (seen from ahead). */
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** The cover's yellow front: its arched top, then its sides (inside the pod's flanks, LNER red, GWR green) narrowing to its foot. */
const CONE_HALF: Pt[] = [[0, 1.86], [0.42, 1.83], [0.66, 1.76], [0.74, 1.7], [0.68, 1.4], [0.6, 1.1], [0.5, 0.86], [0.36, 0.71], [0, 0.68]];
const CONE: Pt[] = [...CONE_HALF.slice(0, -1).reverse().map(([l, y]): Pt => [-l, y]), ...CONE_HALF].reverse();
/** The yellow panel under the windscreen, between the lamp clusters. */
const PANEL: Pt[] = [[-0.74, 1.7], [0.74, 1.7], [0.8, 2.31], [-0.8, 2.31]];
/** A lamp cluster's black housing on the flank beside the cover's top, angled outward. */
const LAMP: Pt[] = [[0.72, 1.76], [1.06, 1.66], [1.25, 1.84], [1.21, 2.2], [0.8, 2.26]];
/** The windscreen: its black surround and the glass, a trapezoid narrower at the head, its corners rounded. */
const SURROUND: Pt[] = [[-0.88, 2.29], [0.88, 2.29], [0.9, 2.42], [0.82, 3.0], [0.7, 3.22], [-0.7, 3.22], [-0.82, 3.0], [-0.9, 2.42]];
const GLASS: Pt[] = [[-0.8, 2.36], [0.8, 2.36], [0.82, 2.47], [0.74, 2.98], [0.64, 3.15], [-0.64, 3.15], [-0.74, 2.98], [-0.82, 2.47]];
/** The headcode light's box on the cab roof over the windscreen. */
const MARKER: Pt[] = [[-0.16, 3.33], [0.16, 3.33], [0.13, 3.46], [-0.13, 3.46]];

/** A thin strip from a to b, w wide (a decal's quad). */
const strip = (a: Pt, b: Pt, w: number): Pt[] => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]], k = w / 2 / Math.hypot(dx, dy);
  const [nx, ny] = [-dy * k, dx * k];
  return [[a[0] + nx, a[1] + ny], [a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny]];
};
/** The seam over the cover's arch, and its split down the middle (the coupler's flaps). */
const SEAM: Pt[][] = CONE_HALF.slice(1, 4).map((p, i) => strip(CONE_HALF[i]!, p, 0.018));
const SEAMS: Pt[][] = [...SEAM, ...SEAM.map(mirror), strip([0, 0.72], [0, 1.85], 0.014)];
/** The rim between the yellow and the cover's flanks, 3.5 cm out (LNER's white line; the GWR's is the cover's own yellow). */
const RIM_HALF: Pt[] = CONE_HALF.slice(3).map(([l, y]): Pt => [l + (l > 0.3 ? 0.035 : 0), y - (l < 0.45 ? 0.035 : 0)]);
const RIM: Pt[][] = RIM_HALF.slice(1).map((p, i) => strip(RIM_HALF[i]!, p, 0.04));
const RIMS: Pt[][] = [...RIM, ...RIM.map(mirror)];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.75, 0.91, 1.12, 1.37, 1.62, 1.78])].sort((a, b) => a - b);

/** The cab side window (black-framed tinted glass), its front parallel to the windscreen's side, its foot rising to the rear. */
const CABWIN_FRONT: Pt[] = [[2.38, 2.65], [3.0, 3.35]];
const CABWIN_BACK: Pt[] = [[2.38, 2.7], [2.6, 3.8], [3.0, 3.8]];

export const C800_FACE: SeriesCabFace = {
  dJoin: JOIN, reach: 0.07, first: 4.05, roofFrom: 9, cols: [1, 9, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  corner: [[0.67, 2.0], [3.65, 2.0]],
  cornerDepth: PROFILE.map(([y, d]): Pt => {
    let k = DEPTH[DEPTH.length - 1]![1];
    for (let i = 1; i < DEPTH.length; i++) if (y <= DEPTH[i]![0]) { const [a, b] = [DEPTH[i - 1]!, DEPTH[i]!]; k = a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); break; }
    return [y, Math.max(0.05, Math.min(JOIN - d - 0.35, k))];
  }),
  rows: ROWS,
  reshape: c800Reshape,
  // the face takes the side's bands (the line under the windows, the cantrail line); its paint is drawn over them
  bands: (l) => l.bands,
  lodBands: [[0, 2.3, "noseYellow"], [2.3, 9, "body"]],
  lod: { profile: PROFILE.map(([y, d]): Pt => [y, y < 1.86 ? Math.max(0, d - 0.16) : d]), corner: [[0.67, 2.0], [3.65, 2.0]], rows: [0.67, 1.0, 1.5, 1.86, 2.3, 2.9, 3.4, 3.65], cornerDepth: [[0.67, 2.8], [1.0, 3.0], [1.86, 2.6], [2.3, 2.3], [2.9, 1.6], [3.4, 0.5], [3.65, 0.05]] },
  lodGlass: { hw: 0.8, y: [2.36, 3.15] },
  paint: [
    // the cover's flanks and the lower nose round it (LNER red, GWR green), back along the foot to the leading bogie
    { mat: "flank", front: [[0.67, -9], [1.8, -9]], back: [[0.67, 3.3], [0.95, 3.2], [1.3, 2.5], [1.6, 1.9], [1.8, 1.5]], top: 1.8 },
    // the cab side window, dark tinted glass
    { mat: "cabGlass", front: CABWIN_FRONT, back: CABWIN_BACK, top: 3.0 },
  ],
  fields: [
    { mat: "noseYellow", pts: CONE },
    { mat: "noseYellow", pts: PANEL },
    { mat: "cabMask", pts: SURROUND },
    { mat: "cabGlass", pts: GLASS },
  ],
  panes: [],
  decals: [
    ...SEAMS.map((pts) => ({ mat: "seam", pts, fine: 1 })), ...RIMS.map((pts) => ({ mat: "rim", pts, fine: 1 })),
    { mat: "cabMask", pts: LAMP, fine: 3 }, { mat: "cabMask", pts: mirror(LAMP), fine: 3 }, { mat: "markerBox", pts: MARKER, fine: 2 },
  ],
  lamps: [
    [0.88, 1.98, 0.09, "lampHead"], [1.07, 1.93, 0.08, "lampHead"], [1.13, 2.1, 0.035, "lampRed"],
    [-0.88, 1.98, 0.09, "lampHead"], [-1.07, 1.93, 0.08, "lampHead"], [-1.13, 2.1, 0.035, "lampRed"],
  ],
  roofLamp: [0, 3.4, 0.045],
  // the one long wiper, parked from the screen's foot up its left side (seen from ahead)
  wipers: [[[0.06, 2.4], [-0.66, 2.98]]],
};

type Paints = Record<string, ReturnType<typeof c>>;

/** The paints the face and the fittings name, by livery. */
function palette(body: string, extra: Paints): Paints {
  return {
    body: c(body), noseYellow: c("#f6c52a", 0.45), cabMask: c("#17191b", 0.3), seam: c("#3b3a30", 0.5),
    markerBox: c("#202224", 0.3), skirtG: c("#55595c", 0.7), underG: c("#7c8185", 0.6), roofBox: c("#8e9397", 0.55), louvre: c("#2b2e31", 0.6),
    ...extra,
  };
}

/** GWR (800 011, the Steventon photograph): Brunswick-type dark green all over, the gold cantrail line, the yellow cover and panel. */
const GWR: ShinkansenLivery = {
  title: "GWR green", number: "800 011",
  palette: palette("#13342a", {
    line: c("#c98c4c", 0.4), flank: c("#13342a"), rim: c("#0c211a", 0.4), winBand: c("#13342a"),
    roofG: c("#a9aeb1", 0.5), black: c("#121416", 0.35), lettering: c("#c9a35c", 0.4), logo: c("#d8dcd6", 0.4),
  }),
  bands: [[0, 3.23, "body"], [3.23, 3.265, "line"], [3.265, 9, "body"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the black round the cab side window, from the windscreen's side back to the cab door
    { mat: "black", front: [[2.1, 2.0], [2.6, 2.4], [3.15, 3.1]], back: [[2.1, 2.3], [2.3, 3.95], [3.15, 3.95]], top: 3.15, face: true },
  ],
  endLettering: [{ text: "GWR", d: 6.25 - JOIN, y: 2.25, h: 0.42, mat: "logo" }],
};

/** LNER Azuma (800 108, the Edinburgh photograph): white, the red window band and the red sweep over the cab side, the grey line under them, the red lower nose, the black cab roof. */
const AZUMA: ShinkansenLivery = {
  title: "LNER Azuma", number: "800 108",
  palette: palette("#f1f1ee", {
    red: c("#c8102e", 0.4), grey: c("#a3a8ab", 0.4), line: c("#e0652c", 0.4), flank: c("#c8102e", 0.4), rim: c("#f1f1ee"),
    winBand: c("#c8102e", 0.4), roofG: c("#6b7074", 0.5), capBlack: c("#1b1d1f", 0.3), lettering: c("#3a3c40"), logo: c("#f1f1ee", 0.4), azumaGold: c("#8a5a1c", 0.4),
  }),
  bands: [[0, 1.88, "body"], [1.88, BAND[0], "grey"], [BAND[0], 3.23, "body"], [3.23, 3.265, "line"], [3.265, 9, "body"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the red sweep: up the cab side from the lamp beside the windscreen to the cantrail, back to the passenger door
    { mat: "red", front: [[BAND[0], 2.1], [2.6, 2.6], [3.2, 3.3]], back: [[BAND[0], 7.45], [3.2, 7.45]], top: 3.2, face: true },
  ],
  // the black cab roof over the windscreen, its edge falling back to the cantrail line at the join
  faceFields: [{ mat: "capBlack", pts: [[-1.4, 3.21], [1.4, 3.21], [1.4, 3.7], [-1.4, 3.7]] }],
  endLettering: [{ text: "LNER", d: 6.2 - JOIN, y: 2.3, h: 0.42, mat: "logo" }],
};

/** Windows n of them w wide, `pitch` apart, the first starting at d0 (body d). */
const windowRow = (d0: number, n: number, pitch: number, w: number): Array<readonly [number, number]> =>
  Array.from({ length: n }, (_, k) => [d0 + k * pitch, d0 + k * pitch + w] as const);

/** Doors (body d): the end car's cab door and passenger door behind the cab and the one at its inner end; an intermediate car's near both ends. */
const END_DOORS: Array<readonly [number, number, number]> = [[4.05 - JOIN, 4.05 - JOIN + 0.8, 1], [7.45 - JOIN, 7.45 - JOIN + DOOR_W, 1], [21.95 - JOIN, 21.95 - JOIN + DOOR_W, -1]];
const MID_DOORS: Array<readonly [number, number, number]> = [[1.8, 1.8 + DOOR_W, 1], [MID_BODY - 1.8 - DOOR_W, MID_BODY - 1.8, -1]];
/** The window band's spans (body d), between the doors behind the passenger door. */
const BANDS = { end: [END_DOORS[1]![1], END_DOORS[2]![0]], middle: [MID_DOORS[0]![1], MID_DOORS[1]![0]] };

/** A rounded box on the roof: a frustum from len by 2 hw at the roof to its top, h high (an air-conditioning unit, the equipment cover). */
function roofBox(m: MeshBuilder, x0: number, x1: number, C: number, hw: number, h: number, mat: string): void {
  const len = Math.abs(x1 - x0), x = (x0 + x1) / 2;
  const ring = (l: number, w: number): Array<[number, number]> => {
    const r = Math.min(w * 0.6, l / 2 - 0.01), k = 3, out: Array<[number, number]> = [];
    for (const [cx, cz, a0] of [[l / 2 - r, -(w - r), -90], [l / 2 - r, w - r, 0], [-(l / 2 - r), w - r, 90], [-(l / 2 - r), -(w - r), 180]] as const)
      for (let j = 0; j <= k; j++) { const a = ((a0 + (90 * j) / k) * Math.PI) / 180; out.push([x + cx + r * Math.cos(a), cz + r * Math.sin(a)]); }
    return out.reverse();
  };
  m.loft(mat, ring(len, hw), C - 0.06, ring(len - 0.5, hw - 0.12), C + h);
}

/** The window band (painted in the livery's `winBand`), the roof equipment and the underframe's equipment. */
function c800Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [d0, d1] = car.end ? BANDS.end : BANDS.middle;
  m.scope("window band", () => { for (const sd of [1, -1]) sidePanel(m, b, X, sd, "winBand", d0! + 0.06, d1! - 0.06, BAND[0], BAND[1], 0.003, 0.003); });
  const C = 3.65;
  m.scope("roof equipment", () => {
    if (car.end) {
      // the long equipment cover from behind the cab (side drawing: 5.4 - 19.3 m behind the tip), its louvres
      roofBox(m, X(5.4 - JOIN), X(19.3 - JOIN), C, 0.82, 0.13, "roofBox");
      for (const d of [8.0, 12.4, 16.6]) block(m, "louvre", X(d - JOIN + 0.6), X(d - JOIN - 0.6), C + 0.13, C + 0.135, -0.45, 0.45);
    } else {
      // the two air-conditioning units, 2.4 - 7.2 m from each end
      for (const [a, e] of [[2.15, 6.95], [car.length - 6.95, car.length - 2.15]] as const) {
        roofBox(m, X(a), X(e), C, 0.8, 0.14, "roofBox");
        block(m, "louvre", X((a + e) / 2 + 1.2), X((a + e) / 2 - 1.2), C + 0.14, C + 0.145, -0.42, 0.42);
      }
    }
  });
  // the underframe between the bogies: the transformer on a driving car, a generator unit on the others,
  // grey covers with their louvre grilles (on the skirt)
  m.scope("underframe", () => {
    const [t0, t1] = car.trucks as [number, number];
    block(m, "underG", X(t0 + 2.2), X(t1 - 2.2), 0.45, 0.68, -1.0, 1.0);
    const grilles: Array<readonly [number, number]> = car.end ? [[t0 + 4.0, t0 + 4.9], [t0 + 9.0, t0 + 9.5]] : [[t0 + 3.2, t0 + 4.4], [t0 + 7.6, t0 + 8.2], [t0 + 10.8, t0 + 12.0]];
    for (const sd of [1, -1]) for (const [a, e] of grilles) {
      const n = Math.max(2, Math.round((e - a) / 0.12));
      for (let i = 0; i < n; i++) sidePanel(m, b, X, sd, "louvre", a + ((e - a) * i) / n + 0.02, a + ((e - a) * (i + 1)) / n - 0.02, 0.66, 0.98, 0.004, 0.003);
    }
  });
}

export const C800: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W: 1.35, Y: 1.45, S: 3.3, C: 3.65, lean: 0.96, B: 0.67, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: C800_FACE,
  windows: [WIN], windowW: 1.44, pitch: 1.98, door: [1.12, 3.15, 2.1, 2.95], doorW: DOOR_W, doorGlassW: 0.2,
  layout: {
    // the driving car (the drawing's first-class DPTF): the cab door, the GWR / LNER panel, the passenger door, six windows
    // 1.92 m apart from 9.75 m behind the tip, the door 3.0 m from the inner end
    end: { doors: END_DOORS, windows: windowRow(9.75 - JOIN, 6, 1.92, 1.44) },
    // an intermediate car: nine windows 1.98 m apart between the doors 1.8 m in from each body end
    middle: { doors: MID_DOORS, windows: windowRow((MID_BODY - (8 * 1.98 + 1.44)) / 2, 9, 1.98, 1.44) },
  },
  // the drawing: the leading bogie 5.0 m behind the tip, the others 5.0 m in from the coupling planes (16.0 m centres)
  endBogies: [5.0 - JOIN, END_LENGTH - 0.07 - 4.9 - JOIN], midBogies: [4.75, MID_BODY - 4.75],
  bogieCentres: 16.0, wheelR: 0.43, wheelbase: 2.6,
  // the pantograph on each driving car's inner end, 3.55 m from its coupling plane (the Taunton photograph);
  // the leading one raised (the Steventon photograph), the rear one folded
  endPantograph: true, trailingLowered: true, pantographD: END_LENGTH - 3.55,
  fittings: c800Fittings,
  cars: [5, 8],
  liveries: { gwr: GWR, azuma: AZUMA },
  weight: { end: 50, middle: 45 }, power: 700, maxspeed: 200,
};
