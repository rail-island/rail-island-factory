# Japanese conventional-line electric units

**Covers** - the seven Japanese narrow-gauge-line units (`proc-vehicle-jr-e235`, `-jnr-103`, `-odakyu-gse`, `-kintetsu-hinotori`, `-jr-e259`, `-jnr-485`, `-hankyu-9000`): their series specs on the Shinkansen series kit, the commuter doors and flat cabs, liveries, the gauge and tests.
**Code** - `generator/jpEmus.ts` (`JP_EMUS`, `JP_EMU_SERIES`), `generator/shinkansen.ts` (`ShinkansenSeries`, `buildSeries`, `seriesDesign`), `generator/usTransit.ts` (`drawCar`), `test/jpEmus.test.ts`, `assets/jr-e235/`, `assets/jnr-103/`, `assets/odakyu-gse/`, `assets/kintetsu-hinotori/`, `assets/jr-e259/`, `assets/jnr-485/`, `assets/hankyu-9000/`
**See also** - [shinkansen.md](shinkansen.md), [jnr-locos.md](jnr-locos.md), [jr-kiha40.md](jr-kiha40.md), [us-transit.md](us-transit.md)

## The designs

| id | title | `livery` (default first) | car (end / middle) | front |
|---|---|---|---|---|
| `proc-vehicle-jr-e235` | JR E235 | `yamanote`, `yokosuka` | 20.0 / 20.0 m, 4 doors a side | cab face (`cabFace`) |
| `proc-vehicle-jnr-103` | JNR 103 series | `chuo`, `yamanote` | 20.0 / 20.0 m, 4 doors | the low cab (`cabFace`), diamond pantograph |
| `proc-vehicle-odakyu-gse` | Odakyu Romancecar GSE | `rose`, `lse` | 19.6 / 16.0 m | the observation nose |
| `proc-vehicle-kintetsu-hinotori` | Kintetsu Hinotori | `hinotori`, `ace` | 21.0 / 20.5 m | the curved-windscreen nose |
| `proc-vehicle-jr-e259` | JR E259 Narita Express | `nex`, `original` | 20.5 / 20.0 m | the raked nose |
| `proc-vehicle-jnr-485` | JNR 485 series | `jnr`, `kyushu` | 21.0 / 20.5 m | the bonnet, diamond pantograph |
| `proc-vehicle-hankyu-9000` | Hankyu 9000 series | `maroon`, `allMaroon` | 19.0 / 19.0 m, 3 doors | flat cab |

Each is a `ShinkansenSeries` ([shinkansen.md](shinkansen.md)) built by the same code: the end
car (the default), the middle car raising its pantograph and the articulated train of 3 - 8
cars. The series kit's options used here: `doorCount` (commuter doors evenly along the car,
windows in the piers between them), `flatCab` (a flat cab end's windscreen panes, mask and
lamps in place of the nose; the end car's body is 7 cm short of its length so its lamps stand
at it), `pantograph: "diamond"`. The bodies keep their real 2.75 - 2.95 m widths and run on the
game's standard-gauge wheelsets (the prototypes' track is 1,067 mm; [jr-kiha40.md](jr-kiha40.md),
"Gauge"), inside the UIC gauge.

## The E235

Built from five photographs and the published figures (assets/jr-e235/SOURCES.md, with the
measurements). The body is upright from the waist knuckle at 1.8 m (`lean: 1`, as the real
"sustina" body with its gutter built into the side) and tucked in below it to 0.9 m.

- **Face** - a `cabFace` (`E235_FACE`) as wide as the body: upright, plan corners rounded 0.25 m,
  the lower lip curving back under it and the crown over to the roof. The livery's frame colour
  (`frame`) covers it and wraps 0.7 m back along the cab sides (`wrap`, `dJoin: 0.7`). One black
  field 1.96 - 3.51 m (half width 1.37 m, top corners rounded) holds the destination board, the LED
  head and tail lamps at its top corners and the big windscreen (2.17 - 3.19 m, its own lighter
  `screen` glass). Under it the halftone: square decals of `dotBottom` growing downward over a
  `dotTop` ground (Yamanote green dots on black, Yokosuka blue dots on cream). No gangway door.
- **Sides** - `layout` from JR East's door pitch (centres 4.82 m apart, the outer ones 2.52 m from
  the body's ends; the cab car's first door 3.6 m ahead of its second), each door as two leaves
  sliding apart with a narrow window each; one 1.9 m window between doors, 0.8 m ones at the ends;
  the cab window and the crew door's outline and window; the JR emblem.
- **Liveries** - `yamanote`: plain stainless, green door leaves and green panels over them under the
  eaves (`overDoors`); `yokosuka` (E235-1000): cream-over-blue stripes under the windows and under
  the eaves, stainless doors, the blue face.
- **Fittings** (`e235Fittings`) - the roof's air conditioner, two antennas on the cab roof, the
  skirt under the face with its cheeks, the coupler under the face (the kit draws none at a cab
  face), the underfloor boxes. The bogies sit at the real positions on the 19.57 m body
  (`endBogies`), the single-arm pantograph over the middle car's rear bogie (`pantographAt`).

## The 103 series

The low-cab Kuha 103 with the twin sealed-beam headlight and the AU75 air conditioner (1970s - 2000s;
Kuha 103-1, -149, -188, -178 in `assets/jnr-103/`), built on a `cabFace` (`S103_FACE`) measured on the
head-on photo of Kuha 103-188 at 235 px/m:

- **Face** - upright from the body's foot (1.0 m) to 3.3 m, then rounding over into the roof by 0.35 m
  (`dJoin`); plan corners 0.13 m. No gangway door (the 103 front is non-gangway). Three windscreens of one
  height (2.12 - 2.82 m, pillars at lat +-0.41) in a recessed frame (2.03 - 2.89 m, painted a darker
  shade, the grey sash inside it); the train-number box (lat -1.10 - -0.54) and the destination box
  (0.48 - 1.16) over it in silver frames; the twin sealed beams in a housing on the forehead
  (centre 3.445 m, 0.56 x 0.30 m); the tail lights in round housings at lat +-1.11, 1.23 m; two footsteps
  and the step plate over the coupler; wipers.
- **Sides** - by a projective fit over Kuha 103-178's four doors: door pitch 4.78 m, the Kuha's door
  centres 2.52 m behind the face, the intermediate car's 2.58 m behind its end; a door-pocket window beside
  each door (0.43 m), the two-pane window pair between (two 0.92 m sashes with their aluminium frames and
  meeting rail), one window and its pocket at the plain end; windows 1.97 - 2.78 m, doors 1.17 - 2.97 m with
  a 0.40 m window on each leaf. The crew door 0.45 - 1.03 m behind the face with its window and grab rail.
- **Roof and running gear** - the AU75 across the car's middle (4.6 m), flat ventilators, the rain gutters;
  the PS16 diamond pantograph over the Moha's rear bogie, one in the 4-car Kuha-Moha-Moha-Kuha set
  (`onePantograph`); bogies 13.8 m apart centred on the 19.5 m body; the equipment boxes underneath.

## Deviations

- The GSE's and the Hinotori's real cars are articulated or on their own bogies in ways the kit
  approximates with two bogies a car; the GSE's raised driver's cab over the saloon is the
  nose's crown.
- The E259's wrap-round windows and the 103's later variants are simplified.
- The E235: the side windows' rounded corners are square (the kit's windows are rectangles); the
  destination board is unlit; the halftone is coarser than the real one (7 rows of 0.077 m dots);
  the distant model shows no green doors (the series LOD paints only bands); the end car's body is
  0.1 m longer behind the cab than the real one (the face's tip 0.07 m from the coupling plane, the
  kit's length check). The lamps sit at the face's top corners and there is no gangway door, as in
  every photograph of the -0 and -1000 subseries.
- The E235's and E259's wrap-round windows are simplified. The 103 is one version (the low cab, twin
  sealed beams, AU75); its high-cab ATC cars, the single round headlight and the non-cooled roof are not
  drawn. The kit's elliptic roof arc gives its face slightly tighter top corners than the real roof's;
  the coupler plane stands 0.13 m ahead of the face (0.25 m on the real car), so the body is 19.62 m long.
  Longer trains still raise one pantograph.

## Checking

`pnpm exec vitest run test/jpEmus.test.ts` (ids, parameters and two liveries each; the end and
middle cars at their lengths and real widths inside the UIC gauge, in budget, without coplanar
faces, on two bogies, the middle car's pantograph raised; the commuter cars' four doors).
