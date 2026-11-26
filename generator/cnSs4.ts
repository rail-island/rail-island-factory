// The China Railways SS4 "Shaoshan 4" in its improved form, the SS4G (Zhuzhou Electric
// Locomotive Works from 1993; Datong, Dalian and Ziyang built it too): China's 6,400 kW
// eight-axle freight electric, two identical single-cab Bo-Bo sections coupled back to back
// by their inner ends, 100 km/h, 2 x 92 t. Measured from the photographs in assets/cr-ss4/
// (SOURCES.md) by projective fits along the side, and the published figures: 2 x 16.416 m over
// the coupler centres (32.832 m), 3.1 m wide, 1.25 m wheels. Drawn as SS4 1072 (sections 1072A
// and 1072B) in the class's common livery: light blue below, the cab cream above a dark grey
// stripe, a cream band with six portholes along the top of the machine room, the light blue roof.
//
// Each section is drawn in its own frame - the cab at +x, the flat inner end at -x - and
// placed twice, the rear one turned, as the two sections of one articulated vehicle hinged
// at the coupler plane between them (as the HXD1, cnHxd1.ts). Its shell is lofted from the
// section's own tables: the flat, upright face with rounded corners, the cab's hipped roof
// cap sloping back from the face's top edge with the big round headlight on it, the upright
// sides and the roof's sloped shoulders. The face: two large windscreens, the CR emblem
// between the lamp boxes (white lamp outboard, red lamp inboard), the dark grey stripe and its
// handrail, the number plate on the light blue below, the red plough. The sides: two cab side
// windows (a small fixed one and the sliding one), the number plate under them, the cab door
// between grab rails, then the long louvred grille and the porthole band. The roof: a box
// on the cab roof, a single-arm pantograph behind each cab (the rear section's raised), the
// louvred boxes, the insulators and the main breaker. See docs/models/china-locos.md.

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

/** The running number (SS4 1072, Zhuzhou-built; the front section is A, the rear B). */
export const SS4_NUMBER = "SS4 1072";

/** Half a section's length over its couplers (16.416 m, two of them 32.832 m). */
export const SS4_HALF = 16.416 / 2;
/** The flat face: the knuckle coupler's face stands 0.55 m ahead of it at SS4_HALF. */
const N = SS4_HALF - 0.55;
/** The flat inner end; the bodies stand 0.3 m apart, the gangway's bellows between them. */
const XI = SS4_HALF - 0.15;
const COUPLER_Y = 0.88;

// heights (m over the rail)
const Y0 = 1.0; // the side's bottom
const STRIPE: Span = [1.55, 1.69]; // the dark grey stripe under the cab's cream
const EAVE = 3.56; // the side wall's and the face's top edge
const CROWN = 4.02;
/** The porthole band along the machine room. */
const BAND: Span = [2.95, 3.38];
/** The skirt under the face drops to this height over the first 1.1 m. */
const SKIRT = 0.62;

/** Distance d behind the face to local x. */
const X = (d: number) => N - d;
/** The cab's cream on the sides ends this far behind the face. */
const CAB_END = 2.3;

/** The centre line [y, local x]: the face upright to the eave, the cab's roof cap sloping back to the crown. */
const TIP: Table = [[Y0, N], [EAVE, N], [3.62, N - 0.07], [3.96, N - 0.5], [CROWN, N - 0.62]];
/** The half width: upright sides to the eave, the roof's shoulders sloping in to the crown. */
const HW: Table = [[Y0, 1.5], [EAVE, 1.5], [3.62, 1.45], [3.96, 1.02], [CROWN, 0.9]];

const tip = (y: number) => lerpTable(TIP, y);
const hw = (y: number) => lerpTable(HW, y);
/** The face's plan at height y: [z, setback], flat across, its corners rounded (0.17 m). */
function frontPlan(y: number): Pt[] {
  const w = hw(y);
  return [[0, 0], [w - 0.17, 0], [w - 0.07, 0.03], [w - 0.015, 0.09], [w, 0.17]];
}
/** The inner end's plan: flat, its corners chamfered. */
const rearPlan = (y: number): Pt[] => { const w = hw(y); return [[0, 0], [w - 0.05, 0], [w, 0.05]]; };

const KINKS = kinks(TIP, HW);

// --- paint -------------------------------------------------------------------------------------

type Band = readonly [number, number, string];
/** The cab: its face and sides, the cap cream. */
const CAB: readonly Band[] = [[0, STRIPE[0], "ssBlue"], [STRIPE[0], STRIPE[1], "ssStripe"], [STRIPE[1], CROWN, "ssCream"]];
/** The machine room's sides: light blue with the porthole band, the roof's shoulders light blue. */
const ROOM: readonly Band[] = [[0, BAND[0], "ssBlue"], [BAND[0], BAND[1], "ssCream"], [BAND[1], EAVE, "ssBlue"], [EAVE, CROWN, "ssRoof"]];
const bandAt = (bands: readonly Band[], y: number): string => (bands.find(([a, b]) => y >= a && y <= b) ?? bands[bands.length - 1]!)[2];

const PALETTE = {
  ...KIT_PALETTE,
  ssBlue: c("#4a9ccb", 0.55),
  ssRoof: c("#5aa6d0", 0.6),
  ssCream: c("#eadd9f", 0.55),
  ssStripe: c("#3b3f42", 0.6),
  ssGrille: c("#3d7fa8", 0.6),
  ssSlat: c("#5d9cc2", 0.55),
  ssFrame: c("#2f6487", 0.6),
  ssRed: c("#c8232b", 0.5),
  ssWhite: c("#f2f2ee", 0.5),
  ssBox: c("#55595c", 0.65),
  roofBox: c("#62676a", 0.65),
  knuckle: c("#2f3134", 0.7),
  handrail: c("#c9ccce", 0.4),
  railBlue: c("#6cb3dd", 0.45),
  brass: { color: "#b99a4a", metallic: 0.5, roughness: 0.4 },
  housing: c("#b8bcbd", 0.4),
  black: c("#1e1f21", 0.7),
  bellows: { color: "#2a2c2e", roughness: 0.9 },
};

// --- the shell ---------------------------------------------------------------------------------

type Region = "front" | "corner" | "cab" | "room" | "rear";
interface RingPt { x: number; z: number }

/**
 * The ring at height y, clockwise seen from above: front centre to -z, the -z side (split
 * where the cab's cream ends), the inner end, the +z side, back to the front centre.
 */
function ringAt(y: number): RingPt[] {
  const t = tip(y), fp = frontPlan(y), rp = rearPlan(y), w = hw(y);
  const out: RingPt[] = [];
  const cabX = Math.min(X(CAB_END), t - fp[fp.length - 1]![1] - 0.05);
  for (const [z, b] of fp) out.push({ x: t - b, z: -z });
  out.push({ x: cabX, z: -w });
  for (let i = rp.length - 1; i >= 1; i--) out.push({ x: -XI + rp[i]![1], z: -rp[i]![0] });
  for (let i = 0; i < rp.length; i++) out.push({ x: -XI + rp[i]![1], z: rp[i]![0] });
  out.push({ x: cabX, z: w });
  for (let i = fp.length - 1; i >= 1; i--) out.push({ x: t - fp[i]![1], z: fp[i]![0] });
  return out;
}

/** The region of the ring's edge from point j to j + 1 (the rings share their layout at every height). */
function regionOf(a: RingPt, b: RingPt, y: number): Region {
  const w = hw(y);
  if (a.x <= -XI + 0.06 && b.x <= -XI + 0.06) return "rear";
  if (Math.abs(Math.abs(a.z) - w) < 1e-6 && Math.abs(Math.abs(b.z) - w) < 1e-6) return (a.x + b.x) / 2 > X(CAB_END) - 1e-6 ? "cab" : "room";
  if (Math.abs(a.z) < w - 0.17 + 1e-6 && Math.abs(b.z) < w - 0.17 + 1e-6) return "front";
  return "corner";
}

function orient(m: MeshBuilder, mat: string, t: [Vec3, Vec3, Vec3], n: Vec3): void {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  if (nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0) m.tri(mat, a, b, cc);
  else m.tri(mat, a, cc, b);
}

/** Lofts the section's body between its rings; the crown capped (cream over the cab), the bottom open over the frame. */
function shell(m: MeshBuilder): void {
  const hs = new Set<number>(KINKS.filter((y) => y >= Y0 && y <= CROWN));
  for (const bands of [CAB, ROOM]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y0 && h < CROWN) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  const groups = new Map<string, Array<{ mat: string; t: [Vec3, Vec3, Vec3]; n: Vec3 }>>();
  for (let i = 1; i < heights.length; i++) {
    const [ya, yb] = [heights[i - 1]!, heights[i]!];
    const [lo, hi] = [ringAt(ya), ringAt(yb)];
    const ym = (ya + yb) / 2;
    for (let j = 0; j < lo.length; j++) {
      const k = (j + 1) % lo.length;
      const region = regionOf(lo[j]!, lo[k]!, ya);
      const a: Vec3 = [lo[j]!.x, ya, lo[j]!.z], b: Vec3 = [lo[k]!.x, ya, lo[k]!.z];
      const cc: Vec3 = [hi[k]!.x, yb, hi[k]!.z], d: Vec3 = [hi[j]!.x, yb, hi[j]!.z];
      if (Math.hypot(b[0] - a[0], b[2] - a[2]) < 1e-6 && Math.hypot(cc[0] - d[0], cc[2] - d[2]) < 1e-6) continue;
      const mat = bandAt(region === "room" || region === "rear" ? ROOM : CAB, ym);
      const sgn = (a[2] + b[2]) / 2 >= 0 ? "right" : "left";
      const where = region === "front" ? "cab face" : region === "rear" ? "inner end" : region === "corner" ? `cab corner ${sgn}` : region === "cab" ? `cab side ${sgn}` : `side ${sgn}`;
      const en: Vec3 = [-(b[2] - a[2]), 0, b[0] - a[0]];
      const n: Vec3 = Math.hypot(en[0], en[2]) > 1e-9 ? en : [-(cc[2] - d[2]), 0, cc[0] - d[0]];
      if (!groups.has(where)) groups.set(where, []);
      groups.get(where)!.push({ mat, t: [a, b, cc], n }, { mat, t: [a, cc, d], n });
    }
  }
  for (const where of [...groups.keys()].sort()) m.scope(where, () => { for (const g of groups.get(where)!) orient(m, g.mat, g.t, g.n); });
  m.scope("roof", () => {
    const r = ringAt(CROWN).map((p) => [p.x, p.z] as [number, number]);
    const nf = frontPlan(CROWN).length;
    // the ring: nf face points (-z), the -z cab end, the inner end, the +z cab end, nf - 1 face points (+z)
    const cabL = nf, cabR = r.length - nf;
    m.cap("ssCream", [r[cabR]!, ...r.slice(cabR + 1), ...r.slice(0, cabL + 1)], CROWN);
    m.cap("ssRoof", r.slice(cabL, cabR + 1), CROWN);
  });
}

// --- laying things on the skin -------------------------------------------------------------------

/** The point d off side s's wall (+1 right) at local x, height y. */
const onSide = (s: number): Place => (x, y, d) => [x, y, s * (hw(y) + d)];
/** The point d ahead of the flat face at z (u), height y. */
const onFace: Place = (z, y, d) => [N + d, y, z];
const FACE_N: Vec3 = [1, 0, 0];

/** A framed window: frame, glass. */
function window(m: MeshBuilder, mat: string, at: Place, n: Vec3, u: Span, y: Span, r: number): void {
  m.scope("frame", () => surfacePanel(m, mat, at, n, roundRect(u[0], u[1], y[0], y[1], r), -0.01, 0.014, [], KINKS));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(u[0] + 0.04, u[1] - 0.04, y[0] + 0.04, y[1] - 0.04, Math.max(0.01, r - 0.03)), -0.005, 0.022, [], KINKS));
}

/** Text centred at (u, v) on a surface, `h` high; `flip` reads toward -u. */
function text(m: MeshBuilder, mat: string, at: Place, n: Vec3, s: string, u: number, v: number, h: number, d: number, flip: boolean): void {
  const w = h * 0.55, gap = h * 0.2;
  const width = s.length * w + (s.length - 1) * gap;
  const pts = strokeText(s, flip ? u + width / 2 : u - width / 2, v - h / 2, h, w, gap, flip, h * 0.14);
  m.facets(mat, pts.map(([a, b]) => at(a, b, d)), n);
}

/** A red number plate with white figures. */
function plate(m: MeshBuilder, at: Place, n: Vec3, u: Span, y: Span, s: string, flip: boolean): void {
  surfacePanel(m, "ssRed", at, n, rect(u[0], y[0], u[1], y[1]), -0.005, 0.012, [], KINKS);
  text(m, "ssWhite", at, n, s, (u[0] + u[1]) / 2, (y[0] + y[1]) / 2, (y[1] - y[0]) * 0.62, 0.015, flip);
}

// --- one section ---------------------------------------------------------------------------------

/** The cab side windows (d behind the face) and the door; the grille and portholes of the machine room. */
const SMALL_WINDOW: Span = [0.22, 0.47];
const SLIDING_WINDOW: Span = [0.72, 1.26];
const WINDOW_Y: Span = [2.62, 3.34];
const DOOR: Span = [1.58, 2.06];
const DOOR_Y: Span = [1.74, 3.4];
const GRILLE: Span = [2.95, 14.45];
const GRILLE_Y: Span = [1.8, 2.85];
/** The six portholes' centres, d behind the face (2.1 m apart, the last 0.87 m from the inner end). */
const PORTHOLES = [4.35, 6.45, 8.55, 10.65, 12.75, 14.85];
const PORTHOLE_Y: Span = [3.05, 3.28];

/** The roof's equipment, d behind the face. */
const PANTO_D = 2.75;
const PANTO_BASE = CROWN + 0.32;
const BIG_BOX: Span = [3.6, 5.6];
const LOW_BOX: Span = [6.5, 7.85];
const BOGIES = [4.35, -4.35];
const HALF_BASE = 1.45;
const WHEEL_R = 0.625;

function sideItems(m: MeshBuilder, sd: number, letter: string): void {
  const at = onSide(sd);
  const n: Vec3 = [0, 0, sd];
  // seen from the side, the face is at +x on the right side (sd > 0) reading toward -x
  const flip = sd > 0;
  m.scope("cab windows", () => {
    m.scope("small window", () => window(m, "rubber", at, n, [X(SMALL_WINDOW[1]), X(SMALL_WINDOW[0])], WINDOW_Y, 0.05));
    m.scope("sliding window", () => {
      window(m, "rubber", at, n, [X(SLIDING_WINDOW[1]), X(SLIDING_WINDOW[0])], WINDOW_Y, 0.05);
      // the sliding pane's edge
      const xm = X((SLIDING_WINDOW[0] + SLIDING_WINDOW[1]) / 2);
      surfacePanel(m, "rubber", at, n, rect(xm - 0.02, WINDOW_Y[0] + 0.04, xm + 0.02, WINDOW_Y[1] - 0.04), -0.004, 0.03, [], KINKS);
    });
    // the rear-view mirror on its arm in front of the sliding window's rear edge
    m.scope("mirror", () => {
      const x = X(SLIDING_WINDOW[0]) + 0.02, y = 2.7;
      // folded back flat against the side, inside the gauge
      block(m, "ssCream", x - 0.08, x, y, y + 0.16, ...side(sd, hw(y) - 0.01, hw(y) + 0.045));
    });
  });
  m.scope("number plate", () => plate(m, at, n, [X(1.28), X(0.7)], [2.3, 2.46], `${SS4_NUMBER}${letter}`, !flip));
  m.scope("cab door", () => {
    const [d0, d1] = [X(DOOR[1]), X(DOOR[0])], [y0, y1] = DOOR_Y;
    m.scope("seams", () => {
      for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
        surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], KINKS);
    });
    m.scope("handle", () => surfacePanel(m, "handrail", at, n, rect(d1 - 0.12, 2.55, d1 - 0.06, 2.6), 0.0, 0.03, [], KINKS));
    m.scope("grab rails", () => {
      for (const hx of [d0 - 0.09, d1 + 0.09]) {
        const z = sd * (hw(2.0) + 0.03);
        m.prism("handrail", ngon(6, 0.016, 0, hx, z), 1.3, 3.36);
        for (const hy of [1.32, 3.32]) block(m, "handrail", hx - 0.015, hx + 0.015, hy, hy + 0.02, ...side(sd, hw(hy) - 0.01, hw(hy) + 0.045));
      }
    });
  });
  // the steps up to the door, behind the skirt
  m.scope("steps", () => {
    const w = hw(Y0);
    const [s0, s1] = [X(1.55), X(1.12)];
    for (const y of [0.42, 0.7]) block(m, "steel", s0, s1, y, y + 0.04, ...side(sd, w - 0.24, w - 0.04));
    for (const hx of [s0, s1 - 0.04]) block(m, "steel", hx, hx + 0.04, 0.42, Y0 - 0.02, ...side(sd, w - 0.08, w - 0.04));
  });
  m.scope("grille", () => {
    const [x0, x1] = [X(GRILLE[1]), X(GRILLE[0])], [y0, y1] = GRILLE_Y;
    surfacePanel(m, "ssFrame", at, n, rect(x0, y0, x1, y1), -0.004, 0.004, [], KINKS);
    surfacePanel(m, "ssGrille", at, n, rect(x0 + 0.06, y0 + 0.06, x1 - 0.06, y1 - 0.05), -0.002, 0.006, [], KINKS);
    // the vertical louvres, light edges across the dark panel
    const slats: Vec3[] = [];
    const pitch = 0.24;
    const count = Math.floor((x1 - x0 - 0.2) / pitch);
    const start = (x0 + x1) / 2 - ((count - 1) * pitch) / 2;
    for (let i = 0; i < count; i++) {
      const x = start + i * pitch;
      const [a, b, cc, d] = [at(x - 0.03, y0 + 0.1, 0.009), at(x + 0.03, y0 + 0.1, 0.009), at(x + 0.03, y1 - 0.09, 0.009), at(x - 0.03, y1 - 0.09, 0.009)];
      slats.push(...(sd > 0 ? [a, b, cc, a, cc, d] : [a, cc, b, a, d, cc]));
    }
    m.facets("ssSlat", slats, n);
  });
  m.scope("portholes", () => {
    for (const [i, d] of PORTHOLES.entries())
      m.scope(`porthole ${i + 1}`, () => window(m, "rubber", at, n, [X(d) - 0.19, X(d) + 0.19], PORTHOLE_Y, 0.1));
  });
  m.scope("inner handle", () => surfacePanel(m, "handrail", at, n, rect(-XI + 0.22, 1.5, -XI + 0.26, 2.1), 0.0, 0.03, [], KINKS));
}

/** The CR emblem: a red disc, a white ring, the white rail's head and web over a white base. */
function emblem(m: MeshBuilder, cy: number): void {
  const R = 0.24;
  surfacePanel(m, "ssRed", onFace, FACE_N, ngon(16, R, 0, 0, cy), -0.005, 0.012);
  const ring: Array<[number, number]> = [];
  const k = 16, ro = R * 0.82, ri = R * 0.68;
  for (let i = 0; i < k; i++) {
    const a0 = (i / k) * 2 * Math.PI, a1 = ((i + 1) / k) * 2 * Math.PI;
    const q: Array<[number, number]> = [[ro * Math.cos(a0), cy + ro * Math.sin(a0)], [ro * Math.cos(a1), cy + ro * Math.sin(a1)], [ri * Math.cos(a1), cy + ri * Math.sin(a1)], [ri * Math.cos(a0), cy + ri * Math.sin(a0)]];
    for (const j of [0, 1, 2, 0, 2, 3]) ring.push(q[j]!);
  }
  // the rail: its head, its web, its foot
  const rail = [rect(-0.1, cy + 0.04, 0.1, cy + 0.1), rect(-0.028, cy - 0.1, 0.028, cy + 0.04), rect(-0.09, cy - 0.14, 0.09, cy - 0.1)];
  const tris: Array<[number, number]> = [...ring];
  for (const r of rail) for (const j of [0, 1, 2, 0, 2, 3]) tris.push(r[j]! as [number, number]);
  // the face reads from +z to -z seen from ahead: (u, v) -> onFace(u, v)
  m.facets("ssWhite", tris.map(([u, v]) => onFace(-u, v, 0.016)), FACE_N);
}

function cabFace(m: MeshBuilder, letter: string): void {
  const n = FACE_N;
  m.scope("windscreens", () => {
    for (const [name, u] of [["left", [0.08, 1.27]], ["right", [-1.27, -0.08]]] as const)
      m.scope(`windscreen ${name}`, () => {
        window(m, "rubber", onFace, n, u, [2.65, 3.34], 0.06);
        // the wiper hanging from its pivot over the pane's middle
        const zc = (u[0] + u[1]) / 2 + (u[0] > 0 ? 0.25 : -0.25);
        surfacePanel(m, "rubber", onFace, n, rect(zc - 0.012, 2.78, zc + 0.012, 3.3), 0.02, 0.032);
      });
    // the trims under the windscreens
    for (const s of [-1, 1]) surfacePanel(m, "housing", onFace, n, (s > 0 ? rect(0.28, 2.48, 1.25, 2.51) : rect(-1.25, 2.48, -0.28, 2.51)), 0.0, 0.02);
  });
  m.scope("emblem", () => emblem(m, 2.3));
  m.scope("lamps", () => {
    for (const s of [-1, 1])
      m.scope(s > 0 ? "lamps left" : "lamps right", () => {
        const u: Span = s > 0 ? [0.72, 1.3] : [-1.3, -0.72];
        const y: Span = [1.86, 2.14];
        surfacePanel(m, "housing", onFace, n, roundRect(u[0], u[1], y[0], y[1], 0.03), -0.01, 0.05);
        surfacePanel(m, "black", onFace, n, roundRect(u[0] + 0.03, u[1] - 0.03, y[0] + 0.03, y[1] - 0.03, 0.02), -0.005, 0.055);
        const cy = (y[0] + y[1]) / 2;
        // the white lamp outboard, the red lamp inboard
        surfacePanel(m, "lampHead", onFace, n, ngon(12, 0.1, 0, s * 1.15, cy), 0.0, 0.065);
        surfacePanel(m, "lampRed", onFace, n, ngon(12, 0.085, 0, s * 0.87, cy), 0.0, 0.065);
        // the small round marker between the lamp box and the emblem
        surfacePanel(m, "black", onFace, n, ngon(10, 0.055, 0, s * 0.5, 2.05), -0.005, 0.04);
      });
  });
  m.scope("number plate", () => plate(m, onFace, n, [-0.5, 0.5], [1.25, 1.47], `${SS4_NUMBER}${letter}`, true));
  // the handrail along the stripe's foot: light blue, red at its ends and middle
  m.scope("face handrail", () => {
    const y = 1.53;
    for (const [z0, z1, mat] of [[-1.42, -1.0, "ssRed"], [-1.0, -0.12, "railBlue"], [-0.12, 0.12, "ssRed"], [0.12, 1.0, "railBlue"], [1.0, 1.42, "ssRed"]] as const)
      block(m, mat, N + 0.05, N + 0.09, y - 0.02, y + 0.02, z0, z1);
    for (const z of [-1.35, 0, 1.35]) block(m, "railBlue", N - 0.01, N + 0.05, y - 0.015, y + 0.015, z - 0.015, z + 0.015);
  });
}

/** The big headlight standing on the cab's roof cap, and the box behind it. */
function headlight(m: MeshBuilder): void {
  const y = 3.86, x0 = tip(3.62) - 0.2, x1 = tip(3.62) + 0.08;
  m.scope("headlight", () => {
    m.sweep("housing", "x", ngon(14, 0.21, 0, 0, y), x0, ngon(14, 0.21, 0, 0, y), x1);
    m.sweep("rubber", "x", ngon(14, 0.17, 0, 0, y), x1, ngon(14, 0.17, 0, 0, y), x1 + 0.02);
    m.sweep("lampHead", "x", ngon(14, 0.15, 0, 0, y), x1 + 0.02, ngon(14, 0.15, 0, 0, y), x1 + 0.03);
    block(m, "housing", x0, x0 + 0.24, 3.62, y - 0.12, -0.08, 0.08);
  });
  m.scope("cab roof box", () => {
    block(m, "ssBox", X(1.35), X(0.68), CROWN - 0.01, CROWN + 0.28, -0.4, 0.4);
    for (const z of [-1, 1]) m.slab("louvre", [[X(1.3), CROWN + 0.05, z * 0.402], [X(0.73), CROWN + 0.05, z * 0.402], [X(0.73), CROWN + 0.24, z * 0.402], [X(1.3), CROWN + 0.24, z * 0.402]], [0, 0, z * 0.006]);
  });
  // the two horns on the roof cap beside the headlight, their bells forward
  m.scope("horns", () => {
    for (const z of [-0.62, 0.62]) {
      const y = 3.9, x = tip(y) - 0.12;
      m.sweep("brass", "x", ngon(8, 0.035, 0, z, y), x - 0.3, ngon(8, 0.035, 0, z, y), x - 0.12);
      m.sweep("brass", "x", ngon(8, 0.04, 0, z, y), x - 0.12, ngon(8, 0.075, 0, z, y), x);
      block(m, "steel", x - 0.25, x - 0.18, tip(y) > 0 ? 3.75 : 3.75, y - 0.03, z - 0.025, z + 0.025);
    }
  });
}

/** The face's skirt below the side's foot, the plough under it and the knuckle coupler. */
function pilot(m: MeshBuilder): void {
  m.scope("skirt", () => {
    // the light blue skirt under the face, from the face back 1.1 m, its corners rounded as the face's
    const plan = frontPlan(Y0);
    const ring: Ring = [[X(1.1), -1.49], ...[...plan].reverse().map(([z, b]): [number, number] => [N - b, -Math.min(z, 1.49)]), ...plan.slice(1).map(([z, b]): [number, number] => [N - b, Math.min(z, 1.49)]), [X(1.1), 1.49]];
    const mid: Vec3 = [X(0.55), 0, 0];
    for (let i = 0; i < ring.length; i++) {
      const [[xa, za], [xb, zb]] = [ring[i]!, ring[(i + 1) % ring.length]!];
      const nrm: Vec3 = [(xa + xb) / 2 - mid[0], 0, (za + zb) / 2];
      const [a, b, cc, d]: Vec3[] = [[xa, SKIRT, za], [xb, SKIRT, zb], [xb, Y0 + 0.002, zb], [xa, Y0 + 0.002, za]];
      orient(m, "ssBlue", [a!, b!, cc!], nrm);
      orient(m, "ssBlue", [a!, cc!, d!], nrm);
    }
    for (let i = 1; i + 1 < ring.length; i++) orient(m, "ssBlue", [[ring[0]![0], SKIRT, ring[0]![1]], [ring[i]![0], SKIRT, ring[i]![1]], [ring[i + 1]![0], SKIRT, ring[i + 1]![1]]], [0, -1, 0]);
  });
  m.scope("plough", () => {
    // four red bars across the front on posts, leaning back to the rail
    const bars = [0.16, 0.28, 0.4, 0.52];
    for (const [i, y] of bars.entries()) {
      const xf = N + 0.02 - (0.52 - y) * 0.35;
      block(m, "ssRed", xf - 0.08, xf, y, y + 0.07, -1.32 + i * 0.03, 1.32 - i * 0.03);
    }
    for (const z of [-1.2, -0.6, 0.6, 1.2]) m.slab("ssRed", [[N - 0.2, 0.14, z - 0.03], [N - 0.2, SKIRT, z - 0.03], [N + 0.02, SKIRT, z - 0.03], [N - 0.15, 0.14, z - 0.03]], [0, 0, 0.06]);
    block(m, "ssRed", N - 0.45, N - 0.2, 0.14, SKIRT, -1.3, 1.3);
  });
  m.scope("coupler", () => {
    knuckleCoupler(m, 1, N - 0.1, SS4_HALF, COUPLER_Y);
    // the coupler's pocket standing out of the face over it
    block(m, "ssBlue", N - 0.01, N + 0.12, 0.98, 1.12, -0.44, 0.48);
    // the brake pipe and main reservoir hoses either side of it
    for (const z of [-0.55, 0.62]) {
      m.rod("rubber", [N + 0.05, 0.98, z], [N + 0.22, 0.6, z * 0.9], 0.03, 6);
      block(m, "brass", N + 0.18, N + 0.26, 0.55, 0.62, z * 0.9 - 0.04, z * 0.9 + 0.04);
    }
  });
}

/** The roof covers' joints: thin dark seams across the shoulders and the crown, d behind the face. */
const ROOF_SEAMS = [5.95, 9.3, 12.45];

function roofSeams(m: MeshBuilder): void {
  m.scope("roof seams", () => {
    const ys = [EAVE + 0.004, 3.62, 3.96, CROWN];
    const out = 0.006;
    for (const d of ROOF_SEAMS) {
      const [x0, x1] = [X(d) - 0.02, X(d) + 0.02];
      for (const sd of [-1, 1])
        for (let i = 1; i < ys.length; i++) {
          const [ya, yb] = [ys[i - 1]!, ys[i]!];
          const [za, zb] = [sd * (hw(ya) + out), sd * (hw(yb) + out)];
          const n: Vec3 = [0, sd * (hw(ya) - hw(yb)), sd * (yb - ya)];
          orient(m, "ssStripe", [[x0, ya, za], [x1, ya, za], [x1, yb, zb]], n);
          orient(m, "ssStripe", [[x0, ya, za], [x1, yb, zb], [x0, yb, zb]], n);
        }
      const w = hw(CROWN) + out;
      orient(m, "ssStripe", [[x0, CROWN + out, -w], [x1, CROWN + out, -w], [x1, CROWN + out, w]], [0, 1, 0]);
      orient(m, "ssStripe", [[x0, CROWN + out, -w], [x1, CROWN + out, w], [x0, CROWN + out, w]], [0, 1, 0]);
    }
  });
}

function roof(m: MeshBuilder, raised: boolean): void {
  roofSeams(m);
  m.scope("pantograph", () => singleArm(m, { xc: X(PANTO_D), roofY: CROWN, baseY: PANTO_BASE, h: -1, raised }));
  m.scope("louvred boxes", () => {
    for (const [name, [d0, d1], hgt, w] of [["big box", BIG_BOX, 0.55, 0.72], ["low box", LOW_BOX, 0.36, 0.6]] as const)
      m.scope(name, () => {
        block(m, "roofBox", X(d1), X(d0), CROWN - 0.01, CROWN + hgt, -w, w);
        for (const z of [-1, 1])
          m.slab("louvre", [[X(d1) + 0.08, CROWN + 0.06, z * (w + 0.002)], [X(d0) - 0.08, CROWN + 0.06, z * (w + 0.002)], [X(d0) - 0.08, CROWN + hgt - 0.07, z * (w + 0.002)], [X(d1) + 0.08, CROWN + hgt - 0.07, z * (w + 0.002)]], [0, 0, z * 0.006]);
      });
  });
  m.scope("high voltage line", () => {
    const xs = [X(1.6), X(8.3), X(10.4), X(12.6), -XI + 0.45];
    for (const x of xs) insulator(m, x, 0.3, CROWN - 0.01, CROWN + 0.38);
    tubeX(m, "copper", 0.02, xs[xs.length - 1]!, CROWN + 0.4, 0.3, X(8.3), CROWN + 0.4, 0.3, 6);
    tubeX(m, "copper", 0.02, X(PANTO_D) - 0.75, CROWN + 0.4, 0.3, X(1.6), CROWN + 0.4, 0.3, 6);
    // the main breaker on the transformer room's roof
    block(m, "breaker", X(9.8), X(9.0), CROWN - 0.01, CROWN + 0.34, -0.5, -0.12);
    for (const x of [X(9.6), X(9.2)]) insulator(m, x, -0.31, CROWN + 0.33, CROWN + 0.6);
    // the brake resistor's stacked insulators along the roof
    for (const x of [X(11.5), X(13.6)]) block(m, "insulator", x - 0.3, x + 0.3, CROWN - 0.01, CROWN + 0.22, -0.55, -0.2);
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const [a, b, w] = [X(1.1) - 0.01, -XI + 0.02, 1.44];
    const r: Ring = [[a, -w], [b, -w], [b, w], [a, w]];
    m.prism("frame", r, 0.9, Y0, false);
    m.cap("frame", r, 0.9, false);
  });
  m.scope("equipment", () => {
    // the transformer between the bogies, a grey box and tanks beside it
    block(m, "frame", -2.0, 2.0, 0.45, 0.905, -1.15, 1.15);
    block(m, "ssBox", X(8.0), X(6.4), 0.5, 0.895, ...side(1, 1.17, 1.42));
    block(m, "ssBox", -X(6.4), -X(8.0), 0.5, 0.895, ...side(-1, 1.17, 1.42));
    for (const s of [-1, 1]) {
      const tank = ngon(10, 0.15, 0, s * 1.22, 0.66);
      m.sweep("ssStripe", "x", tank, -2.2 * s - 0.6, tank, -2.2 * s + 0.6);
    }
  });
  m.scope("bogies", () => {
    for (const xc of BOGIES) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: HALF_BASE, wheelR: WHEEL_R, frameTop: 0.875 }));
  });
  m.scope("inner coupler", () => knuckleCoupler(m, -1, XI - 0.1, SS4_HALF, COUPLER_Y));
}

/** One section in its own frame: cab at +x, centred on its couplers; `letter` its A or B. */
function drawSection(m: MeshBuilder, raised: boolean, letter: string): void {
  m.scope("body", () => m.scope("shell", () => shell(m)));
  m.scope("sides", () => { for (const sd of [-1, 1]) m.scope(sd > 0 ? "right side" : "left side", () => sideItems(m, sd, letter)); });
  m.scope("cab", () => { cabFace(m, letter); headlight(m); pilot(m); });
  m.scope("underframe", () => underframe(m));
  m.scope("roof equipment", () => roof(m, raised));
}

/** The gangway's bellows between the sections (z, y). */
const BELLOWS: Array<[number, number]> = [[-1.2, 1.05], [1.2, 1.05], [1.2, 3.45], [-1.2, 3.45]];
const MAX_BEND_DEG = 8;

/** The SS4: the front section (A) on x > 0, the rear one (B) turned on x < 0, hinged at the coupler plane x = 0. */
export function crSs4(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  const h = SS4_HALF;
  articulate({ m }, [
    { x0: h - XI, x1: 2 * h, draw: () => m.scope("section 1", () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, false, "A"))) },
    { x0: -2 * h, x1: -(h - XI), draw: () => m.scope("section 2", () => m.turned(0, () => m.moved(([x, y, z]) => [x + h, y, z], () => drawSection(m, true, "B")))) },
  ], COUPLER_Y, { profile: BELLOWS, folds: 4, depth: 0.03 }, MAX_BEND_DEG, [0]);
  return m;
}

// --- the distant model ---------------------------------------------------------------------------

const lodBands = (bands: readonly Band[]): LodBand[] => bands.filter(([, b]) => b > Y0).map(([a, b, mat]) => [Math.max(a, Y0), b, mat] as const);

function sectionLod(): UnitBody {
  const tipT: Table = KINKS.filter((y) => y >= Y0 && y <= CROWN).map((y) => [y, tip(y)] as const);
  return {
    y0: Y0, hw: HW, side: lodBands([[0, BAND[0], "ssBlue"], [BAND[0], BAND[1], "ssCream"], [BAND[1], CROWN, "ssBlue"]]), roof: "ssBlue",
    front: { tip: tipT, setback: [[Y0, 0.17]], paint: lodBands(CAB), windows: [{ u: [-1.27, 1.27], y: [2.65, 3.34], mat: LOD_GLASS }] },
    rear: { tip: [[Y0, -XI]] },
    cabs: [{ x0: X(CAB_END), x1: N, side: lodBands(CAB) }],
    windows: [{ u: [X(GRILLE[1]), X(GRILLE[0])], y: GRILLE_Y, mat: "ssGrille" }],
  };
}

/** The section's parts besides its body, placed by `P` (local x to model x). */
function sectionParts(section: number, P: (x: number) => number, raised: boolean): LodPart[] {
  const sec = { section };
  return [
    ...BOGIES.map((xc): LodPart => ({ ...sec, draw: (m) => m.scope("running gear", () => lodBogie(m, P(xc), HALF_BASE + WHEEL_R + 0.2, 0.9)) })),
    underPart(P(X(1.1)), P(-XI + 0.02), 0.9, Y0, 1.44, 40, section, "frame"),
    underPart(P(N), P(X(1.1)), SKIRT, Y0, 1.49, 30, section, "ssBlue"),
    roofPart("roofBox", P(X(BIG_BOX[1])), P(X(BIG_BOX[0])), 0.72, 0.72, CROWN - 0.01, CROWN + 0.55, section),
    {
      ...sec, ...(raised ? {} : { optional: 0 }),
      draw: (m) => m.scope(raised ? "raised pantograph" : "folded pantograph", () => lodPantograph(m, { x: P(X(PANTO_D)), roofY: CROWN, baseY: PANTO_BASE, h: P(1) > P(0) ? -1 : 1, raised })),
    },
  ];
}

export function crSs4Lod(): MeshBuilder {
  const h = SS4_HALF;
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
