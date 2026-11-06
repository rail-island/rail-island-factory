# North American carbody locomotives and the Acela

**Covers** - the streamlined North American designs (`proc-vehicle-emd-f7`, `proc-vehicle-emd-f40ph`, `proc-vehicle-ge-p42dc`, `proc-vehicle-siemens-alc42`, `proc-vehicle-prr-gg1`, `proc-vehicle-amtrak-superliner`, `proc-vehicle-amtrak-acela`): measures, liveries, the carbody kit they are lofted with, the Acela's cars and train, deviations and tests.
**Code** - `generator/usCarbodies.ts` (`US_CARBODIES`), `generator/carbodyKit.ts`, `generator/sliceBody.ts`, `test/usCarbodies.test.ts`, `assets/emd-f7/`, `assets/emd-f40ph/`, `assets/ge-p42dc/`, `assets/siemens-alc42/`, `assets/prr-gg1/`, `assets/amtrak-superliner/`, `assets/amtrak-acela/`
**See also** - [us-diesels.md](us-diesels.md), [loading-gauge.md](loading-gauge.md), [shinkansen-0.md](shinkansen-0.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md)

## The designs

| id | title | parameters (default first) | over couplers | triangles |
|---|---|---|---|---|
| `proc-vehicle-emd-f7` | EMD F7 | `livery`: `santaFe` (red warbonnet), `unionPacific`, `southernPacific` (Daylight) | 15.44 m | 10,800 - 11,700 |
| `proc-vehicle-emd-f40ph` | EMD F40PH (draft) | `livery`: `phaseIII`, `phaseII` | 17.12 m | about 11,000 |
| `proc-vehicle-ge-p42dc` | GE P42DC Genesis | `livery`: `phaseV`, `phaseIII`, `via` | 21.03 m | 8,400 - 8,800 |
| `proc-vehicle-siemens-alc42` | Siemens ALC-42 Charger | `livery`: `phaseVII`, `midwest` (the SC-44's Amtrak Midwest scheme) | 21.79 m | about 10,300 |
| `proc-vehicle-prr-gg1` | PRR GG1 | `livery`: `brunswick`, `tuscan`, `pennCentral` | 24.23 m | 13,300 - 14,400 |
| `proc-vehicle-amtrak-superliner` | Amtrak Superliner | `unit`: `coach`, `sleeper` | 25.91 m | 8,500 - 8,700 |
| `proc-vehicle-amtrak-acela` | Acela Express | `unit`: `powerCar`, `businessClass`, `firstClass`, `cafe`, `train` (`cars` 3 - 8, default 4) | 21.22 m power car, 26.64 m coach | 7,200 - 10,200 a car |

All are drawn at their real size to the US loading gauge ([loading-gauge.md](loading-gauge.md)),
3.04 - 3.24 m wide. The F7, F40PH, P42DC and ALC-42 are diesel locomotives (`DIESEL_LOCO_CATALOG`),
the GG1 an electric locomotive (`ELECTRIC_LOCO_CATALOG`), the Superliner a coach (`COACH_CATALOG`), the Acela an electric trainset
(`EMU_CATALOG`). All have AAR knuckle couplers (`knuckleCoupler`, usHoodKit.ts) and US trucks
(the diesel toolkit's bogie); the GG1 has its own 2-C+C-2 running gear.

## The carbody kit (`carbodyKit.ts`)

A body is a `CarbodySpec`: the flat body's section (belly, shoulder, crown, the skirt and the
lower body's foot, the side's lean) and, at either end, a `NoseShape`: a plan that rounds from
a blunt tip to the full width over `len` (a superellipse of `power`), and tables over d (metres
from the tip) of the crown, shoulder, belly, skirt top and skirt bottom; past a table's last row
the body's own value holds. A double-ended body (the GG1) has a nose at both ends; a flat end
is a wall. `cuts` lift the skirt over the trucks. `carbody(spec)` turns it into a `SliceBody`
(sliceBody.ts) with stations dense in the noses, and `carbodyShell` lofts it with every face
painted by a `Painter` - a function of the face's d, its height and its region - so a livery is
horizontal bands (`bandPainter`), a nose field and decals laid on the lofted surface
(`sideDecal`, `stripDecal`: the warbonnet's band, the GG1's pinstripes). Windscreens are
`crownPane`s, cab windows and grilles `sidePanel`s, portholes `surfaceDisc`s; nose lamps stand
where the centre line reaches their height (`noseLamps`).

## The models

- **EMD F7A** - the bulldog nose rising to the raked windscreen, the cab roof over the
  carbody's, three portholes and the filter grilles between them, three radiator fans, the
  dynamic brake fan and exhaust, the pilot, a rear diaphragm. Santa Fe's warbonnet: the red
  bonnet over the nose and its band sweeping back to a point, outlined in yellow, on silver.
- **EMD F40PH** - Amtrak's cowl unit of 1976: the tall short nose with chamfered corners and
  the twin headlight, the raked two-pane windscreen under the number boards and red markers,
  the cab's two side windows and door, the full-width body with vertical sides, the inertial
  filter and dynamic brake grilles behind the cab, the long radiator grille along the rear,
  the dynamic brake blister and its fan, the exhaust and two large radiator fans, the pilots,
  fuel tank and two Blomberg trucks. Phase III: silver, the blue, white and red stripes, the
  black nose top, cab front and cab roof (anti-glare, as on Kato's model), black frame and
  pilots, the lower-case "Amtrak" wordmark drawn as bold bars (`wordmark`) on the side and the
  nose; on the roof the dynamic brake blister with its louvres and fan, the exhaust, two
  radiator fans under barred guards, a five-chime horn, the bell and an antenna; Phase II (as delivered) the same with narrower stripes set higher.
  A draft in the workshop.
- **GE P42DC** - the Genesis's angular nose with its chamfered corners and long raked
  windscreen, the side grilles, three roof fans, the skirt cut over the trucks.
- **Siemens ALC-42** - the Charger's beaked nose, its windscreen, grilles and two radiator
  fans; Phase VII dark blue over a low red stripe.
- **PRR GG1** - the welded streamlined body, the hoods falling from the centre cab to both
  rounded noses, two diamond pantographs over the cab's ends (the rear one raised to the
  game's wire, the front one folded), and the running gear: on each half three 57 in drivers
  and the two-axle guiding truck under one frame, a bogie node each. The five gold
  pinstripes gather into the "cat whiskers" at both noses.
- **Amtrak Superliner** - the bi-level long-distance car (built from the user's reference and
  photographs): 85 ft long and 16 ft 2 in high, its fluted lower body (thin dark lines on the
  stainless steel, broken by the door and the lower windows), the Phase IV stripes - a red
  line low, two red lines over the blue band under the upper deck's windows - and the low centre
  door on each side, a plug door opening onto the car's cabin (`plugDoor`, shared with the
  Acela's coaches). The coach has 12 large upper windows a side and four on the lower deck,
  the sleeper 14 smaller upper and six lower ones. Diaphragms at the upper deck's height.
- **Acela Express** - the power car's long sloping nose and windscreen, its single-arm
  pantograph (raised) and grilles; the coaches' window bands (business class 13 windows a
  side, first class 11 wider ones, the cafe 8) and end doors. `train` is an articulated set
  (`articulate`, tramKit.ts): a power car at each end, the rear one turned, first class behind
  the leading power car, the cafe in the middle of five or more cars (`acelaTrain`), bellows
  between the cars, each car on its own two trucks.

## Liveries

Simplified schemes: colour fields, stripes and plain stroke letters, no heralds or logos
(but the F40PH's Amtrak wordmark).
Running numbers are illustrative, but for the GG1's preserved 4935 and 4800.

## Deviations

- The trucks are the diesel toolkit's generic cast truck (the Acela's and the Charger's are
  not modelled in detail); the Acela's tilt is not drawn.
- The F7's B unit, the P42DC's and ALC-42's interiors and the Acela's cabins are not drawn.
- The GG1's quill drive and its frames are simplified; its wheels have six spokes.

## Checking

`pnpm exec vitest run test/usCarbodies.test.ts` (ids, references, short value titles; every
livery at its published length, inside the US gauge and 16,000 triangles, without coplanar
faces, its axles and two supports, the fixed parts under the gauge's height; the GG1's two
pantographs; the Acela's formations, train lengths and sections, each car on two trucks;
deterministic bytes and the distant models). The pantographs are also in
`test/pantographs.test.ts`.
