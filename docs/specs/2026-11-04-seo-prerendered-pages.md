# SEO-friendly prerendered model and category pages

Status: draft
Date: 2026-11-04
Area: catalog site (URL state, listing links, chips, page head), site build (`pnpm build` / Vite), Cloudflare assets config (`wrangler.jsonc`), docs (`docs/site/`, `docs/guide/deploy.md`)

## Context of the change

The catalog at factory.railisland.com is a client-rendered Solid SPA. `index.html` has
fixed head tags and a loading line in `#root`. `App.tsx` fetches `/catalog.json` and
draws everything in the browser. All of the view state is in the query string of the one
page (`src/catalogQuery.ts` `parseView`/`serializeView`): `?model=<id>`, `?cat=<group>&sub=<l2>&sub2=<l3>`,
`?q=`, `?sort=`, `?p.<name>=` and so on. `wrangler.jsonc` serves `dist/` as an assets-only
Worker with `not_found_handling: "single-page-application"`, so every unknown path
returns `index.html`.

For search engines this means:

- **Nothing to read without JavaScript.** The HTML holds only the head and the
  loading line. Google renders JavaScript late and not reliably. Other engines and link
  previews do not render it at all.
- **Nothing to follow.** Model cards are `<button>` elements, table rows are `<tr onClick>`,
  and the category chips are buttons. The only `<a href>` links go to external sites
  or to file downloads, so a crawler never finds a model or category URL.
- **Every URL says it is the home page.** The `<title>`, `description`, `og:*` tags and
  `<link rel="canonical" href="https://factory.railisland.com/">` are fixed. Nothing
  updates them per model. Even a discovered `?model=` URL is folded into the home page.
- **No `sitemap.xml` or `robots.txt`, and no real 404s.**
- **Categories are only filters.** No category has a page of its own, and nothing
  marks the hierarchy (no breadcrumbs, no structured data).

The build already knows everything a static page needs. `export/catalog.json` has
every record (id, title, category, group, traction, sizes, triangles, author, licence,
source, parameters) and `export/thumbs/` has every thumbnail. The chip hierarchy is a
pure function of a record (`groupOf`, `level2Of`, `level3Of`). The pages can therefore
be prerendered at build time with no server.

## User request

Is the current factory structure SEO friendly? Could Google index individual models in
the correct categories? (Answered: no. The site is a client-rendered SPA with query-string
state, button-only navigation, a fixed canonical, and no sitemap. Suggested: prerendered
per-model and per-category pages at clean paths, with their own head tags, breadcrumbs,
real links and a sitemap.)

Then: design feature: SEO-friendly prerendered model and category pages.

## Decisions

### Which public URL shape should model and category pages use?
| Option | What it means |
|---|---|
| Flat model URLs | `/model/<id>/` and `/category/<group>/[<l2>/[<l3>/]]`. A model's URL never changes when it is re-filed; the category shows only in the breadcrumb. |
| Nested under category | `/train/loco/electric/proc-vehicle-cd-163/`. Reads as a hierarchy, but re-filing a model moves its URL. |
| Flat, prefix-free slugs | `/model/boeing-747/`. Shorter, but adds a second id namespace to keep stable and collision-free. |

**Answer: Flat model URLs** - the model id is permanent (it is in saved maps) while category labels can change.

### Should the prerendered pages exist only in English or also in the game's other 13 languages?
| Option | What it means |
|---|---|
| English only | One page per model and category, matching the site's English-only UI rule. Other languages can come later under a `/<lang>/` prefix without moving the English URLs. |
| All 14 languages | `/<lang>/model/<id>/` with hreflang links and titles from `text/<code>.json`. 14x the pages, and the page labels need new translations. |

**Answer: English only.**

### How is the page content produced: Solid server-side rendering of the real components, or a dedicated static HTML template?
| Option | What it means |
|---|---|
| Static template from catalog records | A Node-only, pure function turns (built `index.html` shell, catalog records) into one HTML file per page. The content goes inside `#root`, where the loading line is now, and `main.tsx` replaces it when the app mounts, as it does today. |
| Solid SSR + hydration | Render `App` on the server with `renderToString` and hydrate in the browser. The prerendered page then matches the app exactly, but the components use `window`, IndexedDB, three.js and `fetch` at mount, and every component would have to be made SSR-safe. |

**Answer: Static template (decided without asking)** - it keeps the app untouched. It can
be unit-tested in Vitest's node environment like `catalogQuery`, and the content is the
same facts the app shows, so it is not cloaking. It would have been worth asking if the
user wanted the crawler and the visitor to see pixel-identical markup.

### Does the in-app navigation move to the path URLs too?
| Option | What it means |
|---|---|
| Yes, paths are the app's URLs | Opening a model pushes `/model/<id>/`, picking a chip pushes `/category/...`, the list is `/`. The search, sort, layout, tab, node and `p.<name>` stay in the query string on those paths. |
| No, prerender only | The app keeps `?model=` URLs, and the prerendered pages exist only for crawlers. Shared links would then differ from the canonical URLs, and the duplicate URLs would compete. |

**Answer: Yes (decided without asking)** - a canonical URL that visitors never see or share
works against the goal. This is the obvious reading of "SEO-friendly pages".

### What happens to existing `?model=` and `?cat=` links?
| Option | What it means |
|---|---|
| Keep reading them, rewrite in place | `parseView` still accepts the query form, and the app `replaceState`s to the path form on load. The prerendered `/` is unchanged for crawlers. |
| Server redirects | Return a 301 from `?model=x` to `/model/x/`. The assets-only Worker cannot match query strings without adding a Worker script. |

**Answer: Keep reading them, rewrite in place (decided without asking)** - links already
shared and the webapp Creator's `?cat=&sub=&sub2=` form keep working, and the Worker stays
script-free. Google treats the canonical of `/` plus the client rewrite as enough.

### Which pages are generated?
| Option | What it means |
|---|---|
| Home, every model, every reachable chip path | `/` lists the groups and links every model. Each group, l2 and l3 that has models gets a category page, except a level that only ever holds the synthetic `other` chip (the `NO_LEVEL2` fleets). Each model gets one page. |
| Also one page per variant | `/model/<id>/?p...` or `/model/<id>/<variant>/`. Hundreds more thin pages with no thumbnail of their own (variant thumbnails are browser-rendered). |

**Answer: Home, models, reachable chip paths (decided without asking)** - variants become
text on their model's page (the parameter titles and their value titles). That way
"green cream Bardotka" still matches the model page, without adding thin duplicates.

### How are category path segments named?
| Option | What it means |
|---|---|
| The chip ids, slugified | The group ids (`train`, `building`, ...) as they are, and l2/l3 values (a vehicle's `group`, a building's free-text `category`, a traction) lower-cased and hyphenated. The build fails on two values that give the same slug. |
| Hand-kept slug table | Stable even if a category label is reworded, but every new category means another table entry. |

**Answer: Slugified chip ids (decided without asking)** - category URLs are less precious
than model URLs (the user chose flat model URLs for that reason). A reworded building
category moves only its own category page.

### What does each page carry?
| Option | What it means |
|---|---|
| Full head + readable facts + links + JSON-LD | Each page has its own `<title>`, `description`, canonical, `og:*`/`twitter:*`, and a visible `<h1>`. A model page adds the thumbnail `<img alt>`, a generated sentence, the spec facts, author, licence and source, its parameters and values, a breadcrumb, a category link and links to the other models in its category. Structured data is `BreadcrumbList` everywhere and a schema.org `3DModel` on model pages. |
| Head tags only | Fixes link previews but gives Google no content to rank. |

**Answer: Full (decided without asking)** - the description sentence is generated from
the record (for example "Boeing 747-400 - a procedural 3D aircraft model for Rail
Island, 62 m long, 9,800 triangles, CC0"). It is not written by hand per design, so no
design gains a new field and no module's output changes.

### Sitemap, robots and unknown paths?
| Option | What it means |
|---|---|
| sitemap.xml + robots.txt + real 404 | The sitemap lists every generated page, sorted, with no `lastmod` (deterministic output). `robots.txt` names the sitemap. `not_found_handling` becomes `404-page` with a `404.html` that is the app shell with `noindex`. |
| Keep SPA fallback | Unknown paths stay soft 200s that duplicate `/`. |

**Answer: sitemap + robots + 404 (decided without asking)** - Cloudflare's default
`html_handling` (auto trailing slash) already serves `/model/<id>/` from
`model/<id>/index.html`. An unknown `/model/<id>/` now returns 404, and the app inside
`404.html` still shows "model not found" with the list.

## High-level plan

1. **Routing.** The URL state gets a path part: `/`, `/model/<id>/` and `/category/<group>[/<l2>[/<l3>]]/`.
   The query string keeps the rest. Parsing still accepts the legacy query form and
   serializes to the path form. The app rewrites a legacy URL on load and updates the
   document head (title, description, canonical) whenever the view changes.
2. **Real links in the UI.** Model cards, table rows (through their title), chips, the
   back arrow and the prev/next steps become `<a href>` links to the path URLs. A plain
   left click is intercepted and handled with `pushState` as today. A modified click
   (open in new tab) is left to the browser.
3. **Page generator.** A Node-only, pure function builds every page from the built
   `index.html` shell and the catalog: page list, slugs, head tags, body content,
   JSON-LD, sitemap and robots. A build step writes its output into `dist/` after Vite
   has written the shell, so the hashed asset names are known.
4. **Hosting.** `wrangler.jsonc` switches to a 404 page. The docs for the URL state, the
   build and the deploy are updated, and a new document describes the prerendered pages.
5. **Checks.** Unit tests on the generator with a small fixture catalog cover:
   - determinism (same input, byte-identical output)
   - one page per reachable chip path, and a failure on a slug collision
   - every model linked from its category and from `/`
   - canonical and `og:url` equal to the page's own path
   - escaping of titles, and valid JSON-LD
   - the legacy-to-path URL round trip in `catalogQuery`

   `test/siteMeta.test.ts` keeps the home page's tags in step.

## Architecture decisions

- **The path is part of the view state, owned by `catalogQuery`.** Parse and serialize
  stay one pure pair, so the app, the generator and the tests agree on every URL by
  construction. The generator imports the same chip functions (`groupOf`, `level2Of`,
  `level3Of`, `GROUPS`) instead of copying the hierarchy.
- **The generator is Node-only and outside `src/`.** It reads files and writes `dist/`,
  so the rule that generator code never reaches the browser bundle holds. What it shares
  with the site is pure and DOM-free (`catalogQuery`), in the same way `src/` imports
  only types from `generator/`.
- **The prerendered content lives inside `#root` and is replaced by the app.** The app's
  boot path does not change (`main.tsx` already empties `#root`), and nothing is
  hydrated. The inline loading line and error box stay. The prerendered facts are shown
  in place of the loading line, so a slow phone sees real content instead of
  "Loading...".
- **The model URL is `/model/<id>/`, the permanent id verbatim.** Model ids are never
  renamed, so these URLs never break. A retired id that ever got an alias would need a
  static redirect entry (Cloudflare `_redirects`), not a code change.
- **Output is deterministic.** Pages, sitemap entries and links are sorted. There are
  no timestamps and no `lastmod`. A page changes only when its record or the shell
  changes.
- **Every asset URL the app uses must be absolute.** Pages now load from nested paths,
  so a relative `fetch` or `src` would break there. The current code uses `/catalog.json`
  and `/${thumbUrl}`, but this is an invariant to check across `src/`.

## Weaknesses and risks

- **Duplicate content between `/category/...` with a query and without it.** The
  canonical always drops the query string. The search, sort and layout states are not
  indexed by design.
- **Thin model pages.** Many models share a template sentence and differ only in
  numbers. Google may index only part of them. Generated text cannot fully fix that;
  hand-written per-model descriptions are out of scope (see below) and are the next
  step if the indexing numbers disappoint.
- **Link-preview images.** The model thumbnail used as `og:image` may be under some
  platforms' minimum size, and side views are very wide. If they are too small, the
  page falls back to `social-preview.png`. The threshold has to be checked against the
  real thumbnail sizes.
- **Slugified building categories** (my decision): rewording a category label moves its
  category page, and the old URL then returns 404. If the categories get reworded
  often, a hand-kept slug table is the better choice.
- **The 404 page instead of the SPA fallback** (my decision): any path outside the
  generated set now returns 404. Today, links to arbitrary paths quietly open the
  catalog.
- **A model page shows facts before the app mounts, then the app redraws.** A visible
  jump on load is possible. The prerendered markup should use the site's own classes
  and layout widths to keep the jump small.
- **Build time and dist size:** one small HTML file per model and per category, a few
  hundred files in total. This is negligible next to `js/` and `thumbs/`. The test
  suite's 5-minute budget is unaffected, because the generator's tests use a fixture
  and do not rebuild models.
- **`pnpm dev`:** Vite's SPA fallback serves `index.html` for `/model/<id>/`, so the app
  works in dev, but the prerendered content is seen only after `pnpm build && pnpm preview`.

## Out of scope

- Pages in the game's other 13 languages (the user chose English only; a `/<lang>/` prefix is left free for later).
- One page per variant, and per-variant thumbnails.
- Hand-written per-model descriptions or new design fields for SEO.
- Search Console setup, sitemap submission, analytics.
- Solid server-side rendering or hydration.
- Changing model ids, or the webapp Creator's query-string format (still accepted).
