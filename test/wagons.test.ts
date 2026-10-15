import { describe, it, expect } from "vitest";
import { EAS_PARAMS, NAS_PARAMS, UA_PARAMS, WAGON_CATALOG, WAGON_DESIGNS, WAGON_NUMBERS } from "../generator/wagons";
import { WAGON_TRANSFERS } from "../generator/wagonTransfers";
import { transferBuild } from "../generator/coachTransfers";
import { uicCheckDigit } from "../generator/csdCoaches";
import { canStroke } from "../generator/strokeFont";
import { coachComparison, readLandmarks, transfer } from "../generator/csdCoachComparison";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));

function built(key: string) {
  const t = transfer(key);
  const mesh = transferBuild(t);
  const glb = mesh.toGlb(t.title);
  const { json, bin } = parseGlb(glb);
  return { glb, nodes: leaves(mesh.sourceTree(t.id, t.title).root), tris: collectTriangles(json, bin) };
}

// Length over the buffer heads and the axle centres (Factory x) of each vlakosimdb
// wagon: the XML bumpers and the wheel contact points of its geometry.
const MECHANICS: Record<string, { length: number; axles: number[] }> = {
  nas: { length: 20.9, axles: [-8.8, -6.8, 6.9, 8.9] },
  ua: { length: 13.5, axles: [-5.4, -3.6, 3.6, 5.4] },
  eas: { length: 13.9, axles: [-5.6, -3.6, 3.5, 5.5] },
  raj: { length: 14.4, axles: [-4.65, -2.75, 3.45, 5.35] },
  rah: { length: 12.6, axles: [-4.65, -2.7, 2.3, 4.2] },
};
const family = (key: string) => key.split(/[-_]/)[1]!;

// The top of each load: the XML inline placements and `load` hulls (Nas, Ua) and the
// painted load above the Eas rim; the model may stay a little under the hull.
const LOAD_TOP: Record<string, [number, number]> = {
  "n_nas-full_1": [2.95, 3.1],
  "n_nas-full_2": [2.85, 2.9],
  "n_nas-full_3": [3.2, 3.21],
  n_ua_1: [3.55, 3.6],
  n_ua_2: [3.6, 3.65],
  n_ua_3: [3.65, 3.7],
  "n_eas-drevo": [3.7, 3.9],
  "n_eas-uhlo": [3.45, 3.5],
};

describe("freight wagons transferred from vlakosimdb", () => {
  it("are registered as rail wagons with stable ids, their references and a cargo parameter", () => {
    expect(WAGON_DESIGNS.map((w) => w.id)).toEqual(["veh-nas-flat-wagon", "veh-ua-open-wagon", "veh-eas-open-wagon", "veh-raj-hopper-wagon", "veh-rah-tank-wagon"]);
    for (const w of WAGON_DESIGNS) {
      const d = VEHICLES.find((v) => v.id === w.id)!;
      expect(d.catalog).toEqual(WAGON_CATALOG);
      expect(d.catalog).toMatchObject({ category: "Rail vehicles", group: "wagon" });
      expect(d.references).toBe(w.folder);
    }
    const values = (specs: typeof NAS_PARAMS) => specs[0]!.values.map((v) => v.value);
    expect(values(NAS_PARAMS)).toEqual(["empty", "wood", "tubes", "reels"]);
    expect(values(UA_PARAMS)).toEqual(["empty", "coal", "wood", "sand"]);
    expect(values(EAS_PARAMS)).toEqual(["empty", "wood", "coal"]);
    for (const specs of [NAS_PARAMS, UA_PARAMS, EAS_PARAMS]) expect(specs).toEqual([expect.objectContaining({ name: "cargo", default: "empty" })]);
    // every cargo of every parametric wagon is one transferred vlakosimdb vehicle
    for (const w of WAGON_DESIGNS.filter((d) => d.params))
      expect(WAGON_TRANSFERS.filter((t) => t.id === w.id).map((t) => t.params!.cargo)).toEqual(w.params![0]!.values.map((v) => v.value));
  });

  it.each(WAGON_TRANSFERS.map((t) => [t.key] as const))("%s matches the native BMP landmarks within their pixel tolerances", (key) => {
    const rows = coachComparison(key);
    expect(rows.length).toBe(readLandmarks(key).length);
    expect(rows.length).toBeGreaterThanOrEqual(18);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(WAGON_TRANSFERS.map((t) => [t.key] as const))("%s keeps the XML length, axle positions, standard gauge and wheels on the rail", (key) => {
    const { glb, nodes } = built(key);
    const s = glbStats(glb);
    const want = MECHANICS[family(key)]!;
    expect(s.max[0] - s.min[0]).toBeCloseTo(want.length, 3);
    expect(s.max[0] + s.min[0]).toBeCloseTo(0, 3);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
    // each wheelset's first primitive is its axle
    const axles = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
    const xs = axles.map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b);
    expect(xs).toEqual(want.axles);
    const treads = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-[2-5]$/.test(n.id) && n.material === "steel" && n.max![1] - n.min![1] > 0.7);
    expect(treads).toHaveLength(2 * want.axles.length);
    for (const t of treads) {
      expect(t.min![1]).toBeCloseTo(0, 5);
      expect(Math.min(Math.abs(t.min![2]), Math.abs(t.max![2]))).toBeCloseTo(0.665, 4);
      expect(t.max![1] - t.min![1]).toBeCloseTo(2 * 0.46 * Math.cos(Math.PI / 24), 3); // the 920 mm freight wheel, a 24-gon flat at top and bottom
    }
  });

  it.each(WAGON_TRANSFERS.map((t) => [t.key] as const))("%s carries exactly its own load", (key) => {
    const { nodes } = built(key);
    const cargo = nodes.filter((n) => n.id.startsWith("cargo/"));
    const top = LOAD_TOP[key];
    if (!top) {
      expect(cargo).toEqual([]);
      return;
    }
    expect(cargo.length).toBeGreaterThan(0);
    const high = Math.max(...cargo.map((n) => n.max![1]));
    expect(high).toBeGreaterThanOrEqual(top[0]);
    expect(high).toBeLessThanOrEqual(top[1] + 1e-6);
  });

  it("builds the empty wagon by default and refuses a cargo it does not carry", () => {
    for (const [id, missing] of [["veh-nas-flat-wagon", "coal"], ["veh-ua-open-wagon", "reels"], ["veh-eas-open-wagon", "sand"]] as const) {
      const d = WAGON_DESIGNS.find((w) => w.id === id)!;
      expect(Buffer.from(d.build().toGlb(id)).equals(Buffer.from(d.build({ cargo: "empty" }).toGlb(id)))).toBe(true);
      expect(() => d.build({ cargo: missing })).toThrow(/no value/);
    }
  });

  it("carry valid UIC running numbers the stroke font can paint", () => {
    for (const [key, { number }] of Object.entries(WAGON_NUMBERS)) {
      expect(number, key).toMatch(/^\d{2} \d{2} \d{4} \d{3}-\d$/);
      expect(uicCheckDigit(number), `${key} ${number}`).toBe(Number(number.slice(-1)));
      expect(canStroke(number), key).toBe(true);
    }
    expect(canStroke("ČPAVEX") && canStroke("21 RIV") && canStroke("54 ČD")).toBe(true);
  });

  it("paints the running number on both sides of every wagon", () => {
    for (const key of ["n_nas", "n_ua-empty", "n_eas"]) {
      const { nodes } = built(key);
      for (const side of ["right", "left"]) expect(nodes.filter((n) => n.id.startsWith(`body/${side}-side/running-number/`)).length, `${key} ${side}`).toBeGreaterThan(0);
    }
    const sides = (key: string, re: RegExp) => new Set(built(key).nodes.filter((n) => re.test(n.id)).map((n) => n.id.split("-")[0]));
    expect(sides("n_raj", /^(right|left)-side-number\//)).toEqual(new Set(["right", "left"]));
    expect(sides("n_rah_1", /^(right|left)-side-boards\/running-number\//)).toEqual(new Set(["right", "left"]));
  });

  it("reads the Rah's CPAVEX (C with a caron) from outside on both sides, laid on the tank shell", () => {
    const { nodes, tris } = built("n_rah_1");
    const ink = tris.filter((t) => t.material === "ink");
    const lettering = nodes.filter((n) => n.id.startsWith("tank/lettering/") && n.material === "ink");
    expect(lettering).toHaveLength(2);
    for (const n of lettering) {
      const ps = ink.slice(n.tri[0], n.tri[0] + n.tri[1]).flatMap((t) => t.p);
      const right = n.min![2] > 0;
      // within 1 cm of the 16-sided shell (radius 0.95 m about y = 2.45 m), never inside it
      for (const p of ps) {
        const r = Math.hypot(p[1] - 2.45, p[2]);
        expect(r).toBeGreaterThan(0.95 * Math.cos(Math.PI / 16));
        expect(r).toBeLessThan(0.95 + 0.01);
      }
      // the caron tops the leading C: left of the word's middle as seen from outside
      const top = Math.max(...ps.map((p) => p[1]));
      const caron = ps.filter((p) => p[1] > top - 0.02);
      const at = caron.reduce((a, p) => a + p[0], 0) / caron.length;
      const middle = (n.min![0] + n.max![0]) / 2;
      if (right) expect(at).toBeLessThan(middle);
      else expect(at).toBeGreaterThan(middle);
    }
  });

  it("keeps the Raj's four hoppers on the XML rotation profile and under the 4.7 m envelope", () => {
    const { nodes } = built("n_raj");
    for (const [i, xc] of [3.0, 6.0, 8.9, 11.9].entries()) {
      const shell = nodes.filter((n) => n.id.startsWith(`hoppers/hopper-${i + 1}/shell/`));
      const [x0, x1] = [Math.min(...shell.map((n) => n.min![0])), Math.max(...shell.map((n) => n.max![0]))];
      // a 10-gon of radius 1.4 m, flat across x: 1.4 * cos(18 deg) either side of its axis
      expect((x0 + x1) / 2 + 7.2).toBeCloseTo(xc, 3);
      expect((x1 - x0) / 2).toBeCloseTo(1.4 * Math.cos(Math.PI / 10), 2);
      expect(Math.min(...shell.map((n) => n.min![1]))).toBeCloseTo(2.0, 5);
      expect(Math.max(...shell.map((n) => n.max![1]))).toBeCloseTo(4.5, 5);
    }
    expect(Math.max(...nodes.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
  });
});
