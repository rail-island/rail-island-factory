// The OpenTTD preview's geometry (docs/site/openttd-export.md, "The preview"):
// which prerendered scene and slots a vehicle is drawn at, and where each of its
// sprites goes in the scene's image. Pure numbers - no DOM, no three - so Vitest
// checks it; OpenttdPreview.tsx only draws what it is told.
//
// A scene's placement.json (generator/openttdScenes/prerender.ts) gives each slot's
// heading and, per zoom, the pixel where OpenTTD anchored the sprite of a
// full-length (8/8) marker part stopped there. From it the vehicle's front is
// found, and from the front each part's position, as OpenTTD lines up a train or
// road vehicle's parts (projection.ts): the head's position ceil(L / 2) units
// behind the front, each next part floor(L / 2) + ceil(L' / 2) units behind.

import { HEADINGS, spriteAnchor } from "./projection";
import type { OpenttdFeature } from "./properties";

export type SlotTrack = "rail" | "electric" | "road" | "tram" | "water" | "air";
export type SceneName = "railway" | "road" | "harbour" | "airport";
export type PreviewZoom = "1x" | "4x";

export interface PlacementSlot {
  id: string;
  direction: number;
  track: SlotTrack;
  maxLength: number;
  anchors: Record<PreviewZoom, [number, number]>;
}

export interface Placement {
  version: 1;
  scene: SceneName;
  openttd: string;
  opengfx: string;
  sizes: Record<PreviewZoom, [number, number]>;
  slots: PlacementSlot[];
}

/** Screen pixels per normal-zoom pixel at a preview zoom. */
export const ZOOM_SCALE: Record<PreviewZoom, number> = { "1x": 1, "4x": 4 };

/**
 * The track a vehicle runs on in the preview: a train's by its rail type (an
 * electric one under the wires, anything else on plain track), a tram's tram
 * track, a ship's water and an aircraft's airport.
 */
export function trackOf(feature: OpenttdFeature, railType: string, tram: boolean): SlotTrack {
  switch (feature) {
    case "train": return railType === "ELRL" ? "electric" : "rail";
    case "road": return tram ? "tram" : "road";
    case "ship": return "water";
    case "aircraft": return "air";
  }
}

/** The scene a track's slots are in. */
export function sceneOf(track: SlotTrack): SceneName {
  return track === "rail" || track === "electric" ? "railway" : track === "road" || track === "tram" ? "road" : track === "water" ? "harbour" : "airport";
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
