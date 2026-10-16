import { describe, it, expect } from "vitest";
import { SMALL_DIESELS } from "../generator/smallDiesels.ts";
import { CD704_LIVERIES } from "../generator/cd704.ts";
import { CD710_NUMBER } from "../generator/cd710.ts";
import { CD714_NUMBER } from "../generator/cd714.ts";
import { CD742_VARIANTS } from "../generator/cd742.ts";
import { DB212_LIVERIES } from "../generator/db212.ts";
import { COMPARED, compare } from "../generator/smallDieselComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
function build(id: string, params?: ParamValues) {
  const d = SMALL_DIESELS.find((x) => x.id === id)!;
  const mesh = d.build(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree(id, d.title).root) };
}
const valid = (number: string): boolean => {
  const digits = [...number.replace(/\D/g, "")].map(Number);
  const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
  return /^\d{3} \d{3}-\d$/.test(number) && (10 - (sum % 10)) % 10 === digits[6];
};

// published dimensions (assets/<folder>/SOURCES.md): over the buffers or couplers, the axles' x, the wheel radius, the height
const SPECS: Record<string, { lob: number; axles: number[]; r: number; height: [number, number] }> = {
  "veh-cd-704": { lob: 7.5, axles: [-1.6, 1.6], r: 0.5, height: [3.55, 3.75] },
  "veh-cd-710": { lob: 9.44, axles: [-2.05, 0.15, 2.15], r: 0.5, height: [3.6, 3.8] },
  "veh-cd-714": { lob: 14.24, axles: [-5.0, -2.6, 2.6, 5.0], r: 0.5, height: [4.2, 4.45] },
  "veh-cd-742": { lob: 13.6, axles: [-4.55, -2.15, 2.15, 4.55], r: 0.5, height: [4.4, 4.5] },
  "veh-db-212": { lob: 12.3, axles: [-4.1, -1.9, 1.9, 4.1], r: 0.475, height: [4.25, 4.35] },
  "veh-muv-69": { lob: 6.76, axles: [-2.127, 1.598], r: 0.28, height: [2.9, 3.15] },
};

describe("small and shunting diesels from vlakosimdb", () => {
  it("registers the six designs with their parameters and defaults", () => {
    expect(SMALL_DIESELS.map((d) => d.id)).toEqual(["veh-cd-704", "veh-cd-710", "veh-cd-714", "veh-cd-742", "veh-db-212", "veh-muv-69"]);
    const values = (id: string) => SMALL_DIESELS.find((d) => d.id === id)!.params?.map((p) => [p.name, p.default, p.values.map((v) => v.value)]);
    expect(values("veh-cd-704")).toEqual([["livery", "cd704", ["cd704", "t2380"]]]);
    expect(values("veh-cd-742")).toEqual([["variant", "viamont742", ["viamont742", "viamont740", "cd743"]]]);
    expect(values("veh-db-212")).toEqual([["livery", "oldRed", ["oldRed", "oceanBlue", "trafficRed"]]]);
    for (const id of ["veh-cd-710", "veh-cd-714", "veh-muv-69"]) expect(values(id)).toBeUndefined();
    for (const d of SMALL_DIESELS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco" });
  });

  for (const d of SMALL_DIESELS)
    for (const params of paramCombinations(d.params))
      it(`${d.id} ${JSON.stringify(params)}: length, running gear, envelope and budget`, () => {
        const spec = SPECS[d.id]!;
        const { mesh, tris, nodes } = build(d.id, params);
        expect(mesh.triangleCount()).toBeLessThanOrEqual(16000);
        const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
        expect(Math.max(...xs)).toBeCloseTo(spec.lob / 2, 5);
        expect(Math.min(...xs)).toBeCloseTo(-spec.lob / 2, 5);
        const ys = tris.flatMap((t) => t.p.map((p) => p[1]));
        expect(Math.min(...ys)).toBeCloseTo(0, 5);
        expect(Math.max(...ys)).toBeGreaterThanOrEqual(spec.height[0]);
        expect(Math.max(...ys)).toBeLessThanOrEqual(spec.height[1]);
        const z = tris.flatMap((t) => t.p.map((p) => p[2]));
        expect(Math.max(...z) - Math.min(...z)).toBeLessThanOrEqual(3.1);
        expect(Math.max(...z) + Math.min(...z)).toBeCloseTo(0, 5);
        // the wheel treads: steel sweeps a wheel diameter high, standing on the rail, 1.435 m gauge
        const treads = nodes.filter((n) => n.material === "steel" && Math.abs(n.max![1] - n.min![1] - 2 * spec.r * Math.cos(Math.PI / 20)) < 0.002 && n.min![1] < 1e-6);
        expect(treads).toHaveLength(2 * spec.axles.length);
        const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
        expect(axles).toHaveLength(spec.axles.length);
        axles.forEach((x, i) => expect(x).toBeCloseTo(spec.axles[i]!, 2));
        for (const n of treads) expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
      });

  it("matches the annotated native landmarks within the stated pixel tolerances", () => {
    expect(COMPARED.map((d) => d.id)).toEqual(SMALL_DIESELS.map((d) => d.id));
    for (const d of COMPARED) {
      const rows = compare(d);
      expect(rows.length, d.id).toBeGreaterThanOrEqual(10);
      for (const row of rows)
        for (let i = 0; i < 4; i++)
          expect(Math.abs(row.model[i]! - row.source[i]!), `${d.id} ${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
    }
  });

  it("carries valid running numbers", () => {
    const numbers = [
      ...Object.values(CD704_LIVERIES).map((l) => l.number), CD710_NUMBER, CD714_NUMBER,
      ...Object.values(CD742_VARIANTS).map((v) => v.number), ...Object.values(DB212_LIVERIES).map((l) => l.number),
    ];
    for (const n of numbers) expect(valid(n), n).toBe(true);
    expect(CD704_LIVERIES.cd704.number).toBe("704 014-0");
    expect(CD704_LIVERIES.t2380.number).toBe("704 518-0");
    expect(CD710_NUMBER).toBe("710 620-6");
    expect(CD714_NUMBER).toBe("714 017-1");
    expect(CD742_VARIANTS.viamont742.number).toBe("742 507-7");
    expect(CD742_VARIANTS.viamont740.number).toBe("740 627-5");
    expect(CD742_VARIANTS.cd743.number).toBe("743 002-8");
    expect(DB212_LIVERIES.oldRed.number).toBe("212 325-5");
    expect(DB212_LIVERIES.trafficRed.number).toBe("212 376-8");
  });

  it("gives the 740 its low, wide short hood and the 710 its coupling rods", () => {
    const top = (params: ParamValues) => {
      const hood = build("veh-cd-742", params).nodes.filter((n) => n.id.startsWith("body/short-hood/"));
      return [Math.max(...hood.map((n) => n.max![1])), Math.max(...hood.map((n) => n.max![2]))];
    };
    const [h742, w742] = top({ variant: "viamont742" });
    const [h740, w740] = top({ variant: "viamont740" });
    expect(h742).toBeCloseTo(4.4, 5);
    expect(h740).toBeLessThan(3.2);
    expect(w740).toBeCloseTo(1.15, 5);
    expect(w742).toBeCloseTo(1.0, 5);
    const rods = build("veh-cd-710").nodes.filter((n) => n.id.includes("/rods/coupling-rod"));
    expect(rods).toHaveLength(2);
    for (const r of rods) {
      expect(r.min![0]).toBeLessThan(-2.05);
      expect(r.max![0]).toBeGreaterThan(2.15);
    }
  });
});
