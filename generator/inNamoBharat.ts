// The NCRTC Namo Bharat (Delhi - Meerut RRTS) on the series kit (shinkansen.ts), its
// aerodynamic cab drawn as a cab face (seriesCab.ts). Alstom (ex-Bombardier, Savli) built,
// standard gauge, cars about 22 m long and 3.2 m wide, 180 km/h design speed. Read from the
// photographs in assets/ncrtc-namo-bharat/ (SOURCES.md). See docs/models/india-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";

/** Where the cab face meets the body, behind the tip; the crew door just behind it; the first passenger window. */
const JOIN = 4.3;
const CAB_DOOR: readonly [number, number] = [4.45, 5.2];
const FIRST_WINDOW = 5.75;

/**
 * The livery (photo-rrts-train.jpg, photo-rrts-namo-bharat-arrive-ghaziabad-vtkt.jpg,
 * photo-sarai-kale-khan-rrts-station.jpg): a light silver-grey body, the windows in a dark band, a
 * thin red line under it, and on each cab side a red triangle pointing forward and down from the crew
 * door (its foot on the red line) to a point behind the lamps.
 */
const RED_TOP = 3.05;
const RED_FRONT: Pt[] = [[1.3, 2.6], [RED_TOP, 4.37]];
const RED_BACK: Pt[] = [[1.3, 2.6], [1.6, 4.37], [RED_TOP, 4.37]];
const NAMO_LIVERY: ShinkansenLivery = {
  title: "Namo Bharat", number: "RRTS 001",
  palette: {
    silver: c("#c9cdd0", 0.35), red: c("#c8262d"), band: c("#2b2f33", 0.3), roofG: c("#a3a8ac", 0.5), skirtG: c("#55595d", 0.7), cabMask: c("#15171a", 0.25),
    screen: c("#1b2026", 0.08), logo: c("#2d4d8f"), amber: c("#f2a03a", 0.4), lampBox: c("#15171a", 0.3),
  },
  bands: [[0, 1.6, "silver"], [1.6, 1.68, "red"], [1.68, 2.78, "band"], [2.78, 9, "silver"]],
  roof: "roofG", skirt: "skirtG",
  endSweeps: [
    // the cab's sides silver back to the first window, the crew door in it
    { mat: "silver", front: [[1.68, -9], [2.85, -9]], back: [[1.68, FIRST_WINDOW - 0.15], [2.85, FIRST_WINDOW - 0.15]] },
    // the red triangle: its forward edge raked down to the bumper, its back edge the crew door's front
    { mat: "red", front: RED_FRONT, back: RED_BACK, top: RED_TOP },
  ],
};

/**
 * The cab (the three front three-quarter photographs): a rounded bumper standing out at the bottom,
 * narrower than the body, its top lip at about 1.95 m; above it the face rakes back about 35 degrees
 * to the roof, nearly all of it the black windscreen - a trapezoid from the lamps at 2.15 m, its
 * lower corners holding the round headlights in black pockets, narrowing to the crown, the amber
 * destination display under its head. Deep elliptic corners round the nose in plan.
 */
const NAMO_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 3.4, first: FIRST_WINDOW + 0.2, roofFrom: 9, reach: 0.25, cols: [8, 6, 1, 2], tolerance: 0.015,
  profile: [[0.72, 0.62], [0.82, 0.3], [0.95, 0.12], [1.1, 0.03], [1.3, 0], [1.6, 0], [1.75, 0.04], [1.87, 0.13], [1.95, 0.3], [2.02, 0.5], [2.15, 0.66], [2.4, 0.98], [2.8, 1.5], [3.2, 2.08], [3.5, 2.6], [3.72, 3.08], [3.86, 3.5], [3.95, 3.9], [4.0, JOIN]],
  corner: [[0.72, 0.85], [1.9, 0.85], [2.05, 0.9], [3.2, 0.95], [3.8, 0.7], [4.0, 0.1]],
  cornerRatio: [[0.72, 1.6], [1.9, 1.6], [2.05, 1.8], [3.2, 1.8], [3.8, 1.4], [4.0, 1.0]],
  rows: [0.72, 0.82, 0.95, 1.1, 1.3, 1.42, 1.5, 1.6, 1.75, 1.87, 1.95, 2.02, 2.15, 2.4, 2.8, 3.2, 3.5, 3.72, 3.86, 3.95, 4.0],
  bands: () => [[0, 0.82, "skirtG"], [0.82, 2.1, "silver"], [2.1, 9, "screen"]],
  // the distant nose silver round its glass (lodGlass)
  lodBands: [[0, 0.82, "skirtG"], [0.82, 9, "silver"]],
  paint: [
    // silver all over below the windscreen, round the corners and back along the cab sides
    { mat: "silver", front: [[0.82, -9], [4.0, -9]], back: [[0.82, 99], [4.0, 99]] },
    // the red triangle on the cab's sides (the livery's sweep, drawn again over the face's silver)
    { mat: "red", front: RED_FRONT, back: RED_BACK, top: RED_TOP },
  ],
  fields: [
    // the windscreen's black surround and its glass, wrapping round the corners and narrowing to the crown
    { mat: "cabMask", pts: [[-1.2, 2.06], [1.2, 2.06], [1.34, 2.3], [0.95, 3.55], [0.68, 4.02], [-0.68, 4.02], [-0.95, 3.55], [-1.34, 2.3]] },
    { mat: "screen", pts: [[-0.8, 2.3], [0.8, 2.3], [1.08, 2.5], [0.84, 3.5], [0.6, 3.92], [-0.6, 3.92], [-0.84, 3.5], [-1.08, 2.5]] },
    // the lamp pockets at the windscreen's lower corners, slanted up the corners
    { mat: "lampBox", pts: [[-1.42, 2.04], [-0.84, 2.04], [-0.84, 2.26], [-1.1, 2.46], [-1.44, 2.34]] },
    { mat: "lampBox", pts: [[0.84, 2.04], [1.42, 2.04], [1.44, 2.34], [1.1, 2.46], [0.84, 2.26]] },
  ],
  decals: [
    // the destination display under the windscreen's head
    { mat: "amber", pts: [[-0.48, 3.36], [0.48, 3.36], [0.48, 3.47], [-0.48, 3.47]] },
  ],
  panes: [],
  lodGlass: { hw: 0.95, y: [2.15, 3.95] },
  lamps: [[-1.04, 2.2, 0.11, "lampHead"], [1.04, 2.2, 0.11, "lampHead"], [-1.3, 2.2, 0.05, "lampRed"], [1.3, 2.2, 0.05, "lampRed"]],
  texts: [{ text: "NCRTC", lat: 0.1, y: 1.42, h: 0.13, mat: "logo" }],
  wipers: [[[0.12, 2.32], [0.66, 2.95]]],
};

export const NAMO_BHARAT: ShinkansenSeries = {
  endLength: 22.5, midLength: 22.0, W: 1.6, Y: 1.3, S: 3.3, C: 4.0, lean: 0.96, B: 0.72, A: 0.92,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: NAMO_FACE,
  windows: [[1.74, 2.72]], windowW: 1.55, pitch: 1.85, door: [1.1, 3.0, 1.74, 2.72], doorW: 1.4, doorCount: 3, doorGlassW: 0.5,
  // the crew door behind the cab face, its window
  sidePanels: { end: [{ d: CAB_DOOR, y: [1.12, 3.0], kind: "seam" }, { d: [CAB_DOOR[0] + 0.15, CAB_DOOR[1] - 0.15], y: [2.05, 2.75], kind: "window" }] },
  bogieCentres: 15.0, wheelR: 0.43, wheelbase: 2.5, cars: [3, 6],
  liveries: { namoBharat: NAMO_LIVERY },
  weight: { end: 45, middle: 42 }, power: 900, maxspeed: 180,
};

const P = seriesParams(NAMO_BHARAT);

export function ncrtcNamoBharat(v?: ParamValues): MeshBuilder { return buildSeries(NAMO_BHARAT, P, v); }
export function ncrtcNamoBharatLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(NAMO_BHARAT, P, v); }
