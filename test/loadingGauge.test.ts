// The loading gauges (generator/loadingGauge.ts, docs/models/loading-gauge.md):
// every gauge clears the game's platform edge, and every rail design names one
// whose width it keeps.
import { describe, expect, it } from "vitest";
import { LOADING_GAUGES, loadingGaugeOf } from "../generator/loadingGauge";
import { BALLAST_WIDTH, PLATFORM_HEIGHT } from "../generator/sets/station";
import { DESIGNS } from "../generator/generate";

/** The game draws vehicles at 1.5 studs a metre (railType.ts STUDS_PER_M). */
const STUDS_PER_M = 1.5;

describe("loading gauges", () => {
  it("keeps the UIC gauge at the repository's 3.1 m by 4.7 m", () => {
    expect(LOADING_GAUGES.uic).toEqual({ width: 3.1, height: 4.7 });
    expect(loadingGaugeOf({})).toBe(LOADING_GAUGES.uic);
  });

  it("keeps every gauge's body inside the platform edge, beside the ballast bed", () => {
    // the platform starts at the ballast bed's edge, BALLAST_WIDTH / 2 studs off the track centre
    const edge = BALLAST_WIDTH / 2 / STUDS_PER_M;
    for (const [name, g] of Object.entries(LOADING_GAUGES)) expect(g.width / 2, name).toBeLessThan(edge);
    // a body wider than the platform edge would stand in it above the platform's top
    expect(PLATFORM_HEIGHT / STUDS_PER_M).toBeLessThan(1.3);
  });

  it("names a gauge only on rail vehicles", () => {
    for (const d of DESIGNS.values())
      if (d.loadingGauge) expect(d.catalog?.category, d.id).toBe("Rail vehicles");
  });
});
