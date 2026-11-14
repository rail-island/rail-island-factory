// German electric and diesel locomotives on the box locomotive kit
// (boxLocoKit.ts, stated with worldLocoKit.ts): the BR 103 express engine,
// the BR 101 and BR 120, the E 18, the E 94 "German crocodile", the V 200 and
// the BR 218. See docs/models/germany-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { enumParam } from "./emuParts.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { worldLocoSpec, type WorldLoco } from "./worldLocoKit.ts";
import { V200_PARAMS, dbV200, dbV200Lod } from "./deV200.ts";
import { BR218_PARAMS, dbBr218, dbBr218Lod } from "./deBr218.ts";

export { dbV200, dbV200Lod };

/** A design's liveries: each a full WorldLoco (the body is the same, the paint differs). */
type Liveries = Record<string, { title: string; loco: WorldLoco }>;

const coCo = (pivot: number, base: number, r: number) => [[-pivot, [-base, 0, base], r], [pivot, [-base, 0, base], r]] as const;

// ---------------------------------------------------------------------------

// the BR 103 has its own module (its own profile, measured on photographs)
import { BR103_PARAMS, db103, db103Lod } from "./deBr103.ts";
// the BR 101 has its own module (its own profile, measured on photographs)
import { BR101_PARAMS, db101, db101Lod } from "./deBr101.ts";

// the BR 120 has its own module (its own profile, measured on photographs)
import { BR120_PARAMS, db120, db120Lod } from "./deBr120.ts";

const E18_BODY = {
  length: 16.92, W: 1.48, y0: 1.65, roof: 3.95, nose: "raked", pantograph: "diamond", pantographX: 4.6, room: { kind: "windows", n: 4, y: [2.75, 3.3] },
  // the 1'Do1''s four coupled 1.6 m drivers, as two pairs the game can turn (the pony axles left out)
  bogies: [[-2.3, [-1.15, 1.15], 0.8], [2.3, [-1.15, 1.15], 0.8]],
} as const;
const E18: Liveries = {
  green: { title: "Green", loco: { ...E18_BODY, palette: { green: c("#284b3a"), black: c("#1e1f21", 0.7) }, side: [[1.65, 1.85, "black"], [1.85, 4.0, "green"]], number: "E 18 047" } },
};

const E94_BODY = {
  length: 18.6, W: 1.5, y0: 1.4, roof: 4.0, nose: "hoods", cabHalf: 3.2, hoodTop: 3.0, pantograph: "diamond", pantographX: 2.2, room: { kind: "windows", n: 2, y: [2.75, 3.4] },
  bogies: coCo(5.75, 1.65, 0.625),
  roofItems: [{ name: "roof cover", x: [-1.2, 1.2], w: [0.9, 0.75], y: [3.98, 4.2], mat: "roof" }],
} as const;
const E94: Liveries = {
  green: { title: "Green", loco: { ...E94_BODY, palette: { green: c("#2d4c3b"), black: c("#1e1f21", 0.7) }, side: [[1.4, 1.6, "black"], [1.6, 4.1, "green"]], number: "E 94 088" } },
};

// ---------------------------------------------------------------------------

const paramsOf = (l: Liveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
const specOf = (l: Liveries, p: readonly ParamSpec[], v?: ParamValues) => worldLocoSpec(l[resolveParams(p, v).livery!]!.loco);

const P = { e18: paramsOf(E18), e94: paramsOf(E94) };

export { db103, db103Lod };
export { db101, db101Lod };
export { db120, db120Lod };
export function drgE18(v?: ParamValues): MeshBuilder { return buildBoxLoco(specOf(E18, P.e18, v)); }
export function drgE18Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(specOf(E18, P.e18, v)); }
export function drgE94(v?: ParamValues): MeshBuilder { return buildBoxLoco(specOf(E94, P.e94, v)); }
export function drgE94Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(specOf(E94, P.e94, v)); }

const game = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });
/** A design's parameters: none for a single livery. */
const params = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});

export const DE_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-db-103", title: "DB 103", build: db103, buildLod: db103Lod, params: BR103_PARAMS, game: game(114, 7440, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-103" },
  { id: "proc-vehicle-db-101", title: "DB 101", build: db101, buildLod: db101Lod, params: BR101_PARAMS, game: game(87, 6400, 220), catalog: ELECTRIC_LOCO_CATALOG, references: "db-101" },
  { id: "proc-vehicle-db-120", title: "DB 120", build: db120, buildLod: db120Lod, params: BR120_PARAMS, game: game(84, 5600, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-120" },
  { id: "proc-vehicle-drg-e18", title: "DRG E 18", build: drgE18, buildLod: drgE18Lod, ...params(P.e18), game: game(108, 3040, 150), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e18" },
  { id: "proc-vehicle-drg-e94", title: "DRG E 94", build: drgE94, buildLod: drgE94Lod, ...params(P.e94), game: game(118, 3300, 90), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e94" },
  { id: "proc-vehicle-db-v200", title: "DB V 200", build: dbV200, buildLod: dbV200Lod, params: V200_PARAMS, game: game(80, 1620, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-v200" },
  { id: "proc-vehicle-db-218", title: "DB 218", build: dbBr218, buildLod: dbBr218Lod, params: BR218_PARAMS, game: game(79, 1840, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-218" },
];
