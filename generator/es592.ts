// Renfe 592 "camello" (MAN design, Macosa and Ateinsa, 1981 - 1984; 70 units): a three-car diesel-hydraulic
// unit, two motor cars (each with two MAN engines under the floor) and a trailer between them, on the series
// kit (shinkansen.ts) with its own cab face (seriesCab.ts). The flat front: three windscreens in rubber
// frames - the two wide driver's panes and the narrow window of the gangway door between them -, the twin
// headlight in its housing at the top of the face between two twin marker lamps, the lower lamps (the white
// one alone on the left, a red and a white side by side on the right), the automatic coupler in its dark
// recess between two grey anticlimber pads; the roof rounding back over the face. The "camel" humps: two
// boxes on every car's roof holding the air conditioning, each ending over a door in a louvred slope; the
// motor cars' engine exhausts on the humps. Along the sides: the hinged cab door, then three saloons divided
// by two single-leaf doors a side, the underfloor engines, transmissions, silencers and tanks.
//
// Figures (es.wikipedia "Serie 592 de Renfe"): 70.214 m over the couplers for three cars, 2.86 m wide,
// 3.965 m high, 130.4 t, four MAN D2866 engines (840 kW), 120 km/h, 200 - 228 seats. Car lengths are not
// published: the motor cars are drawn 23.66 m, the trailer 22.9 m over the couplers (70.22 m).
//
// Scales measured on the photographs in assets/renfe-592/ (SOURCES.md):
// - head-on (photo-j29-452..., 136M): face 2.86 m = 346 px, 121 px/m; heights from the coupler's centre
//   (1.03 m): the roof's top 3.63, the top headlight 3.22 - 3.47, the marker lamps 3.18 - 3.36 at 0.88 -
//   1.18 m off the centre line, the windscreens 2.19 - 3.01 (the side panes 0.43 - 1.31 m out, the door's
//   +-0.26), the lower lamps 1.44 - 1.63, the anticlimbers 0.81 - 1.21 at 0.75 - 1.15 m out, the white
//   face's foot 0.92;
// - side (photo-renfe-class-592-13016816365, a 1-D projective fit over the body's ends and the doors'
//   equal widths: 19.2 px/m at the cab, 15.6 at the rear): the cab door 0.4 - 1.4 m behind the face, the
//   windows 1.95 - 2.8, 4.15 - 4.75 and 4.95 - 6.6, the doors 7.4 - 8.35 and 15.3 - 16.3, the saloons'
//   windows behind them, the bogies 3.4 and 19.5 m behind the face; checked on photo-cp-592-9308777899
//   (the same fit through its doors: within 0.3 m);
// - the humps (photo-j29-454..., 258 px/m at the first window): their flat tops 0.48 m over the cantrail,
//   the first from the cab's roof to its louvred slope over the first door, the second from the first door
//   to the second.
// Heights over the rail; on the face d behind its tip; elsewhere d behind the body's front end (the
// face's join, JOIN behind the tip): `T(t)` turns a distance behind the tip into the body's d.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Ring, Vec3 } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";
import type { ShinkansenLivery, ShinkansenSeries } from "./shinkansen.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import { c, NO_NOSE } from "./seriesHelpers.ts";
import { sideDecal, sidePanel, type SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";

/** Where the face meets the body: the roof has rounded back to the crown. */
const JOIN = 0.6;
/** The coupling plane ahead of the face: the automatic coupler's head. */
const REACH = 0.35;
/** Half width (2.86 m), the skirt's bottom and top (the dark sill band under the white), the belly, shoulder and crown. */
const W = 1.43;
const B = 0.72;
const A = 0.92;
const Y = 1.0;
const S = 3.3;
const C = 3.65;
/** The humps' flat top (0.48 m over the cantrail), their side walls' foot inside the body and their half widths. */
const HUMP_TOP = 3.86;
const HUMP_FOOT = 3.3;
const HUMP_HW = 1.36;
const HUMP_TOP_HW = 1.24;
/** The coupler's centre. */
const COUPLER_Y = 1.03;
/** The windscreens' sill and head; the passenger windows'. */
const SCREEN: readonly [number, number] = [2.19, 3.01];
const WIN: readonly [number, number] = [2.05, 3.0];

/** A distance behind the tip as the body's d. */
const T = (t: number): number => t - JOIN;

/** The face's centre line: upright from the sill band to the marker lamps, the roof rounding back to the crown at the join. */
const PROFILE: Pt[] = [[B, 0.02], [0.8, 0.005], [A, 0], [3.3, 0], [3.4, 0.02], [3.48, 0.06], [3.55, 0.13], [3.6, 0.22], [3.63, 0.34], [C, JOIN]];

/** A rectangle [lat0, lat1] x [y0, y1]. */
const box = (l0: number, l1: number, y0: number, y1: number): Pt[] => [[l0, y0], [l1, y0], [l1, y1], [l0, y1]];

/** The three windscreens: the driver's wide panes either side, the gangway door's narrow window between them. */
const PANES: Array<{ lat: readonly [number, number]; y: readonly [number, number] }> = [
  { lat: [-1.31, -0.43], y: SCREEN },
  { lat: [-0.26, 0.26], y: [2.23, 2.97] },
  { lat: [0.43, 1.31], y: SCREEN },
];
/** The rubber frames' width round the panes. */
const RUBBER = 0.045;
/** The gangway door's leaf: its outline from its foot to over its window. */
const DOOR_FACE = { hw: 0.33, y: [1.42, 3.06] as const, seam: 0.018 };

const ROWS = [...new Set([...PROFILE.map(([y]) => y), 1.0, 1.14, 1.18, 1.27, 1.33, 1.36, 1.4, 1.42, 1.52, 1.62, 1.86, 2.08, 2.19 - RUBBER, 2.6, 3.06, 3.12, 3.18])].sort((a, b) => a - b);

/**
 * The face: flat across, its corners rounded 0.26 m in plan, upright from the sill band (0.72 m) to 3.3 m,
 * the roof rounding back over it to the crown 0.6 m behind. The livery's bands and its own materials
 * (`frame`, `faceBand`, `faceLogo`, `numberInk`) paint it.
 */
export const R592_FACE: SeriesCabFace = {
  dJoin: JOIN, dSide: 0.3, reach: REACH, first: 0.4, roofFrom: 3.18, cols: [6, 3, 1, 1], tolerance: 0.02,
  profile: PROFILE,
  corner: [[B, 0.26], [3.3, 0.26], [3.5, 0.22], [3.6, 0.12], [C, 0.04]],
  rows: ROWS,
  bands: (l) => l.front ?? l.bands,
  fields: [
    // the coupler's dark recess, the gangway door's outline
    { mat: "recess", pts: box(-0.5, 0.5, 0.78, 1.36) },
    { mat: "seam", pts: box(-DOOR_FACE.hw - DOOR_FACE.seam, -DOOR_FACE.hw, DOOR_FACE.y[0], DOOR_FACE.y[1]) },
    { mat: "seam", pts: box(DOOR_FACE.hw, DOOR_FACE.hw + DOOR_FACE.seam, DOOR_FACE.y[0], DOOR_FACE.y[1]) },
    { mat: "seam", pts: box(-DOOR_FACE.hw, DOOR_FACE.hw, DOOR_FACE.y[0] - DOOR_FACE.seam, DOOR_FACE.y[0]) },
  ],
  masks: PANES.map((p) => ({ lat: [p.lat[0] - RUBBER, p.lat[1] + RUBBER] as const, y: [p.y[0] - RUBBER, p.y[1] + RUBBER] as const, r: 0.1, mat: "frame" })),
  panes: PANES.map((p) => ({ lat: p.lat, y: p.y, r: 0.07 })),
  lodGlass: { hw: 1.31, y: SCREEN },
  pods: [
    // the twin headlight's housing at the top of the face, the twin marker lamps either side of it
    { lat: 0, y: 3.345, w: 0.5, h: 0.25, r: 0.1, proud: 0.03, depth: 0.03, mat: "housing", lamps: [[-0.11, 0.075, "lampHead"], [0.11, 0.075, "lampHead"]] as const },
    ...[-1, 1].map((sd) => ({ lat: sd * 1.03, y: 3.27, w: 0.3, h: 0.17, r: 0.02, proud: 0.04, depth: 0.03, mat: "housing", lamps: [[-0.065, 0.05, "lampMarker"], [0.065, 0.05, "lampMarker"]] as const })),
    // the lower lamps: the white one alone on the left, a red and a white side by side on the right
    { lat: -1.17, y: 1.53, w: 0.29, h: 0.19, r: 0.04, proud: 0.03, depth: 0.03, mat: "lampRim", lamps: [[0, 0.075, "lampHead"]] as const },
    { lat: 0.785, y: 1.53, w: 0.29, h: 0.19, r: 0.04, proud: 0.03, depth: 0.03, mat: "lampRim", lamps: [[0, 0.075, "lampRed"]] as const },
    { lat: 1.095, y: 1.53, w: 0.29, h: 0.19, r: 0.04, proud: 0.03, depth: 0.03, mat: "lampRim", lamps: [[0, 0.075, "lampHead"]] as const },
    // the grey anticlimbers beside the coupler
    ...[-1, 1].map((sd) => ({ lat: sd * 0.95, y: 1.01, w: 0.4, h: 0.4, r: 0.03, proud: 0.12, depth: 0.03, mat: "pad", level: true })),
  ],
  // the small red tail lamp over the left one
  lamps: [[-1.12, 1.73, 0.045, "lampRed"]],
  texts: [{ text: "renfe", lat: -0.05, y: 1.68, h: 0.16, mat: "faceLogo" }],
  number: { lat: -0.98, y: 1.385, h: 0.09, mat: "numberInk" },
  // the wipers hanging from the panes' heads
  wipers: [[[-0.72, 2.98], [-0.56, 2.42]], [[1.0, 2.98], [1.16, 2.42]]],
};

/** The cab door (tip d), its window; the passenger doors and windows of the motor car and of the trailer (tip d on the motor car, d behind the trailer's +X end). */
const CAB_DOOR: readonly [number, number] = [0.4, 1.4];
/** The cab door's narrow window. */
const CAB_GLASS: readonly [number, number] = [0.62, 1.18];
const M_DOORS: Array<readonly [number, number]> = [[7.4, 8.35], [15.3, 16.3]];
const M_WINDOWS: Array<readonly [number, number]> = [[1.95, 2.8], [4.15, 4.75], [4.95, 6.6], [9.05, 10.45], [11.0, 12.4], [13.1, 14.5], [17.0, 18.35], [18.7, 20.05], [20.5, 21.85]];
const R_DOORS: Array<readonly [number, number]> = [[6.45, 7.4], [15.0, 15.95]];
const R_WINDOWS: Array<readonly [number, number]> = [[0.85, 2.2], [2.6, 3.95], [4.4, 5.75], [8.1, 9.5], [10.5, 11.9], [12.9, 14.3], [16.65, 18.0], [18.45, 19.8], [20.2, 21.55]];
/** The humps: their front, the flat top's end and the slope's foot over a door (tip d on the motor car, the trailer's own d). */
const M_HUMPS: Array<readonly [number, number, number]> = [[1.85, 6.65, 7.95], [8.95, 14.55, 15.85]];
const R_HUMPS: Array<readonly [number, number, number]> = [[0.7, 5.6, 6.95], [8.0, 14.2, 15.5]];
/** The bogies' centres: 16.1 m apart, the motor car's 3.4 m behind the face. */
const M_BOGIES: readonly [number, number] = [3.4, 19.5];

/** The hump's section at the top's height `top`: side walls leaning in a little, the top's edges chamfered. */
const humpRing = (top: number): Ring => {
  const t = Math.max(top, HUMP_FOOT + 0.06), ch = Math.min(0.08, (t - HUMP_FOOT) / 2);
  return [[-HUMP_HW, HUMP_FOOT], [HUMP_HW, HUMP_FOOT], [HUMP_TOP_HW + 0.04, t - ch], [HUMP_TOP_HW - 0.04, t], [-(HUMP_TOP_HW - 0.04), t], [-(HUMP_TOP_HW + 0.04), t - ch]];
};

/** One hump: the box from its front to the flat top's end, then the louvred slope down to the roof over the door. */
function hump(m: MeshBuilder, X: (d: number) => number, [d0, d1, d2]: readonly [number, number, number], exhaust: boolean): void {
  const full = humpRing(HUMP_TOP), low = humpRing(3.36);
  const [x0, x1, x2] = [X(d0), X(d1), X(d2)];
  m.sweep("hump", "x", full, Math.min(x0, x1), full, Math.max(x0, x1));
  m.sweep("hump", "x", full, x1, low, x2);
  // the louvres on the slope: a dark panel and its slats, standing just off it
  const sg = Math.sign(x2 - x1), run = Math.abs(x2 - x1), drop = HUMP_TOP - 3.36, len = Math.hypot(run, drop);
  const n: Vec3 = [(sg * drop) / len, run / len, 0];
  const on = (t: number, z: number, proud: number): Vec3 => [x1 + (x2 - x1) * t + n[0] * proud, HUMP_TOP - drop * t + n[1] * proud, z];
  const depth: Vec3 = [-n[0] * 0.02, -n[1] * 0.02, 0];
  const [t0, t1, hz] = [0.12, 0.72, 0.78];
  m.slab("louvre", [on(t0, -hz, 0.006), on(t0, hz, 0.006), on(t1, hz, 0.006), on(t1, -hz, 0.006)], depth);
  for (let k = 0; k < 6; k++) {
    const t = t0 + ((t1 - t0) * (k + 0.5)) / 6;
    m.slab("hump", [on(t - 0.018, -hz + 0.03, 0.018), on(t - 0.018, hz - 0.03, 0.018), on(t + 0.018, hz - 0.03, 0.018), on(t + 0.018, -hz + 0.03, 0.018)], depth);
  }
  if (exhaust) m.scope("exhaust", () => {
    // the engine's exhaust stack on the hump's top, just ahead of the slope
    const x = X(d1 - 0.45), z = -0.62;
    block(m, "exhaust", x - 0.08, x + 0.08, HUMP_TOP - 0.02, HUMP_TOP + 0.12, z - 0.08, z + 0.08);
    m.emit("smoke", [x, HUMP_TOP + 0.12, z], 0.06);
  });
}

/** The humps, the cab door, the underfloor equipment of a motor car or the trailer. */
function r592Fittings(m: MeshBuilder, b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  const D = car.end ? T : (d: number) => d;
  const blk = (mat: string, d0: number, d1: number, y0: number, y1: number, z0: number, z1: number) => block(m, mat, Math.min(X(d0), X(d1)), Math.max(X(d0), X(d1)), y0, y1, z0, z1);
  m.scope("humps", () => (car.end ? M_HUMPS : R_HUMPS).forEach((h, i) => m.scope(`hump ${i + 1}`, () => hump(m, X, [D(h[0]), D(h[1]), D(h[2])], car.end))));
  if (car.end) {
    m.scope("cab door", () => {
      // the hinged cab door: its seams and its handle (its window is the series' cab window)
      const [d0, d1] = [T(CAB_DOOR[0]), T(CAB_DOOR[1])], [y0, y1] = [0.96, 3.08], t = 0.012;
      for (const sd of [1, -1]) {
        const seams: Pt[] = [];
        const bar = (a: number, e: number, ya: number, yb: number) => seams.push([a, ya], [e, ya], [e, yb], [a, ya], [e, yb], [a, yb]);
        bar(d0 - t, d0 + t, y0, y1); bar(d1 - t, d1 + t, y0, y1); bar(d0, d1, y1 - t, y1 + t);
        sideDecal(m, b, X, sd, "seam", seams, 0.004);
        sidePanel(m, b, X, sd, "handle", d1 - 0.12, d1 - 0.09, 1.45, 2.0, 0.02, 0.025);
      }
    });
    m.scope("coupler", () => {
      // the automatic coupler: its shaft out of the recess, the square head with its funnel reaching the coupling plane, the air hoses
      blk("coupler", T(-REACH + 0.12), T(0.15), COUPLER_Y - 0.07, COUPLER_Y + 0.07, -0.08, 0.08);
      blk("coupler", T(-REACH), T(-REACH + 0.2), COUPLER_Y - 0.16, COUPLER_Y + 0.16, -0.19, 0.19);
      blk("recess", T(-REACH - 0.004), T(-REACH + 0.02), COUPLER_Y - 0.07, COUPLER_Y + 0.07, -0.02, 0.12);
      blk("coupler", T(-REACH + 0.04), T(-REACH + 0.16), COUPLER_Y + 0.16, COUPLER_Y + 0.24, -0.15, 0.15);
      for (const z of [-0.3, 0.3]) blk("hose", T(-0.12), T(-0.04), COUPLER_Y - 0.42, COUPLER_Y + 0.05, z - 0.03, z + 0.03);
      // the horns on the left over the lamp
      for (const y of [1.62, 1.8]) blk("horn", T(-0.12), T(0.0), y, y + 0.09, 0.54, 0.66);
    });
    m.scope("underfloor", () => {
      // two engines, each with its Voith transmission and silencer, between the bogies; the fuel tank, the batteries
      for (const [e0, e1] of [[5.3, 7.6], [13.1, 15.4]] as const) {
        blk("engine", T(e0), T(e1), 0.42, 0.7, -0.75, 0.75);
        blk("under", T(e1), T(e1 + 0.8), 0.38, 0.62, -0.45, 0.45);
        blk("silencer", T(e0 - 1.05), T(e0 - 0.1), 0.48, 0.7, 0.55, 1.05);
      }
      blk("under", T(9.0), T(11.4), 0.4, 0.7, -1.1, 1.1);
      blk("under", T(11.6), T(12.7), 0.45, 0.7, -1.05, -0.2);
    });
    m.scope("radiators", () => {
      // the engines' radiators under the floor at the sides, their grilles facing out
      for (const sd of [1, -1]) for (const r0 of [8.7, 16.6]) {
        blk("under", T(r0), T(r0 + 1.4), 0.4, 0.7, sd > 0 ? 0.95 : -1.2, sd > 0 ? 1.2 : -0.95);
        for (let k = 0; k < 5; k++) {
          const y = 0.45 + k * 0.055;
          blk("louvre", T(r0 + 0.05), T(r0 + 1.35), y, y + 0.025, sd > 0 ? 1.2 : -1.215, sd > 0 ? 1.215 : -1.2);
        }
      }
    });
  } else {
    m.scope("underfloor", () => {
      // the auxiliary generator set, its tank and the batteries
      blk("engine", 7.5, 10.4, 0.42, 0.72, -0.85, 0.85);
      blk("silencer", 10.6, 11.6, 0.48, 0.7, 0.55, 1.05);
      blk("under", 11.9, 14.2, 0.4, 0.7, -1.1, 1.1);
      blk("under", 5.0, 6.2, 0.45, 0.7, -1.05, -0.2);
    });
  }
}

const SHARED: Record<string, MaterialSpec> = {
  rubber: c("#2b2d30", 0.6), seam: c("#5e6266", 0.6), handle: c("#b9bdc0", 0.3), housing: c("#232527", 0.6), lampRim: c("#2c2e31", 0.5),
  pad: c("#7d8287", 0.6), recess: c("#1c1d1f", 0.8), hump: c("#5c6266", 0.55), louvre: c("#26282a", 0.7), exhaust: c("#2b2c2e", 0.7),
  engine: c("#3a3d40", 0.8), coupler: c("#55585b", 0.6), hose: c("#202122", 0.8), horn: c("#c4c7c9", 0.3), silencer: c("#4b4239", 0.85), cabMask: c("#1d1f22", 0.3),
  lampMarker: { color: "#ece9df", roughness: 0.25, lamp: { role: "head" as const } },
};

/**
 * Regionales (UN Regionales, 1990s; photo-renfe-592-bobadilla-..., 592 015 in 1997): the slate window band
 * along the cars between a white cantrail strip and the white lower body, the orange-red stripe under it,
 * the grey roof and sill; on the face the slate field round the windscreens up to the grey roof dome, the
 * white band with the red stripe through the lamps, dark grey round the coupler. The doors white.
 */
const REGIONAL: ShinkansenLivery = {
  title: "Regionales", number: "592 015",
  palette: {
    ...SHARED, white: c("#ecedea", 0.4), slate: c("#3e4947", 0.45), red: c("#e0462c", 0.4), roofG: c("#7b8386", 0.55), skirtG: c("#474c4f", 0.7),
    frame: c("#c9cccb", 0.4), faceLogo: c("#ecedea", 0.4), numberInk: c("#f4f4f2", 0.4), lettering: c("#2a2c30"),
    // the hump's own paint: the roof's grey
    hump: c("#7b8386", 0.55),
  },
  bands: [[0, A, "skirtG"], [A, 1.36, "white"], [1.36, 1.52, "red"], [1.52, 1.9, "white"], [1.9, 3.1, "slate"], [3.1, 9, "white"]],
  front: [[0, 1.14, "skirtG"], [1.14, 1.36, "white"], [1.36, 1.52, "red"], [1.52, 1.86, "white"], [1.86, 3.18, "slate"], [3.18, 9, "roofG"]],
  doors: [[0, A, "skirtG"], [A, 9, "white"]],
  roof: "roofG", skirt: "skirtG",
  lodSides: [[0, A, "skirtG"], [A, 1.36, "white"], [1.36, 1.52, "red"], [1.52, 1.9, "white"], [1.9, 3.1, "slate"], [3.1, 9, "white"]],
};

/**
 * Media Distancia (Renfe Operadora, from 2005; photo-renfe-serie-592-atocha-200118, photo-s-592-dmu): white,
 * the orange and the purple line along the lower body and across the face through the lamps, the dark grey
 * sill, roof and humps; on the face the black band round the windscreens under the dark grey cap, "renfe"
 * in purple over the coupler and on the cab door.
 */
const MEDIA_DISTANCIA: ShinkansenLivery = {
  title: "Media Distancia", number: "592 239",
  palette: {
    ...SHARED, white: c("#f0f0ec", 0.4), orange: c("#e8731e", 0.4), purple: c("#6e2a73", 0.4), band: c("#1b1c1e", 0.3), roofG: c("#4c5054", 0.55), skirtG: c("#45494c", 0.7),
    frame: c("#1b1c1e", 0.4), faceLogo: c("#6e2a73", 0.4), numberInk: c("#2a2c30"), lettering: c("#2a2c30"),
    hump: c("#4c5054", 0.55),
  },
  bands: [[0, A, "skirtG"], [A, 1.18, "white"], [1.18, 1.27, "purple"], [1.27, 1.33, "white"], [1.33, 1.4, "orange"], [1.4, 9, "white"]],
  front: [[0, A, "skirtG"], [A, 1.18, "white"], [1.18, 1.27, "purple"], [1.27, 1.33, "white"], [1.33, 1.4, "orange"], [1.4, 2.08, "white"], [2.08, 3.12, "band"], [3.12, 9, "roofG"]],
  roof: "roofG", skirt: "skirtG",
  endLettering: [{ text: "renfe", d: 0.02, y: 1.8, h: 0.13, mat: "purple" }],
};

export const R592: ShinkansenSeries = {
  // 70.214 m over the couplers for M-R-M (es.wikipedia): the motor cars 23.66 m, the trailer 22.9 m; 2.86 m wide
  endLength: 23.66, midLength: 22.9, W, Y, S, C, lean: 0.985, B, A,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: R592_FACE,
  windows: [WIN], windowW: 1.35, pitch: 1.9, door: [A + 0.04, 3.04, 2.0, 2.95], doorW: 0.95, doorGlassW: 0.32,
  layout: {
    end: { doors: M_DOORS.map(([a, e]) => [T(a), T(e), 1] as const), windows: M_WINDOWS.map(([a, e]) => [T(a), T(e)] as const) },
    middle: { doors: R_DOORS.map(([a, e]) => [a, e, 1] as const), windows: R_WINDOWS },
  },
  cabWindows: [[T(CAB_GLASS[0]), T(CAB_GLASS[1]), 2.15, 3.0]],
  endBogies: [T(M_BOGIES[0]), T(M_BOGIES[1])], midBogies: [3.15, 19.25],
  bogieCentres: 16.1, wheelR: 0.425, wheelbase: 2.5, traction: "diesel", cars: [3], exhaustInFittings: true, couplerY: COUPLER_Y,
  fittings: r592Fittings,
  // the humps in the distant model: the end car's two, the trailer's two
  lodRoof: { d: [M_HUMPS[0]![0], M_HUMPS[0]![2] - 0.6], hw: HUMP_HW - 0.06, y: [3.35, HUMP_TOP], mat: "hump" },
  lodEndPatches: [{ d: [M_HUMPS[1]![0], M_HUMPS[1]![2] - 0.6], hw: HUMP_HW - 0.06, y: [3.35, HUMP_TOP], mat: "hump" }],
  lodMiddleRoofBlocks: R_HUMPS.map(([d0, , d2]) => ({ d: [d0, d2 - 0.6] as const, hw: HUMP_HW - 0.06, y: [3.35, HUMP_TOP] as const, mat: "hump" })),
  liveries: { regional: REGIONAL, mediaDistancia: MEDIA_DISTANCIA },
  // 130.4 t for three cars: the motor cars 47 t, the trailer 36 t; 420 kW a motor car (two MAN D2866 of 210 kW)
  weight: { end: 47, middle: 36 }, power: 420, maxspeed: 120,
};
