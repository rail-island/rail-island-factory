// The SBB Re 460's own body (generator/chLocos.ts, docs/models/switzerland-trains.md
// "The Re 460's body"): its running number, the emblem drawn in the side's ribs and
// the nose's rake.
import { describe, expect, it } from "vitest";
import { RE460_NUMBER, re460EmblemBars, sbbRe460 } from "../generator/chLocos";

function checkDigit(six: string): number {
  let sum = 0;
  [...six].reverse().forEach((d, i) => { const p = Number(d) * (i % 2 === 0 ? 2 : 1); sum += Math.floor(p / 10) + (p % 10); });
  return (10 - (sum % 10)) % 10;
}

describe("SBB Re 460", () => {
  it("carries a valid running number", () => {
    const m = /^(\d{3}) (\d{3})-(\d)$/.exec(RE460_NUMBER)!;
    expect(m).not.toBeNull();
    expect(checkDigit(m[1]! + m[2]!)).toBe(Number(m[3]));
  });

  it("draws the emblem as one full bar and pairs closing in, mirrored about its centre", () => {
    const bars = re460EmblemBars(2, 2.5, 1.35, 0.1, 0.05);
    expect(bars.length).toBe(17);
    const [full, ...pairs] = bars;
    expect(full![2] - full![0]).toBeCloseTo(2.7);
    for (const [x0, , x1] of pairs) expect(x1 - x0).toBeLessThan(0.4);
    // every bar has its mirror image across x = 2
    for (const [x0, y0, x1] of pairs) expect(pairs.some(([a, b, c]) => Math.abs(a - (4 - x1)) < 1e-9 && Math.abs(c - (4 - x0)) < 1e-9 && Math.abs(b - y0) < 1e-9)).toBe(true);
    // the rows nearer the top and bottom close in toward the centre
    const outer = (dy: number) => Math.max(...pairs.filter(([, y0]) => Math.abs(y0 + 0.025 - 2.5 - dy) < 1e-6).map(([, , x1]) => x1));
    expect(outer(0.1)).toBeGreaterThan(outer(0.4));
  });

  it("leans its nose back: the roof's front far behind the buffer beam", () => {
    const pos = sbbRe460().positions();
    let roofFront = 0, beamFront = 0;
    for (let i = 0; i < pos.length; i += 3) {
      const [x, y] = [pos[i]!, pos[i + 1]!];
      if (y > 4.05 && y < 4.2 && Math.abs(pos[i + 2]!) < 0.5) roofFront = Math.max(roofFront, x);
      if (y > 1.6 && y < 1.7) beamFront = Math.max(beamFront, x);
    }
    expect(beamFront - roofFront).toBeGreaterThan(1.8);
  });

  it("hangs a black apron under each end, down to the plough's edge", () => {
    const pos = sbbRe460().positions();
    for (const e of [-1, 1]) {
      let low = Infinity;
      for (let i = 0; i < pos.length; i += 3) {
        const x = e * pos[i]!;
        if (x > 7.9 && x < 8.6) low = Math.min(low, pos[i + 1]!);
      }
      expect(low, `end ${e}`).toBeLessThan(0.4);
    }
  });
});
