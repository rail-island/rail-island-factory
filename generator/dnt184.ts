// The Skoda 93E: DNT (Doly Nastup Tusimice, now SD - Kolejova doprava) class
// 184.5, a 3 kV DC Bo'Bo'Bo' freight locomotive of 5,220 kW, four built in
// 1994-1999 for the Kadan - Tusimice coal line. One design with a `livery`
// parameter for vlakosimdb's three models: the dark green dnt_184.5 and the
// two lighter green prototypes dnt_184_5#1 (geared for 95 km/h) and #2 (the
// 160 km/h test gearing), whose bodies vlakosimdb draws alike.
//
// Native coordinates (dnt_184.5: every canvas 0.1 m a pixel, the vehicle 0 ..
// 20.3 m of the 20.4 m canvas): column px -> x = (101.5 - px) / 10, row r -> y
// = 6.0 - r / 10. 20.346 m over the buffers, a 19.3 m body, 3.0 m wide, the
// bogies at -5.5, 0 and +5.5 m with a 3.1 m wheelbase, 1.25 m wheels
// (assets/dnt-184/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, type LocoSpec, type SideItem } from "./boxLocoKit.ts";

const px = (p: number) => (101.5 - p) / 10;
const cols = (a: number, b: number): [number, number] => [px(b), px(a)];

interface Livery {
  title: string;
  source: string;
  number: string;
  numberSource: string;
  palette: LocoSpec["palette"];
  side: readonly Band[];
  end: readonly Band[];
}

export const DNT184_LIVERIES = {
  dnt1845: {
    title: "DNT 184 503",
    source: "dnt_184.5",
    number: runningNumber("184", "503"),
    numberSource: "photo-184-503.jpg",
    palette: { green: c("#1d5233"), rib: c("#2b6b42"), cream: c("#efe7c6"), roofEdge: { color: "#5e5e60", roughness: 0.75 } },
    // dnt_184.5 z_dec column 100: rows 48-50 green, 44-47 green ribs, 38-43 cream, 24-37 green ribs, 20-23 the grey roof edge
    side: [[0.9, 1.6, "green"], [1.6, 2.2, "cream"], [2.2, 3.6, "green"], [3.6, 4.0, "roofEdge"]],
    end: [[0.9, 1.6, "green"], [1.6, 2.2, "cream"], [2.2, 3.6, "green"], [3.6, 4.0, "roofEdge"]],
  },
  dnt1845No1: {
    title: "DNT 184 501",
    source: "dnt_184_5#1",
    number: runningNumber("184", "501"),
    numberSource: "illustrative, the first prototype; vlakosimdb names the model #1",
    palette: { green: c("#006a10"), rib: c("#008a00"), cream: c("#e6dfc4"), olive: c("#408000"), roofEdge: { color: "#bbbba8", roughness: 0.75 }, roof: { color: "#bbbba8", roughness: 0.75 } },
    // dnt_184_5#1 z_dec column 100: rows 46-49 green, 38-44 cream, 23-37 green, 14-22 beige
    side: [[0.9, 1.6, "green"], [1.6, 2.2, "cream"], [2.2, 3.75, "green"], [3.75, 4.0, "roofEdge"]],
    // x_both column 2: rows 46-51 olive, 38-43 cream, 19-37 olive
    end: [[0.9, 1.6, "olive"], [1.6, 2.2, "cream"], [2.2, 3.75, "olive"], [3.75, 4.0, "roofEdge"]],
  },
  dnt1845No2: {
    title: "DNT 184 502",
    source: "dnt_184_5#2",
    number: runningNumber("184", "502"),
    numberSource: "illustrative, the second prototype; vlakosimdb names the model #2",
    palette: { green: c("#006a10"), rib: c("#008a00"), cream: c("#e6dfc4"), olive: c("#408000"), roofEdge: { color: "#bbbba8", roughness: 0.75 }, roof: { color: "#bbbba8", roughness: 0.75 } },
    side: [[0.9, 1.6, "green"], [1.6, 2.2, "cream"], [2.2, 3.75, "green"], [3.75, 4.0, "roofEdge"]],
    end: [[0.9, 1.6, "olive"], [1.6, 2.2, "cream"], [2.2, 3.75, "olive"], [3.75, 4.0, "roofEdge"]],
  },
} as const satisfies Record<string, Livery>;

export const DNT184_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "dnt1845",
  values: Object.entries(DNT184_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const DNT184_NUMBER = DNT184_LIVERIES.dnt1845.number;

// ---------------------------------------------------------------------------
// The body (XML of dnt_184.5: alongz base, alongx base)

export const BUFFERS = 20.346 / 2;
const NOSE = 9.65; // the native cream band, 1 px beyond the XML body at each end; the published 20.346 m over the buffers
// the end: the frame and the lower face 0.1 m in, upright 1.6 to 2.2 m, the windscreens raked 0.8 m back by 3.7 m
const TIP = [[0.9, NOSE - 0.1], [1.2, NOSE - 0.1], [1.6, NOSE], [2.2, NOSE], [3.7, NOSE - 0.8], [3.9, NOSE - 1.0], [4.0, NOSE - 1.3]] as const;
const HW = [[0.9, 1.5], [3.7, 1.5], [4.0, 1.4]] as const;
/** A flat end with small corner chamfers (the XML plan is a plain rectangle; photographs). */
const endPlan = (_y: number, w: number) => [[0, 0], [w - 0.12, 0.02], [w, 0.15]] as const;

const grilles = (): SideItem[] =>
  ([[34, 57], [62, 85], [90, 113], [118, 141], [146, 169]] as const).flatMap(([a, b], i): SideItem[] => [
    { kind: "grille", name: `grille ${i + 1} upper`, x: cols(a, b), y: [2.9, 3.3], slats: "h", pitch: 0.1, sides: [-1] },
    { kind: "grille", name: `grille ${i + 1} lower`, x: cols(a, b), y: [2.4, 2.8], slats: "h", pitch: 0.1, sides: [-1] },
  ]);

function spec(l: Livery): LocoSpec {
  return {
    palette: { roof: { color: "#5e5e60", roughness: 0.75 }, plate: c("#e8c400"), ...l.palette },
    y0: 0.9,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "side",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: BUFFERS,
    beam: NOSE - 0.1,
    frame: { y0: 0.8, y1: 0.9, half: NOSE - 0.1, hw: 1.45, mat: "frame" },
    bogies: [-5.5, 0, 5.5].map((xc) => ({ xc, axles: [-1.55, 1.55], wheelR: 0.625, frameTop: 0.76 })),
    pantograph: { kind: "singleArm", x: 5.5, roofY: 4.0, baseY: 4.15 },
    sideItems: [
      // the machine room's horizontal ribs (z_dec rows 24-37, columns 26-176; the grille side has none showing)
      { kind: "ribs", name: "ribs", x: [-7.4, 7.4], y: [2.35, 3.6], pitch: 0.2, mat: "rib", sides: [1] },
      // the cab doors with windows between the handrails (columns 17-25), the raked cab side window (12-16)
      { kind: "door", name: "door", x: [7.65, 8.4], y: [1.2, 3.45], win: [2.5, 3.4], rails: true, mirror: true },
      { kind: "paint", name: "cab window", x: [8.5, 9.0], y: [2.6, 3.35], poly: [[8.5, 2.6], [9.05, 2.6], [8.72, 3.3], [8.5, 3.3]], mat: "glass", layer: 1, mirror: true },
      // +z (z_dec): two large and two small machine-room windows; -z (z_inc): five grille bays in two tiers
      { kind: "window", name: "window 1", x: cols(48, 61), y: [2.4, 3.4], mat: "rubber", sides: [1] },
      { kind: "window", name: "window 2", x: cols(78, 89), y: [2.4, 3.2], mat: "rubber", bar: 2.85, sides: [1] },
      { kind: "window", name: "window 3", x: cols(114, 125), y: [2.4, 3.2], mat: "rubber", bar: 2.85, sides: [1] },
      { kind: "window", name: "window 4", x: cols(142, 155), y: [2.4, 3.4], mat: "rubber", sides: [1] },
      ...grilles(),
      { kind: "plate", name: "number plate", x: cols(97, 106), y: [1.78, 2.02] },
    ],
    endItems: [
      // x_both: column u -> z = 1.5 - u / 10 seen from ahead
      { kind: "window", name: "windscreen left", z: [0.1, 1.4], y: [2.6, 3.5], wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.4, -0.1], y: [2.6, 3.5], wiper: true },
      { kind: "paint", name: "headlight panel", z: [-0.35, 0.35], y: [2.2, 2.5], mat: "rim" },
      { kind: "lamp", name: "headlight left", z: [0.12, 0.28], y: [2.27, 2.43], r: 0.06 },
      { kind: "lamp", name: "headlight right", z: [-0.28, -0.12], y: [2.27, 2.43], r: 0.06 },
      { kind: "lamp", name: "lamp left", z: [1.25, 1.45], y: [1.5, 1.7], r: 0.07 },
      { kind: "lamp", name: "lamp right", z: [-1.45, -1.25], y: [1.5, 1.7], r: 0.07 },
      { kind: "lamp", name: "tail lamp left", z: [0.92, 1.08], y: [1.47, 1.63], r: 0.06, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.08, -0.92], y: [1.47, 1.63], r: 0.06, mat: "lampRed" },
      { kind: "plate", name: "number plate", z: [-0.35, 0.35], y: [1.2, 1.4] },
    ],
    roofItems: [
      // z_dec rows 14-20: three covers between the pantographs, the middle one higher
      { name: "front cover", x: cols(61, 89), w: [1.35, 1.15], y: [3.98, 4.5], mat: "roof" },
      { name: "middle cover", x: cols(89, 114), w: [1.35, 1.0], y: [3.98, 4.6], mat: "roof" },
      { name: "rear cover", x: cols(114, 142), w: [1.35, 1.15], y: [3.98, 4.5], mat: "roof" },
    ],
    plough: "hazard",
    number: l.number,
  };
}

/** The DNT 184.5 in one of its liveries; the default is the dark green 184 503. */
export function dnt184(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DNT184_PARAMS, params);
  return buildBoxLoco(spec(DNT184_LIVERIES[livery as keyof typeof DNT184_LIVERIES]));
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function dnt184Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(DNT184_PARAMS, params);
  return boxLocoLod(spec(DNT184_LIVERIES[livery as keyof typeof DNT184_LIVERIES]));
}
