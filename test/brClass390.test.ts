import { describe, it, expect } from "vitest";
import { UK_UNITS } from "../generator/ukUnits.ts";
import { C390, C390_AVANTI } from "../generator/brClass390.ts";

// the Class 390 Pendolino on the series kit (generator/brClass390.ts, docs/models/uk-trains.md)
const design = UK_UNITS.find((d) => d.id === "proc-vehicle-br-class-390")!;

function ids(params: Record<string, string>): string[] {
  const out: string[] = [];
  const walk = (n: any) => { out.push(n.id); for (const k of n.children ?? []) walk(k); };
  walk(design.build(params).sourceTree(design.id, design.title).root);
  return out;
}

describe("Class 390", () => {
  it("keeps its parameters and liveries", () => {
    expect((design.params ?? []).map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "endCar", ["endCar", "middleCar", "train"]],
      ["cars", "4", ["4", "6", "8"]],
      ["livery", "virgin", ["virgin", "avanti"]],
    ]);
  });

  it("draws the measured layout: a door at each end of every car, the end cars' five and six windows, the intermediate car's eight", () => {
    const { end, middle } = C390.layout!;
    expect(end.doors).toHaveLength(2);
    expect(end.windows).toHaveLength(5);
    expect(C390.rearEnd!.layout.windows).toHaveLength(6);
    expect(middle.doors).toHaveLength(2);
    expect(middle.windows).toHaveLength(8);
    expect(C390.windowCornerRadius).toBeGreaterThan(0);
    // the Avanti series differs only in its face and the paint on its cars
    expect(C390_AVANTI.layout).toBe(C390.layout);
    expect(C390_AVANTI.cabFace).not.toBe(C390.cabFace);
  });

  for (const livery of ["virgin", "avanti"])
    it(`${livery}: the cab face, the cab door's window and the end car's paint under the belly, within the car budget`, () => {
      const m = design.build({ livery });
      expect(m.triangleCount()).toBeLessThanOrEqual(16000);
      const tree = ids({ livery });
      expect(tree.some((id) => id.includes("cab-face"))).toBe(true);
      expect(tree.some((id) => id.includes("low-sweeps"))).toBe(true);
      expect(tree.some((id) => id.includes("roof-equipment"))).toBe(true);
    });

  it("Avanti's intermediate car carries the dark window band and its teal rear quarter; Virgin's none", () => {
    const av = ids({ livery: "avanti", unit: "middleCar" }), vi = ids({ livery: "virgin", unit: "middleCar" });
    expect(av.some((id) => id.includes("rear-quarter"))).toBe(true);
    expect(av.some((id) => id.includes("window-band"))).toBe(true);
    expect(vi.some((id) => id.includes("rear-quarter") || id.includes("window-band"))).toBe(false);
  });
});
