// What every procedural model is: an id, a title and the function that builds
// it. The skyscrapers (skyscrapers.ts) and the vehicles (vehicles.ts) are lists
// of these; generate.ts runs them. No `node:` imports.
//
// A design may be PARAMETRIC: it declares enum parameters (`params`), each with
// its values and a default, and `build` takes the chosen values. The export holds
// one GLB, thumbnail and source tree per design, built with the defaults; the
// meta and catalog entries list the parameters, and the standalone JS model's
// `build(THREE, params)` builds any combination (docs/models/parameters.md).

import type { MeshBuilder } from "./meshBuilder.ts";

/** One value of an enum parameter. */
export interface ParamValue {
  /** The stable token, e.g. "classA": what a caller passes and a saved map would store. */
  value: string;
  /** What a picker shows, e.g. "Class A (1st class)". */
  title: string;
}

/** An enum parameter of a parametric design. */
export interface ParamSpec {
  /** The stable key, e.g. "variant". */
  name: string;
  title: string;
  values: ParamValue[];
  /** One of `values`: what the exported GLB is built with. */
  default: string;
}

/** Chosen parameter values by name. */
export type ParamValues = Record<string, string>;

export interface ProceduralDesign {
  id: string;
  title: string;
  /** Builds the model; a parametric design reads `params`, missing names take their defaults. */
  build: (params?: ParamValues) => MeshBuilder;
  /** The design's enum parameters; absent for a fixed design. */
  params?: readonly ParamSpec[];
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
 * Every parameter of `specs` resolved: the given value or the default. Throws on
 * a name the design does not declare or a value its enum does not list, so a
 * typo never silently builds the default.
 */
export function resolveParams(specs: readonly ParamSpec[], given: ParamValues = {}): ParamValues {
  for (const name of Object.keys(given)) {
    if (!specs.some((s) => s.name === name)) throw new Error(`unknown parameter "${name}"`);
  }
  const out: ParamValues = {};
  for (const s of specs) {
    const v = given[s.name] ?? s.default;
    if (!s.values.some((x) => x.value === v)) {
      throw new Error(`parameter "${s.name}" has no value "${v}" (expected ${s.values.map((x) => x.value).join(", ")})`);
    }
    out[s.name] = v;
  }
  return out;
}

/** Every combination of the parameters' values, the defaults first; [{}] for none. */
export function paramCombinations(specs: readonly ParamSpec[] = []): ParamValues[] {
  let out: ParamValues[] = [{}];
  for (const s of specs) {
    const ordered = [s.default, ...s.values.map((v) => v.value).filter((v) => v !== s.default)];
    out = out.flatMap((combo) => ordered.map((v) => ({ ...combo, [s.name]: v })));
  }
  return out;
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
