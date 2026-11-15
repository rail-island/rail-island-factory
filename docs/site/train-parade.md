# The train parade

**Covers** - the hand-picked whole trains railisland.com drives across its landing page: the list, how a formation or a hand-composed train resolves and is checked, the cars rendered at build time (turned cars included, a whole articulated train in sections), the fleet counts the caption under it names, `trains.json` and its CORS header.
**Code** - `generator/trainParade.ts`, `generator/writeTrains.ts`, `generator/renderGlbThumb.ts` (`rasterize`, `sideFrame`), `vite.config.ts` (`ASSET_HEADERS`), `test/trainParade.test.ts`
**See also** - [../models/export.md](../models/export.md), [../guide/deploy.md](../guide/deploy.md), [openttd-export.md](openttd-export.md) (formations), [../specs/2026-11-15-hero-train-parade.md](../specs/2026-11-15-hero-train-parade.md)

## What it is

railisland.com's hero shows one random train at a time moving from right to left
along a track. The factory decides which trains exist and draws them; the website
only fetches `https://factory.railisland.com/trains.json` in the browser, places
the images it names and, under the track, says how big the fleet is ("272 train
models with 921 variants available") from the file's `stats`. A proof of concept:
about ten trains.

## The list

`TRAIN_PARADE` in `generator/trainParade.ts`, edited by hand. A train has an `id`
(lower-case, digits, dashes; unique) and either:

- `cars`: its cars nose first, each `{ model, params?, turned? }`; or
- `formation: { model, name }`: one of that model's OpenTTD formations
  (`generator/openttdTable.ts`), which stands for its cars, turned ones included.

`resolveTrains` checks every car and fails the build on the first fault: the model
exists, is confirmed (`catalogModels.json`, not a workshop draft), is a road or
rail vehicle (a side-view category), and every parameter value is one it offers.
Values equal to the default are dropped, so `{ livery: "red" }` and `{}` are one car.

A car may also be a **whole articulated train** drawn as one model (`unit: "train"`).
The TGV Duplex is listed so, not as its OpenTTD formation: its trailers share Jacobs
bogies, and the formation's cars, drawn one by one, each carry their own, so the
shared bogies showed twice at every joint. The full-train model draws one per joint.

## The images

`pnpm build:trains` (`generator/writeTrains.ts`; part of `pnpm build`, after
`build:models`) builds every distinct car - model, values, turned - in memory and
draws it with the thumbnails' side view (`renderSide`, the same rasterizer, framing and
light as `renderGlbSideThumb`, checked byte for byte by the test): the same 32 px per
metre and the same height window, 0.3 m below the rail to 6.0 m above it, so every
image is 202 px tall and the rail is at the same height in all of them. A turned
car's triangles are turned half round about the vertical axis first, so its other
flank shows and its nose is on the right, lit as any other car.

A car longer than 40 m (`SECTION_MAX_M`; in practice a whole train) is drawn in
equal sections of at most 40 m, each framed on its stretch with the same margins
(`renderSide(tris, xRange)`), so it keeps the parade's scale (the side view
shrinks anything over 128 m) and neighbouring sections overlap by the same pixels,
leaving no seam.

They go to `export/trains/<model>[--<name>-<value>...][--turned][--section-<n>].png`,
the values sorted by name. The folder is replaced on every run; nothing is committed or kept
in `build-cache/`. The ten trains' 45 cars take about 12 s. A car longer than the
side view's widest image (128 m) would be drawn at a smaller scale and is refused.

## trains.json

| Field | What |
|---|---|
| `version` | 1 |
| `pxPerM` | pixels per metre of every image (32) |
| `heightM`, `bottomM` | every image's height in metres (6.3) and its bottom edge relative to the rail (-0.3) |
| `stats.models` | confirmed models in the Rail vehicles category |
| `stats.variants` | their variants: per model, every distinct value of every parameter added up (not combinations), leaving out `cars` (a whole train's car count) and the site's preview fixtures; a model with no other parameter counts 1 |
| `trains[].id` | the train's id from the list |
| `trains[].lengthM` | from the first car's nose to the last car's tail, metres |
| `trains[].cars[].model`, `.params`, `.turned` | the car: model id, non-default values, running backwards |
| `trains[].cars[].section` | for a car drawn in sections, which one (0 from its nose); absent otherwise. Each section is its own entry, placed like a car |
| `trains[].cars[].image` | its image, relative to trains.json |
| `trains[].cars[].offsetM` | metres from the train's nose to the image's left edge |
| `trains[].cars[].widthM` | the image's width in metres: the car's length and the 0.3 m margins |

Cars are laid end to end with couplers touching: each car's length is its built
extent along X, buffers and couplers included. Neighbouring images overlap by the
two transparent margins. A client places a car at `offsetM * scale` and sizes it
`widthM * scale` by `heightM * scale`, one scale for every train so lengths compare.

## Serving

`vite build` emits `dist/_headers` (`ASSET_HEADERS`), which the assets-only Worker
applies: `/trains.json` gets `Access-Control-Allow-Origin: *`, because a script on
railisland.com reads it. The images are `<img>` loads and need no header. The game
reads neither file. `pnpm dev` does not serve them (the dev server serves only what
the catalog site needs); run `pnpm build:trains` and open `export/` instead.

`renderSide` repeats the side view's supersampling and light rather than changing
`renderGlbThumb.ts`: that file is an input of every design's build-cache key
([../guide/build-cache.md](../guide/build-cache.md)), so touching it rebuilds the whole
cache. The test that compares a car with its thumbnail keeps the two in step.

## Known limits

- An articulated train on Jacobs bogies must be listed as its whole-train model; its
  OpenTTD formation would show every shared bogie twice.
- The images are PNG, uncompressed to WebP, with the Worker's default
  `max-age=0, must-revalidate` caching.
