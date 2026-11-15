// The train parade (docs/site/train-parade.md): the list resolves against the
// real factory, a bad entry fails, cars are laid end to end, a turned car is
// drawn nose right, and trains.json matches what was written.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import type { ParamSpec } from "../generator/design.ts";
import type { Tri } from "../generator/glbTriangles.ts";
import { triBounds } from "../generator/glbTriangles.ts";
import { SIDE_MARGIN_M, SIDE_PX_PER_M } from "../generator/renderGlbThumb.ts";
import {
  SECTION_MAX_M, TRAIN_PARADE, carImageName, carSections, fleetStats, layOutTrain, modelVariants, resolveTrains,
  type TrainContext, type TrainSpec,
} from "../generator/trainParade.ts";
import { designGlb } from "../generator/generate.ts";
import { readTriangles, renderGlbSideThumb } from "../generator/renderGlbThumb.ts";
import { FACTORY_TRAIN_CONTEXT, renderSide, turnedRound, writeTrains } from "../generator/writeTrains.ts";

const LIVERY: ParamSpec = { name: "livery", title: "Livery", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }] };

const fixture: TrainContext = {
  model(id) {
    if (id === "loco") return { category: "Rail vehicles", params: [LIVERY] };
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
  isSideView: (c) => c === "Rail vehicles",
};

describe("train list", () => {
  it("resolves every train of the parade against the factory", () => {
    const trains = resolveTrains(TRAIN_PARADE, FACTORY_TRAIN_CONTEXT);
    expect(trains.length).toBeGreaterThanOrEqual(10);
    // a train is several cars, or one whole-train model (drawn in sections)
    for (const t of trains) expect(t.cars.length > 1 || t.cars[0]!.params.unit === "train").toBe(true);
  });

  it("expands a formation, keeps turned and drops default values", () => {
    const [t] = resolveTrains([{ id: "u", formation: { model: "unit", name: "3 cars" } }], fixture);
    expect(t!.cars).toEqual([
      { model: "unit", params: {}, turned: false },
      { model: "unit", params: { livery: "blue" }, turned: false },
      { model: "unit", params: {}, turned: true },
    ]);
    const [l] = resolveTrains([{ id: "l", cars: [{ model: "loco", params: { livery: "red" } }] }], fixture);
    expect(l!.cars[0]!.params).toEqual({});
  });

  const bad: [string, TrainSpec[], RegExp][] = [
    ["an unknown model", [{ id: "a", cars: [{ model: "nope" }] }], /no such model/],
    ["a workshop draft", [{ id: "a", cars: [{ model: "draft" }] }], /workshop draft/],
    ["a model with no side view", [{ id: "a", cars: [{ model: "house" }] }], /no side view/],
    ["an unknown parameter", [{ id: "a", cars: [{ model: "loco", params: { cab: "x" } }] }], /no parameter "cab"/],
    ["an unknown value", [{ id: "a", cars: [{ model: "loco", params: { livery: "green" } }] }], /no value "green"/],
    ["an unknown formation", [{ id: "a", formation: { model: "unit", name: "9 cars" } }], /no formation/],
    ["no cars", [{ id: "a", cars: [] }], /no cars/],
    ["a train listed twice", [{ id: "a", cars: [{ model: "loco" }] }, { id: "a", cars: [{ model: "loco" }] }], /listed twice/],
    ["a bad id", [{ id: "A b", cars: [{ model: "loco" }] }], /lower-case/],
  ];
  for (const [what, list, error] of bad) {
    it(`refuses ${what}`, () => expect(() => resolveTrains(list, fixture)).toThrow(error));
  }
});

describe("layout", () => {
  it("names a car's image from its values, sorted, and turned", () => {
    expect(carImageName({ model: "m", params: { b: "2", a: "1" }, turned: true })).toBe("m--a-1--b-2--turned.png");
    expect(carImageName({ model: "m", params: {}, turned: false })).toBe("m.png");
    expect(carImageName({ model: "m", params: {}, turned: false }, 2)).toBe("m--section-2.png");
  });

  it("lays cars end to end, couplers touching, images overlapping by the margins", () => {
    const cars = [
      { model: "a", params: {}, turned: false },
      { model: "b", params: {}, turned: false },
      { model: "a", params: {}, turned: true },
    ];
    const len: Record<string, number> = { a: 20, b: 26.4 };
    const placed = layOutTrain(cars, (c) => len[c.model]!, 0.3);
    expect(placed.map((c) => [c.offsetM, c.widthM, c.image])).toEqual([
      [-0.3, 20.6, "trains/a.png"],
      [19.7, 27, "trains/b.png"],
      [46.1, 20.6, "trains/a--turned.png"],
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
    const placed = layOutTrain(cars, (c) => len[c.model]!, 0.3);
    expect(placed.map((c) => [c.section, c.offsetM, c.widthM, c.image])).toEqual([
      [0, -0.3, 33.933, "trains/train--section-0.png"],
      [1, 33.033, 33.934, "trains/train--section-1.png"],
      [2, 66.367, 33.933, "trains/train--section-2.png"],
      [undefined, 99.7, 20.6, "trains/coach.png"],
    ]);
  });

  it("turns a car round about the vertical axis", () => {
    const tri: Tri = { p: [[1, 0, 0.5], [10, 0, 0.5], [10, 3, 0.5]], n: [[0, 0, -1], [0, 0, -1], [0, 0, -1]], color: [1, 1, 1], material: "m" };
    const [t] = turnedRound([tri]);
    expect(triBounds([t!])).toEqual({ min: [-10, 0, -0.5], max: [-1, 3, -0.5] });
    expect(t!.n[0]).toEqual([-0, 0, 1]);
  });
});

describe("fleet stats", () => {
  const spec = (name: string, n: number, extra: Partial<ParamSpec> = {}): ParamSpec =>
    ({ name, title: name, default: "0", values: Array.from({ length: n }, (_, i) => ({ value: String(i), title: String(i) })), ...extra });

  it("adds up distinct values, not combinations, leaving out the car count and preview fixtures", () => {
    expect(modelVariants()).toBe(1);
    expect(modelVariants([spec("livery", 4), spec("unit", 5)])).toBe(9);
    expect(modelVariants([spec("unit", 5), spec("cars", 7), spec("livery", 3)])).toBe(8);
    expect(modelVariants([spec("cars", 7)])).toBe(1);
    expect(modelVariants([spec("span", 4, { preview: true }), spec("livery", 2)])).toBe(2);
  });

  it("counts only confirmed rail vehicles", () => {
    const stats = fleetStats([
      { id: "a", category: "Rail vehicles", params: [spec("livery", 3)] },
      { id: "b", category: "Rail vehicles" },
      { id: "c", category: "Road vehicles", params: [spec("livery", 3)] },
      { id: "d", category: "Rail vehicles", params: [spec("livery", 9)] },
    ], (id) => id !== "d");
    expect(stats).toEqual({ models: 2, variants: 4 });
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

  it("renders each distinct car once and writes trains.json to match", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "trains-"));
    try {
      const list: TrainSpec[] = [{
        id: "pair",
        cars: [{ model: "proc-vehicle-cd-150" }, { model: "proc-vehicle-cd-150", turned: true }, { model: "proc-vehicle-cd-150" }],
      }];
      const file = writeTrains(list, dir);
      expect(file.pxPerM).toBe(SIDE_PX_PER_M);
      expect(file.stats.models).toBeGreaterThan(100);
      expect(file.stats.variants).toBeGreaterThan(file.stats.models);
      const written = JSON.parse(fs.readFileSync(path.join(dir, "trains.json"), "utf8"));
      expect(written).toEqual(file);
      expect(fs.readdirSync(path.join(dir, "trains")).sort()).toEqual(["proc-vehicle-cd-150--turned.png", "proc-vehicle-cd-150.png"]);
      const [a, b, c] = file.trains[0]!.cars;
      expect(a!.offsetM).toBe(-SIDE_MARGIN_M);
      expect(b!.offsetM).toBeCloseTo(a!.offsetM + a!.widthM - 2 * SIDE_MARGIN_M, 3);
      expect(c!.offsetM).toBeCloseTo(b!.offsetM + b!.widthM - 2 * SIDE_MARGIN_M, 3);
      expect(file.trains[0]!.lengthM).toBeCloseTo(3 * (a!.widthM - 2 * SIDE_MARGIN_M), 3);
      // each image is the car at the parade's scale
      for (const car of [a!, b!]) {
        const png = PNG.sync.read(fs.readFileSync(path.join(dir, car.image)));
        expect(png.width).toBe(Math.round(car.widthM * SIDE_PX_PER_M));
        expect(png.height).toBe(Math.round(file.heightM * SIDE_PX_PER_M));
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
