// Animation clips of the mesh builder (MeshCore.animate) as glTF animations
// (MeshBuilder.toGlb) and three.js clips (threeBuilder toGroup), the posed GLB
// (glbPose.ts) and the hollow `tube` primitive. See docs/models/animation.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import { parseGlb, readAccessor } from "../generator/glbParse.ts";
import { collectTriangles } from "../generator/glbTriangles.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";

const PALETTE = { a: { color: "#ff0000" }, b: { color: "#00ff00" } };
const q = (a: number) => [0, 0, Math.sin(a / 2), Math.cos(a / 2)];

function spinner<T extends MeshBuilder | ThreeMeshBuilder>(m: T): T {
  m.part("base", [0, 0, 0], () => m.box("a", 0, 0, 2, 2, 0, 0.1));
  m.part("arm", [0, 1, 0], () => m.box("b", 0.5, 0, 1, 0.1, 0.95, 1.05));
  m.animate({
    name: "spin",
    times: [0, 0.5, 1],
    tracks: [
      { node: "arm", path: "rotation", values: [...q(0), ...q(-Math.PI), ...q(-2 * Math.PI)] },
      { node: "arm", path: "translation", values: [0, 1, 0, 0, 1.5, 0, 0, 1, 0] },
    ],
    drive: { drive: "time" },
  });
  return m;
}

describe("animation clips", () => {
  it("are written as glTF animations of the part nodes, linear, with shared times", () => {
    const glb = spinner(new MeshBuilder(PALETTE)).toGlb("t");
    const { json, bin } = parseGlb(glb);
    const j = json as unknown as {
      nodes: Array<{ name: string }>;
      animations: Array<{ name: string; channels: Array<{ sampler: number; target: { node: number; path: string } }>; samplers: Array<{ input: number; output: number; interpolation: string }> }>;
      accessors: Array<{ type: string; min?: number[]; max?: number[] }>;
    };
    expect(j.animations).toHaveLength(1);
    const a = j.animations[0]!;
    expect(a.name).toBe("spin");
    expect(a.channels.map((c) => [j.nodes[c.target.node]!.name, c.target.path])).toEqual([["arm", "rotation"], ["arm", "translation"]]);
    expect(a.samplers.every((s) => s.interpolation === "LINEAR" && s.input === a.samplers[0]!.input)).toBe(true);
    // the input accessor carries the bounds glTF requires
    expect(j.accessors[a.samplers[0]!.input]!).toMatchObject({ type: "SCALAR", min: [0], max: [1] });
    expect(readAccessor(json, bin, a.samplers[1]!.output)).toEqual([0, 1, 0, 0, 1.5, 0, 0, 1, 0]);
  });

  it("carry what plays each clip in the scene extras and the JS model's userData", () => {
    const { json } = parseGlb(spinner(new MeshBuilder(PALETTE)).toGlb("t"));
    expect((json as { scenes: Array<{ extras?: { clipDrives?: unknown } }> }).scenes[0]!.extras?.clipDrives).toEqual({ spin: { drive: "time" } });
    const g = spinner(new ThreeMeshBuilder(PALETTE)).toGroup(THREE);
    expect(g.userData.clipDrives).toEqual({ spin: { drive: "time" } });
    const plain = new MeshBuilder(PALETTE);
    plain.box("a", 0, 0, 1, 1, 0, 1);
    expect((parseGlb(plain.toGlb("t")).json as { scenes: Array<{ extras?: unknown }> }).scenes[0]!.extras).toBeUndefined();
  });

  it("refuse a clip without a valid drive", () => {
    const m = new MeshBuilder(PALETTE);
    m.part("ok", [0, 0, 0], () => m.box("a", 3, 0, 1, 1, 0, 1));
    const tracks = [{ node: "ok", path: "rotation" as const, values: [0, 0, 0, 1, 0, 0, 0, 1] }];
    expect(() => m.animate({ name: "x", times: [0, 1], tracks, drive: { drive: "distance", speed: 0 } })).toThrow(/drive/);
    expect(() => m.animate({ name: "x", times: [0, 1], tracks } as never)).toThrow(/drive/);
  });

  it("leave a model without clips byte-identical in layout (no animations key)", () => {
    const m = new MeshBuilder(PALETTE);
    m.box("a", 0, 0, 1, 1, 0, 1);
    expect("animations" in parseGlb(m.toGlb("t")).json).toBe(false);
  });

  it("refuse tracks on unknown or unbindable parts and mismatched sample counts", () => {
    const m = new MeshBuilder(PALETTE);
    m.part("a b", [0, 0, 0], () => m.box("a", 0, 0, 1, 1, 0, 1));
    m.part("ok", [0, 0, 0], () => m.box("a", 3, 0, 1, 1, 0, 1));
    expect(() => m.animate({ name: "x", times: [0, 1], tracks: [{ node: "nope", path: "translation", values: [0, 0, 0, 0, 0, 0] }] , drive: { drive: "time" } })).toThrow(/no part/);
    expect(() => m.animate({ name: "x", times: [0, 1], tracks: [{ node: "a b", path: "translation", values: [0, 0, 0, 0, 0, 0] }] , drive: { drive: "time" } })).toThrow(/cannot bind/);
    expect(() => m.animate({ name: "x", times: [0, 1], tracks: [{ node: "ok", path: "rotation", values: [0, 0, 0, 1] }] , drive: { drive: "time" } })).toThrow(/values/);
    expect(() => m.animate({ name: "x", times: [0.5, 1], tracks: [] , drive: { drive: "time" } })).toThrow(/start at 0/);
  });

  it("become three.js clips binding the group's part nodes", () => {
    const g = spinner(new ThreeMeshBuilder(PALETTE)).toGroup(THREE);
    expect(g.animations).toHaveLength(1);
    const clip = g.animations[0]!;
    expect(clip.duration).toBe(1);
    expect(clip.tracks.map((t) => t.name)).toEqual(["arm.quaternion", "arm.position"]);
    const mixer = new THREE.AnimationMixer(g);
    mixer.clipAction(clip).play();
    mixer.update(0.5);
    const arm = g.getObjectByName("arm")!;
    expect(arm.position.y).toBeCloseTo(1.5, 6);
    expect(Math.abs(arm.quaternion.z)).toBeCloseTo(1, 6); // half a turn about z
  });

  it("pose a GLB at any sample, moving only the animated nodes", () => {
    const glb = spinner(new MeshBuilder(PALETTE)).toGlb("t");
    expect(sampleCount(glb)).toBe(3);
    const posed = parseGlb(poseGlb(glb, 1));
    const arm = collectTriangles(posed.json, posed.bin).filter((t) => t.material === "b").flatMap((t) => t.p);
    // turned half a turn about the pivot, lifted to y = 1.5: the arm now reaches toward -x
    expect(Math.min(...arm.map((p) => p[0]))).toBeCloseTo(-1, 5);
    expect(Math.max(...arm.map((p) => p[1]))).toBeCloseTo(1.55, 5);
    const base = collectTriangles(posed.json, posed.bin).filter((t) => t.material === "a");
    expect(Math.max(...base.flatMap((t) => t.p.map((p) => p[1])))).toBeCloseTo(0.1, 6);
  });
});

describe("the tube primitive", () => {
  it("draws a hollow ring whose faces all look outward from its material", () => {
    const m = new MeshBuilder(PALETTE);
    m.tube("a", "z", 0, 1, 1, 0.8, 0, 0.2, 12);
    const { json, bin } = parseGlb(m.toGlb("t"));
    const tris = collectTriangles(json, bin);
    expect(tris).toHaveLength(12 * 4 * 2);
    for (const t of tris) {
      const c = [0, 1, 0.1];
      const mid = [0, 1, 2].map((k) => (t.p[0][k]! + t.p[1][k]! + t.p[2][k]!) / 3);
      const r = Math.hypot(mid[0]! - c[0]!, mid[1]! - c[1]!);
      const n = t.n[0];
      if (Math.abs(n[2]) > 0.9) expect(Math.sign(n[2])).toBe(Math.sign(mid[2]! - c[2]!)); // ring faces
      else if (r > 0.95) expect((mid[0]! - c[0]!) * n[0] + (mid[1]! - c[1]!) * n[1]).toBeGreaterThan(0); // outer wall
      else expect((mid[0]! - c[0]!) * n[0] + (mid[1]! - c[1]!) * n[1]).toBeLessThan(0); // bore
    }
  });
});
