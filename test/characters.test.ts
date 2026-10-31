// The characters (generator/characters.ts, docs/models/characters.md): the avatar's
// clips and their drives, closed loops, foot contact through the walk and run, the
// skeleton the game poses, characters.meta.json and the site's motion buttons.

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { AVATAR, AVATAR_SEAT_HEIGHT, CHARACTERS, avatar, avatarLod } from "../generator/characters";
import {
  ALL_VEHICLES, BUILDINGS, CHARACTER_DESIGNS, DESIGNS, PREVIEW_DESIGNS, PROP_DESIGNS, VILLAGE_DESIGNS, buildExport,
} from "../generator/generate";
import {
  CHARACTERS_META_FILE, META_FILE, PROPS_META_FILE, VEHICLE_META_FILE, VILLAGE_META_FILE, exportCharacterMeta, sceneryOf,
  type CharacterExportMeta,
} from "../generator/catalog";
import { glbStats } from "../generator/glbStats";
import { poseGlb, sampleCount } from "../generator/glbPose";
import { findCoplanarOverlaps } from "../generator/coplanar";
import { exportedText } from "../generator/text";
import { groupOf } from "../src/catalogQuery";
import { motionButtons, motionPlay, restingMotion } from "../src/viewerMotions";
import { jsModuleOf } from "./catalogCache";

const ID = "proc-char-avatar";
const PARTS = ["torso", "head", "leftArm", "rightArm", "leftLeg", "leftShin", "rightLeg", "rightShin"];
const CLIPS = { idle: "time", walk: "distance", run: "distance", jump: "motion", fall: "motion", sit: "motion" } as const;

const full = avatar();
const glb = full.toGlb(ID);
const clipIndex = (name: string): number => full.animations().findIndex((c) => c.name === name);
/** The lowest point of the posed figure at every sample of a clip. */
const lowest = (name: string): number[] =>
  Array.from({ length: sampleCount(glb, clipIndex(name)) }, (_, k) => glbStats(poseGlb(glb, k, clipIndex(name))).min[1]);

describe("the avatar", () => {
  it("is a character of its own, in no other family or meta", () => {
    const d = DESIGNS.get(ID)!;
    expect(d).toBe(CHARACTERS[0]);
    expect(CHARACTER_DESIGNS).toEqual([d]);
    for (const list of [BUILDINGS, VILLAGE_DESIGNS, ALL_VEHICLES, PROP_DESIGNS, PREVIEW_DESIGNS]) expect(list).not.toContain(d);
    expect(d.catalog?.category).toBe("Characters");
    expect(exportedText().get(`model.${ID}`)).toBe("Avatar");
  });

  it("stands 1.8 m tall on its feet at y = 0, facing +x, centred across, inside its budgets", () => {
    const s = glbStats(glb);
    expect(s.min[1]).toBeCloseTo(0, 5);
    expect(s.max[1]).toBeGreaterThan(1.75);
    expect(s.max[1]).toBeLessThan(1.85);
    expect(s.min[2]).toBeCloseTo(-s.max[2], 5);
    // the face (the nose) is the frontmost point
    expect(s.max[0]).toBeGreaterThan(-s.min[0]);
    expect(full.triangleCount()).toBeLessThan(1500);
    expect(avatarLod().triangleCount()).toBeLessThanOrEqual(100);
    expect(findCoplanarOverlaps(glb)).toEqual([]);
  });

  it("carries every clip with its drive, walk and run at their pace, the same tracks in each", () => {
    const drives = full.clipDrives()!;
    expect(Object.keys(drives)).toEqual(Object.keys(CLIPS));
    for (const [name, drive] of Object.entries(CLIPS)) expect(drives[name]!.drive, name).toBe(drive);
    expect(drives.walk).toEqual({ drive: "distance", speed: AVATAR.walkSpeed });
    expect(drives.run).toEqual({ drive: "distance", speed: AVATAR.runSpeed });
    const duration = (name: string) => full.animations().find((c) => c.name === name)!.times.at(-1)!;
    expect(AVATAR.walkSpeed * duration("walk")).toBeCloseTo(AVATAR.walkStride, 6);
    expect(AVATAR.runSpeed * duration("run")).toBeCloseTo(AVATAR.runStride, 6);
    const tracks = (c: { tracks: { node: string; path: string }[] }) => c.tracks.map((t) => `${t.node}.${t.path}`).sort();
    for (const c of full.animations()) expect(tracks(c), c.name).toEqual(tracks(full.animations()[0]!));
    expect(new Set(full.animations()[0]!.tracks.map((t) => t.node))).toEqual(new Set(PARTS));
    // the low detail is one static mesh, as every low detail
    expect(avatarLod().animations()).toEqual([]);
  });

  it("closes its loops: idle, walk, run and fall end on their first sample", () => {
    for (const name of ["idle", "walk", "run", "fall"]) {
      const c = full.animations().find((a) => a.name === name)!;
      const n = c.times.length;
      for (const t of c.tracks) {
        const w = t.path === "rotation" ? 4 : 3;
        expect(t.values.slice((n - 1) * w), `${name} ${t.node}.${t.path}`).toEqual(t.values.slice(0, w));
      }
    }
  });

  it("keeps its feet on the ground through the walk and the run, a foot touching at contact", () => {
    for (const name of ["walk", "run", "idle"]) {
      const lows = lowest(name);
      expect(Math.min(...lows), name).toBeGreaterThanOrEqual(-0.02);
      expect(Math.min(...lows), name).toBeLessThan(0.005);
    }
    // the walk always has a foot down; the run leaves the ground between its steps
    expect(Math.max(...lowest("walk"))).toBeLessThan(0.005);
    expect(Math.max(...lowest("run"))).toBeGreaterThan(0.03);
  });

  it("jumps from the ground and lands near its rest pose, and sits down to its seat height", () => {
    expect(Math.min(...lowest("jump"))).toBeGreaterThanOrEqual(-0.02);
    expect(Math.max(...lowest("jump"))).toBeGreaterThan(0.1); // the tuck lifts the feet
    expect(Math.min(...lowest("sit"))).toBeGreaterThanOrEqual(-0.02);
    const sit = full.animations().find((a) => a.name === "sit")!;
    const hips = sit.tracks.find((t) => t.node === "torso" && t.path === "translation")!.values;
    expect(hips.at(-2)).toBeCloseTo(AVATAR_SEAT_HEIGHT, 4);
    expect(AVATAR_SEAT_HEIGHT).toBeGreaterThan(0.3);
    expect(AVATAR_SEAT_HEIGHT).toBeLessThan(0.55);
    // seated: the thighs turned level forward, the knee at the hip's height
    const k = sampleCount(glb, clipIndex("sit")) - 1;
    const seated = glbStats(poseGlb(glb, k, clipIndex("sit")));
    expect(seated.max[1]).toBeLessThan(glbStats(glb).max[1] - 0.3);
    expect(seated.max[0]).toBeGreaterThan(0.45);
  });

  it("builds its JS model with the parts as named nodes and the drives in userData", async () => {
    const mod = await jsModuleOf(ID);
    const group = mod.default(THREE) as THREE.Group;
    for (const p of PARTS) expect(group.getObjectByName(p), p).toBeDefined();
    expect(group.getObjectByName("head")!.parent!.name).toBe("torso");
    expect(group.getObjectByName("leftShin")!.parent!.name).toBe("leftLeg");
    expect(group.userData.clipDrives).toEqual(full.clipDrives());
    expect(group.animations.map((c: THREE.AnimationClip) => c.name)).toEqual(Object.keys(CLIPS));
  });
});

describe("characters.meta.json", () => {
  it("lists the avatar with its height, bounds, clips, facing and seat", () => {
    const s = glbStats(glb);
    const meta = exportCharacterMeta(CHARACTER_DESIGNS, new Map([[ID, { min: s.min, max: s.max }]]));
    expect(meta.count).toBe(1);
    const e = meta.characters[0]!;
    expect(e).toMatchObject({ id: ID, title: "Avatar", category: "Characters", group: "character", js: `${ID}.js`, thumb: `${ID}.png` });
    expect(e.defaultScale).toBeUndefined();
    expect(e.params).toBeUndefined();
    expect(e.character).toEqual({
      height: 1.81,
      bounds: { min: [-0.21, 0, -0.475], max: [0.22, 1.81, 0.475] },
      clips: Object.keys(CLIPS),
      facing: "+x",
      seat: AVATAR_SEAT_HEIGHT,
    });
    expect(() => exportCharacterMeta(CHARACTER_DESIGNS, new Map())).toThrow(/bounds/);
  });

  it("is written by the export, and the avatar is in no other meta", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "factory-characters-"));
    try {
      await buildExport(dir, [DESIGNS.get(ID)!, PROP_DESIGNS[0]!]);
      const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");
      const chars = JSON.parse(read(CHARACTERS_META_FILE)) as CharacterExportMeta;
      expect(chars.characters.map((c) => c.id)).toEqual([ID]);
      expect(chars.characters[0]!.character.height).toBe(1.81);
      for (const f of [META_FILE, VILLAGE_META_FILE, VEHICLE_META_FILE, PROPS_META_FILE]) expect(read(f), f).not.toContain(ID);
      expect(JSON.parse(read(PROPS_META_FILE)).props.map((p: { id: string }) => p.id)).toEqual([PROP_DESIGNS[0]!.id]);
      expect(fs.existsSync(path.join(dir, "js", `${ID}.js`))).toBe(true);
      expect(fs.existsSync(path.join(dir, "thumbs", `${ID}.png`))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("the site", () => {
  it("lists characters under a chip of their own and stands them on ground beside a door-high marker", () => {
    expect(groupOf({ category: "Characters", group: "character" } as never)).toBe("character");
    expect(sceneryOf({ category: "Characters", group: "character" })).toEqual({ way: "ground", marker: 2 });
  });

  /** A clip as three.js carries it: one track of two samples per (first, last) pair. */
  const clip = (name: string, first: number[], last: number[]) => ({ name, tracks: [{ times: [0, 1], values: [...first, ...last] }] });

  it("plays a motion clip by its shape: a closed loop loops, a return plays once, another end holds", () => {
    expect(motionPlay(clip("fall", [0, 0, 0, 1], [0, 0, 0, 1]))).toBe("loop");
    expect(motionPlay(clip("jump", [0, 0, 0, 1], [0, 0, Math.sin(0.1), Math.cos(0.1)]))).toBe("once");
    expect(motionPlay(clip("sit", [0, 0, 0, 1], [0, 0, Math.sin(Math.PI / 4), Math.cos(Math.PI / 4)]))).toBe("hold");
    expect(motionPlay(clip("drop", [0, 1, 0], [0, 0.5, 0]))).toBe("hold");
  });

  it("gives a character one button per clip from the drives, and a vehicle none", () => {
    const drives = { idle: { drive: "time" }, walk: { drive: "distance", speed: 1.4 }, hop: { drive: "motion" }, panto: { drive: "state" } };
    const clips = [clip("idle", [0], [0]), clip("walk", [0], [0]), clip("hop", [0, 0, 0, 1], [0, 0, Math.sin(0.05), Math.cos(0.05)]), clip("panto", [0], [1])];
    const buttons = motionButtons(clips, drives);
    expect(buttons).toEqual([
      { name: "idle", label: "Idle", play: "loop", drive: "time" },
      { name: "walk", label: "Walk", play: "loop", drive: "distance", speed: 1.4 },
      { name: "hop", label: "Hop", play: "once", drive: "motion" },
    ]);
    expect(restingMotion(buttons)?.name).toBe("idle");
    // without a motion clip the model keeps Start and Stop
    expect(motionButtons(clips.slice(0, 2), drives)).toEqual([]);
  });

  it("derives the avatar's buttons from its JS model: Idle, Walk, Run, Jump, Fall, Sit", async () => {
    const mod = await jsModuleOf(ID);
    const group = mod.default(THREE) as THREE.Group;
    const buttons = motionButtons(group.animations, group.userData.clipDrives);
    expect(buttons.map((b) => [b.label, b.play])).toEqual([
      ["Idle", "loop"], ["Walk", "loop"], ["Run", "loop"], ["Jump", "once"], ["Fall", "loop"], ["Sit", "hold"],
    ]);
    expect(buttons.find((b) => b.name === "walk")!.speed).toBe(AVATAR.walkSpeed);
  });
});
