// The China Railway 25-series coach on the coach kit (worldCoaches.ts): the 25T body (1999 -,
// 160 km/h), as the soft sleeper RW25T and the hard-seat car YZ25T, in the Z-express white and blue
// and in the green with yellow lines that the 25B introduced and the 25T now wears. Each side laid out
// from photographs (assets/cr-25t-coach/SOURCES.md, docs/models/china-locos.md).
//
// Published: body 25.5 m, 26.6 m over the couplers (painted on the car's end), 3.105 m wide, 4.433 m
// high over the air-conditioning units, bogies 18 m apart; the RW25T 54.5 t and 36 berths, the YZ25T
// 118 seats. Measured (1-D projective fits along each photograph's equal window pitch, the ends at
// the body's 25.5 m; heights on the near-orthographic YZ25T 350662, 43.5 px/m, the rail at the
// wheels' foot):
// - RW25T compartment side (553849 green, 553745 white): the door at each end, two narrow windows
//   beside the air-conditioned end's door, nine compartment windows 1.52 m on a 2.0 m pitch, a narrow
//   window, a blank panel and the other door.
// - RW25T corridor side (554056): the door, a narrow window, ten corridor windows 1.27 m on 2.0 m,
//   a narrow window, the door; the air conditioning over the end whose compartment-side door has the
//   two narrow windows, a roof grille over the other end.
// - YZ25T (350662 green, 351219 white): a door at each end, a blank wall beside one, twelve 1.09 m
//   windows on a 1.62 m pitch, two narrow windows by the other door; the other side turned end for
//   end (all three photographs show this pattern with the blank end on the left); an
//   air-conditioning unit over each end.
// - Heights: the side's foot 0.8 m, the window frames 1.92 - 2.96 m with a top light's bar, the eaves
//   3.5 m, the roof's crown 4.3 m and the units' tops 4.43 m; the green's yellow lines 1.66 - 1.82 m
//   and 3.06 - 3.17 m, broken at the doors; the white's blue band 1.86 - 3.02 m, broken by a white gap
//   behind each end's door group, and a red line along the foot.

import type { WorldCoach } from "./worldCoaches.ts";
import type { CarDef } from "./usTransit.ts";
import type { MeshBuilder, MaterialSpec } from "./meshBuilder.ts";
import { paint } from "./dieselParts.ts";
import { block, side } from "./vehicleParts.ts";
import { sidePanel, surfacePoint, type SliceBody } from "./sliceBody.ts";
import { decalX } from "./usHoodKit.ts";
import type { Pt } from "./sliceLoft.ts";
import type { LodPart } from "./lodKit.ts";

const c = (hex: string, r = 0.45): MaterialSpec => paint(hex, r);
type Span = readonly [number, number];

/** Body length between the end walls (26.6 m over the couplers, the coupling planes 0.55 m beyond them). */
const L = 25.5;
const GAP = 0.55;
/** The side's foot (over the bogies), the skirt's bottom between them, the eaves and the crown. */
const FOOT = 0.8;
const SKIRT = 0.7;
const EAVES = 3.5;
const CROWN = 4.3;
/** The window frames' sill and head, the top light's bar; the doors' leaves and their window. */
const ROW: Span = [1.92, 2.96];
const BAR = 2.62;
const DOOR: Span = [0.08, 1.03];
const DOOR_Y: Span = [0.87, 3.24];
const DOOR_GLASS: Span = [1.97, 2.93];
/** The green livery's yellow lines, the white livery's blue band and red line. */
const LOW_LINE: Span = [1.66, 1.82];
const HIGH_LINE: Span = [3.06, 3.17];
const BAND: Span = [1.86, 3.02];
const RED: Span = [FOOT, 0.86];
/** The air-conditioning unit over an end: from d0 to d1, its half width, its top. */
const AC = { d: [0.12, 2.6] as Span, half: 1.22, top: 4.43 };

const pitched = (from: number, n: number, pitch: number, w: number): Span[] => Array.from({ length: n }, (_, i): Span => [from + i * pitch, from + i * pitch + w]);
const turned = (spans: readonly Span[]): Span[] => spans.map(([a, b]): Span => [L - b, L - a]).sort((p, q) => p[0] - q[0]);

interface Side {
  /** The windows (frames) and the white livery's gaps in the blue band. */
  windows: Span[];
  gaps: Span[];
}

interface Unit {
  /** +Z side and -Z side (d from the +X end). */
  sides: readonly [Side, Side];
  /** Which ends carry an air-conditioning unit (+1 the +X end, d = 0), and a roof grille's span (over the other end). */
  ac: readonly number[];
  grille?: Span;
}

// the RW25T: d = 0 at the air-conditioned end
const RW_COMPARTMENT: Side = {
  windows: [[1.42, 1.92], [3.08, 3.55], ...pitched(4.09, 9, 2.0, 1.52), [21.93, 22.38]],
  gaps: [[2.2, 2.98], [22.46, 23.29]],
};
const RW_CORRIDOR: Side = {
  windows: [[1.63, 2.23], ...pitched(2.7, 10, 2.0, 1.27), [22.3, 22.91]],
  gaps: [[2.28, 2.64], [22.96, 23.4]],
};
// the YZ25T as photographed (its -Z side), and the +Z side turned end for end
const YZ_SIDE: Side = {
  windows: [...pitched(2.94, 12, 1.62, 1.09), [22.42, 23.08], [23.52, 24.17]],
  gaps: [[2.4, 2.84], [21.93, 22.32]],
};

const UNITS: Record<string, Unit> = {
  softSleeper: { sides: [RW_CORRIDOR, RW_COMPARTMENT], ac: [1], grille: [21.7, 22.4] },
  hardSeat: { sides: [{ windows: turned(YZ_SIDE.windows), gaps: turned(YZ_SIDE.gaps) }, YZ_SIDE], ac: [1, -1] },
};

/** The running numbers painted on the photographed cars, by livery and unit. */
const NUMBERS: Record<string, Record<string, string>> = {
  z25t: { softSleeper: "RW25T 553745", hardSeat: "YZ25T 351219" },
  green25b: { softSleeper: "RW25T 553849", hardSeat: "YZ25T 350662" },
};

const isWhite = (c0: CarDef) => c0.bands.some(([, , mt]) => mt === "zBlue");

function cr25Layout(c0: CarDef, unit: string): CarDef {
  const u = UNITS[unit]!;
  const white = isWhite(c0);
  const frame = white ? "zFrame" : "frameW";
  const windows = u.sides.map((sd, i): CarDef["windows"][number] => ({ y: ROW, spans: sd.windows, frame, onSide: i === 0 ? 1 : -1, cornerR: 0.09, ...(white ? { glass: "zGlass" } : {}) }));
  const number = NUMBERS[white ? "z25t" : "green25b"]![unit]!;
  const ink = white ? "letterZ" : "letterY";
  return {
    ...c0,
    windows,
    doors: { spans: [DOOR, [L - DOOR[1], L - DOOR[0]]], y: DOOR_Y, glass: DOOR_GLASS, glassW: 0.45, glassCornerR: 0.12 },
    diaphragm: null,
    lettering: [2.85, L - 2.85].map((d) => ({ text: number, d, y: 1.3, h: 0.15, mat: ink })),
    extras: (m, b, X) => {
      c0.extras?.(m, b, X);
      cr25Extras(m, b, X, u, white, frame);
    },
  };
}

/** A strip on the body's surface on side s (the side or the roof's arc), d0..d1 between heights ya and yb, standing `proud` off it. */
function surfaceStrip(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, mat: string, d0: number, d1: number, ya: number, yb: number, proud: number): void {
  const dm = (d0 + d1) / 2;
  const pa = surfacePoint(b, dm, ya, s), pb = surfacePoint(b, dm, yb, s);
  const nz = ((pa.n[2] + pb.n[2]) / 2) * s, ny = (pa.n[1] + pb.n[1]) / 2;
  const at = (p: Pt, k: number): Pt => [s * (p[0] + nz * k), p[1] + ny * k];
  const ring: Pt[] = [at(pa.p, -0.03), at(pb.p, -0.03), at(pb.p, proud), at(pa.p, proud)];
  m.sweep(mat, "x", ring, X(d0), ring, X(d1));
}

function cr25Extras(m: MeshBuilder, b: SliceBody, X: (d: number) => number, u: Unit, white: boolean, frame: string): void {
  for (const s of [1, -1]) {
    const sd = u.sides[s > 0 ? 0 : 1]!;
    m.scope(s > 0 ? "right side" : "left side", () => {
      // every window's top light: a bar across the frame below its head
      m.scope("top lights", () => {
        for (const [a, e] of sd.windows) sidePanel(m, b, X, s, frame, a + 0.04, e - 0.04, BAR - 0.02, BAR + 0.02, 0.016, 0.006);
      });
      // the white livery's gaps in the blue band, behind each end's door group
      if (white) m.scope("band gaps", () => {
        for (const [a, e] of sd.gaps) sidePanel(m, b, X, s, "white", a, e, BAND[0] - 0.01, BAND[1] + 0.01, 0.003, 0.002);
      });
      // a grab rail beside each door, on its inner side
      m.scope("grab rails", () => {
        for (const d of [DOOR[1] + 0.05, L - DOOR[1] - 0.05]) sidePanel(m, b, X, s, "handrail", d - 0.015, d + 0.015, 1.15, 2.45, 0.05, 0.06);
      });
      // the roof grille near the eaves over the end without air conditioning
      if (u.grille) m.scope("roof grille", () => {
        const [a, e] = u.grille!;
        surfaceStrip(m, b, X, s, "louvre", a, e, EAVES + 0.08, EAVES + 0.3, 0.008);
        for (let i = 0; i < 4; i++) {
          const y = EAVES + 0.12 + i * 0.05;
          surfaceStrip(m, b, X, s, "louvreSlat", a + 0.04, e - 0.04, y, y + 0.022, 0.016);
        }
      });
    });
  }
  // the air-conditioning units: a box over the roof's end with chamfered top edges, louvres on its sides and fan grilles on top
  for (const e of u.ac)
    m.scope(e > 0 ? "front air conditioning" : "rear air conditioning", () => {
      const [d0, d1] = e > 0 ? AC.d : [L - AC.d[1], L - AC.d[0]];
      const { half, top } = AC;
      const ring: Pt[] = [[-half, EAVES + 0.2], [half, EAVES + 0.2], [half, top - 0.11], [half - 0.14, top], [-(half - 0.14), top], [-half, top - 0.11]];
      m.sweep("acGrey", "x", ring, X(d0), ring, X(d1));
      for (const sd of [1, -1]) {
        for (const [a, c1] of [[d0 + 0.2, (d0 + d1) / 2 - 0.08], [(d0 + d1) / 2 + 0.08, d1 - 0.2]] as const) {
          const [x0, x1] = [X(a), X(c1)].sort((p, q) => p - q) as [number, number];
          block(m, "louvre", x0, x1, top - 0.36, top - 0.18, ...side(sd, half - 0.01, half + 0.008));
          for (let i = 0; i < 3; i++) block(m, "louvreSlat", x0 + 0.02, x1 - 0.02, top - 0.335 + i * 0.055, top - 0.315 + i * 0.055, ...side(sd, half + 0.008, half + 0.016));
        }
      }
      for (const [a, c1] of [[d0 + 0.3, d0 + 1.05], [d1 - 1.05, d1 - 0.3]] as const) {
        const [x0, x1] = [X(a), X(c1)].sort((p, q) => p - q) as [number, number];
        block(m, "louvre", x0, x1, top, top + 0.012, -0.75, 0.75);
      }
    });
  // the underframe's equipment boxes and water tank beside the kit's middle block, between the bogies
  m.scope("underframe boxes", () => {
    for (const [a, e] of [[5.9, 8.7], [16.8, 19.6]] as const) {
      const [x0, x1] = [X(a), X(e)].sort((p, q) => p - q) as [number, number];
      block(m, "under", x0, x1, 0.42, SKIRT, -1.15, 1.15);
    }
  });
  // the gangways: a closed bellows from each end wall to the coupling plane round the end door and its window
  for (const e of [1, -1])
    m.scope(e > 0 ? "front gangway" : "rear gangway", () => {
      const wall = X(e > 0 ? 0 : L);
      const out = wall + e * (GAP - 0.1);
      const [a, c1] = [wall, out].sort((p, q) => p - q) as [number, number];
      const [y0, y1] = [1.05, 3.45];
      for (const sd of [1, -1]) block(m, "bellows", a, c1, y0, y1, ...side(sd, 0.56, 0.74));
      block(m, "bellows", a, c1, y1 - 0.18, y1, -0.56, 0.56);
      block(m, "bellows", a, c1, y0, y0 + 0.08, -0.56, 0.56);
      decalX(m, "endDoor", wall + e * 0.004, e, -0.55, 0.55, y0 + 0.08, y1 - 0.18);
      decalX(m, "rubber", wall + e * 0.008, e, -0.25, 0.25, 2.1, 2.9);
      decalX(m, "glass", wall + e * 0.011, e, -0.21, 0.21, 2.14, 2.86);
    });
}

/** The distant model: the shell, its bands and window strip as the kit draws it, and the air-conditioning boxes. */
function cr25Lod(body: Parameters<NonNullable<WorldCoach["lod"]>>[0], c0: CarDef, X: (d: number) => number, unit: string): ReturnType<NonNullable<WorldCoach["lod"]>> {
  const u = UNITS[unit] ?? UNITS.softSleeper!;
  const parts: LodPart[] = u.ac.map((e) => {
    const [d0, d1] = e > 0 ? AC.d : [L - AC.d[1], L - AC.d[0]];
    const [x0, x1] = [X(d0), X(d1)].sort((p, q) => p - q) as [number, number];
    return { draw: (m: MeshBuilder) => m.scope("body", () => block(m, "acGrey", x0, x1, EAVES + 0.15, AC.top, -(AC.half - 0.1), AC.half - 0.1)) };
  });
  return { body, bogieTop: c0.spec.B, parts };
}

const EXTRA: Record<string, MaterialSpec> = {
  frameW: c("#e9ebe6", 0.4), handrail: c("#b9bcbe", 0.35), acGrey: c("#9ea3a6", 0.55),
};

export const CR_25: WorldCoach = {
  length: L + 2 * GAP, gap: GAP, W: 1.5525, Y: FOOT + 0.01, S: EAVES, C: CROWN, B: SKIRT, A: FOOT, rows: [ROW], doorIn: DOOR[0], doorW: DOOR[1] - DOOR[0], door: DOOR_Y,
  bogieCentres: 18.0, wheelR: 0.4575, wheelbase: 2.4, coupler: "knuckle", maxspeed: 160,
  types: {
    softSleeper: { title: "Soft sleeper", windows: 9, windowW: 1.52, number: "RW25T 553849", weight: 54.5 },
    hardSeat: { title: "Hard seat", windows: 12, windowW: 1.09, number: "YZ25T 350662", weight: 48 },
  },
  liveries: {
    // the Z expresses' 25T (BSP, 2004): white, a dark blue band round the windows broken behind each end's doors, a red line along the foot, a light grey roof
    z25t: {
      title: "25T white, blue",
      palette: { ...EXTRA, white: c("#eceeea", 0.4), zBlue: c("#1d3d5e"), red: c("#b8282c"), roofG: c("#b4b8ba", 0.6), skirtG: c("#2c3338", 0.8), zFrame: c("#2a3540", 0.5), zGlass: { color: "#5f7a84", metallic: 0.2, roughness: 0.15, glass: true }, letterZ: c("#25303a") },
      bands: [[0, RED[0], "skirtG"], [RED[0], RED[1], "red"], [RED[1], BAND[0], "white"], [BAND[0], BAND[1], "zBlue"], [BAND[1], 9, "white"]], roof: "roofG", skirt: "skirtG",
      doorBands: [[0, BAND[0], "white"], [BAND[0], BAND[1], "zBlue"], [BAND[1], 9, "white"]],
      ends: { bands: [[0, RED[0], "skirtG"], [RED[0], RED[1], "red"], [RED[1], BAND[0], "white"], [BAND[0], BAND[1], "zBlue"], [BAND[1], 9, "white"]], cap: "white" },
    },
    // the green with two yellow lines (the 25B's, now on most 25T cars): the lines broken at the doors, a grey roof
    green25b: {
      title: "25B green",
      palette: { ...EXTRA, green: c("#24412f", 0.5), yellow: c("#f0c419"), roofG: c("#a3a8ac", 0.6), letterY: c("#ecc22a") },
      bands: [[0, LOW_LINE[0], "green"], [LOW_LINE[0], LOW_LINE[1], "yellow"], [LOW_LINE[1], HIGH_LINE[0], "green"], [HIGH_LINE[0], HIGH_LINE[1], "yellow"], [HIGH_LINE[1], 9, "green"]], roof: "roofG", skirt: "green",
      doorBands: [[0, 9, "green"]],
      ends: { bands: [[0, 9, "green"]], cap: "green" },
    },
  },
  details: {
    wl: 1.5, wa: 1.55,
    // the roof rounding down over each end wall, the end walls' corners rounded in plan
    roofEnd: [[0, 3.78], [0.05, 3.97], [0.12, 4.1], [0.22, 4.2], [0.36, 4.27], [0.55, 4.3]], endCorner: { len: 0.15, tip: 0.93 },
    underfloor: { y0: 0.32, half: 1.25 },
  },
  layout: (c0, unit) => cr25Layout(c0, unit),
  lod: (body, c0, X) => cr25Lod(body, c0, X, c0.windows.length && c0.windows[0]!.spans.length === YZ_SIDE.windows.length ? "hardSeat" : "softSleeper"),
};
