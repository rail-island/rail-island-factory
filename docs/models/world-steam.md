# Steam locomotives in a few measures

**Covers** - the parametric steam generator (`steamEngineSpec`, `steamTenderSpec`) and the steam designs of the eight-country plan drawn with it: the layout it derives, its couplers and tenders, its guards, and the designs.
**Code** - `generator/steamWorld.ts` (`WorldSteam`), `generator/worldSteamLocos.ts` (`WORLD_STEAM`, `WORLD_STEAM_DESIGNS`), `generator/deSteam01.ts` (the DRG 01), `generator/steamLoco.ts`, `generator/lodSteam.ts`
**See also** - [steam-locomotives.md](steam-locomotives.md) (the kit), [jnr-locos.md](jnr-locos.md), [germany-trains.md](germany-trains.md)

The steam kit draws a locomotive from a `LocoSpec`: boiler, chimney, domes, running
boards, frames, cab, firebox, deflectors, running gear, lamps and numbers, all in source
metres. `WorldSteam` states a tender engine in a few measures and derives the spec:

- **Axles.** `lead`, `coupled`, `trail` and their diameters lay the wheels out from the
  front buffer heads: the leading axles 1.15 m in, the drivers 0.2 m apart, the trailing
  axles behind the firebox. The cylinders stand over the leading truck (ahead of the
  drivers without one); the main rod drives the middle driver.
- **Boiler and cab.** The boiler's centre rises with the drivers (at least 2.5 m); the
  chimney, domes and cab roof stop at `top` (4.65 m on the UIC gauge). A round or
  `belpaire` firebox stands under the cab's front.
- **Deflectors.** `wagner` (large plates beside the smokebox), `witte` (small ones on
  it) or `none`.
- **Couplers.** `buffers` (beams with buffers and the kit's lamps) or `knuckle` (an
  automatic coupler front and rear, a drawbar to the tender).
- **Tender.** Its length, four axles on two bogies or a rigid row, the wheel diameter.
  A rigid row stands 1 m in from the ends; where that would bring the wheels closer
  than 0.3 m between treads (a short two-axle tender), it is centred at that pitch.

`noValveGear` and `noCab` draw an early engine; the Rocket's entry gives only its title
and parameters, its engine and tender are drawn by `generator/rocket.ts`
([uk-trains.md](uk-trains.md)). On a narrow gauge the
buffer beams and the outside cylinders come in with the running boards' half width.
The generator keeps clear of two heights where the kit's own parts stand: a running
board at 1.6 m (the valve gear's top) moves to 1.62 m, and a boiler whose saddle would
end at 1.29 m (the cylinder block's top) grows by 2 cm.
A design is the engine and its tender as `unit` (`locomotive`, `tender`), with an
optional `livery` that swaps the paint and number. The kit's smokebox saddle is 1.5 r
wide, so a boiler radius whose saddle would lie on the frame plates' faces (0.69 -
0.8 m) throws: choose 0.83 m or more, or 0.68 m or less.

## The designs

| id | country | wheels | drivers | deflectors | tender |
|---|---|---|---|---|---|
| `proc-vehicle-drg-01` | Germany | 2'C1' | 2.0 m | Wagner | four axles |
| `proc-vehicle-dr-52` | Germany | 1'E | 1.4 m | Wagner | four axles |
| `proc-vehicle-kpev-p8` | Germany | 2'C | 1.75 m | none | four axles |
| `proc-vehicle-sncf-241p` | France | 2'D1' | 2.02 m | Wagner | four axles |
| `proc-vehicle-sncf-141r` | France | 1'D1' | 1.65 m | none | four axles |
| `proc-vehicle-ns-3700` | the Netherlands | 2'C | 1.85 m | none | four axles |
| `proc-vehicle-renfe-141f` | Spain | 1'D1' | 1.56 m | none | four axles |
| `proc-vehicle-renfe-242f` | Spain | 2'D1' | 1.9 m | Wagner | four axles |
| `proc-vehicle-lner-a4` | the United Kingdom | 2'C1' | 2.03 m | none | four axles |
| `proc-vehicle-lner-a3` | the United Kingdom | 2'C1' | 2.03 m | Witte | four axles |
| `proc-vehicle-gwr-castle` | the United Kingdom | 2'C | 2.04 m | none | three axles |
| `proc-vehicle-lms-black-five` | the United Kingdom | 2'C | 1.83 m | none | three axles |
| `proc-vehicle-br-9f` | the United Kingdom | 1'E | 1.52 m | Wagner | three axles |
| `proc-vehicle-rocket` | the United Kingdom | A1 | 1.435 m | none | two axles |
| `proc-vehicle-ir-wp` | India | 2'C1' | 1.7 m | none | four axles |
| `proc-vehicle-ir-wg` | India | 1'D1' | 1.56 m | none | four axles |
| `proc-vehicle-eir-fairy-queen` | India | 1A1 | 1.83 m | none | two axles |
| `proc-vehicle-dhr-b-class` | India | B | 0.66 m | none | two axles |
| `proc-vehicle-cr-qj` | China | 1'E1' | 1.5 m | Wagner | four axles |
| `proc-vehicle-cr-sy` | China | 1'D1' | 1.37 m | none | four axles |
| `proc-vehicle-cr-js` | China | 1'D1' | 1.37 m | Wagner | four axles |

The DRG 01 is not derived: `generator/deSteam01.ts` states its engine and tender `LocoSpec` directly from the
dimensioned DEWAG drawing (its row in `WORLD_STEAM` gives only the title and the table's measures) - the long
smokebox with the feed-water heater across it, three low domes, the Wagner plates reaching down to the buffer
beam, the bar frames (dark plates with red top bars and horn guides), red trucks (`bogieFrameMat`), the
2'2' T 32 tender with its narrower coal box.

Each design's published figures and photographs are in its `assets/<name>/SOURCES.md`;
the layout is the class's in proportion, not to the centimetre.
