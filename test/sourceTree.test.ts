// The source tree MeshBuilder records (generator/sourceTree.ts): its leaves'
// triangle ranges tile each material's GLB primitive, in the order the GLB writes
// the triangles -- node by node once a model has parts. See docs/models/source-tree.md.

import { describe, expect, it } from "vitest";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { liftable } from "../generator/liftable.ts";
import { isLeaf, type TreeNode } from "../generator/sourceTree.ts";

function leaves(n: TreeNode): Array<{ id: string; tri: [number, number] }> {
  return isLeaf(n) ? [{ id: n.id, tri: n.tri }] : n.children.flatMap(leaves);
}

describe("source tree ranges", () => {
  it("place an empty leaf among the others when a moving part's triangles go to their own node", () => {
    const m = new MeshBuilder({ red: { color: "#c03030" } });
    // a mechanism drawn first: its triangles move to the end of the material's primitive
    m.scope("arm", () => liftable(m, "arm", (mm, lift) => mm.rod("red", [0, 1, 0], [Math.cos(lift), 1 + Math.sin(lift), 0], 0.05)));
    m.scope("skin", () => {
      m.tri("red", [0, 0, 0], [1, 0, 0], [2, 0, 0]); // degenerate: an empty leaf
      m.box("red", 0, 0, 1, 1, 0, 1);
    });
    const tree = m.sourceTree("t", "t");
    const ranges = leaves(tree.root).map((l) => l.tri).sort((a, b) => a[0] - b[0]);
    let next = 0;
    for (const [first, count] of ranges) {
      expect(first).toBe(next);
      next += count;
    }
    expect(next).toBe(tree.triangles);
  });
});
