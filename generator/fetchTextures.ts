// `pnpm exec tsx generator/fetchTextures.ts [name...]`: (re)fetch the texture library
// (docs/models/surfaces.md) from Poly Haven - albedo, OpenGL normal and roughness at
// 1k - and resize every map to 512 x 512 JPG into assets/textures/. The slugs are
// the ones assets/textures/SOURCES.md records; all are CC0. Node-only (sharp).
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
const MAPS: Record<string, string[]> = { albedo: ["diff", "col"], normal: ["nor_gl"], rough: ["rough"] };

async function fetchMap(slug: string, suffixes: string[]): Promise<Buffer> {
  for (const suffix of suffixes) {
    const res = await fetch(`${BASE}/${slug}/${slug}_${suffix}_1k.jpg`);
    if (res.ok) return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`no ${suffixes.join("/")} map for ${slug}`);
}

async function main(): Promise<void> {
  const wanted = process.argv.slice(2);
  fs.mkdirSync(TEXTURES_DIR, { recursive: true });
  for (const [name, slug] of Object.entries(TEXTURE_SLUGS)) {
    if (wanted.length && !wanted.includes(name)) continue;
    for (const [channel, suffixes] of Object.entries(MAPS)) {
      const out = path.join(TEXTURES_DIR, `${name}_${channel}.jpg`);
      console.log(`fetch ${name}/${channel} <- ${slug}`);
      await sharp(await fetchMap(slug, suffixes)).resize(TEXTURE_SIZE, TEXTURE_SIZE, { fit: "fill" }).jpeg({ quality: 88 }).toFile(out);
    }
  }
  console.log(`done -> ${path.relative(process.cwd(), TEXTURES_DIR)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
