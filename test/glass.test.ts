// Window glass (MaterialSpec.glass): a vehicle's glass materials carry
// `userData.glass` in the JS model, which the game draws with a sky reflection.
// Every vehicle family marks its own glass in its palette, so a new design that
// draws a glass material without the flag would quietly lose the reflection --
// the sweep below catches that. An LOD's glass stays plain.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { ALL_VEHICLES } from "../generator/generate";
import { LOD_GLASS, LOD_PALETTE } from "../generator/lodKit";
import type { MaterialSpec } from "../generator/meshCore";
import { jsModuleOf } from "./catalogCache";

/** A material name that reads as window glass; a lamp's glass is a lamp, a skirt panel is not a pane. */
const GLASSY = /glass|windscreen|window|visor/i;

describe("window glass", () => {
  it("marks the glass materials of the JS model, and only those", async () => {
    const mod = await jsModuleOf("proc-vehicle-cd-163");
    const flags = new Map<string, boolean>();
    mod.default(THREE).traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      flags.set(m.name, m.userData.glass === true);
    });
    expect(flags.get("glass")).toBe(true);
    expect([...flags].filter(([, glass]) => glass).map(([name]) => name)).toEqual(["glass"]);
  });

  it("marks every glass material a vehicle draws", () => {
    const unmarked: string[] = [];
    let marked = 0;
    for (const d of ALL_VEHICLES) {
      const model = d.build() as unknown as { groups: Map<string, unknown>; palette: Record<string, MaterialSpec> };
      for (const mat of model.groups.keys()) {
        const spec = model.palette[mat]!;
        if (spec.glass) marked += 1;
        else if (GLASSY.test(mat) && !spec.lamp) unmarked.push(`${d.id}: ${mat}`);
      }
    }
    expect(unmarked).toEqual([]);
    expect(marked).toBeGreaterThan(100);
  });

  it("leaves the LOD's glass plain", () => {
    expect(LOD_PALETTE[LOD_GLASS]!.glass).toBeUndefined();
  });
});
