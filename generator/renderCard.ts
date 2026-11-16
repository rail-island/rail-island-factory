// The model pages' link-preview cards for road and rail vehicles (docs/site/seo-pages.md,
// "Link previews"): a three-quarter view from above the front corner at the large
// card's 1200 x 630, on the site's background. The thumbnail of such a vehicle is its
// side view, right for drawing a train to scale and chaining its cars, but a search
// result or a shared link shows a model better in three dimensions, as the aircraft's
// and buildings' square three-quarter thumbnails already do.
//
// Rendered by the build (generate.ts) from the same in-memory GLB as the thumbnail,
// with the thumbnail's software rasterizer (renderGlbThumb.ts rasterize), and kept in
// build-cache/cards/ under its design's key and CARD_VERSION. Not in any design's key:
// a change here re-renders the cards only.

import { PNG } from "pngjs";
import { cross, dot, norm, sub, triBounds, xformPoint, type Mat4, type Vec3 } from "./glbTriangles.ts";
import { rasterize, readTriangles, type GlbSource } from "./renderGlbThumb.ts";

/** Bump when the card's framing, light or size changes: every card is rendered again. */
export const CARD_VERSION = 1;

/** The card's size: the large link-preview card's 1.91:1. */
export const CARD_WIDTH = 1200;
export const CARD_HEIGHT = 630;

/** The card's background: the site's own (index.html, theme-color). */
export const CARD_BACKGROUND: readonly [number, number, number] = [0x10, 0x1e, 0x29];

/**
 * The camera: ahead of the nose (+x is a vehicle's front), raised, on the +z side -
 * a bus's door side - lower and more from the front than the thumbnail's corner
 * view, so a long train reads as a train and not as a diagonal.
 */
const VIEW_DIR = norm([0.95, 0.42, 0.85]);
const KEY_DIR = norm([-30, 80, 40]);
const FILL_DIR = norm([40, 20, -30]);
const AMBIENT = 0.38;
const KEY = 0.72;
const FILL = 0.22;
const FOV_DEG = 30;
/** The fraction of the card's width and height the model may fill. */
const FIT_X = 0.9;
const FIT_Y = 0.82;

/** Render a vehicle's card: the three-quarter view, fitted to CARD_WIDTH x CARD_HEIGHT, on CARD_BACKGROUND (opaque). */
export function renderGlbCard(glb: GlbSource): PNG {
  const tris = readTriangles(glb);
  const { min: mn, max: mx } = triBounds(tris);
  const center: Vec3 = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
  const maxDim = Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) || 1;
  const aspect = CARD_WIDTH / CARD_HEIGHT;
  const corners: Vec3[] = [];
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) corners.push([a ? mx[0] : mn[0], b ? mx[1] : mn[1], c ? mx[2] : mn[2]]);
  const viewFor = (dist: number): { m: Mat4; eye: Vec3 } => {
    const eye: Vec3 = [center[0] + VIEW_DIR[0] * dist, center[1] + VIEW_DIR[1] * dist, center[2] + VIEW_DIR[2] * dist];
    const zAxis = norm(sub(eye, center));
    const xAxis = norm(cross([0, 1, 0], zAxis));
    const yAxis = cross(zAxis, xAxis);
    return {
      eye,
      m: [xAxis[0], yAxis[0], zAxis[0], 0, xAxis[1], yAxis[1], zAxis[1], 0, xAxis[2], yAxis[2], zAxis[2], 0, -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1],
    };
  };
  const f = 1 / Math.tan((FOV_DEG * Math.PI) / 180 / 2);
  // the projected box's extents in normalized card coordinates (x against the width)
  const extents = (dist: number) => {
    const { m } = viewFor(dist);
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (const c of corners) {
      const v = xformPoint(m, c);
      const w = Math.max(1e-6, -v[2]);
      const x = (v[0] * f) / (w * aspect), y = (v[1] * f) / w;
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
    }
    return { x0, x1, y0, y1 };
  };
  // pull the camera back or in until the box, centred, fills FIT_X of the width or FIT_Y of the height
  let dist = maxDim * 3;
  for (let pass = 0; pass < 24; pass++) {
    const e = extents(dist);
    const worst = Math.max((e.x1 - e.x0) / 2 / FIT_X, (e.y1 - e.y0) / 2 / FIT_Y);
    if (worst <= 1e-9) break;
    dist *= worst;
    if (Math.abs(worst - 1) < 0.001) break;
  }
  const e = extents(dist);
  const dx = (e.x0 + e.x1) / 2, dy = (e.y0 + e.y1) / 2;
  const { m: view, eye } = viewFor(dist);
  const near = maxDim / 100, far = maxDim * 100;
  const W = CARD_WIDTH * 3, H = CARD_HEIGHT * 3; // rasterize supersamples by 3 (renderGlbThumb.ts SS)
  const png = rasterize(
    tris,
    CARD_WIDTH,
    CARD_HEIGHT,
    (p) => {
      const v = xformPoint(view, p);
      const w = -v[2];
      if (w <= near || w >= far) return null;
      return { x: (((v[0] * f) / (w * aspect) - dx) * 0.5 + 0.5) * W, y: (0.5 - ((v[1] * f) / w - dy) * 0.5) * H, w };
    },
    true,
    (world) => norm(sub(eye, world)),
    (n) => AMBIENT + KEY * Math.max(0, dot(n, KEY_DIR)) + FILL * Math.max(0, dot(n, FILL_DIR)),
  );
  // onto the background: the card is opaque
  for (let i = 0; i < png.data.length; i += 4) {
    const a = png.data[i + 3]! / 255;
    for (let k = 0; k < 3; k++) png.data[i + k] = Math.round(png.data[i + k]! * a + CARD_BACKGROUND[k]! * (1 - a));
    png.data[i + 3] = 255;
  }
  return png;
}
