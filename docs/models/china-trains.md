# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (on the Velaro body), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests.
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), `generator/seriesHelpers.ts` (`velaro`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/cr-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`red`, `smart`) | 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, its own cab face (`generator/cnCr400bf.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`gold`, `red`) | 27.35 / 25.7 m cars, 8 cars 208.9 m; 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the long nose; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge, its own E2 cab face (`generator/cnCrh2a.ts`) | `unit`, `cars` 3 - 8 | 25.7 / 25 m cars, 9.2 m E2 nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, the ICE 3's Velaro cab face (`cnCrh3c.ts`) | `unit`, `cars` 3 - 8 | end 25.675 m, middle 24.775 m, 3.1 m wide (real 3.265 m), 3.89 m high; 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, its own cab face (`cnCrh5a.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8 | the Pendolino snout; 27.6 / 25.0 m, 3.2 m wide; 250 km/h |
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series, its power cars' pantographs | `unit`, `cars` 4 - 8, `livery` (`green`, `whiteRed`) | 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series | `unit`, `cars` 4 - 8 | 200 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | hood unit, the ES44AC's body | - | 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | box locomotive | - | 35.2 m, eight axles, 9,600 kW |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, raked | - | Co-Co, 20.85 m, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, flat | - | Co-Co, 20.4 m, 3,780 kW |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, streamlined | - | Bo-Bo, 17.5 m, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | box locomotive, diesel | `livery` (`orangeWhite`, `green`) | Co-Co, 20.5 m, 1,985 kW |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | box locomotive, streamlined, diesel | - | Co-Co, 21.25 m, 3,040 kW, 170 km/h |
| `proc-vehicle-cr-qj` | CR QJ | steam, knuckle couplers | `unit` | 2-10-2, 1.5 m drivers |
| `proc-vehicle-cr-sy` | CR SY | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-js` | CR JS | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-25t-coach` | CR 25-series coach | coach, knuckle couplers | `unit` (`softSleeper`, `hardSeat`), `livery` (`z25t`, `green25b`) | 26.6 m; 160 km/h |
| `proc-vehicle-cr-c70-wagon` | CR C70 / P70 wagon | wagon | `unit` (`open`, `covered`) | 13.98 m and 17.0 m |

## Deviations

- **Width.** The high-speed trains' 3.36 - 3.38 m bodies are narrowed to the Shinkansen
  gauge's 3.3 m, as the Shinkansen are.
- **Couplers.** The box locomotives carry the kit's buffers; China's are automatic couplers.
- **HXD1.** One 35.2 m body on eight axles; its two sections' joint is not drawn.
- **CR200J.** The power cars are the series kit's end cars, with windows.

## Tests

`test/worldTrains.test.ts` (all 160 plan designs) and, for each module's first design,
the catalog sweep.

## The CRH3C's body

`generator/cnCrh3c.ts`, matched to the photographs in `assets/cr-crh3c/` (unit CRH3-037C).
The Velaro CN shares the ICE 3's snout, so the design reuses its measured cab face
(`ICE3_FACE`, [germany-trains.md](germany-trains.md)) with the CRH face's own paint; the
shared `velaro()` body is no longer used by it (the AVE S-103 keeps it).

- **Size.** End car 25.675 m and middle car 24.775 m over the couplers (200 m for eight
  cars), 3.89 m high, bogie centres 17.375 m. The real body is 3.265 m wide, wider than the
  ICE 3's 2.95 m; the model is drawn 3.1 m wide, the UIC gauge's limit.
- **Face.** The canopy's tinted glass from 2.47 m with a light grey lip below it
  (2.17 - 2.49 m) holding the round upper lamp, a dark rim round both; the black "Hexie hao"
  characters drawn as simplified strokes just under the lip; the two lamp clusters
  (1.55 - 1.98 m, leaning out at the top) with the head and red lamps on their outer half and
  six black slats on the inner; the coupler cover's seam over its top and flanks; a light
  grey plough under it.
- **Livery.** White; one royal-blue band (sampled `#1048a8`), 7 cm high at 1.865 - 1.935 m,
  8.5 cm under the windows' foot, along every car. On the end car it falls from the join
  (7 m behind the tip) to a point 1.48 m behind the tip at 1.35 m, low on the nose's flank
  behind the coupler cover, and a thin line rises back from the point to 2.42 m behind the
  tip at 2.26 m, just ahead of the lounge window: a chevron opening backward. The navy "CRH"
  mark at the end car's rear, the running number under the windows.
- **Sides.** The end car: the VIP lounge's raked window band behind the cab (its front edge
  leaning further back than the ICE 3's), one door 8.45 m behind the tip, the saloon's
  windows to the CRH mark. The middle cars: a door a side at each end (the photographs'
  second and third cars), the windows between.
- **Roof.** Two low air-conditioning units on the rear half of the end car; the single-arm
  pantographs on low fairings on the second and next-to-last cars.

## The CRH5A's body

`generator/cnCrh5a.ts`, measured from the photographs in `assets/cr-crh5a/` (SOURCES.md) and the
published figures: end car 27.6 m and intermediate cars 25.0 m over the couplers, 3.2 m wide (inside
the Shinkansen gauge as it is), the crown 4.05 m and the roof hoods 4.27 m up.

- **Section.** The Pendolino's wide body: widest 1.55 m up, the sides leaning in to 0.9 of the half width
  at the 3.2 m shoulder, the white skirt panels (faint light-grey slats between the bogies) tucked in below
  1.15 m down to 0.4 m; the nose's flanks white to the bottom edge.
- **Snout** (a cab face, `CRH5A_FACE`, 7.0 m long): upright from the spoiler to 1.5 m, 0.5 m behind the
  tip, rounding over to the canopy's foot (2.1 m up, 1.3 m back), the glass leaning back at about 25
  degrees to the crown 6.4 m back; in plan one elliptic corner over the whole half width, reaching full
  width 2.6 m back low down and further back over the canopy. The **coupler cover** is half an ellipsoid
  (1.52 m wide, 1.04 m tall, centred 0.93 m up: its foot at the body's bottom, its top at the lamps') standing
  0.48 m forward of the face, its joint a thin grey seam,
  a slot for the coupler on its foot (`coverDome`, drawn with the end car's fittings).
- **Paint on the face**: one dark glass canopy from its foot over the cab roof (its lower edge nearly
  level across the face, then rising along the sides to the crown 6.5 m back), a black rim round it, the
  windscreen proper a lighter pane in its front (2.26 - 2.78 m) with two wipers; the
  "eye" cab side window, a tear 4.0 - 6.3 m back slanting down to the front; two lamp lozenges under the
  canopy's lower corners, rising to the outside (black housing, clear lens, a head and a tail lamp);
  the face is white all round, also below the skirts' top.
- **Livery** `crh`: white, the blue band 1.82 - 1.94 m just under the windows, dipping and thinning to a
  point 3.0 m behind the tip, 1.66 m up; "CRH" ahead of the first door; number CRH5A-5043 (photographed).
- **Sides**: single plug doors 0.85 m wide with a narrow window, one at each end of every car (the end
  car's first 7.35 m behind the tip); windows 1.2 m by 0.76 m (1.98 - 2.74 m), about 1.9 m apart, with a
  narrow pane by the first door: seven on the end car, eight on an intermediate car, whose rear 4.5 m are
  blank (toilets) but for a small square window by each door.
- **Running gear and roof**: bogies 19.0 m apart, 2.7 m wheelbase, 0.89 m wheels, the end car's leading
  one 5.6 m behind the tip; an air-conditioning hood with side grilles near one end of every car; a
  single-arm pantograph on the intermediate (Tp) cars, 17 m behind the car's front, raised on the third car
  and the third from last (the kit's rule, as the Mc M Tp M T Tp M Mc formation).
- **Still differs**: the eight cars come to 205.1 m (the published car lengths), not the quoted 211.5 m;
  the 和谐号 lettering is left out; the distant model's snout is a plain rounded wedge.

## The CRH2A's body

`generator/cnCrh2a.ts`, measured on `assets/cr-crh2a/` (SOURCES.md; every photograph oblique, lengths
from a projective fit along the side of CRH2A-2377 through the car joints, heights from the near
head-on views scaled on the oval cover). Heights over the rail, d behind the nose's tip.

- **Cars.** End car 25.7 m, intermediate cars 25.0 m over the couplers; 3.7 m high; drawn 3.27 m wide in
  the Shinkansen gauge (3.38 m real). Bogie centres 17.5 m: the end car's leading bogie 4.45 m behind
  the tip, under the nose.
- **The nose** (the E2-1000's) is a cab face joining the body 9.2 m back: the oval coupler cover
  standing forward at 1.05 m (0.78 m tall, 1.9 m wide, split down its middle), the skirt set back under
  it and ending ahead of the leading wheels (a fitting); the bonnet rising to the canopy's foot about
  2 m back, the canopy's raked windscreen to 3.15 m, the roof reaching 3.7 m at the join. In plan the
  lower snout is broad (full width about 4 m back), the upper nose round the canopy up to 0.42 m
  narrower than the body each side, flaring out to it at the join.
- **The canopy**: grey-blue glass in a dark rim, its foot painted CRH blue - 0.16 m thick at the centre,
  thinning back along its sides to the tail about 5 m behind the tip; the headlights (four) in a light
  strip inside the top of the glass; two wipers.
- **The livery**: white; the blue band 1.80 - 1.96 m just under the windows; on the end car it dips
  from the door to a point 1.54 m up, 6.3 m behind the tip, under the cab's side window (6.2 - 7.0 m,
  its top edge sloping down toward the front). Running number CRH2A-2377.
- **Windows and doors**: large windows, one per two rows of seats, 1.5 m wide and 1.9 m apart, sills
  2.0 m, heads 2.68 m. End car: the passenger door right behind the nose (9.45 - 10.35 m, a narrow
  window high in the leaf), six windows from 10.9 m and a narrow one at the rear, a small window high
  over the first; no rear door. Intermediate car: a door near each end (2.2 m and 21.95 m in), nine
  windows between them.
- **Roof**: on the end car a row of ten light equipment covers in a grey trough, from the door back to
  2 m from the inner end. The single-arm pantographs stand on the E2-1000's dish-shaped cover, on the
  fourth and sixth of eight cars (the third and fifth from the leading end; `pantographCars`), the kit's
  rule for shorter trains.
- **Not drawn**: the "Hexie Hao" characters and the CRH logo on the nose and sides (the stroke font has no
  CJK); the later units' crew door in place of the cab side window.

## The CR400BF's body

`generator/cnCr400bf.ts`, measured from the photographs in `assets/cr-cr400bf/` (SOURCES.md) and the
published figures; heights over the rail, d behind the nose's tip.

- **Lengths.** End car 27.35 m and intermediate car 25.7 m over the couplers (27.09 m and 25.65 m
  published), eight cars 208.9 m (209.06 m). 17.5 m bogie centres, 920 mm wheels; the leading bogie
  7.05 m behind the tip, the others 3.85 m in from the body ends. Body 0.5 - 4.05 m, 3.24 m wide in the
  gauge (3.36 m real); white skirts down to 0.5 m, no underfloor box below them.
- **The nose** is a cab face joined to the body 9.4 m behind the tip. The coupler hatch is a fat bulb
  standing out at the tip (`hatchBulb`): half a blunt ellipsoid of rounded-rectangle sections, 1.8 m
  wide from 0.49 to 1.53 m, its front bowed 1.25 m ahead of its rim, which sinks into the face; the rim
  and the leaves' joint down its middle are dark seams. The face behind it stands 0.55 m back and rises
  over the bulb's top in a convex curve (2.0 m at 1.04 m back, 2.6 m at 1.72 m, 3.6 m at 4.55 m, the
  crown 9.4 m back); its plan is round at every height (elliptic corners 2.0 - 2.7 m deep) - the
  rounder, fuller "phoenix" head, not the CR400AF's. The distant model's end reaches forward over the
  hatch to the tip.
- **The canopy.** Black from a rounded point on the chin (1.7 m) widening as a shield to the lamps
  (1.0 m half width at 2.1 m, 1.44 m at 2.6 m), then running back on the sides over the cab window to
  the crown 9.0 m behind the tip; outlined by a narrow border in the livery's colour (0.11 m wider head-on, 0.1 m on the sides), the face below it white. The windscreen glass
  from 2.12 m (centre) to 3.6 m; a lamp strip and a round lamp at each lower corner of it, a red tail lamp
  above, the China Railway emblem on the chin, one wiper, a roof lamp.
- **The side's paint.** A charcoal window band 2.02 - 2.92 m; under it the upper line 1.875 - 1.95 m and
  the lower line 1.675 - 1.75 m (gold, or red in the `red` livery). The upper line sweeps up from a point
  2.6 m behind the tip to the band's top at 7.6 m as the "wing", which holds the teardrop cab window
  (4.75 - 6.9 m, its point low at the front); the band starts behind the wing; the lower line runs on to a
  point 2.85 m behind the tip.
- **Windows and doors.** End car: windows 7.82 - 8.98 and 9.51 - 10.71 m (business), the door 11.93 -
  12.88 m, four windows 1.24 m wide at a 1.95 m pitch from 15.58 m, a blank rear end. Intermediate car:
  eleven windows 1.25 m wide at 1.956 m from 1.84 m, one door at its rear end (each car has one door a
  side, paired at alternate joints). Plug doors 0.95 m, 1.28 - 3.2 m, a tall rounded window 0.42 m wide.
- **Pantographs.** Single arm on the third and the third-from-last car (cars 3 and 6), as the kit's
  default; the real sets raise one of them in single-set service, the kit raises both.

