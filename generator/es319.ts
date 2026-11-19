// The Renfe 319 (proc-vehicle-renfe-319): the GM-EMD Co'Co' diesel-electric that Macosa /
// Meinfesa built for Renfe, drawn as the rebuilt subseries 319.2 (from 1984, the 16-567C
// engine of the 1965 class 1900 in a new body) and 319.3 (1991, 16-645E): a full-width
// carbody with a cab at each end. On the box locomotive kit (boxLocoKit.ts) with its own
// profile, measured on the reference photographs (assets/renfe-319/SOURCES.md;
// docs/models/spain-trains.md): the side of 319.254 (a 1-D projective fit with the cabs made
// symmetric, about 61.5 px/m vertical, 66 px/m along the side at the middle), the front
// three-quarter of 319.310 (131 px/m vertical at the face), the three-quarters of 319.201,
// 319.205, 319.302 and 319.323:
//
// - 19.50 m over the buffers, 3.08 m wide (drawn 3.0 m, inside the gauge with the door
//   handrails), 4.145 m high (the 319.221 - 258 and 319.3
//   bodies; listadotren), bogie pivots 11.0 m apart, GM three-axle bogies with the axles
//   1.95 m and 1.68 m apart (the long gap inboard), 1,067 mm wheels;
// - the face: upright and flat with narrow chamfered corners, the grey lower face under
//   the yellow (1.66 m), the yellow face up to the two windscreens (2.86 - 3.55 m, leaning
//   back 0.14 m), the brow over them sloping back to the roof (0.62 m behind the face at
//   the crown) with the twin headlight box on it, the grab rail across the face at 2.82 m
//   and down its corners, two round marker lamps at 2.24 m, the red tail lamp in the grey,
//   the Renfe roundel in the middle, the number, the heavy buffer beam and pilot below;
// - the section: upright walls to 3.58 m, the cant leaning in to 3.88 m (the yellow line
//   along the hood), the roof rounding off to the crown;
// - each cab 2.1 m long: the sliding side window (two panes, its front edge leaning with the
//   face), the plain cab door behind it with its handrails;
// - the hood: the big two-part air intake grille behind the -x cab, the number panel in the
//   middle, the two rows of five louvres before the +x cab with the radiator housing and its
//   two fans over them on the roof, the exhaust, the fuel tank and the air box between the
//   bogies;
// - two liveries (the keys are stored in saved maps): Renfe Mercancias (319.254, the grey
//   hood weathered, yellow cabs and cant line, the big white "319.254", the Renfe roundel on
//   one cab, the Renfe Mercancias pictogram on the other) and Estrella: no 319 in the brown
//   and cream Estrella scheme of the two 319.2 of 1984 is photographed on Commons, so the key
//   shows the 319.3 as it hauled the Estrella night trains (319.310 in 1993, 319.323 at
//   Ferrol): the fresh dark blue-grey hood, the yellow "319.3" on the ribbed panel, the mesh
//   grille before the +x cab.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth, type LetterStyle } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = readonly [number, number];

/** Half the length over the buffers (19.50 m). */
const HALF = 9.75;
/** The face, |x|; the buffer beam's front. */
const N = 9.05;
const BEAM = 9.25;
/** The body's bottom (the side walls' lower edge). */
const Y0 = 1.25;
/** The grey lower band's top (the yellow's foot). */
const SILL = 1.66;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.86, 3.55];
/** The cant's foot (the side wall's top), the cant's top, the roof's crown. */
const CANT = 3.58;
const CANT_TOP = 3.88;
const CROWN = 4.145;
/** The body's half width: 3.0 m, 0.08 m under the real 3.08 m so the cab doors' handrails stay inside the 3.1 m gauge. */
const W = 1.5;
/** The face's chamfered corners. */
const CHAMFER = 0.14;

/** The face's centre line [y, |x|], bottom first: the grey band a little behind the yellow face, the brow leaning back. */
const TIP: Table = [
  [Y0, N - 0.04], [SILL - 0.02, N - 0.04], [SILL, N], [2.82, N], [SCREEN[1], N - 0.14], [CANT_TOP, N - 0.34], [4.06, N - 0.48], [CROWN, N - 0.62],
];
/** The half width [y, hw]: upright walls, the cant leaning in, the roof's rounded edge. */
const HW: Table = [[Y0, W], [CANT, W], [CANT_TOP, 1.31], [4.06, 1.1], [CROWN, 0.84]];

function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(CHAMFER, w * 0.5);
  return [[0, 0], [w - r, 0], [w - r * 0.3, r * 0.1], [w, r]];
}

/** Where the side wall meets the face's chamfer at height y (paint along the cab side stops there). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - CHAMFER - 0.005;
/** The front edge of a cab-side field from y0 up to y1: the side's end at every profile row between. */
const frontEdge = (y0: number, y1: number): Pt[] => {
  const ys = [y0, ...[...TIP.map(([y]) => y), ...HW.map(([y]) => y)].filter((y) => y > y0 + 1e-3 && y < y1 - 1e-3).sort((a, b) => a - b), y1];
  return [...new Set(ys)].map((y) => [sideEnd(y), y] as const);
};

// --- liveries ----------------------------------------------------------------------

interface Es319Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  number: string;
  /** The big class number on the hood: the class and the rest, the colour. */
  hoodNumber: readonly [string, string];
  /** The number panel ribbed (319.3) or flat (319.2). */
  ribbedPanel: boolean;
  /** The louvres before the +x cab (319.2) or a mesh grille (319.3). */
  louvres: boolean;
  /** The face number: left over the lamp (319.3) or right (319.2), as photographed. */
  faceNumberSide: number;
  kind: "mercancias" | "estrella";
}

const LIVERIES: Record<string, Es319Livery> = {
  estrella: {
    title: "Estrella",
    palette: {
      hood: c("#323a46", 0.55), lower: c("#2c323a", 0.6), yellow: c("#f2c300", 0.45), roofGrey: c("#3a4049", 0.65),
      numeral: c("#f2c300", 0.45), rib: c("#3d4653", 0.55),
    },
    number: "319.310.9",
    hoodNumber: ["319", ".3"],
    ribbedPanel: true,
    louvres: false,
    faceNumberSide: 1,
    kind: "estrella",
  },
  mercancias: {
    title: "Renfe Mercancias",
    palette: {
      hood: c("#62676b", 0.6), lower: c("#56595d", 0.65), yellow: c("#d9ab22", 0.5), roofGrey: c("#8b8f92", 0.65),
      numeral: c("#e9e3d0", 0.5), rib: c("#6d7276", 0.6), mGreen: c("#2f9b7a", 0.5), mGrey: c("#b9bcbc", 0.5),
    },
    number: "319.254.9",
    hoodNumber: ["319", ".254"],
    ribbedPanel: false,
    louvres: true,
    faceNumberSide: -1,
    kind: "mercancias",
  },
};

export const ES319_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Es319Livery => LIVERIES[resolveParams(ES319_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The bogie pivots; the +x bogie's axles from its pivot (the -x one turned about); the wheel radius; the frame's top. */
const BOGIE_X = 5.5;
const AXLES = [-1.8, 0.15, 1.83] as const;
const WHEEL_R = 0.534;
const FRAME_TOP = 0.93;
/** The cab's rear end, the cab door and the cab side window (+x end). */
const CAB_END = 6.97;
const DOOR = { x: [7.07, 7.57] as const, y: [1.74, 3.5] as const };
const CAB_WINDOW: Ring = [[7.84, 2.82], [8.82, 2.82], [8.72, 3.52], [7.84, 3.52]];
/** The hood: the intake grille's two halves, the number panel, the louvres. */
const INTAKE: ReadonlyArray<readonly [number, number]> = [[-6.72, -5.32], [-5.18, -4.1]];
const INTAKE_Y: readonly [number, number] = [1.88, 2.92];
const PANEL: readonly [number, number] = [-3.62, 2.92];
const LOUVRE_X: readonly [number, number] = [3.63, 6.3];
const LOUVRE_ROWS: ReadonlyArray<readonly [number, number]> = [[1.88, 2.33], [2.56, 3.0]];
/** The radiator housing over the louvres. */
const RADIATOR: RoofBox = { name: "radiator housing", x: [4.25, 6.45], w: [1.3, 1.02], y: [CANT_TOP - 0.02, CROWN + 0.13], mat: "radiator" };

function hoodItems(l: Es319Livery): SideItem[] {
  const out: SideItem[] = [];
  INTAKE.forEach((x, i) => out.push({ kind: "grille", name: `intake ${i + 1}`, x, y: INTAKE_Y, mat: "slat", slats: "v", pitch: 0.085, r: 0.03 }));
  out.push({ kind: "paint", name: "intake frame", x: [-6.82, -4.0], y: [INTAKE_Y[0] - 0.08, INTAKE_Y[1] + 0.62], mat: "lower", layer: 0 });
  if (l.ribbedPanel) out.push({ kind: "grille", name: "number panel", x: [PANEL[0] + 0.25, PANEL[1] - 0.6], y: [1.82, 3.4], mat: "rib", slats: "v", pitch: 0.13, r: 0.02 });
  if (l.louvres) {
    const pitch = (LOUVRE_X[1] - LOUVRE_X[0]) / 5;
    for (const [j, y] of LOUVRE_ROWS.entries())
      for (let i = 0; i < 5; i++) {
        const x0 = LOUVRE_X[0] + i * pitch + 0.04;
        out.push({ kind: "grille", name: `louvre ${j + 1}.${i + 1}`, x: [x0, x0 + pitch - 0.08], y, mat: "slat", slats: "h", pitch: 0.075, r: 0.02 });
      }
  } else out.push({ kind: "grille", name: "radiator grille", x: [LOUVRE_X[0] + 0.3, LOUVRE_X[1]], y: [1.86, 3.4], mat: "rib", slats: "v", pitch: 0.09, r: 0.02 });
  // the radiator housing's mesh sides, seen on the cant over the louvres
  out.push({ kind: "grille", name: "radiator mesh", x: [RADIATOR.x[0] + 0.05, RADIATOR.x[1] - 0.05], y: [CANT - 0.12, CANT_TOP - 0.03], mat: "slat", slats: "v", pitch: 0.1, r: 0.02 });
  // the hood doors' seams
  for (const x of [PANEL[0], -2.6, PANEL[1], 3.45, CAB_END]) out.push({ kind: "paint", name: `seam ${x}`, x: [x - 0.012, x + 0.012], y: [SILL + 0.04, CANT - 0.03], mat: "groove", layer: 2 });
  return out;
}

function spec(l: Es319Livery): LocoSpec {
  const side: Band[] = [[Y0, SILL, "lower"], [SILL, CANT, "hood"], [CANT, CANT_TOP, "yellow"], [CANT_TOP, 4.4, "roofGrey"]];
  const end: Band[] = [[Y0, SILL, "lower"], [SILL, 4.4, "yellow"]];
  const screen = (s: number): EndItem => ({ kind: "window", name: `windscreen ${s > 0 ? "left" : "right"}`, z: s > 0 ? [0.06, 1.24] : [-1.24, -0.06], y: SCREEN, mat: "rubber" });
  const lamp = (s: number): EndItem[] => {
    const nm = s > 0 ? "left" : "right";
    const zs = (a: number, b: number): readonly [number, number] => (s > 0 ? [a, b] : [-b, -a]);
    return [
      { kind: "lamp", name: `marker lamp ${nm}`, z: zs(0.99, 1.15), y: [2.16, 2.32], r: 0.075 },
      { kind: "lamp", name: `indicator ${nm}`, z: zs(1.02, 1.1), y: [2.42, 2.47], rect: true, mat: "lampRed" },
    ];
  };
  return {
    palette: {
      rubber: c("#1f2124", 0.6), rim: c("#a2a6a8", 0.4), slat: c("#43474b", 0.6), louvre: c("#1c1e20", 0.85), groove: c("#2a2c2e", 0.7),
      beam: c("#4a4e52", 0.7), bogie: c("#2f3134", 0.8), steel: c("#55585c", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      tank: c("#3b3e42", 0.7), exhaust: c("#2a2b2d", 0.8), radiator: c("#2b2e31", 0.75), fan: c("#191a1c", 0.8), lampBox: c("#2a2b2e", 0.6), handrail: c("#1d1e20", 0.5),
      logoBlue: c("#22409a", 0.5), white: c("#f1f1ee", 0.5), ink: c("#1d1e20", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side,
    end,
    roof: "roofGrey",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.03,
    bufferHead: "rect",
    frame: { y0: 0.95, y1: Y0 + 0.01, half: 8.95, hw: 1.45, mat: "underframe" },
    bogies: [-1, 1].map((e) => ({ xc: e * BOGIE_X, axles: AXLES.map((a) => e * a), wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    exhausts: [[0.6, 0, CROWN]],
    sideItems: [
      { kind: "paint", name: "cab", x: [CAB_END, sideEnd(SILL)], y: [SILL, CROWN], mat: "yellow", mirror: true, layer: 1,
        poly: [[CAB_END, SILL], [sideEnd(SILL), SILL], ...frontEdge(SILL, CROWN - 0.01).slice(1), [CAB_END, CROWN - 0.01]] as Ring },
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, rails: true, mirror: true },
      ...hoodItems(l),
    ],
    endItems: [
      screen(1), screen(-1),
      ...lamp(1), ...lamp(-1),
      { kind: "lamp", name: "tail lamp", z: [-1.14, -0.98], y: [1.4, 1.56], r: 0.07, mat: "lampRed" },
    ],
    roofItems: [
      RADIATOR,
      ...[-1, 1].map((e): RoofBox => ({ name: `cab roof vents ${e > 0 ? "front" : "rear"}`, x: e > 0 ? [7.4, 8.05] : [-8.05, -7.4], w: [0.3, 0.24], y: [CROWN - 0.02, CROWN + 0.07], mat: "lampBox" })),
    ],
    plough: "beam",
    number: l.number,
  };
}

// --- what the kit does not draw ----------------------------------------------------

/** Text triangles laid on both sides (or on side `only`), centred on x = cx, reading left to right. */
function sideText(m: MeshBuilder, sp: ShellSpec, mat: string, text: string, cx: number, y: number, h: number, style: LetterStyle, d: number, only?: number): void {
  const w = wordWidth(text, h, style);
  for (const sd of [-1, 1].filter((s) => only === undefined || s === only))
    m.scope(sd > 0 ? "right" : "left", () => {
      const at = onSide(sp, sd);
      // the reader's right is +x on the right side (+z), -x on the left
      const tris = letters(text, sd > 0 ? cx - w / 2 : cx + w / 2, y, h, sd < 0, style);
      m.facets(mat, tris.map(([u, v]) => at(u, v, d)), [0, 0, sd]);
    });
}

/** The big class number on the hood and the running number under it. */
function hoodNumbers(m: MeshBuilder, sp: ShellSpec, l: Es319Livery): void {
  m.scope("hood numbers", () => {
    const big: LetterStyle = { width: 0.62, weight: 0.17, gap: 0.14 };
    const h = 1.25, hs = l.kind === "mercancias" ? 0.55 : h;
    const [cls, rest] = l.hoodNumber;
    const wc = wordWidth(cls, h, big), wr = wordWidth(rest, hs, big), gap = 0.1;
    const total = wc + gap + wr, cx = (PANEL[0] + PANEL[1]) / 2 - 0.3;
    // the reader's right is +x on the right side, -x on the left: the class first on each
    for (const sd of [-1, 1]) {
      const at = (dx: number) => cx + sd * (dx - total / 2);
      sideText(m, sp, "numeral", cls, at(wc / 2), 1.95, h, big, 0.016, sd);
      sideText(m, sp, "numeral", rest, at(wc + gap + wr / 2), 1.95, hs, big, 0.016, sd);
      sideText(m, sp, "white", l.number, at(total - 0.4), 1.73, 0.09, { weight: 0.16 }, 0.006, sd);
    }
  });
}

/** The Renfe roundel ("galleta"): a blue disc parted by the yellow double arrow, in (u, v) about (cu, cv). */
function roundel(cu: number, cv: number, r: number): { disc: Ring; bars: Ring[] } {
  const p = (a: number, b: number): [number, number] => [cu + a * r, cv + b * r];
  return {
    disc: ngon(20, r, 0, cu, cv),
    bars: [
      [p(-1.02, 0.08), p(0.55, 0.08), p(0.55, 0.3), p(-1.02, 0.3)],
      [p(-0.55, -0.3), p(1.02, -0.3), p(1.02, -0.08), p(-0.55, -0.08)],
      [p(0.55, 0.42), p(0.55, -0.04), p(0.86, 0.19)],
      [p(-0.55, -0.42), p(-0.86, -0.19), p(-0.55, 0.04)],
    ],
  };
}

/** The roundel on a surface; `flip` mirrors it (the reader's right is -u). */
function layRoundel(m: MeshBuilder, at: (u: number, v: number, d: number) => Vec3, n: Vec3, cu: number, cv: number, r: number, flip: boolean): void {
  const g = roundel(0, 0, r);
  const place = (q: Ring): Ring => { const out: Ring = q.map(([u, v]) => [cu + (flip ? -u : u), cv + v] as [number, number]); return flip ? [...out].reverse() : out; };
  surfaceDecal(m, "logoBlue", at, n, [place(g.disc)], 0.006);
  surfaceDecal(m, "yellow", at, n, g.bars.map(place), 0.009);
}

/** The roundels on the face and the cab sides, "RENFE" under the side ones; Renfe Mercancias' pictogram on the +x cab. */
function logos(m: MeshBuilder, sp: ShellSpec, l: Es319Livery): void {
  m.scope("roundels", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      m.scope(e > 0 ? "front face" : "rear face", () => layRoundel(m, at, [e, 0, 0], 0, 1.98, 0.3, e > 0));
      for (const sd of [-1, 1]) {
        if (l.kind === "mercancias" && e > 0) continue;
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const as = onSide(sp, sd);
          layRoundel(m, as, [0, 0, sd], e * 8.25, 2.3, 0.27, sd < 0);
          const h = 0.11, st = { weight: 0.17 }, w = wordWidth("RENFE", h, st);
          const tris = letters("RENFE", sd > 0 ? e * 8.25 - w / 2 : e * 8.25 + w / 2, 1.86, h, sd < 0, st);
          m.facets("logoBlue", tris.map(([u, v]) => as(u, v, 0.006)), [0, 0, sd]);
        });
      }
    }
  });
  if (l.kind === "mercancias")
    m.scope("mercancias pictogram", () => {
      for (const sd of [-1, 1]) {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const turn = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        // the green square with its pale band, "renfe mercancias" under it
        const x = 8.3, y = 2.32;
        surfaceDecal(m, "mGreen", at, n, [turn([[x - 0.15, y - 0.15], [x + 0.15, y - 0.15], [x + 0.15, y + 0.15], [x - 0.15, y + 0.15]])], 0.006);
        surfaceDecal(m, "mGrey", at, n, [turn([[x - 0.15, y - 0.03], [x + 0.15, y - 0.03], [x + 0.15, y + 0.02], [x - 0.15, y + 0.02]])], 0.009);
        surfaceDecal(m, "mGrey", at, n, [turn([[x - 0.2, 1.98], [x + 0.2, 1.98], [x + 0.2, 2.1], [x - 0.2, 2.1]])], 0.006);
      }
    });
}

/** The running number on the face over a marker lamp. */
function faceNumbers(m: MeshBuilder, sp: ShellSpec, l: Es319Livery): void {
  m.scope("face numbers", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const h = 0.13, st = { weight: 0.15 }, w = wordWidth(l.number, h, st);
        // u is z; seen from ahead the reader's right is -z at the front, +z at the rear
        const cu = e * l.faceNumberSide * 0.62;
        const tris = letters(l.number, e > 0 ? cu + w / 2 : cu - w / 2, 2.57, h, e > 0, st);
        m.facets("ink", tris.map(([u, v]) => at(u, v, 0.006)), [e, 0, 0]);
      });
  });
}

/** The cab side window, its front edge leaning with the face, with the sliding pane's bar. */
function cabWindows(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("cab side windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const place = (q: Ring): Ring => { const r: Ring = q.map(([x, y]) => [e * x, y] as [number, number]); return (e > 0) === (sd > 0) ? r : [...r].reverse(); };
          const inset: Ring = [[7.88, 2.86], [8.77, 2.86], [8.68, 3.48], [7.88, 3.48]];
          m.scope("frame", () => surfacePanel(m, "rubber", at, n, place(CAB_WINDOW), -0.01, 0.014));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, place(inset), -0.005, 0.022));
          m.scope("bar", () => surfacePanel(m, "rubber", at, n, place([[8.27, 2.86], [8.32, 2.86], [8.32, 3.48], [8.27, 3.48]]), 0, 0.03));
        });
  });
}

/** The wipers hanging from the windscreens' heads. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const u = (z: number) => z * s;
          const z0 = 0.66, z1 = 0.52;
          const arm: Ring = [[u(z0 - 0.014), SCREEN[1] - 0.06], [u(z0 + 0.014), SCREEN[1] - 0.06], [u(z1 + 0.014), SCREEN[0] + 0.14], [u(z1 - 0.014), SCREEN[0] + 0.14]];
          surfacePanel(m, "rubber", at, n, s > 0 ? [...arm].reverse() : arm, 0.024, 0.04);
        });
    }
  });
}

/** The grab rail across the face under the windscreens and down its corners. */
function faceRails(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("face grab rails", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const zR = 1.4, y = 2.8, d = 0.06;
      const a = at(-zR, y, d), b = at(zR, y, d);
      tubeX(m, "handrail", 0.018, a[0], a[1], a[2], b[0], b[1], b[2], 6);
      for (const z of [-zR, zR]) {
        const p = at(z, y, d), q = at(z, 1.78, d);
        m.prism("handrail", ngon(6, 0.018, 0, p[0], p[2]), q[1], p[1]);
        for (const yy of [1.78, y]) {
          const r = at(z, yy, 0);
          block(m, "handrail", Math.min(r[0], p[0]) - 0.015, Math.max(r[0], p[0]) + 0.015, yy - 0.015, yy + 0.015, z - 0.015, z + 0.015);
        }
      }
    }
  });
}

/** The twin headlight box standing on the brow, and the horn behind it. */
function headlights(m: MeshBuilder): void {
  m.scope("headlight box", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x1 = N - 0.16, x0 = N - 0.62;
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, "lampBox", ...span(x0, x1), 3.6, 3.97, -0.38, 0.38);
        for (const z of [-0.17, 0.17]) {
          const lens = ngon(12, 0.12, 0, z, 3.785), rim = ngon(12, 0.15, 0, z, 3.785);
          m.sweep("rim", "x", rim, e * x1, rim, e * (x1 + 0.02));
          m.sweep("lampHead", "x", lens, e * (x1 + 0.02), lens, e * (x1 + 0.035));
        }
        const hx = e * (N - 1.0);
        m.scope("horn", () => m.sweep("steel", "x", ngon(8, 0.06, 0, 0.55, CROWN - 0.01), hx - e * 0.2, ngon(8, 0.09, 0, 0.55, CROWN - 0.01), hx + e * 0.15));
      });
  });
}

/** The heavy buffer beam and the grey lower face standing out under the yellow. */
function bufferBeams(m: MeshBuilder): void {
  m.scope("buffer beams", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, "lower", ...span(N - 0.3, BEAM), 0.72, Y0, -1.42, 1.42);
        block(m, "beam", ...span(BEAM, BEAM + 0.04), 0.84, 1.22, -1.4, 1.4);
      });
  });
}

/** The fuel tank and the air box between the bogies, the cab roofs painted yellow. */
function underAndRoofs(m: MeshBuilder): void {
  m.scope("fuel tank", () => {
    const r: Ring = [[-1.18, 0.62], [-1.05, 0.42], [1.05, 0.42], [1.18, 0.62], [1.18, 0.95], [-1.18, 0.95]];
    m.sweep("tank", "x", r, -2.6, r, 0.0);
    block(m, "underframe", 0.15, 1.1, 0.5, 0.95, -1.12, 1.12);
  });
  m.scope("radiator fans", () => {
    for (const x of [4.85, 5.85]) {
      m.cap("fan", ngon(16, 0.42, 0, x, 0), RADIATOR.y[1] + 0.004, true);
      m.cap("radiator", ngon(8, 0.1, 0, x, 0), RADIATOR.y[1] + 0.008, true);
    }
  });
  m.scope("yellow cab roofs", () => {
    for (const e of [-1, 1]) {
      const x0 = lerpTable(TIP, CROWN) + 0.02, x1 = CAB_END, w = lerpTable(HW, CROWN) - 0.01;
      const ring: Ring = [[e * x1, -w], [e * x1, w], [e * x0, w], [e * x0, -w]];
      m.scope(e > 0 ? "front" : "rear", () => m.cap("yellow", e > 0 ? ring : [...ring].reverse(), CROWN + 0.004, true));
    }
  });
}

/** The Renfe 319 in a livery. */
export function renfe319(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    hoodNumbers(m, sp, l);
    logos(m, sp, l);
    faceNumbers(m, sp, l);
    cabWindows(m, sp);
    wipers(m, sp);
    faceRails(m, sp);
    headlights(m);
    bufferBeams(m);
  });
  m.scope("equipment", () => underAndRoofs(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint, with the cab windows. */
export function renfe319Lod(v?: ParamValues): MeshBuilder {
  const s = spec(liveryOf(v));
  // the kit fills 80 of the 100 triangles, the cab paint below takes 20
  const m = boxLocoLod({ ...s, sideItems: [...s.sideItems, { kind: "window", name: "cab window", x: [7.88, 8.75], y: [2.86, 3.48], mirror: true }] }, 80);
  // the yellow cabs, the livery's strongest mark at a distance: their sides and roofs
  m.scope("cab paint", () => {
    const x0 = CAB_END, x1 = N - CHAMFER - 0.02, xr = lerpTable(TIP, CROWN), wr = lerpTable(HW, CROWN), d = 0.012;
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [x0, x1] : [-x1, -x0];
      for (const sd of [-1, 1]) {
        const z = sd * (W + d);
        // under the cab window, and between the door and the window up to the cant
        const q = (u0: number, u1: number, y0: number, y1: number): Vec3[] => [[u0, y0, z], [u1, y0, z], [u1, y1, z], [u0, y0, z], [u1, y1, z], [u0, y1, z]];
        const xw = e * 7.88;
        m.facets("yellow", [...q(a, b, SILL, 2.86), ...(e > 0 ? q(a, xw, 2.86, CANT) : q(xw, b, 2.86, CANT))], [0, 0, sd]);
      }
      const [c0, c1] = e > 0 ? [x0, xr] : [-xr, -x0];
      m.facets("yellow", [[c0, CROWN + d, -wr], [c1, CROWN + d, -wr], [c1, CROWN + d, wr], [c0, CROWN + d, -wr], [c1, CROWN + d, wr], [c0, CROWN + d, wr]], [0, 1, 0]);
    }
  });
  return m;
}
