// The North American streamlined carbodies (generator/usCarbodies.ts, carbodyKit.ts).
// See docs/models/us-carbodies.md.
import { describe, expect, it } from "vitest";
import { ACELA_LENGTH, SUPERLINER_LENGTH, US_CARBODIES, acela, acelaTrain, amtrakSuperliner } from "../generator/usCarbodies";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { lodBudget } from "../generator/lod";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const ft = (feet: number, inches = 0) => feet * 0.3048 + inches * 0.0254;
const design = (id: string) => US_CARBODIES.find((d) => d.id === id)!;

/** Published length over the couplers and the number of axles. */
const LOCOS: Record<string, { length: number; axles: number; liveries: string[] }> = {
  "proc-vehicle-emd-f7": { length: ft(50, 8), axles: 4, liveries: ["santaFe", "unionPacific", "southernPacific"] },
  "proc-vehicle-ge-p42dc": { length: ft(69), axles: 4, liveries: ["phaseV", "phaseIII", "via"] },
  "proc-vehicle-siemens-alc42": { length: 21.79, axles: 4, liveries: ["phaseVII", "midwest"] },
  "proc-vehicle-prr-gg1": { length: ft(79, 6), axles: 10, liveries: ["brunswick", "tuscan", "pennCentral"] },
};

describe("the US carbodies", () => {
  it("are five designs on the US loading gauge with their references", () => {
    expect(US_CARBODIES.map((d) => d.id)).toEqual([...Object.keys(LOCOS), "proc-vehicle-amtrak-superliner", "proc-vehicle-amtrak-acela"]);
    for (const d of US_CARBODIES) {
      expect(d.loadingGauge).toBe("us");
      expect(d.references).toBe(d.id.replace("proc-vehicle-", "").replace("amtrak-", "amtrak-"));
      for (const p of d.params ?? []) for (const v of p.values) expect(v.title.length, `${d.id} ${v.value}`).toBeLessThanOrEqual(16);
    }
    expect(design("proc-vehicle-prr-gg1").catalog).toMatchObject({ traction: "electric", group: "loco" });
    expect(design("proc-vehicle-emd-f7").catalog).toMatchObject({ traction: "diesel", group: "loco" });
  });

  for (const [id, f] of Object.entries(LOCOS)) {
    const d = design(id);
    it(`${id}: every livery at its published length, inside the gauge and the budget, without z-fighting`, () => {
      expect(d.params![0]!.values.map((v) => v.value)).toEqual(f.liveries);
      for (const livery of f.liveries) {
        const m = d.build({ livery });
        const glb = m.toGlb(id);
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[0] - s.min[0]).toBeCloseTo(f.length, 1);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.us.width);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const nodes = leaves(m.sourceTree(id, d.title).root);
        expect(nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))).toHaveLength(f.axles);
        // the body and its fixed fittings under the gauge's height (a raised pantograph aside)
        const fixed = nodes.filter((n) => !n.id.includes("pantograph"));
        expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(LOADING_GAUGES.us.height);
      }
      expect(d.build().rig!.supports!.length).toBe(id === "proc-vehicle-prr-gg1" ? 4 : 2);
    });
  }

  it("draws the GG1 with two diamond pantographs, the rear one raised", () => {
    const m = design("proc-vehicle-prr-gg1").build();
    const nodes = leaves(m.sourceTree("gg1", "GG1").root);
    // the folded front one stays low on the roof; the raised rear one reaches the game's wire
    const front = nodes.filter((n) => n.id.startsWith("roof/front-pantograph/"));
    expect(front.length).toBeGreaterThan(0);
    expect(Math.max(...front.map((n) => n.max![1]))).toBeLessThan(5.0);
    expect(glbStats(m.toGlb("gg1")).max[1]).toBeGreaterThan(5.8);
  });

  it("forms the Acela with a power car at each end and first class behind the leading one", () => {
    expect(acelaTrain(4).map((s) => s.car)).toEqual(["powerCar", "firstClass", "businessClass", "powerCar"]);
    expect(acelaTrain(8).map((s) => s.car)).toEqual(["powerCar", "firstClass", "businessClass", "businessClass", "cafe", "businessClass", "businessClass", "powerCar"]);
    for (const n of [3, 4, 8]) {
      const s = glbStats(acela({ unit: "train", cars: String(n) }).toGlb("t"));
      const want = 2 * ACELA_LENGTH.powerCar + (n - 2) * ACELA_LENGTH.coach;
      expect(s.max[0] - s.min[0]).toBeCloseTo(want, 1);
      expect(acela({ unit: "train", cars: String(n) }).rig!.sections).toHaveLength(n);
    }
  });

  it("builds every Acela car on its own two trucks, in budget, without z-fighting", () => {
    for (const unit of ["powerCar", "businessClass", "firstClass", "cafe"]) {
      const m = acela({ unit });
      const glb = m.toGlb(unit);
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.max[0] - s.min[0]).toBeCloseTo(unit === "powerCar" ? ACELA_LENGTH.powerCar : ACELA_LENGTH.coach, 1);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      expect(m.rig!.supports).toHaveLength(2);
    }
  });

  it("builds the Superliner coach and sleeper at 85 ft and 16 ft 2 in, on two trucks, with a door each side", () => {
    for (const unit of ["coach", "sleeper"]) {
      const m = amtrakSuperliner({ unit });
      const glb = m.toGlb(unit);
      const s = glbStats(glb);
      expect(s.max[0] - s.min[0]).toBeCloseTo(SUPERLINER_LENGTH, 1);
      expect(s.max[1]).toBeCloseTo(ft(16, 2), 1);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.us.width);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
      expect(m.rig!.supports).toHaveLength(2);
      expect(new Set(m.animations().filter((c) => c.drive.drive === "door").map((c) => (c.drive as { side: string }).side))).toEqual(new Set(["left", "right"]));
    }
  });

  it("builds the same bytes twice and keeps valid distant models", () => {
    for (const d of US_CARBODIES) {
      expect(Buffer.from(d.build().toGlb("a")).equals(Buffer.from(d.build().toGlb("a")))).toBe(true);
      const low = buildLodModel(d);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
    }
  });
});
