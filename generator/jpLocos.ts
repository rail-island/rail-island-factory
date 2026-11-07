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

function c62Spec(): LocoSpec {
  return {
    title: "JNR C62",
    palette: JNR_STEAM,
    heads: [0, 13.6],
    beams: { front: false, rear: false },
    boiler: { x0: 1.0, x1: 10.3, y: 2.75, r: 0.86, smokebox: 1.6, bands: [4.0, 6.0, 8.0] },
    chimney: { x: 2.0, top: 3.95, r: 0.26 },
    domes: [{ x: 4.7, top: 3.88, r: 0.38, len: 2.3 }],
    valves: { x: 9.3, top: 3.82 },
    handrail: { x0: 2.0, x1: 10.1, y: 2.95 },
    runningBoard: { profile: [[0.4, 1.4], [1.5, 1.4], [2.1, 1.95], [10.6, 1.95]], half: 1.4, valance: 0.08 },
    frame: { x0: 0.5, x1: 13.0, top: 1.85 },
    cab: {
      x0: 10.3, x1: 12.9, half: [[1.45, 1.8], [1.45, 3.5], [1.25, 3.78], [0.8, 3.93], [0, 3.98]], roofY: 3.75,
      windows: [{ x0: 10.6, x1: 11.4, y0: 2.75, y1: 3.35 }, { x0: 11.6, x1: 12.4, y0: 2.75, y1: 3.35 }],
      front: [{ z0: 0.8, z1: 1.2, y0: 2.95, y1: 3.4 }, { z0: -1.2, z1: -0.8, y0: 2.95, y1: 3.4 }],
    },
    prisms: [{ name: "firebox", x0: 8.8, x1: 10.3, half: [[1.0, 2.0], [1.0, 3.0], [0.85, 3.45], [0.5, 3.62], [0, 3.66]] }],
    // the large smoke deflectors of the express engines
    deflectors: { outlines: [[[0.9, 2.0], [2.7, 2.0], [2.7, 3.55], [1.25, 3.55], [0.9, 3.2]]], z: 1.3 },
    bogies: [{ x0: 1.2, x1: 3.6, y: 0.55 }, { x0: 10.5, x1: 12.8, y: 0.58 }],
    gear: {
      wheels: [
        { x: 1.75, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 3.05, d: 0.86, spokes: 10, outsideBoxes: true },
        { x: 4.7, d: 1.75, spokes: 20 },
        { x: 6.65, d: 1.75, spokes: 20 },
        { x: 8.6, d: 1.75, spokes: 20 },
        { x: 11.0, d: 0.92, spokes: 12, outsideBoxes: true },
        { x: 12.3, d: 0.92, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [2, 3, 4], main: 3, cylinder: { x0: 1.9, x1: 2.9, y: 1.0, r: 0.33 }, crank: 0.33, phase: 0.4, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: "C62 2", side: [11.6, 2.45, 1.45], front: [0.98, 2.45] },
    extras: (t) => {
      jnrFront(t, 1.15, 3.55);
      t.m.scope("drawbar", () => t.box("black", 12.9, 13.6, 0.8, 1.0, -0.15, 0.15));
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

// The D51 in source metres from the front coupler face, measured from the side-on photograph of
// D51 51 (assets/jnr-d51/SOURCES.md: a projective fit over the four drivers at the published
// 1,550 mm pitch) and the published 19,730 mm over the couplers with the 8-20 tender.
/** Where the engine's drawbar meets the tender: the engine is 12.4 m, the tender 7.33 m. */
const D51_ENGINE = 12.4;
const D51_TENDER = 19.73 - D51_ENGINE;
/** The four 1,400 mm drivers at 1,550 mm, the leading axle 2.35 m ahead, the trailing truck 2.2 m behind. */
const D51_DRIVERS = [3.22, 4.77, 6.32, 7.87];
const D51_LEAD = 0.87;
const D51_TRAIL = 10.07;
const D51_BOILER = { x0: 0.6, x1: 10.85, y: 2.42, r: 0.85, smokebox: 2.1 };
/** The smokebox's top (its radius is 4 cm more than the barrel's). */
const D51_SMOKEBOX_TOP = D51_BOILER.y + D51_BOILER.r + 0.04;
const D51_RB = 1.85;
const D51_RB_HALF = 1.4;
const D51_CAB_HALF = 1.4;

/** JNR black with the white edging of the preserved engines: running boards, tyres, cab and tender sills. */
const D51_PALETTE = (variant: D51Variant): Record<string, MaterialSpec> => ({
  ...JNR_STEAM,
  beam: c("#1d1e20", 0.6),
  tyre: c("#e8e6df", 0.55),
  // D51 200's red number plates with silver figures; D51 1's black ones
  ...(variant === "standard" ? { plate: c("#a8221d", 0.5), plateText: c("#e3e1da", 0.35) } : {}),
});

/** The dome casing's section: upright sides into the boiler, a rounded crown. */
const D51_CASING_SEC: Array<[number, number]> = [[-0.47, 2.7], [0.47, 2.7], [0.47, 3.45], [0.42, 3.64], [0.3, 3.76], [0.15, 3.81], [0, 3.82], [-0.15, 3.81], [-0.3, 3.76], [-0.42, 3.64], [-0.47, 3.45]];

/**
 * The casing on the boiler top. Standard (D51 101 on): one casing over the sand box and steam
 * dome, 2.6 m over the first and second drivers. Namekuji (D51 1 - 95): the long "slug" casing
 * from the chimney back over the feedwater heater, sand box and dome, its tail sloping down 5.6 m on.
 */
function d51Casing(variant: D51Variant): NonNullable<LocoSpec["volumes"]>[number] {
  if (variant === "namekuji") {
    return {
      name: "namekuji casing", sec: D51_CASING_SEC,
      plan: [[1.62, 0.3], [1.78, 0.43], [2.2, 0.47], [6.2, 0.47], [6.9, 0.4], [7.3, 0.26]],
      top: [[1.62, 3.62], [1.8, 3.79], [2.1, 3.82], [6.1, 3.82], [6.5, 3.74], [6.9, 3.56], [7.3, 3.33]],
      bands: [[2.7, 3.82, "paint"]],
    };
  }
  return {
    name: "dome casing", sec: D51_CASING_SEC,
    plan: [[3.4, 0.28], [3.55, 0.42], [3.8, 0.47], [5.65, 0.47], [5.9, 0.4], [6.05, 0.26]],
    top: [[3.4, 3.56], [3.55, 3.74], [3.75, 3.82], [5.65, 3.82], [5.88, 3.72], [6.05, 3.52]],
    bands: [[2.7, 3.82, "paint"]],
  };
}

/**
 * The front end: the black end beam with its automatic coupler, the pilot plate under it, the
 * headlight on the smokebox top, the number plate on the smokebox door and, on the standard
 * engine, the feedwater heater across the smokebox ahead of the chimney.
 */
function d51Front(t: Steam, variant: D51Variant, number: string): void {
  t.m.scope("front beam", () => {
    t.box("beam", 0.35, 0.55, 0.78, 1.18, -1.32, 1.32);
    knuckleCoupler(t.m, 1, t.X(0) - 0.6, t.X(0), COUPLER_Y);
    // the pilot plate low under the beam, its foot leaning forward
    t.box("frame", 0.4, 0.5, 0.3, 0.76, -1.1, 1.1);
    t.box("frame", 0.3, 0.4, 0.1, 0.42, -1.15, 1.15);
  });
  t.m.scope("headlight", () => {
    const y = D51_SMOKEBOX_TOP + 0.2;
    t.box("black", 0.66, 0.9, D51_SMOKEBOX_TOP - 0.06, y - 0.12, -0.12, 0.12);
    t.cylX("black", 0.95, 0.56, 0, y, 0.19, 12);
    t.cylX("lampHead", 0.555, 0.53, 0, y, 0.15, 12);
  });
  if (variant === "standard") {
    t.m.scope("feedwater heater", () => {
      const [x, y] = [1.2, D51_SMOKEBOX_TOP + 0.24];
      t.cylZ("black", x, y, -0.7, 0.7, 0.22, 12);
      for (const z of [-0.7, 0.7]) t.cylZ("black", x, y, z - 0.04, z + 0.04, 0.25, 12);
      for (const z of [-0.4, 0.4]) t.box("black", x - 0.12, x + 0.12, D51_SMOKEBOX_TOP - 0.08, y - 0.15, z - 0.06, z + 0.06);
    });
  }
  t.endPlate(1, D51_BOILER.x0 - 0.07, D51_BOILER.y + 0.42, number, 0.16);
  // the marker lamps on the front deck
  t.m.scope("marker lamps", () => { for (const z of [-0.85, 0.85]) t.lamp(1, 0.42, 1.22, z); });
  // the brass star handle on the smokebox door
  t.m.scope("door handle", () => {
    const y = D51_BOILER.y;
    t.cylX("brass", 0.497, 0.465, 0, y, 0.06, 8);
    t.box("brass", 0.47, 0.495, y - 0.17, y + 0.17, -0.02, 0.02);
    t.box("brass", 0.472, 0.493, y - 0.02, y + 0.02, -0.17, 0.17);
  });
  // the grab rails up the deflectors' front edges
  t.m.scope("deflector handrails", () => {
    for (const s of [-1, 1]) {
      t.cylY("handrail", 0.52, s * 1.475, 1.45, 3.0, 0.016, 6);
      for (const y of [1.55, 2.9]) t.sideBox("handrail", s, 0.51, 0.53, y - 0.01, y + 0.01, 1.446, 1.47);
    }
  });
}

/** The air compressor on the left and the feedwater pump on the right, under the running board's rise. */
function d51Pumps(t: Steam): void {
  t.m.scope("air compressor", () => {
    for (const x of [8.05, 8.4]) t.cylY("black", x, -1.2, 1.05, 2.15, 0.15, 10);
    t.cylY("brass", 8.05, -1.2, 1.6, 1.64, 0.152, 10, false);
  });
  t.m.scope("feedwater pump", () => {
    t.cylY("black", 8.2, 1.2, 1.15, 2.15, 0.16, 10);
    t.cylY("brass", 8.2, 1.2, 1.7, 1.74, 0.162, 10, false);
  });
}

/** The cylinder block: a tall casing round the cylinder and steam chest up to the running board, its brass covers. */
function d51Cylinders(t: Steam): void {
  t.m.scope("cylinder casing", () => {
    for (const s of [-1, 1]) {
      t.sideBox("paint", s, 1.3, 2.33, 0.38, D51_RB - 0.05, 0.8, 1.445);
      t.m.scope("brass", () => {
        t.cylZ("brass", 1.82, 1.15, Math.min(s * 1.445, s * 1.465), Math.max(s * 1.445, s * 1.465), 0.1, 10);
        for (const x of [1.52, 2.12]) t.box("brass", x - 0.04, x + 0.04, 1.11, 1.19, s * 1.445, s * 1.46);
      });
    }
  });
}

function d51Spec(variant: D51Variant): LocoSpec {
  const namekuji = variant === "namekuji";
  // the namekuji's cab is shorter than the standard engine's
  const cab = namekuji ? { x0: 10.9, x1: 12.1, win: [[11.1, 11.45], [11.55, 11.9]] } : { x0: 10.85, x1: 12.15, win: [[11.02, 11.42], [11.52, 11.95]] };
  const number = namekuji ? "D51 1" : "D51 200";
  // the running board rises over the fourth driver; the standard engine's stays up to the cab
  const rb: Array<[number, number]> = namekuji
    ? [[0.4, 1.12], [1.3, D51_RB], [7.7, D51_RB], [8.0, 2.32], [8.9, 2.32], [9.25, 1.93], [10.84, 1.93]]
    : [[0.4, 1.12], [1.3, D51_RB], [8.2, D51_RB], [8.5, 2.32], [10.84, 2.32]];
  const defTop = D51_SMOKEBOX_TOP - 0.08;
  return {
    title: "JNR D51",
    palette: D51_PALETTE(variant),
    heads: [0, D51_ENGINE],
    beams: { front: false, rear: false },
    boiler: { ...D51_BOILER },
    chimney: { x: 1.9, top: 3.95, r: 0.3 },
    volumes: [d51Casing(variant)],
    valves: { x: 7.75, top: 3.72 },
    handrail: { x0: 2.4, x1: 10.7, y: 2.8 },
    runningBoard: { profile: rb, half: D51_RB_HALF, valance: 0.08, valanceMat: "lining" },
    frame: { x0: 0.6, x1: 12.2, top: 1.7 },
    cab: {
      x0: cab.x0, x1: cab.x1, half: [[D51_CAB_HALF, 1.8], [D51_CAB_HALF, 3.45], [1.28, 3.72], [0.85, 3.88], [0, 3.93]], roofY: 3.7,
      windows: cab.win.map(([x0, x1]) => ({ x0: x0!, x1: x1!, y0: 2.72, y1: 3.32 })),
      front: [{ z0: 0.92, z1: 1.28, y0: 3.0, y1: 3.42 }, { z0: -1.28, z1: -0.92, y0: 3.0, y1: 3.42 }],
    },
    // the wide firebox over the trailing truck, under the cab front
    prisms: [{ name: "firebox", x0: 8.7, x1: 10.85, half: [[1.0, 1.95], [1.0, 2.85], [0.82, 3.17], [0.45, 3.29], [0, 3.31]] }],
    // the plates beside the smokebox: their foot follows the front running board's slope down to the beam
    deflectors: {
      outlines: [
        [[1.3, D51_RB], [2.32, D51_RB], [2.32, defTop - 0.24], [2.29, defTop - 0.12], [2.22, defTop - 0.04], [2.1, defTop], [1.3, defTop]],
        [[0.42, 1.15], [1.3, D51_RB], [1.3, defTop], [0.47, defTop], [0.42, defTop - 0.05]],
      ],
      z: 1.42,
    },
    bogies: [{ x0: 0.62, x1: 1.12, y: 0.55 }, { x0: 9.6, x1: 10.55, y: 0.62 }],
    gear: {
      wheels: [
        { x: D51_LEAD, d: 0.86, spokes: 10, outsideBoxes: true },
        // the box (Boxpok) drivers drawn as discs
        ...D51_DRIVERS.map((x) => ({ x, d: 1.4, spokes: 0 })),
        { x: D51_TRAIL, d: 1.07, spokes: 12, outsideBoxes: true },
      ],
      engines: [{ coupled: [1, 2, 3, 4], main: 3, cylinder: { x0: 1.32, x1: 2.31, y: 1.0, r: 0.33 }, crank: 0.33, phase: 0.2, valveGear: true }],
      cylinderZ: 1.1, reference: 3, wheelMaterial: "wheel",
    },
    number: { text: number, side: [cab.win[0]![0]! + 0.2, 2.3, D51_CAB_HALF] },
    extras: (t) => {
      d51Front(t, variant, number);
      d51Pumps(t);
      d51Cylinders(t);
      t.m.scope("cab sills", () => { for (const s of [-1, 1]) t.sideBox("lining", s, cab.x0, cab.x1, 1.8, 1.86, D51_CAB_HALF + 0.004, D51_CAB_HALF + 0.014); });
      // the cab roof carried on over the gap to the tender
      t.m.scope("roof extension", () => t.section("roof", cab.x1 + 0.12, D51_ENGINE - 0.02, [[-0.9, 3.92], [0.9, 3.92], [0.9, 3.95], [0, 3.99], [-0.9, 3.95]]));
      t.m.scope("drawbar", () => t.box("black", cab.x1, D51_ENGINE, 0.8, 1.0, -0.15, 0.15));
    },
  };
}

/** The 8-20 tender on two two-axle bogies: tank, coal space with its raised sides, white sills. */
function d51TenderSpec(): LocoSpec {
  const L = D51_TENDER;
  return {
    title: "JNR D51 tender",
    palette: D51_PALETTE("standard"),
    heads: [0, L],
    beams: { front: false, rear: false },
    frame: { x0: 0.3, x1: L - 0.35, top: 1.15 },
    prisms: [
      { name: "tank", x0: 0.2, x1: L - 0.33, half: [[1.38, 1.15], [1.38, 3.0]] },
      { name: "coal sides", x0: 0.2, x1: 4.4, half: [[1.38, 3.0], [1.3, 3.25]] },
    ],
    coal: { x0: 0.4, x1: 4.2, y: 3.1, half: 1.15, rise: 0.3 },
    bogies: [{ x0: 0.55, x1: 2.95, y: 0.55 }, { x0: 4.4, x1: 6.8, y: 0.55 }],
    gear: { wheels: [1.0, 2.5, 4.85, 6.35].map((x) => ({ x, d: 0.86, spokes: 0 })), engines: [], cylinderZ: 1.0, reference: 0, wheelMaterial: "wheel" },
    lamps: { front: [], rear: [[L - 0.1, 2.5, 0.9]] },
    extras: (t) => {
      t.m.scope("sills", () => { for (const s of [-1, 1]) t.sideBox("lining", s, 0.2, L - 0.33, 1.04, 1.12, 1.3, 1.39); });
      t.m.scope("rear beam", () => { t.box("beam", L - 0.33, L - 0.18, 0.75, 1.15, -1.3, 1.3); knuckleCoupler(t.m, -1, -t.X(L) - 0.6, -t.X(L), COUPLER_Y); });
    },
  };
}

/** The distant model's spec: the casing as a dome block (the LOD kit's dome), no volumes. */
function d51LodSpec(spec: LocoSpec): LocoSpec {
  const v = spec.volumes?.[0];
  if (!v) return spec;
  const x0 = v.plan[0]![0], x1 = v.plan[v.plan.length - 1]![0];
  return { ...spec, volumes: undefined, domes: [{ x: (x0 + x1) / 2, top: 3.82, r: 0.45, len: x1 - x0 }] };
}

const c62 = (v?: ParamValues) => (resolveParams([UNIT_PARAM], v).unit === "tender" ? c62TenderSpec() : c62Spec());
const d51 = (v?: ParamValues) => { const p = resolveParams(D51_PARAMS, v); return p.unit === "tender" ? d51TenderSpec() : d51Spec(p.variant as D51Variant); };
export function jnrC62(v?: ParamValues): MeshBuilder { return buildLoco(c62(v)); }
export function jnrC62Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(c62(v)); }
export function jnrD51(v?: ParamValues): MeshBuilder { return buildLoco(d51(v)); }
export function jnrD51Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(d51LodSpec(d51(v)), 120); }
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
  { id: "proc-vehicle-jnr-d51", title: "JNR D51", build: jnrD51, buildLod: jnrD51Lod, lodTriangles: 200, params: D51_PARAMS, game: steamGame(78, 950, 85, 47, [{ params: { unit: "tender", variant: "namekuji" }, weight: 47, power: 0 }]), catalog: STEAM_CATALOG, references: "jnr-d51" },
  { id: "proc-vehicle-jnr-ef66", title: "JNR EF66", build: jnrEf66, buildLod: jnrEf66Lod, params: EF66_PARAMS, game: { weight: 101, power: 3900, maxspeed: 110, accel: null }, catalog: ELECTRIC_LOCO_CATALOG, references: "jnr-ef66" },
  { id: "proc-vehicle-jnr-dd51", title: "JNR DD51", build: jnrDd51, buildLod: jnrDd51Lod, params: DD51_PARAMS, finishParams: ["livery"], game: { weight: 84, power: 1640, maxspeed: 95, accel: null }, catalog: DIESEL_LOCO_CATALOG, references: "jnr-dd51" },
  { id: "proc-vehicle-blue-train-24", title: "Blue Train 24 series", build: blueTrain24, buildLod: blueTrain24Lod, params: BLUE_PARAMS, game: { weight: 33, power: 0, maxspeed: 110, accel: null, variants: [{ params: { unit: "dining" }, weight: 38 }] }, catalog: COACH_CATALOG, references: "blue-train-24" },
];
