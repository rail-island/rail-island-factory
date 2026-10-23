// Preview design of the road station set (docs/models/sets.md): a road station
// dressed on a fixed two-stand layout, its islands and the stands' road between them.
// The site's only, like the other set previews (stationPreview.ts).

import { resolveParams, type ParamSpec, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import * as roadStation from "../sets/roadStation.ts";
import { propModel, separateCoplanar, type PropBox } from "./propKit.ts";

const TITLES: Record<string, string> = {
  open_bays: "Open bays", sawtooth_canopy: "Sawtooth canopy", terminal_hall: "Terminal hall",
  gravel_yard: "Truck yard", loading_docks: "Loading docks", logistics_hub: "Logistics hub",
};

/** A fixed solved road station: three islands either side of two stands. */
const ROAD_STATION_SITE: roadStation.DressSite = {
  islands: [-10.5, 0, 10.5].map((cx) => ({ cx, cz: 0, dirX: 0, dirZ: 1, width: 5, length: 34 })),
  stands: 2,
  mps: [{ x: -16, z: -22, outX: -1, outZ: 0 }, { x: 16, z: 22, outX: 1, outZ: 0 }],
  layout: "drive_through",
  standLength: 30,
  islandTop: 1.27,
  clearance: 9.5,
};
const ROAD_STATION_PARAMS: ParamSpec[] = [{ name: "type", title: "Type", default: "openbays", values: Object.entries(TITLES).map(([id, title]) => ({ value: id.replace(/_/g, ""), title })) }];

/** The islands and the stands' road between them. */
function groundBoxes(): PropBox[] {
  const site = ROAD_STATION_SITE;
  const boxes: PropBox[] = site.islands.map((isl) => ({ cx: isl.cx, cy: site.islandTop / 2, cz: isl.cz, sx: isl.width, sy: site.islandTop, sz: isl.length, color: [155, 155, 150], material: "pavement", lod: "shell" as const }));
  for (const cx of [-5.25, 5.25]) boxes.push({ cx, cy: 0.5, cz: 0, sx: 5.5, sy: 1, sz: 40, color: [60, 60, 64], material: "pavement", lod: "shell" });
  return boxes;
}
/** A road station's dressing on its islands; the distant one keeps the ground and the roofs. */
function roadStationBoxes(values: Record<string, string> | undefined, lod: boolean): PropBox[] {
  const value = resolveParams(ROAD_STATION_PARAMS, values).type!;
  const type = Object.keys(TITLES).find((id) => id.replace(/_/g, "") === value)!;
  const boxes = groundBoxes();
  for (const b of roadStation.dress(type, ROAD_STATION_SITE)) {
    if (lod && b.material !== "roof") continue;
    // the preview's islands run along Z, so a box turns by a quarter at most
    const quarter = Math.abs(Math.sin(b.yaw)) > 0.5;
    boxes.push({ cx: b.x, cy: b.y + b.sy / 2, cz: b.z, sx: quarter ? b.sz : b.sx, sy: b.sy, sz: quarter ? b.sx : b.sz, color: b.color, material: b.material, lod: "shell" });
  }
  return boxes;
}
export function roadStationPreview(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(roadStationBoxes(values, false))); }
export function roadStationPreviewLod(values?: Record<string, string>): MeshBuilder { return propModel(separateCoplanar(roadStationBoxes(values, true)), true); }

const PREVIEW_CATALOG = { category: "Structure types", group: "previews", defaultScale: 1, license: "CC0", author: "Rail Island", source: "Rail Island" } as const;

export const ROAD_STATION_PREVIEWS: ProceduralDesign[] = [
  { id: "proc-preview-road-station", title: "Road Station", build: roadStationPreview, buildLod: roadStationPreviewLod, lodTriangles: 500 as const, params: ROAD_STATION_PARAMS },
].map((d) => ({ ...d, catalog: { ...PREVIEW_CATALOG } }));
