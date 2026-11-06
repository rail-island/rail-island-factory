// The build cache (docs/guide/build-cache.md): what `pnpm build:models` learns of a
// design by building it -- its counts and bounds, rig, side-view frame, rider seat,
// the JS bundle's switches, the extents the legacy table and the OpenTTD formations
// measure, that it passed the z-fighting and LOD checks -- and a confirmed model's
// thumbnail, kept under build-cache/ and committed, so a build skips every design
// whose inputs are unchanged.
//
// A design's key is a SHA-256 over everything its build reads: the text of every
// file its source module imports, at any depth (static imports; generator code
// reads no files at build time), the shared pipeline files (PIPELINE: the GLB
// writer, the checks, the thumbnail renderer, the bundler), the design's own data
// (its fields, a function by its name), its catalog fields and the build's settings.
// generate.ts is not part of it, so adding a family re-keys no model.
//
//   build-cache/facts.json        every design's facts with its key, sorted by id
//   build-cache/thumbs/<id>.png   a confirmed model's thumbnail
//   export/.build-keys.json       the key each JS model and source tree in export/ was written for

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import type { ProceduralDesign } from "./design.ts";
import type { GlbStats } from "./glbStats.ts";
import type { Vec3 } from "./glbTriangles.ts";
import type { BundleFlags } from "./jsModel.ts";
import type { SideFrame } from "./renderGlbThumb.ts";
import type { VehicleRig } from "./rig.ts";

const GENERATOR_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(GENERATOR_DIR, "..");

/** The committed cache of the repository's export (export/ itself is gitignored). */
export const BUILD_CACHE_DIR = path.join(REPO_ROOT, "build-cache");

/** Bump when what the cache holds, or how a key is made, changes: every design is rebuilt once. */
export const CACHE_VERSION = "1";

/**
 * The files every design's outputs pass through besides its own module's imports:
 * the recording mesh builder and GLB writer, the source tree, the checks, the
 * measurements, the thumbnail renderer and the JS bundler with the lean builder it
 * swaps in. Their imports count too.
 */
export const PIPELINE: readonly string[] = [
  "meshBuilder.ts", "sourceTree.ts", "coplanar.ts", "lod.ts", "lodModel.ts", "glbParse.ts", "glbTriangles.ts", "glbStats.ts",
  "riderSeat.ts", "renderGlbThumb.ts", "rig.ts", "jsModel.ts", "threeBuilder.ts", "passengerHints.ts",
];

/** What the build learns of a design by building it. */
export interface DesignFacts {
  key: string;
  /** Exterior triangles (a vehicle's interior has a budget of its own). */
  triangles: number;
  stats: GlbStats;
  rig: VehicleRig | null;
  /** A side-view thumbnail's frame (a road or rail vehicle's), else null. */
  side: SideFrame | null;
  /** A vehicle's rider seat, else null. */
  seat: Vec3 | null;
  /** The JS bundle's switches (jsModel.ts bundleFlags). */
  bundle: BundleFlags;
  /** The model's extents along x, y and z, by the parameter values measured (paramsKey). */
  extents: Record<string, [number, number, number]>;
}

/** The key of a set of parameter values in DesignFacts.extents: its entries in name order. */
export function paramsKey(params: Readonly<Record<string, unknown>>): string {
  return JSON.stringify(Object.entries(params).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

// static `import ... from`, `export ... from` and bare `import "..."`; a dynamic
// import (an import call) is a command-line entry's (renderGlbThumb.ts loads generate.ts so), not a build's
const IMPORTS = [/\b(?:import|export)\b[^;'"`]*?\bfrom\s*["']([^"']+)["']/g, /\bimport\s+["']([^"']+)["']/g];

/** The import graph of the generator's sources, each file read and hashed once. */
export class SourceGraph {
  private readonly text = new Map<string, string>();
  private readonly deps = new Map<string, string[]>();
  private readonly closures = new Map<string, string>();

  /** A file's text, line endings normalised (a Windows checkout keys the same). */
  private read(file: string): string {
    let t = this.text.get(file);
    if (t === undefined) {
      t = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      this.text.set(file, t);
    }
    return t;
  }

  private imports(file: string): string[] {
    let out = this.deps.get(file);
    if (out) return out;
    out = [];
    if (file.endsWith(".ts")) {
      const text = this.read(file);
      for (const re of IMPORTS) {
        for (const m of text.matchAll(re)) {
          const spec = m[1]!;
          if (!spec.startsWith(".")) continue; // a package: its version is in the key's settings
          const base = path.resolve(path.dirname(file), spec);
          const hit = [base, `${base}.ts`, path.join(base, "index.ts")].find((c) => fs.existsSync(c) && fs.statSync(c).isFile());
          if (!hit) throw new Error(`${path.relative(REPO_ROOT, file)}: cannot resolve the import "${spec}"`);
          out.push(hit);
        }
      }
    }
    this.deps.set(file, out);
    return out;
  }

  /** Every file `roots` import at any depth, roots included, as sorted repository paths. */
  files(roots: readonly string[]): string[] {
    const seen = new Set<string>();
    const stack = [...roots];
    while (stack.length) {
      const f = stack.pop()!;
      if (seen.has(f)) continue;
      seen.add(f);
      stack.push(...this.imports(f));
    }
    return [...seen].map((f) => path.relative(REPO_ROOT, f).split(path.sep).join("/")).sort();
  }

  /** A hash over the paths and texts of every file `roots` import, at any depth. */
  hash(roots: readonly string[]): string {
    const id = roots.join("\n");
    let h = this.closures.get(id);
    if (h === undefined) {
      const sha = crypto.createHash("sha256");
      for (const rel of this.files(roots)) sha.update(`${rel}\n${this.read(path.join(REPO_ROOT, rel))}\n`);
      h = sha.digest("hex");
      this.closures.set(id, h);
    }
    return h;
  }
}

const ESBUILD_VERSION = (createRequire(import.meta.url)("esbuild/package.json") as { version: string }).version;

/** A design's data as the key sees it: every field, a function by its name. */
function designData(design: ProceduralDesign): string {
  return JSON.stringify(design, (_k, v: unknown) => (typeof v === "function" ? `fn:${(v as { name: string }).name}` : v));
}

/**
 * A design's cache key, or null for a design with no source module (a test's own
 * design), which is never cached. `settings` is what else the build reads for it:
 * its catalog fields, whether it is a vehicle, the thumbnail's view and size and
 * the triangle caps.
 */
export function designKey(graph: SourceGraph, design: ProceduralDesign, source: string | undefined, settings: unknown): string | null {
  if (!source) return null;
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({
      version: CACHE_VERSION,
      esbuild: ESBUILD_VERSION,
      pipeline: graph.hash(PIPELINE.map((f) => path.join(GENERATOR_DIR, f))),
      module: graph.hash([path.join(GENERATOR_DIR, source)]),
      design: designData(design),
      settings,
    }))
    .digest("hex");
}

const FACTS_FILE = "facts.json";
const THUMBS_DIR = "thumbs";

/** The cache in one folder: build-cache/ for the repository's export, a scratch one for a test's. */
export class BuildCache {
  private readonly facts: Map<string, DesignFacts>;

  constructor(readonly dir: string) {
    const file = path.join(dir, FACTS_FILE);
    const stored = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8")) as { designs: Record<string, DesignFacts> }).designs : {};
    this.facts = new Map(Object.entries(stored));
  }

  /** The facts stored for a design under this key, or null when it has none or another key's. */
  get(id: string, key: string | null): DesignFacts | null {
    const f = this.facts.get(id);
    return key !== null && f?.key === key ? f : null;
  }

  /** Stores a design's facts (none for an unkeyed design). */
  set(id: string, facts: DesignFacts): void {
    this.facts.set(id, facts);
  }

  /** Every stored id with its key. */
  keys(): Map<string, string> {
    return new Map([...this.facts].map(([id, f]) => [id, f.key]));
  }

  /** Where a confirmed model's thumbnail is kept. */
  thumb(id: string): string {
    return path.join(this.dir, THUMBS_DIR, `${id}.png`);
  }

  /**
   * A model's extents for some parameter values: stored ones under its current
   * key, else `measure`'s, remembered for the next build.
   */
  extents(id: string, key: string | null, params: Readonly<Record<string, unknown>>, measure: () => number[]): number[] {
    const f = this.get(id, key);
    const k = paramsKey(params);
    const known = f?.extents[k];
    if (known) return known;
    const size = measure();
    if (f) f.extents[k] = [size[0]!, size[1]!, size[2]!];
    return size;
  }

  /**
   * Writes the facts of `keep`'s designs (dropping every other) and removes every
   * thumbnail but those of `thumbs`. A file is rewritten only when its text changed.
   */
  save(keep: ReadonlySet<string>, thumbs: ReadonlySet<string>): void {
    const designs: Record<string, DesignFacts> = {};
    for (const id of [...this.facts.keys()].filter((id) => keep.has(id)).sort()) {
      const f = this.facts.get(id)!;
      const extents = Object.fromEntries(Object.entries(f.extents).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
      designs[id] = { ...f, extents };
    }
    fs.mkdirSync(path.join(this.dir, THUMBS_DIR), { recursive: true });
    const text = `${JSON.stringify({ note: "Generated by pnpm build:models (docs/guide/build-cache.md); commit it with the model change. Never edit by hand.", version: CACHE_VERSION, designs }, null, 1)}\n`;
    const file = path.join(this.dir, FACTS_FILE);
    if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) fs.writeFileSync(file, text);
    for (const name of fs.readdirSync(path.join(this.dir, THUMBS_DIR))) {
      if (name.endsWith(".png") && !thumbs.has(name.slice(0, -4))) fs.rmSync(path.join(this.dir, THUMBS_DIR, name));
    }
  }
}

/** export/.build-keys.json: the key each JS model and source tree in the export was written for. */
export const EXPORT_KEYS_FILE = ".build-keys.json";

export interface ExportKeys {
  js: Record<string, string>;
  tree: Record<string, string>;
}

export function readExportKeys(dir: string): ExportKeys {
  const file = path.join(dir, EXPORT_KEYS_FILE);
  if (!fs.existsSync(file)) return { js: {}, tree: {} };
  const k = JSON.parse(fs.readFileSync(file, "utf8")) as Partial<ExportKeys>;
  return { js: k.js ?? {}, tree: k.tree ?? {} };
}

/** Updates one part of export/.build-keys.json, sorted by id. */
export function writeExportKeys(dir: string, part: keyof ExportKeys, keys: ReadonlyMap<string, string>): void {
  const all = readExportKeys(dir);
  all[part] = Object.fromEntries([...keys].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const text = `${JSON.stringify(all, null, 1)}\n`;
  const file = path.join(dir, EXPORT_KEYS_FILE);
  if (!fs.existsSync(file) || fs.readFileSync(file, "utf8") !== text) fs.writeFileSync(file, text);
}
