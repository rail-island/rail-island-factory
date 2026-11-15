// The NS class 2200 (proc-vehicle-ns-2200; Allan / Heemaf 2201 - 2300 and
// Schneider / Heemaf 2301 - 2350, 1955 - 1958): a Bo'Bo' diesel-electric of
// American (Baldwin - Westinghouse) design, 14.01 m over the buffers, 662 kW,
// 950 mm wheels. Drawn on the Czech electric kit's shells (czElectricKit.ts),
// not the box locomotive kit, because its cab stands at one end: measured on
// the photographs in assets/ns-2200 (SOURCES.md: 2208 as delivered in 1955 for
// the side, the museum units 2225 and 2299 for the red brown, 2205, 2207 and
// 2278 for the yellow and grey; docs/models/netherlands-trains.md):
//
// - the cab at one end (here -x), the full 2.9 m width and 3.98 m high, 2.55 m
//   long: the flat end with its two windows near the corners, the two marker
//   lamps over them and the two headlights low down, the roof rounding over
//   the end and the rear; per side the door next to the end with its narrow
//   window and grab rails, the steps sunk in the skirt below it, the big side
//   window behind; the skirt reaching down to 0.35 m under the cab, cut away
//   over the bogie; on the rear wall, beside the hood, a door onto each walkway;
// - the long hood, 1.8 m wide and 3.6 m high (narrower and lower than the cab),
//   from the cab to 0.7 m short of the other buffer beam: the plain front
//   compartment with its access doors, the louvred engine room (an upper and a
//   lower row of louvres), the three lamps at the top of its front, the two
//   headlights at its foot; the aluminium silencer casing along its top;
// - the walkways along the hood on the frame's top (1.5 m) and the platform at
//   its front, the handrails along their edges; the step box before each cab
//   door; the frame's sill, the skirt curving down to the buffer beam at the
//   hood end; the fuel tank between the bogies;
// - the bogies 7.2 m apart, 2.4 m wheelbase, 950 mm wheels; side buffers and
//   screw couplings;
// - `brown`: the red brown of the museum units (2225, 2299; the colour of 1955):
//   a cream line along the sides that dips into a vee on the cab end and two
//   on the hood's front, the NS winged emblem over a number plate on both ends,
//   the red buffer beam and apron, red brown handrails;
// - `yellowGrey`: NS's yellow and grey of the 1970s (2205, 2207, 2278): the
//   yellow cab, hood front and sill, the grey hood and dark grey frame ends, the
//   white NS logo at the front of the hood, black numbers, yellow handrails, the
//   red beacons on the cab roof and the hood front.

import { MeshBuilder, ngon, type MaterialSpec, type Ring } from "./meshBuilder.ts";
import type { Vec3 } from "./meshCore.ts";
import { resolveParams, type ParamSpec, type ParamValues } from "./design.ts";
import {
  KIT_PALETTE, bogie, buffers, c, kinks, lerpTable, onEnd, onSide, rect, roundRect, shell, surfaceDecal, surfacePanel,
  type Place, type ShellSpec,
} from "./czElectricKit.ts";
import type { Band } from "./cd163.ts";
import { exhaust } from "./dieselParts.ts";
import { enumParam } from "./emuParts.ts";
import { letters, wordWidth } from "./letters.ts";
import { block, plate } from "./vehicleParts.ts";
import { fitLod, lodBogie, lodPolygon, lodRoofBox, lodSideBox, windowBands, type LodPart, type LodShell } from "./lodKit.ts";

type Table = ReadonlyArray<readonly [number, number]>;
type Span = readonly [number, number];

// --- measures ----------------------------------------------------------------------------

/** Half the length over the buffers (14.01 m) and the end faces' |x| (the cab end, the hood end's buffer beam). */
const HALF = 7.005;
const END = 6.55;
/** The frame's sill: its bottom and the walkway on its top. */
const SILL = 1.25;
const WALK = 1.5;
/** The cab: its end face (-x), its rear wall, its half width, roof crown. */
const CAB_END = -END;
const CAB_REAR = -4.0;
const CAB_XC = (CAB_END + CAB_REAR) / 2;
const CAB_L = (CAB_REAR - CAB_END) / 2;
const W = 1.45;
const CAB_ROOF = 3.98;
/** The hood: from inside the cab to its front face, half width, its top. */
const HOOD_FRONT = 5.85;
const HOOD_BACK = CAB_REAR - 0.05;
const HOOD_XC = (HOOD_FRONT + HOOD_BACK) / 2;
const HOOD_L = (HOOD_FRONT - HOOD_BACK) / 2;
const HOOD_W = 0.9;
const HOOD_TOP = 3.6;
/** The skirts' bottom: under the cab and at the hood end's buffer beam. */
const CAB_SKIRT = 0.35;
const BEAM_FOOT = 0.45;
/** The bogies: pivots 7.2 m apart, 2.4 m wheelbase, 950 mm wheels. */
const PIVOT = 3.6;
const HALF_BASE = 1.2;
const WHEEL_R = 0.475;
const BUFFER_Y = 1.06;

/** The cab's half width: upright sides, the roof rounding to the crown. */
const CAB_HW: Table = [[SILL, W], [3.66, W], [3.76, W - 0.02], [3.85, W - 0.08], [3.92, W - 0.2], [3.96, W - 0.37], [CAB_ROOF, W - 0.6]];
/** The cab's ends: upright, rounding over into the roof (both the end and the rear wall). */
const CAB_TIP: Table = [[SILL, CAB_L], [3.6, CAB_L], [3.72, CAB_L - 0.02], [3.82, CAB_L - 0.07], [3.9, CAB_L - 0.15], [3.95, CAB_L - 0.25], [CAB_ROOF, CAB_L - 0.36]];
/** The hood's half width and its front, the top's edges rounded. */
const HOOD_HW: Table = [[WALK, HOOD_W], [3.32, HOOD_W], [3.42, HOOD_W - 0.015], [3.5, HOOD_W - 0.05], [3.56, HOOD_W - 0.12], [HOOD_TOP, HOOD_W - 0.23]];
const HOOD_TIP: Table = [[WALK, HOOD_L], [3.32, HOOD_L], [3.42, HOOD_L - 0.015], [3.5, HOOD_L - 0.05], [3.56, HOOD_L - 0.12], [HOOD_TOP, HOOD_L - 0.23]];

/** A plan with its corners rounded by r. */
const ANGLES = [30, 60, 90].map((a) => (a * Math.PI) / 180);
const roundedPlan = (r: number) => (w: number): ReadonlyArray<readonly [number, number]> => {
  const rr = Math.min(r, w * 0.5);
  return [[0, 0], [w - rr, 0], ...ANGLES.map((a) => [w - rr + rr * Math.sin(a), rr * (1 - Math.cos(a))] as const)];
};
const CAB_CORNER = 0.08;
const HOOD_CORNER = 0.1;

// --- liveries ------------------------------------------------------------------------------

interface Ns2200Livery {
  title: string;
  palette: Record<string, MaterialSpec>;
  /** The cab's and the hood's paint (sides, ends), the roofs. */
  cabSide: readonly Band[];
  cabEnd: readonly Band[];
  cabRoof: string;
  hoodSide: readonly Band[];
  hoodEnd: readonly Band[];
  hoodRoof: string;
  /** The sill along the hood, the skirts (cab sides; hood end), the apron under the cab end and the buffer beam. */
  sill: string;
  cabSkirt: string;
  endSkirt: string;
  apron: string;
  beam: string;
  rail: string;
  /** The cream lines (brown), the emblem and plates (brown), the logo and beacons (yellowGrey). */
  lines: boolean;
  number: string;
}

/** The cream line along the sides. */
const LINE: Span = [2.2, 2.3];
/** The apron's top on the cab end. */
const APRON_TOP = 1.42;

const LIVERIES: Record<string, Ns2200Livery> = {
  brown: {
    title: "Red brown",
    palette: {
      maroon: c("#6a2a26", 0.5), cream: c("#e2cf95", 0.45), beamRed: c("#c42a21", 0.5), roofM: c("#5e2724", 0.7),
      brass: { color: "#d8c27e", metallic: 0.4, roughness: 0.4 }, railM: c("#5a2522", 0.5),
    },
    cabSide: [[SILL, LINE[0], "maroon"], [LINE[0], LINE[1], "cream"], [LINE[1], CAB_ROOF, "maroon"]],
    cabEnd: [[SILL, APRON_TOP, "beamRed"], [APRON_TOP, CAB_ROOF, "maroon"]],
    cabRoof: "roofM",
    hoodSide: [[WALK, LINE[0], "maroon"], [LINE[0], LINE[1], "cream"], [LINE[1], HOOD_TOP, "maroon"]],
    hoodEnd: [[WALK, HOOD_TOP, "maroon"]],
    hoodRoof: "roofM",
    sill: "maroon",
    cabSkirt: "maroon",
    endSkirt: "maroon",
    apron: "beamRed",
    beam: "beamRed",
    rail: "railM",
    lines: true,
    number: "2225",
  },
  yellowGrey: {
    title: "NS yellow, grey",
    palette: {
      nsYellow: c("#f7c21a", 0.5), nsGrey: c("#4c555c", 0.55), darkGrey: c("#33383d", 0.65), roofG: c("#454c52", 0.7),
      railY: c("#f2bd1c", 0.5), logo: c("#f2f2ee", 0.5), black: c("#17181a", 0.6), beacon: { color: "#d4262a", roughness: 0.3, lamp: { role: "tail" } },
    },
    cabSide: [[SILL, CAB_ROOF, "nsYellow"]],
    cabEnd: [[SILL, APRON_TOP, "darkGrey"], [APRON_TOP, CAB_ROOF, "nsYellow"]],
    cabRoof: "nsYellow",
    hoodSide: [[WALK, HOOD_TOP, "nsGrey"]],
    hoodEnd: [[WALK, HOOD_TOP, "nsYellow"]],
    hoodRoof: "roofG",
    sill: "nsYellow",
    cabSkirt: "nsYellow",
    endSkirt: "darkGrey",
    apron: "darkGrey",
    beam: "darkGrey",
    rail: "railY",
    lines: false,
    number: "2205",
  },
};

export const NS2200_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", Object.fromEntries(Object.entries(LIVERIES).map(([k, v]) => [k, v.title])))];
const liveryOf = (v?: ParamValues): Ns2200Livery => LIVERIES[resolveParams(NS2200_PARAMS, v).livery!]!;

const BASE_PALETTE: Record<string, MaterialSpec> = {
  ...KIT_PALETTE,
  rim: { color: "#b9bdbf", metallic: 0.5, roughness: 0.35 }, alu: { color: "#c4c8ca", metallic: 0.45, roughness: 0.4 },
  steel: { color: "#5f6368", metallic: 0.3, roughness: 0.5 }, bogie: c("#2e3033", 0.75), wheel: c("#3a3c3f", 0.6), spring: c("#2a2b2d", 0.7), underframe: c("#26282b", 0.8),
  tank: c("#2b2d30", 0.7), exhaust: c("#2b2b2b", 0.9),
};

// --- shells ----------------------------------------------------------------------------------

function cabShell(l: Ns2200Livery): ShellSpec {
  return {
    heights: kinks(CAB_TIP, CAB_HW),
    tip: (y) => lerpTable(CAB_TIP, y),
    hw: (y) => lerpTable(CAB_HW, y),
    endPlan: (y) => roundedPlan(CAB_CORNER)(lerpTable(CAB_HW, y)),
    side: l.cabSide, end: l.cabEnd, corner: "side", roof: l.cabRoof,
    xc: CAB_XC,
  };
}

function hoodShell(l: Ns2200Livery): ShellSpec {
  return {
    heights: kinks(HOOD_TIP, HOOD_HW),
    tip: (y) => lerpTable(HOOD_TIP, y),
    hw: (y) => lerpTable(HOOD_HW, y),
    endPlan: (y) => roundedPlan(HOOD_CORNER)(lerpTable(HOOD_HW, y)),
    side: l.hoodSide, end: l.hoodEnd, corner: "side", roof: l.hoodRoof,
    xc: HOOD_XC,
    ends: [1],
  };
}

// --- skin helpers ---------------------------------------------------------------------------

/** A framed window: the rubber frame and the glass. */
function glazing(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span, r: number, vB: readonly number[], frame = "rubber"): void {
  m.scope("frame", () => surfacePanel(m, frame, at, n, roundRect(x[0], x[1], y[0], y[1], r), -0.01, 0.014, [], vB));
  m.scope("glass", () => surfacePanel(m, "glass", at, n, roundRect(x[0] + 0.035, x[1] - 0.035, y[0] + 0.035, y[1] - 0.035, Math.max(0, r - 0.02)), -0.005, 0.022, [], vB));
}

/** A lamp: a rim and its lens. */
function lamp(m: MeshBuilder, at: Place, n: Vec3, z: number, y: number, r: number, lens = "lampHead", vB: readonly number[] = []): void {
  m.scope("rim", () => surfacePanel(m, "rim", at, n, ngon(14, r + 0.03, 0, z, y), -0.01, 0.025, [], vB));
  m.scope("lens", () => surfacePanel(m, lens, at, n, ngon(14, r, 0, z, y), -0.005, 0.035, [], vB));
}

/** Door seams: four thin strips round the leaf. */
function seams(m: MeshBuilder, at: Place, n: Vec3, x: Span, y: Span, vB: readonly number[]): void {
  const t = 0.018;
  for (const q of [rect(x[0], y[0], x[1], y[0] + t), rect(x[0], y[1] - t, x[1], y[1]), rect(x[0], y[0] + t, x[0] + t, y[1] - t), rect(x[1] - t, y[0] + t, x[1], y[1] - t)])
    surfacePanel(m, "rubber", at, n, q, -0.002, 0.004, [], vB);
}

/** A louvre: the dark opening and its horizontal slats (the face and its lower lip). */
function louvre(m: MeshBuilder, at: Place, n: Vec3, u: Span, v: Span, slat: string, vB: readonly number[]): void {
  m.scope("opening", () => surfacePanel(m, "louvre", at, n, rect(u[0], v[0], u[1], v[1]), -0.006, 0.006, [], vB));
  m.scope("slats", () => {
    const pts: Vec3[] = [], lips: Vec3[] = [];
    const [a, b] = [u[0] + 0.025, u[1] - 0.025];
    for (let y = v[0] + 0.04; y + 0.03 <= v[1] - 0.02; y += 0.07) {
      const [p, q, r, t] = [at(a, y, 0.014), at(b, y, 0.014), at(b, y + 0.03, 0.014), at(a, y + 0.03, 0.014)];
      pts.push(p, q, r, p, r, t);
      const [p0, q0] = [at(a, y, 0.006), at(b, y, 0.006)];
      lips.push(p0, q0, q, p0, q, p);
    }
    m.facets(slat, pts, n);
    m.facets(slat, lips, [0, -1, 0]);
  });
}

/**
 * A painted line along a polyline (u, v) on a face, t thick: quads between
 * mitred cross-sections, the first and last cut upright (where the line meets
 * the corner and where its mirror image meets it at the vee).
 */
function stripe(pts: ReadonlyArray<readonly [number, number]>, t: number | readonly number[]): Ring[] {
  const th = (i: number) => (typeof t === "number" ? t : t[i]!) / 2;
  const segN = (i: number): [number, number] => {
    const [a, b] = [pts[i]!, pts[i + 1]!];
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    return [-dy / l, dx / l];
  };
  const cross = pts.map((p, i): [[number, number], [number, number]] => {
    if (i === 0 || i === pts.length - 1) {
      const sn = segN(Math.min(i, pts.length - 2));
      const k = th(i) / Math.abs(sn[1]);
      return [[p[0], p[1] - k], [p[0], p[1] + k]];
    }
    const [a, b] = [segN(i - 1), segN(i)];
    let nx = a[0] + b[0], ny = a[1] + b[1];
    const l = Math.hypot(nx, ny);
    nx /= l; ny /= l;
    const k = th(i) / (nx * b[0] + ny * b[1]);
    const s = ny >= 0 ? 1 : -1;
    return [[p[0] - s * nx * k, p[1] - s * ny * k], [p[0] + s * nx * k, p[1] + s * ny * k]];
  });
  const out: Ring[] = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [lo0, hi0] = cross[i]!, [lo1, hi1] = cross[i + 1]!;
    const q: Ring = [lo0, lo1, hi1, hi0];
    // counter-clockwise in (u, v)
    const area = q.reduce((acc, p, j) => { const r = q[(j + 1) % q.length]!; return acc + p[0] * r[1] - r[0] * p[1]; }, 0);
    out.push(area >= 0 ? q : [...q].reverse());
  }
  return out;
}

const mirrorU = (q: Ring): Ring => q.map(([u, v]) => [-u, v] as [number, number]).reverse();

/** The NS winged emblem with "NS" on its disc, and the number plate under it (brown), centred at z = 0. */
function emblem(m: MeshBuilder, at: Place, n: Vec3, e: number, y: number, number: string, vB: readonly number[], k = 1): void {
  m.scope("emblem", () => {
    // the wings: a vee of feathered bars
    const wing: Ring = ([[-0.28, 0.12], [0.28, 0.12], [0.2, 0.03], [0.07, -0.1], [-0.07, -0.1], [-0.2, 0.03]] as const).map(([u, v]) => [u * k, y + v * k] as [number, number]);
    surfacePanel(m, "brass", at, n, wing, -0.005, 0.012, [], vB);
    m.scope("disc", () => surfacePanel(m, "maroon", at, n, ngon(14, 0.075 * k, 0, 0, y + 0.03 * k), -0.003, 0.016, [], vB));
    const h = 0.06 * k, w = wordWidth("NS", h, { weight: 0.18 });
    const tris = letters("NS", e > 0 ? w / 2 : -w / 2, y + 0.03 * k - h / 2, h, e > 0, { weight: 0.18 });
    m.facets("brass", tris.map(([u, v]) => at(u, v, 0.019)), n);
  });
  m.scope("number plate", () => {
    const py = y - 0.2 * k;
    surfacePanel(m, "brass", at, n, roundRect(-0.15 * k, 0.15 * k, py - 0.065 * k, py + 0.065 * k, 0.02), -0.005, 0.012, [], vB);
    const h = 0.08 * k, w = wordWidth(number, h, { weight: 0.16 });
    const tris = letters(number, e > 0 ? w / 2 : -w / 2, py - h / 2, h, e > 0, { weight: 0.16 });
    m.facets("maroon", tris.map(([u, v]) => at(u, v, 0.015)), n);
  });
}

/** Black lettering on a face, centred at (u, v), read from outside: `flip` where +u runs to the reader's left. */
function lettering(m: MeshBuilder, at: Place, n: Vec3, text: string, u: number, v: number, h: number, flip: boolean, mat = "black"): void {
  const w = wordWidth(text, h, { weight: 0.15 });
  const tris = letters(text, flip ? u + w / 2 : u - w / 2, v - h / 2, h, flip, { weight: 0.15 });
  m.facets(mat, tris.map(([a, b]) => at(a, b, 0.008)), n);
}

/**
 * The NS logo (the elongated hexagon broken into two arrows pointing apart and
 * the stepped bar between them) centred at (u0, v0), `lw` by `lh`, as strokes in
 * one plane; `flip` mirrors it for a side read toward -u.
 */
function nsLogo(u0: number, v0: number, lw: number, lh: number, flip: boolean): Array<[number, number]> {
  const t = lh * 0.17;
  const a = lw / 2, b = lh / 2 - t / 2, k = a - lh * 0.42;
  const lines: Array<Array<readonly [number, number]>> = [
    [[a - 0.05, 0.025], [k + 0.01, b], [-k, b], [-a, 0.0], [-k + 0.04, -b + 0.1]],
    [[-a + 0.05, -0.025], [-k - 0.01, -b], [k, -b], [a, 0.0], [k - 0.04, b - 0.1]],
    [[-a + 0.16, 0.05], [-0.065, 0.05], [0.065, -0.05], [a - 0.16, -0.05]],
  ];
  const out: Array<[number, number]> = [];
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const [p, q] = [line[i - 1]!, line[i]!];
      const dx = q[0] - p[0], dy = q[1] - p[1], len = Math.hypot(dx, dy);
      const ux = (dx / len) * t * 0.5, uy = (dy / len) * t * 0.5, nx = -uy, ny = ux;
      const pts: Array<[number, number]> = [[p[0] - ux + nx, p[1] - uy + ny], [q[0] + ux + nx, q[1] + uy + ny], [q[0] + ux - nx, q[1] + uy - ny], [p[0] - ux - nx, p[1] - uy - ny]];
      const P = pts.map(([u, v]) => [u0 + (flip ? -u : u), v0 + v] as [number, number]);
      out.push(...(flip ? [P[0]!, P[2]!, P[1]!, P[0]!, P[3]!, P[2]!] : [P[0]!, P[1]!, P[2]!, P[0]!, P[2]!, P[3]!]));
    }
  return out;
}

// --- the cab --------------------------------------------------------------------------------

/** The cab side's layout (x, the cab end at -6.55). */
const DOOR: Span = [-6.47, -5.88];
const DOOR_Y: Span = [1.3, 3.62];
const DOOR_WIN: Span = [-6.34, -6.04];
const DOOR_WIN_Y: Span = [3.06, 3.52];
const SIDE_WIN: Span = [-5.7, -4.85];
const SIDE_WIN_Y: Span = [2.74, 3.5];
/** The cab end's windows (|z|), marker lamps, headlights. */
const END_WIN: Span = [0.73, 1.33];
const END_WIN_Y: Span = [2.8, 3.5];
/** The rear wall's door onto each walkway (|z|) and its window. */
const REAR_DOOR: Span = [1.0, 1.4];
const REAR_DOOR_Y: Span = [1.95, 3.5];
const REAR_WIN_Y: Span = [2.78, 3.32];

function cab(m: MeshBuilder, l: Ns2200Livery): void {
  const sp = cabShell(l);
  const vB = kinks(CAB_TIP, CAB_HW);
  m.scope("shell", () => shell(m, sp));
  // the sides
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      m.scope("door", () => {
        seams(m, at, n, DOOR, DOOR_Y, vB);
        glazing(m, at, n, DOOR_WIN, DOOR_WIN_Y, 0.1, vB);
      });
      m.scope("side window", () => {
        glazing(m, at, n, SIDE_WIN, SIDE_WIN_Y, 0.05, vB);
        surfacePanel(m, "rim", at, n, rect(SIDE_WIN[0] - 0.05, SIDE_WIN_Y[0] - 0.07, SIDE_WIN[1] + 0.05, SIDE_WIN_Y[0] - 0.035), -0.005, 0.03, [], vB);
      });
      if (!l.lines) m.scope("number", () => lettering(m, at, n, l.number, -4.5, 2.42, 0.17, sd < 0));
      m.scope("grab rails", () => {
        for (const x of [DOOR[0] - 0.035, DOOR[1] + 0.06]) {
          const z = sd * (W + 0.06);
          m.rod("steel", [x, 1.4, z], [x, 3.35, z], 0.017, 6);
          for (const y of [1.45, 3.3]) m.rod("steel", [x, y, sd * (W - 0.01)], [x, y, z], 0.014, 5);
        }
      });
    });
  // the cab end
  const front = onEnd(sp, -1);
  const nf: Vec3 = [-1, 0, 0];
  m.scope("cab end", () => {
    for (const s of [-1, 1]) {
      const z: Span = s > 0 ? END_WIN : [-END_WIN[1], -END_WIN[0]];
      m.scope(s > 0 ? "window left" : "window right", () => {
        glazing(m, front, nf, z, END_WIN_Y, 0.07, vB);
        surfacePanel(m, "rubber", front, nf, rect(z[0] + 0.12, END_WIN_Y[1] - 0.12, z[0] + 0.15, END_WIN_Y[1] - 0.03), 0.02, 0.035, [], vB);
      });
      m.scope(s > 0 ? "marker lamp left" : "marker lamp right", () => lamp(m, front, nf, s * 0.85, 3.67, 0.05, "lampHead", vB));
      m.scope(s > 0 ? "headlight left" : "headlight right", () => lamp(m, front, nf, s * 0.88, 1.7, 0.1, "lampHead", vB));
    }
    if (l.lines) {
      m.scope("lining", () => {
        const half = stripe([[W - CAB_CORNER, 2.25], [0.62, 2.25], [0.5, 2.19], [0.4, 2.02], [0, 1.47]], 0.1);
        surfaceDecal(m, "cream", front, nf, [...half, ...half.map(mirrorU)], 0.004);
      });
      emblem(m, front, nf, -1, 2.78, l.number, vB);
    } else {
      m.scope("number", () => lettering(m, front, nf, l.number, 0.35, 2.15, 0.16, false));
    }
  });
  // the rear wall: a door onto each walkway beside the hood
  const rear = onEnd(sp, 1);
  m.scope("rear wall", () => {
    for (const s of [-1, 1]) {
      const z: Span = s > 0 ? REAR_DOOR : [-REAR_DOOR[1], -REAR_DOOR[0]];
      m.scope(s > 0 ? "door right" : "door left", () => {
        seams(m, rear, [1, 0, 0], z, REAR_DOOR_Y, vB);
        glazing(m, rear, [1, 0, 0], [z[0] + 0.07, z[1] - 0.07], REAR_WIN_Y, 0.06, vB);
      });
    }
  });
  // the skirt under the cab: the apron on the end, the sides cut away over the bogie, the steps under the doors
  m.scope("skirt", () => {
    block(m, l.cabSkirt, CAB_END + 0.02, -5.62, CAB_SKIRT, SILL + 0.02, -1.42, 1.42);
    m.scope("apron", () => block(m, l.apron, CAB_END - 0.005, CAB_END + 0.025, CAB_SKIRT - 0.01, APRON_TOP - 0.003, -1.43, 1.43));
    const xs = [-6.55, -5.62, -5.55, -5.48, -5.38, -5.25, -5.1, -4.95];
    const bottom: Ring = [[xs[0]!, CAB_SKIRT], [xs[1]!, CAB_SKIRT], [xs[2]!, 0.62], [xs[3]!, 0.8], [xs[4]!, 0.97], [xs[5]!, 1.1], [xs[6]!, 1.2], [xs[7]!, SILL]];
    const top: Ring = xs.map((x) => [x, SILL + 0.04]);
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        plate(m, l.cabSkirt, top, bottom, ...(sd > 0 ? [1.42, W - 0.002] as [number, number] : [-W + 0.002, -1.42] as [number, number]));
        // the steps sunk in the skirt under the door
        const z = sd * (W + 0.002);
        const at: Place = (u, v, d) => [u, v, z + sd * d];
        surfacePanel(m, "underframe", at, [0, 0, sd], rect(DOOR[0] + 0.05, CAB_SKIRT + 0.04, DOOR[1] - 0.05, SILL - 0.02), 0, 0.004);
        for (const y of [0.55, 0.85, 1.12]) block(m, "steel", DOOR[0] + 0.07, DOOR[1] - 0.07, y, y + 0.035, ...(sd > 0 ? [1.3, W + 0.03] as [number, number] : [-W - 0.03, -1.3] as [number, number]));
      });
  });
}

// --- the hood -------------------------------------------------------------------------------

/** The hood's side: the louvres (upper and lower rows), the front compartment's doors; its front's lamps. */
const UPPER_LOUVRES = Array.from({ length: 14 }, (_, i) => -3.82 + i * 0.5);
const LOWER_LOUVRES = Array.from({ length: 8 }, (_, i) => -3.82 + i * 0.5);
const LOUVRE_W = 0.3;
const UPPER_Y: Span = [2.42, 3.02];
const LOWER_Y: Span = [1.68, 2.12];
const FRONT_DOORS: Span[] = [[3.35, 4.45], [4.55, 5.6]];
const FRONT_DOOR_Y: Span = [1.62, 3.2];
const LOGO = { x: 4.95, y: 2.88, w: 1.05, h: 0.52 };

function hood(m: MeshBuilder, l: Ns2200Livery): void {
  const sp = hoodShell(l);
  const vB = kinks(HOOD_TIP, HOOD_HW);
  m.scope("shell", () => shell(m, sp));
  const slat = l.hoodSide[0]![2];
  for (const sd of [-1, 1])
    m.scope(sd > 0 ? "right side" : "left side", () => {
      const at = onSide(sp, sd);
      const n: Vec3 = [0, 0, sd];
      m.scope("upper louvres", () => UPPER_LOUVRES.forEach((x, i) => m.scope(`${i + 1}`, () => louvre(m, at, n, [x, x + LOUVRE_W], UPPER_Y, slat, vB))));
      m.scope("lower louvres", () => LOWER_LOUVRES.forEach((x, i) => m.scope(`${i + 1}`, () => louvre(m, at, n, [x, x + LOUVRE_W], LOWER_Y, slat, vB))));
      m.scope("doors", () => FRONT_DOORS.forEach((x, i) => m.scope(`${i + 1}`, () => seams(m, at, n, x, FRONT_DOOR_Y, vB))));
      if (!l.lines) m.scope("NS logo", () => m.facets("logo", nsLogo(LOGO.x, LOGO.y, LOGO.w, LOGO.h, sd < 0).map(([u, v]) => at(u, v, 0.008)), n));
    });
  const at = onEnd(sp, 1);
  const n: Vec3 = [1, 0, 0];
  m.scope("front", () => {
    for (const z of [-0.68, 0, 0.68]) m.scope(`top lamp ${z < 0 ? "right" : z > 0 ? "left" : "middle"}`, () => lamp(m, at, n, z, 3.2, 0.055, "lampHead", vB));
    for (const s of [-1, 1]) m.scope(s > 0 ? "headlight left" : "headlight right", () => lamp(m, at, n, s * 0.64, 1.73, 0.1, "lampHead", vB));
    if (l.lines) {
      m.scope("lining", () => {
        const upper = stripe([[HOOD_W - HOOD_CORNER, 2.49], [0.64, 2.49], [0.5, 2.45], [0.3, 2.33], [0, 2.15]], 0.08);
        const lower = stripe([[HOOD_W - HOOD_CORNER, 2.25], [0.64, 2.25], [0.47, 2.18], [0.3, 2.04], [0.13, 1.92], [0, 1.86]], 0.1);
        const tail: Ring = [[0, 1.555], [0.035, 1.84], [-0.035, 1.84]];
        surfaceDecal(m, "cream", at, n, [...upper, ...upper.map(mirrorU), ...lower, ...lower.map(mirrorU), tail], 0.004);
      });
      emblem(m, at, n, 1, 2.92, l.number, vB, 1.22);
    } else {
      m.scope("number", () => lettering(m, at, n, l.number, 0, 2.13, 0.16, true));
    }
  });
  // the silencer casing along the top, the exhaust on it
  m.scope("silencer", () => {
    const ring = (w: number): Ring => [[3.0, w], [3.0, -w], [-3.3, -w], [-3.3, w]];
    m.loft("alu", ring(0.66), HOOD_TOP - 0.01, ring(0.6), 3.92);
    exhaust(m, -2.6, 0, 3.91, 4.0, 0.22, 0.3);
  });
}

// --- the frame and running gear ------------------------------------------------------------

/** Stanchion positions along the walkway's edge. */
const STANCHIONS = [-3.6, -2.3, -1.0, 0.3, 1.6, 2.9, 4.2, 5.4, 6.42];
const RAIL_Y = 2.45;
const RAIL_Z = 1.38;

function frame(m: MeshBuilder, l: Ns2200Livery): void {
  m.scope("sill", () => block(m, l.sill, CAB_REAR - 0.1, END - 0.005, SILL, WALK, -1.44, 1.44));
  m.scope("buffer beam", () => block(m, l.beam, 6.2, END + 0.008, BEAM_FOOT, WALK - 0.01, -1.43, 1.43));
  m.scope("end skirts", () => {
    const xs = [4.95, 5.1, 5.25, 5.38, 5.48, 5.55, 5.62, 6.21];
    const bottom: Ring = [[xs[0]!, SILL], [xs[1]!, 1.2], [xs[2]!, 1.1], [xs[3]!, 0.97], [xs[4]!, 0.8], [xs[5]!, 0.62], [xs[6]!, BEAM_FOOT + 0.02], [xs[7]!, BEAM_FOOT + 0.02]];
    const top: Ring = xs.map((x) => [x, SILL + 0.01]);
    for (const sd of [-1, 1]) m.scope(sd > 0 ? "right" : "left", () => plate(m, l.endSkirt, top, bottom, ...(sd > 0 ? [1.41, 1.435] as [number, number] : [-1.435, -1.41] as [number, number])));
  });
  // the step box on the walkway before each cab door
  m.scope("step boxes", () => {
    for (const sd of [-1, 1]) block(m, l.endSkirt, CAB_REAR + 0.005, CAB_REAR + 0.75, WALK - 0.01, 1.92, ...(sd > 0 ? [HOOD_W + 0.03, 1.4] as [number, number] : [-1.4, -HOOD_W - 0.03] as [number, number]));
  });
  m.scope("underframe", () => {
    block(m, "underframe", -2.25, 2.25, 1.0, SILL + 0.01, -1.2, 1.2);
    // the fuel tank and the air reservoirs between the bogies
    block(m, "tank", -1.75, 1.75, 0.5, 1.0, -1.1, 1.1);
    for (const z of [-0.75, 0.75]) {
      const r = ngon(10, 0.16, 0, z, 0.42);
      m.sweep("underframe", "x", r, -1.2, r, 1.2);
    }
  });
  m.scope("handrails", () => {
    for (const sd of [-1, 1])
      m.scope(sd > 0 ? "right" : "left", () => {
        const z = sd * RAIL_Z;
        m.rod(l.rail, [CAB_REAR + 0.01, RAIL_Y, z], [STANCHIONS[STANCHIONS.length - 1]!, RAIL_Y, z], 0.022, 6);
        for (const x of STANCHIONS) m.rod(l.rail, [x, WALK, z], [x, RAIL_Y, z], 0.02, 6);
        // at the hood end the rail turns in along the platform's end, the corner post running down to the steps
        m.rod(l.rail, [6.42, RAIL_Y, z], [6.42, RAIL_Y, sd * 0.98], 0.022, 6);
        m.rod(l.rail, [6.42, WALK, sd * 0.98], [6.42, RAIL_Y, sd * 0.98], 0.02, 6);
        m.rod(l.rail, [6.45, 0.62, sd * 1.4], [6.45, WALK, sd * 1.4], 0.02, 6);
        // the grab rail rising beside the cab's rear door
        m.rod(l.rail, [CAB_REAR + 0.06, WALK + 0.45, sd * 0.97], [CAB_REAR + 0.06, 3.3, sd * 0.97], 0.018, 6);
      });
  });
  m.scope("lower end", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "hood end" : "cab end", () => buffers(m, e, END, HALF, BUFFER_Y));
  });
  m.scope("bogies", () => {
    for (const e of [-1, 1]) m.scope(e > 0 ? "front bogie" : "rear bogie", () => bogie(m, { xc: e * PIVOT, halfBase: HALF_BASE, wheelR: WHEEL_R, frameTop: 0.98 }));
  });
}

function beacons(m: MeshBuilder): void {
  m.scope("beacons", () => {
    for (const [x, y] of [[CAB_END + 0.55, CAB_ROOF - 0.005], [HOOD_FRONT - 0.32, HOOD_TOP - 0.005]] as const) {
      m.prism("rim", ngon(10, 0.08, 0, x, 0), y, y + 0.04);
      m.prism("beacon", ngon(10, 0.065, 0, x, 0), y + 0.04, y + 0.17);
    }
  });
}

/** The NS 2200 in a livery. */
export function ns2200(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const m = new MeshBuilder({ ...BASE_PALETTE, ...l.palette });
  m.scope("body", () => {
    m.scope("cab", () => cab(m, l));
    m.scope("hood", () => hood(m, l));
    m.scope("frame", () => frame(m, l));
    if (!l.lines) beacons(m);
  });
  return m;
}

// --- low level of detail ----------------------------------------------------------------------

/** The distant model: the cab and the hood with their paint and windows, the frame and skirts, the bogies, the silencer. */
export function ns2200Lod(v?: ParamValues): MeshBuilder {
  const l = liveryOf(v);
  const cabLod: LodShell = {
    y0: SILL, xc: CAB_XC,
    tip: [[SILL, CAB_L], [3.66, CAB_L], [3.9, CAB_L - 0.15], [CAB_ROOF, CAB_L - 0.36]],
    hw: [[SILL, W], [3.7, W], [3.92, W - 0.2], [CAB_ROOF, W - 0.6]],
    side: l.cabSide, end: l.cabEnd, roof: l.cabRoof,
    sideWindows: [
      ...windowBands([{ u: SIDE_WIN, y: SIDE_WIN_Y }], 0),
      ...windowBands([{ u: DOOR_WIN, y: DOOR_WIN_Y }], 0).map((w) => ({ ...w, optional: 2 })),
    ],
    endWindows: windowBands([{ u: [-END_WIN[1], -END_WIN[0]], y: END_WIN_Y }, { u: END_WIN, y: END_WIN_Y }], 0.3).map((w) => ({ ...w, ends: [-1] })),
  };
  const hoodLod: LodShell = {
    y0: WALK, xc: HOOD_XC, ends: [1],
    tip: [[WALK, HOOD_L], [3.4, HOOD_L], [HOOD_TOP, HOOD_L - 0.2]],
    hw: [[WALK, HOOD_W], [3.4, HOOD_W], [HOOD_TOP, HOOD_W - 0.2]],
    side: l.hoodSide, end: l.hoodEnd, roof: l.hoodRoof,
  };
  const parts: LodPart[] = [
    { draw: (m) => m.scope("frame", () => {
      lodSideBox(m, l.sill, [[CAB_REAR - 0.1, SILL], [END, SILL], [END, WALK], [CAB_REAR - 0.1, WALK]], -1.44, 1.44);
      // the walkways' and the platform's floor
      lodPolygon(m, l.sill, [[CAB_REAR, WALK, -1.44], [END, WALK, -1.44], [END, WALK, 1.44], [CAB_REAR, WALK, 1.44]], [0, 1, 0]);
      lodSideBox(m, l.cabSkirt, [[CAB_END, CAB_SKIRT], [-5.5, CAB_SKIRT], [-4.95, SILL], [CAB_END, SILL]], -1.43, 1.43);
      lodSideBox(m, l.beam, [[5.55, BEAM_FOOT], [END, BEAM_FOOT], [END, SILL], [4.95, SILL]], -1.42, 1.42);
    }) },
    { draw: (m) => m.scope("running gear", () => {
      for (const e of [-1, 1]) lodBogie(m, e * PIVOT, HALF_BASE + WHEEL_R + 0.25, 0.98);
    }) },
    { optional: 50, draw: (m) => m.scope("tank", () => lodSideBox(m, "tank", [[-1.75, 0.5], [1.75, 0.5], [1.75, SILL], [-1.75, SILL]], -1.1, 1.1)) },
    { draw: (m) => m.scope("silencer", () => lodRoofBox(m, "alu", -3.3, 3.0, 0.66, 0.6, HOOD_TOP - 0.01, 3.92)) },
  ];
  return fitLod({ palette: { ...BASE_PALETTE, ...l.palette }, shells: [cabLod, hoodLod], parts }, 100);
}
