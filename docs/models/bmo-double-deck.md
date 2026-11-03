# Bmo double-deck coach

**Covers** - the parametric `veh-bmo-double-deck-coach`: the CSD Bmo and the three CD Bmo liveries from vlakosimdb and CD's current blue (Najbrt) from photographs as values of one `livery` parameter, the shared body, the paint of each livery, running numbers, the measured comparison and tests.
**Code** - `generator/bmoCoach.ts`, `generator/csdCoachParts.ts`, `generator/coachTransfers.ts`, `test/csdCoaches.test.ts`, `assets/bmo-double-deck/`
**See also** - [csd-coaches.md](csd-coaches.md) (the shared builder, coordinates, comparison method), [cd-green-white.md](cd-green-white.md), [parameters.md](parameters.md)

## The design

`veh-bmo-double-deck-coach` ("Bmo Double-Deck Coach") replaces `veh-csd-bmo`,
which was never published to the game. vlakosimdb's csd_bmo and cd_bmo#1..#3
share one XML geometry; only their BMPs differ, so they are one design (CD's
current blue, read from photographs, is a fifth value on the same body):

| `livery` | vlakosimdb | paint | running number |
|---|---|---|---|
| `csd` (default) | csd_bmo | dark blue, beige roof, yellow line, yellow emblem wings and "ČSD" | 50 54 26-18 134-1 (photographed) |
| `cdBlue` | cd_bmo#1 | blue, grey roof, grey doors | 50 54 26-18 118-4 (illustrative) |
| `cdBlueGrey` | cd_bmo#2 | grey roof, blue upper band, light grey middle, blue lower band sloping down at the doors, violet trim, blue doors | 50 54 26-18 127-5 (illustrative) |
| `cdRedDoors` | cd_bmo#3 | as cdBlueGrey with red doors (the 2014 photographs) | 50 54 26-18 134-1 (photographed) |
| `cdNajbrt` "CD Najbrt blue" | - (photographs) | CD's current blue: navy foot under the dropped centre, white to a navy line at 2.2 m, light blue over the upper deck to a white line at 4.0 m, navy roof; navy doors, light blue canopies; the navy emblem and "Ceske drahy" on the end section, white "2" after each door | 50 54 26-18 109-3 (photographed) |

The vlakosimdb CD liveries carry a white CD emblem on the x = 0 end section and the number
between the decks. 26.80 m over buffers, 3.09 m wide, 4.61 m high, about 6,500
to 6,800 triangles (7,400 in the Najbrt blue, the wordmarks).

`cdNajbrt` came in after the four vlakosimdb liveries: their GLBs are unchanged
(pinned in the tests). Its paint and markings follow
[the source notes](../../assets/bmo-double-deck/SOURCES.md) ("CD Najbrt blue"): the
logo group (`najbrtMarkings`) stands on the end section at the reader's left of each
side, the number under the lower deck's windows; the hatch is white. `cdBlue`
remains vlakosimdb's older all-blue paint.

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

`test/csdCoaches.test.ts`: every vlakosimdb livery within its landmark tolerances, length,
axles, section, the dropped floor, the CSD lettering or the CD emblem reading
correctly from outside, check digits, the five liveries on one body (same
band bounds, the livery materials), and the Najbrt blue (bands, navy doors, the
logo group at the reader's left on both sides, white numerals) with the other
four liveries pinned by hash. The catalog sweep (`test/catalogSweep.ts`) builds the defaults and a fixed sample of the other combinations (every one with `TEST_ALL_VARIANTS=1`, [../guide/setup-and-build.md](../guide/setup-and-build.md)).
