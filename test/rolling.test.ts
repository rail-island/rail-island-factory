// Rolling wheels (generator/rolling.ts, MeshCore.spin): the vehicles whose wheels
// carry spokes or wheel nuts turn them by distance travelled, and the vehicles
// with plain wheels leave them static. See docs/models/animation.md.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { paramCombinations } from "../generator/design.ts";
import { DESIGNS } from "../generator/generate.ts";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { MeshBuilder as ThreeMeshBuilder } from "../generator/threeBuilder.ts";
import { ROLLING_CLIP, ROLLING_SAMPLES, ROLLING_SPEED, rollWheels } from "../generator/rolling.ts";
import { RUNNING_SPEED } from "../generator/steamGear.ts";
import { findCoplanarOverlaps } from "../generator/coplanar.ts";
import { glbStats } from "../generator/glbStats.ts";
import { parseGlb } from "../generator/glbParse.ts";
import { poseGlb, sampleCount } from "../generator/glbPose.ts";
import { jsModuleOf, sample } from "./catalogCache";

type Gltf = {
  nodes: Array<{ name: string; children?: number[]; translation?: number[] }>;
  animations?: Array<{ name: string }>;
};

/** The vehicles with irregular wheels, their wheel diameter and the nodes that roll. */
const ROLLING: Array<{ id: string; d: number; nodes: string[] }> = [
  { id: "proc-vehicle-cd-150", d: 1.25, nodes: ["wheelset-1", "wheelset-2", "wheelset-3", "wheelset-4"] },
  ...[
    ["proc-vehicle-tatra-815-tipper", 1.14, 2],
    ["proc-vehicle-praga-rv", 1.02, 2],
    ["proc-vehicle-mercedes-atego-1224", 0.94, 1],
  ].map(([id, d, rear]) => ({
    id: id as string,
    d: d as number,
    nodes: [
      "wheel-front-left-spin", "wheel-front-right-spin",
      ...Array.from({ length: rear as number }, (_, k) => [`wheel-rear-${k + 1}-left`, `wheel-rear-${k + 1}-right`]).flat(),
    ],
  })),
];

const COMBOS = ROLLING.flatMap((r) => {
  const d = DESIGNS.get(r.id)!;
  return sample(paramCombinations(d.params)).map((p) => ({ ...r, p, label: `${r.id} ${JSON.stringify(p)}` }));
});

const PALETTE = { a: { color: "#ff0000" }, b: { color: "#00ff00" } };

describe("MeshCore.spin", () => {
  it("draws a child node of the part being drawn, inside scopes, pivoted where asked", () => {
    const m = new MeshBuilder(PALETTE);
    m.part("body", [0, 0, 0], () => {
      m.box("a", 0, 0, 2, 2, 1, 1.2);
      m.scope("axle", () => m.spin("wheel", [0.5, 0.4, 0.8], () => m.box("b", 0.5, 0.8, 0.6, 0.2, 0.1, 0.7)));
    });
    rollWheels(m, ["wheel"], 0.8);
    const j = parseGlb(m.toGlb("t")).json as unknown as Gltf;
    const body = j.nodes.find((n) => n.name === "body")!;
    expect(body.children?.map((c) => j.nodes[c]!.name)).toEqual(["wheel"]);
    expect(j.nodes.find((n) => n.name === "wheel")!.translation).toEqual([0.5, 0.4, 0.8]);
    expect(() => m.spin("wheel", [0, 0, 0], () => undefined)).toThrow(/twice/);
  });

  it("records a wheelset drawn inside a rolling part for the part that carries it", () => {
    const m = new MeshBuilder(PALETTE);
    m.bogie(() => m.spin("wheelset-1", [0, 0.4, 0], () => m.scope("wheelset", () => m.box("a", 0, 0, 0.8, 1.6, 0, 0.8))));
    expect(m.rig?.supports).toEqual([{ x: 0, node: "bogie0", axles: 1, sections: [0] }]);
  });
});

describe("rolling wheels", () => {
  it("run at the steam clip's speed", () => {
    expect(ROLLING_SPEED).toBe(RUNNING_SPEED);
  });

  it.each(COMBOS.map((c) => [c.label, c] as const))("%s rolls its wheels forward by distance, one turn per circumference", (_, c) => {
    const model = DESIGNS.get(c.id)!.build(c.p);
    const clip = model.animations().find((a) => a.name === ROLLING_CLIP)!;
    expect(clip).toBeDefined();
    expect(model.clipDrives()![ROLLING_CLIP]).toEqual({ drive: "distance", speed: ROLLING_SPEED });
    expect(clip.times).toHaveLength(ROLLING_SAMPLES + 1);
    expect(clip.times.at(-1)).toBeCloseTo((Math.PI * c.d) / ROLLING_SPEED, 5);
    expect(clip.tracks.map((t) => t.node)).toEqual(c.nodes);
    for (const t of clip.tracks) {
      expect(t.path).toBe("rotation");
      for (let k = 0; k <= ROLLING_SAMPLES; k++) {
        const [x, y, z, w] = t.values.slice(k * 4, k * 4 + 4) as [number, number, number, number];
        // about +Z only, turning clockwise seen from the right (rolling toward +X)
        expect([x, y]).toEqual([0, 0]);
        const angle = 2 * Math.atan2(z, w);
        const want = (-2 * Math.PI * k) / ROLLING_SAMPLES;
        expect(Math.cos(angle - want)).toBeCloseTo(1, 9);
      }
    }
  });

  it.each(COMBOS.map((c) => [c.label, c] as const))("%s stays free of flicker and on its wheels as they roll", (_, c) => {
    const glb = DESIGNS.get(c.id)!.build(c.p).toGlb("t", "vehicle");
    const j = parseGlb(glb).json as unknown as Gltf;
    const clip = j.animations!.findIndex((a) => a.name === ROLLING_CLIP);
    expect(sampleCount(glb, clip)).toBe(ROLLING_SAMPLES + 1);
    const rest = glbStats(glb);
    for (const k of [1, 3, 6, 11]) {
      const posed = poseGlb(glb, k, clip);
      expect(findCoplanarOverlaps(posed), `sample ${k}`).toEqual([]);
      const s = glbStats(posed);
      // a turning polygonal wheel dips by its sagitta at most
      expect(s.min[1]).toBeGreaterThan(rest.min[1] - 0.012);
      expect(s.triangles).toBe(rest.triangles);
    }
  });

  it("roll a steered wheel inside its steered node, so a JS model steers and rolls it at once", async () => {
    const mod = await jsModuleOf("proc-vehicle-tatra-815-tipper");
    const g = mod.default(THREE);
    const steered = g.getObjectByName("wheel-front-left")!;
    const spin = g.getObjectByName("wheel-front-left-spin")!;
    expect(spin.parent).toBe(steered);
    const clip = g.animations.find((a) => a.name === ROLLING_CLIP)!;
    const mixer = new THREE.AnimationMixer(g);
    mixer.clipAction(clip).play();
    steered.rotation.y = 0.3;
    mixer.setTime(clip.duration / 4);
    // the steer stays the node's own, the roll a quarter turn of its child
    expect(steered.rotation.y).toBeCloseTo(0.3, 9);
    expect(new THREE.Euler().setFromQuaternion(spin.quaternion).z).toBeCloseTo(-Math.PI / 2, 4);
  });

  it("leave a plain wheel static: vehicles whose wheels are rings about the axle get no rolling clip", () => {
    for (const id of ["proc-vehicle-cd-163", "proc-vehicle-cd-130", "proc-vehicle-cd-y-coach", "proc-vehicle-karosa-short", "proc-vehicle-american-truck", "proc-vehicle-boeing-737"]) {
      const names = DESIGNS.get(id)!.build().animations().map((a) => a.name);
      expect(names, id).not.toContain(ROLLING_CLIP);
    }
  });

  it("are built the same by the three.js builder", () => {
    const m = new ThreeMeshBuilder(PALETTE);
    m.part("body", [0, 0, 0], () => m.spin("w", [0, 0.5, 0], () => m.box("a", 0, 0, 1, 0.2, 0, 1)));
    rollWheels(m, ["w"], 1);
    const g = m.toGroup(THREE);
    expect(g.getObjectByName("w")!.parent!.name).toBe("body");
    expect(g.userData.clipDrives).toEqual({ [ROLLING_CLIP]: { drive: "distance", speed: ROLLING_SPEED } });
  });
});
