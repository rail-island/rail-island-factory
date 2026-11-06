// Swiss electric locomotives on the box locomotive kit (stated with
// worldLocoKit.ts): the Re 460, Re 4/4 II, Re 6/6 and Ae 6/6, the Ce 6/8 II
// "Krokodil" and the Ae 8/14 "Landi"; on the metre gauge, the Rhaetian
// Railway's Ge 4/4 III and Ge 6/6 I "Krokodil" and the Matterhorn Gotthard
// Bahn's rack HGe 4/4 II (its own profile tables, mgbHge442.ts). See docs/models/switzerland-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { boxLocoLod, buildBoxLoco } from "./boxLocoKit.ts";
import { c } from "./czElectricKit.ts";
import { ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { liveryParams, liverySpec, locoGame, paramsOf, type Liveries } from "./frLocos.ts";
import type { WorldLoco } from "./worldLocoKit.ts";
import { mgbHge442, mgbHge442Lod } from "./mgbHge442.ts";

export { mgbHge442, mgbHge442Lod };

type Body = Omit<WorldLoco, "palette" | "side" | "number">;
const GREY = c("#5a5d60", 0.6);
const WHITE = c("#efefea");
const pair = (pivot: number, base: number, r: number, axles: 2 | 3) => [[-pivot, axles === 3 ? [-base, 0, base] : [-base, base], r], [pivot, axles === 3 ? [-base, 0, base] : [-base, base], r]] as const;
/** A one-colour body with a dark sill and a white line under the windows. */
const painted = (body: Body, colour: string, number: string, line = true): WorldLoco => ({
  ...body, palette: { paint: c(colour), white: WHITE, grey: GREY },
  side: line ? [[1.0, body.y0 + 0.3, "grey"], [body.y0 + 0.3, body.y0 + 1.0, "paint"], [body.y0 + 1.0, body.y0 + 1.06, "white"], [body.y0 + 1.06, 4.4, "paint"]] : [[1.0, body.y0 + 0.3, "grey"], [body.y0 + 0.3, 4.4, "paint"]],
  number,
});

const SBB_RED = "#eb0000";
const SBB_GREEN = "#2e5d3d";
const RHB_RED = "#c8102e";

const RE460: Body = { length: 18.5, W: 1.48, y0: 1.3, roof: 3.95, nose: "streamlined", bogies: pair(5.0, 1.4, 0.55, 2), pantograph: "singleArm", pantographX: 5.0, room: { kind: "grilles", n: 4, y: [2.6, 3.4] } };
const RE420: Body = { length: 15.41, W: 1.48, y0: 1.3, roof: 3.95, nose: "flat", bogies: pair(3.8, 1.35, 0.63, 2), pantograph: "singleArm", pantographX: 3.6, room: { kind: "grilles", n: 3, y: [2.6, 3.4] } };
const RE620: Body = { length: 19.31, W: 1.48, y0: 1.3, roof: 3.95, nose: "flat", bogies: [[-5.9, [-1.35, 1.35], 0.63], [0, [-1.35, 1.35], 0.63], [5.9, [-1.35, 1.35], 0.63]], pantograph: "singleArm", pantographX: 5.6, room: { kind: "grilles", n: 5, y: [2.6, 3.4] } };
const AE66: Body = { length: 18.4, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: pair(5.0, 1.75, 0.63, 3), pantograph: "diamond", pantographX: 4.8, room: { kind: "windows", n: 4, y: [2.6, 3.2] } };
const CE68: Body = { length: 19.46, W: 1.45, y0: 1.4, roof: 4.0, nose: "hoods", cabHalf: 3.4, hoodTop: 3.05, bogies: pair(4.6, 1.4, 0.675, 3), pantograph: "diamond", pantographX: 2.2, room: { kind: "windows", n: 2, y: [2.75, 3.4] } };
const AE814: Body = { length: 34.0, W: 1.48, y0: 1.35, roof: 3.95, nose: "raked", bogies: [[-12.0, [-1.4, 1.4], 0.675], [-4.2, [-1.4, 1.4], 0.675], [4.2, [-1.4, 1.4], 0.675], [12.0, [-1.4, 1.4], 0.675]], pantograph: "diamond", pantographX: 13.0, room: { kind: "windows", n: 5, y: [2.6, 3.2] } };
const GE443: Body = { length: 16.0, W: 1.32, y0: 1.2, roof: 3.75, nose: "raked", bogies: pair(4.0, 1.3, 0.53, 2), pantograph: "singleArm", pantographX: 4.0, room: { kind: "grilles", n: 3, y: [2.4, 3.2] } };
const GE66: Body = { length: 13.3, W: 1.32, y0: 1.2, roof: 3.8, nose: "hoods", cabHalf: 2.2, hoodTop: 2.8, bogies: pair(3.1, 1.05, 0.54, 3), pantograph: "diamond", pantographX: 1.5, room: { kind: "windows", n: 2, y: [2.5, 3.2] } };

const L: Record<string, Liveries> = {
  re460: { sbbRed: { title: "SBB red", loco: painted(RE460, SBB_RED, "460 000-0") } },
  re420: { green: { title: "SBB green", loco: painted(RE420, SBB_GREEN, "11161") }, red: { title: "SBB red", loco: painted(RE420, SBB_RED, "420 161-9") } },
  re620: { green: { title: "SBB green", loco: painted(RE620, SBB_GREEN, "11601") }, red: { title: "SBB red", loco: painted(RE620, SBB_RED, "620 001-5") } },
  ae66: { green: { title: "SBB green", loco: painted(AE66, SBB_GREEN, "11401") }, red: { title: "SBB Cargo red", loco: painted(AE66, SBB_RED, "610 501-2") } },
  ce68: { brown: { title: "Brown", loco: painted(CE68, "#5a3a22", "14253", false) }, green: { title: "SBB green", loco: painted(CE68, SBB_GREEN, "14305", false) } },
  ae814: { green: { title: "SBB green", loco: painted(AE814, SBB_GREEN, "11852") } },
  ge443: { rhb: { title: "RhB red", loco: painted(GE443, RHB_RED, "641") } },
  ge66: { brown: { title: "Brown", loco: painted(GE66, "#5a3a22", "414", false) }, green: { title: "RhB green", loco: painted(GE66, "#2f5e3a", "415", false) } },
};

const P = Object.fromEntries(Object.entries(L).map(([k, l]) => [k, liveryParams(l)]));
const b = (k: string) => (v?: ParamValues): MeshBuilder => buildBoxLoco(liverySpec(L[k]!, P[k]!, v));
const lod = (k: string) => (v?: ParamValues): MeshBuilder => boxLocoLod(liverySpec(L[k]!, P[k]!, v));

export function sbbRe460(v?: ParamValues): MeshBuilder { return b("re460")(v); }
export function sbbRe460Lod(v?: ParamValues): MeshBuilder { return lod("re460")(v); }
export function sbbRe420(v?: ParamValues): MeshBuilder { return b("re420")(v); }
export function sbbRe420Lod(v?: ParamValues): MeshBuilder { return lod("re420")(v); }
export function sbbRe620(v?: ParamValues): MeshBuilder { return b("re620")(v); }
export function sbbRe620Lod(v?: ParamValues): MeshBuilder { return lod("re620")(v); }
export function sbbAe66(v?: ParamValues): MeshBuilder { return b("ae66")(v); }
export function sbbAe66Lod(v?: ParamValues): MeshBuilder { return lod("ae66")(v); }
export function sbbCe68(v?: ParamValues): MeshBuilder { return b("ce68")(v); }
export function sbbCe68Lod(v?: ParamValues): MeshBuilder { return lod("ce68")(v); }
export function sbbAe814(v?: ParamValues): MeshBuilder { return b("ae814")(v); }
export function sbbAe814Lod(v?: ParamValues): MeshBuilder { return lod("ae814")(v); }
export function rhbGe443(v?: ParamValues): MeshBuilder { return b("ge443")(v); }
export function rhbGe443Lod(v?: ParamValues): MeshBuilder { return lod("ge443")(v); }
export function rhbGe66(v?: ParamValues): MeshBuilder { return b("ge66")(v); }
export function rhbGe66Lod(v?: ParamValues): MeshBuilder { return lod("ge66")(v); }

const E = ELECTRIC_LOCO_CATALOG;
const d = (id: string, title: string, k: string, build: (v?: ParamValues) => MeshBuilder, buildLod: (v?: ParamValues) => MeshBuilder, weight: number, power: number, maxspeed: number): ProceduralDesign =>
  ({ id: `proc-vehicle-${id}`, title, build, buildLod, ...paramsOf(P[k]!), game: locoGame(weight, power, maxspeed), catalog: E, references: id });

export const CH_LOCOS: ProceduralDesign[] = [
  d("sbb-re460", "SBB Re 460", "re460", sbbRe460, sbbRe460Lod, 84, 6100, 230),
  d("sbb-re420", "SBB Re 4/4 II", "re420", sbbRe420, sbbRe420Lod, 80, 4700, 140),
  d("sbb-re620", "SBB Re 6/6", "re620", sbbRe620, sbbRe620Lod, 120, 7850, 140),
  d("sbb-ae66", "SBB Ae 6/6", "ae66", sbbAe66, sbbAe66Lod, 120, 4300, 125),
  d("sbb-ce68", "SBB Ce 6/8 II Krokodil", "ce68", sbbCe68, sbbCe68Lod, 128, 2700, 65),
  d("sbb-ae814", "SBB Ae 8/14 Landi", "ae814", sbbAe814, sbbAe814Lod, 240, 8160, 110),
  d("rhb-ge443", "RhB Ge 4/4 III", "ge443", rhbGe443, rhbGe443Lod, 62, 2400, 100),
  d("rhb-ge66", "RhB Ge 6/6 I Krokodil", "ge66", rhbGe66, rhbGe66Lod, 66, 794, 55),
  // its own profile tables (mgbHge442.ts), no livery parameter
  { id: "proc-vehicle-mgb-hge442", title: "MGB HGe 4/4 II", build: mgbHge442, buildLod: mgbHge442Lod, game: locoGame(64, 1932, 90), catalog: E, references: "mgb-hge442" },
];
