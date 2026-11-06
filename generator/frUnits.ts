// French units on the series kit (shinkansen.ts): the TGV M (Avelia Horizon)
// double-deck high-speed train, the Z 20500 and MI 09 double-deck suburban
// units, the Regio 2N, the Regiolis, the X 3800 "Picasso" railcar and the
// X 73500. See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams, type ShinkansenLivery, type ShinkansenSeries } from "./shinkansen.ts";
import { c, flatCab, nose, NO_NOSE } from "./seriesHelpers.ts";
import type { SeriesCabFace } from "./seriesCab.ts";
import type { SliceBody } from "./sliceBody.ts";
import { block } from "./vehicleParts.ts";
import { decalX, decalZ } from "./usHoodKit.ts";

/** A livery of bands bottom first: [top of band, paint] pairs over a body colour list. */
const livery = (title: string, number: string, palette: Record<string, string>, bands: Array<[number, number, string]>, roof = "roofG", skirt = "skirtG"): ShinkansenLivery => ({
  title, number, roof, skirt, bands,
  palette: { roofG: c("#c9cccd", 0.55), skirtG: c("#3a3d40", 0.7), cabMask: c("#1d1f22", 0.3), ...Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, c(v)])) },
});

// the double-deck rows: the lower deck's windows low, the upper's under the eaves
const DD_ROWS: ReadonlyArray<readonly [number, number]> = [[1.25, 1.95], [2.75, 3.45]];

export const TGV_M: ShinkansenSeries = {
  endLength: 22.15, midLength: 20.6, W: 1.45, Y: 1.2, S: 3.9, C: 4.32, lean: 0.97, B: 0.72, A: 0.95,
  // the Avelia Horizon's broad, low nose rising to a wide windscreen
  nose: nose(6.5, 0.12, 2.5, [[0, 1.3], [0.6, 1.7], [2.6, 2.4], [4.6, 3.2], [6.2, 3.95], [7.4, 4.32]], [[0, 1.25], [0.6, 1.6], [2.6, 2.25], [4.6, 2.95], [6.2, 3.6], [7.4, 3.9]], [[0, 1.2], [1.5, 1.2]], [[0, 1.05], [1.5, 0.95]], [[0, 1.0], [0.6, 0.55], [2.0, 0.7]]),
  windscreen: [4.4, 6.3, 0.07, 1.05], lamps: [1.6, 1.5],
  windows: DD_ROWS, windowW: 1.2, pitch: 1.5, door: [1.1, 3.05, 1.8, 2.6], doorW: 0.95,
  bogieCentres: 14.0, wheelR: 0.46, wheelbase: 2.5,
  liveries: {
    inoui: livery("TGV inOui", "310 001", { body: "#f1f1ee", grey: "#4d5257", red: "#c8102e" }, [[0, 1.05, "grey"], [1.05, 1.12, "red"], [1.12, 9, "body"]]),
    ouigo: livery("Ouigo", "310 051", { body: "#f1f1ee", blue: "#0096d6", pink: "#e6007e" }, [[0, 1.05, "blue"], [1.05, 1.12, "pink"], [1.12, 9, "body"]]),
  },
  weight: { end: 68, middle: 52 }, power: 1000, maxspeed: 320,
};

export const Z20500: ShinkansenSeries = {
  endLength: 26.4, midLength: 24.28, W: 1.45, Y: 1.2, S: 3.85, C: 4.32, lean: 0.97, B: 0.75, A: 0.95,
  nose: nose(0.1, 1, 2, [[0, 4.32]], [[0, 3.85]], [[0, 1.2]], [[0, 0.95]], [[0, 0.75]]),
  windscreen: [0, 0, 0, 0], lamps: [0, 0],
  flatCab: flatCab(1.45, 2.85, 3.6, "cabMask", 1.5),
  windows: DD_ROWS, windowW: 1.3, pitch: 1.55, door: [1.1, 3.05, 1.8, 2.6], doorW: 1.3, doorCount: 2,
  bogieCentres: 17.5, wheelR: 0.46, wheelbase: 2.4, cars: [4, 5],
  liveries: {
    transilien: livery("Transilien", "Z 20501", { body: "#e9ebec", blue: "#1d3f80", red: "#c8102e" }, [[0, 1.05, "blue"], [1.05, 1.12, "red"], [1.12, 9, "body"]]),
    ileDeFrance: livery("Ile-de-France", "Z 20702", { body: "#e9ebec", teal: "#3fa9a0", grey: "#5b6066" }, [[0, 1.05, "grey"], [1.05, 1.15, "teal"], [1.15, 9, "body"]]),
  },
  weight: { end: 64, middle: 48 }, power: 700, maxspeed: 140,
};

/**
 * The MI 09's cab, read from photo-ligne-de-nanterre-...jpg and photo-rame-mi09-...-cdg-...jpg: the
 * face raked back from the lamps to the roof, its corners rounded, the big black field over
 * the windscreen, the lamps in round pods low at the corners, the dark skirt with the coupler.
 */
const MI09_CAB: SeriesCabFace = {
  dJoin: 1.25, dSide: 1.0, first: 3.6, reach: 0.25, roofFrom: 4.05,
  profile: [[0.75, 0.1], [0.95, 0.03], [1.2, 0], [2.0, 0.03], [2.3, 0.08], [3.6, 0.5], [4.0, 0.72], [4.2, 0.95], [4.3, 1.25]],
  corner: [[0.75, 0.3], [2.3, 0.35], [3.6, 0.3], [4.2, 0.15], [4.3, 0.05]], bulge: 0.06, cols: [6, 3, 1, 1],
  rows: [0.75, 0.95, 1.2, 1.6, 2.0, 2.3, 2.9, 3.6, 3.85, 4.0, 4.2, 4.3],
  bands: () => [[0, 0.95, "grey"], [0.95, 9, "body"]],
  masks: [{ lat: [-1.17, 1.17], y: [2.22, 4.02], r: 0.14, mat: "cabMask" }],
  panes: [{ lat: [-1.05, 1.05], y: [2.4, 3.78], r: 0.08 }],
  lamps: [[-1.1, 1.3, 0.13, "lampHead"], [1.1, 1.3, 0.13, "lampHead"], [-0.86, 1.3, 0.05, "lampRed"], [0.86, 1.3, 0.05, "lampRed"]],
  wipers: [[[-0.3, 2.45], [-0.75, 3.4]], [[0.3, 2.45], [0.75, 3.4]]],
};

export const MI09: ShinkansenSeries = {
  endLength: 23.6, midLength: 21.0, W: 1.43, Y: 1.2, S: 3.85, C: 4.3, lean: 0.97, B: 0.75, A: 0.95,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: MI09_CAB,
  windows: DD_ROWS, windowW: 1.2, pitch: 1.45, door: [1.1, 3.05, 1.8, 2.6], doorW: 1.95, doorCount: 3,
  bogieCentres: 15.5, wheelR: 0.43, wheelbase: 2.3, cars: [5],
  liveries: {
    // the STIF scheme: white, the wide grey band over the lower deck's windows, turquoise round the doors
    ratp: { ...livery("RATP", "MI 09 001", { body: "#eef0f0", grey: "#8c9196", turquoise: "#1aa596" }, [[0, 0.95, "grey"], [0.95, 1.15, "body"], [1.15, 2.5, "grey"], [2.5, 9, "body"]]), doors: [[0, 9, "turquoise"]] },
  },
  weight: { end: 58, middle: 52 }, power: 750, maxspeed: 120,
};

export const REGIO2N: ShinkansenSeries = {
  endLength: 17.9, midLength: 16.0, W: 1.45, Y: 1.2, S: 3.85, C: 4.32, lean: 0.97, B: 0.6, A: 0.8,
  // the Omneo's tall, rounded front, the windscreen high over a sloping apron
  nose: nose(2.2, 0.35, 2.3, [[0, 2.2], [0.5, 3.2], [1.5, 4.0], [2.4, 4.32]], [[0, 2.1], [0.5, 2.95], [1.5, 3.6], [2.4, 3.85]], [[0, 1.2], [1.0, 1.2]], [[0, 0.95], [0.8, 0.8]], [[0, 0.85], [0.4, 0.6]]),
  windscreen: [0.6, 2.0, 0.07, 1.15], lamps: [0.15, 1.35],
  windows: DD_ROWS, windowW: 1.4, pitch: 1.7, door: [0.95, 3.05, 1.6, 2.6], doorW: 1.3,
  bogieCentres: 12.5, wheelR: 0.42, wheelbase: 2.3, cars: [4, 5, 6],
  liveries: {
    ter: livery("TER", "Z 55501", { body: "#e9ebec", grey: "#4d5257", blue: "#00a3e0" }, [[0, 1.05, "grey"], [1.05, 1.15, "blue"], [1.15, 9, "body"]]),
    transilien: livery("Transilien", "Z 57001", { body: "#e9ebec", grey: "#4d5257", teal: "#3fa9a0" }, [[0, 1.05, "grey"], [1.05, 1.15, "teal"], [1.15, 9, "body"]]),
  },
  weight: { end: 48, middle: 40 }, power: 500, maxspeed: 160,
};

export const REGIOLIS: ShinkansenSeries = {
  endLength: 19.0, midLength: 15.5, W: 1.45, Y: 1.25, S: 3.2, C: 3.9, lean: 0.95, B: 0.6, A: 0.8,
  // the Coradia Polyvalent's rounded front under a big wrap-round windscreen
  nose: nose(2.0, 0.35, 2.3, [[0, 2.3], [0.4, 3.0], [1.4, 3.65], [2.2, 3.9]], [[0, 2.2], [0.4, 2.8], [1.4, 3.1], [2.2, 3.2]], [[0, 1.25], [0.8, 1.25]], [[0, 0.95], [0.6, 0.8]], [[0, 0.85], [0.3, 0.6]]),
  windscreen: [0.4, 1.8, 0.07, 1.2], lamps: [0.15, 1.4],
  windows: [[1.45, 2.65]], windowW: 1.5, pitch: 1.75, door: [0.95, 3.0, 1.5, 2.6], doorW: 1.3,
  bogieCentres: 12.0, wheelR: 0.42, wheelbase: 2.3, cars: [3, 4, 6],
  liveries: {
    ter: livery("TER", "Z 51501", { body: "#e9ebec", grey: "#4d5257", blue: "#00a3e0" }, [[0, 1.05, "grey"], [1.05, 1.15, "blue"], [1.15, 9, "body"]]),
    grandEst: livery("Grand Est", "Z 51503", { body: "#e9ebec", grey: "#4d5257", red: "#c8102e" }, [[0, 1.05, "grey"], [1.05, 1.15, "red"], [1.15, 9, "body"]]),
  },
  weight: { end: 45, middle: 35 }, power: 450, maxspeed: 160,
};

/** The Picasso's turret: d behind the tip, z span (to one side of the roof), base and top. */
const TURRET = { d: [0.7, 3.4] as const, z: [0.05, 1.3] as const, y0: 3.1, top: 4.3, r: 0.3 };

/**
 * The X 3800's fittings: the driver's turret on the roof near one end and off to one side, its
 * windscreens looking both ways and its side windows; the plain underfloor box.
 */
function picassoFittings(m: MeshBuilder, _b: SliceBody, X: (d: number) => number, car: { end: boolean; length: number; trucks: readonly number[] }): void {
  m.scope("underfloor", () => block(m, "under", X(car.trucks[1]! - 2.6), X(car.trucks[0]! + 2.6), X3800.B - 0.35, X3800.B, -X3800.W * 0.8, X3800.W * 0.8));
  if (!car.end) return;
  const t = TURRET, dj = X3800.cabFace!.dJoin;
  const [xa, xb] = [X(t.d[1] - dj), X(t.d[0] - dj)];
  const [z0, z1] = t.z;
  // the turret's side elevation, its top corners rounded, swept across its width
  const arc = (cx: number, from: number): Array<[number, number]> => Array.from({ length: 5 }, (_, i) => {
    const a = from + (i / 4) * (Math.PI / 2);
    return [cx + t.r * Math.cos(a), t.top - t.r + t.r * Math.sin(a)];
  });
  const prof: Array<[number, number]> = [[xa, t.y0], [xb, t.y0], ...arc(xb - t.r, 0), ...arc(xa + t.r, Math.PI / 2)];
  m.scope("turret", () => {
    m.scope("shell", () => m.sweep("cream", "z", prof, z0, prof, z1));
    const glass = (name: string, f: () => void) => m.scope(name, f);
    // each windscreen: upright up to the rounded top, then curving back over it
    const curved = (mat: string, e: number, x: number, za: number, zb: number, y0: number, aMax: number, proud: number) => {
      decalX(m, mat, x + e * proud, e, za, zb, y0, t.top - t.r);
      const [cx, cy] = [x - e * t.r, t.top - t.r];
      const steps = Math.max(1, Math.ceil(aMax / (Math.PI / 8)));
      const pts: Array<[number, number, number]> = [];
      for (let i = 0; i < steps; i++) {
        const [p, q] = [(aMax * i) / steps, (aMax * (i + 1)) / steps];
        const at = (a: number, z: number): [number, number, number] => [cx + e * (t.r + proud) * Math.cos(a), cy + (t.r + proud) * Math.sin(a), z];
        pts.push(at(p, za), at(q, za), at(q, zb), at(p, za), at(q, zb), at(p, zb));
      }
      const mid = aMax / 2;
      m.facets(mat, pts, [e * Math.cos(mid), Math.sin(mid), 0]);
    };
    for (const [e, x] of [[1, xb], [-1, xa]] as const)
      glass(e > 0 ? "front windscreen" : "rear windscreen", () => {
        for (const [a, b2] of [[z0 + 0.08, (z0 + z1) / 2 - 0.03], [(z0 + z1) / 2 + 0.03, z1 - 0.08]] as const) {
          curved("rubber", e, x, a, b2, 3.62, (Math.PI * 3) / 8, 0.004);
          curved("cabGlass", e, x, a + 0.03, b2 - 0.03, 3.65, (Math.PI * 5) / 16, 0.008);
        }
      });
    glass("side windows", () => {
      for (const [a, b2] of [[xa + 0.35, xa + 1.15], [xb - 1.15, xb - 0.35]] as const)
        for (const [z, sd] of [[z1, 1], [z0, -1]] as const) {
          decalZ(m, "rubber", z + sd * 0.004, sd, a, b2, 3.68, 4.02);
          decalZ(m, "cabGlass", z + sd * 0.008, sd, a + 0.03, b2 - 0.03, 3.71, 3.99);
        }
    });
    m.scope("wiper", () => decalX(m, "black", xb + 0.012, 1, 0.5, 0.52, 3.66, 3.98));
  });
}

/** The Picasso's ends: upright, the corners rounded, two big and two narrow windows, the big lamps at the corners, the red rising to the cream in a V. */
const PICASSO_END: SeriesCabFace = {
  dJoin: 0.55, dSide: 0.5, first: 2.6, roofFrom: 3.2,
  profile: [[1.0, 0.03], [1.15, 0], [2.95, 0], [3.2, 0.08], [3.4, 0.22], [3.55, 0.4], [3.6, 0.55]],
  corner: [[1.0, 0.35], [3.0, 0.35], [3.4, 0.2], [3.6, 0.05]], bulge: 0.05, cols: [6, 3, 1, 1],
  rows: [1.0, 1.15, 1.7, 1.95, 2.15, 2.6, 2.95, 3.05, 3.2, 3.4, 3.55, 3.6],
  bands: (l) => [[0, 1.7, l.bands[0]![2]], [1.7, 9, l.bands[l.bands.length - 1]![2]]],
  panes: [
    { lat: [-1.17, -0.84], y: [2.15, 2.95], r: 0 }, { lat: [-0.68, -0.07], y: [2.17, 3.05], r: 0 },
    { lat: [0.07, 0.68], y: [2.17, 3.05], r: 0 }, { lat: [0.84, 1.17], y: [2.15, 2.95], r: 0 },
  ],
  masks: [
    { lat: [-1.2, -0.81], y: [2.12, 2.98], r: 0, mat: "rubber" }, { lat: [-0.71, -0.04], y: [2.14, 3.08], r: 0, mat: "rubber" },
    { lat: [0.04, 0.71], y: [2.14, 3.08], r: 0, mat: "rubber" }, { lat: [0.81, 1.2], y: [2.12, 2.98], r: 0, mat: "rubber" },
  ],
  // the red's V: from the corners at the lamps down to the middle
  decals: [{ mat: "red", pts: [[-1.47, 1.68], [0, 1.68], [-1.47, 1.95]] }, { mat: "red", pts: [[0, 1.68], [1.47, 1.68], [1.47, 1.95]] }],
  lamps: [[-1.22, 1.92, 0.13, "lampHead"], [1.22, 1.92, 0.13, "lampHead"]], roofLamp: [0, 3.3, 0.07],
  number: { lat: -0.22, y: 1.86, h: 0.1, mat: "lettering" },
  wipers: [[[-0.35, 2.22], [-0.5, 2.85]], [[0.35, 2.22], [0.5, 2.85]]],
};

export const X3800: ShinkansenSeries = {
  endLength: 21.85, midLength: 21.85, W: 1.45, Y: 1.4, S: 3.0, C: 3.6, lean: 0.97, B: 1.0, A: 1.15,
  nose: NO_NOSE, windscreen: [0, 0, 0, 0], lamps: [0, 0], cabFace: PICASSO_END,
  lodRoof: { d: TURRET.d, hw: 0.62, y: [3.3, TURRET.top], mat: "cream" }, fittings: picassoFittings,
  // the engine room's louvres on the red behind the cab door (photo-mine-museum-...-x4042-...jpg), body d behind the join
  endGrilles: [[2.35, 2.9, 1.35, 1.75, 6, "h"], [2.97, 3.52, 1.35, 1.75, 6, "h"], [3.59, 4.14, 1.35, 1.75, 6, "h"]],
  windows: [[1.95, 2.7]], windowW: 1.05, pitch: 1.3, door: [1.2, 2.9, 1.95, 2.6], doorW: 0.85,
  bogieCentres: 13.5, wheelR: 0.45, wheelbase: 2.4, traction: "diesel", single: true, endCoupler: "buffers",
  liveries: {
    // read from photo-autorail-picasso-cfv3v-img-2352.jpg: red below the windows, cream above and on the roof
    redCream: { title: "Red and cream", palette: { red: c("#c8262b"), cream: c("#ece3c4"), roofG: c("#e6dcbc", 0.5), skirtG: c("#2a2c2f", 0.8) }, bands: [[0, 1.9, "red"], [1.9, 9, "cream"]], roof: "roofG", skirt: "skirtG", number: "X 3998" },
  },
  weight: { end: 31, middle: 31 }, power: 250, maxspeed: 120,
};

export const X73500: ShinkansenSeries = {
  endLength: 28.9, midLength: 28.9, W: 1.45, Y: 1.3, S: 3.15, C: 3.85, lean: 0.96, B: 0.75, A: 0.9,
  // the Lint's angular front, the windscreen raked back
  nose: nose(1.6, 0.4, 2.4, [[0, 2.5], [0.4, 3.15], [1.4, 3.7], [1.8, 3.85]], [[0, 2.4], [0.4, 2.95], [1.4, 3.15]], [[0, 1.3], [0.8, 1.3]], [[0, 1.0], [0.6, 0.9]], [[0, 0.95], [0.3, 0.75]]),
  windscreen: [0.35, 1.5, 0.07, 1.15], lamps: [0.15, 1.45],
  windows: [[1.65, 2.75]], windowW: 1.5, pitch: 1.8, door: [1.05, 3.0, 1.65, 2.6], doorW: 1.3,
  bogieCentres: 20.0, wheelR: 0.42, wheelbase: 2.3, traction: "diesel", single: true,
  liveries: {
    ter: livery("TER", "X 73501", { body: "#e9ebec", grey: "#4d5257", blue: "#00a3e0" }, [[0, 1.05, "grey"], [1.05, 1.15, "blue"], [1.15, 9, "body"]]),
    alsace: livery("TER Alsace", "X 73901", { body: "#e9ebec", grey: "#4d5257", red: "#c8102e" }, [[0, 1.05, "grey"], [1.05, 1.15, "red"], [1.15, 9, "body"]]),
  },
  weight: { end: 49, middle: 49 }, power: 514, maxspeed: 140,
};

const P = { tgvM: seriesParams(TGV_M), z20500: seriesParams(Z20500), mi09: seriesParams(MI09), regio2n: seriesParams(REGIO2N), regiolis: seriesParams(REGIOLIS), x3800: seriesParams(X3800), x73500: seriesParams(X73500) };

export function sncfTgvM(v?: ParamValues): MeshBuilder { return buildSeries(TGV_M, P.tgvM, v); }
export function sncfTgvMLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(TGV_M, P.tgvM, v); }
export function sncfZ20500(v?: ParamValues): MeshBuilder { return buildSeries(Z20500, P.z20500, v); }
export function sncfZ20500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(Z20500, P.z20500, v); }
export function ratpMi09(v?: ParamValues): MeshBuilder { return buildSeries(MI09, P.mi09, v); }
export function ratpMi09Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(MI09, P.mi09, v); }
export function sncfRegio2n(v?: ParamValues): MeshBuilder { return buildSeries(REGIO2N, P.regio2n, v); }
export function sncfRegio2nLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(REGIO2N, P.regio2n, v); }
export function sncfRegiolis(v?: ParamValues): MeshBuilder { return buildSeries(REGIOLIS, P.regiolis, v); }
export function sncfRegiolisLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(REGIOLIS, P.regiolis, v); }
export function sncfX3800(v?: ParamValues): MeshBuilder { return buildSeries(X3800, P.x3800, v); }
export function sncfX3800Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(X3800, P.x3800, v); }
export function sncfX73500(v?: ParamValues): MeshBuilder { return buildSeries(X73500, P.x73500, v); }
export function sncfX73500Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(X73500, P.x73500, v); }

export const FR_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-sncf-tgv-m", "TGV M", TGV_M, P.tgvM, sncfTgvM, sncfTgvMLod, "sncf-tgv-m", "uic"),
  seriesDesign("proc-vehicle-sncf-z20500", "SNCF Z 20500", Z20500, P.z20500, sncfZ20500, sncfZ20500Lod, "sncf-z20500", "uic"),
  seriesDesign("proc-vehicle-ratp-mi09", "RER MI 09", MI09, P.mi09, ratpMi09, ratpMi09Lod, "ratp-mi09", "uic"),
  seriesDesign("proc-vehicle-sncf-regio2n", "Regio 2N", REGIO2N, P.regio2n, sncfRegio2n, sncfRegio2nLod, "sncf-regio2n", "uic"),
  seriesDesign("proc-vehicle-sncf-regiolis", "Regiolis", REGIOLIS, P.regiolis, sncfRegiolis, sncfRegiolisLod, "sncf-regiolis", "uic"),
  seriesDesign("proc-vehicle-sncf-x3800", "SNCF X 3800 Picasso", X3800, P.x3800, sncfX3800, sncfX3800Lod, "sncf-x3800", "uic"),
  seriesDesign("proc-vehicle-sncf-x73500", "SNCF X 73500", X73500, P.x73500, sncfX73500, sncfX73500Lod, "sncf-x73500", "uic"),
];
