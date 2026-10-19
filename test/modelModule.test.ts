// The site builds every JS model with a subset of three (src/modelModule.ts). A
// name the module reads that the subset lacks is silently undefined: the palm's
// fronds once lost THREE.DoubleSide that way and showed only from below.

import fs from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { DoubleSide, Mesh, Group, type MeshStandardMaterial } from "three";
import { THREE_SUBSET, buildPreview } from "../src/modelModule";
import { bundleGame } from "../generator/woodsExport";

describe("the site's three subset", () => {
  it("holds every three name the JS model code reads", () => {
    const used = new Set<string>();
    for (const f of ["generator/threeBuilder.ts", "generator/rig.ts"]) {
      for (const m of fs.readFileSync(f, "utf8").matchAll(/\bTHREE\.([A-Za-z]+)/g)) used.add(m[1]!);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) expect(Object.keys(THREE_SUBSET), name).toContain(name);
  });

  it("builds a palm's fronds double-sided", async () => {
    // the bundled tree code, the same toGroup a model module runs
    const code = await bundleGame();
    const mod = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);
    const group = mod.buildTree(THREE_SUBSET, "palm", "high") as Group;
    const foliage = group.children.find((o): o is Mesh => o instanceof Mesh && (o.material as MeshStandardMaterial).name === "foliage")!;
    expect((foliage.material as MeshStandardMaterial).side).toBe(DoubleSide);
  });
});


describe("preview detail dispatch", () => {
  it("builds Max detail with the chosen seed and falls back to full detail for other models", () => {
    const full = new Group(), max = new Group(), coarse = new Group();
    const mod = { default: vi.fn(() => full), buildMax: vi.fn(() => max), buildCoarse: vi.fn(() => coarse) };
    const params = { seed: "5" };
    expect(buildPreview(mod, params, "max")).toBe(max);
    expect(mod.buildMax).toHaveBeenCalledWith(THREE_SUBSET, params);
    expect(mod.default).not.toHaveBeenCalled();
    expect(buildPreview({ default: mod.default }, params, "max")).toBe(full);
    expect(mod.default).toHaveBeenLastCalledWith(THREE_SUBSET, params, false);
    expect(buildPreview(mod, params, "coarse")).toBe(coarse);
    expect(buildPreview(mod, params, true)).toBe(full);
    expect(mod.default).toHaveBeenLastCalledWith(THREE_SUBSET, params, true);
  });
});
