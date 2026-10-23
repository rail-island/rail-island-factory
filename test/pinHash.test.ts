// The pin hash is the game's (its src/core/setPins.ts): both repositories must agree
// on it, or a baseline the game writes would never match here.
import { describe, expect, it } from "vitest";
import { pinHash } from "../generator/sets/pinHash.ts";

describe("pin hash", () => {
  it("matches the game's vector", () => {
    expect(pinHash({ set: "bridge", boxes: [{ x: 1.5, y: -2, material: "deck" }] })).toBe("6da3809582129b53");
    expect(pinHash({ a: 1, b: [0.1 + 0.2, -0] })).toBe(pinHash({ b: [0.3, 0], a: 1 }));
  });
});
