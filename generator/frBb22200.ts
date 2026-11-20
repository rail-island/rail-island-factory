// The SNCF BB 22200 (proc-vehicle-sncf-bb22200): Alsthom and MTE's dual-voltage
// B'B' of 1976 - 1986 (1.5 kV DC and 25 kV 50 Hz), the BB 7200 / 15000 / 22200
// "nez casse" family's third member, on the box locomotive kit (boxLocoKit.ts)
// with its own profile and parts, measured on the reference photographs
// (assets/sncf-bb22200/SOURCES.md):
//
// - the published figures: 17.48 m over the buffers, 3.053 m wide, 4.311 m high,
//   bogie centres 9.694 m, 2.8 m wheelbase, 1.25 m wheels, 90 t; two AM 18
//   single-arm pantographs, one for each current; the body is the BB 7200's, the
//   one the NS 1600 / 1700 also ride on (nl1700.ts measured it at 69 px/m);
// - side-on, 22274 at Amiens (the right side, cab 2 to the right), 522230 at
//   Paris-Nord and 22342 at Amiens (the left side): a 1-D projective fit over the
//   four cab-door edges (|x| 6.33 and 6.84) gives the grille 9.07 m long, set off
//   0.17 m toward cab 1 (-4.45 .. 4.62 with cab 1 at +x), the air tanks under the
//   frame from -1.95 to 1.75; the roof's own fit over the visor's ends puts the
//   DC pantograph's base 4.7 m from the middle toward cab 2, its knee pointing to
//   cab 2, the AC one's hinge 4.3 m toward cab 1 with its knee pointing inward,
//   and the louvred resistor box from -1.9 to 1.1; heights at the cab door at
//   79 px/m (22342): the beton's lower band 2.20 - 2.46 m, its top band
//   3.43 - 3.62 m, the grille 2.22 - 3.42 m, the cab's dark grey above 2.83 m;
//   the nose at 91 px/m: the ledge at 1.64 m, the lamps' centre 1.87 - 1.9 m, the
//   "SNCF" plate 2.12 - 2.37 m, the mesh band 1.42 - 1.60 m;
// - head-on, 22223 at Bercy (105 px/m over the 3.0 m face): the big headlights
//   at |z| 0.94, the red lamps at 0.63, the marker lamps at 1.37, the box between
//   the lamps 0.74 m wide, the windscreens from |z| 0.19 to 1.40 either side of
//   the pillar with its two small boxes;
// - the broken nose as on the NS 1700: the lower nose standing 0.6 m ahead of the
//   cab front, upright from the ledge to 2.43 m and rounded over into its almost
//   flat top, the windscreens above leaning forward to the visor; under the
//   ledge the recessed mesh band and the headstock with the big rectangular
//   buffers, the plough below; the handrail along the windscreens' foot, the
//   horns on each cab roof pointing ahead;
// - the side: the full-height cab door with its high window, its grab rails and
//   the step in its foot, the long stainless filter grille between the doors
//   (no machine-room window), the painted cab numbers;
// - liveries (each side's markings turn with the side: what stands at the
//   reader's left on one side stands at the reader's left on the other):
//   * `beton` (22342, as in 2015): the light "beton" grey, the orange band along
//     the nose under the cast SNCF plate (dropping to 2.07 m under it), running
//     back past the cab door and turning up behind it at 55 degrees to the top
//     band under the roof's edge, which joins the two ends; the dark grey cab
//     above the nose, the orange mesh band, the dark grey headstock; the
//     carmillon SNCF logo behind the cab door at the reader's right, the town's
//     arms in the middle, the number at the reader's left;
//   * `enVoyage` (522266): metallic silver, the nose sky blue from the ledge to a
//     white line at 2.3 m under a grey band, the number on a blue plate; along
//     each side the "en voyage" sky of blue and white clouds up to the same
//     white line, the logo ahead of the cab door;
//   * `fret` (422369 and 422275): Fret SNCF's grey, the green nose; at the
//     reader's left the green sweeps back over the cab door to the roof's edge
//     and ends in a slanted line over the grille's first third, the white FRET
//     panel and the white stripe along the roof's edge continuing it; the big
//     white number on the green.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type LocoSpec, type SideItem, type EndItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, rect, roundRect, singleArm, surfacePanel, sweepZ, type Place, type ShellSpec } from "./czElectricKit.ts";
import { coil, lettering, letteringWidth, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth, type LetterStyle } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Half the length over the buffers (17.48 m). */
const HALF = 8.74;
/** The headstock's face under the nose, the nose's face, the cab front at the windscreens' foot, |x|. */
const BEAM = 8.26;
const NOSE = 8.36;
const CAB = 7.76;
/** The body's bottom; the ledge along the nose's foot; where the nose's top meets the cab front. */
const Y0 = 1.18;
const FOOT = 1.64;
const CAB_FOOT = 2.83;
/** The mesh band under the ledge, on the headstock's face. */
const MESH: Span = [1.42, 1.6];
/** The windscreens' sill and head; the cab colour's top on the face; the side wall's top; the crown. */
const SCREEN: Span = [2.93, 3.53];
const BAND_TOP = 3.58;
const WALL_TOP = 3.7;
const CROWN = 4.0;
/** The body's half width: 3.0 m (3.053 m over the handrails' brackets; the gauge's 3.1 m keeps them). */
const W = 1.5;

/**
 * The end's centre line [y, |x|], bottom first (the NS 1700's, the same body): the
 * headstock, the nose upright to 2.43 m and rounding over to its sloping top, which
 * meets the cab front 0.6 m back at 2.83 m; the cab front leaning out to the visor
 * at 3.62 m; the roof falling back to the crown.
 */
const TIP: Table = [
  [Y0, BEAM], [FOOT - 0.04, BEAM], [FOOT, NOSE], [2.43, NOSE + 0.01], [2.58, NOSE - 0.08], [2.68, NOSE - 0.2], [2.75, NOSE - 0.31],
  [CAB_FOOT, CAB], [3.57, CAB + 0.14], [3.62, CAB + 0.17], [3.67, CAB + 0.15], [3.77, CAB + 0.08], [3.88, CAB], [CROWN, CAB - 0.1],
];
const HW: Table = [[Y0, W], [3.64, W], [WALL_TOP, W - 0.03], [3.8, W - 0.12], [3.92, W - 0.32], [CROWN, W - 0.55]];
/** The corner's radius in plan by height: the nose's round corners, the cab front's tighter ones. */
const CORNER: Table = [[Y0, 0.3], [2.75, 0.3], [CAB_FOOT, 0.14], [3.62, 0.14], [3.8, 0.2], [CROWN, 0.3]];
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

/** The cab door (frame, full height with the step in its foot), its window. */
const DOOR = { x: [6.33, 6.84] as Span, y: [Y0 + 0.05, 3.6] as Span, win: [2.95, 3.5] as Span };
/** The stainless filter grille between the doors, set off toward cab 1 (+x). */
const GRILLE = { x: [-4.45, 4.62] as Span, y: [2.22, 3.42] as Span };

// --- liveries ----------------------------------------------------------------------

type Scheme = "beton" | "enVoyage" | "fret";
interface Bb22200Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  /** The distant model's side, when the full model's fields are not bands. */
  lodSide?: readonly Band[];
  end: readonly Band[];
  /** The running number (the photographed unit). */
  number: string;
  scheme: Scheme;
}

const SILVER: MaterialSpec = { color: "#bfc3c6", metallic: 0.45, roughness: 0.35 };
const ORANGE = c("#ee7526", 0.45);
const WHITE = c("#eeefec");

const LIVERIES: Record<string, Bb22200Livery> = {
  beton: {
    title: "Beton",
    palette: {
      body: c("#b2b6b7", 0.55), orange: ORANGE, cabGrey: c("#687075", 0.5), roofGrey: c("#7c8286", 0.65), lower: c("#4e5458", 0.6),
      mesh: ORANGE, bracket: c("#a9adae", 0.6), plateField: c("#2a2c2f", 0.5), plateInk: c("#d9dcdd", 0.3), ink: c("#4a5055", 0.6), box: c("#4e5458", 0.6),
    },
    side: [[Y0, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    lodSide: [[Y0, 3.43, "body"], [3.43, 3.62, "orange"], [3.62, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, MESH[0], "lower"], [MESH[0], MESH[1], "orange"], [MESH[1], 2.2, "body"], [2.2, 2.46, "orange"], [2.46, CAB_FOOT, "body"], [CAB_FOOT, BAND_TOP, "cabGrey"], [BAND_TOP, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "122342",
    scheme: "beton",
  },
  enVoyage: {
    title: "En Voyage",
    palette: {
      body: SILVER, blue: c("#3d95da", 0.4), sky: c("#a9cdec", 0.5), white: WHITE, greyBand: c("#8b9195", 0.45), roofGrey: c("#959a9e", 0.6),
      lower: c("#a7acaf", 0.55), mesh: c("#a9cdea", 0.5), bracket: c("#a7acaf", 0.55), plateField: c("#3d95da", 0.4), plateInk: WHITE, ink: c("#4a5055", 0.6), box: c("#3d95da", 0.4),
    },
    side: [[Y0, 2.27, "sky"], [2.27, 2.31, "white"], [2.31, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, MESH[0], "lower"], [MESH[0], MESH[1], "mesh"], [MESH[1], 2.27, "blue"], [2.27, 2.31, "white"], [2.31, 2.54, "greyBand"], [2.54, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "522266",
    scheme: "enVoyage",
  },
  fret: {
    title: "Fret",
    palette: {
      body: c("#868a8d", 0.55), green: c("#1f9e74", 0.45), white: WHITE, roofGrey: c("#6f7478", 0.65), lower: c("#64686c", 0.6),
      mesh: c("#64686c", 0.6), bracket: c("#7a7e81", 0.6), plateField: c("#1f9e74", 0.45), plateInk: WHITE, ink: WHITE, box: c("#1f9e74", 0.45),
    },
    side: [[Y0, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    end: [[Y0, MESH[1], "lower"], [MESH[1], CAB_FOOT, "green"], [CAB_FOOT, WALL_TOP, "body"], [WALL_TOP, 4.4, "roofGrey"]],
    number: "422369",
    scheme: "fret",
  },
};

export const BB22200_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Bb22200Livery => LIVERIES[resolveParams(BB22200_PARAMS, v).livery!]!;

// --- the paint fields ----------------------------------------------------------------

/** A ring counter-clockwise in (u, v). */
function ccw(q: Ring): Ring {
  const a = q.reduce((s, p, i) => { const r = q[(i + 1) % q.length]!; return s + p[0] * r[1] - r[0] * p[1]; }, 0);
  return a >= 0 ? q : [...q].reverse();
}
/** A paint item from a convex outline. */
function field(name: string, mat: string, poly: Ring, extra: Partial<SideItem> = {}): SideItem {
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, layer: 1, poly: ccw(poly), ...extra };
}

/** The beton's diagonal behind each cab door: its inner and outer edges (|x|) at height y (22342). */
const diagIn = (y: number): number => 4.68 + 0.7 * (y - 2.2);
const diagOut = (y: number): number => 5.36 + 0.7 * (y - 2.46);
/** Fret: the long green field's slanted rear edge (|x| from the end it starts at), its front edge behind the cab door (22369). */
const fretRear = (y: number): number => 3.24 - 0.6 * (y - 1.58);
const fretFront = (y: number): number => 6.2 - 0.49 * (y - CAB_FOOT);

function sidePaint(l: Bb22200Livery): SideItem[] {
  const mirror = { mirror: true } as const;
  if (l.scheme === "beton") {
    return [
      field("orange band", "orange", [[diagOut(2.2), 2.2], [sideEnd(2.2), 2.2], [sideEnd(2.46), 2.46], [diagOut(2.46), 2.46]], mirror),
      field("orange diagonal", "orange", [[diagIn(2.2), 2.2], [diagOut(2.2), 2.2], [diagOut(3.62), 3.62], [diagIn(3.62), 3.62]], mirror),
      field("orange top", "orange", [[0, 3.43], [diagIn(3.43), 3.43], [diagIn(3.62), 3.62], [0, 3.62]], mirror),
      field("cab grey", "cabGrey", [[diagOut(CAB_FOOT), CAB_FOOT], [sideEnd(CAB_FOOT), CAB_FOOT], [sideEnd(3.62), 3.62], [diagOut(3.62), 3.62]], mirror),
      field("nose foot", "lower", [[CAB, Y0], [sideEnd(Y0), Y0], [sideEnd(FOOT - 0.05), FOOT - 0.05], [CAB, FOOT - 0.05]], mirror),
    ];
  }
  if (l.scheme === "enVoyage") {
    const nose = (name: string, mat: string, y0: number, y1: number) => field(name, mat, [[CAB, y0], [sideEnd(y0), y0], [sideEnd(y1), y1], [CAB, y1]], mirror);
    // the clouds over the sky: soft white patches, a few smaller ones above them
    const clouds: SideItem[] = [[-5.2, 1.5, 1.6, 0.36], [-3.5, 1.98, 2.0, 0.34], [-1.6, 1.45, 2.4, 0.4], [0.6, 1.95, 2.2, 0.36], [2.6, 1.5, 2.4, 0.38], [4.4, 1.98, 1.8, 0.32], [5.6, 1.42, 1.0, 0.3]]
      .map(([x, y, w, h], i) => field(`cloud ${i + 1}`, "white", ngon(8, 1, Math.PI / 8, 0, 0).map(([u, v]) => [x! + (u * w!) / 2, y! + (v * h!) / 2] as [number, number])));
    return [nose("nose blue", "blue", FOOT, 2.27), nose("nose line", "white", 2.27, 2.31), nose("nose grey", "greyBand", 2.31, 2.54), nose("nose foot", "lower", Y0, FOOT - 0.05), ...clouds];
  }
  // fret: each side's long green field at the reader's left (-x on the right side, +x on the left), the short one at the right
  const out: SideItem[] = [];
  for (const sd of [-1, 1]) {
    const L = -sd, S = sd;
    const at = (e: number, q: Ring): Ring => q.map(([x, y]) => [e * x, y] as [number, number]);
    const one = { sides: [sd] };
    out.push(
      field(`green ${sd}`, "green", at(L, [[fretRear(MESH[1]), MESH[1]], [sideEnd(MESH[1]), MESH[1]], [sideEnd(CAB_FOOT), CAB_FOOT], [fretRear(CAB_FOOT), CAB_FOOT]]), one),
      field(`green sweep ${sd}`, "green", at(L, [[fretRear(CAB_FOOT), CAB_FOOT], [fretFront(CAB_FOOT), CAB_FOOT], [fretFront(3.62), 3.62], [fretRear(3.62), 3.62]]), one),
      field(`white stripe ${sd}`, "white", at(L, [[fretRear(3.43) - 3.2, 3.43], [fretRear(3.43), 3.43], [fretRear(3.62), 3.62], [fretRear(3.62) - 3.2, 3.62]]), one),
      field(`fret panel ${sd}`, "white", at(L, [[fretRear(1.24) - 2.77, 1.24], [fretRear(1.24), 1.24], [fretRear(2.25), 2.25], [fretRear(2.25) - 2.77, 2.25]]), one),
      field(`green short ${sd}`, "green", at(S, [[6.9, MESH[1]], [sideEnd(MESH[1]), MESH[1]], [sideEnd(CAB_FOOT), CAB_FOOT], [6.9, CAB_FOOT]]), one),
      field(`nose foot ${sd}`, "lower", at(L, [[CAB, Y0], [sideEnd(Y0), Y0], [sideEnd(MESH[1]), MESH[1]], [CAB, MESH[1]]]), one),
      field(`nose foot short ${sd}`, "lower", at(S, [[CAB, Y0], [sideEnd(Y0), Y0], [sideEnd(MESH[1]), MESH[1]], [CAB, MESH[1]]]), one),
    );
  }
  return out;
}

/** The face's fields beyond the bands: the beton's band dropping under the SNCF plate. */
function endPaint(l: Bb22200Livery): EndItem[] {
  if (l.scheme !== "beton") return [];
  const q: Ring = ccw([[-0.62, 2.21], [0.62, 2.21], [0.48, 2.07], [-0.48, 2.07]]);
  return [{ kind: "paint", name: "orange tongue", z: [-0.62, 0.62], y: [2.07, 2.21], mat: "orange", layer: 1, poly: q }];
}

// --- the spec ----------------------------------------------------------------------

/** The pantographs: the DC one over cab 2 (-x, raised, its knee toward cab 2), the AC one toward cab 1 (folded, knee inward). */
const PANTO_DC = { x: -4.7, base: 4.2 } as const;
const PANTO_AC = { x: 3.8, base: 4.2 } as const;
const ARMS = { lower: 1.75, upper: 1.6 } as const;
/** The bogies' centres (9.694 m apart) and half wheelbase (2.8 m), the wheels' radius (1.25 m). */
const BOGIE_X = 4.847;
const HALF_BASE = 1.4;
const WHEEL_R = 0.625;
const FRAME_TOP = 0.92;
/** The air tanks under the frame, one each side (22274, 22342). */
const TANK = { x: [-1.95, 1.75] as Span, y: 0.62, r: 0.24, z: 0.98 };

function spec(l: Bb22200Livery, lod = false): LocoSpec {
  const lamp = (name: string, z: number, r: number, mat?: string): EndItem => ({ kind: "lamp", name, z: [z - r, z + r], y: [1.9 - r, 1.9 + r], r, ...(mat ? { mat } : {}) });
  return {
    palette: {
      rim: c("#a4a9ab", 0.4), groove: c("#2a2c2e", 0.7), louvre: c("#25282b", 0.85), slat: c("#3a3e42", 0.7), headstock: c("#4e5458", 0.6),
      roofBox: c("#80868a", 0.65), wiper: c("#2a2c2e", 0.5), bogie: c("#2f3134", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7),
      wheel: c("#3a3c3f", 0.6), plough: c("#3e4246", 0.6), horn: c("#9ca1a4", 0.4), tank: c("#7c8184", 0.55),
      inox: { color: "#8f8572", metallic: 0.55, roughness: 0.4 }, inoxRib: { color: "#5f5749", metallic: 0.5, roughness: 0.5 },
      logo: c("#b8175a", 0.4), logoInk: WHITE, crestRed: c("#b3262b", 0.5), crestGold: c("#d9a531", 0.45), meshHole: c("#2b2e31", 0.8),
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
    bufferY: 1.08,
    bufferHead: "rect",
    frame: { y0: 0.86, y1: Y0, half: 7.7, hw: 1.38, mat: "underframe" },
    bogies: lod ? [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })) : [],
    // the full model draws its pantographs and bogies itself; the distant model takes the kit's (the rear raised, as here)
    ...(lod ? { pantograph: { kind: "singleArm" as const, x: 4.25, roofY: CROWN, baseY: 4.2, lower: ARMS.lower, upper: ARMS.upper } } : {}),
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, win: DOOR.win, rails: true, mirror: true },
      ...sidePaint(l),
      { kind: "paint", name: "nose seam", x: [CAB - 0.01, CAB + 0.02], y: [FOOT + 0.01, 2.6], mat: "groove", mirror: true, layer: 3 },
      { kind: "paint", name: "door step", x: [6.42, 6.75], y: [Y0 + 0.08, Y0 + 0.24], mat: "groove", mirror: true, layer: 3 },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.19, 1.36], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.36, -0.19], y: SCREEN, mat: "rubber" },
      ...endPaint(l),
      { kind: "paint", name: "pillar box left", z: [0.01, 0.12], y: [3.2, 3.36], mat: "rim", layer: 2 },
      { kind: "paint", name: "pillar box right", z: [-0.12, -0.01], y: [3.2, 3.36], mat: "rim", layer: 2 },
      { kind: "paint", name: "lamp box", z: [-0.37, 0.37], y: [1.72, 1.92], mat: "box", layer: 2 },
      lamp("headlight left", 0.93, 0.13),
      lamp("tail lamp left", 0.66, 0.095, "lampRed"),
      lamp("headlight right", -0.93, 0.13),
      lamp("tail lamp right", -0.66, 0.095, "lampRed"),
      { kind: "paint", name: "marker housing left", z: [1.3, 1.44], y: [1.78, 1.95], mat: "rim", layer: 2 },
      { kind: "paint", name: "marker housing right", z: [-1.44, -1.3], y: [1.78, 1.95], mat: "rim", layer: 2 },
      { kind: "lamp", name: "marker left", z: [1.33, 1.41], y: [1.81, 1.92], rect: true, mat: "lampRed" },
      { kind: "lamp", name: "marker right", z: [-1.41, -1.33], y: [1.81, 1.92], rect: true, mat: "lampRed" },
    ],
    roofItems: [
      { name: "resistor box", x: [-1.9, 1.1], w: [0.78, 0.74], y: [CROWN - 0.02, 4.36], mat: "roofBox" },
      ...(lod ? [] : [
        { name: "breaker box", x: [-2.55, -1.9], w: [0.56, 0.52], y: [CROWN - 0.02, 4.42], mat: "roofBox" } as const,
      ]),
    ],
    underItems: lod ? [[TANK.x[0], TANK.x[1], 0.38, 0.86, 1.2]] : [[-0.85, 0.85, 0.6, 0.86, 0.6]],
    number: l.number,
  };
}

// --- what the kit does not draw -----------------------------------------------------

/** Triangles (u, v) laid on a surface, each turned to face along n. */
function decal(m: MeshBuilder, mat: string, at: Place, n: Vec3, tris: ReadonlyArray<readonly [number, number]>, d: number): void {
  const pts: Vec3[] = [];
  for (let i = 0; i + 2 < tris.length; i += 3) {
    const [a, b, cc] = [at(tris[i]![0], tris[i]![1], d), at(tris[i + 1]![0], tris[i + 1]![1], d), at(tris[i + 2]![0], tris[i + 2]![1], d)];
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = cc[0] - a[0], vy = cc[1] - a[1], vz = cc[2] - a[2];
    const dot = (uy * vz - uz * vy) * n[0] + (uz * vx - ux * vz) * n[1] + (ux * vy - uy * vx) * n[2];
    pts.push(...(dot >= 0 ? [a, b, cc] : [a, cc, b]));
  }
  m.facets(mat, pts, n);
}
/** Convex rings as triangle fans. */
const fans = (rings: readonly Ring[]): Array<[number, number]> => rings.flatMap((q) => q.slice(1, -1).flatMap((p, i) => [q[0]!, p, q[i + 2]!] as Array<[number, number]>));

/** Words centred at u (the reader's u, mapped to the surface's u by `toU`), baseline y. */
function word(m: MeshBuilder, mat: string, at: Place, n: Vec3, text: string, u: number, y: number, h: number, d: number, style: LetterStyle = {}): void {
  const w = wordWidth(text, h, style);
  decal(m, mat, at, n, letters(text, u - w / 2, y, h, false, style), d);
}

/** The carmillon SNCF logo: the field with its rounded top corner, the white letters; u is the reader's, its lower left corner. */
function carmillon(m: MeshBuilder, at: Place, n: Vec3, u0: number, y0: number, w: number, d: number): void {
  const h = w * 0.78;
  const arc = [0, 1, 2, 3, 4].map((i) => (i * Math.PI) / 8).map((a) => [u0 + w * 0.35 + w * 0.65 * Math.cos(a), y0 + h * 0.55 + h * 0.45 * Math.sin(a)] as [number, number]);
  const ring: Ring = [[u0, y0], [u0 + w, y0], ...arc, [u0, y0 + h]];
  surfacePanel(m, "logo", at, n, ccw(ring), d - 0.003, d);
  word(m, "logoInk", at, n, "SNCF", u0 + w * 0.5, y0 + h * 0.3, h * 0.36, d + 0.002, { weight: 0.18, slant: 0.12, gap: 0.08 });
}

/** A place on side sd in the reader's u (x = sd * u). */
const readerSide = (sp: ShellSpec, sd: number): Place => { const at = onSide(sp, sd); return (u, v, d) => at(sd * u, v, d); };
/** A place on end e in the reader's u (z = -e * u). */
const readerEnd = (sp: ShellSpec, e: number): Place => { const at = onEnd(sp, e); return (u, v, d) => at(-e * u, v, d); };

/** The side markings: logos, numbers, the beton's arms, the FRET panel's letters, the "en voyage" words, the cab numbers. */
function sideMarkings(m: MeshBuilder, sp: ShellSpec, l: Bb22200Livery): void {
  m.scope("side markings", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = readerSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        // the cab numbers by the doors: cab 1 at +x, cab 2 at -x
        for (const [cab, x] of [["1", 6.2], ["2", -6.2]] as const) {
          const u = sd * x;
          word(m, l.scheme === "fret" ? "white" : "ink", at, n, cab, u, 2.28, l.scheme === "fret" ? 0.22 : 0.14, 0.009, { weight: 0.16 });
        }
        if (l.scheme === "beton") {
          m.scope("logo", () => carmillon(m, at, n, 5.12, 1.66, 0.6, 0.009));
          m.scope("number", () => {
            const h = 0.14, w = h * 0.45, gap = h * 0.16, width = letteringWidth(l.number, w, gap);
            decal(m, "ink", at, n, lettering(l.number, -5.0 - width / 2, 1.55, h, w, gap, false), 0.009);
          });
          m.scope("arms", () => {
            // the town's arms under the grille's middle: a red shield under a gold crown
            const shield: Ring = [[-0.11, 1.62], [0, 1.52], [0.11, 1.62], [0.11, 1.98], [-0.11, 1.98]];
            surfacePanel(m, "crestRed", at, n, ccw(shield), 0.006, 0.009);
            surfacePanel(m, "crestGold", at, n, rect(-0.12, 1.98, 0.12, 2.1), 0.006, 0.009);
            surfacePanel(m, "crestGold", at, n, rect(-0.03, 1.66, 0.03, 1.9), 0.009, 0.011);
          });
        } else if (l.scheme === "enVoyage") {
          m.scope("logo", () => carmillon(m, at, n, 7.02, 1.86, 0.38, 0.009));
          m.scope("words", () => word(m, "white", at, n, "EN VOYAGE", -3.6, 1.62, 0.26, 0.009, { weight: 0.13, slant: 0.22, width: 0.55 }));
        } else {
          m.scope("number", () => word(m, "white", at, n, l.number, -5.15, 1.9, 0.24, 0.009, { weight: 0.15 }));
          m.scope("fret letters", () => {
            // centred on the white panel at the reader's left, italic as the panel
            const cu = -(fretRear(1.74) - 2.77 / 2);
            word(m, "green", at, n, "FRET", cu, 1.48, 0.56, 0.009, { weight: 0.2, slant: 0.32, width: 0.72 });
          });
        }
      });
  });
}

/** The face's plates, logos and the lamps' box number. */
function faceMarkings(m: MeshBuilder, sp: ShellSpec, l: Bb22200Livery): void {
  m.scope("face markings", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = readerEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        if (l.scheme === "enVoyage") {
          // the number on a blue plate with a white edge, on the white line (522266)
          surfacePanel(m, "white", at, n, roundRect(-0.38, 0.38, 2.18, 2.43, 0.03), -0.005, 0.016);
          surfacePanel(m, "plateField", at, n, roundRect(-0.36, 0.36, 2.2, 2.41, 0.02), 0.0, 0.02);
          word(m, "plateInk", at, n, l.number, 0, 2.235, 0.14, 0.024, { weight: 0.15 });
        } else {
          // the cast SNCF plate on the band (beton), the green plate (fret)
          surfacePanel(m, l.scheme === "fret" ? "white" : "rim", at, n, rect(-0.42, 2.12, 0.42, 2.37), -0.005, 0.018);
          surfacePanel(m, "plateField", at, n, rect(-0.4, 2.14, 0.4, 2.35), 0.0, 0.022);
          word(m, "plateInk", at, n, "SNCF", 0, 2.17, 0.15, 0.026, { weight: 0.2, slant: 0.18 });
          m.scope("logo", () => carmillon(m, at, n, 0.66, 2.16, 0.4, 0.012));
        }
        // the number on the lamps' box (beton, fret; the En Voyage box is plain)
        if (l.scheme === "enVoyage") return;
        const h = 0.1, w = h * 0.45, gap = h * 0.16, width = letteringWidth(l.number, w, gap);
        decal(m, "plateInk", at, n, lettering(l.number, -width / 2, 1.77, h, w, gap, false), 0.012);
      });
  });
}

/** The mesh band under the ledge: rows of dark diamond holes. */
function meshBands(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("mesh bands", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        const holes: Ring[] = [];
        for (const [row, y] of [[0, 1.465], [1, 1.555]] as const)
          for (let i = 0; i < 22; i++) {
            const z = -1.3 + (i + (row ? 0.5 : 0)) * (2.6 / 22);
            holes.push([[z, y - 0.032], [z + 0.045, y], [z, y + 0.032], [z - 0.045, y]]);
          }
        decal(m, "meshHole", at, n, fans(holes), 0.008);
      });
  });
}

/** The wipers parked on the windscreens: pivoted over each pane's middle, hanging to its outer foot (22342). */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const [z0, z1, y0, y1] = [0.72, 1.16, SCREEN[1] - 0.06, SCREEN[0] + 0.12];
          const arm: Ring = [[s * (z0 - 0.015), y0], [s * (z0 + 0.015), y0], [s * (z1 + 0.015), y1], [s * (z1 - 0.015), y1]];
          surfacePanel(m, "wiper", at, n, ccw(arm), 0.024, 0.04);
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
        block(m, "rim", x - 0.018, x + 0.018, y - 0.018, y + 0.018, -1.22, 1.22);
        for (const z of [-1.2, -0.4, 0.4, 1.2]) block(m, "steel", Math.min(x, e * (CAB - 0.02)), Math.max(x, e * (CAB - 0.02)), y - 0.015, y + 0.015, z - 0.012, z + 0.012);
      });
    for (const sd of [-1, 1])
      for (const e of [-1, 1])
        m.scope(`${sd > 0 ? "right" : "left"} ${e > 0 ? "front" : "rear"}`, () => {
          const yy = 2.9, z = sd * (sp.hw(yy) + 0.035);
          tubeX(m, "rim", 0.015, e * 7.0, yy, z, e * 7.5, yy, z, 6);
          for (const x of [7.02, 7.48]) block(m, "steel", e * x - 0.012, e * x + 0.012, yy - 0.012, yy + 0.012, ...side(sd, sp.hw(yy) - 0.01, sp.hw(yy) + 0.04));
        });
  });
}

/** The steel ledge along the nose's foot in three steps, the headstock under it, the plough under that. */
function lowerEnds(m: MeshBuilder): void {
  m.scope("ledges", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [NOSE - 0.04, NOSE + 0.1] : [-NOSE - 0.1, -NOSE + 0.04];
        for (const [z0, z1] of [[-1.48, -0.7], [-0.6, 0.6], [0.7, 1.48]] as const) block(m, "rim", a, b, FOOT - 0.03, FOOT, z0, z1);
      });
  });
  m.scope("headstocks", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [7.68, BEAM - 0.005] : [-BEAM + 0.005, -7.68];
        block(m, "headstock", a, b, 0.8, Y0 + 0.01, -1.44, 1.44);
      });
  });
  m.scope("ploughs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        // the curved blade under the headstock (22342, 22274): its lip 0.28 m over the rail, its top 0.68 m,
        // 2.7 m wide, its middle 0.2 m behind the buffers' heads and its ends swept back 0.3 m
        const zs = [-1.35, -0.9, -0.45, 0, 0.45, 0.9, 1.35];
        const xf = (z: number, top: boolean) => HALF - 0.2 - 0.3 * (z / 1.35) ** 2 - (top ? 0.08 : 0);
        const T = 0.05;
        for (let i = 0; i + 1 < zs.length; i++) {
          const [z0, z1] = [zs[i]!, zs[i + 1]!];
          const ring = (top: boolean): Ring => {
            const [a, b] = [xf(z0, top), xf(z1, top)];
            return e > 0 ? [[a, z0], [a - T, z0], [b - T, z1], [b, z1]] : [[-b, z1], [-b + T, z1], [-a + T, z0], [-a, z0]];
          };
          m.loft("plough", ring(false), 0.28, ring(true), 0.68);
          m.cap("plough", ring(false), 0.28, false);
        }
        for (const z of [-0.7, 0.7]) block(m, "underframe", e > 0 ? 7.9 : -HALF + 0.3, e > 0 ? HALF - 0.3 : -7.9, 0.6, 0.82, z - 0.05, z + 0.05);
      });
  });
}

/** The horns on each cab roof behind the visor, pointing ahead (22232, 22274). */
function horns(m: MeshBuilder): void {
  m.scope("horns", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        for (const [z, len] of [[-0.12, 0.4], [-0.36, 0.32]] as const) {
          const x0 = e * 7.15, x1 = e * (7.15 + len);
          const bell = ngon(8, 0.095, 0, z, CROWN + 0.12), pipe = ngon(8, 0.04, 0, z, CROWN + 0.12);
          m.sweep("horn", "x", e > 0 ? pipe : bell, Math.min(x0, x1), e > 0 ? bell : pipe, Math.max(x0, x1));
          block(m, "steel", e * 7.25 - 0.03, e * 7.25 + 0.03, CROWN - 0.04, CROWN + 0.07, z - 0.03, z + 0.03);
        }
      });
  });
}

/** The louvres along the resistor box's sides. */
function roofLouvres(m: MeshBuilder): void {
  m.scope("resistor louvres", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const zb = (y: number) => 0.78 - (0.04 * (y - (CROWN - 0.02))) / 0.38;
        for (let i = 0; i < 4; i++) {
          const x0 = -1.82 + i * 0.73, x1 = x0 + 0.66;
          block(m, "louvre", x0, x1, 4.04, 4.32, ...side(sd, zb(4.32) - 0.01, zb(4.04) + 0.006));
          for (const y of [4.08, 4.14, 4.2, 4.26]) block(m, "slat", x0 + 0.03, x1 - 0.03, y, y + 0.015, ...side(sd, zb(y) - 0.01, zb(y) + 0.02));
        }
      });
  });
}

/** The two AM 18 pantographs: the DC one raised, its knee toward cab 2, with its springs; the AC one folded, its knee inward. */
function pantographs(m: MeshBuilder): void {
  m.scope("pantographs", () => {
    m.scope("dc pantograph", () => {
      singleArm(m, { xc: PANTO_DC.x, roofY: CROWN, baseY: PANTO_DC.base, h: 1, raised: true, ...ARMS });
      for (const z of [-0.3, 0.3]) m.scope("spring drum", () => m.prism("pantograph", ngon(8, 0.07, 0, PANTO_DC.x + 0.3, z), PANTO_DC.base + 0.05, PANTO_DC.base + 0.24));
    });
    m.scope("ac pantograph", () => singleArm(m, { xc: PANTO_AC.x, roofY: CROWN, baseY: PANTO_AC.base, h: -1, raised: false, ...ARMS }));
  });
}

/** The roof lines: from each pantograph on two insulators toward the boxes in the middle. */
function roofLines(m: MeshBuilder): void {
  m.scope("roof line", () => {
    const y = 4.42;
    for (const x of [-3.5, -2.9]) insulator(m, x, 0.3, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.018, -4.1, y, 0.3, -2.55, y, 0.3, 6);
    for (const x of [1.9, 2.6]) insulator(m, x, -0.55, CROWN - 0.01, y - 0.02);
    tubeX(m, "copper", 0.018, 1.1, y, -0.55, 3.2, y, -0.55, 6);
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

/** The body's brackets over each bogie's springs, in the body colour; the air tanks between the bogies. */
function underBody(m: MeshBuilder): void {
  m.scope("bogie brackets", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const d of [-0.6, 0.6])
        for (const s of [-1, 1]) block(m, "bracket", xc + d - 0.17, xc + d + 0.17, FRAME_TOP + 0.04, Y0 + 0.01, ...side(s, 1.3, 1.46));
  });
  m.scope("air tanks", () => {
    for (const s of [-1, 1]) {
      const z = s * TANK.z;
      const mid = (TANK.x[0] + TANK.x[1]) / 2;
      for (const [a, b] of [[TANK.x[0] + 0.12, mid - 0.03], [mid + 0.03, TANK.x[1] - 0.12]] as const) {
        const body = ngon(12, TANK.r, 0, z, TANK.y), end = ngon(12, TANK.r * 0.7, 0, z, TANK.y);
        m.sweep("tank", "x", body, a, body, b);
        m.sweep("tank", "x", end, a - 0.1, body, a);
        m.sweep("tank", "x", body, b, end, b + 0.1);
      }
      for (const x of [TANK.x[0] + 0.5, TANK.x[1] - 0.5]) block(m, "underframe", x - 0.04, x + 0.04, TANK.y, 0.87, z - 0.06, z + 0.06);
    }
  });
}

/** The stainless filter grille: its frame, the bronze-grey panel and its fine upright ribs (22274, 22342). */
function filterGrilles(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("filter grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const [x0, x1] = GRILLE.x, [y0, y1] = GRILLE.y;
        m.scope("frame", () => surfacePanel(m, "rim", at, n, rect(x0 - 0.035, y0 - 0.035, x1 + 0.035, y1 + 0.035), 0.006, 0.01));
        m.scope("panel", () => surfacePanel(m, "inox", at, n, rect(x0, y0, x1, y1), 0.009, 0.013));
        const ribs: Ring[] = [];
        const count = Math.round((x1 - x0 - 0.06) / 0.09);
        for (let i = 0; i <= count; i++) {
          const x = x0 + 0.03 + (i * (x1 - x0 - 0.06)) / count;
          ribs.push([[x - 0.012, y0 + 0.03], [x + 0.012, y0 + 0.03], [x + 0.012, y1 - 0.03], [x - 0.012, y1 - 0.03]]);
        }
        m.scope("ribs", () => decal(m, "inoxRib", at, n, fans(ribs), 0.016));
        // the joints between its panels
        const joints: Ring[] = [1, 2, 3, 4, 5].map((k) => x0 + (k * (x1 - x0)) / 6).map((x) => rect(x - 0.012, y0, x + 0.012, y1));
        m.scope("joints", () => decal(m, "rim", at, n, fans(joints), 0.018));
      });
  });
}

/** The SNCF BB 22200 in a livery. */
export function sncfBb22200(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    filterGrilles(m, sp);
    sideMarkings(m, sp, l);
    faceMarkings(m, sp, l);
    meshBands(m, sp);
    wipers(m, sp);
    handrails(m, sp);
    lowerEnds(m);
    underBody(m);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => monomotorBogie(m, xc));
  });
  m.scope("roof equipment", () => {
    horns(m);
    roofLouvres(m);
    pantographs(m);
    roofLines(m);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function sncfBb22200Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
