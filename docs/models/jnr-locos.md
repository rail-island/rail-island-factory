# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/jnrDd51.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.6 m + tender 8.9 m | 4-6-4, three 1,750 mm drivers, large smoke deflectors |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 11.6 m + tender 8.2 m | 2-8-2, four 1,400 mm drivers; the namekuji's long dome casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab taller than the hoods, B-2-B: three bogies; DD51 842 / DD51 1093 |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the blue sleeper with its three white lines |

The prototypes run on the 1,067 mm gauge; the models keep their real bodies (2.8 - 2.97 m wide)
on the factory's standard-gauge wheelsets, inside the UIC gauge.

- **C62 and D51** - `LocoSpec`s on the steam kit with their tenders (`unit`): the JNR red buffer
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine's
  separate domes or the early "namekuji" (slug) casing.
- **EF66** - the carbody kit with the same "brow" nose at both ends, the cream front in the
  JNR scheme, side windows and grilles, two diamond pantographs, three two-axle bogies.
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
- **Blue Train** - the car builder: windows (13 small ones on the sleeper, 8 large on the
  dining car), a plug door each side onto the cabin, the three white lines along the skirt.

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers and the D51's domes;
the EF66 and DD51 on three bogies, the EF66's raised pantograph; the Blue Train's cars).
