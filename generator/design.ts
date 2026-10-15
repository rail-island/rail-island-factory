// What every procedural model is: an id, a title and the function that builds
// it. The skyscrapers (skyscrapers.ts) and the vehicles (vehicles.ts) are lists
// of these; generate.ts runs them. No `node:` imports.

import type { MeshBuilder } from "./meshBuilder.ts";

export interface ProceduralDesign {
  id: string;
  title: string;
  build: () => MeshBuilder;
  /**
   * The folder under assets/ holding the design's source images (photos, drawings,
   * native textures). The build copies them to export/refs/<id>/ and the site
   * shows them on the model page.
   */
  references?: string;
  /** Catalog fields that replace the family's (a rail vehicle among the road vehicles). */
  catalog?: CatalogFields;
}

/**
 * The game-catalog fields a family of models shares, written into each model's
 * meta.json entry (catalog.ts): the picker category, the pool it is drawn from,
 * the on-map size, and the attribution.
 */
export interface CatalogFields {
  category: string;
  group: string;
  defaultScale: number;
  license: string;
  author: string;
  source: string;
}
