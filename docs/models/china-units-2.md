# China's units: bodies (2)

**Covers** - how seven more of China's multiple units are drawn, measured from their photographs: the Fuxing CR300AF and CR300BF (250 km/h), the CR450AF and CR450BF prototypes (400 km/h), and the CRH380B, CRH380CL and CRH380D - noses, cab faces, liveries, window and door layouts, pantographs.
**Code** - `generator/cnCr300af.ts`, `generator/cnCr300bf.ts`, `generator/cnCr450af.ts`, `generator/cnCr450bf.ts`, `generator/cnCrh380b.ts`, `generator/cnCrh380cl.ts`, `generator/cnCrh380d.ts`, `generator/cnUnits.ts` (`CN_UNITS`), `assets/cr-*/`
**See also** - [china-trains.md](china-trains.md) (the designs, deviations, tests), [china-units.md](china-units.md) (the first eight units: CR400AF/BF, CRH380A, CRH2A, CRH3C, CRH5A, CR200J, CRH6A), [china-units-3.md](china-units-3.md) (the CRH1, CRH2, CRH3A, CRH5G and CRH6F variants, the DJJ1 and DJJ2), [shinkansen.md](shinkansen.md) (the series kit and its cab faces)

## The CR300AF's body

`generator/cnCr300af.ts`, measured on the oblique photographs in `assets/cr-cr300af/` (SOURCES.md; no
true side view exists on Commons, so positions along the nose come from their relative proportions and
are good to about half a metre) and set to the published figures; heights over the rail, d behind the
nose's tip.

- **Lengths.** End car 27.525 m from the tip to its coupling plane, intermediate cars 25.65 m: eight
  cars 208.8 m (208.95 m published). Body 4.05 m high, drawn 3.28 m wide in the Shinkansen gauge (3.36 m
  real). 17.8 m bogie centres, 920 mm wheels: the leading bogie 5.8 m behind the tip.
- **Nose** (a cab face, `CR300AF_FACE`, joining the body 9.6 m behind the tip): the CR400AF's family
  look, blunter and shorter. Its centre line is one convex curve, its slope growing steadily from the
  coupler cover up - no step, lip or knob at the tip: the coupler cover's round front 1.0 m up, the chin
  1.97 - 2.5 m (1.0 - 1.6 m back), the windscreen 2.5 - 3.45 m (1.6 - 3.4 m back), the crown almost at
  full height 7 m back. In plan a blunt front about 1 m wide with 1.15 m corners low down, the corners
  reaching full width 3 - 4 m behind the centre line.
- **Coupler cover** (the user's bulge rule): one surface with the nose; only its seam is drawn, a dark
  line across the face 1.58 m up, down each side to the skirt 2.3 m back, and its split down the middle.
- **Face paint.** The gunmetal visor over the windscreen and back over the cab to a point on the roof
  9.55 m back, edged in red (also under the windscreen); a warm grey chin panel with China Railway's
  orange emblem; slanted lamp strips at the chin's corners up to the windscreen's outer corners; a roof
  lamp box; one wiper. The cab side window a lozenge 6.6 - 9.2 m back, 2.72 - 3.3 m up, under the visor.
- **Livery (`blue`, "Blue", CR300AF-2038).** Sky blue ("blue sister"); the black window band
  1.85 - 2.88 m over a white line and the red stripe 1.64 - 1.77 m. On the nose the red arrow: an upper
  arm from its point on the cheek (4.8 m back, 1.5 m up) rising to the band's top 9.6 m back, 0.65 m deep
  over the band's point, and a lower arm from the same point widening into the stripe 9 m back; between
  them a white rim round the band's point (7.95 m back at the band's foot, its front edge rounding up to
  the top 11.5 m back). "CR" on the band near the end car's rear; the number under the band 10.2 m back.
- **Sides.** End car: the one door 12.3 - 13.3 m behind the tip, six panes 1.15 m wide at 1.85 m from
  14.4 m (as counted on CR300AF-2013), a destination display over the band at 14.0 m, a blank rear end.
  Intermediate cars: a door at each end (pairs at every joint, as photographed), nine panes 1.4 m wide.
  Plug doors with a narrow, round-headed window. Single-arm pantographs on cars 3 and 6 (the kit's rule).
- **Not drawn.** The panes in the band ahead of the door (painted black), the Chinese and Mongolian
  "Fuxing Hao" lettering, the roof's small fittings; the visor's tail is a little shorter than the
  photographs' (it ends on the face, 9.55 m back). Weights are estimates (no published figure).

## The CR300BF's body

`generator/cnCr300bf.ts`, measured from the photographs in `assets/cr-cr300bf/` (SOURCES.md) and the
published figures; heights over the rail, d behind the nose's tip. The 250 km/h Fuxing on the CR400BF's
shell, with its own face and paint.

- **Lengths.** As the CR400BF: end car 27.35 m and intermediate car 25.7 m over the couplers, eight cars
  208.9 m (about 209 m published). 17.5 m bogie centres, 920 mm wheels, the leading bogie 7.05 m behind
  the tip. Body 0.5 - 4.05 m, 3.24 m wide in the gauge (3.36 m real).
- **The nose** is a cab face joined to the body 9.4 m behind the tip: one smooth, continuous head from the
  skirt over a broad upright snout to the canopy (3119 near side-on). Its centre line is a single convex
  curve with the tip 1.05 m up on the snout: 0.3 m back at the skirt (0.5 m), the snout's front nearly
  upright from 0.75 to 1.35 m (0.06 m back), 0.16 m at its top (1.5 m), 0.75 m at the lamps (1.95 m),
  1.24 m at the windscreen's foot (2.25 m), the crown 9.4 m back. Its plan is round at every height, the
  snout narrower than the CR400BF's hatch (elliptic corners 1.9 - 2.1 m deep below 1.0 m, 2.6 m at 1.8 m).
  The coupler hatch is the snout's front, no separate part: only its seam, a thin dark outline flush in
  the surface (a rounded box 1.56 m wide from 0.56 to 1.7 m) with the leaves' joint down its middle.
  `test/cnCr300bfNose.test.ts` holds the centre line to one convex curve.
- **The canopy.** Charcoal over the whole face down to the snout: its lower edge a broad U dipping to
  1.46 m on the centre line over the snout's top, its corners at the hatch's (0.73 m out at 1.72 m), then
  up the cheeks beside the lamps to the windscreen's lower corners (1.28 m at 2.6 m) and back on the sides
  above the wing to the crown 9.0 m behind the tip; outlined by a thin gold border (0.07 m head-on, 0.08 m
  on the sides). The windscreen 2.26 - 3.57 m, a white roof light above it (3.66 - 3.74 m), a tall lamp
  strip at each lower corner of the canopy (0.54 - 0.9 m out, 1.8 - 2.25 m), the gold China Railway
  emblem between them (1.98 m), one wiper.
- **The side's paint.** Sky blue; a charcoal window band 2.02 - 2.92 m; under it gold lines 1.875 - 1.95 m
  and 1.66 - 1.74 m; grey below 1.0 m, the grey rising toward the snout's foot on the nose. The upper line
  sweeps up from a point 2.6 m behind the tip to the shoulder as the "wing", holding the large teardrop
  cab window (4.9 - 6.95 m, 2.2 - 2.84 m); the band starts behind the wing; the lower line runs on to a
  point 2.9 m behind the tip.
- **Windows and doors.** End car: one long first window behind the wing (7.6 - 10.0 m, its front edge
  leaning with the wing's back), the door 10.25 - 11.2 m, eight windows 1.24 m wide at a 1.956 m pitch
  from 11.65 m. Intermediate car: the door at its front end (0.95 - 1.9 m), eleven windows 1.25 m wide at
  1.956 m from 2.6 m. Plug doors 0.95 m, 1.28 - 3.2 m, a tall rounded window.
- **Pantographs.** Single arm on cars 3 and 6 (the kit's default; the real sets raise one in single-set
  service). The prototype's white and gold livery (0002) is not drawn: one livery, no `livery` parameter.
- **Figures.** 4M4T, 250 km/h; 48 / 46 t a car and 5,440 kW (16 YJ-305A motors) are estimates.

## The CR450AF's body

`generator/cnCr450af.ts`, measured on the photographs of the prototype CR450AF-0201 in
`assets/cr-cr450af/` (SOURCES.md; the near side-on photograph rectified by a projective fit through the
tip and the first two joints, heights on the 3.85 m body) and the published figures (china-emu.cn,
Wikipedia); heights over the rail, d behind the nose's tip.

- **Lengths.** End car 28.725 m from the tip to its coupling plane, intermediate cars 25.65 m: eight cars
  211.35 m. Body 3.85 m high (0.2 m lower than the CR400's), 3.36 m wide drawn 3.24 m in the gauge;
  bogie centres 17.8 m, the leading bogie 7.0 m behind the tip, 920 mm wheels.
- **The nose** is one smooth cab face joined to the body 8.45 m behind the tip, just ahead of the crew
  door. The coupler hatch is a blunt, rounded bullet (measured at about 54 px/m on the side-on photograph):
  0.77 - 1.32 m tall 0.24 m back, its round front 1.03 m up, its top 1.47 m up 0.54 m back, its underside
  running back almost level (0.59 m at 0.6 m, 0.39 m at 1.8 m, the skirt's 0.25 m at 4.2 m); then the long
  low rise (1.78 m at 1.8 m, 2.4 m at 3.4 m, 2.95 m at 4.6 m) to the full 3.85 m about 8 m back. No bulb
  or lip: the hatch is only two thin dark seam arcs flush with its sides (about 1.25 m back). In plan a
  broad "duck bill": a flat front 1.24 m wide bowed 0.28 m back at hatch height, its corners 1.0 m round
  and 4.6 m deep, so the snout is about 2.5 m wide 1.25 m behind the tip; broad and gently bowed under
  the canopy. The crease along the lower flank is a paint line: the flank under it in shade from the
  hatch back to the skirt, its edge falling from 2.7 m back (1.0 m up) to the skirt at 5 m, the silver
  "wing" above it pointing forward under the red chevron.
- **The canopy.** Dark (near black) from the hatch's top over the windscreen (one broad rounded pane
  1.8 m wide, 1.95 - 3.07 m, one wiper) and back over the cab to the join; China Railway's emblem in
  gold just above the hatch. Its edge on each side is a red line rising from the hatch's top corner to
  the roof; under the line the dark sliver holding the long headlamp (3.0 - 4.9 m back), ending 6.2 m
  back; a small window high on the canopy 5.9 - 6.9 m back.
- **Livery.** Silver; the warm grey window band 2.08 - 3.05 m over a silver gap, the orange line
  1.94 - 2.04 m and the red line 1.79 - 1.94 m; the dark skirt 0.25 - 0.9 m from 5 m behind the tip. On
  the nose the red chevron rises from its point 5.05 m back, 1.56 m up, to the band's top 7.5 m back,
  the band's front leaning with it. At every car's ends the band is orange behind a red slash leaning
  back (the end car's inner end with "CR450"); the intermediate cars' doors stand in the orange.
- **Sides.** End car: the cab side window in the band's point (6.85 - 8.2 m), the crew door 8.53 -
  9.2 m (a seam outline with its window: it opens onto the cab), three business panes 1.0 m wide from
  10.2 m, the passenger door 14.95 - 15.95 m, four panes 1.35 m wide at a 1.95 m pitch from 17.95 m.
  Intermediate car: a door at each end, nine panes 1.35 m at 1.95 m from 3.85 m. Panes 2.17 - 2.95 m.
- **Running gear and roof.** The enclosed bogies: the skirt carried down over each bogie's cut to
  0.4 m, only the wheels' feet showing; no underfloor box. Single-arm pantographs on the third and the
  third from last car (the prototype's cars 3 and 6 in eight).
- **Not drawn.** The "复兴号" characters over the band (no CJK in the stroke font), the gold joint
  fairings, the canopy's tail on the roof behind the join (the canopy and its red line end at the join;
  the kit's roof-edge paint stepped visibly), the grille behind the canopy window.

## The CR450BF's body

`generator/cnCr450bf.ts`, measured on the photographs in `assets/cr-cr450bf/` (SOURCES.md; the only
unit, prototype CR450BF-0501, all views oblique: lengths from 1-D projective fits along the end car
through its tip, its joint and the body's height at two places) and the published figures.

- **Lengths.** End car 28.75 m, intermediate cars 25.65 m over the couplers: eight cars 211.4 m (the
  published train length). 3.85 m high (the CR400BF's 4.05 m less the 0.2 m the press quoted; not
  published as a figure), 3.36 m wide drawn 3.24 m in the Shinkansen gauge. 17.5 m bogie centres, 2.5 m
  wheelbase, 920 mm wheels; the leading bogie 7.6 m behind the tip, the rear one 3.65 m from the end.
- **The nose** is a cab face (seriesCab.ts) whose depth is a solid of the module's own (`bfDepth`),
  joining the body 11.5 m behind the tip: superellipse sections round their widest height, their half
  width, top, bottom and powers smooth (monotone cubic) tables of d, drawn into the body's section over
  the last 4 m. The tip is a rounded point 1.12 m up, one surface with the nose: the top rises 1.8 m 1 m
  back, 2.6 m at 3 m, 3.25 m at 5 m, the crown 3.85 m 10 m back, its slope only easing; the bottom falls
  to the skirt 3 m back; 1.8 m wide 1 m back. The coupler cover is only a thin grey seam ring flush with
  the skin (its top 1.0 m, its sides 1.9 m, its foot 1.6 m behind the tip). test/cnCr450bfNose.test.ts
  holds the tip to this: no knob, neck, step or lip, silver at the tip.
- **The canopy.** Dark navy glass over the whole upper nose, its front a rounded point 1.52 m up just
  over the cover, edged in red (running out along the sides 5.5 m back), the gold China Railway emblem
  on the point; its lower edge rises along the side (1.76 m 2.6 m back, 2.05 m at 4.5 m, 2.6 m at 7.8 m)
  to the crown 11.3 m back. The windscreen a lighter pane in it (2.45 - 3.55 m up), one wiper; white lamp
  strips inside the glass at its lower front corners.
- **The side's paint.** Silver; the gunmetal lower body under 1.05 m (on the nose its edge rising from
  under the cover); the red stripe 1.80 - 1.93 m under the charcoal window band 1.93 - 2.95 m. On the end
  car a black line sweeps from the flank 2.2 m behind the tip up into the band's foot 8.8 m back; the band
  starts there with a raked front, the red stripe in a point 10.4 m back; the raked cab side window in the
  band 9.45 - 11.35 m. "CR450" on the band near the end car's inner end; number CR450BF-0501.
- **Windows and doors.** End car: the crew door 11.7 - 12.45 m behind the tip (the left side; the right
  side has a window there - drawn on both), three windows 13.0 - 17.4 m, the passenger door 17.85 - 18.9
  m, three windows 20.9 - 25.7 m, 1.2 m wide. Intermediate car: one door a side at its front end, eleven
  windows 1.8 m apart from 3.6 m. Plug doors 1.25 - 3.2 m with a narrow rounded window.
- **Pantographs.** Single arms on the trailers 3 and 6 of eight (the kit's third and third from last),
  only the rear one raised.
- **Still differs**: the intermediate cars' layout is generic (no clear photograph of one); the
  "复兴号" characters and the white stripes round the CR mark are left out; the distant model's nose is
  a rounded wedge with the canopy as a band above 2.2 m.

## The CRH380B's body

`generator/cnCrh380b.ts`, matched to the photographs in `assets/cr-crh380b/` (unit CRH380B-3632; the
CRH380BG-5726 and CRH380BL-6401L show the same end car). The CRH380B is the Velaro CN developed for
380 km/h, and its photographs show the CRH3C's body unchanged: the same snout, canopy and grey lip, the
coupler hatch drawn only as a seam (one smooth nose surface, no bulge), the same lounge window, doors, roof
units and pantograph cars. The design therefore spreads the CRH3C's series, cab face and livery
(`CRH3C`, `CRH3C_FACE`, `CRH_LIVERY`, [the CRH3C's body](china-units.md#the-crh3cs-body)) and draws only what differs.

- **Size.** As the CRH3C: end car 25.675 m, middle car 24.775 m (200 m for eight), 3.89 m high, drawn
  3.1 m wide (real 3.265 m) to the UIC gauge, bogie centres 17.375 m.
- **Lamps** (measured head-on on photo-crh380b-3632, about 300 px/m). One slanted lens a side in place of
  the CRH3C's broad slatted clusters: a parallelogram 1.60 - 1.97 m up, 0.32 m wide, leaning outward by
  0.2 m over its height (lat 0.36 - 0.69 at its foot, 0.55 - 0.88 at its head), its corners cut, in a thin
  grey rim; the headlamp in its upper outer part (0.72, 1.87 m), the red lamp in its lower inner part
  (0.52, 1.70 m). The round upper lamp in the lip as on the CRH3C.
- **Characters.** "Hexie hao" larger and closer than on the CRH3C's face: 0.2 m cells at lat -0.5, 0 and
  0.5, from 1.98 m, just over the lenses (he over the left lens, xie on the centre line, hao over the right).
- **Livery.** The CRH3C's: white, the royal-blue band under the windows and its chevron on the nose's flank,
  the navy "CRH" at the end car's rear; the number CRH380B-3632.
- **Roof and running gear.** As the CRH3C: the two air-conditioning units on the end car, single-arm
  pantographs on the fairings of the second and next-to-last cars (the TP cars 2 and 7 of the 4M4T set).
- **Figures.** 9,200 kW (1,150 kW a car in the kit's per-car figure), 350 km/h in service; 551 seats in eight
  cars (end car 36, intermediate 80 in the model).
- **Still differs**: the side "Hexie hao" characters and the coupler hatch's vertical centre split are left
  out (as on the CRH3C); the cold-weather BG's snow ploughs are not drawn.

## The CRH380CL's body

`generator/cnCrh380cl.ts`, references in `assets/cr-crh380cl/` (unit CRH380CL-5603). CNR Changchun's
16-car 380 km/h train (2012) keeps the Velaro CN's cars and gives them a nose of its own, designed
with Hitachi. Behind the face the design is the CRH3C's body (cnCrh3c.ts): the same doors, window band,
roof units, pantograph cars and the CRH livery's thin blue band; only the cab face and the end car's
nose sweeps are its own.

- **Length**: 403 m over 16 cars against the CRH380BL's 399.27 m, drawn as 1.85 m more nose at each
  end: the face joins the body 8.85 m behind the tip (the CRH3C's 7.0 m), the end car is 27.525 m and
  everything behind the join (door 10.3 m behind the tip, bogies, windows) is the CRH3C's.
- **Profile** (photo-crh380cl-5603, about 180 px/m at the nose): one smooth convex curve, no step or
  bulb. The tip 1.05 m up (the Velaro's 1.24 m), the coupler hatch's seam to 1.53 m 0.3 m back, the
  grille's foot 1.88 m 0.77 m back, the glass's foot 2.35 m 1.5 m back, the canopy rising at about 22
  degrees to the roof 8.85 m back. The plan's round corner reaches full width 2.9 m behind the centre
  line low down, deeper over the lamps and the canopy.
- **Face** (photo-crh380cl-5606 head-on): the coupler hatch is a dark seam only (half width 0.8 m,
  0.68 - 1.53 m, a centre split); the "Hexie hao" characters at 1.62 m, 0.5 m apart; a silver grille
  with dark louvres 7.5 cm apart under the canopy, its foot curving up to the corners and its tail running
  back under the canopy's side edge; the oval canopy (half width 1.07 m) with its dark rim, the clearer
  windscreen in its lower part (2.4 - 3.0 m) under the tinted roof glass, which reaches 6.3 m back.
- **Lamps**: a slim teardrop on each flank under the canopy's edge (livery sweeps, `face: true`): its
  rounded foot 1.8 m behind the tip at 1.97 - 2.1 m, rising to a point 3.75 m back at 2.56 m; a dark
  rim, a clear lens, the headlamp in its middle and a small red lamp at its foot.
- **Side**: a small leaning cab window (1.66 - 2.05 m, 3.65 - 4.5 m back) ahead of the lounge window
  (4.75 - 9.1 m back, its top falling from 2.73 m to 2.19 m at the front, two black frames); the blue
  band leaves the body's level just ahead of the join and dives to its point 1.5 m up, 2.6 m behind the
  tip, under the lamp.
- **Train**: 2 - 8 cars (the series kit's longest train; the real one has 16), the CRH3C's pantograph
  cars. Triangles: end car 15,330, intermediate car 8,834; distant model 86 / 92.
- Not drawn: the nose module's panel joint on the flanks, the plough's separate lip under the hatch,
  the 16-car formation's extra pantographs.

## The CRH380D's body

`generator/cnCrh380d.ts`, measured on the photographs in `assets/cr-crh380d/` (SOURCES.md; CRH380D-1501 near
side-on from above, rectified by a projective fit through its tip, both bogies' axles and its coupling plane,
heights scaled on the door; the 1514, 1516, 1529 and 1530 three-quarter views; 1527 from above) and the published
figures: end car 27.85 m and intermediate cars 26.6 m over the couplers (215.3 m for eight), 4.0 m high, the
3.36 m body drawn 3.22 m wide (door frames inside the Shinkansen gauge); 18.8 m bogie centres, 2.7 m wheelbase,
920 mm wheels, the end car's leading bogie 5.2 m behind the tip.

- **The nose** (the Zefiro 380's "duck bill", a cab face joining the body 10.5 m back) is one smooth convex
  surface: the tip is the coupler cover's round front 0.85 m up, its underside tucking back to the skirt; above
  it the cover rounds over (0.4 m back at 1.35 m) into one long straight slope of about 21 degrees (2.7 m back a
  metre up: 1.36 m back at 1.7 m, 4.1 m at 2.7 m), the windscreen's head 3.56 m up 6.8 m back, flattening over
  the canopy to the roof. In plan a broad, round bill (full width 3.9 m back low down), narrowing over the
  canopy. The coupler cover is no separate part: only its seam (1.9 m wide, to 1.43 m up) and the leaves' joint,
  thin dark lines flush in the surface. `test/cnCrh380dNose.test.ts` holds the centre line to one convex curve.
- **The face's paint**: the big wrap-around windscreen from 2.15 m up at the centre, its foot rising back along
  the sides to the grey canopy cap (to 9.9 m back on the roof); under it the black panel (from 1.69 m) in a grey
  border (from a shallow vee at 1.55 m), running round the corners into the lamp strips, which rise back to the
  black almond cab side window (3.3 - 7.6 m back, 2.0 - 2.66 m up, a lighter pane in it) under a white pillar
  line; the red tail lamp ahead in the strip, the white headlamp at its rising end; one wiper.
- **Livery** (CRH380D-1501): white; the black window band 1.88 - 2.62 m, on the end car from a pointed front
  7.3 m behind the tip (its foot leading); the blue stripe 1.62 - 1.73 m, on the end car rising from a point
  0.86 m up 1.45 m behind the tip, still rising along the body to the side's line 16.5 m back (painted over the
  door); the navy "CRH" at the end car's rear, bronze grilles low on the skirts.
- **Windows and doors**: windows 1.4 m wide in the band (1.97 - 2.55 m), about 1.94 m apart. End car: one window
  ahead of the door (in the band's front) and one behind the join, the door 12.8 - 13.7 m behind the tip, five
  windows, a blank rear end. Intermediate car: a door at each end (0.6 m in from the body's ends) and eleven
  windows between. Plug doors 0.9 m wide, 1.24 - 3.2 m, a window in the band.
- **Roof and pantographs**: single-arm pantographs on the Tp cars next to the end cars (cars 2 and 7 of eight;
  `pantographSlots`), the front one folded, the rear one raised.
- **Still differs**: the "和谐号" characters and the CRH bird are left out (no CJK in the stroke font); the
  skirt is not cut over the leading bogie (it hides the wheels' upper half, as on the CR400BF); the gold outer
  diaphragms between the cars are the kit's bellows; the dining car (car 4) is not drawn apart; the distant
  model's nose is the kit's coarse wedge.
