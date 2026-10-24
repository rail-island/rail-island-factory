// Party walls (generator/partyWalls.ts): the sides of a street house a neighbour
// stands against, drawn blank. The parameters are the ones the city fill sets
// (sets/blockType.ts), a blank side carries no windows, and the model's extent never
// changes -- the game centres a building on it and stands the next one against it.
import { describe, expect, it } from "vitest";
import { proceduralId } from "../generator/modelId.ts";
import { COMMERCIAL } from "../generator/commercialStreets.ts";
import { COMMERCIAL_BUILDINGS } from "../generator/commercial.ts";
import { extentOf } from "../generator/cityVariants.ts";
import { paramCombinations } from "../generator/design.ts";
import { PARTY_BLANK as BLANK, partyParam as setParam, PARTY_SIDES } from "../generator/sets/blockType.ts";
import { PARTY_BLANK, partyParam } from "../generator/partyWalls.ts";
import { partySidesOf as citySides } from "../generator/cityVariants.ts";
import { VILLAGE_HOUSES } from "../generator/village.ts";
import { SKYSCRAPERS } from "../generator/skyscrapers.ts";

const designs = [...COMMERCIAL, ...COMMERCIAL_BUILDINGS, ...VILLAGE_HOUSES, ...SKYSCRAPERS].filter((d) => citySides(d.params).length);
/** The materials a design glazes its windows with. */
const GLASS = ["glass", "window", "glassDark"];
/** The parameter a design's tallest shape takes. */
const TALL: Record<string, string> = { storeys: "", size: "landmark" };

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

  it("are drawn by every building whose plan can stand against a neighbour", () => {
    // the commercial kit, the classic upright and terraced houses, the village's row house, two towers
    expect(designs.length).toBeGreaterThanOrEqual(18);
    expect(designs.every((d) => (d.params ?? []).some((p) => p.name === "partyLeft"))).toBe(true);
    for (const id of ["comm-terrace-house", "village-narrow-house", "sky-brick-residential", "sky-glass-office"]) {
      expect(designs.some((d) => proceduralId(d.id) === proceduralId(id)), id).toBe(true);
    }
  });

  it("drop the windows of a blank side", () => {
    // the glass office's podium is one glass band: its party wall covers it
    const covered = new Set([proceduralId("sky-glass-office")]);
    const glass = (m: ReturnType<(typeof designs)[number]["build"]>): number => GLASS.reduce((n, mat) => n + triangles(m, mat), 0);
    for (const d of designs) {
      const open = glass(d.build({}));
      for (const side of citySides(d.params)) {
        const blank = glass(d.build({ [partyParam(side as "left")]: PARTY_BLANK }));
        if (covered.has(proceduralId(d.id))) expect(blank, `${d.id} ${side}`).toBeLessThanOrEqual(open);
        else expect(blank, `${d.id} ${side}`).toBeLessThan(open);
      }
    }
  });

  it("keep the model's extent whatever sides are blank", () => {
    for (const d of designs) {
      const sides = citySides(d.params);
      const party = (d.params ?? []).filter((p) => sides.some((s) => p.name === partyParam(s as "left")));
      const tall = (d.params ?? []).find((p) => p.name in TALL)!;
      for (const shape of [{} as Record<string, string>, { [tall.name]: TALL[tall.name] || tall.values.at(-1)!.value }]) {
        const ref = extentOf(d.build(shape).positions());
        for (const combo of paramCombinations(party)) {
          const got = extentOf(d.build({ ...shape, ...combo }).positions());
          for (let k = 0; k < 3; k++) expect(got[k], `${d.id} ${JSON.stringify(combo)}`).toBeCloseTo(ref[k]!, 4);
        }
      }
    }
  });
});
