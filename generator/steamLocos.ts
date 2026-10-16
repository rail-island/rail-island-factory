// The steam locomotives transferred from vlakosimdb (db/train/loco/steam): each
// a LocoSpec (steamLoco.ts) measured from the vehicle's model/index.xml clip
// polygons and its z_both.bmp side view (0.1 m a pixel), with wheel diameters
// and lengths checked against the class's published dimensions. A locomotive
// that runs with a tender is one design with a `unit` parameter: the locomotive
// (the default, the exported GLB) or its tender. See
// docs/models/steam-locomotives.md.
//
// Source x runs from the front buffer rearward; the model is +X forward, centred
// between the buffer heads.

import type { CatalogFields, ParamSpec, ParamValues, ProceduralDesign } from "./design.ts";
import { resolveParams } from "./design.ts";
import type { MeshBuilder } from "./meshBuilder.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import { mirrored, type Pt, type Steam } from "./steamParts.ts";

/** The catalog fields of the steam locomotives and tenders. */
export const STEAM_CATALOG: CatalogFields = {
  category: "Rail vehicles",
  group: "loco",
  traction: "steam",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};

/** A steam railcar's: a powered unit that carries passengers, filed with the units. */
export const STEAM_RAILCAR_CATALOG: CatalogFields = { ...STEAM_CATALOG, group: "unit" };

/** The `unit` parameter of a locomotive with a tender. */
export const UNIT_PARAM: ParamSpec = {
  name: "unit",
  title: "Unit",
  default: "locomotive",
  values: [
    { value: "locomotive", title: "Locomotive" },
    { value: "tender", title: "Tender" },
  ],
};

/** Thin lining strips framing a panel on a constant-section body's side. */
function liningFrame(t: Steam, sec: Pt[], s: number, x0: number, x1: number, y0: number, y1: number, w = 0.035): void {
  t.sidePanel(sec, "lining", s, x0, x1, y1 - w, y1, 0.008, 0.01);
  t.sidePanel(sec, "lining", s, x0, x1, y0, y0 + w, 0.008, 0.01);
  t.sidePanel(sec, "lining", s, x0, x0 + w, y0 + w, y1 - w, 0.008, 0.01);
  t.sidePanel(sec, "lining", s, x1 - w, x1, y0 + w, y1 - w, 0.008, 0.01);
}

// --- CSD 433.0 -----------------------------------------------------------------
//
// A 1'D1' tank locomotive, 12.12 m over buffers, 1150 mm drivers and 880 mm
// carrying wheels (vlakosimdb csd_433_0, csd_433_0#2; csd_433 is the same
// locomotive on the same texture with a simpler XML body). Measured: boiler
// x 0.7..7.3 about y 2.85 (the XML `kotel` clip), chimney x 1.1..1.9, three domes
// 1 m across at x 2.4..3.4, 3.9..4.9 and 5.5..6.5 (alongy `other`), side tanks
// x 2.2..7.3 up to 2.7, cab 7.3..9.9 to 4.0 (+ roof vent), bunker 9.9..11.3;
// wheels from the BMP: 1.5, 3.6, 5.05, 6.5, 7.95, 10.25.

export const CSD433_PARAMS: readonly ParamSpec[] = [
  {
    name: "livery",
    title: "Livery",
    default: "black",
    values: [
      { value: "black", title: "Black (csd_433_0)" },
      { value: "redLining", title: "Black with red lining (csd_433_0#2)" },
    ],
  },
];

const CAB433: Pt[] = [[1.5, 1.4], [1.5, 2.7], [1.2, 3.7], [1.0, 3.9], [0.7, 4.0]];
const TANK433: Pt[] = [[1.45, 1.76], [1.45, 2.66], [1.38, 2.72]];

export function csd433(params?: ParamValues): MeshBuilder {
  return buildLoco(csd433Spec(resolveParams(CSD433_PARAMS, params).livery!));
}

function csd433Spec(livery: string): LocoSpec {
  const tankSec = mirrored(TANK433);
  const cabSec = mirrored(CAB433);
  const spec: LocoSpec = {
    title: "CSD 433.0",
    palette: {
      paint: { color: "#202123", roughness: 0.6 },
      wheel: { color: "#4a4c50", roughness: 0.6 },
      frame: { color: "#1c1c1e", roughness: 0.7 },
    },
    heads: [0, 12.06],
    boiler: { x0: 0.7, x1: 7.3, y: 2.85, r: 0.76, smokebox: 1.3, bands: [3.55, 5.2, 6.8] },
    chimney: { x: 1.5, top: 4.3, r: 0.25 },
    domes: [{ x: 2.9, top: 4.1, r: 0.42 }, { x: 4.4, top: 4.1, r: 0.45 }, { x: 6.0, top: 4.1, r: 0.42 }],
    valves: { x: 6.85, top: 3.8 },
    handrail: { x0: 1.4, x1: 7.2, y: 3.05 },
    runningBoard: { profile: [[0.78, 1.32], [1.1, 1.76], [11.22, 1.76]], half: 1.42, valance: 0.1, valanceMat: livery === "redLining" ? "lining" : "black" },
    frame: { x0: 0.8, x1: 11.2, top: 1.72 },
    cab: {
      x0: 7.3, x1: 9.9, half: CAB433, roofY: 3.85,
      windows: [{ x0: 7.6, x1: 8.1, y0: 2.75, y1: 3.3 }, { x0: 8.45, x1: 9.35, y0: 2.75, y1: 3.4 }],
      front: [{ z0: 0.85, z1: 1.2, y0: 3.0, y1: 3.45 }, { z0: -1.2, z1: -0.85, y0: 3.0, y1: 3.45 }],
      rearWindows: [{ z0: 0.75, z1: 1.15, y0: 2.95, y1: 3.4 }, { z0: -1.15, z1: -0.75, y0: 2.95, y1: 3.4 }],
    },
    prisms: [
      { name: "side tanks", x0: 2.2, x1: 7.3, half: TANK433 },
      { name: "bunker", x0: 9.9, x1: 11.3, half: [[1.5, 1.4], [1.5, 2.7]] },
      { name: "coal box", x0: 9.95, x1: 11.25, half: [[1.0, 2.7], [1.0, 3.6]] },
    ],
    coal: { x0: 10.05, x1: 11.15, y: 3.55, half: 0.95, rise: 0.45 },
    gear: {
      wheels: [
        { x: 1.5, d: 0.9, spokes: 10, outsideBoxes: true },
        { x: 3.6, d: 1.15, spokes: 14 },
        { x: 5.05, d: 1.15, spokes: 14 },
        { x: 6.5, d: 1.15, spokes: 14 },
        { x: 7.95, d: 1.15, spokes: 14 },
        { x: 10.25, d: 0.9, spokes: 10, outsideBoxes: true },
      ],
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.95, x1: 2.9, y: 0.85, r: 0.3 }, crank: 0.285, phase: -0.6, valveGear: true }],
      cylinderZ: 1.1,
      reference: 1,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.66, 1.32, 0.7], [0.66, 1.32, -0.7]], rear: [[11.34, 1.32, 0.7], [11.34, 1.32, -0.7]] },
    number: { text: "433.049", side: [7.95, 1.95, 1.5], front: [0.62, 2.3] },
    extras: livery === "redLining"
      ? (t) => t.m.scope("lining", () => {
        for (const s of [-1, 1]) {
          liningFrame(t, tankSec, s, 2.35, 7.15, 1.88, 2.55);
          liningFrame(t, cabSec, s, 7.45, 11.15, 1.55, 2.55);
        }
      })
      : undefined,
  };
  return spec;
}


const WHITE: Record<string, { color: string; roughness: number }> = { lining: { color: "#e8e6df", roughness: 0.6 } };

/** A design with a `unit` parameter: the locomotive (default) or its tender. */
function withTender(loco: () => LocoSpec, tender: () => LocoSpec, params?: ParamValues): MeshBuilder {
  return buildLoco(resolveParams([UNIT_PARAM], params).unit === "tender" ? tender() : loco());
}

// --- CSD 456.0 -----------------------------------------------------------------
//
// A 1'D2' tank locomotive (vlakosimdb csd_456_0). Boiler x 1.0..9.8 about
// y 2.55 (`kotel`), a box under the smokebox (`pr`), side tanks 3.3..9.8 to 2.4
// (`pas`), cab 9.8..12.4 to 3.6, bunker 12.4..14.3 with coal to 3.8, chimney
// x 2.0..2.8 and one long dome casing 4.1..6.1 (`k1`, `k2`). The texture blurs
// the coupled wheels: four at 1.55 m spacing between the BMP's 3.8 and 9.8 m,
// the carrying wheels at 1.7, 10.85 and 12.8.

function csd456Spec(): LocoSpec {
  return {
    title: "CSD 456.0",
    palette: {
      paint: { color: "#2b3530", roughness: 0.6 },
      wheel: { color: "#8a2a24", roughness: 0.6 },
      frame: { color: "#8a2a24", roughness: 0.65 },
    },
    heads: [0, 14.95],
    beams: { y0: 0.62, y1: 1.18, length: [0.6, 0.62] },
    boiler: { x0: 1.0, x1: 9.8, y: 2.55, r: 0.8, smokebox: 1.6, bands: [4.0, 6.6, 8.6] },
    chimney: { x: 2.4, top: 3.8, r: 0.28 },
    domes: [{ x: 5.1, top: 3.8, r: 0.4, len: 2.0 }],
    valves: { x: 8.1, top: 3.72 },
    handrail: { x0: 1.6, x1: 9.7, y: 2.75 },
    runningBoard: { profile: [[0.76, 1.2], [3.3, 1.2], [3.3, 1.47], [14.18, 1.47]], half: 1.38, valance: 0.08 },
    frame: { x0: 0.8, x1: 14.2, top: 1.15 },
    cab: {
      x0: 9.8, x1: 12.4, half: [[1.4, 1.47], [1.4, 3.0], [1.0, 3.4], [0.3, 3.6]], roofY: 3.3,
      windows: [{ x0: 10.05, x1: 10.45, y0: 2.35, y1: 2.9 }, { x0: 10.85, x1: 11.8, y0: 2.3, y1: 2.9 }],
      front: [{ z0: 0.85, z1: 1.25, y0: 2.75, y1: 3.15 }, { z0: -1.25, z1: -0.85, y0: 2.75, y1: 3.15 }],
    },
    prisms: [
      { name: "smokebox casing", x0: 1.1, x1: 3.3, half: [[0.9, 1.2], [0.9, 2.2]] },
      { name: "side tanks", x0: 3.3, x1: 9.8, half: [[1.4, 1.47], [1.4, 2.4]] },
      { name: "bunker", x0: 12.4, x1: 14.3, half: [[1.4, 1.47], [1.4, 2.6]] },
      { name: "coal box", x0: 12.45, x1: 14.25, half: [[1.0, 2.6], [0.9, 3.3]] },
    ],
    coal: { x0: 12.55, x1: 14.15, y: 3.25, half: 0.85, rise: 0.45 },
    gear: {
      wheels: [
        { x: 1.7, d: 0.88, spokes: 10, outsideBoxes: true },
        { x: 4.55, d: 1.32, spokes: 14 },
        { x: 6.1, d: 1.32, spokes: 14 },
        { x: 7.65, d: 1.32, spokes: 14 },
        { x: 9.2, d: 1.32, spokes: 14 },
        { x: 10.85, d: 0.88, spokes: 10, outsideBoxes: true },
        { x: 12.8, d: 0.88, spokes: 10, outsideBoxes: true },
      ],
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 2.4, x1: 3.3, y: 0.85, r: 0.28 }, crank: 0.32, phase: -0.6, valveGear: true }],
      cylinderZ: 1.1,
      reference: 1,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.62, 1.18, 0.75], [0.62, 1.18, -0.75]], rear: [[14.34, 1.18, 0.75], [14.34, 1.18, -0.75]] },
    number: { text: "456.008", side: [10.3, 1.9, 1.4], front: [0.93, 1.95] },
  };
}

export function csd456(): MeshBuilder {
  return buildLoco(csd456Spec());
}

// --- CSD 477.0 "Papousek" --------------------------------------------------------
//
// A 2'D2' tank locomotive, 1625 mm drivers, 880 mm carrying wheels (vlakosimdb
// csd_477_0). Boiler x 1.3..10.5 about y 3.05 under the continuous top casing
// 1.5..10.5 to 4.4 (`base`), smoke deflectors 0.3..2.8 (`air`), side tanks
// 3.4..10.5 to 2.9 and bunker 12.7..16.0 (`tendr`), cab 10.5..13.1 to 4.5; the
// drivers at the XML's ground notches 4.8, 6.7, 8.6, 10.5.

function csd477Spec(): LocoSpec {
  return {
    title: "CSD 477.0",
    palette: {
      paint: { color: "#24589a", roughness: 0.5 },
      casing: { color: "#3f7fc2", roughness: 0.45 },
      smokebox: { color: "#22334f", roughness: 0.8 },
      wheel: { color: "#b02a35", roughness: 0.55 },
      frame: { color: "#b02a35", roughness: 0.6 },
      ...WHITE,
    },
    heads: [0.05, 16.92],
    beams: { y0: 0.72, y1: 1.3 },
    boiler: { x0: 0.6, x1: 10.5, y: 3.05, r: 0.95, smokebox: 1.5, band: "lining", bands: [4.2, 6.6, 9.0], paint: "casing" } as LocoSpec["boiler"],
    chimney: { x: 2.2, top: 4.52, r: 0.28 },
    valves: { x: 9.6, top: 4.52 },
    runningBoard: { profile: [[0.67, 1.0], [0.8, 1.0], [1.55, 2.6], [3.4, 2.6], [3.4, 1.72], [16.3, 1.72]], half: 1.44, valance: 0.06, valanceMat: "lining" },
    frame: { x0: 0.7, x1: 16.25, top: 1.65 },
    cab: {
      x0: 10.5, x1: 13.1, half: [[1.5, 1.72], [1.5, 2.9], [1.3, 3.8], [0.9, 4.2], [0.4, 4.45]], roofY: 4.05,
      windows: [{ x0: 10.7, x1: 11.2, y0: 2.95, y1: 3.55 }, { x0: 11.3, x1: 11.8, y0: 2.95, y1: 3.55 }, { x0: 12.1, x1: 12.6, y0: 2.95, y1: 3.55 }],
      front: [{ z0: 0.7, z1: 1.2, y0: 3.3, y1: 3.75 }, { z0: -1.2, z1: -0.7, y0: 3.3, y1: 3.75 }],
    },
    prisms: [
      { name: "top casing", x0: 1.45, x1: 10.5, half: [[0.5, 3.75], [0.5, 4.25], [0.35, 4.4]], mat: "casing" },
      { name: "side tanks", x0: 3.4, x1: 10.5, half: [[1.5, 1.72], [1.5, 2.9], [1.0, 3.0]] },
      { name: "bunker", x0: 13.1, x1: 16.0, half: [[1.5, 1.72], [1.5, 2.9]] },
      { name: "bunker top", x0: 13.1, x1: 15.7, half: [[1.0, 2.9], [0.8, 4.4]] },
    ],
    deflectors: { outlines: [[[0.3, 2.9], [0.4, 2.7], [1.8, 2.8], [2.8, 3.0], [2.8, 3.8], [2.6, 4.0], [0.6, 4.0], [0.3, 3.7]]], z: 1.3 },
    bogies: [{ x0: 0.25, x1: 3.05, y: 0.62 }],
    gear: {
      wheels: [
        { x: 0.75, d: 0.88, spokes: 10 },
        { x: 2.55, d: 0.88, spokes: 10 },
        { x: 4.8, d: 1.625, spokes: 16 },
        { x: 6.7, d: 1.625, spokes: 16 },
        { x: 8.6, d: 1.625, spokes: 16 },
        { x: 10.5, d: 1.625, spokes: 16 },
        { x: 13.1, d: 0.88, spokes: 10, outsideBoxes: true },
        { x: 14.9, d: 0.88, spokes: 10, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4, 5], main: 3, cylinder: { x0: 1.55, x1: 2.7, y: 1.12, r: 0.32 }, crank: 0.34, phase: -0.6, valveGear: true }],
      cylinderZ: 1.16,
      reference: 2,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.67, 1.3, 0.85], [0.67, 1.3, -0.85]], rear: [[16.3, 1.3, 0.85], [16.3, 1.3, -0.85]] },
    number: { text: "477.013", side: [11.4, 2.0, 1.5], front: [0.53, 2.42] },
  };
}

export function csd477(): MeshBuilder {
  return buildLoco(csd477Spec());
}

// --- CSD 475.1 "Slechticna" --------------------------------------------------------
//
// A 2'D1' locomotive with a four-axle bogie tender (vlakosimdb csd_475_179#l and
// #t). The vlakosimdb body is shorter than the class (12.8 m against 15.25 m)
// and paints coupled wheels about 1.45 m across at 1.55 m centres where the class
// has 1750 mm: the model keeps the vlakosimdb layout and the 1.45 m wheels it
// has room for. Boiler x 1.5..10.1 about y 2.6, Wagner deflectors 1.1..4.2,
// chimney 2.4..3.4 and domes at 4.5..5.4, 5.7..6.5, 6.8..7.8, cab 10.1..12.8.

function csd475Spec(): LocoSpec {
  return {
    title: "CSD 475.1",
    palette: {
      paint: { color: "#3a383d", roughness: 0.55 },
      wheel: { color: "#a8323a", roughness: 0.6 },
      frame: { color: "#a8323a", roughness: 0.65 },
    },
    heads: [0, 13.0],
    beams: { y0: 0.7, y1: 1.3, length: [0.5, 0.3] },
    boiler: { x0: 1.5, x1: 10.1, y: 2.6, r: 0.98, smokebox: 1.5, bands: [4.1, 6.65, 8.6] },
    chimney: { x: 2.9, top: 3.95, r: 0.32 },
    domes: [{ x: 4.95, top: 3.92, r: 0.42 }, { x: 6.1, top: 3.9, r: 0.38 }, { x: 7.3, top: 3.92, r: 0.42 }],
    valves: { x: 9.4, top: 3.85 },
    handrail: { x0: 2.2, x1: 10.0, y: 2.9 },
    runningBoard: { profile: [[0.66, 1.0], [1.52, 1.62], [1.8, 1.9], [12.4, 1.9]], half: 1.45, valance: 0.1 },
    frame: { x0: 0.6, x1: 12.4, top: 1.55 },
    cab: {
      x0: 10.1, x1: 12.8, half: [[1.5, 1.6], [1.5, 1.9], [1.4, 3.0], [1.2, 3.5], [0.4, 3.9]], roofY: 3.45,
      windows: [{ x0: 10.3, x1: 10.8, y0: 2.6, y1: 3.2 }, { x0: 11.0, x1: 11.7, y0: 2.6, y1: 3.2 }],
      front: [{ z0: 0.75, z1: 1.2, y0: 2.9, y1: 3.3 }, { z0: -1.2, z1: -0.75, y0: 2.9, y1: 3.3 }],
    },
    deflectors: {
      outlines: [[[1.1, 1.3], [1.4, 3.1], [1.8, 3.6], [2.2, 3.6], [2.2, 2.3]], [[2.2, 2.3], [2.2, 3.6], [4.2, 3.6], [3.9, 2.3]]],
      z: 1.38,
    },
    bogies: [{ x0: 0.8, x1: 3.4, y: 0.62 }],
    gear: {
      wheels: [
        { x: 1.4, d: 0.88, spokes: 10 },
        { x: 2.8, d: 0.88, spokes: 10 },
        { x: 4.75, d: 1.45, spokes: 16 },
        { x: 6.3, d: 1.45, spokes: 16 },
        { x: 7.85, d: 1.45, spokes: 16 },
        { x: 9.4, d: 1.45, spokes: 16 },
        { x: 11.0, d: 1.05, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4, 5], main: 3, cylinder: { x0: 2.0, x1: 2.95, y: 1.1, r: 0.32 }, crank: 0.34, phase: -0.6, valveGear: true }],
      cylinderZ: 1.15,
      reference: 2,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.56, 1.3, 0.85], [0.56, 1.3, -0.85]], rear: [[12.75, 1.3, 0.7], [12.75, 1.3, -0.7]] },
    number: { text: "475.179", side: [11.3, 2.05, 1.5], front: [1.43, 2.25] },
  };
}

// The 475.1 tender (csd_475_179#t): tank 0..6.5 to 2.7, coal bunker 0.5..4.2 to
// 3.8, toolboxes ahead of it, bogies with wheels at 0.8, 2.2, 4.4 and 5.7.
function csd475TenderSpec(): LocoSpec {
  return {
    title: "CSD 475.1 tender",
    palette: csd475Spec().palette,
    heads: [-0.3, 7.12],
    beams: { y0: 0.75, y1: 1.3, length: [0.3, 0.62] },
    frame: { x0: 0.0, x1: 6.5, top: 0.95 },
    prisms: [
      { name: "tank", x0: 0.0, x1: 6.5, half: [[1.5, 0.95], [1.5, 2.5], [1.3, 2.7]] },
      { name: "coal bunker", x0: 0.5, x1: 4.2, half: [[1.3, 2.7], [1.2, 3.3], [1.0, 3.8]] },
      { name: "toolboxes", x0: 0.08, x1: 0.5, half: [[0.9, 2.7], [0.9, 3.3]] },
    ],
    coal: { x0: 0.6, x1: 4.1, y: 3.75, half: 0.85, rise: 0.25 },
    bogies: [{ x0: 0.3, x1: 2.7, y: 0.6 }, { x0: 3.9, x1: 6.2, y: 0.6 }],
    gear: {
      wheels: [0.8, 2.2, 4.4, 5.7].map((x) => ({ x, d: 0.95, spokes: 10 })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    lamps: { front: [], rear: [[6.55, 1.3, 0.7], [6.55, 1.3, -0.7]] },
  };
}

// --- CSD 498.1 "Albatros" ----------------------------------------------------------
//
// A 2'D1' express locomotive, 1830 mm drivers, 880 mm bogie and 1150 mm trailing
// wheels (vlakosimdb csd_498_1, its four-axle tender csd_498_1#t). Measured:
// boiler x 1.0..14.1 (`base`), raised running board at 2.5 sloping to the front
// beam, the big front deflectors 1.5..5.0 (`pas`), cylinders 1.8..3.2 (`fore`),
// cab 14.1..17.8 to 4.3; wheels from the BMP at 1.45, 3.35, 6.0, 7.95, 9.9,
// 11.85 and 14.8. The vlakosimdb chimney (5.0 m) is lowered to the 4.7 m envelope.

function csd498Spec(): LocoSpec {
  return {
    title: "CSD 498.1",
    palette: {
      paint: { color: "#1f3a9a", roughness: 0.45 },
      smokebox: { color: "#1c1d22", roughness: 0.85 },
      wheel: { color: "#a51a1f", roughness: 0.55 },
      frame: { color: "#a51a1f", roughness: 0.6 },
      ...WHITE,
    },
    heads: [0.05, 18.1],
    beams: { y0: 0.72, y1: 1.3, length: [0.55, 0.3] },
    boiler: { x0: 1.0, x1: 14.1, y: 3.35, r: 0.95, smokebox: 1.9, bands: [5.0, 8.0, 11.0, 13.5] },
    chimney: { x: 3.5, top: 4.65, r: 0.32 },
    domes: [{ x: 6.4, top: 4.6, r: 0.45, len: 1.4 }, { x: 9.0, top: 4.55, r: 0.42 }],
    valves: { x: 13.2, top: 4.55 },
    handrail: { x0: 3.0, x1: 14.0, y: 3.6 },
    runningBoard: { profile: [[0.75, 1.05], [1.0, 1.05], [2.6, 2.5], [17.9, 2.5]], half: 1.42, valance: 0.06, valanceMat: "lining" },
    frame: { x0: 0.75, x1: 17.9, top: 2.4 },
    cab: {
      x0: 14.1, x1: 17.8, half: [[1.5, 1.5], [1.5, 3.35], [1.2, 3.95], [0.55, 4.3]], roofY: 4.0,
      windows: [{ x0: 14.3, x1: 14.95, y0: 2.85, y1: 3.6 }, { x0: 15.15, x1: 16.4, y0: 2.85, y1: 3.6 }],
      front: [{ z0: 0.75, z1: 1.25, y0: 3.3, y1: 3.8 }, { z0: -1.25, z1: -0.75, y0: 3.3, y1: 3.8 }],
    },
    deflectors: { outlines: [[[1.5, 1.6], [2.8, 2.6], [2.8, 3.9], [1.5, 3.5]], [[2.8, 2.6], [5.0, 2.6], [4.9, 3.9], [2.8, 3.9]]], z: 1.45 },
    bogies: [{ x0: 1.0, x1: 3.8, y: 0.62 }],
    gear: {
      wheels: [
        { x: 1.45, d: 0.88, spokes: 10 },
        { x: 3.35, d: 0.88, spokes: 10 },
        { x: 6.0, d: 1.83, spokes: 18 },
        { x: 7.95, d: 1.83, spokes: 18 },
        { x: 9.9, d: 1.83, spokes: 18 },
        { x: 11.85, d: 1.83, spokes: 18 },
        { x: 14.8, d: 1.15, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4, 5], main: 3, cylinder: { x0: 2.0, x1: 3.3, y: 1.3, r: 0.33 }, crank: 0.34, phase: -0.6, valveGear: true }],
      cylinderZ: 1.12,
      reference: 2,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.62, 1.3, 0.85], [0.62, 1.3, -0.85]], rear: [[17.95, 1.3, 0.7], [17.95, 1.3, -0.7]] },
    number: { text: "498.106", side: [15.0, 2.15, 1.5], front: [0.93, 2.72] },
  };
}

// The 498.1 tender (csd_498_1#t): tank 0..8 to 3.1 with the white line at 3.0,
// coal bunker 0..5.6 to 4.0, two bogies with wheels at 0.75, 2.45, 5.45, 7.15.
function csd498TenderSpec(): LocoSpec {
  const tank: Pt[] = [[1.5, 1.05], [1.5, 3.1]];
  return {
    title: "CSD 498.1 tender",
    palette: csd498Spec().palette,
    heads: [-0.3, 8.62],
    beams: { y0: 0.72, y1: 1.3, length: [0.3, 0.62] },
    frame: { x0: 0.0, x1: 8.0, top: 1.0 },
    prisms: [
      { name: "tank", x0: 0.05, x1: 7.95, half: tank },
      { name: "coal bunker", x0: 0.05, x1: 5.55, half: [[1.5, 3.1], [1.1, 4.0]] },
    ],
    coal: { x0: 0.3, x1: 5.3, y: 3.95, half: 0.85, rise: 0.3 },
    bogies: [{ x0: 0.2, x1: 3.0, y: 0.6 }, { x0: 4.9, x1: 7.7, y: 0.6 }],
    gear: {
      wheels: [0.75, 2.45, 5.45, 7.15].map((x) => ({ x, d: 0.95, spokes: 10 })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    lamps: { front: [], rear: [[8.0, 1.3, 0.7], [8.0, 1.3, -0.7]] },
    extras: (t) => t.m.scope("white line", () => {
      for (const s of [-1, 1]) t.sidePanel(mirrored(tank), "lining", s, 0.1, 7.9, 2.97, 3.03, 0.006, 0.01);
    }),
  };
}

// --- CSD 556.0 "Stokr" ---------------------------------------------------------------
//
// A 1'E freight locomotive, 1400 mm drivers, 900 mm leading wheels (vlakosimdb
// csd_556_0, its five-axle tender csd_556_0#t). Measured from the XML: boiler
// x 1.1..11.9 about y 3.0, running board at 2.15 (`line`), deflectors 0.3..2.7
// (`gear`), cylinders 2.4..3.5 (`cylinder`), chimney 1.6..2.5, domes 4.1..5.3 and
// 7.4..8.6 with the sand box 5.9..6.8 (`other`), cab 11.9..14.7 to 4.2; coupled
// wheels at the ground notches 4.65, 6.35, 8.05, 9.75, 11.45.

function csd556Spec(): LocoSpec {
  return {
    title: "CSD 556.0",
    palette: {
      paint: { color: "#24282a", roughness: 0.55 },
      wheel: { color: "#8e2a1e", roughness: 0.6 },
      frame: { color: "#8e2a1e", roughness: 0.65 },
      ...WHITE,
    },
    heads: [0, 14.95],
    beams: { y0: 0.78, y1: 1.25, length: [0.5, 0.3] },
    boiler: { x0: 1.1, x1: 11.9, y: 3.0, r: 1.0, smokebox: 1.6, bands: [4.0, 6.9, 9.4, 11.0] },
    chimney: { x: 2.05, top: 4.45, r: 0.3 },
    domes: [{ x: 4.7, top: 4.25, r: 0.45, len: 1.2 }, { x: 6.35, top: 4.2, r: 0.4, len: 0.9 }, { x: 8.0, top: 4.25, r: 0.45, len: 1.2 }],
    valves: { x: 11.3, top: 4.25 },
    handrail: { x0: 2.0, x1: 11.8, y: 3.25 },
    runningBoard: { profile: [[0.66, 1.15], [0.95, 1.15], [1.65, 2.18], [11.9, 2.18]], half: 1.42, valance: 0.08, valanceMat: "lining" },
    frame: { x0: 0.7, x1: 14.6, top: 2.1 },
    cab: {
      x0: 11.9, x1: 14.7, half: [[1.5, 1.3], [1.5, 2.8], [1.3, 3.7], [1.2, 3.9], [0.8, 4.1], [0.3, 4.2]], roofY: 3.85,
      windows: [{ x0: 12.1, x1: 12.75, y0: 3.0, y1: 3.6 }, { x0: 12.95, x1: 13.6, y0: 3.0, y1: 3.6 }],
      front: [{ z0: 0.75, z1: 1.25, y0: 3.2, y1: 3.65 }, { z0: -1.25, z1: -0.75, y0: 3.2, y1: 3.65 }],
    },
    deflectors: { outlines: [[[0.3, 3.4], [0.3, 2.7], [0.5, 2.5], [1.1, 2.5], [2.6, 2.8], [2.7, 2.9], [2.7, 3.8], [0.7, 3.8]]], z: 1.35 },
    gear: {
      wheels: [
        { x: 1.95, d: 0.9, spokes: 10, outsideBoxes: true },
        { x: 4.65, d: 1.4, spokes: 15 },
        { x: 6.35, d: 1.4, spokes: 15 },
        { x: 8.05, d: 1.4, spokes: 15 },
        { x: 9.75, d: 1.4, spokes: 15 },
        { x: 11.45, d: 1.4, spokes: 15 },
      ],
      engines: [{ coupled: [1, 2, 3, 4, 5], main: 3, cylinder: { x0: 2.4, x1: 3.5, y: 1.1, r: 0.33 }, crank: 0.33, phase: -0.6, valveGear: true }],
      cylinderZ: 1.12,
      reference: 1,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.56, 1.25, 0.95], [0.56, 1.25, -0.95]], rear: [[14.6, 1.25, 0.8], [14.6, 1.25, -0.8]] },
    number: { text: "556.0510", side: [12.75, 2.12, 1.5], front: [1.03, 2.45] },
  };
}

// The 556.0 tender (csd_556_0#t): tank 0.1..7.6 to 3.05, coal bunker 0.1..5.4 to
// 4.2, five axles at the BMP's 0.7, 2.15, 3.65, 5.1 and 6.55.
function csd556TenderSpec(): LocoSpec {
  return {
    title: "CSD 556.0 tender",
    palette: csd556Spec().palette,
    heads: [-0.2, 8.22],
    beams: { y0: 0.75, y1: 1.3, length: [0.3, 0.62] },
    frame: { x0: 0.1, x1: 7.6, top: 0.95 },
    prisms: [
      { name: "tank", x0: 0.1, x1: 7.6, half: [[1.45, 0.95], [1.5, 2.2], [1.5, 3.05]] },
      { name: "coal bunker", x0: 0.1, x1: 5.4, half: [[1.3, 3.05], [1.25, 3.6], [1.0, 4.0], [0.8, 4.2]] },
      { name: "toolbox", x0: 6.1, x1: 7.3, half: [[1.0, 3.05], [1.0, 3.3]] },
    ],
    coal: { x0: 0.3, x1: 5.2, y: 4.12, half: 0.7, rise: 0.2 },
    gear: {
      wheels: [0.7, 2.15, 3.65, 5.1, 6.55].map((x) => ({ x, d: 0.9, spokes: 10, outsideBoxes: true })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    lamps: { front: [], rear: [[7.65, 1.3, 0.7], [7.65, 1.3, -0.7]] },
  };
}

// --- CSD 636 Mallet ---------------------------------------------------------------------
//
// A 1'C C Mallet locomotive (vlakosimdb csd_636, its bogie tender
// tender/csd_636tend): two engines of three coupled 1.3 m wheels, the front one
// articulated on the real locomotive and rigid here. Measured: boiler 1.7..8.1
// about y 3.2 and the firebox to 12.0, chimney 2.3..2.9, domes 3.3..4.1 and
// 4.9..5.7, the drum on top 6.3..7.8, cylinders 2.1..3.1 and 8.4..9.3, coupled
// wheels at the frame notches 4.1, 5.8, 7.5 and 10.25, 11.9, 13.6, cab 12.0..14.8.
// The number is illustrative.

function csd636Spec(): LocoSpec {
  return {
    title: "CSD 636",
    palette: {
      paint: { color: "#2b2c2f", roughness: 0.6 },
      wheel: { color: "#3d3e42", roughness: 0.6 },
      frame: { color: "#2b2c2f", roughness: 0.65 },
    },
    heads: [0, 15.1],
    beams: { y0: 0.7, y1: 1.2, length: [0.4, 0.3] },
    boiler: { x0: 1.7, x1: 12.0, y: 3.2, r: 1.0, smokebox: 1.5, bands: [4.5, 6.1, 8.0] },
    chimney: { x: 2.6, top: 4.65, r: 0.3 },
    domes: [{ x: 3.7, top: 4.65, r: 0.4 }, { x: 5.3, top: 4.65, r: 0.4 }],
    valves: { x: 9.8, top: 4.6 },
    handrail: { x0: 2.4, x1: 11.9, y: 3.45 },
    runningBoard: { profile: [[0.56, 1.15], [1.6, 1.15], [2.4, 2.25], [12.0, 2.25]], half: 1.35, valance: 0.08 },
    frame: { x0: 0.6, x1: 14.6, top: 2.2 },
    cab: {
      x0: 12.0, x1: 14.8, half: [[1.5, 1.7], [1.5, 3.7], [1.3, 3.9], [0.8, 4.2], [0, 4.4]], roofY: 3.95,
      windows: [{ x0: 13.1, x1: 14.0, y0: 3.0, y1: 3.65 }, { x0: 12.25, x1: 12.7, y0: 3.0, y1: 3.4 }],
      front: [{ z0: 0.75, z1: 1.2, y0: 3.0, y1: 3.4 }, { z0: -1.2, z1: -0.75, y0: 3.0, y1: 3.4 }],
    },
    prisms: [{ name: "firebox", x0: 8.1, x1: 12.0, half: [[1.0, 2.3], [1.0, 3.2], [0.9, 3.8], [0.6, 4.2], [0, 4.4]] }],
    gear: {
      wheels: [
        { x: 1.45, d: 0.9, spokes: 10, outsideBoxes: true },
        { x: 4.1, d: 1.3, spokes: 14 },
        { x: 5.8, d: 1.3, spokes: 14 },
        { x: 7.5, d: 1.3, spokes: 14 },
        { x: 10.25, d: 1.3, spokes: 14 },
        { x: 11.9, d: 1.3, spokes: 14 },
        { x: 13.6, d: 1.3, spokes: 14 },
      ],
      engines: [
        { coupled: [1, 2, 3], main: 2, cylinder: { x0: 2.1, x1: 3.1, y: 1.0, r: 0.33 }, crank: 0.32, phase: 0.2, valveGear: true, name: "front" },
        { coupled: [4, 5, 6], main: 5, cylinder: { x0: 8.4, x1: 9.3, y: 1.0, r: 0.33 }, crank: 0.32, phase: -0.6, valveGear: true, name: "rear" },
      ],
      cylinderZ: 1.12,
      reference: 1,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.45, 1.2, 0.75], [0.45, 1.2, -0.75]], rear: [[14.75, 1.2, 0.7], [14.75, 1.2, -0.7]] },
    number: { text: "636.001", side: [13.1, 2.15, 1.5], front: [1.62, 2.6] },
    extras: (t) => t.m.scope("drum", () => t.cylX("paint", 6.3, 7.8, 0, 4.38, 0.28, 12)),
  };
}

// The 636 tender (tender/csd_636tend): tank 0..6.6 to 3.1, flared coal sides
// 0.4..5.7, two bogies with wheels at 0.9, 2.6, 4.3, 6.0.
function csd636TenderSpec(): LocoSpec {
  return {
    title: "CSD 636 tender",
    palette: csd636Spec().palette,
    heads: [-0.3, 7.8],
    beams: { y0: 0.72, y1: 1.25, length: [0.3, 0.5] },
    frame: { x0: 0.0, x1: 7.3, top: 1.0 },
    prisms: [
      { name: "tank", x0: 0.0, x1: 6.6, half: [[1.5, 1.0], [1.5, 3.1]] },
      { name: "coal sides", x0: 0.4, x1: 5.7, half: [[1.5, 3.1], [1.3, 3.5], [1.3, 3.7]] },
      { name: "rear deck", x0: 6.6, x1: 7.3, half: [[1.3, 1.0], [1.3, 1.8]] },
    ],
    coal: { x0: 0.6, x1: 5.5, y: 3.65, half: 1.2, rise: 0.5 },
    bogies: [{ x0: 0.2, x1: 3.3, y: 0.62 }, { x0: 3.6, x1: 6.7, y: 0.62 }],
    gear: {
      wheels: [0.9, 2.6, 4.3, 6.0].map((x) => ({ x, d: 0.95, spokes: 8 })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    lamps: { front: [], rear: [[7.25, 1.25, 0.7], [7.25, 1.25, -0.7]] },
  };
}

// --- CSD 386, streamlined ---------------------------------------------------------------
//
// A streamlined 2'C1' express locomotive and its streamlined tender (vlakosimdb
// csd_386, tender/csd_386tend): the body is three volumes of the XML -- the
// skirts to 0.2 m above the rail, the boiler casing with its round nose, the cab
// -- in green with the orange stripes of the BMP. The casing tops 4.8 m in
// vlakosimdb and is lowered to the 4.7 m envelope. Wheels at the XML's skirt
// openings 2.25, 4.55, 6.2, 8.2, 10.2 and 13.15; the skirts hide most of the
// motion. The number is illustrative.

const STRIPES_386: Array<[number, number]> = [[2.4, 2.52], [2.85, 2.9], [3.05, 3.1], [3.3, 3.35]];

function bands(y0: number, y1: number, stripes: Array<[number, number]>): Array<[number, number, string]> {
  const out: Array<[number, number, string]> = [];
  let y = y0;
  for (const [a, b] of stripes) {
    if (b <= y0 || a >= y1) continue;
    out.push([y, a, "paint"], [a, b, "lining"]);
    y = b;
  }
  out.push([y, y1, "paint"]);
  return out;
}

const PALETTE_386 = {
  paint: { color: "#3e6b3a", roughness: 0.5 },
  lining: { color: "#e0a030", roughness: 0.5 },
  wheel: { color: "#2a2a2c", roughness: 0.6 },
  frame: { color: "#2a2a2c", roughness: 0.65 },
};

function csd386Spec(): LocoSpec {
  const skirt: Pt[] = [[-1.2, 0], [1.2, 0], [1.4, 0.3], [1.5, 0.6], [1.5, 5], [-1.5, 5], [-1.5, 0.6], [-1.4, 0.3]];
  const casing: Pt[] = [[-1.1, 1.1], [1.1, 1.1], [1.1, 3.5], [1.0, 4.0], [0.6, 4.45], [0, 4.62], [-0.6, 4.45], [-1.0, 4.0], [-1.1, 3.5]];
  const cab: Pt[] = [[1.5, 1.4], [1.5, 3.9], [1.3, 4.35], [0.7, 4.62]];
  return {
    title: "CSD 386",
    palette: PALETTE_386,
    heads: [0.1, 15.1],
    beams: { y0: 0.75, y1: 1.3, length: [0.5, 0.3] },
    volumes: [
      {
        name: "skirts", sec: skirt,
        plan: [[0.3, 0.05], [0.5, 0.7], [1.0, 1.2], [1.5, 1.4], [2.0, 1.5], [14.0, 1.5]],
        top: [[0.3, 1.1], [0.6, 1.6], [1.1, 2.0], [1.9, 2.3], [14.0, 2.3]],
        bottom: [[0.3, 0.6], [0.7, 0.3], [1.2, 0.2], [14.0, 0.2]],
        bands: bands(0.2, 2.3, STRIPES_386),
      },
      {
        name: "boiler casing", sec: casing,
        plan: [[0.3, 0.05], [0.5, 0.7], [1.1, 1.0], [2.0, 1.1], [11.4, 1.1]],
        top: [[0.3, 1.1], [1.3, 4.1], [1.8, 4.45], [2.3, 4.62], [11.4, 4.62]],
        bands: bands(1.1, 4.62, STRIPES_386),
      },
    ],
    cab: {
      x0: 11.4, x1: 14.0, half: cab, roofY: 4.3,
      windows: [{ x0: 11.6, x1: 12.15, y0: 3.55, y1: 4.0 }, { x0: 12.4, x1: 12.95, y0: 3.55, y1: 4.0 }],
      front: [{ z0: 0.75, z1: 1.2, y0: 3.7, y1: 4.1 }, { z0: -1.2, z1: -0.75, y0: 3.7, y1: 4.1 }],
    },
    prisms: [
      { name: "cab overhang", x0: 14.0, x1: 14.8, half: [[1.5, 3.7], [1.5, 3.9], [1.3, 4.35], [0.7, 4.62]] },
      { name: "cab rear wall", x0: 13.95, x1: 14.7, half: [[1.3, 0.45], [1.3, 3.75]] },
    ],
    chimney: { x: 3.1, top: 4.68, r: 0.25, base: 4.5 },
    gear: {
      wheels: [
        { x: 2.25, d: 1.0, spokes: 10 },
        { x: 4.55, d: 1.0, spokes: 10 },
        { x: 6.2, d: 1.85, spokes: 18 },
        { x: 8.2, d: 1.85, spokes: 18 },
        { x: 10.2, d: 1.85, spokes: 18 },
        { x: 13.15, d: 1.1, spokes: 12 },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 3.0, x1: 4.1, y: 1.15, r: 0.32 }, crank: 0.35, phase: -0.6 }],
      cylinderZ: 1.14,
      reference: 2,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[1.1, 3.62, 0]], rear: [[14.75, 1.3, 0.7], [14.75, 1.3, -0.7]] },
    number: { text: "386.001", side: [12.8, 2.6, 1.5] },
    extras: (t) => t.m.scope("cab stripes", () => {
      for (const s of [-1, 1]) for (const [a, b] of STRIPES_386) t.sidePanel(cab.length ? [...cab, ...[...cab].reverse().map(([z, y]): Pt => [-z, y])] : [], "lining", s, 11.42, 13.98, a, b, 0.006, 0.01);
    }),
  };
}

function csd386TenderSpec(): LocoSpec {
  const skirt: Pt[] = [[-1.2, 0], [1.2, 0], [1.4, 0.3], [1.5, 0.6], [1.5, 5], [-1.5, 5], [-1.5, 0.6], [-1.4, 0.3]];
  const top: Pt[] = [[-1.5, 3.5], [1.5, 3.5], [1.5, 3.7], [1.3, 4.2], [0.7, 4.6], [-0.7, 4.6], [-1.3, 4.2], [-1.5, 3.7]];
  const stripes: Array<[number, number]> = [[2.35, 2.47], [2.6, 2.65], [2.8, 2.85], [3.05, 3.1]];
  return {
    title: "CSD 386 tender",
    palette: PALETTE_386,
    heads: [-0.3, 8.3],
    beams: { y0: 0.75, y1: 1.3, length: [0.3, 0.9] },
    volumes: [
      { name: "body", sec: skirt, plan: [[0.0, 1.5], [7.1, 1.5]], top: [[0.0, 3.5], [7.1, 3.5]], bottom: [[0.0, 0.2], [7.1, 0.2]], bands: bands(0.2, 3.5, stripes) },
      {
        name: "tank top", sec: top, plan: [[0.1, 1.5], [7.0, 1.5]],
        top: [[0.1, 4.6], [2.6, 4.6], [2.62, 4.5], [4.6, 4.5], [4.62, 4.4], [7.0, 4.2]], bands: [[3.5, 4.6, "paint"]],
      },
    ],
    gear: {
      wheels: [0.75, 2.55, 4.55, 6.55].map((x) => ({ x, d: 1.0, spokes: 0 })),
      engines: [], cylinderZ: 1.1, reference: 0, wheelMaterial: "wheel",
    },
    lamps: { front: [], rear: [[7.75, 1.3, 0.6], [7.75, 1.3, -0.6]] },
    extras: (t) => t.m.scope("rear fairing", () => {
      const q: Pt[] = [[7.0, 0.5], [7.7, 0.5], [7.8, 0.8], [7.8, 3.3], [7.0, 4.0]];
      const ring = q.map(([x, y]): [number, number] => [t.X(x), y]);
      t.m.sweep("paint", "z", ring, -0.5, ring, 0.5);
    }),
  };
}

// --- CSD M 112.0 -------------------------------------------------------------------------
//
// A two-axle steam railcar (vlakosimdb csd_m112): a small boiler 0.4..3.9 about
// y 1.7 in a low casing, a tall chimney and a second stack, an open cab
// 3.1..4.9 and a panelled van body 4.9..7.9 under one roof. One cylinder per
// side, 3.8..4.4, drives the front axle (2.05) through a main rod running
// forward; the rear axle (5.85) is a carrying axle. The number is illustrative.

const BODY_M112: Pt[] = [[1.1, 1.1], [1.1, 3.1], [1.0, 3.2], [0.5, 3.3]];

function csdM112Spec(): LocoSpec {
  const body = mirrored(BODY_M112);
  return {
    title: "CSD M 112.0",
    palette: {
      paint: { color: "#232325", roughness: 0.6 },
      coach: { color: "#3d6a3a", roughness: 0.55 },
      lining: { color: "#7fa06c", roughness: 0.55 },
      roof: { color: "#7a7c7e", roughness: 0.8 },
      wheel: { color: "#3a3b3e", roughness: 0.6 },
      frame: { color: "#232325", roughness: 0.65 },
    },
    heads: [0, 8.4],
    beams: { y0: 0.75, y1: 1.15, half: 1.22, length: [0.5, 0.5] },
    boiler: { x0: 0.45, x1: 3.9, y: 1.7, r: 0.58, smokebox: 0.8 },
    chimney: { x: 0.9, top: 3.85, r: 0.18 },
    domes: [{ x: 2.3, top: 3.15, r: 0.38 }],
    prisms: [
      { name: "frame", x0: 0.5, x1: 7.9, half: [[1.2, 0.8], [1.2, 1.1]], mat: "black" },
      { name: "boiler casing", x0: 1.3, x1: 3.1, half: [[1.1, 1.1], [1.1, 1.95], [1.05, 2.0]] },
      { name: "van body", x0: 4.9, x1: 7.9, half: BODY_M112, mat: "coach" },
      { name: "roof", x0: 3.05, x1: 8.05, half: [[1.15, 3.25], [1.05, 3.35], [0.5, 3.45]], mat: "roof" },
      { name: "cab sides", x0: 3.2, x1: 4.9, half: [[1.1, 1.1], [1.1, 2.1]], mat: "coach" },
    ],
    gear: {
      wheels: [{ x: 2.05, d: 0.85, spokes: 10 }, { x: 5.85, d: 0.85, spokes: 10, outsideBoxes: true }],
      engines: [{ coupled: [0], main: 0, cylinder: { x0: 3.8, x1: 4.4, y: 0.55, r: 0.2 }, crank: 0.15, phase: -0.6 }],
      cylinderZ: 1.0,
      reference: 0,
      wheelMaterial: "wheel",
    },
    lamps: { front: [[0.55, 1.15, 0.85], [0.55, 1.15, -0.85]], rear: [[7.85, 1.15, 0.85], [7.85, 1.15, -0.85]] },
    number: { text: "M 112.001", side: [3.95, 1.45, 1.1], front: [0.38, 1.3] },
    extras: (t) => {
      const m = t.m;
      m.scope("second stack", () => t.cylY("smokebox", 1.6, 0, 2.1, 3.3, 0.16, 12));
      m.scope("cab front wall", () => {
        // the wall with its window opening above the boiler casing
        for (const s of [-1, 1]) t.sideBox("coach", s, 3.1, 3.2, 1.1, 3.28, 0.5, 1.1);
        t.box("coach", 3.1, 3.2, 1.1, 2.2, -0.5, 0.5);
        t.box("coach", 3.1, 3.2, 2.9, 3.28, -0.5, 0.5);
        t.endPanel("glass", 1, 3.1, -0.48, 0.48, 2.22, 2.88);
      });
      m.scope("van panels", () => {
        for (const s of [-1, 1]) for (const [a, b] of [[5.0, 5.9], [6.0, 6.9], [7.0, 7.8]] as const) liningFrame(t, body, s, a, b, 1.25, 2.95, 0.05);
      });
      m.scope("footboards", () => {
        for (const s of [-1, 1]) for (const [a, b] of [[0.6, 1.4], [4.5, 7.9]] as const) {
          t.sideBox("black", s, a, b, 0.42, 0.47, 1.2, 1.45);
          t.sideBox("black", s, a, b, 0.82, 0.87, 1.2, 1.4);
        }
      });
    },
  };
}

// named functions: a design's JS bundle imports its builder by name
export function csd475(params?: ParamValues): MeshBuilder {
  return withTender(csd475Spec, csd475TenderSpec, params);
}
export function csd498(params?: ParamValues): MeshBuilder {
  return withTender(csd498Spec, csd498TenderSpec, params);
}
export function csd556(params?: ParamValues): MeshBuilder {
  return withTender(csd556Spec, csd556TenderSpec, params);
}
export function csd636(params?: ParamValues): MeshBuilder {
  return withTender(csd636Spec, csd636TenderSpec, params);
}
export function csd386(params?: ParamValues): MeshBuilder {
  return withTender(csd386Spec, csd386TenderSpec, params);
}

export function csdM112(): MeshBuilder {
  return buildLoco(csdM112Spec());
}

/** Every steam design: id, title, builder, parameters and its reference folder. */
export interface SteamDesign {
  id: string;
  title: string;
  folder: string;
  build: (params?: ParamValues) => MeshBuilder;
  params?: readonly ParamSpec[];
  /** A railcar (powered, carries passengers): filed under the units, not the locomotives. */
  railcar?: boolean;
}

export const STEAM_DESIGNS: readonly SteamDesign[] = [
  { id: "proc-vehicle-csd-433-0", title: "CSD 433.0", folder: "steam-433-0", build: csd433, params: CSD433_PARAMS },
  { id: "proc-vehicle-csd-456-0", title: "CSD 456.0", folder: "steam-456-0", build: csd456 },
  { id: "proc-vehicle-csd-475-1", title: "CSD 475.1", folder: "steam-475-1", build: csd475, params: [UNIT_PARAM] },
  { id: "proc-vehicle-csd-477-0", title: "CSD 477.0", folder: "steam-477-0", build: csd477 },
  { id: "proc-vehicle-csd-498-1", title: "CSD 498.1", folder: "steam-498-1", build: csd498, params: [UNIT_PARAM] },
  { id: "proc-vehicle-csd-556-0", title: "CSD 556.0", folder: "steam-556-0", build: csd556, params: [UNIT_PARAM] },
  { id: "proc-vehicle-csd-636", title: "CSD 636 Mallet", folder: "steam-636", build: csd636, params: [UNIT_PARAM] },
  { id: "proc-vehicle-csd-386", title: "CSD 386 Streamlined", folder: "steam-386", build: csd386, params: [UNIT_PARAM] },
  { id: "proc-vehicle-csd-m112", title: "CSD M 112.0 Steam Railcar", folder: "steam-m112", build: csdM112, railcar: true },
];

/**
 * The steam family, registered in generate.ts beside the other vehicles: its own
 * module, so the standalone JS models of the other vehicles do not carry it.
 */
export const STEAM_LOCOS: ProceduralDesign[] = STEAM_DESIGNS.map((d) => ({
  id: d.id, title: d.title, build: d.build, catalog: d.railcar ? STEAM_RAILCAR_CATALOG : STEAM_CATALOG, references: d.folder, ...(d.params ? { params: d.params } : {}),
}));

/** The spec a steam design builds for the given parameters (tests and the comparison read it). */
export function steamSpec(id: string, params?: ParamValues): LocoSpec {
  const unit = (specs: [() => LocoSpec, () => LocoSpec]) => (resolveParams([UNIT_PARAM], params).unit === "tender" ? specs[1]() : specs[0]());
  switch (id) {
    case "proc-vehicle-csd-433-0": return csd433Spec(resolveParams(CSD433_PARAMS, params).livery!);
    case "proc-vehicle-csd-456-0": return csd456Spec();
    case "proc-vehicle-csd-475-1": return unit([csd475Spec, csd475TenderSpec]);
    case "proc-vehicle-csd-477-0": return csd477Spec();
    case "proc-vehicle-csd-498-1": return unit([csd498Spec, csd498TenderSpec]);
    case "proc-vehicle-csd-556-0": return unit([csd556Spec, csd556TenderSpec]);
    case "proc-vehicle-csd-636": return unit([csd636Spec, csd636TenderSpec]);
    case "proc-vehicle-csd-386": return unit([csd386Spec, csd386TenderSpec]);
    case "proc-vehicle-csd-m112": return csdM112Spec();
    default: throw new Error(`no steam design ${id}`);
  }
}
