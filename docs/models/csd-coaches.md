# CSD coaches

**Covers** - the nine CSD passenger coaches and vans transferred from vlakosimdb, as seven CSD designs (CSD A and B are one parametric model) plus the CSD livery of the Bmo double-deck coach: their sources and photographs, the shared coach builder, running numbers, the per-coach choices and deviations, the native-raster comparison and its tests.
**Code** - `generator/csdCoaches.ts`, `generator/csdCoachParts.ts`, `generator/coachTransfers.ts`, `generator/strokeFont.ts`, `generator/csdCoachComparison.ts`, `generator/csdCoachReport.ts`, `test/csdCoaches.test.ts`, `assets/csd-*/`
**See also** - [vehicles.md](vehicles.md), [bmo-double-deck.md](bmo-double-deck.md), [cd-green-white.md](cd-green-white.md), [parameters.md](parameters.md), [skyscrapers.md](skyscrapers.md) ("Flicker"), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md), [the railroad-vehicle skill](../../.agents/skills/railroad-vehicle/SKILL.md)

## The designs

Every model comes from the vlakosimdb folder `db/train/coach/csd_<name>` at
revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`. The titles are vlakosimdb's,
except that CSD A and CSD B, one body with two window layouts, are the single
parametric design `veh-csd-classic-green-coach` ("CSD Classic Green Coach",
parameter `variant` = `classA` (default) or `classB`; [parameters.md](parameters.md)).
All are rigid, one GLB node, `category: "Rail vehicles"`, `group: "coach"`
(`COACH_CATALOG`), and stay far inside the 25,000-triangle rail budget.
`CSD_COACHES` lists the seven CSD designs. The Bmo is now the parametric
`veh-bmo-double-deck-coach` ([bmo-double-deck.md](bmo-double-deck.md); its
`csd` livery is vlakosimdb csd_bmo), built by `bmoCoach.ts`, and the CD green
and white coaches are `veh-cd-green-white-coach` ([cd-green-white.md](cd-green-white.md)).
`COACH_TRANSFERS` (`coachTransfers.ts`) lists every transferred
vlakosimdb vehicles (each with its design, parameters, native folder and centre).

| id | title | what it is | over buffers | running gear | triangles |
|---|---|---|---|---|---|
| `veh-csd-classic-green-coach` | CSD Classic Green Coach | Y-type corridor coach, green with a yellow cant line and grey roof: two toilets, drop-light sash bars, end doors and UIC gangways; `variant=classA` nine 1st class compartments (vlakosimdb CSD A), `classB` ten 2nd class (CSD B) | 24.50 m | bogies 17.10 m apart, 2.50 m wheelbase | about 5,900 (classA) |
| `veh-csd-balm` | CSD Balm | railcar trailer with rounded ends, cream over red with a grey moulding, wrap-round cab windows, two side doors and a deep cream skirt between the bogies | 19.10 m | bogies 12.70 m apart, 2.10 m wheelbase | about 6,200 |
| `veh-csd-bam` | CSD Bam | 22 m trailer coach, red with a cream window band and grey roof, twelve windows, end doors with steps and short end gangways | 22.20 m | bogies 14.80 m apart, 2.80 m wheelbase | about 5,700 |
| `veh-csd-bdmtee` | CSD Bdmtee | 26.4 m green commuter coach with two pairs of double doors set in from the ends and seven roof ventilators | 26.40 m | bogies 19.00 m apart, 2.50 m wheelbase | about 6,200 |
| `veh-csd-be31` | CSD Be31 | two-axle coach with narrower enclosed end vestibules (side and end doors), seven windows and a toilet | 15.50 m | two axles 9.40 m apart, leaf springs | about 3,900 |
| `veh-csd-bi20` | CSD Bi20 | short two-axle compartment coach: a door to each of six compartments, brass window frames, open end platforms with railings and side steps | 12.60 m | two axles 7.90 m apart, a queen-post truss | about 3,700 |
| `veh-bmo-double-deck-coach` (`livery=csd`) | Bmo Double-Deck Coach | blue and beige double-deck coach (see [bmo-double-deck.md](bmo-double-deck.md)): a lower deck dropped to 0.2 m between the bogies, six upper and six lower windows, double doors with canopies, single-level ends, yellow emblem wings | 26.80 m | bogies 19.80 m apart, 2.50 m wheelbase | about 6,400 |
| `veh-csd-dsk` | CSD Dsk | two-axle planked luggage van: framing posts and diagonal braces, a large sliding door, lookout duckets and an open platform at the +X end | 10.50 m | two axles 6.20 m apart | about 3,200 |

The source tree names every element: `body/<right|left>-side/window-<n>/frame`,
`.../door-<n>/outline`, `<front|rear>-end/buffers/buffer-<n>`, `running-gear/bogie-<n>`
and so on. Each coach carries its references (`assets/csd-<name>/`, the classic
coach `assets/csd-classic-green/`), shown on the model page's Images tab.

## Photographs

Each folder holds freely licensed Wikimedia Commons photographs (CC BY or CC BY-SA,
at most 1600 px) listed with author, licence and what they show in its
`PHOTOS.md`; each `SOURCES.md` has a "Photo check" section. The photographs
confirmed, among others, the Balm's cream skirt and lining, the green Y coach's
centre inscription and the Bmo's dropped centre. They also caught one mismatch:
the Balm and Bam door leaves are cream above and red below (as the native BMPs
paint them too), not one colour; the leaves now follow the body's bands. Be31,
Bi20 and Dsk have no photograph of their own type: Be31 keeps close-ups of the
similar Ce 3-2252 (the ventilator hoods over its windows, now modelled), Bi20 a
Prussian compartment coach as a type reference (the footboard under the doors,
now modelled), and Dsk a similar CSD luggage van. Most photographs show later
liveries; the colours follow the native BMPs.

## Sources and coordinates

`assets/csd-<name>/native/` (`assets/csd-classic-green/native/csd_a/` and `csd_b/`) keeps the unchanged originals: `vehicle.xml` (the
vehicle metadata, Windows-1250), `index.xml` (the simplemodel with its `alongx`,
`alongy` and `alongz` clip polygons, colorizes and baked polygons), and the
original BMPs. The AI-remastered `*_4x.png` textures are not copied and never
measured; the one for CSD A even paints "2" where the native BMP has the
first-class "1".

A simplemodel shape is the intersection of its clip polygons extruded along the
three axes: `alongx` is the cross section (z across, y up), `alongy` the plan
(x along, z across) and `alongz` the side elevation (x along, y up). Every
texture is mapped at 0.1 m a pixel (side BMPs 250 x 50 for 25 x 5 m and so on;
end BMPs 30 px for 3 m). A face takes the texture of the colorize whose
direction opposes its outward normal, so `z_dec` paints the source +z side,
`z_inc` the -z side, `x_dec` the x = 0 end and `x_inc` the far end; `z_both` and
`x_both` paint both. In every case the texture's u follows increasing source x
(or z), so the -z elevation is a mirror image of what an observer outside sees.

The Factory model is source `(x - centre, y, z)`: no axis is flipped, so
`z_dec` is the right (+Z) side and the source x = 0 end is the rear (-X).
`centre` is the midpoint between the buffer heads (`COACH_TRANSFERS` lists it).

## The builder

`csdCoachParts.ts` holds the `Coach` class every transferred coach shares (the CSD
designs, the Bmo and the CD green and white coach).

- **Volumes.** A `Volume` is an XML section, scaled across by the plan's half
  width at each station and clamped by the elevation's top and bottom: the
  Y-coaches' ends taper 3.0 to 2.8 m and drop their roof 0.2 m, the Balm's ends
  round in plan and slope down to a 1.9 m nose tip, the Bmo's floor drops from
  0.9 m to 0.2 m between the bogies. Each paint band of the section is one open
  sweep per station segment, closed only by end-cap slabs. Be31 (main body,
  narrower vestibules, roof), Bi20 (compartments, roof, platforms) and Dsk (van,
  roof, platform) are several volumes.
- **Panels.** `sidePanel` lays a box from a side BMP on the skin, split at plan
  stations and section corners, so windows follow tapered ends and the Bmo's
  sloped upper wall. `endPanel` lays a box from an end BMP on the end cap and on
  the plan's end facets (the Balm's wrap-round windows). Windows are a frame
  slab with a thin glass layer in front (and an optional sash bar); doors are a
  dark seam with a thin leaf layer.
- **Flicker rules.** Internal band boundaries sit 2.5 mm above their nominal
  heights, end-wall paint is inset 2.5 mm, and a panel edge that would meet the
  body's own edge is pulled 5 mm inside it; layered slabs never share a wall
  plane. The build's coplanar check stays at zero overlaps.
- **Running gear.** `bogie()` draws two wheelsets (wheels with discs, treads on
  y = 0, inner tread faces at 0.665 m), axle boxes, side frames with coil
  springs and a bolster; `axle()` draws a two-axle coach's wheelset in W-irons
  with a leaf spring. `buffers()` and `coupling()` draw the end gear.
- **Markings.** `numeral()` lays the class numerals and `inscription()` lines of
  text in the stroke font of `strokeFont.ts` (digits, the hyphen and the letters
  the coaches need, the C with a caron among them) as one-sided decals that read
  left to right from outside on both sides; `handrail()` stands a grab rail off
  the skin. A door's leaf can take the body's paint bands (`door(..., "bands")`).

## Running numbers

Every coach carries "CSD" (with the caron) over its running number on both
sides, centred where its native BMP has the inscription, in yellow
(`RUNNING_NUMBERS` in `csdCoaches.ts`):

| Coach | Number | Source |
|---|---|---|
| classA | 51 54 19-41 068-0 | Commons description of a photographed A coach |
| classB | 51 54 20-41 866-4 | photograph; the blurred serial digit is the reading the check digit confirms |
| Balm | 70 54 28-05 676-0 | photograph of a Balm in the original livery |
| Bam | Bam 5159 | photograph (older national numbering) |
| Bdmtee | 50 54 22-44 268-9 | photograph (a later Bdmtee275 rebuild of the type) |
| Bmo | 50 54 26-18 134-1 | photograph (now Bmto292); the large "CSD" sits between the emblem wings |
| Be31 | Be 2-4157 | illustrative, no photograph of the type |
| Bi20 | Bi 3-1820 | illustrative, no photograph of the type |
| Dsk | Dsk 4-1210 | illustrative, in the format of the photographed van Ddk 6-3777 |

The 12-digit UIC numbers carry a check digit (`uicCheckDigit`: weights 2, 1, 2,
... from the right over the first eleven digits, digit sums, the difference to
the next multiple of ten), which the tests verify; the older national numbers
(class, district digit, serial) have none.

## Choices and deviations

- **Buffers** keep the standard 1.75 m spacing, heads at the XML buffer planes
  (y = 1.0 m; 0.9 m on the Balm). The coarse end BMPs put the heads 2.0 to
  2.1 m apart; their annotations carry a 2.5-pixel tolerance for that.
- **Lamps** are round 0.2 m lenses (red tail lamps on A, B, Bdmtee; white with a
  red centre on Bmo; white on the railcar trailers and Be31) where the BMPs paint
  1 to 3 pixel patches.
- **Wheels** are 0.90 m on the bogie coaches and Be31/Bi20 (0.84 m on Balm and
  Bam, whose bodies sit lower, 0.80 m on the Dsk). The XML wheels are flat
  boxes; the radii follow the native side textures and the body floors.
- **Balm cab windows** keep to the facets behind the 0.1 m sloped nose tip
  (|z| from 0.62 m) instead of starting at 0.5 m, so no glass floats ahead of the
  XML nose; about one pixel narrower than the end BMP.
- **Bi20** has no buffers in its XML: the model adds standard buffers 0.3 m
  beyond each platform. Its platforms are a floor frame with three side steps
  each (the steps the native side BMP paints on the XML's solid block).
- **Dsk** lookout duckets stop at 1.535 m from the centreline, not the XML's
  1.6 m, to keep the van inside the repository's 3.1 m width envelope. Its
  platform step box is drawn as two steps, as the side BMP shows.
- **Bi20 footboards** run under the compartment doors at 0.94..0.98 m and
  1.54 m from the centreline (the native side's dark line, the photographed
  compartment coach); **Be31 window hoods** follow native rows 7..8.
- **Not modelled**: the smaller inscriptions (the native textures do not resolve
  them), the Bmo's monogram as a drawn emblem (its "CSD" is lettering), roof
  ribs, and brake rigging. Underframe boxes follow the XML elevation, 2.0 to 2.3 m wide.

## Measured comparison

Each transfer's `landmarks.json` (in its native folder) records the native boxes: pixel edges
`[left, top, right, bottom]`, the view and side or end, the model scopes, a
tolerance and an uncertainty. There are 392 boxes over the nine coaches: every
window frame, door, door window and hatch on both sides, and the end doors,
gangway frames, cab windows, lamps and buffer heads at both ends.
`csdCoachComparison.ts` projects the actual GLB vertices of those scopes onto
the same canvases (side u = 10 * source x, end u = 10 * (z + 1.5) at the rear and
10 * (1.5 - z) at the front, v = 10 * (canvas height - y)) and reports left, top,
width and height as percentages of the canvas.

Its `baseline.json` is the first authored geometry's measurement; the classic
coach's two variants are measured separately, built with `variant=classA` and
`variant=classB`. The
geometry was authored from the same measured boxes, so the residuals measure
the transfer onto the XML bodies and the deliberate choices above, not
photographic accuracy. Mean absolute error over (left, top, width, height):

| Coach | Boxes | Baseline (pp) | Final (pp) |
|---|---:|---:|---:|
| A (classic, classA) | 46 | 0.240 | 0.240 |
| B (classic, classB) | 48 | 0.230 | 0.230 |
| Balm | 44 | 0.442 | 0.442 |
| Bam | 48 | 0.419 | 0.419 |
| Bdmtee | 56 | 0.197 | 0.197 |
| Be31 | 36 | 0.524 | 0.524 |
| Bi20 | 32 | 0.215 | 0.215 |
| Bmo | 60 | 0.212 | 0.212 |
| Dsk | 22 | 0.446 | 0.403 |

The largest residuals are the buffer heads (the 1.75 m spacing) and the 1-pixel
lamps; the Dsk improvement is its lookout glass refitted to columns 83..86.
Each coach's `COMPARISON.md` (the classic coach's `COMPARISON-class-a.md` and
`COMPARISON-class-b.md`) lists every box with its signed deltas and the model
revision. Regenerate them, with annotated orthographic views and a shaded
three-quarter view under `export/review/<key>/`, by
`pnpm exec tsx generator/csdCoachReport.ts [csd_a ...]` (refresh a baseline only
when its annotations change).

## Tests

`test/csdCoaches.test.ts` checks, for every coach: each native box within its
tolerance; the length over buffers and the axle positions from the XML; wheels
on y = 0 at standard gauge; the XML section's height and width; the Bmo's
dropped floor; the Balm's rounded plan; that class numerals and the "CSD" and
running-number inscriptions read correctly from outside on both sides; valid UIC
check digits; the Balm and Bam two-tone door leaves; and the classic coach's two
variants (11 and 12 side windows, an invalid variant rejected).
`test/params.test.ts` covers every parameter combination. `test/models.test.ts` covers the shared contract
(envelope, budget, determinism, source tree, GLB/JS agreement, no flicker).
