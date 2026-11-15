// The NS ICR (Intercityrijtuig, Talbot 1980-88) on the coach kit (worldCoaches.ts): the A (first class) and
// the B (second class) open coaches, 26.4 m over the buffers on Y32 bogies, laid out from photographs
// (assets/ns-icr-coach/SOURCES.md, docs/models/netherlands-trains.md).
//
// Measured (1-D projective fits over each photograph's ten equal windows, scaled to the 25.1 m body;
// the B 61 84 20-70 208-5 at Amsterdam 2017 and an A in the Intercity Plus paint, both fits agree within 0.15 m):
// - Both types share the shell: at one end a wide double-leaf swing-plug door 1.45 - 2.7 m from the end,
//   ten windows 1.57 m wide on a 1.917 m pitch from 3.12 m, then the second door (1.0 m wide) 1.83 - 2.85 m
//   from the other end with the toilet window (0.6 m, frosted) between it and the end wall. Each door leaf
//   has a narrow window with round corners; the windows' corners are well rounded.
// - Heights (about 97 px/m at the second door): the body's foot 0.98 m, the lower blue line to 1.19 m,
//   yellow to 1.88 m, the blue window band to 3.29 m, the yellow line at the eaves to 3.46 m; window sills
//   2.15 m, heads 3.07 m, the door leaves 1.2 - 3.17 m over their step wells; the roof 4.05 m.
// - The roof: a louvred air intake on the roof's end cap over the wide door; rubber-roll UIC gangways.
// - Liveries: `yellowBlue` the ICRm as refurbished 2000-06 (the photographs: the blue band from below the
//   windows to the yellow eaves line, a blue line along the foot, fixed windows but the one beside the wide
//   door, which keeps its top light); `yellowGrey` the coaches as delivered (the same yellow and blue band,
//   documented as the "blauwe band rond de ramen" of the nl article, a dark grey foot line, every window with
//   its fold-down top light). The class numerals 1 or 2 by the doors and between the first and last pairs of
//   windows, the NS logo and the class letter in a ring on the yellow.

import type { WorldCoach } from "./worldCoaches.ts";
import type { CarDef } from "./usTransit.ts";
import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { sideDecal, sideLettering, sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";

const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);

/** Body length between the end walls (26.4 m over the buffers, the coupling planes 0.65 m beyond them). */
const L = 26.4 - 2 * 0.65;
/** The window row's sill and head; the top light's bar below the head. */
const ROW: readonly [number, number] = [2.15, 3.07];
const TOP_LIGHT = 0.3;
/** The paint's heights: the foot line's top, the blue band's foot and head, the eaves (the yellow line's top). */
const FOOT_LINE = 1.19;
const BAND: readonly [number, number] = [1.88, 3.29];
const EAVES = 3.46;
const FOOT = 0.98;

/** d from the +X end: the wide door at that end, the narrow one and the toilet window at the other. */
const WIDE_DOOR: readonly [number, number] = [1.45, 2.7];
const DOOR: readonly [number, number] = [L - 2.85, L - 1.83];
const TOILET: readonly [number, number] = [L - 1.4, L - 0.8];
const WINDOWS: Array<readonly [number, number]> = Array.from({ length: 10 }, (_, i) => [3.12 + i * 1.917, 3.12 + i * 1.917 + 1.57] as const);
/** The class numerals' d: by the wide door, between the first and the last two windows, by the end wall. */
const CLASS_AT = [0.62, (WINDOWS[0]![1] + WINDOWS[1]![0]) / 2, (WINDOWS[8]![1] + WINDOWS[9]![0]) / 2, L - 0.4];
/** The NS logo and the class letter's ring on the yellow (d, y). */
const LOGO: readonly [number, number] = [5.75, 1.55];
const LETTER: readonly [number, number] = [7.65, 1.55];

/** As delivered (the grey foot line) or refurbished (ICRm). */
const delivered = (c0: CarDef) => c0.bands.some(([, , mt]) => mt === "footGrey");

function icrLayout(c0: CarDef, unit: string): CarDef {
  const old = delivered(c0);
  const first = unit === "a";
  const number = first ? (old ? "50 84 10-70 101-7" : "61 84 10-70 101-4") : old ? "50 84 20-70 208-8" : "61 84 20-70 208-5";
  return {
    ...c0,
    // the body's foot steps up to the foot line's top under the doors (the step wells)
    spec: { ...c0.spec, cuts: [WIDE_DOOR, DOOR], cutRadius: 0 },
    windows: [
      { y: ROW, spans: WINDOWS, frame: "frameGrey", cornerR: 0.16 },
      { y: [ROW[0] + 0.02, ROW[1]], spans: [TOILET], frame: "frameGrey", cornerR: 0.12, glass: "frosted" },
    ],
    doors: { spans: [WIDE_DOOR, DOOR], y: [FOOT_LINE + 0.01, 3.17], glass: [2.21, 3.01], glassW: 0.24, glassPair: 0.56, glassCornerR: 0.1 },
    lettering: [{ text: number, d: 16.6, y: FOOT + 0.1, h: 0.075, mat: "letterW" }],
    extras: (m, b, X) => {
      c0.extras?.(m, b, X);
      icrExtras(m, b, X, old, first, c0.spec.W);
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

/**
 * The NS logo (as on the photographs), h tall, centred at (d, y), `u` the reader's right along d: two strokes,
 * each a bar with its arrow tip and the diagonal to the middle bar on the other side, the second the first turned
 * half round. Each stroke is mitred, so it has no overlapping triangles.
 */
const NS_LOGO_STROKE: readonly Pt[] = [[-0.49, -0.95], [-0.94, 0.05], [-0.62, 0.88], [-0.14, 0.88], [0.21, -0.02], [0.94, -0.02]];
function nsLogo(stroke: readonly Pt[], d: number, y: number, h: number, u: number): Pt[] {
  const k = h / 2, w = 0.19 / 2;
  const P = ([a, e]: Pt): Pt => [d + u * a * k * 0.95, y + e * k];
  const dir = (p: Pt, q: Pt): Pt => { const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [(q[0] - p[0]) / l, (q[1] - p[1]) / l]; };
  // each point's offset: the normal of its segment, mitred at a joint
  const off = stroke.map((p, i): Pt => {
    const t0 = i > 0 ? dir(stroke[i - 1]!, p) : dir(p, stroke[i + 1]!);
    const t1 = i + 1 < stroke.length ? dir(p, stroke[i + 1]!) : t0;
    const n0: Pt = [-t0[1], t0[0]], n1: Pt = [-t1[1], t1[0]];
    const mm: Pt = [n0[0] + n1[0], n0[1] + n1[1]], l = Math.hypot(mm[0], mm[1]);
    const cos = (mm[0] * n0[0] + mm[1] * n0[1]) / l;
    return [(mm[0] / l) * (w / cos), (mm[1] / l) * (w / cos)];
  });
  const tris: Pt[] = [];
  for (let i = 0; i + 1 < stroke.length; i++) {
    const [p, q] = [stroke[i]!, stroke[i + 1]!], [o, r] = [off[i]!, off[i + 1]!];
    const a = P([p[0] - o[0], p[1] - o[1]]), b = P([q[0] - r[0], q[1] - r[1]]), c1 = P([q[0] + r[0], q[1] + r[1]]), e = P([p[0] + o[0], p[1] + o[1]]);
    tris.push(a, b, c1, a, c1, e);
  }
  return tris;
}

/** A ring of n quads between radii r0 and r1 round (d, y). */
function ring(d: number, y: number, r0: number, r1: number, n = 16): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, e = ((i + 1) / n) * Math.PI * 2;
    const p = (r: number, t: number): Pt => [d + r * Math.cos(t), y + r * Math.sin(t)];
    out.push(p(r0, a), p(r1, a), p(r1, e), p(r0, a), p(r1, e), p(r0, e));
  }
  return out;
}

function icrExtras(m: MeshBuilder, b: SliceBody, X: (d: number) => number, old: boolean, first: boolean, W: number): void {
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      // the fold-down top lights' bars: on every window as delivered, on the one by the wide door after the refurbishment
      m.scope("top lights", () => {
        for (const [a, e] of old ? WINDOWS : WINDOWS.slice(0, 1)) sidePanel(m, b, X, s, "frameGrey", a + 0.06, e - 0.06, ROW[1] - TOP_LIGHT - 0.02, ROW[1] - TOP_LIGHT + 0.02, 0.016, 0.004);
      });
      m.scope("class", () => {
        for (const d of CLASS_AT) sideLettering(m, b, X, s, first ? "1" : "2", d, 2.74, 0.34, "letterW", 0.007);
      });
      m.scope("logo", () => {
        // the reader's right along d on this side, as sideLettering reads
        const u = -Math.sign(X(0) - X(1)) * s;
        sideDecal(m, b, X, s, "blue", nsLogo(NS_LOGO_STROKE, LOGO[0], LOGO[1], 0.44, u), 0.005);
        sideDecal(m, b, X, s, "blue", nsLogo(NS_LOGO_STROKE.map(([a, e]): Pt => [-a, -e]), LOGO[0], LOGO[1], 0.44, u), 0.0056);
        sideDecal(m, b, X, s, "blue", ring(LETTER[0], LETTER[1], 0.15, 0.18), 0.005);
        sideLettering(m, b, X, s, first ? "A" : "B", LETTER[0], LETTER[1] - 0.09, 0.18, "blue", 0.006);
      });
      // the folding steps under each door: the well's back, two treads and the hangers
      m.scope("steps", () => {
        for (const [d0, d1] of [WIDE_DOOR, DOOR]) {
          const [x0, x1] = [X(d0 + 0.06), X(d1 - 0.06)].sort((p, q) => p - q) as [number, number];
          block(m, "under", x0 + 0.03, x1 - 0.03, 0.62, FOOT_LINE - 0.01, ...side(s, W - 0.34, W - 0.3));
          for (const y of [0.58, 0.86]) block(m, "stepGrey", x0 + 0.03, x1 - 0.03, y, y + 0.04, ...side(s, W - 0.29, W - 0.06));
          for (const x of [x0, x1 - 0.03]) block(m, "under", x, x + 0.03, 0.54, FOOT_LINE - 0.01, ...side(s, W - 0.31, W - 0.04));
        }
      });
      // the air intake on the roof's end cap over the wide door: a dark louvred panel and its slats
      m.scope("roof intake", () => {
        const [d0, d1, y0, y1] = [0.42, 1.55, 3.62, 3.86];
        surfaceStrip(m, b, X, s, "louvre", d0, d1, y0, y1, 0.008, 0.03);
        const n = 6;
        for (let i = 0; i < n; i++) {
          const y = y0 + 0.025 + ((y1 - y0 - 0.05) * (i + 0.5)) / n;
          surfaceStrip(m, b, X, s, "louvreSlat", d0 + 0.03, d1 - 0.03, y - 0.01, y + 0.01, 0.016, 0.01);
        }
      });
    });
  // the underfloor equipment beside the kit's middle box (d 9.05 - 16.05): the battery and air boxes, the reservoirs
  m.scope("underfloor", () => {
    for (const [d0, d1, y0, hw] of [[6.0, 7.6, 0.5, 0.9], [16.6, 18.9, 0.45, 1.0]] as const) block(m, "under", X(d1), X(d0), y0, FOOT, -hw, hw);
    for (const z of [0.5, -0.5]) {
      const r = 0.19;
      const sec: Pt[] = Array.from({ length: 10 }, (_, i): Pt => [z + r * Math.cos((i / 10) * Math.PI * 2), 0.76 + r * Math.sin((i / 10) * Math.PI * 2)]);
      m.sweep("under", "x", sec, X(8.95), sec, X(7.7));
    }
  });
}

const EXTRA: Record<string, MaterialSpec> = {
  frosted: { color: "#c9d3d6", metallic: 0.1, roughness: 0.35 }, stepGrey: c("#6e7174", 0.7), frameGrey: c("#8d9296", 0.4),
};
const NS_YELLOW = "#ffc917";
const NS_BLUE = "#003082";

export const NS_ICR: WorldCoach = {
  length: 26.4, W: 1.41, Y: 1.4, S: EAVES, C: 4.05, B: FOOT, A: FOOT_LINE, rows: [ROW], doorIn: WIDE_DOOR[0], doorW: 1.1, door: [FOOT_LINE + 0.01, 3.17],
  bogieCentres: 19.0, wheelR: 0.46, wheelbase: 2.56, coupler: "buffers", maxspeed: 160,
  types: {
    a: { title: "First class", windows: 10, windowW: 1.57, number: "61 84 10-70 101-4", weight: 41, first: true },
    b: { title: "Second class", windows: 10, windowW: 1.57, number: "61 84 20-70 208-5", weight: 40 },
  },
  liveries: {
    // as delivered: NS yellow with the blue band round the windows up to the yellow eaves line, a dark grey foot line
    yellowGrey: {
      title: "NS yellow, grey", palette: { ...EXTRA, yellow: c(NS_YELLOW), blue: c(NS_BLUE), footGrey: c("#3c4043", 0.6), roofG: c("#8f9396", 0.6) },
      bands: [[0, FOOT_LINE, "footGrey"], [FOOT_LINE, BAND[0], "yellow"], [BAND[0], BAND[1], "blue"], [BAND[1], 9, "yellow"]], roof: "roofG", skirt: "footGrey",
    },
    // the ICRm (2000-06): the same band, a blue line along the foot
    yellowBlue: {
      title: "NS yellow, blue", palette: { ...EXTRA, yellow: c(NS_YELLOW), blue: c(NS_BLUE), footBlue: c(NS_BLUE), roofG: c("#8f9396", 0.6) },
      bands: [[0, FOOT_LINE, "footBlue"], [FOOT_LINE, BAND[0], "yellow"], [BAND[0], BAND[1], "blue"], [BAND[1], 9, "yellow"]], roof: "roofG", skirt: "footBlue",
    },
  },
  details: {
    wl: 1.385, wa: 1.39,
    // the roof's rounded ends over the gangways and the end walls' rounded corners
    roofEnd: [[0, 3.6], [0.08, 3.78], [0.2, 3.89], [0.38, 3.96], [0.6, 4.02], [0.85, 4.05]], endCorner: { len: 0.12, tip: 0.93 },
    rubberGangway: true,
    underfloor: { y0: 0.55, half: 0.95 },
  },
  layout: (c0, unit) => icrLayout(c0, unit),
};
