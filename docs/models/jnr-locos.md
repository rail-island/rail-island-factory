# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.1 m + tender 8.375 m | C62 2: 4-6-4 (2C2), three 1,750 mm Boxpok drivers, the swallow deflectors, the six-axle 10-22 tender |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 11.6 m + tender 8.2 m | 2-8-2, four 1,400 mm drivers; the namekuji's long dome casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab between two hoods, B-2-B: three bogies |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the blue sleeper with its three white lines |

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
- **D51** - a `LocoSpec` on the steam kit with its tender (`unit`): the JNR red buffer
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine's
  separate domes or the early "namekuji" (slug) casing.
- **EF66** - the carbody kit with the same "brow" nose at both ends, the cream front in the
  JNR scheme, side windows and grilles, two diamond pantographs, three two-axle bogies.
- **DD51** - the hood unit kit with a high hood at each side of the centre cab and its new
  `trucks.middle` option for the idle middle bogie (three supports).
- **Blue Train** - the car builder: windows (13 small ones on the sleeper, 8 large on the
  dining car), a plug door each side onto the cabin, the three white lines along the skirt.

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers and the D51's domes; the C62's Boxpok drivers, six-axle tender and 21.475 m;
the EF66 and DD51 on three bogies, the EF66's raised pantograph; the Blue Train's cars).
