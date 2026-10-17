// The OBB 1012, the SGP / Siemens / ELIN / ABB Bo'Bo' 15 kV 16.7 Hz
// prototype of 1996 (three built, sold to Hector Rail in 2007), in its white
// livery with the red machine room and the red sweeps down the cabs:
// vlakosimdb's "obb 1012". Three units of one look, no parameters.
//
// Native coordinates: the side BMP is 193 x 58 pixels on 18 x 6 m (0.0933 m
// columns, 0.1034 m rows); the body spans 0.4 .. 17.6 m, 17.2 m against the
// 18.3 m of the real one (19.30 m over the buffers), so x is scaled by 1.064:
// column px -> x = (96.5 - px) * 0.09923, row r -> y = 6.0 - r * 0.10345. The
// end BMP is 30 x 60 on 3 x 6 m (assets/obb-1012/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Ring } from "./meshBuilder.ts";
import type { Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, type LocoSpec } from "./boxLocoKit.ts";

export const OBB1012_SCALE = 18.3 / 17.2;
const px = (p: number) => (96.5 - p) * (18 / 193) * OBB1012_SCALE;
const row = (r: number) => 6 - r * (6 / 58);
const cols = (a: number, b: number): [number, number] => [px(b), px(a)];
const pt = (p: number, r: number): [number, number] => [px(p), row(r)];

/** 1012.001, the first of the three. */
export const OBB1012_NUMBER = "1012.001";

export const BUFFERS = 19.3 / 2;
const NOSE = 9.15;
// XML alongz: the skirt, the nose upright 1.5 to 1.9 m, the long rake to 3.7 m, the roof's fairing to 4.2 m
const TIP = [[1.45, NOSE - 0.08], [1.5, NOSE], [1.9, NOSE], [3.7, NOSE - 1.06], [3.9, NOSE - 1.49], [4.2, NOSE - 2.87]] as const;
// XML alongx: upright to 2.9 m, the upper sides leaning in, the narrower roof
const HW = [[1.45, 1.5], [2.9, 1.5], [3.8, 1.1], [4.2, 0.75]] as const;
/** The rounded nose in plan (XML alongy). */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.4, 0.02], [w * 0.67, 0.1], [w * 0.87, 0.25], [w, 0.5]] as const;

const SIDE: Band[] = [[1.45, 4.2, "white"]];
// x_both column 14: rows 39-45 red (1.5 - 2.1 m), white above
const END: Band[] = [[1.45, 1.5, "white"], [1.5, 2.1, "red"], [2.1, 4.2, "white"]];

/** The red sweep down the front cab from the machine room's corner (z_both rows 26-42, columns 5-51; cut at column 10, where the side meets the rounded nose). */
const WEDGE: Ring = [pt(50, 26), pt(10, 37.3), pt(10, 42), pt(30, 42), pt(50, 39)].map(([x, y]) => [x, y] as [number, number]);

const SPEC: LocoSpec = {
  palette: { red: c("#e8141a"), lightGrey: c("#d8d8d8"), skirt: c("#7e8082", 0.7), roof: { color: "#7a7c7e", roughness: 0.75 }, plate: c("#b0141a"), louvre: c("#4a4c4e", 0.8) },
  y0: 1.45,
  tip: TIP,
  hw: HW,
  endPlan,
  corner: "end",
  side: SIDE,
  end: END,
  roof: "roof",
  buffers: BUFFERS,
  beam: NOSE - 0.1,
  frame: { y0: 1.0, y1: 1.45, half: NOSE - 0.1, hw: 1.45, mat: "skirt" },
  bogies: [-4.95, 4.95].map((xc) => ({ xc, axles: [-1.4, 1.4], wheelR: 0.575, frameTop: 0.97 })),
  pantograph: { kind: "singleArm", x: 5.6, roofY: 4.2, baseY: 4.33 },
  sideItems: [
    // the red machine room (columns 51-141, rows 24-38) with its light grey line (row 40) and the white emblem
    { kind: "paint", name: "machine room", x: cols(51, 142), y: [row(39), row(24)], mat: "red" },
    { kind: "paint", name: "line", x: cols(55, 138), y: [row(41), row(40)], mat: "lightGrey" },
    { kind: "paint", name: "emblem", x: cols(88, 106), y: [row(37), row(29)], poly: [pt(100, 37), pt(88, 37), pt(94, 29), pt(106, 29)], mat: "white", layer: 1 },
    { kind: "paint", name: "cab sweep", x: cols(10, 50), y: [row(42), row(26)], poly: WEDGE, mat: "red", mirror: true },
    // the grilles along the leaning upper sides (rows 16-23)
    { kind: "grille", name: "roof grille", x: cols(55, 138), y: [3.85, 4.17], slats: "v", pitch: 0.12 },
    // the cab: the side window (columns 23-27) and the door (seams at columns 33 and 41)
    { kind: "window", name: "cab window", x: cols(23, 28), y: [row(31), row(25)], mat: "rubber", mirror: true },
    { kind: "door", name: "door", x: cols(33, 42), y: [1.5, 3.4], rails: true, mirror: true },
    { kind: "plate", name: "number", x: cols(90, 103), y: [1.6, 1.8] },
  ],
  endItems: [
    // x_both: one wide windscreen, rows 23-34; the lamp clusters in the red band (rows 41-43)
    { kind: "window", name: "windscreen", z: [-1.4, 1.4], y: [2.5, 3.7], wiper: true },
    { kind: "lamp", name: "top headlight", z: [-0.06, 0.06], y: [3.74, 3.86], r: 0.06 },
    { kind: "paint", name: "lamp cluster left", z: [0.3, 1.42], y: [1.62, 1.9], mat: "black", layer: 1 },
    { kind: "paint", name: "lamp cluster right", z: [-1.42, -0.3], y: [1.62, 1.9], mat: "black", layer: 1 },
    ...([1.22, 0.85, -0.85, -1.22] as const).map((z, i) => ({ kind: "lamp" as const, name: `headlight ${i + 1}`, z: [z - 0.07, z + 0.07] as const, y: [1.69, 1.83] as const, r: 0.06 })),
    { kind: "lamp", name: "tail lamp left", z: [0.39, 0.51], y: [1.7, 1.82], r: 0.05, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-0.51, -0.39], y: [1.7, 1.82], r: 0.05, mat: "lampRed" },
  ],
  roofItems: [],
  underItems: [[-2.5, 2.5, 0.45, 1.0, 1.1]],
  plough: "red",
  number: OBB1012_NUMBER,
};

/** OBB 1012.001. */
export function obb1012(): MeshBuilder {
  return buildBoxLoco({ ...SPEC, palette: { black: c("#1d1d1f", 0.7), ...SPEC.palette } });
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function obb1012Lod(): MeshBuilder {
  return boxLocoLod({ ...SPEC, palette: { black: c("#1d1d1f", 0.7), ...SPEC.palette } });
}
