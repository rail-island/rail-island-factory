// China Railway's HXD1 (DJ4), the 9,600 kW eight-axle freight electric that CSR
// Zhuzhou built with Siemens from 2006 on the EuroSprinter ES64F4 platform: two
// identical single-cab Bo'Bo' sections coupled back to back by their inner ends,
// with a gangway between them. Measured from the photographs in assets/cr-hxd1/
// (SOURCES.md) and the published figures: 35.222 m over the couplers (two
// 17.611 m sections), bogie centres 9.0 m, bogie wheelbase 2.8 m, 1.25 m wheels;
// the real body is 3.247 m wide, drawn 3.1 m (the UIC gauge's limit).
//
// Each section is drawn here in its own frame - the cab at +x, the flat inner end
// at -x - and placed twice, the rear one turned, as the two sections of one
// articulated vehicle hinged at the coupler plane between them (like the Class
// 142's two cars, brClass142.ts). Its shell is lofted from the section's own
// tables: the EuroSprinter cab (the lower face upright with rounded corners, the
// two-pane windscreen raked back from the waist, the large chamfers beside it
// that narrow the face toward the roof, the roof cap sloping back over the top
// headlight), the vertical machine-room sides with louvres only on the roof's
// sloped shoulders, and the flat inner end. The original livery as delivered and
// still carried in 2023: dark blue with a silver trapezoid on each side holding
// the red "Hexie" characters and the running number, a dark grey band along the
// bottom, the face dark grey round the windscreen with a silver lamp band.
// Each section carries one single-arm pantograph near its inner end (the rear
// section's raised, as in most photographs) and a cooler box on the roof.
// See docs/models/china-trains.md "The HXD1's body".

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { tubeX } from "./cd163.ts";
import { strokeText } from "./strokeFont.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { articulate } from "./tramKit.ts";
import { KIT_PALETTE, bogie, c, insulator, kinks, lerpTable, rect, roundRect, singleArm, surfacePanel, type Place } from "./czElectricKit.ts";
import { LOD_GLASS, lodBogie, lodPantograph, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { fitUnit, roofPart, shiftBody, turnBody, underPart, type UnitBody } from "./lodUnits.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];
type Pt = readonly [number, number];

/** The running number the model carries (HXD1 0016, the side-on photograph's unit). */
export const HXD1_NUMBER = "HXD10016";

/** Half a section's length over its couplers (17.611 m, two of them 35.222 m). */
export const HXD1_HALF = 17.611 / 2;
/** The cab's lower face: the knuckle coupler's face stands 0.5 m ahead of it at HXD1_HALF. */
const N = HXD1_HALF - 0.5;
/** The flat inner end; the gangway's bellows bridges the 0.61 m between the sections. */
const XI = 8.5;
const COUPLER_Y = 0.88;

// heights (m over the rail)
const Y0 = 1.0; // the body's bottom
const BAND = 1.38; // the dark grey band's top along the sides
const WAIST = 2.78; // the windscreen's foot
const SCREEN_TOP = 3.66;
const SHOULDER = 3.38; // the side wall's top: the sloped shoulder carrying the louvres above it
const EAVE = 3.92;
const CROWN = 4.15;
const PANEL_TOP = 3.22;

/** The cab's centre line [y, local x]: the face upright to the waist, the windscreen raked back, the roof cap. */
const TIP: Table = [[Y0, N], [2.25, N], [WAIST, N - 0.06], [SCREEN_TOP, N - 0.52], [EAVE, N - 0.76], [CROWN, N - 1.02]];
/** The half width: upright sides to the shoulder, the shoulder sloping in to the eave, the roof rounding over. */
const HW: Table = [[Y0, 1.48], [SHOULDER, 1.48], [EAVE, 1.24], [4.06, 1.1], [CROWN, 0.95]];
/** The face's flat half width (the windscreens and lamps lie on it): the chamfers beside it widen above the waist. */
const FACE: Table = [[Y0, 1.24], [WAIST, 1.24], [SCREEN_TOP, 1.15], [EAVE, 0.96], [CROWN, 0.82]];
/** How far the corners stand back from the centre line at the side wall: rounded below the waist, chamfered above it. */
const CORNER: Table = [[Y0, 0.32], [WAIST, 0.32], [SCREEN_TOP, 0.62], [EAVE, 0.52], [CROWN, 0.4]];

const tip = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The cab end's plan at height y: [z, setback], the first two points the face, the last two the corner. */
function frontPlan(y: number): Pt[] {
  const w = hw(y), f = Math.min(lerpTable(FACE, y), w - 0.05), cb = lerpTable(CORNER, y);
  return [[0, 0], [f * 0.55, 0], [f, 0.03], [f + (w - f) * 0.6, cb * 0.35], [w, cb]];
}
/** The inner end's plan: flat, its corners chamfered. */
const rearPlan = (y: number): Pt[] => { const w = hw(y); return [[0, 0], [w - 0.06, 0], [w, 0.06]]; };
/** The plan's first index painted with the sides' colours (the cab's corners). */
const CORNER_FROM = 2;

/** The heights where the profiles kink: rows of the shell and of every panel on it. */
const KINKS = kinks(TIP, HW, FACE, CORNER);

// --- paint -------------------------------------------------------------------------------------

type Band = readonly [number, number, string];
const SIDE: readonly Band[] = [[Y0, BAND, "cnGrey"], [BAND, EAVE, "cnBlue"], [EAVE, CROWN, "roof"]];
const FACE_BANDS: readonly Band[] = [[Y0, 1.54, "cnGrey"], [1.54, 2.22, "cnSilver"], [2.22, CROWN, "cnFace"]];
const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y <= b) ?? bands[bands.length - 1]!)[2];

/** The silver trapezoid on each side: [x, y] corners, narrower at the top (both ends lean in). */
const PANEL: Ring = [[3.5, BAND], [2.45, PANEL_TOP], [-6.2, PANEL_TOP], [-7.25, BAND]];

const PALETTE = {
  ...KIT_PALETTE,
  cnBlue: c("#2b4f86", 0.55),
  cnSilver: c("#b9bfc3", 0.45),
  cnGrey: c("#4d5459", 0.65),
  cnFace: c("#545a61", 0.55),
  cnRed: c("#d42a2a", 0.5),
  cnWhite: c("#eef0f0", 0.5),
  roof: { color: "#5d6266", roughness: 0.75 },
  roofBox: c("#3f4448", 0.7),
  panRed: c("#b23a2a", 0.5),
  knuckle: c("#2f3134", 0.7),
  handrail: c("#c9ccce", 0.4),
  hazard: c("#e8b818", 0.5),
  black: c("#1e1f21", 0.7),
  bellows: { color: "#7a7f84", roughness: 0.9 },
};

// --- the shell ---------------------------------------------------------------------------------

type Region = "front" | "corner" | "side" | "rear";
interface RingPt { x: number; z: number; region: Region; sign: number }

/** The ring at height y, clockwise seen from above: front centre to -z, the -z side, the inner end, the +z side, back to the front centre. */
function ringAt(y: number): RingPt[] {
  const t = tip(y), fp = frontPlan(y), rp = rearPlan(y);
  const out: RingPt[] = [];
  const nf = fp.length - 1, nr = rp.length - 1;
  // the edge starting at each point
  for (let i = 0; i <= nf; i++) out.push({ x: t - fp[i]![1], z: -fp[i]![0], region: i === nf ? "side" : i >= CORNER_FROM ? "corner" : "front", sign: -1 });
  for (let i = nr; i >= 1; i--) out.push({ x: -XI + rp[i]![1], z: -rp[i]![0], region: "rear", sign: -1 });
  for (let i = 0; i <= nr; i++) out.push({ x: -XI + rp[i]![1], z: rp[i]![0], region: i === nr ? "side" : "rear", sign: 1 });
  for (let i = nf; i >= 1; i--) out.push({ x: t - fp[i]![1], z: fp[i]![0], region: i - 1 >= CORNER_FROM ? "corner" : "front", sign: 1 });
  return out;
}

function orient(m: MeshBuilder, mat: string, t: [Vec3, Vec3, Vec3], n: Vec3): void {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  if (nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0) m.tri(mat, a, b, cc);
  else m.tri(mat, a, cc, b);
}

/** Lofts the section's body between its rings; the crown capped, the bottom open over the frame. */
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
      const { region, sign } = lo[j]!;
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const mat = bandAt(region === "front" ? FACE_BANDS : SIDE, ym);
      const where = region === "front" ? "cab face" : region === "rear" ? "inner end" : region === "corner" ? `cab corner ${sign > 0 ? "right" : "left"}` : `side ${sign > 0 ? "right" : "left"}`;
      // the edge's outward normal, (-dz, dx) along the clockwise ring; the upper edge's where the lower one is a point
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
/** The setback of the cab face behind its centre line at height y, |z| from the middle. */
function setbackAt(y: number, z: number): number {
  const plan = frontPlan(y), az = Math.abs(z);
  for (let i = 1; i < plan.length; i++) {
    const [z0, b0] = plan[i - 1]!, [z1, b1] = plan[i]!;
    if (az <= z1 + 1e-9) return z1 === z0 ? b1 : b0 + ((b1 - b0) * (az - z0)) / (z1 - z0);
  }
  return plan[plan.length - 1]![1];
}
/** The point d ahead of the cab face at z (u), height y. */
const onFace: Place = (z, y, d) => [tip(y) - setbackAt(y, z) + d, y, z];
const FACE_N: Vec3 = [1, 0, 0];
/** Columns for an item on the face spanning heights y: the plan's corners at every row it crosses. */
const faceCols = (y: Span): number[] =>
  [...new Set([y[0], (y[0] + y[1]) / 2, y[1], ...KINKS.filter((h) => h > y[0] && h < y[1])].flatMap((h) => frontPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);

/** A framed window: frame, glass and an optional wiper. */
function window(m: MeshBuilder, at: Place, n: Vec3, u: Span, y: Span, r: number, uB: readonly number[], wiper = false): void {
  m.scope("frame", () => surfacePanel(m, "rubber", at, n, roundRect(u[0], u[1], y[0], y[1], r), -0.01, 0.014, uB, KINKS));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(u[0] + 0.04, u[1] - 0.04, y[0] + 0.04, y[1] - 0.04, Math.max(0.01, r - 0.03)), -0.005, 0.022, uB, KINKS));
  if (wiper) m.scope("wiper", () => {
    // parked along the pane's foot, its arm rising from the pivot at the outer corner
    const [a, b] = u[0] > 0 ? [u[1] - 0.12, u[1] - 0.12 - (u[1] - u[0]) * 0.7] : [u[0] + 0.12, u[0] + 0.12 + (u[1] - u[0]) * 0.7];
    surfacePanel(m, "rubber", at, n, rect(Math.min(a, b), y[0] + 0.08, Math.max(a, b), y[0] + 0.105), 0.02, 0.035, uB, KINKS);
  });
}

/** Thin bars along polylines in a unit cell (x right, y up), scaled to w x h at (u0, v0), as (u, v) triangles; `flip` reads toward -u. */
function glyphTris(lines: ReadonlyArray<readonly Pt[]>, u0: number, v0: number, w: number, h: number, t: number, flip: boolean): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const line of lines)
    for (let j = 1; j < line.length; j++) {
      const [ax, ay] = line[j - 1]!, [bx, by] = line[j]!;
      const p = (x: number, y: number): [number, number] => [flip ? u0 - x * w : u0 + x * w, v0 + y * h];
      const a = p(ax, ay), b = p(bx, by);
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (l < 1e-6) continue;
      const nx = (-(b[1] - a[1]) / l) * t / 2, ny = ((b[0] - a[0]) / l) * t / 2;
      // overrun the ends by half the stroke so joints close
      const ex = ((b[0] - a[0]) / l) * t / 2, ey = ((b[1] - a[1]) / l) * t / 2;
      const q: Array<[number, number]> = [[a[0] - ex - nx, a[1] - ey - ny], [b[0] + ex - nx, b[1] + ey - ny], [b[0] + ex + nx, b[1] + ey + ny], [a[0] - ex + nx, a[1] - ey + ny]];
      for (const k of [0, 1, 2, 0, 2, 3]) out.push(q[k]!);
    }
  return out;
}

/**
 * "He xie" (harmony), the characters every HXD carries, as simplified strokes in a
 * unit cell: he (the grain radical and the mouth) and xie (the speech radical and
 * the "all" over the "sun"); the same strokes as the CRH3C's face (cnCrh3c.ts).
 */
const HEXIE: ReadonlyArray<ReadonlyArray<readonly Pt[]>> = [
  [[[0.38, 0.97], [0.08, 0.88]], [[0.04, 0.7], [0.46, 0.7]], [[0.25, 0.9], [0.25, 0.0]], [[0.24, 0.62], [0.04, 0.28]], [[0.27, 0.6], [0.44, 0.42]],
    [[0.56, 0.22], [0.56, 0.76], [0.94, 0.76], [0.94, 0.22], [0.56, 0.22]]],
  [[[0.06, 0.94], [0.16, 0.84]], [[0.02, 0.62], [0.15, 0.62], [0.15, 0.08], [0.26, 0.2]],
    [[0.4, 0.98], [0.4, 0.56], [0.6, 0.62]], [[0.4, 0.78], [0.56, 0.8]], [[0.72, 0.98], [0.72, 0.6], [0.97, 0.58]], [[0.88, 0.88], [0.74, 0.8]],
    [[0.42, 0.0], [0.42, 0.44], [0.9, 0.44], [0.9, 0.0], [0.42, 0.0]], [[0.42, 0.22], [0.9, 0.22]], [[0.68, 0.52], [0.62, 0.45]]],
];

/** "He xie" and the number reading from u0 (toward -u when `flip`): the characters `h` high and `w` wide each, the number `nh` high after them. */
function hexie(u0: number, v0: number, w: number, h: number, nh: number, flip: boolean): { chars: Array<[number, number]>; number: Array<[number, number]> } {
  const sgn = flip ? -1 : 1;
  const gap = w * 0.25;
  const chars = HEXIE.flatMap((g, i) => glyphTris(g, u0 + sgn * i * (w + gap), v0, w, h, h * 0.085, flip));
  const nu = u0 + sgn * (2 * w + gap + w * 0.3);
  return { chars, number: strokeText(HXD1_NUMBER, nu, v0, nh, nh * 0.55, nh * 0.18, flip) };
}

// --- one section ---------------------------------------------------------------------------------

/** The cab side window and door (local x), measured behind the face. */
const CAB_WINDOW: Span = [N - 1.64, N - 1.12];
const CAB_DOOR: Span = [N - 2.42, N - 1.78];
const WINDOW_Y: Span = [2.84, 3.44];
const DOOR_Y: Span = [1.46, 3.44];
/** The louvre panels on each shoulder: a pair behind the cab, a pair behind the roof's cooler box. */
const LOUVRES: readonly Span[] = [[4.85, 5.95], [3.65, 4.75], [-3.75, -2.95], [-4.75, -3.85]];
const LOUVRE_Y: Span = [3.46, 3.86];
/** The roof's cooler box and the pantograph near the inner end. */
const COOLER: Span = [-2.9, -0.4];
const PANTO_X = -7.0;
const PANTO_BASE = 4.32;
const BOGIES = [-4.5, 4.5];
const WHEEL_R = 0.625;

function sideItems(m: MeshBuilder, sd: number): void {
  const at = onSide(sd);
  const n: Vec3 = [0, 0, sd];
  m.scope("panel", () => surfacePanel(m, "cnSilver", at, n, PANEL, 0.001, 0.004, [], KINKS));
  // the characters and the number read from the cab rearward on the left side, toward the cab on the right
  m.scope("lettering", () => {
    const flip = sd < 0;
    const w = 0.95, h = 0.66, nh = 0.22, v0 = 1.92;
    // mirrored about the panel's middle (-1.85 m): on the right side the group starts near the inner end
    const u0 = flip ? 0.85 : 2 * -1.85 - 0.85;
    const { chars, number } = hexie(u0, v0, w, h, nh, flip);
    m.facets("cnRed", chars.map(([u, v]) => at(u, v, 0.007)), n);
    m.facets("cnRed", number.map(([u, v]) => at(u, v, 0.007)), n);
  });
  m.scope("cab window", () => window(m, at, n, CAB_WINDOW, WINDOW_Y, 0.07, []));
  m.scope("cab door", () => {
    const [d0, d1] = CAB_DOOR, [y0, y1] = DOOR_Y;
    m.scope("seams", () => {
      for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
        surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], KINKS);
    });
    m.scope("handrails", () => {
      for (const hx of [d0 - 0.07, d1 + 0.07]) {
        const z = sd * (hw(2.0) + 0.045);
        m.prism("handrail", ngon(6, 0.018, 0, hx, z), 1.5, 3.0);
        for (const hy of [1.55, 2.95]) block(m, "handrail", hx - 0.015, hx + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.065));
      }
    });
    m.scope("steps", () => {
      const w = hw(Y0);
      for (const y of [0.42, 0.72]) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(sd, w - 0.2, w - 0.04));
      for (const hx of [d0 + 0.05, d1 - 0.09]) block(m, "steel", hx, hx + 0.04, 0.42, Y0 - 0.08, ...side(sd, w - 0.08, w - 0.04));
    });
  });
  m.scope("corner handrail", () => {
    const x = N - 0.62, z = sd * (hw(2.0) + 0.045);
    m.prism("handrail", ngon(6, 0.018, 0, x, z), 1.75, 2.75);
    for (const hy of [1.8, 2.68]) block(m, "handrail", x - 0.015, x + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.065));
  });
  m.scope("inner handrail", () => {
    const x = -XI + 0.25, z = sd * (hw(2.0) + 0.045);
    m.prism("handrail", ngon(6, 0.018, 0, x, z), 1.5, 2.6);
    for (const hy of [1.55, 2.55]) block(m, "handrail", x - 0.015, x + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.065));
  });
  // the louvres on the sloped shoulder: a dark panel and three slats each
  m.scope("louvres", () => {
    for (const [i, [x0, x1]] of LOUVRES.entries())
      m.scope(`louvre ${i + 1}`, () => {
        surfacePanel(m, "louvre", at, n, roundRect(x0, x1, LOUVRE_Y[0], LOUVRE_Y[1], 0.04), -0.006, 0.006, [], KINKS);
        for (const t of [0.28, 0.5, 0.72]) {
          const y = LOUVRE_Y[0] + t * (LOUVRE_Y[1] - LOUVRE_Y[0]);
          surfacePanel(m, "slat", at, n, rect(x0 + 0.05, y - 0.018, x1 - 0.05, y + 0.018), -0.003, 0.012, [], KINKS);
        }
      });
  });
}

/** The CR emblem: a ring with the rail's head and web standing in it, white on the face. */
function emblem(m: MeshBuilder, cy: number): void {
  const R = 0.13, r = 0.1, k = 14;
  const tris: Array<[number, number]> = [];
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * 2 * Math.PI, a1 = ((i + 1) / k) * 2 * Math.PI;
    const q: Array<[number, number]> = [[R * Math.cos(a0), cy + R * Math.sin(a0)], [R * Math.cos(a1), cy + R * Math.sin(a1)], [r * Math.cos(a1), cy + r * Math.sin(a1)], [r * Math.cos(a0), cy + r * Math.sin(a0)]];
    for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!);
  }
  tris.push(...glyphTris([[[0.2, 0.75], [0.8, 0.75]], [[0.5, 0.75], [0.5, -0.35]]], 0.1, cy - 0.07, 0.2, 0.18, 0.028, true));
  m.facets("cnWhite", tris.map(([u, v]) => onFace(u, v, 0.006)), FACE_N);
}

function cabFace(m: MeshBuilder): void {
  const n = FACE_N;
  m.scope("windscreens", () => {
    for (const [name, u] of [["left", [0.085, 1.125]], ["right", [-1.125, -0.085]]] as const)
      m.scope(`windscreen ${name}`, () => window(m, onFace, n, u, [WAIST + 0.06, SCREEN_TOP - 0.04], 0.06, faceCols([WAIST, SCREEN_TOP]), true));
  });
  m.scope("top headlight", () => {
    const y: Span = [3.7, 3.86];
    surfacePanel(m, "rim", onFace, n, roundRect(-0.22, 0.22, y[0] - 0.03, y[1] + 0.03, 0.04), -0.01, 0.02, faceCols(y), KINKS);
    surfacePanel(m, "lampHead", onFace, n, roundRect(-0.19, 0.19, y[0], y[1], 0.03), -0.005, 0.03, faceCols(y), KINKS);
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "lamps left" : "lamps right", () => {
        const u: Span = s > 0 ? [0.6, 1.1] : [-1.1, -0.6];
        const y: Span = [1.72, 2.02];
        surfacePanel(m, "rim", onFace, n, roundRect(u[0], u[1], y[0], y[1], 0.05), -0.01, 0.016, faceCols(y), KINKS);
        // the head lamp outboard, the tail lamp inboard
        const cy = (y[0] + y[1]) / 2;
        surfacePanel(m, "lampHead", onFace, n, ngon(12, 0.095, 0, s * 0.97, cy), -0.005, 0.03, faceCols(y), KINKS);
        surfacePanel(m, "lampRed", onFace, n, ngon(12, 0.085, 0, s * 0.73, cy), -0.005, 0.03, faceCols(y), KINKS);
      });
  });
  m.scope("emblem", () => emblem(m, 2.42));
  m.scope("lettering", () => {
    // seen from ahead the face reads from +z to -z
    const w = 0.24, h = 0.15, nh = 0.1;
    const chars = HEXIE.flatMap((g, i) => glyphTris(g, w + 0.03 - i * (w + 0.06), 2.0, w, h, h * 0.09, true));
    const nw = HXD1_NUMBER.length * nh * 0.55 + (HXD1_NUMBER.length - 1) * nh * 0.18;
    const number = strokeText(HXD1_NUMBER, nw / 2, 1.8, nh, nh * 0.55, nh * 0.18, true);
    m.facets("cnRed", [...chars, ...number].map(([u, v]) => onFace(u, v, 0.006)), n);
  });
}

/** The lower front under the cab: the pilot with its hazard stripes, the knuckle coupler. */
function pilot(m: MeshBuilder): void {
  const x1 = N + 0.03;
  m.scope("pilot", () => {
    // the skirt under the cab, reaching back toward the front bogie
    block(m, "cnGrey", N - 1.2, x1, 0.3, Y0 - 0.02, -1.42, 1.42);
    const at: Place = (z, y, d) => [x1 + d, y, z];
    // the yellow band and black stripes leaning over it
    surfacePanel(m, "hazard", at, FACE_N, rect(-1.4, 0.32, 1.4, 0.56), 0.0, 0.004);
    const w = 0.26, lean = 0.12;
    for (let z0 = -1.4 + w; z0 + w + lean <= 1.4; z0 += 2 * w)
      surfacePanel(m, "black", at, FACE_N, [[z0, 0.32], [z0 + w, 0.32], [z0 + w + lean, 0.56], [z0 + lean, 0.56]], 0.0, 0.008);
  });
  m.scope("coupler", () => knuckleCoupler(m, 1, x1 - 0.1, HXD1_HALF, COUPLER_Y));
}

function roof(m: MeshBuilder, raised: boolean): void {
  m.scope("cooler", () => {
    const ring = (w: number): Ring => [[COOLER[1], w], [COOLER[1], -w], [COOLER[0], -w], [COOLER[0], w]];
    m.loft("roofBox", ring(0.86), CROWN - 0.01, ring(0.76), 4.46);
    // its fan grilles on top
    for (const x of [COOLER[0] + 0.65, COOLER[1] - 0.65]) m.prism("louvre", ngon(12, 0.36, 0, x, 0), 4.459, 4.475);
  });
  m.scope("pantograph", () => singleArm(m, { xc: PANTO_X, roofY: CROWN, baseY: PANTO_BASE, h: 1, raised, armMat: "panRed" }));
  m.scope("high voltage line", () => {
    insulator(m, -7.9, 0, CROWN - 0.01, 4.42);
    insulator(m, -4.6, 0, CROWN - 0.01, 4.42);
    tubeX(m, "copper", 0.02, -7.9, 4.44, 0, PANTO_X - 0.62, 4.44, 0, 6);
    tubeX(m, "copper", 0.02, PANTO_X + 0.62, 4.44, 0, -4.6, 4.44, 0, 6);
    // the main breaker beside the pantograph
    block(m, "breaker", -4.85, -4.35, CROWN - 0.01, 4.3, -0.42, -0.18);
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const [a, b, w] = [N - 0.02, -XI + 0.02, 1.44];
    const r: Ring = [[a, -w + 0.1], [a - 0.1, -w], [b + 0.1, -w], [b, -w + 0.1], [b, w - 0.1], [b + 0.1, w], [a - 0.1, w], [a, w - 0.1]];
    m.prism("frame", r, 0.9, Y0, false);
    m.cap("frame", r, 0.9, false);
  });
  m.scope("equipment", () => {
    // the main transformer between the bogies, a tank and an air reservoir beside it
    block(m, "frame", -2.2, 2.2, 0.42, 0.905, -1.2, 1.2);
    for (const s of [-1, 1]) {
      const tank = ngon(10, 0.16, 0, s * 1.26, 0.62);
      m.sweep("cnGrey", "x", tank, -1.7, tank, 1.7);
    }
  });
  m.scope("bogies", () => {
    for (const xc of BOGIES) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: 1.4, wheelR: WHEEL_R, frameTop: 0.875 }));
  });
  m.scope("inner coupler", () => knuckleCoupler(m, -1, XI - 0.1, HXD1_HALF, COUPLER_Y));
}

/** One section in its own frame: cab at +x, centred on its couplers. */
function drawSection(m: MeshBuilder, raised: boolean): void {
  m.scope("body", () => m.scope("shell", () => shell(m)));
  m.scope("sides", () => { for (const sd of [-1, 1]) m.scope(sd > 0 ? "right side" : "left side", () => sideItems(m, sd)); });
  m.scope("cab", () => { cabFace(m); pilot(m); });
  m.scope("underframe", () => underframe(m));
  m.scope("roof equipment", () => roof(m, raised));
}

/** The gangway's bellows between the sections (z, y). */
const BELLOWS: Array<[number, number]> = [[-1.3, 1.12], [1.3, 1.12], [1.3, 3.82], [-1.3, 3.82]];
const MAX_BEND_DEG = 8;

/** The HXD1: the front section on x > 0, the rear one turned on x < 0, hinged at the coupler plane x = 0. */
export function crHxd1(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const h = HXD1_HALF;
  articulate({ m }, [
    { x0: h - XI, x1: 2 * h, draw: () => m.scope("section 1", () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, false))) },
    { x0: -2 * h, x1: -(h - XI), draw: () => m.scope("section 2", () => m.turned(0, () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, true)))) },
  ], COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, [0]);
  return m;
}

// --- the distant model ---------------------------------------------------------------------------

const lodBands = (bands: readonly Band[]): LodBand[] => bands.map(([a, b, mat]) => [a, b, mat] as const);

function sectionLod(): UnitBody {
  const tipT: Table = KINKS.filter((y) => y >= Y0 && y <= CROWN).map((y) => [y, tip(y)] as const);
  const setback: Table = KINKS.filter((y) => y >= Y0 && y <= CROWN).map((y) => [y, lerpTable(CORNER, y)] as const);
  return {
    y0: Y0, hw: HW, side: lodBands(SIDE), roof: "roof",
    front: { tip: tipT, setback, paint: lodBands(FACE_BANDS), windows: [{ u: [-1.125, 1.125], y: [WAIST + 0.06, SCREEN_TOP - 0.04], mat: LOD_GLASS }] },
    rear: { tip: [[Y0, -XI]] },
    // the silver trapezoid as a band between its ends' mid points
    cabs: [{ x0: -6.72, x1: 2.98, side: [[Y0, BAND, "cnGrey"], [BAND, PANEL_TOP, "cnSilver"], [PANEL_TOP, EAVE, "cnBlue"], [EAVE, CROWN, "roof"]] }],
  };
}

/** The section's parts besides its body, placed by `X` (local x to model x). */
function sectionParts(section: number, X: (x: number) => number, raised: boolean): LodPart[] {
  const sec = { section };
  return [
    ...BOGIES.map((xc): LodPart => ({ ...sec, draw: (m) => m.scope("running gear", () => lodBogie(m, X(xc), 1.4 + WHEEL_R + 0.2, 0.9)) })),
    underPart(X(N - 0.02), X(-XI + 0.02), 0.9, Y0, 1.44, 40, section, "frame"),
    underPart(X(-2.2), X(2.2), 0.42, 0.905, 1.2, 50, section, "frame"),
    roofPart("roofBox", X(COOLER[0]), X(COOLER[1]), 0.86, 0.76, CROWN - 0.01, 4.46, section),
    {
      ...sec, ...(raised ? {} : { optional: 0 }),
      draw: (m) => m.scope(raised ? "raised pantograph" : "folded pantograph", () => lodPantograph(m, { x: X(PANTO_X), roofY: CROWN, baseY: PANTO_BASE, h: X(1) > X(0) ? 1 : -1, raised })),
    },
  ];
}

export function crHxd1Lod(): MeshBuilder {
  const h = HXD1_HALF;
  const body = shiftBody(sectionLod(), h);
  const sections: LodSections = {
    pivots: [[0, 0, 0], [0, COUPLER_Y, 0]],
    joints: [{ sections: [0, 1], front: h - XI, rear: -(h - XI), profile: BELLOWS }],
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({
    palette: PALETTE,
    bodies: [{ ...body, section: 0 }, { ...turnBody(body, 0), section: 1 }],
    parts: [...sectionParts(0, (x) => x + h, false), ...sectionParts(1, (x) => -(x + h), true)],
    sections,
  }, 200);
}
