// Where a model lands in an OpenTTD sprite: the geometry of the export's sprite
// rendering, as pure numbers -- no three, no DOM -- so Vitest checks it and the
// WebGL renderer (spriteRenderer.ts) only draws what it is told.
//
// OpenTTD's world is measured in tile units (16 per tile edge) with x running to
// the bottom left of the screen, y to the bottom right and z up; a point lands
// on the screen, at normal zoom, at
//
//   sx = 2 * (y - x),   sy = x + y - z      (pixels)
//
// A vehicle's sprite is drawn with its offsets relative to the vehicle's
// position: for a train or road vehicle the middle of its length, the front
// ceil(length / 2) units ahead (OpenTTD's Train::CalcNextVehicleOffset). A full
// length (8/8) vehicle is 8 units long -- half a tile -- along an axis, and 8
// diagonal steps of (1, 1) on a diagonal.
//
// The model (metres, +X forward, +Y up, +Z to its right) is mapped into tile
// units at one scale, so it keeps its true proportions: its length fills its
// eighths exactly (METRES_PER_FULL_LENGTH, about a unit per metre), its width
// takes the same scale and its height twice it (a z unit is one pixel, half a
// ground unit's on screen). A ship or an aircraft has no length in OpenTTD; it
// is scaled whole to fit one tile.

import { METRES_PER_FULL_LENGTH, type OpenttdFeature } from "./properties";

/** OpenTTD's Direction order, the order of a vehicle's 8 sprites. */
export const DIRECTION_NAMES = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;

/** The step a vehicle heading in each direction takes per unit of its length, in tile units. */
export const HEADINGS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1],
];

/** The zoom the sprites are rendered at: OpenTTD's 4x zoom-in, 4 pixels per normal-zoom pixel. */
export const RENDER_ZOOM = 4;

/** A model's bounding box, metres, in its own frame. */
export interface ModelBox {
  min: [number, number, number];
  max: [number, number, number];
}

/** How metres become tile units along the model's length, width and height. */
export interface VehicleScale {
  along: number;
  across: number;
  up: number;
  /** Tile units the model is lowered by: a ship's draft below the waterline. */
  sink: number;
}

/**
 * The scale of a vehicle drawn `eighths` long in total (the sum of its parts):
 * a train or road vehicle's length fills its eighths exactly and its width and
 * height follow at the same scale; a ship or aircraft fits its longer plan side
 * into one tile. `draftFrac` is the fraction of a ship's height below the
 * waterline.
 */
export function vehicleScale(feature: OpenttdFeature, box: ModelBox, eighths: number, draftFrac = 0): VehicleScale {
  const length = Math.max(1e-6, box.max[0] - box.min[0]);
  const width = Math.max(1e-6, box.max[2] - box.min[2]);
  const height = box.max[1] - box.min[1];
  if (feature === "ship" || feature === "aircraft") {
    const k = 16 / Math.max(length, width);
    return { along: k, across: k, up: 2 * k, sink: feature === "ship" ? draftFrac * height * 2 * k : 0 };
  }
  const k = eighths / length;
  return { along: k, across: k, up: 2 * k, sink: 0 };
}

/** One sprite to render: where the model goes and the image's frame. */
export interface SpriteView {
  /** Model metres to tile units, a column-major 4x4 matrix (three's Matrix4.fromArray). */
  model: number[];
  /** Tile units to clip space, column-major 4x4: this sprite's orthographic projection. */
  projection: number[];
  /** Planes in tile units, normal and constant; a point is kept where normal . p + constant >= 0. */
  clip: Array<{ normal: [number, number, number]; constant: number }>;
  /** The image at RENDER_ZOOM: its size and the offset of its top-left pixel from the vehicle's position. */
  width: number;
  height: number;
  xOffs: number;
  yOffs: number;
}

/** Screen pixels of a tile point at RENDER_ZOOM. */
function toScreen(x: number, y: number, z: number): [number, number] {
  return [RENDER_ZOOM * 2 * (y - x), RENDER_ZOOM * (x + y - z)];
}

/**
 * Every sprite of a vehicle: `[part][direction]`. `lengths` are the parts'
 * eighths, the head first (one entry for a ship or aircraft). Each part is the
 * slice of the model along its length that the part covers, drawn about the
 * part's own position.
 */
export function spriteViews(feature: OpenttdFeature, box: ModelBox, lengths: readonly number[], draftFrac = 0): SpriteView[][] {
  const total = lengths.reduce((a, b) => a + b, 0);
  const k = vehicleScale(feature, box, total, draftFrac);
  const single = feature === "ship" || feature === "aircraft";
  const midX = (box.min[0] + box.max[0]) / 2;
  const out: SpriteView[][] = [];
  let front = 0; // units from the model's front to this part's front
  for (const len of lengths) {
    // The part's centre, units behind the model's front; the front lies ceil(len / 2) ahead of it.
    const centre = single ? 0 : front + Math.ceil(len / 2);
    // s: units ahead of the part's centre. A ship or aircraft is centred on its box.
    const sOf = (X: number) => (single ? (X - midX) * k.along : centre - (box.max[0] - X) * k.along);
    const sLo = single ? sOf(box.min[0]) : Math.max(sOf(box.min[0]), Math.ceil(len / 2) - len);
    const sHi = single ? sOf(box.max[0]) : Math.min(sOf(box.max[0]), Math.ceil(len / 2));
    const views: SpriteView[] = [];
    for (const [dx, dy] of HEADINGS) {
      const dn = Math.hypot(dx, dy);
      // A train or road vehicle follows OpenTTD's track metric: n units on a diagonal are
      // n steps of (1, 1), so its diagonal views are longer by sqrt 2, as OpenTTD's own are.
      // A ship or aircraft moves freely and keeps its length in every direction.
      const hx = single ? dx / dn : dx;
      const hy = single ? dy / dn : dy;
      const hh = hx * hx + hy * hy;
      const hn = Math.sqrt(hh);
      // The vehicle's right: heading x up, in a right-handed tile frame.
      const rx = hy / hn;
      const ry = -hx / hn;
      // model (X, Y, Z) -> tile: s * h + Z * across * right + Y * up * z-hat
      const sx0 = single ? -midX * k.along : centre - box.max[0] * k.along; // s at X = 0
      const model = [
        k.along * hx, k.along * hy, 0, 0, // column X
        0, 0, k.up, 0, // column Y
        k.across * rx, k.across * ry, 0, 0, // column Z
        sx0 * hx, sx0 * hy, -k.sink, 1, // translation
      ];
      // The image frame: the part slice's box corners on screen, padded a pixel
      // and widened to whole normal-zoom pixels so the 2x and 1x images are exact.
      let minPx = Infinity, maxPx = -Infinity, minPy = Infinity, maxPy = -Infinity;
      let minD = Infinity, maxD = -Infinity;
      for (const s of [sLo, sHi]) {
        for (const Z of [box.min[2], box.max[2]]) {
          for (const Y of [box.min[1], box.max[1]]) {
            const x = s * hx + Z * k.across * rx;
            const y = s * hy + Z * k.across * ry;
            const z = Y * k.up - k.sink;
            const [px, py] = toScreen(x, y, z);
            minPx = Math.min(minPx, px);
            maxPx = Math.max(maxPx, px);
            minPy = Math.min(minPy, py);
            maxPy = Math.max(maxPy, py);
            const d = x + y + 2 * z;
            minD = Math.min(minD, d);
            maxD = Math.max(maxD, d);
          }
        }
      }
      const left = Math.floor((minPx - 1) / RENDER_ZOOM) * RENDER_ZOOM;
      const top = Math.floor((minPy - 1) / RENDER_ZOOM) * RENDER_ZOOM;
      const width = Math.ceil((maxPx + 1) / RENDER_ZOOM) * RENDER_ZOOM - left;
      const height = Math.ceil((maxPy + 1) / RENDER_ZOOM) * RENDER_ZOOM - top;
      // Depth: towards the viewer is (1, 1, 2), the direction that lands on one screen point.
      const dMid = (minD + maxD) / 2;
      const dSpan = Math.max(1, maxD - minD) * 1.2;
      const Z = RENDER_ZOOM;
      // ndcX = 2 (px - left) / width - 1 with px = Z * 2 * (y - x); ndcY = 1 - 2 (py - top) / height with
      // py = Z * (x + y - z); ndcZ = -2 (d - dMid) / dSpan, nearer the viewer is smaller.
      const projection = [
        (-4 * Z) / width, (-2 * Z) / height, -2 / dSpan, 0, // column x
        (4 * Z) / width, (-2 * Z) / height, -2 / dSpan, 0, // column y
        0, (2 * Z) / height, -4 / dSpan, 0, // column z
        (-2 * left) / width - 1, 1 + (2 * top) / height, (2 * dMid) / dSpan, 1, // translation
      ];
      const clip = single
        ? []
        : [
            { normal: [hx, hy, 0] as [number, number, number], constant: -sLo * hh },
            { normal: [-hx, -hy, 0] as [number, number, number], constant: sHi * hh },
          ];
      views.push({ model, projection, clip, width, height, xOffs: left, yOffs: top });
    }
    out.push(views);
    front += len;
  }
  return out;
}

/** Apply a column-major 4x4 matrix to a point. */
export function applyMatrix(m: readonly number[], p: readonly [number, number, number]): [number, number, number] {
  const [x, y, z] = p;
  const w = m[3]! * x + m[7]! * y + m[11]! * z + m[15]!;
  return [
    (m[0]! * x + m[4]! * y + m[8]! * z + m[12]!) / w,
    (m[1]! * x + m[5]! * y + m[9]! * z + m[13]!) / w,
    (m[2]! * x + m[6]! * y + m[10]! * z + m[14]!) / w,
  ];
}

export { METRES_PER_FULL_LENGTH };
