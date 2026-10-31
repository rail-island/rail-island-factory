// The site's passenger view (src/viewerPassenger.ts) and a railway station page's
// overlays (src/viewerOverlays.ts): walkable surfaces found from the drawn
// triangles, the step limit, the walls, the preset viewpoints, the hints a design
// sets reaching the JS group's userData, and where the parked train and the
// catenary go. See docs/site/catalog-site.md, "Passenger view".

import { describe, expect, it } from "vitest";
import * as THREE from "three";
import type { ProceduralDesign } from "../generator/design.ts";
import { bundleDesign } from "../generator/jsModel.ts";
import { MeshBuilder } from "../generator/meshBuilder.ts";
import { passengerOf, setPassenger } from "../generator/passengerHints.ts";
import { passengerFixture, passengerFixtureLod } from "./fixtures/passengerDesign.ts";
import { jsTextOf } from "./catalogCache";
import { CONTACT as GAME_CONTACT, MESSENGER as GAME_MESSENGER } from "../generator/previews/wayKit.ts";
import { eyeOf, findPresets, Ground, hintsOf, MAX_STEP, PASSENGER_EYE, PRESET_REACH, trianglesOf, walk, type Stance } from "../src/viewerPassenger";
import {
  buildCatenary, carCentres, CONTACT, MAST_SPACING, MAX_CARS, MESSENGER, mastXs, mastZs, placeTrain, STUDS_PER_METRE, TRACK_CLEAR, trainTrack,
} from "../src/viewerOverlays";

const EYE = PASSENGER_EYE;

/** An axis-aligned box from its two corners. */
function box(group: THREE.Group, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0));
  mesh.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  group.add(mesh);
}

/**
 * A small station: a track at x = 0 on a bed (top 0.6, rail top 1.0), a platform
 * either side (top 1.75, edges at x = +-4), a roof over the right one from z = -10
 * to 10, a wall across the left platform at z = 0, a stair of 0.35 risers up to the
 * right platform's far end, and a low shelf on the left platform under which no one
 * fits.
 */
function station(): { group: THREE.Group; ground: Ground } {
  const g = new THREE.Group();
  box(g, -2.5, 2.5, 0, 0.6, -40, 40); // ballast
  box(g, -1.6, 1.6, 0.6, 1.0, -40, 40); // rails (one block)
  box(g, -14, -4, 0, 1.75, -30, 30); // left platform
  box(g, 4, 14, 0, 1.75, -30, 30); // right platform
  box(g, 4, 14, 8, 8.5, -10, 10); // roof
  box(g, -14, -4, 1.75, 6, -0.25, 0.25); // a wall across the left platform
  box(g, -14, -10, 3, 3.3, 20, 24); // a shelf 1.25 over the left platform
  for (let i = 1; i <= 4; i++) box(g, 4, 14, 1.75, 1.75 + 0.35 * i, 22 + i * 1.2, 30); // stairs up to 3.15
  return { group: g, ground: new Ground(trianglesOf(g)) };
}

const at = (x: number, y: number, z: number): Stance => ({ x, y, z, yaw: 0, pitch: 0 });

describe("passenger view: walkable surfaces", () => {
  const { ground } = station();

  it("finds the platform top, the bed and the room above each", () => {
    // under the roof: the platform, and the roof's own top under the sky
    expect(ground.floors(8, 0, EYE)).toEqual([{ y: 8.5, head: Infinity }, { y: 1.75, head: expect.closeTo(6.25, 5) }]);
    const right = ground.floors(8, 15, EYE);
    expect(right).toHaveLength(1);
    expect(right[0]!.head).toBe(Infinity);
    // the rail top is walkable too (the presets keep off the tracks)
    expect(ground.floors(0, 0, EYE)[0]!.y).toBeCloseTo(1.0, 5);
  });

  it("rejects a floor with no room for the passenger's head", () => {
    // the shelf over the left platform leaves 1.25 of room: no floor under it
    expect(ground.floorAt(-12, 22, 2, EYE)).toBeNull();
    // the shelf's own top, with the sky above, is one
    expect(ground.floorAt(-12, 22, 10, EYE)!.y).toBeCloseTo(3.3, 5);
  });
});

describe("passenger view: walking", () => {
  const { ground } = station();

  it("walks along a platform and takes the stairs, a riser at a time", () => {
    let s = at(8, 1.75, 0);
    s = walk(ground, s, 0, 10, EYE);
    expect(s.z).toBeCloseTo(10, 5);
    expect(s.y).toBe(1.75);
    s = walk(ground, s, 0, 18, EYE);
    expect(s.z).toBeCloseTo(28, 5);
    expect(s.y).toBeCloseTo(1.75 + 0.35 * 4, 5);
    expect(0.35).toBeLessThanOrEqual(MAX_STEP);
  });

  it("stops at a platform edge, up or down, and at a wall", () => {
    // off the left platform's edge onto the bed: a drop of 1.15
    const edge = walk(ground, at(-5, 1.75, 5), 3, 0, EYE);
    expect(edge.x).toBeGreaterThan(-4.01);
    expect(edge.y).toBe(1.75);
    // from the bed up onto the platform
    const up = walk(ground, at(2, 0.6, 5), 4, 0, EYE);
    expect(up.x).toBeLessThan(4);
    // through the wall across the left platform
    const wall = walk(ground, at(-8, 1.75, -3), 0, 6, EYE);
    expect(wall.z).toBeLessThan(-0.25);
  });

  it("slides along a wall when walking into it at an angle", () => {
    const s = walk(ground, at(-8, 1.75, -3), 2, 6, EYE);
    expect(s.z).toBeLessThan(-0.25);
    expect(s.x).toBeCloseTo(-6, 5);
  });

  it("stays within the model's bounds", () => {
    const s = walk(ground, at(13, 1.75, -29), 0, -40, EYE);
    expect(s.z).toBeGreaterThanOrEqual(-30 - 0.01);
  });
});

describe("passenger view: presets", () => {
  const { ground } = station();
  const tracks = [{ x: 0, z0: -40, z1: 40, top: 1.0 }];

  it("names a handful of distinct viewpoints on the platforms, off the track and under the cap", () => {
    const presets = findPresets(ground, EYE, tracks);
    expect(presets.length).toBeGreaterThanOrEqual(3);
    expect(presets.map((p) => p.name)).toContain("Platform end");
    expect(presets.map((p) => p.name)).toContain("Under the roof");
    expect(new Set(presets.map((p) => p.name)).size).toBe(presets.length);
    for (const p of presets) {
      expect(Math.abs(p.x)).toBeGreaterThan(2.5);
      expect(p.y).toBeGreaterThan(1.74);
      expect(p.y).toBeLessThanOrEqual(ground.min[1] + PRESET_REACH * EYE);
      for (const q of presets) if (q !== p) expect(Math.hypot(p.x - q.x, p.z - q.z) >= 2 * EYE || Math.abs(p.y - q.y) >= 0.5).toBe(true);
    }
    const roof = presets.find((p) => p.name === "Under the roof")!;
    expect(roof.x).toBeGreaterThan(4);
    expect(Math.abs(roof.z)).toBeLessThan(10);
  });

  it("is deterministic and finds nothing on an empty model", () => {
    expect(findPresets(ground, EYE, tracks)).toEqual(findPresets(station().ground, EYE, tracks));
    expect(findPresets(new Ground(new Float32Array(0)), EYE)).toEqual([]);
  });

  it("does not stand a passenger on a roof high over the deck", () => {
    const g = new THREE.Group();
    box(g, -10, 10, 0, 1.5, -20, 20); // a deck
    box(g, -10, 10, 14, 14.5, -20, 20); // a shed roof over it
    const presets = findPresets(new Ground(trianglesOf(g)), EYE);
    expect(presets.length).toBeGreaterThan(0);
    for (const p of presets) expect(p.y).toBe(1.5);
  });
});

describe("passenger hints", () => {
  it("are kept as a copy, refused when they make no sense, and leave the GLB alone", () => {
    const m = new MeshBuilder({ a: { color: "#ffffff" } });
    m.quad("a", [0, 0, 0], [1, 0, 0], [1, 0, 1], [0, 0, 1]);
    const before = m.toGlb("test");
    expect(passengerOf(m)).toBeNull();
    expect(() => setPassenger(m, { eye: 0 })).toThrow();
    expect(() => setPassenger(m, { eye: 2, tracks: [{ x: NaN, z0: 0, z1: 1, top: 0 }] })).toThrow();
    const hints = { eye: 2.55, tracks: [{ x: 4, z0: -34, z1: 34, top: 1.0 }] };
    setPassenger(m, hints);
    hints.tracks[0]!.x = 99;
    expect(passengerOf(m)).toEqual({ eye: 2.55, tracks: [{ x: 4, z0: -34, z1: 34, top: 1.0 }] });
    expect(Buffer.from(m.toGlb("test")).equals(Buffer.from(before))).toBe(true);
  });

  it("reach the JS model's userData, in that design's bundle only", async () => {
    const design = {
      id: "proc-test-passenger",
      title: "Passenger fixture",
      build: passengerFixture,
      buildLod: passengerFixtureLod,
      lodTriangles: 10,
    } as unknown as ProceduralDesign;
    const text = await bundleDesign(design, "../test/fixtures/passengerDesign.ts", false);
    const mod = (await import(/* @vite-ignore */ `data:text/javascript;base64,${Buffer.from(text).toString("base64")}`)) as {
      default: (three: object, v?: object, lod?: boolean) => THREE.Object3D;
    };
    const group = mod.default(THREE);
    expect(group.userData.passenger).toEqual({ eye: 2.55, tracks: [{ x: 2, z0: 0, z1: 4, top: 0.5 }] });
    expect(hintsOf(group)).toEqual(group.userData.passenger);
    expect(eyeOf(hintsOf(group))).toBe(2.55);
    expect(mod.default(THREE, {}, true).userData.passenger).toEqual({ eye: 2.55 });
    // a design that sets none carries neither the hints nor the code
    expect(await jsTextOf("proc-prop-crossing-signal")).not.toContain("passenger");
    expect(eyeOf(null)).toBe(PASSENGER_EYE);
  });
});

describe("station overlays", () => {
  const tracks = [
    { x: -12, z0: -34, z1: 34, top: 1.0 },
    { x: -4, z0: -34, z1: 34, top: 1.0 },
    { x: 8, z0: -34, z1: 34, top: 1.0 },
  ];

  it("hang the wires at the game's heights", () => {
    expect(CONTACT).toBe(GAME_CONTACT);
    expect(MESSENGER).toBe(GAME_MESSENGER);
  });

  it("stand every mast off the ballast of every track, at most MAST_SPACING apart", () => {
    const xs = mastXs(tracks);
    for (const x of xs) for (const t of tracks) expect(Math.abs(x - t.x)).toBeGreaterThanOrEqual(TRACK_CLEAR);
    const zs = mastZs(tracks[0]!);
    expect(zs[0]).toBeCloseTo(-33, 5);
    expect(zs[zs.length - 1]).toBeCloseTo(33, 5);
    for (let i = 1; i < zs.length; i++) expect(zs[i]! - zs[i - 1]!).toBeLessThanOrEqual(MAST_SPACING + 1e-9);
    const cat = buildCatenary(tracks, 0);
    const b = new THREE.Box3().setFromObject(cat.group);
    expect(b.max.y).toBeGreaterThan(1.0 + MESSENGER);
    expect(b.min.y).toBeCloseTo(0, 5);
    cat.dispose();
  });

  it("park the train on a track with a platform, wheels on the rail top, along z within the track", () => {
    const { ground } = station();
    const own = [{ x: 0, z0: -40, z1: 40, top: 1.0 }];
    expect(trainTrack(ground, own, EYE)).toBe(own[0]);
    expect(trainTrack(null, tracks, EYE)).toBe(tracks[0]);
    // a 26 m car, +X forward, wheels on y = 0, its middle at x = 1
    const car = () => {
      const g = new THREE.Group();
      box(g, -12, 14, 0, 4, -1.4, 1.4);
      return g;
    };
    const long = { x: 0, z0: -45, z1: 45, top: 1.0 };
    const train = placeTrain(car, long, (o) => {
      const b = new THREE.Box3().setFromObject(o);
      return { minX: b.min.x, maxX: b.max.x };
    });
    const b = new THREE.Box3().setFromObject(train.group);
    expect(b.min.y).toBeCloseTo(1.0, 5);
    expect(b.max.y).toBeCloseTo(1.0 + 4 * STUDS_PER_METRE, 5);
    expect(b.max.x - b.min.x).toBeCloseTo(2.8 * STUDS_PER_METRE, 5);
    expect(b.min.z).toBeGreaterThanOrEqual(-45);
    expect(b.max.z).toBeLessThanOrEqual(45);
    expect((b.min.z + b.max.z) / 2).toBeCloseTo(0, 5);
    expect(train.group.children).toHaveLength(2);
    train.dispose();
  });

  it("couple as many cars as fit, one at least, MAX_CARS at most", () => {
    expect(carCentres({ x: 0, z0: -10, z1: 10, top: 0 }, 39)).toEqual([0]);
    expect(carCentres({ x: 0, z0: -400, z1: 400, top: 0 }, 39)).toHaveLength(MAX_CARS);
    const two = carCentres({ x: 0, z0: -45, z1: 45, top: 0 }, 39);
    expect(two).toHaveLength(2);
    expect(two[0]! + two[1]!).toBeCloseTo(0, 9);
  });
});
