# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.6 m + tender 8.9 m | 4-6-4, three 1,750 mm drivers, large smoke deflectors |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 11.6 m + tender 8.2 m | 2-8-2, four 1,400 mm drivers; the namekuji's long dome casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab between two hoods, B-2-B: three bogies |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the OHaNe 25 sleeper (berth and corridor sides differ) or OShi 24 diner, two stainless lines |

The prototypes run on the 1,067 mm gauge; the models keep their real bodies (2.8 - 2.97 m wide)
on the factory's standard-gauge wheelsets, inside the UIC gauge.

- **C62 and D51** - `LocoSpec`s on the steam kit with their tenders (`unit`): the JNR red buffer
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine's
  separate domes or the early "namekuji" (slug) casing.
- **EF66** - the carbody kit with the same "brow" nose at both ends, the cream front in the
  JNR scheme, side windows and grilles, two diamond pantographs, three two-axle bogies.
- **DD51** - the hood unit kit with a high hood at each side of the centre cab and its new
  `trucks.middle` option for the idle middle bogie (three supports).
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

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers and the D51's domes;
the EF66 and DD51 on three bogies, the EF66's raised pantograph; the Blue Train's cars).
