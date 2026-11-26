# China's units: bodies

**Covers** - how each of China's eight multiple units is drawn, measured from its photographs: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C, CRH5A, the CR200J and the CRH6A - noses, cab faces, liveries, window and door layouts, pantographs.
**Code** - `generator/cnCr400af.ts`, `generator/cnCr400bf.ts`, `generator/cnCrh380a.ts`, `generator/cnCrh2a.ts`, `generator/cnCrh3c.ts`, `generator/cnCrh5a.ts`, `generator/cnCr200j.ts`, `generator/cnCrh6a.ts`, `generator/cnUnits.ts` (`CN_UNITS`), `assets/cr-*/`
**See also** - [china-trains.md](china-trains.md) (the designs, deviations, tests), [china-locos.md](china-locos.md) (the locomotives, coach and wagons), [shinkansen.md](shinkansen.md) (the series kit and its cab faces)

## The CR400AF's body

`generator/cnCr400af.ts`, measured on the line-scan side photograph (a true side view, 22.6 px/m
both ways) and the three-quarter photographs in `assets/cr-cr400af/` (SOURCES.md).

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

## The CR400BF's body

`generator/cnCr400bf.ts`, measured from the photographs in `assets/cr-cr400bf/` (SOURCES.md) and the
published figures; heights over the rail, d behind the nose's tip.

- **Lengths.** End car 27.35 m and intermediate car 25.7 m over the couplers (27.09 m and 25.65 m
  published), eight cars 208.9 m (209.06 m). 17.5 m bogie centres, 920 mm wheels; the leading bogie
  7.05 m behind the tip, the others 3.85 m in from the body ends. Body 0.5 - 4.05 m, 3.24 m wide in the
  gauge (3.36 m real); white skirts down to 0.5 m, no underfloor box below them.
- **The nose** is a cab face joined to the body 9.4 m behind the tip: one smooth, continuous "phoenix"
  head from the skirt to the canopy, measured on the B-5155 side view (22.4 px/m along the car). Its
  centre line is a single convex curve with the tip 1.0 m up at the coupler hatch: 0.3 m back at the
  skirt (0.5 m), 0.18 m at the hatch's top (1.45 m), 0.49 m at the canopy's chin (1.75 m), 1.1 m at
  2.2 m, 1.75 m at 2.6 m, 4.55 m at 3.6 m, the crown 9.4 m back. Its plan is round at every height,
  blunt at the hatch (elliptic corners 1.5 - 1.6 m deep below 1.0 m, the G-5167 from above) and longer
  above (2.5 m at 1.8 m). The coupler hatch is no separate part: only its seam, a thin dark outline
  flush in the surface (a rounded box 1.8 m wide from 0.56 to 1.57 m, its top arched) with the leaves'
  joint down its middle. The distant model's end has the same profile and plan on fewer rows.
  `test/cnCr400bfNose.test.ts` holds the centre line to one convex curve (an earlier model drew the
  hatch as a bulb standing 1.25 m out of a face 0.55 m behind the tip, a lump the train does not have).
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

## The CRH3C's body

`generator/cnCrh3c.ts`, matched to the photographs in `assets/cr-crh3c/` (unit CRH3-037C).
The Velaro CN shares the ICE 3's snout, so the design reuses its measured cab face
(`ICE3_FACE`, [germany-trains.md](germany-trains.md)) with the CRH face's own paint (the AVE S-103,
`esS103.ts`, does the same with Renfe's).

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
