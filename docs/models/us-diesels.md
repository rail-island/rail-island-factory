# North American diesel locomotives

**Covers** - the four North American hood units (`proc-vehicle-emd-gp9`, `proc-vehicle-emd-sd40-2`, `proc-vehicle-ge-es44ac`, `proc-vehicle-emd-sd70ace`): their measures, liveries, the shared hood unit kit, the distant model, deviations and the tests.
**Code** - `generator/usDiesels.ts` (`US_DIESELS`), `generator/usHoodKit.ts`, `generator/loadingGauge.ts`, `test/usDiesels.test.ts`, `assets/emd-gp9/`, `assets/emd-sd40-2/`, `assets/ge-es44ac/`, `assets/emd-sd70ace/`
**See also** - [loading-gauge.md](loading-gauge.md), [diesel-locos.md](diesel-locos.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (default first) | over couplers | truck centres | triangles |
|---|---|---|---|---|---|
| `proc-vehicle-emd-gp9` | EMD GP9 | `unionPacific`, `pennsylvania`, `santaFe` | 17.12 m | 9.45 m (B-B) | about 6,900 |
| `proc-vehicle-emd-sd40-2` | EMD SD40-2 | `burlingtonNorthern`, `conrail`, `unionPacific` | 20.98 m | 12.19 m (C-C) | about 8,900 |
| `proc-vehicle-ge-es44ac` | GE ES44AC | `bnsf`, `unionPacific`, `csx` | 22.30 m | 16.15 m (C-C) | about 9,000 |
| `proc-vehicle-emd-sd70ace` | EMD SD70ACe | `unionPacific`, `norfolkSouthern`, `bnsf` | 22.63 m | 14.58 m (C-C) | about 9,100 |

All are rigid diesel locomotives (`DIESEL_LOCO_CATALOG`, group `loco`), registered
as their own family in `generate.ts`; a design's JS model imports its builder by
name from `usDiesels.ts`. They are drawn at their real size to the **US loading
gauge** (`loadingGauge: "us"`, 3.3 m by 4.95 m; [loading-gauge.md](loading-gauge.md)):
about 3.16 - 3.18 m over the walkways and up to 4.94 m over the SD70ACe's
radiator. Measures and sources are in each `assets/<name>/SOURCES.md`; the
`ft(feet, inches)` helper keeps the published imperial figures in the code.

| | GP9 | SD40-2 | ES44AC | SD70ACe |
|---|---|---|---|---|
| front | high short hood | low nose | wide nose, safety cab | wide nose, safety cab |
| radiator | side grilles, two fans | side grilles, three fans | flared wings, two fans | flared, two fans |
| dynamic brakes | - | housing behind the cab | box behind the cab | hatch mid-hood |
| wheels | 40 in | 40 in | 42 in | 42 in |
| game | 113 t, 1,305 kW, 105 km/h | 167 t, 2,237 kW, 105 km/h | 196 t, 3,281 kW, 121 km/h | 185 t, 3,207 kW, 113 km/h |

## The hood unit kit (`usHoodKit.ts`)

One builder, `buildUsHood(spec, livery)`, draws every unit from a `UsHoodSpec`
(measures) and a `UsLivery` (paint), +X toward the short hood (the F end):

- **Painted sweeps** (`paintedSweep`): a convex section extruded along x (the
  hoods, the classic cab) or a side profile across z (the low and wide noses, the
  safety cab with its raked windscreen), every face painted by the band at its
  height, so a scheme's stripes are exact and no hidden face lies between bands.
- **Frame**: walkway deck and side sill, the sill stripe, pilots, AAR knuckle
  couplers (no buffers), air hoses, corner steps with grab irons, ditch lights
  on the newer units, diagonal stripes on the end sills.
- **Hoods and cab**: the long hood's doors, radiator grilles or flared radiator
  with its cores, roof fans, exhaust (the smoke emitter), dynamic brake housing,
  the railroad's name along the hood (`sideText`), headlights, number boards and
  marker lights at both ends, windscreens and cab side windows with the running
  number, horns and antenna; side and end handrails on stanchions.
- **Running gear**: the diesel toolkit's bogie (`dieselParts.ts`) for the
  Blomberg B, HT-C and the GE trucks; the fuel tank and air reservoirs.
- **Distant model** (`usHoodLod`): the long hood (its radiator's flare as its
  width), the front and the cab as LOD shells with the livery's bands, the frame,
  fuel tank, pilots and both trucks, 100 triangles.

## Liveries

Simplified railroad schemes: colour fields, stripes and the railroad's name in
plain stroke letters; no heralds, logos or nose "wings" are drawn. Running
numbers are illustrative numbers in each railroad's series for the class.

| scheme | used on | paint |
|---|---|---|
| Union Pacific | GP9, SD40-2, ES44AC, SD70ACe | armour yellow, a red pinstripe under the grey hood top and cab roof, grey frame and trucks, red sill stripe and lettering |
| Pennsylvania | GP9 | Brunswick green, buff sill stripe and lettering |
| Santa Fe | GP9 | blue hood and cab, yellow ends, yellow lettering |
| BN Cascade | SD40-2 | Cascade green with a black roof and frame, white lettering |
| Conrail | SD40-2 | blue with a white sill stripe and lettering |
| BNSF | ES44AC, SD70ACe | orange, a yellow pinstripe under the black hood top, black frame, yellow sill stripe |
| CSX | ES44AC | dark blue hood, yellow cab and nose, grey frame |
| Norfolk Southern | SD70ACe | black with white lettering and sill stripe |

## Deviations

- Truck side frames are the diesel toolkit's generic cast frame, not the
  Blomberg, HT-C, HiAd or HTCR castings; steerable trucks are not modelled.
- Radiator fans, dynamic brake housings and the exhaust are placed from
  photographs; hood doors are drawn as seams and latches.
- The GP9's truck centres are the published 31 ft (The Diesel Shop's data sheet
  gives 40 ft, which would put the trucks at the pilots).

## Checking

`pnpm exec vitest run test/usDiesels.test.ts test/loadingGauge.test.ts` (ids,
liveries and their 16-character titles; every livery within 16,000 triangles,
at its published length, inside the US gauge and wider than the UIC one, without
coplanar faces; trucks at the published centres with their axles and wheels;
exhaust, headlights, couplers, lettering; deterministic bytes; the distant
model). The LODs are also in `test/lod-locos.test.ts`.
