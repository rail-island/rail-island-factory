// The model page's source-tree logic (src/sourceTreeView.ts), on a small
// hand-made tree and on a real design's.

import { describe, expect, it } from "vitest";
import { MeshBuilder } from "../generator/meshBuilder";
import { designTree } from "../generator/generate";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import {
  ancestorIds, argLabel, formatArg, formatShare, formatSize, indexTree, leafAt, materialColor, nodeLabel, rangesOf,
} from "../src/sourceTreeView";

function sample() {
  const m = new MeshBuilder({ a: { color: "#808080" }, b: { color: "#ff0000" } });
  m.scope("tier 1", () => {
    m.box("a", 0, 0, 4, 4, 0, 2); // a 0..9
    m.box("b", 0, 0, 1, 1, 2, 3); // b 0..9
  });
  m.scope("tier 2", () => {
    m.box("a", 0, 0, 3, 3, 3, 5); // a 10..19
    m.scope("cap", () => m.box("a", 0, 0, 2, 2, 5, 6)); // a 20..29
  });
  return indexTree(m.sourceTree("sky-sample", "Sample"));
}

describe("indexTree", () => {
  it("finds every node by id and every triangle's leaf", () => {
    const ix = sample();
    expect([...ix.byId.keys()]).toEqual(["", "tier-1", "tier-1/box-1", "tier-1/box-2", "tier-2", "tier-2/box-1", "tier-2/cap", "tier-2/cap/box-1"]);
    expect(leafAt(ix, "a", 0)!.id).toBe("tier-1/box-1");
    expect(leafAt(ix, "a", 9)!.id).toBe("tier-1/box-1");
    expect(leafAt(ix, "a", 10)!.id).toBe("tier-2/box-1");
    expect(leafAt(ix, "a", 25)!.id).toBe("tier-2/cap/box-1");
    expect(leafAt(ix, "b", 3)!.id).toBe("tier-1/box-2");
    expect(leafAt(ix, "a", 30)).toBeNull();
    expect(leafAt(ix, "nope", 0)).toBeNull();
  });

  it("owns every triangle of a real design", () => {
    for (const d of SKYSCRAPERS) {
      const ix = indexTree(designTree(d.id));
      for (const [, owners] of ix.owner) expect(owners.includes(-1)).toBe(false);
    }
  });
});

describe("rangesOf", () => {
  it("collects a scope's triangles per material and merges touching runs", () => {
    const ix = sample();
    expect([...rangesOf(ix, "tier-2")]).toEqual([["a", [[10, 20]]]]);
    expect([...rangesOf(ix, "tier-1")]).toEqual([["a", [[0, 10]]], ["b", [[0, 10]]]]);
    expect([...rangesOf(ix, "")]).toEqual([["a", [[0, 30]]], ["b", [[0, 10]]]]);
    expect([...rangesOf(ix, "tier-2/cap/box-1")]).toEqual([["a", [[20, 10]]]]);
  });

  it("is empty for an unknown id, so a stale ?node= highlights nothing", () => {
    expect(rangesOf(sample(), "tier-9").size).toBe(0);
  });

  // A scope's calls run consecutively, so within one material its triangles are
  // one run: the preview's highlight costs at most two draw groups per material.
  it("gives every scope of a real design one run per material", () => {
    for (const d of SKYSCRAPERS) {
      const ix = indexTree(designTree(d.id));
      for (const [id, n] of ix.byId) {
        if ("kind" in n) continue;
        for (const [, runs] of rangesOf(ix, id)) expect(runs.length).toBe(1);
      }
    }
  });
});

describe("the tree's labels", () => {
  it("names the scopes above a node, root first", () => {
    expect(ancestorIds("")).toEqual([]);
    expect(ancestorIds("crown")).toEqual([""]);
    expect(ancestorIds("tier-3/piers/box-4")).toEqual(["", "tier-3", "tier-3/piers"]);
  });

  it("formats labels, arguments, shares and sizes", () => {
    const ix = sample();
    const leaf = ix.byId.get("tier-1/box-2")!;
    expect(nodeLabel(leaf)).toBe("box b");
    expect(nodeLabel(ix.byId.get("tier-2/cap")!)).toBe("cap");
    expect(formatArg(true)).toBe("yes");
    expect(formatArg(2.5)).toBe("2.5");
    expect(formatArg([1, -2, 3])).toBe("(1, -2, 3)");
    expect(argLabel("ring")).toBe("ring (points)");
    expect(argLabel("y0")).toBe("y0");
    expect(formatShare(10, 40)).toBe("25.0 %");
    expect(formatShare(1, 10000)).toBe("<0.1 %");
    expect(formatShare(0, 10)).toBe("0 %");
    expect(formatSize(leaf)).toBe("1 x 1 x 1 m");
    expect(materialColor(ix.tree, "b")).toBe("#ff0000");
    expect(materialColor(ix.tree, "zz")).toBeNull();
  });
});
