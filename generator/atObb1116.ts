// The OBB 1116 "Taurus" (proc-vehicle-obb-1116), the Siemens ES64U2 Bo'Bo'
// dual-system electric locomotive of 2000 - 2006 (1016 / 1116), on the box
// locomotive kit (boxLocoKit.ts) with its own profile, measured on the reference
// photographs (assets/obb-1116/SOURCES.md; docs/models/austria-trains.md):
//
// - the cab end: the rounded, bulging nose, bowed in plan, its corners rounding
//   well back into the sides; the face leans back about 12 degrees below the
//   windscreen and curves back ever more steeply over it into the roof; the red
//   nose ends in a lip at 1.5 m over the grey corner blocks of the headstock,
//   the buffers and the coupling between them;
// - the large windscreen, two panes in a black field with the top headlight under
//   them and the wiper rail along its foot; the two tall lamp clusters at the face's
//   lower corners (headlight over tail lamp);
// - the side: the cab side window with its front edge raked along the joint of the
//   nose module, the joint running on down to the lamp; the grey sill band; one
//   machine-room door; the dark filter grilles in the roof's slopes (two at one end,
//   one long one at the other, turned about on the other side);
// - the roof: the cab roofs stand a little above the machine room's, two
//   single-arm pantographs, their knees toward the cabs, the rear one raised;
// - two liveries: OBB traffic red with the grey sill (1116 038-9) and the Railjet
//   livery of 1116 233-6 (the darker red, the bright red stripe and the dark grey
//   field rising toward the train end, the black cab roofs).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, kinks, lerpTable, onEnd, onSide, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (19.28 m). */
const HALF = 9.64;
/** The shell's lowest edge: the bottom of the grey sill. */
const Y0 = 0.98;
/** The grey sill's top on the sides; the red nose's lip on the ends. */
const SILL = 1.5;
/** The windscreen's black field: foot and head on the centre line. */
const FIELD = [2.47, 3.76] as const;
/** Where the side walls end and the roof's slopes begin. */
const EAVES = 3.5;
/** The machine room's roof; the cab roofs rise to CAP above it. */
const CROWN = 4.1;
const CAP = 4.24;
/** The nose's lip, |x|: the most forward point of the face. */
const LIP = 9.25;
/** The headstock's recess between the corner blocks: half width and depth behind them. */
const NOTCH = { hw: 0.56, depth: 0.32 } as const;

/** The face's centre line [y, |x|], bottom first (side photo, 60 px/m). */
const TIP: Table = [
  [Y0, 9.22], [SILL - 0.03, 9.22], [SILL, LIP], [1.68, LIP], [2.0, 9.16], [2.5, 8.96], [3.5, 8.46],
  [3.92, 8.02], [CROWN, 7.7],
];
/** The half width [y, hw]: the upright walls, the roof's rounded slopes. */
const HW: Table = [[Y0, 1.47], [1.1, 1.5], [EAVES, 1.5], [3.8, 1.39], [3.92, 1.28], [4.02, 1.13], [CROWN, 0.92]];
/** The nose corner's width across (m of z) and its depth back into the side (m of x), by height. */
const CORNER_Z: Table = [[Y0, 0.25], [SILL, 0.4], [2.5, 0.55], [EAVES, 0.7], [CROWN, 0.6]];
const CORNER_X: Table = [[Y0, 0.15], [SILL, 0.42], [2.5, 0.7], [EAVES, 0.95], [CROWN, 0.8]];
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.22;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

/** The end's plan at height y and half width w: the headstock's recess below the lip, the bowed face, an elliptic corner. */
function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(lerpTable(CORNER_Z, y), w * 0.9);
  const cx = lerpTable(CORNER_X, y);
  const flat = w - rz;
  // the bow: a parabola from the centre line out to the corner's start
  const face = (z: number) => BOW * (z / flat) ** 2;
  const d = y < SILL - 0.031 ? NOTCH.depth : 0;
  // the face sampled at fixed |z| (narrowed only near the crown) so items on it are cut into few columns
  const mid = [[0.3, 0.45], [0.6, 0.7], [0.85, 0.9]].map(([z, k]) => Math.min(z!, flat * k!)).map((z) => [z, face(z)] as const);
  const below = y < SILL - 0.031;
  return [
    ...(below
      ? [[0, d], [NOTCH.hw, d], [NOTCH.hw + 0.02, face(NOTCH.hw + 0.02)], [flat * 0.75, face(flat * 0.75)]] as const
      : [[0, 0], ...mid] as const),
    [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (cx - BOW) * (1 - Math.cos(a))] as const),
  ];
}

/** Where the flat side wall ends at height y (the nose corner begins). */
const wallEnd = (y: number) => lerpTable(TIP, y) - lerpTable(CORNER_X, y);

// --- liveries ----------------------------------------------------------------------

interface TaurusLivery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The body colour (cab roofs' sides, lamp housings' surround). */
  body: string;
  /** The cab roofs' colour. */
  cap: string;
  number: string;
  /** The number on the front: centre right of the centre line (as seen), foot, height, colour. */
  frontNumber: { r: number; y: number; h: number; mat: string };
  /** The OBB mark on the front: centre right of the centre line, foot, height. */
  frontLogo: { r: number; y: number; h: number };
  /** The OBB mark on the sides: centre x on the -z side (turned about on +z), foot, height. */
  sideLogo: { x: number; y: number; h: number };
  sidePaint: readonly SideItem[];
  endPaint: readonly EndItem[];
}

/** The Railjet livery's dark grey field: its top edge [x, y], rising from under the cab toward the train end (-x), steep at first. */
const RJ_GREY: Table = [[5.7, Y0 + 0.005], [4.2, 1.55], [2.5, 1.98], [0.0, 2.27], [-4.0, 2.47], [-9.0, 2.56]];
/** The bright red stripe over it, the same curve 0.36 m higher, starting further forward. */
const RJ_STRIPE: Table = [[6.7, Y0 + 0.005], [5.2, 1.8], [3.5, 2.27], [1.0, 2.6], [-3.0, 2.8], [-9.0, 2.9]];
/** A paint outline under a top edge, cut at the side wall's end x0 (< 0): front foot, rear foot, up the cut, along the edge. */
function underEdge(edge: Table, x0: number): { x: [number, number]; y: [number, number]; poly: Ring } {
  const top = (x: number) => lerpTable(edge.map(([u, v]) => [-u, v] as const), -x);
  const pts = edge.filter(([u]) => u > x0 + 1e-3);
  const poly: Ring = [[pts[0]![0], Y0 + 0.005], [x0, Y0 + 0.005], [x0, top(x0)], ...[...pts].reverse().slice(0, -1).map(([u, v]) => [u, v] as [number, number])];
  return { x: [x0, pts[0]![0]], y: [Y0 + 0.005, top(x0)], poly };
}

const LIVERIES: Record<string, TaurusLivery> = {
  obbRed: {
    title: "Traffic red",
    palette: { red: c("#d20a1e"), grey: c("#46494d", 0.6), white: c("#f2f2ef"), roofTop: c("#55585b", 0.75) },
    side: [[Y0, SILL, "grey"], [SILL, 4.4, "red"]],
    end: [[Y0, SILL, "grey"], [SILL, 4.4, "red"]],
    body: "red",
    cap: "red",
    number: "1116 038-9",
    frontNumber: { r: 0.36, y: 2.2, h: 0.09, mat: "white" },
    frontLogo: { r: -0.3, y: 1.72, h: 0.22 },
    sideLogo: { x: -4.6, y: 2.25, h: 0.5 },
    sidePaint: [],
    endPaint: [],
  },
  railjet: {
    title: "Railjet",
    palette: { red: c("#b8102a"), bright: c("#ec2d2a"), grey: c("#47423f", 0.6), white: c("#f2f2ef"), black: c("#1c1c1e", 0.6), roofTop: c("#3d3b3a", 0.75) },
    side: [[Y0, SILL, "red"], [SILL, 4.4, "red"]],
    end: [[Y0, SILL, "grey"], [SILL, FIELD[1] - 0.06, "red"], [FIELD[1] - 0.06, 4.4, "black"]],
    body: "red",
    cap: "black",
    number: "1116 233-6",
    frontNumber: { r: 0.0, y: 3.78, h: 0.11, mat: "white" },
    frontLogo: { r: -0.3, y: 2.08, h: 0.11 },
    sideLogo: { x: 4.3, y: 3.05, h: 0.1 },
    sidePaint: [
      // the bright red stripe and the dark grey field rising toward the train end (-x), on both sides
      { kind: "paint", name: "red stripe", ...underEdge(RJ_STRIPE, -wallEnd(2.8) + 0.02), mat: "bright", layer: 1 },
      { kind: "paint", name: "grey field", ...underEdge(RJ_GREY, -wallEnd(2.5) + 0.02), mat: "grey", layer: 2 },
      // the black cab roofs down to the eaves
      { kind: "paint", name: "cab roof", x: [6.05, wallEnd(3.8) - 0.01], y: [EAVES + 0.005, CROWN - 0.005], mat: "black", layer: 1, mirror: true },
    ],
    endPaint: [],
  },
};

export const TAURUS_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): TaurusLivery => LIVERIES[resolveParams(TAURUS_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The cab roofs reach back to |x| = CAP_X over the machine room. */
const CAP_X = 6.05;
/** The single-arm pantographs: base centre |x|, base height. */
const PANTO = { x: 4.45, base: CROWN + 0.22 } as const;
/** The machine-room door on the -z side (turned about on +z): x span, y span. */
const DOOR = { x: [1.53, 2.47] as const, y: [SILL + 0.03, 3.38] as const };
/** The filter grilles in the roof's slopes on the -z side (turned about on +z): x spans, y span. */
const GRILLES = { x: [[2.4, 3.16], [3.27, 4.44], [-6.6, -5.35]] as const, y: [3.62, 4.0] as const };
/** The cab side window: rear edge, sill and head; its front edge follows the nose module's joint. */
const CAB_WINDOW = { x: 7.15, y: [2.8, 3.47] as const, round: 0.12 };
/** The nose module's joint on the sides: [y, |x|] from the eaves down to the lamp. */
const JOINT: Table = [[1.58, LIP - 0.78], [2.8, LIP - 1.3], [EAVES, LIP - 1.5]];
const jointX = (y: number) => lerpTable(JOINT, y);
/** The lamp clusters: z span (outer), y span, the headlight over the tail lamp. */
const LAMPS = { z: [0.82, 1.2] as const, y: [1.58, 2.08] as const };

function spec(l: TaurusLivery, lod = false): LocoSpec {
  const turned = (sd: number, x: readonly [number, number]): [number, number] => (sd < 0 ? [x[0], x[1]] : [-x[1], -x[0]]);
  const grilles: SideItem[] = [1, -1].flatMap((sd) => GRILLES.x.map((x, i): SideItem => ({
    kind: "window", name: `filter grille ${i + 1}`, x: turned(sd, x), y: GRILLES.y, mat: l.body, r: 0.04, sides: [sd],
  })));
  const lodOnly: { side: SideItem[] } = lod
    ? {
      side: [{ kind: "window", name: "cab window", x: [CAB_WINDOW.x, 7.75], y: CAB_WINDOW.y, mirror: true }],
    }
    : { side: [] };
  return {
    palette: {
      groove: c("#2a2627", 0.7), rim: c("#a7acae", 0.4), louvre: c("#1f2124", 0.8), rubber: c("#17181a", 0.8),
      tailLamp: { color: "#9e1b1b", roughness: 0.3, lamp: { role: "tail" } },
      bogie: c("#2c2d30", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: l.body,
    buffers: HALF,
    beam: 9.0,
    bufferY: 1.04,
    bufferHead: "rect",
    frame: { y0: 0.9, y1: 1.0, half: 8.8, hw: 1.35, mat: "underframe" },
    bogies: [-4.95, 4.95].map((xc) => ({ xc, axles: [-1.5, 1.5], wheelR: 0.575, frameTop: 0.93 })),
    pantograph: { kind: "singleArm", x: PANTO.x, roofY: CROWN, baseY: PANTO.base },
    hvLine: { x: 2.2, y: CROWN + 0.32, z: 0 },
    sideItems: [
      ...[1, -1].map((sd): SideItem => ({ kind: "door", name: "machine room door", x: turned(sd, DOOR.x), y: DOOR.y, sides: [sd] })),
      ...grilles,
      ...l.sidePaint,
      ...lodOnly.side,
    ],
    endItems: [
      // the corner blocks of the headstock, the black windscreen field and the wiper rail at its foot
      { kind: "paint", name: "windscreen field", z: [-1.04, 1.04], y: FIELD, mat: "black", poly: [[-1.04, FIELD[0]], [1.04, FIELD[0]], [0.98, FIELD[1]], [-0.98, FIELD[1]]], layer: 4 },
      { kind: "window", name: "windscreen left", z: [0.035, 0.96], y: [2.86, 3.7], mat: "black", wiper: true },
      { kind: "window", name: "windscreen right", z: [-0.96, -0.035], y: [2.86, 3.7], mat: "black", wiper: true },
      { kind: "lamp", name: "top headlight", z: [-0.07, 0.07], y: [2.6, 2.74], rect: true },
      { kind: "paint", name: "wiper rail", z: [-1.02, 1.02], y: [2.41, 2.46], mat: "rubber", layer: 5 },
      // the lamp clusters: a black housing, the headlight over the tail lamp
      ...[-1, 1].flatMap((s): EndItem[] => {
        const z = (s > 0 ? [LAMPS.z[0], LAMPS.z[1]] : [-LAMPS.z[1], -LAMPS.z[0]]) as [number, number];
        const zi = [z[0] + 0.04, z[1] - 0.04] as const;
        const side = s > 0 ? "left" : "right";
        return [
          { kind: "paint", name: `lamp housing ${side}`, z, y: LAMPS.y, mat: "black", layer: 1 },
          { kind: "lamp", name: `headlight ${side}`, z: zi, y: [1.74, 2.03], rect: true },
          { kind: "lamp", name: `tail lamp ${side}`, z: zi, y: [1.62, 1.69], rect: true, mat: "tailLamp" },
        ];
      }),
      ...l.endPaint,
    ],
    roofItems: [{ name: "roof top", x: [-CAP_X + 0.02, CAP_X - 0.02], w: [0.92, 0.9], y: [CROWN, CROWN + 0.012], mat: "roofTop" }],
    // the transformer and the boxes between the bogies
    underItems: [[-2.9, 2.9, 0.42, 0.98, 1.2], [-3.4, -2.9, 0.6, 0.98, 1.05], [2.9, 3.4, 0.6, 0.98, 1.05]],
    plough: "underframe",
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/**
 * The cab roofs: each rises from the machine room's roof to CAP over the cab, its
 * front following the nose's plan, lofted through four levels so it rounds off.
 */
function cabRoofs(m: MeshBuilder, sp: ShellSpec, l: TaurusLivery): void {
  // the lowest level a little under the machine room's roof, on the shell's own outline there, so the
  // shell's roof edge stays inside the cab roof
  const y0 = CROWN - 0.06;
  const levels = [
    { y: y0, w: lerpTable(HW, y0) + 0.012, front: lerpTable(TIP, y0) + 0.015, back: CAP_X, at: CROWN },
    { y: CROWN + 0.07, w: 0.84, front: 7.53, back: CAP_X + 0.02, at: CROWN },
    { y: CROWN + 0.12, w: 0.72, front: 7.38, back: CAP_X + 0.06, at: CROWN },
    { y: CAP, w: 0.55, front: 7.2, back: CAP_X + 0.12, at: CROWN },
  ];
  // counter-clockwise from above for the front cab (as the kit's frame): the rear edge from -z to +z,
  // then the bowed front from the +z corner over the centre line to the -z corner; the rear cab turned about
  const planAt = (y: number) => {
    const w = lerpTable(HW, y);
    return sp.endPlan(y).map(([z, b]) => [Math.min(z, w) / w, b] as const);
  };
  const ring = (lv: (typeof levels)[number], e: number): Ring => {
    const half = planAt(lv.at).map(([z, b]): [number, number] => [lv.front - b, z * lv.w]);
    const pts: Array<[number, number]> = [
      [lv.back, -lv.w], [lv.back, lv.w],
      ...[...half].reverse(),
      ...half.slice(1).map(([x, z]): [number, number] => [x, -z]),
    ];
    return e > 0 ? pts : pts.map(([x, z]) => [-x, -z] as [number, number]);
  };
  m.scope("cab roofs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        for (let i = 1; i < levels.length; i++) m.loft(l.cap, ring(levels[i - 1]!, e), levels[i - 1]!.y, ring(levels[i]!, e), levels[i]!.y, i === levels.length - 1);
      });
  });
}

/** The cab side window: the rear edge upright, the front edge along the nose module's joint, the top front corner rounded. */
function cabWindowRing(inset: number, e: number): Ring {
  const [y0, y1] = [CAB_WINDOW.y[0] + inset, CAB_WINDOW.y[1] - inset];
  const x0 = CAB_WINDOW.x + inset;
  const margin = 0.06 + inset;
  const [fb, ft] = [jointX(y0) - margin, jointX(y1) - margin];
  const R = CAB_WINDOW.round;
  const fr = fb + ((ft - fb) * (y1 - R - y0)) / (y1 - y0);
  const arc = [0, 30, 60, 90].map((a) => [fr - R + R * Math.cos((a * Math.PI) / 180), y1 - R + R * Math.sin((a * Math.PI) / 180)] as [number, number]);
  const k = 0.04;
  const ring: Ring = [[x0 + k, y0], [fb - k, y0], [fb, y0 + k], ...arc, [x0 + k, y1], [x0, y1 - k], [x0, y0 + k]];
  return e > 0 ? ring : ring.map(([u, v]) => [-u, v] as [number, number]).reverse();
}

/** The cab side windows and the nose module's joint below them. */
function cabSides(m: MeshBuilder, sp: ShellSpec): void {
  const vB = kinks(TIP, HW);
  m.scope("cab windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          m.scope("frame", () => surfacePanel(m, "rubber", at, n, cabWindowRing(-0.03, e), -0.01, 0.012, [], vB));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, cabWindowRing(0.0, e), -0.005, 0.02, [], vB));
          // the joint from the window's foot down to the lamp: a thin groove
          const y0 = 1.6, y1 = CAB_WINDOW.y[0] - 0.03;
          const g: Ring = [[jointX(y0) - 0.012, y0], [jointX(y0) + 0.012, y0], [jointX(y1) + 0.012, y1], [jointX(y1) - 0.012, y1]];
          m.scope("joint", () => surfacePanel(m, "groove", at, n, e > 0 ? g : g.map(([u, v]) => [-u, v] as [number, number]).reverse(), 0.001, 0.004, [], vB));
        });
  });
}

/** Text on a side, centred at x (seen from that side) with its foot at y. */
function sideText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, x: number, y: number, h: number, weight: number, sd: number): void {
  const w = wordWidth(text, h, { weight });
  const at = onSide(sp, sd);
  const tris = letters(text, sd > 0 ? x - w / 2 : x + w / 2, y, h, sd < 0, { weight });
  m.facets(mat, tris.map(([u, v]) => at(u, v, 0.0115)), [0, 0, sd]);
}

/** Text on an end, centred `r` right of the centre line as the reader sees it, its foot at y. */
function endText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, r: number, y: number, h: number, weight: number, e: number): void {
  const w = wordWidth(text, h, { weight });
  const at = onEnd(sp, e);
  const zc = -e * r;
  const tris = letters(text, e > 0 ? zc + w / 2 : zc - w / 2, y, h, e > 0, { weight });
  m.facets(mat, tris.map(([u, v]) => at(u, v, 0.0115)), [e, 0, 0]);
}

/** The OBB mark: "OBB" with the stroke across the O, its left edge at u0 (reader's left), foot y. */
function obbMark(text: (t: string, u: number, h: number) => void, slash: (u0: number, v0: number, u1: number, v1: number, t: number) => void, cu: number, y: number, h: number): void {
  const style = { weight: 0.2 };
  const w = wordWidth("OBB", h, style);
  const o = wordWidth("O", h, style);
  text("OBB", cu, h);
  const u0 = cu - w / 2;
  slash(u0 + o * 0.12, y + h * 0.08, u0 + o * 0.88, y + h * 0.92, h * 0.11);
}

/** The marks and running numbers. */
function lettering(m: MeshBuilder, sp: ShellSpec, l: TaurusLivery): void {
  const short = l.number.replace(/-\d$/, "");
  m.scope("lettering", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        // u as the reader sees it (right +) to the face's z
        const zOf = (u: number) => -e * u;
        m.scope("number", () => endText(m, sp, l.frontNumber.mat, short, l.frontNumber.r, l.frontNumber.y, l.frontNumber.h, 0.15, e));
        m.scope("emblem", () => obbMark(
          (t, cu, h) => endText(m, sp, "white", t, cu, l.frontLogo.y, h, 0.2, e),
          (u0, v0, u1, v1, t) => {
            const q: Array<[number, number]> = [[u0 - t / 2, v0], [u0 + t / 2, v0], [u1 + t / 2, v1], [u1 - t / 2, v1]];
            const tri = [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!];
            m.facets("white", tri.map(([u, v]) => at(zOf(u), v, 0.0125)), [e, 0, 0]);
          },
          l.frontLogo.r, l.frontLogo.y, l.frontLogo.h,
        ));
      });
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        // on the +z side the reader's right is +x; the -z side reads toward -x
        const xOf = (u: number) => sd * u;
        const cx = -sd * l.sideLogo.x;
        m.scope("emblem", () => obbMark(
          (t, cu, h) => sideText(m, sp, "white", t, xOf(cu), l.sideLogo.y, h, 0.2, sd),
          (u0, v0, u1, v1, t) => {
            const q: Array<[number, number]> = [[u0 - t / 2, v0], [u0 + t / 2, v0], [u1 + t / 2, v1], [u1 - t / 2, v1]];
            const tri = [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!];
            m.facets("white", tri.map(([u, v]) => at(xOf(u), v, 0.0125)), [0, 0, sd]);
          },
          sd * cx, l.sideLogo.y, l.sideLogo.h,
        ));
        m.scope("number", () => sideText(m, sp, "white", l.number, sd * 1.2, 1.18, 0.1, 0.14, sd));
      });
  });
}

/** The OBB 1116 in a livery. */
export function obb1116(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    cabRoofs(m, sp, l);
    cabSides(m, sp);
    lettering(m, sp, l);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function obb1116Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}

/** The design (registered in atLocos.ts): 86 t, 6,400 kW, 230 km/h. */
export const OBB1116: ProceduralDesign = {
  id: "proc-vehicle-obb-1116", title: "OBB 1116 Taurus", build: obb1116, buildLod: obb1116Lod, params: TAURUS_PARAMS,
  game: { weight: 86, power: 6400, maxspeed: 230, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "obb-1116",
};
