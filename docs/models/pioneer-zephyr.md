# Pioneer Zephyr

**Covers** - the Burlington's Pioneer Zephyr (`proc-vehicle-pioneer-zephyr`, Budd 1934): the cars and the train as `unit` values, the measures taken from the 1934 drawing, the power car's nose hull, the coach and the observation car on the US car builder, the articulation, the distant model, deviations and tests.
**Code** - `generator/pioneerZephyr.ts` (`PIONEER_ZEPHYR`, `pioneerZephyr`, `zephyrTrain`, `ZEPHYR_LENGTH`), `generator/usTransit.ts` (`drawCar`, `carLodBody`, `truckSpec`), `generator/carbodyKit.ts`, `generator/sliceBody.ts`, `test/usTransit.test.ts`, `test/pioneerZephyr.test.ts`, `assets/pioneer-zephyr/`
**See also** - [us-transit.md](us-transit.md), [us-carbodies.md](us-carbodies.md), [vehicle-rig.md](vehicle-rig.md), [loading-gauge.md](loading-gauge.md), [lod.md](lod.md)

## The design

| `unit` | what | length | triangles |
|---|---|---|---|
| `powerCar` (default) | the power car: shovel nose, cab, engine room under the cowl, railway post office, storage mail | 22.60 m from the tip | about 13,900 |
| `coach` | baggage and express, the buffet-grill, the entrance, the 20-seat smoking compartment | 17.60 m | about 9,700 |
| `observation` | the 40-seat compartment, the entrance, the 12-seat lounge with its round end | 19.80 m to the drumhead | about 12,200 |
| `train` | the three cars articulated on two Jacobs bogies | 60.00 m | about 29,500 (16,000 a car at most) |

Each car's length is its span between the joint planes (the power car from its pilot's tip,
the observation car to its tail): the Railway Age drawing's 13 ft 6 in from the tip to the
motor truck, 60 ft 8 1/2 in to the first Jacobs bogie, 57 ft 8 in between the Jacobs bogies,
53 ft 7 in to the rear truck and 11 ft 5 in beyond it - 197 ft over the train, as published
(assets/pioneer-zephyr/SOURCES.md). The section is the published 9 ft 1 in wide and 12 ft 1 in
high; the power car's cowl over the engine room rises to 3.90 m and falls to the roof 8.8 -
10.4 m behind the tip. The motor truck has 36 in wheels, the others 30 in, all on 8 ft.

Game properties: 42, 26 and 26 t (the train 94 t, published 208,061 lb), the Winton 201-A's
600 hp (447 kW) on the power car and the train, 180 km/h.

## The power car's nose

The nose is a hull of its own (`drawNose`): the slice body's own section at the nose's joint,
2.40 m behind the tip (`halfSlice` of the body behind, point by point), drawn as horizontal
waterlines. Each waterline is a U in plan - a flat front panel (`TIP`, 38 % of the half
width), a quarter ellipse round the corner reaching the full width `PLAN_LEN` behind the tip,
the straight side to the joint - set back by the side profile (`PROFILE` to the shoulder, `DOME` over it): the pilot raked
from the tip at 0.32 m to the belt 0.38 m behind it, the face leaning back to the window sill
(0.72 m), the raked windscreen to its head (1.07 m), and over the shoulder the dome as a quarter
ellipse on the windscreen's rake, rounding back to the cowl's crown 1.85 m behind the tip. The
power car's roof arc has 12 segments (the other cars 8), so the dome's waterlines are close. Because the last column of every waterline is the body's own slice, the hull
closes on the body without a seam.

Laid on the hull (`hullPatch`, `hullBand`, points found by `at`, `normal` and `qOf`):

- the **windscreen** - the window band's faces between the sill and head waterlines are glass
  over three panes a side (the flat front split by a centre post, the corner, the side),
  stainless posts between them;
- the two **arched grilles** over the windscreen, either side of a centre pillar, black with
  15 stainless bars and a continuous rim round each arch's head;
- the **headlight** on top of the dome between them (the 1934 single lamp, its housing running
  back into the dome), and a marker lamp on each side of the dome;
- the **ribbed belt** (four bright ribs on a dark band, 1.16 - 1.41 m) wrapping round the nose
  and running along every car;
- the red-bordered black **BURLINGTON ROUTE** plate on the flat front, the coupler's pocket in
  the pilot, **9900** on each side of the nose.

Behind the nose the car is the carbody kit's slice body (`carbody`, `carbodyShell`): the
cowl as a crown and shoulder table, the skirt cut over the motor truck and over the rear truck
or, in the train, the Jacobs bogie, its cut-outs rounded into arches (`cutRadius` 0.55 m) on
every car. Its sides carry the belt, the fluting (`sideSteel`, broken
over doors and the BURLINGTON panel), the crew door, the railway post office's door, barred
windows and lettering, the storage mail door, and the roof's corrugations behind the cowl.

## The coach and the observation car

Both are `CarDef`s drawn by the US car builder (`drawCar`, us-transit.md) on the same section:
plug doors opening onto the generic cabin, window rows, the belt, fluting and lettering panels
(EXPRESS, BURLINGTON ZEPHYR). The observation car's lounge end is a slice nose (`TAIL`: the
roof falling, the skirt rising, a round plan) with the windows wrapping round it, the belt and
fluting wrapping round onto the end wall (`tailSteel`), the drumhead and two red marker lamps;
it has neither a gangway nor a coupler there.

## The train and single cars

`zephyrTrain()` lays out the three cars front to back, centred. As a train they are three
sections (`articulate`) hinged at the joint planes, the power car's motor truck and the
observation car's rear truck under the ends and a Jacobs bogie under each joint, carrying both
sections: four supports. The joint covers follow the body's section. A single car stands on
its own: it has its own truck 2.20 m inside each joint plane, the diaphragm and a knuckle
coupler there, and the skirt cut over those trucks instead.

## Low level of detail

`pioneerZephyrLod`: the power car's unit body takes the nose's profile and plan as its front
end, the windscreen as its window and the cowl as a roof part; the trailers use the car
builder's `carLodBody`. About 90 triangles a car, under 300 for the train.

## Deviations

- The nose is faceted (14 columns round the corner, the section's own waterlines up the dome),
  so its curves read as panels; the grilles' arches are half ellipses.
- The cars' interiors beyond the generic cabin (the railway post office, the buffet, the
  lounge's chairs) and the engine are not drawn; the side door and window positions follow
  the drawing to about 0.2 m.
- The later twin headlights, the PIONEER ZEPHYR lettering on the tail and the fourth car of
  1935 are not modelled: the model is the train as delivered in 1934.

## Checking

`pnpm exec vitest run test/usTransit.test.ts test/pioneerZephyr.test.ts`: every unit inside the
US gauge and the budget without coplanar faces, each car at its length on two supports, the
train's three sections on four supports; the nose's tip, belt, window band and cowl where the
drawing puts them; the hull closing on the body; deterministic bytes. The doors, cabins and
supports are also checked by the generic suites.
