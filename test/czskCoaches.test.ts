import { proceduralId } from "../generator/modelId.ts";
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
import { createHash } from "node:crypto";
import { paramCombinations, resolveParams } from "../generator/design";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";
import { DESIGNS } from "../generator/generate";
import { sample } from "./catalogCache";

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
  db_ic_ampz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  db_ic_bmpz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  db_ic_wrmz: { length: 26.9, axles: [-11.0, -8.5, 8.5, 11.0], top: 4.0 },
  obb_ampz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  obb_bmpz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
  obb_wrmz: { length: 26.4, axles: L264_AXLES, top: 4.0 },
};

describe("Czech and Slovak coaches (CD Y, ZSR, UIC-Z)", () => {
  it("are registered as parametric rail coaches with their references and transfers", () => {
    expect(CZSK_COACHES.map((d) => d.id)).toEqual(["proc-vehicle-cd-y-coach", "proc-vehicle-zsr-coach", "proc-vehicle-uic-z-coach"]);
    for (const d of CZSK_COACHES) {
      expect(DESIGNS.get(proceduralId(d.id))).toBe(d);
      expect(VEHICLES.some((v) => v.id === d.id)).toBe(false);
      expect(d.catalog).toEqual(COACH_CATALOG);
      expect(d.references).toBe({ "proc-vehicle-cd-y-coach": "cd-y-coach", "proc-vehicle-zsr-coach": "zsr-coach", "proc-vehicle-uic-z-coach": "uic-z-coach" }[d.id]);
    }
    for (const t of CZSK_TRANSFERS) expect(ALL_TRANSFERS).toContain(t);
    // every parameter combination of every design is one transferred vlakosimdb vehicle
    const key = (p: Record<string, string>) => JSON.stringify(Object.entries(p).sort());
    for (const d of CZSK_COACHES)
      expect(CZSK_TRANSFERS.filter((t) => t.id === d.id).map((t) => key(resolveParams(d.params!, t.params))).sort()).toEqual(paramCombinations(d.params).map(key).sort());
  });

  it("keeps the parameter contract and defaults", () => {
    expect(design("proc-vehicle-cd-y-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "bcc", ["bcc", "beer", "bnb", "wrrm"]]]);
    expect(design("proc-vehicle-zsr-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([["variant", "b", ["a", "ab", "b", "bh", "bds", "bdmeer", "wrrm", "apee"]]]);
    expect(design("proc-vehicle-uic-z-coach").params!.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["variant", "secondClass", ["firstClass", "secondClass", "restaurant"]],
      ["operator", "cd", ["cd", "db", "obb"]],
    ]);
    for (const d of CZSK_COACHES) expect(() => d.build({ variant: "nope" })).toThrow(/no value "nope"/);
  });

  it.each(CZSK_COACHES.flatMap((d) => sample(paramCombinations(d.params)).map((p) => [d.id, JSON.stringify(p)] as const)))("%s %s builds inside the envelope and budget", (id, params) => {
    const d = design(id);
    const s = glbStats(d.build(JSON.parse(params) as Record<string, string>).toGlb(d.title));
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
    const all = [...Object.values(CD_Y_NUMBERS), ...Object.values(ZSR_NUMBERS), ...Object.values(UIC_Z_NUMBERS).flatMap((o) => Object.values(o))];
    for (const { number } of all) {
      expect(number).toMatch(/^\d{2} \d{2} \d{2}-\d{2} \d{3}-\d$/);
      expect(uicCheckDigit(number), number).toBe(Number(number.slice(-1)));
    }
    // Czech coaches carry 54, Slovak ones 56
    for (const { number } of Object.values(ZSR_NUMBERS)) expect(number.slice(3, 5)).toBe("56");
    for (const { number } of [...Object.values(CD_Y_NUMBERS), ...Object.values(UIC_Z_NUMBERS.cd)]) expect(number.slice(3, 5)).toBe("54");
    // German coaches 80, Austrian ones 81
    for (const { number } of Object.values(UIC_Z_NUMBERS.db)) expect(number.slice(3, 5)).toBe("80");
    for (const { number } of Object.values(UIC_Z_NUMBERS.obb)) expect(number.slice(3, 5)).toBe("81");
    for (const t of CZSK_TRANSFERS)
      for (const side of ["right", "left"]) {
        const n = leaves(transferBuild(t).sourceTree(t.id, t.title).root);
        expect(n.some((x) => x.id.startsWith(`body/${side}-side/running-number/`)), `${t.key} ${side}`).toBe(true);
        expect(n.some((x) => x.id.startsWith(`body/${side}-side/emblem/`)), `${t.key} ${side}`).toBe(true);
      }
  });

  it("lays out each variant's windows and doors as its native BMP does", () => {
    // two toilets and ten compartments (Bcc, Beer, ZSR B, Bh); Bnb one toilet and eleven bays
    expect(["bcc", "beer", "bnb", "wrrm"].map((v) => windowCount("proc-vehicle-cd-y-coach", { variant: v }))).toEqual([12, 12, 12, 10]);
    expect(["a", "ab", "b", "bh", "bds", "bdmeer", "wrrm", "apee"].map((v) => windowCount("proc-vehicle-zsr-coach", { variant: v }))).toEqual([11, 11, 12, 12, 8, 9, 10, 12]);
    expect(["firstClass", "secondClass", "restaurant"].map((v) => windowCount("proc-vehicle-uic-z-coach", { variant: v }))).toEqual([13, 13, 9]);
    // the dining cars have a passenger door at one end only, and barred kitchen windows
    const doors = (id: string, variant: string) => new Set(nodesOf(id, { variant }).filter((n) => /^body\/right-side\/door-\d+\//.test(n.id)).map((n) => n.id.split("/")[2])).size;
    expect([doors("proc-vehicle-cd-y-coach", "wrrm"), doors("proc-vehicle-zsr-coach", "wrrm"), doors("proc-vehicle-uic-z-coach", "restaurant"), doors("proc-vehicle-uic-z-coach", "firstClass")]).toEqual([1, 1, 1, 2]);
    expect(nodesOf("proc-vehicle-cd-y-coach", { variant: "wrrm" }).some((n) => n.id.startsWith("body/right-side/window-1/bars/"))).toBe(true);
    // only the BDs has the guard's lookout bay; only the UIC-Z coaches a skirt
    expect(nodesOf("proc-vehicle-zsr-coach", { variant: "bds" }).some((n) => n.id.startsWith("body/lookout-bay/"))).toBe(true);
    expect(nodesOf("proc-vehicle-zsr-coach", { variant: "b" }).some((n) => n.id.startsWith("body/lookout-bay/"))).toBe(false);
    expect(nodesOf("proc-vehicle-uic-z-coach", { variant: "secondClass" }).some((n) => n.id.startsWith("skirt/"))).toBe(true);
  });

  it("paints the liveries: first class lines, ZSR stripes, the WRRm diagonals", () => {
    const mats = (id: string, variant: string) => new Set(nodesOf(id, { variant }).filter((n) => n.id.includes("/paint/")).map((n) => n.material));
    expect(mats("proc-vehicle-zsr-coach", "a").has("yellow")).toBe(true);
    expect(mats("proc-vehicle-zsr-coach", "b").has("yellow")).toBe(false);
    expect(mats("proc-vehicle-zsr-coach", "b")).toEqual(new Set(["white", "pink", "darkRed"]));
    expect(mats("proc-vehicle-uic-z-coach", "firstClass").has("yellow")).toBe(true);
    expect(mats("proc-vehicle-uic-z-coach", "secondClass").has("yellow")).toBe(false);
    expect(mats("proc-vehicle-cd-y-coach", "wrrm")).toEqual(new Set(["red"]));
    expect(mats("proc-vehicle-cd-y-coach", "beer")).toEqual(new Set(["navy", "red"]));
  });

  // the DB IC and OBB coaches came in as the `operator` parameter: every CD
  // combination (and so the default build) keeps its GLB bytes (pinned again when
  // its entrance doors became opening leaves, docs/models/doors.md, and when they
  // opened onto a cabin, docs/models/interiors.md)
  it("keeps the CD UIC-Z coaches byte for byte under the operator parameter", () => {
    const d = design("proc-vehicle-uic-z-coach");
    const sha = (p?: Record<string, string>) => createHash("sha256").update(d.build(p).toGlb(d.title)).digest("hex");
    expect(sha()).toBe("fb60332a25b91899c892023437c408fc5f3c73bdc7d24f903321f975d1cdb9c6");
    expect(sha({ variant: "firstClass", operator: "cd" })).toBe("a9041e6245442ef0c474d452525c69e151456416d5d8999596804963a902e9d7");
    expect(sha({ variant: "restaurant" })).toBe("3b44cd9e1a35d932c338789dfcb1b4b3623c84cb4cb308dada1fd0d914c44fce");
    expect(sha({ operator: "db" })).not.toBe(sha());
    expect(() => d.build({ operator: "sncf" })).toThrow(/no value "sncf"/);
  });

  it("lays out the DB IC and OBB coaches as their native BMPs do", () => {
    const id = "proc-vehicle-uic-z-coach";
    const count = (operator: string, variant: string, side: string) => windowCount(id, { operator, variant }, side);
    // DB: Ampz two toilets and nine bays, Bmpz two toilets and eleven, WRmz thirteen on the right and eight on the left
    expect(["firstClass", "secondClass", "restaurant"].map((v) => [count("db", v, "right"), count("db", v, "left")])).toEqual([[11, 11], [13, 13], [13, 8]]);
    // OBB: Ampz eleven, Bmpz twelve, WRmz eleven and ten
    expect(["firstClass", "secondClass", "restaurant"].map((v) => [count("obb", v, "right"), count("obb", v, "left")])).toEqual([[11, 11], [12, 12], [11, 10]]);
    const doors = (operator: string, variant: string, side: string) =>
      new Set(nodesOf(id, { operator, variant }).filter((n) => n.id.startsWith(`body/${side}-side/door-`)).map((n) => n.id.split("/")[2])).size;
    expect([doors("db", "secondClass", "right"), doors("db", "restaurant", "right"), doors("db", "restaurant", "left"), doors("obb", "restaurant", "right"), doors("obb", "firstClass", "left")]).toEqual([2, 1, 1, 1, 2]);
    // the DB dining car's service doors are seams only, across from its passenger door
    expect(nodesOf(id, { operator: "db", variant: "restaurant" }).some((n) => n.id.startsWith("body/left-side/seams/"))).toBe(true);
    // the OBB dining car has its one entrance at the front end only
    const steps = nodesOf(id, { operator: "obb", variant: "restaurant" }).filter((n) => n.id.includes("-end/steps/")).map((n) => n.id.split("/")[0]);
    expect(new Set(steps)).toEqual(new Set(["front-end"]));
  });

  it("paints the DB IC and OBB liveries", () => {
    const id = "proc-vehicle-uic-z-coach";
    const colour = (operator: string, mat: string) => {
      const t = design(id).build({ operator }).sourceTree(id, "UIC-Z Coach");
      return t.colors[t.materials.indexOf(mat)];
    };
    const bands = (operator: string) => new Set(nodesOf(id, { operator, variant: "secondClass" }).filter((n) => /^body\/[a-zA-Z]+-band\//.test(n.id)).map((n) => n.material));
    expect(bands("db")).toEqual(new Set(["white", "red", "roof"]));
    expect(bands("obb")).toEqual(new Set(["red", "grey", "roof"]));
    expect(colour("db", "white")).toBe("#f2f2f2");
    expect(colour("obb", "grey")).toBe("#404040");
    const mats = (operator: string, variant: string) => new Set(nodesOf(id, { operator, variant }).filter((n) => n.id.includes("/paint/")).map((n) => n.material));
    // OBB first class: the yellow line; DB Ampz and WRmz: white gaps in the stripe
    expect(mats("obb", "firstClass")).toEqual(new Set(["yellow"]));
    expect(mats("obb", "secondClass").has("yellow")).toBe(false);
    expect(mats("db", "firstClass")).toEqual(new Set(["white"]));
    expect(mats("db", "restaurant")).toEqual(new Set(["white"]));
    // the operators' marks: the DB letters and frame on a plate, the OBB mark in white
    const emblem = (operator: string) => new Set(nodesOf(id, { operator, variant: "secondClass" }).filter((n) => n.id.startsWith("body/right-side/emblem")).map((n) => n.material));
    expect(emblem("db")).toEqual(new Set(["plate", "red"]));
    expect(emblem("obb")).toEqual(new Set(["white"]));
  });

  // the blue and white CD Bee 001 is a value of the green and white design: the
  // Bee's layout with its green in blue, and the Bee itself unchanged
  it("builds vlakosimdb's CD Bee 001 as the green and white design's beeBlue", () => {
    const d = VEHICLES.find((v) => v.id === "proc-vehicle-cd-green-white-coach")!;
    const tree = (variant: string) => leaves(d.build({ variant }).sourceTree(d.id, d.title).root);
    const ids = (variant: string) => tree(variant).filter((n) => !n.id.includes("running-number")).map((n) => `${n.id}:${n.tri[1]}`);
    expect(ids("beeBlue")).toEqual(ids("bee"));
    const colour = (variant: string) => d.build({ variant }).sourceTree(d.id, d.title);
    const green = (variant: string) => { const t = colour(variant); return t.colors[t.materials.indexOf("green")]; };
    expect(green("bee")).toBe("#0d7a1a");
    expect(green("beeBlue")).toBe("#3c44e6");
  });
});
