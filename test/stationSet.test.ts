// The rail station set's furnished geometry (docs/models/sets.md, "Station types"):
// every type over every track count and length the game offers stays within its
// triangle budget, keeps the loading gauge over every track clear, and builds
// finite, non-degenerate boxes.
import { describe, expect, it } from "vitest";
import * as station from "../generator/sets/station.ts";

const TRACKS = [1, 2, 3, 4, 8];
const LENGTHS = [40, 60, 120, 240];

/**
 * The triangle budget of a station type, by tier (docs/models/sets.md, "Triangle
 * budgets"): a fixed part for what a station has once (end facades, boards, the
 * depot's buildings) plus a part per stud of length per track, counting one more
 * track for the outer platforms -- so a station grows with its size the way the
 * trains standing in it do, and stays far below them (a coach is 16,000).
 */
const TIERS = {
  open: { ends: 3000, perStud: 10 },
  canopy: { ends: 4000, perStud: 40 },
  shed: { ends: 10000, perStud: 60 },
} as const;
const TIER: Record<string, keyof typeof TIERS> = {
  platforms_only: "open",
  village_depot: "open",
  platforms_shared: "canopy",
  heritage_canopy: "canopy",
  cantilever_wings: "canopy",
  concourse: "canopy",
  arch_shed: "shed",
  grand_terminus: "shed",
};

function budget(type: string, tracks: number, length: number): number {
  const t = TIERS[TIER[type]!];
  return t.ends + t.perStud * length * (tracks + 1);
}

/** Triangles the game draws for a box list: 12 per box, 8 per gable prism. */
function stationTriangles(boxes: readonly station.StationBox[]): number {
  let n = 0;
  for (const b of boxes) n += b.profile === "gable" ? 8 : 12;
  return n;
}

/** A box's axis-aligned bounds after its Z then X tilt. */
function bounds(b: station.StationBox): { min: number[]; max: number[] } {
  const cz = Math.cos(b.rotZ ?? 0), sz = Math.sin(b.rotZ ?? 0);
  const cx = Math.cos(b.rotX ?? 0), sx = Math.sin(b.rotX ?? 0);
  const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
  for (const dx of [-1, 1]) for (const dy of [-1, 1]) for (const dz of [-1, 1]) {
    let x = (dx * b.sx) / 2, y = (dy * b.sy) / 2, z = (dz * b.sz) / 2;
    [x, y] = [x * cz - y * sz, x * sz + y * cz];
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    const p = [b.cx + x, b.cy + y, b.cz + z];
    for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i]!, p[i]!); max[i] = Math.max(max[i]!, p[i]!); }
  }
  return { min, max };
}

/** The ballast beds' X spans of a layout. */
function ballastSpans(layout: station.StationLayout): Array<[number, number]> {
  const width = layout.rows.reduce((w, r) => w + r.width, 0);
  const out: Array<[number, number]> = [];
  let x = -width / 2;
  for (const r of layout.rows) {
    const c = x + r.width / 2;
    if (r.type === "rail") out.push([c - station.BALLAST_WIDTH / 2, c + station.BALLAST_WIDTH / 2]);
    x += r.width;
  }
  return out;
}

describe("station set: triangle budgets", () => {
  it("puts every type in a tier", () => {
    expect(Object.keys(TIER).sort()).toEqual(Object.keys(station.TYPE_META).sort());
  });
  for (const type of Object.keys(station.TYPE_META)) {
    it(`${type}: within its ${TIER[type]} budget at every size`, () => {
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        const tris = stationTriangles(station.furnish(type, length, station.buildLayout(type, tracks)));
        expect(tris, `${type} ${tracks}x${length}`).toBeLessThanOrEqual(budget(type, tracks, length));
      }
    });
  }
});

describe("station set: geometry", () => {
  for (const type of Object.keys(station.TYPE_META)) {
    it(`${type}: clear gauge, finite boxes`, () => {
      const clearY = station.PLATFORM_HEIGHT + station.ROOF_HEIGHT;
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        const layout = station.buildLayout(type, tracks);
        const beds = ballastSpans(layout);
        for (const b of station.furnish(type, length, layout)) {
          for (const v of [b.cx, b.cy, b.cz, b.sx, b.sy, b.sz]) expect(Number.isFinite(v)).toBe(true);
          expect(Math.min(b.sx, b.sy, b.sz)).toBeGreaterThan(0.01);
          const { min, max } = bounds(b);
          // 0.2: the lower corner of a tilted slab ending at the platform edge (the
          // shared V-roof's eave) reaches a fifth of a stud past it, outside the gauge
          const over = beds.some(([a, c]) => Math.min(max[0]!, c) - Math.max(min[0]!, a) > 0.2);
          if (over && min[1]! < clearY - 0.05) {
            throw new Error(`${type} ${tracks}x${length}: ${b.material} box at x=${b.cx.toFixed(2)} y=${min[1]!.toFixed(2)}..${max[1]!.toFixed(2)} hangs into a track's gauge`);
          }
        }
      }
    });
  }
});

describe("station set: end ramps", () => {
  // the open-ended types run their platforms down to the terrain over their last
  // 3.5 studs: nothing standing on the deck may stand over a ramp (a bench and the
  // end masts once did)
  const RAMPED = ["platforms_only", "platforms_shared", "cantilever_wings", "concourse", "village_depot", "heritage_canopy"];
  const RAMP = 3.5;
  for (const type of RAMPED) {
    it(`${type}: keeps what stands on the deck off the ramps`, () => {
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        for (const b of station.furnish(type, length, station.buildLayout(type, tracks))) {
          if (["platform", "edge", "safety"].includes(b.material)) continue;
          const { min, max } = bounds(b);
          const standing = Math.abs(min[1]! - station.PLATFORM_HEIGHT) < 0.6;
          const onRamp = Math.max(Math.abs(min[2]!), Math.abs(max[2]!)) > length / 2 - RAMP + 0.01;
          if (standing && onRamp) throw new Error(`${type} ${tracks}x${length}: ${b.material} box at z=${b.cz.toFixed(2)} stands on a ramp`);
        }
      }
    });
  }
});

describe("station set: name boards", () => {
  // the game paints the station's name across a board's faces: no post, mast, tie
  // or column may share its volume (a cantilever wing's tie once crossed one)
  const OCCLUDERS = new Set(["column", "steel"]);
  for (const type of Object.keys(station.TYPE_META)) {
    it(`${type}: keeps every name board clear of posts, masts and ties`, () => {
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        const boxes = station.furnish(type, length, station.buildLayout(type, tracks));
        for (const board of boxes.filter((b) => b.label)) {
          const bb = bounds(board);
          for (const o of boxes) {
            if (o === board || !OCCLUDERS.has(o.material)) continue;
            const ob = bounds(o);
            const overlap = Math.min(...[0, 1, 2].map((i) => Math.min(bb.max[i]!, ob.max[i]!) - Math.max(bb.min[i]!, ob.min[i]!)));
            if (overlap >= 0.05) throw new Error(`${type} ${tracks}x${length}: a ${o.material} box overlaps a name board by ${overlap.toFixed(2)}`);
          }
        }
      }
    });
  }
});

describe("station set: see-through glass", () => {
  // The game draws "glass" see-through (the factory's preview draws it opaque): a
  // dark pane laid on a solid wall or frame shows the wall through it, so a window
  // in a solid wall is drawn with an opaque material. (The village depot's windows
  // once read as pale cream panels in the game.)
  for (const type of Object.keys(station.TYPE_META)) {
    it(`${type}: lays no thin glass pane on a solid face`, () => {
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        const boxes = station.furnish(type, length, station.buildLayout(type, tracks));
        for (const g of boxes) {
          // flat panes and walls: a tilted slab's bounds say little about its faces
          if (g.material !== "glass" || g.rotZ || g.rotX) continue;
          const gb = bounds(g);
          const size = [0, 1, 2].map((i) => gb.max[i]! - gb.min[i]!);
          const thin = size.indexOf(Math.min(...size));
          if (size[thin]! > 0.5) continue;
          for (const o of boxes) {
            if (o === g || o.material === "glass" || o.material === "light" || o.rotZ || o.rotX) continue;
            const ob = bounds(o);
            const covers = [0, 1, 2].every((i) => i === thin
              || (Math.min(gb.max[i]!, ob.max[i]!) - Math.max(gb.min[i]!, ob.min[i]!)) >= 0.9 * size[i]!);
            const gap = Math.max(ob.min[thin]! - gb.max[thin]!, gb.min[thin]! - ob.max[thin]!);
            if (covers && gap <= 0.35) {
              throw new Error(`${type} ${tracks}x${length}: a glass pane at (${g.cx.toFixed(2)}, ${g.cy.toFixed(2)}, ${g.cz.toFixed(2)}) lies on a solid ${o.material} face`);
            }
          }
        }
      }
    });
  }
});

