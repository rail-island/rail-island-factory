// City block previews over the village houses (village, village_red) (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { VILLAGE_HOUSES } from "../village.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders([...VILLAGE_HOUSES]);
export function blockPreviewVillage(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewVillageLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
