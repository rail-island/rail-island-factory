// The steam locomotives of the eight countries' families, each with its tender
// (`unit`), stated with the parametric steam generator (steamWorld.ts) on the
// steam kit (steamLoco.ts). See docs/models/world-steam.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco } from "./steamLoco.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { enumParam } from "./emuParts.ts";
import { ROCKET_VERSIONS, buildRocket, buildRocketLod, type RocketVersion } from "./rocket.ts";
import { steamEngineSpec, steamTenderSpec, type WorldSteam } from "./steamWorld.ts";
import { DRG01_WORLD, drg01Spec } from "./deSteam01.ts";
import { DR52_WORLD, dr52LodSpec, dr52Spec } from "./deSteam52.ts";

/** A design: its engine and, by livery, the paint and number. */
interface SteamDesign {
  base: WorldSteam;
  liveries?: Record<string, { title: string; palette: WorldSteam["palette"]; number: string }>;
}

const BLACK_RED = { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" };
const ALL_BLACK = { paint: "#1d1e20", wheel: "#2a2b2d", frame: "#a51a1f", smokebox: "#1c1d22" };
/** Britain's W6a gauge: the chimneys under 4.0 m, the cabs 2.74 m wide. */
const UK = { top: 3.95, coupler: "buffers", half: 1.37 } as const;
/** India's broad gauge: the bodies on the 3.3 m gauge, buffers and screw couplings; the 610 mm Darjeeling line's tiny engines. */
const IR = { top: 4.5, coupler: "buffers", half: 1.6 } as const;
/** China's steam: the larger Chinese loading gauge, automatic knuckle couplers. */
const CR = { top: 4.75, coupler: "knuckle", half: 1.55 } as const;
const UIC = { top: 4.65, coupler: "buffers", half: 1.5 } as const;

export const WORLD_STEAM: Record<string, SteamDesign> = {
  "proc-vehicle-drg-01": DRG01_WORLD,
  "proc-vehicle-dr-52": DR52_WORLD,
  "proc-vehicle-kpev-p8": {
    base: { ...UIC, title: "Prussian P 8", lead: 2, coupled: 3, trail: 0, leadD: 1.0, coupledD: 1.75, trailD: 0, boilerR: 0.83, deflectors: "none", domes: 2, palette: { paint: "#1f3b2c", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.3, axles: 4, d: 1.0 }, number: "2455 POSEN" },
    liveries: {
      kpev: { title: "KPEV green", palette: { paint: "#1f3b2c", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "2455 POSEN" },
      drBlack: { title: "DR black", palette: BLACK_RED, number: "38 1772" },
    },
  },
  "proc-vehicle-sncf-241p": { base: { ...UIC, title: "SNCF 241 P", lead: 2, coupled: 4, trail: 1, leadD: 1.0, coupledD: 2.02, trailD: 1.35, boilerR: 0.9, deflectors: "wagner", domes: 2, palette: ALL_BLACK, tender: { length: 10.2, axles: 4, d: 1.0 }, number: "241 P 17" } },
  "proc-vehicle-sncf-141r": { base: { ...UIC, title: "SNCF 141 R", lead: 1, coupled: 4, trail: 1, leadD: 0.92, coupledD: 1.65, trailD: 1.06, boilerR: 0.9, deflectors: "none", domes: 2, palette: ALL_BLACK, tender: { length: 10.5, axles: 4, d: 0.92 }, number: "141 R 1199" } },
  "proc-vehicle-ns-3700": { base: { ...UIC, title: "NS 3700", lead: 2, coupled: 3, trail: 0, leadD: 1.0, coupledD: 1.85, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, palette: { paint: "#244a33", wheel: "#2a2b2d", frame: "#7a2e22", smokebox: "#1c1d22" }, tender: { length: 7.8, axles: 4, d: 1.0 }, number: "3737" } },
  "proc-vehicle-renfe-141f": { base: { ...UIC, title: "Renfe 141F Mikado", lead: 1, coupled: 4, trail: 1, leadD: 1.0, coupledD: 1.56, trailD: 1.06, boilerR: 0.9, deflectors: "none", domes: 2, palette: ALL_BLACK, tender: { length: 8.9, axles: 4, d: 0.95 }, number: "141F 2111" } },
  "proc-vehicle-renfe-242f": { base: { ...UIC, title: "Renfe 242F", lead: 2, coupled: 4, trail: 1, leadD: 0.95, coupledD: 1.9, trailD: 1.1, boilerR: 0.9, deflectors: "wagner", domes: 2, palette: { paint: "#244a33", wheel: "#2a2b2d", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 10.4, axles: 4, d: 1.0 }, number: "242F 2009" } },
  "proc-vehicle-lner-a4": { base: { ...UK, title: "LNER A4", lead: 2, coupled: 3, trail: 1, leadD: 0.97, coupledD: 2.03, trailD: 1.17, boilerR: 0.85, deflectors: "none", domes: 1, palette: { paint: "#1d3f80", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.6, axles: 4, d: 1.0 }, number: "4468 MALLARD" },
    liveries: { garterBlue: { title: "Garter blue", palette: { paint: "#1d3f80", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "4468 MALLARD" }, brGreen: { title: "BR green", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "60022" } } },
  "proc-vehicle-lner-a3": { base: { ...UK, title: "LNER A3", lead: 2, coupled: 3, trail: 1, leadD: 0.97, coupledD: 2.03, trailD: 1.12, boilerR: 0.85, deflectors: "witte", domes: 1, palette: { paint: "#3a7a3a", wheel: "#3a7a3a", frame: "#7a2e22", smokebox: "#1c1d22" }, tender: { length: 8.0, axles: 4, d: 1.0 }, number: "4472" },
    liveries: { appleGreen: { title: "Apple green", palette: { paint: "#3a7a3a", wheel: "#3a7a3a", frame: "#7a2e22", smokebox: "#1c1d22" }, number: "4472" }, brGreen: { title: "BR green", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "60103" } } },
  "proc-vehicle-gwr-castle": { base: { ...UK, title: "GWR Castle", lead: 2, coupled: 3, trail: 0, leadD: 0.96, coupledD: 2.04, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, belpaire: true, palette: { paint: "#235a33", wheel: "#235a33", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 7.6, axles: 3, d: 1.23 }, number: "4073 CAERPHILLY CASTLE" } },
  "proc-vehicle-lms-black-five": { base: { ...UK, title: "LMS Black Five", lead: 2, coupled: 3, trail: 0, leadD: 0.91, coupledD: 1.83, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, belpaire: true, palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 7.8, axles: 3, d: 1.07 }, number: "45407" } },
  "proc-vehicle-br-9f": { base: { ...UK, title: "BR 9F", lead: 1, coupled: 5, trail: 0, leadD: 1.0, coupledD: 1.52, trailD: 0, boilerR: 0.88, deflectors: "wagner", domes: 1, belpaire: true, palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.4, axles: 3, d: 1.0 }, number: "92203" },
    liveries: { brBlack: { title: "BR black", palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "92203" }, eveningStar: { title: "Evening Star", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "92220 EVENING STAR" } } },
  "proc-vehicle-rocket": { base: { ...UK, title: "Stephenson's Rocket", lead: 0, coupled: 1, trail: 1, leadD: 0, coupledD: 1.435, trailD: 0.76, boilerR: 0.5, deflectors: "none", domes: 0, noValveGear: true, noCab: true, palette: { paint: "#e6b422", wheel: "#e6b422", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 4.2, axles: 2, d: 0.9 }, number: "ROCKET" } },
  "proc-vehicle-ir-wp": { base: { ...IR, title: "IR WP", lead: 2, coupled: 3, trail: 1, leadD: 0.92, coupledD: 1.7, trailD: 1.1, boilerR: 0.92, deflectors: "none", domes: 2, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 9.9, axles: 4, d: 1.0 }, number: "7200" },
    liveries: { black: { title: "Black", palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "7200" }, greenYellow: { title: "Green, yellow", palette: { paint: "#2f6b3a", wheel: "#a51a1f", frame: "#d9b54a", smokebox: "#1c1d22" }, number: "7161" } } },
  "proc-vehicle-ir-wg": { base: { ...IR, title: "IR WG", lead: 1, coupled: 4, trail: 1, leadD: 1.0, coupledD: 1.56, trailD: 1.1, boilerR: 0.92, deflectors: "none", domes: 2, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 9.6, axles: 4, d: 1.0 }, number: "10560" } },
  "proc-vehicle-eir-fairy-queen": { base: { ...IR, title: "Fairy Queen", lead: 1, coupled: 1, trail: 1, leadD: 1.0, coupledD: 1.83, trailD: 1.0, boilerR: 0.6, deflectors: "none", domes: 1, noValveGear: true, palette: { paint: "#2f5e3a", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 5.2, axles: 2, d: 1.0 }, number: "22 EIR" } },
  "proc-vehicle-dhr-b-class": { base: { top: 3.2, coupler: "buffers", half: 1.05, title: "DHR B class", lead: 0, coupled: 2, trail: 0, leadD: 0, coupledD: 0.66, trailD: 0, boilerR: 0.5, deflectors: "none", domes: 1, noValveGear: true, palette: { paint: "#1d4596", wheel: "#a51a1f", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 3.6, axles: 2, d: 0.6 }, number: "779" } },
  "proc-vehicle-cr-qj": { base: { ...CR, title: "CR QJ", lead: 1, coupled: 5, trail: 1, leadD: 0.84, coupledD: 1.5, trailD: 1.0, boilerR: 0.95, deflectors: "wagner", domes: 1, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 11.2, axles: 4, d: 0.95 }, number: "QJ 6999" } },
  "proc-vehicle-cr-sy": { base: { ...CR, title: "CR SY", lead: 1, coupled: 4, trail: 1, leadD: 0.84, coupledD: 1.37, trailD: 1.0, boilerR: 0.86, deflectors: "none", domes: 1, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 9.4, axles: 4, d: 0.9 }, number: "SY 1772" } },
  "proc-vehicle-cr-js": { base: { ...CR, title: "CR JS", lead: 1, coupled: 4, trail: 1, leadD: 0.84, coupledD: 1.37, trailD: 1.0, boilerR: 0.92, deflectors: "wagner", domes: 1, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 10.2, axles: 4, d: 0.9 }, number: "JS 8366" } },
};

function paramsOf(d: SteamDesign): ParamSpec[] {
  return d.liveries ? [UNIT_PARAM, enumParam("livery", "Livery", Object.fromEntries(Object.entries(d.liveries).map(([k, v]) => [k, v.title])))] : [UNIT_PARAM];
}

const PARAMS: Record<string, ParamSpec[]> = Object.fromEntries(Object.entries(WORLD_STEAM).map(([id, d]) => [id, paramsOf(d)]));
// the Rocket as built for Rainhill or as rebuilt in 1830 (rocket.ts)
PARAMS["proc-vehicle-rocket"] = [UNIT_PARAM, enumParam("version", "Version", Object.fromEntries(Object.entries(ROCKET_VERSIONS).map(([k, v]) => [k, v.title])))];

/** The spec of a design's engine or tender for the given values. */
export function worldSteamSpec(id: string, v?: ParamValues) {
  const d = WORLD_STEAM[id]!;
  const p = resolveParams(PARAMS[id]!, v);
  const l = d.liveries?.[p.livery!];
  const s: WorldSteam = l ? { ...d.base, palette: l.palette, number: l.number } : d.base;
  return p.unit === "tender" ? steamTenderSpec(s) : steamEngineSpec(s);
}

// the DRG 01 is drawn from its own spec (deSteam01.ts)
const drg01Unit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-drg-01"]!, v).unit!;
export function drg01(v?: ParamValues): MeshBuilder { return buildLoco(drg01Spec(drg01Unit(v))); }
export function drg01Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(drg01Spec(drg01Unit(v))); }
// the DR 52 is drawn from its own spec (deSteam52.ts)
const dr52Unit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-dr-52"]!, v).unit!;
export function dr52(v?: ParamValues): MeshBuilder { return buildLoco(dr52Spec(dr52Unit(v))); }
export function dr52Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(dr52LodSpec(dr52Unit(v))); }
export function sncf241p(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-sncf-241p", v)); }
export function sncf241pLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-sncf-241p", v)); }
export function sncf141r(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-sncf-141r", v)); }
export function sncf141rLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-sncf-141r", v)); }
export function ns3700(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-ns-3700", v)); }
export function ns3700Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-ns-3700", v)); }
export function renfe141f(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-renfe-141f", v)); }
export function renfe141fLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-renfe-141f", v)); }
export function renfe242f(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-renfe-242f", v)); }
export function renfe242fLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-renfe-242f", v)); }
export function lnerA4(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-lner-a4", v)); }
export function lnerA4Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-lner-a4", v)); }
export function lnerA3(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-lner-a3", v)); }
export function lnerA3Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-lner-a3", v)); }
export function gwrCastle(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-gwr-castle", v)); }
export function gwrCastleLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-gwr-castle", v)); }
export function lmsBlackFive(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-lms-black-five", v)); }
export function lmsBlackFiveLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-lms-black-five", v)); }
export function br9f(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-br-9f", v)); }
export function br9fLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-br-9f", v)); }
// the Rocket has its own parts (rocket.ts); its WORLD_STEAM entry gives the title and the parameters
export function rocket(v?: ParamValues): MeshBuilder { const p = resolveParams(PARAMS["proc-vehicle-rocket"]!, v); return buildRocket(p.unit!, p.version as RocketVersion); }
export function rocketLod(v?: ParamValues): MeshBuilder { const p = resolveParams(PARAMS["proc-vehicle-rocket"]!, v); return buildRocketLod(p.unit!, p.version as RocketVersion); }
export function irWp(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-ir-wp", v)); }
export function irWpLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-ir-wp", v)); }
export function irWg(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-ir-wg", v)); }
export function irWgLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-ir-wg", v)); }
export function eirFairyQueen(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-eir-fairy-queen", v)); }
export function eirFairyQueenLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-eir-fairy-queen", v)); }
export function dhrBClass(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-dhr-b-class", v)); }
export function dhrBClassLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-dhr-b-class", v)); }
export function crQj(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-cr-qj", v)); }
export function crQjLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-cr-qj", v)); }
export function crSy(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-cr-sy", v)); }
export function crSyLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-cr-sy", v)); }
export function crJs(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-cr-js", v)); }
export function crJsLod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-cr-js", v)); }
export function kpevP8(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-kpev-p8", v)); }
export function kpevP8Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-kpev-p8", v)); }

/** Engine and tender weights (t), power (kW), top speed. */
const steamGame = (weight: number, power: number, maxspeed: number, tender: number): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }],
});

const design = (id: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, game: GameProperties, references: string, loadingGauge?: "uk" | "us"): ProceduralDesign => ({
  id, title: WORLD_STEAM[id]!.base.title, build, buildLod, params: PARAMS[id]!, game, catalog: STEAM_CATALOG, references, ...(loadingGauge ? { loadingGauge } : {}),
});

export const WORLD_STEAM_DESIGNS: ProceduralDesign[] = [
  design("proc-vehicle-drg-01", drg01, drg01Lod, steamGame(109, 1670, 130, 77), "drg-01"),
  design("proc-vehicle-dr-52", dr52, dr52Lod, steamGame(84, 1192, 80, 60), "dr-52"),
  design("proc-vehicle-kpev-p8", kpevP8, kpevP8Lod, steamGame(78, 868, 100, 50), "kpev-p8"),
  design("proc-vehicle-sncf-241p", sncf241p, sncf241pLod, steamGame(131, 2980, 120, 85), "sncf-241p"),
  design("proc-vehicle-renfe-141f", renfe141f, renfe141fLod, steamGame(102, 1460, 90, 60), "renfe-141f"),
  design("proc-vehicle-renfe-242f", renfe242f, renfe242fLod, steamGame(138, 2100, 135, 90), "renfe-242f"),
  design("proc-vehicle-lner-a4", lnerA4, lnerA4Lod, steamGame(104, 1360, 160, 65), "lner-a4", "uk"),
  design("proc-vehicle-lner-a3", lnerA3, lnerA3Lod, steamGame(98, 1300, 160, 58), "lner-a3", "uk"),
  design("proc-vehicle-gwr-castle", gwrCastle, gwrCastleLod, steamGame(81, 1100, 145, 47), "gwr-castle", "uk"),
  design("proc-vehicle-lms-black-five", lmsBlackFive, lmsBlackFiveLod, steamGame(73, 1000, 130, 54), "lms-black-five", "uk"),
  design("proc-vehicle-br-9f", br9f, br9fLod, steamGame(88, 1500, 145, 53), "br-9f", "uk"),
  design("proc-vehicle-rocket", rocket, rocketLod, steamGame(4.5, 15, 47, 3), "rocket", "uk"),
  design("proc-vehicle-ir-wp", irWp, irWpLod, steamGame(102, 1440, 110, 75), "ir-wp", "us"),
  design("proc-vehicle-ir-wg", irWg, irWgLod, steamGame(122, 1600, 80, 80), "ir-wg", "us"),
  design("proc-vehicle-eir-fairy-queen", eirFairyQueen, eirFairyQueenLod, steamGame(26, 97, 40, 14), "eir-fairy-queen", "us"),
  design("proc-vehicle-dhr-b-class", dhrBClass, dhrBClassLod, steamGame(14, 60, 30, 4), "dhr-b-class"),
  design("proc-vehicle-cr-qj", crQj, crQjLod, steamGame(134, 2200, 80, 92), "cr-qj", "us"),
  design("proc-vehicle-cr-sy", crSy, crSyLod, steamGame(89, 1100, 80, 55), "cr-sy", "us"),
  design("proc-vehicle-cr-js", crJs, crJsLod, steamGame(104, 1500, 85, 70), "cr-js", "us"),
  design("proc-vehicle-ns-3700", ns3700, ns3700Lod, steamGame(72, 920, 100, 45), "ns-3700"),
  design("proc-vehicle-sncf-141r", sncf141r, sncf141rLod, steamGame(116, 1840, 100, 84), "sncf-141r"),
];
