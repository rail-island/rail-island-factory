// The Renfe 333 (proc-vehicle-renfe-333): Macosa's Co'Co' diesel-electric of 1974 - 1976 on
// GM-EMD's GT26 equipment (the 16-645-E3 engine, 3,300 hp) in a body after NOHAB's DSB MZ,
// rebuilt by Alstom Valencia in 2002 - 2006 as the 333.3 (120 km/h) and the 333.4 (160 km/h)
// with new cabs of the Prima family. Both liveries of the model are photographed on rebuilt
// engines - 333 301 in Renfe Mercancias' yellow, 333 407 in the Trenhotel's ivory and bronze
// hauling the Lusitania's Talgo - so the model is the rebuilt 333.3 / .4, on the box locomotive
// kit (boxLocoKit.ts) with its own profile, measured on the reference photographs
// (assets/renfe-333/SOURCES.md; docs/models/spain-trains.md):
//
// - the published figures of the rebuilt engines: 22.33 m over the buffers, 3.16 m wide,
//   4.307 m high, 120 t, 1,016 mm wheels (EMD's 40 in);
// - the side of 333 353 (Peter Broster), almost square on, at about 40 px/m (a 1-D projective
//   fit over the buffers and both bogies, the near end about 15 % larger; heights from the roof
//   at about 38 px/m): the cab 3.25 m long
//   to its joint (7.9 m from the middle), the cab side window 9.0 - 9.75 m with its sliding
//   lower half, the door 8.1 - 8.85 m between two handrails; the long hood's three ribbed
//   panels (joints at -4.8 and +3.0 m, ribbed 1.4 - 3.18 m), the plain band over them to 3.55 m, the cant
//   up to the flat roof with two filter grilles at each end; the face's edge leaning back from
//   1.95 m (0.3 m at the windscreen's foot, 0.85 m at the roof); bogie centres 14.2 m, axles
//   2.0 m apart (the flexicoil springs over the outer axles);
// - the head-ons of 333 301 (92 px/m) and 333 333 (Falk2, 99 px/m), heights from the buffer
//   centres (1.06 m) and the roof: the face 2.84 m wide between its corners, the windscreen one
//   pane 2.13 m wide from 2.97 to 3.83 m in a black frame, the twin headlight box over it
//   (3.97 - 4.24 m) between two round marker lamps, the top corners cut by the cant; the
//   handrails over the lamps (1.97 - 2.45 m), the white headlights outboard of the red tail
//   lamps at 1.75 m, the number under the right-hand pair; the black buffer beam with the big
//   square buffer housings and the plough;
// - 333 359's roof (Nelso Silva): at the front end a dark filter panel on the cant and a
//   louvred box behind it, at the rear end two filter panels; the exhaust mid-roof;
// - 333 407 (Nelso Silva): the Trenhotel livery - ivory, the face and the cab sides bronze up
//   to 2.33 m, a bronze band along the top of the ribbed panels whose lower edge waves (down to
//   the sill at the cab joints, crests at +-5 m and 0, troughs at +-2.5 m), the "Tren Hotel"
//   script on the face, the blue number plate and blue handrails;
// - 333 301 (J.-P. Vergez-Larrouy): Renfe Mercancias' first livery - the cabs yellow all
//   round, the hood silver grey, the Mercancias roundel (a cyan disc, the blue arrow) on the
//   face, the number in black;
// - 333 353, 352, 359 and 333 333: Renfe Operadora's scheme of today - the cabs ivory all round,
//   the hood graphite from the sill to the ribs' top (3.18 m) with the plain band, cant and roof
//   silver grey, a purple line low on the cab side (1.42 - 1.58 m) from the window to the face,
//   the big ivory "renfe" mid-hood and the purple "renfe Mercancias" on the face.

import type { MeshBuilder, MaterialSpec, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type RoofBox, type SideItem } from "./boxLocoKit.ts";
import { c, lerpTable, onEnd, onSide, roundRect, surfaceDecal, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { lowerQuads, lowerWidth } from "./es252.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = readonly [number, number];

/** Half the length over the buffers (22.33 m). */
const HALF = 22.33 / 2;
/** The face's foot, |x|; the buffer beam's front. */
const N = 10.76;
const BEAM = 10.8;
/** The shell's bottom: the sill and the face's foot. */
const Y0 = 1.32;
/** The windscreen's foot and head. */
const SCREEN: readonly [number, number] = [2.97, 3.83];
/** The side wall's top (the cant's foot), the cant's top, the roof. */
const CANT = 3.55;
const CANT_TOP = 4.2;
const CROWN = 4.29;
/** The body's half width (3.16 m). */
const W = 1.58;
/** The ribbed panels' sill and top. */
const RIBS: readonly [number, number] = [1.4, 3.18];

/** The face's centre line [y, |x|], bottom first: upright to 1.95 m, then leaning back to the roof. */
const TIP: Table = [[Y0, N], [1.95, N], [SCREEN[0], N - 0.3], [SCREEN[1], N - 0.52], [CANT_TOP, N - 0.72], [CROWN, N - 0.8]];
/** The half width [y, hw]: upright walls, the cant leaning in, the flat roof. */
const HW: Table = [[Y0, W], [CANT, W], [CANT_TOP, 1.2], [CROWN, 1.0]];
/** The face corners' radius in plan. */
const CORNER = 0.16;
const BOW = 0.015;
const ANGLES = [30, 60, 90].map((a) => (a * Math.PI) / 180);

function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const r = Math.min(CORNER, w * 0.9);
  const flat = w - r;
  return [[0, 0], [flat, BOW], ...ANGLES.map((a) => [flat + r * Math.sin(a), BOW + (r - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the side wall meets the face's corner at height y (paint along the cab side stops there). */
const sideEnd = (y: number): number => lerpTable(TIP, y) - CORNER - 0.005;
/** The front edge of a cab-side field from y0 up to y1: the side's end at every profile row between. */
const frontEdge = (y0: number, y1: number): Pt[] => {
  const ys = [y0, ...[...TIP.map(([y]) => y), ...HW.map(([y]) => y)].filter((y) => y > y0 + 1e-3 && y < y1 - 1e-3).sort((a, b) => a - b), y1];
  return [...new Set(ys)].map((y) => [sideEnd(y), y] as const);
};

// --- liveries ----------------------------------------------------------------------

interface Es333Livery {
  title: string;
  kind: "mercancias" | "talgo" | "operadora";
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  roof: string;
  /** The number as painted (Renfe's dotted or dashed form). */
  number: string;
  /** The cab sides' fields (+x end, mirrored), convex (x, y) outlines, and their colour. */
  cabFields: ReadonlyArray<ReadonlyArray<Pt>>;
  cabMat: string;
  /** The hood's fields (+x half, mirrored), convex outlines. */
  hoodFields: ReadonlyArray<ReadonlyArray<Pt>>;
  hoodMat: string;
  /** The face's handrails and hose sockets. */
  rail: string;
  sockets: readonly string[];
  /** The round marker lamps' lenses beside the top headlight. */
  marker: string;
  /** Narrow stripes laid over the cab fields (+x end, mirrored), convex outlines and their colour. */
  stripes?: ReadonlyArray<{ poly: ReadonlyArray<Pt>; mat: string }>;
  /** The cab roof's colour, where it is not the hood's roof. */
  cabRoof?: string;
}

/** The whole cab side, sill to roof, back to the cab joint. */
const CAB_JOINT = 7.9;
const WHOLE_CAB: ReadonlyArray<ReadonlyArray<Pt>> = [[[CAB_JOINT, Y0], ...frontEdge(Y0, CROWN - 0.01), [CAB_JOINT, CROWN - 0.01]]];
/** The Trenhotel's bronze on the cab side: up to the face's line (2.33 m). */
const BRONZE_TOP = 2.33;
const LOW_CAB: ReadonlyArray<ReadonlyArray<Pt>> = [[[CAB_JOINT, Y0], ...frontEdge(Y0, BRONZE_TOP), [CAB_JOINT, BRONZE_TOP]]];
/** The Trenhotel's wave along the hood: the bronze band's lower edge from the cab joint to the middle. */
const WAVE: readonly Pt[] = [[CAB_JOINT - 0.02, Y0], [6.3, 2.5], [5.0, 2.76], [2.5, 2.25], [0, 2.76]];
const WAVE_FIELDS: ReadonlyArray<ReadonlyArray<Pt>> = WAVE.slice(1).map((p, i) => {
  const q = WAVE[i]!;
  return [q, [q[0], RIBS[1]], [p[0], RIBS[1]], p] as const;
});

/** Renfe Operadora: the graphite hood (sill to the ribs' top) out to the cab joints; the purple line low on the cab side, ahead of the door. */
const OPERADORA_HOOD: ReadonlyArray<ReadonlyArray<Pt>> = [[[0, Y0], [CAB_JOINT - 0.02, Y0], [CAB_JOINT - 0.02, RIBS[1]], [0, RIBS[1]]]];
const PURPLE_LINE: readonly [number, number] = [1.42, 1.58];
const OPERADORA_LINE: ReadonlyArray<Pt> = [[8.92, PURPLE_LINE[0]], ...frontEdge(PURPLE_LINE[0], PURPLE_LINE[1]), [8.92, PURPLE_LINE[1]]];

const LIVERIES: Record<string, Es333Livery> = {
  mercancias: {
    title: "Renfe Mercancias",
    kind: "mercancias",
    palette: {
      body: c("#a3a8ab", 0.5), cab: c("#f0bd1a", 0.45), roofGrey: c("#7d8286", 0.7), ribShade: c("#6d7275", 0.6),
      logoCyan: c("#5bb8de", 0.5), logoBlue: c("#1f4f9a", 0.5), ink: c("#1d1e20", 0.6), rail: c("#2a2b2e", 0.5),
    },
    side: [[Y0, 4.4, "body"]],
    end: [[Y0, 4.4, "cab"]],
    roof: "roofGrey",
    number: "333.301.0",
    cabFields: WHOLE_CAB,
    cabMat: "cab",
    hoodFields: [],
    hoodMat: "cab",
    rail: "rail",
    sockets: ["socketRed", "socketRed", "socketRed"],
    marker: "lampAmber",
    cabRoof: "cab",
  },
  talgo: {
    title: "Talgo",
    kind: "talgo",
    palette: {
      body: c("#e8e3d8", 0.45), bronze: c("#7c5d4a", 0.5), roofGrey: c("#c6c6c1", 0.6), ribShade: c("#a9a59c", 0.6),
      cream: c("#efe2c4", 0.5), plateBlue: c("#1f3f8a", 0.5), rail: c("#2b4fa0", 0.45),
    },
    side: [[Y0, 4.4, "body"]],
    end: [[Y0, BRONZE_TOP, "bronze"], [BRONZE_TOP, 4.4, "body"]],
    roof: "roofGrey",
    number: "333-407-5",
    cabFields: LOW_CAB,
    cabMat: "bronze",
    hoodFields: WAVE_FIELDS,
    hoodMat: "bronze",
    rail: "rail",
    sockets: ["socketBlue", "socketBlue", "socketBlue"],
    marker: "markerLens",
  },
  operadora: {
    title: "Renfe Operadora",
    kind: "operadora",
    palette: {
      body: c("#e9e4d6", 0.45), graphite: c("#3f444a", 0.55), silver: c("#b3b8bb", 0.5), roofGrey: c("#b3b8bb", 0.6), ribShade: c("#2c3035", 0.6),
      purple: c("#8a1f5c"), fadedInk: c("#8e9094", 0.5), ink: c("#2a2b30", 0.6), rail: c("#9a9ea1", 0.45),
    },
    side: [[Y0, 4.4, "silver"]],
    end: [[Y0, 4.4, "body"]],
    roof: "roofGrey",
    number: "333.333.3",
    cabFields: WHOLE_CAB,
    cabMat: "body",
    hoodFields: OPERADORA_HOOD,
    hoodMat: "graphite",
    rail: "rail",
    sockets: ["socketRed", "socketRed", "socketRed"],
    marker: "markerLens",
    stripes: [{ poly: OPERADORA_LINE, mat: "purple" }],
    cabRoof: "body",
  },
};

export const ES333_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Es333Livery => LIVERIES[resolveParams(ES333_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

/** The bogie centres, half the wheelbase, the wheel radius, the frame's top. */
const BOGIE_X = 7.1;
const HALF_BASE = 2.0;
const WHEEL_R = 0.508;
const FRAME_TOP = 0.98;
/** The cab door, the cab side window (+x end). */
const DOOR = { x: [8.1, 8.85] as const, y: [1.45, 3.5] as const };
const CAB_WINDOW = { x: [9.0, 9.72] as const, y: [2.3, 3.45] as const, bar: 2.86 };
/** The ribbed panels' joints on the right side (+z); the left side is turned about. */
const PANEL_JOINTS = [-4.79, 2.99];
const RIB_PITCH = 0.145;

function hoodSide(): SideItem[] {
  const out: SideItem[] = [];
  for (const sd of [-1, 1]) {
    const joints = PANEL_JOINTS.map((x) => (sd > 0 ? x : -x)).sort((a, b) => a - b);
    const edges = [-CAB_JOINT, ...joints, CAB_JOINT];
    for (let i = 0; i + 1 < edges.length; i++) {
      const [x0, x1] = [edges[i]! + 0.06, edges[i + 1]! - 0.06];
      // the ribs as the shadow lines between the corrugations
      for (let y = RIBS[0] + 0.07, k = 1; y < RIBS[1] - 0.05; y += RIB_PITCH, k++)
        out.push({ kind: "panel", name: `panel ${i + 1} rib ${k}`, x: [x0, x1], y: [y, y + 0.028], mat: "ribShade", sides: [sd] });
    }
    for (const [i, x] of joints.entries()) out.push({ kind: "panel", name: `panel joint ${i + 1}`, x: [x - 0.02, x + 0.02], y: [RIBS[0], RIBS[1] + 0.04], mat: "groove", sides: [sd] });
  }
  out.push({ kind: "panel", name: "cab joint", x: [CAB_JOINT - 0.015, CAB_JOINT + 0.015], y: [Y0 + 0.05, CANT - 0.02], mat: "groove", mirror: true });
  return out;
}

/** The filter grilles on the cant (2.2 m each): one at the front end ahead of the louvred box, two at the rear. */
const CANT_GRILLES: ReadonlyArray<readonly [number, number]> = [[5.4, 7.6], [-7.6, -5.4], [-5.3, -3.1]];

function cantGrilles(): SideItem[] {
  return CANT_GRILLES.map(([x0, x1], i): SideItem => ({ kind: "grille", name: `cant grille ${i + 1}`, x: [x0, x1], y: [CANT + 0.06, CANT_TOP - 0.03], mat: "cantSlat", slats: "h", pitch: 0.06, r: 0.02 }));
}

function lampItems(l: Es333Livery): EndItem[] {
  const y: readonly [number, number] = [1.67, 1.83];
  const out: EndItem[] = [];
  for (const s of [-1, 1]) {
    const nm = s > 0 ? "left" : "right";
    const zs = (a: number, b: number): readonly [number, number] => (s > 0 ? [a, b] : [-b, -a]);
    if (l.kind !== "mercancias") out.push({ kind: "paint", name: `lamp housing ${nm}`, z: zs(0.82, 1.3), y: [1.64, 1.86], mat: "lampBox", layer: 1, poly: roundRect(...zs(0.82, 1.3), 1.64, 1.86, 0.03) });
    out.push(
      { kind: "lamp", name: `headlight ${nm}`, z: zs(1.08, 1.24), y, r: 0.075 },
      { kind: "lamp", name: `tail lamp ${nm}`, z: zs(0.88, 1.04), y, r: 0.07, mat: "lampRed" },
    );
  }
  return out;
}

function spec(l: Es333Livery): LocoSpec {
  const roofItems: RoofBox[] = [
    // the louvred box behind the front end's filter panel, its slats on the sloping sides
    { name: "louvred box", x: [3.1, 5.3], w: [1.12, 0.92], y: [CROWN - 0.06, CROWN + 0.16], mat: "roofGrey" },
  ];
  return {
    palette: {
      rim: c("#9a9fa1", 0.45), slat: c("#4f5458", 0.6), louvre: c("#1f2124", 0.85), groove: c("#3a3c3f", 0.7), wiper: c("#2a2c2e", 0.5),
      beam: c("#232427", 0.75), bogie: c("#26272a", 0.8), steel: c("#4a4d51", 0.5), spring: c("#3a3c3f", 0.7), wheel: c("#3a3c3f", 0.6),
      tank: c("#2e3033", 0.7), lampBox: c("#1d1e20", 0.6), mask: c("#151618", 0.6), lampAmber: c("#f2c56a", 0.3),
      socketRed: c("#b8241c", 0.5), socketBlue: c("#2350a8", 0.5), cantSlat: c("#9a9fa2", 0.55), fan: c("#2a2c2f", 0.8), markerLens: c("#6d7276", 0.25), exhaust: c("#2b2b2b", 0.9),
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
    frame: { y0: 1.0, y1: Y0 + 0.01, half: 10.6, hw: 1.5, mat: "underframe" },
    bogies: [-BOGIE_X, BOGIE_X].map((xc) => ({ xc, axles: [-HALF_BASE, 0, HALF_BASE], wheelR: WHEEL_R, frameTop: FRAME_TOP })),
    exhausts: [[-0.6, 0, CROWN]],
    sideItems: [
      ...l.cabFields.map((poly, i): SideItem => {
        const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
        return { kind: "paint", name: `cab field ${i + 1}`, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat: l.cabMat, mirror: true, layer: 1, poly: poly as Ring };
      }),
      ...l.hoodFields.map((poly, i): SideItem => {
        const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
        return { kind: "paint", name: `hood field ${i + 1}`, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat: l.hoodMat, mirror: true, layer: 1, poly: poly as Ring };
      }),
      ...(l.stripes ?? []).map(({ poly, mat }, i): SideItem => {
        const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
        return { kind: "paint", name: `cab stripe ${i + 1}`, x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)], mat, mirror: true, layer: 2, poly: poly as Ring };
      }),
      { kind: "door", name: "cab door", x: DOOR.x, y: DOOR.y, rails: true, mirror: true },
      { kind: "window", name: "cab window", x: CAB_WINDOW.x, y: CAB_WINDOW.y, bar: CAB_WINDOW.bar, mat: "mask", r: 0.04, mirror: true },
      ...hoodSide(),
      ...cantGrilles(),
    ],
    endItems: [
      { kind: "paint", name: "windscreen mask", z: [-1.11, 1.11], y: [SCREEN[0] - 0.05, SCREEN[1] + 0.05], mat: "mask", layer: 1, poly: roundRect(-1.11, 1.11, SCREEN[0] - 0.05, SCREEN[1] + 0.05, 0.05) },
      { kind: "window", name: "windscreen", z: [-1.06, 1.06], y: SCREEN, mat: "mask" },
      { kind: "paint", name: "inspection hatch", z: [-0.28, 0.28], y: [2.66, 2.84], mat: "groove", layer: 1, poly: roundRect(-0.28, 0.28, 2.66, 2.84, 0.02) },
      { kind: "paint", name: "inspection hatch face", z: [-0.26, 0.26], y: [2.68, 2.82], mat: l.end[l.end.length - 1]![2], layer: 2, poly: roundRect(-0.26, 0.26, 2.68, 2.82, 0.015) },
      { kind: "paint", name: "top headlight box", z: [-0.25, 0.25], y: [3.97, 4.24], mat: "lampBox", layer: 1, poly: roundRect(-0.25, 0.25, 3.97, 4.24, 0.04) },
      { kind: "lamp", name: "top headlight left", z: [0.03, 0.21], y: [4.02, 4.19], r: 0.075 },
      { kind: "lamp", name: "top headlight right", z: [-0.21, -0.03], y: [4.02, 4.19], r: 0.075 },
      { kind: "lamp", name: "marker lamp left", z: [0.52, 0.8], y: [3.97, 4.25], r: 0.12, mat: l.marker },
      { kind: "lamp", name: "marker lamp right", z: [-0.8, -0.52], y: [3.97, 4.25], r: 0.12, mat: l.marker },
      ...lampItems(l),
    ],
    roofItems,
    plough: "beam",
    number: l.number,
  };
}

// --- what the kit does not draw ----------------------------------------------------

/** Lays reader-space triangles (u to the reader's right, v up) on both ends, d off the face. */
function layEndTris(m: MeshBuilder, sp: ShellSpec, mat: string, tris: ReadonlyArray<readonly [number, number]>, d: number): void {
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    // seen from ahead the reader's right is -z at the front, +z at the rear
    m.scope(e > 0 ? "front" : "rear", () => m.facets(mat, tris.map(([u, v]) => at(-e * u, v, d)), [e, 0, 0]));
  }
}
function layEndRings(m: MeshBuilder, sp: ShellSpec, mat: string, polys: readonly Ring[], d: number): void {
  for (const e of [-1, 1]) {
    const at = onEnd(sp, e);
    const rings = polys.map((q) => { const r: Ring = q.map(([u, v]) => [-e * u, v] as [number, number]); return e < 0 ? r : [...r].reverse(); });
    m.scope(e > 0 ? "front" : "rear", () => surfaceDecal(m, mat, at, [e, 0, 0], rings, d));
  }
}

/** The running number on the face under the right-hand lamps: black on the yellow, white on the Trenhotel's blue plate. */
function faceNumbers(m: MeshBuilder, sp: ShellSpec, l: Es333Livery): void {
  m.scope("face numbers", () => {
    const h = 0.12, style = { weight: 0.15, width: 0.55 };
    const w = wordWidth(l.number, h, style);
    const u0 = 1.22 - w, v0 = 1.44;
    if (l.kind === "talgo") layEndRings(m, sp, "plateBlue", [roundRect(u0 - 0.05, u0 + w + 0.05, v0 - 0.045, v0 + h + 0.045, 0.02)], 0.006);
    layEndTris(m, sp, l.kind === "talgo" ? "white" : "ink", letters(l.number, u0, v0, h, false, style), l.kind === "talgo" ? 0.009 : 0.006);
  });
}

/** Renfe Mercancias' roundel on the face: a cyan disc, the blue arrow curving round it. */
function mercanciasRoundel(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("mercancias roundel", () => {
    const cu = -0.08, cv = 2.02, r = 0.27;
    layEndRings(m, sp, "logoCyan", [ngon(16, r, 0, cu, cv)], 0.005);
    // the arrow: an arc over the disc's top, then a stroke across its middle to the reader's right
    const arc: Ring[] = [];
    const n = 6;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI * (1.05 - (i / n) * 0.95), a1 = Math.PI * (1.05 - ((i + 1) / n) * 0.95);
      const p = (a: number, rr: number): [number, number] => [cu + rr * Math.cos(a), cv + rr * Math.sin(a)];
      arc.push([p(a0, r * 0.62), p(a1, r * 0.62), p(a1, r * 0.82), p(a0, r * 0.82)]);
    }
    const bar: Ring = [[cu - r * 0.75, cv - 0.035], [cu + r * 0.7, cv - 0.035], [cu + r * 0.7, cv + 0.035], [cu - r * 0.75, cv + 0.035]];
    const head: Ring = [[cu + r * 0.62, cv - 0.1], [cu + r * 0.98, cv], [cu + r * 0.62, cv + 0.1]];
    layEndRings(m, sp, "logoBlue", [...arc, bar, head], 0.008);
  });
}

/** The Trenhotel's "Tren Hotel" script on the face's bronze, and on the hood's band. */
function trenhotelScript(m: MeshBuilder, sp: ShellSpec): void {
  const style = { weight: 0.13, width: 0.55, slant: 0.28 };
  m.scope("tren hotel face", () => {
    const h = 0.17, w = wordWidth("TREN HOTEL", h, style);
    layEndTris(m, sp, "cream", letters("TREN HOTEL", -0.12 - w / 2, 1.97, h, false, style), 0.006);
  });
  m.scope("tren hotel side", () => {
    const h = 0.2, w = wordWidth("TREN HOTEL", h, style);
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // the reader's right is +x on the right side (+z), -x on the left; the script sits over the trough at the front half
      const tris = letters("TREN HOTEL", sd > 0 ? 2.5 - w / 2 : 2.5 + w / 2, 2.6, h, sd < 0, style);
      m.scope(sd > 0 ? "right" : "left", () => m.facets("cream", tris.map(([u, v]) => at(u, v, 0.016)), [0, 0, sd]));
    }
  });
}

/**
 * Renfe Operadora's lettering (333 353's side, 333 333's face): the big ivory "renfe" in the middle of the
 * graphite hood (x-height 0.4 m, the baseline at 2.4 m), "Mercancias" small under its "nfe"; on the face the
 * purple "renfe" to the reader's left of the middle over the lamps, the grey "Mercancias" under it to the right.
 */
function operadoraMarkings(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("renfe wordmark", () => {
    const h = 0.4;
    for (const sd of [-1, 1]) {
      const at = onSide(sp, sd);
      // the reader's right is +x on the right side (+z), -x on the left
      const place = (polys: readonly Ring[]): Ring[] => polys.map((q) => { const r: Ring = q.map(([u, v]) => [sd * u, v] as [number, number]); return sd > 0 ? r : [...r].reverse(); });
      const right = lowerWidth("renfe", h) / 2;
      m.scope(sd > 0 ? "right" : "left", () => {
        surfaceDecal(m, "body", at, [0, 0, sd], place(lowerQuads("renfe", 0, 2.4, h, 0.2)), 0.016);
        surfaceDecal(m, "body", at, [0, 0, sd], place(lowerQuads("Mercancias", right + 0.3 - lowerWidth("Mercancias", 0.11), 1.85, 0.11, 0.16, false)), 0.016);
      });
    }
  });
  m.scope("face lettering", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const place = (polys: readonly Ring[]): Ring[] => polys.map((q) => { const r: Ring = q.map(([u, v]) => [-e * u, v] as [number, number]); return e < 0 ? r : [...r].reverse(); });
      m.scope(e > 0 ? "front" : "rear", () => {
        surfaceDecal(m, "purple", at, [e, 0, 0], place(lowerQuads("renfe", -0.3, 1.98, 0.19, 0.2)), 0.005);
        surfaceDecal(m, "fadedInk", at, [e, 0, 0], place(lowerQuads("Mercancias", -0.1, 1.64, 0.075, 0.16, false)), 0.005);
      });
    }
  });
}

/** The face's two handrails over the lamps, bent down at their outer ends, and the hose sockets between them. */
function faceFittings(m: MeshBuilder, sp: ShellSpec, l: Es333Livery): void {
  m.scope("face handrails", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const p = (z: number, y: number, d: number): Vec3 => at(s * z, y, d);
          const [a, b, cc] = [p(0.42, 2.44, 0.07), p(1.18, 2.44, 0.07), p(1.18, 1.97, 0.07)];
          tubeX(m, l.rail, 0.018, ...a, ...b, 6);
          tubeX(m, l.rail, 0.018, ...b, ...cc, 6);
          for (const [z, y] of [[0.42, 2.44], [1.18, 2.44], [1.18, 1.97]] as const) {
            const q0 = p(z, y, 0), q1 = p(z, y, 0.07);
            tubeX(m, l.rail, 0.014, ...q0, ...q1, 6);
          }
        });
    }
  });
  m.scope("hose sockets", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      m.scope(e > 0 ? "front" : "rear", () => {
        [-0.4, -0.12, 0.2].forEach((u, i) => {
          const mat = l.sockets[i]!;
          const q = roundRect(-e * u - 0.065, -e * u + 0.065, 2.24, 2.37, 0.02);
          surfacePanel(m, mat, at, [e, 0, 0], e > 0 ? [...q].reverse() : q, -0.005, 0.07);
        });
        // the brake hose hanging from the middle socket in a loop down to the lamps' height
        const pts = [at(-e * -0.12, 2.24, 0.04), at(-e * -0.2, 1.98, 0.09), at(-e * -0.02, 1.86, 0.1), at(-e * 0.16, 1.98, 0.09), at(-e * 0.2, 2.24, 0.04)];
        for (let i = 1; i < pts.length; i++) tubeX(m, "rubber", 0.022, ...pts[i - 1]!, ...pts[i]!, 6);
      });
    }
  });
}

/** The heavy black buffer beam under the face, the square buffer housings and the plough's skirt. */
function bufferBeams(m: MeshBuilder): void {
  m.scope("buffer beams", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const span = (a: number, b: number): [number, number] => (e > 0 ? [a, b] : [-b, -a]);
        block(m, "beam", ...span(N - 0.4, BEAM), 0.62, Y0 + 0.005, -1.47, 1.47);
        for (const z of [-1, 1]) block(m, "beam", ...span(BEAM, BEAM + 0.14), 0.84, 1.29, z > 0 ? 0.55 : -1.22, z > 0 ? 1.22 : -0.55);
      });
  });
}

/** The fuel tank between the bogies and the air reservoirs beside it. */
function underframe(m: MeshBuilder): void {
  m.scope("fuel tank", () => {
    block(m, "tank", -1.7, 1.5, 0.48, 1.0, -1.3, 1.3);
    for (const z of [-1, 1]) m.scope(z > 0 ? "right reservoir" : "left reservoir", () => m.sweep("tank", "x", ngon(10, 0.17, 0, z * 1.08, 0.78), 2.0, ngon(10, 0.17, 0, z * 1.08, 0.78), 3.6));
  });
}

/** The louvred box's slats on its sloping sides. */
function louvreSlats(m: MeshBuilder): void {
  m.scope("louvred box slats", () => {
    for (const s of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const y = CROWN - 0.02 + i * 0.055, z = s * (1.12 - (i + 0.5) * 0.05);
        block(m, "slat", 3.17, 5.23, y, y + 0.022, z - 0.015, z + 0.015);
      }
  });
}

/** The radiator fans' grilles on the roof at the rear end. */
function roofFans(m: MeshBuilder): void {
  m.scope("radiator fans", () => {
    for (const x of [-4.55, -3.55]) {
      const ring = ngon(14, 0.4, 0, x, 0);
      m.prism("fan", ring.map(([a, b]) => [a, b] as [number, number]), CROWN - 0.01, CROWN + 0.03);
    }
  });
}

/** The cab roof in the cab's colour (Renfe Mercancias' yellow cab). */
function cabRoofs(m: MeshBuilder, mat: string): void {
  m.scope("cab roofs", () => {
    for (const e of [-1, 1]) {
      const x0 = lerpTable(TIP, CROWN) - 0.02, x1 = CAB_JOINT;
      const hw = lerpTable(HW, CROWN) - 0.01;
      const ring: Ring = [[e * x1, -hw], [e * x1, hw], [e * x0, hw], [e * x0, -hw]];
      m.scope(e > 0 ? "front" : "rear", () => m.cap(mat, e > 0 ? ring : [...ring].reverse(), CROWN + 0.004, true));
    }
  });
}

/** The wiper parked upright at the middle of the windscreen. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const arm: Ring = [[-0.012, SCREEN[0] + 0.08], [0.012, SCREEN[0] + 0.08], [0.32, SCREEN[1] - 0.12], [0.296, SCREEN[1] - 0.12]];
      const q: Ring = arm.map(([u, v]) => [-e * u, v] as [number, number]);
      m.scope(e > 0 ? "front" : "rear", () => surfacePanel(m, "wiper", at, [e, 0, 0], e > 0 ? [...q].reverse() : q, 0.024, 0.04));
    }
  });
}

/** The rear-view mirrors folded against the cab side ahead of the window. */
function mirrors(m: MeshBuilder): void {
  m.scope("mirrors", () => {
    for (const e of [-1, 1]) for (const sd of [-1, 1]) {
      const [x0, x1] = e > 0 ? [9.74, 9.84] : [-9.84, -9.74];
      block(m, "mask", x0, x1, 2.95, 3.35, sd > 0 ? W + 0.01 : -W - 0.06, sd > 0 ? W + 0.06 : -W - 0.01);
    }
  });
}

/** The Renfe 333 in a livery. */
export function renfe333(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    if (l.kind === "mercancias") mercanciasRoundel(m, sp);
    else if (l.kind === "talgo") trenhotelScript(m, sp);
    else operadoraMarkings(m, sp);
    faceNumbers(m, sp, l);
    faceFittings(m, sp, l);
    wipers(m, sp);
    mirrors(m);
    bufferBeams(m);
    underframe(m);
  });
  m.scope("roof equipment", () => {
    louvreSlats(m);
    roofFans(m);
    if (l.cabRoof) cabRoofs(m, l.cabRoof);
  });
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function renfe333Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  // the cab sides' colour and the Trenhotel's wave as flat quads on the walls, (x, y) outlines for the +x half
  const cabTop = l.kind === "talgo" ? BRONZE_TOP : CANT;
  const halves: Pt[][] = [[[CAB_JOINT, Y0], [N - 0.1, Y0], [N - 0.1, cabTop], [CAB_JOINT, cabTop]]];
  if (l.kind === "talgo") halves.push([[CAB_JOINT - 0.02, Y0], [CAB_JOINT - 0.02, RIBS[1]], [6.3, RIBS[1]], [6.3, 2.5]]);
  const quads: Array<[Pt[], string]> = [...halves, ...halves.map((q) => q.map(([x, y]) => [-x, y] as const))].map((q) => [q, l.cabMat]);
  if (l.kind === "talgo") quads.push([[[6.3, 2.5], [6.3, RIBS[1]], [-6.3, RIBS[1]], [-6.3, 2.5]], l.cabMat]);
  if (l.kind === "operadora") quads.push([[[-CAB_JOINT, Y0], [CAB_JOINT, Y0], [CAB_JOINT, RIBS[1]], [-CAB_JOINT, RIBS[1]]], l.hoodMat]);
  const m = boxLocoLod(spec(l), 100 - quads.length * 4);
  m.scope("livery fields", () => {
    for (const sd of [-1, 1])
      for (const [q, mat] of quads) {
        const p = q.map(([x, y]): Vec3 => [x, y, sd * (W + 0.012)]);
        const tris = [p[0]!, p[1]!, p[2]!, p[0]!, p[2]!, p[3]!];
        m.facets(mat, tris, [0, 0, sd]);
      }
  });
  return m;
}

