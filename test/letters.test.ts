import { describe, it, expect } from "vitest";
import { letters, runsWidth, wordWidth, wordmarkAt } from "../generator/letters.ts";
import { cd163, cd263, CD163_LIVERIES, CD263_LIVERIES } from "../generator/cd163Family.ts";
import { cd750, CD750_LIVERIES } from "../generator/cd750.ts";
import { cd150, CD150_LIVERIES } from "../generator/cd150.ts";
import { vectron } from "../generator/vectron.ts";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree.ts";
import type { MeshBuilder } from "../generator/meshBuilder.ts";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-.| \u010C\u0158\u0160\u017D\u011A\u00C9\u00C1\u00CD\u00DD";
const bounds = (tris: Array<[number, number]>) => {
  const us = tris.map((p) => p[0]), vs = tris.map((p) => p[1]);
  return { u0: Math.min(...us), u1: Math.max(...us), v0: Math.min(...vs), v1: Math.max(...vs) };
};
const area = (tris: Array<[number, number]>) => {
  let a = 0;
  for (let i = 0; i < tris.length; i += 3) {
    const [p, q, r] = [tris[i]!, tris[i + 1]!, tris[i + 2]!];
    a += Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) / 2;
  }
  return a;
};
function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}
const nodes = (m: MeshBuilder) => leaves(m.sourceTree("t", "t").root);

describe("the stroke font", () => {
  it("draws every glyph it lists, lower case as capitals, and refuses the rest", () => {
    for (const ch of ALPHABET.replace(" ", "")) expect(letters(ch, 0, 0, 1, false).length, ch).toBeGreaterThan(0);
    expect(letters(" ", 0, 0, 1, false)).toEqual([]);
    expect(letters("regiojet", 0, 0, 1, false)).toEqual(letters("REGIOJET", 0, 0, 1, false));
    expect(() => letters("@", 0, 0, 1, false)).toThrow();
  });

  it("fills the stated box: the cap height, the width, the accents above it", () => {
    const h = 0.4;
    // straight glyphs fill it exactly; round and diagonal ones overshoot it a little, as type does
    const b = bounds(letters("EFH ILT", 2, 1, h, false));
    expect([b.u0, b.v0, b.u1, b.v1].map((x) => x.toFixed(9))).toEqual([2, 1, 2 + wordWidth("EFH ILT", h), 1 + h].map((x) => x.toFixed(9)));
    for (const ch of "ABCDGJKMNOPRSUVWXYZ0123456789") {
      const g = bounds(letters(ch, 0, 0, h, false));
      expect(g.v0, ch).toBeGreaterThan(-0.04 * h);
      expect(g.v1, ch).toBeLessThan(1.04 * h);
      expect(g.u0, ch).toBeGreaterThan(-0.06 * h);
      expect(g.u1, ch).toBeLessThan(wordWidth(ch, h) + 0.06 * h);
    }
    // the hacek and the acute stand over the capital, within 0.4 of its height
    const c = bounds(letters("\u010C", 0, 0, 1, false));
    expect(c.v1).toBeGreaterThan(1.1);
    expect(c.v1).toBeLessThan(1.4);
  });

  it("mirrors when read toward -u and leans with the slant", () => {
    const a = letters("RJ", 1, 0, 0.5, false), b = letters("RJ", 1, 0, 0.5, true);
    expect(b.length).toBe(a.length);
    a.forEach(([u, v], i) => {
      expect(b[i]![0]).toBeCloseTo(2 - u, 9);
      expect(b[i]![1]).toBeCloseTo(v, 9);
    });
    const s = bounds(letters("I", 0, 0, 1, false, { slant: 0.2 })), u = bounds(letters("I", 0, 0, 1, false));
    expect(s.u1 - u.u1).toBeCloseTo(0.2, 9);
  });

  it("sets a wordmark's runs one gap apart, centred or from its start", () => {
    const runs = [["|| REGIO", "red"], ["JET", "navy"]] as const;
    const h = 0.5, style = { width: 0.75, gap: 0.14 };
    const start = wordmarkAt(runs, 0, 0, h, false, style);
    expect(start.map((r) => r.mat)).toEqual(["red", "navy"]);
    const all = bounds([...start[0]!.tris, ...start[1]!.tris]);
    expect(all.u1 - all.u0).toBeCloseTo(runsWidth(runs, h, style), 9);
    const pair = wordmarkAt([["E", "a"], ["E", "b"]], 0, 0, h, false, style);
    expect(bounds(pair[1]!.tris).u0 - bounds(pair[0]!.tris).u1).toBeCloseTo(0.14 * h, 9);
    const centred = wordmarkAt(runs, 3, 0, h, true, style, "centre");
    const cb = bounds([...centred[0]!.tris, ...centred[1]!.tris]);
    expect((cb.u0 + cb.u1) / 2).toBeCloseTo(3, 9);
  });

  it("draws every stroke with area and no degenerate triangle", () => {
    const tris = letters(ALPHABET, 0, 0, 1, false);
    expect(tris.length % 3).toBe(0);
    for (let i = 0; i < tris.length; i += 3) expect(area(tris.slice(i, i + 3)), `triangle ${i / 3}`).toBeGreaterThan(1e-6);
  });
});

describe("the lettered liveries", () => {
  it("letter RegioJet's two-colour wordmark on the 162 and the Vectron, sides and ends", () => {
    for (const [m, red] of [[cd163({ livery: "regiojet" }), "rjRed"], [vectron({ livery: "regiojet" }), "red"]] as const) {
      const ns = nodes(m).filter((n) => n.id.includes("wordmark"));
      expect(new Set(ns.map((n) => n.material))).toEqual(new Set([red, "rjNavy"]));
      // both sides and both ends
      expect(ns.length).toBe(8);
    }
  });

  it("letter CD's name after the emblem on the blue 162 and 150, and on no older livery", () => {
    for (const m of [cd163({ livery: "cdBlue" }), cd150({ livery: "cdBlue" })]) {
      const ns = nodes(m).filter((n) => n.id.includes("wordmark"));
      expect(ns.map((n) => n.material)).toEqual(["logo", "logo"]);
    }
    for (const key of Object.keys(CD163_LIVERIES).filter((k) => k !== "regiojet" && k !== "cdBlue"))
      expect(nodes(cd163({ livery: key })).some((n) => n.id.includes("wordmark")), key).toBe(false);
    for (const key of Object.keys(CD150_LIVERIES).filter((k) => k !== "cdBlue"))
      expect(nodes(cd150({ livery: key })).some((n) => n.id.includes("wordmark")), key).toBe(false);
  });

  it("letter CD's name on the blue 371 and 754 only, clear of the side equipment", () => {
    const apart = (a: LeafNode, b: LeafNode) => a.max![0] < b.min![0] || a.min![0] > b.max![0] || a.max![1] < b.min![1] || a.min![1] > b.max![1];
    for (const [m, mat, gear] of [
      [cd263({ livery: "cd371Blue" }), "logo", /^body\/(grille-banks|machine-room-windows|side-markings\/(emblem|number))/],
      [cd750({ livery: "cd754Blue" }), "cdWhite", /^sides\/(left|right)-side\/(radiator|windows|emblem|number-plate)/],
    ] as const) {
      const ns = nodes(m);
      const words = ns.filter((n) => n.id.includes("wordmark"));
      // one run on each side
      expect(words.map((n) => n.material)).toEqual([mat, mat]);
      const gears = ns.filter((n) => gear.test(n.id));
      expect(gears.length).toBeGreaterThan(4);
      for (const w of words)
        for (const g of gears) {
          if (Math.sign(w.min![2]) !== Math.sign(g.min![2])) continue;
          expect(apart(w, g), `${w.id} vs ${g.id}`).toBe(true);
        }
    }
    for (const key of Object.keys(CD263_LIVERIES).filter((k) => k !== "cd371Blue"))
      expect(nodes(cd263({ livery: key })).some((n) => n.id.includes("wordmark")), key).toBe(false);
    for (const key of Object.keys(CD750_LIVERIES).filter((k) => k !== "cd754Blue"))
      expect(nodes(cd750({ livery: key })).some((n) => n.id.includes("wordmark")), key).toBe(false);
  });

  it("keeps the lettering clear of the side number plate on the 162", () => {
    for (const livery of ["regiojet", "cdBlue"]) {
      const ns = nodes(cd163({ livery }));
      const plate = ns.filter((n) => n.id.includes("side-markings/number-plate"));
      const words = ns.filter((n) => n.id.includes("side-markings/wordmark"));
      for (const w of words)
        for (const p of plate) {
          if (Math.sign(w.min![2]) !== Math.sign(p.min![2])) continue;
          const apart = w.max![0] < p.min![0] || w.min![0] > p.max![0] || w.max![1] < p.min![1] || w.min![1] > p.max![1];
          expect(apart, `${livery} ${w.id} vs ${p.id}`).toBe(true);
        }
    }
  });
});
