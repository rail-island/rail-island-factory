// The standalone JS models (generator/jsModel.ts): each export/js/<id>.js is the
// design's own code, so the THREE.Group it builds must carry the very triangles of
// the design's GLB -- and the file must really be standalone. Those checks run for
// every design in the catalog sweep (test/catalogSweep.ts); here, the bundler.

import { describe, expect, it } from "vitest";
import { generateJsModels } from "../generator/generate";
import { bundleDesign, gzipSize } from "../generator/jsModel";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { jsModuleOf, jsTextOf } from "./catalogCache";

describe("standalone JS models", () => {
  it("leaves the recorder and the GLB writer out of the bundle", async () => {
    const text = await jsTextOf("proc-building-sky-pyramid");
    expect(text).not.toContain("glTF");
    expect(text).not.toContain("baseColorFactor");
    expect(text).not.toContain("MeshBuilder");
  });

  it("exports releaseCaches only from a bundle that keeps build caches", async () => {
    // a cab face's skins (seriesCab.ts) are build caches; a skyscraper keeps none
    const e6 = await jsModuleOf("proc-vehicle-shinkansen-e6");
    expect(typeof e6.releaseCaches).toBe("function");
    expect(() => e6.releaseCaches!()).not.toThrow();
    expect(await jsTextOf("proc-building-sky-pyramid")).not.toContain("releaseCaches");
  }, 60_000);

  it("is deterministic and reports gzip sizes", async () => {
    const a = await bundleDesign(SKYSCRAPERS[0]!, "skyscrapers.ts");
    expect(await bundleDesign(SKYSCRAPERS[0]!, "skyscrapers.ts")).toBe(a);
    expect(gzipSize(a)).toBeLessThan(Buffer.byteLength(a));
  });

  it("generateJsModels writes js/<id>.js, leaves unchanged files alone and drops stale ones", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-js-"));
    try {
      const designs = [SKYSCRAPERS[0]!, SKYSCRAPERS[1]!];
      await generateJsModels(dir, designs);
      const file = path.join(dir, "js", `${designs[0]!.id}.js`);
      expect(fs.existsSync(file)).toBe(true);
      fs.writeFileSync(path.join(dir, "js", "gone.js"), "x");
      const before = fs.statSync(file).mtimeMs;
      await generateJsModels(dir, designs);
      expect(fs.statSync(file).mtimeMs).toBe(before);
      expect(fs.existsSync(path.join(dir, "js", "gone.js"))).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
