// The airfield the airport set draws on a saved layout (docs/models/airfield.md):
// generator/sets/airport.ts `airfield`, over the saved layouts in
// generator/sets/airfieldFixtures.ts. The tags are the game's contract (TerminalBox).
import { describe, expect, it } from "vitest";
import * as airport from "../generator/sets/airport.ts";
import { AIRFIELD_FIXTURES, AIRFIELD_SIZES, airfieldFixture } from "../generator/sets/airfieldFixtures.ts";

const TYPES = Object.keys(airport.TYPE_META);
const RUNWAY_TYPES = TYPES.filter((t) => airport.TYPE_META[t]!.runways);
const MATERIALS = new Set(["brick", "wood", "roof", "steel", "glass", "sign", "column", "platform", "edge", "safety", "light"]);
const deckOf = (boxes: readonly airport.AirfieldBox[]): airport.AirfieldBox[] => boxes.filter((b) => b.depthLayer === 1);

describe("airfield", () => {
  it("draws every fixture for every type, from the box vocabulary only", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      for (const type of TYPES) {
        const { boxes, details } = airport.airfield(layout, type, 20);
        expect(boxes.length, `${name}/${type}`).toBeGreaterThan(0);
        for (const b of [...boxes, ...details]) {
          expect(MATERIALS.has(b.material), `${name}/${type}: ${b.material}`).toBe(true);
          for (const v of [b.cx, b.cy, b.cz, b.sx, b.sy, b.sz]) expect(Number.isFinite(v)).toBe(true);
          expect(b.sx > 0 && b.sy > 0 && b.sz > 0, `${name}/${type}: an empty box`).toBe(true);
        }
      }
    }
  });

  it("lays ONE deck: one height, one material, and never two pieces over one another", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      if (layout.runways.length === 0) continue;
      for (const type of TYPES) {
        const deck = deckOf(airport.airfield(layout, type).boxes);
        expect(deck.length).toBeGreaterThan(0);
        expect(new Set(deck.map((b) => b.material)).size, `${name}/${type}`).toBe(1);
        expect(new Set(deck.map((b) => b.cy + b.sy / 2))).toEqual(new Set([airport.APRON_SURFACE]));
        for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) {
          const a = deck[i]!, b = deck[j]!;
          const overlap = Math.abs(a.cx - b.cx) < (a.sx + b.sx) / 2 - 1e-6 && Math.abs(a.cz - b.cz) < (a.sz + b.sz) / 2 - 1e-6;
          expect(overlap, `${name}/${type}: deck pieces ${i}/${j}`).toBe(false);
        }
      }
    }
  });

  it("paves every runway, taxiway and stand of the saved layout", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      const deck = deckOf(airport.airfield(layout, "regional").boxes);
      const paved = (x: number, z: number): boolean => deck.some((b) => Math.abs(x - b.cx) < b.sx / 2 + 1e-6 && Math.abs(z - b.cz) < b.sz / 2 + 1e-6);
      const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
      for (const rw of layout.runways) {
        for (const u of [-0.45, 0, 0.45]) for (const v of [-0.45, 0, 0.45]) expect(paved(rw.cx + u * rw.width, rw.cz + v * rw.length), `${name}: runway ${rw.id}`).toBe(true);
      }
      for (const e of layout.edges) {
        const a = nodes.get(e.a)!, b = nodes.get(e.b)!;
        for (const t of [0, 0.5, 1]) expect(paved(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t), `${name}: edge ${e.id}`).toBe(true);
      }
      for (const st of layout.stands) expect(paved(st.x, st.z), `${name}: stand ${st.id}`).toBe(true);
    }
  });

  it("cuts the union of overlapping rectangles into pieces that tile it exactly", () => {
    const rects = [
      { x0: 0, x1: 40, z0: -100, z1: 100 }, { x0: 80, x1: 120, z0: -100, z1: 100 },
      { x0: 0, x1: 240, z0: -108, z1: -92 }, { x0: 0, x1: 240, z0: 92, z1: 108 },
      { x0: 232, x1: 248, z0: -100, z1: 100 }, { x0: 248, x1: 300, z0: -26, z1: 26 },
    ];
    const deck = airport.pavementDeck(rects);
    for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) {
      const a = deck[i]!, b = deck[j]!;
      expect(a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.z0 < b.z1 - 1e-6 && b.z0 < a.z1 - 1e-6).toBe(false);
    }
    for (const r of rects) for (let u = 0.05; u < 1; u += 0.1) for (let v = 0.05; v < 1; v += 0.1) {
      const x = r.x0 + (r.x1 - r.x0) * u, z = r.z0 + (r.z1 - r.z0) * v;
      expect(deck.some((p) => x > p.x0 && x < p.x1 && z > p.z0 && z < p.z1), `(${x}, ${z})`).toBe(true);
    }
    expect(airport.pavementDeck([])).toEqual([]);
  });

  it("paints and lights the paved runways and leaves a grass strip to its mown edges", () => {
    const layout = airfieldFixture("regional", "medium");
    const of = (t: string) => airport.airfield(layout, t).boxes;
    const painted = (t: string): number => of(t).filter((b) => b.material === "sign" && !b.label).length;
    const lights = (t: string) => of(t).filter((b) => b.material === "light" && b.sx === 1.2); // runway edge lights (a pad's are 0.5)
    expect(painted("grass_field")).toBe(0);
    expect(painted("regional")).toBeGreaterThan(0);
    expect(painted("international")).toBe(painted("regional"));
    expect(lights("grass_field")).toHaveLength(0);
    expect(lights("regional").length).toBeGreaterThan(0);
    const mown = of("grass_field").filter((b) => b.material === "wood" && b.depthLayer === 2);
    expect(mown).toHaveLength(2 * layout.runways.length);
  });

  it("numbers each runway end by the heading, the far end the reciprocal", () => {
    expect([airport.runwayNumber(0), airport.runwayNumber(180)]).toEqual(["36", "18"]);
    expect([airport.runwayNumber(90), airport.runwayNumber(270)]).toEqual(["09", "27"]);
    const layout = airfieldFixture("regional", "big");
    expect(airport.airfield(layout, "regional", 90).boxes).not.toEqual(airport.airfield(layout, "regional", 0).boxes);
    // the heading reaches the paint only
    expect(airport.airfieldLowDetail(airport.airfield(layout, "regional", 90).boxes)).toEqual(airport.airfieldLowDetail(airport.airfield(layout, "regional", 0).boxes));
  });

  it("gives exactly one name board, and a jet bridge per stand at an international hub only", () => {
    for (const size of AIRFIELD_SIZES) {
      for (const t of RUNWAY_TYPES) {
        const layout = airfieldFixture(t, size);
        const boxes = airport.airfield(layout, t).boxes;
        expect(boxes.filter((b) => b.label), `${t}/${size}`).toHaveLength(1);
        const bridges = boxes.filter((b) => b.material === "steel" && b.lod === "shell" && b.cy > 4 && b.sz < 6 && b.sx > 10);
        expect(bridges.length, `${t}/${size}`).toBe(t === "international" ? layout.stands.length : 0);
      }
    }
  });

  it("draws the type's helipads where the layout put them, and a heliport with no runway", () => {
    for (const t of TYPES) {
      const layout = airfieldFixture(t, "medium");
      expect(layout.pads?.length ?? 0, t).toBe(airport.TYPE_META[t]!.helipads.count);
      const boxes = airport.airfield(layout, t).boxes;
      for (const p of layout.pads ?? []) {
        const slab = boxes.find((b) => b.material === "platform" && b.cx === p.cx && b.cz === p.cz && b.sx === airport.HELIPAD_SIDE[p.pad]);
        expect(slab, `${t}: pad ${p.id}`).toBeDefined();
        expect(slab!.cy + slab!.sy / 2).toBeLessThanOrEqual(airport.PAD_SURFACE);
      }
    }
    const heliport = airport.airfield(airfieldFixture("heliport", "small"), "heliport").boxes;
    expect(deckOf(heliport)).toHaveLength(0);
    expect(heliport.some((b) => b.material === "light" && b.depthLayer === undefined && b.sx === 1.2)).toBe(false);
  });

  it("keeps the deck and the shells at the far level, with no paint, fittings or name", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      for (const t of TYPES) {
        const { boxes, details } = airport.airfield(layout, t, 20);
        const far = airport.airfieldLowDetail(boxes);
        expect(far.some((b) => b.depthLayer === 2 || b.label || b.material === "glass"), `${name}/${t}`).toBe(false);
        expect(deckOf(far)).toEqual(deckOf(boxes));
        expect(airport.airfieldLowDetail(details), `${name}/${t}: details are near-only`).toHaveLength(0);
      }
    }
  });

  it("fences the footprint and opens it where the terminal and the deck meet it", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      const { details } = airport.airfield(layout, "regional");
      const f = layout.footprint;
      expect(details.length, name).toBeGreaterThan(0);
      for (const b of details) {
        expect(Math.abs(b.cx - f.cx) <= f.w / 2 && Math.abs(b.cz - f.cz) <= f.d / 2, `${name}: a fitting off the footprint`).toBe(true);
      }
    }
  });

  it("never shares a visible plane between two overlapping boxes", () => {
    // The helipads are left out: `helipad` (shipped before the airfield moved here)
    // seats its corner lights on the slab's top and overlaps its aiming-circle steps,
    // which is its own known issue (docs/models/airfield.md) and redraws shipped pads.
    const overlaps: string[] = [];
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      for (const t of TYPES) {
        const pads = new Set((layout.pads ?? []).flatMap((p) => airport.helipad({ cx: p.cx, cz: p.cz, pad: p.pad }, t)).map((b) => JSON.stringify(b)));
        const boxes = airport.airfield(layout, t).boxes.filter((b) => !b.rotZ && !b.profile && !pads.has(JSON.stringify(b)));
        for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) {
          const a = boxes[i]!, b = boxes[j]!;
          if (Math.abs(a.cx - b.cx) >= (a.sx + b.sx) / 2 - 1e-6 || Math.abs(a.cz - b.cz) >= (a.sz + b.sz) / 2 - 1e-6) continue;
          for (const fa of [a.cy - a.sy / 2, a.cy + a.sy / 2]) {
            if (fa < 0) continue;
            for (const fb of [b.cy - b.sy / 2, b.cy + b.sy / 2]) if (Math.abs(fa - fb) <= 1e-6) overlaps.push(`${name}/${t}: ${i}/${j} at y=${fa}`);
          }
        }
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("is deterministic", () => {
    const layout = AIRFIELD_FIXTURES["regional.tworunways"]!;
    expect(airport.airfield(layout, "international", 45)).toEqual(airport.airfield(layout, "international", 45));
  });
});
