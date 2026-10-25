// The preview's vehicle interiors (src/viewerInteriors.ts): an interior shows
// while a door that reveals it stands open, or always with the Interior toggle,
// which cuts the model away just under the highest ceiling.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/threeBuilder.ts";
import { doorLeaves, openable } from "../generator/doors.ts";
import { drawCabin, INTERIOR_PALETTE, type Cabin } from "../generator/interior.ts";
import { applyInteriors, cutHeight, interiorsOf } from "../src/viewerInteriors";
import { makeParts } from "../src/viewerHighlight";

const PALETTE = { ...INTERIOR_PALETTE, body: { color: "#808080" }, leaf: { color: "#c03030" } };

/** Two cars, each with a cabin: the first with a door on the right, the second on the left. */
function twoCars(): THREE.Group {
  const m = new MeshBuilder(PALETTE);
  for (const [name, at, s] of [["car1", 0, 1], ["car2", 20, -1]] as const)
    m.part(name, [at, 0, 0], () => {
      m.box("body", at, 0, 12.4, 2.8, 1, 3.5);
      const cabin: Cabin = { x0: at - 6, x1: at + 6, floor: 1.2, ceiling: 3.3, half: 1.35, doors: [{ s, x0: at - 5, x1: at - 4, y0: 1.2, y1: 3.1 }] };
      openable(m, (mm, o) => {
        for (const l of doorLeaves(at - 5, at - 4, s, { kind: "plug", leaves: 1 })) mm.moved(l.move(o, s * 1.41), () => mm.box("leaf", (l.x0 + l.x1) / 2, s * 1.41, l.x1 - l.x0, 0.01, 1.2, 3.1));
      });
      drawCabin(m, cabin);
    });
  return m.toGroup(THREE, "train");
}

describe("the preview's interiors", () => {
  it("finds each car's interior and the sides of the doors that reveal it", () => {
    const group = twoCars();
    const found = interiorsOf(group);
    expect(found.map((it) => [it.group.name, it.sides])).toEqual([["interior-car1", ["right"]], ["interior-car2", ["left"]]]);
    expect(interiorsOf(new THREE.Group())).toEqual([]);
  });

  it("shows a car's interior while its doors open, and every one with the toggle", () => {
    const found = interiorsOf(twoCars());
    const shown = () => found.map((it) => it.group.visible);
    expect(shown()).toEqual([false, false]);
    applyInteriors(found, { left: 0, right: 0.01 }, false);
    expect(shown()).toEqual([true, false]);
    applyInteriors(found, { left: 1, right: 0 }, false);
    expect(shown()).toEqual([false, true]);
    applyInteriors(found, { left: 0, right: 0 }, true);
    expect(shown()).toEqual([true, true]);
    applyInteriors(found, { left: 0, right: 0 }, false);
    expect(shown()).toEqual([false, false]);
  });

  it("cuts the model away just under the highest ceiling", () => {
    expect(cutHeight(interiorsOf(twoCars()))).toBeCloseTo(3.28, 6);
  });

  it("leaves the interiors out of the highlight's parts, as the source tree does", () => {
    const group = twoCars();
    const inner = interiorsOf(group).map((it) => it.group);
    const parts = makeParts(group);
    expect(parts.length).toBeGreaterThan(0);
    for (const p of parts) {
      let o: THREE.Object3D | null = p.mesh;
      while (o && !inner.includes(o)) o = o.parent;
      expect(o).toBeNull();
    }
    expect(parts.some((p) => p.name.startsWith("interior"))).toBe(false);
  });
});
