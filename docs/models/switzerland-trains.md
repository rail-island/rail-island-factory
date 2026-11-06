# Switzerland's trains

**Covers** - the twenty Swiss designs of the eight-country plan: the RAe TEE II, the Roter Pfeil, the ICN, the Giruno, the FV-Dosto, SBB's FLIRT and KISS and the Rhaetian Railway's Allegra; the Re 460, Re 4/4 II, Re 6/6, Ae 6/6, Ce 6/8 II Krokodil and Ae 8/14 Landi; on the metre gauge the RhB Ge 4/4 III and Ge 6/6 I Krokodil and the MGB HGe 4/4 II; the EW IV, IC 2000 and Glacier Express coaches. Their kits, figures, deviations and tests.
**Code** - `generator/chUnits.ts` (`CH_UNITS`, `chLivery`), `generator/chLocos.ts` (`CH_LOCOS`), `generator/seriesHelpers.ts` (`flirt`, `kiss`), `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/sbb-*/`, `assets/rhb-*/`, `assets/mgb-hge442/`, `assets/glacier-express/`
**See also** - [shinkansen.md](shinkansen.md), [world-locos.md](world-locos.md), [world-coaches.md](world-coaches.md), [netherlands-trains.md](netherlands-trains.md) (the FLIRT's Dutch sister)

The catalog had no Swiss train before. Every design is filed under Switzerland.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-sbb-rae-tee` | SBB RAe TEE II | series | `unit`, `cars` 4 - 6, `livery` (`tee`, `gottardo`) | 160 km/h |
| `proc-vehicle-sbb-roter-pfeil` | SBB Roter Pfeil | series, single, pantograph on the car | - | 22.4 m; 125 km/h |
| `proc-vehicle-sbb-icn` | SBB ICN | series | `unit` (seven cars) | tilting; 200 km/h |
| `proc-vehicle-sbb-giruno` | SBB Giruno | series | `unit`, `cars` 4 - 8 | 250 km/h |
| `proc-vehicle-sbb-fv-dosto` | SBB FV-Dosto | series, double-deck | `unit`, `cars` 4 - 8 | 200 km/h |
| `proc-vehicle-sbb-flirt` | SBB FLIRT | series, Stadler FLIRT | `unit`, `cars` 3 - 4 | 160 km/h |
| `proc-vehicle-sbb-kiss` | SBB KISS | series, Stadler KISS | `unit`, `cars` 4 - 6 | double-deck; 160 km/h |
| `proc-vehicle-rhb-allegra` | RhB Allegra | series, metre gauge | `unit` (three cars) | 2.65 m wide; 120 km/h |
| `proc-vehicle-sbb-re460` | SBB Re 460 | box locomotive, streamlined | - | Bo-Bo, 18.5 m, 6,100 kW, 230 km/h |
| `proc-vehicle-sbb-re420` | SBB Re 4/4 II | box locomotive, flat | `livery` (`green`, `red`) | Bo-Bo, 15.41 m, 4,700 kW, 140 km/h |
| `proc-vehicle-sbb-re620` | SBB Re 6/6 | box locomotive, flat | `livery` (`green`, `red`) | Bo-Bo-Bo, 19.31 m, 7,850 kW, 140 km/h |
| `proc-vehicle-sbb-ae66` | SBB Ae 6/6 | box locomotive, raked | `livery` (`green`, `red`) | Co-Co, 18.4 m, 4,300 kW, 125 km/h |
| `proc-vehicle-sbb-ce68` | SBB Ce 6/8 II Krokodil | box locomotive, hoods | `livery` (`brown`, `green`) | 19.46 m, 2,700 kW, 65 km/h |
| `proc-vehicle-sbb-ae814` | SBB Ae 8/14 Landi | box locomotive, raked | - | 34.0 m, 8,160 kW, 110 km/h |
| `proc-vehicle-rhb-ge443` | RhB Ge 4/4 III | box locomotive, metre gauge | - | Bo-Bo, 16.0 m, 2,400 kW, 100 km/h |
| `proc-vehicle-rhb-ge66` | RhB Ge 6/6 I Krokodil | box locomotive, hoods, metre gauge | `livery` (`brown`, `green`) | 13.3 m, 794 kW, 55 km/h |
| `proc-vehicle-mgb-hge442` | MGB HGe 4/4 II | box locomotive, metre gauge | - | Bo-Bo rack, 14.8 m, 1,932 kW, 90 km/h |
| `proc-vehicle-sbb-ew4-coach` | SBB EW IV coach | coach | `unit` (`a`, `b`), `livery` (`redGrey`, `sbb`) | 26.4 m; 200 km/h |
| `proc-vehicle-sbb-ic2000` | SBB IC 2000 coach | coach, double-deck | `unit` (`a`, `b`) | 26.8 m; 200 km/h |
| `proc-vehicle-glacier-express` | Glacier Express coach | coach, metre gauge | `unit` (`first`, `second`) | 18.4 m, the panorama windows; 90 km/h |

## Deviations

- **Metre gauge.** The RhB and MGB stock keeps its real 2.65 m bodies on the game's
  standard-gauge wheelsets, as the KiHa 40 does; the HGe 4/4 II's rack pinions are
  not drawn.
- **Crocodiles.** The Ce 6/8 II's and the Ge 6/6 I's hoods are drawn at the cab's width
  (the `hoods` nose type) on two three-axle groups; the side rods are not drawn.
- **Ae 8/14.** One 34 m body on its eight driving axles in four groups; the articulation
  between its two halves and the six idle guiding axles are left out.
- **Glacier Express.** The panorama roof is drawn as the dark roof band over tall windows.
- **Allegra.** Its own cab face (`ALLEGRA_FACE`) and livery (`ALLEGRA_RHB`, key `rhb`; the
  shared `chLivery("rhb")` is unchanged), read from four photographs (assets/rhb-allegra/):
  the upright glass-fibre front under the silver hood, tapering in plan (a flat face about
  1.35 m wide; elliptic corners 0.62 - 0.68 m across reach the full 2.65 m about 1.0 m behind
  the tip low down and 1.45 m at the windscreen's top, the kit's `cornerDepth`), the black
  mask (1.72 m wide) with the 1.2 m tall windscreen and destination display between the
  broad red corner panels, the lamps low in black pods on the corners, the
  Graubuenden arms, the camera box, sockets, coupler and snowplough; the white line low on
  the sides (12 cm lower on the face, a step at the corner where the real one ramps down);
  the cab side window behind the pillar, the cab door, the first class's yellow line, white
  door leaves; silver roof fairings over a dark equipment well. End cars 17.75 m and the
  middle car 14.0 m (49.5 m); the layout of each car comes from a projective fit along the
  photographed sides. Of the three pantographs each end car raises its DC one over the cab
  (the Bernina line, as photographed) and the middle car's AC one lies folded. The middle
  car's bogies stand near its ends with no underfloor box between them (the lowered floor),
  its low-floor bay has a double door and one window reaching down to the white line. The
  number 3502 stands under the cab door's window, lower than on the real car, because the
  kit puts it on every car at one height. The kit's single wheel radius (0.4 m) serves the
  middle car's smaller trailer wheels too.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
