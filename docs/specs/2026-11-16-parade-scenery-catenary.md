# Parade scenery, catenary and a hundred chains

Status: agreed
Date: 2026-11-16
Area: rail-island-factory (parade list, parade.json, overview page); web-railisland-com (`TrainParade.astro` in the hero)

## Context of the change

railisland.com's hero has a thin track between the play button row and the island
strip (`src/components/TrainParade.astro` in web-railisland-com). One vehicle chain
at a time runs across it from right to left. The factory owns the chains: the
hand-written list `TRAIN_PARADE` in `generator/trainParade.ts`, rendered at build by
`generator/writeParade.ts` into lossless WebP side views and published as
`https://factory.railisland.com/parade.json` (docs/site/train-parade.md). The site
reads that file in the browser after load, scales every car by one factor (strip
height / `heightM` 6.3 m) and moves the train with a CSS transform; animated cars
(steam gear, spoked wheels, horse legs) are drawn into one canvas each.

What exists today and what it lacks:

- **No background.** The strip is transparent over the hero's dark ocean gradient
  (`from-ocean via-ocean-deep to-ocean-abyss`). The only ground is a 1 px
  `bg-cream/25` rail line (or a 3 px road edge that cross-fades in for road
  chains). Dark liveries - black steam engines, dark green coaches, navy units -
  sink into the background, and the strip reads as a loose line rather than a
  designed part of the page. It is 56 px tall (72 px from `sm`), about 9-11 px
  per metre.
- **No overhead line.** Electric units and locomotives run with raised
  pantographs under nothing. The factory already knows the wire heights:
  `RAIL_COLLECTOR_TOP` 5.88 m and `TRAM_COLLECTOR_TOP` 5.5 m
  (`generator/collector.ts`), used by the catalog's own scenery (`sceneryOf` in
  `generator/catalog.ts`: rail electric -> wire, tram -> tram wire, metro and
  others -> none). parade.json does not carry it.
- **Thirty chains.** Eight electric units, six steam trains, four trams, three
  buses, three horse-drawn, two electric locomotives, two metros, one diesel unit,
  one diesel locomotive. The confirmed catalog offers far more: 68 electric units,
  45 electric and 34 diesel and 31 steam locomotives, 20 diesel units, 28 buses,
  15 electric trams, 4 metros, 6 trucks, 25 coaches and 20 wagons to compose
  trains from, and the animal-drawn vehicles.

Nothing in either repository stores user data for the parade; parade.json is a
generated public contract, rebuilt on every factory deploy.

## User request

> Improve parade. Make some background, so that trains will be better visible
> (make the strip so that it looks nice on page). In case of electric trains,
> fade in catenary. Make collection of chains = 100. Suggest next improvements to
> make it yet better, but keep it performant.

## Decisions

### What background should the parade strip get, so dark trains stand out and it looks designed on the dark-blue hero?
| Option | What it means |
|---|---|
| Soft landscape band | Full-width band: pale dusk sky gradient behind the trains, a faint distant hill/town silhouette, a light ballast/grass ground line, edges fading into the ocean hero. CSS/inline SVG, no images. |
| Light lane panel | A rounded, lighter translucent panel with a clear ballast and rail. Cheap, plainer. |
| Scenery per category | Landscape band whose backdrop changes with the chain (city for trams/metros/buses, hills for steam), cross-faded between trains. |
| Under-glow only | Keep transparency, add a soft halo behind the trains and a stronger rail. |

**Answer: Soft landscape band.**

### Should the strip be taller, so trains are bigger than ~9-11 px per metre today (56 px / 72 px)?
| Option | What it means |
|---|---|
| Somewhat taller | ~80 px on phones, 104-112 px from `sm`, with headroom for catenary and sky. |
| Keep current height | Background only; trains stay the same size. Smallest change to the hero. |
| Much taller | ~140 px+ on desktop; trains become a feature of the hero, island strip moves lower. |

**Answer: Keep current height.** The band, sky and catenary have to fit the
existing 56 px / 72 px strip; the trains keep their size.

### How should the catenary look when an electric chain passes?
| Option | What it means |
|---|---|
| Wire + masts, overlay above | Contact wire at 5.88 m (tram 5.5 m), a thin messenger wire with droppers and evenly spaced masts that draw a little above the strip as a non-layout overlay (no CLS). Masts stand still as the train passes. |
| Contact wire + masts, inside strip | Contact wire and short mast tops inside today's strip box only; no messenger wire. |
| Contact wire only | One thin line at wire height that fades in. |

**Answer: Wire + masts, overlay above.**

### Which chains get the wire, and how is it decided?
| Option | What it means |
|---|---|
| Factory flag from sceneryOf | parade.json gains a per-chain wire height from the lead powered vehicle's catalog scenery: electric rail 5.88 m, electric tram 5.5 m, everything else none. The site draws what the file says; older site builds ignore the field. |
| Site derives from category | No contract change; the site draws a wire for the electric categories. Duplicates the factory's knowledge, wrong for exceptions. |

**Answer: Factory flag from sceneryOf.**

### How should the 100 chains be split between kinds of vehicle?
| Option | What it means |
|---|---|
| Balanced by catalog | electricUnit 22, electricLoco 16, dieselLoco 12, dieselUnit 8, steamLoco 14, tram 8, metro 3, bus 9, horse 4, truck 4. Follows the catalog, still spreads well. |
| Trains-heavy | ~85 rail chains, ~15 road and horse-drawn. |
| Even per category | ~10 per category; thin categories repeat with livery variants. |

**Answer: Balanced by catalog.** The numbers are a target for the hand-written
list, not a rule the build enforces.

### Trucks are not in the parade today (6 confirmed, plus trailers). Add a 'truck' category on the road?
| Option | What it means |
|---|---|
| Yes, add truck category | New category `truck` (lead is a Road vehicle in group `truck`), runs on the road; articulated trucks with their trailers. |
| No, passenger road only | Road chains stay buses and horse-drawn coaches. |

**Answer: Yes, add truck category.**

### Do freight trains count, or mostly passenger?
| Option | What it means |
|---|---|
| Mix, about 1/4 freight | Locomotive chains split passenger/freight; uses the wagon models. |
| Mostly passenger | Freight only where iconic. |

**Answer: Mix, about 1/4 freight.**

### Which liveliness improvements should be part of this change? (multi-select)
| Option | What it means |
|---|---|
| Speed per category | Horse ~6 m/s, trams and buses ~12, steam and freight ~18, units ~22, high-speed ~30, from the game's maxspeed, capped. Factory adds speed to parade.json. |
| Parallax background | Hills/town silhouette in two layers drifting slowly in the train's direction (GPU transform); paused when hidden or offscreen. |
| Steam & diesel exhaust | A few CSS-animated puffs from the chimney/exhaust; factory sends the point. Off under reduced motion. |
| Tunnel portals | Train comes out of a portal on the right and enters one on the left on wide screens. Static SVG. |

**Answer: all four - Speed per category, Parallax background, Steam & diesel
exhaust, Tunnel portals.** The exhaust points already exist in the factory: every
steam chimney and diesel exhaust records an emitter (docs/models/emitters.md).

### Which interaction / performance improvements should be part of this change? (multi-select)
| Option | What it means |
|---|---|
| Pause offscreen | IntersectionObserver stops the loop and image loading when the hero is scrolled away. |
| Name on hover/tap | Hover/tap shows the chain's name and links to the model on factory.railisland.com. |
| Preload next chain | Decode the next chain's images during the current run. |
| Day/dusk tint | Sky band tint follows the visitor's local time. |

**Answer: Pause offscreen** only. The other three are deferred.

### Where should each chain's running speed come from?
| Option | What it means |
|---|---|
| Game maxspeed, scaled + clamped | speedMps per chain from the slowest powered vehicle's game maxspeed times one factor, clamped to ~6-30 m/s. |
| Fixed per category | A small table per category (horse 6, tram/bus 12, steam 18, units 22, ...). Predictable; all chains of one category run alike. |
| Site-side table | Same table, but on the site, with no contract change. |

**Answer: Fixed per category.** Read against the third option, the table lives in
the factory and reaches the site as each chain's speed in parade.json.

### Tunnel portals: how should they behave on narrow screens (phones), where the strip is ~360-430 px wide?
| Option | What it means |
|---|---|
| Only from sm up | Portals from 640 px; phones keep a soft fade at both edges. |
| Everywhere, smaller on phones | Same look everywhere, narrower portals on phones. |
| One portal (right) only | Out of a tunnel on the right, off into the fading landscape on the left. |

**Answer: Only from sm up.**

### What should the distant scenery show in the parallax band?
| Option | What it means |
|---|---|
| Mixed island landscape | One long seamless strip of hills, trees and a small town/church silhouette, in the site's palette, low contrast; one inline SVG per layer, repeated. |
| Hills only | Rolling hills and trees, no buildings. |
| Island + sea | Hills with a strip of sea and distant islands on the horizon. |

**Answer: Mixed island landscape.**

## High-level plan

**1. The contract (factory).** parade.json stays `version: 1` and only gains
fields, so a site build older than this change keeps working:

- each chain's **wire height** in metres above the rail, present only when it runs
  under a wire: 5.88 m for an electric rail vehicle, 5.5 m for an electric tram,
  taken from the catalog's scenery of the lead powered vehicle (horse and cable
  trams, metros, diesel, steam, road: no wire);
- each chain's **speed** in metres of model per second, from a fixed table per
  category in the factory;
- each car's **emitters** that the side view shows (steam chimneys, diesel
  exhausts): kind and position in metres within the car's image, as the sprite's
  position is given; a turned car's emitter is where its turned image puts it;
- a new category **`truck`** (lead vehicle: a Road vehicle in group `truck`),
  running on the road, with its own entry in the speed table. The play order
  needs no change: it is category-agnostic.

**2. A hundred chains (factory).** `TRAIN_PARADE` grows from 30 to 100 by hand,
aiming at electricUnit 22, electricLoco 16, dieselLoco 12, dieselUnit 8,
steamLoco 14, tram 8, metro 3, bus 9, horse 4, truck 4, with about a quarter of
the locomotive chains freight. Every chain still passes `resolveTrains` (confirmed
models, valid values), the play-order test is re-run for the new mix (no two of
one category in a row over many rounds), the overview page lists all hundred, and
the parade documentation is updated. Depends on 1 only for trucks.

**3. The band (site).** The track keeps its height (56 px, 72 px from `sm`) and
becomes a soft landscape band: a pale dusk sky gradient behind the trains, two
parallax layers of a mixed island landscape (hills, trees, a small town and
church silhouette) in the site's palette at low contrast, a light ballast and
grass ground line under the rail or road, and edges that fade into the hero's
ocean gradient. Everything is CSS and inline SVG; no image request. From `sm` up a
tunnel portal stands at each end and draws over the train, so chains come out of
the right one and disappear into the left one; phones keep the soft edge fade.
The parallax layers drift slowly and continuously, independent of the train.

**4. The catenary (site).** When a chain with a wire height is next, the
overhead line fades in during the pause before it enters, and fades out after it
has left, like the road edge today. It is a contact wire at the given height, a
thin messenger wire with droppers and masts at a fixed spacing, standing still
while the train passes. The part above the strip box is an absolutely positioned
overlay that takes no layout space, so the page does not move.

**5. Motion details (site).** Each chain runs at its own speed (the factory's,
falling back to today's 22 m/s for an old file). Steam locomotives puff from
their emitters - in step with the distance travelled, so beats follow the wheels -
and diesels give a faint haze; puffs come from a small recycled pool of elements,
and none appear under `prefers-reduced-motion`. An IntersectionObserver stops
the animation loop, the parallax and any new image loading while the strip is
off screen, as the hidden tab already does.

Phases 1 and 2 ship with a factory deploy; the site's phases 3-5 work against
both the old and the new parade.json, so the two repositories can deploy in
either order.

## Database and persistent storage

Nothing new is stored. parade.json and its images are generated public files,
rebuilt on every factory deploy; the changes to them are additive fields
described in the plan. No browser storage is added.

## Architecture decisions

- **The factory says what runs under a wire, how fast, and where it smokes.** The
  catalog already owns wire heights (`generator/collector.ts`, `sceneryOf`) and
  emitters (docs/models/emitters.md); copying that knowledge into the site would
  go wrong for the first exception (a horse tram is in group `tram`, a metro is
  electric but has no overhead wire). The site only draws what the file says.
- **The scenery is drawn on the site, not rendered by the factory.** It is
  decoration of the page, in the page's palette and responsive to its width; as
  inline SVG it costs no request and never delays the hero's LCP picture.
- **Height stays fixed.** The band, the wire and the portals fit the existing
  strip box (the overhead parts as a non-layout overlay), so the hero's layout
  and the island strip below do not move and CLS stays zero.
- **Additive contract, version 1.** No site build breaks when the factory
  deploys first, and no factory build is needed for the site's band to ship.
- **The list stays hand-written.** A hundred chains are composed by hand, as the
  thirty were, rather than generated from the catalog: composition (which coaches
  behind which locomotive, freight versus passenger) is the point of the parade.

## Weaknesses and risks

- **Legibility at 9-11 px per metre.** With the height kept, a masted catenary,
  messenger wire and droppers are a few pixels each; they can turn into noise.
  Mitigation: draw them at device pixels, low contrast, and drop the droppers on
  phones if they alias. Medium likelihood, cheap to tune.
- **Parallax against still masts.** Background layers that drift while the masts
  and portals stand still read as drifting haze rather than a camera pan. Open
  question for implementation: if it looks wrong, drift only the farthest layer
  or tie the drift to nothing but time at a very low rate.
- **Contrast both ways.** A pale sky helps dark liveries but white and silver
  trains (Shinkansen, ICE) lose their outline. Mitigation: a mid-tone dusk sky,
  not white, checked against the darkest and the lightest chains.
- **Cold build time.** Rendering 100 chains from cold is roughly 3x today's 80 s.
  The deploy's export cache keeps normal deploys near 2 s; only a renderer
  change pays it.
- **Emitters on composite cars.** A car drawn in sections or turned must carry
  its emitter into the right section and side; a test should pin one turned and
  one sectioned case.
- **Category mix vs the play order.** With 22 electric units out of 100 the
  "never two of one category in a row" property must still hold; it is re-tested
  with the new list (2,000 rounds today).
- **Exhaust DOM churn.** Puffs must come from a fixed pool (about a dozen) and
  stop when off screen; otherwise long sessions leak elements or drop frames on
  low-end phones.

## Out of scope

- A taller strip (decided against: keep current height).
- Showing a chain's name on hover or tap, with a link to the factory.
- Preloading the next chain's images during the current run.
- A day/dusk/night tint following local time, and lit windows.
- Scenery that changes per category.
- Speeds derived from each vehicle's game maxspeed.
- Any change to the game or to what it reads from the factory.
