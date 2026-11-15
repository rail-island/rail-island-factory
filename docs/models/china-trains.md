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
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series, its power cars' pantographs | `unit`, `cars` 4 - 8, `livery` (`green`, `whiteRed`) | 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series, its own cab face (`cnCrh6a.ts`), Shinkansen gauge | `unit`, `cars` 4, 8 | the short intercity nose; 25.7 / 25.0 m, 3.86 m high; 5,520 kW, 200 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | its own (`cnHxn5.ts`): GE Evolution hood, full-width Chinese cab | - | 22.295 m, Co-Co, 150 t, 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | box locomotive | - | 35.2 m, eight axles, 9,600 kW |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, raked | - | Co-Co, 20.85 m, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, flat | - | Co-Co, 20.4 m, 3,780 kW |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, streamlined | - | Bo-Bo, 17.5 m, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | its own (`cnDf4.ts`) on the box locomotive kit: the DF4B, US gauge | `livery` (`orangeWhite` "Orange", `green`) | Co-Co, 21.1 m, 138 t, 2,430 kW, 100 km/h |
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

## The CR DF4 Dongfeng's body

`generator/cnDf4.ts`, its own LocoSpec on the box locomotive kit (unchanged), drawn as the
common DF4B and measured from the works drawing and the photographs in `assets/cr-df4/`
(SOURCES.md; units 1787 and 2480 carry the two liveries' numbers).

- **Size.** 21.1 m over the coupler centres, bogie centres 12.0 m, 2 x 1.8 m bogie
  wheelbase, 1.05 m wheels; the roof's top 4.47 m, the headlight 4.64 m, the radiator's
  railing 4.86 m. The real body is 3.309 m wide; it is drawn 3.2 m wide so the handrails stay
  within the US gauge's 3.3 m (`loadingGauge: "us"`, as the HXN5; the UIC gauge's 4.7 m is
  lower than the DF4's 4.755 m).
- **Cab ends.** A full-width carbody with a cab at each end. The face leans back 6 cm from
  the shell's foot (1.15 m) to the windscreens' sill at 2.95 m, the two big windscreens
  (3.0 - 3.72 m, 1.02 m wide each) 0.24 m more to their head, then the cab roof's brow rises
  back to the roof 1.0 m behind the foot. In plan the face is flat across the windscreens
  and its corners round back 0.36 m to the side. On the brow the round headlight housing
  (0.44 m across) with two horns behind it; a silver twin-lamp box (white outboard, red
  inboard) either side at 2.27 - 2.47 m; a small grille under the emblem; the number plate
  on the broad lower band. Below the body the grey apron, the red plough with three rows of
  slots and the automatic coupler at 0.88 m (drawn as the kit's centre coupler; no buffers).
- **Livery.** The stripe's "V" on both faces: level with the side stripe (3.03 - 3.15 m) at
  the corners, falling to its fork at 2.12 m under the CR emblem (a white ring over the
  rail's section). The broad lower band (1.39 - 1.62 m) wraps round the cab's corners and
  narrows to the side's lower stripe (1.45 - 1.57 m) 1.45 m behind the face. `green`: dark
  green, yellow stripes, grey roof, dark running gear (DF4B 1787). `orangeWhite` (kept as
  the saved key, retitled "Orange": the real livery has no white): orange-red with yellow
  stripes, light grey roof, apron and running gear (DF4B 2480).
- **Sides** (from the No. 2, +x, cab; DF4B 9221 by a projective fit; both sides alike, the
  far side not photographed): the cab's side window (0.55 - 1.2 m behind the face) and door
  (1.45 - 2.05 m); the cooling room's four louvred panels over four tall louvres (2.4 - 7.4 m);
  two windows over small louvres (8.1 - 10.7 m); the side door (11.05 - 11.6 m); two small
  low windows (12.2 - 13.7 m); two windows over louvres toward the No. 1 cab (15.05 - 17.2 m);
  the cab door and window mirrored at the No. 1 end. The running number painted on the cab
  sides (digits only: the plates' "东风4" characters are not drawn).
- **Roof.** The radiator frame over the cooling room with its two fan discs and a railing,
  the two exhaust stacks over the engine and a low box over the No. 1 end.
- **Distant model.** The kit's box locomotive LOD from the same tables and paint (98
  triangles); the pilots, lamp boxes and headlights are left out.
