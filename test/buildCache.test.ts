// The build cache (generator/buildCache.ts, docs/guide/build-cache.md): the
// committed build-cache/ holds every design's facts under its current key and every
// confirmed model's thumbnail; a key covers what a build reads and nothing the site's
// tables change; a design whose key is unchanged is not built.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BUILD_CACHE_DIR, PIPELINE, SourceGraph, paramsKey, type DesignFacts } from "../generator/buildCache";
import { DESIGNS, designKeys, designSource, generateJsModels, generateModels } from "../generator/generate";
import type { ProceduralDesign } from "../generator/design";
import { isDraft } from "../generator/workshop";

const GENERATOR = path.resolve(__dirname, "../generator");
const ALL = [...DESIGNS.values()];

describe("the committed build cache", () => {
  it("holds every design's facts under its current key and every confirmed model's thumbnail", () => {
    const stored = (JSON.parse(fs.readFileSync(path.join(BUILD_CACHE_DIR, "facts.json"), "utf8")) as { designs: Record<string, DesignFacts> }).designs;
    const keys = designKeys(ALL);
    const stale = ALL.filter((d) => stored[d.id]?.key !== keys.get(d.id)).map((d) => d.id);
    const extra = Object.keys(stored).filter((id) => !DESIGNS.has(id));
    const thumbs = fs.readdirSync(path.join(BUILD_CACHE_DIR, "thumbs")).filter((n) => n.endsWith(".png")).map((n) => n.slice(0, -4)).sort();
    const confirmed = ALL.filter((d) => !isDraft(d.id)).map((d) => d.id).sort();
    const hint = "run `pnpm build:models` and commit build-cache/ (docs/guide/build-cache.md)";
    expect(stale.length, `${stale.length} designs changed since build-cache/ was written - ${hint}: ${stale.slice(0, 20).join(", ")}`).toBe(0);
    expect(extra, `build-cache/ holds designs that no longer exist - ${hint}`).toEqual([]);
    expect(thumbs, `build-cache/thumbs/ must hold exactly the confirmed models' thumbnails - ${hint}`).toEqual(confirmed);
  });
});

describe("a design's key", () => {
  it("reads no table the site or the game's meta files change for other reasons", () => {
    // confirming a model, a web link, a sound, an OpenTTD figure or a translation must re-key no model
    const outside = /(^|\/)(generate|workshop|catalog|linkTable|soundTable|openttdTable|openttdIds|text|countryTable)\.(ts|json)$|catalogModels\.json$/;
    const graph = new SourceGraph();
    const modules = [...new Set(ALL.map((d) => designSource(d.id)))];
    const roots = [PIPELINE.map((f) => path.join(GENERATOR, f)), ...modules.map((m) => [path.join(GENERATOR, m)])];
    const found = roots.flatMap((r) => graph.files(r).filter((f) => outside.test(f)).map((f) => `${r.length > 1 ? "pipeline" : r[0]}: ${f}`));
    expect(found).toEqual([]);
  });

  it("is unique per design and changes with the design's data", () => {
    const keys = designKeys(ALL);
    expect(new Set(keys.values()).size).toBe(ALL.length);
    const d = DESIGNS.get("proc-vehicle-vectron")!;
    const renamed: ProceduralDesign = { ...d, title: `${d.title} II` };
    expect(designKeys([renamed]).get(d.id)).not.toBe(keys.get(d.id));
  });

  it("covers every file a module imports, at any depth, and no dynamic import", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-graph-"));
    try {
      fs.writeFileSync(path.join(dir, "a.ts"), `import { b } from "./b.ts";\nexport { c } from "./c";\nexport const a = b;\nconst lazy = () => import("./d.ts");\n`);
      fs.writeFileSync(path.join(dir, "b.ts"), `import data from "./data.json";\nimport type { X } from "three";\nexport const b = data;\n`);
      fs.writeFileSync(path.join(dir, "c.ts"), "export const c = 1;\n");
      fs.writeFileSync(path.join(dir, "d.ts"), "export const d = 1;\n");
      fs.writeFileSync(path.join(dir, "data.json"), "{}\n");
      const a = path.join(dir, "a.ts");
      const names = new SourceGraph().files([a]).map((f) => path.basename(f));
      expect(names.sort()).toEqual(["a.ts", "b.ts", "c.ts", "data.json"]);
      const before = new SourceGraph().hash([a]);
      // line endings do not count: a Windows checkout keys the same
      fs.writeFileSync(path.join(dir, "c.ts"), "export const c = 1;\r\n");
      expect(new SourceGraph().hash([a])).toBe(before);
      fs.writeFileSync(path.join(dir, "data.json"), "{ \"x\": 1 }\n");
      expect(new SourceGraph().hash([a])).not.toBe(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("orders parameter values by name", () => {
    expect(paramsKey({ b: "1", a: "2" })).toBe(paramsKey({ a: "2", b: "1" }));
  });
});

describe("a cached design", () => {
  // a confirmed building and a draft vehicle with a side view
  const SAMPLE = ["proc-building-sky-pyramid", "proc-vehicle-new-routemaster"].map((id) => DESIGNS.get(id)!);

  it("is neither built nor bundled again, and its export files stay", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-cache-"));
    try {
      const first = generateModels(dir, SAMPLE);
      const js = await generateJsModels(dir, SAMPLE, new Map(first.map((m) => [m.id, m])));
      expect(first.every((m) => m.changed && m.key)).toBe(true);
      // the same designs, but any build throws: the second run must not build them
      const fail = (name: string) => Object.defineProperty(() => { throw new Error(`${name} was built`); }, "name", { value: name });
      const unbuildable = SAMPLE.map((d) => ({ ...d, build: fail(d.build.name), buildLod: fail(d.buildLod.name) }));
      const second = generateModels(dir, unbuildable);
      expect(second.map((m) => m.changed)).toEqual([false, false]);
      expect(second.map(({ changed: _c, ...m }) => m)).toEqual(first.map(({ changed: _c, ...m }) => m));
      expect(await generateJsModels(dir, unbuildable, new Map(second.map((m) => [m.id, m])))).toEqual(js);
      // the confirmed model's thumbnail is kept in the cache and copied to the export; the draft has none
      expect(fs.existsSync(path.join(dir, ".build-cache", "thumbs", `${SAMPLE[0]!.id}.png`))).toBe(true);
      expect(fs.existsSync(path.join(dir, "thumbs", `${SAMPLE[0]!.id}.png`))).toBe(true);
      expect(fs.existsSync(path.join(dir, ".build-cache", "thumbs", `${SAMPLE[1]!.id}.png`))).toBe(false);
      // a lost export file is written again: the tree needs a build
      fs.rmSync(path.join(dir, "tree", `${SAMPLE[0]!.id}.json`));
      expect(() => generateModels(dir, unbuildable)).toThrow(/was built/);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
