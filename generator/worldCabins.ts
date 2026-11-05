// The cable car cabins from around the world (docs/models/world-cabins.md), each a
// CabinSpec on the cabin kit (cabinKit.ts): detachable gondolas, a funitel, 3S and
// bicable cabins, aerial tramways (a double-decker, a rotating one, an open-top
// one) at their real size, modelled on the photographs in assets/<references>/
// and the published figures in each folder's SOURCES.md.
//
// Axes as the kit's: the rope along x (yaw 0), the platform side +z, y up, the
// cabin's underside at y 0. The ids are stored in the game's saved maps: never
// rename one.

import type { MaterialSpec, MeshBuilder } from "./meshBuilder.ts";
import type { Station } from "./cableCabins.ts";
import { buildCabin, buildCabinLod, cabinDatums, type CabinSpec } from "./cabinKit.ts";
import { resolveParams, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { CABLE_CABIN_CATALOG } from "./cableCabins.ts";

const paint = (color: string, metallic = 0.25, roughness = 0.35): MaterialSpec => ({ color, metallic, roughness });

/**
 * A cabin's shell stations: a rounded belly to the outer line at 0.3, the body up
 * to each glazed deck, the glass recessed 3 cm and leaning in by `lean`, the body
 * between decks, then the roof rounding in by `dome`. `stripes` paint bands of the
 * body below the first deck; `bottom` paints the belly (a glass floor).
 */
function stations(o: {
  decks: ReadonlyArray<readonly [number, number]>;
  roof: number;
  lean: number;
  dome: number;
  body: string;
  roofMat?: string;
  bottom?: string;
  belly?: number;
  stripes?: ReadonlyArray<readonly [number, number, string]>;
}): Station[] {
  const belly = o.belly ?? 0.3;
  const st: Station[] = [[0, belly, o.bottom ?? o.body], [0.12, belly / 3, o.bottom ?? o.body], [0.3, 0, o.body]];
  for (const [y0, y1, mat] of o.stripes ?? []) st.push([y0, 0, mat], [y1, 0, o.body]);
  o.decks.forEach(([g0, g1], i) => {
    st.push([g0, i === 0 ? 0 : o.lean, o.body], [g0, (i === 0 ? 0 : o.lean) + 0.03, "glass"], [g1, o.lean + 0.03, o.body], [g1, o.lean, o.body]);
  });
  const g1 = o.decks[o.decks.length - 1]![1];
  st.push([g1 + 0.1, o.lean + 0.02, o.roofMat ?? o.body], [o.roof, o.lean + o.dome, o.roofMat ?? o.body]);
  for (let i = 1; i < st.length; i++) if (st[i]![0] < st[i - 1]![0]) throw new Error(`cabin stations not rising at ${st[i]![0]}`);
  return st;
}

/** Evenly spaced positions from -h to h, `n` of them, ends included when n > 1. */
const spread = (h: number, n: number): number[] => Array.from({ length: n }, (_, i) => (n === 1 ? 0 : -h + (2 * h * i) / (n - 1)));

// ---------------------------------------------------------------------------
// the designs' specs

const OMEGA_COLOURS: Record<string, string> = { red: "#c3221c", orange: "#e8731c", silver: "#b7bcc0", blue: "#1f5fae", green: "#2f8a43", black: "#26292c" };
export const OMEGA_PARAMS: readonly ParamSpec[] = [{
  name: "color", title: "Colour", default: "red",
  values: Object.keys(OMEGA_COLOURS).map((value) => ({ value, title: value[0]!.toUpperCase() + value.slice(1) })),
}];

/** Doppelmayr Omega IV-10: a ten-seat detachable gondola, 2.2 x 2.05 m, doors on the platform side. */
export function omegaSpec(params?: ParamValues): CabinSpec {
  const p = resolveParams(OMEGA_PARAMS, params);
  return {
    hx: 1.1, hz: 1.025, corner: 0.5, sill: 0.4,
    stations: stations({ decks: [[0.95, 2.28]], roof: 2.55, lean: 0.1, dome: 0.38, body: "body", stripes: [[0.3, 0.4, "rubber"]] }),
    glass: { y0: 0.95, y1: 2.28 },
    posts: { xs: [-0.62, 0.62], zs: [0], mat: "body", w: 0.07 },
    doors: { x: [[-0.52, 0.52]], y1: 2.2, mat: "frame" },
    roofBoxes: [[-0.32, 0.32, 2.62, -0.5, -0.3, "frame"], [-0.32, 0.32, 2.62, 0.3, 0.5, "frame"]],
    hanger: { kind: "grip", rope: 4.45 },
    palette: { body: paint(OMEGA_COLOURS[p.color!]!) },
  };
}

/** A Poma funitel cabin of the Val Thorens kind: 24 places, hung between two haul ropes 3.2 m apart. */
export function funitelSpec(): CabinSpec {
  return {
    hx: 1.35, hz: 1.6, corner: 0.45, sill: 0.42,
    stations: stations({ decks: [[0.95, 2.25]], roof: 2.55, lean: 0.06, dome: 0.3, body: "body", stripes: [[0.3, 0.42, "rubber"], [0.62, 0.8, "stripe"]] }),
    glass: { y0: 0.95, y1: 2.25 },
    posts: { xs: [-0.7, 0, 0.7], zs: [-0.8, 0, 0.8], mat: "body" },
    doors: { x: [[-0.75, 0.75]], y1: 2.18, mat: "frame", both: true },
    hanger: { kind: "funitel", rope: 3.55, gap: 3.2, gripX: 0.8 },
    palette: { body: paint("#e8eaeb"), stripe: paint("#7a7f86") },
  };
}

export const GLASS_FLOOR_PARAMS: readonly ParamSpec[] = [{
  name: "variant", title: "Variant", default: "standard",
  values: [{ value: "standard", title: "Standard" }, { value: "glassFloor", title: "Glass floor" }],
}];

/** The Peak 2 Peak 3S cabin, Whistler: 28 places, two track ropes 0.8 m apart; red, the two glass-floor cabins of the 28 silver. */
export function peak2PeakSpec(params?: ParamValues): CabinSpec {
  const p = resolveParams(GLASS_FLOOR_PARAMS, params);
  return {
    hx: 2.05, hz: 1.3, corner: 0.55, sill: 0.42,
    stations: stations({ decks: [[0.92, 2.3]], roof: 2.65, lean: 0.08, dome: 0.32, body: "body", roofMat: "roof", bottom: p.variant === "glassFloor" ? "glass" : undefined, stripes: [[0.3, 0.42, "rubber"]] }),
    glass: { y0: 0.92, y1: 2.3 },
    posts: { xs: spread(1.35, 4), zs: [0], mat: "body" },
    doors: { x: [[-0.6, 0.6]], y1: 2.22, mat: "frame", both: true },
    hanger: { kind: "carriage", rope: 5.4, track: 0.4, length: 2.6, sheaves: 4, arm: { w: 0.5, d: 0.3, top: 0.3 } },
    palette: p.variant === "glassFloor"
      ? { body: paint("#bfc4c8", 0.45, 0.3), roof: paint("#bfc4c8", 0.45, 0.3) }
      : { body: paint("#b81d24"), roof: paint("#b81d24") },
  };
}

/** The Stanserhorn CabriO: a double-deck aerial tram, an open top deck for 30 on a glazed cabin for 60, hung from both sides. */
export function cabrioSpec(): CabinSpec {
  return {
    hx: 2.8, hz: 1.9, corner: 0.9, sill: 0.45,
    stations: stations({ decks: [[1.0, 2.55]], roof: 2.85, lean: 0.05, dome: 0.12, body: "body", roofMat: "body", stripes: [[0.3, 0.45, "rubber"], [0.75, 0.9, "stripe"]] }),
    glass: { y0: 1.0, y1: 2.55 },
    posts: { xs: spread(1.6, 5), zs: [-0.8, 0.8], mat: "frame" },
    doors: { x: [[-0.7, 0.7]], y1: 2.45, mat: "frame", both: true },
    deck: { rail: 1.1, pitch: 0.8, mat: "steel" },
    hanger: { kind: "side", rope: 4.6, track: 2.35, length: 2.4, sheaves: 4, attach: 1.6 },
    palette: { body: paint("#e4e6e7", 0.35, 0.3), stripe: paint("#5b6066") },
  };
}

/** The Titlis Rotair: a round aerial tram cabin for 80 whose floor turns a full circle on the way up. */
export function rotairSpec(): CabinSpec {
  return {
    hx: 3.1, hz: 3.1, corner: 3.1, sill: 0.45,
    stations: stations({ decks: [[1.0, 2.7]], roof: 3.05, lean: 0.12, dome: 0.7, body: "body", belly: 0.5, stripes: [[0.3, 0.45, "rubber"], [0.55, 0.8, "stripe"]] }),
    glass: { y0: 1.0, y1: 2.7 },
    posts: { xs: [-1.5, 0, 1.5], zs: [-1.5, 0, 1.5], mat: "body" },
    doors: { x: [[-0.8, 0.8]], y1: 2.5, mat: "frame" },
    hanger: { kind: "carriage", rope: 7.2, track: 0.55, length: 3.6, sheaves: 8, arm: { w: 1.2, d: 0.5, top: 0.5 }, yoke: { hx: 1.4, hz: 0.6, h: 0.4 } },
    palette: { body: paint("#eef0f0"), stripe: paint("#c1121c") },
  };
}

/** The Vanoise Express: the double-deck aerial tram between Les Arcs and La Plagne, 200 passengers a cabin. */
export function vanoiseSpec(): CabinSpec {
  return {
    hx: 4.6, hz: 2.3, corner: 1.1, sill: 0.5,
    stations: stations({ decks: [[1.05, 2.5], [3.1, 4.55]], roof: 4.95, lean: 0.06, dome: 0.3, body: "body", roofMat: "roof", stripes: [[0.3, 0.5, "rubber"]] }),
    glass: { y0: 1.05, y1: 2.5 },
    posts: { xs: spread(3.2, 7), zs: [-1, 0, 1], mat: "frame" },
    doors: { x: [[-2.4, -1.4], [1.4, 2.4]], y1: 2.42, mat: "frame", both: true },
    roofBoxes: [[-3.2, -2.0, 5.2, -0.6, 0.6, "dark"]],
    hanger: { kind: "carriage", rope: 9.6, track: 0.6, length: 6.0, sheaves: 8, arm: { w: 2.4, d: 0.6, top: 0.7 }, yoke: { hx: 2.0, hz: 0.8, h: 0.45 } },
    palette: { body: paint("#d7dadc", 0.4, 0.3), roof: paint("#c41e2a") },
  };
}

/** The Roosevelt Island Tramway's 2010 Poma cabins, New York: red, 110 passengers. */
export function rooseveltSpec(): CabinSpec {
  return {
    hx: 3.4, hz: 1.7, corner: 0.8, sill: 0.48,
    stations: stations({ decks: [[1.0, 2.6]], roof: 2.95, lean: 0.06, dome: 0.25, body: "body", roofMat: "roof", stripes: [[0.3, 0.48, "rubber"]] }),
    glass: { y0: 1.0, y1: 2.6 },
    posts: { xs: spread(2.4, 6), zs: [-0.7, 0.7], mat: "body" },
    doors: { x: [[-0.9, 0.9]], y1: 2.5, mat: "frame", both: true },
    hanger: { kind: "carriage", rope: 7.4, track: 0.5, length: 4.0, sheaves: 8, arm: { w: 1.6, d: 0.45, top: 0.5 }, yoke: { hx: 1.6, hz: 0.6, h: 0.35 } },
    palette: { body: paint("#c3161c", 0.3, 0.3), roof: paint("#c9cccf", 0.35, 0.35) },
  };
}

/** The Sugarloaf cable car (bondinho), Rio de Janeiro: the current glass cabins for 65, dark grey under a pale roof. */
export function sugarloafSpec(): CabinSpec {
  return {
    hx: 2.7, hz: 1.65, corner: 1.4, sill: 0.45,
    stations: stations({ decks: [[0.75, 2.7]], roof: 3.0, lean: 0.12, dome: 0.5, body: "body", roofMat: "roof", stripes: [[0.3, 0.45, "rubber"]] }),
    glass: { y0: 0.75, y1: 2.7 },
    posts: { xs: [-0.9, 0.9], zs: [0], mat: "frame" },
    doors: { x: [[-0.7, 0.7]], y1: 2.5, mat: "frame", both: true },
    hanger: { kind: "carriage", rope: 6.6, track: 0.45, length: 3.4, sheaves: 8, arm: { w: 1.0, d: 0.4, top: 0.45 }, yoke: { hx: 1.1, hz: 0.5, h: 0.3 } },
    palette: { body: paint("#3b3f44", 0.35, 0.35), roof: paint("#d3d6d8") },
  };
}

/** A Medellin Metrocable gondola: a ten-place Poma cabin of Line K, Metro de Medellin's green on white. */
export function metrocableSpec(): CabinSpec {
  return {
    hx: 1.05, hz: 1.0, corner: 0.45, sill: 0.4,
    stations: stations({ decks: [[1.0, 2.25]], roof: 2.5, lean: 0.06, dome: 0.32, body: "body", stripes: [[0.3, 0.4, "rubber"], [0.55, 0.85, "stripe"]] }),
    glass: { y0: 1.0, y1: 2.25 },
    posts: { xs: [-0.6, 0.6], zs: [0], mat: "body", w: 0.07 },
    doors: { x: [[-0.5, 0.5]], y1: 2.18, mat: "frame" },
    hanger: { kind: "grip", rope: 4.35 },
    palette: { body: paint("#eef0ef"), stripe: paint("#4a9b2f") },
  };
}

export const CRYSTAL_PARAMS: readonly ParamSpec[] = [{
  name: "variant", title: "Variant", default: "standard",
  values: [{ value: "standard", title: "Standard" }, { value: "crystal", title: "Crystal" }],
}];

/** A Ngong Ping 360 cabin, Lantau: 17 places on a bicable (one track rope), white with a blue band; the Crystal cabins with a glass floor. */
export function ngongPingSpec(params?: ParamValues): CabinSpec {
  const p = resolveParams(CRYSTAL_PARAMS, params);
  return {
    hx: 1.3, hz: 1.2, corner: 0.5, sill: 0.42,
    stations: stations({ decks: [[0.95, 2.3]], roof: 2.58, lean: 0.08, dome: 0.33, body: "body", bottom: p.variant === "crystal" ? "glass" : undefined, stripes: [[0.3, 0.42, "rubber"], [0.62, 0.88, "stripe"]] }),
    glass: { y0: 0.95, y1: 2.3 },
    posts: { xs: [-0.7, 0.7], zs: [0], mat: "body" },
    doors: { x: [[-0.55, 0.55]], y1: 2.22, mat: "frame" },
    hanger: { kind: "carriage", rope: 4.9, track: 0, length: 1.6, sheaves: 4, arm: { w: 0.4, d: 0.3, top: 0.3 } },
    palette: { body: paint("#e7e9ea", 0.35, 0.3), stripe: paint(p.variant === "crystal" ? "#2b8fd0" : "#1f4f9a") },
  };
}

// ---------------------------------------------------------------------------
// the designs

// The build functions, exported under their own names: the JS model imports a design's
// builders by name from this module (jsModel.ts).

export function doppelmayrOmega(params?: ParamValues): MeshBuilder { return buildCabin(omegaSpec(params)); }
export function doppelmayrOmegaLod(params?: ParamValues): MeshBuilder { return buildCabinLod(omegaSpec(params)); }
export function pomaFunitel(): MeshBuilder { return buildCabin(funitelSpec()); }
export function pomaFunitelLod(): MeshBuilder { return buildCabinLod(funitelSpec()); }
export function peak2Peak(params?: ParamValues): MeshBuilder { return buildCabin(peak2PeakSpec(params)); }
export function peak2PeakLod(params?: ParamValues): MeshBuilder { return buildCabinLod(peak2PeakSpec(params)); }
export function stanserhornCabrio(): MeshBuilder { return buildCabin(cabrioSpec()); }
export function stanserhornCabrioLod(): MeshBuilder { return buildCabinLod(cabrioSpec()); }
export function titlisRotair(): MeshBuilder { return buildCabin(rotairSpec()); }
export function titlisRotairLod(): MeshBuilder { return buildCabinLod(rotairSpec()); }
export function vanoiseExpress(): MeshBuilder { return buildCabin(vanoiseSpec()); }
export function vanoiseExpressLod(): MeshBuilder { return buildCabinLod(vanoiseSpec()); }
export function rooseveltIslandTram(): MeshBuilder { return buildCabin(rooseveltSpec()); }
export function rooseveltIslandTramLod(): MeshBuilder { return buildCabinLod(rooseveltSpec()); }
export function sugarloafBondinho(): MeshBuilder { return buildCabin(sugarloafSpec()); }
export function sugarloafBondinhoLod(): MeshBuilder { return buildCabinLod(sugarloafSpec()); }
export function medellinMetrocable(): MeshBuilder { return buildCabin(metrocableSpec()); }
export function medellinMetrocableLod(): MeshBuilder { return buildCabinLod(metrocableSpec()); }
export function ngongPing(params?: ParamValues): MeshBuilder { return buildCabin(ngongPingSpec(params)); }
export function ngongPingLod(params?: ParamValues): MeshBuilder { return buildCabinLod(ngongPingSpec(params)); }

type SpecFn = (params?: ParamValues) => CabinSpec;
type BuildFn = (params?: ParamValues) => MeshBuilder;

/** A design's game properties from its spec: the rope and sill datums, the line speed (km/h). */
function cabinGame(spec: CabinSpec, maxspeed: number): ProceduralDesign["game"] {
  const d = cabinDatums(spec);
  return { weight: null, power: null, maxspeed, accel: null, ropeFrac: d.ropeFrac, boardFrac: d.boardFrac };
}

interface WorldCabin {
  id: string;
  title: string;
  spec: SpecFn;
  build: BuildFn;
  buildLod: BuildFn;
  params?: readonly ParamSpec[];
  finishParams?: readonly string[];
  /** Line speed, km/h. */
  maxspeed: number;
  references: string;
}

/** Every world cabin, in the list's order (docs/specs/2026-11-05-world-vehicle-fleet-list.md). */
export const WORLD_CABIN_SPECS: readonly WorldCabin[] = [
  { id: "veh-doppelmayr-omega", title: "Doppelmayr Omega IV", spec: omegaSpec, build: doppelmayrOmega, buildLod: doppelmayrOmegaLod, params: OMEGA_PARAMS, finishParams: ["color"], maxspeed: 22, references: "doppelmayr-omega" },
  { id: "veh-poma-funitel", title: "Funitel Cabin", spec: funitelSpec, build: pomaFunitel, buildLod: pomaFunitelLod, maxspeed: 25, references: "poma-funitel" },
  { id: "veh-peak-2-peak", title: "Peak 2 Peak Cabin", spec: peak2PeakSpec, build: peak2Peak, buildLod: peak2PeakLod, params: GLASS_FLOOR_PARAMS, maxspeed: 27, references: "peak-2-peak" },
  { id: "veh-stanserhorn-cabrio", title: "Stanserhorn Cabrio", spec: cabrioSpec, build: stanserhornCabrio, buildLod: stanserhornCabrioLod, maxspeed: 29, references: "stanserhorn-cabrio" },
  { id: "veh-titlis-rotair", title: "Titlis Rotair", spec: rotairSpec, build: titlisRotair, buildLod: titlisRotairLod, maxspeed: 36, references: "titlis-rotair" },
  { id: "veh-vanoise-express", title: "Vanoise Express", spec: vanoiseSpec, build: vanoiseExpress, buildLod: vanoiseExpressLod, maxspeed: 43, references: "vanoise-express" },
  { id: "veh-roosevelt-island-tram", title: "Roosevelt Island Tramway", spec: rooseveltSpec, build: rooseveltIslandTram, buildLod: rooseveltIslandTramLod, maxspeed: 29, references: "roosevelt-island-tram" },
  { id: "veh-sugarloaf-bondinho", title: "Sugarloaf Cable Car", spec: sugarloafSpec, build: sugarloafBondinho, buildLod: sugarloafBondinhoLod, maxspeed: 36, references: "sugarloaf-bondinho" },
  { id: "veh-medellin-metrocable", title: "Medellin Metrocable", spec: metrocableSpec, build: medellinMetrocable, buildLod: medellinMetrocableLod, maxspeed: 18, references: "medellin-metrocable" },
  { id: "veh-ngong-ping-crystal", title: "Ngong Ping 360 Cabin", spec: ngongPingSpec, build: ngongPing, buildLod: ngongPingLod, params: CRYSTAL_PARAMS, maxspeed: 25, references: "ngong-ping-crystal" },
];

export const WORLD_CABINS: ProceduralDesign[] = WORLD_CABIN_SPECS.map((c) => ({
  id: c.id,
  title: c.title,
  game: cabinGame(c.spec(), c.maxspeed),
  build: c.build,
  buildLod: c.buildLod,
  ...(c.params ? { params: c.params } : {}),
  ...(c.finishParams ? { finishParams: c.finishParams } : {}),
  references: c.references,
  catalog: CABLE_CABIN_CATALOG,
}));
