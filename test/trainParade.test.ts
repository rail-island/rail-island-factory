// The train parade (docs/site/train-parade.md): the list resolves against the
// real factory, a bad entry fails, cars are laid end to end, a turned car is
// drawn nose right, moving parts become sprites, the fleet is counted, the images
// are reused while nothing changed, parade.json matches what was written, the
// play order spreads the categories, and the overview page lists every chain.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { ParamSpec } from "../generator/design.ts";
import { DESIGNS, designGlb } from "../generator/generate.ts";
import type { Tri } from "../generator/glbTriangles.ts";
import { triBounds } from "../generator/glbTriangles.ts";
import { SIDE_MARGIN_M, SIDE_PX_PER_M, readTriangles, renderGlbSideThumb } from "../generator/renderGlbThumb.ts";
import {
  SECTION_MAX_M, TRAIN_PARADE, VEHICLE_TYPES, carImageBase, carSections, fleetCounts, layOutTrain, modelVariants, resolveTrains,
  trainGround, trainCategory, trainWire, playOrder, PARADE_OPENING, PARADE_SPEED_MPS, vehicleType, PARADE_IMAGE_DIR, TRAIN_CATEGORIES, type CarImages, type TrainContext, type TrainSpec,
} from "../generator/trainParade.ts";
import { RAIL_COLLECTOR_TOP, TRAM_COLLECTOR_TOP } from "../generator/collector.ts";
import { FACTORY_TRAIN_CONTEXT, carEmitters, changedMask, changedRect, renderCar, renderSide, spriteCycle, turnedRound, writeParade } from "../generator/writeParade.ts";
import { paradePage } from "../generator/paradePage.ts";

const LIVERY: ParamSpec = { name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] };

// a seeded random, so a failure repeats
const seeded = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const fixture: TrainContext = {
  model(id) {
    if (id === "loco") return { category: "Rail vehicles", params: [LIVERY] };
    if (id === "bus") return { category: "Road vehicles" };
    if (id === "unit") {
      return {
        category: "Rail vehicles",
        openttd: { formations: [{ name: "3 cars", cars: [{ params: {} }, { params: { livery: "blue" } }, { params: {}, turned: true }] }] },
        params: [LIVERY],
      } as ReturnType<TrainContext["model"]>;
    }
    if (id === "draft") return { category: "Rail vehicles" };
    if (id === "house") return { category: "Village" };
    return undefined;
  },
  confirmed: (id) => id !== "draft",
  isSideView: (c) => c === "Rail vehicles" || c === "Road vehicles",
};

describe("train list", () => {
  it("resolves all hundred trains of the parade against the factory", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT);
    expect(trains.length).toBe(100);
    expect(trains.filter((t) => t.ground === "road").map((t) => t.id).sort()).toEqual([
      "bristol-lodekka", "cistern-semi-truck", "curitiba-biarticulado", "gm-scenicruiser", "ikarus-280", "karosa-sm11", "mb-o345-g",
      "mercedes-atego", "neoplan-skyliner", "new-routemaster", "paris-omnibus", "praga-rv", "skoda-706-rto", "stagecoach", "tatra-815-tipper",
    ]);
  });

  it("aims at the spec's mix of categories", () => {
    const count: Record<string, number> = {};
    for (const t of resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT)) count[t.category] = (count[t.category] ?? 0) + 1;
    expect(count).toEqual({ electricUnit: 22, electricLoco: 16, dieselLoco: 12, dieselUnit: 8, steamLoco: 14, tram: 8, metro: 3, bus: 9, horse: 4, truck: 4 });
  });

  it("gives every chain its category's speed and a wire only where it runs under one", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT);
    for (const t of trains) expect(t.speedMps).toBe(PARADE_SPEED_MPS[t.category]);
    const wire = (id: string) => trains.find((t) => t.id === id)!.wireM;
    expect(wire("db-ice3")).toBe(RAIL_COLLECTOR_TOP);
    expect(wire("cd-150-express")).toBe(RAIL_COLLECTOR_TOP);
    expect(wire("pcc-streamliner")).toBe(TRAM_COLLECTOR_TOP);
    for (const id of ["metro-81-71", "nyc-r160", "horse-tram", "csd-498-1-express", "br-hst", "us-freight", "ikarus-280", "praga-rv"]) expect(wire(id)).toBeUndefined();
    for (const t of trains) if (t.category === "electricUnit" || t.category === "electricLoco") expect(t.wireM).toBe(RAIL_COLLECTOR_TOP);
  });

  it("expands a formation, alone or inside a car list, keeps turned and drops default values", () => {
    const [t] = resolveTrains([{ id: "u", formation: { model: "unit", name: "3 cars" } }], fixture);
    expect(t!.cars).toEqual([
      { model: "unit", params: {}, turned: false },
      { model: "unit", params: { livery: "blue" }, turned: false },
      { model: "unit", params: {}, turned: true },
    ]);
    const [m] = resolveTrains([{ id: "m", cars: [{ model: "loco" }, { formation: { model: "unit", name: "3 cars" } }] }], fixture);
    expect(m!.cars.map((c) => c.model)).toEqual(["loco", "unit", "unit", "unit"]);
    const [l] = resolveTrains([{ id: "l", cars: [{ model: "loco", params: { livery: "red" } }] }], fixture);
    expect(l!.cars[0]!.params).toEqual({});
  });

  it("runs a train on the road only when every car is a road vehicle", () => {
    expect(resolveTrains([{ id: "b", cars: [{ model: "bus" }] }], fixture)[0]!.ground).toBe("road");
    expect(resolveTrains([{ id: "m", cars: [{ model: "bus" }, { model: "loco" }] }], fixture)[0]!.ground).toBe("rail");
    expect(trainGround([])).toBe("rail");
  });

  const bad: [string, TrainSpec[], RegExp][] = [
    ["an unknown model", [{ id: "a", cars: [{ model: "nope" }] }], /no such model/],
    ["a workshop draft", [{ id: "a", cars: [{ model: "draft" }] }], /workshop draft/],
    ["a model with no side view", [{ id: "a", cars: [{ model: "house" }] }], /no side view/],
    ["an unknown parameter", [{ id: "a", cars: [{ model: "loco", params: { cab: "x" } }] }], /no parameter "cab"/],
    ["an unknown value", [{ id: "a", cars: [{ model: "loco", params: { livery: "green" } }] }], /no value "green"/],
    ["an unknown formation", [{ id: "a", formation: { model: "unit", name: "9 cars" } }], /no formation/],
    ["an unknown formation in a car list", [{ id: "a", cars: [{ formation: { model: "loco", name: "x" } }] }], /no formation/],
    ["no cars", [{ id: "a", cars: [] }], /no cars/],
    ["a train listed twice", [{ id: "a", cars: [{ model: "loco" }] }, { id: "a", cars: [{ model: "loco" }] }], /listed twice/],
    ["a bad id", [{ id: "A b", cars: [{ model: "loco" }] }], /lower-case/],
  ];
  for (const [what, list, error] of bad) {
    it(`refuses ${what}`, () => expect(() => resolveTrains(list, fixture)).toThrow(error));
  }
});

describe("layout", () => {
  const still = (lengthM: number, base: string): CarImages => ({ lengthM, images: carSections(lengthM).map((_, i, all) => `${base}${all.length > 1 ? `--section-${i}` : ""}.webp`) });

  it("names a car's image from its values, sorted, turned and section", () => {
    expect(carImageBase({ model: "m", params: { b: "2", a: "1" }, turned: true })).toBe("m--a-1--b-2--turned");
    expect(carImageBase({ model: "m", params: {}, turned: false })).toBe("m");
    expect(carImageBase({ model: "m", params: {}, turned: false }, 2)).toBe("m--section-2");
  });

  it("lays cars end to end, couplers touching, images overlapping by the margins", () => {
    const cars = [
      { model: "a", params: {}, turned: false },
      { model: "b", params: {}, turned: false },
      { model: "a", params: {}, turned: true },
    ];
    const len: Record<string, number> = { a: 20, b: 26.4 };
    const placed = layOutTrain(cars, (c) => still(len[c.model]!, c.model + (c.turned ? "-t" : "")), 0.3, 32);
    expect(placed.map((c) => [c.offsetM, c.widthM, c.image])).toEqual([
      [-0.3, 20.6, `${PARADE_IMAGE_DIR}/a.webp`],
      [19.7, 27, `${PARADE_IMAGE_DIR}/b.webp`],
      [46.1, 20.6, `${PARADE_IMAGE_DIR}/a-t.webp`],
    ]);
  });

  it("cuts a car longer than SECTION_MAX_M into equal sections that cover it", () => {
    expect(carSections(26.4)).toEqual([[0, 26.4]]);
    expect(carSections(SECTION_MAX_M)).toEqual([[0, SECTION_MAX_M]]);
    const s = carSections(162.79);
    expect(s.length).toBe(5);
    expect(s[0]![0]).toBe(0);
    expect(s[s.length - 1]![1]).toBe(162.79);
    for (let i = 1; i < s.length; i++) expect(s[i]![0]).toBe(s[i - 1]![1]);
    for (const [a, b] of s) expect(b - a).toBeLessThanOrEqual(SECTION_MAX_M);
  });

  it("places a long car's sections one after another, then the next car", () => {
    const cars = [{ model: "train", params: {}, turned: false }, { model: "coach", params: {}, turned: false }];
    const len: Record<string, number> = { train: 100, coach: 20 };
    const placed = layOutTrain(cars, (c) => still(len[c.model]!, c.model), 0.3, 32);
    expect(placed.map((c) => [c.section, c.offsetM, c.widthM, c.image])).toEqual([
      [0, -0.3, 33.933, `${PARADE_IMAGE_DIR}/train--section-0.webp`],
      [1, 33.033, 33.934, `${PARADE_IMAGE_DIR}/train--section-1.webp`],
      [2, 66.367, 33.933, `${PARADE_IMAGE_DIR}/train--section-2.webp`],
      [undefined, 99.7, 20.6, `${PARADE_IMAGE_DIR}/coach.webp`],
    ]);
  });

  it("places an animated car's sprite in metres over its image", () => {
    const [car] = layOutTrain(
      [{ model: "loco", params: {}, turned: false }],
      () => ({ lengthM: 20, images: ["loco.webp"], sprites: [{ image: "loco--frames.webp", x: 64, y: 96, w: 320, h: 64, pitch: 68 }], frames: 12, cycleM: 5.75 }),
      0.3,
      32,
    );
    expect(car!.sprite).toEqual({ image: `${PARADE_IMAGE_DIR}/loco--frames.webp`, xM: 2, yM: 3, widthM: 10, heightM: 2, pitchM: 2.125, frames: 12, cycleM: 5.75 });
  });

  it("places a car's smoke mouths on its image, turned with it and in the section they stand in", () => {
    const at = (x: number, y: number) => ({ kind: "smoke" as const, at: [x, y, 0] as [number, number, number] });
    // a 10 m car from x = -5 to 5, drawn whole: its nose (x = 5) at the image's left margin
    const [whole] = carEmitters([at(3, 4.5), { kind: "steam", at: [0, 4, 0] }], false, "steam", 5, [[0, 10]]);
    expect(whole).toEqual([{ kind: "steam", xM: SIDE_MARGIN_M + 2, yM: 6 - 4.5 }]);
    // turned: the mouth at x = 3 is now at -3, 8 m behind the nose
    const [turned] = carEmitters([at(3, 4.5)], true, "diesel", 5, [[0, 10]]);
    expect(turned).toEqual([{ kind: "diesel", xM: SIDE_MARGIN_M + 8, yM: 1.5 }]);
    // a 60 m car in two sections of 30 m: a mouth 40 m behind the nose is 10 m into the second image
    const parts = carEmitters([at(-10, 4)], false, "diesel", 30, [[0, 30], [30, 60]]);
    expect(parts).toEqual([[], [{ kind: "diesel", xM: SIDE_MARGIN_M + 10, yM: 2 }]]);
    // only steam and diesel vehicles smoke: not a caboose's stove pipe, not an electric
    expect(carEmitters([at(3, 4.5)], false, undefined, 5, [[0, 10]])).toEqual([[]]);
    expect(carEmitters([at(3, 4.5)], false, "electric", 5, [[0, 10]])).toEqual([[]]);
  });

  it("finds a steam locomotive's chimney near the top of its image, towards the nose", () => {
    const design = DESIGNS.get("proc-vehicle-lner-a4")!;
    const model = design.build({});
    const tris = readTriangles(designGlb("proc-vehicle-lner-a4"));
    const { min, max } = triBounds(tris);
    const [em] = carEmitters(model.emitters(), false, design.catalog?.traction, max[0], carSections(max[0] - min[0]));
    expect(em!.length).toBeGreaterThan(0);
    for (const e of em!) {
      expect(e.kind).toBe("steam");
      expect(e.yM).toBeGreaterThan(0);
      expect(e.yM).toBeLessThan(2.5);
      expect(e.xM).toBeLessThan((max[0] - min[0]) / 2);
    }
  });

  it("turns a car round about the vertical axis", () => {
    const tri: Tri = { p: [[1, 0, 0.5], [10, 0, 0.5], [10, 3, 0.5]], n: [[0, 0, -1], [0, 0, -1], [0, 0, -1]], color: [1, 1, 1], material: "m" };
    const [t] = turnedRound([tri]);
    expect(triBounds([t!])).toEqual({ min: [-10, 0, -0.5], max: [-1, 3, -0.5] });
    expect(t!.n[0]).toEqual([-0, 0, 1]);
  });
});

describe("animation", () => {
  it("loops a sprite over one cycle, or over the cycles that come round together", () => {
    expect(spriteCycle([])).toBeNull();
    expect(spriteCycle([{ cycleM: 5.75 }])).toEqual({ cycleM: 5.75, frames: 12 });
    // a stride half a wheel turn: one wheel turn holds two strides, eight frames each
    expect(spriteCycle([{ cycleM: 4.8 }, { cycleM: 2.4 }])).toEqual({ cycleM: 4.8, frames: 16 });
    // cycles that never meet: the longest one
    expect(spriteCycle([{ cycleM: 2.7 }, { cycleM: 2.4 }])?.cycleM).toBe(2.7);
  });

  it("finds the rectangle the frames change in, a pixel wider each way", () => {
    const frame = (dot?: [number, number]) => {
      const p = new PNG({ width: 10, height: 8 });
      p.data.fill(0);
      if (dot) p.data.fill(255, (dot[1] * 10 + dot[0]) * 4, (dot[1] * 10 + dot[0]) * 4 + 4);
      return p;
    };
    expect(changedRect([frame(), frame()])).toBeNull();
    expect(changedRect([frame(), frame([3, 4]), frame([6, 5])])).toEqual({ x: 2, y: 3, w: 6, h: 4 });
    expect(changedRect([frame(), frame([0, 0])])).toEqual({ x: 0, y: 0, w: 2, h: 2 });
  });

  // Regression: clearing the whole rectangle from the still image left a seam at its
  // edge that flickered as the train moved; only the moving pixels are cleared now.
  it("marks only the pixels that move, a pixel wider each way", () => {
    const frame = (dot?: [number, number]) => {
      const p = new PNG({ width: 10, height: 8 });
      p.data.fill(0);
      if (dot) p.data.fill(255, (dot[1] * 10 + dot[0]) * 4, (dot[1] * 10 + dot[0]) * 4 + 4);
      return p;
    };
    const mask = changedMask([frame(), frame([3, 4]), frame([6, 5])]);
    const marked = [...mask.keys()].filter((i) => mask[i]).map((i) => [i % 10, Math.floor(i / 10)]);
    expect(marked.length).toBe(18);
    expect(marked).toContainEqual([2, 3]);
    expect(marked).toContainEqual([7, 6]);
    // inside the changed rectangle, but away from both moving pixels: kept
    expect(mask[3 * 10 + 7]).toBe(0);
    expect(mask[6 * 10 + 2]).toBe(0);
  });
});

describe("fleet counts", () => {
  const spec = (name: string, n: number, extra: Partial<ParamSpec> = {}): ParamSpec =>
    ({ name, title: name, default: "0", values: Array.from({ length: n }, (_, i) => ({ value: String(i), title: String(i) })), ...extra });

  it("adds up distinct values, not combinations, leaving out the car count and preview fixtures", () => {
    expect(modelVariants()).toBe(1);
    expect(modelVariants([spec("livery", 4), spec("unit", 5)])).toBe(9);
    expect(modelVariants([spec("unit", 5), spec("cars", 7), spec("livery", 3)])).toBe(8);
    expect(modelVariants([spec("cars", 7)])).toBe(1);
    expect(modelVariants([spec("span", 4, { preview: true }), spec("livery", 2)])).toBe(2);
  });

  it("puts every vehicle in exactly one kind, horse-drawn ones apart", () => {
    expect(vehicleType("Rail vehicles", "loco", "steam")).toBe("trains");
    expect(vehicleType("Rail vehicles", "metro")).toBe("trains");
    expect(vehicleType("Rail vehicles", "tram", "electric")).toBe("trams");
    expect(vehicleType("Rail vehicles", "tram", "animal")).toBe("horseDrawn");
    expect(vehicleType("Rail vehicles", "coach", "animal")).toBe("horseDrawn");
    expect(vehicleType("Road vehicles", "bus")).toBe("buses");
    expect(vehicleType("Road vehicles", "bus", "animal")).toBe("horseDrawn");
    expect(vehicleType("Road vehicles", "truck")).toBe("trucks");
    expect(vehicleType("Ships", "ship")).toBe("ships");
    expect(vehicleType("Aircraft", "aircraft")).toBe("aircraft");
    expect(vehicleType("Cable car", "cabin")).toBe("cableCars");
    expect(vehicleType("Village", "village")).toBeUndefined();
  });

  it("counts the confirmed vehicles of every kind and all their variants", () => {
    const counts = fleetCounts([
      { id: "a", category: "Rail vehicles", group: "loco", params: [spec("livery", 3)] },
      { id: "b", category: "Rail vehicles", group: "tram" },
      { id: "c", category: "Road vehicles", group: "bus", traction: "animal", params: [spec("animal", 6), spec("team", 5)] },
      { id: "d", category: "Rail vehicles", group: "loco", params: [spec("livery", 9)] },
      { id: "e", category: "Village", group: "village", params: [spec("roof", 9)] },
    ], (id) => id !== "d");
    expect(counts.types).toEqual({ trains: 1, trams: 1, buses: 0, trucks: 0, horseDrawn: 1, ships: 0, aircraft: 0, cableCars: 0 });
    expect(Object.keys(counts.types)).toEqual([...VEHICLE_TYPES]);
    expect(counts.variants).toBe(3 + 1 + 11);
  });
});

describe("renderCar", () => {
  // Regression: the still image was frame 0 itself, so clearing its moving pixels
  // emptied the sprite's first frame - every animated car blinked once per cycle.
  it("draws every frame of an animated car whole: still and sprite frame together are the car", async () => {
    const car = { model: "proc-vehicle-csd-498-1", params: {}, turned: false };
    const r = await renderCar(car, () => "loco");
    const sp = r.sprites![0]!;
    const decode = async (name: string) => {
      const { data, info } = await sharp(r.files.find((f) => f.name === name)!.bytes).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height };
    };
    const still = await decode(r.images[0]!);
    const sheet = await decode(sp.image);
    const rest = renderSide(readTriangles(designGlb(car.model)));
    expect([still.width, still.height]).toEqual([rest.width, rest.height]);
    expect(sp.pitch).toBeGreaterThan(sp.h);
    expect(sheet.height).toBe(sp.pitch * r.frames! - (sp.pitch - sp.h));
    // the gap between frames is transparent
    for (let col = 0; col < sp.w; col++) expect(sheet.data[((sp.h + 1) * sp.w + col) * 4 + 3]).toBe(0);
    // frame 0 over the still, compared with the car drawn at rest
    let missing = 0;
    let opaque = 0;
    for (let row = 0; row < sp.h; row++) {
      for (let col = 0; col < sp.w; col++) {
        const i = ((sp.y + row) * rest.width + (sp.x + col)) * 4;
        const a = sheet.data[(row * sp.w + col) * 4 + 3]! / 255;
        const covered = a + (still.data[i + 3]! / 255) * (1 - a);
        if (rest.data[i + 3] === 255) {
          opaque++;
          if (covered < 0.9) missing++;
        }
      }
    }
    expect(opaque).toBeGreaterThan(1000);
    expect(missing).toBe(0);
  });
});

describe("categories and play order", () => {
  it("derives a chain's category from its lead vehicle", () => {
    expect(trainCategory({ category: "Rail vehicles", group: "unit", traction: "electric" })).toBe("electricUnit");
    expect(trainCategory({ category: "Rail vehicles", group: "unit", traction: "diesel" })).toBe("dieselUnit");
    expect(trainCategory({ category: "Rail vehicles", group: "loco", traction: "electric" })).toBe("electricLoco");
    expect(trainCategory({ category: "Rail vehicles", group: "loco", traction: "diesel" })).toBe("dieselLoco");
    expect(trainCategory({ category: "Rail vehicles", group: "loco", traction: "steam" })).toBe("steamLoco");
    expect(trainCategory({ category: "Rail vehicles", group: "metro" })).toBe("metro");
    expect(trainCategory({ category: "Rail vehicles", group: "tram", traction: "electric" })).toBe("tram");
    expect(trainCategory({ category: "Road vehicles", group: "bus" })).toBe("bus");
    expect(trainCategory({ category: "Road vehicles", group: "truck" })).toBe("truck");
    expect(trainCategory({ category: "Rail vehicles", group: "tram", traction: "animal" })).toBe("horse");
    expect(trainCategory({ category: "Road vehicles", group: "bus", traction: "animal" })).toBe("horse");
  });

  it("hangs a wire over electric railway vehicles and trams only, from the first powered car", () => {
    const rail = (group: string, traction?: string) => ({ category: "Rail vehicles", group, ...(traction ? { traction } : {}) });
    expect(trainWire([rail("loco", "electric"), rail("coach")])).toBe(RAIL_COLLECTOR_TOP);
    expect(trainWire([rail("coach"), rail("unit", "electric")])).toBe(RAIL_COLLECTOR_TOP);
    expect(trainWire([rail("tram", "electric")])).toBe(TRAM_COLLECTOR_TOP);
    expect(trainWire([rail("tram", "animal")])).toBeUndefined();
    expect(trainWire([rail("tram", "cable")])).toBeUndefined();
    expect(trainWire([rail("metro", "electric")])).toBeUndefined();
    expect(trainWire([rail("loco", "diesel"), rail("unit", "electric")])).toBeUndefined();
    expect(trainWire([rail("coach")])).toBeUndefined();
    expect(trainWire([{ category: "Road vehicles", group: "bus", traction: "electric" }])).toBeUndefined();
  });

  it("has a speed for every category", () => {
    for (const k of Object.keys(TRAIN_CATEGORIES)) expect(PARADE_SPEED_MPS[k as keyof typeof PARADE_SPEED_MPS]).toBeGreaterThan(0);
  });

  it("gives every chain of the parade a known category, and the list states none it does not know", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT);
    for (const t of trains) expect(Object.keys(TRAIN_CATEGORIES)).toContain(t.category);
    expect(() => resolveTrains([{ id: "a", category: "rocket" as never, cars: [{ model: "loco" }] }], fixture)).toThrow(/no category/);
  });

  it("opens the first round with the set categories in order, no horse-drawn chain before the tenth", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT).map((t) => ({ id: t.id, category: t.category }));
    expect(PARADE_OPENING.categories).toEqual(["electricLoco", "steamLoco", "electricUnit", "dieselLoco", "dieselUnit"]);
    expect(PARADE_OPENING.notBefore).toEqual({ horse: 9 });
    const firsts = new Set<string>();
    for (let round = 0; round < 2000; round++) {
      const order = playOrder(trains, null, seeded(round + 11), PARADE_OPENING);
      expect(order.map((t) => t.id).sort()).toEqual(trains.map((t) => t.id).sort());
      expect(order.slice(0, 5).map((t) => t.category)).toEqual(PARADE_OPENING.categories);
      expect(order.findIndex((t) => t.category === "horse")).toBeGreaterThanOrEqual(9);
      for (let i = 1; i < order.length; i++) expect(order[i]!.category).not.toBe(order[i - 1]!.category);
      firsts.add(order[0]!.id);
    }
    // the opening chain is picked at random among its category
    expect(firsts.size).toBe(trains.filter((t) => t.category === "electricLoco").length);
  });

  it("skips an opening category the list lacks and still keeps a held-back one late", () => {
    const trains = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `a${i}`, category: "a" })),
      ...Array.from({ length: 6 }, (_, i) => ({ id: `b${i}`, category: "b" })),
      ...Array.from({ length: 3 }, (_, i) => ({ id: `h${i}`, category: "h" })),
    ];
    for (let round = 0; round < 300; round++) {
      const order = playOrder(trains, null, seeded(round + 3), { categories: ["b", "missing", "a"], notBefore: { h: 6 } });
      expect(order.slice(0, 2).map((t) => t.category)).toEqual(["b", "a"]);
      expect(order.findIndex((t) => t.category === "h")).toBeGreaterThanOrEqual(6);
      for (let i = 1; i < order.length; i++) expect(order[i]!.category).not.toBe(order[i - 1]!.category);
    }
  });

  it("plays every chain once per round, never two of one category in a row, across rounds too", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT).map((t) => ({ id: t.id, category: t.category }));
    let last: { id: string; category: string } | null = null;
    for (let round = 0; round < 2000; round++) {
      // the first round opens as PARADE_OPENING says; every later one is the plain spread
      const order: { id: string; category: string }[] = playOrder(trains, last, seeded(round + 1), round === 0 ? PARADE_OPENING : null);
      expect(order.map((t) => t.id).sort()).toEqual(trains.map((t) => t.id).sort());
      if (last) expect(order[0]!.category).not.toBe(last.category);
      for (let i = 1; i < order.length; i++) expect(order[i]!.category).not.toBe(order[i - 1]!.category);
      last = order[order.length - 1]!;
    }
  });

  it("spreads a category evenly over the round", () => {
    const trains = [
      ...Array.from({ length: 8 }, (_, i) => ({ id: `u${i}`, category: "unit" })),
      ...Array.from({ length: 24 }, (_, i) => ({ id: `o${i}`, category: `other${i % 8}` })),
    ];
    for (let round = 0; round < 200; round++) {
      const order = playOrder(trains, null, seeded(round + 7));
      const at = order.flatMap((t, i) => (t.category === "unit" ? [i] : []));
      // eight in thirty-two: one about every four, never bunched into one half
      expect(at.filter((i) => i < 16).length).toBeGreaterThanOrEqual(3);
      expect(at.filter((i) => i >= 16).length).toBeGreaterThanOrEqual(3);
      for (let k = 1; k < at.length; k++) expect(at[k]! - at[k - 1]!).toBeLessThanOrEqual(8);
    }
  });

  it("falls back to an order with neighbours of one category only when the list leaves no other", () => {
    const order = playOrder([{ id: "a", category: "x" }, { id: "b", category: "x" }], null, seeded(3));
    expect(order.map((t) => t.id).sort()).toEqual(["a", "b"]);
  });
});

describe("overview page", () => {
  const file = {
    version: 1 as const, pxPerM: 32, heightM: 6.3, bottomM: -0.3,
    fleet: { types: { trains: 2, trams: 0, buses: 0, trucks: 0, horseDrawn: 0, ships: 0, aircraft: 0, cableCars: 0 }, variants: 3 },
    opening: PARADE_OPENING,
    trains: [
      { id: "steam-<one>", ground: "rail" as const, category: "steamLoco" as const, speedMps: 16, lengthM: 20, cars: [] },
      { id: "unit-two", ground: "rail" as const, category: "electricUnit" as const, speedMps: 22, wireM: 5.88, lengthM: 40, cars: [] },
    ],
  };
  const html = paradePage(file);

  it("lists every chain with its id and a link that opens it alone on railisland.com", () => {
    expect(html).toContain('"unit-two"');
    expect(html).toContain("/?parade=");
    expect(html).toContain('<meta name="robots" content="noindex">');
    // the data cannot close its script element
    expect(html).not.toContain("steam-<one>");
    expect(html).toContain("steam-\\u003cone>");
  });

  it("offers list order, shuffle and sort by category", () => {
    for (const order of ["list", "shuffle", "category"]) expect(html).toContain(`data-order="${order}"`);
  });

  it("embeds a play order the browser can run", () => {
    const script = html.match(/const __name = \(f\) => f;\nconst playOrder = ([\s\S]*?);\nconst \{ file, categories, site \}/)![1]!;
    const run = new Function("const __name = (f) => f; return " + script)() as typeof playOrder;
    const order = run(file.trains, null, seeded(1));
    expect(order.map((t) => t.id).sort()).toEqual(["steam-<one>", "unit-two"]);
  });
});

describe("writeParade", () => {
  it("draws a car exactly as the side thumbnail does", () => {
    const glb = designGlb("proc-vehicle-cd-150");
    const thumb = renderGlbSideThumb(glb).png;
    const own = renderSide(readTriangles(glb));
    expect([own.width, own.height]).toEqual([thumb.width, thumb.height]);
    expect(Buffer.from(own.data).equals(Buffer.from(thumb.data))).toBe(true);
  });

  it("renders each distinct car once, animates its wheels, reuses it next time and writes parade.json and its overview page to match", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trains-"));
    try {
      const list: TrainSpec[] = [{
        id: "pair",
        cars: [{ model: "proc-vehicle-cd-150" }, { model: "proc-vehicle-cd-150", turned: true }, { model: "proc-vehicle-cd-150" }],
      }];
      const first = await writeParade(list, dir);
      const file = first.file;
      expect([first.rendered, first.reused]).toEqual([2, 0]);
      expect(file.pxPerM).toBe(SIDE_PX_PER_M);
      expect(file.fleet.types.trains).toBeGreaterThan(100);
      expect(file.fleet.variants).toBeGreaterThan(Object.values(file.fleet.types).reduce((a, b) => a + b, 0));
      expect(JSON.parse(fs.readFileSync(path.join(dir, "parade.json"), "utf8"))).toEqual(file);
      // two cars, each a still image and a sprite of its spoked wheels
      expect(fs.readdirSync(path.join(dir, "parade", "img")).length).toBe(4);
      const [a, b, c] = file.trains[0]!.cars;
      expect(a!.offsetM).toBe(-SIDE_MARGIN_M);
      expect(b!.offsetM).toBeCloseTo(a!.offsetM + a!.widthM - 2 * SIDE_MARGIN_M, 3);
      expect(c!.offsetM).toBeCloseTo(b!.offsetM + b!.widthM - 2 * SIDE_MARGIN_M, 3);
      expect(file.trains[0]!.lengthM).toBeCloseTo(3 * (a!.widthM - 2 * SIDE_MARGIN_M), 3);
      expect(file.trains[0]!.ground).toBe("rail");
      for (const car of [a!, b!]) {
        const img = await sharp(path.join(dir, car.image)).metadata();
        expect([img.format, img.width, img.height]).toEqual(["webp", Math.round(car.widthM * SIDE_PX_PER_M), Math.round(file.heightM * SIDE_PX_PER_M)]);
        const sp = car.sprite!;
        expect(sp.frames).toBeGreaterThanOrEqual(12);
        expect(sp.cycleM).toBeGreaterThan(0);
        const sheet = await sharp(path.join(dir, sp.image)).metadata();
        const h = Math.round(sp.heightM * SIDE_PX_PER_M);
        const pitch = Math.round(sp.pitchM * SIDE_PX_PER_M);
        expect([sheet.width, sheet.height]).toEqual([Math.round(sp.widthM * SIDE_PX_PER_M), pitch * sp.frames - (pitch - h)]);
        // the wheels are low on the car, inside its image
        expect(sp.yM + sp.heightM).toBeLessThanOrEqual(file.heightM);
        expect(sp.yM).toBeGreaterThan(file.heightM / 2);
      }
      // the overview page sits beside it and lists the chain
      expect(fs.readFileSync(path.join(dir, "parade", "index.html"), "utf8")).toContain('"pair"');
      expect(file.trains[0]!.category).toBe("electricLoco");
      expect(file.trains[0]!.speedMps).toBe(PARADE_SPEED_MPS.electricLoco);
      expect(file.opening).toEqual(PARADE_OPENING);
      expect(file.trains[0]!.wireM).toBe(RAIL_COLLECTOR_TOP);
      // an electric locomotive has no exhaust
      expect(file.trains[0]!.cars.some((c) => c.emitters)).toBe(false);
      // nothing changed: nothing is rendered again, and the file is the same
      const second = await writeParade(list, dir);
      expect([second.rendered, second.reused]).toEqual([0, 2]);
      expect(second.file).toEqual(file);
      // a car no train uses any more is deleted
      await writeParade([{ id: "one", cars: [{ model: "proc-vehicle-cd-150" }] }], dir);
      expect(fs.readdirSync(path.join(dir, "parade", "img")).length).toBe(2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
