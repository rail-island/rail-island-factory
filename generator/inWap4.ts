// The WAP-4 (CLW's Co-Co 25 kV AC passenger locomotive of 1994, on the WAM-4 / WAP-1
// lineage) on the box locomotive kit (boxLocoKit.ts), with its own profile tables and
// skin items in place of the generic `raked` nose of worldLocoKit.ts: the cab face
// upright below the lamps and leaning back to the rounded cab roof, two windscreens in
// their recesses behind the stone guards, the twin headlight pod and the horns on the
// face's top, the marker lamps (white over red) in their recessed housings at the
// waist, the shed's emblem between the yellow lightning bolts, the mesh plough; the
// sides' eleven bays of small rounded windows over vertical-slat louvres, the cab door
// near each end (a small window ahead of it at one end, point-symmetric), the large
// grey roof cants over the machine room with the cabs' sides rising to the cab roof,
// two single-arm pantographs about 4.2 m from the centre with the roof line and its
// post insulators between them, the transformer tank between the Co-Co bogies.
// Measured on the photographs of assets/ir-wap4/ (SOURCES.md). See
// docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, roundRect } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { enumParam } from "./emuParts.ts";

// --- measures (m) -----------------------------------------------------------------------

/** Length over buffers 18.794 m, body width 3.18 m, height 4.165 m. */
const HALF = 9.397;
/** The body's end at the sill (the buffers stand about 0.55 m proud of it). */
const N = 8.85;
const W = 1.59;
const Y0 = 1.3;
const ROOF = 4.165;
/** The skirt's top (dark below), the room side's top (the grey roof cant above). */
const SKIRT = 1.75, CANT = 3.55;
/** The end's centre line [y, |x|]: upright to the lamps, then leaning back to the rounded cab roof. */
const TIP: ReadonlyArray<readonly [number, number]> = [[Y0, N], [2.55, N], [3.85, N - 0.3], [4.05, N - 0.45], [ROOF, N - 0.75]];
/** The half width: full to the cant, then the big rounded roof. */
const HW: ReadonlyArray<readonly [number, number]> = [[Y0, W], [CANT, W], [3.85, W - 0.14], [4.05, W - 0.4], [ROOF, W - 0.75]];
/** The face is nearly flat, its upright corners well rounded (0.3 m back at the side). */
const CORNER = 0.3;
const endPlan = (_y: number, w: number): ReadonlyArray<readonly [number, number]> => [[0, 0], [w * 0.74, 0.035], [w * 0.92, 0.13], [w, CORNER]];
/** Bogie centres 11.0 m, axles 1.9 m apart, wheels 1,092 mm (estimated: the bogies are hidden in the side photo). */
const PIVOT = 5.5, BASE = 1.9, WHEEL_R = 0.546;
/** The pantographs' centres, measured on the side photo (0.27 and 0.74 of the body). */
const PANTO_X = 4.2;
/** The windscreens: sill, head, the centre pillar's half width, the outer edge. */
const SCREEN = { y: [3.02, 3.78] as const, z0: 0.08, z1: 1.2 };
/** The waist stripe on side and face (the Rajdhani scheme). */
const STRIPE: readonly [number, number] = [2.06, 2.31];
/** The machine room's bays: the first centre, the pitch, the count; window and louvre heights. */
const BAYS = { x0: -6.1, pitch: 1.18, n: 11, w: 0.8, win: [3.1, 3.38] as const, louvre: [2.38, 3.0] as const };

// --- liveries -----------------------------------------------------------------------------

interface Livery {
  title: string;
  number: string;
  /** The body's main colour, the stripe (and its bounds) or the upper colour above `upper`. */
  body: string;
  accent: string;
  stripe?: readonly [number, number];
  upper?: number;
  letter: string;
}

/** The keys are stored in saved maps: never rename them. */
const LIVERIES: Record<string, Livery> = {
  // the red body with the yellow waist stripe and the lightning bolts (Arakkonam 22829, Erode, Lallaguda ...)
  rajdhani: { title: "Rajdhani red", number: "22829", body: "#c3212b", accent: "#f2b818", stripe: STRIPE, letter: "#f2b818" },
  // Arakkonam's Shatabdi scheme: dark blue with the pale yellow upper part round the windscreens (22726)
  shatabdi: { title: "Shatabdi blue", number: "22726", body: "#28306a", accent: "#e3d77e", upper: 2.95, letter: "#f2b818" },
};

export const WAP4_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];

// --- the spec -----------------------------------------------------------------------------

/** The paint bands by height, from the skirt up: on the sides the room's roof cants are grey above `CANT`, the face is painted to its top. */
function bands(l: Livery, top: number): Band[] {
  const out: Band[] = [[Y0, SKIRT, "dark"]];
  if (l.stripe) out.push([SKIRT, l.stripe[0], "body"], [l.stripe[0], l.stripe[1], "accent"], [l.stripe[1], top, "body"]);
  else out.push([SKIRT, l.upper!, "body"], [l.upper!, top, "accent"]);
  if (top < 9) out.push([top, 9, "roof"]);
  return out;
}

/** Mirror a side item's x span to the other end (point symmetry: the left side is the right one turned about). */
const turned = (it: SideItem): SideItem => ({ ...it, name: `${it.name} (left)`, x: [-it.x[1], -it.x[0]], sides: [-1] });

/** The right side's (+z) items, front +x; the left side is the same turned about. */
function sideItemsRight(l: Livery): SideItem[] {
  const out: SideItem[] = [];
  for (let i = 0; i < BAYS.n; i++) {
    const xc = BAYS.x0 + i * BAYS.pitch, x: [number, number] = [xc - BAYS.w / 2, xc + BAYS.w / 2];
    // the small windows sit flush in their rubber: a glass pane laid on the skin
    out.push({ kind: "paint", name: `room window ${i + 1}`, x, y: BAYS.win, mat: "glass", poly: roundRect(x[0], x[1], BAYS.win[0], BAYS.win[1], 0.1, 2), sides: [1] });
    out.push({ kind: "grille", name: `louvre ${i + 1}`, x, y: BAYS.louvre, slats: "v", pitch: 0.16, mat: "slat", sides: [1] });
  }
  // the cabs' sides rise in body colour to the cab roof, over the room's grey cants
  const cabCol = l.stripe ? "body" : "accent";
  // its front edge follows the face's corner as it leans back
  const xe = (y: number) => lerpTable(TIP, y) - CORNER - 0.03;
  const cab: Ring = [[6.62, CANT], [xe(CANT), CANT], [xe(3.85), 3.85], [xe(3.98), 3.98], [6.62, 3.98]];
  out.push({ kind: "paint", name: "front cab side", x: [6.62, xe(CANT)], y: [CANT, 3.98], poly: cab, mat: cabCol, sides: [1] });
  out.push({ kind: "paint", name: "rear cab side", x: [-xe(CANT), -6.62], y: [CANT, 3.98], poly: cab.map(([u, v]) => [-u, v] as [number, number]).reverse(), mat: cabCol, sides: [1] });
  // the front cab: the door just behind the face; the rear cab: the door with a small window ahead of it
  out.push({ kind: "door", name: "front cab door", x: [7.12, 7.78], y: [SKIRT, 3.8], win: [3.05, 3.6], rails: true, sides: [1] });
  out.push({ kind: "door", name: "rear cab door", x: [-7.42, -6.78], y: [SKIRT, 3.8], win: [3.05, 3.6], rails: true, sides: [1] });
  out.push({ kind: "window", name: "rear cab window", x: [-7.9, -7.5], y: [3.05, 3.6], mat: "rubber", r: 0.06, sides: [1] });
  // the large painted running number on the rear cab's side, under the stripe's level
  out.push({ kind: "plate", name: "number", x: [-6.3, -5.1], y: [1.8, 2.04], sides: [1] });
  return out;
}

function spec(l: Livery): LocoSpec {
  const palette: Record<string, MaterialSpec> = {
    body: c(l.body), accent: c(l.accent), dark: c("#3d4043", 0.7),
    roof: { color: "#8c9091", roughness: 0.7 },
    // the running numbers are painted on the body: the plate in body colour, the digits ("white") in the letter colour
    plate: c(l.body), white: c(l.letter), bolt: c("#f2b818"),
    flagSaffron: c("#f08a24"), flagWhite: c("#f4f4f0"), flagGreen: c("#138a36"), emblem: c("#2a5a3a"), emblemRing: c("#e8d25a"),
  };
  const side = bands(l, CANT);
  const right = sideItemsRight(l);
  const sideItems: SideItem[] = [...right, ...right.map(turned)];
  const sy = 2.35;
  const endItems: EndItem[] = [
    { kind: "window", name: "windscreen left", z: [SCREEN.z0, SCREEN.z1], y: SCREEN.y, wiper: true },
    { kind: "window", name: "windscreen right", z: [-SCREEN.z1, -SCREEN.z0], y: SCREEN.y, wiper: true },
    // the marker lamps' recessed housings at the waist, white over red
    { kind: "paint", name: "marker housing left", z: [0.78, 1.04], y: [sy - 0.24, sy + 0.24], mat: "dark", layer: 2 },
    { kind: "paint", name: "marker housing right", z: [-1.04, -0.78], y: [sy - 0.24, sy + 0.24], mat: "dark", layer: 2 },
    { kind: "lamp", name: "marker lamp left", z: [0.86, 0.96], y: [sy + 0.04, sy + 0.14], r: 0.055 },
    { kind: "lamp", name: "marker lamp right", z: [-0.96, -0.86], y: [sy + 0.04, sy + 0.14], r: 0.055 },
    { kind: "lamp", name: "tail lamp left", z: [0.86, 0.96], y: [sy - 0.14, sy - 0.04], r: 0.055, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-0.96, -0.86], y: [sy - 0.14, sy - 0.04], r: 0.055, mat: "lampRed" },
    // the shed's emblem between the two lightning bolts
    { kind: "paint", name: "emblem ring", z: [-0.22, 0.22], y: [sy - 0.22, sy + 0.22], poly: ngon(14, 0.22, 0, 0, sy), mat: "emblemRing", layer: 2 },
    { kind: "paint", name: "emblem", z: [-0.18, 0.18], y: [sy - 0.18, sy + 0.18], poly: ngon(14, 0.18, 0, 0, sy), mat: "emblem", layer: 3 },
    ...bolts(sy),
    // the flag on the face's left (seen from ahead), on the stripe
    { kind: "paint", name: "flag saffron", z: [1.08, 1.46], y: [2.42, 2.5], mat: "flagSaffron", layer: 2 },
    { kind: "paint", name: "flag white", z: [1.08, 1.46], y: [2.34, 2.42], mat: "flagWhite", layer: 2 },
    { kind: "paint", name: "flag green", z: [1.08, 1.46], y: [2.26, 2.34], mat: "flagGreen", layer: 2 },
    // the running number painted over the right windscreen's foot
    { kind: "plate", name: "number", z: [-1.2, -0.45], y: [2.78, 2.96] },
  ];
  return {
    palette,
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side,
    end: bands(l, 9),
    roof: "roof",
    buffers: HALF,
    beam: N,
    bufferY: 1.105,
    frame: { y0: Y0 - 0.35, y1: Y0, half: N, hw: W - 0.05, mat: "dark" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: [-BASE, 0, BASE], wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: ROOF - 0.02, baseY: ROOF + 0.18 },
    sideItems,
    endItems,
    roofItems: [
      // the room's flat roof hatches between the cabs' roofs, the vent box near the middle
      { name: "roof hatches", x: [-6.4, 6.4], w: [W - 1.05, W - 1.1], y: [ROOF - 0.03, ROOF + 0.02], mat: "roof" },
      { name: "vent box", x: [0.45, 1.35], w: [0.42, 0.36], y: [ROOF, ROOF + 0.2], mat: "slat" },
    ],
    underItems: [[-2.6, 2.6, Y0 - 0.85, Y0 - 0.35, W - 0.45]],
    number: l.number,
  };
}

/** The two yellow lightning bolts flanking the emblem, each two convex pieces (seen from ahead, +z left). */
function bolts(sy: number): EndItem[] {
  const out: EndItem[] = [];
  for (const s of [-1, 1]) {
    // upper piece: from the head down to the knee, leaning outwards; lower piece: from the knee to the point
    const up: Ring = [[s * 0.24, sy + 0.4], [s * 0.4, sy + 0.4], [s * 0.44, sy - 0.02], [s * 0.3, sy + 0.06]];
    const lo: Ring = [[s * 0.3, sy + 0.08], [s * 0.62, sy - 0.02], [s * 0.33, sy - 0.5]];
    const area = (r: Ring) => r.reduce((a, p, i) => { const q = r[(i + 1) % r.length]!; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
    const ccw = (r: Ring): Ring => (area(r) > 0 ? r : [...r].reverse());
    const box = (r: Ring): [[number, number], [number, number]] => {
      const zs = r.map((p) => p[0]), ys = r.map((p) => p[1]);
      return [[Math.min(...zs), Math.max(...zs)], [Math.min(...ys), Math.max(...ys)]];
    };
    for (const [name, r] of [["upper", up], ["lower", lo]] as const) {
      const [z, y] = box(r);
      out.push({ kind: "paint", name: `bolt ${s > 0 ? "left" : "right"} ${name}`, z, y, poly: ccw(r), mat: "bolt", layer: 2 });
    }
  }
  return out;
}

// --- details the kit does not draw ----------------------------------------------------------

/** The face's x (front, +) at height y and z. */
function faceX(y: number, z: number): number {
  const w = lerpTable(HW, y);
  const plan = endPlan(y, w);
  let set = plan[plan.length - 1]![1];
  for (let i = 1; i < plan.length; i++) {
    const [z0, d0] = plan[i - 1]!, [z1, d1] = plan[i]!;
    if (Math.abs(z) <= z1) { set = d0 + ((d1 - d0) * (Math.abs(z) - z0)) / (z1 - z0); break; }
  }
  return lerpTable(TIP, y) - set;
}

/** A thin bar from (y0) to (y1) standing `off` proud of the face at z, leaning with it. */
function faceBar(m: MeshBuilder, e: number, z: number, y0: number, y1: number, off: number, r: number): void {
  const ring = (y: number): Ring => ngon(4, r, Math.PI / 4, e * (faceX(y, z) + off), z);
  m.loft("steel", ring(y0), y0, ring(y1), y1);
}

/** The stone guards over the windscreens: a frame and vertical bars, 8 cm proud of the glass. */
function screenGuards(m: MeshBuilder, e: number): void {
  const [y0, y1] = [SCREEN.y[0] - 0.03, SCREEN.y[1] + 0.03];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "guard left" : "guard right", () => {
      const za = s * (SCREEN.z0 - 0.02), zb = s * (SCREEN.z1 + 0.02);
      const n = 5;
      for (let i = 0; i <= n; i++) {
        const z = za + ((zb - za) * i) / n;
        faceBar(m, e, z, y0, y1, 0.08, i === 0 || i === n ? 0.022 : 0.007);
      }
      for (const y of [y0, (y0 + y1) / 2, y1]) {
        const x = e * (faceX(y, s * (SCREEN.z0 + SCREEN.z1) / 2) + 0.08);
        const sec = ngon(4, 0.018, Math.PI / 4, x, y);
        m.sweep("steel", "z", sec, Math.min(za, zb), sec, Math.max(za, zb));
      }
      for (const z of [za, zb]) for (const y of [y0 + 0.05, y1 - 0.05]) {
        const x0 = faceX(y, z) - 0.02, x1 = faceX(y, z) + 0.08;
        const sec = ngon(4, 0.015, Math.PI / 4, z, y);
        m.sweep("steel", "x", sec, e > 0 ? x0 : -x1, sec, e > 0 ? x1 : -x0);
      }
    });
}

/** The air and MU hoses hanging from the waist beside the emblem: a pipe looping down to the beam. */
function hoses(m: MeshBuilder, e: number): void {
  for (const z of [-0.45, 0.45]) {
    const x = e * (faceX(2.3, z) + 0.07);
    m.scope("hose", () => {
      m.prism("dark", ngon(6, 0.035, 0, x, z), 1.72, 2.5);
      m.prism("dark", ngon(6, 0.05, 0, x, z), 2.44, 2.56);
    });
  }
}

/** The buffer beam's lip under the face and the mesh plough under the beam. */
function lowerEnd(m: MeshBuilder, e: number): void {
  const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
  m.scope("beam lip", () => {
    const [a, b] = span(N - 0.05, N + 0.12);
    m.prism("dark", [[b, 1.5], [b, -1.5], [a, -1.5], [a, 1.5]], SKIRT - 0.08, SKIRT);
  });
  const [yb, yt] = [0.15, Y0 - 0.37];
  const [xb, xt] = [N + 0.42, N + 0.3];
  const at = (y: number) => xb + ((xt - xb) * (y - yb)) / (yt - yb);
  m.scope("plough", () => {
    m.scope("top beam", () => {
      const sec: Ring = [[-1.25, yt - 0.02], [1.25, yt - 0.02], [1.25, Y0 - 0.33], [-1.25, Y0 - 0.33]];
      const [a, b] = span(N - 0.2, xt + 0.06);
      m.sweep("dark", "x", sec, a, sec, b);
    });
    m.scope("posts", () => {
      const n = 10;
      for (let i = 0; i < n; i++) {
        const z = -1.15 + (2.3 * i) / (n - 1);
        const ring = (y: number): Ring => ngon(4, i === 0 || i === n - 1 ? 0.035 : 0.018, Math.PI / 4, e * at(y), z);
        m.loft("dark", ring(yb), yb, ring(yt), yt);
      }
    });
    m.scope("rails", () => {
      for (const y of [yb + 0.03, 0.32, 0.5, 0.68, yt - 0.04]) {
        const sec = ngon(4, 0.022, Math.PI / 4, e * (at(y) + 0.03), y);
        m.sweep("dark", "z", sec, -1.18, sec, 1.18);
      }
    });
  });
}

/** The twin headlight pod on the face's top edge and the horns beside it. */
function roofFront(m: MeshBuilder, e: number): void {
  const xf = N - 0.62, xb = N - 1.02;
  const box = (x0: number, x1: number, w: number, y0: number, y1: number, mat: string) => {
    const [a, b] = e > 0 ? [x0, x1] : [-x1, -x0];
    const ring: Ring = [[b, w], [b, -w], [a, -w], [a, w]];
    m.prism(mat, ring, y0, y1);
  };
  m.scope("headlight pod", () => {
    box(xb, xf, 0.34, ROOF - 0.12, ROOF + 0.03, "body");
    box(xb + 0.05, xf - 0.02, 0.3, ROOF + 0.03, ROOF + 0.24, "dark");
    for (const z of [-0.14, 0.14]) {
      const lens = ngon(12, 0.09, 0, z, ROOF + 0.135);
      const [l0, l1] = e > 0 ? [xf - 0.05, xf + 0.012] : [-xf - 0.012, -xf + 0.05];
      m.sweep("lampHead", "x", lens, l0, lens, l1);
    }
  });
  m.scope("horns", () => {
    for (const z of [-0.55, 0.55]) {
      const x0 = N - 1.2, x1 = N - 0.85;
      const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      const [s0, s1] = span(x0, x0 + 0.08);
      m.prism("dark", [[s1, z + 0.04], [s1, z - 0.04], [s0, z - 0.04], [s0, z + 0.04]], ROOF - 0.12, ROOF + 0.06);
      const stem = ngon(8, 0.035, 0, z, ROOF + 0.1), bell = ngon(8, 0.07, 0, z, ROOF + 0.1);
      const [t0, t1] = span(x0, x1 - 0.12), [b0, b1] = span(x1 - 0.12, x1);
      m.sweep("dark", "x", stem, t0, stem, t1);
      m.sweep("dark", "x", e > 0 ? stem : bell, b0, e > 0 ? bell : stem, b1);
    }
  });
}

/** The roof line between the pantographs on its post insulators, and the main circuit breaker. */
function roofLine(m: MeshBuilder): void {
  const z = 0.35, y = ROOF + 0.4;
  const post = (x: number) => m.scope("insulator", () => {
    m.prism("insulator", ngon(8, 0.045, 0, x, z), ROOF - 0.02, y - 0.02);
    for (const f of [0.12, 0.24]) m.prism("insulator", ngon(8, 0.08, Math.PI / 8, x, z), ROOF + f, ROOF + f + 0.03);
  });
  m.scope("roof line", () => {
    for (const x of [-5.4, -2.0, 2.0, 5.4]) post(x);
    tubeX(m, "copper", 0.02, -(PANTO_X - 0.6), y, z, PANTO_X - 0.6, y, z, 6);
    for (const e of [-1, 1]) tubeX(m, "copper", 0.02, e * (PANTO_X - 0.6), y, z, e * 5.4, y, z, 6);
  });
  m.scope("circuit breaker", () => {
    m.prism("dark", ngon(8, 0.12, Math.PI / 8, -0.4, -0.35), ROOF - 0.02, ROOF + 0.16);
    m.prism("insulator", ngon(8, 0.06, 0, -0.4, -0.35), ROOF + 0.16, ROOF + 0.48);
  });
}

const livery = (v?: ParamValues): Livery => LIVERIES[resolveParams(WAP4_PARAMS, v).livery!]!;

export function irWap4(v?: ParamValues): MeshBuilder {
  const sp = spec(livery(v));
  const m = buildBoxLoco(sp);
  m.scope("cab details", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        m.scope("stone guards", () => screenGuards(m, e));
        m.scope("hoses", () => hoses(m, e));
        m.scope("lower end", () => lowerEnd(m, e));
        roofFront(m, e);
      });
  });
  roofLine(m);
  // the shell's underside beside the frame, which stands 5 cm in from the sides
  m.scope("underside", () => {
    const [H, w, k] = [N - 0.01, W - 0.01, 0.17];
    const r: Ring = [[H, -w + k], [H - k, -w], [-H + k, -w], [-H, -w + k], [-H, w - k], [-H + k, w], [H - k, w], [H, w - k]];
    m.cap("dark", r, Y0, false);
  });
  return m;
}

export function irWap4Lod(v?: ParamValues): MeshBuilder {
  // the waist stripe and the cab fronts before the roof hatches: the distant model leaves out the flat roof boxes
  const s = spec(livery(v));
  return boxLocoLod({ ...s, roofItems: [] });
}
