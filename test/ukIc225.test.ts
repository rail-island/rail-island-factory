// The InterCity 225 (generator/ukUnits.ts): its Class 91 end car is a locomotive on
// the series kit - bogies under the middle of the body, buffers and no gangway at
// the nose, the yellow panel, the pantograph on the leading car only. See
// docs/models/uk-trains.md.
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { IC225 } from "../generator/ukUnits";
import { shinkansenTrain } from "../generator/shinkansen";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";

const design = DESIGNS.get("proc-vehicle-br-ic225")!;
const tris = (v: Record<string, string>) => {
  const { json, bin } = parseGlb(design.build(v).toGlb("ic225"));
  return collectTriangles(json, bin);
};

describe("the InterCity 225's Class 91", () => {
  it("stands on bogies 10.5 m apart, its leading wheelset well behind the nose", () => {
    const m = design.build({});
    const xs = m.rig!.supports!.map((s) => s.x).sort((a, b) => b - a);
    expect(xs).toHaveLength(2);
    expect(xs[0]! - xs[1]!).toBeCloseTo(10.5, 2);
    // the bogies are centred on the locomotive (centred at x = 0)
    expect(xs[0]! + xs[1]!).toBeCloseTo(0, 0);
    // the nose's tip at the buffer beam, 0.65 m behind the coupling plane at +L/2
    const tip = IC225.endLength / 2 - 0.65;
    const leadAxle = xs[0]! + IC225.wheelbase / 2;
    expect(tip - leadAxle).toBeGreaterThan(2.0);
  });

  it("has no gangway frame on its nose (a buffered nose end), only at its inner end", () => {
    const d = tris({}).filter((t) => t.material === "diaphragm");
    expect(d.length).toBeGreaterThan(0);
    for (const t of d) for (const p of t.p) expect(p[0]).toBeLessThan(0);
  });

  it("paints the yellow warning panel on the nose", () => {
    const y = tris({}).filter((t) => t.material === "cabPanel");
    expect(y.length).toBeGreaterThan(0);
    for (const t of y) for (const p of t.p) expect(p[0]).toBeGreaterThan(IC225.endLength / 2 - 0.65 - IC225.cabPanel!.d - 0.3);
  });

  it("raises a pantograph on the leading Class 91 only, not on the driving van trailer", () => {
    for (const n of IC225.cars!) {
      const t = shinkansenTrain(IC225, n);
      expect(t.map((x) => x.pantograph)).toEqual(t.map((_, k) => k === 0));
    }
  });
});
