# Cable car cabins

**Covers** - the procedural cable car cabins (the aerial tramway car, the small gondola and the parametric chairlift chair), the reference GLBs and photos they reproduce, their dimensions, the rope, door-sill and seat datums the webapp hangs them by, the chair's parameters, the triangle budget and the deviations from the references.
**Code** - `generator/cableCabins.ts`, `test/chairlift.test.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`
**See also** - [vehicles.md](vehicles.md) (the `sweep` primitive, `vehicleParts.ts`), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

| id | title | reference GLB | photos | size (x * y * z) | triangles |
|---|---|---|---|---|---|
| `veh-cablecar-cabin` | Aerial Tramway Car | `db/cablecar/glb/cablecar-cabin.glb` | `assets/cablecar-cabin/` | 3.23 * 6.93 * 10.16 m | about 3,400 |
| `veh-gondola-cabin` | Small Gondola | `db/cablecar/glb/gondola-cabin.glb` | `assets/gondola-cabin/` | 2.08 * 4.89 * 2.11 m | about 3,100 |
| `veh-chairlift-chair` | Chairlift Chair | none (new design) | `assets/chairlift/` | 2.36-4.48 * 3.80 * 1.23 m (by seats) | 1,390-2,310 |

Both stand in for the hand-authored GLBs of the same names in the webapp's model
database (`rail-island-webapp/db/cablecar/`), so they keep those models' axes and
bounding boxes (`test/referenceModels.test.ts` allows 10% per axis; both are
within 1.5%). `CABLE_CABINS` lists them with `CABLE_CABIN_CATALOG` (category
`Cable car`, group `cabin`). Each is one mesh without parts. The budget for a
cable cabin is 8,000 triangles.

## Datums

The webapp positions a cabin by two fractions of the model's height, measured
off the reference and kept in `db/cablecar/cablecar.meta.json`: `ropeFrac` (the
rope through the sheaves or grip) and `boardFrac` (the door sill the station's
boarding platform is built to). The models are drawn so both stay true:

| design | height | rope | ropeFrac | sill | boardFrac |
|---|---|---|---|---|---|
| tramway car | y 0 .. 6.93 | 6.66 (sheave axis) | 0.961 (meta 0.9603) | 0.70 | 0.101 (meta 0.1009) |
| gondola | y -0.10 .. 4.795 | 4.14 (grip jaws) | 0.866 (meta 0.866) | 0.43 | 0.108 (meta 0.109) |

The constants are `CAR.axis` / `CAR.sill` and `GON.rope` / `GON.sill`; change a
datum only together with the meta entry.

The chairlift chair has no meta entry yet (no webapp model); its datums are fixed
for every variant so one entry will fit them all: the rope at **y 3.60** (`CHAIR.rope`,
through the grip jaws, along x) and the **seat top at y 0.62** (`CHAIR.seat`). The
footrest's lowest point is y 0.0 and the grip rollers' top 3.80, so ropeFrac is
0.947 and the seat 0.163 of the height; a boarding platform belongs about 0.45 m
below the seat, at y 0.17 (0.045).

## Aerial tramway car

Authored across its length like the reference: the body is long on **z**
(the webapp's `yaw` is 90), wide on x, standing on y = 0.

- **Body** - one lofted shell over rounded-rectangle rings (0.6 m plan corners),
  charcoal, rounded under the floor and at the roof edge. Two proud red stripes
  run all the way round (0.80-1.02 and 2.565-2.735 m), and between them a
  recessed tinted window band (1.10-2.55 m) wraps the ends as well, as in the
  photo. Seven window posts a side; two doors a side framed by graphite posts
  (z +-1.93 .. +-3.17, starting at the 0.70 m sill) with a sill plate; each end has a
  windscreen post, a bumper and two lamps.
- **Roof** - the air conditioner (with slats) and the equipment box, two
  antennas and the white yoke base with its two hinge pivots.
- **Mast** - a four-chord white lattice leaning toward +z (rungs on eight
  levels, diagonals on all four faces) and two bracing booms down to the roof
  ends.
- **Carriage** - the head and beam, four running sheaves (dark wheel, white
  rim, cheek plates, axle) on the rope axis at y 6.66, and the haul rope grip on
  the +x side.

Deviations: the reference's sheave arms shared a face with the sheaves and the
sheaves sat half inside the carriage beam; here the beam is lower (6.22-6.36 m)
and the sheaves are carried by cheek plates. The photo shows a single curved
hanger of a different car; the reference's lattice mast is kept, the photo
informs the wrap-round glazing and the red framing.

## Small gondola

The rope runs along **x** (yaw 0); the door faces +z.

- **Body** - a 36-sided lathe: a red belly dish, the black rubber bumper whose
  top is the door sill (0.43 m), the red skirt swelling to a proud waist rail at
  1.0 m, the tinted glazing leaning in to the roof rail at 2.6-2.7 m and a red
  dome. Six red ribs follow the glass; the two either side of the door run down
  to the sill. The door has a dark centre joint, dark edges in the skirt and a
  steel handle.
- **Roof** - six dark vents and the steel hanger plate.
- **Hanger** - a steel arm with a dark collar, then the detachable grip: its
  body under the rope, two steel jaws closing on a short piece of haul rope at
  y 4.14, a spring box beside it and a carriage carrying two running wheels on
  top (to 4.795 m), as in the photo where the grip head rises above the cable.

Deviation from the reference GLB: the reference's hanger put the rope at the
very top (y 4.74, a fraction of 0.989) and its floor pan at 0.315 (0.085),
neither of which matches the meta entry (0.866 and 0.109, measured on an
earlier, taller version). This model follows the meta, so the game's rope runs
through the grip jaws and the platform meets the door sill. The reference's
interior benches and skid bars are left out (the glass is opaque).

## Chairlift chair

A detachable chair of the kind in the user's photo (`assets/chairlift/`):
orange tinted weather bubbles over six-seat chairs, a curved hanger, a grip
running on small rollers. The rope runs along **x** (yaw 0, like the gondola);
the riders face **+z**. Parameters (defaults first), 36 variants:

| parameter | values | what changes |
|---|---|---|
| `seats` | `6`, `4`, `8` | the chair's width: 0.53 m a place, 2.12 / 3.18 / 4.24 m of seats; the photo's six-seater is the default |
| `cover` | `bubble`, `none` | the closed weather bubble, or an open chair (the frame, safety bar and footrest stay) |
| `color` | `orange`, `blue`, `red`, `yellow`, `green`, `grey` | finish only: the bubble and, a shade darker, the cushions |

- **Seat** - a dark seat pan between a front and a rear cross tube, a cushion
  per place, a backrest per place leaning back about 9 degrees on a dark back
  shell, a short armrest after every second place.
- **Side frames** - at each end a bent tube from the top beam down past the
  bubble's pivot hub to the seat and forward into an armrest loop; the steel
  top beam joins the two over the backrest.
- **Safety bar and footrest** - the bar lies along the bubble's lower edge
  (y 0.90, z 0.62) on arms from the pivot hubs; links drop from it to the
  footrest bar (underside at y 0) with a footplate per place.
- **Bubble** - a 2.5 cm shell on an arc of radius 0.95 m about the pivot axis
  (y 1.25, z -0.30), from 100 degrees (just behind the top) to -20 degrees (the
  riders' laps), straight across the seats and closing to the hubs in
  superelliptic domes 0.42 m long. Opaque tinted colour, as the factory has no
  transparent materials; it is drawn closed, as in the photo.
- **Hanger and grip** - a steel tube straight down from the grip, curving back
  over the riders' heads to the top beam (six straight lengths of a quadratic
  curve), a number plate, the grip body under the rope, two jaws closing on a
  short piece of haul rope and a head plate carrying four rollers above it.

The parts: one mesh, no rig. The LOD keeps the `body` scope (the chair and its
bubble). The budget is the cabins' 8,000 triangles; the eight-seater with the
bubble is the largest at about 2,310.

## Checking

`pnpm exec vitest run test/chairlift.test.ts`,
`pnpm exec vitest run test/referenceModels.test.ts test/models.test.ts -t "cablecar|gondola"`
and `pnpm exec vitest run test/jsModel.test.ts -t "cablecar|gondola"`; look at
`export/thumbs/<id>.png` after `pnpm build:models`.
