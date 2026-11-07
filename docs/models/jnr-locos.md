# JNR locomotives and the Blue Train

**Covers** - the JNR C62 and D51 steam locomotives (`proc-vehicle-jnr-c62`, `proc-vehicle-jnr-d51`), the EF66 electric (`proc-vehicle-jnr-ef66`), the DD51 diesel (`proc-vehicle-jnr-dd51`) and the 24-series Blue Train coach (`proc-vehicle-blue-train-24`): their kits, variants, deviations and tests.
**Code** - `generator/jpLocos.ts` (`JNR_LOCOS`), `generator/steamLoco.ts`, `generator/carbodyKit.ts`, `generator/usHoodKit.ts`, `generator/usTransit.ts`, `test/jpLocos.test.ts`, `assets/jnr-c62/`, `assets/jnr-d51/`, `assets/jnr-ef66/`, `assets/jnr-dd51/`, `assets/blue-train-24/`
**See also** - [jp-emus.md](jp-emus.md), [us-steam.md](us-steam.md), [us-diesels.md](us-diesels.md), [steam-locomotives.md](steam-locomotives.md)

## The designs

| id | title | parameters (default first) | length | notes |
|---|---|---|---|---|
| `proc-vehicle-jnr-c62` | JNR C62 | `unit` | 13.6 m + tender 8.9 m | 4-6-4, three 1,750 mm drivers, large smoke deflectors |
| `proc-vehicle-jnr-d51` | JNR D51 | `unit`, `variant` (`standard`, `namekuji`) | 12.4 m + tender 7.33 m | 2-8-2, four 1,400 mm box drivers; the standard's feedwater heater and dome casing, the namekuji's long casing |
| `proc-vehicle-jnr-ef66` | JNR EF66 | `livery` (`jnr`, `jrFreight`) | 18.2 m | Bo-Bo-Bo, two diamond pantographs (the rear raised) |
| `proc-vehicle-jnr-dd51` | JNR DD51 | `livery` (`jnr`, `hokutosei`) | 18.0 m | the centre cab between two hoods, B-2-B: three bogies |
| `proc-vehicle-blue-train-24` | Blue Train 24 series | `unit` (`sleeper`, `dining`) | 20.8 m | the blue sleeper with its three white lines |

The prototypes run on the 1,067 mm gauge; the models keep their real bodies (2.8 - 2.97 m wide)
on the factory's standard-gauge wheelsets, inside the UIC gauge.

- **C62 and D51** - `LocoSpec`s on the steam kit with their tenders (`unit`): the JNR red buffer
  beam with an automatic coupler (the knuckle coupler) and the headlight on the smokebox top,
  the smoke deflectors, the Walschaerts gear; the D51's `variant` picks the standard engine or
  the early "namekuji" (slug) casing (below).
- **EF66** - the carbody kit with the same "brow" nose at both ends, the cream front in the
  JNR scheme, side windows and grilles, two diamond pantographs, three two-axle bogies.
- **DD51** - the hood unit kit with a high hood at each side of the centre cab and its new
  `trucks.middle` option for the idle middle bogie (three supports).
- **Blue Train** - the car builder: windows (13 small ones on the sleeper, 8 large on the
  dining car), a plug door each side onto the cabin, the three white lines along the skirt.

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
- **Both** - smoke deflectors whose foot follows the front step down to the beam, with grab rails;
  the tall cylinder casing with its brass covers; box (Boxpok) drivers drawn as discs; the white edging of
  the preserved engines on the running boards, tyres, cab and tender sills; black end beam with the
  automatic coupler, pilot plate and two marker lamps; the number plate and brass star handle on the
  smokebox door; air compressor (left) and feedwater pump (right); the cab roof carried on to the tender.
- **Deviations** - the boiler is a cylinder (the real barrel is slightly conical); the ash pan,
  pipework and the turbo-generator are left out; the tyres are white all round (the real white is on
  the tyre's face). The distant model has a 120-triangle budget (`lodTriangles: 200`) so that the
  casing, which tells the two types apart, survives; it is a dome block there (`d51LodSpec`).

## Checking

`pnpm exec vitest run test/jpLocos.test.ts` (ids and tractions; every combination inside the
UIC gauge, in budget, without coplanar faces; the steam engines' drivers, the D51's driver pitch, 19.73 m length and its casing per type;
the EF66 and DD51 on three bogies, the EF66's raised pantograph; the Blue Train's cars).
