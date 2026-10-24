// The bridge types' triangle budgets (docs/models/bridges.md): a bridge grows with
// its length, so like a train it is budgeted per length -- a tier's rate per 100
// studs of bridge, plus an allowance for its two ends -- counted as the site draws
// it, on straight crossings of three lengths (a single track, and a wide road deck
// on the longest), and on a curved one with a vertex every 4 studs.

import { describe, expect, it } from "vitest";
import * as bridge from "../generator/sets/bridge";
import { bridgeMesh } from "../generator/previews/bridges";

type Tier = "plain" | "framed" | "signature";
const TIERS: Record<Tier, { per100: number; ends: number }> = {
  plain: { per100: 2000, ends: 1000 },
  framed: { per100: 4000, ends: 1000 },
  signature: { per100: 6000, ends: 1500 },
};
const TIER_OF: Record<string, Tier> = {
  beam: "plain", box_girder: "plain",
  plate_girder: "framed", truss: "framed", deck_truss: "framed", timber_trestle: "framed",
  arch: "framed", stone_arch: "framed", brick_arch: "framed",
  cantilever: "signature", tied_arch: "signature", network_arch: "signature", suspension: "signature", cable_stayed: "signature", cable_stayed_y: "signature",
};
const budgetOf = (type: string, length: number): number => {
  const tier = TIERS[TIER_OF[type]!];
  return tier.ends + (tier.per100 * length) / 100;
};
// the distant level (bridge.lowDetailBoxes, what the game draws far away), every tier
const FAR = { per100: 1500, ends: 500, share: 0.65 };

const straight = (length: number) => [{ x: 0, y: 30, z: 0 }, { x: length, y: 30, z: 0 }];
const arc = (length: number, radius = 120, step = 4) => {
  const n = Math.ceil(length / step);
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = (length / radius) * (i / n);
    return { x: radius * Math.sin(a), y: 30, z: radius * (1 - Math.cos(a)) };
  });
};
const FIXTURES = [
  { name: "60 straight", points: straight(60), width: 9 },
  { name: "160 straight", points: straight(160), width: 9 },
  { name: "400 straight", points: straight(400), width: 9 },
  { name: "400 road", points: straight(400), width: 18 },
  { name: "160 curved", points: arc(160), width: 9 },
];

describe("the bridge budgets", () => {
  it("give every type a tier", () => {
    expect(Object.keys(TIER_OF).sort()).toEqual(Object.keys(bridge.TYPE_META).sort());
  });

  for (const type of Object.keys(bridge.TYPE_META)) {
    it(`hold ${type} to its ${TIER_OF[type]} tier`, () => {
      for (const f of FIXTURES) {
        const path = bridge.pathFromPoints(f.points, f.width, 0, 0.67, 13.16)!; // the game's clearance
        const boxes = bridge.buildBridge(type, path, () => 0);
        const triangles = bridgeMesh(boxes).triangleCount();
        expect(triangles, `${type} ${f.name}`).toBeLessThanOrEqual(budgetOf(type, path.length));
        const far = bridgeMesh(bridge.lowDetailBoxes(boxes)).triangleCount();
        expect(far, `${type} ${f.name} distant`).toBeLessThanOrEqual(Math.min(FAR.ends + (FAR.per100 * path.length) / 100, triangles * FAR.share));
        // the distant level keeps something standing on the ground
        expect(bridge.lowDetailBoxes(boxes).some((b) => b.part === "support"), `${type} ${f.name} supports`).toBe(true);
      }
    });
  }
});
