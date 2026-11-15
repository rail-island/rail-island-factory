# China's trains

**Covers** - the twenty Chinese designs of the eight-country plan: the Fuxing CR400AF and CR400BF, the CRH380A, CRH2A, CRH3C (on the Velaro body), CRH5A, the CR200J "Green Giant" and the CRH6A; the HXN5, HXD1, HXD3D, SS1 and SS8, DF4 and DF11; the QJ, SY and JS steam engines; the 25-series coaches; the C70 / P70 wagons. Their kits, figures, deviations and tests.
**Code** - `generator/cnUnits.ts` (`CN_UNITS`), `generator/cnLocos.ts` (`CN_LOCOS`), `generator/seriesHelpers.ts` (`velaro`), `generator/worldSteamLocos.ts`, `generator/worldCoaches.ts`, `generator/worldWagons.ts`, `test/worldTrains.test.ts`, `assets/cr-*/`
**See also** - [shinkansen.md](shinkansen.md) (the series kit, the Shinkansen gauge), [world-locos.md](world-locos.md), [world-steam.md](world-steam.md), [world-coaches.md](world-coaches.md), [world-wagons.md](world-wagons.md), [germany-trains.md](germany-trains.md) (the Velaro)

The catalog had the Hong Kong MTR M-Train (filed under Hong Kong); none of China
Railway's trains. Every design here is filed under China.

## The designs

| id | title | kit | parameters | figures (game) |
|---|---|---|---|---|
| `proc-vehicle-cr-cr400af` | Fuxing CR400AF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`red`, `smart`) | 350 km/h |
| `proc-vehicle-cr-cr400bf` | Fuxing CR400BF | series, Shinkansen gauge | `unit`, `cars` 3 - 8, `livery` (`gold`, `red`) | 350 km/h |
| `proc-vehicle-cr-crh380a` | CRH380A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the long nose; 350 km/h |
| `proc-vehicle-cr-crh2a` | CRH2A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | the E2-derived nose; 250 km/h |
| `proc-vehicle-cr-crh3c` | CRH3C | series, the ICE 3's Velaro cab face (`cnCrh3c.ts`) | `unit`, `cars` 3 - 8 | end 25.675 m, middle 24.775 m, 3.1 m wide (real 3.265 m), 3.89 m high; 350 km/h |
| `proc-vehicle-cr-crh5a` | CRH5A | series, Shinkansen gauge | `unit`, `cars` 3 - 8 | 250 km/h |
| `proc-vehicle-cr-cr200j` | Fuxing CR200J | series: the power car as the coaches' lead car (`leadCar`), one cab face for it and the driving trailer (`cnCr200j.ts`) | `unit` (`endCar` power car, `middleCar` coach, `drivingTrailer`, `train`), `cars` 4 - 8, `livery` (`green`, `whiteRed`) | power car 20.0 m, coach 25.5 m, driving trailer 27.955 m; 5,600 kW, 160 km/h |
| `proc-vehicle-cr-crh6a` | CRH6A | series | `unit`, `cars` 4 - 8 | 200 km/h |
| `proc-vehicle-cr-hxn5` | CR HXN5 | hood unit, the ES44AC's body | - | 4,660 kW, 120 km/h |
| `proc-vehicle-cr-hxd1` | CR HXD1 | box locomotive | - | 35.2 m, eight axles, 9,600 kW |
| `proc-vehicle-cr-hxd3d` | CR HXD3D | box locomotive, raked | - | Co-Co, 20.85 m, 7,200 kW, 160 km/h |
| `proc-vehicle-cr-ss1` | CR SS1 Shaoshan | box locomotive, flat | - | Co-Co, 20.4 m, 3,780 kW |
| `proc-vehicle-cr-ss8` | CR SS8 Shaoshan | box locomotive, streamlined | - | Bo-Bo, 17.5 m, 3,600 kW, 170 km/h |
| `proc-vehicle-cr-df4` | CR DF4 Dongfeng | box locomotive, diesel | `livery` (`orangeWhite`, `green`) | Co-Co, 20.5 m, 1,985 kW |
| `proc-vehicle-cr-df11` | CR DF11 Dongfeng | box locomotive, streamlined, diesel | - | Co-Co, 21.25 m, 3,040 kW, 170 km/h |
| `proc-vehicle-cr-qj` | CR QJ | steam, knuckle couplers | `unit` | 2-10-2, 1.5 m drivers |
| `proc-vehicle-cr-sy` | CR SY | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-js` | CR JS | steam, knuckle couplers | `unit` | 2-8-2, 1.37 m drivers |
| `proc-vehicle-cr-25t-coach` | CR 25-series coach | coach, knuckle couplers | `unit` (`softSleeper`, `hardSeat`), `livery` (`z25t`, `green25b`) | 26.6 m; 160 km/h |
| `proc-vehicle-cr-c70-wagon` | CR C70 / P70 wagon | wagon | `unit` (`open`, `covered`) | 13.98 m and 17.0 m |

## Deviations

- **Width.** The high-speed trains' 3.36 - 3.38 m bodies are narrowed to the Shinkansen
  gauge's 3.3 m, as the Shinkansen are.
- **Couplers.** The box locomotives carry the kit's buffers; China's are automatic couplers.
- **HXD1.** One 35.2 m body on eight axles; its two sections' joint is not drawn.
- **CR200J.** Only the short sets' formation (power car, coaches, driving trailer) is drawn; the long sets have a power car at each end.

## Tests

`test/worldTrains.test.ts` (all 160 plan designs) and, for each module's first design,
the catalog sweep.

## The CRH3C's body

`generator/cnCrh3c.ts`, matched to the photographs in `assets/cr-crh3c/` (unit CRH3-037C).
The Velaro CN shares the ICE 3's snout, so the design reuses its measured cab face
(`ICE3_FACE`, [germany-trains.md](germany-trains.md)) with the CRH face's own paint; the
shared `velaro()` body is no longer used by it (the AVE S-103 keeps it).

- **Size.** End car 25.675 m and middle car 24.775 m over the couplers (200 m for eight
  cars), 3.89 m high, bogie centres 17.375 m. The real body is 3.265 m wide, wider than the
  ICE 3's 2.95 m; the model is drawn 3.1 m wide, the UIC gauge's limit.
- **Face.** The canopy's tinted glass from 2.47 m with a light grey lip below it
  (2.17 - 2.49 m) holding the round upper lamp, a dark rim round both; the black "Hexie hao"
  characters drawn as simplified strokes just under the lip; the two lamp clusters
  (1.55 - 1.98 m, leaning out at the top) with the head and red lamps on their outer half and
  six black slats on the inner; the coupler cover's seam over its top and flanks; a light
  grey plough under it.
- **Livery.** White; one royal-blue band (sampled `#1048a8`), 7 cm high at 1.865 - 1.935 m,
  8.5 cm under the windows' foot, along every car. On the end car it falls from the join
  (7 m behind the tip) to a point 1.48 m behind the tip at 1.35 m, low on the nose's flank
  behind the coupler cover, and a thin line rises back from the point to 2.42 m behind the
  tip at 2.26 m, just ahead of the lounge window: a chevron opening backward. The navy "CRH"
  mark at the end car's rear, the running number under the windows.
- **Sides.** The end car: the VIP lounge's raked window band behind the cab (its front edge
  leaning further back than the ICE 3's), one door 8.45 m behind the tip, the saloon's
  windows to the CRH mark. The middle cars: a door a side at each end (the photographs'
  second and third cars), the windows between.
- **Roof.** Two low air-conditioning units on the rear half of the end car; the single-arm
  pantographs on low fairings on the second and next-to-last cars.

## The CR200J's body

`generator/cnCr200j.ts`, matched to the photographs in `assets/cr-cr200j/` (power cars FXD1-J0009,
FXD1-J0010, FXD3-J0271; sets CR200J-1009, CR200J-2039). The short sets run as Mc + 7T + Tc: one power
car, the coaches and a driving trailer with the same nose at the other end. On the series kit the coaches
and the driving trailer are one series (`CR200J`, unwired) and the power car is its lead car (`leadCar`,
shinkansen.ts): a train is the power car, `cars` - 2 coaches and the driving trailer, turned. The unit
values keep their keys: `endCar` is the power car (the default), `middleCar` a coach, the new
`drivingTrailer` the control car.

- **Size.** Power car 20.0 m, coach 25.5 m, driving trailer 27.955 m over the couplers (published);
  3.1 m wide (3.105 m); the power car's roof 4.33 m, the coaches' 4.43 m (published 4.433 m), drawn to
  the US gauge.
- **Nose.** One cab face for both cab cars, its centre line measured on the side-on photograph (about
  71 px/m): a broad, rounded bumper (its front 0.9 m up, its top lip 1.2 m), the chin rising at about
  43 degrees to the windscreen's foot (2.56 m, 1.64 m behind the tip), the windscreen to 3.5 m, the
  canopy rounding over to the roof 5.3 m behind the tip, where the crown still rises for 1.5 - 2.4 m.
  In plan the face bows back (its edges up to 1.0 m behind its centre at the lamps), its corners
  0.6 - 0.8 m round, so the lamps at its edges stand 1.3 m behind the chin and still face ahead.
- **Face paint.** The plough black; the bumper in the body's paint, split down its middle; the chin
  (dark grey, or deep green on the white sets) with the orange emblem, parted from the eyes by two
  stripes of body paint; the eyes, the windscreen's frame and the canopy dark grey, the canopy running
  back over the roof; the head lamps and the red tail lamps in the eyes, a lamp on the canopy.
- **Power car.** The cab side window's two panes in a slanted dark frame (3.9 - 6.8 m behind the tip),
  no passenger windows, one crew door 9.2 m behind the tip; louvres along both roof edges over 7.05 -
  9.9 m and 15.4 - 18.5 m; two single-arm pantographs, the rear one (15.8 m) raised, the front one
  (7.6 m) folded on its tall insulators, the breaker between them; Bo-Bo bogies 7.9 m apart (8.28 m
  and 16.2 m behind the tip) on 1.25 m wheels, 2.8 m wheelbase.
- **Coaches.** A door at each end with a tall rounded window, twelve 1.05 m windows 1.72 m apart in the
  dark band, an air-conditioning unit over one end; bogies 18 m apart.
- **Driving trailer.** The nose, the chevron's blank panel with "CR", a door 11.0 m behind the tip,
  seven windows 1.7 m apart from 13.1 m, a small one and the rear door; no pantograph.
- **Green Giant.** Bright green (`#3fae4b`); the dark window band 1.66 - 2.92 m and the yellow line
  1.36 - 1.54 m under it on every car. On both cab cars the yellow chevron: the line running forward and
  down to a point 4.05 m behind the tip at 1.12 m, its upper leg rising back to the band's top 8.2 -
  8.6 m behind the tip, and the band's slanted front parallel to it. "CR" in white on the band, the
  running number in yellow under the line.
- **White and red.** White; a deep green window band and a red line (1.46 - 1.56 m) under it, a green
  line low along every car; on the cab cars the green carried round the cab window, two red waves
  rising from the line toward it, and the bumper white over a green line; the chin deep green.

