// China Railway's HXD2, the 10,000 kW eight-axle heavy-haul electric that CNR Datong
// built with Alstom from 2006 on the Prima platform (the SNCF BB 27000 its pattern),
// 180 units for the Daqin coal line: two identical single-cab Bo'Bo' sections coupled
// back to back by their inner ends, with a gangway between them. Measured from the
// photographs in assets/cr-hxd2/ (SOURCES.md) and the published figures: 38.05 m over
// the couplers (two 19.025 m sections), 1.25 m wheels, bogie wheelbase 2.6 m, the body
// 2.85 m wide; the bogie centres (9.4 m) are measured on the side photographs.
//
// Each section is drawn in its own frame - the cab at +x, the flat inner end at -x -
// and placed twice, the rear one turned, as the two sections of one articulated
// vehicle hinged at the coupler plane between them (as the HXD1, cnHxd1.ts). Its shell
// is lofted from the section's own tables: the Prima cab (the silver lamp band upright,
// a sunshade ledge over it, the one-piece windscreen raked back, blue chamfers beside it
// narrowing the face toward the roof), the raised cab roof (a hood over the cab, 0.43 m
// above the machine room's roof, the twin headlight box on its front), the machine
// room's ribbed sides with the sloped shoulders over them, and the flat inner end.
// The original livery, still carried by most units: blue at both ends of each side, a
// silver trapezoid between them narrower at the top, a dark grey band along the bottom,
// the face dark grey round the windscreen with the silver lamp band below it.
// Each section carries one single-arm pantograph right behind its cab hood (the rear
// section's raised, as in the photographs) and a cooler hood with its grille.
// See docs/models/china-locos.md "The HXD2's body".

import { MeshBuilder, ngon, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { block, side } from "./vehicleParts.ts";
import { tubeX } from "./cd163.ts";
import { strokeText } from "./strokeFont.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { articulate } from "./tramKit.ts";
import { HEXIE, glyphTris } from "./cnHxd1.ts";
import { KIT_PALETTE, bogie, c, insulator, kinks, lerpTable, rect, roundRect, singleArm, surfaceDecal, surfacePanel, type Place } from "./czElectricKit.ts";
import { LOD_GLASS, lodBogie, lodPantograph, type LodBand, type LodPart, type LodSections } from "./lodKit.ts";
import { fitUnit, roofPart, shiftBody, turnBody, underPart, type UnitBody } from "./lodUnits.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];
type Pt = readonly [number, number];

/** The running number the model carries (HXD2 0021, the left side photograph's unit). */
export const HXD2_NUMBER = "HXD20021";

/** Half a section's length over its couplers (19.025 m, two of them 38.05 m). */
export const HXD2_HALF = 19.025 / 2;
/** The cab's lamp band: the knuckle coupler's face stands 0.45 m ahead of it at HXD2_HALF. */
const N = HXD2_HALF - 0.45;
/** The flat inner end; the gangway's bellows bridges the 0.6 m between the sections. */
const XI = HXD2_HALF - 0.3;
const COUPLER_Y = 0.88;
/** Model x of a point `d` m behind the section's front coupler face (the photographs' measure). */
const at = (d: number) => HXD2_HALF - d;

// heights (m over the rail)
const Y0 = 1.05; // the body's bottom
const BAND = 1.56; // the dark grey band's top, round the sides and the face
const LAMP_TOP = 2.66; // the silver lamp band's top on the face
const WAIST = 2.98; // the windscreen's foot
const SCREEN_TOP = 3.86;
const EAVE = 3.55; // the side wall's top: the sloped shoulder above it
const ROOF = 3.92; // the machine room's roof
const CROWN = 4.35; // the cab hood's roof

/** The cab's centre line [y, local x]: the lamp band upright, the ledge, the windscreen raked back, the hood's cap. */
const TIP: Table = [[Y0, N - 0.03], [BAND, N], [LAMP_TOP, N], [2.8, N - 0.07], [WAIST, N - 0.16], [SCREEN_TOP, N - 0.56], [ROOF, N - 0.64], [CROWN, N - 1.1]];
/** The half width: upright sides to the eave, the shoulder sloping in to the roof, the hood's sides above it. */
const HW: Table = [[Y0, 1.43], [EAVE, 1.43], [ROOF, 1.08], [CROWN, 0.86]];
/** The face's flat half width (the windscreen and lamps lie on it): the blue chamfers beside it widen above the lamp band. */
const FACE: Table = [[Y0, 1.18], [LAMP_TOP, 1.18], [WAIST, 1.06], [SCREEN_TOP, 1.0], [ROOF, 0.96], [CROWN, 0.72]];
/** How far the corners stand back from the centre line at the side wall: rounded below the ledge, chamfered above it. */
const CORNER: Table = [[Y0, 0.35], [LAMP_TOP, 0.35], [WAIST, 0.55], [SCREEN_TOP, 0.7], [ROOF, 0.7], [CROWN, 0.6]];
/** The cab hood's rear wall, leaning forward from the machine room's roof to its own (local x). */
const HOOD_BACK: Span = [at(4.65), at(4.4)];

const tip = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The cab end's plan at height y: [z, setback], the first two points the face, the last two the corner. */
function frontPlan(y: number): Pt[] {
  const w = hw(y), f = Math.min(lerpTable(FACE, y), w - 0.05), cb = lerpTable(CORNER, y);
  return [[0, 0], [f * 0.55, 0], [f, 0.03], [f + (w - f) * 0.6, cb * 0.35], [w, cb]];
}
/** A flat end's plan: its corners chamfered. */
const rearPlan = (y: number): Pt[] => { const w = hw(y); return [[0, 0], [w - 0.06, 0], [w, 0.06]]; };
/** The plan's first index painted with the sides' colours (the cab's corners). */
const CORNER_FROM = 2;

/** The heights where the profiles kink: rows of the shell and of every panel on it. */
const KINKS = kinks(TIP, HW, FACE, CORNER);

// --- paint -------------------------------------------------------------------------------------

type Band = readonly [number, number, string];
const SIDE: readonly Band[] = [[Y0, BAND, "cnGrey"], [BAND, ROOF, "cnBlue"], [ROOF, CROWN, "hood"]];
const FACE_BANDS: readonly Band[] = [[Y0, BAND, "cnGrey"], [BAND, LAMP_TOP, "cnSilver"], [LAMP_TOP, CROWN, "cnFace"]];
const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y <= b) ?? bands[bands.length - 1]!)[2];

/** The silver trapezoid's edges on each side [x at BAND, x at EAVE]: the cab end's and the inner end's, both leaning in. */
const EDGE_CAB: Span = [at(6.5), at(7.55)];
const EDGE_INNER: Span = [at(17.3), at(16.3)];
const edgeAt = (e: Span, y: number) => e[0] + ((e[1] - e[0]) * (y - BAND)) / (EAVE - BAND);
/** The trapezoid between heights a and b (one plane of the side: the wall, or the shoulder over it, silver too). */
const panel = (a: number, b: number): Ring => [[edgeAt(EDGE_CAB, a), a], [edgeAt(EDGE_CAB, b), b], [edgeAt(EDGE_INNER, b), b], [edgeAt(EDGE_INNER, a), a]];
const PANELS: readonly Ring[] = [panel(BAND, EAVE), panel(EAVE, ROOF)];

const PALETTE = {
  ...KIT_PALETTE,
  cnBlue: c("#2f4f93", 0.5),
  cnSilver: c("#b9bec3", 0.4),
  // the ribs catch the light a shade brighter than the wall between them
  ribBlue: c("#5274b8", 0.45),
  pilot: c("#3b3f44", 0.7),
  ribSilver: c("#e6e9eb", 0.35),
  mesh: c("#7c8287", 0.6),
  cnGrey: c("#565c63", 0.65),
  cnFace: c("#50565d", 0.55),
  cnRed: c("#d42a2a", 0.5),
  cnWhite: c("#eef0f0", 0.5),
  hood: c("#6c7177", 0.6),
  roof: { color: "#8b9196", roughness: 0.75 },
  roofBox: c("#43484d", 0.7),
  panRed: c("#b23a2a", 0.5),
  knuckle: c("#2f3134", 0.7),
  handrail: c("#c9ccce", 0.4),
  ledge: c("#aeb4b9", 0.4),
  lampPanel: c("#b1b7bc", 0.45),
  hazard: c("#e8b818", 0.5),
  black: c("#1e1f21", 0.7),
  brass: { color: "#b8952f", metallic: 0.5, roughness: 0.4 },
  bellows: { color: "#7a7f84", roughness: 0.9 },
};

// --- the shell ---------------------------------------------------------------------------------

type Region = "front" | "corner" | "side" | "rear";
interface RingPt { x: number; z: number; region: Region; sign: number }

/** The ring at height y with its flat end at `xr`, clockwise seen from above: front centre to -z, the -z side, the end, the +z side. */
function ringAt(y: number, xr: number): RingPt[] {
  const t = tip(y), fp = frontPlan(y), rp = rearPlan(y);
  const out: RingPt[] = [];
  const nf = fp.length - 1, nr = rp.length - 1;
  for (let i = 0; i <= nf; i++) out.push({ x: t - fp[i]![1], z: -fp[i]![0], region: i === nf ? "side" : i >= CORNER_FROM ? "corner" : "front", sign: -1 });
  for (let i = nr; i >= 1; i--) out.push({ x: xr + rp[i]![1], z: -rp[i]![0], region: "rear", sign: -1 });
  for (let i = 0; i <= nr; i++) out.push({ x: xr + rp[i]![1], z: rp[i]![0], region: i === nr ? "side" : "rear", sign: 1 });
  for (let i = nf; i >= 1; i--) out.push({ x: t - fp[i]![1], z: fp[i]![0], region: i - 1 >= CORNER_FROM ? "corner" : "front", sign: 1 });
  return out;
}
/** The machine room's ring (its end the inner end) and the hood's (its end the hood's leaning rear wall). */
const bodyRing = (y: number) => ringAt(y, -XI);
const hoodRing = (y: number) => ringAt(y, HOOD_BACK[0] + ((HOOD_BACK[1] - HOOD_BACK[0]) * (y - ROOF)) / (CROWN - ROOF));

function orient(m: MeshBuilder, mat: string, t: [Vec3, Vec3, Vec3], n: Vec3): void {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  if (nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0) m.tri(mat, a, b, cc);
  else m.tri(mat, a, cc, b);
}

/** Lofts rings between the heights `lo` and `hi` into `groups` (by where on the body). */
function loft(groups: Map<string, Array<{ mat: string; t: [Vec3, Vec3, Vec3]; n: Vec3 }>>, ring: (y: number) => RingPt[], lo: number, hi: number, rearMat: string): void {
  const hs = new Set<number>([lo, hi, ...KINKS.filter((y) => y > lo && y < hi)]);
  for (const bands of [SIDE, FACE_BANDS]) for (const [a, b] of bands) for (const h of [a, b]) if (h > lo && h < hi) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [rl, rh] = [ring(ya), ring(yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < rl.length; j++) {
      const k = (j + 1) % rl.length;
      const { region, sign } = rl[j]!;
      const a: Vec3 = [rl[j]!.x, ya, rl[j]!.z], b: Vec3 = [rl[k]!.x, ya, rl[k]!.z];
      const cc: Vec3 = [rh[k]!.x, yb, rh[k]!.z], d: Vec3 = [rh[j]!.x, yb, rh[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const mat = region === "rear" ? rearMat : bandAt(region === "front" ? FACE_BANDS : SIDE, ym);
      const where = region === "front" ? "cab face" : region === "rear" ? (rearMat === "hood" ? "hood rear" : "inner end") : region === "corner" ? `cab corner ${sign > 0 ? "right" : "left"}` : `side ${sign > 0 ? "right" : "left"}`;
      const en: Vec3 = [-(b[2] - a[2]), 0, b[0] - a[0]];
      const n: Vec3 = Math.hypot(en[0], en[2]) > 1e-9 ? en : [-(cc[2] - d[2]), 0, cc[0] - d[0]];
      if (!groups.has(where)) groups.set(where, []);
      groups.get(where)!.push({ mat, t: [a, b, cc], n }, { mat, t: [a, cc, d], n });
    }
  }
}

/** The section's shell: the machine room to its roof, the cab hood standing on it, each capped; the bottom open over the frame. */
function shell(m: MeshBuilder): void {
  const groups = new Map<string, Array<{ mat: string; t: [Vec3, Vec3, Vec3]; n: Vec3 }>>();
  loft(groups, bodyRing, Y0, ROOF, "cnBlue");
  loft(groups, hoodRing, ROOF, CROWN, "hood");
  for (const where of [...groups.keys()].sort()) m.scope(where, () => { for (const g of groups.get(where)!) orient(m, g.mat, g.t, g.n); });
  m.scope("roof", () => m.cap("roof", bodyRing(ROOF).map((p) => [p.x, p.z] as [number, number]), ROOF));
  m.scope("hood roof", () => m.cap("hood", hoodRing(CROWN).map((p) => [p.x, p.z] as [number, number]), CROWN));
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
function window(m: MeshBuilder, place: Place, n: Vec3, u: Span, y: Span, r: number, uB: readonly number[], vB: readonly number[], wiper = false): void {
  m.scope("frame", () => surfacePanel(m, "rubber", place, n, roundRect(u[0], u[1], y[0], y[1], r), -0.01, 0.014, uB, vB));
  m.scope("glass", () => surfacePanel(m, "glass", place, n, roundRect(u[0] + 0.05, u[1] - 0.05, y[0] + 0.05, y[1] - 0.05, Math.max(0.01, r - 0.03)), -0.005, 0.022, uB, vB));
  if (wiper) m.scope("wipers", () => {
    // two arms parked along the pane's foot, each from its pivot toward the middle
    for (const s of [-1, 1]) {
      const p = s * (u[1] - u[0]) * 0.34;
      const [a, b] = s > 0 ? [p - 0.62, p] : [p, p + 0.62];
      surfacePanel(m, "rubber", place, n, rect(a, y[0] + 0.09, b, y[0] + 0.115), 0.02, 0.035, uB, vB);
    }
  });
}

/** "He xie" and the number reading from u0 (toward -u when `flip`): the characters `h` high and `w` wide each, the number `nh` high after them. */
function hexie(u0: number, v0: number, w: number, h: number, nh: number, flip: boolean): { chars: Array<[number, number]>; number: Array<[number, number]> } {
  const sgn = flip ? -1 : 1;
  const gap = w * 0.25;
  const chars = HEXIE.flatMap((g, i) => glyphTris(g, u0 + sgn * i * (w + gap), v0, w, h, h * 0.085, flip));
  const nu = u0 + sgn * (2 * w + gap + w * 0.3);
  return { chars, number: strokeText(HXD2_NUMBER, nu, v0, nh, nh * 0.55, nh * 0.18, flip) };
}

// --- one section ---------------------------------------------------------------------------------

/** The narrow cab side window and the cab door (local x), measured behind the coupler. */
const CAB_WINDOW: Span = [at(3.4), at(3.15)];
const CAB_DOOR: Span = [at(4.35), at(3.7)];
const CAB_WINDOW_Y: Span = [2.82, 3.45];
const DOOR_Y: Span = [1.5, 3.45];
const DOOR_WINDOW_Y: Span = [2.86, 3.36];
/** The left side's tall machine-room window behind the cab door. */
const ROOM_WINDOW: Span = [at(5.6), at(4.45)];
const ROOM_WINDOW_Y: Span = [1.7, 3.26];
/** The left side's framed box with two small windows, just inside the silver. */
const TWIN_BOX: Span = [at(8.65), at(7.35)];
const TWIN_Y: Span = [2.53, 3.32];
/** The doors near the inner end: one with a window on the left; a window door and a plain leaf on the right. */
const LEFT_DOOR: Span = [at(15.1), at(14.25)];
const RIGHT_DOORS: readonly Span[] = [[at(16.15), at(15.4)], [at(15.4), at(14.9)]];
const INNER_DOOR_Y: Span = [1.58, 3.3];
/** The ribs' heights and pitch on the machine room's walls. */
const RIB_Y: Span = [1.66, 3.48];
const RIB_PITCH = 0.114;
const RIB_H = 0.044;
/** The roof: the pantograph behind the hood, the cooler hood, the high voltage insulators, two boxes. */
const PANTO_X = at(6.1);
const PANTO_BASE = 4.09;
const COOLER: Span = [at(9.7), at(7.6)];
const ROOF_BOXES: readonly Span[] = [[at(12.5), at(11.4)], [at(17.0), at(15.8)]];
const BOGIES = [-4.7, 4.7];
const WHEEL_R = 0.625;

/** The ribs' spans along a side (local x, front to back) between the cab's smooth wall and the inner end, round the openings. */
function ribSpans(sd: number): Span[] {
  const start = sd < 0 ? ROOM_WINDOW[0] - 0.12 : CAB_DOOR[0] - 0.12;
  const end = -XI + 0.12;
  const holes: Span[] = (sd < 0 ? [TWIN_BOX, LEFT_DOOR] : [[RIGHT_DOORS[0]![0], RIGHT_DOORS[1]![1]] as const]).map(([a, b]) => [a - 0.06, b + 0.06] as const);
  const out: Span[] = [];
  let x1 = start;
  for (const [a, b] of [...holes].sort((p, q) => q[1] - p[1])) { if (b < x1) out.push([b, x1]); x1 = Math.min(x1, a); }
  out.push([end, x1]);
  return out;
}

/** The horizontal ribs of the machine room's wall, each split by the livery's edges into its blue and silver lengths. */
function ribs(m: MeshBuilder, at: Place, n: Vec3, sd: number): void {
  const count = Math.floor((RIB_Y[1] - RIB_Y[0]) / RIB_PITCH) + 1;
  for (let i = 0; i < count; i++) {
    const y = RIB_Y[0] + i * RIB_PITCH;
    const [xc, xi] = [edgeAt(EDGE_CAB, y), edgeAt(EDGE_INNER, y)];
    for (const [a, b] of ribSpans(sd)) {
      // cut at the paint edges, a hair apart so the ends do not touch
      const cuts = [a, ...[xi, xc].filter((x) => x > a + 0.01 && x < b - 0.01), b];
      for (let j = 1; j < cuts.length; j++) {
        const [x0, x1] = [cuts[j - 1]! + (j > 1 ? 0.002 : 0), cuts[j]! - (j < cuts.length - 1 ? 0.002 : 0)];
        const mid = (x0 + x1) / 2;
        const mat = mid < xc && mid > xi ? "ribSilver" : "ribBlue";
        surfacePanel(m, mat, at, n, rect(x0, y - RIB_H / 2, x1, y + RIB_H / 2), -0.003, 0.014);
      }
    }
  }
}

/** A door outline: four seams round it, and an optional window in its upper part. */
function door(m: MeshBuilder, at: Place, n: Vec3, [d0, d1]: Span, [y0, y1]: Span, win?: Span): void {
  m.scope("seams", () => {
    for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
      surfacePanel(m, "rubber", at, n, q, -0.002, 0.006);
  });
  if (win) m.scope("window", () => window(m, at, n, [d0 + 0.07, d1 - 0.07], win, 0.04, [], []));
}

function handrail(m: MeshBuilder, sd: number, x: number, y0: number, y1: number): void {
  const z = sd * (hw(2.0) + 0.045);
  m.prism("handrail", ngon(6, 0.018, 0, x, z), y0, y1);
  for (const hy of [y0 + 0.05, y1 - 0.07]) block(m, "handrail", x - 0.015, x + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.065));
}

function sideItems(m: MeshBuilder, sd: number): void {
  const place = onSide(sd);
  const n: Vec3 = [0, 0, sd];
  m.scope("panel", () => surfaceDecal(m, "cnSilver", place, n, PANELS, 0.003));
  m.scope("ribs", () => ribs(m, place, n, sd));
  // the characters and the number read from the cab rearward on the left side, toward the cab on the right
  m.scope("lettering", () => {
    const w = 1.0, h = 0.9, nh = 0.3, v0 = 1.9;
    const u0 = sd < 0 ? at(8.95) : at(14.7);
    const { chars, number } = hexie(u0, v0, w, h, nh, sd < 0);
    m.facets("cnRed", [...chars, ...number].map(([u, v]) => place(u, v, 0.018)), n);
    // the number on the cab's blue side too, ahead of the cab window
    const cw = HXD2_NUMBER.length * 0.13 * 0.55 + (HXD2_NUMBER.length - 1) * 0.13 * 0.18;
    const cu = sd < 0 ? at(1.55) : at(1.55) - cw;
    m.facets("cnRed", strokeText(HXD2_NUMBER, cu, 3.0, 0.13, 0.13 * 0.55, 0.13 * 0.18, sd < 0).map(([u, v]) => place(u, v, 0.006)), n);
  });
  m.scope("cab window", () => window(m, place, n, CAB_WINDOW, CAB_WINDOW_Y, 0.04, [], []));
  m.scope("cab door", () => {
    door(m, place, n, CAB_DOOR, DOOR_Y, DOOR_WINDOW_Y);
    m.scope("handrails", () => { for (const hx of [CAB_DOOR[0] - 0.07, CAB_DOOR[1] + 0.07]) handrail(m, sd, hx, 1.3, 3.15); });
    m.scope("steps", () => {
      const w = hw(Y0);
      const [d0, d1] = CAB_DOOR;
      for (const y of [0.42, 0.74]) block(m, "steel", d0 + 0.05, d1 - 0.05, y, y + 0.04, ...side(sd, w - 0.2, w - 0.04));
      for (const hx of [d0 + 0.05, d1 - 0.09]) block(m, "steel", hx, hx + 0.04, 0.42, Y0 - 0.08, ...side(sd, w - 0.08, w - 0.04));
    });
  });
  // the dark grille on the cab's corner, under the blue
  m.scope("corner grille", () => {
    surfacePanel(m, "louvre", place, n, roundRect(at(1.35), at(0.88), 1.62, 2.12, 0.04), -0.004, 0.008);
    for (const t of [0.25, 0.5, 0.75]) surfacePanel(m, "slat", place, n, rect(at(1.32), 1.62 + t * 0.5 - 0.015, at(0.91), 1.62 + t * 0.5 + 0.015), -0.002, 0.014);
  });
  if (sd < 0) {
    m.scope("room window", () => window(m, place, n, ROOM_WINDOW, ROOM_WINDOW_Y, 0.05, [], []));
    m.scope("twin windows", () => {
      const [x0, x1] = TWIN_BOX, [y0, y1] = TWIN_Y;
      surfacePanel(m, "cnSilver", place, n, roundRect(x0, x1, y0, y1, 0.04), 0.004, 0.03);
      for (const [a, b] of [[x0 + 0.1, (x0 + x1) / 2 - 0.05], [(x0 + x1) / 2 + 0.05, x1 - 0.1]] as const)
        window(m, (u, v, d) => place(u, v, d + 0.03), n, [a, b], [y0 + 0.12, y1 - 0.1], 0.03, [], []);
    });
    m.scope("inner door", () => door(m, place, n, LEFT_DOOR, INNER_DOOR_Y, [2.45, 3.12]));
  } else {
    m.scope("inner doors", () => { door(m, place, n, RIGHT_DOORS[0]!, INNER_DOOR_Y, [2.45, 3.12]); door(m, place, n, RIGHT_DOORS[1]!, INNER_DOOR_Y); });
  }
  m.scope("inner handrail", () => handrail(m, sd, -XI + 0.25, 1.5, 2.6));
  // the row of vent slots along the shoulder
  m.scope("vent slots", () => {
    for (let x = at(5.0); x > -XI + 0.4; x -= 0.62) surfacePanel(m, "louvre", place, n, rect(x - 0.08, 3.69, x + 0.08, 3.76), -0.004, 0.006);
  });
}

/** The CR emblem: a red disc with the white ring, the rail's head and web standing in it, on the face. */
function emblem(m: MeshBuilder, cy: number): void {
  const R = 0.11, r = 0.085, k = 16;
  m.facets("cnRed", ngon(k, 0.135, 0, 0, cy).flatMap((p, i, a) => [[0, cy], p, a[(i + 1) % k]!] as Array<[number, number]>).map(([u, v]) => onFace(u, v, 0.006)), FACE_N);
  const tris: Array<[number, number]> = [];
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * 2 * Math.PI, a1 = ((i + 1) / k) * 2 * Math.PI;
    const q: Array<[number, number]> = [[R * Math.cos(a0), cy + R * Math.sin(a0)], [R * Math.cos(a1), cy + R * Math.sin(a1)], [r * Math.cos(a1), cy + r * Math.sin(a1)], [r * Math.cos(a0), cy + r * Math.sin(a0)]];
    for (const j of [0, 1, 2, 0, 2, 3]) tris.push(q[j]!);
  }
  tris.push(...glyphTris([[[0.2, 0.75], [0.8, 0.75]], [[0.5, 0.75], [0.5, -0.35]]], 0.085, cy - 0.06, 0.17, 0.15, 0.024, true));
  m.facets("cnWhite", tris.map(([u, v]) => onFace(u, v, 0.009)), FACE_N);
}

function cabFace(m: MeshBuilder): void {
  const n = FACE_N;
  m.scope("windscreen", () => window(m, onFace, n, [-0.95, 0.95], [WAIST + 0.04, SCREEN_TOP - 0.05], 0.09, faceCols([WAIST, SCREEN_TOP]), KINKS, true));
  m.scope("ledge", () => {
    // the sunshade ledge under the windscreen, standing off the face
    const y: Span = [2.71, 2.83];
    surfacePanel(m, "ledge", onFace, n, roundRect(-1.0, 1.0, y[0], y[1], 0.04), -0.01, 0.07, faceCols(y), KINKS);
  });
  m.scope("lamp panel", () => {
    const y: Span = [1.62, 2.32];
    surfacePanel(m, "lampPanel", onFace, n, roundRect(-0.9, 0.9, y[0], y[1], 0.03), -0.004, 0.003, faceCols(y), KINKS);
    // the two perforated grilles either side of the emblem
    for (const u of [[0.16, 0.64], [-0.64, -0.16]] as const) surfacePanel(m, "mesh", onFace, n, rect(u[0], 1.84, u[1], 2.2), -0.002, 0.005, faceCols([1.84, 2.2]), KINKS);
  });
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "lamps left" : "lamps right", () => {
        // the white head lamp outboard on the silver, the red tail lamp inboard on the panel
        surfacePanel(m, "rim", onFace, n, ngon(14, 0.13, 0, s * 1.04, 1.9), -0.01, 0.02, faceCols([1.77, 2.03]), KINKS);
        surfacePanel(m, "lampHead", onFace, n, ngon(14, 0.1, 0, s * 1.04, 1.9), -0.005, 0.035, faceCols([1.8, 2.0]), KINKS);
        surfacePanel(m, "rim", onFace, n, ngon(12, 0.11, 0, s * 0.77, 1.84), 0.0, 0.016, faceCols([1.73, 1.95]), KINKS);
        surfacePanel(m, "lampRed", onFace, n, ngon(12, 0.085, 0, s * 0.77, 1.84), 0.0, 0.026, faceCols([1.75, 1.93]), KINKS);
      });
  });
  m.scope("emblem", () => emblem(m, 2.02));
  m.scope("lettering", () => {
    // seen from ahead the face reads from +z to -z
    const w = 0.2, h = 0.15, nh = 0.085;
    const chars = HEXIE.flatMap((g, i) => glyphTris(g, w + 0.03 - i * (w + 0.06), 2.38, w, h, h * 0.09, true));
    const nw = HXD2_NUMBER.length * nh * 0.55 + (HXD2_NUMBER.length - 1) * nh * 0.18;
    const number = strokeText(HXD2_NUMBER, nw / 2, 1.68, nh, nh * 0.55, nh * 0.18, true);
    m.facets("cnRed", [...chars, ...number].map(([u, v]) => onFace(u, v, 0.006)), n);
  });
  m.scope("headlight box", () => {
    // the twin headlights in a box on the hood's cap, its face upright
    const x1 = tip(4.08) - 0.01, x0 = N - 1.55;
    block(m, "cnFace", x0, x1, 4.06, 4.47, -0.36, 0.36);
    const at: Place = (z, y, d) => [x1 + d, y, z];
    surfacePanel(m, "rim", at, n, roundRect(-0.31, 0.31, 4.13, 4.41, 0.05), -0.005, 0.01);
    for (const z of [-0.14, 0.14]) surfacePanel(m, "lampHead", at, n, ngon(14, 0.1, 0, z, 4.27), 0.0, 0.025);
  });
  m.scope("horn", () => {
    const x = tip(4.06) - 0.12;
    tubeX(m, "brass", 0.035, x - 0.1, 4.08, 0.48, x + 0.12, 4.08, 0.48, 8);
  });
}

/** The lower front under the cab: the buffer beam, the plough with its hazard stripes, the knuckle coupler. */
function pilot(m: MeshBuilder): void {
  const x1 = N + 0.01;
  m.scope("pilot", () => {
    block(m, "pilot", N - 1.1, x1, 0.42, Y0 - 0.01, -1.15, 1.15);
    const xp = N + 0.06;
    block(m, "pilot", N - 0.6, xp, 0.08, 0.43, -1.08, 1.08);
    const place: Place = (z, y, d) => [xp + d, y, z];
    surfacePanel(m, "hazard", place, FACE_N, rect(-1.06, 0.1, 1.06, 0.41), 0.0, 0.004);
    const w = 0.22, lean = 0.14;
    for (let z0 = -1.06 + w; z0 + w + lean <= 1.06; z0 += 2 * w)
      surfacePanel(m, "black", place, FACE_N, [[z0, 0.1], [z0 + w, 0.1], [z0 + w + lean, 0.41], [z0 + lean, 0.41]], 0.0, 0.008);
  });
  m.scope("coupler", () => knuckleCoupler(m, 1, x1 - 0.1, HXD2_HALF, COUPLER_Y));
}

function roof(m: MeshBuilder, raised: boolean): void {
  m.scope("cooler", () => {
    // the hood with sloped ends over the cooler, its grille on top
    const ring = (x0: number, x1: number, w: number): Ring => [[x1, w], [x1, -w], [x0, -w], [x0, w]];
    m.loft("roofBox", ring(COOLER[0], COOLER[1], 0.95), ROOF - 0.01, ring(COOLER[0] + 0.35, COOLER[1] - 0.35, 0.82), 4.33);
    m.scope("grille", () => {
      block(m, "louvre", COOLER[0] + 0.45, COOLER[1] - 0.45, 4.329, 4.345, -0.7, 0.7);
      for (let x = COOLER[0] + 0.6; x < COOLER[1] - 0.5; x += 0.3) block(m, "slat", x - 0.02, x + 0.02, 4.344, 4.36, -0.7, 0.7);
      block(m, "slat", COOLER[0] + 0.45, COOLER[1] - 0.45, 4.344, 4.36, -0.02, 0.02);
    });
  });
  m.scope("boxes", () => { for (const [a, b] of ROOF_BOXES) block(m, "hood", a, b, ROOF - 0.01, 4.12, -0.6, 0.6); });
  m.scope("pantograph", () => singleArm(m, { xc: PANTO_X, roofY: ROOF, baseY: PANTO_BASE, h: 1, raised, armMat: "panRed" }));
  m.scope("high voltage line", () => {
    const [xa, xb] = [at(10.15), at(10.75)];
    insulator(m, xa, 0, ROOF - 0.01, 4.3);
    insulator(m, xb, 0, ROOF - 0.01, 4.3);
    tubeX(m, "copper", 0.02, PANTO_X - 0.62, 4.32, 0, xb, 4.32, 0, 6);
    // the main breaker beside them
    block(m, "hood", xb - 0.25, xa + 0.25, ROOF - 0.01, 4.18, -0.58, -0.3);
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const [a, b, w] = [N - 0.02, -XI + 0.02, 1.4];
    const r: Ring = [[a, -w + 0.1], [a - 0.1, -w], [b + 0.1, -w], [b, -w + 0.1], [b, w - 0.1], [b + 0.1, w], [a - 0.1, w], [a, w - 0.1]];
    m.prism("frame", r, 0.86, Y0, false);
    m.cap("frame", r, 0.86, false);
  });
  m.scope("equipment", () => {
    // the transformer between the bogies, boxes and air reservoirs beside it
    block(m, "frame", -2.3, 2.3, 0.42, 0.865, -1.15, 1.15);
    block(m, "cnGrey", -2.0, 1.6, 0.5, 0.865, -1.32, -1.15);
    block(m, "cnGrey", -1.4, 2.0, 0.5, 0.865, 1.15, 1.32);
    for (const s of [-1, 1]) {
      const tank = ngon(10, 0.15, 0, s * 1.0, 0.6);
      m.sweep("cnGrey", "x", tank, s > 0 ? -2.25 : 1.65, tank, s > 0 ? -1.45 : 2.25);
    }
  });
  m.scope("bogies", () => {
    for (const xc of BOGIES) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: 1.3, wheelR: WHEEL_R, frameTop: 0.84 }));
  });
  m.scope("inner coupler", () => knuckleCoupler(m, -1, XI - 0.1, HXD2_HALF, COUPLER_Y));
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
const BELLOWS: Array<[number, number]> = [[-1.3, 1.12], [1.3, 1.12], [1.3, 3.72], [-1.3, 3.72]];
const MAX_BEND_DEG = 8;

/** The HXD2: the front section on x > 0, the rear one turned on x < 0, hinged at the coupler plane x = 0. */
export function crHxd2(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const h = HXD2_HALF;
  articulate({ m }, [
    { x0: h - XI, x1: 2 * h, draw: () => m.scope("section 1", () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, false))) },
    { x0: -2 * h, x1: -(h - XI), draw: () => m.scope("section 2", () => m.turned(0, () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, true)))) },
  ], COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, [0]);
  return m;
}

// --- the distant model ---------------------------------------------------------------------------

const lodBands = (bands: readonly Band[]): LodBand[] => bands.filter(([a]) => a < ROOF).map(([a, b, mat]) => [a, Math.min(b, ROOF), mat] as const);

function sectionLod(): UnitBody {
  const rows = KINKS.filter((y) => y >= Y0 && y <= ROOF);
  const tipT: Table = rows.map((y) => [y, tip(y)] as const);
  const setback: Table = rows.map((y) => [y, lerpTable(CORNER, y)] as const);
  return {
    y0: Y0, hw: HW.filter(([y]) => y <= ROOF), side: lodBands(SIDE), roof: "roof",
    front: { tip: tipT, setback, paint: lodBands(FACE_BANDS), windows: [{ u: [-0.95, 0.95], y: [WAIST + 0.04, SCREEN_TOP - 0.05], mat: LOD_GLASS }] },
    rear: { tip: [[Y0, -XI]] },
    // the silver trapezoid as a band between its edges' mid points
    cabs: [{ x0: edgeAt(EDGE_INNER, 2.5), x1: edgeAt(EDGE_CAB, 2.5), side: [[Y0, BAND, "cnGrey"], [BAND, ROOF, "cnSilver"]] }],
  };
}

/** The section's parts besides its body, placed by `X` (local x to model x). */
function sectionParts(section: number, X: (x: number) => number, raised: boolean): LodPart[] {
  const sec = { section };
  return [
    ...BOGIES.map((xc): LodPart => ({ ...sec, draw: (m) => m.scope("running gear", () => lodBogie(m, X(xc), 1.3 + WHEEL_R + 0.2, 0.86)) })),
    underPart(X(N - 0.02), X(-XI + 0.02), 0.86, Y0, 1.4, 40, section, "frame"),
    underPart(X(-2.3), X(2.3), 0.42, 0.865, 1.15, 50, section, "frame"),
    // the cab hood, then the cooler hood
    roofPart("hood", X(HOOD_BACK[1]), X(N - 0.75), 1.08, 0.86, ROOF - 0.01, CROWN, section),
    roofPart("roofBox", X(COOLER[0]), X(COOLER[1]), 0.95, 0.82, ROOF - 0.01, 4.33, section),
    {
      ...sec, ...(raised ? {} : { optional: 0 }),
      draw: (m) => m.scope(raised ? "raised pantograph" : "folded pantograph", () => lodPantograph(m, { x: X(PANTO_X), roofY: ROOF, baseY: PANTO_BASE, h: X(1) > X(0) ? 1 : -1, raised })),
    },
  ];
}

export function crHxd2Lod(): MeshBuilder {
  const h = HXD2_HALF;
  const body = shiftBody(sectionLod(), h);
  const sections: LodSections = {
    pivots: [[0, 0, 0], [0, COUPLER_Y, 0]],
    joints: [{ sections: [0, 1], front: h - XI, rear: -(h - XI), profile: BELLOWS }],
    maxBendDeg: MAX_BEND_DEG,
  };
  return fitUnit({
    palette: { ...PALETTE },
    bodies: [{ ...body, section: 0 }, { ...turnBody(body, 0), section: 1 }],
    parts: [...sectionParts(0, (x) => x + h, false), ...sectionParts(1, (x) => -(x + h), true)],
    sections,
  }, 200);
}
