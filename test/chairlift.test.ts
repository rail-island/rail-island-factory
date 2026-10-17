import { proceduralId } from "../generator/modelId.ts";
// The parametric chairlift chair (cableCabins.ts): seat count, weather bubble and
// colour. The parametric suite (params.test.ts) checks every combination against
// the JS model; this file holds the chair's own contract: its budget, the rope
// and seat datums the game would hang it by, and what each parameter changes.

import { describe, expect, it } from "vitest";
import { CABLE_CABIN_CATALOG, CHAIR, CHAIRLIFT_PARAMS, chairliftChair } from "../generator/cableCabins";
import { DESIGNS } from "../generator/generate";
import { coverageCombinations, paramCombinations, type ParamValues } from "../generator/design";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { sample } from "./catalogCache";

const ID = "proc-vehicle-chairlift-chair";
const glb = (combo: ParamValues): Uint8Array => chairliftChair(combo).toGlb(ID);
const tris = (combo: ParamValues): Tri[] => {
  const { json, bin } = parseGlb(glb(combo));
  return collectTriangles(json, bin);
};
const span = (ts: Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) {
    lo = Math.min(lo, p[axis]!);
    hi = Math.max(hi, p[axis]!);
  }
  return [lo, hi];
};

describe("the chairlift chair", () => {
  it("is a parametric cable car design: seats 6/4/8, bubble/none, six colours", () => {
    const d = DESIGNS.get(proceduralId(ID))!;
    expect(d.title).toBe("Chairlift Chair");
    expect(d.catalog).toEqual(CABLE_CABIN_CATALOG);
    expect(d.references).toBe("chairlift");
    expect(d.finishParams).toEqual(["color"]);
    expect(CHAIRLIFT_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["seats", "6", ["6", "4", "8"]],
      ["cover", "bubble", ["bubble", "none"]],
      ["color", "orange", ["orange", "blue", "red", "yellow", "green", "grey"]],
    ]);
    expect(paramCombinations(CHAIRLIFT_PARAMS)).toHaveLength(36);
  });

  it("stays within the 8,000-triangle cabin budget and does not flicker in any variant", () => {
    for (const combo of sample(coverageCombinations(CHAIRLIFT_PARAMS, ["color"]))) {
      const g = glb(combo);
      expect(glbStats(g).triangles, JSON.stringify(combo)).toBeLessThanOrEqual(8000);
      expect(findCoplanarOverlaps(g), JSON.stringify(combo)).toEqual([]);
    }
  });

  it("builds the same bytes twice", () => {
    expect(Buffer.from(glb({ seats: "8", cover: "none" })).equals(Buffer.from(glb({ seats: "8", cover: "none" })))).toBe(true);
  });

  it("keeps the rope at y 3.60 along x and the seat top at 0.62, whatever the variant", () => {
    for (const combo of sample(coverageCombinations(CHAIRLIFT_PARAMS, ["color"]))) {
      const ts = tris(combo);
      const rope = ts.filter((t) => t.material === "rubber");
      const [y0, y1] = span(rope, 1);
      expect((y0 + y1) / 2).toBeCloseTo(CHAIR.rope, 3);
      const [z0, z1] = span(rope, 2);
      expect((z0 + z1) / 2).toBeCloseTo(0, 3);
      expect(span(rope, 0)[1] - span(rope, 0)[0]).toBeGreaterThan(1);
      // the cushions' tops: the highest seat-coloured horizontal faces in front of the backrests
      const cushions = ts.filter((t) => t.material === "seat" && t.p.every((p) => p[2] > CHAIR.backZ + 0.03));
      expect(span(cushions, 1)[1]).toBeCloseTo(CHAIR.seat, 3);
      // it hangs from the rope: the footrest reaches down to the ground line
      const all = span(ts, 1);
      expect(all[0]).toBeCloseTo(0, 5);
      expect(all[1]).toBeLessThan(CHAIR.rope + 0.4);
    }
  });

  it("grows across the rope with its seats; the bubble only adds the cover", () => {
    const width = (combo: ParamValues): number => {
      const s = glbStats(glb(combo));
      return s.max[0] - s.min[0];
    };
    expect(width({ seats: "4" })).toBeLessThan(width({ seats: "6" }));
    expect(width({ seats: "6" })).toBeLessThan(width({ seats: "8" }));
    expect(width({ seats: "6" }) - width({ seats: "4" })).toBeCloseTo(2 * CHAIR.pitch, 1);
    expect(tris({ cover: "none" }).some((t) => t.material === "cover")).toBe(false);
    const withCover = tris({});
    expect(withCover.some((t) => t.material === "cover")).toBe(true);
    expect(withCover.filter((t) => t.material !== "cover")).toHaveLength(tris({ cover: "none" }).length);
  });

  it("recolours with `color` without moving a vertex", () => {
    const shape = (combo: ParamValues): number[] => tris(combo).flatMap((t) => t.p.flat());
    const base = shape({});
    for (const v of CHAIRLIFT_PARAMS.find((p) => p.name === "color")!.values) expect(shape({ color: v.value })).toEqual(base);
    const colourOf = (combo: ParamValues): string =>
      JSON.stringify(parseGlb(glb(combo)).json.materials!.find((m) => m.name === "cover")!.pbrMetallicRoughness!.baseColorFactor);
    expect(colourOf({ color: "blue" })).not.toEqual(colourOf({}));
  });
});
