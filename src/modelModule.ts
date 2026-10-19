// A model's standalone JS module in the browser (js/<id>.js, build(THREE, params,
// lod), docs/models/js-format.md): fetched once, imported from a blob URL and
// built with the three classes it needs. The preview (ModelViewer) and the
// export (exportRun) both build models through it; both are lazily loaded, so
// three reaches the page only when one of them runs.

import { AnimationClip, BufferAttribute, BufferGeometry, DoubleSide, Group, Mesh, MeshStandardMaterial, QuaternionKeyframeTrack, VectorKeyframeTrack, type Object3D } from "three";
import type { CatalogRecord, PreviewLod } from "./catalogQuery";

type JsBuild = (three: object, params?: Record<string, string>, lod?: boolean) => Object3D;
/** A model's JS module: build(), and for a rigged model pose() (generator/rig.ts). */
export interface JsModule {
  default: JsBuild;
  /** A tree's third, coarsest level (docs/models/trees.md). */
  buildCoarse?: (three: object, params?: Record<string, string>) => Object3D;
  pose?: (root: Object3D, pose: { steer: number; bend: number[] }) => void;
}
/**
 * What a model's JS module uses of three: its classes and constants (DoubleSide
 * for a palm frond's single-layer foliage). A name missing here reads as
 * undefined in the module, not as an error (test/modelModule.test.ts).
 */
export const THREE_SUBSET = { Group, Mesh, BufferGeometry, BufferAttribute, MeshStandardMaterial, DoubleSide, AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack };
const modules = new Map<string, Promise<JsModule>>();

/** A model's standalone JS module, loaded once: fetched as text and imported from a blob URL. */
export function jsModule(url: string): Promise<JsModule> {
  let p = modules.get(url);
  if (!p) {
    p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const blob = URL.createObjectURL(new Blob([await res.text()], { type: "text/javascript" }));
      try {
        return (await import(/* @vite-ignore */ blob)) as JsModule;
      } finally {
        URL.revokeObjectURL(blob);
      }
    })();
    p.catch(() => modules.delete(url));
    modules.set(url, p);
  }
  return p;
}

/**
 * The model as the page should show it: a JS build of the chosen values, with its
 * animation clips (none for most models).
 */
export async function loadModel(record: CatalogRecord, params: Record<string, string>, lod: PreviewLod = false): Promise<{ object: Object3D; clips: AnimationClip[] }> {
  const mod = await jsModule(`/${record.jsUrl}`);
  // a tree's coarse level, where the model has one; any other model's low LOD
  const object = lod === "coarse" && mod.buildCoarse ? mod.buildCoarse(THREE_SUBSET, params) : mod.default(THREE_SUBSET, params, lod !== false);
  return { object, clips: object.animations };
}
