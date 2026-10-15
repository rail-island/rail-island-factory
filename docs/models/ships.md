# Ships

**Covers** - the three procedural ships (a cruise ferry, a hydrofoil and a lake passenger ferry) that reproduce the webapp's hand-authored ship GLBs: their references, axes and datums, the station-and-band hull builder, budgets and deviations.
**Code** - `generator/ships.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`
**See also** - [reproductions.md](reproductions.md) (the reproduced reference models), [vehicles.md](vehicles.md) (the `sweep` primitive, parts), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [source-tree.md](source-tree.md), [export.md](export.md)

## The designs

| id | title | reference GLB | photos | size (L x H x B) | triangles |
|---|---|---|---|---|---|
| `veh-cruise-ferry` | Cruise Ferry | `cruise-ferry.glb` | `assets/cruise-ferry/` | 155.0 x 45.95 x 24.06 m | about 10,800 |
| `veh-hydrofoil-ferry` | Hydrofoil Ferry | `hydrofoil-ferry.glb` | `assets/hydrofoil-ferry/` | 34.5 x 8.63 x 7.8 m | about 1,700 |
| `veh-passenger-ferry` | Passenger Ferry | `passenger-ferry.glb` | `assets/passenger-ferry/` | 39.09 x 13.33 x 8.22 m | about 4,400 |

The reference GLBs live in the webapp's `db/ships/glb/`; each procedural design
stands in for the one of the same name, so the webapp's `db/ships/ships.meta.json`
entry (`yaw`, `targetLength`, `draftFrac`) keeps working unchanged. All three are
inside 2 % of their reference's bounding box on every axis and well under the
40,000-triangle family budget (`test/referenceModels.test.ts`).
`SHIP_CATALOG` holds the catalog fields they share (category `Ships`, group
`ship`, `defaultScale` 1, CC0 by Rail Island). **The ids are stored in saved
maps** - never rename one.

## Axes and datums

The axes, bow direction and waterline are the references', because the webapp's
meta entry was measured off them:

| design | length axis | bow | yaw in ships.meta.json | draftFrac | waterline | what sits there |
|---|---|---|---|---|---|---|
| cruise ferry | +X | +X | 180 | 0.17 | y 7.8 | the white boot-top line, y 7.6 - 8.1 |
| hydrofoil | +X | +X | 180 | 0.28 | y 2.4 | the top of the red bottom band; foils and struts below |
| passenger ferry | +Z | +Z | 270 | 0.15 | y 2.0 | the dark boot stripe, y 1.7 - 2.2 |

Every model stands on y = 0 (the cruise ferry's flat keel, the hydrofoil's stern
foil, the passenger ferry's keel bar) and is centred on its beam. The bow
fittings the meta notes use to read the yaw are where the notes say: the cruise
ferry's bulbous bow, windlass, foremast and anchor pockets forward (x 61 - 75),
its ensign staff aft (x -77); the hydrofoil's wheelhouse (x 4.45 - 9.9) and bow
foil (x 9.5 - 10.6) forward, the rudder (x -17.05) and propeller (x -15.85) aft;
the passenger ferry's windlass (z 14.6), bollards and bridge glass (z 5.15)
forward, rudder (z -16.5), propeller (z -15.6) and flag staff (z -18) aft.

## How a hull is built

`hullShell` draws a hull from cross-sections at stations along its length. Per
ship there are four functions of the station `s`: the plan half-breadth at the
deck, the keel height (which rises into a raked stem or a transom), the deck
(sheer) height, and the half-breadth at any height `y` (the section shape - a
round bilge midships, blending into a V at the bow). The section runs from the
keel to the deck edge and is cut at the **paint bands** (`HullBand`): each band
is a material with a top height that may follow the keel or the sheer, and
optional cuts inside it so a bilge reads round. Adjacent stations are joined
strip by strip, so every paint line is a real edge and no two materials ever
share a face. The shell also draws the bottom, the deck and the transom; a bow
whose half-breadth reaches zero closes itself. The hull's local frame
(length, height, beam) maps onto x or z (`ALONG_X`, `ALONG_Z`).

The triangles of one band on one side are a single `facets` call (one source
tree leaf) through `TriBatch`, which orients each triangle outward from the way
it was built and passes their average normal as the hint; a triangle that leans
too far from it gets its own call, so none is flipped.

Deckhouses are prisms over `planRing` plans: a half-width function along the
length (rounded ends from `roundEnd`, held inside the hull's deck edge), sampled
finely near the ends. Windows are flat panes 3 cm proud of their wall
(`paneRow`, `paneEnd`), one leaf per row and side. `spindle` makes bodies of
revolution (lifeboats, the bulbous bow, nacelles, liferafts) from chained
`sweep`s; `ball`, `bar` (a round bar between two points) and `railing` (top and
mid rails and posts along a polyline, optionally following the sheer) do the
rest.

## Cruise ferry

A Baltic cruise ferry in the Viking Line mould (the photo shows the Amorella):
a red hull over dark boot topping with a white waterline, a raked bow over a
bulbous forefoot, white superstructure decks with rows of windows (pitch 3.43 m,
1.6 x 1.44 m panes) and rounded aft ends, six lifeboats a side in davits on the
boat deck (y 23.4 - 26.4), the stepped forward block (decks at 29.4, 32.4, 35.4,
38.3 m, rounded fronts) with the bridge, its wings (half-breadth 11.25 m) and
the monkey island at 40 m, the raked radar mast to 45.95 m with the satcom dome
and scanners, the aft sun deck, and the raked funnel aft (x -27.1 to -17.5) in
the reference's green, white with a red diamond emblem, red and black, with two
exhaust pipes. Portholes run along the red at y 11.6; the forecastle carries the
windlass and rails.

The reference's datums are kept: boot topping below y 7.6 (the reference's dark
band ends at 6.4; the white boot-top line at 7.6 - 8.1 is taken from the photo
and puts the draftFrac waterline on it), sheer 13.35 m midships rising to 17.6
m at the stem, keel flat from x -58 to 38.

Deviations: no hull lettering (the photo's "VIKING LINE" is a trade mark); the
beam is 24.06 m against the reference's 24.4 (its widest point is a 0.2 m
rubbing rim this hull leaves out); lifeboat davits and rails are simplified.

## Hydrofoil ferry

A Soviet Kometa type hydrofoil: a narrow hull (half-breadth 2.62 m) with a long
pointed bow and a shallow-V bottom whose keel rises from y 1.65 to 3.55 at the
stem, white with a red bottom band (to y 2.4 or 0.8 m above the keel, whichever
is higher, so the band follows the rising forefoot as on the photo) and a red
sheer stripe (0.55 m); the white saloon (x -15.55 to 11.55, roof 6.65 m) with
its red roof and fifteen square windows a side, the wheelhouse forward with a
sloping roof, a raked dark windscreen and four side windows, the mast with yard
and radar to 8.63 m, and the blue foils: the bow foil (x 9.5 - 10.63) with a
dihedral to +-3.15 m on four struts, the stern foil (x -12.2 to -11.05) at
y 0 with tips to +-3.9 m on four struts, the propeller nacelle and shaft, a
three-bladed propeller and the rudder.

Deviation: the bow struts stand at +-0.75 / +-1.45 m to stay under the narrow
bow (the reference's sit wider and float outside it).

## Passenger ferry

A white lake motor ship, authored along +Z: a full hull with a flat floor and
round bilges (half-breadth 4.14 m, deck at 4.55 - 5.1 m), square stern with
rounded quarters, a pointed bow over a near-plumb stem, a dark boot stripe at
y 1.7 - 2.2 and a steel rubbing band under the gunwale; the glazed saloon
(z -15.5 to 11.9, glass 5.47 - 7.0 m with white mullions every 2 m, a tapered
glazed front, side doors and four lifebuoys), the railed upper deck on its roof
with benches, liferafts and the exhaust stack, the small glazed upper house
(z -6.97 to 5.15, roof 9.95 m) with the bridge windows and wings, and the mast
with its yard, radar bar and the green masthead ball topping out at 13.33 m.
Foredeck and afterdeck carry rails, the windlass, bollards and the flag staff;
the keel bar, skeg, rudder and four-bladed propeller sit under the stern.

Deviation: the boot stripe is drawn on the hull side as on the photo (the
reference keeps its stripe material inside the hull, invisible); fenders and the
stairs are left out.

## Checking a change

Run `pnpm exec vitest run test/referenceModels.test.ts test/models.test.ts -t ferry`
(size, budget, z-fighting) and `pnpm exec vitest run test/jsModel.test.ts -t ferry`,
then compare the thumbnail with the reference after `pnpm build:models`. A hull
change must keep each `draftFrac` waterline on its paint line (table above).
