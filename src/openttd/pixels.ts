// From a rendered frame to the GRF's images: the renderer draws each sprite
// supersampled at OpenTTD's 4x zoom with premultiplied colour; these pure
// functions box-filter it down to the 4x, 2x and normal zoom images, straight
// (not premultiplied) RGBA as the GRF stores it.

import { GRF_ZOOM, type GrfImage } from "./grf";
import { RENDER_ZOOM, type SpriteView } from "./projection";

/**
 * Box-filter premultiplied RGBA (`w` x `h`) by an integer `factor`, keeping it
 * premultiplied. `w` and `h` must be multiples of `factor`.
 */
export function downsamplePremultiplied(src: Uint8Array, w: number, h: number, factor: number): Uint8Array {
  if (w % factor || h % factor) throw new Error(`${w}x${h} does not divide by ${factor}`);
  const ow = w / factor;
  const oh = h / factor;
  const out = new Uint8Array(ow * oh * 4);
  const n = factor * factor;
  for (let y = 0; y < oh; y++) {
    for (let x = 0; x < ow; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let dy = 0; dy < factor; dy++) {
        let i = ((y * factor + dy) * w + x * factor) * 4;
        for (let dx = 0; dx < factor; dx++, i += 4) {
          r += src[i]!;
          g += src[i + 1]!;
          b += src[i + 2]!;
          a += src[i + 3]!;
        }
      }
      const o = (y * ow + x) * 4;
      out[o] = Math.round(r / n);
      out[o + 1] = Math.round(g / n);
      out[o + 2] = Math.round(b / n);
      out[o + 3] = Math.round(a / n);
    }
  }
  return out;
}

/** Straight RGBA from premultiplied; a fully transparent pixel becomes 0, 0, 0, 0. */
export function unpremultiply(src: Uint8Array): Uint8Array {
  const out = new Uint8Array(src.length);
  for (let i = 0; i < src.length; i += 4) {
    const a = src[i + 3]!;
    if (a === 0) continue;
    out[i] = Math.min(255, Math.round((src[i]! * 255) / a));
    out[i + 1] = Math.min(255, Math.round((src[i + 1]! * 255) / a));
    out[i + 2] = Math.min(255, Math.round((src[i + 2]! * 255) / a));
    out[i + 3] = a;
  }
  return out;
}

/** Rows in reverse order: WebGL reads pixels bottom row first. */
export function flipRows(src: Uint8Array, w: number, h: number): Uint8Array {
  const out = new Uint8Array(src.length);
  const row = w * 4;
  for (let y = 0; y < h; y++) out.set(src.subarray(y * row, (y + 1) * row), (h - 1 - y) * row);
  return out;
}

/**
 * The three zoom levels' images of one sprite from its premultiplied frame,
 * rendered at `supersample` times the 4x size of `view` (top row first).
 */
export function zoomImages(frame: Uint8Array, view: SpriteView, supersample: number): GrfImage[] {
  const w4 = view.width;
  const h4 = view.height;
  const at4 = downsamplePremultiplied(frame, w4 * supersample, h4 * supersample, supersample);
  const at2 = downsamplePremultiplied(at4, w4, h4, 2);
  const at1 = downsamplePremultiplied(at4, w4, h4, RENDER_ZOOM);
  return [
    { zoom: GRF_ZOOM.in4x, width: w4, height: h4, xOffs: view.xOffs, yOffs: view.yOffs, rgba: unpremultiply(at4) },
    { zoom: GRF_ZOOM.in2x, width: w4 / 2, height: h4 / 2, xOffs: view.xOffs / 2, yOffs: view.yOffs / 2, rgba: unpremultiply(at2) },
    { zoom: GRF_ZOOM.normal, width: w4 / RENDER_ZOOM, height: h4 / RENDER_ZOOM, xOffs: view.xOffs / RENDER_ZOOM, yOffs: view.yOffs / RENDER_ZOOM, rgba: unpremultiply(at1) },
  ];
}
