// The one-click OpenTTD export and its preview (docs/site/openttd-export.md): the
// facts, presets and formations every vehicle a GRF can hold states
// (generator/openttdTable.ts), their check, the balance formula and the catalog's
// resolved block (generator/openttd.ts); the one-click items and a formation's
// figures (src/openttd/properties.ts); the prerendered scenes' placement and where
// the preview puts a vehicle's sprites (src/openttd/scene.ts); the prerender's
// marker colours (generator/openttdScenes/markers.ts).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { CatalogRecord } from "../src/catalogQuery";
import { checkOpenttdProperties, OPENTTD_REQUIRED_FACTS, type ProceduralDesign } from "../generator/design";
import { ALL_VEHICLES, catalogFields, checkOpenttdDesign, DESIGNS } from "../generator/generate";
import { catalogOpenttd, deriveBalance, openttdFeatureOf } from "../generator/openttd";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { anchorRgb, ANCHOR_COPIES, MASK, maskImages, readAnchor } from "../generator/openttdScenes/markers";
import { GRF_ZOOM } from "../src/openttd/grf";
import { HEADINGS, spriteAnchor } from "../src/openttd/projection";
import { oneClickIndex, oneClickItems, openttdFeature, resolveItem, shares } from "../src/openttd/properties";
import { frontPoint, kindOf, labelRect, placeParts, SCENE_SLOTS, sceneName, viewRect, type Placement, type PlacementSlot } from "../src/openttd/scene";

const SCENES = path.resolve(__dirname, "../src/openttd/scenes");

describe("every vehicle a GRF can hold", () => {
  const exportable = ALL_VEHICLES.filter((d) => openttdFeatureOf(catalogFields(d)) !== null);

  it("states its facts and presets, and only those vehicles do", () => {
    expect(exportable.length).toBeGreaterThan(100);
    for (const d of exportable) {
      expect(d.openttd, d.id).toBeDefined();
      for (const k of OPENTTD_REQUIRED_FACTS) expect(d.openttd![k], `${d.id} ${k}`).toBeDefined();
      expect(d.openttd!.presets?.[0], d.id).toEqual({});
    }
    for (const id of Object.keys(OPENTTD_TABLE)) {
      const d = DESIGNS.get(id);
      expect(d, `${id} is in the table but not a model`).toBeDefined();
      expect(openttdFeatureOf(catalogFields(d!)), id).not.toBeNull();
    }
    expect(Object.keys(OPENTTD_TABLE).length).toBe(exportable.length);
  });

  it("passes the build's check, formations within OpenTTD's part cap", () => {
    for (const d of exportable) {
      if (d.openttd?.formations) continue; // the formations are measured below, once
      expect(() => checkOpenttdProperties(d, true, openttdFeatureOf(catalogFields(d)))).not.toThrow();
    }
  });

  it("measures its formations' parts on the built cars", { timeout: 120_000 }, () => {
    const withFormations = exportable.filter((d) => d.openttd?.formations?.length);
    expect(withFormations.length).toBeGreaterThan(15);
    for (const d of withFormations) expect(() => checkOpenttdDesign(d), d.id).not.toThrow();
  });
});

describe("checkOpenttdProperties: presets and formations", () => {
  const design = (openttd: ProceduralDesign["openttd"]): ProceduralDesign => ({
    id: "d", title: "D", build: () => { throw new Error("unused"); }, buildLod: () => { throw new Error("unused"); },
    params: [
      { name: "unit", title: "Unit", default: "a", values: [{ value: "a", title: "A" }, { value: "b", title: "B" }, { value: "train", title: "Train" }] },
    ],
    openttd,
  });
  const facts = { introYear: 1990, capacity: 60, cargo: "PASS", refitClasses: ["passengers" as const], climates: ["temperate" as const] };

  it("asks the facts and presets of a vehicle OpenTTD can hold", () => {
    expect(() => checkOpenttdProperties(design(undefined), true, "road")).toThrow(/missing/);
    expect(() => checkOpenttdProperties(design({ ...facts, presets: [{}] }), true, "road")).not.toThrow();
    expect(() => checkOpenttdProperties(design({ ...facts, presets: [{}] }), true, "train")).toThrow(/railType/);
    expect(() => checkOpenttdProperties(design({ ...facts, railType: "RAIL", presets: [{}] }), true, "road")).toThrow(/not a train/);
    expect(() => checkOpenttdProperties(design({ ...facts, presets: [{}], capacity: undefined }), true, "road")).toThrow(/capacity/);
    expect(() => checkOpenttdProperties(design({ ...facts }), true, "road")).toThrow(/no presets/);
    expect(() => checkOpenttdProperties(design({ ...facts, presets: [{}] }), true, null)).toThrow(/OpenTTD can hold/);
  });

  it("refuses presets that are not real, offered, once, default first, never the whole train", () => {
    const check = (presets: Array<Record<string, string>>) => () => checkOpenttdProperties(design({ ...facts, presets }), true, "road");
    expect(check([{}, { unit: "b" }])).not.toThrow();
    expect(check([{ unit: "b" }, {}])).toThrow(/ahead of the default/);
    expect(check([{}, { unit: "a" }])).toThrow(/default/);
    expect(check([{}, { unit: "z" }])).toThrow(/does not resolve/);
    expect(check([{}, { unit: "b" }, { unit: "b" }])).toThrow(/twice/);
    expect(check([{}, { unit: "train" }])).toThrow(/whole articulated train/);
  });

  it("refuses formations of one car, of unknown cars or twice named", () => {
    const check = (formations: NonNullable<ProceduralDesign["openttd"]>["formations"]) => () =>
      checkOpenttdProperties(design({ ...facts, presets: [{}], formations }), true, "road");
    expect(check([{ name: "2 cars", cars: [{ params: {} }, { params: { unit: "b" }, turned: true }] }])).not.toThrow();
    expect(check([{ name: "1 car", cars: [{ params: {} }] }])).toThrow(/fewer than two/);
    expect(check([{ name: "x", cars: [{ params: {} }, { params: { unit: "z" } }] }])).toThrow(/does not resolve/);
    expect(check([{ name: "x", cars: [{ params: {} }, { params: { unit: "train" } }] }])).toThrow(/whole articulated train/);
    expect(check([{ name: "x", cars: [{ params: {} }, { params: {} }] }, { name: "x", cars: [{ params: {} }, { params: {} }] }])).toThrow(/two formations/);
  });
});

describe("the balance formula and the catalog's block", () => {
  it("grows costs with power, speed and capacity and goes by type for lives", () => {
    const loco = deriveBalance({ feature: "train", group: "loco", traction: "electric", power: 4000, speed: 140, capacity: 0 });
    expect(loco).toEqual({ costFactor: 148, runningCostFactor: 90, vehicleLife: 35, modelLife: 40, reliabilityDecay: 20 });
    const coach = deriveBalance({ feature: "train", group: "coach", power: 0, speed: 140, capacity: 60 });
    expect(coach.costFactor).toBeLessThan(loco.costFactor);
    expect(deriveBalance({ feature: "train", group: "loco", traction: "steam", power: 1500, speed: 100, capacity: 0 })).toMatchObject({ vehicleLife: 40, reliabilityDecay: 25 });
    expect(deriveBalance({ feature: "aircraft", group: "aircraft", power: 12000, speed: 1000, capacity: 555 }).costFactor).toBe(255);
    expect(deriveBalance({ feature: "road", group: "tram", power: 180, speed: 50, capacity: 130 }).vehicleLife).toBe(30);
  });

  it("resolves every field, and the variants whose figures differ", () => {
    const d = DESIGNS.get("proc-vehicle-cd-163")!;
    const o = catalogOpenttd(d, catalogFields(d))!;
    expect(o).toMatchObject({ introYear: 1984, vehicleLife: 40, railType: "ELRL", capacity: 0, cargo: "PASS", costFactor: 131, runningCostFactor: 80, modelLife: 40 });
    // the CD 362: its own year, and its lower power makes it cheaper
    expect(o.variants!.find((v) => v.params.livery === "cd362")).toMatchObject({ introYear: 1990, costFactor: 125 });
    expect(o.presets![0]).toEqual({});
    const bus = DESIGNS.get("proc-vehicle-karosa-short")!;
    const ob = catalogOpenttd(bus, catalogFields(bus))!;
    expect("railType" in ob).toBe(false);
    expect(ob.variants!.find((v) => v.params.variant === "lc735")).toMatchObject({ introYear: 1983, capacity: 47 });
    const tgv = DESIGNS.get("proc-vehicle-tgv-duplex")!;
    expect(catalogOpenttd(tgv, catalogFields(tgv))!.formations![0]!.cars.at(-1)).toEqual({ params: {}, turned: true });
  });
});

/** A catalog record for the one-click functions: the TGV Duplex's figures, as the build writes them. */
function duplexRecord(): CatalogRecord {
  const d = DESIGNS.get("proc-vehicle-tgv-duplex")!;
  const fields = catalogFields(d);
  return {
    id: d.id, title: d.title, category: fields.category, group: fields.group, traction: fields.traction, js: "x.js", thumb: "x.png",
    license: "CC0", author: "Rail Island", source: "Rail Island", thumbUrl: "", jsUrl: "", jsBytes: 1, jsGzipBytes: 1, thumbBytes: 1,
    triangles: 1, vertices: 3, primitives: 1, materials: 1, sizeX: 22, sizeY: 4, sizeZ: 3, references: [],
    params: d.params as CatalogRecord["params"], game: d.game as CatalogRecord["game"], openttd: catalogOpenttd(d, fields),
  } as CatalogRecord;
}

describe("the one-click items", () => {
  it("are the presets, the default first, then the formations, grouped under the default", () => {
    const r = duplexRecord();
    const items = oneClickItems(r);
    const presets = r.openttd!.presets!;
    expect(items).toHaveLength(presets.length + 1);
    expect(items[0]).toMatchObject({ key: {}, cars: [{ params: {} }] });
    expect(items[0]!.variantOf).toBeUndefined();
    expect(items.slice(1).every((i) => i.variantOf === 0)).toBe(true);
    expect(items.at(-1)).toMatchObject({ formation: "power cars, 8 trailers", key: { formation: "power cars, 8 trailers" } });
    expect(items.at(-1)!.cars).toHaveLength(10);
  });

  it("give a formation the head's figures, the cars' power and costs summed", () => {
    const r = duplexRecord();
    const { vehicle, cars } = resolveItem(oneClickItems(r).at(-1)!);
    expect(cars).toHaveLength(10);
    expect(vehicle.name).toBe("TGV Duplex (power cars, 8 trailers)");
    expect(vehicle.power).toBe(8800);
    expect(vehicle.traction).toBe("electric");
    expect(vehicle.costFactor).toBe(255);
    expect(cars.reduce((n, c) => n + c.capacity, 0)).toBe(2 * 60 + 5 * 70 + 30);
    expect(openttdFeature(r)).toBe("train");
  });

  it("name the OpenTTD view's list, and find the preset the page's parameters select", () => {
    const r = duplexRecord();
    const items = oneClickItems(r);
    const names = items.map((i) => resolveItem(i).vehicle.name);
    expect(names[0]).toBe("TGV Duplex");
    expect(names).toContain("TGV Duplex (Bar car R4)");
    expect(names.at(-1)).toBe("TGV Duplex (power cars, 8 trailers)");
    expect(new Set(names).size).toBe(names.length);
    expect(oneClickIndex(items, {})).toBe(0);
    expect(items[oneClickIndex(items, { livery: "ouigo" })]!.key).toEqual({ livery: "ouigo" });
    // a selection the pack does not hold, and never a formation by its key
    expect(oneClickIndex(items, { unit: "bar", livery: "ouigo" })).toBe(-1);
    expect(oneClickIndex(items, { formation: "power cars, 8 trailers" })).toBe(-1);
  });

  it("split a car's capacity over its parts", () => {
    expect(shares(70, 3)).toEqual([24, 23, 23]);
    expect(shares(0, 2)).toEqual([0, 0]);
    expect(shares(255 + 33, 4).reduce((a, b) => a + b, 0)).toBe(288);
  });
});

describe("the prerendered scenes", () => {
  const read = (s: string): Placement => JSON.parse(fs.readFileSync(path.join(SCENES, s, "placement.json"), "utf8")) as Placement;
  const linear = ["rail", "electric", "road", "tram"] as const;
  const names = [...linear.flatMap((k) => Array.from({ length: SCENE_SLOTS }, (_, i) => `${k}-${i + 1}`)), "harbour", "airport"];

  it("are the yards of 1..10 tracks of each kind, the harbour and the airport, and nothing else", () => {
    const dirs = fs.readdirSync(SCENES).filter((d) => fs.existsSync(path.join(SCENES, d, "placement.json")));
    expect(dirs.sort()).toEqual([...names].sort());
  });

  it("hold a placement and images of the sizes it names; a yard of k tracks holds k slots heading south-west", async () => {
    for (const s of names) {
      const p = read(s);
      expect(p).toMatchObject({ version: 2, scene: s, openttd: "13.4", opengfx: "7.1" });
      const k = /-(\d+)$/.exec(s);
      expect(p.slots.length).toBe(k ? Number(k[1]) : SCENE_SLOTS);
      expect(p.slots.map((sl) => sl.id)).toEqual(p.slots.map((_, i) => i));
      if (k) for (const sl of p.slots) expect([sl.direction, sl.maxLength]).toEqual([5, 256]);
      expect(p.sizes["4x"]).toEqual([p.sizes["1x"][0] * 4, p.sizes["1x"][1] * 4]);
      for (const zoom of ["1x", "4x"] as const) {
        for (const layer of ["background", "foreground"]) {
          const meta = await sharp(path.join(SCENES, s, `${layer}-${zoom}.png`)).metadata();
          expect([meta.width, meta.height], `${s} ${layer}-${zoom}`).toEqual(p.sizes[zoom]);
        }
        for (const slot of p.slots) {
          const [x, y] = slot.anchors[zoom];
          expect(x >= 0 && y >= 0 && x < p.sizes[zoom][0] && y < p.sizes[zoom][1], `${s} ${slot.id}`).toBe(true);
        }
      }
      for (const slot of p.slots) {
        // the 4x anchor is the normal one's, four times, to within the marker's pixel
        expect(Math.abs(slot.anchors["4x"][0] - 4 * slot.anchors["1x"][0])).toBeLessThan(4);
        expect(Math.abs(slot.anchors["4x"][1] - 4 * slot.anchors["1x"][1])).toBeLessThan(4);
      }
      if (k) {
        // slot 0 nearest the viewer: each next track one tile further back (32 px left, 16 up at 1x)
        for (const [i, sl] of p.slots.entries()) {
          if (!i) continue;
          const [x0, y0] = p.slots[i - 1]!.anchors["1x"];
          expect([x0 - sl.anchors["1x"][0], y0 - sl.anchors["1x"][1]]).toEqual([32, 16]);
        }
      }
    }
  });
});

describe("placeParts", () => {
  const slot: PlacementSlot = { id: 0, direction: 5, maxLength: 40, anchors: { "1x": [500, 300], "4x": [2000, 1200] } };

  it("puts a full-length head where the marker's sprite was anchored", () => {
    const [p] = placeParts("train", slot, "1x", [8], [[-10, -20]]);
    expect(p).toMatchObject({ part: 0, x: 490, y: 280 });
    const [q] = placeParts("train", slot, "4x", [8], [[-40, -80]]);
    expect(q).toMatchObject({ x: 1960, y: 1120 });
  });

  it("lines the parts up behind the head as OpenTTD does, and stops at the track's end", () => {
    const at = placeParts("train", slot, "1x", [8, 8, 8, 8, 8, 8], Array(6).fill([0, 0]));
    expect(at).toHaveLength(5); // 40 units of track
    // heading south-west the head is nearest the viewer: drawn last
    expect(at.at(-1)!.part).toBe(0);
    const byPart = [...at].sort((a, b) => a.part - b.part);
    // 8 units behind along x: 2 * 8 px to the right, 8 px up at normal zoom
    expect([byPart[1]!.x - byPart[0]!.x, byPart[1]!.y - byPart[0]!.y]).toEqual([16, -8]);
    // a shorter part: its position and its OpenTTD anchor move
    const [h6] = placeParts("train", slot, "1x", [6], [[0, 0]]).filter((p) => p.part === 0);
    const [ax6, ay6] = spriteAnchor("train", 5, 6);
    const [ax8, ay8] = spriteAnchor("train", 5, 8);
    const [hx, hy] = HEADINGS[5]!;
    const behind = Math.ceil(6 / 2) - 4; // the head's position lies 1 unit ahead of the marker's
    const sx = 2 * ((ay6 - ay8) - (ax6 - ax8)) + 2 * (-behind * hy - -behind * hx);
    expect(h6!.x - 500).toBe(sx);
  });

  it("keeps a ship or aircraft whole at its slot", () => {
    const ship: PlacementSlot = { ...slot, maxLength: 16 };
    expect(placeParts("ship", ship, "1x", [8], [[-5, -5]])).toEqual([{ part: 0, x: 495, y: 295, depth: -0 }]);
  });

  it("picks a vehicle's scene: its kind and the yard of exactly as many tracks", () => {
    expect(kindOf("train", "ELRL", false)).toBe("electric");
    expect(kindOf("train", "RAIL", false)).toBe("rail");
    expect(kindOf("road", "RAIL", true)).toBe("tram");
    expect(kindOf("aircraft", "RAIL", false)).toBe("airport");
    expect(sceneName("electric", 6)).toBe("electric-6");
    expect(sceneName("road", 14)).toBe("road-10");
    expect(sceneName("rail", 0)).toBe("rail-1");
    expect(sceneName("harbour", 3)).toBe("harbour");
  });

  it("puts a label ahead of a vehicle's nose, inside the scene, and crops the view to what is drawn", () => {
    const front = frontPoint("train", slot, "1x");
    // the front is 4 units ahead (south-west) of the 8/8 marker's position
    const [mx, my] = spriteAnchor("train", 5, 8);
    expect(front).toEqual([500 - 2 * (my - mx) - 8, 300 - (mx + my) + 4]);
    const r = labelRect("train", front, 100, 30, "1x", [1000, 600]);
    expect(r[0] + r[2]).toBe(Math.round(front[0] - 6));
    expect(r[1] + r[3] / 2).toBe(front[1]);
    expect(labelRect("train", [20, 590], 100, 30, "1x", [1000, 600])).toEqual([0, 570, 100, 30]);
    expect(viewRect([[100, 100, 50, 50], [300, 200, 10, 10]], "1x", [1000, 600])).toEqual([68, 68, 274, 174]);
    expect(viewRect([[10, 10, 50, 50]], "4x", [200, 200])).toEqual([0, 0, 188, 188]);
  });
});

describe("the prerender's markers", () => {
  it("tell slot, direction, part and copy by colour", () => {
    for (const [slot, dir, part, copy] of [[0, 0, 0, 0], [5, 7, 15, 4], [31, 3, 31, 2]] as const) {
      expect(readAnchor(...anchorRgb(slot, dir, part, copy))).toEqual({ slot, direction: dir, part, copy });
    }
    expect(readAnchor(255, 0, 255)).toBeNull();
    expect(readAnchor(60, 140, 30)).toBeNull();
  });

  it("draw the anchor's copies and leave holes at the neighbouring parts' anchors", () => {
    for (const dir of [3, 4, 5]) {
      const [img] = maskImages(2, 1, dir).filter((i) => i.zoom === GRF_ZOOM.normal);
      const at = (x: number, y: number) => [...img!.rgba.subarray((y * img!.width + x) * 4, (y * img!.width + x) * 4 + 4)];
      const ox = -MASK.left;
      const oy = -MASK.top;
      ANCHOR_COPIES.forEach(([cx, cy], c) => expect(at(ox + cx, oy + cy)).toEqual([...anchorRgb(2, dir, 1, c), 255]));
      const [hx, hy] = HEADINGS[dir]!;
      // the part ahead: 8 units forward
      const x = ox + 2 * (8 * hy - 8 * hx);
      const y = oy + (8 * hx + 8 * hy);
      if (x >= 0 && x < img!.width && y >= 0 && y < img!.height) expect(at(x, y)[3]).toBe(0);
    }
  });
});
