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

const GREY = c("#5a5d60", 0.6);
const coCo = (pivot: number, base: number, r: number) => [[-pivot, [-base, 0, base], r], [pivot, [-base, 0, base], r]] as const;
const boBo = (pivot: number, base: number, r: number) => [[-pivot, [-base, base], r], [pivot, [-base, base], r]] as const;

// ---------------------------------------------------------------------------

// the BR 103 has its own module (its own profile, measured on photographs)
import { BR103_PARAMS, db103, db103Lod } from "./deBr103.ts";
// the BR 101 has its own module (its own profile, measured on photographs)
import { BR101_PARAMS, db101, db101Lod } from "./deBr101.ts";

const BR120_BODY = { length: 19.2, W: 1.5, y0: 1.3, roof: 3.85, nose: "raked", bogies: boBo(4.95, 1.4, 0.625), pantograph: "singleArm", pantographX: 5.0, room: { kind: "grilles", n: 4, y: [2.5, 3.3] } } as const;
const BR120: Liveries = {
  orientRed: { title: "Orient red", loco: { ...BR120_BODY, palette: { red: c("#c8462a"), white: c("#efefea"), grey: GREY }, side: [[1.3, 1.55, "grey"], [1.55, 2.3, "red"], [2.3, 2.4, "white"], [2.4, 4.0, "red"]], number: "120 137-5" } },
  trafficRed: { title: "Traffic red", loco: { ...BR120_BODY, palette: { red: c("#ec0016"), grey: GREY }, side: [[1.3, 1.55, "grey"], [1.55, 4.0, "red"]], number: "120 160-7" } },
};

// the E 18 has its own module (its own profile and 1'Do1' running gear, measured on the DR drawing)
import { E18_PARAMS, drgE18, drgE18Lod } from "./deE18.ts";

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

const P = { br120: paramsOf(BR120), e94: paramsOf(E94) };

export { db103, db103Lod };
export { db101, db101Lod };
export function db120(v?: ParamValues): MeshBuilder { return buildBoxLoco(specOf(BR120, P.br120, v)); }
export function db120Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(specOf(BR120, P.br120, v)); }
export { drgE18, drgE18Lod };
export function drgE94(v?: ParamValues): MeshBuilder { return buildBoxLoco(specOf(E94, P.e94, v)); }
export function drgE94Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(specOf(E94, P.e94, v)); }

const game = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });
/** A design's parameters: none for a single livery. */
const params = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});

export const DE_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-db-103", title: "DB 103", build: db103, buildLod: db103Lod, params: BR103_PARAMS, game: game(114, 7440, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-103" },
  { id: "proc-vehicle-db-101", title: "DB 101", build: db101, buildLod: db101Lod, params: BR101_PARAMS, game: game(87, 6400, 220), catalog: ELECTRIC_LOCO_CATALOG, references: "db-101" },
  { id: "proc-vehicle-db-120", title: "DB 120", build: db120, buildLod: db120Lod, ...params(P.br120), game: game(84, 5600, 200), catalog: ELECTRIC_LOCO_CATALOG, references: "db-120" },
  { id: "proc-vehicle-drg-e18", title: "DRG E 18", build: drgE18, buildLod: drgE18Lod, ...params(E18_PARAMS), game: game(108, 3040, 150), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e18" },
  { id: "proc-vehicle-drg-e94", title: "DRG E 94", build: drgE94, buildLod: drgE94Lod, ...params(P.e94), game: game(118, 3300, 90), catalog: ELECTRIC_LOCO_CATALOG, references: "drg-e94" },
  { id: "proc-vehicle-db-v200", title: "DB V 200", build: dbV200, buildLod: dbV200Lod, params: V200_PARAMS, game: game(80, 1620, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-v200" },
  { id: "proc-vehicle-db-218", title: "DB 218", build: dbBr218, buildLod: dbBr218Lod, params: BR218_PARAMS, game: game(79, 1840, 140), catalog: DIESEL_LOCO_CATALOG, references: "db-218" },
];
