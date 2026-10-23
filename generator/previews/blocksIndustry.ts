// City block previews over the industry and the classic town houses beside it (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { INDUSTRY } from "../industry.ts";
import { COMMERCIAL_BUILDINGS } from "../commercial.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders([...INDUSTRY, ...COMMERCIAL_BUILDINGS]);
export function blockPreviewIndustry(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewIndustryLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
