// The airfield the airport set draws on a saved layout (docs/models/airfield.md):
// generator/sets/airport.ts `airfield`, over the saved layouts in
// generator/sets/airfieldFixtures.ts. The tags are the game's contract (TerminalBox).
import { describe, expect, it } from "vitest";
import * as airport from "../generator/sets/airport.ts";
import * as station from "../generator/sets/station.ts";
import { AIRFIELD_FIXTURES, AIRFIELD_SIZES, airfieldFixture } from "../generator/sets/airfieldFixtures.ts";
import { towerBoxes, TOWER_HEIGHTS } from "../generator/props/airportProps.ts";

const TYPES = Object.keys(airport.TYPE_META);
const RUNWAY_TYPES = TYPES.filter((t) => airport.TYPE_META[t]!.runways);
const MATERIALS = new Set(["brick", "wood", "roof", "steel", "glass", "sign", "column", "platform", "edge", "safety", "light", "netting"]);
const deckOf = (boxes: readonly airport.AirfieldBox[]): airport.AirfieldBox[] => boxes.filter((b) => b.depthLayer === 1);
/** A box's true extent, from the station set's mesh (a shape's cx..sz do not bound it). */
const boundsOf = (b: airport.AirfieldBox): [number[], number[]] => station.stationBoxBounds(b as station.StationBox);
/** A box's footprint in plan. */
const planOf = (b: airport.AirfieldBox): airport.DeckRect => {
  const [min, max] = boundsOf(b);
  return { x0: min[0]!, x1: max[0]!, z0: min[2]!, z1: max[2]! };
};
const overlapIn = (a: airport.DeckRect, b: airport.DeckRect, margin = 0): boolean =>
  a.x0 < b.x1 + margin - 1e-6 && b.x0 < a.x1 + margin - 1e-6 && a.z0 < b.z1 + margin - 1e-6 && b.z0 < a.z1 + margin - 1e-6;
const triangles = (boxes: readonly airport.AirfieldBox[]): number => station.stationTriangles(boxes as station.StationBox[]);

/**
 * The triangle budget of a whole airport (docs/models/airfield.md, "Triangle budgets"):
 * the field, its perimeter details and the control tower prop, counted as the game
 * draws them. A runway airport's budget follows its size class.
 */
const BUDGET: Record<string, number | Record<string, number>> = {
  grass_field: 8000,
  regional: { small: 18000, medium: 30000, big: 40000 },
  international: { small: 18000, medium: 30000, big: 40000 },
  heliport: 12000,
};

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
        const plans = deck.map(planOf);
        for (let i = 0; i < deck.length; i++) for (let j = i + 1; j < deck.length; j++) {
          expect(overlapIn(plans[i]!, plans[j]!), `${name}/${type}: deck pieces ${i}/${j}`).toBe(false);
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
        const { boxes, bridges } = airport.airfield(layout, t);
        expect(boxes.filter((b) => b.label), `${t}/${size}`).toHaveLength(1);
        expect(bridges.map((b) => b.stand), `${t}/${size}`).toEqual(t === "international" ? layout.stands.map((st) => st.id) : []);
        // the rotunda is drawn with the field, the tunnel is not
        const rotundas = boxes.filter((b) => b.shape === "cylinder" && b.material === "steel" && b.color[0] === 200);
        expect(rotundas.length, `${t}/${size}`).toBe(bridges.length);
      }
    }
  });

  describe("jet bridges", () => {
    const hubs = AIRFIELD_SIZES.map((size) => ({ size, layout: airfieldFixture("international", size) }));

    it("stand each rotunda to the parked aircraft's left (-Z), short of the terminal, its parts in their own frames", () => {
      for (const { size, layout } of hubs) {
        const { bridges } = airport.airfield(layout, "international");
        const front = layout.building.cx - layout.building.w / 2;
        for (const br of bridges) {
          const st = layout.stands.find((s) => s.id === br.stand)!;
          expect(br.pivot.z, size).toBeLessThan(st.z - 4);
          expect(br.pivot.x, size).toBeLessThan(front);
          expect(br.reach[0], size).toBeLessThan(br.reach[1]);
          expect(br.lift[0], size).toBeLessThan(br.lift[1]);
          expect(br.parts.leg.every((b) => b.sy === 1 && b.cy === 0.5), size).toBe(true);
          for (const part of Object.values(br.parts)) for (const b of part) {
            expect(b.rotY ?? b.rotZ ?? b.rotX, `${size}: a part box turns itself`).toBeUndefined();
            expect(MATERIALS.has(b.material)).toBe(true);
          }
        }
      }
    });

    it("rest short and straight back from the rotunda, clear of every stand's fuselage and of the terminal", () => {
      for (const { size, layout } of hubs) {
        const { bridges } = airport.airfield(layout, "international");
        const front = layout.building.cx - layout.building.w / 2;
        for (const br of bridges) {
          expect(br.rest.length).toBe(br.reach[0]);
          expect(br.rest.lift).toBe(br.floor);
          for (const b of airport.jetBridgeBoxes(br, br.rest)) {
            const r = planOf(b);
            expect(r.x1, `${size}: into the terminal`).toBeLessThanOrEqual(front + 1e-6);
            for (const st of layout.stands) {
              // a fuselage on its centreline, nose-in from the stand toward the terminal
              const fuselage = { x0: st.x, x1: front, z0: st.z - 4, z1: st.z + 4 };
              expect(overlapIn(r, fuselage), `${size}: stand ${st.id} under bridge ${br.stand}`).toBe(false);
            }
          }
        }
      }
    });

    it("pose a tunnel that ends where the pose says and a leg that reaches it", () => {
      const br = airport.airfield(hubs[2]!.layout, "international").bridges[0]!;
      const pose = { yaw: -Math.PI * 0.4, length: br.reach[1] - 1, lift: br.floor - 1.5, cabYaw: -Math.PI / 2 };
      const boxes = airport.jetBridgeBoxes(br, pose);
      // the cab's body: its rear on the tunnel's end, its floor at the lift
      const cab = boxes.find((b) => b.color[0] === 38)!;
      const ex = br.pivot.x + pose.length * Math.cos(pose.yaw), ez = br.pivot.z - pose.length * Math.sin(pose.yaw);
      expect(cab.cx).toBeCloseTo(ex + (br.cabDepth / 2) * Math.cos(pose.cabYaw), 6);
      expect(cab.cz).toBeCloseTo(ez - (br.cabDepth / 2) * Math.sin(pose.cabYaw), 6);
      const [cmin] = boundsOf(cab);
      expect(cmin[1]!).toBeLessThan(pose.lift);
      // the leg from the wheels to the tunnel's underside over them
      const leg = boxes.find((b) => b.material === "column")!;
      const under = br.floor + (pose.lift - br.floor) * (pose.length - br.bogieBack) / pose.length - br.legTop;
      expect(leg.cy + leg.sy / 2).toBeCloseTo(under, 6);
    });
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
        // the deck's rectangles, without the rounded corners
        expect(deckOf(far)).toEqual(deckOf(boxes).filter((b) => !b.shape));
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
        const r = planOf(b);
        expect(r.x0 >= f.cx - f.w / 2 && r.x1 <= f.cx + f.w / 2 && r.z0 >= f.cz - f.d / 2 && r.z1 <= f.cz + f.d / 2, `${name}: a fitting off the footprint`).toBe(true);
      }
    }
  });

  /** Every pair of boxes overlapping in plan with a face on one plane above the ground. */
  const sharedPlanes = (boxes: readonly airport.AirfieldBox[], label: string): string[] => {
    const out: string[] = [];
    // level boxes and the shapes whose top and bottom are flat (a ring, an upright cylinder)
    const flat = boxes.filter((b) => !b.rotZ && !b.rotX && !b.rotY && !b.profile && (!b.shape || b.shape === "ring" || b.shape === "cylinder"));
    const plans = flat.map(planOf);
    const ys = flat.map((b) => { const [min, max] = boundsOf(b); return [min[1]!, max[1]!]; });
    for (let i = 0; i < flat.length; i++) for (let j = i + 1; j < flat.length; j++) {
      const a = flat[i]!, b = flat[j]!;
      if (!overlapIn(plans[i]!, plans[j]!)) continue;
      for (const fa of ys[i]!) {
        if (fa < 0) continue;
        for (const fb of ys[j]!) if (Math.abs(fa - fb) <= 1e-6) out.push(`${label}: ${a.material} ${i} / ${b.material} ${j} at y=${fa}`);
      }
    }
    return out;
  };

  it("never shares a visible plane between two overlapping boxes, helipads included", () => {
    const overlaps: string[] = [];
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      for (const t of TYPES) overlaps.push(...sharedPlanes(airport.airfield(layout, t).boxes, `${name}/${t}`));
    }
    expect(overlaps).toEqual([]);
  });

  it("draws a helipad with no flickering faces: lights seated into the slab, the circle one round ring", () => {
    // regression: the corner lights stood exactly on the slab's top and the aiming
    // circle's diagonal steps overlapped each other at one height, so both flickered;
    // and the circle was a staircase of rectangles, not round
    for (const pad of ["small", "large"] as const) {
      const boxes = airport.helipad({ cx: 5, cz: -7, pad }, "heliport");
      expect(sharedPlanes(boxes, pad)).toEqual([]);
      const slabTop = Math.max(...boxes.filter((b) => b.material === "platform").map((b) => b.cy + b.sy / 2));
      for (const l of boxes.filter((b) => b.material === "light")) expect(l.cy - l.sy / 2, `${pad}: a light's foot`).toBeLessThan(slabTop - 0.05);
      const circle = boxes.filter((b) => b.material === "safety");
      expect(circle, pad).toHaveLength(1);
      expect(circle[0]!.shape).toBe("ring");
      expect(circle[0]!.sides).toBeGreaterThanOrEqual(24);
      // centred on the pad, every vertex of its outer edge at one radius
      const mesh = station.stationBoxMesh(circle[0] as station.StationBox).positions;
      const radii = new Set<string>();
      for (let i = 0; i < mesh.length; i += 3) radii.add(Math.hypot(mesh[i]! - 5, mesh[i + 2]! + 7).toFixed(4));
      expect(radii.size, `${pad}: an inner and an outer radius`).toBe(2);
    }
  });

  it("rounds every inside corner of the pavement, touching no pavement and no other fillet", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      if (layout.runways.length === 0) continue;
      const deck = deckOf(airport.airfield(layout, "regional").boxes);
      const rects = deck.filter((b) => !b.shape).map(planOf);
      const fillets = deck.filter((b) => b.shape);
      expect(fillets.length, name).toBeGreaterThanOrEqual(4);
      for (const f of fillets) {
        expect(f.shape).toBe("ring");
        expect(f.ring?.fillet).toBe(true);
        const r = planOf(f);
        // a square, three of whose corners' neighbours are paved
        expect(r.x1 - r.x0).toBeCloseTo(r.z1 - r.z0, 6);
        expect(rects.some((p) => overlapIn(p, r)), `${name}: a fillet over pavement`).toBe(false);
        expect(rects.filter((p) => overlapIn(p, r, 0.01)).length, `${name}: a fillet off every corner`).toBeGreaterThanOrEqual(2);
      }
      const plans = fillets.map(planOf);
      for (let i = 0; i < plans.length; i++) for (let j = i + 1; j < plans.length; j++) expect(overlapIn(plans[i]!, plans[j]!), `${name}: fillets ${i}/${j}`).toBe(false);
    }
  });

  it("turns the taxi line round the spine's corners and marks a holding point on every runway link", () => {
    const layout = airfieldFixture("regional", "medium");
    const boxes = airport.airfield(layout, "regional").boxes;
    const arcs = boxes.filter((b) => b.depthLayer === 2 && b.shape === "ring");
    // the ladder's spine turns into a runway link at both of its ends
    expect(arcs).toHaveLength(2);
    for (const a of arcs) expect((a.ring!.a1! - a.ring!.a0!)).toBeCloseTo(Math.PI / 2, 6);
    const links = layout.edges.filter((e) => e.kind === "runwayLink");
    const nodes = new Map(layout.nodes.map((n) => [n.id, n]));
    for (const e of links) {
      const z = nodes.get(e.a)!.z;
      // four bars across the link, broken round the centreline: some yellow paint 0.5 wide along Z on it
      const bars = boxes.filter((b) => b.depthLayer === 2 && b.sx === 0.5 && b.color[0] === 226 && Math.abs(b.cz - z) < e.width / 2);
      expect(new Set(bars.map((b) => b.cx.toFixed(2))).size, `link ${e.id}`).toBe(4);
      // and a red sign beside it
      expect(boxes.some((b) => b.material === "sign" && b.color[0] === 176 && Math.abs(b.cz - z) < e.width / 2 + 24), `link ${e.id}: its sign`).toBe(true);
    }
  });

  it("keeps a corner's turn short of the next junction when the spine's end edge is short", () => {
    // regression: a saved layout whose first stand link meets the spine 4 studs from its
    // corner drew the 12-stud turn across that junction's line, paint on paint
    const base = airfieldFixture("regional", "medium");
    const corner = base.nodes.find((n) => n.id === 3)!;
    const layout = {
      ...base,
      nodes: base.nodes.map((n) => (n.id === 5 || n.id === 6 ? { ...n, z: corner.z + 4 } : n)),
      stands: base.stands.map((st, i) => (i === 0 ? { ...st, z: corner.z + 4 } : st)),
    };
    const boxes = airport.airfield(layout, "regional").boxes;
    expect(sharedPlanes(boxes.filter((b) => b.depthLayer === 2), "short corner")).toEqual([]);
  });

  it("fences a paved field with one pane of chain-link per straight run, barbed wire over it, a barrier at the service gate", () => {
    for (const t of ["regional", "international", "heliport"]) {
      const layout = airfieldFixture(t, "medium");
      const details = airport.airfield(layout, t).details;
      const panes = details.filter((b) => b.material === "netting");
      const posts = details.filter((b) => b.material === "steel" && !b.shape && b.sx === b.sz && b.sy > 3);
      // a run is many bays long: far fewer panes than posts
      expect(panes.length, t).toBeGreaterThanOrEqual(4);
      expect(panes.length * 4, t).toBeLessThan(posts.length);
      for (const p of panes) expect(Math.min(p.sx, p.sy, p.sz), `${t}: a pane is thin`).toBeLessThanOrEqual(0.4);
      expect(details.filter((b) => b.shape === "bar").length, `${t}: barbed wire arms`).toBeGreaterThan(posts.length / 3);
      expect(details.some((b) => b.material === "sign" && b.color[0] === 176), `${t}: the barrier`).toBe(true);
    }
    // a grass field's is timber post-and-rail, without mesh or wire
    const grass = airport.airfield(airfieldFixture("grass_field", "medium"), "grass_field").details;
    expect(grass.some((b) => b.material === "netting" || b.shape === "bar")).toBe(false);
  });

  it("stands the service area clear of the pavement: a vaulted hangar, a fire station and a fuel farm", () => {
    for (const size of AIRFIELD_SIZES) for (const t of ["regional", "international"]) {
      const layout = airfieldFixture(t, size);
      const boxes = airport.airfield(layout, t).boxes;
      const paved = deckOf(boxes).map(planOf);
      const runways = layout.runways.map((rw) => ({ x0: rw.cx - rw.width / 2, x1: rw.cx + rw.width / 2, z0: rw.cz - rw.length / 2, z1: rw.cz + rw.length / 2 }));
      const vault = boxes.filter((b) => b.shape === "arc" && b.rotY);
      const tanks = boxes.filter((b) => b.shape === "cylinder" && b.material === "steel" && b.color[0] === 222);
      expect(vault, `${t}/${size}: the hangar`).toHaveLength(1);
      expect(tanks.length, `${t}/${size}: the fuel tanks`).toBe(t === "international" ? 3 : 2);
      expect(boxes.filter((b) => b.material === "steel" && b.color[0] === 178).length, `${t}/${size}: the station's doors`).toBeGreaterThanOrEqual(3);
      for (const b of [...vault, ...tanks]) {
        const r = planOf(b);
        expect(paved.some((p) => overlapIn(p, r, 9)), `${t}/${size}: on the pavement`).toBe(false);
        expect(runways.some((p) => overlapIn(p, r, 19)), `${t}/${size}: by the runway`).toBe(false);
      }
    }
  });

  it("keeps every airport within its triangle budget, its tower included", () => {
    for (const [name, layout] of Object.entries(AIRFIELD_FIXTURES)) {
      const type = name.split(".")[0]!;
      const size = name.split(".")[1]!;
      const { boxes, details, bridges } = airport.airfield(layout, type, 20);
      const meta = airport.TYPE_META[type]!;
      const tower = meta.tower ? towerBoxes(TOWER_HEIGHTS[meta.tower.values.kind as keyof typeof TOWER_HEIGHTS]) : [];
      const moving = bridges.flatMap((b) => airport.jetBridgeBoxes(b, b.rest));
      const tris = triangles(boxes) + triangles(details) + triangles(moving) + tower.reduce((n, b) => n + (b.profile === "gable" ? 8 : 12), 0);
      const limit = BUDGET[type]!;
      const cap = typeof limit === "number" ? limit : limit[size] ?? limit.big!;
      expect(tris, name).toBeLessThanOrEqual(cap);
    }
  });

  it("is deterministic", () => {
    const layout = AIRFIELD_FIXTURES["regional.tworunways"]!;
    expect(airport.airfield(layout, "international", 45)).toEqual(airport.airfield(layout, "international", 45));
  });
});
