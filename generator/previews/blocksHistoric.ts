// City block previews over the historic centrepieces (hist_center): churches, cathedrals and landmarks (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { CHURCHES } from "../churches.ts";
import { CATHEDRALS } from "../cathedrals.ts";
import { GOTHIC_CATHEDRALS } from "../gothicCathedrals.ts";
import { LANDMARKS } from "../landmarks.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders([...CHURCHES, ...CATHEDRALS, ...GOTHIC_CATHEDRALS, ...LANDMARKS]);
export function blockPreviewHistoric(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewHistoricLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
