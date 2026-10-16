// The OBB 1040, the Floridsdorf Bo'Bo' 15 kV 16.7 Hz mixed-traffic locomotive
// of 1950-1953 (16 built), in the blood-orange red with the yellow line it
// carried until the 1990s: vlakosimdb's obb_1040. One unit, no parameters.
//
// Native coordinates (every canvas 0.1 m a pixel; the vehicle spans 0.4 ..
// 12.7 m of the 17 m side canvas, 12.3 m against the published 12.92 m over
// the buffers, so x is scaled by 1.0504): column px -> x = (px - 65.5) *
// 0.10504 (the raised "zadni" pantograph at -X), row r -> y = 6.0 - r / 10
// (assets/obb-1040/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { buildBoxLoco, type LocoSpec, type SideItem } from "./boxLocoKit.ts";

export const OBB1040_SCALE = 12.92 / 12.3;
const px = (p: number) => (p - 65.5) * 0.1 * OBB1040_SCALE;
const cols = (a: number, b: number): [number, number] => [px(a), px(b)];

/** 1040 013-3, photographed in this livery (photo-1040-013.jpg). */
export const OBB1040_NUMBER = "1040 013-3";

export const BUFFERS = 12.92 / 2;
const NOSE = 5.9;
// z_both column 62: rows 44-49 the grey frame, 24-43 red with the yellow line at row 33, 22-23 the roof's edge
const SIDE: Band[] = [[1.6, 2.6, "red"], [2.6, 2.7, "yellow"], [2.7, 3.8, "red"]];
const TIP = [[1.6, NOSE], [2.8, NOSE], [3.8, NOSE - 0.3]] as const;
const HW = [[1.6, 1.45], [3.6, 1.45], [3.8, 1.3]] as const;
/** The blunt V of the ends in plan (XML alongy): 0.1 m back near the middle, 0.42 m at the side. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.07, 0.1], [w * 0.8, 0.2], [w, 0.42]] as const;

// the six louvre panels between the doors (row 27: borders at columns 32/38, 50/56, ...) and the two windows
const louvres: SideItem[] = ([[32, 39], [50, 57], [58, 65], [66, 73], [74, 81], [92, 99]] as const).map(([a, b], i) => ({
  kind: "grille", name: `louvre ${i + 1}`, x: cols(a, b), y: [2.7, 3.4], slats: "h", pitch: 0.2, mat: "darkRed",
}));

const SPEC: LocoSpec = {
  palette: { red: c("#e81c10"), darkRed: c("#8a0a08"), louvre: c("#b01410"), yellow: c("#f0d020"), frame: c("#505154", 0.7), roof: { color: "#7e7f80", roughness: 0.75 }, plate: c("#8a0a08"), lampHead: { color: "#f6e7a8", roughness: 0.2 } },
  y0: 1.6,
  tip: TIP,
  hw: HW,
  endPlan,
  corner: "side",
  side: SIDE,
  end: SIDE,
  roof: "roof",
  buffers: BUFFERS,
  beam: 6.0,
  frame: { y0: 1.0, y1: 1.6, half: 6.0, hw: 1.42, mat: "frame" },
  bogies: [-3.8, 3.8].map((xc) => ({ xc, axles: [-1.2, 1.2], wheelR: 0.65, frameTop: 0.97 })),
  pantograph: { kind: "diamond", x: 4.5, roofY: 3.8, baseY: 4.06 },
  hvLine: { x: 2.6, y: 4.05, z: 0.45 },
  sideItems: [
    ...louvres,
    { kind: "window", name: "window 1", x: cols(41, 48), y: [2.8, 3.3], mat: "darkRed" },
    { kind: "window", name: "window 2", x: cols(83, 90), y: [2.8, 3.3], mat: "darkRed" },
    // the cab doors between the handrails at columns 23 and 29, their windows at 25-27
    { kind: "door", name: "door", x: cols(101, 108), y: [1.65, 3.6], win: [2.8, 3.5], rails: true, mirror: true },
    { kind: "paint", name: "emblem", x: cols(95, 100), y: [1.85, 2.15], mat: "white" },
    { kind: "plate", name: "number", x: cols(61, 70), y: [1.75, 1.95] },
  ],
  endItems: [
    // x_both row 28: the panes at columns 3-12 and 17-26 in dark red frames, rows 24-31
    { kind: "window", name: "windscreen left", z: [0.2, 1.3], y: [2.72, 3.68], mat: "darkRed", wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.3, -0.2], y: [2.72, 3.68], mat: "darkRed", wiper: true },
    { kind: "lamp", name: "top headlight", z: [-0.07, 0.07], y: [3.48, 3.62], r: 0.07 },
    { kind: "lamp", name: "headlight left", z: [0.8, 1.1], y: [1.85, 2.15], r: 0.15 },
    { kind: "lamp", name: "headlight right", z: [-1.1, -0.8], y: [1.85, 2.15], r: 0.15 },
    { kind: "paint", name: "emblem", z: [-0.25, 0.25], y: [1.85, 2.15], mat: "white" },
  ],
  roofItems: [],
  underItems: [[-1.1, 1.1, 0.5, 1.0, 1.0]],
  plough: "frame",
  number: OBB1040_NUMBER,
};

/** OBB 1040 013-3. */
export function obb1040(): MeshBuilder {
  return buildBoxLoco(SPEC);
}
