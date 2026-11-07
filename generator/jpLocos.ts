// JNR locomotives and the Blue Train: the C62 4-6-4 express and the D51 2-8-2
// freight steam locomotives (the steam kit, steamLoco.ts), the EF66 Bo-Bo-Bo
// electric (the carbody kit), the DD51 centre-cab diesel (its own builder,
// jnrDd51.ts) and a 24-series Blue Train sleeper coach (the car builder,
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
import { sideLettering, sidePanel } from "./sliceBody.ts";
import { CARBODY_PALETTE, bandPainter, carbody, carbodyShell, endDiaphragm, faceLamps, type CarbodySpec, type NoseShape } from "./carbodyKit.ts";
import { bodyHalf, cabFaceLod, drawCabFace, type FacePaint, type FaceRect, type SeriesCabFace } from "./seriesCab.ts";
import { knuckleCoupler } from "./usHoodKit.ts";
import { DD51_LIVERIES, buildDd51, dd51Lod } from "./jnrDd51.ts";
import { diamond } from "./czElectricKit.ts";
import { INTERIOR_PALETTE } from "./interior.ts";
import { drawCar, type CarDef } from "./usTransit.ts";
import { COACH_CATALOG } from "./csdCoaches.ts";
import { enumParam } from "./emuParts.ts";
import { LOD_GLASS, type LodBand } from "./lodKit.ts";
import { bogieParts, fitUnit, pantographParts, type UnitBody } from "./lodUnits.ts";
import { sideDecal, type SliceBody } from "./sliceBody.ts";
import { decalX, decalZ } from "./usHoodKit.ts";
import { ngon, type Ring } from "./meshCore.ts";
import type { Pt } from "./sliceLoft.ts";

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
  paint: c("#1b1c1e", 0.35), wheel: c("#1b1c1e", 0.55), frame: c("#1b1c1e", 0.65), crimson: c("#8a2a22", 0.5), lining: c("#e8e6df", 0.55),
  beam: c("#1b1c1e", 0.6), smokebox: c("#2a2b2e", 0.5), rim: c("#46474b", 0.45), tyre: c("#cfcdc6", 0.5),
  plate: c("#1b1c1e", 0.45), plateText: { color: "#c9a64e", metallic: 0.5, roughness: 0.35 },
  stainless: { color: "#c9cdd1", metallic: 0.6, roughness: 0.3 }, marker: { color: "#b3221d", roughness: 0.3 },
  knuckle: c("#3a3b3d", 0.7), handrail: c("#c9ccce", 0.5),
};

const C62_LENGTH = 13.1;
const C62_TENDER_LENGTH = 8.375;
/** The running board: the front deck, the slope behind the deflectors' foot, the board, the hump by the firebox and the cab step. */
const C62_BOARD: Array<[number, number]> = [[0.25, 1.22], [0.6, 1.22], [1.66, 2.27], [9.0, 2.27], [9.2, 2.47], [9.85, 2.47], [10.05, 2.07], [10.8, 2.07]];
const C62_DEFLECTOR_Z = 1.41;
/** The dome casing's section: near-vertical sides rising out of the boiler into a round top. */
const C62_CASING: Array<[number, number]> = [[-0.42, 3.2], [0.42, 3.2], [0.42, 3.6], [0.39, 3.76], [0.31, 3.88], [0.17, 3.95], [0, 3.97], [-0.17, 3.95], [-0.31, 3.88], [-0.39, 3.76], [-0.42, 3.6]];
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
    // the door's rim, catching the light round the round door
    t.m.tube("rim", "x", 0, 2.75, 0.75, 0.69, t.X(1.1) + 0.05, t.X(1.1) + 0.079, 28);
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
    boiler: { x0: 1.1, x1: 9.5, y: 2.75, r: 0.87, smokebox: 2.4, bands: [3.9, 7.7, 8.9], band: "rim", n: 28 },
    chimney: { x: 2.42, top: 3.98, r: 0.3 },
    // the long casing over the sand and steam domes: a rounded loaf, its ends tapering down
    volumes: [{ name: "dome casing", sec: C62_CASING, plan: [[4.18, 0.2], [4.35, 0.36], [4.6, 0.42], [7.0, 0.42], [7.25, 0.36], [7.42, 0.2]],
      top: [[4.18, 3.62], [4.35, 3.84], [4.6, 3.95], [7.0, 3.95], [7.25, 3.84], [7.42, 3.62]], bands: [[3.2, 4.0, "paint"]] }],
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
          t.sideBox("lining", s, 0.3, 7.15, 3.09, 3.17, 1.42, 1.455);
          t.sideBox("lining", s, 7.15, 8.15, 2.79, 2.87, 1.42, 1.455);
          t.sideBox("lining", s, 7.12, 7.15, 2.87, 3.09, 1.42, 1.455);
        }
      });
      t.m.scope("water filler", () => t.cylY("black", 7.65, 0, 2.85, 3.0, 0.3, 12));
      t.m.scope("front bulkhead", () => {
        // the coal space's front plate standing over the cab's gangway, the tool boxes at its corners
        t.box("paint", 0.3, 0.42, 3.15, 3.55, -0.95, 0.95);
        for (const s of [-1, 1]) t.sideBox("paint", s, 0.3, 1.0, 3.15, 3.5, 0.95, 1.4);
        // the sloping coal floor's rear wall behind the heap
        t.box("paint", 6.7, 7.15, 3.15, 3.3, -1.4, 1.4);
      });
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
// the distant C62 draws its rounded dome casing as one of the kit's domes (a volume shell would not fit 100 triangles)
export function jnrC62Lod(v?: ParamValues): MeshBuilder { const s = c62(v); return steamLocoLod(s.volumes ? { ...s, volumes: undefined, domes: [{ x: 5.8, top: 3.95, r: 0.42, len: 3.24 }] } : s); }
export function jnrD51(v?: ParamValues): MeshBuilder { return buildLoco(d51(v)); }
export function jnrD51Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(d51(v)); }
export const jnrSteamSpec = (id: string, v?: ParamValues): LocoSpec => (id === "proc-vehicle-jnr-c62" ? c62(v) : d51(v));

// ---------------------------------------------------------------------------
// EF66: a Bo-Bo-Bo electric with the same cab at both ends (docs/models/jnr-locos.md,
// "The EF66"): the windscreen leaning back under the raised cab roof's visor, a blue shelf
// sloping down from it to the brow, the cream front under the brow with the number plate on
// its gold vee, the louvred grille between two lamp housings at the chamfered corners, and the
// grey skirt; drawn as a cab face (seriesCab.ts) on a square-ended carbody. d_f is metres back
// from a face's tip plane; the body runs between the two faces' joins.

export const EF66_LENGTH = 18.2;
/** Body length (17,100 mm), the face's join behind its tip, the tip plane's model x. */
const EF66_BODY_LENGTH = 17.1;
const EF66_JOIN = 0.95;
const EF66_TIP = EF66_BODY_LENGTH / 2;
/** The raised cab roof ends this far behind the tip; the body's roof (3,670 mm) is lower behind it. */
const EF66_HUMP = 1.65;
const EF66_CAB_ROOF = 3.87;
const EF66_ROOF = 3.67;
/** Bogie centres 5,300 mm apart, wheelbase 2,800 mm, wheels 1,120 mm. */
const EF66_TRUCKS = [5.3, 0, -5.3];
const EF66_PAN = 5.65;
/** The cab hump's crown and shoulder over the body's d (the body starts at the join). */
const EF66_CAB: NoseShape = { len: 0.01, tip: 1, power: 2, C: [[0, EF66_CAB_ROOF], [EF66_HUMP - EF66_JOIN - 0.08, EF66_CAB_ROOF], [EF66_HUMP - EF66_JOIN, EF66_ROOF]], S: [[0, 3.62], [EF66_HUMP - EF66_JOIN - 0.08, 3.62], [EF66_HUMP - EF66_JOIN, 3.5]] };
const EF66_SPEC: CarbodySpec = { length: EF66_BODY_LENGTH - 2 * EF66_JOIN, W: 1.4, Y: 1.4, S: 3.5, C: EF66_ROOF, lean: 0.98, arc: 6, B: 1.32, wl: 1.39, A: 1.36, wa: 1.4, front: EF66_CAB, rear: EF66_CAB, edges: [], step: 2.0, noseStep: 0.2 };
/** The seven upper windows and the louvres under them: starts behind the tip, pitch, widths. */
const EF66_WIN0 = 2.53, EF66_PITCH = 1.74, EF66_WIN_W = 1.575;
/** The number plate ([lat, y] corners) and the gold vee behind it, as the convex pieces round the plate. */
const EF66_PLATE = { lat: [-0.37, 0.37], y: [2.44, 2.64] } as const;
const EF66_VEE: Pt[][] = [
  [[-0.63, 2.665], [0.63, 2.665], [0.596, 2.64], [-0.596, 2.64]],
  [[-0.596, 2.64], [-0.37, 2.64], [-0.37, 2.478]], [[0.37, 2.64], [0.596, 2.64], [0.37, 2.478]],
  [[-0.284, 2.44], [0.284, 2.44], [0, 2.335]],
];

interface Ef66Livery {
  title: string;
  number: string;
  palette: Record<string, MaterialSpec>;
  /** The body's side bands (bottom up) and its roof; the cab roof's colour. */
  side: ReadonlyArray<readonly [number, number, string]>;
  roof: string;
  cabRoof: string;
  /** The face's bands, its roof from this height, its painted fields; the lamp housings' paint, the louvres' slats, the skirt. */
  face: ReadonlyArray<readonly [number, number, string]>;
  faceRoofFrom: number;
  fields: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  decals?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  pod: string;
  slat: string;
  skirt: string;
  /** Paint over the face's cab sides (seriesCab.ts `paint`) and over the body's sides: polygons in [d_f, y]. */
  cabPaint?: ReadonlyArray<{ mat: string; front: readonly Pt[]; back: readonly Pt[]; top?: number }>;
  sweeps?: ReadonlyArray<{ mat: string; pts: readonly Pt[] }>;
  /** The distant model's face and side bands (the vee and the side band as level bands). */
  lodFace: ReadonlyArray<readonly [number, number, string]>;
  lodSide?: ReadonlyArray<readonly [number, number, string]>;
}

/** The face's bands: `lower` up to the brow, `upper` over it, the stainless windscreen frame. */
const ef66FaceBands = (lower: string, upper: string, brow = 2.72): Array<readonly [number, number, string]> => [[0, brow, lower], [brow, 3.05, upper], [3.05, 3.61, "frameSilver"], [3.61, 9, upper]];

const EF66_LIVERIES: Record<string, Ef66Livery> = {
  // JNR blue No. 15 and cream No. 1 (EF66 27, 11, 35): the cream front under the brow, narrowing
  // between the lamp housings; a cream stripe along the sides at the grille's height
  jnr: {
    title: "JNR blue, cream", number: "EF66 27",
    palette: { efBlue: c("#22468c", 0.45), efCream: c("#ece0bf", 0.45), efRoof: c("#8d9093", 0.6), efSkirt: c("#aeb4b9", 0.55), efGold: c("#b49048", 0.35), efPlate: c("#203c78", 0.4) },
    side: [[0, 1.92, "efBlue"], [1.92, 2.02, "efCream"], [2.02, 9, "efBlue"]], roof: "efRoof", cabRoof: "efBlue",
    lodFace: [[0, 1.69, "efBlue"], [1.69, 2.72, "efCream"], [2.72, 9, "efBlue"]],
    face: [[0, 2.27, "efBlue"], ...ef66FaceBands("efCream", "efBlue").map(([a, z, mt]) => [Math.max(a, 2.27), z, mt] as const)], faceRoofFrom: 9,
    // the cream between the lamp housings down to the blue skirt band, the side stripe on the corners
    fields: [
      { mat: "efCream", pts: [[-0.91, 1.69], [0.91, 1.69], [0.91, 2.28], [-0.91, 2.28]] },
    ],
    decals: [
      ...EF66_VEE.map((pts) => ({ mat: "efGold", pts })),
      { mat: "efCream", pts: [[1.24, 1.92], [1.5, 1.92], [1.5, 2.02], [1.24, 2.02]] }, { mat: "efCream", pts: [[-1.5, 1.92], [-1.24, 1.92], [-1.24, 2.02], [-1.5, 2.02]] },
    ],
    pod: "efBlue", slat: "efBlue", skirt: "efSkirt",
  },
  // JR Freight's colours on EF66 20 (c. 1990): light grey, the blue vee over the front from
  // the corners down under the grille, a blue band along the sides falling behind the cab
  jrFreight: {
    title: "JR Freight", number: "EF66 20",
    palette: { jfGrey: c("#d8dad5", 0.45), jfBlue: c("#2458a8", 0.45), jfRoof: c("#8f8a7f", 0.6), jfSkirt: c("#9ebfcf", 0.55), efPlate: c("#203c78", 0.4) },
    side: [[0, 9, "jfGrey"]], roof: "jfRoof", cabRoof: "jfRoof",
    lodFace: [[0, 2.0, "jfGrey"], [2.0, 2.72, "jfBlue"], [2.72, 9, "jfGrey"]], lodSide: [[0, 2.2, "jfGrey"], [2.2, 2.6, "jfBlue"], [2.6, 9, "jfGrey"]],
    face: ef66FaceBands("jfGrey", "jfGrey"), faceRoofFrom: 3.71,
    fields: [{ mat: "jfBlue", pts: [[-1.6, 2.72], [-0.64, 2.72], [0, 2.0], [0.64, 2.72], [1.6, 2.72], [1.6, 2.3], [0, 1.6], [-1.6, 2.3]] }],
    pod: "black", slat: "jfGrey", skirt: "jfSkirt",
    cabPaint: [{ mat: "jfBlue", front: [[2.3, 0.12], [2.72, 0.12]], back: [[2.3, 1.2], [2.72, 1.2]], top: 2.72 }],
    sweeps: [{ mat: "jfBlue", pts: [[0, 2.3], [2.6, 2.3], [5.6, 2.18], [EF66_BODY_LENGTH - 5.6, 2.18], [EF66_BODY_LENGTH - 2.6, 2.3], [EF66_BODY_LENGTH, 2.3], [EF66_BODY_LENGTH, 2.9], [EF66_BODY_LENGTH - 2.6, 2.9], [EF66_BODY_LENGTH - 5.6, 2.45], [5.6, 2.45], [2.6, 2.9], [0, 2.9]] }],
  },
};
const EF66_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: EF66_LIVERIES.jnr!.title, jrFreight: EF66_LIVERIES.jrFreight!.title })];

/** The cab face of one livery: profile measured from EF66 11, 27 and 35 (assets/jnr-ef66/). */
function ef66Face(l: Ef66Livery): SeriesCabFace {
  const plate: FaceRect = { ...EF66_PLATE, r: 0, mat: "efPlate" };
  const strip = (lat: number, w: number, y0: number, y1: number, mat = "frameSilver") => ({ mat, pts: [[lat - w / 2, y0], [lat + w / 2, y0], [lat + w / 2, y1], [lat - w / 2, y1]] as Pt[], fine: 1 });
  return {
    dJoin: EF66_JOIN, dSide: 0.93, roofFrom: l.faceRoofFrom, cols: [4, 2, 1, 1], tolerance: 0.05, reach: 0.55,
    // upright from the skirt to the brow, the shelf sloping back to the windscreen's foot, the
    // windscreen leaning back under the visor, the cab roof rounding up behind the visor's lip
    profile: [[1.32, 0.02], [1.4, 0], [2.72, 0], [2.76, 0.03], [3.0, 0.33], [3.05, 0.38], [3.62, 0.6], [3.645, 0.47], [3.71, 0.44], [3.79, 0.52], [3.85, 0.68], [EF66_CAB_ROOF, EF66_JOIN]],
    // chamfered corners: small at the lamp housings, wider at the windscreen's corner panes
    corner: [[1.32, 0.22], [2.72, 0.22], [2.76, 0.24], [3.05, 0.36], [3.62, 0.4], [3.71, 0.42], [EF66_CAB_ROOF, 0.3]],
    cornerDepth: [[1.32, 0.22], [2.72, 0.22], [3.05, 0.38], [3.62, 0.3], [3.71, 0.36], [3.85, 0.22], [EF66_CAB_ROOF, 0]],
    rows: [1.32, 1.4, 2.72, 2.76, 3.0, 3.05, 3.62, 3.645, 3.71, 3.79, 3.85, EF66_CAB_ROOF],
    bands: () => l.face, lodBands: l.lodFace,
    fields: l.fields,
    ...(l.cabPaint ? { paint: l.cabPaint } : {}),
    masks: [
      // the louvred grille's opening, the number plate
      { lat: [-0.91, 0.91], y: [1.81, 2.07], r: 0, mat: "black" },
      plate,
    ],
    // one pane across the windscreen and round its corners; the stainless pillars over it
    panes: [{ lat: [-1.6, 1.6], y: [3.09, 3.57], r: 0 }],
    decals: [
      strip(0, 0.08, 3.09, 3.57), ...[-1, 1].map((sd) => ({ ...strip(sd * 1.0, 0.07, 3.09, 3.57), fine: 2 })),
      // the grille's five chromed slats
      ...[0, 1, 2, 3, 4].map((i) => strip(0, 1.76, 1.83 + i * 0.048, 1.853 + i * 0.048)),
      ...(l.decals ?? []).map((dc) => ({ ...dc, fine: 1 })),
    ],
    pods: [-1, 1].flatMap((s) => [
      // the tall housing at each corner, the headlight over the tail light
      { lat: s * 1.08, y: 2.105, w: 0.34, h: 0.32, r: 0.05, proud: 0.125, depth: 0.3, mat: l.pod, lamps: [[0, 0.1, "lampHead"]] as Array<[number, number, string]> },
      { lat: s * 1.08, y: 1.795, w: 0.34, h: 0.32, r: 0.05, proud: 0.12, depth: 0.3, mat: l.pod, lamps: [[0, 0.088, "lampRed"]] as Array<[number, number, string]> },
    ]),
    number: { lat: -0.3, y: 2.485, h: 0.11, mat: "white" },
    wipers: [[[-0.62, 3.12], [-0.28, 3.47]], [[0.32, 3.12], [0.66, 3.47]]],
    lod: { profile: [[1.32, 0], [2.72, 0], [3.05, 0.38], [3.62, 0.6], [EF66_ROOF, 0.95]], corner: [[1.32, 0.22], [3.05, 0.36], [EF66_ROOF, 0.4]], rows: [1.32, 2.72, 3.05, 3.62, EF66_ROOF] },
  };
}

const ef66Paint = (l: Ef66Livery): FacePaint => ({ sides: l.side, face: l.face, roof: l.cabRoof, skirt: l.side[0]![2], S: 3.62, A: 1.36, number: l.number });

export function jnrEf66(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const m = new MeshBuilder({ ...CARBODY_PALETTE, under: c("#2a2c2f", 0.85), ...l.palette });
  const L = EF66_BODY_LENGTH;
  const b = carbody({ ...EF66_SPEC, edges: [...new Set(l.side.flatMap(([p, q]) => [p, q]))].filter((y) => y > 1.41 && y < 3.49) });
  // body d from the front face's tip plane (d_f), as the photographs were measured
  const X = (df: number) => EF66_TIP - EF66_JOIN - df;
  const Bd = (df: number) => df - EF66_JOIN;
  const base = bandPainter(l.side, l.roof, "under", l.side[0]![2]);
  const face = ef66Face(l), fp = ef66Paint(l), half = bodyHalf(b, 0);
  m.scope("body", () => {
    // the raised cab roofs keep the cab's colour
    m.scope("shell", () => carbodyShell(m, b, X, (d, y, r) => (r === "arc" && (d < EF66_HUMP - EF66_JOIN + 0.01 || b.length - d < EF66_HUMP - EF66_JOIN + 0.01) ? l.cabRoof : base(d, y, r))));
    // both sides alike, the two cab ends mirrored: [d_f0, d_f1] from the front end, or from the rear
    const span = (e: number, a: number, z: number): [number, number] => (e > 0 ? [Bd(a), Bd(z)] : [Bd(L - z), Bd(L - a)]);
    for (const s of [1, -1])
      m.scope(s > 0 ? "right side" : "left side", () => {
        for (const e of [1, -1])
          m.scope(e > 0 ? "front cab" : "rear cab", () => {
            m.scope("cab window", () => {
              sidePanel(m, b, X, s, "rubber", ...span(e, 0.98, 1.36), 3.06, 3.56, 0.008, 0.004);
              sidePanel(m, b, X, s, "cabGlass", ...span(e, 1.01, 1.33), 3.09, 3.53, 0.012, 0.004);
            });
            m.scope("door", () => {
              for (const [a, z, y0, y1] of [[1.7, 1.725, 1.45, 3.45], [2.395, 2.42, 1.45, 3.45], [1.725, 2.395, 3.425, 3.45]] as const) sidePanel(m, b, X, s, "rubber", ...span(e, a, z), y0, y1, 0.006, 0.004);
              sidePanel(m, b, X, s, "rubber", ...span(e, 1.85, 2.11), 2.62, 3.3, 0.008, 0.004);
              sidePanel(m, b, X, s, "cabGlass", ...span(e, 1.875, 2.085), 2.645, 3.275, 0.012, 0.004);
            });
            m.scope("handrails", () => {
              for (const a of [1.66, 2.46]) {
                const [d] = span(e, a, a), q = X(d), z = s * (1.4 * 0.995 + 0.07);
                m.rod("handrail", [q, 1.7, z], [q, 3.0, z], 0.016, 6);
              }
            });
          });
        m.scope("windows", () => {
          for (let i = 0; i < 7; i++) {
            const d0 = EF66_WIN0 + i * EF66_PITCH;
            sidePanel(m, b, X, s, "frameSilver", Bd(d0), Bd(d0 + EF66_WIN_W), 2.98, 3.32, 0.008, 0.004);
            sidePanel(m, b, X, s, "cabGlass", Bd(d0 + 0.03), Bd(d0 + EF66_WIN_W - 0.03), 3.0, 3.3, 0.012, 0.004);
          }
        });
        m.scope("louvres", () => {
          for (let i = 0; i < 7; i++) {
            const d0 = EF66_WIN0 + 0.02 + i * EF66_PITCH, d1 = d0 + EF66_WIN_W - 0.04;
            sidePanel(m, b, X, s, "grille", Bd(d0), Bd(d1), 2.41, 2.88, 0.008, 0.004);
            // the slats as flat strips over the opening
            const tris: Pt[] = [];
            for (let k = 0; k < 8; k++) {
              const [a, z, y0, y1] = [Bd(d0 + 0.02), Bd(d1 - 0.02), 2.43 + k * 0.055, 2.46 + k * 0.055];
              tris.push([a, y0], [z, y0], [z, y1], [a, y0], [z, y1], [a, y1]);
            }
            sideDecal(m, b, X, s, l.slat, tris, 0.014);
          }
        });
        if (l.sweeps)
          m.scope("band", () => l.sweeps!.forEach((w) => {
            // a strip of quads between the band's lower and upper edges, both listed from the front
            const n = w.pts.length / 2, lo = w.pts.slice(0, n), hi = w.pts.slice(n).reverse();
            const tris: Pt[] = [];
            for (let i = 0; i + 1 < n; i++) {
              const [a, bb, cc, dd] = [lo[i]!, lo[i + 1]!, hi[i + 1]!, hi[i]!].map(([df, y]): Pt => [Bd(Math.min(L - EF66_JOIN, Math.max(EF66_JOIN, df))), y]);
              tris.push(a!, bb!, cc!, a!, cc!, dd!);
            }
            sideDecal(m, b, X, s, w.mat, tris, 0.003);
          }));
        sideLettering(m, b, X, s, l.number, Bd(L / 2), 2.12, 0.14, "frameSilver", 0.004);
      });
  });
  for (const e of [1, -1])
    m.scope(e > 0 ? "front end" : "rear end", () => {
      m.scope("cab face", () => drawCabFace(m, face, e, EF66_TIP, half, fp));
      // the grey skirt with chamfered corners, the dark plough under it, the coupler in its pocket
      const xf = EF66_TIP - 0.03;
      const ring = (x0: number, x1: number, hw: number, ch: number): Array<[number, number]> =>
        ([[x1, -hw + ch], [x1, hw - ch], [x1 - ch, hw], [x0, hw], [x0, -hw], [x1 - ch, -hw]] as Array<[number, number]>).map(([x, z]) => [e * x, z]);
      m.scope("skirt", () => m.prism(l.skirt, ring(xf - 1.15, xf, 1.28, 0.28), 0.55, 1.3));
      m.scope("plough", () => m.prism("under", ring(xf - 0.6, xf + 0.05, 1.25, 0.36), 0.2, 0.6));
      m.scope("pocket", () => block(m, "black", ...((e > 0 ? [xf - 0.01, xf + 0.006] : [-xf - 0.006, -xf + 0.01]) as [number, number]), 0.68, 1.12, -0.32, 0.32));
      m.scope("coupler", () => knuckleCoupler(m, e, EF66_TIP - 0.25, EF66_LENGTH / 2, COUPLER_Y));
    });
  m.scope("roof", () => {
    for (const e of [1, -1]) m.scope(e > 0 ? "front pantograph" : "rear pantograph", () => diamond(m, { xc: e * EF66_PAN, roofY: EF66_ROOF, baseY: 3.95, raised: e < 0 }));
    // the hatches over the machinery room, the high-tension line between the pantographs on its insulators
    m.scope("hatches", () => { for (const [x0, x1] of [[-3.7, -1.3], [-1.1, 1.1], [1.3, 3.7]] as const) block(m, l.roof, x0, x1, 3.6, 3.71, -0.62, 0.62); });
    m.scope("roof line", () => {
      m.rod("steel", [-EF66_PAN + 0.6, 3.86, 0.35], [EF66_PAN - 0.6, 3.86, 0.35], 0.02, 6, false);
      for (const x of [-3.0, 0, 3.0]) m.rod("insulator", [x, 3.7, 0.35], [x, 3.86, 0.35], 0.045, 6);
    });
  });
  m.scope("running gear", () => {
    const spec: BogieSpec = { axles: [-1.4, 1.4], wheelR: 0.56, frameHalf: 2.05, frameTop: 1.02, frameBottom: 0.62, frameZ: [0.92, 1.04], primary: "coil", secondary: [0], secondaryZ: 1.1, bolster: 1.05 };
    EF66_TRUCKS.forEach((x, i) => m.scope(`truck ${i + 1}`, () => m.bogie(() => bogieGeometry(m, x, spec))));
  });
  // the equipment hung under the frame between the bogies
  m.scope("underframe", () => {
    for (const s of [1, -1]) block(m, "under", ...((s > 0 ? [2.15, 3.15] : [-3.15, -2.15]) as [number, number]), 0.72, 1.31, -1.15, 1.15);
  });
  return m;
}

export function jnrEf66Lod(v?: ParamValues): MeshBuilder {
  const l = EF66_LIVERIES[resolveParams(EF66_PARAMS, v).livery!]!;
  const b = carbody({ ...EF66_SPEC, edges: [] });
  const face = ef66Face(l), fp = ef66Paint(l), half = bodyHalf(b, 0);
  const body: UnitBody = {
    y0: 1.32, hw: [[1.32, 1.39], [1.4, 1.4], [3.5, 1.37], [EF66_ROOF, 0.5]],
    side: [...(l.lodSide ?? l.side).map(([a, e, mt]): [number, number, string] => [Math.max(a, 1.32), Math.min(e, 3.5), mt]).filter(([a, e]) => e > a), [3.5, EF66_ROOF, l.roof]], roof: l.roof,
    front: cabFaceLod(face, 1, EF66_TIP, half, fp, EF66_ROOF),
    rear: cabFaceLod(face, -1, EF66_TIP, half, fp, EF66_ROOF),
    windows: [{ u: [-(EF66_TIP - EF66_WIN0), EF66_TIP - EF66_WIN0], y: [2.98, 3.32], mat: LOD_GLASS }],
  };
  const parts = [...bogieParts(EF66_TRUCKS.map((x) => [x, 2.05] as const), 1.02), ...pantographParts([-EF66_PAN, EF66_PAN], EF66_ROOF, 3.95)];
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...l.palette }, bodies: [body], parts }, 100);
}

// ---------------------------------------------------------------------------
// DD51: the centre-cab diesel-hydraulic on two powered trucks and an idle one, drawn by its own
// builder (jnrDd51.ts)

const DD51_PARAMS: ParamSpec[] = [enumParam("livery", "Livery", { jnr: "JNR red", hokutosei: "Hokutosei blue" })];
export function jnrDd51(v?: ParamValues): MeshBuilder { return buildDd51(DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }
export function jnrDd51Lod(v?: ParamValues): MeshBuilder { return dd51Lod(DD51_LIVERIES[resolveParams(DD51_PARAMS, v).livery!]!); }

// ---------------------------------------------------------------------------
// The Blue Train: the 24 series' 25-type two-tier B sleeper (OHaNe 25, 1974) and
// the OShi 24 dining car, laid out from photographs (assets/blue-train-24/SOURCES.md).
// d runs from the sleeper's door end (the dining car's kitchen end) at +X; the
// layouts below are in the prototype's metres along its 20.0 m body (`bt`).

export type BlueTrainCar = "sleeper" | "dining";
const BLUE_PARAMS: ParamSpec[] = [enumParam("unit", "Car", { sleeper: "Sleeper", dining: "Dining car" })];
export const BLUE_LENGTH = 20.8;
const BLUE_BODY = BLUE_LENGTH - 0.5;
/** The prototype's metres along its 20.0 m body to the model's d. */
const bt = (d: number) => (d * BLUE_BODY) / 20.0;
const BLUE_PAL: Record<string, MaterialSpec> = {
  btBlue: c("#1d3478"),
  btLine: { ...c("#c3c7cb", 0.3), metallic: 0.6 },
  btRoof: { ...c("#a9aeb3", 0.45), metallic: 0.4 },
  btHood: c("#80868c", 0.6),
  btFrost: c("#c6cdd3", 0.3),
  btHatch: c("#192e6a", 0.55),
  btSign: c("#eceeec", 0.4),
  under: c("#2a2c2f", 0.85),
};
/** The body's section: bottom, foot, belly, eaves and crown (from the photos' end faces), the air conditioners' top. */
const BT = { B: 1.05, A: 1.08, Y: 1.1, S: 3.55, C: 3.98, W: 1.475, lean: 0.985, hood: 4.085 };
/** The two stainless lines: one along the foot, one under the windows; both stop at the doors. */
const BT_BANDS: Array<[number, number, string]> = [[0, 1.12, "btBlue"], [1.12, 1.17, "btLine"], [1.17, 1.94, "btBlue"], [1.94, 2.0, "btLine"], [2.0, 9, "btBlue"]];

/** A window: d span (prototype metres), sill and head, corner radius, glass. */
interface BtPane { d: readonly [number, number]; y: readonly [number, number]; r: number; mat?: string }
/** A painted or grille panel on a side: d span (prototype metres), heights, material. */
interface BtPanel { d: readonly [number, number]; y: readonly [number, number]; mat: string }
interface BtSide { panes: BtPane[]; panels: BtPanel[] }
const btRow = (c0: number, pitch: number, n: number, w: number, y: readonly [number, number], r: number): BtPane[] =>
  Array.from({ length: n }, (_, i) => ({ d: [c0 + i * pitch - w / 2, c0 + i * pitch + w / 2] as const, y, r }));

/** The B sleeper's sides: wide, low berth windows on one, tall corridor windows and the washroom on the other. */
const BT_DOOR_SIGN: BtPanel = { d: [0.45, 1.05], y: [3.33, 3.45], mat: "btSign" };
const BT_DEST: BtPanel = { d: [19.0, 19.6], y: [3.08, 3.3], mat: "btSign" };
const BT_SLEEPER: { berth: BtSide; corridor: BtSide } = {
  berth: {
    panes: [{ d: [2.45, 3.05], y: [2.09, 2.78], r: 0.08 }, ...btRow(4.56, 1.866, 8, 1.15, [2.09, 2.78], 0.08),
      { d: [18.6, 19.05], y: [2.68, 2.95], r: 0.08, mat: "btFrost" }, { d: [19.3, 19.72], y: [2.68, 2.95], r: 0.08, mat: "btFrost" }],
    panels: [{ d: [1.32, 1.85], y: [1.22, 1.48], mat: "louvre" }, BT_DOOR_SIGN, BT_DEST],
  },
  corridor: {
    panes: [{ d: [1.7, 2.05], y: [2.13, 3.05], r: 0.06 }, ...btRow(3.25, 1.84, 7, 1.07, [2.09, 3.03], 0.08),
      { d: [15.75, 16.9], y: [2.09, 2.97], r: 0.08, mat: "btFrost" },
      { d: [17.5, 18.15], y: [2.58, 2.86], r: 0.13, mat: "btFrost" }, { d: [18.6, 19.25], y: [2.58, 2.86], r: 0.13, mat: "btFrost" }],
    // and two service hatches low under the toilets
    panels: [BT_DOOR_SIGN, BT_DEST, { d: [17.6, 18.2], y: [1.3, 1.66], mat: "btHatch" }, { d: [18.3, 18.9], y: [1.3, 1.66], mat: "btHatch" }],
  },
};
/** The dining car's side: the kitchen's sliding door and its rail, four windows, a vent, the dining room's five. */
const BT_DINER: BtSide = {
  panes: [...btRow(3.72, 1.58, 4, 1.2, [2.38, 3.0], 0.09), ...btRow(10.72, 1.675, 5, 1.2, [2.38, 3.0], 0.09)],
  panels: [{ d: [1.22, 3.0], y: [3.1, 3.15], mat: "rubber" }, { d: [9.3, 9.65], y: [2.08, 2.42], mat: "louvre" }, { d: [0.5, 0.98], y: [1.2, 1.48], mat: "louvre" }],
};
/** Which side (+1 the +Z side) carries the sleeper's berth windows. */
const BT_BERTH_S = -1;
/** Both end walls: corners rounded in plan, the roof dropping a little to the wall (the photos' end faces). */
const BT_END = { len: 0.3, tip: 0.85, power: 2.2, C: [[0, 3.9], [0.3, BT.C]] as Pt[], S: [[0, 3.5], [0.3, BT.S]] as Pt[] };

/** A rounded rectangle in (d, y), counter-clockwise, `n` steps a corner. */
function btRound(d0: number, d1: number, y0: number, y1: number, r: number, n = 3): Pt[] {
  const q = Math.min(r, (d1 - d0) / 2 - 0.002, (y1 - y0) / 2 - 0.002);
  const out: Pt[] = [];
  for (const [cd, cy, a0] of [[d1 - q, y1 - q, 0], [d0 + q, y1 - q, 90], [d0 + q, y0 + q, 180], [d1 - q, y0 + q, 270]] as const)
    for (let i = 0; i <= n; i++) { const a = ((a0 + (90 * i) / n) * Math.PI) / 180; out.push([cd + q * Math.cos(a), cy + q * Math.sin(a)]); }
  return out;
}
const btFan = (p: Pt[]): Pt[] => p.slice(1, -1).flatMap((v, i) => [p[0]!, v, p[i + 2]!]);
const btRing = (o: Pt[], n: Pt[]): Pt[] => o.flatMap((v, i) => { const j = (i + 1) % o.length; return [v, o[j]!, n[j]!, v, n[j]!, n[i]!]; });

/** A side's windows (a silver frame round the glass) and panels, flush on the skin. */
function btSide(m: MeshBuilder, b: SliceBody, X: (d: number) => number, s: number, side: BtSide): void {
  m.scope("windows", () => side.panes.forEach((p, i) => m.scope(`window ${i + 1}`, () => {
    const [d0, d1] = [bt(p.d[0]), bt(p.d[1])], f = 0.035;
    const glass = btRound(d0, d1, p.y[0], p.y[1], p.r);
    sideDecal(m, b, X, s, "frameSilver", btRing(btRound(d0 - f, d1 + f, p.y[0] - f, p.y[1] + f, p.r + f), glass), 0.006);
    sideDecal(m, b, X, s, p.mat ?? "glass", btFan(glass), 0.006);
  })));
  m.scope("panels", () => {
    for (const p of side.panels) sideDecal(m, b, X, s, p.mat, btFan(btRound(bt(p.d[0]), bt(p.d[1]), p.y[0], p.y[1], 0.01, 1)), 0.005);
  });
}

/** An air conditioner's housing on the roof over an end: from d0 to d1 (prototype metres), sloping into the roof beyond d1. */
function btHood(m: MeshBuilder, X: (d: number) => number, d0: number, d1: number, top: number): void {
  const z = 1.18, zt = 1.02, y0 = 3.6;
  const high: Ring = [[-z, y0], [z, y0], [z, top - 0.11], [zt, top], [-zt, top], [-z, top - 0.11]];
  const low: Ring = [[-z, y0], [z, y0], [z, 3.64], [zt, 3.7], [-zt, 3.7], [-z, 3.64]];
  const [a, e] = [X(bt(d0)), X(bt(d1))], tail = X(bt(d1 + 0.55 * Math.sign(d1 - d0)));
  m.scope("air conditioner", () => {
    m.sweep("btHood", "x", high, Math.min(a, e), high, Math.max(a, e));
    if (tail < e) m.sweep("btHood", "x", low, tail, high, e);
    else m.sweep("btHood", "x", high, e, low, tail);
    // the condensers' grilles on top and the louvres along its sides
    const [g0, g1] = [Math.min(a, e) + 0.25, Math.max(a, e) - 0.25];
    const gm = (g0 + g1) / 2;
    for (const [p, q] of [[g0, gm - 0.1], [gm + 0.1, g1]] as const)
      m.facets("louvre", [[p, top + 0.004, -0.62], [q, top + 0.004, -0.62], [q, top + 0.004, 0.62], [p, top + 0.004, -0.62], [q, top + 0.004, 0.62], [p, top + 0.004, 0.62]], [0, 1, 0]);
    for (const s of [-1, 1]) decalZ(m, "louvre", s * (z + 0.004), s, g0, g1, top - 0.26, top - 0.14);
  });
}

/** An end wall at |x| = face facing e: the gangway door inside the bellows, the tail lamps, grab rails. */
function btEnd(m: MeshBuilder, e: number, face: number): void {
  const x = e * (face + 0.004);
  // the bellows (the kit leaves them off a shaped end)
  m.scope("diaphragm", () => endDiaphragm(m, e, e * face, 1.15, 3.4, 0.42));
  m.scope("gangway door", () => {
    for (const [z0, z1, y0, y1] of [[-0.37, -0.34, 1.17, 3.28], [0.34, 0.37, 1.17, 3.28], [-0.34, 0.34, 3.25, 3.28]] as const) decalX(m, "rubber", x, e, z0, z1, y0, y1);
    decalX(m, "rubber", x, e, -0.24, 0.24, 2.42, 3.06);
    decalX(m, "glass", e * (face + 0.007), e, -0.2, 0.2, 2.46, 3.02);
  });
  m.scope("tail lamps", () => faceLamps(m, e, face, [[-0.98, 1.66, 0.075, "lampRed"], [0.98, 1.66, 0.075, "lampRed"]]));
  m.scope("grab rails", () => { for (const z of [-0.78, 0.78]) m.rod("handrail", [e * (face + 0.06), 1.35, z], [e * (face + 0.06), 2.6, z], 0.015, 6); });
}

/** The underfloor equipment between the bogies: boxes (d0, d1, bottom, z0, z1) and tanks (d0, d1, radius, y, z). */
const BT_UNDER: Record<BlueTrainCar, { boxes: Array<readonly [number, number, number, number, number]>; tanks: Array<readonly [number, number, number, number, number]> }> = {
  sleeper: {
    boxes: [[4.8, 5.8, 0.55, -0.2, 1.1], [6.1, 7.3, 0.6, -1.1, 0.4], [7.6, 8.3, 0.5, 0.2, 1.1], [10.8, 12.0, 0.6, -1.05, 0.3], [12.3, 12.9, 0.55, 0.3, 1.1]],
    tanks: [[8.6, 10.4, 0.18, 0.78, 0.7], [13.2, 15.1, 0.3, 0.68, -0.45]],
  },
  dining: {
    boxes: [[4.8, 6.0, 0.55, -0.4, 1.1], [6.3, 7.2, 0.6, -1.1, 0.2], [7.5, 8.5, 0.5, 0.1, 1.1], [8.8, 9.6, 0.62, -1.0, 0.0]],
    tanks: [[9.9, 10.5, 0.16, 0.8, 0.75], [10.8, 12.9, 0.34, 0.66, 0.55], [13.1, 15.1, 0.34, 0.66, 0.55]],
  },
};

function blueDef(u: BlueTrainCar): CarDef {
  const L = BLUE_BODY;
  const trucks = [L / 2 - 7.075, L / 2 + 7.075];
  const sleeper = u === "sleeper";
  return {
    spec: { length: L, W: BT.W, Y: BT.Y, S: BT.S, C: BT.C, lean: BT.lean, arc: 6, B: BT.B, wl: 1.43, A: BT.A, wa: 1.46, front: BT_END, rear: BT_END, edges: [], step: 1.0, noseStep: 0.06, cuts: trucks.map((d) => [d - 1.6, d + 1.6] as const) },
    bands: BT_BANDS, doorBands: [[0, 9, "btBlue"]],
    roof: "btRoof", skirt: "btBlue", under: "under",
    windows: [],
    // the sleeper's folding vestibule door (two leaves, a tall narrow window each), the dining car's kitchen door
    doors: sleeper
      ? { spans: [[bt(0.35), bt(1.15)]], y: [1.1, 3.28], glass: [2.07, 3.18], glassW: 0.16, glassPair: 0.4 }
      : { spans: [[bt(1.3), bt(2.15)]], y: [1.12, 3.06], glass: [2.38, 2.96], glassW: 0.45 },
    cabEnds: [], diaphragm: [1.15, 3.4], diaphragmW: 0.42,
    trucks, truck: { axles: [-1.05, 1.05], wheelR: 0.43, frameHalf: 1.65, frameTop: 0.92, frameBottom: 0.55, frameZ: [0.92, 1.04], primary: "coil", secondary: [0], secondaryZ: 1.05, bolster: BT.B },
    coupler: "knuckle", couplerY: COUPLER_Y, gap: [0.25, 0.25],
    lettering: [{ text: sleeper ? "OHANE 25 118" : "OSHI 24 101", d: bt(10.4), y: 1.63, h: 0.09, mat: "btSign" }],
    extras: (m, b, X) => {
      for (const s of [1, -1])
        m.scope(s > 0 ? "right side" : "left side", () => btSide(m, b, X, s, sleeper ? (s === BT_BERTH_S ? BT_SLEEPER.berth : BT_SLEEPER.corridor) : BT_DINER));
      m.scope("roof", () => {
        btHood(m, X, 0.12, 2.45, BT.hood);
        if (sleeper) btHood(m, X, 19.88, 17.55, BT.hood);
        else btHood(m, X, 19.88, 18.5, BT.hood - 0.05);
      });
      for (const e of [1, -1]) m.scope(e > 0 ? "front end" : "rear end", () => btEnd(m, e, Math.abs(X(e > 0 ? 0 : L))));
      m.scope("underfloor", () => {
        const g = BT_UNDER[u];
        for (const [d0, d1, y0, z0, z1] of g.boxes) block(m, "under", X(bt(d1)), X(bt(d0)), y0, BT.B + 0.01, z0, z1);
        for (const [d0, d1, r, y, z] of g.tanks) { const ring = ngon(12, r, 0, z, y); m.sweep("tank", "x", ring, X(bt(d1)), ring, X(bt(d0))); }
      });
    },
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
  const side: LodBand[] = [[BT.B, 1.12, "btBlue"], [1.12, 1.17, "btLine"], [1.17, 1.94, "btBlue"], [1.94, 2.0, "btLine"], [2.0, BT.S, "btBlue"], [BT.S, BT.C, "btRoof"]];
  const [w0, w1, wy] = u === "sleeper" ? [2.45, 18.2, [2.09, 2.78] as const] : [3.12, 18.02, [2.38, 3.0] as const];
  const body: UnitBody = { y0: BT.B, hw: [[BT.B, 1.43], [BT.A, 1.46], [BT.Y, BT.W], [BT.S, BT.W * BT.lean], [BT.C, 0.4]], side, roof: "btRoof", front: { tip: [[BT.B, X(0)]] }, rear: { tip: [[BT.B, X(BLUE_BODY)]] },
    windows: [{ u: [X(bt(w1)), X(bt(w0))], y: wy, mat: LOD_GLASS }] };
  return fitUnit({ palette: { ...CARBODY_PALETTE, ...BLUE_PAL }, bodies: [body], parts: bogieParts(def.trucks.map((d) => [X(d), 1.65] as const), BT.B) }, 100);
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
