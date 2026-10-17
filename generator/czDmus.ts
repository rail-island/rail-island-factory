// The Czech diesel railcars and multiple units transferred from vlakosimdb in
// one package (docs/models/czech-dmus.md): the CD 810, the CD 812 / 912 Esmeralda, the CD 843 /
// 943 / 043, the CSD M 131.1 Hurvinek with its M 031 trailer, the CSD M 240.0
// and the CSD M 296.1 / CD 853 / 854. Registered as one family in generate.ts;
// a design's JS bundle imports its build and LOD functions from this module.

import type { ProceduralDesign } from "./design.ts";
import { DMU810_DESIGNS, cd810, cd810Lod } from "./dmu810.ts";
import { DMU812_DESIGNS, cd812, cd812Lod } from "./dmu812.ts";
import { DMU843_DESIGNS, cd843, cd843Lod } from "./dmu843.ts";
import { M131_DESIGNS, m131, m131Lod } from "./dmuM131.ts";
import { M240_DESIGNS, m240, m240Lod } from "./dmuM240.ts";
import { M296_DESIGNS, m296, m296Lod } from "./dmuM296.ts";

export { cd810, cd812, cd843, m131, m240, m296, cd810Lod, cd812Lod, cd843Lod, m131Lod, m240Lod, m296Lod };

export const CZ_DMUS: readonly ProceduralDesign[] = [...DMU810_DESIGNS, ...DMU812_DESIGNS, ...DMU843_DESIGNS, ...M131_DESIGNS, ...M240_DESIGNS, ...M296_DESIGNS];
