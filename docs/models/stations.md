# Stations

**Covers** - the four procedural station buildings (Prague main station, the yellow
stucco station building, the Mikulasovice halt and the red-brick suburban station):
their reference GLBs and photos, dimensions and datums, triangle counts, the facade
and roof helpers they share, and where they deviate from the references.
**Code** - `generator/stations.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [source-tree.md](source-tree.md), [export.md](export.md), [js-format.md](js-format.md)

## The designs

Each design replaces a hand-authored GLB in the webapp's model database
(`rail-island-webapp/db/buildings/glb/<name>.glb`) and keeps its axes and bounding box:
the platform or street front faces **+Z**, the long side runs along **X**, the model
stands on y = 0 and is roughly centred on the origin. All four match their reference
bounding box to the centimetre (`test/referenceModels.test.ts` allows 10% per axis).
Photos are in `assets/<folder>/`.

| id | reference GLB | photos | size x / y / z (m) | triangles (reference) |
|---|---|---|---|---|
| `bld-prague-main-station` | `prague-main-station.glb` | `assets/prague-main-station/` | 64.40 / 42.10 / 27.22 | 22,722 (18,292) |
| `bld-station-building` | `station-building.glb` | `assets/station-building/` | 27.78 / 8.53 / 11.84 | 9,444 (10,612) |
| `bld-station-halt` | `station-halt.glb` | `assets/station-halt/` | 19.50 / 10.46 / 13.12 | 4,662 (3,008) |
| `bld-suburban-station` | `suburban-station.glb` | `assets/suburban-station/` | 25.20 / 13.88 / 13.60 | 7,970 (7,424) |

The budget for a building is 40,000 triangles (`test/referenceModels.test.ts`).

### Prague main station

The art nouveau Fanta building of Praha hlavni nadrazi. A central hall (x +-13 m,
cornice at 21.5-22.5 m) whose front is one great arched window - 15 m wide, springing
at 12 m, apex 19.5 m - with copper tracery (mullions, two transoms, a fan ring and
radial ribs) inside a stone archivolt; five arched doors with red frames below it,
behind a curved green iron-and-glass entrance canopy on seven columns (to z = 13.42).
Above the cornice stands the stepped gable: stone screen, red panels with white
frames, six windows, a crest with a gilt medallion and six pinnacles with slate caps;
behind it the hall's slate barrel roof with a copper ridge.

The two corner towers (centres x = +-15.5, z = 5.5; 8.4 x 9 m shafts to 27 m) carry
corner pilasters, clocks on the front and the outer side, a balustraded cornice, a
round belvedere with eight windows, a ribbed copper dome (33-37.3 m), a blue glazed
lantern and a gilt finial and orb (top 42.1 m). The side wings (x +-19.5..31.5,
z -10..7, 16 m plus attic and slate mansard with three dormers) have an arcaded
ground floor and a red attic panel; low link blocks fill the gaps behind the towers.

### Station building

The yellow-ochre (`#e8a22b`) stucco station of the photo `styled-station.png`. A
long single-storey block (x -13.29..8.71) under a low red hip roof with a scalloped
green frieze; a two-storey pavilion in the middle (front at z = 2.77) with a front
gable, green bargeboards, a white medallion, white fretwork, three shuttered windows
and a green STATION sign; a gabled end pavilion on the +X end (x 8.61..13.21) with a
green frieze, a flag and shuttered windows. Along the platform: seven green double
doors with glazed transoms, and a platform canopy (to z = 5.92) on eight timber posts
with arched green brackets, a scalloped green valance, rafters, lanterns, two benches
and a planter.

### Station halt (Mikulasovice)

The Mikulasovice dolni nadrazi station. A cream stucco two-storey block (x +-9,
z -5.73..2.27, eaves at 6.95 m) under a red hip roof (ridge 9.45 m) with two brick
chimneys (top 10.46 m); a centre bay standing 0.5 m forward with its own front gable
and timber bargeboards, an attic window and the blue name board lettered
MIKULASOVICE. Brick pilasters frame the corners and the centre bay, as on the photo;
the upper windows carry flower boxes. The platform canopy (to z = 6.5) is a red tile
lean-to on six dark timber posts with forked knee braces along the platform and
rafters back to the wall.

### Suburban station

The red-brick (`#9c4a3d`) symmetric station of the illustration. A central hall
(x +-5, to 10.2 m) with three tall gridded windows between cream pilasters, an attic
and a clock housing with a brick-backed clock on top (13.88 m); lower wings either
side (x +-5..12, 7 m) with cream corner pilasters. Over the cream canopy (z 5..8, on
nine posts with iron brackets) hangs the yellow SUBURBAN STATION board; under it the
glazed entrance doors, shop windows, two lamps and the TICKETS and CAFE plaques.

## Shared helpers

All in `stations.ts`, each drawing inside the caller's scopes:

- **`Wall` / `onWall`** - a facade element is a block on a wall plane given as
  (u along the wall, y up, d out of the face). `windowOn` (glass, frame bars,
  mullions, transoms, optional surround, sill, hood and shutters) and `doorOn` build
  on it; `wallSlab`, `wallDisc` and `wallArc` lay convex panels, discs and rings
  (archivolts, clock rims, scallops) in a wall.
- **Roofs** - every roof plane is a slab (`roofPlane`) with a vertical thickness;
  `hipRoof`, `gableRoofZ`, `gableHipRoofZ`, `gableWallZ` and `bargeboards`.
- **`revolve`** - a solid of revolution (domes, lanterns, the finial orb, lamp globes).
- **`lettering`** - a 3 x 5 block font for the sign boards (only the letters the
  signs use).
- **`clock`** - rim, face, twelve ticks and hands at ten past ten.

**No z-fighting.** The layers of one facade element start and end at different
depths (glass -0.07..0.03, frame -0.06..0.09, bars -0.05..0.075, surround
-0.04..0.015), so no two share a face plane. Wall cores under a roof or cornice are
open-topped; pilasters that wrap a corner end in the same plane as their own kind
only; elements at ground level drawn with `block` (which closes the bottom) start a
couple of centimetres apart.

## Deviations

- **Prague**: the towers' upper stage is a round belvedere with a ribbed dome, as in
  the photo, where the reference has a plain octagonal drum. The great window's glass
  starts above the entrance canopy (7.6 m) and the five doors stand in a recessed
  lower wall, as in the photo; the reference runs the glazing down to 3 m. The red
  panels cover most of the gable, as in the photo. The side wings' sculpture and
  balconies are left out.
- **Station building**: the photo's building is all one storey with an upper floor
  only in the gabled parts; the model follows the reference's massing (single-storey
  block, two-storey pavilion, end pavilion). The canopy roof is a light sloped slab
  rather than the photo's exposed timber framing.
- **Station halt**: the photo's low annex at the west end and the platform fence are
  left out (they would grow the bounding box). The name board reads MIKULASOVICE in
  block capitals without the diacritics or "dolni nadrazi".
- **Suburban station**: the reference has no SUBURBAN STATION board; it is added from
  the illustration, sitting over the canopy below the hall windows.
