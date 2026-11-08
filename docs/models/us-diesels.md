# North American diesel locomotives

**Covers** - the four North American hood units (`proc-vehicle-emd-gp9`, `proc-vehicle-emd-sd40-2`, `proc-vehicle-ge-es44ac`, `proc-vehicle-emd-sd70ace`): their measures, liveries, the shared hood unit kit, the distant model, deviations and the tests.
**Code** - `generator/usDiesels.ts` (`US_DIESELS`), `generator/usHoodKit.ts`, `generator/sd70ace.ts`, `generator/loadingGauge.ts`, `test/usDiesels.test.ts`, `assets/emd-gp9/`, `assets/emd-sd40-2/`, `assets/ge-es44ac/`, `assets/emd-sd70ace/`
**See also** - [loading-gauge.md](loading-gauge.md), [diesel-locos.md](diesel-locos.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (default first) | over couplers | truck centres | triangles |
|---|---|---|---|---|---|
| `proc-vehicle-emd-gp9` | EMD GP9 | `unionPacific`, `pennsylvania`, `santaFe` | 17.12 m | 9.45 m (B-B) | about 6,900 |
| `proc-vehicle-emd-sd40-2` | EMD SD40-2 | `burlingtonNorthern`, `conrail`, `unionPacific` | 20.98 m | 12.19 m (C-C) | about 8,900 |
| `proc-vehicle-ge-es44ac` | GE ES44AC | `bnsf`, `unionPacific`, `csx` | 22.30 m | 16.15 m (C-C) | about 9,000 |
| `proc-vehicle-emd-sd70ace` | EMD SD70ACe | `unionPacific`, `norfolkSouthern`, `bnsf` | 22.63 m | 14.58 m (C-C) | about 10,800 |

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
| radiator | side grilles, two fans | side grilles, three fans | flared wings, two fans | flared wings with sloped cores over 5.6 m, two fans, a rear cabinet with a small fan |
| dynamic brakes | - | housing behind the cab | box behind the cab | tall box behind the filter cabinet, grid hatch on its roof |
| wheels | 40 in | 40 in | 42 in | 42 in |
| game | 113 t, 1,305 kW, 105 km/h | 167 t, 2,237 kW, 105 km/h | 196 t, 3,281 kW, 121 km/h | 185 t, 3,207 kW, 113 km/h |

## The hood unit kit (`usHoodKit.ts`)

The GP9, SD40-2 and ES44AC are drawn by the kit; the SD70ACe has its own builder
(next section) that borrows the kit's painted sweeps, decals, lettering and coupler.
`SD70_SPEC` stays in `usDiesels.ts` for the kit's Indian WDP4D (`inLocos.ts`).

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

## The SD70ACe (`sd70ace.ts`)

Measured on photographs of the class (`assets/emd-sd70ace/SOURCES.md`; a projective fit
over the axles of a near side-on photo for positions between the trucks, height ratios
on head-on and three-quarter photos) within the published length, truck centres and
wheelbase, wheels, height and cab width:

| part | x (m, +X the cab end) | heights (m) |
|---|---|---|
| front platform, pilot | 9.95 - 10.78 | deck 1.72, sill 1.42 |
| wide nose: vertical front and sides, a bevel over the front, chamfered top edges | 8.85 - 9.95 | front edge 3.42, top 3.78 |
| isolated cab: raked windscreens, chamfered corners, brow with number boards | 6.45 - 8.85 | windscreens 3.92 - 4.50, roof 4.80 |
| inertial filter cabinet (louvred intakes) | 2.85 - 6.45 | 4.58 |
| dynamic brake box (grid hatch, side grilles) | 1.0 - 2.85 | 4.78 |
| engine hood (exhaust, five-chime horn) | -2.66 - 1.0 | 4.22 |
| radiator: flared wings with sloped cores, two 1.4 m fans | -8.3 - -2.66 | 4.78, 3.12 m wide |
| rear cabinet: louvres, tall grille, small fan | -10.22 - -8.3 | 4.78 |
| fuel tank (bevelled), main reservoirs over it | -4.1 - 4.35 | 0.34 - 1.04 |

The nose and the cab's front are convex hulls of a few corner points (`hullSolid`), every
face cut at the livery's band heights. Each cab side has the three-pane sash group under an
awning right behind the windscreen; the left side also a small pane behind it; doors in
the cab's rear wall open onto the side walkways. The headlights are in the brow between
the number boards (UP, NS) or on the nose (BNSF); ditch lights low on the nose's corners.
Its distant model (`sd70aceLod`, 100 triangles) has shells for the radiator, the hood
and cabinet, the cab and the nose, the dynamic brake as a box, frame, tank, pilots and trucks.


Simplified railroad schemes: colour fields, stripes and the railroad's name in
plain stroke letters; no heralds or logos, except the SD70ACe's UP winged shield,
NS speed lines and BNSF swoosh drawn as plain shapes. Running
numbers are illustrative numbers in each railroad's series for the class.

| scheme | used on | paint |
|---|---|---|
| Union Pacific | GP9, SD40-2, ES44AC, SD70ACe | armour yellow, a red pinstripe under the grey hood top and cab roof, grey frame and trucks, red sill stripe and lettering; on the SD70ACe the pinstripe at the cab's window sill (3.76 m) all along, grey above, the winged shield on the nose |
| Pennsylvania | GP9 | Brunswick green, buff sill stripe and lettering |
| Santa Fe | GP9 | blue hood and cab, yellow ends, yellow lettering |
| BN Cascade | SD40-2 | Cascade green with a black roof and frame, white lettering |
| Conrail | SD40-2 | blue with a white sill stripe and lettering |
| BNSF | ES44AC, SD70ACe | orange, a yellow pinstripe under the black hood top, black frame, yellow sill stripe; on the SD70ACe Heritage III: yellow-black-yellow pinstripes at 3.5 m swooping down behind the cab to the walkway and across the nose, BNSF across the nose over a black line |
| CSX | ES44AC | dark blue hood, yellow cab and nose, grey frame |
| Norfolk Southern | SD70ACe | black, white stripes across the nose and its sides, the NS speed lines and name on the hood, a grey brow, white sill stripe, yellow end rails |

## Deviations

- The SD70ACe's truck centres are the published 47 ft 10 in; a photograph fitted with
  both end sills suggests about 13.3 m, which is not used.
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
