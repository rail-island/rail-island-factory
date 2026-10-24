// Party walls (generator/partyWalls.ts): the sides of a street house a neighbour
// stands against, drawn blank. The parameters are the ones the city fill sets
// (sets/blockType.ts), a blank side carries no windows, and the model's extent never
// changes -- the game centres a building on it and stands the next one against it.
import { describe, expect, it } from "vitest";
import { COMMERCIAL } from "../generator/commercialStreets.ts";
import { COMMERCIAL_BUILDINGS } from "../generator/commercial.ts";
import { extentOf } from "../generator/cityVariants.ts";
import { paramCombinations } from "../generator/design.ts";
import { PARTY_BLANK as BLANK, partyParam as setParam, PARTY_SIDES } from "../generator/sets/blockType.ts";
import { PARTY_BLANK, partyParam } from "../generator/partyWalls.ts";
import { partySidesOf as citySides } from "../generator/cityVariants.ts";

const designs = [...COMMERCIAL, ...COMMERCIAL_BUILDINGS].filter((d) => citySides(d.params).length);

/** Triangles of one material in a built model. */
function triangles(model: ReturnType<(typeof designs)[number]["build"]>, mat: string): number {
  const g = (model as unknown as { groups: Map<string, { pos: number[] }> }).groups.get(mat);
  return g ? g.pos.length / 9 : 0;
}

describe("party walls", () => {
  it("use the parameter names and blank value the city fill sets", () => {
    expect(PARTY_BLANK).toBe(BLANK);
    for (const side of PARTY_SIDES) expect(partyParam(side)).toBe(setParam(side));
  });

  it("are drawn by the street houses: the commercial kit and the classic upright houses", () => {
    expect(designs.length).toBeGreaterThanOrEqual(14);
    expect(designs.every((d) => (d.params ?? []).some((p) => p.name === "partyLeft"))).toBe(true);
  });

  it("drop the windows of a blank side", () => {
    for (const d of designs) {
      const open = triangles(d.build({}), "glass");
      for (const side of citySides(d.params)) {
        const blank = triangles(d.build({ [partyParam(side as "left")]: PARTY_BLANK }), "glass");
        expect(blank, `${d.id} ${side}`).toBeLessThan(open);
      }
    }
  });

  it("keep the model's extent whatever sides are blank", () => {
    for (const d of designs) {
      const sides = citySides(d.params);
      const party = (d.params ?? []).filter((p) => sides.some((s) => p.name === partyParam(s as "left")));
      for (const shape of [{} as Record<string, string>, { storeys: d.params!.find((p) => p.name === "storeys")!.values.at(-1)!.value }]) {
        const ref = extentOf(d.build(shape).positions());
        for (const combo of paramCombinations(party)) {
          const got = extentOf(d.build({ ...shape, ...combo }).positions());
          for (let k = 0; k < 3; k++) expect(got[k], `${d.id} ${JSON.stringify(combo)}`).toBeCloseTo(ref[k]!, 4);
        }
      }
    }
  });
});
