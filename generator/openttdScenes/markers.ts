// The marker NewGRF of the OpenTTD scene prerender (docs/site/openttd-export.md,
// "The preview scenes"): vehicles whose sprites are a solid magenta mask with one
// pixel of a colour of their own at the sprite's anchor, so a screenshot of the
// scene with the markers stopped at their slots shows where OpenTTD anchors a
// vehicle's sprite at each slot (that pixel) and which of the vehicle's pixels the
// scene's foreground covers (the mask's missing pixels). Encoded with the site's
// own GRF encoder (src/openttd/grf.ts), so the markers are anchored exactly as the
// exported vehicles are.

import { encodeGrf, GRF_ZOOM, type GrfImage, type GrfPart, type GrfVehicle } from "../../src/openttd/grf.ts";
import { HEADINGS } from "../../src/openttd/projection.ts";
import type { OpenttdFeature, ResolvedVehicle } from "../../src/openttd/properties.ts";

/** The mask colour; a scene pixel of it is a marker pixel nothing covers. */
export const MASK_RGB: readonly [number, number, number] = [255, 0, 255];

/**
 * Where an anchor's copies stand, normal-zoom pixels from the anchor: the anchor
 * itself and four more, so a thin occluder (a catenary wire) hides at most some.
 */
export const ANCHOR_COPIES: ReadonlyArray<readonly [number, number]> = [[0, 0], [-3, 0], [3, 0], [0, -3], [0, 3]];

/**
 * The colour of copy `copy` of the anchor of part `part` of marker `slot` drawn
 * heading `direction` (OpenTTD's Direction, 0..7): unique among a scene's markers
 * (at most 32 slots and parts), telling the direction it stopped in.
 */
export function anchorRgb(slot: number, direction: number, part = 0, copy = 0): [number, number, number] {
  return [16 * direction + 7, 255 - part, 8 * slot + copy];
}

/** The slot, direction, part and copy of an anchor colour, or null for any other colour. */
export function readAnchor(r: number, g: number, b: number): { slot: number; direction: number; part: number; copy: number } | null {
  if (g < 255 - 31 || r < 7 || (r - 7) % 16 !== 0 || r > 7 + 16 * 7 || b % 8 >= ANCHOR_COPIES.length) return null;
  return { slot: Math.floor(b / 8), direction: (r - 7) / 16, part: 255 - g, copy: b % 8 };
}

/** The mask rectangle around the anchor, normal-zoom pixels: left, top, width, height. */
export const MASK = { left: -24, top: -36, width: 48, height: 52 } as const;

/**
 * One direction's three zoom images: the mask, with its anchor's copies
 * (anchorRgb), and a hole (transparent) wherever a neighbouring part's anchor
 * copies fall - parts stand 8 units apart along the heading - so no part's mask
 * hides another's anchor.
 */
export function maskImages(slot: number, part: number, direction: number): GrfImage[] {
  const [hx, hy] = HEADINGS[direction]!;
  const out: GrfImage[] = [];
  for (const [zoom, k] of [[GRF_ZOOM.normal, 1], [GRF_ZOOM.in2x, 2], [GRF_ZOOM.in4x, 4]] as const) {
    const width = MASK.width * k;
    const height = MASK.height * k;
    const rgba = new Uint8Array(width * height * 4);
    for (let i = 0; i < width * height; i++) rgba.set([...MASK_RGB, 255], i * 4);
    const ox = -MASK.left * k;
    const oy = -MASK.top * k;
    const put = (x: number, y: number, px: readonly number[]) => {
      if (x >= 0 && x < width && y >= 0 && y < height) rgba.set(px, (y * width + x) * 4);
    };
    for (let n = -6; n <= 6; n++) {
      if (n === 0) continue;
      // screen offset of a point 8n units along the heading (projection.ts toScreen)
      const x = ox + 2 * (8 * n * hy - 8 * n * hx) * k;
      const y = oy + (8 * n * hx + 8 * n * hy) * k;
      for (const [cx, cy] of ANCHOR_COPIES) put(x + cx * k, y + cy * k, [0, 0, 0, 0]);
    }
    ANCHOR_COPIES.forEach(([cx, cy], c) => put(ox + cx * k, oy + cy * k, [...anchorRgb(slot, direction, part, c), 255]));
    out.push({ zoom, width, height, xOffs: MASK.left * k, yOffs: MASK.top * k, rgba });
  }
  return out;
}

function vehicle(feature: OpenttdFeature, name: string, tram = false): ResolvedVehicle {
  return {
    feature, name, introYear: 1900, vehicleLife: 100, modelLife: 255, reliabilityDecay: 0,
    costFactor: 1, runningCostFactor: 1, capacity: feature === "aircraft" ? 10 : 1, cargo: "PASS",
    climates: ["temperate", "arctic", "tropical", "toyland"], railType: "RAIL", refitClasses: ["passengers"],
    weight: 10, power: feature === "train" ? 2000 : 200, speed: feature === "aircraft" ? 400 : 100,
    traction: feature === "train" ? "diesel" : null, tram, largeAircraft: false, helicopter: false,
  };
}

/** The markers of each kind, by slot: how many there are and how many parts each has. */
export const MARKER_KINDS = {
  // 32 full-length parts: 16 tiles, a yard track's length (the longest formation)
  train: { feature: "train", parts: 32, count: 10 },
  bus: { feature: "road", parts: 4, count: 10 },
  tram: { feature: "road", parts: 4, count: 10 },
  ship: { feature: "ship", parts: 1, count: 10 },
  aircraft: { feature: "aircraft", parts: 1, count: 10 },
} as const;

/** The heading every yard and ship lane is drawn in: south-west (OpenTTD's Direction 5). */
export const YARD_DIRECTION = 5;

/** A direction no marker stops in: one transparent pixel per zoom, to keep the GRF small. */
function blankImages(): GrfImage[] {
  return [GRF_ZOOM.normal, GRF_ZOOM.in2x, GRF_ZOOM.in4x].map((zoom) => ({ zoom, width: 1, height: 1, xOffs: 0, yOffs: 0, rgba: new Uint8Array(4) }));
}

export type MarkerKind = keyof typeof MARKER_KINDS;

/** The OpenTTD name of marker `slot` of a kind: what the scene AI looks for. */
export function markerName(kind: MarkerKind, slot: number): string {
  return `RI marker ${kind} ${slot}`;
}

/**
 * The marker GRF: per kind and slot one vehicle of full-length (8/8) parts, each
 * part's 8 directions the mask with its anchor pixel. A kind's slot
 * numbers run across the scenes (anchorRgb is per slot number); every part's
 * anchor pixel tells its part index.
 */
export function markerGrf(): Uint8Array {
  const vehicles: GrfVehicle[] = [];
  const nextId: Record<OpenttdFeature, number> = { train: 0x100, road: 0x100, ship: 0x100, aircraft: 0x100 };
  for (const [kind, spec] of Object.entries(MARKER_KINDS) as Array<[MarkerKind, (typeof MARKER_KINDS)[MarkerKind]]>) {
    for (let slot = 0; slot < spec.count; slot++) {
      const parts: GrfPart[] = [];
      for (let p = 0; p < spec.parts; p++) {
        // an aircraft stops at its terminal in any direction; everything else heads south-west
        const directions = Array.from({ length: 8 }, (_, dir) => (kind === "aircraft" || dir === YARD_DIRECTION ? maskImages(slot, p, dir) : blankImages()));
        parts.push({ id: nextId[spec.feature]++, length: 8, directions });
      }
      vehicles.push({ vehicle: vehicle(spec.feature, markerName(kind, slot), kind === "tram"), parts });
    }
  }
  return encodeGrf({ grfid: new Uint8Array([0x52, 0x49, 0xff, 0x01]), name: "Rail Island scene markers", description: "Prerender markers (docs/site/openttd-export.md)", vehicles });
}
