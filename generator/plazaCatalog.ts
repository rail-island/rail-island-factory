// The catalog fields of the plaza landmarks (docs/models/plaza-landmarks.md): the
// monuments and civic buildings the game may stand on a settlement's main square.
// Constants only, so a landmark's standalone JS bundles nothing else.
import type { CatalogFields } from "./design.ts";

export const PLAZA_CATALOG: CatalogFields = {
  category: "Historical",
  group: "hist_center",
  defaultScale: 1,
  license: "CC0",
  author: "Rail Island",
  source: "Rail Island",
};
