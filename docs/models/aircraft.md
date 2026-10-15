# Aircraft

**Covers** - the three procedural aircraft (the Aero A.10 biplane, the Airbus A380 and the
light business jet), the reference GLBs and photos they reproduce, their axes, datums,
sizes and triangle budget, the retractable-gear parts, the body/decal technique they are
built with, and where they deviate from the references.
**Code** - `generator/aircraft.ts`, `generator/meshCore.ts` (`sweep`, `loft`, `slab`, `facets`, `part`), `generator/vehicleParts.ts` (`block`), `test/referenceModels.test.ts`, `test/models.test.ts`, `test/jsModel.test.ts`
**See also** - [vehicles.md](vehicles.md) (the road and rail vehicles, `sweep`, parts), [skyscrapers.md](skyscrapers.md) (the mesh builder, "Flicker"), [export.md](export.md), [source-tree.md](source-tree.md)

## The designs

Each design replaces the hand-authored GLB of the same name in the game's model
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
| `veh-light-jet` | `light-jet.glb` | `assets/light-jet/` | fuselage on X, nose +X, wings on Z | 17.60 / 6.16 / 15.30 | about 3 250 (15 064) |

All three match the reference bounds to the centimetre. The family budget is 20 000
triangles (`test/referenceModels.test.ts`); each design spends well under half of
what its reference does.

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

Real size, nose at +Z, in the reference's neutral livery: white fuselage, alloy wings
and tail, the navy fin and exhaust plugs. The photo is an Emirates aircraft; its
livery is deliberately not copied. The fuselage is 21 stations of a 32-point oval
(exponent 2.1) measured off the reference, closed by a cone at the nose. Two decks of
windows every 1.05 m (the reference has one every 1.62 m; the photo shows them close
set), broken by five main-deck and three upper-deck doors drawn as light grey panels,
two cockpit side panes a side and a windscreen wrapping onto the nose. A belly fairing,
wing-root fairings, an APU exhaust. The wing is cranked and swept with dihedral (six
airfoil stations from the reference: root chord 17.7 m, tip 2.7 m), with wingtip
fences and four flap-track fairings a side (the photo). Four nacelles (intake lip,
dark fan face and spinner, alloy nozzle, navy plug) on pylons ahead of and under the
leading edge, the tailplane and the fin.

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

## Retractable gear: the parts

The game hides the GLB node named exactly **`gear`** in flight (see the `_comment`
of `aircraft.meta.json`). The A380 and the light jet are therefore drawn as two
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
