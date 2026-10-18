// The DR VT 18.16 "Delfin" (generator/drVt1816.ts). See docs/models/dr-vt1816.md.
import { describe, expect, it } from "vitest";
import { VT1816_AXLES, VT1816_DESIGNS, VT1816_LENGTH, VT1816_PARAMS, VT1816_POWER_BODY, VT1816_TRAILER_BODY, vt1816, type Vt1816Unit } from "../generator/drVt1816";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const UNITS = VT1816_PARAMS[0]!.values.map((v) => v.value) as Vt1816Unit[];

describe("the DR VT 18.16", () => {
  it("is one diesel unit design with a power car and a trailer, and its reference folder", () => {
    const [d] = VT1816_DESIGNS;
    expect(VT1816_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-dr-vt1816");
    expect(d!.references).toBe("dr-vt1816");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "diesel" });
    expect(VT1816_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "powerCar"]]);
    expect(UNITS).toEqual(["powerCar", "trailer"]);
    for (const v of VT1816_PARAMS[0]!.values) expect(v.title.length).toBeLessThanOrEqual(16);
  });

  it("makes the published 98.06 m four-car set: two power cars and two trailers", () => {
    expect(2 * VT1816_LENGTH.powerCar + 2 * VT1816_LENGTH.trailer).toBeCloseTo(98.06, 2);
  });

  for (const unit of UNITS)
    it(`${unit}: stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
      const glb = vt1816({ unit }).toGlb("vt1816");
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.min[1]).toBeCloseTo(0, 2);
      expect(s.max[1]).toBeLessThanOrEqual(4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.min[0]).toBeCloseTo(-VT1816_LENGTH[unit] / 2, 2);
      expect(s.max[0]).toBeCloseTo(VT1816_LENGTH[unit] / 2, 2);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  for (const unit of UNITS)
    it(`${unit}: rides on two bogies with the drawing's axles`, () => {
      const m = vt1816({ unit });
      expect(m.rig!.supports).toHaveLength(2);
      const body = unit === "powerCar" ? VT1816_POWER_BODY : VT1816_TRAILER_BODY;
      const axles = leaves(m.sourceTree("vt1816", "VT 18.16").root)
        .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
        .map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100)
        .sort((a, b) => a - b);
      const want = VT1816_AXLES[unit].map((d) => body / 2 - d).sort((a, b) => a - b);
      expect(axles).toHaveLength(4);
      axles.forEach((x, i) => expect(x).toBeCloseTo(want[i]!, 1));
    });

  it("gives the power car its nose, raised cockpit, portholes and the motor bogie's 4.0 m wheelbase", () => {
    const nodes = leaves(vt1816().sourceTree("vt1816", "VT 18.16").root);
    for (const scope of ["nose/headlights", "nose/emblem", "nose/running-number", "cockpit/windscreen", "cockpit/shell"]) expect(nodes.some((n) => n.id.startsWith(scope)), scope).toBe(true);
    for (const s of ["right-side", "left-side"]) expect(new Set(nodes.filter((n) => n.id.startsWith(`body/${s}/portholes/`)).map((n) => n.id.split("/")[3])).size).toBe(4);
    const [a1, a2] = VT1816_AXLES.powerCar;
    expect(a2! - a1!).toBeCloseTo(4.0, 6);
    // the cockpit's roof stands above the car's 4.20 m roof, the fixed body inside the envelope
    const top = Math.max(...nodes.filter((n) => n.id.startsWith("cockpit/shell")).map((n) => n.max![1]));
    expect(top).toBeCloseTo(4.25, 2);
  });

  it("gives the trailer doors at both ends of each side and ten windows", () => {
    const nodes = leaves(vt1816({ unit: "trailer" }).sourceTree("vt1816", "VT 18.16").root);
    for (const s of ["right-side", "left-side"]) {
      expect(new Set(nodes.filter((n) => n.id.startsWith(`body/${s}/doors/`)).map((n) => n.id.split("/")[3])).size).toBe(2);
      expect(new Set(nodes.filter((n) => n.id.startsWith(`body/${s}/windows/`)).map((n) => n.id.split("/")[3])).size).toBe(10);
    }
  });

  it("builds the same bytes twice and keeps a valid distant model for both cars", () => {
    expect(Buffer.from(vt1816({ unit: "trailer" }).toGlb("a")).equals(Buffer.from(vt1816({ unit: "trailer" }).toGlb("a")))).toBe(true);
    for (const unit of UNITS) {
      const low = buildLodModel(VT1816_DESIGNS[0]!, { unit });
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(VT1816_DESIGNS[0]!));
    }
  });
});
