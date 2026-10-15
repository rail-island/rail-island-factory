// The standalone JS models (generator/jsModel.ts): each export/js/<id>.js is the
// design's own code, so the THREE.Group it builds must carry the very triangles of
// the design's GLB -- and the file must really be standalone.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { DESIGNS, designGlb, designSource, generateJsModels } from "../generator/generate";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { readAccessor } from "../generator/glbParse";
import { bundleDesign, gzipSize } from "../generator/jsModel";
import { SKYSCRAPERS } from "../generator/skyscrapers";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

type Build = (three: typeof THREE) => THREE.Group;

async function loadModel(text: string): Promise<Build> {
  const url = `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`;
  return ((await import(/* @vite-ignore */ url)) as { default: Build }).default;
}

/** The group's triangles per material name, world space, in draw order. */
function groupTriangles(group: THREE.Group): Map<string, number[]> {
  group.updateMatrixWorld(true);
  const out = new Map<string, number[]>();
  group.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return;
    const pos = o.geometry.getAttribute("position");
    const list = out.get(o.name) ?? [];
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
      list.push(v.x, v.y, v.z);
    }
    out.set(o.name, list);
  });
  return out;
}

const JS = new Map<string, string>();
async function jsOf(id: string): Promise<string> {
  if (!JS.has(id)) JS.set(id, await bundleDesign(DESIGNS.get(id)!, designSource(id)));
  return JS.get(id)!;
}

describe("standalone JS models", () => {
  for (const id of DESIGNS.keys()) {
    it(`${id}: build(THREE) draws the GLB's triangles, colours and nodes`, async () => {
      const group = (await loadModel(await jsOf(id)))(THREE);
      const glb = parseGlb(designGlb(id));
      const expected = new Map<string, number[]>();
      const colors = new Map<string, number[]>();
      for (const t of collectTriangles(glb.json, glb.bin)) {
        const list = expected.get(t.material) ?? [];
        for (const p of t.p) list.push(...p);
        expected.set(t.material, list);
        colors.set(t.material, t.color);
      }
      const got = groupTriangles(group);
      expect([...got.keys()].sort()).toEqual([...expected.keys()].sort());
      for (const [mat, pos] of expected) {
        const have = got.get(mat)!;
        expect(have.length).toBe(pos.length);
        let worst = 0;
        for (let i = 0; i < pos.length; i++) worst = Math.max(worst, Math.abs(have[i]! - pos[i]!));
        expect(worst).toBeLessThan(1e-5);
      }
      group.traverse((o) => {
        if (!(o instanceof THREE.Mesh)) return;
        const c = (o.material as THREE.MeshStandardMaterial).color; // linear, like baseColorFactor
        const want = colors.get(o.name)!;
        expect([c.r, c.g, c.b].map((v, k) => Math.abs(v - want[k]!)).every((d) => d < 1e-4)).toBe(true);
      });
      const nodeNames = (glb.json.nodes ?? []).map((n) => (n as { name?: string }).name);
      // an articulated vehicle's parts are child groups; a rigid vehicle's one node
      // ("vehicle") is the group itself, its meshes the group's children
      if (id.startsWith("veh-") && !(nodeNames.length === 1 && nodeNames[0] === "vehicle")) expect(group.children.map((c) => c.name)).toEqual(nodeNames);
      expect(group.name).toBe(id);
    }, 30_000);

    it(`${id}: build(THREE) carries the GLB's animation clips`, async () => {
      const group = (await loadModel(await jsOf(id)))(THREE);
      const { json, bin } = parseGlb(designGlb(id));
      const g = json as unknown as {
        nodes: Array<{ name: string }>;
        animations?: Array<{ name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number }> }>;
      };
      const anims = g.animations ?? [];
      expect(group.animations.map((c) => c.name)).toEqual(anims.map((a) => a.name));
      anims.forEach((a, i) => {
        const clip = group.animations[i]!;
        const times = readAccessor(json, bin, a.samplers[0]!.input);
        expect(clip.duration).toBeCloseTo(times[times.length - 1]!, 5);
        expect(clip.tracks.map((t) => t.name)).toEqual(
          a.channels.map((c) => `${g.nodes[c.target.node]!.name}.${c.target.path === "rotation" ? "quaternion" : "position"}`),
        );
        clip.tracks.forEach((t, k) => {
          const v = readAccessor(json, bin, a.samplers[a.channels[k]!.sampler]!.output);
          expect(t.values.length).toBe(v.length);
          t.values.forEach((x, n) => expect(x).toBeCloseTo(v[n]!, 4));
        });
        // every track binds to a node of the group
        for (const t of clip.tracks) expect(group.getObjectByName(t.name.split(".")[0]!)).toBeDefined();
      });
    });

    it(`${id}: the file is standalone and smaller than the GLB`, async () => {
      const text = await jsOf(id);
      const code = text.replace(/^\/\/.*\n/, ""); // the banner comment
      expect(code).not.toMatch(/\bimport\s*[\w{*"'(]/);
      expect(code).not.toMatch(/["']node:|require\(/);
      expect(text).toMatch(/export\s*\{[^}]*\bas default\b/);
      expect(Buffer.byteLength(text)).toBeLessThan(designGlb(id).length);
    });
  }

  it("leaves the recorder and the GLB writer out of the bundle", async () => {
    const text = await jsOf("sky-pyramid");
    expect(text).not.toContain("glTF");
    expect(text).not.toContain("baseColorFactor");
    expect(text).not.toContain("MeshBuilder");
  });

  it("is deterministic and reports gzip sizes", async () => {
    const a = await bundleDesign(SKYSCRAPERS[0]!, "skyscrapers.ts");
    expect(await bundleDesign(SKYSCRAPERS[0]!, "skyscrapers.ts")).toBe(a);
    expect(gzipSize(a)).toBeLessThan(Buffer.byteLength(a));
  });

  it("generateJsModels writes js/<id>.js, leaves unchanged files alone and drops stale ones", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-js-"));
    try {
      const designs = [SKYSCRAPERS[0]!, SKYSCRAPERS[1]!];
      await generateJsModels(dir, designs);
      const file = path.join(dir, "js", `${designs[0]!.id}.js`);
      expect(fs.existsSync(file)).toBe(true);
      fs.writeFileSync(path.join(dir, "js", "gone.js"), "x");
      const before = fs.statSync(file).mtimeMs;
      await generateJsModels(dir, designs);
      expect(fs.statSync(file).mtimeMs).toBe(before);
      expect(fs.existsSync(path.join(dir, "js", "gone.js"))).toBe(false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 30_000);
});
