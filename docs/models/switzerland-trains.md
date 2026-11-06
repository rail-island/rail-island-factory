# Switzerland's trains

**Covers** - the twenty Swiss designs of the eight-country plan: the RAe TEE II, the Roter Pfeil, the ICN, the Giruno, the FV-Dosto, SBB's FLIRT and KISS and the Rhaetian Railway's Allegra; the Re 460, Re 4/4 II, Re 6/6, Ae 6/6, Ce 6/8 II Krokodil and Ae 8/14 Landi; on the metre gauge the RhB Ge 4/4 III and Ge 6/6 I Krokodil and the MGB HGe 4/4 II; the EW IV, IC 2000 and Glacier Express coaches. Their kits, figures, deviations and tests.
**Code** - `generator/chUnits.ts` (`CH_UNITS`, `chLivery`), `generator/chLocos.ts` (`CH_LOCOS`), `generator/mgbHge442.ts`, `generator/seriesHelpers.ts` (`flirt`, `kiss`), `generator/worldCoaches.ts`, `test/worldTrains.test.ts`, `assets/sbb-*/`, `assets/rhb-*/`, `assets/mgb-hge442/`, `assets/glacier-express/`
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
| `proc-vehicle-mgb-hge442` | MGB HGe 4/4 II | box locomotive kit, its own profiles (`mgbHge442.ts`), metre gauge | - | Bo-Bo rack, 14.776 m, 64 t, 1,932 kW, 90 km/h |
| `proc-vehicle-sbb-ew4-coach` | SBB EW IV coach | coach | `unit` (`a`, `b`), `livery` (`redGrey`, `sbb`) | 26.4 m; 200 km/h |
| `proc-vehicle-sbb-ic2000` | SBB IC 2000 coach | coach, double-deck | `unit` (`a`, `b`) | 26.8 m; 200 km/h |
| `proc-vehicle-glacier-express` | Glacier Express coach | coach, metre gauge | `unit` (`first`, `second`) | 18.4 m, the panorama windows; 90 km/h |

## The HGe 4/4 II

Unlike the other Swiss locomotives, which state a few measures for the world
locomotive kit, the HGe 4/4 II has its own `LocoSpec` (`mgbHge442.ts`), measured
on the Commons photograph of FO 105 and a side view of the LGB model
(assets/mgb-hge442/SOURCES.md):

- **Profile.** A grey skirt (0.95 - 1.12 m) a little proud of the red; the cab
  front upright to 1.6 m, then leaning back 0.34 m to the eave at 3.08 m; the cab
  roof rounding down to the front, with the top headlight on the slope, to 3.38 m.
  The machine-room roof (the three aluminium roof elements) stands higher, to
  3.6 m, between |x| = 4.65 m, its sloped sides carrying four louvre panels a side;
  the single-arm pantographs stand on it at |x| = 3.75 m.
- **Sides.** Ribbed walls without machine-room openings; one cab door a side,
  diagonally opposite the other side's (left side at the front, right side at the
  rear), the cab windows at both ends. The FO logo's seven bars lie in the flats
  between the ribs on the half away from the door, F before O as read from the side.
- **Ends.** The asymmetric windscreen (the driver's pane, on the left, wider) in
  silver frames, two headlights and two tail lamps low, the number 105 painted
  under the driver's pane and below the cab side windows; a centre coupler at
  0.8 m instead of side buffers.
- **Running gear.** Bogie pivots 7.26 m apart, a 2.98 m bogie wheelbase, 0.94 m
  wheels, the transformer and tanks between the bogies.

## Deviations

- **Metre gauge.** The RhB and MGB stock keeps its real 2.65 m bodies on the game's
  standard-gauge wheelsets, as the KiHa 40 does; the HGe 4/4 II's rack pinions are
  not drawn.
- **Crocodiles.** The Ce 6/8 II's and the Ge 6/6 I's hoods are drawn at the cab's width
  (the `hoods` nose type) on two three-axle groups; the side rods are not drawn.
- **Ae 8/14.** One 34 m body on its eight driving axles in four groups; the articulation
  between its two halves and the six idle guiding axles are left out.
- **Glacier Express.** The panorama roof is drawn as the dark roof band over tall windows.

## Tests

`test/worldTrains.test.ts` and, for each module's first design, the catalog sweep.
