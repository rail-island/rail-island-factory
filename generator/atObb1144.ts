// The OBB 1044/1144 (proc-vehicle-obb-1144), the SGP / ELIN / BBC / Siemens Bo'Bo'
// 15 kV 16.7 Hz universal locomotive of 1974-1995, on the box locomotive kit
// (boxLocoKit.ts) with its own profile, measured on the reference photographs
// (assets/obb-1144/SOURCES.md; docs/models/austria-trains.md):
//
// - the cab front: an arrow in elevation, its foremost line at the windscreens'
//   sill, the windscreen band leaning back into the round roof edge and the lower
//   front receding to the buffer beam; in plan a flat face with chamfered corners;
// - the section: upright walls 2.95 m wide up to the eave, the roof's shoulder
//   rounding into the flat roof, a run of roof grilles along the shoulder;
// - the side: the cab side window with its mirror box behind each cab corner, the
//   machine-room door behind it, four portholes high up, the ribbed panel from door
//   to door over the light grey band;
// - the top headlight on the roof edge, the red tail lamps over the lower headlights;
// - the single-arm pantographs behind the cabs, the roof line between them, the
//   bogies 8.0 m apart (2.9 m wheelbase, 1.3 m wheels), the rectangular buffers on
//   the dark grey skirt, the snowplough;
// - two liveries: traffic red with the grey cab cap and the light grey band and the
//   new OBB lettering (1144 259 and 052, 2017-2023), and the original blood orange
//   with the ivory lines and the "Pflatsch" emblem (1044.20 in 1985, 1144.40 retro).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, numberOn, onEnd, onSide, type ShellSpec } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (16.1 m). */
const HALF = 8.05;
/** The cab front's foremost line, |x|, at the windscreens' sill. */
const N = 7.62;
/** The body's bottom: the skirt's lower edge. */
const Y0 = 0.95;
/** The eave (the walls' top), the roof's crown. */
const EAVE = 3.68;
const CROWN = 4.0;
/** The body's half width (2.95 m). */
const W = 1.475;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.85, 3.67];

/** The front's centre line [y, |x|], bottom first: the lower front and the windscreens both lean back. */
const TIP: Table = [
  [Y0, N - 0.3], [1.45, N - 0.12], [2.0, N - 0.04], [2.8, N], [EAVE, N - 0.22], [3.86, N - 0.36], [CROWN, N - 0.58],
];
/** The half width [y, hw]: the skirt tucked in a little, upright walls, the round shoulder. */
const HW: Table = [[Y0, 1.42], [1.45, W], [EAVE, W], [3.8, 1.41], [3.9, 1.3], [3.97, 1.14], [CROWN, 0.96]];
/** The corner chamfer: its width across and its depth back into the side. */
const CHAMFER = 0.28;
const CHAMFER_DEPTH = 0.3;

/** The front's plan at height y and half width w: a flat face, then the chamfered corner. */
function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const flat = w - CHAMFER;
  return [[0, 0], [flat * 0.5, 0.008], [flat, 0.03], [flat + CHAMFER * 0.55, CHAMFER_DEPTH * 0.5], [w, CHAMFER_DEPTH]];
}

/** Where the side wall ends at height y (the chamfer's back edge). */
const wallEnd = (y: number) => lerpTable(TIP, y) - CHAMFER_DEPTH;

// --- liveries ----------------------------------------------------------------------

interface Livery1144 {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The ribs' material in the upper (body colour) and lower (band) part, and where they part. */
  ribs: readonly [string, string, number];
  number: string;
  sideNumber: string;
  endPaint: readonly EndItem[];
  sidePaint: readonly SideItem[];
  /** "OBB" lettering (the traffic red livery) or the Pflatsch emblem. */
  lettering: boolean;
}

/** The light grey band's foot and head (traffic red). */
const BAND: readonly [number, number] = [1.45, 2.0];
/** The cab cap's lower edge on the front (traffic red). */
const CAP = 2.77;

/** The cab cap's sweep onto the side behind the chamfer (front half; mirrored). */
const CAP_SWEEP: Ring = [[N - 0.47, CAP], [wallEnd(CAP), CAP], [wallEnd(EAVE + 0.01), EAVE + 0.01], [N - 0.98, EAVE + 0.01]];

/** The Pflatsch: two slanted strokes and the diagonal between them, about (cu, cy), s its scale (front: 1). */
function pflatsch(cu: number, cy: number, s: number): Ring[] {
  const p = (pts: Array<[number, number]>): Ring => pts.map(([u, v]) => [cu + u * s, cy + v * s] as [number, number]);
  return [
    p([[-0.05, 0.08], [0.3, 0.08], [0.36, 0.22], [0.01, 0.22]]),
    p([[-0.36, -0.22], [0.01, -0.22], [0.07, -0.08], [-0.3, -0.08]]),
    p([[-0.06, -0.09], [0.08, -0.09], [0.1, 0.09], [-0.04, 0.09]]),
  ];
}

const LIVERIES: Record<string, Livery1144> = {
  trafficRed: {
    title: "Traffic red",
    palette: {
      red: c("#cf1f26"), light: c("#d4d5d1", 0.55), cap: c("#62666a", 0.6), skirt: c("#4a4d51", 0.7), roof: c("#585c60", 0.75),
      ribLight: { color: "#c3c6c6", metallic: 0.3, roughness: 0.45 }, ribRed: c("#a3121a", 0.5), plate: c("#4a4d51", 0.7),
    },
    side: [[Y0, BAND[0], "skirt"], [BAND[0], BAND[1], "light"], [BAND[1], EAVE, "red"], [EAVE, 4.1, "cap"]],
    end: [[Y0, 1.49, "skirt"], [1.49, 2.04, "light"], [2.04, CAP, "red"], [CAP, 4.1, "cap"]],
    ribs: ["ribRed", "ribLight", BAND[1]],
    number: "1144 259",
    sideNumber: "9181 1144 259-9",
    endPaint: [],
    sidePaint: [{ kind: "paint", name: "cab cap", x: [N - 0.98, wallEnd(CAP)], y: [CAP, EAVE + 0.01], poly: CAP_SWEEP, mat: "cap", mirror: true }],
    lettering: true,
  },
  bloodOrange: {
    title: "Blood orange",
    palette: {
      red: c("#d8481f"), ivory: c("#e9dfbd", 0.55), skirt: c("#2b2b2c", 0.7), roof: c("#6d6f70", 0.75), cap: c("#6d6f70", 0.75),
      plate: c("#a8361a"), ribRed: c("#b13512", 0.5),
    },
    // the ivory lines at the skirt and under the windscreens, the whole way round
    side: [[Y0, 1.5, "skirt"], [1.5, 1.56, "ivory"], [1.56, 2.72, "red"], [2.72, 2.8, "ivory"], [2.8, EAVE, "red"], [EAVE, 4.1, "roof"]],
    end: [[Y0, 1.5, "skirt"], [1.5, 1.56, "ivory"], [1.56, 2.72, "red"], [2.72, 2.8, "ivory"], [2.8, 3.72, "red"], [3.72, 3.76, "ivory"], [3.76, 4.1, "roof"]],
    ribs: ["ribRed", "ribRed", 1.56],
    number: "1044.20",
    sideNumber: "1044.20",
    endPaint: [
      ...pflatsch(0, 2.33, 1.3).map((poly, i): EndItem => ({ kind: "paint", name: `emblem ${i + 1}`, z: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))], y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: "ivory", layer: 1 + (i === 2 ? 1 : 0) })),
      { kind: "plate", name: "number", z: [-0.3, 0.3], y: [1.62, 1.77] },
    ],
    sidePaint: [],
    lettering: false,
  },
};

export const OBB1144_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery1144 => LIVERIES[resolveParams(OBB1144_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The portholes' centres |x| and their height, their diameter. */
const PORTHOLES = [3.75, 1.3];
const PORTHOLE_Y = 3.15;
const PORTHOLE_D = 0.55;
/** The ribbed panel from door to door. */
const RIBS_X: readonly [number, number] = [-4.32, 4.32];
const RIBS_TOP = 2.56;
const RIB_PITCH = 0.083;
/** The side emblem's centre: near cab 2 on the right side, near cab 1 on the left (diagonal symmetry). */
const SIDE_EMBLEM: readonly [number, number] = [6.35, 2.4];

function ribs(l: Livery1144): SideItem[] {
  const [upper, lower, split] = l.ribs;
  const out: SideItem[] = [];
  let i = 0;
  for (let y = BAND[0] + 0.01; y + 0.065 <= RIBS_TOP; y += RIB_PITCH, i++)
    out.push({ kind: "panel", name: `rib ${i + 1}`, x: RIBS_X, y: [y, y + 0.062], mat: y + 0.03 < split ? lower : upper });
  return out;
}

function spec(l: Livery1144): LocoSpec {
  const sideEmblem: SideItem[] = l.lettering
    ? []
    : [-1, 1].flatMap((sd) => pflatsch(sd * SIDE_EMBLEM[0], SIDE_EMBLEM[1], 0.55).map((poly, i): SideItem => ({
      kind: "paint", name: `emblem ${i + 1}`, x: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))],
      y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: "ivory", layer: 1 + (i === 2 ? 1 : 0), sides: [-sd],
    })));
  return {
    palette: {
      rim: c("#2c2e31", 0.6), louvre: c("#26282b", 0.85), slat: c("#3b3e42", 0.7), beam: c("#26272a", 0.75),
      bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      underframe: c("#2a2b2d", 0.8), hatch: c("#4d5155", 0.8),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: HALF,
    beam: N - 0.38,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.8, y1: Y0 + 0.02, half: N - 0.45, hw: 1.3, mat: "skirt" },
    bogies: [-4.0, 4.0].map((xc) => ({ xc, axles: [-1.45, 1.45], wheelR: 0.65, frameTop: 0.95 })),
    pantograph: { kind: "singleArm", x: 5.3, roofY: CROWN, baseY: CROWN + 0.25 },
    sideItems: [
      ...l.sidePaint,
      { kind: "window", name: "cab window", x: [6.15, 6.65], y: [2.88, 3.5], mat: "rim", r: 0.08, mirror: true },
      { kind: "door", name: "door", x: [4.45, 5.05], y: [BAND[0], 3.45], rails: true, mirror: true },
      ...PORTHOLES.map((px, i): SideItem => ({ kind: "window", name: `porthole ${i + 1}`, x: [px - PORTHOLE_D / 2, px + PORTHOLE_D / 2], y: [PORTHOLE_Y - PORTHOLE_D / 2, PORTHOLE_Y + PORTHOLE_D / 2], mat: "rim", r: PORTHOLE_D / 2 - 0.001, mirror: true })),
      ...ribs(l),
      // the roof grilles along the shoulder, end to end between the cab roofs
      { kind: "grille", name: "roof grille", x: [-5.95, 5.95], y: [EAVE + 0.04, 3.95], mat: "slat", slats: "v", pitch: 0.11 },
      ...sideEmblem,
    ],
    endItems: [
      ...l.endPaint,
      { kind: "window", name: "windscreen left", z: [0.13, 1.26], y: SCREEN, mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.26, -0.13], y: SCREEN, mat: "rim", wiper: true },
      { kind: "lamp", name: "top headlight", z: [-0.08, 0.08], y: [3.8, 3.96], r: 0.07 },
      { kind: "lamp", name: "headlight left", z: [0.86, 1.06], y: [1.64, 1.84], r: 0.09 },
      { kind: "lamp", name: "headlight right", z: [-1.06, -0.86], y: [1.64, 1.84], r: 0.09 },
      { kind: "lamp", name: "tail lamp left", z: [0.91, 1.01], y: [1.96, 2.06], r: 0.05, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.01, -0.91], y: [1.96, 2.06], r: 0.05, mat: "lampRed" },
    ],
    // the machine room's roof hatches between the pantographs
    roofItems: [{ name: "roof hatches", x: [-4.45, 4.45], w: [1.0, 0.94], y: [CROWN - 0.01, CROWN + 0.05], mat: "hatch" }],
    underItems: [[-1.7, 1.7, 0.45, 0.8, 1.1], [-1.2, 1.2, 0.35, 0.45, 0.8]],
    plough: "skirt",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** "OBB" in white on the front's red, the number beside it, and on each side near one cab. */
function lettering(m: MeshBuilder, sp: ShellSpec, l: Livery1144): void {
  if (!l.lettering) return;
  m.scope("lettering", () => {
    const fh = 0.3, fw = wordWidth("OBB", fh, { weight: 0.22 });
    const fu = 0.25, fy = 2.2;
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: the lettering on the left, read toward -z at the front
      const tris = letters("OBB", e > 0 ? fu + fw / 2 : -fu - fw / 2, fy, fh, e > 0, { weight: 0.22 });
      m.scope(e > 0 ? "front" : "rear", () => {
        m.facets("white", tris.map(([u, v]) => at(u, v, 0.008)), [e, 0, 0]);
        // the number on the reader's right, over the lettering's line
        numberOn(m, at, [e, 0, 0], l.number, e > 0 ? -0.55 : 0.55, 2.6, 0.085, 0.008, e > 0);
      });
    }
    const sh = 0.27, sw = wordWidth("OBB", sh, { weight: 0.22 });
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      const cx = -sd * SIDE_EMBLEM[0];
      // on the right side (+z) the reader's right is +x
      const tris = letters("OBB", sd > 0 ? cx - sw / 2 : cx + sw / 2, SIDE_EMBLEM[1] - sh / 2, sh, sd < 0, { weight: 0.22 });
      m.scope(sd > 0 ? "right" : "left", () => m.facets("white", tris.map(([u, v]) => at(u, v, 0.008)), [0, 0, sd]));
    }
  });
}

/** The vehicle number in small white figures on the skirt. */
function sideNumbers(m: MeshBuilder, sp: ShellSpec, l: Livery1144): void {
  m.scope("side numbers", () => {
    for (const sd of [-1, 1]) m.scope(sd > 0 ? "right" : "left", () => numberOn(m, onSide(sp, sd), [0, 0, sd], l.sideNumber, -2.4 * sd, 1.22, 0.085, 0.006, sd < 0));
  });
}

/** The mirror boxes ahead of the cab side windows, in the body colour. */
function mirrors(m: MeshBuilder): void {
  m.scope("mirrors", () => {
    for (const e of [-1, 1])
      for (const sd of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${sd > 0 ? "right" : "left"}`, () => {
          const [a, b] = e > 0 ? [6.74, 6.84] : [-6.84, -6.74];
          const [z0, z1] = sd > 0 ? [W - 0.005, W + 0.065] : [-W - 0.065, -W + 0.005];
          block(m, "red", a, b, 2.98, 3.44, z0, z1);
        });
  });
}

/** The roof line: a busbar on post insulators from one pantograph to the other, the main breaker. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.38;
  m.scope("roof line", () => {
    for (const x of [-3.9, -2.4, 2.4, 3.9]) insulator(m, x, 0, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -4.6, y, 0, 4.6, y, 0, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.4, 0.4, CROWN - 0.01, CROWN + 0.12, -0.34, 0.34);
      insulator(m, -0.18, 0.2, CROWN + 0.11, y - 0.02);
      insulator(m, 0.18, -0.2, CROWN + 0.11, y - 0.02);
    });
  });
}

/** The OBB 1144 in a livery. */
export function obb1144(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    lettering(m, sp, l);
    sideNumbers(m, sp, l);
    mirrors(m);
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb1144Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v)));
}

/** The design's registry entry (generator/atLocos.ts): 84 t, the 5,280 kW one-hour rating, 140 km/h as a 1144. */
export const OBB1144_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-1144", title: "OBB 1144", build: obb1144, buildLod: obb1144Lod, params: OBB1144_PARAMS,
  game: { weight: 84, power: 5280, maxspeed: 140, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1144",
};
