# Czech and Slovak coaches

**Covers** - the three parametric coach designs `veh-cd-y-coach`, `veh-zsr-coach` and `veh-uic-z-coach` (fifteen vlakosimdb coaches in later CD and ZSR liveries, and the DB IC and OBB UIC-Z coaches), the shared livery builder, its painted decals, the parameter contract (the UIC-Z `variant` x `operator`), running numbers, the measured comparison and the tests.
**Code** - `generator/liveryCoach.ts`, `generator/cdYCoach.ts`, `generator/zsrCoach.ts`, `generator/uicZCoach.ts`, `generator/czskCoaches.ts`, `generator/coachTransfers.ts`, `test/czskCoaches.test.ts`, `assets/cd-y-coach/`, `assets/zsr-coach/`, `assets/uic-z-coach/`
**See also** - [cd-green-white.md](cd-green-white.md) (the green and white coaches, the blue Bee 001), [csd-coaches.md](csd-coaches.md) (the shared `Coach` builder, coordinates, comparison method), [parameters.md](parameters.md), [vehicles.md](vehicles.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

All three are rigid, one GLB node, `category: "Rail vehicles"`, `group: "coach"`
(`COACH_CATALOG`), registered by `CZSK_COACHES` (`czskCoaches.ts`, one line in
`FAMILIES`). Each value of `variant` is one vlakosimdb vehicle; a value may
change the body as well as the paint (as on the green and white coach).

| design | `variant` | vlakosimdb | body | triangles |
|---|---|---|---|---|
| `veh-cd-y-coach` "CD Y Coach" | `bcc` (default) | cd_bcc | Y 24.5 m, 4.2 m roof | about 6,000 |
| | `beer` | cd_beer | Y 24.5 m | about 6,300 |
| | `bnb` | cd_bnb | Y plan, 4.0 m roof | about 6,100 |
| | `wrrm` | cd_wrrm | 26.4 m (the BDmeer body) | about 6,300 |
| `veh-zsr-coach` "ZSR Coach" | `a`, `ab` | zsr_a, zsr_ab | Y 24.5 m | about 5,800 |
| | `b` (default), `bh` | zsr_b, zsr_bh | Y 24.5 m | about 5,900 |
| | `bds` | zsr_bds | Y with the lookout bay | about 6,000 |
| | `bdmeer`, `wrrm` | zsr_bdmeer, zsr_wrrm | 26.4 m | about 5,900 to 6,100 |
| | `apee` | zsr_apee | Y 24.5 m | about 5,800 |
| `veh-uic-z-coach` "UIC-Z Coach" | `firstClass` | cd_ampz | UIC-Z 26.4 m, 4.0 m flat roof, skirt | about 5,800 |
| | `secondClass` (default) | cd_bmz | UIC-Z 26.4 m | about 5,700 |
| | `restaurant` | cd_wrrmz | UIC-Z 26.9 m (the XML) | about 5,400 |
| | `firstClass` + `operator=db` | db_ic_ampz | UIC-Z 26.4 m | about 5,700 |
| | `secondClass` + `operator=db` | db_ic_bmpz | UIC-Z 26.4 m | about 5,800 |
| | `restaurant` + `operator=db` | db_ic_wrmz | UIC-Z 26.9 m (the XML) | about 5,600 |
| | `firstClass` + `operator=obb` | obb_ampz | UIC-Z 26.4 m | about 5,500 |
| | `secondClass` + `operator=obb` | obb_bmpz | UIC-Z 26.4 m | about 5,500 |
| | `restaurant` + `operator=obb` | obb_wrmz | UIC-Z 26.4 m | about 5,300 |

The blue and white **cd_bee001** is the Bee's texture with blue for its green,
so it is the green and white design's value `beeBlue`
([cd-green-white.md](cd-green-white.md)). Bcc and Beer share the exact XML of
cd_bee; Bnb has a lower roof; the ZSR A, AB, B and Bh are one XML; ZSR BDs,
BDmeer and WRRm are the CD BDs, BDmeer and WRRm bodies. **zsr_apee** is a coarse
file on the same Y body (the brief's "26.4 m" does not hold for it), so it is a
value of `veh-zsr-coach`; its copied lookout bay, painted nowhere, is left out.

Not converted (archived in the game, `rail-island-webapp/db/archived.json`):
cd_a-old, cd_b-old, cd_aee, cd_aeel, cd_bmee, cd_bpb, cd_bt, cd_post, cd_wlab,
cd_wlabmee, zsr_wlab, cd_baafx#1/#3/#4, cd_bix, cd_bifx.

## The UIC-Z parameters

`variant` names the **kind** of coach - `firstClass`, `secondClass`,
`restaurant` - not a class code, because every operator of the body runs one
of each under its own code (CD Ampz / Bmz / WRRmz, DB IC Ampz / Bmpz / WRmz,
OBB Ampz / Bmpz / WRmz). The operators' liveries are the second parameter,
**`operator`**: `cd` (the default), `db` and `obb`, all nine combinations
valid. It came in after `variant` shipped, so every CD combination - and with
it the default build and every saved map's values - keeps its GLB bytes
(pinned by SHA-256 in the tests). `uicZCoach.ts` keeps one spec function per
operator (`cdSpec`, `dbSpec`, `obbSpec`), `UIC_Z_NUMBERS` per operator, and
one body (`body(length)`) for all of them.

The DB IC and OBB vlakosimdb files (author Karola Meyer) draw the same
envelope as the CD one more coarsely - a section down to the rail, no
separate skirt or bogies - so they are built on the CD body with its skirt,
bogies and plug-door steps; only the paint and the openings differ:

- **DB IC** (white, the red stripe at 1.3..1.6 m, grey roof): white doors with
  a narrow window, the stripe across them and a grey foot; class numerals on
  plates beside the toilets; the DB mark as red letters and frame on a white
  plate in the stripe (emblem kind `db`). The Ampz breaks its stripe for a
  white panel and frosts the toilets (the BMP draws them clear, the photograph
  frosted); the WRmz (26.9 m, as the XML) has one passenger door per side at
  opposite ends, the service door opposite as seams only, a white
  "Bordrestaurant" gap in the stripe (no lettering) and two kitchen boxes on
  the roof.
- **OBB** (a dark grey window band between red, a red line under the roof):
  doors in the body's bands, white class numerals with blue pictograms, the
  yellow first class line on the Ampz, a simplified white mark (emblem kind
  `obb`, three slanted bars); the WRmz (26.4 m) has its one door at the front
  end, the kitchen's lower windows at the rear.

## How it is built

`buildLiveryCoach(spec)` (`liveryCoach.ts`) is the data-driven coach of the
later liveries on the `Coach` class of `csdCoachParts.ts`; the green and white
coach keeps its own builder (its GLBs are unchanged). A `LiveryCoachSpec` names:

- the XML body (`BodyGeo`: section, plan, elevation top and bottom, bogie
  centres, the canvas height - 5 m for the 50 px BMPs, 4 m for the UIC-Z ones);
- the horizontal paint bands, the end-wall paint and end door, the end fittings
  (`EndSpec`: gangway, end door and windows, lamp height);
- per side (z_dec right, z_inc left - except cd_bnb, whose colorizes are
  swapped) the windows (clear, frosted, or barred kitchen windows), doors (a
  material, the body's bands or bands of their own), class numerals optionally
  on a plate, the emblem box (the CD emblem of `cd163.ts`, a simplified ZSR
  mark, the DB letters on a plate or a simplified OBB mark), the running number and the **painted areas**.

Painted areas (`Paint`) are boxes or convex outlines in native pixels laid as
one-sided decals on the skin (`skinDecal`), split at the plan stations so each
piece is flat: the ZSR stripes, the yellow first class lines, the Beer's end
panels and wedges, the WRRm and WRRmz diagonals. A decal lies 1.2 mm off the
skin, one layer 1 mm further (the ZSR pale line over its white stripe); the
numerals, seams, door outlines and emblem stand further out, so nothing shares a
plane (the build's coplanar check stays at zero).

The UIC-Z body adds the sloped skirt between the bogies (a second volume tucked
under the floor) and plug-door steps in the skirt recess; its door leaves reach
from 3.2 m down to 0.5 m as on the BMPs.

## Choices and deviations

- Bogies at the published centres (Y 17.1 m, 26.4 m bodies 19.0 m, the 26.9 m
  dining car 19.5 m), 2.5 m wheelbase; buffers at 1.75 m; round tail lamps.
- The WRRmz and the DB WRmz keep the XML's 26.9 m although the real ones are
  26.4 m (the OBB WRmz file is 26.4 m).
- The DB and OBB numbers, the "Bordrestaurant" and operator lettering and the
  OBB pictograms' detail are not modelled beyond flat patches; the OBB mark is
  a simplified shape.
- The Beer's dark blue and red roof ends, small inscriptions, the WRRm's
  window visors and the railways' lettering are not modelled; the WRRm service
  door is seams only.
- Photos show later liveries of the same bodies for most types (the DB ones
  show the BMPs' white and red); the paint follows the native BMPs
  (assets/*/PHOTOS.md).

## Measured comparison

`CZSK_TRANSFERS` lists the twenty-one vehicles (design, parameters, native folder,
buffer midpoint) and joins `ALL_TRANSFERS`, so `csdCoachComparison.ts` and
`csdCoachReport.ts` treat them like the CSD coaches. Each
`assets/<folder>/native/<key>/landmarks.json` holds 42 to 56 boxes: every
window (connected components of the non-paint pixels in the window rows),
door, door window, class marks, emblem, lookout bay windows, the DB and OBB
painted patches and service door seams, and at both ends
the gangway, end door, its windows, lamps and buffer heads. Mean absolute error
over (left, top, width, height) in percentage points (`COMPARISON-<variant>.md`
in each folder; the DB and OBB ones `COMPARISON-db-bmpz.md` and so on):

| Vehicle | Boxes | MAE (pp) | Vehicle | Boxes | MAE (pp) |
|---|---:|---:|---|---:|---:|
| cd_bcc | 52 | 0.251 | zsr_bds | 56 | 0.200 |
| cd_beer | 52 | 0.251 | zsr_bdmeer | 52 | 0.218 |
| cd_bnb | 52 | 0.257 | zsr_wrrm | 42 | 0.270 |
| cd_wrrm | 42 | 0.286 | zsr_apee | 50 | 0.241 |
| zsr_a | 50 | 0.221 | cd_ampz | 54 | 0.235 |
| zsr_ab | 50 | 0.221 | cd_bmz | 54 | 0.235 |
| zsr_b | 52 | 0.213 | cd_wrrmz | 43 | 0.295 |
| zsr_bh | 52 | 0.219 | cd_bee001 (green-white) | 50 | 0.261 |
| db_ic_ampz | 52 | 0.222 | obb_ampz | 52 | 0.243 |
| db_ic_bmpz | 54 | 0.213 | obb_bmpz | 54 | 0.235 |
| db_ic_wrmz | 47 | 0.247 | obb_wrmz | 45 | 0.256 |

The geometry was authored from the same boxes (baseline = final); the largest
residuals are the buffer heads (1.75 m kept), the two-pixel lamps and the
emblems drawn in their own proportions. Regenerate with
`pnpm exec tsx generator/csdCoachReport.ts cd_bcc zsr_a cd_ampz db_ic_bmpz ...`.

## Tests

`test/czskCoaches.test.ts`: registration (family, catalog, references), the
parameter contract and defaults, every combination inside the envelope and budget,
every transfer within its landmark tolerances, the XML length, roof height and
axle positions, valid UIC numbers (54 Czech, 56 Slovak, 80 German, 81
Austrian) with an emblem and a number on both sides, the window and door counts
per variant and operator, the paint materials per livery, the CD UIC-Z GLBs
pinned by SHA-256 under the `operator` parameter, and the blue Bee as the Bee's
layout recoloured.
The catalog sweep (`test/catalogSweep.ts`) covers the generic contract.
