# SEO-friendly prerendered model and category pages

Spec: docs/specs/2026-11-04-seo-prerendered-pages.md
Date: 2026-11-04
Status: implemented
Area: catalog site (URL state, links, head), site build (Vite `site-pages` plugin), Cloudflare assets config, docs

## What was done

- **URL state** (`src/catalogQuery.ts`):
  - `parseView(search, pathname)` reads the page from the path: `/model/<id>/` or
    `/category/<group>/[<l2>/[<l3>/]]`. It still reads the old all-query form.
  - `viewUrl`/`viewPath` write the path form, and `serializeView` is now only the query
    part. A model page keeps the list's chips in the query.
  - Chip values are held as slugs (`chipSlug`) and matched by slug (`chipMatches`), so
    raw `?sub=busStop` links still work.
- **Page text** (`src/pageMeta.ts`): titles, descriptions, headings, breadcrumbs and the
  chip tree. It is pure and shared by the app and the build.
- **Links** (`src/Link.tsx`): model cards, the table's title cell, the variant rows and
  tiles, the chips, the back arrow and the previous and next steps are `<a href>`
  elements. A plain left click goes through `pushState`; a modified click is left to
  the browser.
- **App head.** `App.tsx` updates the title, description, canonical link and `og:*` tags
  as the view changes. On load it rewrites an old `?model=`/`?cat=` URL to the path form.
- **Generator** (`generator/sitePages.ts`, run by the `site-pages` Vite plugin after the
  bundle is written) writes:
  - `index.html` with the groups and every model
  - 54 category pages and 335 model pages
  - `404.html` (`noindex`), `sitemap.xml` (390 URLs, no `lastmod`) and `robots.txt`

  Each page has its own head, JSON-LD (a `BreadcrumbList`, plus `3DModel`,
  `CollectionPage` or `WebSite`) and its facts and links inside `#root`, after the
  loading line. The build fails on a missing shell tag, a slug collision or an odd id.
- **Hosting.** `wrangler.jsonc` uses `not_found_handling: "404-page"`.
- **Docs.** New `docs/site/seo-pages.md`, with a row in `docs/README.md`. Updated
  `docs/site/catalog-site.md` (URL state, link previews), `docs/guide/deploy.md` and
  `docs/guide/setup-and-build.md`.
- **Tests.**
  - New `test/sitePages.test.ts` (12 tests on a fixture catalog): the page set,
    determinism, canonical and `og:url` per page, links from home and from the
    categories, breadcrumbs, JSON-LD validity and escaping, the preview-image
    threshold, 404 and sitemap, slug collisions, shell checks.
  - `test/catalogQuery.test.ts` is updated to the path form and adds slug, legacy and
    unknown-path cases.
  - `test/siteMeta.test.ts` checks that `pageMeta.ts` and `index.html` agree on the home
    page's head.

Checks run:
- `pnpm typecheck`: clean.
- `pnpm test`: 131 files, 7598 passed, 11 skipped, 3 min 43 s.
- `pnpm build`: 393 site files.
- `pnpm preview` with curl: `/`, `/model/proc-vehicle-cd-163/` and `/category/train/loco/`
  serve their own `<title>`; sitemap and robots are served.
- `wrangler deploy --dry-run`: the config is accepted.

The work is on the session's designated branch `claude/blissful-johnson-givpdn`, not on a
new `claude/<slug>-<hex>` branch, because the session may push only there.

## How to test

**Automated coverage.** None end-to-end: the repository has no E2E framework, and
`AGENTS.md` forbids driving a browser without agreement. The generator and the URL
round trip are covered by `pnpm exec vitest run test/sitePages.test.ts test/catalogQuery.test.ts test/siteMeta.test.ts`.

**Setup.** `pnpm install`, `pnpm build`, `pnpm preview` (it serves `dist/` on
http://localhost:4173). Note that `pnpm preview` falls back to `index.html` with a 200 for
unknown paths. The real 404 shows only on Cloudflare, so dispatch `deploy.yml` on this
branch to test it there.

**Steps.**
1. Open `/` with JavaScript disabled. You should see the "Rail Island Factory" heading,
   the group links with their counts, and every model as a link.
2. Open `/model/proc-vehicle-cd-163/` with JavaScript disabled. You should see the
   breadcrumb Trains > Locomotive > Electric, the thumbnail, the facts, the "Livery"
   values and "More in Electric". View the source: the `<title>`, canonical, `og:*` and
   two JSON-LD scripts.
3. Re-enable JavaScript and open `/`. Click the "Trains" chip: the address bar shows
   `/category/train/`. Click "Locomotive", then "Electric": the address becomes
   `/category/train/loco/electric/`, and the tab title follows.
4. Click a card or a table title: the address becomes `/model/<id>/?cat=train&sub=loco&sub2=electric`.
   Use the previous and next arrows: they stay within the electric locomotives. Press
   Back: you return to the filtered list.
5. Ctrl+click (Cmd+click) a model card or a chip: it opens in a new tab at that URL.
6. Open the old form `/?model=proc-vehicle-cd-150&tab=references`: the page opens on its
   Images tab and the address becomes `/model/proc-vehicle-cd-150/?tab=references`.
7. Open `/?cat=structure&sub=busStop`: it lists the bus stops, and the address becomes
   `/category/structure/bus-stop/`.
8. Open `/sitemap.xml` and `/robots.txt`.

**Also worth trying.**
- `/model/does-not-exist/` on Cloudflare should return 404 and show "No model ..." with
  a link back.
- `/model/proc-vehicle-cd-163` (no slash) on Cloudflare should redirect to the slash
  form.
- Paste a model URL into Facebook's Sharing Debugger: a model with a thumbnail of at
  least 200 x 200 px shows that thumbnail, and side-view vehicles show the site's
  preview.
- Google's Rich Results Test on a model page should show a valid `BreadcrumbList`.

## What is missing

Nothing - the spec is implemented in full.

## Known problems

- Side-view vehicle thumbnails are about 557 x 202 px and do pass the 200 px threshold,
  but they are very wide for a preview card. Only small thumbnails fall back to
  `social-preview.png`.
- The prerendered content shows unstyled by the app's layout until the app mounts, and
  then it is replaced. There is a visible swap on load.
- Every page repeats the inline boot script and styles of the shell, about 15 kB per
  page and 6 MB for the whole site in `dist/`.
- `vite preview` and `pnpm dev` answer unknown paths with a 200, so the 404 behaviour can
  be checked only on Cloudflare.
- Picking a chip is now a history entry. Before, it replaced the current one, so Back
  now steps through chip picks.
- The "Source" fact often repeats the author ("Rail Island").

## Recommended follow-ups

- Submit `sitemap.xml` in Google Search Console and watch how many model pages get
  indexed, before investing in hand-written descriptions.
- If many pages stay "crawled, not indexed", add a short hand-written description to the
  most important designs.
- Consider a dedicated 1200 x 630 link-preview render per vehicle (the side view on the
  site's background) instead of the raw thumbnail.

## Changelog

- Every model and every category now has its own address, for example `/model/proc-vehicle-cd-163/` or `/category/train/loco/electric/`, which you can share and bookmark.
- Search engines and link previews see each model's and category's title, description, image and links without running the app.
- Model cards, chips and the previous/next arrows are real links: Ctrl+click or middle-click opens them in a new tab.
- The site publishes a sitemap and answers unknown addresses with a proper "not found" page.
- Old `?model=` and `?cat=` links keep working and switch to the new addresses.
