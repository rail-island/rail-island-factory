// The Tatra trams and the GT4, reconstructed from vlakosimdb db/tram (the native
// XML and BMPs kept in assets/<folder>/native): bodies lofted from the XML
// alongx / alongy / alongz profiles, windows, doors, paint bands and lamps from
// boxes measured on the original BMPs, every drawing mapped onto the type's
// published length, width and height (tramKit.ts). The rigid T3 and T6 are one
// node; the articulated KT8D5, KT4 and GT4 are sections and bellows with a rig
// (vehicle-rig.md). See docs/models/trams.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type CatalogFields, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import type { Volume } from "./csdCoachParts.ts";
import { Tram, articulate, type Pt, type PxBox, type SourceVolume, type TramMap } from "./tramKit.ts";

/** The game-catalog fields of the trams: rail vehicles in their own pool. */
export const TRAM_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "tram",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** Contact-wire display height of a raised tram pantograph (a model choice, docs/models/trams.md). */
export const TRAM_WIRE = 5.5;
/** Tram wheels: 700 mm (T3, T6A5, KT8D5, KT4) on standard gauge. */
export const TRAM_WHEEL_R = 0.35;
export const TRAM_GAUGE = 1.435;

type Band = [number, number, string];
const sides = [1, -1] as const;
const sideName = (s: number) => (s > 0 ? "right side" : "left side");
const endName = (e: number) => (e > 0 ? "front end" : "rear end");

// ---------------------------------------------------------------------------
// Tatra T3
// ---------------------------------------------------------------------------

export type T3Variant = "t3" | "t3m" | "t3prototype";

export const T3_PARAMS: readonly ParamSpec[] = [{
  name: "variant",
  title: "Variant",
  values: [
    { value: "t3", title: "T3 (red and cream)" },
    { value: "t3m", title: "T3M (thyristor control, LED destination)" },
    { value: "t3prototype", title: "T3 prototype (blue and yellow)" },
  ],
  default: "t3",
}];

/**
 * The T3's source drawing (tram_ckd_t3, 16 by 6 m side canvas) onto the
 * published 14.0 m body, 2.5 m width and 3.05 m roof (assets/tatra-t3/SOURCES.md).
 */
export const T3_MAP: TramMap = { c: 7.85, kx: 14.0 / 14.8, ky: 3.05 / 3.4, kz: 2.5 / 2.4, side: 6, end: 4 };

const T3_SECTION: Pt[] = [[-1.2, 0], [1.2, 0], [1.2, 3], [1.1, 3.2], [0.9, 3.3], [0, 3.4], [-0.9, 3.3], [-1.1, 3.2], [-1.2, 3]];
const T3X_SECTION: Pt[] = [[-1.2, 0], [1.2, 0], [1.2, 3], [1.1, 3.2], [1, 3.3], [0.8, 3.4], [-0.8, 3.4], [-1, 3.3], [-1.1, 3.2], [-1.2, 3]];

/** Plan, roof line and underside (with the skirts between the bogies) from the XML. */
const T3_BODY: SourceVolume = {
  plan: [[0.5, 0.6], [0.6, 0.8], [0.8, 0.9], [1.2, 1.0], [3.2, 1.2], [12.6, 1.2], [14.5, 1.0], [15.0, 0.9], [15.2, 0.8], [15.3, 0.6]],
  top: [[0.5, 1.7], [0.75, 2.75], [0.78, 3.15], [0.9, 3.32], [2.1, 3.4], [13.8, 3.4], [14.7, 3.32], [14.86, 3.15], [14.92, 2.8], [15.3, 1.7]],
  bottom: [[0.5, 0.9], [0.7, 0.7], [0.9, 0.7], [1.2, 0.4], [3.1, 0.4], [3.4, 0.7], [5.6, 0.7], [5.9, 0.4], [9.8, 0.4], [10.1, 0.7], [12.4, 0.7], [12.6, 0.4], [14.5, 0.4], [14.8, 0.7], [15.0, 0.7], [15.3, 0.9]],
};
const T3X_BODY: SourceVolume = {
  plan: [[0.5, 0.6], [0.6, 0.8], [0.8, 1.0], [1.2, 1.1], [3.2, 1.2], [12.6, 1.2], [14.5, 1.1], [15.0, 1.0], [15.2, 0.8], [15.3, 0.6]],
  top: [[0.5, 1.7], [0.75, 2.75], [0.78, 3.15], [1.3, 3.3], [1.5, 3.4], [14.1, 3.4], [14.3, 3.3], [14.86, 3.15], [14.92, 2.8], [15.3, 1.7]],
  bottom: T3_BODY.bottom,
};

interface T3Livery {
  /** Below the belt, the belt, the window band, the roof. */
  skirt: string;
  belt: string;
  upper: string;
  roof: string;
  /** Door leaves, window frames, the cab glass and the side glass. */
  door: string;
  frame: string;
  glass: string;
  colors: Record<string, string>;
  /** The fleet number on the sides and the front, or none. */
  number?: string;
}

const T3_LIVERIES: Record<T3Variant, T3Livery> = {
  // Prague's red and cream (the native BMP's white is the cream of the photographs)
  t3: { skirt: "cream", belt: "red", upper: "cream", roof: "roof", door: "cream", frame: "frame", glass: "glass", colors: { cream: "#ece6d2", red: "#d2232a" } },
  t3m: { skirt: "cream", belt: "red", upper: "cream", roof: "roof", door: "cream", frame: "frame", glass: "glass", colors: { cream: "#ece6d2", red: "#d2232a" } },
  // tram_ckd_t3x: dark blue skirt and doors, a yellow belt, a blue window band, a light grey roof
  t3prototype: { skirt: "navy", belt: "yellow", upper: "blue", roof: "lightRoof", door: "navy", frame: "doorFrame", glass: "tinted", colors: { navy: "#0f1a6e", yellow: "#f2cf1c", blue: "#1748b8", lightRoof: "#b4b6b8", doorFrame: "#7a7a7c", tinted: "#2e3134" } },
};

/** The fleet numbers the models carry: two photographed cars and an illustrative one (assets/tatra-t3/SOURCES.md). */
export const T3_NUMBERS: Record<T3Variant, string> = { t3: "7290", t3m: "8029", t3prototype: "6340" };

/** Right (door) side windows: three behind the first door, two behind the second; rows 30..41 of z_inc. */
const T3_RIGHT_WINDOWS: PxBox[] = [[32, 30, 46, 41], [47, 30, 61, 41], [62, 30, 77, 41], [96, 30, 110, 41], [111, 30, 125, 41]];
/** Left side: eight windows at a 1.6 m pitch (z_dec). */
const T3_LEFT_WINDOWS: PxBox[] = [[14, 30, 29, 41], [31, 30, 45, 41], [47, 30, 61, 41], [63, 30, 77, 41], [79, 30, 93, 41], [95, 30, 109, 41], [111, 30, 125, 41], [127, 30, 141, 41]];
/** The three four-leaf folding doors (z_inc), a glazed light per leaf. */
const T3_DOORS: Array<{ box: PxBox; lights: PxBox[] }> = [14, 78, 126].map((u) => ({
  box: [u, 30, u + 17, 56],
  lights: [0, 4, 8, 12].map((d): PxBox => [u + 1 + d, 31, u + 4 + d, 50]),
}));

export function tatraT3(params?: ParamValues): MeshBuilder {
  const variant = resolveParams(T3_PARAMS, params).variant as T3Variant;
  const L = T3_LIVERIES[variant];
  const proto = variant === "t3prototype";
  const t = new Tram(Object.fromEntries(Object.entries(L.colors).map(([k, c]) => [k, { color: c, roughness: 0.5 }])), T3_MAP);
  const m = t.m;
  const section = proto ? T3X_SECTION : T3_SECTION;
  const body = proto ? T3X_BODY : T3_BODY;
  // paint bands in source heights: the belt 0.95..1.8, the cab glass 1.9..2.95
  // (the cabs carry the bumper strip, 0.85..1.0, round the end and back to the first door)
  const main: Band[] = [[0, 0.95, L.skirt], [0.95, 1.8, L.belt], [1.8, 3.25, L.upper], [3.25, 3.6, L.roof]];
  const cab: Band[] = [[0, 0.85, L.skirt], [0.85, 1.0, "bumper"], [1.0, 1.8, L.belt], [1.8, 1.9, L.upper], [1.9, 2.95, L.glass], [2.95, 3.25, L.upper], [3.25, 3.6, L.roof]];
  const front = t.vol("front cab", section, body, 0.5, 1.2, cab);
  const mid = t.vol("saloon", section, body, 1.2, 14.45, main);
  const rear = t.vol("rear cab", section, body, 14.45, 15.3, cab);

  m.scope("body", () => {
    m.scope("front cab", () => t.volume(front));
    m.scope("saloon", () => t.volume(mid));
    m.scope("rear cab", () => t.volume(rear));
  });
  for (const s of sides) m.scope(sideName(s), () => {
    m.scope("windows", () => t.windows(mid, s, s > 0 ? T3_RIGHT_WINDOWS : T3_LEFT_WINDOWS, { frame: L.frame, glass: L.glass, sash: 2.4 }));
    if (s > 0) m.scope("doors", () => t.doors(mid, s, T3_DOORS, L.door, { frame: L.frame, glass: L.glass, sash: 1.88 }));
    m.scope("fleet number", () => t.inscription(mid, s, t.fx(s > 0 ? 7.0 : 2.6), [{ text: T3_NUMBERS[variant], y: t.fy(1.15), h: 0.16 }], 0.006, "marking"));
  });
  for (const e of [1, -1]) m.scope(endName(e), () => {
    const v = e > 0 ? front : rear;
    m.scope("lamps", () => {
      if (e > 0) for (const u of [8.5, 21.5]) t.lamp(v, e, u, 27.5, 0.08, "lampHead");
      else {
        for (const u of [9, 21]) t.lamp(v, e, u, 28.5, 0.055, "lampRed");
        t.lamp(v, e, 15, 28.5, 0.045, "lampRed");
      }
    });
    if (e > 0) m.scope("destination", () => {
      // T3: the route-number box over the windscreen; T3M and the prototype: a destination display
      if (variant === "t3") {
        t.endBlock(e, "blue", [12, 6, 18, 10], 0.79, 0.12, 0.02);
        t.endBlock(e, "lampHead", [13, 7, 17, 9.5], 0.79, 0.05, 0.045);
      } else {
        t.endBlock(e, "display", [8, 7, 22, 9.5], 0.79, 0.12, 0.02);
        t.endBlock(e, "led", [9, 7.6, 21, 9], 0.79, 0.05, 0.045);
      }
    });
  });

  m.scope("roof equipment", () => {
    m.scope("pantographs", () => m.scope("pantograph", () => t.diamond(t.fx(4.75), t.fy(3.4), TRAM_WIRE)));
    m.scope("resistor box", () => t.roofBox("roofBox", 10.9, 12.6, 3.38, 3.8, 0.55));
    m.scope("vents", () => {
      for (const [a, b] of [[2, 3], [8.1, 9.1], [12.9, 13.8]] as const) t.roofBox("roofBox", a, b, 3.38, 3.5, 0.35, 0.03);
    });
  });

  m.scope("running gear", () => {
    for (const [i, x] of [4.45, 11.25].entries()) m.scope(`bogie ${i + 1}`, () => t.tramBogie(x, 1.9, TRAM_WHEEL_R, t.fy(0.7)));
    m.scope("couplers", () => {
      t.coupler(1, t.fx(0.9), t.fx(0), t.fy(0.65));
      t.coupler(-1, t.fx(14.9), t.fx(15.7), t.fy(0.65));
    });
  });
  return m;
}

// ---------------------------------------------------------------------------
// Tatra T6A5
// ---------------------------------------------------------------------------

/**
 * tram_ckd_t6 (16 by 6 m side canvas) onto the published 14.7 m body, 2.5 m
 * width and 3.165 m body height (assets/tatra-t6/SOURCES.md).
 */
export const T6_MAP: TramMap = { c: 8.0, kx: 14.7 / 15.2, ky: 3.165 / 3.5, kz: 2.5 / 2.4, side: 6, end: 6 };

const T6_SECTION: Pt[] = [[-1.2, 0], [1.2, 0], [1.2, 3.4], [0.8, 3.5], [-0.8, 3.5], [-1.2, 3.4]];
const T6_BODY: SourceVolume = {
  plan: [[0.4, 0.8], [1.2, 1.0], [3.1, 1.2], [13, 1.2], [14.8, 1.0], [15.6, 0.8]],
  top: [[0.4, 1.7], [0.8, 3.3], [1.1, 3.3], [2.8, 3.5], [13.5, 3.5], [15, 3.3], [15.2, 3.3], [15.6, 1.7]],
  bottom: [[0.4, 0.7], [0.7, 0.7], [0.8, 0.4], [3.1, 0.4], [3.4, 0.7], [5.6, 0.7], [5.9, 0.4], [9.8, 0.4], [10.1, 0.7], [12.3, 0.7], [12.6, 0.4], [15.3, 0.4], [15.4, 0.7], [15.6, 0.7]],
};
/** The fleet number: Prague's 8745, photographed (assets/tatra-t6/PHOTOS.md). */
export const T6_NUMBER = "8745";

const T6_RIGHT_WINDOWS: PxBox[] = [[32, 28, 51, 42], [51, 28, 71, 42], [89, 28, 108, 42], [108, 28, 129, 42]];
const T6_LEFT_WINDOWS: PxBox[] = [[13, 28, 32, 42], [32, 28, 51, 42], [51, 28, 70, 42], [70, 28, 89, 42], [89, 28, 108, 42], [108, 28, 127, 42], [127, 28, 147, 42]];
/** Three two-leaf plug doors (z_inc), a tall light per leaf. */
const T6_DOORS: Array<{ box: PxBox; lights: PxBox[] }> = [14, 72, 130].map((u) => ({
  box: [u, 31, u + 17, 56],
  lights: [[u + 2, 33, u + 7, 48], [u + 10, 33, u + 15, 48]],
}));

export function tatraT6(): MeshBuilder {
  const t = new Tram({ cream: { color: "#ebe8dd", roughness: 0.5 }, red: { color: "#d2232a", roughness: 0.5 }, band: { color: "#68706d", roughness: 0.6 }, bumperGrey: { color: "#5d625d", roughness: 0.7 } }, T6_MAP);
  const m = t.m;
  // the red belt 0.7..1.6, a white line, the grey window band 1.8..3.2 (z_inc rows 28..42), the roof
  const main: Band[] = [[0, 0.7, "cream"], [0.7, 1.6, "red"], [1.6, 1.8, "cream"], [1.8, 3.2, "band"], [3.2, 3.42, "cream"], [3.42, 3.9, "roof"]];
  const cab: Band[] = [[0, 0.72, "cream"], [0.72, 0.92, "bumperGrey"], [0.92, 1.58, "red"], [1.58, 1.7, "cream"], [1.7, 1.95, "band"], [1.95, 3.25, "glass"], [3.25, 3.42, "cream"], [3.42, 3.9, "roof"]];
  const front = t.vol("front cab", T6_SECTION, T6_BODY, 0.4, 1.3, cab);
  const mid = t.vol("saloon", T6_SECTION, T6_BODY, 1.3, 14.7, main);
  const rear = t.vol("rear cab", T6_SECTION, T6_BODY, 14.7, 15.6, cab);
  m.scope("body", () => {
    m.scope("front cab", () => t.volume(front));
    m.scope("saloon", () => t.volume(mid));
    m.scope("rear cab", () => t.volume(rear));
  });
  for (const s of sides) m.scope(sideName(s), () => {
    m.scope("windows", () => t.windows(mid, s, s > 0 ? T6_RIGHT_WINDOWS : T6_LEFT_WINDOWS, { frame: "band", sash: 2.68 }));
    if (s > 0) m.scope("doors", () => t.doors(mid, s, T6_DOORS, "doorGrey", { frame: "band", sash: 1.8 }));
    m.scope("fleet number", () => t.inscription(mid, s, t.fx(s > 0 ? 6.2 : 2.4), [{ text: T6_NUMBER, y: t.fy(1.0), h: 0.16 }], 0.006, "white"));
  });
  for (const e of [1, -1]) m.scope(endName(e), () => {
    const v = e > 0 ? front : rear;
    m.scope("lamps", () => {
      for (const u of [9.5, 21.5]) t.lamp(v, e, u, 48.5, e > 0 ? 0.08 : 0.06, e > 0 ? "lampHead" : "lampRed");
    });
  });
  m.scope("roof equipment", () => {
    m.scope("pantographs", () => m.scope("pantograph", () => t.singleArm(t.fx(4.9), t.fx(4.4), -1, t.fy(3.5), TRAM_WIRE)));
    m.scope("equipment box", () => t.roofBox("roofBox", 8.9, 12.4, 3.48, 3.8, 0.7, 0.1));
    m.scope("vents", () => {
      for (const [a, b] of [[2.7, 3.7], [7.4, 8.4], [12.6, 13.6]] as const) t.roofBox("roofBox", a, b, 3.48, 3.6, 0.4, 0.03);
    });
  });
  m.scope("running gear", () => {
    for (const [i, x] of [4.5, 11.2].entries()) m.scope(`bogie ${i + 1}`, () => t.tramBogie(x, 1.9, TRAM_WHEEL_R, t.fy(0.7)));
    m.scope("couplers", () => {
      t.coupler(1, t.fx(0.7), t.fx(0), t.fy(0.6));
      t.coupler(-1, t.fx(15.3), t.fx(16), t.fy(0.6));
    });
  });
  return m;
}

// ---------------------------------------------------------------------------
// Tatra KT8D5: three sections on two end bogies and two bogies under the joints
// ---------------------------------------------------------------------------

export type Kt8Livery = "redWhite" | "red" | "modern";

export const KT8_PARAMS: readonly ParamSpec[] = [{
  name: "livery",
  title: "Livery",
  values: [
    { value: "redWhite", title: "Red and white" },
    { value: "red", title: "All red" },
    { value: "modern", title: "Modern (grey window band)" },
  ],
  default: "redWhite",
}];

/**
 * tram_ckd_kt8 (29 by 6 m side canvas) onto the published 30.3 m length over
 * the bodies, 2.48 m width and 3.145 m height (assets/tatra-kt8/SOURCES.md).
 */
export const KT8_MAP: TramMap = { c: 14.15, kx: 30.3 / 27.3, ky: 3.145 / 3.4, kz: 2.48 / 2.4, side: 6, end: 4 };

const KT8_SECTION: Pt[] = [[-1.2, 0], [1.2, 0], [1.2, 3.2], [1.1, 3.3], [0.9, 3.4], [-0.9, 3.4], [-1.1, 3.3], [-1.2, 3.2]];
/** The three bodies (source x), front first, and their profiles from the XML. */
export const KT8_BODIES: Array<[number, number]> = [[0.5, 10.5], [11.2, 17.1], [17.8, 27.8]];
const KT8_BODY: SourceVolume = {
  plan: [[0.5, 0.85], [1.3, 1.1], [2.9, 1.2], [25.4, 1.2], [27, 1.1], [27.8, 0.8]],
  top: [[0.5, 1.9], [0.9, 3.4], [27.4, 3.4], [27.8, 1.8]],
  bottom: [[0.5, 0.7], [0.7, 0.55], [1.1, 0.4], [3.1, 0.4], [3.4, 0.7], [5.6, 0.7], [5.9, 0.4], [9.4, 0.4], [9.7, 0.7], [11.9, 0.7], [12.2, 0.4], [16.0, 0.4], [16.3, 0.7],
    [18.5, 0.7], [18.8, 0.4], [22.4, 0.4], [22.7, 0.7], [24.9, 0.7], [25.2, 0.4], [27.2, 0.4], [27.6, 0.55], [27.8, 0.7]],
};
/** The bogies (source x): one under each outer section, two under the middle one at the joints. */
export const KT8_BOGIES = [4.45, 10.85, 17.35, 23.85];
export const KT8_NUMBER = "9009";

/** Both sides alike (the native z_inc and z_dec agree): five doors, the outer two narrower. */
const KT8_DOORS: Array<{ box: PxBox; lights: PxBox[] }> = [
  { u: 16, n: 3 }, { u: 66, n: 4 }, { u: 133, n: 4 }, { u: 199, n: 4 }, { u: 254, n: 3 },
].map(({ u, n }) => ({ box: [u, 30, u + 4 * n + 1, 56], lights: Array.from({ length: n }, (_, k): PxBox => [u + 1 + 4 * k, 31, u + 4 + 4 * k, 51]) }));
const KT8_WINDOWS: PxBox[] = [[34, 30, 48, 41], [49, 30, 63, 41], [85, 30, 99, 41], [117, 30, 131, 41], [152, 30, 166, 41], [183, 30, 197, 41], [219, 30, 233, 41], [234, 30, 248, 41]];

interface Kt8Paint {
  skirt: string;
  belt: string;
  upper: string;
  band: string;
  door: string;
  frame: string;
  colors: Record<string, string>;
}

const KT8_LIVERIES: Record<Kt8Livery, Kt8Paint> = {
  redWhite: { skirt: "white", belt: "red", upper: "white", band: "white", door: "white", frame: "frame", colors: { red: "#d52128" } },
  red: { skirt: "red", belt: "red", upper: "red", band: "red", door: "red", frame: "darkRed", colors: { red: "#cd1f27", darkRed: "#7e1015" } },
  modern: { skirt: "white", belt: "red", upper: "white", band: "band", door: "white", frame: "frame", colors: { red: "#d52128", band: "#7b827b" } },
};

export function tatraKt8(params?: ParamValues): MeshBuilder {
  const livery = resolveParams(KT8_PARAMS, params).livery as Kt8Livery;
  const P = KT8_LIVERIES[livery];
  const t = new Tram({ ...Object.fromEntries(Object.entries(P.colors).map(([k, c]) => [k, { color: c, roughness: 0.5 }])), darkGrey: { color: "#46494c", roughness: 0.7 } }, KT8_MAP);
  const m = t.m;
  // the belt 0.9..1.8, the window band 1.85..3.15 (grey in the modern livery)
  const main: Band[] = [[0, 0.9, P.skirt], [0.9, 1.8, P.belt], [1.8, 1.88, P.upper], [1.88, 3.15, P.band], [3.15, 3.3, P.upper], [3.3, 3.6, "roof"]];
  const cab: Band[] = [[0, 0.9, "darkGrey"], [0.9, 1.8, P.belt], [1.8, 1.9, P.upper], [1.9, 3.18, "glass"], [3.18, 3.3, P.upper], [3.3, 3.6, "roof"]];
  const ranges = KT8_BODIES;
  const inside = (x: number, [a, b]: [number, number]) => x >= a - 0.05 && x <= b + 0.05;
  const sectionDraw = (i: number) => () => {
    const [a, b] = ranges[i]!;
    const vols: Volume[] = [];
    if (i === 0) vols.push(t.vol("front cab", KT8_SECTION, KT8_BODY, a, 1.4, cab), t.vol("saloon", KT8_SECTION, KT8_BODY, 1.4, b, main));
    else if (i === 2) vols.push(t.vol("saloon", KT8_SECTION, KT8_BODY, a, 26.9, main), t.vol("rear cab", KT8_SECTION, KT8_BODY, 26.9, b, cab));
    else vols.push(t.vol("saloon", KT8_SECTION, KT8_BODY, a, b, main));
    const saloon = vols.find((v) => v.name === "saloon")!;
    m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
    for (const s of sides) m.scope(sideName(s), () => {
      const own = (bx: PxBox) => inside(bx[0] / 10, [a, b]) && inside(bx[2] / 10, [a, b]);
      m.scope("windows", () => t.windows(saloon, s, KT8_WINDOWS.filter(own), { frame: P.frame, sash: 2.5 }));
      m.scope("doors", () => t.doors(saloon, s, KT8_DOORS.filter((d) => own(d.box)), P.door, { frame: P.frame, sash: 1.82 }));
      if (i === 1) m.scope("fleet number", () => t.inscription(saloon, s, t.fx(12.4), [{ text: KT8_NUMBER, y: t.fy(1.05), h: 0.16 }], 0.006, livery === "red" ? "white" : "marking"));
    });
    for (const e of [1, -1]) {
      if ((e > 0 && i !== 0) || (e < 0 && i !== 2)) continue;
      const v = vols[e > 0 ? 0 : 1]!;
      m.scope(endName(e), () => {
        m.scope("lamps", () => {
          for (const u of [9.5, 20.5]) t.lamp(v, e, u, 27.5, e > 0 ? 0.08 : 0.06, e > 0 ? "lampHead" : "lampRed");
        });
        m.scope("coupler", () => t.coupler(e, t.fx(e > 0 ? 0.9 : 27.4), t.fx(e > 0 ? 0 : 28.3), t.fy(0.6)));
      });
    }
    m.scope("roof equipment", () => {
      if (i === 0) {
        m.scope("pantographs", () => m.scope("pantograph", () => t.diamond(t.fx(3.75), t.fy(3.4), TRAM_WIRE)));
        m.scope("equipment box", () => t.roofBox("roofBox", livery === "modern" ? 3.1 : 5.8, 10.3, 3.38, 3.7, 0.7, 0.1));
        m.scope("route box", () => t.roofBox("roofBox", 1.1, 1.6, 3.38, 3.8, 0.3, 0.03));
      }
      if (i === 2) {
        // the second collector, folded down (one raised per tram)
        m.scope("pantographs", () => m.scope("pantograph (folded)", () => t.diamond(t.fx(24.55), t.fy(3.4), t.fy(3.4) + 0.62)));
        m.scope("equipment box", () => t.roofBox("roofBox", 18, livery === "modern" ? 25.2 : 22.5, 3.38, 3.7, 0.7, 0.1));
        m.scope("route box", () => t.roofBox("roofBox", 26.7, 27.2, 3.38, 3.8, 0.3, 0.03));
      }
    });
    m.scope("running gear", () => {
      KT8_BOGIES.forEach((x, k) => {
        const own = i === 1 ? k === 1 || k === 2 : i === 0 ? k === 0 : k === 3;
        // the middle section draws the two bogies under the joints, each carrying both its neighbours
        const carries = k === 1 ? [0, 1] : k === 2 ? [1, 2] : undefined;
        if (own) m.scope(`bogie ${k + 1}`, () => m.bogie(() => t.tramBogie(x, 1.9, TRAM_WHEEL_R, t.fy(0.7)), carries ? { sections: carries } : {}));
      });
    });
  };
  const sections = ranges.map(([a, b], i) => ({ x0: t.fx(b), x1: t.fx(a), draw: sectionDraw(i) }));
  const hw = 1.12 * KT8_MAP.kz;
  articulate(t, sections, t.fy(0.9), {
    profile: [[-hw, t.fy(0.75)], [hw, t.fy(0.75)], [hw, t.fy(3.15)], [hw - 0.2, t.fy(3.3)], [-hw + 0.2, t.fy(3.3)], [-hw, t.fy(3.15)]],
    folds: 4,
    depth: 0.045,
  }, 40);
  return m;
}

// ---------------------------------------------------------------------------
// Tatra KT4: two sections, each on one bogie, joined by a short bellows
// ---------------------------------------------------------------------------

/**
 * tram_ckd_kt4 (22 by 4 m side canvas) onto the published 18.11 m body, 2.2 m
 * width and 3.1 m height (assets/tatra-kt4/SOURCES.md).
 */
export const KT4_MAP: TramMap = { c: 11.1, kx: 18.11 / 21.2, ky: 3.1 / 3.25, kz: 1, side: 4, end: 4 };

/** The XML section: sides bulging to 1.1 m at the belt, a pitched roof cut flat at 3.2 m. */
const KT4_SECTION: Pt[] = [[-1, 0.3], [1, 0.3], [1.1, 1.7], [0.9, 3.1], [0.2, 3.5], [-0.2, 3.5], [-0.9, 3.1], [-1.1, 1.7]];
export const KT4_BODIES: Array<[number, number]> = [[0.5, 10.6], [11.5, 21.7]];
const KT4_BODY: SourceVolume = {
  plan: [[0.5, 0.45], [1, 0.9], [1.8, 1.1], [20, 1.1], [21, 0.9], [21.7, 0.45]],
  top: [[0.5, 1.9], [0.8, 3.2], [21.3, 3.2], [21.7, 1.9]],
  bottom: [[0.5, 1.0], [0.8, 0.5], [4.3, 0.5], [4.5, 0.8], [7.0, 0.8], [7.2, 0.5], [14.6, 0.5], [14.8, 0.8], [17.6, 0.8], [17.8, 0.5], [21.4, 0.5], [21.7, 1.0]],
};
/** One bogie under the middle of each section (source x). */
export const KT4_BOGIES = [5.75, 16.2];

const KT4_RIGHT_WINDOWS: PxBox[] = [[12, 10, 18, 23], [39, 10, 58, 23], [59, 10, 78, 23], [99, 10, 105, 23], [116, 10, 122, 23], [143, 10, 162, 23], [163, 10, 182, 23], [204, 10, 210, 23]];
const KT4_LEFT_WINDOWS: PxBox[] = [[12, 10, 18, 23], [19, 10, 38, 23], [39, 10, 58, 23], [59, 10, 78, 23], [79, 10, 98, 23], [99, 10, 105, 23],
  [116, 10, 122, 23], [123, 10, 142, 23], [143, 10, 162, 23], [163, 10, 182, 23], [183, 10, 202, 23], [204, 10, 210, 23]];
/** Four four-leaf folding doors on the right (z_inc); the KT4 is single-ended. */
const KT4_DOORS: Array<{ box: PxBox; lights: PxBox[] }> = [20, 80, 124, 184].map((u) => ({
  box: [u, 10, u + 17, 35],
  lights: [0, 4, 8, 12].map((d): PxBox => [u + 1 + d, 14, u + 4 + d, 31]),
}));

export function tatraKt4(): MeshBuilder {
  const t = new Tram({ red: { color: "#d8232a", roughness: 0.5 } }, KT4_MAP);
  const m = t.m;
  // white with a red belt 0.8..1.5 and grey window surrounds
  const main: Band[] = [[0, 0.8, "white"], [0.8, 1.5, "red"], [1.5, 3.12, "white"], [3.12, 3.6, "roof"]];
  const cab: Band[] = [[0, 0.8, "white"], [0.8, 1.5, "red"], [1.5, 1.78, "white"], [1.78, 3.02, "glass"], [3.02, 3.12, "white"], [3.12, 3.6, "roof"]];
  const inside = (x: number, [a, b]: [number, number]) => x >= a - 0.05 && x <= b + 0.05;
  const sectionDraw = (i: number) => () => {
    const [a, b] = KT4_BODIES[i]!;
    const vols: Volume[] = i === 0
      ? [t.vol("front cab", KT4_SECTION, KT4_BODY, a, 1.15, cab), t.vol("saloon", KT4_SECTION, KT4_BODY, 1.15, b, main)]
      : [t.vol("saloon", KT4_SECTION, KT4_BODY, a, 21.05, main), t.vol("rear cab", KT4_SECTION, KT4_BODY, 21.05, b, cab)];
    const saloon = vols.find((v) => v.name === "saloon")!;
    m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
    for (const s of sides) m.scope(sideName(s), () => {
      const own = (bx: PxBox) => inside(bx[0] / 10, [a, b]) && inside(bx[2] / 10, [a, b]);
      m.scope("windows", () => t.windows(saloon, s, (s > 0 ? KT4_RIGHT_WINDOWS : KT4_LEFT_WINDOWS).filter(own), { frame: "frame", sash: 2.35 }));
      if (s > 0) m.scope("doors", () => t.doors(saloon, s, KT4_DOORS.filter((d) => own(d.box)), "white", { frame: "frame", sash: 1.6 }));
    });
    const e = i === 0 ? 1 : -1;
    const v = vols[i === 0 ? 0 : 1]!;
    m.scope(endName(e), () => {
      m.scope("lamps", () => {
        for (const u of [6.5, 23.5]) t.lamp(v, e, u, 29, e > 0 ? 0.08 : 0.06, e > 0 ? "lampHead" : "lampRed");
      });
      m.scope("coupler", () => t.coupler(e, t.fx(e > 0 ? 0.9 : 21.3), t.fx(e > 0 ? 0 : 22), t.fy(0.65)));
    });
    m.scope("roof equipment", () => {
      if (i === 0) {
        m.scope("pantographs", () => m.scope("pantograph", () => t.diamond(t.fx(5.75), t.fy(3.2), TRAM_WIRE, { reach: 1.1 })));
        for (const [a0, a1] of [[2.5, 3.0], [8.6, 9.3]] as const) m.scope("vent", () => t.roofBox("roofBox", a0, a1, 3.18, 3.3, 0.3, 0.03));
      } else {
        m.scope("resistor box", () => t.roofBox("roofBox", 16.3, 17.7, 3.18, 3.6, 0.5, 0.06));
        for (const [a0, a1] of [[12.8, 13.5], [19.2, 19.7]] as const) m.scope("vent", () => t.roofBox("roofBox", a0, a1, 3.18, 3.3, 0.3, 0.03));
      }
    });
    m.scope("running gear", () => m.scope("bogie", () => t.tramBogie(KT4_BOGIES[i]!, 1.9, TRAM_WHEEL_R, t.fy(0.8))));
  };
  const sections = KT4_BODIES.map(([a, b], i) => ({ x0: t.fx(b), x1: t.fx(a), draw: sectionDraw(i) }));
  articulate(t, sections, t.fy(0.9), {
    profile: [[-1.0, t.fy(0.6)], [1.0, t.fy(0.6)], [1.04, t.fy(1.7)], [0.85, t.fy(3.05)], [-0.85, t.fy(3.05)], [-1.04, t.fy(1.7)]],
    folds: 4,
    depth: 0.04,
  }, 40);
  return m;
}

// ---------------------------------------------------------------------------
// GT4: two sections, each on one bogie, the short joint between them
// ---------------------------------------------------------------------------

/**
 * tram_kvag_gt4 draws one rigid 14.1 m car (vlakosimdb couples two of them);
 * the model is the articulated Esslingen GT4 at its published 18.8 m over the
 * couplings, 2.2 m width and 10.0 m between the bogie pivots, in the drawing's
 * cream and red. The drawing's middle door moves to just behind the joint
 * (assets/gt4/SOURCES.md).
 */
export const GT4_MAP: TramMap = { c: 7.25, kx: 18.2 / 14.1, ky: 3.3 / 3.6, kz: 2.2 / 2.4, side: 4, end: 4 };

const GT4_SECTION: Pt[] = [[-1.2, 0], [1.2, 0], [1.2, 1.8], [1.05, 3.1], [0.75, 3.5], [-0.75, 3.5], [-1.05, 3.1], [-1.2, 1.8]];
/** The two bodies (source x), the joint 7.1..7.4 between them. */
export const GT4_BODIES: Array<[number, number]> = [[0.3, 7.1], [7.4, 14.4]];
const GT4_BODY: SourceVolume = {
  plan: [[0.3, 0.45], [0.7, 0.95], [1.7, 1.2], [13.0, 1.2], [14.0, 0.95], [14.4, 0.45]],
  top: [[0.3, 1.8], [0.5, 2.6], [0.6, 3.2], [0.9, 3.35], [13.8, 3.35], [14.4, 2.9]],
  bottom: [[0.3, 0.6], [0.6, 0.4], [2.3, 0.4], [2.45, 0.65], [4.35, 0.65], [4.5, 0.4], [10.0, 0.4], [10.15, 0.65], [12.15, 0.65], [12.3, 0.4], [14.1, 0.4], [14.4, 0.6]],
};
/** The bogies (source x), one under each section, 10.0 m apart in the model. */
export const GT4_BOGIES = [3.4, 11.15];

const GT4_RIGHT_WINDOWS: PxBox[] = [[25, 13, 46, 23], [46, 13, 61, 23], [61, 13, 70, 23], [92, 13, 107, 23], [107, 13, 123, 23]];
const GT4_LEFT_WINDOWS: PxBox[] = [[10, 13, 23, 23], [27, 13, 39, 23], [39, 13, 51, 23], [51, 13, 63, 23], [63, 13, 70, 23], [75, 13, 87, 23], [87, 13, 99, 23], [99, 13, 111, 23], [111, 13, 123, 23], [127, 13, 139, 23]];
/** Three double folding doors on the right only (the GT4 is single-ended). */
const GT4_DOORS: Array<{ box: PxBox; lights: PxBox[] }> = [8, 75, 123].map((u) => ({
  box: [u, 12, u + 17, 37],
  lights: [[u + 1, 13, u + 8, 33], [u + 9, 13, u + 16, 33]],
}));

export function gt4Tram(): MeshBuilder {
  const t = new Tram({ cream: { color: "#f3edc8", roughness: 0.5 }, red: { color: "#d8232a", roughness: 0.5 }, doorFrame: { color: "#7d7d7d", roughness: 0.6 } }, GT4_MAP);
  const m = t.m;
  // cream with two red lines, at 0.6..0.7 and 1.4..1.6 (z_inc rows 33 and 24..25)
  const lower: Band[] = [[0, 0.6, "cream"], [0.6, 0.7, "red"], [0.7, 1.4, "cream"], [1.4, 1.6, "red"]];
  const main: Band[] = [...lower, [1.6, 3.1, "cream"], [3.1, 3.7, "roof"]];
  const cab: Band[] = [...lower, [1.6, 1.75, "cream"], [1.75, 2.75, "glass"], [2.75, 3.1, "cream"], [3.1, 3.7, "roof"]];
  const inside = (x: number, [a, b]: [number, number]) => x >= a - 0.05 && x <= b + 0.05;
  const sectionDraw = (i: number) => () => {
    const [a, b] = GT4_BODIES[i]!;
    const vols: Volume[] = i === 0
      ? [t.vol("front cab", GT4_SECTION, GT4_BODY, a, 0.8, cab), t.vol("saloon", GT4_SECTION, GT4_BODY, 0.8, b, main)]
      : [t.vol("saloon", GT4_SECTION, GT4_BODY, a, 14.0, main), t.vol("rear end", GT4_SECTION, GT4_BODY, 14.0, b, cab)];
    const saloon = vols.find((v) => v.name === "saloon")!;
    m.scope("body", () => vols.forEach((v) => m.scope(v.name, () => t.volume(v))));
    for (const s of sides) m.scope(sideName(s), () => {
      const own = (bx: PxBox) => inside(bx[0] / 10, [a, b]) && inside(bx[2] / 10, [a, b]);
      m.scope("windows", () => t.windows(saloon, s, (s > 0 ? GT4_RIGHT_WINDOWS : GT4_LEFT_WINDOWS).filter(own), { frame: "doorFrame", sash: 2.25 }));
      if (s > 0) m.scope("doors", () => t.doors(saloon, s, GT4_DOORS.filter((d) => own(d.box)), "cream", { frame: "doorFrame", sash: 1.7 }));
    });
    const e = i === 0 ? 1 : -1;
    const v = vols[i === 0 ? 0 : 1]!;
    m.scope(endName(e), () => {
      m.scope("lamps", () => {
        for (const u of [8, 22]) t.lamp(v, e, u, 28.5, e > 0 ? 0.07 : 0.055, e > 0 ? "lampHead" : "lampRed");
      });
      m.scope("coupler", () => t.coupler(e, t.fx(e > 0 ? 0.7 : 13.85), t.fx(e > 0 ? 0.07 : 14.63), t.fy(0.6)));
    });
    m.scope("roof equipment", () => {
      // the raised ventilator strip along each section's roof
      m.scope("ventilator", () => t.roofBox("roofBox", i === 0 ? 2.0 : 7.7, i === 0 ? 6.9 : 9.4, 3.3, 3.6, 0.45, 0.05));
      if (i === 0) m.scope("pantographs", () => m.scope("pantograph", () => t.diamond(t.fx(4.0), t.fy(3.5), TRAM_WIRE, { reach: 1.05, frameZ: 0.33 })));
    });
    m.scope("running gear", () => m.scope("bogie", () => t.tramBogie(GT4_BOGIES[i]!, 1.7, TRAM_WHEEL_R, t.fy(0.65))));
  };
  const sections = GT4_BODIES.map(([a, b], i) => ({ x0: t.fx(b), x1: t.fx(a), draw: sectionDraw(i) }));
  const hw = 1.12 * GT4_MAP.kz;
  articulate(t, sections, t.fy(0.95), {
    profile: [[-hw, t.fy(0.55)], [hw, t.fy(0.55)], [hw, t.fy(1.8)], [hw * 0.86, t.fy(3.05)], [-hw * 0.86, t.fy(3.05)], [-hw, t.fy(1.8)]],
    folds: 2,
    depth: 0.035,
  }, 35);
  return m;
}

// ---------------------------------------------------------------------------

/** One design's assets folder and builder. */
interface TramDesign {
  id: string;
  title: string;
  folder: string;
  build: (params?: ParamValues) => MeshBuilder;
  params?: readonly ParamSpec[];
}

export const TRAM_DESIGN_LIST: readonly TramDesign[] = [
  { id: "proc-vehicle-tatra-t3", title: "Tatra T3", folder: "tatra-t3", build: tatraT3, params: T3_PARAMS },
  { id: "proc-vehicle-tatra-t6", title: "Tatra T6A5", folder: "tatra-t6", build: tatraT6 },
  { id: "proc-vehicle-tatra-kt8", title: "Tatra KT8D5", folder: "tatra-kt8", build: tatraKt8, params: KT8_PARAMS },
  { id: "proc-vehicle-tatra-kt4", title: "Tatra KT4", folder: "tatra-kt4", build: tatraKt4 },
  { id: "proc-vehicle-kvag-gt4", title: "GT4", folder: "gt4", build: gt4Tram },
];

export const TRAM_DESIGNS: ProceduralDesign[] = TRAM_DESIGN_LIST.map((d) => ({
  id: d.id, title: d.title, build: d.build, catalog: TRAM_CATALOG, references: d.folder, ...(d.params ? { params: d.params } : {}),
}));

