# The catalog and the workshop

**Covers** - the two lists of the site: the confirmed **catalog** and the **workshop** of drafts; what a draft is, what the export does with it, how a model is confirmed; a model's web links on its Sources tab.
**Code** - `generator/workshop.ts`, `generator/catalogModels.json`, `generator/linkTable.ts`, `generator/catalog.ts` (`catalogRecord`: `draft`, `links`), `generator/generate.ts` (`buildExport`), `generator/sitePages.ts`, `src/catalogQuery.ts` (`Section`, `sectionRows`, `sectionHeading`), `src/App.tsx`, `src/ModelDetail.tsx`, `test/workshop.test.ts`
**See also** - [catalog-site.md](catalog-site.md), [seo-pages.md](seo-pages.md), [../models/export.md](../models/export.md)

## Drafts

A model is **confirmed** when its id is listed in `generator/catalogModels.json`. Any
other model is a **draft**: it is built, checked and shown like every model, but it
lives in the workshop until somebody confirms it.

- The list was started with every model up to the Siemens Vectron (335 ids). Everything
  added since - the world fleet (aircraft, ships, buses, trucks, trams, cable car
  cabins), the US, Japanese, Chinese and Indian trains and the trains of the eight
  countries - is a draft (711 models when the workshop was introduced).
- Confirmed since: the 19 draft buses of 7,000 triangles and more (2026-11), the 20 Swiss
  trains (2026-11) and the 19 Japanese draft trains - Shinkansen, JR/JNR, private-railway
  units, locomotives and the Blue Train coach (2026-11). The Japanese trams stay drafts.
  The 20 German trains of the detail pass (2026-11): the ICE 3, 4, T and 2, the BR 423, 642
  and 650, the VT 98, the SVT 877, the BR 103, 101, 120 and 218, the E 18, E 94 and V 200,
  the 01, 52 and P 8, and the Intercity coach (docs/models/germany-trains.md).
- **A new model starts as a draft**: nothing to do when adding one. It reaches the
  game only once confirmed.
- **Confirming** a model is adding its id to `ids` in `catalogModels.json` (sorted). Do it
  only when the user confirms the model. A shipped (confirmed) id is never removed: the
  game's saved maps hold it.

The list is kept apart from the designs, like `countryTable.ts`: a design module is
bundled into each of its models' JS files, so a flag stated there would rewrite them.
The build fails when the list names a model that does not exist.

## What the export does with a draft

| Output | A draft |
|---|---|
| `skyscrapers.meta.json`, `village.meta.json`, `vehicles.meta.json`, `props.meta.json`, `characters.meta.json` | **left out**: the game imports no draft |
| `catalog.json` | listed, with `draft: true` and `thumbBytes: 0` (its `thumbUrl` names no file); a road or rail vehicle keeps its `thumbSide` frame |
| `thumbs/<id>.png` | **not rendered** - the slow part of the build; the site renders a draft's thumbnail in the browser when it is shown, below. `build-cache/thumbs/` keeps none, so a confirmed model's first build renders it ([../guide/build-cache.md](../guide/build-cache.md)) |
| `js/<id>.js`, `tree/`, `refs/` | written, so the site can show it |
| `text/<code>.json` | its texts stay, so confirming it needs no translation work |
| prerendered pages | its own model page, with `noindex` and no thumbnail image; not on the home or category pages, not in `sitemap.xml` ([seo-pages.md](seo-pages.md)) |

The game's importer reads the meta files, so a draft's JS model in the export folder
is ignored by the game. The site's OpenTTD downloads still work for a
draft: OpenTTD is not the game.

## The site

The listing opens on the **catalog**: only confirmed models, with the app bar reading
"Rail Island Catalog". A **Catalog | Workshop** switch above the search box (each with
its count) moves to the **workshop**, `?section=workshop` in the URL, which lists only
the drafts and reads "Rail Island Workshop", with a note that drafts are not exported
to the game. The chips, the country row, the search and the totals all work within the
section.

A model page belongs to its model's section, whatever the URL says: a draft linked to
directly steps (previous / next) through the workshop, and closing it returns to the
workshop. A draft's page shows a **Workshop draft** badge above its export button.

**Thumbnails on the fly.** A draft has no thumbnail file, so wherever the site shows
one (the table's and cards' thumbnail, the model page's Specs tab) it renders the
default variant from the JS model in the browser (`VariantThumb`, `variantThumbs.ts`),
as `pnpm dev` does for every model: only once the box scrolls into view, and cached in
the browser keyed on the model's JS hash.

## Web links

Besides its source images (`assets/<name>/`, the record's `references`), a model may
name the **web pages** it was built from: an article, a manufacturer's page, a drawing,
a database entry. They are stated in `generator/linkTable.ts`, keyed by model id:

```ts
export const MODEL_LINKS = {
  "proc-vehicle-vectron": [{ title: "Wikipedia: Siemens Vectron", url: "https://en.wikipedia.org/wiki/Siemens_Vectron" }],
};
```

The record carries them as `links` (absent when none), for the site only: no game meta
file carries them. The model page's **Sources** tab (formerly Images) lists the links -
title and host, opening in a new tab - above the images; the tab appears when the model
has either. The build fails on a link of a model that does not exist, a link without a
title, a URL that is not `https`, or the same URL twice on one model.

A link stated here is also worth naming in the model's `assets/<name>/SOURCES.md`, the
record of what the model was built from (AGENTS.md).
