// China Railways' DF11 (Dongfeng 11), the 170 km/h Co-Co passenger diesel-electric that CRRC
// Qishuyan built from 1992 to 2005 (0001 - 0458 and 1898): a double-ended carbody with a cab at
// each end. Measured from the photographs in assets/cr-df11/ (SOURCES.md; heights from the
// head-on view of DF11 0441, lengths along the side from DF11 0177 by a projective fit over its
// louvre panels) and the published figures: 21.25 m over the couplers, 20.15 m over the body,
// 3.304 m wide (drawn 3.0 m, inside the UIC gauge's 3.1 m with the handrails), 4.736 m high,
// bogie wheelbase 2 x 2.0 m, 1.05 m wheels, bogie centres 11.8 m (the side photograph's
// traction brackets).
//
// The shell is lofted from the cab's own tables, the same at both ends: the lower face upright
// from the body's foot to the waist, the two-pane windscreen raked back 25 degrees above it to
// the eave, the roof cap rounding back from there over the round headlight in its pod; the
// face flat across with rounded corners; the sides upright to the eave at 3.74 m and the roof's
// sloped shoulders above, carrying the radiator louvres near the +X end and two small vents.
// The livery most photographs show (Beijing, Shanghai, Jinan, Nanchang units): cream above
// a thin dark blue line and a cream line at the waist, royal blue below with a cream stripe
// low on the body; the waist lines sweep down over the last metre to the face's lower level;
// grey roof, grey pilot with the red and white plough plate. The side carries, from the +X
// cab: cab window, door, window, louvre, large window, louvre, two small grilles, the CR
// emblem, two windows, three louvres, window, door, cab window (both sides alike).
// Metres, +X toward cab 1, wheel contact at y = 0. See docs/models/china-locos.md "The DF11's body".

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { strokeText } from "./strokeFont.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { bogieGeometry, type BogieSpec } from "./dieselParts.ts";
import { KIT_PALETTE, c, kinks, lerpTable, rect, roundRect, surfaceDecal, surfacePanel, type Place } from "./czElectricKit.ts";
import { LOD_GLASS, lodBogie, type LodBand, type LodPart, type LodRect } from "./lodKit.ts";
import { fitUnit, roofPart, underPart, type UnitBody } from "./lodUnits.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];
type Pt = readonly [number, number];

/** The running number the model carries (DF11 0010, the article's photograph). */
export const DF11_NUMBER = "0010";
/** Half the length over the couplers (21.25 m). */
export const DF11_HALF = 21.25 / 2;
/** The face's centre line at the waist: half the body's 20.15 m. */
const XT = 20.15 / 2;
const COUPLER_Y = 0.88;

// heights (m over the rail), from the head-on photograph (145 px/m)
const Y0 = 1.08; // the body's foot (the pilot below it)
const STRIPE: Span = [1.66, 1.73]; // the cream stripe low on the body
const WAIST = 2.56; // the face's blue line's top, where the windscreen's rake starts
const SCREEN: Span = [2.86, 3.66];
const EAVE = 3.74;
const CROWN = 4.47;

/** The face's centre line [y, x]: upright below the waist, raked 25 degrees to the eave, the roof cap rounding back. */
const TIP: Table = [[Y0, XT - 0.05], [1.7, XT - 0.015], [2.48, XT], [WAIST, XT], [EAVE, XT - 0.56], [3.9, XT - 0.82], [4.1, XT - 1.18], [4.3, XT - 1.62], [4.42, XT - 2.0], [CROWN, XT - 2.3]];
/** Half width: upright sides to the eave, the roof's shoulders sloping in to the flat crown. */
const HW: Table = [[Y0, 1.5], [EAVE, 1.5], [3.8, 1.48], [4.15, 1.36], [4.38, 1.16], [CROWN, 0.92]];
/** The face's flat half width; the rounded corners beside it. */
const FACE: Table = [[Y0, 1.25], [EAVE, 1.25], [4.1, 1.0], [CROWN, 0.62]];
/** How far the corners reach back behind the face at the side wall. */
const CORNER: Table = [[Y0, 0.28], [EAVE, 0.3], [4.1, 0.5], [CROWN, 0.55]];

const tip = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The cab end's plan at height y: [z, setback], from the middle to the side wall. */
function plan(y: number): Pt[] {
  const w = hw(y), f = Math.min(lerpTable(FACE, y), w - 0.05), cb = lerpTable(CORNER, y), r = w - f;
  return [[0, 0], [f * 0.5, 0], [f, 0], [f + r * 0.55, cb * 0.18], [f + r * 0.88, cb * 0.55], [w, cb]];
}
/** The plan's first index painted as the corner. */
const CORNER_FROM = 2;
const KINKS = kinks(TIP, HW, FACE, CORNER);

// --- paint -------------------------------------------------------------------------------------

type Band = readonly [number, number, string];
/** The side: the waist lines (cream under blue) at 2.63 - 2.77 m. */
const SIDE: readonly Band[] = [[Y0, STRIPE[0], "dfBlue"], [STRIPE[0], STRIPE[1], "dfCream"], [STRIPE[1], 2.63, "dfBlue"], [2.63, 2.7, "dfCream"], [2.7, 2.77, "dfBlue"], [2.77, EAVE, "dfCream"], [EAVE, CROWN, "roof"]];
/** The face and its corners: the waist lines 0.22 m lower, at 2.41 - 2.56 m. */
const FACE_BANDS: readonly Band[] = [[Y0, STRIPE[0], "dfBlue"], [STRIPE[0], STRIPE[1], "dfCream"], [STRIPE[1], 2.41, "dfBlue"], [2.41, 2.48, "dfCream"], [2.48, WAIST, "dfBlue"], [WAIST, EAVE, "dfCream"], [EAVE, CROWN, "roof"]];
const SWEEP_DROP = 0.22;
/** The sweep runs from this far behind the face to the corner. */
const SWEEP_FROM = 1.1;
const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y <= b) ?? bands[bands.length - 1]!)[2];

const PALETTE = {
  ...KIT_PALETTE,
  dfBlue: c("#123a8e", 0.45),
  dfCream: c("#e6dac0", 0.5),
  roof: { color: "#66696b", roughness: 0.75 },
  pilot: c("#7a8590", 0.6),
  bogie: c("#5f6a73", 0.7),
  underframe: c("#3a3e42", 0.8),
  tank: c("#7b8288", 0.65),
  plate: c("#c4262a", 0.5),
  white: c("#f2f2ee", 0.5),
  plough: c("#f2f0ea", 0.5),
  ploughRed: c("#c42a2c", 0.5),
  knuckle: c("#2f3134", 0.7),
  handrail: c("#c9ccce", 0.4),
  hose: c("#1d1d1f", 0.8),
  horn: c("#9aa0a6", 0.4),
  black: c("#1e1f21", 0.7),
  grilleBrown: c("#6e5a44", 0.8),
};

// --- the shell ---------------------------------------------------------------------------------

type Region = "face" | "corner" | "side";
interface RingPt { x: number; z: number; region: Region; end: number; sign: number }

/** The ring at height y, clockwise from above: +X face centre to -z, the -z side, the -X face, the +z side. */
function ringAt(y: number): RingPt[] {
  const t = tip(y), p = plan(y), n = p.length - 1;
  const out: RingPt[] = [];
  const region = (i: number): Region => (i >= n ? "side" : i >= CORNER_FROM ? "corner" : "face");
  for (let i = 0; i <= n; i++) out.push({ x: t - p[i]![1], z: -p[i]![0], region: region(i), end: 1, sign: -1 });
  for (let i = n; i >= 1; i--) out.push({ x: -(t - p[i]![1]), z: -p[i]![0], region: i === n ? "corner" : region(i - 1), end: -1, sign: -1 });
  for (let i = 0; i <= n; i++) out.push({ x: -(t - p[i]![1]), z: p[i]![0], region: region(i), end: -1, sign: 1 });
  for (let i = n; i >= 1; i--) out.push({ x: t - p[i]![1], z: p[i]![0], region: i === n ? "corner" : region(i - 1), end: 1, sign: 1 });
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
  for (const bands of [SIDE, FACE_BANDS]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y0 && h < CROWN) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  const groups = new Map<string, Array<{ mat: string; t: [Vec3, Vec3, Vec3]; n: Vec3 }>>();
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [ringAt(ya), ringAt(yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const { region, sign, end } = lo[j]!;
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const mat = bandAt(region === "side" ? SIDE : FACE_BANDS, ym);
      const cab = end > 0 ? "cab 1" : "cab 2";
      const where = region === "side" ? `side ${sign > 0 ? "right" : "left"}` : region === "face" ? `${cab} face` : `${cab} corner ${sign > 0 ? "right" : "left"}`;
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
function setbackAt(y: number, z: number): number {
  const p = plan(y), az = Math.abs(z);
  for (let i = 1; i < p.length; i++) {
    const [z0, b0] = p[i - 1]!, [z1, b1] = p[i]!;
    if (az <= z1 + 1e-9) return z1 === z0 ? b1 : b0 + ((b1 - b0) * (az - z0)) / (z1 - z0);
  }
  return p[p.length - 1]![1];
}
/** The point d ahead of the +X face at z (u), height y (the -X end is drawn turned). */
const onFace: Place = (z, y, d) => [tip(y) - setbackAt(y, z) + d, y, z];
const FACE_N: Vec3 = [1, 0, 0];
const faceCols = (y: Span): number[] =>
  [...new Set([y[0], (y[0] + y[1]) / 2, y[1], ...KINKS.filter((h) => h > y[0] && h < y[1])].flatMap((h) => plan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);

/** A framed window: a rubber frame, the glass and an optional wiper parked along its foot. */
function window(m: MeshBuilder, at: Place, n: Vec3, poly: Ring, inner: Ring, uB: readonly number[], wiper?: Span): void {
  m.scope("frame", () => surfacePanel(m, "rubber", at, n, poly, -0.01, 0.014, uB, KINKS));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, inner, -0.005, 0.022, uB, KINKS));
  if (wiper) m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(Math.min(...wiper), SCREEN[0] + 0.08, Math.max(...wiper), SCREEN[0] + 0.105), 0.02, 0.035, uB, KINKS));
}

// --- the sides ---------------------------------------------------------------------------------

/** Distances behind the +X face (m), from DF11 0177's side by the projective fit; the same at the -X end mirrored where noted. */
const X = (d: number) => XT - d;
const WINDOW_Y: Span = [2.86, 3.52];
const CAB_WINDOW = { front: [0.42, 0.2] as const, rear: 0.92, y: [2.88, 3.56] as const };
const CAB_DOOR: Span = [1.03, 1.58];
const DOOR_Y: Span = [1.12, 3.62];
/** Windows [d0, d1] behind the +X face. */
const WINDOWS: readonly Span[] = [[2.07, 2.48], [4.3, 4.95], [10.05, 10.51], [11.27, 11.92], [17.21, 17.72]];
/** The two small grilles (brown, square). */
const GRILLES: readonly Span[] = [[7.7, 8.13], [9.09, 9.54]];
const GRILLE_Y: Span = [2.95, 3.45];
/** The louvre panels: their upper part in the cream, their lower part in the blue. */
const LOUVRES: readonly Span[] = [[2.69, 3.84], [5.51, 6.71], [12.84, 14.14], [14.31, 15.58], [15.75, 17.0]];
const LOUVRE_UP: Span = [2.84, 3.56];
const LOUVRE_LO: Span = [1.8, 2.58];
const EMBLEM_D = 9.75;

/** The sweep's drop at x (0 behind SWEEP_FROM, SWEEP_DROP at the corner), for the +X end. */
function drop(d: number, cb: number): number {
  const t = Math.min(1, Math.max(0, (SWEEP_FROM - d) / (SWEEP_FROM - cb)));
  return SWEEP_DROP * (1 - Math.cos(Math.PI * t)) / 2;
}

function louvre(m: MeshBuilder, at: Place, n: Vec3, x0: number, x1: number, y: Span, slatMat: string): void {
  surfacePanel(m, "louvre", at, n, rect(x0, y[0], x1, y[1]), -0.008, 0.004, [], KINKS);
  const k = Math.round((y[1] - y[0]) / 0.085);
  for (let i = 0; i < k; i++) {
    const v = y[0] + ((i + 0.5) / k) * (y[1] - y[0]);
    surfacePanel(m, slatMat, at, n, rect(x0 + 0.03, v - 0.022, x1 - 0.03, v + 0.012), -0.004, 0.012, [], KINKS);
  }
}

/** The China Railway emblem: a ring round a rail's section under a person's two strokes, white. */
function emblemTris(cu: number, cv: number, r: number): Array<[number, number]> {
  const tris: Array<[number, number]> = [];
  const k = 12, ri = r * 0.78;
  for (let i = 0; i < k; i++) {
    // the ring open at its foot, where the rail stands
    const a0 = -Math.PI / 2 + 0.45 + (i / k) * (2 * Math.PI - 0.9), a1 = -Math.PI / 2 + 0.45 + ((i + 1) / k) * (2 * Math.PI - 0.9);
    const q: Array<[number, number]> = [[cu + r * Math.cos(a0), cv + r * Math.sin(a0)], [cu + r * Math.cos(a1), cv + r * Math.sin(a1)], [cu + ri * Math.cos(a1), cv + ri * Math.sin(a1)], [cu + ri * Math.cos(a0), cv + ri * Math.sin(a0)]];
    for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!);
  }
  const box = (u0: number, v0: number, u1: number, v1: number) => { const q: Array<[number, number]> = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]]; for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!); };
  // the rail: head, web and foot, standing out of the ring's gap
  box(cu - r * 0.32, cv + r * 0.05, cu + r * 0.32, cv + r * 0.3);
  box(cu - r * 0.1, cv - r * 0.95, cu + r * 0.1, cv + r * 0.05);
  box(cu - r * 0.45, cv - r * 1.15, cu + r * 0.45, cv - r * 0.95);
  return tris;
}

/** "DF11 0010" with the class's 11 small and low, as the plates show it, centred at (u, v), reading toward +u (or -u when flipped). */
function plateText(u: number, v: number, h: number, flip: boolean): Array<[number, number]> {
  const w = h * 0.55, gap = h * 0.16, hs = h * 0.6, ws = hs * 0.55, gs = hs * 0.15;
  const wDF = 2 * w + gap, w11 = 2 * ws + gs, wNum = DF11_NUMBER.length * w + (DF11_NUMBER.length - 1) * gap;
  const total = wDF + gap + w11 + gap * 1.5 + wNum;
  const sg = flip ? -1 : 1;
  const u0 = u - (sg * total) / 2;
  const v0 = v - h / 2;
  return [
    ...strokeText("DF", u0, v0, h, w, gap, flip, h * 0.16),
    ...strokeText("11", u0 + sg * (wDF + gap * 0.6), v0, hs, ws, gs, flip, hs * 0.16),
    ...strokeText(DF11_NUMBER, u0 + sg * (wDF + gap * 0.6 + w11 + gap * 1.5), v0, h, w, gap, flip, h * 0.16),
  ];
}

function sideItems(m: MeshBuilder, sd: number): void {
  const at = onSide(sd);
  const n: Vec3 = [0, 0, sd];
  // the waist lines sweeping down to the face's level at both ends
  m.scope("sweeps", () => {
    for (const e of [1, -1]) {
      const cb = lerpTable(CORNER, 2.6);
      const steps = 6;
      const fill: Ring[] = [], blue: Ring[] = [], cream: Ring[] = [];
      for (let i = 0; i < steps; i++) {
        const d0 = SWEEP_FROM - ((SWEEP_FROM - cb) * i) / steps, d1 = SWEEP_FROM - ((SWEEP_FROM - cb) * (i + 1)) / steps;
        const [s0, s1] = [drop(d0, cb), drop(d1, cb)];
        const [xa, xb] = [e * X(d0), e * X(d1)];
        const quad = (lo0: number, hi0: number, lo1: number, hi1: number): Ring => (xa < xb ? [[xa, lo0], [xb, lo1], [xb, hi1], [xa, hi0]] : [[xb, lo1], [xa, lo0], [xa, hi0], [xb, hi1]]);
        if (s0 > 1e-4 || s1 > 1e-4) fill.push(quad(2.77 - s0, 2.775, 2.77 - s1, 2.775));
        blue.push(quad(2.7 - s0, 2.77 - s0, 2.7 - s1, 2.77 - s1));
        cream.push(quad(2.63 - s0, 2.7 - s0, 2.63 - s1, 2.7 - s1));
      }
      surfaceDecal(m, "dfCream", at, n, fill, 0.003);
      surfaceDecal(m, "dfBlue", at, n, blue, 0.003);
      surfaceDecal(m, "dfCream", at, n, cream, 0.003);
    }
  });
  m.scope("windows", () => {
    // the same layout on both sides, read from the +X end
    for (const [d0, d1] of WINDOWS) {
        const [x0, x1] = [X(d1), X(d0)];
        window(m, at, n, roundRect(x0, x1, WINDOW_Y[0], WINDOW_Y[1], 0.09), roundRect(x0 + 0.04, x1 - 0.04, WINDOW_Y[0] + 0.04, WINDOW_Y[1] - 0.04, 0.06), []);
      }
  });
  m.scope("grilles", () => {
    for (const [d0, d1] of GRILLES) {
      const [x0, x1] = [X(d1), X(d0)];
      surfacePanel(m, "rubber", at, n, rect(x0, GRILLE_Y[0], x1, GRILLE_Y[1]), -0.006, 0.008, [], KINKS);
      surfacePanel(m, "grilleBrown", at, n, rect(x0 + 0.03, GRILLE_Y[0] + 0.03, x1 - 0.03, GRILLE_Y[1] - 0.03), -0.004, 0.012, [], KINKS);
    }
  });
  m.scope("louvres", () => {
    for (const [i, [d0, d1]] of LOUVRES.entries())
      m.scope(`louvre ${i + 1}`, () => {
        louvre(m, at, n, X(d1), X(d0), LOUVRE_UP, "dfCream");
        louvre(m, at, n, X(d1), X(d0), LOUVRE_LO, "dfBlue");
      });
  });
  m.scope("emblem", () => {
    const flip = sd < 0;
    const tris = emblemTris(X(EMBLEM_D), 2.28, 0.17).map(([u, v]) => at(flip ? 2 * X(EMBLEM_D) - u : u, v, 0.004));
    m.facets("white", tris, n);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "cab 1" : "cab 2", () => {
      const xe = (d: number) => e * X(d);
      const span = (d0: number, d1: number): [number, number] => { const [a, b] = [xe(d0), xe(d1)]; return [Math.min(a, b), Math.max(a, b)]; };
      m.scope("cab window", () => {
        const { front: [ft, fb], rear, y } = CAB_WINDOW;
        const pts: Ring = [[xe(rear), y[0]], [xe(fb), y[0]], [xe(ft), y[1]], [xe(rear), y[1]]];
        const poly: Ring = e > 0 ? pts : [pts[1]!, pts[0]!, pts[3]!, pts[2]!];
        const inset = (q: Ring): Ring => {
          const cx = q.reduce((s, p) => s + p[0], 0) / 4, cy = q.reduce((s, p) => s + p[1], 0) / 4;
          return q.map(([u, v]) => [u + Math.sign(cx - u) * 0.045, v + Math.sign(cy - v) * 0.045] as [number, number]);
        };
        window(m, at, n, poly, inset(poly), []);
      });
      m.scope("cab door", () => {
        const [d0, d1] = span(CAB_DOOR[0], CAB_DOOR[1]);
        const [y0, y1] = DOOR_Y;
        m.scope("seams", () => {
          for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
            surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], KINKS);
        });
        const wy: Span = [2.92, 3.54];
        window(m, at, n, roundRect(d0 + 0.07, d1 - 0.07, wy[0], wy[1], 0.08), roundRect(d0 + 0.11, d1 - 0.11, wy[0] + 0.04, wy[1] - 0.04, 0.05), []);
        m.scope("handrails", () => {
          for (const hx of [d0 - 0.06, d1 + 0.06]) {
            const z = sd * (hw(2.0) + 0.035);
            m.prism("handrail", ngon(6, 0.016, 0, hx, z), 1.25, 3.05);
            for (const hy of [1.3, 3.0]) block(m, "handrail", hx - 0.014, hx + 0.014, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.05));
          }
        });
        m.scope("steps", () => {
          const w = hw(Y0);
          for (const y of [0.45, 0.78]) block(m, "steel", d0 + 0.04, d1 - 0.04, y, y + 0.04, ...side(sd, w - 0.22, w - 0.04));
          for (const hx of [d0 + 0.04, d1 - 0.08]) block(m, "steel", hx, hx + 0.04, 0.45, Y0 - 0.02, ...side(sd, w - 0.08, w - 0.04));
        });
      });
      m.scope("number plate", () => {
        const [u0, u1] = span(0.28, 0.76);
        surfacePanel(m, "plate", at, n, rect(u0, 2.18, u1, 2.33), 0, 0.008, [], KINKS);
        // the plate reads toward the cab on the right side, away from it on the left (seen from outside)
        const flip = sd < 0;
        m.facets("white", plateText((u0 + u1) / 2, 2.255, 0.09, flip).map(([u, v]) => at(u, v, 0.01)), n);
      });
    });
}

// --- the cab ends --------------------------------------------------------------------------------

/** One cab's face, pilot and roof fittings, drawn at +X (the -X end turned). */
function cabEnd(m: MeshBuilder): void {
  const n = FACE_N;
  m.scope("windscreens", () => {
    for (const [name, u] of [["left", [0.05, 1.245]], ["right", [-1.245, -0.05]]] as const) {
      const [a, b] = u;
      const outer = a > 0 ? b : a;
      m.scope(`windscreen ${name}`, () => {
        const wiper: Span = outer > 0 ? [b - 0.15, b - 0.15 - 0.7] : [a + 0.15, a + 0.15 + 0.7];
        window(m, onFace, n, roundRect(a, b, SCREEN[0], SCREEN[1], 0.06), roundRect(a + 0.06, b - 0.06, SCREEN[0] + 0.06, SCREEN[1] - 0.06, 0.04), faceCols(SCREEN), wiper);
      });
    }
  });
  m.scope("handrail", () => {
    const y = 2.66, x = tip(y) + 0.07;
    m.rod("handrail", [x, y, -1.02], [x, y, 1.02], 0.016, 6);
    for (const z of [-1.0, -0.5, 0, 0.5, 1.0]) block(m, "handrail", tip(y) - 0.02, x, y - 0.012, y + 0.012, z - 0.015, z + 0.015);
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "lamps left" : "lamps right", () => {
        const u: Span = s > 0 ? [0.68, 1.2] : [-1.2, -0.68];
        const y: Span = [2.12, 2.4];
        const cy = (y[0] + y[1]) / 2;
        surfacePanel(m, "black", onFace, n, roundRect(u[0], u[1], y[0], y[1], 0.03), -0.01, 0.006, faceCols(y), KINKS);
        surfacePanel(m, "rim", onFace, n, ngon(10, 0.1, 0, s * 1.05, cy), -0.004, 0.02, faceCols(y), KINKS);
        surfacePanel(m, "lampHead", onFace, n, ngon(10, 0.08, 0, s * 1.05, cy), 0, 0.028, faceCols(y), KINKS);
        surfacePanel(m, "rim", onFace, n, ngon(10, 0.1, 0, s * 0.8, cy), -0.004, 0.02, faceCols(y), KINKS);
        surfacePanel(m, "lampRed", onFace, n, ngon(10, 0.08, 0, s * 0.8, cy), 0, 0.028, faceCols(y), KINKS);
      });
  });
  m.scope("number plate", () => {
    const y: Span = [2.15, 2.35];
    surfacePanel(m, "plate", onFace, n, rect(-0.43, y[0], 0.43, y[1]), 0, 0.01, faceCols(y), KINKS);
    // seen from ahead the face reads from +z to -z
    m.facets("white", plateText(0, 2.25, 0.13, true).map(([u, v]) => onFace(u, v, 0.013)), n);
  });
  m.scope("grab bar", () => {
    const y = 1.56, x = tip(y) + 0.06;
    m.rod("handrail", [x, y, -0.95], [x, y, 0.95], 0.016, 6);
    for (const z of [-0.95, 0.95]) block(m, "handrail", tip(y) - 0.03, x, y - 0.012, y + 0.012, z - 0.015, z + 0.015);
  });
  pilot(m);
  m.scope("headlight", () => {
    // the pod on the roof cap's middle: a rounded housing reaching back into the roof, the lamp in its face
    // its face just behind the eave's lip (DF11 0385), the lamp 0.37 m across, centred 4.2 m up
    const xf = tip(3.98) + 0.05, xb = tip(4.4) - 0.3, yc = 4.2, r = 0.28;
    const pod: Ring = [[-r, yc - 0.24], [r, yc - 0.24], [r, yc + 0.12], [r * 0.6, yc + 0.25], [-r * 0.6, yc + 0.25], [-r, yc + 0.12]];
    m.sweep("roof", "x", pod, xb, pod, xf);
    m.sweep("black", "x", ngon(14, 0.215, 0, 0, yc), xf - 0.02, ngon(14, 0.215, 0, 0, yc), xf + 0.03);
    m.sweep("lampHead", "x", ngon(14, 0.18, 0, 0, yc), xf + 0.03, ngon(14, 0.18, 0, 0, yc), xf + 0.045);
  });
  m.scope("horns", () => {
    for (const [z, l] of [[0.42, 0.34], [-0.42, 0.26]] as const) {
      const x = tip(CROWN) - 0.25;
      m.prism("horn", ngon(6, 0.03, 0, x, z), CROWN - 0.01, 4.56);
      const bell = ngon(8, 0.055, 0, z, 4.6);
      m.sweep("horn", "x", ngon(8, 0.03, 0, z, 4.6), x - l, bell, x + 0.08);
    }
  });
}

/** The signed area of a (u, v) outline. */
const area = (q: Ring): number => q.reduce((a, p, i) => { const r = q[(i + 1) % q.length]!; return a + (p[0] * r[1] - r[0] * p[1]) / 2; }, 0);
/** `subject` clipped to the convex, counter-clockwise `clip` (Sutherland-Hodgman). */
function clipConvex(subject: Ring, clip: Ring): Ring {
  let out: Ring = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const [a, b] = [clip[i]!, clip[(i + 1) % clip.length]!];
    const inside = (p: readonly [number, number]) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-9;
    const cut = (p: readonly [number, number], q: readonly [number, number]): [number, number] => {
      const d1 = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]), d2 = (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
      const t = d1 / (d1 - d2);
      return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
    };
    const next: Array<[number, number]> = [];
    for (let j = 0; j < out.length; j++) {
      const [p, q] = [out[j]!, out[(j + 1) % out.length]!];
      if (inside(p)) { next.push([p[0], p[1]]); if (!inside(q)) next.push(cut(p, q)); }
      else if (inside(q)) next.push(cut(p, q));
    }
    out = next;
  }
  return out;
}

/** The pilot under the face: the grey box with its slots, the red and white plough plate, the coupler and the hoses. */
function pilot(m: MeshBuilder): void {
  const xf = XT - 0.02;
  m.scope("pilot", () => {
    // the box under the cab, its side's rear edge sloping back to the bogie
    const w = 1.38;
    const sec: Ring = [[xf - 1.35, Y0 - 0.005], [xf, Y0 - 0.005], [xf + 0.1, 0.55], [xf - 0.75, 0.55]];
    m.sweep("pilot", "z", sec, -w, sec, w);
    // the plough plate, leaning forward at its foot, striped red and white in a chevron
    const top = 0.55, foot = 0.14, xt = xf + 0.1, xb = xf + 0.36;
    const wt = 1.36;
    const at: Place = (z, y, d) => {
      const t = (top - y) / (top - foot);
      return [xt + (xb - xt) * t + d * 0.85, y + d * 0.5, z];
    };
    const pn: Vec3 = [0.85, 0.5, 0];
    // the plate: a gable, its apex under the coupler, its eaves low at the outer corners (DF11 0441)
    const apex = 0.53, eave = 0.2, half = 1.22;
    const plate: Ring = [[-half, foot], [half, foot], [half, eave], [0, apex], [-half, eave]];
    m.scope("plough", () => {
      const prof: Ring = [[xt, top], [xb, foot], [xb - 0.06, foot - 0.02], [xt - 0.1, top - 0.04]];
      m.sweep("pilot", "z", prof, -wt, prof, wt);
      surfacePanel(m, "plough", at, pn, plate, 0, 0.006);
      // red chevrons parallel to the gable, each side a band clipped to the plate
      const slope = (apex - eave) / half;
      const stripes: Ring[] = [];
      for (let k = 0; k < 4; k++) {
        const o0 = 0.05 + k * 0.13, o1 = o0 + 0.065;
        for (const s of [-1, 1]) {
          // the band between the lines y = apex - slope|z| - o, on side s
          const band: Ring = [[0, apex - o1], [s * half, apex - slope * half - o1], [s * half, apex - slope * half - o0], [0, apex - o0]];
          let poly = clipConvex(band, plate);
          if (poly.length < 3) continue;
          if (s < 0) poly = [...poly].reverse();
          if (Math.abs(area(poly)) > 1e-3) stripes.push(poly);
        }
      }
      surfaceDecal(m, "ploughRed", at, pn, stripes, 0.009);
      // the slots in its grey shoulders above the plate
      for (const z of [-1.1, -0.86, 0.86, 1.1]) surfacePanel(m, "black", at, pn, rect(z - 0.035, 0.36, z + 0.035, 0.52), -0.004, 0.006);
    });
  });
  m.scope("coupler", () => knuckleCoupler(m, 1, xf - 0.2, DF11_HALF, COUPLER_Y));
  m.scope("hoses", () => {
    for (const z of [-0.62, -0.38, 0.38, 0.62]) {
      const x = xf + 0.12;
      m.rod("hose", [x, 0.98, z], [x + 0.1, 0.62, z * 0.9], 0.03, 4);
      block(m, "ploughRed", x - 0.03, x + 0.05, 0.98, 1.03, z - 0.03, z + 0.03);
    }
  });
}

// --- the roof ----------------------------------------------------------------------------------

/** The radiator louvres on both shoulders near the +X end: foot and head spans behind the face. */
const RADIATOR = { foot: [4.2, 6.3] as Span, head: [4.6, 6.6] as Span, y: [3.8, 4.36] as Span };
/** Small louvred vents on the shoulders. */
const VENTS: readonly Span[] = [[12.3, 12.75], [17.8, 18.3]];
/** The roof's boxes: the exhaust's silencer and the second hatch box, [d0, d1, half width, height over the crown]. */
const ROOF_BOXES: ReadonlyArray<readonly [number, number, number, number]> = [[8.5, 10.0, 0.5, 0.2], [12.8, 13.8, 0.38, 0.17]];
/** Roof hatch plates along the crown. */
const HATCHES: readonly Span[] = [[2.6, 8.2], [10.3, 12.5], [14.1, 17.6]];

function roofItems(m: MeshBuilder): void {
  m.scope("radiator louvres", () => {
    for (const sd of [-1, 1]) {
      const at = onSide(sd), n: Vec3 = [0, 0, sd];
      const [y0, y1] = RADIATOR.y;
      const lean = (y: number, i: 0 | 1) => X(RADIATOR.foot[i] + ((RADIATOR.head[i] - RADIATOR.foot[i]) * (y - y0)) / (y1 - y0));
      const poly: Ring = [[lean(y0, 1), y0], [lean(y0, 0), y0], [lean(y1, 0), y1], [lean(y1, 1), y1]];
      surfacePanel(m, "louvre", at, n, poly, -0.01, 0.004, [], KINKS);
      const k = 8;
      for (let i = 0; i < k; i++) {
        const v = y0 + ((i + 0.5) / k) * (y1 - y0);
        const [va, vb] = [v - 0.022, v + 0.012];
        surfacePanel(m, "roof", at, n, [[lean(va, 1) + 0.03, va], [lean(va, 0) - 0.03, va], [lean(vb, 0) - 0.03, vb], [lean(vb, 1) + 0.03, vb]], -0.004, 0.014, [], KINKS);
      }
    }
  });
  m.scope("vents", () => {
    for (const sd of [-1, 1])
      for (const [d0, d1] of VENTS) {
        const at = onSide(sd), n: Vec3 = [0, 0, sd];
        surfacePanel(m, "louvre", at, n, rect(X(d1), 3.86, X(d0), 4.22), -0.008, 0.004, [], KINKS);
        for (const v of [3.94, 4.04, 4.14]) surfacePanel(m, "roof", at, n, rect(X(d1) + 0.04, v - 0.02, X(d0) - 0.04, v + 0.012), -0.004, 0.012, [], KINKS);
      }
  });
  m.scope("hatches", () => {
    for (const [d0, d1] of HATCHES) block(m, "roof", X(d1), X(d0), CROWN - 0.01, CROWN + 0.025, -0.8, 0.8);
  });
  m.scope("roof boxes", () => {
    for (const [i, [d0, d1, w, h]] of ROOF_BOXES.entries()) {
      const ring = (ww: number): Ring => [[X(d0), ww], [X(d0), -ww], [X(d1), -ww], [X(d1), ww]];
      m.loft("underframe", ring(w), CROWN + 0.02, ring(w - 0.06), CROWN + h);
      if (i === 0) m.prism("black", [[X(d0) - 0.3, 0.22], [X(d0) - 0.3, -0.22], [X(d1) + 0.3, -0.22], [X(d1) + 0.3, 0.22]], CROWN + h - 0.001, CROWN + h + 0.005);
    }
  });
}

// --- the underframe ----------------------------------------------------------------------------

const BOGIE_CENTRE = 11.8 / 2;
const BOGIE: BogieSpec = {
  axles: [-2.0, 0, 2.0], wheelR: 0.525, frameHalf: 2.65, frameTop: 0.94, frameBottom: 0.64,
  frameZ: [0.92, 1.08], primary: "coil", secondary: [-0.75, 0.75], secondaryZ: 1.12, bolster: Y0 - 0.06,
};

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const [a, w] = [XT - 1.3, 1.44];
    const r: Ring = [[a, -w], [-a, -w], [-a, w], [a, w]];
    m.prism("underframe", r, Y0 - 0.1, Y0 + 0.02, false);
    m.cap("underframe", r, Y0 - 0.1, false);
  });
  m.scope("fuel tank", () => {
    block(m, "tank", -2.2, 2.2, 0.44, Y0 - 0.1, -1.3, 1.3);
    // its ribs
    for (const x of [-1.5, -0.5, 0.5, 1.5]) for (const sd of [-1, 1]) block(m, "tank", x - 0.04, x + 0.04, 0.48, Y0 - 0.14, ...side(sd, 1.3, 1.34));
  });
  m.scope("air reservoirs", () => {
    for (const e of [-1, 1]) for (const sd of [-1, 1]) {
      const r = ngon(10, 0.2, 0, sd * 1.12, 0.66);
      m.sweep("tank", "x", r, e > 0 ? 2.3 : -3.0, r, e > 0 ? 3.0 : -2.3);
    }
  });
  m.scope("bogies", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => m.bogie(() => bogieGeometry(m, e * BOGIE_CENTRE, BOGIE)));
  });
  m.scope("traction brackets", () => {
    for (const e of [1, -1]) for (const sd of [-1, 1]) {
      const x = e * (BOGIE_CENTRE + 0.3);
      m.sweep("pilot", "z", [[x - 0.32, Y0 - 0.02], [x + 0.32, Y0 - 0.02], [x + 0.1, 0.62], [x - 0.1, 0.62]], sd > 0 ? 1.2 : -1.3, [[x - 0.32, Y0 - 0.02], [x + 0.32, Y0 - 0.02], [x + 0.1, 0.62], [x - 0.1, 0.62]], sd > 0 ? 1.3 : -1.2);
    }
  });
}

/** The DF11 0010 as photographed in the 2010s: blue and cream, both cabs alike. */
export function buildDf11(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("body", () => m.scope("shell", () => shell(m)));
  m.scope("sides", () => { for (const sd of [-1, 1]) m.scope(sd > 0 ? "right side" : "left side", () => sideItems(m, sd)); });
  m.scope("cab 1", () => cabEnd(m));
  m.scope("cab 2", () => m.turned(0, () => cabEnd(m)));
  m.scope("roof equipment", () => roofItems(m));
  m.scope("underframe", () => underframe(m));
  return m;
}

// --- the distant model ---------------------------------------------------------------------------

const lodBands = (bands: readonly Band[]): LodBand[] => bands.map(([a, b, mat]) => [a, b, mat] as const);

export function buildDf11Lod(): MeshBuilder {
  const ys = KINKS.filter((y) => y >= Y0 && y <= CROWN);
  const tipT: Table = ys.map((y) => [y, tip(y)] as const);
  const setback: Table = ys.map((y) => [y, lerpTable(CORNER, y)] as const);
  const screens: LodRect[] = [{ u: [-1.245, 1.245], y: [SCREEN[0] + 0.04, SCREEN[1] - 0.04], mat: LOD_GLASS }];
  const sideGlass: LodRect[] = [{ u: [X(0.92), X(0.3)], y: [2.92, 3.5], mat: LOD_GLASS, mirror: true }];
  const body: UnitBody = {
    y0: Y0, hw: HW, side: lodBands(SIDE), roof: "roof",
    front: { tip: tipT, setback, paint: lodBands(FACE_BANDS), windows: screens },
    rear: { tip: tipT.map(([y, x]) => [y, -x] as const), setback, paint: lodBands(FACE_BANDS), windows: screens },
    windows: sideGlass,
  };
  const parts: LodPart[] = [
    ...[1, -1].map((e): LodPart => ({ draw: (m) => m.scope("running gear", () => lodBogie(m, e * BOGIE_CENTRE, 2.0 + 0.525 + 0.15, 0.94)) })),
    // dropped first when the budget is short: the tank between the bogies, the exhaust box
    underPart(-2.2, 2.2, 0.44, Y0, 1.3, 20, undefined, "tank"),
    roofPart("underframe", X(ROOF_BOXES[0]![1]), X(ROOF_BOXES[0]![0]), 0.5, 0.44, CROWN, CROWN + 0.2),
  ];
  return fitUnit({ palette: PALETTE, bodies: [body], parts }, 100);
}
