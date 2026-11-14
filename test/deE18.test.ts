// The DRG E 18 (generator/deE18.ts): its 1'Do1' running gear as four turning
// units the game lays on the track, so every wheel stays on the rails on a curve,
// and its rolling clip for two wheel sizes. See docs/models/germany-trains.md.

import { describe, expect, it } from "vitest";
import { E18_AXLES, drgE18 } from "../generator/deE18";
import { ROLLING_CLIP, ROLLING_SAMPLES } from "../generator/rolling";
import { wheelOffsets } from "./railCurve";

describe("DRG E 18", () => {
  const m = drgE18();

  it("stands on its pony axles and its two pairs of drivers at the drawing's axle spacing", () => {
    const supports = m.rig!.supports!;
    expect(supports.map((s) => [s.x, s.axles])).toEqual([[-6.4, 1], [-2.55, 2], [2.55, 2], [6.4, 1]]);
    expect(supports.every((s) => s.node)).toBe(true);
    // 2.8 + 2.1 + 3.0 + 2.1 + 2.8 m: 12.8 m between the pony axles
    const gaps = E18_AXLES.slice(1).map((x, i) => Math.round((E18_AXLES[i]! - x) * 100) / 100);
    expect(gaps).toEqual([2.8, 2.1, 3.0, 2.1, 2.8]);
  });

  it("keeps every wheel on the rails on a tight curve (the drivers once rode on the body's chord)", () => {
    const offsets = wheelOffsets(m, 40);
    expect(offsets).toHaveLength(6);
    for (const o of offsets) expect(Math.abs(o.offset), `axle at x ${o.x}`).toBeLessThan(0.35);
  });

  it("rolls the drivers once a cycle and the 10-spoke pony wheels 1.6 times, closing on a spoke", () => {
    const clip = m.animations().find((a) => a.name === ROLLING_CLIP)!;
    expect(clip.times).toHaveLength(ROLLING_SAMPLES + 1);
    expect(clip.tracks).toHaveLength(6);
    for (const t of clip.tracks) {
      const [, , z, w] = t.values.slice(-4) as [number, number, number, number];
      const turns = (-2 * Math.atan2(z, w)) / (2 * Math.PI);
      // a whole number of spoke pitches: 16 spokes on a driver, 10 on a pony wheel
      const spokes = t.node === "wheelset-1" || t.node === "wheelset-2" ? 10 : 16;
      const pitch = turns * spokes;
      expect(Math.abs(pitch - Math.round(pitch))).toBeLessThan(1e-6);
    }
  });

  it("stays within the rail vehicle budget", () => {
    expect(m.triangleCount()).toBeLessThanOrEqual(16000);
  });
});
