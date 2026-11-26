// The OBB class 5047 (Jenbacher Werke, 1987 - 1995): a single diesel railcar on the series kit
// (shinkansen.ts) with its own cab face (seriesCab.ts) at both ends - the flat, upright front leaning
// back a little over the windscreens and rounding over into the roof, its corners bevelled, the two
// windscreens side by side, the roof lamp between two small lamps on the crest, the headlight and the red
// tail lamp at each side, the grille under the logo, the buffers standing out of the bodywork over the
// plough. The sides: the small rounded cab window and the cab door's window ahead of the passenger door
// near the leading end, the row of rubber-framed windows on a 2 m pitch, the second door near the rear
// end; the body low under the cabs and along the middle, raised over the two bogies (2'B'). The
// underfloor engine (MTU 12V183, 419 kW) exhausting over the roof near the rear end. Two liveries: OBB
// traffic red (red ends with the dark grey band round the windscreens and cab sides, light grey body,
// the current paint) and the delivery paint by Wolfgang Valousek (ivory, an ultramarine window band, a
// blood-orange stripe and door zone, the old OBB emblem). Matched to the photographs and figures in
// assets/obb-5047/ (SOURCES.md). See docs/models/austria-units.md.
//
// Heights over the rail. On the face and in the sweeps d behind the face's tip ("tip d"); elsewhere d
// behind the face's join (body d, JOIN behind the tip). 25.42 m over the buffers (de.wikipedia "OBB
// 5047"), 24.18 m from tip to tip (the buffers 0.62 m out), 2.9 m wide, 3.83 m high; 840 mm wheels.
//
// Scales: positions along the car by projective fits over the two body ends and the side windows'
// equal 2.0 m pitch (photo-obb-5047-011-gro-schweinbarth-2016-11-04.jpg, residual 0.3 px; checked on
// photo-obb-5047001-kienberg.jpg, residual 0.2 px); the face's heights and widths on the head-on
// photographs (photo-gysev-5047-501.jpg about 180 px/m, photo-obb-class-5047-in-vienna-hauptbahnhof.jpg
// about 142 px/m) from the 1.75 m buffer spacing and the 1.06 m buffer height.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { bodyHalf, edgeAt, type SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { crownPane, sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Over the buffers, the buffers' reach beyond each tip, and from tip to tip. */
const OVER_BUFFERS = 25.42;
const BUFFER_GAP = 0.62;
const TIP = OVER_BUFFERS - 2 * BUFFER_GAP;
/** Where the face's rounded top reaches the roof's full height, behind the tip. */
const JOIN = 0.75;
/** The body between the joins. */
const L = TIP - 2 * JOIN;
/** Half width, shoulder and crown. */
const W = 1.45;
const S = 3.4;
const C = 3.83;
/** Body d of a tip d at the front end. */
const b = (tipD: number): number => tipD - JOIN;
/** Body d of a tip d measured from the rear tip. */
const rb = (tipD: number): number => L - b(tipD);

/** The face's paint heights: the buffer beam's top, the windscreen band's foot and head (traffic red). */
const BEAM = 1.27;
const BAND: readonly [number, number] = [1.95, 3.27];

/**
 * The face's centre line: the bodywork upright from its foot (0.7 m, the cab's lower edge) past the
 * buffer beam and the lamps, leaning back 0.1 m over the windscreens, rounding over from 3.45 m into the
 * roof, the crown reached 0.75 m behind the tip (the Sparkasse photograph's three-quarter view).
 */
const PROFILE: Pt[] = [
  [0.7, 0.02], [0.9, 0], [1.3, 0], [2.0, 0.02], [2.6, 0.05], [3.3, 0.1], [3.45, 0.14], [3.6, 0.23], [3.72, 0.37], [3.79, 0.53], [C, JOIN],
];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.0, BEAM, 1.43, 1.93, BAND[0], 2.2, 2.33, 3.18, BAND[1], 3.32])].sort((p, q) => p - q);

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The windscreens: two panes either side of the centre pillar (the head-on photographs). */
const PANE_Y: readonly [number, number] = [2.33, 3.18];
const PANES: ReadonlyArray<readonly [number, number]> = [[-1.12, -0.1], [0.1, 1.12]];

/** The grille under the logo: two slatted panels. */
const GRILLES: ReadonlyArray<readonly [number, number]> = [[-0.42, -0.04], [0.04, 0.42]];
const GRILLE_Y: readonly [number, number] = [1.3, 1.44];

/** The old OBB emblem (the "Pflatsch"): two slanted strokes and the diagonal between them, about (cu, cy), scale s. */
function pflatsch(cu: number, cy: number, s: number): Pt[][] {
  const p = (pts: Pt[]): Pt[] => pts.map(([u, v]): Pt => [cu + u * s, cy + v * s]);
  return [
    p([[-0.05, 0.08], [0.3, 0.08], [0.36, 0.22], [0.01, 0.22]]),
    p([[-0.36, -0.22], [0.01, -0.22], [0.07, -0.08], [-0.3, -0.08]]),
    p([[-0.06, -0.09], [0.08, -0.09], [0.1, 0.09], [-0.04, 0.09]]),
  ];
}

/** The face: the panes in their rubber, the lamps, the grille, the number; the paint comes from the livery's `front` bands. */
const face = (logo: "obb" | "pflatsch"): SeriesCabFace => ({
  dJoin: JOIN, dSide: 0.3, reach: 0.3, first: 7.6, roofFrom: C + 0.01, bulge: 0.02, tolerance: 0.05, cols: [4, 2, 1, 1],
  profile: PROFILE,
  // the bevelled corners: 0.25 m at the buffer beam and the lamps, narrowing to 0.12 m beside the
  // windscreens (the face 2.72 m wide there, 2.53 m at the lamps), rounding away over the top
  corner: [[0.7, 0.26], [1.3, 0.26], [1.8, 0.22], [2.3, 0.14], [3.3, 0.12], [3.45, 0.12], [3.6, 0.1], [3.72, 0.07], [C, 0.02]],
  rows: ROWS,
  masks: PANES.map(([l0, l1]) => ({ lat: [l0 - 0.05, l1 + 0.05] as const, y: [PANE_Y[0] - 0.05, PANE_Y[1] + 0.05] as const, r: 0.12, mat: "rubber" })),
  panes: PANES.map(([l0, l1]) => ({ lat: [l0, l1] as const, y: PANE_Y, r: 0.09 })),
  lodGlass: { hw: 1.12, y: PANE_Y },
  decals: [
    // pressed in the face's own paint (a darker shade), three dark slots each
    ...GRILLES.flatMap(([l0, l1]) => [0, 1, 2].map((k) => ({ mat: "grille", pts: box(l0, l1, GRILLE_Y[0] + 0.01 + k * 0.045, GRILLE_Y[0] + 0.035 + k * 0.045), fine: 1 }))),
    ...(logo === "pflatsch" ? pflatsch(-0.05, 1.68, 0.62).map((pts) => ({ mat: "logo", pts, fine: 1 })) : []),
  ],
  // the headlight and the red tail lamp at each side, the roof lamp between two small lamps on the crest
  lamps: [
    [-0.99, 1.66, 0.125, "lampHead"], [0.99, 1.66, 0.125, "lampHead"], [-0.74, 1.66, 0.065, "lampRed"], [0.74, 1.66, 0.065, "lampRed"],
    [0, 3.62, 0.1, "lampHead"], [-0.28, 3.62, 0.065, "lampDim"], [0.28, 3.62, 0.065, "lampDim"],
  ],
  ...(logo === "obb" ? { texts: [{ text: "OBB", lat: 0, y: 1.6, h: 0.16, mat: "logo" }] } : {}),
  number: { lat: logo === "obb" ? -1.22 : -0.52, y: logo === "obb" ? 2.0 : 1.99, h: logo === "obb" ? 0.08 : 0.13, mat: "faceNo" },
  wipers: [[[-0.6, 2.38], [-0.86, 3.05]], [[0.62, 2.38], [0.36, 3.05]]],
});

/** The doors: the passenger door near each end (single leaf, a tall window), tip d. */
const FRONT_DOOR: readonly [number, number] = [1.43, 2.46];
const REAR_DOOR: readonly [number, number] = [22.2, 23.25];
/** The side windows, tip d: one ahead of the small one near the front, the row on its 2 m pitch, two at the rear. */
const WINDOWS: ReadonlyArray<readonly [number, number]> = [
  [3.37, 4.28], [5.1, 5.71], [6.27, 7.54], [8.27, 9.54], [10.27, 11.54], [12.27, 13.54], [14.27, 15.54], [16.2, 17.45], [17.6, 18.05], [18.23, 19.48], [20.22, 21.51],
];
const WIN_Y: readonly [number, number] = [2.02, 2.87];
/** The cab's side windows (both sides of the leading cab only): the small rounded one at the corner, the cab door's. */
const CAB_WINDOWS: ReadonlyArray<readonly [number, number, number, number]> = [[0.34, 0.65, 2.3, 3.0], [0.8, 1.25, 2.22, 3.0]];
/** The cab door's outline round its window, tip d. */
const CAB_DOOR: readonly [number, number] = [0.72, 1.33];

/** The bogies, tip d of their centres; wheelbase. */
const BOGIE = 4.1;
const WHEELBASE = 2.2;

/** The body's underside by body d: low under the cab ends and along the middle, raised over the bogies. */
const HIGH = { Y: 1.22, A: 1.17, B: 1.12 };
const LOW = { Y: 0.8, A: 0.75, B: 0.7 };
const underside = (k: "Y" | "A" | "B"): Pt[] => {
  const half: Pt[] = [[0, LOW[k]], [b(2.32), LOW[k]], [b(2.45), HIGH[k]], [b(5.95), HIGH[k]], [b(6.3), LOW[k]]];
  return [...half, ...half.map(([d, y]): Pt => [L - d, y]).reverse()];
};

/** Paint between two [y, d] edges on the cab sides, at the front end (tip d) and mirrored at the rear. */
type Sweep = { mat: string; front: Pt[]; back: Pt[]; top?: number };
// (the rear cab face's sides take the front sweeps by their own d: the rear ones stop at its join)
const REAR_JOIN = TIP - JOIN - 0.01;
/** The door leaves' head (the kit's door frame). */
const DOOR_HEAD = 3.22;
/** An upright edge at d between two heights. */
const upright = (d: number, y0: number, y1: number): Pt[] => [[y0, d], [y1, d]];
/** A [y, d] edge turned end for end (tip d from the rear tip), never past the rear join. */
const mirrored = (e: Pt[]): Pt[] => e.map(([y, d]): Pt => [y, Math.min(REAR_JOIN, TIP - d)]);
/**
 * Paint between two edges, from y0 to y1, kept off the door leaves and their frames inside it (the
 * frames would lie in the paint's plane): split ahead of and behind each door, and over it above its head.
 */
function zone(mat: string, front: Pt[], back: Pt[], y0: number, y1: number, doors: ReadonlyArray<readonly [number, number]>): Sweep[] {
  const out: Sweep[] = [];
  let f = front;
  for (const [p, q] of doors) {
    out.push({ mat, front: f, back: upright(p - 0.03, y0, y1) });
    if (y1 > DOOR_HEAD + 0.05) out.push({ mat, front: upright(p - 0.04, DOOR_HEAD + 0.03, y1), back: upright(q + 0.04, DOOR_HEAD + 0.03, y1) });
    f = upright(q + 0.03, y0, y1);
  }
  out.push({ mat, front: f, back });
  return out;
}

const COMMON = {
  rubber: c("#1b1c1e", 0.55), grille: c("#2c2e31", 0.7), slat: c("#5a5e62", 0.5), lampDim: { color: "#d8d2c0", metallic: 0.2, roughness: 0.2, glass: true },
  under: c("#2d2f31", 0.75), alu: { color: "#a9adb0", metallic: 0.6, roughness: 0.35 }, exhaustPipe: c("#2b2c2e", 0.6), roofBox: c("#7a7e80", 0.6),
};

/**
 * OBB traffic red (photo-obb-5047-011-gro-schweinbarth-2016-11-04.jpg, the Vienna head-on photograph):
 * the face red with the dark grey band round the windscreens from 1.95 to 3.27 m, the dark buffer beam
 * under it; the red ends reaching back to a slanting edge behind the first window (3.6 m behind the tip
 * at the roof, 5.3 m at the foot), the dark grey band carried along each cab side to the door; the body
 * light grey, the door leaves pale grey, the underframe dark.
 */
function trafficRed(): ShinkansenLivery {
  // the red ends, the back edge slanting forward toward the roof (measured 5.45 m behind the tip at
  // 0.6 m, 3.55 m at the roof): from the raised underside over the bogies up, and under the cabs down
  // to the body's foot (never hanging below the body over a bogie)
  const edge: Pt[] = [[HIGH.B, 5.45 + ((HIGH.B - 0.6) * (3.55 - 5.45)) / (S + 0.1 - 0.6)], [S + 0.1, 3.55]];
  const ends: Sweep[] = [
    ...zone("red", upright(-9, LOW.B - 0.02, HIGH.B), upright(FRONT_DOOR[0] - 0.03, LOW.B - 0.02, HIGH.B), LOW.B - 0.02, HIGH.B, []),
    ...zone("red", upright(TIP - 2.32, LOW.B - 0.02, HIGH.B), upright(REAR_JOIN, LOW.B - 0.02, HIGH.B), LOW.B - 0.02, HIGH.B, [REAR_DOOR]),
    ...zone("red", upright(-9, HIGH.B, S + 0.1), edge, HIGH.B, S + 0.1, [FRONT_DOOR]),
    ...zone("red", mirrored(edge), upright(REAR_JOIN, HIGH.B, S + 0.1), HIGH.B, S + 0.1, [REAR_DOOR]),
    // the dark grey band from the face along the cab side to the door (the rear cab's behind its door)
    { mat: "band", front: upright(-9, BAND[0], BAND[1]), back: upright(FRONT_DOOR[0] - 0.03, BAND[0], BAND[1]) },
    { mat: "band", front: upright(REAR_DOOR[1] + 0.03, BAND[0], BAND[1]), back: upright(REAR_JOIN, BAND[0], BAND[1]) },
  ];
  return {
    title: "Traffic red", number: "5047 011-1",
    palette: {
      ...COMMON, red: c("#d71f26", 0.45), band: c("#4a4e53", 0.5), silver: c("#c9cbcb", 0.4), dark: c("#2f3133", 0.7), roofG: c("#b7babb", 0.6),
      doorG: c("#e2e3e1", 0.4), faceNo: c("#f2f2f0", 0.4), logo: c("#f4f4f2", 0.4), plough: c("#2f3133", 0.7), lettering: c("#2f3133", 0.6), sideLogo: c("#d71f26", 0.45),
    },
    bands: [[0, LOW.B, "dark"], [LOW.B, 9, "silver"]],
    front: [[0, BEAM, "dark"], [BEAM, BAND[0], "red"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "red"]],
    doors: [[0, 9, "doorG"]],
    roof: "roofG", skirt: "dark",
    endSweeps: ends,
    endLettering: [{ text: "OBB", d: b(17.0), y: 1.72, h: 0.2, mat: "sideLogo" }],
    lodSideFields: {
      end: [
        { d: [0, 4.5], bands: [[0, 9, "red"]] },
        { d: [TIP - 4.5, TIP], bands: [[0, 9, "red"]] },
      ],
    },
  };
}

/** Valousek's paint heights on the sides: the orange stripe, the blue window band, the blue roof edge. */
const STRIPE: readonly [number, number] = [1.27, 1.43];
const BLUE: readonly [number, number] = [1.93, 3.05];
const ROOF_EDGE = 3.33;

/**
 * The delivery paint designed by Wolfgang Valousek ("elfenbein-ultramarinblau-blutorange", 5047 001 at
 * Kienberg, 5047 012 at Neuberg-Ort, 5047 049 at Hohenruppersdorf): ivory, a blood-orange stripe along the
 * foot, the ultramarine window band dropping to the stripe beside the orange door zone at each end, the
 * blue roof edge; on the face the blue band round the windscreens over the orange band with the number,
 * the ivory panel with the emblem, the blue buffer beam and the orange plough.
 */
function valousek(): ShinkansenLivery {
  /** The orange door zone's front and back edges (tip d by height), both leaning back toward the roof. */
  const zoneFront: Pt[] = [[STRIPE[0], 0.0], [2.2, 0.52], [BLUE[1], 0.6]];
  const zoneBack: Pt[] = [[STRIPE[0], 2.5], [BLUE[1], 3.2]];
  const ends: Sweep[] = [
    // the orange zone round the cab door and the passenger door
    ...zone("orange", zoneFront, zoneBack, STRIPE[0], BLUE[1], [FRONT_DOOR]),
    ...zone("orange", mirrored(zoneBack), mirrored(zoneFront), STRIPE[0], BLUE[1], [REAR_DOOR]),
  ];
  // the blue window band between the zones and the blue dropping to the stripe behind each zone: decals
  // over the ivory sides (cheaper than a band and sweeps along the whole car); body d
  const drop: Pt[] = [[STRIPE[1], 2.53], [STRIPE[1], 3.73], [BLUE[0], 3.95], [BLUE[0], 2.72]].map(([y, d]): Pt => [b(d), y]);
  const blue: Array<{ mat: string; pts: Pt[] }> = [
    { mat: "blue", pts: [[b(2.72), BLUE[0]], [rb(2.72), BLUE[0]], [rb(3.2), BLUE[1]], [b(3.2), BLUE[1]]] },
    { mat: "blue", pts: drop },
    { mat: "blue", pts: drop.map(([d, y]): Pt => [L - d, y]).reverse() },
  ];
  return {
    title: "Valousek", number: "5047 001-2",
    palette: {
      ...COMMON, ivory: c("#e6dcba", 0.45), blue: c("#2d47a6", 0.4), orange: c("#e04a22", 0.45), dark: c("#2c2d2f", 0.7), roofG: c("#c8c8c0", 0.6),
      faceNo: c("#f6f1e4", 0.4), logo: c("#e04a22", 0.45), plough: c("#e04a22", 0.45), lettering: c("#f6f1e4", 0.4),
    },
    bands: [[0, LOW.B, "dark"], [LOW.B, STRIPE[0], "ivory"], [STRIPE[0], STRIPE[1], "orange"], [STRIPE[1], ROOF_EDGE, "ivory"], [ROOF_EDGE, 9, "blue"]],
    front: [[0, BEAM, "blue"], [BEAM, 1.93, "ivory"], [1.93, 2.2, "orange"], [2.2, 3.32, "blue"], [3.32, 9, "ivory"]],
    doors: [[0, 9, "orange"]],
    roof: "roofG", skirt: "dark",
    endSweeps: ends,
    sideFields: { end: [...blue, ...pflatsch(b(18.9), 1.66, 0.5).map((pts) => ({ mat: "orange", pts }))] },
    lodSideFields: {
      end: [
        { d: [0.55, 3.2], bands: [[0, 9, "orange"]] },
        { d: [TIP - 3.2, TIP - 0.55], bands: [[0, 9, "orange"]] },
      ],
    },
  };
}

/** The cab windows, the cab door's outline, the ploughs, the underfloor and the roof's exhaust. */
/**
 * Traffic red's red cap carried back along the roof's edges at both ends, from the shoulder up the
 * roof's round: back to the side's red edge (3.55 m behind the tip) at the shoulder, 1.9 m at 3.62 m
 * (the crown grey behind the face's rounded top), in strips up the arc.
 */
function capEdges(m: MeshBuilder, sb: SliceBody, X: (d: number) => number): void {
  const [dS, dY, yTop] = [b(3.55), b(1.9), 3.62];
  const half = bodyHalf(sb, dS);
  const zS = sb.w(dS) * sb.lean, zY = edgeAt(half, yTop), k = 14;
  for (const e of [1, -1]) for (const sd of [1, -1]) for (let i = 0; i < k; i++) {
    const [zHi, zLo] = [zS - ((zS - zY) * i) / k, zS - ((zS - zY) * (i + 1)) / k];
    const d1 = dS + ((dY - dS) * (i + 0.5)) / k;
    crownPane(m, sb, X, sd, "red", e > 0 ? [0, d1] : [L - d1, L], [zLo, zHi + (i === 0 ? 0.05 : 0)], 0.004);
  }
}

function obb5047Fittings(m: MeshBuilder, sb: SliceBody, X: (d: number) => number, cap: boolean): void {
  if (cap) m.scope("cab roof edges", () => capEdges(m, sb, X));
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("cab windows", () => {
    // the leading cab only (the rear cab's door stands next to its corner)
    for (const sd of [1, -1]) for (const [p, q, y0, y1] of CAB_WINDOWS) {
      sidePanel(m, sb, X, sd, "rubber", b(p), b(q), y0, y1, 0.012, 0.012);
      sidePanel(m, sb, X, sd, "glass", b(p) + 0.04, b(q) - 0.04, y0 + 0.04, y1 - 0.04, 0.017, 0.004);
    }
  });
  m.scope("window transoms", () => {
    // the hopper light's bar across each side window
    const tris: Pt[] = [];
    for (const [p, q] of WINDOWS) if (q - p > 0.8) {
      const [a, e, y0, y1] = [b(p) + 0.03, b(q) - 0.03, 2.56, 2.6];
      tris.push([a, y0], [e, y0], [e, y1], [a, y0], [e, y1], [a, y1]);
    }
    for (const sd of [1, -1]) sideDecal(m, sb, X, sd, "alu", tris, 0.016);
  });
  m.scope("cab door", () => {
    // the cab door's seams round its window, from the foot to under the roof
    const [p, q] = [b(CAB_DOOR[0]), b(CAB_DOOR[1])], [y0, y1] = [0.75, 3.22], t = 0.018;
    const tris: Pt[] = [];
    for (const [a, e, ya, yb] of [[p, p + t, y0, y1], [q - t, q, y0, y1], [p, q, y1 - t, y1]] as const) tris.push([a, ya], [e, ya], [e, yb], [a, ya], [e, yb], [a, yb]);
    for (const sd of [1, -1]) sideDecal(m, sb, X, sd, "rubber", tris, 0.026);
  });
  m.scope("ploughs", () => {
    // under each face behind the buffers: the plough from the cab's foot down to 0.3 m, set back at its foot
    for (const e of [1, -1]) {
      const d0 = e > 0 ? b(0.02) : rb(0.02), d1 = e > 0 ? b(0.9) : rb(0.9);
      blk("plough", d0, d1, 0.45, LOW.B + 0.02, -1.05, 1.05);
      const f0 = e > 0 ? b(0.18) : rb(0.18);
      blk("plough", f0, d1, 0.3, 0.45, -0.95, 0.95);
    }
  });
  m.scope("underfloor", () => {
    // the engine and its transmission, the cooler, the tanks and the battery boxes between the bogies
    const y1 = LOW.B - 0.02;
    blk("under", b(7.0), b(10.6), 0.36, y1, -0.95, 0.95);
    blk("under", b(11.2), b(13.4), 0.42, y1, -0.85, 0.85);
    blk("under", b(14.0), b(17.6), 0.4, y1, -1.0, 1.0);
  });
  m.scope("exhaust", () => {
    // the engine's exhaust over the roof near the rear end, on the crown
    const x = X(b(18.2));
    m.emit("smoke", [x, C + 0.16, 0], 0.06);
    blk("roofBox", b(17.9), b(18.6), C - 0.05, C + 0.06, -0.3, 0.3);
    block(m, "exhaustPipe", x - 0.08, x + 0.08, C + 0.04, C + 0.16, -0.08, 0.08);
  });
}

export const OBB5047: ShinkansenSeries = {
  endLength: OVER_BUFFERS, midLength: OVER_BUFFERS, W, Y: HIGH.Y, S, C, lean: 0.985, B: HIGH.B, A: HIGH.A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: face("obb"),
  railcarUnderside: { Y: underside("Y"), A: underside("A"), B: underside("B") },
  // the rubber-framed windows 2.02 - 2.87 m; the single-leaf doors 1.03 m wide, their window 0.72 m
  windows: [WIN_Y], windowW: 1.27, pitch: 2.0, door: [0.72, 3.22, 1.98, 2.9], doorW: 1.03, doorGlassW: 0.72, windowFrameMat: "alu",
  layout: {
    end: {
      doors: [[b(FRONT_DOOR[0]), b(FRONT_DOOR[1]), -1], [b(REAR_DOOR[0]), b(REAR_DOOR[1]), 1]],
      windows: WINDOWS.map(([p, q]): readonly [number, number] => [b(p), b(q)]),
    },
    middle: { doors: [], windows: [] },
  },
  // 2'B': the bogies 4.1 m inside the tips, 2.2 m wheelbase, 840 mm wheels
  endBogies: [b(BOGIE), b(TIP - BOGIE)], bogieCentres: TIP - 2 * BOGIE, wheelR: 0.42, wheelbase: WHEELBASE,
  traction: "diesel", single: true, endCoupler: "buffers", bufferBeam: false, bufferGap: BUFFER_GAP, exhaustInFittings: true,
  numberAt: [6.5, 1.1, 0.09],
  fittings: (m, sb, X) => obb5047Fittings(m, sb, X, true),
  liveries: { trafficRed: trafficRed(), valousek: valousek() },
  weight: { end: 44, middle: 44 }, power: 419, maxspeed: 120,
};

/** The delivery paint's face carries the old emblem in place of the OBB wordmark. */
const VALOUSEK_SERIES: ShinkansenSeries = { ...OBB5047, cabFace: face("pflatsch"), fittings: (m, sb, X) => obb5047Fittings(m, sb, X, false) };

const P = seriesParams(OBB5047);

const seriesOf = (v?: ParamValues): ShinkansenSeries => (v?.livery === "valousek" ? VALOUSEK_SERIES : OBB5047);
export function obb5047(v?: ParamValues): MeshBuilder { return buildSeries(seriesOf(v), P, v); }
export function obb5047Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(seriesOf(v), P, v); }

export const OBB5047_DESIGN = seriesDesign("proc-vehicle-obb-5047", "OBB 5047", OBB5047, P, obb5047, obb5047Lod, "obb-5047", "uic");
