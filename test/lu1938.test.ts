// London's 1938 tube stock (generator/ukUnits.ts TUBE1938, generator/lu1938Parts.ts):
// the tube profile, the flat domed cab front, the door layout and the bogies.
import { describe, expect, it } from "vitest";
import { lu1938Stock, TUBE1938 } from "../generator/ukUnits";
import { TUBE_LAYOUT } from "../generator/lu1938Parts";

const bounds = (pos: number[]) => {
  const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { lo[k] = Math.min(lo[k]!, pos[i + k]!); hi[k] = Math.max(hi[k]!, pos[i + k]!); }
  return { lo, hi };
};

describe("London 1938 Stock", () => {
  it("keeps the tube profile: 2.62 m wide, 2.88 m high, its roof domed over upright sides", () => {
    const { lo, hi } = bounds(lu1938Stock().positions());
    expect(hi[1]).toBeCloseTo(2.88, 2);
    expect(hi[2]! - lo[2]!).toBeLessThan(2.64);
    expect(hi[2]! - lo[2]!).toBeGreaterThan(2.58);
    // the shoulder stands just above the window and door heads, the roof's dome over it
    expect(TUBE1938.S).toBeGreaterThan(TUBE1938.door[1]);
    expect(TUBE1938.S).toBeGreaterThan(TUBE1938.windows[0]![1]);
    expect(TUBE1938.C - TUBE1938.S).toBeGreaterThan(0.5);
  });

  it("has a flat cab front whose roof domes down to it", () => {
    expect(TUBE1938.flatCab).toBeDefined();
    const dome = TUBE1938.cabNose!.C;
    expect(dome[0]![1]).toBeLessThan(TUBE1938.C - 0.2);
    expect(dome[dome.length - 1]![1]).toBeCloseTo(TUBE1938.C, 5);
  });

  it("lays out its doors and windows without overlaps, the double doors parting in the middle", () => {
    for (const [car, len] of [["end", TUBE1938.endLength - 0.07 - 0.25], ["middle", TUBE1938.midLength - 0.5]] as const) {
      const l = TUBE_LAYOUT[car];
      const spans = [...l.doors.map(([a, b]) => [a, b] as const), ...l.windows].sort((p, q) => p[0] - q[0]);
      spans.forEach(([a, b], i) => {
        expect(b).toBeGreaterThan(a);
        if (i > 0) expect(a).toBeGreaterThanOrEqual(spans[i - 1]![1] - 1e-9);
      });
      expect(spans[spans.length - 1]![1]).toBeLessThan(len);
      // a leaf ending where the next begins is a pair: the two slide apart
      l.doors.forEach(([, b, slide], i) => { const next = l.doors[i + 1]; if (next && Math.abs(next[0] - b) < 1e-9) { expect(slide).toBe(-1); expect(next[2]).toBe(1); } });
    }
  });

  it("stands on two bogies centred on each car, within the rail budget", () => {
    for (const unit of ["endCar", "middleCar"]) {
      const m = lu1938Stock({ unit });
      expect(m.triangleCount()).toBeLessThanOrEqual(16000);
    }
    expect(TUBE1938.centredBogies).toBe(true);
  });
});
