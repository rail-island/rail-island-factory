import { proceduralId } from "./modelId.ts";
// Prints a design's source-tree scope ids (no leaves) with their model extents,
// for writing landmark files. Node only:
//
//   pnpm exec tsx generator/treeIds.ts <id> [name=value ...] [filter]

import { DESIGNS } from "./generate.ts";
import { isLeaf, type TreeNode } from "./sourceTree.ts";

if (process.argv[1] && process.argv[1].endsWith("treeIds.ts")) {
  const [id, ...rest] = process.argv.slice(2);
  const params = Object.fromEntries(rest.filter((a) => a.includes("=")).map((a) => a.split("=") as [string, string]));
  const filter = rest.find((a) => !a.includes("="));
  const d = DESIGNS.get(proceduralId(id!));
  if (!d) throw new Error(`no design ${id}`);
  const tree = d.build(params).sourceTree(d.id, d.title);
  const f = (v: number | undefined) => (v === undefined ? "?" : v.toFixed(3));
  const walk = (n: TreeNode, depth: number): void => {
    if (isLeaf(n)) return;
    if (!filter || n.id.includes(filter)) {
      const b = n as unknown as { min?: number[]; max?: number[] };
      console.log(`${"  ".repeat(depth)}${n.id}  [${(b.min ?? []).map(f).join(", ")}] .. [${(b.max ?? []).map(f).join(", ")}]`);
    }
    n.children.forEach((c) => walk(c, depth + 1));
  };
  walk(tree.root, 0);
}
