// Spanish units on the series kit (shinkansen.ts), each measured from photographs
// in its own module: the AVE S-100 and S-103, the Talgo S-102 "Pato", S-106 Avril
// and S-130 Alvia and the Talgo III coaches, the dual-gauge S-120, the Civia, the
// 446 and 440 EMUs, the 592 DMU and Iryo's Frecciarossa 1000 (S-109). This file
// registers them. See docs/models/spain-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams } from "./shinkansen.ts";
import { TALGO_III } from "./esTalgoIii.ts";
import { S103 } from "./esS103.ts";
import { S102, s102Series } from "./esS102.ts";
import { renfeS100, renfeS100Lod, S100, S100_PARAMS } from "./esS100.ts";
import { S106 } from "./esS106.ts";
import { S120, renfeS120, renfeS120Lod } from "./esS120.ts";
import { S130 } from "./esS130.ts";
import { R446, r446Game } from "./es446.ts";
import { CIVIA } from "./esCivia.ts";
import { r440Game, R440, R440_PARAMS, renfe440, renfe440Lod } from "./es440.ts";
import { R592 } from "./es592.ts";
import { S109 } from "./esIryoS109.ts";

export { renfeS100, renfeS100Lod, S100 };
export { S106 };
export { renfeS120, renfeS120Lod };
export { R440, renfe440, renfe440Lod };
export { S103, S130, R446, R592, TALGO_III };

const P = {
  s100: S100_PARAMS, s103: seriesParams(S103), s102: seriesParams(S102), s106: seriesParams(S106), s130: seriesParams(S130), talgo3: seriesParams(TALGO_III),
  s120: seriesParams(S120), civia: seriesParams(CIVIA), r446: seriesParams(R446), r440: R440_PARAMS, r592: seriesParams(R592), s109: seriesParams(S109),
};

export function renfeS103(v?: ParamValues): MeshBuilder { return buildSeries(S103, P.s103, v); }
export function renfeS103Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S103, P.s103, v); }
export function renfeS102(v?: ParamValues): MeshBuilder { return buildSeries(s102Series(v), P.s102, v); }
export function renfeS102Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S102, P.s102, v); }
export function renfeS106(v?: ParamValues): MeshBuilder { return buildSeries(S106, P.s106, v); }
export function renfeS106Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S106, P.s106, v); }
export function renfeS130(v?: ParamValues): MeshBuilder { return buildSeries(S130, P.s130, v); }
export function renfeS130Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S130, P.s130, v); }
export function talgoIii(v?: ParamValues): MeshBuilder { return buildSeries(TALGO_III, P.talgo3, v); }
export function talgoIiiLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(TALGO_III, P.talgo3, v); }
export function renfeCivia(v?: ParamValues): MeshBuilder { return buildSeries(CIVIA, P.civia, v); }
export function renfeCiviaLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CIVIA, P.civia, v); }
export function renfe446(v?: ParamValues): MeshBuilder { return buildSeries(R446, P.r446, v); }
export function renfe446Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R446, P.r446, v); }
export function renfe592(v?: ParamValues): MeshBuilder { return buildSeries(R592, P.r592, v); }
export function renfe592Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(R592, P.r592, v); }
export function iryoS109(v?: ParamValues): MeshBuilder { return buildSeries(S109, P.s109, v); }
export function iryoS109Lod(v?: ParamValues): MeshBuilder { return buildSeriesLod(S109, P.s109, v); }

export const ES_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-renfe-s100", "AVE S-100", S100, P.s100, renfeS100, renfeS100Lod, "renfe-s100", "uic"),
  seriesDesign("proc-vehicle-renfe-s103", "AVE S-103", S103, P.s103, renfeS103, renfeS103Lod, "renfe-s103", "uic"),
  seriesDesign("proc-vehicle-renfe-s102", "AVE S-102 Pato", S102, P.s102, renfeS102, renfeS102Lod, "renfe-s102", "uic"),
  seriesDesign("proc-vehicle-renfe-s106", "Talgo Avril S-106", S106, P.s106, renfeS106, renfeS106Lod, "renfe-s106", "uic"),
  seriesDesign("proc-vehicle-renfe-s130", "Alvia S-130", S130, P.s130, renfeS130, renfeS130Lod, "renfe-s130", "uic"),
  seriesDesign("proc-vehicle-talgo-iii", "Talgo III", TALGO_III, P.talgo3, talgoIii, talgoIiiLod, "talgo-iii", "uic"),
  seriesDesign("proc-vehicle-renfe-s120", "Renfe S-120", S120, P.s120, renfeS120, renfeS120Lod, "renfe-s120", "uic"),
  seriesDesign("proc-vehicle-renfe-civia", "Renfe Civia", CIVIA, P.civia, renfeCivia, renfeCiviaLod, "renfe-civia", "uic"),
  ((d) => ({ ...d, game: r446Game(d.game!) }))(seriesDesign("proc-vehicle-renfe-446", "Renfe 446", R446, P.r446, renfe446, renfe446Lod, "renfe-446", "uic")),
  ((d) => ({ ...d, game: r440Game(d.game!) }))(seriesDesign("proc-vehicle-renfe-440", "Renfe 440", R440, P.r440, renfe440, renfe440Lod, "renfe-440", "uic")),
  seriesDesign("proc-vehicle-renfe-592", "Renfe 592", R592, P.r592, renfe592, renfe592Lod, "renfe-592", "uic"),
  seriesDesign("proc-vehicle-iryo-s109", "Iryo Frecciarossa 1000", S109, P.s109, iryoS109, iryoS109Lod, "iryo-s109", "uic"),
];
