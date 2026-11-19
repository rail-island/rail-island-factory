// The SNCF CC 6500 (proc-vehicle-sncf-cc6500): Alsthom's C'C' of 1969 - 1975,
// Paul Arzens's "nez casse" in its most powerful form (5,900 kW, 200 km/h, two
// monomotor bogies with their two gear ratios), on the box locomotive kit
// (boxLocoKit.ts) with its own profile, measured on the reference photographs
// (assets/sncf-cc6500/SOURCES.md):
//
// - the published figures: 20.19 m over the buffers, 3.0 m wide (3.066 m over the
//   plastic and stainless panels of the second and third series), 4.30 m high;
//   bogie centres 11.99 m, bogie wheelbase 3.216 m, 1.14 m wheels; 115 - 119 t;
// - side-on, 6530 at Paris-Lyon (2013, its near end): a 1-D projective fit over
//   the six axles (bogie centres 11.99 m, wheelbase 3.216 m) gives about
//   100 px/m at the cab door and 118 px/m upright there; the side-on 6558 at
//   Geneva fitted the same way over its axles, its ends and its seven equal
//   panels (36 px/m at the far cab door, 65 px/m at the near one, 62 px/m
//   upright); head-on, 6549 at Lyon-Perrache (2016), 128 px/m over the 3.0 m
//   face; 6545, 6527 and 6572 for the roof, the pantographs and the panels;
// - the broken nose: the face upright from the step ledge at 1.52 m to 2.45 m,
//   its top rounded over into the bonnet that rises gently to the cab front 0.54 m
//   back at 2.85 m; the windscreens above leaning forward 0.18 m to the visor at
//   3.62 m; the bonnet's side seam 0.87 m behind the face; the face 0.78 m
//   behind the buffers' heads, the headstock 0.15 m ahead of the face;
// - on the face: the two flat windscreens with a 0.26 m middle pillar, the
//   handrail along their foot, the SNCF disc in the band, a big headlight and a
//   small red-and-white lamp each side on a raised pod, the number plate between
//   them, the red marker lamps at the corners, the ledge of three step plates,
//   the headstock with the big rectangular buffers and the plough;
// - the side: the cab door 0.7 m wide over the outer axle, a handrail each side
//   of it, no cab side window; the grilles as each series had them - the first
//   series' long horizontal louvres between the bands (6501 - 6538), the
//   second's seven plastic panels set off toward one end (6539 - 6559, the
//   "Maurienne" units), the third's seven stainless panels in one frame, set off
//   the same way (6560 - 6574); "set off" turns about the middle: each side has
//   its panels toward the reader's right;
// - the roof: the raised hood in the middle with the louvred rheostat box, the
//   single-arm AM 18 pantographs over the bogies with their hinges toward the
//   cabs (knees inward), the rear raised; the horns on each cab roof; two
//   monomotor bogies, one motor each;
// - liveries: Arzens's "coup de soleil" in metallic grey with the Capitole red
//   field between two orange lines, rising behind each cab door to the roof's
//   edge, the dark grey cab sides and the red band across the nose (key
//   `capitole`, 6530, first series); the Maurienne units' dark blue-green with
//   white bands and their third-rail shoes (key `maurienne`, 6558 as delivered
//   in 1972, shoes until 1976); and the "beton" grey with one orange band
//   along the same line, worn only by 6512 and 6568 (key `beton`, 6568, third
//   series; drawn after the BB 22200's beton, no photograph of a CC on Commons).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, rect, roundRect, singleArm, surfaceDecal, surfacePanel, sweepZ, type ShellSpec } from "./czElectricKit.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Half the length over the buffers (20.19 m). */
const HALF = 10.095;
/** The headstock's face, the nose's face, the cab front at the windscreens' foot, the bonnet's side seam, |x|. */
const BEAM = 9.47;
const NOSE = 9.32;
const CAB = 8.78;
const SEAM = 8.45;
/** The body's bottom; the step ledge and the nose's foot; where the bonnet meets the cab front. */
const Y0 = 1.16;
const LEDGE = 1.52;
const FOOT = 1.55;
const CAB_FOOT = 2.85;
/** The windscreens' sill and head; the cab band's top (the visor); the side wall's top; the crown. */
const SCREEN: Span = [2.93, 3.52];
const BAND_TOP = 3.6;
const WALL_TOP = 3.7;
const CROWN = 4.02;
/** The body's half width (3.0 m; the gauge's 3.1 m keeps the handrails). */
const W = 1.5;

/**
 * The end's centre line [y, |x|], bottom first, measured on 6530's and 6558's sides:
 * the lower nose a little behind the face, the face upright from the ledge to 2.45 m,
 * its top rounded over into the bonnet that meets the cab front 0.54 m back at 2.85 m;
 * the cab front leaning out 0.18 m to the visor, the roof falling back to the crown.
 */
const TIP: Table = [
  [Y0, NOSE - 0.04], [LEDGE, NOSE - 0.04], [FOOT, NOSE], [2.45, NOSE + 0.005], [2.56, NOSE - 0.03], [2.64, NOSE - 0.09], [2.7, NOSE - 0.17], [2.75, NOSE - 0.27],
  [CAB_FOOT, CAB], [3.55, CAB + 0.15], [3.62, CAB + 0.18], [3.68, CAB + 0.16], [3.78, CAB + 0.09], [3.9, CAB], [CROWN, CAB - 0.1],
];
/** The half width: upright walls, the roof's rounded edge. */
const HW: Table = [[Y0, W], [3.66, W], [WALL_TOP, W - 0.03], [3.8, W - 0.12], [3.92, W - 0.32], [CROWN, W - 0.55]];
/** The corner's radius in plan by height: the bonnet's round corners, the cab front's tighter ones. */
const CORNER: Table = [[Y0, 0.24], [2.6, 0.3], [CAB_FOOT, 0.14], [3.62, 0.14], [3.8, 0.2], [CROWN, 0.3]];
/** The distant model's coarser profile. */
const LOD_TIP: Table = [[Y0, NOSE - 0.04], [LEDGE, NOSE - 0.04], [FOOT, NOSE], [2.5, NOSE], [2.75, NOSE - 0.27], [CAB_FOOT, CAB], [3.62, CAB + 0.18], [CROWN, CAB - 0.1]];
const LOD_HW: Table = [[Y0, W], [3.66, W], [CROWN, W - 0.55]];
const BOW = 0.015;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the end at height y. */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;

/** The cab door (frame), over the outer axle; its window. */
const DOOR: { x: Span; y: Span; win: Span } = { x: [6.92, 7.62], y: [FOOT + 0.04, 3.56], win: [2.97, 3.52] };
/** The livery's diagonal behind each cab door: its outer (cab-side) edge at height y, rising toward the cab at 45 degrees (6530, 6549). */
const diag = (y: number): number => 6.9 - (WALL_TOP - y) * 0.98;
/** The lower line, the forward field's top line and the top line under the roof's edge (6530: 2.02 - 2.15, 2.62 - 2.76, 3.5 - 3.62). */
const LOW: Span = [2.02, 2.15];
const MID: Span = [2.62, 2.76];
const TOP: Span = [3.5, 3.62];
/** The dark grey cab side's foot (the bonnet's top along the side). */
const CAB_SIDE = 2.91;

// --- liveries ----------------------------------------------------------------------

type Scheme = "arzens" | "maurienne" | "beton";
interface Cc6500Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  /** The distant model's side: the scheme's fields as plain bands (its budget has no room for the shapes). */
  lodSide?: readonly Band[];
  end: readonly Band[];
  number: string;
  scheme: Scheme;
  /** The grilles of the series the photographed unit belongs to. */
  series: 1 | 2 | 3;
}

const ORANGE = c("#ef7b1c", 0.4);
const CAB_GREY = c("#474d52", 0.35);
const SILVER: MaterialSpec = { color: "#b7bbbd", metallic: 0.45, roughness: 0.35 };
const CAPITOLE_RED = c("#a3202d", 0.35);

const LIVERIES: Record<string, Cc6500Livery> = {
  capitole: {
    title: "Capitole",
    palette: {
      body: SILVER, red: CAPITOLE_RED, orange: ORANGE, cabGrey: CAB_GREY, roofGrey: c("#8e9396", 0.6), headstock: CAPITOLE_RED,
      ink: c("#26282b", 0.6), plateField: CAPITOLE_RED, louvreRed: c("#6e1820", 0.6), pod: CAPITOLE_RED, logo: ORANGE,
    },
    side: [[Y0, 1.38, "red"], [1.38, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    lodSide: [[Y0, 1.38, "red"], [1.38, LOW[0], "body"], [LOW[0], LOW[1], "orange"], [LOW[1], TOP[0], "red"], [TOP[0], WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, FOOT, "body"], [FOOT, 2.03, "red"], [2.03, 2.13, "orange"], [2.13, 2.27, "red"], [2.27, CAB_FOOT, "body"], [CAB_FOOT, BAND_TOP, "cabGrey"], [BAND_TOP, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "6530",
    scheme: "arzens",
    series: 1,
  },
  maurienne: {
    title: "Maurienne green",
    palette: {
      body: c("#2a5a4b", 0.4), white: c("#ebece7"), roofGrey: c("#2c5246", 0.7), headstock: c("#2a5a4b", 0.5),
      ink: c("#ebece7"), plateField: c("#2a5a4b", 0.4), panelDark: c("#1d4035", 0.7), pod: c("#2a5a4b", 0.4), logo: c("#2a5a4b", 0.4),
    },
    side: [[Y0, 1.24, "body"], [1.24, 1.6, "white"], [1.6, 3.62, "body"], [3.62, 3.74, "white"], [3.74, 4.4, "roofGrey"]],
    end: [[Y0, 2.09, "body"], [2.09, 2.25, "white"], [2.25, 3.62, "body"], [3.62, 3.74, "white"], [3.74, 4.4, "roofGrey"]],
    number: "6558",
    scheme: "maurienne",
    series: 2,
  },
  beton: {
    title: "Beton",
    palette: {
      body: c("#a4a7a5", 0.55), orange: ORANGE, cabGrey: CAB_GREY, roofGrey: c("#7f8486", 0.65), darkGrey: c("#50555a", 0.6), headstock: c("#50555a", 0.6),
      ink: c("#26282b", 0.6), plateField: c("#50555a", 0.6), pod: c("#a4a7a5", 0.55), logo: ORANGE,
    },
    side: [[Y0, 1.38, "darkGrey"], [1.38, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    lodSide: [[Y0, 1.38, "darkGrey"], [1.38, 2.0, "body"], [2.0, 2.2, "orange"], [2.2, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, FOOT, "darkGrey"], [FOOT, 2.0, "body"], [2.0, 2.2, "orange"], [2.2, CAB_FOOT, "body"], [CAB_FOOT, BAND_TOP, "cabGrey"], [BAND_TOP, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "6568",
    scheme: "beton",
    series: 3,
  },
};

export const CC6500_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Cc6500Livery => LIVERIES[resolveParams(CC6500_PARAMS, v).livery!]!;

// --- the spec ----------------------------------------------------------------------

/** The single-arm pantographs: base centre |x|, base height, arm lengths. */
const PANTO = { x: 5.75, base: 4.24, lower: 1.75, upper: 1.6 } as const;
/** The bogies' centres (11.99 m apart), the axles' offsets (3.216 m wheelbase), the wheels' radius (1.14 m). */
const BOGIE_X = 5.995;
const AXLES = [-1.608, 0, 1.608] as const;
const WHEEL_R = 0.57;
const FRAME_TOP = 0.93;

/** The paint along the side, front half (mirrored to the rear): the scheme's fields as convex pieces. */
function sidePaint(l: Cc6500Livery): SideItem[] {
  const p = (name: string, mat: string, layer: number, poly: Ring): SideItem => {
    const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
    return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, mirror: true, layer, poly };
  };
  const cabSide = p("cab side", "cabGrey", 1, [[diag(CAB_SIDE), CAB_SIDE], [sideEnd(CAB_SIDE), CAB_SIDE], [sideEnd(WALL_TOP), WALL_TOP], [diag(WALL_TOP), WALL_TOP]]);
  if (l.scheme === "arzens")
    return [
      // the orange under the red: the lower line and the forward field's frame, the frame round the big field
      p("orange forward", "orange", 1, [[0, LOW[0]], [8.52, LOW[0]], [8.8, 2.5], [8.62, MID[1]], [0, MID[1]]]),
      p("orange field", "orange", 1, [[0, MID[1]], [diag(MID[1]), MID[1]], [diag(TOP[1]), TOP[1]], [0, TOP[1]]]),
      p("red forward", "red", 2, [[0, LOW[1]], [8.4, LOW[1]], [8.6, 2.5], [8.48, MID[0]], [0, MID[0]]]),
      p("red field", "red", 2, [[0, MID[0]], [diag(MID[0]) - 0.2, MID[0]], [diag(TOP[0]) - 0.2, TOP[0]], [0, TOP[0]]]),
      cabSide,
    ];
  if (l.scheme === "beton")
    return [
      p("orange line", "orange", 1, [[0, 2.0], [sideEnd(2.0), 2.0], [sideEnd(2.2), 2.2], [0, 2.2]]),
      p("orange diagonal", "orange", 1, [[diag(2.2) - 0.2, 2.2], [diag(2.2), 2.2], [diag(TOP[0]), TOP[0]], [diag(TOP[0]) - 0.2, TOP[0]]]),
      p("orange top", "orange", 1, [[0, TOP[0]], [diag(TOP[0]), TOP[0]], [diag(TOP[1]), TOP[1]], [0, TOP[1]]]),
      cabSide,
    ];
  return [];
}

function spec(l: Cc6500Livery, lod = false): LocoSpec {
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), groove: c("#2a2c2e", 0.7), amber: c("#f0a020", 0.35), louvre: c("#25282b", 0.85), slat: c("#3a3e42", 0.7),
      bogie: c("#34373a", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      plough: c("#6a6f73", 0.6), inox: { color: "#c3c7c9", metallic: 0.6, roughness: 0.3 }, inoxRib: { color: "#9ea3a6", metallic: 0.6, roughness: 0.35 },
      roofBox: c("#8a8f92", 0.6), horn: c("#9ca1a4", 0.4), white: c("#ebece7"),
      ...l.palette,
    },
    y0: Y0,
    tip: lod ? LOD_TIP : TIP,
    hw: lod ? LOD_HW : HW,
    endPlan,
    corner: "end",
    side: lod ? (l.lodSide ?? l.side) : l.side,
    end: l.end,
    roof: "roofGrey",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.9, y1: Y0, half: 9.2, hw: 1.38, mat: "underframe" },
    bogies: lod ? [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: AXLES, wheelR: WHEEL_R, frameTop: FRAME_TOP })) : [],
    // the full model draws its pantographs and bogies itself; the distant model takes the kit's
    ...(lod ? { pantograph: { kind: "singleArm" as const, x: PANTO.x, roofY: CROWN, baseY: PANTO.base, lower: PANTO.lower, upper: PANTO.upper } } : {}),
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, win: DOOR.win, rails: true, mirror: true },
      ...sidePaint(l),
      { kind: "paint", name: "bonnet seam", x: [SEAM - 0.012, SEAM + 0.012], y: [FOOT + 0.02, CAB_SIDE - 0.02], mat: "groove", mirror: true, layer: 3 },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.13, 1.23], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.23, -0.13], y: SCREEN, mat: "rubber" },
      { kind: "paint", name: "lamp pod left", z: [0.4, 1.02], y: [1.64, 1.92], mat: "pod", layer: 2, poly: roundRect(0.4, 1.02, 1.64, 1.92, 0.12) },
      { kind: "paint", name: "lamp pod right", z: [-1.02, -0.4], y: [1.64, 1.92], mat: "pod", layer: 2, poly: roundRect(-1.02, -0.4, 1.64, 1.92, 0.12) },
      { kind: "lamp", name: "headlight left", z: [0.7, 0.96], y: [1.65, 1.91], r: 0.11 },
      { kind: "lamp", name: "red lamp left", z: [0.47, 0.65], y: [1.69, 1.87], r: 0.075, mat: "lampRed" },
      { kind: "lamp", name: "headlight right", z: [-0.96, -0.7], y: [1.65, 1.91], r: 0.11 },
      { kind: "lamp", name: "red lamp right", z: [-0.65, -0.47], y: [1.69, 1.87], r: 0.075, mat: "lampRed" },
      { kind: "lamp", name: "marker left", z: [1.17, 1.27], y: [1.7, 1.84], rect: true, mat: "lampRed" },
      { kind: "lamp", name: "marker right", z: [-1.27, -1.17], y: [1.7, 1.84], rect: true, mat: "lampRed" },
    ],
    roofItems: [
      { name: "roof hood", x: [-4.3, 4.3], w: [0.92, 0.88], y: [CROWN - 0.02, 4.13], mat: "roofBox" },
      { name: "rheostat", x: [-2.3, 1.5], w: [0.8, 0.74], y: [4.12, 4.46], mat: "roofBox" },
    ],
    underItems: lod ? [[-2.9, 1.9, 0.5, 0.9, 1.2]] : [],
    number: l.number,
  };
}

// --- what the kit does not draw -----------------------------------------------------

/** The side's grilles, by series: right side as given, left side turned about the middle (each side's panels toward the reader's right). */
function grilles(m: MeshBuilder, sp: ShellSpec, l: Cc6500Livery): void {
  m.scope("grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const wind = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        // x on the right side; the left side's is turned about the middle
        const rr = (x0: number, x1: number, y0: number, y1: number): Ring => (sd > 0 ? rect(x0, y0, x1, y1) : rect(-x1, y0, -x0, y1));
        const vent = (x0: number, x1: number, y0: number, y1: number, mat: string) => {
          surfacePanel(m, "louvre", at, n, rr(x0, x1, y0, y1), -0.006, 0.011);
          const slots: Ring[] = [];
          for (let i = 0; i < 5; i++) {
            const a = x0 + 0.04 + i * ((x1 - x0 - 0.08) / 5), b = a + (x1 - x0 - 0.08) / 5 - 0.05;
            slots.push(wind(rr(a + 0.05, b + 0.05, y0 + 0.04, y1 - 0.04)));
          }
          surfaceDecal(m, mat, at, n, slots, 0.015);
        };
        if (l.series === 1) {
          // the long horizontal louvres between the bands, their ends parallel to the diagonals (6530)
          const yb = 2.58, yt = 3.44, xe = (y: number) => diag(y) - 1.15;
          const trap: Ring = [[-xe(yb), yb], [xe(yb), yb], [xe(yt), yt], [-xe(yt), yt]];
          m.scope("louvres", () => surfacePanel(m, "louvreRed", at, n, wind(trap), -0.006, 0.009));
          const slats: Ring[] = [];
          for (let y = yb + 0.04; y + 0.035 < yt - 0.02; y += 0.086) {
            const a = xe(y) - 0.05, b = xe(y + 0.035) - 0.05;
            slats.push(wind([[-a, y], [a, y], [b, y + 0.035], [-b, y + 0.035]]));
          }
          m.scope("slats", () => surfaceDecal(m, "red", at, n, slats, 0.013));
          m.scope("vent", () => vent(5.2, 5.66, 1.8, 2.32, "red"));
        } else if (l.series === 2) {
          // seven plastic panels, 1.46 m each, ribbed upright, set off toward the reader's right (6558)
          const [y0, y1] = [2.13, 3.55];
          m.scope("panels", () => {
            for (let i = 0; i < 7; i++) {
              const a = -3.34 + i * 1.46, b = a + 1.46;
              surfacePanel(m, "panelDark", at, n, rr(a + 0.015, b - 0.015, y0, y1), -0.006, 0.009);
            }
          });
          const ribs: Ring[] = [];
          for (let i = 0; i < 7; i++) {
            const a = -3.34 + i * 1.46;
            for (let k = 0; k < 22; k++) {
              const x = a + 0.06 + k * 0.0636;
              ribs.push(wind(rr(x, x + 0.03, y0 + 0.03, y1 - 0.03)));
            }
          }
          m.scope("ribs", () => surfaceDecal(m, "body", at, n, ribs, 0.013));
          m.scope("lower vents", () => {
            for (let i = 0; i < 7; i++) {
              const a = 3.88 + i * 0.43;
              surfacePanel(m, "panelDark", at, n, rr(a, a + 0.37, 1.74, 2.06), -0.006, 0.009);
            }
          });
        } else {
          // seven stainless panels ribbed upright in one recessed frame, set off toward the reader's right (6572)
          const [x0, x1, y0, y1] = [-3.34, 6.88, 2.34, 3.42];
          m.scope("frame", () => surfacePanel(m, "groove", at, n, rr(x0, x1, y0, y1), -0.006, 0.007));
          m.scope("panels", () => {
            for (let i = 0; i < 7; i++) {
              const a = x0 + i * 1.46;
              surfacePanel(m, "inox", at, n, rr(a + 0.03, a + 1.43, y0 + 0.04, y1 - 0.04), -0.004, 0.01);
            }
          });
          const ribs: Ring[] = [];
          for (let i = 0; i < 7; i++)
            for (let k = 0; k < 20; k++) {
              const x = x0 + i * 1.46 + 0.07 + k * 0.066;
              ribs.push(wind(rr(x, x + 0.025, y0 + 0.06, y1 - 0.06)));
            }
          m.scope("ribs", () => surfaceDecal(m, "inoxRib", at, n, ribs, 0.014));
          m.scope("vent", () => vent(6.18, 6.62, 1.62, 1.94, "body"));
        }
      });
  });
}

/** "SNCF" and the running number on each side: where each scheme put them (6530, 6558, 6572). */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Cc6500Livery): void {
  const words: Array<[string, number, number, number]> =
    l.scheme === "maurienne"
      ? [["SNCF", -5.55, 3.1, 0.2], [`CC ${l.number}`, -5.55, 2.32, 0.2]]
      : [["SNCF", -2.7, 1.56, 0.24], [`CC ${l.number}`, 4.9, 1.6, 0.17]];
  m.scope("lettering", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        for (const [txt, cx, y, h] of words) {
          const w = wordWidth(txt, h, { weight: 0.17 });
          const u = sd * cx;
          const tris = letters(txt, sd > 0 ? u - w / 2 : u + w / 2, y, h, sd < 0, { weight: 0.17 });
          m.facets("ink", tris.map(([a, b]) => at(a, b, 0.009)), [0, 0, sd]);
        }
      });
  });
}

/** The SNCF disc in the nose's band: the disc, its white ring and letters (6549, 6558). */
function noseLogos(m: MeshBuilder, sp: ShellSpec, l: Cc6500Livery): void {
  const cy = l.scheme === "maurienne" ? 2.17 : l.scheme === "beton" ? 2.1 : 2.08;
  m.scope("sncf discs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        surfacePanel(m, "white", at, n, ngon(16, 0.19, 0, 0, cy), -0.004, 0.012);
        surfacePanel(m, "logo", at, n, ngon(16, 0.165, 0, 0, cy), 0.0, 0.016);
        const h = 0.07, w = wordWidth("SNCF", h, { weight: 0.2 });
        const tris = letters("SNCF", e > 0 ? w / 2 : -w / 2, cy - h / 2, h, e > 0, { weight: 0.2 });
        m.facets("white", tris.map(([u, v]) => at(u, v, 0.02)), n);
      });
  });
}

/** The number plate between the lamps: a white border, the field, white figures. */
function frontPlates(m: MeshBuilder, sp: ShellSpec, l: Cc6500Livery): void {
  m.scope("number plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        surfacePanel(m, "white", at, n, rect(-0.31, 1.71, 0.31, 1.9), -0.01, 0.02);
        surfacePanel(m, "plateField", at, n, rect(-0.285, 1.73, 0.285, 1.88), 0.0, 0.026);
        const h = 0.1, w = wordWidth(l.number, h, { weight: 0.2 });
        const tris = letters(l.number, e > 0 ? w / 2 : -w / 2, 1.805 - h / 2, h, e > 0, { weight: 0.2 });
        m.facets("white", tris.map(([u, v]) => at(u, v, 0.03)), n);
      });
  });
}

/** The wipers parked on the windscreens, both hanging the same way from a pivot over the glass (6549). */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const zc of [0.68, -0.68])
        m.scope(`${e > 0 ? "front" : "rear"} ${zc > 0 ? "left" : "right"}`, () => {
          // seen from ahead both arms run from the pivot (reader's right of the pane) down to the reader's left
          const u = (dz: number) => (e > 0 ? -1 : 1) * (zc + dz);
          const s = e > 0 ? 1 : -1;
          const [y0, y1] = [SCREEN[1] - 0.06, SCREEN[0] + 0.12];
          const arm: Ring = [[u(-s * 0.2) - 0.015, y0], [u(-s * 0.2) + 0.015, y0], [u(s * 0.3) + 0.015, y1], [u(s * 0.3) - 0.015, y1]];
          // counter-clockwise in (u, v), as rect() is
          const area = arm.reduce((a, p, i) => { const q = arm[(i + 1) % arm.length]!; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
          surfacePanel(m, "rim", at, n, area > 0 ? arm : [...arm].reverse(), 0.024, 0.04);
        });
    }
  });
}

/** The handrail along the windscreens' foot; the grab rail on each bonnet side. */
function handrails(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("handrails", () => {
    const y = CAB_FOOT + 0.08;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = e * (lerpTable(TIP, y) + 0.08);
        tubeX(m, "rim", 0.016, x, y, -1.22, x, y, 1.22, 6);
        for (const z of [-1.2, -0.4, 0.4, 1.2]) block(m, "steel", Math.min(x, e * (CAB - 0.02)), Math.max(x, e * (CAB - 0.02)), y - 0.015, y + 0.015, z - 0.012, z + 0.012);
      });
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const yy = 2.78, z = sd * (sp.hw(yy) + 0.035);
          tubeX(m, "rim", 0.014, e * 7.75, yy, z, e * 8.3, yy, z, 6);
          for (const x of [7.77, 8.28]) block(m, "steel", e * x - 0.012, e * x + 0.012, yy - 0.012, yy + 0.012, ...side(sd, sp.hw(yy) - 0.01, sp.hw(yy) + 0.04));
        });
  });
}

/** The ledge of step plates along the nose's foot (6549: three, the middle one short). */
function stepLedges(m: MeshBuilder): void {
  m.scope("step plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [NOSE - 0.06, NOSE + 0.13] : [-NOSE - 0.13, -NOSE + 0.06];
        for (const [z0, z1] of [[-1.48, -0.6], [-0.26, 0.26], [0.6, 1.48]] as const) {
          block(m, "rim", a, b, LEDGE - 0.03, LEDGE + 0.005, z0, z1);
          for (const z of [z0 + 0.12, z1 - 0.12]) block(m, "steel", e > 0 ? a : b - 0.04, e > 0 ? a + 0.04 : b, LEDGE - 0.16, LEDGE - 0.03, z - 0.015, z + 0.015);
        }
      });
  });
}

/** The headstock under each nose, carrying the buffers and the coupling; the plough under it. */
function headstocks(m: MeshBuilder): void {
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [8.9, BEAM] : [-BEAM, -8.9];
        block(m, "headstock", a, b, 0.84, Y0 + 0.012, -1.46, 1.46);
      });
  });
  m.scope("ploughs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        // a curved plate from the headstock's foot down and forward to the lip, wider at the lip (6549, 6558)
        const prof: Array<[number, number, number]> = [[0.62, 9.3, 1.0], [0.4, 9.4, 1.12], [0.26, 9.5, 1.2], [0.2, 9.54, 1.22]];
        for (let i = 0; i + 1 < prof.length; i++) {
          const [ya, xa, wa] = prof[i]!, [yb, xb, wb] = prof[i + 1]!;
          const ring = (x: number, w: number): Ring => (e > 0 ? [[x, -w], [x, w], [x - 0.05, w], [x - 0.05, -w]] : [[-x, w], [-x, -w], [-x + 0.05, -w], [-x + 0.05, w]]);
          m.loft("plough", ring(xb, wb), yb, ring(xa, wa), ya, i === 0);
          if (i + 2 === prof.length) m.cap("plough", ring(xb, wb), yb, false);
        }
        // the brackets to the headstock
        for (const z of [-0.7, 0.7]) block(m, "underframe", e > 0 ? 9.0 : -9.38, e > 0 ? 9.38 : -9.0, 0.58, 0.86, z - 0.05, z + 0.05);
      });
  });
}

/** The horns on each cab roof, behind the visor, and the cab roof's small box. */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        for (const [z, len] of [[-0.42, 0.34], [-0.62, 0.26]] as const) {
          const x0 = e * 8.25, x1 = e * (8.25 + len);
          const bell = ngon(8, 0.07, 0, z, CROWN + 0.09), pipe = ngon(8, 0.035, 0, z, CROWN + 0.09);
          m.sweep("horn", "x", e > 0 ? pipe : bell, Math.min(x0, x1), e > 0 ? bell : pipe, Math.max(x0, x1));
          block(m, "steel", e * 8.3 - 0.03, e * 8.3 + 0.03, CROWN - 0.02, CROWN + 0.06, z - 0.03, z + 0.03);
        }
        block(m, "roofBox", e > 0 ? 7.6 : -8.1, e > 0 ? 8.1 : -7.6, CROWN - 0.02, CROWN + 0.1, 0.2, 0.62);
      });
  });
}

/** The louvres along the rheostat box's sides. */
function rheostatLouvres(m: MeshBuilder): void {
  m.scope("rheostat louvres", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const zb = (y: number) => 0.8 - (0.06 * (y - 4.12)) / 0.34;
        for (let i = 0; i < 4; i++) {
          const x0 = -2.2 + i * 0.92, x1 = x0 + 0.84;
          block(m, "louvre", x0, x1, 4.16, 4.42, ...side(sd, zb(4.42) - 0.01, zb(4.16) + 0.006));
          for (const y of [4.21, 4.29, 4.37]) block(m, "slat", x0 + 0.03, x1 - 0.03, y, y + 0.016, ...side(sd, zb(y) - 0.01, zb(y) + 0.02));
        }
      });
  });
}

/** The two single-arm pantographs, their hinges toward the cabs and their knees inward; the rear raised. */
function pantographs(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front pantograph" : "rear pantograph", () =>
        singleArm(m, { xc: e * PANTO.x, roofY: 4.13, baseY: PANTO.base, h: e, raised: e < 0, lower: PANTO.lower, upper: PANTO.upper }));
  });
}

/** The roof line: from each pantograph on two insulators to the breaker on the hood. */
function roofLine(m: MeshBuilder): void {
  const y = 4.5;
  m.scope("roof line", () => {
    for (const e of [-1, 1]) {
      for (const x of [2.4, 3.4]) insulator(m, e * x, 0.3, 4.12, y - 0.02);
      tubeX(m, "copper", 0.018, e * 2.35, y, 0.3, e * (PANTO.x - 0.6), y, 0.3, 6);
      block(m, "roofBox", e > 0 ? 1.7 : -2.35, e > 0 ? 2.35 : -1.7, 4.12, 4.36, -0.55, -0.1);
    }
  });
}

/** The monomotor C bogie: three wheelsets, axle boxes on coils, one motor driving them all. */
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
          m.scope("axle box", () => sweepZ(m, "bogie", ngon(8, 0.16, Math.PI / 8, x, ay), side(s, 0.82, 1.04)));
          m.scope("primary suspension", () => {
            // one big coil over each axle box (6530, 6558)
            block(m, "bogie", x - 0.2, x + 0.2, ay + 0.33, ay + 0.37, ...side(s, 0.9, 1.06));
            coil(m, "spring", x, s * 0.98, ay + 0.1, ay + 0.33, 0.1, 2, 6);
          });
        }
      });
    m.scope("motor", () => {
      // the one motor between the middle and an outer axle, its gear case along the axles
      const motor = ngon(12, 0.4, 0, xc - 0.8, ay + 0.06);
      m.sweep("bogie", "z", motor, -0.6, motor, 0.6);
      block(m, "bogie", xc - 1.6, xc + 1.6, ay - 0.22, ay + 0.26, 0.6, 0.72);
    });
    m.scope("frame", () => {
      const L = 1.608 + 0.66;
      for (const s of [-1, 1]) {
        const top: Ring = [[-L, ft]];
        const bottom: Ring = [[-L, ft - 0.18]];
        for (const [a, b] of [[-1.608, 0], [0, 1.608]] as const) {
          top.push([a + 0.34, ft], [a + 0.56, ft - 0.1], [b - 0.56, ft - 0.1], [b - 0.34, ft]);
          bottom.push([a + 0.3, ft - 0.18], [a + 0.52, ay - 0.06], [b - 0.52, ay - 0.06], [b - 0.3, ft - 0.18]);
        }
        top.push([L, ft]);
        bottom.push([L, ft - 0.18]);
        plate(m, "bogie", top.map(([u, v]) => [xc + u, v]), bottom.map(([u, v]) => [xc + u, v]), ...side(s, 0.92, 1.08));
      }
      for (const x of [xc - L + 0.05, xc + L - 0.05]) block(m, "bogie", x - 0.05, x + 0.05, ft - 0.18, ft - 0.02, -1.0, 1.0);
    });
    m.scope("secondary suspension", () => {
      for (const s of [-1, 1]) for (const d of [-0.8, 0.8]) coil(m, "spring", xc + d, s * 1.18, ft - 0.38, ft + 0.02, 0.11, 2, 6);
      for (const s of [-1, 1]) block(m, "bogie", xc - 1.0, xc + 1.0, ft - 0.48, ft - 0.38, ...side(s, 1.0, 1.32));
    });
  });
}

/** The Maurienne units' third-rail shoes: a beam along each bogie's side, a shoe hanging from it (1972 - 1976). */
function thirdRailShoes(m: MeshBuilder): void {
  m.scope("third rail shoes", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const s of [-1, 1])
        m.scope(`${xc > 0 ? "front" : "rear"} ${s > 0 ? "right" : "left"}`, () => {
          block(m, "underframe", xc - 1.0, xc + 1.0, 0.36, 0.44, ...side(s, 1.08, 1.16));
          for (const d of [-0.9, 0.9]) block(m, "underframe", xc + d - 0.04, xc + d + 0.04, 0.44, FRAME_TOP - 0.18, ...side(s, 1.06, 1.12));
          block(m, "steel", xc - 0.3, xc + 0.3, 0.2, 0.36, ...side(s, 1.14, 1.42));
          block(m, "steel", xc - 0.22, xc + 0.22, 0.16, 0.2, ...side(s, 1.24, 1.44));
        });
  });
}

/** The body's grey brackets over each bogie's springs; the tank box between the bogies. */
function underBody(m: MeshBuilder): void {
  m.scope("bogie brackets", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const d of [-0.8, 0.8])
        for (const s of [-1, 1]) block(m, "bogie", xc + d - 0.18, xc + d + 0.18, FRAME_TOP + 0.04, Y0 + 0.01, ...side(s, 1.3, 1.44));
  });
  m.scope("tank box", () => {
    // the angled box between the bogies (6530): its ends slope in toward its foot
    const side0: Ring = [[-2.9, 0.92], [-2.5, 0.5], [1.5, 0.5], [1.9, 0.92]];
    m.sweep("underframe", "z", side0, -1.22, side0, 1.22);
  });
}

/** The CC 6500 in a livery. */
export function sncfCc6500(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    grilles(m, sp, l);
    sideLettering(m, sp, l);
    noseLogos(m, sp, l);
    frontPlates(m, sp, l);
    wipers(m, sp);
    handrails(m, sp);
    stepLedges(m);
    headstocks(m);
    underBody(m);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => monomotorBogie(m, xc));
    if (l.scheme === "maurienne") thirdRailShoes(m);
  });
  m.scope("roof equipment", () => {
    horns(m);
    rheostatLouvres(m);
    pantographs(m);
    roofLine(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function sncfCc6500Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
