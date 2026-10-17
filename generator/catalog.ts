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
//                          with what only the built files know (geometry counts,
//                          bounding box, file sizes) and the URLs to fetch.
//
// Neither carries a timestamp: the build is deterministic and so are these.

import { proceduralId } from "./modelId.ts";
import { SKYSCRAPER_CATALOG } from "./skyscrapers.ts";
import { VEHICLE_CATALOG } from "./vehicles.ts";
import type { CatalogFields, ParamSpec, ProceduralDesign } from "./design.ts";
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
  /** File name within the export's glb/ folder. */
  glb: string;
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
   * A parametric model's enum parameters (design.ts). The GLB and thumbnail are
   * built with each parameter's default; the JS model builds any combination.
   * Absent for a fixed model.
   */
  params?: ParamSpec[];
  /**
   * What of a vehicle the game may move (rig.ts): its steered wheels, an
   * articulated vehicle's sections and the joints between them, by GLB node
   * name. The default build's; absent for a model without one.
   */
  rig?: VehicleRig;
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
  /** Site-relative URLs, e.g. "glb/sky-pagoda.glb". */
  glbUrl: string;
  thumbUrl: string;
  glbBytes: number;
  /** The GLB as gzip -9 would send it. */
  glbGzipBytes: number;
  /** The standalone JS model (js/<id>.js, see jsModel.ts). */
  jsUrl: string;
  jsBytes: number;
  jsGzipBytes: number;
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
}

export interface ModelCatalog {
  version: 1;
  records: CatalogRecord[];
}

/** What the build measured for one model (see generate.ts). */
export interface BuiltFacts {
  glbBytes: number;
  glbGzipBytes: number;
  jsBytes: number;
  jsGzipBytes: number;
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
    glb: `${proceduralId(design.id)}.glb`,
    thumb: `${proceduralId(design.id)}.png`,
    ...(side ? { thumbSide: { widthM: r4(side.widthM), heightM: r4(side.heightM), bottomM: r4(side.bottomM) } } : {}),
    ...(["Road vehicles", "Rail vehicles", "Cable car"].includes(fields.category) ? {} : { defaultScale: fields.defaultScale }),
    license: fields.license,
    author: fields.author,
    source: fields.source,
    ...(design.params?.length ? { params: design.params.map((p) => ({ ...p, values: p.values.map((v) => ({ ...v })) })) } : {}),
    ...(rig ? { rig: JSON.parse(JSON.stringify(rig)) as VehicleRig } : {}),
  };
}

const NOTE = "Generated by rail-island-factory (`pnpm build`). Do not edit -- change the design in generator/ and rebuild.";

/** The buildings' entries, each with its design's catalog fields (the skyscrapers' unless it sets its own). */
export function exportMeta(designs: readonly ProceduralDesign[]): ExportMeta {
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

export function catalogRecord(entry: MetaEntry, facts: BuiltFacts, references: ReferenceImage[] = []): CatalogRecord {
  return {
    ...entry,
    glbUrl: `glb/${entry.glb}`,
    thumbUrl: `thumbs/${entry.thumb}`,
    glbBytes: facts.glbBytes,
    glbGzipBytes: facts.glbGzipBytes,
    jsUrl: `js/${entry.id}.js`,
    jsBytes: facts.jsBytes,
    jsGzipBytes: facts.jsGzipBytes,
    thumbBytes: facts.thumbBytes,
    triangles: facts.triangles,
    vertices: facts.vertices,
    primitives: facts.primitives,
    materials: facts.materials,
    sizeX: mm(facts.max[0] - facts.min[0]),
    sizeY: mm(facts.max[1] - facts.min[1]),
    sizeZ: mm(facts.max[2] - facts.min[2]),
    references,
  };
}
