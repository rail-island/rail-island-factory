// The Class 378 Capitalstar (generator/ukUnits.ts, docs/models/uk-trains.md): its
// livery paints the door leaves and the cab front apart from the side bands (the
// series kit's `doors` and `front` livery fields).

import { describe, expect, it } from "vitest";
import { UK_UNITS } from "../generator/ukUnits";
import type { MeshBuilder } from "../generator/meshBuilder";

const design = UK_UNITS.find((d) => d.id === "proc-vehicle-br-class-378")!;

/** Each triangle's centroid (x, y) in a material. */
function centroids(m: MeshBuilder, mat: string): Array<[number, number]> {
  const pos = (m as unknown as { groups: Map<string, { pos: number[] }> }).groups.get(mat)?.pos ?? [];
  const out: Array<[number, number]> = [];
  for (let i = 0; i < pos.length; i += 9) out.push([(pos[i]! + pos[i + 3]! + pos[i + 6]!) / 3, (pos[i + 1]! + pos[i + 4]! + pos[i + 7]!) / 3]);
  return out;
}

describe("Class 378", () => {
  const m = design.build();
  const xs = centroids(m, "blue").map(([x]) => x);
  const front = Math.max(...xs);

  it("paints the cab front yellow, on the nose only", () => {
    const yellow = centroids(m, "yellow");
    expect(yellow.length).toBeGreaterThan(0);
    for (const [x, y] of yellow) {
      expect(x).toBeGreaterThan(front - 1.3);
      expect(y).toBeGreaterThan(1.3);
      expect(y).toBeLessThan(2.6);
    }
  });

  it("paints the door leaves orange above the side's orange stripe", () => {
    const high = centroids(m, "orange").filter(([, y]) => y > 2.0);
    // two doors a side, both sides
    const doors = new Set(high.map(([x]) => Math.round(x)));
    expect(doors.size).toBeGreaterThanOrEqual(2);
  });

  it("is five cars of 101.35 m as a full train", () => {
    const train = design.build({ unit: "train", cars: "5" });
    const pos = train.positions();
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < pos.length; i += 3) { lo = Math.min(lo, pos[i]!); hi = Math.max(hi, pos[i]!); }
    expect(Math.abs(hi - lo - 101.35)).toBeLessThan(1.0);
  });
});
