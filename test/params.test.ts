// Parametric models (generator/design.ts): enum parameters with defaults. The
// export builds the defaults; every combination must build as cleanly, and the
// standalone JS model must build any of them exactly as the generator does.

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { coverageCombinations, paramCombinations, resolveParams, type ParamSpec } from "../generator/design";
import { exportVehicleMeta, metaEntry } from "../generator/catalog";
import { VEHICLES } from "../generator/vehicles";

const SPECS: ParamSpec[] = [
  { name: "variant", title: "Variant", default: "b", values: [{ value: "a", title: "A" }, { value: "b", title: "B" }] },
  { name: "roof", title: "Roof", default: "flat", values: [{ value: "flat", title: "Flat" }, { value: "hip", title: "Hip" }, { value: "dome", title: "Dome" }] },
];

const PARAMETRIC = [...DESIGNS.values()].filter((d) => d.params?.length);

describe("parametric models", () => {
  it("resolve missing parameters to their defaults and reject unknown names and values", () => {
    expect(resolveParams(SPECS)).toEqual({ variant: "b", roof: "flat" });
    expect(resolveParams(SPECS, { roof: "dome" })).toEqual({ variant: "b", roof: "dome" });
    expect(() => resolveParams(SPECS, { colour: "red" })).toThrow(/unknown parameter "colour"/);
    expect(() => resolveParams(SPECS, { roof: "spire" })).toThrow(/no value "spire"/);
  });

  it("enumerate every combination, the defaults first", () => {
    const all = paramCombinations(SPECS);
    expect(all).toHaveLength(6);
    expect(all[0]).toEqual({ variant: "b", roof: "flat" });
    expect(new Set(all.map((c) => JSON.stringify(c))).size).toBe(6);
    expect(paramCombinations()).toEqual([{}]);
  });

  it("cover every shape combination and each finish value once", () => {
    const finishSpecs: ParamSpec[] = [...SPECS, { name: "colour", title: "Colour", default: "red", values: [{ value: "red", title: "Red" }, { value: "blue", title: "Blue" }, { value: "green", title: "Green" }] }];
    const all = coverageCombinations(finishSpecs, ["colour"]);
    // 6 shapes in red, then blue and green on the default shape
    expect(all).toHaveLength(8);
    expect(all[0]).toEqual({ variant: "b", roof: "flat", colour: "red" });
    expect(all.slice(6)).toEqual([{ variant: "b", roof: "flat", colour: "blue" }, { variant: "b", roof: "flat", colour: "green" }]);
    expect(coverageCombinations(SPECS)).toEqual(paramCombinations(SPECS));
  });

  it("declare valid enums: unique names and values, titles, a listed default", () => {
    expect(PARAMETRIC.length).toBeGreaterThan(0);
    for (const d of PARAMETRIC) {
      const names = d.params!.map((p) => p.name);
      expect(new Set(names).size).toBe(names.length);
      for (const p of d.params!) {
        expect(p.name).toMatch(/^[a-z][A-Za-z0-9]*$/);
        expect(p.title.length).toBeGreaterThan(0);
        expect(p.values.length).toBeGreaterThanOrEqual(2);
        expect(new Set(p.values.map((v) => v.value)).size).toBe(p.values.length);
        for (const v of p.values) expect(v.value).toMatch(/^[A-Za-z0-9]+$/);
        // the game shows each value as a button: a short label, not a description
        for (const v of p.values) expect(v.title.length, `${d.id} ${p.name}=${v.value}`).toBeLessThanOrEqual(16);
        expect(new Set(p.values.map((v) => v.title)).size, `${d.id} ${p.name} titles`).toBe(p.values.length);
        expect(p.values.map((v) => v.value)).toContain(p.default);
      }
      for (const name of d.finishParams ?? []) expect(names).toContain(name);
    }
  });

  it("list their parameters in the export meta, and fixed models list none", () => {
    const meta = exportVehicleMeta(VEHICLES);
    for (const d of VEHICLES) {
      const entry = meta.vehicles.find((e) => e.id === d.id)!;
      if (d.params?.length) expect(entry.params).toEqual(d.params);
      else expect("params" in entry).toBe(false);
    }
    // the entry holds a copy: editing it cannot reach the design
    const d = PARAMETRIC[0]!;
    metaEntry(d).params![0]!.values.pop();
    expect(d.params![0]!.values.length).toBeGreaterThanOrEqual(2);
  });

  // Every parametric design's sampled combinations, built and in JS: the catalog
  // sweep (test/catalogSweep.ts).
});
