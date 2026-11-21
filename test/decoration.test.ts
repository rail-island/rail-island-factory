// The line decoration drawings (generator/sets/decoration.ts, docs/models/sets.md):
// what a module draws stays inside the envelope the game's placement reserves, and a
// gallery's open side keeps its pillars in the far tile too.
import { describe, expect, it } from "vitest";
import * as decoration from "../generator/sets/decoration.ts";

type Call = { kind: "sweep" | "box"; args: unknown[] };

function draw(kind: string, side: decoration.DecorationSide, detail: string): Call[] {
  const calls: Call[] = [];
  const a = { x: 0, y: 0, z: 0, tx: 1, tz: 0 }, b = { x: 4, y: 0, z: 0, tx: 1, tz: 0 };
  decoration.buildPiece(kind, { a, b, left: 9, right: -9, leftVisible: true, rightVisible: true, side },
    { heightAt: () => 0, detail, shoulderY: 0.9 }, {
      sweep: (...args) => calls.push({ kind: "sweep", args }),
      box: (...args) => calls.push({ kind: "box", args }),
      tree: () => {},
    });
  return calls;
}

/** The highest point a call reaches. */
function topOf(c: Call): number {
  if (c.kind === "box") { const [, , y, , , h] = c.args as number[]; return y + h / 2; }
  const [, , , , , , topA, , topB, leftRise = 0, rightRise = 0] = c.args as number[];
  return Math.max(topA, topB) + Math.max(leftRise, rightRise);
}

describe("decoration drawings", () => {
  for (const detail of ["high", "low"]) {
    it(`the noise wall stays under its envelope's top (${detail})`, () => {
      const calls = draw("wall", "both", detail);
      expect(calls.length).toBeGreaterThan(0);
      for (const c of calls) expect(topOf(c)).toBeLessThanOrEqual((decoration.TYPE_META.wall!.top as number) + 1e-9);
    });

    it(`the gallery stays under its envelope's top (${detail})`, () => {
      for (const side of ["both", "left", "none"] as const)
        for (const c of draw("gallery", side, detail)) expect(topOf(c)).toBeLessThanOrEqual((decoration.TYPE_META.gallery!.top as number) + 1e-9);
    });
  }

  it("the gallery's open side stands pillars in the far tile, so its roof never floats", () => {
    // a pillar: a short slice reaching from the kerb up to the head beam, out at the open side
    const pillars = (detail: string): number => draw("gallery", "left", detail).filter((c) => {
      if (c.kind !== "sweep") return false;
      const [, ca, , left, right, bottom, top] = c.args as [unknown, decoration.Cross, unknown, number, number, number, number];
      return right < -8 && left > -10 && ca.x > 0.5 && bottom < 3 && top > 10;
    }).length;
    expect(pillars("low")).toBeGreaterThan(0);
    expect(pillars("high")).toBeGreaterThan(0);
  });

  it("nothing over the middle of a gallery's way reaches below its roof's clearance", () => {
    const clearance = decoration.TYPE_META.gallery!.section!.clearance!;
    for (const c of draw("gallery", "both", "high")) {
      if (c.kind !== "sweep") continue;
      const [, , , left, right, bottomA] = c.args as number[];
      if (left > -5 && right < 5) expect(bottomA, `${left}..${right}`).toBeGreaterThanOrEqual(clearance - 1e-9);
    }
  });
});
