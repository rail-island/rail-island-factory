// index.html's description and link-preview tags (docs/site/catalog-site.md,
// "Link previews"): crawlers read them without running the app.

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync("index.html", "utf8");

function meta(attr: "name" | "property", key: string): string | undefined {
  const m = html.match(new RegExp(`<meta ${attr}="${key.replace(/[.:]/g, "\\$&")}" content="([^"]*)"`));
  return m?.[1];
}

describe("index.html link preview", () => {
  it("has a description, a title and a large-image card", () => {
    expect(meta("name", "description")?.length).toBeGreaterThan(50);
    expect(meta("property", "og:title")).toBe("Rail Island Factory");
    expect(meta("property", "og:url")).toBe("https://factory.railisland.com/");
    expect(meta("name", "twitter:card")).toBe("summary_large_image");
  });

  it("names the committed 1200x630 preview image by an absolute URL", () => {
    const url = meta("property", "og:image");
    expect(url).toBe("https://factory.railisland.com/social-preview.png");
    expect(meta("name", "twitter:image")).toBe(url);
    // vite.config.ts emits src/social-preview.png under this name
    const png = readFileSync("src/social-preview.png");
    expect(png.subarray(1, 4).toString("ascii")).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    expect(meta("property", "og:image:width")).toBe("1200");
    expect(meta("property", "og:image:height")).toBe("630");
  });
});
