// The world aircraft on the airframe and rotor kits (generator/airframeKit.ts,
// generator/rotorKit.ts, generator/worldJets.ts, worldProps.ts, worldRotorcraft.ts,
// docs/models/world-aircraft.md): each at its published length, span and height,
// on its wheels (floats, hull) at y = 0, in budget with its LOD, its retractable
// gear the part "gear", its liveries changing its colours; the helicopters' rotors
// turning on the time clip "rotor"; every kit aircraft's windscreen; the propellers
// turning on the time clip "propellers", the big jets' flaps and Concorde's nose on
// their state clips; and every aircraft has its OpenTTD entry.

import { describe, expect, it } from "vitest";
import { WORLD_JET_SPECS, WORLD_JETS } from "../generator/worldJets";
import { WORLD_PROP_SPECS, WORLD_PROPS } from "../generator/worldProps";
import { ROTOR_SPECS, WORLD_ROTORCRAFT, WORLD_ROTORCRAFT_SPECS } from "../generator/worldRotorcraft";
import { DESIGNS } from "../generator/generate";
import { OPENTTD_TABLE } from "../generator/openttdTable";
import { proceduralId } from "../generator/modelId";
import { coverageCombinations, HELIPAD_D, type ParamValues } from "../generator/design";
import { geometry } from "../generator/airframeKit";
import type { MeshBuilder } from "../generator/meshBuilder";
import { sample } from "./catalogCache";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { poseGlb } from "../generator/glbPose";
import { collectTriangles, parseGlb, type Tri } from "../generator/glbTriangles";
import { PROP_PERIOD } from "../generator/propellers";

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

const trisOf = (glb: Uint8Array): Tri[] => {
  const { json, bin } = parseGlb(glb);
  return collectTriangles(json, bin, {});
};

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
      // a helicopter uses pads, not airport classes (docs/models/game-properties.md)
      if (a.game.aircraftKind === "helicopter") {
        expect(a.game.sizeClass, id).toBeUndefined();
        expect(a.game.flight, id).toBeDefined();
      } else expect(a.game.sizeClass, id).toBeDefined();
    }
  });

  it("gives every rotor-kit design the helicopter kind, and the pad class its D-value fits", () => {
    for (const a of WORLD_ROTORCRAFT_SPECS) {
      const spec = ROTOR_SPECS[a.id];
      if (!spec) {
        expect(a.game.aircraftKind, a.id).toBeUndefined(); // the airship stays an aeroplane-like aircraft
        continue;
      }
      expect(a.game.aircraftKind, a.id).toBe("helicopter");
      const s = spec();
      // the overall length with the rotors turning: the main disc ahead of the nose to the boom's end or the disc's rear
      const d = Math.max(s.length, s.main.d + s.main.r) - Math.min(0, s.main.d - s.main.r);
      const pad = a.game.flight!.pad;
      expect(d, a.id).toBeLessThanOrEqual(HELIPAD_D[pad]);
      if (pad === "large") expect(d, a.id).toBeGreaterThan(HELIPAD_D.small);
    }
  });

  for (const a of ALL) {
    describe(a.id, () => {
      // a combination that only repaints (a livery) adds no shape to check: the defaults stand for it
      const finish = new Set(a.finishParams ?? []);
      const all = sample(coverageCombinations(a.params, a.finishParams));
      const combos = (a.params ?? []).every((p) => finish.has(p.name)) ? all.slice(0, 1) : all;
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
          // the moving pieces are child nodes: the propellers, the flaps and a drooping nose
          const moving = (p: string) => /^(propeller-\d+|flap-(left|right)-\d+|nose)$/.test(p);
          expect(partsOf(m).filter((p) => !moving(p))).toEqual(retract ? ["airframe", "gear"] : []);
          const props = s.engines.reduce((t, e) => t + (e.kind === "prop" ? e.s.length * (e.s.includes(0) ? 1 : 2) : 0), 0);
          expect(partsOf(m).filter((p) => p.startsWith("propeller-")), "a part per propeller").toHaveLength(props);
          expect(partsOf(m).some((p) => p.startsWith("flap-")), "flaps").toBe(s.wing.flaps === true);
          expect(partsOf(m).includes("nose"), "a drooping nose").toBe(s.fuselage.droop !== undefined);
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
      // the default and the last livery (sampled, as test/catalogCache.ts sample does)
      const values = sample(a.params!.find((p) => p.name === name)!.values.map((v) => v.value));
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

  // regression: the windscreen's guard was inverted (the crown rises aft, so the screen's top edge lies behind its foot) and no kit aircraft had one
  it("glazes every kit aircraft's windscreen: glass on the nose ahead of the cabin windows", () => {
    for (const a of ALL.filter((x) => x.spec)) {
      const spec = a.spec!();
      const g = geometry(spec);
      expect(g.screen.d1, a.id).toBeGreaterThan(g.screen.d0);
      const tris = trisOf(a.build().toGlb("t"));
      const ahead = g.x(Math.min(g.screen.d1 + 0.3, ...spec.windows.map((w) => w.from - 0.3)));
      const screen = tris.filter((t) => t.material === "glass" && t.p.every((p) => p[0] > ahead && p[1] > g.screen.y0 - 0.2));
      expect(screen.length, a.id).toBeGreaterThan(20);
      expect(tris.every((t) => t.p.every((p) => p.every(Number.isFinite))), a.id).toBe(true);
    }
  });

  it("turns every propeller on the time clip \"propellers\", a closed loop of steps under half a turn", () => {
    const withProps = ALL.filter((a) => a.spec?.().engines.some((e) => e.kind === "prop") || a.id === "veh-zeppelin-nt");
    expect(withProps.length).toBeGreaterThan(30);
    for (const a of withProps) {
      const m = a.build();
      const clip = m.animations().find((c) => c.name === "propellers")!;
      expect(clip, a.id).toBeDefined();
      expect(m.clipDrives()?.propellers, a.id).toEqual({ drive: "time" });
      expect(clip.times[clip.times.length - 1]).toBeCloseTo(PROP_PERIOD, 9);
      expect(clip.tracks.map((t) => t.node).sort(), a.id).toEqual(partsOf(m).filter((p) => p.startsWith("propeller")).sort());
      for (const t of clip.tracks) {
        const v = t.values;
        const n = v.length / 4;
        const dot = (i: number, j: number) => v[4 * i]! * v[4 * j]! + v[4 * i + 1]! * v[4 * j + 1]! + v[4 * i + 2]! * v[4 * j + 2]! + v[4 * i + 3]! * v[4 * j + 3]!;
        expect(Math.abs(dot(0, n - 1)), `${a.id} ${t.node}`).toBeCloseTo(1, 6);
        for (let i = 1; i < n; i++) expect(dot(i, i - 1)).toBeGreaterThan(0);
      }
      // no z-fighting a quarter of the way round
      expect(findCoplanarOverlaps(poseGlb(m.toGlb("t"), 3, m.animations().indexOf(clip))), a.id).toEqual([]);
    }
  });

  it("runs the big jets' flaps out and down on the state clip \"flaps\", hidden in the wing at rest", () => {
    const flapped = ALL.filter((a) => a.spec?.().wing.flaps);
    expect(flapped.map((a) => a.id).sort()).toEqual(["veh-airbus-a350", "veh-antonov-an225", "veh-boeing-707", "veh-boeing-747-8", "veh-boeing-777"]);
    for (const a of flapped) {
      const m = a.build();
      const k = m.animations().findIndex((c) => c.name === "flaps");
      expect(m.clipDrives()?.flaps, a.id).toEqual({ drive: "flaps" });
      const glb = m.toGlb("t");
      const last = m.animations()[k]!.times.length - 1;
      const out = poseGlb(glb, last, k);
      expect(findCoplanarOverlaps(out), a.id).toEqual([]);
      // the flaps' trailing edges drop well below where they rest inside the wing
      const [rest, landing] = [trisOf(glb), trisOf(out)];
      expect(rest.length).toBe(landing.length);
      expect(landing.some((t, i) => t.p.some((p, j) => rest[i]!.p[j]![1] - p[1] > 0.3)), a.id).toBe(true);
    }
  });

  it("droops Concorde's nose on the state clip \"nose\" for the airport", () => {
    const a = ALL.find((x) => x.id === "veh-concorde")!;
    const m = a.build();
    const k = m.animations().findIndex((c) => c.name === "nose");
    expect(m.clipDrives()?.nose).toEqual({ drive: "droop" });
    const glb = m.toGlb("t");
    const down = poseGlb(glb, m.animations()[k]!.times.length - 1, k);
    expect(findCoplanarOverlaps(down)).toEqual([]);
    const tip = (t: Tri[]) => t.reduce((b, q) => q.p.reduce((c, p) => (p[0] > c[0] ? p : c), b), [-Infinity, 0, 0] as number[]);
    const [up, dn] = [tip(trisOf(glb)), tip(trisOf(down))];
    expect(up[1]! - dn[1]!, "the tip drops").toBeGreaterThan(1);
    expect(dn[1]!, "above the ground").toBeGreaterThan(0.5);
  });
});
