# German coaches

**Covers** - the three German passenger coach designs transferred from vlakosimdb: the DB n-Wagen (`veh-db-n-wagen`, six vlakosimdb coaches as `variant` x `livery`), the DB Regio double-deck coach (`veh-db-dosto`) and the DR double-deck coach in the Berlin livery (`veh-dr-sbahn-berlin`); their sources, builders, choices, the native comparison and tests.
**Code** - `generator/germanCoaches.ts`, `generator/dbNWagen.ts`, `generator/dbDoubleDeck.ts`, `generator/drDoubleDeck.ts`, `generator/germanCoachParts.ts`, `generator/csdCoachParts.ts`, `test/germanCoaches.test.ts`, `assets/db-n-wagen/`, `assets/db-dosto/`, `assets/dr-sbahn-berlin/`
**See also** - [csd-coaches.md](csd-coaches.md) (the shared `Coach` builder, coordinates, the comparison method), [bmo-double-deck.md](bmo-double-deck.md) (the CSD member of the Goerlitz double-deck family), [parameters.md](parameters.md), [vehicles.md](vehicles.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The designs

All three are rigid (one GLB node), `category: "Rail vehicles"`, `group: "coach"`
(`COACH_CATALOG`), registered as one family in `generate.ts` (`GERMAN_COACHES`), and
far inside the coach budget (about 6,700 to 7,500 triangles). The source revision is
vlakosimdb `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`; all eleven vehicles are by
Karola Meyer.

| id | title | parameters (vlakosimdb) | over buffers | running gear |
|---|---|---|---|---|
| `veh-db-n-wagen` | DB n-Wagen (Silberling) | `variant`: `bn` (default; db_bnvr, db_bnvriv), `abn` (db_abnvr, db_abnvriv), `bdnrf` (db_bdnrf, db_bdnrfiv); `livery`: `vr` (default, verkehrsrot), `iv` (light grey, mint turquoise band) | 26.4 m | bogies 19.0 m apart, 2.5 m wheelbase, 950 mm wheels |
| `veh-db-dosto` | DB Regio Double-Deck Coach | `variant`: `firstClass` (db_ds_re1), `secondClass` (default; db_ds_re2), `drivingTrailer` (db_ds_re2_s) | 26.8 m (driving trailer 27.2 m) | bogies 20.0 m apart, 2.5 m wheelbase, 920 mm wheels |
| `veh-dr-sbahn-berlin` | DR Double-Deck Coach (Berlin S-Bahn livery) | `variant`: `coach` (default; dr_sds_b), `drivingTrailer` (dr_sds_s, the DBmq) | 27.0 m | bogies 20.0 m apart, 2.5 m wheelbase, 900 mm wheels |

- **n-Wagen**: the 26.4 m local-service coach, 2.8 m wide (the XML plan), with two
  double doors, class plates or painted numerals in the piers, the DB logo, seven
  roof vents. `bn` 2nd class (14 windows), `abn` with the five wider-pitched 1st
  class windows between the doors and the yellow 1st class line, `bdnrf` the
  BDnrzf 740 driving trailer: the "Karlsruher Kopf" cab at -X (the XML's x = 0
  end, kept as the source has it) whose plan rounds from 1.05 m to 1.4 m half width
  and whose windscreens lean back on the XML's slope, a cab door, the luggage room's
  four-leaf folding door and a single door. The two liveries repaint one body:
  `vr` red with light grey stripes and doors, `iv` light grey with the mint
  turquoise window band and pastel line, the doors in the bands.
- **DB Regio double-deck coach**: the Goerlitz double-deck coach in DB Regio red:
  the lower deck dropped to 0.5 m between the bogies, single-level end sections,
  the upper deck's windows on its sloped walls, double doors down to the dropped
  floor, class numerals, a destination display. `firstClass` has the 1st class
  upper deck (yellow line, "1" numerals) and the DB logo; `drivingTrailer` the
  angular head of the classes 761/762 at +X with its single large windscreen, and a
  grille panel at the other end.
- **DR double-deck coach**: the Reichsbahn's Goerlitz double-deck single coach in the
  1987 Berlin livery (cream and dark red under a grey upper body in the native
  BMPs): the dropped lower deck, ochre canopies over the doors, the DR emblem's
  wings; `drivingTrailer` the DBmq with its flat two-window cab at -X. vlakosimdb
  names them "DR S-Bahn Berlin"; they are loco-hauled coaches in the S-Bahn's colours,
  not S-Bahn units (the design id keeps vlakosimdb's name).

The source tree names each element: `body/<right|left>-side/window-<n>/frame`,
`.../upper-deck/window-<n>`, `.../door-<n>/outline`, `.../class-signs/sign-<n>`,
`<front|rear>-end/cab/windscreen`, `.../buffers/buffer-<n>`, `running-gear/bogie-<n>`.

## Sources and coordinates

Each folder keeps the native files per vlakosimdb key (`native/<key>/`: `vehicle.xml`,
`index.xml`, the original BMPs) with `landmarks.json` and `baseline.json`, a
`SOURCES.md` (what the XML and BMPs say, dimensions, choices) and a `PHOTOS.md`
(four Commons photographs each, CC BY, CC BY-SA or free use). The conventions are the
CSD coaches' ([csd-coaches.md](csd-coaches.md)): source `(x - centre, y, z)`, `z_dec`
the +Z side, 0.1 m a pixel. The colorize whose `dirs` comes first paints the x = 0
end. The double-deck driving trailer's side texture is its coach's layout two
pixels toward x = 0, so `dbDoubleDeck.ts` works in db_ds_re2 columns and shifts that
body 0.2 m (centre 13.6 m there, 13.4 m in its own canvas).

## How they are built

The bodies are `Volume`s of the shared `Coach` builder (`csdCoachParts.ts`): the XML
section scaled by the plan and clamped by the elevation, painted in bands; panels,
windows, doors, lamps, buffers, couplings and bogies are its primitives.
`germanCoachParts.ts` adds:

- `nosePanel`: a panel on a sloped nose, at each height on the face the clamped top
  sweeps between its stations (or on the end cap below it), kept `edge` metres inside
  the skin's width. The Karlsruher Kopf's windscreens, front panel and display, and the
  double-deck cab's windscreen, display and logo use it.
- `noseTop`: adds a station wherever a sloped nose crosses a paint band's edge, and
  the volume's `trimCaps` drops the end caps of bands clipped away at the tip. Without
  them a band ran on from its last whole station to a 2 mm sliver at the next, a wedge
  standing ahead of the slope, and the clipped bands' caps floated at the tip as
  slivers (the regression test checks every band piece against the XML elevation).
- `dbLogo` (the DB "Keks": frame and letters, with a white field on a white band),
  `sideWindows` (a measured window list) and `skinNumeral` (a numeral that follows the
  skin over a section corner: the upper-deck "1").

## Choices and deviations

- Lengths: the n-Wagen and the DB double-deck coach have their published 26.4 m and
  26.8 m; the double-deck driving trailer 27.2 m (its 26.8 m XML body); the DR coach
  27.0 m on its XML body (0.2 m over the published 26.8 m).
- Widths and heights follow the XML: the n-Wagen 2.8 m (published 2.825 m) and 3.9 m
  (4.05 m), the double-deck coaches 3.0 m (2.78 m, as the Bmo) and 4.6 m.
- Bogie pivots: 19.0 m (n-Wagen, published) and 20.0 m (double-deck; the BMPs paint
  20.2 m); wheel sizes are nominal (950 mm published; 920 and 900 mm assumed).
- Buffers keep the standard 1.75 m spacing; lamps are round lenses; the Karlsruher
  Kopf's lamps stay on its flat tip although the photographic end texture paints them
  on the rounded corners (those landmarks carry a 4.5-pixel tolerance).
- The DR coach keeps the BMPs' grey upper body and roof; the 1997 photograph shows
  them cream.
- Running numbers: the n-Wagen's three are read from Commons file titles; the
  double-deck coaches' are illustrative (all check digits valid).
- Not modelled: small inscriptions, the DR DBmq's grille over its cab windows, brake
  rigging; underframe boxes are generic.

## Measured comparison

Every vlakosimdb vehicle with its own geometry has a comparison (`GERMAN_TRANSFERS`,
measured by `csdCoachComparison.ts`): the three vr n-Wagen (the iv textures paint the
same boxes), the three DB double-deck and the two DR coaches. The boxes are connected
components of the frame pixels, door outlines from their edge and seam columns, and
the end details; tolerances are 1 pixel for windows and doors, 1.5 to 2 for numerals
and lamps, 2.5 for buffers. Mean absolute error over (left, top, width, height), in
percentage points of the canvas (`COMPARISON-*.md` in each folder):

| Vehicle | Boxes | Baseline (pp) | Final (pp) |
|---|---:|---:|---:|
| db_bnvr | 64 | 0.315 | 0.321 |
| db_abnvr | 64 | 0.303 | 0.223 |
| db_bdnrf | 59 | 0.487 | 0.497 |
| db_ds_re1 | 84 | 0.360 | 0.360 |
| db_ds_re2 | 74 | 0.355 | 0.355 |
| db_ds_re2_s | 79 | 0.328 | 0.328 |
| dr_sds_b | 66 | 0.290 | 0.290 |
| dr_sds_s | 69 | 0.239 | 0.239 |

The ABn improved when its painted numerals were drawn at their full 0.7 m height; the
n-Wagen end doors' windows moved 1 cm down off the door's top edge (flicker), the
Bdnrf's windscreen frames 5 mm up off the nose's corner. The largest residuals are
the buffer heads and the end canvases' 1-pixel lamps (one end pixel is 3.3 pp).
Regenerate with `pnpm exec tsx generator/csdCoachReport.ts db_bnvr db_abnvr db_bdnrf
db_ds_re1 db_ds_re2 db_ds_re2_s dr_sds_b dr_sds_s`.

## Tests

`test/germanCoaches.test.ts`: the registration, parameters and their defaults; every
native box within its tolerance; length over buffers, axle positions, wheel size,
gauge and width for every compared vehicle; the n-Wagen's 2.8 m body, window counts
and cab (leaning windscreens, no gangway at the cab, the folding door's four windows);
the liveries repainting one body; the double-deck coaches' dropped floor and deck
window heights; the double-deck cab's bands kept behind the XML slope (the `noseTop`
regression); the DBmq's flat cab; valid running numbers and the triangle budget.
`test/params.test.ts` and `test/models.test.ts` cover every combination (determinism,
no flicker, envelope, GLB/JS agreement).
