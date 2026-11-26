// Chinese units on the series kit (shinkansen.ts): the registry of the Fuxing
// CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C, CRH5A, the CR200J "Green
// Giant" and the CRH6A. Each unit's measured body lives in its own module
// (cnCr400af.ts, cnCrh2a.ts, ...). The high-speed trains on the Shinkansen
// gauge, narrowed from their real 3.36 - 3.38 m. See docs/models/china-trains.md.

import type { MeshBuilder } from "./meshBuilder.ts";
import type { ParamValues, ProceduralDesign } from "./design.ts";
import { buildSeries, buildSeriesLod, seriesDesign, seriesParams } from "./shinkansen.ts";
import { CRH3C } from "./cnCrh3c.ts";
import { CRH5A } from "./cnCrh5a.ts";
import { CRH2A } from "./cnCrh2a.ts";
import { CR400BF } from "./cnCr400bf.ts";
import { CR400AF } from "./cnCr400af.ts";
import { CRH380A } from "./cnCrh380a.ts";
import { CRH6A } from "./cnCrh6a.ts";
import { CR200J, CR200J_DESIGN, cr200j, cr200jLod } from "./cnCr200j.ts";
import { CRH380B } from "./cnCrh380b.ts";
import { CRH2E } from "./cnCrh2e.ts";
import { CR450BF } from "./cnCr450bf.ts";
import { CR300BF } from "./cnCr300bf.ts";
import { CR450AF } from "./cnCr450af.ts";

export { CRH380A };
export { CRH3C };

export { CRH5A };

export { CR200J };

export { CRH6A };

export { CRH380B };

const P = { af: seriesParams(CR400AF), bf: seriesParams(CR400BF), a380: seriesParams(CRH380A), c2a: seriesParams(CRH2A), c3c: seriesParams(CRH3C), c5a: seriesParams(CRH5A), j: seriesParams(CR200J), c6a: seriesParams(CRH6A) };
const P380B = seriesParams(CRH380B);
export { CRH2E };

const P_C2E = seriesParams(CRH2E);
export { CR450BF };

const P_BF450 = seriesParams(CR450BF);
export { CR300BF };

const P_CR300BF = seriesParams(CR300BF);
export { CR450AF };

const P_CR450AF = seriesParams(CR450AF);

export function crCr400af(v?: ParamValues): MeshBuilder { return buildSeries(CR400AF, P.af, v); }
export function crCr400afLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR400AF, P.af, v); }
export function crCr400bf(v?: ParamValues): MeshBuilder { return buildSeries(CR400BF, P.bf, v); }
export function crCr400bfLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR400BF, P.bf, v); }
export function crCrh380a(v?: ParamValues): MeshBuilder { return buildSeries(CRH380A, P.a380, v); }
export function crCrh380aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH380A, P.a380, v); }
export function crCrh2a(v?: ParamValues): MeshBuilder { return buildSeries(CRH2A, P.c2a, v); }
export function crCrh2aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH2A, P.c2a, v); }
export function crCrh3c(v?: ParamValues): MeshBuilder { return buildSeries(CRH3C, P.c3c, v); }
export function crCrh3cLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH3C, P.c3c, v); }
export function crCrh5a(v?: ParamValues): MeshBuilder { return buildSeries(CRH5A, P.c5a, v); }
export function crCrh5aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH5A, P.c5a, v); }
export function crCr200j(v?: ParamValues): MeshBuilder { return cr200j(v); }
export function crCr200jLod(v?: ParamValues): MeshBuilder { return cr200jLod(v); }
export function crCrh6a(v?: ParamValues): MeshBuilder { return buildSeries(CRH6A, P.c6a, v); }
export function crCrh6aLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH6A, P.c6a, v); }
export function crCrh380b(v?: ParamValues): MeshBuilder { return buildSeries(CRH380B, P380B, v); }
export function crCrh380bLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH380B, P380B, v); }
export function crCrh2e(v?: ParamValues): MeshBuilder { return buildSeries(CRH2E, P_C2E, v); }
export function crCrh2eLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CRH2E, P_C2E, v); }
export function crCr450bf(v?: ParamValues): MeshBuilder { return buildSeries(CR450BF, P_BF450, v); }
export function crCr450bfLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR450BF, P_BF450, v); }
export function crCr300bf(v?: ParamValues): MeshBuilder { return buildSeries(CR300BF, P_CR300BF, v); }
export function crCr300bfLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR300BF, P_CR300BF, v); }

export function crCr450af(v?: ParamValues): MeshBuilder { return buildSeries(CR450AF, P_CR450AF, v); }
export function crCr450afLod(v?: ParamValues): MeshBuilder { return buildSeriesLod(CR450AF, P_CR450AF, v); }

export const CN_UNITS: ProceduralDesign[] = [
  seriesDesign("proc-vehicle-cr-cr400af", "Fuxing CR400AF", CR400AF, P.af, crCr400af, crCr400afLod, "cr-cr400af"),
  seriesDesign("proc-vehicle-cr-cr400bf", "Fuxing CR400BF", CR400BF, P.bf, crCr400bf, crCr400bfLod, "cr-cr400bf"),
  seriesDesign("proc-vehicle-cr-crh380a", "CRH380A", CRH380A, P.a380, crCrh380a, crCrh380aLod, "cr-crh380a"),
  seriesDesign("proc-vehicle-cr-crh2a", "CRH2A", CRH2A, P.c2a, crCrh2a, crCrh2aLod, "cr-crh2a"),
  seriesDesign("proc-vehicle-cr-crh3c", "CRH3C", CRH3C, P.c3c, crCrh3c, crCrh3cLod, "cr-crh3c", "uic"),
  seriesDesign("proc-vehicle-cr-crh5a", "CRH5A", CRH5A, P.c5a, crCrh5a, crCrh5aLod, "cr-crh5a"),
  CR200J_DESIGN(crCr200j, crCr200jLod),
  seriesDesign("proc-vehicle-cr-crh6a", "CRH6A", CRH6A, P.c6a, crCrh6a, crCrh6aLod, "cr-crh6a"),
  seriesDesign("proc-vehicle-cr-crh380b", "CRH380B", CRH380B, P380B, crCrh380b, crCrh380bLod, "cr-crh380b", "uic"),
  seriesDesign("proc-vehicle-cr-crh2e", "CRH2E", CRH2E, P_C2E, crCrh2e, crCrh2eLod, "cr-crh2e"),
  seriesDesign("proc-vehicle-cr-cr450bf", "Fuxing CR450BF", CR450BF, P_BF450, crCr450bf, crCr450bfLod, "cr-cr450bf"),
  seriesDesign("proc-vehicle-cr-cr300bf", "Fuxing CR300BF", CR300BF, P_CR300BF, crCr300bf, crCr300bfLod, "cr-cr300bf"),
  seriesDesign("proc-vehicle-cr-cr450af", "Fuxing CR450AF", CR450AF, P_CR450AF, crCr450af, crCr450afLod, "cr-cr450af"),
];
