// City block previews over the skyscrapers (skyscraper_c) (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { SKYSCRAPERS, SKYSCRAPER_CATALOG } from "../skyscrapers.ts";
import { blockBuilders } from "./blockKit.ts";

// a skyscraper carries no catalog of its own: every one is in the skyscraper_c pool
const BLOCKS = blockBuilders(SKYSCRAPERS.map((d) => ({ ...d, catalog: d.catalog ?? SKYSCRAPER_CATALOG })));
export function blockPreviewHighrise(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewHighriseLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
