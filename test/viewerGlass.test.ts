// The preview's glazing (src/viewerGlass.ts): the drawing kit's glass draws
// see-through in the 3D preview as the game draws it, while a vehicle's windows
// and every other material stay opaque.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/threeBuilder.ts";
import { Sketch } from "../generator/previews/sketch.ts";
import { applyGlass, GLASS_OPACITY, isGlassMaterial } from "../src/viewerGlass.ts";

describe("the preview's glass", () => {
  it("is the drawing kit's glass kind", () => {
    const s = new Sketch();
    expect(isGlassMaterial(s.mat("glass", [168, 200, 216]))).toBe(true);
    expect(isGlassMaterial(s.mat("steel", [40, 40, 40]))).toBe(false);
    expect(isGlassMaterial("glass")).toBe(false); // a vehicle's windows
  });

  it("turns see-through, leaving the other materials opaque", () => {
    const m = new MeshBuilder({ "glass#a8c8d8": { color: "#a8c8d8" }, glass: { color: "#304050" }, "steel#282828": { color: "#282828" } });
    m.box("glass#a8c8d8", 0, 0, 4, 2, 0, 0.1);
    m.box("glass", 0, 0, 4, 2, 1, 1.1);
    m.box("steel#282828", 0, 0, 4, 2, 2, 2.1);
    const group = m.toGroup(THREE);
    expect(applyGlass(group)).toBe(1);
    const byName = new Map<string, THREE.MeshStandardMaterial>();
    group.traverse((o) => {
      if (o instanceof THREE.Mesh) byName.set(o.material.name, o.material as THREE.MeshStandardMaterial);
    });
    const pane = byName.get("glass#a8c8d8")!;
    expect([pane.transparent, pane.opacity, pane.depthWrite, pane.side]).toEqual([true, GLASS_OPACITY, false, THREE.DoubleSide]);
    for (const name of ["glass", "steel#282828"]) {
      expect([byName.get(name)!.transparent, byName.get(name)!.opacity]).toEqual([false, 1]);
    }
  });
});
