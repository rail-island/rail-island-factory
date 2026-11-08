# North American diesel locomotives

**Covers** - the four North American hood units (`proc-vehicle-emd-gp9`, `proc-vehicle-emd-sd40-2`, `proc-vehicle-ge-es44ac`, `proc-vehicle-emd-sd70ace`): their measures, liveries, the shared hood unit kit, the distant model, deviations and the tests.
**Code** - `generator/usDiesels.ts` (`US_DIESELS`), `generator/usHoodKit.ts`, `generator/geEs44ac.ts`, `generator/loadingGauge.ts`, `test/usDiesels.test.ts`, `assets/emd-gp9/`, `assets/emd-sd40-2/`, `assets/ge-es44ac/`, `assets/emd-sd70ace/`
**See also** - [loading-gauge.md](loading-gauge.md), [diesel-locos.md](diesel-locos.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (default first) | over couplers | truck centres | triangles |
|---|---|---|---|---|---|
| `proc-vehicle-emd-gp9` | EMD GP9 | `unionPacific`, `pennsylvania`, `santaFe` | 17.12 m | 9.45 m (B-B) | about 6,900 |
| `proc-vehicle-emd-sd40-2` | EMD SD40-2 | `burlingtonNorthern`, `conrail`, `unionPacific` | 20.98 m | 12.19 m (C-C) | about 8,900 |
| `proc-vehicle-ge-es44ac` | GE ES44AC | `bnsf`, `unionPacific`, `csx` | 22.30 m | 15.34 m (C-C) | about 11,600 - 11,900 |
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

## The ES44AC in detail (`geEs44ac.ts`)

The ES44AC is drawn by its own module on the kit's helpers (`paintedSweep`,
`decalX`/`decalZ`, `knuckleCoupler`, `US_PALETTE`) and the diesel toolkit's
truck; `usDiesels.ts` keeps `ES44_SPEC` as the kit's ES44 frame for the designs
built on it (the HXN5, the WDG-4G), which are unchanged. Faces are planar
polygons, ear-clipped and split exactly at the paint bands' heights
(`paintedPolygon`), so the nose and cab carry the schemes' boundaries without
hidden faces. Measures (photographs in `assets/ge-es44ac/`, scaled from the
published figures):

- **Wide nose and safety cab**: the face 3.12 m wide to 3.40 m, its upper corners
  cut back, a chamfer to the top (3.58 - 3.62 m) that is 2.8 m wide with long
  edge chamfers; behind it a short slope to the windscreens' foot (3.72 m), the
  two panes raked back 0.2 m to 4.22 m across almost the whole width with a narrow
  post between, the number boards on the band above, the roof at 15 ft 5 in
  (4.70 m) with a chamfered edge. Cab 5.40 - 8.30 m along, nose face at 9.75 m;
  three side windows (front fixed pane, sliding pair under a visor, rear pane),
  the running number under them; a five-chime horn, air conditioner and antennas
  on the roof; the headlight pair one over the other at the top of the face, the
  ditch lights on the platform's front edge, the corner handrails.
- **Long hood**: the dynamic brake box (1.90 - 5.40 m, 2.76 m wide, top 4.60 m)
  overhanging the inverter cabinet behind the cab, two screened grid intakes on
  each side and a roof grille; the engine hood (top 4.45 m) with seven doors a
  side, the engine air intake's screens high on the sides with a roof hatch, the
  exhaust; the radiator (-10.05 to -5.20 m) whose wings flare from the hood side at
  3.35 m out to 3.0 m wide (top 4.62 m) over screened, braced intakes and reach
  0.35 m back over the rear face; two fans; louvred doors under the wings; the
  rear face's headlights under the overhang. The hand brake wheel on the left side
  ahead of the radiator and a ladder up the inverter cabinet on the left.
- **Frame and running gear**: deep sill, pilots with forward-facing corner stairs,
  the GE trucks at 50 ft 4 in centres with a 13 ft 2 in wheelbase and 42 in wheels
  (sand boxes and shock absorbers drawn over the toolkit's frame), the 9.5 m fuel
  tank with sloped ends and two main reservoirs each side.
- **Paint** (measured on BNSF 5824/6156/5871, UP 2539/5304 and CSX 761): BNSF
  Heritage III - orange, the hood's upper part black over a yellow stripe
  (3.38 - 3.60 m), black dynamic brake box and wings, italic BNSF on the hood and
  nose with the black swoosh under it, a black foot band with a yellow stripe along
  the nose and cab, black under the windscreens, a yellow anticlimber, grey fuel
  tank. Union Pacific - armour yellow including the cab sides, harbour mist grey
  roofs, the cab front above the windscreens' foot, the dynamic brake box and the
  wings, each above a red stripe; the winged shield on the nose and the flag on
  the hood behind the cab. CSX YN3 - dark blue, the nose face and the cab front
  to the number boards in yellow, the rear face yellow with blue CSX and number,
  the number's yellow flash on the cab side, a yellow sill stripe.
- **Distant model** (`buildEs44acLod`): the narrow hood, the radiator as wide as
  its wings, the dynamic brake box, the cab with its windscreens and side windows,
  the nose, frame, tank, pilots and both trucks, 100 triangles.

## Liveries

Simplified railroad schemes: colour fields, stripes and the railroad's name in
plain stroke letters; no heralds or logos are drawn (the ES44AC's schemes add their emblems in simple shapes: the UP wings and flag, the BNSF swoosh, the CSX flash). Running
numbers are illustrative numbers in each railroad's series for the class.

| scheme | used on | paint |
|---|---|---|
| Union Pacific | GP9, SD40-2, ES44AC, SD70ACe | armour yellow, a red pinstripe under the grey hood top and cab roof, grey frame and trucks, red sill stripe and lettering |
| Pennsylvania | GP9 | Brunswick green, buff sill stripe and lettering |
| Santa Fe | GP9 | blue hood and cab, yellow ends, yellow lettering |
| BN Cascade | SD40-2 | Cascade green with a black roof and frame, white lettering |
| Conrail | SD40-2 | blue with a white sill stripe and lettering |
| BNSF | SD70ACe (the ES44AC's Heritage III above) | orange, a yellow pinstripe under the black hood top, black frame, yellow sill stripe |
| CSX | ES44AC | YN3: see the ES44AC above |
| Norfolk Southern | SD70ACe | black with white lettering and sill stripe |

## Deviations

- Truck side frames are the diesel toolkit's generic cast frame, not the
  Blomberg, HT-C, HiAd or HTCR castings; steerable trucks are not modelled.
- Radiator fans, dynamic brake housings and the exhaust are placed from
  photographs; hood doors are drawn as seams and latches.
- The ES44AC's trucks are at the 50 ft 4 in bolster centres of GE's AC4400CW
  sheet (the same frame and length; The Diesel Shop's 53 ft would put the leading
  wheels under the pilot steps). Photographs suggest the leading axle somewhat
  further back; the published figure wins.
- The GP9's truck centres are the published 31 ft (The Diesel Shop's data sheet
  gives 40 ft, which would put the trucks at the pilots).

## Checking

`pnpm exec vitest run test/usDiesels.test.ts test/loadingGauge.test.ts` (ids,
liveries and their 16-character titles; every livery within 16,000 triangles,
at its published length, inside the US gauge and wider than the UIC one, without
coplanar faces; trucks at the published centres with their axles and wheels;
exhaust, headlights, couplers, lettering; deterministic bytes; the distant
model). The LODs are also in `test/lod-locos.test.ts`.
