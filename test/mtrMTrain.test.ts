// The MTR M-Train (generator/mtrMTrain.ts). See docs/models/mtr-m-train.md.
import { describe, expect, it } from "vitest";
import {
  MTR_BODY, MTR_BOGIE_CENTRES, MTR_CARS, MTR_FORMATIONS, MTR_FRONT_COUPLER, MTR_GAP, MTR_LOD, MTR_M_TRAIN_DESIGNS, MTR_PARAMS, MTR_WIRE,
  MTR_DRL_FORMATION, mtrDrlTrain, mtrFront, mtrLayout, mtrLength, mtrMTrain, mtrTrain, type MtrCar,
} from "../generator/mtrMTrain";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { buildLodModel } from "../generator/lodModel";
import { isLeaf, type LeafNode, type TreeNode } from "../generator/sourceTree";

function leaves(n: TreeNode): LeafNode[] {
  return isLeaf(n) ? [n] : n.children.flatMap(leaves);
}

const CARS: MtrCar[] = ["aCar", "bCar", "cCar", "dCar"];
const DRL: MtrCar[] = ["pCar", "qCar"];
const ALL: MtrCar[] = [...CARS, ...DRL];
const LIVERIES = ["refurbished", "retro"];
const nodes = (params: Record<string, string>) => leaves(mtrMTrain(params).sourceTree("m", "M-Train").root);
const axlesOf = (m: ReturnType<typeof mtrMTrain>) =>
  leaves(m.sourceTree("m", "M-Train").root)
    .filter((n) => /\/wheelset(-\d+)?\/sweep-1$/.test(n.id))
    .map((n) => (n.min![0] + n.max![0]) / 2)
    .sort((a, b) => a - b);

describe("the MTR M-Train", () => {
  it("is one electric unit design: four cars and the full train, the Disneyland cars and train, the A cab car by default, two liveries", () => {
    const [d] = MTR_M_TRAIN_DESIGNS;
    expect(MTR_M_TRAIN_DESIGNS).toHaveLength(1);
    expect(d!.id).toBe("proc-vehicle-mtr-m-train");
    expect(d!.references).toBe("mtr-m-train");
    expect(d!.catalog).toMatchObject({ category: "Rail vehicles", group: "unit", traction: "electric" });
    expect(MTR_PARAMS.map((p) => [p.name, p.default])).toEqual([["unit", "aCar"], ["cars", "4"], ["livery", "refurbished"]]);
    expect(MTR_PARAMS[0]!.values.map((v) => v.value)).toEqual([...CARS, "train", ...DRL, "drlTrain"]);
    expect(MTR_PARAMS[1]!.values.map((v) => v.value)).toEqual(MTR_CARS.map(String));
    expect(MTR_PARAMS[1]!.when).toEqual({ name: "unit", values: ["train"] });
    expect(MTR_PARAMS[2]!.values.map((v) => v.value)).toEqual(LIVERIES);
    // the livery is the urban cars' only: the Disneyland cars have their own paint
    expect(MTR_PARAMS[2]!.when).toEqual({ name: "unit", values: [...CARS, "train"] });
    for (const p of MTR_PARAMS) for (const v of p.values) expect(v.title.length, v.title).toBeLessThanOrEqual(16);
    expect(d!.game).toMatchObject({ weight: 37, power: 340, maxspeed: 80, accel: 1.0 });
    // the D trailer has no power; the 8-car train's six motor cars 2,040 kW
    expect(d!.game!.variants).toContainEqual({ params: { unit: "dCar" }, weight: 27, power: 0 });
    expect(d!.game!.variants).toContainEqual({ params: { cars: "8", unit: "train" }, weight: 2 * 37 + 3 * 37 + 36 + 2 * 27, power: 6 * 340 });
    expect(d!.game!.variants).toContainEqual({ params: { unit: "drlTrain" }, weight: 4 * 37, power: 4 * 340 });
  });

  for (const livery of LIVERIES)
    for (const car of CARS)
      it(`${car} (${livery}): stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
        const glb = mtrMTrain({ unit: car, livery }).toGlb("m");
        const s = glbStats(glb);
        expect(s.triangles).toBeLessThanOrEqual(16000);
        expect(s.min[1]).toBeCloseTo(0, 2);
        expect(s.max[1]).toBeLessThanOrEqual(car === "cCar" ? MTR_WIRE + 0.01 : 4.7);
        expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
        expect(s.max[0] - s.min[0]).toBeCloseTo(mtrLength(car), 2);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
      });

  for (const car of DRL)
    it(`${car} (Disneyland): stays in budget and in the envelope, at its length over the couplers, without coplanar faces`, () => {
      const glb = mtrMTrain({ unit: car }).toGlb("m");
      const s = glbStats(glb);
      expect(s.triangles).toBeLessThanOrEqual(16000);
      expect(s.min[1]).toBeCloseTo(0, 2);
      expect(s.max[1]).toBeLessThanOrEqual(car === "qCar" ? MTR_WIRE + 0.01 : 4.7);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.max[0] - s.min[0]).toBeCloseTo(mtrLength(car), 2);
      expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("is 22.85 m (A) and 22.0 m (B, C, D) over the bodies, on two bogies 2.5 m wheelbase", () => {
    expect(mtrLength("aCar")).toBeCloseTo(MTR_BODY.cab + MTR_GAP + MTR_FRONT_COUPLER, 6);
    expect(mtrLength("dCar")).toBeCloseTo(MTR_BODY.middle + 2 * MTR_GAP, 6);
    for (const car of ALL) {
      const m = mtrMTrain({ unit: car });
      expect(m.rig!.supports).toHaveLength(2);
      const a = axlesOf(m);
      expect(a).toHaveLength(4);
      expect(a[1]! - a[0]!).toBeCloseTo(2.5, 2);
      expect((a[2]! + a[3]!) / 2 - (a[0]! + a[1]!) / 2).toBeCloseTo(MTR_BOGIE_CENTRES, 2);
    }
  });

  it("has five double-leaf doors a side on an urban car, three on a Disneyland car, each door's two leaves opening", () => {
    for (const car of ALL) {
      const n = DRL.includes(car) ? 3 : 5;
      expect(mtrLayout(car).doors).toHaveLength(n);
      const m = mtrMTrain({ unit: car });
      const clips = m.animations().filter((c) => c.drive.drive === "door");
      expect(clips.map((c) => c.drive)).toEqual(expect.arrayContaining([{ drive: "door", side: "right" }, { drive: "door", side: "left" }]));
      // two leaves a door, on both sides
      expect(new Set(clips.flatMap((c) => c.tracks.map((t) => t.node))).size).toBe(4 * n);
    }
  });

  it("gives the A car its cab face and front coupler, only the C car its pantograph, raised to the game's wire", () => {
    const a = nodes({ unit: "aCar" });
    for (const scope of ["cab-end/mask", "cab-end/windscreens", "cab-end/bands", "cab-end/bumper-lamps", "front-coupler"]) expect(a.some((n) => n.id.startsWith(scope)), scope).toBe(true);
    expect(Math.max(...a.map((n) => n.max![0]))).toBeCloseTo(mtrLength("aCar") / 2, 2);
    const pans = (params: Record<string, string>) => nodes(params).filter((n) => n.id.startsWith("roof-equipment/pantographs/"));
    for (const unit of ["aCar", "bCar", "dCar", "pCar"]) expect(pans({ unit })).toHaveLength(0);
    for (const unit of ["cCar", "qCar"]) expect(Math.max(...pans({ unit }).map((n) => n.max![1]))).toBeCloseTo(MTR_WIRE, 2);
  });

  it("draws the cab front by car and livery: the refurbished mask, the 1979 front with the retro livery, the Disneyland front", () => {
    expect(mtrFront("aCar", "refurbished")).toBe("refurbished");
    expect(mtrFront("aCar", "retro")).toBe("original");
    expect(mtrFront("pCar", "refurbished")).toBe("disney");
    expect(mtrFront("pCar", "retro")).toBe("disney");
    const has = (params: Record<string, string>, scope: string) => nodes(params).some((n) => n.id.startsWith(scope));
    // the refurbished mask and header lamps; the 1979 white face, its stripes round the corners and the cab door; the Disneyland navy mask and sweep
    expect(has({ unit: "aCar" }, "cab-end/header-lamps")).toBe(true);
    expect(has({ unit: "aCar", livery: "retro" }, "cab-end/face")).toBe(true);
    expect(has({ unit: "aCar", livery: "retro" }, "cab-end/mask")).toBe(false);
    expect(has({ unit: "aCar", livery: "retro" }, "body/right-side/stripes")).toBe(true);
    expect(has({ unit: "aCar", livery: "retro" }, "body/right-side/cab-door")).toBe(true);
    expect(has({ unit: "aCar" }, "body/right-side/cab-door")).toBe(false);
    expect(has({ unit: "pCar" }, "cab-end/mask")).toBe(true);
    expect(has({ unit: "pCar" }, "body/left-side/sweep")).toBe(true);
    // the 1979 front's square top stands higher at the face than the refurbished one
    const faceTop = (params: Record<string, string>) => Math.max(...nodes(params).filter((n) => n.id.startsWith("cab-end/")).map((n) => n.max![1]));
    expect(faceTop({ unit: "aCar", livery: "retro" })).toBeGreaterThan(faceTop({ unit: "aCar" }));
  });

  it("runs the 1979 stripes unbroken from the face round the corners: the face's stripe reaches the face's edge at the wrap's own offset", () => {
    const all = nodes({ unit: "aCar", livery: "retro" });
    const bands = all.filter((n) => n.id.startsWith("cab-end/bands"));
    const wrap = all.filter((n) => n.id.startsWith("body/right-side/stripes"));
    expect(bands.length).toBeGreaterThan(0);
    expect(wrap.length).toBeGreaterThan(0);
    // the face's half width at the stripes is 1.53 - 0.12 m (the 1979 front's corner), a hair less for the side's lean
    expect(Math.max(...bands.map((n) => n.max![2]))).toBeGreaterThan(1.405);
    // the wrap starts where the face's stripe stands, 12 mm ahead of the face
    const front = (ns: typeof all) => Math.max(...ns.map((n) => n.max![0]));
    expect(front(wrap)).toBeCloseTo(front(bands), 3);
    expect(Math.min(...wrap.map((n) => n.min![2]))).toBeLessThan(1.42);
  });

  it("gives the Disneyland front its large windscreens and centre window and round headlamps", () => {
    const all = nodes({ unit: "pCar" });
    const span = (prefix: string, axis: number) => {
      const ns = all.filter((n) => n.id.startsWith(prefix));
      return Math.max(...ns.map((n) => n.max![axis])) - Math.min(...ns.map((n) => n.min![axis]));
    };
    // the side windscreens reach out to the mask's edge, 1.22 m tall; the centre door's window over 1.1 m tall
    expect(Math.max(...all.filter((n) => n.id.startsWith("cab-end/windscreens")).map((n) => n.max![2]))).toBeGreaterThan(0.99);
    expect(span("cab-end/windscreens", 1)).toBeGreaterThan(1.2);
    expect(span("cab-end/emergency-door", 1)).toBeGreaterThan(1.5);
    expect(all.some((n) => n.id.startsWith("cab-end/bumper-lamps"))).toBe(true);
  });

  it("gives the Disneyland cars their Mickey-head windows and oval door lights, the urban cars none", () => {
    for (const car of DRL) {
      expect(mtrLayout(car).mickeys.length).toBeGreaterThanOrEqual(8);
      expect(nodes({ unit: car }).some((n) => n.id.startsWith("body/right-side/mickey-windows/"))).toBe(true);
    }
    for (const car of CARS) {
      expect(mtrLayout(car).mickeys).toEqual([]);
      expect(nodes({ unit: car }).some((n) => n.id.includes("mickey"))).toBe(false);
    }
  });

  it("runs the Disneyland line's four-car train P-Q+Q-P, the rear P car turned", () => {
    const slots = mtrDrlTrain();
    expect(slots.map((s) => s.car)).toEqual(MTR_DRL_FORMATION);
    expect(slots.map((s) => s.number)).toEqual(["P503", "Q503", "Q504", "P504"]);
    expect(slots[3]!.turned).toBe(true);
    const m = mtrMTrain({ unit: "drlTrain" });
    const s = glbStats(m.toGlb("m"));
    expect(s.max[0] - s.min[0]).toBeCloseTo(2 * mtrLength("pCar") + 2 * mtrLength("qCar"), 2);
    expect(s.triangles).toBeLessThanOrEqual(4 * 16000);
    expect(m.rig!.sections).toHaveLength(4);
    expect(m.rig!.joints).toHaveLength(3);
    expect(m.rig!.supports).toHaveLength(8);
    expect(findCoplanarOverlaps(m.toGlb("m"))).toEqual([]);
  });

  it("forms its trains from the 8-car urban formation A-C+D+B-C+D+C-A, a C car in each half", () => {
    expect(MTR_CARS).toEqual([3, 4, 5, 6, 7, 8]);
    const letters = (n: number) => mtrTrain(n).map((s) => s.car[0]!.toUpperCase()).join("");
    expect(letters(8)).toBe("ACDBCDCA");
    expect(letters(4)).toBe("ACCA");
    expect(letters(3)).toBe("ACA");
    for (const n of MTR_CARS) {
      const slots = mtrTrain(n);
      expect(slots.map((s) => s.car)).toEqual(MTR_FORMATIONS[n]);
      expect(slots[0]!.car).toBe("aCar");
      expect(slots[n - 1]).toMatchObject({ car: "aCar", turned: true });
      expect(slots.filter((s) => s.turned)).toHaveLength(1);
      expect(slots.some((s) => s.car === "cCar")).toBe(true);
      // every car carries its own running number, of its own letter
      expect(new Set(slots.map((s) => s.number)).size).toBe(n);
      for (const s of slots) expect(s.number[0]).toBe(s.car[0]!.toUpperCase());
    }
    expect(mtrTrain(8).map((s) => s.number)).toEqual(["A169", "C169", "D602", "B456", "C456", "D619", "C164", "A164"]);
  });

  for (const n of MTR_CARS)
    it(`a ${n}-car train is articulated: a section per car on its own bogies, the rear A car turned`, () => {
      const slots = mtrTrain(n);
      const m = mtrMTrain({ unit: "train", cars: String(n) });
      const glb = m.toGlb("m");
      const s = glbStats(glb);
      const total = slots.reduce((t, slot) => t + mtrLength(slot.car), 0);
      expect(s.min[0]).toBeCloseTo(-total / 2, 2);
      expect(s.max[0]).toBeCloseTo(total / 2, 2);
      expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
      expect(s.triangles).toBeLessThanOrEqual(16000 * n);
      const rig = m.rig!;
      expect(rig.sections).toHaveLength(n);
      expect(rig.joints).toHaveLength(n - 1);
      rig.sections!.slice(1).forEach((sec, i) => expect(sec.pivot[0]).toBeCloseTo(slots[i]!.lo, 6));
      for (const j of rig.joints!) expect(j.front - j.rear).toBeCloseTo(2 * MTR_GAP, 6);
      expect(rig.supports).toHaveLength(2 * n);
      for (let k = 0; k < n; k++) expect(rig.supports!.filter((sp) => sp.sections.length === 1 && sp.sections[0] === k)).toHaveLength(2);
      if (n <= 4) expect(findCoplanarOverlaps(glb)).toEqual([]);
    });

  it("builds the same bytes twice and keeps a distant model for every car and train", () => {
    expect(Buffer.from(mtrMTrain({ unit: "train", cars: "4" }).toGlb("a")).equals(Buffer.from(mtrMTrain({ unit: "train", cars: "4" }).toGlb("a")))).toBe(true);
    const d = MTR_M_TRAIN_DESIGNS[0]!;
    const all: Array<Record<string, string>> = [...ALL.map((unit) => ({ unit })), { unit: "aCar", livery: "retro" }, { unit: "drlTrain" }, ...MTR_CARS.map((n) => ({ unit: "train", cars: String(n) }))];
    for (const params of all) {
      const low = buildLodModel(d, params);
      expect(low.triangleCount()).toBeGreaterThan(0);
      const n = params.unit === "drlTrain" ? 4 : params.unit === "train" ? Number(params.cars!) : 1;
      expect(low.triangleCount()).toBeLessThanOrEqual(Math.min(MTR_LOD, 100 * n));
      if (n > 1) expect(low.rig!.sections).toHaveLength(n);
    }
  });
});
