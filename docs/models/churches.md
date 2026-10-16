# Churches

**Covers** - the three procedural churches (a baroque hillside church, the
neo-Gothic church in Vrchlabi, a twin-tower baroque church): what each models,
its reference GLB and photo, dimensions, datums, budget and deviations, and the
facade helpers they share.
**Code** - `generator/churches.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md), [cathedrals.md](cathedrals.md), [landmarks.md](landmarks.md), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

Each design replaces the hand-authored GLB of the same name in the webapp's model
database (`rail-island-webapp/db/buildings/glb/<name>.glb`). It keeps that
model's axes, orientation and bounding box (test/referenceModels.test.ts allows
10% per axis; all three are within 0.6%), its massing and its colour scheme, and
takes detail the reference lacks from the source photo in `assets/<name>/`.
Units are metres, +Y up, the base on y = 0. Catalog fields are shared
(`CHURCH_CATALOG`: Historical, `hist_center`, default scale 0.9).

| id | reference / photo | faces | size x * y * z (m) | triangles (ref) |
|---|---|---|---|---|
| `bld-baroque-church` | `baroque-church.glb`, `assets/baroque-church/church-1.png` | +z | 19.30 * 42.30 * 39.40 | ~3,000 (7,852) |
| `bld-church-vrchlabi` | `church-vrchlabi.glb`, `assets/church-vrchlabi/vrchlabi-church.png` | -z | 24.34 * 62.30 * 50.51 | ~5,000 (12,416) |
| `bld-twin-tower-baroque-church` | `twin-tower-baroque-church.glb`, `assets/twin-tower-baroque-church/twin-tower-church.png` | +z | 32.00 * 58.01 * 47.91 | ~8,600 (39,364) |

The budget is the building cap of 40,000 triangles; all three stay far below it.

### Baroque Church (`baroqueChurch`)

A cream village church on a hill. A stone terrace (y 0-3, the full footprint)
carries the church; a nine-step stair with sloping side walls runs down the +z
end to z = 19.7, with a statue on a pedestal at each side of its top (from the
photo). The nave (12 m wide, walls to 14 m, slate ridge 17.9 m) has three
round-headed windows and white pilasters a side and ends in a round apse under a
half cone. The front: a core with paired pilasters, a round-arched portal on a
platform, a cornice band, a niche with a statue and a top cornice at 19.75 m;
lower wings with cornices, scroll volutes rising to the core and small dark
obelisks on the wing corners (the photo's finials; the reference has statues
there). The tower is a chamfered square (7.66 m, centre z = 5.9) with diagonal
corner pilasters and an arched window a face, under a dark bell-shaped cap (a
flared skirt and a quarter ellipse, 20 segments), an octagonal lantern with four
arched openings, a small onion and a gilt ball and cross at 42.3 m.

Materials follow the reference: `stone`, `plaster`, `trim`, `slate`, `glass`, `gold`.

### Vrchlabi Church (`churchVrchlabi`)

The neo-Gothic red-sandstone church, tower to the -z end. The square tower
(centre z = -15.83) has corner buttresses to 34.8 m, sandstone string courses,
a projecting pointed portal with a sandstone reveal, a timber door and a
gablet with a finial, a big pointed west window with two mullions and a transom,
clocks on the front and both sides (not the back, as in the reference), and a
belfry with two louvred pointed openings a face. Over the cornice (37.6 m) stand
the octagonal slate spire to 59.25 m with a gabled lucarne on each main face (the
photo shows one on the front; the reference puts them on the diagonals), four
corner pinnacles (plinth, octagonal shaft, spirelet, ball) and an iron orb and
cross to 62.3 m. Behind: the nave (15 m, gable walls under thin roof plates so the
brick gables show), lean-to aisles with five buttresses and four pointed
windows a side, two front bays under pyramid roofs flanking the tower, and a
polygonal apse with a hipped roof and three pointed windows. Four paving steps
lead to the portal (z = -25.33).

The apse's z extent ends at 25.18 m (the reference's 25.33 is a protruding window
sill).

### Twin-Tower Baroque Church (`twinTowerBaroqueChurch`)

A cream stucco church with white dressings, facing +z. The front (11.5 m) has
cornices at 9.1, 15.15 and 20.9 m, pilasters, a portal with two round columns,
an entablature and a pediment over an arched oak door, two windows above it,
and a curved (segmental) gable with a gilt cross and two gilt urns (the photo's
curved gable; the reference has a triangle). The two towers (7 m square, centres
x = +-8.85, z = 16.3) are drawn by one function, `baroqueTower`: corner pilasters,
three storeys with a door and window, a louvred arched belfry opening a face,
four clocks, urns on the attic corners, and the copper cap -- brown drum, green
onion (20 segments), an open lantern of eight posts round a dark core, a second
small onion and a needle spire with a gilt ball and iron cross at 58.01 m. Side
porches with hipped copper roofs (the x extent, +-16 m), a nave with four
clerestory windows a side over lean-to copper-roofed aisles, and a choir closing
in a rounded apse (to z = -24) under a grey roof complete it.

## Shared helpers

All in `generator/churches.ts`:

- **Faces** - `face`, `faceX`, `faceZ` describe a vertical wall plane (origin,
  tangent, outward normal); `panel` extrudes a convex outline drawn in the face's
  (u, y) coordinates from one depth proud of the wall to another, through
  `MeshBuilder.slab`. Outlines: `rectOutline`, `roundArch`, `pointedArch`, `oval`.
- **`windowOn`** - glass standing just proud of a frame a border wider, with a
  sill; the frame's back is buried in the wall and the sill's deeper still, so no
  two materials share a plane. `clockOn` is the same idea for a rim, dial and hands.
- **Solids** - `lathe` (rings of radius and height: domes, onions, urns, statues),
  `ball`, `statue`, `crossFinial`.
- **Roofs** - `ridgeRoofZ` (a solid triangle prism), `roofPlatesZ` with
  `gableSection` (thin plates over a gable wall cut 5 cm under them), `hipRoof`,
  and `apseRing` / `halfCircle` for rounded apses (the ring is closed by a chord a
  few decimetres inside the nave, staggered per layer so the chords never coincide).
  `triOut` winds a hand-built triangle away from an interior point.

## Checking

```
pnpm exec vitest run test/referenceModels.test.ts test/models.test.ts -t church
pnpm exec vitest run test/jsModel.test.ts -t church
```

Look at `export/thumbs/<id>.png` after `pnpm build:models`.

## Procedural export contract

All current export IDs use `proc-building-` or `proc-vehicle-`; source/reference
names in older tables identify the original models. See [legacy-mapping.md](legacy-mapping.md)
for the authoritative ID, scale and runtime conversion contract. Ground vehicles
have no exported `defaultScale`; buildings, aircraft and ships use 1 except the
Eiffel Tower placement exception.
