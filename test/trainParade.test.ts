// The train parade (docs/site/train-parade.md): the list resolves against the
// real factory, a bad entry fails, cars are laid end to end, a turned car is
// drawn nose right, moving parts become sprites, the fleet is counted, the images
// are reused while nothing changed, and trains.json matches what was written.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { ParamSpec } from "../generator/design.ts";
import { designGlb } from "../generator/generate.ts";
import type { Tri } from "../generator/glbTriangles.ts";
import { triBounds } from "../generator/glbTriangles.ts";
import { SIDE_MARGIN_M, SIDE_PX_PER_M, readTriangles, renderGlbSideThumb } from "../generator/renderGlbThumb.ts";
import {
  SECTION_MAX_M, TRAIN_PARADE, VEHICLE_TYPES, carImageBase, carSections, fleetCounts, fleetStats, layOutTrain, modelVariants, resolveTrains,
  trainGround, vehicleType, type CarImages, type TrainContext, type TrainSpec,
} from "../generator/trainParade.ts";
import { FACTORY_TRAIN_CONTEXT, changedMask, changedRect, renderCar, renderSide, spriteCycle, turnedRound, writeTrains } from "../generator/writeTrains.ts";

const LIVERY: ParamSpec = { name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] };

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
  it("resolves all thirty trains of the parade against the factory", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT);
    expect(trains.length).toBe(30);
    expect(trains.filter((t) => t.ground === "road").map((t) => t.id).sort()).toEqual(["curitiba-biarticulado", "ikarus-280", "new-routemaster", "stagecoach"]);
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
      [-0.3, 20.6, "trains/a.webp"],
      [19.7, 27, "trains/b.webp"],
      [46.1, 20.6, "trains/a-t.webp"],
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
      [0, -0.3, 33.933, "trains/train--section-0.webp"],
      [1, 33.033, 33.934, "trains/train--section-1.webp"],
      [2, 66.367, 33.933, "trains/train--section-2.webp"],
      [undefined, 99.7, 20.6, "trains/coach.webp"],
    ]);
  });

  it("places an animated car's sprite in metres over its image", () => {
    const [car] = layOutTrain(
      [{ model: "loco", params: {}, turned: false }],
      () => ({ lengthM: 20, images: ["loco.webp"], sprites: [{ image: "loco--frames.webp", x: 64, y: 96, w: 320, h: 64, pitch: 68 }], frames: 12, cycleM: 5.75 }),
      0.3,
      32,
    );
    expect(car!.sprite).toEqual({ image: "trains/loco--frames.webp", xM: 2, yM: 3, widthM: 10, heightM: 2, pitchM: 2.125, frames: 12, cycleM: 5.75 });
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

  it("keeps the first caption's rail-only counts", () => {
    const stats = fleetStats([
      { id: "a", category: "Rail vehicles", group: "loco", params: [spec("livery", 3)] },
      { id: "b", category: "Rail vehicles", group: "tram" },
      { id: "c", category: "Road vehicles", group: "bus", params: [spec("livery", 3)] },
    ], () => true);
    expect(stats).toEqual({ models: 2, variants: 4 });
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

describe("writeTrains", () => {
  it("draws a car exactly as the side thumbnail does", () => {
    const glb = designGlb("proc-vehicle-cd-150");
    const thumb = renderGlbSideThumb(glb).png;
    const own = renderSide(readTriangles(glb));
    expect([own.width, own.height]).toEqual([thumb.width, thumb.height]);
    expect(Buffer.from(own.data).equals(Buffer.from(thumb.data))).toBe(true);
  });

  it("renders each distinct car once, animates its wheels, reuses it next time and writes trains.json to match", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trains-"));
    try {
      const list: TrainSpec[] = [{
        id: "pair",
        cars: [{ model: "proc-vehicle-cd-150" }, { model: "proc-vehicle-cd-150", turned: true }, { model: "proc-vehicle-cd-150" }],
      }];
      const first = await writeTrains(list, dir);
      const file = first.file;
      expect([first.rendered, first.reused]).toEqual([2, 0]);
      expect(file.pxPerM).toBe(SIDE_PX_PER_M);
      expect(file.fleet.types.trains).toBeGreaterThan(100);
      expect(file.fleet.variants).toBeGreaterThan(Object.values(file.fleet.types).reduce((a, b) => a + b, 0));
      expect(JSON.parse(fs.readFileSync(path.join(dir, "trains.json"), "utf8"))).toEqual(file);
      // two cars, each a still image and a sprite of its spoked wheels
      expect(fs.readdirSync(path.join(dir, "trains")).length).toBe(4);
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
      // nothing changed: nothing is rendered again, and the file is the same
      const second = await writeTrains(list, dir);
      expect([second.rendered, second.reused]).toEqual([0, 2]);
      expect(second.file).toEqual(file);
      // a car no train uses any more is deleted
      await writeTrains([{ id: "one", cars: [{ model: "proc-vehicle-cd-150" }] }], dir);
      expect(fs.readdirSync(path.join(dir, "trains")).length).toBe(2);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
