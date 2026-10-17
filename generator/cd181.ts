// The Skoda Co'Co' 3 kV DC freight locomotives, the "sestikolak": CSD E 669.0 /
// CD 180 (the two 1958 prototypes), E 669.1 / CD 181 and E 669.2 / CD 182, as
// one design with a `livery` parameter. One body (the 181's, vlakosimdb
// cd_181: the rounded ends, the cab doors, six machine-room windows a side);
// a livery brings its paint, its running number and its machine-room side
// (the 180's louvre banks and two windows, the 182's window order).
//
// Native coordinates (every source canvas is 0.1 m a pixel; the vehicle spans
// 0..18.8 m of it): column px -> x = (94 - px) / 10 (the source's x flipped, so
// its raised "predni" pantograph is at -X, the repository's rear), row r -> y =
// 6.0 - r / 10. 18.80 m over the buffers, a 17.6 m body, 3.0 m wide, 8.2 m
// between the pivots, 2 x 2.4 m bogie wheelbase, 1.25 m wheels
// (assets/cd-181/SOURCES.md).

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { runningNumber, type Band } from "./cd163.ts";
import { c } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, type LocoSpec, type SideItem } from "./boxLocoKit.ts";

const px = (p: number) => (94 - p) / 10;
/** A native column span (pixel edges) as an x span, low first. */
const cols = (a: number, b: number): [number, number] => [px(b), px(a)];

interface Livery {
  title: string;
  /** The vlakosimdb directory under db/train/loco/electric. */
  source: string;
  number: string;
  numberSource: string;
  palette: LocoSpec["palette"];
  side: readonly Band[];
  end: readonly Band[];
  /** Paint over the machine room only (the OKD's window band). */
  roomPaint?: readonly SideItem[];
  room: "181" | "180" | "182";
}

const ROOF: Band = [3.5, 4.2, "roof"];
const LINE = c("#d0ccd0");

export const CD181_LIVERIES = {
  cd180: {
    title: "CD 180",
    source: "cd_180",
    number: runningNumber("180", "001"),
    numberSource: "photo-180-001.jpg (the preserved prototype)",
    palette: { darkGreen: c("#14705a"), paleGreen: c("#b2cfa2"), roof: { color: "#25835d", roughness: 0.7 } },
    // cd_180 z_both column 50: rows 38-50 dark green, row 37 white, rows 25-36 pale green, 21-24 the green roof
    side: [[0.9, 2.2, "darkGreen"], [2.2, 2.3, "white"], [2.3, 3.5, "paleGreen"], ROOF],
    end: [[0.9, 1.2, "black"], [1.2, 2.2, "darkGreen"], [2.2, 2.3, "white"], [2.3, 3.5, "paleGreen"], ROOF],
    room: "180",
  },
  cd181: {
    title: "CD 181",
    source: "cd_181",
    number: runningNumber("181", "105"),
    numberSource: "photo-181-105-side.jpg, in this livery",
    palette: { green: c("#1b5a2a"), cream: c("#f2edc0"), line: LINE },
    // cd_181 z_dec column 100: rows 46-50 green, 45 grey line, 37-44 green, 36 grey line, 25-35 cream
    side: [[0.9, 1.4, "green"], [1.4, 1.5, "line"], [1.5, 2.3, "green"], [2.3, 2.4, "line"], [2.4, 3.5, "cream"], ROOF],
    end: [[0.9, 1.2, "black"], [1.2, 1.4, "green"], [1.4, 1.5, "line"], [1.5, 2.3, "green"], [2.3, 2.4, "line"], [2.4, 3.5, "cream"], ROOF],
    room: "181",
  },
  cd181Okd: {
    title: "OKD 181",
    source: "cd_181-okd",
    number: runningNumber("181", "056"),
    numberSource: "illustrative, one of the class; OKD Doprava ran two ex-CD units from 1998",
    palette: { navy: c("#223363"), cream: c("#f2ea90"), blue: c("#4263c6"), grey: c("#555658", 0.7) },
    // cd_181-okd column 12 (the cab): rows 46-50 grey, 44-45 cream, 37-43 navy, 25-36 cream; the machine
    // room (columns 50, 92): rows 26-34 navy, 35-45 cream
    side: [[0.9, 1.4, "grey"], [1.4, 1.6, "cream"], [1.6, 2.3, "navy"], [2.3, 3.5, "cream"], ROOF],
    end: [[0.9, 1.2, "black"], [1.2, 1.4, "grey"], [1.4, 1.6, "cream"], [1.6, 2.3, "blue"], [2.3, 3.5, "cream"], ROOF],
    roomPaint: [
      { kind: "paint", name: "room cream", x: cols(27, 161), y: [1.6, 2.3], mat: "cream" },
      { kind: "paint", name: "room window band", x: cols(27, 161), y: [2.5, 3.4], mat: "navy" },
    ],
    room: "181",
  },
  cd182: {
    title: "CD 182",
    source: "cd_182",
    number: runningNumber("182", "099"),
    numberSource: "photo-182-099.jpg",
    palette: { green: c("#14601f"), cream: c("#f6f2c0"), yellow: c("#e8b20a"), line: LINE },
    // cd_182 z_both column 50: rows 46-50 green, 45 line, 37-44 yellow, 36 line, 25-35 cream
    side: [[0.9, 1.4, "green"], [1.4, 1.5, "line"], [1.5, 2.3, "yellow"], [2.3, 2.4, "line"], [2.4, 3.5, "cream"], ROOF],
    end: [[0.9, 1.2, "black"], [1.2, 1.4, "green"], [1.4, 1.5, "line"], [1.5, 2.3, "yellow"], [2.3, 2.4, "line"], [2.4, 3.5, "cream"], ROOF],
    room: "182",
  },
} as const satisfies Record<string, Livery>;

export const CD181_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  default: "cd181",
  values: Object.entries(CD181_LIVERIES).map(([value, l]) => ({ value, title: l.title })),
}];
export const CD181_NUMBER = CD181_LIVERIES.cd181.number;

// ---------------------------------------------------------------------------
// The body (XML of cd_181: alongz box/box2/roof, alongx roof, alongy box)

export const BUFFERS = 9.4;
const NOSE = 8.8;
const TIP = [[0.9, NOSE], [2.4, NOSE], [3.5, NOSE - 0.2], [3.8, NOSE - 0.4], [4.0, NOSE - 0.7], [4.1, NOSE - 1.2]] as const;
const HW = [[0.9, 1.5], [3.5, 1.5], [3.7, 1.4], [3.9, 1.2], [4.0, 1.0], [4.1, 0.5]] as const;
/** The rounded end in plan: 1.0 m back at the side (XML alongy box). */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.667, 0.1], [w * 0.8, 0.2], [w * 0.867, 0.3], [w * 0.933, 0.5], [w, 1.0]] as const;

const window = (name: string, a: number, b: number, bar?: number): SideItem => ({ kind: "window", name, x: cols(a, b), y: [2.5, 3.4], mat: "rim", ...(bar ? { bar } : {}) });

/** The machine-room sides: native z_dec / z_both row 30, frames included. */
function room(kind: Livery["room"]): SideItem[] {
  if (kind === "180")
    return [
      // cd_180: a divided window near each cab, four louvre banks with horizontal slats over darker intakes
      { ...window("window 1", 35, 46, 2.95), y: [2.6, 3.3] },
      { ...window("window 2", 142, 153, 2.95), y: [2.6, 3.3] },
      ...([[67, 78], [82, 93], [95, 106], [110, 121]] as const).flatMap(([a, b], i): SideItem[] => [
        { kind: "grille", name: `louvre ${i + 1}`, x: cols(a, b), y: [2.3, 3.4], slats: "h", pitch: 0.2, mat: "slat" },
        { kind: "paint", name: `intake ${i + 1}`, x: cols(a, b), y: [1.9, 2.2], mat: "louvre" },
      ]),
    ];
  if (kind === "182")
    return [window("window 1", 35, 46), window("window 2", 56, 67), window("window 3", 78, 89), window("window 4", 101, 112, 2.95), window("window 5", 121, 132, 2.95), window("window 6", 142, 153)];
  return [window("window 1", 35, 46), window("window 2", 56, 67, 2.95), window("window 3", 76, 87, 2.95), window("window 4", 99, 110), window("window 5", 121, 132), window("window 6", 142, 153)];
}

function spec(l: Livery): LocoSpec {
  const bottom = l.side[0]![2];
  return {
    palette: { black: c("#1d1d1f", 0.7), roof: { color: "#7d7d83", roughness: 0.75 }, ...l.palette },
    y0: 0.9,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "side",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: BUFFERS,
    beam: 8.85,
    frame: { y0: 0.78, y1: 0.9, half: 8.85, hw: 1.45, mat: "black" },
    bogies: [-4.1, 4.1].map((xc) => ({ xc, axles: [-2.4, 0, 2.4], wheelR: 0.625, frameTop: 0.75 })),
    pantograph: { kind: "diamond", x: 5.35, roofY: 4.1, baseY: 4.36 },
    hvLine: { x: 3.4, y: 4.36, z: 0.45 },
    sideItems: [
      ...(l.roomPaint ?? []),
      // the cab doors with their windows (columns 17-27, rows 25-48)
      { kind: "door", name: "door", x: [6.75, 7.65], y: [1.2, 3.5], win: [2.5, 3.4], rails: true, mirror: true },
      ...room(l.room),
      // the roof hatches on the cant (row 22, columns 37-64)
      { kind: "grille", name: "roof hatch", x: cols(37, 65), y: [3.6, 3.82], slats: "v", pitch: 0.15, mat: "slat", mirror: true },
      { kind: "plate", name: "number plate", x: cols(88, 98), y: [1.7, 2.0] },
    ],
    endItems: [
      // x_both: column u -> z = 1.5 - u / 10 seen from ahead
      { kind: "window", name: "windscreen left", z: [0.1, 1.2], y: [2.5, 3.4], wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.2, -0.1], y: [2.5, 3.4], wiper: true },
      { kind: "lamp", name: "roof headlight", z: [-0.12, 0.12], y: [3.63, 3.87], r: 0.11 },
      { kind: "plate", name: "number plate", z: [-0.5, 0.4], y: [2.1, 2.4] },
      ...([1.0, 0.6, -0.6, -1.0] as const).map((z, i) => ({ kind: "lamp" as const, name: `lamp ${i + 1}`, z: [z - 0.06, z + 0.06] as const, y: [1.89, 2.01] as const, r: 0.06 })),
    ],
    roofItems: [{ name: "resistor cover", x: [-3.1, 3.1], w: [0.9, 0.8], y: [4.0, 4.3], mat: "roof" }],
    underItems: [[-1.0, 1.0, 0.4, 0.8, 1.1]],
    plough: bottom,
    number: l.number,
  };
}

/** The CD 180 / 181 / 182 in one of its liveries; the default is the cream and green 181 105. */
export function cd181(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD181_PARAMS, params);
  return buildBoxLoco(spec(CD181_LIVERIES[livery as keyof typeof CD181_LIVERIES]));
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function cd181Lod(params?: ParamValues): MeshBuilder {
  const { livery } = resolveParams(CD181_PARAMS, params);
  return boxLocoLod(spec(CD181_LIVERIES[livery as keyof typeof CD181_LIVERIES]));
}
