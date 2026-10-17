// The export contract: skyscrapers.meta.json (what the game will import) and
// catalog.json (what the site lists), both built from the designs themselves.

import { describe, expect, it } from "vitest";
import { parseGlb } from "../generator/glbTriangles";
import { PNG } from "pngjs";
import { SIDE_MAX_PX, SIDE_PX_PER_M, glbSideFrame } from "../generator/renderGlbThumb";
import { generateInSubprocess } from "./generateSubprocess";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { VEHICLES } from "../generator/vehicles";
import { buildLodModel } from "../generator/lodModel";
import { ALL_VEHICLES, BUILDINGS, DESIGNS, buildExport, generateReferences } from "../generator/generate";
import { VILLAGE_HOUSES } from "../generator/village";
import {
  CATALOG_FILE, META_FILE, VEHICLE_META_FILE, VILLAGE_META_FILE, catalogRecord, exportMeta, exportVehicleMeta, isSideViewCategory, metaEntry,
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
        params: SKYSCRAPERS.find((d) => d.id === b.id)!.params,
        category: "Skyscrapers",
        group: "skyscraper_c",
        glb: `${b.id}.glb`,
        thumb: `${b.id}.png`,
        defaultScale: 1,
        license: "CC0",
        author: "Rail Island",
        source: "Rail Island",
      });
    }
  });
});

describe("exportMeta for the village houses", () => {
  // the houses go to village.meta.json in the same buildings shape, each entry
  // with the village catalog fields and the design's parameters
  it("has one entry per house, with the Village fields and the params", () => {
    const meta = exportMeta(VILLAGE_HOUSES);
    expect(meta.count).toBe(VILLAGE_HOUSES.length);
    for (const b of meta.buildings) {
      const d = VILLAGE_HOUSES.find((x) => x.id === b.id)!;
      expect(b).toEqual({
        id: d.id,
        title: d.title,
        category: "Village",
        group: d.id.startsWith("proc-building-village-timber-") ? "village_red" : "village",
        glb: `${d.id}.glb`,
        thumb: `${d.id}.png`,
        defaultScale: 1,
        license: "CC0",
        author: "Rail Island",
        source: "Rail Island",
        params: d.params,
      });
    }
  });
});

describe("the buildings' meta", () => {
  // The landmarks and stations share skyscrapers.meta.json with the skyscrapers,
  // each with its own family's category, pool and scale -- not the skyscrapers'.
  it("lists every building once, each with its own catalog fields", () => {
    const meta = exportMeta(BUILDINGS);
    expect(meta.buildings.map((b) => b.id)).toEqual(BUILDINGS.map((d) => d.id));
    expect(new Set(meta.buildings.map((b) => b.id)).size).toBe(BUILDINGS.length);
    for (const b of meta.buildings) {
      const d = BUILDINGS.find((x) => x.id === b.id)!;
      if (b.id.startsWith("proc-building-sky-")) expect(b.category).toBe("Skyscrapers");
      else expect([b.category, b.group, b.defaultScale]).toEqual([d.catalog!.category, d.catalog!.group, d.catalog!.defaultScale]);
    }
    expect(meta.buildings.find((b) => b.id === "proc-building-prague-main-station")).toMatchObject({ category: "Station", defaultScale: 1 });
    expect(meta.buildings.find((b) => b.id === "proc-building-white-house")).toMatchObject({ category: "Historical", group: "hist_center", defaultScale: 1 });
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
        ...(VEHICLES.find((d) => d.id === v.id)!.catalog?.traction ? { traction: VEHICLES.find((d) => d.id === v.id)!.catalog!.traction } : {}),
        glb: `${v.id}.glb`,
        thumb: `${v.id}.png`,
        license: "CC0",
        author: "Rail Island",
        source: "Rail Island",
        // a parametric vehicle lists its enum parameters; a fixed one has no key
        ...(VEHICLES.find((d) => d.id === v.id)!.params ? { params: VEHICLES.find((d) => d.id === v.id)!.params } : {}),
      });
    }
  });

  it("lists a rigged vehicle's rig, and no rig key for the others", () => {
    const rig = { steer: { axles: [{ nodes: ["wheel-front-left", "wheel-front-right"] as [string, string], wheelbase: 5 }], maxAngleDeg: 40, track: 2 } };
    const meta = exportVehicleMeta(VEHICLES, new Map([["proc-vehicle-american-truck", rig]]));
    expect(meta.vehicles.find((v) => v.id === "proc-vehicle-american-truck")!.rig).toEqual(rig);
    expect(meta.vehicles.filter((v) => v.rig).map((v) => v.id)).toEqual(["proc-vehicle-american-truck"]);
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
      await generateInSubprocess(dir, "export");
      const meta = JSON.parse(fs.readFileSync(path.join(dir, META_FILE), "utf8")) as ExportMeta;
      const catalog = JSON.parse(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")) as ModelCatalog;
      const vehicles = JSON.parse(fs.readFileSync(path.join(dir, VEHICLE_META_FILE), "utf8")) as VehicleExportMeta;
      const village = JSON.parse(fs.readFileSync(path.join(dir, VILLAGE_META_FILE), "utf8")) as ExportMeta;
      expect(meta).toEqual(exportMeta(BUILDINGS));
      expect(village).toEqual(exportMeta(VILLAGE_HOUSES));
      // a rigged vehicle's entry carries its rig, the one its GLB's scene holds
      const rigs = new Map(ALL_VEHICLES.flatMap((d) => {
        const rig = d.build().rig;
        return rig ? [[d.id, rig] as const] : [];
      }));
      // a road or rail vehicle's thumbnail is a side view, framed as its meta says
      const sides = new Map(ALL_VEHICLES.flatMap((d) =>
        isSideViewCategory(d.catalog?.category ?? "Road vehicles") ? [[d.id, glbSideFrame(path.join(dir, "glb", `${d.id}.glb`))] as const] : []));
      expect(vehicles).toEqual(exportVehicleMeta(ALL_VEHICLES, rigs, sides));
      for (const v of vehicles.vehicles) {
        const png = PNG.sync.read(fs.readFileSync(path.join(dir, "thumbs", v.thumb)));
        if (isSideViewCategory(v.category)) {
          expect(v.thumbSide).toBeDefined();
          const { widthM, heightM } = v.thumbSide!;
          const ppm = Math.min(SIDE_PX_PER_M, SIDE_MAX_PX / widthM);
          expect([png.width, png.height]).toEqual([Math.round(widthM * ppm), Math.round(heightM * ppm)]);
        } else {
          expect(v.thumbSide).toBeUndefined();
          expect(png.width).toBe(png.height);
        }
      }
      expect(meta.buildings.every((b) => !b.thumbSide)).toBe(true);
      for (const v of vehicles.vehicles) {
        const { json } = parseGlb(fs.readFileSync(path.join(dir, "glb", v.glb)));
        expect((json.scenes![0] as { extras?: { rig?: unknown } }).extras?.rig).toEqual(v.rig);
      }
      expect(vehicles.vehicles.find((v) => v.id === "proc-vehicle-american-truck")!.rig!.steer!.axles[0]!.nodes).toEqual(["wheel-front-left", "wheel-front-right"]);
      expect(catalog.version).toBe(1);
      expect(catalog.records.map((r) => r.id)).toEqual([...DESIGNS.keys()]);
      for (const r of catalog.records) {
        expect(fs.statSync(path.join(dir, r.glbUrl)).size).toBe(r.glbBytes);
        expect(fs.statSync(path.join(dir, r.thumbUrl)).size).toBe(r.thumbBytes);
        expect(fs.statSync(path.join(dir, r.jsUrl)).size).toBe(r.jsBytes);
        const design = DESIGNS.get(r.id)!;
        const lodBytes = buildLodModel(design).toGlb(r.id).length;
        expect(r.jsBytes).toBeLessThan(r.glbBytes + lodBytes);
        expect(r.triangles).toBeGreaterThan(0);
        const listed = meta.buildings.find((b) => b.id === r.id)
          ?? village.buildings.find((b) => b.id === r.id)
          ?? vehicles.vehicles.find((v) => v.id === r.id);
        expect(r).toMatchObject(listed!);
        // a skyscraper is tall (the twin towers' podium is the widest); the landmarks and stations need not be
        if (r.id.startsWith("proc-building-sky-")) expect(r.sizeY).toBeGreaterThan(1.5 * Math.max(r.sizeX, r.sizeZ));
        for (const ref of r.references) expect(fs.statSync(path.join(dir, ref.url)).size).toBe(ref.bytes);
      }
      // the CD 150's native BMPs reach the site
      expect(catalog.records.find((r) => r.id === "proc-vehicle-cd-150")!.references.map((x) => x.name)).toContain("native/z_inc.bmp");
      // deterministic: a second build writes the same documents
      const before = fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8");
      await buildExport(dir);
      expect(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")).toBe(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 900_000); // builds the whole export, which grows with every design
});

describe("generateReferences", () => {
  it("copies only the images of a design's assets folder and removes stale ones", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "factory-refs-"));
    try {
      const assets = path.join(root, "assets");
      const out = path.join(root, "export");
      fs.mkdirSync(path.join(assets, "loco", "native"), { recursive: true });
      fs.writeFileSync(path.join(assets, "loco", "photo.JPG"), "jpg");
      fs.writeFileSync(path.join(assets, "loco", "native", "side.bmp"), "bmp");
      fs.writeFileSync(path.join(assets, "loco", "SOURCES.md"), "text");
      fs.writeFileSync(path.join(assets, "loco", "model.glb"), "glb");
      fs.mkdirSync(path.join(out, "refs", "gone"), { recursive: true });
      fs.writeFileSync(path.join(out, "refs", "gone", "old.png"), "png");
      const designs = [
        { id: "veh-loco", title: "Loco", build: SKYSCRAPERS[0]!.build, references: "loco" },
        { id: "sky-plain", title: "Plain", build: SKYSCRAPERS[0]!.build },
      ];
      const refs = generateReferences(out, designs, assets);
      expect(refs.get("veh-loco")).toEqual([
        { name: "native/side.bmp", url: "refs/veh-loco/native/side.bmp", bytes: 3 },
        { name: "photo.JPG", url: "refs/veh-loco/photo.JPG", bytes: 3 },
      ]);
      expect(refs.get("sky-plain")).toEqual([]);
      expect(fs.readFileSync(path.join(out, "refs/veh-loco/native/side.bmp"), "utf8")).toBe("bmp");
      expect(fs.existsSync(path.join(out, "refs", "gone"))).toBe(false);
    } finally {
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
});
