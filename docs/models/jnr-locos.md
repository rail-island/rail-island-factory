# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/jnrDd51.ts` (the DD51), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/seriesCab.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.1 m + tender 8.375 m | C62 2: 4-6-4 (2C2), three 1,750 mm Boxpok drivers, the swallow deflectors, the six-axle 10-22 tender |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 12.4 m + tender 7.33 m | 2-8-2, four 1,400 mm Boxpok drivers; the standard's feedwater heater and dome casing, the namekuji's long casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, the visored cab face at both ends, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab taller than the hoods, B-2-B: three bogies; DD51 842 / DD51 1093 |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the OHaNe 25 sleeper (berth and corridor sides differ) or OShi 24 diner, two stainless lines |

The prototypes run on the 1,067 mm gauge; the models keep their real bodies (2.8 - 2.97 m wide)
on the factory's standard-gauge wheelsets, inside the UIC gauge.

- **C62** - C62 2, the "Swallow Angel" preserved at the Kyoto Railway Museum, measured from a
  side-on photograph of C62 3 (143 px/m on the 1,750 mm drivers) and photos of C62 2, 1 and 26
  (`assets/jnr-c62/SOURCES.md`), in source x from the front coupler: lead axles 1.21 and 3.47 m,
  drivers 5.2, 7.27 and 9.34 m (Boxpok centres, white tyres, red coupling rods), the trailing
  truck 10.95 and 12.05 m, the drawbar at 13.1 m. The boiler (centre 2.75 m, top 3.66 m) with its
  2.4 m smokebox from 1.1 m, the short chimney at 2.42 m (3.98 m), the long dome casing over the
  sand and steam domes from 4.2 to 7.4 m (a rounded volume tapering at its ends; a kit dome on the distant model), the wide firebox ahead of the cab (10.8 - 12.95 m, two
  side windows, the number plate and the depot plate under them, the white skirt line). The
  running board at 2.27 m drops down a slope to the front deck at 1.22 m and has the hump by the
  firebox and the lower step at the cab, all edged white (the line C62 2 has carried since 1970).
  The large deflectors (0.55 - 2.77 m, top 3.64 m, the chamfered top front, the foot down the
  board's slope, the opening at their rear) carry the stainless swallow. The black buffer beam
  (the red beams of other preserved engines are a museum look) with two marker lamps, the deck
  rail, the LP403 headlight and C62 2's second smaller lamp, the brass "C62 2" plate, handle and the rim of
  the round smokebox door (28-sided boiler), the feedwater heater sunk in the smokebox top ahead of the chimney, the feed
  pump on the left, the air pump on the right, the main reservoirs and pipes under the board, the
  cylinders clad in one block with the valve chests. The 10-22 tender (8.375 m, 21.475 m in all):
  the welded tank with its bevelled "boat" bottom, the coal space ahead of the lower water deck
  (its white top edge stepping down, the front plate and tool boxes over the gangway), two three-axle bogies, the rear lamp and coupler.
  Deviations: the Boxpok openings are diamonds rather than ovals, the pipework is reduced to two
  pipes a side, the cab plates carry no lettering besides the number.
- **D51** - a `LocoSpec` on the steam kit with its tender (`unit`): the black end
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine or
  the early "namekuji" (slug) casing ("The D51" below).
- **EF66** - a square-ended carbody with a cab face (seriesCab.ts) at both ends; see "The EF66".
- **DD51** - its own builder (`jnrDd51.ts`); see the DD51 entry below.
- **Blue Train** - the car builder's shell, doors, bellows, couplers and TR217 bogies, with the
  sides laid out from photographs (assets/blue-train-24/SOURCES.md, measured in a projective fit
  along each side). `sleeper` is the 25-type two-tier B sleeper OHaNe 25 118 (1976), `dining` the
  OShi 24 101 dining car (the plain 24-series diner, not the rebuilt SuShi 24 "Grand Chariot").
  JNR blue with the 25 type's **two stainless lines** (1.12-1.17 m along the foot, 1.94-2.0 m under
  the windows), wrapping round the ends and stopping at the doors; a stainless roof and a grey air
  conditioner housing over each end (to 4.085 m). The sleeper's two sides differ: the berth side
  has eight wide, low windows (1.15 x 0.69 m) and two small toilet windows, the corridor side seven
  tall ones (1.07 x 0.94 m), a deck window, the frosted washroom window and two toilet ovals; one
  folding vestibule door at the door end on both sides (two narrow windows). The dining car has the
  kitchen's sliding door with its rail, four and five windows set high (2.38-3.0 m) with a vent
  between. Both ends: rounded corners, the gangway door in its bellows, two tail lamps, grab rails;
  underfloor boxes and tanks between the bogies. Deviations: the ends are the intermediate cars'
  (no OHaNeFu tail end with its conductor's windows and tail sign); the dining car's other side is
  drawn like the photographed one (no photo of it); the 24 type's three white lines and the later
  JR gold lines are not offered.

## The D51

Measured from a square-on photograph of D51 51 (a projective fit over the drivers at the published
1,550 mm pitch; `assets/jnr-d51/SOURCES.md`) and checked against D51 200, 426, 498 and 95. Source x
from the front coupler face: beam 0.35, leading axle 0.87, cylinders 1.32 - 2.31, chimney 1.9, drivers
3.22 / 4.77 / 6.32 / 7.87, trailing axle 10.07, cab 10.85 - 12.15 (the namekuji's 10.9 - 12.1), drawbar
12.4; the 8-20 tender 7.33 m on two two-axle bogies, 19.73 m over both. Its own builders
(`d51Spec`, `d51Front`, `d51Casing`, `d51TenderSpec`), not the C62's helpers.

- **Standard** (D51 101 on; D51 200, red number plates) - the feedwater heater lies across the
  smokebox ahead of the chimney, the headlight in front of it; one casing 2.65 m long covers the sand
  box and steam dome over the first two drivers (the photographs show one casing, not two domes); the
  running board steps up 0.47 m behind the fourth driver and stays up to the cab.
- **Namekuji** (D51 1 - 95; D51 1, black plates) - the long casing from the chimney back over the
  heater, sand box and dome, 5.7 m, its tail sloping down ahead of the safety valves; the running board
  rises over the fourth driver and comes down again; the shorter cab.
- **Both** - smoke deflectors standing on the running board, their front foot over the step, with grab
  rails; the tall cylinder casing with its brass covers; Boxpok drivers (`box`), red coupling and main
  rods (`couplingMat`, `mainMat`); gloss black over a graphite smokebox, a 28-sided boiler and the door's
  lighter rim, so the round smokebox reads; the dome casing a rounded loaf tapering at both ends; the white edging of
  the preserved engines on the running boards, tyres, cab and tender sills; black end beam with the
  automatic coupler, pilot plate and two marker lamps; the number plate and brass star handle on the
  smokebox door; air compressor (left) and feedwater pump (right); the cab roof carried on to the tender.
- **Deviations** - the boiler is a cylinder (the real barrel is slightly conical); the ash pan,
  pipework and the turbo-generator are left out; the tyres are white all round (the real white is on
  the tyre's face). The distant model has a 120-triangle budget (`lodTriangles: 200`) so that the
  casing, which tells the two types apart, survives; it is a dome block there (`d51LodSpec`).

## The EF66

Measured from EF66 11, 27, 35 and 20 (assets/jnr-ef66/SOURCES.md: the photographs, scales and
measurements) and the published figures: body 17.1 m (18.2 m over couplers), 2.8 m wide, roof
3.67 m, the cab roof 3.87 m, bogie centres 5.3 m, wheelbase 2.8 m, wheels 1,120 mm.

- **Body** - the carbody kit (`EF66_SPEC`), square-ended between the two faces' joins 0.95 m
  behind each tip; its `front`/`rear` tables only raise the crown and shoulder over the cab
  (`EF66_CAB`: 3.87 m back to 1.65 m behind the tip, then the body's 3.67 m roof). d_f in the code
  is metres behind the front face's tip, as the photographs were measured.
- **Cab face** (`ef66Face`, drawn with `drawCabFace`) - upright from the skirt to the brow (2.72 m),
  a shelf sloping back 0.38 m to the windscreen's foot (3.05 m), the windscreen leaning back to
  0.6 m at 3.62 m under the visor's lip (0.44 m, 3.71 m), the cab roof rounding up behind it;
  chamfered corners (0.22 m at the lamps, 0.36 - 0.4 m at the windscreen). One pane runs across the
  windscreen and round its corners with the stainless pillars as decals over it, the frame is a band.
  JNR: cream between the brow and the lamp housings' top, narrowing between the housings down to
  1.69 m; the grille's opening (mask) and five chromed slats (decals); the number plate (mask) on the
  gold vee (four convex decals round it); the lamp housings at the corners as two stacked pods, the
  headlight over the tail light; the side's cream stripe carried on to the housings.
- **Sides** - the cab side window, the door with its narrow window and handrails, seven windows over
  seven louvres (slats as flat strips over the opening), both sides alike, both ends mirrored.
- **Ends** - the grey skirt with chamfered corners, the dark plough under it, the knuckle coupler in
  a black pocket. **Roof** - two diamond pantographs right behind the cab roofs (5.65 m from the
  centre; the photographs show the lower-frame-crossed PS22 type, drawn with the diamond kit), the
  rear raised; three hatches and the roof line on its insulators.
- **Liveries** - `jnr` (blue No. 15, cream No. 1; EF66 27) and `jrFreight` (EF66 20's JR Freight
  colours: light grey, the blue vee over the front down under the grille, a blue band along the
  sides falling behind the cab, black lamp housings, a light blue skirt). The distant model's face
  and sides carry the vee and the band as level bands (`lodFace`, `lodSide`).
- **Deviations** - the plate reads "EF6627" without spaces (the face's `number`; spaced lettering
  costs 600 triangles a face); the bogies are the shared kit's (secondary springs at the pivot only);
  the later JR Freight roof air conditioners and the 100-number body are not modelled. Triangles:
  about 14,400 (jnr) and 15,600 (jrFreight).

- **DD51** - its own builder (`jnrDd51.ts`, measured from the photographs in
  `assets/jnr-dd51/`, figures in its SOURCES.md), on czElectricKit's lofted `shell`: the cab 3.0 m
  long, full width (2.95 m), its eaves at 3.64 m and its roof crowned at 3.82 m, two windscreens
  at each end either side of a round column (0.48 m, silver in JNR red, blue on the Hokutosei)
  that rises from the hood roof, a sun visor over them; on each side a door at one end and two
  windows at the other, point-symmetric, the number under the line. The hoods, 2.3 m wide and
  3.25 m high from the 1.25 m walkway (the windscreens sit on them, 3.28 - 3.56 m), roll their roof edges (0.2 m); the radiator section at each
  end (1.55 m) stands 0.03 m proud and 0.05 m higher, meshed above and below the line, its fan
  on the roof; the flat end, its corners and top rounded (0.13 / 0.12 m), carries the two
  sealed-beam lamps in housings at +-0.76 m in the grey cap, the cut-out number between them and
  the two-leaf end hatch 0.9 m wide off the centre line. Louvre groups over the side doors
  straddle the line, a louvred intake at the cab end, the low grille box beside each hood at the
  cab, the exhaust over each engine. Paint: JNR red (#c9412b) with the light grey (#c2c4c3)
  roofs and hood tops, the white line under them at the same height on hoods and cab
  (2.79 - 2.91 m), the white running-board edge, black frame, light grey end beams; Hokutosei:
  blue with dark grey roofs, a gold band and a thin gold line under it, gold lamp surrounds, a
  grey beam and the round headboard. The end beams (0.45 - 1.25 m) carry the walkway frames, the
  chain, the tail lamps, the knuckle coupler and the hoses; two DT113 bogies at +-5.9 m (2.2 m
  wheelbase) and the idle TR106 in the middle, drawn with 1.46 m instead of 1.6 m so its brake
  cylinders clear the shared bogie's transoms. Not modelled: side handrails along the walkways
  (the photographed units have only grab handles on the hoods and cab), the steam generator
  details, the JR Freight renewal livery. The distant model is the five shells with the frame,
  the beams, the columns and the tanks. The hood unit kit's `trucks.middle` option it once used
  stays in the kit.

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers, the D51's driver pitch, 19.73 m length and its casing per type; the C62's Boxpok drivers, six-axle tender and 21.475 m;
the EF66 and DD51 on three bogies, the EF66's raised pantograph, bogie centres and body length; the Blue Train's cars).
