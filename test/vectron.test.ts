import { describe, it, expect } from "vitest";
import { VECTRON_DESIGNS, VECTRON_LIVERIES, VECTRON_PARAMS, vectron, vectronLod } from "../generator/vectron.ts";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";
import { RAIL_COLLECTOR_TOP } from "../generator/collector.ts";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
/** The CSD / DB scheme `ABC DEF-G`: from the right, weights 2, 1, 2, ...; digit sums; to the next ten. */
const valid = (number: string): boolean => {
  const digits = [...number.replace(/\D/g, "")].map(Number);
  const sum = digits.slice(0, 6).reverse().reduce((a, d, i) => a + (i % 2 === 0 ? ((2 * d) % 10) + Math.floor((2 * d) / 10) : d), 0);
  return /^\d{3} \d{3}-\d$/.test(number) && (10 - (sum % 10)) % 10 === digits[6];
};

const LIVERIES = Object.keys(VECTRON_LIVERIES);

describe("Siemens Vectron", () => {
  it("is one design with the Czech operators' liveries, CD Eurocity first", () => {
    expect(VECTRON_DESIGNS.map((d) => d.id)).toEqual(["proc-vehicle-vectron"]);
    expect(VECTRON_PARAMS[0]!.default).toBe("cdEurocity");
    expect(LIVERIES).toEqual(["cdEurocity", "regiojet", "cdWhite"]);
    expect(VECTRON_DESIGNS[0]!.catalog).toMatchObject({ category: "Rail vehicles", group: "loco", traction: "electric" });
    expect(VECTRON_DESIGNS[0]!.game).toMatchObject({ weight: 89, power: 6400, maxspeed: 200 });
  });

  it("carries the photographed units' valid running numbers", () => {
    const numbers = Object.values(VECTRON_LIVERIES).map((l) => l.number);
    expect(numbers).toEqual(["193 298-7", "193 205-2", "193 574-1"]);
    for (const n of numbers) expect(valid(n), n).toBe(true);
  });

  for (const livery of LIVERIES)
    it(`${livery}: length, running gear, envelope, budget and pantographs`, () => {
      const mesh = vectron({ livery });
      expect(mesh.triangleCount()).toBeLessThanOrEqual(16000);
      const { json, bin } = parseGlb(mesh.toGlb("t"));
      const tris = collectTriangles(json, bin);
      const nodes = leaves(mesh.sourceTree("proc-vehicle-vectron", "Siemens Vectron").root);
      const xs = tris.flatMap((t) => t.p.map((p) => p[0]));
      expect(Math.max(...xs)).toBeCloseTo(18.98 / 2, 5);
      expect(Math.min(...xs)).toBeCloseTo(-18.98 / 2, 5);
      expect(Math.min(...tris.flatMap((t) => t.p.map((p) => p[1])))).toBeCloseTo(0, 5);
      const z = tris.flatMap((t) => t.p.map((p) => p[2]));
      expect(Math.max(...z) - Math.min(...z)).toBeLessThanOrEqual(3.1);
      expect(Math.max(...z) + Math.min(...z)).toBeCloseTo(0, 5);
      // the body and its fixed roof equipment within 4.25 m (the published height, collectors down)
      const fixed = nodes.filter((n) => !n.id.startsWith("roof-equipment/pantographs/"));
      expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.26);
      expect(Math.max(...nodes.map((n) => n.max![1]))).toBeLessThanOrEqual(6.5);
      // the wheel treads: 1.25 m wheels on the rail, 1.435 m gauge, pivots 9.5 m and wheelbase 3.0 m apart
      const treads = nodes.filter((n) => n.id.startsWith("bogies/") && n.material === "steel" && Math.abs(n.max![1] - n.min![1] - 1.25 * Math.cos(Math.PI / 20)) < 0.002);
      expect(treads).toHaveLength(8);
      const axles = [...new Set(treads.map((n) => ((n.min![0] + n.max![0]) / 2).toFixed(3)))].map(Number).sort((a, b) => a - b);
      expect(axles).toEqual([-6.25, -3.25, 3.25, 6.25]);
      for (const n of treads) {
        expect(n.min![1]).toBeCloseTo(0, 5);
        expect(Math.min(Math.abs(n.min![2]), Math.abs(n.max![2]))).toBeCloseTo(0.665, 4);
      }
      // two single-arm collectors: the rear (-X) raised to the contact wire, the front folded, level strips
      const heads = (name: string) => nodes.filter((n) => n.id.startsWith(`roof-equipment/pantographs/${name}/head/`) && n.material === "carbon");
      const rear = heads("rear-pantograph"), front = heads("front-pantograph");
      expect(rear).toHaveLength(2);
      expect(front).toHaveLength(2);
      for (const h of [...rear, ...front]) expect(h.max![1] - h.min![1]).toBeCloseTo(0.05, 5);
      expect(Math.max(...rear.map((n) => n.max![1]))).toBeCloseTo(RAIL_COLLECTOR_TOP, 3);
      expect(Math.max(...front.map((n) => n.max![1]))).toBeLessThan(4.9);
      for (const n of rear) expect(n.max![0]).toBeLessThan(0);
      for (const n of front) expect(n.min![0]).toBeGreaterThan(0);
    });

  it("paints each livery's own marks: the CD emblems, the lamp grille, the cab colours", () => {
    const ids = (livery: string) => leaves(vectron({ livery }).sourceTree("v", "v").root);
    const ec = ids("cdEurocity"), rj = ids("regiojet"), white = ids("cdWhite");
    expect(ec.filter((n) => n.id.startsWith("emblems/front/") || n.id.startsWith("emblems/rear/")).length).toBeGreaterThan(0);
    // the Eurocity's side emblem in navy on the white behind the reader's left cab door, "Ceske drahy" after it
    for (const sd of ["right", "left"]) {
      const em = ec.filter((n) => n.id.startsWith(`emblems/${sd}/`));
      expect(em.length, sd).toBeGreaterThan(0);
      expect(new Set(em.map((n) => n.material)), sd).toEqual(new Set(["navy"]));
      expect(ec.some((n) => n.id.startsWith(`wordmark/${sd}/`) && n.material === "navy"), sd).toBe(true);
    }
    expect(white.some((n) => n.id.startsWith("emblems/right/"))).toBe(true);
    expect(white.some((n) => n.id.startsWith("emblems/front/"))).toBe(false);
    expect(rj.some((n) => n.id.startsWith("emblems/"))).toBe(false);
    // ten stripes a nose, white on the navy, black on the yellow
    const stripes = (ns: LeafNode[]) => ns.filter((n) => n.id.startsWith("front-cab/grille-stripe-"));
    expect(new Set(stripes(ec).map((n) => n.id.split("/")[1])).size).toBe(10);
    expect(new Set(stripes(ec).map((n) => n.material))).toEqual(new Set(["white"]));
    expect(new Set(stripes(rj).map((n) => n.material))).toEqual(new Set(["black"]));
    // the Eurocity's navy cab sections and the RegioJet's white cab caps, both ends, both sides
    for (const [ns, name] of [[ec, "cab"], [ec, "cab-foot"], [ec, "cab-cant"], [rj, "cab-cap"]] as const)
      for (const sd of ["right-side", "left-side"])
        for (const end of ["front", "rear"]) expect(ns.some((n) => n.id.startsWith(`sides/${sd}/${name}-${end}/`)), `${name} ${sd} ${end}`).toBe(true);
  });

  it("paints the Eurocity light blue along the lower half and white above, without the old wave", () => {
    const ec = leaves(vectron({ livery: "cdEurocity" }).sourceTree("v", "v").root);
    expect(ec.some((n) => n.id.includes("/wave"))).toBe(false);
    // each side: light blue from the frame to 2.6 m, white from there to the roof
    for (const sd of ["side-left", "side-right"]) {
      const bands = ec.filter((n) => n.id.startsWith(`body/shell/${sd}/band-`)).map((n) => [n.material, n.min![1], n.max![1]]);
      expect(bands, sd).toEqual([["frame", 1.3, 1.42], ["skyBlue", 1.42, 2.6], ["white", 2.6, 4]]);
    }
  });

  it("stays within the distant model's budget in every livery", () => {
    for (const livery of LIVERIES) expect(vectronLod({ livery }).triangleCount(), livery).toBeLessThanOrEqual(100);
  });
});
