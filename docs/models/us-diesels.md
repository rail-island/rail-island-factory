# North American diesel locomotives

**Covers** - the four North American hood units (`proc-vehicle-emd-gp9`, `proc-vehicle-emd-sd40-2`, `proc-vehicle-ge-es44ac`, `proc-vehicle-emd-sd70ace`): their measures, liveries, the shared hood unit kit, the distant model, deviations and the tests.
**Code** - `generator/usDiesels.ts` (`US_DIESELS`), `generator/usGp9.ts`, `generator/usSd40.ts`, `generator/geEs44ac.ts`, `generator/sd70ace.ts`, `generator/usHoodKit.ts`, `generator/loadingGauge.ts`, `test/usDiesels.test.ts`, `assets/emd-gp9/`, `assets/emd-sd40-2/`, `assets/ge-es44ac/`, `assets/emd-sd70ace/`
**See also** - [loading-gauge.md](loading-gauge.md), [diesel-locos.md](diesel-locos.md), [vehicles.md](vehicles.md), [openttd-figures.md](openttd-figures.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

| id | title | `livery` values (default first) | over couplers | truck centres | triangles |
|---|---|---|---|---|---|
| `proc-vehicle-emd-gp9` | EMD GP9 | `unionPacific`, `pennsylvania`, `santaFe` | 17.12 m | 9.45 m (B-B) | about 8,700 - 8,900 |
| `proc-vehicle-emd-sd40-2` | EMD SD40-2 | `burlingtonNorthern`, `conrail`, `unionPacific` | 20.98 m | 13.26 m (C-C) | about 14,350 - 14,650 |
| `proc-vehicle-ge-es44ac` | GE ES44AC | `bnsf`, `unionPacific`, `csx` | 22.30 m | 15.34 m (C-C) | about 13,800 - 14,100 |
| `proc-vehicle-emd-sd70ace` | EMD SD70ACe | `unionPacific`, `norfolkSouthern`, `bnsf` | 22.63 m | 14.58 m (C-C) | about 12,600 |

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
| dynamic brakes | blister over the engine (PRR, Santa Fe) | grille and two fans mid-hood | box behind the cab | tall box behind the filter cabinet, grid hatch on its roof |
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

## The ES44AC in detail (`geEs44ac.ts`)

The ES44AC is drawn by its own module on the kit's helpers (`paintedSweep`,
`decalX`/`decalZ`, `knuckleCoupler`, `US_PALETTE`) and the diesel toolkit's
truck; `usDiesels.ts` keeps `ES44_SPEC` as the kit's ES44 frame for the designs
built on it (the HXN5, the WDG-4G), which are unchanged. Faces are planar
polygons, ear-clipped and split exactly at the paint bands' heights
(`paintedPolygon`), so the nose and cab carry the schemes' boundaries without
hidden faces. Measures (photographs in `assets/ge-es44ac/`, scaled from the
published figures):

- **Wide nose and safety cab**: a hipped nose (UP 2539 head-on, BNSF 6156 and
  5824): the face 3.12 m wide, a pentagon 3.22 m high at its corners rising to a
  ridge at 3.56 m on the centre line; two large planes fall from the ridge and the
  windscreens' foot (3.70 m) down to the side walls, whose top edge climbs from the
  face's corner back to 3.45 m at the cab. The two panes raked back 0.2 m to
  4.26 m across almost the whole width with a narrow post between, the number boards on the band above, the roof at 15 ft 5 in
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
  the GE trucks at 50 ft 4 in centres with a 13 ft 2 in wheelbase and 42 in wheels:
  GE's Hi-Ad side frame cast outside the toolkit's (`hiAdCasting`: a top chord at
  0.95 m humped over the axles, an opening round each axle box with a spring each
  side, deep bellies between the axles, a sand box, dampers to the frame, the
  motors and bolster dark in the gap under the sill); the 9.5 m fuel tank with
  rounded lower edges and sloped ends, its upper part set in behind the two long
  silver main reservoirs each side.
- **Paint** (measured on BNSF 5824/6156/5871, UP 2539/5304 and CSX 761): BNSF
  Heritage III - orange, the hood's upper part black over a yellow stripe
  (3.38 - 3.60 m), black dynamic brake box and wings, italic BNSF on the hood and
  nose with the black swoosh under it, a black foot band with a yellow stripe along
  the nose and cab, the nose's hip planes orange with a black strip along the windscreens' foot, deepest at the corners, the headlights 0.1 m off the
  centre line beside the nose door's round window, a yellow anticlimber, grey fuel
  tank, grimy tan-grey trucks as photographed. Union Pacific - armour yellow including the cab sides, harbour mist grey
  roofs, the cab front above the windscreens' foot, the dynamic brake box and the
  wings, each above a red stripe; the winged shield on the nose and the flag on
  the hood behind the cab. CSX YN3 - dark blue, the nose face and the cab front
  to the number boards in yellow, the rear face yellow with blue CSX and number,
  the number's yellow flash on the cab side, a yellow sill stripe.
- **Distant model** (`buildEs44acLod`): the narrow hood, the radiator as wide as
  its wings, the dynamic brake box, the cab with its windscreens and side windows,
  the nose, frame, tank, pilots and both trucks, 100 triangles.

## The SD70ACe (`sd70ace.ts`)

Measured on photographs of the class (`assets/emd-sd70ace/SOURCES.md`; a projective fit
over the axles of a near side-on photo for positions between the trucks, height ratios
on head-on and three-quarter photos) within the published length, truck centres and
wheelbase, wheels, height and cab width:

| part | x (m, +X the cab end) | heights (m) |
|---|---|---|
| front platform; snowplough pilot with ribs, cut-outs and the coupler pocket, air hoses and MU jumpers, step wells | 9.95 - 10.78 | deck 1.72, sill 1.42 |
| wide nose: a flat front panel 1.5 m wide, angled facets either side setting back 0.35 m to the 2.76 m wide sides, a bevel over the front, chamfered top edges | 8.85 - 9.95 | front edge 3.42, top 3.78 |
| isolated cab: raked windscreens, chamfered corners, brow with number boards | 6.45 - 8.85 | windscreens 3.92 - 4.50, roof 4.80 |
| inertial filter cabinet (louvred intakes) | 2.85 - 6.45 | 4.58 |
| dynamic brake box (grid hatch, side grilles) | 1.0 - 2.85 | 4.78 |
| engine hood (exhaust, five-chime horn) | -2.66 - 1.0 | 4.22 |
| radiator: flared wings with sloped cores, two 1.4 m fans | -8.3 - -2.66 | 4.78, 3.12 m wide |
| rear cabinet: louvres, tall grille, small fan | -10.22 - -8.3 | 4.78 |
| fuel tank (bevelled), main reservoirs over it | -4.1 - 4.35 | 0.34 - 1.04 |

The nose and the cab's front are convex hulls of a few corner points (`hullSolid`), every
face cut at the livery's band heights; paint on the nose's front (`nosePoly`, `noseText`) folds
over the panel and its facets. The HTSC trucks are drawn here (`htscTruck`): a deep cast side
frame hiding the wheels' upper halves, spring pockets over the axle boxes, end dampers, sand
boxes with pipes to the rail, tread brake units, secondary springs and traction motors. Each cab side has the three-pane sash group under an
awning right behind the windscreen; the left side also a small pane behind it; doors in
the cab's rear wall open onto the side walkways. The headlights are in the brow between
the number boards (UP, NS) or on the nose (BNSF); ditch lights low on the nose's corners.
Its distant model (`sd70aceLod`, 100 triangles) has shells for the radiator, the hood
and cabinet, the cab and the nose, the dynamic brake as a box, frame, tank, pilots and trucks.


## Liveries

Simplified railroad schemes: colour fields, stripes and the railroad's name in
plain stroke letters; no nose "wings" are drawn on the hood units, and heralds only on the SD40-2
(simplified BN herald, Conrail wheel, Union Pacific shield); the ES44AC's and SD70ACe's schemes add their emblems in simple shapes (the UP wings and flag, the BNSF swoosh, the CSX flash, the NS speed lines). Running
numbers are illustrative numbers in each railroad's series for the class.

| scheme | used on | paint |
|---|---|---|
| Union Pacific | GP9, SD40-2, ES44AC, SD70ACe | armour yellow, a red pinstripe under the grey hood top and cab roof, grey frame and trucks, red sill stripe and lettering (the GP9's own: the stripe 1.9 m over the deck with 0.7 m of grey above, as on UP 211; the SD40-2: grey top 0.8 m deep, grey cab front above the stripe, the shield on the nose); on the SD70ACe the pinstripe at the cab's window sill (3.76 m) all along, grey above, the winged shield on the nose |
| Pennsylvania | GP9 | Brunswick green all over, buff lettering spaced wide, safety-yellow end rails, no sill stripe (PRR 7048, 7000) |
| Santa Fe | GP9 | blue, yellow hood end faces, a yellow stripe along the hoods and cab, yellow sill, yellow lettering (ATSF 2879) |
| BN Cascade | SD40-2 | Cascade green, the hood top black 1 m deep over the grilles, black cab roof, frame and pilot, the white BN herald and name on the cab, the number on the long hood |
| Conrail | SD40-2 | all blue with black trucks and tank, the white wheel-and-rails emblem on the long hood, CONRAIL on the hood and the nose, the number on the cab |
| BNSF | SD70ACe (the ES44AC's Heritage III above) | orange, a yellow pinstripe under the black hood top, black frame, yellow sill stripe; on the SD70ACe Heritage III: yellow-black-yellow pinstripes at 3.5 m swooping down behind the cab to the walkway and across the nose, BNSF across the nose over a black line |
| CSX | ES44AC | YN3: see the ES44AC above |
| Norfolk Southern | SD70ACe | black, white stripes across the nose and its sides, the NS speed lines and name on the hood, a grey brow, white sill stripe, yellow end rails |

## Deviations

- The SD70ACe's truck centres are the published 47 ft 10 in; a photograph fitted with
  both end sills suggests about 13.3 m, which is not used.
- Truck side frames are the diesel toolkit's generic cast frame, not the
  makers' castings (the GP9 draws its Blomberg B, the SD40-2 its HT-C casting, the ES44AC GE's Hi-Ad casting, the SD70ACe its HTSC casting); steerable trucks are not modelled.
- The GP9 schemes leave out the heralds (UP shield, Santa Fe cross) and UP 211's later
  winterization hatch; the long hood's louvre layout is UP 211's on every scheme, and both
  sides are drawn alike.
- Radiator fans, dynamic brake housings and the exhaust are placed from
  photographs; hood doors are drawn as seams and latches.
- The SD40-2's truck centres are 43 ft 6 in between the bolsters (Wikipedia, the
  Conrail Historical Society); The Diesel Shop's 40 ft does not fit the photographs.
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
