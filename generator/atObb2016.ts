// The OBB 2016 "Hercules" (proc-vehicle-obb-2016), Siemens' ER20 Bo'Bo' diesel-electric
// locomotive of 2002 - 2004 (100 built, 2016 001 - 100), on the box locomotive kit
// (boxLocoKit.ts) with its own profile, measured on the reference photographs
// (assets/obb-2016/SOURCES.md; docs/models/austria-trains.md):
//
// - the published figures (de.wikipedia "OBB 2016"): 19.275 m over the buffers, 2.87 m wide,
//   bogie centres 10.362 m, 2.7 m wheelbase, 1,100 mm wheels, 80 t, 2,000 kW, 140 km/h;
// - the side of ER 20-006 (a 1-D projective fit over both buffers and both bogie centres,
//   about 46 px/m): the face upright to 2.3 m over the lamps, then leaning back about 28
//   degrees over the windscreen and curving into the roof 2.1 m behind the lamps; the cab side
//   window 7.56 - 8.36 m from the middle in its black field, its front edge raked along the
//   cab's corner; the cab door 6.8 - 7.52 m between two handrails; the side wall upright to
//   3.31 m, a narrow chamfer to 3.61 m, then the broad sloping roof to 4.27 m; the body's skirt
//   down to 0.63 m over the upper half of the wheels;
// - the head-on of ER 20-014 (about 145 px/m): the flat face 2.2 m wide between corners
//   rounded off 0.33 m below the windscreen and 0.41 m (0.6 m deep) round it; the windscreen
//   one pane 2.04 m wide, 2.55 - 3.45 m; the top headlight's box under it between the two
//   halves of the grab rail; the lamp boxes low on the face (1.40 - 1.76 m), the headlight
//   outboard of the red tail lamp; the face's lower edge at 1.30 m over the recessed grey
//   buffer beam with the rectangular buffers and the plough;
// - the two sides differ (2016 061, 100 and 038, RTS 2016 905, ER 20-006): on the left side
//   (-z, seen with the front cab leading) two tall grilles behind the front cab door and a
//   pair of grilles ahead of the rear one; on the right side one grille in two halves behind
//   the front cab door and plain panels; five vents in each roof slope over the rear half
//   and the engine room's hatch on the roof between them;
// - OBB traffic red with the dark grey skirt (1.30 m on the sides and the face), the white
//   OBB mark on the face and big on each side, the running number 2016 038-8 (photographed).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import type { ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, roundRect, type ShellSpec } from "./czElectricKit.ts";
import { DIESEL_LOCO_CATALOG, type Band } from "./cd163.ts";
import { exhaust } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (19.275 m). */
const HALF = 19.275 / 2;
/** The body's skirt: its lower edge. */
const Y0 = 0.63;
/** The dark grey skirt's top on the sides and the red face's lower edge. */
const SKIRT = 1.3;
/** The side wall's top, the chamfer's top, the roof's crown. */
const EAVE = 3.31;
const CHAMFER = 3.61;
const CROWN = 4.27;
/** The windscreen's foot and head. */
const SCREEN: readonly [number, number] = [2.55, 3.45];
/** The body's half width (2.87 m). */
const W = 1.435;

/**
 * The face's centre line [y, |x|], bottom first (side of ER 20-006): the grey buffer beam set
 * back under the red face's lip, the face upright over the lamps, the windscreen leaning back,
 * the roof's front rounding over to the crown.
 */
const TIP: Table = [
  [Y0, 9.08], [SKIRT - 0.01, 9.12], [SKIRT, 9.28], [2.0, 9.28], [2.3, 9.25], [2.45, 9.2], [SCREEN[0], 9.16],
  [3.0, 8.95], [SCREEN[1], 8.69], [3.57, 8.59], [3.79, 8.43], [4.0, 8.19], [4.11, 7.94], [4.2, 7.64], [CROWN, 7.2],
];
/** The half width [y, hw]: upright walls, the chamfer, the broad sloping roof. */
const HW: Table = [
  [Y0, 1.42], [0.8, W], [EAVE, W], [3.45, 1.4], [CHAMFER, 1.31], [3.8, 1.17], [4.0, 0.93], [4.15, 0.65], [4.23, 0.4], [CROWN, 0.15],
];
/** The rounded corners of the face in plan: how far in from the side they start, how far back they reach. */
const CORNER_W: Table = [[Y0, 0.33], [2.45, 0.33], [SCREEN[0], 0.41]];
const CORNER_D: Table = [[Y0, 0.33], [2.45, 0.33], [SCREEN[0], 0.6]];

/** The face's plan at height y and half width w: flat across, then a quarter ellipse round to the side. */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const L = Math.min(lerpTable(CORNER_W, y), 0.6 * w), D = lerpTable(CORNER_D, y);
  const f = w - L;
  const out: Array<readonly [number, number]> = [[0, 0], [f * 0.5, 0], [f, 0]];
  for (const a of [22.5, 45, 67.5, 90]) {
    const t = (a * Math.PI) / 180;
    out.push([f + L * Math.sin(t), D * (1 - Math.cos(t))]);
  }
  return out;
}

/** How far behind the face's centre line the plan lies at height y, |z| from the centre line. */
function setback(y: number, z: number): number {
  const w = lerpTable(HW, y), L = Math.min(lerpTable(CORNER_W, y), 0.6 * w), D = lerpTable(CORNER_D, y);
  const t = Math.asin(Math.min(1, Math.max(0, (z - (w - L)) / L)));
  return D * (1 - Math.cos(t));
}

// --- the livery --------------------------------------------------------------------

const NUMBER = "2016 038-8";

const PALETTE: Record<string, MaterialSpec> = {
  red: c("#d20a1e"), grey: c("#46494d", 0.6), white: c("#f2f2ef"), black: c("#18191b", 0.5),
  // the grilles are painted in the body colour: red slats over a dark red ground
  louvre: c("#30060a", 0.85), slat: c("#a90d1a", 0.6), vent: c("#2a0d10", 0.8),
  lampBox: c("#1d1a1b", 0.6), lampRed: { color: "#9e1b1b", roughness: 0.3, lamp: { role: "tail" } },
  rim: c("#2b2c2e", 0.6), groove: c("#7a0c16", 0.7), hatch: c("#5b5e61", 0.75), exhaust: c("#2b2b2b", 0.9),
  beam: c("#3a3c3f", 0.75), bogie: c("#2a2b2d", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
  underframe: c("#2e3033", 0.8), mirror: c("#1d1e20", 0.6),
};
const SIDE: readonly Band[] = [[Y0, SKIRT, "grey"], [SKIRT, 4.4, "red"]];
const END: readonly Band[] = [[Y0, SKIRT, "grey"], [SKIRT, 4.4, "red"]];

// --- the body ----------------------------------------------------------------------

/** The bogie centres (10.362 m apart), half the wheelbase, the wheel radius, the frame's top. */
const BOGIE_X = 10.362 / 2;
const HALF_BASE = 1.35;
const WHEEL_R = 0.55;
/** The cab door and the cab side window's black field (front half; mirrored). */
const DOOR: readonly [number, number] = [6.8, 7.52];
const CAB_FIELD: Ring = [[7.56, 2.55], [8.36, 2.55], [8.1, EAVE - 0.03], [7.56, EAVE - 0.03]];
/** The grilles' height. */
const GRILLE_Y: readonly [number, number] = [SKIRT + 0.05, EAVE - 0.06];
/** The panel joints of the machine room. */
const JOINTS = [2.09, 0.55, -0.97];
/** The vents in the roof slopes over the rear half. */
const VENTS = [[-1.32, -0.67], [-2.18, -1.52], [-3.02, -2.36], [-3.87, -3.2], [-4.7, -4.05]] as const;
/** The OBB mark on each side: centre x, foot, height (left side; the right side's further back). */
const SIDE_LOGO = { left: 0.6, right: -4.3, y: 1.84, h: 0.62 } as const;

function grille(name: string, x: readonly [number, number], sd: number): SideItem {
  return { kind: "grille", name, x: [x[0], x[1]], y: GRILLE_Y, mat: "slat", slats: "v", pitch: 0.055, r: 0.03, sides: [sd] };
}

function sideItems(): SideItem[] {
  return [
    { kind: "paint", name: "cab window field", x: [7.56, 8.36], y: [2.55, EAVE - 0.03], poly: CAB_FIELD, mat: "black", layer: 1, mirror: true },
    { kind: "window", name: "cab window", x: [7.64, 8.06], y: [2.64, 3.18], mat: "black", r: 0.05, mirror: true },
    { kind: "door", name: "cab door", x: DOOR, y: [SKIRT + 0.02, EAVE - 0.05], rails: true, mirror: true },
    // the left side: two tall grilles behind the front cab, a pair ahead of the rear cab
    grille("grille 1", [5.09, 6.53], -1), grille("grille 2", [3.57, 5.02], -1),
    grille("grille 3", [-3.87, -2.42], -1), grille("grille 4", [-5.32, -3.92], -1),
    // the right side: one grille in two halves behind the front cab
    grille("grille 1", [5.09, 5.79], 1), grille("grille 2", [5.83, 6.53], 1),
    // the front module's joints: the crease round the corner at the window's foot, the seam down ahead of the door
    { kind: "panel", name: "cab crease", x: [8.36, 8.58], y: [2.535, 2.555], mat: "groove", mirror: true },
    { kind: "panel", name: "cab seam", x: [8.36, 8.38], y: [SKIRT + 0.02, 2.535], mat: "groove", mirror: true },
    ...JOINTS.map((x, i): SideItem => ({ kind: "panel", name: `panel joint ${i + 1}`, x: [x - 0.012, x + 0.012], y: [SKIRT + 0.02, EAVE - 0.02], mat: "groove" })),
    ...VENTS.map(([a, b], i): SideItem => ({ kind: "paint", name: `roof vent ${i + 1}`, x: [a, b], y: [3.86, 3.97], mat: "vent", layer: 1, poly: roundRect(a, b, 3.86, 3.97, 0.03) })),
  ];
}

/** The face's lamp boxes: headlight outboard of the red tail lamp. */
function lampItems(): EndItem[] {
  return [-1, 1].flatMap((s): EndItem[] => {
    const zs = (a: number, b: number): readonly [number, number] => (s > 0 ? [a, b] : [-b, -a]);
    const nm = s > 0 ? "left" : "right";
    return [
      { kind: "paint", name: `lamp box ${nm}`, z: zs(0.42, 0.98), y: [1.4, 1.76], mat: "lampBox", layer: 1, poly: roundRect(...zs(0.42, 0.98), 1.4, 1.76, 0.03) },
      { kind: "lamp", name: `headlight ${nm}`, z: zs(0.75, 0.91), y: [1.5, 1.66], r: 0.075 },
      { kind: "lamp", name: `tail lamp ${nm}`, z: zs(0.5, 0.64), y: [1.51, 1.65], r: 0.065, mat: "lampRed" },
    ];
  });
}

function spec(): LocoSpec {
  return {
    palette: PALETTE,
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: SIDE,
    end: END,
    roof: "red",
    buffers: HALF,
    beam: 9.12,
    bufferY: 1.05,
    bufferHead: "rect",
    frame: { y0: 0.56, y1: Y0 + 0.02, half: 8.9, hw: 1.3, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: 0.9 })),
    sideItems: sideItems(),
    endItems: [
      { kind: "window", name: "windscreen", z: [-1.02, 1.02], y: SCREEN, mat: "black", wiper: true },
      { kind: "paint", name: "top headlight box", z: [-0.25, 0.25], y: [2.28, 2.51], mat: "lampBox", layer: 1, poly: roundRect(-0.25, 0.25, 2.28, 2.51, 0.03) },
      { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [2.31, 2.48], r: 0.08 },
      ...lampItems(),
    ],
    roofItems: [
      // the engine room's roof hatch over the rear half, between the vents
      { name: "engine room hatch", x: [-4.21, -0.97], w: [0.66, 0.56], y: [4.12, CROWN + 0.05], mat: "hatch" },
    ],
    // the fuel tank and the battery boxes between the bogies
    underItems: [[-2.95, 2.95, 0.32, 0.6, 1.2], [-3.2, -2.95, 0.42, 0.6, 1.0], [2.95, 3.2, 0.42, 0.6, 1.0]],
    plough: "beam",
    number: NUMBER,
  };
}

// --- what the kit does not draw ------------------------------------------------------

/**
 * The OBB mark in reader space (u right, v up, foot at 0): the O open at its top right with the
 * stroke standing in the gap, then "BB". Returns the triangles and the mark's width.
 */
function obbMark(h: number): { tris: Array<[number, number]>; w: number } {
  const style = { weight: 0.2 };
  const rx = 0.4 * h, ry = 0.5 * h, t = 0.2 * h;
  const cu = rx, cv = ry;
  const tris: Array<[number, number]> = [];
  const pt = (a: number, k: number): [number, number] => [cu + (rx - k) * Math.cos(a), cv + (ry - k) * Math.sin(a)];
  // the ring from 75 degrees round to 395 (the gap 35 - 75 at the top right)
  const n = 18, a0 = (75 * Math.PI) / 180, a1 = (395 * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const [p, q] = [a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n];
    const [o0, o1, i0, i1] = [pt(p, 0), pt(q, 0), pt(p, t), pt(q, t)];
    tris.push(o0, o1, i1, o0, i1, i0);
  }
  // the stroke in the gap, pointing up and out at 55 degrees
  const s = (55 * Math.PI) / 180, [du, dv] = [Math.cos(s), Math.sin(s)], [nu, nv] = [-dv, du];
  const r0 = 0.12 * h, r1 = 0.62 * h, hw = 0.08 * h;
  const q: Array<[number, number]> = [
    [cu + du * r0 * 0.8 - nu * hw, cv + dv * r0 - nv * hw], [cu + du * r1 * 0.8 - nu * hw, cv + dv * r1 - nv * hw],
    [cu + du * r1 * 0.8 + nu * hw, cv + dv * r1 + nv * hw], [cu + du * r0 * 0.8 + nu * hw, cv + dv * r0 + nv * hw],
  ];
  tris.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
  const gap = 0.08 * h;
  tris.push(...letters("BB", 2 * rx + gap, 0, h, false, style));
  return { tris, w: 2 * rx + gap + wordWidth("BB", h, style) };
}

/** The OBB marks and the running numbers on the sides and the faces. */
function lettering(m: MeshBuilder, sp: ShellSpec): void {
  const num = { weight: 0.15 };
  m.scope("lettering", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        // reader's right is +x on the right side (+z), -x on the left
        const lay = (mat: string, tris: Array<[number, number]>, x0: number, d: number) =>
          m.facets(mat, tris.map(([u, v]) => at(x0 + sd * u, v, d)), [0, 0, sd]);
        const mark = obbMark(SIDE_LOGO.h);
        const cx = sd > 0 ? SIDE_LOGO.right : SIDE_LOGO.left;
        m.scope("emblem", () => lay("white", mark.tris.map(([u, v]) => [u, v + SIDE_LOGO.y]), cx - (sd * mark.w) / 2, 0.006));
        // the number on the skirt: near the rear cab on the left side, near the front cab on the right
        const nh = 0.085, nw = wordWidth(NUMBER, nh, num), nx = sd > 0 ? 5.8 : -4.6;
        m.scope("number", () => lay("white", letters(NUMBER, 0, 1.0, nh, false, num), nx - (sd * nw) / 2, 0.006));
      });
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        // reader's right is -z at the front, +z at the rear
        const lay = (mat: string, tris: Array<[number, number]>, u0: number, d: number) =>
          m.facets(mat, tris.map(([u, v]) => at(-e * (u0 + u), v, d)), [e, 0, 0]);
        const mark = obbMark(0.27);
        m.scope("emblem", () => lay("white", mark.tris.map(([u, v]) => [u, v + 1.86]), -mark.w / 2, 0.006));
        const nh = 0.1, nw = wordWidth(NUMBER, nh, num);
        m.scope("number", () => lay("white", letters(NUMBER, 0, 1.47, nh, false, num), -nw / 2, 0.006));
      });
  });
}

/** The grab rail under the windscreen in two halves either side of the top headlight, and the corner handrails. */
function handrails(m: MeshBuilder): void {
  m.scope("handrails", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const y = 2.36, x = lerpTable(TIP, y);
        for (const s of [-1, 1]) {
          const [z0, z1] = [s * 0.33, s * 1.02];
          m.rod("steel", [e * (x + 0.07), y, z0], [e * (x + 0.07), y, z1], 0.017, 6);
          for (const z of [z0 + s * 0.04, z1 - s * 0.04]) m.rod("steel", [e * (x - 0.03), y, z], [e * (x + 0.07), y, z], 0.014, 6);
          // the tall handrail on the face's corner, bent back into the face at its foot
          const zc = s * (W - 0.12), xc = lerpTable(TIP, 1.9) - setback(1.9, W - 0.12);
          m.rod("steel", [e * (xc + 0.06), 1.5, zc], [e * (xc + 0.06), 2.32, zc], 0.016, 6);
          for (const yy of [1.5, 2.32]) m.rod("steel", [e * (xc - 0.04), yy, zc], [e * (xc + 0.06), yy, zc], 0.014, 6);
        }
      });
  });
}

/** The rear-view mirror housings at the cab side windows' front edges. */
function mirrors(m: MeshBuilder): void {
  m.scope("mirrors", () => {
    for (const e of [-1, 1])
      for (const sd of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${sd > 0 ? "right" : "left"}`, () => {
          const [a, b] = e > 0 ? [8.02, 8.26] : [-8.26, -8.02];
          const [z0, z1] = sd > 0 ? [W - 0.01, W + 0.1] : [-W - 0.1, -W + 0.01];
          block(m, "mirror", a, b, 2.7, 3.16, z0, z1);
        });
  });
}

/** The engine's exhaust through the roof hatch. */
function exhausts(m: MeshBuilder): void {
  m.scope("exhausts", () => {
    for (const x of [-1.55, -2.05]) exhaust(m, x, 0, CROWN + 0.04, CROWN + 0.13, 0.26, 0.4);
  });
}

/** The OBB 2016 in OBB traffic red. */
export function obb2016(): MeshBuilder {
  const s = spec();
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    lettering(m, sp);
    handrails(m);
    mirrors(m);
  });
  m.scope("roof equipment", () => exhausts(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb2016Lod(): MeshBuilder {
  const s = spec();
  // a coarser profile, so the paint bands and the window bands stay within the budget
  const tip: Table = [[Y0, 9.08], [SKIRT, 9.28], [2.3, 9.25], [SCREEN[0], 9.16], [SCREEN[1], 8.69], [4.0, 8.19], [CROWN, 7.2]];
  const hw: Table = [[Y0, W], [EAVE, W], [CHAMFER, 1.31], [4.0, 0.93], [CROWN, 0.15]];
  return boxLocoLod({ ...s, tip, hw });
}

/** The design (registered in atLocos.ts): 80 t, 2,000 kW, 140 km/h. */
export const OBB2016_DESIGN: ProceduralDesign = {
  id: "proc-vehicle-obb-2016", title: "OBB 2016 Hercules", build: obb2016, buildLod: obb2016Lod,
  game: { weight: 80, power: 2000, maxspeed: 140, accel: null }, catalog: DIESEL_LOCO_CATALOG, references: "obb-2016",
};
