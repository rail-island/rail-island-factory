// The rock species and what the woods do with rocks (docs/models/rocks.md).
import { describe, expect, it } from "vitest";
import { BOULDER_SINK, BURY, ROCK_SEEDS, ROCK_SPECIES, ROCKS, buildRock, rockInfo, rockParts, type RockLevel } from "../generator/rocks";
import { WOODS } from "../generator/woods";
import { MAX_TREES_PER_CELL, ROCK_GRID, newSlot, onRock, rockCellContext, type CellContext, type TreeSlot } from "../generator/woodsApi";
import { COARSE_TRIANGLES } from "../generator/generate";
import { buildGrove, groveRocks, groveTrees } from "../generator/woodsGrove";
import { SURFACES } from "../generator/surfaces";

const LEVELS: RockLevel[] = ["coarse", "low", "high", "max"];
const FULL = (1 << 25) - 1;
const slots = (): TreeSlot[] => Array.from({ length: MAX_TREES_PER_CELL }, newSlot);
const wood = (name: string) => WOODS.find((w) => w.design.name === name)!.design;

describe("the rock species", () => {
  it("ships the four species as drafts of their own family, keys stable", () => {
    expect([...ROCK_SPECIES]).toEqual(["granite-boulder", "sandstone-tower", "limestone-pinnacle", "crag"]);
    expect(ROCKS.map((d) => d.id)).toEqual(ROCK_SPECIES.map((s) => `proc-rock-${s}`));
    for (const d of ROCKS) {
      expect(d.params![0]!.name).toBe("seed");
      expect(d.params![0]!.values.map((v) => v.value)).toEqual(["1", "2", "3", "4", "5"]);
    }
  });

  for (const species of ROCK_SPECIES) {
    for (let seed = 1; seed <= ROCK_SEEDS; seed++) {
      it(`${species} #${seed}: four levels in budget, two surfaced materials, the same size at every level`, () => {
        const counts = LEVELS.map((l) => buildRock(species, l, { seed: String(seed) }).triangleCount());
        expect(counts[0]).toBeLessThanOrEqual(COARSE_TRIANGLES);
        expect(counts[1]).toBeLessThanOrEqual(300);
        expect(counts[2]).toBeLessThanOrEqual(3000);
        expect(counts[3]).toBeLessThanOrEqual(10000);
        expect(counts[0]!).toBeLessThan(counts[1]!);
        expect(counts[1]!).toBeLessThan(counts[2]!);
        expect(counts[2]!).toBeLessThan(counts[3]!);
        // both meshes the forest merges by name, both drawing a rock photo
        for (const l of LEVELS) {
          const parts = rockParts(species, l, seed);
          expect(parts.trunk[0]!.count, `${l} stone`).toBeGreaterThan(0);
          expect(parts.foliage[0]!.count, `${l} top`).toBeGreaterThan(0);
        }
        // every level stands on the same footprint and height: fitted onto the high box
        const bounds = (l: RockLevel) => {
          const { trunk, foliage } = rockParts(species, l, seed);
          const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
          for (const g of [...trunk, ...foliage]) {
            for (let i = 0; i < g.count; i++) {
              const v = [g.x(i), g.y(i), g.z(i)];
              for (let k = 0; k < 3; k++) { min[k] = Math.min(min[k]!, v[k]!); max[k] = Math.max(max[k]!, v[k]!); }
            }
          }
          return { min, max };
        };
        const h = bounds("high");
        // like every model it stands on y = 0; its sink is the skirt the game buries
        expect(h.min[1]).toBeCloseTo(0, 6);
        const info = rockInfo(species, seed);
        if (species === "granite-boulder") expect(info.sink).toBeCloseTo((info.height + info.sink) * BOULDER_SINK, 2);
        else expect(info.sink).toBe(BURY);
        for (const l of ["coarse", "low", "max"] as const) {
          const b = bounds(l);
          expect(b.max[1], l).toBeCloseTo(h.max[1]!, 3);
          expect(b.max[0]! - b.min[0]!, l).toBeCloseTo(h.max[0]! - h.min[0]!, 3);
          expect(b.max[2]! - b.min[2]!, l).toBeCloseTo(h.max[2]! - h.min[2]!, 3);
        }
      });
    }
  }

  it("names a rock surface on both materials", () => {
    const group = buildRock("sandstone-tower", "high");
    const palette = (group as unknown as { palette: Record<string, { surface?: string }> }).palette;
    expect(palette.trunk!.surface).toBe("rock-sandstone");
    expect(palette.foliage!.surface).toBe("rock-sandstone");
    expect(SURFACES["rock-granite"].texture).toBe("boulder");
    expect(SURFACES["rock-limestone"].texture).toBe("limestone");
  });

  it("measures towers and crags with tops, boulders and pinnacles without; footprints and heights in the planned ranges", () => {
    for (let seed = 1; seed <= ROCK_SEEDS; seed++) {
      const tower = rockInfo("sandstone-tower", seed);
      expect(tower.height).toBeGreaterThan(14);
      expect(tower.height).toBeLessThan(34);
      expect(tower.footprint).toBeGreaterThan(2.5);
      expect(tower.footprint).toBeLessThan(9);
      expect(tower.tops).toHaveLength(1);
      expect(tower.tops[0]!.y).toBeGreaterThan(tower.height * 0.85);
      expect(rockInfo("crag", seed).tops).toHaveLength(1);
      expect(rockInfo("limestone-pinnacle", seed).tops).toHaveLength(0);
      expect(rockInfo("granite-boulder", seed).tops).toHaveLength(0);
      expect(rockInfo("granite-boulder", seed).height).toBeLessThan(4);
    }
    expect(rockInfo("crag", 2)).toEqual(rockInfo("crag", 2));
  });

  it("is deterministic", () => {
    for (const s of ROCK_SPECIES) {
      expect(buildRock(s, "high", { seed: "3" }).triangleCount()).toBe(buildRock(s, "high", { seed: "3" }).triangleCount());
      expect(JSON.stringify(rockParts(s, "low", 3))).toBe(JSON.stringify(rockParts(s, "low", 3)));
    }
  });
});

describe("the woods round rocks", () => {
  it("reads the occupancy mask by square", () => {
    expect(onRock(0, 0, 0)).toBe(false);
    expect(onRock(undefined, 0.2, 0.2)).toBe(false);
    expect(onRock(1, -0.45, -0.45)).toBe(true);
    expect(onRock(1, 0.45, -0.45)).toBe(false);
    expect(onRock(1 << (ROCK_GRID * ROCK_GRID - 1), 0.45, 0.45)).toBe(true);
  });

  it("covers a cell's squares from the rocks round it and hands it the tops inside it", () => {
    const rock = { x: 0, z: 0, footprint: 3, tops: [{ x: 1, z: -1, y: 20, r: 1.5 }] };
    const inside = rockCellContext([rock], 0, 0, 4, () => 2);
    expect(inside.rocks).toBe((1 << 16) - 1);
    expect(inside.tops).toEqual([{ x: 0.25, z: -0.25, lift: 18, r: 1.5 }]);
    const beside = rockCellContext([rock], 4, 0, 4, () => 0);
    expect(beside.rocks).not.toBe(0);
    expect(beside.rocks).not.toBe((1 << 16) - 1);
    expect(beside.tops).toEqual([]);
    expect(rockCellContext([rock], 40, 40, 4, () => 0)).toEqual({ rocks: 0, tops: [] });
  });

  it("never plants a tree or a boulder on a stored rock's square", () => {
    for (const { design } of WOODS) {
      const out = slots();
      for (let i = 0; i < 600; i++) {
        const rocks = (i * 2654435761) & 0xffff;
        const ctx: CellContext = { gx: i % 50, gz: Math.floor(i / 50), seed: 99, mask: FULL, slope: 5, height: 20, rocks };
        const n = design.variant({ density: "dense" }).distribute(ctx, out);
        for (let k = 0; k < n; k++) {
          if (out[k]!.lift > 0) continue; // on a rock's top
          expect(onRock(rocks, out[k]!.x, out[k]!.z), `${design.name} cell ${i}`).toBe(false);
        }
      }
    }
  });

  it("lifts a tree onto a top spot", () => {
    const out = slots();
    let lifted = 0;
    for (let i = 0; i < 200; i++) {
      const ctx: CellContext = { gx: i, gz: 3, seed: 5, mask: FULL, slope: 0, height: 20, rocks: 0xffff, tops: [{ x: 0.1, z: -0.2, lift: 17, r: 1.6 }] };
      const n = wood("rock-city").distribute(ctx, out);
      for (let k = 0; k < n; k++) {
        if (out[k]!.species === "granite-boulder") continue;
        expect(out[k]!.lift).toBe(17);
        expect(out[k]!.x).toBe(0.1);
        lifted++;
      }
    }
    // most crowns grow a tree, and nothing else stands on a cell the rock covers whole
    expect(lifted).toBeGreaterThan(140);
  });

  it("grows exactly the old trees where there is no rock, whatever the boulders parameter's default", () => {
    for (const name of ["pine-forest", "mixed-woods", "scots-pine-woodland", "high-mountain-forest"]) {
      const d = wood(name);
      expect(d.params.some((p) => p.name === "boulders" && p.default === "none")).toBe(true);
      const a = slots(), b = slots();
      for (let i = 0; i < 400; i++) {
        const ctx: CellContext = { gx: i % 40, gz: Math.floor(i / 40), seed: 11, mask: FULL, slope: 3, height: 30 };
        const n = d.distribute(ctx, a);
        expect(d.variant({ boulders: "none" }).distribute(ctx, b)).toBe(n);
        expect(b.slice(0, n)).toEqual(a.slice(0, n));
        for (let k = 0; k < n; k++) {
          expect(a[k]!.species).not.toBe("granite-boulder");
          expect(a[k]!.lift).toBe(0);
        }
      }
    }
  });

  it("grows boulders in a forest when asked, more for many than for a few", () => {
    const count = (value: string) => {
      const out = slots();
      let b = 0;
      for (let i = 0; i < 3000; i++) {
        const n = wood("pine-forest").variant({ boulders: value }).distribute({ gx: i % 60, gz: Math.floor(i / 60), seed: 3, mask: FULL, slope: 0, height: 20 }, out);
        for (let k = 0; k < n; k++) if (out[k]!.species === "granite-boulder") b++;
      }
      return b;
    };
    expect(count("few")).toBeGreaterThan(100);
    expect(count("many")).toBeGreaterThan(count("few") * 2);
  });

  it("previews a rock city with towers, trees in the lanes and pines on the crowns", () => {
    const rocks = groveRocks(wood("rock-city"));
    expect(rocks.length).toBeGreaterThan(3);
    expect(rocks.every((r) => r.species === "sandstone-tower")).toBe(true);
    const trees = groveTrees(wood("rock-city"));
    expect(trees.some((t) => t.lift > 10)).toBe(true);
    expect(trees.some((t) => t.species === "granite-boulder")).toBe(true);
    expect(groveRocks(wood("pine-forest"))).toEqual([]);
    expect(buildGrove(wood("stone-forest"), { detail: "coarse" }).triangleCount()).toBeLessThanOrEqual(12000);
  });
});
