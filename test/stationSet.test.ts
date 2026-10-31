// The rail station set's furnished geometry (docs/models/sets.md, "Station types"):
// every type over every track count and length the game offers stays within its
// triangle budget, keeps the loading gauge over every track clear, and builds
// finite, non-degenerate boxes.
import { describe, expect, it } from "vitest";
import * as station from "../generator/sets/station.ts";

const TRACKS = [1, 2, 3, 4, 8];
const LENGTHS = [40, 60, 120, 240];

/**
 * The triangle budget of every station type (docs/models/station-types.md, "Triangle
 * budgets"): a fixed part for what a station has once (end facades, boards, the
 * depot's buildings) plus a part per stud of length per track, counting one more
 * track for the outer platforms -- 30,000 for 4 tracks of 120 studs. A station grows
 * with its size the way the trains standing in it do, and stays far below them (a
 * coach is 16,000).
 */
const BUDGET = { ends: 6000, perStud: 40 } as const;

function budget(tracks: number, length: number): number {
  return BUDGET.ends + BUDGET.perStud * length * (tracks + 1);
}

/** A box's extent in the station frame, from the mesh the game draws. */
function bounds(b: station.StationBox): { min: number[]; max: number[] } {
  const [min, max] = station.stationBoxBounds(b);
  return { min, max };
}

/** The lowest point of a box's mesh over the x span [x0, x1] (Infinity if none of it lies there). */
function lowestOver(b: station.StationBox, x0: number, x1: number): number {
  const p = station.stationBoxMesh(b).positions;
  let low = Infinity;
  const inside = (x: number): boolean => x >= x0 && x <= x1;
  for (let t = 0; t < p.length; t += 9) {
    for (let i = 0; i < 3; i++) {
      const ax = p[t + i * 3]!, ay = p[t + i * 3 + 1]!;
      const j = (i + 1) % 3;
      const bx = p[t + j * 3]!, by = p[t + j * 3 + 1]!;
      if (inside(ax)) low = Math.min(low, ay);
      // where the edge crosses either end of the span
      for (const x of [x0, x1]) {
        if ((ax - x) * (bx - x) < 0) low = Math.min(low, ay + ((by - ay) * (x - ax)) / (bx - ax));
      }
    }
  }
  return low;
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
  it("holds 4 tracks of 120 studs to 30,000 triangles", () => {
    expect(budget(4, 120)).toBe(30000);
  });
  for (const type of Object.keys(station.TYPE_META)) {
    it(`${type}: within the budget at every size`, () => {
      for (const tracks of TRACKS) for (const length of LENGTHS) {
        const tris = station.stationTriangles(station.furnish(type, length, station.buildLayout(type, tracks)));
        expect(tris, `${type} ${tracks}x${length}`).toBeLessThanOrEqual(budget(tracks, length));
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
          if (b.shape) {
            // a shape (a curved vault, a round post): its true surface over the beds
            for (const [a, c] of beds) {
              const low = lowestOver(b, a + 0.2, c - 0.2);
              if (low < clearY - 0.05) throw new Error(`${type} ${tracks}x${length}: ${b.material} ${b.shape} at x=${b.cx.toFixed(2)} reaches down to y=${low.toFixed(2)} over a track`);
            }
            continue;
          }
          const { min, max } = bounds(b);
          // 0.2: the lower corner of a tilted slab ending at the platform edge (the
          // shared V-roof's eave) reaches a fifth of a stud past it, outside the
          // gauge; an upright box may not reach over the ballast at all (the
          // passenger kit's coping once overhung it, which the game refuses)
          const slack = b.rotZ || b.rotX ? 0.2 : 0.01;
          const over = beds.some(([a, c]) => Math.min(max[0]!, c) - Math.max(min[0]!, a) > slack);
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
          if (g.material !== "glass" || g.rotZ || g.rotX || g.shape) continue;
          const gb = bounds(g);
          const size = [0, 1, 2].map((i) => gb.max[i]! - gb.min[i]!);
          const thin = size.indexOf(Math.min(...size));
          if (size[thin]! > 0.5) continue;
          for (const o of boxes) {
            if (o === g || o.material === "glass" || o.material === "light" || o.rotZ || o.rotX || o.shape) continue;
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


describe("station set: primitives", () => {
  // The game builds a shape's geometry from stationBoxMesh and the budget counts it
  // with stationBoxTriangles: the two must agree, and a closed shape must face out.
  const base = { cx: 1, cy: 2, cz: 3, sx: 1, sy: 2, sz: 1.5, color: [1, 2, 3] as [number, number, number], material: "steel" as const };
  const SHAPES: station.StationBox[] = [
    { ...base },
    { ...base, profile: "gable" },
    { ...base, rotZ: 0.3, rotX: -0.2 },
    { ...base, shape: "cylinder", sides: 3 },
    { ...base, shape: "cylinder", sides: 12, rotZ: 0.4, rotX: 0.2 },
    { ...base, shape: "sphere", sides: 4 },
    { ...base, shape: "sphere", sides: 10 },
    { ...base, shape: "dome", sides: 4 },
    { ...base, shape: "dome", sides: 16 },
    { ...base, shape: "bar", from: [0, 0, 0], to: [2, 3, 1], sx: 0.2, sy: 0.3 },
    { ...base, shape: "bar", sides: 6, from: [0, 0, 0], to: [0, 3, 0], sx: 0.2, sy: 0.2 },
    { ...base, shape: "arc", sides: 12, arc: { rx: 5, ry: 4, a0: Math.PI, a1: 0, thick: 0.3 } },
    { ...base, shape: "arc", sides: 5, arc: { rx: 3, ry: 3, a0: 0.2, a1: 1.4, thick: 0.6 } },
  ];
  /** The signed volume of a triangle soup: positive when every face looks out. */
  function volume(pos: number[]): number {
    let v = 0;
    for (let i = 0; i < pos.length; i += 9) {
      const [ax, ay, az, bx, by, bz, cx, cy, cz] = pos.slice(i, i + 9) as number[];
      v += (ax! * (by! * cz! - bz! * cy!) - ay! * (bx! * cz! - bz! * cx!) + az! * (bx! * cy! - by! * cx!)) / 6;
    }
    return v;
  }
  it("counts what it draws, and every closed shape faces out", () => {
    for (const b of SHAPES) {
      const mesh = station.stationBoxMesh(b);
      expect(mesh.positions.length / 9, b.shape ?? "box").toBe(station.stationBoxTriangles(b));
      expect(mesh.normals.length).toBe(mesh.positions.length);
      expect(volume(mesh.positions), b.shape ?? "box").toBeGreaterThan(0);
    }
  });
  it("draws a thin glass arc as one sheet", () => {
    const sheet: station.StationBox = { ...base, material: "glass", shape: "arc", sides: 10, arc: { rx: 5, ry: 4, a0: Math.PI, a1: 0, thick: 0.1 } };
    expect(station.stationBoxTriangles(sheet)).toBe(20);
    expect(station.stationBoxMesh(sheet).positions.length / 9).toBe(20);
  });
  it("draws every type's boxes as counted", () => {
    for (const type of Object.keys(station.TYPE_META)) {
      for (const b of station.furnish(type, 120, station.buildLayout(type, 4))) {
        expect(station.stationBoxMesh(b).positions.length / 9).toBe(station.stationBoxTriangles(b));
      }
    }
  });
});
