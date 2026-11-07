// JNR locomotives and the Blue Train: the C62 4-6-4 express and the D51 2-8-2
// freight steam locomotives (the steam kit, steamLoco.ts), the EF66 Bo-Bo-Bo
// electric (the carbody kit), the DD51 centre-cab diesel (the hood unit kit,
// usHoodKit.ts) and a 24-series Blue Train sleeper coach (the car builder,
// usTransit.ts). Narrow-gauge (1,067 mm) prototypes at their real body size on
// the game's standard-gauge wheelsets (docs/models/jr-kiha40.md, "Gauge"), inside
// the UIC gauge. See docs/models/jnr-locos.md.

import { MeshBuilder, type MaterialSpec } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco, type LocoSpec } from "./steamLoco.ts";
import type { Steam } from "./steamParts.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { bogieGeometry, paint, type BogieSpec } from "./dieselParts.ts";
import { block } from "./vehicleParts.ts";
import { crownPane, sideLettering, sidePanel } from "./sliceBody.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, faceLamps, type CarbodySpec, type NoseShape } from "./carbodyKit.ts";
import { buildUsHood, knuckleCoupler, usHoodLod, type UsHoodSpec, type UsLivery } from "./usHoodKit.ts";
import { diamond } from "./czElectricKit.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { drawCar, type CarDef } from "./usTransit.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, type UnitBody } from "./lodUnits.ts";

const c = (hex: string, r = 0.5) => paint(hex, r);
const COUPLER_Y = 0.88;

// ---------------------------------------------------------------------------
// Steam: C62 and D51

const JNR_STEAM: Record<string, MaterialSpec> = {
  paint: c("#1d1e20", 0.6), wheel: c("#1d1e20", 0.6), frame: c("#1d1e20", 0.65), lining: c("#e8e6df"),
  plate: c("#1d1e20", 0.6), plateText: c("#d9d0b0", 0.4), knuckle: c("#3a3b3d", 0.7), handrail: c("#c9ccce", 0.5),
};

/** The front buffer beam with its automatic coupler, the headlight on the smokebox top. */
function jnrFront(t: Steam, headX: number, headY: number): void {
  t.m.scope("front beam", () => {
    t.box("beam", 0.15, 0.4, 0.75, 1.15, -1.3, 1.3);
    knuckleCoupler(t.m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
  });
  t.m.scope("headlight", () => {
    t.cylX("black", headX + 0.35, headX - 0.02, 0, headY, 0.2, 12);
    t.cylX("lampHead", headX - 0.03, headX - 0.06, 0, headY, 0.15, 12);
  });
}

// The C62 as C62 2 ("Swallow Angel") is preserved at the Kyoto Railway Museum, measured from
// side-on photographs of C62 3 at Naebo (143 px/m on the 1,750 mm drivers) and C62 2 itself
// (assets/jnr-c62/SOURCES.md): source x from the front coupler face, 13.1 m to the drawbar,
// the 10-22 tender 8.375 m more (21.475 m in all).

/** C62 2's paint: gloss black, the white edging of the running boards and tyres, red coupling rods, a black buffer beam. */
const C62_STEAM: Record<string, MaterialSpec> = {
  paint: c("#1b1c1e", 0.45), wheel: c("#1b1c1e", 0.55), frame: c("#1b1c1e", 0.65), crimson: c("#8a2a22", 0.5), lining: c("#e8e6df", 0.55),
  beam: c("#1b1c1e", 0.6), smokebox: c("#232426", 0.85), tyre: c("#cfcdc6", 0.5),
  plate: c("#1b1c1e", 0.45), plateText: { color: "#c9a64e", metallic: 0.5, roughness: 0.35 },
  stainless: { color: "#c9cdd1", metallic: 0.6, roughness: 0.3 }, marker: { color: "#b3221d", roughness: 0.3 },
  knuckle: c("#3a3b3d", 0.7), handrail: c("#c9ccce", 0.5),
};

const C62_LENGTH = 13.1;
const C62_TENDER_LENGTH = 8.375;
/** The running board: the front deck, the slope behind the deflectors' foot, the board, the hump by the firebox and the cab step. */
const C62_BOARD: Array<[number, number]> = [[0.25, 1.22], [0.6, 1.22], [1.66, 2.27], [9.0, 2.27], [9.2, 2.47], [9.85, 2.47], [10.05, 2.07], [10.8, 2.07]];
const C62_DEFLECTOR_Z = 1.41;
/** The deflector plate (convex pieces round its opening): the chamfered top front, the foot down the board's slope. */
const C62_DEFLECTOR: Array<Array<[number, number]>> = [
  [[0.55, 2.87], [2.77, 2.87], [2.77, 3.53], [2.69, 3.64], [0.99, 3.64], [0.55, 3.1]],
  [[0.55, 1.14], [0.88, 1.16], [1.66, 2.3], [1.75, 2.3], [1.75, 2.87], [0.55, 2.87]],
  [[1.75, 2.3], [2.77, 2.3], [2.77, 2.42], [1.75, 2.42]],
  [[2.69, 2.42], [2.77, 2.42], [2.77, 2.87], [2.69, 2.87]],
];

/** The stainless swallow on C62 2's deflectors: triangles in (forward, up) about its centre, 1 = its span. */
const SWALLOW: Array<[number, number]> = [
  // head and body
  [0.5, 0.01], [0.22, 0.06], [0.2, -0.05], [0.22, 0.06], [-0.16, 0.02], [0.2, -0.05], [0.2, -0.05], [-0.16, 0.02], [-0.12, -0.03],
  // the near wing swept up and back, the far wing below
  [0.26, 0.05], [0.0, 0.03], [-0.36, 0.3], [0.26, 0.05], [-0.36, 0.3], [-0.2, 0.3],
  [0.18, -0.03], [-0.02, -0.02], [-0.3, -0.19],
  // the forked tail
  [-0.1, 0.02], [-0.5, 0.1], [-0.22, 0.0], [-0.1, -0.02], [-0.5, -0.11], [-0.22, 0.0],
];

/** The swallow on side s's deflector, centred at source x, height y, `span` long, its head forward. */
function c62Swallow(t: Steam, s: number, x: number, y: number, span: number): void {
  const z = s * (C62_DEFLECTOR_Z + 0.025 + 0.004);
  t.m.scope("swallow", () => t.m.facets("stainless", SWALLOW.map(([u, v]): [number, number, number] => [t.X(x - u * span), y + v * span, z]), [0, 0, s]));
}

/** The front end: black buffer beam with marker lamps and the automatic coupler, the deck rail, the headlight and C62 2's second lamp. */
function c62Front(t: Steam): void {
  t.m.scope("front beam", () => {
    t.box("beam", 0.22, 0.45, 0.75, 1.2, -1.35, 1.35);
    knuckleCoupler(t.m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
    for (const z of [-1.08, 1.08]) {
      t.cylX("black", 0.22, 0.12, z, 1.0, 0.075, 10);
      t.cylX("marker", 0.12, 0.105, z, 1.0, 0.055, 10);
    }
    // the deck rail above the beam
    for (const s of [-1, 1]) for (const z of [0.45, 1.15]) t.box("handrail", 0.3, 0.33, 1.22, 1.72, s * z - 0.015, s * z + 0.015);
    for (const s of [-1, 1]) t.cylZ("handrail", 0.315, 1.72, s * 0.45, s * 1.16, 0.018, 6);
  });
  t.m.scope("headlight", () => {
    // the LP403 headlight on its bracket at the smokebox's top front
    t.box("black", 1.3, 1.5, 3.62, 3.72, -0.1, 0.1);
    t.cylX("black", 1.62, 1.15, 0, 3.88, 0.2, 14);
    t.cylX("black", 1.15, 1.1, 0, 3.88, 0.215, 14);
    t.cylX("lampHead", 1.1, 1.085, 0, 3.88, 0.17, 14);
    // C62 2's smaller second lamp beside it, on the right
    t.cylX("black", 1.5, 1.2, 0.31, 3.8, 0.1, 10);
    t.cylX("lampHead", 1.2, 1.185, 0.31, 3.8, 0.08, 10);
  });
  t.m.scope("smokebox door", () => {
    // the brass four-spoke handle in the middle of the door, the number plate above it
    const X = t.X(1.1) + 0.101;
    block(t.m, "brass", X, X + 0.02, 2.73, 2.77, -0.2, 0.2);
    block(t.m, "brass", X, X + 0.02, 2.55, 2.95, -0.02, 0.02);
    t.endPlate(1, 1.1 - 0.07, 3.12, "C62 2", 0.15);
  });
}

/** Fittings on the boiler and cab: feedwater heater, feed and air pumps, the cab's white skirt line and plates. */
function c62Fittings(t: Steam): void {
  t.m.scope("feedwater heater", () => t.cylZ("smokebox", 1.85, 3.6, -0.5, 0.5, 0.15, 12));
  t.m.scope("feed pump", () => {
    // on the left side of the boiler, over the rear driver
    t.cylX("black", 7.0, 7.6, -1.05, 2.68, 0.16, 10);
    t.box("black", 7.6, 8.35, 2.5, 2.88, -1.18, -0.88);
    t.box("black", 7.2, 8.2, 2.27, 2.5, -1.12, -0.94);
  });
  t.m.scope("air pump", () => {
    // the air compressor on the right, behind the deflector
    t.cylY("black", 3.25, 1.05, 2.27, 2.95, 0.15, 10);
    t.cylY("black", 3.25, 1.05, 2.95, 3.02, 0.11, 10);
  });
  t.m.scope("air reservoirs", () => {
    // a main reservoir under the board each side ahead of the firebox, the pipes along the board's edge
    for (const s of [-1, 1]) {
      t.cylX("black", 7.3, 8.5, s * 1.16, 1.97, 0.2, 10);
      for (const y of [2.04, 2.13]) t.cylX("black", 3.0, 9.0, s * 1.3, y, 0.022, 6);
    }
  });
  t.m.scope("cylinder casings", () => {
    // the cylinder and valve chest clad in one block, the covers proud at both ends
    for (const s of [-1, 1]) t.sideBox("paint", s, 1.74, 2.76, 0.6, 2.25, 0.78, 1.5);
  });
  t.m.scope("cab", () => {
    for (const s of [-1, 1]) {
      // the white line round the cab's skirt and the depot plate under the number
      t.sideBox("lining", s, 10.79, 12.96, 1.74, 1.8, 1.4, 1.465);
      t.sideBox("plate", s, 11.15, 11.4, 2.05, 2.22, 1.45, 1.462);
      t.sideBox("lining", s, 11.18, 11.37, 2.09, 2.18, 1.462, 1.466);
    }
  });
}

function c62Spec(): LocoSpec {
  return {
    title: "JNR C62",
    palette: C62_STEAM,
    heads: [0, C62_LENGTH],
    beams: { front: false, rear: false },
    boiler: { x0: 1.1, x1: 9.5, y: 2.75, r: 0.87, smokebox: 2.4, bands: [4.6, 6.2, 7.8], band: "black" },
    chimney: { x: 2.42, top: 3.98, r: 0.3 },
    // the long casing over the sand and steam domes
    domes: [{ x: 5.78, top: 3.97, r: 0.4, len: 3.2 }],
    valves: { x: 8.5, top: 3.92 },
    handrail: { x0: 2.95, x1: 9.3, y: 3.25 },
    runningBoard: { profile: C62_BOARD, half: 1.4, valance: 0.07, valanceMat: "lining" },
    frame: { x0: 0.5, x1: 12.9, top: 1.6 },
    cab: {
      x0: 10.8, x1: 12.95, half: [[1.45, 1.75], [1.45, 3.45], [1.3, 3.72], [0.85, 3.86], [0, 3.91]], roofY: 3.72,
      windows: [{ x0: 10.98, x1: 11.62, y0: 2.72, y1: 3.36 }, { x0: 11.82, x1: 12.5, y0: 2.72, y1: 3.36 }],
      front: [{ z0: 1.13, z1: 1.38, y0: 3.0, y1: 3.42 }, { z0: -1.38, z1: -1.13, y0: 3.0, y1: 3.42 }],
    },
    // the wide firebox over the trailing truck, ahead of the cab
    prisms: [{ name: "firebox", x0: 9.4, x1: 10.85, half: [[1.15, 1.9], [1.15, 2.9], [1.0, 3.35], [0.6, 3.6], [0, 3.66]] }],
    deflectors: { outlines: C62_DEFLECTOR, z: C62_DEFLECTOR_Z },
    bogies: [{ x0: 0.9, x1: 3.75, y: 0.55 }, { x0: 10.4, x1: 12.5, y: 0.58 }],
    gear: {
      wheels: [
        { x: 1.21, d: 0.86, spokes: 0, outsideBoxes: true },
        { x: 3.47, d: 0.86, spokes: 0, outsideBoxes: true },
        { x: 5.2, d: 1.75, spokes: 8, box: true },
        { x: 7.27, d: 1.75, spokes: 8, box: true },
        { x: 9.34, d: 1.75, spokes: 8, box: true },
        { x: 10.95, d: 0.92, spokes: 0, outsideBoxes: true },
        { x: 12.05, d: 0.92, spokes: 0, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 1.75, x1: 2.75, y: 0.98, r: 0.36 }, crank: 0.33, phase: 0.4, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel", couplingMat: "crimson",
    },
    number: { text: "C62 2", side: [11.3, 2.36, 1.45] },
    extras: (t) => {
      c62Front(t);
      c62Fittings(t);
      for (const s of [-1, 1]) c62Swallow(t, s, 1.3, 3.18, 0.66);
      t.m.scope("drawbar", () => t.box("black", 12.95, C62_LENGTH, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

/** The 10-22 tender: the welded "boat-bottom" tank, the coal space ahead of the lower water deck, two three-axle bogies. */
function c62Tender(): LocoSpec {
  const L = C62_TENDER_LENGTH;
  const axles = [1.0, 2.2, 3.4, 5.0, 6.2, 7.4];
  return {
    title: "JNR C62 tender",
    palette: C62_STEAM,
    heads: [0, L],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 8.05, top: 1.22 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 8.15, half: [[1.24, 1.22], [1.42, 1.42], [1.42, 2.85]] },
      { name: "coal space", x0: 0.3, x1: 7.15, half: [[1.42, 2.85], [1.42, 3.15]] },
    ],
    coal: { x0: 0.75, x1: 6.7, y: 3.1, half: 1.25, rise: 0.28 },
    bogies: [{ x0: 0.55, x1: 3.85, y: 0.55 }, { x0: 4.55, x1: 7.85, y: 0.55 }],
    gear: { wheels: axles.map((x) => ({ x, d: 0.86, spokes: 0, outsideBoxes: true })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[8.37, 2.55, 0]] },
    extras: (t) => {
      t.m.scope("rear beam", () => { t.box("beam", 8.15, 8.3, 0.75, 1.2, -1.35, 1.35); knuckleCoupler(t.m, -1, -t.X(L) - 0.6, -t.X(L), COUPLER_Y); });
      t.m.scope("lining", () => {
        // the white edge along the coal space's top and the water deck behind it
        for (const s of [-1, 1]) {
          t.sideBox("lining", s, 0.3, 7.15, 3.09, 3.15, 1.42, 1.432);
          t.sideBox("lining", s, 7.15, 8.15, 2.79, 2.85, 1.42, 1.432);
          t.sideBox("lining", s, 7.12, 7.15, 2.85, 3.09, 1.42, 1.432);
        }
      });
      t.m.scope("water filler", () => t.cylY("black", 7.65, 0, 2.85, 3.0, 0.3, 12));
      t.m.scope("drawbar", () => t.box("black", 0, 0.3, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function c62TenderSpec(): LocoSpec {
  return {
    title: "JNR C62 tender",
    palette: JNR_STEAM,
    heads: [0, 8.9],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: 8.5, top: 1.2 },
    prisms: [
      { name: "tank", x0: 0.3, x1: 8.4, half: [[1.4, 1.2], [1.4, 2.95]] },
      { name: "coal sides", x0: 0.5, x1: 5.5, half: [[1.4, 2.95], [1.3, 3.3]] },
    ],
    coal: { x0: 0.7, x1: 5.3, y: 3.3, half: 1.15, rise: 0.35 },
    bogies: [{ x0: 0.7, x1: 3.5, y: 0.55 }, { x0: 5.3, x1: 8.1, y: 0.55 }],
    gear: { wheels: [1.3, 2.9, 5.9, 7.5].map((x) => ({ x, d: 0.86, spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[8.42, 2.6, 0]] },
    extras: (t) => t.m.scope("rear beam", () => { t.box("beam", 8.4, 8.55, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(8.9) - 0.6, -t.X(8.9), COUPLER_Y); }),
  };
}

export type D51Variant = "standard" | "namekuji";
const D51_PARAMS: ParamSpec[] = [UNIT_PARAM, enumParam("variant", "Type", { standard: "Standard", namekuji: "Namekuji" })];

function d51Spec(variant: D51Variant): LocoSpec {
  return {
    title: "JNR D51",
    palette: JNR_STEAM,
    heads: [0, 11.6],
    beams: { front: false, rear: false },
    boiler: { x0: 0.9, x1: 8.6, y: 2.6, r: 0.82, smokebox: 1.5, bands: [3.6, 5.6, 7.4] },
    chimney: { x: 1.8, top: 3.95, r: 0.26 },
    // the standard engine's separate sand and steam domes, or the early "namekuji" (slug) casing from the chimney back
    domes: variant === "namekuji" ? [{ x: 3.6, top: 3.82, r: 0.36, len: 3.2 }] : [{ x: 3.6, top: 3.85, r: 0.36 }, { x: 5.2, top: 3.85, r: 0.38 }],
    valves: { x: 7.7, top: 3.65 },
    handrail: { x0: 1.8, x1: 8.4, y: 2.8 },
    runningBoard: { profile: [[0.4, 1.35], [1.3, 1.35], [1.8, 1.9], [8.9, 1.9]], half: 1.4, valance: 0.08 },
    frame: { x0: 0.5, x1: 11.0, top: 1.8 },
    cab: {
      x0: 8.6, x1: 11.0, half: [[1.45, 1.75], [1.45, 3.5], [1.25, 3.78], [0.8, 3.93], [0, 3.98]], roofY: 3.75,
      windows: [{ x0: 8.9, x1: 9.6, y0: 2.75, y1: 3.35 }, { x0: 9.8, x1: 10.5, y0: 2.75, y1: 3.35 }],
      front: [{ z0: 0.8, z1: 1.2, y0: 2.95, y1: 3.4 }, { z0: -1.2, z1: -0.8, y0: 2.95, y1: 3.4 }],
    },
    prisms: [{ name: "firebox", x0: 7.2, x1: 8.6, half: [[0.95, 2.0], [0.95, 2.95], [0.8, 3.35], [0.5, 3.5], [0, 3.55]] }],
    deflectors: { outlines: [[[0.8, 1.95], [2.3, 1.95], [2.3, 3.3], [1.1, 3.3], [0.8, 3.0]]], z: 1.3 },
    bogies: [{ x0: 1.6, x1: 2.8, y: 0.55 }],
    gear: {
      wheels: [
        { x: 2.2, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 3.85, d: 1.4, spokes: 16 },
        { x: 5.4, d: 1.4, spokes: 16 },
        { x: 6.95, d: 1.4, spokes: 16 },
        { x: 8.5, d: 1.4, spokes: 16 },
        { x: 10.2, d: 1.07, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.4, x1: 2.4, y: 0.95, r: 0.33 }, crank: 0.33, phase: 0.2, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: variant === "namekuji" ? "D51 1" : "D51 200", side: [9.7, 2.4, 1.45], front: [0.88, 2.35] },
    extras: (t) => {
      jnrFront(t, 1.05, 3.4);
      t.m.scope("drawbar", () => t.box("black", 11.0, 11.6, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

function d51TenderSpec(): LocoSpec {
  return { ...c62TenderSpec(), title: "JNR D51 tender", heads: [0, 8.2],
    frame: { x0: 0.3, x1: 7.8, top: 1.2 },
    prisms: [{ name: "tank", x0: 0.3, x1: 7.7, half: [[1.4, 1.2], [1.4, 2.85]] }, { name: "coal sides", x0: 0.5, x1: 4.8, half: [[1.4, 2.85], [1.3, 3.2]] }],
    coal: { x0: 0.7, x1: 4.6, y: 3.2, half: 1.15, rise: 0.35 },
    bogies: [{ x0: 0.6, x1: 3.2, y: 0.55 }, { x0: 4.8, x1: 7.4, y: 0.55 }],
    gear: { wheels: [1.15, 2.65, 5.35, 6.85].map((x) => ({ x, d: 0.86, spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[7.72, 2.5, 0]] },
    extras: (t) => t.m.scope("rear beam", () => { t.box("beam", 7.7, 7.85, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(8.2) - 0.6, -t.X(8.2), COUPLER_Y); }),
  };
}

const c62 = (v?: ParamValues) => (resolveParams([UNIT_PARAM], v).unit === "tender" ? c62Tender() : c62Spec());
const d51 = (v?: ParamValues) => { const p = resolveParams(D51_PARAMS, v); return p.unit === "tender" ? d51TenderSpec() : d51Spec(p.variant as D51Variant); };
export function jnrC62(v?: ParamValues): MeshBuilder { return buildLoco(c62(v)); }
export function jnrC62Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(c62(v)); }
export function jnrD51(v?: ParamValues): MeshBuilder { return buildLoco(d51(v)); }
export function jnrD51Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(d51(v)); }
export const jnrSteamSpec = (id: string, v?: ParamValues): LocoSpec => (id === "proc-vehicle-jnr-c62" ? c62(v) : d51(v));

// ---------------------------------------------------------------------------
// EF66: a Bo-Bo-Bo electric with the "brow" nose at both ends

export const EF66_LENGTH = 18.2;
const EF66_BODY = EF66_LENGTH - 2 * 0.45;
const EF66_NOSE: NoseShape = { len: 0.9, tip: 0.86, power: 3.0, C: [[0, 3.0], [0.25, 3.35], [0.6, 3.52], [0.9, 3.6]], S: [[0, 2.3], [0.3, 3.0], [0.9, 3.3]], Y: [[0, 1.75], [0.5, 1.5]], A: [[0, 1.3], [0.4, 1.15]], B: [[0, 1.25], [0.3, 1.05]] };
const EF66_SPEC: CarbodySpec = { length: EF66_BODY, W: 1.4, Y: 1.5, S: 3.3, C: 3.6, lean: 0.97, arc: 6, B: 1.05, wl: 1.35, A: 1.15, wa: 1.39, front: EF66_NOSE, rear: EF66_NOSE, edges: [], step: 1.0, noseStep: 0.15 };
const EF66_TRUCKS = [6.1, 0, -6.1];
const EF66_LIVERIES: Record<string, { title: string; palette: Record<string, MaterialSpec>; bands: ReadonlyArray<readonly [number, number, string]>; roof: string; nose: string }> = {
  jnr: { title: "JNR blue, cream", palette: { blue: c("#2a4f9a"), cream: c("#efe3c2"), roofG: c("#7d8084", 0.6) }, bands: [[0, 1.42, "cream"], [1.42, 9, "blue"]], roof: "roofG", nose: "cream" },
  jrFreight: { title: "JR Freight", palette: { lightBlue: c("#6fa8d6"), grey: c("#c9ccce"), navy: c("#2a3f6a"), roofG: c("#7d8084", 0.6) }, bands: [[0, 1.42, "navy"], [1.42, 2.35, "lightBlue"], [2.35, 9, "grey"]], roof: "roofG", nose: "grey" },
};
const EF66_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: EF66_LIVERIES.jnr!.title, jrFreight: EF66_LIVERIES.jrFreight!.title })];

export function jnrEf66(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const m = new MeshBuilder({ ...CARBODY_PALETTE, under: c("#2a2c2f", 0.85), ...l.palette });
  const b = carbody({ ...EF66_SPEC, edges: [...new Set(l.bands.flatMap(([p, q]) => [p, q]))].filter((y) => y > 1.51 && y < 3.29) });
  const tip = EF66_LENGTH / 2 - 0.45;
  const X = (d: number) => tip - d;
  const base = bandPainter(l.bands, l.roof, "under", l.bands[0]![2]);
  m.scope("body", () => {
    m.scope("shell", () => carbodyShell(m, b, X, (d, y, r) => ((d < 0.5 || EF66_BODY - d < 0.5) && r !== "arc" && r !== "bottom" && y < 2.4 ? l.nose : base(d, y, r))));
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const d of [1.3, EF66_BODY - 2.1]) sidePanel(m, b, X, s, "glass", d, d + 0.75, 2.45, 3.05, 0.01, 0.004);
        for (let i = 0; i < 6; i++) sidePanel(m, b, X, s, "grille", 3.3 + i * 1.75, 4.6 + i * 1.75, 2.35, 3.0, 0.006, 0.02);
        sideLettering(m, b, X, s, "EF66 27", EF66_BODY / 2, 1.75, 0.22, "white", 0.012);
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      const at = (d: number) => (e > 0 ? d : EF66_BODY - d);
      m.scope("windscreen", () => {
        for (const s of [1, -1]) {
          const [d0, d1] = e > 0 ? [0.08, 0.62] : [at(0.62), at(0.08)];
          crownPane(m, b, X, s, "rubber", [d0, d1], [0.08, 1.05], 0.01, 4, 3);
          crownPane(m, b, X, s, "cabGlass", [d0 + 0.04, d1 - 0.04], [0.12, 1.0], 0.03, 4, 3);
        }
      });
      faceLamps(m, e, e * X(at(0)) + 0.0, [[-0.85, 1.9, 0.1, "lampHead"], [0.85, 1.9, 0.1, "lampHead"], [-1.1, 1.6, 0.06, "lampRed"], [1.1, 1.6, 0.06, "lampRed"]]);
      m.scope("skirt", () => block(m, "under", ...(e > 0 ? [tip - 0.35, tip + 0.02] : [-tip - 0.02, -tip + 0.35]) as [number, number], 0.35, 1.1, -1.25, 1.25));
      m.scope("coupler", () => knuckleCoupler(m, e, tip - 0.25, EF66_LENGTH / 2, COUPLER_Y));
    });
  m.scope("roof", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * 5.0, roofY: 3.6, baseY: 3.9, raised: e < 0 }));
  });
  m.scope("running gear", () => {
    const spec: BogieSpec = { axles: [-1.25, 1.25], wheelR: 0.56, frameHalf: 1.95, frameTop: 1.0, frameBottom: 0.62, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.45, 0.45], secondaryZ: 1.1, bolster: 1.05 };
    EF66_TRUCKS.forEach((x, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => bogieGeometry(m, x, spec))));
  });
  return m;
}

export function jnrEf66Lod(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const tip = EF66_LENGTH / 2 - 0.45;
  const body: UnitBody = {
    y0: 1.05, hw: [[1.05, 1.35], [1.5, 1.4], [3.3, 1.36], [3.6, 0.5]], side: [...l.bands.map(([a, e, mt]): [number, number, string] => [Math.max(a, 1.05), Math.min(e, 3.3), mt]).filter(([a, e]) => e > a), [3.3, 3.6, l.roof]], roof: l.roof,
    front: { tip: [[1.05, tip], [3.6, tip - 0.85]], setback: [[1.05, 0.3], [3.6, 0.3]], windows: [{ u: [-1.0, 1.0], y: [2.45, 3.1], mat: LOD_GLASS }] },
    rear: { tip: [[1.05, -tip], [3.6, -tip + 0.85]], setback: [[1.05, 0.3], [3.6, 0.3]], windows: [{ u: [-1.0, 1.0], y: [2.45, 3.1], mat: LOD_GLASS }] },
  };
  const parts = [...bogieParts(EF66_TRUCKS.map((x) => [x, 1.95] as const), 1.05), ...pantographParts([-5.0, 5.0], 3.6, 3.9)];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// DD51: the centre-cab diesel-hydraulic on two powered trucks and an idle one

const DD51_TRUCK = (r: number): BogieSpec => ({ axles: [-1.1, 1.1], wheelR: r, frameHalf: 1.75, frameTop: 0.95, frameBottom: 0.58, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: 1.0 });
export const DD51_SPEC: UsHoodSpec = {
  length: 18.0, endSill: 8.45, deck: 1.3, sillBottom: 1.0, deckHalf: 1.47,
  hood: { x0: -8.2, x1: -1.35, half: 1.12, top: 3.35, r: 0.18 },
  front: { kind: "highHood", x0: 1.35, x1: 8.2 },
  cab: { x0: -1.35, x1: 1.35, half: 1.47, top: 3.96, kind: "classic" },
  radiator: { x0: -8.0, x1: -6.3, kind: "grilles", fans: [-7.15], fanR: 0.5 },
  exhaustX: -3.6,
  trucks: { centre: 5.9, sideFrame: "blomberg", spec: DD51_TRUCK(0.43), middle: DD51_TRUCK(0.43) },
  tank: { x0: 2.4, x1: 3.9, y0: 0.5, half: 1.2 },
  ditchLights: false,
};
const DD51_LIVERIES: Record<string, UsLivery> = {
  jnr: {
    title: "JNR red", railroad: "", letterH: 0.3, letterY: 1.0, number: "DD51 842",
    palette: { ddRed: c("#c8462a"), ddGrey: c("#8f9396", 0.6), ddWhite: c("#efefea") },
    body: [[0, 9, "ddRed"]], roof: "ddGrey", frame: "ddGrey", sillStripe: [0.04, 0.12, "ddWhite"], trucks: "underframe", pilot: "ddGrey",
    letter: "ddWhite", numberMat: "ddWhite", rails: "ddWhite",
  },
  hokutosei: {
    title: "Hokutosei blue", railroad: "", letterH: 0.3, letterY: 1.0, number: "DD51 1100",
    palette: { ddBlue: c("#1d3f80"), ddGold: c("#c9a55a", 0.35), ddGrey: c("#8f9396", 0.6) },
    body: [[0, 2.1, "ddBlue"], [2.1, 2.16, "ddGold"], [2.16, 9, "ddBlue"]], roof: "ddGrey", frame: "ddBlue", sillStripe: [0.04, 0.12, "ddGold"], trucks: "underframe", pilot: "ddBlue",
    letter: "ddGold", numberMat: "ddGold", rails: "ddGold",
  },
};
const DD51_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: "JNR red", hokutosei: "Hokutosei blue" })];
export function jnrDd51(v?: ParamValues): MeshBuilder { return buildUsHood(DD51_SPEC, DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }
export function jnrDd51Lod(v?: ParamValues): MeshBuilder { return usHoodLod(DD51_SPEC, DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }

// ---------------------------------------------------------------------------
// The Blue Train: a 24-series sleeper and dining car

export type BlueTrainCar = "sleeper" | "dining";
const BLUE_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { sleeper: "Sleeper", dining: "Dining car" })];
export const BLUE_LENGTH = 20.8;
const BLUE_BODY = BLUE_LENGTH - 0.5;
const BLUE_PAL = { btBlue: c("#1d3576"), btWhite: c("#e6e8ea", 0.35), btRoof: c("#3b4351", 0.6), under: c("#2a2c2f", 0.85) };

function blueDef(u: BlueTrainCar): CarDef {
  const L = BLUE_BODY;
  const n = u === "sleeper" ? 13 : 8;
  const w = u === "sleeper" ? 0.95 : 1.35;
  const spans = Array.from({ length: n }, (_, i): [number, number] => { const d = 2.2 + (L - 3.6) * ((i + 0.5) / n); return [d - w / 2, d + w / 2]; });
  return {
    spec: { length: L, W: 1.475, Y: 1.35, S: 3.3, C: 3.93, lean: 0.98, arc: 6, B: 1.0, wl: 1.42, A: 1.1, wa: 1.47, edges: [], step: 1.0, cuts: [L / 2 - 7.075, L / 2 + 7.075].map((d) => [d - 1.6, d + 1.6] as const) },
    bands: [[0, 1.25, "btBlue"], [1.25, 1.29, "btWhite"], [1.29, 1.33, "btBlue"], [1.33, 1.37, "btWhite"], [1.37, 1.41, "btBlue"], [1.41, 1.45, "btWhite"], [1.45, 9, "btBlue"]],
    roof: "btRoof", skirt: "btBlue", under: "under",
    windows: [{ y: [2.0, 2.8], spans, frame: "rubber" }],
    doors: { spans: [[0.5, 1.2]], y: [1.15, 3.0], glass: [2.05, 2.6] },
    cabEnds: [], diaphragm: [1.2, 3.1],
    trucks: [L / 2 - 7.075, L / 2 + 7.075], truck: { axles: [-1.05, 1.05], wheelR: 0.43, frameHalf: 1.65, frameTop: 0.92, frameBottom: 0.55, frameZ: [0.92, 1.04], primary: "coil", secondary: [-0.42, 0.42], secondaryZ: 1.1, bolster: 1.0 },
    coupler: "knuckle", couplerY: COUPLER_Y, gap: [0.25, 0.25],
    lettering: [{ text: u === "sleeper" ? "OHANE 25" : "SHISHI 24", d: L - 2.0, y: 1.6, h: 0.12, mat: "btWhite" }],
    extras: (m, _b, X) => m.scope("underfloor", () => block(m, "under", X(L / 2 + 4.6), X(L / 2 - 4.6), 0.5, 1.01, -1.1, 1.1)),
  };
}

export function blueTrain24(v?: ParamValues): MeshBuilder {
  const u = resolveParams(BLUE_PARAMS, v).unit as BlueTrainCar;
  const m = new MeshBuilder({ ...INTERIOR_PALETTE, ...CARBODY_PALETTE, ...BLUE_PAL });
  drawCar(m, blueDef(u), (d) => BLUE_LENGTH / 2 - 0.25 - d);
  return m;
}
export function blueTrain24Lod(v?: ParamValues): MeshBuilder {
  const u = resolveParams(BLUE_PARAMS, v).unit as BlueTrainCar;
  const def = blueDef(u);
  const X = (d: number) => BLUE_LENGTH / 2 - 0.25 - d;
  const side: LodBand[] = [[1.0, 3.3, "btBlue"], [3.3, 3.93, "btRoof"]];
  const sp = def.windows[0]!.spans;
  const body: UnitBody = { y0: 1.0, hw: [[1.0, 1.42], [1.35, 1.475], [3.3, 1.45], [3.93, 0.4]], side, roof: "btRoof", front: { tip: [[1.0, X(0)]] }, rear: { tip: [[1.0, X(BLUE_BODY)]] },
    windows: [{ u: [X(sp[sp.length - 1]![1]), X(sp[0]![0])], y: [2.0, 2.8], mat: LOD_GLASS }] };
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...BLUE_PAL }, bodies: [body], parts: bogieParts(def.trucks.map((d) => [X(d), 1.65] as const), 1.0) }, 100);
}

// ---------------------------------------------------------------------------

const steamGame = (weight: number, power: number, maxspeed: number, tender: number, extra: GameProperties["variants"] = []): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }, ...(extra ?? [])],
});

export const JNR_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-jnr-c62", title: "JNR C62", build: jnrC62, buildLod: jnrC62Lod, params: [UNIT_PARAM], game: steamGame(89, 1210, 100, 56), catalog: STEAM_CATALOG, references: "jnr-c62" },
  { id: "proc-vehicle-jnr-d51", title: "JNR D51", build: jnrD51, buildLod: jnrD51Lod, params: D51_PARAMS, game: steamGame(78, 950, 85, 47, [{ params: { unit: "tender", variant: "namekuji" }, weight: 47, power: 0 }]), catalog: STEAM_CATALOG, references: "jnr-d51" },
  { id: "proc-vehicle-jnr-ef66", title: "JNR EF66", build: jnrEf66, buildLod: jnrEf66Lod, params: EF66_PARAMS, game: { weight: 101, power: 3900, maxspeed: 110, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "jnr-ef66" },
  { id: "proc-vehicle-jnr-dd51", title: "JNR DD51", build: jnrDd51, buildLod: jnrDd51Lod, params: DD51_PARAMS, finishParams: ["livery"], game: { weight: 84, power: 1640, maxspeed: 95, accel: null }, catalog: DIESEL_LOCO_CATALOG, references: "jnr-dd51" },
  { id: "proc-vehicle-blue-train-24", title: "Blue Train 24 series", build: blueTrain24, buildLod: blueTrain24Lod, params: BLUE_PARAMS, game: { weight: 33, power: 0, maxspeed: 110, accel: null, variants: [{ params: { unit: "dining" }, weight: 38 }] }, catalog: COACH_CATALOG, references: "blue-train-24" },
];
