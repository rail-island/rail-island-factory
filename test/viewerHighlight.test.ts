// The preview's source-tree highlight and picking (src/viewerHighlight.ts,
// src/sourceTreeView.ts) on a real design's GLB, loaded the way the site loads
// it -- three's GLTFLoader -- but without a WebGL context.

import { describe, expect, it } from "vitest";
import { Box3, Mesh, Raycaster, Vector3, type Object3D } from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { designGlb, designTree } from "../generator/generate";
import { applyHighlight, makeParts } from "../src/viewerHighlight";
import { indexTree, leafAt, rangesOf } from "../src/sourceTreeView";

async function load(id: string): Promise<Object3D> {
  const bytes = designGlb(id);
  const buf = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const gltf = await new GLTFLoader().parseAsync(buf as ArrayBuffer, "");
  gltf.scene.updateMatrixWorld(true);
  return gltf.scene;
}

describe("the preview's highlight", () => {
  it("glows the selected node's triangles, ghosts the rest, and restores the model", async () => {
    const scene = await load("sky-art-deco");
    const parts = makeParts(scene);
    const index = indexTree(designTree("sky-art-deco"));
    expect(parts.map((p) => p.name).sort()).toEqual(index.tree.materials);

    applyHighlight(parts, rangesOf(index, "tier-2/piers"));
    for (const p of parts) {
      const tris = p.mesh.geometry.getAttribute("position").count / 3;
      if (p.name !== "stone") {
        expect(p.mesh.material).toBe(p.ghost);
        expect(p.mesh.geometry.groups).toEqual([]);
        continue;
      }
      expect(p.mesh.material).toEqual([p.ghost, p.glow]);
      const [[first, count]] = rangesOf(index, "tier-2/piers").get("stone")!;
      // ghost before, glow over the piers, ghost after -- covering every triangle once
      expect(p.mesh.geometry.groups).toEqual([
        { start: 0, count: first * 3, materialIndex: 0 },
        { start: first * 3, count: count * 3, materialIndex: 1 },
        { start: (first + count) * 3, count: (tris - first - count) * 3, materialIndex: 0 },
      ]);
    }

    applyHighlight(parts, null);
    for (const p of parts) {
      expect(p.mesh.material).toBe(p.base);
      expect(p.mesh.geometry.groups).toEqual([]);
    }
  });

  it("ghosts everything for a node that drew nothing or is not in the tree", async () => {
    const parts = makeParts(await load("sky-pagoda"));
    applyHighlight(parts, new Map());
    for (const p of parts) expect(p.mesh.material).toBe(p.ghost);
  });
});

// An articulated vehicle has a mesh per material in each part's node, and the
// tree numbers a material's triangles across both: each mesh carries an offset.
describe("a model with parts", () => {
  const id = "veh-american-truck";

  it("glows a trailer node's triangles in the trailer's meshes only", async () => {
    const scene = await load(id);
    const parts = makeParts(scene);
    const index = indexTree(designTree(id));
    const truckMeshes = new Set<Object3D>();
    scene.getObjectByName("truck")!.traverse((o) => truckMeshes.add(o));
    const ranges = rangesOf(index, "trailer/axle-1");
    applyHighlight(parts, ranges);
    let glowing = 0;
    for (const p of parts) {
      if (truckMeshes.has(p.mesh)) {
        expect(p.mesh.material).toBe(p.ghost); // shares rubber and chrome with the trailer
        continue;
      }
      if (p.mesh.material === p.ghost) continue;
      glowing++;
      // the glowing group is the range made local to this mesh
      const glow = p.mesh.geometry.groups.filter((g) => g.materialIndex === 1);
      const local = ranges.get(p.name)!.map(([first, count]) => ({ start: (first - p.offset) * 3, count: count * 3, materialIndex: 1 }));
      expect(glow).toEqual(local);
    }
    expect(glowing).toBe(3); // rubber tyres, chrome rims and hubs, the dark axle beam
  });

  it("maps a ray into a trailer tail light to that leaf, past the truck's red lamps", async () => {
    const scene = await load(id);
    const parts = makeParts(scene);
    const index = indexTree(designTree(id));
    const light = index.leaves.find((l) => l.id.startsWith("trailer/rear/tail-lights/"))!;
    const centre = new Box3(new Vector3(...light.min!), new Vector3(...light.max!)).getCenter(new Vector3());
    const hit = new Raycaster(new Vector3(centre.x - 20, centre.y, centre.z), new Vector3(1, 0, 0)).intersectObject(scene, true)[0]!;
    const part = parts.find((p) => p.mesh === hit.object)!;
    expect(part.name).toBe("lampRed");
    expect(part.offset).toBeGreaterThan(0); // the truck's emblem and tail lights come first
    expect(leafAt(index, part.name, part.offset + hit.faceIndex!)!.id).toBe(light.id);
  });
});

describe("picking", () => {
  // The face index a raycast reports must be the triangle index the tree's
  // ranges use, or a click would select the wrong part.
  it("maps a ray hitting the mast's warning light to that leaf", async () => {
    const id = "sky-glass-office";
    const scene = await load(id);
    const parts = makeParts(scene);
    const index = indexTree(designTree(id));
    const light = index.leaves.find((l) => l.material === "red")!;
    const centre = new Box3(new Vector3(...light.min!), new Vector3(...light.max!)).getCenter(new Vector3());
    const ray = new Raycaster(new Vector3(centre.x, centre.y + 50, centre.z), new Vector3(0, -1, 0));
    const hit = ray.intersectObject(scene, true)[0]!;
    const part = parts.find((p) => p.mesh === hit.object)!;
    expect(hit.object).toBeInstanceOf(Mesh);
    expect(part.name).toBe("red");
    expect(leafAt(index, part.name, hit.faceIndex!)!.id).toBe(light.id);
    expect(light.id).toBe("mast/prism-3");
  });

  it("maps a ray into the podium to a podium leaf", async () => {
    const id = "sky-glass-office";
    const scene = await load(id);
    const parts = makeParts(scene);
    const index = indexTree(designTree(id));
    // from the side, at 2 m: the dark plinth box of the podium
    const hit = new Raycaster(new Vector3(100, 2, 0.3), new Vector3(-1, 0, 0)).intersectObject(scene, true)[0]!;
    const part = parts.find((p) => p.mesh === hit.object)!;
    expect(leafAt(index, part.name, hit.faceIndex!)!.id).toBe("podium/box-1");
  });
});
