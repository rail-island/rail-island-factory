// The OBB 1042/1142 (proc-vehicle-obb-1142), the SGP Bo'Bo' 15 kV 16.7 Hz universal
// locomotive of 1963-1977 (the 1142 the 1042.531 - 707 rebuilt for push-pull service),
// on the box locomotive kit (boxLocoKit.ts) with its own profile, measured on the
// reference photographs (assets/obb-1142/SOURCES.md; docs/models/austria-trains.md):
//
// - the cab front: nearly upright, leaning back 0.2 m from the light grey band to the
//   roof, a slight bow in plan and well rounded corners; the two windscreens side by
//   side under the rounded roof edge, the top headlight's housing on the edge;
// - the section: upright walls 2.98 m wide up to the eave, the roof's shoulder rounding
//   into the cab roofs, the machine room's raised roof (with its side grilles and the
//   fan hatches) between them;
// - the side: the cab side window and the cab door at each end, the eleven openings of
//   the machine room between, nine grilles and two windows (the 5th and 7th);
// - the single-arm pantographs on the raised roof, the bogies 7.7 m apart (2.95 m
//   wheelbase, 1.25 m wheels), the rectangular buffers on the dark grey skirt;
// - two liveries: traffic red with the light grey band, the grey cab cap and the
//   "Pflatsch" emblem (the 1987 scheme the 1142 wore longest: 1142 668, 694, 602),
//   and the delivery paint, blood orange with the ivory lines (1142 679, 1042.517).

import { ngon, type MeshBuilder, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, type ShellSpec } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (16.22 m). */
const HALF = 8.11;
/** The body's bottom: the skirt's lower edge. */
const Y0 = 1.0;
/** The eave (the walls' top), the cab roofs' crown. */
const EAVE = 3.3;
const CROWN = 3.75;
/** The machine room's raised roof: its top, its half length. */
const HOOD = 4.0;
const HOOD_X = 5.45;
/** The body's half width (2.98 m). */
const W = 1.49;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.48, 3.25];
/** The light grey band (traffic red) and the cab cap's lower edge on the front. */
const BAND: readonly [number, number] = [1.45, 1.84];
const CAP = 2.41;

/** The front's centre line [y, |x|], bottom first: nearly upright, the roof edge rounded. */
const TIP: Table = [
  [Y0, 7.34], [BAND[0], 7.4], [BAND[1], 7.37], [CAP, 7.31], [3.2, 7.2], [EAVE, 7.16],
  [3.45, 7.09], [3.58, 6.99], [3.67, 6.87], [3.72, 6.74], [CROWN, 6.6],
];
/** The half width [y, hw]: the skirt tucked in a little, upright walls, the round shoulder. */
const HW: Table = [[Y0, 1.45], [1.3, W], [EAVE, W], [3.42, 1.475], [3.52, 1.44], [3.61, 1.37], [3.68, 1.27], [3.72, 1.14], [CROWN, 0.98]];
/** The corner's radius in plan. */
const CORNER = 0.32;

/** The front's plan at height y and half width w: a slight bow, then the round corner. */
function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const f = w - CORNER;
  const bow = (z: number) => 0.05 * (z / f) ** 2;
  const out: Array<readonly [number, number]> = [[0, 0], [f * 0.5, bow(f * 0.5)], [f, bow(f)]];
  for (const a of [22.5, 45, 67.5, 90]) {
    const t = (a * Math.PI) / 180;
    out.push([f + CORNER * Math.sin(t), bow(f) + CORNER * (1 - Math.cos(t))]);
  }
  return out;
}

/** Where the side wall ends at height y (the corner's back edge). */
const wallEnd = (y: number) => lerpTable(TIP, y) - 0.05 - CORNER;

// --- liveries ----------------------------------------------------------------------

interface Livery1142 {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The emblem's and the numbers' material. */
  ink: string;
  /** The front number's material and height. */
  frontInk: string;
  frontNumberY: number;
  number: string;
  sidePaint: readonly SideItem[];
}

/** The cab cap's sweep onto the side behind the corner (front half; mirrored). */
const CAP_SWEEP: Ring = [[6.55, CAP], [wallEnd(CAP), CAP], [wallEnd(EAVE + 0.01), EAVE + 0.01], [6.2, EAVE + 0.01]];

/** The Pflatsch: two slanted strokes and the diagonal between them, about (cu, cy), s its scale. */
function pflatsch(cu: number, cy: number, s: number): Ring[] {
  const p = (pts: Array<[number, number]>): Ring => pts.map(([u, v]) => [cu + u * s, cy + v * s] as [number, number]);
  return [
    p([[-0.05, 0.08], [0.3, 0.08], [0.36, 0.22], [0.01, 0.22]]),
    p([[-0.36, -0.22], [0.01, -0.22], [0.07, -0.08], [-0.3, -0.08]]),
    p([[-0.06, -0.09], [0.08, -0.09], [0.1, 0.09], [-0.04, 0.09]]),
  ];
}

const LIVERIES: Record<string, Livery1142> = {
  trafficRed: {
    title: "Traffic red",
    palette: {
      red: c("#d42a24"), light: c("#cfd0cb", 0.55), cap: c("#686b6e", 0.6), skirt: c("#505356", 0.7), roof: c("#6d7072", 0.75),
      hatch: c("#5d6063", 0.8), mirror: c("#d42a24"),
    },
    side: [[Y0, BAND[0], "skirt"], [BAND[0], BAND[1], "light"], [BAND[1], EAVE, "red"], [EAVE, 4.1, "roof"]],
    end: [[Y0, BAND[0], "skirt"], [BAND[0], BAND[1], "light"], [BAND[1], CAP, "red"], [CAP, 4.1, "cap"]],
    ink: "white",
    frontInk: "red",
    frontNumberY: 1.6,
    number: "1142 668-1",
    sidePaint: [{ kind: "paint", name: "cab cap", x: [6.2, wallEnd(CAP)], y: [CAP, EAVE + 0.01], poly: CAP_SWEEP, mat: "cap", mirror: true }],
  },
  bloodOrange: {
    title: "Blood orange",
    palette: {
      red: c("#d24a26"), ivory: c("#e9dfbd", 0.55), skirt: c("#3a3b3d", 0.7), roof: c("#74777a", 0.75), cap: c("#74777a", 0.75),
      hatch: c("#66696c", 0.8), mirror: c("#d24a26"),
    },
    // the ivory lines at the skirt and under the windows, the whole way round
    side: [[Y0, 1.45, "skirt"], [1.45, 1.51, "ivory"], [1.51, 2.36, "red"], [2.36, 2.42, "ivory"], [2.42, EAVE, "red"], [EAVE, 4.1, "roof"]],
    end: [[Y0, 1.45, "skirt"], [1.45, 1.51, "ivory"], [1.51, 2.36, "red"], [2.36, 2.42, "ivory"], [2.42, 3.47, "red"], [3.47, 4.1, "roof"]],
    ink: "ivory",
    frontInk: "ivory",
    frontNumberY: 1.6,
    number: "1142 679-8",
    sidePaint: [],
  },
};

export const OBB1142_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery1142 => LIVERIES[resolveParams(OBB1142_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The machine room's eleven openings, 0.914 m apart, centred; the 5th and 7th are windows. */
const PITCH = 0.914;
const OPENING_W = 0.76;
const GRILLE_Y: readonly [number, number] = [2.64, 3.16];
const WINDOW_Y: readonly [number, number] = [2.58, 3.16];
/** The side emblem's centre: at the reader's right end of each side, behind the door (diagonal symmetry). */
const SIDE_EMBLEM: readonly [number, number] = [4.5, 2.08];

function openings(): SideItem[] {
  const out: SideItem[] = [];
  for (let k = -5; k <= 5; k++) {
    const x = k * PITCH, span: readonly [number, number] = [x - OPENING_W / 2, x + OPENING_W / 2];
    if (Math.abs(k) === 1) out.push({ kind: "window", name: `window ${k + 6}`, x: span, y: WINDOW_Y, mat: "rubber", r: 0.06, ...(k > 0 ? { bar: 2.9 } : {}) });
    else out.push({ kind: "grille", name: `grille ${k + 6}`, x: span, y: GRILLE_Y, mat: "slat", slats: "v", pitch: 0.065, r: 0.05 });
  }
  return out;
}

function spec(l: Livery1142): LocoSpec {
  const ink = l.ink;
  const sideEmblem: SideItem[] = [-1, 1].flatMap((sd) => pflatsch(sd * SIDE_EMBLEM[0], SIDE_EMBLEM[1], 0.68).map((poly, i): SideItem => ({
    kind: "paint", name: `emblem ${i + 1}`, x: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))],
    y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: ink, layer: 1 + (i === 2 ? 1 : 0), sides: [sd],
  })));
  const frontEmblem = pflatsch(0, 2.11, 0.85).map((poly, i): EndItem => ({
    kind: "paint", name: `emblem ${i + 1}`, z: [Math.min(...poly.map((p) => p[0])), Math.max(...poly.map((p) => p[0]))],
    y: [Math.min(...poly.map((p) => p[1])), Math.max(...poly.map((p) => p[1]))], poly, mat: ink, layer: 1 + (i === 2 ? 1 : 0),
  }));
  return {
    palette: {
      rim: c("#2c2e31", 0.6), louvre: c("#26282b", 0.85), slat: c("#3b3e42", 0.7), beam: c("#26272a", 0.75),
      bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      underframe: c("#2a2b2d", 0.8), white: c("#f2f2ee", 0.5),
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
    beam: 7.45,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.88, y1: Y0 + 0.02, half: 7.36, hw: 1.3, mat: "skirt" },
    bogies: [-3.85, 3.85].map((xc) => ({ xc, axles: [-1.475, 1.475], wheelR: 0.625, frameTop: 0.95 })),
    pantograph: { kind: "singleArm", x: 3.5, roofY: HOOD, baseY: HOOD + 0.22 },
    sideItems: [
      ...l.sidePaint,
      { kind: "window", name: "cab window", x: [5.85, 6.38], y: [2.48, 3.18], mat: "rim", r: 0.07, mirror: true },
      { kind: "door", name: "door", x: [5.02, 5.75], y: [BAND[0] + 0.02, 3.22], win: [2.45, 3.16], rails: true, mirror: true },
      ...openings(),
      ...sideEmblem,
    ],
    endItems: [
      ...frontEmblem,
      { kind: "window", name: "windscreen left", z: [0.06, 1.12], y: SCREEN, mat: "rim", wiper: true },
      { kind: "window", name: "windscreen right", z: [-1.12, -0.06], y: SCREEN, mat: "rim", wiper: true },
      { kind: "lamp", name: "headlight left", z: [0.96, 1.2], y: [1.59, 1.83], r: 0.125 },
      { kind: "lamp", name: "headlight right", z: [-1.2, -0.96], y: [1.59, 1.83], r: 0.125 },
      { kind: "lamp", name: "tail lamp left", z: [1.02, 1.14], y: [2.13, 2.25], r: 0.06, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.14, -1.02], y: [2.13, 2.25], r: 0.06, mat: "lampRed" },
    ],
    roofItems: [
      // the machine room's raised roof between the cab roofs, and its fan hatches
      { name: "raised roof", x: [-HOOD_X, HOOD_X], w: [1.2, 1.08], y: [CROWN - 0.03, HOOD], mat: "roof" },
      ...[-1, 1].flatMap((e) => [[1.28, 1.95], [4.7, 5.37]].map(([a, b]): LocoSpec["roofItems"][number] => ({
        name: `fan hatch ${e > 0 ? "front" : "rear"} ${a! < 3 ? "inner" : "outer"}`, x: e > 0 ? [a!, b!] : [-b!, -a!], w: [0.5, 0.42], y: [HOOD - 0.01, HOOD + 0.17], mat: "hatch",
      }))),
    ],
    underItems: [[-1.75, 1.75, 0.45, 0.82, 1.1], [-1.2, 1.2, 0.35, 0.45, 0.8]],
    plough: "skirt",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The running numbers: on the front's band and on each side beside the emblem. */
function numbers(m: MeshBuilder, sp: ShellSpec, l: Livery1142): void {
  const style = { weight: 0.16, width: 0.55 };
  m.scope("numbers", () => {
    const fh = 0.1, fw = wordWidth(l.number, fh, style);
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: at the front the text reads toward -z
      const tris = letters(l.number, e > 0 ? fw / 2 : -fw / 2, l.frontNumberY - fh / 2, fh, e > 0, style);
      m.scope(e > 0 ? "front" : "rear", () => m.facets(l.frontInk, tris.map(([u, v]) => at(u, v, 0.008)), [e, 0, 0]));
    }
    const sh = 0.09, sw = wordWidth(l.number, sh, style);
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // the number ends just short of the emblem, toward the middle; on the right side (+z) the reader's right is +x
      const tris = letters(l.number, sd * (SIDE_EMBLEM[0] - 0.4 - sw), 1.93, sh, sd < 0, style);
      m.scope(sd > 0 ? "right" : "left", () => m.facets(l.ink, tris.map(([u, v]) => at(u, v, 0.008)), [0, 0, sd]));
    }
  });
}

/** The mirror boxes at the cab side windows, in the body colour. */
function mirrors(m: MeshBuilder): void {
  m.scope("mirrors", () => {
    for (const e of [-1, 1])
      for (const sd of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${sd > 0 ? "right" : "left"}`, () => {
          const [a, b] = e > 0 ? [6.3, 6.42] : [-6.42, -6.3];
          const [z0, z1] = sd > 0 ? [W - 0.005, W + 0.055] : [-W - 0.055, -W + 0.005];
          block(m, "mirror", a, b, 2.62, 3.06, z0, z1);
        });
  });
}

/** The top headlight's round housing on the roof edge over the windscreens. */
function topLight(m: MeshBuilder): void {
  const y = 3.6, x0 = lerpTable(TIP, y) - 0.25, x1 = lerpTable(TIP, 3.45) + 0.12;
  m.scope("top headlight", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        tubeX(m, "cap", 0.14, e * x0, y, 0, e * x1, y, 0, 12);
        tubeX(m, "lampHead", 0.1, e * (x1 - 0.01), y, 0, e * (x1 + 0.012), y, 0, 12);
      });
  });
}

/** The grab rail across the front under the windscreens, on two stand-offs, in the body colour. */
function grabRails(m: MeshBuilder): void {
  const y = 2.37, x = lerpTable(TIP, y) + 0.06;
  m.scope("grab rails", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.rod("mirror", [e * x, y, -0.95], [e * x, y, 0.95], 0.016, 6);
        for (const z of [-0.9, 0.9]) m.rod("mirror", [e * (x - 0.08), y, z], [e * x, y, z], 0.012, 6);
      });
  });
}

/** The raised roof's grilles along its sides, two to each half. */
function hoodGrilles(m: MeshBuilder): void {
  m.scope("raised roof grilles", () => {
    for (const sd of [-1, 1])
      for (const [a, b] of [[2.75, 4.1], [4.25, 5.3]] as const)
        for (const e of [-1, 1]) {
          const [x0, x1] = e > 0 ? [a, b] : [-b, -a];
          // the raised roof's side leans in from 1.2 to 1.08: the panel follows it, standing 1 cm off
          const z = (y: number) => sd * (1.21 - (0.12 * (y - (CROWN - 0.03))) / (HOOD - CROWN + 0.03));
          const [lo, hi] = [3.8, 3.96];
          const q: Array<[number, number, number]> = [[x0, lo, z(lo)], [x1, lo, z(lo)], [x1, hi, z(hi)], [x0, hi, z(hi)]];
          const [p0, p1, p2, p3] = sd > 0 ? q : [q[1]!, q[0]!, q[3]!, q[2]!];
          m.facets("louvre", [p0!, p1!, p2!, p0!, p2!, p3!], [0, 0.6, sd]);
        }
  });
}

/** The roof line: a busbar on post insulators from one pantograph to the other, the main breaker. */
function roofLine(m: MeshBuilder): void {
  const y = HOOD + 0.38;
  m.scope("roof line", () => {
    for (const x of [-2.4, -0.9, 0.9, 2.4]) insulator(m, x, 0, HOOD - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -2.9, y, 0, 2.9, y, 0, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.35, 0.35, HOOD - 0.01, HOOD + 0.1, 0.3, 0.75);
      for (const x of [-0.2, 0.2]) m.prism("breaker", ngon(8, 0.09, 0, x, 0.52), HOOD + 0.09, HOOD + 0.34);
    });
  });
}

/** The OBB 1142 in a livery. */
export function obb1142(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    numbers(m, sp, l);
    mirrors(m);
    topLight(m);
    grabRails(m);
  });
  m.scope("roof equipment", () => {
    hoodGrilles(m);
    roofLine(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb1142Lod(v?: ParamValues): MeshBuilder {
  const s = spec(liveryOf(v));
  // a coarser profile and only the raised roof, so the paint bands and the window band stay within the budget
  const tip: Table = [[Y0, 7.34], [BAND[0], 7.4], [EAVE, 7.16], [3.6, 6.97], [CROWN, 6.6]];
  const hw: Table = [[Y0, 1.45], [1.3, W], [EAVE, W], [3.6, 1.38], [CROWN, 0.98]];
  return boxLocoLod({ ...s, tip, hw, roofItems: s.roofItems.slice(0, 1) });
}

/** The design's registry entry (generator/atLocos.ts): 83.5 t, 4,000 kW one-hour rating, 150 km/h. */
export const OBB1142_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-1142", title: "OBB 1142", build: obb1142, buildLod: obb1142Lod, params: OBB1142_PARAMS,
  game: { weight: 83.5, power: 4000, maxspeed: 150, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1142",
};
