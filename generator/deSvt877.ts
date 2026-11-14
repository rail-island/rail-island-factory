// The DRG SVT 877 "Fliegender Hamburger" (1933, later DB VT 04 000), drawn on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts): two cars on three bogies (2'Bo'2', the
// traction motors in the Jacobs bogie under the joint, an engine bogie under each cab), the blunt
// rounded nose under the domed roof with the exhaust stack, the cab's four panes in the cream band
// round the front, the two round lamps on the corners and the black bumper, the full silver skirts
// down over the bogies and rounded under the nose, the fixed pane and drop window pairs of the
// saloons, and the violet and ivory DRG paint. Matched to the photographs in assets/drg-svt877/
// (SOURCES.md) and the published figures. See docs/models/germany-trains.md.
//
// Heights over the rail; d behind the face's tip (the bumper's front, 1.0 m up) on the face, else d
// behind the body's front end (the face's join).

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon, type Vec3 } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SeriesLayout, ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the dome's crown at 3.62 m, 1.45 m behind the tip (the crown still rises 4 cm behind it). */
const JOIN = 1.45;
/** The coupling plane's reach ahead of the bumper. */
const REACH = 0.1;
/** The crown over the rail (4.08 m over the exhaust stacks, en.wikipedia "DRG Class SVT 877"). */
const C = 3.66;
/** The skirt's top (the bumper's foot) and its bottom along the cars, over the bogies. */
const A = 0.93;
const B = 0.45;
/** The side's paint edges: the bumper, the lower gold line, the belt's gold line, the cream band's head, the roof's edge (the shoulder). */
const BUMPER = 1.08;
const BELT = 2.15;
const HEAD = 2.86;
const S = 3.13;

/**
 * The face's centre line (the Brockhaus side view at 132 px/m near the nose): the silver skirt rounding
 * under from its foot 0.14 m up and 0.53 m back to 0.14 m behind the bumper at 0.9 m, the black bumper
 * standing 0.14 m proud at 0.93 - 1.08 m, the violet front almost upright past the lamps to the belt
 * (0.21 m back), the cream band leaning back a little to the windscreen's head (0.28 m), then the roof's
 * dome falling to it from the crown about 1.5 m back.
 */
const PROFILE: Pt[] = [
  [0.14, 0.53], [0.2, 0.4], [0.3, 0.29], [0.45, 0.21], [0.65, 0.165], [0.85, 0.145], [A, 0.14], [A + 0.015, 0.01], [A + 0.04, 0], [BUMPER - 0.04, 0],
  [BUMPER - 0.015, 0.01], [BUMPER, 0.14], [1.13, 0.16], [1.4, 0.17], [1.7, 0.175], [BELT, 0.21], [2.5, 0.245], [HEAD, 0.28], [S, 0.42], [3.3, 0.6],
  [3.42, 0.8], [3.52, 1.02], [3.58, 1.22], [3.62, JOIN],
];

/** The panes' sill and head on the face and the cab's corners. */
const PANE: [number, number] = [2.24, 2.82];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.155, 1.5, 1.62, 1.75, 2.175, 2.21, PANE[0], PANE[1], 2.85, 3.0])].sort((a, b) => a - b);

export const SVT877_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.3, reach: REACH, first: 5.65, roofFrom: S, bulge: 0.05, tolerance: 0.02, cols: [6, 6, 1, 1],
  profile: PROFILE,
  // the plan: a short flat front between corners of 0.95 m radius (the two round lamps sit on them), the
  // dome rounding over in plan too
  corner: [[0.14, 0.95], [S, 0.95], [C, 0.95]],
  cornerDepth: PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.05, 0.95))]),
  rows: ROWS,
  // the side's paint over a silver skirt and the black bumper
  bands: (l) => [[0, A, "skirtG"], [A, BUMPER, "black"], ...l.bands.map(([y0, y1, mt]): readonly [number, number, string] => [Math.max(y0, BUMPER), y1, mt]).filter(([y0, y1]) => y1 > y0 + 1e-6)],
  lodGlass: { hw: 1.2, y: PANE },
  paint: [
    // the corner panes, round the corners into the cab's sides 0.95 m behind the tip (the side view)
    { mat: "rubber", front: [[PANE[0] - 0.03, 0.41], [PANE[1] + 0.03, 0.41]], back: [[PANE[0] - 0.03, 0.98], [PANE[1] + 0.03, 0.98]] },
    { mat: "cabGlass", front: [[PANE[0], 0.44], [PANE[1], 0.44]], back: [[PANE[0], 0.95], [PANE[1], 0.95]] },
  ],
  masks: [
    { lat: [-0.81, -0.07], y: [PANE[0] - 0.03, PANE[1] + 0.03], r: 0.04, mat: "rubber" },
    { lat: [0.07, 0.81], y: [PANE[0] - 0.03, PANE[1] + 0.03], r: 0.04, mat: "rubber" },
  ],
  // the two front panes either side of a 0.2 m pillar
  panes: [{ lat: [-0.78, -0.1], y: PANE, r: 0.03 }, { lat: [0.1, 0.78], y: PANE, r: 0.03 }],
  // the round lamps in their chrome rings on the corners, at mid height of the violet
  pods: [1, -1].map((sd) => ({ lat: sd * 0.99, y: 1.62, w: 0.36, h: 0.3, r: 0.15, proud: 0.015, depth: 0.04, mat: "frameSilver", lamps: [[0, 0.115, "lampHead"]] as const })),
  wipers: [[[0.62, 2.79], [0.42, 2.38]], [[-0.62, 2.79], [-0.42, 2.38]]],
};

/** Panes from d0 to d1: the fixed pane and the narrower drop window of each bay in turn (the first given), 8 cm pillars between. */
function bays(d0: number, d1: number, n: number, wideFirst = true): Array<readonly [number, number]> {
  const post = 0.08, k = 0.73;
  const wide = Array.from({ length: n }, (_, i) => (i % 2 === 0) === wideFirst);
  const unit = (d1 - d0 - post * (n - 1)) / wide.reduce((a, w) => a + (w ? 1 : k), 0);
  const out: Array<readonly [number, number]> = [];
  let d = d0;
  for (const w of wide) { const e = d + unit * (w ? 1 : k); out.push([d, e]); d = e + post; }
  return out;
}

/** Tip distance to body d. */
const b = (t: number) => t - JOIN;
/** A single door from t0 to t1 behind the tip, sliding toward the rear. */
const door = (t0: number, t1: number): readonly [number, number, number] => [b(t0), b(t1), 1];

/**
 * The leading car (877 a, the Brockhaus side view): the luggage room behind the cab, blank, then the door
 * 5.65 - 6.45 m behind the tip, then the saloon's 17 panes to the joint (nine fixed panes and eight drop windows).
 */
const LEAD: SeriesLayout = {
  doors: [door(5.65, 6.45)],
  windows: bays(b(6.6), b(20.45), 17).map(([d0, d1]) => [d0, d1] as const),
};
/**
 * The rear car (877 b): its door just behind the joint and a second one 8.15 - 8.95 m behind its tip, 13
 * panes between them and five ahead of the second (the Brockhaus photo's far car).
 */
const TRAIL: SeriesLayout = {
  doors: [door(19.7, 20.5), door(8.15, 8.95)],
  windows: [...bays(b(3.9), b(8.0), 5), ...bays(b(9.1), b(19.55), 13)].map(([d0, d1]) => [d0, d1] as const),
};

/** The skirt's bottom along the car (body d): low under the cab and the engine bogie's front, rising to B behind it. */
const SKIRT_FRONT: Pt[] = [[0, 0.14], [b(2.75), 0.14], [b(3.35), 0.3], [b(4.0), B]];
function skirtBottom(d: number): number {
  if (d <= SKIRT_FRONT[0]![0]) return SKIRT_FRONT[0]![1];
  for (let i = 1; i < SKIRT_FRONT.length; i++) {
    const [d0, y0] = SKIRT_FRONT[i - 1]!, [d1, y1] = SKIRT_FRONT[i]!;
    if (d <= d1) { const t = (d - d0) / (d1 - d0); return y0 + (y1 - y0) * (0.5 - 0.5 * Math.cos(Math.PI * t)); }
  }
  return B;
}

/**
 * The silver skirts down over the bogies: the kit cuts the body's skirt up to its top over each bogie; a
 * panel on each side closes it again, open below (the wheels show under it), 3 mm proud of the body's own
 * skirt line, down to the skirt's bottom (lower under the cab, straight down to it where it is lower than B).
 */
function skirts(m: MeshBuilder, X: (d: number) => number, L: number, spans: ReadonlyArray<readonly [number, number]>, W: number, wl: number, wa: number): void {
  const t = 0.03, p = 0.003;
  for (const [a, e] of spans) {
    const ds = new Set<number>([a, e]);
    for (const [d] of SKIRT_FRONT) if (d > a && d < e) ds.add(d);
    for (let d = SKIRT_FRONT[1]![0]; d < SKIRT_FRONT[SKIRT_FRONT.length - 1]![0]; d += 0.2) if (d > a && d < e) ds.add(Math.round(d * 1000) / 1000);
    const st = [...ds].sort((x, y) => x - y);
    // the section at d: top, the body's skirt line down to B, then straight down to the skirt's bottom
    const sec = (d: number): Pt[] => {
      const yb = skirtBottom(d);
      return yb < B - 1e-6 ? [[wa, A], [wl, B], [wl, yb]] : [[wa, A], [wl, B]];
    };
    for (const sd of [1, -1]) {
      const P = (d: number, [z, y]: Pt, inset: number): Vec3 => [X(d), y, sd * (z + p - inset)];
      for (let i = 0; i + 1 < st.length; i++) {
        const [d0, d1] = [st[i]!, st[i + 1]!];
        const s0 = sec(d0), s1 = sec(d1);
        // a section of two points against one of three: the shorter one doubles its bottom point
        const n = Math.max(s0.length, s1.length);
        const q0 = Array.from({ length: n }, (_, k) => s0[Math.min(k, s0.length - 1)]!), q1 = Array.from({ length: n }, (_, k) => s1[Math.min(k, s1.length - 1)]!);
        const out: Vec3[] = [], inn: Vec3[] = [];
        for (let k = 0; k + 1 < n; k++) {
          const [a0, b0, a1, b1] = [q0[k]!, q0[k + 1]!, q1[k]!, q1[k + 1]!];
          out.push(P(d0, a0, 0), P(d1, a1, 0), P(d1, b1, 0), P(d0, a0, 0), P(d1, b1, 0), P(d0, b0, 0));
          inn.push(P(d0, a0, t), P(d1, a1, t), P(d1, b1, t), P(d0, a0, t), P(d1, b1, t), P(d0, b0, t));
        }
        m.facets("skirtG", out, [0, 0, sd]);
        m.facets("skirtG", inn, [0, 0, -sd]);
        const [e0, e1] = [q0[n - 1]!, q1[n - 1]!];
        m.facets("skirtG", [P(d0, e0, 0), P(d1, e1, 0), P(d1, e1, t), P(d0, e0, 0), P(d1, e1, t), P(d0, e0, t)], [0, -1, 0]);
      }
      // closed where it ends with the body at the joint
      if (e >= L - 1e-6) {
        const q = sec(e), cap: Vec3[] = [];
        for (let k = 0; k + 1 < q.length; k++) cap.push(P(e, q[k]!, 0), P(e, q[k + 1]!, 0), P(e, q[k + 1]!, t), P(e, q[k]!, 0), P(e, q[k + 1]!, t), P(e, q[k]!, t));
        m.facets("skirtG", cap, [Math.sign(X(e) - X(0)), 0, 0]);
      }
    }
  }
  void W;
}

/** The skirts, the coupler at the bumper, the exhaust stack on the cab's dome and a vent on the roof by the joint. */
function svt877Fittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const L = car.length, reach = SVT877.wheelbase / 2 + SVT877.wheelR + 0.25;
  const wl = SVT877.W * SVT877.tiltSection!.wl, wa = SVT877.W * SVT877.tiltSection!.wa;
  m.scope("skirts", () => skirts(m, X, L, car.trucks.map((d) => [Math.max(0, d - reach), Math.min(L, d + reach)] as const).filter(([a, e]) => e > a + 0.05), SVT877.W, wl, wa));
  if (!car.end) return;
  const k = Math.sign(X(0) - X(1));
  m.scope("coupler", () => {
    // the Scharfenberg coupler's head out of the bumper, on the coupling plane
    const tip = X(-JOIN);
    block(m, "carbon", Math.min(tip - k * 0.05, tip + k * REACH), Math.max(tip - k * 0.05, tip + k * REACH), 0.95, 1.06, -0.1, 0.1);
  });
  m.scope("exhaust", () => {
    // the slim stack on the dome, 1.4 m behind the tip, 4.08 m over the rail
    const x = X(1.4 - JOIN);
    m.loft("exhaust", ngon(10, 0.09, 0, x, 0), 3.55, ngon(10, 0.065, 0, x, 0), 4.08);
    m.emit("smoke", [x, 4.08, 0], 0.06);
  });
  m.scope("roof vent", () => {
    const x = X(L - 1.3);
    m.loft("roofG", ngon(10, 0.13, 0, x, 0), C - 0.03, ngon(10, 0.1, 0, x, 0), C + 0.1);
  });
}

/** The paint: a body colour below the belt, a band holding the windows, the colour over them up to the roof; silver roof and skirt; thin lines. */
function svt877Livery(title: string, number: string, body: string, band: string, upper: string, line: string, palette: ShinkansenLivery["palette"], lettering?: string): ShinkansenLivery {
  return {
    title, number,
    palette: { ...palette, black: c("#161517", 0.35), skirtG: c("#b7babb", 0.35), roofG: c("#a9adaf", 0.4), exhaust: c("#8e9194", 0.4) },
    bands: [[0, A, "skirtG"], [A, 1.13, body], [1.13, 1.155, line], [1.155, BELT, body], [BELT, BELT + 0.025, line], [BELT + 0.025, HEAD, band], [HEAD, 9, upper]],
    roof: "roofG", skirt: "skirtG",
    ...(lettering ? { endLettering: [{ text: "DEUTSCHE REICHSBAHN", d: 10.5, y: 2.93, h: 0.13, mat: lettering }] } : {}),
  };
}

export const SVT877: ShinkansenSeries = {
  // 41.92 m over the couplers, two cars of 20.96 m on three bogies; 2.83 m wide (en.wikipedia)
  endLength: 20.96, midLength: 20.96, W: 1.415, Y: 1.15, S, C, lean: 0.985, B, A,
  // the skirt rounding in under the belly
  tiltSection: { wa: 0.97, wl: 0.93 },
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: SVT877_FACE,
  endCrown: [[0, 3.62], [0.3, 3.65], [0.6, C]],
  // the window band 2.175 - 2.86 m, the panes nearly filling it; single doors with a drop window
  windows: [[2.23, 2.82]], windowW: 0.85, pitch: 1.6, door: [0.95, 3.0, 2.25, 2.8], doorW: 0.8, doorGlassW: 0.55,
  layout: { end: LEAD, middle: LEAD },
  rearEnd: { layout: TRAIL },
  // the leading car's window between the luggage room and the door, on its right side only
  cabWindows: [[b(3.76), b(4.53), 2.23, 2.82, 1]],
  // 2'Bo'2': 37.25 m between the outer axles, so the engine bogie's leading axle 2.335 m behind the coupling
  // plane; 3.5 m wheelbase, its centre 16.875 m ahead of the Jacobs bogie's; 0.9 m carrying wheels
  // (the Jacobs bogie's 1.0 m driving wheels are drawn at 0.9 m too)
  jacobs: true, bogieCentres: 16.875, wheelR: 0.45, wheelbase: 3.5,
  traction: "diesel", exhaustInFittings: true, fittings: svt877Fittings,
  lodRoof: { d: [1.31, 1.49], hw: 0.08, y: [3.5, 4.08], mat: "exhaust" },
  cars: [2],
  liveries: {
    // violet with the ivory window band, gold lines, the silver roof and skirts (the DB Museum's replica)
    drg: svt877Livery("Violet and cream", "877 a", "violet", "cream", "violet", "gold", { violet: c("#46243f", 0.3), cream: c("#e4d49c", 0.35), gold: c("#c9a447", 0.35), letters: c("#d8c48a", 0.4) }, "letters"),
    // DB's VT 04 000: red below the belt, cream from there to the roof, white lines (Pragher's photograph)
    dbVt04: svt877Livery("DB VT 04", "VT 04 000", "red", "cream", "cream", "white", { red: c("#8a1f22", 0.35), cream: c("#e6dcc0", 0.35), white: c("#efede6", 0.4) }),
  },
  weight: { end: 39, middle: 39 }, power: 302, maxspeed: 160,
};
