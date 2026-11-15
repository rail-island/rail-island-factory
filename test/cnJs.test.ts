// The CR JS (generator/cnJs.ts, docs/models/china-trains.md "The CR JS's body"): its published
// length over engine and tender, no smoke deflectors (the generic spec drew Wagner plates the
// class never had), the skyline casing at the class's height and the running number.
import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { glbStats } from "../generator/glbStats";
import { jsSpec, JS_NUMBER } from "../generator/cnJs";

const d = DESIGNS.get("proc-vehicle-cr-js")!;

describe("the CR JS", () => {
  it("spans the published 23.37 m over engine and tender", () => {
    const engine = glbStats(d.build({ unit: "locomotive" }).toGlb(d.id));
    const tender = glbStats(d.build({ unit: "tender" }).toGlb(d.id));
    expect(engine.max[0] - engine.min[0] + (tender.max[0] - tender.min[0])).toBeCloseTo(23.37, 1);
    // the casing's heater box is the class's 4.711 m (its chimney's mouth a few cm over it)
    expect(engine.max[1]).toBeGreaterThan(4.7);
    expect(engine.max[1]).toBeLessThanOrEqual(4.75);
  });

  it("has no smoke deflectors and the engine's wheelbase of 10.192 m", () => {
    const s = jsSpec("locomotive");
    expect(s.deflectors).toBeUndefined();
    const xs = s.gear.wheels.map((w) => w.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(10.192, 3);
    expect(s.gear.wheels.filter((w) => w.d === 1.37)).toHaveLength(4);
  });

  it("carries JS 6500's number and stands its tender on two bogies", () => {
    expect(JS_NUMBER).toBe("6500");
    expect(jsSpec("tender").bogies).toHaveLength(2);
  });
});
