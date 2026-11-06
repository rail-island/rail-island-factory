// The catalog and the workshop (docs/site/workshop.md). A model whose id is listed
// in catalogModels.json is confirmed: the site's catalog lists it and the game's
// meta files carry it. Any other model is a draft in the workshop: the site lists it
// under Workshop, and no meta file the game imports carries it, so a new model
// reaches the game only once it is confirmed.
//
// Kept apart from the designs on purpose, like countryTable.ts: a design module is
// bundled into each of its models' JS files, so a flag stated there would rewrite
// every model of that module. No `node:` imports.

import CATALOG_JSON from "./catalogModels.json";

/** Every confirmed model id, as exported (`proc-...`). */
export const CATALOG_IDS: ReadonlySet<string> = new Set(CATALOG_JSON.ids);

/** Whether a model is a draft in the workshop: not (yet) confirmed into the catalog. */
export function isDraft(id: string, catalog: ReadonlySet<string> = CATALOG_IDS): boolean {
  return !catalog.has(id);
}

/** The ids catalogModels.json lists that name no model: a typo, or a dropped design. */
export function unknownCatalogIds(ids: Iterable<string>, catalog: ReadonlySet<string> = CATALOG_IDS): string[] {
  const known = new Set(ids);
  return [...catalog].filter((id) => !known.has(id));
}
