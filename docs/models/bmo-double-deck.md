# Bmo double-deck coach

**Covers** - the parametric `veh-bmo-double-deck-coach`: the CSD Bmo and the three CD Bmo liveries from vlakosimdb as values of one `livery` parameter, the shared body, the paint of each livery, running numbers, the measured comparison and tests.
**Code** - `generator/bmoCoach.ts`, `generator/csdCoachParts.ts`, `generator/coachTransfers.ts`, `test/csdCoaches.test.ts`, `assets/bmo-double-deck/`
**See also** - [csd-coaches.md](csd-coaches.md) (the shared builder, coordinates, comparison method), [cd-green-white.md](cd-green-white.md), [parameters.md](parameters.md)

## The design

`veh-bmo-double-deck-coach` ("Bmo Double-Deck Coach") replaces `veh-csd-bmo`,
which was never published to the game. vlakosimdb's csd_bmo and cd_bmo#1..#3
share one XML geometry; only their BMPs differ, so they are one design:

| `livery` | vlakosimdb | paint | running number |
|---|---|---|---|
| `csd` (default) | csd_bmo | dark blue, beige roof, yellow line, yellow emblem wings and "ČSD" | 50 54 26-18 134-1 (photographed) |
| `cdBlue` | cd_bmo#1 | blue, grey roof, grey doors | 50 54 26-18 118-4 (illustrative) |
| `cdBlueGrey` | cd_bmo#2 | grey roof, blue upper band, light grey middle, blue lower band sloping down at the doors, violet trim, blue doors | 50 54 26-18 127-5 (illustrative) |
| `cdRedDoors` | cd_bmo#3 | as cdBlueGrey with red doors (the 2014 photographs) | 50 54 26-18 134-1 (photographed) |

The CD liveries carry a white CD emblem on the x = 0 end section and the number
between the decks. 26.80 m over buffers, 3.09 m wide, 4.61 m high, about 6,500
to 6,800 triangles.

## Body

The XML section (lower deck dropped to 0.2 m between x 6.0 and 20.8, upper deck
walls sloping in above 3.2 m, roof to 4.6 m), six upper and six lower windows,
end windows, double doors with canopies, single-level ends with UIC gangways and
lamps, bogies 19.8 m apart. Changes in this transfer: bolted seams of the
removable roof panels over the ends (native `y_dec` and the photographs) and the
hatch under the end window as its own `hatch` scope.

The CD blue and grey liveries' lower blue on the single-level ends is a decal
(`end panels`): a rectangle to the end and a convex piece down the slope to the
centre's 0.8 m blue band, 2.5 mm above the nominal 1.8 m top so it never shares
a plane with the hatch's edge.

## Measured comparison

Each livery has its own `native/<key>/landmarks.json` (60 boxes; on the CD
liveries the windows were re-detected on their own BMPs where the paint
separates them) and `COMPARISON-<livery>.md`: csd 0.212 pp, cdBlue, cdBlueGrey
and cdRedDoors 0.215 pp mean absolute error.

## Tests

`test/csdCoaches.test.ts`: every livery within its landmark tolerances, length,
axles, section, the dropped floor, the CSD lettering or the CD emblem reading
correctly from outside, check digits, and the four liveries on one body (same
band bounds, the livery materials). `test/params.test.ts` builds every livery.
