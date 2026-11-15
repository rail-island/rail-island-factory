// The CR SS1's tubular pilot (generator/cnSs1.ts, docs/models/china-locos.md "The SS1's body"):
// it hangs from the body's foot onto a deep bottom plate, as on SS1 008. A regression test: the
// pilot once stopped 0.34 m under the body, its tubes floating in the air, with only a 7 cm plate.
import { describe, expect, it } from "vitest";
import { crSs1, SS1_PILOT } from "../generator/cnSs1";

interface Node { id: string; min?: number[]; max?: number[]; material?: string; children?: Node[] }
const leaves = (n: Node): Node[] => (n.children && n.children.length ? n.children.flatMap(leaves) : [n]);

describe("the CR SS1's pilot", () => {
  const nodes = leaves(crSs1().sourceTree("test", "Test").root as Node).filter((n) => /(^|\/)pilot(-\d+)?\//.test(n.id));

  it("is drawn at both ends", () => {
    expect(nodes.filter((n) => n.max![0]! > 9).length).toBeGreaterThan(0);
    expect(nodes.filter((n) => n.min![0]! < -9).length).toBeGreaterThan(0);
  });

  it("reaches up into the body's foot (0.82 m), no gap under the body", () => {
    expect(Math.max(...nodes.map((n) => n.max![1]!))).toBeGreaterThanOrEqual(0.82);
    expect(SS1_PILOT.postTop).toBeGreaterThan(0.82);
    expect(Math.max(...SS1_PILOT.tubes)).toBeGreaterThan(0.65);
  });

  it("stands on a deep bottom plate near the rail", () => {
    const plates = nodes.filter((n) => n.max![1]! - n.min![1]! >= 0.15 && n.min![1]! <= 0.12 && n.max![2]! - n.min![2]! > 2);
    expect(plates.length).toBe(2);
  });
});
