// The SNCF CC 72000 (proc-vehicle-sncf-cc72000): Alsthom's C'C' diesel-electric of
// 1967 - 1974 (92 built, 72001 - 72092), Paul Arzens's "nez casse" on the SACM AGO V16
// ESHR engine (2,650 kW, 140 or 160 km/h, two monomotor bogies with their two gear
// ratios), on the box locomotive kit (boxLocoKit.ts) with its own profile, measured on
// the reference photographs (assets/sncf-cc72000/SOURCES.md):
//
// - the published figures: 20.19 m over the buffers, 2.952 m wide, 4.29 m high; bogie
//   centres 11.99 m, bogie wheelbase 3.216 m, 1.14 m wheels (Y 218 bogies); 114 t;
// - side-on, 72163 (2017, the same body as a CC 72100): its two ends differ in scale
//   (62 px/m at the left nose, 58.5 px/m at the right one, from the body's height in
//   pixels at each end), a linear fit over the 18.64 m between the nose faces gives
//   the positions along the side; heights from the crown (4.29 m) at each end's own
//   scale; 72029 (Fret, the other side) for the same layout seen from the other side;
//   72030 at Epinal (1991, about 106 px/m upright at its near cab), 72084 at Longueau
//   (2013, 191 px/m across the face) and 72064 (front three-quarter) for the blue
//   livery, the face and its lamps;
// - the broken nose: the lower nose 0.08 m behind the face from the body's foot to the
//   step ledge at 1.68 m; the face upright from 1.70 m to 2.45 m at 9.31 m from the
//   middle, its top rounded over into the bonnet that reaches the cab front 0.63 m
//   back at 2.73 m; the windscreens leaning forward 0.2 m to the visor at 3.42 m; the
//   long cab roof falling 0.7 m over the last 1.9 m to the visor (72163: crown at
//   6.95 m, 4.08 m high at 7.92 m, 3.73 m at 8.72 m);
// - the cross-section: upright sides to 3.56 m, then the roof's sloping sides (where
//   the radiator louvres sit) up to a 1.5 m wide top at 4.29 m;
// - on the face: two windscreens with a 0.29 m middle pillar, the handrail along their
//   foot, the roof headlight in a box on the cab roof's white front, the horns on the
//   cab roof's crest; the old SNCF disc at the top of the lamp band, a headlight and a
//   red lamp each side, the number plate between them, the marker lamps at the corners;
//   the step ledge, the headstock and the big rectangular buffers;
// - the side: the cab door 0.6 m wide behind each cab with its window and handrails;
//   behind cab 2 (+x here) the long ribbed radiator grille, L-shaped: its upper part
//   from 0.75 m to the cab door over the white line, its lower part only forward of a
//   leaning edge at 3.34 - 3.7 m; the door with the porthole just behind it; plain
//   panels 1.5 m wide toward cab 1; the radiator louvres along the roof's slopes from
//   -4.17 m to 3.5 m (two bays, then twelve), plain roof hatches beyond;
// - liveries: the "bleue diesel" of 1967 (key `blueWhite`, 72084 as restored): a white
//   skirt under a dark blue line, the Arzens blue band with a white line over it, dark
//   blue above, the dark field round the grille, a white stripe leaning up in front of
//   the grille and its flash running forward to the bonnet's white side; on the face the
//   white lamp band under a dark blue band and the blue bonnet, the dark blue round the
//   windscreens and the white cab roof front; and the "Multiservices rouge" or Corail+
//   scheme that 72030, 72038, 72040, 72068 and 72078 wore before they became CC 72100
//   (key `multiservice`, 72068): metallic grey with the dark grey band and the white line
//   along the side, the red line framing the grille, the red lamp band on the face.
//   No photograph of a CC 72000 in it is on Commons: it is drawn after the scheme on the
//   BB 22200's same body (22387), and says so in SOURCES.md.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, rect, surfaceDecal, surfacePanel, sweepZ, type ShellSpec } from "./czElectricKit.ts";
import { coil, tubeX, type Band } from "./cd163.ts";
import { block, plate, side } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

/** Half the length over the buffers (20.19 m). */
const HALF = 10.095;
/** The headstock's face, the nose's face, the cab front at the windscreens' foot, |x|. */
const BEAM = 9.6;
const NOSE = 9.31;
const CAB = 8.68;
/** The body side's foot; the lower nose's foot; the step ledge; where the bonnet meets the cab front. */
const Y0 = 1.33;
const LOW = 1.06;
const LEDGE = 1.68;
const CAB_FOOT = 2.73;
/** The windscreens' sill and head; the visor; the side wall's top; the crown. */
const SCREEN: Span = [2.82, 3.39];
const VISOR = 3.42;
const WALL_TOP = 3.56;
const CROWN = 4.29;
/** The body's half width (2.952 m). */
const W = 1.476;

/**
 * The end's centre line [y, |x|], bottom first, measured on 72163's two ends: the
 * lower nose a little behind the face, the face upright from the ledge to 2.45 m, its
 * top rounded over into the bonnet; the cab front leaning out to the visor, the long
 * cab roof falling back to the crown at 6.95 m.
 */
const TIP: Table = [
  [Y0, NOSE - 0.08], [LEDGE - 0.02, NOSE - 0.08], [LEDGE + 0.02, NOSE], [2.45, NOSE + 0.005], [2.55, NOSE - 0.03], [2.62, NOSE - 0.09], [2.67, NOSE - 0.17], [2.7, NOSE - 0.29],
  [CAB_FOOT, CAB], [3.36, CAB + 0.19], [VISOR, CAB + 0.2], [3.5, CAB + 0.2], [WALL_TOP, CAB + 0.17], [3.64, CAB + 0.1], [3.73, 8.66], [3.85, 8.5], [3.94, 8.32],
  [4.02, 8.13], [4.08, 7.94], [4.15, 7.73], [4.2, 7.52], [4.25, 7.28], [CROWN, 6.95],
];
/** The half width: upright walls, the roof's sloping sides and its flat top. */
const HW: Table = [[Y0, W], [WALL_TOP, W], [3.62, W - 0.03], [3.7, W - 0.13], [4.18, W - 0.6], [4.25, W - 0.7], [CROWN, W - 0.76]];
/** The corner's radius in plan by height: the bonnet's round corners, the cab front's tighter ones, the cab roof's. */
const CORNER: Table = [[Y0, 0.2], [LEDGE + 0.02, 0.24], [2.6, 0.3], [CAB_FOOT, 0.12], [VISOR, 0.12], [3.64, 0.18], [4.0, 0.3], [CROWN, 0.35]];
/** The distant model's coarser profile. */
const LOD_TIP: Table = [[Y0, NOSE - 0.08], [LEDGE, NOSE - 0.08], [LEDGE + 0.02, NOSE], [2.5, NOSE], [2.7, NOSE - 0.29], [CAB_FOOT, CAB], [VISOR, CAB + 0.2], [3.73, 8.66], [4.08, 7.94], [CROWN, 6.95]];
const LOD_HW: Table = [[Y0, W], [WALL_TOP, W], [3.7, W - 0.13], [4.18, W - 0.6], [CROWN, W - 0.76]];
const BOW = 0.015;
const ANGLES = [22.5, 45, 67.5, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER, y), w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the end at height y. */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER, y) - 0.005;

/** The cab door (frame) behind each cab; its window (72163: 7.35 - 7.95 m, the window 2.83 - 3.36 m). */
const DOOR: { x: Span; y: Span; win: Span } = { x: [7.35, 7.95], y: [Y0 + 0.03, 3.48], win: [2.83, 3.36] };

// --- the side's lines (72163, 72030, 72084) ----------------------------------------

/** The bottom line over the skirt; the white line under the dark upper field; the white band under the roof's edge. */
const SKIRT_LINE: Span = [1.69, 1.75];
const WHITE_LINE: Span = [2.45, 2.53];
const ROOF_BAND: Span = [3.48, 3.63];
/** The flash in front of the grille (its foot is the white line's). */
const FLASH_TOP = 2.72;
/** The grille: its upper part's rear end and top; the lower part's foot and its leaning rear edge (3.34 m at the foot, 3.7 m at the white line). */
const GRILLE_REAR = 0.75;
const GRILLE_TOP = 3.37;
const GRILLE_FOOT = 1.8;
const lowerRear = (y: number): number => 3.34 + 0.49 * (y - GRILLE_FOOT);
/** The leaning white stripe in front of the grille: its rear edge at height y (6.75 m at the flash's top, 0.25 m forward a metre up), 0.36 m wide. */
const stripe = (y: number): number => 6.75 + 0.25 * (y - FLASH_TOP);
const STRIPE_W = 0.36;
/** The grille's front end when no stripe cuts it (just behind the cab door). */
const GRILLE_FRONT = 7.31;
/** Where the bonnet's white side begins (forward of the cab door). */
const BONNET_SIDE = 8.05;

// --- liveries ----------------------------------------------------------------------

type Scheme = "bleue" | "multiservice";
interface Cc72000Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  number: string;
  scheme: Scheme;
}

const BLUE = c("#3566a4", 0.4);
const DARK_BLUE = c("#1f3157", 0.45);
const WHITE = c("#e9eae5");
const SILVER: MaterialSpec = { color: "#b5b9bb", metallic: 0.45, roughness: 0.35 };
const DARK_GREY = c("#4c5257", 0.5);
const RED = c("#c6202b", 0.35);

const LIVERIES: Record<string, Cc72000Livery> = {
  blueWhite: {
    title: "Blue and white",
    palette: {
      body: BLUE, darkBlue: DARK_BLUE, white: WHITE, roofGrey: c("#46505b", 0.6), cap: c("#27324a", 0.5), lowerNose: DARK_BLUE, headstock: DARK_BLUE,
      ribs: DARK_BLUE, plateField: c("#b3202a", 0.4), ink: WHITE, logo: c("#b3202a", 0.4),
    },
    side: [[Y0, SKIRT_LINE[0], "white"], [SKIRT_LINE[0], SKIRT_LINE[1], "darkBlue"], [SKIRT_LINE[1], WHITE_LINE[0], "body"], [WHITE_LINE[0], WHITE_LINE[1], "white"], [WHITE_LINE[1], ROOF_BAND[0], "darkBlue"], [ROOF_BAND[0], ROOF_BAND[1], "white"], [ROOF_BAND[1], 4.4, "roofGrey"]],
    end: [[LOW, LEDGE, "darkBlue"], [LEDGE, 2.15, "white"], [2.15, 2.36, "darkBlue"], [2.36, CAB_FOOT, "body"], [CAB_FOOT, VISOR, "darkBlue"], [VISOR, 3.8, "white"], [3.8, 4.4, "cap"]],
    number: "72084",
    scheme: "bleue",
  },
  multiservice: {
    title: "Multiservice",
    palette: {
      body: SILVER, darkGrey: DARK_GREY, white: WHITE, red: RED, roofGrey: c("#6c7175", 0.6), cap: c("#6c7175", 0.6), band: c("#cfd2d3", 0.4), lowerNose: DARK_GREY, headstock: DARK_GREY,
      ribs: SILVER, plateField: RED, ink: c("#3a3f44", 0.5), logo: RED,
    },
    side: [[Y0, 1.42, "darkGrey"], [1.42, 2.15, "body"], [2.15, 2.22, "white"], [2.22, 2.42, "darkGrey"], [2.42, ROOF_BAND[0], "body"], [ROOF_BAND[0], ROOF_BAND[1], "band"], [ROOF_BAND[1], 4.4, "roofGrey"]],
    end: [[LOW, LEDGE, "darkGrey"], [LEDGE, 2.15, "red"], [2.15, 2.36, "darkGrey"], [2.36, CAB_FOOT, "body"], [CAB_FOOT, VISOR, "body"], [VISOR, 3.8, "band"], [3.8, 4.4, "cap"]],
    number: "72068",
    scheme: "multiservice",
  },
};

export const CC72000_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Cc72000Livery => LIVERIES[resolveParams(CC72000_PARAMS, v).livery!]!;

// --- the spec ----------------------------------------------------------------------

/** The bogies' centres (11.99 m apart), the axles' offsets (3.216 m wheelbase), the wheels' radius (1.14 m). */
const BOGIE_X = 5.995;
const AXLES = [-1.608, 0, 1.608] as const;
const WHEEL_R = 0.57;
const FRAME_TOP = 0.93;

/** A paint piece on the side: a convex outline (u = x, v = y). */
function piece(name: string, mat: string, layer: number, poly: Ring, mirror = false): SideItem {
  const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
  return { kind: "paint", name, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, mirror, layer, poly };
}

/** The scheme's fields along the side: cab 2's grille end at +x, cab 1 at -x. */
function sidePaint(l: Cc72000Livery): SideItem[] {
  const end = (y: number) => sideEnd(y);
  if (l.scheme === "bleue") {
    const [f0, f1] = [WHITE_LINE[0], FLASH_TOP];
    // the leaning stripe and the flash at an end: e = +1 cab 2, -1 cab 1 (mirrored)
    const stripeAt = (e: number): SideItem[] => {
      const q = (x: number, y: number): [number, number] => [e * x, y];
      const fix = (r: Ring): Ring => (e > 0 ? r : [...r].reverse());
      return [
        piece(`stripe ${e > 0 ? 2 : 1}`, "white", 2, fix([q(stripe(f0), f0), q(stripe(f0) + STRIPE_W, f0), q(stripe(ROOF_BAND[0]) + STRIPE_W, ROOF_BAND[0]), q(stripe(ROOF_BAND[0]), ROOF_BAND[0])])),
        piece(`flash ${e > 0 ? 2 : 1}`, "white", 2, fix([q(stripe(f0), f0), q(CAB, f0), q(CAB, f1), q(stripe(f1), f1)])),
        piece(`bonnet side ${e > 0 ? 2 : 1}`, "white", 2, fix([q(BONNET_SIDE, LEDGE), q(end(LEDGE), LEDGE), q(end(f0), f0), q(BONNET_SIDE, f0)])),
        // the blue bonnet top rounds down over the bonnet's side (72030, 72064)
        piece(`bonnet top ${e > 0 ? 2 : 1}`, "body", 3, fix([q(CAB, f0), q(end(f0), f0), q(end(2.62), 2.62), q(end(2.7), 2.7), q(CAB, 2.7)])),
        piece(`lower nose side ${e > 0 ? 2 : 1}`, "darkBlue", 2, fix([q(BONNET_SIDE, Y0), q(end(Y0), Y0), q(end(LEDGE), LEDGE), q(BONNET_SIDE, LEDGE)])),
      ];
    };
    return [
      // the dark field below the white line, from the grille's leaning rear edge to the bonnet
      piece("dark field", "darkBlue", 1, [[lowerRear(SKIRT_LINE[1]), SKIRT_LINE[1]], [BONNET_SIDE, SKIRT_LINE[1]], [BONNET_SIDE, WHITE_LINE[1]], [lowerRear(WHITE_LINE[1]), WHITE_LINE[1]]]),
      ...stripeAt(1),
      ...stripeAt(-1),
    ];
  }
  // multiservice: the red line framing the grille's upper part (after the BB 22200's)
  const [r0, r1] = [2.42, ROOF_BAND[0]];
  const w = 0.13;
  return [
    piece("red rear", "red", 1, [[GRILLE_REAR - 0.16 - w, r0], [GRILLE_REAR - 0.16, r0], [GRILLE_REAR - 0.04, r1], [GRILLE_REAR - 0.04 - w, r1]]),
    piece("red top", "red", 1, [[GRILLE_REAR - 0.04 - w, r1 - w + 0.04], [GRILLE_FRONT + 0.01, r1 - w + 0.04], [GRILLE_FRONT + 0.01, r1], [GRILLE_REAR - 0.04 - w, r1]]),
    piece("red front", "red", 1, [[GRILLE_FRONT - 0.14, r0], [GRILLE_FRONT + 0.01, r0], [GRILLE_FRONT + 0.01, r1], [GRILLE_FRONT - 0.14, r1]]),
  ];
}

function spec(l: Cc72000Livery, lod = false): LocoSpec {
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), groove: c("#22262b", 0.7), louvre: c("#1d2126", 0.85), slat: c("#3a3e42", 0.7),
      bogie: c("#34373a", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6), tank: c("#3b3f43", 0.6),
      roofBox: c("#5a6168", 0.6), lampBox: c("#9ea3a6", 0.5), horn: c("#2a2c2f", 0.4), exhaust: c("#2a2b2d", 0.8),
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
    frame: { y0: 0.98, y1: Y0, half: 8.0, hw: 1.38, mat: "underframe" },
    bogies: lod ? [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: AXLES, wheelR: WHEEL_R, frameTop: FRAME_TOP })) : [],
    // the engine's exhaust in the roof's middle, over the louvres
    exhausts: [[1.9, 0, CROWN]],
    sideItems: [
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, win: DOOR.win, rails: true, mirror: true },
      ...sidePaint(l),
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.135, 1.22], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.22, -0.135], y: SCREEN, mat: "rubber" },
      { kind: "lamp", name: "headlight left", z: [0.71, 0.97], y: [1.73, 1.99], r: 0.12 },
      { kind: "lamp", name: "red lamp left", z: [0.47, 0.65], y: [1.77, 1.95], r: 0.085, mat: "lampRed" },
      { kind: "lamp", name: "headlight right", z: [-0.97, -0.71], y: [1.73, 1.99], r: 0.12 },
      { kind: "lamp", name: "red lamp right", z: [-0.65, -0.47], y: [1.77, 1.95], r: 0.085, mat: "lampRed" },
      { kind: "lamp", name: "marker left", z: [1.19, 1.27], y: [1.78, 1.9], rect: true, mat: "lampRed" },
      { kind: "lamp", name: "marker right", z: [-1.27, -1.19], y: [1.78, 1.9], rect: true, mat: "lampRed" },
    ],
    roofItems: lod ? [] : [
      { name: "roof hatch 1", x: [-6.85, -4.3], w: [0.76, 0.74], y: [CROWN - 0.02, CROWN + 0.03], mat: "roofGrey" },
      { name: "roof hatch 2", x: [3.62, 6.85], w: [0.76, 0.74], y: [CROWN - 0.02, CROWN + 0.03], mat: "roofGrey" },
    ],
    underItems: lod ? [[-1.95, 3.33, 0.4, 0.98, 1.15]] : [],
    number: l.number,
  };
}

// --- what the kit does not draw -----------------------------------------------------

/** The radiator grille on each side behind cab 2: vertical ribs over a dark recess, L-shaped (72163, 72029, 72084). */
function grille(m: MeshBuilder, sp: ShellSpec, l: Cc72000Livery): void {
  // its front edge: the stripe's rear edge in the blue livery, else just behind the cab door
  // the pieces split a little off the white line's edges, where the paint and the shell's rows break (no coplanar faces)
  const [a, b] = [WHITE_LINE[0] + 0.006, WHITE_LINE[1] + 0.006];
  const front = (y: number): number => (l.scheme === "bleue" ? (y >= a - 1e-6 ? stripe(y) : GRILLE_FRONT - 0.04) : GRILLE_FRONT - 0.16);
  // convex pieces (u = x, v = y), counter-clockwise on the right side
  const pieces: Ring[] = [
    [[GRILLE_REAR, b], [front(b), b], [front(GRILLE_TOP), GRILLE_TOP], [GRILLE_REAR, GRILLE_TOP]],
    [[lowerRear(GRILLE_FOOT), GRILLE_FOOT], [front(GRILLE_FOOT), GRILLE_FOOT], [front(a - 1e-3), a], [lowerRear(a), a]],
    [[lowerRear(a), a], [front(a), a], [front(b), b], [lowerRear(b), b]],
  ];
  const spanAt = (q: Ring, x: number): Span | undefined => {
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < q.length; i++) {
      const [a, b] = [q[i]!, q[(i + 1) % q.length]!];
      if ((a[0] - x) * (b[0] - x) > 0 || a[0] === b[0]) continue;
      const t = (x - a[0]) / (b[0] - a[0]);
      const y = a[1] + t * (b[1] - a[1]);
      lo = Math.min(lo, y);
      hi = Math.max(hi, y);
    }
    return hi - lo > 0.05 ? [lo, hi] : undefined;
  };
  m.scope("grilles", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const wind = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        m.scope("recess", () => {
          for (const q of pieces) surfacePanel(m, "louvre", at, n, wind(q), -0.006, 0.006);
        });
        // the ribs, 0.067 m apart (72029), each cut to the piece it lies in
        const ribs: Ring[] = [];
        for (const q of pieces) {
          const xs = q.map((p) => p[0]);
          for (let x = Math.min(...xs) + 0.03; x + 0.03 < Math.max(...xs); x += 0.067) {
            const a = spanAt(q, x), b = spanAt(q, x + 0.03);
            if (!a || !b) continue;
            ribs.push(wind([[x, a[0] + 0.02], [x + 0.03, b[0] + 0.02], [x + 0.03, b[1] - 0.02], [x, a[1] - 0.02]]));
          }
        }
        m.scope("ribs", () => surfaceDecal(m, "ribs", at, n, ribs, 0.012));
      });
  });
}

/** The door with the porthole behind the grille, and the seams of the plain panels toward cab 1 (72163). */
function panels(m: MeshBuilder, sp: ShellSpec): void {
  const seams: Array<[number, Span]> = [[-7.07, [SKIRT_LINE[1], ROOF_BAND[0]]], [-5.64, [SKIRT_LINE[1], ROOF_BAND[0]]], [-4.13, [SKIRT_LINE[1], ROOF_BAND[0]]], [-2.65, [SKIRT_LINE[1], ROOF_BAND[0]]], [-1.17, [SKIRT_LINE[1], ROOF_BAND[0]]], [2.27, [SKIRT_LINE[1], WHITE_LINE[0]]]];
  m.scope("side panels", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        const wind = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        const seam = (x0: number, y0: number, x1: number, y1: number): Ring => wind(rect(x0, y0, x1, y1));
        m.scope("seams", () => surfaceDecal(m, "groove", at, n, seams.map(([x, [y0, y1]]) => seam(x - 0.008, y0, x + 0.008, y1)), 0.014));
        m.scope("porthole door", () => {
          const [x0, x1, y0, y1] = [-0.08, 0.7, SKIRT_LINE[1] + 0.02, 3.39];
          surfaceDecal(m, "groove", at, n, [seam(x0, y0, x1, y0 + 0.016), seam(x0, y1 - 0.016, x1, y1), seam(x0, y0, x0 + 0.016, y1), seam(x1 - 0.016, y0, x1, y1)], 0.014);
          surfacePanel(m, "rim", at, n, wind(ngon(14, 0.17, 0, 0.31, 2.39)), -0.004, 0.018);
          surfacePanel(m, "glass", at, n, wind(ngon(14, 0.13, 0, 0.31, 2.39)), -0.002, 0.022);
        });
      });
  });
}

/** The running number and "SNCF" along each side, where each scheme put them (72084, 72030; 22387). */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Cc72000Livery): void {
  const words: Array<[string, number, number, number]> =
    l.scheme === "bleue" ? [[l.number, 2.55, 1.86, 0.16], ["SNCF", -3.2, 1.9, 0.12]] : [[l.number, -6.0, 1.75, 0.16], ["SNCF", -1.9, 2.5, 0.18]];
  m.scope("lettering", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        for (const [txt, cx, y, h] of words) {
          const w = wordWidth(txt, h, { weight: 0.17 });
          // the same words at the same place on both sides, read from outside
          const u = cx;
          const tris = letters(txt, sd > 0 ? u - w / 2 : u + w / 2, y, h, sd < 0, { weight: 0.17 });
          m.facets(txt === "SNCF" && l.scheme === "multiservice" ? "red" : "ink", tris.map(([a, b]) => at(a, b, 0.009)), [0, 0, sd]);
        }
      });
  });
}

/** The old SNCF disc at the top of the lamp band (72084: red on white; the multiservice scheme kept the letters only). */
function noseLogos(m: MeshBuilder, sp: ShellSpec, l: Cc72000Livery): void {
  m.scope("sncf discs", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        if (l.scheme === "bleue") {
          const cy = 2.16;
          surfacePanel(m, "logo", at, n, ngon(16, 0.19, 0, 0, cy), -0.004, 0.012);
          surfacePanel(m, "white", at, n, ngon(16, 0.16, 0, 0, cy), 0.0, 0.016);
          const h = 0.08, w = wordWidth("SNCF", h, { weight: 0.2 });
          const tris = letters("SNCF", e > 0 ? w / 2 : -w / 2, cy - h / 2, h, e > 0, { weight: 0.2 });
          m.facets("logo", tris.map(([u, v]) => at(u, v, 0.02)), n);
        } else {
          const cy = 2.255, h = 0.1, w = wordWidth("SNCF", h, { weight: 0.2 });
          const tris = letters("SNCF", e > 0 ? w / 2 : -w / 2, cy - h / 2, h, e > 0, { weight: 0.2 });
          m.facets("white", tris.map(([u, v]) => at(u, v, 0.008)), n);
        }
      });
  });
}

/** The number between the lamps: a red plate with white figures (72084), white figures on the red band (multiservice). */
function frontNumbers(m: MeshBuilder, sp: ShellSpec, l: Cc72000Livery): void {
  m.scope("number plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const at = onEnd(sp, e);
        const n: Vec3 = [e, 0, 0];
        let d = 0.008;
        if (l.scheme === "bleue") {
          surfacePanel(m, "rim", at, n, rect(-0.31, 1.76, 0.31, 1.94), -0.01, 0.02);
          surfacePanel(m, "plateField", at, n, rect(-0.29, 1.775, 0.29, 1.925), 0.0, 0.026);
          d = 0.03;
        }
        const h = 0.1, w = wordWidth(l.number, h, { weight: 0.2 });
        const tris = letters(l.number, e > 0 ? w / 2 : -w / 2, 1.85 - h / 2, h, e > 0, { weight: 0.2 });
        m.facets("white", tris.map(([u, v]) => at(u, v, d)), n);
      });
  });
}

/** The wipers parked on the windscreens, hanging from a pivot over each pane (72084). */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const zc of [0.67, -0.67])
        m.scope(`${e > 0 ? "front" : "rear"} ${zc > 0 ? "left" : "right"}`, () => {
          const u = (dz: number) => (e > 0 ? -1 : 1) * (zc + dz);
          const s = e > 0 ? 1 : -1;
          const [y0, y1] = [SCREEN[1] - 0.05, SCREEN[0] + 0.14];
          const arm: Ring = [[u(-s * 0.15) - 0.015, y0], [u(-s * 0.15) + 0.015, y0], [u(s * 0.3) + 0.015, y1], [u(s * 0.3) - 0.015, y1]];
          const area = arm.reduce((a, p, i) => { const q = arm[(i + 1) % arm.length]!; return a + p[0] * q[1] - q[0] * p[1]; }, 0);
          surfacePanel(m, "rim", at, n, area > 0 ? arm : [...arm].reverse(), 0.024, 0.04);
        });
    }
  });
}

/** The handrail along the windscreens' foot (72084, 72064). */
function handrails(m: MeshBuilder): void {
  m.scope("handrails", () => {
    const y = CAB_FOOT + 0.09;
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const x = e * (lerpTable(TIP, y) + 0.09);
        tubeX(m, "rim", 0.016, x, y, -1.2, x, y, 1.2, 6);
        for (const z of [-1.18, -0.4, 0.4, 1.18]) block(m, "steel", Math.min(x, e * (CAB - 0.02)), Math.max(x, e * (CAB - 0.02)), y - 0.015, y + 0.015, z - 0.012, z + 0.012);
      });
  });
}

/** The step plates along the nose's ledge, the lower nose under the body's foot and the headstock with the buffers (72064). */
function lowerEnds(m: MeshBuilder): void {
  m.scope("lower nose", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        // the lower nose below the side's foot, forward of the cab door
        const [a, b] = e > 0 ? [BONNET_SIDE, NOSE - 0.08] : [-(NOSE - 0.08), -BONNET_SIDE];
        block(m, "lowerNose", a, b, LOW, Y0 + 0.005, -(W - 0.03), W - 0.03);
        // the headstock carrying the buffers and the coupling
        const [h0, h1] = e > 0 ? [9.0, BEAM] : [-BEAM, -9.0];
        block(m, "headstock", h0, h1, 0.82, LOW + 0.005, -1.44, 1.44);
      });
  });
  m.scope("step plates", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [a, b] = e > 0 ? [NOSE - 0.1, NOSE + 0.12] : [-NOSE - 0.12, -NOSE + 0.1];
        for (const [z0, z1] of [[-1.42, -0.55], [-0.25, 0.25], [0.55, 1.42]] as const) {
          block(m, "rim", a, b, LEDGE - 0.03, LEDGE + 0.005, z0, z1);
          for (const z of [z0 + 0.1, z1 - 0.1]) block(m, "steel", e > 0 ? a : b - 0.04, e > 0 ? a + 0.04 : b, LEDGE - 0.14, LEDGE - 0.03, z - 0.015, z + 0.015);
        }
      });
  });
}

/** The roof headlight in its box on the cab roof's front, the horns on the crest (72084, 72064). */
function roofEnds(m: MeshBuilder): void {
  m.scope("roof headlights", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const [y0, y1] = [3.66, 3.92];
        const xf = lerpTable(TIP, y0) - 0.02, xb = lerpTable(TIP, y1) - 0.1;
        block(m, "lampBox", e > 0 ? xb : -xf, e > 0 ? xf : -xb, y0 - 0.06, y1, -0.19, 0.19);
        const at = (z: number, y: number, d: number): Vec3 => [e * (xf + d), y, z];
        const n: Vec3 = [e, 0, 0];
        surfacePanel(m, "rim", at, n, e > 0 ? ngon(12, 0.11, 0, 0, 3.79).map(([u, v]) => [-u, v] as [number, number]).reverse() : ngon(12, 0.11, 0, 0, 3.79), 0.0, 0.02);
        surfacePanel(m, "lampHead", at, n, e > 0 ? ngon(12, 0.085, 0, 0, 3.79).map(([u, v]) => [-u, v] as [number, number]).reverse() : ngon(12, 0.085, 0, 0, 3.79), 0.0, 0.03);
      });
  });
  m.scope("horns", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const yb = CROWN;
        for (const z of [-0.13, 0.13]) {
          const x0 = e * 7.1, x1 = e * 7.4;
          const bell = ngon(8, 0.075, 0, z, yb + 0.1), pipe = ngon(8, 0.04, 0, z, yb + 0.1);
          m.sweep("horn", "x", e > 0 ? pipe : bell, Math.min(x0, x1), e > 0 ? bell : pipe, Math.max(x0, x1));
        }
        block(m, "steel", e > 0 ? 6.95 : -7.25, e > 0 ? 7.25 : -6.95, yb - 0.04, yb + 0.05, -0.2, 0.2);
      });
  });
}

/** The radiator louvres along both roof slopes: two bays, then twelve (72163, 72029). */
function roofLouvres(m: MeshBuilder, sp: ShellSpec): void {
  const runs: Array<[number, number, number]> = [[-4.17, -3.07, 2], [-2.93, 3.5, 12]];
  const [y0, y1] = [3.73, 4.15];
  m.scope("roof louvres", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0.7, sd * 0.7];
        const wind = (q: Ring): Ring => (sd > 0 ? q : [...q].reverse());
        const slots: Ring[] = [];
        for (const [a, b, k] of runs) {
          surfacePanel(m, "roofBox", at, n, wind(rect(a, y0 - 0.03, b, y1 + 0.03)), -0.004, 0.012);
          const bay = (b - a) / k;
          for (let i = 0; i < k; i++) {
            const x0 = a + i * bay + 0.04, x1 = a + (i + 1) * bay - 0.04;
            surfacePanel(m, "louvre", at, n, wind(rect(x0, y0, x1, y1)), 0.0, 0.016);
            for (let j = 0; j < 6; j++) {
              const s = x0 + 0.03 + j * ((x1 - x0 - 0.06) / 6);
              slots.push(wind(rect(s, y0 + 0.03, s + 0.035, y1 - 0.03)));
            }
          }
        }
        m.scope("slats", () => surfaceDecal(m, "slat", at, n, slots, 0.022));
      });
  });
}

/** The monomotor C bogie (Y 218): three wheelsets, axle boxes on coils, one motor driving them all. */
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
            block(m, "bogie", x - 0.2, x + 0.2, ay + 0.33, ay + 0.37, ...side(s, 0.9, 1.06));
            coil(m, "spring", x, s * 0.98, ay + 0.1, ay + 0.33, 0.1, 2, 6);
          });
        }
      });
    m.scope("motor", () => {
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

/** The body's brackets over each bogie's springs; the fuel tank and the battery boxes between the bogies (72163, 72029). */
function underBody(m: MeshBuilder): void {
  m.scope("bogie brackets", () => {
    for (const xc of [-BOGIE_X, BOGIE_X])
      for (const d of [-0.8, 0.8])
        for (const s of [-1, 1]) block(m, "bogie", xc + d - 0.18, xc + d + 0.18, FRAME_TOP + 0.04, 0.99, ...side(s, 1.3, 1.42));
  });
  m.scope("fuel tank", () => {
    // the 5,500 l tank, a cylinder from -1.95 m to 1.29 m, with its two straps
    const sect = ngon(14, 0.36, Math.PI / 14, 0, 0.66);
    m.sweep("tank", "x", sect, -1.95, sect, 1.29);
    for (const x of [-1.2, 0.55]) block(m, "underframe", x - 0.05, x + 0.05, 0.28, 0.99, -0.4, 0.4);
  });
  m.scope("battery boxes", () => {
    for (const [x0, x1] of [[1.54, 2.42], [2.45, 3.33]] as const) block(m, "tank", x0, x1, 0.72, 0.99, -1.18, 1.18);
  });
}

/** The CC 72000 in a livery. */
export function sncfCc72000(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    grille(m, sp, l);
    panels(m, sp);
    sideLettering(m, sp, l);
    noseLogos(m, sp, l);
    frontNumbers(m, sp, l);
    wipers(m, sp);
    handrails(m);
    lowerEnds(m);
    underBody(m);
  });
  m.scope("bogies", () => {
    for (const xc of [-BOGIE_X, BOGIE_X]) m.scope(xc > 0 ? "front bogie" : "rear bogie", () => monomotorBogie(m, xc));
  });
  m.scope("roof equipment", () => {
    roofEnds(m);
    roofLouvres(m, sp);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function sncfCc72000Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v), true));
}
