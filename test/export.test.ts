// The export contract: skyscrapers.meta.json (what the game will import) and
// catalog.json (what the site lists), both built from the designs themselves.

import { describe, expect, it } from "vitest";
import { parseGlb } from "../generator/glbTriangles";
import { PNG } from "pngjs";
import { SIDE_MAX_PX, SIDE_PX_PER_M, glbSideFrame } from "../generator/renderGlbThumb";
import { built, glbOf, lodGlbOf } from "./catalogCache";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import { VEHICLES } from "../generator/vehicles";
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
    for (const { game, ...b } of meta.buildings) {
      // the city presets (cityPresets.ts, test/cityPresets.test.ts) are the only game property a skyscraper has
      if (game) expect(Object.keys(game), b.id).toEqual(["city"]);
      expect(b).toEqual({
        id: b.id,
        title: SKYSCRAPERS.find((d) => d.id === b.id)!.title,
        params: SKYSCRAPERS.find((d) => d.id === b.id)!.params,
        category: "Skyscrapers",
        group: "skyscraper_c",
        js: `${b.id}.js`,
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
    for (const { game, ...b } of meta.buildings) {
      const d = VILLAGE_HOUSES.find((x) => x.id === b.id)!;
      // every house a city builds carries its presets; the alpine hut is placed by hand only
      if (d.id === "proc-building-village-alpine-hut") expect(game).toBeUndefined();
      else expect(game, d.id).toEqual({ city: { presets: expect.any(Array) } });
      expect(b).toEqual({
        id: d.id,
        title: d.title,
        category: "Village",
        group: d.id.startsWith("proc-building-village-timber-") ? "village_red" : "village",
        js: `${d.id}.js`,
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
        js: `${v.id}.js`,
        thumb: `${v.id}.png`,
        license: "CC0",
        author: "Rail Island",
        source: "Rail Island",
        // a parametric vehicle lists its enum parameters; a fixed one has no key
        ...(VEHICLES.find((d) => d.id === v.id)!.params ? { params: VEHICLES.find((d) => d.id === v.id)!.params } : {}),
        game: VEHICLES.find((d) => d.id === v.id)!.game,
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

describe("game properties", () => {
  // What the game needs beyond geometry is the factory's: every vehicle states its
  // running figures, and the build refuses one that does not.
  it("are in every vehicle's meta entry, and only plaza/block/city in a building's", () => {
    for (const v of exportVehicleMeta(ALL_VEHICLES).vehicles) {
      expect(v.game, v.id).toBeDefined();
      for (const k of ["weight", "power", "maxspeed", "accel"] as const) expect(v.game, `${v.id} ${k}`).toHaveProperty(k);
    }
    for (const b of exportMeta(BUILDINGS).buildings) {
      if (b.game) expect(Object.keys(b.game).every((k) => k === "plaza" || k === "block" || k === "city"), b.id).toBe(true);
    }
    expect(exportMeta(BUILDINGS).buildings.find((b) => b.id === "proc-building-brandenburg-gate")!.game).toEqual({
      plaza: { cities: ["city"], layouts: ["rect"], fit: "footprint" },
      city: { presets: [{}] },
    });
    // the per-variant figures: the CD 162 runs at 140 km/h, the 163 at 120
    const cd163 = exportVehicleMeta(ALL_VEHICLES).vehicles.find((v) => v.id === "proc-vehicle-cd-163")!.game!;
    expect(cd163.maxspeed).toBe(120);
    expect(cd163.variants!.find((x) => x.params.livery === "cd162")!.maxspeed).toBe(140);
  });

  it("refuse a vehicle without them, or with a figure or variant that is wrong", () => {
    const base = { id: "proc-vehicle-test", title: "Test", build: SKYSCRAPERS[0]!.build, buildLod: SKYSCRAPERS[0]!.buildLod };
    const params = [{ name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] }];
    const physics = { weight: 80, power: 3000, maxspeed: 120, accel: null };
    expect(() => exportVehicleMeta([base])).toThrow(/proc-vehicle-test: game properties missing/);
    expect(() => exportVehicleMeta([{ ...base, game: { weight: 80, power: 3000, maxspeed: 120 } }])).toThrow(/lack "accel"/);
    expect(() => exportVehicleMeta([{ ...base, game: { ...physics, power: Number.NaN } }])).toThrow(/invalid "power"/);
    expect(() => exportVehicleMeta([{ ...base, params, game: { ...physics, variants: [{ params: { livery: "green" }, maxspeed: 140 }] } }])).toThrow(/does not resolve/);
    expect(() => exportVehicleMeta([{ ...base, params, game: { ...physics, variants: [{ params: { livery: "red" }, maxspeed: 140 }] } }])).toThrow(/at the default/);
    expect(() => exportVehicleMeta([{ ...base, params, game: { ...physics, variants: [{ params: { livery: "blue" } }, { params: { livery: "blue" } }] } }])).toThrow(/twice/);
    expect(exportVehicleMeta([{ ...base, params, game: { ...physics, variants: [{ params: { livery: "blue" }, maxspeed: 140 }] } }]).vehicles[0]!.game!.variants).toHaveLength(1);
    expect(() => exportMeta([{ ...base, id: "proc-building-test", game: { ...physics } }])).toThrow(/of a building may hold only plaza, block and city/);
  });
});

describe("catalogRecord", () => {
  it("joins the meta entry with the built facts and the site URLs", () => {
    const r = catalogRecord(metaEntry(SKYSCRAPERS[0]!), {
      jsBytes: 80, jsGzipBytes: 50, thumbBytes: 200, triangles: 12, vertices: 36, primitives: 2, materials: 2,
      min: [-1.0004, 0, -2], max: [1, 30.1234567, 2],
    });
    expect(r.jsUrl).toBe(`js/${SKYSCRAPERS[0]!.id}.js`);
    expect([r.jsBytes, r.jsGzipBytes]).toEqual([80, 50]);
    expect(r).not.toHaveProperty("glbUrl");
    expect(r).not.toHaveProperty("glbBytes");
    expect(r.thumbUrl).toBe(`thumbs/${SKYSCRAPERS[0]!.id}.png`);
    expect([r.sizeX, r.sizeY, r.sizeZ]).toEqual([2, 30.123, 4]);
    expect(r.triangles).toBe(12);
  });
});

describe("buildExport", () => {
  // A few designs stand for the catalog: a skyscraper, a village house, a rigged
  // road vehicle and a rail vehicle with source images (the build exports them all).
  const SAMPLE = ["proc-building-sky-pyramid", "proc-building-village-cottage", "proc-vehicle-american-truck", "proc-vehicle-cd-150"].map((id) => DESIGNS.get(id)!);
  const inSample = <T extends { id: string }>(list: readonly T[]) => list.filter((d) => SAMPLE.some((x) => x.id === d.id));

  it("writes the meta.json files and catalog.json that agree with the files beside them", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-export-"));
    try {
      await buildExport(dir, SAMPLE);
      const meta = JSON.parse(fs.readFileSync(path.join(dir, META_FILE), "utf8")) as ExportMeta;
      const catalog = JSON.parse(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")) as ModelCatalog;
      const vehicles = JSON.parse(fs.readFileSync(path.join(dir, VEHICLE_META_FILE), "utf8")) as VehicleExportMeta;
      const village = JSON.parse(fs.readFileSync(path.join(dir, VILLAGE_META_FILE), "utf8")) as ExportMeta;
      expect(meta).toEqual(exportMeta(inSample(BUILDINGS)));
      expect(village).toEqual(exportMeta(inSample(VILLAGE_HOUSES)));
      // a rigged vehicle's entry carries its rig, the one its built model holds
      const rigs = new Map(inSample(ALL_VEHICLES).flatMap((d) => {
        const rig = built(d.id).rig;
        return rig ? [[d.id, rig] as const] : [];
      }));
      // a road or rail vehicle's thumbnail is a side view, framed as its meta says
      const sides = new Map(inSample(ALL_VEHICLES).flatMap((d) =>
        isSideViewCategory(d.catalog?.category ?? "Road vehicles") ? [[d.id, glbSideFrame(glbOf(d.id))] as const] : []));
      expect(vehicles).toEqual(exportVehicleMeta(inSample(ALL_VEHICLES), rigs, sides));
      expect(vehicles.vehicles.map((v) => v.id).sort()).toEqual(["proc-vehicle-american-truck", "proc-vehicle-cd-150"]);
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
      // no GLB is exported; the in-memory one carries the rig the meta lists
      expect(fs.existsSync(path.join(dir, "glb"))).toBe(false);
      for (const v of vehicles.vehicles) {
        const { json } = parseGlb(glbOf(v.id));
        expect((json.scenes![0] as { extras?: { rig?: unknown } }).extras?.rig).toEqual(v.rig);
      }
      expect(vehicles.vehicles.find((v) => v.id === "proc-vehicle-american-truck")!.rig!.steer!.axles[0]!.nodes).toEqual(["wheel-front-left", "wheel-front-right"]);
      expect(catalog.version).toBe(1);
      expect(catalog.records.map((r) => r.id)).toEqual(SAMPLE.map((d) => d.id));
      for (const r of catalog.records) {
        expect(fs.statSync(path.join(dir, r.thumbUrl)).size).toBe(r.thumbBytes);
        expect(fs.statSync(path.join(dir, r.jsUrl)).size).toBe(r.jsBytes);
        expect(r.jsBytes).toBeLessThan(glbOf(r.id).length + lodGlbOf(r.id).length);
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
      await buildExport(dir, SAMPLE);
      expect(fs.readFileSync(path.join(dir, CATALOG_FILE), "utf8")).toBe(before);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
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
        { id: "veh-loco", title: "Loco", build: SKYSCRAPERS[0]!.build, buildLod: SKYSCRAPERS[0]!.buildLod, references: "loco" },
        { id: "sky-plain", title: "Plain", build: SKYSCRAPERS[0]!.build, buildLod: SKYSCRAPERS[0]!.buildLod },
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
