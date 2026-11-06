// The horse tram (generator/horseTram.ts, docs/models/world-trams.md "The horse
// tram"): its own builder within the 10,000-triangle tram budget, the horse
// jointed in its parts, and the trot - a distance clip like the rolling wheels,
// a closed loop of the diagonal pairs whose planted hooves stand on the ground
// without slipping, free of z-fighting as the legs swing.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { DESIGNS } from "../generator/generate";
import { collectTriangles, parseGlb } from "../generator/glbTriangles";
import { poseGlb, sampleCount } from "../generator/glbPose";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { ROLLING_CLIP, ROLLING_SPEED } from "../generator/rolling";
import { HORSE_LEG_LENGTH, HORSE_NODES, TROT_CLIP, TROT_SAMPLES, TROT_STRIDE, trotPose } from "../generator/horseTram";
import { jsModuleOf } from "./catalogCache";

const ID = "proc-vehicle-horse-tram";
const model = DESIGNS.get(ID)!.build();
const glb = model.toGlb(ID, "vehicle");
const clipIndex = (parseGlb(glb).json as { animations: Array<{ name: string }> }).animations.findIndex((a) => a.name === TROT_CLIP);
const hoofLow = (g: Uint8Array): number => {
  const { json, bin } = parseGlb(g);
  let low = Infinity;
  for (const t of collectTriangles(json, bin)) if (t.material === "hoof") for (const p of t.p) low = Math.min(low, p[1]!);
  return low;
};

describe("the horse tram", () => {
  it("stays within the rigid tram's 10,000 triangles", () => {
    expect(model.triangleCount()).toBeLessThanOrEqual(10_000);
  });

  it("trots by the distance travelled, as its wheels roll", () => {
    const clip = model.animations().find((c) => c.name === TROT_CLIP)!;
    expect(clip).toBeDefined();
    expect(model.clipDrives()![TROT_CLIP]).toEqual({ drive: "distance", speed: ROLLING_SPEED });
    expect(model.clipDrives()![ROLLING_CLIP]).toEqual({ drive: "distance", speed: ROLLING_SPEED });
    // one stride a loop: TROT_STRIDE metres at the reference speed
    expect(clip.times).toHaveLength(TROT_SAMPLES + 1);
    expect(clip.times.at(-1)).toBeCloseTo(TROT_STRIDE / ROLLING_SPEED, 6);
    expect(new Set(clip.tracks.map((t) => t.node))).toEqual(new Set(HORSE_NODES));
    // a closed loop: the last sample is the first
    for (const t of clip.tracks) {
      const w = t.path === "rotation" ? 4 : 3;
      expect(t.values.slice(-w)).toEqual(t.values.slice(0, w));
    }
  });

  it("moves the diagonal pairs together, each leg planted half the stride and its hoof not slipping", () => {
    const n = 48;
    for (let k = 0; k < n; k++) {
      const ph = k / n;
      const p = trotPose(ph);
      for (const [a, b] of [["front-left", "hind-right"], ["front-right", "hind-left"]] as const) {
        expect(p.legs[a].swing).toBeCloseTo(p.legs[b].swing, 12);
        // planted or swinging together; the front knee folds deeper than the hind hock
        expect(p.legs[a].knee === 0).toBe(p.legs[b].knee === 0);
      }
      // front-left is planted in the first half: straight, its sole fixed on the ground as the horse goes on
      if (ph < 0.5) {
        expect(p.legs["front-left"].knee).toBe(0);
        const foot = HORSE_LEG_LENGTH * Math.sin(p.legs["front-left"].swing) + ph * TROT_STRIDE;
        expect(foot).toBeCloseTo(TROT_STRIDE / 4, 9);
      } else expect(p.legs["front-left"].knee).toBeLessThanOrEqual(0);
    }
  });

  it("keeps the planted hooves on the ground and nothing fighting at every sample", () => {
    expect(sampleCount(glb, clipIndex)).toBe(TROT_SAMPLES + 1);
    expect(Math.abs(hoofLow(glb))).toBeLessThan(1e-6);
    for (let k = 0; k <= TROT_SAMPLES; k++) {
      const posed = poseGlb(glb, k, clipIndex);
      expect(Math.abs(hoofLow(posed)), `sample ${k}`).toBeLessThan(1e-3);
      if (k % 5 === 2) expect(findCoplanarOverlaps(posed), `sample ${k}`).toEqual([]);
    }
  });

  it("nests the legs' parts in the horse in its JS model, which plays the trot", async () => {
    const mod = await jsModuleOf(ID);
    const g = mod.default(THREE);
    const body = g.getObjectByName("horse")!;
    const leg = g.getObjectByName("horse-leg-front-left")!;
    const shin = g.getObjectByName("horse-shin-front-left")!;
    expect(leg.parent).toBe(body);
    expect(shin.parent).toBe(leg);
    expect(g.userData.clipDrives[TROT_CLIP]).toEqual({ drive: "distance", speed: ROLLING_SPEED });
    const clip = g.animations.find((a: THREE.AnimationClip) => a.name === TROT_CLIP)!;
    const mixer = new THREE.AnimationMixer(g);
    mixer.clipAction(clip).play();
    mixer.setTime(0);
    const z0 = new THREE.Euler().setFromQuaternion(leg.quaternion).z;
    expect(z0).toBeCloseTo(trotPose(0).legs["front-left"].swing, 4);
    expect(Math.abs(z0)).toBeGreaterThan(0.2);
  });

  it("keeps a static distant model", () => {
    expect(DESIGNS.get(ID)!.buildLod().animations()).toEqual([]);
  });
});
