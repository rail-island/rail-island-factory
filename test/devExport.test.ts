// `pnpm dev` without an export folder: what generator/devExport.ts serves (the
// unmeasured catalog, the JS models, the source trees, the source images) and
// how the site measures a record from its JS model (src/devMeasure.ts),
// against what the build writes.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { Object3D } from "three";
import { proceduralId } from "../generator/modelId.ts";
import { DESIGNS, catalogFields, designGlb, designReferenceFiles, designSource, designTree } from "../generator/generate";
import { devCatalog, devJs, devReference, devSurfacesMeta, devTexture, devTree } from "../generator/devExport";
import { bundleDesign } from "../generator/jsModel";
import { TREES } from "../generator/trees";
import { glbStats } from "../generator/glbStats";
import { glbSideFrame } from "../generator/renderGlbThumb";
import { isSideViewCategory, metaEntry } from "../generator/catalog";
import { measureBuild } from "../src/devMeasure";

async function build(text: string): Promise<Object3D> {
  const url = `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
  return ((await import(/* @vite-ignore */ url)) as { default: (three: typeof THREE) => Object3D }).default(THREE);
}

describe("the dev catalog", () => {
  const catalog = devCatalog();

  it("lists every design, unmeasured, with its meta entry and source images", () => {
    expect(catalog.dev).toBe(true);
    expect(catalog.records.map((r) => r.id)).toEqual([...DESIGNS.keys()]);
    for (const r of catalog.records) {
      const design = DESIGNS.get(r.id)!;
      const fields = catalogFields(design);
      expect(r.pending).toBe(true);
      expect(r.triangles).toBe(0);
      expect(r.jsHash).toBeUndefined();
      // a side-view record carries a placeholder frame, the rest none
      expect(!!r.thumbSide).toBe(isSideViewCategory(fields.category));
      const { thumbSide: _side, ...entry } = metaEntry(design, fields);
      expect(r).toMatchObject(entry);
      expect(r.references.map((i) => i.name)).toEqual(designReferenceFiles(design).map((f) => f.name));
    }
  });

  it("advertises Max detail only for the trees, all of them", () => {
    expect(catalog.records.filter((r) => r.maxDetail).map((r) => r.id).sort()).toEqual(
      TREES.map((d) => d.id).sort());
  });

  it("serves the JS model and the source tree the build writes, and the source images from assets/", async () => {
    const id = proceduralId("proc-building-sky-art-deco");
    expect(await devJs(id)).toBe(await bundleDesign(DESIGNS.get(id)!, designSource(id)));
    expect(devTree(id)).toBe(`${JSON.stringify(designTree(id))}\n`);
    expect(await devJs("no-such-model")).toBeNull();
    expect(devTree("no-such-model")).toBeNull();
    const withRefs = catalog.records.find((r) => r.references.length > 0)!;
    const first = designReferenceFiles(DESIGNS.get(withRefs.id)!)[0]!;
    expect(devReference(withRefs.id, first.name)).toBe(first.file);
    expect(devReference(withRefs.id, "../SOURCES.md")).toBeNull();
  });
});

describe("measuring a dev record from its JS model", () => {
  const catalog = devCatalog();
  const records = [
    catalog.records.find((r) => r.category === "Skyscrapers")!,
    // a rigged road vehicle: steered wheels, a side-view frame
    catalog.records.find((r) => r.category === "Road vehicles" && DESIGNS.get(r.id)!.build().rig)!,
  ];

  for (const record of records) {
    it(`gives the build's counts, size, rig and side frame (${record.id})`, async () => {
      const design = DESIGNS.get(record.id)!;
      const object = await build(await bundleDesign(design, designSource(record.id)));
      const m = measureBuild(record, object);
      const glb = designGlb(record.id);
      const stats = glbStats(glb);
      expect(m.triangles).toBe(stats.triangles);
      expect(m.vertices).toBe(stats.vertices);
      expect(m.primitives).toBe(stats.primitives);
      expect(m.materials).toBe(stats.materials);
      expect(m.sizeX).toBeCloseTo(stats.max[0] - stats.min[0], 2);
      expect(m.sizeY).toBeCloseTo(stats.max[1] - stats.min[1], 2);
      expect(m.sizeZ).toBeCloseTo(stats.max[2] - stats.min[2], 2);
      expect(m.rig ?? null).toEqual(design.build().rig);
      if (record.thumbSide) {
        const side = glbSideFrame(glb);
        expect(m.thumbSide!.widthM).toBeCloseTo(side.widthM, 2);
        expect(m.thumbSide!.heightM).toBeCloseTo(side.heightM, 4);
        expect(m.thumbSide!.bottomM).toBe(side.bottomM);
      } else {
        expect(m.thumbSide).toBeUndefined();
      }
    });
  }
});

describe("the generator under `pnpm dev`", () => {
  // Regression: generator/sets/setsExport.ts imported each set module by a computed
  // path, which Vite's import analysis cannot follow, so every `pnpm dev` start
  // printed a "dynamic import cannot be analyzed" warning. The dev server loads the
  // generator through Vite (generator/devServer.ts), so a computed import() there must
  // carry Vite's ignore marker.
  it("marks every computed dynamic import for Vite", () => {
    const files: string[] = [];
    const walk = (dir: string): void => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (p.endsWith(".ts")) files.push(p);
      }
    };
    walk(path.join(__dirname, "..", "generator"));
    const unmarked: string[] = [];
    for (const f of files) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/\bimport\(\s*([^)]*)/g)) {
        const arg = m[1]!.trim();
        if (/^["'`][^"'`$]*["'`]$/.test(arg) || arg.startsWith("/* @vite-ignore */")) continue;
        unmarked.push(`${path.relative(path.join(__dirname, ".."), f)}: import(${arg})`);
      }
    }
    expect(unmarked).toEqual([]);
  });
});

describe("the texture library under `pnpm dev`", () => {
  // Regression: the dev server served no textures/ and no surfaces.meta.json, so the
  // site's 3D preview showed no photo on any surface while developing.
  it("serves the named surfaces and every photo, and nothing else from the folder", () => {
    const meta = JSON.parse(devSurfacesMeta()) as { surfaces: Record<string, unknown> };
    expect(meta.surfaces["bridge-brick"]).toBeDefined();
    expect(devTexture("wall_albedo.jpg")).toMatch(/assets[/\\]textures[/\\]wall_albedo\.jpg$/);
    expect(fs.existsSync(devTexture("wall_albedo.jpg")!)).toBe(true);
    expect(devTexture("SOURCES.md")).toBeNull();
    expect(devTexture("../package.json")).toBeNull();
  });
});
