// The China Railways DF8B "Dongfeng 8B" (CRRC Qishuyan and Ziyang, 1997 on; some 1,200 built),
// the 100 km/h Co-Co diesel-electric freight locomotive with the 16V280ZJA engine (3,680 kW
// installed, 3,100 kW rated). Measured from the photographs in assets/cr-df8b/ (SOURCES.md):
// lengths along the side from DF8B 5034 (a near-orthographic side view, 46.7 px/m over the
// axles), the face from DF8B 5458 and 5620, the running gear from 7001; and the published
// figures: 22.0 m over the couplers, 20.9 m over the frame, 3.304 m wide, 4.736 m high, two
// three-axle bogies of 2 x 1.8 m, 1.05 m wheels, 138 t (150 t with the ballast plates).
//
// A double-ended carbody with a cab at each end (No. 1 at -x, No. 2 at +x). The face, as the
// works describe it: the lower part leaning back 20 degrees down to the body's foot, a
// 300 mm band standing forward across the middle that carries the lamps, the windscreens
// leaning back 15 degrees; the later "standardised" cab's rounded roof cap with the round
// headlight standing out of its front edge, the air conditioner and the horns behind it.
// Behind each cab door a cream strip leans back between the cab's blue and the machine
// room's blue panel; along the machine room the cream waist band with its red line, the
// electrical room's two louvres, the six slot windows and the CR emblem in the middle, the
// cooling room's three louvres at the No. 2 end. On the roof the electrical room's louvred
// hood (No. 1 end), the power room's hatches and exhaust, the cooling room's radiator frame
// with its two 1.6 m fans.
//
// Its own LocoSpec on the box locomotive kit (boxLocoKit.ts, with the kit's knuckle coupler).
// Metres, +X toward the No. 2 cab, wheel contact at y = 0. See docs/models/china-locos.md.

import type { Ring } from "./meshBuilder.ts";
import { MeshBuilder, ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block } from "./vehicleParts.ts";
import { strokeText } from "./strokeFont.ts";
import { exhaust, horn } from "./dieselParts.ts";
import { c, onEnd, onSide, rect, roundRect, surfacePanel } from "./czElectricKit.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";

/** The running number (DF8B 5620, the head-on photograph). */
export const DF8B_NUMBER = "5620";
/** Length over the coupler faces (22.0 m). */
export const DF8B_LENGTH = 22.0;
const HALF = DF8B_LENGTH / 2;
/** The face's foremost point (the lamp band), |x|; the frame ends at 10.45 (20.9 m). */
const FACE = 10.68;
/** The body's half width: 3.2 m (the real 3.304 m narrowed so the handrails stay within the US gauge's 3.3 m). */
const W = 1.6;
/** The body's foot, the eave, the roof's crown. */
const Y0 = 1.1;
const EAVE = 4.05;
const TOP = 4.72;
/** Bogie centres 12.0 m (the photograph), axles 1.8 m apart, 1.05 m wheels. */
const PIVOT = 6.0;
const AXLE = 1.8;
const WHEEL_R = 0.525;

/** The face's bands: the cream band on the leaning lower face, the lamp band standing forward above it. */
const CREAM: [number, number] = [1.87, 2.22];
const LAMP_BAND: [number, number] = [2.22, 2.52];
const SCREEN: [number, number] = [3.07, 3.93];

/**
 * The end's centre line [y, |x|]: the lower face leaning back 20 degrees from the lamp band
 * to the foot, the lamp band upright, the face above it leaning a little to the windscreens,
 * the windscreens 15 degrees, then the roof cap rounding back to the crown.
 */
const TIP = [
  [Y0, FACE - 0.4], [CREAM[0], FACE - 0.13], [LAMP_BAND[0], FACE], [LAMP_BAND[1], FACE], [2.56, FACE - 0.05],
  [SCREEN[0], FACE - 0.12], [SCREEN[1], FACE - 0.35], [EAVE, FACE - 0.4],
  [4.25, FACE - 0.53], [4.42, FACE - 0.7], [4.56, FACE - 0.9], [4.66, FACE - 1.12], [TOP, FACE - 1.42],
] as const;
/** The half width: upright walls to the eave, the roof rounding to the crown. */
const HW = [[Y0, W], [EAVE, W], [4.25, W - 0.05], [4.42, W - 0.18], [4.56, W - 0.38], [4.66, W - 0.65], [TOP, W - 1.0]] as const;
/** The end's plan: flat across, the corners rounded back 0.26 m to the side wall. */
const endPlan = (_y: number, w: number) => [[0, 0], [w - 0.32, 0], [w - 0.2, 0.025], [w - 0.1, 0.08], [w - 0.03, 0.16], [w, 0.26]] as const;


// ---------------------------------------------------------------------------
// The livery (DF8B 5620): blue and cream with the red line, grey roof and running gear

const BLUE = "#26489c";
const CREAM_C = "#ece2bf";

// ---------------------------------------------------------------------------
// The sides, x along the body (the same on both sides: every photograph shows the right side
// seen with the No. 1 cab to the left, i.e. the -z side here; the far side is taken alike).

const WIN: [number, number] = [3.08, 3.75];
const UPPER: [number, number] = [2.5, 3.76];
const LOWER: [number, number] = [1.93, 2.32];
const RED: [number, number] = [2.35, 2.42];

function sideItems(): SideItem[] {
  const items: SideItem[] = [
    // the cab: its blue over the cream band, its rear edge leaning back through the door
    { kind: "paint", name: "cab blue", x: [8.75, 10.4], y: [2.22, EAVE], mat: "blue", mirror: true, layer: 1, poly: [[9.28, 2.22], [10.4, 2.22], [10.0, EAVE], [8.75, EAVE]] },
    // the cream strip between the cab and the machine room's blue panel
    { kind: "paint", name: "cream strip", x: [8.36, 9.21], y: [2.46, 3.85], mat: "cream", mirror: true, layer: 2, poly: [[8.68, 2.46], [9.21, 2.46], [8.81, 3.85], [8.36, 3.85]] },
    { kind: "paint", name: "red line", x: [-8.62, 8.62], y: RED, mat: "red", layer: 1 },
    { kind: "window", name: "cab window", x: [9.35, 10.1], y: SCREEN, mat: "rubber", mirror: true, r: 0.08 },
    { kind: "door", name: "cab door", x: [8.66, 9.22], y: [1.62, 3.98], rails: true, mirror: true },
  ];
  const win = (name: string, x: [number, number]) => items.push({ kind: "window", name, x, y: WIN, mat: "rubber", r: 0.08 });
  // the electrical room toward the No. 1 cab
  win("window 1", [-8.33, -7.95]);
  win("window 2", [-5.67, -5.15]);
  win("window 3", [-3.3, -2.85]);
  // the power room: six slot windows across the cream band and the red line
  [-2.45, -1.75, -1.05, -0.35, 0.35, 1.05].forEach((xc, i) =>
    items.push({ kind: "panel", name: `slot ${i + 1}`, x: [xc - 0.075, xc + 0.075], y: [1.98, 2.47], mat: "rubber", r: 0.07 }));
  win("window 4", [1.75, 2.15]);
  win("window 5", [7.15, 7.65]);
  return items;
}

/**
 * The louvres, each an upper part in the blue panel and a lower part in the cream band with
 * the red line between: the electrical room's two toward the No. 1 cab, the cooling room's
 * three toward the No. 2 cab. [x span, the upper part's top].
 */
const LOUVRES: ReadonlyArray<readonly [string, number, number, number]> = [
  ["electrical louvre 1", -7.82, -6.75, UPPER[1]],
  ["electrical louvre 2", -4.9, -3.85, 3.55],
  ["cooling louvre 1", 2.3, 3.66, 3.25],
  ["cooling louvre 2", 3.88, 5.27, 3.25],
  ["cooling louvre 3", 5.48, 6.87, 3.25],
];

/** A louvre: its dark ground and the horizontal slats in the paint around it, as single faces just off the ground. */
function louvres(m: MeshBuilder, spec: LocoSpec): void {
  const sp = shellOf(spec);
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right louvres" : "left louvres", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      for (const [name, x0, x1, top] of LOUVRES)
        m.scope(name, () => {
          for (const [y0, y1, mat] of [[UPPER[0], top, "slatBlue"], [LOWER[0], LOWER[1], "cream"]] as const) {
            surfacePanel(m, "louvre", at, n, roundRect(x0, x1, y0, y1, 0.03, 2), -0.006, 0.006);
            const pts: Vec3[] = [];
            for (let y = y0 + 0.035; y + 0.03 <= y1 - 0.01; y += 0.07) {
              const q: Ring = sd > 0 ? rect(x0 + 0.03, y, x1 - 0.03, y + 0.03) : rect(x0 + 0.03, y, x1 - 0.03, y + 0.03).reverse();
              const [a, b, cc, d] = q.map(([u, v]) => at(u, v, 0.009));
              pts.push(a!, b!, cc!, a!, cc!, d!);
            }
            m.facets(mat, pts, n);
          }
        });
    });
}

// ---------------------------------------------------------------------------
// The face (u = z seen from ahead, +u the face's left)

function endItems(): EndItem[] {
  const items: EndItem[] = [
    { kind: "window", name: "windscreen left", z: [0.11, 1.3], y: SCREEN, wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.3, -0.11], y: SCREEN, wiper: true },
    { kind: "paint", name: "grab rail", z: [-1.15, 1.15], y: [2.78, 2.81], mat: "rim", layer: 1 },
    { kind: "paint", name: "low grab rail", z: [-1.05, 1.05], y: [1.64, 1.67], mat: "rim", layer: 1 },
  ];
  for (const s of [-1, 1]) {
    const [z0, z1] = s > 0 ? [0.62, 1.2] : [-1.2, -0.62];
    items.push({ kind: "paint", name: `lamp housing ${s > 0 ? "left" : "right"}`, z: [z0, z1], y: [2.27, 2.49], mat: "black", layer: 1 });
    items.push({ kind: "lamp", name: `head lamp ${s > 0 ? "left" : "right"}`, z: [s * 1.06 - 0.07, s * 1.06 + 0.07], y: [2.31, 2.45], r: 0.065, mat: "lampHead" });
    items.push({ kind: "lamp", name: `marker ${s > 0 ? "left" : "right"}`, z: [s * 0.78 - 0.06, s * 0.78 + 0.06], y: [2.32, 2.44], r: 0.055, mat: "lampRed" });
  }
  return items;
}

// ---------------------------------------------------------------------------
// The roof

/** The electrical room's hood (No. 1 end): louvred slopes on both shoulders. */
const HOOD: RoofBox = { name: "electrical hood", x: [-6.25, -4.35], w: [1.5, 0.78], y: [4.3, 4.8], mat: "roof" };
/** The cooling room's radiator frame (No. 2 end) with its two 1.6 m fans. */
const RADIATOR: RoofBox = { name: "radiator", x: [2.3, 6.9], w: [1.08, 1.02], y: [4.52, 4.8], mat: "roof" };
const FANS = [3.4, 5.8];
/** The power room's hatches between them. */
const HATCHES: RoofBox[] = [[-4.1, -2.35], [-2.15, -0.4], [-0.2, 1.55]].map(([x0, x1], i) =>
  ({ name: `hatch ${i + 1}`, x: [x0!, x1!], w: [0.8, 0.76], y: [4.66, 4.76], mat: "hatch" }));
/** The air conditioner on each cab's roof, behind the headlight. */
const AC: [number, number] = [FACE - 2.55, FACE - 1.4];

export function df8bSpec(): LocoSpec {
  return {
    palette: {
      blue: c(BLUE, 0.5),
      cream: c(CREAM_C, 0.5),
      red: c("#c4232c", 0.5),
      paint: c(BLUE, 0.5),
      louvre: c("#141c33", 0.75),
      slatBlue: c("#3d62b8", 0.55),
      roof: { color: "#8c9194", roughness: 0.7 },
      hatch: { color: "#7d8286", roughness: 0.7 },
      apron: c("#8a8f93", 0.6),
      pilot: c("#c42a2a", 0.55),
      plate: c("#c4262a", 0.5),
      frame: c("#33373a", 0.7),
      underframe: c("#4b5054", 0.75),
      tank: c("#7f868b", 0.65),
      bogie: c("#3f4447", 0.7),
      coupler: c("#3a3c3e", 0.6),
      knuckle: c("#3a3b3d", 0.7),
      handrail: c("#b8bcbf", 0.4),
      exhaust: c("#2b2b2b", 0.9),
      horn: { color: "#a4aaaf", metallic: 0.3, roughness: 0.4 },
      cock: c("#d8a628", 0.5),
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: [[Y0, CREAM[0], "blue"], [CREAM[0], 2.46, "cream"], [2.46, 3.85, "blue"], [3.85, EAVE, "cream"], [EAVE, 5, "roof"]],
    end: [[Y0, CREAM[0], "blue"], [CREAM[0], CREAM[1], "cream"], [CREAM[1], EAVE, "blue"], [EAVE, 5, "roof"]],
    roof: "roof",
    buffers: HALF,
    beam: 10.27,
    centreCoupler: 0.88,
    knuckle: true,
    frame: { y0: 0.95, y1: Y0, half: 10.26, hw: W - 0.1, mat: "frame" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-AXLE, 0, AXLE], wheelR: WHEEL_R, frameTop: 0.92 })),
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: [HOOD, RADIATOR, ...HATCHES, ...[-1, 1].map((e): RoofBox => ({ name: e > 0 ? "air conditioner 2" : "air conditioner 1", x: (e > 0 ? AC : [-AC[1], -AC[0]]) as [number, number], w: [0.56, 0.52], y: [TOP - 0.06, TOP + 0.15], mat: "roof" }))],
    // the fuel tank between the bogies (the main reservoirs at its ends are drawn below)
    underItems: [[-2.85, 1.5, 0.42, 0.95, 1.3]],
    number: DF8B_NUMBER,
  };
}

// ---------------------------------------------------------------------------
// What the kit does not draw

/** "DF8B 5620" with the class's 8B small and low, as the plates show it, centred at (u, v), reading toward +u (or -u). */
function plateText(u: number, v: number, h: number, flip: boolean): Array<[number, number]> {
  const w = h * 0.55, gap = h * 0.16, hs = h * 0.6, ws = hs * 0.55, gs = hs * 0.15;
  const wDF = 2 * w + gap, w8 = 2 * ws + gs, wNum = DF8B_NUMBER.length * w + (DF8B_NUMBER.length - 1) * gap;
  const total = wDF + gap * 0.6 + w8 + gap * 1.2 + wNum;
  const sg = flip ? -1 : 1;
  const u0 = u - (sg * total) / 2, v0 = v - h / 2;
  return [
    ...strokeText("DF", u0, v0, h, w, gap, flip, h * 0.16),
    ...strokeText("8B", u0 + sg * (wDF + gap * 0.6), v0, hs, ws, gs, flip, hs * 0.16),
    ...strokeText(DF8B_NUMBER, u0 + sg * (wDF + gap * 0.6 + w8 + gap * 1.2), v0, h, w, gap, flip, h * 0.16),
  ];
}

/** The China Railway emblem: a ring open at its foot round a rail's section, white. */
function emblemTris(cu: number, cv: number, r: number): Array<[number, number]> {
  const tris: Array<[number, number]> = [];
  const k = 12, ri = r * 0.78;
  for (let i = 0; i < k; i++) {
    const a0 = -Math.PI / 2 + 0.45 + (i / k) * (2 * Math.PI - 0.9), a1 = -Math.PI / 2 + 0.45 + ((i + 1) / k) * (2 * Math.PI - 0.9);
    const q: Array<[number, number]> = [[cu + r * Math.cos(a0), cv + r * Math.sin(a0)], [cu + r * Math.cos(a1), cv + r * Math.sin(a1)], [cu + ri * Math.cos(a1), cv + ri * Math.sin(a1)], [cu + ri * Math.cos(a0), cv + ri * Math.sin(a0)]];
    for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!);
  }
  const box = (u0: number, v0: number, u1: number, v1: number) => { const q: Array<[number, number]> = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!); };
  box(cu - r * 0.32, cv + r * 0.05, cu + r * 0.32, cv + r * 0.3);
  box(cu - r * 0.1, cv - r * 0.95, cu + r * 0.1, cv + r * 0.05);
  box(cu - r * 0.45, cv - r * 1.15, cu + r * 0.45, cv - r * 0.95);
  return tris;
}

/** The number plates (face and cab sides) and the emblem on the sides. */
function markings(m: MeshBuilder, spec: LocoSpec): void {
  const sp = shellOf(spec);
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    const n: Vec3 = [e, 0, 0];
    m.scope(e > 0 ? "front plate" : "rear plate", () => {
      const y: [number, number] = [2.27, 2.48];
      surfacePanel(m, "plate", at, n, rect(-0.5, y[0], 0.5, y[1]), -0.01, 0.022, [-0.5, 0.5], [LAMP_BAND[0], LAMP_BAND[1]]);
      // seen from ahead the text reads toward the face's right (-z at the +x end)
      m.facets("white", plateText(0, (y[0] + y[1]) / 2, 0.12, e > 0).map(([u, v]) => at(u, v, 0.026)), n);
    });
  }
  for (const sd of [-1, 1]) {
    const at = onSide(sp, sd);
    const n: Vec3 = [0, 0, sd];
    m.scope(sd > 0 ? "right side markings" : "left side markings", () => {
      for (const e of [-1, 1]) {
        const [x0, x1] = e > 0 ? [9.35, 10.1] : [-10.1, -9.35];
        surfacePanel(m, "plate", at, n, rect(x0, 2.27, x1, 2.45), -0.008, 0.012);
        // the text reads front to back seen from outside: toward -x on the +z side
        m.facets("white", plateText((x0 + x1) / 2, 2.36, 0.11, sd < 0).map(([u, v]) => at(u, v, 0.016)), n);
      }
      m.facets("white", emblemTris(-0.7, 2.98, 0.19).map(([u, v]) => at(u, v, 0.007)), n);
    });
  }
}

/** The pilot at end e: the grey apron with its slots and cocks, the red plough with its holes. */
function pilot(m: MeshBuilder, e: number): void {
  const X = (x: number) => e * x;
  const ring = (x0: number, x1: number, w0: number, w1: number): Ring => {
    // counter-clockwise seen from above at either end
    const r: Ring = [[x1, -w1], [x1, w1], [x0, w0], [x0, -w0]];
    return e > 0 ? r : r.map(([x, z]) => [-x, z] as [number, number]).reverse();
  };
  m.scope("apron", () => {
    m.loft("apron", ring(9.75, 10.3, 1.38, 1.2), 0.38, ring(9.75, 10.27, 1.5, 1.42), Y0 + 0.01);
    m.cap("apron", ring(9.75, 10.3, 1.38, 1.2), 0.38, false);
  });
  m.scope("apron slots", () => {
    for (const s of [-1, 1])
      for (let i = 0; i < 4; i++) {
        const z = s * (0.62 + i * 0.16);
        const [x0, x1] = e > 0 ? [10.29, 10.315] : [-10.315, -10.29];
        block(m, "black", x0, x1, 0.58, 0.82, z - 0.035, z + 0.035);
      }
  });
  m.scope("cocks", () => {
    for (const z of [-1.0, -0.72, 0.72, 1.0]) {
      const q = ngon(8, 0.045, 0, z, 0.98);
      m.sweep(z * e > 0 ? "cock" : "steel", "x", q, X(10.27), q, X(10.42));
    }
  });
  m.scope("plough", () => {
    m.loft("pilot", ring(9.95, 10.5, 1.3, 1.08), 0.12, ring(9.95, 10.32, 1.36, 1.24), 0.38);
    m.cap("pilot", ring(9.95, 10.5, 1.3, 1.08), 0.12, false);
  });
  m.scope("plough holes", () => {
    for (let i = -3; i <= 3; i++) {
      const z = i * 0.3;
      // on the plough's leaning face: x at height y between 10.32 (0.38 m) and 10.5 (0.12 m)
      const y0 = 0.17, y1 = 0.27;
      const xf = (y: number) => 10.5 - ((y - 0.12) / 0.26) * 0.18;
      const [a, b] = e > 0 ? [xf(y1) - 0.03, xf(y0) + 0.01] : [-xf(y0) - 0.01, -xf(y1) + 0.03];
      block(m, "black", Math.min(a, b), Math.max(a, b), y0, y1, z - 0.07, z + 0.07);
    }
  });
}

/** The headlight standing out of the roof cap's front edge, the horns on the air conditioner. */
function headlight(m: MeshBuilder, e: number): void {
  const yc = 4.5, r = 0.23;
  const [x0, x1] = [FACE - 1.25, FACE - 0.6];
  m.scope("headlight", () => {
    const ring = ngon(12, r, 0, 0, yc);
    m.sweep("roof", "x", ring, e * x0, ring, e * x1);
    // the dark bezel round the lens
    const rim = ngon(12, r + 0.015, 0, 0, yc), lens = ngon(12, r - 0.07, 0, 0, yc);
    m.sweep("black", "x", rim, e * (x1 - 0.05), rim, e * (x1 + 0.01));
    m.sweep("lampHead", "x", lens, e * (x1 + 0.005), lens, e * (x1 + 0.02));
  });
  m.scope("horns", () => {
    for (const z of [-0.36, 0.36]) horn(m, e, e * (AC[1] + 0.12), z, TOP + 0.13);
  });
}

/** The fans' grilles on the radiator frame. */
function fans(m: MeshBuilder): void {
  const top = RADIATOR.y[1];
  m.scope("fans", () => {
    for (const x of FANS) {
      m.prism("black", ngon(16, 0.78, Math.PI / 16, x, 0), top - 0.01, top + 0.012);
      m.prism("steel", ngon(8, 0.14, Math.PI / 8, x, 0), top + 0.012, top + 0.04);
      for (const [dx, dz] of [[0.74, 0.03], [0.03, 0.74]] as const) block(m, "steel", x - dx, x + dx, top + 0.012, top + 0.03, -dz, dz);
    }
  });
}

/** The fins on the electrical hood's louvred slopes. */
function hoodLouvres(m: MeshBuilder): void {
  const [ya, yb] = HOOD.y, [wa, wb] = HOOD.w;
  m.scope("hood louvres", () => {
    for (const s of [-1, 1]) {
      // a dark louvre panel just off each slope, between y 4.42 and 4.74
      const lo = 4.42, hi = 4.74;
      const wAt = (y: number) => wa + ((wb - wa) * (y - ya)) / (yb - ya);
      const off = 0.012;
      for (const [xa, xb] of [[-6.15, -5.35], [-5.25, -4.45]] as const) {
        const p = (x: number, y: number): Vec3 => [x, y, s * (wAt(y) + off)];
        const n: Vec3 = [0, yb - ya, s * (wa - wb)];
        m.facets("louvre", [p(xa, lo), p(xb, lo), p(xb, hi), p(xa, lo), p(xb, hi), p(xa, hi)], n);
        for (let x = xa + 0.06; x < xb - 0.02; x += 0.115)
          m.rod("roof", [x, lo, s * (wAt(lo) + 0.02)], [x, hi, s * (wAt(hi) + 0.02)], 0.016, 4);
      }
    }
  });
}

/** The main reservoirs at the fuel tank's ends, the battery boxes' handles. */
function underframe(m: MeshBuilder): void {
  m.scope("reservoirs", () => {
    for (const [x0, x1] of [[-3.55, -2.9], [1.55, 2.45]] as const)
      for (const z of [-0.6, 0.6]) {
        const q = ngon(12, 0.27, Math.PI / 12, z, 0.68);
        m.sweep("tank", "x", q, x0, q, x1);
      }
  });
  m.scope("battery boxes", () => {
    for (const s of [-1, 1])
      for (const x of [-2.4, -1.5, -0.6, 0.3, 1.1])
        block(m, "steel", x - 0.05, x + 0.05, 0.8, 0.86, ...((s > 0 ? [1.3, 1.34] : [-1.34, -1.3]) as [number, number]));
  });
}

/** The DF8B. */
export function buildDf8b(): MeshBuilder {
  const spec = df8bSpec();
  const m = buildBoxLoco(spec);
  for (const e of [-1, 1])
    m.scope(e > 0 ? "front cab" : "rear cab", () => {
      m.scope("pilot", () => pilot(m, e));
      m.scope("roof cap", () => headlight(m, e));
    });
  m.scope("roof equipment", () => {
    fans(m);
    hoodLouvres(m);
    m.scope("engine exhaust", () => exhaust(m, -1.1, 0, TOP - 0.03, TOP + 0.16, 0.5, 0.36));
  });
  m.scope("underframe", () => underframe(m));
  m.scope("louvres", () => louvres(m, spec));
  m.scope("markings", () => markings(m, spec));
  return m;
}

/** The same locomotive for distant views (docs/models/lod.md): the kit's box locomotive from the same tables and paint. */
export function buildDf8bLod(): MeshBuilder {
  return boxLocoLod(df8bSpec());
}
