# China's units: bodies (3)

**Covers** - how nine more of China's multiple units are drawn, measured from their photographs: the CRH1A and CRH1E, the CRH2E sleeper and the CRH2G, the CRH3A, the CRH5G, the CRH6F, and the two power-car trains of around 2000, the DJJ1 "Blue Arrow" and the DJJ2 "China Star" - noses, cab faces, liveries, window and door layouts, pantographs.
**Code** - `generator/cnCrh1a.ts`, `generator/cnCrh1e.ts`, `generator/cnCrh2e.ts`, `generator/cnCrh2g.ts`, `generator/cnCrh3a.ts`, `generator/cnCrh5g.ts`, `generator/cnCrh6f.ts`, `generator/cnBlueArrow.ts`, `generator/cnChinaStar.ts`, `generator/cnUnits.ts` (`CN_UNITS`), `assets/cr-*/`
**See also** - [china-trains.md](china-trains.md) (the designs, deviations, tests), [china-units.md](china-units.md) (the first eight units, among them the CRH2A, CRH5A and CR200J these build on), [china-units-2.md](china-units-2.md) (the CR300, CR450 and CRH380B/CL/D), [shinkansen.md](shinkansen.md) (the series kit and its cab faces)

## The CRH1A's body

`generator/cnCrh1a.ts`, matched to the photographs in `assets/cr-crh1a/` (SOURCES.md; CRH1A-1003, the
former CRH1-003A, and CRH1A-1140 with the same original nose - not the CRH1A-A's Zefiro nose) and the
published figures. Heights over the rail, d behind the nose's tip. Face and body constants are exported
(`CRH1A_FACE`, `CRH1A_PROFILE`, `CRH1A_W`, ...) for the original CRH1E, which shares them.

- **Cars.** End car 26.95 m and intermediate cars 26.6 m over the couplers (213.5 m for eight), 4.04 m
  high, 3.328 m wide drawn 3.27 m in the Shinkansen gauge; the cant rail 3.45 m, the side's lower edge
  0.95 m with white underfloor skirts to 0.45 m. 2.7 m wheelbase, 915 mm wheels; the leading bogie 3.8 m
  behind the tip (under the cab shell's seam), 19.0 m bogie centres on the intermediate cars.
- **The nose** (a cab face, `CRH1A_FACE`, joining the body 2.5 m back): blunt and broad, one smooth
  convex surface. The white lower nose's front 1.0 m up, rounding back 0.22 m to the apron and 0.1 m to
  its top at 1.55 m; the dark panel leaning back about 30 degrees to the windscreen's foot (2.27 m,
  0.58 m back), the windscreen about 40 degrees to its head (3.5 m, 1.6 m back), the cap rounding to the
  crown 2.5 m back. In plan a flat face with 0.5 - 0.9 m round corners and a 0.1 m bow. The coupler hatch is
  only a seam in the lower nose (a box 1.7 m wide, 0.6 - 1.53 m), beside it a small cover and a vent;
  `test/cnCrh1aNose.test.ts` holds the centre line to one convex curve.
- **Face paint.** Dark navy from the lower nose's top over the windscreen and the cap to the roof,
  between white corner pillars: the panel (half width 0.95 m) with a white "CRH" and a lamp cluster at
  each end (clear cover, head lamp under the red tail lamp), widening to the windscreen (one large pane,
  half width 1.1 m); the destination display and a lamp on the cap; one wiper.
- **Livery** `crh`: stainless white; the royal-blue stripe (`#164aa1`) 1.60 - 1.74 m under the window
  band, tapering forward on the cab to a point 1.47 m up, 0.5 m behind the tip; the navy "CRH" mark
  behind the cab window; the cab shell's seam 3.7 m behind the tip; a ribbed grey roof. Number CRH1A-1003.
- **Windows and doors.** Large windows 1.83 - 2.79 m with black pillars, reading as one dark band. End car:
  the tall round-cornered cab side window (2.62 - 3.1 m, 2.27 - 3.26 m up), two panes from 3.9 m, the plug
  door 8.85 - 10.0 m (a narrow window in it), eight panes from 10.25 m. Intermediate car: four panes, the
  door 8.5 - 9.65 m from its front end, eight panes. One door a side on every car, both sides alike.
- **Roof.** The air conditioning unit behind the cab on the end car and at the front of every intermediate
  car; the single-arm pantograph on the end car near its inner end (23.4 m behind the tip, as on every
  photograph), the leading one raised, the rear one folded.
- **Still differs.** The table's Tp pantograph cars (2 and 7) are not followed; the CRH swoosh and the
  和谐号 characters are left out; doors and windows are estimates from oblique photographs; the dining
  car (ZEC) is drawn as an ordinary intermediate car.

## The CRH1E's body

`generator/cnCrh1e.ts`, `proc-vehicle-cr-crh1e`: the original CRH1E sleeper sets (CRH1-061E ... 075E,
CRH1E-1061 ... since 2012; Bombardier Sifang, 2009, on the Zefiro 250 platform), not the CRH1E-NG
(1229 ...) with the Zefiro-style nose. It spreads the CRH1A (`cnCrh1a.ts`): the same stainless body
section (3.27 m in the gauge, crown 4.04 m), window band 1.83 - 2.79 m and blue stripe 1.6 - 1.74 m,
intermediate cars 26.6 m; its own end cars 28.25 m (428.9 m for sixteen cars) and its own cab face.

- **The nose** (`CRH1E_FACE`): one smooth convex surface from the apron to the roof, the long "ECO" nose:
  the hatch's front 1.0 m up is the tip; above the hatch's top (1.62 m, 0.19 m back) the nose leans
  back at about 34 degrees, the windscreen at about 28 degrees from its foot (2.08 m, 0.88 m back) to
  the dark area's top (3.78 m, 4.26 m back); the roof reaches its crown 5.4 m behind the tip (the
  CRH1A's 2.5 m). The plan's corners 1.0 - 1.15 m round, swept back 2.4 - 2.8 m: a narrow lower nose
  between turned flanks. `test/cnCrh1eNose.test.ts` holds the profile to one convex curve and the
  nose's length (over 3 m behind the tip 3.5 m up).
- **The coupler hatch is only a seam**: a 1.34 m wide outline from 0.62 m to its arched top, the cover's
  centre split and the apron's seam, all flush decals - no knob or lip (the user's feedback).
- **Paint on the face**: the dark area round the windscreen and its blue frame are `paint` fields by
  their rear edge seen from the side (the foot 2.08 m on the centre line, rising back along the cab
  side to its top corner at the shoulder 4.7 m back), so the round plan makes the foot a U head-on;
  the glass a pane inside it (2.6 - 3.56 m), "Hexie hao" in white under it (the CRH3C's glyphs),
  one parked wiper. The lamp clusters slant down inward on the flanks (dark lens, red tail lamp at
  the outer end, two head lamps), a slatted grille under their inner end, a grey panel outline outboard.
- **The cab side**: the diamond window (5.0 - 5.9 m behind the tip, 2.5 - 3.34 m up, a dark frame and
  lighter glass, drawn as sweeps), "CRH" under it; the blue stripe falls forward from the body's level
  near the door to a point 3.2 m behind the tip, 1.0 m up.
- **Sides**: the end car's window band from 6.75 m behind the tip, one plug door 7.15 - 8.3 m back with
  its window in the band, ten panes to the rear; the soft sleeper one continuous dark band of twelve
  panes at a 1.96 m pitch (both sides alike within the photographs' detail) and one door at its rear end.
- **Roof and running gear**: the pantographs on the Tp cars next to the end cars (cars 2 and 15 of
  sixteen; zh.wikipedia), 3.0 m behind the car's front, the rear one raised and the other folded
  (`pantographSlots`); the end car carries none. Air conditioning behind the cab and at a sleeper's
  rear end; bogies 5.1 m behind the tip and 19.0 m apart.
- **Units**: `endCar` (61 seats), `middleCar` (soft sleeper, 40 berths), `train` of 2 - 8 cars (default
  4). 57 t / 55 t, 687.5 kW a car (11,000 kW from ten motor cars of sixteen), 250 km/h.
- Triangles: end car 14,716, sleeper 9,622; LOD 94 / 92 (trains up to 500).

## The CRH2E's body

`generator/cnCrh2e.ts`, measured on `assets/cr-crh2e/` (SOURCES.md): CRH2E-2132 nearly side-on (a projective
fit through the tip, the joint 25.7 m back and the second car's windows at 2.0 m), a soft sleeper of
CRH2E-2134 square to the camera (46 px/m), CRH2E-2122 and 2127 for the other side and the front. The
first-generation sleeper (CRH2E-2121 to 2140, first batch 2121 - 2126 as CRH2-121E to 126E, 2008) with the
E2-1000 nose; not the CRH2E "NG" (2461 - 2465) with the CRH2G's nose. Heights over the rail, d behind the tip.

- **Cars.** As the CRH2A: end car 25.7 m, intermediate cars 25.0 m, 3.7 m high, drawn 3.27 m wide (3.38 m
  real). The real set has 16 cars (Tc M M Tp / T M M T / T M M T / Tp M M Tc: two ZE seat cars at the
  ends, 13 WR soft sleepers, a dining car); the kit offers 2 - 8 cars (at most eight): the seat car at
  each end and sleepers between. The dining car (car 8, a ZEC on later sets) is not drawn.
- **The nose** is the CRH2A's cab face (`CRH2A.cabFace`, the oval cover, canopy and blue foot) with the
  CRH2B/2E's own fittings: the "phoenix eye" lamp on each flank of the bonnet, a dark almond with a pale
  lens rising toward the rear from 1.74 m up 1.25 m back to 1.97 m up 2.25 m back; no cab side window -
  the crew door (8.15 - 8.8 m, 1.3 - 3.12 m, a window high in it) stands on the face's cab side ahead of
  the passenger door (9.45 - 10.35 m), drawn as thin strips a few millimetres off the face (`crewDoor`:
  as face paint its edges would cost about 2,500 triangles).
- **Livery** (CRH2E-2122): white; the blue band 1.80 - 1.96 m under the windows, its top edge falling to a
  point at its foot 5.2 m behind the tip, under the CRH mark (full height from 7.0 m), the band level
  across both doors. The CRH mark and the "Hexie Hao" characters are not drawn.
- **Seat car (end car)**: behind the doors five windows 1.5 m wide at a 1.92 m pitch from 11.35 m and a
  short one (20.93 - 21.7 m), the rear 4 m blank; a destination display over the first window. Windows
  2.0 - 2.68 m with rounded corners (0.08 m).
- **Soft sleeper (intermediate car)**: one door, at its rear end; a display high over the first window
  behind it; ten compartment windows 1.22 m wide at a 1.99 m pitch, the first 2.52 m from the rear
  coupling plane, a short window (0.72 m) at the front end. Both sides were measured (compartment and
  corridor sides): they show the same ten windows at the same pitch within the photographs' accuracy,
  so both are drawn alike.
- **Running gear and underside**: the CRH2A's bogies (17.5 m centres, 2.5 m wheelbase); light grey skirt
  panels between the bogies down to 0.3 m with four dark grilles a side (over the CRH2A's dark box).
- **Roof**: the CRH2A's row of equipment covers on the end car; single-arm pantographs on the
  E2-1000's dish on the Tp cars - in eight cars the fourth and fifth (cars 4 and 13 of sixteen), at
  the kit's spot 1.5 m ahead of the rear bogie (the real car 4's stands nearer its front).
- **Figures**: 9,600 kW for sixteen cars (8M8T, 300 kW motors) given as 600 kW a car, so the 8-car model
  train has 4,800 kW; 250 km/h; 46 t end car, 45 t sleeper (estimated, no published car weights found).
  Seats: 55 in a seat car, 40 berths in a sleeper.

## The CRH2G's body

`generator/cnCrh2g.ts` (`proc-vehicle-cr-crh2g`, a draft): the 8-car, 250 km/h cold-, wind- and
sand-resistant CRH2 of 2015 (CRRC Sifang, also CRRC Puzhen), with the CRH2E "NG" sets' long nose in
place of the CRH2A's E2-1000 face. The series kit with the CRH2A's body section (`...CRH2A`) and its own
cab face, measured on `assets/cr-crh2g/` (the square side photograph of 0001 at 83 px/m from the 2.5 m
wheelbase and the 3.7 m roof; the front three-quarters of 0001 and 4072 for the face).

- **Lengths**: 25.7 m end cars and 25 m intermediate cars (201.4 m over 8 cars, painted on the cars). The
  face joins the body 7.45 m behind the tip (the CRH2A's 9.2 m); the passenger door follows at
  7.73 - 8.65 m, its tall window 0.45 m wide (2.05 - 2.92 m). Leading bogie 4.0 m behind the tip, 17.5 m
  bogie centres. Skirt bottom `B` 0.55 m (the CRH2A's 0.66 m): the grey side skirts hang lower.
- **Nose**: one convex centre line from the snout's foot (0.55 m, 0.26 m back) to the tip 0.84 m up, the
  bonnet rising ever steeper: 1.43 m at 0.58 m back, 2.1 m at 1.67 m, 2.73 m at 2.87 m, 3.24 m at 4.08 m,
  3.64 m at 5.95 m, the roof at the join. Plan: the corner the whole half width, 4 m deep below 1.8 m,
  2.2 m from 2.4 m up - a broad top on which the windscreen and mask lie, hardly seen from the side (as
  the photographs show). The coupler hatch is only a seam outline (`hatchSeam` decals, 0.83 m half
  width, 0.56 - 1.535 m) with a split down the middle: no cover, knob or lip. `test/cnCrh2gNose.test.ts`
  holds the profile one smooth convex curve (the painted lines 1 cm proud left out).
- **Face**: a grey mask (`paint`, within 1.1 m of the centre line) over the top of the nose round the
  windscreen and back along the roof to the join, its sides narrowing down to the hatch's top at 1.56 m;
  the windscreen 2.6 - 3.42 m, +-0.98 m, split down the middle; a slanted lamp unit at each lower corner
  (1.82 - 2.52 m, its red tail lamp in the top); the characters "Hexie hao" (`ink`) at 1.62 m.
- **Livery** (`crh`, "CRH blue"): white; the grey lower body to 0.96 m, wrapping under the snout's sides;
  the blue stripe 1.58 - 1.68 m, rising over the bonnet to its crest 5.2 m back (1.73 - 1.83 m) and diving
  to its point 0.71 m behind the tip, 1.11 m up; the dark window band 1.86 - 2.73 m along every car, its
  front end slanting from 7.49 m (foot) to 6.53 m (top corner); three dark strokes ahead of it, slanting
  forward going up and shorter toward the nose; the almond cab side window 3.71 - 5.25 m, 2.51 - 2.98 m.
- **Windows**: the end car seven 1.38 m windows at a 2.03 m pitch from 9.48 m, a display over the door's
  rear; the intermediate cars the CRH2A's layout. All in the dark band.
- **Roof and running gear**: a raised air-conditioning unit (sloped ends, dark grilles) at the end car's
  inner end and at each intermediate car's front end; the CRH2A's pantograph on its cover on cars 4 and
  6 of eight; a grey plough set back under the snout (0.9 - 2.2 m back, down to 0.13 m).
- **Figures**: 6M2T, 7,200 kW assumed (six motor cars of 4 x 300 kW; no published figure found), given
  as 900 kW a car; 44 t end cars, 46 t intermediate cars; 250 km/h. Seats 48 (the first-class end car), 83
  an intermediate car on average (613 in eight cars).
- **Budget**: 15,340 triangles the end car, 9,320 an intermediate car; the distant model 92 / 98, 392
  for four cars, 494 for eight.

## The CRH3A's body

`generator/cnCrh3a.ts`, measured from `assets/cr-crh3a/` (CRH3A-5238 front three-quarter at Chengdu East,
5253 near side-on at Guilin and at Chengjiayao, 5244 at Zhenjiang): the Changchun production sets
5230 - 5257 (2017), the version with by far the most photographs; the CRH3A-A is not drawn. Its own Chinese
cab face (`SeriesCabFace`), not the CRH3C's Velaro face, on the China standard shell: end car 27.35 m,
intermediate car 25.7 m, 17.5 m bogie centres, 920 mm wheels; narrowed from 3.36 m to the Shinkansen
gauge's 3.3 m (half width 1.62 m), crown 4.05 m, skirts down to 0.5 m.

- **Profile.** One smooth convex curve from the skirt to the roof: the broad rounded snout's front nearly
  upright from 0.85 to 1.5 m, its tip at 1.2 m, rounding back 0.42 m to the skirt and over its top (1.95 m,
  0.4 m back) into the face, which leans back past the lamps to the windscreen's foot (2.68 m, 1.0 m back);
  the windscreen ever more raked to its head (3.75 m, 3.0 m back), the roof at full height about 5.5 m and
  the join 9.6 m behind the tip. Plan: round at every height, full width 1.9 m back at the skirt, 2.3 m at
  the lamps, 2.0 m at 3.5 m.
- **Snout.** The coupler hatch is only a dark seam outline flush in the surface, 1.7 m wide from 0.68 to
  1.95 m with broadly rounded top corners - no lump or lip (`test/cnCrh3aNose.test.ts` holds the profile
  to one convex curve, its tip at 0.75 - 1.3 m).
- **Face.** The slanting almond lamp housings over the snout's top corners (inner pointed end 0.45 m out
  at 2.0 m, outer end 1.27 m out at 2.5 m on the corner), the red tail light at the inner end and the white
  headlight in the outer half; three grille slots between them (2.28 - 2.43 m) and an inspection hatch's
  seam under the windscreen; the windscreen 2.3 m wide at its level foot, wrapping round the corners, its
  lower edge on the sides rising to the rounded rear end 5.35 m back, its black frame 4 cm; one wiper; the
  dark roof-light slot on the crown.
- **Livery.** White; the navy window band 2.0 - 2.95 m, its front end leaning forward at its foot 8.55 m
  behind the tip with the white CRH emblem on its blank front end ahead of the door; the royal blue line
  1.74 - 1.87 m under it, its front point at 4.45 m and its flag leaning back up to a point 0.45 m over it
  (5.2 m back); the gold eye round the cab side window (the face's paint, above the shoulder): front point
  2.5 m up 5.7 m back, dipping to 2.38 m, its tail high at 3.6 m 9.0 m back; two square service hatches'
  seams on each side of the nose (1.28 - 1.8 m). The band and the line run on over the door leaves.
- **Layout.** End car: the door 10.65 - 11.6 m behind the tip, eight windows at a 1.956 m pitch behind it;
  intermediate car: the door at its front end and eleven windows. Pantographs as the series kit's default.
- **Figures.** 4M4T, 5,120 kW at the wheels (640 kW a car in the model), 250 km/h; weights 52 t / 50 t
  estimated (none published); seats as the China standard 250 km/h layout (54 / 84).

## The CRH5G's body

`generator/cnCrh5g.ts`, measured from the photographs in `assets/cr-crh5g/` (SOURCES.md) and the
published figures. The model is one of the twelve enhanced sets (CRH5G-5218 - 5229, 2017) with the new
nose and the dark window band; the earlier CRH5G kept the CRH5A's nose and livery. The body, the
section, the cars' lengths (27.6 m and 25.0 m over the couplers), the running gear and the fittings are
the CRH5A's.

- **Snout** (a cab face, `CRH5G_FACE`, 7.0 m long): one smooth convex profile, no step, lip or knob. The
  tip is the big coupler cover's round front 1.15 m up; below it the underside tucks back to the spoiler
  0.75 m behind the tip; above it the face leans back ever more steeply over the cover's top (1.78 m up,
  0.3 m back), the lamps and the grille to the windscreen's foot (2.45 m up, 1.17 m back), the glass
  leaning back at about 25 degrees to its head (3.35 m up, 3.1 m back), the white cab roof over it to the
  crown. In plan one elliptic corner over the whole half width, reaching full width 2.6 m back low down.
  The **coupler cover** is the snout's own lower part: only its seam is drawn (a thin dark line flush
  with the face, seen head-on a rounded square 2.84 m wide, 0.58 - 1.78 m up, its top just under the
  lamps' inner ends) and its split down the middle; `test/crh5gNose.test.ts` keeps the side profile
  convex.
- **Paint on the face**: a separate dark windscreen (2.45 - 3.35 m, a dark rim, a lighter pane, two
  wipers) under the white cab roof, its rear corner 4.85 m back on the side; a light grille with two
  slots between the lamps just under it; two lamp lozenges slanting up to the corners (black housing,
  clear lens, a head lamp outside and a red lamp inside).
- **Livery** `crh` (one, so no `livery` parameter): white; the dark band 1.97 - 3.08 m along every car,
  its front on the nose a straight edge leaning forward (1.97 m up 4.75 m behind the tip, 2.44 m up
  4.19 m back), its head curving back to the band's top at 6.4 m, the cab side window (5.2 - 6.1 m back,
  2.36 - 2.95 m up) inside it; two dark chevrons ahead (a parallelogram and a triangle, rear edges
  parallel to the band's front, the triangle's point 3.07 m back, 1.86 m up); a white line, then the blue
  stripe 1.72 - 1.84 m thinning to a point 2.2 m behind the tip; white doors with the stripe over them;
  the passenger windows a lighter glass in the band; "CRH" in white ahead of the first door; number
  CRH5G-5228 (photographed). The distant model keeps the nose white ahead of the band (`lodSideFields`).
- **Sides**: the end car's single door 9.0 - 9.9 m behind the tip, a narrow pane, six windows 1.2 m wide
  1.85 m apart, the rear blank (no rear door, as on photo-crh5g-5227); the intermediate cars as the
  CRH5A's.
- **Running gear and roof**: the leading bogie 6.2 m behind the tip (under the face's skirt, listed in
  `COVERED` in test/worldTrainsSuite.ts as the CRH5A), 19.0 m bogie centres; an air-conditioning hood on
  the cab roof just behind the face (6.6 - 9.4 m) and one at the end car's rear, one on each intermediate
  car; single-arm pantographs on the Tp cars (third and third from last), as the CRH5A.
- **Figures**: 613 seats (48 / 90 / 90 / 77 / 63 / 90 / 90 / 65; the end car 56, an intermediate car 83
  on average), 5,500 kW, 250 km/h, 59 / 56 t a car (about 460 t; the CRH5A's 451 t plus the cold and sand
  equipment, no published figure).
- **Still differs**: no true side-on photograph of an enhanced set was found, so the nose's lengths come
  from a projective fit on an oblique photograph and rendering the model in the same view (about +-0.3 m);
  the 和谐号 lettering under the windscreen is left out; the distant model drops the thin blue stripe.

## The CRH6F's body

`generator/cnCrh6f.ts`, measured on the side-on photograph of CRH6F-0475 in `assets/cr-crh6f/` (SOURCES.md;
40 px/m along the side, 39.4 px/m up) and the three-quarter photographs of 0477, 0418 and 0411, set to the
published figures: end car 25.7 m and intermediate cars 25.0 m over the couplers (201.4 m for eight),
3.86 m high, 3.3 m wide (drawn 3.24 m, as the CRH6A), 0.86 m wheels on a 2.5 m wheelbase, 17.9 m bogie centres.

- **Nose** (a cab face, `CRH6F_FACE`, 3.4 m to the join): shorter and blunter than the CRH6A's. One smooth
  convex curve from the coupler cover's front (the tip, 1.22 m up) through 2.0 m up 0.35 m back, 2.6 m up
  0.9 m back, 3.5 m up 2.1 m back to the crown 3.4 m behind the tip; the cover is one surface with the
  nose, its seam (flat top 2.0 m up, sides down to 0.75 m, a split down its middle) only a thin dark line.
  In plan a round snout low down (an elliptic corner over the whole half width, 2.2 m deep), a broad face
  with 0.65 m corners over the windscreen.
- **Face paint**: the dark grey canopy across the face (1.14 m either side of the centre) from the lamp
  housing over the windscreen and the cab roof; the windscreen 2.53 - 3.6 m up in a thin light frame, one
  wiper; the dark lamp housing 2.03 - 2.44 m with a grey lens strip, six headlamps and a red tail line; the
  slanted cab side window 1.33 - 2.59 m back, 2.63 - 3.31 m up; grey under the cover below 0.8 m.
- **Livery** `jinshan` (the Jinshan Railway's CRH6F-0475): white; the dark band 1.93 - 2.94 m ending in a point
  2.58 m up 2.69 m behind the tip, framed 0.04 - 0.21 m ahead by a blue chevron and 0.27 - 0.44 m ahead by an
  orange one, their arms running on to 3.07 m; the blue line 1.79 - 1.85 m under the band, which the lower
  blue arm becomes; a blue swoosh low on the nose from 1.4 m up 0.4 m back, cresting 1.72 m up 1.5 m back, to
  a point 5.2 m back; the grey skirt below 0.98 m. Each chevron is two sweeps (its lower and upper arm): a
  face paint layer may cover only one interval up any column of the face.
- **Sides**: wide bi-parting plug doors 1.7 m wide (1.15 - 3.27 m, the real sill 1.05 m raised so that the
  step plate stays in the gauge), a narrow round-cornered window in each leaf; equally spaced for platform
  screen doors: on the end car at 12.0 and 20.65 m behind the tip (the second over the rear bogie), the
  narrow cab door 3.42 m back; on the intermediate cars three, centred 4.25, 12.5 and 20.75 m behind the
  coupling plane. Windows 1.36 m wide, 2.07 m apart: two between the cab door and the first door, three
  between the doors, a narrow 0.73 m pane at each end of an intermediate car; the end car's rear end blank.
- **Running gear and roof**: the end car's bogies 3.9 m (under the cab door) and 21.8 m behind the tip; the
  long low equipment fairing 6.4 - 19.4 m on the end car, 4 - 16 m on the others; single-arm pantographs on
  the kit's cars (cars 3 and 6 of eight, as the real Tp cars).
- **Still differs**: the swoosh's thin orange underline is left out (the face's triangle budget); the real
  cover stands a little proud of the face round its seam, drawn flush (one smooth surface); the empty
  weights are estimates.

## The DJJ1 Blue Arrow's body

`generator/cnBlueArrow.ts`, matched to the photographs in `assets/cr-blue-arrow/` (power cars 0001A,
0007A and two in Guangshen service, the preserved power car at Huangsha and a preserved driving trailer;
a side elevation sprite of the whole set for the trailers' layout). The set runs as 1M6T: one Zhuzhou
power car, five Changchun coaches and a driving trailer with the same nose at the other end. Built like the
CR200J: the coaches and the driving trailer are one series (`BLUE_ARROW`, unwired), the power car its lead
car (`leadCar`); a train is the power car, `cars` - 2 coaches and the driving trailer, turned. Unit values
`endCar` (power car, the default), `middleCar`, `drivingTrailer`, `train` (`cars` 3 - 7, 4 the default).

- **Size.** Power car 20.5 m, coach 25.5 m, driving trailer 25.325 m over the couplers (published; the
  set 173.33 m); 3.1 m wide (3.104 m); roofs 3.95 m (power car) and 4.0 m, drawn to the US gauge.
- **Nose.** One cab face for both cab cars, its centre line measured on the side-on photograph of 0001A
  (about 44.5 px/m): a rounded bumper (its front 1.0 m up) tucking under to the skirt, the face rising at
  about 45 degrees past the lamp windows (2.5 m, 0.85 m back) to the windscreen's foot (2.92 m, 1.4 m
  back), the windscreen raked about 30 degrees to its head (3.48 m, 2.4 m back), the canopy rounding over to
  the roof 4.4 m behind the tip. In plan big corners (1.15 - 1.25 m radius, 1.2 - 1.3 m deep) and almost no
  vee (bulge 0.05 m): one smooth convex surface; the coupler hatch is only a seam (a thin line arching over
  the bumper from the teal line, its top at 1.6 m), never a lump.
- **Face paint.** White; the grey canopy from under the windscreens over the crown and back past the cab
  side window; two windscreens either side of a broad pillar in dark frames; three lamp windows (the head
  lamps' clear covers at the sides, a dark marker window in the middle); the navy arrow and "ARROW" under
  the right lamp; the teal line (0.92 - 1.02 m) along the bumper's lower edge, grey under it.
- **Livery.** White over a navy line (1.45 - 1.62 m) along every car with grey under it; on both cab cars
  the line sweeps down the nose's flank (from 4.9 m behind the tip) to the bumper's teal line.
- **Power car.** The cab side window 2.2 - 2.9 m behind the tip (2.2 - 2.9 m up), one crew door 5.1 m behind
  the tip, plain sides ("GUANGSHEN RAILWAY", DJJ1-0007A); louvres along both roof edges over 4.0 - 17.6 m;
  two single-arm pantographs, the rear one (14.8 m) raised, the front one (6.2 m) folded, the breaker and roof
  line between them; Bo-Bo bogies 10.5 m apart (estimated) on 1.05 m wheels, 2.8 m wheelbase, the leading one
  showing through a wheel cut in the nose's skirt. 78 t, 4,800 kW, 200 km/h.
- **Coaches.** A door at each end, thirteen 1.1 m windows 1.62 m apart in a dark band, an air-conditioning
  unit over each end; bogies 18 m apart. 45 t (estimated), 67 seats on average.
- **Driving trailer.** The nose, the cab side window, a crew door 5.15 m behind the tip, two small windows,
  a door 10.8 m behind the tip, six windows 1.75 m apart from 12.3 m and the rear door; bogies 17.5 m apart.
  47 t (estimated), 78 seats.

## The DJJ2 China Star's body

`generator/cnChinaStar.ts`, matched to the photographs and the two side drawings in `assets/cr-china-star/`
(SOURCES.md: power cars 0001A and 0001B, preserved at Shenyang and at the China Railway Museum; the set new
and in service at Shenyangbei, 2006). The DJJ2 is a power-car train, two Bo-Bo power cars at the ends of nine
25DT trailers. On the series kit the end car is the power car (`endSides`, `endPantograph: true`, as the Renfe
S-100's) and the intermediate car a trailer, each on its own two bogies; a train is a power car, `cars` - 2
trailers and the power car turned. Unit values `endCar` "Power car" (the default), `middleCar` "Coach",
`train` "Full train", 3 - 8 cars (default 4; the record run had five, the full set eleven). One livery, so no
`livery` parameter.

- **Size.** Power car 21.7 m over the couplers (published), trailer 26.6 m (25.5 m body); 3.2 m wide (the
  trailers' 3.3 m drum section narrowed to the Shinkansen gauge); roof 3.95 m, shoulder 3.4 m (the drawing
  scaled to 21.7 m, 15.2 px/m).
- **Nose** (the "platypus" head, `CHINA_STAR_FACE`, 5.5 m published). One smooth convex centre line: the
  bill's rounded tip 0.95 m up over the teal foot (its bottom 0.3 m up, 0.42 m back), the bill rounding over
  at 1.5 m into the hood rising evenly at about 33 degrees to the windscreen's foot (2.5 m, 2.45 m back), the
  windscreen to 3.45 m (4.1 m back), the canopy rounding over to the roof at the join. In plan the bill is
  round (corner radius 1.3 - 1.35 m, swept back 1.8 - 1.9 m), the face hardly bowed (bulge at most 0.06 m),
  so that its section is one smooth curve; a steeper bow against the round corners made a crease and lobes.
  No coupler bulb: the bill's movable cover is only a flush thin seam arching over it, split down its middle.
- **Face paint.** The teal foot under the bill, its top edge rising from the bill's lower seam (0.66 m) back
  along the flanks to the side band's top (1.4 m) at the join; the blue round the windscreen and over the
  canopy, dipping in a tongue under the windscreen round the centre lamp, its edge on the flanks rising back
  to the side's blue band (3.25 m); a grey visor over the windscreen; three dark lamp housings - the two eyes
  on the hood's flanks (1.8 - 2.03 m) and the centre one in the tongue - and the light grey grille panel
  under it. The windscreen one wide pane (2.24 m, 2.55 - 3.35 m) with two wipers.
- **Power car.** The cab side window an upright pane 5.6 - 6.2 m behind the tip, the red number DJJ2 0001B
  under it, the crew door 7.2 - 8.0 m, "CHINA STAR" with the orange swoosh at 10.6 m (the Chinese
  characters and the blue C of the logo not drawn); louvre panels along both roof slopes, the
  disconnector and roof line ahead of the pantograph; one single-arm pantograph (Stemmann DSA380) 17.6 m
  behind the tip over the rear bogie, raised on both power cars (each feeds itself); Bo-Bo bogies 6.35 m
  and 17.65 m behind the tip (11.3 m apart) on 1.25 m wheels, 3.0 m wheelbase (`endCarRunningGear`); the
  skirt open over the leading bogie, whose front wheels stand under the nose (`wheelCut`).
- **Trailer** (the Sifang RZ2 25DT drawing). A plug door at each end, ten 1.6 m windows 1.9 m apart
  (1.95 - 2.75 m) and the dark panel of the toilets at the rear; bogies 18 m apart on 0.915 m wheels; the
  first-class, bar and Changchun aluminium cars are drawn alike.
- **Livery.** Ivory white; teal (#16848f) to 1.4 m on every car; blue (#6f86cf, between the faded museum
  lavender and the brighter blue of the set when new) from 3.25 m over the roof.
- **Game figures.** Power car 78 t (zh Wikipedia; 84 t in another source), 4,800 kW, 270 km/h; trailer 48 t
  (estimated); a train its cars added up, 9,600 kW. Seats: 80 a trailer (726 in nine).
- **Not drawn.** The Chinese characters of the logo, the trailers' own numbers (the kit's number would fall
  on the window row), the bar car's and the first-class cars' differences.
