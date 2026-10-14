// The export contract: skyscrapers.meta.json (what the game will import) and
// catalog.json (what the site lists), both built from the designs themselves.

import { describe, expect, it } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { VEHICLES } from "../generator/vehicles";
import { DESIGNS, buildExport } from "../generator/generate";
import {
  CATALOG_FILE, META_FILE, VEHICLE_META_FILE, catalogRecord, exportMeta, exportVehicleMeta, metaEntry,
  type ExportMeta, type ModelCatalog, type VehicleExportMeta,
} from "../generator/catalog";

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

describe("exportVehicleMeta", () => {
  // The vehicles go to their own file under "vehicles", so the game's building
  // import never picks up a truck.
  it("has one entry per vehicle, with the vehicles' catalog fields", () => {
    const meta = exportVehicleMeta(VEHICLES);
    expect(meta.count).toBe(VEHICLES.length);
    expect(meta).not.toHaveProperty("buildings");
    expect(meta.vehicles.map((v) => v.id)).toEqual(VEHICLES.map((d) => d.id));
    for (const v of meta.vehicles) {
      expect(v).toEqual({
        id: v.id,
        title: VEHICLES.find((d) => d.id === v.id)!.title,
        category: VEHICLES.find((d) => d.id === v.id)!.catalog?.category ?? "Road vehicles",
        group: VEHICLES.find((d) => d.id === v.id)!.catalog?.group ?? "truck",
        glb: `${v.id}.glb`,
        thumb: `${v.id}.png`,
        defaultScale: 1,
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
      glbBytes: 1000, glbGzipBytes: 300, jsBytes: 80, jsGzipBytes: 50, thumbBytes: 200, triangles: 12, vertices: 36, primitives: 2, materials: 2,
      min: [-1.0004, 0, -2], max: [1, 30.1234567, 2],
    });
    expect(r.glbUrl).toBe(`glb/${SKYSCRAPERS[0]!.id}.glb`);
    expect(r.jsUrl).toBe(`js/${SKYSCRAPERS[0]!.id}.js`);
    expect([r.glbGzipBytes, r.jsBytes, r.jsGzipBytes]).toEqual([300, 80, 50]);
    expect(r.thumbUrl).toBe(`thumbs/${SKYSCRAPERS[0]!.id}.png`);
    expect([r.sizeX, r.sizeY, r.sizeZ]).toEqual([2, 30.123, 4]);
    expect(r.triangles).toBe(12);
  });
});

describe("buildExport", () => {
  it("writes the meta.json files and catalog.json that agree with the files beside them", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-export-"));
    try {
      await buildExport(dir);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, META_FILE), "utf8")) as ExportMeta;
      const catalog = JSON.parse(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")) as ModelCatalog;
      const vehicles = JSON.parse(fs.readFileSync(path.join(dir, VEHICLE_META_FILE), "utf8")) as VehicleExportMeta;
      expect(meta).toEqual(exportMeta(SKYSCRAPERS));
      expect(vehicles).toEqual(exportVehicleMeta(VEHICLES));
      expect(catalog.version).toBe(1);
      expect(catalog.records.map((r) => r.id)).toEqual([...DESIGNS.keys()]);
      for (const r of catalog.records) {
        expect(fs.statSync(path.join(dir, r.glbUrl)).size).toBe(r.glbBytes);
        expect(fs.statSync(path.join(dir, r.thumbUrl)).size).toBe(r.thumbBytes);
        expect(fs.statSync(path.join(dir, r.jsUrl)).size).toBe(r.jsBytes);
        expect(r.jsBytes).toBeLessThan(r.glbBytes);
        expect(r.triangles).toBeGreaterThan(0);
        const listed = meta.buildings.find((b) => b.id === r.id) ?? vehicles.vehicles.find((v) => v.id === r.id);
        expect(r).toMatchObject(listed!);
        if (meta.buildings.some((b) => b.id === r.id)) expect(r.sizeY).toBeGreaterThan(2 * Math.max(r.sizeX, r.sizeZ));
      }
      // deterministic: a second build writes the same documents
      const before = fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8");
      await buildExport(dir);
      expect(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")).toBe(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
