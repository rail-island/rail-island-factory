import { describe, it, expect } from "vitest";
import { IN_UNITS } from "../generator/inUnits.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";

// the Mumbai suburban EMU's own spec (generator/inMumbaiEmu.ts, docs/models/india-trains.md)
const design = IN_UNITS.find((d) => d.id === "proc-vehicle-ir-mumbai-emu")!;

function ids(v: Record<string, string>): string[] {
  const out: string[] = [];
  const walk = (n: any) => { out.push(n.id); for (const k of n.children ?? []) walk(k); };
  walk(design.build(v).sourceTree(design.id, design.title).root);
  return out;
}

describe("Mumbai suburban EMU", () => {
  for (const unit of ["endCar", "middleCar"]) {
    it(`${unit}: four doorways (eight leaves) a side, barred windows, no coplanar faces`, () => {
      const tree = ids({ unit });
      // two leaves per doorway, on each side
      expect(tree.filter((id) => /right-side\/doors\/door-\d+$/.test(id))).toHaveLength(8);
      expect(tree.filter((id) => /left-side\/doors\/door-\d+$/.test(id))).toHaveLength(8);
      expect(tree.some((id) => /window-bars$/.test(id))).toBe(true);
      for (const livery of ["std", "alt"]) expect(findCoplanarOverlaps(design.build({ unit, livery }).toGlb(design.id)), livery).toEqual([]);
    });
  }

  it("the end car has the cab face's two windscreens", () => {
    expect(ids({ unit: "endCar" }).filter((id) => /(^|\/)cab-face\/skin\/pane-\d+$/.test(id))).toHaveLength(2);
  });
});
