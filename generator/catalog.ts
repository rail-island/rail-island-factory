// The two documents the build writes beside the models, as types and pure
// builders. No `node:` imports: the site imports the types from here, and the
// tests drive the builders without touching the disk.
//
//   skyscrapers.meta.json  the EXPORT contract -- one entry per building (the
//                          skyscrapers, landmarks and stations; the name predates them) in
//                          the shape of the game's building catalog
//                          (db/buildings/buildings.meta.json in the webapp), for
//                          the webapp's later import to mirror.
//   village.meta.json      the same shape for the village houses, so the game can
//                          import them as a family of their own.
//   vehicles.meta.json     the same entries for the vehicles, under "vehicles"
//                          rather than "buildings", so a building import never
//                          picks up a truck.
//   catalog.json           what the factory site lists: the meta entry joined
//                          with what only the build knows (geometry counts,
//                          bounding box, file sizes) and the URLs to fetch.
//
// Neither carries a timestamp: the build is deterministic and so are these.

import { proceduralId } from "./modelId.ts";
import { SKYSCRAPER_CATALOG } from "./skyscrapers.ts";
import { VEHICLE_CATALOG } from "./vehicles.ts";
import { checkGameProperties, type CatalogFields, type GameProperties, type OpenttdProperties, type ParamSpec, type ProceduralDesign } from "./design.ts";
import type { VehicleRig } from "./rig.ts";

/** What a side-view thumbnail spans, in metres (renderGlbThumb.ts SideFrame). */
export interface ThumbSide {
  /** From the left edge to the right edge: the vehicle's length and both margins. */
  widthM: number;
  /** From the bottom edge to the top edge. */
  heightM: number;
  /** The bottom edge's height; the rail (or road) is at 0, -bottomM above it. */
  bottomM: number;
}

/** The catalog categories whose thumbnail is a side view: the vehicles on a road or on rails. */
export const SIDE_VIEW_CATEGORIES: readonly string[] = ["Road vehicles", "Rail vehicles"];

export function isSideViewCategory(category: string): boolean {
  return SIDE_VIEW_CATEGORIES.includes(category);
}

/** One model as the game's building catalog would hold it. */
export interface MetaEntry {
  yaw?: number;
  id: string;
  title: string;
  category: string;
  /** The city block pool the model is drawn from; a vehicle's type (loco, unit, coach, ...). */
  group: string;
  /** A locomotive's or a unit's traction: electric, diesel or steam. */
  traction?: string;
  /** File name within the export's js/ folder: the model (jsModel.ts). */
  js: string;
  /** File name within the export's thumbs/ folder. */
  thumb: string;
  /**
   * Present when the thumbnail is a SIDE view (a road or rail vehicle): an
   * orthographic elevation, nose on the left, spanning these metres -- the game's
   * own side-thumbnail framing, so it can draw the image to scale. Absent for the
   * square three-quarter view.
   */
  thumbSide?: ThumbSide;
  /** On-map size multiplier. */
  defaultScale?: number;
  license: string;
  author: string;
  source: string;
  /**
   * A parametric model's enum parameters (design.ts). The thumbnail is built
   * with each parameter's default; the JS model builds any combination.
   * Absent for a fixed model.
   */
  params?: ParamSpec[];
  /**
   * What of a vehicle the game may move (rig.ts): its steered wheels, an
   * articulated vehicle's sections and the joints between them, by node name
   * (the JS model's object names). The default build's; absent for a model without one.
   */
  rig?: VehicleRig;
  /**
   * What the game needs of the model beyond its geometry (design.ts
   * GameProperties): a vehicle's running figures, a ship's draft, a landmark's
   * plaza rules. Always present for a vehicle.
   */
  game?: GameProperties;
}

export interface ExportMeta {
  note: string;
  count: number;
  buildings: MetaEntry[];
}

export interface VehicleExportMeta {
  note: string;
  count: number;
  vehicles: MetaEntry[];
}

/** One source image of a model (a photo, a drawing, a native texture). */
export interface ReferenceImage {
  /** Path within the design's assets folder, e.g. "native/z_inc.bmp". */
  name: string;
  /** Site-relative URL, e.g. "refs/veh-cd-150/native/z_inc.bmp". */
  url: string;
  bytes: number;
}

/** One row of the site's listing. */
export interface CatalogRecord extends MetaEntry {
  /** Site-relative URLs, e.g. "thumbs/sky-pagoda.png". */
  thumbUrl: string;
  /** The standalone JS model (js/<id>.js, see jsModel.ts). */
  jsUrl: string;
  jsBytes: number;
  /** The JS model as gzip -9 would send it. */
  jsGzipBytes: number;
  /**
   * The first 16 hex digits of the JS model's SHA-256: changes whenever the
   * model does, so the site keys its browser-rendered variant thumbnails on it.
   */
  jsHash?: string;
  thumbBytes: number;
  triangles: number;
  vertices: number;
  primitives: number;
  materials: number;
  /** Bounding-box extents in metres, before `defaultScale`. */
  sizeX: number;
  sizeY: number;
  sizeZ: number;
  /** The source images the model was made from, by name; empty when it has none. */
  references: ReferenceImage[];
  /** Set when the JS model also exports buildCoarse (a tree's third level, docs/models/trees.md). */
  coarse?: boolean;
  /**
   * A vehicle's declared OpenTTD figures (design.ts OpenttdProperties), for the
   * site's GRF export only -- not part of the game's meta.json. Absent when the
   * design declares none; the site then uses its category defaults.
   */
  openttd?: OpenttdProperties;
}

export interface ModelCatalog {
  version: 1;
  records: CatalogRecord[];
}

/** What the build measured for one model (see generate.ts). */
export interface BuiltFacts {
  jsBytes: number;
  jsGzipBytes: number;
  /** See CatalogRecord.jsHash. */
  jsHash?: string;
  thumbBytes: number;
  triangles: number;
  vertices: number;
  primitives: number;
  materials: number;
  min: [number, number, number];
  max: [number, number, number];
}

export const META_FILE = "skyscrapers.meta.json";
export const VEHICLE_META_FILE = "vehicles.meta.json";
export const VILLAGE_META_FILE = "village.meta.json";
export const CATALOG_FILE = "catalog.json";
/** The export's folder of source images, one subfolder per design id. */
export const REFS_DIR = "refs";
/** The file types copied as source images, all of which a browser shows in an <img>. */
export const REFERENCE_EXTENSIONS = [".bmp", ".gif", ".jpeg", ".jpg", ".png", ".svg", ".webp"] as const;

/** One design's entry, with the catalog fields of its family (the skyscrapers' by default) and its built rig. */
export function metaEntry(
  design: ProceduralDesign,
  fields: CatalogFields = SKYSCRAPER_CATALOG,
  rig: VehicleRig | null = null,
  side: ThumbSide | null = null,
): MetaEntry {
  return {
    id: proceduralId(design.id),
    title: design.title,
    ...(fields.yaw !== undefined ? { yaw:fields.yaw } : {}),
    category: fields.category,
    group: fields.group,
    ...(fields.traction ? { traction: fields.traction } : {}),
    js: `${proceduralId(design.id)}.js`,
    thumb: `${proceduralId(design.id)}.png`,
    ...(side ? { thumbSide: { widthM: r4(side.widthM), heightM: r4(side.heightM), bottomM: r4(side.bottomM) } } : {}),
    ...(["Road vehicles", "Rail vehicles", "Cable car"].includes(fields.category) ? {} : { defaultScale: fields.defaultScale }),
    license: fields.license,
    author: fields.author,
    source: fields.source,
    ...(design.params?.length ? { params: design.params.map((p) => ({ ...p, values: p.values.map((v) => ({ ...v })) })) } : {}),
    ...(rig ? { rig: JSON.parse(JSON.stringify(rig)) as VehicleRig } : {}),
    ...(design.game ? { game: JSON.parse(JSON.stringify(design.game)) as GameProperties } : {}),
  };
}

const NOTE = "Generated by rail-island-factory (`pnpm build`). Do not edit -- change the design in generator/ and rebuild.";

/** The buildings' entries, each with its design's catalog fields (the skyscrapers' unless it sets its own). */
export function exportMeta(designs: readonly ProceduralDesign[]): ExportMeta {
  for (const d of designs) checkGameProperties(d, false);
  return { note: NOTE, count: designs.length, buildings: designs.map((d) => metaEntry(d, d.catalog ?? SKYSCRAPER_CATALOG)) };
}

/**
 * The vehicles' meta; `rigs` holds each rigged design's built rig by id, `sides`
 * each side-view thumbnail's frame.
 */
export function exportVehicleMeta(
  designs: readonly ProceduralDesign[],
  rigs: ReadonlyMap<string, VehicleRig> = new Map(),
  sides: ReadonlyMap<string, ThumbSide> = new Map(),
): VehicleExportMeta {
  for (const d of designs) checkGameProperties(d, true);
  return {
    note: NOTE,
    count: designs.length,
    vehicles: designs.map((d) => metaEntry(d, d.catalog ?? VEHICLE_CATALOG, rigs.get(d.id) ?? null, sides.get(d.id) ?? null)),
  };
}

/** Rounded to a tenth of a millimetre, so float noise does not reach the meta. */
const r4 = (v: number): number => Math.round(v * 1e4) / 1e4;

/** Rounded to the millimetre, so float noise does not reach the listing. */
const mm = (v: number): number => Math.round(v * 1000) / 1000;

export function catalogRecord(entry: MetaEntry, facts: BuiltFacts, references: ReferenceImage[] = [], openttd?: OpenttdProperties): CatalogRecord {
  return {
    ...entry,
    thumbUrl: `thumbs/${entry.thumb}`,
    jsUrl: `js/${entry.js}`,
    jsBytes: facts.jsBytes,
    jsGzipBytes: facts.jsGzipBytes,
    ...(facts.jsHash ? { jsHash: facts.jsHash } : {}),
    thumbBytes: facts.thumbBytes,
    triangles: facts.triangles,
    vertices: facts.vertices,
    primitives: facts.primitives,
    materials: facts.materials,
    sizeX: mm(facts.max[0] - facts.min[0]),
    sizeY: mm(facts.max[1] - facts.min[1]),
    sizeZ: mm(facts.max[2] - facts.min[2]),
    references,
    ...(openttd ? { openttd: JSON.parse(JSON.stringify(openttd)) as OpenttdProperties } : {}),
  };
}
