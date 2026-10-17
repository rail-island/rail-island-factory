import { describe, it, expect } from "vitest";
import { CZ_ELECTRICS } from "../generator/czElectrics.ts";
import { CD110_LIVERIES } from "../generator/cd110.ts";
import { CD130_LIVERIES } from "../generator/cd130.ts";
import { CD140_NUMBER } from "../generator/cd140.ts";
import { CD169_NUMBER } from "../generator/cd169.ts";
import { COMPARED, compare } from "../generator/czElectricComparison.ts";
import { paramCombinations, type ParamValues } from "../generator/design.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";
import { sample } from "./catalogCache";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
function build(id: string, params?: ParamValues) {
  const d = CZ_ELECTRICS.find((x) => x.id === id)!;
  const mesh = d.build(params);
  const { json, bin } = parseGlb(mesh.toGlb("test"));
  return { mesh, tris: collectTriangles(json, bin), nodes: leaves(mesh.sourceTree(id, d.title).root) };
}
const valid = (number: string): boolean => {
  const digits = [...number.replace(/\D/g, "")].map(Number);
  const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
  return /^\d{3} \d{3}-\d$/.test(number) && (10 - (sum % 10)) % 10 === digits[6];
};

// published dimensions (assets/<folder>/SOURCES.md): over the buffers, the axles' x, the wheel radius
const SPECS: Record<string, { lob: number; axles: (p: ParamValues) => number[]; r: number; pantographs: number }> = {
  "proc-vehicle-cd-110": { lob: 14.4, axles: () => [-4.55, -1.75, 1.75, 4.55], r: 0.525, pantographs: 1 },
  "proc-vehicle-cd-130": { lob: 17.21, axles: (p) => (p.livery === "cd130" ? [-5.685, -2.485, 2.485, 5.685] : [-5.75, -2.42, 2.42, 5.75]), r: 0.625, pantographs: 2 },
  "proc-vehicle-cd-140": { lob: 15.74, axles: () => [-5.75, -2.42, 2.42, 5.75], r: 0.625, pantographs: 2 },
  "proc-vehicle-cd-169": { lob: 18.0, axles: () => [-5.6, -3.1, 3.1, 5.6], r: 0.625, pantographs: 2 },
};

describe("Czech electric locomotives from vlakosimdb", () => {
  it("registers the four designs with their parameters and defaults", () => {
    expect(CZ_ELECTRICS.map((d) => d.id)).toEqual(["proc-vehicle-cd-110", "proc-vehicle-cd-130", "proc-vehicle-cd-140", "proc-vehicle-cd-169"]);
    expect(CZ_ELECTRICS[0]!.params![0]!.values.map((v) => v.value)).toEqual(["cd110", "cd111", "cd210"]);
    expect(CZ_ELECTRICS[0]!.params![0]!.default).toBe("cd110");
    expect(CZ_ELECTRICS[1]!.params![0]!.values.map((v) => v.value)).toEqual(["cd130", "cd123", "cd123No019"]);
    expect(CZ_ELECTRICS[1]!.params![0]!.default).toBe("cd130");
    expect(CZ_ELECTRICS[2]!.params).toBeUndefined();
    expect(CZ_ELECTRICS[3]!.params).toBeUndefined();
    for (const d of CZ_ELECTRICS) expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "loco", traction: "electric" });
  });

  for (const d of CZ_ELECTRICS)
    for (const params of sample(paramCombinations(d.params)))
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
        expect(treads).toHaveLength(8);
        const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
        expect(axles).toEqual(spec.axles(params));
        for (const n of treads) {
          expect(n.min![1]).toBeCloseTo(0, 5);
          expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
        }
        // collectors: level strips; with two, the rear (-X) raised to 5.87 m and the front folded
        const heads = (name: string) => nodes.filter((n) => n.id.startsWith(`roof-equipment/pantographs/${name}/head/`) && n.material === "carbon");
        if (spec.pantographs === 2) {
          const rear = heads("rear-pantograph"), front = heads("front-pantograph");
          expect(rear).toHaveLength(2);
          expect(front).toHaveLength(2);
          for (const h of [...rear, ...front]) expect(h.max![1] - h.min![1]).toBeCloseTo(0.05, 5);
          expect(Math.max(...rear.map((n) => n.max![1]))).toBeCloseTo(5.87, 3);
          expect(Math.max(...front.map((n) => n.max![1]))).toBeLessThan(4.9);
          for (const n of rear) expect(n.max![0]).toBeLessThan(0);
          for (const n of front) expect(n.min![0]).toBeGreaterThan(0);
        } else {
          const h = heads("pantograph");
          expect(h).toHaveLength(2);
          expect(Math.max(...h.map((n) => n.max![1]))).toBeCloseTo(5.87, 3);
        }
      });

  it("keeps the single-arm pantographs' arm lengths in both poses", () => {
    // the CD 130's arms: the lower A-frame and the upper tubes are the same length raised and folded
    const { tris, nodes } = build("proc-vehicle-cd-130");
    const length = (id: string) => {
      const n = nodes.find((x) => x.id === id)!;
      const ps = tris.filter((t) => t.material === n.material).slice(n.tri[0], n.tri[0] + n.tri[1]).flatMap((t) => t.p);
      const end = (x: number) => {
        const at = ps.filter((p) => Math.abs(p[0] - x) < 1e-5);
        return [x, at.reduce((s, p) => s + p[1], 0) / at.length, at.reduce((s, p) => s + p[2], 0) / at.length];
      };
      const [a, b] = [end(Math.min(...ps.map((p) => p[0]))), end(Math.max(...ps.map((p) => p[0])))];
      return Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!);
    };
    for (const part of ["lower-arms/sweep-1", "upper-arms/sweep-1"]) {
      const raised = length(`roof-equipment/pantographs/rear-pantograph/arms/${part}`);
      const folded = length(`roof-equipment/pantographs/front-pantograph/arms/${part}`);
      expect(raised).toBeCloseTo(folded, 2);
    }
  });

  it("matches the annotated native landmarks within the stated pixel tolerances", () => {
    for (const d of COMPARED) {
      const rows = compare(d);
      expect(rows.length, d.id).toBeGreaterThanOrEqual(10);
      for (const row of rows)
        for (let i = 0; i < 4; i++)
          expect(Math.abs(row.model[i]! - row.source[i]!), `${d.id} ${row.id} component ${i}`).toBeLessThanOrEqual(row.tolerancePixels);
    }
  });

  it("carries valid running numbers", () => {
    for (const l of [...Object.values(CD110_LIVERIES), ...Object.values(CD130_LIVERIES)]) expect(valid(l.number), l.number).toBe(true);
    expect(CD110_LIVERIES.cd110.number).toBe("110 046-0");
    expect(CD130_LIVERIES.cd130.number).toBe("130 036-7");
    expect(CD130_LIVERIES.cd123No019.number).toBe("123 019-2");
    expect(CD140_NUMBER).toBe("140 040-7");
    expect(CD169_NUMBER).toBe("169 001-5");
  });

  it("gives the CD 123 liveries diamond pantographs and the 210 its AC breaker", () => {
    const arms = (id: string, params: ParamValues) => build(id, params).nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/rear-pantograph/arms/")).length;
    expect(arms("proc-vehicle-cd-130", { livery: "cd123" })).toBe(8); // four lower and four upper diamond arms
    expect(build("proc-vehicle-cd-130", { livery: "cd130" }).nodes.some((n) => n.id.startsWith("roof-equipment/pantographs/rear-pantograph/arms/lower-arms/"))).toBe(true); // the single-arm A-frame
    expect(build("proc-vehicle-cd-110", { livery: "cd210" }).nodes.some((n) => n.id.startsWith("roof-equipment/main-breaker"))).toBe(true);
    expect(build("proc-vehicle-cd-110", { livery: "cd110" }).nodes.some((n) => n.id.startsWith("roof-equipment/main-breaker"))).toBe(false);
  });
});
