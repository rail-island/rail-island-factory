# Prerendered pages (search engines and link previews)

**Covers** - the site's page URLs (`/`, `/model/<id>/`, `/category/...`, `/country/<slug>/`, `/maker/<slug>/`, `/openttd/`), the static page the build writes for each (head, content, JSON-LD, link-preview card), the model's real-world facts (year, maker, country, blurb) on the page and in the app, `sitemap.xml`, `robots.txt`, `404.html`, the in-app links and the document head the app keeps in step.
**Code** - `generator/sitePages.ts`, `generator/ogImages.ts`, `generator/makerTable.ts`, `generator/blurbTable.ts`, `generator/yearTable.ts`, `src/pageMeta.ts`, `src/Link.tsx`, `src/catalogQuery.ts` (`parseView`, `viewUrl`, `chipSlug`), `src/App.tsx`, `src/ModelDetail.tsx` (the About block), `vite.config.ts` (`site-pages`), `wrangler.jsonc`, `test/sitePages.test.ts`, `test/catalogQuery.test.ts`, `test/siteMeta.test.ts`, `test/siteFacts.test.ts`
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
| `/country/<slug>/` | every model from one country (`country`, countryTable.ts), when it has two or more |
| `/maker/<slug>/` | every model of one maker (`maker`, makerTable.ts), when it has two or more |
| `/openttd/` | every vehicle OpenTTD can hold, with an introduction for OpenTTD players |

The l2 and l3 segments are the chip values' slugs (`chipSlug`): camelCase split, lower
case, anything but letters and digits a hyphen. For example `busStop` is `bus-stop`,
`Panel houses` is `panel-houses` and `skyscraper_c` is `skyscraper-c`. The slug is
idempotent, and the view state holds slugs. A chip matches a value by the value's slug
(`chipMatches`), so the raw values of an old `?sub=` link still work. Two values of one
level with the same slug fail the build.

A country or maker slug is `chipSlug` of its name ("United Kingdom" is
`united-kingdom`, "Sharp, Stewart" is `sharp-stewart`). The path names the page in
this order: a model, else a chip pick, else a maker, else a country, else the
OpenTTD filter; a filter that is not the page stays in the query (`?country=`,
`?maker=`, `?openttd=1`), so picking a chip on a country page keeps the country.

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
| `country/<slug>/index.html`, `maker/<slug>/index.html` | one per country and maker with two confirmed models or more (`MIN_LIST_PAGE`): the introduction, the makers (or countries) that have a page, every model by group |
| `openttd/index.html` | the OpenTTD page: what the site offers a player and how to install a GRF (`OPENTTD_INTRO`), the countries, every vehicle OpenTTD can hold by group |
| `og/<id>.png` | each confirmed model's link-preview card (below) |
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
URL segment, and on a slug collision (chips, countries or makers).

### Link previews

Before the pages, `writeOgImages` (`generator/ogImages.ts`, sharp) composes a card per
confirmed model: its thumbnail, scaled to fit inside a 48 px margin, centred on the
site's background (#101e29) at 1200 x 630 - the large card's 1.91:1, so a long side
view is not cropped. The model page names it as `og:image` and `twitter:image` with
its size; a model without a thumbnail file falls back to the thumbnail rule below.
The cards are written into `dist/og/` only, never committed.

### Each page

- **Head.** Each page gets its own `<title>`, `description`, canonical link, `og:url`,
  `og:title`, `og:description`, `twitter:title` and `twitter:description`. A model page
  uses its card (above); without one, its thumbnail when it is at least 200 px on both
  sides (`MIN_PREVIEW_PX`); otherwise it keeps `social-preview.png`.
- **Structured data.** A page carries JSON-LD in `<script type="application/ld+json">`,
  with `<` escaped:
  - every page: a `BreadcrumbList`
  - a model page: a schema.org `3DModel` with name, description, URL, image,
    `isPartOf` the site, `isAccessibleForFree`, `keywords` (the kind, maker, country,
    OpenTTD, licence), the author (the factory's own models as the Organization Rail
    Island, a contributor as a Person), the licence as its URL (`LICENSE_URLS`),
    `countryOfOrigin`, and `about`: the real type, with the blurb as its description,
    its Wikipedia links as `sameAs`, its year as `temporalCoverage` and its maker
  - a category, country, maker or OpenTTD page: a `CollectionPage`
  - the home page: a `WebSite`
- **Content.** The content goes inside `#root`, after the loading line, which
  `src/boot.ts` still needs. Each page has a breadcrumb, an `<h1>` and the description.
  - A model page adds its thumbnail, its blurb, its summary (`modelSummary`), a link to
    the OpenTTD page for a vehicle OpenTTD can hold, a fact list, its parameters with
    every value's title, its web links, and links to the other models of its maker
    (when the maker has a page) and of its deepest category. The fact list holds the
    real-world facts (`modelFacts`, below; a maker or country linked when it has a
    page), then the id, the category links, the size, the triangle, vertex and material
    counts, the author, the licence (linked) and the source.
  - The home page adds the OpenTTD page and the country and maker pages.
  - A category page adds its subcategories and its models.

  The classes are `factory-static*` in `src/factory.css`.

### The text

`src/pageMeta.ts` holds the titles, descriptions, headings, summaries and facts. They
are built from the catalog record and the chip tree (`categoryTree`, `categoryOf`);
no design carries SEO text. `kindNoun` says what a model is in plain words
("electric locomotive", "diesel multiple unit", "jet aircraft", "tower"), and
`namedKind` puts it after the title unless the title already ends in it. Some
examples:

- model title: "CD 163 / 363 electric locomotive - free 3D model | Rail Island
  Factory"; the site name is dropped when the whole would pass 70 characters
- model description, at most 160 characters (a shorter offer when the full one does
  not fit): "Free CC0 3D model of the CD 163 / 363, an electric locomotive from
  Czechia by Skoda (1984). View it in 3D and download it as GLB or as an OpenTTD GRF."
- model summary, on the page: "The CD 163 / 363 is an electric locomotive from
  Czechia built by Skoda, in service from 1984. This procedural 3D model measures
  16.8 x 3.1 x 5.9 m and has 15,436 triangles, in 13 liveries. It is free under CC0.
  View it in 3D and download it as GLB or as an OpenTTD GRF."
- category title: the trail reversed, for example "Electric - Locomotive - Trains: free
  3D models | Rail Island Factory"; its description the model count and the first
  five titles
- country and maker titles: "Czechia: 85 free 3D models of trains, trams and road
  vehicles | Rail Island Factory" (the three groups with most models)

### Facts

The real-world facts come from tables kept apart from the designs, like
countryTable.ts, so stating one never changes a model's JS bytes or its cache key,
and none is part of the game's meta. The catalog record carries them:

| Field | Table | What |
|---|---|---|
| `year`, `yearApprox`, `yearVariants` | `generator/yearTable.ts` | the year the type entered service, whether it is an estimate, and each variant's that differs; the OpenTTD export's introduction year too ([openttd-export.md](openttd-export.md)) |
| `maker` | `generator/makerTable.ts` | who built the type; none for a type several works built in turn, a generic model, or anything uncertain |
| `country` | `generator/countryTable.ts` | [catalog-site.md](catalog-site.md), "Country" |
| `blurb` | `generator/blurbTable.ts` | one to three English sentences about the real thing: its history and what it is known for. Optional; site-only text, so not translated ([../models/text.md](../models/text.md) covers the game's) |

`modelFacts` lists, in order, the facts a record states: In service from (the year,
"c. 1950" for an estimate), Maker and Country (with their page's path), Top speed,
Power and Weight (from the game properties, when above zero), and OpenTTD (the
OpenTTD page) for a confirmed vehicle OpenTTD can hold. `test/siteFacts.test.ts`
holds every table to existing designs, the maker table to one entry per model, and
every vehicle in openttdTable.ts to a year.

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
  `pageMeta.ts` whenever the open model, the chips or the list page change. A search
  or a sort keeps the page's own head.
- **Content.** The app replaces the prerendered markup, so it shows the same text
  itself: the model page's side panel opens with an About block (`ModelDetail.tsx`) -
  the blurb, the facts with the maker, country and OpenTTD links, and the summary - and
  a country, maker or OpenTTD page opens its list with the page's heading, its
  introduction (`listIntro`: the description, or the OpenTTD page's own paragraphs)
  and a link back to every model.

## Hosting

`wrangler.jsonc` uses `not_found_handling: "404-page"`. Cloudflare's default
`html_handling` (auto trailing slash) serves `model/<id>/index.html` at `/model/<id>/`
and redirects `/model/<id>` there. An unknown path gets `404.html` with a 404 status.
That page is the app, so an unknown `/model/<id>/` still shows "No model ..." with a
link back. Under `pnpm dev`, Vite's SPA fallback serves `index.html` for every path. The
app works there, but the prerendered content appears only after `pnpm build` and
`pnpm preview`. Every URL the app fetches or shows is absolute (`/catalog.json`,
`/js/...`, `/thumbs/...`), so it works from any page depth.
