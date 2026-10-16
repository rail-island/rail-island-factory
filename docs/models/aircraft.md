# Aircraft

**Covers** - the seven procedural aircraft (the Aero A.10 biplane, the Airbus A380, the
Boeing 737-800, MD-11, Boeing 747-400, Airbus Beluga and the light business jet), the reference GLBs and photos they reproduce,
their axes, datums, sizes and triangle budget, the airline liveries of the A380 and the
737, the retractable-gear parts, the body/decal technique they are built with, and where
they deviate from the references.
**Code** - `generator/aircraft.ts`, `generator/strokeFont.ts` (the Beluga's titles), `generator/meshCore.ts` (`sweep`, `loft`, `slab`, `facets`, `part`), `generator/vehicleParts.ts` (`block`), `test/referenceModels.test.ts`, `test/aircraft.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`, `.agents/skills/aircraft/SKILL.md`
**See also** - [vehicles.md](vehicles.md) (the road and rail vehicles, `sweep`, parts), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

The original designs replace the hand-authored GLB of the same name in the game's model
database (`rail-island-webapp/db/aircraft/glb/<name>.glb`), so it keeps that model's
axes, nose direction and bounding box: the game's `yaw` and `targetLength` in
`db/aircraft/aircraft.meta.json` are measured off them. `AIRCRAFT` in
`aircraft.ts` lists them; `AIRCRAFT_CATALOG` holds the shared catalog fields (category
`Aircraft`, group `aircraft`, scale 1, CC0 by Rail Island). **The ids are stored in
saved maps: never rename one.**

| id | reference GLB | photos | axes | size x / y / z (m) | triangles (reference) |
|---|---|---|---|---|---|
| `veh-aero-a10` | `aero-a10.glb` | `assets/aero-a10/` | fuselage on Z, nose +Z, wings on X | 14.68 / 3.99 / 10.23 | about 2 150 (10 852) |
| `veh-airbus-a380` | `airbus-a380.glb` | `assets/airbus-a380/` | fuselage on Z, nose +Z, wings on X | 78.86 / 23.50 / 74.30 | about 8 800 (16 748) |
| `veh-boeing-737` | (the earlier factory model) | - | fuselage on X, nose -X, wings on Z | 39.48 / 12.55 / 35.78 | about 4 500 |
| `veh-light-jet` | `light-jet.glb` | `assets/light-jet/` | fuselage on X, nose +X, wings on Z | 17.60 / 6.16 / 15.30 | about 3 250 (15 064) |

The A.10, the A380 and the light jet match the reference bounds to the centimetre;
the 737 has the real aircraft's size. The budget is **10 000 triangles per aircraft**,
every livery included (`test/aircraft.test.ts`, `test/referenceModels.test.ts`, the
`aircraft` skill).

### Aero A.10

The 1922 Czechoslovak four-seat airliner. A boxy fabric fuselage (superellipse
sections, exponent 3.2) with four round-topped cabin windows a side, the open pilot's
cockpit and its small windscreen behind the cabin, an angular aluminium engine cowling
with nine louvre slots a side, black radiator blocks on the flanks, a left-hand
exhaust pipe, a two-blade twisted walnut propeller on a steel spinner. Two straight
wings with rounded tips (the chord closes from both edges over the last 0.6 m), steel
N-pairs of interplane struts at 2.55 and 5.3 m, cabane struts, X wire bracing in
the front and rear plane of each bay and out to the tips. A cruciform tail with
rounded tailplane tips and fin, tail bracing wires, a walnut tail skid. The fixed
undercarriage is two V-legs, a cross brace and an axle, with black tyres and cream
wheel discs (the photo). It stands level on the wheels, y = 0, as the reference does.
The gear is fixed, so the model has **no parts**.

### Airbus A380

Real size, nose at +Z. Its default livery is the reference's neutral one: white
fuselage, alloy wings and tail, the navy fin and exhaust plugs; five airline liveries
are a parameter (see Liveries). The fuselage is 21 stations of a 32-point oval
(exponent 2.1) measured off the reference, closed by a cone at the nose. Two decks of
windows every 1.05 m (the reference has one every 1.62 m; the photo shows them close
set), broken by five main-deck and three upper-deck doors drawn as light grey panels,
two cockpit side panes a side and a windscreen wrapping onto the nose. A belly fairing,
wing-root fairings, an APU exhaust. The wing is cranked and swept with dihedral (six
airfoil stations from the reference: root chord 17.7 m, tip 2.7 m), with wingtip
fences and four flap-track fairings a side (the photo). Four nacelles (intake lip,
dark fan face and spinner, alloy nozzle, navy plug) on pylons ahead of and under the
leading edge, the tailplane and the fin.

### Boeing 737-800

The narrow-body airliner at its real size: 39.5 m long, 35.8 m across the winglets,
12.55 m to the fin tip, nose at -X (yaw 0), as the earlier model it replaces. It is
drawn nose at +X and turned 180 degrees about Y by `TurnedBuilder`, a `MeshBuilder`
whose frame maps (x, y, z) to (-x, y, -z). The fuselage is 32-point ovals (exponent
2.1): a two-station parallel cabin 3.76 m wide, a tail cone sweeping up to the APU
exhaust, and the nose from `b737Nose()` - superellipse closing curves for the crown
(falling from x = 14.2 through the windscreen), the sides (from 13.2) and the keel
(rising from 12.0) to a radome tip 2.7 m up, eleven stations densest at the tip. Two
flat windscreen panes on the nose and two side panes a side, cabin windows every
0.508 m broken by the two overwing exits, the forward and aft doors, a belly fairing.
The cranked wing has 6 degrees of dihedral and blended winglets; three flap-track
fairings a side; CFM56 nacelles with the flat-bottomed intake (`NacelleSpec.squash`)
on short pylons ahead of the leading edge; the tailplane and the fin with its dorsal
fillet. The gear part has a twin-wheel nose leg and two twin-wheel main legs (track
5.72 m, wheelbase 15.6 m).

### Light jet

A Learjet-like business jet, nose at +X. A round 24-point fuselage measured off the
reference, with the nose drooped by up to 0.2 m and a dark tailcone tip; seven oval
windows a side, a side pane and a raked two-piece windscreen on the nose, the photo's
red cheatline below the windows. A low swept wing over a ventral wing fairing, canted
winglets with a red band (the photo), two rear-fuselage engines on pylons, the red
fin with a dorsal fillet, the T-tailplane and its bullet fairing, ventral strakes and
a dorsal antenna. Its datum is the reference's: the fuselage axis on y = 0 and the
(tall) gear reaching y = -2.55, the twin nose wheels and the two main legs with
their doors.

## Liveries

The A380, 737, MD-11 and 747 take a `livery` parameter (a finish parameter); its first value,
`neutral`, is the default, so the exported GLB of the A380 is the same as before the
liveries existed. The others reproduce the colour fields of the main carriers'
schemes, with simplified tail emblems and no titles:

| design | liveries |
|---|---|
| A380 | `neutral`, `emirates` (UAE flag on the fin), `singapore` (blue fin, yellow bird, blue and yellow lower cheatline), `qantas` (red fin, white kangaroo, silver band onto the rear fuselage), `lufthansa` (2018: dark blue fin running onto the rear fuselage, crane ring), `britishAirways` (midnight blue belly, red speedmarque, Union flag fin) |
| 737 | `neutral` (navy fin and winglets), `ryanair` (blue belly, engines and fin, yellow harp), `southwest` (Heart: bold blue over silver, sunrise yellow and warm red stripes), `united` (2019: runway grey belly, rhapsody blue swoop, blue fin with globe, blue engines), `klm` (sky blue over white, dark blue cheatline, white crown), `turkish` (red fin with white roundel) |

A `Livery` (`aircraft.ts`) gives the fuselage paint `skin(s, a)` by section height
(s = the sine of a section edge's angle, -1 keel to 1 crown) and position along the
axis, applied by `paintedBody` (each triangle of the sweep takes its own material, so
a colour boundary follows a section edge and needs no decal); thin `stripes` as
`skinStripe` decals; the fin's colour `bands` by height (`paintedFin` adds rings at
the band edges); `finArt`, convex shapes in (chord fraction, height) laid on both
sides of the fin by `finDecal` (cut where the foil's thickness bends, so each piece
lies flat on the skin); and the cowl and winglet materials.

## Retractable gear: the parts

The game hides the GLB node named exactly **`gear`** in flight (see the `_comment`
of `aircraft.meta.json`). All jets are therefore drawn as two
`MeshBuilder.part`s, both with pivot `[0, 0, 0]`:

- `airframe` - everything that stays visible;
- `gear` - every strut, bogie, axle, wheel and gear door.

The game measures the lift that puts the wheels on the ground once, with the gear
down, so retracting it does not drop the fuselage. The A.10 keeps its gear down for
ever and has no parts.

## How they are built

- **Bodies.** A fuselage, a nacelle, a fairing or a wing is a list of equal-length
  convex cross-sections at stations along an axis, joined by open `sweep`s (`body`)
  and closed by a cone or a flat fan (`fan`). A wing's sections are six-point
  airfoils (`foil`) along the span; fins and winglets are `loft`s through airfoil
  rings at rising heights (`fin`). Struts and wires are `rod`s, `slab`s along any
  direction.
- **Decals.** Windows, doors, windscreens, louvres and the cheatline are one-sided
  `facets` laid 6 mm to 50 mm off the skin. `secAt` interpolates a body's section
  exactly as the sweep draws it, and a ray cast inside that section (`skinY` at a
  height, `skinAng` at an angle, `skinEnd` along the axis onto a nose) finds the skin;
  `skinDecal` cuts an outline into bands so the triangles hug a curved surface. No
  two materials ever share a plane, so the coplanar check passes without insets.
- Every primitive sits in a named scope (fuselage / skin, cabin windows, wings /
  right wing / engine 1 / pylon, nose gear...), which the site shows as the source
  tree.

## Deviations from the references

- The A.10's struts and wires are thinner polygons than the reference's (4 to 6
  sides), and its windows are round-topped as in the photo rather than rounded
  rectangles.
- The A380 has more, smaller-spaced windows than the reference, adds doors, flap-track
  fairings and a windscreen on the nose, and colours the belly fairing light grey
  instead of alloy.
- The light jet adds the photo's red cheatline and winglet band, a drooped nose and a
  raked windscreen (the reference's fuselage is a plain body of revolution), and has
  twin nose wheels where the reference has one.


## New wide-body aircraft

The MD-11, 747-400 and original Beluga (A300-600ST, not BelugaXL) are new
factory designs, not replacements for game assets. They use metres, nose +X,
yaw 180, wings on Z, and wheels on y = 0. Each has `airframe` and `gear` parts
and belongs to the aircraft LOD family. Publishing them to the game remains a
separate import step.

| Design id | Length / span / height (m) | Finishes |
|---|---|---|
| `proc-vehicle-mcdonnell-douglas-md11` | 61.21 / 51.66 / 17.60 | neutral, KLM, Swissair classic, FedEx Express |
| `proc-vehicle-boeing-747` | 70.66 / 64.44 / 19.41 | neutral, British Airways, Lufthansa, KLM |
| `proc-vehicle-airbus-beluga` | 56.15 / 44.84 / 17.24 | Airbus Transport International white and blue |

### How the wide bodies are shaped

A wide-body fuselage section is the outline of two egg-shaped **lobes** (`hullSec`):
the lower lobe is the round fuselage, the upper one the 747's upper deck or the
Beluga's cargo bulge (the MD-11 has none). The outline is their convex hull with
the switch between the lobes blended over 0.3 m, so the join is a smooth, slightly
waisted flank and the seam never jumps between section points from one station to
the next. Point k of every section sits where the outline's normal is at
(k + 0.5) / n of a turn, as on an `oval`, so `paintedBody` paints it by height.
Each lobe's keel, crown, half-width and widest height are functions of the
distance behind the nose tip: superellipse closures (`closeTo`) towards the tip,
which give a blunt nose with a vertical tangent, and monotone keyframed curves
(`curve`) along the tail cone. Stations are densest at the nose and along the
tail cone. Because a blended section can be slightly concave, the windscreen
(`skinEnd`) uses the crossing rule (`insideAny`) instead of the convex test.

Reference dimensions used (metres, gear down):

| | MD-11 | 747-400 | Beluga A300-600ST |
|---|---|---|---|
| fuselage | 6.02 round, keel 1.99 | 6.5 wide, main deck crown 8.95, hump crown 10.42 | A300 lobe 5.64 under a 7.7 m bulge, crown 11.62 |
| nose tip height | 4.25 | 4.55 | 3.95 (lowered cockpit) |
| wing | LE sweep ~38 deg, crank at 9.4 m, upper and lower winglets | LE sweep ~40 deg, crank at 12 m, winglets canted out 29 deg | LE sweep ~32 deg, crank at 8.6 m, wingtip fences |
| engines (semi-span) | 8.6 and the centre engine through the fin root | 11.9 and 21.0 | 7.6 |
| gear | nose, two 4-wheel bogies (track 10.6), 2-wheel centre leg | nose, wing bogies at 5.5 and body bogies at 1.9 | nose, two 4-wheel bogies (track 9.6) |

The MD-11 has the DC-10's round nose, a long tail cone ending under the centre
engine, the centre engine on a broad fairing with the fin rising from its top,
winglets above and below the tip, and a belly fairing under the wing box. FedEx
represents the freighter and omits passenger windows. Swissair uses a red
cheatline under the windows, silver belly and engines, and a white cross on a red
tail; KLM uses sky blue over a white belly with a dark blue line between and a
simplified white crown; FedEx uses a purple fin and orange accent.

The 747's upper deck is a blunt dome rising from just above the nose bullet past
the steeply raked windscreen to the hump's level crown, which runs back to about
the wing root and fairs into the main deck crown by d = 32 m. Two window rows
(main and upper deck), five doors a side, four turbofans on pylons, canted
winglets and four four-wheel main bogies. British Airways has a blue belly and
simplified Union flag tail; Lufthansa has a white fuselage and blue fin with a
simplified white crane ring.

The Beluga's front is unlike an ordinary airliner's: the lower fuselage runs
forward as a long, narrow bill whose chin rises gently over the last 17 m to a
low tip (4.4 m), and the cockpit sits tucked low on top of it, below the
fuselage's upper line. Right above the windscreen the cargo door's forehead
slants up and back at about 50 degrees and rounds over into the bulge's crown,
which runs level and slopes down over the raised tail cone. The Beluga's lobes
are keyframed curves from tip to tail. Its section is an inverted pear (the
bulge's lobe over the A300's). It has the A300-600's wingtip fences, the
enlarged fin and the endplate fins on the tailplane. The livery is white with the
tail cone and fin in Airbus blue. The blue starts behind a slanted plane (a
livery's `cut`, drawn by `cutBody`, which clips every skin triangle the plane
crosses), so its edge is one straight diagonal from the keel at x = -16 up and
back, not a staircase of whole triangles. "AIRBUS BELUGA" titles run along the bulge on
both sides, drawn with the stroke font (`strokeFont.ts`) and split into short
triangles (`splitLong`) so the flat letters follow the curved skin. It has no
passenger windows or airline selector. The other wide bodies omit operator
titles and detailed logos. All finishes remain below 10,000 triangles (the
British Airways 747 is the largest, about 9,900), with finite geometry, real
bounding dimensions and no coplanar material overlaps checked in
`test/aircraft.test.ts`.
