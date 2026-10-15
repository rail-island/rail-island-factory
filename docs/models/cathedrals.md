# Cathedrals

**Covers** - the two big domed landmarks of the historical centre, St Basil's
Cathedral and St Nicholas Church: what each design models, the reference GLB and
photo it reproduces, its datums, size, triangle count and deliberate deviations.
**Code** - `generator/cathedrals.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md) (the mesh builder), [source-tree.md](source-tree.md), [export.md](export.md)

## The family

| id | title | reference GLB (webapp `db/buildings/glb/`) | photos |
|---|---|---|---|
| `bld-st-basils-cathedral` | St Basil's Cathedral | `st-basils-cathedral.glb` | `assets/st-basils-cathedral/` |
| `bld-st-nicholas-church` | St Nicholas Church | `st-nicholas-church.glb` | `assets/st-nicholas-church/` |

`CATHEDRALS` lists them; `CATHEDRAL_CATALOG` holds their shared catalog fields
(category `Historical`, pool `hist_center`, `defaultScale` 1.88, CC0 by Rail
Island). The webapp's `defaultScale` is measured off the reference's size, so
each design keeps the reference's bounding box and axes
(`test/referenceModels.test.ts`, 10 % per axis; both are within 0.5 %).
**The ids are stored in saved maps**: never rename them.

## Shared building blocks

All local to `cathedrals.ts`:

- **`lathe`** turns a `(radius, height)` profile into a surface of revolution with
  a per-cell material function `(segment, band) => material` and an optional
  `twist` (the rings turn with height). St Basil's striped and chequered onion
  domes and the dark copper ribs of the Prague domes are cells of the one surface,
  so they cost no extra triangles and cannot z-fight. The cells are drawn as
  `facets` grouped by column, each triangle wound outward first.
- **`panel`** lays a flat convex slab on a wall frame (`edgeWall` of a ring edge,
  or `wall` for a plain wall): windows, kokoshnik gables, pilaster strips, the
  clock faces. The front stands `out` proud of the wall, the back is buried
  `0.25 + out` behind it, so a glass pane over its frame never shares the frame's
  buried back plane (the coplanar check would flag it).
- `archPts` (round-headed) and `pointedPts` (keel arch) are the outlines.

## St Basil's Cathedral

Front (the stairs and porch) is **+z**; the podium is centred on `(0, -1.9)` as
in the reference. Size 32.20 x 50.22 x 36.00 m, identical to the reference.
About 25 300 triangles (budget 40 000; the reference has 140 576, most of them in
its 12 288-triangle domes).

- **Podium**: a 16-sided brick plinth (stone footing, white cornice) with an
  arcade of arched white-framed openings on every face but the front, the stone
  terrace deck at y = 3.94 that every church stands on, seven front steps out to
  z = 18 and a porch of four white pillars, arches and a green tent with a gilt orb.
- **Central tower**: an octagonal brick body (white base, belt, cornice, corner
  pilasters, keel-arched windows), a ring of kokoshnik gables, the tent base with
  windows, the tall brick tent with white ribs and rows of white lozenges, a
  brick lantern and the gilt onion and Orthodox cross at 50.22 m.
- **Eight chapels** around it, each an octagonal body, kokoshniks, a brick roof
  rising to a round drum (pilaster strips, arched windows, white cornice), an
  onion dome on 32 segments, a gilt ball and an Orthodox cross. The four big ones
  on the axes and the four small ones on the diagonals keep the reference's
  centres and heights. Dome patterns follow the reference's colours: blue/cream,
  red/cream and green/ochre spirals, green/ochre, green/cream and red/green
  chequers (twisted, so they read as the diamonds of the photo), and a plain
  blue one.
- **Bell tower** (south-east): octagon, open belfry with dark arches, kokoshniks,
  green tent, small gilt onion.

Deviations: the reference's 16 gallery arcade arches are drawn as framed
openings on the podium faces; the porch is open on pillars over the stairs (as in
the photo) where the reference has a closed box.

## St Nicholas Church

The long axis is **x**: the twin-towered west front at -x (portal at
x = -19), the round apse at +x. Size 39.75 x 41.78 x 18.20 m (reference
39.73 x 41.78 x 18.20). About 9 600 triangles (reference 37 600).

- **Nave**: white walls on a grey plinth, grey cornice at 17.8 m, five pilasters
  per side with grey bases and capitals, four bays of tall arched windows with
  sills and small upper windows, a statue above each pilaster; a tiled gable
  roof between the front and the great dome.
- **Apse**: a half-round end (centre x = 11.08, radius 7.94) with six radial
  pilasters, five windows and a rounded red-tiled roof running back into the
  dome drum.
- **West front**: the convex white bay between the towers with the grey mid
  band and entablature, four upper columns, pilasters, the dark arched portal and
  window, two niches with statues, four statues and two balustrades on the
  entablature, and the round attic with its ribbed copper roof.
- **Two towers**: square shafts with corner pilasters, banded, arched windows,
  a clock face on the front, an octagonal drum, ribbed copper onion, lantern,
  cupola, gilt orb, spire and cross at 41.78 m.
- **Great dome** on a 24-sided drum (eight windows, eight radial pilasters),
  ribbed copper shell, lantern, cupola, orb, spire and cross at 36.8 m.
- **Apse turret** on the south side with its own drum, onion, lantern and cupola.

Deviations: the reference's small eastern gable roof over the apse is merged
into the apse roof; the low parapet wall behind the towers (hidden in the
reference too) is left out. Statues are simple figures (about 60 triangles each
against the reference's 712).
