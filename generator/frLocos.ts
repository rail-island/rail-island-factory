// French electric and diesel locomotives on the box locomotive kit (stated
// with worldLocoKit.ts): Paul Arzens's "nez casse" family - the CC 6500, the
// quadri-current CC 40100, the BB 22200 and the CC 72000 diesel - the CC 7100
// of the 1955 speed record and the BB 9200 of Alsthom's 1950s body, the
// BB 27000 Prima and the BB 67400 diesel. The bodies are exported: the Dutch
// 1100, 1300 and 1600 / 1700 are their sisters (nlLocos.ts).
// See docs/models/france-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import { resolveParams, type GameProperties, type ParamSpec, type ParamValues, type ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { enumParam } from "./emuParts.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { worldLocoSpec, type WorldLoco } from "./worldLocoKit.ts";

export type Liveries = Record<string, { title: string; loco: WorldLoco }>;
type Body = Omit<WorldLoco, "palette" | "side" | "number">;

const GREY = c("#5a5d60", 0.6);
const WHITE = c("#efefea");
const mono = (pivot: number, base: number, r: number, axles: 2 | 3) =>
  [[-pivot, axles === 3 ? [-base, 0, base] : [-base, base], r], [pivot, axles === 3 ? [-base, 0, base] : [-base, base], r]] as const;

/** White pinstripes over a body colour: the 1960s SNCF lines along the sides. */
const pinstripes = (body: string, at: number): WorldLoco["side"] => [[1.3, 1.6, "grey"], [1.6, at, body], [at, at + 0.06, "white"], [at + 0.06, at + 0.14, body], [at + 0.14, at + 0.2, "white"], [at + 0.2, 4.3, body]];

// ---------------------------------------------------------------------------
// The bodies

export const CC6500_BODY: Body = { length: 20.19, W: 1.5, y0: 1.3, roof: 4.0, nose: "nezCasse", bogies: mono(5.6, 1.6, 0.57, 3), pantograph: "singleArm", pantographX: 5.4, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
export const CC40100_BODY: Body = { ...CC6500_BODY, length: 22.03, bogies: mono(6.2, 1.6, 0.55, 3), pantographX: 6.0, room: { kind: "grilles", n: 6, y: [2.6, 3.4] } };
export const BB22200_BODY: Body = { length: 17.48, W: 1.5, y0: 1.3, roof: 4.0, nose: "nezCasse", bogies: mono(4.5, 1.4, 0.55, 2), pantograph: "singleArm", pantographX: 4.3, room: { kind: "grilles", n: 4, y: [2.6, 3.4] } };
export const CC72000_BODY: Body = { length: 20.19, W: 1.5, y0: 1.3, roof: 4.0, nose: "nezCasse", bogies: mono(5.6, 1.6, 0.57, 3), exhausts: [-1.5], room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
/** Alsthom's rounded 1950s body: the CC 7100 (and the NS 1300), the BB 9200 a shorter Bo-Bo of the family. */
export const CC7100_BODY: Body = { length: 18.92, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: mono(5.3, 1.75, 0.625, 3), pantograph: "diamond", pantographX: 5.0, room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
export const BB9200_BODY: Body = { length: 16.2, W: 1.48, y0: 1.35, roof: 3.95, nose: "flat", bogies: mono(4.25, 1.6, 0.625, 2), pantograph: "diamond", pantographX: 4.1, room: { kind: "grilles", n: 4, y: [2.6, 3.3] } };
/** The Alstom Prima: the BB 27000 (and India's WAG-12B on its twin frames). */
export const PRIMA_BODY: Body = { length: 19.52, W: 1.48, y0: 1.3, roof: 4.0, nose: "raked", bogies: mono(5.0, 1.35, 0.575, 2), pantograph: "singleArm", pantographX: 5.0, room: { kind: "grilles", n: 4, y: [2.6, 3.4] } };
const BB67400_BODY: Body = { length: 17.09, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: mono(4.5, 1.4, 0.55, 2), exhausts: [0.4], room: { kind: "grilles", n: 4, y: [2.6, 3.3] } };

// ---------------------------------------------------------------------------
// The liveries

const CC6500: Liveries = {
  capitole: { title: "Capitole", loco: { ...CC6500_BODY, palette: { red: c("#b5232b"), white: WHITE, grey: GREY }, side: pinstripes("red", 2.3), number: "CC 6544" } },
  maurienne: { title: "Maurienne green", loco: { ...CC6500_BODY, palette: { green: c("#2f6b3a"), white: WHITE, grey: GREY }, side: pinstripes("green", 2.3), number: "CC 6558" } },
  beton: { title: "Beton", loco: { ...CC6500_BODY, palette: { concrete: c("#8c9196", 0.5), orange: c("#e8701e"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.25, "concrete"], [2.25, 2.45, "orange"], [2.45, 4.3, "concrete"]], number: "CC 6575" } },
};
const CC40100: Liveries = {
  inox: { title: "Stainless steel", loco: { ...CC40100_BODY, palette: { inox: c("#b8bcbf", 0.25), blue: c("#1f3c78"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.25, "inox"], [2.25, 2.45, "blue"], [2.45, 4.3, "inox"]], number: "CC 40101" } },
};
const BB22200: Liveries = {
  beton: { title: "Beton", loco: { ...BB22200_BODY, palette: { concrete: c("#8c9196", 0.5), orange: c("#e8701e"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.25, "concrete"], [2.25, 2.45, "orange"], [2.45, 4.3, "concrete"]], number: "BB 22201" } },
  enVoyage: { title: "En Voyage", loco: { ...BB22200_BODY, palette: { silver: c("#c9cccd", 0.4), blue: c("#1d3f80"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.0, "blue"], [2.0, 4.3, "silver"]], number: "BB 22232" } },
  fret: { title: "Fret", loco: { ...BB22200_BODY, palette: { grey2: c("#9aa0a5", 0.5), green: c("#3c9b38"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.1, "green"], [2.1, 4.3, "grey2"]], number: "BB 22343" } },
};
const CC72000: Liveries = {
  blueWhite: { title: "Blue and white", loco: { ...CC72000_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.9, "white"], [2.9, 4.3, "blue"]], number: "CC 72001" } },
  multiservice: { title: "Multiservice", loco: { ...CC72000_BODY, palette: { grey2: c("#8c9196", 0.5), red: c("#c8102e"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.2, "red"], [2.2, 4.3, "grey2"]], number: "72075" } },
};
const CC7100: Liveries = {
  blue: { title: "SNCF blue", loco: { ...CC7100_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: pinstripes("blue", 2.25), number: "CC 7107" } },
  green: { title: "Green", loco: { ...CC7100_BODY, palette: { green: c("#2f5e3a"), white: WHITE, grey: GREY }, side: pinstripes("green", 2.25), number: "CC 7121" } },
};
const BB9200: Liveries = {
  blue: { title: "SNCF blue", loco: { ...BB9200_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: pinstripes("blue", 2.25), number: "BB 9291" } },
  capitole: { title: "Capitole", loco: { ...BB9200_BODY, palette: { red: c("#b5232b"), white: WHITE, grey: GREY }, side: pinstripes("red", 2.25), number: "BB 9278" } },
};
const BB27000: Liveries = {
  fret: { title: "Fret SNCF", loco: { ...PRIMA_BODY, palette: { grey2: c("#c9cccd", 0.45), green: c("#3c9b38"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.15, "green"], [2.15, 4.3, "grey2"]], number: "427001" } },
};
const BB67400: Liveries = {
  blueWhite: { title: "Blue and white", loco: { ...BB67400_BODY, palette: { blue: c("#2a4f9a"), white: WHITE, grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.3, "blue"], [2.3, 2.85, "white"], [2.85, 4.3, "blue"]], number: "BB 67401" } },
  fret: { title: "Fret", loco: { ...BB67400_BODY, palette: { grey2: c("#9aa0a5", 0.5), green: c("#3c9b38"), grey: GREY }, side: [[1.3, 1.6, "grey"], [1.6, 2.1, "green"], [2.1, 4.3, "grey2"]], number: "BB 67567" } },
};

// ---------------------------------------------------------------------------

export const liveryParams = (l: Liveries): ParamSpec[] => [enumParam("livery", "Livery", Object.fromEntries(Object.entries(l).map(([k, v]) => [k, v.title])))];
export const liverySpec = (l: Liveries, p: readonly ParamSpec[], v?: ParamValues) => worldLocoSpec(l[resolveParams(p, v).livery!]!.loco);
/** A design's parameters: none for a single livery. */
export const paramsOf = (p: ParamSpec[]) => (p[0]!.values.length > 1 ? { params: p } : {});
export const locoGame = (weight: number, power: number, maxspeed: number): GameProperties => ({ weight, power, maxspeed, accel: null });

const P = { cc6500: liveryParams(CC6500), cc40100: liveryParams(CC40100), bb22200: liveryParams(BB22200), cc72000: liveryParams(CC72000), cc7100: liveryParams(CC7100), bb9200: liveryParams(BB9200), bb27000: liveryParams(BB27000), bb67400: liveryParams(BB67400) };

export function sncfCc6500(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(CC6500, P.cc6500, v)); }
export function sncfCc6500Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(CC6500, P.cc6500, v)); }
export function sncfCc40100(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(CC40100, P.cc40100, v)); }
export function sncfCc40100Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(CC40100, P.cc40100, v)); }
export function sncfBb22200(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(BB22200, P.bb22200, v)); }
export function sncfBb22200Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(BB22200, P.bb22200, v)); }
export function sncfCc72000(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(CC72000, P.cc72000, v)); }
export function sncfCc72000Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(CC72000, P.cc72000, v)); }
export function sncfCc7100(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(CC7100, P.cc7100, v)); }
export function sncfCc7100Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(CC7100, P.cc7100, v)); }
export function sncfBb9200(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(BB9200, P.bb9200, v)); }
export function sncfBb9200Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(BB9200, P.bb9200, v)); }
export function sncfBb27000(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(BB27000, P.bb27000, v)); }
export function sncfBb27000Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(BB27000, P.bb27000, v)); }
export function sncfBb67400(v?: ParamValues): MeshBuilder { return buildBoxLoco(liverySpec(BB67400, P.bb67400, v)); }
export function sncfBb67400Lod(v?: ParamValues): MeshBuilder { return boxLocoLod(liverySpec(BB67400, P.bb67400, v)); }

const E = ELECTRIC_LOCO_CATALOG, D = DIESEL_LOCO_CATALOG;
export const FR_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-sncf-cc6500", title: "SNCF CC 6500", build: sncfCc6500, buildLod: sncfCc6500Lod, ...paramsOf(P.cc6500), game: locoGame(115, 5900, 200), catalog: E, references: "sncf-cc6500" },
  { id: "proc-vehicle-sncf-cc40100", title: "SNCF CC 40100", build: sncfCc40100, buildLod: sncfCc40100Lod, ...paramsOf(P.cc40100), game: locoGame(107, 4480, 160), catalog: E, references: "sncf-cc40100" },
  { id: "proc-vehicle-sncf-bb22200", title: "SNCF BB 22200", build: sncfBb22200, buildLod: sncfBb22200Lod, ...paramsOf(P.bb22200), game: locoGame(89, 4360, 160), catalog: E, references: "sncf-bb22200" },
  { id: "proc-vehicle-sncf-cc7100", title: "SNCF CC 7100", build: sncfCc7100, buildLod: sncfCc7100Lod, ...paramsOf(P.cc7100), game: locoGame(107, 3490, 150), catalog: E, references: "sncf-cc7100" },
  { id: "proc-vehicle-sncf-bb9200", title: "SNCF BB 9200", build: sncfBb9200, buildLod: sncfBb9200Lod, ...paramsOf(P.bb9200), game: locoGame(82, 3850, 160), catalog: E, references: "sncf-bb9200" },
  { id: "proc-vehicle-sncf-bb27000", title: "SNCF BB 27000 Prima", build: sncfBb27000, buildLod: sncfBb27000Lod, ...paramsOf(P.bb27000), game: locoGame(90, 4200, 140), catalog: E, references: "sncf-bb27000" },
  { id: "proc-vehicle-sncf-bb67400", title: "SNCF BB 67400", build: sncfBb67400, buildLod: sncfBb67400Lod, ...paramsOf(P.bb67400), game: locoGame(83, 1765, 140), catalog: D, references: "sncf-bb67400" },
  { id: "proc-vehicle-sncf-cc72000", title: "SNCF CC 72000", build: sncfCc72000, buildLod: sncfCc72000Lod, ...paramsOf(P.cc72000), game: locoGame(114, 2650, 160), catalog: D, references: "sncf-cc72000" },
];
