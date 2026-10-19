// The TGV Duplex (generator/tgvDuplex.ts). See docs/models/tgv-duplex.md.
import { describe, expect, it } from "vitest";
import {
  DUPLEX_DESIGNS, DUPLEX_LENGTH, DUPLEX_LOD, DUPLEX_MAX_CARS, DUPLEX_MIN_CARS, DUPLEX_PANTOGRAPHS, DUPLEX_PARAMS, DUPLEX_POWER_BOGIES,
  duplexTrain, tgvDuplex, type DuplexCar,
} from "../generator/tgvDuplex";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const CARS: DuplexCar[] = ["powerCar", "endTrailer", "trailer", "bar"];
const LIVERIES = ["carmillon", "original", "inoui", "ouigo"];
const SIZES = Array.from({ length: DUPLEX_MAX_CARS - DUPLEX_MIN_CARS + 1 }, (_, i) => i + DUPLEX_MIN_CARS);
const nodes = (params: Record<string, string>) => leaves(tgvDuplex(params).sourceTree("d", "Duplex").root);

describe("the TGV Duplex", () => {
  it("is one electric unit design: the power car (default), three trailers and the full train, four liveries", () => {
    const [d] = DUPLEX_DESIGNS;
    expect(DUPLEX_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-tgv-duplex");
    expect(d!.references).toBe("tgv-duplex");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "electric" });
    expect(DUPLEX_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "powerCar"], ["cars", "10"], ["livery", "carmillon"]]);
    expect(DUPLEX_PARAMS[0]!.values.map((v) => v.value)).toEqual([...CARS, "train"]);
    expect(DUPLEX_PARAMS[1]!.values.map((v) => v.value)).toEqual(SIZES.map(String));
    expect(DUPLEX_PARAMS[2]!.values.map((v) => v.value)).toEqual(LIVERIES);
    expect(d!.game).toMatchObject({ weight: 68, power: 4400, maxspeed: 320 });
    // the ten-car train: 380 t, 8,800 kW
    expect(d!.game!.variants!.find((v) => JSON.stringify(v.params) === JSON.stringify({ unit: "train" }))).toMatchObject({ weight: 380, power: 8800 });
  });

  it("makes the published 200.19 m ten-car train", () => {
    const slots = duplexTrain(10);
    expect(slots.map((s) => s.car)).toEqual(["powerCar", "endTrailer", "trailer", "trailer", "bar", "trailer", "trailer", "trailer", "endTrailer", "powerCar"]);
    expect(slots[0]!.hi - slots[9]!.lo).toBeCloseTo(200.19, 2);
    expect(slots.map((s) => s.turned)).toEqual([...Array(8).fill(false), true, true]);
  });

  for (const livery of LIVERIES)
    for (const car of CARS)
      it(`${car} (${livery}): stays in budget and in the envelope, at its length, without coplanar faces`, () => {
        const glb = tgvDuplex({ unit: car, livery }).toGlb("d");
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[1]).toBeLessThanOrEqual(car === "powerCar" ? 6.5 : 4.7);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
        expect(s.max[0] - s.min[0]).toBeCloseTo(DUPLEX_LENGTH[car], 2);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      });

  it("raises the rear of the power car's two pantographs and folds the front one; its fixed equipment stays under 4.7 m", () => {
    const n = nodes({ unit: "powerCar" });
    const raised = n.filter((x) => x.id.startsWith("roof-equipment/pantographs/pantograph-raised/"));
    const folded = n.filter((x) => x.id.startsWith("roof-equipment/pantographs/pantograph-folded/"));
    expect(raised.length).toBeGreaterThan(0);
    expect(folded.length).toBeGreaterThan(0);
    expect(Math.max(...raised.map((x) => x.max![1]))).toBeGreaterThan(5.0);
    expect(Math.max(...folded.map((x) => x.max![1]))).toBeLessThan(4.7);
    const x = (d: number) => DUPLEX_LENGTH.powerCar / 2 - d;
    expect(Math.min(...raised.filter((p) => p.id.includes("/head/")).map((p) => p.min![0]))).toBeLessThan(x(DUPLEX_PANTOGRAPHS[0]));
    expect(Math.max(...n.filter((p) => !p.id.startsWith("roof-equipment/pantographs/")).map((p) => p.max![1]))).toBeLessThanOrEqual(4.7);
    for (const scope of ["nose/windscreen", "nose/right-lamps", "body/right-side/cab-door"]) expect(n.some((p) => p.id.startsWith(scope)), scope).toBe(true);
  });

  it("stands the power car on its two bogies 14 m apart and every lone trailer on two of its own", () => {
    expect(DUPLEX_POWER_BOGIES[1] - DUPLEX_POWER_BOGIES[0]).toBeCloseTo(14.0, 6);
    for (const car of CARS) expect(tgvDuplex({ unit: car }).rig!.supports).toHaveLength(2);
  });

  it("gives the trailers two decks of windows; the bar car fewer, wider ones", () => {
    const count = (car: DuplexCar, deck: string) => new Set(nodes({ unit: car }).filter((n) => n.id.startsWith(`body/right-side/${deck}-deck-windows/`)).map((n) => n.id.split("/")[3])).size;
    expect([count("trailer", "lower"), count("trailer", "upper")]).toEqual([6, 9]);
    expect([count("endTrailer", "lower"), count("endTrailer", "upper")]).toEqual([6, 10]);
    expect([count("bar", "lower"), count("bar", "upper")]).toEqual([2, 4]);
  });

  for (const n of [4, 6, 10])
    it(`a ${n}-car train: the power cars on their own bogies, the trailers articulated on Jacobs bogies`, () => {
      const slots = duplexTrain(n);
      const m = tgvDuplex({ unit: "train", cars: String(n) });
      const glb = m.toGlb("d");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + DUPLEX_LENGTH[slot.car], 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      // two bogies a power car, one own bogie an end trailer, one Jacobs bogie under each joint between two trailers
      const t = n - 2;
      expect(rig.supports).toHaveLength(4 + 2 + (t - 1));
      const shared = rig.supports!.filter((sp) => sp.sections.length === 2);
      expect(shared).toHaveLength(t - 1);
      for (const sp of shared) expect(sp.sections[1]! - sp.sections[0]!).toBe(1);
      if (n <= 4) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("builds the same bytes twice and keeps a distant model for every car and train", () => {
    expect(Buffer.from(tgvDuplex({ unit: "train", cars: "4" }).toGlb("a")).equals(Buffer.from(tgvDuplex({ unit: "train", cars: "4" }).toGlb("a")))).toBe(true);
    const d = DUPLEX_DESIGNS[0]!;
    for (const params of [...CARS.map((unit) => ({ unit })), ...SIZES.map((n) => ({ unit: "train", cars: String(n) }))]) {
      const low = buildLodModel(d, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(params.unit === "train" ? Math.min(DUPLEX_LOD, 100 * Number(params.cars)) : 100);
      if (params.unit === "train") expect(low.rig!.sections).toHaveLength(Number(params.cars));
    }
  });
});
