// The LEW Hennigsdorf Bo'Bo' 15 kV 16.7 Hz locomotives of the Deutsche
// Reichsbahn: the DR 243 (DB 143 after 1992) and the faster DR 212 / DB 112 on
// the same body, as one design with a `livery` parameter for vlakosimdb's four
// models: DR red with the white line (dr_243), the DB 143 S-Bahn orange and
// white (db_143), the DB 143 verkehrsrot (db_143vr) and the DB 112 (db_112).
// The 112 differs in its gearing and its bogie pivots (8.4 m against 8.5 m).
//
// Native coordinates (every canvas 0.1 m a pixel; the body spans 0.6 .. 16.0 m
// of the 17 m side canvas): column px -> x = (84 - px) / 10 (the texture centred on column 84), row r -> y = 6.0 -
// r / 10. 16.64 m over the buffers, a 15.34 m body, 3.3 m bogie wheelbase,
// 1.25 m wheels (assets/dr-243/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";

const px = (p: number) => (84 - p) / 10;
const cols = (a: number, b: number): [number, number] => [px(b), px(a)];

interface Livery {
  title: string;
  source: string;
  number: string;
  numberSource: string;
  palette: LocoSpec["palette"];
  side: readonly Band[];
  end: readonly Band[];
  /** The machine room's ribs: [y0, y1, material]. */
  ribs: ReadonlyArray<readonly [number, number, string]>;
  extraSide?: readonly SideItem[];
  extraEnd?: readonly EndItem[];
  /** Half the distance between the bogie pivots. */
  pivot: number;
}

export const DR243_LIVERIES = {
  dr243: {
    title: "DR 243",
    source: "dr_243",
    number: runningNumber("243", "864"),
    numberSource: "photo-243-864.jpg, in this livery",
    palette: { red: c("#a40c0c"), rib: c("#8a0606"), roofEdge: { color: "#58595b", roughness: 0.75 } },
    // dr_243 z_dec column 60: rows 46-50 red, 45 white, 24-44 red ribs; column 20 (cab): 43-45 white
    side: [[0.9, 1.4, "red"], [1.4, 1.5, "white"], [1.5, 3.9, "red"]],
    // x_both column 3: rows 47-51 the dark buffer beam, 46 white, 44-45 lamps, 43 white, 34-42 red
    end: [[0.9, 1.3, "black"], [1.3, 1.7, "white"], [1.7, 3.9, "red"]],
    ribs: [[1.55, 3.62, "rib"]],
    extraSide: [{ kind: "paint", name: "cab white band", x: [5.4, 7.3], y: [1.5, 1.7], mat: "white", mirror: true }],
    pivot: 4.25,
  },
  db143: {
    title: "DB 143 S-Bahn",
    source: "db_143",
    number: runningNumber("143", "617"),
    numberSource: "illustrative, a unit photographed in S-Bahn paint",
    palette: { orange: c("#f07800"), ribOrange: c("#ff9024"), ribWhite: c("#c4c4c4"), yellow: c("#f0c800") },
    // db_143 column 60: rows 46-50 white, 44-45 yellow, 34-43 orange ribs, 24-33 white ribs
    side: [[0.9, 1.4, "white"], [1.4, 1.6, "yellow"], [1.6, 2.6, "orange"], [2.6, 3.9, "white"]],
    end: [[0.9, 1.3, "black"], [1.3, 1.6, "yellow"], [1.6, 2.5, "orange"], [2.5, 3.9, "white"]],
    ribs: [[1.65, 2.55, "ribOrange"], [2.65, 3.62, "ribWhite"]],
    pivot: 4.25,
  },
  db143vr: {
    title: "DB 143",
    source: "db_143vr",
    number: runningNumber("143", "837"),
    numberSource: "illustrative, a unit photographed in verkehrsrot",
    palette: { red: c("#e01414"), rib: c("#f04040"), grey: c("#707274", 0.6) },
    // db_143vr column 60: rows 46-50 grey, 25-45 red ribs; x_both column 3: 39-41 white
    side: [[0.9, 1.4, "grey"], [1.4, 3.9, "red"]],
    end: [[0.9, 1.3, "black"], [1.3, 1.8, "red"], [1.8, 2.1, "white"], [2.1, 3.9, "red"]],
    ribs: [[1.45, 3.62, "rib"]],
    pivot: 4.25,
  },
  db112: {
    title: "DB 112",
    source: "db_112",
    number: runningNumber("112", "139"),
    numberSource: "illustrative, an ex-DR 212 of the class",
    palette: { red: c("#d8001c"), rib: c("#f0101c") },
    // db_112 column 60: rows 25-50 red ribs; x_both: the white chevron under the windscreens (rows 34-42)
    side: [[0.9, 3.9, "red"]],
    end: [[0.9, 1.3, "black"], [1.3, 3.9, "red"]],
    ribs: [[1.45, 3.62, "rib"]],
    extraEnd: [{ kind: "paint", name: "chevron", z: [-1.45, 1.45], y: [1.8, 2.58], poly: [[-1.45, 2.58], [-1.45, 2.3], [0, 1.8], [1.45, 2.3], [1.45, 2.58]], mat: "white" }],
    pivot: 4.2,
  },
} as const satisfies Record<string, Livery>;

export const DR243_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "dr243",
  values: Object.entries(DR243_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const DR243_NUMBER = DR243_LIVERIES.dr243.number;

// ---------------------------------------------------------------------------
// The body (XML of dr_243: alongz, alongx)

export const BUFFERS = 16.64 / 2;
const NOSE = 7.7;
const TIP = [[0.9, NOSE], [2.0, NOSE], [2.9, NOSE - 0.1], [3.6, NOSE - 0.2], [3.8, NOSE - 0.5], [3.9, NOSE - 1.1]] as const;
const HW = [[0.9, 1.5], [3.5, 1.5], [3.7, 1.42], [3.9, 1.18]] as const;
/** A flat end with rounded corners 0.35 m back (the XML plan is a rectangle; photographs). */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.6, 0.03], [w * 0.85, 0.1], [w * 0.95, 0.2], [w, 0.35]] as const;

function spec(l: Livery): LocoSpec {
  return {
    palette: { roof: { color: "#58595b", roughness: 0.75 }, black: c("#1d1d1f", 0.7), plate: c("#202022", 0.6), ...l.palette },
    y0: 0.9,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "side",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: BUFFERS,
    beam: NOSE - 0.05,
    frame: { y0: 0.8, y1: 0.9, half: NOSE - 0.05, hw: 1.45, mat: "black" },
    bogies: [-l.pivot, l.pivot].map((xc) => ({ xc, axles: [-1.65, 1.65], wheelR: 0.625, frameTop: 0.76 })),
    pantograph: { kind: "singleArm", x: 4.6, roofY: 3.9, baseY: 4.05 },
    hvLine: { x: 2.9, y: 4.15, z: 0.5 },
    sideItems: [
      ...(l.extraSide ?? []),
      // the machine room's horizontal ribs (columns 40-129)
      ...l.ribs.map(([y0, y1, mat], i): SideItem => ({ kind: "ribs", name: `ribs ${i + 1}`, x: [-4.4, 4.4], y: [y0, y1], pitch: 0.2, mat })),
      // the grilles along the roof's edge (rows 21-23)
      { kind: "grille", name: "roof grille 1", x: cols(28, 69), y: [3.64, 3.86], slats: "v", pitch: 0.1 },
      { kind: "grille", name: "roof grille 2", x: cols(73, 100), y: [3.64, 3.86], slats: "v", pitch: 0.1 },
      { kind: "grille", name: "roof grille 3", x: cols(112, 141), y: [3.64, 3.86], slats: "v", pitch: 0.1 },
      // the cab: the window (columns 15-22), the door between the seams at columns 30 and 37
      { kind: "window", name: "cab window", x: cols(15, 22), y: [2.7, 3.4], mat: "rim", mirror: true },
      { kind: "door", name: "door", x: cols(30, 37), y: [1.25, 3.5], rails: true, mirror: true },
      { kind: "plate", name: "number", x: cols(80, 89), y: [1.6, 1.9] },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.05, 1.4], y: [2.62, 3.5], mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.4, -0.05], y: [2.62, 3.5], mat: "rim", wiper: true },
      ...(l.extraEnd ?? []),
      { kind: "lamp", name: "top headlight", z: [-0.1, 0.1], y: [2.4, 2.56], r: 0.1, mat: "lampHead" },
      { kind: "lamp", name: "headlight left", z: [0.79, 0.91], y: [1.49, 1.61], r: 0.06 },
      { kind: "lamp", name: "headlight right", z: [-0.91, -0.79], y: [1.49, 1.61], r: 0.06 },
      { kind: "lamp", name: "tail lamp left", z: [1.19, 1.31], y: [1.49, 1.61], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.31, -1.19], y: [1.49, 1.61], r: 0.05, mat: "lampRed" },
      { kind: "plate", name: "number", z: [-0.4, 0.4], y: [1.3, 1.45] },
    ],
    roofItems: [],
    underItems: [[-1.8, 1.8, 0.35, 0.8, 1.1]],
    plough: "black",
    number: l.number,
  };
}

/** The DR 243 / DB 143 / DB 112 in one of its liveries; the default is the DR red 243 864. */
export function dr243(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DR243_PARAMS, params);
  return buildBoxLoco(spec(DR243_LIVERIES[livery as keyof typeof DR243_LIVERIES]));
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function dr243Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DR243_PARAMS, params);
  return boxLocoLod(spec(DR243_LIVERIES[livery as keyof typeof DR243_LIVERIES]));
}
