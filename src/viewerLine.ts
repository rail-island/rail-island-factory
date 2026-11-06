// A cable car cabin's scenery (CatalogRecord.scenery, way "ropeway";
// docs/site/catalog-site.md, "Scenery"): the cabin shown on a line as the game builds
// it -- the Cable Car Line preview (generator/previews/cableCarLine.ts) for this cabin,
// between two stations of the type the viewer picks, with one, two or six cabins
// running. The line draws the cabin itself (in the game's studs, hung from its rope),
// so the viewer hides the page's own model while the line is shown, and plays the
// line's `running` clip for as long as it is.

import { AnimationMixer, Box3, type Object3D } from "three";
import type { Scenery } from "./catalogQuery";
import { buildPreview, jsModule } from "./modelModule";

export interface Line {
  group: Object3D;
  /** The line's extent, for framing it. */
  box: Box3;
  /** Advances the cabins by `dt` seconds. */
  tick: (dt: number) => void;
  dispose: () => void;
}

/** The line preview's parameters for a cabin's ropeway at a station type and a cabin count (the count the cabin offers nearest to the one asked). */
export function lineParams(ropeway: NonNullable<Scenery["ropeway"]>, station: string, count: string): Record<string, string> {
  const st = ropeway.stations.some((s) => s.value === station) ? station : ropeway.stations[0]!.value;
  const counts = ropeway.counts.map((c) => c.value);
  const n = counts.includes(count) ? count : counts[counts.length - 1]!;
  return { cabin: ropeway.cabin, station: st, cabins: n };
}

/** Builds the line for `params` (lineParams): the preview's JS model, its clip running. */
export async function loadLine(ropeway: NonNullable<Scenery["ropeway"]>, params: Record<string, string>): Promise<Line> {
  const mod = await jsModule(`/js/${ropeway.line}.js`);
  const group = buildPreview(mod, params, false);
  group.name = "scenery";
  const mixer = new AnimationMixer(group);
  for (const clip of group.animations) mixer.clipAction(clip).play();
  group.updateMatrixWorld(true);
  return {
    group,
    box: new Box3().setFromObject(group),
    tick: (dt) => mixer.update(dt),
    dispose: () => {
      mixer.stopAllAction();
      group.traverse((o) => {
        const mesh = o as { geometry?: { dispose: () => void }; material?: unknown };
        mesh.geometry?.dispose?.();
        const mat = mesh.material;
        if (Array.isArray(mat)) for (const m of mat) (m as { dispose?: () => void }).dispose?.();
        else if (mat) (mat as { dispose?: () => void }).dispose?.();
      });
    },
  };
}
