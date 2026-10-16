import { describe, it, expect } from "vitest";
import { MAINLINE_ELECTRICS } from "../generator/mainlineElectrics.ts";
import { CD181_LIVERIES } from "../generator/cd181.ts";
import { DNT184_LIVERIES } from "../generator/dnt184.ts";
import { DB111_LIVERIES } from "../generator/db111.ts";
import { DR243_LIVERIES } from "../generator/dr243.ts";
import { OBB1012_NUMBER } from "../generator/obb1012.ts";
import { OBB1040_NUMBER } from "../generator/obb1040.ts";
import { MAINLINE_COMPARED, compare } from "../generator/mainlineComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
function build(id: string, params?: ParamValues) {
  const d = MAINLINE_ELECTRICS.find((x) => x.id === id)!;
  const mesh = d.build(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree(id, d.title).root) };
}
/** The CSD / DB / DR scheme `ABC DEF-G`: from the right, weights 2, 1, 2, ...; digit sums; to the next ten. */
const valid = (number: string): boolean => {
  const digits = [...number.replace(/\D/g, "")].map(Number);
  const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
  return /^\d{3} \d{3}-\d$/.test(number) && (10 - (sum % 10)) % 10 === digits[6];
};
const axlesAt = (pivot: number, half: number, axles = [-half, half]) => [-pivot, pivot].flatMap((p) => axles.map((a) => Number((p + a).toFixed(3)))).sort((a, b) => a - b);

// published dimensions (assets/<folder>/SOURCES.md): over the buffers, the axles' x, the wheel radius, the pantograph kind
const SPECS: Record<string, { lob: number; axles: (p: ParamValues) => number[]; r: number; diamond: boolean }> = {
  "veh-cd-180": { lob: 18.8, axles: () => axlesAt(4.1, 2.4, [-2.4, 0, 2.4]), r: 0.625, diamond: true },
  "veh-dnt-184-5": { lob: 20.346, axles: () => [...axlesAt(5.5, 1.55), -1.55, 1.55].sort((a, b) => a - b), r: 0.625, diamond: false },
  "veh-db-111": { lob: 16.75, axles: () => axlesAt(3.95, 1.7), r: 0.625, diamond: false },
  "veh-dr-243": { lob: 16.64, axles: (p) => axlesAt(p.livery === "db112" ? 4.2 : 4.25, 1.65), r: 0.625, diamond: false },
  "veh-obb-1012": { lob: 19.3, axles: () => axlesAt(4.95, 1.4), r: 0.575, diamond: false },
  "veh-obb-1040": { lob: 12.92, axles: () => axlesAt(3.8, 1.2), r: 0.65, diamond: true },
};

describe("mainline electric locomotives from vlakosimdb", () => {
  it("registers the six designs with their parameters and defaults", () => {
    expect(MAINLINE_ELECTRICS.map((d) => d.id)).toEqual(["veh-cd-180", "veh-dnt-184-5", "veh-db-111", "veh-dr-243", "veh-obb-1012", "veh-obb-1040"]);
    const values = (i: number) => MAINLINE_ELECTRICS[i]!.params![0]!.values.map((v) => v.value);
    expect(values(0)).toEqual(["cd180", "cd181", "cd181Okd", "cd182"]);
    expect(MAINLINE_ELECTRICS[0]!.params![0]!.default).toBe("cd181");
    expect(values(1)).toEqual(["dnt1845", "dnt1845No1", "dnt1845No2"]);
    expect(MAINLINE_ELECTRICS[1]!.params![0]!.default).toBe("dnt1845");
    expect(values(2)).toEqual(["db111", "db111Bb", "db111S"]);
    expect(MAINLINE_ELECTRICS[2]!.params![0]!.default).toBe("db111");
    expect(values(3)).toEqual(["dr243", "db143", "db143vr", "db112"]);
    expect(MAINLINE_ELECTRICS[3]!.params![0]!.default).toBe("dr243");
    expect(MAINLINE_ELECTRICS[4]!.params).toBeUndefined();
    expect(MAINLINE_ELECTRICS[5]!.params).toBeUndefined();
    for (const d of MAINLINE_ELECTRICS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco" });
  });

  for (const d of MAINLINE_ELECTRICS)
    for (const params of paramCombinations(d.params))
      it(`${d.id} ${JSON.stringify(params)}: length, running gear, envelope, budget and pantographs`, () => {
        const spec = SPECS[d.id]!;
        const { mesh, tris, nodes } = build(d.id, params);
        expect(mesh.triangleCount()).toBeLessThanOrEqual(16000);
        const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
        expect(Math.max(...xs)).toBeCloseTo(spec.lob / 2, 5);
        expect(Math.min(...xs)).toBeCloseTo(-spec.lob / 2, 5);
        expect(Math.min(...tris.flatMap((t) => t.p.map((p) => p[1])))).toBeCloseTo(0, 5);
        const z = tris.flatMap((t) => t.p.map((p) => p[2]));
        expect(Math.max(...z) - Math.min(...z)).toBeLessThanOrEqual(3.1);
        expect(Math.max(...z) + Math.min(...z)).toBeCloseTo(0, 5);
        const fixed = nodes.filter((n) => !n.id.startsWith("roof-equipment/pantographs/"));
        expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
        expect(Math.max(...nodes.map((n) => n.max![1]))).toBeLessThanOrEqual(6.5);
        // the wheel treads: steel sweeps a wheel diameter high, standing on the rail, 1.435 m gauge
        const treads = nodes.filter((n) => n.id.startsWith("bogies/") && n.material === "steel" && Math.abs(n.max![1] - n.min![1] - 2 * spec.r * Math.cos(Math.PI / 20)) < 0.002);
        const expected = spec.axles(params);
        expect(treads).toHaveLength(2 * expected.length);
        const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
        expect(axles).toEqual(expected);
        for (const n of treads) {
          expect(n.min![1]).toBeCloseTo(0, 5);
          expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
        }
        // two collectors: level strips, the rear (-X) raised to 5.87 m and the front folded
        const heads = (name: string) => nodes.filter((n) => n.id.startsWith(`roof-equipment/pantographs/${name}/head/`) && n.material === "carbon");
        const rear = heads("rear-pantograph"), front = heads("front-pantograph");
        expect(rear).toHaveLength(2);
        expect(front).toHaveLength(2);
        for (const h of [...rear, ...front]) expect(h.max![1] - h.min![1]).toBeCloseTo(0.05, 5);
        expect(Math.max(...rear.map((n) => n.max![1]))).toBeCloseTo(5.87, 3);
        expect(Math.max(...front.map((n) => n.max![1]))).toBeLessThan(4.9);
        for (const n of rear) expect(n.max![0]).toBeLessThan(0);
        for (const n of front) expect(n.min![0]).toBeGreaterThan(0);
        // the diamond's eight arms, or the single arm's A-frame
        const arms = nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/rear-pantograph/arms/"));
        if (spec.diamond) expect(arms).toHaveLength(8);
        else expect(arms.some((n) => n.id.includes("/lower-arms/"))).toBe(true);
      });

  it("matches the annotated native landmarks within the stated pixel tolerances", () => {
    for (const d of MAINLINE_COMPARED) {
      const rows = compare(d);
      expect(rows.length, d.id).toBeGreaterThanOrEqual(9);
      for (const row of rows)
        for (let i = 0; i < 4; i++)
          expect(Math.abs(row.model[i]! - row.source[i]!), `${d.id} ${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
    }
  });

  it("carries valid running numbers", () => {
    const all = [CD181_LIVERIES, DNT184_LIVERIES, DB111_LIVERIES, DR243_LIVERIES].flatMap((ls) => Object.values(ls).map((l) => l.number));
    for (const n of all) expect(valid(n), n).toBe(true);
    expect(new Set(all).size).toBe(all.length);
    expect(CD181_LIVERIES.cd181.number).toBe("181 105-8");
    expect(DR243_LIVERIES.dr243.number).toBe("243 864-6");
    expect(OBB1012_NUMBER).toBe("1012.001");
    expect(OBB1040_NUMBER).toBe("1040 013-3");
  });

  it("lays each side's own equipment", () => {
    // DNT 184.5: windows on the right (+z), grille bays on the left; the CD 180 its louvre banks
    const dnt = build("veh-dnt-184-5").nodes;
    expect(dnt.some((n) => n.id.startsWith("sides/right-side/window-1/"))).toBe(true);
    expect(dnt.some((n) => n.id.startsWith("sides/left-side/window-1/"))).toBe(false);
    expect(dnt.filter((n) => n.id.startsWith("sides/left-side/grille-") && n.id.endsWith("/louvre/facets-1")).length).toBe(10);
    const cd180 = build("veh-cd-180", { livery: "cd180" }).nodes;
    expect(cd180.some((n) => n.id.startsWith("sides/right-side/louvre-4/"))).toBe(true);
    expect(build("veh-cd-180").nodes.some((n) => n.id.startsWith("sides/right-side/louvre-"))).toBe(false);
    // the DB 112's pivots 8.4 m apart against the 243's 8.5 m
    const pivots = (p: ParamValues) => build("veh-dr-243", p).nodes.filter((n) => n.id.startsWith("bogies/front-bogie/frame/")).map((n) => (n.min![0] + n.max![0]) / 2);
    expect(Math.max(...pivots({ livery: "dr243" })) - Math.max(...pivots({ livery: "db112" }))).toBeCloseTo(0.05, 3);
  });
});
