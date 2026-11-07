// Japanese conventional-line electric units on the series kit (shinkansen.ts):
// JR East's E235 (the Yamanote line, 2015) and JNR's 103 series commuter cars
// (1963), Odakyu's Romancecar GSE (2018), Kintetsu's Hinotori (2020), the E259
// Narita Express (2009), JNR's 485 series bonnet-nosed express (1964) and the
// Hankyu 9000 series (2006). Each
// an end car, a middle car and a train of 3 - 8. Their narrow-gauge (1,067 mm)
// bodies keep their real 2.8 - 2.95 m width within the UIC gauge, on the game's
// standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge").
// See docs/models/jp-emus.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { paint } from "./dieselParts.ts";
import type { Pt } from "./sliceLoft.ts";
import type { NoseShape } from "./carbodyKit.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

const c = (hex: string, r = 0.4) => paint(hex, r);
const nose = (len: number, tip: number, power: number, C: Pt[], S: Pt[], Y: Pt[], A: Pt[], B: Pt[]): NoseShape => ({ len, tip, power, C, S, Y, A, B });
/** A flat cab front's mask and three panes across a w-wide end, lamps low at its corners. */
const flatCab = (w: number, y0: number, y1: number, mask: string, lampY: number) => ({
  mask: [y0 - 0.2, y1 + 0.15, mask] as const,
  panes: [[0.25, w - 0.12, y0, y1], [-0.2, 0.2, y0 - 0.25, y1 + 0.05], [-(w - 0.12), -0.25, y0, y1]] as Array<[number, number, number, number]>,
  lamps: [[-(w - 0.3), lampY, 0.08, "lampHead"], [w - 0.3, lampY, 0.08, "lampHead"], [-(w - 0.15), lampY, 0.05, "lampRed"], [w - 0.15, lampY, 0.05, "lampRed"]] as Array<[number, number, number, string]>,
});
const NO_NOSE = nose(0.1, 1, 2, [[0, 3.6]], [[0, 3.3]], [[0, 1.3]], [[0, 1.1]], [[0, 1.0]]);

export const E235: ShinkansenSeries = {
  endLength: 20.0, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.2, C: 3.62, lean: 0.98, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.475, 1.95, 2.85, "mask", 1.45),
  windows: [[1.95, 2.75]], windowW: 1.1, pitch: 1.35, door: [1.15, 3.05, 1.95, 2.7], doorW: 1.3, doorCount: 4,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    yamanote: { title: "Yamanote green", palette: { ss: c("#c5c9cc", 0.3), green: c("#9acd32"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.24, "green"], [1.24, 2.9, "ss"], [2.9, 3.0, "green"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "TOU-01" },
    yokosuka: { title: "Yokosuka blue", palette: { ss: c("#c5c9cc", 0.3), blue: c("#1d3f80"), cream: c("#e5d9b6"), mask: c("#1d1f22", 0.3), roofG: c("#b9bdc0", 0.5), skirtG: c("#5d6266") }, bands: [[0, 1.12, "ss"], [1.12, 1.2, "cream"], [1.2, 1.3, "blue"], [1.3, 2.9, "ss"], [2.9, 3.0, "blue"], [3.0, 9, "ss"]], roof: "roofG", skirt: "skirtG", number: "F-01" },
  },
  weight: { end: 28, middle: 33 }, power: 560, maxspeed: 120,
};

// --- JNR 103 series (S103) ------------------------------------------------
// The low-cab Kuha 103 as it ran from the 1970s (photo-kuha103-1.jpg, photo-1986-kuha103-149.jpg,
// photo-jnr-ec-tc103-188.jpg, photo-l25-tc103-178-680.jpg; assets/jnr-103/SOURCES.md): the flat,
// upright steel front without a gangway door, its three windscreens in one recessed frame, the
// twin sealed-beam headlights in a housing on the forehead between the train-number box (left)
// and the destination box (right), the tail lights in round housings low at the corners; the
// AU75 air conditioner and the flat ventilators on the roof, the PS16 diamond pantograph on the
// Moha. Lateral positions are seen from ahead (the viewer's right positive), heights over the rail,
// d behind the face (measured at 235 px/m on the head-on photo of Kuha 103-188).

/** The 103's door pitch along the side (4.78 m, a projective fit over the four doors of Kuha 103-178). */
const S103_PITCH = 4.78;
/** Where the face meets the body's own section, behind the face (the forehead's round over into the roof). */
const S103_JOIN = 0.35;
/** The door centres: the Kuha's d behind its face, the intermediate car's d behind its body's end. */
const S103_END_DOORS = [0, 1, 2, 3].map((i) => 2.52 + S103_PITCH * i);
const S103_MID_DOORS = [0, 1, 2, 3].map((i) => 2.58 + S103_PITCH * i);

/** One car side's windows from its door centres: a door-pocket window beside each door, a pair of sashes between them, one window and its pocket at the car's plain end. */
function s103Windows(doors: readonly number[], end: "cab" | "plain", L: number): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  if (end === "cab") out.push([doors[0]! - 0.65 - 0.63, doors[0]! - 0.65 - 0.2]);
  else out.push([doors[0]! - 0.65 - 1.7, doors[0]! - 0.65 - 0.78], [doors[0]! - 0.65 - 0.63, doors[0]! - 0.65 - 0.2]);
  for (let i = 0; i + 1 < doors.length; i++) {
    const e = doors[i]! + 0.65;
    out.push([e + 0.2, e + 0.63], [e + 0.78, e + 1.7], [e + 1.78, e + 2.7], [e + 2.85, e + 3.28]);
  }
  const e = doors[doors.length - 1]! + 0.65;
  out.push([e + 0.2, e + 0.63], [e + 0.78, Math.min(e + 1.7, L - 0.2)]);
  return out;
}

const S103_LAYOUT = {
  end: {
    doors: S103_END_DOORS.map((c, i): [number, number, number] => [c - 0.65 - S103_JOIN, c + 0.65 - S103_JOIN, i % 2 ? -1 : 1]),
    windows: s103Windows(S103_END_DOORS, "cab", 19.5).map(([a, b]): [number, number] => [a - S103_JOIN, b - S103_JOIN]),
  },
  middle: {
    doors: S103_MID_DOORS.map((c, i): [number, number, number] => [c - 0.65, c + 0.65, i % 2 ? -1 : 1]),
    windows: s103Windows(S103_MID_DOORS, "plain", 19.5),
  },
};

/** The 103's flat front (all positions measured on photo-jnr-ec-tc103-188.jpg). */
const S103_FACE: SeriesCabFace = {
  // the coupler plane 0.13 m ahead of the face, so that the step plate over the coupler reaches it
  dJoin: S103_JOIN, dSide: 0.2, reach: 0.13, roofFrom: 9,
  // upright from the body's foot to the forehead, rounding over into the roof
  profile: [[1.0, 0], [3.3, 0], [3.45, 0.02], [3.55, 0.07], [3.61, 0.15], [3.65, S103_JOIN]],
  corner: [[1.0, 0.13], [3.3, 0.13], [3.55, 0.09], [3.65, 0.04]], cols: [6, 3, 1, 1],
  rows: [1.0, 1.12, 1.3, 1.75, 2.03, 2.45, 2.89, 3.1, 3.3, 3.45, 3.55, 3.61, 3.65],
  masks: [
    // the windscreens' recessed frame, its H-rubber, the number and destination boxes
    { lat: [-1.3, 1.3], y: [2.03, 2.89], r: 0.08, mat: "recess" },
    { lat: [-1.24, 1.24], y: [2.09, 2.85], r: 0.06, mat: "sash" },
    { lat: [-1.1, -0.54], y: [2.97, 3.21], r: 0.1, mat: "frameSilver" },
    { lat: [-1.07, -0.57], y: [3.0, 3.18], r: 0.08, mat: "blind" },
    { lat: [0.48, 1.16], y: [2.96, 3.33], r: 0.1, mat: "frameSilver" },
    { lat: [0.51, 1.13], y: [2.99, 3.3], r: 0.08, mat: "blind" },
  ],
  // three windscreens of one height, the two pillars between them narrow
  panes: [{ lat: [-1.21, -0.43], y: [2.12, 2.82], r: 0.04 }, { lat: [-0.39, 0.39], y: [2.12, 2.82], r: 0.03 }, { lat: [0.43, 1.21], y: [2.12, 2.82], r: 0.04 }],
  texts: [{ text: "21T", lat: -0.82, y: 3.04, h: 0.1, mat: "black" }, { text: "TOKYO", lat: 0.82, y: 3.09, h: 0.11, mat: "black" }],
  pods: [
    // the twin sealed-beam headlights' housing on the forehead
    { lat: 0, y: 3.445, w: 0.56, h: 0.3, r: 0.14, proud: 0.06, depth: 0.05, mat: "body", level: true, lamps: [[-0.135, 0.085, "lampHead"], [0.135, 0.085, "lampHead"]] },
    // the tail lights' round housings low at the corners
    { lat: -1.11, y: 1.23, w: 0.2, h: 0.2, proud: 0.05, depth: 0.04, mat: "body", lamps: [[0, 0.07, "lampRed"]] },
    { lat: 1.11, y: 1.23, w: 0.2, h: 0.2, proud: 0.05, depth: 0.04, mat: "body", lamps: [[0, 0.07, "lampRed"]] },
    // the two footsteps under the windscreens and the step plate over the coupler
    { lat: -0.41, y: 1.81, w: 0.16, h: 0.035, r: 0.01, proud: 0.05, depth: 0.03, mat: "body" },
    { lat: 0.39, y: 1.81, w: 0.16, h: 0.035, r: 0.01, proud: 0.05, depth: 0.03, mat: "body" },
    { lat: 0, y: 1.12, w: 0.46, h: 0.04, r: 0.01, proud: 0.12, depth: 0.03, mat: "body" },
  ],
  wipers: [[[0.82, 2.15], [0.57, 2.62]], [[-0.82, 2.15], [-0.57, 2.62]]],
};

/** The roof's equipment, the gutters and the window sashes, and the underfloor box (the series' fittings). */
function s103Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length, j = car.end ? S103_JOIN : 0, C = S103.C;
  // the equipment boxes between the bogies, not one long case: the Moha's control and resistor boxes, the Kuha's few
  const boxes: ReadonlyArray<readonly [number, number, number, number]> = car.end
    ? [[4.6, 6.4, 0.55, 1.1], [7.6, 8.6, 0.4, 0.9], [10.4, 12.6, 0.6, 1.15], [13.2, 13.9, 0.45, 0.6]]
    : [[4.5, 6.9, 0.6, 1.15], [7.4, 9.3, 0.55, 1.1], [9.8, 11.2, 0.5, 1.15], [11.7, 13.9, 0.62, 1.15]];
  m.scope("underfloor", () => {
    block(m, "under", X(car.trucks[1]! - 1.9), X(car.trucks[0]! + 1.9), S103.B - 0.12, S103.B, -S103.W * 0.8, S103.W * 0.8);
    boxes.forEach(([d0, d1, h, hw], i) => m.scope(`box ${i + 1}`, () => block(m, "under", X(d1 - j), X(d0 - j), S103.B - h, S103.B - 0.12, -hw, hw)));
  });
  // the AU75 air conditioner across the middle of the roof: a low box, its top chamfered
  const au: Array<[number, number]> = [[-1.0, C - 0.22], [1.0, C - 0.22], [1.0, C + 0.22], [0.85, C + 0.36], [-0.85, C + 0.36], [-1.0, C + 0.22]];
  const mid = (car.end ? 9.75 - j : L / 2);
  m.scope("air conditioner", () => {
    m.sweep("au75", "x", au, X(mid + 2.3), au, X(mid - 2.3));
    // its louvres along both sides
    for (const z of [1, -1]) block(m, "louvre", X(mid + 1.9), X(mid - 1.9), C + 0.02, C + 0.18, z > 0 ? 1.0 : -1.012, z > 0 ? 1.012 : -1.0);
  });
  // the flat ventilators on the crown
  const vent: Array<[number, number]> = [[-0.38, C - 0.12], [0.38, C - 0.12], [0.38, C + 0.08], [0.25, C + 0.15], [-0.25, C + 0.15], [-0.38, C + 0.08]];
  const vents = car.end ? [1.9, 4.4, 14.9, 17.4].map((d) => d - j) : [2.9, 5.4, 14.1];
  m.scope("ventilators", () => vents.forEach((d, i) => m.scope(`ventilator ${i + 1}`, () => m.sweep("au75", "x", vent, X(d + 0.5), vent, X(d - 0.5)))));
  // the rain gutters along the roof's edges
  m.scope("gutters", () => { for (const sd of [1, -1]) sidePanel(m, b, X, sd, "body", 0.05, L - 0.05, S103.S - 0.06, S103.S - 0.01, 0.02, 0.03); });
  // the two-pane windows' aluminium sashes: the meeting rail of the lowering upper and the rising lower sash
  const rows = car.end ? S103_LAYOUT.end.windows : S103_LAYOUT.middle.windows;
  const [w0, w1] = S103.windows[0]!;
  m.scope("sashes", () => {
    for (const sd of [1, -1]) for (const [a, e] of rows) if (e - a > 0.6)
      for (const [p, q, y0, y1] of [[a + 0.03, e - 0.03, 2.38, 2.42], [a + 0.03, e - 0.03, w0 + 0.03, w0 + 0.065], [a + 0.03, e - 0.03, w1 - 0.065, w1 - 0.03], [a + 0.03, a + 0.065, w0 + 0.065, w1 - 0.065], [e - 0.065, e - 0.03, w0 + 0.065, w1 - 0.065]] as const)
        sidePanel(m, b, X, sd, "frameSilver", p, q, y0, y1, 0.016, 0.006);
  });
  if (car.end) m.scope("crew door", () => {
    // the crew door behind the cab, its window and grab rail
    for (const sd of [1, -1]) {
      const [d0, d1] = [0.45 - j, 1.03 - j];
      for (const [a, e, y0, y1] of [[d0, d0 + 0.02, 1.03, 2.97], [d1 - 0.02, d1, 1.03, 2.97], [d0, d1, 2.95, 2.97], [d0, d1, 1.03, 1.05]] as const)
        sidePanel(m, b, X, sd, "rubber", a, e, y0, y1, 0.005, 0.004);
      sidePanel(m, b, X, sd, "rubber", d0 + 0.1, d1 - 0.1, 2.02, 2.8, 0.007, 0.03);
      sidePanel(m, b, X, sd, "glass", d0 + 0.13, d1 - 0.13, 2.05, 2.77, 0.012, 0.004);
      sidePanel(m, b, X, sd, "frameSilver", d1 + 0.06, d1 + 0.09, 1.5, 2.6, 0.018, 0.008);
    }
  });
}

/** The 103's paint: one colour all over, the roof grey; the recess, the blinds and the roof units. */
const s103Palette = (body: string, recess: string) => ({ body: c(body, 0.45), recess: c(recess, 0.5), cabMask: c(body, 0.45), blind: c("#f2f1ea", 0.4), sash: c("#8c9194", 0.4), black: c("#1d1f22", 0.5), au75: c("#b4b8ba", 0.55), louvre: c("#6b6f72", 0.6), roofG: c("#8f9396", 0.65), skirtG: c("#2a2c2f") });

export const S103: ShinkansenSeries = {
  // 20.0 m over the couplers, a 19.5 m body 2.832 m wide (Wikipedia "103 series"), its sides upright
  endLength: 20.0, midLength: 20.0, W: 1.416, Y: 1.2, S: 3.22, C: 3.65, lean: 0.99, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: S103_FACE, layout: S103_LAYOUT,
  windows: [[1.97, 2.78]], windowW: 0.92, pitch: 1.2, door: [1.17, 2.97, 2.08, 2.85], doorW: 1.3, doorCount: 4, doorGlassW: 0.4, doorGlassPair: 0.65,
  // DT33 / TR64 bogies 13.8 m apart, centred on the 19.5 m body; the PS16 over the Moha's rear bogie, one
  // in the 4-car Kuha-Moha-Moha-Kuha set (the Moha 102 has none)
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond", pantographAt: 16.5, onePantograph: true,
  endBogies: [2.85 - S103_JOIN, 16.65 - S103_JOIN], midBogies: [2.85, 16.65], fittings: s103Fittings,
  liveries: {
    chuo: { title: "Chuo orange", palette: s103Palette("#f15a22", "#c94a1b"), bands: [[0, 9, "body"]], roof: "roofG", skirt: "body", number: "KUHA 103-1" },
    yamanote: { title: "Yamanote green", palette: s103Palette("#9acd32", "#7eaa28"), bands: [[0, 9, "body"]], roof: "roofG", skirt: "body", number: "KUHA 103-271" },
  },
  weight: { end: 30, middle: 40 }, power: 440, maxspeed: 100,
};

export const GSE: ShinkansenSeries = {
  endLength: 19.6, midLength: 16.0, W: 1.45, Y: 1.25, S: 3.0, C: 3.55, lean: 0.96, B: 0.9, A: 1.05,
  // the observation front: a long rounded nose of glass, the driver's cab over the saloon
  nose: nose(3.2, 0.25, 2.4, [[0, 1.5], [0.4, 2.2], [1.6, 3.0], [2.8, 3.45], [3.6, 3.55]], [[0, 1.45], [0.4, 2.05], [1.6, 2.7], [2.8, 2.95], [3.6, 3.0]], [[0, 1.35], [1.0, 1.25]], [[0, 1.25], [1.0, 1.05]], [[0, 1.2], [0.5, 0.9]]),
  windscreen: [0.45, 2.7, 0.07, 1.25], lamps: [0.5, 1.45],
  windows: [[1.85, 2.75]], windowW: 1.6, pitch: 1.95, door: [1.15, 3.0, 1.85, 2.6], doorW: 0.9,
  bogieCentres: 9.5, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    rose: { title: "Rose vermilion", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#c8102e") }, bands: [[0, 1.6, "red"], [1.6, 1.68, "white"], [1.68, 9, "red"]], roof: "red", skirt: "skirtG", number: "70051" },
    lse: { title: "LSE colours", palette: { orange: c("#e86a1f"), grey: c("#7d8084"), white: c("#f2f2ef"), roofG: c("#e4e4e1", 0.5), skirtG: c("#7d8084") }, bands: [[0, 1.6, "grey"], [1.6, 1.7, "white"], [1.7, 2.8, "orange"], [2.8, 2.86, "white"], [2.86, 9, "grey"]], roof: "roofG", skirt: "skirtG", number: "7001" },
  },
  weight: { end: 36, middle: 30 }, power: 380, maxspeed: 110,
};

export const HINOTORI: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.4, Y: 1.25, S: 3.0, C: 3.68, lean: 0.95, B: 0.95, A: 1.05,
  // the metallic red nose leaning out under its big curved windscreen
  nose: nose(2.6, 0.2, 2.2, [[0, 1.6], [0.3, 2.2], [1.4, 3.0], [2.4, 3.5], [3.0, 3.68]], [[0, 1.55], [0.3, 2.05], [1.4, 2.7], [2.4, 2.95], [3.0, 3.0]], [[0, 1.4], [1.0, 1.25]], [[0, 1.3], [0.8, 1.05]], [[0, 1.25], [0.4, 0.95]]),
  windscreen: [0.35, 2.3, 0.07, 1.15], lamps: [0.45, 1.5],
  windows: [[1.8, 2.8]], windowW: 1.5, pitch: 1.85, door: [1.15, 3.0, 1.85, 2.6], doorW: 0.9,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    hinotori: { title: "Hinotori red", palette: { red: c("#8e1b22", 0.25), gold: c("#c9a55a", 0.3), roofG: c("#8e1b22", 0.4), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "red"], [1.5, 1.54, "gold"], [1.54, 9, "red"]], roof: "roofG", skirt: "skirtG", number: "HV01" },
    ace: { title: "Ace orange", palette: { orange: c("#e46c1d"), navy: c("#1d2a4a"), white: c("#efefea"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "navy"], [1.5, 1.56, "white"], [1.56, 2.9, "orange"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "HV02" },
  },
  weight: { end: 46, middle: 44 }, power: 300, maxspeed: 130,
};

export const E259: ShinkansenSeries = {
  endLength: 20.5, midLength: 20.0, W: 1.475, Y: 1.3, S: 3.1, C: 3.65, lean: 0.97, B: 0.95, A: 1.1,
  // the raked nose, its gangway door, the cab windows wrapping round
  nose: nose(2.2, 0.45, 2.6, [[0, 2.2], [0.4, 2.85], [1.4, 3.35], [2.2, 3.65]], [[0, 2.15], [0.4, 2.7], [1.4, 3.0], [2.2, 3.1]], [[0, 1.6], [0.8, 1.3]], [[0, 1.3], [0.6, 1.1]], [[0, 1.2], [0.3, 0.95]]),
  windscreen: [0.15, 1.6, 0.07, 1.25], lamps: [0.25, 1.6],
  windows: [[1.9, 2.75]], windowW: 1.4, pitch: 1.75, door: [1.15, 3.0, 1.9, 2.6], doorW: 1.0,
  bogieCentres: 13.8, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    nex: { title: "Narita Express", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.5, "grey"], [1.5, 1.62, "red"], [1.62, 1.8, "white"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-1" },
    original: { title: "NEX 2009", palette: { white: c("#f3f3f0"), red: c("#c8102e"), black: c("#1d1f22", 0.35), grey: c("#9aa0a5"), roofG: c("#e4e4e1", 0.5), skirtG: c("#3a3b3d") }, bands: [[0, 1.6, "white"], [1.6, 1.8, "red"], [1.8, 2.9, "black"], [2.9, 9, "white"]], roof: "roofG", skirt: "skirtG", number: "KURO E259-2" },
  },
  weight: { end: 44, middle: 41 }, power: 540, maxspeed: 130,
};

export const S485: ShinkansenSeries = {
  endLength: 21.0, midLength: 20.5, W: 1.45, Y: 1.35, S: 3.25, C: 3.9, lean: 0.97, B: 1.0, A: 1.1,
  // the bonnet nose: a rounded hood ahead of the raised cab, its headlight on top
  nose: nose(2.4, 0.3, 2.3, [[0, 1.9], [0.3, 2.25], [1.2, 2.45], [2.1, 2.55], [2.35, 3.25], [2.9, 3.7], [3.4, 3.9]], [[0, 1.85], [0.3, 2.1], [1.2, 2.3], [2.1, 2.4], [2.6, 3.1], [3.4, 3.25]], [[0, 1.6], [1.0, 1.4]], [[0, 1.4], [0.6, 1.1]], [[0, 1.3], [0.4, 1.0]]),
  windscreen: [2.4, 3.0, 0.07, 1.1], lamps: [0.6, 1.95],
  windows: [[1.9, 2.75]], windowW: 1.0, pitch: 1.2, door: [1.15, 3.0, 1.95, 2.6], doorW: 0.7,
  bogieCentres: 14.15, wheelR: 0.43, wheelbase: 2.1, pantograph: "diamond",
  liveries: {
    jnr: { title: "JNR express", palette: { cream: c("#efe3c2"), red: c("#b5202b"), roofG: c("#7d8084", 0.6), skirtG: c("#b5202b") }, bands: [[0, 1.45, "red"], [1.45, 1.92, "cream"], [1.92, 2.75, "red"], [2.75, 9, "cream"]], roof: "cream", skirt: "skirtG", number: "KUHA 481-1" },
    kyushu: { title: "JR Kyushu red", palette: { red: c("#c8102e"), white: c("#f2f2ef"), roofG: c("#7d8084", 0.6), skirtG: c("#3a3b3d") }, bands: [[0, 1.45, "white"], [1.45, 9, "red"]], roof: "red", skirt: "skirtG", number: "KUHA 481-201" },
  },
  weight: { end: 41, middle: 44 }, power: 480, maxspeed: 120,
};

export const HANKYU9000: ShinkansenSeries = {
  endLength: 19.0, midLength: 19.0, W: 1.375, Y: 1.3, S: 3.2, C: 3.65, lean: 0.985, B: 1.0, A: 1.1,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.375, 1.95, 2.8, "cabMask", 1.4),
  windows: [[1.95, 2.8]], windowW: 1.0, pitch: 1.25, door: [1.15, 3.0, 1.95, 2.7], doorW: 1.3, doorCount: 3,
  bogieCentres: 13.0, wheelR: 0.43, wheelbase: 2.1,
  liveries: {
    maroon: { title: "Hankyu maroon", palette: { maroon: c("#5a1418", 0.3), ivory: c("#e8e0c8"), cabMask: c("#5a1418", 0.3), roofG: c("#e8e0c8", 0.5), skirtG: c("#2a2c2f") }, bands: [[0, 3.05, "maroon"], [3.05, 9, "ivory"]], roof: "roofG", skirt: "skirtG", number: "9000" },
    allMaroon: { title: "Plain maroon", palette: { maroon: c("#5a1418", 0.3), cabMask: c("#5a1418", 0.3), roofG: c("#7d8084", 0.6), skirtG: c("#2a2c2f") }, bands: [[0, 9, "maroon"]], roof: "roofG", skirt: "skirtG", number: "9300" },
  },
  weight: { end: 32, middle: 36 }, power: 600, maxspeed: 115,
};

const P = { e235: seriesParams(E235), s103: seriesParams(S103), gse: seriesParams(GSE), hinotori: seriesParams(HINOTORI), e259: seriesParams(E259), s485: seriesParams(S485), hankyu: seriesParams(HANKYU9000) };

export function jrE235(v?: ParamValues): MeshBuilder { return buildSeries(E235, P.e235, v); }
export function jrE235Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E235, P.e235, v); }
export function jnr103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function jnr103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function odakyuGse(v?: ParamValues): MeshBuilder { return buildSeries(GSE, P.gse, v); }
export function odakyuGseLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(GSE, P.gse, v); }
export function kintetsuHinotori(v?: ParamValues): MeshBuilder { return buildSeries(HINOTORI, P.hinotori, v); }
export function kintetsuHinotoriLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HINOTORI, P.hinotori, v); }
export function jrE259(v?: ParamValues): MeshBuilder { return buildSeries(E259, P.e259, v); }
export function jrE259Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(E259, P.e259, v); }
export function jnr485(v?: ParamValues): MeshBuilder { return buildSeries(S485, P.s485, v); }
export function jnr485Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S485, P.s485, v); }

export function hankyu9000(v?: ParamValues): MeshBuilder { return buildSeries(HANKYU9000, P.hankyu, v); }
export function hankyu9000Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(HANKYU9000, P.hankyu, v); }

export const JP_EMU_SERIES: Record<string, ShinkansenSeries> = {
  "proc-vehicle-jr-e235": E235, "proc-vehicle-jnr-103": S103, "proc-vehicle-odakyu-gse": GSE,
  "proc-vehicle-kintetsu-hinotori": HINOTORI, "proc-vehicle-jr-e259": E259, "proc-vehicle-jnr-485": S485, "proc-vehicle-hankyu-9000": HANKYU9000,
};

export const JP_EMUS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-jr-e235", "JR E235", E235, P.e235, jrE235, jrE235Lod, "jr-e235", "uic"),
  seriesDesign("proc-vehicle-jnr-103", "JNR 103 series", S103, P.s103, jnr103, jnr103Lod, "jnr-103", "uic"),
  seriesDesign("proc-vehicle-odakyu-gse", "Odakyu Romancecar GSE", GSE, P.gse, odakyuGse, odakyuGseLod, "odakyu-gse", "uic"),
  seriesDesign("proc-vehicle-kintetsu-hinotori", "Kintetsu Hinotori", HINOTORI, P.hinotori, kintetsuHinotori, kintetsuHinotoriLod, "kintetsu-hinotori", "uic"),
  seriesDesign("proc-vehicle-jr-e259", "JR E259 Narita Express", E259, P.e259, jrE259, jrE259Lod, "jr-e259", "uic"),
  seriesDesign("proc-vehicle-jnr-485", "JNR 485 series", S485, P.s485, jnr485, jnr485Lod, "jnr-485", "uic"),
  seriesDesign("proc-vehicle-hankyu-9000", "Hankyu 9000 series", HANKYU9000, P.hankyu, hankyu9000, hankyu9000Lod, "hankyu-9000", "uic"),
];
