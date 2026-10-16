# DR double-deck coach (Berlin livery) source references

**Covers** - provenance, coordinate conversion, measurements, dimensions and reconstruction choices of the parametric `veh-dr-sbahn-berlin` (two vlakosimdb coaches).
**Code** - `generator/drDoubleDeck.ts`, `generator/germanCoachParts.ts`, `generator/germanCoaches.ts`, `native/<key>/landmarks.json`.
**See also** - [photos](PHOTOS.md), [German coaches](../../docs/models/german-coaches.md), [CSD coaches](../../docs/models/csd-coaches.md), [Bmo double-deck coach](../../docs/models/bmo-double-deck.md) (the same Goerlitz family).

## What the vehicles are

vlakosimdb calls them "DR S-Bahn Berlin" (`dr_sds_b`) and "DR S-Bahn Berlin S" (`dr_sds_s`): the Deutsche Reichsbahn's Goerlitz double-deck single coaches (built from 1974) and their DBmq driving trailer, in the cream and dark red that the DR introduced for Berlin's 750th anniversary in 1987 and also used on the Berlin S-Bahn's DC units (the description of the Calau photograph, PHOTOS.md). They are not S-Bahn units: the double-deck coaches ran in loco-hauled push-pull trains around Berlin. The coach has single-level end sections over the bogies, a double-deck centre between the doors whose lower deck drops between the bogies, and the DR emblem's wings on the side; the DBmq has a flat cab end at x = 0.

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directories `db/train/coach/dr_sds_b/` (`variant=coach`, the default) and `dr_sds_s/` (`variant=drivingTrailer`), both by Karola Meyer. Each `native/<key>/` keeps the unchanged `vehicle.xml` (Windows-1250), the simplemodel `index.xml`, the original BMPs (`x_both`, `x_both1` on the driving trailer, `y_dec`, `z_both`; 0.1 m a pixel), `landmarks.json` and `baseline.json`. No 4x texture was used or copied.

## What the XML says

- The section of the DB double-deck coach (3.0 m wide to 3.4 m, sloped upper walls, cut at the elevation's 4.6 m roof).
- The coach's body from 0.2 to 26.8 m; the DBmq's from 0.3 m (the flat cab end) to 26.8 m. The model adds buffers to 0 and 27.0 m.
- Colorizes: `z_both` both sides along source x; the coach's `x_both` both ends; the DBmq's `x_both` its x = 0 end (the cab), `x_both1` the gangway end.

The model is source `(x - 13.5, y, z)`, so the DBmq's cab is at -X.

## What the BMPs say

- Paint: grey from the roof down to 3.2 m (the upper-deck windows sit in it), dark red 3.0..3.2 m, cream 1.9..3.0 m, dark red below to the floor: 1.0 m at the single-level ends (with a cream line at 1.0..1.1 m), 0.5 m under the dropped centre (columns 59..61 and 207..210).
- Windows (connected components of the frame pixels): six upper-deck windows (rows 11..17) and six lower-deck windows (rows 31..39) at columns 89 + 16k, the end-section windows (rows 22..30; the x = 0 one narrower on the DBmq) and a small frosted one at the far end; the DBmq's two narrow cab side windows (columns 6..16).
- Doors at columns 67..83 and 186..202 (rows 24..44, dark red outlines and an ochre step edge) with two windows each, ochre canopies above them (rows 21..22, columns 61..89 and 180..208), a hatch below an end window, the DR emblem's ochre wings and dark red centre between the upper windows (columns 121..148, rows 23..29).
- Ends: the black gangway field, the end door with two windows, red lamps at columns 2..4 and 24..26 (1.65 m), buffers. The DBmq's cab: two windscreens in a black frame (rows 21..29), the cream band, red over yellow lamps at the outer corners (rows 32..33), a foot step.
- Bogies painted at about 3.4 and 23.6 m.

## Dimensions

From de.wikipedia.org "Doppelstockwagen" and "Bombardier-Doppelstockwagen": the Goerlitz double-deck coaches are 26.8 m long, 4.60 m high and 2,780 mm wide. The model follows the XML body: 27.0 m over buffers (0.2 m longer than published), 4.6 m high, 3.0 m wide; bogies at 3.5 and 23.5 m (20.0 m apart; the BMP paints 20.2 m), 2.5 m wheelbase and 900 mm wheels.

## Choices and deviations

- Colours follow the native BMPs: the grey upper body and roof; the Calau photograph shows them cream in the delivered livery.
- Lamps are round; buffers at the standard 1.75 m spacing; the shared UIC gangway frame is 0.1 m taller each way than the BMP's black field (its landmarks carry a 2-pixel tolerance).
- The DBmq's front keeps the BMP's lamps (outer corners) rather than the photograph's large head lamps over the buffers.
- Running numbers (`DR_DOUBLE_DECK_NUMBERS`) are illustrative UIC numbers with the DR's country code 50 and valid check digits: `50 50 26-17 052-0` and `50 50 86-17 104-6`.

## Photo check

The Calau photograph (PHOTOS.md) confirms the livery split, the DR emblem's wings between the doors, the canopies over the doors, the dropped lower deck and the DBmq's flat two-window cab end; the Lichtenberg photograph shows the trial of the same scheme with a dark red end.
