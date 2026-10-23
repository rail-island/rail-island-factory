// City block previews over the towers and the classic town houses round them (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { TOWERS } from "../towers.ts";
import { COMMERCIAL_BUILDINGS } from "../commercial.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders([...TOWERS, ...COMMERCIAL_BUILDINGS]);
export function blockPreviewTower(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewTowerLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
