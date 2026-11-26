// The CRH6F (CRRC Qingdao Sifang's 160 km/h "stopping" intercity unit of the Cinova family, in
// service from 2015), drawn on the series kit (shinkansen.ts) with its own cab face (seriesCab.ts):
// the short, blunt suburban nose - one smooth convex curve from the round coupler cover (its seam
// only a thin dark line, no lip) up to the crown 3.4 m behind the tip, a dark canopy round the
// windscreen over a strip of six headlamps, the slanted cab side window - and the Jinshan Railway
// stripes of CRH6F-0475: white, the dark window band ending in a point on the nose, framed by a
// blue and an orange chevron, a thin blue line under the band, a blue swoosh low on the
// nose's flank, a grey skirt. Wide bi-parting plug doors, equally spaced for platform screen doors:
// two a side on the end cars (with the cab door), three on the intermediate cars. Measured on the
// photographs in assets/cr-crh6f/ (SOURCES.md).
//
// Heights over the rail, d behind the nose's tip (the coupler cover's front, 1.22 m up).

import type { MeshBuilder } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { fairing } from "./cnCrh6a.ts";

/** Where the face meets the body: the crown at its full 3.86 m, just ahead of the cab door. */
const JOIN = 3.4;
/** The body's bottom (the skirt's foot), the grey skirt's top and the crown over the rail (3,860 mm). */
const B = 0.4;
const A = 0.98;
const C = 3.86;

/** The dark window band along the cars and the thin blue line under it (CRH6F-0475 side-on, 40 px/m). */
const BAND: readonly [number, number] = [1.93, 2.94];
const LINE: readonly [number, number] = [1.79, 1.85];

/**
 * The nose's centre line, measured on the side-on photograph of CRH6F-0475: under the tip the white
 * cover rounding back into the grey skirt; the tip 1.22 m up; then one convex curve, its slope growing
 * steadily (the cover's seam 2.0 m up 0.35 m back, the windscreen's foot 2.5 m up 0.8 m back, its head
 * 3.5 m up 2.1 m back) to the crown 3.4 m behind the tip. No step, knob or lip: the cover is one
 * surface with the nose, its seam only painted.
 */
const PROFILE: Pt[] = [
  [B, 1.0], [0.6, 0.52], [0.8, 0.25], [1.0, 0.08], [1.22, 0.0], [1.45, 0.055], [1.7, 0.17], [1.98, 0.35], [2.28, 0.6], [2.59, 0.89],
  [2.89, 1.22], [3.2, 1.62], [3.45, 2.0], [3.62, 2.38], [3.75, 2.8], [3.83, 3.15], [C, JOIN],
];

const edge = (pts: readonly Pt[], y: number): number => {
  if (y <= pts[0]![0]) return pts[0]![1];
  for (let i = 1; i < pts.length; i++) if (y <= pts[i]![0]) { const [a, b] = [pts[i - 1]!, pts[i]!]; return a[1] + ((y - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
  return pts[pts.length - 1]![1];
};
/** The plan: a round snout low down (the cover, reaching the body's full width 2.2 m back), a broad face with tighter corners over the windscreen. */
const RADIUS: Pt[] = [[B, 2.0], [1.6, 2.0], [2.1, 1.3], [2.5, 0.8], [3.0, 0.65], [C, 0.65]];
const DEPTH: Pt[] = [[B, 2.0], [1.22, 2.2], [1.7, 2.0], [2.1, 1.4], [2.5, 0.95], [3.0, 0.75], [3.4, 0.7], [3.7, 0.5], [C, 0.05]];
const CORNER_DEPTH: Pt[] = PROFILE.map(([y, d]): Pt => [y, Math.max(0.05, Math.min(JOIN - d - 0.02, edge(DEPTH, y)))]);

/** The cab side window: a slanted quadrilateral, its foot 2.63 m up 1.33 - 1.69 m back, its head 3.31 m up, its rear corner 2.59 m back. */
const CAB_WIN_FRONT: Pt[] = [[2.63, 1.33], [3.31, 2.27]];
const CAB_WIN_BACK: Pt[] = [[2.63, 1.69], [3.1, 2.59], [3.31, 2.27]];

const ROWS = [...new Set([...PROFILE.map(([y]) => y), A, 2.02, 2.46])].sort((a, b) => a - b);

/** The coupler cover's seam (viewer's right half, mirrored): its flat top 2.0 m up, the sides down to 0.75 m, closing under the nose at 0.56 m. */
const COVER: Pt[] = [[0, 2.0], [0.5, 1.99], [0.8, 1.93], [0.97, 1.75], [1.04, 1.45], [1.04, 1.15], [0.98, 0.92], [0.85, 0.74], [0.6, 0.62], [0.3, 0.57], [0, 0.56]];
/** A polyline as thin quads, each counter-clockwise seen head-on. */
const seam = (pts: readonly Pt[], t: number): Pt[][] => pts.slice(1).map((b, i): Pt[] => {
  const a = pts[i]!, len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const nx = (-(b[1] - a[1]) / len) * t, ny = ((b[0] - a[0]) / len) * t;
  const q: Pt[] = [[a[0] - nx, a[1] - ny], [b[0] - nx, b[1] - ny], [b[0] + nx, b[1] + ny], [a[0] + nx, a[1] + ny]];
  const area = q.reduce((s, p, k) => { const n = q[(k + 1) % 4]!; return s + p[0] * n[1] - n[0] * p[1]; }, 0);
  return area < 0 ? q.reverse() : q;
});
const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([l, y]): Pt => [-l, y]).reverse();

/** The lamp housing under the windscreen (darker than the canopy) and the lens strip in it. */
const HOUSING: Pt[] = [[-0.9, 2.03], [0.9, 2.03], [0.97, 2.12], [0.96, 2.38], [0.9, 2.44], [-0.9, 2.44], [-0.96, 2.38], [-0.97, 2.12]];
const LENS: Pt[] = [[-0.8, 2.07], [0.8, 2.07], [0.86, 2.12], [0.85, 2.24], [0.8, 2.27], [-0.8, 2.27], [-0.85, 2.24], [-0.86, 2.12]];
/** The windscreen: wider at its foot, its head rounded, in a thin light frame. */
const SCREEN: Pt[] = [[-0.9, 2.53], [0.9, 2.53], [0.99, 2.63], [0.98, 3.25], [0.9, 3.5], [0.74, 3.6], [-0.74, 3.6], [-0.9, 3.5], [-0.98, 3.25], [-0.99, 2.63]];
/** The frame round a pane: k wider and lower, less above (the canopy is nearly level there). */
const grow = (pts: readonly Pt[], k: number): Pt[] => pts.map(([l, y]): Pt => [l * (1 + k / Math.abs(l || 1)), y + (y < 3 ? -k : k / 4)]);

export const CRH6F_FACE: SeriesCabFace = {
  // the skirt's cut over the leading bogie (3.9 m behind the tip, reach 1.93 m) runs on into the face
  wheelCut: { d: 3.9 - 1.93, y: A },
  dJoin: JOIN, reach: 0.07, first: 3.42, roofFrom: 9, cols: [1, 10, 1, 1], tolerance: 0.05, wrap: true,
  profile: PROFILE,
  corner: RADIUS,
  cornerDepth: CORNER_DEPTH,
  rows: ROWS,
  // the face is white; its paint (the skirt, the canopy, the lamps, the seam, the cab window) is drawn below
  bands: () => [[0, 9, "white"]],
  lodBands: [[0, 0.8, "skirtG"], [0.8, 9, "white"]],
  lod: {
    profile: PROFILE.filter((_, i) => i % 3 === 0 || i === PROFILE.length - 1), corner: [[B, 2.0], [C, 2.0]],
    rows: [B, 0.7, 1.0, 1.22, 1.6, 2.0, 2.4, 2.8, 3.2, 3.55, 3.8, C],
    cornerDepth: [[B, 1.9], [1.22, 2.1], [2.0, 1.9], [2.4, 1.5], [2.8, 1.2], [3.2, 1.0], [3.55, 0.8], [3.8, 0.35], [C, 0.05]],
  },
  lodGlass: { hw: 0.95, y: [2.05, 3.58] },
  paint: [
    // the grey skirt carried forward under the nose, its top rising from the cover's foot to the skirt line
    { mat: "skirtG", front: [[B, -9], [0.8, -9]], back: [[B, JOIN + 1], [0.8, JOIN + 1]] },
    { mat: "skirtG", front: [[0.8, 0.3], [A, 1.0]], back: [[0.8, JOIN + 1], [A, JOIN + 1]] },
    // the canopy: dark grey across the face from the lamp housing over the windscreen and on over the cab roof
    { mat: "cabMask", front: [[2.02, -9], [4.0, -9]], back: [[2.02, 9], [4.0, 9]], lat: 1.14, top: 4.0 },
    // the cab side window
    { mat: "cabGlass", front: CAB_WIN_FRONT, back: CAB_WIN_BACK },
  ],
  fields: [
    { mat: "strip", pts: HOUSING },
    { mat: "lens", pts: LENS },
    { mat: "frameSilver", pts: grow(SCREEN, 0.03) },
    { mat: "screen", pts: SCREEN },
  ],
  decals: [
    ...seam(COVER, 0.008).flatMap((pts) => [{ mat: "seam", pts, fine: 2 }, { mat: "seam", pts: mirror(pts), fine: 2 }]),
    // the cover's split down its middle
    { mat: "seam", pts: [[-0.006, 0.6], [0.006, 0.6], [0.006, 1.98], [-0.006, 1.98]], fine: 3 },
    // the red tail lamps: a thin line along the lens strip's top
    { mat: "lampRed", pts: [[-0.8, 2.25], [0.8, 2.25], [0.8, 2.275], [-0.8, 2.275]], fine: 3 },
  ],
  wipers: [[[0.14, 2.6], [0.3, 3.3]]],
  panes: [],
  // six headlamps in a row along the lens strip
  lamps: [0.12, 0.36, 0.6].flatMap((l): Array<readonly [number, number, number, string]> => [[l, 2.16, 0.055, "lampHead"], [-l, 2.16, 0.055, "lampHead"]]),
};

/**
 * The band's pointed front on the nose ([y, d]): its point 2.58 m up 2.69 m back, the upper edge
 * rising to the band's top 3.5 m back, the lower one sweeping down and back into the blue line.
 */
const BAND_FRONT: Pt[] = [[LINE[0], 5.2], [LINE[1], 4.95], [BAND[0], 4.6], [2.0, 4.15], [2.12, 3.52], [2.3, 3.0], [2.45, 2.8], [2.58, 2.69], [2.7, 2.85], [2.85, 3.2], [BAND[1], 3.5]];
const shift = (pts: readonly Pt[], dd: number): Pt[] => pts.map(([y, d]): Pt => [y, d + dd]);
const above = (pts: readonly Pt[], y0: number): Pt[] => [[y0, edge(pts, y0)], ...pts.filter(([y]) => y > y0)];
/** The band's point: where the chevrons turn. */
const TIP = 2.58;
const below = (pts: readonly Pt[], y1: number): Pt[] => [...pts.filter(([y]) => y < y1), [y1, edge(pts, y1)]];
/**
 * A stripe along the band's pointed front, `dd0` to `dd1` behind it, from `yLo` up and on past the
 * band's top to 3.07 m: two sweeps, the lower and the upper arm, since the face's paint layers must
 * each cover one interval up any column of the face.
 */
const vee = (mat: string, dd0: number, dd1: number, yLo: number): Array<{ mat: string; front: Pt[]; back: Pt[]; face: boolean }> => {
  const lower = below(above(BAND_FRONT, yLo), TIP), upper: Pt[] = [...above(BAND_FRONT, TIP), [3.07, BAND_FRONT[BAND_FRONT.length - 1]![1] + 0.25]];
  return [upper, lower].map((e) => ({ mat, front: shift(e, dd0), back: shift(e, dd1), face: true as const }));
};

/**
 * A thin stripe between a top curve y(d) and that curve less a thickness (tapering to points at its
 * ends), split at its highest point into two sweeps whose [y, d] edges are single-valued.
 */
function stripe(mat: string, top: (d: number) => number, t: (d: number) => number, d0: number, dPeak: number, d1: number): Array<{ mat: string; front: Pt[]; back: Pt[]; face: true }> {
  const n = 4;
  const part = (da: number, db: number, rising: boolean) => {
    const ds = Array.from({ length: n + 1 }, (_, i) => da + ((db - da) * i) / n);
    const upper = ds.map((d): Pt => [top(d), d]), lower = ds.map((d): Pt => [top(d) - t(d), d]);
    // on the rising part the upper curve is the front edge; on the falling part the back edge
    const sortY = (pts: Pt[]) => [...pts].sort((a, b) => a[0] - b[0]).filter((p, i, a) => i === 0 || p[0] > a[i - 1]![0] + 1e-6);
    // the lower curve closed up to the stripe's top at its highest point
    const yTop = top(dPeak), up = sortY(upper), lo = sortY(lower);
    const lo2 = [...lo, ...(lo[lo.length - 1]![0] < yTop ? [[yTop, dPeak] as Pt] : [])];
    return rising ? { mat, front: up, back: lo2, face: true as const } : { mat, front: lo2, back: up, face: true as const };
  };
  return [part(d0, dPeak, true), part(dPeak, d1, false)];
}
/** The swoosh low on the nose's flank: from its point 1.4 m up 0.4 m behind the tip rising to 1.72 m 1.5 m back, then falling to a point 1.4 m up 5.2 m back. */
const SWOOSH = (d: number): number => d <= 1.5 ? 1.4 + 0.32 * Math.sin(((d - 0.4) / 1.1) * (Math.PI / 2)) : 1.4 + 0.32 * Math.cos(((d - 1.5) / 3.7) * (Math.PI / 2));
const taper = (w: number) => (d: number): number => w * Math.min(1, (d - 0.4) / 0.9, (5.2 - d) / 2.2);

/** The Jinshan Railway stripes (CRH6F-0475): white, the dark band with its point framed by blue and orange chevrons, the blue line under it, the swoosh, a grey skirt. */
function jinshanLivery(): ShinkansenLivery {
  const bands: Array<readonly [number, number, string]> = [[0, A, "skirtG"], [A, LINE[0], "white"], [LINE[0], LINE[1], "blue"], [LINE[1], BAND[0], "white"], [BAND[0], BAND[1], "band"], [BAND[1], 9, "white"]];
  return {
    title: "Jinshan Railway", number: "CRH6F-0475",
    palette: {
      white: c("#f0f1ef"), band: c("#3c4a57", 0.25), blue: c("#1f4a8e"), orange: c("#e0782a"), roofG: c("#c9cdd0", 0.55), skirtG: c("#9ea5a8", 0.45),
      cabMask: c("#4c5259", 0.3), seam: c("#3a3d41", 0.5), strip: c("#25282d", 0.3), lens: c("#8a939b", 0.2), frameSilver: c("#b9bec3", 0.3),
      screen: { color: "#3b4a57", metallic: 0.25, roughness: 0.08, glass: true }, lampRed: c("#c4202a", 0.3), fairing: c("#d9dcde", 0.5),
    },
    bands,
    roof: "roofG", skirt: "skirtG",
    endSweeps: [
      // the orange chevron 0.27 - 0.44 m ahead of the band's edge, the blue one 0.04 - 0.21 m ahead
      ...vee("orange", -0.44, -0.27, 1.97),
      ...vee("blue", -0.21, -0.04, LINE[0]),
      // the dark band on the nose's flank, from its point back over the cab door
      { mat: "band", front: BAND_FRONT.filter(([y]) => y >= BAND[0]), back: [[BAND[0], JOIN + 1.5], [BAND[1], JOIN + 1.5]], face: true },
      // the swoosh (its thin orange underline left out: the face's budget)
      ...stripe("blue", SWOOSH, taper(0.07), 0.4, 1.5, 5.2),
    ],
  };
}

/** The windows of a run: `n` panes `w` wide from d0, `pitch` apart. */
const run = (d0: number, n: number, w: number, pitch: number): Array<readonly [number, number]> => Array.from({ length: n }, (_, i) => [d0 + i * pitch, d0 + i * pitch + w] as const);
const J = (d: number) => d - JOIN;

/** The intermediate car's body: 25.0 m over the couplers less the gaps. */
const MID_BODY = 25.0 - 0.5;
const WIN_W = 1.36, PITCH = 2.07, DOOR_W = 1.7;
/** The intermediate cars' doors, equally spaced: 4.25, 12.5 and 20.75 m behind the coupling plane. */
const MID_DOORS = [4.0, 12.25, 20.5].map((cx) => [cx - DOOR_W / 2, cx + DOOR_W / 2] as const);

/** The CRH6F's fittings: the long equipment fairing on every car's roof (clear of the pantograph), the underfloor box. */
function crh6fFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("roof fairing", () => {
    const [d0, d1] = car.end ? [J(6.4), J(19.4)] : [4.0, 16.0];
    fairing(m, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), C, 1.0, 0.18, "fairing");
  });
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.4), X(car.trucks[0]! + 2.4), B - 0.07, B + 0.02, -1.62 * 0.82, 1.62 * 0.82));
}

export const CRH6F: ShinkansenSeries = {
  // 201.4 m for eight: the end cars 25.7 m from the tip to the coupling plane, the others 25.0 m; 3.3 m wide, drawn 3.24 m; 3.86 m high
  endLength: 25.7, midLength: 25.0, W: 1.62, Y: 1.6, S: 3.42, C, lean: 0.95, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: CRH6F_FACE,
  // the windows in the dark band; wide bi-parting plug doors (sill 1.05 m, drawn 1.15 m: the step plate
  // stays inside the gauge), a narrow round-cornered window in each leaf
  windows: [[2.08, 2.89]], windowW: WIN_W, pitch: PITCH, door: [1.15, 3.27, 1.92, 2.75], doorW: DOOR_W, doorGlassW: 0.37, doorGlassPair: 0.83, doorGlassR: 0.1,
  layout: {
    // the end car: two windows behind the cab door's blank band, a door, three windows, a door over the rear bogie, a blank band to the end
    end: { doors: [[J(12.0), J(13.7), -1], [J(20.65), J(22.35), 1]], windows: [...run(J(7.9), 2, WIN_W, 2.1), ...run(J(14.4), 3, WIN_W, PITCH)] },
    // the intermediate cars: three doors, three windows between each pair, a narrow window at each end
    middle: {
      doors: [[MID_DOORS[0]![0], MID_DOORS[0]![1], -1], [MID_DOORS[1]![0], MID_DOORS[1]![1], 1], [MID_DOORS[2]![0], MID_DOORS[2]![1], 1]],
      windows: [[1.82, 2.55], ...run(5.375, 3, WIN_W, PITCH), ...run(13.625, 3, WIN_W, PITCH), [MID_BODY - 2.55, MID_BODY - 1.82]],
    },
  },
  sidePanels: {
    // the narrow cab door just behind the face, a small window in its top
    end: [{ d: [3.42, 4.02], y: [1.35, 3.33], kind: "seam" }, { d: [3.58, 3.92], y: [2.72, 3.18], kind: "window" }],
  },
  // the leading bogie 3.9 m behind the tip (under the cab door), 17.9 m bogie centres
  endBogies: [J(3.9), J(21.8)], midBogies: [3.3, MID_BODY - 3.3],
  bogieCentres: 17.9, wheelR: 0.43, wheelbase: 2.5, cars: [4, 8],
  // "CRH6F-0475" under the band 5.6 m behind the tip
  numberAt: [-8.83, 1.43, 0.13],
  liveries: { jinshan: jinshanLivery() },
  fittings: crh6fFittings,
  // 5,152 kW from four motor cars of eight, given as each car's share; about 380 t empty (17 t axle load)
  weight: { end: 49, middle: 47 }, power: 644, maxspeed: 160,
};
