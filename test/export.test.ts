// The export contract: skyscrapers.meta.json (what the game will import) and
// catalog.json (what the site lists), both built from the designs themselves.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { buildExport } from "../generator/generate";
import { CATALOG_FILE, META_FILE, catalogRecord, exportMeta, metaEntry, type ExportMeta, type ModelCatalog } from "../generator/catalog";

describe("exportMeta", () => {
  it("has one game-catalog entry per design, in the webapp's buildings.meta.json shape", () => {
    const meta = exportMeta(SKYSCRAPERS);
    expect(meta.count).toBe(SKYSCRAPERS.length);
    expect(meta.buildings.map((b) => b.id)).toEqual(SKYSCRAPERS.map((d) => d.id));
    for (const b of meta.buildings) {
      expect(b).toEqual({
        id: b.id,
        title: SKYSCRAPERS.find((d) => d.id === b.id)!.title,
        category: "Commercial",
        group: "skyscraper_c",
        glb: `${b.id}.glb`,
        thumb: `${b.id}.png`,
        defaultScale: 0.5,
        license: "CC0",
        author: "Rail Island",
        source: "Rail Island",
      });
    }
  });
});

describe("catalogRecord", () => {
  it("joins the meta entry with the built facts and the site URLs", () => {
    const r = catalogRecord(metaEntry(SKYSCRAPERS[0]!), {
      glbBytes: 1000, thumbBytes: 200, triangles: 12, vertices: 36, primitives: 2, materials: 2,
      min: [-1.0004, 0, -2], max: [1, 30.1234567, 2],
    });
    expect(r.glbUrl).toBe(`glb/${SKYSCRAPERS[0]!.id}.glb`);
    expect(r.thumbUrl).toBe(`thumbs/${SKYSCRAPERS[0]!.id}.png`);
    expect([r.sizeX, r.sizeY, r.sizeZ]).toEqual([2, 30.123, 4]);
    expect(r.triangles).toBe(12);
  });
});

describe("buildExport", () => {
  it("writes meta.json and catalog.json that agree with the files beside them", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-export-"));
    try {
      buildExport(dir);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, META_FILE), "utf8")) as ExportMeta;
      const catalog = JSON.parse(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")) as ModelCatalog;
      expect(meta).toEqual(exportMeta(SKYSCRAPERS));
      expect(catalog.version).toBe(1);
      expect(catalog.records.map((r) => r.id)).toEqual(meta.buildings.map((b) => b.id));
      for (const r of catalog.records) {
        expect(fs.statSync(path.join(dir, r.glbUrl)).size).toBe(r.glbBytes);
        expect(fs.statSync(path.join(dir, r.thumbUrl)).size).toBe(r.thumbBytes);
        expect(r.triangles).toBeGreaterThan(0);
        expect(r.sizeY).toBeGreaterThan(2 * Math.max(r.sizeX, r.sizeZ));
      }
      // deterministic: a second build writes the same documents
      const before = fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8");
      buildExport(dir);
      expect(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")).toBe(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
