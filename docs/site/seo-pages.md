# Prerendered pages (search engines and link previews)

**Covers** - the site's page URLs (`/`, `/model/<id>/`, `/category/...`, `/country/<slug>/`, `/maker/<slug>/`, `/openttd/`), the static page the build writes for each (head, content, JSON-LD, link-preview card), the model's real-world facts (year, maker, country, blurb) on the page and in the app, `sitemap.xml`, `robots.txt`, `404.html`, the in-app links and the document head the app keeps in step.
**Code** - `generator/sitePages.ts`, `generator/ogImages.ts`, `generator/renderCard.ts`, `generator/cards.ts`, `generator/factTable.ts`, `src/pageMeta.ts`, `src/Link.tsx`, `src/catalogQuery.ts` (`parseView`, `viewUrl`, `chipSlug`), `src/App.tsx`, `src/ModelDetail.tsx` (the About block), `vite.config.ts` (`site-pages`), `wrangler.jsonc`, `test/sitePages.test.ts`, `test/catalogQuery.test.ts`, `test/siteMeta.test.ts`, `test/siteFacts.test.ts`, `test/factTable.test.ts`
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
| `/country/<slug>/` | every model from one country (`country`, factTable.ts), when it has two or more |
| `/maker/<slug>/` | every model of one maker (`maker`, factTable.ts), when it has two or more |
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

That full URL is what the address bar shows after a click, never what a link names.
Every in-site link's `href` is the page alone (`linkUrl`, `src/catalogQuery.ts`): a
model card, row or step link is `/model/<id>/`, a chip is its category, country or
maker page, and only a variant thumbnail adds its `p.<name>` parameters. Otherwise
Googlebot, which runs the app, followed thousands of `/model/<id>/?cat=...&country=...`
links and indexed them in place of the canonical pages. A plain click still opens the
whole view (`viewUrl`); a middle click opens the page without the list's filters. The
Catalog/Workshop/Chains switch and the Chains tab's nodes are the links that keep their
query (`?section=workshop`, `?section=chains&chain=<node>`), since neither tab has a page
of its own ([chains.md](chains.md)).

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
| `og/<id>.png` | the link-preview card of each confirmed model without a rendered one (below) |
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

Every confirmed model has a card at 1200 x 630 - the large card's 1.91:1 - on the
site's background (#101e29), which a search result, a shared link and the
structured data show:

- **A road or rail vehicle** gets a rendered three-quarter view: its thumbnail is the
  side view, right for drawing a train to scale and chaining its cars, but a search
  result shows a model better in three dimensions, as an aircraft's or a building's
  thumbnail already does. `renderGlbCard` (`generator/renderCard.ts`) draws the
  default build with the thumbnail's software rasterizer from ahead of the nose (+x),
  raised and on the +z side (a bus's door side), lower and more from the front than
  the thumbnail's corner view, and fits the box to 90% of the width or 82% of the
  height, centred. `pnpm build:models` renders the cards on a whole export
  (`generateCards`, `generator/cards.ts`), keeps them as JPEG (quality 80, about 30 KB)
  in `build-cache/cards/` under the design's key and `CARD_VERSION` - bump it when the
  card's look changes - and copies them to `export/cards/`, which the site serves at
  `/cards/<id>.jpg`. `test/buildCache.test.ts` holds the committed cards to the
  confirmed road and rail vehicles and their current keys.
- **Any other model** gets its three-quarter thumbnail composed onto a card by the
  site build (`writeOgImages`, `generator/ogImages.ts`, sharp): scaled to fit inside
  a 48 px margin and centred, written into `dist/og/<id>.png` only.

The model page names its card as `og:image` and `twitter:image` with its size and
type, puts it first in the 3DModel's `image` list (then the thumbnail), and shows a
rendered card as its prerendered picture. A model without either falls back to the
thumbnail rule below.

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

The real-world facts live in one table, `generator/factTable.ts`: one entry per
model, keyed by its id, every field optional. It is kept apart from the designs, so
stating a fact never changes a model's JS bytes or its build-cache key, and none is
part of the game's meta. The catalog record carries them:

| Table field | Record field | What |
|---|---|---|
| `country` | `country` (its English name, `COUNTRY_NAMES`) | the railway or operator a rail vehicle is drawn for, the maker of a road vehicle or an aircraft ([catalog-site.md](catalog-site.md), "Country") |
| `maker` | `maker` | who built the type; none for a type several works built in turn, a generic model, or anything uncertain |
| `year`, `approx`, `yearVariants` | `year`, `yearApprox`, `yearVariants` | the year the type entered service, whether it is an estimate, and each variant's that differs; the OpenTTD export's introduction year too ([openttd-export.md](openttd-export.md)) |
| `blurb` | `blurb` | one to three English sentences about the real thing: its history and what it is known for, researched against Wikipedia (the model's own links first) and stating only what the source confirms. Site-only text, so not translated ([../models/text.md](../models/text.md) covers the game's) |

`modelFacts` lists, in order, the facts a record states: In service from (the year,
"c. 1950" for an estimate), Maker and Country (with their page's path), Top speed,
Power and Weight (from the game properties, when above zero), and OpenTTD (the
OpenTTD page) for a confirmed vehicle OpenTTD can hold. `test/factTable.test.ts`
holds the table to existing designs and known country codes, every rail vehicle and
tram but the generic wagons to a country, every vehicle in openttdTable.ts to a year,
and every confirmed vehicle to a blurb; `test/siteFacts.test.ts` checks the text built
from them.

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
  and a link back to every model. The footer links the OpenTTD page on every page
  ("Vehicles for OpenTTD").

## Hosting

`wrangler.jsonc` uses `not_found_handling: "404-page"`. Cloudflare's default
`html_handling` (auto trailing slash) serves `model/<id>/index.html` at `/model/<id>/`
and redirects `/model/<id>` there. An unknown path gets `404.html` with a 404 status.
That page is the app, so an unknown `/model/<id>/` still shows "No model ..." with a
link back. Under `pnpm dev`, Vite's SPA fallback serves `index.html` for every path. The
app works there, but the prerendered content appears only after `pnpm build` and
`pnpm preview`. Every URL the app fetches or shows is absolute (`/catalog.json`,
`/js/...`, `/thumbs/...`), so it works from any page depth.
