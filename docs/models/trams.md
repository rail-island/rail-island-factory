# Trams and metro

**Covers** - the trams and the metro car transferred from vlakosimdb: the Tatra T3 (three variants), T6A5, KT8D5 (three liveries) and KT4, the GT4, and the 81-71 metro car (head and middle car); the shared tram builder and its source-to-Factory map, the articulated trams' sections and joints, pantographs, lamps and direction indicators, sources, deviations, the native comparison and tests.
**Code** - `generator/trams.ts`, `generator/metro.ts`, `generator/tramKit.ts`, `generator/tramComparison.ts`, `generator/tramReport.ts`, `generator/orthoViews.ts`, `generator/treeIds.ts`, `test/trams.test.ts`, `test/rig.test.ts`
**See also** - [vehicles.md](vehicles.md), [vehicle-rig.md](vehicle-rig.md), [parameters.md](parameters.md), [csd-coaches.md](csd-coaches.md) (the coach builder underneath), [../../.agents/skills/vlakosimdb-transfer/SKILL.md](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

| id | title | params (vlakosimdb) | build | triangles |
|---|---|---|---|---|
| `veh-tatra-t3` | Tatra T3 | `variant`: `t3` (tram_ckd_t3, default), `t3m` (tram_ckd_t3m), `t3prototype` (tram_ckd_t3x) | rigid, one node | 6,800 to 6,900 |
| `veh-tatra-t6` | Tatra T6A5 | - (tram_ckd_t6) | rigid | 6,600 |
| `veh-tatra-kt8` | Tatra KT8D5 | `livery`: `redWhite` (tram_ckd_kt8, default), `red` (tram_ckd_kt8#2), `modern` (tram_ckd_kt8m) | three sections, two joints | 12,000 |
| `veh-tatra-kt4` | Tatra KT4 | - (tram_ckd_kt4) | two sections, one joint | 7,900 |
| `veh-kvag-gt4` | GT4 | - (tram_kvag_gt4) | two sections, one joint | 7,600 |
| `veh-metro-81-71` | Metro 81-71 | `unit`: `headCar` (m_mmz_81-71l, default), `middleCar` (m_mmz_81-71v) | rigid | 6,200 / 5,500 |

The trams take `TRAM_CATALOG` (category `Rail vehicles`, group `tram`), the metro
car `METRO_CATALOG` (group `metro`). Every design has its `assets/<folder>/`
(`tatra-t3`, `tatra-t6`, `tatra-kt8`, `tatra-kt4`, `gt4`, `metro-81-71`) with
the native files, `SOURCES.md`, `PHOTOS.md` and `COMPARISON.md`.

`db/train/tram/rtram_t6` is archived in the game (`rail-island-webapp/db/archived.json`)
and was not transferred; the T6A5 is tram_ckd_t6 alone.

## The map: drawings onto published dimensions

A vlakosimdb tram is drawn at a convenient size, not to scale: the T3's body is
14.8 m, the KT8D5's 27.3 m, the KT4's 21.2 m. Each design keeps the drawing's
proportions and maps it onto the type's published length, width and height with
one factor per axis (`TramMap`, `tramKit.ts`):

```
X = (c - x) * kx,   Y = y * ky,   Z = -z * kz
```

`c` is the source x of the model's x = 0. The source's x_inc end (headlights) is
the Factory front (+X) and its z_inc side the Factory right (+Z): a 180 degree turn
about Y, nothing mirrored. Wheels (700 mm on the trams, 780 mm on the metro),
bogie wheelbases and the 1.435 m gauge are real sizes, not scaled. Each
`SOURCES.md` gives the factors and where the dimensions come from.

| design | kx | ky | kz | published |
|---|---|---|---|---|
| T3 | 14.0 / 14.8 | 3.05 / 3.4 | 2.5 / 2.4 | 14.0 x 2.5 x 3.05 m, bogie pivots 6.4 m |
| T6A5 | 14.7 / 15.2 | 3.165 / 3.5 | 2.5 / 2.4 | 14.7 x 2.5 x 3.165 m |
| KT8D5 | 30.3 / 27.3 | 3.145 / 3.4 | 2.48 / 2.4 | 30.3 x 2.48 x 3.145 m |
| KT4 | 18.11 / 21.2 | 3.1 / 3.25 | 1 | 18.11 x 2.2 x 3.1 m |
| GT4 | 18.2 / 14.1 | 3.3 / 3.6 | 2.2 / 2.4 | 18.8 m over the couplings, 2.2 m, bogie pivots 10.0 m |
| 81-71 | 19.21 / 20 | 3.65 / 3.7 | 2.7 / 3.0 | 19.21 m over the couplers, 2.7 x 3.65 m, bogie pivots 12.6 m |

## The builder

`Tram` (`tramKit.ts`) is the CSD coach builder (`Coach`, [csd-coaches.md](csd-coaches.md))
with the map: `vol()` lofts a body from the XML `alongx` section, scaled by the
`alongy` plan and clamped by the `alongz` elevation (raked windscreens, skirts
between the bogie cut-outs), cut to a source x range and painted in horizontal
bands. A cab is its own short volume whose bands include the glass, so the
windscreen wraps onto the cab sides as the BMPs draw it. On the bodies:

- `windows()`, `doors()` (seam, leaf, a glazed light per leaf), `paint()`,
  `endPaint()`: panels over native pixel boxes, `box()` / `endBox()` mapping them.
  Its `sidePanel` moves each split at the plan's stations and the section's corners
  by half the panel's standoff, so a door's seam, leaf and lights (closed slabs of
  three materials) never share a hidden end face.
- `lamp()` seats a lamp on the end surface where it really is (`endX()` follows the
  tapered plan); `cornerLamp()` and `sideLamp()` place the direction indicators
  (below); `endBlock()`, `roofBox()`, `coupler()`.
- `tramBogie()`: the coach bogie with traction motors.
- `diamond()`: the period double-arm pantograph (T3, KT8D5, KT4, GT4), two rhombic
  frames whose knees come from fixed arm lengths (`knee()`, two circles'
  intersection), so a folded collector keeps its arms. `singleArm()`: the T6A5's.

## Pantographs

Every tram has exactly one raised collector, its carbon strip's top at the game's
trolley wire, 5.50 m (`TRAM_WIRE`, `TRAM_COLLECTOR_TOP` in `collector.ts`;
[animation.md](animation.md)) - the T6A5's single arm included. The
KT8D5's source draws a second collector on the rear section, folded: the model
keeps it folded, as the railroad-vehicle rule for two collectors asks. Collectors
live under `roof-equipment/pantographs/`, which the fixed 4.7 m envelope check
leaves out. The metro car has none: third-rail shoes hang from both bogies.

The raised collector is a `liftable` mechanism ([animation.md](animation.md)), its
arms `rod`s: the game folds it at stops. A diamond folds to `diamondFolded`, the
lowest collector height at which its knees still stand below the collector - its
fixed arm lengths cannot lie flat, and lower the frames would cross into a V; about
1 m over the roof. The KT8D5's folded rear collector stands at that height too.

## Lamps and direction indicators

Head lamps (`lampHead`) and red tail lamps (`lampRed`) come from the end BMPs.
The drawings show no indicators, so their places come from photographs (two were
downloaded for this, the T3's and the T6A5's rear, each folder's `SOURCES.md`
lists the evidence). Every tram also draws amber direction indicators in `lampAmber` (role `indicator`,
[lamps.md](lamps.md)) where the photographs in its `assets/<folder>/PHOTOS.md` show
them, at both ends and on both sides, so the game's split - front from rear at the
lamps' `midX`, left (z < 0) from right (z > 0) - finds all four. No lens comes near
the centre line or the middle of the length. Each sits in an `indicators` (end) or
`indicator` (side repeater) scope.

| tram | front | rear | side repeaters | photographs |
|---|---|---|---|---|
| T3 (all variants) | the amber top of the lamp cluster on each cab corner, in the belt just above the headlights | the amber outer half of each oval tail-lamp cluster, on the rounded corner outboard of the red lamp | - | `photo-t3sucs-front-three-quarter.jpg`, `photo-t3sucs-7290-door-side.jpg`, `photo-t3-6102-rear.jpg` |
| T6A5 | the amber top of the lamp cluster at each corner of the end, above the headlights | the same at the rear corners | - | `photo-t6a5-8601-front.jpg`, `photo-t6a5-pair-three-quarter.jpg`, `photo-t6a5-8626-rear.jpg` |
| KT8D5 (all liveries) | the amber top of the lamp column on each chamfered cab corner | the same (it is double-ended) | one a side on each outer section, in the pier between its two windows, at their foot | `photo-kt8d5-9090-front-three-quarter.jpg`, `photo-kt8d5-9009-door-side.jpg`, `photo-kt8d5rn2p-9074-modern.jpg` |
| KT4 | an upright lamp outboard of each headlight, on the rounded corner | the outer chamber of each three-chamber tail-lamp cluster | - | `photo-kt4d-169-door-side.jpg`, `photo-kt4d-174-side.jpg`, `photo-kt4d-170-front-three-quarter.jpg` (the rear) |
| GT4 | - | - | one a side on each section, at the window sill: its only indicators | `photo-gt4-632-side.jpg`, `photo-gt4-629-three-quarter.jpg`, `photo-gt4-632-rear-side.jpg` |

The builder draws them three ways: `sideLamp()` lays a dark housing and an inset
rectangular lens on the side panel (it follows the plan, so it also sits on a
tapered cab corner); `cornerLamp()` stands a round lamp on the end along the
surface's normal, where `lamp()`'s lamp along x would sink into a steep corner; the
T6A5's lie on its flat end cap and use `lamp()`. The photographs show only the
left (window) side of the GT4; its right side carries the mirror image. The KT4's
rear clusters do not show which chamber is amber; the model takes the outer one.
Only the full detail draws them: the distant model has no lamps at all
([lod.md](lod.md)).

## Articulated trams

The KT8D5, KT4 and GT4 use the vehicle rig ([vehicle-rig.md](vehicle-rig.md)) without
steering: `articulate()` draws each rigid body as a part `section0`, `section1`, ...
(front first; a section's pivot is its hinge with the one ahead, in the middle of
the gap, at floor height) and each bellows as a part `joint0`, ... drawn by
`drawJoint`. Everything of a section - its body, sides, ends and roof equipment -
is inside its part, so it moves with it. The bogies are their own nodes and the
rig's supports ([vehicle-rig.md](vehicle-rig.md#rail-supports-and-turning-bogies)):
a bogie carries the section it is drawn in, or both neighbours when it stands under
a joint.

| design | sections (source x) | bogies | max bend |
|---|---|---|---|
| KT8D5 | 0.5..10.5, 11.2..17.1, 17.8..27.8 | one under each outer cab end and one under each joint, carrying both its neighbours | 40 deg |
| KT4 | 0.5..10.6, 11.5..21.7 | one under the middle of each | 40 deg |
| GT4 | 0.3..7.1, 7.4..14.4 | one under each, 10.0 m apart | 35 deg |

The game poses the sections on the track and calls `renderJoint()`; the site's
Pose block shows a slider per joint and no steering.

## Deviations from the drawings

- **GT4.** The source draws one rigid 14.1 m single-ended car and couples two copies
  (`tram2v`). The model is the articulated Esslingen GT4: the drawing scaled onto
  the 18.2 m body, a joint cut in at 7.1..7.4 m, the middle door moved 1.3 m back to
  stand behind it, the bogies at the published 10.0 m pivot distance, the source's
  asymmetric crown made symmetric. Its cream and red stay the drawing's.
- **KT4.** The end BMPs draw the bands at other heights than the sides; the model
  follows the sides.
- **81-71.** The drawing is 3.0 m wide; the model is the published 2.7 m. The bogie
  pivots are the published 12.6 m apart about the drawing's bogie midpoint.
- **T3 / KT8D5 / T6A5.** The XML plan's ends (15.3 / 27.8 m) are kept where the BMP
  draws the body 0.2 m shorter.
- The KT8D5's `modern` drawing is not the KT8D5R.N2 low-floor rebuild (its middle
  section is the original), so it is a `livery`; it also carries the longer roof
  covers the drawing shows.

## Native comparison

`tramComparison.ts` measures each default build against native pixel boxes in
`assets/<folder>/native/<key>/landmarks.json` (15 to 23 per design, side and end
views): the orthographic extent of the named source-tree scopes, projected back
through the map, against the box, as percentages of the canvas
([vlakosimdb-transfer](../../.agents/skills/vlakosimdb-transfer/SKILL.md)). Windows
and doors were laid from the same measurements, so they agree to the pixel; the
remaining error is the deliberate constraints above - real wheel sizes, published
bogie spacing, the end BMPs projected over the tapered sides, the GT4's joint.
`pnpm exec tsx generator/tramReport.ts` writes `COMPARISON.md`; `--baseline` stores
the current boxes as `baseline.json`.

| transfer | boxes | MAE first geometry | MAE now |
|---|---:|---:|---:|
| tram_ckd_t3 | 20 | 1.574 pp | 1.574 pp |
| tram_ckd_t6 | 18 | 1.669 pp | 1.669 pp |
| tram_ckd_kt8 | 23 | 1.310 pp | 1.312 pp |
| tram_ckd_kt4 | 17 | 2.628 pp | 2.628 pp |
| tram_kvag_gt4 | 15 | 4.102 pp | 4.102 pp |
| m_mmz_81-71l | 15 | 1.195 pp | 1.223 pp |

The KT8D5 and 81-71 rose slightly when the published length (the XML's 0.5 m body
end) and bogie pivot distance replaced the first mapping.

## Reviewing a model

`pnpm exec tsx generator/orthoViews.ts <id> <dir> [name=value ...]` renders right,
left, front, rear and top orthographic views and the thumbnail of any parameter
combination; `pnpm exec tsx generator/treeIds.ts <id> [name=value ...] [filter]`
lists the source-tree scope ids with their extents, for writing landmarks.

## Tests

`test/trams.test.ts`: the ids, catalog and defaults; every parameter combination on
its wheels, in the rail envelope (3.1 m wide, 4.7 m fixed, 6.5 m with the
collector), under 16,000 triangles and free of z-fighting; the published lengths,
widths, heights and bogie spacings; the wheels on standard gauge; exactly one
raised collector at the wire (the KT8D5's second folded) and none on the metro;
amber indicators on both sides at both ends of every tram, clear of the centre
line and the middle, and each design's indicators in the scopes its photographs
put them in;
the articulated trams' sections, joints, hinges in their gaps and bogies on their
own sections; the windows and doors on their native boxes and the recorded MAEs.
The catalog sweep (`test/catalogSweep.ts`) and `test/rig.test.ts` pose them through their JS modules.
