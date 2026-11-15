// Dutch electric and diesel locomotives, each in its own module, measured on photographs:
// the 1100 (nl1100.ts) and 1300 (nl1300.ts), sisters of Alsthom's French BB 8100 and CC 7100,
// the 1600 / 1700 of the BB 7200 "nez casse" family (nl1700.ts), the Werkspoor 1200
// (nl1200.ts) and the 2200 end-cab diesel (nl2200.ts). This file is their registry.
// See docs/models/netherlands-trains.md.

import type { ProceduralDesign } from "./design.ts";
import { DIESEL_LOCO_CATALOG, ELECTRIC_LOCO_CATALOG } from "./cd163.ts";
import { locoGame, paramsOf } from "./frLocos.ts";
import { NS1100_PARAMS, ns1100, ns1100Lod } from "./nl1100.ts";
import { NS1700_PARAMS, ns1700, ns1700Lod } from "./nl1700.ts";
import { NS1300_PARAMS, ns1300, ns1300Lod } from "./nl1300.ts";
import { NS2200_PARAMS, ns2200, ns2200Lod } from "./nl2200.ts";
import { NS1200_PARAMS, ns1200, ns1200Lod } from "./nl1200.ts";

// the JS model bundles import each design's build functions from this registry (jsModel.ts)
export { ns1100, ns1100Lod, ns1200, ns1200Lod, ns1300, ns1300Lod, ns1700, ns1700Lod, ns2200, ns2200Lod };

const E = ELECTRIC_LOCO_CATALOG;
export const NL_LOCOS: ProceduralDesign[] = [
  { id: "proc-vehicle-ns-1700", title: "NS 1600 / 1700", build: ns1700, buildLod: ns1700Lod, params: NS1700_PARAMS, game: locoGame(84, 4540, 160), catalog: E, references: "ns-1700" },
  { id: "proc-vehicle-ns-1100", title: "NS 1100", build: ns1100, buildLod: ns1100Lod, params: NS1100_PARAMS, game: locoGame(83, 2030, 135), catalog: E, references: "ns-1100" },
  { id: "proc-vehicle-ns-1300", title: "NS 1300", build: ns1300, buildLod: ns1300Lod, ...paramsOf(NS1300_PARAMS), game: locoGame(111, 3159, 130), catalog: E, references: "ns-1300" },
  { id: "proc-vehicle-ns-1200", title: "NS 1200", build: ns1200, buildLod: ns1200Lod, params: NS1200_PARAMS, game: locoGame(108, 2360, 150), catalog: E, references: "ns-1200" },
  { id: "proc-vehicle-ns-2200", title: "NS 2200", build: ns2200, buildLod: ns2200Lod, params: NS2200_PARAMS, game: locoGame(72, 662, 100), catalog: DIESEL_LOCO_CATALOG, references: "ns-2200" },
];
