# Doors: passenger doors that open

**Covers** - the passenger doors that open on a few trams, coaches and units: the `door` clip drive and its side, the three motion families (fold, swing, plug) and their leaves, `openable` and the mechanism core it shares with the pantographs, the shut rest pose, how the coach kit draws an opening door (the doorway, the lights riding on the leaves), which designs open which doors, the site's Open left / Open right / Close buttons, what the game does with the clips today, and the tests.
**Code** - `generator/doors.ts` (`DoorMotion`, `doorLeaves`, `openable`, `DOOR_SAMPLES`, `DOOR_FOLD_ANGLE`, `DOOR_PLUG_OUT`, `LEAF_GAP`), `generator/liftable.ts` (`mechanism`), `generator/meshCore.ts` (`ClipDrive`, `DoorSide`, `moved`, `currentPartName`), `generator/csdCoachParts.ts` (`Coach.door`), `generator/tramKit.ts` (`doors`), `generator/csdCoaches.ts` (`doors`), `generator/liveryCoach.ts` (`DoorSpec.opens`), `generator/trams.ts`, `generator/cdYCoach.ts`, `generator/uicZCoach.ts`, `generator/bmoCoach.ts`, `generator/emu471.ts`, `generator/emu680.ts`, `generator/db628.ts`, `generator/dmu810.ts`, `src/ModelViewer.tsx`, `test/doors.test.ts`
**See also** - [animation.md](animation.md), [trams.md](trams.md), [csd-coaches.md](csd-coaches.md), [czsk-coaches.md](czsk-coaches.md), [czech-emus.md](czech-emus.md), [czech-dmus.md](czech-dmus.md), [foreign-units.md](foreign-units.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

A door used to be paint: a dark seam over the door box and a leaf 1 cm proud of the
body skin, all of it fixed to the body. An opening door keeps that look shut and
turns its leaves into moving parts, animated by a clip from shut to open. The body
shell is not cut: behind the leaves stands the door's own dark seam panel, which
already fills the whole door box, and an open leaf uncovers it as the doorway.

This is a proof of concept on a few designs of each kind (below); every other
vehicle's doors stay paint.

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

The game plays only the drives it knows (rail-island-webapp `ClipController`
`drivenClips`), so it leaves door clips alone and draws the doors shut; it plays its
`state` clips together as pantographs, which is why doors have a drive of their
own. Opening doors at a stop is the game's to add later.

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

A folding or swinging leaf ends inside the body shell, so open it is hidden and the
doorway shows; a plug leaf stands outside, over the panels beside the door, 8 cm out
- clear of window frames, sashes and handrails.

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

- the outline (seam) is drawn as before: the doorway;
- the leaf splits into the motion's leaves, each painted as the whole leaf was
  (`paint`, the body's bands, or `opts.leafPaint` for a two-tone leaf);
- `opts.leafWork(clip)` draws what a leaf carries - its lights - once per leaf;
  `clip(box)` cuts a source box to that leaf, 1 cm inside an edge it cuts, or null
  where it misses: a window across two leaves becomes one per leaf;
- the hinge line is the leaf's outer face at mid height, mid door.

The tram kit's `doors` and the CSD coaches' `doors` take an `opens` option and pass
their lights through `leafWork`; the livery coaches take `opens` per `DoorSpec`. A
door drawn without it is byte-for-byte what it was. End doors never open.

## The designs

| Design | Doors | Motion |
| --- | --- | --- |
| Tatra T3 (all variants) | three, right side | `fold` 4 |
| Tatra T6A5 | three, right side | `plug` 2 |
| Tatra KT8D5 | five a side, every section | `fold` 4; the two narrow outer ones `fold` 3 |
| Tatra KT4 | four, right side | `fold` 4 |
| GT4 | three, right side | `fold` 2 |
| CD Y coach (all variants) | the entrance doors | `swing` 1 on the jamb toward the nearer end |
| UIC-Z coach (every variant and operator) | the entrance doors | `plug` 1 toward the nearer end |
| Bmo double-deck coach | two a side | `plug` 2 |
| CSD Bdmtee | two double doors a side | `swing` 2 |
| CD 471 CityElefant (every car) | the saloon doors | `plug` 2 |
| CD 680 Pendolino (every car) | the entrance doors | `plug` 1 toward the car's middle |
| DB 628 motor car | two a side | `plug` 1 toward the car's middle |
| CD 810 | two a side | `swing` 1 on the jamb toward the nearer end |

Where the native drawing paints one window across a door (the CD Y coach, the CD
810, the DB 628), the door opens as one leaf, so the window stays whole and its
native-landmark comparison holds; a two-leaf folding door would cut it in two.
Cab doors, end gangway doors and hatches stay paint. The DB 628 design's n-Wagen
coaches (its other `unit` values) keep shut doors. The low level of detail draws
every door shut and still.

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
refused. Per design and sampled parameter combination: door clips exactly on the
listed designs and sides, nine samples, sample 0 the rest pose, no z-fighting half
open and open, and no door clip at low detail.
