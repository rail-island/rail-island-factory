// The China Railways SS8 "Shaoshan 8" (Zhuzhou Electric Locomotive Works, 1994-2001), the
// Bo-Bo passenger electric of 170 km/h, measured from the photographs in assets/cr-ss8/
// (SOURCES.md) and the published figures: 17.516 m over the couplers, a 16.3 m body,
// 3.1 m wide, 88 t, 1.25 m wheels. Drawn as SS8 0228 of the Guangzhou depot in the class's
// blue livery: light blue, cream and a steel blue with a dark steel blue stripe (the colours sampled
// from the photographs of SS8 0077 and 0228: the median of clean patches, lifted for the shade).
//
// Its own profile tables on the box locomotive kit (boxLocoKit.ts), not the generic world
// locomotive: both cab ends alike, the face upright below a crease at 2.4 m and raked back
// above it to the roof, its corners swept back; the two separate windscreens in white rims,
// the round headlight in a pod on the face's top edge, the lamp housings low in the face
// (headlight outboard, red lamp inboard), the cream chevron across the face with the CR
// emblem, the number on the royal blue lower face, the deep skirt dropping toward each end and
// the striped plough. The sides: the cab's light blue with a raked side window and the door,
// a light blue slanted band behind it, the long blue louvre panel with its slanted ends, a row
// of six oval windows above it, the navy stripe along the light blue lower band. The roof: an
// air conditioner over each cab, a single-arm pantograph behind each (the rear raised), the
// roof cable between them. The automatic couplers are drawn as the kit's centre coupler at
// 0.88 m, with no side buffers. See docs/models/china-locos.md.

import type { MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, rect, surfacePanel, type Place } from "./czElectricKit.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

/** The running number (the three-quarter photograph's unit, Guangzhou depot). */
export const SS8_NUMBER = "SS8 0228";
/** Half the length over the coupler faces (17.516 m). */
export const SS8_HALF = 17.516 / 2;
/** The face's most forward point, the crease at CREASE (the 16.3 m body). */
const N = 16.3 / 2;
const Y0 = 0.9;
const CREASE = 2.4;
const SHOULDER = 3.75;
const ROOF = 4.08;
const W = 1.5;
/** How far the face's corners are swept back behind its centre. */
const CORNER_BACK = 0.45;

// the livery's heights: the royal blue lower body, the light blue bands with the navy stripe, the cream
const LOWER = 1.45;
const STRIPE: readonly [number, number] = [1.66, 1.78];
const CREAM = 2.0;
/** The cab's light blue above the cream on the side and the face. */
const CAB_BLUE = 2.5;

/** The end's centre line [y, |x|]: upright below the crease, raked back above it, the roof rounding down. */
const TIP = [[Y0, N - 0.12], [LOWER, N - 0.1], [CREASE, N], [SHOULDER, N - 0.45], [3.95, N - 0.58], [ROOF, N - 0.8]] as const;
const HW = [[Y0, W], [SHOULDER, W], [3.92, 1.45], [4.02, 1.3], [ROOF, 1.1]] as const;
/** The face in plan: bowed slightly, the corners swept back. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.5, 0.05], [w * 0.8, 0.17], [w * 0.94, 0.3], [w, CORNER_BACK]] as const;

/** Distance d behind the face's tip to the front half's model x. */
const X = (d: number) => N - d;
/** Where the side wall begins, d behind the tip, at height y. */
const wallAt = (y: number) => N - lerpTable(TIP, y) + CORNER_BACK;

const PANTO_X = 4.4;
const BOGIE_X = 4.1;
const HALF_BASE = 1.4;
const WHEEL_R = 0.625;

/** The cab's side paint: the light blue round the window and the slanted band behind the door (front half, convex pieces). */
function cabPaint(): SideItem[] {
  // the band's front edge runs from (1.55, SHOULDER) to (2.4, CREAM), its rear edge 0.35 behind it
  const front = (y: number) => 2.4 - ((y - CREAM) / (SHOULDER - CREAM)) * 0.85;
  const cab: Ring = [[X(wallAt(CAB_BLUE)), CAB_BLUE], [X(front(CAB_BLUE)), CAB_BLUE], [X(front(SHOULDER)), SHOULDER], [X(wallAt(SHOULDER)), SHOULDER]];
  const band: Ring = [[X(front(CREAM)), CREAM], [X(front(CREAM) + 0.35), CREAM], [X(front(SHOULDER) + 0.35), SHOULDER], [X(front(SHOULDER)), SHOULDER]];
  return [
    { kind: "paint", name: "cab blue", x: [X(2.2), X(wallAt(SHOULDER))], y: [CAB_BLUE, SHOULDER], poly: cab, mat: "lightBlue", mirror: true },
    { kind: "paint", name: "cab band", x: [X(2.75), X(1.55)], y: [CREAM, SHOULDER], poly: band, mat: "lightBlue", mirror: true },
  ];
}

/** The machine room: the blue panel with slanted ends and the louvres in it, the oval windows above (rotationally symmetric). */
function roomItems(): SideItem[] {
  const panel: Ring = [[-X(2.75), CREAM], [X(2.75), CREAM], [X(3.3), 3.17], [-X(3.3), 3.17]];
  const ovals = [-4.45, -2.4, -0.5, 0.55, 2.4, 4.25];
  return [
    { kind: "paint", name: "louvre panel", x: [-X(2.75), X(2.75)], y: [CREAM, 3.17], poly: panel, mat: "panel" },
    { kind: "grille", name: "louvres", x: [-X(3.45), X(3.45)], y: [2.08, 3.07], slats: "v", pitch: 0.1, mat: "panelSlat" },
    ...[1, -1].flatMap((sd) => ovals.map((x, i): SideItem => ({ kind: "window", name: `oval window ${i + 1}`, x: [sd * x - 0.29, sd * x + 0.29], y: [3.24, 3.5], r: 0.12, mat: "rubber", sides: [sd] }))),
  ];
}

export function ss8Spec(): LocoSpec {
  const sideBands = [[1.0, LOWER, "royal"], [LOWER, STRIPE[0], "lightBlue"], [STRIPE[0], STRIPE[1], "navy"], [STRIPE[1], CREAM, "lightBlue"], [CREAM, SHOULDER, "cream"], [SHOULDER, 4.4, "roof"]] as const;
  const endBands = [[1.0, LOWER, "royal"], [LOWER, CAB_BLUE, "cream"], [CAB_BLUE, 4.4, "lightBlue"]] as const;
  // the face: the light blue V above the cream chevron and the light blue lamp pockets below it
  const endItems: EndItem[] = [
    { kind: "paint", name: "chevron top", z: [-W, W], y: [2.12, CAB_BLUE], poly: [[-W, CAB_BLUE], [-0.35, 2.12], [0.35, 2.12], [W, CAB_BLUE]], mat: "lightBlue" },
    ...[1, -1].map((s): EndItem => ({ kind: "paint", name: s > 0 ? "lamp pocket left" : "lamp pocket right", z: s > 0 ? [0.36, W] : [-W, -0.36], y: [LOWER, CREAM], poly: s > 0 ? [[0.36, LOWER], [W, LOWER], [W, CREAM], [0.9, CREAM]] : [[-W, LOWER], [-0.36, LOWER], [-0.9, CREAM], [-W, CREAM]], mat: "lightBlue" })),
    ...[1, -1].map((s): EndItem => ({ kind: "paint", name: s > 0 ? "stripe left" : "stripe right", z: s > 0 ? [1.33, W] : [-W, -1.33], y: STRIPE, mat: "navy", layer: 1 })),
    ...[1, -1].map((s): EndItem => ({ kind: "paint", name: s > 0 ? "lamp housing left" : "lamp housing right", z: s > 0 ? [0.73, 1.31] : [-1.31, -0.73], y: [1.64, 1.96], mat: "housing", layer: 1 })),
    { kind: "window", name: "windscreen left", z: [0.2, 1.26], y: [2.7, 3.46], mat: "rim", wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.26, -0.2], y: [2.7, 3.46], mat: "rim", wiper: true },
    { kind: "lamp", name: "headlight left", z: [1.05, 1.25], y: [1.7, 1.9], r: 0.095 },
    { kind: "lamp", name: "headlight right", z: [-1.25, -1.05], y: [1.7, 1.9], r: 0.095 },
    { kind: "lamp", name: "tail lamp left", z: [0.79, 0.99], y: [1.7, 1.9], r: 0.09, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-0.99, -0.79], y: [1.7, 1.9], r: 0.09, mat: "lampRed" },
  ];
  return {
    palette: {
      lightBlue: c("#91c3d2"),
      cream: c("#ece8df"),
      royal: c("#466881"),
      navy: c("#345a7a"),
      panel: c("#3e6784"),
      panelSlat: c("#4a7393", 0.6),
      louvre: c("#1f3346", 0.8),
      roof: { color: "#cdd0ce", roughness: 0.7 },
      underframe: c("#55585b", 0.75),
      housing: c("#4f5458", 0.6),
      rim: c("#e4e6e3", 0.45),
      red: c("#c8202c"),
      coupler: c("#2a2b2d", 0.7),
      ac: { color: "#b9bcbd", metallic: 0.3, roughness: 0.5 },
      stripeWhite: c("#eeeeea"),
      frame: c("#2c2e31", 0.75),
      plate: c("#466881"),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: sideBands,
    end: endBands,
    roof: "roof",
    buffers: SS8_HALF,
    beam: N - 0.1,
    centreCoupler: 0.88,
    frame: { y0: Y0 - 0.05, y1: Y0, half: X(2.45), hw: 1.42, mat: "frame" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOF, baseY: ROOF + 0.3 },
    hvLine: { x: 1.4, y: ROOF + 0.42, z: 0 },
    sideItems: [
      ...cabPaint(),
      ...roomItems(),
      { kind: "door", name: "cab door", x: [X(2.45), X(1.85)], y: [1.55, 3.6], rails: true, mirror: true, r: 0.08 },
    ],
    endItems,
    roofItems: [
      { name: "front air conditioner", x: [X(2.95), X(1.55)], w: [0.98, 0.95], y: [ROOF - 0.02, ROOF + 0.42], mat: "ac" },
      { name: "rear air conditioner", x: [-X(1.55), -X(2.95)], w: [0.98, 0.95], y: [ROOF - 0.02, ROOF + 0.42], mat: "ac" },
      { name: "roof hatches", x: [-X(3.0), X(3.0)], w: [1.05, 1.0], y: [ROOF - 0.02, ROOF + 0.05], mat: "roof" },
      { name: "main breaker", x: [-0.9, -0.2], w: [0.3, 0.25], y: [ROOF + 0.04, ROOF + 0.4], mat: "breaker" },
    ],
    // the battery boxes and the reservoirs between the bogies
    underItems: [[-0.9, 0.1, 0.45, Y0 - 0.05, 1.15], [0.25, 1.85, 0.4, Y0 - 0.05, 1.15]],
    number: SS8_NUMBER,
  };
}

/** Text laid on a surface, centred at (u, v): strokes `h` high in `mat`, `d` off it; `flip` reads toward -u. */
function textOn(m: MeshBuilder, mat: string, at: Place, n: Vec3, text: string, u: number, v: number, h: number, d: number, flip: boolean): void {
  const w = h * 0.55, gap = h * 0.2;
  const width = strokeWidth(text, w, gap);
  const pts = strokeText(text, -width / 2, v - h / 2, h, w, gap, false, h * 0.15);
  m.facets(mat, pts.map(([a, b]) => at(flip ? u - a : u + a, b, d)), n);
}

/** The deep skirt under each cab: from the side's foot down to 0.55 m at the face, following the face's plan. */
function skirts(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  const back = 2.45; // where the skirt leaves the side's foot, d behind the tip
  const foot = 0.45; // its bottom at the face
  const bottomAt = (d: number) => (d <= 0.6 ? foot : foot + ((d - 0.6) / (back - 0.6)) * (Y0 - foot));
  m.scope("skirts", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front skirt" : "rear skirt", () => {
        const plan = sp.endPlan(Y0);
        const tip = sp.tip(Y0);
        const w = W - 0.01;
        // the outline at the side's foot, from the -z rear corner round the face to the +z rear corner: [d, z]
        const outline: Array<[number, number]> = [[back, -w], ...[...plan].reverse().map(([z, b]): [number, number] => [N - tip + b, -Math.min(z, w)]), ...plan.slice(1).map(([z, b]): [number, number] => [N - tip + b, Math.min(z, w)]), [back, w]];
        const at = (d: number, z: number, y: number): Vec3 => [e * X(d), y, e * z];
        const bot = (d: number, z: number): Vec3 => at(d + (bottomAt(d) < Y0 ? 0.06 * ((Y0 - bottomAt(d)) / (Y0 - foot)) : 0), z * 0.985, bottomAt(d));
        for (let i = 1; i < outline.length; i++) {
          const [[da, za], [db, zb]] = [outline[i - 1]!, outline[i]!];
          const n: Vec3 = [e * -(zb - za) * 0 + e, 0, 0];
          const quad = [at(da, za, Y0), at(db, zb, Y0), bot(db, zb), at(da, za, Y0), bot(db, zb), bot(da, za)];
          // wound to face away from the skirt's middle
          const mid: Vec3 = [e * X(1.2), Y0, 0];
          const cx = (quad[0]![0] + quad[1]![0]) / 2 - mid[0], cz = (quad[0]![2] + quad[1]![2]) / 2;
          m.facets("royal", quad, Math.abs(cx) + Math.abs(cz) > 0 ? [cx, 0, cz] : n);
        }
        // the bottom, fanned from the rear corners
        const pts = outline.map(([d, z]) => bot(d, z));
        const tris: Vec3[] = [];
        for (let i = 1; i + 1 < pts.length; i++) tris.push(pts[0]!, pts[i]!, pts[i + 1]!);
        m.facets("royal", tris, [0, -1, 0]);
      });
  });
}

/** The plough under each skirt: a plate leaning back to the rail, white with red stripes leaning out from the middle. */
function ploughs(m: MeshBuilder): void {
  const top = 0.45, bottom = 0.06;
  const [dTop, dBot] = [0.18, 0.3];
  const [wTop, wBot] = [1.42, 1.28];
  m.scope("ploughs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front plough" : "rear plough", () => {
        const P = (d: number, z: number, y: number): Vec3 => [e * X(d), y, e * z];
        const face = (t: number, z: number, out: number): Vec3 => {
          // t: 0 at the top, 1 at the bottom; out: off the plate's face
          const d = dTop + (dBot - dTop) * t - out;
          return P(d, z, top + (bottom - top) * t + out * 0.45);
        };
        // the plate: its face, a back 0.06 behind, closed round
        const th = 0.06;
        const fl = (t: number) => wTop + (wBot - wTop) * t;
        m.slab("stripeWhite", [face(0, -fl(0), 0), face(0, fl(0), 0), face(1, fl(1), 0), face(1, -fl(1), 0)], [e * -th, 0, 0]);
        // the stripes: parallelograms leaning out from the middle, on both halves
        for (const sz of [-1, 1])
          for (let k = 0; k < 5; k++) {
            // the stripe's foot lies further out than its top: the stripes meet in a peak over the middle
            const z0 = 0.04 + k * 0.29;
            const lean = 0.2;
            const q: Vec3[] = [face(0, sz * z0, 0.006), face(0, sz * (z0 + 0.13), 0.006), face(1, sz * Math.min(z0 + lean + 0.13, fl(1) - 0.01), 0.006), face(1, sz * Math.min(z0 + lean, fl(1) - 0.02), 0.006)];
            if (Math.abs(q[3]![2]) >= Math.abs(q[2]![2]) || Math.abs(q[1]![2]) > fl(0)) continue;
            m.facets("red", [q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!], [e, 0.45, 0]);
          }
      });
  });
}

/** The round headlight on the face's top edge: a light blue pod with the lamp in it. */
function topLamps(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  const y = 3.9;
  m.scope("top headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front top headlight" : "rear top headlight", () => {
        const x = sp.tip(y);
        const [a, b] = [e * (x - 0.35), e * (x + 0.1)].sort((p, q) => p - q) as [number, number];
        m.sweep("lightBlue", "x", ngon(14, 0.24, 0, 0, y), a, ngon(14, 0.24, 0, 0, y), b);
        const [f0, f1] = [e * (x + 0.1), e * (x + 0.12)].sort((p, q) => p - q) as [number, number];
        m.sweep("rubber", "x", ngon(14, 0.19, 0, 0, y), f0, ngon(14, 0.19, 0, 0, y), f1);
        const [l0, l1] = [e * (x + 0.12), e * (x + 0.13)].sort((p, q) => p - q) as [number, number];
        m.sweep("lampHead", "x", ngon(12, 0.14, 0, 0, y), l0, ngon(12, 0.14, 0, 0, y), l1);
      });
  });
}

/** The louvred end of each air conditioner, facing its cab's end. */
function acGrilles(m: MeshBuilder): void {
  m.scope("air conditioner grilles", () => {
    for (const e of [-1, 1]) {
      const x = e * (X(1.55) + 0.004);
      m.slab("louvre", [[x, ROOF + 0.06, -0.8], [x, ROOF + 0.06, 0.8], [x, ROOF + 0.34, 0.8], [x, ROOF + 0.34, -0.8]], [-e * 0.02, 0, 0]);
    }
  });
}

/** The cab side windows: the front edge raked with the face. */
function cabWindows(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  const [y0, y1] = [2.68, 3.58];
  const front = (y: number) => wallAt(y) + 0.06;
  const rear = 1.72;
  m.scope("cab windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"} cab window`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const ring = (inset: number): Ring => {
            const q: Ring = [[X(rear - inset), y0 + inset], [X(front(y0 + inset) + inset), y0 + inset], [X(front(y1 - inset) + inset), y1 - inset], [X(rear - inset), y1 - inset]];
            return e > 0 ? q : q.map(([u, v]) => [-u, v] as [number, number]).reverse();
          };
          m.scope("frame", () => surfacePanel(m, "rim", at, n, ring(0), -0.01, 0.014, [], [SHOULDER]));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, ring(0.05), -0.005, 0.022, [], [SHOULDER]));
          // the sliding pane's edge, raked like the window's front edge, halfway back
          const bar = (y: number) => (rear + front(y)) / 2;
          const q: Ring = [[X(bar(y0 + 0.04) + 0.02), y0 + 0.04], [X(bar(y0 + 0.04) - 0.02), y0 + 0.04], [X(bar(y1 - 0.04) - 0.02), y1 - 0.04], [X(bar(y1 - 0.04) + 0.02), y1 - 0.04]];
          m.scope("bar", () => surfacePanel(m, "rim", at, n, e > 0 ? q : q.map(([u, v]) => [-u, v] as [number, number]).reverse(), 0.0, 0.026, [], [SHOULDER]));
        });
  });
}

/** The CR emblem on the face's chevron, the numbers on the face and the cab sides. */
function markings(m: MeshBuilder, s: LocoSpec): void {
  const sp = shellOf(s);
  m.scope("markings", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front markings" : "rear markings", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        const [cy, r] = [1.86, 0.19];
        // the emblem: a red ring round the rail's head and web
        m.scope("emblem", () => {
          surfacePanel(m, "red", at, n, ngon(14, r, 0, 0, cy), 0.004, 0.008);
          surfacePanel(m, "cream", at, n, ngon(14, r * 0.74, 0, 0, cy), 0.006, 0.01);
          surfacePanel(m, "red", at, n, rect(-0.1, cy + 0.03, 0.1, cy + 0.1), 0.008, 0.012);
          surfacePanel(m, "red", at, n, rect(-0.035, cy - r * 0.95, 0.035, cy + 0.03), 0.008, 0.012);
          surfacePanel(m, "red", at, n, rect(-0.09, cy - r - 0.02, 0.09, cy - r + 0.03), 0.004, 0.008);
        });
        m.scope("number", () => textOn(m, "stripeWhite", at, n, SS8_NUMBER, 0, 1.29, 0.2, 0.006, e > 0));
        // the train supply sockets beside the coupler
        m.scope("sockets", () => {
          for (const z of [-0.85, 0.85]) surfacePanel(m, "red", at, n, rect(z - 0.1, 0.72, z + 0.1, 0.9), -0.01, 0.09);
        });
      });
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"} number`, () => {
          const at = onSide(sp, sd);
          textOn(m, "red", at, [0, 0, sd], SS8_NUMBER, e * X(1.15), 2.25, 0.17, 0.006, sd < 0);
        });
  });
}

/** The SS8 in the CR blue livery as SS8 0228. */
export function buildSs8(): MeshBuilder {
  const s = ss8Spec();
  const m = buildBoxLoco(s);
  m.scope("body", () => {
    skirts(m, s);
    ploughs(m);
    topLamps(m, s);
    acGrilles(m);
  });
  m.scope("sides", () => {
    cabWindows(m, s);
    markings(m, s);
  });
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md). */
export function buildSs8Lod(): MeshBuilder {
  const s = ss8Spec();
  // the raked cab side windows are drawn apart from the kit (cabWindows); the distant model takes them as rectangles
  // the long blue louvre panel is the side's largest colour field: a band at its height from afar
  const side = s.side.flatMap(([a, b, mat]): Array<readonly [number, number, string]> => (mat === "cream" ? [[a, 3.17, "panel"], [3.17, b, "cream"]] : [[a, b, mat]]));
  return boxLocoLod({ ...s, side, sideItems: [...s.sideItems, { kind: "window", name: "cab window", x: [X(1.72), X(0.8)], y: [2.68, 3.58], mirror: true }] });
}
