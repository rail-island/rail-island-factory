// The model page's OpenTTD view (docs/site/openttd-export.md, "The OpenTTD view"):
// the model's whole one-click pack - every preset and formation the downloaded GRF
// holds - drawn as the GRF would draw it, each vehicle on its own track of a yard
// prerendered in OpenTTD with exactly as many tracks (src/openttd/scenes/, made by
// generator/openttdScenes/prerender.ts), each labelled with its OpenTTD name and
// id. The scene's background, the vehicles' sprites, the scene's foreground (wires,
// fences) over them, then the labels; shown cropped to the vehicles, at OpenTTD's
// 4x zoom or, with the toggle, normal zoom. A pack of more than 10 vehicles is
// shown 10 at a time.
//
// Lazily imported with three (the sprites come from exportRun.ts previewSprites,
// the export's own WebGL renderer), so the listing never loads either.

import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup } from "solid-js";
import type { CatalogRecord } from "./catalogQuery";
import { previewSprites, type PreviewPart } from "./exportRun";
import { grfIdText, oneClickItems, openttdFeature, resolveItem, resolveVehicle, type ExportItem } from "./openttd/properties";
import {
  frontPoint, kindOf, labelRect, placeParts, SCENE_SLOTS, sceneName, viewRect, type Placement, type PreviewZoom, type Rect,
} from "./openttd/scene";

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

/** A local id as OpenTTD's debug output writes it: 0x0100. */
function hexId(id: number | undefined): string {
  return id === undefined ? "-" : `0x${id.toString(16).toUpperCase().padStart(4, "0")}`;
}

/** The labels' type: like OpenTTD's signs, light text on a dark box. */
const LABEL = {
  "4x": { font: "bold 18px system-ui, sans-serif", small: "15px ui-monospace, monospace", pad: 6, gap: 3, line: 20, smallLine: 16 },
  "1x": { font: "bold 9px system-ui, sans-serif", small: "8px ui-monospace, monospace", pad: 3, gap: 1, line: 10, smallLine: 9 },
} as const;

export function OpenttdPreview(props: {
  record: CatalogRecord;
}) {
  const [zoom, setZoom] = createSignal<PreviewZoom>("4x");
  const [page, setPage] = createSignal(0);
  createEffect(on(() => props.record.id, () => setPage(0)));
  // the pack the one-click download writes (oneClickItems): every preset, then every formation
  const items = createMemo(() => oneClickItems(props.record));
  const pages = createMemo(() => Math.ceil(items().length / SCENE_SLOTS));
  const shown = createMemo<ExportItem[]>(() => items().slice(page() * SCENE_SLOTS, page() * SCENE_SLOTS + SCENE_SLOTS));
  const scene = createMemo(() => {
    const feature = openttdFeature(props.record)!;
    const v = resolveVehicle(props.record, items()[0]!.cars[0]!.params);
    const placement = placementOf(sceneName(kindOf(feature, v.railType, v.tram), shown().length));
    return { feature, placement };
  });
  // every shown vehicle's sprites, in its slot's direction, drawn one after another
  const [progress, setProgress] = createSignal(0);
  let abort: AbortController | null = null;
  onCleanup(() => abort?.abort());
  const [sprites] = createResource(
    () => ({ items: shown(), placement: scene().placement }),
    async ({ items, placement }): Promise<PreviewPart[][]> => {
      abort?.abort();
      abort = new AbortController();
      const signal = abort.signal;
      const out: PreviewPart[][] = [];
      for (const [i, item] of items.entries()) {
        setProgress(i);
        out.push(await previewSprites(item, [placement.slots[i]!.direction], signal));
      }
      return out;
    },
  );
  let canvas!: HTMLCanvasElement;
  const [drawError, setDrawError] = createSignal<string | null>(null);
  createEffect(() => {
    const all = sprites();
    const z = zoom();
    const { feature, placement } = scene();
    const list = shown();
    if (!all || all.length !== list.length) return;
    void (async () => {
      try {
        const [bg, fg] = await Promise.all([
          loadImage(IMAGES[`./openttd/scenes/${placement.scene}/background-${z}.png`]!),
          loadImage(IMAGES[`./openttd/scenes/${placement.scene}/foreground-${z}.png`]!),
        ]);
        const size = placement.sizes[z];
        // the whole scene first, off screen, then the view's part of it
        const full = document.createElement("canvas");
        full.width = size[0];
        full.height = size[1];
        const ctx = full.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bg, 0, 0);
        const rects: Rect[] = [];
        for (const [i, parts] of all.entries()) {
          const slot = placement.slots[i]!;
          const imgs = parts.map((p) => p.images.get(slot.direction)![z]);
          const at = placeParts(feature, slot, z, parts.map((p) => p.length), imgs.map((im) => [im.xOffs, im.yOffs] as const));
          for (const p of at) {
            const im = imgs[p.part]!;
            ctx.drawImage(spriteCanvas(im), p.x, p.y);
            rects.push([p.x, p.y, im.width, im.height]);
          }
        }
        ctx.drawImage(fg, 0, 0);
        // the labels: the OpenTTD name, then the local id
        const L = LABEL[z];
        for (const [i, item] of list.entries()) {
          const name = resolveItem(item).vehicle.name;
          const id = hexId(item.baseId);
          ctx.font = L.font;
          const w1 = ctx.measureText(name).width;
          ctx.font = L.small;
          const w2 = ctx.measureText(id).width;
          const width = Math.ceil(Math.max(w1, w2) + 2 * L.pad);
          const height = L.pad * 2 + L.line + L.gap + L.smallLine;
          const r = labelRect(feature, frontPoint(feature, placement.slots[i]!, z), width, height, z, size);
          ctx.fillStyle = "rgba(20, 20, 28, 0.82)";
          ctx.fillRect(r[0], r[1], r[2], r[3]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = 1;
          ctx.strokeRect(r[0] + 0.5, r[1] + 0.5, r[2] - 1, r[3] - 1);
          ctx.textBaseline = "top";
          ctx.fillStyle = "#ffffff";
          ctx.font = L.font;
          ctx.fillText(name, r[0] + L.pad, r[1] + L.pad);
          ctx.fillStyle = "#b8e0b0";
          ctx.font = L.small;
          ctx.fillText(id, r[0] + L.pad, r[1] + L.pad + L.line + L.gap);
          rects.push(r);
        }
        const [vx, vy, vw, vh] = viewRect(rects, z, size);
        canvas.width = vw;
        canvas.height = vh;
        const out = canvas.getContext("2d")!;
        out.imageSmoothingEnabled = false;
        out.drawImage(full, vx, vy, vw, vh, 0, 0, vw, vh);
        setDrawError(null);
      } catch (e) {
        setDrawError((e as Error).message);
      }
    })();
  });

  return (
    <div class="factory-ottd">
      <div class="factory-ottd__scroll" classList={{ "factory-ottd__scroll--4x": zoom() === "4x" }}>
        <canvas ref={canvas} class="factory-ottd__canvas" aria-label={`${props.record.title} in OpenTTD`} />
      </div>
      <Show when={sprites.loading}>
        <div class="factory-viewer__overlay">Drawing the OpenTTD sprites... {progress() + 1} of {shown().length}</div>
      </Show>
      <Show when={sprites.error || drawError()}>
        <div class="factory-viewer__overlay factory-error">{(sprites.error as Error | undefined)?.message ?? drawError()}</div>
      </Show>
      <div class="factory-viewer__controls" role="group" aria-label="OpenTTD view">
        <label class="factory-viewer__check">
          <input type="checkbox" checked={zoom() === "1x"} onChange={(e) => setZoom(e.currentTarget.checked ? "1x" : "4x")} />
          Normal zoom
        </label>
        <Show when={pages() > 1}>
          <span class="factory-viewer__note">
            <For each={Array.from({ length: pages() }, (_, i) => i)}>
              {(i) => (
                <button type="button" class="factory-tab" classList={{ "factory-tab--active": page() === i }} onClick={() => setPage(i)}>
                  {`${i * SCENE_SLOTS + 1}-${Math.min(items().length, (i + 1) * SCENE_SLOTS)}`}
                </button>
              )}
            </For>
          </span>
        </Show>
        <Show when={props.record.openttd?.ids}>
          {(ids) => (
            <span class="factory-viewer__note factory-ottd__ids" title="The one-click GRF's id; each label names its vehicle's local id (generator/openttdIds.json)">
              GRF {grfIdText(ids().grf)} · {items().length} {items().length === 1 ? "vehicle" : "vehicles"}
            </span>
          )}
        </Show>
        <span class="factory-viewer__note">
          OpenTTD {scene().placement.openttd}, OpenGFX {scene().placement.opengfx}
        </span>
      </div>
    </div>
  );
}
