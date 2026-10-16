# Mainline electric locomotives from vlakosimdb

**Covers** - `veh-cd-180` (CD 180 / 181 / 182), `veh-dnt-184-5` (DNT 184.5), `veh-db-111` (DB 111), `veh-dr-243` (DR 243 / DB 143 / 112), `veh-obb-1012` and `veh-obb-1040`: what each design covers, the data-driven box-cab builder they share, the native comparison, deviations, what was left out and the tests. The DB 180 is a livery of `veh-cd-263` ([loco-liveries.md](loco-liveries.md)).
**Code** - `generator/mainlineElectrics.ts` (`MAINLINE_ELECTRICS`), `generator/boxLocoKit.ts`, `generator/cd181.ts`, `generator/dnt184.ts`, `generator/db111.ts`, `generator/dr243.ts`, `generator/obb1012.ts`, `generator/obb1040.ts`, `generator/mainlineComparison.ts`, `generator/mainlineReport.ts`, `test/mainlineElectrics.test.ts`, `assets/cd-181/`, `assets/dnt-184/`, `assets/db-111/`, `assets/dr-243/`, `assets/obb-1012/`, `assets/obb-1040/`
**See also** - [vehicles.md](vehicles.md), [parameters.md](parameters.md), [cz-electrics.md](cz-electrics.md) (the kit this builds on), [loco-liveries.md](loco-liveries.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

All six are rigid rail vehicles in `RAIL_CATALOG` (group `loco`), registered as
one family in `generate.ts` (`mainlineElectrics.ts`, which also exports their
build functions for the JS models). A `livery` value names its vlakosimdb model.

| id | `livery` | vlakosimdb model | number | look |
|---|---|---|---|---|
| `veh-cd-180` | `cd180` | `cd_180` | 180 001-0 | two greens, louvre banks and two divided windows a side |
| | `cd181` (default) | `cd_181` | 181 105-8 | cream over green, grey lines, six windows a side |
| | `cd181Okd` | `cd_181-okd` | 181 056-3 | OKD Doprava: cream, a navy window band, the navy cab band |
| | `cd182` | `cd_182` | 182 099-2 | cream, yellow and green; the 182's window order |
| `veh-dnt-184-5` | `dnt1845` (default) | `dnt_184.5` | 184 503-1 | dark green with ribbed sides, cream band |
| | `dnt1845No1` | `dnt_184_5#1` | 184 501-5 | lighter green, olive ends, beige roof |
| | `dnt1845No2` | `dnt_184_5#2` | 184 502-3 | as #1 (vlakosimdb's 160 km/h gearing; nothing visible) |
| `veh-db-111` | `db111` (default) | `db_111` | 111 024-6 | verkehrsrot, the white band across the ends |
| | `db111Bb` | `db_111_bb` | 111 174-9 | ozeanblau-beige |
| | `db111S` | `db_111_s` | 111 143-4 | S-Bahn orange and white |
| `veh-dr-243` | `dr243` (default) | `dr_243` | 243 864-6 | DR red with the white line |
| | `db143` | `db_143` | 143 617-9 | S-Bahn orange, white and yellow |
| | `db143vr` | `db_143vr` | 143 837-3 | verkehrsrot, grey frame, the white band across the ends |
| | `db112` | `db_112` | 112 139-1 | red, the white chevron under the windscreens; 8.4 m pivots |
| `veh-obb-1012` | - | `obb 1012` | 1012.001 | white, the red machine room and cab sweeps |
| `veh-obb-1040` | - | `obb_1040` | 1040 013-3 | blood-orange red with the yellow line |

The DNT 184.5 is the Skoda 93E of Doly Nastup Tusimice (now SD - Kolejova
doprava), four built in 1994-1999 for the Kadan - Tusimice coal line. The DB 112
(the former DR 212) shares the 243's LEW body, so it is a `veh-dr-243` livery
whose bogie pivots stand 8.4 m apart instead of 8.5 m.

| id | over buffers | body | pivots | wheelbase | wheels | collectors | triangles |
|---|---|---|---|---|---|---|---|
| `veh-cd-180` | 18.80 m | 17.6 m | 8.2 m | 2 x 2.4 m (Co'Co') | 1.25 m | diamond | 13,200 to 13,500 |
| `veh-dnt-184-5` | 20.346 m | 19.3 m | 2 x 5.5 m (Bo'Bo'Bo') | 3.1 m | 1.25 m | single-arm | 12,300 to 12,400 |
| `veh-db-111` | 16.75 m | 15.5 m | 7.9 m | 3.4 m | 1.25 m | single-arm | 11,700 to 12,100 |
| `veh-dr-243` | 16.64 m | 15.4 m | 8.5 / 8.4 m | 3.3 m | 1.25 m | single-arm | 12,900 to 13,100 |
| `veh-obb-1012` | 19.30 m | 18.3 m | 9.9 m | 2.8 m | 1.15 m | single-arm | 11,900 |
| `veh-obb-1040` | 12.92 m | 11.8 m | 7.6 m | 2.4 m | 1.30 m | diamond | 10,200 |

Every design has two collectors: the rear (-X) raised to 5.87 m and the front
folded. Dimensions are the published ones where they exist (each folder's
`SOURCES.md`); where vlakosimdb's body is shorter (the OBB 1012 by 6 %, the
1040 by 5 %) its x is scaled to the published length and the scale is part of
the native mapping.

## The builder (`boxLocoKit.ts`)

`buildBoxLoco(spec)` turns a `LocoSpec` - data, no code - into a locomotive:

- **the shell** - the end's centre line `tip(y)`, the half width `hw(y)` and the
  end's plan, from the XML `alongz`, `alongx` and `alongy` clips, lofted by
  `shell` from [cz-electrics.md](cz-electrics.md)'s kit with the livery's side
  and end bands; `corner` picks whether the plan's last segment takes the side's
  or the end's paint;
- **side items** (`SideItem`, u = x): framed windows (optionally divided),
  grilles with horizontal or vertical slats, doors (seams, window, handrails,
  steps), paint (rectangles or convex outlines, layered), raised panels, ribs
  and the number plate; `sides` puts an item on one side only, `mirror` draws a
  cab item at both ends;
- **end items** (`EndItem`, u = z): windscreens with wipers, lamps, paint,
  grilles and the number plate, laid with `surfacePanel` so they follow the
  raked and curved ends - an item is cut at the end plan's corners at every
  height it spans, and paint is cut into slabs at the profile's kinks so a
  slanted edge (the 112's chevron, the 1012's sweeps) stays on the skin;
- **running gear** - the kit's two-axle `bogie`, or `bogie3` (three wheelsets on
  a long dipping plate frame) for the Co'Co' 180; the kit's `buffers`; a plough;
- **roof** - trapezoidal boxes, an optional high-voltage line, and the kit's
  `diamond` or `singleArm` pantographs.

## The bodies

- **CD 180 / 181 / 182**: the 181's rounded ends (1.0 m back at the sides in
  plan), the windscreens raked 0.2 m, the roof rolling over with the roof
  headlight, the resistor cover between the collectors, hatches on the cant.
  A livery picks its machine-room side: the 181's six windows (two divided),
  the 182's order, or the 180's two divided windows and four louvre banks over
  dark intakes (from `cd_180`, whose own body is cruder and is not used).
- **DNT 184.5**: an upright nose with the windscreens raked 0.8 m back, ribbed
  sides; windows on the right (two large, two small divided) and ten grille
  bays on the left, three roof covers, three two-axle bogies.
- **DB 111**: the pointed ends (0.88 m back at the sides), the sides leaning in
  above the waist, two grille banks with three windows between them, the
  emblem, the roof cover.
- **DR 243 / DB 143 / 112**: the LEW body with rounded corners, the ribbed
  machine room, three grilles along each roof edge, cab doors and windows.
- **OBB 1012**: the long rake to a narrow roof fairing, one wide windscreen, the
  upper sides leaning in, the red machine room and the sweeps down the cabs.
- **OBB 1040**: the blunt V ends, six louvre panels and two windows a side,
  cab doors, the deep grey frame.

## Comparison

`mainlineComparison.ts` measures the default build of each design (actual GLB
vertices of named scopes, orthographically projected) with
`czElectricComparison.ts`'s `compare` against 9 to 17 boxes per design annotated
on the native BMPs (`assets/<folder>/native/landmarks.json`; the front at the
+X end and the +Z side). `pnpm exec tsx generator/mainlineReport.ts` writes each
folder's `COMPARISON.md`; the first run recorded `native/baseline.json`. Mean
absolute errors at this revision: CD 181 0.34, DNT 184.5 0.32, DB 111 0.49,
DR 243 0.63, OBB 1012 0.49, OBB 1040 0.58 percentage points; every box is
within its stated tolerance. A band seen on the end includes the side bands of
the corners where the corners carry the side's paint.

## Deviations

- The CD 180 is drawn on the 181's body (the real E 669.0 has larger
  windscreens); the OKD livery's navy window band is laid over the machine room
  only, as the native draws it.
- The DNT prototypes `#1` and `#2` draw the grilles on the other side and a
  slightly longer rake; the design keeps one body and changes the paint.
- The OBB 1012's asymmetric sweeps are drawn alike at both ends (the native's
  front one), cut where the side meets the rounded nose.
- Emblems are plain panels (the 1012's a slanted one); lettering other than the running number, cab
  interiors, cables and hoses are not modelled.

## Left out

`db_143 007` is archived in the game (`rail-island-webapp/db/archived.json`)
and was not converted.

## Tests

`test/mainlineElectrics.test.ts`: the ids, parameters and defaults; for every
parameter combination the length over the buffers, the axle positions, wheel
contact and gauge, the 3.1 m x 4.7 m envelope and 6.5 m operating height, the
triangle budget, and the collectors (the rear raised to 5.87 m and the front
folded, level strips, the diamond's eight arms or the single arm's A-frame);
every native landmark within its tolerance; valid running numbers; each side's
own equipment (the DNT's windows and grille bays, the 180's louvres) and the
112's pivots. `test/models.test.ts` and `test/params.test.ts` cover the designs
with the others (determinism, flicker, the JS model).
