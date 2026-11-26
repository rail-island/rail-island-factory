// Freight loads drawn as hidden load parts (docs/models/loads.md): the kit's part
// naming, the JS model's hidden groups and userData.loads, the GLB's marks, the
// model at rest without them, the budget's count, and per freight design: every
// load part on its bed, its commodities the supply chain's, hidden at rest and in
// the JS model; and no design keeps a loaded/empty cargo parameter.

import { describe, expect, it } from "vitest";
import { VEHICLE_CAPACITY } from "../generator/capacityTable.ts";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import { ALL_VEHICLES, toGlb } from "../generator/generate.ts";
import { collectTriangles, firstLoad, parseGlb, type Tri } from "../generator/glbTriangles.ts";
import { readAccessor } from "../generator/glbParse.ts";
import { glbStats } from "../generator/glbStats.ts";
import { buildLodModel } from "../generator/lodModel.ts";
import { readTriangles } from "../generator/renderGlbThumb.ts";
import { BULK_LOOKS, CONTAINER_COMMODITIES, LOAD_COMMODITIES, LOAD_PALETTE, cementLoad, isLoadName, loadPart, lumberLoad } from "../generator/loadKit.ts";
import { COMMODITIES } from "../generator/traffic.ts";
import { applyLoads, loadChoices, loadsOf } from "../src/viewerLoads.ts";
import { design, jsModuleOf } from "./catalogCache";

const PALETTE = { body: { color: "#808080" }, ...LOAD_PALETTE };

/** A flat wagon: a deck at 1.2 m, inside a car part, with a coal heap and a steel load on it. */
function wagon<M extends MeshBuilder | ThreeMeshBuilder>(m: M): M {
  m.part("car", [0, 0, 0], () => {
    m.box("body", 0, 0, 10, 2.6, 1, 1.2);
    loadPart(m, ["coal"], [0, 1.2, 0], () => m.box("loadCoal", 0, 0, 9, 2.4, 1.21, 2.2));
    loadPart(m, ["steel", "goods"], [0, 1.2, 0], () => m.box("loadSteel", 0, 0, 9, 2, 1.21, 1.6));
  });
  return m;
}

describe("the load kit", () => {
  it("names the load parts after their first commodity and car, hides them and lists them", () => {
    const m = wagon(new MeshBuilder(PALETTE));
    expect(m.loads()).toEqual([{ part: "load-coal-car", commodities: ["coal"] }, { part: "load-steel-car", commodities: ["steel", "goods"] }]);
    expect(isLoadName("load-coal-car")).toBe(true);
    expect(m.loadTriangleCounts()).toEqual([10, 10]);
    expect(m.exteriorTriangleCount()).toBe(10);
    // the budget counts the exterior and the largest load shown at once
    expect(m.budgetTriangleCount()).toBe(20);
    // the GLB marks the nodes and lists the loads; the model at rest leaves them out
    const glb = m.toGlb("t", "t");
    const { json, bin } = parseGlb(glb);
    const node = (json.nodes ?? []).find((n) => (n as { name?: string }).name === "load-coal-car")!;
    expect(node.extras).toEqual({ load: ["coal"] });
    expect((node as { translation?: number[] }).translation).toEqual([0, 1.2, 0]);
    expect((json.scenes![0] as { extras?: { loads?: unknown } }).extras?.loads).toEqual(m.loads());
    expect(collectTriangles(json, bin)).toHaveLength(10);
    expect(glbStats(glb).triangles).toBe(10);
    expect(collectTriangles(json, bin, { loads: "goods" }).filter((t) => t.load)).toHaveLength(10);
    expect(collectTriangles(json, bin, { loads: true })).toHaveLength(30);
    expect(firstLoad(json)).toBe("coal");
    // the thumbnail shows the first load
    expect(readTriangles(glb).filter((t) => t.load).every((t) => t.material === "loadCoal")).toBe(true);
    // the source tree is the model at rest
    expect(m.sourceTree("t", "t").triangles).toBe(10);
    // the JS model builds them hidden, with the table
    // the bundle's build() calls hideLoads after toGroup (jsModel.ts)
    const three = wagon(new ThreeMeshBuilder(PALETTE));
    const group = three.toGroup(THREE, "t");
    three.hideLoads!(group);
    expect(group.userData.loads).toEqual(m.loads());
    expect(group.getObjectByName("load-coal-car")!.visible).toBe(false);
    expect(group.getObjectByName("load-steel-car")!.position.y).toBeCloseTo(1.2, 6);
    // the site shows one commodity's parts, scaled from the bed with the fill
    const loads = loadsOf(group);
    expect(loadChoices(loads)).toEqual(["coal", "steel", "goods"]);
    applyLoads(loads, "goods", 0.5);
    expect(loads.map((l) => [l.group.visible, l.group.scale.y])).toEqual([[false, 0.5], [true, 0.5]]);
    applyLoads(loads, null, 1);
    expect(loads.every((l) => !l.group.visible)).toBe(true);
  });

  it("numbers a second load part of the same commodity in one car", () => {
    const m = new MeshBuilder(PALETTE);
    for (const y of [1, 3]) loadPart(m, ["goods"], [0, y, 0], () => m.box("loadBoxRed", 0, 0, 2, 2, y, y + 1));
    expect(m.loads()!.map((l) => l.part)).toEqual(["load-goods", "load-goods-2"]);
    expect(() => loadPart(m, [], [0, 0, 0], () => undefined)).toThrow(/at least one commodity/);
  });

  it("knows the supply chain's commodities and gives the bulk ones a heap each", () => {
    expect([...LOAD_COMMODITIES]).toEqual([...COMMODITIES]);
    expect(BULK_LOOKS.map((l) => l.commodities.join("+"))).toEqual(["coal", "iron-ore", "grain", "stone", "sand"]);
    expect([...CONTAINER_COMMODITIES]).toEqual(["goods"]);
    for (const l of BULK_LOOKS) expect(LOAD_PALETTE[l.mat], l.mat).toBeDefined();
  });

  it("draws lumber bundles and cement pallets standing on the bed, in their own materials", () => {
    const lumber = new MeshBuilder(PALETTE);
    const top = lumberLoad(lumber, -5, 5, -1.2, 1.2, 1.2, { rows: 2, across: 2, high: 2, h: 0.8 });
    expect(top).toBeCloseTo(1.2 + 2 * (0.1 + 0.8), 6);
    const cement = new MeshBuilder(PALETTE);
    expect(cementLoad(cement, -5, 5, -1.2, 1.2, 1.2, { rows: 4, across: 2 })).toBeCloseTo(1.2 + 0.14 + 8 * 0.12, 6);
    for (const [m, mats] of [[lumber, ["loadLumber", "loadLumberEnd", "loadLumberGap", "loadStrap", "loadPallet"]], [cement, ["loadPallet", "loadCement"]]] as const) {
      const ys = m.positions().filter((_, i) => i % 3 === 1);
      expect(Math.min(...ys)).toBeCloseTo(1.2, 6);
      const { json, bin } = parseGlb(m.toGlb("t", "t"));
      const used = new Set(collectTriangles(json, bin).map((t) => t.material));
      expect([...used].sort()).toEqual([...mats].sort());
      // no face looks down: nothing is drawn under the bed
      expect(collectTriangles(json, bin).some((t) => t.n[0][1] < -0.5)).toBe(false);
    }
  });
});

/** The freight designs that draw loads, and the commodities their parts stand for. */
const BULK = ["coal", "iron-ore", "grain", "stone", "sand"];
const CONTAINERS = ["goods"];
const FREIGHT: Record<string, string[]> = {
  "proc-vehicle-eas-open-wagon": [...BULK, "wood"],
  "proc-vehicle-ua-open-wagon": [...BULK, "wood"],
  "proc-vehicle-nas-flat-wagon": ["wood", "steel", "goods", "lumber", "cement"],
  "proc-vehicle-sqns-container-wagon": CONTAINERS,
  "proc-vehicle-pao-flat-wagon": ["steel", "lumber", "cement"],
  "proc-vehicle-faccs-hopper-wagon": BULK,
  "proc-vehicle-falls-hopper-wagon": BULK,
  "proc-vehicle-wap-hopper-wagon": BULK,
  "proc-vehicle-us-well-car": CONTAINERS,
  "proc-vehicle-cr-c70-wagon": BULK,
  "proc-vehicle-ir-boxn-wagon": BULK,
  "proc-vehicle-legacy-open-wagon": BULK,
  "proc-vehicle-legacy-heavy-wagon": ["goods"],
  "proc-vehicle-animal-rail-mine-tub": ["coal", "iron-ore", "stone", "sand"],
  "proc-vehicle-tatra-815-tipper": BULK,
  "proc-vehicle-tatra-815": BULK,
  "proc-vehicle-kenworth-c500-log": ["wood"],
  "proc-vehicle-kenworth-t909-road-train": BULK,
  "proc-vehicle-lohr-car-transporter": ["goods"],
  "proc-vehicle-mb-unimog": ["lumber", "cement"],
  "proc-vehicle-ship-triple-e": CONTAINERS,
  "proc-vehicle-ship-emma-maersk": CONTAINERS,
  "proc-vehicle-ship-msc-gulsun": CONTAINERS,
  "proc-vehicle-ship-panamax-container": CONTAINERS,
  "proc-vehicle-ship-feeder-container": CONTAINERS,
  "proc-vehicle-ship-roro": CONTAINERS,
  "proc-vehicle-ship-heavy-lift": ["goods"],
  "proc-vehicle-ship-europaschiff": CONTAINERS,
  "proc-vehicle-ship-push-barge": BULK,
  "proc-vehicle-ship-yangtze-cargo": CONTAINERS,
};

describe("loads against capacities", () => {
  it("every commodity a design draws is one its capacity carries (a design without a table entry is a draft)", () => {
    const problems: string[] = [];
    for (const [id, drawn] of Object.entries(FREIGHT)) {
      const entry = VEHICLE_CAPACITY[id];
      if (!entry) continue;
      const carried = new Set<string>([...(entry.commodities ?? []), ...(entry.variants ?? []).flatMap((v) => v.commodities ?? [])]);
      for (const c of drawn) if (!carried.has(c)) problems.push(`${id} draws ${c} but its capacity does not carry it`);
    }
    expect(problems).toEqual([]);
  });
});

/** Whether an exterior face facing up lies on the bed: within `below` under the pivot's height `y`, inside the load's plan (`pts`). */
function onBed(rest: readonly Tri[], pts: readonly number[][], y: number, below = 0.3): boolean {
  const xs = pts.map((p) => p[0]!);
  const zs = pts.map((p) => p[2]!);
  const [x0, x1, z0, z1] = [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)];
  return rest.some((t) => {
    if (t.n[0][1] < 0.5) return false;
    const cx = (t.p[0][0] + t.p[1][0] + t.p[2][0]) / 3;
    const cz = (t.p[0][2] + t.p[1][2] + t.p[2][2]) / 3;
    const cy = (t.p[0][1] + t.p[1][1] + t.p[2][1]) / 3;
    return cx >= x0 - 0.5 && cx <= x1 + 0.5 && cz >= z0 - 0.5 && cz <= z1 + 0.5 && cy <= y + 0.02 && cy >= y - below;
  });
}

describe("freight designs", () => {
  it("keep no loaded/empty cargo parameter", () => {
    for (const d of ALL_VEHICLES) {
      for (const p of d.params ?? []) {
        expect(p.name, d.id).not.toBe("cargo");
        // a `load` parameter may count trailers (the Kenworth T909), never be loaded or empty
        if (p.name === "load") expect(p.values.map((v) => v.value), d.id).not.toContain("empty");
      }
      for (const v of d.game?.variants ?? []) expect(Object.keys(v.params), d.id).not.toContain("cargo");
    }
  });

  it.each(Object.entries(FREIGHT))("%s draws its loads on its bed, hidden at rest, standing for chain commodities", (id, commodities) => {
    const m = design(id).build();
    const loads = m.loads()!;
    expect(loads, id).not.toBeNull();
    expect([...new Set(loads.flatMap((l) => l.commodities))].sort()).toEqual([...commodities].sort());
    for (const l of loads) for (const c of l.commodities) expect(LOAD_COMMODITIES as readonly string[]).toContain(c);
    const glb = toGlb(id, m);
    const { json, bin } = parseGlb(glb);
    const rest = collectTriangles(json, bin);
    expect(rest.some((t) => t.load)).toBe(false);
    // each part's pivot (its node's place in the model) on the floor it rests on, its load above it
    const nodes = (json.nodes ?? []) as Array<{ name?: string; mesh?: number; translation?: number[]; children?: number[]; extras?: unknown }>;
    const world = new Map<number, number[]>();
    const visit = (i: number, at: number[]): void => {
      const n = nodes[i]!;
      const here = at.map((v, k) => v + (n.translation?.[k] ?? 0));
      world.set(i, here);
      for (const c of n.children ?? []) visit(c, here);
    };
    for (const i of (json.scenes![0] as { nodes: number[] }).nodes) visit(i, [0, 0, 0]);
    for (const l of loads) {
      const index = nodes.findIndex((n) => n.name === l.part);
      const node = nodes[index]!;
      expect(node.extras, l.part).toEqual({ load: l.commodities });
      const pivot = world.get(index)!;
      // the part's own vertices, in the model
      const pts: number[][] = [];
      for (const prim of json.meshes![node.mesh!]!.primitives) {
        const pos = readAccessor(json, bin, prim.attributes.POSITION!);
        for (let k = 0; k < pos.length; k += 3) pts.push([pos[k]! + pivot[0]!, pos[k + 1]! + pivot[1]!, pos[k + 2]! + pivot[2]!]);
      }
      expect(pts.length, l.part).toBeGreaterThan(0);
      expect(pivot[1], `${l.part} pivot under its load`).toBeLessThanOrEqual(Math.min(...pts.map((p) => p[1]!)) + 0.02);
      expect(onBed(rest, pts, pivot[1]!), `${l.part} pivot on a floor`).toBe(true);
    }
    // the distant model's loads are hidden load parts too, of the same commodities
    const low = buildLodModel(design(id));
    for (const l of low.loads() ?? []) for (const c of l.commodities) expect(commodities).toContain(c);
  });

  it.each(["proc-vehicle-eas-open-wagon", "proc-vehicle-lohr-car-transporter", "proc-vehicle-ship-push-barge"])("%s's JS model builds its loads hidden", async (id) => {
    const mod = await jsModuleOf(id);
    const group = mod.default(THREE);
    const loads = group.userData.loads as Array<{ part: string; commodities: string[] }>;
    expect(loads.length).toBeGreaterThan(0);
    for (const l of loads) expect(group.getObjectByName(l.part)!.visible).toBe(false);
  });
});
