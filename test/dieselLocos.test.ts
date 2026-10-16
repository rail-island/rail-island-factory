import { describe, it, expect } from "vitest";
import { DIESEL_LOCOS } from "../generator/dieselLocos.ts";
import { CD750_LIVERIES, CD750_NUMBER } from "../generator/cd750.ts";
import { CD781_LIVERIES, CD781_NUMBER } from "../generator/cd781.ts";
import { CD771_LIVERIES, CD771_NUMBER } from "../generator/cd771.ts";
import { T679_NUMBER, T679_NUMBER_1988 } from "../generator/csdT679.ts";
import { T499_NUMBER } from "../generator/csdT499.ts";
import { DIESEL_COMPARISONS, dieselComparison, meanAbsoluteError } from "../generator/dieselComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
const design = (id: string) => DIESEL_LOCOS.find((d) => d.id === id)!;
function built(id: string, params?: ParamValues) {
  const mesh = design(id).build(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree(id, id).root) };
}
/** The CSD/CD 1988 check digit: from the right, weights 2 and 1, digit sums, to the next ten. */
function checkDigit(six: string): number {
  let sum = 0;
  [...six].reverse().forEach((ch, i) => {
    const p = Number(ch) * (i % 2 === 0 ? 2 : 1);
    sum += Math.floor(p / 10) + (p % 10);
  });
  return (10 - (sum % 10)) % 10;
}
function validNumber(n: string): boolean {
  const m = /^(\d{3}) (\d{3})-(\d)$/.exec(n);
  return !!m && checkDigit(m[1]! + m[2]!) === Number(m[3]);
}

// over the buffers, the pivots and the axle offsets in each bogie (published, see the SOURCES.md files)
const RUNNING_GEAR: Record<string, { length: number; pivot: number; axles: number[]; wheelR: number }> = {
  "proc-vehicle-cd-750": { length: 16.54, pivot: 4.5, axles: [-1.2, 1.2], wheelR: 0.5 },
  "proc-vehicle-cd-781": { length: 17.55, pivot: 4.3, axles: [-2.1, 0, 2.1], wheelR: 0.525 },
  "proc-vehicle-csd-t679-0": { length: 18.0, pivot: 4.78, axles: [-2.0, 0, 2.0], wheelR: 0.5 },
  "proc-vehicle-csd-t499": { length: 17.84, pivot: 5.0, axles: [-1.3, 1.3], wheelR: 0.5 },
  "proc-vehicle-cd-771": { length: 17.25, pivot: 4.33, axles: [-2.0, 0, 2.0], wheelR: 0.525 },
};

describe("Czech mainline diesel locomotives", () => {
  it("are the five designs with their ids, titles and default parameters", () => {
    expect(DIESEL_LOCOS.map((d) => d.id)).toEqual(["proc-vehicle-cd-750", "proc-vehicle-cd-781", "proc-vehicle-csd-t679-0", "proc-vehicle-csd-t499", "proc-vehicle-cd-771"]);
    expect(DIESEL_LOCOS.map((d) => d.title)).toEqual(["CD 749 / 750 / 753 / 754", "CD 781 Sergej", "CSD T 679.0 Pomeranc", "CSD T 499.0 / CD 759 Kyklop", "CD 770 / 771 Cmelak"]);
    expect(design("proc-vehicle-cd-750").params![0]).toMatchObject({ name: "livery", default: "cd750" });
    expect(design("proc-vehicle-cd-750").params![0]!.values.map((v) => v.value)).toEqual(["cd750", "cd750No308", "cd753", "cd754", "cd754No013", "cd749"]);
    expect(design("proc-vehicle-cd-781").params![0]!.values.map((v) => v.value)).toEqual(["cd781", "cd781No462"]);
    expect(design("proc-vehicle-cd-771").params![0]).toMatchObject({ name: "livery", default: "cd771No235" });
    expect(design("proc-vehicle-cd-771").params![0]!.values.map((v) => v.value)).toEqual(["cd771", "cd771No235", "cd771No421"]);
    expect(design("proc-vehicle-csd-t679-0").params).toBeUndefined();
    expect(design("proc-vehicle-csd-t499").params).toBeUndefined();
    for (const d of DIESEL_LOCOS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco" });
  });

  it("builds every livery inside the 3.1 m by 4.7 m envelope and the triangle budget, standing on the rails", () => {
    for (const d of DIESEL_LOCOS)
      for (const params of paramCombinations(d.params)) {
        const { mesh, tris } = built(d.id, params);
        const label = `${d.id} ${JSON.stringify(params)}`;
        expect(mesh.triangleCount(), label).toBeLessThanOrEqual(16_000);
        expect(mesh.triangleCount(), label).toBeGreaterThan(8_000);
        const ys = tris.flatMap((t) => t.p.map((p) => p[1]));
        const zs = tris.flatMap((t) => t.p.map((p) => p[2]));
        expect(Math.min(...ys), label).toBeCloseTo(0, 6);
        expect(Math.max(...ys), label).toBeLessThanOrEqual(4.7);
        expect(Math.max(...zs.map(Math.abs)), label).toBeLessThanOrEqual(1.55);
        expect(Math.min(...zs), label).toBeCloseTo(-Math.max(...zs), 6);
      }
  }, 120_000);

  it("keeps the published length over the buffers, pivots, wheelbase, wheels and gauge", () => {
    for (const [id, g] of Object.entries(RUNNING_GEAR)) {
      const { tris, nodes } = built(id);
      const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
      expect(Math.max(...xs) - Math.min(...xs), id).toBeCloseTo(g.length, 2);
      const treads = nodes.filter((n) => n.id.startsWith("bogies/") && n.material === "steel" && n.max![1] - n.min![1] > 1.5 * g.wheelR);
      const expected = [-g.pivot, g.pivot].flatMap((c) => g.axles.map((a) => c + a)).sort((a, b) => a - b);
      expect(treads, id).toHaveLength(2 * expected.length);
      const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
      expect(axles, id).toEqual(expected.map((x) => Number(x.toFixed(3))));
      for (const n of treads) {
        expect(n.min![1], id).toBeCloseTo(0, 5);
        expect(n.max![1] - n.min![1], id).toBeCloseTo(2 * g.wheelR, 1);
        // the treads' inner faces 1.33 m apart: standard gauge with the flanges inside
        expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2])), id).toBeCloseTo(0.665, 4);
      }
    }
  }, 120_000);

  it("builds the Bardotka body for the CD 749 and the Brejlovec for the others", () => {
    const bardotka = built("proc-vehicle-cd-750", { livery: "cd749" });
    const xs = bardotka.tris.flatMap((t) => t.p.map((p) => p[0]));
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(16.5, 2);
    // the brow over the windscreen overhangs the glass's top (XML alongz: 0.2 m ahead at 3.72 m),
    // and the nose under it leans out past the glass's foot (0.4 m at 2.7 m)
    const front = (mat: string, y0: number, y1: number) =>
      Math.max(...bardotka.tris.filter((t) => t.material === mat).flatMap((t) => t.p).filter((p) => p[0] > 0 && p[1] >= y0 && p[1] <= y1).map((p) => p[0]));
    const glassTop = front("glass", 3.5, 3.7), glassFoot = front("glass", 2.9, 3.0);
    expect(front("red", 3.72, 3.9)).toBeGreaterThan(glassTop + 0.15);
    expect(front("grey", 2.6, 2.75)).toBeGreaterThan(glassFoot + 0.3);
    for (const livery of Object.keys(CD750_LIVERIES).filter((k) => k !== "cd749")) {
      const { tris } = built("proc-vehicle-cd-750", { livery });
      const lx = tris.flatMap((t) => t.p.map((p) => p[0]));
      expect(Math.max(...lx) - Math.min(...lx), livery).toBeCloseTo(16.54, 2);
    }
  }, 120_000);

  it("matches the independently annotated native fronts and sides within the stated pixel tolerances", () => {
    const counts: Record<string, number> = { "proc-vehicle-cd-750": 60, "proc-vehicle-cd-781": 35, "proc-vehicle-csd-t679-0": 27, "proc-vehicle-csd-t499": 29, "proc-vehicle-cd-771": 14 };
    for (const c of DIESEL_COMPARISONS) {
      const rows = dieselComparison(c);
      expect(rows, c.id).toHaveLength(counts[c.id]!);
      expect(new Set(rows.map((r) => r.id)).size, c.id).toBe(rows.length);
      for (const row of rows)
        for (let i = 0; i < 4; i++) expect(Math.abs(row.model[i]! - row.source[i]!), `${c.id} ${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
      expect(meanAbsoluteError(rows), c.id).toBeLessThan(1.1);
    }
  }, 120_000);

  it("shows valid running numbers", () => {
    for (const l of [...Object.values(CD750_LIVERIES), ...Object.values(CD781_LIVERIES), ...Object.values(CD771_LIVERIES)]) expect(validNumber(l.number), l.number).toBe(true);
    expect(CD750_NUMBER).toBe("750 330-3");
    expect(CD781_NUMBER).toBe("781 529-3");
    expect(CD771_NUMBER).toBe("771 235-9");
    expect(CD750_LIVERIES.cd749.number).toBe("749 264-8");
    expect(CD750_LIVERIES.cd753.number).toBe("753 286-4");
    expect(T679_NUMBER).toMatch(/^T 679\.0\d\d$/);
    expect(validNumber(T679_NUMBER_1988)).toBe(true);
    expect(T499_NUMBER).toBe("T 499.0002");
  });
});
