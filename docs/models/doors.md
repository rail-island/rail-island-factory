# Doors: passenger doors that open

**Covers** - the passenger doors that open on every train, tram and bus: the `door` clip drive and its side, the three motion families (fold, swing, plug) and their leaves, `openable` and the mechanism core it shares with the pantographs, the shut rest pose, how the coach kit draws an opening door (the lights riding on the leaves), the doorways cut through the shell and the dark vestibules behind them, which designs open which doors, the site's Open left / Open right / Close buttons, what the game does with the clips today, and the tests.
**Code** - `generator/csdCoachParts.ts` (`Opening`, `Volume.openings`, `doorOpening`, `doorwaySegment`, `vestibules`), `generator/dmuKit.ts` (`Car.volume`, `loft`), `generator/doors.ts` (`DoorMotion`, `doorLeaves`, `openable`, `DOOR_SAMPLES`, `DOOR_FOLD_ANGLE`, `DOOR_PLUG_OUT`, `LEAF_GAP`), `generator/liftable.ts` (`mechanism`), `generator/meshCore.ts` (`ClipDrive`, `DoorSide`, `moved`, `currentPartName`), `generator/csdCoachParts.ts` (`Coach.door`), `generator/tramKit.ts` (`doors`), `generator/csdCoaches.ts` (`doors`), `generator/liveryCoach.ts` (`DoorSpec.opens`), `generator/trams.ts`, `generator/cdYCoach.ts`, `generator/uicZCoach.ts`, `generator/bmoCoach.ts`, `generator/emu471.ts`, `generator/emu680.ts`, `generator/db628.ts`, `generator/dmu810.ts`, `generator/cdGreenWhiteCoach.ts`, `generator/zsrCoach.ts`, `generator/dbDoubleDeck.ts`, `generator/drDoubleDeck.ts`, `generator/dbNWagen.ts`, `generator/emu451.ts`, `generator/emu460.ts`, `generator/emu470.ts`, `generator/dmu812.ts`, `generator/dmu843.ts`, `generator/dmuM131.ts`, `generator/dmuM240.ts`, `generator/dmuM296.ts`, `generator/jrKiha40.ts`, `generator/mavMdmot.ts`, `generator/metro.ts`, `generator/busAssembly.ts` (`BusDraft.door`), `generator/tgv.ts`, `generator/ice1.ts`, `generator/tgvDuplex.ts`, `generator/shinkansen0.ts`, `generator/drVt1816.ts`, `src/ModelViewer.tsx`, `test/doors.test.ts`
**See also** - [animation.md](animation.md), [trams.md](trams.md), [csd-coaches.md](csd-coaches.md), [czsk-coaches.md](czsk-coaches.md), [czech-emus.md](czech-emus.md), [czech-dmus.md](czech-dmus.md), [foreign-units.md](foreign-units.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

A door used to be paint: a dark seam over the door box and a leaf 1 cm proud of the
body skin, all of it fixed to the body. An opening door keeps that look shut and
turns its leaves into moving parts, animated by a clip from shut to open. Behind a
door whose leaves fold or swing inward the body shell is cut open and a dark
vestibule stands in the body, so the leaves stay in sight as they turn in (see
Doorways and vestibules below); behind a plug door the shell
stays whole and the door's own dark seam panel, which fills the whole door box, is
the doorway an open leaf uncovers.

Every passenger vehicle opens its passenger doors (below); locomotives, wagons and
the doors no passenger uses (cab, end, luggage, mail, crew) stay paint.

## The `door` drive

A door clip is a state clip with a drive of its own (`ClipDrive`, `meshCore.ts`):

```ts
{ drive: "door"; side: "left" | "right" }
```

- Time 0 is shut, the clip's end (1) open; **the shut pose is the rest pose**, so the
  thumbnail, the source tree, the coplanar check of the build and any consumer that
  plays no door clip see the vehicle exactly as before. (A pantograph is the other
  way round: raised at rest, at the clip's end.)
- `side` is the side the doors stand on, seen facing the model's +X end: **right is
  +Z**. It is worked out from where the leaves stand in the model, so a car drawn
  `turned` reports its sides as they end up.
- One clip per side per car: `doors-right` and `doors-left` on a single-part model,
  `doors-<side>-<part>` on an articulated tram or a set (`doors-right-section1`).
  Every door of that side and car joins the clip.
- The drive goes out with the other drives as `clipDrives` (the GLB's scene extras,
  the JS model's `userData`).

The game (rail-island-webapp, its `docs/rendering/vehicle-doors.md`) opens the
doors by side while a vehicle dwells: a train's on the sides with a platform beside
the car, a bus's or tram's on the kerb side. It plays `state` clips together as
pantographs, which is why doors have a drive of their own.

## Motions

`doorLeaves(x0, x1, s, motion)` splits a door's leaf span (Factory x, before any
turn) into leaves with a `LEAF_GAP` of 12 mm between them and gives each a rigid
`move(o, hz)` - where a point of the shut leaf goes at opening `o`, `hz` the hinge
line's z (the leaf's outer face). Inward is toward the car's centre line.

| Motion | Leaves | How they move |
| --- | --- | --- |
| `fold` | 2, 3, 4 | pairs hinged together fold inward against a jamb, the first leaf turning about the jamb, the second turning back from its free edge with its own free edge kept on the door line; 2 leaves fold against `from`, 4 make a pair at each jamb, 3 a pair at `from` and a single swinging leaf at the other jamb; up to `DOOR_FOLD_ANGLE` = 80 degrees |
| `swing` | 1, 2 | hinged at a jamb, turning inward 80 degrees: one at `from`, two from both jambs (a double door) |
| `plug` | 1, 2 | step out `DOOR_PLUG_OUT` = 8 cm over the first quarter of the opening, then slide along the side by a leaf's width (and the gap): one toward `toward`, two apart |

A folding or swinging leaf turns into the vestibule behind its doorway; a plug leaf
stands outside, over the panels beside the door, 8 cm out - clear of window frames,
sashes and handrails.

## `openable` and the mechanism core

`openable(m, draw)` (`doors.ts`) draws a door through `draw(mm, o)`: every moving
piece drawn at opening `o` through the builder it is handed, moved only rigidly
(`MeshCore.moved` with a leaf's `move`). It runs the mechanism core it shares with
`liftable` (`mechanism`, `liftable.ts`): `DOOR_SAMPLES` + 1 = 9 openings, each
triangle's rigid motion, triangles that move alike gathered into pieces, each moving
piece a part `door<n>-<k>` pivoted where it moves least (a child of the car part being
drawn), the rest pose - here opening 0 - drawn for real with the triangles routed to
their parts. A piece that stretches is refused. The doors of a model are numbered on
their own, so a pantograph keeps its `pantograph<n>` names.

## The coach kit's opening door

`Coach.door(v, s, box, paint, opts)` (`csdCoachParts.ts`) is the door every tram,
coach and unit of the coach kit draws. With `opts.opens` (a `DoorMotion`) on a side
door:

- the outline (seam) is drawn as before, the doorway behind the leaves - or, where
  the volume has a doorway at the leaf box (below), as a frame round the hole;
- the leaf splits into the motion's leaves, each painted as the whole leaf was
  (`paint`, the body's bands, or `opts.leafPaint` for a two-tone leaf);
- `opts.leafWork(clip)` draws what a leaf carries - its lights - once per leaf;
  `clip(box)` cuts a source box to that leaf, 1 cm inside an edge it cuts, or null
  where it misses: a window across two leaves becomes one per leaf;
- the hinge line is the leaf's outer face at mid height, mid door.

The tram kit's `doors` and the CSD coaches' `doors` take an `opens` option and pass
their lights through `leafWork`; the livery coaches take `opens` per `DoorSpec`. A
door drawn without it is byte-for-byte what it was. End doors never open.

## Doorways and vestibules

A leaf that folds or swings inward would vanish into a closed body as soon as it
moved, and show only in the last degrees of closing - a snap, not a motion. So a
`Volume` takes `openings` (`csdCoachParts.ts`): one per inward-opening door, the
door's leaf box on its side, made with `Coach.doorOpening(s, box, seam)`. The
volume must know them when it is drawn, so a design lists them before its body:
the tram kit's `doorOpenings(s, list)`, the livery coaches from their `DoorSpec`s,
the railcar kit's `Car.volume(v, openings)`.

- **The shell** (`Coach.volume`, the railcar kit's `loft`, both through
  `doorwaySegment`): a doorway's edges become stations; over its span each band is
  drawn in pieces at the doorway's heights, a piece within it without that side's
  wall and without the chords across the body. The cut runs 2 mm beyond sill and
  head, under the door's frame, so no cut edge shares a plane with the frame.
- **The vestibule** (`vestibules`): a floor, a ceiling, a back wall
  `VESTIBULE_DEPTH` = 0.6 m inside the skin and two side walls following the skin's
  profile, all in the dark `seam` and facing the doorway. Floor and ceiling stand
  3 mm (or 6, 9) inside the doorway, clear of the shell's chords and band
  boundaries.
- **The frame**: the door's outline becomes four strips round the hole.

The shut leaves cover the hole but for the 12 mm gaps between them, through which
the vestibule shows dark as the seam did. A volume without `openings` draws exactly
as before. The doors with a doorway: the T3, KT4, KT8D5 and GT4, the Bdmtee, the
CD Y coach and the CD 810. The Bdmtee and the Bmo lost the painted centre seam over
their doors: the gap between the two leaves is that seam now.

## The designs

Every design of the catalog groups `coach`, `unit`, `tram`, `metro` and `bus` opens
its passenger doors, in the motion its prototype has where the drawing allows:

| Family | Motion |
| --- | --- |
| Tatra T3, KT4 (four-leaf folding), KT8D5 (four, the narrow outer doors three), GT4 (two) | `fold` inward, through doorways |
| Tatra T6A5, the 81-71 metro car, Bmo, DB Regio and DR double-deckers, CD 470, CD 471 | `plug` 2 |
| UIC-Z (every operator), CD 680, DB 628 motor car, CD 843 (one-window doors), MAV MDmot trailers, TGV and TGV Duplex trailers, ICE 1, Shinkansen 0, DR VT 18.16 | `plug` 1 toward the car's middle (two-window doors `plug` 2) |
| CSD Y-type, Balm, Bam, Be31, CD Y coach, ZSR coach, green-and-white coaches, CD 460 and 810, 812, M 131, M 240, M 296 / 853 / 854, JR KiHa 40 | `swing` inward through doorways: one leaf on the jamb toward the nearer end, two (a double door with a window a leaf) from both jambs |
| CD 451 / 452 | `swing` 2 inward through doorways |
| CSD Bi20 compartment coach | `swing` 1 **outward**, the brass class numeral riding on its leaf |
| DB n-Wagen coaches (the DB 628 design's other `unit` values) | `fold` 4 inward through doorways (a single door `swing` 1); the cab car's driver door stays shut |
| every bus | `plug`: one leaf slides back toward the tail, two slide apart; right side only, as drawn |

Where the native drawing paints one window across a door, the door opens as one
leaf, so the window stays whole and its native-landmark comparison holds; a two-leaf
folding door would cut it in two. Which doors are passenger doors is decided per
design: the green-and-white coaches' green leaves (their `bands` leaves are luggage
doors; the Ds luggage van opens none), the ZSR BDmeer's and Bds's luggage doors
marked, the CD 843 doors that reach down to the low entrance and are 0.9 m wide,
the M 240 and M 296 single-window doors (their cab doors and luggage double doors
stay shut), the MDmot's doors at least 0.8 m wide and not its baggage room's, the
VT 18.16 power car's third door. The CSD Dsk luggage van and the M 112 steam
railcar, whose van body draws no door, open none; nor do a set's power cars. The
low level of detail draws every door shut and still.

## The site

`ModelViewer` sorts a model's `door` clips by side. **Open left** and **Open right**
(each only where the model has doors on that side) open that side's doors; **Close**
shuts both. Each side moves from wherever it stands over 2 s, eased slow at both
ends, and a model always arrives shut ([../site/catalog-site.md](../site/catalog-site.md)).

## Tests

`test/doors.test.ts`: every motion's leaves fill the door and stand still shut; a
folding pair's second free edge stays on the door line; a plug leaf steps out, then
slides; `openable` draws the shut pose at rest, the leaves as `door<n>-<k>` parts, a
door clip per side matching a plain build at 0, 0.5 and 1, every door of a side
joining one clip, numbered apart from a pantograph; a door drive without a side is
refused. Every design of the passenger groups (but the Dsk and the M 112) opens
doors in some variant, and nothing else does; per design and sampled parameter
combination: door clips on both sides (the right only on the single-ended trams and
every bus), nine samples, sample 0 the rest pose, no z-fighting half
open and open, and no door clip at low detail. A coach-kit body with a doorway has
no skin over it and a vestibule's back wall behind it, one without doorways is
byte-for-byte unchanged, and every inward-opening door of the seven designs opens
into a vestibule.
