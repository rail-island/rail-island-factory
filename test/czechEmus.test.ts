// The Czech electric units: the CD 471 CityElefant set (generator/emu471.ts) and
// the CD 680 Pendolino (generator/emu680.ts). See docs/models/czech-emus.md.
import { describe, expect, it } from "vitest";
import { paramCombinations, type ParamValues } from "../generator/design";
import { cd471, CD471_PARAMS, EMU471_DESIGNS, elefantNumber, K_Y } from "../generator/emu471";
import { cd680, cd680Lod, CD680_LOD, CD680_PARAMS, EMU680_DESIGNS, pendolinoLength, PENDOLINO_LAYOUTS, pendolinoTrain } from "../generator/emu680";
import { createHash } from "node:crypto";
import { tractionCheckDigit } from "../generator/emuParts";
import { EMU_TRANSFERS, emuComparison, readEmuLandmarks } from "../generator/emuComparison";
import { glbStats } from "../generator/glbStats";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";
import type { MeshBuilder } from "../generator/meshBuilder";
import { sample } from "./catalogCache";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

function built(mesh: MeshBuilder, id: string) {
  const glb = mesh.toGlb(id);
  return { stats: glbStats(glb), nodes: leaves(mesh.sourceTree(id, id).root) };
}

/** The x centre of every wheelset's axle (its first sweep), ascending. */
function axles(nodes: LeafNode[]): number[] {
  return nodes
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => Math.round(((n.min![0] + n.max![0]) / 2) * 1000) / 1000)
    .sort((a, b) => a - b);
}

const bounds = (nodes: LeafNode[], pattern: RegExp) => {
  const ns = nodes.filter((n) => pattern.test(n.id));
  return { min: [0, 1, 2].map((k) => Math.min(...ns.map((n) => n.min![k]!))), max: [0, 1, 2].map((k) => Math.max(...ns.map((n) => n.max![k]!))), count: ns.length };
};

describe("the Czech electric units", () => {
  const designs = [...EMU471_DESIGNS, ...EMU680_DESIGNS];

  it("are two parametric rail designs with their reference folders", () => {
    expect(designs.map((d) => d.id)).toEqual(["proc-vehicle-cd-471", "proc-vehicle-cd-680"]);
    for (const d of designs) {
      expect(d.catalog).toMatchObject({ category: "Rail vehicles" });
      expect(d.references).toMatch(/^cd-(471|680)$/);
    }
    expect(CD471_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "motorCar", ["motorCar", "trailer", "drivingTrailer", "train"]],
      ["cars", "3", ["2", "3", "4", "5", "6", "7", "8"]],
      ["variant", "cd471", ["cd471", "cd675", "cdBlue"]],
    ]);
    expect(CD680_PARAMS.map((p) => [p.name, p.default, p.values.map((v) => v.value)])).toEqual([
      ["unit", "endCar", ["endCar", "car683", "car685", "car686", "train"]],
      ["cars", "4", ["3", "4", "5", "6", "7", "8"]],
    ]);
    expect(CD680_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
  });

  for (const d of designs)
    it.each(sample(paramCombinations(d.params)).map((c) => [JSON.stringify(c), c] as const))(`${d.id} %s stands on the rail, centred, inside the envelope and the budget`, (_, combo: ParamValues) => {
      const { stats: s, nodes } = built(d.build(combo), d.id);
      expect(s.min[1]).toBeCloseTo(0, 5);
      expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
      expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[1]).toBeLessThanOrEqual(6.5);
      // a full train adds its cars' budgets up
      const cars = combo.unit === "train" ? Number(combo.cars) : 1;
      expect(s.triangles).toBeLessThanOrEqual(16_000 * cars);
      expect(s.triangles).toBeGreaterThan(4_000 * cars);
      const fixed = nodes.filter((n) => !/^(section\d+\/car-\d+\/)?roof-equipment\/pantographs\//.test(n.id) && n.tri[1] > 0);
      expect(Math.max(...fixed.map((n) => n.max![1]))).toBeLessThanOrEqual(4.7);
    });

  it("CD 471: 26.05 m cab cars and a 25.7 m trailer over their couplers, 4.635 m high, 2.82 m wide", () => {
    for (const [unit, length] of [["motorCar", 26.05], ["trailer", 25.7], ["drivingTrailer", 26.05]] as const) {
      const { stats: s, nodes } = built(cd471({ unit }), "proc-vehicle-cd-471");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band/);
      expect(body.max[1]).toBeCloseTo(4.635, 3);
      expect(body.max[2] - body.min[2]).toBeCloseTo(2.82, 3);
      // the bogie pivots 19.0 m apart (published), the motor bogies' wheelbase 2.6 m, the trailers' 2.4 m
      const a = axles(nodes);
      expect(a.length).toBe(4);
      const wb = unit === "motorCar" ? 2.6 : 2.4;
      expect(a[1]! - a[0]!).toBeCloseTo(wb, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(wb, 3);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(19.0, 3);
    }
  });

  it("CD 471: the low floor between the bogies drops to 0.2 m (scaled), the ends stay at 0.9 m", () => {
    const { nodes } = built(cd471(), "proc-vehicle-cd-471");
    // the low floor's skirt: swept whole, or wall by wall where the cabin behind the doorways stands (docs/models/interiors.md)
    const skirt = bounds(nodes, /^body\/skirtdark-band\/(sweep|facets)-/);
    expect(skirt.min[1]).toBeCloseTo(0.2 * K_Y, 3);
    // the drop spans the XML's 14.9 m between the slopes (body 5.0 .. 19.9 m)
    expect(skirt.max[0] - skirt.min[0]).toBeCloseTo(14.9, 2);
    // both decks have windows: upper above 3.3 m, lower below 2.1 m
    const upper = bounds(nodes, /^body\/right-side\/upper-windows\/window-\d+\/glass/);
    const lower = bounds(nodes, /^body\/right-side\/lower-windows\/window-\d+\/glass/);
    expect(upper.min[1]).toBeGreaterThan(3.3);
    expect(lower.max[1]).toBeLessThan(2.1);
    expect(lower.min[1]).toBeGreaterThan(1.0);
  });

  it("CD 471: only the motor car has a pantograph, raised over the inner bogie; the cabs face +X", () => {
    for (const unit of ["motorCar", "trailer", "drivingTrailer"] as const) {
      const { stats: s, nodes } = built(cd471({ unit }), "proc-vehicle-cd-471");
      const panto = nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
      if (unit === "motorCar") {
        const head = bounds(nodes, /^roof-equipment\/pantographs\/pantograph\/head\//);
        expect(head.max[1]).toBeGreaterThan(5.5);
        expect(head.max[0]).toBeLessThan(-8); // over the inner (-X) bogie
      } else expect(panto.length).toBe(0);
      const coupler = bounds(nodes, /^cab\/coupler\//);
      if (unit === "trailer") expect(coupler.count).toBe(0);
      else expect(coupler.max[0]).toBeCloseTo(s.max[0], 5);
    }
  });

  it("CD 471 and the vlakosimdb CD 675 share one body: same bounds, different paint and numbers", () => {
    for (const unit of ["motorCar", "trailer", "drivingTrailer"] as const) {
      const a = built(cd471({ unit, variant: "cd471" }), "a").stats;
      for (const variant of ["cd675", "cdBlue"]) {
        const b = built(cd471({ unit, variant }), "b").stats;
        expect(b.min).toEqual(a.min);
        expect(b.max).toEqual(a.max);
      }
    }
    const mats = (v: string) => new Set(cd471({ variant: v }).sourceTree("x", "x").materials);
    expect(mats("cd471").has("blue")).toBe(true);
    expect(mats("cd675").has("blue")).toBe(false);
    expect(mats("cd675").has("red")).toBe(true);
    for (const m of ["navy", "sky", "white"]) expect(mats("cdBlue").has(m)).toBe(true);
  });

  it("CD 471 blue (Najbrt): the emblem behind the cab, 'City Elefant' on the cab cars' upper wall, the front lettered", () => {
    const tree = (unit: string, variant = "cdBlue") => built(cd471({ unit, variant }), "x").nodes;
    for (const unit of ["motorCar", "drivingTrailer"]) {
      const nodes = tree(unit);
      for (const side of ["right", "left"]) {
        const word = nodes.filter((n) => n.id.startsWith(`body/${side}-side/wordmark/`) && n.tri[1] > 0);
        expect(word.length).toBeGreaterThan(0);
        // on the vertical upper wall, over the end section behind the cab
        expect(Math.min(...word.map((n) => n.min![1]))).toBeGreaterThan(3.42 * K_Y);
        expect(Math.max(...word.map((n) => n.max![1]))).toBeLessThan(3.8 * K_Y);
        expect(Math.min(...word.map((n) => n.min![0]))).toBeGreaterThan(4);
      }
      expect(nodes.some((n) => n.id.startsWith("cab/running-number/"))).toBe(true);
      // no CityElefant stripes in the blue
      expect(nodes.some((n) => /stripe/.test(n.id))).toBe(false);
    }
    expect(tree("trailer").some((n) => n.id.includes("/wordmark/"))).toBe(false);
    expect(tree("motorCar", "cd471").some((n) => n.id.includes("/wordmark/") || n.id.startsWith("cab/running-number/"))).toBe(false);
  });

  it("carries valid running numbers", () => {
    expect(elefantNumber("cd471", "motorCar")).toBe("471 014-1");
    expect(elefantNumber("cd471", "trailer")).toBe("071 014-5");
    expect(elefantNumber("cd471", "drivingTrailer")).toBe("971 014-6");
    expect(elefantNumber("cd675", "motorCar")).toBe("675 001-2");
    expect(elefantNumber("cdBlue", "motorCar")).toBe("471 079-4");
    expect(elefantNumber("cdBlue", "drivingTrailer")).toBe(`971 079-${tractionCheckDigit("971079")}`);
    expect(tractionCheckDigit("163244")).toBe(7);
    expect(tractionCheckDigit("150222")).toBe(8);
  });

  it("CD 680: 27.7 m end car and 25.9 m intermediate cars, 2.8 m wide, the tapered tilting body", () => {
    for (const [unit, length] of [["endCar", 27.7], ["car683", 25.9], ["car685", 25.9], ["car686", 25.9]] as const) {
      const { stats: s, nodes } = built(cd680({ unit }), "proc-vehicle-cd-680");
      expect(s.max[0] - s.min[0]).toBeCloseTo(length, 3);
      const body = bounds(nodes, /^body\/[a-z-]*band/);
      expect(body.max[2] - body.min[2]).toBeCloseTo(2.8, 3);
      // the tumblehome starts at the window band (1.9 m), where the body is widest: 1.5 * 2.8 / 3
      const band = bounds(nodes, /^body\/band-band/);
      expect(band.max[2]).toBeCloseTo((1.5 * 2.8) / 3, 3);
      const roof = bounds(nodes, /^body\/dark-band/);
      expect(roof.max[1]).toBeCloseTo(3.6, 3);
      // wheelsets 2.7 m apart on each bogie
      const a = axles(nodes);
      expect(a.length).toBe(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.7, 3);
      expect(a[3]! - a[2]!).toBeCloseTo(2.7, 3);
      const panto = nodes.filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
      expect(panto.length > 0).toBe(unit === "endCar" || unit === "car685");
    }
    // the 683 has its kitchen section: fewer windows than the 686
    const windows = (unit: string) => built(cd680({ unit }), "x").nodes.filter((n) => /^body\/right-side\/windows\/window-\d+\//.test(n.id)).length;
    expect(windows("car683")).toBeLessThan(windows("car686"));
  });

  it("CD 680 full train: the formation of each length, the prototype's seven cars, the 685 always there", () => {
    const order = (n: number) => pendolinoTrain(n).map((s) => s.car);
    expect(order(3)).toEqual(["endCar", "car685", "endCar"]);
    expect(order(4)).toEqual(["endCar", "car683", "car685", "endCar"]);
    expect(order(5)).toEqual(["endCar", "car683", "car686", "car685", "endCar"]);
    expect(order(6)).toEqual(["endCar", "car683", "car686", "car685", "car686", "endCar"]);
    // the prototype (generator/openttdTable.ts's 7-car formation)
    expect(order(7)).toEqual(["endCar", "car683", "car686", "car685", "car683", "car686", "endCar"]);
    expect(order(8)).toEqual(["endCar", "car683", "car686", "car685", "car683", "car686", "car686", "endCar"]);
    for (let n = 3; n <= 8; n++) {
      const slots = pendolinoTrain(n);
      expect(slots.length).toBe(n);
      expect(slots.map((s) => s.turned)).toEqual(slots.map((_, i) => i === n - 1));
      expect(slots.filter((s) => s.car === "car685").length).toBe(1);
      // contiguous spans, each the car's length, centred on x = 0
      const total = slots.reduce((t, s) => t + pendolinoLength(PENDOLINO_LAYOUTS[s.car]), 0);
      expect(slots[0]!.hi).toBeCloseTo(total / 2, 9);
      expect(slots[n - 1]!.lo).toBeCloseTo(-total / 2, 9);
      slots.forEach((s, i) => {
        expect(s.hi - s.lo).toBeCloseTo(pendolinoLength(PENDOLINO_LAYOUTS[s.car]), 9);
        if (i > 0) expect(s.hi).toBe(slots[i - 1]!.lo);
      });
    }
    expect(() => pendolinoTrain(2)).toThrow();
    expect(() => pendolinoTrain(9)).toThrow();
  });

  it.each([3, 4, 8])("CD 680 full train of %i cars: a section per car, a joint per gap, two bogies a car, its length and budget", (n) => {
    const m = cd680({ unit: "train", cars: String(n) });
    const { stats: s, nodes } = built(m, "proc-vehicle-cd-680");
    const slots = pendolinoTrain(n);
    expect(s.max[0] - s.min[0]).toBeCloseTo(2 * 27.7 + (n - 2) * 25.9, 3);
    expect(s.max[0]).toBeCloseTo(-s.min[0], 5);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.triangles).toBeLessThanOrEqual(16_000 * n);
    const rig = m.rig!;
    expect(rig.sections!.length).toBe(n);
    // hinged at the coupling planes
    expect(rig.sections!.slice(1).map((sec) => sec.pivot[0])).toEqual(slots.slice(0, -1).map((sl) => sl.lo));
    expect(rig.joints!.map((j) => j.sections)).toEqual(slots.slice(0, -1).map((_, i) => [i, i + 1]));
    expect(rig.supports!.length).toBe(2 * n);
    for (let k = 0; k < n; k++) {
      const own = rig.supports!.filter((sp) => sp.sections!.length === 1 && sp.sections![0] === k);
      expect(own.length).toBe(2);
      for (const sp of own) {
        expect(sp.x).toBeGreaterThan(slots[k]!.lo);
        expect(sp.x).toBeLessThan(slots[k]!.hi);
      }
    }
    // the rear end car turned: a cab at each end; only the 685's pantograph raised, the end cars' folded
    const lamps = (pattern: RegExp) => nodes.filter((nd) => pattern.test(nd.id) && /\/cab\/lamps\//.test(nd.id));
    expect(Math.max(...lamps(/^section0\//).map((nd) => nd.max![0]))).toBeGreaterThan(s.max[0] - 0.5);
    expect(Math.min(...lamps(new RegExp(`^section${n - 1}/`)).map((nd) => nd.min![0]))).toBeLessThan(s.min[0] + 0.5);
    const pantoTop = (k: number) => Math.max(...nodes.filter((nd) => nd.id.startsWith(`section${k}/`) && /pantograph/.test(nd.id) && nd.tri[1] > 0).map((nd) => nd.max![1]));
    const p685 = slots.findIndex((sl) => sl.car === "car685");
    expect(pantoTop(p685)).toBeGreaterThan(5.5);
    expect(pantoTop(0)).toBeLessThan(4.7);
    expect(pantoTop(n - 1)).toBeLessThan(4.7);
  });

  it("CD 680 full train: deterministic bytes, lone cars unchanged by the train", () => {
    const hash = (m: MeshBuilder) => createHash("sha256").update(m.toGlb("x")).digest("hex");
    expect(hash(cd680({ unit: "train", cars: "5" }))).toBe(hash(cd680({ unit: "train", cars: "5" })));
    expect(hash(cd680({ unit: "train" }))).toBe(hash(cd680({ unit: "train", cars: "4" })));
    expect(hash(cd680({ unit: "car685" }))).not.toBe(hash(cd680({ unit: "train", cars: "3" })));
  });

  it("CD 680 full train: the distant model has the train's sections and joints, 100 triangles a car, 500 at most", () => {
    for (let n = 3; n <= 8; n++) {
      const full = cd680({ unit: "train", cars: String(n) }).rig!;
      const low = cd680Lod({ unit: "train", cars: String(n) });
      expect(low.rig!.sections!.map((sec) => sec.pivot)).toEqual(full.sections!.map((sec) => sec.pivot));
      expect(low.rig!.joints!.map((j) => j.sections)).toEqual(full.joints!.map((j) => j.sections));
      const budget = Math.min(CD680_LOD, 100 * n);
      expect(low.triangleCount()).toBeLessThanOrEqual(budget);
      expect(low.triangleCount()).toBeGreaterThanOrEqual(budget * 0.7);
    }
  });

  it("CD 680 game properties: every train length weighs its cars and has its motored cars' power", () => {
    const game = EMU680_DESIGNS[0]!.game!;
    for (let n = 3; n <= 8; n++) {
      const v = game.variants!.find((x) => x.params.unit === "train" && (x.params.cars ?? "4") === String(n))!;
      expect(v).toBeDefined();
      expect(v.weight).toBe(40 * n);
      // the two end cars and the 685
      expect(v.power).toBe(4500);
    }
  });

  it.each(EMU_TRANSFERS.map((t) => [t.key] as const))("%s matches its native BMP landmarks within their pixel tolerances once the documented scales are undone", (key) => {
    const t = EMU_TRANSFERS.find((x) => x.key === key)!;
    const rows = emuComparison(key, true);
    expect(rows.length).toBe(readEmuLandmarks(t).length);
    expect(rows.length).toBeGreaterThanOrEqual(20);
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length);
    for (const r of rows)
      for (let i = 0; i < 4; i++) expect(Math.abs(r.model[i]! - r.source[i]!), `${r.id} (${r.element}) component ${i}`).toBeLessThanOrEqual(r.tolerancePixels);
  });
});
