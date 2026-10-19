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
  /** Optional close-up detail level, currently every tree. */
  buildMax?: (three: object, params?: Record<string, string>) => Object3D;
  pose?: (root: Object3D, pose: { steer: number; bend: number[] }) => void;
}
/**
 * What a model's JS module uses of three: its classes and constants (DoubleSide
 * for a palm frond's single-layer foliage). A name missing here reads as
 * undefined in the module, not as an error (test/modelModule.test.ts).
 */
export const THREE_SUBSET = { Group, Mesh, BufferGeometry, BufferAttribute, MeshStandardMaterial, DoubleSide, AnimationClip, QuaternionKeyframeTrack, VectorKeyframeTrack };
const modules = new Map<string, Promise<JsModule>>();
/** Each loaded module's text, by URL: what `pnpm dev` measures (devMeasure.ts). */
const sources = new Map<string, string>();

/** A model's standalone JS module, loaded once: fetched as text and imported from a blob URL. */
export function jsModule(url: string): Promise<JsModule> {
  let p = modules.get(url);
  if (!p) {
    p = (async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${url}: ${res.status}`);
      const text = await res.text();
      sources.set(url, text);
      const blob = URL.createObjectURL(new Blob([text], { type: "text/javascript" }));
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

/** A model's JS module and its text, loaded once (jsModule). */
export async function jsModuleWithSource(url: string): Promise<{ mod: JsModule; text: string }> {
  const mod = await jsModule(url);
  return { mod, text: sources.get(url)! };
}

/**
 * The model as the page should show it: a JS build of the chosen values, with its
 * animation clips (none for most models).
 */
export async function loadModel(record: CatalogRecord, params: Record<string, string>, lod: PreviewLod = false): Promise<{ object: Object3D; clips: AnimationClip[] }> {
  const mod = await jsModule(`/${record.jsUrl}`);
  const object = buildPreview(mod, params, lod);
  return { object, clips: object.animations };
}

/** Build a selected level; unsupported Max detail falls back to full detail. */
export function buildPreview(mod: JsModule, params: Record<string, string>, lod: PreviewLod = false): Object3D {
  if (lod === "max") return mod.buildMax ? mod.buildMax(THREE_SUBSET, params) : mod.default(THREE_SUBSET, params, false);
  if (lod === "coarse" && mod.buildCoarse) return mod.buildCoarse(THREE_SUBSET, params);
  return mod.default(THREE_SUBSET, params, lod !== false);
}
