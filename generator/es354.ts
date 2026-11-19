// The Renfe 354 (the "4000-T" of Talgo), the eight Krauss-Maffei B'B' diesel-hydraulic
// locomotives of 1982-84 built to haul the Talgo Pendular, every one named after a
// "Virgen" (354 001 "Virgen de Covadonga", preserved at Vilanova i la Geltru). Measured
// from the photographs in assets/renfe-354/ (SOURCES.md) and the published figures:
// 19.92 m over the buffers, 3.04 m wide, 3.45 m high (the body's crown: low, to match the
// Talgo's cars), B'B', 80 t, 2 x MTU 396 (4,171 CV), 180 km/h as delivered and 200 km/h
// from 1986.
//
// A single cab at the front (+x), the rear end flat with rounded corners where the Talgo
// set is coupled (the photographs show the rear always against the first car; the side's
// grille rows run to the rear end, no cab door there). The cab: a lower face standing
// upright with the cream "bumper" ledge over the buffers, the upper face bowed in plan and
// leaning back 0.11 m over the windows, its corners rounded 0.62 m back into the sides,
// the roof rounding down to it; three windows across the face (a wide one either side of
// the narrow middle one, their frames aluminium with big rounded corners) and a corner
// window on each rounded corner, the side door behind it. On the cab roof the raised
// cooler hump, its front sloping, carrying the twin headlight in its pod.
//
// The Talgo livery (the Talgo Pendular's dark blue and cream, as 354 001 was restored):
// dark blue overall, the face's cream lower part and the cream number band between the
// blue name band and the windows, both carried round the corners; on the sides the cream
// bars at the number band's height between the grille groups and the cream band low
// along the body. The sides carry fourteen grille panels in the upper row, the big grille
// behind the door and four lower grilles in the middle in the row below.
//
// Scales (SOURCES.md): the side-on photo-rn-354-0031.jpg by a 1-D projective fit over the
// buffers, the four axles (equal bogie wheelbases) - 40 px/m at the front buffer falling to
// 12 px/m at the rear (bogies 10.3 m apart, 3.0 m wheelbase, the 14 upper grilles at a
// 0.98 m pitch, the door 2.7 - 3.2 m behind the front buffer, the rear end 19.0 m), 31
// px/m vertically at the cab door; the head-on photo-talgo-madrid-coruna-...jpg at 102
// px/m over the body's 3.04 m (the face's windows and bands); the three-quarter views for
// the corners, the hump and the side paint.
//
// Its own body (like the HXD1's section, cnHxd1.ts) lofted from the tables below; the kits'
// parts (czElectricKit.ts: bogies, buffers, surface panels). Metres, +X toward the cab,
// wheel contact at y = 0. See docs/models/spain-trains.md.

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { KIT_PALETTE, bogie, buffers, c, kinks, lerpTable, rect, roundRect, surfacePanel, type Place } from "./czElectricKit.ts";
import { exhaust, horn } from "./dieselParts.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";
import { LOD_GLASS, lodBogie, type LodBand, type LodPart } from "./lodKit.ts";
import { fitUnit, roofPart, underPart, type UnitBody } from "./lodUnits.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];
type Pt = readonly [number, number];

/** Length over the buffers (19.92 m), half of it; the cab's lower face and the flat rear end (|x|). */
export const R354_LENGTH = 19.92;
const HALF = R354_LENGTH / 2;
const N = HALF - 0.6;
const XR = 9.1;
/** The running number and the name the model carries: 354 001, restored in the Talgo livery. */
export const R354_NUMBER = "354-001-0";
const NAME = "VIRGEN DE COVADONGA";

// heights (m over the rail)
const Y0 = 1.0; // the shell's foot over the bogies
const EAVE = 3.05;
const CROWN = 3.45;
const BUFFER_Y = 1.06;
/** The face's paint: the cream lower part to 1.71, the blue name band, the cream number band to the windows' foot. */
const LOW_CREAM = 1.71;
const NUMBER_BAND: Span = [1.98, 2.35];
/** The side's cream band low along the body. */
const SIDE_CREAM: Span = [1.48, LOW_CREAM];
/** The face's windows, the side's two grille rows. */
const WINDOWS: Span = [2.37, 3.02];
const UPPER: Span = [2.41, 3.0];
const LOWER: Span = [1.78, 2.27];

/** The cab's centre line [y, x]: the bumper upright, its ledge, the upper face leaning back over the windows, the roof rounding down. */
const TIP: Table = [[Y0, N], [LOW_CREAM, N], [1.75, N - 0.1], [WINDOWS[0] - 0.02, N - 0.13], [3.03, N - 0.24], [3.15, N - 0.33], [3.27, N - 0.5], [3.37, N - 0.72], [CROWN, N - 1.0]];
/** The half width: the sides upright to the eave, the roof rounding over to the flat crown. */
const HW: Table = [[Y0, 1.47], [1.1, 1.49], [EAVE, 1.49], [3.17, 1.44], [3.28, 1.33], [3.38, 1.14], [CROWN, 0.86]];
/** The rear end's centre line (negative x): upright, the roof rounding down to it. */
const REAR: Table = [[Y0, -XR], [EAVE, -XR], [3.25, -XR + 0.1], [3.38, -XR + 0.22], [CROWN, -XR + 0.35]];

const tip = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
const rearX = (y: number) => lerpTable(REAR, y);
/** The cab's plan at half width w: bowed across the windows, the corners rounded 0.62 m back. [z, setback]. */
const frontPlan = (w: number): Pt[] => [[0, 0], [0.35 * w, 0.025], [0.6 * w, 0.08], [0.78 * w, 0.17], [0.9 * w, 0.3], [0.97 * w, 0.45], [w, 0.62]];
const CORNER_BACK = 0.62;
/** The rear end's plan: flat, the corners rounded 0.32 m. */
const rearPlan = (w: number): Pt[] => [[0, 0], [w - 0.32, 0], [w - 0.16, 0.04], [w - 0.05, 0.14], [w, 0.32]];

const KINKS = kinks(TIP, HW, REAR);

// --- paint -------------------------------------------------------------------------------------

type Band = readonly [number, number, string];
const SIDE: readonly Band[] = [[Y0, SIDE_CREAM[0], "blue"], [SIDE_CREAM[0], SIDE_CREAM[1], "cream"], [SIDE_CREAM[1], CROWN, "blue"]];
const FACE: readonly Band[] = [[Y0, LOW_CREAM, "cream"], [LOW_CREAM, NUMBER_BAND[0], "blue"], [NUMBER_BAND[0], NUMBER_BAND[1], "cream"], [NUMBER_BAND[1], CROWN, "blue"]];
const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y <= b) ?? bands[bands.length - 1]!)[2];

const PALETTE = {
  ...KIT_PALETTE,
  // the Talgo Pendular's dark blue and cream (354 001 restored)
  blue: c("#1f3864", 0.5),
  cream: c("#ece5cc", 0.5),
  roof: c("#1f3864", 0.6),
  alu: { color: "#c9cdcf", metallic: 0.5, roughness: 0.35 },
  louvre: { color: "#14213b", roughness: 0.8 },
  slat: c("#2b4a7c", 0.6),
  hump: c("#1c3159", 0.6),
  grille: c("#1a1d22", 0.75),
  silencer: c("#7a3326", 0.7),
  exhaust: c("#2b2b2b", 0.9),
  horn: { color: "#2d4f8a", metallic: 0.3, roughness: 0.4 },
  handrail: c("#c9ccce", 0.4),
  black: c("#1e1f21", 0.7),
  yellow: c("#f2c21a", 0.5),
};

// --- the shell ---------------------------------------------------------------------------------

type Region = "front" | "side" | "rear";
interface RingPt { x: number; z: number; region: Region; sign: number }

/** The ring at height y, clockwise seen from above: front centre to -z, the -z side, the rear end, the +z side, back to the front centre. */
function ringAt(y: number): RingPt[] {
  const t = tip(y), w = hw(y), fp = frontPlan(w), rp = rearPlan(w), r = rearX(y);
  const out: RingPt[] = [];
  const nf = fp.length - 1, nr = rp.length - 1;
  for (let i = 0; i <= nf; i++) out.push({ x: t - fp[i]![1], z: -fp[i]![0], region: i === nf ? "side" : "front", sign: -1 });
  for (let i = nr; i >= 1; i--) out.push({ x: r + rp[i]![1], z: -rp[i]![0], region: "rear", sign: -1 });
  for (let i = 0; i <= nr; i++) out.push({ x: r + rp[i]![1], z: rp[i]![0], region: i === nr ? "side" : "rear", sign: 1 });
  for (let i = nf; i >= 1; i--) out.push({ x: t - fp[i]![1], z: fp[i]![0], region: "front", sign: 1 });
  return out;
}

function orient(m: MeshBuilder, mat: string, t: [Vec3, Vec3, Vec3], n: Vec3): void {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  if (nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0) m.tri(mat, a, b, cc);
  else m.tri(mat, a, cc, b);
}

/** Lofts the body between its rings; the crown capped, the bottom open over the frame. */
function shell(m: MeshBuilder): void {
  const hs = new Set<number>(KINKS.filter((y) => y >= Y0 && y <= CROWN));
  for (const bands of [SIDE, FACE]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y0 && h < CROWN) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  const groups = new Map<string, Array<{ mat: string; t: [Vec3, Vec3, Vec3]; n: Vec3 }>>();
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [ringAt(ya), ringAt(yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const { region, sign } = lo[j]!;
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const mat = bandAt(region === "front" ? FACE : SIDE, ym);
      const where = region === "front" ? "cab face" : region === "rear" ? "rear end" : `side ${sign > 0 ? "right" : "left"}`;
      const en: Vec3 = [-(b[2] - a[2]), 0, b[0] - a[0]];
      const n: Vec3 = Math.hypot(en[0], en[2]) > 1e-9 ? en : [-(cc[2] - d[2]), 0, cc[0] - d[0]];
      if (!groups.has(where)) groups.set(where, []);
      groups.get(where)!.push({ mat, t: [a, b, cc], n }, { mat, t: [a, cc, d], n });
    }
  }
  for (const where of [...groups.keys()].sort()) m.scope(where, () => { for (const g of groups.get(where)!) orient(m, g.mat, g.t, g.n); });
  m.scope("roof", () => m.cap("roof", ringAt(CROWN).map((p) => [p.x, p.z] as [number, number]), CROWN));
}

// --- laying things on the skin -------------------------------------------------------------------

/** The point d off side s's wall (+1 right) at x, height y. */
const onSide = (s: number): Place => (x, y, d) => [x, y, s * (hw(y) + d)];

/**
 * The cab's skin round its plan: u is the arc length from the face's centre line as seen
 * from ahead (u > 0 to the viewer's right, the loco's -z side), running round the
 * rounded corner and on along the side wall behind it, so a band or a window can wrap
 * the corner. d is off the skin along its local normal in plan.
 */
function arcPoint(u: number, y: number, d: number): { p: Vec3; n: Vec3 } {
  const t = tip(y), w = hw(y), plan = frontPlan(w);
  const zs = u >= 0 ? -1 : 1;
  let s = Math.abs(u);
  for (let i = 1; i <= plan.length; i++) {
    // the plan's segments, then the side wall behind the corner
    const [z0, b0] = plan[i - 1]!;
    const [z1, b1] = i < plan.length ? plan[i]! : [w, b0 + 1e3];
    const len = Math.hypot(z1 - z0, b1 - b0);
    if (s <= len + 1e-9 || i === plan.length) {
      const f = len > 0 ? s / len : 0;
      const z = z0 + f * (z1 - z0), b = b0 + f * (b1 - b0);
      // outward normal in plan: the segment runs outward in z and back in x
      const nx = (z1 - z0) / len, nz = (b1 - b0) / len;
      return { p: [t - b + d * nx, y, zs * (z + d * nz)], n: [nx, 0, zs * nz] };
    }
    s -= len;
  }
  throw new Error("unreachable");
}
const onCab: Place = (u, y, d) => arcPoint(u, y, d).p;
/** The arc lengths of the plan's corners at height y (columns for panels on the cab), both signs. */
function cabCols(y: Span): number[] {
  const hs = [y[0], y[1], ...KINKS.filter((h) => h > y[0] && h < y[1])];
  const out = new Set<number>();
  for (const h of hs) {
    const plan = frontPlan(hw(h));
    let s = 0;
    out.add(0);
    for (let i = 1; i < plan.length; i++) {
      s += Math.hypot(plan[i]![0] - plan[i - 1]![0], plan[i]![1] - plan[i - 1]![1]);
      out.add(Math.round(s * 1e6) / 1e6);
    }
  }
  return [...out].flatMap((s) => [s, -s]).sort((a, b) => a - b);
}
/** The outward normal of the cab skin at arc u (mid height of an item), for winding a panel on it. */
const cabN = (u: number, y: number): Vec3 => arcPoint(u, y, 0).n;
/** The arc length where the corner meets the side wall (the plan's length; the same at every height up to the eave). */
const ARC_SIDE = frontPlan(1.49).reduce((s, p, i, a) => s + (i ? Math.hypot(p[0] - a[i - 1]![0], p[1] - a[i - 1]![1]) : 0), 0);

/** A panel on the cab skin, `u` as seen from ahead. */
function cabPanel(m: MeshBuilder, mat: string, poly: Ring, d0: number, d1: number): void {
  const us = poly.map((p) => p[0]), vs = poly.map((p) => p[1]);
  const y: Span = [Math.min(...vs), Math.max(...vs)];
  const n = cabN((Math.min(...us) + Math.max(...us)) / 2, (y[0] + y[1]) / 2);
  surfacePanel(m, mat, onCab, n, poly, d0, d1, cabCols(y), KINKS);
}

/** A framed window on the cab: the aluminium frame, the glass, an optional wiper parked along its foot. */
function cabWindow(m: MeshBuilder, u: Span, y: Span, r: number, wiper: number): void {
  m.scope("frame", () => cabPanel(m, "alu", roundRect(u[0], u[1], y[0], y[1], r, 4), -0.01, 0.016));
  m.scope("glass", () => cabPanel(m, "glass", roundRect(u[0] + 0.05, u[1] - 0.05, y[0] + 0.05, y[1] - 0.05, r - 0.04, 4), -0.005, 0.024));
  if (wiper) m.scope("wiper", () => {
    const a = wiper > 0 ? u[0] + 0.1 : u[1] - 0.1 - (u[1] - u[0]) * 0.55;
    cabPanel(m, "rubber", rect(a, y[0] + 0.09, a + (u[1] - u[0]) * 0.55, y[0] + 0.115), 0.022, 0.036);
  });
}

/** A framed window or grille on a side wall. */
function sideWindow(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span, r: number): void {
  m.scope("frame", () => surfacePanel(m, "alu", at, n, roundRect(x[0], x[1], y[0], y[1], r, 3), -0.01, 0.014, [], KINKS));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(x[0] + 0.04, x[1] - 0.04, y[0] + 0.04, y[1] - 0.04, Math.max(0.01, r - 0.03), 3), -0.005, 0.02, [], KINKS));
}

function grille(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span): void {
  // the panel's frame in the body colour, the dark louvre and its vertical slats
  m.scope("frame", () => surfacePanel(m, "blue", at, n, rect(x[0], y[0], x[1], y[1]), -0.004, 0.008, [], KINKS));
  m.scope("louvre", () => surfacePanel(m, "louvre", at, n, rect(x[0] + 0.05, y[0] + 0.05, x[1] - 0.05, y[1] - 0.05), -0.006, 0.01, [], KINKS));
  m.scope("slats", () => {
    const pitch = 0.07, count = Math.floor((x[1] - x[0] - 0.12) / pitch);
    const x0 = (x[0] + x[1]) / 2 - ((count - 1) * pitch) / 2;
    for (let i = 0; i < count; i++) surfacePanel(m, "slat", at, n, rect(x0 + i * pitch - 0.012, y[0] + 0.06, x0 + i * pitch + 0.012, y[1] - 0.06), -0.003, 0.016, [], KINKS);
  });
}

// --- the side ------------------------------------------------------------------------------------

/** The cab door, its window and handrails (x span, y). */
const DOOR: Span = [6.72, 7.32];
const DOOR_Y: Span = [1.32, 2.97];
/** The fourteen upper grilles: 0.66 m wide at a 0.995 m pitch from behind the door to the rear. */
const PITCH = 0.995;
const upper = (i: number): Span => [6.05 - 0.66 - i * PITCH, 6.05 - i * PITCH];
const UPPER_COUNT = 14;
/** The lower grilles: under the first upper one, four in the middle (under the 6th - 9th) and under the last. */
const LOWER_AT = [0, 5, 6, 7, 8, 13];
/** The cream bars at the number band's height: the rear one and the middle one (the cab's comes round the corner). */
const BARS: readonly Span[] = [[upper(12)[0] + 0.05, upper(9)[1] - 0.05], [upper(4)[0] + 0.04, upper(1)[0] + 0.3]];
/** The cab's bar ends just ahead of the door; the cab's low cream ends in a slant behind the corner. */
const CAB_BAR_END = 7.42;

/** A side x behind the corner as an arc length on the cab skin (at heights where the face is upright). */
const arcOf = (x: number, y: number) => ARC_SIDE + (tip(y) - CORNER_BACK - x);

function sideItems(m: MeshBuilder, sd: number): void {
  const at = onSide(sd);
  const n: Vec3 = [0, 0, sd];
  m.scope("upper grilles", () => { for (let i = 0; i < UPPER_COUNT; i++) m.scope(`grille ${i + 1}`, () => grille(m, at, n, upper(i), UPPER)); });
  m.scope("lower grilles", () => { for (const i of LOWER_AT) m.scope(`grille ${i + 1}`, () => grille(m, at, n, upper(i), LOWER)); });
  m.scope("cream bars", () => {
    for (const [i, x] of BARS.entries()) m.scope(`bar ${i + 1}`, () => surfacePanel(m, "cream", at, n, roundRect(x[0], x[1], NUMBER_BAND[0], NUMBER_BAND[1], 0.18, 4), 0.001, 0.003, [], KINKS));
  });
  m.scope("cab door", () => {
    const [d0, d1] = DOOR, [y0, y1] = DOOR_Y;
    m.scope("seams", () => {
      for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
        surfacePanel(m, "black", at, n, q, -0.002, 0.004, [], KINKS);
    });
    m.scope("window", () => sideWindow(m, at, n, [d0 + 0.1, d1 - 0.1], [2.36, 2.86], 0.07));
    m.scope("handrails", () => {
      // the long grab rails either side of the door
      for (const hx of [d0 - 0.08, d1 + 0.08]) {
        const z = sd * (hw(2.0) + 0.034);
        m.prism("handrail", ngon(6, 0.016, 0, hx, z), 1.2, 2.75);
        for (const hy of [1.25, 2.7]) block(m, "handrail", hx - 0.015, hx + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.04));
      }
    });
    m.scope("steps", () => {
      const w = hw(Y0);
      for (const y of [0.42, 0.75]) block(m, "steel", d0 + 0.04, d1 - 0.04, y, y + 0.04, ...side(sd, w - 0.2, w - 0.02));
      for (const hx of [d0 + 0.04, d1 - 0.08]) block(m, "steel", hx, hx + 0.04, 0.42, Y0 + 0.02, ...side(sd, w - 0.06, w - 0.02));
    });
  });
  // the "200" diamond on the name band ahead of the door
  m.scope("speed diamond", () => {
    const xc = 7.85, yc = (LOW_CREAM + NUMBER_BAND[0]) / 2, r = 0.12;
    surfacePanel(m, "yellow", at, n, [[xc, yc - r], [xc + r, yc], [xc, yc + r], [xc - r, yc]], 0.001, 0.003, [], KINKS);
  });
}

/** The cab's paint and windows that come round the corner onto the side, on side s (+1 right, -z seen from ahead is u > 0). */
function cabWrap(m: MeshBuilder, s: number): void {
  // seen from ahead the loco's right (+z) side is on the viewer's left: u < 0
  const g = -s;
  const span = (a: number, b: number): Span => (g > 0 ? [a, b] : [-b, -a]);
  const flipX = (q: Ring): Ring => (g > 0 ? q : q.map(([u, v]) => [-u, v] as [number, number]).reverse());
  m.scope("number band", () => {
    // from the corner (over the face's own cream) back to just ahead of the door, its end rounded like the bars
    const [u0, u1, r] = [1.3, arcOf(CAB_BAR_END, NUMBER_BAND[1]), 0.18];
    const [y0, y1] = NUMBER_BAND;
    const end: Ring = Array.from({ length: 7 }, (_, i) => {
      const a = -Math.PI / 2 + (Math.PI * i) / 6;
      return [u1 - r + r * Math.cos(a), (y0 + y1) / 2 + ((y1 - y0) / 2) * Math.sin(a)] as [number, number];
    });
    cabPanel(m, "cream", flipX([[u0, y0], ...end, [u0, y1]]), 0.001, 0.003);
  });
  m.scope("low cream", () => {
    // the face's cream lower part carried along the side below the side's band, its end leaning up to it
    const a = arcOf(7.95, 1.2), b = arcOf(7.35, 1.2);
    const q: Ring = [[1.3, Y0 + 0.002], [a, Y0 + 0.002], [b, SIDE_CREAM[0]], [1.3, SIDE_CREAM[0]]];
    cabPanel(m, "cream", flipX(q), 0.001, 0.003);
  });
  m.scope("corner window", () => {
    const u = span(1.38, 2.16);
    cabWindow(m, u, WINDOWS, 0.13, 0);
  });
}

// --- the cab face --------------------------------------------------------------------------------

/** The face's three windows (u seen from ahead): the wide ones either side of the narrow middle one. */
const FACE_WINDOWS: ReadonlyArray<readonly [string, Span, number]> = [
  ["window left", [-1.07, -0.31], 1], ["window middle", [-0.17, 0.35], 1], ["window right", [0.49, 1.25], -1],
];

function cabFace(m: MeshBuilder): void {
  m.scope("windows", () => { for (const [name, u, wiper] of FACE_WINDOWS) m.scope(name, () => cabWindow(m, u, WINDOWS, 0.14, wiper)); });
  for (const s of [-1, 1]) m.scope(s > 0 ? "right corner" : "left corner", () => cabWrap(m, s));
  m.scope("lamps", () => {
    for (const u of [-1.14, 1.14])
      m.scope(u < 0 ? "lamp left" : "lamp right", () => {
        const y: Span = [1.73, 1.96];
        cabPanel(m, "black", roundRect(u - 0.15, u + 0.15, y[0], y[1], 0.03), -0.01, 0.03);
        cabPanel(m, "alu", ngon(12, 0.09, 0, u, (y[0] + y[1]) / 2), 0.02, 0.04);
        cabPanel(m, "lampHead", ngon(12, 0.07, 0, u, (y[0] + y[1]) / 2), 0.03, 0.046);
      });
  });
  m.scope("lettering", () => {
    // the name in white on the blue band, the number in black on the cream band above it
    const nh = 0.14, nw = 0.072, ng = 0.028;
    const name = strokeText(NAME, -strokeWidth(NAME, nw, ng) / 2, LOW_CREAM + 0.065, nh, nw, ng, false, nh * 0.15);
    const n: Vec3 = [1, 0, 0];
    m.facets("white", name.map(([u, v]) => onCab(u, v, 0.006)), n);
    const h = 0.12, w = h * 0.55, gap = h * 0.18;
    const num = strokeText(R354_NUMBER, 0.09 - strokeWidth(R354_NUMBER, w, gap) / 2, 2.14, h, w, gap, false, h * 0.12);
    m.facets("black", num.map(([u, v]) => onCab(u, v, 0.006)), n);
  });
  // the coupling's opening in the bumper between the buffers
  m.scope("coupling recess", () => cabPanel(m, "black", roundRect(-0.34, 0.34, Y0 + 0.03, 1.4, 0.04), 0.001, 0.003));
  m.scope("handrail", () => cabPanel(m, "alu", roundRect(-0.3, 0.48, 3.08, 3.12, 0.02), 0.0, 0.05));
}

/** The lower front: the blue apron under the bumper down toward the rail, the buffers with their big rectangular heads, the hook. */
function lowerFront(m: MeshBuilder): void {
  m.scope("apron", () => {
    const back = 7.36, y0 = 0.32, y1 = Y0 + 0.01, w = 1.44;
    const pts = frontPlan(w);
    // counter-clockwise from above: from the -z side round the nose to the +z side, closed behind
    const ring: Ring = [[back, -w], ...[...pts].reverse().map(([z, b]) => [N - 0.05 - b, -z] as [number, number]), ...pts.slice(1).map(([z, b]) => [N - 0.05 - b, z] as [number, number]), [back, w]];
    // blue below, the cream bumper above it carried down round the corners
    m.prism("blue", ring, y0, 0.8, false);
    m.prism("cream", ring, 0.8, y1, false);
    m.cap("blue", ring, y0, false);
  });
  buffers(m, 1, N - 0.06, HALF, BUFFER_Y, "rect");
}

// --- the rear end --------------------------------------------------------------------------------

function rearEnd(m: MeshBuilder): void {
  const at: Place = (z, y, d) => [rearX(y) - d, y, z];
  const n: Vec3 = [-1, 0, 0];
  // the end door to the Talgo's first car, its seams, and the red tail lamps low beside the buffers
  m.scope("end door", () => {
    const [z0, z1] = [-0.35, 0.35], [y0, y1] = [1.3, 2.95];
    for (const q of [rect(z0, y0, z1, y0 + 0.02), rect(z0, y1 - 0.02, z1, y1), rect(z0, y0 + 0.02, z0 + 0.02, y1 - 0.02), rect(z1 - 0.02, y0 + 0.02, z1, y1 - 0.02)])
      surfacePanel(m, "black", at, n, q, -0.002, 0.004, [], KINKS);
  });
  m.scope("tail lamps", () => {
    for (const z of [-1.1, 1.1]) {
      surfacePanel(m, "black", at, n, ngon(12, 0.09, 0, z, 1.85), -0.01, 0.02, [], KINKS);
      surfacePanel(m, "lampRed", at, n, ngon(12, 0.065, 0, z, 1.85), 0.0, 0.035, [], KINKS);
    }
  });
  m.scope("apron", () => {
    const w = 1.44, x0 = -XR + 0.05, x1 = -7.36;
    const ring: Ring = [[x1, -w], [x0 + 0.3, -w], [x0, -w + 0.3], [x0, w - 0.3], [x0 + 0.3, w], [x1, w]];
    m.prism("blue", ring, 0.45, Y0 + 0.01, false);
    m.cap("blue", ring, 0.45, false);
  });
  buffers(m, -1, XR - 0.06, HALF, BUFFER_Y, "rect");
}

// --- roof and running gear -----------------------------------------------------------------------

/** The cab's roof hump: its foot inside the roof, the top's x span and height; the headlight pod at its front. */
const HUMP = { x0: 6.45, x1: 8.6, top: [6.62, 8.2] as Span, y0: 3.26, y1: 3.86, w0: 1.16, w1: 0.75 };

function roof(m: MeshBuilder): void {
  m.scope("hump", () => {
    const h = HUMP;
    // a box tapering inward and its front sloping back: lofted from its foot to its top
    const ring = (x0: number, x1: number, w: number): Ring => [[x1, w], [x1, -w], [x0, -w], [x0, w]];
    m.loft("hump", ring(h.x0, h.x1, h.w0), h.y0, ring(h.top[0], h.top[1], h.w1), h.y1);
    // the radiator grille over its top and the louvres in its sloped front corners
    m.prism("grille", ring(h.top[0] + 0.15, h.top[1] - 0.6, h.w1 - 0.12), h.y1 - 0.01, h.y1 + 0.012);
  });
  m.scope("headlight", () => {
    const x0 = 8.08, x1 = 8.56, y0 = 3.64, y1 = 3.99;
    m.loft("hump", [[x1, 0.3], [x1, -0.3], [x0, -0.3], [x0, 0.3]], y0, [[x1 - 0.04, 0.27], [x1 - 0.04, -0.27], [x0, -0.27], [x0, 0.27]], y1);
    for (const z of [-0.13, 0.13]) {
      const cy = (y0 + y1) / 2;
      m.sweep("alu", "x", ngon(14, 0.11, 0, z, cy), x1 - 0.06, ngon(14, 0.11, 0, z, cy), x1 + 0.03);
      m.sweep("lampHead", "x", ngon(14, 0.088, 0, z, cy), x1 + 0.03, ngon(14, 0.088, 0, z, cy), x1 + 0.045);
    }
  });
  m.scope("silencers", () => {
    // the two engines' silencers and stacks, the horns over the rear
    for (const x of [0.6, -5.4]) {
      block(m, "silencer", x - 0.45, x + 0.45, CROWN - 0.02, CROWN + 0.16, -0.3, 0.3);
      exhaust(m, x, 0, CROWN + 0.15, CROWN + 0.28, 0.16, 0.24);
    }
  });
  m.scope("horns", () => { horn(m, -1, -7.6, -0.25, CROWN + 0.13); horn(m, -1, -7.6, 0.25, CROWN + 0.13); });
}

/** Bogie centres 10.4 m apart, 3.0 m wheelbase, 1.0 m wheels. */
const PIVOT = 5.2;
const AXLE = 1.5;
const WHEEL_R = 0.5;

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const [a, b, w] = [N - 0.1, -XR + 0.1, 1.42];
    const r: Ring = [[a, -w + 0.1], [a - 0.1, -w], [b + 0.1, -w], [b, -w + 0.1], [b, w - 0.1], [b + 0.1, w], [a - 0.1, w], [a, w - 0.1]];
    m.prism("frame", r, 0.88, Y0, false);
    m.cap("underframe", r, 0.88, false);
  });
  // the blue valance between the bogies over the fuel tanks and the transmissions
  m.scope("valance", () => {
    const r: Ring = [[2.95, -1.44], [-2.95, -1.44], [-2.95, 1.44], [2.95, 1.44]];
    m.prism("blue", r, 0.45, Y0 + 0.01, false);
    m.cap("blue", r, 0.45, false);
  });
  m.scope("bogies", () => {
    for (const xc of [-PIVOT, PIVOT]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: AXLE, wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 }));
  });
}

/** The Renfe 354 in the Talgo livery. */
export function renfe354(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => m.scope("shell", () => shell(m)));
  m.scope("sides", () => { for (const sd of [-1, 1]) m.scope(sd > 0 ? "right side" : "left side", () => sideItems(m, sd)); });
  m.scope("front cab", () => { cabFace(m); lowerFront(m); });
  m.scope("rear end", () => rearEnd(m));
  m.scope("underframe", () => underframe(m));
  m.scope("roof equipment", () => roof(m));
  return m;
}

// --- the distant model ---------------------------------------------------------------------------

const lodBands = (bands: readonly Band[]): LodBand[] => bands.map(([a, b, mat]) => [a, b, mat] as const);

function body(): UnitBody {
  const ys = KINKS.filter((y) => y >= Y0 && y <= CROWN);
  return {
    y0: Y0, hw: HW, side: lodBands(SIDE), roof: "roof",
    front: { tip: ys.map((y) => [y, tip(y)] as const), setback: ys.map((y) => [y, CORNER_BACK] as const), paint: lodBands(FACE), windows: [{ u: [-1.07, 1.25], y: WINDOWS, mat: LOD_GLASS }] },
    rear: { tip: ys.map((y) => [y, rearX(y)] as const) },
    // the cab's bands carried to the door, the cream bars as a band over the middle
    cabs: [
      { x0: CAB_BAR_END, x1: N, side: lodBands(FACE) },
      { x0: BARS[1]![0], x1: BARS[1]![1], side: [[Y0, SIDE_CREAM[0], "blue"], [SIDE_CREAM[0], SIDE_CREAM[1], "cream"], [SIDE_CREAM[1], NUMBER_BAND[0], "blue"], [NUMBER_BAND[0], NUMBER_BAND[1], "cream"], [NUMBER_BAND[1], CROWN, "blue"]] },
    ],
  };
}

export function renfe354Lod(): MeshBuilder {
  const parts: LodPart[] = [
    ...[-PIVOT, PIVOT].map((xc): LodPart => ({ draw: (mm) => mm.scope("running gear", () => lodBogie(mm, xc, AXLE + WHEEL_R + 0.2, 0.88)) })),
    underPart(-2.95, 2.95, 0.45, Y0, 1.44, 50, undefined, "blue"),
    roofPart("hump", HUMP.x0, HUMP.x1, HUMP.w0, HUMP.w1, HUMP.y0, HUMP.y1),
  ];
  return fitUnit({ palette: PALETTE, bodies: [body()], parts }, 100);
}
