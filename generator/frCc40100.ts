// The SNCF CC 40100 (proc-vehicle-sncf-cc40100): Alsthom's quadri-current C'C'
// of 1964 - 1970 (CC 40101 - 40110), the first of Paul Arzens's "nez casse",
// built for the TEE and the Nord-Express / Etoile du Nord between Paris,
// Brussels, Amsterdam and Cologne (1.5 kV and 3 kV DC, 25 kV 50 Hz and 15 kV
// 16 2/3 Hz), on the box locomotive kit (boxLocoKit.ts) with its own profile,
// measured on the reference photographs (assets/sncf-cc40100/SOURCES.md):
//
// - the published figures: 22.03 m over the buffers, 3.0 m wide, 107 t,
//   4,480 kW, 160 km/h in service (240 km/h on the high gear ratio); two
//   monomotor C bogies with their two gear ratios, 1.10 m wheels;
// - side-on, 40101 at Mulhouse (the cab end, 271 px/m on the cab side, from the
//   door's 0.6 m): the profile and the red sweep; three-quarter, 40110 at
//   Joncherolles (its right side): a 1-D projective fit over its six axles and
//   the buffers gives the bogie centres (about 14 m; 100 px/m at the near cab,
//   about 50 px/m at the far one), the doors and the grille's ends; head-on
//   three-quarter, 40101 (about 225 px/m at the face) and 40109 at
//   Garges-Sarcelles (about 200 px/m): the face, the lamps, the windscreens;
//   40110's left side for the roof and the pantographs;
// - the nose, shorter and steeper than the later CC 6500's: the lower nose upright
//   from the step plates at 1.55 m to 2.46 m, its top rounded over in 0.45 m to
//   the windscreens' foot at 2.9 m only 0.31 m behind the face; the windscreens
//   leaning forward 0.25 m to the visor at 3.6 m, which stands almost over the face;
//   the lower nose's corners rounded 0.5 m in plan, the cab front's 0.22 m;
// - on the face: the red field between the lamps and the number plate (2.37 m wide,
//   1.56 - 2.40 m), the orange-yellow wings of the 1960s SNCF emblem meeting at the
//   disc, the black number plate on the field's top edge, a big white headlight
//   outboard and a red lamp inboard each side, two grated step plates over the
//   headstock, the red panel between the big rectangular buffers; the headlight
//   in its round housing on the roof over the windscreens;
// - the side: one end (A, +x, "extremite 2" on 40101) with the cab door 1.4 m
//   behind the windscreen, a blank panel ahead of it, and the red band sweeping
//   down round the stainless panel's end in a "D" with a bright edge; the other end
//   (B, -x) with its door just behind the cab front and the band, the stainless
//   panel and the grille running on almost to the end (both sides alike, as 40110
//   and 40109 show it on their right and left sides);
// - the stainless steel lower side with its horizontal flutes (1.28 - 2.10 m), the
//   red band over it (2.10 - 2.41 m), the metallic grey above with the long red
//   louvred grille of thirteen panels (2.98 - 3.58 m), the belt moulding at 2.9 m;
// - the roof: the hood in the middle with its row of skylights and the rheostat's
//   mesh box, four single-arm pantographs, two over each end (for the two DC and
//   the two AC systems), their hinges inboard and their knees toward the cabs, the
//   rear end's outer one raised (40109 in service); the horns by each roof lamp;
// - the grey underframe boxes between the bogies.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, rect, singleArm, surfaceDecal, surfacePanel, sweepZ, type ShellSpec } from "./czElectricKit.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Half the length over the buffers (22.03 m). */
const HALF = 11.015;
/** The headstock's face, the lower nose's face (0.75 m behind the buffers' heads), the cab front at the windscreens' foot, |x|. */
const BEAM = 10.45;
const NOSE = 10.265;
const CAB = NOSE - 0.31;
/** The body's bottom (the stainless panel's foot); the step plates and the face's foot; where the bonnet meets the cab front. */
const Y0 = 1.28;
const LEDGE = 1.55;
const CAB_FOOT = 2.9;
/** The windscreens' sill and head; the side wall's top; the crown. */
const SCREEN: Span = [2.95, 3.55];
const WALL_TOP = 3.68;
const CROWN = 4.02;
/** The body's half width (3.0 m). */
const W = 1.5;

/**
 * The end's centre line [y, |x|], bottom first, measured on 40101's side: the face upright
 * from the step plates to 2.46 m, rounded over into the short bonnet that meets the cab
 * front 0.31 m back at 2.9 m; the windscreens leaning out 0.25 m to their head, the visor
 * 0.3 m out; the roof falling back to the crown.
 */
const TIP: Table = [
  [Y0, NOSE - 0.05], [LEDGE - 0.03, NOSE - 0.05], [LEDGE, NOSE], [2.46, NOSE], [2.6, NOSE - 0.04], [2.7, NOSE - 0.1], [2.79, NOSE - 0.18], [2.86, NOSE - 0.26],
  [CAB_FOOT, CAB], [3.55, CAB + 0.25], [3.6, CAB + 0.3], [3.66, CAB + 0.29], [3.76, CAB + 0.19], [3.89, CAB + 0.04], [CROWN, CAB - 0.12],
];
/** The half width: upright walls, the roof's rounded edge. */
const HW: Table = [[Y0, W], [3.62, W], [WALL_TOP, W - 0.03], [3.8, W - 0.13], [3.92, W - 0.33], [CROWN, W - 0.55]];
/** The corner's radius in plan by height: the lower nose's big round corners, the cab front's tighter ones. */
const CORNER: Table = [[Y0, 0.45], [2.46, 0.5], [2.79, 0.4], [CAB_FOOT, 0.22], [3.6, 0.22], [3.8, 0.25], [CROWN, 0.3]];
/** The distant model's coarser profile. */
const LOD_TIP: Table = [[Y0, NOSE - 0.05], [LEDGE, NOSE], [2.5, NOSE], [CAB_FOOT, CAB], [3.6, CAB + 0.3], [CROWN, CAB - 0.12]];
const LOD_HW: Table = [[Y0, W], [3.62, W], [CROWN, W - 0.55]];
/** The distant model's corners: small enough to keep its ends square (its budget goes to the bands and windscreens). */
const LOD_CORNER: Table = [[Y0, 0.1], [CROWN, 0.1]];
const BOW = 0.015;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number, corner: Table = CORNER): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(corner, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the end at height y. */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;

/** The side's bands: the stainless panel, the red band over it, the grey above (40101, 40110). */
const INOX_TOP = 2.1;
const RED_TOP = 2.41;
/** End A's cab door (+x) and end B's (-x); the door's window. */
const DOOR_A: Span = [8.0, 8.65];
const DOOR_B: Span = [-9.45, -8.8];
const DOOR_Y: Span = [Y0 + 0.02, 3.62];
const DOOR_WIN: Span = [2.98, 3.52];
/** The long red grille: from end B's door to end A's, thirteen panels. */
const GRILLE: { x: Span; y: Span; n: number } = { x: [-8.45, 7.2], y: [2.98, 3.58], n: 13 };
/** End A's "D": the red band's edge and the stainless panel's end, [y, x] from the foot up (40101 side-on). */
const RED_D: Table = [[Y0, 8.9], [2.25, 9.36], [2.36, 9.33], [RED_TOP, 9.24]];
const INOX_D: Table = [[Y0, 8.72], [1.95, 8.92], [2.04, 8.9], [INOX_TOP, 8.82]];

// --- livery ------------------------------------------------------------------------

interface Cc40100Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  /** The distant model's side: the red band and the stainless panel as plain bands. */
  lodSide: readonly Band[];
  number: string;
}

const GREY: MaterialSpec = { color: "#bcbab2", metallic: 0.35, roughness: 0.4 };
const RED = c("#9a1d2c", 0.35);

const LIVERIES: Record<string, Cc40100Livery> = {
  inox: {
    title: "Stainless steel",
    palette: {
      body: GREY, roofGrey: GREY, red: RED, inox: { color: "#c9cccd", metallic: 0.65, roughness: 0.3 }, flute: { color: "#8f9497", metallic: 0.6, roughness: 0.35 },
      bright: { color: "#d8dadb", metallic: 0.7, roughness: 0.25 }, wing: c("#e59a30", 0.35), disc: c("#e28a2a", 0.35), ink: c("#202124", 0.6),
      louvreRed: c("#5e1820", 0.7), slatRed: c("#8e1c2a", 0.5), headstock: GREY, mesh: c("#7d7a72", 0.75),
    },
    side: [[Y0, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    lodSide: [[Y0, INOX_TOP, "inox"], [INOX_TOP, RED_TOP, "red"], [RED_TOP, 2.98, "body"], [2.98, 3.58, "louvreRed"], [3.58, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "40101",
  },
};

export const CC40100_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Cc40100Livery => LIVERIES[resolveParams(CC40100_PARAMS, v).livery!]!;

// --- the spec ----------------------------------------------------------------------

/** The single-arm pantographs: the outer and inner bases' |x|, the base height, arm lengths. */
const PANTO = { outer: 8.05, inner: 5.85, base: 4.26, lower: 1.6, upper: 1.5 } as const;
/** The bogies' centres (about 14 m apart), the axles' offsets (3.2 m wheelbase), the wheels' radius (1.10 m). */
const BOGIE_X = 7.0;
const AXLES = [-1.6, 0, 1.6] as const;
const WHEEL_R = 0.55;
const FRAME_TOP = 0.93;

const poly = (name: string, mat: string, layer: number, ring: Ring, mirror = false): SideItem => {
  const xs = ring.map((q) => q[0]), ys = ring.map((q) => q[1]);
  return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, layer, poly: ring, ...(mirror ? { mirror: true } : {}) };
};

/** The red band and the stainless panel: to end B's corner, round end A's "D", and the D's bright edge. */
function sidePaint(): SideItem[] {
  const tail = (y: number): [number, number] => [-sideEnd(y), y];
  const edge = (t: Table, dx: number): Ring => t.map(([y, x]) => [x + dx, y] as [number, number]);
  return [
    poly("d edge", "bright", 1, [tail(Y0), ...edge(RED_D, 0.035), tail(RED_TOP)].map(([x, y]) => [x, y === RED_TOP ? RED_TOP + 0.03 : y] as [number, number])),
    poly("red band", "red", 2, [tail(Y0), ...edge(RED_D, 0), tail(RED_TOP)]),
    poly("stainless panel", "inox", 3, [tail(Y0), ...edge(INOX_D, 0), tail(INOX_TOP)]),
  ];
}

/** The face: the red field between the lamps, a white headlight outboard and a red lamp inboard each side (40101, 40109). */
const END_ITEMS: EndItem[] = [
  { kind: "paint", name: "red field", z: [-1.19, 1.19], y: [LEDGE + 0.01, 2.4], mat: "red", layer: 1, poly: [[-1.15, LEDGE + 0.01], [1.15, LEDGE + 0.01], [1.19, 2.4], [-1.19, 2.4]] },
  { kind: "lamp", name: "headlight left", z: [0.84, 1.1], y: [1.65, 1.91], r: 0.12 },
  { kind: "lamp", name: "red lamp left", z: [0.58, 0.78], y: [1.68, 1.88], r: 0.09, mat: "lampRed" },
  { kind: "lamp", name: "headlight right", z: [-1.1, -0.84], y: [1.65, 1.91], r: 0.12 },
  { kind: "lamp", name: "red lamp right", z: [-0.78, -0.58], y: [1.68, 1.88], r: 0.09, mat: "lampRed" },
];

function spec(l: Cc40100Livery, lod = false): LocoSpec {
  return {
    palette: {
      rim: c("#a7abad", 0.4), groove: c("#3a3c3f", 0.7), louvre: c("#25282b", 0.85), slat: c("#3a3e42", 0.7),
      bogie: c("#5a5f63", 0.75), steel: c("#4a4d51", 0.5), spring: c("#3e4144", 0.7), wheel: c("#3a3c3f", 0.6), underframe: c("#4f5357", 0.75),
      roofBox: c("#a9a7a0", 0.5), horn: c("#9ca1a4", 0.4), white: c("#ebece7"), grate: c("#9fa3a5", 0.4),
      ...l.palette,
    },
    y0: Y0,
    tip: lod ? LOD_TIP : TIP,
    hw: lod ? LOD_HW : HW,
    endPlan: lod ? (y, w) => endPlan(y, w, LOD_CORNER) : (y, w) => endPlan(y, w),
    corner: "end",
    side: lod ? l.lodSide : l.side,
    end: l.end,
    roof: "roofGrey",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.05,
    bufferHead: "rect",
    frame: { y0: 0.95, y1: Y0, half: 10.0, hw: 1.38, mat: "underframe" },
    bogies: lod ? [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: AXLES, wheelR: WHEEL_R, frameTop: FRAME_TOP })) : [],
    // the full model draws its pantographs and bogies itself; the distant model takes the kit's (the outer pair)
    ...(lod ? { pantograph: { kind: "singleArm" as const, x: PANTO.outer, roofY: CROWN, baseY: PANTO.base, lower: PANTO.lower, upper: PANTO.upper } } : {}),
    sideItems: lod
      ? [
          { kind: "window", name: "door window a", x: [DOOR_A[0] + 0.1, DOOR_A[1] - 0.1], y: DOOR_WIN },
          { kind: "window", name: "door window b", x: [DOOR_B[0] + 0.1, DOOR_B[1] - 0.1], y: DOOR_WIN },
        ]
      : [
          ...sidePaint(),
          { kind: "door", name: "cab door a", x: DOOR_A, y: DOOR_Y, win: DOOR_WIN, rails: true },
          { kind: "door", name: "cab door b", x: DOOR_B, y: DOOR_Y, win: DOOR_WIN, rails: true },
        ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.1, 1.2], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.2, -0.1], y: SCREEN, mat: "rubber" },
      ...(lod ? [] : END_ITEMS),
    ],
    roofItems: [
      ...(lod ? [] : [{ name: "roof hood", x: [-2.6, 4.0], w: [1.02, 0.98], y: [CROWN - 0.02, 4.14], mat: "roofGrey" } as const]),
      { name: "rheostat", x: [-1.7, 3.3], w: [0.86, 0.72], y: lod ? [CROWN - 0.02, 4.44] : [4.13, 4.44], mat: "mesh" },
    ],
    underItems: lod ? [[-4.6, 4.6, 0.55, 0.95, 1.3]] : [],
    number: l.number,
  };
}

// --- what the kit does not draw -----------------------------------------------------

/** The stainless panel's flutes: bright ribs every 0.075 m, to end B's corner and end A's "D". */
function flutes(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("flutes", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const ribs: Ring[] = [];
        for (let y = Y0 + 0.06; y + 0.03 < INOX_TOP - 0.03; y += 0.075) {
          const x0 = -sideEnd(y) + 0.02, x1 = lerpTable(INOX_D, y + 0.03) - 0.04;
          const q: Ring = [[x0, y], [x1, y], [x1, y + 0.025], [x0, y + 0.025]];
          ribs.push(sd > 0 ? q : (q.map(([u, v]) => [u, v] as [number, number]).reverse() as Ring));
        }
        surfaceDecal(m, "flute", at, n, ribs, 0.0105);
      });
  });
}

/** The red louvred grille: a red frame, thirteen dark panels and their horizontal red slats. */
function grilles(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const wind = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        const [x0, x1] = GRILLE.x, [y0, y1] = GRILLE.y;
        m.scope("frame", () => surfacePanel(m, "red", at, n, rect(x0, y0, x1, y1), -0.004, 0.006));
        const pw = (x1 - x0) / GRILLE.n;
        const panels: Ring[] = [], slats: Ring[] = [];
        for (let i = 0; i < GRILLE.n; i++) {
          const a = x0 + i * pw + 0.04, b = a + pw - 0.08;
          panels.push(wind(rect(a, y0 + 0.05, b, y1 - 0.05)));
          for (let y = y0 + 0.09; y + 0.03 < y1 - 0.05; y += 0.085) slats.push(wind(rect(a + 0.01, y, b - 0.01, y + 0.03)));
        }
        m.scope("panels", () => surfaceDecal(m, "louvreRed", at, n, panels, 0.008));
        m.scope("slats", () => surfaceDecal(m, "slatRed", at, n, slats, 0.011));
      });
  });
}

/** The belt moulding along each side at the bonnet's height; the handrail along end A's cab side. */
function mouldings(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("belt mouldings", () => {
    for (const sd of [-1, 1]) {
      const w = sp.hw(CAB_FOOT);
      const spans: Span[] = [[-sideEnd(CAB_FOOT) + 0.02, DOOR_B[0] - 0.12], [DOOR_B[1] + 0.12, DOOR_A[0] - 0.12], [DOOR_A[1] + 0.12, sideEnd(CAB_FOOT) - 0.02]];
      m.scope(sd > 0 ? "right" : "left", () => {
        for (const [a, b] of spans) block(m, "body", a, b, CAB_FOOT - 0.025, CAB_FOOT + 0.015, ...side(sd, w - 0.01, w + 0.018));
      });
    }
  });
  m.scope("cab handrails", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const yy = CAB_FOOT + 0.07, z = sd * (W + 0.03);
        tubeX(m, "rim", 0.014, DOOR_A[1] + 0.15, yy, z, sideEnd(yy) - 0.1, yy, z, 6);
        for (const x of [DOOR_A[1] + 0.17, sideEnd(yy) - 0.12]) block(m, "steel", x - 0.012, x + 0.012, yy - 0.012, yy + 0.012, ...side(sd, W - 0.01, W + 0.035));
      });
  });
}

/** The red lamp on each side's stainless panel ahead of end A's door, the door's lock, the step recess. */
function sideFittings(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("side fittings", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const u = (x: number) => x;
        surfacePanel(m, "rim", at, n, ngon(10, 0.06, 0, u(8.8), 1.95), 0.006, 0.02);
        surfacePanel(m, "lampRed", at, n, ngon(10, 0.045, 0, u(8.8), 1.95), 0.01, 0.026);
        surfacePanel(m, "groove", at, n, rect(u(8.15), 1.4, u(8.5), 1.52), 0.008, 0.012);
      });
  });
}

/** The running number in bright figures on the grey behind end A's door (40101). */
function sideNumbers(m: MeshBuilder, sp: ShellSpec, l: Cc40100Livery): void {
  m.scope("side numbers", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const h = 0.24, w = wordWidth(l.number, h, { weight: 0.16 });
        const cx = DOOR_A[0] - 0.25 - w / 2;
        const tris = letters(l.number, sd > 0 ? cx - w / 2 : cx + w / 2, 2.52, h, sd < 0, { weight: 0.16 });
        m.facets("bright", tris.map(([a, b]) => at(a, b, 0.008)), [0, 0, sd]);
      });
  });
}

/** Counter-clockwise in (u, v). */
const ccw = (q: Ring): Ring => {
  const area = q.reduce((a, p, i) => { const r = q[(i + 1) % q.length]!; return a + p[0] * r[1] - r[0] * p[1]; }, 0);
  return area > 0 ? q : [...q].reverse();
};

/** The emblem on the red field: two orange-yellow wings from the field's top corners to the disc, the disc with "SNCF"; the number plate on the field's top edge. */
function faceEmblems(m: MeshBuilder, sp: ShellSpec, l: Cc40100Livery): void {
  const cy = 2.09;
  m.scope("emblems", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        // seen from ahead, +z is on the reader's left at the front; the emblem is symmetric
        for (const s of [-1, 1]) {
          const wing: Ring = [[s * 0.12, cy - 0.12], [s * 0.94, 2.27], [s * 0.99, 2.36], [s * 0.12, cy + 0.1]];
          m.scope(s > 0 ? "wing left" : "wing right", () => surfacePanel(m, "wing", at, n, ccw(wing), 0.004, 0.014));
        }
        m.scope("disc", () => {
          surfacePanel(m, "ink", at, n, ngon(16, 0.2, 0, 0, cy), 0.004, 0.016);
          surfacePanel(m, "disc", at, n, ngon(16, 0.17, 0, 0, cy), 0.008, 0.02);
          const h = 0.075, w = wordWidth("SNCF", h, { weight: 0.22 });
          const tris = letters("SNCF", e > 0 ? w / 2 : -w / 2, cy - h / 2, h, e > 0, { weight: 0.22 });
          m.facets("ink", tris.map(([u, v]) => at(u, v, 0.024)), n);
        });
        m.scope("number plate", () => {
          surfacePanel(m, "bright", at, n, rect(-0.36, 2.31, 0.36, 2.46), 0.004, 0.02);
          surfacePanel(m, "ink", at, n, rect(-0.34, 2.325, 0.34, 2.445), 0.008, 0.026);
          const txt = `CC-${l.number}`;
          const h = 0.08, w = wordWidth(txt, h, { weight: 0.2 });
          const tris = letters(txt, e > 0 ? w / 2 : -w / 2, 2.385 - h / 2, h, e > 0, { weight: 0.2 });
          m.facets("white", tris.map(([u, v]) => at(u, v, 0.03)), n);
        });
      });
  });
}

/** The wipers parked on the windscreens, hanging from a pivot over each pane's middle (40101). */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const zc of [0.65, -0.65])
        m.scope(`${e > 0 ? "front" : "rear"} ${zc > 0 ? "left" : "right"}`, () => {
          const [y0, y1] = [SCREEN[1] - 0.05, SCREEN[0] + 0.12];
          const arm: Ring = [[zc - 0.015, y0], [zc + 0.015, y0], [zc + 0.35 * Math.sign(zc) + 0.015, y1], [zc + 0.35 * Math.sign(zc) - 0.015, y1]];
          surfacePanel(m, "rubber", at, n, ccw(arm), 0.024, 0.04);
        });
    }
  });
}

/** The handrail along the windscreens' foot. */
function screenRails(m: MeshBuilder): void {
  m.scope("screen handrails", () => {
    const y = CAB_FOOT + 0.04;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = e * (lerpTable(TIP, y) + 0.07);
        tubeX(m, "rim", 0.015, x, y, -1.1, x, y, 1.1, 6);
        for (const z of [-1.08, -0.35, 0.35, 1.08]) block(m, "steel", Math.min(x, e * (CAB - 0.01)), Math.max(x, e * (CAB - 0.01)), y - 0.013, y + 0.013, z - 0.012, z + 0.012);
      });
  });
}

/** The headstock under each nose with its red panel between the buffers, and the two grated step plates over it. */
function headstocks(m: MeshBuilder): void {
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [NOSE - 0.3, BEAM] : [-BEAM, -NOSE + 0.3];
        block(m, "headstock", a, b, 0.8, 1.48, -1.45, 1.45);
        const f = e * BEAM;
        block(m, "red", Math.min(f, f + e * 0.012), Math.max(f, f + e * 0.012), 0.88, 1.3, -0.62, 0.62);
        for (const s of [-1, 1]) {
          const [z0, z1] = s > 0 ? [0.4, 1.38] : [-1.38, -0.4];
          const [p0, p1] = e > 0 ? [NOSE - 0.04, NOSE + 0.3] : [-NOSE - 0.3, -NOSE + 0.04];
          block(m, "grate", p0, p1, LEDGE - 0.035, LEDGE - 0.005, z0, z1);
          for (const z of [z0 + 0.12, z1 - 0.12]) block(m, "steel", e > 0 ? p1 - 0.06 : p0 + 0.02, e > 0 ? p1 - 0.02 : p0 + 0.06, 1.485, LEDGE - 0.035, z - 0.015, z + 0.015);
        }
      });
  });
}

/** The headlight on the roof over each cab front: a round housing along x with its lens. */
function roofLamps(m: MeshBuilder): void {
  m.scope("roof headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const y = 3.93, x0 = e * (CAB - 0.6), x1 = e * (CAB + 0.3);
        const ring = ngon(12, 0.19, 0, 0, y);
        // the housing's walls only (its back end is buried in the roof), the lens and its rim on the front
        m.sweep("roofGrey", "x", ring, Math.min(x0, x1), ring, Math.max(x0, x1));
        const lens = ngon(12, 0.14, 0, 0, y), rim = ngon(12, 0.175, 0, 0, y);
        const f = x1;
        m.sweep("rim", "x", rim, Math.min(f, f + e * 0.02), rim, Math.max(f, f + e * 0.02));
        m.sweep("lampHead", "x", lens, Math.min(f + e * 0.01, f + e * 0.03), lens, Math.max(f + e * 0.01, f + e * 0.03));
      });
  });
}

/** The two horns beside each roof lamp. */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        for (const z of [-0.36, 0.36]) {
          const x0 = e * (CAB - 0.85), x1 = e * (CAB - 0.5);
          const bell = ngon(8, 0.065, 0, z, CROWN + 0.04), pipe = ngon(8, 0.03, 0, z, CROWN + 0.04);
          m.sweep("horn", "x", e > 0 ? pipe : bell, Math.min(x0, x1), e > 0 ? bell : pipe, Math.max(x0, x1));
          block(m, "steel", e * (CAB - 0.8) - 0.03, e * (CAB - 0.8) + 0.03, CROWN - 0.08, CROWN + 0.02, z - 0.03, z + 0.03);
        }
      });
  });
}

/** The row of skylights along each side of the roof hood, and the mesh panels on the rheostat box. */
function roofDetail(m: MeshBuilder): void {
  m.scope("skylights", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        for (let i = 0; i < 6; i++) {
          const x0 = -2.35 + i * 1.04;
          block(m, "glass", x0, x0 + 0.86, 3.98, 4.12, ...side(sd, 0.98, 1.035));
        }
      });
  });
  m.scope("rheostat mesh", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const zb = (y: number) => 0.86 - (0.14 * (y - 4.13)) / 0.31;
        for (let i = 0; i < 5; i++) {
          const x0 = -1.6 + i * 0.98, x1 = x0 + 0.9;
          for (const y of [4.17, 4.24, 4.31, 4.38]) block(m, "louvre", x0 + 0.03, x1 - 0.03, y, y + 0.03, ...side(sd, zb(y + 0.03) - 0.01, zb(y) + 0.012));
        }
      });
  });
}

/** The four single-arm pantographs, two over each end, hinges inboard and knees toward the cabs; the rear end's outer one raised. */
function pantographs(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      for (const [k, x] of [["outer", PANTO.outer], ["inner", PANTO.inner]] as const)
        m.scope(`${e > 0 ? "front" : "rear"} ${k} pantograph`, () =>
          singleArm(m, { xc: e * x, roofY: CROWN, baseY: PANTO.base, h: -e, raised: e < 0 && k === "outer", lower: PANTO.lower, upper: PANTO.upper }));
  });
}

/** The roof line: from each pair of pantographs on insulators to the hood. */
function roofLine(m: MeshBuilder): void {
  const y = 4.48;
  m.scope("roof line", () => {
    for (const e of [-1, 1]) {
      const end = e > 0 ? 4.0 : 2.6;
      for (const x of [end + 0.35, PANTO.inner + 0.75]) insulator(m, e * x, -0.35, CROWN - 0.01, y - 0.02);
      tubeX(m, "copper", 0.018, e * (end + 0.3), y, -0.35, e * (PANTO.outer - 0.6), y, -0.35, 6);
    }
  });
}

/** The monomotor C bogie: three wheelsets, axle boxes on tall coils, one motor driving them all. */
function monomotorBogie(m: MeshBuilder, xc: number): void {
  m.bogie(() => {
    const R = WHEEL_R, ft = FRAME_TOP, N = 16;
    const ay = R * Math.cos(Math.PI / N);
    for (const dx of AXLES)
      m.scope("wheelset", () => {
        const x = xc + dx;
        const axle = ngon(8, 0.08, 0, x, ay);
        m.sweep("steel", "z", axle, -1.0, axle, 1.0);
        for (const s of [-1, 1]) {
          sweepZ(m, "steel", ngon(N, R, Math.PI / N, x, ay), side(s, 0.665, 0.8));
          sweepZ(m, "wheel", ngon(12, R * 0.8, 0, x, ay), side(s, 0.8, 0.82));
          m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.15, Math.PI / 8, x, ay), side(s, 0.82, 1.04)));
          m.scope("primary suspension", () => {
            // a tall coil beside each axle box (40110)
            block(m, "bogie", x + 0.12, x + 0.46, ay + 0.33, ay + 0.37, ...side(s, 0.9, 1.06));
            coil(m, "spring", x + 0.29, s * 0.98, ay - 0.12, ay + 0.33, 0.1, 3, 6);
          });
        }
      });
    m.scope("motor", () => {
      const motor = ngon(12, 0.38, 0, xc - 0.8, ay + 0.06);
      m.sweep("bogie", "z", motor, -0.6, motor, 0.6);
      block(m, "bogie", xc - 1.6, xc + 1.6, ay - 0.22, ay + 0.26, 0.6, 0.72);
    });
    m.scope("frame", () => {
      const L = 1.6 + 0.62;
      for (const s of [-1, 1]) {
        const top: Ring = [[-L, ft]];
        const bottom: Ring = [[-L, ft - 0.2]];
        for (const [a, b] of [[-1.6, 0], [0, 1.6]] as const) {
          top.push([a + 0.5, ft], [a + 0.66, ft - 0.08], [b - 0.66, ft - 0.08], [b - 0.5, ft]);
          bottom.push([a + 0.5, ft - 0.2], [a + 0.66, ay - 0.04], [b - 0.66, ay - 0.04], [b - 0.5, ft - 0.2]);
        }
        top.push([L, ft]);
        bottom.push([L, ft - 0.2]);
        plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
      }
      for (const x of [xc - L + 0.05, xc + L - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, ft - 0.2, ft - 0.02, -1.0, 1.0);
    });
    m.scope("secondary suspension", () => {
      for (const s of [-1, 1]) for (const d of [-0.8, 0.8]) coil(m, "spring", xc + d, s * 1.18, ft - 0.38, ft + 0.02, 0.11, 2, 6);
      for (const s of [-1, 1]) block(m, "bogie", xc - 1.0, xc + 1.0, ft - 0.48, ft - 0.38, ...side(s, 1.0, 1.32));
    });
  });
}

/** The body's brackets over each bogie's springs; the grey equipment boxes between the bogies, panelled. */
function underBody(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("bogie brackets", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const d of [-0.8, 0.8])
        for (const s of [-1, 1]) block(m, "bogie", xc + d - 0.18, xc + d + 0.18, FRAME_TOP + 0.04, 0.96, ...side(s, 1.3, 1.44));
  });
  m.scope("equipment boxes", () => {
    const prof: Ring = [[-4.65, 0.95], [-4.4, 0.55], [4.4, 0.55], [4.65, 0.95]];
    m.sweep("underframe", "z", prof, -1.3, prof, 1.3);
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right seams" : "left seams", () => {
        for (let i = 0; i <= 8; i++) {
          const x = -4.0 + i * 1.0;
          block(m, "groove", x - 0.015, x + 0.015, 0.6, 0.93, ...side(sd, 1.29, 1.31));
        }
      });
  });
  void sp;
}

/** The CC 40100 in a livery. */
export function sncfCc40100(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    flutes(m, sp);
    grilles(m, sp);
    mouldings(m, sp);
    sideFittings(m, sp);
    sideNumbers(m, sp, l);
    faceEmblems(m, sp, l);
    wipers(m, sp);
    screenRails(m);
    headstocks(m);
    underBody(m, sp);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => monomotorBogie(m, xc));
  });
  m.scope("roof equipment", () => {
    roofLamps(m);
    horns(m);
    roofDetail(m);
    pantographs(m);
    roofLine(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function sncfCc40100Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
