// The NS class 1100 (proc-vehicle-ns-1100, Alsthom 1950 - 1956), the Dutch sister
// of the SNCF BB 8100: a short Bo'Bo' 1,500 V DC electric on the box locomotive
// kit (boxLocoKit.ts) with its own profile, measured on the photographs in
// assets/ns-1100 (SOURCES.md; docs/models/netherlands-trains.md) and the published
// figures (12.984 m over the buffers, 14.184 m with the collision nose, 2.988 m
// wide, the roof 3.75 m, the bogie pivots 6.0 m apart, 2.95 m wheelbase, 1,250 mm
// wheels):
//
// - the body: upright sides to the roof's edge, the roof curving across to a flat
//   crown; the flat cab front with rounded corners, its top edge following the
//   roof's curve; the two windscreens in their aluminium frames, the small lamps
//   at the roof's corners, the handrail across the front under the windscreens;
// - each side: the cab door just behind the front corner with its tall narrow
//   window and long handrails, the four portholes of the machine room, the
//   louvres along the roof's edge between the pantographs;
// - the buffers and the coupling on the bogies' headstocks below the body (the
//   class's characteristic, its "nervous" ride), not on the body;
// - the two diamond pantographs over the cabs (the rear raised) and the roof line;
// - `blue`: the turquoise of 1950 as delivered (1110; the museum's 1125 restored as
//   1122): the pale turquoise body, the darker band between two cream lines along
//   the sides that curls round the headlights on the front, the brass NS shield
//   over the number plate, the red headstocks;
// - `yellowGrey`: NS's yellow and grey of the 1970s, with the collision nose
//   ("botsneus", 0.6 m deep) every surviving loco received in 1978 - 1981 (1153;
//   1120, 1142, 1147): the yellow nose with the top lamp, the two lower lamps and
//   the black number; the grey body, the yellow band through the portholes from
//   door to door with the black NS logo at each end, the big white number.

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, numberOn, onEnd, onSide, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;

/** The cab front's |x| (the body 11.74 m long). */
const N = 5.87;
/** The collision nose's front: 0.6 m ahead of the cab front. */
const NOSE = N + 0.6;
/** Half the length over the buffers: 12.984 m as built, 14.184 m with the nose. */
const HALF_FLAT = 6.49;
const HALF_NOSE = 7.09;
/** The body's bottom, the roof's edge, the crown. */
const Y0 = 1.25;
const WALL_TOP = 3.47;
const CROWN = 3.75;
/** The body's half width (2.988 m). */
const W = 1.494;
/** The windscreens' sill and head. */
const SCREEN: readonly [number, number] = [2.72, 3.44];
/** The collision nose: its upright front's top, the top's front edge, where its top meets the cab front. */
const NOSE_FRONT_TOP = 2.4;
const NOSE_TOP = 2.645;

/** The half width: upright sides, the roof's curve to the crown. */
const HW: Table = [[Y0, W], [WALL_TOP, W], [3.55, W - 0.03], [3.62, W - 0.1], [3.68, W - 0.25], [3.72, W - 0.5], [CROWN, W - 0.85]];
/** The flat front, its top edge rounding over into the roof. */
const ROOF_TIP: Table = [[WALL_TOP, N], [3.6, N - 0.03], [3.68, N - 0.09], [CROWN, N - 0.22]];
const TIP_FLAT: Table = [[Y0, N], ...ROOF_TIP];
/** The collision nose: upright, its top edge rounded, its top rising gently back to the cab front under the windscreens. */
const TIP_NOSE: Table = [[Y0, NOSE], [NOSE_FRONT_TOP, NOSE], [2.46, NOSE - 0.05], [2.51, NOSE - 0.15], [2.57, NOSE - 0.33], [NOSE_TOP, N], ...ROOF_TIP];

/** The front's plan at half width w: flat, the corners rounded 0.18 m. */
const CORNER = 0.18;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);
function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(CORNER, w * 0.5);
  const flat = w - r;
  return [[0, 0], [flat, 0], ...ANGLES.map((a) => [flat + r * Math.sin(a), r * (1 - Math.cos(a))] as const)];
}

// --- liveries ------------------------------------------------------------------------

interface Ns1100Livery {
  title: string;
  nose: boolean;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  /** The headstocks' paint. */
  beam: string;
  number: string;
}

const CREAM = c("#ddd0a0", 0.45);
/** The lining: two cream lines with the darker band between them. */
const LINING: readonly [number, number, number, number] = [1.975, 2.0, 2.085, 2.11];

const LIVERIES: Record<string, Ns1100Livery> = {
  blue: {
    title: "NS blue",
    nose: false,
    palette: { turq: c("#86b8ae", 0.5), turqDark: c("#3f7d74", 0.5), cream: CREAM, roofT: c("#7a9c96", 0.7), red: c("#c0321f", 0.55), brass: { color: "#b8955a", metallic: 0.6, roughness: 0.35 }, plate: c("#2f4b44", 0.6) },
    side: [[Y0, LINING[0], "turq"], [LINING[0], LINING[1], "cream"], [LINING[1], LINING[2], "turqDark"], [LINING[2], LINING[3], "cream"], [LINING[3], CROWN, "turq"]],
    end: [[Y0, CROWN, "turq"]],
    roof: "roofT",
    beam: "red",
    number: "1110",
  },
  yellowGrey: {
    title: "NS yellow, grey",
    nose: true,
    palette: { grey: c("#56606a", 0.55), yellow: c("#ffc917", 0.5), roofG: c("#41474d", 0.7), logo: c("#1c1d20", 0.6), nosePaint: c("#ffc917", 0.5), headstock: c("#2a2c2f", 0.7), plate: c("#2a2c2f", 0.6) },
    side: [[Y0, CROWN, "grey"]],
    end: [[Y0, NOSE_TOP + 0.005, "yellow"], [NOSE_TOP + 0.005, CROWN, "grey"]],
    roof: "roofG",
    beam: "headstock",
    number: "1153",
  },
};

export const NS1100_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Ns1100Livery => LIVERIES[resolveParams(NS1100_PARAMS, v).livery!]!;

// --- the skin ---------------------------------------------------------------------------

/** The cab door (front half; mirrored to the rear) and its window. */
const DOOR: readonly [number, number] = [N - 0.95, N - 0.27];
const DOOR_WIN: readonly [number, number] = [N - 0.8, N - 0.42];
/** The portholes: centres along x, their height, radius. */
const PORTHOLES = [-2.19, -0.73, 0.73, 2.19];
const PORT_Y = 3.13;
const PORT_R = 0.27;
/** The yellow band through the portholes (yellowGrey). */
const BAND_Y: readonly [number, number] = [2.8, WALL_TOP - 0.02];
const BAND_X = N - 1.1;
/** The NS logo's centre along x (both ends of the band) and its size. */
const LOGO_X = 3.72;
const LOGO_W = 1.24;
const LOGO_H = 0.5;
/** The headlights of the flat front: |z|, height, lens radius. */
const LAMP_Z = 1.05;
const LAMP_Y = 1.89;
const LAMP_R = 0.13;

/** The side wall's end at height y (the nose's slope): the tip less the corner. */
const wallEnd = (tip: Table, y: number) => lerpTable(tip, y) - CORNER;

function sideItems(l: Ns1100Livery, tip: Table): SideItem[] {
  const items: SideItem[] = [
    { kind: "door", name: "cab door", x: DOOR, y: [Y0 + 0.05, 3.38], rails: true, mirror: true },
    { kind: "window", name: "cab door window", x: DOOR_WIN, y: [2.5, 3.33], mat: "rim", r: 0.07, mirror: true },
    // the louvres along the roof's edge between the pantographs
    { kind: "grille", name: "roof louvres", x: [-3.0, 3.0], y: [3.5, 3.63], mat: "slat", slats: "v", pitch: 0.12 },
  ];
  if (l.nose) {
    // the nose's side yellow back to the cab's original corner, following its sloping top
    const top = (y: number) => wallEnd(tip, y) - 0.02;
    items.push(
      { kind: "paint", name: "nose side", x: [N - CORNER + 0.01, NOSE - CORNER - 0.02], y: [Y0, NOSE_TOP - 0.01], mat: "nosePaint", layer: 1, mirror: true,
        poly: [[N - CORNER + 0.01, Y0], [top(Y0), Y0], [top(NOSE_FRONT_TOP), NOSE_FRONT_TOP], [top(2.46), 2.46], [top(2.51), 2.51], [top(2.57), 2.57], [N - CORNER + 0.01, NOSE_TOP - 0.01]] },
      { kind: "paint", name: "yellow band", x: [-BAND_X, BAND_X], y: BAND_Y, mat: "yellow", layer: 1 },
    );
  } else {
    items.push({ kind: "paint", name: "roundel", x: [-3.07, -2.83], y: [LINING[0] - 0.08, LINING[3] + 0.08], mat: "cream", layer: 1, poly: ngon(12, 0.12, 0, -2.95, (LINING[0] + LINING[3]) / 2) });
  }
  return items;
}

/** A disc on the front: centre z (positive: the left seen from ahead), height, radius. */
const disc = (cz: number, cy: number, r: number): Ring => ngon(16, r, 0, cz, cy);

function endItems(l: Ns1100Livery): EndItem[] {
  const common: EndItem[] = [
    { kind: "paint", name: "windscreen surround", z: [-1.2, 1.2], y: [SCREEN[0] - 0.035, SCREEN[1] + 0.035], mat: "rim", layer: 1 },
    { kind: "window", name: "windscreen left", z: [0.05, 1.17], y: SCREEN, mat: "rim", wiper: true },
    { kind: "window", name: "windscreen right", z: [-1.17, -0.05], y: SCREEN, mat: "rim", wiper: true },
    { kind: "lamp", name: "roof lamp left", z: [1.03, 1.15], y: [3.56, 3.68], r: 0.055 },
    { kind: "lamp", name: "roof lamp right", z: [-1.15, -1.03], y: [3.56, 3.68], r: 0.055 },
  ];
  if (l.nose)
    return [
      ...common,
      { kind: "lamp", name: "top headlight", z: [-0.09, 0.09], y: [2.2, 2.38], r: 0.08 },
      { kind: "lamp", name: "headlight left", z: [0.66, 0.84], y: [1.54, 1.72], r: 0.085 },
      { kind: "lamp", name: "headlight right", z: [-0.84, -0.66], y: [1.54, 1.72], r: 0.085 },
      { kind: "lamp", name: "tail lamp left", z: [1.2, 1.3], y: [1.52, 1.62], r: 0.045, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.3, -1.2], y: [1.52, 1.62], r: 0.045, mat: "lampRed" },
    ];
  const lining = (s: number): EndItem[] => {
    const z = (a: number, b: number) => (s > 0 ? [a, b] as const : [-b, -a] as const);
    const zc = s * LAMP_Z;
    return [
      { kind: "paint", name: `lining ${s > 0 ? "left" : "right"} lower`, z: z(1.18, W), y: [LINING[0], LINING[1]], mat: "cream", layer: 1 },
      { kind: "paint", name: `lining ${s > 0 ? "left" : "right"} band`, z: z(1.18, W), y: [LINING[1], LINING[2]], mat: "turqDark", layer: 1 },
      { kind: "paint", name: `lining ${s > 0 ? "left" : "right"} upper`, z: z(1.18, W), y: [LINING[2], LINING[3]], mat: "cream", layer: 1 },
      // the lining curls round the headlight: a cream ring on the turquoise
      { kind: "paint", name: `lamp ring ${s > 0 ? "left" : "right"}`, z: z(LAMP_Z - 0.22, LAMP_Z + 0.22), y: [LAMP_Y - 0.22, LAMP_Y + 0.22], mat: "cream", layer: 2, poly: disc(zc, LAMP_Y, 0.215) },
      { kind: "paint", name: `lamp field ${s > 0 ? "left" : "right"}`, z: z(LAMP_Z - 0.19, LAMP_Z + 0.19), y: [LAMP_Y - 0.19, LAMP_Y + 0.19], mat: "turq", layer: 3, poly: disc(zc, LAMP_Y, 0.19) },
    ];
  };
  return [
    ...common,
    ...lining(1),
    ...lining(-1),
    { kind: "lamp", name: "headlight left", z: [LAMP_Z - LAMP_R, LAMP_Z + LAMP_R], y: [LAMP_Y - LAMP_R, LAMP_Y + LAMP_R], r: LAMP_R },
    { kind: "lamp", name: "headlight right", z: [-LAMP_Z - LAMP_R, -LAMP_Z + LAMP_R], y: [LAMP_Y - LAMP_R, LAMP_Y + LAMP_R], r: LAMP_R },
    { kind: "lamp", name: "tail lamp left", z: [1.33, 1.41], y: [1.62, 1.7], r: 0.04, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp right", z: [-1.41, -1.33], y: [1.62, 1.7], r: 0.04, mat: "lampRed" },
    // the brass NS shield with its wings over the number plate
    { kind: "paint", name: "shield", z: [-0.27, 0.27], y: [2.06, 2.44], mat: "brass", layer: 2,
      poly: [[-0.27, 2.44], [-0.27, 2.36], [-0.2, 2.22], [-0.09, 2.1], [0, 2.06], [0.09, 2.1], [0.2, 2.22], [0.27, 2.36], [0.27, 2.44]] },
    { kind: "paint", name: "shield field", z: [-0.15, 0.15], y: [2.14, 2.41], mat: "red", layer: 3, poly: ngon(14, 0.135, 0, 0, 2.28) },
    { kind: "plate", name: "number", z: [-0.22, 0.22], y: [1.85, 2.03] },
  ];
}

function spec(l: Ns1100Livery): LocoSpec {
  const tip = l.nose ? TIP_NOSE : TIP_FLAT;
  const front = l.nose ? NOSE : N;
  return {
    palette: {
      rim: { color: "#c3c7c9", metallic: 0.5, roughness: 0.35 }, slat: c("#5d6265", 0.6), louvre: c("#2b2e31", 0.8),
      frame: c("#33363a", 0.75), bogie: c("#3a3d40", 0.75), steel: c("#4a4d51", 0.5), spring: c("#2f3133", 0.7), wheel: c("#36383b", 0.6),
      ...l.palette,
    },
    y0: Y0,
    tip,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: l.roof,
    buffers: l.nose ? HALF_NOSE : HALF_FLAT,
    beam: front + 0.04,
    bufferY: 1.04,
    frame: { y0: 1.1, y1: Y0, half: front - 0.08, hw: W - 0.1, mat: "frame" },
    // pivots 6.0 m apart, 2.95 m wheelbase, 1,250 mm wheels
    bogies: [-3.0, 3.0].map((xc) => ({ xc, axles: [-1.475, 1.475], wheelR: 0.625, frameTop: 0.875 })),
    pantograph: { kind: "diamond", x: 4.0, roofY: CROWN, baseY: 4.1 },
    sideItems: sideItems(l, tip),
    endItems: endItems(l),
    roofItems: [{ name: "roof walk", x: [-3.0, 3.0], w: [0.36, 0.3], y: [CROWN - 0.02, CROWN + 0.06], mat: l.roof }],
    underItems: [[-0.7, 0.7, 0.62, 1.1, 0.85]],
    number: l.number,
  };
}

// --- what the kit does not draw ---------------------------------------------------------

/** The headstocks the buffers and the coupling hang on: on the bogies, below the body. */
function headstocks(m: MeshBuilder, l: Ns1100Livery): void {
  const front = l.nose ? NOSE : N;
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, l.beam, ...x(front - 0.3, front + 0.04), 0.8, 1.2, -1.36, 1.36);
        // the bogie's frame reaching out to it
        block(m, "bogie", ...x(4.95, front - 0.29), 0.74, 0.96, -0.32, 0.32);
      });
  });
}

/** The handrail across the front under the windscreens, on three brackets. */
function frontRail(m: MeshBuilder, sp: ShellSpec, l: Ns1100Livery): void {
  const y = l.nose ? 2.69 : 2.58;
  m.scope("front handrails", () => {
    for (const e of [-1, 1]) {
      const x = e * (sp.tip(y) + 0.07);
      m.scope(e > 0 ? "front" : "rear", () => {
        m.sweep("rim", "z", ngon(6, 0.016, 0, x, y), -1.3, ngon(6, 0.016, 0, x, y), 1.3);
        for (const z of [-1.25, 0, 1.25]) block(m, "rim", ...(e > 0 ? [sp.tip(y) - 0.01, sp.tip(y) + 0.07] as [number, number] : [-sp.tip(y) - 0.07, -sp.tip(y) + 0.01] as [number, number]), y - 0.012, y + 0.012, z - 0.012, z + 0.012);
      });
    }
  });
}

/** The portholes: an aluminium ring and the glass. */
function portholes(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("portholes", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        for (const [i, x] of PORTHOLES.entries())
          m.scope(`porthole ${i + 1}`, () => {
            surfacePanel(m, "rim", at, n, ngon(16, PORT_R, 0, x, PORT_Y), -0.01, 0.014);
            surfacePanel(m, "glass", at, n, ngon(16, PORT_R - 0.045, 0, x, PORT_Y), -0.005, 0.022);
          });
      });
  });
}

/**
 * The NS logo (yellowGrey) at both ends of the yellow band: the elongated hexagon
 * broken into two arrows pointing apart, and the stepped bar between them, as
 * strokes in one plane and one material.
 */
function nsLogos(m: MeshBuilder, sp: ShellSpec): void {
  const t = LOGO_H * 0.17;
  const a = LOGO_W / 2, b = LOGO_H / 2 - t / 2, k = a - LOGO_H * 0.42;
  // centre lines (u right, v up) about the logo's centre: upper arrow, lower arrow, the step
  const lines: Array<Array<readonly [number, number]>> = [
    [[a - 0.06, 0.03], [k + 0.01, b], [-k, b], [-a, 0.0], [-k + 0.05, -b + 0.12]],
    [[-a + 0.06, -0.03], [-k - 0.01, -b], [k, -b], [a, 0.0], [k - 0.05, b - 0.12]],
    [[-a + 0.2, 0.06], [-0.08, 0.06], [0.08, -0.06], [a - 0.2, -0.06]],
  ];
  const quads = (u0: number, v0: number, flip: boolean): Array<[number, number]> => {
    const out: Array<[number, number]> = [];
    for (const line of lines)
      for (let i = 1; i < line.length; i++) {
        const [p, q] = [line[i - 1]!, line[i]!];
        const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
        const ux = (dx / len) * t * 0.5, uy = (dy / len) * t * 0.5, nx = -uy, ny = ux;
        const pts: Array<[number, number]> = [[p[0] - ux + nx, p[1] - uy + ny], [q[0] + ux + nx, q[1] + uy + ny], [q[0] + ux - nx, q[1] + uy - ny], [p[0] - ux - nx, p[1] - uy - ny]];
        const P = pts.map(([u, v]) => [u0 + (flip ? -u : u), v0 + v] as [number, number]);
        // wound counter-clockwise as the reader sees it
        out.push(...(flip ? [P[0]!, P[2]!, P[1]!, P[0]!, P[3]!, P[2]!] : [P[0]!, P[1]!, P[2]!, P[0]!, P[2]!, P[3]!]));
      }
    return out;
  };
  m.scope("NS logos", () => {
    for (const sd of [-1, 1])
      for (const x of [-LOGO_X, LOGO_X])
        m.scope(`${sd > 0 ? "right" : "left"} ${x > 0 ? "front" : "rear"}`, () => {
          const at = onSide(sp, sd);
          // the right side (+z) reads with +x to the reader's right
          const tris = quads(x, (BAND_Y[0] + BAND_Y[1]) / 2, sd < 0);
          m.facets("logo", tris.map(([u, v]) => at(u, v, 0.009)), [0, 0, sd]);
        });
  });
}

/** Text on both ends' faces: the black number on the nose (yellowGrey), "NS" on the shield (blue). */
function endLettering(m: MeshBuilder, sp: ShellSpec, l: Ns1100Livery): void {
  const [text, h, y, mat] = l.nose ? [l.number, 0.2, 1.66, "logo"] as const : ["NS", 0.1, 2.23, "brass"] as const;
  const w = wordWidth(text, h, { weight: 0.18 });
  m.scope("front lettering", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const tris = letters(text, e > 0 ? w / 2 : -w / 2, y, h, e > 0, { weight: 0.18 });
      m.scope(e > 0 ? "front" : "rear", () => m.facets(mat, tris.map(([u, v]) => at(u, v, 0.012)), [e, 0, 0]));
    }
  });
}

/** The big white number on the grey of each side (yellowGrey). */
function sideNumbers(m: MeshBuilder, sp: ShellSpec, l: Ns1100Livery): void {
  m.scope("side numbers", () => {
    for (const sd of [-1, 1]) m.scope(sd > 0 ? "right" : "left", () => numberOn(m, onSide(sp, sd), [0, 0, sd], l.number, 0, 2.2, 0.44, 0.006, sd < 0));
  });
}

/** The roof line: a busbar on post insulators between the pantographs. */
function roofLine(m: MeshBuilder): void {
  const y = CROWN + 0.32;
  m.scope("roof line", () => {
    for (const x of [-2.6, -0.9, 0.9, 2.6]) insulator(m, x, 0.22, CROWN + 0.05, y - 0.02);
    tubeX(m, "copper", 0.02, -3.4, y, 0.22, 3.4, y, 0.22, 6);
  });
}

/** The NS 1100 in a livery. */
export function ns1100(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    headstocks(m, l);
    frontRail(m, sp, l);
    portholes(m, sp);
    endLettering(m, sp, l);
    if (l.nose) {
      nsLogos(m, sp);
      sideNumbers(m, sp, l);
    }
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/**
 * The distant model: the kit's box locomotive from the same profile and paint; the
 * yellow band through the portholes (yellowGrey) runs the whole length there.
 */
export function ns1100Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  return boxLocoLod(l.nose ? { ...s, side: [[Y0, BAND_Y[0], "grey"], [BAND_Y[0], BAND_Y[1], "yellow"], [BAND_Y[1], CROWN, "grey"]] } : s);
}
