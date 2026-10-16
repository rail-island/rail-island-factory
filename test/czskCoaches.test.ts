import { describe, it, expect } from "vitest";
import { CZSK_COACHES, CZSK_TRANSFERS } from "../generator/czskCoaches";
import { ALL_TRANSFERS, transferBuild } from "../generator/coachTransfers";
import { COACH_CATALOG, uicCheckDigit } from "../generator/csdCoaches";
import { CD_Y_NUMBERS } from "../generator/cdYCoach";
import { ZSR_NUMBERS } from "../generator/zsrCoach";
import { UIC_Z_NUMBERS } from "../generator/uicZCoach";
import { coachComparison, readLandmarks } from "../generator/csdCoachComparison";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { glbStats } from "../generator/glbStats";
import { paramCombinations } from "../generator/design";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";
import { DESIGNS } from "../generator/generate";

const leaves = (n: TreeNode): LeafNode[] => (isLeaf(n) ? [n] : n.children.flatMap(leaves));
const design = (id: string) => CZSK_COACHES.find((d) => d.id === id)!;
const nodesOf = (id: string, params: Record<string, string>) => {
  const d = design(id);
  return leaves(d.build(params).sourceTree(d.id, d.title).root);
};
const windowCount = (id: string, params: Record<string, string>, side = "right") =>
  new Set(nodesOf(id, params).filter((n) => new RegExp(`^body/${side}-side/window-\\d+/frame/`).test(n.id)).map((n) => n.id.split("/")[2])).size;

// Mechanical dimensions from the vlakosimdb XML (bogie centres corrected to the
// published 17.1 m / 19.0 m, 2.5 m wheelbase), as Factory x of the axles.
const Y_AXLES = [-9.8, -7.3, 7.3, 9.8];
const L264_AXLES = [-10.75, -8.25, 8.25, 10.75];
const MECHANICS: Record<string, { length: number; axles: number[]; top: number }> = {
  cd_bcc: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  cd_beer: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  cd_bnb: { length: 24.5, axles: Y_AXLES, top: 4.0 },
  cd_wrrm: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  zsr_a: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  zsr_ab: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  zsr_b: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  zsr_bh: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  zsr_bds: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  zsr_bdmeer: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  zsr_wrrm: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  zsr_apee: { length: 24.5, axles: Y_AXLES, top: 4.2 },
  cd_ampz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  cd_bmz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  cd_wrrmz: { length: 26.9, axles: [-11.0, -8.5, 8.5, 11.0], top: 4.0 },
};

describe("Czech and Slovak coaches (CD Y, ZSR, UIC-Z)", () => {
  it("are registered as parametric rail coaches with their references and transfers", () => {
    expect(CZSK_COACHES.map((d) => d.id)).toEqual(["veh-cd-y-coach", "veh-zsr-coach", "veh-uic-z-coach"]);
    for (const d of CZSK_COACHES) {
      expect(DESIGNS.get(d.id)).toBe(d);
      expect(VEHICLES.some((v) => v.id === d.id)).toBe(false);
      expect(d.catalog).toEqual(COACH_CATALOG);
      expect(d.references).toBe({ "veh-cd-y-coach": "cd-y-coach", "veh-zsr-coach": "zsr-coach", "veh-uic-z-coach": "uic-z-coach" }[d.id]);
    }
    for (const t of CZSK_TRANSFERS) expect(ALL_TRANSFERS).toContain(t);
    // every value of every design is one transferred vlakosimdb vehicle
    for (const d of CZSK_COACHES)
      expect(CZSK_TRANSFERS.filter((t) => t.id === d.id).map((t) => t.params!.variant).sort()).toEqual(d.params![0]!.values.map((v) => v.value).sort());
  });

  it("keeps the parameter contract and defaults", () => {
    expect(design("veh-cd-y-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "bcc", ["bcc", "beer", "bnb", "wrrm"]]]);
    expect(design("veh-zsr-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "b", ["a", "ab", "b", "bh", "bds", "bdmeer", "wrrm", "apee"]]]);
    expect(design("veh-uic-z-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "secondClass", ["firstClass", "secondClass", "restaurant"]]]);
    for (const d of CZSK_COACHES) expect(() => d.build({ variant: "nope" })).toThrow(/no value "nope"/);
  });

  it.each(CZSK_COACHES.flatMap((d) => paramCombinations(d.params).map((p) => [d.id, p.variant!] as const)))("%s %s builds inside the envelope and budget", (id, variant) => {
    const d = design(id);
    const s = glbStats(d.build({ variant }).toGlb(d.title));
    expect(s.triangles).toBeLessThan(9000);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.max[1]).toBeLessThan(4.7);
    expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
  });

  it.each(CZSK_TRANSFERS.map((t) => [t.key] as const))("%s matches the native BMP landmarks within their pixel tolerances", (key) => {
    const rows = coachComparison(key);
    expect(rows.length).toBe(readLandmarks(key).length);
    expect(rows.length).toBeGreaterThanOrEqual(40);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });

  it.each(CZSK_TRANSFERS.map((t) => [t.key] as const))("%s keeps the XML length, roof height, axle positions and wheels on the rail", (key) => {
    const t = CZSK_TRANSFERS.find((x) => x.key === key)!;
    const mesh = transferBuild(t);
    const glb = mesh.toGlb(t.title);
    const s = glbStats(glb);
    const want = MECHANICS[key]!;
    expect(s.max[0] - s.min[0]).toBeCloseTo(want.length, 3);
    expect(s.max[0] + s.min[0]).toBeCloseTo(0, 3);
    const nodes = leaves(mesh.sourceTree(t.id, t.title).root);
    const bands = nodes.filter((n) => /^body\/[a-z]+-band(-\d+)?\//.test(n.id) && n.min);
    expect(Math.max(...bands.map((n) => n.max![1]))).toBeCloseTo(want.top, 4);
    const axles = nodes.filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id));
    expect(axles.map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 100) / 100).sort((a, b) => a - b)).toEqual(want.axles);
    const { json, bin } = parseGlb(glb);
    expect(Math.min(...collectTriangles(json, bin).flatMap((tr) => tr.p.map((p) => p[1])))).toBeCloseTo(0, 5);
  });

  it("carries valid UIC running numbers on both sides", () => {
    const all = [...Object.values(CD_Y_NUMBERS), ...Object.values(ZSR_NUMBERS), ...Object.values(UIC_Z_NUMBERS.cd)];
    for (const { number } of all) {
      expect(number).toMatch(/^\d{2} \d{2} \d{2}-\d{2} \d{3}-\d$/);
      expect(uicCheckDigit(number), number).toBe(Number(number.slice(-1)));
    }
    // Czech coaches carry 54, Slovak ones 56
    for (const { number } of Object.values(ZSR_NUMBERS)) expect(number.slice(3, 5)).toBe("56");
    for (const { number } of [...Object.values(CD_Y_NUMBERS), ...Object.values(UIC_Z_NUMBERS.cd)]) expect(number.slice(3, 5)).toBe("54");
    for (const t of CZSK_TRANSFERS)
      for (const side of ["right", "left"]) {
        const n = leaves(transferBuild(t).sourceTree(t.id, t.title).root);
        expect(n.some((x) => x.id.startsWith(`body/${side}-side/running-number/`)), `${t.key} ${side}`).toBe(true);
        expect(n.some((x) => x.id.startsWith(`body/${side}-side/emblem/`)), `${t.key} ${side}`).toBe(true);
      }
  });

  it("lays out each variant's windows and doors as its native BMP does", () => {
    // two toilets and ten compartments (Bcc, Beer, ZSR B, Bh); Bnb one toilet and eleven bays
    expect(["bcc", "beer", "bnb", "wrrm"].map((v) => windowCount("veh-cd-y-coach", { variant: v }))).toEqual([12, 12, 12, 10]);
    expect(["a", "ab", "b", "bh", "bds", "bdmeer", "wrrm", "apee"].map((v) => windowCount("veh-zsr-coach", { variant: v }))).toEqual([11, 11, 12, 12, 8, 9, 10, 12]);
    expect(["firstClass", "secondClass", "restaurant"].map((v) => windowCount("veh-uic-z-coach", { variant: v }))).toEqual([13, 13, 9]);
    // the dining cars have a passenger door at one end only, and barred kitchen windows
    const doors = (id: string, variant: string) => new Set(nodesOf(id, { variant }).filter((n) => /^body\/right-side\/door-\d+\//.test(n.id)).map((n) => n.id.split("/")[2])).size;
    expect([doors("veh-cd-y-coach", "wrrm"), doors("veh-zsr-coach", "wrrm"), doors("veh-uic-z-coach", "restaurant"), doors("veh-uic-z-coach", "firstClass")]).toEqual([1, 1, 1, 2]);
    expect(nodesOf("veh-cd-y-coach", { variant: "wrrm" }).some((n) => n.id.startsWith("body/right-side/window-1/bars/"))).toBe(true);
    // only the BDs has the guard's lookout bay; only the UIC-Z coaches a skirt
    expect(nodesOf("veh-zsr-coach", { variant: "bds" }).some((n) => n.id.startsWith("body/lookout-bay/"))).toBe(true);
    expect(nodesOf("veh-zsr-coach", { variant: "b" }).some((n) => n.id.startsWith("body/lookout-bay/"))).toBe(false);
    expect(nodesOf("veh-uic-z-coach", { variant: "secondClass" }).some((n) => n.id.startsWith("skirt/"))).toBe(true);
  });

  it("paints the liveries: first class lines, ZSR stripes, the WRRm diagonals", () => {
    const mats = (id: string, variant: string) => new Set(nodesOf(id, { variant }).filter((n) => n.id.includes("/paint/")).map((n) => n.material));
    expect(mats("veh-zsr-coach", "a").has("yellow")).toBe(true);
    expect(mats("veh-zsr-coach", "b").has("yellow")).toBe(false);
    expect(mats("veh-zsr-coach", "b")).toEqual(new Set(["white", "pink", "darkRed"]));
    expect(mats("veh-uic-z-coach", "firstClass").has("yellow")).toBe(true);
    expect(mats("veh-uic-z-coach", "secondClass").has("yellow")).toBe(false);
    expect(mats("veh-cd-y-coach", "wrrm")).toEqual(new Set(["red"]));
    expect(mats("veh-cd-y-coach", "beer")).toEqual(new Set(["navy", "red"]));
  });

  // the blue and white CD Bee 001 is a value of the green and white design: the
  // Bee's layout with its green in blue, and the Bee itself unchanged
  it("builds vlakosimdb's CD Bee 001 as the green and white design's beeBlue", () => {
    const d = VEHICLES.find((v) => v.id === "veh-cd-green-white-coach")!;
    const tree = (variant: string) => leaves(d.build({ variant }).sourceTree(d.id, d.title).root);
    const ids = (variant: string) => tree(variant).filter((n) => !n.id.includes("running-number")).map((n) => `${n.id}:${n.tri[1]}`);
    expect(ids("beeBlue")).toEqual(ids("bee"));
    const colour = (variant: string) => d.build({ variant }).sourceTree(d.id, d.title);
    const green = (variant: string) => { const t = colour(variant); return t.colors[t.materials.indexOf("green")]; };
    expect(green("bee")).toBe("#0d7a1a");
    expect(green("beeBlue")).toBe("#3c44e6");
  });
});
