// Swiss units on the series kit (shinkansen.ts): the RAe TEE II, the "Roter
// Pfeil" railcar, the tilting ICN, the Giruno, the FV-Dosto, SBB's FLIRT and
// KISS (the Stadler bases, seriesHelpers.ts) and the Rhaetian Railway's
// metre-gauge Allegra. See docs/models/switzerland-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshCore.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type SeriesLayout, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flirt, kiss, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { Pt } from "./sliceLoft.ts";
import { arrowFittings } from "./roterPfeil.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { pilotPlate } from "./carbodyKit.ts";
import { singleArm } from "./czElectricKit.ts";

const SBB_RED = "#eb0000";

/** SBB's and the Rhaetian Railway's schemes: white with the red and grey bands, the TEE, the RhB red. */
export function chLivery(kind: "sbb" | "sbbRegio" | "tee" | "gottardo" | "rhb" | "redArrow", number: string): ShinkansenLivery {
  const pal = (p: Record<string, string>) => ({ roofG: c("#9aa0a5", 0.6), skirtG: c("#3a3d40", 0.75), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, c(v)])) });
  switch (kind) {
    case "sbb": return { title: "SBB", number, palette: pal({ white: "#f1f1ee", grey: "#4d5257", red: SBB_RED }), bands: [[0, 1.3, "grey"], [1.3, 1.42, "red"], [1.42, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "sbbRegio": return { title: "SBB Regio", number, palette: pal({ white: "#f1f1ee", red: SBB_RED, grey: "#4d5257" }), bands: [[0, 1.25, "grey"], [1.25, 1.45, "red"], [1.45, 9, "white"]], roof: "roofG", skirt: "skirtG" };
    case "tee": return { title: "TEE", number, palette: pal({ red: "#8a1c2b", beige: "#e3d3a6" }), bands: [[0, 1.85, "red"], [1.85, 2.9, "beige"], [2.9, 9, "red"]], roof: "roofG", skirt: "skirtG" };
    case "gottardo": return { title: "Gottardo grey", number, palette: pal({ grey: "#9aa0a5", red: SBB_RED, dark: "#4d5257" }), bands: [[0, 1.85, "dark"], [1.85, 1.95, "red"], [1.95, 9, "grey"]], roof: "roofG", skirt: "skirtG" };
    case "rhb": return { title: "RhB red", number, palette: pal({ red: "#c8102e", white: "#f1f1ee", grey: "#4d5257" }), bands: [[0, 1.3, "grey"], [1.3, 9, "red"]], roof: "roofG", skirt: "skirtG" };
    case "redArrow": return { title: "Red Arrow", number, palette: { ...pal({ red: "#c8102e", cream: "#e6dcc0" }), roofS: c("#a9adb0", 0.45) }, bands: [[0, 9, "red"]], roof: "roofS", skirt: "skirtG" };
  }
}

/**
 * The RAe TEE II's two schemes (photo-sbb-rae-tee-ii-silenen-erstfeld.jpg, photo-raeteeairolo.jpg,
 * photo-ffs-rae-tee-ii-1053-satigny-150414.jpg; photo-graue-maus-in-bern.jpg and the Zurich Comet
 * photograph for the grey): the TEE's crimson below the window sills and beige above, up to a grey
 * roof, aluminium doors; the RABe EC's "Graue Maus" grey below a white line, dark grey round the
 * windows and the windscreen, a white line over them and light grey above.
 */
const TEE_PALETTE = { roofG: c("#8f9499", 0.55), alu: c("#b8bcbf", 0.3), boxRed: c("#c0272d", 0.5), cabMask: c("#1d1f22", 0.6) };
/** d behind the tip: the wrap-round windscreen carried onto the cab sides, the pillar, the small rear-rounded quarter window. */
const TEE_SWEEPS: NonNullable<ShinkansenLivery["endSweeps"]> = [
  { mat: "frameSilver", front: [[2.24, 0], [3.13, 0]], back: [[2.24, 2.22], [3.13, 2.06]] },
  { mat: "cabGlass", front: [[2.27, 0], [3.1, 0]], back: [[2.27, 2.18], [3.1, 2.02]] },
  { mat: "frameSilver", front: [[2.27, 2.3], [2.97, 2.3]], back: [[2.27, 2.52], [2.41, 2.7], [2.62, 2.77], [2.83, 2.7], [2.97, 2.52]] },
  { mat: "cabGlass", front: [[2.3, 2.33], [2.94, 2.33]], back: [[2.3, 2.5], [2.43, 2.67], [2.62, 2.74], [2.81, 2.67], [2.94, 2.5]] },
];
const TEE_LIVERY: ShinkansenLivery = {
  title: "TEE", number: "1053",
  palette: { ...TEE_PALETTE, red: c("#9b1b2a"), beige: c("#e6d9b4"), pod: c("#9b1b2a"), emblem: c("#d9dcde", 0.3), lettering: c("#e6d9b4"), letterTee: c("#7a2c27") },
  bands: [[0, 2.07, "red"], [2.07, 9, "beige"]], doors: [[0, 9, "alu"]],
  roof: "roofG", skirt: "red",
  endLettering: [{ text: "T R A N S  E U R O P  E X P R E S S", d: 10.0, y: 3.36, h: 0.15, mat: "letterTee" }],
  endSweeps: TEE_SWEEPS,
};
const GOTTARDO_LIVERY: ShinkansenLivery = {
  title: "Gottardo grey", number: "1051",
  palette: { ...TEE_PALETTE, grey: c("#959a9e"), dark: c("#4b5156"), white: c("#e9e9e4"), roofG: c("#a7abae", 0.55), pod: c("#959a9e"), emblem: c("#2e3236", 0.4), lettering: c("#e9e9e4") },
  bands: [[0, 1.84, "grey"], [1.84, 1.9, "white"], [1.9, 3.34, "dark"], [3.34, 3.4, "white"], [3.4, 9, "grey"]], doors: [[0, 9, "alu"]],
  roof: "roofG", skirt: "grey", endSweeps: TEE_SWEEPS,
};

/** The emblem's rings: three circles round the letters, 12 segments each. */
const TEE_RINGS = [-0.155, 0, 0.155].flatMap((cx) => Array.from({ length: 12 }, (_, k) => {
  const [a0, a1, r0, r1, cy] = [(Math.PI * k) / 6, (Math.PI * (k + 1)) / 6, 0.108, 0.128, 1.835];
  const pts: Pt[] = [[cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0)], [cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0)], [cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1)], [cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1)]];
  return { mat: "emblem", pts, fine: 2 };
}));

/**
 * The RAe TEE II's driving end (the photographs above, photo-ffs-rae-1053-a-como-sg.jpg in three-quarter
 * view, the Bern photograph head on): the lower face upright and full, its tip at the lamps; the twin
 * lamps in pods on its corners, the TEE emblem between them, the red coupler cover off to one side and
 * the coupler's pocket beside it; a chrome strip at the paint line; the windscreen of two front panes
 * and two wrapping round the corners onto the cab sides, raked about 24 degrees; the beige dome
 * rounding 3 m back to the roof with the top lamp on it.
 */
const TEE_FACE: SeriesCabFace = {
  dJoin: 3.0, dSide: 1.8, first: 5.3, roofFrom: 3.9, reach: 0.3, bulge: 0.22, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: [[0.72, 0.2], [0.95, 0.08], [1.2, 0.04], [1.45, 0.01], [1.6, 0], [1.75, 0.02], [1.9, 0.1], [2.0, 0.2], [2.07, 0.3], [2.12, 0.4], [2.2, 0.55], [2.27, 0.68], [3.1, 1.1], [3.3, 1.25], [3.5, 1.5], [3.65, 1.75], [3.8, 2.1], [3.92, 2.5], [4.0, 3.0]],
  corner: [[0.72, 0.65], [1.6, 0.6], [2.0, 0.65], [2.27, 0.75], [3.1, 0.85], [3.45, 0.9], [3.8, 0.9], [4.0, 0.5]],
  rows: [0.72, 0.85, 0.95, 1.2, 1.25, 1.3, 1.45, 1.6, 1.75, 1.84, 1.9, 2.0, 2.07, 2.12, 2.16, 2.2, 2.24, 2.27, 2.6, 3.1, 3.13, 3.3, 3.34, 3.4, 3.5, 3.65, 3.8, 3.9, 3.92, 4.0],
  masks: [
    // the coupler's pocket, the windscreen's chrome frame
    { lat: [0.0, 0.42], y: [0.85, 1.3], r: 0.06, mat: "cabMask" },
    { lat: [-1.45, 1.45], y: [2.24, 3.13], r: 0.1, mat: "frameSilver" },
    // the louvred grille under the left lamp pod
    { lat: [-1.18, -0.86], y: [0.85, 1.25], r: 0.04, mat: "cabMask" },
  ],
  panes: [
    { lat: [-1.45, -0.68], y: [2.27, 3.1], r: 0.08 }, { lat: [-0.62, -0.04], y: [2.27, 3.1], r: 0.08 },
    { lat: [0.04, 0.62], y: [2.27, 3.1], r: 0.08 }, { lat: [0.68, 1.45], y: [2.27, 3.1], r: 0.08 },
  ],
  // the chrome strip along the paint line under the windscreen
  decals: [
    { mat: "frameSilver", pts: [[-1.3, 2.12], [1.3, 2.12], [1.3, 2.155], [-1.3, 2.155]] },
    ...[0.93, 1.02, 1.11].map((y) => ({ mat: "pod", pts: [[-1.16, y], [-0.88, y], [-0.88, y + 0.045], [-1.16, y + 0.045]] as Pt[] })),
    // the TEE emblem's three linked rings round its letters
    ...TEE_RINGS,
  ],
  pods: [
    { lat: -0.84, y: 1.62, w: 0.74, h: 0.34, proud: 0.26, depth: 0.55, mat: "pod", lamps: [[-0.17, 0.12, "lampHead"], [0.17, 0.12, "lampHead"]] },
    { lat: 0.84, y: 1.62, w: 0.74, h: 0.34, proud: 0.26, depth: 0.55, mat: "pod", lamps: [[-0.17, 0.12, "lampHead"], [0.17, 0.12, "lampHead"]] },
    // the red cover over the coupling's head
    { lat: -0.42, y: 1.08, w: 0.75, h: 0.48, r: 0.07, proud: 0.32, depth: 0.5, mat: "boxRed" },
  ],
  texts: [{ text: "TEE", lat: 0, y: 1.735, h: 0.2, mat: "emblem" }],
  roofLamp: [0, 3.52, 0.09],
  wipers: [[[-0.3, 3.05], [-0.55, 2.4]], [[0.35, 3.05], [0.1, 2.4]]],
};

/**
 * The RAe TEE II (de.wikipedia's figures: 149.76 m in six cars, 125.33 m in five, so the intermediate
 * cars 24.43 m and the driving cars 26.0 m; 2.84 m wide; bogie centres 18.3 m, the machine car's 17.0 m
 * on two A1A bogies of 1110 mm driving wheels; 2310 kW). The driving trailers lead; the machine car
 * second (third in six cars) carries the four diamond pantographs, interlaced in pairs over its bogies.
 */
export const RAE_TEE: ShinkansenSeries = {
  endLength: 26.0, midLength: 24.43, W: 1.42, Y: 1.45, S: 3.67, C: 4.0, lean: 0.95, B: 0.72, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: TEE_FACE,
  // the cab's side window on the right (+Z) side only, the destination board behind the door there and ahead of it on the left
  cabWindows: [[0.05, 1.05, 2.17, 3.2, 1], [2.3, 2.62, 2.35, 3.15, 1], [0.75, 1.07, 2.35, 3.15, -1]],
  windows: [[2.15, 3.3]], windowW: 1.3, pitch: 2.05, door: [1.0, 3.42, 2.3, 3.3], doorW: 0.75, doorGlassW: 0.22,
  bogieCentres: 18.3, wheelR: 0.47, wheelbase: 2.5, cars: [4, 5, 6], centredBogies: true,
  layout: {
    // d behind the body's front end: the end car's door behind the cab, nine windows; the
    // intermediate car's toilet window and door at its front, ten windows
    end: { doors: [[1.3, 2.05, 1]], windows: Array.from({ length: 9 }, (_, i): [number, number] => [3.3 + i * 2.05, 4.6 + i * 2.05]) },
    middle: { doors: [[1.45, 2.2, 1]], windows: [[0.45, 1.05], ...Array.from({ length: 10 }, (_, i): [number, number] => [3.0 + i * 2.05, 4.3 + i * 2.05])] },
  },
  powerCar: {
    length: 24.43, bogieCentres: 17.0, wheelR: 0.555, axles: [-1.75, 0, 1.75], windows: [2.32, 3.25],
    // the side corridor's windows and the louvres over them (Satigny photograph, scaled to the body)
    layout: { doors: [], windows: [[0.67, 1.24], ...[3.6, 5.53, 7.53, 9.63, 11.88, 14.1, 16.55, 19.05].map((m): [number, number] => [m - 0.58, m + 0.58]), [21.7, 22.4]] },
    louvres: [[0.5, 1.6, 1.02, 1.3, 2], [3.95, 7.75, 1.02, 1.3, 6], [16.5, 19.6, 1.02, 1.3, 5], [22.2, 23.4, 1.02, 1.3, 2]],
    pantographs: [{ d: 2.5, raised: true }, { d: 4.4, lift: 0.08 }, { d: 19.5 }, { d: 21.4, lift: 0.08 }],
    slot: (n) => (n >= 6 ? 2 : 1), weight: 93, power: 2310,
  },
  liveries: { tee: TEE_LIVERY, gottardo: GOTTARDO_LIVERY },
  weight: { end: 43, middle: 40 }, power: 2310, maxspeed: 160,
};

/**
 * The Roter Pfeil's cab (the SBB works drawing L 56926, photo-sbb-historic-pl-166-00003-cle-2-4-203-206-sbb.jpg,
 * and the photographs): it stands behind the low bonnet (roterPfeil.ts), its front a vee in plan - two
 * panes either side of the centre post 2.0 m behind the tip, raked back 0.3 m, and a wide pane on each arm
 * reaching back to 3.05 m - under the roof's brow, which juts out over the panes with the top lamp on it.
 */
const ARROW_DJOIN = 3.25;
const ARROW_END: SeriesCabFace = {
  dJoin: ARROW_DJOIN, dSide: ARROW_DJOIN, first: 5.5, roofFrom: 2.85, cols: [8, 3, 1, 1], tolerance: 0.015, reach: 0.45,
  // the vee: 1.05 m deep under the windscreens, the arms' outer edge upright at 3.05 m; flattening over the roof
  bulge: [[1.55, 1.04], [2.1, 1.02], [2.68, 0.74], [2.76, 0.7], [2.86, 0.72], [2.94, 0.63], [3.026, 0.52], [3.106, 0.4], [3.175, 0.28], [3.232, 0.18], [3.275, 0.1], [3.31, 0]],
  // the rows above the windscreens are the body's own roof arc's, so the face meets it without a crack
  profile: [[1.55, 2.0], [2.12, 2.0], [2.68, 2.3], [2.76, 2.33], [2.83, 2.25], [2.85, 2.23], [2.94, 2.2], [3.026, 2.28], [3.106, 2.47], [3.175, 2.68], [3.232, 2.88], [3.275, 3.03], [3.301, 3.12], [3.31, 3.25]],
  corner: [[1.55, 0.2], [2.8, 0.2], [2.94, 0.3], [3.106, 0.3], [3.175, 0.2], [3.232, 0.12], [3.275, 0.07], [3.31, 0.01]],
  rows: [1.55, 1.64, 2.12, 2.4, 2.62, 2.68, 2.76, 2.83, 2.85, 2.94, 3.026, 3.106, 3.175, 3.232, 3.275, 3.301, 3.31],
  // the centre panes and their surrounds; the wide panes' sills follow the bonnet's dome down to the arms
  masks: [{ lat: [-0.61, -0.02], y: [2.15, 2.71], r: 0.04, mat: "rubber" }, { lat: [0.02, 0.61], y: [2.15, 2.71], r: 0.04, mat: "rubber" }],
  panes: [{ lat: [-0.58, -0.05], y: [2.18, 2.68], r: 0.03 }, { lat: [0.05, 0.58], y: [2.18, 2.68], r: 0.03 }],
  fields: [
    { mat: "rubber", pts: [[0.64, 2.11], [1.24, 1.97], [1.24, 2.71], [0.64, 2.71]] }, { mat: "rubber", pts: [[-1.24, 1.97], [-0.64, 2.11], [-0.64, 2.71], [-1.24, 2.71]] },
    { mat: "cabGlass", pts: [[0.67, 2.14], [1.21, 2.0], [1.21, 2.68], [0.67, 2.68]] }, { mat: "cabGlass", pts: [[-1.21, 2.0], [-0.67, 2.14], [-0.67, 2.68], [-1.21, 2.68]] },
  ],
  roofLamp: [0, 3.0, 0.1],
  // the distant model: the bonnet low ahead of the cab
  lod: {
    profile: [[0.62, 0.05], [1.6, 0.15], [2.12, 1.9], [3.31, 3.0]],
    corner: [[0.62, 0.1], [3.31, 0.1]], rows: [0.62, 1.6, 2.12, 3.31], bulge: 0, glass: false,
  },
};

/** The railcar's paint: SBB red, the grey roof, aluminium doors and "S B B - C F F" spaced out in metal letters, as on the drawing. */
const ARROW_LIVERY: ShinkansenLivery = {
  title: "Red Arrow", number: "RCe 604",
  palette: { roofG: c("#9aa0a5", 0.6), skirtG: c("#2e3134", 0.8), cabMask: c("#1d1f22", 0.3), red: c("#c41e1a"), roofS: c("#a9adb0", 0.45), alu: c("#c3c7ca", 0.3) },
  bands: [[0, 9, "red"]], roof: "roofS", skirt: "skirtG", doors: [[0, 9, "alu"]],
  // the third class numerals behind the doors
  endLettering: [{ text: "S B B - C F F", d: 7.5, y: 1.08, h: 0.2, mat: "alu" }, { text: "3", d: 2.95, y: 1.0, h: 0.2, mat: "alu" }, { text: "3", d: 12.05, y: 1.0, h: 0.2, mat: "alu" }],
};

/** The bonnet's, the roof's and the underfloor's fittings (roterPfeil.ts). */
const ARROW_FIT = {
  C: 3.31, dJoin: ARROW_DJOIN, roof: "roofS", B: 0.62, W: 1.45, paint: { body: "red", skirt: "skirtG" },
  // the three resistor grids of the electric brake, from the cab without the pantograph
  resistors: [[3.7, 5.7], [6.73, 8.73], [9.77, 11.71]] as ReadonlyArray<readonly [number, number]>,
};

/** The body between the cab faces (15.0 m): the doors behind the cabs, seven windows 1.5 m apart between them. */
const ARROW_LAYOUT = {
  doors: [[1.25, 2.03, -1], [12.97, 13.75, 1]] as ReadonlyArray<readonly [number, number, number]>,
  windows: Array.from({ length: 7 }, (_, i): readonly [number, number] => [2.41 + 1.5 * i, 3.6 + 1.5 * i]),
};

export const RED_ARROW: ShinkansenSeries = {
  // the RCe 2/4 after its buffers came in 1944: 21.5 m over the bonnets, 22.4 m over the buffers
  endLength: 22.4, midLength: 22.4, W: 1.45, Y: 1.0, S: 2.85, C: 3.31, lean: 0.97, B: 0.62, A: 0.7,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ARROW_END,
  // one cab side window behind the face's join, as on the drawing (the two rebuilt RAe 2/4 had a second)
  cabWindows: [[0.03, 0.83, 2.0, 2.66]],
  windows: [[1.64, 2.62]], windowW: 1.19, pitch: 1.5, door: [0.72, 2.66, 1.64, 2.6], doorW: 0.78,
  layout: { end: ARROW_LAYOUT, middle: ARROW_LAYOUT }, numberAt: [-7.0, 0.9, 0.1],
  // the diamond pantograph over the trailing bogie (cab I)
  bogieCentres: 16.3, wheelR: 0.45, wheelbase: 2.5, single: true, endPantograph: true, pantograph: "diamond",
  liveries: { redArrow: ARROW_LIVERY },
  fittings: (m, b, X, car) => arrowFittings(m, b, X, car, ARROW_FIT),
  weight: { end: 40, middle: 40 }, power: 380, maxspeed: 125,
};

/**
 * The ICN's paint (photo-rabde-500-icn-emu-54826117727.jpg, photo-icn1.jpg, photo-sbb-rabde500.jpg,
 * photo-sbb-rabde-500-bei-twann.jpg): white over a dark grey lower band, a thin red line along the
 * roof's edge, a red flag beside every door; the cab's side window on the end car (the face carries
 * its own red and black).
 */
const ICN_SBB: ShinkansenLivery = {
  title: "SBB", number: "500 001",
  palette: { white: c("#f1f1ee"), dark: c("#3b3f44", 0.6), red: c(SBB_RED), black: c("#151719", 0.3), roofG: c("#c3c6c8", 0.6), skirtG: c("#2b2e32", 0.75), cabMask: c("#151719", 0.25) },
  bands: [[0, 1.12, "dark"], [1.12, 3.33, "white"], [3.33, 9, "red"]], doors: [[0, 1.12, "dark"], [1.12, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  doorFlags: { w: 0.36, gap: 0.06, y: [1.92, 2.92], mat: "red" },
  endSweeps: [
    // d behind the tip, over the cab's roof behind the face: the red frame along the roof's edge, the cap's rounded end
    { mat: "black", front: [[3.4, -9], [3.95, -9]], back: [[3.4, 4.8], [3.6, 5.0], [3.85, 5.35], [3.95, 5.7]], top: 3.96 },
    { mat: "red", front: [[3.3, -9], [3.6, -9]], back: [[3.3, 6.5], [3.4, 6.5], [3.42, 5.6], [3.6, 4.9]], top: 3.6 },
    // the cab's side window, its front edge raked with the red frame
    { mat: "cabGlass", front: [[2.15, 3.45], [2.6, 3.8], [2.85, 4.1], [3.0, 4.4]], back: [[2.15, 4.95], [3.0, 4.95]] },
  ],
};

/**
 * The face's red, [lat, y]: the red lip and lamp face over the white bumper, and the frame round the
 * windscreen field up to the roof's edge, where it runs on as the body's red line; over the roof
 * between the cap and the edges.
 */
const ICN_RED: Pt[] = [
  [-1.1, 1.45], [1.1, 1.45], [1.12, 1.8], [1.17, 2.2], [1.24, 2.6], [1.24, 3.31], [1.5, 3.33], [1.5, 4.1],
  [-1.5, 4.1], [-1.5, 3.33], [-1.24, 3.31], [-1.24, 2.6], [-1.17, 2.2], [-1.12, 1.8],
];
/** The black windscreen field and roof cap inside the red frame, [lat, y]: rounded at the bottom; over the roof the cap between the red lines along its edges. */
const ICN_FIELD: Pt[] = [
  [-0.3, 2.1], [0.3, 2.1], [0.55, 2.15], [0.7, 2.24], [0.8, 2.36], [0.86, 2.55], [0.89, 2.9], [0.88, 3.3], [0.86, 3.5], [1.1, 3.6], [1.5, 3.62], [1.5, 4.1],
  [-1.5, 4.1], [-1.5, 3.62], [-1.1, 3.6], [-0.86, 3.5], [-0.88, 3.3], [-0.89, 2.9], [-0.86, 2.55], [-0.8, 2.36], [-0.7, 2.24], [-0.55, 2.15],
];

/**
 * The ICN's front (the photographs above): a narrow, rounded black chin protruding under a white
 * bumper that wraps the corners, the red lip over it, then the red lamp face with two upright black
 * lamp housings and the SBB emblem; the black windscreen field, a rounded U over the lamps, raked
 * about 40 degrees (the roof at full height 3.6 m behind the tip) and running on
 * as the roof cap 5.6 m back, the red frame round it. In plan the face tapers strongly: its corners
 * are elliptical, 0.7 - 0.9 m across and up to 2.5 m deep, the white cab sides curving in to it.
 */
const ICN_FACE: SeriesCabFace = {
  dJoin: 5.6, first: 7.9, roofFrom: 9, bulge: 0.12, cols: [8, 8, 1, 2], tolerance: 0.015,
  profile: [[0.95, 0.1], [1.1, 0.02], [1.27, 0], [1.42, 0.03], [1.46, 0.04], [1.74, 0.07], [1.79, 0.15], [2.14, 0.35], [2.45, 0.56], [3.25, 1.35], [3.55, 1.9], [3.75, 2.4], [3.88, 2.95], [3.94, 3.6], [3.95, 5.6]],
  corner: [[0.95, 0.7], [1.45, 0.75], [1.8, 0.7], [2.45, 0.85], [3.25, 0.9], [3.6, 0.6], [3.95, 0.1]],
  cornerDepth: [[0.95, 0.9], [1.45, 1.0], [1.8, 1.8], [2.45, 2.5], [3.0, 2.5], [3.25, 2.3], [3.6, 1.4], [3.95, 0.2]],
  rows: [0.95, 1.05, 1.1, 1.12, 1.27, 1.42, 1.45, 1.46, 1.6, 1.74, 1.79, 1.95, 2.1, 2.14, 2.3, 2.45, 2.6, 2.75, 2.95, 3.25, 3.3, 3.31, 3.33, 3.4, 3.42, 3.45, 3.46, 3.48, 3.5, 3.55, 3.6, 3.62, 3.68, 3.75, 3.8, 3.82, 3.88, 3.92, 3.94, 3.95],
  bands: () => [[0, 1.1, "skirtG"], [1.1, 3.42, "white"], [3.42, 9, "black"]],
  // the distant model's end: the red face and frame, the black cap
  lodBands: [[0, 1.1, "skirtG"], [1.1, 1.45, "white"], [1.45, 3.42, "red"], [3.42, 9, "black"]],
  fields: [{ mat: "red", pts: ICN_RED }, { mat: "black", pts: ICN_FIELD }],
  masks: [
    // the lamp housings, and the cap's two grilles
    { lat: [-1.0, -0.7], y: [1.78, 2.3], r: 0.1, mat: "black" }, { lat: [0.7, 1.0], y: [1.78, 2.3], r: 0.1, mat: "black" },
    { lat: [-0.62, -0.2], y: [3.66, 3.76], r: 0.03, mat: "rubber" }, { lat: [0.2, 0.62], y: [3.66, 3.76], r: 0.03, mat: "rubber" },
  ],
  panes: [{ lat: [-0.78, 0.78], y: [2.48, 3.25], r: 0.2 }],
  decals: [
    { mat: "white", pts: [[-0.12, 1.95], [0.12, 1.95], [0.12, 1.99], [-0.12, 1.99]] },
    { mat: "white", pts: [[-0.025, 1.89], [0.025, 1.89], [0.025, 2.05], [-0.025, 2.05]] },
    { mat: "white", pts: [[-0.2, 1.97], [-0.11, 1.89], [-0.11, 2.05]] },
    { mat: "white", pts: [[0.2, 1.97], [0.11, 2.05], [0.11, 1.89]] },
  ],
  lamps: [[-0.85, 2.13, 0.06, "lampHead"], [0.85, 2.13, 0.06, "lampHead"], [-0.85, 1.95, 0.06, "lampHead"], [0.85, 1.95, 0.06, "lampHead"]], roofLamp: [0, 3.71, 0.06],
  wipers: [[[-0.1, 2.52], [-0.7, 3.05]]],
};

/** The chin under the ICN's face: black, narrow and rounding forward to a protruding lower lip; [y, d of its front, d of its back, half width, corner across, corner depth]. */
const ICN_CHIN: ReadonlyArray<readonly [number, number, number, number, number, number]> = [
  [0.37, 0.5, 1.9, 0.75, 0.5, 0.6], [0.43, 0.2, 2.1, 0.95, 0.7, 0.9], [0.52, 0.02, 2.35, 1.08, 0.8, 1.1], [0.62, 0.0, 2.5, 1.15, 0.85, 1.2], [0.8, 0.06, 2.6, 1.22, 0.85, 1.2], [0.98, 0.12, 2.6, 1.25, 0.8, 1.1],
];

/** The ICN's own fittings: the chin on the end car and the dark skirt between the bogies. */
function icnFittings(m: MeshBuilder, b: SliceBody, X: (dd: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const [t0, t1] = [car.trucks[0]!, car.trucks[1]!];
  m.scope("underfloor", () => block(m, "skirtG", X(t1 - 2.6), X(Math.max(t0 + 2.6, 0.3)), ICN.B - 0.3, ICN.B + 0.02, -ICN.W * 0.94, ICN.W * 0.94));
  if (!car.end) return;
  const dj = ICN_FACE.dJoin;
  // a rounded rectangle in plan, d behind the tip: the front corners elliptical, the back square
  const ring = ([, df, db, hw, r, rd]: readonly [number, number, number, number, number, number]): Ring => {
    const pts: Array<[number, number]> = [];
    const n = 5;
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.sin(t)), -(hw - r + r * Math.cos(t))]); }
    for (let i = 0; i <= n; i++) { const t = (i / n) * (Math.PI / 2); pts.push([df + rd * (1 - Math.cos(t)), hw - r + r * Math.sin(t)]); }
    pts.push([db, hw], [db, -hw]);
    const out: Ring = pts.map(([d, z]): [number, number] => [X(d - dj), z]);
    let area = 0;
    for (let i = 0; i < out.length; i++) { const [p, q] = [out[i]!, out[(i + 1) % out.length]!]; area += p[0] * q[1] - q[0] * p[1]; }
    // counter-clockwise seen from above (+y): negative shoelace area in (x, z)
    return area > 0 ? out.reverse() : out;
  };
  void b;
  m.scope("chin", () => {
    const rings = ICN_CHIN.map(ring);
    m.cap("skirtG", rings[0]!, ICN_CHIN[0]![0], false);
    for (let i = 0; i + 1 < rings.length; i++) m.loft("skirtG", rings[i]!, ICN_CHIN[i]![0], rings[i + 1]!, ICN_CHIN[i + 1]![0], i + 2 === rings.length);
  });
}

export const ICN: ShinkansenSeries = {
  endLength: 27.0, midLength: 26.9, W: 1.415, Y: 1.55, S: 3.4, C: 3.95, lean: 0.85, B: 0.95, A: 1.05,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICN_FACE,
  // the dark window band: wide windows, thin pillars; tall single-leaf doors, a narrow window high in the leaf
  windows: [[1.92, 2.92]], windowW: 1.52, pitch: 1.65, door: [1.12, 3.3, 2.05, 3.0], doorW: 0.95, doorGlassW: 0.3,
  // the leading bogie under the cab's side window (4.6 m behind the tip), the rear one 3.75 m from the coupling
  endBogies: [4.6 - 5.6, 27.0 - 0.25 - 5.67 - 3.5],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, cars: [7],
  liveries: { sbb: ICN_SBB }, fittings: icnFittings,
  weight: { end: 50, middle: 50 }, power: 740, maxspeed: 200,
};

/**
 * The Giruno's paint (photo-ec250-giruno-close-to-erlen.jpg in near profile, photo-sbb-rabde-501-029-...,
 * photo-stadler-ec250-innotrans-2016-3.jpg head on): white over a dark grey lower band, red doors, a
 * dark roof with a red stripe under its edge along the whole train. On the nose the white bumper
 * carries a red cap; the red face above it holds the lamps and the grille and runs up beside the
 * windscreen's black surround into that stripe; the grey lower band rises along the nose's bottom.
 * Edges are [y, d behind the tip].
 */
const GIRUNO_RED_BACK: Pt[] = [[1.9, 1.55], [2.2, 1.85], [2.5, 2.2], [2.8, 2.7], [3.1, 3.1], [3.35, 3.7], [3.56, 4.4], [3.75, 5.2]];
const GIRUNO_SBB: ShinkansenLivery = {
  title: "SBB", number: "501 029",
  palette: { white: c("#f1f1ee"), grey: c("#3b3f44", 0.6), red: c(SBB_RED), black: c("#14171a", 0.35), screen: c("#6d7c89", 0.1), roofG: c("#262c35", 0.55), skirtG: c("#24272b", 0.75), cabMask: c("#14171a", 0.3) },
  // the windows in a black band
  bands: [[0, 1.0, "grey"], [1.0, 1.7, "white"], [1.7, 2.75, "black"], [2.75, 3.55, "white"], [3.55, 3.75, "red"], [3.75, 9, "roofG"]], doors: [[0, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
  // the cab's sides white back to the first window; the red beside the windscreen reaches past the
  // cab face's join onto the body
  endSweeps: [
    { mat: "white", front: [[1.65, -9], [2.8, -9]], back: [[1.65, 7.95], [2.8, 7.95]] },
    { mat: "red", front: [[3.35, -9], [3.75, -9]], back: GIRUNO_RED_BACK.filter(([y]) => y >= 3.35) },
  ],
  endLettering: [{ text: "SBB CFF FFS", d: 12.4, y: 1.4, h: 0.13, mat: "red" }],
};

/**
 * The Giruno's nose (the photographs above): 4.6 m long, rounded to a point in plan (elliptic corners
 * twice as deep as they are wide). Its bottom is a bulbous white bumper, upright from the skirt to
 * 1.85 m and rounded under it, its red cap rising from 1.4 m at the middle to 1.85 m at the corners;
 * the red face stands back behind its lip with the slanted lamp clusters, the grille and the SBB
 * emblem; above it the large windscreen in a narrow black surround rakes back about 30 degrees to the
 * roof, the surround dipping to the grille where the wipers park.
 */
const GIRUNO_FACE: SeriesCabFace = {
  dJoin: 4.6, dSide: 3.6, first: 8.0, roofFrom: 4.0, cols: [8, 7, 1, 2], tolerance: 0.015,
  profile: [[0.55, 0.5], [0.62, 0.25], [0.75, 0.1], [0.95, 0.03], [1.2, 0], [1.75, 0], [1.85, 0.04], [1.92, 0.14], [1.97, 0.3], [2.05, 0.4], [2.3, 0.52], [2.55, 0.7], [2.7, 0.85], [3.0, 1.3], [3.3, 1.8], [3.6, 2.35], [3.85, 2.9], [4.0, 3.35], [4.1, 3.8], [4.17, 4.25], [4.2, 4.6]],
  // the plan: a narrow front rounding in deep elliptic corners to the sides
  // (no bow: a parabola would meet the elliptic corners at a kink)
  corner: [[0.55, 1.1], [1.9, 1.1], [2.0, 1.2], [3.3, 1.25], [3.9, 0.9], [4.2, 0.1]],
  cornerRatio: [[0.55, 1.25], [1.9, 1.25], [2.0, 1.5], [3.3, 1.6], [3.9, 1.2], [4.2, 1.0]],
  rows: [0.55, 0.62, 0.75, 0.95, 1.0, 1.2, 1.4, 1.6, 1.75, 1.85, 1.92, 1.97, 2.05, 2.2, 2.3, 2.55, 2.7, 3.0, 3.3, 3.6, 3.75, 3.85, 4.0, 4.1, 4.17, 4.2],
  // (the centre line's colours, which the distant model shows; the paint below draws the near ones)
  bands: () => [[0, 0.62, "skirtG"], [0.62, 1.4, "white"], [1.4, 2.55, "red"], [2.55, 9, "black"]],
  paint: [
    // white under the cab sides' window band, the grey lower band rising forward along the nose's bottom
    { mat: "white", front: [[1.0, -9], [3.55, -9]], back: [[1.0, 99], [3.55, 99]] },
    { mat: "grey", front: [[0.55, 1.3], [0.75, 2.6], [1.0, 4.4]], back: [[0.55, 99], [1.0, 99]] },
    // the red face behind the bumper's lip, round the lamps and up beside the windscreen
    { mat: "red", front: [[1.9, -9], [3.75, -9]], back: GIRUNO_RED_BACK, top: 3.75 },
  ],
  fields: [
    // the bumper's red cap, narrower than the face, its lower edge rising to the corners
    { mat: "red", pts: [[-1.12, 1.88], [-0.95, 1.62], [-0.65, 1.47], [-0.3, 1.41], [0.3, 1.41], [0.65, 1.47], [0.95, 1.62], [1.12, 1.88], [1.12, 1.93], [-1.12, 1.93]] },
    // the windscreen's black surround, dipping to the grille where the wipers park, and the glass
    { mat: "black", pts: [[-1.36, 2.68], [-1.2, 2.56], [-0.55, 2.48], [-0.3, 2.36], [0.3, 2.36], [0.55, 2.48], [1.2, 2.56], [1.36, 2.68], [1.0, 4.02], [-1.0, 4.02]] },
    { mat: "screen", pts: [[-1.28, 2.72], [-1.15, 2.62], [1.15, 2.62], [1.28, 2.72], [0.93, 3.9], [0.85, 3.96], [-0.85, 3.96], [-0.93, 3.9]] },
    // the lamp clusters, slanted down to the middle
    { mat: "cabMask", pts: [[-1.4, 2.26], [-1.34, 2.43], [-1.1, 2.45], [-0.5, 2.1], [-0.55, 1.98], [-0.92, 1.99]] },
    { mat: "cabMask", pts: [[0.92, 1.99], [0.55, 1.98], [0.5, 2.1], [1.1, 2.45], [1.34, 2.43], [1.4, 2.26]] },
  ],
  masks: [{ lat: [-0.22, 0.22], y: [2.2, 2.32], r: 0.03, mat: "black" }],
  panes: [{ lat: [-0.8, 0.8], y: [2.7, 3.88], r: 0.2, mat: "screen" }],
  decals: [
    { mat: "white", pts: [[-0.1, 2.08], [0.1, 2.08], [0.1, 2.11], [-0.1, 2.11]] },
    { mat: "white", pts: [[-0.02, 2.03], [0.02, 2.03], [0.02, 2.16], [-0.02, 2.16]] },
    { mat: "white", pts: [[-0.17, 2.095], [-0.09, 2.03], [-0.09, 2.16]] },
    { mat: "white", pts: [[0.17, 2.095], [0.09, 2.16], [0.09, 2.03]] },
  ],
  lamps: [
    [-1.17, 2.34, 0.07, "lampHead"], [-0.9, 2.22, 0.08, "lampHead"], [-0.68, 2.09, 0.05, "lampRed"],
    [1.17, 2.34, 0.07, "lampHead"], [0.9, 2.22, 0.08, "lampHead"], [0.68, 2.09, 0.05, "lampRed"],
    // the coupler's opening in the bumper
    [0.45, 0.85, 0.06, "black"],
  ],
  wipers: [[[0.08, 2.66], [0.45, 3.4]], [[0.6, 2.66], [0.9, 3.25]]],
};

/** Window panes of a black band from d0 to d1 (body d), about `pitch` apart, 8 cm pillars between them. */
const paneRow = (d0: number, d1: number, pitch: number): Array<readonly [number, number]> => {
  const n = Math.max(1, Math.round((d1 - d0) / pitch)), w = (d1 - d0) / n;
  return Array.from({ length: n }, (_, i) => [d0 + i * w + (i ? 0.04 : 0), d0 + (i + 1) * w - (i < n - 1 ? 0.04 : 0)] as const);
};

/** The Giruno's cab door: its seams on the body sides, under the cab side window, and the underfloor equipment. */
function girunoFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("cab door", () => {
    const [d0, d1, y0, y1, k] = [1.75, 2.5, 1.2, 2.88, 0.02];
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.004, 0.01);
      sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.004, 0.01);
      sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.004, 0.01);
      sidePanel(m, b, X, sd, "rubber", d0 + 0.12, d0 + 0.16, 1.85, 2.05, 0.008, 0.01);
    }
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), 0.55 - 0.35, 0.55, -1.45 * 0.8, 1.45 * 0.8));
}

export const GIRUNO: ShinkansenSeries = {
  // 22.25 m end cars and 17.5 m intermediate cars over the joints (de.wikipedia, Wagenreihung)
  endLength: 22.25, midLength: 17.5, W: 1.45, Y: 1.0, S: 3.75, C: 4.2, lean: 0.93, B: 0.55, A: 0.85,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: GIRUNO_FACE,
  // the cab's small side window ahead of its door, d behind the join
  cabWindows: [[0.5, 1.3, 2.65, 3.17]],
  // windows in a black band from the cab back; one door a side, behind the middle of each car
  layout: {
    end: { doors: [[10.5, 11.8, 1]], windows: [...paneRow(3.4, 10.4, 1.15), ...paneRow(11.9, 17.0, 1.15)] },
    middle: { doors: [[10.2, 11.6, 1]], windows: [...paneRow(0.5, 10.1, 1.15), ...paneRow(11.7, 16.5, 1.15)] },
  },
  windows: [[1.7, 2.75]], windowW: 1.07, pitch: 1.15, door: [0.9, 2.62, 1.5, 2.48], doorW: 1.3,
  // Jacobs bogies under the joints; the end car's leading bogie under the cab door
  bogieCentres: 13.4, wheelR: 0.46, wheelbase: 2.75, jacobsInset: 2.3, endBogies: [2.0, 17.33 - 2.3],
  cars: [4, 8], fittings: girunoFittings,
  liveries: { sbb: GIRUNO_SBB },
  weight: { end: 48, middle: 36 }, power: 750, maxspeed: 250,
};

/**
 * The FV-Dosto's livery, read from photo-sbb-rabe-502-203-ossingen.jpg, photo-sbb-rabe-502-405.jpg, the
 * near side view photo-sbb-rabe-502-at-94-85-1-502-201-0-velim.jpg (its door leaf and service door as the
 * scale) and a side view: white over a dark lower band, red doors with a blue head; the red cab carried
 * back over the roof's edge to 7.7 m and a black sweep under it, its front edge curving from the chin up
 * and back to the shoulder at 4.4 m, its back edge one straight line from the white's point 1.4 m behind
 * the tip just over the dark band up to the shoulder at 6.75 m, the cab's side window in it.
 */
const DOSTO_WHITE_EDGE: Pt[] = [[1.2, 1.36], [1.22, 1.38], [1.72, 2.45], [2.1, 3.2], [2.48, 3.95], [2.86, 4.6], [3.24, 5.4], [3.6, 6.1], [3.95, 6.75]];
const DOSTO_RED_EDGE: Pt[] = [[0.9, 1.05], [1.0, 1.15], [1.34, 1.36], [1.72, 1.5], [2.1, 1.76], [2.48, 2.03], [2.86, 2.38], [3.24, 2.78], [3.53, 3.27], [3.78, 3.85], [3.9, 4.4], [3.95, 5.0]];
const DOSTO_SBB: ShinkansenLivery = {
  title: "SBB", number: "502 203",
  palette: {
    white: c("#f1f1ee"), dark: c("#2c3034", 0.55), red: c(SBB_RED), black: c("#17191b", 0.45), roofG: c("#5c6166", 0.6), skirtG: c("#232528", 0.75), cabMask: c("#17191b", 0.3),
    blue: c("#2a4f9e"), cream: c("#ddd5b8", 0.5), lampBox: c("#8d9397", 0.25), amber: c("#f08a1c", 0.4),
  },
  // white up to the upper deck's window tops, the dark grey roof band from the shoulder just above them
  bands: [[0, 1.2, "dark"], [1.2, 3.94, "white"], [3.94, 9, "roofG"]], doors: [[0, 2.62, "red"], [2.62, 9, "blue"]],
  roof: "roofG", skirt: "skirtG",
  // d behind the tip; the red covers the body up to the black's front edge
  endSweeps: [
    { mat: "red", front: [[0.9, -9], [3.95, -9]], back: DOSTO_RED_EDGE },
    // on the cab's sides: the dark lower band forward to the red, the white's point over it
    { mat: "dark", front: DOSTO_RED_EDGE, back: [[0.9, 3.3], [1.2, 3.3]] },
    { mat: "white", front: DOSTO_WHITE_EDGE, back: [[1.2, 3.3], [2.2, 3.3]] },
    { mat: "black", front: DOSTO_RED_EDGE, back: DOSTO_WHITE_EDGE },
    // the cab's side window in the black: a flat sill, its front edge raked parallel to the sweep
    { mat: "cabGlass", front: [[2.55, 2.72], [3.45, 3.82]], back: [[2.55, 3.98], [3.45, 3.98]] },
  ],
  // the red over the roof's edge, its rear end slanted back toward the top
  endRoofEdge: { mat: "red", y: 4.45, d: [3.3, 6.75, 7.7] },
  endLettering: [{ text: "SBB CFF FFS", d: 8.05, y: 2.66, h: 0.13, mat: "lettering" }],
};

/**
 * The FV-Dosto's front (photo-sbb-rabde-502-009.jpg, -203-ossingen, -405 and a side view): the chin
 * forward at the coupler and the face raked back about 45 degrees over 3.3 m to the roof, with wide
 * rounded corners. A tall black mask nearly the face's width holds the windscreen, the two lamp
 * clusters under its lower corners and the SBB emblem on a narrower panel below; a white rim follows
 * it, the red round it.
 */
const DOSTO_FACE: SeriesCabFace = {
  dJoin: 3.3, dSide: 2.6, first: 10.3, roofFrom: 4.45, wrap: true, bulge: 0.1, cols: [8, 4, 1, 2], tolerance: 0.015,
  profile: [[0.72, 0.35], [0.9, 0.08], [1.15, 0], [1.4, 0.03], [1.75, 0.15], [2.2, 0.45], [2.7, 0.85], [3.3, 1.4], [3.8, 1.95], [4.1, 2.35], [4.35, 2.75], [4.5, 3.05], [4.6, 3.3]],
  corner: [[0.72, 0.8], [2.2, 0.8], [3.3, 0.75], [4.0, 0.6], [4.35, 0.4], [4.6, 0.1]],
  rows: [0.72, 0.9, 0.95, 1.15, 1.24, 1.47, 1.75, 2.0, 2.12, 2.25, 2.45, 2.5, 2.64, 2.7, 3.3, 3.55, 3.7, 3.8, 3.85, 3.95, 4.04, 4.15, 4.28, 4.35, 4.45, 4.52, 4.6],
  bands: () => [[0, 0.95, "skirtG"], [0.95, 9, "red"]],
  // the black mask narrows from the windscreen to the emblem's panel; the white rim follows it
  fields: [
    { mat: "white", pts: [[-1.16, 4.28], [1.16, 4.28], [1.22, 2.6], [1.18, 2.2], [1.03, 1.6], [0.88, 1.33], [0.62, 1.24], [-0.62, 1.24], [-0.88, 1.33], [-1.03, 1.6], [-1.18, 2.2], [-1.22, 2.6]] },
    { mat: "cabMask", pts: [[-1.1, 4.7], [1.1, 4.7], [1.12, 2.6], [1.08, 2.12], [0.95, 2.0], [0.9, 1.7], [0.78, 1.53], [0.58, 1.47], [-0.58, 1.47], [-0.78, 1.53], [-0.9, 1.7], [-0.95, 2.0], [-1.08, 2.12], [-1.12, 2.6]] },
  ],
  // the lamp clusters' pale housings under the windscreen's lower corners
  masks: [{ lat: [-1.1, -0.58], y: [2.15, 2.48], r: 0.09, mat: "lampBox" }, { lat: [0.58, 1.1], y: [2.15, 2.48], r: 0.09, mat: "lampBox" }],
  panes: [{ lat: [-1.0, 1.0], y: [2.64, 4.15], r: 0.12 }],
  // the destination display behind the windscreen's top (line and destination in amber); the SBB
  // emblem: a cross, its bar ending in arrowheads
  decals: [
    { mat: "amber", pts: [[-0.62, 3.96], [-0.45, 3.96], [-0.45, 4.04], [-0.62, 4.04]] },
    { mat: "amber", pts: [[-0.38, 3.97], [0.12, 3.97], [0.12, 4.03], [-0.38, 4.03]] },
    { mat: "white", pts: [[-0.13, 1.83], [0.13, 1.83], [0.13, 1.87], [-0.13, 1.87]] },
    { mat: "white", pts: [[-0.025, 1.76], [0.025, 1.76], [0.025, 1.94], [-0.025, 1.94]] },
    { mat: "white", pts: [[-0.22, 1.85], [-0.12, 1.76], [-0.12, 1.94]] },
    { mat: "white", pts: [[0.22, 1.85], [0.12, 1.94], [0.12, 1.76]] },
  ],
  lamps: [[-0.9, 2.32, 0.11, "lampHead"], [0.9, 2.32, 0.11, "lampHead"], [-0.71, 2.28, 0.06, "lampHead"], [0.71, 2.28, 0.06, "lampHead"]], roofLamp: [0, 4.32, 0.07],
  wipers: [[[0.0, 2.68], [-0.55, 3.55]]],
};

export const FV_DOSTO: ShinkansenSeries = {
  endLength: 26.8, midLength: 25.0, W: 1.4, Y: 1.2, S: 3.95, C: 4.6, lean: 0.97, B: 0.72, A: 0.9,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DOSTO_FACE,
  // the doors under the upper deck's windows, a narrow window in the leaf
  windows: [[1.18, 1.9], [3.3, 3.93]], windowW: 1.0, pitch: 1.5, door: [1.0, 2.85, 1.5, 2.4], doorW: 1.4, doorGlassW: 0.32, upperOverDoors: true,
  // the doors at the low floor's ends, inside the bogies, its windows between them (d behind the body's end):
  // the end car's from a side view and photo-sbb-rabe-502-405.jpg with the upper windows as the ruler
  // (1.5 m pitch), the intermediate car's from photo-sbb-rabde-502-009.jpg
  layout: {
    end: { doors: [[6.05, 7.5, -1], [14.3, 15.8, 1]], windows: [[8.25, 9.35], [9.8, 10.9], [11.2, 11.75]] },
    middle: { doors: [[5.2, 6.65, -1], [17.85, 19.3, 1]], windows: [[7.1, 8.1], [8.57, 9.57], [10.04, 11.04], [11.51, 12.51], [12.98, 13.98], [14.45, 15.45], [15.92, 16.92]] },
  },
  // behind the cab: a hatch, the destination display, the white service door (its window and grille) and
  // the SBB emblem by the first door; over the bogies at the cars' ends: white service doors
  sidePanels: {
    end: [
      { d: [2.96, 3.34], y: [1.35, 1.67], kind: "seam" },
      { d: [5.43, 6.27], y: [1.7, 2.41], kind: "panel", mat: "cream", screen: "black" },
      { d: [6.45, 7.3], y: [1.08, 3.17], kind: "seam" },
      { d: [6.57, 7.16], y: [2.67, 3.03], kind: "window" },
      { d: [6.6, 7.2], y: [1.22, 1.87], kind: "louvres", louvres: 8 },
      { d: [10.95, 11.27], y: [2.6, 2.92], kind: "panel", mat: "red" },
      { d: [20.0, 20.75], y: [1.1, 3.0], kind: "seam" },
      { d: [20.1, 20.65], y: [2.5, 2.85], kind: "window" },
      { d: [21.6, 22.35], y: [1.1, 3.0], kind: "seam" },
      { d: [21.7, 22.25], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
    ],
    middle: [
      { d: [1.6, 2.35], y: [1.1, 3.0], kind: "seam" },
      { d: [1.7, 2.25], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
      { d: [3.2, 3.95], y: [1.1, 3.0], kind: "seam" },
      { d: [3.3, 3.85], y: [2.5, 2.85], kind: "window" },
      { d: [20.55, 21.3], y: [1.1, 3.0], kind: "seam" },
      { d: [20.65, 21.2], y: [2.5, 2.85], kind: "window" },
      { d: [22.15, 22.9], y: [1.1, 3.0], kind: "seam" },
      { d: [22.25, 22.8], y: [1.3, 1.8], kind: "louvres", louvres: 6 },
    ],
  },
  // the pantograph on each end car's roof behind the cab, the leading one raised
  endPantograph: true, trailingLowered: true, pantographD: 5.0,
  bogieCentres: 18.0, wheelR: 0.46, wheelbase: 2.5, cars: [4, 8],
  liveries: { sbb: DOSTO_SBB },
  weight: { end: 64, middle: 55 }, power: 500, maxspeed: 200,
};

/**
 * The FLIRT's SBB Regio paint (photo-flirt-523-021.jpg, photo-ffs-rabe-522-205-basel-sbb-180611.jpg,
 * photo-rabe523-flirt-yverdon-3-sep-2011.jpg, photo-rames-rabe523-flirt-montreux-290910.jpg): white over
 * a dark grey foot 0.88 m high, a red stripe under the roof's edge along every car, red doors; on the end
 * car the front's red rising past the windscreen to that stripe and the big rounded cab side window.
 */
const FLIRT_SBB: ShinkansenLivery = {
  title: "SBB Regio", number: "523 021",
  palette: {
    white: c("#f1f1ee"), red: c(SBB_RED), grey: c("#4a4f54", 0.6), roofG: c("#a4a9ad", 0.6), roofE: c("#7d8287", 0.6), skirtG: c("#34383c", 0.75),
    cabMask: c("#17191c", 0.3), display: c("#a8c43c", 0.35), black: c("#15171a", 0.3),
  },
  // the windows' upper parts run together in one black band from the door heads down to 1.5 m (the Yverdon photograph)
  bands: [[0, 0.88, "grey"], [0.88, 1.5, "white"], [1.5, 2.72, "black"], [2.72, 3.56, "white"], [3.56, 9, "red"]], doors: [[0, 0.88, "grey"], [0.88, 9, "red"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // d behind the tip: white over the black band ahead of the passenger room (8.6 m), the front's red up the
    // windscreen's side to the roof stripe, the cab's side window behind it (photo 523 025: a flat bottom rising in a curve to the front)
    { mat: "white", front: [[1.5, -9], [2.72, -9]], back: [[1.5, 8.6], [2.72, 8.6]] },
    { mat: "red", front: [[2.9, -9], [3.56, -9]], back: [[2.9, 1.75], [3.1, 2.0], [3.35, 2.35], [3.56, 2.95]] },
    { mat: "cabGlass", front: [[1.66, 3.9], [1.7, 3.1], [1.78, 2.6], [1.9, 2.25], [2.05, 2.0], [2.2, 1.85], [2.35, 1.8], [2.5, 1.84], [2.65, 1.95], [2.8, 2.12], [2.95, 2.38]], back: [[1.66, 4.85], [1.72, 5.05], [1.8, 5.1], [2.95, 5.1]] },
  ],
};

/**
 * The FLIRT's front (the photographs above; photo-tilo-...-biasca-2026.jpg close up): an upright bumper
 * 1.4 m high, white over the grey apron with the coupler and two black grille boxes, then the red panel
 * with the two lamp pods and the number, the windscreen raked about 43 degrees and the black dome over it
 * rounding back 3.6 m to the roof, the red rising either side of it.
 */
const FLIRT_FACE: SeriesCabFace = {
  dJoin: 3.6, dSide: 2.4, first: 8.8, roofFrom: 4.2, bulge: 0.2, cols: [8, 5, 1, 2], tolerance: 0.015,
  // the rounded white bumper standing out under the lamps, curving up into the windscreen's rake
  profile: [[0.45, 0.36], [0.6, 0.2], [0.8, 0.1], [0.95, 0.03], [1.1, 0], [1.25, 0.01], [1.4, 0.05], [1.66, 0.13], [2.0, 0.25], [2.6, 0.62], [3.0, 0.9], [3.4, 1.2], [3.7, 1.55], [3.88, 2.0], [3.98, 2.65], [4.05, 3.6]],
  // round in plan: large corner radii from the bumper to the dome
  corner: [[0.45, 0.75], [1.1, 0.85], [2.0, 0.9], [2.6, 0.95], [3.3, 0.95], [3.75, 0.7], [4.05, 0.15]],
  rows: [0.45, 0.5, 0.6, 0.8, 0.88, 0.95, 1.1, 1.25, 1.34, 1.42, 1.55, 1.68, 1.8, 2.0, 2.1, 2.6, 3.0, 3.2, 3.4, 3.5, 3.55, 3.72, 3.88, 3.98, 4.05],
  // red from the lamp panel up (the distant model's front too); white fields where the face rounds off beside it
  bands: () => [[0, 0.88, "grey"], [0.88, 1.34, "white"], [1.34, 9, "red"]],
  fields: [
    // photo 522 205 head-on (94 px/m): the red panel under the windscreen to lat 1.0, the band beside it 0.2 m
    // wide out to lat 1.25, then white round the corners; at the roof the band widens over the corner into the stripe
    ...[1, -1].flatMap((sd) => [
      { mat: "white", pts: [[1.7, 1.34], [1.0, 1.34], [1.1, 1.7], [1.22, 2.1], [1.28, 2.6], [1.28, 3.2], [1.6, 3.55], [1.7, 3.55]].map(([l, y]): Pt => [sd * l!, y!]) },
      { mat: "white", pts: [[1.7, 3.75], [1.6, 3.75], [1.0, 4.4], [1.7, 4.4]].map(([l, y]): Pt => [sd * l!, y!]) },
    ]),
    // the black windscreen and dome: rounded at the bottom, widest at mid height, narrowing to the roof
    { mat: "cabMask", pts: [[-0.7, 2.0], [0.7, 2.0], [0.84, 2.1], [0.92, 2.4], [0.94, 3.2], [0.88, 3.75], [0.7, 4.4], [-0.7, 4.4], [-0.88, 3.75], [-0.94, 3.2], [-0.92, 2.4], [-0.84, 2.1]] },
  ],
  masks: [
    // the lamp pods, the headlight at the inner end
    { lat: [-1.3, -0.7], y: [1.42, 1.68], r: 0.13, mat: "cabMask" }, { lat: [0.7, 1.3], y: [1.42, 1.68], r: 0.13, mat: "cabMask" },
  ],
  panes: [{ lat: [-0.85, 0.85], y: [2.1, 3.4], r: 0.16 }, { lat: [-0.62, 0.62], y: [3.5, 3.72], r: 0.03, mat: "display" }],
  lamps: [[-0.88, 1.55, 0.095, "lampHead"], [0.88, 1.55, 0.095, "lampHead"], [-1.14, 1.55, 0.05, "lampRed"], [1.14, 1.55, 0.05, "lampRed"]], roofLamp: [0, 3.86, 0.07],
  number: { lat: 0.02, y: 1.37, h: 0.075, mat: "white" },
  wipers: [[[-0.15, 2.25], [-0.7, 3.1]]],
};

/** The RABe 523's roof: the end car's machine housing behind the cab, the cars' air-conditioning boxes; little under the low floor. */
function flirtFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const box = (d0: number, d1: number, y0: number, y1: number, hw: number, mat: string) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  const C = b.C(car.length / 2);
  m.scope("roof equipment", () => {
    if (car.end) {
      // the cab's black crown running on behind the face, then the transformer's housing
      box(-0.05, 2.4, C - 0.04, C + 0.035, 0.7, "cabMask");
      box(2.6, 6.4, C - 0.05, C + 0.13, 0.8, "roofE");
      box(13.0, 15.2, C - 0.05, C + 0.14, 0.8, "roofE");
    } else {
      box(4.0, 6.0, C - 0.05, C + 0.14, 0.8, "roofE");
      box(car.length - 4.6, car.length - 2.6, C - 0.05, C + 0.14, 0.8, "roofE");
    }
  });
  if (car.end) m.scope("front gear", () => {
    // the grille boxes either side of the apron and the automatic coupler standing out of it
    const tip = X(-FLIRT_FACE.dJoin), k = Math.sign(tip - X(0));
    const at = (mat: string, a: number, e: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, z0, z1);
    // set into the apron under the bumper (its face 0.1 - 0.2 m behind the tip there), only the coupler's head standing out
    for (const sd of [1, -1]) at("under", -0.62, -0.3, 0.52, 0.84, sd > 0 ? 0.72 : -1.08, sd > 0 ? 1.08 : -0.72);
    at("carbon", -0.45, -0.02, 0.92, 1.04, -0.08, 0.08);
    at("carbon", -0.07, 0.04, 0.88, 1.08, -0.15, 0.15);
  });
  if (car.end) m.scope("cab door", () => {
    // the white cab door's outline behind the cab window (photos 523 021 and Yverdon: tip-d 7.7 - 8.4)
    const [d0, d1, y0, y1, k] = [7.7 - FLIRT_FACE.dJoin, 8.4 - FLIRT_FACE.dJoin, 0.75, 2.65, 0.025];
    for (const sd of [1, -1]) {
      sidePanel(m, b, X, sd, "rubber", d0, d0 + k, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d1 - k, d1, y0, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y0, y0 + k, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + k, d1 - k, y1 - k, y1, 0.006, 0.02);
      sidePanel(m, b, X, sd, "rubber", d0 + 0.08, d0 + 0.2, 1.45, 1.6, 0.006, 0.02);
    }
  });
  m.scope("underfloor", () => (car.end ?box(car.trucks[0]! + 2.0, car.trucks[0]! + 4.2, b.B(car.length / 2) - 0.3, b.B(car.length / 2), 1.1, "under") : undefined));
}

export const SBB_FLIRT: ShinkansenSeries = {
  // RABe 523: 58.166 m over three cars, 74.266 m over four (de.wikipedia, Stadler data sheets): end cars 21.03 m to the joint, middle cars 16.1 m
  ...flirt({ W: 1.44, endLength: 21.03, midLength: 16.1, liveries: { sbbRegio: FLIRT_SBB }, weight: { end: 42, middle: 32 }, power: 650, maxspeed: 160 }),
  Y: 1.25, S: 3.8, C: 4.05, lean: 0.96, B: 0.45, A: 0.88,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FLIRT_FACE,
  // the Yverdon photograph at 61 px/m (door 0.6 - 2.72 m): tall windows from 1.05 m up into the black band
  windows: [[1.05, 2.72]], door: [0.6, 2.72, 1.0, 2.5],
  // the motor bogie under the cab, Jacobs bogies under the joints; one pantograph on the second car over its leading bogie
  jacobs: true, endBogies: [1.7, 0], wheelR: 0.43, wheelbase: 2.5, onePantograph: true, pantographAt: 1.9,
  // the cab door's droplight behind the side window (tip-d 5.15 - 6.35), the raised window over the motor bogie in the band
  cabWindows: [[1.55, 2.75, 1.7, 2.95], [5.05, 6.7, 1.5, 2.72]],
  layout: {
    // d behind the body's front end (the cab face's join on the end car); double doors as two leaves sliding apart;
    // the Yverdon photograph's positions, fitted to the joints by a projective map
    end: {
      doors: [[8.3, 9.0, -1], [9.0, 9.7, 1], [13.1, 13.8, -1], [13.8, 14.5, 1]],
      windows: [[6.85, 8.1], [9.95, 11.25], [11.45, 12.9], [14.75, 16.6]],
    },
    middle: {
      doors: [[4.6, 5.3, -1], [5.3, 6.0, 1], [9.6, 10.3, -1], [10.3, 11.0, 1]],
      windows: [[0.9, 2.55], [2.7, 4.35], [6.25, 7.75], [7.85, 9.35], [11.25, 12.9], [13.05, 14.7]],
    },
  },
  fittings: flirtFittings,
};
/**
 * The KISS's S-Bahn paint (photo-rabe-511-044-...-weinfelden.jpg, photo-sbb-rabe-511-tossmuhle.jpg,
 * photo-sbb-511-022-st-margrethen.jpg): white over a navy lower band 1.48 m high, a navy stripe
 * between the decks from behind the cab's locker back, red doors whose red runs on up to the upper
 * windows, a dark roof. On the cab side the face's red rises to the roof ahead of the cab window,
 * the window a raked pane and a narrow one behind its pillar; a dark equipment fairing over the cab
 * section, the locker panel and the SBB emblem behind it.
 */
const KISS_SBB: ShinkansenLivery = {
  title: "SBB Regio", number: "511 044",
  palette: { white: c("#f1f1ee"), blue: c("#1f2f6b"), red: c(SBB_RED), roofG: c("#3d4247", 0.6), skirtG: c("#2a2d31", 0.75), cabMask: c("#1b1d20", 0.3), lockerG: c("#c9cac6", 0.6) },
  bands: [[0, 1.48, "blue"], [1.48, 2.62, "white"], [2.62, 2.82, "blue"], [2.82, 9, "white"]], doors: [[0, 9, "red"]],
  // the red over each door up to the upper window, a navy class panel in it
  overDoors: [[2.82, 3.02, "red"], [3.02, 3.22, "blue"], [3.22, 3.32, "red"]],
  roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "SBB CFF FFS", d: 2.85, y: 3.33, h: 0.18, mat: "lettering" }],
  // d behind the tip
  endSweeps: [
    // no stripe ahead of the locker's back edge
    { mat: "white", front: [[2.58, -9], [2.86, -9]], back: [[2.58, 5.4], [2.86, 5.4]] },
    // the face's red over the cab window, up to the roof's edge
    { mat: "red", front: [[3.3, -9], [4.15, -9]], back: [[3.3, 1.45], [3.7, 2.1], [4.0, 3.0], [4.15, 3.6]] },
    // the cab window: a raked pane, its front corner rounded, and a narrow one behind the black pillar
    { mat: "cabGlass", front: [[2.22, 1.16], [3.2, 1.8], [3.4, 2.0], [3.5, 2.25]], back: [[2.22, 4.04], [3.5, 4.04]] },
    { mat: "cabMask", front: [[2.22, 3.45], [3.5, 3.45]], back: [[2.22, 3.58], [3.5, 3.58]] },
    // the equipment fairing over the cab section
    { mat: "roofG", front: [[3.78, 2.34], [4.0, 3.0], [4.15, 3.6]], back: [[3.78, 8.7], [4.15, 8.7]] },
    // the locker: its seam and grille panel; the SBB emblem's red square
    { mat: "roofG", front: [[1.57, 4.5], [3.03, 4.5]], back: [[1.57, 5.3], [3.03, 5.3]] },
    { mat: "lockerG", front: [[1.6, 4.525], [3.0, 4.525]], back: [[1.6, 5.275], [3.0, 5.275]] },
    { mat: "red", front: [[3.25, 4.5], [3.6, 4.5]], back: [[3.25, 4.95], [3.6, 4.95]] },
  ],
};

/** [lat, y] points mirrored to the face's other side. */
const kissMirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]);
const KISS_WEDGE: Pt[] = [[0.6, 1.6], [1.6, 1.6], [1.6, 3.62], [1.36, 3.62], [1.06, 2.67], [0.8, 1.99], [0.62, 1.9]];
const KISS_POD: Pt[] = [[0.48, 1.62], [0.55, 1.61], [1.0, 1.68], [1.13, 1.74], [1.17, 1.82], [1.12, 1.9], [0.55, 1.89], [0.48, 1.87]];

/**
 * The KISS's front (photo-ffs-rabe-511120-ziegelbruecke-...jpg head on, the photographs above): upright
 * from the apron to the lamps, the windscreen raked about 37 degrees and the dark dome over it rounding
 * 3.2 m back to the roof. The windscreen is narrower at its foot than at its head; the red runs down
 * from the roof's corners beside it to the chin between two black lamp pods, white wedges coming in
 * from the corners over the pods. White and the number under them, the navy apron with two grilles.
 */
const KISS_FACE: SeriesCabFace = {
  dJoin: 3.2, dSide: 2.6, first: 5.0, roofFrom: 4.4, bulge: 0.1, cols: [6, 4, 1, 1], tolerance: 0.05,
  profile: [[0.6, 0.18], [0.75, 0.05], [1.0, 0], [1.6, 0], [1.9, 0.05], [2.2, 0.2], [2.75, 0.6], [3.47, 1.15], [3.9, 1.5], [4.2, 1.8], [4.45, 2.3], [4.6, 3.2]],
  corner: [[0.6, 0.55], [1.5, 0.6], [2.2, 0.75], [3.35, 0.7], [4.0, 0.55], [4.4, 0.35], [4.6, 0.1]],
  rows: [0.6, 0.75, 1.0, 1.48, 1.6, 2.21, 2.75, 3.47, 3.9, 4.2, 4.45, 4.6],
  bands: () => [[0, 0.75, "skirtG"], [0.75, 1.48, "blue"], [1.48, 1.6, "white"], [1.6, 9, "red"]],
  fields: [
    { mat: "white", pts: KISS_WEDGE }, { mat: "white", pts: kissMirror(KISS_WEDGE) },
    // the dark dome over the windscreen, up to the roof, and the windscreen itself
    { mat: "cabMask", pts: [[-0.73, 2.18], [0.73, 2.18], [0.98, 3.47], [1.04, 3.47], [1.04, 4.9], [-1.04, 4.9], [-1.04, 3.47], [-0.98, 3.47]] },
    { mat: "cabGlass", pts: [[-0.71, 2.21], [0.71, 2.21], [0.95, 3.44], [-0.95, 3.44]] },
    { mat: "cabMask", pts: KISS_POD }, { mat: "cabMask", pts: kissMirror(KISS_POD) },
  ],
  // the windscreen's middle (the distant model's glass) and the destination display
  panes: [{ lat: [-0.7, 0.7], y: [2.21, 3.44], r: 0.02 }, { lat: [-0.68, 0.68], y: [3.54, 3.82], r: 0.02 }],
  decals: [
    // the apron's grilles either side of the coupler
    { mat: "rubber", pts: [[-1.1, 0.86], [-0.64, 0.86], [-0.64, 1.36], [-1.1, 1.36]] }, { mat: "rubber", pts: [[0.64, 0.86], [1.1, 0.86], [1.1, 1.36], [0.64, 1.36]] },
    { mat: "white", pts: [[-0.08, 1.705], [0.08, 1.705], [0.08, 1.735], [-0.08, 1.735]] },
    { mat: "white", pts: [[-0.016, 1.655], [0.016, 1.655], [0.016, 1.785], [-0.016, 1.785]] },
    { mat: "white", pts: [[-0.145, 1.72], [-0.075, 1.655], [-0.075, 1.785]] },
    { mat: "white", pts: [[0.145, 1.72], [0.075, 1.785], [0.075, 1.655]] },
  ],
  lamps: [[-0.73, 1.76, 0.085, "lampHead"], [0.73, 1.76, 0.085, "lampHead"], [-0.93, 1.78, 0.06, "lampHead"], [0.93, 1.78, 0.06, "lampHead"]], roofLamp: [0, 3.98, 0.08],
  number: { lat: -0.17, y: 1.515, h: 0.07, mat: "cabMask" },
  wipers: [[[0.05, 2.25], [0.6, 3.15]]],
};

/** n windows w wide, evenly over d0..d1. */
const kissRow = (d0: number, d1: number, n: number, w: number): Array<[number, number]> =>
  Array.from({ length: n }, (_, i): [number, number] => { const d = d0 + ((d1 - d0) * (i + 0.5)) / n; return [d - w / 2, d + w / 2]; });

/**
 * The KISS's sides (d behind the body's ends; photographs above and photo-sbb-ir-dosto-rabe-512-...jpg
 * in profile, corrected for its perspective): each car's double deck lies between its two doors, the
 * lower windows between them, the upper ones from over the first door to over the second; the
 * mid-floor sections over the bogies have a narrow window each. The end car's first door stands
 * 9 m behind the tip, behind the cab section's locker.
 */
const KISS_END: SeriesLayout = {
  doors: [[5.85, 7.45, 1], [15.75, 17.35, -1]],
  windows: kissRow(8.0, 15.2, 5, 1.05),
  rows: [kissRow(8.0, 15.2, 5, 1.05), kissRow(5.8, 17.2, 7, 1.35), [[3.8, 4.4], [19.1, 19.8]]],
};
const KISS_MIDDLE: SeriesLayout = {
  doors: [[5.93, 7.53, 1], [16.97, 18.57, -1]],
  windows: kissRow(8.03, 16.47, 6, 1.05),
  rows: [kissRow(8.03, 16.47, 6, 1.05), kissRow(5.93, 18.57, 8, 1.32), [[3.48, 4.18], [20.32, 21.02]]],
};

export const SBB_KISS: ShinkansenSeries = {
  ...kiss({ liveries: { sbbRegio: KISS_SBB }, weight: { end: 62, middle: 50 }, power: 1000, maxspeed: 160 }),
  // the side upright to the upper windows' heads, the roof's tight edge above them
  S: 4.1, A: 0.68,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: KISS_FACE,
  // lower deck, upper deck, the mid-floor windows over the bogies
  windows: [[1.32, 2.05], [3.3, 4.05], [2.2, 3.05]], door: [0.68, 2.62, 1.3, 2.5], doorW: 1.6, doorGlassW: 0.28, doorGlassPair: 0.62,
  layout: { end: KISS_END, middle: KISS_MIDDLE },
  // the driving bogie under the cab section, the others under the mid-floor ends; one single-arm pantograph on each end car's rear
  endBogies: [2.5, 20.5], centredBogies: true, bogieCentres: 18.7, endPantograph: true,
};

/**
 * The Allegra's paint (photo-rhb-abe-8-12-allegra-in-pontresina.jpg, photo-allegra-3515-delivered.jpg,
 * photo-rhb-abe-8-12-allegra-between-lagalb-and-ospizio-bernina.jpg): RhB red down to a dark grey
 * skirt, a white line low on the sides (dropping on the face under the lamps), the silver roof
 * fairings coming down over the cab as a hood; the first class marked by a yellow line over its
 * windows. The running number of the Pontresina photograph.
 */
const ALLEGRA_RHB: ShinkansenLivery = {
  title: "RhB red", number: "3502",
  palette: {
    red: c("#cc1426"), white: c("#ecebe6"), yellow: c("#f0b800"), blue: c("#1f4fa0"), black: c("#141516", 0.5),
    roofG: c("#b3b7ba", 0.45), roofDark: c("#3c4044", 0.7), skirtG: c("#2c2f33", 0.75), cabMask: c("#141618", 0.3),
    plough: c("#a4a8ab", 0.55), display: c("#3a2c12", 0.2), doorG: c("#d9dad7"), lettering: c("#f1f1ee"),
  },
  bands: [[0, 1.13, "red"], [1.13, 1.25, "white"], [1.25, 9, "red"]], doors: [[0, 9, "doorG"]],
  roof: "roofG", skirt: "skirtG",
  // d behind the tip: the cab's side window behind the red A-pillar, its front raked with it, in a black frame
  endSweeps: [
    { mat: "cabMask", front: [[1.85, 1.15], [3.15, 1.55]], back: [[1.85, 2.2], [3.15, 2.2]] },
    { mat: "cabGlass", front: [[1.92, 1.2], [3.08, 1.6]], back: [[1.92, 2.13], [3.08, 2.13]] },
  ],
};

/** The Graubuenden arms on the face: the white shield, the Ten Jurisdictions' quarter yellow under four blue squares. */
const ALLEGRA_SHIELD: Pick<SeriesCabFace, "fields" | "decals"> = {
  fields: [
    { mat: "white", pts: [[-0.2, 1.4], [0.2, 1.4], [0.2, 1.06], [0.11, 0.94], [0, 0.89], [-0.11, 0.94], [-0.2, 1.06]] },
    { mat: "yellow", pts: [[0.01, 1.37], [0.17, 1.37], [0.17, 1.17], [0.01, 1.17]] },
  ],
  decals: [
    // the Grey League's black half, the blue round the yellow cross, the ibex
    { mat: "black", pts: [[-0.17, 1.37], [-0.09, 1.37], [-0.09, 1.17], [-0.17, 1.17]] },
    ...([[0.01, 0.08], [0.1, 0.17]] as const).flatMap(([a, b]) => ([[1.17, 1.255], [1.285, 1.37]] as const).map(([y0, y1]) => ({ mat: "blue", pts: [[a, y0], [b, y0], [b, y1], [a, y1]] as Pt[] }))),
    { mat: "black", pts: [[-0.09, 1.12], [0.07, 1.12], [0.09, 1.05], [0.02, 0.99], [-0.06, 0.99], [-0.1, 1.05]] },
  ],
};

/**
 * The Allegra's front (the photographs above and photo-abe-812-luen.jpg head-on): a glass-fibre hood,
 * upright from the snowplough to the windscreen and leaning back a little over it, the silver roof
 * rounding down over its top. A big black mask holds the windscreen and the destination display
 * between red A-pillars that sweep back to the roof's corners; the lamps sit low in black pods at
 * the corners, the canton's arms between them over the white line, the camera and top lamp in a
 * box on the hood.
 */
const ALLEGRA_FACE: SeriesCabFace = {
  dJoin: 1.6, dSide: 1.5, first: 4.4, roofFrom: 3.42, bulge: 0.1, cols: [8, 5, 1, 2], tolerance: 0.015,
  profile: [[0.62, 0.2], [0.72, 0.08], [0.9, 0.02], [1.2, 0], [1.6, 0], [1.85, 0.03], [2.4, 0.1], [3.05, 0.2], [3.3, 0.28], [3.42, 0.37], [3.52, 0.58], [3.6, 0.9], [3.65, 1.25], [3.68, 1.6]],
  // the plan tapers: a flat face about 1.35 m wide between corners 0.62 - 0.68 m across that reach the
  // body's full width about 1.0 m behind the tip low down and about 1.45 m at the windscreen's top
  corner: [[0.62, 0.62], [1.0, 0.62], [1.5, 0.62], [1.9, 0.65], [2.6, 0.66], [3.1, 0.68], [3.3, 0.72], [3.42, 0.8], [3.52, 0.62], [3.6, 0.4], [3.68, 0.1]],
  cornerDepth: [[0.62, 0.9], [1.0, 0.95], [1.5, 0.95], [1.9, 1.0], [2.6, 1.08], [3.1, 1.15], [3.3, 1.12], [3.42, 1.08], [3.52, 0.9], [3.6, 0.6], [3.68, 0.1]],
  rows: [0.62, 0.72, 0.9, 1.02, 1.14, 1.2, 1.27, 1.5, 1.6, 1.76, 1.85, 1.92, 2.4, 2.6, 3.05, 3.12, 3.17, 3.3, 3.36, 3.42, 3.47, 3.52, 3.6, 3.65, 3.68],
  bands: () => [[0, 1.02, "red"], [1.02, 1.14, "white"], [1.14, 9, "red"]],
  ...ALLEGRA_SHIELD,
  masks: [
    { lat: [-0.86, 0.86], y: [1.76, 3.42], r: 0.16, mat: "cabMask" },
    { lat: [-1.05, -0.55], y: [1.27, 1.5], r: 0.09, mat: "cabMask" }, { lat: [0.55, 1.05], y: [1.27, 1.5], r: 0.09, mat: "cabMask" },
    { lat: [-0.28, 0.28], y: [3.47, 3.62], r: 0.05, mat: "cabMask" },
  ],
  panes: [{ lat: [-0.76, 0.76], y: [1.92, 3.12], r: 0.1 }, { lat: [-0.58, 0.58], y: [3.17, 3.36], r: 0.03, mat: "display" }],
  lamps: [[-0.88, 1.385, 0.07, "lampHead"], [-0.66, 1.385, 0.045, "lampHead"], [0.66, 1.385, 0.045, "lampHead"], [0.88, 1.385, 0.07, "lampHead"], [-1.15, 3.3, 0.045, "lampRed"], [1.15, 3.3, 0.045, "lampRed"]],
  roofLamp: [0, 3.545, 0.055],
  wipers: [[[-0.1, 2.06], [0.42, 2.95]]],
};

/** The Allegra's roof fairings (silver, over a dark equipment well), underfloor, snowplough, first-class line, cab door, the middle car's tall window and its folded pantograph. */
function allegraFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const C = 3.68, B = 0.62;
  const x = (d0: number, d1: number) => [Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1))] as const;
  const roof = (spans: ReadonlyArray<readonly [number, number]>) => m.scope("roof fairings", () => {
    for (const [d0, d1] of spans) {
      const [x0, x1] = x(d0, d1);
      block(m, "roofDark", x0, x1, C - 0.12, C + 0.07, -0.55, 0.55);
      block(m, "roofG", x0, x1, C - 0.3, C + 0.12, 0.55, 0.98);
      block(m, "roofG", x0, x1, C - 0.3, C + 0.12, -0.98, -0.55);
    }
  });
  if (car.end) {
    const [x0, x1] = x(car.trucks[0]! + 1.9, car.trucks[1]! - 1.9);
    m.scope("underfloor", () => block(m, "under", x0, x1, B - 0.3, B, -1.0, 1.0));
    roof([[3.4, car.length - 0.35]]);
    const tip = X(-ALLEGRA_FACE.dJoin);
    m.scope("snowplough", () => pilotPlate(m, "plough", 1, tip - 0.02, 0.18, 0.6, 0.95, 0.24, 0.5));
    // the automatic coupler's head over the plough
    m.scope("coupler", () => block(m, "black", tip - 0.1, tip + 0.06, 0.46, 0.68, -0.26, 0.26));
    // the train line's sockets over the lamps: red boxes, a yellow cap on each
    m.scope("sockets", () => {
      for (const z of [-0.6, 0.6]) {
        block(m, "red", tip - 0.24, tip - 0.04, 1.55, 1.74, z - 0.12, z + 0.12);
        block(m, "yellow", tip - 0.06, tip - 0.01, 1.6, 1.69, z - 0.04, z + 0.04);
      }
    });
    for (const sd of [1, -1]) {
      // the yellow line over the first class's windows; the cab door's outline round its narrow window
      m.scope("first class", () => sidePanel(m, b, X, sd, "yellow", 2.4, 6.7, 3.1, 3.22, 0.004, 0.01));
      m.scope("cab door", () => {
        for (const d of [0.7, 1.53]) sidePanel(m, b, X, sd, "rubber", d, d + 0.02, 1.3, 3.1, 0.004, 0.01);
        sidePanel(m, b, X, sd, "rubber", 0.72, 1.53, 3.08, 3.1, 0.004, 0.01);
      });
    }
  } else {
    // the low floor between the bogies leaves no room under it; the AC pantograph folded on the roof
    roof([[0.35, 1.7], [4.4, car.length - 0.35]]);
    const xc = X(3.05);
    m.scope("pantograph", () => {
      block(m, "roofG", xc - 1.2, xc + 1.2, C - 0.06, C + 0.05, -0.85, 0.85);
      singleArm(m, { xc, roofY: C + 0.05, baseY: C + 0.3, h: 1, raised: false });
    });
    // the low-floor bay's window reaches down to the white line
    for (const sd of [1, -1]) m.scope("tall window", () => {
      sidePanel(m, b, X, sd, "rubber", 3.85, 5.25, 1.3, 1.87, 0.006, 0.03);
      sidePanel(m, b, X, sd, "glass", 3.89, 5.21, 1.34, 1.89, 0.012, 0.004);
    });
  }
}

/**
 * The RhB ABe 8/12 Allegra: two motor end cars on Bo'Bo' and a low-floor middle car on two trailer
 * bogies, 49.5 m over the couplers. Layout read from the three side photographs (a projective fit
 * along each car; d behind the body's front, the cab face's join 1.6 m behind the tip): the end car's
 * cab door, two wide first-class windows, the door and three second-class windows; the middle car's
 * four windows, the low-floor bay's double door and two windows. Each end car raises its pantograph
 * for the Bernina line's direct current, over the cab; the middle car's AC pantograph lies folded.
 */
export const ALLEGRA: ShinkansenSeries = {
  endLength: 17.75, midLength: 14.0, W: 1.325, Y: 0.8, S: 3.35, C: 3.68, lean: 0.96, B: 0.62, A: 0.72,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ALLEGRA_FACE,
  cabWindows: [[0.9, 1.33, 1.9, 3.0]],
  windows: [[1.85, 3.05]], windowW: 1.6, pitch: 1.75, door: [0.8, 3.02, 1.85, 2.75], doorW: 1.1, doorGlassW: 0.42,
  layout: {
    end: { doors: [[7.5, 8.6, 1]], windows: [[2.4, 4.45], [4.7, 6.7], [9.9, 11.5], [11.65, 13.3], [13.45, 15.0]] },
    middle: { doors: [[7.65, 8.29, -1], [8.31, 8.95, 1]], windows: [[0.75, 2.15], [2.25, 3.75], [3.85, 5.25], [5.35, 7.0], [10.2, 11.45], [11.55, 12.85]] },
  },
  numberAt: [-5.87, 1.62, 0.17],
  bogieCentres: 10.6, midBogies: [2.5, 11.0], wheelR: 0.4, wheelbase: 2.2, cars: [3], endPantograph: true, pantographAt: 1.4,
  fittings: allegraFittings,
  liveries: { rhb: ALLEGRA_RHB },
  weight: { end: 37, middle: 33 }, power: 1050, maxspeed: 120,
};

const P = { tee: seriesParams(RAE_TEE), arrow: seriesParams(RED_ARROW), icn: seriesParams(ICN), giruno: seriesParams(GIRUNO), dosto: seriesParams(FV_DOSTO), flirt: seriesParams(SBB_FLIRT), kiss: seriesParams(SBB_KISS), allegra: seriesParams(ALLEGRA) };

export function sbbRaeTee(v?: ParamValues): MeshBuilder { return buildSeries(RAE_TEE, P.tee, v); }
export function sbbRaeTeeLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(RAE_TEE, P.tee, v); }
export function sbbRoterPfeil(v?: ParamValues): MeshBuilder { return buildSeries(RED_ARROW, P.arrow, v); }
export function sbbRoterPfeilLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(RED_ARROW, P.arrow, v); }
export function sbbIcn(v?: ParamValues): MeshBuilder { return buildSeries(ICN, P.icn, v); }
export function sbbIcnLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ICN, P.icn, v); }
export function sbbGiruno(v?: ParamValues): MeshBuilder { return buildSeries(GIRUNO, P.giruno, v); }
export function sbbGirunoLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GIRUNO, P.giruno, v); }
export function sbbFvDosto(v?: ParamValues): MeshBuilder { return buildSeries(FV_DOSTO, P.dosto, v); }
export function sbbFvDostoLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(FV_DOSTO, P.dosto, v); }
export function sbbFlirt(v?: ParamValues): MeshBuilder { return buildSeries(SBB_FLIRT, P.flirt, v); }
export function sbbFlirtLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SBB_FLIRT, P.flirt, v); }
export function sbbKiss(v?: ParamValues): MeshBuilder { return buildSeries(SBB_KISS, P.kiss, v); }
export function sbbKissLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(SBB_KISS, P.kiss, v); }
export function rhbAllegra(v?: ParamValues): MeshBuilder { return buildSeries(ALLEGRA, P.allegra, v); }
export function rhbAllegraLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(ALLEGRA, P.allegra, v); }

export const CH_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-sbb-rae-tee", "SBB RAe TEE II", RAE_TEE, P.tee, sbbRaeTee, sbbRaeTeeLod, "sbb-rae-tee", "uic"),
  seriesDesign("proc-vehicle-sbb-roter-pfeil", "SBB Roter Pfeil", RED_ARROW, P.arrow, sbbRoterPfeil, sbbRoterPfeilLod, "sbb-roter-pfeil", "uic"),
  seriesDesign("proc-vehicle-sbb-icn", "SBB ICN", ICN, P.icn, sbbIcn, sbbIcnLod, "sbb-icn", "uic"),
  seriesDesign("proc-vehicle-sbb-giruno", "SBB Giruno", GIRUNO, P.giruno, sbbGiruno, sbbGirunoLod, "sbb-giruno", "uic"),
  seriesDesign("proc-vehicle-sbb-fv-dosto", "SBB FV-Dosto", FV_DOSTO, P.dosto, sbbFvDosto, sbbFvDostoLod, "sbb-fv-dosto", "uic"),
  seriesDesign("proc-vehicle-sbb-flirt", "SBB FLIRT", SBB_FLIRT, P.flirt, sbbFlirt, sbbFlirtLod, "sbb-flirt", "uic"),
  seriesDesign("proc-vehicle-sbb-kiss", "SBB KISS", SBB_KISS, P.kiss, sbbKiss, sbbKissLod, "sbb-kiss", "uic"),
  seriesDesign("proc-vehicle-rhb-allegra", "RhB Allegra", ALLEGRA, P.allegra, rhbAllegra, rhbAllegraLod, "rhb-allegra", "uic"),
];
