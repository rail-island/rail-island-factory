# The train parade

**Covers** - the hand-picked vehicle chains railisland.com drives across its landing page: the list (trains, trams, buses, trucks, horse-drawn vehicles, ships, aircraft, cable car lines), each ground's view (scale and height window), each chain's speed and the overhead wire it runs under, every car's exhaust mouths and a ship's wake, how a formation or a hand-composed train resolves and is checked, each chain's category and the play order that spreads them, the overview page at `/parade/`, the cars rendered at build time as lossless WebP (turned cars, a whole articulated train in sections, the moving parts of an animated car as a sprite), a ship above its waterline, an aircraft gear up, a cable car line's cabins, stations and pylon, the incremental cache, the fleet counts the caption under it names, `parade.json` and its headers.
**Code** - `generator/trainParade.ts`, `generator/writeParade.ts`, `generator/paradeScenery.ts`, `generator/paradePage.ts`, `generator/renderGlbThumb.ts` (`rasterize`, `sideFrame`), `generator/glbPose.ts` (`poseGlb`), `vite.config.ts` (`ASSET_HEADERS`), `test/trainParade.test.ts`
**See also** - [../models/export.md](../models/export.md), [../models/animation.md](../models/animation.md) (the distance-driven clips), [../models/emitters.md](../models/emitters.md) (the exhaust mouths), [../models/cable-car-stations.md](../models/cable-car-stations.md) (the stations and the pylon), [../guide/deploy.md](../guide/deploy.md), [openttd-export.md](openttd-export.md) (formations), [../specs/2026-11-15-hero-train-parade.md](../specs/2026-11-15-hero-train-parade.md), [../specs/2026-11-17-parade-ships-aircraft-cablecars.md](../specs/2026-11-17-parade-ships-aircraft-cablecars.md)

## What it is

railisland.com's hero shows one random vehicle chain at a time moving from right to
left along a track - or, for a bus or a stagecoach, a road; a ship on the water, an
aircraft in the sky, a cable car line's cabins on their rope between two stations.
The factory decides
which chains exist and draws them; the website only fetches
`https://factory.railisland.com/parade.json` in the browser, places the images it
names, steps the animated cars' sprites as they move, and under the track shows
how big the fleet is - every kind of vehicle with an icon and its count, then all
their variants - from the file's `fleet`. Each chain plays once per round, in an
order that spreads the categories (`playOrder`, below); railisland.com's
`?parade=<id>` plays one chain only, for checking it, and
`https://factory.railisland.com/parade/` lists every chain with its id.

The site also draws the scenery the file asks for: the overhead line over a chain
with a `wireM`, smoke from every car's `emitters`, each chain at its `speedMps`
([../specs/2026-11-16-parade-scenery-catenary.md](../specs/2026-11-16-parade-scenery-catenary.md)).

## The list

`TRAIN_PARADE` in `generator/trainParade.ts`, edited by hand: 118 chains
today - 22 electric units, 16 electric and 12 diesel locomotives with their
trains (about a quarter of the locomotive chains freight), 8 diesel units, 14
steam engines with their tenders and trains, 8 trams, 3 metros, 9 buses, 4 trucks,
4 horse-drawn vehicles, 4 cable car lines (one per station type), 8 ships and 6
aircraft. The test pins that mix; change it there on purpose. A
train has an `id` (lower-case, digits, dashes; unique) and either:

- `cars`: its cars nose first, each `{ model, params?, turned? }` or
  `{ formation: { model, name } }` (a steam locomotive "with tender", then the coaches); or
- `formation: { model, name }`: one of that model's OpenTTD formations
  (`generator/openttdTable.ts`), which stands for its cars, turned ones included.

`resolveTrains` checks every car and fails the build on the first fault: the model
exists, is confirmed (`catalogModels.json`, not a workshop draft), is a road or
rail vehicle (a side-view category) or a ship, an aircraft or a cable car cabin
(`CRAFT_GROUNDS`: the parade's own permission, so the catalog's thumbnails stay as
they are), and every parameter value is one it offers.
Values equal to the default are dropped, so `{ livery: "red" }` and `{}` are one car.

The chain's **ground** follows its cars: all Road vehicles run on the road
(`road`), a ship on the water (`water`), an aircraft in the air (`air`), cabins on
a rope (`rope`), everything else on rails. A ship and an aircraft run alone, and
nothing else is coupled to one. A **cable car line** lists its one cabin and a
`rope`: the station type standing at both ends of the strip (`open_gantry`,
`alpine_chalet`, `glass_modern`, `concrete_drive`;
[../models/cable-car-stations.md](../models/cable-car-stations.md)). Its one car
is the cabin hung from that station type's rope head (its key ends
`--rope-<station>`). A client does not run the line across the strip like a train:
it hangs a circulating cabin (a gondola) every `rope.spacingM` (`ROPE_SPACING_M`,
40 m) along the whole rope and one jig-back cabin (an aerial tramway's, as the
game's lines run it) out on the line, already there as the scene fades in, runs
them for a while and fades them out.

## Categories and the play order

Every chain has a **category** (`TRAIN_CATEGORIES`): `electricUnit`, `dieselUnit`,
`electricLoco`, `dieselLoco`, `steamLoco` (a locomotive and its train), `metro`,
`tram`, `bus`, `truck`, `horse`, `cableCar`, `ship` and `aircraft`. `trainCategory`
derives it from the lead vehicle's catalog fields - the categories Ships, Aircraft
and Cable car are `ship`, `aircraft` and `cableCar`, traction `animal` is `horse`, a Road vehicle in group `truck` a
`truck`, any other Road vehicle `bus`, the groups
`tram` and `metro` themselves, a `unit` an electric or diesel unit by traction,
anything else a locomotive by traction - unless the list states one
(`category` on the train; an unknown one fails the build).

`playOrder` (`trainParade.ts`) makes one round: every chain once. Each category's
chains are shuffled and spread evenly over the round (the k-th of n gets the key
(k + offset) / n, one random offset per category; sorting by key interleaves them),
then a chain whose category repeats its predecessor's - or, first in a round, the
last chain played - is swapped with the nearest one that fits, ahead or, at the
end of the round, behind. With today's 118 chains (mix above) no two of one
category ever play in a row (tested over 2,000 rounds).

**The opening.** The first round a visitor sees opens as `PARADE_OPENING` says,
written into parade.json as `opening`: its first eight chains are, in order, an
electric locomotive and its train, a steam train, an electric unit, a diesel
locomotive and its train, a diesel unit, a cable car line, a ship and an aircraft -
each picked at random within its category - and no horse-drawn chain runs before
the tenth (`notBefore: { horse: 9 }`, an index). `playOrder` takes it as its fourth argument: the opening chains go
first, a held-back category is spread over the places from its index on and
never swapped to an earlier one, and the no-repeat rule still holds. Only the
first round passes it; every later round is the plain spread. The overview page's
Shuffle shows such a first round.

## Speed and the overhead wire

Every chain carries `speedMps`, from the fixed table `PARADE_SPEED_MPS` by
category (horse-drawn 6, tram 12, bus 13, truck 14, steam 16, diesel locomotive
17, metro 18, diesel unit and electric locomotive 20, electric unit 22, cable car
8 metres of model per second; ship 10, aircraft 24 on screen, below) - not the
vehicles' own top speeds: the strip is a few hundred pixels wide and every chain
must stay on screen long enough to be seen. A ship or an aircraft is drawn as large
as the strip allows (its own view, below), so its table speed is a rail chain's on
screen and its `speedMps` is that times its view's height over 6.3 m (`viewSpeed`):
the liner, in a 41 m window, runs at 65 m/s and crosses the strip as fast as a
train at 10.

`wireM` (`trainWire`) is the height of the wire the chain runs under, read from
its first powered car (the first that states a traction): an electric railway
vehicle runs under the game's contact wire (`RAIL_COLLECTOR_TOP`, 5.88 m), an
electric tram under its trolley wire (`TRAM_COLLECTOR_TOP`, 5.5 m,
`generator/collector.ts`), so the pantographs touch it. A metro (third rail), a
horse or cable tram, a diesel, a steam engine and every road vehicle have none,
and the field is absent.

## Exhausts

A car's `emitters` are its `smoke` mouths ([../models/emitters.md](../models/emitters.md))
placed on its image (`carEmitters`): `xM`, `yM` metres from the image's top-left
corner, in the section they stand in, turned with a turned car. Only a car whose
traction is `steam` (kind `steam`: the chimney) or `diesel` (kind `diesel`: its
exhausts) carries them - a caboose's stove pipe or an electric's does not smoke.
railisland.com puffs steam four times per turn of the driving wheels (`cycleM / 4`)
and gives a diesel a faint haze. A **ship's** funnels (its `smoke` mouths) smoke as
a diesel's exhausts do, and it carries two `wake` emitters on its waterline, one at
its bow and one at its stern, where the site draws the bow wave and the wake. The function is
self-contained: the overview page embeds its source, and railisland.com's
`TrainParade.astro` carries a copy - keep them in step.

## Views: ships, aircraft and cable cars

Every chain carries its **view** (`ParadeView`): pixels per metre and a height
window from `bottomM` to `bottomM + heightM` metres over its datum. A client fits
the window to its strip's height.

- **Trains, trams, road and horse-drawn chains** share one, `LAND_VIEW`, the side
  thumbnails' (below): 32 px per metre over -0.3 .. 6.0 m from the rail or road. One
  scale, so their lengths compare.
- **Each ship and each aircraft** is drawn as large as the strip allows
  (`fitView`), from its own bounds: a ship from its waterline - where the strip draws
  its ground, 0.3 / 6.3 of the window up - to its masthead just under the window's
  top; an aircraft (gear up) from its belly a third of the way up to its fin at 95 %.
  The H145 is as tall on screen as the A380, and lengths no longer compare.
- **A cable car line** is drawn at its stations' scale: from the station level (where
  the strip draws its ground) to the taller station's roof just under the top. Its
  cabin is drawn `CABIN_ZOOM` (1.5) times its size about its rope datum, so it still
  hangs from the rope but is not lost beside stations 18-25 m tall.

Every fitted image is `VIEW_PX` (202) pixels tall, as a rail image is, and every
view's longest section (`sectionMaxM`) is as many pixels as SECTION_MAX_M at 32 px
per metre, so the liner is drawn in two sections.

`paradeScenery.ts` moves each into the parade's frame (nose at +X, drawn on the
left):

- **a ship** (`craftTurn`): the game's catalog yaw, after which a ship or an
  aircraft faces -X (the game's forward), then half round. It stands on its
  waterline - `draftFrac` of the model's height over its keel (`waterline`) - and
  every pixel below the waterline row is cleared, so the site's water is there;
- **an aircraft**: turned the same way, with its retractable gear left out (the GLB
  node `gear`, which the game hides in flight: `withoutNode`). Its propellers or
  rotor turn on `time` clips (`propellers`, `rotor`; docs/models/animation.md):
  drawn as a sprite over one turn of the longest clip, its cycle in seconds
  (`cycleS`), not metres;
- **a cable car cabin** (`cabinHang`): the game's own frame for it
  (`cableCarLine.ts`: the catalog's yaw, recentred and scaled to studs, the rope
  datum at 0, the rope along +X) in metres, its rope datum at the station type's
  rope head (`ropeHeadM`), drawn `CABIN_ZOOM` times its size. The game draws a
  vehicle at `STUD_SCALE` (1.5) studs per model metre, so a stud is 1 / 1.5 m here.

**A cable car line's scenery** (`lineScenery`, `renderRope`) is the station set's
own drawing, as the line preview draws it (previews/cableCarLine.ts) but alone:
the station facing the line at the strip's **right** end (the cabins come out of
it) and the **left** end (they go into it), each with its footprint's slab and
everything below the station's level cut, and the **pylon** for the cabin's ropes,
its saddle at the rope head. All three are drawn in the line's view (fitted to its
stations, which set it before the cabin is drawn), framed on themselves, under one hash of the cabin's car hash and whether the line
circulates. The **ropes** to draw are the cabin's (`game.ropes`, one per height and
kind: the haul rope it hangs from, a track rope it runs on), as heights over the
station level (`ropeHeights`).

## The overview page

`writeParade` also writes `export/parade/index.html`, served at
`https://factory.railisland.com/parade/` (`paradePage.ts`): a standalone page, not
a route of the catalog app, with the data inlined. It lists every chain - its
number, its id (the value of railisland.com's `?parade=`), its category, length,
images, its ground, whether it is animated, a link that opens it alone on
its picture at 8 px per metre (another view at half its own pixels per metre: a
ship on its sea, an aircraft with no ground, a cable car line under its ropes,
past its pylons and between its two stations) (an animated car drawn into a canvas, still image and
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
draws it (a rail or road car; the other grounds in their view, above) with the thumbnails' side view (`renderSide`, the same rasterizer, framing and
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
is there with all its files is not built at all. A car off the ground adds its view
(and a cabin its station type and the station set's source) to the hash; a rail or
road car's is computed as before. The writer's text in the hash is `writeParade.ts`
and `paradeScenery.ts` together, so a change to either renders everything again. A cable car line's scenery is kept the same
way (`scenery` in the file). The deploy restores the last
export (its `actions/cache` step), so a deploy that changed no listed design
renders nothing (about 2 s; all the chains from cold take about 4 minutes). Files
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
| `version` | 3 (1 had one global `pxPerM`, `heightM`, `bottomM`: the rail's; 2 one per ground) |
| `fleet.types` | confirmed vehicles per kind, every kind present (above) |
| `fleet.variants` | all their variants (above) |
| `opening` | how the first round opens: `categories` (its first chains' categories, in order) and `notBefore` (category to the first index it may take) (above) |
| `trains[].id` | the train's id from the list |
| `trains[].ground` | `rail`, `road`, `water`, `air` or `rope`: the scenery a client draws |
| `trains[].view` | how its images are drawn: `pxPerM`, every image's height in metres (`heightM`) and its bottom edge relative to the chain's datum (`bottomM`) (above) |
| `trains[].category` | its category (above) |
| `trains[].speedMps` | how fast it runs, metres of the model per second (above) |
| `trains[].wireM` | the overhead wire's height over the rail, metres; absent for none (above) |
| `trains[].lengthM` | from the first car's nose to the last car's tail, metres |
| `trains[].cars[].model`, `.params`, `.turned` | the car: model id, non-default values, running backwards |
| `trains[].cars[].section` | for a car drawn in sections, which one (0 from its nose); absent otherwise. Each section is its own entry, placed like a car |
| `trains[].cars[].image` | its still image, relative to parade.json (`parade/img/...`) |
| `trains[].cars[].offsetM` | metres from the train's nose to the image's left edge |
| `trains[].cars[].widthM` | the image's width in metres: the car's length and the 0.3 m margins |
| `trains[].cars[].emitters` | a steam or diesel car's (or a ship's funnels') exhaust mouths on this image: `kind` (`steam`, `diesel`; `wake` at a ship's bow and stern on the waterline), `xM`, `yM` from its top-left corner, metres; absent for none |
| `trains[].cars[].sprite` | an animated car's moving part: `image` (the frames, relative to parade.json), `xM`, `yM` (its top-left corner from the still image's, metres), `widthM`, `heightM` (one frame), `pitchM` (from one frame's top to the next's, the gap included), `frames`, and either `cycleM` (metres travelled per loop) or `cycleS` (seconds per loop: an aircraft's propellers or rotor) |
| `trains[].rope` | a cable car line's scenery: `station` (its type), `spacingM` (a circulating line: metres between two cabins' noses; absent: one cabin), `ropes` (`kind` `haul` or `track`, `yM` over the station level), `right` and `left` (the station at each end: `image`, `widthM`, as high as the view), `pylon` (`image`, `widthM`, `spacingM` between two) |

Cars are laid end to end with couplers touching: each car's length is its built
extent along X, buffers and couplers included (a cable car line lists its one
cabin; the client repeats it every `rope.spacingM`). Neighbouring images overlap by the
two transparent margins. A client places a car at `offsetM * scale` and sizes it
`widthM * scale` by `heightM * scale` (its view's), one scale for every rail and road chain
of a ground so lengths compare, and its sprite at `xM * scale`, `yM * scale` inside it.

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
- Ships and aircraft are each fitted to the strip, so their lengths do not compare
  with each other's, and a cable car line's cabins are drawn 1.5 times their size
  beside their stations.
- The ropes are straight between the stations (no sag) and every pylon is drawn at
  the stations' rope height.
