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
import { CABIN_INSET, clearZones, drawCabin, fitCabin, INTERIOR_PALETTE, INTERIOR_TRIANGLE_BUDGET, seatLayout, seatRows, type Cabin } from "../generator/interior.ts";
import { ALL_VEHICLES, designGlb } from "../generator/generate.ts";
import { renderGlbThumb } from "../generator/renderGlbThumb.ts";
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

  it("raises its floor onto the body's bottom edge where that stands above the floor", () => {
    // the same skirt cut away over the wheels: a floor left at 1.2 m there would show below the body, over the gear
    const at = (x: number) => 0.5 + 1.5 * Math.max(0, Math.min(1, (x - 0.5) * 2, (3.5 - x) * 2));
    const floorTris = (cabin: Cabin) => {
      const { json, bin } = parseGlb(car(new MeshBuilder(PALETTE), cabin).toGlb("t", "t"));
      return collectTriangles(json, bin, { interiors: true }).filter((t) => t.material === "interiorFloor" && t.p.every((p) => Math.abs(p[2]) <= CABIN.half + 1e-6));
    };
    // the floor's height at x, interpolated along each triangle's edge that crosses it
    const heightsAt = (cabin: Cabin, x: number) =>
      floorTris(cabin).flatMap((t) =>
        t.p.flatMap((p, i) => {
          const q = t.p[(i + 1) % 3]!;
          if ((p[0] - x) * (q[0] - x) > 0 || Math.abs(q[0] - p[0]) < 1e-9) return [];
          return [p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0])];
        }),
      );
    expect(Math.min(...heightsAt(CABIN, 2))).toBeCloseTo(CABIN.floor, 6);
    const cut = { ...CABIN, bottom: { at, xs: [0.5, 1, 3, 3.5] } };
    for (const x of [-3, 0.7, 1, 2, 3.2, 5]) {
      const ys = heightsAt(cut, x);
      expect(ys.length).toBeGreaterThan(0);
      for (const y of ys) expect(y).toBeGreaterThanOrEqual(Math.max(CABIN.floor, at(x)) - 1e-9);
    }
    expect(Math.min(...heightsAt(cut, 2))).toBeCloseTo(2.003, 6);
  });

  it("shortens itself to where a tapered shell holds it, narrowing where a door stands in the taper", () => {
    // a body full width (1.4) over |x| <= 4, tapering to 0.9 at its ends, x = +-6.2
    const skin = (x: number) => (Math.abs(x) > 6.2 ? 0 : 1.4 - (0.5 * Math.max(0, Math.abs(x) - 4)) / 2.2);
    const shell = (x: number) => skin(x);
    /** The cabin's triangles, and whether every corner stands inside the shell. */
    const drawn = (cabin: Cabin) => {
      const { json, bin } = parseGlb(car(new MeshBuilder(PALETTE), cabin).toGlb("t", "t"));
      const tris = collectTriangles(json, bin, { interiors: true }).filter((t) => t.interior);
      expect(tris.length).toBeGreaterThan(0);
      for (const t of tris) for (const p of t.p) expect(Math.abs(p[2]), `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`).toBeLessThanOrEqual(skin(p[0]) + 1e-6);
      const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
      return [Math.min(...xs), Math.max(...xs)];
    };
    // doors clear of the taper: the ends move in to where the skin holds the walls, 2 mm outside them
    const inner = { ...CABIN, x0: -6.2, x1: 6.2, doors: [{ s: 1, x0: -3.5, x1: -2.5, y0: 1.2, y1: 3.1 }, { s: -1, x0: 2.5, x1: 3.5, y0: 1.2, y1: 3.1 }], shell };
    const fitted = fitCabin(inner);
    expect(fitted.half).toBe(CABIN.half);
    expect(fitted.x0).toBeCloseTo(-(4 + (2.2 * (1.4 - CABIN.half - 0.002)) / 0.5), 3);
    expect(fitted.x1).toBeCloseTo(-fitted.x0, 6);
    drawn(inner);
    // a door in the taper keeps the cabin behind it, narrowed to CABIN_INSET inside the skin at its jamb
    const outer = { ...CABIN, x0: -6.2, x1: 6.2, shell };
    const narrowed = fitCabin(outer);
    expect(narrowed.half).toBeCloseTo(skin(-5) - CABIN_INSET, 6);
    expect(narrowed.x0).toBeLessThanOrEqual(-5);
    expect(narrowed.x1).toBeGreaterThanOrEqual(5);
    const [lo, hi] = drawn(outer);
    expect(lo).toBeLessThanOrEqual(-5);
    expect(hi).toBeGreaterThanOrEqual(5);
    // without a shell the cabin stands as given
    expect(fitCabin(CABIN)).toBe(CABIN);
  });

  it("lays a doorway's reveal along a skin that narrows across the door, and onto a rising bottom", () => {
    // a door at x = 4..5 where the skin narrows from 1.5 to 1.4 and the body's bottom rises above the floor
    const skin = (_y: number, x: number) => 1.5 - 0.1 * (x - 4);
    const bottom = (x: number) => (x <= 4.5 ? 1.0 : 1.0 + (x - 4.5) * 1.2);
    const cabin: Cabin = { ...CABIN, doors: [{ s: 1, x0: 4, x1: 5, y0: 1.2, y1: 3.1, skin }], bottom: { at: bottom, xs: [4.5, 6] } };
    const { json, bin } = parseGlb(car(new MeshBuilder(PALETTE), cabin).toGlb("t", "t"));
    // the reveal: what reaches out past the side wall
    const reveal = collectTriangles(json, bin, { interiors: true }).filter((t) => t.interior && t.p.some((p) => p[2] > CABIN.half + 1e-6));
    expect(reveal.length).toBeGreaterThan(0);
    for (const t of reveal)
      for (const p of t.p) {
        expect(p[2], `(${p[0].toFixed(3)}, ${p[1].toFixed(3)})`).toBeLessThanOrEqual(skin(p[1], p[0]) + 1e-6);
        if (p[1] < 3) expect(p[1], `(${p[0].toFixed(3)}, ${p[2].toFixed(3)})`).toBeGreaterThanOrEqual(Math.max(1.2, bottom(p[0])) - 1e-6);
      }
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

  it("closes its underside where the bottom rises over a bogie, though a band's chord lies there", () => {
    // Regression: a ramp's underside is, at the ramp's foot, a band's internal chord, left
    // out round a cabin -- so the Bmo and the 471 had a hole there, the cabin showing through
    const c = new Coach({ red: { color: "#c03030" }, cream: { color: "#e0d8c0" }, roof: { color: "#808080" } }, 5);
    const door = { x0: 2, y0: 0.6, x1: 3.2, y1: 2.8 };
    const v: Volume = { ...volume([c.doorOpening(1, door)]), bottom: [[0, 0.5], [6, 0.5], [6.5, 1.5], [10, 1.5]] };
    c.volume(v);
    // the cream band's faces over the ramp lying across the body and facing down
    const pos = (c.m as unknown as { groups: Map<string, { pos: number[] }> }).groups.get("cream")!.pos;
    let under = 0;
    for (let t = 0; t < pos.length; t += 9) {
      const q = [0, 3, 6].map((k): [number, number, number] => [pos[t + k]!, pos[t + k + 1]!, pos[t + k + 2]!]);
      if (!q.every((p) => p[0] >= c.X(6) - 1e-6 && p[0] <= c.X(6.5) + 1e-6)) continue;
      if (!(Math.min(...q.map((p) => p[2])) < 0 && Math.max(...q.map((p) => p[2])) > 0)) continue;
      const [u, w] = [q[1]!.map((x, i) => x - q[0]![i]!), q[2]!.map((x, i) => x - q[0]![i]!)];
      if (u[2]! * w[0]! - u[0]! * w[2]! < 0) under++;
    }
    expect(under).toBeGreaterThan(0);
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
  // the defaults only: every kit's cabin is drawn the same way for its other
  // parameter combinations, and the door tests open their sampled variants
  for (const d of PASSENGER)
    for (const params of variantsUnderTest(d).slice(0, 1)) {
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

describe("no interior shows outside its body", () => {
  // Regression: a cabin's floor hung below a body cut away over its bogies (Bmo), its
  // end walls and floor stood outside tapered ends (M 131.1, the buses), a reveal outside
  // a door in a narrowing nose (GT4). With every door shut and back faces culled as the
  // game culls them, a view with the interior shown must match one without it.
  const views: Array<[string, [number, number, number]]> = [["three-quarter", [0.8, 0.7, 0.9]], ["low", [0.4, -0.08, 1]], ["front", [1, 0.15, 0.25]], ["rear", [-1, 0.15, -0.25]]];
  for (const id of ["proc-vehicle-bmo-double-deck-coach", "proc-vehicle-csd-m131", "proc-vehicle-karosa-renault-citybus-12m", "proc-vehicle-kvag-gt4"])
    it(id, () => {
      const glb = designGlb(id);
      for (const [name, view] of views) {
        const [a, b] = [false, true].map((interiors) => renderGlbThumb(glb, 200, { view, interiors, cull: true }).data);
        const W = 200;
        const differs = (i: number) => Math.abs(a[i]! - b[i]!) + Math.abs(a[i + 1]! - b[i + 1]!) + Math.abs(a[i + 2]! - b[i + 2]!) > 30;
        // a leak, not an edge's antialiasing: a pixel that differs with its four neighbours
        let leak = 0;
        for (let i = 4 * (W + 1); i < a.length - 4 * (W + 1); i += 4) if (differs(i) && differs(i - 4) && differs(i + 4) && differs(i - 4 * W) && differs(i + 4 * W)) leak++;
        expect(leak, `${name} view`).toBe(0);
      }
    });
});
