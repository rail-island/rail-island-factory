// The NS ICM "Koploper" (Intercitymaterieel, Talbot 1977 - 1994), drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts) and the raised cab as a fitting: the upright
// yellow front that is the gangway door (the "doorloopkop", two leaves in a rubber frame; closed and
// plain on the modernised ICMm), the dark grey chin round the Scharfenberg coupler's recess, the
// stacked lamps and the grilles on the front's corners, the grey cap rounding over the front onto the
// roof, and the driver's cab standing on the roof above the gangway: a narrow hump with a raked
// windscreen under a visor, corner panes and two side windows a side, its back falling long into
// the roof. Three-car (ICM-III) and four-car (ICM-IV) units, two doors a side on every car, the
// single pantograph on the second car. Matched to the photographs in assets/ns-icm/ (SOURCES.md:
// 4011 and 4012 side-on and three-quarter, 4013 head-on, the 1977 prototype 4002, an unmodernised
// unit at Diepenveen) and the published figures (nl.wikipedia "Intercitymaterieel": 80.6 m over a
// three-car unit, 107.1 m over a four-car one, 2.844 m wide, 4.65 m high over the cab, floor 1.23 m).
// See docs/models/netherlands-trains.md.
//
// Heights over the rail; on the face d behind its tip (the upright front), on the body d behind the
// body's front end (the face's join on the end car).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sidePanel, type SliceBody } from "./sliceBody.ts";
import { loftHalves, type Pt } from "./sliceLoft.ts";
import { block } from "./vehicleParts.ts";
import { LOD_GLASS } from "./lodKit.ts";

const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

/** Where the face meets the body: the cap reaches the crown 1.6 m behind the front (clear of the leading wheel). */
const JOIN = 1.6;
/** The car's crown; the cab's roof stands at 4.65 m (the published height). */
const C = 4.03;
/** The yellow's foot on the front and the sides (the chin and the skirt below it, dark grey), and its top under the grey cap. */
const YELLOW = [1.25, 3.5] as const;

/**
 * The face's centre line: the chin's foot 0.4 m over the rail tucked 0.3 m back, the front upright
 * from 1.0 m (the gangway door) to 3.3 m, then the grey cap rounding back over 1.6 m to the crown.
 */
const PROFILE: Pt[] = [
  [0.4, 0.3], [0.48, 0.14], [0.6, 0.06], [0.8, 0.02], [1.0, 0], [3.3, 0], [3.45, 0.03], [3.55, 0.08], [3.65, 0.16], [3.75, 0.28],
  [3.85, 0.45], [3.93, 0.65], [3.99, 0.9], [4.02, 1.2], [C, JOIN],
];

/** The lamp housings' centre, about 40 % up the yellow front. */
const LAMP_Y = 1.9;

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.12, 1.2, YELLOW[0], LAMP_Y - 0.24, LAMP_Y - 0.2, LAMP_Y - 0.16, LAMP_Y, LAMP_Y + 0.16, 3.09, 3.21, YELLOW[1]])].sort((a, b) => a - b);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];
/** A rectangular outline k wide: its four sides. */
const outline = (hw: number, y0: number, y1: number, k: number): Pt[][] => [box(-hw, -hw + k, y0, y1), box(hw - k, hw, y0, y1), box(-hw + k, hw - k, y0, y0 + k), box(-hw + k, hw - k, y1 - k, y1)];

export const ICM_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.9, reach: 0.3, first: 5.0, roofFrom: YELLOW[1], tolerance: 0.02,
  profile: PROFILE,
  // the front flat over +-1.04 m, its corners rounded 0.38 m; the chin rounder in plan, the cap rounding into the roof
  corner: [[0.4, 0.55], [1.0, 0.42], [1.3, 0.38], [3.45, 0.38], [3.7, 0.5], [3.9, 0.8], [C, 1.2]],
  rows: ROWS,
  // the dark grey chin, the yellow front, the grey cap
  bands: () => [[0, YELLOW[0], "chinG"], [YELLOW[0], YELLOW[1], "yellow"], [YELLOW[1], 9, "roofG"]],
  fields: [
    // the coupler's recess in the chin (open to the track below)
    { mat: "black", pts: [[-0.42, 0.4], [0.42, 0.4], [0.42, 1.12], [0.32, 1.2], [-0.32, 1.2], [-0.42, 1.12]] },
  ],
  // the black bar under each lamp housing
  decals: [1, -1].map((sd) => ({ mat: "black", pts: box(sd > 0 ? 0.96 : -1.34, sd > 0 ? 1.34 : -0.96, LAMP_Y - 0.24, LAMP_Y - 0.2), fine: 2 })),
  panes: [],
  // the lamp housings on the corners, wrapping round onto the sides: a black rounded box 0.22 by 0.32 m holding
  // the headlight over the tail light, the grilles 0.35 m under the yellow's top
  pods: [1, -1].flatMap((sd) => [
    { lat: sd * 1.09, y: LAMP_Y, w: 0.24, h: 0.32, r: 0.06, proud: 0.015, depth: 0.04, mat: "black" },
    { lat: sd * 1.09, y: LAMP_Y + 0.072, w: 0.19, h: 0.135, r: 0.065, proud: 0.035, depth: 0.03, mat: "black", lamps: [[0, 0.064, "lampHead"]] as const },
    { lat: sd * 1.09, y: LAMP_Y - 0.072, w: 0.19, h: 0.135, r: 0.065, proud: 0.035, depth: 0.03, mat: "black", lamps: [[0, 0.06, "lampRed"]] as const },
    { lat: sd * 1.12, y: YELLOW[1] - 0.35, w: 0.26, h: 0.12, r: 0.06, proud: 0.012, depth: 0.03, mat: "black" },
  ]),
  // the marker lamp on the cap at the cab's front left
  roofLamp: [-0.72, 3.86, 0.06],
};

/** The cab on the roof, its sections by d behind the face's tip: [d, half width at the foot, at the top, the top's height]. */
const HUMP: ReadonlyArray<readonly [number, number, number, number]> = [
  [0.55, 0.95, 0.62, 3.75], [1.35, 0.95, 0.62, 4.56], [1.43, 0.95, 0.6, 4.63], [3.7, 0.95, 0.6, 4.63], [4.6, 0.95, 0.6, 4.42], [6.0, 0.95, 0.6, 3.96],
];
const HUMP_FOOT = 3.75;

/** A pane on a quad of the hump (a..b at the near station, d..c at the far one), inset to [u0, u1] x [v0, v1] and standing `proud` off it. */
function quadPane(m: MeshBuilder, mat: string, [a, b, cc, d]: [Vec3, Vec3, Vec3, Vec3], [u0, u1]: [number, number], [v0, v1]: [number, number], proud: number, out: Vec3): void {
  const at = (u: number, v: number): Vec3 => {
    const p = a.map((_, i) => (1 - u) * ((1 - v) * a[i]! + v * b[i]!) + u * ((1 - v) * d[i]! + v * cc[i]!)) as Vec3;
    return [p[0] + out[0] * proud, p[1] + out[1] * proud, p[2] + out[2] * proud];
  };
  const [p, q, r, s] = [at(u0, v0), at(u0, v1), at(u1, v1), at(u1, v0)];
  m.facets(mat, [p, q, r, p, r, s], out);
}

const norm = (v: Vec3): Vec3 => { const k = Math.hypot(...v) || 1; return [v[0] / k, v[1] / k, v[2] / k]; };
const crossV = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const subV = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

/** The raised cab: the grey hump lofted through its sections, the visor, the windscreen, corner panes and side windows. */
function cabHump(m: MeshBuilder, X: (d: number) => number): void {
  const x = (t: number) => X(t - JOIN);
  const xs = HUMP.map(([t]) => x(t));
  const halves = HUMP.map(([, wb, wt, yt]): Pt[] => [[wb, HUMP_FOOT], [wt, yt], [0, yt]]);
  m.scope("cab", () => loftHalves(m, xs, halves, () => "roofG", () => HUMP_FOOT));
  m.scope("visor", () => block(m, "roofG", Math.min(x(1.2), x(1.55)), Math.max(x(1.2), x(1.55)), 4.615, 4.66, -0.66, 0.66));
  // the panes: on segment i (stations i, i + 1) of the half slice's edge k (0 the sloping side, 1 the top or front)
  const P = (i: number, k: number, sd: number): Vec3 => [xs[i]!, halves[i]![k]![1], sd * halves[i]![k]![0]];
  const pane = (i: number, k: number, sd: number, u: [number, number], v: [number, number]) => {
    const q: [Vec3, Vec3, Vec3, Vec3] = [P(i, k, sd), P(i, k + 1, sd), P(i + 1, k + 1, sd), P(i + 1, k, sd)];
    let n = norm(crossV(subV(q[2], q[0]), subV(q[3], q[1])));
    // outward: away from the hump's axis
    const mid: Vec3 = [(q[0][0] + q[2][0]) / 2, (q[0][1] + q[2][1]) / 2, (q[0][2] + q[2][2]) / 2];
    const tip = x(0) > x(1) ? 1 : -1;
    const ref: Vec3 = [k === 1 && i === 0 ? tip : 0, mid[1] - HUMP_FOOT, mid[2]];
    if (n[0] * ref[0] + n[1] * ref[1] + n[2] * ref[2] < 0) n = [-n[0], -n[1], -n[2]];
    quadPane(m, "cabGlass", q, u, v, 0.008, n);
  };
  m.scope("windscreen", () => {
    for (const sd of [1, -1]) {
      // the front pane of each half (the centre pillar between them) and the corner pane wrapping round
      pane(0, 1, sd, [0.3, 0.93], [0.05, 0.96]);
      pane(0, 0, sd, [0.45, 0.93], [0.45, 0.93]);
    }
  });
  m.scope("side windows", () => {
    for (const sd of [1, -1]) {
      // two panes a side on the hump's sloping flank, between 1.55 and 3.65 m behind the front
      const u = (t: number) => (t - HUMP[2]![0]) / (HUMP[3]![0] - HUMP[2]![0]);
      pane(2, 0, sd, [u(1.55), u(2.6)], [0.42, 0.9]);
      pane(2, 0, sd, [u(2.7), u(3.65)], [0.42, 0.9]);
    }
  });
}

/** The end car's raised cab, chin, roof grille and handrails, and every car's underfloor equipment. */
function icmFittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const at = (mat: string, d0: number, d1: number, y0: number, y1: number, hw: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, -hw, hw);
  if (car.end) {
    m.scope("raised cab", () => cabHump(m, X));
    m.scope("chin", () => {
      // the chin's foot rising from the face's 0.4 m to the skirt's bottom over 0.55 m behind the join
      const [d0, d1, y0, y1, hw] = [0, 0.55, 0.4, b.B(0), b.wl(0) - 0.005];
      const [xa, xb] = [X(d0), X(d1)], k = Math.sign(xb - xa);
      for (const sd of [1, -1]) m.facets("chinG", [[xa, y0, sd * hw], [xa, y1, sd * hw], [xb, y1, sd * hw]], [0, 0, sd]);
      const n = norm([-k * (y1 - y0), -(d1 - d0), 0]);
      m.facets("chinG", [[xa, y0, -hw], [xa, y0, hw], [xb, y1, hw], [xa, y0, -hw], [xb, y1, hw], [xb, y1, -hw]], n);
    });
    m.scope("coupler", () => {
      // the Scharfenberg head standing out of the recess, its electric box under it, the yellow-capped fitting beside it
      const tip = X(-JOIN), k = Math.sign(tip - X(0));
      const out = (mat: string, a: number, e: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(tip + k * a, tip + k * e), Math.max(tip + k * a, tip + k * e), y0, y1, z0, z1);
      out("carbon", -0.12, 0.08, 0.93, 1.1, -0.16, 0.16);
      out("carbon", -0.1, 0.06, 0.8, 0.92, -0.12, 0.12);
      out("yellow", -0.06, 0.06, 0.97, 1.11, 0.5, 0.64);
    });
    m.scope("roof grille", () => { for (const sd of [1, -1]) crownPane(m, b, X, sd, "black", [5.0 - JOIN, 6.4 - JOIN], [1.02, 1.24], 0.006); });
    m.scope("handrails", () => {
      for (const sd of [1, -1]) for (const t of [4.12, 5.08]) sidePanel(m, b, X, sd, "frameSilver", t - JOIN - 0.015, t - JOIN + 0.015, 1.55, 2.95, 0.035, 0.03);
    });
  }
  m.scope("underfloor", () => {
    const [y0, y1] = [0.42, 0.95];
    if (car.end) { at("under", 4.6, 7.2, y0, y1, 1.1); at("under", 7.6, 12.6, y0, y1, 1.15); at("under", 13.0, 17.4, y0, y1, 1.1); }
    else { at("under", 5.2, 8.6, y0, y1, 1.1); at("under", 9.2, 14.8, y0, y1, 1.15); at("under", 15.4, 19.6, y0, y1, 1.0); }
  });
}

/** NS's scheme on the ICM: dark grey skirt, yellow, the window band, a yellow line under the grey roof. */
function icmLivery(kind: "yellowBlue" | "yellowGrey"): ShinkansenLivery {
  const original = kind === "yellowGrey";
  const band = original ? "#3f4c72" : NS_BLUE;
  return {
    title: original ? "NS yellow, grey" : "NS yellow, blue", number: original ? "4201" : "4011",
    palette: {
      yellow: c(NS_YELLOW), blue: c(band), roofG: c("#868b8f", 0.6), chinG: c("#454a50", 0.7), skirtG: c("#2a2c2f", 0.75), cabMask: c("#1d1f22", 0.3),
      black: c("#141618", 0.3), display: { color: "#2a1210", metallic: 0.2, roughness: 0.15, glass: true }, frameSilver: c("#b8bcbf", 0.3),
    },
    bands: [[0, 2.05, "yellow"], [2.05, 3.25, "blue"], [3.25, 9, "yellow"]],
    roof: "roofG", skirt: "chinG",
    // the window band ends in a half round 2.0 m behind the front (ICMm) or square behind the face's corner (as built)
    endSweeps: [{
      mat: "yellow", front: [[2.05, 0], [3.25, 0]],
      back: original ? [[2.05, 1.62], [2.1, 1.57], [3.2, 1.57], [3.25, 1.62]] : Array.from({ length: 9 }, (_, i): Pt => {
        const a = (Math.PI * i) / 8, r = 0.6;
        return [2.65 - r * Math.cos(a), 2.04 + r * (1 - Math.sin(a))];
      }),
    }],
    // the gangway door's outline in the front: the two leaves and their rubber frame as built, the closed panel's seam on the ICMm
    faceFields: (original ? [...outline(0.8, YELLOW[0] + 0.05, YELLOW[1] + 0.02, 0.045), box(-0.012, 0.012, YELLOW[0] + 0.095, YELLOW[1] - 0.025)] : outline(1.0, YELLOW[0], YELLOW[1], 0.008)).map((pts) => ({ mat: "black", pts })),
  };
}

/** The end car's window band (d behind the body's front, 1.6 m behind the face's tip), from 4011's side measured in a projective fit. */
const END_WINDOWS: Array<readonly [number, number]> = [[5.85, 6.4], ...Array.from({ length: 8 }, (_, k): [number, number] => [7.35 + 1.92 * k, 8.8 + 1.92 * k])];
const MID_WINDOWS: Array<readonly [number, number]> = Array.from({ length: 11 }, (_, k): [number, number] => [2.675 + 1.92 * k, 4.125 + 1.92 * k]);

export const ICM: ShinkansenSeries = {
  // 80.6 m over a three-car unit and 107.1 m over a four-car one: end cars 27.05 m, intermediate 26.5 m; 2.844 m wide
  endLength: 27.05, midLength: 26.5, W: 1.422, Y: 1.6, S: YELLOW[1], C, lean: 0.975, B: 1.0, A: YELLOW[0],
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: ICM_FACE,
  // windows 1.45 m at a 1.92 m pitch, sill 2.24 m, head 3.0 m (the floor at 1.23 m); swing-plug doors 0.9 m, the end car's first 1.3 m in two leaves
  windows: [[2.24, 3.0]], windowW: 1.45, pitch: 1.92, door: [YELLOW[0], 3.22, 2.22, 2.98], doorW: 0.9, doorGlassW: 0.3,
  layout: {
    end: { doors: [[4.0, 4.65, -1], [4.65, 5.3, 1], [22.95, 23.85, 1]], windows: END_WINDOWS },
    middle: { doors: [[0.55, 1.45, -1], [24.55, 25.45, 1]], windows: MID_WINDOWS },
  },
  // the window behind the destination display, between the crew's handrails
  cabWindows: [[2.65, 3.35, 2.25, 3.0]],
  sidePanels: { end: [{ d: [2.85, 4.05], y: [2.8, 3.12], kind: "panel", mat: "black", screen: "display" }] },
  // SIG bogies 19 m apart, the end car's leading one 4.0 m behind the front; 0.92 m wheels, 2.5 m wheelbase
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.5, endBogies: [4.0 - JOIN, 23.0 - JOIN],
  // one single-arm pantograph, on the second car's rear half
  onePantograph: true, pantographAt: 17.5,
  lodRoof: { d: [0.8, 3.8], hw: 0.7, y: [3.85, 4.6], mat: LOD_GLASS },
  // the yellow ahead of the band's end in the distant model (the half round's middle)
  lodEndPatches: [{ d: [0.4, 2.35], hw: 1.43, y: [2.04, 3.26], mat: "yellow" }],
  fittings: icmFittings,
  cars: [3, 4],
  liveries: { yellowBlue: icmLivery("yellowBlue"), yellowGrey: icmLivery("yellowGrey") },
  // 144 t over three cars and 192 t over four (nl.wikipedia)
  weight: { end: 50, middle: 44 }, power: 320, maxspeed: 160,
};
