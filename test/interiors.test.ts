// Vehicle interiors (generator/interior.ts): the generic cabin -- seat rows clear
// of every door, the interior part hidden while the doors are shut, the door
// clips that reveal it -- and every passenger design's cabin behind its doors.
// See docs/models/interiors.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import type { MeshCore } from "../generator/meshCore.ts";
import { openable, doorLeaves } from "../generator/doors.ts";
import { clearZones, drawCabin, INTERIOR_PALETTE, INTERIOR_TRIANGLE_BUDGET, seatLayout, seatRows, type Cabin } from "../generator/interior.ts";
import { ALL_VEHICLES } from "../generator/generate.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { glbStats } from "../generator/glbStats.ts";
import { buildLodModel } from "../generator/lodModel.ts";
import { Coach, type Volume } from "../generator/csdCoachParts.ts";
import { cabinHeights } from "../generator/coachCabin.ts";
import { variantsUnderTest } from "./catalogCache";

const PALETTE = { ...INTERIOR_PALETTE, body: { color: "#808080" }, leaf: { color: "#c03030" } };

/** A 12 m cabin, 2.7 m wide, with a door on each side near either end. */
const CABIN: Cabin = {
  x0: -6, x1: 6, floor: 1.2, ceiling: 3.3, half: 1.35,
  doors: [
    { s: 1, x0: -5, x1: -4, y0: 1.2, y1: 3.1 },
    { s: -1, x0: 4, x1: 5, y0: 1.2, y1: 3.1 },
  ],
};

/** A box car with one opening door on side s and the cabin, into `m`. */
function car<T extends MeshCore>(m: T, cabin = CABIN): T {
  m.box("body", 0, 0, 12.4, 2.8, 1, 3.5);
  for (const d of cabin.doors)
    openable(m, (mm, o) => {
      for (const l of doorLeaves(d.x0, d.x1, d.s, { kind: "plug", leaves: 1 })) mm.moved(l.move(o, d.s * 1.41), () => mm.box("leaf", (l.x0 + l.x1) / 2, d.s * 1.41, l.x1 - l.x0, 0.01, d.y0, d.y1));
    });
  drawCabin(m, cabin);
  return m;
}

describe("the generic cabin", () => {
  it("leaves every seat row out of each door's clear zone, on either side", () => {
    const zones = clearZones(CABIN);
    expect(zones).toHaveLength(2);
    const rows = seatRows(CABIN);
    expect(rows.length).toBeGreaterThan(5);
    for (const x of rows) {
      for (const [a, b] of zones) expect(x + 0.55 <= a + 1e-9 || x >= b - 1e-9).toBe(true);
      expect(x).toBeGreaterThanOrEqual(CABIN.x0);
      expect(x + 0.55).toBeLessThanOrEqual(CABIN.x1);
    }
    // a door on the other side clears the same rows
    const mirrored = seatRows({ ...CABIN, doors: CABIN.doors.map((d) => ({ ...d, s: -d.s })) });
    expect(mirrored).toEqual(rows);
  });

  it("merges overlapping clear zones", () => {
    expect(clearZones({ ...CABIN, doors: [{ s: 1, x0: 0, x1: 1, y0: 1, y1: 3 }, { s: -1, x0: 0.5, x1: 1.5, y0: 1, y1: 3 }] })).toEqual([[-0.35, 1.85]]);
  });

  it("seats 2+2 in a coach, 2+1 in a narrower car, 1+1 in a narrow one", () => {
    expect(seatLayout(2.7)).toEqual([2, 2]);
    expect(seatLayout(2.2)).toEqual([2, 1]);
    expect(seatLayout(1.7)).toEqual([1, 1]);
  });

  it("draws into a hidden interior part that its car's door clips reveal", () => {
    const m = car(new MeshBuilder(PALETTE));
    expect(m.interiors()).toEqual({ interior: ["doors-left", "doors-right"] });
    expect(m.interiorTriangleCount()).toBeGreaterThan(0);
    expect(m.exteriorTriangleCount() + m.interiorTriangleCount()).toBe(m.triangleCount());
    // the GLB marks the node, and its triangles stay out of the model at rest
    const glb = m.toGlb("t", "t");
    const { json, bin } = parseGlb(glb);
    const node = (json.nodes ?? []).find((n) => (n as { name?: string }).name === "interior")!;
    expect(node.extras).toEqual({ interior: true });
    expect((json.scenes![0] as { extras?: { interiors?: unknown } }).extras?.interiors).toEqual(m.interiors());
    expect(collectTriangles(json, bin)).toHaveLength(m.exteriorTriangleCount());
    expect(collectTriangles(json, bin, { interiors: true })).toHaveLength(m.triangleCount());
    expect(glbStats(glb).triangles).toBe(m.exteriorTriangleCount());
    // the JS model builds it hidden
    const group = car(new ThreeMeshBuilder(PALETTE)).toGroup(THREE, "t");
    expect(group.getObjectByName("interior")!.visible).toBe(false);
    expect(group.userData.interiors).toEqual({ interior: ["doors-left", "doors-right"] });
  });

  it("names a car's interior after the car, revealed by that car's doors only", () => {
    const m = new MeshBuilder(PALETTE);
    for (const [name, at] of [["car1", 0], ["car2", 20]] as const)
      m.part(name, [at, 0, 0], () => car(m, { ...CABIN, x0: at - 6, x1: at + 6, doors: CABIN.doors.map((d) => ({ ...d, x0: d.x0 + at, x1: d.x1 + at })) }));
    expect(m.interiors()).toEqual({
      "interior-car1": ["doors-left-car1", "doors-right-car1"],
      "interior-car2": ["doors-left-car2", "doors-right-car2"],
    });
  });

  it("stops its walls at the body's bottom edge where that stands above the floor", () => {
    // a skirt cut away from x = 1 to x = 3, 0.8 m above the floor, with sloped ends (a Bmo over its bogies)
    const at = (x: number) => 0.5 + 1.5 * Math.max(0, Math.min(1, (x - 0.5) * 2, (3.5 - x) * 2));
    // the lowest point of the side-wall triangles that cover x = 2, mid-cut
    const lowest = (cabin: Cabin) => {
      const { json, bin } = parseGlb(car(new MeshBuilder(PALETTE), cabin).toGlb("t", "t"));
      const ys = collectTriangles(json, bin, { interiors: true })
        .filter((t) => t.material === "interiorWall" && t.p.every((p) => Math.abs(Math.abs(p[2]) - CABIN.half) < 1e-4))
        .filter((t) => Math.min(...t.p.map((p) => p[0])) <= 2 && Math.max(...t.p.map((p) => p[0])) >= 2)
        .flatMap((t) => t.p.map((p) => p[1]));
      expect(ys.length).toBeGreaterThan(0);
      return Math.min(...ys);
    };
    expect(lowest(CABIN)).toBeCloseTo(CABIN.floor, 6);
    expect(lowest({ ...CABIN, bottom: { at, xs: [0.5, 1, 3, 3.5] } })).toBeCloseTo(2.0, 6);
  });

  it("refuses an interior no door clip reveals", () => {
    const m = new MeshBuilder(PALETTE);
    m.box("body", 0, 0, 12.4, 2.8, 1, 3.5);
    drawCabin(m, CABIN);
    expect(() => m.interiors()).toThrow(/no door clip/);
  });
});

describe("a coach body with doorways", () => {
  // Regression: the shell drew a chord across the body at every paint band's
  // boundary -- hidden faces while it was closed, but they cut straight through
  // the cabin behind an open door (the Tatra T3's first renders).
  const volume = (openings?: Volume["openings"]): Volume => ({
    name: "body",
    section: [[1.4, 0.5], [1.4, 3.5], [-1.4, 3.5], [-1.4, 0.5]],
    plan: [[0, 1.4], [10, 1.4]],
    bands: [[0.5, 1.2, "red"], [1.2, 2, "cream"], [2, 3.5, "roof"]],
    ...(openings ? { openings } : {}),
  });
  /** The body's triangles lying level across its middle (z = 0) between heights lo and hi, away from its end caps. */
  const chords = (c: Coach, lo = 0.6, hi = 3.4): number => {
    const pos = (c.m as unknown as { groups: Map<string, { pos: number[] }> }).groups;
    let n = 0;
    for (const mat of ["red", "cream", "roof"]) {
      const p = pos.get(mat)?.pos ?? [];
      for (let t = 0; t < p.length; t += 9) {
        const ys = [p[t + 1]!, p[t + 4]!, p[t + 7]!];
        const zs = [p[t + 2]!, p[t + 5]!, p[t + 8]!];
        const xs = [p[t]!, p[t + 3]!, p[t + 6]!];
        if (Math.abs(xs[0]! + xs[1]! + xs[2]!) / 3 > 4.9) continue;
        if (ys.every((y) => Math.abs(y - ys[0]!) < 1e-9) && ys[0]! > lo && ys[0]! < hi && Math.min(...zs) < 0 && Math.max(...zs) > 0) n++;
      }
    }
    return n;
  };

  it("draws no chord across its cabin", () => {
    const shut = new Coach({ red: { color: "#c03030" }, cream: { color: "#e0d8c0" }, roof: { color: "#808080" } }, 5);
    shut.volume(volume());
    expect(chords(shut)).toBeGreaterThan(0);
    const c = new Coach({ red: { color: "#c03030" }, cream: { color: "#e0d8c0" }, roof: { color: "#808080" } }, 5);
    const door = { x0: 4, y0: 0.6, x1: 5.2, y1: 2.8 };
    const v = volume([c.doorOpening(1, door)]);
    c.volume(v);
    c.door(v, 1, door, "red", { opens: { kind: "plug", leaves: 2 } });
    // none between the cabin's floor and ceiling (one at the doorway's cut sill lies under the floor)
    const [floor, ceiling] = cabinHeights(v);
    expect(chords(c, floor, ceiling)).toBe(0);
    expect(chords(c, 0.6, floor)).toBeGreaterThan(0);
  });
});

describe("windows seen from inside", () => {
  it("lay a coach's windows, drawn after its cabin, on the cabin's wall in the cabin's part, but not a door leaf's light", () => {
    const c = new Coach({ red: { color: "#c03030" }, roof: { color: "#808080" } }, 5);
    const v: Volume = { name: "body", section: [[1.4, 0.5], [1.4, 3.5], [-1.4, 3.5], [-1.4, 0.5]], plan: [[0, 1.4], [10, 1.4]], bands: [[0.5, 2, "red"], [2, 3.5, "roof"]] };
    const door = { x0: 4, y0: 0.6, x1: 5.2, y1: 2.8 };
    v.openings = [c.doorOpening(1, door)];
    c.volume(v);
    c.door(v, 1, door, "red", { opens: { kind: "plug", leaves: 1 }, leafWork: (clip) => c.window(v, 1, clip({ x0: 4.2, y0: 1.8, x1: 5, y1: 2.5 })!) });
    c.window(v, -1, { x0: 1, y0: 1.8, x1: 2.4, y1: 2.6 });
    const m = c.m as unknown as { groups: Map<string, { pos: number[]; part: number[] }>; parts: Array<{ name: string }> };
    const panes = m.groups.get("interiorGlass")!;
    // one pane (two triangles), on the far wall, facing in, in the interior part
    expect(panes.part).toHaveLength(2);
    expect(panes.part.every((p) => m.parts[p]!.name === "interior")).toBe(true);
    const zs = panes.pos.filter((_, i) => i % 3 === 2);
    expect(zs.every((z) => z < -1.3 && z > -1.4)).toBe(true);
    expect(c.m.interiorTriangleCount()).toBeGreaterThan(2);
  });

  // a pane per window on every kit's cabins: the coach kit's tram and coach, a bus,
  // the slice-lofted Shinkansen and the VT 18.16
  for (const [id, params] of [["proc-vehicle-tatra-t3", {}], ["proc-vehicle-bmo-double-deck-coach", {}], ["proc-vehicle-karosa-renault-citybus-12m", {}], ["proc-vehicle-shinkansen-0", {}], ["proc-vehicle-dr-vt1816", {}], ["proc-vehicle-tgv-duplex", { unit: "bar" }]] as const)
    it(`${id} shows its windows inside`, () => {
      const m = ALL_VEHICLES.find((d) => d.id === id)!.build(params) as unknown as { groups: Map<string, { part: number[] }>; parts: Array<{ name: string }> };
      const panes = m.groups.get("interiorGlass")?.part ?? [];
      expect(panes.length).toBeGreaterThan(4);
      expect(panes.every((p) => /^interior/.test(m.parts[p]!.name))).toBe(true);
    });
});

/** The groups of passenger vehicles, and the designs among them with no door to open. */
const PASSENGER_GROUPS = new Set(["coach", "unit", "tram", "metro", "bus"]);
const NO_DOORS = new Set(["proc-vehicle-csd-dsk", "proc-vehicle-csd-m112"]);
const PASSENGER = ALL_VEHICLES.filter((d) => PASSENGER_GROUPS.has(d.catalog?.group ?? "") && !NO_DOORS.has(d.id));

describe("every passenger vehicle", () => {
  for (const d of PASSENGER)
    for (const params of variantsUnderTest(d)) {
      it(`${d.id} ${JSON.stringify(params)} has a cabin behind every door, in budget, its seats clear of the doors`, () => {
        const m = d.build(params);
        const doors = m.animations().filter((c) => c.drive.drive === "door").map((c) => c.name);
        if (!doors.length) return;
        // every door clip reveals an interior (a car with cabins in several bodies, the
        // Be31's end vestibules, has one per body), and every interior has a clip
        const interiors = m.interiors()!;
        expect(interiors).not.toBeNull();
        expect([...new Set(Object.values(interiors).flat())].sort()).toEqual([...doors].sort());
        const inner = m as unknown as { groups: Map<string, { pos: number[]; part: number[] }>; parts: Array<{ name: string; parent: number }> };
        for (const name of Object.keys(interiors)) {
          const index = inner.parts.findIndex((p) => p.name === name);
          let tris = 0;
          for (const g of inner.groups.values()) for (const p of g.part) if (p === index) tris++;
          expect(tris, name).toBeGreaterThan(0);
          expect(tris, name).toBeLessThanOrEqual(INTERIOR_TRIANGLE_BUDGET);
          // no seat stands in a door's span: the door leaves' x at rest, of this car
          const car = inner.parts[index]!.parent;
          const spans: Array<[number, number]> = [];
          inner.parts.forEach((p, k) => {
            if (p.parent !== car || !/^door\d+-\d+$/.test(p.name)) return;
            let [lo, hi] = [Infinity, -Infinity];
            for (const g of inner.groups.values())
              for (let t = 0; t < g.part.length; t++) {
                if (g.part[t] !== k) continue;
                for (let c = 0; c < 3; c++) [lo, hi] = [Math.min(lo, g.pos[t * 9 + c * 3]!), Math.max(hi, g.pos[t * 9 + c * 3]!)];
              }
            spans.push([lo, hi]);
          });
          const seats = inner.groups.get("interiorSeat");
          if (!seats) continue;
          for (let t = 0; t < seats.part.length; t++) {
            if (seats.part[t] !== index) continue;
            const xs = [0, 3, 6].map((c) => seats.pos[t * 9 + c]!);
            for (const [lo, hi] of spans) expect(Math.min(...xs) >= hi - 1e-6 || Math.max(...xs) <= lo + 1e-6, `${name}: a seat in the door at ${lo.toFixed(2)}..${hi.toFixed(2)}`).toBe(true);
          }
        }
        // the distant model has none
        expect(buildLodModel(d, params).interiorTriangleCount()).toBe(0);
      });
    }
});
