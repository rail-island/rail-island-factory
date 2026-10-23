// The texture library and the named surfaces (docs/models/surfaces.md).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import * as THREE from "three";
import { describe, expect, it } from "vitest";
import { MAX_TEXTURES, SURFACES, SURFACE_IDS, TEXTURE_AVERAGE, TEXTURE_CHANNELS, TEXTURE_NAMES, TEXTURE_SIZE, surfaceMaterial } from "../generator/surfaces.ts";
import { TEXTURES_DIR, surfacesMeta } from "../generator/surfacesExport.ts";
import { MeshBuilder } from "../generator/threeBuilder.ts";

const hexRgb = (hex: string): [number, number, number] => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

describe("texture library", () => {
  it("holds at most MAX_TEXTURES sets and nothing but them and SOURCES.md", () => {
    expect(TEXTURE_NAMES.length).toBeLessThanOrEqual(MAX_TEXTURES);
    const want = new Set(["SOURCES.md", ...TEXTURE_NAMES.flatMap((n) => TEXTURE_CHANNELS.map((c) => `${n}_${c}.jpg`))]);
    expect(new Set(fs.readdirSync(TEXTURES_DIR))).toEqual(want);
  });

  it("lists every set in SOURCES.md with its licence", () => {
    const sources = fs.readFileSync(path.join(TEXTURES_DIR, "SOURCES.md"), "utf8");
    for (const name of TEXTURE_NAMES) expect(sources).toMatch(new RegExp(`\\| \`${name}_albedo\\.jpg\`.*\\| CC0 \\|`));
  });

  for (const name of TEXTURE_NAMES) {
    it(`${name}: three ${TEXTURE_SIZE} px maps, its average albedo pinned`, async () => {
      for (const c of TEXTURE_CHANNELS) {
        const meta = await sharp(path.join(TEXTURES_DIR, `${name}_${c}.jpg`)).metadata();
        expect([meta.width, meta.height]).toEqual([TEXTURE_SIZE, TEXTURE_SIZE]);
      }
      const { data, info } = await sharp(path.join(TEXTURES_DIR, `${name}_albedo.jpg`)).raw().toBuffer({ resolveWithObject: true });
      const sum = [0, 0, 0];
      for (let i = 0; i < data.length; i += info.channels) for (let k = 0; k < 3; k++) sum[k]! += data[i + k]!;
      const n = info.width * info.height;
      const want = hexRgb(TEXTURE_AVERAGE[name]);
      for (let k = 0; k < 3; k++) expect(Math.abs(sum[k]! / n - want[k]!)).toBeLessThan(3);
    });
  }
});

describe("named surfaces", () => {
  it("each names a texture of the library, a positive tile and a lift in 0..1", () => {
    for (const id of SURFACE_IDS) {
      const s: { texture: string; tile: number; tintLift: number; flat?: string } = SURFACES[id];
      expect(TEXTURE_NAMES, id).toContain(s.texture);
      expect(s.tile, id).toBeGreaterThan(0);
      expect(s.tintLift, id).toBeGreaterThanOrEqual(0);
      expect(s.tintLift, id).toBeLessThanOrEqual(1);
      if (s.flat) expect(s.flat).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("gives a surface material an honest flat colour: the given one, else its flat, else the photo's average", () => {
    expect(surfaceMaterial("model-brick").color).toBe(TEXTURE_AVERAGE.wall);
    expect(surfaceMaterial("bridge-brick").color).toBe("#995848");
    expect(surfaceMaterial("model-stone", { color: "#808080" })).toMatchObject({ color: "#808080", surface: "model-stone", surfaceTile: 2.5 });
  });

  it("exports every texture with its hashes and every surface", () => {
    const meta = surfacesMeta();
    expect(meta.textures.map((t) => t.name)).toEqual(TEXTURE_NAMES);
    for (const t of meta.textures) expect(Object.keys(t.sha256)).toEqual(t.files);
    expect(Object.keys(meta.surfaces)).toEqual(SURFACE_IDS);
  });

  it("puts box-projected UVs and userData.surfaces on a model that names one, and nothing on others", () => {
    const b = new MeshBuilder({ wall: surfaceMaterial("model-brick"), plain: { color: "#ffffff" } });
    b.box("wall", 0, 0, 4, 1, 0, 2);
    b.box("plain", 0, 0, 1, 1, 2, 3);
    const group = b.toGroup(THREE, "test");
    expect(group.userData.surfaces).toEqual({ wall: "model-brick" });
    const wall = group.children.find((c) => c.name === "wall") as THREE.Mesh;
    const plain = group.children.find((c) => c.name === "plain") as THREE.Mesh;
    const uv = wall.geometry.getAttribute("uv");
    expect(uv.count).toBe(wall.geometry.getAttribute("position").count);
    // a 4-unit wall at 2 units per repeat spans 2 repeats along x
    const us = Array.from({ length: uv.count }, (_, i) => uv.getX(i));
    expect(Math.max(...us) - Math.min(...us)).toBeCloseTo(2, 5);
    expect(plain.geometry.getAttribute("uv")).toBeUndefined();
    expect((wall.material as THREE.MeshStandardMaterial).color.getHexString()).toBe(TEXTURE_AVERAGE.wall.slice(1));
    const again = b.toGroup(THREE, "test").children.find((c) => c.name === "wall") as THREE.Mesh;
    expect(Array.from(again.geometry.getAttribute("uv").array)).toEqual(Array.from(uv.array));
  });
});
