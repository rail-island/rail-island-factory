// The 3D preview's photos: every mesh whose material the model names as a surface
// (userData.surfaces, docs/models/surfaces.md) gets its photo set from the export's
// textures/ folder, tinted the way the game tints it, so the preview shows what the
// game will draw. The thumbnails and the far band stay flat-coloured by design.

import { Color, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, Mesh, type Object3D, type Texture } from "three";
import type { SurfacePreset } from "../generator/surfaces.ts";

type Meta = { surfaces: Record<string, SurfacePreset> };

let meta: Promise<Meta | null> | null = null;
const textures = new Map<string, { map: Texture; normalMap: Texture; roughnessMap: Texture }>();

function loadMeta(base: string): Promise<Meta | null> {
  meta ??= fetch(`${base}surfaces.meta.json`).then((r) => (r.ok ? (r.json() as Promise<Meta>) : null)).catch(() => null);
  return meta;
}

function photo(base: string, name: string): { map: Texture; normalMap: Texture; roughnessMap: Texture } {
  let set = textures.get(name);
  if (set) return set;
  const loader = new TextureLoader();
  const load = (channel: string): Texture => {
    const t = loader.load(`${base}textures/${name}_${channel}.jpg`);
    t.wrapS = RepeatWrapping;
    t.wrapT = RepeatWrapping;
    return t;
  };
  const map = load("albedo");
  map.colorSpace = SRGBColorSpace;
  set = { map, normalMap: load("normal"), roughnessMap: load("rough") };
  textures.set(name, set);
  return set;
}

/** The tint a surface multiplies its photo by: the colour lifted toward white times the gain, or the fixed tint. */
export function surfaceTint(preset: SurfacePreset, color: Color): Color {
  if (preset.tint) return new Color(...preset.tint);
  return color.clone().lerp(new Color(1, 1, 1), preset.tintLift).multiplyScalar(preset.gain ?? 1);
}

/** Bind the photos of every surface `root` names. Resolves when the materials are set (the images stream in after). */
export async function applySurfaces(root: Object3D, base = import.meta.env?.BASE_URL ?? "/"): Promise<void> {
  const named = root.userData.surfaces as Record<string, string> | undefined;
  if (!named) return;
  const m = await loadMeta(base);
  if (!m) return;
  root.traverse((o) => {
    if (!(o instanceof Mesh) || !(o.material instanceof MeshStandardMaterial)) return;
    const preset = m.surfaces[named[o.material.name] ?? ""];
    if (!preset) return;
    const mat = o.material;
    const set = photo(base, preset.texture);
    const tint = surfaceTint(preset, mat.color);
    Object.assign(mat, set);
    mat.color.copy(tint);
    if (preset.normalScale !== undefined) mat.normalScale.setScalar(preset.normalScale);
    if (preset.fill) {
      mat.emissiveMap = set.map;
      mat.emissive.copy(tint);
      mat.emissiveIntensity = preset.fill;
    }
    mat.needsUpdate = true;
  });
}
