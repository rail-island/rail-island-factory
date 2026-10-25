// The cable car station set (generator/sets/cableCarStation.ts, docs/models/cable-car-stations.md):
// the whole station each type draws for the game's view -- hall, head, wheel, platform and
// stairs -- keeps its own clearances for every cabin the catalog can bring, builds its
// platform to that cabin, stays within its triangle budget, and the pylon carries the rope.
import { describe, expect, it } from "vitest";
import {
  COLUMN_SINK, DEFAULT_VIEW, SWEEP_INNER_R, TYPE_META, WHEEL_RADIUS, boxCorners, buildPylon, buildStation, deckLevel,
  headOverhangFor, platformBand, stairTreads, stationFouls,
  type StationBox, type StationModel, type StationSector, type StationView,
} from "../generator/sets/cableCarStation";

const TYPES = Object.keys(TYPE_META);
/** The catalog's cabins and a margin either side: the default, the gondola, the classic cabin, a narrow and a wide one. */
const CABINS: Array<Pick<StationView, "sillDrop" | "halfWidth">> = [
  DEFAULT_VIEW, { sillDrop: 8.13, halfWidth: 2.38 }, { sillDrop: 8.54, halfWidth: 2.0 }, { sillDrop: 8.0, halfWidth: 1.4 }, { sillDrop: 8.7, halfWidth: 2.6 },
];
const VIEWS: StationView[] = CABINS.flatMap((c) => [false, true].map((circulating) => ({ ...c, circulating })));
const viewName = (v: StationView): string => `${v.circulating ? "ring" : "shuttle"} sill ${v.sillDrop} half ${v.halfWidth}`;

/** Triangles as the game meshes them: a box 12 (a gable prism 8), a sector one step per 0.12 rad, 8 a step. */
function triangles(m: StationModel, level: "full" | "low"): number {
  const drawn = (lv: string): boolean => lv === level || lv === "both";
  const sectorTris = (s: StationSector): number => 8 * Math.max(6, Math.ceil((s.halfAngle * 2) / 0.12)) + 4;
  return m.boxes.filter((b) => drawn(b.level)).reduce((n, b) => n + (b.profile ? 8 : 12), 0)
    + m.sectors.filter((s) => drawn(s.level)).reduce((n, s) => n + sectorTris(s), 0);
}

function extent(b: StationBox): { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number } {
  const p = boxCorners(b);
  const xs = p.map((v) => v[0]), ys = p.map((v) => v[1]), zs = p.map((v) => v[2]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys), z0: Math.min(...zs), z1: Math.max(...zs) };
}

const box = (part: StationBox["part"], cx: number, cy: number, cz: number, sx: number, sy: number, sz: number): StationBox =>
  ({ cx, cy, cz, sx, sy, sz, color: [0, 0, 0], material: "steel", part, level: "full" });

describe("cable car station types", () => {
  it.each(TYPES)("%s keeps every clearance for every cabin, in both plans, at both levels", (type) => {
    for (const view of VIEWS) {
      const m = buildStation(type, view);
      const fouls = [...m.boxes, ...m.sectors].map((b) => stationFouls(type, view, b)).filter((f) => f !== null);
      expect({ view: viewName(view), fouls }).toEqual({ view: viewName(view), fouls: [] });
    }
  });

  it.each(TYPES)("%s stands no column of its hall in the platform, rectangular or curved", (type) => {
    for (const view of VIEWS) {
      const m = buildStation(type, view);
      const crossing = m.boxes.filter((b) => b.part === "hall").filter((b) => {
        const e = extent(b);
        if (e.y1 < m.deckY! - 1 || e.y0 > m.deckY!) return false;
        if (view.circulating) {
          // the deck sector about the wheel axis
          const near = Math.hypot(Math.max(e.x0, 0, -e.x1), Math.max(e.z0 - m.headZ, 0, m.headZ - e.z1));
          const far = Math.hypot(Math.max(Math.abs(e.x0), Math.abs(e.x1)), Math.max(Math.abs(e.z0 - m.headZ), Math.abs(e.z1 - m.headZ)));
          const { rIn, rOut } = platformBand(view);
          return near < rOut && far > rIn;
        }
        return m.boxes.filter((d) => d.part === "platform" && d.material === "deck").map(extent)
          .some((d) => e.x0 < d.x1 && e.x1 > d.x0 && e.z0 < d.z1 && e.z1 > d.z0);
      });
      expect({ view: viewName(view), crossing }).toEqual({ view: viewName(view), crossing: [] });
    }
  });

  it("would catch a box in the cabin ring, on the head, in a lane, through the platform or over the stairs", () => {
    const type = "alpine_chalet", view = DEFAULT_VIEW;
    const { ropeHeadY: headY, d } = TYPE_META[type]!;
    const headZ = headOverhangFor(d);
    const deckY = deckLevel(headY, view);
    const tread = stairTreads(type, view)[4]!;
    expect(stationFouls(type, view, box("hall", 0, headY - 3, headZ - 5, 4, 2, 1))).toBe("cabin ring");
    expect(stationFouls(type, view, box("hall", 0, headY + 0.8, headZ, 1, 1, 1))).toBe("head");
    expect(stationFouls(type, view, box("platform", 5, headY - 4, headZ + 9, 1, 1, 1))).toBe("lanes");
    expect(stationFouls(type, view, box("hall", 0, headY + 3, headZ + 2, 10, 0.5, 2))).toBe("lanes");
    expect(stationFouls(type, view, box("hall", 10, deckY, headZ - 2, 3, 0.4, 3))).toBe("platform");
    expect(stationFouls(type, view, box("hall", 10, deckY, headZ - 4, 0.8, 12, 0.8))).toBe("platform");
    expect(stationFouls(type, view, box("hall", 0, tread.top + 1, (tread.z0 + tread.z1) / 2, 2, 1, 0.5))).toBe("stairs");
    // the wheel is the one thing allowed in the ring, the head the one thing on the wheel
    expect(stationFouls(type, view, box("wheel", 0, headY, headZ - 5, 1, 0.5, 1))).toBeNull();
    expect(stationFouls(type, view, box("head", 0, headY + 0.6, headZ, 1, 0.5, 1))).toBeNull();
  });

  it.each(TYPES)("%s builds its platform to the cabin: just below its sill, beside it, curved only for circulating cabins", (type) => {
    const headY = TYPE_META[type]!.ropeHeadY;
    for (const view of VIEWS) {
      const m = buildStation(type, view);
      expect(m.deckY).toBeCloseTo(headY - view.sillDrop - 0.25, 9);
      const deckBoxes = m.boxes.filter((b) => b.part === "platform" && b.material === "deck");
      const deckSectors = m.sectors.filter((s) => s.part === "platform" && s.material === "deck");
      if (view.circulating) {
        expect(deckBoxes).toEqual([]);
        expect(deckSectors).toHaveLength(1);
        const s = deckSectors[0]!;
        expect(s.cy + s.thick / 2).toBeCloseTo(m.deckY!, 9);
        expect(s.rIn).toBeGreaterThanOrEqual(WHEEL_RADIUS + view.halfWidth + 0.5 - 1e-9);
      } else {
        expect(deckSectors).toEqual([]);
        expect(deckBoxes.length).toBeGreaterThanOrEqual(3);
        for (const b of deckBoxes) expect(b.cy + b.sy / 2).toBeCloseTo(m.deckY!, 1);
        const { rIn } = platformBand(view);
        // no deck nearer the wheel axis than the band's inner edge
        for (const b of deckBoxes) {
          const e = extent(b);
          const near = Math.hypot(Math.max(e.x0, 0, -e.x1), Math.max(e.z0 - m.headZ, 0, m.headZ - e.z1));
          expect(near).toBeGreaterThanOrEqual(rIn - 0.05);
        }
      }
      // the stairs reach from the deck down to the hall floor
      const treads = m.boxes.filter((b) => b.part === "stairs" && b.level !== "low" && !b.rotX && !b.rotZ);
      expect(Math.max(...treads.map((b) => b.cy + b.sy / 2))).toBeCloseTo(m.deckY!, 1);
    }
  });

  it.each(TYPES)("%s draws its own wheel about the head, and a head that holds it", (type) => {
    const m = buildStation(type);
    const wheel = [...m.boxes.filter((b) => b.part === "wheel"), ...m.sectors.filter((s) => s.part === "wheel")];
    expect(wheel.length).toBeGreaterThan(2);
    const rim = m.sectors.find((s) => s.part === "wheel" && s.halfAngle === Math.PI)!;
    expect([rim.cx, rim.cy, rim.cz]).toEqual([0, m.headY, m.headZ]);
    expect((rim.rIn + rim.rOut) / 2).toBeCloseTo(WHEEL_RADIUS, 9);
    for (const s of m.sectors.filter((x) => x.part === "wheel")) expect(s.rOut).toBeLessThanOrEqual(WHEEL_RADIUS + 0.5);
    // the head stays inside the ring the cabins sweep
    for (const b of m.boxes.filter((x) => x.part === "head")) {
      const e = extent(b);
      expect(Math.hypot(Math.max(Math.abs(e.x0), Math.abs(e.x1)), Math.max(Math.abs(e.z0 - m.headZ), Math.abs(e.z1 - m.headZ)))).toBeLessThan(SWEEP_INNER_R);
    }
  });

  it.each(TYPES)("%s draws in 8,000 triangles, its distant level in 500, in both plans", (type) => {
    for (const circulating of [false, true]) {
      const m = buildStation(type, { ...DEFAULT_VIEW, circulating });
      expect(triangles(m, "full")).toBeLessThanOrEqual(8000);
      expect(triangles(m, "low")).toBeLessThanOrEqual(500);
      // the distant level keeps the hall and the platform's deck, never the turning wheel
      expect(m.boxes.some((b) => b.part === "hall" && b.level !== "full")).toBe(true);
      expect([...m.boxes, ...m.sectors].some((b) => b.part === "platform" && b.material === "deck" && b.level === "both")).toBe(true);
      expect([...m.boxes, ...m.sectors].some((b) => b.part === "wheel" && b.level !== "full")).toBe(false);
    }
  });

  it("draws the same station every time, and an unknown type as the default", () => {
    expect(buildStation("glass_modern", { ...DEFAULT_VIEW, circulating: true })).toEqual(buildStation("glass_modern", { ...DEFAULT_VIEW, circulating: true }));
    expect(buildStation("no_such_type")).toEqual(buildStation("open_gantry"));
  });

  it("leaves out the platform when the view puts its deck at the ground", () => {
    const m = buildStation("open_gantry", { ...DEFAULT_VIEW, sillDrop: TYPE_META.open_gantry!.ropeHeadY - 0.5 });
    expect(m.deckY).toBeNull();
    expect([...m.boxes, ...m.sectors].some((b) => b.part === "platform" || b.part === "stairs")).toBe(false);
  });
});

describe("the cable car pylon", () => {
  it.each([12, 31.5, 60])("carries both strands on its sheaves' tops at %s studs", (height) => {
    const boxes = buildPylon(height);
    const sheaves = boxes.filter((b) => b.material === "wheel");
    expect(sheaves).toHaveLength(8);
    for (const b of sheaves) {
      expect(b.y + b.sy / 2).toBeCloseTo(height - 0.05, 9);
      expect(Math.abs(b.x)).toBeCloseTo(WHEEL_RADIUS, 9);
    }
    // nothing above the strands but the lightning rod, nothing deeper than the sink
    for (const b of boxes) {
      if (b.sx > 0.2) expect(b.y + b.sy / 2).toBeLessThanOrEqual(height + 1e-9);
      expect(b.y - b.sy / 2).toBeGreaterThanOrEqual(-COLUMN_SINK - 1e-9);
    }
    // the first three are the distant silhouette: the mast, the collar, the cross-head
    expect(boxes[0]!.sy).toBeGreaterThan(height);
    expect(boxes[1]!.material).toBe("concrete");
    expect(boxes[2]!.sx).toBeGreaterThan(2 * WHEEL_RADIUS);
  });
});
