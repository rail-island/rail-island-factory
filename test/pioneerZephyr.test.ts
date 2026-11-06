// The Pioneer Zephyr's own geometry (generator/pioneerZephyr.ts): the nose
// where the 1934 drawing puts it, the hull closing on the body behind it, the
// observation car's tail, the cars' lengths and deterministic bytes. The gauge,
// budget, coplanar and support checks are in test/usTransit.test.ts.
// See docs/models/pioneer-zephyr.md.
import { describe, expect, it } from "vitest";
import { PIONEER_ZEPHYR, ZEPHYR_LENGTH, ZEPHYR_MOTOR_TRUCK, pioneerZephyr, zephyrTrain } from "../generator/pioneerZephyr";
import { readTriangles } from "../generator/renderGlbThumb";
import { glbStats } from "../generator/glbStats";
import type { Tri } from "../generator/glbTriangles";
import { carbody, type CarbodySpec } from "../generator/carbodyKit";

const power = pioneerZephyr({ unit: "powerCar" });
const tris = readTriangles(power.toGlb("z"));
const TIP = ZEPHYR_LENGTH.powerCar / 2;
const of = (mat: string): Tri[] => tris.filter((t) => t.material === mat);
const xs = (ts: Tri[]) => ts.flatMap((t) => t.p.map((p) => p[0]));
const ys = (ts: Tri[]) => ts.flatMap((t) => t.p.map((p) => p[1]));

describe("the Pioneer Zephyr", () => {
  it("is the 1934 train: 22.6 + 17.6 + 19.8 m on the drawing's truck centres", () => {
    expect(zephyrTrain().reduce((t, c) => t + ZEPHYR_LENGTH[c.car], 0)).toBeCloseTo(60.0, 2);
    expect(ZEPHYR_MOTOR_TRUCK).toBeCloseTo(4.115, 3);
    expect(PIONEER_ZEPHYR.game!.weight).toBe(42);
    expect(PIONEER_ZEPHYR.game!.variants?.find((v) => v.params.unit === "train")?.weight).toBe(94);
  });

  it("raises the cowl over the engine room above the 12 ft 1 in roof", () => {
    const s = glbStats(power.toGlb("z"));
    expect(s.max[1]).toBeCloseTo(3.9, 2);
    expect(s.max[2] - s.min[2]).toBeCloseTo(2.82, 1);
    expect(glbStats(pioneerZephyr({ unit: "coach" }).toGlb("z")).max[1]).toBeCloseTo(3.69, 2);
  });

  it("draws the nose to the drawing's side profile: the pilot's tip, the belt, the raked windscreen", () => {
    // the pilot's tip is the car's front, low down
    const front = tris.flatMap((t) => t.p).filter((p) => p[0] > TIP - 0.01);
    expect(Math.max(...xs(tris))).toBeCloseTo(TIP, 2);
    expect(Math.max(...front.map((p) => p[1]))).toBeLessThan(0.6);
    // the belt's ribs wrap round the nose 0.38 m behind the tip
    const ribs = of("ssRib");
    expect(Math.max(...xs(ribs))).toBeGreaterThan(TIP - 0.5);
    expect(Math.max(...xs(ribs))).toBeLessThan(TIP - 0.3);
    expect(Math.min(...ys(ribs))).toBeGreaterThan(1.1);
    expect(Math.max(...ys(ribs))).toBeLessThan(1.45);
    // the windscreen: glass in the window band, its foot 0.72 m and its head 1.07 m behind the tip
    const glass = of("cabGlass");
    expect(Math.min(...ys(glass))).toBeCloseTo(2.05, 2);
    expect(Math.max(...ys(glass))).toBeCloseTo(2.85, 2);
    expect(Math.max(...xs(glass))).toBeCloseTo(TIP - 0.72, 2);
    expect(Math.min(...glass.filter((t) => t.p.some((p) => p[1] > 2.84)).flatMap((t) => t.p.filter((p) => p[1] > 2.84 && Math.abs(p[2]) < 0.05).map((p) => p[0])))).toBeCloseTo(TIP - 1.07, 2);
    // the grilles stand over the windscreen and the headlight on top of the dome
    const grille = of("grille");
    expect(Math.min(...ys(grille))).toBeGreaterThan(2.9);
    expect(Math.max(...ys(grille))).toBeLessThan(3.8);
    const lamp = of("lampHead").filter((t) => t.p.every((p) => p[1] > 3.3));
    expect(lamp.length).toBeGreaterThan(0);
    expect(Math.max(...xs(lamp))).toBeGreaterThan(TIP - 1.4);
  });

  it("closes the nose's hull on the body behind it without a gap", () => {
    // the hull's last waterline points and the body's first slice meet on the joint's plane
    const joint = TIP - 2.4;
    const key = (p: readonly number[]) => p.map((v) => v.toFixed(3)).join(",");
    const shell = new Set(tris.filter((t) => t.material === "ss" || t.material === "under")
      .flatMap((t) => t.p).filter((p) => Math.abs(p[0] - joint) < 1e-4).map(key));
    expect(shell.size).toBeGreaterThan(20);
    // both sides reach the full half width at the joint
    const z = [...shell].map((k) => Number(k.split(",")[2]));
    expect(Math.max(...z)).toBeCloseTo(1.385, 2);
    expect(Math.min(...z)).toBeCloseTo(-1.385, 2);
  });

  it("ends the observation car in its round lounge end with neither gangway nor coupler", () => {
    const obs = pioneerZephyr({ unit: "observation" });
    const t = readTriangles(obs.toGlb("z"));
    const rear = -ZEPHYR_LENGTH.observation / 2;
    expect(Math.min(...xs(t))).toBeCloseTo(rear, 2);
    // nothing of the knuckle coupler or the diaphragm within 2 m of the tail
    expect(t.filter((q) => (q.material === "knuckle" || q.material === "diaphragm") && q.p.some((p) => p[0] < rear + 2))).toEqual([]);
    expect(t.filter((q) => q.material === "ssRib" && q.p.some((p) => p[0] < rear + 0.1)).length).toBeGreaterThan(0);
  });

  it("rounds the skirt's cut-outs into arches, and the kit's default stays a square drop", () => {
    const spec: CarbodySpec = { length: 10, W: 1.4, Y: 1.15, S: 2.95, C: 3.7, lean: 0.97, arc: 6, B: 0.3, wl: 1.3, A: 1.0, wa: 1.37, cuts: [[3, 6]], edges: [] };
    const square = carbody(spec), arched = carbody({ ...spec, cutRadius: 0.5 });
    expect(square.B(3.25)).toBeCloseTo(1.0, 6);
    expect(square.stations).toEqual(carbody({ ...spec, cutRadius: 0 }).stations);
    // a quarter ellipse: at the cut's end the skirt's bottom, r inside it the skirt's top
    expect(arched.B(3)).toBeCloseTo(0.3, 6);
    expect(arched.B(3.25)).toBeCloseTo(0.3 + 0.7 * Math.sqrt(0.75), 6);
    expect(arched.B(3.5)).toBeCloseTo(1.0, 6);
    expect(arched.B(5.9)).toBeGreaterThan(0.3);
    expect(arched.B(5.9)).toBeLessThan(1.0);
    expect(arched.stations.filter((d) => d > 3 && d < 3.5).length).toBeGreaterThanOrEqual(3);
    // the power car's shell has the arch: skirt vertices between its foot and top just behind the motor truck's cut
    const arch = tris.filter((t) => t.material === "ss").flatMap((t) => t.p).filter((p) => Math.abs(p[2]) > 1.2 && p[1] > 0.45 && p[1] < 0.9 && p[0] < TIP - 2.45 && p[0] > TIP - 3.1);
    expect(arch.length).toBeGreaterThan(4);
  });

  it("builds the same bytes every time", () => {
    for (const unit of ["powerCar", "train"]) expect(Buffer.from(pioneerZephyr({ unit }).toGlb("z")).equals(Buffer.from(pioneerZephyr({ unit }).toGlb("z")))).toBe(true);
  });
});
