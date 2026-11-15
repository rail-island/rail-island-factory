// The Indian Railways WAP-5 (ABB / Adtranz 1995, then Chittaranjan Locomotive
// Works): a Bo-Bo three-phase passenger locomotive of 18.162 m over the buffers,
// 16.88 m over the headstocks, 3.142 m wide, on Henschel Flexifloat bogies of
// 2.8 m wheelbase at 10.2 m centres, 1.092 m wheels, with two single-arm
// pantographs. Drawn as the later CLW units run (30164 photographed): the
// aerodynamic cab 1 at +x - a short upright lower nose, the windscreens raked
// far back under the white bonnet, the cab side window raked with them - and the
// flat cab 2 at -x, its face leaning back a little above the waist and meeting a
// grey roof chamfer. Both windscreens behind their wire guards, the twin
// headlight and the white-over-red marker lamps in the upper stripe, the roof
// pod with its headlight and horns over each face. One machine-room window a
// side, diagonally opposite. The body's own asymmetric shell (the box locomotive
// kit's loft, boxLocoKit.ts / czElectricKit.ts, draws two equal ends) and its
// own low level of detail. docs/models/india-trains.md; assets/ir-wap5/.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamValues } from "./design.ts";
import { block, side } from "./vehicleParts.ts";
import { bandAt, tubeX, type Band } from "./cd163.ts";
import {
  KIT_PALETTE, bogie, buffers, c, insulator, kinks, lerpTable, numberOn, onEnd, onSide, rect, roundRect, singleArm, surfacePanel,
  type Place, type ShellSpec,
} from "./czElectricKit.ts";
import { fitLod, lodBogie, lodPantograph, lodRoofBox, lodSideBox, windowBands, type LodPart, type Table as LodTable } from "./lodKit.ts";
import { liveryParams } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

// --- measures (m; published figures, photo scales in assets/ir-wap5/SOURCES.md) ---------------

const HALF = 18.162 / 2; // over the buffers
const N = 16.88 / 2; // the headstocks: the faces' foot
const W = 3.142 / 2;
const Y0 = 1.29; // the body's bottom edge (the dark skirt band's foot)
const ROOF = 4.02; // the roof's crown (4.237 m over the folded pantographs)
const EAVE = 3.53; // where the white side meets the grey roof
const BOGIE_X = 5.1, HALF_BASE = 1.4, WHEEL_R = 0.546;
const PANTO_X = 4.6;
const BUFFER_Y = 1.105;

/** The half width by height: upright sides, a rounded cantrail and a low crown. */
const HW: Table = [[Y0, W], [3.35, W], [3.55, W - 0.05], [3.72, W - 0.16], [3.88, W - 0.38], [ROOF, W - 0.75]];

/** Cab 1, the aerodynamic end: [y, |x|] of its centre line, the lower nose bulging 0.25 m ahead of the headstock at the stripes. */
const AERO_TIP: Table = [[Y0, N - 0.04], [1.65, N + 0.14], [2.05, N + 0.25], [2.32, N + 0.18], [2.48, N - 0.02], [2.62, N - 0.28], [3.38, N - 1.12], [3.6, N - 1.5], [3.85, N - 1.95], [ROOF, N - 2.35]];
/** Cab 2, the flat end. */
const FLAT_TIP: Table = [[Y0, N], [2.42, N], [2.6, N - 0.03], [3.5, N - 0.2], [EAVE + 0.03, N - 0.24], [3.78, N - 0.5], [3.93, N - 0.8], [ROOF, N - 1.05]];

/** The ends' plans at half width w: [z, setback], the aerodynamic nose rounded wide, the flat face's corners tight. */
const aeroPlan = (y: number, w: number): Table => {
  const k = 1.5 - 0.35 * Math.min(1, Math.max(0, (y - 2.05) / 0.57)); // the lower nose rounds wider
  return [[0, 0], [w * 0.4, 0.04 * k], [w * 0.7, 0.14 * k], [w * 0.88, 0.29 * k], [w, 0.46 * k]];
};
const flatPlan = (_y: number, w: number): Table => [[0, 0], [w * 0.55, 0.02], [w * 0.85, 0.08], [w * 0.96, 0.17], [w, 0.27]];

// --- liveries ----------------------------------------------------------------------------------

interface Wap5Livery { title: string; number: string; dark: string; stripe: string; pin: string; flag: boolean }

const LIVERIES: Record<string, Wap5Livery> = {
  // 30080, 30099, 30164 repainted: white, two red stripes with a white line between, a dark grey skirt
  whiteRed: { title: "White and red", number: "30164", dark: "#3b3d40", stripe: "#c42b2b", pin: "#f1f1ee", flag: true },
  // the WAP-5A 30086 of the Gatimaan Express: the same layout in blue with a yellow line (no free photograph)
  gatimaan: { title: "Gatimaan", number: "30086", dark: "#1d3f80", stripe: "#1d3f80", pin: "#f2c31a", flag: true },
};

/** The livery parameter (the same titles and keys as ever). */
export const WAP5_PARAMS = liveryParams(Object.fromEntries(Object.entries(LIVERIES).map(([k, l]) => [k, { title: l.title, loco: undefined as unknown as WorldLoco }])));

const livery = (v?: ParamValues): Wap5Livery => LIVERIES[resolveParams(WAP5_PARAMS, v).livery!]!;

/** The stripes by height, the same on the sides and both faces. */
const STRIPES = { skirt: 1.645, low0: 1.745, low1: 2.0, up0: 2.11, up1: 2.37 } as const;
const SIDE_BANDS: readonly Band[] = [
  [0, STRIPES.skirt, "wDark"], [STRIPES.skirt, STRIPES.low0, "wBody"], [STRIPES.low0, STRIPES.low1, "wStripe"],
  [STRIPES.low1, STRIPES.up0, "wPin"], [STRIPES.up0, STRIPES.up1, "wStripe"], [STRIPES.up1, EAVE, "wBody"], [EAVE, 9, "wRoof"],
];
/** The aerodynamic nose is white up over its bonnet to the pod. */
const AERO_BANDS: readonly Band[] = [...SIDE_BANDS.slice(0, -2), [STRIPES.up1, 9, "wBody"]];

function palette(l: Wap5Livery): Record<string, MaterialSpec> {
  return {
    ...KIT_PALETTE,
    wBody: c("#f1f1ee"), wStripe: c(l.stripe), wPin: c(l.pin), wDark: c(l.dark, 0.6), wRoof: { color: "#8a8d8f", roughness: 0.75 },
    guard: c("#3d4043", 0.55), pod: c("#9a9d9f", 0.6), frame: c("#2c2e31", 0.75),
    flagSaffron: c("#f08a24"), flagWhite: c("#fafafa"), flagGreen: c("#1d8a3a"),
  };
}

// --- the asymmetric shell ------------------------------------------------------------------------

interface EndSpec { e: number; tip: Table; plan: (y: number, w: number) => Table; bands: readonly Band[] }
const FRONT: EndSpec = { e: 1, tip: AERO_TIP, plan: aeroPlan, bands: AERO_BANDS };
const REAR: EndSpec = { e: -1, tip: FLAT_TIP, plan: flatPlan, bands: SIDE_BANDS };

const hwAt = (y: number) => lerpTable(HW, y);

/** One end as the kit's ShellSpec, for laying items on its face (onEnd, surfacePanel). */
function endShell(end: EndSpec): ShellSpec {
  return {
    heights: kinks(end.tip, HW), tip: (y) => lerpTable(end.tip, y), hw: hwAt, endPlan: (y) => end.plan(y, hwAt(y)),
    side: SIDE_BANDS, end: end.bands, corner: "end", roof: "wRoof",
  };
}

type Region = "front" | "rear" | "side";
interface RingPoint { x: number; z: number; region: Region; sign: number }

/** The plan ring at height y: the front end, the -z side, the rear end, the +z side (czElectricKit's shellRing, one end each). */
function ringAt(y: number): RingPoint[] {
  const hw = hwAt(y);
  const out: RingPoint[] = [];
  const at = (end: EndSpec, i: number, zs: number, edge: number) => {
    const plan = end.plan(y, hw);
    const n = plan.length - 1;
    const region: Region = edge === n ? "side" : end.e > 0 ? "front" : "rear";
    out.push({ x: end.e * (lerpTable(end.tip, y) - plan[i]![1]), z: zs * Math.min(plan[i]![0], hw), region, sign: region === "side" ? zs : end.e });
  };
  const n = 4;
  for (let i = 0; i <= n; i++) at(FRONT, i, -1, i);
  for (let i = n; i >= 1; i--) at(REAR, i, -1, i - 1);
  for (let i = 0; i <= n; i++) at(REAR, i, 1, i);
  for (let i = n; i >= 1; i--) at(FRONT, i, 1, i - 1);
  return out;
}

function orient(t: [Vec3, Vec3, Vec3], n: Vec3): Vec3[] {
  const [a, b, cc] = t;
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]];
  const nn = [u[1]! * v[2]! - u[2]! * v[1]!, u[2]! * v[0]! - u[0]! * v[2]!, u[0]! * v[1]! - u[1]! * v[0]!];
  return nn[0]! * n[0] + nn[1]! * n[1] + nn[2]! * n[2] >= 0 ? [a, b, cc] : [a, cc, b];
}

function shell(m: MeshBuilder): void {
  const hs = new Set<number>([...kinks(AERO_TIP, FLAT_TIP, HW)].filter((y) => y >= Y0));
  for (const bands of [SIDE_BANDS, AERO_BANDS]) for (const [a, b] of bands) for (const h of [a, b]) if (h > Y0 && h < ROOF) hs.add(h);
  const heights = [...hs].sort((a, b) => a - b);
  const groups = new Map<string, { mat: string; normal: Vec3; pts: Vec3[] }>();
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
      const bands = region === "side" ? SIDE_BANDS : region === "front" ? FRONT.bands : REAR.bands;
      const band = bandAt(bands, ym);
      const where = region === "side" ? `side ${sign > 0 ? "right" : "left"}` : region;
      const key = `${where}|${bands.indexOf(band)}`;
      const normal: Vec3 = region === "front" ? [1, 0, 0] : region === "rear" ? [-1, 0, 0] : [0, 0, sign];
      if (!groups.has(key)) groups.set(key, { mat: band[2], normal, pts: [] });
      const en: Vec3 = [-(b[2] - a[2]), 0, b[0] - a[0]];
      const edge: Vec3 = Math.hypot(en[0], en[2]) > 1e-9 ? en : [-(cc[2] - d[2]), 0, cc[0] - d[0]];
      groups.get(key)!.pts.push(...orient([a, b, cc], edge), ...orient([a, cc, d], edge));
    }
  }
  const keys = [...groups.keys()].sort();
  for (const where of [...new Set(keys.map((k) => k.split("|")[0]!))])
    m.scope(where, () => {
      for (const key of keys.filter((k) => k.startsWith(where + "|")).sort((a, b) => Number(a.split("|")[1]) - Number(b.split("|")[1]))) {
        const g = groups.get(key)!;
        m.scope(`band ${key.split("|")[1]}`, () => m.facets(g.mat, g.pts, g.normal));
      }
    });
  m.scope("roof", () => m.cap("wRoof", ringAt(ROOF).map((p) => [p.x, p.z]), ROOF));
}

// --- items on the skin -------------------------------------------------------------------------

/** A convex ring moved inward by d (its edges offset, neighbours intersected). */
function inset(poly: Ring, d: number): Ring {
  const n = poly.length;
  const lines = poly.map((p, i) => {
    const q = poly[(i + 1) % n]!;
    const [dx, dy] = [q[0] - p[0], q[1] - p[1]];
    const l = Math.hypot(dx, dy);
    const [nx, ny] = [-dy / l, dx / l]; // inward for a counter-clockwise ring
    return { p: [p[0] + nx * d, p[1] + ny * d] as const, v: [dx, dy] as const };
  });
  return lines.map((L1, i) => {
    const L0 = lines[(i + n - 1) % n]!;
    const den = L0.v[0] * L1.v[1] - L0.v[1] * L1.v[0];
    const t = ((L1.p[0] - L0.p[0]) * L1.v[1] - (L1.p[1] - L0.p[1]) * L1.v[0]) / den;
    return [L0.p[0] + L0.v[0] * t, L0.p[1] + L0.v[1] * t] as [number, number];
  });
}

/** A framed window of any convex outline: rubber frame, glass. */
function glazing(m: MeshBuilder, at: Place, n: Vec3, poly: Ring, uB: readonly number[], vB: readonly number[]): void {
  m.scope("frame", () => surfacePanel(m, "rubber", at, n, poly, -0.01, 0.014, uB, vB));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, inset(poly, 0.04), -0.005, 0.022, uB, vB));
}

/** A windscreen's wire guard standing off the glass: a frame and vertical bars. */
function guard(m: MeshBuilder, at: Place, n: Vec3, u: Span, y: Span, uB: readonly number[], vB: readonly number[]): void {
  m.scope("guard", () => {
    const t = 0.035;
    for (const q of [rect(u[0], y[0], u[1], y[0] + t), rect(u[0], y[1] - t, u[1], y[1]), rect(u[0], y[0] + t, u[0] + t, y[1] - t), rect(u[1] - t, y[0] + t, u[1], y[1] - t)])
      surfacePanel(m, "guard", at, n, q, 0.0, 0.085, uB, vB);
    const count = Math.round((u[1] - u[0]) / 0.1);
    const pitch = (u[1] - u[0]) / count;
    for (let i = 1; i < count; i++) {
      const cu = u[0] + i * pitch;
      surfacePanel(m, "guard", at, n, rect(cu - 0.006, y[0] + 0.01, cu + 0.006, y[1] - 0.01), 0.05, 0.075, uB, vB);
    }
    // the bar across the middle the wiper parks on
    const ym = (y[0] + y[1]) / 2;
    surfacePanel(m, "guard", at, n, rect(u[0] + 0.01, ym - 0.008, u[1] - 0.01, ym + 0.008), 0.05, 0.072, uB, vB);
  });
}

function lamp(m: MeshBuilder, at: Place, n: Vec3, cz: number, cy: number, r: number, mat: string, uB: readonly number[], vB: readonly number[]): void {
  m.scope("rim", () => surfacePanel(m, "rim", at, n, ngon(12, r + 0.025, 0, cz, cy), -0.01, 0.025, uB, vB));
  m.scope("lens", () => surfacePanel(m, mat, at, n, ngon(12, r, 0, cz, cy), -0.005, 0.035, uB, vB));
}

/** The items on one face, seen from ahead (+z of the u axis on the viewer's left at the front, as the kit's). */
function face(m: MeshBuilder, end: EndSpec, l: Wap5Livery): void {
  const sp = endShell(end);
  const e = end.e;
  const at = onEnd(sp, e);
  const n: Vec3 = [e, 0, 0];
  const vB = kinks(end.tip, HW);
  const uBAt = (y: Span) => [...new Set([y[0], (y[0] + y[1]) / 2, y[1], ...vB.filter((h) => h > y[0] && h < y[1])].flatMap((h) => sp.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
  // u is model z; the viewer's left at the front is +z... mirror so "left" reads alike at both ends
  const L = (z: Span): Span => (e > 0 ? [-z[1], -z[0]] : z);
  const aero = e > 0;
  const scr: Span = aero ? [2.66, 3.4] : [2.66, 3.46];
  const scrZ: Span = aero ? [0.1, 1.1] : [0.12, 1.06];
  for (const s of [-1, 1])
    m.scope(s > 0 ? "windscreen left" : "windscreen right", () => {
      const z: Span = s > 0 ? scrZ : [-scrZ[1], -scrZ[0]];
      const u = L(z), uB = uBAt(scr);
      glazing(m, at, n, roundRect(u[0], u[1], scr[0], scr[1], 0.08), uB, vB);
      m.scope("wiper", () => surfacePanel(m, "rubber", at, n, rect(u[0] + 0.15, scr[0] + 0.1, u[1] - 0.3, scr[0] + 0.125), 0.02, 0.035, uB, vB));
      guard(m, at, n, [u[0] - 0.03, u[1] + 0.03], [scr[0] - 0.04, scr[1] + 0.03], uB, vB);
    });
  const ly = (STRIPES.up0 + STRIPES.up1) / 2;
  const lyB = uBAt([ly - 0.15, ly + 0.15]);
  m.scope("headlights", () => {
    surfacePanel(m, "rim", at, n, roundRect(-0.21, 0.21, ly - 0.11, ly + 0.11, 0.03), -0.01, 0.02, lyB, vB);
    for (const z of [-0.1, 0.1]) m.scope(z > 0 ? "left" : "right", () => lamp(m, at, n, z, ly, 0.075, "lampHead", lyB, vB));
  });
  for (const s of [-1, 1])
    m.scope(s > 0 ? "marker lamps left" : "marker lamps right", () => {
      const z = s * (W - 0.52);
      const yB = uBAt([ly - 0.2, ly + 0.2]);
      surfacePanel(m, "rim", at, n, roundRect(z - 0.09, z + 0.09, ly - 0.19, ly + 0.17, 0.03), -0.01, 0.02, yB, vB);
      lamp(m, at, n, z, ly + 0.07, 0.05, "lampHead", yB, vB);
      lamp(m, at, n, z, ly - 0.09, 0.05, "lampRed", yB, vB);
    });
  m.scope("number", () => numberOn(m, at, n, l.number, e > 0 ? -0.62 : 0.62, ly, 0.13, 0.006, e > 0));
  if (l.flag && aero)
    m.scope("flag", () => {
      const u: Span = [0.3, 0.62], yB = uBAt([STRIPES.up0, STRIPES.up1]);
      const h = (STRIPES.up1 - STRIPES.up0 - 0.04) / 3, y0 = STRIPES.up0 + 0.02;
      (["flagGreen", "flagWhite", "flagSaffron"] as const).forEach((mat, i) => surfacePanel(m, mat, at, n, rect(u[0], y0 + i * h, u[1], y0 + (i + 1) * h), 0.001, 0.005, yB, vB));
    });
  m.scope("roof pod", () => roofPod(m, end));
  m.scope("lower end", () => {
    buffers(m, e, N, HALF, BUFFER_Y);
    // the open cowcatcher: raked posts under the headstock and horizontal bars across them
    m.scope("plough", () => {
      const [yb, yt] = [0.22, Y0 - 0.35];
      const xAt = (y: number) => N + 0.32 - ((y - yb) / (yt - yb)) * 0.28;
      m.scope("posts", () => {
        for (const z of [-1.05, -0.7, -0.35, 0, 0.35, 0.7, 1.05]) m.loft("frame", ngon(4, 0.035, Math.PI / 4, e * xAt(yb), z), yb, ngon(4, 0.035, Math.PI / 4, e * xAt(yt), z), yt);
      });
      m.scope("bars", () => {
        for (const y of [0.24, 0.36, 0.48, 0.6, 0.72, 0.84]) {
          const x = xAt(y + 0.02);
          const [x0, x1] = e > 0 ? [x - 0.025, x + 0.045] : [-x - 0.045, -x + 0.025];
          block(m, "frame", x0, x1, y, y + 0.04, -1.12, 1.12);
        }
      });
    });
  });
}

/** The box over each face carrying the roof headlight and the two horns. */
function roofPod(m: MeshBuilder, end: EndSpec): void {
  const e = end.e;
  const tipY = (y: number) => lerpTable(end.tip, y);
  const y0 = e > 0 ? 3.62 : EAVE + 0.06, y1 = 4.14;
  const xf = tipY(y0) - 0.06; // its face just behind the skin at its foot
  const xb = N - (e > 0 ? 2.6 : 1.4);
  block(m, "pod", ...(e > 0 ? [xb, xf] as const : [-xf, -xb] as const), y0, y1, -0.2, 0.2);
  const cy = y1 - 0.13;
  const lens = ngon(12, 0.085, 0, 0, cy);
  const ring = ngon(12, 0.11, 0, 0, cy);
  m.scope("headlight", () => {
    const [r0, r1] = e > 0 ? [xf - 0.01, xf + 0.03] : [-xf - 0.03, -xf + 0.01];
    const [l0, l1] = e > 0 ? [xf + 0.01, xf + 0.05] : [-xf - 0.05, -xf - 0.01];
    m.sweep("rim", "x", ring, r0, ring, r1);
    m.sweep("lampHead", "x", lens, l0, lens, l1);
  });
  m.scope("horns", () => {
    for (const z of [-0.36, 0.36]) {
      const bell = ngon(8, 0.07, Math.PI / 8, z, y1 - 0.05);
      const [h0, h1] = e > 0 ? [xb + 0.4, xb + 0.75] : [-xb - 0.75, -xb - 0.4];
      m.sweep("pod", "x", bell, h0, bell, h1);
      block(m, "pod", h0 + 0.1, h0 + 0.2, ROOF - 0.15, y1 - 0.1, z - 0.03, z + 0.03);
    }
  });
}

/** A side door: its seams, its window, the handrails beside it and the steps below. */
function door(m: MeshBuilder, at: Place, n: Vec3, sd: number, x: Span, y: Span, win: Span, vB: readonly number[]): void {
  const [d0, d1] = x, [y0, y1] = y;
  m.scope("seams", () => {
    for (const q of [rect(d0, y0, d1, y0 + 0.02), rect(d0, y1 - 0.02, d1, y1), rect(d0, y0 + 0.02, d0 + 0.02, y1 - 0.02), rect(d1 - 0.02, y0 + 0.02, d1, y1 - 0.02)])
      surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], vB);
  });
  m.scope("window", () => glazing(m, at, n, roundRect(d0 + 0.12, d1 - 0.12, win[0], win[1], 0.05), [], vB));
  m.scope("handrails", () => {
    for (const hx of [d0 - 0.06, d1 + 0.06]) {
      const top = y0 + 1.5, z = sd * (W + 0.03);
      m.prism("steel", ngon(6, 0.018, 0, hx, z), y0 - 0.2, top);
      for (const hy of [y0 + 0.1, top - 0.02]) block(m, "steel", hx - 0.015, hx + 0.015, hy, hy + 0.02, ...side(sd, W - 0.01, W + 0.045));
    }
  });
  m.scope("steps", () => {
    for (const sy of [0.42, 0.78]) block(m, "steel", d0 + 0.05, d1 - 0.05, sy, sy + 0.04, ...side(sd, W - 0.16, W - 0.02));
    for (const hx of [d0 + 0.05, d1 - 0.09]) block(m, "steel", hx, hx + 0.04, 0.42, Y0 - 0.35 + 0.02, ...side(sd, W - 0.06, W - 0.02));
  });
}

const DOOR_Y: Span = [Y0 + 0.06, 3.42];
const DOOR_WIN: Span = [2.62, 3.25];
/** Cab 1's door and the raked window ahead of it, its front edge along the bonnet's rake. */
const AERO_DOOR: Span = [5.85, 6.6];
const AERO_WIN: Ring = [[6.72, 2.62], [7.5, 2.62], [6.88, 3.22], [6.72, 3.22]];
/** Cab 2's door and the window ahead of it. */
const FLAT_DOOR: Span = [-6.85, -6.1];
const FLAT_WIN: Span = [-7.82, -6.98];
/** The one machine-room window a side, diagonally opposite: at -x on the right side, +x on the left. */
const ROOM_WIN: Span = [3.0, 3.38];

function sides(m: MeshBuilder, l: Wap5Livery): void {
  const sp = endShell(FRONT);
  const vB = kinks(HW);
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      m.scope("cab 1 door", () => door(m, at, n, sd, AERO_DOOR, DOOR_Y, DOOR_WIN, vB));
      m.scope("cab 1 window", () => glazing(m, at, n, AERO_WIN, [], vB));
      m.scope("cab 2 door", () => door(m, at, n, sd, FLAT_DOOR, DOOR_Y, DOOR_WIN, vB));
      m.scope("cab 2 window", () => glazing(m, at, n, roundRect(FLAT_WIN[0], FLAT_WIN[1], DOOR_WIN[0], DOOR_WIN[1], 0.06), [], vB));
      const rx: Span = sd > 0 ? [-ROOM_WIN[1], -ROOM_WIN[0]] : ROOM_WIN;
      m.scope("machine room window", () => glazing(m, at, n, roundRect(rx[0], rx[1], 2.45, 3.36, 0.05), [], vB));
      m.scope("number", () => numberOn(m, at, n, l.number, sd > 0 ? 1.2 : -1.2, (STRIPES.up0 + STRIPES.up1) / 2, 0.13, 0.006, sd < 0));
    });
}

// --- roof, underframe, running gear --------------------------------------------------------------

function roof(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => singleArm(m, { xc: e * PANTO_X, roofY: ROOF, baseY: ROOF + 0.12, h: -e, raised: e < 0, armMat: "pantograph" }));
  });
  m.scope("high voltage line", () => {
    for (const e of [-1, 1]) {
      insulator(m, e * 2.2, 0.3, ROOF - 0.01, ROOF + 0.3);
      tubeX(m, "copper", 0.018, e * 2.2, ROOF + 0.3, 0.3, e * (PANTO_X - 0.6), ROOF + 0.3, 0.3, 6);
    }
    tubeX(m, "copper", 0.018, -2.2, ROOF + 0.3, 0.3, 2.2, ROOF + 0.3, 0.3, 6);
  });
  m.scope("circuit breaker", () => {
    block(m, "pod", -0.45, 0.45, ROOF - 0.01, ROOF + 0.12, -0.35, 0.05);
    for (const x of [-0.25, 0.25]) insulator(m, x, -0.15, ROOF + 0.12, ROOF + 0.42);
  });
}

function underframe(m: MeshBuilder): void {
  m.scope("frame", () => {
    const H = N, w = W - 0.05;
    const r: Ring = [[H, -w + 0.15], [H - 0.15, -w], [-H + 0.15, -w], [-H, -w + 0.15], [-H, w - 0.15], [-H + 0.15, w], [H - 0.15, w], [H, w - 0.15]];
    m.prism("frame", r, Y0 - 0.35, Y0, false);
    m.cap("underframe", r, Y0 - 0.35, false);
  });
  m.scope("transformer", () => block(m, "underframe", -2.4, 2.4, Y0 - 1.0, Y0 - 0.35, -1.2, 1.2));
  m.scope("tanks", () => {
    for (const s of [-1, 1]) block(m, "underframe", -2.9, -2.45, Y0 - 0.8, Y0 - 0.35, ...side(s, 0.5, 1.3));
  });
}

// --- the design's builders -----------------------------------------------------------------------

export function irWap5(v?: ParamValues): MeshBuilder {
  const l = livery(v);
  const m = new MeshBuilder(palette(l));
  m.scope("body", () => {
    m.scope("shell", () => shell(m));
    underframe(m);
  });
  m.scope("sides", () => sides(m, l));
  m.scope("front cab", () => face(m, FRONT, l));
  m.scope("rear cab", () => face(m, REAR, l));
  m.scope("bogies", () => {
    for (const xc of [BOGIE_X, -BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc, halfBase: HALF_BASE, wheelR: WHEEL_R, frameTop: WHEEL_R + 0.25 }));
  });
  m.scope("roof equipment", () => roof(m));
  return m;
}

/** The distant model's paint: the two stripes and their white line as one band. */
const LOD_BANDS: readonly Band[] = [[0, STRIPES.skirt, "wDark"], [STRIPES.skirt, STRIPES.low0, "wBody"], [STRIPES.low0, STRIPES.up1, "wStripe"], [STRIPES.up1, EAVE, "wBody"], [EAVE, 9, "wRoof"]];

/** The distant model: the same asymmetric shell and stripes, both windscreen bands, the cab windows, gear, pods and pantographs. */
export function irWap5Lod(v?: ParamValues, budget = 100): MeshBuilder {
  const l = livery(v);
  const endOf = (end: EndSpec) => {
    const ys = kinks(end.tip, HW).filter((y) => y >= Y0);
    return {
      tip: end.tip.map(([y, x]) => [y, end.e * x] as const) as LodTable,
      setback: ys.map((y) => { const p = end.plan(y, hwAt(y)); return [y, p[p.length - 1]![1]] as const; }) as LodTable,
      paint: end.e > 0 ? [...LOD_BANDS.slice(0, -2), [STRIPES.up1, 9, "wBody"] as const] : LOD_BANDS,
    };
  };
  const sideWindows = [
    ...windowBands([{ u: AERO_DOOR, y: DOOR_WIN }], 0), ...windowBands([{ u: [6.72, 7.3], y: [2.62, 3.1] }], 0),
    ...windowBands([{ u: FLAT_DOOR, y: DOOR_WIN }], 0), ...windowBands([{ u: FLAT_WIN, y: DOOR_WIN }], 0),
  ].map((w) => ({ ...w, optional: (w.u[1] - w.u[0]) * (w.y[1] - w.y[0]) }));
  const endWindows = [
    ...windowBands([{ u: [-1.1, 1.1], y: [2.66, 3.4] }], 0.4).map((w) => ({ ...w, ends: [1] })),
    ...windowBands([{ u: [-1.06, 1.06], y: [2.66, 3.46] }], 0.4).map((w) => ({ ...w, ends: [-1] })),
  ];
  const parts: LodPart[] = [
    { optional: 40, draw: (m) => m.scope("frame", () => lodSideBox(m, "frame", [[-N, Y0 - 0.35], [N, Y0 - 0.35], [N, Y0], [-N, Y0]], -(W - 0.05), W - 0.05)) },
    { draw: (m) => m.scope("running gear", () => { for (const xc of [-BOGIE_X, BOGIE_X]) lodBogie(m, xc, HALF_BASE + WHEEL_R + 0.2, Y0 - 0.35); }) },
    { optional: 50, draw: (m) => m.scope("transformer", () => lodSideBox(m, "underframe", [[-2.4, Y0 - 1.0], [2.4, Y0 - 1.0], [2.4, Y0 - 0.35], [-2.4, Y0 - 0.35]], -1.2, 1.2)) },
    { optional: 12, draw: (m) => m.scope("front pod", () => lodRoofBox(m, "pod", N - 2.6, lerpTable(AERO_TIP, 3.62) - 0.06, 0.2, 0.2, 3.62, 4.14)) },
    { optional: 11, draw: (m) => m.scope("rear pod", () => lodRoofBox(m, "pod", -(lerpTable(FLAT_TIP, EAVE + 0.06) - 0.06), -(N - 1.4), 0.2, 0.2, EAVE + 0.06, 4.14)) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: -PANTO_X, roofY: ROOF, baseY: ROOF + 0.12, h: 1, raised: true })) },
    { optional: 0, draw: (m) => m.scope("folded pantograph", () => lodPantograph(m, { x: PANTO_X, roofY: ROOF, baseY: ROOF + 0.12, h: -1, raised: false })) },
  ];
  return fitLod({
    palette: palette(l),
    shells: [{ y0: Y0, hw: HW, front: endOf(FRONT), rear: endOf(REAR), side: LOD_BANDS, roof: "wRoof", sideWindows, endWindows }],
    parts,
  }, budget);
}
