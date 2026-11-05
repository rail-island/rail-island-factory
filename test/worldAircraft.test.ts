// The world aircraft on the airframe and rotor kits (generator/airframeKit.ts,
// generator/rotorKit.ts, generator/worldJets.ts, worldProps.ts, worldRotorcraft.ts,
// docs/models/world-aircraft.md): each at its published length, span and height,
// on its wheels (floats, hull) at y = 0, in budget with its LOD, its retractable
// gear the part "gear", its liveries changing its colours; the helicopters' rotors
// turning on the time clip "rotor"; and every aircraft has its OpenTTD entry.

import { describe, expect, it } from "vitest";
import { WORLD_JET_SPECS, WORLD_JETS } from "../generator/worldJets";
import { WORLD_PROP_SPECS, WORLD_PROPS } from "../generator/worldProps";
import { ROTOR_SPECS, WORLD_ROTORCRAFT, WORLD_ROTORCRAFT_SPECS } from "../generator/worldRotorcraft";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import { coverageCombinations, type ParamValues } from "../generator/design";
import { geometry } from "../generator/airframeKit";
import type { MeshBuilder } from "../generator/meshBuilder";
import { sample } from "./catalogCache";

const ALL = [...WORLD_JET_SPECS, ...WORLD_PROP_SPECS, ...WORLD_ROTORCRAFT_SPECS];

/** The model's bounds over its vertices, by axis. */
function bounds(m: MeshBuilder): { min: number[]; max: number[] } {
  const g = m.toGlb("t");
  const view = new DataView(g.buffer, g.byteOffset, g.byteLength);
  const jsonLen = view.getUint32(12, true);
  const json = JSON.parse(new TextDecoder().decode(g.subarray(20, 20 + jsonLen))) as { accessors: Array<{ min?: number[]; max?: number[]; type: string }>; meshes: Array<{ primitives: Array<{ attributes: { POSITION: number } }> }>; nodes: Array<{ mesh?: number; translation?: number[] }> };
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const n of json.nodes) {
    if (n.mesh === undefined) continue;
    const t = n.translation ?? [0, 0, 0];
    for (const p of json.meshes[n.mesh]!.primitives) {
      const a = json.accessors[p.attributes.POSITION]!;
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k]!, a.min![k]! + t[k]!);
        max[k] = Math.max(max[k]!, a.max![k]! + t[k]!);
      }
    }
  }
  return { min, max };
}

const partsOf = (m: MeshBuilder): string[] => (m as unknown as { parts: Array<{ name: string }> }).parts.map((p) => p.name);

describe("the world aircraft", () => {
  it("are the list's 100 aircraft, in the catalog's aircraft, each with its OpenTTD entry", () => {
    expect(ALL).toHaveLength(100);
    expect(WORLD_JETS.length + WORLD_PROPS.length + WORLD_ROTORCRAFT.length).toBe(100);
    for (const a of ALL) {
      const id = proceduralId(a.id);
      expect(DESIGNS.has(id), id).toBe(true);
      expect(DESIGNS.get(id)!.catalog).toMatchObject({ category: "Aircraft", group: "aircraft", yaw: 180 });
      const o = OPENTTD_TABLE[id];
      expect(o, id).toBeDefined();
      expect(o!.capacity).toBeGreaterThan(0);
      expect(["PASS", "GOOD"]).toContain(o!.cargo);
      expect(a.game.sizeClass, id).toBeDefined();
    }
  });

  for (const a of ALL) {
    describe(a.id, () => {
      const combos = sample(coverageCombinations(a.params, a.finishParams));
      it.each(combos.map((p) => [JSON.stringify(p), p] as const))("is its real size, on y = 0, in budget, its gear a part (%s)", (_n, params: ParamValues) => {
        const m = a.build(params);
        expect(m.triangleCount(), "the aircraft budget").toBeLessThanOrEqual(10_000);
        const lod = a.buildLod(params).triangleCount();
        expect(lod).toBeLessThanOrEqual(200);
        expect(lod).toBeGreaterThan(110);
        const b = bounds(m);
        expect(b.min[1]!, "on the ground").toBeGreaterThan(-0.02);
        expect(b.min[1]!, "on the ground").toBeLessThan(0.05);
        if (a.spec) {
          const s = a.spec(params);
          expect(b.max[0]! - b.min[0]!, "length").toBeCloseTo(s.length, 0);
          expect(b.max[1]!, "height").toBeCloseTo(s.height, 1);
          const span = Math.max(s.wing.span, s.wing.upper?.span ?? 0);
          expect(b.max[2]! - b.min[2]!, "span").toBeLessThan(span + 0.25);
          expect(b.max[2]! - b.min[2]!, "span").toBeGreaterThan(span - 0.3);
          const retract = s.gear.retract && s.gear.kind !== "none" && s.gear.kind !== "floats";
          expect(partsOf(m)).toEqual(retract ? ["airframe", "gear"] : []);
        } else if (ROTOR_SPECS[a.id]) {
          const s = ROTOR_SPECS[a.id]!(params);
          expect(b.max[1]!, "the rotor head's top").toBeGreaterThan(s.height - 0.05);
          expect(b.max[0]! - b.min[0]!, "the rotor disc or the fuselage").toBeGreaterThan(Math.max(s.main.r * 2, s.length) - 0.5);
        }
      });
    });
  }

  it("keeps an aircraft's colours to its livery: each livery adds its own materials", () => {
    for (const a of ALL.filter((x) => x.finishParams?.length)) {
      const name = a.finishParams![0]!;
      const values = a.params!.find((p) => p.name === name)!.values.map((v) => v.value);
      const mats = values.map((v) => new Set(Object.keys((a.build({ [name]: v }) as unknown as { palette: Record<string, unknown> }).palette)));
      for (let i = 1; i < mats.length; i++) expect(mats[i], `${a.id} ${values[i]}`).not.toEqual(mats[0]);
    }
  });

  it("moves the empennage forward so the fin and tailplane end at the published length", () => {
    for (const a of ALL.filter((x) => x.spec)) {
      const g = geometry(a.spec!());
      const aft = Math.min(...(g.fin ?? []).map((r) => r[1] - r[2]), ...g.plane.map((w) => w.lead - w.chord));
      expect(aft, a.id).toBeGreaterThan(-g.half - 0.05);
    }
  });

  it("turns the helicopters' main and tail rotors on the time clip \"rotor\", one closed loop", () => {
    for (const a of WORLD_ROTORCRAFT_SPECS.filter((x) => ROTOR_SPECS[x.id])) {
      const m = a.build();
      expect(partsOf(m), a.id).toEqual(expect.arrayContaining(["airframe", "rotor", "tailrotor"]));
      const clip = m.animations().find((c) => c.name === "rotor")!;
      expect(m.clipDrives()).toEqual({ rotor: { drive: "time" } });
      for (const t of clip.tracks) {
        const v = t.values;
        const n = v.length / 4;
        // the last sample is the first turned a whole number of times: the same rotation
        const dot = v[0]! * v[4 * (n - 1)]! + v[1]! * v[4 * (n - 1) + 1]! + v[2]! * v[4 * (n - 1) + 2]! + v[3]! * v[4 * (n - 1) + 3]!;
        expect(Math.abs(dot), `${a.id} ${t.node}`).toBeCloseTo(1, 6);
        // each step turns less than half a turn, so the interpolation goes the right way
        for (let i = 1; i < n; i++) {
          const d = v[4 * i]! * v[4 * (i - 1)]! + v[4 * i + 1]! * v[4 * (i - 1) + 1]! + v[4 * i + 2]! * v[4 * (i - 1) + 2]! + v[4 * i + 3]! * v[4 * (i - 1) + 3]!;
          expect(d).toBeGreaterThan(0);
        }
      }
    }
  });
});
