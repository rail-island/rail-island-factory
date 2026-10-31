// The site's preview designs (generator/previews/, docs/models/previews.md): one page
// per structure type, rail and road type, line decoration, catenary style, city block
// type and texture, each filed in its category and bound to its type.

import { describe, expect, it } from "vitest";
import { PREVIEW_DESIGNS } from "../generator/generate";
import { SETS, type SetName } from "../generator/sets/registry";
import { TEXTURE_NAMES } from "../generator/surfaces";

const CATEGORY: Partial<Record<SetName, string>> = {
  bridge: "Structures", busStop: "Structures", station: "Structures", roadStation: "Structures", cableCarStation: "Structures",
  port: "Structures", airport: "Structures", dam: "Structures", tunnelPortal: "Structures",
  railType: "Rails and roads", roadType: "Rails and roads", decoration: "Rails and roads",
  blockType: "City blocks", catenaryStyle: "Props",
};

describe("the preview designs", () => {
  it("give every type of every set one page in its category, bound to the type", () => {
    for (const def of SETS) {
      const category = CATEGORY[def.set];
      expect(category, def.set).toBeDefined();
      for (const t of def.types) {
        const pages = PREVIEW_DESIGNS.filter((d) => d.bound === t.id && d.catalog?.category === category && (category === "City blocks" || d.catalog?.group === def.set || category === "Props"));
        expect(pages.map((d) => d.id), `${def.set}:${t.id}`).toHaveLength(1);
        expect(pages[0]!.title).toBe(t.label);
        // the site shows the id a saved game stores, verbatim (underscores kept)
        expect(pages[0]!.catalog?.gameId).toBe(t.id);
      }
    }
  });

  it("give every photo set of the texture library a page", () => {
    const textures = PREVIEW_DESIGNS.filter((d) => d.catalog?.category === "Textures");
    expect(textures.map((d) => d.bound).sort()).toEqual([...TEXTURE_NAMES].sort());
    expect(textures.filter((d) => d.catalog?.gameId)).toEqual([]);
  });

  it("are all site-only proc-preview-* designs with unique ids, and no type is a parameter", () => {
    const ids = PREVIEW_DESIGNS.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const d of PREVIEW_DESIGNS) {
      expect(d.id).toMatch(/^proc-preview-[a-z0-9-]+$/);
      expect((d.params ?? []).map((p) => p.name)).not.toContain("type");
    }
  });

  it("list a fixture the game sets itself under Preview parameters", () => {
    const flagged = (id: string): string[] => (PREVIEW_DESIGNS.find((d) => d.id === id)!.params ?? []).filter((p) => p.preview).map((p) => p.name);
    expect(flagged("proc-preview-bridge-beam")).toEqual(["deck", "wires", "length"]);
    expect(flagged("proc-preview-block-houses")).toEqual(["shape", "size", "spacing", "colour", "height", "sample"]);
    // what a player picks for a station is an ordinary parameter
    expect(flagged("proc-preview-station-arch-shed")).toEqual([]);
  });

  it("build a different model for each type of one shared function", () => {
    const beam = PREVIEW_DESIGNS.find((d) => d.id === "proc-preview-bridge-beam")!;
    const arch = PREVIEW_DESIGNS.find((d) => d.id === "proc-preview-bridge-stone-arch")!;
    expect(beam.build.name).toBe(arch.build.name);
    expect(beam.build().triangleCount()).not.toBe(arch.build().triangleCount());
  });

  it("draw a recentred bridge deck over its own piers and girders", () => {
    // two tracks: a 17-stud deck recentred 4 studs to +z over a path along x
    const girder = PREVIEW_DESIGNS.find((d) => d.id === "proc-preview-bridge-plate-girder")!;
    const z = girder.build({ deck: "double" }).positions().filter((_, i) => i % 3 === 2);
    // within a stud of the deck's edges (the girders' flanges overhang them); the
    // mirrored deck lay 8 studs off
    expect(Math.min(...z)).toBeGreaterThan(4 - 17 / 2 - 1);
    expect(Math.max(...z)).toBeLessThan(4 + 17 / 2 + 1);
  });
});

describe("railway station previews: passenger hints", () => {
  // the site's passenger view stands at the eye height and lays its parked train and
  // catenary along the tracks the station page states
  it("state the eye height and every track, on the full and the distant build", async () => {
    const { stationPreview, stationPreviewLod } = await import("../generator/previews/stations.ts");
    const { passengerOf } = await import("../generator/passengerHints.ts");
    for (const build of [stationPreview, stationPreviewLod]) {
      const hints = passengerOf(build({ tracks: "4", length: "120" }, "arch_shed"));
      expect(hints?.eye).toBe(2.55);
      expect(hints?.tracks).toHaveLength(4);
      // the rail top is the game's railhead (wayKit.ts), where a train's wheels stand:
      // a parked train once stood half a stud low, its wheels hidden by the platform
      const { RAILHEAD_Y } = await import("../generator/previews/wayKit.ts");
      expect(RAILHEAD_Y).toBeCloseTo(1.528, 2);
      for (const t of hints!.tracks!) expect([t.z0, t.z1, t.top]).toEqual([-64, 64, RAILHEAD_Y]);
    }
  });
});
