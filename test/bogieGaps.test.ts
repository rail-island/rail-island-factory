// The bogies that stood off their skirt gaps (2026-11): the VIRM's, the ICE 2 driving trailer's and
// the CRH6A's leading bogie under a cab face that reached down over it (now cut, seriesCab
// `wheelCut`), and the Superliner's truck under the low floor reaching over its inner wheel.
// test/worldTrainsSuite.ts checks every family design's defaults the same way.

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate";
import { bogieCovers, offGap } from "./bogieGap";

const CASES: Array<[string, Record<string, string>?]> = [
  ["proc-vehicle-ns-virm"],
  ["proc-vehicle-db-ice2", { unit: "drivingTrailer" }],
  ["proc-vehicle-cr-crh6a"],
  ["proc-vehicle-amtrak-superliner", { unit: "coach" }],
  ["proc-vehicle-amtrak-superliner", { unit: "sleeper" }],
];

describe("bogies in their skirt gaps", () => {
  for (const [id, v] of CASES)
    it(`${id} ${JSON.stringify(v ?? {})}: the body covers no bogie's wheels on one side`, () => {
      const m = DESIGNS.get(id)!.build(v);
      const covers = bogieCovers(m.toGlb(id), m.rig?.supports ?? []);
      expect(covers.length).toBeGreaterThan(0);
      expect(covers.filter(offGap)).toEqual([]);
    });
});
