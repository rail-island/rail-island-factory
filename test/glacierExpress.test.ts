import { describe, it, expect } from "vitest";
import { WORLD_COACHES } from "../generator/worldCoaches.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";

// the Glacier Express panorama car (generator/worldCoaches.ts GLACIER, docs/models/switzerland-trains.md):
// its small 685 mm wheels on the coach kit's bogie - at the kit's 2.05 m minimum wheelbase the brake
// cylinders' ends lay on the transoms' ends and flickered; both units must build clean
const design = WORLD_COACHES.find((d) => d.id === "proc-vehicle-glacier-express")!;

describe("the Glacier Express coach", () => {
  for (const unit of ["first", "second"])
    it(`${unit} class has no z-fighting faces`, () => {
      expect(findCoplanarOverlaps(design.build({ unit }).toGlb(design.id))).toEqual([]);
    });
});
