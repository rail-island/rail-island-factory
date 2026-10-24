# Station types

**Covers** - the eight railway station types of the `station` set: the layout recipes, the deck
every type stands on (platform end ramps, island underpasses), what each type builds, the train
sheds' shared vault, the loading-gauge rule, and the triangle budgets the types are held to.
**Code** - `generator/sets/station.ts`, `generator/previews/stations.ts`, `test/stationSet.test.ts`,
`test/setPins.test.ts`
**See also** - [sets.md](sets.md) (the registry, landed modules, pins), [previews.md](previews.md),
[stations.md](stations.md) (the station buildings, fixed models), [lod.md](lod.md)

## Frame and layout

A station is built in its own frame: x across the tracks, z along them, y up from the terrain
level, in studs. The game lays out a station of N tracks by its type's recipe
(`buildLayout`): rows of `platform`, `rail`, `island`, `building` and `gap`, saved with the
station so a later recipe change never moves a placed one. `furnish(type, length, layout)`
returns the boxes over any layout. The deck sits at `PLATFORM_HEIGHT` (1.75); a rail row is 8
wide over a 5-stud ballast bed.

**The gauge rule.** Nothing may hang below `PLATFORM_HEIGHT + ROOF_HEIGHT` (12.5) over a
ballast bed. `test/stationSet.test.ts` checks every box of every type at 1, 2, 3, 4 and 8
tracks and 40, 60, 120 and 240 studs; a tilted slab ending at the platform edge may reach a
fifth of a stud past it.

## The deck

`pushDeck` paves every walkable band (a deck row plus the ballast shoulders it borrows), with
the edge coping, the yellow safety lines and the cobbled outer trim. Two options:

- **End ramps.** The open-ended types (`platforms_only`, `platforms_shared`,
  `cantilever_wings`, `concourse`, `village_depot`, `heritage_canopy`) run each platform down to
  the terrain over its last `RAMP_LENGTH` (3.5) studs: a tilted slab (`rotX`) over a stepped
  fill that closes the wedge beneath it. Their furniture stays on the level deck: name boards
  1.2 studs in from the ramp, the wind shelters and the depot's fence inside it
  (`endInset(type)` for the fallback boards). The two train sheds keep full-height ends, under
  their end screens.
- **Underpasses.** Every island of a paired type except `concourse` (which has its
  footbridge) gets a stairwell: a 3 x 9 stud opening cut beside the island's centreline (where
  piers, masts and posts stand), one on a station shorter than 100 studs, two at the quarter
  points otherwise. The well holds a flight of six steps down from the +Z end to a dark passage
  floor at terrain level, a glass balustrade on three sides and a glass canopy on four posts
  over its head (`islandWells`, `pushUnderpasses`). The grand terminus moves its wells between
  its bench bays.

## The types

| type | layout | what it builds |
|---|---|---|
| `platforms_only` | plain deck, 3-stud platforms | ramps, posted name boards, benches, a lamp |
| `platforms_shared` | pairs, 10-stud islands | a V-roof on two rows of columns over every band, underpasses |
| `arch_shed` | pairs | a glass vault per track group (below), underpasses |
| `cantilever_wings` | pairs | masts on every band, tilted wings with a glazed tip over the pairs, wind shelters, underpasses |
| `concourse` | pairs | low canopies and a glazed footbridge with a stair tower on every band |
| `village_depot` | tracks side by side, a 10-stud house strip | the country station (below), a post-and-rail fence and lamps on the far platform |
| `heritage_canopy` | pairs | a gabled timber umbrella canopy on cast-iron posts over every band, underpasses |
| `grand_terminus` | pairs, 14-stud islands | stone arcades and glazed vaults, nave and aisles on a wide station (below), underpasses |

### The train sheds' vault

`arch_shed` and `grand_terminus` share one vault (`makeVault`): an elliptical arch of straight
slabs between two pier lines, risen to its type's proportion or higher, so that nothing hanging
below the arc dips into a track's gauge (checked one chord outside the ballast edge). The slab
count follows the arc's length - a chord of about 2.5 studs, 18 to 48 slabs - so a wide vault
does not show its facets. On it: the glazing (one slab per segment, the full shed length), a
glazing bar at every other joint, and ribs.

- **`arch_shed`** - one vault per track group, springing 4.8 studs above the deck from brick
  piers. Main ribs every 15 studs are lattices (an outer and an inner chord tied by a zigzag);
  a light rib runs halfway between them. A louvred ventilation lantern with a gabled cap runs
  along every crown. A pier line two vaults share carries a valley gutter and downpipes. With
  several vaults, a lattice girder above the gauge spans the station's whole width at both
  ends, on posts from every pier line, and carries the name board; each vault mouth shows a
  clock above it. A single vault keeps its clock and board stacked in the glazed end screen.
- **`grand_terminus`** - up to two track groups share one great vault (springing at 9 studs).
  A wider station is a basilica: a nave over the middle group (or the middle two) and a lower
  aisle vault (springing at 7) over every other group, with a stone clerestory wall where an
  aisle meets the nave. Each vault ends in a stone screen with a fanlight, an archivolt and an
  entablature; the nave's carries the name board, the clock, the roof cross and a crown
  lantern, an aisle's a finial. Statues stand on every pier line. Below the gauge line each
  platform end closes with a framed screen: a stone lintel, jambs either side of an open
  passage and mullioned glass round it (a narrow platform keeps a plain stone portal).

### The village depot

The house strip holds the station's buildings along the platform, as many as its length allows
(`depotPieces`), in this order of need: the stationmaster's two-storey stucco house (plinth,
string course, corner quoins, windows on both storeys and in the gables, chimneys, the name
board over the door), its single-storey waiting-room wing, a timber goods shed with battens, a
sliding door to the track and a loading apron, and a brick privy. A tiled awning on posts with
knee braces, a fretted valance, lamps and benches runs along the house and the wing.

The house is drawn in station boxes, not placed as a prop: the game places props only for sets
whose data names one (`cableCarStation`, `port`, `airport`; [props.md](props.md)), and a
station type has no such field yet.

## Triangle budgets

The game draws 12 triangles per box (8 for a gable prism). A station type is held to a fixed
part for what a station has once - end facades, boards, the depot's buildings - plus a part per
stud of length per track, counting one more track for the outer platforms:

`budget = ends + perStud x length x (tracks + 1)`

| tier | types | ends | per stud |
|---|---|---|---|
| open | `platforms_only`, `village_depot` | 3,000 | 10 |
| canopy | `platforms_shared`, `heritage_canopy`, `cantilever_wings`, `concourse` | 4,000 | 40 |
| shed | `arch_shed`, `grand_terminus` | 10,000 | 60 |

A station grows with its size as the trains standing in it do, and stays far below them: a
coach is held to 16,000 triangles, so a 240-stud platform of coaches is about 140,000 a track.
`test/stationSet.test.ts` checks every type at 1, 2, 3, 4 and 8 tracks and 40 to 240 studs.

| type | 2 x 60 | 4 x 120 | 8 x 240 |
|---|---|---|---|
| `platforms_only` | 708 / 4,800 | 972 / 9,000 | 1,500 / 24,600 |
| `platforms_shared` | 936 / 11,200 | 2,808 / 28,000 | 8,040 / 90,400 |
| `arch_shed` | 5,752 / 20,800 | 20,360 / 46,000 | 70,696 / 139,600 |
| `cantilever_wings` | 1,224 / 11,200 | 3,024 / 28,000 | 7,896 / 90,400 |
| `concourse` | 1,848 / 11,200 | 3,024 / 28,000 | 5,640 / 90,400 |
| `village_depot` | 2,916 / 4,800 | 4,164 / 9,000 | 5,172 / 24,600 |
| `heritage_canopy` | 2,456 / 11,200 | 7,248 / 28,000 | 22,880 / 90,400 |
| `grand_terminus` | 4,216 / 20,800 | 10,108 / 46,000 | 41,092 / 139,600 |

A change that redraws a type moves its pins (`pnpm sets:pins`, [sets.md](sets.md)).
