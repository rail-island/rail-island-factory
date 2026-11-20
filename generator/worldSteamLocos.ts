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
import { P8_WORLD, p8LodSpec, p8Spec } from "./deSteamP8.ts";
import { NS3700_WORLD, ns3700LodSpec, ns3700Spec } from "./nl3700.ts";
import { RENFE141F_WORLD, renfe141fLodSpec, renfe141fSpec } from "./es141f.ts";
import { wpLod, wpSpec } from "./inWp.ts";
import { wgLod, wgSpec } from "./inWg.ts";
import { dhrBLod, dhrBSpec } from "./inDhrB.ts";
import { buildFairyQueen, buildFairyQueenLod } from "./inFairyQueen.ts";
import { QJ_WORLD, qjLodSpec, qjSpec } from "./cnQj.ts";
import { SY_WORLD, syLodSpec, sySpec } from "./cnSy.ts";
import { JS_WORLD, jsLodSpec, jsSpec } from "./cnJs.ts";
import { RENFE242F_WORLD, renfe242fLodSpec, renfe242fSpec } from "./es242f.ts";
import { SNCF241P_WORLD, sncf241pLodSpec, sncf241pSpec } from "./fr241p.ts";
import { SNCF141R_WORLD, sncf141rLodSpec, sncf141rSpec } from "./fr141r.ts";

/** A design: its engine and, by livery, the paint and number. */
interface SteamDesign {
  base: WorldSteam;
  liveries?: Record<string, { title: string; palette: WorldSteam["palette"]; number: string }>;
}

const ALL_BLACK = { paint: "#1d1e20", wheel: "#2a2b2d", frame: "#a51a1f", smokebox: "#1c1d22" };
/** Britain's W6a gauge: the chimneys under 4.0 m, the cabs 2.74 m wide. */
const UK = { top: 3.95, coupler: "buffers", half: 1.37 } as const;
/** India's broad gauge: the bodies on the 3.3 m gauge, buffers and screw couplings; the 610 mm Darjeeling line's tiny engines. */
const IR = { top: 4.5, coupler: "buffers", half: 1.6 } as const;
const UIC = { top: 4.65, coupler: "buffers", half: 1.5 } as const;

export const WORLD_STEAM: Record<string, SteamDesign> = {
  "proc-vehicle-drg-01": DRG01_WORLD,
  "proc-vehicle-dr-52": DR52_WORLD,
  "proc-vehicle-kpev-p8": P8_WORLD,
  "proc-vehicle-sncf-241p": SNCF241P_WORLD,
  "proc-vehicle-sncf-141r": SNCF141R_WORLD,
  "proc-vehicle-ns-3700": NS3700_WORLD,
  "proc-vehicle-renfe-141f": RENFE141F_WORLD,
  "proc-vehicle-renfe-242f": RENFE242F_WORLD,
  "proc-vehicle-lner-a4": { base: { ...UK, title: "LNER A4", lead: 2, coupled: 3, trail: 1, leadD: 0.97, coupledD: 2.03, trailD: 1.17, boilerR: 0.85, deflectors: "none", domes: 1, palette: { paint: "#1d3f80", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.6, axles: 4, d: 1.0 }, number: "4468 MALLARD" },
    liveries: { garterBlue: { title: "Garter blue", palette: { paint: "#1d3f80", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "4468 MALLARD" }, brGreen: { title: "BR green", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "60022" } } },
  "proc-vehicle-lner-a3": { base: { ...UK, title: "LNER A3", lead: 2, coupled: 3, trail: 1, leadD: 0.97, coupledD: 2.03, trailD: 1.12, boilerR: 0.85, deflectors: "witte", domes: 1, palette: { paint: "#3a7a3a", wheel: "#3a7a3a", frame: "#7a2e22", smokebox: "#1c1d22" }, tender: { length: 8.0, axles: 4, d: 1.0 }, number: "4472" },
    liveries: { appleGreen: { title: "Apple green", palette: { paint: "#3a7a3a", wheel: "#3a7a3a", frame: "#7a2e22", smokebox: "#1c1d22" }, number: "4472" }, brGreen: { title: "BR green", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "60103" } } },
  "proc-vehicle-gwr-castle": { base: { ...UK, title: "GWR Castle", lead: 2, coupled: 3, trail: 0, leadD: 0.96, coupledD: 2.04, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, belpaire: true, palette: { paint: "#235a33", wheel: "#235a33", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 7.6, axles: 3, d: 1.23 }, number: "4073 CAERPHILLY CASTLE" } },
  "proc-vehicle-lms-black-five": { base: { ...UK, title: "LMS Black Five", lead: 2, coupled: 3, trail: 0, leadD: 0.91, coupledD: 1.83, trailD: 0, boilerR: 0.84, deflectors: "none", domes: 1, belpaire: true, palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 7.8, axles: 3, d: 1.07 }, number: "45407" } },
  "proc-vehicle-br-9f": { base: { ...UK, title: "BR 9F", lead: 1, coupled: 5, trail: 0, leadD: 1.0, coupledD: 1.52, trailD: 0, boilerR: 0.88, deflectors: "wagner", domes: 1, belpaire: true, palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 8.4, axles: 3, d: 1.0 }, number: "92203" },
    liveries: { brBlack: { title: "BR black", palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "92203" }, eveningStar: { title: "Evening Star", palette: { paint: "#1f4d2e", wheel: "#1f4d2e", frame: "#1d1e20", smokebox: "#1c1d22" }, number: "92220 EVENING STAR" } } },
  "proc-vehicle-rocket": { base: { ...UK, title: "Stephenson's Rocket", lead: 0, coupled: 1, trail: 1, leadD: 0, coupledD: 1.435, trailD: 0.76, boilerR: 0.5, deflectors: "none", domes: 0, noValveGear: true, noCab: true, palette: { paint: "#e6b422", wheel: "#e6b422", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 4.2, axles: 2, d: 0.9 }, number: "ROCKET" } },
  // the WP is drawn from its own spec (inWp.ts); this entry gives the title, the measures and the livery keys
  "proc-vehicle-ir-wp": { base: { ...IR, title: "IR WP", lead: 2, coupled: 3, trail: 1, leadD: 1.092, coupledD: 1.702, trailD: 1.092, boilerR: 0.92, deflectors: "none", domes: 1, palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 9.85, axles: 4, d: 0.95 }, number: "7200" },
    liveries: { black: { title: "Black", palette: { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, number: "7200" }, greenYellow: { title: "Green, yellow", palette: { paint: "#2f6b3a", wheel: "#a51a1f", frame: "#d9b54a", smokebox: "#1c1d22" }, number: "7161" } } },
  "proc-vehicle-ir-wg": { base: { ...IR, title: "IR WG", lead: 1, coupled: 4, trail: 1, leadD: 0.98, coupledD: 1.562, trailD: 0.98, boilerR: 0.92, deflectors: "none", domes: 1, palette: { paint: "#1d1e20", wheel: "#1d1e20", frame: "#232326", smokebox: "#1c1d22" }, tender: { length: 8.8, axles: 4, d: 0.914 }, number: "10491" } },
  "proc-vehicle-eir-fairy-queen": { base: { ...IR, title: "Fairy Queen", lead: 1, coupled: 1, trail: 1, leadD: 1.0, coupledD: 1.83, trailD: 1.0, boilerR: 0.6, deflectors: "none", domes: 1, noValveGear: true, palette: { paint: "#2f5e3a", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" }, tender: { length: 5.2, axles: 2, d: 1.0 }, number: "22 EIR" } },
  "proc-vehicle-dhr-b-class": { base: { top: 3.2, coupler: "buffers", half: 1.05, title: "DHR B class", lead: 0, coupled: 2, trail: 0, leadD: 0, coupledD: 0.66, trailD: 0, boilerR: 0.5, deflectors: "none", domes: 1, noValveGear: true, palette: { paint: "#1d4596", wheel: "#a51a1f", frame: "#1d1e20", smokebox: "#1c1d22" }, tender: { length: 3.6, axles: 2, d: 0.6 }, number: "779" } },
  "proc-vehicle-cr-qj": QJ_WORLD,
  "proc-vehicle-cr-sy": SY_WORLD,
  "proc-vehicle-cr-js": JS_WORLD,
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
// the 241 P is drawn from its own spec (fr241p.ts)
const sncf241pUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-sncf-241p"]!, v).unit!;
export function sncf241p(v?: ParamValues): MeshBuilder { return buildLoco(sncf241pSpec(sncf241pUnit(v))); }
export function sncf241pLod(v?: ParamValues): MeshBuilder { return steamLocoLod(sncf241pLodSpec(sncf241pUnit(v))); }
// the SNCF 141 R is drawn from its own spec (fr141r.ts)
const sncf141rUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-sncf-141r"]!, v).unit!;
export function sncf141r(v?: ParamValues): MeshBuilder { return buildLoco(sncf141rSpec(sncf141rUnit(v))); }
export function sncf141rLod(v?: ParamValues): MeshBuilder { return steamLocoLod(sncf141rLodSpec(sncf141rUnit(v))); }
// the NS 3700 is drawn from its own spec (nl3700.ts)
const ns3700Unit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-ns-3700"]!, v).unit!;
export function ns3700(v?: ParamValues): MeshBuilder { return buildLoco(ns3700Spec(ns3700Unit(v))); }
export function ns3700Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(ns3700LodSpec(ns3700Unit(v))); }
// the Renfe 141F is drawn from its own spec (es141f.ts)
const renfe141fUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-renfe-141f"]!, v).unit!;
export function renfe141f(v?: ParamValues): MeshBuilder { return buildLoco(renfe141fSpec(renfe141fUnit(v))); }
export function renfe141fLod(v?: ParamValues): MeshBuilder { return steamLocoLod(renfe141fLodSpec(renfe141fUnit(v))); }
// the 242F is drawn from its own spec (es242f.ts)
const renfe242fUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-renfe-242f"]!, v).unit!;
export function renfe242f(v?: ParamValues): MeshBuilder { return buildLoco(renfe242fSpec(renfe242fUnit(v))); }
export function renfe242fLod(v?: ParamValues): MeshBuilder { return steamLocoLod(renfe242fLodSpec(renfe242fUnit(v))); }
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
const irWpParams = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-ir-wp"]!, v);
export function irWp(v?: ParamValues): MeshBuilder { const p = irWpParams(v); return buildLoco(wpSpec(p.unit!, p.livery!)); }
export function irWpLod(v?: ParamValues): MeshBuilder { const p = irWpParams(v); return wpLod(p.unit!, p.livery!); }
// the WG is drawn from its own spec (inWg.ts); its WORLD_STEAM entry gives the title and the measures
const irWgUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-ir-wg"]!, v).unit!;
export function irWg(v?: ParamValues): MeshBuilder { return buildLoco(wgSpec(irWgUnit(v))); }
export function irWgLod(v?: ParamValues): MeshBuilder { return wgLod(irWgUnit(v)); }
// the Fairy Queen is drawn with its own parts (inFairyQueen.ts); its WORLD_STEAM entry gives the title and the parameters
const fairyQueenUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-eir-fairy-queen"]!, v).unit!;
export function eirFairyQueen(v?: ParamValues): MeshBuilder { return buildFairyQueen(fairyQueenUnit(v)); }
export function eirFairyQueenLod(v?: ParamValues): MeshBuilder { return buildFairyQueenLod(fairyQueenUnit(v)); }
// the DHR B class is a saddle tank engine drawn from its own spec (inDhrB.ts): both `unit` values draw the engine
export function dhrBClass(_v?: ParamValues): MeshBuilder { return buildLoco(dhrBSpec()); }
export function dhrBClassLod(_v?: ParamValues): MeshBuilder { return dhrBLod(); }
// the QJ is drawn from its own spec (cnQj.ts)
const qjUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-cr-qj"]!, v).unit!;
export function crQj(v?: ParamValues): MeshBuilder { return buildLoco(qjSpec(qjUnit(v))); }
export function crQjLod(v?: ParamValues): MeshBuilder { return steamLocoLod(qjLodSpec(qjUnit(v))); }
// the SY is drawn from its own spec (cnSy.ts)
const crSyUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-cr-sy"]!, v).unit!;
export function crSy(v?: ParamValues): MeshBuilder { return buildLoco(sySpec(crSyUnit(v))); }
export function crSyLod(v?: ParamValues): MeshBuilder { return steamLocoLod(syLodSpec(crSyUnit(v))); }
// the JS is drawn from its own spec (cnJs.ts)
const jsUnit = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-cr-js"]!, v).unit!;
export function crJs(v?: ParamValues): MeshBuilder { return buildLoco(jsSpec(jsUnit(v))); }
export function crJsLod(v?: ParamValues): MeshBuilder { return steamLocoLod(jsLodSpec(jsUnit(v))); }
// the Prussian P 8 is drawn from its own spec (deSteamP8.ts)
const p8Params = (v?: ParamValues) => resolveParams(PARAMS["proc-vehicle-kpev-p8"]!, v);
export function kpevP8(v?: ParamValues): MeshBuilder { const p = p8Params(v); return buildLoco(p8Spec(p.unit!, p.livery!)); }
export function kpevP8Lod(v?: ParamValues): MeshBuilder { const p = p8Params(v); return steamLocoLod(p8LodSpec(p.unit!, p.livery!)); }

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
  design("proc-vehicle-sncf-241p", sncf241p, sncf241pLod, steamGame(131.4, 2940, 120, 84.8), "sncf-241p"),
  design("proc-vehicle-renfe-141f", renfe141f, renfe141fLod, steamGame(103, 1460, 90, 63.5), "renfe-141f"),
  design("proc-vehicle-renfe-242f", renfe242f, renfe242fLod, steamGame(142.5, 1990, 135, 70.2), "renfe-242f"),
  design("proc-vehicle-lner-a4", lnerA4, lnerA4Lod, steamGame(104, 1360, 160, 65), "lner-a4", "uk"),
  design("proc-vehicle-lner-a3", lnerA3, lnerA3Lod, steamGame(98, 1300, 160, 58), "lner-a3", "uk"),
  design("proc-vehicle-gwr-castle", gwrCastle, gwrCastleLod, steamGame(81, 1100, 145, 47), "gwr-castle", "uk"),
  design("proc-vehicle-lms-black-five", lmsBlackFive, lmsBlackFiveLod, steamGame(73, 1000, 130, 54), "lms-black-five", "uk"),
  design("proc-vehicle-br-9f", br9f, br9fLod, steamGame(88, 1500, 145, 53), "br-9f", "uk"),
  design("proc-vehicle-rocket", rocket, rocketLod, steamGame(4.5, 15, 47, 3), "rocket", "uk"),
  design("proc-vehicle-ir-wp", irWp, irWpLod, steamGame(102, 1440, 110, 75), "ir-wp", "us"),
  design("proc-vehicle-ir-wg", irWg, irWgLod, steamGame(122, 1600, 80, 80), "ir-wg", "us"),
  design("proc-vehicle-eir-fairy-queen", eirFairyQueen, eirFairyQueenLod, steamGame(26, 97, 40, 14), "eir-fairy-queen", "us"),
  design("proc-vehicle-dhr-b-class", dhrBClass, dhrBClassLod, { weight: 14, power: 60, maxspeed: 30, accel: null }, "dhr-b-class"),
  design("proc-vehicle-cr-qj", crQj, crQjLod, steamGame(134, 2200, 80, 118), "cr-qj", "us"),
  design("proc-vehicle-cr-sy", crSy, crSyLod, steamGame(84, 1100, 80, 54.5), "cr-sy", "us"),
  design("proc-vehicle-cr-js", crJs, crJsLod, steamGame(104, 1690, 85, 84), "cr-js", "us"),
  design("proc-vehicle-ns-3700", ns3700, ns3700Lod, steamGame(72, 990, 110, 43), "ns-3700"),
  design("proc-vehicle-sncf-141r", sncf141r, sncf141rLod, steamGame(116, 2150, 100, 75), "sncf-141r"),
];
