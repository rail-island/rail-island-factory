// The Indian Railways WDG-4G (GE ES43ACmi, Marhowra): a twin-cab Co-Co freight
// diesel of GE's Evolution series, drawn from photographs (assets/ir-wdg4g/).
// Two full-width box cabs at the ends, each with two raked windscreens behind
// mesh guards, a roof box carrying the horns and a twin headlight under the
// screens; between them a narrow hood on a walkway frame with handrails: the
// louvred section behind cab 2, the raised engine room with its exhaust, the
// three big radiator intakes ahead of cab 1. Side buffers and a centre buffer
// coupler on each buffer beam. The livery is the class's red and orange in
// diagonal stripes, mirror-symmetric across the centre line, and the cab fronts
// red with orange lower corners. +X toward cab 1, wheel contact at y = 0.
// See docs/models/india-trains.md.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { tubeX } from "./cd163.ts";
import { block, buffers, exhaust, extrude, horn, paint, roofFan, side } from "./dieselParts.ts";
import { coil } from "./cd163.ts";
import { US_PALETTE, decalX, decalZ, endText, sideText } from "./usHoodKit.ts";
import { LOD_GLASS, type LodBand, type LodShell } from "./lodKit.ts";
import { locoLod, sideWindows, type LocoBox } from "./lodLocos.ts";

// ---------------------------------------------------------------------------
// Measures (metres). Published: 22,567 mm over couplers, 3,200 mm wide, 4,227 mm
// high, 1,092 mm wheels, 1,900 mm axle spacing. Measured on the side photograph
// (photo-gimb-wdg-4g.jpg, 27.5 px/m): the cabs, the hood sections, the stripes,
// the bogie centres (13.4 m on the photo; 14.48 m published - 13.8 m drawn).

const COUPLER = 22.567 / 2;
const END = 10.8; // the cab fronts
const BEAM = 10.85; // the buffer beams' faces
const DECK = 1.63; // the walkway, the body's foot
const SILL_BOTTOM = 1.22;
const DECK_HALF = 1.58;
const CAB_HALF = 1.55;
const CAB_LEN = 2.45;
const CAB_REAR = END - CAB_LEN; // 8.35
const CAB_TOP = 4.02; // about 0.2 m over the hood, as on the side photograph
const CAB_EDGE = 3.9; // where the roof's edge starts to round
const RAKE_FOOT = 2.85; // the windscreens' rake starts
const RAKE = 0.17;
const HOOD_HALF = 1.22;
const HOOD_TOP = 3.82;
const HOOD_R = 0.15;
const TRUCK_CENTRE = 6.9;
/** The fabricated Co-Co truck: axles, wheel radius, the side frame's half length, its top and its plane (z). */
const TRUCK = { axles: [-1.9, 0, 1.9], wheelR: 0.546, frameHalf: 2.6, frameTop: 1.1, frameZ: [0.94, 1.06] as const };
const TANK = { x0: -2.4, x1: 3.0, y0: 0.46, half: 1.38 };

// ---------------------------------------------------------------------------
// Paint

export interface Wdg4gLivery {
  /** The value's title (kept from the earlier drawing's key). */
  title: string;
  number: string;
  red: string;
  orange: string;
}

/** The diagonal stripes: boundaries at the walkway (distance from cab 2's front), leaning back toward cab 2 by K per metre of height. */
const STRIPES = [1.85, 6.3, 8.9, 12.54, 15.7, 20.2, 23.26] as const;
const K = 1.42;
/** Even stripes (from cab 2's front) are orange, odd ones red. */
const STRIPE_MATS = ["irOrange", "irRed"] as const;

function palette(l: Wdg4gLivery): Record<string, MaterialSpec> {
  return {
    ...US_PALETTE,
    irRed: paint(l.red, 0.45),
    irOrange: paint(l.orange, 0.45),
    irRoof: paint("#a3261c", 0.6),
    irBlack: paint("#1d1e20", 0.8),
    irRail: paint("#eeeeea", 0.45),
    flagSaffron: paint("#ff9933", 0.5),
    flagGreen: paint("#138808", 0.5),
    meshGuard: paint("#2a2c2e", 0.6),
  };
}

// ---------------------------------------------------------------------------
// Polygons painted by the stripes

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

function normalOf(pts: readonly Vec3[]): Vec3 {
  let n: Vec3 = [0, 0, 0];
  for (let i = 1; i + 1 < pts.length; i++) {
    const c = cross(sub(pts[i]!, pts[0]!), sub(pts[i + 1]!, pts[0]!));
    n = [n[0] + c[0], n[1] + c[1], n[2] + c[2]];
  }
  const l = Math.hypot(...n) || 1;
  return [n[0] / l, n[1] / l, n[2] / l];
}

/** A convex polygon as a fan, facing `out`. */
function poly(m: MeshBuilder, mat: string, pts: readonly Vec3[], out: Vec3): void {
  if (pts.length < 3) return;
  let n = normalOf(pts);
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) n = [-n[0], -n[1], -n[2]];
  const tri: Vec3[] = [];
  for (let i = 1; i + 1 < pts.length; i++) tri.push(pts[0]!, pts[i]!, pts[i + 1]!);
  m.facets(mat, tri, n);
}

/** The part of a convex polygon where f >= 0 (f linear). */
function clip(pts: readonly Vec3[], f: (p: Vec3) => number): Vec3[] {
  const out: Vec3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i]!, q = pts[(i + 1) % pts.length]!;
    const fp = f(p), fq = f(q);
    if (fp >= 0) out.push(p);
    if ((fp >= 0) !== (fq >= 0)) {
      const t = fp / (fp - fq);
      out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t]);
    }
  }
  return out;
}

/** The stripe coordinate: the boundary's distance from cab 2's front at the walkway. */
const stripeAt = (p: Vec3): number => p[0] + END + K * (p[1] - DECK);

/** A convex body face painted in the stripes. */
function striped(m: MeshBuilder, pts: readonly Vec3[], out: Vec3): void {
  const cuts = [-Infinity, ...STRIPES, Infinity];
  for (let i = 0; i + 1 < cuts.length; i++) {
    const lo = cuts[i]!, hi = cuts[i + 1]!;
    let piece: Vec3[] = [...pts];
    if (lo > -Infinity) piece = clip(piece, (p) => stripeAt(p) - lo);
    if (hi < Infinity) piece = clip(piece, (p) => hi - stripeAt(p));
    if (piece.length >= 3) poly(m, STRIPE_MATS[i % 2]!, piece, out);
  }
}

// ---------------------------------------------------------------------------
// The model

export function buildWdg4g(l: Wdg4gLivery): MeshBuilder {
  const m = new MeshBuilder(palette(l));
  m.scope("frame", () => frame(m));
  for (const e of [1, -1]) m.scope(e > 0 ? "cab 1" : "cab 2", () => cab(m, l, e));
  m.scope("hood", () => hood(m, l));
  m.scope("walkways", () => walkways(m));
  m.scope("trucks", () => {
    m.scope("cab 1 truck", () => truck(m, TRUCK_CENTRE));
    m.scope("cab 2 truck", () => truck(m, -TRUCK_CENTRE));
  });
  m.scope("underframe", () => underframe(m));
  return m;
}

function frame(m: MeshBuilder): void {
  m.scope("deck", () => {
    block(m, "irBlack", -CAB_REAR, CAB_REAR, DECK - 0.04, DECK, -DECK_HALF, DECK_HALF);
    block(m, "irBlack", -BEAM, BEAM, SILL_BOTTOM, DECK - 0.04, -DECK_HALF, DECK_HALF);
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "cab 1 end" : "cab 2 end", () => {
      const along = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      // the buffer beam below the frame, and the plough leaning back under it
      m.scope("buffer beam", () => block(m, "irBlack", ...along(BEAM - 0.32, BEAM), 0.72, SILL_BOTTOM, -CAB_HALF, CAB_HALF));
      m.scope("plough", () => {
        const x0 = BEAM - 0.05, x1 = BEAM - 0.3;
        const pts: Vec3[] = [[e * (x0 - 0.12), 0.14, -1.4], [e * (x0 - 0.12), 0.14, 1.4], [e * x0, 0.72, 1.5], [e * x0, 0.72, -1.5]];
        poly(m, "irBlack", pts, [e, -0.2, 0]);
        poly(m, "irBlack", [[e * (x0 - 0.12), 0.14, -1.4], [e * x1, 0.14, -1.4], [e * x1, 0.14, 1.4], [e * (x0 - 0.12), 0.14, 1.4]], [0, -1, 0]);
        for (const sd of [-1, 1]) poly(m, "irBlack", [[e * (x0 - 0.12), 0.14, sd * 1.4], [e * x0, 0.72, sd * 1.5], [e * x1, 0.72, sd * 1.5], [e * x1, 0.14, sd * 1.4]], [0, 0, sd]);
      });
      m.scope("buffers", () => buffers(m, e, BEAM, COUPLER - 0.03, 1.03, "round", 2.0));
      // the centre buffer coupler: its draft gear, head and knuckle, and the hoses
      m.scope("coupler", () => {
        const y = 1.09;
        block(m, "knuckle", ...along(BEAM, BEAM + 0.25), y - 0.09, y + 0.09, -0.11, 0.11);
        block(m, "knuckle", ...along(BEAM + 0.25, COUPLER), y - 0.18, y + 0.15, -0.17, 0.13);
        block(m, "knuckle", ...along(BEAM + 0.28, COUPLER - 0.02), y - 0.13, y + 0.1, 0.13, 0.24);
        for (const z of [-0.55, 0.55]) m.loft("hose", ngon(6, 0.03, 0, e * (BEAM + 0.02), z), 0.62, ngon(6, 0.03, 0, e * (BEAM + 0.16), z), 0.95);
      });
      // the steps up to the walkway behind each cab
      m.scope("steps", () => {
        for (const sd of [-1, 1]) {
          const z = side(sd, DECK_HALF - 0.5, DECK_HALF - 0.04);
          for (const y of [0.55, 0.9, 1.25]) block(m, "steel", ...along(CAB_REAR - 0.62, CAB_REAR - 0.08), y, y + 0.03, ...z);
          for (const zz of z) block(m, "irBlack", ...along(CAB_REAR - 0.64, CAB_REAR - 0.06), 0.5, SILL_BOTTOM, zz - 0.025, zz + 0.025);
        }
      });
    });
}

/** Cab e (+1 cab 1, -1 cab 2): the box with its raked screens and rounded roof edge, its fittings. */
function cab(m: MeshBuilder, l: Wdg4gLivery, e: number): void {
  const X = (u: number) => e * (END - u); // u: depth behind the front
  const h = CAB_HALF, ht = CAB_HALF - 0.13, uRake = RAKE, uTop = RAKE + 0.15;
  m.scope("shell", () => {
    for (const sd of [-1, 1]) {
      const z = sd * h;
      striped(m, [[X(CAB_LEN), DECK, z], [X(0), DECK, z], [X(0), RAKE_FOOT, z], [X(uRake), CAB_EDGE, z], [X(CAB_LEN), CAB_EDGE, z]], [0, 0, sd]);
      striped(m, [[X(CAB_LEN), CAB_EDGE, z], [X(uRake), CAB_EDGE, z], [X(uTop), CAB_TOP, sd * ht], [X(CAB_LEN), CAB_TOP, sd * ht]], [0, 1, sd]);
    }
    poly(m, "irRoof", [[X(CAB_LEN), CAB_TOP, -ht], [X(uTop), CAB_TOP, -ht], [X(uTop), CAB_TOP, ht], [X(CAB_LEN), CAB_TOP, ht]], [0, 1, 0]);
    // the front: upright to the screens' foot, raked to the roof's edge, rounded over
    poly(m, "irRed", [[X(0), DECK, -h], [X(0), DECK, h], [X(0), RAKE_FOOT, h], [X(0), RAKE_FOOT, -h]], [e, 0, 0]);
    poly(m, "irRed", [[X(0), RAKE_FOOT, -h], [X(0), RAKE_FOOT, h], [X(uRake), CAB_EDGE, h], [X(uRake), CAB_EDGE, -h]], [e, 0.2, 0]);
    poly(m, "irRed", [[X(uRake), CAB_EDGE, -h], [X(uRake), CAB_EDGE, h], [X(uTop), CAB_TOP, ht], [X(uTop), CAB_TOP, -ht]], [e, 1, 0]);
    // the rear wall over the hood, in the stripes
    striped(m, [[X(CAB_LEN), DECK, -h], [X(CAB_LEN), DECK, h], [X(CAB_LEN), CAB_EDGE, h], [X(CAB_LEN), CAB_TOP, ht], [X(CAB_LEN), CAB_TOP, -ht], [X(CAB_LEN), CAB_EDGE, -h]], [-e, 0, 0]);
  });
  const xf = X(0) + e * 0.004;
  // the orange lower corners of the face
  m.scope("face paint", () => {
    for (const sd of [-1, 1]) {
      const pts: Vec3[] = [[xf, 2.7, sd * h], [xf, 2.7, sd * 1.3], [xf, 1.98, sd * 0.62], [xf, DECK, sd * 0.62], [xf, DECK, sd * h]];
      poly(m, "irOrange", pts, [e, 0, 0]);
    }
  });
  // the windscreens on the rake, each behind a mesh guard with its wipers
  m.scope("windscreens", () => {
    const at = (y: number, d: number): number => X(((y - RAKE_FOOT) / (CAB_EDGE - RAKE_FOOT)) * uRake) + e * d;
    const n: Vec3 = [e * (CAB_EDGE - RAKE_FOOT), uRake, 0];
    const y0 = 2.95, y1 = 3.8;
    for (const sd of [-1, 1]) {
      const [z0, z1] = side(sd, 0.13, 1.33);
      const quad = (d: number, za: number, zb: number, ya: number, yb: number): Vec3[] => [[at(ya, d), ya, za], [at(ya, d), ya, zb], [at(yb, d), yb, zb], [at(yb, d), yb, za]];
      poly(m, "rubber", quad(0.004, z0, z1, y0, y1), n);
      poly(m, "glass", quad(0.008, z0 + 0.05, z1 - 0.05, y0 + 0.05, y1 - 0.05), n);
      // the guard: a frame and vertical bars
      m.scope("mesh guard", () => {
        for (const [za, zb, ya, yb] of [[z0, z1, y0, y0 + 0.04], [z0, z1, y1 - 0.04, y1], [z0, z0 + 0.04, y0, y1], [z1 - 0.04, z1, y0, y1]] as const) poly(m, "meshGuard", quad(0.03, za, zb, ya, yb), n);
        for (let i = 1; i < 9; i++) {
          const z = z0 + ((z1 - z0) * i) / 9;
          poly(m, "meshGuard", quad(0.03, z - 0.008, z + 0.008, y0, y1), n);
        }
      });
      m.scope("wipers", () => {
        for (const zc of [0.4, 0.95]) {
          const z = sd * zc;
          m.rod("black", [at(3.62, 0.05), 3.62, z], [at(3.05, 0.05), 3.05, z + sd * 0.14], 0.012, 4);
        }
      });
    }
  });
  m.scope("lamps", () => {
    // the twin headlight under the screens, the marker lamps at the corners, the small lamp low in the middle
    block(m, "black", ...(e > 0 ? [END - 0.01, END + 0.06] : [-END - 0.06, -END + 0.01]) as [number, number], 2.53, 2.81, -0.24, 0.24);
    for (const z of [-0.11, 0.11]) extrude(m, "lampHead", "x", ngon(10, 0.095, 0, z, 2.67), e > 0 ? [END + 0.06, END + 0.075] : [-END - 0.075, -END - 0.06]);
    for (const z of [-1.0, 1.0]) {
      extrude(m, "black", "x", ngon(10, 0.11, 0, z, 2.66), e > 0 ? [END - 0.01, END + 0.04] : [-END - 0.04, -END + 0.01]);
      extrude(m, "lampHead", "x", ngon(10, 0.085, 0, z, 2.66), e > 0 ? [END + 0.04, END + 0.05] : [-END - 0.05, -END - 0.04]);
    }
    extrude(m, "white", "x", ngon(8, 0.06, 0, 0, 1.8), e > 0 ? [END - 0.01, END + 0.03] : [-END - 0.03, -END + 0.01]);
  });
  m.scope("lettering", () => {
    endText(m, "white", "WDG4G", e, END + 0.006, e * 0.98, 2.22, 0.16, 0.1, 0.035);
    endText(m, "white", l.number, e, END + 0.006, -e * 0.98, 2.22, 0.16, 0.1, 0.035);
    // the tricolour plate in the middle
    const flag: Array<[string, number, number]> = [["flagGreen", 2.04, 2.13], ["white", 2.13, 2.23], ["flagSaffron", 2.23, 2.32]];
    for (const [mat, y0, y1] of flag) decalX(m, mat, e * (END + 0.006), e, -0.22, 0.22, y0, y1);
  });
  // the roof box with the horns and the roof headlight
  m.scope("roof box", () => {
    const [a, b] = e > 0 ? [CAB_REAR + 0.3, END - 0.4] : [-END + 0.4, -CAB_REAR - 0.3];
    block(m, "irRed", a, b, CAB_TOP - 0.02, 4.22, -0.68, 0.68);
    const xb = e > 0 ? b : a;
    extrude(m, "black", "x", ngon(10, 0.08, 0, 0, 4.12), e > 0 ? [xb - 0.01, xb + 0.04] : [xb - 0.04, xb + 0.01]);
    extrude(m, "lampHead", "x", ngon(10, 0.06, 0, 0, 4.12), e > 0 ? [xb + 0.04, xb + 0.05] : [xb - 0.05, xb - 0.04]);
    for (const z of [-0.14, 0.14]) horn(m, e, xb - e * 0.2, z, 4.3);
    m.prism("black", ngon(6, 0.025, 0, e * (CAB_REAR + 0.5), 0.5), 4.2, 4.36);
  });
  // the side windows (a front pane and a narrower rear one), the shed's GE roundel
  m.scope("side windows", () => {
    const panes: Array<[number, number]> = e > 0 ? [[0.75, 1.33], [1.38, 1.85]] : [[0.6, 1.1], [1.18, 1.6]];
    for (const sd of [-1, 1]) {
      const zz = sd * (h + 0.004);
      for (const [u0, u1] of panes) {
        const [x0, x1] = [X(u1), X(u0)].sort((p, q) => p - q) as [number, number];
        decalZ(m, "irRail", zz, sd, x0, x1, 2.84, 3.51);
        decalZ(m, "glass", zz + sd * 0.004, sd, x0 + 0.04, x1 - 0.04, 2.88, 3.47);
      }
      if (e > 0) {
        extrude(m, "white", "z", ngon(12, 0.17, 0, X(1.2), 2.25), sd > 0 ? [h, h + 0.006] : [-h - 0.006, -h]);
        extrude(m, "irOrange", "z", ngon(12, 0.13, 0, X(1.2), 2.25), sd > 0 ? [h + 0.006, h + 0.009] : [-h - 0.009, -h - 0.006]);
      }
      // the grab irons at the cab's rear corner
      m.rod("irRail", [X(CAB_LEN - 0.06), DECK + 0.2, sd * (h + 0.06)], [X(CAB_LEN - 0.06), DECK + 1.5, sd * (h + 0.06)], 0.018, 6);
    }
  });
}

/** The hood between the cabs: louvred section, raised engine room, radiator intakes. */
function hood(m: MeshBuilder, l: Wdg4gLivery): void {
  const h = HOOD_HALF, t = HOOD_TOP, r = HOOD_R;
  const x0 = -CAB_REAR, x1 = CAB_REAR;
  m.scope("shell", () => {
    for (const sd of [-1, 1]) {
      striped(m, [[x0, DECK, sd * h], [x1, DECK, sd * h], [x1, t - r, sd * h], [x0, t - r, sd * h]], [0, 0, sd]);
      striped(m, [[x0, t - r, sd * h], [x1, t - r, sd * h], [x1, t, sd * (h - r)], [x0, t, sd * (h - r)]], [0, 1, sd]);
    }
    poly(m, "irRoof", [[x0, t, -(h - r)], [x1, t, -(h - r)], [x1, t, h - r], [x0, t, h - r]], [0, 1, 0]);
  });
  // the raised engine room roof and the dynamic brake housing at its cab 2 end
  m.scope("engine room roof", () => {
    const a = -5.05, b = 3.85, hh = h - 0.2;
    block(m, "irRoof", a + 0.05, b, t - 0.01, t + 0.1, -hh, hh);
    const db = { a, b: -2.0, top: 4.0, half: h - 0.05 };
    for (const sd of [-1, 1]) striped(m, [[db.a, t - 0.25, sd * db.half], [db.b, t - 0.25, sd * db.half], [db.b, db.top, sd * db.half], [db.a, db.top, sd * db.half]], [0, 0, sd]);
    for (const ex of [db.a, db.b]) striped(m, [[ex, t - 0.25, -db.half], [ex, t - 0.25, db.half], [ex, db.top, db.half], [ex, db.top, -db.half]], [ex === db.a ? -1 : 1, 0, 0]);
    poly(m, "irRoof", [[db.a, db.top, -db.half], [db.b, db.top, -db.half], [db.b, db.top, db.half], [db.a, db.top, db.half]], [0, 1, 0]);
    for (const sd of [-1, 1]) decalZ(m, "grille", sd * (db.half + 0.005), sd, db.a + 0.25, db.b - 0.25, t - 0.06, db.top - 0.05);
    roofFan(m, (db.a + db.b) / 2, 0, db.top, 0.4);
    exhaust(m, 0.6, 0, t + 0.09, t + 0.32, 0.5, 0.4);
    // the hatch seams
    for (const x of [-0.6, 1.6]) block(m, "black", x - 0.015, x + 0.015, t + 0.1, t + 0.11, -hh, hh);
  });
  // the radiator ahead of cab 1: three big intakes high on each side, two fans on the roof
  m.scope("radiator", () => {
    const bays: Array<[number, number]> = [[4.2, 5.0], [5.05, 5.85], [5.9, 6.65]];
    for (const sd of [-1, 1]) {
      const zz = sd * (h + 0.005);
      for (const [a, b] of bays) {
        decalZ(m, "grille", zz, sd, a, b, 3.28, t - r - 0.02);
        for (let y = 3.33; y < t - r - 0.06; y += 0.08) decalZ(m, "louvre", zz + sd * 0.004, sd, a + 0.04, b - 0.04, y, y + 0.035);
      }
    }
    for (const x of [4.8, 6.05]) roofFan(m, x, 0, t, 0.5);
  });
  // the louvred section behind cab 2: a row of upper openings, narrow louvres below
  m.scope("louvres", () => {
    const upper: Array<[number, number]> = [[-7.7, -6.75], [-6.65, -5.65], [-5.5, -4.55], [-4.35, -3.35]];
    const lower = [-7.5, -7.1, -6.0, -5.2, -4.7, -3.9, -3.5];
    for (const sd of [-1, 1]) {
      const zz = sd * (h + 0.005);
      for (const [a, b] of upper) {
        decalZ(m, "louvre", zz, sd, a, b, 2.87, 3.32);
        for (let x = a + 0.08; x < b - 0.05; x += 0.12) decalZ(m, "grille", zz + sd * 0.004, sd, x, x + 0.04, 2.9, 3.29);
      }
      for (const x of lower) decalZ(m, "louvre", zz, sd, x, x + 0.22, 1.86, 2.66);
    }
  });
  // the hood doors' seams and latches along the engine room, the door ahead of the radiator
  m.scope("doors", () => {
    for (const sd of [-1, 1]) {
      const zz = sd * (h + 0.004);
      for (let x = -3.0; x <= 4.0; x += 1.0) {
        decalZ(m, "black", zz, sd, x - 0.012, x + 0.012, DECK + 0.12, t - r - 0.1);
        if (x < 4.0) decalZ(m, "black", zz, sd, x + 0.44, x + 0.56, DECK + 1.1, DECK + 1.15);
      }
      decalZ(m, "black", zz, sd, 6.95, 6.97, DECK + 0.1, t - r - 0.08);
      decalZ(m, "black", zz, sd, 7.75, 7.77, DECK + 0.1, t - r - 0.08);
      decalZ(m, "black", zz, sd, 6.95, 7.77, t - r - 0.1, t - r - 0.08);
    }
  });
  // "Indian Railways" (in capitals: the stroke font has no lower case) on the left side (the right side's Devanagari is not drawn)
  m.scope("lettering", () => sideText(m, "white", "INDIAN RAILWAYS", -1, h + 0.009, -0.25, 3.0, 0.3));
  void l;
}

function walkways(m: MeshBuilder): void {
  const y = DECK + 1.0, yMid = DECK + 0.5, z = DECK_HALF - 0.04;
  const a = -CAB_REAR + 0.15, b = CAB_REAR - 0.15;
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right rail" : "left rail", () => {
      const zc = sd * z;
      tubeX(m, "irRail", 0.022, a, y, zc, b, y, zc, 6);
      tubeX(m, "irRail", 0.016, a, yMid, zc, b, yMid, zc, 6);
      const n = 11;
      for (let i = 0; i <= n; i++) m.prism("irRail", ngon(6, 0.024, 0, a + ((b - a) * i) / n, zc), DECK, y);
    });
}

/**
 * A truck centred at xc, as on the photographs: the wheelsets, a deep side frame
 * (a top beam, a cast belly between the axles, pedestal legs either side of each
 * journal box), the journal boxes standing out with two coil springs over each,
 * the transoms, the traction motors and the brake cylinders.
 */
function truck(m: MeshBuilder, xc: number): void {
  m.bogie(() => {
    const N = 20, T = TRUCK;
    const ay = T.wheelR * Math.cos(Math.PI / N);
    const [fz0, fz1] = T.frameZ;
    const xs = [...T.axles].sort((a, b) => a - b);
    for (const dx of xs)
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -0.9, axle, 0.9);
        for (const s of [-1, 1]) {
          extrude(m, "steel", "z", ngon(N, T.wheelR, Math.PI / N, x, ay), side(s, 0.665, 0.8));
          extrude(m, "wheel", "z", ngon(16, T.wheelR * 0.82, 0, x, ay), side(s, 0.8, 0.82));
        }
      });
    // convex (x, y) outlines given thickness across the side frames' plane, both sides
    const sideFrame = (ring: Ring): void => {
      for (const s of [-1, 1]) {
        const [za, zb] = [s * fz0, s * fz1];
        poly(m, "bogie", ring.map(([x, y]): Vec3 => [x, y, zb]), [0, 0, s]);
        poly(m, "bogie", ring.map(([x, y]): Vec3 => [x, y, za]), [0, 0, -s]);
        const cx = ring.reduce((t, p) => t + p[0], 0) / ring.length, cy = ring.reduce((t, p) => t + p[1], 0) / ring.length;
        ring.forEach(([x0, y0], i) => {
          const [x1, y1] = ring[(i + 1) % ring.length]!;
          poly(m, "bogie", [[x0, y0, za], [x1, y1, za], [x1, y1, zb], [x0, y0, zb]], [(x0 + x1) / 2 - cx, (y0 + y1) / 2 - cy, 0]);
        });
      }
    };
    const top = T.frameTop, beam = top - 0.18;
    m.scope("side frames", () => {
      sideFrame([[xc - T.frameHalf, beam], [xc + T.frameHalf, beam], [xc + T.frameHalf, top], [xc - T.frameHalf, top]]);
      for (let i = 0; i + 1 < xs.length; i++) {
        const a = xc + xs[i]!, b = xc + xs[i + 1]!;
        sideFrame([[a + 0.55, 0.53], [b - 0.55, 0.53], [b - 0.36, beam], [a + 0.36, beam]]);
      }
      const inner = xs[xs.length - 1]! + 0.36;
      sideFrame([[xc + inner, beam - 0.3], [xc + T.frameHalf, beam - 0.12], [xc + T.frameHalf, beam], [xc + inner, beam]]);
      sideFrame([[xc - T.frameHalf, beam - 0.12], [xc - inner, beam - 0.3], [xc - inner, beam], [xc - T.frameHalf, beam]]);
      for (const dx of xs)
        for (const d of [-1, 1]) {
          const x = xc + dx + d * 0.31;
          sideFrame([[x - 0.045, ay - 0.16], [x + 0.045, ay - 0.16], [x + 0.045, beam], [x - 0.045, beam]]);
        }
      for (const x of [xc - 0.4, xc + 0.4]) block(m, "bogie", x - 0.09, x + 0.09, top - 0.26, top - 0.04, -fz0, fz0);
      block(m, "bogie", xc - 0.35, xc + 0.35, top - 0.04, 1.19, -0.6, 0.6);
    });
    m.scope("journal boxes", () => {
      for (const dx of xs)
        for (const s of [-1, 1]) {
          const x = xc + dx;
          block(m, "bogie", x - 0.2, x + 0.2, ay - 0.15, ay + 0.15, ...side(s, 0.84, fz1 + 0.08));
          extrude(m, "spring", "z", ngon(8, 0.09, Math.PI / 8, x, ay), side(s, fz1 + 0.08, fz1 + 0.1));
          for (const d of [-0.12, 0.12]) coil(m, "spring", x + d, s * (fz1 - 0.02), ay + 0.15, beam, 0.065, 2, 6);
        }
    });
    m.scope("traction motors", () => {
      for (const dx of xs) {
        const motor = ngon(10, 0.26, 0, xc + dx + (dx > 0.1 ? -0.5 : 0.5), ay + 0.05);
        m.sweep("bogie", "z", motor, -0.5, motor, 0.5);
      }
    });
    m.scope("brake cylinders", () => {
      for (const s of [-1, 1])
        for (const dx of [xs[0]! + 0.62, xs[xs.length - 1]! - 0.62]) extrude(m, "spring", "z", ngon(8, 0.08, Math.PI / 8, xc + dx, top - 0.32), side(s, fz0 - 0.18, fz0));
    });
  });
}

function underframe(m: MeshBuilder): void {
  const t = TANK;
  m.scope("fuel tank", () => {
    block(m, "irBlack", t.x0, t.x1, t.y0 + 0.2, SILL_BOTTOM, -t.half, t.half);
    block(m, "irBlack", t.x0 + 0.1, t.x1 - 0.1, t.y0, t.y0 + 0.2, -(t.half - 0.2), t.half - 0.2);
    for (const sd of [-1, 1]) block(m, "steel", t.x1 - 0.6, t.x1 - 0.45, 0.95, 1.12, ...side(sd, t.half, t.half + 0.04));
  });
  m.scope("air reservoirs", () => {
    for (const sd of [-1, 1]) {
      const q = ngon(10, 0.2, Math.PI / 10, sd * 0.8, SILL_BOTTOM - 0.24);
      m.sweep("tank", "x", q, -TRUCK_CENTRE + TRUCK.frameHalf + 0.2, q, t.x0 - 0.1);
    }
  });
  // the equipment box between the tank and cab 1's truck
  m.scope("equipment box", () => block(m, "irBlack", t.x1 + 0.1, TRUCK_CENTRE - TRUCK.frameHalf - 0.15, 0.75, SILL_BOTTOM, -1.2, 1.2));
}

// ---------------------------------------------------------------------------
// The distant model

/** Stripes as x ranges at mid-height of the body, for the LOD's side paint. */
function lodStripes(x0: number, x1: number, y: number): Array<{ x0: number; x1: number; side: readonly LodBand[] }> {
  const out: Array<{ x0: number; x1: number; side: readonly LodBand[] }> = [];
  const shift = END + K * (y - DECK);
  const cuts = [-Infinity, ...STRIPES.map((b) => b - shift), Infinity];
  for (let i = 1; i + 1 < cuts.length; i += 2) {
    const a = Math.max(x0, cuts[i]!), b = Math.min(x1, cuts[i + 1]!);
    if (b > a) out.push({ x0: a, x1: b, side: [[0, 9, "irRed"]] });
  }
  return out;
}

export function buildWdg4gLod(l: Wdg4gLivery, budget = 100): MeshBuilder {
  const mid = 2.75;
  const hoodShell: LodShell = {
    y0: DECK, xc: 0, tip: [[DECK, CAB_REAR], [HOOD_TOP, CAB_REAR]],
    hw: [[DECK, HOOD_HALF], [HOOD_TOP - HOOD_R, HOOD_HALF], [HOOD_TOP, HOOD_HALF - HOOD_R]],
    side: [[DECK, HOOD_TOP, "irOrange"]], cabs: lodStripes(-CAB_REAR, CAB_REAR, mid), roof: "irRoof", ends: [],
  };
  const cabShell = (e: number): LodShell => {
    const xc = e * (END - CAB_LEN / 2);
    return {
      y0: DECK, xc, tip: [[DECK, CAB_LEN / 2], [RAKE_FOOT, CAB_LEN / 2], [CAB_EDGE, CAB_LEN / 2 - RAKE], [CAB_TOP, CAB_LEN / 2 - RAKE - 0.15]],
      hw: [[DECK, CAB_HALF], [CAB_EDGE, CAB_HALF], [CAB_TOP, CAB_HALF - 0.13]],
      side: [[DECK, CAB_TOP, "irOrange"]], end: [[DECK, 2.0, "irOrange"], [2.0, CAB_TOP, "irRed"]],
      cabs: lodStripes(xc - CAB_LEN / 2, xc + CAB_LEN / 2, mid), roof: "irRoof",
      endWindows: [-1, 1].map((sd) => ({ u: sd > 0 ? [0.13, 1.33] as const : [-1.33, -0.13] as const, y: [2.93, 3.68] as const, mat: LOD_GLASS, ends: [e], optional: 0.3 })),
      sideWindows: sideWindows([{ u: e > 0 ? [END - 1.85, END - 0.75] : [-END + 0.6, -END + 1.6], y: [2.84, 3.51] }]),
    };
  };
  const boxes: LocoBox[] = [
    { name: "frame", mat: "irBlack", x: [-BEAM, BEAM], y: [SILL_BOTTOM, DECK], w: DECK_HALF },
    { name: "fuel tank", mat: "irBlack", x: [TANK.x0, TANK.x1], y: [TANK.y0, SILL_BOTTOM], w: TANK.half, top: false, optional: 35 },
    ...[-1, 1].map((e): LocoBox => ({ name: "buffer beam", mat: "irBlack", x: e > 0 ? [BEAM - 0.35, BEAM] : [-BEAM, -BEAM + 0.35], y: [0.15, SILL_BOTTOM], w: CAB_HALF - 0.05, top: false, optional: 30 })),
    ...[-1, 1].map((e): LocoBox => ({ name: "roof box", mat: "irRed", x: e > 0 ? [CAB_REAR + 0.3, END - 0.4] : [-END + 0.4, -CAB_REAR - 0.3], y: [CAB_TOP - 0.02, 4.22], w: 0.68, optional: 20 })),
  ];
  return locoLod({
    palette: palette(l),
    shells: [hoodShell, cabShell(1), cabShell(-1)],
    boxes,
    gear: [-1, 1].map((e) => ({ xc: e * TRUCK_CENTRE, half: TRUCK.frameHalf, top: TRUCK.frameTop })),
  }, budget);
}
