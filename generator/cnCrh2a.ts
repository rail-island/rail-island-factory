// The CRH2A (CSR Sifang, 2007; Kawasaki's Shinkansen E2-1000 built for China Railway) on the
// series kit (shinkansen.ts), with its own measured E2 nose as a cab face (seriesCab.ts) in place
// of the generic lofted high-speed nose. See docs/models/china-units.md, "The CRH2A's body".
//
// Measured on assets/cr-crh2a/ (SOURCES.md): photo-crh2a-2377-at-motan-20190420133135.jpg in
// three-quarter view from the side, rectified by a projective fit along the side through the end
// car's and the next two cars' joints (25.7 m and 25 m cars), with the centre line's points moved
// by their lateral offset; photo-crh2a-4028-...jpg and photo-crh2a-2057-...jpg nearly head on
// (scale from the 0.9 m oval coupler cover at 1.0 m); photo-crh2a-2184-...jpg for the door and
// the windows. Published: end car 25.7 m, intermediate cars 25 m, 3.38 m wide (narrowed to the
// Shinkansen gauge's 3.3 m), 3.7 m high, bogie centres 17.5 m, 2.5 m wheelbase, 860 mm wheels.
// Heights over the rail, d behind the nose's tip (the front of the oval cover), lat from the centre.
//
// The nose (9.2 m to the full section): the oval coupler cover standing forward at 1.0 m, the
// skirt set back under it; the bonnet rising at about 25 degrees to the canopy's foot 2.2 m back,
// the canopy's windscreen raked back to its top at 3.25 m 3.6 m back, the roof reaching 3.7 m at
// the join. In plan the lower nose is a broad, blunt snout full width about 6 m back; the upper
// nose round the canopy narrower than the body. The canopy's foot painted CRH blue, a band thick
// at the centre tapering back along its sides to a point; the headlights in a light strip inside
// the top of its glass. The side's blue band, under the windows, dips ahead of the door to end in
// a point under the cab's side window. Large windows, one per two rows of seats.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { crownPane } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import { c, nose } from "./seriesHelpers.ts";

/** Where the nose meets the body's own section; the passenger door follows at once. */
const J = 9.2;
/** The side's blue band under the windows. */
const BAND: readonly [number, number] = [1.8, 1.96];
/** The passenger door behind the nose (d behind the tip). */
const DOOR: readonly [number, number] = [9.45, 10.35];

/** The centre line [y, d]: the skirt set back under the oval cover, the tip at 1.0 m, the bonnet, the raked windscreen and the roof. */
const PROFILE: Pt[] = [
  [0.66, 0.16], [0.75, 0.07], [0.88, 0.015], [1.05, 0], [1.22, 0.03], [1.35, 0.11], [1.46, 0.26],
  [1.6, 0.5], [1.8, 0.85], [2.0, 1.25], [2.2, 1.65], [2.4, 2.0], [2.6, 2.35], [2.8, 2.65], [3.0, 2.95], [3.2, 3.3],
  [3.35, 3.75], [3.45, 4.3], [3.53, 5.0], [3.6, 5.8], [3.65, 6.7], [3.68, 7.7], [3.7, J],
];
/** How far back along the car each height reaches the full width (behind its centre line): the broad lower snout, the upper nose tapering round the canopy. */
const DEPTH: Pt[] = [[0.66, 3.2], [0.8, 3.4], [1.05, 3.6], [1.46, 3.9], [1.8, 4.5], [2.3, 5.1], [2.6, 5.1], [3.0, 4.9], [3.2, 4.6], [3.35, 4.6], [3.45, 4.0], [3.53, 3.4], [3.6, 2.6], [3.65, 1.8], [3.68, 1.1], [3.7, 0.05]];
/** The upper nose narrower than the body round the canopy, flaring out to the side behind it. */
const INSET: Pt[] = [[1.5, 0], [1.8, 0.04], [2.1, 0.18], [2.4, 0.34], [2.7, 0.42], [3.0, 0.4], [3.25, 0.3], [3.45, 0.14], [3.6, 0.05], [3.7, 0]];

/** A polygon from its right half ([lat, y], from the bottom of the centre line to its top), mirrored. */
const mirror = (half: Pt[]): Pt[] => [...half, ...half.slice(1, -1).reverse().map(([l, y]): Pt => [-l, y])];
/** The canopy's outline head on: its blue foot, its sides running back to a point, its top. */
const CANOPY_LOW: Pt[] = [[0, 2.27], [0.4, 2.29], [0.65, 2.35], [0.82, 2.46], [0.92, 2.6], [0.96, 2.72]];
const CANOPY_TOP: Pt[] = [[0.96, 2.74], [0.93, 2.88], [0.84, 3.0], [0.66, 3.1], [0.4, 3.15], [0, 3.17]];
/** The glass: above the blue, which thins toward the canopy's tail. */
const GLASS_LOW: Pt[] = [[0, 2.43], [0.4, 2.45], [0.65, 2.49], [0.82, 2.57], [0.92, 2.66], [0.955, 2.73]];
const GLASS_TOP: Pt[] = [[0.955, 2.74], [0.92, 2.86], [0.83, 2.97], [0.65, 3.06], [0.4, 3.11], [0, 3.13]];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 0.7, 0.95, 1.15, 1.4, BAND[0], BAND[1], 1.55, 1.7, 1.85, 1.9, 2.27, 2.38, 2.43, 2.55, 2.75, 2.9, 2.98, 3.06, 3.13, 3.17, 3.25])].sort((a, b) => a - b);

const FACE: SeriesCabFace = {
  dJoin: J, dSide: J - 0.05, reach: 0, first: DOOR[0] + 1.0, roofFrom: 9, cols: [1, 12, 2, 1], tolerance: 0.02,
  profile: PROFILE,
  // a round nose: the corner is the whole half width, as deep as the table says
  corner: [[0.66, 2.0], [3.7, 2.0]],
  cornerDepth: DEPTH,
  planInset: INSET,
  rows: ROWS,
  bands: () => [[0, 9, "white"]],
  wrap: true,
  lodGlass: { hw: 0.85, y: [2.43, 3.1] },
  paint: [
    // the cab's side window behind the canopy's tail, its top edge sloping down toward the front
    { mat: "cabMask", front: [[1.83, 6.17], [2.3, 6.32], [2.36, 6.5], [2.4, 6.97]], back: [[1.83, 7.03], [2.4, 7.03]] },
    { mat: "cabGlass", front: [[1.86, 6.21], [2.28, 6.35], [2.33, 6.52], [2.37, 6.94]], back: [[1.86, 7.0], [2.37, 7.0]] },
  ],
  fields: [
    // the canopy: the blue foot round it, the dark rim, the glass and the headlights' strip inside its top
    { mat: "blue", pts: [...CANOPY_LOW, ...CANOPY_TOP.slice(1), ...[...CANOPY_TOP.slice(0, -1)].reverse().slice(0, -1).map(([l, y]): Pt => [-l, y]), ...[...CANOPY_LOW].reverse().slice(0, -1).map(([l, y]): Pt => [-l, y])] },
    { mat: "cabMask", pts: mirror([[0, 2.41], [0.4, 2.43], [0.65, 2.47], [0.83, 2.55], [0.935, 2.65], [0.97, 2.74], [0.945, 2.88], [0.855, 3.0], [0.67, 3.1], [0.4, 3.155], [0, 3.175]]) },
    { mat: "canopyGlass", pts: mirror([...GLASS_LOW, ...GLASS_TOP.slice(1)]) },
    { mat: "lampStrip", pts: mirror([[0, 2.98], [0.55, 2.98], [0.66, 3.02], [0.68, 3.05], [0.65, 3.06], [0.4, 3.11], [0, 3.13]]) },
  ],
  // the oval coupler cover: its seam, the cover and the split down its middle
  masks: [
    { lat: [-0.96, 0.96], y: [0.67, 1.5], r: 0.4, mat: "seam" },
    { lat: [-0.935, 0.935], y: [0.695, 1.475], r: 0.38, mat: "white" },
  ],
  panes: [{ lat: [-0.012, 0.012], y: [0.695, 1.475], r: 0, mat: "seam" }],
  lamps: [[-0.36, 3.04, 0.055, "lampHead"], [-0.2, 3.045, 0.055, "lampHead"], [0.2, 3.045, 0.055, "lampHead"], [0.36, 3.04, 0.055, "lampHead"]],
  wipers: [[[0.2, 2.47], [0.6, 2.72]], [[-0.55, 2.5], [-0.15, 2.75]]],
};

const WHITE = "#f1f2f0";
const BLUE = "#2350a8";

/** The CRH livery: white, the blue band under the windows dipping to a point ahead of the door (both sides of the end car, and on the nose). */
const LIVERY: ShinkansenLivery = {
  title: "CRH blue",
  palette: {
    white: c(WHITE), blue: c(BLUE), roofG: c("#e1e3e4", 0.6), skirtG: c("#ebeceb", 0.5), cabMask: c("#1d1f22", 0.3), seam: c("#4a4e54", 0.6),
    lampStrip: c("#c4cad0", 0.25), roofBox: c("#c9cdd0", 0.5), roofTrough: c("#8f9498", 0.6), panCover: c("#c0c4c7", 0.45),
    // the canopy's glass: a grey-blue sheen in the photographs, the cab seen through it
    canopyGlass: { color: "#3c4652", metallic: 0.3, roughness: 0.08, glass: true },
  },
  bands: [[0, BAND[0], "white"], [BAND[0], BAND[1], "blue"], [BAND[1], 9, "white"]],
  roof: "roofG", skirt: "skirtG", number: "CRH2A-2377",
  endSweeps: [
    // the band left out ahead of the door
    { mat: "white", front: [[BAND[0] - 0.05, -9], [BAND[1] + 0.05, -9]], back: [[BAND[0] - 0.05, DOOR[0]], [BAND[1] + 0.05, DOOR[0]]], face: true },
    // the band dipping from the door to its point under the cab's side window
    { mat: "blue", front: [[1.53, 6.3], [1.55, 6.3], [BAND[1], DOOR[0] + 0.05]], back: [[1.53, 6.3], [BAND[0], DOOR[0]], [BAND[0] + 0.01, DOOR[0] + 0.15], [BAND[1], DOOR[0] + 0.15]], face: true },
  ],
};

/** The end car's roof: a row of light equipment covers in a grey trough, from behind the canopy back toward the inner end. */
function fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  if (car.end) m.scope("roof covers", () => {
    const [d0, d1] = [DOOR[0] - J + 0.1, 14.4];
    for (const sd of [1, -1]) crownPane(m, b, X, sd, "roofTrough", [d0, d1], [0, 0.55], 0.004);
    const n = 10, pitch = (d1 - d0) / n;
    for (let i = 0; i < n; i++) {
      const [a, e] = [d0 + i * pitch + 0.12, d0 + (i + 1) * pitch - 0.12];
      block(m, "roofBox", Math.min(X(a), X(e)), Math.max(X(a), X(e)), CRH2A.C - 0.03, CRH2A.C + 0.13, -0.44, 0.44);
    }
  });
  if (car.end) m.scope("skirt", () => {
    // the skirt under the oval cover, set back under it and ending ahead of the leading bogie's wheels:
    // its top ring just inside the face's bottom edge, its bottom ring behind and narrower
    const ring = (pts: readonly Pt[]): Array<[number, number]> => [...pts.map(([d, l]): [number, number] => [X(d - J), l]), ...[...pts].reverse().map(([d, l]): [number, number] => [X(d - J), -l])];
    const top = ring([[2.6, 1.2], [1.85, 1.07], [1.2, 0.87], [0.6, 0.58], [0.3, 0.3], [0.24, 0]]);
    const bottom = ring([[2.6, 1.08], [1.9, 1.0], [1.25, 0.86], [0.9, 0.62], [0.78, 0.3], [0.76, 0]]);
    // counter-clockwise seen from above
    const [lo, hi] = [bottom.reverse(), top.reverse()];
    m.loft("white", lo, 0.22, hi, 0.69);
    m.cap("seam", lo, 0.22, false);
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), CRH2A.B - 0.35, CRH2A.B, -CRH2A.W * 0.8, CRH2A.W * 0.8));
}

/** Large windows, one for two rows of seats, 1.9 m apart; the end car's door behind the nose, the intermediate car's at both ends. */
const endWindows: Array<[number, number]> = [...Array.from({ length: 6 }, (_, i): [number, number] => [10.9 + 1.9 * i - J, 12.4 + 1.9 * i - J]), [22.25 - J, 23.0 - J]];
const midWindows: Array<[number, number]> = Array.from({ length: 9 }, (_, i): [number, number] => [3.83 + 1.92 * i, 5.35 + 1.92 * i]);

export const CRH2A: ShinkansenSeries = {
  endLength: 25.7, midLength: 25.0, W: 1.62, Y: 1.45, S: 3.0, C: 3.7, lean: 0.96, B: 0.66, A: 1.05,
  nose: nose(0.1, 1, 2, [[0, 3.7]], [[0, 3.0]], [[0, 1.45]], [[0, 1.05]], [[0, 0.66]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: FACE, fittings,
  windows: [[2.0, 2.68]], windowW: 1.5, pitch: 1.9, door: [1.3, 3.1, 2.3, 2.85], doorW: 0.9, doorGlassW: 0.26,
  layout: {
    end: { doors: [[DOOR[0] - J, DOOR[1] - J, 1]], windows: endWindows },
    middle: { doors: [[2.2, 3.1, -1], [21.95, 22.85, 1]], windows: midWindows },
  },
  // a small window high over the first window's front
  sidePanels: { end: [{ d: [10.95, 11.3], y: [2.78, 2.95], kind: "window" }] },
  // the single-arm pantograph standing on its dish-shaped cover (the E2-1000's), on the fourth and sixth cars
  pantographCover: { len: 0.7, hw: 0.3, top: [1.7, 0.62], h: 0.42, mat: "panCover" },
  pantographCars: (n) => (n === 8 ? [2, 4] : undefined),
  // the leading bogie under the nose, 17.5 m ahead of the rear one (3.5 m in from the inner end)
  endBogies: [25.45 - 3.5 - 17.5 - J, 25.45 - 3.5 - J],
  bogieCentres: 17.5, wheelR: 0.43, wheelbase: 2.5,
  liveries: { crh: LIVERY },
  weight: { end: 46, middle: 44 }, power: 1050, maxspeed: 250,
};
