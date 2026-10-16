// The German coaches (generator/germanCoaches.ts): the DB n-Wagen, the DB Regio
// double-deck coach and the DR double-deck coach in the Berlin livery. The shared
// contract (envelope, budget, determinism, flicker, every parameter combination)
// is test/models.test.ts and test/params.test.ts; this file checks what the
// vlakosimdb transfer promises. See docs/models/german-coaches.md.

import { describe, expect, it } from "vitest";
import { GERMAN_COACHES, GERMAN_TRANSFERS } from "../generator/germanCoaches";
import { N_WAGEN_NUMBERS, N_WAGEN_PARAMS } from "../generator/dbNWagen";
import { DOSTO_NUMBERS } from "../generator/dbDoubleDeck";
import { DR_DOUBLE_DECK_NUMBERS } from "../generator/drDoubleDeck";
import { noseTop } from "../generator/germanCoachParts";
import { ALL_TRANSFERS, transferBuild } from "../generator/coachTransfers";
import { coachComparison, readLandmarks } from "../generator/csdCoachComparison";
import { uicCheckDigit } from "../generator/csdCoaches";
import { paramCombinations, type ParamValues } from "../generator/design";
import { glbStats } from "../generator/glbStats";
import { DESIGNS } from "../generator/generate";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));
const design = (id: string) => GERMAN_COACHES.find((d) => d.id === id)!;
function build(id: string, params?: ParamValues) {
  const d = design(id);
  const mesh = d.build(params);
  return { glb: mesh.toGlb(d.title), nodes: leaves(mesh.sourceTree(d.id, d.title).root), triangles: mesh.triangleCount() };
}
const bounds = (nodes: LeafNode[], re: RegExp) => {
  const hit = nodes.filter((n) => re.test(n.id) && n.min);
  return { n: hit.length, min: [0, 1, 2].map((i) => Math.min(...hit.map((h) => h.min![i]!))), max: [0, 1, 2].map((i) => Math.max(...hit.map((h) => h.max![i]!))) };
};

// Length over buffers and axle centres (Factory x): the n-Wagen's published
// 26.4 m and 19.0 m bogie pivots, the Goerlitz double-deck coaches' 26.8 m (the
// cab car 27.2 m, the DR coach on its 26.6 m XML body 27.0 m) and 20.0 m.
const MECHANICS: Record<string, { length: number; axles: number[]; wheel: number }> = {
  db_bnvr: { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75], wheel: 0.95 },
  db_abnvr: { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75], wheel: 0.95 },
  db_bdnrf: { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75], wheel: 0.95 },
  db_ds_re1: { length: 26.8, axles: [-11.25, -8.75, 8.75, 11.25], wheel: 0.92 },
  db_ds_re2: { length: 26.8, axles: [-11.25, -8.75, 8.75, 11.25], wheel: 0.92 },
  db_ds_re2_s: { length: 27.2, axles: [-11.45, -8.95, 8.55, 11.05], wheel: 0.92 },
  dr_sds_b: { length: 27.0, axles: [-11.25, -8.75, 8.75, 11.25], wheel: 0.9 },
  dr_sds_s: { length: 27.0, axles: [-11.25, -8.75, 8.75, 11.25], wheel: 0.9 },
};

describe("German coaches transferred from vlakosimdb", () => {
  it("are three parametric rail coaches with their references, registered for the build and the comparison", () => {
    expect(GERMAN_COACHES.map((d) => d.id)).toEqual(["veh-db-n-wagen", "veh-db-dosto", "veh-dr-sbahn-berlin"]);
    for (const d of GERMAN_COACHES) {
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "coach" });
      expect(d.references).toMatch(/^(db-n-wagen|db-dosto|dr-sbahn-berlin)$/);
    }
    expect(paramCombinations(design("veh-db-n-wagen").params)).toHaveLength(6);
    expect(N_WAGEN_PARAMS.map((p) => [p.name, p.default])).toEqual([["variant", "bn"], ["livery", "vr"]]);
    expect(design("veh-db-dosto").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "secondClass", ["firstClass", "secondClass", "drivingTrailer"]]]);
    expect(design("veh-dr-sbahn-berlin").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "coach", ["coach", "drivingTrailer"]]]);
    for (const t of GERMAN_TRANSFERS) expect(ALL_TRANSFERS).toContain(t);
    expect(() => design("veh-db-n-wagen").build({ livery: "blue" })).toThrow();
  });

  it.each(GERMAN_TRANSFERS.map((t) => [t.key] as const))("%s matches the native BMP landmarks within their pixel tolerances", (key) => {
    const rows = coachComparison(key);
    expect(rows.length).toBe(readLandmarks(key).length);
    expect(rows.length).toBeGreaterThanOrEqual(50);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(GERMAN_TRANSFERS.map((t) => [t.key] as const))("%s keeps its length over buffers, axle positions, wheels and standard gauge", (key) => {
    const t = GERMAN_TRANSFERS.find((x) => x.key === key)!;
    const mesh = transferBuild(t);
    const s = glbStats(mesh.toGlb(t.title));
    const nodes = leaves(mesh.sourceTree(t.id, t.title).root);
    const want = MECHANICS[key]!;
    expect(s.max[0] - s.min[0]).toBeCloseTo(want.length, 3);
    expect(s.max[0] + s.min[0]).toBeCloseTo(0, 3);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
    const axles = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
    expect(axles.map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b)).toEqual(want.axles);
    const treads = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-[24]$/.test(n.id));
    expect(treads).toHaveLength(8);
    for (const w of treads) {
      expect(w.min![1]).toBeCloseTo(0, 5);
      // a 24-sided wheel stands on a flat and has one on top: its height is 2 r cos(pi / 24)
      expect(w.max![1] - w.min![1]).toBeCloseTo(want.wheel * Math.cos(Math.PI / 24), 3);
      expect(Math.min(Math.abs(w.min![2]), Math.abs(w.max![2]))).toBeCloseTo(0.665, 4);
    }
  });

  it("n-Wagen: one 2.8 m body, the Bdnrf's Karlsruher Kopf sloping back from its 0.3 m tip; window counts by variant", () => {
    const bn = build("veh-db-n-wagen");
    const body = bounds(bn.nodes, /^body\/[a-z]+-band/);
    expect(body.max[2] - body.min[2]).toBeCloseTo(2.8, 3);
    expect(body.max[1]).toBeCloseTo(3.9, 3);
    const windows = (nodes: LeafNode[]) => new Set(nodes.filter((n) => /^body\/right-side\/window-\d+\/frame\//.test(n.id)).map((n) => n.id.split("/")[2])).size;
    expect(windows(bn.nodes)).toBe(14);
    expect(windows(build("veh-db-n-wagen", { variant: "abn" }).nodes)).toBe(13);
    const cab = build("veh-db-n-wagen", { variant: "bdnrf" });
    expect(windows(cab.nodes)).toBe(11);
    // the windscreens lean back: their top edge is further from the tip than their foot
    const ws = bounds(cab.nodes, /^rear-end\/cab\/windscreen\/window-1\/frame\//);
    expect(ws.n).toBeGreaterThan(0);
    expect(ws.max[0] - ws.min[0]).toBeGreaterThan(0.2);
    expect(bounds(cab.nodes, /^rear-end\/gangway/).n).toBe(0);
    expect(bounds(cab.nodes, /^front-end\/gangway/).n).toBeGreaterThan(0);
    // the luggage room's folding door has four windows
    expect(bounds(cab.nodes, /^body\/right-side\/door-2\/window-4\//).n).toBeGreaterThan(0);
  });

  it("n-Wagen: the liveries repaint one body", () => {
    for (const variant of ["bn", "abn", "bdnrf"]) {
      const vr = build("veh-db-n-wagen", { variant, livery: "vr" });
      const iv = build("veh-db-n-wagen", { variant, livery: "iv" });
      const frames = (nodes: LeafNode[]) => nodes.filter((n) => /\/window-\d+\/frame\//.test(n.id)).map((n) => `${n.id} ${n.min!.map((x) => x.toFixed(3))}`);
      expect(frames(iv.nodes)).toEqual(frames(vr.nodes));
      const mats = (nodes: LeafNode[]) => new Set(nodes.map((n) => n.material));
      expect(mats(vr.nodes).has("red")).toBe(true);
      expect(mats(iv.nodes).has("mint")).toBe(true);
      expect(mats(iv.nodes).has("red")).toBe(false);
    }
  });

  it("double-deck coaches drop the lower deck between the bogies and keep the single-level ends", () => {
    for (const [id, centre, drop, end] of [["veh-db-dosto", 13.4, 0.5, 0.9], ["veh-dr-sbahn-berlin", 13.5, 0.5, 1.0]] as const) {
      const { nodes } = build(id);
      const bands = nodes.filter((n) => /^body\/[a-z-]+-band\//.test(n.id) && n.min);
      const at = (x: number) => Math.min(...bands.filter((n) => n.min![0] <= x - centre && n.max![0] >= x - centre).map((n) => n.min![1]));
      expect(at(13.4)).toBeCloseTo(drop, 3);
      expect(at(2.0)).toBeCloseTo(end, 3);
      expect(Math.max(...bands.map((n) => n.max![1]))).toBeCloseTo(4.6, 3);
      // six lower-deck windows below the 2 m line, upper-deck windows above 3.2 m
      const lower = bounds(nodes, /^body\/right-side\/lower-deck\/window-\d+\/frame\//);
      const upper = bounds(nodes, /^body\/right-side\/upper-deck\/window-\d+\/frame\//);
      expect(lower.max[1]).toBeLessThan(2.0);
      expect(upper.min[1]).toBeGreaterThan(3.05);
    }
  });

  it("the DB driving trailer's cab slopes back along its XML elevation without bands standing proud of it", () => {
    const { nodes } = build("veh-db-dosto", { variant: "drivingTrailer" });
    const bands = nodes.filter((n) => /^body\/[a-z-]+-band\//.test(n.id) && n.min);
    // the XML elevation (db_ds_re2_s alongz, here in re2 columns, 0.2 m on): the
    // front at height y; Factory x = that x - 13.6. No band piece may reach ahead of
    // the slope at its own lowest point (a wedge did, before noseTop).
    const prof: Array<[number, number]> = [[27.0, 1.1], [26.9, 2.0], [26.4, 3.3], [25.0, 4.6]];
    const front = (y: number) => {
      if (y <= 1.1) return 27.0;
      for (let i = 1; i < prof.length; i++) if (y <= prof[i]![1]) return prof[i - 1]![0] + ((y - prof[i - 1]![1]) / (prof[i]![1] - prof[i - 1]![1])) * (prof[i]![0] - prof[i - 1]![0]);
      return 25.0;
    };
    for (const n of bands) expect(n.max![0] + 13.6, `${n.id} at ${n.min![1].toFixed(3)} m`).toBeLessThanOrEqual(front(n.min![1]) + 0.005);
    const top = noseTop([[0, 4.6], [24.8, 4.6], [26.2, 3.3]], [[3.0, 3.1, "a"], [3.1, 4.1, "b"]]);
    expect(top.map((p) => p[1])).toEqual([4.6, 4.6, 4.1, 3.3]);
    expect(top[2]![0]).toBeCloseTo(24.8 + (0.5 / 1.3) * 1.4, 6);
    expect(bounds(nodes, /^front-end\/cab\/windscreen\//).n).toBeGreaterThan(0);
    expect(bounds(nodes, /^rear-end\/gangway/).n).toBeGreaterThan(0);
  });

  it("the DR driving trailer has the DBmq's flat cab end with two windscreens at x = 0", () => {
    const { nodes } = build("veh-dr-sbahn-berlin", { variant: "drivingTrailer" });
    const g1 = bounds(nodes, /^rear-end\/cab\/windscreen\/glass-1\//);
    const g2 = bounds(nodes, /^rear-end\/cab\/windscreen\/glass-2\//);
    expect(g1.n).toBeGreaterThan(0);
    expect(g2.min[2]).toBeGreaterThan(g1.max[2]);
    expect(g1.max[0] - g1.min[0]).toBeLessThan(0.02);
    expect(bounds(nodes, /^rear-end\/gangway/).n).toBe(0);
  });

  it("carry valid running numbers and stay inside the coach budget", () => {
    for (const { number } of [...Object.values(N_WAGEN_NUMBERS), ...Object.values(DOSTO_NUMBERS), ...Object.values(DR_DOUBLE_DECK_NUMBERS)]) {
      expect(number).toMatch(/^\d{2} \d{2} \d{2}-\d{2} \d{3}-\d$/);
      expect(uicCheckDigit(number), number).toBe(Number(number.slice(-1)));
    }
    for (const d of GERMAN_COACHES)
      for (const p of paramCombinations(d.params)) {
        const t = d.build(p).triangleCount();
        expect(t, `${d.id} ${JSON.stringify(p)}`).toBeLessThan(12000);
      }
  });
});
