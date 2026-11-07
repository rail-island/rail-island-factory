// The world trams on the world tram kit (generator/worldTramKit.ts,
// generator/worldTramsEurope.ts, generator/worldTramsWorld.ts,
// docs/models/world-trams.md): each at its real length and width, on the rail,
// its sections, joints and trucks where the spec puts them, its collector raised
// to the game's trolley wire as a lowering clip, its doors on the sides the spec
// says, in budget, with its own distant model; every spec draws cleanly
// (checkSpec), and every tram has its OpenTTD entry.

import { describe, expect, it } from "vitest";
import { WORLD_TRAM_SPECS, WORLD_TRAMS_RIGHT_ONLY, WORLD_TRAMS_WITHOUT_DOORS } from "../generator/worldTrams";
import { checkSpec, tramLength, tramLodBudget, tramTriangleBudget } from "../generator/worldTramKit";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { coverageCombinations, paramCombinations } from "../generator/design";
import { TRAM_COLLECTOR_TOP } from "../generator/collector";
import { LOD_GLASS } from "../generator/lodKit";
import { sample } from "./catalogCache";

const span = (ts: readonly Tri[], axis: number): [number, number] => {
  let lo = Infinity;
  let hi = -Infinity;
  for (const t of ts) for (const p of t.p) { lo = Math.min(lo, p[axis]!); hi = Math.max(hi, p[axis]!); }
  return [lo, hi];
};

describe("the world trams", () => {
  it("are the list's 99 designs (the horse tram moved to the animal-drawn trams) in the catalog's trams, each with its OpenTTD entry", () => {
    expect(WORLD_TRAM_SPECS).toHaveLength(99);
    for (const t of WORLD_TRAM_SPECS) {
      const id = proceduralId(t.id);
      const d = DESIGNS.get(id);
      expect(d, id).toBeDefined();
      expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "tram" });
      expect(OPENTTD_TABLE[id]?.cargo, id).toBe("PASS");
      expect(OPENTTD_TABLE[id]!.capacity, id).toBeGreaterThan(0);
      expect(OPENTTD_TABLE[id]!.railType, id).toBeUndefined();
    }
  });

  it("draws every spec of every combination cleanly: doors on the straight sides clear of the trucks, trucks and collector under the body", () => {
    for (const t of WORLD_TRAM_SPECS)
      for (const p of t.params ? paramCombinations(t.params) : [{}]) expect(checkSpec(t.spec(p)), `${t.id} ${JSON.stringify(p)}`).toEqual([]);
  });

  it("keeps each tram's real gauge on the record, and the kit's rail vehicles' standard-gauge wheelsets", () => {
    const gauges = new Set(WORLD_TRAM_SPECS.map((t) => t.spec().gauge));
    expect([...gauges].sort((a, b) => a - b)).toEqual([900, 1000, 1067, 1100, 1372, 1435, 1445]);
  });

  it("opens no doors on the open cars and the end-platform cars, and the single-ended cars' on the right only", () => {
    expect([...WORLD_TRAMS_WITHOUT_DOORS].sort()).toEqual(["cable-car-dunedin", "christchurch-boon", "rio-bonde", "steam-tram"].map((n) => `proc-vehicle-${n}`));
    expect(WORLD_TRAMS_RIGHT_ONLY.has("proc-vehicle-tatra-t1")).toBe(true);
    expect(WORLD_TRAMS_RIGHT_ONLY.has("proc-vehicle-siemens-combino")).toBe(false);
  });

  for (const t of WORLD_TRAM_SPECS) {
    describe(t.id, () => {
      const combos = sample(coverageCombinations(t.params, t.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("is the real tram's size, its sections, collector and doors as the spec says (%s)", (_n, params) => {
        const s = t.spec(params);
        const m = t.build(params);
        const { json, bin } = parseGlb(m.toGlb(t.id));
        const ts = collectTriangles(json, bin);
        // a rigid tram's budget is a road vehicle's 10,000, and 5,000 more a joint
        expect(m.triangleCount() - m.interiorTriangleCount()).toBeLessThanOrEqual(tramTriangleBudget(s.sections.length));
        expect(m.interiorTriangleCount()).toBeLessThanOrEqual(2_000);
        // on the rail, centred, as long as its bodies (couplers and lamps beyond them)
        const L = tramLength(s);
        const [x0, x1] = span(ts, 0);
        expect(x1 - x0).toBeGreaterThanOrEqual(L - 1e-6);
        expect(x0).toBeCloseTo(-x1, 3);
        expect(x1 - x0).toBeLessThanOrEqual(L + 0.5);
        expect(span(ts, 1)[0]).toBeCloseTo(0, 5);
        const [z0, z1] = span(ts, 2);
        // the open cars' running boards, an open top deck's floor reach a little further
        // (a cab's rear-view mirrors or camera arms stand out at each side)
        expect(z1 - z0).toBeLessThanOrEqual(s.width + (s.open ? 0.5 : s.deck === "open" ? 0.12 : 0.06) + (s.nose?.mirrors ? 0.66 : 0));
        // the collector: raised to the trolley wire, its own lowering clip; none on the battery, ground-power and hydrogen cars
        const clips = (json as { animations?: Array<{ name: string }> }).animations?.map((a) => a.name) ?? [];
        const top = span(ts, 1)[1];
        if (s.collector.kind === "none") {
          expect(clips.filter((c) => /^(pantograph|trolleypole)\d+$/.test(c))).toEqual([]);
          expect(top).toBeLessThan(s.height + 1.3);
        } else {
          expect(top).toBeCloseTo(TRAM_COLLECTOR_TOP, 3);
          expect(clips.filter((c) => c.startsWith(s.collector.kind === "pole" ? "trolleypole" : "pantograph"))).toHaveLength(1);
        }
        // the sections: a rigid car one body, an articulated one a section per body and a joint per gap
        const rig = m.rig!;
        expect(rig.supports!.length).toBeGreaterThanOrEqual(2);
        // (a hitched extra - the horse tram's horse - is one more section, with no joint)
        const n = s.sections.length + (s.extraSection ? 1 : 0);
        expect(rig.sections?.length ?? 1).toBe(n);
        expect(rig.joints?.length ?? 0).toBe(s.sections.length - 1);
        // the doors: on the sides the spec says
        const sides = new Set(m.animations().filter((c) => c.drive.drive === "door").map((c) => (c.drive as { side: string }).side));
        const want = s.open || !s.doors.length ? [] : s.doubleEnded ? ["left", "right"] : ["right"];
        expect([...sides].sort()).toEqual(want);
        // the distant model: in budget, glazed, on the rail, with the full rig's sections
        const low = t.buildLod(params);
        expect(low.triangleCount()).toBeLessThanOrEqual(tramLodBudget(s));
        expect(low.triangleCount()).toBeGreaterThan(tramLodBudget(s) * 0.6);
        const lowTs = collectTriangles(...(Object.values(parseGlb(low.toGlb(t.id))) as [never, never]));
        expect(lowTs.some((f) => f.material === LOD_GLASS)).toBe(true);
        expect(span(lowTs, 1)[0]).toBeLessThan(0.1);
        expect(low.rig?.sections?.length ?? 1).toBe(n);
      });
    });
  }

  it("lays each dressed nose on its body: head lamps at both cab ends, on the end's surface, and its mirrors at the cab", () => {
    const dressed = WORLD_TRAM_SPECS.filter((t) => t.spec().nose);
    expect(dressed.length).toBeGreaterThanOrEqual(10);
    for (const t of dressed) {
      const s = t.spec();
      const L = tramLength(s);
      const { json, bin } = parseGlb(t.build().toGlb(t.id));
      const heads = collectTriangles(json, bin).filter((f) => f.material === "lampHead");
      const xs = heads.flatMap((f) => f.p.map((q) => q[0]));
      // the lamps sit on the end, never sunk behind it nor floating ahead of it (a lens 3.5 cm proud)
      expect(Math.max(...xs), t.id).toBeLessThanOrEqual(L / 2 + 0.12);
      expect(Math.max(...xs), t.id).toBeGreaterThan(L / 2 - 1.5);
      if (s.doubleEnded) expect(Math.min(...xs), t.id).toBeLessThan(-L / 2 + 1.5);
      const tree = JSON.stringify(t.build().sourceTree(t.id, t.id));
      if (s.nose!.mirrors) expect(tree, t.id).toContain("mirrors");
      if (s.nose!.panes) expect(tree, t.id).toContain("pane 1");
    }
  });

  it("draws the special rows' parts: the tram engine's chimney and smoke, the cable grip, the guided axles", () => {
    const names = (id: string, p = {}) => {
      const m = WORLD_TRAM_SPECS.find((t) => t.id === id)!.build(p);
      return JSON.stringify(m.sourceTree(id, id));
    };
    expect(names("veh-steam-tram")).toContain("chimney");
    expect(WORLD_TRAM_SPECS.find((t) => t.id === "veh-steam-tram")!.build().emitters().map((e) => e.kind)).toEqual(["smoke"]);
    expect(names("veh-cable-car-dunedin")).toContain("grip");
    expect(names("veh-translohr")).toContain("guide rollers");
    expect(names("veh-blackpool-balloon")).toContain("upper windows");
  });

  it("changes the body with a length or unit, and only the colours with a finish livery", () => {
    const len = (id: string, p: Record<string, string>) => tramLength(WORLD_TRAM_SPECS.find((t) => t.id === id)!.spec(p));
    expect(len("veh-siemens-combino", { length: "3" })).toBeLessThan(len("veh-siemens-combino", { length: "7" }));
    expect(len("veh-siemens-ulf", { length: "b" })).toBeGreaterThan(len("veh-siemens-ulf", {}) + 10);
    expect(len("veh-berlin-flexity", { length: "long" })).toBeGreaterThan(len("veh-berlin-flexity", {}));
    expect(WORLD_TRAM_SPECS.find((t) => t.id === "veh-tatra-t4")!.spec({ unit: "trailer" }).collector.kind).toBe("none");
    // a finish livery's paint stacks keep their heights: its specs differ in their colours alone
    for (const t of WORLD_TRAM_SPECS.filter((x) => x.finishParams?.length)) {
      const finish = t.params!.filter((p) => t.finishParams!.includes(p.name));
      const shapes = finish.flatMap((p) => p.values.map((v) => {
        const s = t.spec({ [p.name]: v.value });
        return JSON.stringify({ ...s, colors: Object.keys(s.colors).sort() });
      }));
      expect(new Set(shapes).size, t.id).toBe(1);
    }
  });
});
