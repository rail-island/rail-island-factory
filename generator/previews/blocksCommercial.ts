// City block previews over the street fronts (commercial) and the classic town houses (comm_classic) (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { COMMERCIAL } from "../commercialStreets.ts";
import { COMMERCIAL_BUILDINGS } from "../commercial.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders([...COMMERCIAL, ...COMMERCIAL_BUILDINGS]);
export function blockPreviewCommercial(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewCommercialLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
