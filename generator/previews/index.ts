// Every site preview design (docs/models/previews.md), one per type, filed by the
// site's categories: Structures, Rails and roads, City blocks, Textures, and the
// Props drawn by a set module. Each family is one source module (one bundle); the
// designs bind its shared build functions to their type (design.ts `bound`) and take
// their titles from the set registry. Node-free, but kept apart from the build
// modules so the registry's text never rides in a preview's bundle.

import { boundDesign, type ParamSpec, type ParamValues, type ProceduralDesign } from "../design.ts";
import type { MeshBuilder } from "../meshBuilder.ts";
import { SETS, type SetName } from "../sets/registry.ts";
import { TEXTURE_NAMES } from "../surfaces.ts";
import * as blockType from "../sets/blockType.ts";
import { idPart, previewCatalog, type PreviewCategory } from "./sketch.ts";
import { BRIDGE_PARAMS, bridgePreview, bridgePreviewLod } from "./bridges.ts";
import { ROAD_STATION_PARAMS, STATION_PARAMS, roadStationPreview, roadStationPreviewLod, stationPreview, stationPreviewLod } from "./stations.ts";
import {
  AIRPORT_PARAMS, DAM_PARAMS, PORTAL_PARAMS, PORT_PARAMS, airportPreview, airportPreviewLod, busStopPreview, busStopPreviewLod,
  CABLE_CAR_PARAMS, cableCarStationPreview, cableCarStationPreviewLod, damPreview, damPreviewLod, portPreview, portPreviewLod, tunnelPortalPreview, tunnelPortalPreviewLod,
} from "./structures.ts";
import { WAY_PARAMS, decorationPreview, decorationPreviewLod, railTypePreview, railTypePreviewLod, roadTypePreview, roadTypePreviewLod } from "./ways.ts";
import { MAST_PARAMS, PYLON_PARAMS, catenaryPreview, catenaryPreviewLod, pylonPreview, pylonPreviewLod } from "./props.ts";
import { texturePreview, texturePreviewLod } from "./textures.ts";
import { BLOCK_PARAMS } from "./blockKit.ts";
import { blockPreviewVillage, blockPreviewVillageLod } from "./blocksVillage.ts";
import { blockPreviewCommercial, blockPreviewCommercialLod } from "./blocksCommercial.ts";
import { blockPreviewIndustry, blockPreviewIndustryLod } from "./blocksIndustry.ts";
import { blockPreviewTower, blockPreviewTowerLod } from "./blocksTower.ts";
import { blockPreviewHighrise, blockPreviewHighriseLod } from "./blocksHighrise.ts";
import { blockPreviewHistoric, blockPreviewHistoricLod } from "./blocksHistoric.ts";

type Builder = (values: ParamValues | undefined, type: string) => MeshBuilder;

/** One family of preview designs: the source module its build functions are exported from. */
export interface PreviewFamily { source: string; designs: ProceduralDesign[] }

interface Spec {
  category: PreviewCategory;
  /** The site's second chip row: the set, or another grouping. */
  group: string;
  /** The id's prefix after `proc-preview-`. */
  prefix: string;
  build: Builder;
  buildLod: Builder;
  params?: ParamSpec[];
  lodTriangles?: ProceduralDesign["lodTriangles"];
  /** False when the types are not set types (the texture library's photo sets): no game id. */
  setTypes?: boolean;
  sourceTree?: false;
}

/** One design per (type id, title), bound to the family's build functions. */
function designs(spec: Spec, types: ReadonlyArray<{ id: string; label: string }>): ProceduralDesign[] {
  return types.map((t) => ({
    id: `proc-preview-${spec.prefix}-${idPart(t.id)}`,
    title: t.label,
    ...boundDesign(spec.build, spec.buildLod, t.id),
    ...(spec.params ? { params: spec.params } : {}),
    lodTriangles: spec.lodTriangles ?? 500,
    catalog: previewCatalog(spec.category, spec.group, spec.setTypes === false ? undefined : t.id),
    ...(spec.sourceTree === false ? { sourceTree: false as const } : {}),
  }));
}

const typesOf = (set: SetName): ReadonlyArray<{ id: string; label: string }> => SETS.find((d) => d.set === set)!.types;

/** A structure set's pages: one per type, in the set's picker order. */
function structures(set: SetName, prefix: string, build: Builder, buildLod: Builder, params?: ParamSpec[]): ProceduralDesign[] {
  return designs({ category: "Structures", group: set, prefix, build, buildLod, params }, typesOf(set));
}

export const PREVIEW_FAMILIES: readonly PreviewFamily[] = [
  // a bridge's distant level is the set module's (bridge.lowDetailBoxes, what the game
  // draws far away): 500 + 1,500 per 100 studs, 3,000 on the 160-stud fixture
  { source: "previews/bridges.ts", designs: designs({ category: "Structures", group: "bridge", prefix: "bridge", build: bridgePreview, buildLod: bridgePreviewLod, params: BRIDGE_PARAMS, lodTriangles: 3000 }, typesOf("bridge")) },
  {
    source: "previews/stations.ts",
    designs: [
      ...structures("station", "station", stationPreview, stationPreviewLod, STATION_PARAMS),
      ...structures("roadStation", "road-station", roadStationPreview, roadStationPreviewLod, ROAD_STATION_PARAMS),
    ],
  },
  {
    source: "previews/structures.ts",
    designs: [
      ...structures("busStop", "bus-stop", busStopPreview, busStopPreviewLod),
      ...structures("cableCarStation", "cable-car-station", cableCarStationPreview, cableCarStationPreviewLod, CABLE_CAR_PARAMS),
      ...structures("port", "port", portPreview, portPreviewLod, PORT_PARAMS),
      ...structures("airport", "airport", airportPreview, airportPreviewLod, AIRPORT_PARAMS),
      ...designs({ category: "Structures", group: "dam", prefix: "dam", build: damPreview, buildLod: damPreviewLod, params: DAM_PARAMS, lodTriangles: 12000 }, typesOf("dam")),
      ...structures("tunnelPortal", "tunnel-portal", tunnelPortalPreview, tunnelPortalPreviewLod, PORTAL_PARAMS),
    ],
  },
  {
    source: "previews/ways.ts",
    designs: [
      ...designs({ category: "Rails and roads", group: "railType", prefix: "rail-type", build: railTypePreview, buildLod: railTypePreviewLod, params: WAY_PARAMS }, typesOf("railType")),
      ...designs({ category: "Rails and roads", group: "roadType", prefix: "road-type", build: roadTypePreview, buildLod: roadTypePreviewLod, params: WAY_PARAMS }, typesOf("roadType")),
      ...designs({ category: "Rails and roads", group: "decoration", prefix: "decoration", build: decorationPreview, buildLod: decorationPreviewLod, params: WAY_PARAMS, lodTriangles: 12000 }, typesOf("decoration")),
    ],
  },
  {
    source: "previews/props.ts",
    designs: [
      { id: "proc-preview-cablecar-pylon", title: "Cable Car Pylon", build: pylonPreview, buildLod: pylonPreviewLod, params: PYLON_PARAMS, catalog: previewCatalog("Props", "props") },
      ...typesOf("catenaryStyle").flatMap((t) => designs({
        category: "Props", group: "props", prefix: "catenary", build: catenaryPreview, buildLod: catenaryPreviewLod,
        ...(t.id === "rail_mast" ? { params: MAST_PARAMS } : {}),
      }, [t])),
    ],
  },
  {
    source: "previews/textures.ts",
    designs: designs({ category: "Textures", group: "texture", prefix: "texture", build: texturePreview, buildLod: texturePreviewLod, setTypes: false },
      TEXTURE_NAMES.map((name) => ({ id: name, label: name[0]!.toUpperCase() + name.slice(1) }))),
  },
  ...blockFamilies(),
];

/** The block types by the family module whose pools they draw from. */
function blockFamilies(): PreviewFamily[] {
  const FAMILY: Record<string, string> = {
    houses: "Village", street: "Commercial", highrise: "Highrise", industrial: "Industry", towerblock: "Tower", landmark: "Historic",
  };
  const family = (id: string): string => FAMILY[id] ?? "Historic";
  const builders: Record<string, [Builder, Builder]> = {
    Village: [blockPreviewVillage, blockPreviewVillageLod], Commercial: [blockPreviewCommercial, blockPreviewCommercialLod],
    Industry: [blockPreviewIndustry, blockPreviewIndustryLod], Tower: [blockPreviewTower, blockPreviewTowerLod],
    Highrise: [blockPreviewHighrise, blockPreviewHighriseLod], Historic: [blockPreviewHistoric, blockPreviewHistoricLod],
  };
  return Object.entries(builders).map(([name, [build, buildLod]]) => ({
    source: `previews/blocks${name}.ts`,
    designs: typesOf("blockType").filter((t) => family(t.id) === name).flatMap((t) => {
      const meta = blockType.TYPE_META[t.id];
      return designs({ category: "City blocks", group: meta?.district ?? meta?.overlay ?? "other", prefix: "block", build, buildLod, params: BLOCK_PARAMS, lodTriangles: 12000, sourceTree: false }, [t]);
    }),
  }));
}
