// Where models smoke, steam and flare (MeshCore.emit): every emitter sits on the
// mouth of what it rises from, and the models that should give off smoke do. The
// game draws its smoke from these points, so a point off the stack is smoke in the
// air (docs/models/emitters.md).

import { describe, expect, it } from "vitest";
import { DESIGNS } from "../generator/generate.ts";
import { resolveParams, type ProceduralDesign } from "../generator/design.ts";
import type { Emitter } from "../generator/meshCore.ts";

function built(d: ProceduralDesign, params: Record<string, string> = {}): { emitters: readonly Emitter[]; pos: number[] } {
  const m = d.build(resolveParams(d.params ?? [], params));
  return { emitters: m.emitters(), pos: m.positions() };
}

/** Every combination of a design's parameters (small for the designs that smoke). */
function combos(d: ProceduralDesign): Record<string, string>[] {
  let out: Record<string, string>[] = [{}];
  for (const p of d.params ?? []) out = out.flatMap((c) => p.values.map((v) => ({ ...c, [p.name]: v.value })));
  return out;
}

const SMOKERS = [
  "proc-building-ind-chimney-basic",
  "proc-building-ind-building-a",
  "proc-building-industry-factory-a",
  "proc-building-industry-power-plant",
  "proc-building-chemical-factory",
  "proc-vehicle-cruise-ferry",
  "proc-vehicle-ocean-liner",
  "proc-vehicle-passenger-ferry",
];

describe("emitters", () => {
  it("sit on the mouth they rise from, never inside or above the model", () => {
    for (const d of DESIGNS.values()) {
      if (combos(d).length > 64) continue;
      for (const params of combos(d)) {
        const { emitters, pos } = built(d, params);
        for (const e of emitters) {
          const [x, y, z] = e.at;
          const reach = 2 * e.radius + 0.1;
          let rim = false;
          let over = false;
          for (let i = 0; i < pos.length; i += 3) {
            const h = Math.hypot(pos[i]! - x, pos[i + 2]! - z);
            if (h <= reach && Math.abs(pos[i + 1]! - y) < 0.1) rim = true;
            if (h < e.radius * 0.5 && pos[i + 1]! > y + 0.2) over = true;
          }
          const what = `${d.id} ${JSON.stringify(params)} ${e.kind} at ${e.at.map((v) => v.toFixed(2))}`;
          expect(rim, `${what}: no mouth there`).toBe(true);
          expect(over, `${what}: covered by geometry`).toBe(false);
        }
      }
    }
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
