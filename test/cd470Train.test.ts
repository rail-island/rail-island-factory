// The CD 470's full train (generator/emu470.ts `cd470Train`). See docs/models/czech-emus-classic.md.
import { describe, expect, it } from "vitest";
import { CD470_DEFAULT_CARS, CD470_LOD, CD470_MAX_CARS, CD470_MIN_CARS, cd470, cd470Train, EMU470_DESIGNS, length470 } from "../generator/emu470";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));
const nodes = (params: Record<string, string>) => leaves(cd470(params).sourceTree("d", "CD 470").root);
const SIZES = Array.from({ length: CD470_MAX_CARS - CD470_MIN_CARS + 1 }, (_, i) => i + CD470_MIN_CARS);
const design = EMU470_DESIGNS[0]!;

describe("the CD 470 full train", () => {
  it("offers 2 to 8 cars, four by default: a motor car at each end (the rear one turned), trailers between", () => {
    expect(SIZES).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(CD470_DEFAULT_CARS).toBe(4);
    for (const n of SIZES) {
      const slots = cd470Train(n);
      expect(slots.map((s) => s.car)).toEqual(["motorCar", ...Array(n - 2).fill("trailer"), "motorCar"]);
      expect(slots.map((s) => s.turned)).toEqual([...Array(n - 1).fill(false), true]);
      // front to back, touching at the coupling planes, centred on x = 0
      slots.slice(1).forEach((s, i) => expect(s.hi).toBeCloseTo(slots[i]!.lo, 9));
      expect(slots[0]!.hi + slots[n - 1]!.lo).toBeCloseTo(0, 9);
      slots.forEach((s) => expect(s.hi - s.lo).toBeCloseTo(length470(s.car), 9));
    }
    // the prototype's five-car set over its published 132 m
    expect(cd470Train(5)[0]!.hi - cd470Train(5)[4]!.lo).toBeCloseTo(132, 3);
    expect(() => cd470Train(1)).toThrow();
    expect(() => cd470Train(9)).toThrow();
  });

  for (const n of [2, 4, 8])
    it(`a ${n}-car train: one section a car hinged at its coupling plane, two bogies each, its length, in budget`, () => {
      const slots = cd470Train(n);
      const m = cd470({ unit: "train", cars: String(n) });
      const glb = m.toGlb("d");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + length470(slot.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n === 2) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("turns the rear motor car (its cab at -X) and leaves out the gangway frames inside the train, which the lone cars keep", () => {
    const n = nodes({ unit: "train", cars: "3" });
    const slots = cd470Train(3);
    const cab = (k: number) => n.filter((x) => x.id.startsWith(`section${k}/car-${k + 1}/cab/windscreen/`));
    expect(Math.max(...cab(0).map((x) => x.max![0]))).toBeGreaterThan(slots[0]!.hi - 1.5);
    expect(Math.min(...cab(2).map((x) => x.min![0]))).toBeLessThan(slots[2]!.lo + 1.5);
    expect(n.some((x) => /\/gangway\//.test(x.id))).toBe(false);
    expect(n.some((x) => x.id.startsWith("joint0/bellows"))).toBe(true);
    for (const unit of ["motorCar", "trailer"]) expect(nodes({ unit }).some((x) => /(^|\/)gangway\//.test(x.id)), unit).toBe(true);
  });

  it("builds the same bytes twice and a distant model of 100 triangles a car (500 at most) with its sections", () => {
    expect(Buffer.from(cd470({ unit: "train" }).toGlb("a")).equals(Buffer.from(cd470({ unit: "train" }).toGlb("a")))).toBe(true);
    expect(design.lodTriangles).toBe(CD470_LOD);
    for (const n of SIZES) {
      const low = buildLodModel(design, { unit: "train", cars: String(n) });
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(CD470_LOD, 100 * n));
      expect(low.rig!.sections).toHaveLength(n);
    }
  });

  it("states the game figures of every length: the cars' weights and the motor cars' power added up", () => {
    const v = (params: Record<string, string>) => design.game!.variants!.find((x) => JSON.stringify(x.params) === JSON.stringify(params));
    expect(v({ unit: "train" })).toMatchObject({ weight: 2 * 70 + 2 * 55, power: 2000 });
    for (const n of SIZES.filter((k) => k !== 4)) expect(v({ unit: "train", cars: String(n) }), String(n)).toMatchObject({ weight: 140 + 55 * (n - 2), power: 2000 });
  });
});
