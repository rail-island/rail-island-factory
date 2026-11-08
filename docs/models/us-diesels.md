# North American diesel locomotives

**Covers** - the four North American hood units (`proc-vehicle-emd-gp9`, `proc-vehicle-emd-sd40-2`, `proc-vehicle-ge-es44ac`, `proc-vehicle-emd-sd70ace`): their measures, liveries, the shared hood unit kit, the distant model, deviations and the tests.
**Code** - `generator/usDiesels.ts` (`US_DIESELS`), `generator/usGp9.ts`, `generator/usSd40.ts`, `generator/usHoodKit.ts`, `generator/loadingGauge.ts`, `test/usDiesels.test.ts`, `assets/emd-gp9/`, `assets/emd-sd40-2/`, `assets/ge-es44ac/`, `assets/emd-sd70ace/`
**See also** - [loading-gauge.md](loading-gauge.md), [diesel-locos.md](diesel-locos.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (default first) | over couplers | truck centres | triangles |
|---|---|---|---|---|---|
| `proc-vehicle-emd-gp9` | EMD GP9 | `unionPacific`, `pennsylvania`, `santaFe` | 17.12 m | 9.45 m (B-B) | about 8,700 - 8,900 |
| `proc-vehicle-emd-sd40-2` | EMD SD40-2 | `burlingtonNorthern`, `conrail`, `unionPacific` | 20.98 m | 13.26 m (C-C) | about 14,350 - 14,650 |
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
| dynamic brakes | blister over the engine (PRR, Santa Fe) | grille and two fans mid-hood | box behind the cab | hatch mid-hood |
| wheels | 40 in | 40 in | 42 in | 42 in |
| game | 113 t, 1,305 kW, 105 km/h | 167 t, 2,237 kW, 105 km/h | 196 t, 3,281 kW, 121 km/h | 185 t, 3,207 kW, 113 km/h |

## The GP9 (`usGp9.ts`)

The GP9 is drawn by its own module from photographs (`assets/emd-gp9/SOURCES.md`): the
measures along the body come from a near side-on photograph of UP 211 scaled by the
published truck centres, so `GP9_BODY` differs from `GP9_SPEC` in `usDiesels.ts`, which
keeps the first kit-drawn measures the WDM-2 (`inLocos.ts`) is built on. It reuses the
kit's painted sweeps, decals, lettering, coupler and distant model, and adds:

- **Hoods** with a 0.08 m roof edge and **rounded vertical end corners** (0.15 m, `roundedEnd`);
  each end face carries twin sealed-beam headlights on the centre line between two flush number
  boards, two class lights over the boards' outer ends and a ladder of five grab irons.
- **Long hood**: the three radiator grilles high at the rear under the two roof fans, the
  battery vent, three columns of louvred doors over the engine, the generator's two louvre
  columns behind the cab with the air intake grille above them, a door seam every 0.587 m with
  its latch, and the exhaust; a **dynamic brake blister** (-3.36 .. 0.70 m, 0.45 m high, side
  intakes and fan, the exhaust through its top) on the schemes whose units had one.
- **Cab** 2.96 - 4.82 m with an arched roof and drip rails, tall windscreens either side of
  the short hood, rear windows either side of the long hood, one two-pane sliding side window
  under a sun visor, the running number placed as each railroad did, corner grab irons.
- **Frame**: the side sills cut away by a 0.72 m step well at each corner (three treads
  between two stringers, grab irons each side), dropping 0.22 m between the trucks; pilots
  between the wells, an optional V snowplow, MU hoses; single-rail walkways on stanchions every
  1.25 m, end railings open over the coupler; horn and bell on the short hood.
- **Blomberg B trucks**: side frames stepped down over the journal-box pedestals, the arch under
  the bolster window holding the elliptic leaf springs, a coil each side of every journal box on
  its equaliser, brake cylinders on the frames' faces.

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

## The SD40-2's own body (`usSd40.ts`)

The SD40-2 is measured from photographs (the near-orthographic BN 7812 side view at
52.6 px/m, NS 6155, UP 3741, CR 6469; `assets/emd-sd40-2/SOURCES.md`) and drawn by
its own module with the kit's helpers (`paintedSweep`, decals, coupler, the
distant model); `SD40_SPEC` stays in `usDiesels.ts` for the WDM-2's trucks. From the
rear: a 1.5 m rear platform; the long hood (x -8.35 m, 4.5 m high) with two radiator
grille panels a side under three 48 in fans, the exhaust, the dynamic brake grille
in a shallow box high on the side under two fans, 15 engine room doors; the raised
electrical cabinet behind the cab (x 2.1 - 4.67, 15 ft 1.2 in) with its tall
inertial filter grille; the EMD standard cab (x 4.67 - 7.08) with angled front
corners holding the doors and their tall windows, two windscreens with wipers, the
header with the twin headlight (the horn on it) and the number boards on its angled
corners, the sliding side window under an awning; the low nose (to x 8.95, 3.45 m)
with rounded front corners and top edge, sand fillers, marker lights and the bell;
corner step wells at all four corners, a snowplow at the front; HT-C trucks at
43 ft 6 in with their deep cast side frames (top chord, bellies with lightening holes, jaws, axle boxes, spring nests) over the toolkit's and dampers on the outer axles; the fuel tank (x -3.4 - 3.5) with the
air reservoirs over it (its lower edges rounded). Running numbers are the photographed units (BN 7812,
CR 6469, UP 3741).

## Liveries

Simplified railroad schemes: colour fields, stripes and the railroad's name in
plain stroke letters; no nose "wings" are drawn, and heralds only on the SD40-2
(simplified BN herald, Conrail wheel, Union Pacific shield). Running
numbers are illustrative numbers in each railroad's series for the class.

| scheme | used on | paint |
|---|---|---|
| Union Pacific | GP9, SD40-2, ES44AC, SD70ACe | armour yellow, a red pinstripe under the grey hood top and cab roof, grey frame and trucks, red sill stripe and lettering (the GP9's own: the stripe 1.9 m over the deck with 0.7 m of grey above, as on UP 211; the SD40-2: grey top 0.8 m deep, grey cab front above the stripe, the shield on the nose) |
| Pennsylvania | GP9 | Brunswick green all over, buff lettering spaced wide, safety-yellow end rails, no sill stripe (PRR 7048, 7000) |
| Santa Fe | GP9 | blue, yellow hood end faces, a yellow stripe along the hoods and cab, yellow sill, yellow lettering (ATSF 2879) |
| BN Cascade | SD40-2 | Cascade green, the hood top black 1 m deep over the grilles, black cab roof, frame and pilot, the white BN herald and name on the cab, the number on the long hood |
| Conrail | SD40-2 | all blue with black trucks and tank, the white wheel-and-rails emblem on the long hood, CONRAIL on the hood and the nose, the number on the cab |
| BNSF | ES44AC, SD70ACe | orange, a yellow pinstripe under the black hood top, black frame, yellow sill stripe |
| CSX | ES44AC | dark blue hood, yellow cab and nose, grey frame |
| Norfolk Southern | SD70ACe | black with white lettering and sill stripe |

## Deviations

- Truck side frames are the diesel toolkit's generic cast frame, not the
  HiAd or HTCR castings (the GP9 draws its Blomberg B, the SD40-2 its HT-C casting); steerable trucks are not modelled.
- The GP9 schemes leave out the heralds (UP shield, Santa Fe cross) and UP 211's later
  winterization hatch; the long hood's louvre layout is UP 211's on every scheme, and both
  sides are drawn alike.
- Radiator fans, dynamic brake housings and the exhaust are placed from
  photographs; hood doors are drawn as seams and latches.
- The SD40-2's truck centres are 43 ft 6 in between the bolsters (Wikipedia, the
  Conrail Historical Society); The Diesel Shop's 40 ft does not fit the photographs.
- The GP9's truck centres are the published 31 ft (The Diesel Shop's data sheet
  gives 40 ft, which would put the trucks at the pilots).

## Checking

`pnpm exec vitest run test/usDiesels.test.ts test/loadingGauge.test.ts` (ids,
liveries and their 16-character titles; every livery within 16,000 triangles,
at its published length, inside the US gauge and wider than the UIC one, without
coplanar faces; trucks at the published centres with their axles and wheels;
exhaust, headlights, couplers, lettering; deterministic bytes; the distant
model). The LODs are also in `test/lod-locos.test.ts`.
