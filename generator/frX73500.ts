// The SNCF X 73500 "A TER" (Alstom / De Dietrich with LHB, 1999 - 2004): a single diesel railcar on the
// series kit (shinkansen.ts) with its own cab face (seriesCab.ts) at both ends - the face raked back
// about 45 degrees from the lamps to the crown, its broad rounded corners, the big windscreen in its
// black surround over the grey strip with the number, the black lamp band wrapping round the corners
// with the white headlight and the red tail lamp at each end, the blue lip under it, the grey bumper
// with the coupler's recess, the dark hatch on the crown; the blue cap sweeping back over the cab sides
// to the seam, the anthracite panel with the cab's small side window on each cab side, the grey engine
// housing under each cab (the two MAN engines sit under the cabs) with its cooling grilles. The body:
// raised over the two bogies (two big windows each end, the silver fairing over each bogie), the low
// floor between them (four tall windows), one single-leaf door a side at each end of the low floor, a
// destination display beside each door, the louvre strip along the cantrail, the air conditioning on
// the roof, an exhaust on each cab's crown. Matched to the photographs and figures in
// assets/sncf-x73500/ (SOURCES.md). See docs/models/france-trains.md.
//
// Heights over the rail. On the face, d behind its tip; elsewhere "tip d" (behind the front tip) or
// body d (behind the face's join, JOIN behind the tip). 28.90 m over the couplers, 27.9 m from tip to
// tip (the couplers 0.5 m out), 2.90 m wide, 3.70 m high; bogie centres 17.5 m, 2.1 m wheelbase, 840 mm
// wheels (fr.wikipedia "X 73500").
//
// Scales: the side-on photograph of the 1:87 model (photo-scalemodel-h0-x73500.jpg, 1280 px) 41.3 px/m
// from the bogie centres, positions along the car by a projective fit over the tips and the bogie
// centres (residual 2 px), heights 42.7 px/m (128 px/m on a 3x enlargement); the head-on photograph
// (photo-x73585-...-cramos.jpg) 124 px/m from the 3.7 m height; the three-quarter photographs
// (photo-x-73500-pays-de-la-loire.jpg, photo-bahnhof-offenburg-...-2024.jpg) by projective fits over
// the seam, the windows, the display and the door (tip d 3.15 - 8.55).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues } from "./design.ts";
import { ngon } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import { buildSeries, buildSeriesLod, seriesParams, type SeriesSidePanel, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** From tip to tip; the couplers' reach beyond each tip; the cab module's seam (the face's join) behind the tip. */
const TIP = 27.9;
const REACH = 0.5;
const JOIN = 3.15;
/** The body between the joins (body d 0 .. L) and its middle. */
const L = TIP - 2 * JOIN;
const MID = L / 2;
/** Half width, crown and shoulder (2.90 m wide, 3.70 m high; the side upright to 3.3 m under the roof's round). */
const W = 1.45;
const C = 3.7;
const S = 3.3;
/** Body d of a tip d. */
const b = (tipD: number): number => tipD - JOIN;

/** The paint heights: the bumper and engine housing's top, the cab panel's sill and head, the silver wedge's head at the seam. */
const HOUSING = 1.17;
const PANEL: readonly [number, number] = [1.56, 2.67];
const WEDGE = 3.24;

/**
 * The face's centre line, measured on the side-on photograph: the bumper upright from 0.45 to 1.17 m
 * and rounding under to 0.2 m, the blue lip and the lamp band leaning back a little, the windscreen raked
 * about 45 degrees from 2.13 m (0.3 m behind the tip) to its head at 3.41 m (1.55 m behind), the crown
 * rounding over to the roof's 3.7 m at the seam.
 */
const PROFILE: Pt[] = [
  [0.2, 0.25], [0.45, 0.04], [0.7, 0], [HOUSING, 0], [1.45, 0.08], [1.9, 0.2], [2.13, 0.3],
  [2.6, 0.62], [3.0, 1.0], [3.41, 1.55], [3.55, 1.95], [3.65, 2.45], [C, JOIN],
];
const ROWS = [...new Set([...PROFILE.map(([y]) => y), PANEL[0], PANEL[1], WEDGE])].sort((p, q) => p - q);

/** The blue sweep's back edge on the cab side, [y, d]: along the panel's front edge, then over the silver wedge to the seam at 3.24 m. */
const BLUE_EDGE = (() => {
  const pts: Pt[] = [[HOUSING, 0.22], [PANEL[0], 0.5], [PANEL[1], 1.47], [WEDGE, JOIN + 0.02], [C + 0.1, JOIN + 0.1]];
  const f = (y: number): number => {
    for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [ya, da] = pts[i - 1]!, [yb, db] = pts[i]!; return da + ((y - ya) / (yb - ya)) * (db - da); }
    return pts[pts.length - 1]![1];
  };
  return { pts, f };
})();

/** A rounded octagon [lat0, lat1] x [y0, y1], its corners cut by k. */
const oct = (l0: number, l1: number, y0: number, y1: number, k: number): Pt[] => [
  [l0 + k, y0], [l1 - k, y0], [l1, y0 + k], [l1, y1 - k], [l1 - k, y1], [l0 + k, y1], [l0, y1 - k], [l0, y0 + k],
];

/**
 * The cab face (Moreuil, La Chaize-le-Vicomte, Nantes and Muellheim photographs): the broad front with
 * deep rounded corners (2.58 m of its 2.9 m seen head-on at the lamps), bowed a little; its paint as
 * the photographs show it - the grey bumper and housing to 1.17 m, the blue face and cap, the anthracite
 * panel on each cab side between the blue sweep and the seam (1.56 - 2.67 m), the windscreen's black
 * surround over the grey strip (1.9 - 2.14 m) and the black lamp band (1.45 - 1.9 m).
 */
export const X73500_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 1.2, reach: REACH, first: 8.55, roofFrom: C + 0.01, bulge: 0.08, tolerance: 0.045, cols: [4, 2, 1, 1],
  profile: PROFILE,
  corner: [[0.2, 0.45], [0.7, 0.5], [1.17, 0.5], [1.9, 0.55], [2.6, 0.62], [3.2, 0.6], [3.5, 0.45], [3.65, 0.25], [C, 0.05]],
  cornerDepth: [[0.2, 0.8], [0.7, 0.8], [1.17, 0.8], [1.9, 0.9], [2.6, 1.0], [3.2, 0.95], [3.5, 0.7], [3.65, 0.35], [C, 0.08]],
  rows: ROWS,
  paint: [
    // the engine housing's grey under each cab, its top level with the bumper's
    { mat: "dark", front: [[0, -9], [HOUSING, -9]], back: [[0, JOIN + 0.1], [HOUSING, JOIN + 0.1]] },
    // the anthracite panel on the cab side, its front edge raked with the blue sweep
    { mat: "panel", front: [[PANEL[0], BLUE_EDGE.f(PANEL[0])], [PANEL[1], BLUE_EDGE.f(PANEL[1])]], back: [[PANEL[0], JOIN + 0.1], [PANEL[1], JOIN + 0.1]] },
    // the blue face and cap: back along the cab side over the panel's front edge, then over the silver wedge to the seam at 3.24 m
    { mat: "blue", front: [[HOUSING, -9], [C + 0.1, -9]], back: BLUE_EDGE.pts, top: 9 },
  ],
  fields: [
    // the coupler's recess in the bumper
    { mat: "recess", pts: oct(-0.76, 0.76, 0.5, 1.1, 0.1) },
  ],
  masks: [
    // the lamp band, the grey strip under the windscreen, the windscreen's surround and the crown's hatch
    { lat: [-1.02, 1.02], y: [1.45, 1.9], r: 0.07, mat: "lampPanel" },
    { lat: [-1.04, 1.04], y: [1.9, 2.14], r: 0, mat: "strip" },
    { lat: [-1.08, 1.08], y: [2.12, 3.44], r: 0.06, mat: "cabMask" },
    { lat: [-0.24, 0.24], y: [3.49, 3.62], r: 0.03, mat: "hatch" },
  ],
  panes: [{ lat: [-1.03, 1.03], y: [2.17, 3.39], r: 0.04 }],
  lodGlass: { hw: 1.03, y: [2.17, 3.39] },
  // the headlight at each end of the lamp band, the tail lamp inside it (flat lenses behind the band's glass)
  decals: ([[-0.86, 0.075, "lampHead"], [0.86, 0.075, "lampHead"], [-0.62, 0.06, "lampRed"], [0.62, 0.06, "lampRed"]] as const).map(([lat, r, mat]) => ({
    mat, pts: Array.from({ length: 10 }, (_, i): Pt => [lat + r * Math.cos((i * Math.PI) / 5), 1.67 + r * Math.sin((i * Math.PI) / 5)]), fine: 1,
  })),
  number: { lat: -0.36, y: 1.965, h: 0.11, mat: "faceNo" },
  // one wiper, parked leaning left from its pivot under the windscreen's middle
  wipers: [[[-0.05, 2.22], [-0.62, 3.02]]],
};

/** The cab's side window behind the panel's front edge: tip d and heights. */
const CAB_WINDOW = { d: [1.65, 2.2] as const, y: [2.2, 2.6] as const };
/** The engine housing's two cooling grilles on each cab side: tip d spans and heights. */
const GRILLES: ReadonlyArray<readonly [number, number]> = [[1.05, 1.78], [1.88, 2.6]];
const GRILLE_Y: readonly [number, number] = [0.42, 0.98];

/** The doors: one 1.3 m leaf a side at each end of the low floor, centred 4.55 m from the car's middle (body d, the way each slides). */
const DOORS: ReadonlyArray<readonly [number, number, number]> = [[MID - 5.2, MID - 3.9, -1], [MID + 3.9, MID + 5.2, 1]];
/** The raised ends' two big windows (tip d 3.47 - 4.88 and 5.2 - 6.69) and the low floor's four between the doors. */
const END_WINDOWS: ReadonlyArray<readonly [number, number]> = (() => {
  const front: Array<readonly [number, number]> = [[b(3.47), b(4.88)], [b(5.2), b(6.69)]];
  return [...front, ...front.map(([p, q]): readonly [number, number] => [L - q, L - p]).reverse()];
})();
const MID_WINDOWS: ReadonlyArray<readonly [number, number]> = [[MID - 3.37, MID - 1.95], [MID - 1.64, MID - 0.16], [MID + 0.16, MID + 1.64], [MID + 1.95, MID + 3.37]];
const END_WIN_Y: readonly [number, number] = [1.68, 2.58];
const MID_WIN_Y: readonly [number, number] = [1.08, 2.62];

/** The underside by body d: the engine housing low under the cab, high over the bogies (2.1 m wheelbase, the frame 0.43 - 3.67 m), low between them. */
const HIGH = { Y: 1.1, A: 1.0, B: 0.92 };
const CAB_LOW = { Y: 0.45, A: 0.3, B: 0.2 };
const FLOOR_LOW = { Y: 0.6, A: 0.45, B: 0.35 };
const underside = (k: "Y" | "A" | "B"): Pt[] => {
  const half: Pt[] = [[0, CAB_LOW[k]], [0.15, CAB_LOW[k]], [0.3, HIGH[k]], [3.75, HIGH[k]], [4.15, FLOOR_LOW[k]]];
  return [...half, ...half.map(([d, y]): Pt => [L - d, y]).reverse()];
};

/** The panels on the sides (tip d): a display beside each door, the louvres along the cantrail, the small grille under each display. */
const panels = (): SeriesSidePanel[] => {
  const one: SeriesSidePanel[] = [
    { d: [7.25, 8.25], y: [2.3, 2.46], kind: "panel", mat: "display" },
    { d: [7.35, 8.0], y: [1.12, 1.42], kind: "louvres", louvres: 4 },
  ];
  const mirrored = one.map((p): SeriesSidePanel => ({ ...p, d: [TIP - p.d[1], TIP - p.d[0]] }));
  const louvres: SeriesSidePanel[] = [[7.4, 13.88], [14.02, 20.5]].map(([p, q]) => ({ d: [p!, q!] as const, y: [3.0, 3.2] as const, kind: "louvres" as const, louvres: 5 }));
  return [...one, ...mirrored, ...louvres];
};

/** The cab-end fittings at both ends, the bogie fairings, the roof's air conditioning and vents. */
function x73500Fittings(m: MeshBuilder, sb: SliceBody, X: (d: number) => number): void {
  // body d of a tip d at the front (e 1) or the rear (e -1) end
  const at = (e: number, tipD: number) => (e > 0 ? b(tipD) : L - b(tipD));
  const span = (e: number, p: number, q: number): [number, number] => (e > 0 ? [at(e, p), at(e, q)] : [at(e, q), at(e, p)]);
  for (const e of [1, -1]) m.scope(e > 0 ? "front cab" : "rear cab", () => {
    m.scope("cab windows", () => {
      const [d0, d1] = span(e, CAB_WINDOW.d[0], CAB_WINDOW.d[1]);
      for (const sd of [1, -1]) {
        sidePanel(m, sb, X, sd, "rubber", d0, d1, CAB_WINDOW.y[0], CAB_WINDOW.y[1], 0.007, 0.03);
        sidePanel(m, sb, X, sd, "glass", d0 + 0.035, d1 - 0.035, CAB_WINDOW.y[0] + 0.035, CAB_WINDOW.y[1] - 0.035, 0.012, 0.004);
      }
    });
    m.scope("cooling grilles", () => {
      for (const sd of [1, -1]) for (const [p, q] of GRILLES) {
        const [d0, d1] = span(e, p, q);
        sidePanel(m, sb, X, sd, "grille", d0, d1, GRILLE_Y[0], GRILLE_Y[1], 0.006, 0.03);
        for (let i = 1; i < 6; i++) {
          const y = GRILLE_Y[0] + ((GRILLE_Y[1] - GRILLE_Y[0]) * i) / 6;
          sidePanel(m, sb, X, sd, "slat", d0 + 0.03, d1 - 0.03, y - 0.012, y + 0.012, 0.014, 0.008);
        }
      }
    });
    m.scope("logo", () => {
      // the SNCF logo on the cab panel, low at its front
      const [d0, d1] = span(e, 1.05, 1.62);
      for (const sd of [1, -1]) sidePanel(m, sb, X, sd, "sncfRed", d0, d1, 1.72, 1.93, 0.006, 0.004);
    });
    m.scope("horn", () => {
      // the streamlined horn housing at the top of each cab side, just ahead of the seam
      const [x0, x1] = [X(at(e, 2.5)), X(at(e, 3.02))];
      for (const sd of [1, -1]) {
        const ring = (r: number) => ngon(8, r, 0, sd * (W - 0.06), 3.14);
        const xs = [x0, x0 + (x1 - x0) * 0.25, x0 + (x1 - x0) * 0.75, x1];
        const rs = e > 0 ? [0.02, 0.07, 0.07, 0.05] : [0.05, 0.07, 0.07, 0.02];
        for (let i = 0; i < 3; i++) m.sweep("silver", "x", ring(rs[i]!), xs[i]!, ring(rs[i + 1]!), xs[i + 1]!);
      }
    });
    m.scope("exhaust stack", () => {
      // on the cab's crown behind the hatch, off the centre line: the engine is under the cab
      const x = X(at(e, 2.75)), z = e * -0.35;
      m.emit("smoke", [x, C + 0.09, z], 0.05);
      block(m, "exhaustPipe", x - 0.12, x + 0.12, C - 0.08, C + 0.09, z - 0.08, z + 0.08);
    });
  });
  m.scope("bogie fairings", () => {
    // the silver fairing along the body's foot over each bogie, rounded at its ends
    for (const [p, q] of [[0.1, 3.55], [L - 3.55, L - 0.1]] as const)
      for (const sd of [1, -1]) {
        const [x0, x1] = [X(q), X(p)], r = 0.09, zc = sd * (W - 0.05);
        const outline: Array<[number, number]> = [];
        for (let i = 0; i <= 4; i++) { const a = -Math.PI / 2 + (i / 4) * Math.PI; outline.push([x1 - r + r * Math.cos(a), zc + r * Math.sin(a)]); }
        for (let i = 0; i <= 4; i++) { const a = Math.PI / 2 + (i / 4) * Math.PI; outline.push([x0 + r + r * Math.cos(a), zc + r * Math.sin(a)]); }
        m.loft("silver", outline, 0.86, outline, 1.07);
      }
  });
  m.scope("roof equipment", () => {
    // the air conditioning: a low housing over the low floor, grilles along its sides
    const [d0, d1] = [b(10.5), b(17.4)];
    block(m, "roofBox", X(d1), X(d0), C - 0.08, C + 0.14, -0.78, 0.78);
    block(m, "roofBox", X(d1 - 0.35), X(d0 + 0.35), C + 0.14, C + 0.19, -0.6, 0.6);
    for (const sd of [1, -1]) for (let k = 0; k < 4; k++) {
      const [p, q] = [d0 + 0.4 + k * ((d1 - d0 - 0.8) / 4) + 0.08, d0 + 0.4 + (k + 1) * ((d1 - d0 - 0.8) / 4) - 0.08];
      block(m, "grille", X(q), X(p), C - 0.02, C + 0.1, sd > 0 ? 0.78 : -0.79, sd > 0 ? 0.79 : -0.78);
    }
    // the round vents over the raised ends' passenger saloons
    for (const tipD of [8.6, TIP - 8.6]) {
      const x = X(b(tipD));
      m.loft("roofBox", ngon(12, 0.22, 0, x, 0), C - 0.04, ngon(12, 0.18, 0, x, 0), C + 0.08);
    }
  });
}

/** The colours both liveries share. */
const COMMON = {
  silver: c("#b2b7bc", 0.3), blue: c("#2747b4", 0.3), panel: c("#4f545a", 0.32), dark: c("#5a5e63", 0.45), roofG: c("#c4c8cb", 0.5),
  lampPanel: { color: "#0e1013", metallic: 0.2, roughness: 0.12, glass: true }, strip: c("#484c51", 0.4), cabMask: c("#16181b", 0.2),
  hatch: c("#27303b", 0.15), recess: c("#1a1b1d", 0.8), faceNo: c("#f2f2f2", 0.4), terBlue: c("#24399c", 0.4), sncfRed: c("#c4134f", 0.4),
  display: { color: "#1b1d1f", metallic: 0.2, roughness: 0.15, glass: true }, grille: c("#26282b", 0.7), slat: c("#55595e", 0.5),
  roofBox: c("#cdd0d2", 0.45), exhaustPipe: c("#2b2c2e", 0.6),
};

/** The TER scheme both carry: silver, the blue face and cap, the grey bumper and housings, the dark skirt. */
const terBase = (title: string, number: string): ShinkansenLivery => ({
  title, number,
  palette: { ...COMMON },
  bands: [[0, 0.55, "dark"], [0.55, 9, "silver"]],
  front: [[0, HOUSING, "dark"], [HOUSING, 9, "blue"]],
  roof: "roofG", skirt: "dark",
  // the distant model's cab sides: the grey housing and the blue over it (the panel and the wedge too small to show)
  lodSideFields: { end: [{ d: [0, JOIN], bands: [[0, HOUSING, "dark"], [HOUSING, 9, "blue"]] }, { d: [TIP - JOIN, TIP], bands: [[0, HOUSING, "dark"], [HOUSING, 9, "blue"]] }] },
  // the "ter" wordmark on each cab side's silver under the panel (body d ahead of the join: on the cab face's side)
  endLettering: [{ text: "ter", d: b(2.2), y: 1.2, h: 0.3, mat: "terBlue", letterStroke: 0.17 }, { text: "ter", d: L - b(2.2), y: 1.2, h: 0.3, mat: "terBlue", letterStroke: 0.17 }],
});

/**
 * TER Alsace (the X 73900's later paint, Offenburg and Haguenau photographs): the TER scheme with blue
 * door leaves and bands of colour standing up the sides at each end, below the windows and over them -
 * a light green field under the cab panel and a beige wedge over it, magenta, beige and brown stripes
 * at the seam, yellow and light green on the body, a thin green one further back. [mat, tip d from, to]
 * of the stripes over the fields (the fields themselves are the cab face's sweeps).
 */
const ALSACE_LOW: ReadonlyArray<readonly [string, number, number]> = [
  ["magenta", 2.1, 2.3], ["beige", 2.3, 2.89], ["brown", 2.89, 3.08], ["beige", 3.08, 3.43], ["brown", 3.43, 3.64], ["yellow", 3.64, 4.0], ["lightGreen", 4.11, 4.67], ["green", 5.55, 5.66],
];
const ALSACE_HIGH: ReadonlyArray<readonly [string, number, number]> = [
  ["brown", 2.45, 2.55], ["yellow", 2.55, 3.13], ["lightGreen", 3.13, 3.8], ["green", 4.55, 4.68],
];
/** The cab side's lower zone (over the housing, under the panel), the body's under the windows, and the upper zone over both (the wedge on the cab). */
const LOW_CAB: readonly [number, number] = [HOUSING, PANEL[0]];
const LOW_BODY: readonly [number, number] = [1.07, 1.62];
const HIGH_ZONE: readonly [number, number] = [2.62, WEDGE];
/** The blue sweep's edge over the wedge: its height at tip d (from the panel's head at 1.47 m to the seam at 3.24 m). */
const wedgeTop = (d: number): number => Math.min(WEDGE, PANEL[1] + ((d - 1.47) / (JOIN - 1.47)) * (WEDGE - PANEL[1]));
function alsace(title: string, number: string): ShinkansenLivery {
  const base = terBase(title, number);
  // the fields on the cab sides: the face's sweeps (both ends, each face its own)
  // (along the blue sweep's edge and back to the seam, the stripes laid over them: no new edges on the face)
  const field = (mat: string, y0: number, y1: number) => ({ mat, front: [[y0, BLUE_EDGE.f(y0)], [y1, BLUE_EDGE.f(y1)]] as Pt[], back: [[y0, JOIN + 0.1], [y1, JOIN + 0.1]] as Pt[], top: y1 });
  // the stripes: decals on the cab sides and the body (body d), at both ends; split at the seam, the cab's lower zone over the housing, the wedge's under the blue
  const fields: Array<{ mat: string; pts: Pt[] }> = [];
  const quad = (mat: string, p: number, q: number, y0: number, y1a: number, y1b: number) => {
    for (const e of [1, -1]) {
      const [d0, d1] = e > 0 ? [b(p), b(q)] : [L - b(q), L - b(p)];
      const [ya, yb] = e > 0 ? [y1a, y1b] : [y1b, y1a];
      fields.push({ mat, pts: [[d0, y0], [d1, y0], [d1, yb], [d0, ya]] });
    }
  };
  for (const [mat, p, q] of ALSACE_LOW) {
    if (p < JOIN - 0.03) quad(mat, p, Math.min(q, JOIN - 0.03), LOW_CAB[0], LOW_CAB[1], LOW_CAB[1]);
    if (q > JOIN + 0.1) quad(mat, Math.max(p, JOIN + 0.1), q, LOW_BODY[0], LOW_BODY[1], LOW_BODY[1]);
  }
  for (const [mat, p, q] of ALSACE_HIGH) {
    if (p < JOIN) quad(mat, p, Math.min(q, JOIN), HIGH_ZONE[0], wedgeTop(p), wedgeTop(Math.min(q, JOIN)));
    if (q > JOIN + 0.1) quad(mat, Math.max(p, JOIN + 0.1), q, HIGH_ZONE[0], HIGH_ZONE[1], HIGH_ZONE[1]);
  }
  return {
    ...base,
    palette: {
      ...base.palette, lightGreen: c("#b8d48c", 0.4), green: c("#4fae4a", 0.4), yellow: c("#efc22e", 0.4), brown: c("#9b6b3c", 0.45),
      beige: c("#d9c99c", 0.4), magenta: c("#d2246c", 0.4),
    },
    doors: [[0, 9, "blue"]],
    // the "ter" wordmark in white on the cab panel, the stripes' field under it
    endLettering: [{ text: "ter", d: b(2.25), y: 2.0, h: 0.22, mat: "faceNo", letterStroke: 0.17 }, { text: "ter", d: L - b(2.25), y: 2.0, h: 0.22, mat: "faceNo", letterStroke: 0.17 }],
    endSweeps: [field("lightGreen", HOUSING, PANEL[0]), field("beige", PANEL[1], WEDGE)],
    sideFields: { end: fields },
  };
}

export const X73500: ShinkansenSeries = {
  endLength: TIP + 2 * REACH, midLength: TIP + 2 * REACH, W, Y: HIGH.Y, S, C, lean: 0.97, B: HIGH.B, A: HIGH.A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: X73500_FACE,
  railcarUnderside: { Y: underside("Y"), A: underside("A"), B: underside("B") },
  // the end windows over the raised floor, the taller ones over the low floor; the single-leaf doors' big window
  windows: [END_WIN_Y, MID_WIN_Y], windowW: 1.4, pitch: 1.6, door: [0.4, 2.72, 1.05, 2.38], doorW: 1.3, doorGlassW: 1.0,
  layout: {
    end: { doors: DOORS, windows: END_WINDOWS, rows: [END_WINDOWS, MID_WINDOWS] },
    middle: { doors: [], windows: [] },
  },
  sidePanels: { end: panels() },
  couplerY: 0.85,
  // B'B' (2'B' in service: one powered axle a bogie), bogie centres 17.5 m, 2.1 m wheelbase, 840 mm wheels
  bogieCentres: 17.5, wheelR: 0.42, wheelbase: 2.1, traction: "diesel", single: true, exhaustInFittings: true,
  fittings: (m, sb, X) => x73500Fittings(m, sb, X),
  // the distant model: the engine housings under the cabs, the low floor's body between the bogies, the air conditioning
  lodRoof: { d: [10.5, 17.4], hw: 0.78, y: [C - 0.08, C + 0.14], mat: "roofBox" },
  lodEndPatches: [
    { d: [0.35, JOIN + 0.1], hw: 1.25, y: [0.2, 0.92], mat: "dark" },
    { d: [JOIN + 4.15, TIP - JOIN - 4.15], hw: 1.4, y: [0.35, 0.92], mat: "silver" },
    { d: [TIP - JOIN - 0.1, TIP - 0.35], hw: 1.25, y: [0.2, 0.92], mat: "dark" },
  ],
  liveries: { ter: terBase("TER", "X 73595"), alsace: alsace("TER Alsace", "X 73908") },
  weight: { end: 50, middle: 50 }, power: 514, maxspeed: 140,
};

export const X73500_PARAMS = seriesParams(X73500);
export function sncfX73500(v?: ParamValues): MeshBuilder { return buildSeries(X73500, X73500_PARAMS, v); }
export function sncfX73500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(X73500, X73500_PARAMS, v); }
