// The steam locomotives of the eight countries' families, each with its tender
// (`unit`), stated with the parametric steam generator (steamWorld.ts) on the
// steam kit (steamLoco.ts). See docs/models/world-steam.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { buildLoco } from "./steamLoco.ts";
import { steamLocoLod } from "./lodSteam.ts";
import { STEAM_CATALOG, UNIT_PARAM } from "./steamLocos.ts";
import { enumParam } from "./emuParts.ts";
import { steamEngineSpec, steamTenderSpec, type WorldSteam } from "./steamWorld.ts";

/** A design: its engine and, by livery, the paint and number. */
interface SteamDesign {
  base: WorldSteam;
  liveries?: Record<string, { title: string; palette: WorldSteam["palette"]; number: string }>;
}

const BLACK_RED = { paint: "#1d1e20", wheel: "#a51a1f", frame: "#a51a1f", smokebox: "#1c1d22" };
const ALL_BLACK = { paint: "#1d1e20", wheel: "#2a2b2d", frame: "#a51a1f", smokebox: "#1c1d22" };
const UIC = { top: 4.65, coupler: "buffers", half: 1.5 } as const;

export const WORLD_STEAM: Record<string, SteamDesign> = {
  "proc-vehicle-drg-01": { base: { ...UIC, title: "DRG 01", lead: 2, coupled: 3, trail: 1, leadD: 0.85, coupledD: 2.0, trailD: 1.25, boilerR: 0.9, deflectors: "wagner", domes: 2, palette: BLACK_RED, tender: { length: 9.2, axles: 4, d: 1.0 }, number: "01 118" } },
  "proc-vehicle-dr-52": { base: { ...UIC, title: "DR 52", lead: 1, coupled: 5, trail: 0, leadD: 0.85, coupledD: 1.4, trailD: 0, boilerR: 0.85, deflectors: "wagner", domes: 2, palette: BLACK_RED, tender: { length: 8.9, axles: 4, d: 1.0 }, number: "52 8154" } },
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
};

function paramsOf(d: SteamDesign): ParamSpec[] {
  return d.liveries ? [UNIT_PARAM, enumParam("livery", "Livery", Object.fromEntries(Object.entries(d.liveries).map(([k, v]) => [k, v.title])))] : [UNIT_PARAM];
}

const PARAMS: Record<string, ParamSpec[]> = Object.fromEntries(Object.entries(WORLD_STEAM).map(([id, d]) => [id, paramsOf(d)]));

/** The spec of a design's engine or tender for the given values. */
export function worldSteamSpec(id: string, v?: ParamValues) {
  const d = WORLD_STEAM[id]!;
  const p = resolveParams(PARAMS[id]!, v);
  const l = d.liveries?.[p.livery!];
  const s: WorldSteam = l ? { ...d.base, palette: l.palette, number: l.number } : d.base;
  return p.unit === "tender" ? steamTenderSpec(s) : steamEngineSpec(s);
}

export function drg01(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-drg-01", v)); }
export function drg01Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-drg-01", v)); }
export function dr52(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-dr-52", v)); }
export function dr52Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-dr-52", v)); }
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
export function kpevP8(v?: ParamValues): MeshBuilder { return buildLoco(worldSteamSpec("proc-vehicle-kpev-p8", v)); }
export function kpevP8Lod(v?: ParamValues): MeshBuilder { return steamLocoLod(worldSteamSpec("proc-vehicle-kpev-p8", v)); }

/** Engine and tender weights (t), power (kW), top speed. */
const steamGame = (weight: number, power: number, maxspeed: number, tender: number): GameProperties => ({
  weight, power, maxspeed, accel: null, variants: [{ params: { unit: "tender" }, weight: tender, power: 0 }],
});

const design = (id: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, game: GameProperties, references: string): ProceduralDesign => ({
  id, title: WORLD_STEAM[id]!.base.title, build, buildLod, params: PARAMS[id]!, game, catalog: STEAM_CATALOG, references,
});

export const WORLD_STEAM_DESIGNS: ProceduralDesign[] = [
  design("proc-vehicle-drg-01", drg01, drg01Lod, steamGame(109, 1670, 130, 77), "drg-01"),
  design("proc-vehicle-dr-52", dr52, dr52Lod, steamGame(84, 1192, 80, 60), "dr-52"),
  design("proc-vehicle-kpev-p8", kpevP8, kpevP8Lod, steamGame(78, 868, 100, 50), "kpev-p8"),
  design("proc-vehicle-sncf-241p", sncf241p, sncf241pLod, steamGame(131, 2980, 120, 85), "sncf-241p"),
  design("proc-vehicle-renfe-141f", renfe141f, renfe141fLod, steamGame(102, 1460, 90, 60), "renfe-141f"),
  design("proc-vehicle-renfe-242f", renfe242f, renfe242fLod, steamGame(138, 2100, 135, 90), "renfe-242f"),
  design("proc-vehicle-ns-3700", ns3700, ns3700Lod, steamGame(72, 920, 100, 45), "ns-3700"),
  design("proc-vehicle-sncf-141r", sncf141r, sncf141rLod, steamGame(116, 1840, 100, 84), "sncf-141r"),
];
