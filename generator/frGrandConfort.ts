// The SNCF Grand Confort coaches (De Dietrich, 1969 - 1974; the Capitole, Aquitaine, Etendard,
// Kleber, Stanislas and Jules Verne TEE) on the coach kit (worldCoaches.ts): the A8u
// first-class compartment coach (`a8u`) and the A3rtu bar car (`a7d`, the key kept from the
// first draft). 25.5 m over the buffers (fr.wikipedia "Voiture Grand Confort"), Y 28 F bogies,
// 200 km/h; Paul Arzens's livery. See assets/sncf-grand-confort/SOURCES.md and
// docs/models/france-trains.md.
//
// Measured (1-D projective fits along the window band, the body 24.2 m between the end walls;
// the depth ratio from the band's height at both ends):
// - A3rtu (Cite du Train, original "Grand Confort" paint; x = (240 + 3647 t) / (1 + 2.22 t) px,
//   t = d / 24.2, residuals under 0.1 m): from each end a stack of two windows 0.8 - 1.7 m (the
//   upper clear 2.6 - 3.05 m, the lower frosted 2.13 - 2.5 m), the plug door 2.05 - 3.1 m with a
//   narrow window 0.6 m wide, then eight 1.65 m windows on a 2.06 m pitch. Three louvred
//   intakes on the roof's slope over the window stack, a gutter over the door, the BAR plate on
//   the grey right of the door. At the end wall 189 px/m (the buffers 1.06 m, the crown 4.05 m):
//   the window band 1.97 - 3.25 m, the orange lines 0.1 m, the grey 1.28 - 1.87 m, the red foot
//   below it, the apron at the ends and between the bogies down to about 0.77 m (0.75 m here, clear of the buffer beam's foot), the bogie centre
//   about 3.0 m from the end wall.
// - A8u 61 87 18-99 037-6 (Le Capitole, Limoges 1988, TEE "bande jaune" paint; equal window
//   pitch fitted, 0.8 px rms): the windows 1.83 m wide on a 2.6 m pitch, the door at the very end
//   (0.3 - 1.35 m from the end wall) with its narrow window; the windows 2.0 - 3.06 m (209 px/m
//   over the band), the TRANS EUROP EXPRESS letters in the band over the windows from about
//   6.8 to 16.6 m, the framed SNCF logo mid-car on the lower grey, the number under it.
// - The section (fr.wikipedia): the upper body leans in (it was drawn for tilting), an ovoid
//   section close to a trapezium: here the side leans 7% from the grey's foot to the shoulder.

import type { WorldCoach, CoachLivery } from "./worldCoaches.ts";
import type { CarDef } from "./usTransit.ts";
import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import type { Painter } from "./carbodyKit.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { sideLettering, sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";

const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);

/** Body length between the end walls (25.5 m over the buffers, the coupling planes 0.65 m beyond them). */
const L = 25.5 - 2 * 0.65;
/** Heights: the apron's bottom, the body's foot, the red foot's top (the belly, where the side starts to lean). */
const APRON = 0.75;
const FOOT = 0.95;
const RED_TOP = 1.22;
/** The lower orange line, the window band (red), the upper line (orange, or yellow in TEE first class). */
const LOW_LINE: readonly [number, number] = [1.855, 1.97];
const UP_LINE: readonly [number, number] = [3.26, 3.35];
/** The shoulder (the roof's arc starts); the light grey runs up the arc to ROOF_FROM, the slate roof above. */
const SHOULDER = 3.46;
const ROOF_FROM = 3.76;
const LEAN = 0.93;
/** The door's leaf (bottom, top) and its narrow window. */
const DOOR_Y: readonly [number, number] = [FOOT + 0.02, 3.2];
const DOOR_GLASS: readonly [number, number] = [2.08, 2.95];

const mirror = ([a, b]: readonly [number, number]): [number, number] => [L - b, L - a];
const both = (spans: ReadonlyArray<readonly [number, number]>): Array<readonly [number, number]> => [...spans, ...spans.map(mirror)].sort((p, q) => p[0] - q[0]);
const pitched = (from: number, n: number, pitch: number, w: number): Array<[number, number]> => Array.from({ length: n }, (_, i) => [from + i * pitch, from + i * pitch + w]);
const centred = (n: number, pitch: number, w: number) => pitched((L - ((n - 1) * pitch + w)) / 2, n, pitch, w);

interface Unit {
  /** The door (d from each end), the main window row (d, sill and head), the window stack by the door (upper, lower; d and y). */
  door: readonly [number, number];
  row: { spans: Array<readonly [number, number]>; y: readonly [number, number] };
  stack?: { upper: readonly [number, number, number, number]; lower: readonly [number, number, number, number] };
  /** The roof's louvred intakes over each end (d spans). */
  intakes: ReadonlyArray<readonly [number, number]>;
  /** The skirt's cuts start this far from the end (the door at the very end needs its step free). */
  cutFrom?: number;
  number: string;
  /** The red BAR plate on the lower grey (d of its centre). */
  bar?: number;
  /** The TEE livery's TRANS EUROP EXPRESS cartouche over the windows (none on the bar car: its windows reach the line). */
  teeLetters?: boolean;
}

const UNITS: Record<string, Unit> = {
  // A8u: eight compartments, 48 seats
  a8u: {
    door: [0.3, 1.35],
    row: { spans: centred(8, 2.6, 1.83), y: [2.05, 3.03] },
    intakes: [[0.4, 0.85], [1.0, 1.45]],
    cutFrom: 0.2,
    number: "61 87 18-99 037-6",
    teeLetters: true,
  },
  // A3rtu: the bar car
  a7d: {
    door: [2.05, 3.1],
    row: { spans: centred(8, 2.06, 1.65), y: [2.22, 3.2] },
    stack: { upper: [0.8, 1.68, 2.6, 3.05], lower: [0.92, 1.58, 2.13, 2.5] },
    intakes: [[0.6, 1.05], [1.2, 1.65], [1.8, 2.25]],
    number: "61 87 84-99 003-7",
    bar: 4.66,
  },
};

/** The TEE letters: their spacing along the car and their foot and height. */
const TEE_TEXT = "TRANS EUROP EXPRESS";
const TEE_PITCH = 0.47;
const TEE_Y = 3.105;
const TEE_H = 0.14;
/** Their framed cartouche: d either side of mid-car, its foot and head (the yellow line's foot). */
const TEE_HALF = 4.9;
const TEE_PANEL: readonly [number, number] = [3.085, UP_LINE[0]];
/** The framed SNCF logo and the running number, mid-car on the lower grey. */
const LOGO_Y: readonly [number, number] = [1.5, 1.74];
const LOGO_W = 0.6;
const NUMBER_Y = 1.32;

/** A livery with the TEE lettering (the yellow first-class line). */
const isTee = (c0: CarDef) => c0.bands.some(([, , mt]) => mt === "concrete");

function gcLayout(c0: CarDef, unit: string, s: WorldCoach): CarDef {
  const u = UNITS[unit]!;
  const tee = isTee(c0);
  const BOG = L / 2 - s.bogieCentres / 2;
  const reach = s.wheelbase / 2 + s.wheelR + 0.25;
  const cut: [number, number] = [u.cutFrom ?? BOG - reach, BOG + reach];
  const windows: CarDef["windows"][number][] = [{ y: u.row.y, spans: u.row.spans, frame: "rubber", cornerR: 0.12 }];
  if (u.stack) {
    const [a, e, y0, y1] = u.stack.upper, [p, q, z0, z1] = u.stack.lower;
    windows.push({ y: [y0, y1], spans: both([[a, e]]), frame: "rubber", cornerR: 0.08 });
    windows.push({ y: [z0, z1], spans: both([[p, q]]), frame: "rubber", cornerR: 0.08, glass: "frosted" });
  }
  // the light grey runs up the roof's slope to ROOF_FROM; the slate roof above
  const repaint = (base: Painter): Painter => (d, y, r) => (r === "arc" && y < ROOF_FROM ? (tee ? "concrete" : "inox") : base(d, y, r));
  return {
    ...c0,
    spec: { ...c0.spec, lean: LEAN, cuts: [cut, mirror(cut)], cutRadius: 0.25 },
    windows,
    doors: { spans: both([u.door]), y: DOOR_Y, glass: DOOR_GLASS, glassW: 0.56, glassCornerR: 0.1 },
    diaphragm: null,
    repaint,
    lettering: [{ text: u.number, d: L / 2, y: NUMBER_Y, h: 0.06, mat: "lettering" }],
    extras: (m, b, X) => {
      c0.extras?.(m, b, X);
      gcExtras(m, b, X, u, tee, c0.spec.W);
    },
  };
}

/** A strip on the body's outer surface (the side or the roof's arc) on side s from d0 to d1 between heights ya and yb, `proud` off it. */
function surfaceStrip(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, ya: number, yb: number, proud: number, depth = 0.02): void {
  const dm = (d0 + d1) / 2;
  const pa = surfacePoint(b, dm, ya, s), pb = surfacePoint(b, dm, yb, s);
  const nz = ((pa.n[2] + pb.n[2]) / 2) * s, ny = (pa.n[1] + pb.n[1]) / 2;
  const at = (p: Pt, k: number): Pt => [s * (p[0] + nz * k), p[1] + ny * k];
  const ring: Pt[] = [at(pa.p, -depth), at(pb.p, -depth), at(pb.p, proud), at(pa.p, proud)];
  m.sweep(mat, "x", ring, X(d0), ring, X(d1));
}

function gcExtras(m: MeshBuilder, b: SliceBody, X: (d: number) => number, u: Unit, tee: boolean, W: number): void {
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      // the reader's right along d on this side (as sideLettering reads)
      const r = -Math.sign(X(0) - X(1)) * s;
      if (tee && u.teeLetters)
        m.scope("TEE lettering", () => {
          // the cartouche: a darker red panel in a thin gold frame
          const [y0, y1] = TEE_PANEL, [d0, d1] = [L / 2 - TEE_HALF, L / 2 + TEE_HALF], k = 0.014;
          sidePanel(m, b, X, s, "teeRed", d0, d1, y0, y1, 0.004, 0.002);
          for (const [a, e, ya, yb] of [[d0, d1, y0, y0 + k], [d0, d1, y1 - k, y1], [d0, d0 + k, y0 + k, y1 - k], [d1 - k, d1, y0 + k, y1 - k]] as const)
            sidePanel(m, b, X, s, "gold", a, e, ya, yb, 0.006, 0.002);
          const n = TEE_TEXT.length;
          for (let i = 0; i < n; i++) {
            const ch = TEE_TEXT[i]!;
            if (ch === " ") continue;
            sideLettering(m, b, X, s, ch, L / 2 + r * (i - (n - 1) / 2) * TEE_PITCH, TEE_Y, TEE_H, "gold", 0.008, TEE_H * 0.22);
          }
        });
      m.scope("logo", () => {
        const [y0, y1] = LOGO_Y, d = L / 2, hw = LOGO_W / 2, k = 0.018;
        for (const [d0, d1, ya, yb] of [[d - hw, d + hw, y0, y0 + k], [d - hw, d + hw, y1 - k, y1], [d - hw, d - hw + k, y0 + k, y1 - k], [d + hw - k, d + hw, y0 + k, y1 - k]] as const)
          sidePanel(m, b, X, s, "lettering", d0, d1, ya, yb, 0.006, 0.002);
        sideLettering(m, b, X, s, "SNCF", d, y0 + 0.05, 0.14, "lettering", 0.007, 0.03);
      });
      if (u.bar !== undefined)
        m.scope("bar plate", () => {
          const d = u.bar!;
          sidePanel(m, b, X, s, "barRed", d - 0.2, d + 0.2, 1.5, 1.72, 0.006, 0.002);
          sideLettering(m, b, X, s, "BAR", d, 1.55, 0.12, "gold", 0.009);
        });
      // the steps under each door: the well's back, two treads and the hangers
      m.scope("steps", () => {
        for (const [d0, d1] of both([u.door])) {
          const [x0, x1] = [X(d0 + 0.05), X(d1 - 0.05)].sort((p, q) => p - q) as [number, number];
          block(m, "under", x0 + 0.03, x1 - 0.03, 0.6, FOOT - 0.01, ...side(s, W - 0.36, W - 0.32));
          for (const y of [0.56, 0.78]) block(m, "stepGrey", x0 + 0.03, x1 - 0.03, y, y + 0.04, ...side(s, W - 0.31, W - 0.08));
          for (const x of [x0, x1 - 0.03]) block(m, "under", x, x + 0.03, 0.52, FOOT - 0.01, ...side(s, W - 0.33, W - 0.06));
        }
      });
      // the louvred intakes on the roof's slope over each end, and the gutter over the door
      m.scope("roof intakes", () => {
        const [y0, y1] = [3.5, 3.84];
        for (const [a, e] of both(u.intakes)) {
          surfaceStrip(m, b, X, s, "louvre", a, e, y0, y1, 0.008, 0.03);
          for (let i = 0; i < 5; i++) {
            const y = y0 + 0.025 + ((y1 - y0 - 0.05) * (i + 0.5)) / 5;
            surfaceStrip(m, b, X, s, "louvreSlat", a + 0.03, e - 0.03, y - 0.01, y + 0.01, 0.016, 0.01);
          }
        }
        for (const [a, e] of both([[u.door[0] - 0.15, u.door[1] + 0.15]])) surfaceStrip(m, b, X, s, "gutter", a, e, 3.47, 3.5, 0.02, 0.01);
      });
    });
}

const EXTRA: Record<string, MaterialSpec> = {
  frosted: { color: "#d7dcdc", metallic: 0.1, roughness: 0.35 }, stepGrey: c("#6e7174", 0.7), gold: c("#c9a25a", 0.35),
  barRed: c("#b3242c", 0.4), teeRed: c("#8f1a22", 0.45), gutter: c("#7c8186", 0.5),
};
/** Rouge Capitole 602, the orange lines, gris ardoise 807 (roof and bogies). */
const RED = c("#b8202a", 0.4);
const ROOF = c("#5a5f64", 0.7);

/** The paint by height: the red foot, the lower grey, the orange line, the red window band, the upper line, the grey up to the shoulder. */
const gcBands = (grey: string, line: string): CoachLivery["bands"] => [
  [0, RED_TOP, "red"], [RED_TOP, LOW_LINE[0], grey], [LOW_LINE[0], LOW_LINE[1], "orange"], [LOW_LINE[1], UP_LINE[0], "red"],
  [UP_LINE[0], UP_LINE[1], line], [UP_LINE[1], 9, grey],
];

export const SNCF_GRAND_CONFORT: WorldCoach = {
  length: 25.5, W: 1.43, Y: RED_TOP, S: SHOULDER, C: 4.05, B: APRON, A: FOOT, rows: [UNITS.a8u!.row.y], doorIn: 0.3, doorW: 1.05, door: DOOR_Y,
  bogieCentres: 18.2, wheelR: 0.46, wheelbase: 2.5, coupler: "buffers", maxspeed: 200,
  types: {
    a8u: { title: "Compartments", windows: 8, windowW: 1.83, number: UNITS.a8u!.number, weight: 46, first: true },
    a7d: { title: "Bar car", windows: 8, windowW: 1.65, number: UNITS.a7d!.number, weight: 48 },
  },
  liveries: {
    // the original "Grand Confort" paint (the Capitole, 1970): metallic stainless grey, rouge Capitole, an orange line on each side of the window band
    capitole: {
      title: "Capitole", palette: { ...EXTRA, red: RED, inox: c("#b9bdc1", 0.3), orange: c("#ee7a1e", 0.45), roofG: ROOF, skirtG: RED },
      bands: gcBands("inox", "orange"), roof: "roofG", skirt: "skirtG", ends: { bands: gcBands("inox", "orange"), cap: "red" },
    },
    // TEE (Le Capitole, 1988): gris beton for the inox, the yellow first-class line on top and TRANS EUROP EXPRESS over the windows
    // of the compartment car; the bar car keeps its orange line (fr.wikipedia, "livree TEE bande jaune")
    tee: {
      title: "TEE", palette: { ...EXTRA, red: RED, concrete: c("#cfd1cf", 0.5), orange: c("#ee7a1e", 0.45), yellow: c("#f0c419", 0.45), roofG: ROOF, skirtG: RED },
      bands: gcBands("concrete", "orange"), firstBands: gcBands("concrete", "yellow"), roof: "roofG", skirt: "skirtG",
      ends: { bands: gcBands("concrete", "orange"), firstBands: gcBands("concrete", "yellow"), cap: "red" },
    },
  },
  details: {
    wl: 1.3, wa: 1.38,
    // the roof's rounded ends over the gangways and the end walls' rounded corners
    roofEnd: [[0, 3.62], [0.1, 3.8], [0.25, 3.92], [0.45, 3.99], [0.7, 4.05]], endCorner: { len: 0.28, tip: 0.84 },
    rubberGangway: true,
    underfloor: { y0: 0.45, half: 1.0 },
  },
  layout: (c0, unit) => gcLayout(c0, unit, SNCF_GRAND_CONFORT),
};
