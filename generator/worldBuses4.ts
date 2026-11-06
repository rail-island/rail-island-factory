// The buses from around the world, fourth batch (docs/models/world-buses-2.md): 25
// buses of the Americas, Asia, Africa and Oceania on the world bus kit
// (worldBusKit.ts) - the double-articulated Hess lighTram and Curitiba
// biarticulado on three bodies, the BRT buses with their platform-height doors,
// the Asian city buses, coaches and double-deckers - and the Havana camello, a
// tractor and its semi-trailer bus split at the king pin (the road-vehicle
// skill's truck/trailer split), drawn here with the kit's shell. Each at its real
// size, modelled on the photographs in assets/<references>/ and the published
// figures in each folder's SOURCES.md. The ids are stored in the game's saved
// maps: never rename one.

import { MeshBuilder } from "./meshBuilder.ts";
import type { DoorStyle } from "./busAssembly.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import * as refined from "./worldBusRefined.ts";
import { sectionOf, tyres, worldBus, worldBusLod, type WorldBusSpec } from "./worldBusKit.ts";
import { coach, doubleDeck, highFloor, lowFloor, twoBodies, worldBusDesign, g, type Base, type WorldBus } from "./worldBuses.ts";
import { BUS_CATALOG } from "./buses.ts";
import { liveryParam } from "./worldBuses2.ts";
import { colourParam } from "./worldBuses3.ts";
import { drawShell } from "./busBody.ts";
import { AXLE_FACTOR, axleBeam, busPalette, busWheel, endSlab, onSide, sideSlab, type BusFrame } from "./busKit.ts";
import { block, steeredWheels } from "./vehicleParts.ts";
import { blockPart, sectionBody, truckLod } from "./lodRoad.ts";
import type { Vec3 } from "./meshCore.ts";

/** The colours `params`' first parameter picks from `table`. */
const pick = (params: readonly ParamSpec[], table: Record<string, Record<string, string>>, p?: ParamValues): Record<string, string> =>
  table[resolveParams(params, p)[params[0]!.name] as string]!;

/** A BRT bus: the high-floor shape with its doors at the stations' platform height, `sill` above the road. */
function brt(o: Base, sill: number): WorldBusSpec {
  const s = highFloor(o);
  const door: DoorStyle = { ...s.door, bottom: sill, panes: [[sill + 0.12, s.eave - 0.28]] };
  return { ...s, door, belt: Math.max(s.belt, sill + 0.15) };
}

/** Three bodies over `length`, the joints' gaps centred at `a` and `b` metres from the nose. */
const threeBodies = (length: number, a: number, b: number): Array<[number, number]> => [[0, a - 0.4], [a + 0.4, b - 0.4], [b + 0.4, length]];

// ---------------------------------------------------------------------------
// the designs' specs

export function lighTramSpec(): WorldBusSpec {
  return lowFloor({
    length: 24.7, height: 3.1,
    axles: [{ at: 2.75 }, { at: 8.8 }, { at: 15.6, drive: true }, { at: 22.4, drive: true }],
    doors: [[0.35, 1.65], [4.6, 5.9], [11.4, 12.7], [17.8, 19.1], [20.6, 21.9]],
    bodies: threeBodies(24.7, 10.5, 17.0),
    // Geneva TPG's white with the orange skirt
    livery: { body: "#f4f4f1", skirt: "#f08a1c", band: "#15181c", pod: "#d9dde0" },
    roof: [[5.6, 8.6, 0.9, 3.45, "pod"], [12.0, 14.8, 0.9, 3.4, "pod"]],
    rake: 0.3,
    trolley: 3.6,
  });
}

export function biarticuladoSpec(): WorldBusSpec {
  return { ...brt({
    length: 25.0, width: 2.6, height: 3.3,
    axles: [{ at: 2.6 }, { at: 8.4, drive: true }, { at: 15.2 }, { at: 22.4 }],
    doors: [[1.1, 2.3], [4.4, 5.6], [11.6, 12.8], [18.6, 19.8]],
    bodies: threeBodies(25.0, 10.8, 17.6),
    // the express lines' red
    livery: { body: "#c8202e", rub: "#3c3c3c", white: "#f4f4f1" },
    paint: [[-1, 26, 0.78, 0.86, "rub"], [-1, 26, 2.95, 3.3, "white"]],
  }, 0.95), detail: true, extras: refined.biarticulado };
}

export function transmilenioSpec(): WorldBusSpec {
  return brt({
    length: 18.0, width: 2.6, height: 3.3,
    axles: [{ at: 2.7 }, { at: 9.2 }, { at: 15.4, drive: true }],
    doors: [[1.1, 2.3], [6.4, 7.6], [11.6, 12.8], [15.9, 17.1]],
    bodies: twoBodies(18.0, 10.6),
    // TransMilenio's red trunk livery
    livery: { body: "#d3252b", rub: "#3c3c3c", white: "#f4f4f1" },
    paint: [[-1, 19, 0.78, 0.86, "rub"], [-1, 19, 0.35, 0.7, "white"]],
  }, 0.9);
}

export const NOVA_PARAMS = liveryParam(["stm", "STM"], ["ttc", "TTC"]);

export function novaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(NOVA_PARAMS, {
    stm: { body: "#f4f5f4", skirt: "#00739c", band: "#15181c", pod: "#f4f5f4" },
    ttc: { body: "#f4f5f4", skirt: "#d3252b", band: "#15181c", pod: "#f4f5f4" },
  }, p);
  return lowFloor({
    length: 12.2, width: 2.59, height: 3.2,
    axles: [{ at: 2.1 }, { at: 8.3, drive: true }],
    doors: [[0.25, 1.35], [5.9, 7.0]],
    livery: l, mirrors: "arm",
    roof: [[9.4, 11.8, 0.95, 3.45, "pod"]],
  });
}

export const CATALYST_PARAMS = liveryParam(["proterra", "Proterra"], ["kingCounty", "King County"]);

export function catalystSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(CATALYST_PARAMS, {
    proterra: { body: "#f4f5f4", skirt: "#3a9b4a", band: "#15181c", pod: "#f4f5f4" },
    kingCounty: { body: "#f2c500", skirt: "#2e6b3e", band: "#15181c", pod: "#f2c500" },
  }, p);
  return lowFloor({
    length: 12.8, width: 2.59, height: 3.35,
    axles: [{ at: 2.4 }, { at: 8.9, drive: true }],
    doors: [[0.7, 1.7], [6.2, 7.3]],
    livery: l, mirrors: "arm", rake: 0.6,
  });
}

export const PARADISO_PARAMS = liveryParam(["cometa", "Cometa"], ["itapemirim", "Itapemirim"]);

export function paradisoSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(PARADISO_PARAMS, {
    cometa: { body: "#c9ccd0", band: "#15181c", skirt: "#1d3f7a" },
    itapemirim: { body: "#f4f4f2", band: "#15181c", skirt: "#f2b200" },
  }, p);
  return doubleDeck({
    coach: true, length: 15.0, width: 2.6, height: 4.1,
    axles: [{ at: 2.75 }, { at: 10.3, drive: true }, { at: 11.7, dual: false }],
    doors: [[0.2, 1.2], [7.0, 7.9]],
    livery: l,
    paint: [[-1, 16, 0.35, 0.62, "skirt"], [-1, 14.7, 1.06, 2.09, "band"], [-1, 14.7, 2.49, 3.9, "band"]],
    rake: 0.5,
  });
}

export const TORINO_PARAMS = liveryParam(["sptrans", "SPTrans"], ["urbs", "URBS"]);

export function torinoSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(TORINO_PARAMS, {
    sptrans: { body: "#f4f4f1", rub: "#3c3c3c", white: "#1d8f5a" },
    urbs: { body: "#f2b200", rub: "#3c3c3c", white: "#f4f4f1" },
  }, p);
  return highFloor({
    length: 12.5, height: 3.2,
    axles: [{ at: 2.4 }, { at: 8.4, drive: true }],
    doors: [[0.3, 1.4], [4.8, 5.9], [10.2, 11.3]],
    livery: l, rake: 0.2,
    paint: [[-1, 13.5, 0.35, 1.2, "white"], [-1, 13.5, 0.78, 0.86, "rub"]],
  });
}

export const BLUE_RIBBON_PARAMS = liveryParam(["toei", "Toei"], ["yokohama", "Yokohama"]);

export function blueRibbonSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(BLUE_RIBBON_PARAMS, {
    toei: { body: "#f2f1ea", rub: "#3c3c3c", white: "#2e8b57" },
    yokohama: { body: "#f2f1ea", rub: "#3c3c3c", white: "#1d4f9c" },
  }, p);
  return highFloor({
    length: 10.5, width: 2.49, height: 3.1,
    axles: [{ at: 2.3 }, { at: 7.1, drive: true }],
    doors: [[0.3, 1.3], [4.5, 5.5]],
    livery: l, rake: 0.1,
    paint: [[-1, 11.5, 0.35, 1.3, "white"], [-1, 11.5, 0.78, 0.86, "rub"]],
  });
}

export const ERGA_PARAMS = liveryParam(["toei", "Toei"], ["kyoto", "Kyoto City"]);

export function ergaSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(ERGA_PARAMS, {
    toei: { body: "#f2f1ea", skirt: "#2e8b57", band: "#15181c", pod: "#f2f1ea" },
    kyoto: { body: "#2e7d4f", skirt: "#f2f1ea", band: "#15181c", pod: "#2e7d4f" },
  }, p);
  return lowFloor({
    length: 10.5, width: 2.49, height: 3.1,
    axles: [{ at: 2.4 }, { at: 7.2, drive: true }],
    doors: [[0.3, 1.5], [4.6, 5.8]],
    livery: l, mirrors: "arm",
    roof: [[2.3, 4.3, 0.8, 3.32, "pod"]],
  });
}

export const AERO_QUEEN_PARAMS = liveryParam(["jrBus", "JR Bus"], ["nishitetsu", "Nishitetsu"]);

export function aeroQueenSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(AERO_QUEEN_PARAMS, {
    jrBus: { body: "#f4f4f2", skirt: "#1d4f9c", band: "#15181c" },
    nishitetsu: { body: "#f4f4f2", skirt: "#d3252b", band: "#15181c" },
  }, p);
  return coach({
    length: 12.0, width: 2.49, height: 3.55,
    axles: [{ at: 2.7 }, { at: 8.8, drive: true }],
    doors: [[0.5, 1.4]],
    livery: l, rake: 0.3, mirrors: "arm",
  });
}

export const ELEC_CITY_PARAMS = colourParam(["blue", "Blue"], ["green", "Green"]);

export function elecCitySpec(p?: ParamValues): WorldBusSpec {
  const l = pick(ELEC_CITY_PARAMS, {
    blue: { body: "#1d63c4", skirt: "#f4f4f1", band: "#15181c", pod: "#1d63c4" },
    green: { body: "#3aa04a", skirt: "#f4f4f1", band: "#15181c", pod: "#3aa04a" },
  }, p);
  return lowFloor({
    length: 11.0, width: 2.49, height: 3.0,
    axles: [{ at: 2.5 }, { at: 7.6, drive: true }],
    doors: [[0.3, 1.6], [5.0, 6.3]],
    livery: l, mirrors: "arm",
    // the battery packs over the roof
    roof: [[2.2, 9.4, 1.0, 3.37, "pod"]],
  });
}

export const BS106_PARAMS = colourParam(["blue", "Blue"], ["green", "Green"]);

export function bs106Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(BS106_PARAMS, {
    blue: { body: "#f2f1ea", rub: "#3c3c3c", white: "#1d63c4" },
    green: { body: "#f2f1ea", rub: "#3c3c3c", white: "#3aa04a" },
  }, p);
  return highFloor({
    length: 11.0, width: 2.49, height: 3.1,
    axles: [{ at: 2.4 }, { at: 8.0, drive: true }],
    doors: [[0.3, 1.3], [4.5, 5.5]],
    livery: l,
    paint: [[-1, 12, 0.35, 1.25, "white"], [-1, 12, 0.78, 0.86, "rub"]],
  });
}

export const E12_PARAMS = colourParam(["white", "White"], ["green", "Green"]);

export function e12Spec(p?: ParamValues): WorldBusSpec {
  const l = pick(E12_PARAMS, {
    white: { body: "#f4f4f1", skirt: "#1d63c4", band: "#15181c", pod: "#f4f4f1" },
    green: { body: "#3aa04a", skirt: "#f4f4f1", band: "#15181c", pod: "#3aa04a" },
  }, p);
  return lowFloor({
    length: 12.0, height: 3.0,
    axles: [{ at: 2.6 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.1, 6.4]],
    livery: l, rake: 0.3,
    roof: [[2.4, 8.8, 1.0, 3.3, "pod"]],
  });
}

export const KING_LONG_PARAMS = colourParam(["white", "White"], ["red", "Red"]);

export function kingLongSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(KING_LONG_PARAMS, {
    white: { body: "#f4f4f2", skirt: "#d3252b", band: "#15181c" },
    red: { body: "#c8202e", skirt: "#f4f4f2", band: "#15181c" },
  }, p);
  return coach({
    length: 12.0, height: 3.7,
    axles: [{ at: 2.6 }, { at: 8.6, drive: true }],
    doors: [[0.5, 1.4], [5.8, 6.7]],
    livery: l, rake: 0.4,
  });
}

export const TRIDENT_PARAMS = liveryParam(["kmb", "KMB"], ["citybus", "Citybus"]);

export function tridentSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(TRIDENT_PARAMS, {
    kmb: { body: "#efe6c8", band: "#15181c", stripe: "#c8202e" },
    citybus: { body: "#f2c500", band: "#15181c", stripe: "#1d3f7a" },
  }, p);
  return doubleDeck({
    length: 12.0, width: 2.5, height: 4.4,
    axles: [{ at: 2.5 }, { at: 8.55, drive: true }, { at: 9.9, dual: false }],
    doors: [[0.3, 1.45], [4.6, 5.8]],
    livery: l,
    paint: [[-1, 13, 0.3, 0.62, "stripe"], [-1, 11.75, 1.01, 2.16, "band"], [-1, 11.75, 2.56, 4.3, "band"]],
  });
}

export function a95Spec(): WorldBusSpec {
  return doubleDeck({
    length: 11.97, height: 4.2,
    axles: [{ at: 2.6 }, { at: 8.3, drive: true }, { at: 9.65, dual: false }],
    doors: [[0.3, 1.45], [5.0, 6.2]],
    // Singapore's lush green, the lime stripe at the skirt
    livery: { body: "#2e8b3e", band: "#15181c", stripe: "#9ad31f" },
    paint: [[-1, 13, 0.3, 0.55, "stripe"], [-1, 11.7, 1.01, 2.16, "band"], [-1, 11.7, 2.56, 4.1, "band"]],
  });
}

export const VIKING_PARAMS = liveryParam(["best", "BEST"], ["dtc", "DTC"]);

export function vikingSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(VIKING_PARAMS, {
    best: { body: "#c8202e", rub: "#3c3c3c", white: "#efe6c8" },
    dtc: { body: "#2e7d4f", rub: "#3c3c3c", white: "#efe6c8" },
  }, p);
  const s = highFloor({
    length: 10.5, height: 3.1,
    axles: [{ at: 1.9 }, { at: 7.1, drive: true }],
    doors: [[2.6, 3.4], [7.9, 8.7]],
    livery: l,
    paint: [[-1, 11.5, 0.78, 0.86, "rub"], [-1, 11.5, 1.25, 1.45, "white"], [-1, 11.5, 2.85, 3.1, "white"]],
  });
  // the engine at the front beside the driver: its grille in the nose
  return { ...s, grille: [0.55, 1.2, 0.45], back: { ...s.back, grille: undefined } };
}

export const STARBUS_PARAMS = liveryParam(["bmtc", "BMTC"], ["best", "BEST"]);

export function starbusSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(STARBUS_PARAMS, {
    bmtc: { body: "#1d63c4", rub: "#3c3c3c", white: "#f4f4f1" },
    best: { body: "#c8202e", rub: "#3c3c3c", white: "#efe6c8" },
  }, p);
  const s = highFloor({
    length: 11.0, width: 2.6, height: 3.2,
    axles: [{ at: 2.2 }, { at: 7.8, drive: true }],
    doors: [[0.3, 1.4], [5.0, 6.1]],
    livery: l, rake: 0.2,
    paint: [[-1, 12, 0.78, 0.86, "rub"], [-1, 12, 2.95, 3.2, "white"]],
  });
  return { ...s, grille: [0.55, 1.1, 0.5], back: { ...s.back, grille: undefined } };
}

export function cairoSpec(): WorldBusSpec {
  return highFloor({
    length: 12.0, height: 3.2,
    axles: [{ at: 2.6 }, { at: 8.3, drive: true }],
    doors: [[0.3, 1.5], [5.0, 6.2]],
    // the Authority's current yellow with the green skirt and roof edge (the photograph)
    livery: { body: "#f2c500", rub: "#3c3c3c", green: "#5cb82e" },
    paint: [[-1, 13, 0.35, 0.78, "green"], [-1, 13, 0.78, 0.86, "rub"], [-1, 13, 2.95, 3.2, "green"]],
  });
}

export function reaVayaSpec(): WorldBusSpec {
  return brt({
    length: 18.0, width: 2.55, height: 3.3,
    axles: [{ at: 2.7 }, { at: 9.0 }, { at: 15.2, drive: true }],
    doors: [[1.1, 2.3], [6.2, 7.4], [11.6, 12.8], [15.8, 17.0]],
    bodies: twoBodies(18.0, 10.4),
    // Rea Vaya's red and grey
    livery: { body: "#c8202e", rub: "#3c3c3c", white: "#8a8f96" },
    paint: [[-1, 19, 0.35, 0.86, "white"], [-1, 19, 0.78, 0.86, "rub"]],
  }, 0.95);
}

export const OPTIMUS_PARAMS = liveryParam(["transperth", "Transperth"], ["translink", "Translink"]);

export function optimusSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(OPTIMUS_PARAMS, {
    transperth: { body: "#c9cdd1", skirt: "#2e8b57", band: "#15181c", pod: "#c9cdd1" },
    translink: { body: "#f4f4f1", skirt: "#1d6fb8", band: "#15181c", pod: "#f4f4f1" },
  }, p);
  return lowFloor({
    length: 12.5, width: 2.5, height: 3.2,
    axles: [{ at: 2.5 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.5, 6.8]],
    livery: l, rake: 0.25,
    roof: [[2.4, 5.0, 0.85, 3.45, "pod"]],
  });
}

export const OLYMBUS_PARAMS = liveryParam(["redBus", "Red Bus"], ["metro", "Metro"]);

export function olymbusSpec(p?: ParamValues): WorldBusSpec {
  const l = pick(OLYMBUS_PARAMS, {
    redBus: { body: "#c8202e", skirt: "#c8202e", band: "#15181c", pod: "#c8202e" },
    metro: { body: "#f2c500", skirt: "#1d4f9c", band: "#15181c", pod: "#f2c500" },
  }, p);
  return lowFloor({
    length: 12.0, width: 2.5, height: 3.2,
    axles: [{ at: 2.6 }, { at: 8.6, drive: true }],
    doors: [[0.3, 1.6], [5.3, 6.6]],
    livery: l, rake: 0.35,
    // the hybrid's turbine and batteries in the roof pods
    roof: [[2.4, 6.0, 0.95, 3.45, "pod"], [9.2, 11.4, 0.9, 3.45, "pod"]],
  });
}

export function sydneyAtlanteanSpec(): WorldBusSpec {
  return doubleDeck({
    length: 9.6, width: 2.5, height: 4.37,
    axles: [{ at: 2.1 }, { at: 7.1, drive: true }],
    doors: [[0.25, 1.35], [4.0, 5.1]],
    // the PTC's blue and white
    livery: { body: "#f4f4f1", band: "#15181c", blue: "#1d4f9c" },
    paint: [[-1, 10.6, 0.3, 0.95, "blue"], [-1, 9.35, 1.01, 2.16, "band"], [-1, 9.35, 2.56, 4.23, "band"]],
    rake: 0.05,
  });
}

export function kyiv12Spec(): WorldBusSpec {
  return highFloor({
    length: 17.7, height: 3.1,
    axles: [{ at: 2.5 }, { at: 8.3 }, { at: 14.6, drive: true }],
    doors: [[0.3, 1.5], [4.4, 5.6], [10.8, 12.0], [15.3, 16.5]],
    bodies: twoBodies(17.7, 10.1),
    // Kyiv's cream and red
    livery: { body: "#efe6c8", rub: "#3c3c3c", red: "#c8202e" },
    paint: [[-1, 18.7, 0.35, 0.86, "red"], [-1, 18.7, 0.78, 0.86, "rub"], [-1, 18.7, 2.82, 2.97, "red"]],
    trolley: 3.4,
  });
}

// ---------------------------------------------------------------------------
// the Havana camello: a tractor and its two-humped semi-trailer bus

/** The camello's measures: metres along x (the tail at 0), the tractor's axles, the king pin. */
const CAM = {
  length: 21.3,
  hw: 1.25,
  r: 0.5,
  front: 20.2,
  drive: 16.3,
  trailerAxles: [1.6, 2.9],
  pin: [16.55, 1.3, 0] as Vec3,
  /** The trailer's front, its humps' and its low middle's x ranges, bottoms and tops. */
  pieces: [
    { x0: 13.6, x1: 17.6, y0: 1.42, y1: 3.75 },
    { x0: 4.4, x1: 13.6, y0: 0.45, y1: 3.15 },
    { x0: 0, x1: 4.4, y0: 1.12, y1: 3.75 },
  ],
  cab: { x0: 18.5, x1: 21.25, y0: 1.15, y1: 3.0 },
};

const CAMELLO_LIVERY = { body: "#efeae0", blue: "#1d63c4", band: "#15181c", cab: "#c8202e", chassis: "#2a2c30", bumper: "#2a2c30" };

/** One of the trailer's three convex pieces: its shell, its window band, its doors' panels. */
function camelloPiece(m: MeshBuilder, p: (typeof CAM.pieces)[number], i: number): void {
  const hw = CAM.hw;
  const eave = p.y1 - 0.12;
  const section = sectionOf(hw, p.y0, p.y0 + 0.1, eave, p.y1);
  const rake = i === 0 ? 0.35 : 0;
  const tail = i === 2 ? 0.25 : 0;
  const side: Array<[number, number]> = [[p.x0, p.y0], [p.x1, p.y0], [p.x1, eave - 0.4], [p.x1 - rake, eave], [p.x1 - rake - 0.25, p.y1], [p.x0 + tail + 0.1, p.y1], [p.x0 + tail, eave], [p.x0, eave - 0.4]];
  const plan: Array<[number, number]> = [[p.x0, -hw + 0.08], [p.x0 + 0.1, -hw], [p.x1 - 0.1, -hw], [p.x1, -hw + 0.08], [p.x1, hw - 0.08], [p.x1 - 0.1, hw], [p.x0 + 0.1, hw], [p.x0, hw - 0.08]];
  const g0 = Math.max(p.y0 + 0.75, 1.6);
  drawShell(m, { section, side, plan, base: "body", paint: [{ x0: -1, x1: 30, y0: p.y0, y1: Math.min(p.y0 + 0.45, g0 - 0.2), mat: "blue" }], arches: [], under: "under" }, `piece ${i}`);
  const f: BusFrame = { section, side };
  const n = Math.max(1, Math.round((p.x1 - p.x0 - 0.6) / 1.3));
  const w = (p.x1 - p.x0 - 0.6) / n;
  for (const s of [-1, 1]) for (let k = 0; k < n; k++) sideSlab(m, "glassDark", f, s, p.x0 + 0.3 + k * w + 0.05, p.x0 + 0.3 + (k + 1) * w - 0.05, g0, eave - 0.15, 0.02);
  if (i === 0) endSlab(m, "glassDark", f, 1, -hw + 0.3, hw - 0.3, g0, eave - 0.2, 0.02);
  if (i === 2) {
    endSlab(m, "glassDark", f, -1, -hw + 0.35, hw - 0.35, g0, eave - 0.2, 0.02);
    for (const s of [-1, 1]) endSlab(m, "lampRed", f, -1, s > 0 ? hw - 0.3 : -hw + 0.1, s > 0 ? hw - 0.1 : -hw + 0.3, p.y0 + 0.1, p.y0 + 0.25, 0.015);
  }
  // the middle's doors on the right, shut (their panels over the shell)
  if (i === 1) for (const [a, b] of [[5.0, 6.2], [8.4, 9.6], [11.8, 13.0]]) sideSlab(m, "frame", f, 1, a!, b!, p.y0 + 0.05, eave - 0.2, 0.012);
}

/** The tractor: a cab-over cab high over its front wheels, the chassis, the fenders, the fifth wheel. */
function camelloTractor(m: MeshBuilder): void {
  const { hw, r, cab } = CAM;
  const ay = r * AXLE_FACTOR;
  m.scope("cab", () => {
    block(m, "cab", cab.x0, cab.x1, cab.y0, cab.y1, -hw + 0.05, hw - 0.05);
    block(m, "glass", cab.x1 - 0.02, cab.x1 + 0.015, 2.0, 2.8, -hw + 0.2, hw - 0.2);
    for (const s of [-1, 1]) block(m, "glass", cab.x0 + 1.4, cab.x1 - 0.3, 2.0, 2.75, ...(s > 0 ? [hw - 0.06, hw - 0.035] : [-hw + 0.035, -hw + 0.06]) as [number, number]);
    block(m, "grille", cab.x1 - 0.02, cab.x1 + 0.015, 1.3, 1.8, -0.6, 0.6);
    for (const s of [-1, 1]) {
      block(m, "lampHead", cab.x1 - 0.02, cab.x1 + 0.02, 1.25, 1.45, s * 0.9 - 0.15, s * 0.9 + 0.15);
      block(m, "lampAmber", cab.x1 - 0.02, cab.x1 + 0.02, 1.5, 1.6, s * 0.9 - 0.12, s * 0.9 + 0.12);
    }
  });
  m.scope("bumper", () => block(m, "bumper", 21.05, 21.3, 0.45, 0.9, -hw + 0.05, hw - 0.05));
  m.scope("chassis", () => {
    for (const s of [-1, 1]) block(m, "chassis", 14.6, 21.05, 0.75, 1.0, s * 0.45 - 0.08, s * 0.45 + 0.08);
    block(m, "chassis", 14.55, 14.65, 0.75, 1.0, -0.6, 0.6);
    for (const s of [-1, 1]) block(m, "lampRed", 14.52, 14.56, 0.8, 0.95, s * 0.48 - 0.1, s * 0.48 + 0.1);
    // the fifth wheel's plate, its top at the king pin's height
    block(m, "chassis", 16.0, 17.1, 1.0, CAM.pin[1], -0.45, 0.45);
  });
  m.scope("fenders", () => {
    for (const s of [-1, 1]) block(m, "chassis", CAM.drive - 0.7, CAM.drive + 0.7, ay + r + 0.12, ay + r + 0.17, ...(s > 0 ? [0.6, hw - 0.05] : [-hw + 0.05, -0.6]) as [number, number]);
  });
  m.scope("tank", () => block(m, "chassis", 17.3, 18.3, 0.5, 1.0, 0.6, 1.1));
}

export function havanaCamello(): MeshBuilder {
  const m = new MeshBuilder(busPalette(CAMELLO_LIVERY));
  const { r, hw } = CAM;
  const ty = tyres(hw);
  const ay = r * AXLE_FACTOR;
  m.part("truck", [0, 0, 0], () => {
    camelloTractor(m);
    m.scope("front axle", () => axleBeam(m, CAM.front, r, ty.single[0] + 0.02, false));
    m.scope("drive axle", () => {
      axleBeam(m, CAM.drive, r, ty.inner[0] + 0.02, true);
      for (const s of [-1, 1]) {
        busWheel(m, CAM.drive, r, ...onSide(s, ...ty.inner), null);
        busWheel(m, CAM.drive, r, ...onSide(s, ...ty.outer), s);
      }
    });
  });
  const nodes = steeredWheels(m, "truck", CAM.front, ay, (s, z0, z1) => busWheel(m, CAM.front, r, z0, z1, s), ty.single);
  m.part("trailer", CAM.pin, () => {
    CAM.pieces.forEach((p, i) => m.scope(`body ${i}`, () => camelloPiece(m, p, i)));
    m.scope("king pin", () => block(m, "chassis", CAM.pin[0] - 0.08, CAM.pin[0] + 0.08, CAM.pin[1] - 0.05, CAM.pieces[0]!.y0 + 0.01, -0.08, 0.08));
    for (const x of CAM.trailerAxles) m.scope(`axle ${x}`, () => {
      axleBeam(m, x, r, ty.inner[0] + 0.02, false);
      for (const s of [-1, 1]) {
        busWheel(m, x, r, ...onSide(s, ...ty.inner), null);
        busWheel(m, x, r, ...onSide(s, ...ty.outer), s);
      }
    });
  });
  m.rig = {
    steer: { axles: [{ nodes, wheelbase: CAM.front - CAM.drive }], maxAngleDeg: 40, track: ty.single[0] + ty.single[1] },
    sections: [{ node: "truck", pivot: [0, 0, 0] }, { node: "trailer", pivot: CAM.pin }],
    maxBendDeg: 60,
  };
  return m;
}

export function havanaCamelloLod(): MeshBuilder {
  const T = { section: 1 };
  const { hw, cab } = CAM;
  const box = (y0: number, y1: number): Array<[number, number]> => [[-hw, y0], [hw, y0], [hw, y1], [-hw, y1]];
  return truckLod({
    palette: busPalette(CAMELLO_LIVERY),
    cab: {
      body: sectionBody(box(cab.y0, cab.y1), cab.x0, cab.x1, { side: [[cab.y0, cab.y1, "cab"]], roof: "cab" }),
      windscreen: { half: hw - 0.2, y: [2.0, 2.8] },
    },
    masses: CAM.pieces.map((p, i) => ({
      name: `body ${i}`, section: 1,
      body: sectionBody(box(p.y0, p.y1), p.x0, p.x1, { side: [[p.y0, p.y0 + 0.45, "blue"], [p.y0 + 0.45, p.y1, "body"]], roof: "body" }),
      rects: [{ side: 0, u: [p.x0 + 0.3, p.x1 - 0.3] as [number, number], y: [Math.max(p.y0 + 0.75, 1.6), p.y1 - 0.27] as [number, number] }],
    })),
    parts: [blockPart("chassis", "chassis", [14.6, 21.05], [0.75, 1.0], [-0.55, 0.55], { top: false }), blockPart("bumper", "bumper", [21.05, 21.3], [0.45, 0.9], [-hw, hw])],
    wheels: { mat: "under", r: CAM.r, axles: [{ x: CAM.front, z: hw }, { x: CAM.drive, z: hw }, ...CAM.trailerAxles.map((x) => ({ x, z: hw, ...T }))] },
    sections: { pivots: [[0, 0, 0], CAM.pin], joints: [], maxBendDeg: 60 },
  }, 200);
}

// ---------------------------------------------------------------------------
// the build functions, exported under their own names (jsModel.ts)

export function hessLighTram(): MeshBuilder { return worldBus(lighTramSpec()); }
export function hessLighTramLod(): MeshBuilder { return worldBusLod(lighTramSpec()); }
export function curitibaBiarticulado(): MeshBuilder { return worldBus(biarticuladoSpec()); }
export function curitibaBiarticuladoLod(): MeshBuilder { return worldBusLod(biarticuladoSpec()); }
export function transmilenio(): MeshBuilder { return worldBus(transmilenioSpec()); }
export function transmilenioLod(): MeshBuilder { return worldBusLod(transmilenioSpec()); }
export function novaLfs(p?: ParamValues): MeshBuilder { return worldBus(novaSpec(p)); }
export function novaLfsLod(p?: ParamValues): MeshBuilder { return worldBusLod(novaSpec(p)); }
export function proterraCatalyst(p?: ParamValues): MeshBuilder { return worldBus(catalystSpec(p)); }
export function proterraCatalystLod(p?: ParamValues): MeshBuilder { return worldBusLod(catalystSpec(p)); }
export function marcopoloParadiso(p?: ParamValues): MeshBuilder { return worldBus(paradisoSpec(p)); }
export function marcopoloParadisoLod(p?: ParamValues): MeshBuilder { return worldBusLod(paradisoSpec(p)); }
export function marcopoloTorino(p?: ParamValues): MeshBuilder { return worldBus(torinoSpec(p)); }
export function marcopoloTorinoLod(p?: ParamValues): MeshBuilder { return worldBusLod(torinoSpec(p)); }
export function hinoBlueRibbon(p?: ParamValues): MeshBuilder { return worldBus(blueRibbonSpec(p)); }
export function hinoBlueRibbonLod(p?: ParamValues): MeshBuilder { return worldBusLod(blueRibbonSpec(p)); }
export function isuzuErga(p?: ParamValues): MeshBuilder { return worldBus(ergaSpec(p)); }
export function isuzuErgaLod(p?: ParamValues): MeshBuilder { return worldBusLod(ergaSpec(p)); }
export function fusoAeroQueen(p?: ParamValues): MeshBuilder { return worldBus(aeroQueenSpec(p)); }
export function fusoAeroQueenLod(p?: ParamValues): MeshBuilder { return worldBusLod(aeroQueenSpec(p)); }
export function hyundaiElecCity(p?: ParamValues): MeshBuilder { return worldBus(elecCitySpec(p)); }
export function hyundaiElecCityLod(p?: ParamValues): MeshBuilder { return worldBusLod(elecCitySpec(p)); }
export function daewooBs106(p?: ParamValues): MeshBuilder { return worldBus(bs106Spec(p)); }
export function daewooBs106Lod(p?: ParamValues): MeshBuilder { return worldBusLod(bs106Spec(p)); }
export function yutongE12(p?: ParamValues): MeshBuilder { return worldBus(e12Spec(p)); }
export function yutongE12Lod(p?: ParamValues): MeshBuilder { return worldBusLod(e12Spec(p)); }
export function kingLongCoach(p?: ParamValues): MeshBuilder { return worldBus(kingLongSpec(p)); }
export function kingLongCoachLod(p?: ParamValues): MeshBuilder { return worldBusLod(kingLongSpec(p)); }
export function dennisTridentHk(p?: ParamValues): MeshBuilder { return worldBus(tridentSpec(p)); }
export function dennisTridentHkLod(p?: ParamValues): MeshBuilder { return worldBusLod(tridentSpec(p)); }
export function manA95(): MeshBuilder { return worldBus(a95Spec()); }
export function manA95Lod(): MeshBuilder { return worldBusLod(a95Spec()); }
export function ashokLeylandViking(p?: ParamValues): MeshBuilder { return worldBus(vikingSpec(p)); }
export function ashokLeylandVikingLod(p?: ParamValues): MeshBuilder { return worldBusLod(vikingSpec(p)); }
export function tataStarbus(p?: ParamValues): MeshBuilder { return worldBus(starbusSpec(p)); }
export function tataStarbusLod(p?: ParamValues): MeshBuilder { return worldBusLod(starbusSpec(p)); }
export function cairoCtaBus(): MeshBuilder { return worldBus(cairoSpec()); }
export function cairoCtaBusLod(): MeshBuilder { return worldBusLod(cairoSpec()); }
export function reaVaya(): MeshBuilder { return worldBus(reaVayaSpec()); }
export function reaVayaLod(): MeshBuilder { return worldBusLod(reaVayaSpec()); }
export function volgrenOptimus(p?: ParamValues): MeshBuilder { return worldBus(optimusSpec(p)); }
export function volgrenOptimusLod(p?: ParamValues): MeshBuilder { return worldBusLod(optimusSpec(p)); }
export function designlineOlymbus(p?: ParamValues): MeshBuilder { return worldBus(olymbusSpec(p)); }
export function designlineOlymbusLod(p?: ParamValues): MeshBuilder { return worldBusLod(olymbusSpec(p)); }
export function sydneyAtlantean(): MeshBuilder { return worldBus(sydneyAtlanteanSpec()); }
export function sydneyAtlanteanLod(): MeshBuilder { return worldBusLod(sydneyAtlanteanSpec()); }
export function kyiv12(): MeshBuilder { return worldBus(kyiv12Spec()); }
export function kyiv12Lod(): MeshBuilder { return worldBusLod(kyiv12Spec()); }

// ---------------------------------------------------------------------------
// the designs

const LIVERY = ["livery"] as const;
const COLOUR = ["colour"] as const;

/** The batch's kit buses, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md); the camello is HAVANA_CAMELLO. */
export const WORLD_BUS_SPECS_4: readonly WorldBus[] = [
  { id: "veh-hess-lightram", title: "Hess lighTram", spec: lighTramSpec, build: hessLighTram, buildLod: hessLighTramLod, game: g(28.0, 320, 70), references: "hess-lightram" },
  { id: "veh-nova-lfs", title: "Nova Bus LFS", spec: novaSpec, build: novaLfs, buildLod: novaLfsLod, params: NOVA_PARAMS, finishParams: LIVERY, game: g(12.5, 209, 100), references: "nova-lfs" },
  { id: "veh-proterra-catalyst", title: "Proterra Catalyst", spec: catalystSpec, build: proterraCatalyst, buildLod: proterraCatalystLod, params: CATALYST_PARAMS, finishParams: LIVERY, game: g(13.5, 220, 105), references: "proterra-catalyst" },
  { id: "veh-marcopolo-paradiso-dd", title: "Marcopolo Paradiso G7 1800 DD", spec: paradisoSpec, build: marcopoloParadiso, buildLod: marcopoloParadisoLod, params: PARADISO_PARAMS, finishParams: LIVERY, game: g(21.0, 324, 110), references: "marcopolo-paradiso-dd" },
  { id: "veh-marcopolo-torino", title: "Marcopolo Torino", spec: torinoSpec, build: marcopoloTorino, buildLod: marcopoloTorinoLod, params: TORINO_PARAMS, finishParams: LIVERY, game: g(12.0, 190, 80), references: "marcopolo-torino" },
  { id: "veh-curitiba-biarticulado", title: "Curitiba Biarticulated Bus", spec: biarticuladoSpec, build: curitibaBiarticulado, buildLod: curitibaBiarticuladoLod, game: g(30.0, 250, 70), references: "curitiba-biarticulado" },
  { id: "veh-transmilenio", title: "TransMilenio Articulated", spec: transmilenioSpec, build: transmilenio, buildLod: transmilenioLod, game: g(17.0, 250, 80), references: "transmilenio" },
  { id: "veh-hino-blue-ribbon", title: "Hino Blue Ribbon", spec: blueRibbonSpec, build: hinoBlueRibbon, buildLod: hinoBlueRibbonLod, params: BLUE_RIBBON_PARAMS, finishParams: LIVERY, game: g(9.5, 177, 90), references: "hino-blue-ribbon" },
  { id: "veh-isuzu-erga", title: "Isuzu Erga", spec: ergaSpec, build: isuzuErga, buildLod: isuzuErgaLod, params: ERGA_PARAMS, finishParams: LIVERY, game: g(10.0, 191, 90), references: "isuzu-erga" },
  { id: "veh-fuso-aero-queen", title: "Mitsubishi Fuso Aero Queen", spec: aeroQueenSpec, build: fusoAeroQueen, buildLod: fusoAeroQueenLod, params: AERO_QUEEN_PARAMS, finishParams: LIVERY, game: g(13.0, 279, 100), references: "fuso-aero-queen" },
  { id: "veh-hyundai-elec-city", title: "Hyundai Elec City", spec: elecCitySpec, build: hyundaiElecCity, buildLod: hyundaiElecCityLod, params: ELEC_CITY_PARAMS, finishParams: COLOUR, game: g(12.5, 240, 80), references: "hyundai-elec-city" },
  { id: "veh-daewoo-bs106", title: "Daewoo BS106", spec: bs106Spec, build: daewooBs106, buildLod: daewooBs106Lod, params: BS106_PARAMS, finishParams: COLOUR, game: g(10.5, 180, 80), references: "daewoo-bs106" },
  { id: "veh-yutong-e12", title: "Yutong E12", spec: e12Spec, build: yutongE12, buildLod: yutongE12Lod, params: E12_PARAMS, finishParams: COLOUR, game: g(13.0, 200, 70), references: "yutong-e12" },
  { id: "veh-king-long-coach", title: "King Long XMQ6127", spec: kingLongSpec, build: kingLongCoach, buildLod: kingLongCoachLod, params: KING_LONG_PARAMS, finishParams: COLOUR, game: g(13.0, 276, 100), references: "king-long-coach" },
  { id: "veh-dennis-trident-hk", title: "Dennis Trident", spec: tridentSpec, build: dennisTridentHk, buildLod: dennisTridentHkLod, params: TRIDENT_PARAMS, finishParams: LIVERY, game: g(14.0, 224, 80), references: "dennis-trident-hk" },
  { id: "veh-singapore-double-deck", title: "MAN A95", spec: a95Spec, build: manA95, buildLod: manA95Lod, game: g(15.0, 243, 80), references: "singapore-double-deck" },
  { id: "veh-ashok-leyland-viking", title: "Ashok Leyland Viking", spec: vikingSpec, build: ashokLeylandViking, buildLod: ashokLeylandVikingLod, params: VIKING_PARAMS, finishParams: LIVERY, game: g(9.5, 92, 75), references: "ashok-leyland-viking" },
  { id: "veh-tata-starbus", title: "Tata Starbus", spec: starbusSpec, build: tataStarbus, buildLod: tataStarbusLod, params: STARBUS_PARAMS, finishParams: LIVERY, game: g(10.5, 132, 80), references: "tata-starbus" },
  { id: "veh-cairo-cta-bus", title: "Cairo Transport Authority Bus", spec: cairoSpec, build: cairoCtaBus, buildLod: cairoCtaBusLod, game: g(11.0, 180, 80), references: "cairo-cta-bus" },
  { id: "veh-za-rea-vaya", title: "Rea Vaya BRT Bus", spec: reaVayaSpec, build: reaVaya, buildLod: reaVayaLod, game: g(17.0, 250, 80), references: "za-rea-vaya" },
  { id: "veh-volgren-optimus", title: "Volgren Optimus", spec: optimusSpec, build: volgrenOptimus, buildLod: volgrenOptimusLod, params: OPTIMUS_PARAMS, finishParams: LIVERY, game: g(12.5, 210, 90), references: "volgren-optimus" },
  { id: "veh-designline-olymbus", title: "Designline Olymbus", spec: olymbusSpec, build: designlineOlymbus, buildLod: designlineOlymbusLod, params: OLYMBUS_PARAMS, finishParams: LIVERY, game: g(12.0, 150, 80), references: "designline-olymbus" },
  { id: "veh-sydney-leyland-atlantean", title: "Sydney PTC Atlantean", spec: sydneyAtlanteanSpec, build: sydneyAtlantean, buildLod: sydneyAtlanteanLod, game: g(9.5, 127, 70), references: "sydney-leyland-atlantean" },
  { id: "veh-kyiv-12", title: "Kyiv-12 Trolleybus", spec: kyiv12Spec, build: kyiv12, buildLod: kyiv12Lod, game: g(16.0, 150, 60), references: "kyiv-12" },
];

/** The Havana camello, a tractor and semi-trailer (no WorldBusSpec: the kit draws its pieces). */
export const HAVANA_CAMELLO: ProceduralDesign = {
  id: "veh-havana-camello",
  title: "Havana Camello",
  game: { weight: 24.0, power: 200, maxspeed: 60, accel: null },
  build: havanaCamello,
  buildLod: havanaCamelloLod,
  references: "havana-camello",
  catalog: BUS_CATALOG,
};

/** The camello's measures for the fleet registry and the tests: its length, width and height. */
export const CAMELLO_SIZE = { length: CAM.length, width: 2 * CAM.hw, height: CAM.pieces[0]!.y1 };

export const WORLD_BUSES_4: ProceduralDesign[] = [...WORLD_BUS_SPECS_4.map(worldBusDesign), HAVANA_CAMELLO];
