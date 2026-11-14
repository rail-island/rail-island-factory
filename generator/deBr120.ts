// The DB class 120 three-phase electric locomotive (proc-vehicle-db-120) on the box
// locomotive kit (boxLocoKit.ts) with its own profile, measured on the reference
// photographs (assets/db-120/SOURCES.md; docs/models/germany-trains.md):
//
// - the cab front: upright from the buffer beam to just under the white band
//   (2.0 m), then leaning back about 12 degrees over the band and 18 degrees over
//   the two-piece windscreen, its top rounding into the roof; in plan a flat face
//   with round corners; the lower face cut out above the black buffer beam;
// - the section: upright side walls up to 3.36 m, then the chamfer leaning in to
//   the flat roof, the whole length, in which the machine room's filter grilles,
//   a louvre and a silver panel sit (laid per side as photographed);
// - the side: no machine-room windows; the tall cab side window just behind the
//   corner and the cab door with its handrails behind it;
// - the front's top headlight with the two marker lights, the horn slots, the
//   lower headlights, the painted number, the DB emblem;
// - the single-arm pantographs on insulators near the cabs, the roof line on its
//   insulators between them, the Bo'Bo' bogies 10.2 m apart (2.8 m wheelbase,
//   1.25 m wheels), the transformer between them;
// - two liveries: orient red with the light grey bib under the windscreen
//   (120 137, as 120 141 and 145 photographed at the works in 1988) and traffic
//   red with the white front band and the grey skirt band (120 160).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, numberOn, onEnd, onSide, roundRect, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (19.2 m). */
const HALF = 9.6;
/** The lower cab front, |x| (the buffers stand 0.64 m ahead of it). */
const N = 8.96;
/** The body's bottom: the side walls' lower edge (about the buffers' height). */
const Y0 = 1.05;
/** Where the upright lower front turns into the raked upper front. */
const KINK = 2.0;
/** The windscreen's sill and head. */
const SCREEN: readonly [number, number] = [2.72, 3.48];
/** The side wall's top: the chamfer's lower edge; the chamfer's top; the roof. */
const WALL_TOP = 3.36;
const CHAMFER_TOP = 3.86;
const CROWN = 3.93;
/** The body's half width (2.84 m over the paint). */
const W = 1.42;

/** The front's centre line [y, |x|], bottom first. */
const TIP: Table = [
  [Y0, N], [KINK, N], [SCREEN[0], N - 0.16], [SCREEN[1], N - 0.4], [3.66, N - 0.54], [3.8, N - 0.72], [CHAMFER_TOP, N - 0.9], [CROWN, N - 1.12],
];
/** The half width [y, hw]: upright walls, the chamfer leaning in, the roof's edge. */
const HW: Table = [[Y0, W], [WALL_TOP, W], [CHAMFER_TOP, 1.05], [CROWN, 0.92]];
/** The front corner's width across and its depth back into the side, by height. */
const CORNER_Z: Table = [[Y0, 0.3], [KINK, 0.3], [SCREEN[1], 0.32], [CROWN, 0.3]];
const CORNER_X: Table = [[Y0, 0.28], [KINK, 0.3], [SCREEN[1], 0.32], [CROWN, 0.3]];
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.03;
const ANGLES = [20, 40, 60, 75, 90].map((a) => (a * Math.PI) / 180);

/** The front's plan at height y and half width w: a slightly bowed face, then a round corner. */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(lerpTable(CORNER_Z, y), w * 0.9);
  const cx = lerpTable(CORNER_X, y);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (cx - BOW) * (1 - Math.cos(a))] as const)];
}

// --- liveries ----------------------------------------------------------------------

interface Logo {
  /** The frame, the field inside it and the letters. */
  frame: string;
  field: string;
  text: string;
}

interface Br120Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  number: string;
  endPaint: readonly EndItem[];
  frontLogo: Logo;
  sideLogo: Logo;
}

/** The front emblem's centre height and the side emblem's. */
const FRONT_LOGO_Y = 2.2;
const SIDE_LOGO_Y = 2.22;

const LIVERIES: Record<string, Br120Livery> = {
  orientRed: {
    title: "Orient red",
    palette: { red: c("#c4302a"), bib: c("#d6d8d4"), white: c("#efefea"), plate: c("#c4302a") },
    // red all over, down to the walls' lower edge (120 141, 145 in 1988)
    side: [[Y0, 4.0, "red"]],
    number: "120 137-5",
    // the light grey bib from under the windscreen, its lower edge dipping to a shallow point
    endPaint: [{ kind: "paint", name: "bib", z: [-1.1, 1.1], y: [2.02, 2.64], mat: "bib", poly: [[-1.1, 2.24], [-1.06, 2.17], [-0.98, 2.14], [0, 2.02], [0.98, 2.14], [1.06, 2.17], [1.1, 2.24], [1.1, 2.64], [-1.1, 2.64]] }],
    frontLogo: { frame: "red", field: "bib", text: "red" },
    sideLogo: { frame: "white", field: "red", text: "white" },
  },
  trafficRed: {
    title: "Traffic red",
    palette: { red: c("#e3051b"), white: c("#f1f1ef"), grey: c("#63676a", 0.6), plate: c("#e3051b") },
    // the grey band along the walls' foot; the front red down to the beam
    side: [[Y0, 1.53, "grey"], [1.53, 4.0, "red"]],
    number: "120 160-7",
    // the white band across the front in two bars, the emblem between them
    endPaint: [
      { kind: "paint", name: "front band left", z: [0.27, 1.15], y: [2.05, 2.35], mat: "white" },
      { kind: "paint", name: "front band right", z: [-1.15, -0.27], y: [2.05, 2.35], mat: "white" },
    ],
    frontLogo: { frame: "red", field: "white", text: "red" },
    sideLogo: { frame: "white", field: "red", text: "white" },
  },
};

export const BR120_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Br120Livery => LIVERIES[resolveParams(BR120_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The DB emblem's outer size: width, height. */
const FRONT_LOGO = [0.46, 0.3] as const;
const SIDE_LOGO = [0.46, 0.31] as const;

/** The emblem's frame and field as rounded outlines (u across, v up) about (cu, cy). */
function logoRings(cu: number, cy: number, [w, h]: readonly [number, number]): [Ring, Ring] {
  const t = h * 0.12;
  return [
    roundRect(cu - w / 2, cu + w / 2, cy - h / 2, cy + h / 2, h * 0.18),
    roundRect(cu - w / 2 + t, cu + w / 2 - t, cy - h / 2 + t, cy + h / 2 - t, h * 0.12),
  ];
}

function sideLogo(cx: number, cy: number, l: Logo): SideItem[] {
  const [frame, field] = logoRings(cx, cy, SIDE_LOGO);
  const x = [cx - SIDE_LOGO[0] / 2, cx + SIDE_LOGO[0] / 2] as const, y = [cy - SIDE_LOGO[1] / 2, cy + SIDE_LOGO[1] / 2] as const;
  return [
    { kind: "paint", name: "emblem frame", x, y, poly: frame, mat: l.frame, layer: 2 },
    { kind: "paint", name: "emblem field", x, y, poly: field, mat: l.field, layer: 3 },
  ];
}

function frontLogo(cy: number, l: Logo): EndItem[] {
  const [frame, field] = logoRings(0, cy, FRONT_LOGO);
  const z = [-FRONT_LOGO[0] / 2, FRONT_LOGO[0] / 2] as const, y = [cy - FRONT_LOGO[1] / 2, cy + FRONT_LOGO[1] / 2] as const;
  return [
    { kind: "paint", name: "emblem frame", z, y, poly: frame, mat: l.frame, layer: 2 },
    { kind: "paint", name: "emblem field", z, y, poly: field, mat: l.field, layer: 3 },
  ];
}

/** The chamfer's band of grilles and panels. */
const CHAMFER_Y: readonly [number, number] = [WALL_TOP + 0.03, CHAMFER_TOP - 0.03];

/** A run of dark filter grilles: one panel per bay, a light frame round each. */
function filters(name: string, x0: number, x1: number, n: number, sides: readonly number[]): SideItem[] {
  const pitch = (x1 - x0) / n;
  return Array.from({ length: n }, (_, i): SideItem => ({
    kind: "panel", name: `${name} ${i + 1}`, x: [x0 + i * pitch + 0.025, x0 + (i + 1) * pitch - 0.025], y: CHAMFER_Y, mat: "filter", sides,
  }));
}

/**
 * The chamfer's fittings as photographed on each side, front (+x) to rear: the right
 * side three filter grilles, the silver panel, the louvre, two grilles (120 149); the
 * left side three grilles, the louvre, the silver panel, three grilles (120 134).
 */
function chamferItems(): SideItem[] {
  const R = [1], L = [-1];
  return [
    ...filters("filter right front", 2.55, 6.3, 3, R),
    { kind: "panel", name: "silver panel right", x: [-2.25, 2.52], y: CHAMFER_Y, mat: "silver", sides: R },
    { kind: "grille", name: "louvre right", x: [-3.55, -2.28], y: CHAMFER_Y, mat: "slat", slats: "h", pitch: 0.075, sides: R },
    ...filters("filter right rear", -6.3, -3.58, 2, R),
    ...filters("filter left front", 2.55, 6.3, 3, L),
    { kind: "grille", name: "louvre left", x: [1.28, 2.52], y: CHAMFER_Y, mat: "slat", slats: "h", pitch: 0.075, sides: L },
    { kind: "panel", name: "silver panel left", x: [-2.55, 1.25], y: CHAMFER_Y, mat: "silver", sides: L },
    ...filters("filter left rear", -6.3, -2.58, 3, L),
  ];
}

function spec(l: Br120Livery): LocoSpec {
  return {
    palette: {
      rim: c("#a9aeb0", 0.4), filter: c("#2a2d31", 0.85), louvre: c("#25282b", 0.8), slat: c("#6d7275", 0.6),
      silver: { color: "#b9bdc0", metallic: 0.35, roughness: 0.45 },
      groove: c("#3a3536", 0.7), beam: c("#1f2022", 0.75), wiper: c("#5d6166", 0.5),
      bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: [[Y0, 4.0, "red"]],
    roof: "red",
    buffers: HALF,
    beam: N - 0.05,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.9, y1: 1.1, half: 8.7, hw: 1.3, mat: "underframe" },
    bogies: [-5.1, 5.1].map((xc) => ({ xc, axles: [-1.4, 1.4], wheelR: 0.625, frameTop: 0.9 })),
    pantograph: { kind: "singleArm", x: 6.2, roofY: CROWN, baseY: CROWN + 0.3 },
    sideItems: [
      { kind: "window", name: "cab window", x: [7.66, 8.18], y: [2.64, 3.32], mat: "rim", r: 0.1, mirror: true },
      { kind: "door", name: "cab door", x: [6.7, 7.3], y: [Y0 + 0.08, 3.3], rails: true, mirror: true },
      ...chamferItems(),
      ...sideLogo(0.2, SIDE_LOGO_Y, l.sideLogo),
    ],
    endItems: [
      ...l.endPaint,
      // the lower front cut out above the buffer beam
      { kind: "paint", name: "beam recess", z: [-1.12, 1.12], y: [Y0, 1.41], mat: "beam", layer: 1 },
      { kind: "paint", name: "windscreen pillar", z: [-0.035, 0.035], y: SCREEN, mat: "rim", layer: 1 },
      { kind: "window", name: "windscreen left", z: [0.015, 1.12], y: SCREEN, mat: "rim" },
      { kind: "window", name: "windscreen right", z: [-1.12, -0.015], y: SCREEN, mat: "rim" },
      { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [2.47, 2.65], r: 0.075 },
      { kind: "lamp", name: "marker light left", z: [0.37, 0.43], y: [2.5, 2.58], rect: true },
      { kind: "lamp", name: "marker light right", z: [-0.43, -0.37], y: [2.5, 2.58], rect: true, mat: "lampRed" },
      { kind: "paint", name: "horn slot left", z: [0.58, 0.9], y: [2.47, 2.5], mat: "groove", layer: 1 },
      { kind: "paint", name: "horn slot right", z: [-0.9, -0.58], y: [2.47, 2.5], mat: "groove", layer: 1 },
      { kind: "lamp", name: "headlight left", z: [0.79, 0.96], y: [1.635, 1.805], r: 0.085 },
      { kind: "lamp", name: "headlight right", z: [-0.96, -0.79], y: [1.635, 1.805], r: 0.085 },
      ...frontLogo(FRONT_LOGO_Y, l.frontLogo),
      { kind: "plate", name: "number", z: [-0.42, 0.42], y: [1.63, 1.79] },
    ],
    roofItems: [],
    underItems: [[-2.7, 2.7, 0.5, 0.9, 1.1], [-2.2, 2.2, 0.4, 0.5, 0.8]],
    plough: "beam",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** "DB" in the emblems' fields, front and rear, on both sides. */
function emblemLetters(m: MeshBuilder, sp: ShellSpec, l: Br120Livery): void {
  const word = (h: number) => ({ h, w: wordWidth("DB", h, { weight: 0.2 }) });
  m.scope("emblem letters", () => {
    const f = word(FRONT_LOGO[1] * 0.56);
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: read toward -z at the front
      const tris = letters("DB", e > 0 ? f.w / 2 : -f.w / 2, FRONT_LOGO_Y - f.h / 2, f.h, e > 0, { weight: 0.2 });
      m.scope(e > 0 ? "front" : "rear", () => m.facets(l.frontLogo.text, tris.map(([u, v]) => at(u, v, 0.0115)), [e, 0, 0]));
    }
    const s = word(SIDE_LOGO[1] * 0.56);
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // on the right side (+z) the reader's right is +x
      const tris = letters("DB", sd > 0 ? 0.2 - s.w / 2 : 0.2 + s.w / 2, SIDE_LOGO_Y - s.h / 2, s.h, sd < 0, { weight: 0.2 });
      m.scope(sd > 0 ? "right" : "left", () => m.facets(l.sideLogo.text, tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]));
    }
  });
}

/** The vehicle number in small white figures in the band along the walls' foot. */
function sideNumbers(m: MeshBuilder, sp: ShellSpec, l: Br120Livery): void {
  m.scope("side numbers", () => {
    for (const sd of [-1, 1]) m.scope(sd > 0 ? "right" : "left", () => numberOn(m, onSide(sp, sd), [0, 0, sd], l.number, -0.3 * sd, 1.42, 0.075, 0.006, sd < 0));
  });
}

/** The windscreen wipers parked upright at the screens' outer edges. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          // seen from ahead +z is on the left: the item's u is mirrored at the front
          const u = (z: number) => (e > 0 ? -z : z) * s;
          const z0 = 1.0, z1 = 0.95;
          const arm: Ring = [[u(z0 - 0.012), SCREEN[0] + 0.07], [u(z0 + 0.012), SCREEN[0] + 0.07], [u(z1 + 0.012), SCREEN[1] - 0.1], [u(z1 - 0.012), SCREEN[1] - 0.1]];
          surfacePanel(m, "wiper", at, n, arm, 0.024, 0.04);
        });
    }
  });
}

/** The roof line: a busbar on post insulators from one pantograph to the other, the main breaker. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.4;
  m.scope("roof line", () => {
    for (const x of [-4.8, -3.2, -1.6, 1.6, 3.2, 4.8]) insulator(m, x, 0, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -5.4, y, 0, 5.4, y, 0, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.35, 0.35, CROWN - 0.01, CROWN + 0.12, -0.32, 0.32);
      insulator(m, -0.15, 0.2, CROWN + 0.11, y - 0.02);
      insulator(m, 0.15, -0.2, CROWN + 0.11, y - 0.02);
    });
  });
}

/** The buffer beam under the cut-out lower front. */
function bufferBeams(m: MeshBuilder): void {
  m.scope("buffer beams", () => {
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [N - 0.4, N - 0.02] : [-N + 0.02, -N + 0.4];
      m.scope(e > 0 ? "front" : "rear", () => block(m, "beam", a, b, 0.78, Y0 + 0.02, -1.25, 1.25));
    }
  });
}

/** The DB 120 in a livery. */
export function db120(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    emblemLetters(m, sp, l);
    sideNumbers(m, sp, l);
    wipers(m, sp);
    bufferBeams(m);
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function db120Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v)));
}

