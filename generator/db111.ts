// The DB class 111, the Bo'Bo' 15 kV 16.7 Hz express and regional locomotive
// of 1974-1984 (227 built), as one design with a `livery` parameter for
// vlakosimdb's three models: verkehrsrot (db_111), ozeanblau-beige (db_111_bb)
// and the S-Bahn orange and white (db_111_s). One body: the pointed ends with
// the windscreens raked back, the sides leaning in above the waist, two grille
// banks and three windows in the machine room, a cab door and window at each
// end.
//
// Native coordinates (every canvas 0.1 m a pixel; the body spans 0.45 .. 16.28 m
// of the 17 m side canvas): column px -> x = (83.65 - px) / 10, row r -> y =
// 6.0 - r / 10. 16.75 m over the buffers, 7.9 m between the pivots, 3.4 m bogie
// wheelbase, 1.25 m wheels (assets/db-111/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec } from "./boxLocoKit.ts";

const px = (p: number) => (83.65 - p) / 10;
const cols = (a: number, b: number): [number, number] => [px(b), px(a)];

interface Livery {
  title: string;
  source: string;
  number: string;
  numberSource: string;
  palette: LocoSpec["palette"];
  side: readonly Band[];
  end: readonly Band[];
  /** Paint across the ends (the verkehrsrot's white band). */
  endPaint?: readonly EndItem[];
}

export const DB111_LIVERIES = {
  db111: {
    title: "Traffic red",
    source: "db_111",
    number: runningNumber("111", "024"),
    numberSource: "illustrative, a unit of the class (most ended in verkehrsrot)",
    palette: { red: c("#d8141a"), grey: c("#606264", 0.6) },
    // db_111 z_dec column 22 (cab): rows 21-44 red, 45-48 grey
    side: [[1.2, 1.5, "grey"], [1.5, 4.0, "red"]],
    end: [[1.2, 1.6, "grey"], [1.6, 4.0, "red"]],
    // x_both rows 37-39: the white band either side of the emblem
    endPaint: [
      { kind: "paint", name: "white band left", z: [0.5, 1.45], y: [2.0, 2.3], mat: "white" },
      { kind: "paint", name: "white band right", z: [-1.45, -0.5], y: [2.0, 2.3], mat: "white" },
    ],
  },
  db111Bb: {
    title: "Ocean blue",
    source: "db_111_bb",
    number: runningNumber("111", "174"),
    numberSource: "photo-111-174-blue-beige.jpg",
    palette: { blue: c("#104058"), beige: c("#e2d98c"), grey: c("#606264", 0.6) },
    // db_111_bb column 50: rows 32-38 beige, 39-46 blue, 47 beige; x_both column 3: 39-43 blue, 46-47 grey
    side: [[1.2, 1.3, "beige"], [1.3, 2.1, "blue"], [2.1, 4.0, "beige"]],
    end: [[1.2, 1.6, "grey"], [1.6, 2.1, "blue"], [2.1, 4.0, "beige"]],
  },
  db111S: {
    title: "S-Bahn",
    source: "db_111_s",
    number: runningNumber("111", "143"),
    numberSource: "illustrative, one of the S-Bahn Rhein-Ruhr units 111 111-188",
    palette: { orange: c("#e87400"), grey: c("#606264", 0.6) },
    // db_111_s column 50: rows 32-40 orange, 41-47 white, 21-23 white; x_both column 3: 34-40 orange, 41-43 white
    side: [[1.2, 1.9, "white"], [1.9, 2.8, "orange"], [2.8, 4.0, "white"]],
    end: [[1.2, 1.6, "grey"], [1.6, 1.9, "white"], [1.9, 2.6, "orange"], [2.6, 4.0, "white"]],
  },
} as const satisfies Record<string, Livery>;

export const DB111_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "db111",
  values: Object.entries(DB111_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const DB111_NUMBER = DB111_LIVERIES.db111.number;

// ---------------------------------------------------------------------------
// The body (XML of db_111: alongz, alongx, alongy)

export const BUFFERS = 16.75 / 2;
const NOSE = 7.77;
const TIP = [[1.2, NOSE - 0.1], [1.7, NOSE], [2.1, NOSE], [3.8, NOSE - 0.6], [3.9, NOSE - 1.1]] as const;
// upright to the waist at 1.8 m, leaning in to the roof (the XML's 1.5 -> 1.3 m), the roof's edge rounded
const HW = [[1.2, 1.5], [1.8, 1.5], [3.75, 1.34], [3.9, 1.05]] as const;
/** The pointed end in plan (XML alongy): 0.1 m back near the middle, 0.88 m at the side. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.11, 0.1], [w * 0.72, 0.38], [w * 0.89, 0.59], [w, 0.88]] as const;

function spec(l: Livery): LocoSpec {
  return {
    palette: { roof: { color: "#6a6c6e", roughness: 0.75 }, plate: c("#3a3b3d", 0.6), ...l.palette },
    y0: 1.2,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: BUFFERS,
    beam: NOSE - 0.15,
    frame: { y0: 0.85, y1: 1.2, half: NOSE - 0.15, hw: 1.42, mat: "frame" },
    bogies: [-3.95, 3.95].map((xc) => ({ xc, axles: [-1.7, 1.7], wheelR: 0.625, frameTop: 0.82 })),
    pantograph: { kind: "singleArm", x: 4.35, roofY: 3.9, baseY: 4.05 },
    hvLine: { x: 2.5, y: 4.15, z: 0.5 },
    sideItems: [
      // z_dec rows 25-32: two grille banks, three windows between them (column 84: rows 25-32)
      { kind: "grille", name: "grille bank", x: cols(33, 65), y: [2.8, 3.5], slats: "v", pitch: 0.1, mirror: true },
      { kind: "window", name: "window 1", x: [0.7, 1.83], y: [2.7, 3.5], mat: "rubber" },
      { kind: "window", name: "window 2", x: [-0.57, 0.6], y: [2.7, 3.5], mat: "rubber" },
      { kind: "window", name: "window 3", x: [-1.9, -0.67], y: [2.7, 3.5], mat: "rubber" },
      // the cab: the door between the seams at columns 23 and 31, the window at 17-22
      { kind: "door", name: "door", x: cols(23, 32), y: [1.3, 3.5], rails: true, mirror: true },
      { kind: "window", name: "cab window", x: cols(17, 22), y: [2.8, 3.4], mat: "rubber", mirror: true },
      { kind: "paint", name: "emblem", x: cols(81, 86), y: [2.0, 2.3], mat: "white" },
      { kind: "plate", name: "number", x: cols(79, 89), y: [1.28, 1.44] },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.1, 1.3], y: [2.75, 3.45], wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.3, -0.1], y: [2.75, 3.45], wiper: true },
      ...(l.endPaint ?? []),
      { kind: "paint", name: "emblem", z: [-0.22, 0.22], y: [1.95, 2.25], mat: "white", layer: 1 },
      { kind: "lamp", name: "top headlight", z: [-0.08, 0.08], y: [3.55, 3.71], r: 0.07 },
      { kind: "lamp", name: "headlight left", z: [0.79, 0.91], y: [1.53, 1.65], r: 0.06 },
      { kind: "lamp", name: "headlight right", z: [-0.91, -0.79], y: [1.53, 1.65], r: 0.06 },
      { kind: "lamp", name: "tail lamp left", z: [1.19, 1.31], y: [1.53, 1.65], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.31, -1.19], y: [1.53, 1.65], r: 0.05, mat: "lampRed" },
      { kind: "plate", name: "number", z: [-0.45, 0.45], y: [1.27, 1.43] },
    ],
    // the roof cover between the pantographs (XML alongz 6.2..10.4 m, 3.9 to 4.3 m)
    roofItems: [{ name: "roof cover", x: [-2.1, 2.1], w: [1.0, 0.85], y: [3.88, 4.3], mat: "roof" }],
    underItems: [[-1.4, 1.4, 0.35, 0.85, 1.1]],
    plough: "frame",
    number: l.number,
  };
}

/** The DB 111 in one of its liveries; the default is the verkehrsrot 111 024. */
export function db111(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DB111_PARAMS, params);
  return buildBoxLoco(spec(DB111_LIVERIES[livery as keyof typeof DB111_LIVERIES]));
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function db111Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DB111_PARAMS, params);
  return boxLocoLod(spec(DB111_LIVERIES[livery as keyof typeof DB111_LIVERIES]));
}
