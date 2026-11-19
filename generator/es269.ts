// The Renfe 269 (proc-vehicle-renfe-269): the "Japonesa", the B'B' 3 kV electric that
// CAF, Westinghouse and Mitsubishi built for Renfe from 1973 to 1985 (265 units, the
// sister of the 279 and 289), on the box locomotive kit (boxLocoKit.ts) with its own
// profile, measured on the reference photographs (assets/renfe-269/SOURCES.md;
// docs/models/spain-trains.md):
//
// - 17.27 m over the buffers, 1.25 m wheels, 88 t (the published figures); the body
//   drawn 3.0 m wide (the published 3.126 m takes in the handrails; the UIC gauge);
// - the side, from two near side-on photographs (269-805 and 269-038, a projective fit
//   over the symmetric layout, the body 16.16 m): from each end the face, the cab
//   window (7.0 - 7.68 m from the centre), the cab door (5.82 - 6.34), a narrow window
//   (4.77 - 5.35), two louvre grilles (2.74 - 4.35, 0.71 - 2.33) and the middle window
//   (+-0.3); the bogies close to the ends (centres +-5.65, 2.3 m wheelbase);
// - the heights, from the head-on 269-352 (about 107 px/m at the face, its width as
//   the scale, the buffers at 1.06 m): the body's sill band 1.27 - 1.57 m, the
//   windscreens 3.06 - 3.56, the face's top 3.72 rounding back as a brow to the roof
//   at 3.80, the four round lamps at 1.91 m (|z| 0.5 and 1.08), the red marker lamps
//   over them at 2.16, the top headlight pod on the brow;
// - the face upright, its corners rounded 0.3 m, the two windscreens wrapping round
//   the corners (269-263 three-quarter) either side of a 0.17 m pillar;
// - two single-arm pantographs over the bogies, the long roof hatch between them, the
//   horn covers on the brow;
// - two liveries: Renfe Taxi (269-038, 269-805: the "traccion" scheme of the 1980s):
//   blue-grey, the cab ends and a strip along the cant yellow, the big white running
//   number on the side, the RENFE roundel under the cab windows, the winged plate on
//   the face; Estrella (269-307 at Barcelona Francia): orange, the face's upper half
//   cream, the side's upper half pale orange, the brown sill, a broad brown band raked
//   at its front ends and a thin brown line under the windows, the yellow roundel on
//   the face, the single big top headlight.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { KIT_PALETTE, c, insulator, kinks, lerpTable, singleArm, onEnd, onSide, roundRect, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { fitLod, lodBogie, lodPantograph, lodRoofBox, lodSideBox, windowBands, type LodBand, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = readonly [number, number];

/** Half the length over the buffers (17.27 m). */
const HALF = 8.635;
/** The face's |x| (upright from the sill to the windscreens), the buffer beam's front. */
const N = 8.08;
const BEAM = 8.1;
/** The body's bottom (the side walls' lower edge), the top of the sill band. */
const Y0 = 1.27;
const SILL = 1.57;
/** The windscreens' foot and head. */
const SCREEN: readonly [number, number] = [3.06, 3.56];
/** The side wall's top, the roof. */
const CANT = 3.56;
const CROWN = 3.8;
/** The body's half width (3.0 m). */
const W = 1.5;

/** The face's centre line [y, |x|], bottom first: upright, the windscreens leaning back a little, the brow rounding over. */
const TIP: Table = [[Y0, N], [3.0, N], [SCREEN[1], N - 0.05], [3.64, N - 0.08], [3.72, N - 0.15], [3.77, N - 0.26], [CROWN, N - 0.42]];
/** The half width [y, hw]: upright walls, the cant rounding to the flat roof. */
const HW: Table = [[Y0, W], [CANT, W], [3.66, W - 0.04], [3.74, W - 0.12], [CROWN, W - 0.3]];
/** The face corners' radius by height. */
const CORNER: Table = [[Y0, 0.22], [2.9, 0.26], [SCREEN[0], 0.3], [SCREEN[1], 0.3], [CROWN, 0.22]];
const BOW = 0.01;
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

// --- the layout (+x half; both sides alike, both ends alike) ---------------------------

const CAB_WINDOW = { x: [7.0, 7.68] as const, y: [2.64, 3.44] as const };
const DOOR = { x: [5.82, 6.34] as const, y: [1.62, 3.38] as const };
const NARROW = { x: [4.77, 5.35] as const, y: [2.6, 3.38] as const };
const MIDDLE = { x: [-0.3, 0.3] as const, y: NARROW.y };
const GRILLES = [[2.74, 4.35], [0.71, 2.33]] as const;
const GRILLE_Y: readonly [number, number] = [2.62, 3.4];
/** The cant strip's foot (the taxi's yellow, the Estrella's orange). */
const CANT_STRIP = 3.47;
/** The bogie centres, half the wheelbase, the wheel radius, the frame's top. */
const BOGIE_X = 5.65;
const HALF_BASE = 1.15;
const WHEEL_R = 0.625;
const FRAME_TOP = 0.98;
/** The pantographs over the bogies, the knees toward the middle. */
const PANTO = { x: 5.75, base: CROWN + 0.1, lower: 1.75, upper: 1.6 } as const;
/** The windscreens' outer edge |z| (round the corner) and the pillar's half width. */
const SCREEN_OUT = 1.46;
const PILLAR = 0.085;

// --- liveries ----------------------------------------------------------------------

interface Es269Livery {
  title: string;
  kind: "taxi" | "estrella";
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  /** The end beam under the face. */
  beam: string;
  number: string;
  /** Extra paint on the sides (front-half items mirrored, or whole-length ones). */
  sidePaint: SideItem[];
  /** The windscreens' and side windows' frames. */
  frame: string;
  /** Each grille in three panels (the taxi's units) or one. */
  splitGrilles: boolean;
  /** The distant model's side bands, and the cab ends' (beyond |x| = x). */
  lodSide: readonly LodBand[];
  lodCab: { x: number; side: readonly LodBand[] };
}

const LIVERIES: Record<string, Es269Livery> = {
  taxi: {
    title: "Renfe Taxi",
    kind: "taxi",
    palette: {
      body: c("#3f5260", 0.5), yellow: c("#ecc21c", 0.45), sill: c("#2b3339", 0.6), roofGrey: c("#5f6468", 0.7),
      navy: c("#22357a"), emblem: c("#b8961a", 0.4), ink: c("#1f2226", 0.6), white: c("#f2f2ee", 0.45),
      pantograph: c("#b3261e", 0.5),
    },
    side: [[Y0, SILL, "sill"], [SILL, CANT_STRIP, "body"], [CANT_STRIP, 4.4, "yellow"]],
    end: [[Y0, SILL, "sill"], [SILL, 4.4, "yellow"]],
    roof: "roofGrey",
    beam: "sill",
    number: "269-038-6",
    sidePaint: [
      { kind: "paint", name: "yellow cab", x: [DOOR.x[1], sideEnd(SILL)], y: [SILL, CANT_STRIP], mat: "yellow", mirror: true, layer: 1,
        poly: [[DOOR.x[1], SILL], ...frontEdge(SILL, CANT_STRIP), [DOOR.x[1], CANT_STRIP]] as Ring },
    ],
    frame: "rubber",
    splitGrilles: true,
    lodSide: [[Y0, SILL, "sill"], [SILL, CANT_STRIP, "body"], [CANT_STRIP, 4.4, "yellow"]],
    lodCab: { x: DOOR.x[1], side: [[Y0, SILL, "sill"], [SILL, 4.4, "yellow"]] },
  },
  estrella: {
    title: "Estrella",
    kind: "estrella",
    palette: {
      orange: c("#d5603a", 0.5), salmon: c("#e3875a", 0.5), cream: c("#e6bd78", 0.5), brown: c("#4e3438", 0.55), roofBrown: c("#4f4642", 0.7),
      yellowLogo: c("#f0c020", 0.45), ink: c("#1f2226", 0.6), silver: c("#c9cccd", 0.4), pantograph: c("#a8352a", 0.55),
    },
    side: [[Y0, SILL, "brown"], [SILL, 2.62, "orange"], [2.62, CANT_STRIP, "salmon"], [CANT_STRIP, 4.4, "orange"]],
    end: [[Y0, 1.42, "orange"], [1.42, 1.58, "brown"], [1.58, 2.53, "orange"], [2.53, 3.64, "cream"], [3.64, 4.4, "orange"]],
    roof: "roofBrown",
    beam: "orange",
    number: "269-307-5",
    sidePaint: [
      // the broad band, raked back at its front ends from the cab window's front edge
      { kind: "paint", name: "broad band", x: [-7.62, 7.62], y: [1.74, 2.31], mat: "brown", layer: 1, poly: [[-7.2, 1.74], [7.2, 1.74], [7.62, 2.31], [-7.62, 2.31]] },
      { kind: "paint", name: "thin band", x: [-7.75, 7.75], y: [2.45, 2.62], mat: "brown", layer: 1 },
    ],
    frame: "silver",
    splitGrilles: false,
    lodSide: [[Y0, SILL, "brown"], [SILL, 1.74, "orange"], [1.74, 2.62, "brown"], [2.62, CANT_STRIP, "salmon"], [CANT_STRIP, 4.4, "orange"]],
    lodCab: { x: 7.45, side: [[Y0, SILL, "brown"], [SILL, 2.62, "orange"], [2.62, CANT_STRIP, "salmon"], [CANT_STRIP, 4.4, "orange"]] },
  },
};

export const ES269_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Es269Livery => LIVERIES[resolveParams(ES269_PARAMS, v).livery!]!;

// --- the spec ------------------------------------------------------------------------

function grilles(): SideItem[] {
  return GRILLES.map(([x0, x1], i): SideItem => ({ kind: "grille", name: `grille ${i + 1}`, x: [x0, x1], y: GRILLE_Y, mat: "slat", slats: "h", pitch: 0.1, r: 0.03, mirror: true }));
}

/** The taxi units' grilles in three panels: two mullions across the slats of each. */
function mullions(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("grille mullions", () => {
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      for (const e of [-1, 1])
        for (const [x0, x1] of GRILLES)
          for (const k of [1, 2]) {
            const x = e * (x0 + ((x1 - x0) * k) / 3);
            surfacePanel(m, "slat", at, [0, 0, sd], [[x - 0.025, GRILLE_Y[0] + 0.02], [x + 0.025, GRILLE_Y[0] + 0.02], [x + 0.025, GRILLE_Y[1] - 0.02], [x - 0.025, GRILLE_Y[1] - 0.02]], -0.003, 0.016);
          }
    }
  });
}

function lampItems(): EndItem[] {
  const out: EndItem[] = [];
  for (const s of [-1, 1]) {
    const nm = s > 0 ? "left" : "right";
    for (const [z, k] of [[0.5, "inner"], [1.08, "outer"]] as const) {
      const zs = (h: number): readonly [number, number] => [s * z - h, s * z + h];
      out.push({ kind: "lamp", name: `${k} lamp ${nm}`, z: zs(0.1), y: [1.81, 2.01], r: 0.1 });
      out.push({ kind: "lamp", name: `${k} marker ${nm}`, z: zs(0.06), y: [2.13, 2.19], rect: true, mat: "lampRed" });
    }
  }
  return out;
}

/** `lod`: the distant model takes the windscreens as the kit's windows (the full model draws them round the corners). */
function spec(l: Es269Livery, lod = false): LocoSpec {
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), slat: c("#5e6367", 0.6), louvre: c("#24272a", 0.85), groove: c("#2a2c2e", 0.7), wiper: c("#2a2c2e", 0.5),
      bogie: c("#2f3134", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6), hatch: c("#55595c", 0.75),
      podBody: c("#2c2d30", 0.6), horn: c("#3a3c3f", 0.6), silver: c("#c9cccd", 0.4),
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
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 1.0, y1: Y0 + 0.01, half: 7.75, hw: 1.38, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    sideItems: [
      ...l.sidePaint,
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, rails: true, mirror: true },
      ...(lod ? [{ kind: "window", name: "cab window", x: CAB_WINDOW.x, y: CAB_WINDOW.y, mirror: true } as const] : []),
      { kind: "window", name: "narrow window", x: NARROW.x, y: NARROW.y, mat: l.frame, r: 0.06, mirror: true },
      { kind: "window", name: "middle window", x: MIDDLE.x, y: MIDDLE.y, mat: l.frame, r: 0.06 },
      ...(lod ? GRILLES.map(([x0, x1], i): SideItem => ({ kind: "window", name: `grille ${i + 1}`, x: [x0, x1], y: GRILLE_Y, mirror: true })) : grilles()),
    ],
    endItems: [
      ...(lod ? [{ kind: "window", name: "windscreen", z: [-1.25, 1.25], y: SCREEN, mat: "rubber" } as const] : []),
      ...lampItems(),
    ],
    roofItems: [
      { name: "roof hatch", x: [-4.75, 4.75], w: [0.8, 0.72], y: [CROWN - 0.01, CROWN + 0.1], mat: "hatch" },
      ...(lod ? [] : [{ name: "main breaker", x: [-1.9, -1.1] as const, w: [0.32, 0.28] as const, y: [CROWN + 0.09, CROWN + 0.42] as const, mat: "breaker" }]),
    ],
    underItems: [[-3.7, -1.3, 0.5, 1.0, 1.2], [-1.0, 1.4, 0.42, 1.0, 1.25], [1.7, 3.7, 0.55, 1.0, 1.1]],
    plough: "underframe",
    number: l.number,
  };
}

// --- what the kit does not draw ----------------------------------------------------

/** Lays reader-space outlines (u to the reader's right, v up) on both sides, d off them, centred on cx. */
function laySide(m: MeshBuilder, sp: ShellSpec, mat: string, polys: readonly Ring[], d: number, cx: number): void {
  for (const sd of [-1, 1]) {
    const at = onSide(sp, sd);
    // the reader's right is +x on the right side (+z), -x on the left: mirrored outlines turn about
    const rings = polys.map((q) => { const r: Ring = q.map(([u, v]) => [sd * (cx + u), v] as [number, number]); return sd > 0 ? r : [...r].reverse(); });
    m.scope(sd > 0 ? "right" : "left", () => surfaceDecal(m, mat, at, [0, 0, sd], rings, d));
  }
}
/** The same at x = +-cx on both sides (a cab item drawn at both ends, reading alike). */
function layCabSides(m: MeshBuilder, sp: ShellSpec, mat: string, polys: readonly Ring[], d: number, cx: number): void {
  for (const e of [-1, 1])
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      const rings = polys.map((q) => { const r: Ring = q.map(([u, v]) => [e * cx + sd * u, v] as [number, number]); return sd > 0 ? r : [...r].reverse(); });
      m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => surfaceDecal(m, mat, at, [0, 0, sd], rings, d));
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

const tri = (pts: ReadonlyArray<readonly [number, number]>): Ring[] => {
  const out: Ring[] = [];
  for (let i = 0; i + 2 < pts.length; i += 3) out.push([[pts[i]![0], pts[i]![1]], [pts[i + 1]![0], pts[i + 1]![1]], [pts[i + 2]![0], pts[i + 2]![1]]]);
  return out;
};

/** Renfe's 1971 roundel: a disc and the two arrows across it, the upper one to the right, the lower one to the left. */
function roundel(cu: number, cv: number, r: number): { disc: Ring[]; arrows: Ring[] } {
  const p = (a: number, b: number): [number, number] => [cu + a * r, cv + b * r];
  const disc = ngon(20, r, 0, cu, cv).map(([a, b]) => [a, b] as [number, number]);
  const arrow = (s: number): Ring[] => {
    const y = s * 0.2;
    const bar: Ring = s > 0 ? [p(-0.72, y - 0.08), p(0.3, y - 0.08), p(0.3, y + 0.08), p(-0.72, y + 0.08)] : [p(-0.3, y - 0.08), p(0.72, y - 0.08), p(0.72, y + 0.08), p(-0.3, y + 0.08)];
    const head: Ring = s > 0 ? [p(0.3, y - 0.24), p(0.74, y), p(0.3, y + 0.24)] : [p(-0.3, y + 0.24), p(-0.74, y), p(-0.3, y - 0.24)];
    return [bar, head];
  };
  return { disc: [disc], arrows: [...arrow(1), ...arrow(-1)] };
}

/** The taxi's markings: the big white number on each side's right half, the roundel and RENFE under the cab windows, the winged plate and the number on the face. */
function taxiMarkings(m: MeshBuilder, sp: ShellSpec, l: Es269Livery): void {
  m.scope("side number", () => {
    const style = { weight: 0.19, width: 0.72 };
    const [cls, serial] = l.number.split("-") as [string, string];
    const h1 = 0.82, h2 = 0.52, v = 1.66;
    const w1 = wordWidth(cls, h1, style);
    const big = letters(cls, 1.4, v, h1, false, style);
    const small = letters(`.${serial}`, 1.4 + w1 + 0.08, v, h2, false, style);
    laySide(m, sp, "white", [...tri(big), ...tri(small)], 0.004, 0);
  });
  m.scope("renfe roundels", () => {
    const cu = (CAB_WINDOW.x[0] + CAB_WINDOW.x[1]) / 2 - 7.34;
    const r = roundel(cu, 2.3, 0.2);
    layCabSides(m, sp, "navy", r.disc, 0.008, 7.34);
    layCabSides(m, sp, "yellow", r.arrows, 0.011, 7.34);
    const h = 0.07, style = { weight: 0.16 };
    layCabSides(m, sp, "navy", tri(letters("RENFE", -wordWidth("RENFE", h, style) / 2, 1.95, h, false, style)), 0.008, 7.34);
  });
  m.scope("winged plate", () => {
    const disc = ngon(16, 0.15, 0, 0, 2.36).map(([a, b]) => [a, b] as [number, number]);
    const wing = (s: number): Ring => (s > 0 ? [[0.14, 2.28], [0.52, 2.36], [0.5, 2.42], [0.14, 2.45]] : [[-0.14, 2.28], [-0.14, 2.45], [-0.5, 2.42], [-0.52, 2.36]]);
    layEnds(m, sp, "emblem", [disc, wing(1), wing(-1)], 0.006);
    const h = 0.1, w = h * 0.5, gap = h * 0.14;
    const width = letteringWidth("269", w, gap);
    layEnds(m, sp, "ink", tri(lettering("269", -width / 2, 2.31, h, w, gap, false)), 0.009);
  });
  faceNumber(m, sp, l, "ink", 0.35, 1.62);
}

/** The Estrella's markings: the yellow roundel on the face, a small one on the band mid-side, the yellow number on the face's sill. */
function estrellaMarkings(m: MeshBuilder, sp: ShellSpec, l: Es269Livery): void {
  m.scope("face roundel", () => {
    const r = roundel(0, 2.1, 0.22);
    layEnds(m, sp, "yellowLogo", r.disc, 0.004);
    layEnds(m, sp, "orange", r.arrows, 0.007);
  });
  m.scope("side roundel", () => {
    const r = roundel(0, 2.02, 0.12);
    laySide(m, sp, "yellowLogo", r.disc, 0.008, 0);
    laySide(m, sp, "brown", r.arrows, 0.011, 0);
  });
  faceNumber(m, sp, l, "yellowLogo", -0.55, 1.45);
}

/** The running number on the face, its first digit at u0 (reader's right +), its foot at v0. */
function faceNumber(m: MeshBuilder, sp: ShellSpec, l: Es269Livery, mat: string, u0: number, v0: number): void {
  m.scope("face numbers", () => {
    const h = 0.1, w = h * 0.45, gap = h * 0.14;
    layEnds(m, sp, mat, tri(lettering(l.number, u0, v0, h, w, gap, false)), 0.006);
  });
}

/** The cab side window behind the face's corner, framed, a sliding pane's upright. */
function cabWindows(m: MeshBuilder, sp: ShellSpec, l: Es269Livery): void {
  m.scope("cab side windows", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          const place = (q: Ring): Ring => { const r: Ring = q.map(([x, y]) => [e * x, y] as [number, number]); return e > 0 ? r : [...r].reverse(); };
          const [x0, x1] = CAB_WINDOW.x, [y0, y1] = CAB_WINDOW.y;
          m.scope("frame", () => surfacePanel(m, l.frame, at, n, place(roundRect(x0, x1, y0, y1, 0.08)), -0.01, 0.014));
          m.scope("glass", () => surfacePanel(m, "glass", at, n, place(roundRect(x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, 0.05)), -0.005, 0.022));
          const mid = (x0 + x1) / 2;
          m.scope("upright", () => surfacePanel(m, l.frame, at, n, place([[mid - 0.015, y0 + 0.04], [mid + 0.015, y0 + 0.04], [mid + 0.015, y1 - 0.04], [mid - 0.015, y1 - 0.04]]), 0.0, 0.03));
        });
  });
}

/** The windscreens: two panes either side of the pillar, each wrapping round its corner, framed. */
function windscreens(m: MeshBuilder, sp: ShellSpec, l: Es269Livery): void {
  const [y0, y1] = SCREEN;
  const vB = [...new Set([...TIP, ...HW, ...CORNER].map(([y]) => y))].sort((a, b) => a - b);
  const uB = [...new Set([y0, (y0 + y1) / 2, y1].flatMap((h) => sp.endPlan(h).map(([z]) => z)).flatMap((z) => [z, -z]))].sort((a, b) => a - b);
  m.scope("windscreens", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        for (const s of [-1, 1])
          m.scope(s > 0 ? "left pane" : "right pane", () => {
            const pane = (k: number, r: number): Ring => {
              const q = roundRect(PILLAR + k, SCREEN_OUT - k, y0 + k, y1 - k, r);
              return s > 0 ? q : q.map(([z, y]) => [-z, y] as [number, number]).reverse();
            };
            m.scope("frame", () => surfacePanel(m, l.frame, at, n, pane(0, 0.08), -0.01, 0.014, uB, vB));
            m.scope("glass", () => surfacePanel(m, "glass", at, n, pane(0.06, 0.05), -0.005, 0.022, uB, vB));
          });
      });
  });
}

/** The wipers parked upright at the panes' inner edges. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const z0 = s * 0.3, z1 = s * 0.42;
          const arm: Ring = [[z0 - 0.012, SCREEN[0] + 0.08], [z0 + 0.012, SCREEN[0] + 0.08], [z1 + 0.012, SCREEN[1] - 0.12], [z1 - 0.012, SCREEN[1] - 0.12]];
          surfacePanel(m, "wiper", at, n, arm, 0.024, 0.04);
        });
    }
  });
}

/** The end beam under the face, flush with it, carrying the buffers. */
function endBeams(m: MeshBuilder, l: Es269Livery): void {
  m.scope("end beams", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, l.beam, ...span(N - 0.4, N), 0.72, Y0 - 0.004, -1.42, 1.42);
      });
  });
}

/** The top headlight on the brow (twin lamps in a box on the taxi, one big lamp in a drum on the Estrella) and the horn covers either side. */
function brow(m: MeshBuilder, l: Es269Livery): void {
  m.scope("top headlight", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        if (l.kind === "taxi") {
          block(m, "yellow", ...span(N - 0.5, N - 0.06), 3.7, 4.0, -0.24, 0.24);
          for (const z of [-0.11, 0.11]) {
            const rim = ngon(12, 0.095, 0, z, 3.85), lens = ngon(12, 0.075, 0, z, 3.85);
            const [a, b] = span(N - 0.06, N - 0.04), [c0, c1] = span(N - 0.04, N - 0.03);
            m.sweep("rim", "x", rim, a, rim, b);
            m.sweep("lampHead", "x", lens, c0, lens, c1);
          }
        } else {
          const drum = ngon(16, 0.19, 0, 0, 3.9);
          const [a, b] = span(N - 0.55, N - 0.05);
          m.sweep("podBody", "x", drum, a, drum, b);
          const lens = ngon(16, 0.12, 0, 0, 3.9), [c0, c1] = span(N - 0.05, N - 0.03);
          m.sweep("lampHead", "x", lens, c0, lens, c1);
        }
      });
  });
  m.scope("horn covers", () => {
    for (const e of [-1, 1])
      for (const z of [-0.52, 0.52])
        m.scope(`${e > 0 ? "front" : "rear"} ${z > 0 ? "right" : "left"}`, () => {
          const [a, b] = e > 0 ? [N - 0.68, N - 0.44] : [-(N - 0.44), -(N - 0.68)];
          // a ridge: the kit's roof-box ring (meshCore's winding), its top narrowed to a line
          const ring = (w: number): Ring => [[b, z + w], [b, z - w], [a, z - w], [a, z + w]];
          m.loft("horn", ring(0.1), CROWN - 0.02, ring(0.008), CROWN + 0.17);
        });
  });
}

/** The roof line: a busbar on post insulators along the hatch between the pantographs. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.42, z = 0.55;
  m.scope("roof line", () => {
    for (const x of [-4.5, -2.6, 2.6, 4.5]) insulator(m, x, z, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -(PANTO.x - 0.6), y, z, PANTO.x - 0.6, y, z, 6);
  });
}

/** The Renfe 269 in a livery. */
export function renfe269(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    if (l.kind === "taxi") taxiMarkings(m, sp, l);
    else estrellaMarkings(m, sp, l);
    if (l.splitGrilles) mullions(m, sp);
    cabWindows(m, sp, l);
    windscreens(m, sp, l);
    wipers(m, sp);
    endBeams(m, l);
  });
  m.scope("roof equipment", () => {
    // the kit's pantographs stand the other way about: the 269's hinges lie toward the ends, the knees toward the middle
    m.scope("pantographs", () => {
      for (const e of [-1, 1])
        m.scope(e > 0 ? "front pantograph" : "rear pantograph", () =>
          singleArm(m, { xc: e * PANTO.x, roofY: CROWN, baseY: PANTO.base, h: e, raised: e < 0, lower: PANTO.lower, upper: PANTO.upper }));
    });
    brow(m, l);
    roofLine(m);
  });
  return m;
}

/**
 * The distant model on the shared kit (lodKit.ts), as boxLocoLod draws a box locomotive but with
 * the 269's own paint: the cab ends in their own side bands (the taxi's yellow ends, the Estrella's
 * band stopping short of the cabs), the windows and grilles as dark panes, the pantographs' knees
 * toward the middle.
 */
export function renfe269Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l, true);
  const hw = (y: number) => lerpTable(HW, y);
  const setback = kinks(TIP, HW).filter((y) => y >= Y0).map((y) => { const plan = endPlan(y, hw(y)); return [y, plan[plan.length - 1]![1]] as const; });
  const sideRects = s.sideItems.filter((i) => i.kind === "window").map((i) => ({ u: i.x, y: i.y, mirror: i.mirror }));
  const sideWindows = sideRects.flatMap((r) => windowBands([r], 0).map((w) => ({ ...w, mirror: r.mirror, optional: (r.u[1] - r.u[0]) * (r.y[1] - r.y[0]) })));
  const shell: LodShell = {
    y0: Y0, tip: TIP, hw: HW, setback,
    side: l.lodSide, end: l.end, roof: l.roof, cab: l.lodCab,
    sideWindows, endWindows: windowBands([{ u: [-SCREEN_OUT + 0.15, SCREEN_OUT - 0.15], y: SCREEN }], 0.4),
  };
  const parts: LodPart[] = [
    { optional: 40, draw: (m) => m.scope("frame", () => lodSideBox(m, "underframe", [[-7.75, 1.0], [7.75, 1.0], [7.75, Y0], [-7.75, Y0]], -1.38, 1.38)) },
    { optional: 45, draw: (m) => m.scope("end beams", () => { for (const e of [-1, 1]) { const [x0, x1] = e > 0 ? [N - 0.4, N] : [-N, -(N - 0.4)]; lodSideBox(m, l.beam, [[x0, 0.72], [x1, 0.72], [x1, Y0], [x0, Y0]], -1.42, 1.42); } }) },
    { draw: (m) => m.scope("running gear", () => { for (const xc of [-BOGIE_X, BOGIE_X]) lodBogie(m, xc, HALF_BASE + WHEEL_R + 0.2, 1.0); }) },
    { optional: 50, draw: (m) => m.scope("equipment", () => lodSideBox(m, "underframe", [[-3.7, 0.45], [3.7, 0.45], [3.7, 1.0], [-3.7, 1.0]], -1.2, 1.2)) },
    { draw: (m) => m.scope("roof hatch", () => lodRoofBox(m, "hatch", -4.75, 4.75, 0.8, 0.72, CROWN - 0.01, CROWN + 0.1)) },
    { draw: (m) => m.scope("raised pantograph", () => lodPantograph(m, { x: -PANTO.x, roofY: CROWN, baseY: PANTO.base, h: -1, raised: true, lower: PANTO.lower, upper: PANTO.upper })) },
    { optional: 0, draw: (m) => m.scope("folded pantograph", () => lodPantograph(m, { x: PANTO.x, roofY: CROWN, baseY: PANTO.base, h: 1, raised: false })) },
  ];
  return fitLod({ palette: { ...KIT_PALETTE, ...s.palette }, shells: [shell], parts }, 100);
}
