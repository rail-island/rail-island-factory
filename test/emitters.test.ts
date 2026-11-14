// Where models smoke, steam and flare (MeshCore.emit): every emitter sits on the
// mouth of what it rises from, and the models that should give off smoke do. The
// game draws its smoke from these points, so a point off the stack is smoke in the
// air (docs/models/emitters.md).

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate.ts";
import { paramCombinations, resolveParams, type ProceduralDesign } from "../generator/design.ts";
import type { Emitter } from "../generator/meshCore.ts";
import { expectEmittersOnMouths } from "./emitterCheck";

function built(d: ProceduralDesign, params: Record<string, string> = {}): { emitters: readonly Emitter[]; pos: number[] } {
  const m = d.build(resolveParams(d.params ?? [], params));
  return { emitters: m.emitters(), pos: m.positions() };
}

/** Every combination of a design's parameters it offers (small for the designs that smoke); a conditional value only where it applies. */
function combos(d: ProceduralDesign): Record<string, string>[] {
  return paramCombinations(d.params ?? []) as Record<string, string>[];
}

const SMOKERS = [
  "proc-building-ind-chimney-basic",
  "proc-building-ind-building-a",
  "proc-building-industry-factory-a",
  "proc-building-industry-power-plant",
  "proc-building-chemical-factory",
  "proc-building-industry-offshore-platform",
  "proc-vehicle-cruise-ferry",
  "proc-vehicle-ocean-liner",
  "proc-vehicle-passenger-ferry",
];

describe("emitters", () => {
  // Every design's defaults and its sampled combinations are checked by the catalog
  // sweep (test/catalogSweep.ts); here every combination of the designs that smoke:
  // the named stacks and funnels and the steam locomotives.
  const steam = [...DESIGNS.values()].filter((d) => d.catalog?.traction === "steam");
  describe("sit on the mouth they rise from, never inside or above the model, in every combination", () => {
    for (const d of [...SMOKERS.map((id) => DESIGNS.get(id)!), ...steam]) it(d.id, () => {
      for (const params of combos(d)) {
        const { emitters, pos } = built(d, params);
        expectEmittersOnMouths(emitters, pos, `${d.id} ${JSON.stringify(params)}`);
      }
    }, 300_000);
  });

  // A train's rear car is drawn turned (MeshCore.turned) and its cars moved into place
  // (MeshCore.moved): its smoke must go through that frame like the stack's triangles.
  // MeshCore.emit once took the point as given, which put the EMD F7's train smoke
  // off its stacks and the HST's and the Renfe 592's rear stack 0.18 - 0.25 m off.
  it("of a train's turned and moved cars sit on their stacks", () => {
    const trains = [...DESIGNS.values()].filter((d) => d.params?.some((p) => p.name === "unit" && p.values.some((v) => v.value === "train")));
    let smoking = 0;
    for (const d of trains) {
      const { emitters, pos } = built(d, { unit: "train" });
      if (emitters.length > 0) smoking++;
      expectEmittersOnMouths(emitters, pos, `${d.id} train`);
      for (const e of emitters) for (const v of e.at) expect(Object.is(v, -0), `${d.id}: -0 in an emitter`).toBe(false);
    }
    expect(smoking).toBeGreaterThan(5);
  }, 300_000);

  it("are given by every chimney, cooling tower, flare, funnel and locomotive exhaust", () => {
    for (const id of SMOKERS) {
      for (const params of combos(DESIGNS.get(id)!)) expect(built(DESIGNS.get(id)!, params).emitters.length, `${id} ${JSON.stringify(params)}`).toBeGreaterThan(0);
    }
    const steam = [...DESIGNS.values()].filter((d) => d.catalog?.traction === "steam");
    expect(steam.length).toBeGreaterThan(5);
    for (const d of steam) expect(built(d).emitters.some((e) => e.kind === "smoke"), d.id).toBe(true);
  });

  it("follow a parameter that moves the stack", () => {
    const d = DESIGNS.get("proc-building-ind-chimney-basic")!;
    const y = (height: string) => built(d, { height }).emitters[0]!.at[1];
    expect(y("short")).toBeLessThan(y("medium"));
    expect(y("medium")).toBeLessThan(y("tall"));
  });

  it("make a refinery flare and a plant without stacks stay clean", () => {
    expect(built(DESIGNS.get("proc-building-chemical-factory")!, { type: "refinery" }).emitters.map((e) => e.kind)).toEqual(["flame"]);
    expect(built(DESIGNS.get("proc-building-ind-building-h")!).emitters).toEqual([]);
    expect(built(DESIGNS.get("proc-building-village-cottage")!).emitters).toEqual([]);
  });
});

describe("fountain water", () => {
  const inside = (ring: Array<[number, number]>, x: number, z: number): boolean => {
    let hit = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, zi] = ring[i]!, [xj, zj] = ring[j]!;
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) hit = true;
    }
    return hit;
  };
  const fountains = [...DESIGNS.values()].filter((d) => /fountain/.test(d.id));

  it("is stated by every fountain, and by nothing else", () => {
    expect(fountains.map((d) => d.id).sort()).toEqual(["proc-building-fountain-classical", "proc-building-fountain-modern", "proc-building-fountain-obelisk"]);
    const styles = fountains.map((d) => d.build().fountain()?.style).sort();
    expect(styles).toEqual(["classical", "modern", "sculptural"]);
    // that nothing else states fountain water is the catalog sweep's (test/catalogSweep.ts)
  });

  it("fills its basins and lands every jet on water", () => {
    for (const d of fountains) {
      const m = d.build();
      const w = m.fountain()!;
      const pos = m.positions();
      expect(w.pools.length, d.id).toBeGreaterThan(0);
      expect(w.jets.length, d.id).toBeGreaterThan(0);
      // a pool lies on stone: geometry at its rim height or above around it
      for (const p of w.pools) {
        let below = false;
        for (let i = 0; i < pos.length; i += 3) if (Math.abs(pos[i + 1]! - p.y) < 0.02 && inside(p.ring, pos[i]! * 0.99, pos[i + 2]! * 0.99)) below = true;
        expect(below, `${d.id} pool at ${p.y}: no water surface drawn there`).toBe(true);
      }
      for (const j of w.jets) {
        const [x, y, z] = j.at;
        // from a nozzle: geometry within a few centimetres
        let nozzle = false;
        for (let i = 0; i < pos.length; i += 3) if (Math.hypot(pos[i]! - x, pos[i + 1]! - y, pos[i + 2]! - z) < 0.25) nozzle = true;
        expect(nozzle, `${d.id} jet at ${j.at}: no nozzle`).toBe(true);
        const lx = x + (j.dir?.[0] ?? 0) * j.reach;
        const lz = z + (j.dir?.[1] ?? 0) * j.reach;
        const target = w.pools.find((p) => Math.abs(p.y - j.land) < 1e-6);
        expect(target, `${d.id} jet at ${j.at} lands at ${j.land}, on no pool`).toBeTruthy();
        expect(inside(target!.ring, lx, lz), `${d.id} jet at ${j.at} lands outside its pool`).toBe(true);
      }
    }
  });
});
