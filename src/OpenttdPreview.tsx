// The model page's OpenTTD view (docs/site/openttd-export.md, "The preview"): the
// variant on screen - or one of the model's formations - drawn as the GRF would
// draw it, into a scene prerendered in OpenTTD (src/openttd/scenes/, made by
// generator/openttdScenes/prerender.ts): the scene's background, the vehicle's
// sprites at every slot of its track kind, then the scene's foreground (wires,
// canopies) over them. Normal zoom, or OpenTTD's 4x with the toggle.
//
// Lazily imported with three (the sprites come from exportRun.ts previewSprites,
// the export's own WebGL renderer), so the listing never loads either.

import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup } from "solid-js";
import type { CatalogRecord } from "./catalogQuery";
import { previewSprites, type PreviewPart } from "./exportRun";
import { openttdFeature, resolveVehicle, type ExportItem } from "./openttd/properties";
import { placeParts, sceneOf, trackOf, type Placement, type PreviewZoom } from "./openttd/scene";

const PLACEMENTS = import.meta.glob<Placement>("./openttd/scenes/*/placement.json", { eager: true, import: "default" });
const IMAGES = import.meta.glob<string>("./openttd/scenes/*/*.png", { eager: true, query: "?url", import: "default" });

function placementOf(scene: string): Placement {
  const p = PLACEMENTS[`./openttd/scenes/${scene}/placement.json`];
  if (!p) throw new Error(`no OpenTTD scene "${scene}"`);
  return p;
}

const images = new Map<string, Promise<HTMLImageElement>>();
function loadImage(url: string): Promise<HTMLImageElement> {
  let p = images.get(url);
  if (!p) {
    p = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`${url} did not load`));
      img.src = url;
    });
    p.catch(() => images.delete(url));
    images.set(url, p);
  }
  return p;
}

/** A sprite's straight RGBA as something a canvas draws with alpha. */
function spriteCanvas(img: { width: number; height: number; rgba: Uint8Array }): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(img.rgba), img.width, img.height), 0, 0);
  return c;
}

export function OpenttdPreview(props: {
  record: CatalogRecord;
  /** The parameter values on screen (non-default ones). */
  params: Record<string, string>;
}) {
  const [zoom, setZoom] = createSignal<PreviewZoom>("1x");
  // "" draws the variant on screen; a name, that formation
  const [formation, setFormation] = createSignal("");
  createEffect(on(() => props.record.id, () => setFormation("")));
  const formations = () => props.record.openttd?.formations ?? [];
  const item = createMemo<ExportItem>(() => {
    const f = formations().find((x) => x.name === formation());
    return f
      ? { record: props.record, key: { formation: f.name }, cars: f.cars.map((c) => ({ params: { ...c.params }, ...(c.turned ? { turned: true } : {}) })), formation: f.name }
      : { record: props.record, key: { ...props.params }, cars: [{ params: { ...props.params } }] };
  });
  const scene = createMemo(() => {
    const feature = openttdFeature(props.record)!;
    const v = resolveVehicle(props.record, item().cars[0]!.params);
    const track = trackOf(feature, v.railType, v.tram);
    const placement = placementOf(sceneOf(track));
    return { feature, track, placement, slots: placement.slots.filter((s) => s.track === track) };
  });
  let abort: AbortController | null = null;
  onCleanup(() => abort?.abort());
  const [sprites] = createResource(
    () => ({ item: item(), directions: [...new Set(scene().slots.map((s) => s.direction))] }),
    async ({ item, directions }): Promise<PreviewPart[]> => {
      abort?.abort();
      abort = new AbortController();
      return previewSprites(item, directions, abort.signal);
    },
  );
  let canvas!: HTMLCanvasElement;
  let scroller!: HTMLDivElement;
  const [drawError, setDrawError] = createSignal<string | null>(null);
  createEffect(() => {
    const parts = sprites();
    const z = zoom();
    const { feature, placement, slots } = scene();
    if (!parts) return;
    const name = placement.scene;
    void (async () => {
      try {
        const [bg, fg] = await Promise.all([
          loadImage(IMAGES[`./openttd/scenes/${name}/background-${z}.png`]!),
          loadImage(IMAGES[`./openttd/scenes/${name}/foreground-${z}.png`]!),
        ]);
        const [w, h] = placement.sizes[z];
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bg, 0, 0);
        for (const slot of slots) {
          const imgs = parts.map((p) => p.images.get(slot.direction)![z]);
          const at = placeParts(feature, slot, z, parts.map((p) => p.length), imgs.map((i) => [i.xOffs, i.yOffs] as const));
          for (const p of at) ctx.drawImage(spriteCanvas(imgs[p.part]!), p.x, p.y);
        }
        ctx.drawImage(fg, 0, 0);
        // at 4x the scene is larger than the stage: open it on the first slot
        if (z === "4x" && slots[0]) {
          const [x, y] = slots[0].anchors[z];
          scroller.scrollTo({ left: x - scroller.clientWidth / 2, top: y - scroller.clientHeight / 2 });
        }
        setDrawError(null);
      } catch (e) {
        setDrawError((e as Error).message);
      }
    })();
  });

  return (
    <div class="factory-ottd">
      <div ref={scroller} class="factory-ottd__scroll" classList={{ "factory-ottd__scroll--4x": zoom() === "4x" }}>
        <canvas ref={canvas} class="factory-ottd__canvas" aria-label={`${props.record.title} in OpenTTD`} />
      </div>
      <Show when={sprites.loading}>
        <div class="factory-viewer__overlay">Drawing the OpenTTD sprites...</div>
      </Show>
      <Show when={sprites.error || drawError()}>
        <div class="factory-viewer__overlay factory-error">{(sprites.error as Error | undefined)?.message ?? drawError()}</div>
      </Show>
      <div class="factory-viewer__controls" role="group" aria-label="OpenTTD view">
        <label class="factory-viewer__check">
          <input type="checkbox" checked={zoom() === "4x"} onChange={(e) => setZoom(e.currentTarget.checked ? "4x" : "1x")} />
          4x zoom
        </label>
        <Show when={formations().length > 0}>
          <select class="factory-viewer__select" aria-label="Vehicle" value={formation()} onChange={(e) => setFormation(e.currentTarget.value)}>
            <option value="">This variant</option>
            <For each={formations()}>{(f) => <option value={f.name}>{`Formation: ${f.name}`}</option>}</For>
          </select>
        </Show>
        <span class="factory-viewer__note">
          OpenTTD {scene().placement.openttd}, OpenGFX {scene().placement.opengfx}
        </span>
      </div>
    </div>
  );
}
