// NS DE-I "Blauwe Engel" (Allan, 1953-1955; motor coaches 21 - 50): a single diesel-electric railcar
// on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts) at the front end only - the
// rear end is square, a flat end wall with the gangway and the Scharfenberg coupler, for working in
// multiple (`cabFaceFrontOnly`). The front is not the Mat '46's mouse nose: a blunt face rounding
// deep into the sides, the centre pane and two raked side panes in one white surround, a corner window
// wrapping round each corner, the silver dome over the orange-red band with its two round lamps, the
// winged NS emblem over the red "beak" rising from the waist band between the two headlights in their
// rings, the silver apron rounding under with the coupler in its arch. Along the sides: the cab side
// window and the cab door, the luggage end and the entrance (on the right; two windows on the left),
// four big and six smaller windows either side of the double door; silver skirts between the bogies,
// open over them; torpedo ventilators and the exhaust on the roof. Matched to the photographs of
// museum unit 41 in assets/ns-de1/ (SOURCES.md) and the published figures (27.05 m over the couplers,
// 2.78 m wide, 3.45 m high, bogies 18.35 m apart with a 3.0 m wheelbase, 57 t, 73 seats: nl.wikipedia
// "Blauwe Engel", Spoorwegmuseum). See docs/models/netherlands-trains.md.
//
// Heights over the rail. On the face, d behind its tip; elsewhere d behind the body's front end (the
// face's join, JOIN behind the tip): `T(t)` turns a distance behind the tip into the body's d.

import type { MeshBuilder } from "./meshBuilder.ts";
import { ngon } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { halfSlice, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the corners have swept round to the full width and the dome to the crown. */
const JOIN = 1.25;
/** The coupling plane ahead of the face's tip: the Scharfenberg coupler's head. */
const REACH = 0.35;
/** Over the couplers (27.05 m), and the body from the tip to the rear end wall (the rear coupling plane 0.25 m behind it). */
const LENGTH = 27.05;
const TAIL = LENGTH - REACH - 0.25;
/** Half width (2.78 m), crown (3.45 m), the roof's edge (the shoulder), the skirt's bottom and top. */
const W = 1.39;
const C = 3.45;
const S = 3.24;
const B = 0.32;
const A = 0.88;
/** The waist band at the cab (and on the face) and the thin red line along the passenger part's foot. */
const BAND: readonly [number, number] = [A, 1.16];
const LINE: readonly [number, number] = [1.06, 1.12];
/** The windows' sill and head; the red band over them at the cab from TOP up. */
const WIN: readonly [number, number] = [2.06, 2.9];
const TOP = 2.95;
/** The cab door's front edge, where the cab's red bands end, behind the tip. */
const CAB_DOOR: readonly [number, number] = [2.45, 3.25];

/** A distance behind the tip as the body's d. */
const T = (t: number): number => t - JOIN;

/**
 * The face's centre line (the side views of 41): the tall silver apron rounding under from 0.3 m back at
 * its foot, the face upright from the waist band past the lamps and the windows, leaning back a little
 * in the red band and rounding over into the dome, the crown reached at the join.
 */
const PROFILE: Pt[] = [
  [B, 0.3], [0.42, 0.17], [0.55, 0.08], [0.7, 0.03], [A, 0.01], [1.0, 0.003], [BAND[1], 0], [1.7, 0], [WIN[0], 0.01], [WIN[1], 0.04],
  [TOP, 0.05], [3.02, 0.08], [S, 0.14], [3.28, 0.3], [3.35, 0.5], [3.41, 0.75], [3.44, 1.0], [C, JOIN],
];

/**
 * The plan: the front bowed forward across its middle (BULGE back at its edges, a parabola), then the
 * corners sweeping 1.05 m further back into the sides (elliptic), less in the dome.
 */
const FLAT = 0.6;
const BULGE = 0.09;
const RADIUS = W - FLAT;
const DEPTH = 1.05;
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(DEPTH, JOIN - d - BULGE - 0.05))]);
/** The face's depth behind its tip at a lateral offset, at window height (the plan's ellipse). */
const planD = (lat: number, y: number): number => {
  const depth = CORNER_DEPTH.reduce((acc, [yy, dd]) => (yy <= y ? dd : acc), DEPTH);
  const prof = PROFILE.reduce((acc, [yy, dd]) => (yy <= y ? dd : acc), 0);
  if (Math.abs(lat) <= FLAT) return prof + BULGE * (lat / FLAT) ** 2;
  const t = Math.min(1, (Math.abs(lat) - FLAT) / RADIUS);
  return prof + BULGE + depth * (1 - Math.sqrt(1 - t * t));
};

/** The windscreen: the centre pane and the two raked side panes (their outer edges leaning out to the top) in one white surround. */
const SIDE_PANE = { inner: 0.36, outer: [0.84, 0.95] as const };
const SURROUND = 0.045;
/** The corner window's inner edge, a pillar beyond the side pane's: lat at the sill and head. */
const CORNER_IN = [0.96, 1.07] as const;
/** The corner window's rear edge behind the tip, on the cab's side just ahead of the join. */
const CORNER_BACK = 1.17;

const mirror = (pts: Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();
const sidePane = (k: number): Pt[] => {
  const [y0, y1] = [WIN[0] + k, WIN[1] - k];
  const lean = (SIDE_PANE.outer[1] - SIDE_PANE.outer[0]) / (WIN[1] - WIN[0]);
  const out = (y: number) => SIDE_PANE.outer[0] + (y - WIN[0]) * lean - k;
  return [[SIDE_PANE.inner + k, y0], [out(y0), y0], [out(y1), y1], [SIDE_PANE.inner + k, y1]];
};

/** The red beak: the waist band's point, 0.7 m wide where it leaves the band, rising between the headlights to the emblem's hub, its sides concave. */
const BEAK_HALF: Pt[] = [[0.6, BAND[1] - 0.02], [0.35, 1.18], [0.24, 1.24], [0.16, 1.33], [0.11, 1.44], [0.075, 1.56], [0.045, 1.67], [0, 1.79]];
const BEAK: Pt[] = [...BEAK_HALF, ...mirror(BEAK_HALF).slice(1)];

/** The apron's arch round the coupler. */
const ARCH: Pt[] = [[-0.55, B + 0.02], [0.55, B + 0.02], [0.56, 0.58], [0.47, 0.71], [0.27, 0.79], [0, 0.815], [-0.27, 0.79], [-0.47, 0.71], [-0.56, 0.58]];

/**
 * The winged NS emblem just under the panes' foot, 1.04 m across: each wing in three convex pieces tapering
 * to an upswept point, the raised round hub (0.28 m) with the blue NS medallion in its silver ring.
 */
const EMBLEM_Y = 1.9;
const wing = (sd: number): Array<{ mat: string; pts: Pt[]; fine: number }> => {
  const p = (pts: Pt[]): Pt[] => (sd > 0 ? pts : mirror(pts.map(([l, y]): Pt => [l, y])));
  return [
    { mat: "emblem", pts: p([[0.11, EMBLEM_Y - 0.07], [0.28, EMBLEM_Y - 0.05], [0.28, EMBLEM_Y + 0.09], [0.11, EMBLEM_Y + 0.1]]), fine: 2 },
    { mat: "emblem", pts: p([[0.28, EMBLEM_Y - 0.05], [0.42, EMBLEM_Y - 0.01], [0.42, EMBLEM_Y + 0.08], [0.28, EMBLEM_Y + 0.09]]), fine: 2 },
    { mat: "emblem", pts: p([[0.42, EMBLEM_Y - 0.01], [0.52, EMBLEM_Y + 0.06], [0.42, EMBLEM_Y + 0.08]]), fine: 1 },
  ];
};

const ROWS = [...new Set([...PROFILE.map(([y]) => y), LINE[0], 1.3, 1.5, 1.7, 1.6, EMBLEM_Y - 0.1, EMBLEM_Y + 0.1, WIN[0] - SURROUND, WIN[1] + SURROUND, 3.1])].sort((a, b) => a - b);

export const DE1_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.0, reach: REACH, first: CAB_DOOR[0], roofFrom: S + 0.01, bulge: BULGE, tolerance: 0.02, cols: [5, 4, 1, 1], wrap: true,
  profile: PROFILE,
  corner: [[B, RADIUS], [C, RADIUS]],
  cornerDepth: CORNER_DEPTH,
  rows: ROWS,
  fields: [
    // the white surround of the three front panes, the blue between them, then the side panes' glass
    { mat: "white", pts: [[-(SIDE_PANE.outer[0] + SURROUND), WIN[0] - SURROUND], [SIDE_PANE.outer[0] + SURROUND, WIN[0] - SURROUND], [SIDE_PANE.outer[1] + SURROUND, WIN[1] + SURROUND], [-(SIDE_PANE.outer[1] + SURROUND), WIN[1] + SURROUND]] },
    { mat: "blue", pts: [[-SIDE_PANE.outer[0], WIN[0]], [SIDE_PANE.outer[0], WIN[0]], [SIDE_PANE.outer[1], WIN[1]], [-SIDE_PANE.outer[1], WIN[1]]] },
    { mat: "cabGlass", pts: sidePane(0.02) },
    { mat: "cabGlass", pts: mirror(sidePane(0.02)) },
    { mat: "red", pts: BEAK },
    { mat: "recess", pts: ARCH },
  ],
  paint: [
    // the corner windows: white frames, then the glass, from the raked pillar round the corner to the cab's side
    { mat: "white", front: [[WIN[0] - SURROUND, planD(CORNER_IN[0] - SURROUND, 2.4)], [WIN[1] + SURROUND, planD(CORNER_IN[1] - SURROUND, 2.4)]], back: [[WIN[0] - SURROUND, CORNER_BACK + SURROUND], [WIN[1] + SURROUND, CORNER_BACK + SURROUND]] },
    { mat: "cabGlass", front: [[WIN[0], planD(CORNER_IN[0] + 0.02, 2.4)], [WIN[1], planD(CORNER_IN[1] + 0.02, 2.4)]], back: [[WIN[0], CORNER_BACK], [WIN[1], CORNER_BACK]] },
  ],
  panes: [{ lat: [-0.3, 0.3], y: [WIN[0] + 0.02, WIN[1] - 0.02], r: 0 }],
  lodGlass: { hw: 1.1, y: WIN },
  decals: [
    ...wing(1), ...wing(-1),
  ],
  pods: [
    // the emblem's raised hub: the silver ring round the blue NS medallion
    { lat: 0, y: EMBLEM_Y, w: 0.28, h: 0.28, r: 0.14, proud: 0.02, depth: 0.04, mat: "emblem", lamps: [[0, 0.11, "medallion"]] as const },
    // the headlights: dark 0.28 m lenses in silver bezels on wide blue rings, either side of the beak
    ...[1, -1].map((sd) => ({ lat: sd * 0.55, y: 1.6, w: 0.48, h: 0.48, r: 0.24, proud: 0.025, depth: 0.04, mat: "blue", lamps: [[0, 0.18, "lampLens"]] as const })),
  ],
  // the two round lamps in the red band
  lamps: [[-0.6, 3.1, 0.075, "lampTop"], [0.6, 3.1, 0.075, "lampTop"]],
  wipers: [[[0.03, WIN[1] - 0.03], [-0.13, 2.38]]],
};

/** The passenger windows on both sides: four big ones ahead of the double door, six behind it (narrower). */
const BIG: Array<readonly [number, number]> = [7.0, 8.68, 10.33, 12.0].map((t) => [T(t), T(t + 1.3)] as const);
const SMALL: Array<readonly [number, number]> = Array.from({ length: 6 }, (_, k) => {
  const e = TAIL - 0.6 - k * 1.65;
  return [T(e - 1.25), T(e)] as const;
});
/** The double door's two leaves (the series' opening doors). */
const DOOR2: readonly [number, number] = [13.95, 15.45];
/** Only on the right (+Z): the luggage room's two narrow windows and the entrance with its narrow window; on the left two more big windows. */
const RIGHT_NARROW: Array<readonly [number, number]> = [[3.45, 3.8], [4.6, 5.15]];
const RIGHT_DOOR: readonly [number, number] = [5.85, 6.65];
const LEFT_WINDOWS: Array<readonly [number, number]> = [[3.7, 5.0], [5.35, 6.65]];

/** The bogies' centres behind the tip: 18.35 m apart (nl.wikipedia), the front one under the cab door. */
const BOGIES: readonly [number, number] = [4.62, 4.62 + 18.35];

/** The roof's height at a lateral offset z over the body's section at d. */
function roofY(b: SliceBody, d: number, z: number): number {
  const h = halfSlice(b, d);
  for (let k = h.length - 1; k > 0; k--) {
    const [za, ya] = h[k]!, [zb, yb] = h[k - 1]!;
    if (z >= za && z <= zb && zb > za) return ya + ((z - za) / (zb - za)) * (yb - ya);
  }
  return C;
}

/** The cab doors, the one-sided windows and door, the cab's red waist, the coupler, the roof's ventilators and exhaust, the skirts' ribs. */
function de1Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number): void {
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  const win = (sd: number, d0: number, d1: number, y0 = WIN[0], y1 = WIN[1]) => {
    sidePanel(m, b, X, sd, "rubber", d0, d1, y0, y1, 0.006, 0.03);
    sidePanel(m, b, X, sd, "glass", d0 + 0.04, d1 - 0.04, y0 + 0.04, y1 - 0.04, 0.012, 0.004);
  };
  /** A hinged door drawn on the side: its seams, its window and the handle. */
  const door = (sd: number, d0: number, d1: number, glass: readonly [number, number]) => {
    const [y0, y1] = [0.92, 3.02], t = 0.015;
    const seams: Pt[] = [];
    const bar = (a: number, e: number, ya: number, yb: number) => seams.push([a, ya], [e, ya], [e, yb], [a, ya], [e, yb], [a, yb]);
    bar(d0 - t, d0 + t, y0, y1); bar(d1 - t, d1 + t, y0, y1); bar(d0, d1, y1 - t, y1 + t);
    sideDecal(m, b, X, sd, "seam", seams, 0.004);
    win(sd, glass[0], glass[1]);
    sidePanel(m, b, X, sd, "handle", d0 + 0.06, d0 + 0.09, 1.3, 1.95, 0.02, 0.025);
  };
  m.scope("cab doors", () => {
    for (const sd of [1, -1]) m.scope(sd > 0 ? "right" : "left", () => door(sd, T(CAB_DOOR[0]), T(CAB_DOOR[1]), [T(CAB_DOOR[0] + 0.15), T(CAB_DOOR[1] - 0.12)]));
  });
  m.scope("luggage room", () => {
    m.scope("right", () => {
      for (const [a, e] of RIGHT_NARROW) win(1, T(a), T(e), WIN[0], WIN[1] + 0.06);
      door(1, T(RIGHT_DOOR[0]), T(RIGHT_DOOR[1]), [T(RIGHT_DOOR[0] + 0.25), T(RIGHT_DOOR[1] - 0.25)]);
    });
    m.scope("left", () => { for (const [a, e] of LEFT_WINDOWS) win(-1, T(a), T(e)); });
  });
  m.scope("cab waist", () => {
    // the red waist band down to the skirt's top at the cab, back to the cab door (the face carries it round the front)
    const [a, e, y0, y1] = [0, T(CAB_DOOR[0]) - 0.02, BAND[0] + 0.005, BAND[1]];
    for (const sd of [1, -1]) sideDecal(m, b, X, sd, "red", [[a, y0], [e, y0], [e, y1], [a, y0], [e, y1], [a, y1]], 0.003);
  });
  m.scope("skirt ribs", () => {
    // the silver skirts' slanting ribs between the bogies
    const [from, to] = [T(BOGIES[0]) + 2.35, T(BOGIES[1]) - 2.35];
    for (const sd of [1, -1]) {
      const tris: Pt[] = [];
      for (let d = from + 0.15; d + 0.2 < to; d += 0.36) {
        const [ya, yb] = [B + 0.06, A - 0.12];
        tris.push([d, ya], [d + 0.035, ya], [d + 0.155, yb], [d, ya], [d + 0.155, yb], [d + 0.12, yb]);
      }
      sideDecal(m, b, X, sd, "skirtRib", tris, 0.003);
    }
  });
  m.scope("coupler", () => {
    // the Scharfenberg coupler's red head in the apron's arch, the blue warning plate on it
    const x0 = X(-JOIN), x1 = X(-JOIN - REACH);
    block(m, "under", x0 - 0.45, x0 + 0.05, 0.63, 0.77, -0.07, 0.07);
    block(m, "coupler", x1 - 0.22, x1, 0.56, 0.84, -0.16, 0.16);
    block(m, "coupler", x1 - 0.12, x1 - 0.02, 0.48, 0.56, -0.05, 0.05);
    block(m, "plate", x1 - 0.2, x1 - 0.04, 0.84, 0.95, -0.25, 0.25);
  });
  m.scope("roof", () => {
    // the torpedo ventilators either side of the crown, the exhaust over the engine
    for (const sd of [1, -1])
      for (let k = 0; k < 7; k++)
        m.scope("ventilator", () => {
          const d = T(4.6 + k * 3.15), z = sd * 0.66, y = roofY(b, d, z);
          blk("vent", d - 0.2, d + 0.2, y - 0.03, y + 0.1, z - 0.07, z + 0.07);
          blk("vent", d - 0.12, d + 0.12, y + 0.1, y + 0.13, z - 0.05, z + 0.05);
        });
    m.scope("exhaust", () => {
      const d = T(13.3), z = -0.32, x = X(d), y = roofY(b, d, z);
      m.loft("exhaustPipe", ngon(8, 0.07, 0, x, z), y - 0.04, ngon(8, 0.07, 0, x, z), y + 0.3);
      m.emit("smoke", [x, y + 0.3, z], 0.06);
      blk("vent", d + 0.25, d + 1.05, y - 0.03, y + 0.12, -0.45, -0.15);
    });
  });
}

const PALETTE = {
  blue: c("#1f5868", 0.35), red: c("#e2482b", 0.35), silver: c("#b4b2aa", 0.35), white: c("#eef0ed", 0.4), roofG: c("#dadcdb", 0.45), skirtG: c("#b4b2aa", 0.35),
  rubber: c("#e6e8e5", 0.4), seam: c("#173f4a", 0.6), handle: c("#c9ccce", 0.3), emblem: c("#c3c6c8", 0.25), recess: c("#232527", 0.8), skirtRib: c("#8f8d86", 0.5),
  coupler: c("#c8202a", 0.45), plate: c("#2456a6", 0.4), vent: c("#d3d5d4", 0.45), exhaustPipe: c("#2b2c2e", 0.6), lampTop: { color: "#f3efe4", metallic: 0.1, roughness: 0.2 }, lampLens: { color: "#2c3134", metallic: 0.3, roughness: 0.12, glass: true }, medallion: c("#1d4f86", 0.35), cabMask: c("#1d1f22", 0.3),
};

/**
 * The Blauwe Engel's petrol blue (museum unit 41, repainted in its 1954 colours): the silver skirts and
 * apron, the thin red line at the side's foot, at the cab the orange-red waist band and the red band
 * between the windows and the silver roof, back to the cab door; white window frames.
 */
const DE1_BLUE: ShinkansenLivery = {
  title: "Blue Angel", number: "41",
  palette: PALETTE,
  bands: [[0, LINE[0], "silver"], [LINE[0], LINE[1], "red"], [LINE[1], 9, "blue"]],
  front: [[0, BAND[0], "silver"], [BAND[0], BAND[1], "red"], [BAND[1], TOP, "blue"], [TOP, 9, "red"]],
  endSweeps: [{ mat: "red", front: [[TOP, -9], [S, -9]], back: [[TOP, CAB_DOOR[0] - 0.02], [S, CAB_DOOR[0] - 0.02]] }],
  roof: "roofG", skirt: "skirtG",
};

export const DE1: ShinkansenSeries = {
  endLength: LENGTH, midLength: LENGTH, W, Y: 0.9, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: DE1_FACE, cabFaceFrontOnly: true,
  windows: [WIN], windowW: 1.25, pitch: 1.6, door: [0.92, 3.02, WIN[0], WIN[1]], doorW: 1.3, doorGlassW: 0.28,
  layout: {
    end: { doors: [[T(DOOR2[0]), T((DOOR2[0] + DOOR2[1]) / 2), -1], [T((DOOR2[0] + DOOR2[1]) / 2), T(DOOR2[1]), 1]], windows: [...BIG, ...SMALL.slice().reverse()] },
    middle: { doors: [], windows: [] },
  },
  cabWindows: [[T(1.3), T(2.0), WIN[0], WIN[1]]],
  endBogies: [T(BOGIES[0]), T(BOGIES[1])],
  bogieCentres: 18.35, wheelR: 0.5, wheelbase: 3.0, traction: "diesel", single: true, exhaustInFittings: true, couplerY: 0.7,
  fittings: (m, b, X) => de1Fittings(m, b, X),
  liveries: { blue: DE1_BLUE },
  // 57 t (nl.wikipedia, Spoorwegmuseum)
  weight: { end: 57, middle: 57 }, power: 300, maxspeed: 120,
};
