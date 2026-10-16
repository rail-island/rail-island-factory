# CD green and white coaches

**Covers** - the parametric `veh-cd-green-white-coach`: the nine CD green and white coaches transferred from vlakosimdb (cd_a, cd_ab, cd_b, cd_bee, cd_beel, cd_bds, cd_ds, cd_bdmeer, cd_bdmtee) and the blue and white Bee (cd_bee001) as values of one `variant` parameter, their bodies, per-side layouts, paint, running numbers, deviations, the measured comparison and tests.
**Code** - `generator/cdGreenWhiteCoach.ts`, `generator/csdCoachParts.ts`, `generator/coachTransfers.ts`, `test/csdCoaches.test.ts`, `assets/cd-green-white/`
**See also** - [csd-coaches.md](csd-coaches.md) (the shared builder, coordinates, comparison method), [bmo-double-deck.md](bmo-double-deck.md), [parameters.md](parameters.md), [the vlakosimdb-transfer skill](../../.agents/skills/vlakosimdb-transfer/SKILL.md)

## The design

`veh-cd-green-white-coach` ("CD Green-White Coach"), rigid, one GLB node,
`category: "Rail vehicles"`, `group: "coach"`. One parameter:

| `variant` | vlakosimdb | body | what it is | triangles |
|---|---|---|---|---|
| `a` | cd_a | Y 24.5 m | 1st class, 9 compartments, two toilets, the yellow 1st class line | about 6,100 |
| `ab` | cd_ab | Y 24.5 m | 1st and 2nd class, 9 compartments, the yellow line over the 1st class half, yellow class numerals | about 6,100 |
| `b` (default) | cd_b | Y 24.5 m | 2nd class, 10 compartments | about 6,100 |
| `bee` | cd_bee | Y 24.5 m | modernised B, grey roof, red end doors | about 6,200 |
| `beel` | cd_beel | Y 24.5 m | air-conditioned, khaki-grey roof with two roof units, low entrances, banded ends, red end doors | about 6,000 |
| `bds` | cd_bds | Y 24.5 m | 2nd class with a luggage compartment: a lookout bay and a double luggage door | about 6,200 |
| `ds` | cd_ds | Y 24.5 m | luggage van: lookout bay, two double luggage doors, four small windows | about 6,100 |
| `bdmeer` | cd_bdmeer | 26.4 m | open coach with a luggage double door, low entrances at the very ends | about 6,100 |
| `bdmtee` | cd_bdmtee | 26.4 m | open coach, two double doors set in from the ends (the CSD Bdmtee body) | about 6,500 |
| `beeBlue` | cd_bee001 | Y 24.5 m | the Bee in blue and white: vlakosimdb's CD Bee 001 is the Bee's texture with blue for its green (pixel for pixel), so it is the `bee` layout with the `green` material in blue | about 6,100 |

All ten are 3.09 m wide at most, wheels on y = 0, buffers at 1.0 m, standard
1.75 m buffer spacing, Goerlitz-style bogies 2.5 m wheelbase (Y: 17.1 m apart;
26.4 m bodies: 19.0 m apart).

## How it is built

`cdGreenWhiteCoach(params)` reads one `VariantSpec`: the body (`BODIES.y`,
`bdmeer`, `bdmtee`, each the XML section, plan and elevation), the roof colour,
the optional yellow line and class numerals, the end wall and end door paint,
the lamp height, the optional lookout bay, the XML roof ventilators and
underframe boxes, and a `SideSpec` per side: windows (frosted where the native
glass is white), doors (`green` passenger leaves, `bands` luggage doors), the
white class numerals ("1" on the A, "2" on the others, drawn over the
native 3 by 5 pixel marks beside the toilets and doors) and the emblem box. The right side is `z_dec`, the left
`z_inc`, each as measured; they are not mirrored copies.

The paint is three bands - white 0.9..1.9 m, green 1.9..3.2 m, roof above - plus
decals (the yellow line, the white class numerals, the CD emblem from `cd163.ts` and the
running number). Everything else - panels, windows with sash bars, doors,
gangways, lamps, buffers, couplings, bogies - comes from the shared `Coach`
builder ([csd-coaches.md](csd-coaches.md)).

## Choices and deviations

- The BDs/Ds lookout bay reaches 1.525 m from the centreline (XML 1.6 m) to stay
  inside the 3.1 m envelope.
- The Ds's left (`z_inc`) BMP is drawn about two pixels toward x = 0; its windows
  and doors follow it, the lookout bay stays at the XML position.
- Beel and BDmeer get two steps under their low entrances; Bdmtee keeps the
  CSD Bdmtee's aprons and step boards under its centre doors.
- Lamps are round lenses; small inscriptions are not modelled.
- Running numbers (`GREEN_WHITE_NUMBERS`): Bdmtee's is photographed, the
  others are illustrative UIC numbers of each type with valid check digits
  ([source notes](../../assets/cd-green-white/SOURCES.md)).
- Photographs: only four reused files (Bdmtee in this livery, a Goerlitz Va
  bogie under a BDs); new downloads were blocked by the network policy
  ([PHOTOS.md](../../assets/cd-green-white/PHOTOS.md)).

## Measured comparison

`assets/cd-green-white/native/cd_<variant>/landmarks.json` holds 455 native
boxes (46 to 58 per variant): every window, door outline, door window, the class
plates, lookout bay windows on both sides, and the gangway, end door, lamps and
buffers at both ends. Windows, door windows and class marks were found as connected
components of the window-frame pixels; door outlines were read from the seam
columns. Mean absolute error over (left, top, width, height), in percentage
points of the canvas (`COMPARISON-<variant>.md`):

| Variant | Boxes | Baseline (pp) | Final (pp) |
|---|---:|---:|---:|
| a | 48 | 0.230 | 0.255 |
| ab | 46 | 0.240 | 0.240 |
| b | 50 | 0.241 | 0.261 |
| bee | 50 | 0.241 | 0.261 |
| beel | 50 | 0.241 | 0.261 |
| bds | 54 | 0.204 | 0.223 |
| ds | 49 | 0.237 | 0.237 |
| bdmeer | 50 | 0.221 | 0.240 |
| bdmtee | 58 | 0.190 | 0.207 |
| beeBlue (cd_bee001) | 50 | 0.261 | 0.261 |

The geometry was authored from the same boxes. The baseline drew the class marks
as plates filling their boxes; the final draws them as numerals, which are
narrower and a little shorter than the marks, hence the small increase; the largest residuals are the buffer heads (1.75 m spacing kept)
and the 2-pixel lamps; the A's "1" is narrower than its 3-pixel mark (its
rows carry a 1.5-pixel tolerance). Regenerate with
`pnpm exec tsx generator/csdCoachReport.ts cd_a cd_ab ...`.

## Tests

`test/csdCoaches.test.ts`: every variant within its landmark tolerances, the
XML length and axles, section height and width, the CD emblem reading correctly
from outside and the running number on both sides, valid check digits, and the
variant list (window counts, the lookout bay only on BDs and Ds, an invalid value
rejected), and the class marks drawn as white numerals (the "1" reading from
outside on the A), not blank plates. `test/params.test.ts` builds every variant (determinism, no flicker,
envelope, budget, GLB/JS agreement).
