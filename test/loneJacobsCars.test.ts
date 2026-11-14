// A lone car of a set on Jacobs bogies (the series kit's `jacobs`, generator/shinkansen.ts):
// the game couples single cars by hand and cannot handle a bogie reaching beyond the car's
// body, so a lone car keeps at each inner end only its own half of the joint's bogie - one
// axle under its body - while the full train keeps the whole bogie under each joint.
// See docs/models/shinkansen.md ("Jacobs bogies") and the railroad-vehicle skill.

import { describe, expect, it } from "vitest";
import { ALL_VEHICLES } from "../generator/generate";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";
import { loneJointAxles, type ShinkansenSeries } from "../generator/shinkansen";
import { SBB_FLIRT } from "../generator/chUnits";
import { BR423 } from "../generator/deBr423";
import { SVT877 } from "../generator/deSvt877";

const CASES: Array<[string, ShinkansenSeries]> = [
  ["proc-vehicle-sbb-flirt", SBB_FLIRT],
  ["proc-vehicle-db-423", BR423],
  ["proc-vehicle-drg-svt877", SVT877],
];

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));

/** The x span of the leaves whose id matches. */
function span(m: MeshBuilder, re: RegExp): Array<[number, number]> {
  return leaves(m.sourceTree("x", "x").root).filter((n) => re.test(n.id)).map((n) => [n.min![0], n.max![0]]);
}

describe("lone cars of a Jacobs set", () => {
  for (const [id, series] of CASES) {
    const design = ALL_VEHICLES.find((d) => d.id === id)!;
    const units = design.params!.find((p) => p.name === "unit")!.values.map((v) => (typeof v === "string" ? v : v.value)).filter((u) => u !== "train");

    it.each(units)(`${id} %s stands on wheels under its own body`, (unit) => {
      const m = design.build({ unit });
      const shell = span(m, /^body\/shell\//);
      const [x0, x1] = [Math.min(...shell.map((s) => s[0])), Math.max(...shell.map((s) => s[1]))];
      const wheels = span(m, /(^|\/)wheelset(-\d+)?\//);
      expect(wheels.length).toBeGreaterThan(0);
      // at the joint ends: the rear (-X) of an end car, both ends of a middle car (an end car's cab
      // face stands ahead of the shell, over its leading bogie)
      for (const [a, e] of wheels) {
        expect(a).toBeGreaterThan(x0);
        if (unit !== "endCar") expect(e).toBeLessThan(x1);
      }
      // a joint end rides on one lone axle, no turning bogie; an end car keeps its leading bogie
      const supports = m.rig!.supports!;
      const lone = loneJointAxles(series, unit === "endCar");
      expect(lone.length).toBeGreaterThan(0);
      expect(supports.filter((s) => !s.node && s.axles === 1)).toHaveLength(lone.length);
      expect(supports.filter((s) => s.node)).toHaveLength(unit === "endCar" ? 1 : 0);
    });

    it(`${id} train keeps a whole Jacobs bogie under every joint`, () => {
      const m = design.build({ unit: "train" });
      const sections = m.rig!.sections!.length;
      const joints = m.rig!.supports!.filter((s) => s.sections.length === 2);
      expect(joints).toHaveLength(sections - 1);
      for (const j of joints) expect(j.axles).toBe(2);
    });
  }
});
