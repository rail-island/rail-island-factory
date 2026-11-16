# Hero train parade (POC)

Status: agreed
Date: 2026-11-15
Area: rail-island-factory (export, catalog site deploy); web-railisland-com (landing page hero, build-time integration)

## Context of the change

Rail Island Factory (`factory.railisland.com`) holds several hundred procedural road and
rail vehicles. Every confirmed one already has a side-view thumbnail, rendered by the
factory's software rasterizer (`generator/renderGlbThumb.ts`, `renderGlbSideThumb`):
orthographic, nose on the left, 32 px per metre over a fixed height window (0.3 m below the
rail to 6.0 m above it), so every image is 202 px tall and its width is to scale. The images
are committed in `build-cache/thumbs/<id>.png`, copied to `export/thumbs/` by
`pnpm build:models`, and served at `https://factory.railisland.com/thumbs/<id>.png`. The
catalog entry's `thumbSide` (`widthM`, `heightM`, `bottomM`) says what each image spans.
Only the default variant of each design has a PNG.

The factory also states fixed formations for OpenTTD (`generator/openttdTable.ts`,
`formations`), but most of their cars are non-default variants with no PNG.

The marketing site (`web-railisland-com`, Astro, static, Netlify) does not show the size of
this fleet anywhere. Its hero (`src/components/Hero.astro`) has the logo, the title, the
play button and the island strip. The site's convention for data from another service is
to read it once at build time and mirror pictures into `public/`
(`src/integrations/publishedIslands.ts`), never failing the build.

The factory's Cloudflare Worker sends no CORS headers, so a browser script on
railisland.com cannot read a JSON file from the factory; images load without CORS.

Earlier analysis in the same conversation compared SVG side views, in-browser rendering of
the JS models and pre-rendered images; pre-rendered WebP was the smallest and cheapest for
a decorative strip, and this POC starts from the PNGs that already exist.

## User request

I want to show on railisland web, that railisland has many train models. In the top area
will arrive random trains. Trains will go from right to left. Trains should be SVGs
generated procedurally from models - now model output is render, I want that each model
could also create SVG - side view, like image, with all variants. Just analyse at first and
suggest solution.

(Later:) SVG is not a condition.

(Later:) For now, make POC. Show on web animated trains from PNGs already generated in
factory. Factory should prepare several trains (train = list of PNGs), web will download
this list and animate it.

## Decisions

### How should the factory define the POC's trains (each train = an ordered list of side PNGs)?
| Option | What it means |
|---|---|
| Hand-picked list | A small checked-in list in the factory: a locomotive plus coaches, a steam engine plus tender plus wagons, a unit. Default variants only, so every PNG exists. |
| From OpenTTD formations | Reuse the 72 existing formations; most cars are non-default variants with no PNG, so variant PNGs must be rendered first. |
| Generated at random | The factory composes trains by rules (locomotive plus 3-8 cars of one country or era); odd pairings likely, rules are design work. |

**Answer: Hand-picked list.**

### Should the POC render any new PNGs in the factory?
| Option | What it means |
|---|---|
| No, existing only | Only the default-variant PNGs already in `build-cache/thumbs`; a car facing backwards is the same PNG mirrored by the browser. |
| Yes, variant PNGs | The factory build also renders non-default variant PNGs (middle cars, driving trailers, liveries). |

**Answer: No, existing only** - later changed by the user: "yes, I want not prerendered
images (I need eg. TGV or some units). But don't commit these images, render them in build
time for now". So the factory renders the side PNGs of the non-default variants a listed
train needs (a TGV's power car and trailers, a unit's middle cars) during its build; they
are not committed to `build-cache/` and are regenerated on every build.

(The next question - how the site gets the list and the PNGs, and where the factory
publishes the list - was interrupted by this change and is asked again with it in mind.)

### Now that the factory renders variant PNGs at build time (TGV cars, unit middle cars): how does railisland.com get the train list and the pictures?
| Option | What it means |
|---|---|
| Site build mirrors them | The site's build reads the list, downloads the PNGs, converts them to WebP into `public/`, never fails the build. No CORS needed; new trains appear at the next site deploy. |
| Browser loads from factory | The page fetches `trains.json` and the PNGs from factory.railisland.com at runtime. New trains appear without a site deploy; the factory must add CORS and cache headers; the hero depends on the factory being up. |

**Answer: Browser loads from factory.**

### Which trains should the hand-picked list include? It may name any variant now, e.g. a TGV formation or a unit's middle cars.
| Option | What it means |
|---|---|
| ~10 mixed | About 10 trains across countries and eras (TGV, ICE, Shinkansen, a Czech locomotive with coaches, steam with coaches, US freight, a commuter unit), taken from the existing OpenTTD formations where they exist. |
| Formations only | A handful of existing OpenTTD formations as they are. |
| I will list them | The user gives the exact trains. |

**Answer: ~10 mixed.** The starting list (each a confirmed model; formations as stated in
`generator/openttdTable.ts`):

1. TGV Duplex - `proc-vehicle-tgv-duplex`, its formation "power cars, 8 trailers". (Later replaced by the
   whole-train model, 8 cars, so the shared Jacobs bogies are drawn once - a follow-up
   the user asked for.)
2. ICE 1 - `proc-vehicle-ice-1`, "power cars, 6 coaches".
3. Shinkansen 0 series - `proc-vehicle-shinkansen-0`, "8 cars".
4. CD 680 Pendolino - `proc-vehicle-cd-680`, "7 cars".
5. Amtrak Acela - `proc-vehicle-amtrak-acela`, "8 cars".
6. JR E235 commuter unit - `proc-vehicle-jr-e235`, "6 cars".
7. CD 150 with coaches - `proc-vehicle-cd-150` plus `proc-vehicle-cd-y-coach` cars (composed by hand).
8. CSD steam locomotive with tender and green coaches - `proc-vehicle-csd-498-1` plus
   `proc-vehicle-csd-classic-green-coach` cars (composed by hand).
9. US freight - `proc-vehicle-emd-sd40-2` plus `proc-vehicle-us-boxcar`, `proc-vehicle-us-well-car`
   and `proc-vehicle-us-caboose` (composed by hand).
10. Vectron with Bmo double-deck coaches - `proc-vehicle-vectron` plus `proc-vehicle-bmo-double-deck-coach`
    (composed by hand).

The exact cars of the hand-composed trains (count, variants) are settled when the list is
written; the list is the factory's and can change without a spec change.

### A train's cars must be placed end to end, and some face backwards (the rear power car of a TGV). Who works that out?
| Option | What it means |
|---|---|
| Factory, in metres | `trains.json` gives every car its image URL, its offset from the train's nose in metres (couplers touching) and a `turned` flag; the factory renders a turned car from its other end. The web only places images. |
| Web, from widths | `trains.json` lists image URLs and `turned`; the web lines images up by pixel width and mirrors turned cars with CSS; margins leave gaps, mirrored light is slightly off. |

**Answer: Factory, in metres.**

### Where and how should the trains run on the landing page?
| Option | What it means |
|---|---|
| Track under hero CTA | A thin track line in the hero between the play button and the island strip; one random train at a time enters from the right, leaves on the left at a steady speed, the next follows after a pause. Reduced motion: a still train. Hidden if the list fails to load. |
| Strip at the very top | A track just under the nav; most visible, competes with the news band and nav. |
| Bottom edge of hero | Along the hero's bottom edge, below the island strip. |

**Answer: Track under hero CTA.**

### Should a passing train say what it is?
| Option | What it means |
|---|---|
| No, decoration only | Pure animation, hidden from assistive technology, nothing to translate. |
| Name + link to factory | A small English label under the train linking to the model's factory page. |

**Answer: No, decoration only** - later changed by the user, after the POC was built:
"add some text to web, something like '232 models with 450 variants available'. This
numbers should publish factory in that JSON. Variant count is number of all distinct
parameter values (except from number of coaches in full train). It is not count of
combinations. Make only english variant, other languages will have marked english text."
So `trains.json` carries the counts and the hero shows one caption under the track,
English in every locale until translated (marked `untranslated`).
Later again (a follow-up): "make train images incremental and serve them as WebP. Make
steam locomotives (and other, which requires animation) animated (webp sprite). Also
extend vehicle count - add some trams, buses, horse powered. 30 vehicle chains at sum.
Extend message ... Available in Rail Island: <Train image> 272, <Bus Image>: 44,
Variants: 1354. Make it in all languages." Asked then: road vehicles run on the same
line with the rails fading into a road edge; the caption shows "all vehicle types
provided by factory"; every distance-driven animation is animated. The images are
still rendered at build time, now incrementally, and still not committed.

### This spec touches both repositories. Where should it be committed?
| Option | What it means |
|---|---|
| Factory docs/specs | rail-island-factory already keeps specs in `docs/specs/`; the web part is described in the same file. |
| Both repositories | The same file in both; two copies to keep in step. |
| Website repo | A new `docs/specs/` in web-railisland-com. |

**Answer: Factory docs/specs.**

## High-level plan

1. **Factory: the train list.** A checked-in, hand-written list of about ten trains (above).
   Each train has an id, and an ordered list of cars from nose to tail; a car names a
   confirmed model id, its parameter values (empty for the default variant) and whether it
   is turned. A train may be written out car by car or point at one of the model's OpenTTD
   formations by name, which expands to that formation's cars. The build checks every car:
   the model exists, is confirmed, is a road or rail vehicle (has a side view), and its
   parameter values are ones the model offers. A bad entry fails the build.
2. **Factory: rendering the cars at build time.** During the factory build, every distinct
   car of the list (model, parameter values, turned) is built in memory and rendered with the
   existing side-view renderer, at the same 32 px per metre and height window as the
   thumbnails, into the generated export. A turned car is rendered seen from its other end,
   so its nose is on the right and its light is correct. The images are not committed and not
   added to the build cache; they are regenerated by every build that writes the export,
   including the deploy.
3. **Factory: publishing.** The build writes `trains.json` beside the images, with each car's
   image URL and its offset from the train's nose in metres, cars placed end to end with
   couplers touching (from each car's built bounds). The deployed site serves both; the train
   list file is sent with a CORS header allowing any origin, so railisland.com can read it.
   The game does not read either.
4. **Website: the parade.** In the landing page hero, between the play button row and the
   island strip, a thin track line. A small client script fetches `trains.json` from
   factory.railisland.com, picks a random train, loads its car images, places each at its
   offset times one shared pixels-per-metre scale (same scale for every train, so lengths
   compare), and moves the whole train from beyond the right edge to beyond the left edge at
   a steady speed; after a pause, another random train (not the same one twice in a row).
   Decorative only: hidden from assistive technology, no text, nothing to translate, so all
   fourteen locales get it unchanged. If the fetch or an image fails, the track stays empty
   or is hidden; the page is otherwise unaffected. `prefers-reduced-motion` shows one train
   standing still. Animation pauses while the tab is hidden. The script loads after the page
   so the hero's LCP picture is not delayed.

Phase 4 depends on 1-3 being deployed; until then the website shows an empty track or
nothing.

## Database and persistent storage

No database and no browser storage. New generated files only:

- **Factory source list** (checked in): the hand-picked trains as described in plan step 1.
  Written by hand; read by the factory build. Lives as long as the POC.
- **`export/trains.json`** (generated, gitignored like the rest of `export/`; served at
  `https://factory.railisland.com/trains.json`). Proposed structure:
  - `version`: number, 1.
  - `pxPerM`: number, the images' scale (32).
  - `heightM`, `bottomM`: numbers, the shared height window of every image (6.3, -0.3), so the
    rail line sits at the same height in all of them.
  - `trains`: array, in list order, of `{ id: string, cars: Car[] }`.
  - `Car`: `{ model: string` (model id), `params: object` (non-default parameter values, may be
    empty), `turned: boolean`, `image: string` (URL relative to `trains.json`),
    `offsetM: number` (from the train's nose to the image's left edge), `widthM: number`
    (the image's width in metres) `}`.
  Read by railisland.com's browser script only. Rewritten by every factory build; no
  migration (new file).
- **`export/trains/*.png`** (generated, gitignored, served under `/trains/`): one side image per
  distinct car, named deterministically from model id, parameter values and turned. Not in
  `build-cache/`. Regenerated by every build.

## Architecture decisions

- **Rendered at factory build, not committed.** The user's choice for now: no new images in
  git, and variants (TGV trailers, middle cars) are available. Cost: each build renders the
  cars (a few seconds each, a few dozen cars), and the deploy does it every time.
- **Browser reads from the factory at runtime** rather than the site mirroring at build:
  new trains show without a site deploy. It departs from the site's build-time convention
  (`Islands.astro`), and makes the hero's parade depend on the factory being up; acceptable
  for a decorative POC because failure is silent.
- **Geometry in the factory.** Offsets and turned cars are computed where the models are, so
  the web stays a dumb animator and car gaps are right.
- **Same side-view renderer and scale as the thumbnails.** No new renderer; images match the
  catalog's look; the SVG / in-browser rendering ideas from the analysis stay for later.

## Weaknesses and risks

- **Articulated trains** (TGV Duplex on Jacobs bogies, Shinkansen 0 middle cars): each car's
  image may draw the shared bogie, or none; placed end to end the bogies may double or miss.
  Likely; visible but cosmetic. Check the TGV and ICE renders first; adjust the list or the
  offsets.
- **Image weight**: factory PNGs (about 20 KiB per car) are served as they are, uncompressed to
  WebP, with the factory's current `max-age=0, must-revalidate`; a 10-car train is about
  200 KiB on each appearance until cached. Acceptable for a POC; WebP and long cache are the
  follow-up.
- **CORS and hosting**: the factory is an assets-only Cloudflare Worker; whether a per-file
  header can be set there must be confirmed before implementing. If not, the fallback is the
  site-build mirror (the rejected option).
- **Factory build time** grows by the renders; the 5-minute limit applies to `pnpm test`, not
  the build, but the deploy gets slower. Keep the list small.
- **Model changes**: a renamed parameter value or retired car breaks the list; the build
  check catches it in the factory, not on the website.
- **Mobile**: long trains (an 8-car Shinkansen is about 200 m) take long to pass at a scale
  that keeps cars recognisable; speed and scale must be tuned per screen width.
- Open: the exact cars of the hand-composed trains; the speed and pause values.

## Out of scope

- SVG side views and rendering models in the browser (analysed, deferred).
- Committing variant images to `build-cache/` or the website repo.
- Captions, links and per-locale text for the trains.
- Random composition of trains and using all 72 formations.
- Turning wheels, smoke or any per-part animation.
- Showing the parade on pages other than the landing page.
