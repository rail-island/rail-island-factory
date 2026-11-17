// The CD 471 CityElefant's full train (generator/emu471.ts `cd471Train`). See docs/models/czech-emus.md.
import { describe, expect, it } from "vitest";
import { CD471_DEFAULT_CARS, CD471_LOD, CD471_MAX_CARS, CD471_MIN_CARS, cd471, cd471Train, elefantLength, EMU471_DESIGNS } from "../generator/emu471";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));
const nodes = (params: Record<string, string>) => leaves(cd471(params).sourceTree("d", "CD 471").root);
const SIZES = Array.from({ length: CD471_MAX_CARS - CD471_MIN_CARS + 1 }, (_, i) => i + CD471_MIN_CARS);
const VARIANTS = ["cd471", "cd675", "cdBlue"];
const design = EMU471_DESIGNS[0]!;

describe("the CD 471 full train", () => {
  it("offers 2 to 8 cars, the three-car set by default: the motor car ahead, trailers, the driving trailer turned at the rear", () => {
    expect(SIZES).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(CD471_DEFAULT_CARS).toBe(3);
    expect(cd471Train(2).map((s) => s.car)).toEqual(["motorCar", "drivingTrailer"]);
    expect(cd471Train(3).map((s) => s.car)).toEqual(["motorCar", "trailer", "drivingTrailer"]);
    for (const n of SIZES) {
      const slots = cd471Train(n);
      expect(slots.map((s) => s.car)).toEqual(["motorCar", ...Array(n - 2).fill("trailer"), "drivingTrailer"]);
      expect(slots.map((s) => s.turned)).toEqual([...Array(n - 1).fill(false), true]);
      slots.slice(1).forEach((s, i) => expect(s.hi).toBeCloseTo(slots[i]!.lo, 9));
      expect(slots[0]!.hi + slots[n - 1]!.lo).toBeCloseTo(0, 9);
      slots.forEach((s) => expect(s.hi - s.lo).toBeCloseTo(elefantLength(s.car), 9));
    }
    // 26.05 m cab cars and a 25.7 m trailer: the three-car set 77.8 m over its couplers
    expect(cd471Train(3)[0]!.hi - cd471Train(3)[2]!.lo).toBeCloseTo(77.8, 3);
    expect(() => cd471Train(1)).toThrow();
    expect(() => cd471Train(9)).toThrow();
  });

  for (const [n, variant] of [[2, "cd471"], [3, "cdBlue"], [8, "cd675"]] as const)
    it(`a ${n}-car train (${variant}): one section a car hinged at its coupling plane, two bogies each, its length, in budget`, () => {
      const slots = cd471Train(n);
      const m = cd471({ unit: "train", cars: String(n), variant });
      const glb = m.toGlb("d");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + elefantLength(slot.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n <= 3) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("turns the driving trailer (its cab at -X), one pantograph on the motor car, no gangway frames inside the train while the lone cars keep theirs", () => {
    const n = nodes({ unit: "train" });
    const slots = cd471Train(3);
    const cab = (k: number) => n.filter((x) => x.id.startsWith(`section${k}/car-${k + 1}/cab/windscreen`));
    expect(Math.max(...cab(0).map((x) => x.max![0]))).toBeGreaterThan(slots[0]!.hi - 1.5);
    expect(Math.min(...cab(2).map((x) => x.min![0]))).toBeLessThan(slots[2]!.lo + 1.5);
    expect(n.filter((x) => x.id.includes("/pantographs/")).every((x) => x.id.startsWith("section0/"))).toBe(true);
    expect(n.some((x) => /\/gangway\//.test(x.id))).toBe(false);
    expect(n.some((x) => x.id.startsWith("joint1/bellows"))).toBe(true);
    for (const unit of ["motorCar", "trailer", "drivingTrailer"]) expect(nodes({ unit }).some((x) => /(^|\/)gangway\//.test(x.id)), unit).toBe(true);
  });

  it("builds the same bytes twice and a distant model of 100 triangles a car (500 at most) with its sections", () => {
    expect(Buffer.from(cd471({ unit: "train" }).toGlb("a")).equals(Buffer.from(cd471({ unit: "train" }).toGlb("a")))).toBe(true);
    expect(design.lodTriangles).toBe(CD471_LOD);
    for (const n of SIZES) {
      const low = buildLodModel(design, { unit: "train", cars: String(n) });
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(CD471_LOD, 100 * n));
      expect(low.rig!.sections).toHaveLength(n);
    }
  });

  it("states the game figures of every length in every variant: the cars' weights and the motor car's power added up", () => {
    const v = (params: Record<string, string>) => design.game!.variants!.find((x) => JSON.stringify(x.params) === JSON.stringify(params));
    expect(v({ unit: "train" })).toMatchObject({ weight: 170, power: 1000 });
    for (const variant of VARIANTS)
      for (const n of SIZES) {
        const params = { unit: "train", ...(n === 3 ? {} : { cars: String(n) }), ...(variant === "cd471" ? {} : { variant }) };
        expect(v(params), JSON.stringify(params)).toMatchObject({ weight: 120 + 50 * (n - 2), power: 1000, ...(variant === "cd675" ? { maxspeed: 160 } : {}) });
      }
  });
});
