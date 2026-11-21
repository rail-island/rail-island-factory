// The bridge set's kit (generator/sets/bridge.ts, docs/models/sets.md): what the
// pins cannot say -- the curve sampler keeps its anchors and bounds its work, and
// every box standing on the terrain is tagged `ground`.

import { describe, expect, it } from "vitest";
import * as bridge from "../generator/sets/bridge";

describe("the bridge kit", () => {
  it("keeps mandatory curve anchors and bounds subdivision work", () => {
    const points = bridge.adaptiveCurvePoints((t) => ({ x: t * 100, y: 30 * Math.sin(t * Math.PI), z: 0 }), [0, 0.25, 0.75, 1]);
    expect(points.some((p) => p.x === 25)).toBe(true);
    expect(points.some((p) => p.x === 75)).toBe(true);
    expect(points.length).toBeLessThanOrEqual(260);
    expect(points[0]).toEqual({ x: 0, y: 0, z: 0 });
  });

  it("tags exactly the boxes that stand on the terrain", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 12, z: 0 }, { x: 120, y: 12, z: 0 }], 9, 0, 0.67, 9.9)!;
    const ground = (): number => -8;
    for (const type of Object.keys(bridge.TYPE_META)) {
      for (const box of bridge.buildBridge(type, path, ground)) {
        if (box.shape !== "box") continue;
        const onGround = Math.abs(box.center.y - box.size.y / 2 - ground()) < 1e-9;
        expect(box.ground === true, `${type} ${box.material} at ${box.center.x}`).toBe(onGround);
      }
    }
  });

  it("stands a cantilever on its two tower piers only, with no anchor piers at the span ends", () => {
    // two 90-stud spans: towers at each span's quarters, nothing at 0, 90 or 180
    const path = bridge.pathFromPoints([{ x: 0, y: 30, z: 0 }, { x: 180, y: 30, z: 0 }], 9, 0, 0.67, 9.9)!;
    const piers = bridge.buildBridge("cantilever", path, () => 0).filter((b) => b.shape === "box" && b.part === "support");
    const stations = [...new Set(piers.map((b) => (b.shape === "box" ? Math.round(b.center.x * 10) / 10 : 0)))].sort((a, b) => a - b);
    expect(stations).toEqual([22.5, 67.5, 112.5, 157.5]);
  });

  it("lays footings and starlings at the waterline over a sloping river bed", () => {
    // the bed falls across the path, so on dry ground no footing would be laid
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 100, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const bed = (_x: number, z: number): number => -6 + 0.6 * z;
    const water = (): number => 2;
    const boxes = (type: string, waterAt?: bridge.WaterLevelFn) => bridge.buildBridge(type, path, bed, waterAt).filter((b) => b.shape === "box" && b.part === "support" && !b.ground);
    const topOf = (b: bridge.BridgeBox): number => (b.shape === "box" ? b.center.y + b.size.y / 2 : NaN);
    // concrete: no footing on the dry slope, a caisson to 0.3 above the water in the river
    const dryFootings = boxes("beam").filter((b) => b.material === "pier" && b.shape === "box" && b.size.y < 2 && b.center.y < 0);
    expect(dryFootings).toHaveLength(0);
    const caissons = boxes("beam", water).filter((b) => Math.abs(topOf(b) - 2.3) < 1e-9);
    expect(caissons.length).toBeGreaterThan(0);
    // masonry: a starling 0.8 above the water at every intermediate pier (block and two cutwaters), none dry
    expect(boxes("brick_arch").filter((b) => Math.abs(topOf(b) - 2.8) < 1e-9)).toHaveLength(0);
    const starlings = boxes("brick_arch", water).filter((b) => Math.abs(topOf(b) - 2.8) < 1e-9);
    const piers = bridge.getStructuralSpanRanges("brick_arch", 100).length - 1;
    expect(starlings).toHaveLength(3 * piers);
    for (const b of starlings) expect(b.shape === "box" && b.center.y - b.size.y / 2).toBeLessThanOrEqual(-6 + 1e-9);
  });

  it("keeps the concrete arch's rib under the deck at its crown", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 12, z: 0 }, { x: 60, y: 12, z: 0 }], 9, 0, 0.67, 9.9)!;
    const deckBottom = 12 + 0.67 - bridge.DECK_THICKNESS;
    // the ribs (walls of the pier concrete): their tops never above the deck's underside
    const ribs = bridge.buildBridge("arch", path, () => 0).filter((b) => b.shape === "wall" && b.material === "pier");
    expect(ribs.length).toBe(2);
    for (const b of ribs) if (b.shape === "wall") expect(Math.max(...b.tops)).toBeLessThanOrEqual(deckBottom + 1e-6);
  });

  it("closes a masonry arch's underside between its two faces", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: 24, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
    for (const type of ["stone_arch", "brick_arch"]) {
      const vault = bridge.buildBridge(type, path, () => 0).filter((b) => b.shape === "wall" && b.u0 < -2 && b.u1 > 2);
      expect(vault.length, type).toBe(1);
    }
  });

  it("stands a wide deck on twin columns and a tall pier on a footing", () => {
    const columnsAt = (deckWidth: number): number => {
      const path = bridge.pathFromPoints([{ x: 0, y: 30, z: 0 }, { x: 50, y: 30, z: 0 }], deckWidth, 0, 0.67, 9.9)!;
      const boxes = bridge.buildBridge("beam", path, () => 0).filter((b) => b.shape === "box" && b.part === "support" && b.material === "pier");
      // the middle pier: its shafts are the tapering boxes there
      const mid = boxes.filter((b) => b.shape === "box" && Math.abs(b.center.x - 25) < 0.01);
      // the footing: a plinth sunk into the ground, showing above it, and not charted --
      // the columns standing on the terrain are what the game charts for ships
      expect(mid.some((b) => b.shape === "box" && !b.ground && b.size.y < 1 && b.center.y - b.size.y / 2 < 0 && b.center.y + b.size.y / 2 > 0), "footing").toBe(true);
      const columns = mid.filter((b) => b.shape === "box" && b.topScale !== undefined);
      expect(columns.every((b) => b.ground), "columns charted").toBe(true);
      return columns.length;
    };
    expect(columnsAt(9)).toBe(1);
    expect(columnsAt(17)).toBe(2);
  });

  it("gives a masonry viaduct's intermediate piers cutwaters, and its abutments none", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 60, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const turned = bridge.buildBridge("stone_arch", path, () => 0).filter((b) => b.shape === "box" && Math.abs(b.yaw - Math.PI / 2 - Math.PI / 4) < 1e-6);
    const stations = [...new Set(turned.map((b) => (b.shape === "box" ? Math.round(b.center.x) : 0)))].sort((a, b) => a - b);
    expect(stations).toEqual([20, 40]);
  });

  it("shares a cable bridge's towers between its main spans", () => {
    for (const type of ["suspension", "cable_stayed"]) {
      const maxMain = bridge.TYPE_META[type]!.maxSpan!;
      for (const length of [60, 160, 300, 500]) {
        const towers = bridge.cableTowerDistances(type, length);
        const main = towers.length > 1 ? towers[1]! - towers[0]! : 0;
        // back spans half a main span, main spans within the limit, towers evenly spaced
        expect(towers[0]!, `${type} ${length}`).toBeCloseTo(main / 2, 6);
        expect(length - towers[towers.length - 1]!).toBeCloseTo(main / 2, 6);
        expect(main).toBeLessThanOrEqual(maxMain + 1e-9);
        // one overhead member per tower, and nothing else
        expect(bridge.overheadMembers(type, length, 9, 9.9).map((m) => m.t * length)).toEqual(towers.map((d) => expect.closeTo(d, 6)));
        // the piers stand under the towers only (plus the anchor blocks and wing walls at the ends)
        const path = bridge.pathFromPoints([{ x: 0, y: 30, z: 0 }, { x: length, y: 30, z: 0 }], 9, 0, 0.67, 9.9)!;
        const piers = bridge.buildBridge(type, path, () => 0).filter((b) => b.shape === "box" && b.ground && b.center.x > 5 && b.center.x < length - 5);
        const stations = [...new Set(piers.map((b) => (b.shape === "box" ? Math.round(b.center.x * 100) / 100 : 0)))];
        expect(stations).toEqual(towers.map((d) => Math.round(d * 100) / 100));
      }
    }
    expect(bridge.cableTowerDistances("suspension", 300)).toHaveLength(3);
  });

  it("samples a level member along a bend at the path's own vertices only", () => {
    // a 160-stud arc of radius 120, a vertex every 4 studs: a chord at a constant
    // height is straight between vertices, so it needs no point between them
    const points = Array.from({ length: 41 }, (_, i) => { const a = (160 / 120) * (i / 40); return { x: 120 * Math.sin(a), y: 30, z: 120 * (1 - Math.cos(a)) }; });
    const path = bridge.pathFromPoints(points, 9, 0, 0.67, 9.9)!;
    const chords = bridge.buildBridge("deck_truss", path, () => 0).filter((b) => b.shape === "ribbon" && b.sampled);
    expect(chords.length).toBeGreaterThan(0);
    // each span (three of about 53 studs) holds 14 or 15 of the path's vertices
    for (const c of chords) if (c.shape === "ribbon") expect(c.points.length).toBeLessThanOrEqual(16);
  });

  it("hangs every point member on a real crossbeam, above the wires", () => {
    for (const [type, length] of [["truss", 30], ["truss", 60], ["truss", 64], ["cantilever", 90], ["cantilever", 160], ["tied_arch", 60], ["network_arch", 100]] as const) {
      const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: length, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
      const boxes = bridge.buildBridge(type, path, () => 0);
      const crossbeams = boxes.filter((b) => b.shape === "strut" && Math.abs(b.a.x - b.b.x) < 1e-6 && Math.abs(b.a.z - b.b.z) > 8);
      const deckCentreY = 20 + 0.67 - bridge.DECK_THICKNESS / 2;
      const members = bridge.overheadMembers(type, length, 9, 9.9);
      expect(members.length).toBeGreaterThanOrEqual(2);
      for (const m of members) {
        if (m.kind !== "point") throw new Error("a truss member is a point");
        // a crossbeam crosses at that station, at that height, its underside over the wires
        const beam = crossbeams.find((b) => b.shape === "strut" && Math.abs(b.a.x - m.t * length) < 1e-6 && Math.abs(b.a.y - deckCentreY - m.localY) < 1e-6);
        expect(beam, `${type} ${length} at ${m.t}`).toBeDefined();
        if (beam?.shape === "strut") expect(m.localY - beam.thick / 2, `${type} ${length}`).toBeGreaterThanOrEqual(9.9);
      }
      // the truss's end posts lean: nothing stands vertical at the span's ends
      if (type === "truss") expect(boxes.some((b) => b.shape === "strut" && Math.abs(b.a.x) < 1e-6 && Math.abs(b.b.x) < 1e-6 && b.b.y - b.a.y > 5)).toBe(false);
    }
  });

  it("keeps the Y pylon's converging stays clear of a lone track up to the wires", () => {
    // the game's clearance (railhead + messenger + margin, deck-local); a stay may
    // come no nearer than 1.5 studs to the centreline track anywhere below it
    const clearanceY = 13.16, deckCentre = 30 + 0.67 - bridge.DECK_THICKNESS / 2;
    for (const length of [60, 160, 300]) {
      const path = bridge.pathFromPoints([{ x: 0, y: 30, z: 0 }, { x: length, y: 30, z: 0 }], 9, 0, 0.67, clearanceY)!;
      const stays = bridge.buildBridge("cable_stayed_y", path, () => 0).filter((b) => b.shape === "strut" && b.material === "cable");
      expect(stays.length).toBeGreaterThan(0);
      for (const st of stays) {
        if (st.shape !== "strut") continue;
        const [hi, lo] = st.a.y > st.b.y ? [st.a, st.b] : [st.b, st.a];
        for (let k = 0; k <= 20; k++) {
          const p = { y: lo.y + ((hi.y - lo.y) * k) / 20, z: lo.z + ((hi.z - lo.z) * k) / 20 };
          if (p.y - deckCentre <= clearanceY) expect(Math.abs(p.z), `${length} at y ${p.y}`).toBeGreaterThanOrEqual(1.5);
        }
      }
      // the legs stand upright to above the wires: a span member's verticals
      const members = bridge.overheadMembers("cable_stayed_y", length, 9, clearanceY);
      expect(members.every((m) => m.kind === "span")).toBe(true);
    }
  });

  it("builds only finite numbers for every type on odd-length, curved, sloping, two-lane paths", () => {
    // regression: a station rounded a hair past the span's end took the plate
    // girder's rounded-end formula below zero under a square root (NaN tops)
    const finite = (v: unknown): boolean => (typeof v === "number" ? Number.isFinite(v) : Array.isArray(v) ? v.every(finite) : v && typeof v === "object" ? Object.values(v).every(finite) : true);
    for (const length of [57.31791, 123.456789]) {
      const points = Array.from({ length: 23 }, (_, i) => { const a = (length / 90) * (i / 22); return { x: 90 * Math.sin(a), y: 20 + 3 * (i / 22), z: 90 * (1 - Math.cos(a)) }; });
      const path = bridge.pathFromPoints(points, 17, 4, 0.67, 13.16)!;
      for (const type of Object.keys(bridge.TYPE_META)) {
        const boxes = bridge.buildBridge(type, path, () => 0);
        expect(boxes.every(finite), `${type} ${length}`).toBe(true);
        expect(bridge.lowDetailBoxes(boxes).every(finite), `${type} ${length} distant`).toBe(true);
      }
    }
  });

  it("lays a pier's footing plinth only on flat ground, and never leaves a pier hanging off a slope", () => {
    // regression: the plinth was sunk at the height under the pier's centre whatever
    // the ground did, so on a hillside a flat slab jutted out of the slope downhill
    const plinths = (boxes: bridge.BridgeBox[]) => boxes.filter((b) => b.shape === "box" && b.part === "support" && !b.ground && (b.material === "pier" || b.material === "tower") && Math.abs(b.size.y - 0.8) < 1e-9);
    const slopes: Array<[string, bridge.TerrainHeightFn]> = [["across", (_x, z) => 0.7 * z], ["along", (x) => 0.35 * x]];
    for (const [name, heightAt] of slopes) {
      for (const [type, width] of [["beam", 9], ["beam", 17], ["arch", 9]] as const) {
        const path = bridge.pathFromPoints([{ x: 0, y: 40, z: 0 }, { x: 60, y: 40, z: 0 }], width, 0, 0.67, 13.16)!;
        const boxes = bridge.buildBridge(type, path, heightAt);
        expect(plinths(boxes), `${type} ${width} ${name}: a plinth on a slope`).toHaveLength(0);
        // every charted box reaches the lowest ground under its four corners
        for (const b of boxes) {
          if (b.shape !== "box" || !b.ground) continue;
          const foot = b.center.y - b.size.y / 2;
          // the path runs along +x: a box's width lies along z, its depth along x
          const corners = [-1, 1].flatMap((sx) => [-1, 1].map((sz) => heightAt(b.center.x + (sz * b.size.z) / 2, b.center.z + (sx * b.size.x) / 2)));
          expect(foot, `${type} ${width} ${name} at ${b.center.x.toFixed(1)}`).toBeLessThanOrEqual(Math.min(...corners) + 1e-6);
        }
      }
    }
    // ...and a flat crossing keeps its plinths
    const flat = bridge.buildBridge("beam", bridge.pathFromPoints([{ x: 0, y: 40, z: 0 }, { x: 60, y: 40, z: 0 }], 9, 0, 0.67, 13.16)!, () => 0);
    expect(plinths(flat).length).toBeGreaterThan(0);
  });

  it("colours every box from the type's parameters: steel in its paint, caps and copings in a lighter band", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: 60, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
    const steel = (type: string, params?: bridge.BridgeParams): string[] =>
      [...new Set(bridge.buildBridge(type, path, () => 0, undefined, {}, params).filter((b) => b.material === "steel" && b.part === "frame").map((b) => b.color!.join(",")))];
    for (const type of Object.keys(bridge.TYPE_META)) {
      expect(bridge.buildBridge(type, path, () => 0).every((b) => b.color !== undefined), type).toBe(true);
      // each paint draws its own steel
      const paint = bridge.TYPE_PARAMS[type]!.find((p) => p.name === "paint");
      // (a beam bridge's paint shows on its steel plate girders)
      const shape: Record<string, string> = type === "beam" ? { girders: "plate" } : {};
      if (paint) expect(new Set(paint.values.map((v) => steel(type, { ...shape, paint: v.value }).join("|"))).size, type).toBe(paint.values.length);
    }
    // a concrete pier's cap is lighter than its shaft
    const beam = bridge.buildBridge("beam", path, () => 0);
    const light = (c: bridge.Rgb): number => c[0] + c[1] + c[2];
    const caps = beam.filter((b) => b.part === "support" && b.material === "pier" && b.color && light(b.color) > light(bridge.COLORS.pier) + 100);
    expect(caps.length).toBeGreaterThan(0);
  });

  it("lists each type's own parameters, a default among the values of each", () => {
    const lists = new Set<string>();
    for (const type of Object.keys(bridge.TYPE_META)) {
      const params = bridge.TYPE_PARAMS[type]!;
      expect(params.length, type).toBeGreaterThan(0);
      for (const p of params) expect(p.values.map((v) => v.value), `${type} ${p.name}`).toContain(p.default);
      lists.add(JSON.stringify(params));
    }
    // no two types offer the same choices
    expect(lists.size).toBe(Object.keys(bridge.TYPE_META).length);
  });

  it("builds the piers of the material chosen", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 120, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const mid = (type: string, piers: string) => bridge.buildBridge(type, path, () => 0, undefined, {}, { piers }).filter((b) => b.part === "support" && b.shape !== "ribbon" && "center" in b ? Math.abs(b.center.x - 60) < 4 : b.shape === "strut" && Math.abs((b.a.x + b.b.x) / 2 - 60) < 4);
    expect(mid("plate_girder", "concrete").some((b) => b.material === "pier" && b.shape === "box" && b.topScale !== undefined)).toBe(true);
    expect(mid("plate_girder", "brick").some((b) => b.material === "brick" && b.ground)).toBe(true);
    // a steel trestle: four legs on pedestals charted for ships
    const steel = mid("plate_girder", "steel");
    expect(steel.filter((b) => b.shape === "strut" && b.material === "steel").length).toBeGreaterThanOrEqual(4);
    expect(steel.filter((b) => b.shape === "box" && b.ground).length).toBe(4);
    // the truss stands on stone by default, concrete when chosen
    expect(mid("truss", "stone").some((b) => b.material === "stone" && b.ground)).toBe(true);
    expect(bridge.buildBridge("truss", path, () => 0).filter((b) => b.material === "stone" && b.ground).length).toBeGreaterThan(0);
    expect(mid("truss", "concrete").some((b) => b.material === "pier" && b.ground)).toBe(true);
  });

  it("reads a retired type as its type with the parameters it stands for", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 100, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    for (const [old, now] of Object.entries(bridge.RETIRED_TYPES)) {
      expect(bridge.TYPE_META[old], old).toBeUndefined();
      expect(bridge.storedBridge(old)).toEqual({ type: now.type, params: now.params });
      // the old id draws exactly as its type with those parameters
      expect(bridge.buildBridge(old, path, () => 0)).toEqual(bridge.buildBridge(now.type, path, () => 0, undefined, {}, now.params));
      expect(bridge.overheadMembers(old, 100, 9, 9.9)).toEqual(bridge.overheadMembers(now.type, 100, 9, 9.9));
    }
    // a stored bridge's own parameters win over the retired ones
    expect(bridge.storedBridge("brick_arch", { masonry: "yellowBrick" }).params).toEqual({ masonry: "yellowBrick" });
    expect(bridge.buildBridge("brick_arch", path, () => 0).some((b) => b.material === "brick")).toBe(true);
    expect(bridge.buildBridge("stone_arch", path, () => 0).some((b) => b.material === "brick")).toBe(false);
  });

  it("carries a single shaft under a wider cap as a hammerhead", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: 50, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
    const heads = bridge.buildBridge("beam", path, () => 0).filter((b) => b.shape === "wall" && b.part === "support" && b.material === "pier");
    expect(heads.length).toBeGreaterThan(0);
    for (const h of heads) {
      if (h.shape !== "wall") continue;
      // across the deck (stations along z), deeper at the shaft than at its tips
      expect(Math.abs(h.points[0]!.z - h.points[h.points.length - 1]!.z)).toBeGreaterThan(5);
      expect(Math.min(h.bottoms[1]!, h.bottoms[2]!)).toBeLessThan(h.bottoms[0]! - 0.5);
    }
  });

  it("stands a through truss on stone piers with a capstone band", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 128, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const mid = bridge.buildBridge("truss", path, () => 0).filter((b) => b.shape === "box" && (b.part === "support" || b.part === "detail") && Math.abs(b.center.x - 64) < 0.01);
    expect(mid.some((b) => b.material === "stone" && b.ground)).toBe(true);
    const block = mid.find((b) => b.ground)!, band = mid.find((b) => !b.ground && b.material === "stone");
    if (block?.shape !== "box" || band?.shape !== "box") throw new Error("a truss pier is a block and a band");
    expect(band.size.x).toBeGreaterThan(block.size.x);
    expect(bridge.COLORS.stone.reduce((a, c) => a + c)).toBeLessThan(band.color!.reduce((a, c) => a + c));
  });

  it("closes an end over a bank on an abutment, and keeps the end pier over a deep crossing", () => {
    // a 60-stud bridge between two banks at the track bed's height: deep in the middle
    const path = bridge.pathFromPoints([{ x: 0, y: 20, z: 0 }, { x: 60, y: 20, z: 0 }], 9, 0, 0.67, 9.9)!;
    const banks = (x: number): number => (x < 2 || x > 58 ? 20 - 6 : 0);
    for (const type of ["beam", "box_girder", "plate_girder", "deck_truss", "truss", "tied_arch"]) {
      const boxes = bridge.buildBridge(type, path, banks);
      // no pier column right at either end: the breast wall, as wide as the deck, stands there
      const atEnd = (b: bridge.BridgeBox, x: number): boolean => b.shape === "box" && Math.abs(b.center.x - x) < 2.5;
      for (const x of [0, 60]) {
        // (under a deep end -- a deck truss -- the backwall is what stands on the bank)
        const walls = boxes.filter((b) => atEnd(b, x) && b.shape === "box" && b.ground && b.size.x > 9);
        expect(walls.length, `${type} at ${x}`).toBeGreaterThanOrEqual(1);
        expect(boxes.some((b) => atEnd(b, x) && b.shape === "box" && b.topScale !== undefined), `${type} end pier at ${x}`).toBe(false);
      }
      // a wing wall each side at each end, running back along the bank beyond the deck
      const wings = boxes.filter((b) => b.shape === "wall" && b.part === "support" && b.points.some((p) => p.x < -3 || p.x > 63));
      expect(wings.length, type).toBe(4);
    }
    // where the deck lies on the ground (the bank level with it) nothing at the ends is charted
    const level = bridge.buildBridge("beam", path, (x) => (x < 2 || x > 58 ? 20 + 0.67 : 0));
    expect(level.filter((b) => b.shape === "box" && b.ground && (b.center.x < 3 || b.center.x > 57))).toHaveLength(0);
    // over a deep crossing the end stands on its pier, as before
    const deep = bridge.buildBridge("beam", path, () => 0);
    expect(deep.some((b) => b.shape === "box" && b.topScale !== undefined && Math.abs(b.center.x) < 0.01)).toBe(true);
  });

  it("draws a masonry arch with the photo of the stone or brick chosen", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 60, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const surfaces = (masonry: string) => new Set(bridge.buildBridge("stone_arch", path, () => 0, undefined, {}, { masonry }).filter((b) => b.material === "stone" || b.material === "brick").map((b) => `${b.material}@${b.surface}`));
    expect(surfaces("sandstone")).toEqual(new Set(["stone@bridge-sandstone"]));
    expect(surfaces("limestone")).toEqual(new Set(["stone@bridge-limestone"]));
    expect(surfaces("granite")).toEqual(new Set(["stone@bridge-granite"]));
    expect(surfaces("blueBrick")).toEqual(new Set(["brick@bridge-brick-blue"]));
    expect(surfaces("yellowBrick")).toEqual(new Set(["brick@bridge-brick-yellow"]));
    // a tone of the masonry (the vault) keeps the photo
    const vault = bridge.buildBridge("stone_arch", path, () => 0, undefined, {}, { masonry: "blueBrick" }).find((b) => b.shape === "wall" && b.part === "detail" && b.material === "brick");
    expect(vault?.surface).toBe("bridge-brick-blue");
  });

  it("stands statues on a masonry arch's piers and gate towers over its ends, when chosen", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 100, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    const build = (params: bridge.BridgeParams) => bridge.buildBridge("stone_arch", path, () => 0, undefined, {}, params);
    const heads = (boxes: bridge.BridgeBox[]) => boxes.filter((b) => b.shape === "box" && b.material === "stone" && b.part === "detail" && Math.abs(b.size.x - 0.44) < 1e-9);
    const piers = bridge.getStructuralSpanRanges("stone_arch", 100).length - 1;
    expect(heads(build({}))).toHaveLength(0);
    expect(heads(build({ statues: "piers" }))).toHaveLength(2 * piers);
    // a gate tower: two walls on the ground beside the deck, the passage clear to the wires
    const walls = (boxes: bridge.BridgeBox[]) => boxes.filter((b) => b.shape === "box" && b.ground && b.part === "frame" && b.size.z === 7);
    expect(walls(build({}))).toHaveLength(0);
    // the first end, the second end, both
    const at = (boxes: bridge.BridgeBox[]) => walls(boxes).map((b) => (b.shape === "box" && b.center.x < 50 ? "first" : "second"));
    expect(new Set(at(build({ gates: "one" })))).toEqual(new Set(["first"]));
    expect(new Set(at(build({ gates: "two" })))).toEqual(new Set(["second"]));
    const both = build({ gates: "both" });
    expect(walls(both)).toHaveLength(4);
    // the passage just tall enough: the arch clears the wires over the track (the
    // deck's middle, within 1 stud), and springs low, above a vehicle's roof
    const arch = both.find((b) => b.shape === "wall" && b.part === "frame" && b.u1 - b.u0 === 7);
    if (arch?.shape !== "wall") throw new Error("the arch over the passage is a wall");
    const deckCentre = 24 + 0.67 - bridge.DECK_THICKNESS / 2;
    const over = arch.points.map((p, i) => ({ z: p.z, y: arch.bottoms[i]! - deckCentre })).filter((q) => Math.abs(q.z) <= 1);
    expect(Math.min(...over.map((q) => q.y))).toBeGreaterThanOrEqual(9.9);
    expect(Math.min(...arch.bottoms) - deckCentre).toBeLessThan(9.9);
    expect(Math.max(...arch.bottoms) - deckCentre).toBeLessThan(9.9 + 3);
  });

  it("builds a beam bridge as the structure its girders choose, the retired types as before", () => {
    const path = bridge.pathFromPoints([{ x: 0, y: 24, z: 0 }, { x: 150, y: 24, z: 0 }], 9, 0, 0.67, 9.9)!;
    expect(bridge.getStructuralSpanRanges("beam", 150)).toHaveLength(1);
    expect(bridge.getStructuralSpanRanges("beam", 150, { girders: "box" })).toHaveLength(3);
    expect(bridge.getStructuralSpanRanges("beam", 150, { girders: "plate" })).toHaveLength(3);
    expect(bridge.getStructuralSpanRanges("box_girder", 150)).toHaveLength(3);
    for (const [old, now] of [["box_girder", { girders: "box" }], ["plate_girder", { girders: "plate", paint: "green" }]] as const) {
      expect(bridge.buildBridge(old, path, () => 0)).toEqual(bridge.buildBridge("beam", path, () => 0, undefined, {}, now));
    }
    // the steel plate girders are steel, the concrete beams are not
    expect(bridge.buildBridge("beam", path, () => 0, undefined, {}, { girders: "plate" }).some((b) => b.material === "steel" && b.part === "frame")).toBe(true);
    expect(bridge.buildBridge("beam", path, () => 0).some((b) => b.material === "steel" && b.part === "frame")).toBe(false);
  });
});
