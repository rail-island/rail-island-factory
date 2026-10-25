// City block previews over the panel houses (panel) (blockKit.ts): this family's pools, and only
// their code, ride in its bundle.

import type { ParamValues } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { PANEL_HOUSES } from "../panelHouses.ts";
import { blockBuilders } from "./blockKit.ts";

const BLOCKS = blockBuilders(PANEL_HOUSES);
export function blockPreviewPanel(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.build(values, type); }
export function blockPreviewPanelLod(values: ParamValues | undefined, type: string): MeshBuilder { return BLOCKS.buildLod(values, type); }
