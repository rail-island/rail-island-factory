// The NS 1600 / 1700 (proc-vehicle-ns-1700): Alsthom's B'B' of the BB 7200
// "nez casse" family as built for the Dutch railways (1600 1981 - 1983, 1700
// 1991 - 1994), on the box locomotive kit (boxLocoKit.ts) with its own profile,
// measured on the reference photographs (assets/ns-1700/SOURCES.md; the
// side-on DB Cargo 1616 at 69 px/m, the head-on 1752 at 111 px/m, the
// three-quarter views of 1723 and 1768; docs/models/netherlands-trains.md):
//
// - 17.64 m over the buffers, 3.047 m wide, bogie centres 9.694 m, 2.8 m
//   wheelbase, 1.25 m wheels (the published figures);
// - the broken nose: the lower nose standing 0.57 m ahead of the cab front,
//   upright from its foot (1.61 m) with its top rounded off at 2.8 m into an
//   almost flat top; the windscreen above leaning forward about 7 degrees to
//   the roof's edge; the nose's sides flush with the body's, the seam where the
//   nose meets the cab drawn on the side;
// - the grey headstock under the nose with its ribbed edge, the buffers with
//   rectangular heads and the screw coupling;
// - on the nose: the top headlight, a dark housing each side with a white lamp
//   outboard and a red one inboard, the number plate between them, the small
//   amber markers on the corners; a handrail along the windscreens' foot;
// - the side: the cab door with its window and handrails, the long dark filter
//   grille between the doors (9.1 m), no machine-room windows;
// - the roof: the louvred box over each cab, the brake resistor housing near
//   the middle, the single-arm pantographs with their hinges toward the cabs
//   (knees inward), the rear one raised; the monomotor bogies, one motor each;
// - liveries: NS yellow with the dark grey cab band round the windscreens and
//   onto the cab sides, the yellow line at the roof's edge, the grey skirt and
//   headstock, the NS logo behind each cab door and the big number under the
//   grille's end (1768); and DB Cargo Nederland's traffic red (the 1600s from
//   2012; key `railion`), the grey skirt, the DB emblem in the middle (1616).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, surfaceDecal, lerpTable, onEnd, onSide, rect, roundRect, singleArm, surfacePanel, sweepZ, type ShellSpec } from "./czElectricKit.ts";
import { coil, lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** Half the length over the buffers (17.64 m). */
const HALF = 8.82;
/** The headstock's face under the nose, the nose's front and the cab front at the windscreen's foot, |x|. */
const BEAM = 8.3;
const NOSE = 8.4;
const CAB = 7.8;
/** The body's bottom: the grey skirt's lower edge. */
const Y0 = 1.18;
/** The nose's foot (the paint's grey/body boundary along the whole side) and where its top meets the cab front. */
const FOOT = 1.64;
const CAB_FOOT = 2.83;
/** The windscreens' sill and head; the dark cab band's top (the eave's lip); the side wall's top; the crown. */
const SCREEN: readonly [number, number] = [2.93, 3.5];
const BAND_TOP = 3.58;
const WALL_TOP = 3.7;
const CROWN = 4.0;
/** The body's half width: 3.0 m, 47 mm under the published 3.047 m so the handrails keep the 3.1 m gauge. */
const W = 1.5;

/**
 * The end's centre line [y, |x|], bottom first, measured on 1616's side (69 px/m): the
 * headstock, the nose upright to 2.43 m and rounding over to its sloping top, which
 * meets the cab front 0.6 m back at 2.83 m; the cab front leaning out 14 degrees to
 * the eave's lip at 3.6 m; the roof falling back to the crown.
 */
const TIP: Table = [
  [Y0, BEAM], [FOOT - 0.04, BEAM], [FOOT, NOSE], [2.43, NOSE + 0.01], [2.58, NOSE - 0.08], [2.68, NOSE - 0.2], [2.75, NOSE - 0.31],
  [CAB_FOOT, CAB], [3.57, CAB + 0.14], [3.62, CAB + 0.17], [3.67, CAB + 0.15], [3.77, CAB + 0.08], [3.88, CAB], [CROWN, CAB - 0.1],
];
/** The half width: upright walls, the roof's rounded edge. */
const HW: Table = [[Y0, W], [3.64, W], [WALL_TOP, W - 0.03], [3.8, W - 0.12], [3.92, W - 0.32], [CROWN, W - 0.55]];
/** The corner's radius in plan by height: the nose's round corners, the cab front's tighter ones. */
const CORNER: Table = [[Y0, 0.3], [2.75, 0.3], [CAB_FOOT, 0.14], [3.62, 0.14], [3.8, 0.2], [CROWN, 0.3]];
/** The distant model's coarser profile: the same nose, cab front and roof with fewer rows. */
const LOD_TIP: Table = [[Y0, BEAM], [FOOT - 0.04, BEAM], [FOOT, NOSE], [2.5, NOSE], [2.75, NOSE - 0.31], [CAB_FOOT, CAB], [3.62, CAB + 0.17], [CROWN, CAB - 0.1]];
const LOD_HW: Table = [[Y0, W], [3.64, W], [CROWN, W - 0.55]];
const BOW = 0.015;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the end at height y (the paint along the cab side stops there). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;

// --- liveries ----------------------------------------------------------------------

interface Ns1700Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  number: string;
  /** NS: the dark cab band onto the sides, the NS logos and the big side number; DB: the emblem. */
  ns: boolean;
}

const GREY = c("#53575b", 0.6);
const ROOF = c("#5d6165", 0.75);

const LIVERIES: Record<string, Ns1700Livery> = {
  yellowGrey: {
    title: "NS yellow, grey",
    palette: { body: c("#f9c21b"), skirt: GREY, cabBand: c("#3d4144", 0.6), roofGrey: ROOF, ink: c("#2c2e31", 0.6), plateField: c("#f9c21b") },
    side: [[Y0, FOOT, "skirt"], [FOOT, WALL_TOP, "body"], [WALL_TOP, 4.3, "roofGrey"]],
    end: [[Y0, FOOT, "skirt"], [FOOT, CAB_FOOT, "body"], [CAB_FOOT, BAND_TOP, "cabBand"], [BAND_TOP, WALL_TOP, "body"], [WALL_TOP, 4.3, "roofGrey"]],
    number: "1768",
    ns: true,
  },
  railion: {
    title: "Railion red",
    palette: { body: c("#d42a2c"), skirt: c("#6c7175", 0.6), roofGrey: ROOF, ink: c("#2c2e31", 0.6), plateField: c("#d42a2c"), emblem: c("#f1f1ef") },
    side: [[Y0, FOOT, "skirt"], [FOOT, WALL_TOP, "body"], [WALL_TOP, 4.3, "roofGrey"]],
    end: [[Y0, FOOT, "skirt"], [FOOT, WALL_TOP, "body"], [WALL_TOP, 4.3, "roofGrey"]],
    number: "1616",
    ns: false,
  },
};

export const NS1700_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Ns1700Livery => LIVERIES[resolveParams(NS1700_PARAMS, v).livery!]!;

// --- the spec ----------------------------------------------------------------------

/** The single-arm pantographs: base centre |x|, base height, arm lengths (measured on 1616's raised one). */
const PANTO = { x: 4.25, base: 4.17, lower: 1.6, upper: 1.45 } as const;
/** The bogies' centres and half wheelbase, the wheels' radius. */
const BOGIE_X = 4.847;
const HALF_BASE = 1.4;
const WHEEL_R = 0.625;
const FRAME_TOP = 0.92;
/** The filter grille between the cab doors, the cab door. */
const GRILLE: { x: readonly [number, number]; y: readonly [number, number] } = { x: [-4.54, 4.54], y: [2.47, 3.52] };
const DOOR = { x: [6.33, 6.84] as const, y: [FOOT + 0.03, 3.52] as const };

function spec(l: Ns1700Livery, lod = false): LocoSpec {
  const cabBand: SideItem[] = l.ns
    ? [{ kind: "paint", name: "cab band", x: [DOOR.x[1] + 0.04, sideEnd(BAND_TOP)], y: [CAB_FOOT, BAND_TOP], mat: "cabBand", mirror: true, layer: 1,
        poly: [[DOOR.x[1] + 0.04, CAB_FOOT], [sideEnd(CAB_FOOT), CAB_FOOT], [sideEnd(BAND_TOP), BAND_TOP], [DOOR.x[1] + 0.04, BAND_TOP]] }]
    : [];
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), groove: c("#2a2c2e", 0.7), housing: c("#2b2d30", 0.6), amber: c("#f0a020", 0.35),
      louvre: c("#25282b", 0.85), slat: c("#3a3e42", 0.7), headstock: GREY, roofBox: ROOF, wiper: c("#2a2c2e", 0.5),
      bogie: c("#2f3134", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip: lod ? LOD_TIP : TIP,
    hw: lod ? LOD_HW : HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roofGrey",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.86, y1: Y0, half: 7.7, hw: 1.38, mat: "underframe" },
    bogies: lod ? [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })) : [],
    // the full model draws its pantographs and bogies itself; the distant model takes the kit's
    ...(lod ? { pantograph: { kind: "singleArm" as const, x: PANTO.x, roofY: CROWN, baseY: PANTO.base, lower: PANTO.lower, upper: PANTO.upper } } : {}),
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, win: [2.94, 3.49], rails: true, mirror: true },
      ...cabBand,
      { kind: "paint", name: "nose seam", x: [CAB - 0.01, CAB + 0.02], y: [FOOT + 0.01, 2.6], mat: "groove", mirror: true, layer: 1 },
      { kind: "paint", name: "grille frame", x: [GRILLE.x[0] - 0.04, GRILLE.x[1] + 0.04], y: [GRILLE.y[0] - 0.04, GRILLE.y[1] + 0.04], mat: "rim", r: 0.05, layer: 1 },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.2, 1.3], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.3, -0.2], y: SCREEN, mat: "rubber" },
      { kind: "paint", name: "train number box", z: [-0.12, 0.12], y: [3.28, 3.47], mat: "rubber", layer: 1 },
      { kind: "paint", name: "lamp housing left", z: [0.36, 0.98], y: [1.69, 2.03], mat: "housing", layer: 1, poly: roundRect(0.36, 0.98, 1.69, 2.03, 0.1) },
      { kind: "paint", name: "lamp housing right", z: [-0.98, -0.36], y: [1.69, 2.03], mat: "housing", layer: 1, poly: roundRect(-0.98, -0.36, 1.69, 2.03, 0.1) },
      { kind: "lamp", name: "headlight left", z: [0.73, 0.93], y: [1.76, 1.96], r: 0.1 },
      { kind: "lamp", name: "tail lamp left", z: [0.44, 0.64], y: [1.76, 1.96], r: 0.1, mat: "lampRed" },
      { kind: "lamp", name: "headlight right", z: [-0.93, -0.73], y: [1.76, 1.96], r: 0.1 },
      { kind: "lamp", name: "tail lamp right", z: [-0.64, -0.44], y: [1.76, 1.96], r: 0.1, mat: "lampRed" },
      { kind: "lamp", name: "marker left", z: [1.17, 1.29], y: [1.76, 1.92], rect: true, mat: "amber" },
      { kind: "lamp", name: "marker right", z: [-1.29, -1.17], y: [1.76, 1.92], rect: true, mat: "amber" },
    ],
    // the distant model keeps only the resistor housing (its budget goes to the profile and the bands)
    roofItems: [
      ...(lod ? [] : [
        { name: "cab roof box front", x: [6.62, 7.34], w: [0.76, 0.72], y: [CROWN - 0.02, 4.2], mat: "roofBox" } as const,
        { name: "cab roof box rear", x: [-7.34, -6.62], w: [0.76, 0.72], y: [CROWN - 0.02, 4.2], mat: "roofBox" } as const,
      ]),
      { name: "resistor housing", x: [-1.8, 2.5], w: [0.74, 0.7], y: [CROWN - 0.02, 4.4], mat: "roofBox" },
    ],
    ...(lod ? {} : { underItems: [[-0.85, 0.85, 0.62, 0.86, 1.0], [-2.4, -1.2, 0.6, 0.86, 0.3], [1.2, 2.4, 0.6, 0.86, 0.3]] as const }),
    number: l.number,
  };
}

// --- what the kit does not draw -----------------------------------------------------

/** A stroke along a (u, v) polyline, `t` wide, as convex quads mitred at the joints. */
function strokeQuads(pts: ReadonlyArray<readonly [number, number]>, t: number): Ring[] {
  const n = pts.length;
  const normal = (a: readonly [number, number], b: readonly [number, number]) => {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return [-dy / l, dx / l] as const;
  };
  const off = pts.map((p, i) => {
    const n0 = i > 0 ? normal(pts[i - 1]!, p) : normal(p, pts[i + 1]!);
    const n1 = i < n - 1 ? normal(p, pts[i + 1]!) : n0;
    const mx = n0[0] + n1[0], my = n0[1] + n1[1], ml = Math.hypot(mx, my);
    const k = (t / 2) / Math.max(0.35, (mx * n1[0] + my * n1[1]) / ml);
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
 * The NS logo (two arrows inside a flattened hexagon), as two strokes turned
 * 180 degrees about its centre: traced on 1768's side, 1.2 m wide, 0.7 m high.
 */
const LOGO_W = 1.2, LOGO_H = 0.7;
function nsLogoStrokes(): Ring[][] {
  // traced in photo pixels (x right, y down), the logo's box 737 - 826 by 275 - 353
  const px: Array<[number, number]> = [[807, 278], [826, 313], [791, 313], [771, 278], [757, 278], [738, 313]];
  const map = ([x, y]: readonly [number, number]): [number, number] => [((x - 781.5) / 89) * LOGO_W, ((313 - y) / 78) * LOGO_H];
  const a = px.map(map);
  const b = a.map(([u, v]): [number, number] => [-u, -v]);
  return [strokeQuads(a, 0.085), strokeQuads(b, 0.085)];
}

/** The NS logo behind each cab door, both sides; the big number under the grille's end (one end a side, as photographed). */
function nsMarkings(m: MeshBuilder, sp: ShellSpec, l: Ns1700Livery): void {
  const strokes = nsLogoStrokes();
  const LOGO_X = 5.42, LOGO_Y = 3.24;
  m.scope("ns logos", () => {
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          const n: Vec3 = [0, 0, sd];
          // the reader's right is +x on the right side (+z), -x on the left
          for (const [k, quads] of strokes.entries())
            for (const q of quads) {
              const ring: Ring = q.map(([u, v]) => [e * LOGO_X + sd * u, LOGO_Y + v] as [number, number]);
              surfacePanel(m, "ink", at, n, sd > 0 ? ring : [...ring].reverse(), 0.004 + 0.002 * k, 0.006 + 0.002 * k);
            }
        });
  });
  const h = 0.48, w = h * 0.45, gap = h * 0.14;
  const width = letteringWidth(l.number, w, gap);
  m.scope("side numbers", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        // under the grille's end on the reader's left: -x on the right side, +x on the left
        const u = -sd * (GRILLE.x[1] - width / 2 - 0.02);
        const tris = lettering(l.number, sd > 0 ? u - width / 2 : u + width / 2, 2.13 - h / 2, h, w, gap, sd < 0);
        m.facets("ink", tris.map(([a, b]) => at(a, b, 0.006)), [0, 0, sd]);
      });
  });
}

/** DB Cargo's emblem in the middle of each side: a white frame, the red field, white letters. */
function dbEmblems(m: MeshBuilder, sp: ShellSpec): void {
  const [ew, eh, cy] = [0.44, 0.32, 2.1];
  m.scope("db emblems", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const t = eh * 0.12;
        surfacePanel(m, "emblem", at, n, roundRect(-ew / 2, ew / 2, cy - eh / 2, cy + eh / 2, eh * 0.18), 0.003, 0.005);
        surfacePanel(m, "body", at, n, roundRect(-ew / 2 + t, ew / 2 - t, cy - eh / 2 + t, cy + eh / 2 - t, eh * 0.12), 0.005, 0.007);
        const lh = eh * 0.56, lw = wordWidth("DB", lh, { weight: 0.2 });
        const tris = letters("DB", sd > 0 ? -lw / 2 : lw / 2, cy - lh / 2, lh, sd < 0, { weight: 0.2 });
        m.facets("emblem", tris.map(([u, v]) => at(u, v, 0.0085)), n);
      });
  });
}

/** The running number on the grey skirt in small white figures, both sides. */
function skirtNumbers(m: MeshBuilder, sp: ShellSpec, l: Ns1700Livery): void {
  m.scope("skirt numbers", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const h = 0.08, w = h * 0.45, gap = h * 0.14, txt = `91 84 1 ${l.number}`;
        const width = letteringWidth(txt, w, gap);
        const u = -sd * 2.6;
        const tris = lettering(txt, sd > 0 ? u - width / 2 : u + width / 2, 1.36, h, w, gap, sd < 0);
        m.facets("white", tris.map(([a, b]) => at(a, b, 0.004)), [0, 0, sd]);
      });
  });
}

/** The number plate on the nose: a dark border, the field in the body colour, dark figures. */
function frontPlates(m: MeshBuilder, sp: ShellSpec, l: Ns1700Livery): void {
  m.scope("number plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        surfacePanel(m, "ink", at, n, rect(-0.32, 1.7, 0.32, 1.9), -0.01, 0.02);
        surfacePanel(m, "plateField", at, n, rect(-0.3, 1.72, 0.3, 1.88), 0.0, 0.026);
        const h = 0.11, w = h * 0.45, gap = h * 0.16;
        const width = letteringWidth(l.number, w, gap);
        const tris = lettering(l.number, e > 0 ? width / 2 : -width / 2, 1.8 - h / 2, h, w, gap, e > 0);
        m.facets("ink", tris.map(([a, b]) => at(a, b, 0.03)), n);
      });
  });
}

/** The top headlight in its round housing standing out of the nose, in the body colour. */
function topLamps(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("top headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        const cy = 2.53;
        surfacePanel(m, "body", at, n, ngon(12, 0.15, 0, 0, cy), -0.01, 0.06);
        surfacePanel(m, "rim", at, n, ngon(12, 0.115, 0, 0, cy), 0.05, 0.075);
        surfacePanel(m, "lampHead", at, n, ngon(12, 0.095, 0, 0, cy), 0.06, 0.085);
      });
  });
}

/** The wipers parked on the windscreens, pivoted at the top inner corner, hanging to the outer foot. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const u = (z: number) => (e > 0 ? -z : z) * s;
          const [z0, z1, y0, y1] = [0.42, 1.05, SCREEN[1] - 0.08, SCREEN[0] + 0.14];
          const arm: Ring = [[u(z0 - 0.015), y0], [u(z0 + 0.015), y0 + 0.02], [u(z1 + 0.015), y1 + 0.02], [u(z1 - 0.015), y1]];
          const ring = (e > 0) === (s > 0) ? arm : [...arm].reverse();
          surfacePanel(m, "wiper", at, n, ring as Ring, 0.024, 0.04);
        });
    }
  });
}

/** The handrail along the windscreens' foot and the short one on each cab side over the nose. */
function handrails(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("handrails", () => {
    const y = CAB_FOOT + 0.07;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = e * (lerpTable(TIP, y) + 0.07);
        tubeX(m, "rim", 0.018, x, y, -1.22, x, y, 1.22, 6);
        for (const z of [-1.2, -0.4, 0.4, 1.2]) block(m, "steel", Math.min(x, e * (CAB - 0.02)), Math.max(x, e * (CAB - 0.02)), y - 0.015, y + 0.015, z - 0.012, z + 0.012);
      });
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const yy = 2.88, z = sd * (sp.hw(yy) + 0.035);
          tubeX(m, "rim", 0.015, e * 7.06, yy, z, e * 7.59, yy, z, 6);
          for (const x of [7.08, 7.57]) block(m, "steel", e * x - 0.012, e * x + 0.012, yy - 0.012, yy + 0.012, ...side(sd, sp.hw(yy) - 0.01, sp.hw(yy) + 0.04));
        });
  });
}

/** The grey headstock under each nose, down to the buffers' foot, carrying them and the coupling. */
function headstocks(m: MeshBuilder): void {
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [7.68, BEAM - 0.005] : [-BEAM + 0.005, -7.68];
        block(m, "headstock", a, b, 0.78, Y0 + 0.01, -1.42, 1.42);
      });
  });
}

/** The ribbed anti-climber along the nose's foot over the headstock. */
function antiClimbers(m: MeshBuilder): void {
  m.scope("anti-climbers", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [BEAM - 0.02, NOSE + 0.04] : [-NOSE - 0.04, -BEAM + 0.02];
        block(m, "headstock", a, b, FOOT - 0.07, FOOT - 0.035, -1.3, 1.3);
        for (const z of [-1.1, -0.66, -0.22, 0.22, 0.66, 1.1]) block(m, "groove", a + 0.01, b - 0.01, FOOT - 0.035, FOOT - 0.02, z - 0.012, z + 0.012);
      });
  });
}

/** The louvres on the roof boxes: the cab boxes' outer faces, the resistor housing's sides. */
function roofLouvres(m: MeshBuilder): void {
  m.scope("roof louvres", () => {
    for (const e of [-1, 1])
      m.scope(`cab box ${e > 0 ? "front" : "rear"}`, () => {
        const x = e * 7.34;
        const span = (a: number, b: number): [number, number] => (e > 0 ? [x + a, x + b] : [x - b, x - a]);
        block(m, "louvre", ...span(-0.01, 0.012), 4.02, 4.17, -0.6, 0.6);
        for (const y of [4.05, 4.09, 4.13]) block(m, "slat", ...span(0.005, 0.024), y, y + 0.012, -0.58, 0.58);
      });
    for (const sd of [-1, 1])
      m.scope(`resistor ${sd > 0 ? "right" : "left"}`, () => {
        for (let i = 0; i < 5; i++) {
          const x0 = -1.72 + i * 0.84, x1 = x0 + 0.76;
          const zb = (y: number) => 0.74 - (0.04 * (y - (CROWN - 0.02))) / 0.42;
          block(m, "louvre", x0, x1, 4.04, 4.32, ...side(sd, zb(4.32) - 0.01, zb(4.04) + 0.006));
          for (const y of [4.08, 4.14, 4.2, 4.26]) block(m, "slat", x0 + 0.03, x1 - 0.03, y, y + 0.015, ...side(sd, zb(y) - 0.01, zb(y) + 0.02));
        }
      });
  });
}

/** The two single-arm pantographs, their hinges toward the cabs and their knees inward; the rear raised. */
function pantographs(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () =>
        singleArm(m, { xc: e * PANTO.x, roofY: CROWN, baseY: PANTO.base, h: e, raised: e < 0, lower: PANTO.lower, upper: PANTO.upper }));
  });
}

/** The roof line: from each pantograph on two insulators toward the resistor housing, the main breaker. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.36;
  m.scope("roof line", () => {
    for (const e of [-1, 1]) {
      for (const x of [3.0, 3.5]) insulator(m, e * x, 0.3, CROWN - 0.01, y - 0.02);
      tubeX(m, "copper", 0.018, e * 2.95, y, 0.3, e * (PANTO.x - 0.55), y, 0.3, 6);
    }
  });
}

/** Alsthom's monomotor bogie: two wheelsets, axle boxes on coils, one motor across the middle. */
function monomotorBogie(m: MeshBuilder, xc: number): void {
  m.bogie(() => {
    const R = WHEEL_R, ft = FRAME_TOP, hb = HALF_BASE, N = 20;
    const ay = R * Math.cos(Math.PI / N);
    for (const dx of [-hb, hb])
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -1.0, axle, 1.0);
        for (const s of [-1, 1]) {
          sweepZ(m, "steel", ngon(N, R, Math.PI / N, x, ay), side(s, 0.665, 0.8));
          sweepZ(m, "wheel", ngon(16, R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
          sweepZ(m, "steel", ngon(8, 0.14, 0, x, ay), side(s, 0.82, 0.84));
          m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.16, Math.PI / 8, x, ay), side(s, 0.84, 1.04)));
          m.scope("primary suspension", () => {
            block(m, "bogie", x - 0.38, x + 0.38, ay + 0.17, ay + 0.21, ...side(s, 0.9, 1.04));
            for (const d of [-0.28, 0.28]) coil(m, "spring", x + d, s * 0.97, ay - 0.1, ay + 0.17, 0.075, 2, 6);
          });
        }
      });
    m.scope("motor", () => {
      // the one motor across the bogie's middle, its gear case to one side
      const motor = ngon(12, 0.42, 0, xc, ay + 0.05);
      m.sweep("bogie", "z", motor, -0.62, motor, 0.62);
      block(m, "bogie", xc - 0.5, xc + 0.5, ay - 0.25, ay + 0.35, 0.62, 0.78);
    });
    m.scope("frame", () => {
      const L = hb + 0.62;
      for (const s of [-1, 1]) {
        const top: Ring = [[-L, ft], [-hb + 0.35, ft], [-hb + 0.6, ft - 0.1], [hb - 0.6, ft - 0.1], [hb - 0.35, ft], [L, ft]];
        const bottom: Ring = [[-L, ft - 0.18], [-hb + 0.3, ft - 0.18], [-hb + 0.55, ay - 0.06], [hb - 0.55, ay - 0.06], [hb - 0.3, ft - 0.18], [L, ft - 0.18]];
        plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
      }
      for (const x of [xc - L + 0.05, xc + L - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, ft - 0.18, ft - 0.02, -1.0, 1.0);
    });
    m.scope("secondary suspension", () => {
      for (const s of [-1, 1]) for (const d of [-0.6, 0.6]) coil(m, "spring", xc + d, s * 1.18, ft - 0.38, ft + 0.02, 0.1, 2, 6);
      for (const s of [-1, 1]) block(m, "bogie", xc - 0.8, xc + 0.8, ft - 0.48, ft - 0.38, ...side(s, 1.0, 1.32));
    });
  });
}

/** The body's grey brackets hanging over each bogie's springs. */
function bodyBrackets(m: MeshBuilder): void {
  m.scope("bogie brackets", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const d of [-0.6, 0.6])
        for (const s of [-1, 1]) block(m, "skirt", xc + d - 0.16, xc + d + 0.16, FRAME_TOP + 0.04, Y0 + 0.01, ...side(s, 1.3, 1.46));
  });
}

/** The long filter grille: a dark panel and its fine upright ribs (one-sided strips, the kit's slats cost ten times more). */
function filterGrilles(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("filter grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const [x0, x1] = GRILLE.x, [y0, y1] = GRILLE.y;
        surfacePanel(m, "louvre", at, n, roundRect(x0, x1, y0, y1, 0.03), -0.006, 0.006);
        const ribs: Ring[] = [];
        const count = Math.round((x1 - x0 - 0.06) / 0.1);
        for (let i = 0; i <= count; i++) {
          const x = x0 + 0.03 + (i * (x1 - x0 - 0.06)) / count;
          const q: Ring = [[x - 0.016, y0 + 0.03], [x + 0.016, y0 + 0.03], [x + 0.016, y1 - 0.03], [x - 0.016, y1 - 0.03]];
          ribs.push(sd > 0 ? q : [...q].reverse());
        }
        surfaceDecal(m, "slat", at, n, ribs, 0.009);
      });
  });
}

/** The NS 1600 / 1700 in a livery. */
export function ns1700(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    if (l.ns) nsMarkings(m, sp, l);
    else dbEmblems(m, sp);
    skirtNumbers(m, sp, l);
    frontPlates(m, sp, l);
    topLamps(m, sp);
    wipers(m, sp);
    handrails(m, sp);
    antiClimbers(m);
    headstocks(m);
    bodyBrackets(m);
    filterGrilles(m, sp);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => monomotorBogie(m, xc));
  });
  m.scope("roof equipment", () => {
    roofLouvres(m);
    pantographs(m);
    roofLine(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function ns1700Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
