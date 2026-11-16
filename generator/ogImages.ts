// The link-preview cards of the models that have no rendered one (docs/site/seo-pages.md,
// "Link previews"): a building's, a ship's or an aircraft's three-quarter thumbnail set
// on the site's dark background at 1200 x 630, the large card's 1.91:1. A road or rail
// vehicle, whose thumbnail is a side view, has a three-quarter card rendered by the
// model build instead (cards.ts). Written by the site build into dist/og/<id>.png;
// nothing is committed. Node-only (sharp), run by the `site-pages` Vite plugin.

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import type { CatalogRecord } from "./catalog.ts";
import { OG_SIZE } from "./sitePages.ts";

/** The card's background: the site's own (index.html, theme-color). */
const BACKGROUND = { r: 0x10, g: 0x1e, b: 0x29, alpha: 1 };

/** The thumbnail's box on the card: a margin all round. */
const MARGIN = 48;

/** The site-relative path of a model's card. */
export function ogPath(id: string): string {
  return `og/${id}.png`;
}

/**
 * Compose every confirmed model's card from its thumbnail in dist/. Returns the ids
 * that got one; a model whose thumbnail is missing gets none (its page keeps the
 * thumbnail or the site's image).
 */
export async function writeOgImages(dist: string, records: readonly CatalogRecord[]): Promise<Set<string>> {
  mkdirSync(join(dist, "og"), { recursive: true });
  const done = new Set<string>();
  const box = { width: OG_SIZE.width - 2 * MARGIN, height: OG_SIZE.height - 2 * MARGIN };
  for (const r of records) {
    if (r.draft) continue;
    const thumb = join(dist, r.thumbUrl);
    if (!existsSync(thumb)) continue;
    // scale up a small square thumbnail too: the card should show the model, not the margin
    const fitted = await sharp(thumb).resize({ ...box, fit: "inside", kernel: "lanczos3" }).png().toBuffer({ resolveWithObject: true });
    const left = Math.round((OG_SIZE.width - fitted.info.width) / 2);
    const top = Math.round((OG_SIZE.height - fitted.info.height) / 2);
    await sharp({ create: { ...OG_SIZE, channels: 4, background: BACKGROUND } })
      .composite([{ input: fitted.data, left, top }])
      .png({ compressionLevel: 9 })
      .toFile(join(dist, ogPath(r.id)));
    done.add(r.id);
  }
  return done;
}
