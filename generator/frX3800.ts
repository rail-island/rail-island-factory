// SNCF X 3800 "Picasso" (Renault, De Dietrich, ANF, 1950-1961; 251 built, X 3801 - X 4051): a single
// diesel railcar on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts) at both ends
// and the driver's turret ("kiosque") on the roof over the engine end, off to the right (+Z) side, its
// arched windscreens looking both ways and its side windows in two rows. The ends: upright, the centre
// panel with the two big windows and the two outer panels angled back with the narrow ones, the corners
// rounded into the sides, the roof dome rounding over; the big lamps in red housings at the corners,
// the cream coming down to a point (the "V") between them, the number over the point, the lamp on the
// dome; buffers with rectangular heads standing out of the red end, the screw coupling. Along the
// sides (the early cars, X 3817 and X 3853): the cab window, the luggage door, the louvred window of the
// engine room under the turret, four windows, the double door of the central platform, then the rear
// saloon's narrow window and three big ones; red below the windows, cream above and on the roof; the
// red sides reaching down over the wheels' upper halves. Two bogies 14.2 m apart (2.6 m wheelbase,
// 0.86 m wheels). The roof: the radiator housing and exhaust ahead of the turret, the horns, the round
// ventilators along the crown.
//
// Figures (fr.wikipedia "X 3800"): 21.851 m over buffers, 3.09 m wide, 3.952 m high over the turret,
// bogie centres 14.201 m, bogie wheelbase 2.6 m, wheels 860 mm, 31.5 t, 250 kW, 120 km/h, 62 seats.
//
// Measured (assets/sncf-x3800/, SOURCES.md):
// - photo-autorail-picasso-cfv3v-img-2352.jpg (X 3998 head-on, 249 px/m at the face from the buffer
//   centres 1.75 m apart, the buffers 1.05 m up): crown 3.04 m, the dome's seam 2.76 m, end windows
//   1.69 - 2.52 m, lamps 1.49 m (0.3 m across), the V's point 1.25 m and its ends at the lamps 1.61 m,
//   the number 1.52 m, the end's foot 0.59 m.
// - photo-p1190506-picasso-x-3853.jpg and photo-p1190507-picasso-x-3817.jpg (the two sides, a 1-D
//   projective fit over the body's two ends and the near bogie's centre, which agree within 0.1 m):
//   the window and door spans below (`T*`, m behind the turret end's tip).
// - photo-x-3896.jpg (an elevation drawing, 110 px/m from the 3.952 m height and the 2.6 m bogie
//   wheelbase): the turret 1.5 - 4.45 m behind the tip at its foot, the body's crown 3.05 m.
// See docs/models/france-trains.md.
//
// Heights over the rail. On the face, d behind its tip; elsewhere d behind the body's front end (the
// face's join, JOIN behind the tip): `T(t)` turns a distance behind the tip into the body's d.

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { halfSlice, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { decalX, decalZ } from "./usHoodKit.ts";
import { horn } from "./dieselParts.ts";

/** Over the buffers (21.851 m); the buffers reach 0.65 m out, so the body is 20.55 m from tip to tip. */
const LENGTH = 21.85;
const TIPS = LENGTH - 2 * 0.65;
/** Where the end's dome reaches the crown, behind the face. */
const JOIN = 0.4;
/** Half width (3.04 m over the body), crown, the roof's edge, the belly and the red side's foot. */
const W = 1.52;
const C = 3.05;
const S = 2.65;
const B = 0.5;
/** The red/cream edge along the sides; the side windows' sill and head; the end windows'. */
const EDGE = 1.62;
const WIN: readonly [number, number] = [1.66, 2.46];
const END_WIN: readonly [number, number] = [1.69, 2.52];
/** The end's V: its point in the middle and its ends at the lamps. */
const V: readonly [number, number] = [1.2, EDGE];
/** The seam where the roof dome meets the end. */
const DOME = 2.76;

/** A distance behind the (turret end's) tip as the body's d. */
const T = (t: number): number => t - JOIN;

/**
 * The end's centre line: upright from the red end's foot to the dome's seam, the dome rounding back
 * to the crown at the join.
 */
const PROFILE: Pt[] = [[B, 0.02], [0.6, 0], [DOME, 0], [2.84, 0.03], [2.91, 0.08], [2.97, 0.15], [3.01, 0.23], [3.04, 0.32], [C, JOIN]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), V[0], 1.38, V[1], END_WIN[0], END_WIN[1], DOME - 0.02])].sort((a, b) => a - b);

/** The end windows: the two big ones on the centre panel, the narrow ones on the outer panels. */
const BIG: Array<readonly [number, number]> = [[-0.6, -0.06], [0.06, 0.6]];
const NARROW: Array<readonly [number, number]> = [[-1.06, -0.8], [0.8, 1.06]];

const PICASSO_END: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.38, first: 2.4, roofFrom: DOME, bulge: 0.07, tolerance: 0.02, cols: [5, 3, 1, 1],
  profile: PROFILE,
  // the plan: the centre panel flat, the outer panels set back (the bow), the corners rounded 0.3 m into the sides
  corner: [[B, 0.3], [DOME, 0.3], [2.91, 0.3], [3.0, 0.2], [C, 0.05]],
  rows: ROWS,
  // red up to the side's edge, cream above (the V drawn over it); the dome the roof's cream
  bands: () => [[0, EDGE, "red"], [EDGE, 9, "cream"]],
  masks: [...BIG, ...NARROW].map(([a, e]) => ({ lat: [a - 0.035, e + 0.035] as const, y: [END_WIN[0] - 0.035, END_WIN[1] + 0.035] as const, r: 0.08, mat: "rubber" })),
  panes: [...BIG, ...NARROW].map(([a, e]) => ({ lat: [a, e] as const, y: [END_WIN[0], END_WIN[1]] as const, r: 0.06 })),
  // the cream's V: from the lamps down to the point under the number
  fields: [{ mat: "cream", pts: [[-1.2, V[1]], [0, V[0]], [1.2, V[1]]] }],
  decals: [
    // the seams of the centre panel and the dome
    { mat: "seam", pts: [[-0.72, 0.62], [-0.705, 0.62], [-0.705, DOME], [-0.72, DOME]] },
    { mat: "seam", pts: [[0.705, 0.62], [0.72, 0.62], [0.72, DOME], [0.705, DOME]] },
    { mat: "seam", pts: [[-1.2, DOME - 0.015], [1.2, DOME - 0.015], [1.2, DOME + 0.005], [-1.2, DOME + 0.005]], fine: 3 },
  ],
  // the big lamps in their red housings standing out at the corners
  pods: [1, -1].map((sd) => ({ lat: sd * 1.2, y: 1.49, w: 0.32, h: 0.32, r: 0.16, proud: 0.1, depth: 0.03, mat: "chrome", lamps: [[0, 0.12, "lampHead"]] as const })),
  roofLamp: [0, 2.84, 0.08],
  number: { lat: -0.22, y: 1.42, h: 0.09, mat: "lettering" },
  wipers: [[[-0.33, END_WIN[0] + 0.05], [-0.5, 2.3]], [[0.33, END_WIN[0] + 0.05], [0.5, 2.3]]],
};

/** The side's layout behind the turret end's tip (both sides): the cab window, the luggage door, the engine room's louvred window. */
const T_CAB_WINDOW: readonly [number, number] = [0.5, 1.15];
const T_LUGGAGE: readonly [number, number] = [2.4, 3.45];
const T_LOUVRE: readonly [number, number] = [3.97, 4.5];
/** The front saloon's four windows, the central platform's double door, the rear saloon's narrow and three big windows. */
const T_FRONT: Array<readonly [number, number]> = [[4.85, 5.77], [6.17, 7.17], [7.58, 8.63], [9.08, 9.8]];
const T_DOOR2: readonly [number, number] = [10.62, 12.12];
const T_REAR: Array<readonly [number, number]> = [[12.93, 13.74], [14.38, 15.9], [16.6, 18.2], [19.0, 20.02]];
/** Only on the left (-Z): a second window ahead of the luggage door. */
const T_LEFT_WINDOW: readonly [number, number] = [1.48, 1.95];
/** The bogies' centres behind the tip: 14.2 m apart, centred on the body. */
const BOGIES: readonly [number, number] = [(TIPS - 14.2) / 2, (TIPS + 14.2) / 2];

/** The turret: t span behind the tip at its foot, z span (to the right of the crown), foot and top, the end-facing and the rear corner's radius. */
const TURRET = { t: [1.6, 4.1] as const, z: [0.0, 1.3] as const, y0: 2.72, top: 3.95, rf: 0.15, rr: 0.3 };
/** The turret top's corners rounded across it. */
const LAT_R = 0.45;

/** The roof's height at a lateral offset z over the body's section at d. */
function roofY(b: SliceBody, d: number, z: number): number {
  const h = halfSlice(b, d);
  for (let k = h.length - 1; k > 0; k--) {
    const [za, ya] = h[k]!, [zb, yb] = h[k - 1]!;
    if (z >= za && z <= zb && zb > za) return ya + ((z - za) / (zb - za)) * (yb - ya);
  }
  return C;
}

/** The turret: its side elevation swept across its width, the arched windscreens both ways, the side windows. */
function turret(m: MeshBuilder, X: (d: number) => number): void {
  const t = TURRET;
  const [xa, xb] = [X(T(t.t[1])), X(T(t.t[0]))];
  const [z0, z1] = t.z;
  // the side elevation: the top's height at x, upright faces rounding over into the top at both ends
  const height = (x: number): number => {
    if (x > xb - t.rf) { const u = (x - (xb - t.rf)) / t.rf; return t.top - t.rf + t.rf * Math.sqrt(Math.max(0, 1 - u * u)); }
    if (x < xa + t.rr) { const u = (xa + t.rr - x) / t.rr; return t.top - t.rr + t.rr * Math.sqrt(Math.max(0, 1 - u * u)); }
    return t.top;
  };
  // stations along the turret: across the rear arc, then the front arc (equal angles)
  const ang = Array.from({ length: 6 }, (_, i) => (i / 5) * (Math.PI / 2));
  const xsOk = [...ang.map((f) => xa + t.rr - t.rr * Math.cos(f)), ...ang.slice().reverse().map((f) => xb - t.rf + t.rf * Math.cos(f))];
  // the section: upright sides, the top's corners rounded LAT_R across the turret
  const section = (h: number): Array<[number, number]> => {
    const r = Math.min(LAT_R, Math.max(0.02, h - t.y0 - 0.02));
    const corner = (cz: number, from: number): Array<[number, number]> => Array.from({ length: 5 }, (_, i) => {
      const a = from + (i / 4) * (Math.PI / 2);
      return [cz + r * Math.cos(a), h - r + r * Math.sin(a)];
    });
    return [[z0, t.y0], [z1, t.y0], ...corner(z1 - r, 0), ...corner(z0 + r, Math.PI / 2)];
  };
  m.scope("turret", () => {
    m.scope("shell", () => {
      for (let i = 0; i + 1 < xsOk.length; i++) {
        const [p, q] = [xsOk[i]!, xsOk[i + 1]!];
        m.sweep("cream", "x", section(height(p + 1e-6)), p, section(height(q - 1e-6)), q, false);
      }
      // the upright end faces
      for (const [x, e] of [[xa, -1], [xb, 1]] as const) {
        const ring = section(height(x - e * 1e-6));
        const pts: Array<[number, number, number]> = [];
        for (let k = 1; k + 1 < ring.length; k++) pts.push([x, ring[0]![1], ring[0]![0]], [x, ring[k]![1], ring[k]![0]], [x, ring[k + 1]![1], ring[k + 1]![0]]);
        m.facets("cream", pts, [e, 0, 0]);
      }
    });
    // an arched pane on an upright end face: the face's outline inset, from its foot up into the rounded top
    const arch = (mat: string, e: number, x: number, za: number, zb: number, y0: number, inset: number, proud: number) => {
      const h = height(x - e * 1e-6) - inset, r = LAT_R - inset;
      const ring: Array<[number, number]> = [[za, y0], [zb, y0]];
      for (let i = 0; i <= 3; i++) { const a = (i / 3) * (Math.PI / 2); ring.push([Math.min(zb, z1 - LAT_R) + r * Math.cos(a), h - r + r * Math.sin(a)]); }
      for (let i = 0; i <= 3; i++) { const a = Math.PI / 2 + (i / 3) * (Math.PI / 2); ring.push([Math.max(za, z0 + LAT_R) + r * Math.cos(a), h - r + r * Math.sin(a)]); }
      const pts: Array<[number, number, number]> = [];
      const P = (k: number): [number, number, number] => [x + e * proud, ring[k]![1], ring[k]![0]];
      for (let k = 1; k + 1 < ring.length; k++) pts.push(P(0), P(k), P(k + 1));
      m.facets(mat, pts, [e, 0, 0]);
    };
    m.scope("front windscreen", () => {
      // one big arched pane looking over the end, the wiper on it
      arch("rubber", 1, xb, z0 + 0.08, z1 - 0.08, 3.1, 0.08, 0.004);
      arch("cabGlass", 1, xb, z0 + 0.12, z1 - 0.12, 3.14, 0.12, 0.008);
      decalX(m, "black", xb + 0.012, 1, 0.62, 0.645, 3.2, 3.62);
    });
    m.scope("rear windscreen", () => {
      // the arched pane looking back along the roof, its middle bar
      arch("rubber", -1, xa, z0 + 0.08, z1 - 0.08, 3.15, 0.08, 0.004);
      arch("cabGlass", -1, xa, z0 + 0.12, z1 - 0.12, 3.19, 0.12, 0.008);
      decalX(m, "rubber", xa - 0.012, -1, 0.62, 0.68, 3.19, 3.75);
    });
    m.scope("side windows", () => {
      // two upper panes and two smaller ones under them, in the middle of each side
      const panes: Array<readonly [number, number, number, number]> = [
        [2.3, 2.9, 3.2, 3.46], [2.98, 3.58, 3.2, 3.46], [2.42, 2.85, 2.92, 3.13], [3.03, 3.46, 2.92, 3.13],
      ];
      for (const [ta, tb, ya, yb] of panes) {
        const [a, e] = [X(T(tb)), X(T(ta))];
        for (const [z, sd] of [[z1, 1], [z0, -1]] as const) {
          decalZ(m, "rubber", z + sd * 0.004, sd, a, e, ya, yb);
          decalZ(m, "cabGlass", z + sd * 0.008, sd, a + 0.03, e - 0.03, ya + 0.03, yb - 0.03);
        }
      }
    });
  });
}

/** The turret, the one-sided window, the luggage door, the louvres, the roof's fittings, the rectangular buffer heads and the underfloor. */
function picassoFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length;
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const win = (sd: number, d0: number, d1: number) => {
    sidePanel(m, b, X, sd, "rubber", d0, d1, WIN[0], WIN[1], 0.006, 0.03);
    sidePanel(m, b, X, sd, "glass", d0 + 0.04, d1 - 0.04, WIN[0] + 0.04, WIN[1] - 0.04, 0.012, 0.004);
  };
  turret(m, X);
  m.scope("left window", () => win(-1, T(T_LEFT_WINDOW[0]), T(T_LEFT_WINDOW[1])));
  m.scope("luggage doors", () => {
    // the hinged luggage door: its seams, the window in its rear half, the handle and the gutter over it
    for (const sd of [1, -1]) {
      const [d0, d1] = [T(T_LUGGAGE[0]), T(T_LUGGAGE[1])];
      const [y0, y1, w] = [0.62, 2.55, 0.015];
      const seams: Pt[] = [];
      const bar = (a: number, e: number, ya: number, yb: number) => seams.push([a, ya], [e, ya], [e, yb], [a, ya], [e, yb], [a, yb]);
      bar(d0 - w, d0 + w, y0, y1); bar(d1 - w, d1 + w, y0, y1); bar(d0, d1, y1 - w, y1 + w); bar(d0, d1, y0 - w, y0 + w);
      sideDecal(m, b, X, sd, "seam", seams, 0.004);
      win(sd, T(2.62), T(3.3));
      sidePanel(m, b, X, sd, "handle", d0 + 0.08, d0 + 0.11, 1.2, 1.9, 0.02, 0.025);
      sidePanel(m, b, X, sd, "cream", d0 - 0.05, d1 + 0.05, 2.6, 2.63, 0.03, 0.02);
    }
  });
  m.scope("window bars", () => {
    for (const sd of [1, -1]) {
      // the engine room window's louvres, the cab window's transom
      for (let k = 0; k < 7; k++) {
        const y = WIN[0] + 0.1 + k * 0.1;
        sidePanel(m, b, X, sd, "louvreBar", T(T_LOUVRE[0]) + 0.04, T(T_LOUVRE[1]) - 0.04, y, y + 0.035, 0.02, 0.01);
      }
      sidePanel(m, b, X, sd, "rubber", T(T_CAB_WINDOW[0]) + 0.04, T(T_CAB_WINDOW[1]) - 0.04, 2.12, 2.15, 0.016, 0.01);
    }
  });
  m.scope("roof", () => {
    // the radiator housing ahead of the turret, on the left of the crown, the exhaust out of it
    const [ra, re] = [T(0.55), T(1.4)];
    m.scope("radiator housing", () => {
      const y = roofY(b, (ra + re) / 2, -0.85);
      blk("roofBox", ra, re, y - 0.12, C + 0.14, -1.0, -0.15);
      for (let k = 0; k < 5; k++) blk("louvre", ra + 0.1 + k * 0.15, ra + 0.17 + k * 0.15, C + 0.14, C + 0.15, -0.92, -0.23);
    });
    m.scope("exhaust", () => {
      const x = X(T(1.15)), z = -0.55;
      m.loft("exhaustPipe", ngon(8, 0.07, 0, x, z), C + 0.12, ngon(8, 0.07, 0, x, z), C + 0.42);
      m.emit("smoke", [x, C + 0.42, z], 0.06);
    });
    // the two horns on the crown over each end
    m.scope("horns", () => {
      horn(m, 1, X(T(0.75)), 0.25, C + 0.07);
      horn(m, -1, X(L - T(0.75)), -0.25, C + 0.07);
    });
    // the round ventilators along the crown
    for (const [tt, z] of [[5.6, 0.3], [7.4, -0.3], [9.4, 0.3], [13.4, -0.3], [15.3, 0.3], [17.4, -0.3], [19.3, 0.3]] as const)
      m.scope("ventilator", () => {
        const x = X(T(tt)), y = roofY(b, T(tt), Math.abs(z));
        m.prism("vent", ngon(8, 0.14, 0, x, z), y - 0.03, y + 0.09);
        m.prism("vent", ngon(8, 0.17, 0, x, z), y + 0.09, y + 0.13);
      });
  });
  m.scope("buffer heads", () => {
    // the rectangular heads over the kit's round ones, at both ends
    for (const e of [1, -1]) {
      const plane = e > 0 ? X(-JOIN) + 0.65 : X(L + JOIN) - 0.65;
      const [a, z1] = e > 0 ? [plane - 0.04, plane + 0.01] : [plane - 0.01, plane + 0.04];
      for (const z of [-0.875, 0.875]) {
        const head: Pt[] = [[z - 0.25, 0.83], [z + 0.25, 0.83], [z + 0.29, 0.87], [z + 0.29, 1.19], [z + 0.25, 1.23], [z - 0.25, 1.23], [z - 0.29, 1.19], [z - 0.29, 0.87]];
        m.sweep("bufferHead", "x", head, a, head, z1);
      }
    }
  });
  m.scope("underfloor", () => {
    // the engine and gearbox behind the motor bogie, the fuel tank and the battery boxes, all under the red skirt
    blk("under", T(BOGIES[0]) + 1.8, T(BOGIES[0]) + 5.4, 0.3, B + 0.05, -0.85, 0.85);
    blk("under", T(BOGIES[0]) + 6.2, T(BOGIES[0]) + 7.6, 0.33, B + 0.05, -0.95, 0.95);
    blk("under", T(BOGIES[1]) - 4.6, T(BOGIES[1]) - 1.9, 0.36, B + 0.05, -0.9, 0.9);
  });
}

export const X3800: ShinkansenSeries = {
  endLength: LENGTH, midLength: LENGTH, W, Y: 0.62, S, C, lean: 0.99, B, A: 0.6,
  // the red sides upright to their foot, hiding the wheels' upper halves
  tiltSection: { wa: 1, wl: 1 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: PICASSO_END,
  // the turret in the distant model, off to the right of the crown
  lodRoof: { d: TURRET.t, hw: 0.65, y: [C - 0.1, TURRET.top - 0.1], mat: "cream", centreZ: (TURRET.z[0] + TURRET.z[1]) / 2 },
  windows: [WIN], windowW: 1.0, pitch: 1.4, windowCornerR: 0.05,
  // the central platform's double door: two leaves, a narrow window in each
  door: [0.62, 2.55, WIN[0] + 0.05, WIN[1] - 0.04], doorW: 0.75, doorGlassW: 0.3,
  layout: (() => {
    const [d0, d1] = [T(T_DOOR2[0]), T(T_DOOR2[1])], mid = (d0 + d1) / 2;
    const windows = [T_CAB_WINDOW, T_LOUVRE, ...T_FRONT, ...T_REAR].map(([a, e]): readonly [number, number] => [T(a), T(e)]);
    const doors: Array<readonly [number, number, number]> = [[d0, mid, -1], [mid, d1, 1]];
    return { end: { doors, windows }, middle: { doors, windows } };
  })(),
  // the engine room's grille in the red under the cab window
  sidePanels: { end: [{ d: [0.55, 1.1], y: [1.2, 1.5], kind: "louvres", louvres: 6 }] },
  numberAt: [8.7, 1.05, 0.09],
  endBogies: [BOGIES[0], BOGIES[1]],
  bogieCentres: 14.2, wheelR: 0.43, wheelbase: 2.6, traction: "diesel", single: true, endCoupler: "buffers", bufferBeam: false, exhaustInFittings: true,
  fittings: picassoFittings,
  liveries: {
    // red below the windows, cream above and on the roof (the preserved cars, X 3817 and X 3853)
    redCream: {
      title: "Red and cream", number: "X 3817",
      palette: {
        red: c("#c8262b", 0.5), cream: c("#ece3c4", 0.5), roofG: c("#e6dcbc", 0.55), skirtG: c("#2a2c2f", 0.8),
        seam: c("#8d846c", 0.6), louvre: c("#3a2a24", 0.7), louvreBar: c("#b9b6aa", 0.5), chrome: { color: "#d4d7da", metallic: 0.8, roughness: 0.2 }, handle: c("#c9ccce", 0.3), roofBox: c("#ddd3b2", 0.6),
        vent: c("#e2d9b9", 0.55), horn: c("#3a3c3f", 0.5), exhaustPipe: c("#202124", 0.7), bufferHead: c("#2f3134", 0.6),
      },
      bands: [[0, EDGE, "red"], [EDGE, 9, "cream"]], roof: "roofG", skirt: "red",
    },
  },
  // 31.5 t, 250 kW, 120 km/h (fr.wikipedia)
  weight: { end: 31.5, middle: 31.5 }, power: 250, maxspeed: 120,
};

