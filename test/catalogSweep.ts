// The checks every design gets, in one pass per design: each is built and
// bundled once (test/catalogCache.ts) and every per-design invariant of the
// mesh builder, the source tree, the standalone JS model, the LOD, the
// parameters and the rig runs on that one build. test/catalog-<n>.test.ts each
// run a sixteenth of the catalog, so the workers share the work.
//
// A parametric design checks its defaults and a fixed sample of its other
// combinations (variantsUnderTest); TEST_ALL_VARIANTS=1 checks every one.

import { afterAll, describe, expect, it } from "vitest";
import * as THREE from "three";
import { toGlb } from "../generator/generate";
import { lodBudget } from "../generator/lod";
import { buildLodModel } from "../generator/lodModel";
import { LOD_GLASS } from "../generator/lodKit";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { glbStats } from "../generator/glbStats";
import { readAccessor } from "../generator/glbParse";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { steerAngles, type VehicleRig } from "../generator/rig";
import { isLeaf, type TreeNode } from "../generator/sourceTree";
import { VEHICLES } from "../generator/vehicles";
import { loadingGaugeOf } from "../generator/loadingGauge";
import { built, built as cached, design, forget, glbOf, jsModuleOf, jsTextOf, lodGlbOf, rebuildsSampleInJs, variantsUnderTest } from "./catalogCache";
import { expectSealed, jointMesh } from "./rigHelpers";
import { expectEmittersOnMouths } from "./emitterCheck";

/** The most a prop's or a set preview's JS model may weigh: the builder runtime and its boxes. */
const PROP_JS_LIMIT = 24_000;
const PREVIEW_JS_LIMIT = 80_000;

function walk(n: TreeNode, out: TreeNode[] = []): TreeNode[] {
  out.push(n);
  if (!isLeaf(n)) for (const c of n.children) walk(c, out);
  return out;
}

/** The group's vertices per material name, world space, in draw order. */
function groupVertices(group: THREE.Object3D): Map<string, number[]> {
  group.updateMatrixWorld(true);
  const out = new Map<string, number[]>();
  const v = new THREE.Vector3();
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    const list = out.get(o.name) ?? [];
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      list.push(v.x, v.y, v.z);
    }
    out.set(o.name, list);
  });
  return out;
}

/** A GLB's vertices per material, in draw order, with each material's colour (a vehicle's hidden interior too). */
function glbVertices(glb: Uint8Array): { positions: Map<string, number[]>; colors: Map<string, number[]> } {
  const { json, bin } = parseGlb(glb);
  const positions = new Map<string, number[]>();
  const colors = new Map<string, number[]>();
  for (const t of collectTriangles(json, bin, { interiors: true })) {
    const list = positions.get(t.material) ?? [];
    for (const p of t.p) list.push(...p);
    positions.set(t.material, list);
    colors.set(t.material, t.color);
  }
  return { positions, colors };
}

/** The same vertices, material by material, to 1e-5 m. */
function expectSameVertices(got: Map<string, number[]>, want: Map<string, number[]>): void {
  expect([...got.keys()].sort()).toEqual([...want.keys()].sort());
  for (const [mat, pos] of want) {
    const have = got.get(mat)!;
    expect(have.length).toBe(pos.length);
    let worst = 0;
    for (let i = 0; i < pos.length; i++) worst = Math.max(worst, Math.abs(have[i]! - pos[i]!));
    expect(worst, mat).toBeLessThan(1e-5);
  }
}

/** A group's triangle count, every vertex finite and every normal unit length. */
function lodTriangles(group: THREE.Object3D): number {
  let count = 0;
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const p = o.geometry.getAttribute("position");
    const n = o.geometry.getAttribute("normal");
    count += p.count / 3;
    expect(Array.from(p.array as ArrayLike<number>).every(Number.isFinite)).toBe(true);
    // one assertion per mesh: an expect() per vertex costs more than the check itself
    let worst = 0;
    for (let i = 0; i < n.count; i++) worst = Math.max(worst, Math.abs(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) - 1));
    expect(worst, o.name).toBeLessThan(5e-6);
  });
  return count;
}

/** Register the per-design checks of `ids` (built ahead with catalogCache's warm()). */
export function sweep(ids: readonly string[]): void {
  for (const id of ids) {
    const d = design(id);
    const parametric = (d.params ?? []).length > 0;
    const rig = built(id).rig;
    const variants = variantsUnderTest(d);

    describe(id, () => {
      afterAll(() => forget(id));

      // Regression: the art deco tower's roofs flickered seen from above -- each
      // tier's dark core, its stone piers and its cornice all ended at one height.
      it("has no z-fighting faces", () => {
        expect(findCoplanarOverlaps(glbOf(id))).toEqual([]);
      });

      // Smoke, steam and flames rise from the mouth of a stack (docs/models/emitters.md):
      // the defaults here, the sampled combinations below, every combination of the
      // designs test/emitters.test.ts names
      it("puts its emitters on the mouths they rise from, and states fountain water only if a fountain", () => {
        const b = built(id);
        expectEmittersOnMouths(b.emitters, b.positions ?? [], id);
        expect(b.fountain).toBe(/fountain/.test(id));
      });

      // (a parametric design's second build is its defaults combination's, below)
      if (!parametric)
        it("builds the same GLB bytes (the game's LOD cache) and source tree every time", () => {
          const again = d.build();
          expect(Buffer.from(toGlb(id, again)).equals(Buffer.from(glbOf(id)))).toBe(true);
          expect(JSON.stringify(again.sourceTree(d.id, d.title))).toBe(JSON.stringify(built(id).tree));
        });

      // The site's source tree is only readable when every primitive sits in a
      // named scope; it highlights and picks through the leaves' triangle ranges,
      // so they must tile each material's GLB primitive exactly.
      it("draws every primitive inside a named scope, its tree's ranges tiling its GLB", () => {
        const { tree, glb } = built(id);
        expect(tree.root.children.length).toBeGreaterThan(0);
        expect(tree.root.children.filter(isLeaf).map((l) => l.id)).toEqual([]);
        const nodes = walk(tree.root);
        expect(new Set(nodes.map((n) => n.id)).size).toBe(nodes.length);
        const { json, bin } = parseGlb(glb);
        // the model at rest: a vehicle's hidden interiors are out of both
        const byMat = new Map<string, ReturnType<typeof collectTriangles>>();
        for (const t of collectTriangles(json, bin)) {
          if (!byMat.has(t.material)) byMat.set(t.material, []);
          byMat.get(t.material)!.push(t);
        }
        expect(tree.materials).toEqual([...byMat.keys()].sort());
        expect(tree.triangles).toBe(glbStats(glb).triangles);
        expect(tree.root.triangles).toBe(tree.triangles);
        const leaves = nodes.filter(isLeaf);
        for (const mat of tree.materials) {
          const ranges = leaves.filter((l) => l.material === mat).map((l) => l.tri).sort((a, b) => a[0] - b[0]);
          let next = 0;
          for (const [first, count] of ranges) {
            expect(first).toBe(next);
            next += count;
          }
          expect(next).toBe(byMat.get(mat)!.length);
        }
        // each leaf's bounds are its triangles' (one pass a leaf, the misfits collected for one assertion)
        const misfits: string[] = [];
        for (const leaf of leaves) {
          if (leaf.tri[1] === 0) continue;
          const tris = byMat.get(leaf.material)!;
          const lo = [Infinity, Infinity, Infinity];
          const hi = [-Infinity, -Infinity, -Infinity];
          for (let t = leaf.tri[0]; t < leaf.tri[0] + leaf.tri[1]; t++)
            for (const p of tris[t]!.p)
              for (let k = 0; k < 3; k++) {
                if (p[k]! < lo[k]!) lo[k] = p[k]!;
                if (p[k]! > hi[k]!) hi[k] = p[k]!;
              }
          for (let k = 0; k < 3; k++)
            if (!(Math.abs(lo[k]! - leaf.min![k]!) < 0.002 && Math.abs(hi[k]! - leaf.max![k]!) < 0.002)) misfits.push(`${leaf.id} axis ${k}`);
        }
        expect(misfits).toEqual([]);
      });

      // The standalone JS model is the design's own code, so the group it builds
      // carries the very triangles, colours and nodes of the design's GLB.
      it("builds in JS the GLB's triangles, colours, nodes, rig and animation clips", async () => {
        const group = (await jsModuleOf(id)).default(THREE);
        expect(group.userData.lod).toBe(false);
        const glb = glbOf(id);
        const { positions, colors } = glbVertices(glb);
        expectSameVertices(groupVertices(group), positions);
        group.traverse((o) => {
          if (!(o instanceof THREE.Mesh)) return;
          const c = (o.material as THREE.MeshStandardMaterial).color; // linear, like baseColorFactor
          const want = colors.get(o.name)!;
          expect([c.r, c.g, c.b].map((v, k) => Math.abs(v - want[k]!)).every((x) => x < 1e-4)).toBe(true);
        });
        const { json, bin } = parseGlb(glb);
        const nodes = (json.nodes ?? []) as Array<{ name: string; children?: number[] }>;
        const nodeNames = nodes.map((n) => n.name);
        // a model's parts are child groups, nested as the GLB's nodes are; a rigid
        // vehicle's one node ("vehicle") is the group itself, its meshes the group's children
        if (id.startsWith("veh-") && !(nodeNames.length === 1 && nodeNames[0] === "vehicle")) {
          const roots = (json.scenes![0] as { nodes: number[] }).nodes;
          expect(group.children.map((c) => c.name)).toEqual(roots.map((i) => nodeNames[i]));
          // the group's objects by name, the first of each as getObjectByName finds it
          const byName = new Map<string, THREE.Object3D>();
          group.traverse((o) => { if (!byName.has(o.name)) byName.set(o.name, o); });
          nodes.forEach((n) => {
            const holder = byName.get(n.name)!;
            const kids = holder.children.filter((c) => !(c instanceof THREE.Mesh)).map((c) => c.name);
            expect(kids).toEqual((n.children ?? []).map((i) => nodeNames[i]));
          });
        }
        // a rigged model's rig rides along, as the GLB's scene extras; so do a vehicle's lamps
        expect(group.userData.rig).toEqual((json.scenes![0] as { extras?: { rig?: unknown } }).extras?.rig);
        expect(group.userData.lamps).toEqual((json.scenes![0] as { extras?: { lamps?: unknown } }).extras?.lamps);
        // so do its interiors, each built hidden (docs/models/interiors.md)
        const interiors = (json.scenes![0] as { extras?: { interiors?: Record<string, string[]> } }).extras?.interiors;
        expect(group.userData.interiors).toEqual(interiors);
        for (const name of Object.keys(interiors ?? {})) expect(group.getObjectByName(name)!.visible).toBe(false);
        expect(group.name).toBe(id);
        const anims = ((json as unknown as { animations?: Array<{ name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number }> }> }).animations) ?? [];
        expect(group.animations.map((c) => c.name)).toEqual(anims.map((a) => a.name));
        anims.forEach((a, i) => {
          const clip = group.animations[i]!;
          const times = readAccessor(json, bin, a.samplers[0]!.input);
          expect(clip.duration).toBeCloseTo(times[times.length - 1]!, 5);
          expect(clip.tracks.map((t) => t.name)).toEqual(
            a.channels.map((c) => `${nodes[c.target.node]!.name}.${c.target.path === "rotation" ? "quaternion" : "position"}`),
          );
          clip.tracks.forEach((t, k) => {
            const v = readAccessor(json, bin, a.samplers[a.channels[k]!.sampler]!.output);
            expect(t.values.length).toBe(v.length);
            // one assertion a track (toBeCloseTo(x, 4): within 5e-5)
            let worst = 0;
            t.values.forEach((x, n) => (worst = Math.max(worst, Math.abs(x - v[n]!))));
            expect(worst, t.name).toBeLessThan(5e-5);
          });
          for (const t of clip.tracks) expect(group.getObjectByName(t.name.split(".")[0]!)).toBeDefined();
        });
      });

      it("ships a standalone JS file smaller than its full and LOD GLBs", async () => {
        const text = await jsTextOf(id);
        const code = text.replace(/^\/\/.*\n/, ""); // the banner comment
        expect(code).not.toMatch(/\bimport\s*[\w{*"'(]/);
        expect(code).not.toMatch(/["'`]node:|require\(/); // a rig's { node: "..." } keys are data
        expect(text).toMatch(/export\s*\{[^}]*\bas default\b/);
        // A structure prop or a set preview of a few boxes (a bollard, a container, a
        // pylon: docs/models/props.md) is smaller as a GLB than the builder runtime
        // every JS model carries, so it is held to the runtime and a little more
        // -- a set preview, which carries its whole set module and is never exported
        // to the game, to twice that -- or to its GLBs when those are larger;
        // every other design must beat its GLBs.
        const boxes = design(id).catalog?.category === "Props" || id.startsWith("proc-preview-");
        const limit = id.startsWith("proc-preview-") ? PREVIEW_JS_LIMIT : PROP_JS_LIMIT;
        if (boxes) expect(Buffer.byteLength(text)).toBeLessThan(Math.max(limit, glbOf(id).length + lodGlbOf(id).length));
        else expect(Buffer.byteLength(text)).toBeLessThan(glbOf(id).length + lodGlbOf(id).length);
      });

      it("builds its standalone LOD as the generator does, inside its budget", async () => {
        const mod = await jsModuleOf(id);
        expect(mod.lodTriangleBudget).toBe(lodBudget(d));
        const low = mod.default(THREE, undefined, true);
        expect(low.userData.lod).toBe(true);
        expect(low.name).toBe(id);
        const expected = buildLodModel(d);
        const lowTriangles = lodTriangles(low);
        expect(lowTriangles).toBeGreaterThan(0);
        expect(lowTriangles).toBeLessThanOrEqual(lodBudget(d));
        expect(lowTriangles).toBe(expected.triangleCount());
        // deterministic: this build's bytes are those of the cached one, built apart from it
        expect(expected.toGlb(id)).toEqual(lodGlbOf(id));
        expect(low.animations).toHaveLength(0);
        // a LOD is static but for an articulated vehicle's sections and joints (no supports, no steering)
        const lowRig = low.userData.rig as VehicleRig | undefined;
        if (lowRig !== undefined) {
          expect(Object.keys(lowRig).sort()).toEqual(["joints", "maxBendDeg", "sections"]);
          expect(lowRig.sections!.length).toBeGreaterThan(1);
        }
        low.traverse((o) => { if (o !== low && !(o instanceof THREE.Mesh)) expect(o.name).toMatch(/^(section|joint)[0-9]+$/); });
        // the same triangles, in model space, as the generator's GLB (compared as sets: node order may differ)
        const { json, bin } = parseGlb(lodGlbOf(id));
        const key = (p: number[]) => p.map((v) => v.toFixed(4)).join(",");
        const reference = new Map<string, string[]>();
        for (const f of collectTriangles(json, bin)) {
          const list = reference.get(f.material) ?? [];
          list.push(f.p.map(key).join("|"));
          reference.set(f.material, list);
        }
        const got = new Map<string, string[]>();
        low.updateMatrixWorld(true);
        const v = new THREE.Vector3();
        low.traverse((o) => {
          if (!(o instanceof THREE.Mesh)) return;
          const pos = o.geometry.getAttribute("position");
          const list = got.get(o.name) ?? [];
          for (let i = 0; i < pos.count; i += 3) {
            const tri: string[] = [];
            for (let k = 0; k < 3; k++) { v.fromBufferAttribute(pos, i + k).applyMatrix4(o.matrixWorld); tri.push(key([v.x, v.y, v.z])); }
            list.push(tri.join("|"));
          }
          got.set(o.name, list);
        });
        expect([...got.keys()].sort()).toEqual([...reference.keys()].sort());
        for (const [mat, list] of got) expect([...list].sort()).toEqual([...reference.get(mat)!].sort());
        if (mod.pose) {
          const before = low.toJSON();
          mod.pose(low, { steer: 0.4, bend: [0.3, 0.2] });
          if (lowRig?.joints?.length) mod.renderJoint?.(low, 0);
          // posing moves an articulated LOD's sections and nothing of a static one
          if (lowRig === undefined) expect(low.toJSON()).toEqual(before);
          else expect(low.getObjectByName("section1")!.rotation.y).not.toBe(0);
        }
      });

      it.each(variants.map((v) => [JSON.stringify(v), v] as const))("builds a LOD without flicker or detail fragments for %s", (_, values) => {
        const model = buildLodModel(d, values);
        const glb = model.toGlb(id);
        expect(model.triangleCount()).toBeGreaterThan(0);
        expect(model.triangleCount()).toBeLessThanOrEqual(lodBudget(d));
        expect(findCoplanarOverlaps(glb)).toEqual([]);
        const { json, bin } = parseGlb(glb);
        const faces = collectTriangles(json, bin);
        expect(faces.every((f) => f.p.flat().every(Number.isFinite))).toBe(true);
        expect(model.animations()).toEqual([]);
        if (id.startsWith("proc-vehicle-")) {
          // detail materials never reach a LOD; the one dark LOD glass of windscreens and window bands may
          expect(faces.some((f) => f.material !== LOD_GLASS && /glass|window|rubber|tyre|lamp|logo|badge|number/i.test(f.material))).toBe(false);
        }
      });

      if (parametric) {
        it.each(variants.map((v, i) => [JSON.stringify(v), v, i] as const))("builds %s without flicker, inside its envelope, in JS as in the generator", async (_, combo, i) => {
          const rail = d.catalog?.category === "Rail vehicles";
          // a vehicle is centred on its track or lane; a building need not be
          const vehicle = VEHICLES.includes(d);
          const built = d.build(combo);
          const glb = built.toGlb(d.id);
          expectEmittersOnMouths(built.emitters(), built.emitters().length ? built.positions() : [], `${id} ${JSON.stringify(combo)}`);
          // the first combination is the defaults, built a second time: the same bytes
          // and source tree as the cached build given no values (the design builds the
          // same every time, the game's LOD cache relies on it), whose faces "has no
          // z-fighting faces" already checks
          if (i === 0) {
            expect(Buffer.from(toGlb(id, built)).equals(Buffer.from(glbOf(id)))).toBe(true);
            expect(JSON.stringify(built.sourceTree(d.id, d.title))).toBe(JSON.stringify(cached(id).tree));
          } else expect(findCoplanarOverlaps(glb)).toEqual([]);
          const s = glbStats(glb);
          expect(s.min[1]).toBeCloseTo(0, 5);
          if (vehicle) expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
          if (rail) {
            expect(s.max[2] - s.min[2]).toBeLessThanOrEqual(loadingGaugeOf(d).width);
            // a whole train of rigid cars (an articulated set whose sections ride on
            // their own bogies) may spend a car's budget on every car
            const cars = built.rig?.sections?.length ?? 1;
            expect(s.triangles).toBeLessThanOrEqual(Math.max(25_000, 16_000 * cars));
          }
          const mod = await jsModuleOf(id);
          expect(mod.params).toEqual(d.params);
          // the defaults' JS group is "builds in JS the GLB's triangles"'s
          if (i > 0 && rebuildsSampleInJs(id)) expectSameVertices(groupVertices(mod.default(THREE, combo)), glbVertices(glb).positions);
          expect(() => mod.default(THREE, { variant: "nope" })).toThrow();
        });
      }

      if (rig) {
        it("poses: pose() turns the wheels and lays the sections out as a hinged chain", async () => {
          const mod = await jsModuleOf(id);
          const group = mod.default(THREE);
          const r = group.userData.rig as VehicleRig;
          const hinges = Math.max(0, (r.sections?.length ?? 0) - 1);
          const bend = Array.from({ length: hinges }, (_, i) => (i % 2 ? -1 : 1) * 0.4);
          mod.pose!(group, { steer: 0.3, bend });
          if (r.steer) {
            const angles = steerAngles(r.steer, 0.3);
            r.steer.axles.forEach((a, k) => a.nodes.forEach((n, i) => expect(group.getObjectByName(n)!.rotation.y).toBeCloseTo(angles[k]![i]!, 9)));
          }
          group.updateMatrixWorld(true);
          const sections = r.sections ?? [];
          for (let i = 1; i < sections.length; i++) {
            // the hinge is where both the section ahead and this one put it
            const ahead = group.getObjectByName(sections[i - 1]!.node)!;
            const self = group.getObjectByName(sections[i]!.node)!;
            const p = sections[i]!.pivot;
            const q = sections[i - 1]!.pivot;
            const fromAhead = new THREE.Vector3(p[0] - q[0], p[1] - q[1], p[2] - q[2]).applyMatrix4(ahead.matrixWorld);
            const fromSelf = new THREE.Vector3(0, 0, 0).applyMatrix4(self.matrixWorld);
            expect(fromAhead.distanceTo(fromSelf)).toBeLessThan(1e-9);
            expect(self.rotation.y - ahead.rotation.y).toBeCloseTo(bend[i - 1]!, 9);
          }
          expectSealed(group, r);
          // back to rest: the build's geometry again
          mod.pose!(group, {} as { steer: number; bend: number[] });
          for (const a of r.steer?.axles ?? []) for (const n of a.nodes) expect(group.getObjectByName(n)!.rotation.y).toBe(0);
          const fresh = mod.default(THREE);
          for (const s of sections) {
            const n = group.getObjectByName(s.node)!;
            expect(n.position.toArray()).toEqual(fresh.getObjectByName(s.node)!.position.toArray());
            expect(n.rotation.y).toBe(0);
          }
          for (const j of r.joints ?? []) {
            const got = jointMesh(group, j).geometry.getAttribute("position").array;
            const want = jointMesh(fresh, j).geometry.getAttribute("position").array;
            expect(Math.max(...Array.from(got, (x, i) => Math.abs(x - want[i]!)))).toBeLessThan(1e-5);
          }
        });
      }
    });
  }
}
