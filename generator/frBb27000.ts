// The SNCF BB 27000 (proc-vehicle-sncf-bb27000): Alstom's Prima of 2001 - 2006 (BB 27001 -
// 27180, numbered 427001 - 427180 by Fret SNCF), a dual-voltage Bo'Bo' (1.5 kV DC, 25 kV
// 50 Hz) of 4,200 kW and 140 km/h, on the box locomotive kit (boxLocoKit.ts) with its own
// profile, measured on the reference photographs (assets/sncf-bb27000/SOURCES.md;
// docs/models/france-trains.md):
//
// - the published figures: 19.52 m over the buffers (painted on the frame beside the
//   pivots' 10.06 m on 427020), 2.857 m wide, 4.31 m high, 90 t, bogie wheelbase 2.6 m,
//   1,150 mm wheels (fr.wikipedia's infobox after Redoutey, La Vie du Rail 2007);
// - head-on, 427167 at Esbly (about 75 px/m at the face) and 427002 at Monnerville: the
//   face is almost the full width (2.86 m) to the lamps, the large single windscreen a
//   trapezoid 1.96 m wide at its foot (2.93 m) and 1.8 m at its head (3.71 m) in a grey
//   surround with the grey ledge under it (2.66 - 2.93 m, a dark vent slot across it); the
//   green nose below with the small headlight at its top (2.5 m), the number (white,
//   0.16 m) left of the middle and the SNCF logo on the right, the white headlights
//   outboard of the red tail lamps at 1.7 - 1.8 m (|z| 1.04 and 0.8), the perforated
//   grille between the red lamps and at both corners, the nose's bottom edge at 1.47 m;
//   the big rectangular buffers on the dark buffer beam under it;
// - three-quarter, 427020 (its right side, end 1 ahead) and 427065 (right side): the
//   nose upright from 1.47 to 2.66 m and bowed forward at the lamps, the windscreen raked
//   0.4 m back to its head and the cab roof edge another 0.5 m back; the face's corners
//   swept back about 0.35 m at the nose and 0.48 m beside the windscreen;
// - side-on, 427094 (its left side) at Saint-Etienne-du-Rouvray and 27112M (VFLI's
//   livery, the same body, its left side) at Longueau, 1-D projective fits along the
//   side (about 150 px/m at the near cab, 40 - 60 px/m at the far one, heights from the
//   rail and the 1.0 m skirt): the cab side 1.7 m from the face's corner to the cab door
//   (0.7 m, 1.6 - 3.8 m, its window 2.95 - 3.6 m), the rear-view mirror ahead of it; on
//   the left side a tall machine-room door with a big window behind each cab door (at
//   end 2 behind a 1.2 m strip of ribs) and a small window ahead of the middle; on the
//   right side the tall door at end 2 only; the horizontal ribs (corrugations) of the
//   machine room from 1.58 to 3.62 m at 0.12 m pitch; the grey skirt band (1.0 - 1.33 m)
//   all along and down to 0.62 m under the cabs; the roof's cant grilles over the middle
//   (about 6 m); the cab roofs standing 0.1 m over the machine room's roof well;
// - the Fret SNCF livery (the photographs agree on it): a metallic silver-grey body, the
//   jade-green faces wrapping round to the corners, and at one end of each side (end 1 on
//   the left side, end 2 on the right: the livery turns about the vertical axis) the
//   whole cab green back to an edge leaning forward 1.2 m from the skirt band to the
//   roof, the 2.9 m white band behind it with the green italic "FRET" (1.88 - 2.85 m) and a
//   soft edge into the grey; the running number in white on the green cab side, the SNCF
//   logo on the grey one; the grey roof and roof well;
// - the roof: a single-arm pantograph over each cab (one for each voltage), its hinge
//   over the cab door's rear edge and its knee toward the cab, the rear one raised (as
//   27065 runs); the post insulators and the line along the roof well; the horns and
//   the radio plate on the cab roofs.
//
// Running number: 427020 (the class article's photograph; SOURCES.md).

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, lerpTable, onEnd, onSide, roundRect, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

// --- measures (m) -------------------------------------------------------------------

/** Half the length over the buffers (19.52 m). */
const HALF = 9.76;
/** The buffer beam's front, |x|. */
const BEAM = 9.12;
/** The shell's bottom: the skirt's lower edge. */
const Y0 = 1.02;
/** The body's half width (2.857 m). */
const W = 1.43;
/** The grey skirt band's top along the side, the green nose's lower edge on the face. */
const LOW_BAND = 1.33;
const NOSE_FOOT = 1.47;
/** The grey ledge under the windscreen, the windscreen's foot and head, the face's top edge. */
const LEDGE = 2.66;
const SCREEN: Span = [2.93, 3.71];
const FACE_TOP = 3.85;
/** The side wall's top (the cant's foot), the cant's top, the roof well's crown. */
const SIDE_TOP = 3.92;
const CANT_TOP = 4.1;
const CROWN = 4.18;
/** The cab roofs over the roof well. */
const CAB_ROOF = 4.28;

/** The face's centre line [y, |x|], bottom first: the skirt, the chin under the nose, the bowed nose, the ledge, the raked windscreen, the cab roof's edge. */
const TIP: Table = [
  [Y0, 8.95], [NOSE_FOOT - 0.03, 8.95], [NOSE_FOOT, 9.1], [1.8, 9.18], [2.35, 9.15], [LEDGE, 9.02], [SCREEN[0], 8.9],
  [SCREEN[1], 8.5], [FACE_TOP, 8.42], [CANT_TOP, 8.18], [CROWN, 8.02],
];
/** The half width [y, hw]: upright walls, the cant leaning in, the roof well. */
const HW: Table = [[Y0, W], [SIDE_TOP, W], [CANT_TOP, 1.18], [CROWN, 0.92]];
/** The face corners in plan by height: their width (z) and how far they sweep back (x). */
const CORNER_W: Table = [[Y0, 0.3], [NOSE_FOOT, 0.32], [LEDGE, 0.38], [SCREEN[0], 0.42], [SCREEN[1], 0.48], [FACE_TOP, 0.48], [CROWN, 0.3]];
const CORNER_D: Table = [[Y0, 0.28], [NOSE_FOOT, 0.32], [1.8, 0.36], [LEDGE, 0.38], [SCREEN[0], 0.42], [SCREEN[1], 0.48], [FACE_TOP, 0.48], [CROWN, 0.3]];
/** The face's bow across its flat middle. */
const BOW = 0.02;
const ANGLES = [30, 60, 90].map((a) => (a * Math.PI) / 180);

function endPlan(y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(lerpTable(CORNER_W, y), w * 0.9), d = lerpTable(CORNER_D, y);
  const flat = w - r;
  return [[0, 0], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (d - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the face's corner at height y (|x|). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - lerpTable(CORNER_D, y) - 0.004;
/** Every profile row between y0 and y1, with both ends. */
const rows = (y0: number, y1: number): number[] =>
  [...new Set([y0, ...[...TIP, ...HW, ...CORNER_D].map(([y]) => y).filter((y) => y > y0 + 1e-3 && y < y1 - 1e-3), y1])].sort((a, b) => a - b);

/** The bogie centres (pivots 10.06 m), half the wheelbase (2.6 m), the wheels (1,150 mm), the frame's top. */
const BOGIE_X = 5.03;
const HALF_BASE = 1.3;
const WHEEL_R = 0.575;
const FRAME_TOP = 0.88;

/** The pantographs: the base's centre |x| (hinge 0.5 m inboard of it), the arms. */
const PANTO_X = 6.9;
const PANTO_ARMS = { lower: 1.5, upper: 1.9 };

// --- the livery ---------------------------------------------------------------------

interface Bb27000Livery { title: string; number: string }

/**
 * The key is stored in saved maps: never rename it. The single livery is not a
 * parameter, so its title is not exported.
 */
const LIVERIES: Record<string, Bb27000Livery> = {
  fret: { title: "Fret SNCF", number: "427020" },
};

export const BB27000_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Bb27000Livery => LIVERIES[resolveParams(BB27000_PARAMS, v).livery!]!;

const PALETTE: Record<string, MaterialSpec> = {
  body: { color: "#b3b9bd", metallic: 0.35, roughness: 0.45 },
  skirt: c("#8d9397", 0.6),
  green: c("#13a283", 0.4),
  white: c("#eef0ee", 0.45),
  fade: c("#ccd1d2", 0.45),
  roofGrey: c("#767d82", 0.65),
  surround: c("#686e73", 0.55),
  ribGreen: c("#086650", 0.5),
  ribWhite: c("#b2b8ba", 0.5),
  ribFade: c("#9aa1a5", 0.5),
  ribGrey: c("#737a7f", 0.5),
  mesh: c("#0c6650", 0.8),
  meshGrey: c("#4a5054", 0.8),
  mask: c("#1d1f21", 0.6),
  beam: c("#2f3235", 0.75),
  rim: c("#8a9094", 0.45),
  logoRed: c("#c4245e", 0.45),
  wiper: c("#26282a", 0.5),
};

// --- the side -----------------------------------------------------------------------

/** The green cab's back edge, |x| at height y: 4.4 m from the middle at the skirt band, leaning forward to 3.2 m at the roof. */
const greenEdge = (y: number): number => 4.4 - (1.2 * (y - LOW_BAND)) / (SIDE_TOP - LOW_BAND);
/** The white band behind it and its soft edge into the grey. */
const WHITE_W = 2.9;
const FADE_W = 0.3;
/** Which end's cab is green on side sd (+1 right, +z): end 2 on the right, end 1 on the left. */
const greenEnd = (sd: number): number => -sd;

/** The paint region at |x| s (toward the green end) and height y. */
function region(s: number, y: number): "green" | "white" | "fade" | "grey" {
  const g = greenEdge(y);
  return s > g ? "green" : s > g - WHITE_W ? "white" : s > g - WHITE_W - FADE_W ? "fade" : "grey";
}

/** The doors and windows of each side (x spans): right side (+z) and left side (-z), measured on the photos. */
interface SideLayout { cabDoors: Span[]; tallDoors: Span[]; ribs: Span[]; small?: Span }
const CAB_DOOR: Span = [6.45, 7.15];
const DOOR_Y: Span = [1.6, 3.8];
const TALL_Y: Span = [1.6, 3.72];
const RIB_Y: Span = [1.58, 3.62];
const SMALL_Y: Span = [2.95, 3.6];
const LAYOUT: Record<number, SideLayout> = {
  // the right side: the cab door at end 1 straight onto the ribs; the tall door behind the cab door at end 2
  [1]: { cabDoors: [CAB_DOOR, [-7.15, -6.45]], tallDoors: [[-6.25, -5.35]], ribs: [[-5.25, 6.3]] },
  // the left side: the tall door behind both cab doors (at end 2 behind a strip of ribs), the small window ahead of the middle
  [-1]: { cabDoors: [CAB_DOOR, [-7.15, -6.45]], tallDoors: [[5.35, 6.25], [-4.9, -4.0]], ribs: [[-3.9, 5.25], [-6.3, -5.0]], small: [1.6, 2.3] },
};

/** Paint: the green cab, the white band and its soft edge, slab by slab between the profile's rows. */
function liveryFields(sd: number): SideItem[] {
  const e = greenEnd(sd);
  const out: SideItem[] = [];
  const ys = rows(LOW_BAND, SIDE_TOP);
  const add = (name: string, mat: string, back: (y: number) => number, front: (y: number) => number) => {
    for (let i = 1; i < ys.length; i++) {
      const [ya, yb] = [ys[i - 1]!, ys[i]!];
      // (u, v) counter-clockwise in x; e < 0 mirrors x, so turn the ring about
      const q: Array<[number, number]> = [[e * back(ya), ya], [e * front(ya), ya], [e * front(yb), yb], [e * back(yb), yb]];
      const poly: Ring = e > 0 ? q : [...q].reverse().map(([x, y]) => [x, y] as [number, number]);
      const xs = q.map((p) => p[0]);
      out.push({ kind: "paint", name: `${name} ${i}`, x: [Math.min(...xs), Math.max(...xs)], y: [ya, yb], mat, sides: [sd], poly });
    }
  };
  add("green cab", "green", greenEdge, sideEnd);
  add("white band", "white", (y) => greenEdge(y) - WHITE_W, greenEdge);
  add("white fade", "fade", (y) => greenEdge(y) - WHITE_W - FADE_W, (y) => greenEdge(y) - WHITE_W);
  return out;
}

/** The ribs: a shadow line each 0.12 m, coloured by the paint it crosses, broken at the doors and windows; flat strips over the paint. */
function ribs(m: MeshBuilder, sp: ShellSpec, sd: number): void {
  const e = greenEnd(sd);
  const L = LAYOUT[sd]!;
  const at = onSide(sp, sd);
  const RIB_MAT = { green: "ribGreen", white: "ribWhite", fade: "ribFade", grey: "ribGrey" } as const;
  const byMat = new Map<string, Ring[]>();
  for (let y = RIB_Y[0]; y <= RIB_Y[1] + 1e-6; y += 0.12) {
    const yc = y + 0.014;
    for (const [a, b] of L.ribs) {
      // the cuts: the paint's edges at this height, the small window
      const g = greenEdge(yc);
      const cuts = [g, g - WHITE_W, g - WHITE_W - FADE_W].map((s) => e * s);
      let pieces: Span[] = [[a, b]];
      if (L.small && yc > SMALL_Y[0] - 0.06 && yc < SMALL_Y[1] + 0.06)
        pieces = pieces.flatMap(([p, q]): Span[] => {
          const [w0, w1] = [L.small![0] - 0.06, L.small![1] + 0.06];
          const out: Span[] = w1 <= p || w0 >= q ? [[p, q]] : [[p, w0], [w1, q]];
          return out.filter(([s, t]) => t - s > 0.05);
        });
      for (const [p, q] of pieces) {
        const xs = [p, ...cuts.filter((x) => x > p + 0.01 && x < q - 0.01).sort((s, t) => s - t), q];
        for (let i = 1; i < xs.length; i++) {
          const [x0, x1] = [xs[i - 1]!, xs[i]!];
          const mat = RIB_MAT[region(e * ((x0 + x1) / 2), yc)];
          const q: Ring = [[x0, y], [x1, y], [x1, y + 0.036], [x0, y + 0.036]];
          if (!byMat.has(mat)) byMat.set(mat, []);
          byMat.get(mat)!.push(sd > 0 ? q : [...q].reverse());
        }
      }
    }
  }
  m.scope(sd > 0 ? "right ribs" : "left ribs", () => {
    for (const mat of Object.values(RIB_MAT)) if (byMat.has(mat)) surfaceDecal(m, mat, at, [0, 0, sd], byMat.get(mat)!, 0.0045);
  });
}

function sideItems(): SideItem[] {
  const out: SideItem[] = [];
  for (const sd of [1, -1]) {
    const L = LAYOUT[sd]!;
    out.push(...liveryFields(sd));
    for (const [i, x] of L.cabDoors.entries())
      out.push({ kind: "door", name: `cab door ${i + 1}`, x, y: DOOR_Y, win: [2.95, 3.6], rails: true, sides: [sd] });
    for (const [i, x] of L.tallDoors.entries())
      out.push({ kind: "door", name: `machine room door ${i + 1}`, x, y: TALL_Y, win: [1.9, 3.55], sides: [sd] });
    if (L.small) out.push({ kind: "window", name: "machine room window", x: L.small, y: SMALL_Y, mat: "rim", r: 0.04, sides: [sd] });
  }
  // the cant grilles over the middle, the livery turned about the vertical axis like the rest
  for (const sd of [1, -1]) {
    const [a, b] = sd < 0 ? [-2.4, 3.7] : [-3.7, 2.4];
    const n = 4, wd = (b - a) / n;
    for (let i = 0; i < n; i++)
      out.push({ kind: "grille", name: `cant grille ${i + 1}`, x: [a + i * wd + 0.04, a + (i + 1) * wd - 0.04], y: [SIDE_TOP + 0.03, CANT_TOP - 0.02], mat: "meshGrey", slats: "h", pitch: 0.05, r: 0.01, sides: [sd] });
  }
  return out;
}

// --- the face -----------------------------------------------------------------------

function endItems(): EndItem[] {
  const trap = (b: number, t: number, y0: number, y1: number): Ring => [[-b, y0], [b, y0], [t, y1], [-t, y1]];
  const out: EndItem[] = [
    // the grey surround of the windscreen with the ledge under it, the vent slot, the glass
    { kind: "paint", name: "windscreen surround", z: [-1.09, 1.09], y: [LEDGE, FACE_TOP], mat: "surround", layer: 1, poly: trap(1.09, 0.99, LEDGE, FACE_TOP) },
    { kind: "paint", name: "vent slot", z: [-0.92, 0.92], y: [2.74, 2.79], mat: "mask", layer: 2, poly: roundRect(-0.92, 0.92, 2.74, 2.79, 0.02) },
    { kind: "paint", name: "windscreen", z: [-0.98, 0.98], y: SCREEN, mat: "glass", layer: 3, poly: trap(0.98, 0.9, SCREEN[0], SCREEN[1]) },
    // the perforated grilles between the red lamps and at the corners
    { kind: "paint", name: "nose grille", z: [-0.66, 0.66], y: [1.53, 1.93], mat: "mesh", layer: 1, poly: roundRect(-0.66, 0.66, 1.53, 1.93, 0.02) },
    { kind: "paint", name: "corner grille right", z: [1.18, 1.4], y: [1.53, 1.93], mat: "mesh", layer: 1, poly: roundRect(1.18, 1.4, 1.53, 1.93, 0.02) },
    { kind: "paint", name: "corner grille left", z: [-1.4, -1.18], y: [1.53, 1.93], mat: "mesh", layer: 1, poly: roundRect(-1.4, -1.18, 1.53, 1.93, 0.02) },
    // the lamps: white outboard, red inboard; the small headlight at the nose's top
    { kind: "lamp", name: "headlight right", z: [0.97, 1.11], y: [1.73, 1.87], r: 0.075 },
    { kind: "lamp", name: "headlight left", z: [-1.11, -0.97], y: [1.73, 1.87], r: 0.075 },
    { kind: "lamp", name: "tail lamp right", z: [0.73, 0.87], y: [1.61, 1.75], r: 0.07, mat: "lampRed" },
    { kind: "lamp", name: "tail lamp left", z: [-0.87, -0.73], y: [1.61, 1.75], r: 0.07, mat: "lampRed" },
    { kind: "lamp", name: "top headlight", z: [-0.07, 0.07], y: [2.44, 2.58], r: 0.065 },
    // the logo's field on the right
    { kind: "paint", name: "logo", z: [0.62, 1.02], y: [1.97, 2.21], mat: "logoRed", layer: 1, poly: roundRect(0.62, 1.02, 1.97, 2.21, 0.04) },
  ];
  return out;
}

/** Lays reader-space triangles (u to the reader's right, v up) on both ends, d off the face. */
function layEndTris(m: MeshBuilder, sp: ShellSpec, mat: string, tris: ReadonlyArray<readonly [number, number]>, d: number): void {
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    m.scope(e > 0 ? "front" : "rear", () => m.facets(mat, tris.map(([u, v]) => at(-e * u, v, d)), [e, 0, 0]));
  }
}

const NUMBER_STYLE = { weight: 0.15, width: 0.56, gap: 0.14 };
const LOGO_STYLE = { weight: 0.17, width: 0.6, gap: 0.08, slant: 0.12 };

/** The face's running number and the SNCF on its logo. */
function faceLettering(m: MeshBuilder, sp: ShellSpec, l: Bb27000Livery): void {
  m.scope("face number", () => {
    const h = 0.16, w = wordWidth(l.number, h, NUMBER_STYLE);
    layEndTris(m, sp, "white", letters(l.number, -0.18 - w / 2, 1.99, h, false, NUMBER_STYLE), 0.006);
  });
  m.scope("face logo", () => {
    const h = 0.11, w = wordWidth("SNCF", h, LOGO_STYLE);
    layEndTris(m, sp, "white", letters("SNCF", 0.82 - w / 2, 2.035, h, false, LOGO_STYLE), 0.007);
  });
}

/** The wiper parked down the windscreen's left half from its pivot over the glass. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const arm: Ring = [[-0.35, SCREEN[1] - 0.02], [-0.32, SCREEN[1] - 0.02], [-0.6, SCREEN[0] + 0.25], [-0.63, SCREEN[0] + 0.25]];
      const q: Ring = arm.map(([u, v]) => [-e * u, v] as [number, number]);
      m.scope(e > 0 ? "front" : "rear", () => surfacePanel(m, "wiper", at, [e, 0, 0], e > 0 ? q : [...q].reverse(), 0.012, 0.03));
    }
  });
}

/** The grab handles on the face's corners beside the lamps. */
function faceHandles(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("face handles", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "right" : "left"}`, () => {
          const p = (z: number, y: number, d: number): Vec3 => at(-e * s * z, y, d);
          tubeX(m, "steel", 0.016, ...p(1.3, 1.6, 0.06), ...p(1.3, 2.0, 0.06), 6);
          for (const y of [1.6, 2.0]) tubeX(m, "steel", 0.012, ...p(1.3, y, -0.02), ...p(1.3, y, 0.06), 6);
        });
    }
  });
}

// --- the side's fittings ------------------------------------------------------------

/** The side lettering: the white number on the green cab side, the SNCF logo on the grey one, the green FRET on the white band. */
function sideLettering(m: MeshBuilder, sp: ShellSpec, l: Bb27000Livery): void {
  for (const sd of [1, -1]) {
    const at = onSide(sp, sd);
    const e = greenEnd(sd);
    const n: Vec3 = [0, 0, sd];
    // the reader's u runs +x on the right side, -x on the left: letters() flips for the left
    const place = (tris: ReadonlyArray<readonly [number, number]>, mat: string, d: number) => m.facets(mat, tris.map(([u, v]) => at(u, v, d)), n);
    const word = (text: string, xc: number, v: number, h: number, style: object, mat: string, d: number) => {
      const w = wordWidth(text, h, style);
      place(letters(text, sd > 0 ? xc - w / 2 : xc + w / 2, v, h, sd < 0, style), mat, d);
    };
    m.scope(sd > 0 ? "right lettering" : "left lettering", () => {
      m.scope("number", () => word(l.number, e * 7.95, 1.66, 0.25, NUMBER_STYLE, "white", 0.006));
      m.scope("logo", () => {
        const x = -e * 8.0;
        const q = roundRect(x - 0.4, x + 0.4, 2.0, 2.52, 0.07);
        surfaceDecal(m, "logoRed", at, n, [sd > 0 ? q : [...q].reverse()], 0.005);
        word("SNCF", x, 2.12, 0.25, LOGO_STYLE, "white", 0.008);
      });
      m.scope("fret", () => {
        const style = { weight: 0.2, width: 0.62, gap: 0.1, slant: 0.28 };
        const h = 0.97, w = wordWidth("FRET", h, style);
        // the word starts 0.35 m into the white band at its foot and reads away from the green cab
        const s0 = greenEdge(1.88) - 0.35;
        const xc = e * (s0 - w / 2);
        word("FRET", xc, 1.88, h, style, "green", 0.016);
      });
    });
  }
}

/** The rear-view mirrors folded against the cab sides ahead of the doors. */
function mirrors(m: MeshBuilder): void {
  m.scope("mirrors", () => {
    for (const e of [-1, 1]) for (const sd of [-1, 1]) {
      const [x0, x1] = e > 0 ? [7.27, 7.39] : [-7.39, -7.27];
      block(m, "mask", x0, x1, 3.05, 3.62, sd > 0 ? W + 0.005 : -W - 0.07, sd > 0 ? W + 0.07 : -W - 0.005);
    }
  });
}

/** The cabs' deep grey skirts down to the steps and the dark buffer beams with their steps. */
function lowerEnds(m: MeshBuilder): void {
  m.scope("cab skirts", () => {
    for (const e of [-1, 1]) {
      const sp = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
      m.scope(e > 0 ? "front" : "rear", () => {
        block(m, "skirt", ...sp(7.25, sideEnd(Y0) - 0.02), 0.62, Y0 - 0.002, -W + 0.01, W - 0.01);
        block(m, "beam", ...sp(sideEnd(Y0) - 0.03, BEAM), 0.72, NOSE_FOOT - 0.06, -1.02, 1.02);
        // the end steps at the corners
        for (const z of [-1, 1]) {
          const zz: [number, number] = z > 0 ? [1.12, 1.38] : [-1.38, -1.12];
          for (const y of [0.45, 0.8]) block(m, "steel", ...sp(BEAM - 0.25, BEAM - 0.02), y, y + 0.035, ...zz);
          block(m, "beam", ...sp(BEAM - 0.27, BEAM - 0.23), 0.4, 0.98, ...zz);
        }
      });
    }
  });
}

// --- the roof -----------------------------------------------------------------------

/** The cab roofs standing over the roof well, from behind the face's top edge back past the pantograph. */
function cabRoofs(): RoofBox[] {
  const front = lerpTable(TIP, CROWN) - 0.06;
  return [
    { name: "front cab roof", x: [5.7, front], w: [0.92, 0.86], y: [CROWN - 0.01, CAB_ROOF], mat: "roofGrey" },
    { name: "rear cab roof", x: [-front, -5.7], w: [0.92, 0.86], y: [CROWN - 0.01, CAB_ROOF], mat: "roofGrey" },
    // the hatch over the cant grilles in the roof well
    { name: "roof hatch", x: [-2.0, 2.0], w: [0.8, 0.74], y: [CROWN - 0.01, CROWN + 0.05], mat: "roofGrey" },
  ];
}

function roofGear(m: MeshBuilder): void {
  m.scope("roof line", () => {
    for (const e of [-1, 1]) {
      const x = e * 4.8;
      m.scope(e > 0 ? "front insulator" : "rear insulator", () => insulator(m, x, 0.32, CROWN - 0.01, CROWN + 0.36));
      tubeX(m, "copper", 0.018, x, CROWN + 0.36, 0.32, e * (PANTO_X - 0.62), CROWN + 0.36, 0.32, 6);
      tubeX(m, "copper", 0.018, e * (PANTO_X - 0.62), CROWN + 0.36, 0.32, e * (PANTO_X - 0.62), CAB_ROOF + 0.12, 0.32, 6);
      // the main circuit breaker beside the line
      m.scope(e > 0 ? "front breaker" : "rear breaker", () => {
        m.prism("beam", ngon(8, 0.13, Math.PI / 8, e * 3.9, -0.3), CROWN - 0.01, CROWN + 0.16);
        m.prism("insulator", ngon(8, 0.06, 0, e * 3.9, -0.3), CROWN + 0.16, CROWN + 0.46);
      });
    }
    tubeX(m, "copper", 0.018, -4.8, CROWN + 0.36, 0.32, 4.8, CROWN + 0.36, 0.32, 6);
  });
  m.scope("horns", () => {
    // two trumpets on a post at each cab roof's front, their bells forward
    for (const e of [-1, 1]) for (const z of [-0.2, 0.2]) {
      const y = CAB_ROOF + 0.12;
      const stem = ngon(6, 0.035, 0, z, y), bell = ngon(6, 0.07, 0, z, y);
      const [a, b, cc] = [e * 7.35, e * 7.6, e * 7.72];
      if (e > 0) {
        m.sweep("mask", "x", stem, a, stem, b);
        m.sweep("mask", "x", stem, b, bell, cc);
      } else {
        m.sweep("mask", "x", bell, cc, stem, b);
        m.sweep("mask", "x", stem, b, stem, a);
      }
      const [p0, p1] = e > 0 ? [7.38, 7.43] : [-7.43, -7.38];
      block(m, "beam", p0, p1, CAB_ROOF - 0.005, y - 0.03, z - 0.02, z + 0.02);
    }
  });
  m.scope("radio plate", () => {
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [6.0, 6.4] : [-6.4, -6.0];
      block(m, "mask", a, b, CAB_ROOF + 0.19, CAB_ROOF + 0.21, -0.82, -0.56);
      block(m, "beam", (a + b) / 2 - 0.02, (a + b) / 2 + 0.02, CAB_ROOF - 0.005, CAB_ROOF + 0.19, -0.71, -0.67);
    }
  });
}

// --- the spec -----------------------------------------------------------------------

function spec(l: Bb27000Livery): LocoSpec {
  return {
    palette: PALETTE,
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: [[Y0, LOW_BAND, "skirt"], [LOW_BAND, SIDE_TOP, "body"], [SIDE_TOP, 9, "roofGrey"]],
    end: [[Y0, NOSE_FOOT, "skirt"], [NOSE_FOOT, FACE_TOP, "green"], [FACE_TOP, 9, "roofGrey"]],
    roof: "roofGrey",
    buffers: HALF,
    beam: BEAM,
    bufferY: 1.04,
    bufferHead: "rect",
    frame: { y0: 0.82, y1: Y0 + 0.01, half: 8.7, hw: 1.34, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    pantograph: { kind: "singleArm", x: PANTO_X, roofY: CAB_ROOF, baseY: CAB_ROOF + 0.14, ...PANTO_ARMS },
    sideItems: sideItems(),
    endItems: endItems(),
    roofItems: cabRoofs(),
    // the transformer between the bogies, the air reservoirs and boxes beside it
    underItems: [[-2.4, 2.4, 0.5, 0.82, 1.1], [-3.3, -2.5, 0.6, 0.82, 1.2], [2.5, 3.3, 0.6, 0.82, 1.2]],
    plough: "beam",
    number: l.number,
  };
}

/** The SNCF BB 27000 in Fret SNCF's livery. */
export function sncfBb27000(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    faceLettering(m, sp, l);
    wipers(m, sp);
    faceHandles(m, sp);
    for (const sd of [1, -1]) ribs(m, sp, sd);
    sideLettering(m, sp, l);
    mirrors(m);
    lowerEnds(m);
  });
  m.scope("roof equipment", () => roofGear(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile, with the green cabs and white bands on the sides. */
export function sncfBb27000Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  // the cab roofs and the roof hatch stand too low to read from afar: the budget goes to the paint
  const s = spec(l);
  const m = boxLocoLod({ ...s, roofItems: [], endItems: [...s.endItems, { kind: "window", name: "windscreen", z: [-0.94, 0.94], y: SCREEN }] }, 84);
  m.scope("livery fields", () => {
    for (const sd of [-1, 1]) {
      const e = greenEnd(sd), z = sd * (W + 0.012);
      const [lo, hi] = [LOW_BAND, SIDE_TOP];
      const quad = (mat: string, a: (y: number) => number, b: (y: number) => number) => {
        const p: Vec3[] = [[e * a(lo), lo, z], [e * b(lo), lo, z], [e * b(hi), hi, z], [e * a(hi), hi, z]];
        m.facets(mat, [p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!], [0, 0, sd]);
      };
      quad("green", greenEdge, (y) => sideEnd(y) - 0.02);
      quad("white", (y) => greenEdge(y) - WHITE_W, greenEdge);
    }
  });
  return m;
}
