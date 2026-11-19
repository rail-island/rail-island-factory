// The Talgo III coach set (Renfe, 1964 - 2010; the TER-era Talgo III and its Talgo III RD
// derivative), unpowered, drawn on the series kit (shinkansen.ts) with the tail car's own end
// (seriesCab.ts): short, low riveted aluminium cars - boxes of 11.1 m - each resting at its joints
// on one wheel pair ("rodal") shared with the next car, the tail car ("coche de cola", second class)
// on two: its own under the tail and the joint's. The tail is a bowed, upright end under a riveted
// dome, the red window band between dark lines carried round it, the red door off to one side with its
// porthole, the marker lamps high and low, buffers low under the face. The stainless body is ribbed
// lengthwise below and above the red band and over the roof (the window band itself is smooth); the
// joints are closed by a dark rubber shroud over the whole section.
//
// Each car: the vestibule's door at one end with a big round window and the folding steps under
// it, then the saloon's windows, then the air-conditioning block's louvred hatch at the other end
// ("el salon ... aislado ... por la plataforma de acceso y por el otro por el espacio que alberga el
// aseo y el bloque de climatizacion"). The tail car: the dome, the guard's high window right behind
// it, two windows, the door, one window, the joint; a plain rubbing strip low along its front half.
//
// Matched to the photographs in assets/talgo-iii/ (SOURCES.md): the tail car and two more cars
// side-on at Granada (TG1-26; a 1-D projective fit through the joints, the cars' 11.6 m pitch and the
// bodies' heights - about 171 px/m vertically at the tail car's windows, 114 px/m at the first
// intermediate car - gives the positions below), the tail head-on at Bilbao (1B19; 181 px/m by the
// red band), the tail three-quarter at Irun, the RD's tail at Perpignan, and the figures of
// "Adios al Talgo III" (Via Libre: 11.1 m boxes, the set framed by a one-axle van and the two-axle
// tail car, 140 km/h raised to 160 km/h). See docs/models/spain-trains.md.
//
// Heights over the rail; d behind the body's front end (the tail's join, the dome's foot) on the tail
// car, behind the body's +X end (the tail-ward end) on an intermediate car.

import type { Pt } from "./sliceLoft.ts";
import type { SeriesSidePanel, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";

/** The body's section: half width, the skirt's bottom and top, the belly, the shoulder (where the side ribs end), the crown (Granada, 171 px/m). */
const W = 1.47;
const B = 0.4;
const A = 0.6;
const Y = 1.3;
const S = 3.12;
const C = 3.4;
/** The red band and its dark lines (Granada side and Bilbao face). */
const LOW_LINE: [number, number] = [1.32, 1.37];
const HIGH_LINE: [number, number] = [2.36, 2.41];
/** The dome's foot on the tail: a dark line round the face only. */
const DOME_LINE: [number, number] = [2.78, 2.82];
/** The tail's depth from its tip to the body's own section (the dome's foot along the roof). */
const JOIN = 0.9;
/** A car's pitch (the 11.1 m box and its joint) and the tail car's length over its buffers to the joint. */
const MID_LENGTH = 11.6;
const END_LENGTH = 13.14;
/** The body of the tail car behind its join: END_LENGTH less the buffers' gap (0.65), the join and half a joint (0.25). */
const END_BODY = END_LENGTH - 0.65 - JOIN - 0.25;

/** Talgo's silver and red, read from photo-bf-granada-talgo-iii-endwagen-tg1-26.jpg: the stainless lower body and roof, the red window band between dark lines. */
const LIVERY: ShinkansenLivery = {
  title: "Talgo", number: "1B19",
  palette: { roofG: c("#b9bdc0", 0.6), skirtG: c("#3a3d40", 0.75), cabMask: c("#1d1f22", 0.3), silver: c("#c3c7ca"), red: c("#c8282e"), line: c("#2e3033"), flute: c("#9ea3a7") },
  bands: [[0, LOW_LINE[0], "silver"], [LOW_LINE[0], LOW_LINE[1], "line"], [LOW_LINE[1], HIGH_LINE[0], "red"], [HIGH_LINE[0], HIGH_LINE[1], "line"], [HIGH_LINE[1], 9, "silver"]],
  roof: "roofG", skirt: "skirtG",
  // the doors carry the body's band and lines (Granada, Irun)
  doors: [[0, LOW_LINE[0], "silver"], [LOW_LINE[0], LOW_LINE[1], "line"], [LOW_LINE[1], HIGH_LINE[0], "red"], [HIGH_LINE[0], HIGH_LINE[1], "line"], [HIGH_LINE[1], 9, "silver"]],
};

/** The windows: sill and head (0.75 m, in the red band), their corner radius. */
const WIN: [number, number] = [1.45, 2.2];
/** The tail car's high window behind the dome (the guard's lookout), above the band. */
const HIGH_WIN: [number, number] = [2.1, 2.78];
/** The door: sill (the folding steps under it), head, and its round window. */
const DOOR: [number, number] = [0.67, 2.63];
const PORTHOLE: [number, number] = [1.42, 2.14];

/** The intermediate car (Granada, the car behind the tail): the A/C hatch, four wide windows (1.5 m at 1.95 m), the door with its porthole at the far end. */
const MID_WINDOWS: Array<[number, number]> = [[2.0, 3.48], [3.95, 5.45], [5.92, 7.44], [7.85, 9.34]];
const MID_DOOR: [number, number] = [9.64, 10.67];
const AC: [number, number] = [0.49, 1.66];
/** The tail car (Granada and Irun): the high window, two narrower windows, the door, one more window. */
const END_WINDOWS: Array<[number, number]> = [[3.65, 4.61], [5.11, 6.07], [9.06, 10.03]];
const END_DOOR: [number, number] = [7.1, 8.06];
const END_HIGH: [number, number] = [0.14, 1.2];

/** A louvre column on the A/C hatch: vertical slots, as the Granada photograph shows them. */
const louvres = (d0: number, d1: number, y: readonly [number, number], n: number): SeriesSidePanel[] =>
  Array.from({ length: n }, (_, i): SeriesSidePanel => { const w = (d1 - d0) / n; return { d: [d0 + i * w + 0.02, d0 + (i + 1) * w - 0.02], y, kind: "panel", mat: "black" }; });
/** The folding steps' cover under a door: its outline. */
const steps = (d: readonly [number, number]): SeriesSidePanel => ({ d: [d[0] + 0.04, d[1] - 0.04], y: [B + 0.06, DOOR[0] - 0.03], kind: "seam" });

/** Side fittings (d behind the car's front; the tail car's behind the tip, the face's join added). */
const MID_PANELS: SeriesSidePanel[] = [
  // the A/C block's hatch: its outline, two louvred columns low, two small vents high in the band
  { d: AC, y: [B + 0.1, 2.95], kind: "seam" },
  ...louvres(AC[0] + 0.08, AC[0] + 0.53, [0.62, 1.25], 5),
  ...louvres(AC[1] - 0.53, AC[1] - 0.08, [0.62, 1.25], 5),
  { d: [AC[0] + 0.15, AC[0] + 0.45], y: [2.17, 2.25], kind: "panel", mat: "black" },
  { d: [AC[1] - 0.45, AC[1] - 0.15], y: [2.17, 2.25], kind: "panel", mat: "black" },
  steps(MID_DOOR),
];
const END_PANELS: SeriesSidePanel[] = [
  // the plain rubbing strip low along the front half (Granada, Irun)
  { d: [JOIN + 0.2, JOIN + 5.4], y: [0.78, 0.93], kind: "panel", mat: "silver" },
  { d: [END_DOOR[0] + JOIN + 0.04, END_DOOR[1] + JOIN - 0.04], y: [B + 0.06, DOOR[0] - 0.03], kind: "seam" },
];

/** The tail's dome seams: thin riveted lines over the dome from its foot up toward the crown, stopping inside the roof's arc (Bilbao). */
const seam = (lat: number, top: number): { mat: string; pts: readonly Pt[] } => ({ mat: "flute", pts: [[lat - 0.012, DOME_LINE[1]], [lat + 0.012, DOME_LINE[1]], [lat + 0.012, top], [lat - 0.012, top]] });

/**
 * The Talgo III's tail: a bowed, upright end with rounded corners and no windscreen under its riveted
 * dome, the red band round it, the red door off to one side with its porthole, the marker lamps
 * high and low, the number. Read from photo-s00-199-bf-bilbao-abando-talgo-iii-endwagen.jpg (181 px/m).
 */
const TAIL: SeriesCabFace = {
  // dJoin clears the face's top corners (profile + bow + corner radius), so none of it is pressed into the join plane
  dJoin: JOIN, dSide: 0.7, first: 2.2, roofFrom: 3.2,
  profile: [[B, 0.09], [0.55, 0.03], [0.75, 0], [2.55, 0], [2.78, 0.05], [2.95, 0.14], [3.12, 0.3], [3.28, 0.55], [C, JOIN]],
  corner: [[B, 0.45], [2.78, 0.45], [3.12, 0.25], [C, 0.02]], bulge: 0.1, cols: [6, 3, 1, 1],
  rows: [B, 0.55, 0.75, 1.17, LOW_LINE[0], LOW_LINE[1], 1.9, HIGH_LINE[0], HIGH_LINE[1], DOME_LINE[0], DOME_LINE[1], 2.95, 3.12, 3.28, C],
  // the face's bands: the sides', and the dark line at the dome's foot
  bands: (l) => [...l.bands.filter(([, top]) => top <= HIGH_LINE[1]), [HIGH_LINE[1], DOME_LINE[0], "silver"], [DOME_LINE[0], DOME_LINE[1], "line"], [DOME_LINE[1], 9, "silver"]],
  masks: [{ lat: [-0.88, -0.3], y: [1.17, 2.78], r: 0.08, mat: "red" }],
  panes: [],
  decals: [
    // the door's outline
    { mat: "line", pts: [[-0.9, 1.15], [-0.87, 1.15], [-0.87, 2.8], [-0.9, 2.8]] },
    { mat: "line", pts: [[-0.31, 1.15], [-0.28, 1.15], [-0.28, 2.8], [-0.31, 2.8]] },
    { mat: "line", pts: [[-0.865, 2.77], [-0.315, 2.77], [-0.315, 2.8], [-0.865, 2.8]] },
    // the dome's riveted seams
    seam(-0.85, 3.22), seam(-0.25, 3.34), seam(0.25, 3.34), seam(0.85, 3.22),
  ],
  // the porthole, then the marker lamps: two high, a white and a red one low
  lamps: [[-0.59, 2.48, 0.22, "cabGlass"], [-1.12, 2.6, 0.07, "lampRed"], [0.3, 2.6, 0.07, "lampRed"], [-1.0, 1.16, 0.1, "lampHead"], [0.05, 1.12, 0.09, "lampRed"]],
  number: { lat: 0.7, y: 1.9, h: 0.16, mat: "white" },
};

export const TALGO_III: ShinkansenSeries = {
  endLength: END_LENGTH, midLength: MID_LENGTH, W, Y, S, C, lean: 0.97, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0],
  windows: [WIN, HIGH_WIN], windowW: 1.5, pitch: 1.95, windowCornerR: 0.08, windowFrameMat: "frameSilver",
  door: [DOOR[0], DOOR[1], PORTHOLE[0], PORTHOLE[1]], doorW: 1.0, doorGlassW: PORTHOLE[1] - PORTHOLE[0], doorGlassR: (PORTHOLE[1] - PORTHOLE[0]) / 2,
  layout: {
    end: { doors: [[END_DOOR[0], END_DOOR[1], 1]], windows: END_WINDOWS, rows: [undefined, [END_HIGH]] },
    middle: { doors: [[MID_DOOR[0], MID_DOOR[1], 1]], windows: MID_WINDOWS, rows: [undefined, []] },
  },
  sidePanels: { end: END_PANELS, middle: MID_PANELS },
  // one wheel pair under each joint, shared by the two cars (the "rodal"); the tail car's own under the tail, 2.9 m behind its tip
  jacobs: true, wheelbase: 0, wheelR: 0.4, bogieCentres: END_BODY + 0.25 - 2.0, endBogies: [2.0, END_BODY + 0.25],
  // a lone car keeps a wheel pair of its own 0.85 m inside each inner end (its frame within the body)
  loneJointAxleInset: 0.85,
  // the dark rubber shroud over the whole section at each joint, just inside the bodies
  jointShroudProfile: [[-1.3, B + 0.05], [1.3, B + 0.05], [1.4, 0.9], [1.4, 2.9], [1.15, 3.2], [0.6, C - 0.06], [-0.6, C - 0.06], [-1.15, 3.2], [-1.4, 2.9], [-1.4, 0.9]],
  cars: [4, 8], minCars: 3, traction: "none",
  liveries: { talgo: LIVERY },
  // the cars' tare (Talgo's light aluminium boxes); 160 km/h from the 1970s (140 km/h at first)
  weight: { end: 14, middle: 12 }, power: 0, maxspeed: 160,
  // the tail: its face, the buffers low out of its apron (no beam), their heads wide flat plates (Bilbao, Perpignan)
  cabFace: TAIL, endCoupler: "buffers", couplerY: 0.82, bufferBeam: false, bufferHeadShape: "rect",
  // the stainless body's ribs below and above the red band (the window band smooth), the roof's
  fluting: [{ y0: B + 0.06, y1: LOW_LINE[0] - 0.03, pitch: 0.075, mat: "flute" }, { y0: HIGH_LINE[1] + 0.04, y1: S - 0.04, pitch: 0.075, mat: "flute" }],
  roofRibs: { pitch: 0.13, zMax: 1.3, mat: "flute" },
  // no underfloor box: the floor is the body's bottom, low between the wheel pairs
  fittings: () => {},
};
