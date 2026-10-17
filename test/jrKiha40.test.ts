// The JR KiHa 40 (generator/jrKiha40.ts). See docs/models/jr-kiha40.md.
import { describe, expect, it } from "vitest";
import { KIHA40_BOGIES, KIHA40_BODY, KIHA40_DESIGNS, KIHA40_OVER_COUPLERS, KIHA40_PARAMS, KIHA40_WHEELBASE, kiha40 } from "../generator/jrKiha40";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const LIVERIES = KIHA40_PARAMS[0]!.values.map((v) => v.value);

describe("the JR KiHa 40", () => {
  it("is one diesel railcar design with a livery parameter and its reference folder", () => {
    const [d] = KIHA40_DESIGNS;
    expect(KIHA40_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-jr-kiha40");
    expect(d!.references).toBe("jr-kiha40");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "diesel" });
    expect(KIHA40_PARAMS.map((p) => [p.name, p.default])).toEqual([["livery", "hokkaido"]]);
    expect(LIVERIES).toEqual(["hokkaido", "tarako", "jnr"]);
  });

  for (const livery of LIVERIES)
    it(`${livery}: stays in budget and in the envelope, at its real size, without coplanar faces`, () => {
      const m = kiha40({ livery });
      const glb = m.toGlb("kiha40");
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.min[1]).toBeCloseTo(0, 2);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[0] - s.min[0]).toBeCloseTo(KIHA40_OVER_COUPLERS, 1);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("rides on two bogies 14.3 m apart, each with two wheelsets", () => {
    const m = kiha40();
    const rig = m.rig!;
    expect(rig.supports).toHaveLength(2);
    const nodes = leaves(m.sourceTree("kiha40", "KiHa 40").root);
    const axles = nodes
      .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
      .map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100)
      .sort((a, b) => a - b);
    const want = KIHA40_BOGIES.flatMap((x) => [x - KIHA40_WHEELBASE / 2, x + KIHA40_WHEELBASE / 2].map((a) => Math.round((a - KIHA40_BODY / 2) * 100) / 100));
    expect(axles).toEqual(want);
  });

  it("has two doors a side, headlights at each end and a smoke emitter on the exhaust", () => {
    const nodes = leaves(kiha40().sourceTree("kiha40", "KiHa 40").root);
    for (const side of ["right-side", "left-side"]) {
      const doors = new Set(nodes.filter((n) => n.id.startsWith(`body/${side}/doors/door-`)).map((n) => n.id.split("/")[3]));
      expect(doors.size).toBe(2);
    }
    for (const end of ["front-end", "rear-end"]) expect(nodes.some((n) => n.id.startsWith(`${end}/headlights/`))).toBe(true);
    expect(kiha40().emitters().some((e) => e.kind === "smoke")).toBe(true);
  });

  it("builds the same bytes twice and keeps a valid distant model", () => {
    expect(Buffer.from(kiha40({ livery: "tarako" }).toGlb("a")).equals(Buffer.from(kiha40({ livery: "tarako" }).toGlb("a")))).toBe(true);
    const low = buildLodModel(KIHA40_DESIGNS[0]!);
    expect(low.triangleCount()).toBeGreaterThan(0);
    expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(KIHA40_DESIGNS[0]!));
  });
});
