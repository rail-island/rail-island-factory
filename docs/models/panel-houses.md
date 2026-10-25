# Panel houses

**Covers** - the prefabricated panel houses of a Czech housing estate (sidliste): the slab and
the point tower block, their plan, facade, balcony and roof variants, colours, party walls, city
use, the `panel_estate` block type, the low level of detail, budgets and tests.
**Code** - `generator/panelHouses.ts`, `generator/previews/blocksPanel.ts`,
`generator/cityVariants.ts` (`panel`), `generator/sets/blockType.ts` (`panel_estate`),
`test/panelHouses.test.ts`, `assets/panel-houses/`
**See also** - [commercial.md](commercial.md), [game-properties.md](game-properties.md),
[sets.md](sets.md), [previews.md](previews.md), [lod.md](lod.md), [text.md](text.md)

## References

Five photos the user supplied (`assets/panel-houses/`, listed in its `SOURCES.md`): a long
twelve-storey slab with roof penthouses, a model-railway point tower, two renovated slabs in
colour fields and a slab with a low pitched roof added later. Nothing of them is copied; they
set the proportions, the rhythm and the palette.

## Designs

Both designs are category **Panel houses**, group `panel`, `defaultScale` 1 (metres), CC0.

| id | what | shape parameters (default first) |
|---|---|---|
| `panel-slab` | the slab (deskovy panelak): sections in a row, one entrance and staircase each | `sections` 3/2/1; `storeys` 8/4/6/12; `roofShape` flat/pitched; `facade` insulated/original; `balconies` loggia/balcony/none |
| `panel-tower` | the point tower block (vezak): one staircase, windows on all four sides | `storeys` 12/10/14; `roofShape` flat/pitched; `facade` original/insulated; `balconies` loggia/balcony/none |

The colour parameters (`finishParams`) change no geometry: `walls` (grey, cream, rose, ochre,
white, sage), `accent` (orange, gold, coral, red, blue, green: the colour fields, the balcony
parapets and the entrance portals) and `roof` (red, brown, slate, green: a pitched roof's
covering, a flat roof's coping and penthouse tops). Defaults: the slab cream / orange / red, the
tower grey / blue / slate. The slab has 144 shapes, the tower 36; with the colours 20,736 and
5,184 variants.

## Geometry

Metres, base at y = 0, street front +z. A **bay** is one 2.25 m panel, a **storey** 2.8 m, the
raised ground floor stands on a 1.2 m dark plinth with cellar windows. A slab section is five
bays along the street - window, balcony, staircase, balcony, window - and 10.8 m deep; the tower
is seven bays by six (15.75 x 13.5 m) with the staircase in the middle of its front.

- **Windows** are flat layers just proud of the wall (frame, glass, a mullion on the wide ones,
  a sill), so a twelve-storey, three-section slab stays within budget. The staircase's windows
  sit half a storey off the flats', on the landings; its ground floor is the entrance: a portal
  in the accent colour, the door, a canopy and a step.
- **Facade.** `original` draws the panel joints (a vertical one per bay, a horizontal one per
  floor line); `insulated` is the renovated render, smooth, with accent colour fields on the
  balcony columns at the front, the staircases at the back and the tower's sides.
- **Balconies** stack on the front's balcony bays: `loggia` is a frame of two full-height fins
  with a floor slab and a parapet per storey, `balcony` a projecting slab with parapet and side
  panels, `none` puts ordinary windows there.
- **Roof.** `flat` is a parapet with a coping, a membrane and a penthouse (stair and lift room)
  over every staircase, with vent stacks; `pitched` is the low roof (rise 0.5 per run) many
  estates gained later: hipped at its ends, a fascia, a soffit under the 0.45 m overhang and a
  vent hood per staircase.

The slab's long faces carry the bays, its end walls two corner-room windows per storey.

## Party walls

The slab has `partyLeft` and `partyRight` ([game-properties.md](game-properties.md)): a blank end
has no windows, its parapet coping stops at the wall, and a pitched roof ends there in a gable at
the overhang's line instead of a hip, so two slabs stood wall to wall in a `touching` block read
as one long house (the first reference). The party slab fills the end out to the windowed
variant's extent. The tower stands alone and has none.

## City use

The `panel` pool varies `sections`, `storeys`, `roofShape`, `facade` and `balconies`
(`FAMILY_VARY`) and the three colours. Its height bands are the estate's own
(`HEIGHT_TAGS["panel:storeys"]`): four storeys low, six and eight mid, ten and more tall. The new
colour values are tagged too (`grey` walls: stone, cool; `orange` accent: warm, brick).

At the game's fallback scale of 1.75 studs per metre a three-section slab is about 60 studs long,
so only a city lot (64) takes it; a town (48) stands one and two sections.

## The housing estate block

`panel_estate` (label "Housing estate", the Czech "Sidliste") is a perimeter block of the `panel`
pool on the island's own ground (no paving): spacing mostly `open` or `wide`, sometimes
`touching` (a long row of slabs), every height band. Towns grow it in the outer ring (weight 2),
cities in the outer ring (5) and rarely the centre (1); villages never. District and overlay
`residential`. Its site preview is `proc-preview-block-panel-estate` (`blocksPanel.ts`).

## Low level of detail

`panelSlabLod` / `panelTowerLod`, within 100 triangles: the mass in its plinth and wall bands,
the flat roof's parapet or the pitched roof (gabled at a blank end), and as optional parts the
penthouses, the colour fields and one block per balcony stack.

## Budgets and tests

Full detail runs from 430 (one section, four storeys) to 6,610 triangles (three sections, twelve
storeys, original facade, balconies); the tower from 2,170 to 4,402. `test/panelHouses.test.ts`
checks the registration, every shape finite, grounded and within 10,000 triangles with its LOD
within 100, every shape distinct and the colours only recolouring, the sizes per section and
storey, the party walls keeping the extent, the city shapes and bands and the block type. The
catalog sweep checks flicker and the standalone JS like every model's.
