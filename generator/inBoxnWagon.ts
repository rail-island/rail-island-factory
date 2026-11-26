// Indian Railways' BOXN open wagon and BCNA covered wagon (the `unit` of
// proc-vehicle-ir-boxn-wagon), measured from photographs (assets/ir-boxn-wagon/SOURCES.md)
// and the published figures:
//   BOXN - 10.713 m over the couplers, 9.784 m inside, 3.2 m over the side stanchions,
//     3.233 m high over rail, bogie centres 6.524 m; the side in six panels between seven
//     hat-section stanchions, each panel with three pressed horizontal ribs, two hinged
//     ladder frames a side; the coal heaped over the top chord.
//   BCNA - 15.429 m over the couplers, 14.5 m inside, bogie centres 10.15 m, 4.27 m high;
//     two sliding doors a side (2.1 m wide, centred 3.6 m from the middle) each running
//     outward on a top track, vertical stanchions between the doors only, the arched roof
//     over a cant rail.
// Both on CASNUB-22 three-piece bogies (1,000 mm wheels, 2.0 m wheelbase) with centre
// buffer couplers, in IR wagon brown with white stencilling, yellow plates and the white
// and red striped corner markings on the ends. Listed in worldWagons.ts.

import { MeshBuilder, ngon, type MaterialSpec } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { coil, extrude, paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { US_PALETTE, knuckleCoupler, paintedSweep, sideText } from "./usHoodKit.ts";
import { enumParam } from "./emuParts.ts";
import type { LodBand, LodPart } from "./lodKit.ts";
import { bogieParts, fitUnit, type UnitBody } from "./lodUnits.ts";
import { BULK_LOOKS, LOAD_PALETTE, bulkLoads, loadLodPart } from "./loadKit.ts";
import { lodRoofBox } from "./lodKit.ts";

const COUPLER_Y = 0.88;
/** The same parameter as worldWagons.ts' WAGON_PARAMS (kept here to avoid an import cycle). */
const PARAMS: ParamSpec[] = [enumParam("unit", "Wagon", { open: "Open wagon", covered: "Covered wagon" })];

/** IR wagon brown (red oxide), the white stencils, the yellow plates, the red of the corner stripes. */
const PALETTE: Record<string, MaterialSpec> = {
  ...US_PALETTE,
  wgBody: paint("#6e3326", 0.78),
  wgFrame: paint("#4a2a22", 0.85),
  /** The stanchions, ribs and tracks: the body's paint a shade darker, as they read in the photos' side light. */
  wgRib: paint("#5a281e", 0.8),
  wgRoof: paint("#7a4234", 0.85),
  wgPanel: paint("#783829", 0.78),
  wgInk: paint("#e8e6df"),
  wgPlate: paint("#e2b62a", 0.5),
  wgRed: paint("#b8281f", 0.5),
  ...LOAD_PALETTE,
};

/** Shared heights: the side sheet's foot, the floor. */
const SIDE_Y0 = 1.0;
const DECAL = 0.006;

// ---------------------------------------------------------------------------
// Small helpers

/** A convex polygon (u, v) clipped to u + v in [a, b]. */
function clipBand(poly: Array<[number, number]>, a: number, b: number): Array<[number, number]> {
  const clip = (p: Array<[number, number]>, f: (q: [number, number]) => number): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (let i = 0; i < p.length; i++) {
      const P = p[i]!, Q = p[(i + 1) % p.length]!;
      const fp = f(P), fq = f(Q);
      if (fp >= 0) out.push(P);
      if (fp * fq < 0) { const t = fp / (fp - fq); out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]); }
    }
    return out;
  };
  return clip(clip(poly, (q) => q[0] + q[1] - a), (q) => b - q[0] - q[1]);
}

/**
 * The white and red diagonal-striped marking on an end's upper corner: a w x h square on the end
 * face x = e * xf, its outer edge at |z| = zo on side s, its top at y1. Tiled (no stripe lies on another).
 */
function cornerStripes(m: MeshBuilder, e: number, xf: number, s: number, zo: number, y1: number, w: number, h: number): void {
  const sq: Array<[number, number]> = [[0, 0], [w, 0], [w, h], [0, h]];
  const k = 5, step = (w + h) / k;
  for (let i = 0; i < k; i++) {
    const p = clipBand(sq, i * step, (i + 1) * step);
    if (p.length < 3) continue;
    const P = (q: [number, number]): Vec3 => [e * (xf + DECAL), y1 - h + q[1], s * (zo - q[0])];
    const pts: Vec3[] = [];
    for (let j = 1; j + 1 < p.length; j++) pts.push(P(p[0]!), P(p[j]!), P(p[j + 1]!));
    m.facets(i % 2 === 0 ? "wgInk" : "wgRed", pts, [e, 0, 0]);
  }
}

/** A flat decal on the side z = s * zw: a rectangle or (n > 4) a disc, centred (xc, yc). */
function sideDecal(m: MeshBuilder, mat: string, s: number, zw: number, xc: number, yc: number, w: number, h: number, n = 4): void {
  const ring: Array<[number, number]> = n === 4 ? [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    : Array.from({ length: n }, (_, i) => [Math.cos((2 * Math.PI * i) / n) * w / 2, Math.sin((2 * Math.PI * i) / n) * h / 2] as [number, number]);
  const pts: Vec3[] = [];
  const P = (q: [number, number]): Vec3 => [xc + q[0], yc + q[1], s * zw];
  for (let j = 1; j + 1 < ring.length; j++) pts.push(P(ring[0]!), P(ring[j]!), P(ring[j + 1]!));
  m.facets(mat, pts, [0, 0, s]);
}

/** A part standing out of the side z = s * z0 by `out`, embedded 0.01 into it. */
const proud = (s: number, z0: number, out: number): [number, number] => side(s, z0 - 0.01, z0 + out);

// ---------------------------------------------------------------------------
// The CASNUB-22 bogie

const WHEEL_R = 0.5;
const AXLE_HALF = 1.0;

/** A CASNUB-22 three-piece bogie at xc: cast side frames with the spring nest window, the bolster, wheelsets with roller bearings, brake beams. */
function casnub(m: MeshBuilder, xc: number): void {
  const N = 20, r = WHEEL_R, a = AXLE_HALF;
  const ay = r * Math.cos(Math.PI / N);
  for (const dx of [-a, a])
    m.scope("wheelset", () => {
      const x = xc + dx;
      const axle = ngon(8, 0.085, 0, x, ay);
      m.sweep("steel", "z", axle, -0.95, axle, 0.95);
      for (const s of [-1, 1]) {
        extrude(m, "steel", "z", ngon(N, r, Math.PI / N, x, ay), side(s, 0.665, 0.8));
        extrude(m, "wheel", "z", ngon(16, r * 0.82, 0, x, ay), side(s, 0.8, 0.815));
        m.scope("roller bearing", () => {
          extrude(m, "spring", "z", ngon(10, 0.12, 0, x, ay), side(s, 0.95, 1.13));
          extrude(m, "bogie", "z", ngon(10, 0.08, 0, x, ay), side(s, 1.13, 1.16));
          block(m, "bogie", x - 0.15, x + 0.15, ay + 0.11, ay + 0.17, ...side(s, 0.94, 1.09));
        });
      }
    });
  m.scope("side frames", () => {
    for (const s of [-1, 1]) {
      const z = side(s, 0.95, 1.08);
      for (const k of [-1, 1]) {
        const X = (u: number): number => xc + k * u;
        const piece = (pts: Array<[number, number]>): void => extrude(m, "bogie", "z", (k > 0 ? pts : [...pts].reverse()).map(([u, y]): [number, number] => [X(u), y]), z);
        // the pedestal over the bearing, the top member rising to the column, the tension member under the window
        piece([[a - 0.22, ay + 0.17], [a + 0.2, ay + 0.17], [a + 0.28, ay + 0.22], [a + 0.28, ay + 0.31], [a - 0.22, ay + 0.35]]);
        piece([[0.46, 0.74], [a - 0.22, ay + 0.17], [a - 0.22, ay + 0.35], [0.46, 0.93]]);
        piece([[0.46, 0.25], [a - 0.2, ay + 0.02], [a - 0.2, ay + 0.17], [0.46, 0.4]]);
        piece([[0.33, 0.25], [0.46, 0.25], [0.46, 0.93], [0.33, 0.93]]);
        for (const j of [-1, 1]) block(m, "bogie", Math.min(X(a + j * 0.16), X(a + j * 0.22)), Math.max(X(a + j * 0.16), X(a + j * 0.22)), ay + 0.04, ay + 0.17, ...z);
      }
      block(m, "bogie", xc - 0.33, xc + 0.33, 0.25, 0.39, ...z);
      block(m, "bogie", xc - 0.33, xc + 0.33, 0.85, 0.93, ...z);
      m.scope("springs", () => { for (const d of [-0.2, 0, 0.2]) coil(m, "spring", xc + d, s * 1.015, 0.39, 0.6, 0.085, 2, 6); });
    }
  });
  m.scope("bolster", () => {
    block(m, "bogie", xc - 0.28, xc + 0.28, 0.6, 0.84, -1.1, 1.1);
    for (const s of [-1, 1]) for (const d of [-1, 1]) block(m, "spring", Math.min(xc + d * 0.28, xc + d * 0.32), Math.max(xc + d * 0.28, xc + d * 0.32), 0.64, 0.84, ...side(s, 0.96, 1.09));
  });
  m.scope("brake beams", () => { for (const d of [-1, 1]) block(m, "bogie", xc + d * 0.5 - 0.05, xc + d * 0.5 + 0.05, 0.42, 0.54, -0.88, 0.88); });
}

// ---------------------------------------------------------------------------
// The underframe both wagons share

/** The sole bars under the side sheet, the centre sill, the end sills, the air brake cylinder and reservoir, corner steps. */
function underframe(m: MeshBuilder, body: number, half: number, centre: number): void {
  m.scope("underframe", () => {
    block(m, "wgFrame", -body + 0.1, body - 0.1, 0.78, SIDE_Y0 + 0.02, -0.22, 0.22);
    for (const s of [-1, 1]) block(m, "wgFrame", -body + 0.05, body - 0.05, 0.86, SIDE_Y0 + 0.02, ...side(s, half - 0.22, half - 0.08));
    // the floor plate between them, the cross bearers at the bogie centres
    block(m, "wgFrame", -body + 0.05, body - 0.05, SIDE_Y0 - 0.02, SIDE_Y0 + 0.04, -half + 0.08, half - 0.08);
    for (const c of [-centre, centre]) block(m, "wgFrame", c - 0.2, c + 0.2, 0.84, SIDE_Y0, -half + 0.2, half - 0.2);
  });
  m.scope("end sills", () => {
    for (const e of [-1, 1]) {
      const x0 = e * (body - 0.05), x1 = e * (body + 0.09);
      block(m, "wgBody", Math.min(x0, x1), Math.max(x0, x1), 0.7, SIDE_Y0 + 0.08, -half + 0.04, half - 0.04);
    }
  });
  m.scope("air brake", () => {
    const cyl = ngon(10, 0.18, 0, 0.42, 0.7);
    m.sweep("black", "x", cyl, 0.2, cyl, 0.75);
    const res = ngon(10, 0.2, 0, -0.45, 0.68);
    m.sweep("black", "x", res, -1.4, res, -0.4);
    const pipe = ngon(6, 0.03, 0, 0, 0.8);
    m.sweep("black", "x", pipe, -body + 0.1, pipe, body - 0.1);
  });
  m.scope("steps", () => {
    for (const e of [-1, 1]) for (const s of [-1, 1]) {
      const xa = e * (body - 0.42), xb = e * (body - 0.12);
      const [z0, z1] = side(s, half - 0.12, half + 0.02);
      block(m, "wgBody", Math.min(xa, xb), Math.max(xa, xb), 0.5, 0.55, z0, z1);
      for (const x of [xa, xb]) block(m, "wgBody", x - 0.02, x + 0.02, 0.5, 0.9, z0, z1);
    }
  });
}

function trucksAndCouplers(m: MeshBuilder, length: number, body: number, centre: number): void {
  m.scope("trucks", () => {
    m.scope("front truck", () => m.bogie(() => casnub(m, centre)));
    m.scope("rear truck", () => m.bogie(() => casnub(m, -centre)));
  });
  for (const e of [1, -1]) m.scope(e > 0 ? "front coupler" : "rear coupler", () => knuckleCoupler(m, e, body + 0.09, length / 2, COUPLER_Y));
}

/** End stiffeners: two horizontal ribs across and two vertical posts, on the end face x = e * body. */
function endWall(m: MeshBuilder, e: number, body: number, half: number, y1: number, ribs: readonly number[]): void {
  const along = (out: number): [number, number] => (e > 0 ? [body - 0.01, body + out] : [-body - out, -body + 0.01]);
  for (const y of ribs) block(m, "wgRib", ...along(0.04), y - 0.04, y + 0.04, -half + 0.12, half - 0.12);
  for (const z of [-0.75, 0.75]) block(m, "wgRib", ...along(0.07), SIDE_Y0 - 0.03, y1, z - 0.06, z + 0.06);
  for (const s of [-1, 1]) cornerStripes(m, e, body + 0.07, s, half - 0.13, y1 - 0.08, 0.36, 0.36);
}

// ---------------------------------------------------------------------------
// BOXN

export const BOXN = { length: 10.713, body: 4.92, half: 1.5, top: 3.233, centre: 3.262, number: "ER 82153" };
/** The six panels' rib heights (pressed, between the stanchions). */
const BOXN_RIBS = [2.42, 1.72, 1.18];
/** The BOXN's floor, inside its sheets. */
const BOXN_FLOOR = SIDE_Y0 + 0.12;
/** Hinged ladder frames, panel indices from the left end as seen from each side. */
const BOXN_LADDERS = [2, 4];

function boxn(m: MeshBuilder): void {
  const { body, half, top } = BOXN;
  const chord = top - 0.13;
  m.scope("body", () => {
    // the open box: its floor, side and end sheets, seen into from above (the loads stand on the floor)
    m.scope("floor", () => block(m, "wgFrame", -body + 0.04, body - 0.04, SIDE_Y0, BOXN_FLOOR, -half + 0.04, half - 0.04));
    m.scope("sheets", () => {
      for (const s of [-1, 1]) block(m, "wgBody", -body, body, SIDE_Y0, chord + 0.01, ...side(s, half - 0.04, half));
      for (const e of [-1, 1]) block(m, "wgBody", ...(e > 0 ? [body - 0.04, body] as const : [-body, -body + 0.04] as const), SIDE_Y0, chord + 0.01, -half + 0.04, half - 0.04);
    });
    m.scope("top chord", () => {
      for (const s of [-1, 1]) block(m, "wgBody", -body - 0.08, body + 0.08, chord, top, ...side(s, half - 0.06, half + 0.08));
      for (const e of [-1, 1]) block(m, "wgBody", ...(e > 0 ? [body - 0.06, body + 0.08] as const : [-body - 0.08, -body + 0.06] as const), chord, top, -half + 0.06, half - 0.06);
    });
    const pitch = (2 * body - 0.16) / 6;
    const posts = Array.from({ length: 7 }, (_, i) => -body + 0.08 + i * pitch);
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        // the stanchions: corner posts wrapping the end, five between
        posts.forEach((x, i) => {
          const w = i === 0 || i === 6 ? 0.09 : 0.07;
          const x0 = i === 0 ? -body - 0.08 : x - w, x1 = i === 6 ? body + 0.08 : x + w;
          block(m, "wgRib", x0, x1, SIDE_Y0 - 0.06, chord - 0.002, ...proud(s, half, 0.08));
        });
        // the panels' ribs and ladder frames; panel p counted from this side's left end
        for (let i = 0; i < 6; i++) {
          const p = s > 0 ? i : 5 - i;
          const xa = posts[i]! + 0.07, xb = posts[i + 1]! - 0.07;
          const ladder = BOXN_LADDERS.includes(p);
          for (const y of BOXN_RIBS) if (!ladder || y > 2) block(m, "wgRib", xa, xb, y - 0.035, y + 0.035, ...proud(s, half, 0.035));
          if (ladder) m.scope("ladder", () => {
            const xm = (xa + xb) / 2;
            for (const d of [-0.32, 0.32]) block(m, "wgRib", xm + d - 0.025, xm + d + 0.025, 1.08, 2.06, ...proud(s, half, 0.05));
            for (const y of [2.04, 1.62, 1.12]) block(m, "wgRib", xm - 0.42, xm + 0.42, y - 0.025, y + 0.025, ...proud(s, half, 0.065));
            for (const d of [-0.22, 0.22]) block(m, "black", xm + d - 0.04, xm + d + 0.04, 2.06, 2.16, ...proud(s, half, 0.075));
          });
        }
        // stencils and plates, placed alike on both sides turned end for end
        const X = (u: number): number => s * u;
        const panel = (i: number): number => s * ((posts[i]! + posts[i + 1]!) / 2);
        sideText(m, "wgInk", "ER", s, half + DECAL, panel(s > 0 ? 0 : 5), 2.62, 0.26);
        sideText(m, "wgInk", "BOXN", s, half + DECAL, panel(s > 0 ? 1 : 4), 2.82, 0.14);
        sideText(m, "wgInk", BOXN.number, s, half + DECAL, panel(s > 0 ? 1 : 4), 2.52, 0.18, 0.11, 0.035);
        sideDecal(m, "wgPlate", s, half + DECAL, X(posts[0]! + pitch / 2), 1.42, 0.62, 0.36);
        sideDecal(m, "wgPlate", s, half + DECAL, X(posts[3]! + pitch / 2), 2.0, 0.36, 0.24);
        sideDecal(m, "wgPlate", s, half + DECAL, X(posts[5]! + pitch / 2), 2.02, 0.44, 0.44, 14);
      });
    }
    for (const e of [-1, 1]) m.scope(e > 0 ? "front end" : "rear end", () => endWall(m, e, body, half, chord, BOXN_RIBS.slice(0, 2)));
  });
  // the loads heaped over the top chord: a mound of coal, iron ore, grain, stone or sand falling to the chord on
  // every side, each a hidden load part on the floor (docs/models/loads.md)
  bulkLoads(m, [0, BOXN_FLOOR, 0], (mat) => m.scope("heap", () => {
    const nx = 8, nz = 6, hx = body - 0.04, hz = half - 0.04, y0 = chord + 0.03, rise = 0.32;
    const H = (i: number, j: number): Vec3 => {
      const u = -1 + (2 * i) / nx, w = -1 + (2 * j) / nz;
      const f = Math.min(1, 1.25 * (1 - Math.abs(u) ** 4)) * (1 - w * w);
      return [u * hx, y0 + rise * Math.max(0, f), w * hz];
    };
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) m.quad(mat, H(i, j), H(i, j + 1), H(i + 1, j + 1), H(i + 1, j));
  }));
}

// ---------------------------------------------------------------------------
// BCNA

export const BCNA = { length: 15.429, body: 7.25, half: 1.52, eave: 3.72, rise: 0.55, centre: 5.075, number: "SR 70154" };
/** The doors: centre |x|, width, top. */
const BCNA_DOOR = { x: 3.6, w: 2.1, top: 3.6 };

/** The covered body's section: the sides to the eaves, a circular arc over them. */
function bcnaSection(half: number, y0: number, eave: number, rise: number, n = 8): Array<[number, number]> {
  const R = (rise * rise + half * half) / (2 * rise), cy = eave + rise - R, th = Math.asin(half / R);
  const arc = Array.from({ length: n + 1 }, (_, i) => { const t = th - (2 * th * i) / n; return [R * Math.sin(t), cy + R * Math.cos(t)] as [number, number]; });
  return [[-half, y0], [half, y0], ...arc];
}

function bcna(m: MeshBuilder): void {
  const { body, half, eave, rise } = BCNA;
  const D = BCNA_DOOR;
  m.scope("body", () => {
    const sec = bcnaSection(half, SIDE_Y0, eave, rise);
    paintedSweep(m, "x", sec, -body, body, { bands: [[0, 9, "wgBody"]], roofFrom: eave + 0.01, roof: "wgRoof" });
    // the cant rail under the roof's edge, the roof's overhang at the ends
    for (const s of [-1, 1]) block(m, "wgRib", -body - 0.06, body + 0.06, eave - 0.07, eave + 0.01, ...proud(s, half, 0.08));
    for (const e of [-1, 1]) {
      const big = bcnaSection(half + 0.04, eave - 0.1, eave + 0.02, rise + 0.02);
      const [a0, a1] = e > 0 ? [body - 0.02, body + 0.07] : [-body - 0.07, -body + 0.02];
      m.scope(e > 0 ? "front roof end" : "rear roof end", () => m.sweep("wgBody", "x", big, a0, big, a1));
    }
    for (const s of [-1, 1]) {
      m.scope(s > 0 ? "right side" : "left side", () => {
        // corner posts, the stanchions between the doors, the door posts
        for (const e of [-1, 1]) {
          const [x0, x1] = e > 0 ? [body - 0.1, body + 0.08] : [-body - 0.08, -body + 0.1];
          block(m, "wgRib", x0, x1, SIDE_Y0 - 0.06, eave - 0.07, ...proud(s, half, 0.08));
        }
        const inner = D.x - D.w / 2;
        for (let k = -2; k <= 2; k++) block(m, "wgRib", k * 0.95 - 0.06, k * 0.95 + 0.06, SIDE_Y0 - 0.04, eave - 0.07, ...proud(s, half, 0.06));
        for (const e of [-1, 1]) {
          // the door: a leaf standing proud with its pressed panel, the top track running out toward the end, the bottom guide, the lock bar
          const xc = e * D.x;
          m.scope("door", () => {
            block(m, "wgBody", xc - D.w / 2, xc + D.w / 2, SIDE_Y0 + 0.04, D.top, ...side(s, half - 0.005, half + 0.06));
            const zf = s * (half + 0.06);
            const rr = 0.18, pw = D.w / 2 - 0.2, y0 = SIDE_Y0 + 0.32, y1 = D.top - 0.28;
            const ring: Vec3[] = [];
            for (const [cx, cy, a0] of [[pw - rr, y1 - rr, 0], [-pw + rr, y1 - rr, 90], [-pw + rr, y0 + rr, 180], [pw - rr, y0 + rr, 270]] as const)
              for (let q = 0; q <= 3; q++) { const a = ((a0 + q * 30) * Math.PI) / 180; ring.push([xc + cx + rr * Math.cos(a), cy + rr * Math.sin(a), zf + s * 0.025]); }
            m.slab("wgPanel", ring, [0, 0, -s * 0.035]);
            const lx = xc - e * (D.w / 2 - 0.1);
            m.rod("handrail", [lx, SIDE_Y0 + 0.15, s * (half + 0.1)], [lx, D.top - 0.15, s * (half + 0.1)], 0.02, 6);
            block(m, "black", lx - 0.06, lx + 0.06, 2.0, 2.18, ...proud(s, half + 0.06, 0.06));
          });
          const xs = [xc - e * D.w / 2 - e * 0.05, e * (body - 0.12)];
          block(m, "wgRib", Math.min(...xs), Math.max(...xs), D.top, D.top + 0.08, ...proud(s, half, 0.11));
          block(m, "wgRib", Math.min(...xs), Math.max(...xs), SIDE_Y0 - 0.04, SIDE_Y0 + 0.03, ...proud(s, half, 0.09));
          block(m, "wgRib", e * inner - 0.06, e * inner + 0.06, SIDE_Y0 - 0.04, D.top + 0.02, ...proud(s, half, 0.075));
        }
        // stencils and plates, alike on both sides turned end for end
        const X = (u: number): number => s * u;
        sideText(m, "wgInk", "BCNA", s, half + DECAL, X(-5.9), 3.05, 0.2);
        sideText(m, "wgInk", BCNA.number, s, half + DECAL, X(-5.9), 2.72, 0.2, 0.12, 0.04);
        sideText(m, "wgInk", "CC 58T", s, half + DECAL, X(5.6), 1.62, 0.12);
        sideText(m, "wgInk", "TARE 27T", s, half + DECAL, X(5.6), 1.42, 0.12);
        sideDecal(m, "wgPlate", s, half + DECAL, X(-5.9), 1.5, 0.42, 0.3);
        sideDecal(m, "wgPlate", s, half + DECAL, X(-1.43), 1.55, 0.3, 0.42);
        sideDecal(m, "wgPlate", s, half + DECAL, X(0.48), 1.8, 0.24, 0.3);
        sideDecal(m, "wgPlate", s, half + DECAL, X(5.6), 2.4, 0.42, 0.42, 14);
      });
    }
    for (const e of [-1, 1]) m.scope(e > 0 ? "front end" : "rear end", () => endWall(m, e, body, half, eave - 0.1, [2.62, 1.72]));
  });
}

// ---------------------------------------------------------------------------

export function irBoxnWagon(v?: ParamValues): MeshBuilder {
  const unit = resolveParams(PARAMS, v).unit as "open" | "covered";
  const m = new MeshBuilder(PALETTE);
  const s = unit === "open" ? BOXN : BCNA;
  underframe(m, s.body, s.half, s.centre);
  if (unit === "open") boxn(m); else bcna(m);
  trucksAndCouplers(m, s.length, s.body, s.centre);
  return m;
}

export function irBoxnWagonLod(v?: ParamValues): MeshBuilder {
  const unit = resolveParams(PARAMS, v).unit as "open" | "covered";
  const s = unit === "open" ? BOXN : BCNA;
  const y0 = 0.78;
  const top = unit === "open" ? BOXN.top : BCNA.eave + BCNA.rise;
  const side: LodBand[] = [[y0, SIDE_Y0, "wgFrame"], [SIDE_Y0, top, "wgBody"]];
  const hw: Array<[number, number]> = unit === "open"
    ? [[y0, s.half], [top - 0.1, s.half + 0.06], [top, s.half - 0.1]]
    : [[y0, s.half], [BCNA.eave, s.half + 0.05], [BCNA.eave + BCNA.rise * 0.6, s.half * 0.68], [top, 0.25]];
  const body: UnitBody = { y0, hw, side, roof: unit === "open" ? "wgFrame" : "wgBody", front: { tip: [[y0, s.body + 0.08]] }, rear: { tip: [[y0, -s.body - 0.08]] } };
  const parts: LodPart[] = bogieParts([[s.centre, AXLE_HALF + WHEEL_R + 0.2], [-s.centre, AXLE_HALF + WHEEL_R + 0.2]], y0);
  // the open wagon's loads, a mound over its top each (docs/models/loads.md)
  if (unit === "open") for (const look of BULK_LOOKS) parts.push(loadLodPart(look.commodities, BOXN_FLOOR, { draw: (m) => m.scope("heap", () => lodRoofBox(m, look.mat, -s.body + 0.04, s.body - 0.04, s.half - 0.1, 0.6, top, top + 0.32)) }));
  return fitUnit({ palette: PALETTE, bodies: [body], parts }, 100);
}
