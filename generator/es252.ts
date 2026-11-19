// The Renfe 252 (proc-vehicle-renfe-252): Siemens / Krauss-Maffei's Bo'Bo' of the
// Eurosprinter family (1991, 75 built, the first 15 for the standard-gauge AVE line,
// a sister of the CP 5600), on the box locomotive kit (boxLocoKit.ts) with its own
// profile, measured on the reference photographs (assets/renfe-252/SOURCES.md;
// docs/models/spain-trains.md): the side of 252 066 at about 75 px/m (heights, by a
// projective fit over the axles along the side), the head-on 252 024 at 96 px/m (the
// face, its width 3.0 m), the three-quarter views of 252 003, 005, 013 (AVE), 055 and
// 064, 252 028's roof:
//
// - 20.38 m over the buffers, 3.0 m wide, the roof's crown at 4.22 m, bogie centres
//   10.5 m, 3.0 m wheelbase, 1.25 m wheels (the CP 5600's published figures);
// - the raked face: the white lower face upright under the lamp band, then leaning
//   back slightly to the windscreen's foot (2.72 m, 0.25 m behind), the big
//   windscreen leaning about 25 degrees to its head (3.58 m, 0.65 m behind), the
//   top headlight box above it and the roof's edge rounding off 1.2 m behind the
//   foot; in plan a flat face with round corners (0.35 - 0.4 m);
// - the section: upright side walls up to 3.44 m, then the cant leaning in to the
//   roof, in which the machine room's row of dark panes and the louvred grille sit
//   (six panes, the grille, two panes from one cab; the other side turned about);
// - the cab side window raked at its front edge, the cab door behind it with its
//   two tall handrails, the lower front corner cut back over the buffer beam;
// - the face: the windscreen (two panes on the AVE units, one on 252 024), the
//   twin top headlight, the two lamp units low on the face (white outboard, red
//   inboard, a louvre inside), the number between them, the horn slots;
// - single-arm pantographs over the cab ends with their knees toward the cabs,
//   the rear raised, the roof line on post insulators, the main breaker; the
//   transformer tank between the bogies;
// - two liveries: AVE (252 003): white, the graphite cab caps sweeping onto the cab
//   sides, the navy line and the grey skirt, the AVE bird on the face, the AVE
//   wordmark and the RENFE roundel on the sides; Renfe Mercancias (252 024, 028):
//   the Renfe Operadora ivory with the dark grey cap round the cab and along the
//   cant, the two purple lines, the black lamp band, the green roof over each cab,
//   the purple "renfe" wordmark on the sides and "renfe Mercancias" on the face.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, roundRect, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = readonly [number, number];

/** Half the length over the buffers (20.38 m). */
const HALF = 10.19;
/** The lower face, |x|; the buffer beam's front. */
const N = 9.6;
const BEAM = 9.68;
/** The body's bottom (the side walls' lower edge). */
const Y0 = 1.0;
/** The white face's foot over the beam. */
const FACE_FOOT = 1.38;
/** The windscreen's sill and head. */
const SCREEN: readonly [number, number] = [2.74, 3.58];
/** The cant's foot (the side wall's top), the cant's top, the roof's crown. */
const CANT = 3.44;
const CANT_TOP = 3.98;
const CROWN = 4.22;
/** The body's half width (3.0 m). */
const W = 1.5;

/** The face's centre line [y, |x|], bottom first. */
const TIP: Table = [
  [Y0, N], [FACE_FOOT, N], [2.32, N - 0.12], [SCREEN[0], N - 0.25], [SCREEN[1], N - 0.65], [3.95, N - 0.86], [4.12, N - 1.02], [CROWN, N - 1.24],
];
/** The half width [y, hw]: upright walls, the cant leaning in, the roof's rounded edge. */
const HW: Table = [[Y0, W], [CANT, W], [CANT_TOP, 1.27], [4.12, 1.14], [CROWN, 0.95]];
/** The face corners' radius by height. */
const CORNER: Table = [[Y0, 0.35], [SCREEN[0], 0.38], [SCREEN[1], 0.42], [CROWN, 0.36]];
const BOW = 0.04;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the face's corner at height y (paint along the cab side stops there). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;
/** The front edge of a cab-side field from y0 up to y1: the side's end at every profile row between. */
const frontEdge = (y0: number, y1: number): Pt[] => {
  const ys = [y0, ...[...TIP.map(([y]) => y), ...HW.map(([y]) => y), ...CORNER.map(([y]) => y)].filter((y) => y > y0 + 1e-3 && y < y1 - 1e-3).sort((a, b) => a - b), y1];
  return [...new Set(ys)].map((y) => [sideEnd(y), y] as const);
};

// --- liveries ----------------------------------------------------------------------

interface Es252Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  number: string;
  /** The cab cap's fields on the cab side, convex outlines in (x, y) for the +x end. */
  capFields: ReadonlyArray<ReadonlyArray<Pt>>;
  /** The panes' frame (the cant's colour). */
  paneFrame: string;
  /** Two windscreen panes with a pillar (the AVE units) or one. */
  splitScreen: boolean;
  kind: "ave" | "mercancias";
}

/** The AVE cap: over the cab on the cant, back to the door (the cab window stands in the white). */
const AVE_CAP: ReadonlyArray<ReadonlyArray<Pt>> = [
  [[7.3, CANT], ...frontEdge(CANT, CANT_TOP), [7.3, CANT_TOP]],
];
/** The Operadora cap: low under the cab window, curving up behind it into the cant at the door. */
const OPERADORA_CAP: ReadonlyArray<ReadonlyArray<Pt>> = [
  [[8.5, 2.64], [sideEnd(2.47), 2.47], ...frontEdge(2.47, CANT).slice(1), [8.5, CANT]],
  [[7.5, 2.85], [8.5, 2.64], [8.5, CANT], [7.5, CANT]],
  [[6.55, CANT], [6.9, 3.1], [7.5, 2.85], [7.5, CANT]],
];

const GRAPHITE = c("#3b4047", 0.55);

const LIVERIES: Record<string, Es252Livery> = {
  ave: {
    title: "AVE",
    palette: {
      body: c("#eceeec", 0.45), skirt: c("#868b90", 0.55), navy: c("#22306e"), cap: GRAPHITE, roofGrey: c("#62676c", 0.7),
      recess: c("#25272a", 0.7), housing: c("#c9cccd", 0.45), ink: c("#232528", 0.6), bird: c("#3d2f86"), birdTip: c("#f0b416"), aveGrey: c("#7d8287", 0.5),
    },
    side: [[Y0, 1.4, "skirt"], [1.4, 1.47, "navy"], [1.47, 4.4, "body"]],
    end: [[Y0, FACE_FOOT, "recess"], [FACE_FOOT, 2.65, "body"], [2.65, 4.4, "cap"]],
    roof: "roofGrey",
    number: "252-003-9",
    capFields: AVE_CAP,
    paneFrame: "body",
    splitScreen: true,
    kind: "ave",
  },
  mercancias: {
    title: "Renfe Mercancias",
    palette: {
      body: c("#e9e4d6", 0.45), purple: c("#8a1f5c"), cap: c("#4b4f55", 0.55), roofGrey: c("#4b4f55", 0.65), green: c("#3c9a62", 0.6),
      skirt: c("#6c7075", 0.6), recess: c("#25272a", 0.7), rim: c("#2c2d30", 0.5), lampBand: c("#1d1e20", 0.6), ink: c("#2a2b30", 0.6), fadedInk: c("#8e9094", 0.5),
    },
    side: [[Y0, 1.15, "body"], [1.15, 1.35, "purple"], [1.35, 1.5, "body"], [1.5, 1.57, "purple"], [1.57, CANT, "body"], [CANT, 4.4, "cap"]],
    end: [[Y0, FACE_FOOT, "recess"], [FACE_FOOT, 2.32, "body"], [2.32, 4.4, "cap"]],
    roof: "roofGrey",
    number: "252-024-5",
    capFields: OPERADORA_CAP,
    paneFrame: "cap",
    splitScreen: false,
    kind: "mercancias",
  },
};

export const ES252_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Es252Livery => LIVERIES[resolveParams(ES252_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The bogie centres, half the wheelbase, the wheel radius, the frame's top. */
const BOGIE_X = 5.25;
const HALF_BASE = 1.5;
const WHEEL_R = 0.625;
const FRAME_TOP = 0.95;
/** The pantographs' base frames over the cab ends, their arms. */
const PANTO = { x: 5.55, base: CROWN + 0.1, lower: 1.85, upper: 1.65 } as const;
/** The cab door and the cab side window (+x end). */
const DOOR = { x: [6.6, 7.3] as const, y: [1.65, 3.4] as const };
const CAB_WINDOW: Ring = [[7.55, 2.78], [8.22, 2.78], [8.0, 3.4], [7.55, 3.4]];
/** The machine room's panes along the cant, front to rear on the left side: six panes, the grille, two panes. */
const PANE_Y: readonly [number, number] = [CANT + 0.05, CANT_TOP - 0.05];
const PANE_RUN: readonly [number, number] = [-6.5, 6.5];
const GRILLE_LEN = 2.8;
const PANE = (PANE_RUN[1] - PANE_RUN[0] - GRILLE_LEN) / 8;

/** The panes and the grille on one side, as x spans; the right side turned about (its grille toward +x). */
function paneSpans(sd: number): { panes: Array<readonly [number, number]>; grille: readonly [number, number] } {
  const panes: Array<readonly [number, number]> = [];
  let x = PANE_RUN[1];
  for (let i = 0; i < 6; i++, x -= PANE) panes.push([x - PANE, x]);
  const grille = [x - GRILLE_LEN, x] as const;
  x -= GRILLE_LEN;
  for (let i = 0; i < 2; i++, x -= PANE) panes.push([x - PANE, x]);
  const flip = (s: readonly [number, number]) => [-s[1], -s[0]] as const;
  return sd < 0 ? { panes, grille } : { panes: panes.map(flip), grille: flip(grille) };
}

function machineRoom(l: Es252Livery): SideItem[] {
  const out: SideItem[] = [];
  for (const sd of [-1, 1]) {
    const { panes, grille } = paneSpans(sd);
    panes.forEach((p, i) => out.push({ kind: "window", name: `pane ${i + 1}`, x: [p[0] + 0.03, p[1] - 0.03], y: PANE_Y, mat: l.paneFrame, r: 0.04, sides: [sd] }));
    out.push({ kind: "grille", name: "grille", x: [grille[0] + 0.03, grille[1] - 0.03], y: PANE_Y, mat: "slat", slats: "v", pitch: 0.12, r: 0.03, sides: [sd] });
  }
  return out;
}

function lampItems(l: Es252Livery): EndItem[] {
  const y: readonly [number, number] = [1.66, 1.84];
  const units: EndItem[] = l.kind === "mercancias"
    ? [{ kind: "paint", name: "lamp band", z: [-1.13, 1.13], y: [1.59, 1.9], mat: "lampBand", layer: 1, poly: roundRect(-1.13, 1.13, 1.59, 1.9, 0.04) }]
    : [-1, 1].map((s): EndItem => ({ kind: "paint", name: `lamp housing ${s > 0 ? "left" : "right"}`, z: s > 0 ? [0.6, 1.24] : [-1.24, -0.6], y: [1.58, 1.9], mat: "housing", layer: 1, poly: roundRect(s > 0 ? 0.6 : -1.24, s > 0 ? 1.24 : -0.6, 1.58, 1.9, 0.03) }));
  for (const s of [-1, 1]) {
    const nm = s > 0 ? "left" : "right";
    const zs = (a: number, b: number): readonly [number, number] => (s > 0 ? [a, b] : [-b, -a]);
    units.push(
      { kind: "lamp", name: `headlight ${nm}`, z: zs(0.96, 1.16), y, r: 0.09 },
      { kind: "lamp", name: `tail lamp ${nm}`, z: zs(0.78, 0.94), y, r: 0.075, mat: "lampRed" },
      { kind: "grille", name: `lamp louvre ${nm}`, z: zs(0.6, 0.76), y: [1.62, 1.86], mat: "slat" },
    );
  }
  return units;
}

/**
 * The windscreen's outer frame edge |z| at its foot and head (252 024 head-on: the glass 2.29 m wide at
 * the foot, 2.17 m at the head, a narrow frame left at the rounded corners); the glass is 0.04 m inside.
 */
const SCREEN_Z: readonly [number, number] = [1.19, 1.13];

/** `lod`: the distant model takes the windscreens as the kit's windows (the full model draws them tapered). */
function spec(l: Es252Livery, lod = false): LocoSpec {
  const screens: EndItem[] = [
    ...(l.splitScreen ? [{ kind: "paint", name: "windscreen pillar", z: [-0.04, 0.04], y: SCREEN, mat: "rubber", layer: 1 } as const] : []),
    ...(lod ? [{ kind: "window", name: "windscreen", z: [-SCREEN_Z[0], SCREEN_Z[0]], y: SCREEN, mat: "rubber" } as const] : []),
  ];
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), slat: c("#5e6367", 0.6), louvre: c("#24272a", 0.85), groove: c("#2a2c2e", 0.7), wiper: c("#2a2c2e", 0.5),
      beam: c("#36393d", 0.75), bogie: c("#2f3134", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      tank: c("#6c7075", 0.6), lampBox: c("#222326", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: l.roof,
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.05,
    bufferHead: "rect",
    frame: { y0: 0.82, y1: Y0 + 0.01, half: 9.45, hw: 1.38, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    pantograph: { kind: "singleArm", x: PANTO.x, roofY: CROWN, baseY: PANTO.base, lower: PANTO.lower, upper: PANTO.upper },
    sideItems: [
      // the lower front corner cut back over the buffer beam
      { kind: "paint", name: "corner cut", x: [9.05, sideEnd(FACE_FOOT)], y: [Y0, FACE_FOOT], mat: "recess", mirror: true, layer: 2,
        poly: [[9.12, Y0], [sideEnd(Y0), Y0], [sideEnd(FACE_FOOT), FACE_FOOT], [9.3, FACE_FOOT], [9.17, 1.3]] },
      ...l.capFields.map((poly, i): SideItem => {
        const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
        return { kind: "paint", name: `cab cap ${i + 1}`, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat: "cap", mirror: true, layer: 1, poly: poly as Ring };
      }),
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, rails: true, mirror: true },
      ...machineRoom(l),
    ],
    endItems: [
      ...screens,
      { kind: "paint", name: "top headlight box", z: [-0.27, 0.27], y: [3.68, 3.94], mat: "lampBox", layer: 1, poly: roundRect(-0.27, 0.27, 3.68, 3.94, 0.04) },
      { kind: "lamp", name: "top headlight left", z: [0.05, 0.21], y: [3.73, 3.89], r: 0.07 },
      { kind: "lamp", name: "top headlight right", z: [-0.21, -0.05], y: [3.73, 3.89], r: 0.07 },
      { kind: "paint", name: "horn slot left", z: [0.78, 1.0], y: [2.56, 2.6], mat: "groove", layer: 1 },
      { kind: "paint", name: "horn slot right", z: [-1.0, -0.78], y: [2.56, 2.6], mat: "groove", layer: 1 },
      ...lampItems(l),
    ],
    roofItems: [],
    plough: "beam",
    number: l.number,
  };
}

// --- what the kit does not draw ----------------------------------------------------

/** A stroke along a (u, v) polyline, `t` wide, as convex quads mitred at the joints (counter-clockwise). */
function strokeQuads(pts: ReadonlyArray<Pt>, t: number): Ring[] {
  const n = pts.length;
  const normal = (a: Pt, b: Pt) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    return [-dy / len, dx / len] as const;
  };
  const off = pts.map((p, i) => {
    const n0 = i > 0 ? normal(pts[i - 1]!, p) : normal(p, pts[i + 1]!);
    const n1 = i < n - 1 ? normal(p, pts[i + 1]!) : n0;
    const mx = n0[0] + n1[0], my = n0[1] + n1[1], ml = Math.hypot(mx, my);
    const k = t / 2 / Math.max(0.35, (mx * n1[0] + my * n1[1]) / ml);
    return [[p[0] + (mx / ml) * k, p[1] + (my / ml) * k], [p[0] - (mx / ml) * k, p[1] - (my / ml) * k]] as const;
  });
  const quads: Ring[] = [];
  for (let i = 0; i + 1 < n; i++) {
    const [l0, r0] = off[i]!, [l1, r1] = off[i + 1]!;
    quads.push([[r0[0], r0[1]], [r1[0], r1[1]], [l1[0], l1[1]], [l0[0], l0[1]]]);
  }
  return quads;
}

/**
 * The lower-case strokes of Renfe's wordmark and "Mercancias", in units of the
 * x-height (u right, v up from the baseline): each glyph's width and its centre lines.
 * The "f" runs from below the baseline to above the ascender, as in the logo.
 */
const LOWER: Record<string, { w: number; lines: ReadonlyArray<ReadonlyArray<Pt>> }> = {
  r: { w: 0.5, lines: [[[0, 0], [0, 1]], [[0, 0.58], [0.14, 0.86], [0.32, 0.99], [0.5, 0.98]]] },
  e: { w: 0.78, lines: [[[0.04, 0.5], [0.78, 0.5], [0.76, 0.74], [0.6, 0.95], [0.38, 1], [0.15, 0.9], [0.02, 0.66], [0.02, 0.36], [0.14, 0.1], [0.38, 0], [0.62, 0.03], [0.78, 0.14]]] },
  n: { w: 0.74, lines: [[[0, 0], [0, 1]], [[0, 0.64], [0.18, 0.92], [0.42, 1], [0.64, 0.9], [0.74, 0.64], [0.74, 0]]] },
  f: { w: 0.56, lines: [[[0.16, -0.95], [0.2, -0.2], [0.2, 1.5], [0.28, 1.76], [0.46, 1.86], [0.62, 1.8]], [[0, 0.98], [0.52, 0.98]]] },
  c: { w: 0.72, lines: [[[0.72, 0.84], [0.54, 0.99], [0.3, 0.98], [0.08, 0.8], [0, 0.5], [0.08, 0.2], [0.3, 0.02], [0.54, 0], [0.72, 0.15]]] },
  a: { w: 0.72, lines: [[[0.08, 0.86], [0.28, 1], [0.52, 1], [0.7, 0.86], [0.7, 0]], [[0.7, 0.55], [0.3, 0.55], [0.04, 0.4], [0.04, 0.15], [0.24, 0], [0.48, 0.02], [0.7, 0.2]]] },
  i: { w: 0.14, lines: [[[0.07, 0], [0.07, 1]], [[0.0, 1.22], [0.2, 1.42]]] },
  s: { w: 0.62, lines: [[[0.6, 0.88], [0.44, 1], [0.18, 1], [0.03, 0.86], [0.05, 0.66], [0.3, 0.55], [0.54, 0.45], [0.63, 0.28], [0.58, 0.1], [0.4, 0], [0.15, 0], [0, 0.12]]] },
  M: { w: 1.1, lines: [[[0, 0], [0, 1.4], [0.55, 0.55], [1.1, 1.4], [1.1, 0]]] },
};
const LOWER_GAP = 0.2;

function lowerWidth(text: string, h: number): number {
  return [...text].reduce((a, ch) => a + LOWER[ch]!.w * h, 0) + Math.max(0, text.length - 1) * LOWER_GAP * h;
}

/** `text` as stroke quads in the reader's (u, v): x-height h, the baseline at v0, centred on u0 (or starting there). */
function lowerQuads(text: string, u0: number, v0: number, h: number, weight: number, centre = true): Ring[] {
  const t = weight * h;
  let u = centre ? u0 - lowerWidth(text, h) / 2 : u0;
  const out: Ring[] = [];
  for (const ch of text) {
    const g = LOWER[ch]!;
    for (const line of g.lines) out.push(...strokeQuads(line.map(([a, b]) => [u + a * h, v0 + b * h] as const), t));
    u += (g.w + LOWER_GAP) * h;
  }
  return out;
}

/** Lays reader-space outlines (u to the reader's right, v up) on a side or an end, d off it. */
function laySide(m: MeshBuilder, sp: ShellSpec, mat: string, polys: readonly Ring[], d: number, cx: number): void {
  for (const sd of [-1, 1]) {
    const at = onSide(sp, sd);
    // the reader's right is +x on the right side (+z), -x on the left: mirrored outlines turn about
    const rings = polys.map((q) => { const r: Ring = q.map(([u, v]) => [cx + sd * u, v] as [number, number]); return sd > 0 ? r : [...r].reverse(); });
    m.scope(sd > 0 ? "right" : "left", () => surfaceDecal(m, mat, at, [0, 0, sd], rings, d));
  }
}
function layEnds(m: MeshBuilder, sp: ShellSpec, mat: string, polys: readonly Ring[], d: number): void {
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    // seen from ahead the reader's right is -z at the front, +z at the rear
    const rings = polys.map((q) => { const r: Ring = q.map(([u, v]) => [-e * u, v] as [number, number]); return e < 0 ? r : [...r].reverse(); });
    m.scope(e > 0 ? "front" : "rear", () => surfaceDecal(m, mat, at, [e, 0, 0], rings, d));
  }
}

/** Renfe Mercancias: the purple "renfe" in the middle of each side, "Mercancias" under it; "renfe Mercancias" on the face. */
function mercanciasMarkings(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("renfe wordmark", () => {
    const h = 0.68;
    laySide(m, sp, "purple", lowerQuads("renfe", 0, 2.09, h, 0.2), 0.004, 0);
    const right = lowerWidth("renfe", h) / 2;
    // under the "nfe", clear of the f's descender
    laySide(m, sp, "fadedInk", lowerQuads("Mercancias", right + 0.25 - lowerWidth("Mercancias", 0.11), 1.82, 0.11, 0.16, false), 0.006, 0);
  });
  m.scope("face lettering", () => {
    layEnds(m, sp, "ink", lowerQuads("renfe", 0, 2.15, 0.12, 0.2), 0.004);
    layEnds(m, sp, "ink", lowerQuads("Mercancias", -0.06, 1.97, 0.075, 0.16, false), 0.004);
  });
}

/** The AVE bird: a V, its short wing to the reader's left, the long one up to the right, a yellow tip under it. */
function birdQuads(cu: number, v: number, s: number): { wings: Ring[]; tip: Ring[] } {
  const p = (a: number, b: number): Pt => [cu + a * s, v + b * s];
  return {
    wings: [...strokeQuads([p(-0.42, 0.42), p(-0.2, 0.18), p(0, 0)], 0.1 * s), ...strokeQuads([p(0, 0), p(0.24, 0.3), p(0.55, 0.55)], 0.1 * s)],
    tip: [[p(-0.08, 0.02), p(0.08, 0.02), p(0, -0.14)].map(([a, b]) => [a, b] as [number, number])],
  };
}

/** AVE: the bird on the face, the AVE wordmark mid-side (grey A and E about the bird), the RENFE roundel ahead of the door. */
function aveMarkings(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("ave bird", () => {
    const b = birdQuads(0.05, 2.08, 0.6);
    layEnds(m, sp, "bird", b.wings, 0.004);
    layEnds(m, sp, "birdTip", b.tip, 0.006);
  });
  m.scope("ave wordmark", () => {
    const h = 0.5, v = 2.0;
    const style = { weight: 0.16 };
    const aw = wordWidth("A", h, style);
    const a = letters("A", -0.45 - aw, v, h, false, style);
    const e = letters("E", 0.45, v, h, false, style);
    const tri = (pts: Array<[number, number]>): Ring[] => { const out: Ring[] = []; for (let i = 0; i + 2 < pts.length; i += 3) out.push([pts[i]!, pts[i + 1]!, pts[i + 2]!]); return out; };
    laySide(m, sp, "aveGrey", [...tri(a), ...tri(e)], 0.004, 0);
    const b = birdQuads(0, v + 0.04, 1.0);
    laySide(m, sp, "bird", b.wings, 0.006, 0);
    laySide(m, sp, "birdTip", b.tip, 0.008, 0);
  });
  m.scope("renfe roundel", () => {
    for (const e of [-1, 1])
      for (const sd of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const x = e * 7.95, y = 2.42;
          const disc = ngon(16, 0.11, 0, x, y);
          surfaceDecal(m, "navy", at, n, [sd > 0 ? disc : [...disc].reverse()], 0.004);
          const h = 0.055;
          const w = wordWidth("RENFE", h, { weight: 0.18 });
          const tris = letters("RENFE", sd > 0 ? x - w / 2 : x + w / 2, 2.22, h, sd < 0, { weight: 0.18 });
          m.facets("navy", tris.map(([u, v]) => at(u, v, 0.004)), n);
        });
  });
}

/** The running number on the face between the lamps: white on the Operadora's black band, dark on the AVE's white face. */
function faceNumbers(m: MeshBuilder, sp: ShellSpec, l: Es252Livery): void {
  m.scope("face numbers", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const h = 0.11, w = h * 0.45, gap = h * 0.14;
        const width = letteringWidth(l.number, w, gap);
        const tris = lettering(l.number, e > 0 ? width / 2 : -width / 2, 1.745 - h / 2, h, w, gap, e > 0);
        m.facets(l.kind === "mercancias" ? "white" : "ink", tris.map(([a, b]) => at(a, b, 0.008)), [e, 0, 0]);
      });
  });
}

/** The cab side window, its front edge raked with the windscreen, framed. */
function cabWindows(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("cab side windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const place = (q: Ring): Ring => { const r: Ring = q.map(([x, y]) => [e * x, y] as [number, number]); return e > 0 ? r : [...r].reverse(); };
          const inset: Ring = [[7.59, 2.82], [8.15, 2.82], [7.96, 3.36], [7.59, 3.36]];
          m.scope("frame", () => surfacePanel(m, "rubber", at, n, place(CAB_WINDOW), -0.01, 0.014));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, place(inset), -0.005, 0.022));
        });
  });
}

/** The windscreen: tapered with the face, one pane or two either side of the pillar, framed. */
function windscreens(m: MeshBuilder, sp: ShellSpec, l: Es252Livery): void {
  const [y0, y1] = SCREEN;
  const vB = [...new Set([...TIP, ...HW, ...CORNER].map(([y]) => y))].sort((a, b) => a - b);
  const uB = [...new Set([y0, (y0 + y1) / 2, y1].flatMap((h) => sp.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
  // a pane from |z| = inner out to the frame's edge, in (z, y), counter-clockwise for the side +z
  const pane = (inner: number, k: number, side: number): Ring => {
    const q: Ring = [[inner, y0 + k], [SCREEN_Z[0] - k, y0 + k], [SCREEN_Z[1] - k, y1 - k], [inner, y1 - k]];
    return side > 0 ? q : q.map(([z, y]) => [-z, y] as [number, number]).reverse();
  };
  const panes: Array<[number, number]> = l.splitScreen ? [[0.03, 1], [0.03, -1]] : [[0, 1], [0, -1]];
  m.scope("windscreens", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        // the outline is symmetric and kept counter-clockwise in (z, y) at both ends, as the kit's end items
        const turn = (q: Ring): Ring => q;
        if (l.splitScreen)
          for (const [inner, sd] of panes)
            m.scope(sd > 0 ? "left pane" : "right pane", () => {
              m.scope("frame", () => surfacePanel(m, "rubber", at, n, turn(pane(inner, 0, sd)), -0.01, 0.014, uB, vB));
              m.scope("glass", () => surfacePanel(m, "glass", at, n, turn(pane(inner + 0.04, 0.04, sd)), -0.005, 0.022, uB, vB));
            });
        else {
          const whole = (k: number): Ring => [[-SCREEN_Z[0] + k, y0 + k], [SCREEN_Z[0] - k, y0 + k], [SCREEN_Z[1] - k, y1 - k], [-SCREEN_Z[1] + k, y1 - k]];
          m.scope("frame", () => surfacePanel(m, "rubber", at, n, turn(whole(0)), -0.01, 0.014, uB, vB));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, turn(whole(0.04)), -0.005, 0.022, uB, vB));
        }
      });
  });
}

/** The windscreen wipers parked upright at the screens' outer edges. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const u = (z: number) => (e > 0 ? -z : z) * s;
          const z0 = 1.1, z1 = 1.06;
          const arm: Ring = [[u(z0 - 0.012), SCREEN[0] + 0.08], [u(z0 + 0.012), SCREEN[0] + 0.08], [u(z1 + 0.012), SCREEN[1] - 0.1], [u(z1 - 0.012), SCREEN[1] - 0.1]];
          surfacePanel(m, "wiper", at, n, (e > 0) === (s > 0) ? [...arm].reverse() : arm, 0.024, 0.04);
        });
    }
  });
}

/** The heavy buffer beam standing out under the face, its ends boxed round the buffers. */
function bufferBeams(m: MeshBuilder): void {
  m.scope("buffer beams", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, "beam", ...span(N - 0.3, BEAM), 0.78, FACE_FOOT - 0.06, -1.36, 1.36);
        for (const z of [-1, 1]) block(m, "beam", ...span(BEAM, BEAM + 0.08), 0.88, 1.24, z > 0 ? 0.62 : -1.22, z > 0 ? 1.22 : -0.62);
      });
  });
}

/** The transformer tank between the bogies, hanging low under the frame. */
function tank(m: MeshBuilder): void {
  m.scope("transformer tank", () => {
    block(m, "tank", -3.2, 3.2, 0.45, 0.83, -1.28, 1.28);
    block(m, "underframe", -3.0, 3.0, 0.42, 0.45, -1.1, 1.1);
  });
}

/** The roof line: a busbar on post insulators between the pantographs, the main breaker in the middle. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.36;
  m.scope("roof line", () => {
    for (const x of [-4.4, -2.9, -1.2, 1.2, 2.9, 4.4]) insulator(m, x, 0, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -(PANTO.x - 0.45), y, 0, PANTO.x - 0.45, y, 0, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.4, 0.4, CROWN - 0.01, CROWN + 0.12, -0.32, 0.32);
      insulator(m, -0.18, 0.18, CROWN + 0.11, y - 0.02);
      insulator(m, 0.18, -0.18, CROWN + 0.11, y - 0.02);
    });
  });
}

/** Renfe Mercancias' green roof over each cab, out to the pantograph. */
function greenRoofs(m: MeshBuilder): void {
  m.scope("green roofs", () => {
    for (const e of [-1, 1]) {
      const x0 = lerpTable(TIP, CROWN) + 0.02, x1 = PANTO.x + 0.9;
      const ring: Ring = [[e * x1, -0.94], [e * x1, 0.94], [e * x0, 0.94], [e * x0, -0.94]];
      m.scope(e > 0 ? "front" : "rear", () => m.cap("green", e > 0 ? ring : [...ring].reverse(), CROWN + 0.004, true));
    }
  });
}

/** The Renfe 252 in a livery. */
export function renfe252(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    if (l.kind === "ave") aveMarkings(m, sp);
    else mercanciasMarkings(m, sp);
    faceNumbers(m, sp, l);
    cabWindows(m, sp);
    windscreens(m, sp, l);
    wipers(m, sp);
    bufferBeams(m);
    tank(m);
  });
  m.scope("roof equipment", () => {
    roofLine(m);
    if (l.kind === "mercancias") greenRoofs(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint, with the cab windows. */
export function renfe252Lod(v?: ParamValues): MeshBuilder {
  const s = spec(liveryOf(v), true);
  return boxLocoLod({ ...s, sideItems: [...s.sideItems, { kind: "window", name: "cab window", x: [7.59, 8.1], y: [2.82, 3.36], mirror: true }] });
}

