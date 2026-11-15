// The NS class 1300 (proc-vehicle-ns-1300), Alsthom's Co'Co' of 1952 - 1956, a
// sister of the SNCF CC 7100, on the box locomotive kit (boxLocoKit.ts) with its
// own profile, measured on the photographs in assets/ns-1300 (SOURCES.md;
// docs/models/netherlands-trains.md):
//
// - 18.95 m over the buffers (Wikipedia), the body 17.62 m over its end faces
//   (the side-on photograph of 1307 at 53 px/m), 2.96 m wide; the side walls
//   upright from the skirt (1.0 m) to 3.62 m, then the cant rounding into the
//   roof (3.96 m), the louvre band in the cant over the machine room;
// - the cab ends (head-on photograph of 1302): a flat face with corners rounded
//   0.38 m across, upright from the skirt to the ledge at 2.86 m, the window
//   band set back 5 cm above it, the roof rounding back 0.95 m from 3.66 m;
//   the two-pane windscreen (2.94 - 3.60 m, 2.24 m wide), the marker lamps
//   on the roof corners, the handrails under the windscreen;
// - per side the rounded cab window and the plain cab door with its
//   handrails behind each corner, four portholes (3.12 m, 2.4 m apart in two
//   pairs) - the layout the same on both sides, the NS logo and the number
//   turned about (point symmetric: the logo toward the left end as seen);
// - the Co'Co' bogies 9.4 m apart, axles 2.43 m apart, 1,250 mm wheels
//   (the CC 7100's); the buffers and screw coupling on the body's beam, the
//   buffers' heads rectangular;
// - two liveries matched to photographs: the turquoise of the deliveries
//   (1302 at Stroe, 1952: the lining - two light strips with a dark band
//   between - running round the cab corners and curving over the big
//   headlamps, the winged NS emblem over the number plate, the diamond
//   pantographs) and NS yellow from the 1980s life extension (1301, 1307,
//   1312 and 1315: yellow with the grey skirt and the grey window band
//   wrapping round the cab, the lamp bar of head and tail lamps, the big NS
//   logo, black numbers, single-arm pantographs).

import type { MaterialSpec, MeshBuilder, Ring } from "./meshBuilder.ts";
import { ngon } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import { boxLocoLod, buildBoxLoco, shellOf, type EndItem, type LocoSpec, type SideItem } from "./boxLocoKit.ts";
import { c, insulator, onEnd, onSide, surfacePanel, type ShellSpec } from "./czElectricKit.ts";
import { tubeX, type Band } from "./cd163.ts";
import { block } from "./vehicleParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Pt = [number, number];

/** Half the length over the buffers (18.95 m). */
const HALF = 9.475;
/** The end face's |x| at the lower front (the body 17.62 m long). */
const N = 8.81;
/** The body's bottom: the skirt's lower edge. */
const Y0 = 1.0;
/** The moulding round the body at the top of the skirt. */
const STRIP: readonly [number, number] = [1.57, 1.61];
/** The ledge at the top of the lower front; the window band's top; the yellow cap's top at the front (the roof above). */
const LEDGE = 2.86;
const BAND_TOP = 3.66;
const CAP = 3.8;
const CROWN = 3.96;
/** The body's half width (2.96 m). */
const W = 1.48;
/** The windscreens' and the cab side window's sill and head. */
const SCREEN: readonly [number, number] = [2.94, 3.6];
const CAB_WIN: readonly [number, number] = [2.94, 3.54];

/** The end's centre line [y, |x|], bottom first: the skirt rounding under, the ledge, the window band, the roof. */
const TIP: Table = [
  [Y0, N - 0.16], [1.12, N - 0.04], [1.25, N], [LEDGE - 0.01, N], [LEDGE + 0.01, N - 0.05], [BAND_TOP, N - 0.05],
  [3.74, N - 0.1], [CAP, N - 0.17], [3.86, N - 0.3], [3.91, N - 0.5], [3.94, N - 0.7], [CROWN, N - 0.95],
];
/** The half width [y, hw]: the skirt drawn in at its foot, upright walls, the cant and the roof. */
const HW: Table = [
  [Y0, W - 0.05], [1.12, W - 0.01], [1.25, W], [3.62, W], [3.7, W - 0.02], [3.76, W - 0.06], [3.82, W - 0.14],
  [3.87, W - 0.26], [3.91, W - 0.43], [3.94, W - 0.63], [CROWN, W - 0.88],
];
/** The front corner's radius across and its depth back into the side. */
const CORNER_Z = 0.38;
const CORNER_X = 0.36;
/** How far the face's middle bows ahead of the corners' start. */
const BOW = 0.025;
const ANGLES = [20, 40, 60, 75, 90].map((a) => (a * Math.PI) / 180);

function endPlan(_y: number, w: number): ReadonlyArray<readonly [number, number]> {
  const rz = Math.min(CORNER_Z, w * 0.9);
  const flat = w - rz;
  return [[0, 0], [flat * 0.5, BOW * 0.25], [flat, BOW], ...ANGLES.map((a) => [flat + rz * Math.sin(a), BOW + (CORNER_X - BOW) * (1 - Math.cos(a))] as const)];
}

/** Where the flat side wall ends in the window band (the corner's start). */
const WALL_END = N - 0.05 - CORNER_X;

/** The bogies: pivots 9.4 m apart, axles 2.43 m apart, 1,250 mm wheels. */
const PIVOT = 4.7;
const AXLES = [-2.43, 0, 2.43] as const;
/** The pantographs' centres, the roof hatch's top they stand on. */
const PANTO_X = 5.2;
const HATCH_TOP = 4.06;

/** The cab's side items, front half (drawn at both ends): the window, the door. */
const CAB_WINDOW: readonly [number, number] = [7.4, 8.1];
const CAB_DOOR: readonly [number, number] = [6.36, 6.96];
/** The portholes: centres along x (the same on both sides), height, radius. */
const PORTHOLES = [-3.85, -1.45, 1.45, 3.85];
const PORT_Y = 3.12;
const PORT_R = 0.19;
/** The louvre band in the cant between the cabs. */
const LOUVRES: readonly [number, number] = [-7.1, 7.1];

// --- liveries ----------------------------------------------------------------------

interface Livery {
  title: string;
  /** The body colour (the cab corners, the cover between the lamps). */
  body: string;
  palette: Record<string, MaterialSpec>;
  side: readonly Band[];
  end: readonly Band[];
  number: string;
  pantograph: "diamond" | "singleArm";
  sideItems: readonly SideItem[];
  endItems: readonly EndItem[];
  /** The 1980s NS logo and black numbers on the sides. */
  logo: boolean;
}

/** A rectangle with its rear (low-x) corners rounded, convex. */
function roundedRear(x0: number, x1: number, y0: number, y1: number, r: number): Ring {
  const out: Ring = [[x1, y0], [x1, y1]];
  for (let i = 0; i <= 3; i++) {
    const a = (Math.PI / 2) * (i / 3);
    out.push([x0 + r - r * Math.sin(a), y1 - r + r * Math.cos(a)]);
  }
  for (let i = 0; i <= 3; i++) {
    const a = (Math.PI / 2) * (i / 3);
    out.push([x0 + r - r * Math.cos(a), y0 + r - r * Math.sin(a)]);
  }
  return out;
}

/** A ring sector about (cu, cv) between radii r0 and r1, angles a0 to a1 (degrees; 0 toward +u), as convex pieces. */
function arc(cu: number, cv: number, r0: number, r1: number, a0: number, a1: number, n: number): Ring[] {
  const out: Ring[] = [];
  for (let i = 0; i < n; i++) {
    const [p, q] = [a0 + ((a1 - a0) * i) / n, a0 + ((a1 - a0) * (i + 1)) / n].map((a) => (a * Math.PI) / 180) as [number, number];
    const at = (r: number, a: number): Pt => [cu + r * Math.cos(a), cv + r * Math.sin(a)];
    const ring: Ring = [at(r0, p), at(r1, p), at(r1, q), at(r0, q)];
    // counter-clockwise in (u, v)
    let s = 0;
    for (let k = 0; k < 4; k++) s += ring[k]![0] * ring[(k + 1) % 4]![1] - ring[(k + 1) % 4]![0] * ring[k]![1];
    out.push(s > 0 ? ring : ring.reverse());
  }
  return out;
}

/** The turquoise lining: two light strips and the dark band between them, round the whole body. */
const LINING = { lower: [2.06, 2.12] as const, band: [2.12, 2.24] as const, upper: [2.24, 2.29] as const };
/** The turquoise headlamps: centre |z|, height, lens radius. */
const BIG_LAMP = { z: 1.0, y: 1.98, r: 0.16 };

const turquoiseBands: readonly Band[] = [
  [Y0, STRIP[0], "body"], [STRIP[0], STRIP[1], "strip"], [STRIP[1], LINING.lower[0], "body"],
  [LINING.lower[0], LINING.lower[1], "lining"], [LINING.band[0], LINING.band[1], "liningBand"], [LINING.upper[0], LINING.upper[1], "lining"],
  [LINING.upper[1], CAP, "body"], [CAP, CROWN, "roof"],
];

/** The lining's strips curving over each headlamp toward the face's middle, and the cover between the lamps. */
function liningEnd(): EndItem[] {
  // the end items' z is measured as seen from ahead: +z on the viewer's right... both lamps alike
  const items: EndItem[] = [{ kind: "paint", name: "lining cover", z: [-(BIG_LAMP.z - 0.2), BIG_LAMP.z - 0.2], y: [LINING.lower[0] - 0.02, LINING.upper[1] + 0.03], mat: "body", layer: 1 }];
  for (const s of [-1, 1]) {
    const cu = s * BIG_LAMP.z;
    // over the lamp's top and down its inner side (toward z = 0)
    const [a0, a1] = s > 0 ? [90, 220] : [-40, 90];
    const rings: Array<[string, number, number]> = [["lining", 0.195, 0.235], ["liningBand", 0.235, 0.27], ["lining", 0.27, 0.315]];
    for (const [ri, [mat, r0, r1]] of rings.entries())
      for (const [k, poly] of arc(cu, BIG_LAMP.y, r0, r1, a0, a1, 8).entries()) {
        const us = poly.map((p) => p[0]), vs = poly.map((p) => p[1]);
        items.push({ kind: "paint", name: `lining arc ${s > 0 ? "left" : "right"} ${ri + 1}.${k + 1}`, z: [Math.min(...us), Math.max(...us)], y: [Math.min(...vs), Math.max(...vs)], poly, mat, layer: 2 });
      }
  }
  return items;
}

/** The winged NS emblem over the number plate on the turquoise fronts. */
function emblemEnd(): EndItem[] {
  const disc = (name: string, r: number, mat: string, layer: number): EndItem => ({ kind: "paint", name, z: [-r, r], y: [2.36 - r, 2.36 + r], poly: ngon(14, r, 0, 0, 2.36), mat, layer });
  const wing = (s: number): EndItem => {
    const poly: Ring = s > 0 ? [[0.12, 2.2], [0.26, 2.24], [0.31, 2.5], [0.12, 2.47]] : [[-0.12, 2.2], [-0.12, 2.47], [-0.31, 2.5], [-0.26, 2.24]];
    return { kind: "paint", name: `emblem wing ${s > 0 ? "a" : "b"}`, z: s > 0 ? [0.12, 0.31] : [-0.31, -0.12], y: [2.2, 2.5], poly, mat: "emblem", layer: 2 };
  };
  return [
    wing(1), wing(-1),
    disc("emblem ring", 0.17, "lining", 3),
    disc("emblem roundel", 0.14, "emblem", 4),
    { kind: "plate", name: "number", z: [-0.25, 0.25], y: [1.93, 2.13] },
  ];
}

const LIVERIES: Record<string, Livery> = {
  // as delivered, 1302 at Stroe on 4 July 1952
  blue: {
    title: "NS blue",
    body: "body",
    palette: {
      body: c("#3e8e99"), liningBand: c("#1f4c5c"), lining: { color: "#e3cc6a", metallic: 0.3, roughness: 0.4 },
      strip: { color: "#b9bdc0", metallic: 0.5, roughness: 0.35 }, roof: c("#74797b", 0.75), roofHatch: c("#606567", 0.75),
      emblem: c("#1d2a30", 0.6), plate: c("#1d2a30", 0.6), white: c("#e3cc6a"), numeral: c("#e3cc6a"),
    },
    side: turquoiseBands,
    end: turquoiseBands,
    number: "1302",
    pantograph: "diamond",
    sideItems: [],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.045, 1.12], y: SCREEN, mat: "rim" },
      { kind: "window", name: "windscreen right", z: [-1.12, -0.045], y: SCREEN, mat: "rim" },
      { kind: "paint", name: "windscreen pillar", z: [-0.05, 0.05], y: [SCREEN[0] + 0.01, SCREEN[1] - 0.01], mat: "rim", layer: 1 },
      ...liningEnd(),
      ...emblemEnd(),
      { kind: "lamp", name: "headlamp left", z: [BIG_LAMP.z - BIG_LAMP.r, BIG_LAMP.z + BIG_LAMP.r], y: [BIG_LAMP.y - BIG_LAMP.r, BIG_LAMP.y + BIG_LAMP.r], r: BIG_LAMP.r },
      { kind: "lamp", name: "headlamp right", z: [-BIG_LAMP.z - BIG_LAMP.r, -BIG_LAMP.z + BIG_LAMP.r], y: [BIG_LAMP.y - BIG_LAMP.r, BIG_LAMP.y + BIG_LAMP.r], r: BIG_LAMP.r },
    ],
    logo: false,
  },
  // NS yellow after the 1980s life extension: 1301, 1307, 1312 (Spoorwegmuseum), 1315
  yellowGrey: {
    title: "NS yellow, grey",
    body: "yellow",
    palette: {
      yellow: c("#ffc917"), grey: c("#4f565c", 0.6), strip: { color: "#b9bdc0", metallic: 0.5, roughness: 0.35 },
      roof: c("#4a4e51", 0.75), roofHatch: c("#3f4346", 0.75), lampBar: c("#33373b", 0.6), numeral: c("#1e1f21", 0.6), logo: c("#24272a", 0.6),
    },
    side: [[Y0, STRIP[0], "grey"], [STRIP[0], STRIP[1], "strip"], [STRIP[1], CAP, "yellow"], [CAP, CROWN, "roof"]],
    end: [[Y0, STRIP[0], "grey"], [STRIP[0], STRIP[1], "strip"], [STRIP[1], LEDGE, "yellow"], [LEDGE, BAND_TOP, "grey"], [BAND_TOP, CAP, "yellow"], [CAP, CROWN, "roof"]],
    number: "1312",
    pantograph: "singleArm",
    sideItems: [
      // the grey window band wrapping round the cab corner onto the side, its rear corners rounded
      { kind: "paint", name: "cab window band", x: [7.22, WALL_END], y: [LEDGE, BAND_TOP], poly: roundedRear(7.22, WALL_END, LEDGE, BAND_TOP, 0.1), mat: "grey", mirror: true },
    ],
    endItems: [
      { kind: "window", name: "windscreen left", z: [0.045, 1.12], y: SCREEN, mat: "rubber" },
      { kind: "window", name: "windscreen right", z: [-1.12, -0.045], y: SCREEN, mat: "rubber" },
      { kind: "lamp", name: "top headlight", z: [-0.11, 0.11], y: [2.61, 2.83], r: 0.105 },
      // the lamp bar of the life extension: tail and head lamps each side of the grille
      { kind: "paint", name: "lamp bar", z: [-1.2, 1.2], y: [1.72, 2.09], mat: "lampBar", layer: 1 },
      { kind: "grille", name: "lamp bar grille", z: [-0.37, 0.37], y: [1.77, 2.04], mat: "slat" },
      { kind: "lamp", name: "head lamp left", z: [0.62, 0.8], y: [1.8, 2.01], r: 0.1 },
      { kind: "lamp", name: "head lamp right", z: [-0.8, -0.62], y: [1.8, 2.01], r: 0.1 },
      { kind: "lamp", name: "tail lamp left", z: [0.89, 1.07], y: [1.8, 2.01], r: 0.1, mat: "lampRed" },
      { kind: "lamp", name: "tail lamp right", z: [-1.07, -0.89], y: [1.8, 2.01], r: 0.1, mat: "lampRed" },
    ],
    logo: true,
  },
};

export const NS1300_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Livery => LIVERIES[resolveParams(NS1300_PARAMS, v).livery!]!;

// --- the body ----------------------------------------------------------------------

function spec(l: Livery): LocoSpec {
  return {
    palette: {
      rim: { color: "#c3c7c9", metallic: 0.55, roughness: 0.3 }, rubber: c("#1d1e20", 0.8), beam: c("#25272a", 0.75),
      bogie: c("#2a2c2e", 0.8), steel: c("#4a4d51", 0.5), spring: c("#323436", 0.7), wheel: c("#36383b", 0.6), underframe: c("#2a2c2f", 0.75),
      wiper: c("#2b2d30", 0.6), insulator: c("#c9cbc8", 0.4), louvreSlat: c("#3c4044", 0.7),
      ...l.palette,
    },
    y0: Y0,
    tip: TIP,
    hw: HW,
    endPlan,
    corner: "end",
    side: l.side,
    end: l.end,
    roof: "roof",
    buffers: HALF,
    beam: N + 0.1,
    bufferY: 1.06,
    bufferHead: "rect",
    frame: { y0: 0.86, y1: Y0, half: 8.55, hw: 1.3, mat: "underframe" },
    bogies: [-PIVOT, PIVOT].map((xc) => ({ xc, axles: AXLES, wheelR: 0.625, frameTop: 0.9 })),
    pantograph: { kind: l.pantograph, x: PANTO_X, roofY: HATCH_TOP, baseY: HATCH_TOP + 0.14 },
    sideItems: [
      ...l.sideItems,
      { kind: "window", name: "cab window", x: CAB_WINDOW, y: CAB_WIN, mat: "rubber", r: 0.09, mirror: true },
      { kind: "door", name: "cab door", x: CAB_DOOR, y: [1.3, 3.5], rails: true, mirror: true },
      ...PORTHOLES.map((x, i): SideItem => ({ kind: "window", name: `porthole ${i + 1}`, x: [x - PORT_R, x + PORT_R], y: [PORT_Y - PORT_R, PORT_Y + PORT_R], mat: "rim", r: PORT_R })),
      { kind: "grille", name: "louvre band", x: LOUVRES, y: [3.62, 3.8], mat: "louvreSlat", slats: "v", pitch: 0.36 },
    ],
    endItems: l.endItems,
    roofItems: [{ name: "roof hatch", x: [-6.3, 6.3], w: [0.98, 0.92], y: [CROWN - 0.01, HATCH_TOP], mat: "roofHatch" }],
    underItems: [[-1.3, 1.3, 0.5, 0.86, 1.0]],
    number: l.number,
  };
}

// --- what the kit does not draw --------------------------------------------------------

/** The NS logo's strokes about its centre, w wide and h tall, as polylines (point symmetric). */
function nsLogoLines(w: number, h: number): Pt[][] {
  const A = w / 2, B = h / 2, C = A - B * 0.89, m1 = -0.06 * A, m2 = m1 + B * 0.97;
  const p1: Pt[] = [[-C, -B], [-A, 0], [-C, B], [m1, B], [m2, 0], [A, 0]];
  const p2: Pt[] = p1.map(([u, v]): Pt => [-u, -v]);
  return [p1, p2];
}

/** A thick polyline as triangles ([u, v]), each segment a quad carried past its ends by half the width. */
function strokeTris(pts: readonly Pt[], t: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 1; i < pts.length; i++) {
    const [a, b] = [pts[i - 1]!, pts[i]!];
    const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
    const l = Math.hypot(dx, dy);
    const [nx, ny] = [(-dy / l) * t / 2, (dx / l) * t / 2];
    const [ex, ey] = [(dx / l) * t / 2, (dy / l) * t / 2];
    const q: Pt[] = [[a[0] - nx - ex, a[1] - ny - ey], [b[0] - nx + ex, b[1] - ny + ey], [b[0] + nx + ex, b[1] + ny + ey], [a[0] + nx - ex, a[1] + ny - ey]];
    out.push(q[0]!, q[1]!, q[2]!, q[0]!, q[2]!, q[3]!);
  }
  return out;
}

/** The logo on each side (toward the left end as seen) and the black number toward the right end. */
function logoAndNumbers(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const logo = nsLogoLines(3.3, 1.3).flatMap((p) => strokeTris(p, 0.2));
  const nh = 0.43;
  const nw = wordWidth(l.number, nh, { weight: 0.16 });
  m.scope("logo and numbers", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const at = onSide(sp, sd);
        const n: Vec3 = [0, 0, sd];
        // the viewer's right is +x on the right side, -x on the left
        const cx = -4.0 * sd;
        m.scope("logo", () => m.facets("logo", logo.map(([u, v]) => at(cx + sd * u, 2.58 + v, 0.004)), n));
        const nx = 4.85 * sd;
        const tris = letters(l.number, sd > 0 ? nx - nw / 2 : nx + nw / 2, 2.0, nh, sd < 0, { weight: 0.16 });
        m.scope("number", () => m.facets("numeral", tris.map(([u, v]) => at(u, v, 0.004)), n));
      });
  });
}

/** The black number on the yellow fronts. */
function frontNumbers(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const h = 0.22;
  const w = wordWidth(l.number, h, { weight: 0.16 });
  m.scope("front numbers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      // seen from ahead +z is on the reader's left: read toward -z at the front
      const tris = letters(l.number, e > 0 ? w / 2 : -w / 2, 2.21, h, e > 0, { weight: 0.16 });
      m.scope(e > 0 ? "front" : "rear", () => m.facets("numeral", tris.map(([u, v]) => at(u, v, 0.004)), [e, 0, 0]));
    }
  });
}

/** "NS" in the turquoise emblem's roundel. */
function emblemLetters(m: MeshBuilder, sp: ShellSpec): void {
  const h = 0.13;
  const w = wordWidth("NS", h, { weight: 0.2 });
  m.scope("emblem letters", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const tris = letters("NS", e > 0 ? w / 2 : -w / 2, 2.36 - h / 2, h, e > 0, { weight: 0.2 });
      m.scope(e > 0 ? "front" : "rear", () => m.facets("lining", tris.map(([u, v]) => at(u, v, 0.012)), [e, 0, 0]));
    }
  });
}

/** The marker lamps on the roof corners: a housing in the body colour standing out of the face, a lens. */
function markerLamps(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const y = 3.74;
  m.scope("marker lamps", () => {
    for (const e of [-1, 1])
      for (const z of [-1.0, 1.0])
        m.scope(`${e > 0 ? "front" : "rear"} ${z > 0 ? "right" : "left"}`, () => {
          const x = onEnd(sp, e)(z, y, 0)[0];
          const [a, b] = e > 0 ? [x - 0.08, x + 0.1] : [x - 0.1, x + 0.08];
          m.sweep(l.body, "x", ngon(10, 0.085, 0, z, y), a, ngon(10, 0.085, 0, z, y), b);
          const [c0, c1] = e > 0 ? [x + 0.1, x + 0.115] : [x - 0.115, x - 0.1];
          m.scope("rim", () => m.sweep("rim", "x", ngon(10, 0.07, 0, z, y), c0, ngon(10, 0.07, 0, z, y), c1));
          const [l0, l1] = e > 0 ? [x + 0.112, x + 0.122] : [x - 0.122, x - 0.112];
          m.scope("lens", () => m.sweep("lampHead", "x", ngon(10, 0.052, 0, z, y), l0, ngon(10, 0.052, 0, z, y), l1));
        });
  });
}

/** The handrails under the windscreen: one across the turquoise front, two on the yellow. */
function frontRails(m: MeshBuilder, sp: ShellSpec, l: Livery): void {
  const y = 2.79;
  const spans: ReadonlyArray<readonly [number, number]> = l.logo ? [[-1.25, -0.32], [0.32, 1.25]] : [[-1.25, 1.25]];
  m.scope("front handrails", () => {
    for (const e of [-1, 1])
      m.scope(e > 0 ? "front" : "rear", () => {
        const face = sp.tip(y);
        const x = e * (face + 0.06);
        for (const [z0, z1] of spans) {
          m.sweep("rim", "z", ngon(6, 0.016, 0, x, y), z0, ngon(6, 0.016, 0, x, y), z1);
          for (const z of [z0 + 0.04, (z0 + z1) / 2, z1 - 0.04]) {
            const [a, b] = e > 0 ? [face - 0.02, face + 0.06] : [-face - 0.06, -face + 0.02];
            block(m, "rim", a, b, y - 0.012, y + 0.012, z - 0.012, z + 0.012);
          }
        }
      });
  });
}

/** The wipers parked hanging from the windscreens' heads. */
function wipers(m: MeshBuilder, sp: ShellSpec): void {
  m.scope("wipers", () => {
    for (const e of [-1, 1]) {
      const at = onEnd(sp, e);
      const n: Vec3 = [e, 0, 0];
      for (const s of [-1, 1])
        m.scope(`${e > 0 ? "front" : "rear"} ${s > 0 ? "left" : "right"}`, () => {
          const u = (z: number) => (e > 0 ? -z : z) * s;
          // from the pivot over the pane's inner half down toward its middle
          const [z0, z1] = [0.42, 0.62];
          const arm: Ring = [[u(z0 - 0.014), SCREEN[1] - 0.06], [u(z0 + 0.014), SCREEN[1] - 0.06], [u(z1 + 0.014), SCREEN[0] + 0.14], [u(z1 - 0.014), SCREEN[0] + 0.14]];
          const ring: Ring = (() => {
            let a = 0;
            for (let i = 0; i < 4; i++) a += arm[i]![0] * arm[(i + 1) % 4]![1] - arm[(i + 1) % 4]![0] * arm[i]![1];
            return a > 0 ? arm : [...arm].reverse();
          })();
          surfacePanel(m, "wiper", at, n, ring, 0.026, 0.04);
        });
    }
  });
}

/** The roof line: a busbar on post insulators along the hatch between the pantographs. */
function roofLine(m: MeshBuilder): void {
  const y = HATCH_TOP + 0.36;
  m.scope("roof line", () => {
    for (const x of [-3.9, -1.3, 1.3, 3.9]) insulator(m, x, 0.55, HATCH_TOP - 0.01, y - 0.02);
    tubeX(m, "copper", 0.02, -(PANTO_X - 0.6), y, 0.55, PANTO_X - 0.6, y, 0.55, 6);
    m.scope("main breaker", () => {
      block(m, "steel", -0.4, 0.4, HATCH_TOP - 0.01, HATCH_TOP + 0.14, -0.6, -0.1);
      insulator(m, 0, -0.35, HATCH_TOP + 0.13, y - 0.02);
    });
  });
}

/** The buffer beams standing ahead of the lower front. */
function bufferBeams(m: MeshBuilder): void {
  m.scope("buffer beams", () => {
    for (const e of [-1, 1]) {
      const [a, b] = e > 0 ? [N - 0.12, N + 0.1] : [-N - 0.1, -N + 0.12];
      m.scope(e > 0 ? "front" : "rear", () => block(m, "beam", a, b, 0.8, 1.3, -1.36, 1.36));
    }
  });
}

/** The NS 1300 in a livery. */
export function ns1300(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const s = spec(l);
  const m = buildBoxLoco(s);
  const sp = shellOf(s);
  m.scope("body", () => {
    if (l.logo) {
      logoAndNumbers(m, sp, l);
      frontNumbers(m, sp, l);
    } else emblemLetters(m, sp);
    markerLamps(m, sp, l);
    frontRails(m, sp, l);
    wipers(m, sp);
    bufferBeams(m);
  });
  m.scope("roof equipment", () => roofLine(m));
  return m;
}

/** The distant model: the kit's box locomotive from the same profile and paint. */
export function ns1300Lod(v?: ParamValues): MeshBuilder {
  return boxLocoLod(spec(liveryOf(v)));
}

