// The North American hood units: the EMD GP9 (1954) and SD40-2 (1972) road
// switchers and the modern six-axle freight units, the GE ES44AC (2005) and EMD
// SD70ACe (2004). Drawn at their real size by the hood unit kit (usHoodKit.ts)
// to the US loading gauge (loadingGauge.ts), each with a `livery` parameter of
// railroad paint schemes. Registered in generate.ts as one family: a design's JS
// model imports its builder by name from this module. See docs/models/us-diesels.md.

import type { GameProperties, ParamSpec, ParamValues, ProceduralDesign } from "./design.ts";
import { resolveParams } from "./design.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { DIESEL_LOCO_CATALOG } from "./cd163.ts";
import { paint } from "./dieselParts.ts";
import { buildUsHood, usHoodLod, type Band, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";
import { GP9_PAINT, buildGp9, gp9Lod, type Gp9Livery } from "./usGp9.ts";

const ft = (feet: number, inches = 0) => Math.round((feet * 0.3048 + inches * 0.0254) * 1000) / 1000;

// ---------------------------------------------------------------------------
// Measures (published figures; docs/models/us-diesels.md)

// The GP9 itself is drawn from photographs by usGp9.ts (GP9_BODY); this spec keeps the
// first, kit-drawn measures that the WDM-2 (inLocos.ts) is built on.
const GP9_LENGTH = ft(56, 2); // 17.12 m over the couplers
export const GP9_SPEC: UsHoodSpec = {
  length: GP9_LENGTH, endSill: 8.0, deck: 1.55, sillBottom: 1.15, deckHalf: 1.56,
  hood: { x0: -7.75, x1: 3.0, half: 1.08, top: ft(13, 11), r: 0.2 },
  front: { kind: "highHood", x0: 5.45, x1: 7.75 },
  cab: { x0: 3.0, x1: 5.45, half: 1.53, top: ft(14, 6), kind: "classic" },
  radiator: { x0: -7.45, x1: -5.65, kind: "grilles", fans: [-6.95, -6.05], fanR: 0.44 },
  exhaustX: 0.9,
  trucks: {
    centre: ft(31) / 2, sideFrame: "blomberg",
    spec: { axles: [-ft(4, 6), ft(4, 6)], wheelR: ft(0, 20), frameHalf: 2.0, frameTop: 1.0, frameBottom: 0.62, frameZ: [0.92, 1.06], primary: "coil", secondary: [-0.45, 0.45], secondaryZ: 1.12, bolster: 1.15 },
  },
  tank: { x0: -2.5, x1: 2.5, y0: 0.6, half: 1.25 },
  ditchLights: false,
};

const SD40_LENGTH = ft(68, 10); // 20.98 m
export const SD40_SPEC: UsHoodSpec = {
  length: SD40_LENGTH, endSill: 9.9, deck: 1.6, sillBottom: 1.2, deckHalf: 1.56,
  hood: { x0: -9.65, x1: 4.95, half: 1.07, top: 4.5, r: 0.2 },
  front: { kind: "lowNose", x0: 7.45, x1: 9.65, top: 3.3 },
  cab: { x0: 4.95, x1: 7.45, half: 1.52, top: ft(14, 8.7), kind: "classic" },
  radiator: { x0: -9.35, x1: -5.6, kind: "grilles", fans: [-8.9, -7.75, -6.6], fanR: 0.46 },
  blister: { x0: 2.2, x1: 4.4, top: ft(15, 1.2), half: 1.0 },
  exhaustX: -1.2,
  trucks: {
    centre: ft(40) / 2, sideFrame: "htc",
    spec: { axles: [-ft(6, 9.5), 0, ft(6, 9.5)], wheelR: ft(0, 20), frameHalf: 2.75, frameTop: 1.05, frameBottom: 0.62, frameZ: [0.92, 1.06], primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.12, bolster: 1.2 },
  },
  tank: { x0: -3.2, x1: 2.2, y0: 0.45, half: 1.4 },
  ditchLights: false,
};

const ES44_LENGTH = ft(73, 2); // 22.30 m
export const ES44_SPEC: UsHoodSpec = {
  length: ES44_LENGTH, endSill: 10.6, deck: 1.6, sillBottom: 1.2, deckHalf: 1.58,
  hood: { x0: -10.4, x1: 5.4, half: 1.1, top: 4.5, r: 0.18 },
  front: { kind: "wideNose", x0: 8.0, x1: 9.75, top: 3.25, half: 1.5 },
  cab: { x0: 5.4, x1: 8.0, half: 1.55, top: ft(15, 5), kind: "wide" },
  radiator: { x0: -10.4, x1: -6.6, kind: "flared", half: 1.48, top: ft(15, 5), fans: [-9.4, -7.6], fanR: 0.62 },
  blister: { x0: 2.6, x1: 5.3, top: 4.62, half: 1.1 },
  exhaustX: -2.5,
  trucks: {
    centre: ft(53) / 2, sideFrame: "hiad",
    spec: { axles: [-ft(6, 9.5), 0, ft(6, 9.5)], wheelR: ft(0, 21), frameHalf: 2.8, frameTop: 1.1, frameBottom: 0.64, frameZ: [0.92, 1.06], primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.12, bolster: 1.2 },
  },
  tank: { x0: -5.1, x1: 3.0, y0: 0.42, half: 1.45 },
  ditchLights: true,
};

const SD70_LENGTH = ft(74, 3); // 22.63 m
export const SD70_SPEC: UsHoodSpec = {
  length: SD70_LENGTH, endSill: 10.78, deck: 1.6, sillBottom: 1.2, deckHalf: 1.58,
  hood: { x0: -10.55, x1: 5.6, half: 1.1, top: 4.5, r: 0.18 },
  front: { kind: "wideNose", x0: 8.2, x1: 9.9, top: 3.25, half: 1.5 },
  cab: { x0: 5.6, x1: 8.2, half: 1.55, top: 4.72, kind: "wide" },
  radiator: { x0: -10.55, x1: -6.3, kind: "flared", half: 1.5, top: ft(15, 11), fans: [-9.5, -7.4], fanR: 0.6 },
  blister: { x0: 1.0, x1: 3.6, top: 4.62, half: 1.05 },
  exhaustX: -1.8,
  trucks: {
    centre: ft(47, 10) / 2, sideFrame: "htc",
    spec: { axles: [-ft(6, 9.5), 0, ft(6, 9.5)], wheelR: ft(0, 21), frameHalf: 2.8, frameTop: 1.1, frameBottom: 0.64, frameZ: [0.92, 1.06], primary: "coil", secondary: [-1.0, 1.0], secondaryZ: 1.12, bolster: 1.2 },
  },
  tank: { x0: -4.3, x1: 3.0, y0: 0.42, half: 1.45 },
  ditchLights: true,
};

// ---------------------------------------------------------------------------
// Paint schemes: simplified railroad schemes (colour fields, stripes and the
// railroad's name in plain letters; no heralds or logos)

const P = {
  upYellow: paint("#f4b92a"), upGrey: paint("#9fa2a3"), upRed: paint("#b5202b"),
  prrGreen: paint("#1e2d24"), prrBuff: paint("#d6b768"),
  atsfBlue: paint("#1f3d7a"), atsfYellow: paint("#f1c21c"),
  bnGreen: paint("#2c6e3f"), bnBlack: paint("#202224"), bnWhite: paint("#eeeeea"),
  crBlue: paint("#1b4f9a"), crWhite: paint("#f2f2ee"),
  bnsfOrange: paint("#e8661f"), bnsfBlack: paint("#1f2022"), bnsfYellow: paint("#f2c31a"),
  csxBlue: paint("#1c2c57"), csxYellow: paint("#f6c51b"), csxGrey: paint("#8c8f92"),
  nsBlack: paint("#191a1c"), nsWhite: paint("#efefeb"),
  truckGrey: paint("#4c4e50", 0.8), truckBlack: paint("#242527", 0.85),
};
const pick = (...names: Array<keyof typeof P>) => Object.fromEntries(names.map((n) => [n, P[n]]));

/** Union Pacific: armour yellow, a red pinstripe under the harbour mist grey hood top, grey frame and trucks. */
function unionPacific(s: UsHoodSpec, number: string): UsLivery {
  const t = s.hood.top;
  const body: Band[] = [[0, t - 0.44, "upYellow"], [t - 0.44, t - 0.38, "upRed"], [t - 0.38, 9, "upGrey"]];
  return {
    title: "Union Pacific", railroad: "UNION PACIFIC", letterH: 0.42, letterY: 1.25, number,
    palette: pick("upYellow", "upGrey", "upRed", "truckGrey"),
    body, cab: [[0, s.cab.top - 0.18, "upYellow"], [s.cab.top - 0.18, 9, "upGrey"]], roof: "upGrey",
    frame: "upGrey", sillStripe: [0.05, 0.13, "upRed"], trucks: "truckGrey", pilot: "upGrey",
    letter: "upRed", numberMat: "upRed", rails: "upYellow", noseStripes: "upRed",
  };
}

function burlingtonNorthern(s: UsHoodSpec, number: string): UsLivery {
  return {
    title: "BN Cascade", railroad: "BURLINGTON NORTHERN", letterH: 0.36, letterY: 1.3, number,
    palette: pick("bnGreen", "bnBlack", "bnWhite", "truckBlack"),
    body: [[0, s.hood.top - 0.12, "bnGreen"], [s.hood.top - 0.12, 9, "bnBlack"]],
    cab: [[0, s.cab.top - 0.12, "bnGreen"], [s.cab.top - 0.12, 9, "bnBlack"]], roof: "bnBlack",
    frame: "bnBlack", trucks: "truckBlack", pilot: "bnGreen", letter: "bnWhite", numberMat: "bnWhite", rails: "bnWhite", noseStripes: "bnWhite",
  };
}

function conrail(number: string): UsLivery {
  return {
    title: "Conrail", railroad: "CONRAIL", letterH: 0.55, letterY: 1.15, number,
    palette: pick("crBlue", "crWhite", "truckBlack"),
    body: [[0, 9, "crBlue"]], roof: "crBlue", frame: "crBlue", sillStripe: [0.05, 0.1, "crWhite"],
    trucks: "truckBlack", pilot: "crBlue", letter: "crWhite", numberMat: "crWhite", rails: "crWhite", noseStripes: "crWhite",
  };
}

/** BNSF orange: orange body, a yellow pinstripe under the black hood top, the yellow sill stripe. */
function bnsf(s: UsHoodSpec, number: string): UsLivery {
  const t = s.hood.top;
  return {
    title: "BNSF", railroad: "BNSF", letterH: 0.85, letterY: 0.45, number,
    palette: pick("bnsfOrange", "bnsfBlack", "bnsfYellow", "truckBlack"),
    body: [[0, t - 0.75, "bnsfOrange"], [t - 0.75, t - 0.69, "bnsfYellow"], [t - 0.69, 9, "bnsfBlack"]],
    cab: [[0, s.cab.top - 1.12, "bnsfOrange"], [s.cab.top - 1.12, s.cab.top - 1.06, "bnsfYellow"], [s.cab.top - 1.06, 9, "bnsfBlack"]],
    ends: [[0, s.cab.top - 1.12, "bnsfOrange"], [s.cab.top - 1.12, 9, "bnsfBlack"]], roof: "bnsfBlack",
    frame: "bnsfBlack", sillStripe: [0.04, 0.11, "bnsfYellow"], trucks: "truckBlack", pilot: "bnsfBlack",
    letter: "bnsfBlack", numberMat: "bnsfYellow", rails: "bnsfYellow", noseStripes: "bnsfYellow",
  };
}

/** CSX: dark blue hood, the cab and nose in yellow, grey frame. */
function csx(number: string): UsLivery {
  return {
    title: "CSX", railroad: "CSX", letterH: 1.0, letterY: 0.45, number,
    palette: pick("csxBlue", "csxYellow", "csxGrey", "truckBlack"),
    body: [[0, 9, "csxBlue"]], cab: [[0, 9, "csxYellow"]], roof: "csxBlue", cabRoof: "csxBlue",
    frame: "csxGrey", trucks: "truckBlack", pilot: "csxGrey", letter: "csxYellow", numberMat: "csxBlue", rails: "csxYellow", noseStripes: "csxYellow",
  };
}

function norfolkSouthern(number: string): UsLivery {
  return {
    title: "Norfolk Southern", railroad: "NORFOLK SOUTHERN", letterH: 0.4, letterY: 1.25, number,
    palette: pick("nsBlack", "nsWhite", "truckBlack"),
    body: [[0, 9, "nsBlack"]], roof: "nsBlack", frame: "nsBlack", sillStripe: [0.05, 0.1, "nsWhite"],
    trucks: "truckBlack", pilot: "nsBlack", letter: "nsWhite", numberMat: "nsWhite", rails: "nsWhite", noseStripes: "nsWhite",
  };
}

type Liveries = Record<string, UsLivery>;

/** The GP9's schemes as photographed (usGp9.ts): UP 211, PRR 7048 and 7000, ATSF 2879. */
export const GP9_LIVERIES: Record<string, Gp9Livery> = GP9_PAINT;
export const SD40_LIVERIES: Liveries = {
  burlingtonNorthern: burlingtonNorthern(SD40_SPEC, "7800"),
  conrail: conrail("6450"),
  unionPacific: unionPacific(SD40_SPEC, "3800"),
};
export const ES44_LIVERIES: Liveries = {
  bnsf: bnsf(ES44_SPEC, "5800"),
  unionPacific: unionPacific(ES44_SPEC, "5348"),
  csx: csx("850"),
};
export const SD70_LIVERIES: Liveries = {
  unionPacific: unionPacific(SD70_SPEC, "8500"),
  norfolkSouthern: norfolkSouthern("1000"),
  bnsf: bnsf(SD70_SPEC, "9200"),
};

const liveryParam = (l: Liveries): ParamSpec[] => [{
  name: "livery", title: "Livery", default: Object.keys(l)[0]!,
  values: Object.entries(l).map(([value, v]) => ({ value, title: v.title })),
}];

export const GP9_PARAMS = liveryParam(GP9_LIVERIES);
export const SD40_PARAMS = liveryParam(SD40_LIVERIES);
export const ES44_PARAMS = liveryParam(ES44_LIVERIES);
export const SD70_PARAMS = liveryParam(SD70_LIVERIES);

const liveryOf = (params: readonly ParamSpec[], l: Liveries, v?: ParamValues): UsLivery => l[resolveParams(params, v).livery!]!;

export function emdGp9(params?: ParamValues): MeshBuilder {
  return buildGp9(GP9_LIVERIES[resolveParams(GP9_PARAMS, params).livery!]!);
}
export function emdGp9Lod(params?: ParamValues): MeshBuilder {
  return gp9Lod(GP9_LIVERIES[resolveParams(GP9_PARAMS, params).livery!]!);
}
export function emdSd40(params?: ParamValues): MeshBuilder {
  return buildUsHood(SD40_SPEC, liveryOf(SD40_PARAMS, SD40_LIVERIES, params));
}
export function emdSd40Lod(params?: ParamValues): MeshBuilder {
  return usHoodLod(SD40_SPEC, liveryOf(SD40_PARAMS, SD40_LIVERIES, params));
}
export function geEs44ac(params?: ParamValues): MeshBuilder {
  return buildUsHood(ES44_SPEC, liveryOf(ES44_PARAMS, ES44_LIVERIES, params));
}
export function geEs44acLod(params?: ParamValues): MeshBuilder {
  return usHoodLod(ES44_SPEC, liveryOf(ES44_PARAMS, ES44_LIVERIES, params));
}
export function emdSd70ace(params?: ParamValues): MeshBuilder {
  return buildUsHood(SD70_SPEC, liveryOf(SD70_PARAMS, SD70_LIVERIES, params));
}
export function emdSd70aceLod(params?: ParamValues): MeshBuilder {
  return usHoodLod(SD70_SPEC, liveryOf(SD70_PARAMS, SD70_LIVERIES, params));
}

// ---------------------------------------------------------------------------
// Game properties: published weight, power and the usual gearing's top speed

const GP9_GAME: GameProperties = { weight: 113, power: 1305, maxspeed: 105, accel: null };
const SD40_GAME: GameProperties = { weight: 167, power: 2237, maxspeed: 105, accel: null };
const ES44_GAME: GameProperties = { weight: 196, power: 3281, maxspeed: 121, accel: null };
const SD70_GAME: GameProperties = { weight: 185, power: 3207, maxspeed: 113, accel: null };

export const US_DIESELS: ProceduralDesign[] = [
  { id: "proc-vehicle-emd-gp9", title: "EMD GP9", build: emdGp9, buildLod: emdGp9Lod, params: GP9_PARAMS, game: GP9_GAME, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-gp9" },
  { id: "proc-vehicle-emd-sd40-2", title: "EMD SD40-2", build: emdSd40, buildLod: emdSd40Lod, params: SD40_PARAMS, game: SD40_GAME, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-sd40-2" },
  { id: "proc-vehicle-ge-es44ac", title: "GE ES44AC", build: geEs44ac, buildLod: geEs44acLod, params: ES44_PARAMS, game: ES44_GAME, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "ge-es44ac" },
  { id: "proc-vehicle-emd-sd70ace", title: "EMD SD70ACe", build: emdSd70ace, buildLod: emdSd70aceLod, params: SD70_PARAMS, game: SD70_GAME, catalog: DIESEL_LOCO_CATALOG, loadingGauge: "us", references: "emd-sd70ace" },
];
