// Every design's JS model is bundled from its source module (generator/jsModel.ts
// `bundleDesign`), which imports the build functions by their own names from that
// module. A design moved to a module of its own must still have them re-exported
// from its registry module, or `pnpm build:models` fails at bundling (the DB 218
// and the ICE 2 did, 2026-11). This checks it for every design without bundling.

import path from "node:path";
import { describe, expect, it } from "vitest";
import { DESIGNS, designSource } from "../generator/generate";

describe("design source modules", () => {
  it("export every design's build functions under their own names", async () => {
    const modules = new Map<string, Record<string, unknown>>();
    const missing: string[] = [];
    for (const design of DESIGNS.values()) {
      const source = designSource(design.id);
      let mod = modules.get(source);
      if (!mod) {
        mod = (await import(path.join(__dirname, "../generator", source))) as Record<string, unknown>;
        modules.set(source, mod);
      }
      for (const fn of [design.build, design.buildLod, design.buildCoarse, design.buildMax]) {
        if (fn && typeof mod[fn.name] !== "function") missing.push(`${design.id}: ${fn.name} from ${source}`);
      }
    }
    expect(missing).toEqual([]);
  });
});
