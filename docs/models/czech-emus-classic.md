# Older Czech electric units

**Covers** - the parametric `veh-cd-451` (CD 451 "zabotlam": motor car, trailer), `veh-cd-460` (CD 460: motor car, trailer; four liveries) and `veh-cd-470` (CD 470 double-deck prototype: motor car, trailer) from vlakosimdb: what each parameter value builds, the shared kit, the scales from the XML to the published dimensions, the measured comparison and the tests.
**Code** - `generator/emu451.ts`, `generator/emu460.ts`, `generator/emu470.ts`, `generator/emuClassicKit.ts`, `generator/emuParts.ts`, `generator/emuComparison.ts`, `generator/emuReport.ts`, `generator/csdCoachParts.ts` (the body builder), `test/czechEmusClassic.test.ts`, `assets/cd-451/`, `assets/cd-460/`, `assets/cd-470/`
**See also** - [czech-emus.md](czech-emus.md) (the CD 471 and 680, the shared EMU parts), [vehicles.md](vehicles.md), [parameters.md](parameters.md), [csd-coaches.md](csd-coaches.md) (the coach builder and the comparison method), [CD 451 sources](../../assets/cd-451/SOURCES.md), [CD 460 sources](../../assets/cd-460/SOURCES.md), [CD 470 sources](../../assets/cd-470/SOURCES.md)

## The designs

As with the CD 471 ([czech-emus.md](czech-emus.md)), a multiple unit is one design
per body and its cars are the values of `unit`. Each car is built on its own,
facing +X - a motor car with its cab at +X - centred between its coupling faces.

| design | parameter | value | vlakosimdb | car |
|---|---|---|---|---|
| `veh-cd-451` "CD 451 Zabotlam" | `unit` | `motorCar` (default) | cd 451/cd_451 | motor car 451: the raked nose with its lamp pods, roof ventilator, one diamond pantograph |
| | | `trailer` | cd 451/cd_051 | trailer 051 |
| `veh-cd-460` "CD 460" | `unit` | `motorCar` (default) | cd 460/cd_460 and its liveries | motor car 460: the leaning windscreen, two diamond pantographs, buffers |
| | | `trailer` | cd 460/cd_060, csd 460/csd_060.045 | trailer, CD class 063 (vlakosimdb "CD 060") |
| | `livery` | `cd` (default) | cd_460, cd_060 | CD grey and blue, 460 071, inner pantograph raised |
| | | `cd003` | cd_460,003-4 (trailer: cd_060) | the same paint, 460 003, inner pantograph raised |
| | | `cd007` | cd_460,007-4 (trailer: cd_060) | the same paint, 460 007, cab pantograph raised |
| | | `csd` | csd_460,045, csd_460,052, csd_060.045 | vlakosimdb's CSD cream and green, 460 045 |
| `veh-cd-470` "CD 470" | `unit` | `motorCar` (default) | cd 470/cd_470 | single-deck motor car 470, dark green and yellow (the set 470 001/002) |
| | | `trailer` | cd 470/cd_070 | double-deck trailer 070 |

The CD 460 liveries are paint and data: one body and layout (the cd BMPs'), the
band colours, the door paint, the emblem, the running number and which of the two
pantographs is raised. vlakosimdb has no trailer for 460 003 and 460 007; those
liveries' trailer wears the cd_060 paint. csd_460,045 and 052 are pixel-identical
(052 raises the other pantograph), so one `csd` value covers both. The cd_060's
+z side BMP is a stray red and cream picture the motor cars list but never paint;
both trailer sides are grey and blue. The [CD 460 sources](../../assets/cd-460/SOURCES.md)
list every file and choice.

| design, car | length over couplings | triangles |
|---|---|---|
| CD 451 motor car, trailer | 24.11 m, 23.53 m | about 7,000 and 4,700 |
| CD 460 motor car, trailer | 24.5 m each | about 7,700 to 8,000 and 5,000 to 5,300 |
| CD 470 motor car, trailer | 26.4 m each | about 7,600 and 6,000 |

## Shared kit (`emuClassicKit.ts`)

- `CarFrame`, `bOf`, `toB`, `polyB`, `sb`: vlakosimdb draws all six cars with the cab (or first end) at low source x; body metres run from the inner end wall, `b = kx * (srcEnd - x)`, so the cab ends at +X. `sb` turns a native side-BMP box into a body box.
- `gangwayEnd`: bellows, the end door, marker lamps and a coupler bar, or side buffers and the screw coupling (czElectricKit's `buffers`) when the end has them.
- `louvre`, `sideEmblem`, `sideNumber`, `frontEmblem`, `frontNumber`, `frontDecal`, `lens`, `emuBogie` (the coach builder's bogie with traction motors).
- The bodies are `Coach` volumes; a cab whose face does not fit a single elevation (the 460's and 470's lower front under the windscreen) is two more volumes, each painted in the front's bands.

## CD 451

The nose is a volume of its own (source x 0.5 to 2.4): the plan rounds it from the
tip to the full width, the elevation rakes the face from the tip at 1.2 m back to
3.3 m and rounds it into the roof, with a station at every band edge so each band's
ring stays on the face. Its bands are the front's: the windscreen is a glass band
that wraps round to the cab side windows. The lamp pods are the XML's `light`
sections swept out of the nose's lower corners. The body behind is blue, light grey
and blue, with a grey panel narrowing the upper blue band over the passenger part,
the machine room's louvres and door behind the cab, red double doors, the luggage
door at the inner end. On the roof the ventilator housing over the saloon and the
raised diamond pantograph over the inner bogie; a Scharfenberg coupler at the cab.
Lengths are scaled to the published 95.29 m of the four-car set (`K_X = 0.9645`);
heights and widths are the XML's.

## CD 460

The body is the XML section at 3.0 m and 4.0 m; the cab is a lower front standing
vertical at source x 0.4 with chamfered corners and, above 1.8 m, the windscreen face
leaning 0.3 m forward to 3.6 m, each its own volume in the front's bands. The front:
two panes, the grille box and the lower grille, a red and a white lamp each side,
the top lamp, buffers at 1.75 m with the screw coupling, the plough. The side: cab
window and door, the luggage double door, single-leaf passenger doors, the grille,
the window row with drop lights; under the motor car the equipment skirt, on its
roof the resistor box, the walkway and two diamond pantographs, one raised. The
trailer has three doors (the centre one double, over a door well down to 0.3 m) and
twelve windows. No scale: five cars of 24.5 m are the published 122.5 m set.

## CD 470

The motor car is single-deck with a low floor between the bogies: its cab is two
volumes (the windscreen raked back over a lower face leaning forward), its body green
with the yellow band, louvres behind the cab and at the inner end, two red doors.
At the inner end the roof rises to the trailer's double-deck profile. Two single-arm
pantographs, the cab one folded and the inner one raised. The trailer is the
double-deck body to 4.7 m with nine upper and seven lower windows between the doors
and the intermediate-level windows over the bogies. Every end has rectangular buffers.
Lengths are scaled to the published 132 m of the five-car set (`K_X = 1.0776`).

## Measured comparison

`emuComparison.ts` measures the default car of each design against native pixel
boxes in `assets/<folder>/native/<key>/landmarks.json` (24 boxes for the 451 motor
car, 23 for the 460, 22 for the 470), orthographically from the GLB's vertices, on the
physical canvas and with the documented length scale undone (`classic()` in
`emuComparison.ts`). `pnpm exec tsx generator/emuReport.ts cd_451 cd_460 cd_470`
writes `COMPARISON.md` in each folder and review views to `export/review/<key>/`. At
the current revision: the 451 motor car 0.98 pp physical, 0.70 pp with the scale
undone; the 460 0.50 pp (no scale); the 470 0.72 and 0.06 pp. The remaining
outliers are documented in the landmark files: the 451's Scharfenberg head (kept at
its real size where the BMP paints the whole draw gear dark), the 460's windscreen
panes (held on the flat face where the BMP wraps them onto the chamfer).

## Tests

`test/czechEmusClassic.test.ts`: every combination stands on the rail, centred,
within 3.1 m, 16,000 triangles and the 4.7 m fixed envelope; the sets' published
lengths (95.29, 122.5 and 132 m) from the cars', the bodies' heights, widths and low
floors, the bogie pivots and wheelbases; the 451's single raised pantograph over the
inner bogie and its coupler at +X; the 460's two pantographs with exactly one raised
(the cab one on 460 007), its leaning windscreen, its buffers at 1.75 m, its liveries
sharing one body; the 470's raised rear and folded cab pantograph, its raised inner
roof, its two rows of trailer windows and buffers at every end; the running numbers'
check digits; and a few landmarks of each default car within their pixel tolerances.
`test/czechEmus.test.ts` checks every landmark of every transferred car;
The catalog sweep (`test/catalogSweep.ts`) covers every design generically.
