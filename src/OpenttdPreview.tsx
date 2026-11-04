// The model page's OpenTTD view (docs/site/openttd-export.md, "The OpenTTD view"):
// the model's whole one-click pack - every preset and formation the downloaded GRF
// holds - drawn as the GRF would draw it, each vehicle on its own track of a yard
// prerendered in OpenTTD with exactly as many tracks (src/openttd/scenes/, made by
// generator/openttdScenes/prerender.ts), each labelled with its OpenTTD name and
// id. The scene's background, the vehicles' sprites, the scene's foreground (wires,
// fences) over them, then the labels; shown cropped to the vehicles. "Auto" fits
// it to the space (scene.ts chooseView): OpenTTD's 4x zoom where it fits, cut to
// the vehicles' fronts on a small screen, shrunk, or normal zoom for a large pack
// on a small screen; 4x and normal zoom can be asked for. A pack of more than 10
// vehicles is shown 10 at a time.
//
// Lazily imported with three (the sprites come from exportRun.ts previewSprites,
// the export's own WebGL renderer), so the listing never loads either.

import { For, Show, createEffect, createMemo, createResource, createSignal, on, onCleanup, onMount } from "solid-js";
import type { CatalogRecord } from "./catalogQuery";
import { previewSprites, type PreviewPart } from "./exportRun";
import { grfIdText, oneClickItems, openttdFeature, resolveItem, resolveVehicle, type ExportItem } from "./openttd/properties";
import {
  chooseView, FRONT_MARGIN, frontPoint, labelsOverlap, preferTags, kindOf, labelRect, placeParts, SCENE_SLOTS, sceneName, viewRect, type Placement, type PreviewZoom, type Rect,
  type ViewChoice,
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

/** The labels' main type size in image pixels at each zoom, and the least it reads at on screen. */
const LABEL_PX: Record<PreviewZoom, number> = { "4x": 18, "1x": 9 };
const LABEL_CSS_PX = 12;
/** The height the zoom choice and notes take along the view's foot. */
const CONTROLS_HEIGHT = 48;
/** A legend row's height, CSS pixels. */
const LEGEND_ROW = 18;

type LabelStyle = "labels" | "tags";

/** The space left for the view above a legend of `n` rows (at most half the height; it scrolls beyond). */
function legendRoom(space: readonly [number, number], n: number): [number, number] {
  return [space[0], Math.max(100, space[1] - Math.min(Math.round(space[1] / 2), n * LEGEND_ROW + 8))];
}

/** The labels' type at a main size: like OpenTTD's signs, light text on a dark box. */
function labelType(px: number) {
  const small = Math.round(px * 0.83);
  const pad = Math.max(3, Math.round(px / 3));
  const gap = Math.max(1, Math.round(px / 6));
  const line = Math.round(px * 1.1);
  const smallLine = Math.round(small * 1.1);
  return {
    font: `bold ${px}px system-ui, sans-serif`, small: `${small}px ui-monospace, monospace`,
    pad, gap, line, height: 2 * pad + line + gap + smallLine,
  };
}

export function OpenttdPreview(props: {
  record: CatalogRecord;
}) {
  // "auto" picks the zoom, the cut and the scale for the space (chooseView)
  const [zoomMode, setZoomMode] = createSignal<"auto" | PreviewZoom>("auto");
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
  let box!: HTMLDivElement;
  // the space the view has, CSS pixels, less the controls along its foot
  const [avail, setAvail] = createSignal<[number, number]>([800, 480]);
  onMount(() => {
    const measure = () => setAvail([Math.max(120, box.clientWidth - 8), Math.max(120, box.clientHeight - CONTROLS_HEIGHT)]);
    measure();
    const ro = new ResizeObserver(() => measure());
    ro.observe(box);
    onCleanup(() => ro.disconnect());
  });
  const [view, setView] = createSignal<ViewChoice | null>(null);
  // the names of a view whose vehicles carry number tags
  const [legend, setLegend] = createSignal<Array<{ n: number; name: string; id: string }>>([]);
  // larger than the space (a zoom asked for, or the least scale): scroll from the top left
  const overflows = () => {
    const v = view();
    return !!v && (v.rect[2] * v.scale > avail()[0] + 1 || v.rect[3] * v.scale > avail()[1] + 1);
  };
  const [drawError, setDrawError] = createSignal<string | null>(null);
  createEffect(() => {
    const all = sprites();
    const mode = zoomMode();
    const space = avail();
    const { feature, placement } = scene();
    const list = shown();
    if (!all || all.length !== list.length) return;
    const names = list.map((item) => resolveItem(item).vehicle.name);
    const ids = list.map((item) => hexId(item.baseId));
    const measureCtx = document.createElement("canvas").getContext("2d")!;
    /**
     * Where every sprite and label goes at a zoom, the labels' type at `labelPx`:
     * "labels" the name and id ahead of each nose, "tags" a number there, the names
     * in the legend under the view.
     */
    const layout = (z: PreviewZoom, labelPx: number, style: LabelStyle) => {
      const size = placement.sizes[z];
      const sprites: Array<{ img: { width: number; height: number; rgba: Uint8Array }; x: number; y: number }> = [];
      const rects: Rect[] = [];
      const fronts: Rect[] = [];
      for (const [i, parts] of all.entries()) {
        const slot = placement.slots[i]!;
        const imgs = parts.map((p) => p.images.get(slot.direction)![z]);
        const at = placeParts(feature, slot, z, parts.map((p) => p.length), imgs.map((im) => [im.xOffs, im.yOffs] as const));
        for (const p of at) {
          const im = imgs[p.part]!;
          sprites.push({ img: im, x: p.x, y: p.y });
          rects.push([p.x, p.y, im.width, im.height]);
          if (p.part === 0) fronts.push([p.x, p.y, im.width, im.height]);
        }
      }
      const t = labelType(labelPx);
      const labels = list.map((_, i) => {
        measureCtx.font = t.font;
        let r: Rect;
        if (style === "tags") {
          const w = Math.ceil(measureCtx.measureText(String(i + 1)).width + 2 * t.pad);
          r = labelRect(feature, frontPoint(feature, placement.slots[i]!, z), Math.max(w, t.line + t.pad), t.line + 2 * t.pad, z, size);
        } else {
          const w1 = measureCtx.measureText(names[i]!).width;
          measureCtx.font = t.small;
          const w2 = measureCtx.measureText(ids[i]!).width;
          r = labelRect(feature, frontPoint(feature, placement.slots[i]!, z), Math.ceil(Math.max(w1, w2) + 2 * t.pad), t.height, z, size);
        }
        rects.push(r);
        fronts.push(r);
        return r;
      });
      return { size, sprites, labels, all: viewRect(rects, z, size), front: viewRect(fronts, z, size, FRONT_MARGIN), t, style };
    };
    // the view: the most detailed that fits (chooseView), or the zoom asked for. The
    // labels read at about LABEL_CSS_PX on screen whatever the scale, so they grow as
    // the view shrinks: choose again with them at the size the choice needs
    const pxFor = (c: ViewChoice) => Math.max(LABEL_PX[c.zoom], Math.round(LABEL_CSS_PX / c.scale));
    const fit = (style: LabelStyle, room: [number, number]): ViewChoice => {
      let px4 = LABEL_PX["4x"];
      let l = layout("4x", px4, style);
      let c = chooseView(l.all, l.front, l.size, room);
      for (let i = 0; i < 2 && c.zoom === "4x" && pxFor(c) !== px4; i++) {
        px4 = pxFor(c);
        l = layout("4x", px4, style);
        c = chooseView(l.all, l.front, l.size, room);
      }
      return c;
    };
    const asked = (z: PreviewZoom, style: LabelStyle): ViewChoice => ({ zoom: z, rect: layout(z, LABEL_PX[z], style).all, scale: 1, fit: "full" });
    // full labels where they fit at 4x and apart; else number tags with a legend under
    // the view - which takes some of its height, but lets the fronts shrink to fit 4x
    const room = legendRoom(space, list.length);
    let choice = mode === "auto" ? fit("labels", space) : asked(mode, "labels");
    let style: LabelStyle = "labels";
    const crowded = (c: ViewChoice) => labelsOverlap(layout(c.zoom, pxFor(c), "labels").labels);
    const tagged = mode === "auto" ? fit("tags", room) : asked(mode, "tags");
    if (preferTags(choice, tagged, crowded(choice))) {
      choice = tagged;
      style = "tags";
    }
    const labelPx = pxFor(choice);
    const final = layout(choice.zoom, labelPx, style);
    const rect = choice.fit === "front" ? choice.rect : final.all;
    const z = choice.zoom;
    void (async () => {
      try {
        const [bg, fg] = await Promise.all([
          loadImage(IMAGES[`./openttd/scenes/${placement.scene}/background-${z}.png`]!),
          loadImage(IMAGES[`./openttd/scenes/${placement.scene}/foreground-${z}.png`]!),
        ]);
        // the whole scene first, off screen, then the view's part of it
        const full = document.createElement("canvas");
        full.width = final.size[0];
        full.height = final.size[1];
        const ctx = full.getContext("2d")!;
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(bg, 0, 0);
        for (const sp of final.sprites) ctx.drawImage(spriteCanvas(sp.img), sp.x, sp.y);
        ctx.drawImage(fg, 0, 0);
        // the labels: the OpenTTD name, then the local id (or a number, the legend naming it)
        const t = final.t;
        for (const [i, r] of final.labels.entries()) {
          if (final.style === "tags") {
            ctx.fillStyle = "rgba(20, 20, 28, 0.88)";
            ctx.fillRect(r[0], r[1], r[2], r[3]);
            ctx.textBaseline = "top";
            ctx.fillStyle = "#ffffff";
            ctx.font = t.font;
            ctx.textAlign = "center";
            ctx.fillText(String(i + 1), r[0] + r[2] / 2, r[1] + t.pad);
            ctx.textAlign = "start";
            continue;
          }
          ctx.fillStyle = "rgba(20, 20, 28, 0.82)";
          ctx.fillRect(r[0], r[1], r[2], r[3]);
          ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
          ctx.lineWidth = Math.max(1, Math.round(1 / choice.scale));
          ctx.strokeRect(r[0] + 0.5, r[1] + 0.5, r[2] - 1, r[3] - 1);
          ctx.textBaseline = "top";
          ctx.fillStyle = "#ffffff";
          ctx.font = t.font;
          ctx.fillText(names[i]!, r[0] + t.pad, r[1] + t.pad);
          ctx.fillStyle = "#b8e0b0";
          ctx.font = t.small;
          ctx.fillText(ids[i]!, r[0] + t.pad, r[1] + t.pad + t.line + t.gap);
        }
        const [vx, vy, vw, vh] = rect;
        canvas.width = vw;
        canvas.height = vh;
        canvas.style.width = `${Math.round(vw * choice.scale)}px`;
        canvas.style.height = `${Math.round(vh * choice.scale)}px`;
        // shrunk pixel art reads best smoothed, shown at its own pixels or larger crisp
        canvas.style.imageRendering = choice.scale < 1 ? "auto" : "pixelated";
        const out = canvas.getContext("2d")!;
        out.imageSmoothingEnabled = false;
        out.drawImage(full, vx, vy, vw, vh, 0, 0, vw, vh);
        setView({ ...choice, rect });
        setLegend(final.style === "tags" ? names.map((name, i) => ({ n: i + 1, name, id: ids[i]! })) : []);
        setDrawError(null);
      } catch (e) {
        setDrawError((e as Error).message);
      }
    })();
  });

  return (
    <div class="factory-ottd" ref={box}>
      <div class="factory-ottd__scroll" classList={{ "factory-ottd__scroll--over": overflows() }}>
        <canvas ref={canvas} class="factory-ottd__canvas" aria-label={`${props.record.title} in OpenTTD`} />
      </div>
      <Show when={legend().length > 0}>
        <ol class="factory-ottd__legend" aria-label="Vehicles in the GRF">
          <For each={legend()}>
            {(row) => (
              <li>
                <span class="factory-ottd__tag">{row.n}</span> {row.name} <span class="factory-ottd__id">{row.id}</span>
              </li>
            )}
          </For>
        </ol>
      </Show>
      <Show when={sprites.loading}>
        <div class="factory-viewer__overlay">Drawing the OpenTTD sprites... {progress() + 1} of {shown().length}</div>
      </Show>
      <Show when={sprites.error || drawError()}>
        <div class="factory-viewer__overlay factory-error">{(sprites.error as Error | undefined)?.message ?? drawError()}</div>
      </Show>
      <div class="factory-viewer__controls" role="group" aria-label="OpenTTD view">
        <select class="factory-viewer__select" aria-label="Zoom" value={zoomMode()} onChange={(e) => setZoomMode(e.currentTarget.value as "auto" | PreviewZoom)}>
          <option value="auto">{`Auto${view() && zoomMode() === "auto" ? ` (${view()!.zoom === "4x" ? "4x" : "normal"}${view()!.fit === "front" ? ", fronts" : ""})` : ""}`}</option>
          <option value="4x">4x zoom</option>
          <option value="1x">Normal zoom</option>
        </select>
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
