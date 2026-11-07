# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/seriesCab.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.6 m + tender 8.9 m | 4-6-4, three 1,750 mm drivers, large smoke deflectors |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 11.6 m + tender 8.2 m | 2-8-2, four 1,400 mm drivers; the namekuji's long dome casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, the visored cab face at both ends, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab between two hoods, B-2-B: three bogies |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the blue sleeper with its three white lines |

The prototypes run on the 1,067 mm gauge; the models keep their real bodies (2.8 - 2.97 m wide)
on the factory's standard-gauge wheelsets, inside the UIC gauge.

- **C62 and D51** - `LocoSpec`s on the steam kit with their tenders (`unit`): the JNR red buffer
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine's
  separate domes or the early "namekuji" (slug) casing.
- **EF66** - a square-ended carbody with a cab face (seriesCab.ts) at both ends; see "The EF66".
- **DD51** - the hood unit kit with a high hood at each side of the centre cab and its new
  `trucks.middle` option for the idle middle bogie (three supports).
- **Blue Train** - the car builder: windows (13 small ones on the sleeper, 8 large on the
  dining car), a plug door each side onto the cabin, the three white lines along the skirt.

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

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers and the D51's domes;
the EF66 and DD51 on three bogies, the EF66's raised pantograph, bogie centres and body length; the Blue Train's cars).
