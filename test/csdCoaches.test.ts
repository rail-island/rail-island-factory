import { describe, it, expect } from "vitest";
import { CSD_COACHES, COACH_CATALOG } from "../generator/csdCoaches";
import { coachComparison, readLandmarks } from "../generator/csdCoachComparison";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));

function built(folder: string) {
  const coach = CSD_COACHES.find((c) => c.folder === folder)!;
  const mesh = coach.build();
  const tree = mesh.sourceTree(coach.id, coach.title);
  const glb = mesh.toGlb(coach.title);
  const { json, bin } = parseGlb(glb);
  return { coach, glb, nodes: leaves(tree.root), tris: collectTriangles(json, bin) };
}

// Mechanical dimensions from the vlakosimdb XML: length over the buffer heads,
// and the axle centres (Factory x, the model centred between the buffer heads).
const MECHANICS: Record<string, { length: number; axles: number[] }> = {
  "csd-a": { length: 24.5, axles: [-9.8, -7.3, 7.3, 9.8] },
  "csd-b": { length: 24.5, axles: [-9.8, -7.3, 7.3, 9.8] },
  "csd-balm": { length: 19.1, axles: [-7.4, -5.3, 5.3, 7.4] },
  "csd-bam": { length: 22.2, axles: [-8.8, -6.0, 6.0, 8.8] },
  "csd-bdmtee": { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75] },
  "csd-be31": { length: 15.5, axles: [-4.7, 4.7] },
  "csd-bi20": { length: 12.6, axles: [-3.9, 4.0] },
  "csd-bmo": { length: 26.8, axles: [-11.15, -8.65, 8.65, 11.15] },
  "csd-dsk": { length: 10.5, axles: [-3.35, 2.85] },
};

// Body height and half width of the XML alongx sections (roofs included).
const SECTIONS: Record<string, { top: number; half: number }> = {
  "csd-a": { top: 4.2, half: 1.5 },
  "csd-b": { top: 4.2, half: 1.5 },
  "csd-balm": { top: 3.7, half: 1.5 },
  "csd-bam": { top: 3.8, half: 1.5 },
  "csd-bdmtee": { top: 4.0, half: 1.5 },
  "csd-be31": { top: 3.8, half: 1.5 },
  "csd-bi20": { top: 3.8, half: 1.5 },
  "csd-bmo": { top: 4.6, half: 1.5 },
  "csd-dsk": { top: 3.8, half: 1.5 },
};

describe("CSD coaches transferred from vlakosimdb", () => {
  it("are registered as rail coaches with stable ids and their native references", () => {
    expect(CSD_COACHES.map((c) => c.id)).toEqual(["veh-csd-a", "veh-csd-b", "veh-csd-balm", "veh-csd-bam", "veh-csd-bdmtee", "veh-csd-be31", "veh-csd-bi20", "veh-csd-bmo", "veh-csd-dsk"]);
    for (const c of CSD_COACHES) {
      const d = VEHICLES.find((v) => v.id === c.id)!;
      expect(d.catalog).toEqual(COACH_CATALOG);
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "coach" });
      expect(d.references).toBe(c.folder);
    }
  });

  it.each(CSD_COACHES.map((c) => [c.folder] as const))("%s matches the native BMP landmarks within their pixel tolerances", (folder) => {
    const rows = coachComparison(folder);
    expect(rows.length).toBe(readLandmarks(folder).length);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(CSD_COACHES.map((c) => [c.folder] as const))("%s keeps the XML length, axle positions, standard gauge and wheels on the rail", (folder) => {
    const { glb, nodes } = built(folder);
    const s = glbStats(glb);
    const want = MECHANICS[folder]!;
    expect(s.max[0] - s.min[0]).toBeCloseTo(want.length, 3);
    expect(s.max[0] + s.min[0]).toBeCloseTo(0, 3);
    expect(s.min[1]).toBeCloseTo(0, 5);
    // each wheelset's first primitive is its axle
    const axles = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
    const xs = axles.map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b);
    expect(xs).toEqual(want.axles);
    const treads = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-[23]$|\/wheelset(-\d+)?\/sweep-[45]$/.test(n.id) && n.material === "steel" && n.max![1] - n.min![1] > 0.7);
    expect(treads).toHaveLength(2 * want.axles.length);
    for (const t of treads) {
      expect(t.min![1]).toBeCloseTo(0, 5);
      expect(Math.min(Math.abs(t.min![2]), Math.abs(t.max![2]))).toBeCloseTo(0.665, 4);
    }
  });

  it.each(CSD_COACHES.map((c) => [c.folder] as const))("%s keeps the height and width of its XML body section", (folder) => {
    const { nodes } = built(folder);
    const bands = nodes.filter((n) => /^body\/(.+\/)?[a-z]+-band(-\d+)?\//.test(n.id) && n.min);
    expect(bands.length).toBeGreaterThan(0);
    expect(Math.max(...bands.map((n) => n.max![1]))).toBeCloseTo(SECTIONS[folder]!.top, 4);
    expect(Math.max(...bands.map((n) => Math.max(Math.abs(n.min![2]), Math.abs(n.max![2]))))).toBeCloseTo(SECTIONS[folder]!.half, 4);
  });

  it("drops the Bmo's lower deck between the bogies to 0.2 m and keeps its ends at 0.9 m", () => {
    const { tris, nodes } = built("csd-bmo");
    const byMat = (mat: string) => tris.filter((t) => t.material === mat);
    const blue = nodes
      .filter((n) => n.id.startsWith("body/blue-band/"))
      .flatMap((n) => byMat(n.material).slice(n.tri[0], n.tri[0] + n.tri[1]))
      .flatMap((t) => t.p);
    const lowest = (x0: number, x1: number) => Math.min(...blue.filter((p) => p[0] >= x0 && p[0] <= x1).map((p) => p[1]));
    // XML alongz: source x 6.0..20.8 reaches y = 0.2; the blue paint starts at the 0.5 m underframe band
    expect(lowest(-7.5, 7.5)).toBeCloseTo(0.5025, 3);
    expect(lowest(-13.2, -8)).toBeCloseTo(0.9, 4);
    expect(lowest(8, 13.2)).toBeCloseTo(0.9, 4);
  });

  it("rounds the Balm's ends in plan as the XML does", () => {
    const { tris } = built("csd-balm");
    const skin = tris.filter((t) => ["red", "cream"].includes(t.material)).flatMap((t) => t.p);
    const halfAt = (x: number) => Math.max(...skin.filter((p) => Math.abs(p[0] - x) < 1e-4 && p[1] > 0.85 && p[1] < 1.75).map((p) => Math.abs(p[2])));
    // source (0.4, 0.6) (0.5, 1.1) (0.7, 1.4) (1.2, 1.5); the model's x is source - 9.55
    expect(halfAt(-9.15)).toBeCloseTo(0.6, 4);
    expect(halfAt(-9.05)).toBeCloseTo(1.1, 4);
    expect(halfAt(-8.85)).toBeCloseTo(1.4, 4);
    expect(halfAt(-8.35)).toBeCloseTo(1.5, 4);
  });

  // regression: the class numerals were first drawn mirrored on both sides
  it("writes the class numerals to read correctly from outside on both sides", () => {
    const { nodes, tris } = built("csd-a");
    const marking = tris.filter((t) => t.material === "marking");
    for (const side of ["right", "left"]) {
      const marks = nodes.filter((n) => n.id.startsWith(`body/${side}-side/class-marks/`) && n.material === "marking");
      expect(marks).toHaveLength(2);
      for (const n of marks) {
        const ps = marking.slice(n.tri[0], n.tri[0] + n.tri[1]).flatMap((t) => t.p);
        const [y0, y1] = [n.min![1], n.max![1]];
        const at = (a: number, b: number) => {
          const sel = ps.filter((p) => p[1] >= y0 + a * (y1 - y0) && p[1] <= y0 + b * (y1 - y0));
          return sel.reduce((s, p) => s + p[0], 0) / sel.length;
        };
        // the "1"'s flag leans left of its foot bar seen from outside: toward -X
        // on the right (+Z) side, toward +X on the left (-Z) side
        const flag = at(0.7, 0.8);
        const foot = at(0, 0.1);
        if (side === "right") expect(flag).toBeLessThan(foot);
        else expect(flag).toBeGreaterThan(foot);
      }
    }
  });
});
