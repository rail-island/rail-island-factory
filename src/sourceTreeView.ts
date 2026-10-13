// Everything the model page decides about a procedural source tree, as pure
// functions: the id index, which triangles a node covers (for the preview's
// highlight), which leaf owns a triangle (for picking), which scopes to expand,
// and how a node's arguments and extent read. No Solid, no three, no DOM, so
// test/sourceTreeView.test.ts drives it in Vitest's node environment.
//
// The tree file is export/tree/<id>.json (generator/sourceTree.ts); only its
// types are imported, as `src/` may not import generator code.

import type { ArgValue, LeafNode, ScopeNode, SourceTree, TreeNode } from "../generator/sourceTree.ts";

export type { LeafNode, ScopeNode, SourceTree, TreeNode };

/** A run of triangles within one material's primitive: [first, count]. */
export type TriRange = [number, number];

export function isLeaf(n: TreeNode): n is LeafNode {
  return "kind" in n;
}

export interface TreeIndex {
  tree: SourceTree;
  byId: ReadonlyMap<string, TreeNode>;
  /** Per material, the index into `leaves` of the leaf owning each triangle (-1 for none). */
  owner: ReadonlyMap<string, Int32Array>;
  leaves: readonly LeafNode[];
}

export function indexTree(tree: SourceTree): TreeIndex {
  const byId = new Map<string, TreeNode>();
  const leaves: LeafNode[] = [];
  const visit = (n: TreeNode): void => {
    byId.set(n.id, n);
    if (isLeaf(n)) leaves.push(n);
    else for (const c of n.children) visit(c);
  };
  visit(tree.root);
  const sizes = new Map<string, number>(tree.materials.map((m) => [m, 0]));
  for (const l of leaves) sizes.set(l.material, Math.max(sizes.get(l.material) ?? 0, l.tri[0] + l.tri[1]));
  const owner = new Map<string, Int32Array>();
  for (const [m, n] of sizes) owner.set(m, new Int32Array(n).fill(-1));
  leaves.forEach((l, i) => owner.get(l.material)!.fill(i, l.tri[0], l.tri[0] + l.tri[1]));
  return { tree, byId, owner, leaves };
}

/**
 * The triangles a node covers, per material, as sorted ranges with touching
 * ones merged -- what the preview highlights. Empty for an unknown id.
 */
export function rangesOf(index: TreeIndex, id: string): Map<string, TriRange[]> {
  const out = new Map<string, TriRange[]>();
  const node = index.byId.get(id);
  if (!node) return out;
  const visit = (n: TreeNode): void => {
    if (!isLeaf(n)) {
      for (const c of n.children) visit(c);
      return;
    }
    if (n.tri[1] === 0) return;
    if (!out.has(n.material)) out.set(n.material, []);
    out.get(n.material)!.push([n.tri[0], n.tri[1]]);
  };
  visit(node);
  for (const [m, list] of out) {
    list.sort((a, b) => a[0] - b[0]);
    const merged: TriRange[] = [];
    for (const r of list) {
      const last = merged[merged.length - 1];
      if (last && last[0] + last[1] >= r[0]) last[1] = Math.max(last[1], r[0] + r[1] - last[0]);
      else merged.push([r[0], r[1]]);
    }
    out.set(m, merged);
  }
  return out;
}

/** The leaf that drew triangle `tri` of `material`'s primitive, or null. */
export function leafAt(index: TreeIndex, material: string, tri: number): LeafNode | null {
  const i = index.owner.get(material)?.[tri] ?? -1;
  return i >= 0 ? index.leaves[i]! : null;
}

/** The ids of the scopes above a node, root first: what must be expanded to show it. */
export function ancestorIds(id: string): string[] {
  if (id === "") return [];
  const parts = id.split("/");
  const out = [""];
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join("/"));
  return out;
}

/** A node's label in the tree: a scope's name, a leaf's kind and material. */
export function nodeLabel(n: TreeNode): string {
  return isLeaf(n) ? `${n.kind} ${n.material}` : n.name;
}

/** An argument's value as the detail block shows it. */
export function formatArg(v: ArgValue): string {
  if (typeof v === "boolean") return v ? "yes" : "no";
  if (Array.isArray(v)) return `(${v.join(", ")})`;
  return String(v);
}

/** What the ring-valued arguments hold: a ring is recorded as its point count. */
const RING_ARGS = new Set(["ring", "lower", "upper"]);

export function argLabel(key: string): string {
  return RING_ARGS.has(key) ? `${key} (points)` : key;
}

/** A share of the model's triangles, e.g. "12.3 %"; "<0.1 %" for a sliver, "0 %" for none. */
export function formatShare(part: number, whole: number): string {
  if (part <= 0 || whole <= 0) return "0 %";
  const pct = (part / whole) * 100;
  return pct < 0.1 ? "<0.1 %" : `${pct.toFixed(1)} %`;
}

/** A node's bounding box as "w x d x h m", or null when it drew nothing. */
export function formatSize(n: TreeNode): string | null {
  if (!n.min || !n.max) return null;
  const r = (v: number) => String(Math.round(v * 100) / 100);
  return `${r(n.max[0] - n.min[0])} x ${r(n.max[2] - n.min[2])} x ${r(n.max[1] - n.min[1])} m`;
}

/** The colour of a material, "#rrggbb", or null when the tree does not know it. */
export function materialColor(tree: SourceTree, material: string): string | null {
  const i = tree.materials.indexOf(material);
  return i >= 0 ? (tree.colors[i] ?? null) : null;
}
