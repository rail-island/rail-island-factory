// Parametric models (generator/design.ts): enum parameters with defaults. The
// export builds the defaults; every combination must build as cleanly, and the
// standalone JS model must build any of them exactly as the generator does.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { DESIGNS } from "../generator/generate";
import { paramCombinations, resolveParams, type ParamSpec, type ParamValues } from "../generator/design";
import { exportVehicleMeta, metaEntry } from "../generator/catalog";
import { VEHICLES } from "../generator/vehicles";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { bundleDesign } from "../generator/jsModel";

const SPECS: ParamSpec[] = [
  { name: "variant", title: "Variant", default: "b", values: [{ value: "a", title: "A" }, { value: "b", title: "B" }] },
  { name: "roof", title: "Roof", default: "flat", values: [{ value: "flat", title: "Flat" }, { value: "hip", title: "Hip" }, { value: "dome", title: "Dome" }] },
];

const PARAMETRIC = [...DESIGNS.values()].filter((d) => d.params?.length);

type Build = (three: typeof THREE, params?: ParamValues) => THREE.Group;
async function loadModule(text: string): Promise<{ default: Build; params: ParamSpec[] }> {
  return (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`)) as { default: Build; params: ParamSpec[] };
}

/** The group's vertices per material name, world space, in draw order. */
function groupVertices(group: THREE.Group): Map<string, number[]> {
  group.updateMatrixWorld(true);
  const out = new Map<string, number[]>();
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    const v = new THREE.Vector3();
    const list = out.get(o.name) ?? [];
    for (let i = 0; i < pos.count; i++) list.push(...v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld).toArray());
    out.set(o.name, list);
  });
  return out;
}

describe("parametric models", () => {
  it("resolve missing parameters to their defaults and reject unknown names and values", () => {
    expect(resolveParams(SPECS)).toEqual({ variant: "b", roof: "flat" });
    expect(resolveParams(SPECS, { roof: "dome" })).toEqual({ variant: "b", roof: "dome" });
    expect(() => resolveParams(SPECS, { colour: "red" })).toThrow(/unknown parameter "colour"/);
    expect(() => resolveParams(SPECS, { roof: "spire" })).toThrow(/no value "spire"/);
  });

  it("enumerate every combination, the defaults first", () => {
    const all = paramCombinations(SPECS);
    expect(all).toHaveLength(6);
    expect(all[0]).toEqual({ variant: "b", roof: "flat" });
    expect(new Set(all.map((c) => JSON.stringify(c))).size).toBe(6);
    expect(paramCombinations()).toEqual([{}]);
  });

  it("declare valid enums: unique names and values, titles, a listed default", () => {
    expect(PARAMETRIC.length).toBeGreaterThan(0);
    for (const d of PARAMETRIC) {
      const names = d.params!.map((p) => p.name);
      expect(new Set(names).size).toBe(names.length);
      for (const p of d.params!) {
        expect(p.name).toMatch(/^[a-z][A-Za-z0-9]*$/);
        expect(p.title.length).toBeGreaterThan(0);
        expect(p.values.length).toBeGreaterThanOrEqual(2);
        expect(new Set(p.values.map((v) => v.value)).size).toBe(p.values.length);
        for (const v of p.values) expect(v.value).toMatch(/^[A-Za-z0-9]+$/);
        expect(p.values.map((v) => v.value)).toContain(p.default);
      }
    }
  });

  it("list their parameters in the export meta, and fixed models list none", () => {
    const meta = exportVehicleMeta(VEHICLES);
    for (const d of VEHICLES) {
      const entry = meta.vehicles.find((e) => e.id === d.id)!;
      if (d.params?.length) expect(entry.params).toEqual(d.params);
      else expect("params" in entry).toBe(false);
    }
    // the entry holds a copy: editing it cannot reach the design
    const d = PARAMETRIC[0]!;
    metaEntry(d).params![0]!.values.pop();
    expect(d.params![0]!.values.length).toBeGreaterThanOrEqual(2);
  });

  for (const d of PARAMETRIC) {
    it(`${d.id}: builds every combination deterministically, without flicker, inside the rail envelope`, () => {
      const rail = d.catalog?.category === "Rail vehicles";
      const defaults = d.build().toGlb(d.id);
      for (const combo of paramCombinations(d.params)) {
        const glb = d.build(combo).toGlb(d.id);
        expect(Buffer.from(d.build(combo).toGlb(d.id)).equals(Buffer.from(glb))).toBe(true);
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const s = glbStats(glb);
        expect(s.min[1]).toBeCloseTo(0, 5);
        expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
        if (rail) {
          expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(3.1);
          expect(s.triangles).toBeLessThanOrEqual(25_000);
        }
        if (JSON.stringify(combo) === JSON.stringify(paramCombinations(d.params)[0])) expect(Buffer.from(glb).equals(Buffer.from(defaults))).toBe(true);
      }
    });

    it(`${d.id}: the JS model exports its parameters and builds every combination like the generator`, async () => {
      const mod = await loadModule(await bundleDesign(d, "vehicles.ts"));
      expect(mod.params).toEqual(d.params);
      for (const combo of paramCombinations(d.params)) {
        const want = new Map<string, number[]>();
        const glb = parseGlb(d.build(combo).toGlb(d.id));
        for (const t of collectTriangles(glb.json, glb.bin)) want.set(t.material, [...(want.get(t.material) ?? []), ...t.p.flat()]);
        const got = groupVertices(mod.default(THREE, combo));
        expect([...got.keys()].sort()).toEqual([...want.keys()].sort());
        for (const [mat, pos] of want) {
          const have = got.get(mat)!;
          expect(have.length).toBe(pos.length);
          expect(Math.max(...pos.map((p, i) => Math.abs(p - have[i]!)))).toBeLessThan(1e-5);
        }
      }
      expect(() => mod.default(THREE, { variant: "nope" })).toThrow();
    }, 60_000);
  }
});
