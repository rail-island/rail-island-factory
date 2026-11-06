import { describe, it, expect } from "vitest";
import { DE_UNITS, VT98 } from "../generator/deUnits.ts";
import { MAT46, NL_UNITS } from "../generator/nlUnits.ts";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { collectTriangles, parseGlb } from "../generator/glbTriangles.ts";
import type { ProceduralDesign } from "../generator/design.ts";
import type { ShinkansenSeries } from "../generator/shinkansen.ts";

// the series kit's cab faces (generator/seriesCab.ts, docs/models/shinkansen.md) on the
// units that had the generic short nose with the windscreens on its crown
const CASES: Array<{ design: ProceduralDesign; series: ShinkansenSeries; panes: number; single: boolean }> = [
  { design: DE_UNITS.find((d) => d.id === "proc-vehicle-db-vt98")!, series: VT98, panes: 2, single: true },
  { design: NL_UNITS.find((d) => d.id === "proc-vehicle-ns-mat46")!, series: MAT46, panes: 5, single: false },
];

function points(d: ProceduralDesign) {
  const m = d.build({});
  const glb = m.toGlb("test");
  const { json, bin } = parseGlb(glb);
  return { m, glb, pts: collectTriangles(json, bin).flatMap((t) => t.p) };
}

function ids(d: ProceduralDesign): string[] {
  const out: string[] = [];
  const walk = (n: any) => { out.push(n.id); for (const k of n.children ?? []) walk(k); };
  walk(d.build({}).sourceTree(d.id, d.title).root);
  return out;
}

describe("series cab faces", () => {
  for (const c of CASES) {
    it(`${c.design.id}: a cab face with its panes in place of the crown windscreen, no coplanar faces`, () => {
      const tree = ids(c.design);
      const ends = c.single ? ["cab-face", "rear-cab-face"] : ["cab-face"];
      for (const e of ends) expect(tree.filter((id) => new RegExp(`(^|/)${e}/skin/pane-\\d+$`).test(id)), e).toHaveLength(c.panes);
      expect(tree.some((id) => /windscreen/.test(id))).toBe(false);
      const { glb } = points(c.design);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

    it(`${c.design.id}: the face stands at the car's end, upright at the windscreens (not a hood behind a low tip)`, () => {
      const { pts } = points(c.design);
      const s = c.series;
      const maxX = Math.max(...pts.map((p) => p[0]!));
      const front = (y0: number, y1: number) => Math.max(...pts.filter((p) => p[1]! >= y0 && p[1]! <= y1 && Math.abs(p[2]!) < 0.9).map((p) => p[0]!));
      // the coupling plane lies the buffers' or the coupler's reach ahead of the face; the face's top at the panes stays within 0.5 m of its foot
      const foot = front(s.A + 0.2, s.A + 0.8);
      const top = Math.max(...s.cabFace!.panes.map((p) => p.y[1]));
      expect(foot - front(top - 0.3, top)).toBeLessThan(0.5);
      expect(maxX - foot).toBeLessThan(0.9);
    });
  }

  it("hangs a single axle's horn guides up into the body: no gap over the wheels", () => {
    for (const c of CASES.filter((x) => x.series.wheelbase === 0)) {
      const { m, pts } = points(c.design);
      for (const sp of m.rig!.supports!) {
        const near = pts.filter((p) => Math.abs(p[0]! - sp.x) < 0.3 && Math.abs(p[2]!) > 0.92 && Math.abs(p[2]!) < 1.04);
        expect(Math.max(...near.map((p) => p[1]!)), `${c.design.id} at ${sp.x}`).toBeGreaterThanOrEqual(c.series.A);
      }
    }
  });
});
