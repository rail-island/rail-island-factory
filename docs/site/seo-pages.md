# Prerendered pages (search engines and link previews)

**Covers** - the site's page URLs (`/`, `/model/<id>/`, `/category/...`), the static page the build writes for each (head, content, JSON-LD), `sitemap.xml`, `robots.txt`, `404.html`, the in-app links and the document head the app keeps in step.
**Code** - `generator/sitePages.ts`, `src/pageMeta.ts`, `src/Link.tsx`, `src/catalogQuery.ts` (`parseView`, `viewUrl`, `chipSlug`), `src/App.tsx`, `vite.config.ts` (`site-pages`), `wrangler.jsonc`, `test/sitePages.test.ts`, `test/catalogQuery.test.ts`, `test/siteMeta.test.ts`
**See also** - [workshop.md](workshop.md) (drafts: own page, `noindex`, not listed), [catalog-site.md](catalog-site.md), [../guide/deploy.md](../guide/deploy.md), [../models/export.md](../models/export.md), spec [../specs/2026-11-04-seo-prerendered-pages.md](../specs/2026-11-04-seo-prerendered-pages.md)

The site is a client-rendered Solid app. A crawler, or a link preview that does not run
scripts, would see only the loading line. So every page a search engine should know
is also a static HTML file with its own head and its facts and links as plain markup.
The app replaces that markup when it mounts.

## URLs

| Path | Page |
|---|---|
| `/` | the list of every model |
| `/model/<id>/` | one model's page; the id verbatim, permanent like the id |
| `/category/<group>/` | a first-row chip (`train`, `moto`, `building`, ... - `GROUPS` in `catalogQuery.ts`) |
| `/category/<group>/<l2>/` | a second-row chip, where the group's second row offers a choice |
| `/category/<group>/<l2>/<l3>/` | a third-row chip (a locomotive's or unit's traction) |

The l2 and l3 segments are the chip values' slugs (`chipSlug`): camelCase split, lower
case, anything but letters and digits a hyphen. For example `busStop` is `bus-stop`,
`Panel houses` is `panel-houses` and `skyscraper_c` is `skyscraper-c`. The slug is
idempotent, and the view state holds slugs. A chip matches a value by the value's slug
(`chipMatches`), so the raw values of an old `?sub=` link still work. Two values of one
level with the same slug fail the build.

The rest of the view stays in the query string: search, layout, sort, tab, node and
`p.<name>`. A model page also keeps the list's chips there (`?cat=&sub=&sub2=`), so the
previous and next steps and Back stay within the same list. The canonical URL drops
the query.

The old all-query form (`/?model=<id>`, `/?cat=...&sub=...`, the webapp Creator's form)
is still read. On load the app rewrites it to the path form with `replaceState`.

## The build step

`vite build` runs the `site-pages` plugin (`vite.config.ts`) after the bundle is
written. It calls `writeSitePages(dist)`, which reads `dist/index.html` (the app shell,
with its hashed asset names), `dist/catalog.json` and each thumbnail's PNG header. It
then writes:

| File | What |
|---|---|
| `index.html` | the home page: the groups with their counts, then every model by group |
| `category/.../index.html` | one per group, and one per l2 or l3 value where that chip row offers a choice (more than one value, as the site's chip rows do). Lists the subcategories and every model at or below it |
| `model/<id>/index.html` | one per record (previews included) |
| `404.html` | the shell with `noindex`; what Cloudflare answers for any other path |
| `sitemap.xml` | every page above, home first, no `lastmod` |
| `robots.txt` | allows everything and names the sitemap |

The home and category pages list the confirmed catalog only. A workshop draft (a
record with `draft: true`, [workshop.md](workshop.md)) still gets its model page, so
a link to it works, but with `noindex`, no thumbnail (none is rendered), a breadcrumb that stops at its group, no
siblings, and no entry in `sitemap.xml`.

`sitePages(shell, records, thumbSize)` is a pure function. Its output is sorted and has
no timestamps, so the same catalog gives the same bytes. The build fails when the shell
lacks a tag the step fills (the title, the description, the canonical link, the `og:*`
and `twitter:*` tags, `#root` with its loading line), on a model id that is not a plain
URL segment, and on a slug collision.

### Each page

- **Head.** Each page gets its own `<title>`, `description`, canonical link, `og:url`,
  `og:title`, `og:description`, `twitter:title` and `twitter:description`. A model page
  uses its thumbnail as `og:image` and `twitter:image` when the thumbnail is at least
  200 px on both sides (`MIN_PREVIEW_PX`); otherwise it keeps `social-preview.png`.
- **Structured data.** A page carries JSON-LD in `<script type="application/ld+json">`,
  with `<` escaped:
  - every page: a `BreadcrumbList`
  - a model page: a schema.org `3DModel` with name, description, URL, image, author,
    licence and `isPartOf` the site
  - a category page: a `CollectionPage`
  - the home page: a `WebSite`
- **Content.** The content goes inside `#root`, after the loading line, which
  `src/boot.ts` still needs. Each page has a breadcrumb, an `<h1>` and the description.
  - A model page adds its thumbnail, a fact list, a link to its source, its parameters
    with every value's title, and links to the other models of its deepest category.
    The fact list holds the id, the category links, the size, the triangle, vertex and
    material counts, the author and the licence.
  - A category page adds its subcategories and its models.

  The classes are `factory-static*` in `src/factory.css`.

### The text

`src/pageMeta.ts` holds the titles, descriptions, headings and breadcrumbs. They are
built from the catalog record and the chip tree (`categoryTree`, `categoryOf`), and no
design carries SEO text. Some examples:

- model description: "CD 163 / 363: a procedural 3D railway vehicle model for the game
  Rail Island, in Trains > Locomotive > Electric. 16.8 x 3.1 x 5.9 m, 15,436 triangles
  by Rail Island, CC0. Parametric: livery."
- model title: "<title> - <category trail> | Rail Island Factory"
- category title: the trail reversed, for example "Electric - Locomotive - Trains |
  Rail Island Factory"
- category description: the model count and the first five titles

The home page's title and description are `index.html`'s own. `test/siteMeta.test.ts`
keeps the two in step.

## In the app

- **Links.** Model cards, the table's title cell, the variant rows and tiles, the
  chips, the back arrow and the previous and next steps are `<a href>` elements
  (`src/Link.tsx`). A plain left click is handled with `pushState`, without a page
  load. A modified click (new tab, Ctrl or Cmd) is left to the browser. Opening or
  closing a model and picking a chip each push a history entry.
- **Head.** The document head follows the view. `App.tsx` writes the title,
  `description`, canonical link, `og:url`, `og:title` and `og:description` from
  `pageMeta.ts` whenever the open model or the chips change. A search or a sort keeps
  the page's own head.

## Hosting

`wrangler.jsonc` uses `not_found_handling: "404-page"`. Cloudflare's default
`html_handling` (auto trailing slash) serves `model/<id>/index.html` at `/model/<id>/`
and redirects `/model/<id>` there. An unknown path gets `404.html` with a 404 status.
That page is the app, so an unknown `/model/<id>/` still shows "No model ..." with a
link back. Under `pnpm dev`, Vite's SPA fallback serves `index.html` for every path. The
app works there, but the prerendered content appears only after `pnpm build` and
`pnpm preview`. Every URL the app fetches or shows is absolute (`/catalog.json`,
`/js/...`, `/thumbs/...`), so it works from any page depth.
