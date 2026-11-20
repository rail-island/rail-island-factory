// The SNCF BB 67400 (proc-vehicle-sncf-bb67400): Brissonneau et Lotz / MTE's B'B'
// diesel-electric of 1969 - 1975 (232 built, the SEMT Pielstick 16 PA 4 engine), with a cab
// at each end, on the box locomotive kit (boxLocoKit.ts) with its own profile, measured on
// the reference photographs (assets/sncf-bb67400/SOURCES.md; docs/models/france-trains.md):
//
// - the published figures (fr.wikipedia): 17.09 m over the buffers, 2.94 m wide, 4.14 m
//   high, bogie centres 9.80 m, Y 217 bogies of 2.50 m wheelbase, 1,260 mm wheels; 83.3 t,
//   1,765 kW, 140 km/h;
// - the side of 67587 at Amiens (2014, the right side): a 1-D projective fit over the body
//   ends and the four axles (bogie centres 9.8 m, wheelbase 2.5 m measured 2.48 / 2.44 m),
//   about 91 px/m upright and 83 px/m along the side at the near cab, 72 px/m at the far
//   one; the left side of 67579 at Amiens (2011, Fret) fitted the same way, 104 - 107 px/m
//   upright at its near cab; head-on 67628 (151 px/m over the 2.94 m face); 67517 at
//   Lauterbourg (1991) for the blue scheme as delivered; 67611 for the roof;
// - the face: upright from the headstock at 1.30 m to the sill at 2.62 m, the windscreen
//   frame set back 0.08 m over a small ledge there, the two windscreens (2.70 - 3.38 m,
//   0.22 m middle pillar) leaning back 0.24 m, the roof's visor standing out over them at
//   3.47 - 3.62 m, the cab roof rounding back to the crown 0.95 m behind the face; the face's
//   corners rounded 0.14 m, the windscreen frame's 0.3 m (the cab narrower up there);
// - on the face: the headlight and the red lamp each side at 1.68 m (|z| 1.08 and 0.73),
//   the number plate between them, the cast SNCF plate, the grab rail under each windscreen,
//   the wipers, the roof headlight box over the visor and the horns behind it, the headstock
//   with the buffers;
// - the side: the side skirt down to 0.78 m along the whole body over the bogies, the cab
//   door under its drop window (|x| 6.12 - 6.86 m) with its handrails and steps; the big
//   radiator grille and the small louvre both sides at the +x end (the radiator end:
//   67587's right side and 67579's and 67517's left sides all have it there), the long
//   louvred roof slope over the engine room (-4.95 .. 3.1 m), the roof hatch, the exhaust;
// - two liveries (the keys are stored in saved maps): `blueWhite`, the blue of 1969 with
//   the white band along the skirt, the two white bands across the face running back
//   4.3 m from the -x cab with slanted ends, the one white stub with a pointed end at the
//   +x cab, and the navy arrow edged in white along the upper side, its head round the
//   radiator grille pointing at the +x cab door (67401 as delivered; drawn after 67587
//   and 67517); `fret`, Fret SNCF's green +x end (the face below the sill, the cab side,
//   the radiator end up to the cant), the leaning white field with the green "FRET", grey
//   to the -x end with its green face and corner, the dark grey skirt (467579, 2011).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, rect, roundRect, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth, type LetterStyle } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];
type Pt = readonly [number, number];

/** Half the length over the buffers (17.09 m); the face; the headstock's front. */
const HALF = 8.545;
const N = 7.93;
const BEAM = 8.06;
/** The face's foot (the shell's bottom), the side skirt's foot. */
const Y0 = 1.3;
const SKIRT = 0.78;
/** The sill (the windscreen frame's ledge), the windscreens, the side wall's top (the cant), the crown (4.14 m). */
const SILL = 2.62;
const SCREEN: Span = [2.72, 3.42];
const CANT = 3.8;
const CROWN = 4.14;
/** The body's half width (2.94 m). */
const W = 1.47;

/** The face's centre line [y, |x|], bottom first: upright to the sill, the ledge, the leaning windscreens, the visor, the cab roof. */
const TIP: Table = [
  [Y0, N], [SILL, N], [2.66, N - 0.08], [3.46, N - 0.32], [3.5, N - 0.2], [3.64, N - 0.18], [3.72, N - 0.25], [3.87, N - 0.43], [4.0, N - 0.62], [CROWN, N - 0.95],
];
/** The half width: upright to the sill, leaning in a little to the cant, the roof's rounded edge. */
const HW: Table = [[Y0, W], [SILL, W], [CANT, W - 0.08], [3.95, W - 0.26], [4.06, W - 0.5], [CROWN, W - 0.82]];
/** The corner's radius in plan by height: the face's tight corners, the windscreen frame's round pillars. */
const CORNER: Table = [[Y0, 0.14], [SILL, 0.14], [2.66, 0.2], [3.46, 0.22], [3.64, 0.22], [3.87, 0.3], [CROWN, 0.4]];
/** The distant model's profile: the face down to the skirt's foot, no ledge. */
const LOD_TIP: Table = [[SKIRT, N], [SILL, N], [3.46, N - 0.32], [3.64, N - 0.18], [CROWN, N - 0.95]];
const LOD_HW: Table = [[SKIRT, W], [SILL, W], [CANT, W - 0.08], [4.0, W - 0.38], [CROWN, W - 0.82]];
const BOW = 0.01;
const ANGLES = [30, 60, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the face's corner at height y (paint along the cab side stops there). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;

/** The cab door and its drop window. */
const DOOR: { x: Span; y: Span; win: Span } = { x: [6.12, 6.86], y: [Y0 + 0.03, 3.42], win: [SCREEN[0] - 0.02, 3.36] };
/** The radiator grille and the small louvre (the +x end, both sides). */
const GRILLE: { x: Span; y: Span } = { x: [3.42, 5.05], y: [1.74, 3.44] };
const LOUVRE: { x: Span; y: Span } = { x: [1.5, 2.02], y: [3.0, 3.38] };
/** The roof slope's louvres over the engine room, both sides. */
const ROOF_LOUVRES: Span = [-4.95, 3.1];
/** The bogie centres (9.8 m apart), half the wheelbase (2.5 m), the wheels (1,260 mm). */
const BOGIE_X = 4.9;
const HALF_BASE = 1.25;
const WHEEL_R = 0.63;
const FRAME_TOP = 1.02;

// --- liveries ----------------------------------------------------------------------

type Scheme = "blue" | "fret";
interface Bb67400Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  number: string;
  scheme: Scheme;
}

const LIVERIES: Record<string, Bb67400Livery> = {
  blueWhite: {
    title: "Blue and white",
    palette: {
      body: c("#37597c", 0.45), navy: c("#1f324a", 0.45), white: c("#eff0ec", 0.45), roofBody: c("#4a5f74", 0.6), skirt: c("#37597c", 0.45),
      plateField: c("#1f2f45", 0.5), ink: c("#eff0ec", 0.45), grilleSlat: c("#46525c", 0.6),
    },
    number: "67401",
    scheme: "blue",
  },
  fret: {
    title: "Fret",
    palette: {
      body: c("#9ba1a8", 0.5), green: c("#33ab76", 0.45), white: c("#eeeeea", 0.45), roofBody: c("#7f878f", 0.6), skirt: c("#6c6e6c", 0.65),
      plateField: c("#33ab76", 0.45), ink: c("#3a3d40", 0.55), grilleSlat: c("#3d9a6c", 0.55), fretBlue: c("#1d3f80", 0.5), fretOrange: c("#ef7d22", 0.45),
    },
    number: "467579",
    scheme: "fret",
  },
};

export const BB67400_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Bb67400Livery => LIVERIES[resolveParams(BB67400_PARAMS, v).livery!]!;

// --- the paint on the sides ----------------------------------------------------------

/** A paint item from a convex outline (u = x, v = y), on both sides. */
const paintItem = (name: string, mat: string, layer: number, poly: ReadonlyArray<Pt>): SideItem => {
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, layer, poly: poly.map(([u, v]) => [u, v] as [number, number]) };
};

/** The outer edge of the blue scheme's arrow, counter-clockwise: the shaft's foot, the notch, the head's foot, its point, its top, the tail. */
const ARROW: ReadonlyArray<Pt> = [[-4.97, 2.84], [2.62, 2.84], [3.1, 2.26], [2.55, 1.64], [5.55, 1.64], [6.02, 2.3], [5.12, 3.52], [-5.49, 3.52]];
/** The arrow's white edge. */
const EDGE = 0.055;

/** A simple polygon moved in by d (its edges' parallels, met at each corner). */
function inset(poly: ReadonlyArray<Pt>, d: number): Pt[] {
  const n = poly.length;
  const lines = poly.map((a, i) => {
    const b = poly[(i + 1) % n]!;
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const nx = -dy / l, ny = dx / l; // left of the edge: inside for a counter-clockwise ring
    return { p: [a[0] + nx * d, a[1] + ny * d] as Pt, v: [dx, dy] as Pt };
  });
  return poly.map((_, i) => {
    const L1 = lines[(i + n - 1) % n]!, L2 = lines[i]!;
    const den = L1.v[0] * L2.v[1] - L1.v[1] * L2.v[0];
    const t = ((L2.p[0] - L1.p[0]) * L2.v[1] - (L2.p[1] - L1.p[1]) * L2.v[0]) / den;
    return [L1.p[0] + t * L1.v[0], L1.p[1] + t * L1.v[1]] as Pt;
  });
}

/** The arrow in three convex pieces: the shaft, the head below the notch's tip, the head above it. */
function arrowPieces(a: ReadonlyArray<Pt>): Pt[][] {
  const [t1, r, q, b1, h2, p, h1, t0] = a as [Pt, Pt, Pt, Pt, Pt, Pt, Pt, Pt];
  const top: Pt = [r[0], h1[1]];
  return [[t1, r, top, t0], [b1, h2, p, q], [q, p, h1, top, r]];
}

/** The blue scheme's side: the bands from the -x cab, the stub at the +x cab, the arrow. */
function blueSide(): SideItem[] {
  const e0 = sideEnd(1.8);
  const out: SideItem[] = [
    // the face's two bands running back along the side from the -x cab, their ends slanted
    paintItem("upper band", "white", 1, [[-e0, 2.06], [-3.52, 2.06], [-3.3, 2.32], [-e0, 2.32]]),
    paintItem("lower band", "white", 1, [[-e0, 1.72], [-3.79, 1.72], [-3.56, 1.98], [-e0, 1.98]]),
    // the lower band's stub round the +x cab's corner, its end pointed (67587)
    paintItem("band stub", "white", 1, [[e0 - 0.3, 1.85], [e0 - 0.22, 1.72], [e0, 1.72], [e0, 1.98], [e0 - 0.22, 1.98]]),
  ];
  arrowPieces(ARROW).forEach((q, i) => out.push(paintItem(`arrow edge ${i + 1}`, "white", 1, q)));
  arrowPieces(inset(ARROW, EDGE)).forEach((q, i) => out.push(paintItem(`arrow field ${i + 1}`, "navy", 2, q)));
  return out;
}

/** Fret SNCF's white field: its edges at height y, leaning back toward -x. */
const fretWhite = (y: number): Span => [-0.29 - 0.49 * (y - Y0), 2.8 - 0.49 * (y - Y0)];

/** The Fret scheme's side: the green +x end, the white field, the green corner at -x. */
function fretSide(): SideItem[] {
  const [, r0] = fretWhite(Y0), [, rs] = fretWhite(SILL), [, rc] = fretWhite(CANT);
  const [l0] = fretWhite(Y0), [lc] = fretWhite(CANT);
  const e0 = sideEnd(Y0);
  return [
    paintItem("green lower", "green", 1, [[r0, Y0], [e0, Y0], [e0, SILL], [rs, SILL]]),
    paintItem("green upper", "green", 1, [[rs, SILL], [DOOR.x[0] - 0.01, SILL], [DOOR.x[0] - 0.01, CANT], [rc, CANT]]),
    paintItem("white field", "white", 1, [[l0, Y0], [r0, Y0], [rc, CANT], [lc, CANT]]),
    paintItem("green corner", "green", 1, [[-e0, Y0], [-e0 + 0.3, Y0], [-e0 + 0.3, SILL], [-e0, SILL]]),
  ];
}

function spec(l: Bb67400Livery, lod = false): LocoSpec {
  const blue = l.scheme === "blue";
  const end: Band[] = blue
    ? [[Y0, 1.72, "body"], [1.72, 1.98, "white"], [1.98, 2.06, "body"], [2.06, 2.32, "white"], [2.32, 4.4, "body"]]
    : [[Y0, SILL, "green"], [SILL, 4.4, "body"]];
  const lodEnd: Band[] = [[SKIRT, Y0, "headstock"], ...end];
  const lodSide: Band[] = blue
    ? [[SKIRT, 1.02, "body"], [1.02, 1.28, "white"], [1.28, 2.84, "body"], [2.84, 3.52, "navy"], [3.52, 4.4, "body"]]
    : [[SKIRT, Y0, "skirt"], [Y0, 4.4, "body"]];
  const screen = (s: number): EndItem => ({ kind: "window", name: `windscreen ${s > 0 ? "left" : "right"}`, z: s > 0 ? [0.11, 1.24] : [-1.24, -0.11], y: SCREEN, mat: "rubber" });
  const lamps = (s: number): EndItem[] => {
    const nm = s > 0 ? "left" : "right";
    const zs = (a: number, b: number): Span => (s > 0 ? [a, b] : [-b, -a]);
    return [
      { kind: "lamp", name: `headlight ${nm}`, z: zs(0.95, 1.21), y: [1.55, 1.81], r: 0.12 },
      { kind: "lamp", name: `red lamp ${nm}`, z: zs(0.63, 0.81), y: [1.59, 1.77], r: 0.085, mat: "lampRed" },
    ];
  };
  return {
    palette: {
      rubber: c("#1f2124", 0.6), rim: c("#a7abad", 0.4), slat: c("#3c4043", 0.7), louvre: c("#1c1e20", 0.85), groove: c("#22252a", 0.7),
      headstock: c("#2c2e31", 0.75), bogie: c("#2f3134", 0.8), steel: c("#55585c", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      tank: c("#303235", 0.75), exhaust: c("#2a2b2d", 0.85), hatch: c("#5a6168", 0.65), lampBox: c("#2a2c2f", 0.6), handrail: c("#cfd2d0", 0.4),
      ...l.palette,
    },
    y0: lod ? SKIRT : Y0,
    tip: lod ? LOD_TIP : TIP,
    hw: lod ? LOD_HW : HW,
    endPlan,
    corner: "end",
    side: lod ? lodSide : [[Y0, 4.4, "body"]],
    end: lod ? lodEnd : end,
    roof: "roofBody",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.04,
    bufferHead: "rect",
    frame: { y0: 0.95, y1: Y0 + 0.01, half: N - 0.2, hw: W - 0.1, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    exhausts: [[0.4, 0, CROWN + 0.05]],
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, win: DOOR.win, rails: true, mirror: true },
      ...(lod ? [] : blue ? blueSide() : fretSide()),
    ],
    endItems: [
      screen(1), screen(-1),
      ...lamps(1), ...lamps(-1),
    ],
    roofItems: [
      { name: "roof hatch", x: [-4.6, 3.4], w: [0.3, 0.28], y: [CROWN - 0.02, CROWN + 0.05], mat: "hatch" },
    ],
    underItems: lod ? [[-2.0, 1.7, 0.42, SKIRT, 1.15]] : [],
    number: l.number,
  };
}

// --- what the kit does not draw ----------------------------------------------------

/** The side skirt along the whole body below the shell, the blue scheme's white band on it. */
function skirts(m: MeshBuilder, l: Bb67400Livery): void {
  m.scope("side skirts", () => {
    const x1 = N - 0.06;
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        block(m, "skirt", -x1, x1, SKIRT, Y0, ...side(sd, W - 0.05, W));
        if (l.scheme === "blue") {
          const z = sd * (W + 0.004), y0 = 1.02, y1 = 1.28;
          const quad: Vec3[] = [[-x1, y0, z], [x1, y0, z], [x1, y1, z], [-x1, y0, z], [x1, y1, z], [-x1, y1, z]];
          m.facets("white", sd > 0 ? quad : [quad[0]!, quad[2]!, quad[1]!, quad[3]!, quad[5]!, quad[4]!], [0, 0, sd]);
        }
      });
  });
}

/** The headstock under each face carrying the buffers. */
function headstocks(m: MeshBuilder): void {
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [N - 0.3, BEAM] : [-BEAM, -N + 0.3];
        block(m, "headstock", a, b, 0.84, Y0 - 0.005, -1.3, 1.3);
      });
  });
}

/** Text laid on both sides, centred on x = cx (each side reads left to right). */
function sideText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, cx: number, y: number, h: number, style: LetterStyle, d: number): void {
  const w = wordWidth(text, h, style);
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right" : "left", () => {
      const at = onSide(sp, sd);
      // the reader's right is +x on the right side (+z), -x on the left
      const tris = letters(text, sd > 0 ? cx - w / 2 : cx + w / 2, y, h, sd < 0, style);
      m.facets(mat, tris.map(([u, v]) => at(u, v, d)), [0, 0, sd]);
    });
}

/** The lettering on the sides: the running number; Fret's "FRET" on the white field and its logo. */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Bb67400Livery): void {
  m.scope("lettering", () => {
    if (l.scheme === "blue") {
      m.scope("number", () => sideText(m, sp, "white", l.number, -0.8, 2.22, 0.15, { weight: 0.16 }, 0.008));
      return;
    }
    // the green italic "FRET" across the white field (67579: 1.56 - 2.46 m)
    m.scope("fret", () => sideText(m, sp, "green", "FRET", 0.8, 1.6, 0.82, { weight: 0.2, width: 0.6, slant: 0.22 }, 0.012));
    m.scope("number", () => sideText(m, sp, "ink", l.number, -5.0, 1.9, 0.13, { weight: 0.16 }, 0.008));
    m.scope("logo", () => {
      for (const sd of [-1, 1]) {
        const at = onSide(sp, sd);
        const turn = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        surfaceDecal(m, "fretBlue", at, [0, 0, sd], [turn(rect(-5.35, 2.18, -4.75, 2.3))], 0.008);
        surfaceDecal(m, "fretOrange", at, [0, 0, sd], [turn([[-5.35, 2.34], [-4.75, 2.34], [-4.65, 2.42], [-5.35, 2.42]])], 0.008);
      }
    });
  });
}

/** The cast SNCF plate on the face, the number plate between the lamps. */
function facePlates(m: MeshBuilder, sp: ShellSpec, l: Bb67400Livery): void {
  m.scope("face plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        const word = (txt: string, mat: string, cy: number, h: number, d: number) => {
          const w = wordWidth(txt, h, { weight: 0.2 });
          const tris = letters(txt, e > 0 ? w / 2 : -w / 2, cy - h / 2, h, e > 0, { weight: 0.2 });
          m.facets(mat, tris.map(([u, v]) => at(u, v, d)), n);
        };
        // the cast plate: a metal frame and raised letters (67628, 67579)
        m.scope("sncf plate", () => {
          surfacePanel(m, "rim", at, n, roundRect(-0.27, 0.27, 2.11, 2.28, 0.03), -0.004, 0.012);
          word("SNCF", l.scheme === "blue" ? "body" : "green", 2.195, 0.1, 0.016);
        });
        m.scope("number plate", () => {
          surfacePanel(m, "white", at, n, rect(-0.25, 1.51, 0.25, 1.67), -0.004, 0.012);
          surfacePanel(m, "plateField", at, n, rect(-0.23, 1.525, 0.23, 1.655), 0.0, 0.016);
          word(l.number, "white", 1.59, 0.09, 0.02);
        });
      });
  });
}

/** The wipers parked on the windscreens. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const zc of [0.66, -0.66])
        m.scope(`${e > 0 ? "front" : "rear"} ${zc > 0 ? "left" : "right"}`, () => {
          const u = (dz: number) => (e > 0 ? -1 : 1) * (zc + dz);
          const s = e > 0 ? 1 : -1;
          const [y0, y1] = [SCREEN[0] + 0.08, SCREEN[1] - 0.12];
          const arm: Ring = [[u(s * 0.25) - 0.014, y0], [u(s * 0.25) + 0.014, y0], [u(-s * 0.15) + 0.014, y1], [u(-s * 0.15) - 0.014, y1]];
          const area = arm.reduce((a, p, i) => { const q = arm[(i + 1) % arm.length]!; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
          surfacePanel(m, "rubber", at, n, area > 0 ? arm : [...arm].reverse(), 0.024, 0.04);
        });
    }
  });
}

/** The grab rail under each windscreen. */
function faceRails(m: MeshBuilder): void {
  m.scope("face grab rails", () => {
    const y = 2.52;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = e * (N + 0.06);
        for (const [z0, z1] of [[0.16, 1.12], [-1.12, -0.16]] as const) {
          tubeX(m, "handrail", 0.014, x, y, z0, x, y, z1, 6);
          for (const z of [z0 + 0.04, z1 - 0.04]) block(m, "handrail", e > 0 ? N - 0.01 : -N - 0.06, e > 0 ? N + 0.06 : -N + 0.01, y - 0.012, y + 0.012, z - 0.012, z + 0.012);
        }
      });
  });
}

/** The roof headlight box over each visor, the horns behind it. */
function roofLamps(m: MeshBuilder): void {
  m.scope("roof headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x1 = N - 0.12, x0 = N - 0.48;
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, "lampBox", ...span(x0, x1), 3.6, 4.06, -0.25, 0.25);
        const lens = ngon(14, 0.14, 0, 0, 3.83), rim = ngon(14, 0.18, 0, 0, 3.83);
        m.sweep("rim", "x", rim, e * x1, rim, e * (x1 + 0.025));
        m.sweep("lampHead", "x", lens, e * (x1 + 0.025), lens, e * (x1 + 0.04));
        m.scope("horns", () => {
          for (const z of [-0.3, 0.3]) {
            const bell = ngon(8, 0.065, 0, z, CROWN + 0.04), pipe = ngon(8, 0.03, 0, z, CROWN + 0.04);
            m.sweep("steel", "x", pipe, e * (N - 1.25), bell, e * (N - 0.9));
          }
        });
      });
  });
}

/** The louvres along each roof slope over the engine room. */
function roofLouvres(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("roof louvres", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const turn = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        const [y0, y1] = [CANT + 0.03, 4.06];
        surfacePanel(m, "louvre", at, n, rect(ROOF_LOUVRES[0], y0, ROOF_LOUVRES[1], y1), -0.004, 0.008, [], [3.95]);
        const vanes: Ring[] = [];
        for (let x = ROOF_LOUVRES[0] + 0.08; x + 0.06 < ROOF_LOUVRES[1] - 0.04; x += 0.21) for (const [a, b] of [[y0 + 0.02, 3.95], [3.95, y1 - 0.02]] as const) vanes.push(turn(rect(x, a, x + 0.07, b)));
        surfaceDecal(m, "slat", at, n, vanes, 0.012);
      });
  });
}

/** A height span cut at the sill, where the side wall's lean starts (a flat decal across it would sink into the wall). */
const splitAtSill = (a: number, b: number): Span[] => (a < SILL && b > SILL ? [[a, SILL], [SILL, b]] : [[a, b]]);

/** The radiator grille and the small louvre, laid over the paint (the arrow's field runs behind them). */
function grilles(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const turn = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        for (const [name, g, pitch] of [["radiator grille", GRILLE, 0.075], ["louvre", LOUVRE, 0.065]] as const)
          m.scope(name, () => {
            surfacePanel(m, "louvre", at, n, roundRect(g.x[0], g.x[1], g.y[0], g.y[1], 0.02), -0.004, 0.012, [], [SILL]);
            const slats: Ring[] = [];
            for (let x = g.x[0] + 0.04; x + 0.025 < g.x[1] - 0.03; x += pitch) for (const [a, b] of splitAtSill(g.y[0] + 0.03, g.y[1] - 0.03)) slats.push(turn(rect(x, a, x + 0.025, b)));
            surfaceDecal(m, "grilleSlat", at, n, slats, 0.016);
          });
      });
  });
}

/** The fuel tank between the bogies. */
function fuelTank(m: MeshBuilder): void {
  m.scope("fuel tank", () => {
    const r: Ring = [[-1.15, 0.6], [-1.02, 0.42], [1.02, 0.42], [1.15, 0.6], [1.15, SKIRT + 0.1], [-1.15, SKIRT + 0.1]];
    m.sweep("tank", "x", r, -2.0, r, 1.7);
  });
}

/** The BB 67400 in a livery. */
export function sncfBb67400(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    skirts(m, l);
    headstocks(m);
    sideLettering(m, sp, l);
    facePlates(m, sp, l);
    wipers(m, sp);
    faceRails(m);
    roofLouvres(m, sp);
    grilles(m, sp);
  });
  m.scope("roof equipment", () => roofLamps(m));
  m.scope("equipment", () => fuelTank(m));
  return m;
}

/** The distant model: the kit's box locomotive from a coarser profile down to the skirt, the scheme as bands. */
export function sncfBb67400Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l, true);
  // the kit fills 88 of the 100 triangles; Fret's green end and white field take the rest
  const m = boxLocoLod({ ...s, sideItems: [...s.sideItems, { kind: "window", name: "cab window", x: [DOOR.x[0] + 0.1, DOOR.x[1] - 0.1], y: DOOR.win, mirror: true }] }, 88);
  if (l.scheme === "fret")
    m.scope("fret paint", () => {
      const d = 0.012;
      for (const sd of [-1, 1]) {
        const z = sd * (W + d);
        const q = (u0: number, u1: number, y0: number, y1: number): Vec3[] =>
          sd > 0 ? [[u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y0, z], [u1, y1, z], [u0, y1, z]] : [[u0, y0, z], [u1, y1, z], [u1, y0, z], [u0, y0, z], [u0, y1, z], [u1, y1, z]];
        m.facets("green", q(2.2, N - 0.2, Y0, SILL), [0, 0, sd]);
        m.facets("white", q(0.55, 2.2, Y0, SILL), [0, 0, sd]);
      }
    });
  return m;
}
