// The OpenTTD view's geometry (docs/site/openttd-export.md, "The OpenTTD view"):
// which prerendered scene a model's pack is drawn into, where each of a vehicle's
// sprites goes in the scene's image, where its label goes and the part of the scene
// the view shows. Pure numbers - no DOM, no three - so Vitest checks it;
// OpenttdPreview.tsx only draws what it is told.
//
// The scenes (generator/openttdScenes/prerender.ts) are yards of 1..10 parallel
// tracks (plain rail, electrified, road, tram), a harbour and an airport of 10
// slots each. A scene's placement.json gives each slot's heading and, per zoom, the
// pixel where OpenTTD anchored the sprite of a full-length (8/8) marker part stopped
// there. From it the vehicle's front is found, and from the front each part's
// position, as OpenTTD lines up a train or road vehicle's parts (projection.ts): the
// head's position ceil(L / 2) units behind the front, each next part
// floor(L / 2) + ceil(L' / 2) units behind the one ahead.

import { HEADINGS, spriteAnchor } from "./projection";
import type { OpenttdFeature } from "./properties";

export type SceneKind = "rail" | "electric" | "road" | "tram" | "harbour" | "airport";
export type PreviewZoom = "1x" | "4x";

/** The most vehicles a scene holds: a yard's 10 tracks, the harbour's lanes, the airport's terminals. */
export const SCENE_SLOTS = 10;

export interface PlacementSlot {
  /** 0 nearest the viewer: where a pack's default stands. */
  id: number;
  direction: number;
  maxLength: number;
  anchors: Record<PreviewZoom, [number, number]>;
}

export interface Placement {
  version: 2;
  scene: string;
  kind: SceneKind;
  openttd: string;
  opengfx: string;
  sizes: Record<PreviewZoom, [number, number]>;
  slots: PlacementSlot[];
}

/** Screen pixels per normal-zoom pixel at a preview zoom. */
export const ZOOM_SCALE: Record<PreviewZoom, number> = { "1x": 1, "4x": 4 };

/**
 * The scene kind a vehicle is drawn in: a train's yard by its rail type (an
 * electric one under the wires, anything else on plain track), a tram's tram
 * yard, a bus's or truck's road yard, a ship's harbour, an aircraft's airport.
 */
export function kindOf(feature: OpenttdFeature, railType: string, tram: boolean): SceneKind {
  switch (feature) {
    case "train": return railType === "ELRL" ? "electric" : "rail";
    case "road": return tram ? "tram" : "road";
    case "ship": return "harbour";
    case "aircraft": return "airport";
  }
}

/** The scene that shows `count` vehicles of a kind: the yard of exactly that many tracks (1..10). */
export function sceneName(kind: SceneKind, count: number): string {
  if (kind === "harbour" || kind === "airport") return kind;
  return `${kind}-${Math.min(SCENE_SLOTS, Math.max(1, count))}`;
}

/** Screen pixels of a tile-unit offset at a zoom (projection.ts toScreen). */
function screen(x: number, y: number, k: number): [number, number] {
  return [k * 2 * (y - x), k * (x + y)];
}

/** One part's sprite: where its image's top-left pixel goes, and its order (lower first). */
export interface PartPlacement {
  part: number;
  x: number;
  y: number;
  depth: number;
}

/**
 * Where each part of a vehicle goes at a slot: `lengths` are its parts' eighths,
 * the head first; `offsets` each part's image offset from its OpenTTD anchor at
 * this zoom (the GRF image's xOffs, yOffs) in the slot's direction. Parts beyond
 * the slot's straight track (maxLength units) are left out. Sorted to draw the
 * farthest part first.
 */
export function placeParts(
  feature: OpenttdFeature, slot: PlacementSlot, zoom: PreviewZoom, lengths: readonly number[],
  offsets: ReadonlyArray<readonly [number, number]>,
): PartPlacement[] {
  const k = ZOOM_SCALE[zoom];
  const dir = slot.direction;
  const [ax, ay] = slot.anchors[zoom];
  const [mx, my] = screen(...spriteAnchor(feature, dir, 8), k);
  // the marker's position (an 8/8 part), and the front of a vehicle ending where it did
  const pos8: [number, number] = [ax - mx, ay - my];
  const single = feature === "ship" || feature === "aircraft";
  const [hx, hy] = HEADINGS[dir]!;
  const out: PartPlacement[] = [];
  let behind = single ? 0 : Math.ceil(lengths[0]! / 2) - 4; // units the head's position lies behind the marker's
  let used = 0;
  for (const [p, len] of lengths.entries()) {
    if (p > 0) behind += Math.floor(lengths[p - 1]! / 2) + Math.ceil(len / 2);
    used += len;
    if (!single && used > slot.maxLength) break;
    const [px, py] = screen(-behind * hx, -behind * hy, k);
    const [sx, sy] = screen(...spriteAnchor(feature, dir, len), k);
    const [ox, oy] = offsets[p]!;
    out.push({ part: p, x: pos8[0] + px + sx + ox, y: pos8[1] + py + sy + oy, depth: -behind * (hx + hy) });
  }
  return out.sort((a, b) => a.depth - b.depth || b.part - a.part);
}

/**
 * The screen point of a vehicle's front at a slot, at ground level: where its
 * label points. A train's or road vehicle's front is 4 units ahead of the 8/8
 * marker's position; a ship or aircraft has none, and its position is used.
 */
export function frontPoint(feature: OpenttdFeature, slot: PlacementSlot, zoom: PreviewZoom): [number, number] {
  const k = ZOOM_SCALE[zoom];
  const [ax, ay] = slot.anchors[zoom];
  const [mx, my] = screen(...spriteAnchor(feature, slot.direction, 8), k);
  if (feature === "ship" || feature === "aircraft") return [ax - mx, ay - my];
  const [hx, hy] = HEADINGS[slot.direction]!;
  const [fx, fy] = screen(4 * hx, 4 * hy, k);
  return [ax - mx + fx, ay - my + fy];
}

/** A rectangle: left, top, width, height. */
export type Rect = [number, number, number, number];

/**
 * Where a label of `width` x `height` goes for a vehicle whose front is at `front`:
 * a train's or road vehicle's just ahead of its nose, over the empty track there,
 * its right end at the nose; a ship's or aircraft's above it, centred. Kept inside
 * the scene's image (`size`).
 */
export function labelRect(feature: OpenttdFeature, front: readonly [number, number], width: number, height: number, zoom: PreviewZoom, size: readonly [number, number]): Rect {
  const k = ZOOM_SCALE[zoom];
  const single = feature === "ship" || feature === "aircraft";
  let x = single ? front[0] - width / 2 : front[0] - 6 * k - width;
  let y = single ? front[1] - 40 * k - height : front[1] - height / 2;
  x = Math.max(0, Math.min(size[0] - width, x));
  y = Math.max(0, Math.min(size[1] - height, y));
  return [Math.round(x), Math.round(y), width, height];
}

/**
 * The part of the scene the view shows: the drawn sprites and labels with a
 * margin (normal-zoom pixels; a tile's by default), within the scene's image - so a yard shows its tracks no further back
 * than the vehicles reach.
 */
export function viewRect(rects: readonly Rect[], zoom: PreviewZoom, size: readonly [number, number], margin = 32): Rect {
  if (!rects.length) return [0, 0, size[0], size[1]];
  const m = margin * ZOOM_SCALE[zoom];
  const x0 = Math.max(0, Math.min(...rects.map((r) => r[0])) - m);
  const y0 = Math.max(0, Math.min(...rects.map((r) => r[1])) - m);
  const x1 = Math.min(size[0], Math.max(...rects.map((r) => r[0] + r[2])) + m);
  const y1 = Math.min(size[1], Math.max(...rects.map((r) => r[1] + r[3])) + m);
  return [Math.floor(x0), Math.floor(y0), Math.ceil(x1 - x0), Math.ceil(y1 - y0)];
}

/** How the view shows the scene: which zoom's images, the part of them, and the CSS scale it is drawn at. */
export interface ViewChoice {
  zoom: PreviewZoom;
  /** In the zoom's pixels. */
  rect: Rect;
  /** CSS pixels per image pixel. */
  scale: number;
  /** "full": the whole pack; "front": cut to the vehicles' fronts and labels, the rest of their lengths left out. */
  fit: "full" | "front";
}

/** The margin round the fronts a view cut to them keeps, normal-zoom pixels. */
export const FRONT_MARGIN = 4;

/** The least scale the 4x images are shown at whole. */
export const MIN_4X_SCALE = 0.7;
/**
 * The least scale they are shown at cut to the fronts: at half size a vehicle is
 * still twice as large as at normal zoom, which a few vehicles on a small screen
 * are better shown at than whole and small.
 */
export const MIN_FRONT_SCALE = 0.5;
/**
 * The least scale the 4x images are shown at, whole and smoothly shrunk, when
 * cutting to the fronts would not fit either: a quarter, normal zoom's own size -
 * smaller, the normal-zoom images are shown instead.
 */
export const MIN_SHRUNK_SCALE = 0.25;

const scaleToFit = (r: Rect, avail: readonly [number, number]): number => Math.min(avail[0] / r[2], avail[1] / r[3]);

/**
 * The view for `avail` CSS pixels (docs/site/openttd-export.md, "The OpenTTD view"):
 * the most detailed one that fits, in this order -
 *
 *  1. the whole pack at 4x, shrunk to at most MIN_4X_SCALE;
 *  2. at 4x cut to the vehicles' fronts and labels (`front4`) - a long train's
 *     rear left out - widened to fill the space, at MIN_FRONT_SCALE or more (a
 *     few vehicles on a small screen: a large pack's fronts do not fit);
 *  3. the whole pack at 4x, shrunk to at most MIN_SHRUNK_SCALE (still at least as
 *     large as normal zoom, and smoother than it scaled up);
 *  4. the whole pack at normal zoom, shrunk to fit (down to 0.5; below, the view
 *     scrolls): a large pack on a small screen.
 *
 * `full4` and `front4` are the pack's and the fronts' rectangles at 4x (viewRect),
 * `size4` the scene's 4x image; never above the image's own pixels at 4x.
 */
export function chooseView(full4: Rect, front4: Rect, size4: readonly [number, number], avail: readonly [number, number]): ViewChoice {
  const s4 = scaleToFit(full4, avail);
  if (s4 >= MIN_4X_SCALE) return { zoom: "4x", rect: full4, scale: Math.min(1, s4), fit: "full" };
  const f4 = scaleToFit(front4, avail);
  if (f4 >= MIN_FRONT_SCALE) {
    const scale = Math.min(1, f4);
    // the fronts, widened towards the rest of the pack to fill the space
    const w = Math.min(full4[2], Math.floor(avail[0] / scale));
    const h = Math.min(full4[3], Math.floor(avail[1] / scale));
    const cx = front4[0] + front4[2] / 2;
    const cy = front4[1] + front4[3] / 2;
    const x = Math.round(Math.min(Math.max(cx - w / 2, full4[0]), full4[0] + full4[2] - w));
    const y = Math.round(Math.min(Math.max(cy - h / 2, full4[1]), full4[1] + full4[3] - h));
    return { zoom: "4x", rect: [Math.max(0, x), Math.max(0, y), Math.min(w, size4[0]), Math.min(h, size4[1])], scale, fit: "front" };
  }
  if (s4 >= MIN_SHRUNK_SCALE) return { zoom: "4x", rect: full4, scale: s4, fit: "full" };
  const full1: Rect = [Math.floor(full4[0] / 4), Math.floor(full4[1] / 4), Math.ceil(full4[2] / 4), Math.ceil(full4[3] / 4)];
  const s1 = scaleToFit(full1, avail);
  return { zoom: "1x", rect: full1, scale: Math.max(0.5, Math.min(1, s1)), fit: "full" };
}

/** How large a view shows the vehicles against normal zoom at its own size (a 4x view at 0.5: 2). */
export function magnification(c: Pick<ViewChoice, "zoom" | "scale">): number {
  return c.scale * ZOOM_SCALE[c.zoom];
}

/**
 * Whether to tag the vehicles with numbers and name them in a legend rather than
 * label them: where the labels overlap; or, unless the labelled view is already a
 * good 4x one (MIN_4X_SCALE or more), where the tags let the vehicles be shown
 * clearly larger (a sixth or more) in the space the legend leaves.
 */
export function preferTags(labelled: Pick<ViewChoice, "zoom" | "scale">, tagged: Pick<ViewChoice, "zoom" | "scale">, overlap: boolean): boolean {
  if (overlap) return true;
  if (labelled.zoom === "4x" && labelled.scale >= MIN_4X_SCALE) return false;
  return magnification(tagged) >= magnification(labelled) * 1.15;
}

/** Whether any two labels overlap: then the view tags the vehicles with numbers and names them in a legend. */
export function labelsOverlap(rects: readonly Rect[]): boolean {
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const a = rects[i]!;
      const b = rects[j]!;
      if (a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3]) return true;
    }
  }
  return false;
}
