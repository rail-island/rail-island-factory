// The pins of every landed set module (generator/sets/pinCases.ts): a change that
// redraws a shipped type fails here until test/fixtures/set-pins.json is updated on
// purpose (`pnpm sets:pins`), and the game's import names the same cases.
import { describe, expect, it } from "vitest";
import pins from "./fixtures/set-pins.json";
import { setPinCases, setPins } from "../generator/sets/pinCases";
import { SETS } from "../generator/sets/registry";

describe("set pins", () => {
  const now = setPins();
  for (const set of Object.keys(setPinCases())) {
    it(`${set} builds every pinned case as it did when the pin was taken`, () => {
      expect(now[set]).toEqual((pins as Record<string, Record<string, string>>)[set]);
    });
  }
  it("pins every landed set and no other", () => {
    expect(Object.keys(setPinCases()).sort()).toEqual(SETS.filter((d) => d.landed).map((d) => d.set).sort());
  });
});
