// What `pnpm dev` serves in place of the export folder (devServer.ts loads this
// module through Vite, so an edited design is picked up on the next request).
// Nothing is built ahead and nothing is written to disk:
//
//   /catalog.json        every design's meta entry, unmeasured (`pending`): the
//                        site measures each record from its JS model and renders
//                        every thumbnail in the browser (src/devMeasure.ts)
//   /js/<id>.js          the design's JS model, bundled when first asked for
//   /tree/<id>.json      the design's source tree, built when asked for
//   /refs/<id>/<name>    the design's source images, straight from assets/
//   /surfaces.meta.json  the named surfaces, as the build writes them
//   /textures/<file>     the texture library's photos, straight from assets/textures/
//
// No z-fighting, LOD or game-property checks run here: `pnpm build` and the
// tests run them.

import { catalogRecord, isSideViewCategory, listedEntry, metaEntry, REFS_DIR, type BuiltFacts, type ModelCatalog } from "./catalog.ts";
import { BUILDINGS, DESIGNS, VILLAGE_DESIGNS, catalogFields, designReferenceFiles, designSource, designTree } from "./generate.ts";
import { bundleDesign } from "./jsModel.ts";
import fs from "node:fs";
import path from "node:path";
import { surfacesMeta, TEXTURES_DIR } from "./surfacesExport.ts";
import { TEXTURE_CHANNELS, TEXTURE_NAMES } from "./surfaces.ts";

/** The catalog as `pnpm dev` lists it: every record unmeasured, its figures zero. */
export function devCatalog(): ModelCatalog {
  const zero: BuiltFacts = { jsBytes: 0, jsGzipBytes: 0, thumbBytes: 0, triangles: 0, vertices: 0, primitives: 0, materials: 0, min: [0, 0, 0], max: [0, 0, 0] };
  return {
    version: 1,
    dev: true,
    records: [...DESIGNS.values()].map((design) => {
      const fields = catalogFields(design);
      // a placeholder frame, so the record asks for the side view; the site measures the real one
      const side = isSideViewCategory(fields.category) ? { widthM: 0, heightM: 0, bottomM: 0 } : null;
      const references = designReferenceFiles(design).map(({ name, file }) => ({ name, url: `${REFS_DIR}/${design.id}/${name}`, bytes: fs.statSync(file).size }));
      const building = BUILDINGS.includes(design) || VILLAGE_DESIGNS.includes(design);
      const record = catalogRecord(listedEntry(metaEntry(design, fields, null, side), design, building), zero, references, design.openttd);
      return { ...record, ...(design.buildCoarse ? { coarse: true as const } : {}), ...(design.buildMax ? { maxDetail: true as const } : {}), pending: true as const };
    }),
  };
}

/** The design's JS model (export/js/<id>.js as the build writes it), or null for an unknown id. */
export async function devJs(id: string): Promise<string | null> {
  const design = DESIGNS.get(id);
  return design ? bundleDesign(design, designSource(id)) : null;
}

/** The design's source tree file (export/tree/<id>.json), or null for an unknown id. */
export function devTree(id: string): string | null {
  return DESIGNS.has(id) ? `${JSON.stringify(designTree(id))}\n` : null;
}

/** The absolute path of one of the design's source images, or null. */
export function devReference(id: string, name: string): string | null {
  const design = DESIGNS.get(id);
  return (design && designReferenceFiles(design).find((r) => r.name === name)?.file) || null;
}

/** export/surfaces.meta.json as the build writes it: the site's 3D preview tints its photos by it. */
export function devSurfacesMeta(): string {
  return `${JSON.stringify(surfacesMeta(), null, 2)}\n`;
}

/** A photo of the texture library (export/textures/<name>_<channel>.jpg), or null for any other name. */
export function devTexture(file: string): string | null {
  const ok = TEXTURE_NAMES.some((name) => TEXTURE_CHANNELS.some((c) => file === `${name}_${c}.jpg`));
  return ok ? path.join(TEXTURES_DIR, file) : null;
}
