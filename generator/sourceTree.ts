// The procedural source tree: how a model was built, as a tree of named scopes
// (a helper such as curtainWall, a loop iteration such as "tier 3") whose leaves
// are the MeshBuilder primitive calls that drew the triangles. MeshBuilder
// records it while a design runs; the build writes it as export/tree/<id>.json
// and the site's model page shows it beside the 3D preview.
//
// A leaf points at its triangles as a range WITHIN its material's primitive of
// the GLB: every primitive call draws in one material and triangles are appended
// in call order, so a leaf's triangles are always contiguous. Recording only
// observes -- the GLB bytes do not change.
//
// Site-only: not part of the export contract the game imports. No `node:`
// imports; the site imports the types from here.

export const TREE_DIR = "tree";

/** What a scope or leaf covers: its triangle count and bounding box (metres). */
export interface NodeExtent {
  triangles: number;
  /** Absent when the node drew no triangle (every one was degenerate). */
  min?: [number, number, number];
  max?: [number, number, number];
}

export interface ScopeNode extends NodeExtent {
  /** The slash path of slugged names from the root, e.g. "tier-3/piers"; "" for the root. */
  id: string;
  name: string;
  children: TreeNode[];
}

export type PrimitiveKind = "tri" | "quad" | "cap" | "loft" | "prism" | "spire" | "box" | "sweep" | "slab" | "facets" | "tube" | "rod";

export type ArgValue = number | boolean | number[];

export interface LeafNode extends NodeExtent {
  /** The parent's id plus "<kind>-<n>", n counting that kind within the scope from 1. */
  id: string;
  kind: PrimitiveKind;
  material: string;
  /** The call's arguments, numbers rounded to the millimetre; a ring is its point count. */
  args: Record<string, ArgValue>;
  /** [first, count]: the triangles within the material's GLB primitive. */
  tri: [number, number];
}

export type TreeNode = ScopeNode | LeafNode;

export interface SourceTree {
  version: 1;
  id: string;
  triangles: number;
  /** Material names in the GLB's primitive order (sorted by name). */
  materials: string[];
  /** Each material's sRGB colour ("#rrggbb"), parallel to `materials`. */
  colors: string[];
  root: ScopeNode;
}

export function isLeaf(n: TreeNode): n is LeafNode {
  return "kind" in n;
}

/** A scope name as an id segment: lower case, runs of anything else as one "-". */
export function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "scope";
}
