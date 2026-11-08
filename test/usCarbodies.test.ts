// The North American streamlined carbodies (generator/usCarbodies.ts, carbodyKit.ts).
// See docs/models/us-carbodies.md.
import { describe, expect, it } from "vitest";
import { ACELA_LENGTH, F7_UNIT_LENGTH, SUPERLINER_LENGTH, US_CARBODIES, acela, acelaTrain, amtrakSuperliner, emdF7, f7Set } from "../generator/usCarbodies";
import { LOADING_GAUGES } from "../generator/loadingGauge";
import { roundedPane } from "../generator/sliceBody";
import { readTriangles } from "../generator/renderGlbThumb";
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
  "proc-vehicle-emd-f40ph": { length: ft(56, 2), axles: 4, liveries: ["phaseIII", "phaseII"] },
  "proc-vehicle-siemens-alc42": { length: 21.79, axles: 4, liveries: ["phaseVII", "midwest"] },
  "proc-vehicle-prr-gg1": { length: ft(79, 6), axles: 10, liveries: ["brunswick", "tuscan", "pennCentral"] },
};

describe("the US carbodies", () => {
  it("are seven designs on the US loading gauge with their references", () => {
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

  it("draws the P42DC's raked V face, its leaning upper band and each livery's fields", () => {
    const d = design("proc-vehicle-ge-p42dc");
    for (const livery of ["phaseV", "phaseIII", "via"]) {
      const nodes = leaves(d.build({ livery }).sourceTree("p42", d.title).root);
      const ids = nodes.map((n) => n.id);
      for (const scope of ["nose/right-half/windscreen/", "nose/number-board/", "body/left-side/cab-window/", "body/right-side/grilles/", "body/left-side/paint/", "rear-end/"])
        expect(ids.some((i) => i.startsWith(scope)), `${livery} ${scope}`).toBe(true);
      // the windscreen stands on the raked face: its foot ahead of its head by the rake
      const ws = nodes.filter((n) => n.id.startsWith("nose/right-half/windscreen/"));
      expect(Math.max(...ws.map((n) => n.max![0])) - Math.min(...ws.map((n) => n.min![0]))).toBeGreaterThan(0.25);
    }
  });

  it("gives the F7 and the Acela shaped windscreens and their own nose lamps", () => {
    const scopes = (id: string, params?: Record<string, string>) => leaves(design(id).build(params).sourceTree(id, design(id).title).root).map((n) => n.id);
    // the F7: rounded panes narrowing toward the roof, the headlight in its hood, number boards, class lights
    const pane = roundedPane([2.1, 2.4], 0.11, [1.18, 0.98], 0.14, 0.03, 0.16);
    expect(pane.z1(2.25)).toBeLessThan(1.18);
    expect(pane.z1(2.1)).toBeLessThan(pane.z1(2.2) - 0.05);
    expect(pane.z1(2.4)).toBeLessThan(pane.z1(2.3) - 0.05);
    expect(pane.z1(2.32)).toBeLessThan(pane.z1(2.18));
    const f7 = scopes("proc-vehicle-emd-f7");
    expect(f7.some((n) => n.startsWith("nose/headlights/hood/"))).toBe(true);
    expect(f7.filter((n) => n.startsWith("nose/class-lights/")).length).toBe(4);
    expect(f7.filter((n) => n.startsWith("nose/number-boards/")).length).toBe(6);
    // the Acela: the mask, the teardrop side windows and four headlights in the blue band
    const ac = scopes("proc-vehicle-amtrak-acela");
    expect(ac.filter((n) => n.startsWith("nose/windscreen/side-window")).length).toBe(4);
    expect(ac.filter((n) => n.startsWith("nose/headlight-band/")).length).toBeGreaterThan(0);
    expect(ac.filter((n) => n.startsWith("nose/headlights/")).length).toBe(8);
  });

  it("keeps the F7's windscreen low under the cab roof, the grilles above the portholes", () => {
    const nodes = leaves(emdF7().sourceTree("f7", "F7").root);
    const panes = nodes.filter((n) => n.id.startsWith("nose/windscreen/"));
    expect(panes.length).toBeGreaterThan(0);
    // wide, low panes under a thin brow: the glass about 0.5 m high where its outer corner follows the crown down (to 4.3 m), twice as wide
    const cab = panes.filter((n) => n.material === "cabGlass");
    expect(cab.length).toBeGreaterThan(0);
    const [y0, y1] = [Math.min(...cab.map((n) => n.min![1])), Math.max(...cab.map((n) => n.max![1]))];
    expect(y0).toBeGreaterThan(3.75);
    expect(y1).toBeLessThan(4.36);
    expect(y1 - y0).toBeLessThan(0.55);
    const zs = cab.filter((n) => n.min![2] > 0);
    expect(Math.max(...zs.map((n) => n.max![2])) - Math.min(...zs.map((n) => n.min![2]))).toBeGreaterThan(1.8 * (y1 - y0));
    const top = (re: RegExp, f: (n: LeafNode) => number) => nodes.filter((n) => re.test(n.id)).map(f);
    expect(Math.min(...top(/right-side\/grilles\//, (n) => n.min![1]))).toBeGreaterThan(Math.max(...top(/right-side\/portholes\//, (n) => n.max![1])));
  });

  it("paints the Santa Fe nose with its herald and whiskers, the other liveries without", () => {
    const ids = (livery: string) => leaves(emdF7({ livery }).sourceTree("f7", "F7").root).map((n) => n.id);
    for (const part of ["stripe", "herald", "whiskers"]) expect(ids("santaFe").some((n) => n.startsWith(`nose/herald/${part}/`)), part).toBe(true);
    expect(ids("unionPacific").some((n) => n.startsWith("nose/herald/"))).toBe(false);
  });

  it("lays the Santa Fe herald and stripe on the nose without the red showing through", () => {
    const tris = readTriangles(emdF7().toGlb("f7"));
    // the first surface a ray from the front meets at (z, y)
    const hit = (z: number, y: number): string => {
      let best = -Infinity, mat = "";
      for (const t of tris) {
        const [a, b, c] = t.p;
        const d1 = (b[2] - a[2]) * (c[1] - a[1]) - (c[2] - a[2]) * (b[1] - a[1]);
        if (Math.abs(d1) < 1e-12) continue;
        const u = ((z - a[2]) * (c[1] - a[1]) - (c[2] - a[2]) * (y - a[1])) / d1;
        const v = ((b[2] - a[2]) * (y - a[1]) - (z - a[2]) * (b[1] - a[1])) / d1;
        if (u < 0 || v < 0 || u + v > 1) continue;
        const x = a[0] + u * (b[0] - a[0]) + v * (c[0] - a[0]);
        if (x > best) [best, mat] = [x, t.material];
      }
      return mat;
    };
    // across the herald's field (the letters aside) and the stripe above it, the crease between the blunt tip and the rounded nose included
    for (let z = -0.9; z <= 0.9; z += 0.0125) for (const y of [1.98, 2.07, 2.16].filter((y) => Math.abs(y - 2.07) < 0.25 * Math.sqrt(1 - (z / 1.02) ** 2) - 0.02)) expect(["warYellow", "warBlack"], `herald ${z.toFixed(3)} ${y}`).toContain(hit(z, y));
    for (let z = -0.4; z <= 0.4; z += 0.025) for (const y of [1.72, 2.4, 2.6]) expect(["warYellow", "warBlack", "black", "lampHead"], `stripe ${z.toFixed(3)} ${y}`).toContain(hit(z, y));
  });

  it("forms the F7 sets A-B, A-B-A and A-B-B-A at their lengths, the rear A unit turned", () => {
    expect(f7Set(2).map((s) => s.unit)).toEqual(["aUnit", "bUnit"]);
    expect(f7Set(3).map((s) => [s.unit, s.turned])).toEqual([["aUnit", false], ["bUnit", false], ["aUnit", true]]);
    expect(f7Set(4).map((s) => s.unit)).toEqual(["aUnit", "bUnit", "bUnit", "aUnit"]);
    expect(F7_UNIT_LENGTH.bUnit).toBeCloseTo(ft(50), 2);
    for (const livery of ["santaFe", "unionPacific", "southernPacific"]) {
      const b = emdF7({ livery, unit: "bUnit" });
      const g = b.toGlb("b");
      const s = glbStats(g);
      expect(s.max[0] - s.min[0]).toBeCloseTo(ft(50), 1);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(LOADING_GAUGES.us.width);
      expect(findCoplanarOverlaps(g)).toEqual([]);
      expect(b.rig!.supports).toHaveLength(2);
    }
    for (const n of [2, 3, 4]) {
      const m = emdF7({ unit: "train", cars: String(n) });
      const g = m.toGlb("set");
      const s = glbStats(g);
      const want = f7Set(n).reduce((t, u) => t + F7_UNIT_LENGTH[u.unit], 0);
      expect(s.max[0] - s.min[0]).toBeCloseTo(want, 1);
      expect(m.rig!.sections).toHaveLength(n);
      expect(m.rig!.joints).toHaveLength(n - 1);
      expect(m.rig!.supports).toHaveLength(2 * n);
      if (n === 3) expect(findCoplanarOverlaps(g)).toEqual([]);
    }
    const f7 = design("proc-vehicle-emd-f7");
    for (const params of [{ unit: "bUnit" }, { unit: "train", cars: "4" }] as Array<Record<string, string>>) {
      const low = buildLodModel(f7, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      expect(low.triangleCount()).toBeLessThanOrEqual(lodBudget(f7));
    }
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
