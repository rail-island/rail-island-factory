import { describe, it, expect } from "vitest";
import { CSD_COACHES, COACH_CATALOG, RUNNING_NUMBERS, uicCheckDigit } from "../generator/csdCoaches";
import { CD_COACHES, COACH_TRANSFERS, transferBuild } from "../generator/coachTransfers";
import { BMO_NUMBERS } from "../generator/bmoCoach";
import { GREEN_WHITE_NUMBERS } from "../generator/cdGreenWhiteCoach";
import { canStroke } from "../generator/strokeFont";
import { emblem } from "../generator/cd163";
import { coachComparison, readLandmarks, transfer } from "../generator/csdCoachComparison";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";

/** Mean u (0..1 across) of the points in the upper fifth of an emblem's height. */
function upperMean(ps: Array<[number, number]>): number {
  const [lo, hi] = [Math.min(...ps.map((p) => p[1])), Math.max(...ps.map((p) => p[1]))];
  const top = ps.filter((p) => p[1] > hi - 0.2 * (hi - lo));
  return top.reduce((a, p) => a + p[0], 0) / top.length;
}
const EMBLEM_UPPER = (() => {
  const ps = emblem(0, 0, 1, false);
  const [u0, u1] = [Math.min(...ps.map((p) => p[0])), Math.max(...ps.map((p) => p[0]))];
  return upperMean(ps.map(([u, v]): [number, number] => [(u - u0) / (u1 - u0), v]));
})();

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));

function built(key: string) {
  const coach = transfer(key);
  const mesh = transferBuild(coach);
  const tree = mesh.sourceTree(coach.id, coach.title);
  const glb = mesh.toGlb(coach.title);
  const { json, bin } = parseGlb(glb);
  return { coach, glb, nodes: leaves(tree.root), tris: collectTriangles(json, bin) };
}

// Mechanical dimensions from the vlakosimdb XML: length over the buffer heads,
// and the axle centres (Factory x, the model centred between the buffer heads).
const MECHANICS: Record<string, { length: number; axles: number[] }> = {
  "csd_a": { length: 24.5, axles: [-9.8, -7.3, 7.3, 9.8] },
  "csd_b": { length: 24.5, axles: [-9.8, -7.3, 7.3, 9.8] },
  "csd_balm": { length: 19.1, axles: [-7.4, -5.3, 5.3, 7.4] },
  "csd_bam": { length: 22.2, axles: [-8.8, -6.0, 6.0, 8.8] },
  "csd_bdmtee": { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75] },
  "csd_be31": { length: 15.5, axles: [-4.7, 4.7] },
  "csd_bi20": { length: 12.6, axles: [-3.9, 4.0] },
  "csd_bmo": { length: 26.8, axles: [-11.15, -8.65, 8.65, 11.15] },
  "cd_bmo_1": { length: 26.8, axles: [-11.15, -8.65, 8.65, 11.15] },
  "cd_bmo_2": { length: 26.8, axles: [-11.15, -8.65, 8.65, 11.15] },
  "cd_bmo_3": { length: 26.8, axles: [-11.15, -8.65, 8.65, 11.15] },
  "csd_dsk": { length: 10.5, axles: [-3.35, 2.85] },
  ...Object.fromEntries(["a", "ab", "b", "bee", "beel", "bds", "ds", "bee001"].map((v) => [`cd_${v}`, { length: 24.5, axles: [-9.8, -7.3, 7.3, 9.8] }])),
  "cd_bdmeer": { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75] },
  "cd_bdmtee": { length: 26.4, axles: [-10.75, -8.25, 8.25, 10.75] },
};

// Body height and half width of the XML alongx sections (roofs included).
const SECTIONS: Record<string, { top: number; half: number }> = {
  "csd_a": { top: 4.2, half: 1.5 },
  "csd_b": { top: 4.2, half: 1.5 },
  "csd_balm": { top: 3.7, half: 1.5 },
  "csd_bam": { top: 3.8, half: 1.5 },
  "csd_bdmtee": { top: 4.0, half: 1.5 },
  "csd_be31": { top: 3.8, half: 1.5 },
  "csd_bi20": { top: 3.8, half: 1.5 },
  "csd_bmo": { top: 4.6, half: 1.5 },
  "cd_bmo_1": { top: 4.6, half: 1.5 },
  "cd_bmo_2": { top: 4.6, half: 1.5 },
  "cd_bmo_3": { top: 4.6, half: 1.5 },
  "csd_dsk": { top: 3.8, half: 1.5 },
  ...Object.fromEntries(["a", "ab", "b", "bee", "beel", "bds", "ds", "bee001"].map((v) => [`cd_${v}`, { top: 4.2, half: 1.5 }])),
  // the guard's lookout bay, 1.525 m (the XML's 1.6 m kept inside the 3.1 m envelope)
  "cd_bds": { top: 4.2, half: 1.525 },
  "cd_ds": { top: 4.2, half: 1.525 },
  "cd_bdmeer": { top: 4.0, half: 1.5 },
  "cd_bdmtee": { top: 4.0, half: 1.5 },
};

describe("CSD coaches transferred from vlakosimdb", () => {
  it("are registered as rail coaches with stable ids and their native references", () => {
    expect(CSD_COACHES.map((c) => c.id)).toEqual(["veh-csd-classic-green-coach", "veh-csd-balm", "veh-csd-bam", "veh-csd-bdmtee", "veh-csd-be31", "veh-csd-bi20", "veh-csd-dsk"]);
    expect(CD_COACHES.map((c) => c.id)).toEqual(["veh-bmo-double-deck-coach", "veh-cd-green-white-coach"]);
    for (const c of [...CSD_COACHES, ...CD_COACHES]) {
      const d = VEHICLES.find((v) => v.id === c.id)!;
      expect(d.catalog).toEqual(COACH_CATALOG);
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "coach" });
      expect(d.references).toBe(c.folder);
    }
  });

  it.each(COACH_TRANSFERS.map((c) => [c.key] as const))("%s matches the native BMP landmarks within their pixel tolerances", (folder) => {
    const rows = coachComparison(folder);
    expect(rows.length).toBe(readLandmarks(folder).length);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(COACH_TRANSFERS.map((c) => [c.key] as const))("%s keeps the XML length, axle positions, standard gauge and wheels on the rail", (folder) => {
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

  it.each(COACH_TRANSFERS.map((c) => [c.key] as const))("%s keeps the height and width of its XML body section", (folder) => {
    const { nodes } = built(folder);
    const bands = nodes.filter((n) => /^body\/(.+\/)?[a-z]+-band(-\d+)?\//.test(n.id) && n.min);
    expect(bands.length).toBeGreaterThan(0);
    expect(Math.max(...bands.map((n) => n.max![1]))).toBeCloseTo(SECTIONS[folder]!.top, 4);
    expect(Math.max(...bands.map((n) => Math.max(Math.abs(n.min![2]), Math.abs(n.max![2]))))).toBeCloseTo(SECTIONS[folder]!.half, 4);
  });

  it("drops the Bmo's lower deck between the bogies to 0.2 m and keeps its ends at 0.9 m", () => {
    const { tris, nodes } = built("csd_bmo");
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
    const { tris } = built("csd_balm");
    const skin = tris.filter((t) => ["red", "cream"].includes(t.material)).flatMap((t) => t.p);
    const halfAt = (x: number) => Math.max(...skin.filter((p) => Math.abs(p[0] - x) < 1e-4 && p[1] > 0.85 && p[1] < 1.75).map((p) => Math.abs(p[2])));
    // source (0.4, 0.6) (0.5, 1.1) (0.7, 1.4) (1.2, 1.5); the model's x is source - 9.55
    expect(halfAt(-9.15)).toBeCloseTo(0.6, 4);
    expect(halfAt(-9.05)).toBeCloseTo(1.1, 4);
    expect(halfAt(-8.85)).toBeCloseTo(1.4, 4);
    expect(halfAt(-8.35)).toBeCloseTo(1.5, 4);
  });

  it("builds CSD A and CSD B as the two variants of the classic green coach", () => {
    const d = VEHICLES.find((v) => v.id === "veh-csd-classic-green-coach")!;
    expect(d.params).toEqual([expect.objectContaining({ name: "variant", default: "classA", values: [expect.objectContaining({ value: "classA" }), expect.objectContaining({ value: "classB" })] })]);
    const windows = (variant: string) =>
      leaves(d.build({ variant }).sourceTree(d.id, d.title).root).filter((n) => /^body\/right-side\/window-\d+\/frame\//.test(n.id)).map((n) => n.id.split("/")[2]);
    // two toilets plus nine 1st class or ten 2nd class compartments
    expect(new Set(windows("classA")).size).toBe(11);
    expect(new Set(windows("classB")).size).toBe(12);
    expect(new Set(windows("classA")).size).toBe(new Set(leaves(d.build().sourceTree(d.id, d.title).root).filter((n) => /^body\/right-side\/window-\d+\/frame\//.test(n.id)).map((n) => n.id.split("/")[2])).size);
    expect(() => d.build({ variant: "classC" })).toThrow(/no value "classC"/);
  });

  // regression: the class numerals were first drawn mirrored on both sides
  it("writes the class numerals to read correctly from outside on both sides", () => {
    const { nodes, tris } = built("csd_a");
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

  it("carry running numbers: valid UIC check digits, or the older national format", () => {
    expect(uicCheckDigit("163 244")).toBe(7); // the scheme the locomotives use too
    for (const [key, { number }] of [...Object.entries(RUNNING_NUMBERS), ...Object.entries(BMO_NUMBERS), ...Object.entries(GREEN_WHITE_NUMBERS)]) {
      expect(canStroke(number), key).toBe(true);
      if (/^\d{2} \d{2} \d{2}-\d{2} \d{3}-\d$/.test(number)) expect(uicCheckDigit(number), `${key} ${number}`).toBe(Number(number.slice(-1)));
      else expect(number, key).toMatch(/^[A-Z][a-z]+ (\d-)?\d{4}$/);
    }
  });

  it.each(COACH_TRANSFERS.filter((c) => c.key.startsWith("csd_")).map((c) => [c.key] as const))("%s paints CSD and its running number on both sides, readable from outside", (key) => {
    const { nodes, tris } = built(key);
    const marking = tris.filter((t) => t.material === "marking");
    for (const side of ["right", "left"]) {
      const plates = nodes.filter((n) => n.id.startsWith(`body/${side}-side/running-number/`) && n.material === "marking");
      expect(plates, side).toHaveLength(2); // "CSD" (C with a caron) and the number
      const csd = plates.reduce((a, b) => (a.max![1] > b.max![1] ? a : b));
      const ps = marking.slice(csd.tri[0], csd.tri[0] + csd.tri[1]).flatMap((t) => t.p);
      const top = Math.max(...ps.map((p) => p[1]));
      // the caron of the leading "C" with a caron is the highest stroke: left of the line's
      // middle as seen from outside, toward -X on the right side, +X on the left
      const caron = ps.filter((p) => p[1] > top - 0.02).reduce((a, p) => a + p[0], 0) / ps.filter((p) => p[1] > top - 0.02).length;
      const middle = (csd.min![0] + csd.max![0]) / 2;
      if (side === "right") expect(caron).toBeLessThan(middle);
      else expect(caron).toBeGreaterThan(middle);
    }
  });

  // regression: the Balm and Bam door leaves were first a single colour; the
  // native BMPs and the photographs show them in the body's cream and red bands
  it("paints the Balm and Bam door leaves in the body's bands", () => {
    for (const key of ["csd_balm", "csd_bam"]) {
      const { nodes } = built(key);
      const leaf = nodes.filter((n) => n.id.startsWith("body/right-side/door-1/leaf/"));
      const mats = new Set(leaf.map((n) => n.material));
      expect(mats.has("cream") && mats.has("red")).toBe(true); // the Balm's grey moulding as well
    }
  });

  it.each(COACH_TRANSFERS.filter((c) => c.key.startsWith("cd_")).map((c) => [c.key] as const))("%s carries the CD emblem and its running number on both sides, readable from outside", (key) => {
    const { coach, nodes, tris } = built(key);
    // the green and white coaches' black emblem is "marking", the Bmo's white one "emblem"
    const mark = (m: string) => m === "marking" || m === "emblem";
    const marking = tris.filter((t) => t.material === (key.startsWith("cd_bmo") ? "emblem" : "marking"));
    const numbers = { ...GREEN_WHITE_NUMBERS, cdBlue: BMO_NUMBERS.cdBlue, cdBlueGrey: BMO_NUMBERS.cdBlueGrey, cdRedDoors: BMO_NUMBERS.cdRedDoors };
    const params = coach.params as Record<string, keyof typeof numbers>;
    expect(numbers[params.variant ?? params.livery!]).toBeDefined();
    for (const side of ["right", "left"]) {
      expect(nodes.filter((n) => n.id.startsWith(`body/${side}-side/running-number/`)).length, side).toBeGreaterThan(0);
      const emblems = nodes.filter((n) => n.id.startsWith(`body/${side}-side/emblem/`) && mark(n.material));
      expect(emblems.length, side).toBeGreaterThan(0);
      for (const n of emblems) {
        const ps = marking.slice(n.tri[0], n.tri[0] + n.tri[1]).flatMap((t) => t.p);
        // one emblem per facets call (the Bmo carries one on each end section): the
        // upper fifth's mean position across the emblem, as seen from outside,
        // matches the unmirrored emblem's and not its mirror image
        const [x0, x1] = [n.min![0], n.max![0]];
        const seen = ps.map((p): [number, number] => [side === "right" ? (p[0] - x0) / (x1 - x0) : (x1 - p[0]) / (x1 - x0), p[1]]);
        const at = upperMean(seen);
        expect(Math.abs(at - EMBLEM_UPPER), side).toBeLessThan(Math.abs(at - (1 - EMBLEM_UPPER)));
      }
    }
  });

  it("builds the ten CD green and white coaches (the blue Bee 001 among them) as the variants of one design", () => {
    const d = VEHICLES.find((v) => v.id === "veh-cd-green-white-coach")!;
    expect(d.params![0]!.values.map((v) => v.value)).toEqual(["a", "ab", "b", "bee", "beel", "bds", "ds", "bdmeer", "bdmtee", "beeBlue"]);
    const count = (variant: string) =>
      new Set(leaves(d.build({ variant }).sourceTree(d.id, d.title).root).filter((n) => /^body\/right-side\/window-\d+\/frame\//.test(n.id)).map((n) => n.id.split("/")[2])).size;
    // two toilets plus nine compartments (A, AB), ten (B, Bee, Beel); Bdmtee's fourteen
    expect([count("a"), count("ab"), count("b"), count("bee"), count("beel"), count("bdmtee")]).toEqual([11, 11, 12, 12, 12, 14]);
    // the guard's lookout bay of BDs and Ds only
    const bay = (variant: string) => leaves(d.build({ variant }).sourceTree(d.id, d.title).root).some((n) => n.id.startsWith("body/lookout-bay/"));
    expect(["a", "bds", "ds"].map(bay)).toEqual([false, true, true]);
    expect(() => d.build({ variant: "bx" })).toThrow(/no value "bx"/);
  });

  it("paints the Bmo in its four liveries on one body", () => {
    const d = VEHICLES.find((v) => v.id === "veh-bmo-double-deck-coach")!;
    expect(d.params![0]!.values.map((v) => v.value)).toEqual(["csd", "cdBlue", "cdBlueGrey", "cdRedDoors"]);
    const mats = (livery: string) => new Set(leaves(d.build({ livery }).sourceTree(d.id, d.title).root).map((n) => n.material));
    expect(mats("csd").has("yellow")).toBe(true);
    expect(mats("cdBlue").has("doorGrey")).toBe(true);
    expect(mats("cdBlueGrey").has("grey") && !mats("cdBlueGrey").has("red")).toBe(true);
    expect(mats("cdRedDoors").has("red")).toBe(true);
    // one body: every livery's band sweeps share the XML outline
    const bounds = (livery: string) => {
      const ns = leaves(d.build({ livery }).sourceTree(d.id, d.title).root).filter((n) => /-band(-\d+)?\//.test(n.id) && n.min);
      return [Math.min(...ns.map((n) => n.min![0])), Math.max(...ns.map((n) => n.max![0])), Math.max(...ns.map((n) => n.max![1]))].map((x) => Math.round(x * 1000) / 1000);
    };
    for (const l of ["cdBlue", "cdBlueGrey", "cdRedDoors"]) expect(bounds(l)).toEqual(bounds("csd"));
  });

  // regression: the white 3 by 5 pixel marks beside the toilets were first drawn
  // as blank plates; they are the class numerals, "1" on the A and "2" on the others
  it("draws the green and white coaches' class marks as white numerals, not blank plates", () => {
    const d = VEHICLES.find((v) => v.id === "veh-cd-green-white-coach")!;
    for (const variant of ["a", "b", "bee", "beel", "bds", "bdmeer", "bdmtee"]) {
      const mesh = d.build({ variant });
      const nodes = leaves(mesh.sourceTree(d.id, d.title).root);
      expect(nodes.some((n) => n.material === "sign"), variant).toBe(false);
      const { json, bin } = parseGlb(mesh.toGlb(d.title));
      const tris = collectTriangles(json, bin).filter((t) => t.material === "classMark");
      for (const side of ["right", "left"]) {
        const marks = nodes.filter((n) => n.id.startsWith(`body/${side}-side/class-marks/`) && n.material === "classMark");
        expect(marks.length, `${variant} ${side}`).toBeGreaterThan(0);
        for (const n of marks) {
          const ps = tris.slice(n.tri[0], n.tri[0] + n.tri[1]).flatMap((t) => t.p);
          const [y0, y1] = [n.min![1], n.max![1]];
          const at = (a: number, b: number) => {
            const sel = ps.filter((p) => p[1] >= y0 + a * (y1 - y0) && p[1] <= y0 + b * (y1 - y0));
            return sel.reduce((s, p) => s + p[0], 0) / sel.length;
          };
          // the A's "1" reads from outside: its flag leans left of its foot, toward
          // -X on the right side and +X on the left
          const [flag, foot] = [at(0.7, 0.8), at(0, 0.1)];
          if (variant === "a") {
            if (side === "right") expect(flag).toBeLessThan(foot);
            else expect(flag).toBeGreaterThan(foot);
          }
        }
      }
    }
  });
});
