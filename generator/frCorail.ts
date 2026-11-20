// The SNCF Corail VTU (voiture a salles, Roger Tallon's design, Franco-Belge 1975-89) on the coach kit
// (worldCoaches.ts): the A10tu (first class, 58 seats in 2+1) and the B11tu (second class, 88 seats in
// 2+2) open coaches, 26.4 m over the buffers on Y 32 bogies 18.306 m apart, 2.825 m wide, 4.05 m high,
// laid out from photographs (assets/sncf-corail-coach/SOURCES.md, docs/models/france-trains.md).
//
// Measured (1-D projective fits over each photograph's ten equal windows, scaled to the 25.1 m body;
// rms 0.013 - 0.018 of the pitch):
// - Both types share the shell (B11tu at Gare du Nord 2023 and at Cerbere, A10tu 50 87 10-97 xxx of the
//   Connecting Europe Express: the same fit within 0.04 pitch): from each end wall a 1.56 m end bay (the
//   toilet), the single-leaf swing-plug door 0.9 m wide (Mielich, "louvoyante"), a pier of 0.84 m, then
//   ten windows 1.40 m wide on a 1.90 m pitch (w / pitch 0.73 - 0.745) and the same at the other end.
// - The toilet window (frosted, 0.8 m, with its top light) is in one end bay per side only, beside the
//   door, the two diagonally opposite (point symmetry: Cerbere shows it at the far end, Gare du Nord at
//   the near end, the Copenhagen A10tu's near bay blank). The roof's air intake lies on the other end's
//   roof shoulder, and a louvred grille under the fifth window from that end (both photographs).
// - Windows 1, 5, 6 and 10 carry a fold-down top light (bar 0.25 m below the head), the others are fixed.
// - Heights (the orange-door close-up about 215 px/m, the Cerbere end about 92 px/m, anchored to the
//   4.05 m crown and the 1.03 m buffers): skirt 0.82 m (cut over the bogies), its dark band to 1.2 m,
//   window sills 2.15 m and heads 3.17 m, the dark window band 2.08 - 3.28 m, the class line 3.28 -
//   3.36 m at the eaves, the light shoulder of the roof to 3.68 m; the door leaf 1.33 - 3.18 m, its
//   narrow round-ended window 0.3 m wide set 0.16 m toward the car's end.
// - Liveries: `corail` the 1975 scheme (light grey "gris clair", the anthracite window band, orange doors,
//   the class line at the eaves, green for second class and yellow for first, the light roof shoulder over
//   a grey ribbed roof, the bronze "corail" wordmark); `teoz` the 2003 Teoz refurbishment (metallic
//   grey with the window band blue in second class and yellow in first, a teal or yellow stripe low on
//   the side, lime-green end bays with the class numeral, a silver ribbed roof).

import type { WorldCoach } from "./worldCoaches.ts";
import type { CarDef } from "./usTransit.ts";
import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import type { Pt } from "./sliceLoft.ts";
import { lodSideBox, type LodBand, type LodPart } from "./lodKit.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { sideDecal, sideLettering, sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";
import { strokeText, strokeWidth } from "./strokeFont.ts";

const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);

/** Body length between the end walls (26.4 m over the buffers, the coupling planes 0.65 m beyond them). */
const L = 26.4 - 2 * 0.65;
/** The window row's sill and head; the top light's bar below the head. */
const ROW: readonly [number, number] = [2.15, 3.17];
const TOP_LIGHT = 0.25;
/** The paint's heights: the dark skirt's top, the window band, the class line at the eaves, the roof's light shoulder. */
const FOOT = 1.2;
const BAND: readonly [number, number] = [2.08, 3.28];
const EAVES = 3.36;
const SHOULDER = 3.68;
const SKIRT = 0.82;

/** d from the +X end: the door, the windows, the toilet window in the end bay. */
const DOOR: readonly [number, number] = [1.56, 2.46];
const PITCH = 1.9;
const WIN_W = 1.4;
const FIRST = (L - (9 * PITCH + WIN_W)) / 2;
const WINDOWS: Array<readonly [number, number]> = Array.from({ length: 10 }, (_, i) => [FIRST + i * PITCH, FIRST + i * PITCH + WIN_W] as const);
const TOILET: readonly [number, number] = [0.62, 1.42];
const mirror = ([a, b]: readonly [number, number]): [number, number] => [L - b, L - a];
/** The windows with a fold-down top light (from either end: the set is symmetric). */
const TOP_LIGHTS = [0, 4, 5, 9];
/** The skirt's cuts over the bogies (the step wells under the doors open with them). */
const CUT: readonly [number, number] = [1.5, 5.3];
/** The door leaf: sill and head, its window's sill and head, width, corner radius and offset toward the end. */
const LEAF: readonly [number, number] = [1.33, 3.18];
const LEAF_GLASS: readonly [number, number] = [2.28, 3.04];

/**
 * Which end bay holds the toilet window on side s: the +X end's on the right (+Z) side, the -X end's on
 * the left. The other end of each side has the roof's air intake and the grille under its fifth window.
 */
const toiletEnd = (s: number) => (s > 0 ? 0 : 1);

type Kind = "corail" | "teoz";
const kindOf = (c0: CarDef): Kind => (c0.bands.some(([, , mt]) => mt === "teozGrey") ? "teoz" : "corail");

function corailLayout(c0: CarDef, unit: string): CarDef {
  const kind = kindOf(c0);
  const first = unit === "a10tu";
  const number = first ? "50 87 10-97 512-1" : "50 87 21-97 195-2";
  const teozEnds: CarDef["ends"] = kind === "teoz" ? { d: DOOR[0], bands: c0.bands.map(([a, e, mt]) => [a, e, mt === "teozBlue" || mt === "teozYellow" ? "teozLime" : mt] as const), cap: "endGrey" } : { d: 0, bands: c0.bands, cap: "endGrey" };
  return {
    ...c0,
    spec: { ...c0.spec, cuts: [CUT, mirror(CUT)], cutRadius: 0.15 },
    windows: [
      { y: ROW, spans: [...WINDOWS], frame: "frameSilver", cornerR: 0.13 },
      { y: ROW, spans: [TOILET], frame: "frameSilver", cornerR: 0.13, glass: "frosted", onSide: 1 },
      { y: ROW, spans: [mirror(TOILET)], frame: "frameSilver", cornerR: 0.13, glass: "frosted", onSide: -1 },
    ],
    doors: { spans: [DOOR, mirror(DOOR)], y: LEAF, glass: LEAF_GLASS, glassW: 0.3, glassCornerR: 0.14, glassInward: -0.16 },
    ...(kind === "corail" ? { doorBands: [[0, 9, "orange"]] as const } : {}),
    ends: teozEnds,
    // the roof's light shoulder over the class line (the original livery)
    ...(kind === "corail" ? { strips: [{ d: [0.16, L - 0.16] as const, y: [EAVES - 0.005, SHOULDER] as const, mat: "shoulder" }] } : {}),
    diaphragm: null,
    lettering: [{ text: number, d: L / 2 + 1.2, y: FOOT + 0.08, h: 0.07, mat: kind === "corail" ? "lettering" : "letterW" }],
    extras: (m, b, X) => {
      c0.extras?.(m, b, X);
      corailExtras(m, b, X, kind, first, c0.spec.W);
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

/** The "corail" wordmark: lower case, its "c" the capital's glyph at the x-height, centred at d with its foot at y. */
function wordmark(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, d: number, y: number, h: number, mat: string): void {
  const w = h * 0.58, gap = h * 0.18, xh = h * 0.65, stroke = h * 0.13;
  const width = w * 0.75 + gap + strokeWidth("orail", w, gap);
  // seen from outside the +Z side reads toward +X (against d when the car faces +X), the -Z side the other way
  const dir = Math.sign(X(0) - X(1));
  const u0 = -width / 2;
  const tris = [...strokeText("C", u0, y, xh, w * 0.75, gap, false, stroke), ...strokeText("orail", u0 + w * 0.75 + gap, y, h, w, gap, false, stroke)];
  sideDecal(m, b, X, s, mat, tris.map(([u, v]): Pt => [d - dir * s * u, v]), 0.006);
}

function corailExtras(m: MeshBuilder, b: SliceBody, X: (d: number) => number, kind: Kind, first: boolean, W: number): void {
  const doors = [DOOR, mirror(DOOR)];
  for (const s of [1, -1])
    m.scope(s > 0 ? "right side" : "left side", () => {
      const te = toiletEnd(s);
      const intakeSpan = ([a, e]: readonly [number, number]): [number, number] => (te === 0 ? mirror([a, e]) : [a, e]);
      m.scope("top lights", () => {
        for (const i of TOP_LIGHTS) {
          const [a, e] = WINDOWS[i]!;
          sidePanel(m, b, X, s, "frameSilver", a + 0.05, e - 0.05, ROW[1] - TOP_LIGHT - 0.018, ROW[1] - TOP_LIGHT + 0.018, 0.016, 0.004);
        }
        const [a, e] = te === 0 ? TOILET : mirror(TOILET);
        sidePanel(m, b, X, s, "frameSilver", a + 0.05, e - 0.05, ROW[1] - TOP_LIGHT - 0.018, ROW[1] - TOP_LIGHT + 0.018, 0.016, 0.004);
      });
      // the louvred grille on the lower side under the fifth window from the intake end
      m.scope("side grille", () => {
        const [a, e] = intakeSpan(WINDOWS[4]!);
        const [y0, y1] = [1.62, 1.94];
        sidePanel(m, b, X, s, "louvre", a + 0.02, e - 0.02, y0, y1, 0.006, 0.003);
        for (let i = 0; i < 6; i++) {
          const y = y0 + 0.03 + ((y1 - y0 - 0.06) * (i + 0.5)) / 6;
          sidePanel(m, b, X, s, "louvreSlat", a + 0.05, e - 0.05, y - 0.01, y + 0.01, 0.01, 0.002);
        }
      });
      if (kind === "corail") {
        // the door's dark frame below the window band: the jambs beside the leaf
        m.scope("door frames", () => {
          for (const [d0, d1] of doors)
            for (const [a, e] of [[d0 - 0.07, d0], [d1, d1 + 0.07]] as const) sidePanel(m, b, X, s, "anthracite", a, e, LEAF[0] - 0.06, BAND[0], 0.004, 0.002);
        });
        // the class placard beside each door (a black plate with the white numeral) and the wordmark at the toilet end
        m.scope("class", () => {
          for (const [d0, d1] of [[DOOR[1] + 0.22, DOOR[1] + 0.5], mirror([DOOR[1] + 0.22, DOOR[1] + 0.5])] as const) {
            sidePanel(m, b, X, s, "placard", d0, d1, 2.5, 3.02, 0.005, 0.002);
            sideLettering(m, b, X, s, first ? "1" : "2", (d0 + d1) / 2, 2.72, 0.24, "letterW", 0.008);
          }
        });
        m.scope("wordmark", () => {
          const [a, e] = te === 0 ? WINDOWS[0]! : WINDOWS[9]!;
          wordmark(m, b, X, s, (a + e) / 2 + (te === 0 ? 0.15 : -0.15), 1.56, 0.24, "bronze");
        });
      } else {
        // the Teoz end bays: the class numeral, outlined in light grey, over the lime field of the bay without the toilet window
        m.scope("class", () => {
          const d = te === 0 ? L - DOOR[0] / 2 - 0.05 : DOOR[0] / 2 + 0.05;
          sideLettering(m, b, X, s, first ? "1" : "2", d, 2.2, 0.98, "teozNum", 0.006, 0.07);
        });
      }
      // the entrance steps under each door: the well's back above the wheels, two treads and the hangers
      m.scope("steps", () => {
        for (const [d0, d1] of doors) {
          const [x0, x1] = [X(d0 + 0.05), X(d1 - 0.05)].sort((p, q) => p - q) as [number, number];
          block(m, "under", x0 + 0.03, x1 - 0.03, 0.82, LEAF[0] - 0.09, ...side(s, W - 0.36, W - 0.32));
          for (const y of [0.52, 0.86]) block(m, "stepGrey", x0 + 0.03, x1 - 0.03, y, y + 0.04, ...side(s, W - 0.31, W - 0.08));
          for (const x of [x0, x1 - 0.03]) block(m, "under", x, x + 0.03, 0.48, LEAF[0] - 0.09, ...side(s, W - 0.33, W - 0.06));
        }
      });
      // the air intake on the roof's shoulder over the intake end's door: a dark louvred panel and its slats
      m.scope("roof intake", () => {
        const [d0, d1] = intakeSpan([0.85, 1.6]);
        const [y0, y1] = [3.6, 3.86];
        surfaceStrip(m, b, X, s, "louvre", d0, d1, y0, y1, 0.008, 0.03);
        for (let i = 0; i < 5; i++) {
          const y = y0 + 0.025 + ((y1 - y0 - 0.05) * (i + 0.5)) / 5;
          surfaceStrip(m, b, X, s, "louvreSlat", d0 + 0.03, d1 - 0.03, y - 0.01, y + 0.01, 0.016, 0.01);
        }
      });
      // the roof's corrugations: ribs along the arc between the rounded ends, light on the shoulder
      m.scope("roof ribs", () => {
        for (const y of RIBS) {
          const [a, e] = y < 3.9 ? [1.7, L - 1.7] : [0.9, L - 0.9];
          surfaceStrip(m, b, X, s, kind === "corail" && y < SHOULDER ? "shoulderRib" : "roofRib", a, e, y - 0.012, y + 0.012, 0.012, 0.02);
        }
      });
    });
}

/** The roof's ribs: heights on the arc. */
const RIBS = [3.45, 3.55, 3.75, 3.84, 3.92, 3.98];

/** The distant model: the doors' paint (Corail's orange leaves, Teoz's lime end bays) as cab fields on the side; the light shoulder. */
function corailLod(body: Parameters<NonNullable<WorldCoach["lod"]>>[0], c0: CarDef, X: (d: number) => number): ReturnType<NonNullable<WorldCoach["lod"]>> {
  const kind = kindOf(c0);
  const span = ([a, e]: readonly [number, number]) => [Math.min(X(a), X(e)), Math.max(X(a), X(e))] as const;
  const side = body.side;
  const top = side[side.length - 1]!;
  const sides: LodBand[] = [...side];
  if (kind === "corail") {
    // the orange leaves: a thin plate standing just off each side (its two faces only), cheaper than cells cut into the shell
    const leaves: LodPart[] = [DOOR, mirror(DOOR)].map((d) => {
      const [x0, x1] = span(d);
      return { draw: (m) => m.scope("doors", () => lodSideBox(m, "orange", [[x0, LEAF[0]], [x1, LEAF[0]], [x1, LEAF[1]], [x0, LEAF[1]]], -c0.spec.W - 0.012, c0.spec.W + 0.012, false)) };
    });
    return { body: { ...body, side: sides }, bogieTop: SKIRT, parts: leaves };
  }
  const cabs = [[0, DOOR[0]] as const, mirror([0, DOOR[0]])].map((d) => { const [x0, x1] = span(d); return { x0, x1, side: (c0.ends?.bands ?? c0.bands).map(([a, e, mt]): LodBand => [Math.max(a, SKIRT), e, mt]).filter(([a, e]) => e > a && a < EAVES).map(([a, e, mt]): LodBand => [a, Math.min(e, EAVES), mt]).concat([[EAVES, top[1], top[2]]]) }; });
  return { body: { ...body, side: sides, cabs }, bogieTop: SKIRT };
}

const EXTRA: Record<string, MaterialSpec> = {
  frosted: { color: "#c9d3d6", metallic: 0.1, roughness: 0.35 }, stepGrey: c("#6e7174", 0.7), louvre: c("#1d1f21", 0.8), louvreSlat: c("#55595d", 0.6),
  endGrey: c("#3d4043", 0.6), letterW: c("#ecece8", 0.5), lettering: c("#2a2c30"),
};

export const SNCF_CORAIL: WorldCoach = {
  length: 26.4, W: 1.4125, Y: 1.45, S: EAVES, C: 4.05, B: SKIRT, A: FOOT, rows: [ROW], doorIn: DOOR[0], doorW: DOOR[1] - DOOR[0], door: LEAF,
  bogieCentres: 18.306, wheelR: 0.46, wheelbase: 2.56, coupler: "buffers", maxspeed: 200,
  types: {
    a10tu: { title: "First class", windows: 10, windowW: WIN_W, number: "50 87 10-97 512-1", weight: 42, first: true },
    b11tu: { title: "Second class", windows: 10, windowW: WIN_W, number: "50 87 21-97 195-2", weight: 42 },
  },
  liveries: {
    // 1975: light grey, the anthracite window band up to the class line at the eaves (green second, yellow first), orange doors
    corail: {
      title: "Corail",
      palette: { ...EXTRA, grey: c("#d9dad6", 0.45), anthracite: c("#46494d", 0.5), green: c("#62b33a", 0.45), yellow: c("#f2c31b", 0.45), orange: c("#ec6a1f", 0.45),
        shoulder: c("#e1e2de", 0.45), shoulderRib: c("#cbcdc9", 0.5), roofG: c("#64676b", 0.6), roofRib: c("#55585c", 0.65), skirtG: c("#4a4d51", 0.7),
        placard: c("#202224", 0.5), bronze: c("#a88a52", 0.4) },
      bands: [[0, FOOT, "skirtG"], [FOOT, BAND[0], "grey"], [BAND[0], BAND[1], "anthracite"], [BAND[1], 9, "green"]],
      firstBands: [[0, FOOT, "skirtG"], [FOOT, BAND[0], "grey"], [BAND[0], BAND[1], "anthracite"], [BAND[1], 9, "yellow"]],
      roof: "roofG", skirt: "skirtG",
    },
    // 2003 Teoz: metallic grey, the window band blue (second) or yellow (first) between a white line and a teal eaves line, a stripe low on the side
    teoz: {
      title: "Teoz",
      palette: { ...EXTRA, teozGrey: c("#a3a8ab", 0.35), teozBlue: c("#2763b0", 0.4), teozYellow: c("#ecbf12", 0.4), teozTeal: c("#14a09a", 0.4), teozLime: c("#94bf3c", 0.45),
        white: c("#eef0ee", 0.4), teozNum: c("#d4d8da", 0.4), roofG: c("#b2b6b8", 0.35), roofRib: c("#9ea2a5", 0.4), skirtG: c("#6f7477", 0.5) },
      bands: [[0, 1.29, "teozGrey"], [1.29, 1.59, "teozTeal"], [1.59, 2.07, "teozGrey"], [2.07, 2.1, "white"], [2.1, 3.3, "teozBlue"], [3.3, 9, "teozTeal"]],
      firstBands: [[0, 1.29, "teozGrey"], [1.29, 1.59, "teozYellow"], [1.59, 2.07, "teozGrey"], [2.07, 2.1, "white"], [2.1, 9, "teozYellow"]],
      roof: "roofG", skirt: "skirtG",
    },
  },
  details: {
    wl: 1.32, wa: 1.39,
    // the roof's rounded ends over the gangways and the end walls' rounded corners
    roofEnd: [[0, 3.7], [0.08, 3.84], [0.2, 3.93], [0.38, 3.99], [0.6, 4.03], [0.85, 4.05]], endCorner: { len: 0.15, tip: 0.9 },
    rubberGangway: true,
    underfloor: { y0: 0.6, half: 1.0 },
  },
  layout: (c0, unit) => corailLayout(c0, unit),
  lod: (body, c0, X) => corailLod(body, c0, X),
};
