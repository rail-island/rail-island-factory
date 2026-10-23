// Preview designs of the set types whose shape is a function (docs/models/sets.md):
// the site has no world to fit them to, so each is drawn here at a representative
// size -- a stop on a short piece of two-lane road, a pylon of middling height. They
// are the site's only: no game meta lists them, and the export list leaves them out.

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { buildSide, TYPES as BUS_STOP_TYPES, type SideBox } from "../sets/busStop.ts";
import { buildPylon } from "../sets/cableCarStation.ts";
import { propModel, separateCoplanar, type PropBox } from "./propKit.ts";

/** Half a two-lane road's width, plus the kerb margin: where the stop's kerb stands. */
const PREVIEW_LATERAL = 4 + 1;
const ROAD_LENGTH = 30;

/** One side's boxes turned into the preview's frame: travel along +X on the +Z kerb, along -X on the -Z one. */
function sideBoxes(type: string, outward: 1 | -1): PropBox[] {
  return buildSide(type, PREVIEW_LATERAL).boxes.map((b: SideBox) => {
    // a sign faces along the road: a quarter turn of its box
    const turned = b.axes === "sign";
    return {
      cx: b.x * outward, cy: b.y, cz: b.z * outward,
      sx: turned ? b.sz : b.sx, sy: b.sy, sz: turned ? b.sx : b.sz,
      color: b.color, material: b.material,
      ...(b.detail === false ? { lod: "shell" as const } : {}),
    };
  });
}

function busStopBoxes(type: string): PropBox[] {
  const road: PropBox = { cx: -4, cy: -0.1, cz: 0, sx: ROAD_LENGTH, sy: 0.2, sz: 2 * (PREVIEW_LATERAL - 1), color: [72, 72, 76], material: "pavement", lod: "shell" };
  const boxes = [road, ...sideBoxes(type, 1), ...sideBoxes(type, -1)];
  // stood on the ground: the kerb reaches below the road surface
  const base = Math.min(...boxes.map((b) => b.cy - b.sy / 2));
  return boxes.map((b) => ({ ...b, cy: b.cy - base }));
}

const STOP_PARAMS: ParamSpec[] = [{ name: "type", title: "Type", default: "shelter", values: BUS_STOP_TYPES.map((t) => ({ value: t, title: { shelter: "Glass shelter", canopy: "Covered stop", cargo: "Cargo stop" }[t] ?? t })) }];
const stopType = (values?: Record<string, string>): string => resolveParams(STOP_PARAMS, values).type!;
export function busStopPreview(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(busStopBoxes(stopType(values)))); }
export function busStopPreviewLod(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(busStopBoxes(stopType(values))), true); }

/** A pylon `PYLON_PREVIEW_HEIGHT` studs tall, cut off at the ground. */
const PYLON_PREVIEW_HEIGHT = 24;
function pylonBoxes(): PropBox[] {
  return buildPylon(PYLON_PREVIEW_HEIGHT).map((b, i) => {
    // the mast is sunk below its anchor in the game; the preview stands it on the ground
    const y0 = Math.max(0, b.y - b.sy / 2);
    const y1 = b.y + b.sy / 2;
    return { cx: b.x, cy: (y0 + y1) / 2, cz: b.z, sx: b.sx, sy: y1 - y0, sz: b.sz, color: b.color, material: b.material, ...(i < 3 ? { lod: "shell" as const } : {}) };
  });
}
export function pylonPreview(): MeshBuilder { return propModel(pylonBoxes()); }
export function pylonPreviewLod(): MeshBuilder { return propModel(pylonBoxes(), true); }

const PREVIEW_CATALOG = { category: "Structure types", group: "previews", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const SET_PREVIEWS: ProceduralDesign[] = [
  {
    id: "proc-preview-bus-stop", title: "Bus Stop", build: busStopPreview, buildLod: busStopPreviewLod, lodTriangles: 200 as const, params: STOP_PARAMS,
  },
  { id: "proc-preview-cablecar-pylon", title: "Cable Car Pylon", build: pylonPreview, buildLod: pylonPreviewLod },
].map((d) => ({ ...d, catalog: { ...PREVIEW_CATALOG } }));
