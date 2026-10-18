import { proceduralId } from "../generator/modelId.ts";
// The trams and the metro car transferred from vlakosimdb (generator/trams.ts,
// generator/metro.ts, generator/tramKit.ts): every parameter combination in the
// rail envelope, the published dimensions the drawings are mapped onto, one
// raised pantograph per tram, the articulated trams' sections and joints, and
// the native landmarks. See docs/models/trams.md.

import { describe, expect, it } from "vitest";
import { paramCombinations, resolveParams } from "../generator/design.ts";
import { ALL_VEHICLES, DESIGNS } from "../generator/generate.ts";
import { GT4_BOGIES, GT4_MAP, KT4_BOGIES, KT4_MAP, KT8_BOGIES, KT8_MAP, T3_MAP, T6_MAP, TRAM_CATALOG, TRAM_DESIGNS, TRAM_WIRE } from "../generator/trams.ts";
import { METRO_CATALOG, METRO_DESIGNS, METRO_PIVOTS } from "../generator/metro.ts";
import { TRAM_TRANSFERS, tramComparison, worstTramPixels } from "../generator/tramComparison.ts";
import { meanAbsoluteError } from "../generator/csdCoachComparison.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { glbStats } from "../generator/glbStats.ts";
import { parseGlb } from "../generator/glbParse.ts";
import { isLeaf, type TreeNode } from "../generator/sourceTree.ts";
import type { ParamValues } from "../generator/design.ts";
import { sample } from "./catalogCache";

const DESIGNS_HERE = [...TRAM_DESIGNS, ...METRO_DESIGNS];
const COMBOS = DESIGNS_HERE.flatMap((d) => sample(paramCombinations(d.params)).map((p) => ({ d, p, label: `${d.id} ${JSON.stringify(p)}` })));

const walk = (n: TreeNode): TreeNode[] => (isLeaf(n) ? [n] : [n, ...n.children.flatMap(walk)]);
type Box = { min: number[]; max: number[] };
/** The union extent of the tree nodes whose ids match `test`. */
function extent(id: string, test: (nodeId: string) => boolean, params?: ParamValues): Box {
  const tree = DESIGNS.get(proceduralId(id))!.build(params).sourceTree(id, id);
  const nodes = walk(tree.root).filter((n) => test(n.id) && n.min && n.max);
  if (!nodes.length) throw new Error(`${id}: nothing matches`);
  return {
    min: [0, 1, 2].map((k) => Math.min(...nodes.map((n) => n.min![k]!))),
    max: [0, 1, 2].map((k) => Math.max(...nodes.map((n) => n.max![k]!))),
  };
}
const centreX = (b: Box) => (b.min[0]! + b.max[0]!) / 2;

describe("the tram and metro designs", () => {
  it("are registered rail vehicles with stable ids and their defaults", () => {
    expect(TRAM_DESIGNS.map((d) => d.id)).toEqual(["proc-vehicle-tatra-t3", "proc-vehicle-tatra-t6", "proc-vehicle-tatra-kt8", "proc-vehicle-tatra-kt4", "proc-vehicle-kvag-gt4"]);
    expect(METRO_DESIGNS.map((d) => d.id)).toEqual(["proc-vehicle-metro-81-71"]);
    for (const d of TRAM_DESIGNS) expect(d.catalog).toBe(TRAM_CATALOG);
    expect(METRO_DESIGNS[0]!.catalog).toBe(METRO_CATALOG);
    for (const d of DESIGNS_HERE) {
      expect(ALL_VEHICLES).toContain(d);
      expect(d.catalog?.category).toBe("Rail vehicles");
      expect(d.references).toBeTruthy();
    }
    const params = (id: string) => resolveParams(DESIGNS.get(proceduralId(id))!.params ?? []);
    expect(params("proc-vehicle-tatra-t3")).toEqual({ variant: "t3" });
    expect(DESIGNS.get(proceduralId("proc-vehicle-tatra-t3"))!.params![0]!.values.map((v) => v.value)).toEqual(["t3", "t3m", "t3prototype"]);
    expect(params("proc-vehicle-tatra-kt8")).toEqual({ livery: "redWhite" });
    expect(DESIGNS.get(proceduralId("proc-vehicle-tatra-kt8"))!.params![0]!.values.map((v) => v.value)).toEqual(["redWhite", "red", "modern"]);
    expect(params("proc-vehicle-metro-81-71")).toEqual({ unit: "headCar" });
    expect(DESIGNS.get(proceduralId("proc-vehicle-metro-81-71"))!.params![0]!.values.map((v) => v.value)).toEqual(["headCar", "middleCar"]);
    expect(DESIGNS.get(proceduralId("proc-vehicle-tatra-t6"))!.params).toBeUndefined();
  });

  it.each(COMBOS.map((c) => [c.label, c] as const))("%s builds on its wheels, inside the rail envelope and budget, without flicker", (_, { d, p }) => {
    const m = d.build(p);
    const glb = m.toGlb(d.id);
    const s = glbStats(glb);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
    // centred across, but for the single-sided doors standing a few millimetres proud
    expect(Math.abs(s.min[2] + s.max[2])).toBeLessThan(0.03);
    expect(s.max[0] - s.min[0]).toBeGreaterThan(2 * (s.max[2] - s.min[2]));
    expect(s.max[1]).toBeLessThanOrEqual(6.5);
    expect(s.triangles).toBeLessThanOrEqual(16_000);
    const fixed = walk(m.sourceTree(d.id, d.title).root).filter((n) => isLeaf(n) && n.max && !/(^|\/)roof-equipment\/pantographs(\/|$)/.test(n.id));
    expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
  });
});

describe("the published dimensions", () => {
  const body = (id: string, params?: ParamValues) => extent(id, (n) => /^(section\d\/)?body$/.test(n), params);
  const bogies = (id: string) => {
    const tree = DESIGNS.get(proceduralId(id))!.build().sourceTree(id, id);
    return walk(tree.root).filter((n) => /running-gear\/bogie(-\d)?$/.test(n.id)).map((n) => centreX(n as Box)).sort((a, b) => b - a);
  };

  it("maps the T3 onto 14.0 m by 2.5 m, 3.05 m high, its bogie pivots 6.4 m apart", () => {
    const b = body("proc-vehicle-tatra-t3");
    expect(b.max[0]! - b.min[0]!).toBeCloseTo(14.0, 1);
    expect(b.max[2]! - b.min[2]!).toBeCloseTo(2.5, 2);
    expect(b.max[1]!).toBeCloseTo(3.05, 2);
    const [f, r] = bogies("proc-vehicle-tatra-t3");
    expect(f! - r!).toBeCloseTo(6.4, 1);
    expect(T3_MAP.kx).toBeCloseTo(14.0 / 14.8, 9);
  });

  it("keeps the T3 variants on one body, the prototype's ends blunter", () => {
    const t3 = body("proc-vehicle-tatra-t3", { variant: "t3" });
    const t3m = body("proc-vehicle-tatra-t3", { variant: "t3m" });
    expect(t3m).toEqual(t3);
    const front = (variant: string) => extent("proc-vehicle-tatra-t3", (n) => n === "body/front-cab", { variant });
    expect(front("t3prototype").max[2]!).toBeGreaterThan(front("t3").max[2]!);
  });

  it("maps the T6A5 onto 14.7 m by 2.5 m and 3.165 m", () => {
    const b = body("proc-vehicle-tatra-t6");
    expect(b.max[0]! - b.min[0]!).toBeCloseTo(14.7, 1);
    expect(b.max[2]! - b.min[2]!).toBeCloseTo(2.5, 2);
    expect(b.max[1]!).toBeCloseTo(3.165, 2);
    expect(T6_MAP.ky).toBeCloseTo(3.165 / 3.5, 9);
  });

  it("maps the KT8D5 onto 30.3 m over its three bodies, 2.48 m wide, on four bogies", () => {
    const b = body("proc-vehicle-tatra-kt8");
    expect(b.max[0]! - b.min[0]!).toBeCloseTo(30.3, 1);
    expect(b.max[2]! - b.min[2]!).toBeCloseTo(2.48, 2);
    expect(b.max[1]!).toBeCloseTo(3.145, 2);
    const xs = bogies("proc-vehicle-tatra-kt8");
    expect(xs).toHaveLength(4);
    xs.forEach((x, i) => expect(x).toBeCloseTo((KT8_MAP.c - KT8_BOGIES[i]!) * KT8_MAP.kx, 2));
  });

  it("maps the KT4 onto 18.11 m and 2.2 m, a bogie under each section", () => {
    const b = body("proc-vehicle-tatra-kt4");
    expect(b.max[0]! - b.min[0]!).toBeCloseTo(18.11, 1);
    expect(b.max[2]! - b.min[2]!).toBeCloseTo(2.2, 2);
    const xs = bogies("proc-vehicle-tatra-kt4");
    xs.forEach((x, i) => expect(x).toBeCloseTo((KT4_MAP.c - KT4_BOGIES[i]!) * KT4_MAP.kx, 2));
  });

  it("gives the GT4 18.8 m over the couplings, 2.2 m width and 10.0 m between the bogie pivots", () => {
    const s = glbStats(DESIGNS.get(proceduralId("proc-vehicle-kvag-gt4"))!.build().toGlb("gt4"));
    expect(s.max[0] - s.min[0]).toBeCloseTo(18.8, 1);
    expect(body("proc-vehicle-kvag-gt4").max[2]! * 2).toBeCloseTo(2.2, 2);
    const [f, r] = bogies("proc-vehicle-kvag-gt4");
    expect(f! - r!).toBeCloseTo(10.0, 1);
    expect((GT4_BOGIES[1]! - GT4_BOGIES[0]!) * GT4_MAP.kx).toBeCloseTo(10.0, 1);
  });

  it("gives the 81-71 19.21 m over the couplers, 2.7 m width, 12.6 m between the bogie pivots, for both cars", () => {
    for (const unit of ["headCar", "middleCar"]) {
      const s = glbStats(DESIGNS.get(proceduralId("proc-vehicle-metro-81-71"))!.build({ unit }).toGlb("metro"));
      expect(s.max[0] - s.min[0]).toBeCloseTo(unit === "headCar" ? 19.21 : 19.21 * 19.8 / 20, 1);
      const b = body("proc-vehicle-metro-81-71", { unit });
      expect(b.max[2]! - b.min[2]!).toBeCloseTo(2.7, 2);
      expect(b.max[1]!).toBeCloseTo(3.65, 2);
      const tree = DESIGNS.get(proceduralId("proc-vehicle-metro-81-71"))!.build({ unit }).sourceTree("m", "m");
      const xs = walk(tree.root).filter((n) => /running-gear\/bogie-\d$/.test(n.id)).map((n) => centreX(n as Box));
      expect(Math.abs(xs[0]! - xs[1]!)).toBeCloseTo(METRO_PIVOTS, 2);
    }
  });

  it("puts every wheel on standard gauge", () => {
    for (const d of DESIGNS_HERE) {
      const tree = d.build().sourceTree(d.id, d.title);
      const wheels = walk(tree.root).filter((n) => /\/wheelset(-2)?$/.test(n.id));
      expect(wheels.length).toBeGreaterThan(0);
      for (const w of wheels) {
        // the tyres stand 0.665..0.8 m either side: 1.435 m gauge with the flanges inside
        expect(w.max![2]).toBeGreaterThanOrEqual(0.8);
        expect(w.max![2]).toBeLessThanOrEqual(1.03);
        expect(w.min![1]).toBeCloseTo(0, 6);
      }
    }
  });
});

describe("the pantographs", () => {
  /** Each pantograph scope's collector height. */
  const collectors = (id: string, params?: ParamValues) => {
    const tree = DESIGNS.get(proceduralId(id))!.build(params).sourceTree(id, id);
    return walk(tree.root)
      .filter((n) => /roof-equipment\/pantographs\/[^/]+$/.test(n.id))
      .map((n) => ({ id: n.id, head: extent(id, (x) => x === n.id + "/collector", params).max[1]! }));
  };

  it.each(TRAM_DESIGNS.flatMap((d) => sample(paramCombinations(d.params)).map((p) => [`${d.id} ${JSON.stringify(p)}`, d.id, p] as const)))(
    "%s raises exactly one collector to the wire", (_, id, p) => {
      const heads = collectors(id, p);
      const raised = heads.filter((h) => h.head > 5);
      expect(raised).toHaveLength(1);
      expect(Math.abs(raised[0]!.head - TRAM_WIRE)).toBeLessThan(0.02);
      // a second collector (the KT8D5's rear one) is folded down on its roof
      for (const h of heads.filter((x) => x.head <= 5)) expect(h.head).toBeLessThan(4.0);
      expect(heads.length).toBe(id === "proc-vehicle-tatra-kt8" ? 2 : 1);
    },
  );

  it("leaves the metro car without one: it runs on a third rail", () => {
    const tree = DESIGNS.get(proceduralId("proc-vehicle-metro-81-71"))!.build().sourceTree("m", "m");
    expect(walk(tree.root).some((n) => n.id.includes("pantograph"))).toBe(false);
    expect(walk(tree.root).filter((n) => n.id.endsWith("current-collectors"))).toHaveLength(2);
  });
});

describe("the articulated trams", () => {
  const cases = [
    ["proc-vehicle-tatra-kt8", 3, [[0], [1, 2], [3]]],
    ["proc-vehicle-tatra-kt4", 2, [[0], [1]]],
    ["proc-vehicle-kvag-gt4", 2, [[0], [1]]],
  ] as const;

  it.each(cases)("%s is %i sections and their joints, each bogie riding its own section", (id, n, owners) => {
    const m = DESIGNS.get(proceduralId(id))!.build();
    const rig = m.rig!;
    expect(rig.steer).toBeUndefined();
    expect(rig.sections!.map((s) => s.node)).toEqual(Array.from({ length: n }, (_, i) => `section${i}`));
    expect(rig.joints!.map((j) => j.node)).toEqual(Array.from({ length: n - 1 }, (_, i) => `joint${i}`));
    const { json } = parseGlb(m.toGlb(id));
    const nodes = (json.nodes as Array<{ name: string }>).map((x) => x.name);
    for (const s of rig.sections!) expect(nodes).toContain(s.node);
    const tree = m.sourceTree(id, id);
    const bogieOwners = walk(tree.root).filter((x) => /running-gear\/bogie(-\d)?$/.test(x.id)).map((x) => Number(x.id.match(/^section(\d)/)![1]));
    const expected = owners.flatMap((list, i) => list.map(() => i));
    expect(bogieOwners).toEqual(expected);
    // every hinge sits in the middle of its gap, the joint spanning the gap exactly
    rig.joints!.forEach((j, i) => {
      const pivot = rig.sections![i + 1]!.pivot;
      expect(pivot[0]).toBeCloseTo((j.front + j.rear) / 2, 9);
      expect(j.front).toBeGreaterThan(j.rear);
      const ahead = extent(id, (x) => x === `section${i}/body`);
      const behind = extent(id, (x) => x === `section${i + 1}/body`);
      expect(j.front).toBeCloseTo(ahead.min[0]!, 2);
      expect(j.rear).toBeCloseTo(behind.max[0]!, 2);
    });
  });
});

describe("the native comparison", () => {
  it.each(TRAM_TRANSFERS.map((t) => [t.key] as const))("%s keeps its windows and doors on their native boxes", (key) => {
    const rows = tramComparison(key);
    expect(rows.length).toBeGreaterThanOrEqual(15);
    const exact = rows.filter((r) => /^(window|door|left window|end window|cab door)/.test(r.element) && !/moved deliberately/.test(r.uncertainty));
    expect(exact.length).toBeGreaterThanOrEqual(4);
    for (const r of exact) expect(worstTramPixels(r), `${key} ${r.id}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it("holds the recorded mean absolute errors", () => {
    const limits: Record<string, number> = { tram_ckd_t3: 1.6, tram_ckd_t6: 1.7, tram_ckd_kt8: 1.35, tram_ckd_kt4: 2.65, tram_kvag_gt4: 4.15, "m_mmz_81-71l": 1.3 };
    for (const t of TRAM_TRANSFERS) expect(meanAbsoluteError(tramComparison(t.key)), t.key).toBeLessThanOrEqual(limits[t.key]!);
  });

  it("matches the T3's belt, the KT8D5's middle body and the 81-71's doors to the pixel", () => {
    const row = (key: string, id: string) => tramComparison(key).find((r) => r.id === id)!;
    expect(worstTramPixels(row("tram_ckd_t3", "belt"))).toBeLessThan(0.6);
    expect(worstTramPixels(row("tram_ckd_kt8", "bodyB"))).toBeLessThanOrEqual(1);
    for (const d of ["d1", "d2", "d3", "d4", "cabdoor"]) expect(worstTramPixels(row("m_mmz_81-71l", d))).toBeLessThan(0.1);
  });
});
