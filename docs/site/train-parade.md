# The train parade

**Covers** - the hand-picked vehicle chains railisland.com drives across its landing page: the list (trains, trams, buses, horse-drawn vehicles), how a formation or a hand-composed train resolves and is checked, each chain's category and the play order that spreads them, the overview page at `/parade/`, the cars rendered at build time as lossless WebP (turned cars, a whole articulated train in sections, the moving parts of an animated car as a sprite), the incremental cache, the fleet counts the caption under it names, `parade.json` and its headers.
**Code** - `generator/trainParade.ts`, `generator/writeParade.ts`, `generator/paradePage.ts`, `generator/renderGlbThumb.ts` (`rasterize`, `sideFrame`), `generator/glbPose.ts` (`poseGlb`), `vite.config.ts` (`ASSET_HEADERS`), `test/trainParade.test.ts`
**See also** - [../models/export.md](../models/export.md), [../models/animation.md](../models/animation.md) (the distance-driven clips), [../guide/deploy.md](../guide/deploy.md), [openttd-export.md](openttd-export.md) (formations), [../specs/2026-11-15-hero-train-parade.md](../specs/2026-11-15-hero-train-parade.md)

## What it is

railisland.com's hero shows one random vehicle chain at a time moving from right to
left along a track - or, for a bus or a stagecoach, a road. The factory decides
which chains exist and draws them; the website only fetches
`https://factory.railisland.com/parade.json` in the browser, places the images it
names, steps the animated cars' sprites as they move, and under the track shows
how big the fleet is - every kind of vehicle with an icon and its count, then all
their variants - from the file's `fleet`. Each chain plays once per round, in an
order that spreads the categories (`playOrder`, below); railisland.com's
`?parade=<id>` plays one chain only, for checking it, and
`https://factory.railisland.com/parade/` lists every chain with its id.

## The list

`TRAIN_PARADE` in `generator/trainParade.ts`, edited by hand: thirty chains today -
high-speed and regional units, locomotives with coaches or wagons, five steam
engines with their tenders, metros, trams, buses and three horse-drawn vehicles. A
train has an `id` (lower-case, digits, dashes; unique) and either:

- `cars`: its cars nose first, each `{ model, params?, turned? }` or
  `{ formation: { model, name } }` (a steam locomotive "with tender", then the coaches); or
- `formation: { model, name }`: one of that model's OpenTTD formations
  (`generator/openttdTable.ts`), which stands for its cars, turned ones included.

`resolveTrains` checks every car and fails the build on the first fault: the model
exists, is confirmed (`catalogModels.json`, not a workshop draft), is a road or
rail vehicle (a side-view category), and every parameter value is one it offers.
Values equal to the default are dropped, so `{ livery: "red" }` and `{}` are one car.
A train whose cars are all Road vehicles runs on the road (`ground: "road"`), every
other on rails.

## Categories and the play order

Every chain has a **category** (`TRAIN_CATEGORIES`): `electricUnit`, `dieselUnit`,
`electricLoco`, `dieselLoco`, `steamLoco` (a locomotive and its train), `metro`,
`tram`, `bus` and `horse`. `trainCategory` derives it from the lead vehicle's
catalog fields - traction `animal` is `horse`, a Road vehicle `bus`, the groups
`tram` and `metro` themselves, a `unit` an electric or diesel unit by traction,
anything else a locomotive by traction - unless the list states one
(`category` on the train; an unknown one fails the build).

`playOrder` (`trainParade.ts`) makes one round: every chain once. Each category's
chains are shuffled and spread evenly over the round (the k-th of n gets the key
(k + offset) / n, one random offset per category; sorting by key interleaves them),
then a chain whose category repeats its predecessor's - or, first in a round, the
last chain played - is swapped with the nearest one that fits, ahead or, at the
end of the round, behind. With today's thirty chains (eight electric units, six
steam trains, four trams, three buses, three horse-drawn, two electric
locomotives, two metros, one diesel unit, one diesel locomotive) no two of one
category ever play in a row (tested over 2,000 rounds). The function is
self-contained: the overview page embeds its source, and railisland.com's
`TrainParade.astro` carries a copy - keep them in step.

## The overview page

`writeParade` also writes `export/parade/index.html`, served at
`https://factory.railisland.com/parade/` (`paradePage.ts`): a standalone page, not
a route of the catalog app, with the data inlined. It lists every chain - its
number, its id (the value of railisland.com's `?parade=`), its category, length,
images, rails or road, whether it is animated, a link that opens it alone on
its picture at 8 px per metre (an animated car drawn into a canvas, still image and
current frame together as railisland.com draws it, its wheels and legs moving as if
the train ran at the site's speed) - in **List order** (`TRAIN_PARADE`), **Shuffle** (one round from
`playOrder`, exactly as the site makes it) or **Sort by category** (under a heading
per category). It is marked `noindex`: a tool for checking the chains, not a page
for search.

A car may also be a **whole articulated train** drawn as one model (`unit: "train"`).
The TGV Duplex is listed so, not as its OpenTTD formation: its trailers share Jacobs
bogies, and the formation's cars, drawn one by one, each carry their own, so the
shared bogies showed twice at every joint. The full-train model draws one per joint.

## The images

`pnpm build:parade` (`generator/writeParade.ts`; part of `pnpm build`, after
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

Every image is **lossless WebP**: flat-shaded vehicles compress to a third of the
PNG, where lossy WebP would be larger.

### Animated cars

A car with **distance-driven clips** ([../models/animation.md](../models/animation.md):
a steam locomotive's or tender's `running` gear, the `rolling` spoked wheels of
the CD 150, the buses and the horse-drawn cars, a team's `gait`) is drawn over one
cycle of them:

- **the cycle** (`spriteCycle`): one clip's cycle is its speed times its duration -
  metres travelled per wheel turn or stride. Several clips loop over the shortest
  whole number (up to 4) of the longest one's cycles at which they all come round
  together (within 1 %), else over the longest; a clip that does not come round
  then jumps once per loop (the Budweis coach's wheels against its horses' stride);
- **the frames**: 12 over the cycle (`FRAMES_PER_CYCLE`), at least 8 per cycle of
  the shortest clip (`MIN_FRAMES_PER_CLIP`), at most 16 (`MAX_FRAMES`); frame f is
  every clip posed at f / frames of the cycle (`poseAtDistance`: the nearest
  sample of each, through `poseGlb`). A turned car runs its clips backwards, so its
  wheels turn the same way on screen as every other car's;
- **the sprite**: the frames differ only where something moves, so only that
  rectangle is stored (`changedRect`, 4 pixels wider than any change,
  `SPRITE_MARGIN_PX`) as `<name>--frames.webp`: the rectangle's frames stacked top
  to bottom with 4 transparent rows between them (`SPRITE_GAP_PX`), so a frame's
  edge, scaled down on screen, never picks up its neighbour's. It is drawn over the
  car's still image, which has **only the moving pixels** cleared (`changedMask`, a
  pixel wider each way). The sprite holds those pixels and, round them, only the
  unchanged pixels that are fully opaque: where the two layers overlap they show
  the same opaque picture, so there is no seam to flicker as the train moves by
  fractions of a pixel, and the partly transparent outline pixels come from the
  still alone, so none is drawn twice. The still is a copy of frame 0 - clearing
  frame 0 itself once emptied every sprite's first frame, and every animated car
  lost its wheels and legs once per cycle (the test draws them back together). The sprite sheet is also tried as
  lossy WebP (quality 85, exact alpha) and kept that way when smaller - a team's
  shaded legs over many frames, where it saves about half.

A client shows frame `floor(frac(distance / cycleM) * frames)` for the distance
the train has travelled, so wheels and legs move exactly with the ground. It
should draw the still and the frame into one picture (railisland.com uses a canvas
at device resolution): laid on each other as two scaled images, the browser snaps
each to whole pixels on its own and the moving parts shimmer against the body.

### Incremental

Every image's name ends in a 12-digit hash of what shapes it: the design's
build-cache key (`build-cache/facts/<id>.json`, which covers its sources and the
renderer, [../guide/build-cache.md](../guide/build-cache.md)), its values, turned,
and the text of `writeParade.ts`. A file keeps what each hash
rendered (length, image names, sprite rectangles, frames, cycle) -
`export/.parade-keys.json`. A car whose hash
is there with all its files is not built at all. The deploy restores the last
export (its `actions/cache` step), so a deploy that changed no listed design
renders nothing (about 2 s; all thirty chains from cold take about 80 s). Files
no car uses any more are deleted. A design with no build-cache key is always
rendered, under a random name.

## Fleet counts

`fleet` counts every **confirmed vehicle** (`fleetCounts`) into exactly one kind
(`vehicleType`), in the caption's order (`VEHICLE_TYPES`):

| Kind | What |
|---|---|
| `trains` | Rail vehicles but trams: locomotives, units, coaches, wagons, metros |
| `trams` | Rail vehicles in the `tram` group |
| `buses` | Road vehicles in the `bus` group |
| `trucks` | the other Road vehicles |
| `horseDrawn` | every vehicle with `traction: "animal"` - the horse trams, the horse railway's cars and the road coaches - taken out of the kinds above |
| `ships`, `aircraft`, `cableCars` | the Ships, Aircraft and Cable car categories |

`variants` adds up every counted vehicle's variants (`modelVariants`): per model,
every distinct value of every parameter (not their combinations), leaving out
`cars` (a whole train's car count) and the site's preview fixtures; a model with
no other parameter counts 1.

## parade.json

| Field | What |
|---|---|
| `version` | 1 |
| `pxPerM` | pixels per metre of every image (32) |
| `heightM`, `bottomM` | every image's height in metres (6.3) and its bottom edge relative to the rail or road (-0.3) |
| `fleet.types` | confirmed vehicles per kind, every kind present (above) |
| `fleet.variants` | all their variants (above) |
| `trains[].id` | the train's id from the list |
| `trains[].ground` | `rail` or `road` |
| `trains[].category` | its category (above) |
| `trains[].lengthM` | from the first car's nose to the last car's tail, metres |
| `trains[].cars[].model`, `.params`, `.turned` | the car: model id, non-default values, running backwards |
| `trains[].cars[].section` | for a car drawn in sections, which one (0 from its nose); absent otherwise. Each section is its own entry, placed like a car |
| `trains[].cars[].image` | its still image, relative to parade.json (`parade/img/...`) |
| `trains[].cars[].offsetM` | metres from the train's nose to the image's left edge |
| `trains[].cars[].widthM` | the image's width in metres: the car's length and the 0.3 m margins |
| `trains[].cars[].sprite` | an animated car's moving part: `image` (the frames, relative to parade.json), `xM`, `yM` (its top-left corner from the still image's, metres), `widthM`, `heightM` (one frame), `pitchM` (from one frame's top to the next's, the gap included), `frames`, `cycleM` (metres travelled per loop) |

Cars are laid end to end with couplers touching: each car's length is its built
extent along X, buffers and couplers included. Neighbouring images overlap by the
two transparent margins. A client places a car at `offsetM * scale` and sizes it
`widthM * scale` by `heightM * scale`, one scale for every train so lengths compare,
and its sprite at `xM * scale`, `yM * scale` inside it.

## Serving

`vite build` emits `dist/_headers` (`ASSET_HEADERS`), which the assets-only Worker
applies: `/parade.json` gets `Access-Control-Allow-Origin: *`, because a script on
railisland.com reads it, and keeps the Worker's default revalidating cache;
`/parade/img/*` gets a year of immutable caching, which is safe because every
image's name carries its hash. The overview page, `/parade/`, is outside that
folder on purpose, so it is never cached for a year.

The file was `trains.json`, its images `trains/`, until the contract was renamed
for what it holds (trams, buses, horse-drawn vehicles, the fleet's counts):
`writeParade` deletes those old paths from an export it finds them in. The images are `<img>` loads and need no CORS header. The
game reads none of these files. `pnpm dev` does not serve them (the dev server
serves only what the catalog site needs); run `pnpm build:parade` and open
`export/` instead.

`renderSide` repeats the side view's supersampling and light rather than changing
`renderGlbThumb.ts`: that file is an input of every design's build-cache key
([../guide/build-cache.md](../guide/build-cache.md)), so touching it rebuilds the whole
cache. The test that compares a car with its thumbnail keeps the two in step.

## Known limits

- An articulated train on Jacobs bogies must be listed as its whole-train model; its
  OpenTTD formation would show every shared bogie twice.
- A car whose clips never come round together within four of its longest cycles
  jumps once per loop in the shorter one.
- The sprites with a horse team are the heaviest images (30-80 KiB); a team of four
  would double the stagecoach's, so the parade's teams are of two.
