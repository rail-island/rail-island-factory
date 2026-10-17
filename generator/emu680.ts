// The CD 680 Pendolino, Alstom's seven-car tilting unit of the SuperCity
// service: one design `veh-cd-680` whose `unit` picks the car - the end car 681
// with its cab (default) or one of vlakosimdb's three intermediate cars, the
// 683 with its blind kitchen section, the 685 with a pantograph and the plain 686.
//
// Reconstructed from the native vlakosimdb XML and BMPs in assets/cd-680/native
// (db/train/emu/cd 680/cd_681, cd_683, cd_685, cd_686): the XML `alongx` section
// with the tilting train's tapered upper body, the `alongz` elevation (the
// sloped nose, the skirts between and beyond the bogies), the roof covers, and
// the windows, doors and paint laid from native pixel boxes, 0.1 m a pixel. The
// vlakosimdb cars are 25 m long; the model stretches them along x to the
// published 27.7 m (end car) and 25.9 m (intermediate cars) and narrows them to
// the published 2.8 m. Every car faces +X: the end car's cab is its +X end.
// See docs/models/czech-emus.md.

import { ngon, type MaterialSpec, type MeshBuilder } from "./meshBuilder.ts";
import type { GameProperties } from "./design.ts";
import type { Vec3 } from "./meshCore.ts";
import { Coach, type Box, type Pt, type Volume } from "./csdCoachParts.ts";
import { LOD_GLASS } from "./lodKit.ts";
import { bogieParts, coachBody, fitUnit, pantographParts, roofPart, skirtParts } from "./lodUnits.ts";
import { emblem } from "./cd163.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { blockX, EMU_CATALOG, enumParam, pantograph, slopePanel } from "./emuParts.ts";

export type PendolinoUnit = "endCar" | "car683" | "car685" | "car686";

export const CD680_PARAMS: readonly ParamSpec[] = [
  enumParam("unit", "Car", {
    endCar: "End car",
    car683: "Car 683",
    car685: "Car 685",
    car686: "Car 686",
  }),
];

/** The vlakosimdb cars are 25.0 m over their gangways: stretched to the published 27.7 m and 25.9 m. */
export const K_X_END = 27.7 / 25.0;
export const K_X_MID = 25.9 / 25.0;
/** The published width (2.8 m) over the XML's 3.0 m section. */
export const K_Z = 2.8 / 3.0;

const PALETTE: Record<string, MaterialSpec> = {
  teal: { color: "#008080", roughness: 0.5 },
  light: { color: "#d6d6d6", roughness: 0.5 },
  band: { color: "#161616", roughness: 0.45 },
  dark: { color: "#3e3f4f", roughness: 0.5 },
  roofBox: { color: "#2d2e39", roughness: 0.6 },
  yellow: { color: "#e6e600", roughness: 0.5 },
  endWall: { color: "#c0c0c0", roughness: 0.5 },
  skirtPanel: { color: "#005151", roughness: 0.6 },
  glass: { color: "#174a4a", metallic: 0.2, roughness: 0.15 },
  frame: { color: "#1a1a1a", roughness: 0.5 },
  seam: { color: "#0e0e0e", roughness: 0.9 },
  rubber: { color: "#b8bcbc", roughness: 0.9 },
  lampWhite: { color: "#f3f5f6", roughness: 0.2 },
  lampRed: { color: "#c8202c", roughness: 0.3 },
  lampBlue: { color: "#316bad", roughness: 0.3 },
  sign: { color: "#f4f4f4", roughness: 0.4 },
  pantograph: { color: "#5a5d63", metallic: 0.2, roughness: 0.6 },
  carbon: { color: "#2b2b2b", roughness: 0.8 },
  insulator: { color: "#fa6d05", roughness: 0.4 },
  coupler: { color: "#3a3c3f", metallic: 0.3, roughness: 0.5 },
  motor: { color: "#2e3033", roughness: 0.8 },
};

export type PxBox = [number, number, number, number];

/** The XML alongx section at published width: the vertical lower wall, the tumblehome above 1.9 m, the low roof. */
const SRC_SECTION: Pt[] = [[-1.3, 0.2], [1.3, 0.2], [1.4, 0.3], [1.5, 0.9], [1.5, 1.9], [1.4, 3.3], [1.3, 3.4], [0.6, 3.6], [-0.6, 3.6], [-1.3, 3.4], [-1.4, 3.3], [-1.5, 1.9], [-1.5, 0.9], [-1.4, 0.3]];
export const PENDOLINO_SECTION: Pt[] = SRC_SECTION.map(([z, y]) => [z * K_Z, y]);
const HALF = 1.5 * K_Z;
const H = 5; // the BMP canvases are 5 m tall

/** The body's paint (native z_inc rows 14..47 at a window column). */
const BODY_BANDS: Array<[number, number, string]> = [[0.2, 1.0, "teal"], [1.0, 1.8, "light"], [1.8, 1.9, "yellow"], [1.9, 3.0, "band"], [3.0, 3.1, "light"], [3.1, 3.4, "teal"], [3.4, 3.6, "dark"]];
/** The cab section behind the nose (native columns 25..50): light up to the roof's teal and dark edge. */
const CAB_BANDS: Array<[number, number, string]> = [[0.2, 1.0, "teal"], [1.0, 3.05, "light"], [3.05, 3.35, "teal"], [3.35, 3.6, "dark"]];
/** The nose (columns 0..25): the dark cap over a yellow line. */
const NOSE_BANDS: Array<[number, number, string]> = [[0.2, 1.0, "teal"], [1.0, 1.6, "light"], [1.6, 1.9, "yellow"], [1.9, 3.6, "dark"]];

interface CarLayout {
  key: string;
  k: number;
  cab: boolean;
  pantograph: boolean;
  /** Window glass (native boxes on z_inc, 250 x 50). */
  windows: PxBox[];
  /** Entrance doors: outline and window. */
  doors: Array<{ box: PxBox; glass: PxBox }>;
  /** Blind sections of the window band (the 683's kitchen), with a loading door outline. */
  hatch?: PxBox;
  /** Roof covers: [x0, x1] in source metres. */
  boxes: Array<[number, number]>;
  /** Bogie centres, source metres. */
  bogies: [number, number];
  signs: PxBox[];
}

const RIGHT_DOOR = { box: [236, 17, 246, 48] as PxBox, glass: [239, 24, 242, 31] as PxBox };
const LEFT_DOOR = { box: [4, 17, 14, 48] as PxBox, glass: [9, 24, 12, 31] as PxBox };
const MID_WINDOWS: PxBox[] = [30, 48, 66, 84, 102, 120, 138, 156, 174, 192, 210].map((u): PxBox => [u, 24, u + 9, 28]);

const LAYOUTS: Record<PendolinoUnit, CarLayout> = {
  endCar: {
    key: "cd_681",
    k: K_X_END,
    cab: true,
    pantograph: true,
    windows: [[63, 24, 69, 28], ...[80, 98, 116, 134, 152, 170, 188, 206].map((u): PxBox => [u, 24, u + 9, 28])],
    doors: [RIGHT_DOOR],
    boxes: [[9.6, 18.3]],
    bogies: [3.8, 21.5],
    signs: [[230, 24, 232, 28]],
  },
  car683: {
    key: "cd_683",
    k: K_X_MID,
    cab: false,
    pantograph: false,
    windows: MID_WINDOWS.filter(([u]) => u >= 102),
    doors: [RIGHT_DOOR],
    hatch: [64, 20, 79, 40],
    boxes: [[1.4, 3.0], [9.6, 18.3]],
    bogies: [3.6, 21.5],
    signs: [[229, 24, 231, 28]],
  },
  car685: {
    key: "cd_685",
    k: K_X_MID,
    cab: false,
    pantograph: true,
    windows: MID_WINDOWS,
    doors: [LEFT_DOOR, RIGHT_DOOR],
    boxes: [[9.6, 18.3]],
    bogies: [3.6, 21.5],
    signs: [[19, 24, 21, 28], [229, 24, 231, 28]],
  },
  car686: {
    key: "cd_686",
    k: K_X_MID,
    cab: false,
    pantograph: false,
    windows: MID_WINDOWS,
    doors: [LEFT_DOOR, RIGHT_DOOR],
    boxes: [[9.6, 18.3]],
    bogies: [3.6, 21.5],
    signs: [[19, 24, 21, 28], [229, 24, 231, 28]],
  },
};

/** Source x (0 at the BMP's left edge: the 681's cab tip) to body metres b, 0 at the high-x gangway face. */
const bOf = (L: CarLayout, x: number) => (25.0 - x) * L.k;
/** The length over the gangway faces (and the cab tip). */
const lengthOf = (L: CarLayout) => 25.0 * L.k;
/** A polyline in source (x, y) as ascending body metres. */
const toB = (L: CarLayout, pts: Pt[]): Pt[] => pts.map(([x, y]): Pt => [bOf(L, x), y]).sort((a, b) => a[0] - b[0]);

function sb(L: CarLayout, b: PxBox): Box {
  const [x0, x1] = [bOf(L, b[0] / 10), bOf(L, b[2] / 10)].sort((p, q) => p - q) as [number, number];
  return { x0, x1, y0: H - b[3] / 10, y1: H - b[1] / 10 };
}

/** A car's body: from the gangway end (source 24.9) to the cab section or the far gangway (source 0.1). */
function body680(L: CarLayout): Volume {
  // the body from the gangway end (source 24.9) to the cab section or the far gangway (source 0.1)
  const bodyEnd = L.cab ? 5.0 : 0.1;
  const bottomSrc: Pt[] = L.cab
    ? [[5.0, 0.8], [5.7, 0.8], [6.0, 0.2], [19.3, 0.2], [19.6, 0.8], [23.4, 0.8], [23.7, 0.2], [24.9, 0.2]]
    : [[0.1, 0.2], [1.4, 0.2], [1.7, 0.8], [5.5, 0.8], [5.8, 0.2], [19.3, 0.2], [19.6, 0.8], [23.4, 0.8], [23.7, 0.2], [24.9, 0.2]];
  return {
    name: "body",
    section: PENDOLINO_SECTION,
    plan: [[bOf(L, 24.9), HALF], [bOf(L, bodyEnd), HALF]],
    bottom: toB(L, bottomSrc),
    bands: BODY_BANDS,
    endPaint: "endWall",
  };
}

/** The end car's nose and cab section, lofted from the XML (nose plan and elevation, columns 0..50). */
function cabVolumes(L: CarLayout): { nose: Volume; cabBody: Volume } {
  const bx = (x: number) => bOf(L, x);
  // the nose's slope (XML 0.2 m back at 1.7 m to 1.8 m back at 3.4 m), with stations at the bands' edges
  const slope = (y: number): Pt => [0.2 + ((y - 1.7) / 1.7) * 1.6, y];
  const nose: Volume = {
    name: "nose",
    section: PENDOLINO_SECTION,
    plan: toB(L, [[0, 0.5], [0.1, 1.1], [0.3, 1.3], [0.9, 1.4], [1.8, 1.5], [2.5, 1.5]]).map(([b, h]): Pt => [b, h * K_Z]),
    top: toB(L, [[0, 1.1], [0.1, 1.5], [0.15, 1.6], [0.2, 1.7], slope(1.9), [1.8, 3.4], [2.0, 3.5], [2.4, 3.6], [2.5, 3.6]]),
    bottom: toB(L, [[0, 0.9], [0.2, 0.7], [0.6, 0.6], [1.8, 0.5], [2.0, 0.8], [2.5, 0.8]]),
    bands: NOSE_BANDS,
  };
  const cabBody: Volume = {
    name: "cab section",
    section: PENDOLINO_SECTION,
    plan: [[bx(5.0), HALF], [bx(2.5), HALF]],
    bottom: [[bx(5.0), 0.8], [bx(2.5), 0.8]],
    bands: CAB_BANDS,
  };
  return { nose, cabBody };
}

/**
 * A car of the Pendolino for distant views (lodUnits.ts): the tapered tilting
 * section, the end car's long sloped nose with its windscreen and paint, the
 * livery's bands, the window band, the skirts between and beyond the bogies,
 * the bogies, the roof covers and the raised pantograph.
 */
export function cd680Lod(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(CD680_PARAMS, params).unit as PendolinoUnit;
  const L = LAYOUTS[unit];
  const centre = lengthOf(L) / 2;
  const place = (v: Volume) => ({ v, X: (b: number) => b - centre });
  const X = (x: number) => bOf(L, x) - centre;
  const body = body680(L);
  const vols = L.cab ? (({ nose, cabBody }) => [place(body), place(nose), place(cabBody)])(cabVolumes(L)) : [place(body)];
  const fz = (u: number) => (1.5 - u / 10) * K_Z;
  const shell = coachBody(vols, {
    // the windows sit in the dark band between 1.9 and 3.0 m: from afar that band is the window band
    y0: 0.8, main: 0,
    ...(L.cab ? { frontWindows: [{ u: [fz(28), fz(2)], y: [H - 2.9, H - 1.9], mat: LOD_GLASS }] } : {}),
  });
  return fitUnit({
    palette: PALETTE,
    bodies: [shell],
    parts: [
      ...bogieParts(L.bogies.map((x) => [X(x), 2.0] as const), 0.8),
      ...skirtParts((body.bottom ?? []).map(([b, y]): Pt => [b - centre, y]), 0.8, HALF - 0.02, "teal"),
      ...L.boxes.map(([x0, x1]) => roofPart("roofBox", X(x1), X(x0), 1.0 * K_Z, 0.8 * K_Z, 3.5, 4.0)),
      ...(L.pantograph ? pantographParts([X(21.8)], 3.6, 3.85, 4.95) : []),
    ],
  }, 100);
}

/** A car of the CD 680 Pendolino. */
export function cd680(params?: ParamValues): MeshBuilder {
  const unit = resolveParams(CD680_PARAMS, params).unit as PendolinoUnit;
  const L = LAYOUTS[unit];
  const len = lengthOf(L);
  const c = new Coach(PALETTE, len / 2);
  const m = c.m;
  const gum = 0.1 * L.k;
  const body = body680(L);
  m.scope("body", () => {
    c.volume(body);
    for (const s of [1, -1]) m.scope(s > 0 ? "right side" : "left side", () => sideWork(c, body, L, s));
  });
  if (L.cab) m.scope("cab", () => cab(c, L));
  for (const e of L.cab ? [-1] : [-1, 1]) m.scope(e > 0 ? "front end" : "rear end", () => gangwayEnd(c, body, e, gum));
  m.scope("roof equipment", () => {
    L.boxes.forEach(([x0, x1], i) =>
      m.scope(`roof cover ${i + 1}`, () => {
        const ring: Pt[] = [[-1.0, 3.5], [1.0, 3.5], [1.0, 3.7], [0.8, 4.0], [-0.8, 4.0], [-1.0, 3.7]].map(([z, y]): Pt => [z * K_Z, y]);
        const [a, b] = [c.X(bOf(L, x1)), c.X(bOf(L, x0))];
        m.sweep("roofBox", "x", ring, a, ring, b);
      }),
    );
    if (L.pantograph) m.scope("pantographs", () => m.scope("pantograph", () => pantograph(m, { x: c.X(bOf(L, 21.8)), roof: 3.6, hinge: -1, raised: true, rise: 1.25 })));
  });
  m.scope("running gear", () => {
    L.bogies.forEach((x, i) =>
      m.scope(`bogie ${i + 1}`, () => {
        tiltingBogie(c, c.X(bOf(L, x)));
      }),
    );
  });
  return m;
}

/**
 * A Fiat tilting bogie at Factory x: two wheelsets 2.7 m apart on 890 mm wheels,
 * long side frames with axle boxes and primary springs, the tilting bolster
 * with its secondary springs and actuators, and yaw dampers outside the frame.
 */
function tiltingBogie(c: Coach, x: number): void {
  c.m.bogie(() => tiltingBogieGeometry(c, x));
}

function tiltingBogieGeometry(c: Coach, x: number): void {
  const m = c.m;
  const wb = 2.7;
  const r = 0.445;
  const ay = r * Math.cos(Math.PI / 24);
  for (const dx of [-wb / 2, wb / 2]) m.scope("wheelset", () => c.wheelset(x + dx, r));
  m.scope("frame", () => {
    for (const s of [-1, 1]) {
      block(m, "bogie", x - wb / 2 - 0.6, x + wb / 2 + 0.6, ay + 0.02, ay + 0.2, ...side(s, 0.92, 1.06));
      // the frame dips between the wheels to carry the bolster low
      block(m, "bogie", x - 0.75, x + 0.75, ay - 0.12, ay + 0.02, ...side(s, 0.94, 1.04));
      for (const dx of [-wb / 2, wb / 2]) {
        block(m, "bogie", x + dx - 0.17, x + dx + 0.17, ay - 0.13, ay + 0.1, ...side(s, 0.86, 1.08));
        for (const d of [-0.3, 0.3]) coilSpring(m, x + dx + d, s * 0.99, ay + 0.2, ay + 0.34);
      }
    }
    for (const dx of [-0.95, 0.95]) block(m, "bogie", x + dx - 0.1, x + dx + 0.1, ay - 0.02, ay + 0.16, -0.92, 0.92);
  });
  m.scope("tilt gear", () => {
    block(m, "motor", x - 0.45, x + 0.45, 0.6, 0.72, -1.1, 1.1);
    for (const s of [-1, 1]) {
      coilSpring(m, x, s * 0.82, ay + 0.02, 0.6);
      m.prism("steel", ngon(8, 0.05, 0, x + 0.3, s * 0.6), ay - 0.05, 0.6);
      // the yaw damper along the frame's outside
      damper(m, x - 1.2, x - 0.3, ay + 0.12, s * 1.1);
    }
  });
}

/** A short coil spring standing on y0. */
function coilSpring(m: MeshBuilder, x: number, z: number, y0: number, y1: number): void {
  const turns = 3;
  const steps = 2 * turns + 1;
  const ring = (i: number) => ngon(8, i % 2 === 0 ? 0.055 : 0.07, Math.PI / 8, x, z);
  for (let i = 0; i < steps; i++) m.loft("spring", ring(i), y0 + ((y1 - y0) * i) / steps, ring(i + 1), y0 + ((y1 - y0) * (i + 1)) / steps, i === steps - 1);
}

/** A damper cylinder along x from x0 to x1 at height y, across z. */
function damper(m: MeshBuilder, x0: number, x1: number, y: number, z: number): void {
  const ring = ngon(8, 0.045, 0, z, y);
  m.sweep("steel", "x", ring, x0, ring, x1);
}

/** Windows, doors, skirt panels and markings on side s. */
function sideWork(c: Coach, v: Volume, L: CarLayout, s: number): void {
  const m = c.m;
  const box = (b: PxBox) => sb(L, b);
  m.scope("windows", () => L.windows.forEach((b, i) => m.scope(`window ${i + 1}`, () => c.sidePanel(v, "glass", s, box(b), 0.01, 0.02))));
  m.scope("doors", () =>
    L.doors.forEach((d, i) =>
      m.scope(`door ${i + 1}`, () => {
        const o = box(d.box);
        m.scope("outline", () => c.sidePanel(v, "seam", s, o, 0.006, 0.04));
        // the leaf: teal top and foot, dark between, as the BMP paints it
        const inner = { x0: o.x0 + 0.06, x1: o.x1 - 0.06, y0: o.y0 + 0.06, y1: o.y1 - 0.06 };
        m.scope("leaf", () => {
          c.sidePanel(v, "teal", s, { ...inner, y1: 1.0 }, 0.01, 0.003);
          c.sidePanel(v, "frame", s, { ...inner, y0: 1.0, y1: 3.0 }, 0.01, 0.003);
          c.sidePanel(v, "teal", s, { ...inner, y0: 3.0 }, 0.01, 0.003);
        });
        m.scope("window", () => c.sidePanel(v, "glass", s, box(d.glass), 0.016, 0.004));
      }),
    ),
  );
  if (L.hatch) m.scope("kitchen hatch", () => c.door(v, s, box(L.hatch!), "bands", { seam: 0.03 }));
  m.scope("signs", () => L.signs.forEach((b) => c.sidePanel(v, "sign", s, box(b), 0.012, 0.004)));
  m.scope("skirt panels", () => {
    for (const u of [64, 81, 99, 116, 134, 151, 169]) c.sidePanel(v, "skirtPanel", s, box([u, 43, u + 16, 47]), 0.006, 0.004);
  });
  m.scope("emblem", () => {
    const e = box([182, 33, 188, 38]);
    const h = e.y1 - e.y0;
    const w = h * 1.5385;
    const cx = c.X((e.x0 + e.x1) / 2);
    const u0 = s > 0 ? cx - w / 2 : cx + w / 2;
    m.facets("teal", emblem(u0, e.y0, h, s < 0).map(([u, vv]): Vec3 => [u, vv, s * (HALF + 0.006)]), [0, 0, s]);
  });
}

/**
 * The cab: the nose and the cab section lofted from the XML (nose plan and
 * elevation, columns 0..50), the windscreen, lamps, cab door and the plough.
 */
function cab(c: Coach, L: CarLayout): void {
  const m = c.m;
  const bx = (x: number) => bOf(L, x);
  const { nose, cabBody } = cabVolumes(L);
  m.scope("nose", () => c.volume(nose));
  m.scope("cab section", () => c.volume(cabBody));
  const X = (x: number) => c.X(bx(x));
  const plane = { x0: X(0.2), y0: 1.7, x1: X(1.8), y1: 3.4 };
  const fz = (u: number) => (1.5 - u / 10) * K_Z;
  const fy = (v: number) => H - v / 10;
  m.scope("windscreen", () => {
    slopePanel(m, "frame", 1, plane, fz(2), fz(28), fy(29), fy(19), 0.006, 0.01);
    slopePanel(m, "glass", 1, plane, fz(3), fz(27), fy(28.6), fy(20), 0.014, 0.006);
    slopePanel(m, "frame", 1, plane, fz(15.3), fz(14.7), fy(28.6), fy(20), 0.02, 0.004);
  });
  m.scope("lamps", () => {
    for (const z of [-1, 1]) m.scope(z > 0 ? "lamp 1" : "lamp 2", () => {
      const x = X(0.12);
      // x_inc columns 2..7 and 23..28, rows 33..36
      blockX(m, "frame", x - 0.15, x + 0.01, 1.4, 1.7, (z * 1.05 - 0.25) * K_Z, (z * 1.05 + 0.25) * K_Z);
      for (const [j, dz] of [-0.09, 0.09].entries()) {
        const lens = ngon(10, 0.06, 0, (z * 1.05 + dz) * K_Z, 1.55);
        m.sweep(j === (z > 0 ? 0 : 1) ? "lampRed" : "lampBlue", "x", lens, x + 0.01, lens, x + 0.025);
      }
    });
  });
  // the plough under the nose (XML "nar": 0.4..2.0 m, down to 0.2 m)
  m.scope("plough", () => {
    const poly: Pt[] = [[bx(1.6), 0.2], [bx(0.4), 0.2], [bx(0.7), 0.9], [bx(2.0), 0.8]].map(([b, y]): Pt => [b, y]);
    c.sideSweep("teal", poly, -1.3 * K_Z, 1.3 * K_Z);
    c.sideSweep("frame", [[bx(1.6), 0.19], [bx(0.415), 0.19], [bx(0.44), 0.26], [bx(1.6), 0.26]], -1.32 * K_Z, 1.32 * K_Z);
  });
  for (const s of [1, -1])
    m.scope(s > 0 ? "right cab door" : "left cab door", () => {
      m.scope("outline", () => c.sidePanel(cabBody, "seam", s, sb(L, [28, 20, 35, 40]), 0.006, 0.04));
      m.scope("leaf", () => c.sidePanel(cabBody, "light", s, sb(L, [28.6, 20.6, 34.4, 39.4]), 0.01, 0.003));
      m.scope("window", () => c.sidePanel(cabBody, "glass", s, sb(L, [29.2, 21, 33.8, 24]), 0.014, 0.003));
    });
  m.scope("roof fairing", () => {
    const ring = (k: number, top: number): Pt[] => [[-1.0 * k * K_Z, 3.5], [1.0 * k * K_Z, 3.5], [0.5 * k * K_Z, top], [-0.5 * k * K_Z, top]];
    m.sweep("roofBox", "x", ring(0.6, 3.56), X(2.2), ring(1, 3.8), X(3.5));
    m.sweep("roofBox", "x", ring(1, 3.8), X(3.5), ring(1, 3.56), X(5.7));
  });
}

/** A gangway end e: the rubber gangway, its frame, the double door, and the coupler under it. */
function gangwayEnd(c: Coach, v: Volume, e: number, gum: number): void {
  const m = c.m;
  const wall = e > 0 ? v.plan[v.plan.length - 1]![0] : v.plan[0]![0];
  const X = (b: number) => c.X(b);
  const fz = (u: number) => (u / 10 - 1.5) * K_Z;
  m.scope("gangway", () => {
    const [a, b] = [X(wall) - e * 0.02, X(wall) + e * gum].sort((p, q) => p - q) as [number, number];
    for (const z of [-1, 1]) block(m, "rubber", a, b, 1.0, 3.3, ...side(z, 0.9, 1.1 * K_Z));
    block(m, "rubber", a, b, 3.1, 3.3, -0.9, 0.9);
  });
  m.scope("door frame", () => c.door(v, e, { x0: fz(4.5), x1: fz(25.5), y0: 1.12, y1: 3.26 }, "frame", { end: true, seam: 0.04 }));
  m.scope("doors", () => {
    for (const [u0, u1] of [[6, 14], [16, 24]] as const) {
      c.endPanel(v, "teal", e, { x0: fz(u0), x1: fz(u1), y0: 1.1, y1: 3.1 }, 0.016, 0.004);
      c.endPanel(v, "glass", e, { x0: fz(u0 + 2), x1: fz(u1 - 2), y0: 2.33, y1: 2.9 }, 0.022, 0.004);
    }
  });
  m.scope("coupler", () => {
    const bar = ngon(8, 0.08, Math.PI / 8, 0, 0.65);
    const [a, b] = [X(wall - e * 0.8), X(wall) + e * (gum - 0.01)].sort((p, q) => p - q) as [number, number];
    m.sweep("coupler", "x", bar, a, bar, b);
  });
}

/** What the game needs of it beyond its geometry (design.ts GameProperties). */
const CD_680_GAME: GameProperties = {
  weight: 40,
  power: 1500,
  maxspeed: 160,
  accel: null,
  variants: [
    { params: { unit: "car683" }, power: 0, maxspeed: 230 },
    { params: { unit: "car686" }, power: 0, maxspeed: 230 },
  ],
};

export const EMU680_DESIGNS: ProceduralDesign[] = [
  { id: "proc-vehicle-cd-680", game: CD_680_GAME, title: "CD 680 Pendolino", build: cd680, buildLod: cd680Lod, params: CD680_PARAMS, catalog: EMU_CATALOG, references: "cd-680" },
];

export { LAYOUTS as PENDOLINO_LAYOUTS, lengthOf as pendolinoLength };
