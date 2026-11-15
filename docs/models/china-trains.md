# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (on the Velaro body), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests.
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), `generator/seriesHelpers.ts` (`velaro`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/cr-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, its own cab face (`generator/cnCr400af.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`red`, `smart`) | 27.6 m and 25.65 m cars, 209 m for eight; 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, its own cab face (`generator/cnCr400bf.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`gold`, `red`) | 27.35 / 25.7 m cars, 8 cars 208.9 m; 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, its own cab face (`generator/cnCrh380a.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8 | the 12 m nose; 26.5 m + 25.0 m cars; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge, its own E2 cab face (`generator/cnCrh2a.ts`) | `unit`, `cars` 3 - 8 | 25.7 / 25 m cars, 9.2 m E2 nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, the ICE 3's Velaro cab face (`cnCrh3c.ts`) | `unit`, `cars` 3 - 8 | end 25.675 m, middle 24.775 m, 3.1 m wide (real 3.265 m), 3.89 m high; 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, its own cab face (`cnCrh5a.ts`), Shinkansen gauge | `unit`, `cars` 3 - 8 | the Pendolino snout; 27.6 / 25.0 m, 3.2 m wide; 250 km/h |
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series: the power car as the coaches' lead car (`leadCar`), one cab face for it and the driving trailer (`cnCr200j.ts`) | `unit` (`endCar` power car, `middleCar` coach, `drivingTrailer`, `train`), `cars` 4 - 8, `livery` (`green`, `whiteRed`) | power car 20.0 m, coach 25.5 m, driving trailer 27.955 m; 5,600 kW, 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series, its own cab face (`cnCrh6a.ts`), Shinkansen gauge | `unit`, `cars` 4, 8 | the short intercity nose; 25.7 / 25.0 m, 3.86 m high; 5,520 kW, 200 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | its own (`cnHxn5.ts`): GE Evolution hood, full-width Chinese cab | - | 22.295 m, Co-Co, 150 t, 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | its own twin-section body (`generator/cnHxd1.ts`), two articulated sections | - | 2 x 17.611 m Bo'Bo', 3.1 m wide (real 3.247 m), 9,600 kW, 120 km/h |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, its own cab and livery (`generator/cnHxd3d.ts`) | - | Co-Co, 22.99 m, 126 t, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, flat | - | Co-Co, 20.4 m, 3,780 kW |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, streamlined | - | Bo-Bo, 17.5 m, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | box locomotive, diesel | `livery` (`orangeWhite`, `green`) | Co-Co, 20.5 m, 1,985 kW |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | box locomotive, streamlined, diesel | - | Co-Co, 21.25 m, 3,040 kW, 170 km/h |
| `proc-vehicle-cr-qj` | CR QJ | steam, knuckle couplers (`generator/cnQj.ts`) | `unit` | 2-10-2, 1.5 m drivers; six-axle tender |
| `proc-vehicle-cr-sy` | CR SY | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-js` | CR JS | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-25t-coach` | CR 25-series coach | coach, knuckle couplers | `unit` (`softSleeper`, `hardSeat`), `livery` (`z25t`, `green25b`) | 26.6 m; 160 km/h |
| `proc-vehicle-cr-c70-wagon` | CR C70 / P70 wagon | wagon | `unit` (`open`, `covered`) | 13.98 m and 17.0 m |

## Deviations

- **Width.** The high-speed trains' 3.36 - 3.38 m bodies are narrowed to the Shinkansen
  gauge's 3.3 m, as the Shinkansen are.
- **Couplers.** The box locomotives carry the kit's buffers; China's are automatic couplers.
- **HXD1.** Drawn in its original blue and silver livery under the plan's `red` livery key (the class never ran in red); the model has one livery and no parameter.
- **CR200J.** Only the short sets' formation (power car, coaches, driving trailer) is drawn; the long sets have a power car at each end.

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

## The CR400AF's body

`generator/cnCr400af.ts`, measured on the line-scan side photograph (a true side view, 22.6 px/m
both ways) and the three-quarter photographs in `assets/cr-cr400af/` (SOURCES.md). The other
Chinese units keep the shared `hsr()` nose.

- **Lengths.** The end car 27.6 m from the nose's tip to its coupling plane, the intermediate cars
  25.65 m: eight cars 209.0 m. Body 4.05 m high, narrowed from 3.36 m to the gauge's 3.27 m.
- **Nose** (a cab face, `CR400AF_FACE`, joining the body 9.4 m behind the tip). The bullet coupler
  cover's round front 1.0 m up, its seam (a dark ring 1.56 m wide) 0.62 m back; the nose rising at
  about 25 degrees to the roof's full height 9 m back. Round in plan low down (full width about
  5 m behind the centre line); over it a broad, gently bowed top under the gunmetal visor.
- **Visor.** Gunmetal from a U across the face 1.95 m up over the windscreen and back over the cab
  to a point on the roof 8.4 m back, edged in red on the `red` livery; China Railway's orange emblem
  ahead of the windscreen. The windscreen one rounded pane 1.64 m wide, 2.36 - 3.0 m up.
- **Lamps and cab side window.** The headlamp a long pointed lens 2.9 - 5.6 m back over the
  dragon's arm; the cab side window a dark sliver from 4.0 m back, its head rising to 3.33 m.
- **Livery (`red`).** Silver; the black window band 1.85 - 2.88 m over a white line and the red
  stripe 1.64 - 1.77 m, both falling toward the nose, the band ending in a point 3.85 m back; the red
  "dragon" from its point on the nose's cheek (1.55 m back, 1.17 m up) up along the band's front to
  its tip 6.9 m back. "CR" on the band near the end car's inner end; the number CR400AF-2146.
- **Livery (`smart`, "Smart Fuxing").** The CR400AF-C-2214's: the same band and stripe, no dragon;
  a red, orange and yellow ribbon along the visor's edge from the U, leaving it to run back over the
  band (2.93 - 3.24 m) along the whole end car. The intermediate cars carry only the band and stripe
  (the real ribbon dips under the band on the second car); the C's door near the cab is not drawn.
- **Sides.** The end car's one door 12.37 - 13.37 m behind the tip; panes 9.95 - 11.3 m and four from
  15.6 m, 2.0 m apart; a destination display over the band at 15.45 m. An intermediate car's doors
  at both ends, nine panes 1.96 m apart from 5.15 m, a display at each end. Plug doors with a narrow,
  round-headed window. Bogies 5.35 m behind the tip and 18.15 m apart on the end car, 17.85 m on the
  others; single-arm pantographs on the third and sixth cars (the kit's rule).
- **Not drawn.** The business saloon's panes in the band on the nose (painted black), the Chinese "Fuxing Hao"
  lettering, the roof's small fittings.

## The CRH380A's body

`generator/cnCrh380a.ts`, measured on the photographs in `assets/cr-crh380a/` (SOURCES.md) and set
to the published figures: a 26.5 m end car with the 12.0 m nose, 25.0 m intermediate cars, 3.7 m high,
the 3.38 m body drawn 3.26 m wide; 17.5 m bogie centres, 2.5 m wheelbase, 860 mm wheels, the end car's
leading bogie 5.35 m behind the tip.

- **The nose** is a cab face (seriesCab.ts) whose depth is a solid of the module's own (`a380Depth`):
  each section a superellipse round its widest height, its half width, top, bottom and powers smooth
  (monotone cubic) tables of d, drawn into the body's own section over the last 4 m. The tip is one
  blunt bullet - the silver coupler cover, as wide and high as the nose there (1.9 m wide at 1.4 m
  back) and flowing into it, a thin dark seam 1 m behind the tip; the nose then rises in a long line
  (2.0 m 3 m back, 2.5 m at 6 m, the roof's 3.7 m at the join). The lower flank is narrow below 0.95 m
  over the leading bogie and flares to the skirt behind it, so the bogie shows under the nose.
- **The canopy** stands out of the nose's top from 4.2 m behind the tip, 1.7 - 1.9 m wide, its crown
  3.26 m at 7.3 m and merging into the roof at the join. Its glazing is one dark wrap-around outline
  under the white hood: the windscreen (one wide pane, a single wiper) and the side windows, cut to the
  canopy's own walls where they rise from the nose. The almond headlights (light grey covers in a grey
  rim) lie low on the nose beside the canopy's foot.
- **The livery** (unit 2670): white, the dark window band 1.97 - 2.95 m holding the windows, the blue
  stripe 1.72 - 1.85 m under a white gap, a light grey skirt. On the end car the band's foot rises
  toward the nose and ends in a rounded point 9.7 m behind the tip; the stripe rises with it to a crest
  9.3 m back and sweeps down the flank to a point 6 m behind the tip. White doors carry the stripe only.
- **Windows and doors**: one window a seat row (0.8 m on a 1.04 m pitch). The end car has its door
  only at the front, 14.0 m behind the tip, two sightseeing windows in the band's point ahead of it with
  the "CRH" mark, and ten windows behind it; the intermediate car has one door, at its rear end, and
  21 windows.
- **Pantographs**: single arms on cars 4 and 6 of eight (in shorter trains the third car from the end
  and the one two ahead of it), only the rear one raised; each stands between four raked side shields
  on the roof's edges.
- **Distant model**: the nose from five rows (dome, rising top, canopy) with the windscreen as glass.

## The CR HXN5's body

`generator/cnHxn5.ts`, measured from the photographs in `assets/cr-hxn5/` (SOURCES.md; the number is
HXN5 0433's) and the published figures: 22.295 m over the couplers, 3.119 m wide, 4.775 m high over the
roof lamps, Co-Co on the GE Evolution's 50 ft 4 in truck centres. It is no longer the ES44AC's body: the
HXN5 (GE ES59ACi) has the Evolution's frame, hood and radiator but **one full-width Chinese cab** and no
short hood. The kit's helpers (`usHoodKit.ts`) draw it; no kit or other design changed.

- **Cab.** 2.7 m long (7.9 - 10.62 m), full width: a flat face upright to the waist at 3.35 m, the
  windscreens' plane raked 0.2 m back to 4.38 m while the sides lean in to 1.36 m, a deep chamfer to the
  flat roof at 4.62 m; the face's vertical corners cut 0.1 m. Two rounded windscreens (3.40 - 4.35 m) with
  a broad post and light frames, the four-lamp box on the roof's front edge, a headlight and an amber
  marker in a dark housing each side at 3.0 m, the CR emblem between. The sliding side window high on
  the leaning side (8.7 - 10.4 m), a small low window at 9.0 - 9.3 m, doors in the rear wall onto the
  walkways, the horn on the roof behind.
- **Front end.** No walkway in front: a ribbed anticlimber under the face (1.18 - 1.65 m) and the deep
  pilot plate below it with the coupler (an AAR knuckle, as China's type 13 automatic coupler, at
  0.88 m), hoses, a red marker and yellow grabs.
- **Hood.** An equipment box (1.6 - 7.9 m, 4.6 m high) with three screened grilles high on each side and a
  small window ahead of them; the engine hood (to -5.2 m) with its exhaust and door seams; the radiator
  with its wings flaring to the full width over the rear face, the rear face's four lamps under them,
  the radiator compartment's louvred doors. Walkways with handrails from the cab's rear wall to the rear
  platform, side ladders at 5.4 - 5.9 m, corner steps at the rear.
- **Running gear.** Coil-sprung three-axle trucks, a fuel tank with a louvred cabinet of four doors on
  its side, two pairs of air reservoirs ahead of the rear truck.
- **Livery** (`orange` key kept for saved maps, titled "CR green"; one value, not a parameter). CR dark
  green (sampled `#235843`); a light grey band at 2.10 - 2.65 m across the face, wrapping 0.4 - 0.55 m
  round the cab's corners with a leaning end, carrying the red "Hexie" characters (simplified strokes)
  and the number on a white plate; the hood's lower sides (to 4.08 m, from 5.3 m back to the radiator)
  silver-grey with the characters 0.7 m high and the number in red; the rear face lettered the same,
  the emblem below. Dark olive-grey frame and pilots, handrails dark with yellow end posts.


## The CRH6A's body

`generator/cnCrh6a.ts`, measured from the photographs in `assets/cr-crh6a/` (SOURCES.md; the side-on train
rectified by a projective fit along its car joints) and the published figures: end car 25.7 m and
intermediate cars 25.0 m over the couplers (201.4 m for eight), 3.86 m high, 3.3 m wide (drawn 3.24 m so
that the door frames stay inside the Shinkansen gauge), 0.86 m wheels on a 2.5 m wheelbase.

- **Nose** (a cab face, `CRH6A_FACE`, 4.9 m to the join): short and blunt. The big rounded lower nose (the
  coupler cover) stands foremost, its front 1.15 m up, its top 2.0 m up 0.5 m back, its seam a thin dark line
  over the top and down the flanks to 0.5 m; above it the lamp strip; the windscreen from 2.6 m leaning back
  to about 3.6 m up 2.4 m back, the canopy rounding over to the crown 4.5 m behind the tip. In plan one
  elliptic corner over the whole half width, reaching full width 3 m back low down.
- **Face paint**: the dark canopy from the lamp strip over the windscreen to the crown, its lower edge a
  straight line rising from the strip's ends to the crown 4.6 m back; the lighter windscreen pane with one
  wiper; the lamp strip with six round headlamps and a thin red tail line under them; the slanted cab side
  window 3.05 - 4.45 m back, 2.5 - 3.22 m up; the grey skirt carried under the nose to the plough.
- **Livery** `crh` (the Pearl River Delta sets, CRH6A-0407): white; the black window band 1.96 - 2.92 m from
  just behind the cab door (its front leaning forward over the door) to the rear of every car; the orange line
  3.0 - 3.07 m over it, which dives down the nose's flank behind the cab window to a point 1.85 m up, 2.6 m
  behind the tip; the grey skirt below 1.1 m; the white "CRH" on the band behind the cab door.
- **Sides**: wide single plug doors 1.3 m by 2.05 m (1.25 - 3.3 m), their tall window from the band's foot
  to near the door's head; the end car's cab door 5.4 m behind the tip, its passenger doors at 13.35 and
  20.8 m; the intermediate cars' doors 3.55 m in from each body end, over the bogies (the two-door cars, as
  most CRH6A). Windows 1.35 m wide about 1.85 m apart in the band, a narrow pane behind the CRH mark.
- **Running gear and roof**: the end car's bogies 6.0 m (under the cab door) and 22.4 m behind the tip, the
  intermediate cars' 3.5 m in from the ends; a long low equipment fairing on every roof; single-arm
  pantographs on the kit's cars (the third and the third from last; the real ones on cars 4 and 6).
- **Still differs**: the 和谐号 characters are left out; the pantographs stand on the kit's cars; the
  offered train lengths stay 4 and 8 cars (saved maps); the distant model's nose is a plain rounded wedge.

## The HXD1's body

`generator/cnHxd1.ts`, measured from the photographs in `assets/cr-hxd1/` (SOURCES.md; units
0016, 0026, 0151, 0290 in the original livery, 1454 and 1912 for the cab's shape and the right
side) and the published figures.

- **Two sections.** Two identical single-cab Bo'Bo' sections of 17.611 m over the couplers
  (35.222 m), coupled back to back: one articulated vehicle of two sections hinged at the coupler
  plane between them, a grey gangway bellows over the 0.61 m between their flat inner ends, a
  knuckle coupler at each cab (the automatic coupler, no buffers). Each section stands on its own
  two bogies, 9.0 m apart, 2.8 m wheelbase, 1.25 m wheels.
- **Cab.** The EuroSprinter (ES64F4) cab: the face upright to the waist (2.78 m) with rounded
  corners, the two-pane windscreen raked back 0.46 m to 3.66 m, chamfers beside it narrowing the
  face toward the roof, the roof cap sloping back to the 4.15 m roof over the rectangular top
  headlight. The silver lamp band (1.54 - 2.22 m) holds two housings (head lamp outboard, tail
  lamp inboard), the red "Hexie" characters and the number; the CR emblem above it; dark grey
  round the windscreens and on the roof cap, the corners blue; a grey skirt with yellow and black
  stripes below.
- **Sides.** A small cab side window and the cab door behind it, handrails beside the door and on
  the cab corner; otherwise plain machine-room walls, the louvres (two pairs a side) on the roof's
  sloped shoulders (3.38 - 3.92 m). The body is drawn 2.96 m wide so the handrails stay in the
  3.1 m gauge.
- **Livery.** Dark blue, a dark grey band along the bottom (1.0 - 1.38 m); on each side a silver
  trapezoid narrower at the top (its ends leaning in 1.05 m), from 5.3 m behind the cab's coupler
  to 1.25 m before the inner end (at the foot), holding the red characters and the running number HXD1 0016 - read
  from the cab rearward on the left side, toward the cab on the right.
- **Roof.** A cooler box with two fan grilles behind the middle, a single-arm pantograph 1.5 m
  from each section's inner end (the rear section's raised, as in most photographs), its
  roof line and the main breaker.
- **Distant model.** Both sections with their noses, the silver trapezoid as a band, the bogies,
  frame, transformer, cooler boxes and pantographs, 196 triangles of 200.

## The CR200J's body

`generator/cnCr200j.ts`, matched to the photographs in `assets/cr-cr200j/` (power cars FXD1-J0009,
FXD1-J0010, FXD3-J0271; sets CR200J-1009, CR200J-2039). The short sets run as Mc + 7T + Tc: one power
car, the coaches and a driving trailer with the same nose at the other end. On the series kit the coaches
and the driving trailer are one series (`CR200J`, unwired) and the power car is its lead car (`leadCar`,
shinkansen.ts): a train is the power car, `cars` - 2 coaches and the driving trailer, turned. The unit
values keep their keys: `endCar` is the power car (the default), `middleCar` a coach, the new
`drivingTrailer` the control car.

- **Size.** Power car 20.0 m, coach 25.5 m, driving trailer 27.955 m over the couplers (published);
  3.1 m wide (3.105 m); the power car's roof 4.33 m, the coaches' 4.43 m (published 4.433 m), drawn to
  the US gauge.
- **Nose.** One cab face for both cab cars, its centre line measured on the side-on photograph (about
  71 px/m): a broad, rounded bumper (its front 0.9 m up, its top lip 1.2 m), the chin rising at about
  43 degrees to the windscreen's foot (2.56 m, 1.64 m behind the tip), the windscreen to 3.5 m, the
  canopy rounding over to the roof 5.3 m behind the tip, where the crown still rises for 1.5 - 2.4 m.
  In plan the face bows back (its edges up to 1.0 m behind its centre at the lamps), its corners
  0.6 - 0.8 m round, so the lamps at its edges stand 1.3 m behind the chin and still face ahead.
- **Face paint.** The plough black; the bumper in the body's paint, split down its middle; the chin
  (dark grey, or deep green on the white sets) with the orange emblem, parted from the eyes by two
  stripes of body paint; the eyes, the windscreen's frame and the canopy dark grey, the canopy running
  back over the roof; the head lamps and the red tail lamps in the eyes, a lamp on the canopy.
- **Power car.** The cab side window's two panes in a slanted dark frame (3.9 - 6.8 m behind the tip),
  no passenger windows, one crew door 9.2 m behind the tip; louvres along both roof edges over 7.05 -
  9.9 m and 15.4 - 18.5 m; two single-arm pantographs, the rear one (15.8 m) raised, the front one
  (7.6 m) folded on its tall insulators, the breaker between them; Bo-Bo bogies 7.9 m apart (8.28 m
  and 16.2 m behind the tip) on 1.25 m wheels, 2.8 m wheelbase.
- **Coaches.** A door at each end with a tall rounded window, twelve 1.05 m windows 1.72 m apart in the
  dark band, an air-conditioning unit over one end; bogies 18 m apart.
- **Driving trailer.** The nose, the chevron's blank panel with "CR", a door 11.0 m behind the tip,
  seven windows 1.7 m apart from 13.1 m, a small one and the rear door; no pantograph.
- **Green Giant.** Bright green (`#3fae4b`); the dark window band 1.66 - 2.92 m and the yellow line
  1.36 - 1.54 m under it on every car. On both cab cars the yellow chevron: the line running forward and
  down to a point 4.05 m behind the tip at 1.12 m, its upper leg rising back to the band's top 8.2 -
  8.6 m behind the tip, and the band's slanted front parallel to it. "CR" in white on the band, the
  running number in yellow under the line.
- **White and red.** White; a deep green window band and a red line (1.46 - 1.56 m) under it, a green
  line low along every car; on the cab cars the green carried round the cab window, two red waves
  rising from the line toward it, and the bumper white over a green line; the chin deep green.

## The HXD3D's body

`generator/cnHxd3d.ts`, its own profile tables on the box locomotive kit, matched to the photographs in
`assets/cr-hxd3d/` (unit HXD3D 0080, the "red orangutan" production livery every photograph shows).

- **Size.** 22.989 m over the automatic couplers (the model's own centre coupler at 0.88 m, not the
  kit's buffers), 21.9 m over the faces, 4.1 m high. The body is drawn 3.0 m wide, not the real 3.1 m,
  so the cab doors' handrails stay inside the UIC gauge. Bogie pivots 11.4 m apart (measured; no
  published figure found), each bogie's wheelbase 2.0 + 2.35 m with the longer pair inboard, 1.25 m wheels.
- **Cab.** The TRAXX-derived face: upright to the grey skirt's top (1.5 m), leaning back 0.12 m to the
  waist (2.37 m) and 0.45 m to the windscreen's head (3.44 m), the roof rounding down 1.75 m to it; the
  corners chamfered 0.38 m back from 1.19 m out. Two windscreen panes (2.62 - 3.44 m, 2.14 m across) with
  wipers; on the red waist band a stacked pair of round headlights in a silver housing at each side and
  between them a dark red panel with the CR emblem, "Hexie" and the number; the double top headlight in a
  dark housing on the roof's slope and two yellow horns behind it. Under the face the grey lower cab,
  its rear edge slanting from 1.5 m to 1.0 m behind the face, red air-hose cocks, and a yellow plough
  with black chevrons.
- **Sides.** Smooth, no machine-room openings: the cab window (8.85 - 9.27 m from the centre, 2.62 -
  3.22 m) ahead of the cab door (7.95 - 8.7 m); sixteen louvres along the cantrail's slope (3.6 - 3.95 m).
- **Paint.** Red body and roof, a dark grey skirt to 1.5 m (the lower face too), the face maroon from
  the waist to the roof's slope; on each side a maroon wedge behind each cab, its foot at the waist 1.9 m
  behind the face, its head at the cantrail 5.6 m behind it. The large white "Hexie" (0.76 m, drawn as
  simplified brush strokes) and "HXD3D0080" stand a little behind the middle of each side, read left
  to right from either side.
- **Roof.** Two single-arm pantographs 10 m apart (the DSA-200 drawn as the kit's), the trailing one
  raised, the roof line between them, the main breaker's base and a hatch.
- **Distant model.** The kit's, with the maroon wedges painted on its sides.
- **Not drawn.** The small cab-side number and depot lettering, the face panel's grille, the brake
  hoses and sockets.

## The QJ's body

`generator/cnQj.ts`, its own engine and tender `LocoSpec` on the steam kit, drawn from the dimensioned
works diagram and the photographs in `assets/cr-qj/` (QJ 2204 in China Railways' service livery).

- **Size.** 16.14 m from the front coupler to the drawbar, 29.18 m with the six-axle tender (13.04 m
  from the drawbar to its rear coupler); axles 1.615 + 2.87 + 4 x 1.6 + 3.05 + 2.205 m as the diagram
  dimensions them, wheels 0.92 / 1.5 / 1.12 m, the tender's 1.0 m. 3.24 m wide (the real 3.375 m held
  to the 3.3 m gauge), 4.79 m to the chimney's lip. The closed cab (14.2 - 16.65 m) overhangs the
  drawbar by half a metre, over the tender's front deck.
- **Boiler and top.** The boiler on 3.02 m (top 4.15 m), its long smokebox to the deflectors' rear
  edge, nine white bands and white handrails. Along its top the casing over the mixing feed-water
  heater, chimney, sand box and steam dome: 0.94 m wide, its top 4.7 m from 1.7 m to 8.7 m, its rear end
  rounded down to the boiler; the chimney's lip stands on it. Dark safety valves, whistle, turbo-generator
  and the steam turret ahead of the cab.
- **Smoke deflectors.** Plates at 1.48 m from the centre line from 0.65 m back to 4.2 m, their foot
  rising from 1.55 m at the front to 2.5 m at 2.1 m; from 4.05 m their tops curl in over the smokebox on a
  0.4 m radius through 130 degrees (top 4.45 m), the curl's front corner rounded in side view. Horizontal
  pressed ribs every 0.2 m, white handrails inside the front edges, in a slightly lighter, glossier sheet.
- **Front.** The smokebox door with its ring, the headlamp at its top and the black "QJ 2204" plate;
  under it the red plate (1.94 x 0.7 m) with "QJ", the railway's emblem and "2204" in white (the real
  plate's "Qianjin" in Chinese characters drawn as QJ: the stroke font has no Chinese characters); the red buffer beam, the knuckle
  coupler at 0.88 m and the red slatted pilot.
- **Running board and cab.** The running board on 2.6 m from the deflectors to the cab with a white edge
  and three pipes under it; the black air reservoir under it over the drivers. The cab's windows as the
  diagram draws them (the front window, a narrow pair, the door's window), round roof, red number plate
  low on the side, ladders under the rear corners.
- **Running gear.** Red spoked drivers and dark disc carrying wheels, all with white tyres; two
  cylinders 650 mm across over the leading truck driving the third coupled axle (a 720 mm stroke drawn
  for the real 800 mm: the kit's largest crank that animates without flicker); black frames, the
  trailing truck's frame and the ash pan rising to the cab.
- **Tender.** A tall slab-sided box 3.1 m wide, the coal space's sides 3.95 m high over its front 62 %,
  sloping down to the water tank's deck at 3.3 m with two fillers; red sole bars, the white emblem on
  each side, white grab rails and a ladder at the rear, a reversing lamp. Two three-axle bogies, axles
  1.55 m apart and centres 6.2 m apart (measured: no published figure found).
- **Distant model.** The kit's, the deflectors as flat plates of their side outline, the casing as a
  long dome; the tender's red sole bars as a red block.
- **Not drawn.** The pipes along the boiler, the feed pump, the mechanical stoker's engine, the air
  horns, the Chinese characters and slogans.
