// The preview's Lights toggle (src/viewerLamps.ts): the lit twins of a model's
// lamp meshes, swapped in and out, indicators blinking.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/threeBuilder.ts";
import { applyLamps, BLINK_PERIOD, blinkOn, lampsOf } from "../src/viewerLamps.ts";

const PALETTE = {
  body: { color: "#808080" },
  lampHead: { color: "#f3f5f6", lamp: { role: "head" as const } },
  lampAmber: { color: "#ff9a2e", lamp: { role: "indicator" as const } },
};

function car(): THREE.Group {
  const m = new MeshBuilder(PALETTE);
  m.box("body", 0, 0, 4, 2, 0, 1.5);
  m.box("lampHead", 2, 0.6, 0.05, 0.2, 0.5, 0.7);
  m.box("lampAmber", 2, -0.8, 0.05, 0.1, 0.5, 0.6);
  return m.toGroup(THREE);
}

describe("the preview's lamps", () => {
  it("find the lamp meshes and give each a lit twin glowing in its lit colour", () => {
    const lamps = lampsOf(car());
    expect(lamps.map((l) => [l.role, l.base.name])).toEqual([["indicator", "lampAmber"], ["head", "lampHead"]]);
    const head = lamps.find((l) => l.role === "head")!;
    expect(head.lit.emissive.getHexString()).toBe(new THREE.Color("#fff6e0").getHexString());
    expect(head.lit.emissiveIntensity).toBe(1.6);
  });

  it("swap the twins in and back, blinking the indicators", () => {
    const lamps = lampsOf(car());
    const head = lamps.find((l) => l.role === "head")!;
    const amber = lamps.find((l) => l.role === "indicator")!;
    applyLamps(lamps, true, 0);
    expect(head.mesh.material).toBe(head.lit);
    expect(amber.mesh.material).toBe(amber.lit);
    applyLamps(lamps, true, BLINK_PERIOD * 0.75);
    expect(head.mesh.material).toBe(head.lit);
    expect(amber.mesh.material).toBe(amber.base);
    applyLamps(lamps, false);
    expect(head.mesh.material).toBe(head.base);
    expect(blinkOn(BLINK_PERIOD * 1.1)).toBe(true);
  });

  it("are none on a model without lamps", () => {
    const m = new MeshBuilder({ body: { color: "#808080" } });
    m.box("body", 0, 0, 1, 1, 0, 1);
    expect(lampsOf(m.toGroup(THREE))).toEqual([]);
  });
});
