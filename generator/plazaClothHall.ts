// The Cloth Hall (Sukiennice) in the middle of the Main Market Square of Krakow: the
// long Gothic market hall, rebuilt after the fire of 1555 with the Renaissance attic
// (the crenellated "Polish parapet" of blind arcades, masks and pinnacles that hides
// the roof), and given its neo-Gothic open arcades along both long sides in 1875-79
// (Tomasz Prylinski). A plaza landmark (docs/models/plaza-landmarks.md).
//
// Real dimensions: the hall is about 108 m long and 18 m wide; the arcades add about
// 6 m on each long side. The arcades are one storey of pointed arches on round stone
// columns with carved capitals (nine bays each side of the centre), crowned by a stone
// frieze and an openwork balustrade over a low lean-to roof. Above them the hall's red
// brick wall with cream pilasters and round-headed windows, a white stone cornice and
// the cream attic about 5 m high: two blind arches a bay, a mask between them, a
// scalloped crest and a pinnacle over every pilaster. In the middle of each long side a
// projecting entrance pavilion opens the passage through the hall (along Z) under its
// round arches and rises to a scrolled crest with a finial about 30 m up; square
// pavilions with domed turrets stand at the four corners and a stair tower with a
// gable at each short end. The dark red tile roof shows only above the parapet.
//
// Modelled in metres, +Y up, the base of the paved plinth at y = 0, centred on the
// hall. The long axis runs along X; the two long fronts face +Z and -Z.
//
// Sources: Wikipedia "Krakow Cloth Hall", Commons "Sukiennice w Krakowie", the
// photographs in assets/cloth-hall/ (SOURCES.md). Deterministic: the same code gives
// the same bytes.

import { MeshBuilder, ngon, rect, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ProceduralDesign } from "./design.ts";
import { PLAZA_CATALOG } from "./plazaCatalog.ts";
import { lodBox } from "./lodPrimitives.ts";

const PALETTE: Record<string, MaterialSpec> = {
  render: { color: "#e3cfa2", roughness: 0.9 },
  renderShade: { color: "#c9ad78", roughness: 0.9 },
  brick: { color: "#a4523a", roughness: 0.9 },
  stone: { color: "#ece6d6", roughness: 0.85 },
  column: { color: "#cfc7b4", roughness: 0.85 },
  paving: { color: "#a9a196", roughness: 0.95 },
  roof: { color: "#7a3a2c", roughness: 0.85 },
  metal: { color: "#3f4a46", metallic: 0.4, roughness: 0.55 },
  door: { color: "#4a3324", roughness: 0.8 },
  pane: { color: "#2e3438", metallic: 0.3, roughness: 0.4 },
};

// --- helpers -----------------------------------------------------------------------

/** A box between two corners (any order); `top` and `bottom` caps optional. */
function bx(m: MeshBuilder, mat: string, xa: number, xb: number, y0: number, y1: number, za: number, zb: number, top = true, bottom = false): void {
  const [x0, x1] = xa < xb ? [xa, xb] : [xb, xa];
  const [z0, z1] = za < zb ? [za, zb] : [zb, za];
  const r = rect(x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2);
  m.prism(mat, r, y0, y1, top);
  if (bottom) m.cap(mat, r, y0, false);
}

/** A planar quad wound so it faces along `n`. */
function face(m: MeshBuilder, mat: string, a: Vec3, b: Vec3, c: Vec3, d: Vec3, n: Vec3): void {
  const pts = [a, b, c, d];
  const nv: Vec3 = [0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const p = pts[i]!;
    const q = pts[(i + 1) % 4]!;
    nv[0] += (p[1] - q[1]) * (p[2] + q[2]);
    nv[1] += (p[2] - q[2]) * (p[0] + q[0]);
    nv[2] += (p[0] - q[0]) * (p[1] + q[1]);
  }
  if (nv[0] * n[0] + nv[1] * n[1] + nv[2] * n[2] >= 0) m.quad(mat, a, b, c, d);
  else m.quad(mat, a, d, c, b);
}

/** A circle of n points about (cx, cz). */
const circle = (n: number, r: number, cx = 0, cz = 0): Ring => ngon(n, r, Math.PI / n, cx, cz);

/**
 * The (u, y) points of an arch from (a, ys) over to (b, ys): a two-centred pointed arch
 * of radius k * span (k = 0.5 gives a round arch), n segments a half.
 */
function archCurve(a: number, b: number, ys: number, k: number, n: number): Array<[number, number]> {
  const s = b - a;
  const R = k * s;
  const xc = (a + b) / 2;
  const ta = Math.acos(Math.max(-1, Math.min(1, (xc - (a + R)) / R)));
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (ta - Math.PI) * (i / n);
    out.push([a + R + R * Math.cos(t), ys + R * Math.sin(t)]);
  }
  for (let i = n - 1; i >= 0; i--) {
    const [x, y] = out[i]!;
    out.push([2 * xc - x, y]);
  }
  return out;
}

/** A round-headed (or pointed) opening's outline in (u, y): jambs up to ys and the arch. */
function archOutline(a: number, b: number, y0: number, ys: number, k: number, n: number): Array<[number, number]> {
  return [[a, y0], ...archCurve(a, b, ys, k, n), [b, y0]];
}

/**
 * A facade frame: u runs along the facade, d outward from the plane `base`. A long
 * front (axis "z", side s) maps (u, y, d) to (u, y, s (base + d)); an end front
 * (axis "x") to (s (base + d), y, u).
 */
interface Frame {
  axis: "x" | "z";
  s: number;
  base: number;
}
const P = (f: Frame, u: number, y: number, d: number): Vec3 => (f.axis === "z" ? [u, y, f.s * (f.base + d)] : [f.s * (f.base + d), y, u]);
const N = (f: Frame): Vec3 => (f.axis === "z" ? [0, 0, f.s] : [f.s, 0, 0]);

/** A box in a facade frame. */
function fbox(m: MeshBuilder, f: Frame, mat: string, u0: number, u1: number, y0: number, y1: number, d0: number, d1: number, top = true, bottom = false): void {
  const a = P(f, u0, y0, d0);
  const b = P(f, u1, y1, d1);
  bx(m, mat, a[0], b[0], y0, y1, a[2], b[2], top, bottom);
}

/** A flat panel with the convex outline (u, y) in a facade frame: its face at d1, back at d0. */
function fslab(m: MeshBuilder, f: Frame, mat: string, outline: Array<[number, number]>, d0: number, d1: number): void {
  const n = N(f);
  const t = d1 - d0;
  m.slab(mat, outline.map(([u, y]) => P(f, u, y, d1)), [-n[0] * t, -n[1] * t, -n[2] * t]);
}

/**
 * One bay of an arched wall in a facade frame, between u = x0 and x1 and d = dIn..dOut:
 * piers pL / pR wide at the ends, an opening with jambs from yBot up to the springing
 * ys and the arch (radius k * span) above, the wall closed up to yTop. The faces drawn
 * are the front, the back, the jambs and the soffit; the top, the bottom and the bay's
 * ends meet other parts.
 */
function archBay(m: MeshBuilder, f: Frame, mat: string, x0: number, x1: number, pL: number, pR: number, dIn: number, dOut: number, yBot: number, ys: number, yTop: number, k: number, n: number): void {
  const a = x0 + pL;
  const b = x1 - pR;
  const curve = archCurve(a, b, ys, k, n);
  const nOut = N(f);
  const nIn: Vec3 = [-nOut[0], -nOut[1], -nOut[2]];
  const xc = (a + b) / 2;
  for (const [d, nn] of [[dOut, nOut], [dIn, nIn]] as Array<[number, Vec3]>) {
    face(m, mat, P(f, x0, yBot, d), P(f, a, yBot, d), P(f, a, yTop, d), P(f, x0, yTop, d), nn);
    face(m, mat, P(f, b, yBot, d), P(f, x1, yBot, d), P(f, x1, yTop, d), P(f, b, yTop, d), nn);
    for (let i = 0; i + 1 < curve.length; i++) {
      const [u0, v0] = curve[i]!;
      const [u1, v1] = curve[i + 1]!;
      face(m, mat, P(f, u0, v0, d), P(f, u1, v1, d), P(f, u1, yTop, d), P(f, u0, yTop, d), nn);
    }
  }
  if (ys > yBot) {
    face(m, mat, P(f, a, yBot, dIn), P(f, a, yBot, dOut), P(f, a, ys, dOut), P(f, a, ys, dIn), f.axis === "z" ? [1, 0, 0] : [0, 0, 1]);
    face(m, mat, P(f, b, yBot, dIn), P(f, b, yBot, dOut), P(f, b, ys, dOut), P(f, b, ys, dIn), f.axis === "z" ? [-1, 0, 0] : [0, 0, -1]);
  }
  for (let i = 0; i + 1 < curve.length; i++) {
    const [u0, v0] = curve[i]!;
    const [u1, v1] = curve[i + 1]!;
    const um = (u0 + u1) / 2;
    const vm = (v0 + v1) / 2;
    const toward = P(f, xc - um, ys - vm, 0);
    const o = P(f, 0, 0, 0);
    const nn: Vec3 = [toward[0] - o[0], toward[1], toward[2] - o[2]];
    face(m, mat, P(f, u0, v0, dIn), P(f, u1, v1, dIn), P(f, u1, v1, dOut), P(f, u0, v0, dOut), nn);
  }
}

/** A pinnacle on (x, y0, z): a square base, a tapering octagonal shaft, a ball and a spike. */
function pinnacle(m: MeshBuilder, x: number, y0: number, z: number, h: number, mat = "stone"): void {
  const w = 0.14 * h;
  bx(m, mat, x - w, x + w, y0, y0 + 0.28 * h, z - w, z + w);
  m.loft(mat, circle(6, w * 0.8, x, z), y0 + 0.28 * h, circle(6, w * 0.45, x, z), y0 + 0.7 * h, false);
  m.loft(mat, circle(6, w * 0.45, x, z), y0 + 0.7 * h, circle(6, w * 0.75, x, z), y0 + 0.78 * h, false);
  m.spire(mat, circle(6, w * 0.75, x, z), y0 + 0.78 * h, y0 + h);
}

/** A hipped roof over x0..x1, z0..z1 from the eaves at y0, pitched at `slope` (rise per run). */
function hipRoof(m: MeshBuilder, mat: string, x0: number, x1: number, z0: number, z1: number, y0: number, slope: number): number {
  const hz = (z1 - z0) / 2;
  const hx = (x1 - x0) / 2;
  const zc = (z0 + z1) / 2;
  const xc = (x0 + x1) / 2;
  const run = Math.min(hz, hx);
  const y1 = y0 + run * slope;
  const ra = hx - run;
  const rb = hz - run;
  const A: Vec3 = [xc - ra, y1, zc - rb];
  const B: Vec3 = [xc + ra, y1, zc - rb];
  const C: Vec3 = [xc + ra, y1, zc + rb];
  const D: Vec3 = [xc - ra, y1, zc + rb];
  const e00: Vec3 = [x0, y0, z0];
  const e10: Vec3 = [x1, y0, z0];
  const e11: Vec3 = [x1, y0, z1];
  const e01: Vec3 = [x0, y0, z1];
  const quadOrTri = (p: Vec3, q: Vec3, r: Vec3, s: Vec3, n: Vec3): void => {
    if (Math.hypot(r[0] - s[0], r[2] - s[2]) < 1e-6) {
      if (dotN(p, q, r, n)) m.tri(mat, p, q, r);
      else m.tri(mat, p, r, q);
    } else face(m, mat, p, q, r, s, n);
  };
  quadOrTri(e00, e10, B, A, [0, 1, -1]);
  quadOrTri(e11, e01, D, C, [0, 1, 1]);
  quadOrTri(e10, e11, C, B, [1, 1, 0]);
  quadOrTri(e01, e00, A, D, [-1, 1, 0]);
  return y1;
}
function dotN(a: Vec3, b: Vec3, c: Vec3, n: Vec3): boolean {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const x = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  return x[0] * n[0] + x[1] * n[1] + x[2] * n[2] >= 0;
}

// --- dimensions --------------------------------------------------------------------

const HX = 54; // the hall's half length (108 m)
const HZ = 9; // and half width (18 m): its long walls
const YB = 0.25; // top of the paved plinth, the arcade floor
const PAV = 8.5; // the central pavilion's half width
const TOW = 47.5; // the inner face of the corner pavilions
const TOW_X = HX + 0.4; // their outer face
const FRONT = 15.3; // the pavilions' fronts
const A_IN = 14.3; // the arcade wall's back face
const A_OUT = 14.9; // and its front face
const A_AX = 14.6; // the column axes
const BAYS = 9; // arcade bays between the pavilion and the corner pavilion
const BAY = (TOW - PAV) / BAYS; // 4.33 m
const YS = 4.55; // the arcade's springing
const YT = 8.4; // top of the arcade wall
const Y_ROOF_A = 10.2; // the arcade roof's top against the hall wall
const Y_CORN = 15.0; // the hall's cornice
const Y_ATT = 15.5; // foot of the attic
const Y_WAVE = 19.4; // the attic's crest between the waves
const WAVE = 1.3; // the rise of each scallop
const Y_PAV = 20.2; // the pavilions' cornice
const PASS = 2.6; // half width of the passage through the hall

const arcadeAxes = (): number[] => Array.from({ length: BAYS + 1 }, (_, i) => PAV + i * BAY);

// --- parts -------------------------------------------------------------------------

function plinth(m: MeshBuilder): void {
  m.scope("plinth", () => {
    bx(m, "paving", -HX - 5.2, HX + 5.2, 0, YB, -FRONT - 0.9, FRONT + 0.9);
  });
}

function hallBody(m: MeshBuilder): void {
  m.scope("hall body", () => {
    for (const t of [-1, 1]) {
      // the ground storey behind the arcades, the brick storey above, split by the passage
      bx(m, "renderShade", t * PASS, t * (HX - 0.3), YB, 8.5, -HZ, HZ, false);
      bx(m, "render", t * (HX - 0.3), t * HX, YB, 8.5, -HZ + 0.3, HZ - 0.3, false);
      bx(m, "brick", t * PASS, t * HX, 8.5, Y_CORN, -HZ, HZ, false);
    }
    // over the passage
    bx(m, "renderShade", -PASS - 0.1, PASS + 0.1, 6.6, 8.5, -HZ, HZ, false, true);
    bx(m, "brick", -PASS - 0.1, PASS + 0.1, 8.5, Y_CORN, -HZ, HZ, false);
    m.scope("passage vault", () => {
      // a round barrel over the passage, springing at 5 m
      const R = PASS;
      const n = 8;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI;
        const a1 = ((i + 1) / n) * Math.PI;
        const p = (a: number, z: number): Vec3 => [R * Math.cos(a), 5.0 + R * Math.sin(a) * 0.62, z];
        face(m, "renderShade", p(a0, -HZ), p(a1, -HZ), p(a1, HZ), p(a0, HZ), [-Math.cos((a0 + a1) / 2), -1, 0]);
      }
      for (const s of [-1, 1]) {
        // the lunettes closing the vault under the ceiling at each end
        const z = s * (HZ - 0.02);
        const pts: Vec3[] = [];
        for (let i = 0; i <= 8; i++) {
          const a = (i / 8) * Math.PI;
          pts.push([PASS * Math.cos(a), 5.0 + PASS * Math.sin(a) * 0.62, z]);
        }
        for (let i = 0; i < 8; i++) {
          const a = pts[i]!;
          const b = pts[i + 1]!;
          face(m, "renderShade", a, b, [b[0], 6.6, z], [a[0], 6.6, z], [0, 0, s]);
        }
      }
    });
  });
}

/** One long front's arcade between the central pavilion and a corner pavilion (t = -1, 1). */
function arcade(m: MeshBuilder, s: number, t: number): void {
  const f: Frame = { axis: "z", s, base: 0 };
  const xs = arcadeAxes().map((x) => t * x);
  const lo = Math.min(xs[0]!, xs[BAYS]!);
  const hi = Math.max(xs[0]!, xs[BAYS]!);
  m.scope("arcade", () => {
    m.scope("arches", () => {
      for (let i = 0; i < BAYS; i++) {
        const a = Math.min(xs[i]!, xs[i + 1]!);
        const b = Math.max(xs[i]!, xs[i + 1]!);
        archBay(m, f, "render", a, b, 0.32, 0.32, A_IN, A_OUT, YS, YS, YT, 0.75, 5);
      }
      // the responds against the pavilions
      for (const x of [xs[0]!, xs[BAYS]!]) {
        const inward = x === lo ? 1 : -1;
        bx(m, "render", x, x + inward * 0.35, YB, YS, s * A_IN, s * A_OUT);
      }
    });
    m.scope("columns", () => {
      for (const x of xs.slice(1, -1)) {
        const z = s * A_AX;
        bx(m, "column", x - 0.42, x + 0.42, YB, 0.6, z - 0.42, z + 0.42);
        m.loft("column", circle(10, 0.4, x, z), 0.6, circle(10, 0.3, x, z), 0.85, false);
        m.prism("column", circle(10, 0.3, x, z), 0.85, 3.8, false);
        m.loft("column", circle(10, 0.3, x, z), 3.8, circle(10, 0.46, x, z), 4.3, false);
        bx(m, "column", x - 0.48, x + 0.48, 4.3, YS, z - 0.48, z + 0.48, false, true);
      }
    });
    m.scope("vault and roof", () => {
      // the ceiling over the walk, a transverse rib at every column, the lean-to roof
      bx(m, "render", lo - 0.1, hi + 0.1, 7.95, YT, s * (HZ - 0.1), s * (A_IN + 0.05), false, true);
      for (const x of xs.slice(1, -1)) bx(m, "stone", x - 0.18, x + 0.18, 7.55, 7.95, s * HZ, s * A_IN);
      const sec: Ring = [[s * (HZ - 0.1), YT], [s * (A_IN + 0.05), YT], [s * (A_IN + 0.05), 9.1], [s * (HZ - 0.1), Y_ROOF_A]];
      m.sweep("metal", "x", sec, lo - 0.1, sec, hi + 0.1, false);
    });
    m.scope("frieze and balustrade", () => {
      bx(m, "stone", lo, hi, YT, 8.75, s * (A_IN - 0.05), s * (A_OUT + 0.18));
      // the openwork balustrade: posts with the sky between them, a coping on top
      const n = Math.round((hi - lo) / 0.9);
      for (let i = 0; i <= n; i++) {
        const x = lo + ((hi - lo) * i) / n;
        const w = i % 7 === 0 ? 0.22 : 0.1;
        bx(m, "stone", x - w, x + w, 8.75, 9.55, s * (A_IN + 0.15), s * (A_OUT - 0.05), false);
      }
      bx(m, "stone", lo, hi, 9.55, 9.75, s * (A_IN + 0.05), s * (A_OUT + 0.05));
    });
    m.scope("shop doors", () => {
      // a pointed shop door in every bay of the hall wall behind
      const g: Frame = { axis: "z", s, base: HZ };
      for (let i = 0; i < BAYS; i++) {
        const c = (xs[i]! + xs[i + 1]!) / 2;
        fslab(m, g, "door", archOutline(c - 1.1, c + 1.1, YB + 0.01, 3.6, 0.7, 1), 0.01, 0.06);
        fslab(m, g, "stone", archOutline(c - 1.35, c + 1.35, YB, 3.6, 0.7, 1), 0, 0.03);
      }
    });
  });
}

/** The brick storey's pilasters and windows and the attic over one half of a long front. */
function longWall(m: MeshBuilder, s: number, t: number): void {
  const f: Frame = { axis: "z", s, base: HZ };
  const xs = arcadeAxes().map((x) => t * x);
  const lo = Math.min(xs[0]!, xs[BAYS]!);
  const hi = Math.max(xs[0]!, xs[BAYS]!);
  m.scope("brick storey", () => {
    for (const x of xs.slice(1, -1)) fbox(m, f, "render", x - 0.32, x + 0.32, Y_ROOF_A - 0.3, Y_CORN, 0, 0.12, false);
    for (let i = 0; i < BAYS; i++) {
      const c = (xs[i]! + xs[i + 1]!) / 2;
      fslab(m, f, "stone", archOutline(c - 0.85, c + 0.85, 10.8, 13.0, 0.5, 3), 0, 0.04);
      fslab(m, f, "pane", archOutline(c - 0.6, c + 0.6, 11.0, 13.0, 0.5, 3), 0.01, 0.08);
      fbox(m, f, "stone", c - 0.95, c + 0.95, 10.65, 10.85, 0, 0.16);
    }
  });
  m.scope("cornice", () => {
    fbox(m, f, "stone", lo, hi, Y_CORN, Y_ATT, -0.1, 0.45);
  });
  attic(m, f, xs);
}

/**
 * The Renaissance attic along a facade frame over the bay edges `xs`: a scalloped
 * wall 0.55 m thick, two blind arches and a mask each bay, a pinnacle on every edge.
 */
function attic(m: MeshBuilder, f: Frame, xs: number[]): void {
  m.scope("attic", () => {
    for (let i = 0; i + 1 < xs.length; i++) {
      const a = Math.min(xs[i]!, xs[i + 1]!);
      const b = Math.max(xs[i]!, xs[i + 1]!);
      const w = b - a;
      const c = (a + b) / 2;
      // the wall with its scalloped crest: a segmental arc between the pinnacles
      const top: Array<[number, number]> = [];
      const segs = 6;
      for (let k = segs; k >= 0; k--) {
        const u = a + (w * k) / segs;
        const q = (u - c) / (w / 2);
        top.push([u, Y_WAVE + WAVE * Math.sqrt(Math.max(0, 1 - q * q * 0.85)) - WAVE * Math.sqrt(0.15)]);
      }
      fslab(m, f, "render", [[a, Y_ATT], [b, Y_ATT], ...top], -0.5, 0.05);
      // a stone coping along the crest
      for (let k = 0; k + 1 < top.length; k++) {
        // the end segments run 3 cm past the bay's edges into the next bay's coping
        const [u0, v0] = top[k]!;
        const [u1, v1] = top[k + 1]!;
        const e0 = k === 0 ? 0.03 : 0;
        const e1 = k + 2 === top.length ? 0.03 : 0;
        const du = u1 - u0;
        const dv = v1 - v0;
        const l = Math.hypot(du, dv);
        const s0: [number, number] = [u0 - (du / l) * e0, v0 - (dv / l) * e0];
        const s1: [number, number] = [u1 + (du / l) * e1, v1 + (dv / l) * e1];
        fslab(m, f, "stone", [[s0[0], s0[1] - 0.02], [s1[0], s1[1] - 0.02], [s1[0], s1[1] + 0.14], [s0[0], s0[1] + 0.14]], -0.56, 0.11);
      }
      // two blind arches a bay between stone pilasters, a mask over the middle one
      for (const q of [0.25, 0.75]) {
        const u = a + w * q;
        fslab(m, f, "renderShade", archOutline(u - 0.72, u + 0.72, 15.85, 17.6, 0.5, 2), 0.05, 0.09);
      }
      for (const q of [0, 0.5, 1]) {
        if (q === 1 && i + 2 < xs.length) continue;
        const u = a + w * q;
        fbox(m, f, "stone", u - 0.14, u + 0.14, Y_ATT, 18.75, 0.05, 0.15, false);
      }
      fslab(m, f, "stone", [[c - 0.22, 18.4], [c + 0.22, 18.4], [c + 0.3, 18.85], [c, 19.15], [c - 0.3, 18.85]], 0.05, 0.25);
      fslab(m, f, "stone", [[c - 0.1, 18.5], [c + 0.1, 18.5], [c, 18.78]], 0.25, 0.33);
    }
    m.scope("pinnacles", () => {
      for (const u of xs.slice(1, -1)) {
        const p = P(f, u, 0, -0.22);
        pinnacle(m, p[0], Y_WAVE - 0.06, p[2], 2.6);
      }
    });
  });
}

function centralPavilion(m: MeshBuilder, s: number): void {
  const f: Frame = { axis: "z", s, base: 0 };
  m.scope("central pavilion", () => {
    m.scope("arches", () => {
      // three round arches: the side ones into the arcades, the middle one the passage
      archBay(m, f, "render", -PAV, -3.6, 0.9, 1.0, A_IN + 0.1, FRONT, YB, 4.0, 8.6, 0.5, 6);
      archBay(m, f, "render", -3.6, 3.6, 1.0, 1.0, A_IN + 0.1, FRONT, YB, 4.6, 8.6, 0.5, 8);
      archBay(m, f, "render", 3.6, PAV, 1.0, 0.9, A_IN + 0.1, FRONT, YB, 4.0, 8.6, 0.5, 6);
      for (const t of [-1, 1]) {
        face(m, "render", [t * PAV, YB, s * (A_IN + 0.1)], [t * PAV, YB, s * FRONT], [t * PAV, 8.6, s * FRONT], [t * PAV, 8.6, s * (A_IN + 0.1)], [t, 0, 0]);
      }
      // the frieze over the arches, on the arcade's frieze line
      fbox(m, f, "stone", -PAV - 0.15, PAV + 0.15, 8.6, 9.1, FRONT - 0.2, FRONT + 0.18);
    });
    m.scope("body", () => {
      bx(m, "render", -PAV, PAV, 8.6, Y_PAV, s * (HZ - 0.6), s * FRONT, false, true);
      const g: Frame = { axis: "z", s, base: FRONT };
      for (const t of [-1, 1]) {
        // corner pilasters, the brick panels and their windows
        fbox(m, g, "stone", t * (PAV + 0.12), t * (PAV - 0.85), YB, Y_PAV - 0.6, -0.1, 0.12, false);
        fbox(m, g, "brick", t * 7.4, t * 4.3, 9.4, 18.8, 0, 0.03, false);
        fslab(m, g, "stone", archOutline(t * 5.85 - 0.8, t * 5.85 + 0.8, 11.0, 13.8, 0.5, 4), 0.03, 0.07);
        fslab(m, g, "pane", archOutline(t * 5.85 - 0.55, t * 5.85 + 0.55, 11.2, 13.8, 0.5, 4), 0.04, 0.1);
        fslab(m, g, "stone", circle(10, 0.75, t * 5.85, 16.6).map(([u, y]) => [u, y] as [number, number]), 0.03, 0.07);
        fslab(m, g, "pane", circle(10, 0.5, t * 5.85, 16.6).map(([u, y]) => [u, y] as [number, number]), 0.04, 0.1);
        // the pilasters framing the middle
        fbox(m, g, "stone", t * 3.55, t * 3.05, 9.1, Y_PAV - 0.6, 0, 0.1, false);
      }
      // the triple window of the hall's great room over the passage
      for (const u of [-1.9, 0, 1.9]) {
        fslab(m, g, "stone", archOutline(u - 0.75, u + 0.75, 10.4, 14.8, 0.5, 4), 0, 0.05);
        fslab(m, g, "pane", archOutline(u - 0.55, u + 0.55, 10.6, 14.8, 0.5, 4), 0.01, 0.09);
      }
      fbox(m, g, "stone", -2.9, 2.9, 10.2, 10.45, 0, 0.25);
      fbox(m, g, "renderShade", -2.6, 2.6, 16.6, 18.6, 0, 0.05, false);
      // the cornice, wrapping round the sides
      bx(m, "stone", -PAV - 0.3, PAV + 0.3, Y_PAV - 0.6, Y_PAV, s * (HZ - 0.4), s * (FRONT + 0.3));
    });
    m.scope("roof", () => {
      hipRoof(m, "roof", -PAV + 0.4, PAV - 0.4, Math.min(s * (HZ - 0.4), s * (FRONT - 1.6)), Math.max(s * (HZ - 0.4), s * (FRONT - 1.6)), Y_PAV, 0.85);
    });
    m.scope("crest", () => {
      const g: Frame = { axis: "z", s, base: FRONT };
      // a low attic with corner pinnacles, the aedicule with its scrolls, the pediment and finial
      fbox(m, g, "render", -PAV, PAV, Y_PAV, 21.6, -1.5, -0.05);
      fbox(m, g, "stone", -PAV - 0.1, PAV + 0.1, 21.6, 21.85, -1.6, 0.05);
      for (const t of [-1, 1]) {
        const p = P(g, t * (PAV - 0.35), 0, -0.6);
        pinnacle(m, p[0], 21.85, p[2], 3.0);
        const q = P(g, t * 5.6, 0, -0.6);
        pinnacle(m, q[0], 21.85, q[2], 2.2);
      }
      fbox(m, g, "render", -3.4, 3.4, 21.85, 25.4, -1.2, -0.1);
      for (const t of [-1, 1]) {
        fbox(m, g, "stone", t * 3.5, t * 2.85, 21.85, 25.4, -1.25, 0.0, false);
        // the scroll: a quarter disc falling to the attic
        const arc: Array<[number, number]> = [];
        for (let k = 0; k <= 6; k++) {
          const a = (k / 6) * (Math.PI / 2);
          arc.push([t * (3.4 + 2.4 * Math.cos(a)), 21.85 + 2.6 * Math.sin(a)]);
        }
        fslab(m, g, "render", [[t * 3.4, 21.85], ...arc], -1.0, -0.25);
        fslab(m, g, "stone", [[t * 5.55, 21.8], [t * 5.85, 21.8], [t * 5.85, 22.25], [t * 5.55, 22.25]], -1.05, -0.15);
      }
      fslab(m, g, "pane", archOutline(-0.8, 0.8, 22.4, 24.0, 0.5, 4), -0.09, -0.06);
      fslab(m, g, "stone", archOutline(-1.05, 1.05, 22.25, 24.0, 0.5, 4), -0.1, -0.08);
      fbox(m, g, "stone", -3.7, 3.7, 25.4, 25.75, -1.35, 0.1);
      fslab(m, g, "render", [[-3.4, 25.75], [3.4, 25.75], [0, 27.5]], -1.1, -0.15);
      fslab(m, g, "stone", [[-3.7, 25.7], [-3.3, 25.7], [0, 27.45], [0, 27.85]], -1.2, -0.05);
      fslab(m, g, "stone", [[3.7, 25.7], [3.3, 25.7], [0, 27.45], [0, 27.85]], -1.2, -0.05);
      for (const t of [-1, 1]) {
        const q = P(g, t * 3.4, 0, -0.65);
        pinnacle(m, q[0], 25.75, q[2], 2.2);
      }
      const c = P(g, 0, 0, -0.65);
      pinnacle(m, c[0], 27.55, c[2], 2.5);
    });
  });
}

function cornerPavilion(m: MeshBuilder, s: number, t: number): void {
  const x0 = t * TOW;
  const x1 = t * TOW_X;
  const xc = (x0 + x1) / 2;
  const z0 = s * (HZ - 0.6);
  const z1 = s * FRONT;
  const zc = s * ((HZ - 0.6 + FRONT) / 2);
  m.scope("corner pavilion", () => {
    bx(m, "render", x0, x1, YB, Y_PAV, z0, z1, false);
    const front: Frame = { axis: "z", s, base: FRONT };
    const end: Frame = { axis: "x", s: t, base: TOW_X };
    // quoins on the outer corner, the bands on the arcade's lines
    bx(m, "stone", x1 - t * 0.7, x1 + t * 0.08, YB, Y_PAV - 0.6, z1 - s * 0.7, z1 + s * 0.08, false);
    bx(m, "stone", x0 - t * 0.12, x1 + t * 0.12, 8.6, 9.1, s * HZ, z1 + s * 0.15);
    bx(m, "stone", x0 - t * 0.3, x1 + t * 0.3, Y_PAV - 0.6, Y_PAV, s * HZ, z1 + s * 0.3);
    // a door and windows on the front, windows on the end
    fslab(m, front, "door", archOutline(xc - 1.0, xc + 1.0, YB + 0.01, 3.0, 0.5, 4), 0.01, 0.06);
    fslab(m, front, "stone", archOutline(xc - 1.3, xc + 1.3, YB, 3.0, 0.5, 4), 0, 0.03);
    for (const [fr, u] of [[front, xc], [end, zc]] as Array<[Frame, number]>) {
      for (const y of [10.6, 15.0]) {
        fslab(m, fr, "stone", archOutline(u - 0.85, u + 0.85, y, y + 2.3, 0.5, 4), 0, 0.04);
        fslab(m, fr, "pane", archOutline(u - 0.6, u + 0.6, y + 0.2, y + 2.3, 0.5, 4), 0.01, 0.08);
      }
    }
    fslab(m, end, "stone", archOutline(zc - 0.85, zc + 0.85, 4.0, 6.0, 0.5, 4), 0, 0.04);
    fslab(m, end, "pane", archOutline(zc - 0.6, zc + 0.6, 4.2, 6.0, 0.5, 4), 0.01, 0.08);
    // a parapet on top round a terrace
    const ix0 = x0 + t * 0.35;
    const ix1 = x1 - t * 0.35;
    const iz0 = z0 + s * 0.35;
    const iz1 = z1 - s * 0.35;
    bx(m, "render", x0, x1, Y_PAV, 21.2, z1, iz1);
    bx(m, "render", x0, x1, Y_PAV, 21.2, z0, iz0);
    bx(m, "render", x0, ix0, Y_PAV, 21.2, iz0, iz1);
    bx(m, "render", x1, ix1, Y_PAV, 21.2, iz0, iz1);
    m.cap("roof", rect(Math.abs(ix1 - ix0), Math.abs(iz1 - iz0), xc, zc), Y_PAV + 0.03);
    for (const px of [x0 + t * 0.2, x1 - t * 0.2]) for (const pz of [z0 + s * 0.2, z1 - s * 0.2]) pinnacle(m, px, 21.2, pz, 1.8);
    m.scope("turret", () => {
      const r = 1.75;
      m.prism("render", circle(8, r, xc, zc), Y_PAV, 23.8, false);
      for (let k = 0; k < 8; k++) {
        const a = (k / 8) * Math.PI * 2;
        const ap = r * Math.cos(Math.PI / 8) + 0.03;
        const px = xc + ap * Math.cos(a);
        const pz = zc - ap * Math.sin(a);
        // a narrow window on every face of the drum
        const nx = Math.cos(a);
        const nz = -Math.sin(a);
        const tx = -nz;
        const tz = nx;
        const w = 0.32;
        m.slab("pane", [[px - tx * w, 22.0, pz - tz * w], [px + tx * w, 22.0, pz + tz * w], [px + tx * w, 23.2, pz + tz * w], [px, 23.5, pz], [px - tx * w, 23.2, pz - tz * w]], [-nx * 0.06, 0, -nz * 0.06]);
      }
      m.loft("stone", circle(8, r + 0.15, xc, zc), 23.8, circle(8, r + 0.15, xc, zc), 24.1, false);
      const prof: Array<[number, number]> = [[r + 0.15, 24.1], [r * 0.98, 24.9], [r * 0.8, 25.6], [r * 0.5, 26.1], [0.42, 26.3]];
      for (let k = 0; k + 1 < prof.length; k++) m.loft("metal", circle(8, prof[k]![0], xc, zc), prof[k]![1], circle(8, prof[k + 1]![0], xc, zc), prof[k + 1]![1], false);
      m.prism("metal", circle(8, 0.42, xc, zc), 26.3, 26.9, false);
      m.spire("metal", circle(8, 0.42, xc, zc), 26.9, 28.3);
    });
  });
}

/** The stair tower at a short end (t = -1, 1) and the attic over the end wall. */
function endFront(m: MeshBuilder, t: number): void {
  const x0 = t * (HX - 0.3);
  const x1 = t * (HX + 4.2);
  const zw = 4.5;
  const g: Frame = { axis: "x", s: t, base: HX + 4.2 };
  m.scope("stair tower", () => {
    bx(m, "render", x0, x1, YB, 19.4, -zw, zw, false);
    fbox(m, g, "brick", -3.6, 3.6, 9.4, 18.6, 0, 0.03, false);
    fbox(m, g, "stone", -zw - 0.12, -zw + 0.7, YB, 18.8, -0.1, 0.12, false);
    fbox(m, g, "stone", zw - 0.7, zw + 0.12, YB, 18.8, -0.1, 0.12, false);
    bx(m, "stone", t * HX, x1 + t * 0.18, 8.6, 9.1, -zw - 0.15, zw + 0.15);
    bx(m, "stone", t * HX, x1 + t * 0.3, 18.8, 19.4, -zw - 0.3, zw + 0.3);
    // the portal and the stair windows
    fslab(m, g, "door", archOutline(-1.3, 1.3, YB + 0.01, 4.0, 0.5, 5), 0.01, 0.06);
    fslab(m, g, "stone", archOutline(-1.75, 1.75, YB, 4.0, 0.5, 5), 0, 0.03);
    for (const y of [10.4, 14.6]) {
      for (const u of [-1.6, 1.6]) {
        fslab(m, g, "stone", archOutline(u - 0.75, u + 0.75, y, y + 2.2, 0.5, 4), 0.03, 0.07);
        fslab(m, g, "pane", archOutline(u - 0.52, u + 0.52, y + 0.2, y + 2.2, 0.5, 4), 0.04, 0.11);
      }
    }
    // the gable: an attic, a stepped pediment and the finial
    fbox(m, g, "render", -zw, zw, 19.4, 20.6, -1.2, -0.05);
    fbox(m, g, "stone", -zw - 0.1, zw + 0.1, 20.6, 20.85, -1.3, 0.05);
    fslab(m, g, "render", [[-3.0, 20.85], [3.0, 20.85], [3.0, 22.0], [1.6, 23.2], [-1.6, 23.2], [-3.0, 22.0]], -1.0, -0.1);
    fslab(m, g, "renderShade", archOutline(-0.7, 0.7, 21.2, 22.3, 0.5, 4), -0.1, -0.06);
    fbox(m, g, "stone", -1.8, 1.8, 23.2, 23.45, -1.1, 0.0);
    for (const u of [-zw + 0.35, zw - 0.35, -3.0, 3.0]) {
      const p = P(g, u, 0, -0.6);
      pinnacle(m, p[0], 20.85, p[2], Math.abs(u) > 3.5 ? 2.0 : 1.6);
    }
    const c = P(g, 0, 0, -0.55);
    pinnacle(m, c[0], 23.45, c[2], 2.4);
    hipRoof(m, "roof", Math.min(x0, t * (HX + 2.9)), Math.max(x0, t * (HX + 2.9)), -zw + 0.2, zw - 0.2, 19.4, 0.8);
  });
  m.scope("end wall", () => {
    const f: Frame = { axis: "x", s: t, base: HX };
    for (const z of [-1, 1]) {
      const zs = [z * zw, z * (HZ - 0.6)];
      // windows on the brick storey of the end wall, the cornice, the attic
      const c = (zs[0]! + zs[1]!) / 2;
      fslab(m, f, "stone", archOutline(c - 0.8, c + 0.8, 10.8, 13.0, 0.5, 4), 0, 0.04);
      fslab(m, f, "pane", archOutline(c - 0.56, c + 0.56, 11.0, 13.0, 0.5, 4), 0.01, 0.08);
      fslab(m, f, "door", archOutline(c - 1.0, c + 1.0, YB + 0.01, 3.4, 0.5, 4), 0.01, 0.06);
      fbox(m, f, "stone", Math.min(zs[0]!, zs[1]!), Math.max(zs[0]!, zs[1]!), Y_CORN, Y_ATT, -0.1, 0.45);
      attic(m, f, zs);
    }
  });
}

function hallRoof(m: MeshBuilder): void {
  m.scope("hall roof", () => {
    hipRoof(m, "roof", -HX + 0.45, HX - 0.45, -HZ + 0.45, HZ - 0.45, Y_ATT, 0.6);
  });
}

export function clothHall(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  m.scope("cloth hall", () => {
    plinth(m);
    hallBody(m);
    hallRoof(m);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "south front" : "north front", () => {
        centralPavilion(m, s);
        for (const t of [-1, 1]) {
          arcade(m, s, t);
          longWall(m, s, t);
          cornerPavilion(m, s, t);
        }
      });
    }
    for (const t of [-1, 1]) m.scope(t > 0 ? "east end" : "west end", () => endFront(m, t));
  });
  return m;
}

export function clothHallLod(): MeshBuilder {
  const m = new MeshBuilder(PALETTE);
  lodBox(m, "paving", 0, 0, 2 * (HX + 5.2), 2 * (FRONT + 0.9), 0, YB);
  // the arcades as a dark band under the stone frieze, the brick storey, the attic
  m.box("renderShade", 0, 0, 2 * TOW, 2 * A_OUT, YB, 8.4);
  m.box("stone", 0, 0, 2 * TOW, 2 * A_OUT + 0.3, 8.4, 9.7);
  m.box("brick", 0, 0, 2 * HX, 2 * HZ, 9.7, Y_CORN);
  m.box("render", 0, 0, 2 * HX + 0.2, 2 * HZ + 0.2, Y_CORN, 20.0);
  const ridge = Y_ATT + (HZ - 0.45) * 0.6;
  const sec: Ring = [[-HZ + 0.4, 19.98], [HZ - 0.4, 19.98], [0, ridge]];
  m.sweep("roof", "x", sec, -HX + 9, sec, HX - 9);
  for (const s of [-1, 1]) {
    // the central pavilion with its crest and finial
    const zc = s * ((HZ - 0.6 + FRONT) / 2);
    m.box("render", 0, zc, 2 * PAV, FRONT - HZ + 0.6, YB, Y_PAV);
    m.box("render", 0, s * (FRONT - 0.7), 6.8, 1.2, Y_PAV, 25.6);
    m.loft("stone", rect(1.6, 1.0, 0, s * (FRONT - 0.7)), 25.6, rect(0.2, 0.2, 0, s * (FRONT - 0.7)), 29.9);
    for (const t of [-1, 1]) {
      // the corner pavilions and their domed turrets
      const xc = t * (TOW + TOW_X) / 2;
      m.box("render", xc, zc, TOW_X - TOW, FRONT - HZ + 0.6, YB, 21.2);
      m.loft("metal", ngon(6, 1.8, 0, xc, zc), 21.2, ngon(6, 0.25, 0, xc, zc), 28.2);
    }
  }
  for (const t of [-1, 1]) {
    m.box("render", t * (HX + 1.95), 0, 4.5, 9, YB, 20.6);
    m.loft("render", rect(1.0, 6.0, t * (HX + 3.7)), 20.6, rect(1.0, 1.0, t * (HX + 3.7)), 23.4);
  }
  return m;
}

export const CLOTH_HALL: ProceduralDesign[] = [
  {
    id: "bld-cloth-hall",
    game: { plaza: { cities: ["town", "city"], layouts: ["rect"], fit: "footprint" } },
    title: "Krakow Cloth Hall",
    build: clothHall,
    buildLod: clothHallLod,
    references: "cloth-hall",
    catalog: PLAZA_CATALOG,
  },
];
