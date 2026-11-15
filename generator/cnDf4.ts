// The China Railways DF4 "Dongfeng 4" (Dalian, Datong, Sifang, Ziyang; 1969 on), drawn as
// the common DF4B (from 1984, more than 4,500 built), measured from the works drawing and
// the photographs in assets/cr-df4/ (SOURCES.md) and the published figures: 21.1 m over the
// couplers, 3.309 m wide, 4.755 m high to the headlight, Co-Co on 12.0 m bogie centres,
// 2 x 1.8 m bogie wheelbase, 1.05 m wheels, 138 t.
//
// A full-width carbody with a cab at each end: the flat cab face leaning back a little to the
// waist and some 16 degrees at the two big windscreens, its corners rounded in plan, the cab
// roof falling to the face over the windscreens with the big round headlight housing on top
// and the horns behind it. Both ends carry the stripe's "V" with the CR emblem in its fork,
// a twin-lamp box either side and the broad lower band with the number plate; the grey
// buffer-less pilot with the red slotted plough and the automatic coupler below. The sides:
// the cab's side window and door, then at the No. 2 end the cooling room's four big louvred
// panels above four tall louvres, the machine room's windows, a side door in the middle
// and small windows and louvres toward the No. 1 cab. On the roof the radiator fans in a
// railed frame over the cooling room, the two exhaust stacks over the engine and a low box
// over the No. 1 end.
//
// Its own LocoSpec on the box locomotive kit (boxLocoKit.ts); the kit is unchanged.
// Metres, +X toward the No. 2 (cooling) cab, wheel contact at y = 0.
// See docs/models/china-trains.md.

import type { Ring } from "./meshBuilder.ts";
import { MeshBuilder, ngon } from "./meshBuilder.ts";
import { block } from "./vehicleParts.ts";
import { c, lerpTable, numberOn, onSide } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";
import { horn } from "./dieselParts.ts";

/** Length over the couplers (21.1 m), and the cab face's foot (|x|). */
export const DF4_LENGTH = 21.1;
const HALF = DF4_LENGTH / 2;
const FACE = 9.88;
/** The body's half width (3.2 m: the handrails stay within the 3.3 m gauge; the real body 3.309 m). */
const W = 1.6;
/** The shell's foot, the eave, the roof's top. */
const Y0 = 1.15;
const EAVE = 4.0;
const TOP = 4.47;
/** Bogie centres 12.0 m, axles 1.8 m apart, 1.05 m wheels. */
const PIVOT = 6.0;
const AXLE = 1.8;
const WHEEL_R = 0.525;

/**
 * The end's centre line [y, |x|]: almost upright to the windscreens' sill (2.95 m), the
 * windscreens leaning back 0.24 m to their head (3.75 m), then the cab roof's brow rising
 * back to the roof's top 1.0 m behind the foot (the works drawing's side elevation).
 */
const TIP = [[Y0, FACE], [2.95, FACE - 0.06], [3.78, FACE - 0.3], [4.0, FACE - 0.48], [4.2, FACE - 0.62], [4.36, FACE - 0.78], [TOP, FACE - 1.0]] as const;
/** The half width: upright walls to the eave, the roof's shoulder rounded in to the flat top. */
const HW = [[Y0, W], [EAVE, W], [4.18, W - 0.06], [4.33, W - 0.2], [4.43, W - 0.38], [TOP, W - 0.58]] as const;
/** The end's plan: flat across the windscreens, the corners rounded back 0.36 m to the side wall. */
const endPlan = (_y: number, w: number) => [[0, 0], [w * 0.5, 0.012], [w - 0.4, 0.04], [w - 0.2, 0.12], [w - 0.07, 0.24], [w, 0.36]] as const;

// ---------------------------------------------------------------------------
// Liveries

export interface Df4Livery {
  /** The value's title (the game's button). */
  title: string;
  /** The running number on the plates and the cab sides (the photographed unit). */
  number: string;
  /** Body, stripes, roof, the pilot's grey top and red plough, the number plate, the frame and bogies. */
  body: string;
  stripe: string;
  roof: string;
  pilotTop: string;
  pilot: string;
  plate: string;
  frame: string;
  bogie: string;
}

export const DF4_LIVERIES: Record<string, Df4Livery> = {
  // DF4B 2480 (assets/cr-df4): the orange-red passenger livery with yellow stripes, light grey roof and running gear
  orangeWhite: { title: "Orange", number: "2480", body: "#e2391f", stripe: "#f5a40c", roof: "#a9b0b5", pilotTop: "#8f969c", pilot: "#d22b20", plate: "#b42a22", frame: "#7c8287", bogie: "#6f757a" },
  // DF4B 1787: the classic dark green with the yellow stripes, grey roof, dark running gear
  green: { title: "Green", number: "1787", body: "#1e3a2a", stripe: "#d6a01e", roof: "#6c7173", pilotTop: "#33383b", pilot: "#c63a2a", plate: "#b42a22", frame: "#2a2e2f", bogie: "#2f3335" },
};

// ---------------------------------------------------------------------------
// The side's openings, by distance d behind the No. 2 (+x) cab face (photograph of DF4B 9221,
// a projective fit over the cab face, the cab door and the far cab face; both sides alike).

/** x of the span d0..d1 behind the +x face. */
const at = (d0: number, d1: number): [number, number] => [FACE - d1, FACE - d0];
const UPPER: [number, number] = [3.21, 3.79];

function sideItems(): SideItem[] {
  const items: SideItem[] = [
    { kind: "window", name: "cab window", x: at(0.55, 1.2), y: [3.0, 3.76], mat: "rubber", mirror: true, r: 0.08 },
    { kind: "door", name: "cab door", x: at(1.45, 2.05), y: [1.6, 3.84], win: [3.2, 3.72], rails: true, mirror: true },
    // the broad lower band wrapping round the cab's corner, narrowing to the side stripe
    { kind: "paint", name: "band wrap", x: at(0.37, 1.45), y: [1.39, 1.62], mat: "stripe", mirror: true, poly: [[FACE - 1.45, 1.45], [FACE - 1.2, 1.39], [FACE - 0.37, 1.39], [FACE - 0.37, 1.62], [FACE - 1.2, 1.62], [FACE - 1.45, 1.57]] },
  ];
  // the cooling room: four louvred panels over four tall louvres
  [[2.42, 3.52], [3.76, 4.86], [5.12, 6.15], [6.38, 7.42]].forEach(([d0, d1], i) => {
    items.push({ kind: "grille", name: `cooling louvre ${i + 1}`, x: at(d0!, d1!), y: UPPER, slats: "v", pitch: 0.14, r: 0.05 });
    items.push({ kind: "grille", name: `cooling grille ${i + 1}`, x: at(d0!, d1!), y: [1.85, 2.97], slats: "v", pitch: 0.16, r: 0.03 });
  });
  // the machine room's windows with small louvres under them
  [[8.12, 9.07], [9.78, 10.71]].forEach(([d0, d1], i) => {
    items.push({ kind: "window", name: `room window ${i + 1}`, x: at(d0!, d1!), y: UPPER, mat: "rubber", r: 0.07 });
    items.push({ kind: "grille", name: `room louvre ${i + 1}`, x: at(d0! + 0.05, d1! - 0.05), y: [2.38, 2.89], slats: "v", pitch: 0.14, r: 0.03 });
  });
  items.push({ kind: "door", name: "room door", x: at(11.05, 11.62), y: [1.6, 3.8], win: [3.22, 3.72], rails: true });
  // the small low windows behind the door
  [[12.23, 12.85], [13.09, 13.74]].forEach(([d0, d1], i) =>
    items.push({ kind: "window", name: `low window ${i + 1}`, x: at(d0!, d1!), y: [2.54, 2.97], mat: "rubber", r: 0.05 }));
  // toward the No. 1 cab: two windows over two louvres
  [[15.05, 15.8], [16.45, 17.2]].forEach(([d0, d1], i) => {
    items.push({ kind: "window", name: `end window ${i + 1}`, x: at(d0!, d1!), y: UPPER, mat: "rubber", r: 0.06 });
    items.push({ kind: "grille", name: `end louvre ${i + 1}`, x: at(d0!, d1!), y: [2.57, 2.97], slats: "v", pitch: 0.14, r: 0.03 });
  });
  return items;
}

// ---------------------------------------------------------------------------
// The cab face (u = z seen from ahead, +u the face's left)

/** The stripe's "V": one arm, its outer part level with the side stripe, falling to the fork under the emblem. */
function vArm(s: number): EndItem[] {
  const q = (pts: Array<[number, number]>): Ring => (s > 0 ? pts : pts.map(([u, v]) => [-u, v] as [number, number]).reverse());
  return [
    { kind: "paint", name: `v outer ${s > 0 ? "left" : "right"}`, z: [0, 0], y: [0, 0], mat: "stripe", layer: 1, poly: q([[1.05, 2.92], [W, 3.03], [W, 3.15], [1.05, 3.08]]) },
    { kind: "paint", name: `v arm ${s > 0 ? "left" : "right"}`, z: [0, 0], y: [0, 0], mat: "stripe", layer: 1, poly: q([[0.3, 2.28], [1.05, 2.92], [1.05, 3.08], [0.3, 2.52]]) },
    { kind: "paint", name: `v fork ${s > 0 ? "left" : "right"}`, z: [0, 0], y: [0, 0], mat: "stripe", layer: 1, poly: q([[0, 2.12], [0.3, 2.28], [0.3, 2.52], [0, 2.44]]) },
  ].map((it) => ({ ...it, z: span(it.poly!, 0), y: span(it.poly!, 1) }) as EndItem);
}
const span = (p: Ring, k: 0 | 1): [number, number] => [Math.min(...p.map((v) => v[k])), Math.max(...p.map((v) => v[k]))];

/** The CR emblem in the V's fork: a white ring over the rail's section, its foot on the fork. */
const EMBLEM_Y = 2.66;
function emblem(): EndItem[] {
  const disc = (r: number, layer: number, mat: string, name: string): EndItem => {
    const poly = ngon(16, r, Math.PI / 16, 0, EMBLEM_Y) as Ring;
    return { kind: "paint", name, z: span(poly, 0), y: span(poly, 1), mat, layer, poly };
  };
  const box = (name: string, z0: number, z1: number, y0: number, y1: number, layer = 4, mat = "white"): EndItem => ({ kind: "paint", name, z: [z0, z1], y: [y0, y1], mat, layer });
  return [
    disc(0.27, 2, "white", "emblem ring"),
    disc(0.2, 3, "paint", "emblem field"),
    box("emblem rail head", -0.1, 0.1, 2.66, 2.74),
    box("emblem rail web", -0.035, 0.035, 2.44, 2.66),
    box("emblem rail foot", -0.13, 0.13, 2.38, 2.44),
    { kind: "paint", name: "emblem point", z: [-0.09, 0.09], y: [2.22, 2.39], mat: "white", layer: 2, poly: [[-0.09, 2.39], [0, 2.22], [0.09, 2.39]] },
  ];
}

function endItems(): EndItem[] {
  return [
    { kind: "window", name: "windscreen left", z: [0.1, 1.12], y: [3.0, 3.72], wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.12, -0.1], y: [3.0, 3.72], wiper: true },
    { kind: "paint", name: "grab rail left", z: [0.32, 0.92], y: [2.9, 2.94], mat: "rim", layer: 3 },
    { kind: "paint", name: "grab rail right", z: [-0.92, -0.32], y: [2.9, 2.94], mat: "rim", layer: 3 },
    ...vArm(1),
    ...vArm(-1),
    ...emblem(),
    { kind: "grille", name: "lower grille", z: [-0.38, 0.38], y: [1.95, 2.12] },
    { kind: "plate", name: "number", z: [-0.46, 0.46], y: [1.43, 1.58] },
  ];
}

// ---------------------------------------------------------------------------
// The roof

/** The radiator frame over the cooling room (No. 2 end) and the low box over the No. 1 end. */
const RADIATOR: RoofBox = { name: "radiator", x: at(1.45, 4.5), w: [1.04, 0.98], y: [TOP - 0.03, TOP + 0.13], mat: "roof" };
const ROOF_BOX: RoofBox = { name: "roof box", x: [-FACE + 2.7, -FACE + 5.3], w: [0.85, 0.75], y: [TOP - 0.03, TOP + 0.12], mat: "roof" };
const FANS = [FACE - 3.75, FACE - 2.2];
/** Exhaust stacks over the 16V240ZJB engine. */
const EXHAUSTS = [FACE - 6.3, FACE - 9.4];

export function df4Spec(l: Df4Livery): LocoSpec {
  return {
    palette: {
      paint: c(l.body, 0.5),
      stripe: c(l.stripe, 0.5),
      roof: { color: l.roof, roughness: 0.7 },
      pilotTop: c(l.pilotTop, 0.6),
      pilot: c(l.pilot, 0.55),
      plate: c(l.plate, 0.5),
      frame: c(l.frame, 0.7),
      underframe: c(l.frame, 0.75),
      bogie: c(l.bogie, 0.7),
      coupler: c("#3a3c3e", 0.6),
      exhaust: c("#2b2b2b", 0.9),
      horn: { color: "#9aa0a6", metallic: 0.3, roughness: 0.4 },
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: [[Y0, 1.45, "paint"], [1.45, 1.57, "stripe"], [1.57, 3.03, "paint"], [3.03, 3.15, "stripe"], [3.15, EAVE, "paint"], [EAVE, 4.6, "roof"]],
    end: [[Y0, 1.39, "paint"], [1.39, 1.62, "stripe"], [1.62, 3.8, "paint"], [3.8, 4.6, "roof"]],
    roof: "roof",
    buffers: HALF,
    beam: FACE,
    centreCoupler: 0.88,
    frame: { y0: 0.95, y1: Y0, half: FACE - 0.02, hw: W - 0.1, mat: "frame" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-AXLE, 0, AXLE], wheelR: WHEEL_R, frameTop: 0.92 })),
    exhausts: EXHAUSTS.map((x) => [x, 0, TOP] as const),
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: [RADIATOR, ROOF_BOX],
    // the fuel tank between the bogies
    underItems: [[-3.4, 3.4, 0.42, 0.95, 1.35]],
    number: l.number,
  };
}

// ---------------------------------------------------------------------------
// What the kit does not draw: the pilots, the lamp boxes, the headlights and horns, the
// radiator fans and railing, the numbers on the cab sides.

/** The pilot at end e: the grey apron under the face, the red plough with its slots. */
function pilot(m: MeshBuilder, e: number): void {
  const plan = (x0: number, x1: number, w: number, cut: number): Ring => {
    const r: Ring = [[x1, -w + cut], [x1, w - cut], [x0 + (x1 - x0) * 0.4, w], [x0, w], [x0, -w], [x0 + (x1 - x0) * 0.4, -w]];
    // wound as the kit's frame (its walls face out) at either end: mirroring x reverses the winding
    return e > 0 ? [...r].reverse() : r.map(([x, z]) => [-x, z] as [number, number]);
  };
  m.scope("apron", () => m.prism("pilotTop", plan(FACE - 0.3, FACE + 0.16, 1.48, 0.22), 0.62, Y0 + 0.01));
  m.scope("plough", () => m.prism("pilot", plan(FACE - 0.3, FACE + 0.2, 1.42, 0.25), 0.14, 0.62));
  m.scope("slots", () => {
    for (const y of [0.24, 0.37, 0.5])
      for (const s of [-1, 1]) {
        const [z0, z1] = s > 0 ? [0.32, 1.05] : [-1.05, -0.32];
        const [x0, x1] = e > 0 ? [FACE + 0.17, FACE + 0.215] : [-FACE - 0.215, -FACE - 0.17];
        block(m, "louvre", x0, x1, y, y + 0.07, z0, z1);
      }
  });
}

/** The end's surface x (|x|) at height y and |z|. */
function faceX(y: number, z: number): number {
  const plan = endPlan(y, lerpTable(HW, y));
  let b = plan[plan.length - 1]![1];
  for (let i = 1; i < plan.length; i++)
    if (Math.abs(z) <= plan[i]![0]) {
      const [z0, b0] = plan[i - 1]!, [z1, b1] = plan[i]!;
      b = b0 + ((b1 - b0) * (Math.abs(z) - z0)) / (z1 - z0);
      break;
    }
  return lerpTable(TIP, y) - b;
}

/** The twin-lamp boxes either side of the V: a silver box with the head lamp outboard and the red marker inboard. */
function lampBoxes(m: MeshBuilder, e: number): void {
  const [y0, y1] = [2.27, 2.47];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "lamp box right" : "lamp box left", () => {
      const [z0, z1] = [0.9 * s, 1.36 * s].sort((a, b) => a - b) as [number, number];
      const back = Math.min(faceX(y0, z0), faceX(y1, z1), faceX(y0, z1)) - 0.02;
      const front = back + 0.14;
      block(m, "rim", ...(e > 0 ? [back, front] : [-front, -back]) as [number, number], y0, y1, z0, z1);
      for (const [zc, mat] of [[1.02 * s, "lampRed"], [1.24 * s, "lampHead"]] as const) {
        const lens = ngon(10, 0.065, 0, zc, (y0 + y1) / 2);
        m.sweep(mat, "x", lens, e * front - 0.004, lens, e * front + e * 0.015);
      }
    });
}

/** The headlight housing on the cab roof's brow, the horns behind it. */
function headlight(m: MeshBuilder, e: number): void {
  const yc = 4.42, r = 0.22;
  const [x0, x1] = [FACE - 1.2, FACE - 0.32];
  m.scope("headlight", () => {
    const ring = ngon(12, r, 0, 0, yc);
    m.sweep("roof", "x", ring, e * x0, ring, e * x1);
    const rim = ngon(12, r + 0.02, 0, 0, yc), lens = ngon(12, r - 0.04, 0, 0, yc);
    m.sweep("rim", "x", rim, e * (x1 - 0.06), rim, e * (x1 + 0.01));
    m.sweep("lampHead", "x", lens, e * (x1 + 0.005), lens, e * (x1 + 0.02));
    // the bracket under it on the roof
    block(m, "roof", ...(e > 0 ? [x0 + 0.05, x0 + 0.45] : [-x0 - 0.45, -x0 - 0.05]) as [number, number], 4.2, yc, -0.12, 0.12);
  });
  m.scope("horns", () => {
    for (const z of [-0.32, 0.32]) horn(m, e, e * (FACE - 1.6), z, TOP + 0.13);
  });
}

/** The radiator fans' discs and the railing round the radiator frame. */
function radiator(m: MeshBuilder): void {
  const top = TOP + 0.13;
  m.scope("fans", () => {
    for (const x of FANS) {
      const disc = ngon(14, 0.66, Math.PI / 14, x, 0);
      m.prism("louvre", disc.map(([a, b]) => [a, b] as [number, number]), top - 0.01, top + 0.012);
      m.prism("slat", ngon(8, 0.12, Math.PI / 8, x, 0), top + 0.012, top + 0.04);
    }
  });
  m.scope("railing", () => {
    const [xa, xb] = RADIATOR.x;
    const yr = top + 0.24;
    for (const z of [-1.0, 1.0]) {
      m.rod("steel", [xa, yr, z], [xb, yr, z], 0.018, 5);
      for (let i = 0; i <= 2; i++) {
        const x = xa + ((xb - xa) * i) / 2;
        m.rod("steel", [x, top - 0.01, z], [x, yr, z], 0.016, 5);
      }
    }
  });
}

function sideNumbers(m: MeshBuilder, spec: LocoSpec): void {
  const sp = shellOf(spec);
  m.scope("side numbers", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        numberOn(m, onSide(sp, sd), [0, 0, sd], spec.number, e * (FACE - 1.0), 2.62, 0.13, 0.004, sd < 0);
  });
}

/** The DF4B in livery l. */
export function buildDf4(l: Df4Livery): MeshBuilder {
  const spec = df4Spec(l);
  const m = buildBoxLoco(spec);
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("pilot", () => pilot(m, e));
      m.scope("lamp boxes", () => lampBoxes(m, e));
    });
  m.scope("roof equipment", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front headlight" : "rear headlight", () => headlight(m, e));
    radiator(m);
  });
  m.scope("sides", () => sideNumbers(m, spec));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md): the kit's box locomotive from the same tables and paint. */
export function buildDf4Lod(l: Df4Livery): MeshBuilder {
  return boxLocoLod(df4Spec(l));
}
