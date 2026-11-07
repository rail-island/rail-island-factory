# World ships

**Covers** - the hull kit the 100 ships of the world fleet are built on: the spec record, the hull forms (bows, sterns, sections, sheer, raised decks, twin hulls, a lifted hydrofoil hull), the paint bands and the waterline, the deck furniture, the detail items and the sailing rigs, the distant model, budgets, axes and datums, game properties, OpenTTD cargo, sounds, references and checks. The designs themselves are listed in [world-ships-cargo.md](world-ships-cargo.md) and [world-ships-passenger.md](world-ships-passenger.md).
**Code** - `generator/hullKit.ts`, `generator/worldShips.ts`, `generator/worldShipsCargo.ts`, `generator/worldShipsService.ts`, `generator/worldShipsPassenger.ts`, `generator/worldShipsSmall.ts`, `test/worldShips.test.ts`, the ships' blocks of `generator/openttdTable.ts`, `generator/soundTable.ts`, `generator/worldFleet.ts`
**See also** - `.agents/skills/ship/SKILL.md` (the checklist), [ships.md](ships.md) (the three older ships and the station-and-band hull the kit copies), [world-fleet.md](world-fleet.md) (the harness), [game-properties.md](game-properties.md) (`draftFrac`), [sounds.md](sounds.md), [lod.md](lod.md), [../specs/2026-11-05-world-vehicle-fleet.md](../specs/2026-11-05-world-vehicle-fleet.md)

## The family

| module | kind | designs |
|---|---|---|
| `worldShipsCargo.ts` | container ships, tankers, gas and bulk carriers, ro-ro, heavy-lift, reefer and general cargo ships, river cargo | 30 |
| `worldShipsService.ts` | tugs and a towboat, fishing vessels, icebreakers and research ships, a dredger, offshore vessels, a cable layer, fire, rescue and pilot boats | 19 |
| `worldShipsPassenger.ts` | city and car ferries, fast craft, paddle steamers and river boats, coastal and cruise ships, liners | 32 |
| `worldShipsSmall.ts` | tall ships and schooners, traditional sailing craft, canal and river craft, yachts and runabouts | 19 |

Each module exports, per ship, a spec function (`tripleESpec(p?)`) and two named build
functions (`shipTripleE(p?)`, `shipTripleELod(p?)`): the JS model imports a design's
builders by name, and keeping each spec in its own function lets esbuild drop the others
from a model's bundle. The design lists are marked `/* @__PURE__ */` for the same reason,
and the family's catalog fields are written out in `worldShips.ts` rather than imported
from `ships.ts` (that import carried the whole older module into every bundle: a small
craft's JS outweighed its GLB). **The ids are stored in saved maps** - never rename one.

The three older ships (`ships.ts`) are untouched: the kit copies the helpers it needs
(`lerpTable`, `TriBatch`, `hullShell`, `planRing`, `roundEnd`, `spindle`) so their models
and JS files stay byte-identical.

## Axes and datums

As the cruise ferry's: metres, **+X towards the bow**, +Y up, +Z to starboard, centred on
the length and the beam, the keel on **y = 0**; catalog `yaw` 180. A spec is written in
metres **from the stern** (`u`; x = u - length / 2) and heights from the keel. The hull's
**waterline is y = draft**, the edge between the bottom paint and the boot-top band (a real
edge of the shell); `game.draftFrac` is the draft over the built model's highest point
(mast, funnel or crane top), measured off the model the first time the export asks
(`shipGame` in `worldShips.ts`), and again for each parameter value that changes the height
or the draft (a push barge light or loaded states its variant's `draftFrac`).
`test/worldShips.test.ts` checks that `draftFrac` times the height lands on the paint edge.

A hydrofoil's hull stands on its foils (`lift`: the keel at y = lift, the foils on y = 0,
the hullborne waterline still from y = 0); a hovercraft has no hull (`hull: null`) and floats
on its skirt with a nominal 0.3 m draft. A sailing yacht's fin keel is the same: the hull
lifted 1.4 m on its fin.

## The spec

`ShipSpec` holds the `kind` (cargo, passenger, service, small, sail), the `hull`
(`HullForm`, or null), a `livery` (colours by material role over the kit's defaults:
`bottom`, `boot`, `hull`, `stripe`, `deck`, `house`, `roof`, `funnel`, `steel`, `crane`,
`hatch`, `sail`, `spar`, the container colours `c0`..`c7`, ...; `glass` is the window
glass), the `items` on deck and `small` for the small-craft budget.

### The hull

`hullGeometry(form)` turns a few numbers into the four functions the shell is drawn from
(the plan half-breadth, the keel line, the deck line, the half-breadth at a height) and the
stations:

| field | what |
|---|---|
| `length`, `beam`, `depth`, `draft` | over the hull (spars aside), moulded beam, keel to deck edge midships, keel to waterline |
| `bow` | `raked` (a straight raked stem), `bulbous` (raked over a bulb, `bulb` its size), `ice` (a long sloping icebreaker stem), `barge` (a spoon bow: the bottom rising in a ramp to a flat end), `clipper` (a concave stem reaching forward), `canoe` (an upturned pointed end), `plumb` (an upright stem) |
| `stern` | `transom` (a flat stern over a raised counter), `cruiser` (rounded), `sternwheel` (a square flat end for a wheel or a barge), `canoe` (pointed, as a double-ended ferry or a longship) |
| `section` | `round` (a round bilge over a flat floor), `vee`, `flat` (a barge's box), `keel` (a sailing ship's wineglass) |
| `entry`, `run`, `transom`, `rake` | the taper of bow and stern as fractions of the length, the transom's width, the stem's rake (defaults by form) |
| `sheer`, `forecastle`, `poop` | the deck's rise at each end, raised decks (a ramp of 0.6 m at the break) |
| `boot`, `stripe` | the boot-top band above the waterline and a sheer stripe under the deck edge |
| `twin` | a catamaran's (or a crane vessel's pontoons') demihull beam; `beam` is then the overall |
| `screws`, `rudder` | propellers and the rudder under the stern (ships default to one screw) |
| `lift` | a hydrofoil's or fin-keel yacht's hull raised on its foils |
| `fine` | twice the stations along the hull: a smoother entry, run and flare (the detailed ships) |

The section blends from the midship shape to a V towards a pointed end. The paint bands
are `bottom` (keel to draft), `boot`, `hull`, `stripe`; the deck is drawn in `deck`.

### The deck furniture (`Item`)

| item | what |
|---|---|
| `tier` | a deck of superstructure over a plan ring: fixed half-width or the hull's less an inset, rounded ends, a tapering front, rows of windows, bridge windows across a square front, bridge wings |
| `box`, `cyl`, `rod`, `plate` | generic blocks, posts, bars and flat plates (rudders, fins, push knees, leeboards, a ferro) |
| `funnel` | an oval or round funnel lofted through its colour bands, raked, smoke on its mouth |
| `mast` | a signal mast with yards and a radar bar |
| `crane`, `derrick` | a pedestal crane with its jib; a kingpost (or pair) with its boom |
| `hatches`, `containers` | hatch covers; container stacks as blocks a few rows wide per bay, their heights and colours from a fixed seed, narrowing with the hull |
| `domes`, `spheres`, `tanks`, `pipes` | tank domes, Moss LNG spheres on their skirts (a dome too: Icon's AquaDome, a radome), cylindrical gas tanks, deck piping |
| `helideck`, `gantry`, `boom`, `boats` | a helideck with its H, a portal or A-frame, an unloading boom or drag arm, lifeboats and tenders |
| `canopy`, `rail`, `portholes` | an arched roof (thatch, awnings), railings, a row of round lights in the hull |
| `paddle` | side paddle wheels with their boxes, or a stern wheel; each wheel is a part turned by the ship's `rolling` clip ([animation.md](animation.md#rolling-wheels)); opt-in for side wheels: `casing` (a closed paddle box: flat outer face at `out`, end walls and top, its foot over the water, an optional `fan` half disc at `fanAt` and round `lights` on its face) and `sponson` (deck guards flush with the main deck fore and aft of the casing, tapering to the hull, with a rubbing strake `edge`); the distant model then draws the casings |
| `foil`, `skirt`, `prop` | hydrofoils on struts, a hovercraft's skirt, air propellers on pylons |
| `rig` | masts with their sails, a bowsprit and stays |
| `bulwark` | a solid bulwark following the deck edge on both sides, from u0 to u1 |
| `anchors` | the anchor pocket and the anchor laid on the hull each side, as decals |
| `mooring` | bollard pairs each side at each station, with windlass drums when `winch` |
| `catwalk` | a raised walkway on posts with its handrails |
| `vents` | vent risers, mushroom vents, or cowl ventilators facing forward (`cowl`), on the deck or at `y` |
| `freefall` | a freefall lifeboat tilted aft down its launch ramp |
| `lashing` | container lashing bridges across the bay gaps |
| `marks` | draft marks (a tick a metre) and the bow thruster's sign (or with `eye`, a painted eye) on the hull, as decals |
| `fender` | a rubber fender band outside the hull, from u0 to u1 between two heights |
| `edgeRail` | a railing (posts, top and middle rails) following the deck's edge from u0 to u1 |
| `hullLine` | a line decal along a polyline on the hull's sides: a bow visor's seam |
| `strakes` | thin lines along the hull at given heights: plank seams, painted bands |

Some items take detail options: a `tier`'s `lip` (the deck above overhanging the walls, its
underside closed), a window row's `mat` (vent grilles, a painted line), `hatches`'
`coaming`, `ridge`, `ribs` and `ribMat`, a `paddle`'s painted `rays` on its boxes, `spheres`' `cap` (a tank cover's dome as a spherical cap of that height) and `ring` (a closed, railed walkway that wide round the equator on a skirt to the deck), and `containers`' `rows` (one stack per row of boxes, the
lower and upper boxes in two colours).

Shared shapes are in `worldShips.ts`: `oceanHull`, `deckhouse` (an accommodation stack
with its wheelhouse and wings), `aftHouse` (that, its funnel, mast and lifeboats),
`funnel`, `mast`, `lifeboats`, `exhausts`, `fittings`, `bayGaps`, `detailed`,
`passengerFittings`, `liferafts`, and the `load`, `livery`
and `colour` parameters.

### Detail

All 100 ships are detailed (in four batches of the list's order). Beyond their hull and
blocks they carry:

- **the hull**: `fine` stations; `fittings()` gives the forecastle's bulwark, the anchors, the
  windlasses and bollards forward, mooring winches aft, the railing along the main deck's
  edge (`edgeRail`, its span `rail` or none where a bulwark or crash rail runs), the draft
  marks and the bow thruster sign;
- **the house**: `deckhouse`'s and `aftHouse`'s `detail` - a deck edge on every deck, windows
  on the front of every deck and all round the wheelhouse; `aftHouse` adds exhaust pipes in the
  funnel's mouth and, with `freefall`, the freefall lifeboat over the stern and a rescue boat;
- **the cargo gear of the type**: container stacks by rows with lashing bridges, hatch covers
  on coamings; the tanker deck (cargo lines on supports, fire main, catwalk on posts, manifold
  crossovers, hose cranes, tank hatches, vent risers); the gas carriers' domes, walkways and
  vent masts; the bulkers' ridged and ribbed covers and hold vents; the old cargo ships' cowl
  ventilators, mast houses and well-deck bulwarks; the tugs' fenders and towing gear, the
  fishing gear, the research and offshore ships' deck equipment;
- **the cruise ships and liners**: balcony glass along the cabin decks, davits, portholes in
  rows, funnel guys and cowl ventilators (Olympic), radomes; the tall ships' shrouds
  (`shrouds()` in `worldShipsSmall.ts`), bulwarks, boats, wheels and anchors;
- **the passenger ships**: `detailed()` (deck edges, front windows) and `passengerFittings()`
  (rubbing fender, anchors, bollards, draft marks), railings round the open decks, liferafts
  (`liferafts()`), lifeboats, exhausts and radomes;
- **the small craft** (4,000 triangles): plank seams (`strakes`), gunwales, rudders and tillers,
  the deck clutter of their trade, a painted eye (`marks` with `eye`), the running rigging that
  reads (sprit, vangs, sheets).

A new ship is brought to the same level (the `ship` skill, `.agents/skills/ship/`, is the
checklist); `test/worldShips.test.ts` checks each batch's detail and share of its budget.

### Sails

A `Mast` carries its `sails`, each a double-sided face of the `sail` colour (so either
side shows): `square` (bellied, on its yard), `gaff`, `bermuda`, `sprit`, `jib` (from a
tack on the bow or bowsprit to the mast), `lateen` and `crabclaw` (on their long yards),
`junk` (battened panels fanning aft). The stays run from each masthead to the next mast
forward, the foremost to the bow or bowsprit, and shrouds to the sides. A square sail's
optional `off` sets its plane ahead of the mast's axis (default the mast's radius + 0.15):
a ship that draws its own stepped mast over a thin kit core (the Cutty Sark) hangs each
sail just ahead of the section it covers. A `bulwark`'s optional `inner` and `cap` colour
its inner face and its top (default its `mat`): white inside, a teak cap rail.

## The distant model

`shipLod(spec)` (budget 100, `lod.ts`): the hull as plan rings at the keel, the waterline
and the deck in the bottom and hull colours (one stack per demihull), then the largest
furniture blocks that fit: a stack of tiers as one block, each Moss tank a square frustum,
masts as bars, a mast's square sails as one face, fore-and-aft sails as triangles; hatch
covers under containers are left out. Each part is drawn a few centimetres in from its
neighbours' planes, so no two coplanar faces fight.

## Budgets

| ship | triangles | reached |
|---|---|---|
| ocean ships over 150 m | 25,000 | 3,900 (PCTC) to 19,400 (MSC Gulsun) |
| ships up to 150 m | 15,000 | 2,600 (SR.N4) to 9,800 (Hurtigruten) |
| small craft (`small`) | 4,000 | 1,100 (gondola) to 3,900 (junk) |
| distant model | 100 | 30 to 99 |

`shipBudget(spec)` gives the budget; the suite checks every sampled parameter combination.

## Game properties, OpenTTD and sounds

- **`game`**: displacement (t), installed power (kW), service speed (km/h) from the
  published figures in each `SOURCES.md`; `accel` null (the game derives it from power
  and weight); `draftFrac` measured. A sailing ship or a barge without an engine states
  power 0 and `accel` `UNPOWERED_ACCEL` (0.3 m/s2) instead, since the game would derive
  zero from no power and the ship would never get under way.
- **OpenTTD**: container ships, feeders, ro-ro and car carriers carry `GOOD` (TEU or units
  as crates; no default climate has `VEHI`), tankers and gas carriers `OIL_` (liquid; the
  chemical tanker hazardous too), bulkers `COAL`, `IORE` or `GRAI` with the bulk refit, the
  reefer `FOOD`, fishing vessels their catch as `FOOD`, every passenger ship `PASS`;
  capacities over 65,535 are capped at the GRF's word. Presets: each design's default and
  its interesting liveries or loads.
- **Sounds**: a ship's horn is derived from its hull length; the steamships (Liberty,
  Victory, Ideal X, Seawise Giant, the Moss carrier, the Laker, the liners, SS Great Britain,
  the paddle steamers and the sternwheeler) state a steam whistle in `soundTable.ts`. The
  sailing ships and rowed craft keep the derived horn as a foghorn: rail-island-music has no
  ship's bell (a request to that repository).

## References

Each ship has `assets/ship-<name>/` (the id without `veh-`) with one or two Commons
photographs fetched by `pnpm refs:fetch` and a `## Published figures` section; figures
read off photographs are marked approx.

## Checking a change

- `pnpm exec vitest run test/worldShips.test.ts` - size, keel, waterline on its paint edge,
  budgets, LOD budget and flicker, cargo per type, load and livery parameters (about 10 s).
- `pnpm exec vitest run test/worldFleet.test.ts` - registry, references, OpenTTD ids.
- `pnpm exec vitest run catalog -t "proc-vehicle-ship-"` - the covering sample's full sweep.
- A kit change moves every ship's bytes: render the contact sheets
  (`generator/contactSheet.ts --view 3q`) and compare.
