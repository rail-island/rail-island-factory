// `pnpm exec tsx generator/fetchTextures.ts [--maps=height,...] [name...]`: (re)fetch
// the texture library (docs/models/surfaces.md) from Poly Haven - albedo, OpenGL
// normal, roughness and displacement (height) at 1k - and resize every map to
// 512 x 512 JPG into assets/textures/. `--maps` limits it to those channels. The
// height map is written grey, high-passed to its local relief (highPassHeight) and
// histogram-equalized (equalizeHeight), so every set's heights share one
// distribution whatever range Poly Haven scanned it at. The slugs are the ones
// assets/textures/SOURCES.md records; all are CC0. Node-only (sharp).
//
// The committed files are the library: run this only to refresh a set, then review
// the images and rebuild (the surfaces' honest average colours are pinned in
// surfaces.ts and checked against the photos by test/surfaces.test.ts).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { TEXTURE_SLUGS, TEXTURE_SIZE } from "./surfaces.ts";
import { TEXTURES_DIR } from "./surfacesExport.ts";

const BASE = "https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k";
/** Our channel -> the Poly Haven map suffixes to try, in order (the albedo is `diff` or `col`). */
const MAPS: Record<string, string[]> = { albedo: ["diff", "col"], normal: ["nor_gl"], rough: ["rough"], height: ["disp", "height"] };

async function fetchMap(slug: string, suffixes: string[]): Promise<Buffer> {
  for (const suffix of suffixes) {
    const res = await fetch(`${BASE}/${slug}/${slug}_${suffix}_1k.jpg`);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`no ${suffixes.join("/")} map for ${slug}`);
}

/** Radius in pixels of the box blur highPassHeight subtracts (three passes, about a Gaussian of sigma 12). */
export const HEIGHT_HIGH_PASS_RADIUS = 12;

/**
 * Keep a height map's LOCAL relief: subtract a wrap-around blur of itself. Poly
 * Haven's displacement is dominated by broad swells of the scanned ground, which
 * in a height blend push a border out in blobs a third of the photo wide; the
 * game's blend wants the stones and tufts that stand out of their surroundings.
 * The blur wraps, so the map stays tileable. Returns floats, any range.
 */
export function highPassHeight(grey: Uint8Array, size: number, radius = HEIGHT_HIGH_PASS_RADIUS): Float32Array {
  let a = Float32Array.from(grey);
  let b = new Float32Array(a.length);
  const span = 2 * radius + 1;
  for (let pass = 0; pass < 3; pass++) {
    for (const horizontal of [true, false]) {
      for (let line = 0; line < size; line++) {
        const at = (i: number) => (horizontal ? line * size + ((i + size) % size) : ((i + size) % size) * size + line);
        let sum = 0;
        for (let i = -radius; i <= radius; i++) sum += a[at(i)]!;
        for (let i = 0; i < size; i++) {
          b[at(i)] = sum / span;
          sum += a[at(i + radius + 1)]! - a[at(i - radius)]!;
        }
      }
      [a, b] = [b, a];
    }
  }
  return Float32Array.from(grey, (v, i) => v - a[i]!);
}

/**
 * Histogram-equalize a grey height map: each pixel becomes its rank, so every set's
 * heights share one distribution (uniform over 0..255, mean 127.5). Poly Haven
 * scans its displacement at very different ranges and means - clay averaged 41,
 * wood 163 - and in the game's height blend a lower set loses every border to its
 * neighbour; equalized, the borders follow each photo's own stones and favour no set.
 */
export function equalizeHeight(heights: ArrayLike<number>): Uint8Array {
  const order = Array.from({ length: heights.length }, (_, i) => i).sort((x, y) => heights[x]! - heights[y]! || x - y);
  const out = new Uint8Array(heights.length);
  let i = 0;
  while (i < order.length) {
    // equal heights share the middle of their rank range
    let j = i;
    while (j + 1 < order.length && heights[order[j + 1]!] === heights[order[i]!]) j++;
    const v = Math.round((((i + j) / 2 + 0.5) / order.length) * 255);
    for (let k = i; k <= j; k++) out[order[k]!] = v;
    i = j + 1;
  }
  return out;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const mapsArg = args.find((a) => a.startsWith("--maps="));
  const maps = mapsArg ? mapsArg.slice("--maps=".length).split(",") : Object.keys(MAPS);
  for (const m of maps) if (!(m in MAPS)) throw new Error(`unknown map ${m}; one of ${Object.keys(MAPS).join(", ")}`);
  const wanted = args.filter((a) => !a.startsWith("--"));
  fs.mkdirSync(TEXTURES_DIR, { recursive: true });
  for (const [name, slug] of Object.entries(TEXTURE_SLUGS)) {
    if (wanted.length && !wanted.includes(name)) continue;
    for (const [channel, suffixes] of Object.entries(MAPS)) {
      if (!maps.includes(channel)) continue;
      const out = path.join(TEXTURES_DIR, `${name}_${channel}.jpg`);
      console.log(`fetch ${name}/${channel} <- ${slug}`);
      const img = sharp(await fetchMap(slug, suffixes)).resize(TEXTURE_SIZE, TEXTURE_SIZE, { fit: "fill" });
      if (channel === "height") {
        const { data } = await img.grayscale().raw().toBuffer({ resolveWithObject: true });
        await sharp(equalizeHeight(highPassHeight(data, TEXTURE_SIZE)), { raw: { width: TEXTURE_SIZE, height: TEXTURE_SIZE, channels: 1 } }).jpeg({ quality: 88 }).toFile(out);
      } else {
        await img.jpeg({ quality: 88 }).toFile(out);
      }
    }
  }
  console.log(`done -> ${path.relative(process.cwd(), TEXTURES_DIR)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
