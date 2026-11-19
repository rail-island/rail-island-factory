// The TGV M (Alstom Avelia Horizon, SNCF classes TGV 22000 / 42000; in service from 2026) on the
// series kit (shinkansen.ts) with its own cab face (seriesCab.ts): a power car at each end - the long,
// raked nose with the white "snout" bumper standing out at its foot, the black mask over the
// windscreen running down the nose's flanks round the slanting oval headlamps into the snout's lip,
// the grey skirt sweeping up from under the snout to the cab door, the D-shaped cab side window, the
// tall cab door, the louvred fairings over the roof's shoulders with the single-arm pantographs in
// the gap between them - and the double-deck trailers between them on Jacobs bogies, as high as the
// power cars (4.318 m): five big upper-deck windows, four lower-deck ones under the last four with a
// frosted panel under the first, and one door low at the rear end with the stair window over it.
// Matched to the photographs in assets/sncf-tgv-m/ (SOURCES.md). See docs/models/france-trains.md.
//
// Scales (assets/sncf-tgv-m/): photo-tgv-m-plouaret.jpg (997, nearly side-on) 39 px/m vertically at
// the nose, 28.7 px/m at the power car's rear end (a 1-D projective fit along the car, the power car
// taken as 18.25 m); photo-tgv-m-998-en-gare-de-poitiers.jpg (the trailers side-on, 29.8 px/m, a
// trailer 185 px joint to joint = 17.7 m); photo-tgv-m-1402-in-tournai-...jpg and
// photo-tgm-m-gare-de-lyon-3-cropped.jpg (the nose and the mask, three-quarter); the inOui scheme
// from photo-2025-08-01-tgv-m-1005-near-la-rochelle.jpg and photo-2026-10-05-...-nancy-02.jpg.
// Published (fr.wikipedia "Avelia Horizon"): 2.904 m wide, 4.318 m high, 11 bodies 202 m (two
// power cars of about 18 m, the trailers 1 m shorter than the Duplex's 18.7 m), Bo'Bo' power cars
// on 920 mm wheels, 7,760 kW under 25 kV, 320 km/h, 413.5 t.
//
// Heights over the rail; d behind the snout's tip on the face (and in `endSweeps`), else d behind
// the body's front end (the face's join on the power car, the coupling gap on a trailer).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ProceduralDesign } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesSidePanel, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { crownPane, type SliceBody } from "./sliceBody.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { block } from "./vehicleParts.ts";
import { insulator, singleArm } from "./czElectricKit.ts";
import { LOD_GLASS } from "./lodKit.ts";

/** Where the face meets the power car's body: the crown reaches its full 4.318 m there. */
const JOIN = 7.2;
/** The crown, the shoulder (the side's top under the roof's arc) and the skirt's top and bottom. */
const C = 4.318;
const S = 3.78;
const A = 0.8;
const B = 0.58;
/** The mask's top over the roof lamp. */
const MASK_TOP = 4.05;

/**
 * The nose's centre line (photo-tgv-m-plouaret.jpg): the snout's upright front 0.65 - 1.35 m up, its
 * top at 1.56 m, the face set back 0.95 m above it and rising at about 25 degrees past the lamps (1.7 - 2.15
 * m) and the windscreen (2.35 - 3.65 m) to the roof lamp at 4.0 m, 5.8 m back, the crown full 7.2 m back.
 */
const PROFILE: Pt[] = [
  [B, 0.22], [0.66, 0.07], [0.76, 0.02], [0.88, 0], [1.0, 0], [1.12, 0], [1.24, 0.01], [1.35, 0.04], [1.43, 0.1], [1.5, 0.2],
  [1.54, 0.36], [1.56, 0.55], [1.58, 0.95], [1.64, 1.02], [1.7, 1.1], [1.86, 1.22], [2.1, 1.52], [2.36, 1.85], [2.65, 2.35], [2.94, 2.9], [3.22, 3.5],
  [3.51, 4.15], [3.78, 4.8], [4.01, 5.45], [4.17, 6.0], [4.27, 6.55], [C, JOIN],
];

/** The grey skirt's top edge on the flanks: from under the snout's rear up to the cab door, then level along the power car. */
const SKIRT_LINE: Pt[] = [[B, 1.9], [0.7, 3.4], [0.8, 5.3], [0.9, 7.5], [1.0, 9.4]];
/**
 * The black mask's rear edge (photo-2025-08-01-...1005..., 997 and 1402): a thin lip on the snout's top
 * edge, then a band down the nose's centre that widens round the windscreen, its lower edge one straight
 * line from the snout's top to over the cab side window (d 0.4 at 1.5 m, d 6.6 at 3.6 m); the flanks
 * under it and the lamps on them white.
 */
const MASK_BACK: Pt[] = [
  [1.5, 0.24], [1.54, 0.42], [1.58, 1.0], [1.7, 1.25], [2.0, 2.0], [2.4, 3.25], [2.8, 4.4], [3.2, 5.55], [3.6, 6.6], [MASK_TOP, 6.85],
];
/** The windscreen's rear edge on the flanks: narrow at its foot, wrapping round the corners at its head. */
const GLASS_BACK: Pt[] = [[2.35, 2.45], [2.6, 3.25], [3.0, 4.15], [3.4, 4.9], [3.65, 5.35]];
/** The oval headlamp slot on each corner, rising toward the rear (front and back edges by height). */
const LAMP_FRONT: Pt[] = [[1.64, 2.0], [1.68, 1.84], [1.76, 1.8], [1.9, 2.05], [2.05, 2.5], [2.2, 3.0], [2.3, 3.5], [2.34, 3.75]];
const LAMP_BACK: Pt[] = [[1.64, 2.0], [1.7, 2.45], [1.82, 3.0], [1.96, 3.5], [2.1, 3.85], [2.24, 4.05], [2.31, 4.02], [2.34, 3.75]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.7, 0.8, 0.9, 1.64, 1.8, 2.0, 2.2, 2.34, 2.4, 2.45, 2.8, 3.0, 3.2, 3.65, 3.9, MASK_TOP])].sort((a, b) => a - b);

/** The plan's corner depth by height: the snout round and narrow, the face above it tapering 2.6 m back to the body's width. */
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d, y < 1.57 ? 1.4 : 2.1))]);

export const TGV_M_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 4.5, reach: 0.07, first: 8.7, roofFrom: 9, cols: [2, 6, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  corner: [[B, 2.0], [C, 2.0]],
  cornerDepth: CORNER_DEPTH,
  rows: ROWS,
  // the leading bogie's wheels show under the flanks behind the snout
  wheelCut: { d: 2.25, y: A },
  bands: () => [[0, 9, "body"]],
  lodBands: [[0, 2.3, "body"], [2.3, MASK_TOP, "mask"], [MASK_TOP, 9, "body"]],
  lodGlass: { hw: 0.9, y: [2.4, 3.6] },
  paint: [
    // the grey skirt under the flanks, rising from under the snout's rear to the cab door
    { mat: "skirtG", front: SKIRT_LINE, back: [[B, 99], [1.0, 99]] },
    // the black mask
    { mat: "mask", front: [[1.5, -9], [MASK_TOP, -9]], back: MASK_BACK, top: MASK_TOP + 0.01 },
    // the windscreen, its foot narrower than its head
    { mat: "cabGlass", front: [[2.35, -9], [3.65, -9]], back: GLASS_BACK, top: 3.66, lat: 1.05 },
    // the headlamps' dark oval glass on the white corners, about 0.9 m long
    { mat: "lampGlass", front: LAMP_FRONT, back: LAMP_BACK },
  ],
  // the two air intakes' grilles between the lamps under the windscreen
  fields: [
    { mat: "intake", pts: [[0.22, 2.12], [0.78, 2.14], [0.74, 2.27], [0.24, 2.28]] },
    { mat: "intake", pts: [[-0.24, 2.28], [-0.74, 2.27], [-0.78, 2.14], [-0.22, 2.12]] },
  ],
  panes: [
    // the roof lamp's long window over the windscreen
    { lat: [-0.32, 0.32], y: [3.9, 4.0], r: 0.05, mat: "lampGlass" },
  ],
  lamps: [[1.22, 1.95, 0.07, "lampHead"], [-1.22, 1.95, 0.07, "lampHead"], [0, 3.95, 0.04, "lampHead"]],
  wipers: [[[-0.1, 2.45], [-0.75, 3.15]]],
  lod: {
    profile: PROFILE, corner: [[B, 2.0], [C, 2.0]], rows: [B, 0.88, 1.24, 1.5, 1.56, 1.58, 1.86, 2.36, 2.94, 3.51, 4.01, 4.27, C],
    cornerDepth: [[B, 1.4], [1.56, 1.4], [1.58, 2.1], [3.51, 2.1], [4.01, 1.75], [4.27, 0.65], [C, 0.05]],
  },
};

/** The cab's side window: its rear edge upright, its front bulging forward under the mask's edge (a "D"), in a black rubber frame. */
const SIDE_WINDOW: NonNullable<ShinkansenLivery["endSweeps"]> = [
  { mat: "rubber", front: [[2.41, 7.13], [2.56, 6.86], [2.85, 6.7], [3.08, 6.8], [3.24, 7.08]], back: [[2.41, 7.74], [2.49, 7.94], [3.15, 7.94], [3.24, 7.78]] },
  { mat: "glass", front: [[2.45, 7.17], [2.6, 6.91], [2.85, 6.75], [3.05, 6.84], [3.2, 7.1]], back: [[2.45, 7.7], [2.52, 7.9], [3.12, 7.9], [3.2, 7.75]] },
];

/** The power car's paint behind the face: the skirt line's white over the grey band, the cab window. */
const POWER_SWEEPS: NonNullable<ShinkansenLivery["endSweeps"]> = [
  { mat: "body", front: [[A, -9], [1.0, -9]], back: SKIRT_LINE.filter(([y]) => y >= 0.8) },
  ...SIDE_WINDOW,
];

/** The cab door, d behind the tip: the kit's leaf up to the trailers' door head, its tall frame outlined above it to 3.62 m. */
const CAB_DOOR: readonly [number, number] = [8.7, 9.5];
const POWER_PANELS: SeriesSidePanel[] = [{ d: CAB_DOOR, y: [2.68, 3.62], kind: "seam" }];

interface TgvMPaint {
  body: string; skirt: string; under: string; roof: string; door: string;
  /** Pale grey facets on the power car's sides, [d behind the body's front, y] corners. */
  facets?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  /** The trailers' side bands, bottom first. */
  trailer: Array<[number, number, string]>;
  extra: Record<string, string>;
}

function tgvMLivery(title: string, number: string, p: TgvMPaint, lettering: NonNullable<ShinkansenLivery["endLettering"]>): ShinkansenLivery {
  return {
    title, number,
    palette: {
      body: c(p.body, 0.35), skirtG: c(p.skirt, 0.55), skirtE: c(p.under, 0.7), roofG: c(p.roof, 0.5), doorPaint: c(p.door, 0.4),
      mask: c("#14171b", 0.2), lampGlass: c("#262b31", 0.12), intake: c("#3a3f45", 0.6), cabGlass: { ...c("#2f4152", 0.08), glass: true }, seam: c("#9a9fa5", 0.6),
      frosted: c("#b9c2c9", 0.3), grilleFrame: c("#c9cdd1", 0.5), grilleSlat: c("#555b62", 0.6), cabMask: c("#14171b", 0.3),
      ...Object.fromEntries(Object.entries(p.extra).map(([k, v]) => [k, c(v, 0.4)])),
    },
    bands: p.trailer, endBands: [[0, 1.0, "skirtG"], [1.0, 9, "body"]], roof: "roofG", skirt: "skirtE",
    doors: [[0, 9, "doorPaint"]],
    endSweeps: POWER_SWEEPS,
    endLettering: lettering,
    ...(p.facets ? { sideFields: { end: p.facets } } : {}),
    // the power car's cab door in the body's paint, the trailers' doors in the livery's
    endCarDoors: [[0, 9, "body"]],
    // the distant model's upper deck: its window band over the five big windows
    lodSideFields: { middle: [{ d: [UPPER[0]![0], UPPER[4]![1]], bands: [...p.trailer.filter(([y0]) => y0 < 2.95).map(([y0, y1, mt]): [number, number, string] => [y0, Math.min(y1, 2.95), mt]), [2.95, 3.66, LOD_GLASS], [3.66, 9, p.trailer[p.trailer.length - 1]![2]]] }] },
  };
}

/** SNCF's inOui scheme on the TGV M (1005): pale silver, the grey skirt, the black mask, carmine doors and the carmine inOui name. */
const INOUI: TgvMPaint = {
  body: "#e7e9ea", skirt: "#8e9399", under: "#4d5257", roof: "#d4d7d9", door: "#a3173a",
  trailer: [[0, 0.95, "skirtG"], [0.95, 9, "body"]],
  // the grey facet over the power car's rear half (photo-2025-08-01-...1005...), its front edge leaning back from the skirt line to the roof
  facets: [{ mat: "facet", pts: [[6.4, 3.74], [10.7, 3.74], [10.7, 1.02], [9.4, 1.02]] }],
  extra: { carmine: "#a3173a", facet: "#d2d5d8" },
};

/** Ouigo on the TGV M, after the Ouigo Duplex sets (no TGV M in Ouigo colours has run yet): sky blue, the navy skirt, a magenta line between the decks, magenta doors. */
const OUIGO: TgvMPaint = {
  body: "#21a6d8", skirt: "#26367a", under: "#26367a", roof: "#f4f6f7", door: "#e0115f",
  trailer: [[0, 0.95, "skirtG"], [0.95, 2.35, "body"], [2.35, 2.43, "magenta"], [2.43, 9, "body"]],
  extra: { magenta: "#e0115f", white: "#f4f6f7" },
};

/** A single door leaf with a narrow window, sliding toward the car's front. */
const leaf = (d0: number, w = 1.1): readonly [number, number, number] => [d0, d0 + w, -1];

/**
 * A trailer's sides (photo-tgv-m-998-...poitiers.jpg, photo-tgv-m-plouaret.jpg), d behind the body's
 * front end (the joint toward the leading power car): five big windows on the upper deck from 1.5 m,
 * 2.18 m apart; four on the lower deck under the last four, a frosted panel under the first; the door
 * low at the rear end, 2.6 m inside the joint, and the stair landing's small upper window behind it.
 */
const UPPER = Array.from({ length: 5 }, (_, i): readonly [number, number] => [1.25 + i * 2.18, 1.25 + i * 2.18 + 1.92]);
const LOWER = UPPER.slice(1).map(([a, e]): readonly [number, number] => [a + 0.12, e - 0.12]);
const TRAILER_DOOR = 13.35;

export const TGV_M: ShinkansenSeries = {
  // power car 18.25 m over its coupler (18 m body, fr.wikipedia), trailers 17.7 m joint to joint; 2.904 m wide, 4.318 m high
  endLength: 18.25, midLength: 17.7, W: 1.452, Y: 0.92, S, C, lean: 0.975, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: TGV_M_FACE,
  // the double-deck rows: the lower deck's low windows, the upper deck's under the shoulder
  windows: [[1.0, 1.7], [2.95, 3.66]], windowW: 1.8, pitch: 2.18, windowCornerR: 0.12,
  // the single door leaf low at the trailer's rear end, its narrow window
  door: [0.84, 2.62, 1.2, 2.3], doorW: 1.1, doorGlassW: 0.26, doorGlassR: 0.06,
  layout: {
    end: { doors: [], windows: [] },
    middle: { doors: [leaf(TRAILER_DOOR)], windows: LOWER, rows: [LOWER, [...UPPER, [15.45, 16.2]]] },
  },
  // the power car: no passenger windows, the cab door behind the cab side window
  endSides: { windows: [], doors: [[CAB_DOOR[0] - JOIN, CAB_DOOR[1] - JOIN]] },
  sidePanels: {
    end: POWER_PANELS,
    middle: [{ d: [UPPER[0]![0] + 0.12, UPPER[0]![1] - 0.12], y: [1.0, 1.7], kind: "panel", mat: "frosted" }],
  },
  // Bo'Bo' power car: bogies 10.7 m apart, the leading one under the cab 4.5 m behind the tip; 3.0 m wheelbase, 920 mm wheels
  bogieCentres: 10.7, wheelR: 0.46, wheelbase: 3.0,
  endBogies: [4.5 - JOIN, 15.2 - JOIN],
  // the pantograph of the trailing power car raised, in the gap between the roof's fairings
  endPantograph: "trail", pantographAt: 11.6 - JOIN,
  // the trailers on Jacobs bogies, the end ones on their own bogie 2.3 m inside the end beside the power car
  jacobsTrailers: 2.3,
  fittings: tgvMFittings,
  liveries: {
    inoui: tgvMLivery("TGV inOui", "1005", INOUI, [
      { text: "inOui", d: 11.9 - JOIN, y: 1.85, h: 0.95, mat: "carmine" },
    ]),
    ouigo: tgvMLivery("Ouigo", "1403", OUIGO, [
      { text: "OUIGO", d: 11.9 - JOIN, y: 2.1, h: 0.5, mat: "white" },
    ]),
  },
  // per car for the kit; the design's game figures are set by tgvMGame
  weight: { end: 62, middle: 32 }, power: 3880, maxspeed: 320,
};

/** The louvred fairings over the roof's shoulders (d behind the tip): ahead of and behind the pantographs' gap. */
const FAIRINGS: ReadonlyArray<readonly [number, number]> = [[8.0, 10.9], [12.4, 14.3], [15.9, 17.7]];

/** The underfloor equipment; on a power car the snout's chin, the roof's fairings and the second, folded pantograph. */
function tgvMFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const tr = car.trucks;
  const [u0, u1] = [tr[0]! + 2.3, tr[1]! - 2.3];
  if (u1 > u0 + 0.5) m.scope("underfloor", () => block(m, "under", Math.min(X(u0), X(u1)), Math.max(X(u0), X(u1)), B - 0.28, B, -TGV_M.W * 0.8, TGV_M.W * 0.8));
  if (!car.end) return;
  m.scope("roof fairings", () => {
    for (const sd of [1, -1]) for (const [d0, d1] of FAIRINGS) {
      const [a, e] = [d0 - JOIN, d1 - JOIN];
      crownPane(m, b, X, sd, "grilleFrame", [a, e], [0.62, 1.36], 0.004);
      for (let k = 0; k < 7; k++) crownPane(m, b, X, sd, "grilleSlat", [a + 0.08, e - 0.08], [0.68 + k * 0.095, 0.7 + k * 0.095], 0.008);
    }
  });
  m.scope("snout chin", () => {
    // rings round the snout's foot in plan (x, z), d behind the tip, its front rounded
    const ring = (front: number, back: number, hw: number, depth: number): Array<[number, number]> => {
      const pts: Array<[number, number]> = [];
      for (let i = 0; i <= 8; i++) {
        const a = -Math.PI / 2 + (Math.PI * i) / 8;
        pts.push([X(-JOIN + front + depth * (1 - Math.cos(a))), hw * Math.sin(a)]);
      }
      pts.push([X(-JOIN + back), hw], [X(-JOIN + back), -hw]);
      const area = pts.reduce((acc, p, i) => { const q = pts[(i + 1) % pts.length]!; return acc + p[0] * q[1] - q[0] * p[1]; }, 0);
      return area > 0 ? pts.reverse() : pts;
    };
    m.loft("body", ring(0.34, 2.1, 0.94, 0.8), 0.4, ring(0.24, 2.1, 1.04, 0.8), B + 0.005);
    m.loft("skirtE", ring(1.0, 2.2, 0.8, 0.6), 0.36, ring(0.34, 2.1, 0.94, 0.8), 0.4, false);
  });
  // the second pantograph (the other current), folded behind the raised one
  m.scope("folded pantograph", () => {
    const x = X(15.1 - JOIN);
    block(m, "roofG", x - 1.0, x + 1.0, C - 0.06, C + 0.04, -0.75, 0.75);
    singleArm(m, { xc: x, roofY: C + 0.04, baseY: C + 0.29, h: 1, raised: false });
    insulator(m, X(13.7 - JOIN), 0.2, C - 0.04, C + 0.2);
  });
}

const FIRST_FIGURES = { endWeight: 62, midWeight: 32, power: 3880 };

/**
 * The game's figures (fr.wikipedia): a power car 62 t and 3,880 kW (half the train's 7,760 kW
 * under 25 kV), a trailer 32 t and unpowered; a train two power cars and its trailers (413.5 t for
 * eleven bodies). The series kit counts every car as motored, so its figures are replaced here.
 */
export function tgvMGame(d: ProceduralDesign): ProceduralDesign {
  const g = d.game;
  if (!g) return d;
  const f = FIRST_FIGURES;
  const variants = (g.variants ?? []).map((v) => {
    const p = v.params as Record<string, string>;
    if (p.unit === "middleCar") return { ...v, weight: f.midWeight, power: 0 };
    if (p.unit === "train") {
      const n = Number(p.cars ?? "4");
      return { ...v, weight: 2 * f.endWeight + (n - 2) * f.midWeight, power: 2 * f.power };
    }
    return v;
  });
  return { ...d, game: { ...g, weight: f.endWeight, power: f.power, maxspeed: TGV_M.maxspeed, variants } };
}
