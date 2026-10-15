# Village houses

**Covers** - the five parametric village houses: the Kenney style they follow, the plan families and their parameters, the house builder (volumes, roofs, openings, details), the finish parameters, the mirror, dimensions and budget, the catalog fields and the tests.
**Code** - `generator/village.ts`, `generator/design.ts` (`finishParams`, `coverageCombinations`), `generator/generate.ts`, `generator/catalog.ts` (`VILLAGE_META_FILE`), `test/village.test.ts`, `test/params.test.ts`
**See also** - [parameters.md](parameters.md), [skyscrapers.md](skyscrapers.md), [export.md](export.md), [source-tree.md](source-tree.md)

## The style

The webapp's village pool is 21 Kenney suburban houses (`village-building-type-a`
to `-u` in its `db/buildings`): about 1,200 triangles each, one texture atlas,
and a consistent look -

- off-white walls on a **dark plinth** with a bevelled top edge, a **dark band**
  between the storeys, chamfered wall corners;
- chunky **rounded dark window frames** with light blue glass and a mullion;
- thick **overhanging roofs**, mostly green, gabled or hipped, often over an
  L-shaped or stepped plan; small round **chimney pots**;
- **orange planters** with round bushes, porches on thin posts, the odd solar
  panel, and a few flat-roofed modern houses with dark cladding.

The factory's houses are not copies of those models. They are five plan families
drawn with that vocabulary, each with enum parameters, so five ids stand for
3,640 variants. They are modelled in metres and use more of the budget
(1,400 to 5,600 triangles a variant) on gutters, transoms, door panels, wall
lamps, shutters, flower boxes and battens.

## The designs

Every design has a `roof` colour and a `walls` colour parameter (the modern house
has `cladding` instead of `roof`), listed in the table as *finish*.

| id | plan | shape parameters (default first) | variants |
|---|---|---|---|
| `village-cottage` | one block, 9 x 7 m | `storeys` two/one, `roofShape` gable/hip, `entrance` canopy/step/porch/garden, `chimney` brick/none, `dormers` none/dormers | 64 x 25 = 1,600 |
| `village-l-house` | 10 x 7 m block and a 4.6 m gabled wing reaching 3 m forward | `storeys` two/one, `roofShape` gable/hip, `side` left/right, `extras` planters/none/solar | 24 x 25 = 600 |
| `village-family-house` | square two-storey block and a one-storey annex | `roofShape` gable/hip, `annex` garage/terrace/wing, `side` right/left, `chimney` brick/none | 24 x 25 = 600 |
| `village-modern-house` | flat roof, clad upper storey cantilevered over the front on two columns | `storeys` two/one, `annex` carport/none/wing, `solar` none/panels | 12 x 20 = 240 |
| `village-narrow-house` | 6.2 x 8.5 m, steep gable to the street | `storeys` two/three, `entrance` porch/step/canopy, `balcony` none/balcony, `shutters` shutters/none | 24 x 25 = 600 |

The finish values: `roof` green (Kenney's), red, brown, slate, blue; `walls`
white, cream, ochre, rose, sage; `cladding` anthracite, timber, sand, teal.
Shutters take the roof's colour. The ids, the parameter names and their values
are contract (saved maps store them), like every model id.

Some options interact by design: a one-storey cottage or L-house gets a 0.4 m
knee wall so the eaves clear the window heads; a hipped cottage takes one centred
dormer instead of two, because its front slope narrows toward the ridge; the
L-house's solar array shrinks on a hipped roof for the same reason; garden and
planter variants add flower boxes under the upper windows.

## The house builder

`village.ts` wraps the `MeshBuilder` in a small `House` class. A design lists
**volumes** (`Volume`: a box from the plinth to its eaves, a roof kind - gable,
hip, flat or none - a ridge axis and a pitch, floor-band heights) and places
openings and details on **faces** (`Face`: an axis-aligned wall plane, a facing
and the coordinate along it).

- `walls(vol)` - plinth (a prism and a bevelled loft), the open-topped wall
  prism over a chamfered rectangle, floor bands with an underside.
- `roof(vol)` - a gable roof is two thick slabs whose top surfaces meet on the
  ridge, plus pentagon gable walls that follow the chamfered corners; a hip roof
  is four slabs meeting on the hips. Both overhang 0.45 m and get gutters
  under the eaves. A flat roof is a slab with a parapet, any side of which can
  be left `open` (the terrace annex has no parapet against the house wall,
  where its door is).
- `window`, `roundWindow`, `door`, `garageDoor` - every opening is a stack of
  `panel`s, flat outlines pushed out of the face: frame, glass, mullion and
  transom, sill; doors add panels, a knob, a doorstep and a wall lamp.
- details: `chimney`, `planter` and `bush`, `drainpipe`, `canopy` (a shed roof on
  brackets, or on posts with a deck for a porch), `dormer`, `solar` (panels laid
  in the plane of a gable or hip slope), `railing`, `battens`.

**The mirror.** A `side` parameter mirrors the whole house in x: the `House`
negates x on every point and re-winds every ring, and `slab` orients its faces
itself, so a design draws its plan once.

**Flicker.** The houses follow the skyscrapers' rule that one part owns each
surface ([skyscrapers.md](skyscrapers.md), "Flicker"): a door leaf starts 2 cm
above its frame's bottom, mullion bars stop 2 cm short of the glass edge,
flower boxes sit 2 cm deeper into the wall than the sills, gutters stop 5 cm
short of the roof ends, and the modern entrance block's back face sits inside
the wall rather than on the parapet's.

## Finish parameters

A design's `finishParams` (`design.ts`) names the parameters that only recolour
it. They are real parameters - in the meta entry, the JS model and the site's
picker like any other - but they change no vertex, so the tests do not multiply
the shape combinations by them: `coverageCombinations(params, finishParams)`
returns every shape combination at the default finish, then each other finish
value on the default shape. For the five houses that is 187 builds instead of
3,640. `test/village.test.ts` checks the claim: every finish value leaves every
material's vertices where they were and changes at least one colour.

## Size and catalog

Modelled in metres, base at y = 0, the street front facing +z; with plinth,
porch and annex the footprints run from about 7.4 x 8.4 m to 15.8 x 10.9 m, and
the tops from 4.3 m (the one-storey modern house's parapet) to 13.7 m (the
three-storey narrow house's chimney). `VILLAGE_CATALOG` gives every house category `Village`, group
`village` (the webapp's village pool), `defaultScale` 1.88 - the game's studs
per metre, which the webapp's own metre-modelled buildings use - and the Rail
Island attribution. The houses are written to their own
`export/village.meta.json` in the `buildings` shape ([export.md](export.md)).

## Tests

`test/village.test.ts`: the five ids and their catalog fields, at least 2,000
variants in all, every shape combination standing on y = 0 at house size and
under 10,000 triangles, the finish parameters recolouring without moving a
vertex, the side parameter mirroring the L-house and the family house, and the
shape options reaching the geometry. `test/params.test.ts` builds every
coverage combination for determinism and flicker and compares the JS model's
triangles with the generator's; `test/export.test.ts` checks
`village.meta.json`.

## Adding a variant or a design

Add a value to a parameter (never rename one) or a function and an entry to
`VILLAGE_HOUSES`, keep every primitive in a named scope, run `pnpm test` and
look at the thumbnail after `pnpm build:models`. A new colour-only parameter
belongs in `VILLAGE_FINISH_PARAMS`, and only if it moves nothing.
