# TGV source references

**Covers** - provenance, the PSE power car's polygon list and its simplemodel source, coordinate conversion, the cars, the two liveries, dimensions and reconstruction choices of `veh-tgv`.
**Code** - `generator/tgv.ts`, `generator/unitParts.ts`, `generator/csdCoachParts.ts`, `generator/emuParts.ts`, `generator/unitComparison.ts`, `native/tgv_loco/landmarks.json`.
**See also** - [comparison (PSE power car)](COMPARISON.md), [photos](PHOTOS.md), [foreign multiple units](../../docs/models/foreign-units.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/emu/tgv/`:

| folder | vlakosimdb | title (index.xml), author | model |
|---|---|---|---|
| `native/tgv_loco/` | tgv_loco | "TGV Loco", 3240 kW, 280 km/h; Jan Prochazka | powerCar, livery pse |
| `native/tgv_vag1/` | tgv_vag#1 | "TGV Vagon#1"; Jan Prochazka | endCoach, livery pse |
| `native/tgv_vag2/` | tgv_vag#2 | "TGV Vagon#2"; Jan Prochazka | coach, livery pse |
| `native/tgv_at_loco/` | tgv_at_loco | "TGV Atlantique Loco"; Paul Burton | powerCar, livery atlantique |
| `native/tgv_at_ch1/` | tgv_at_ch1 | "TGV Atlantique coach 1"; Paul Burton | endCoach, livery atlantique |
| `native/tgv_at_ch2/` | tgv_at_ch2 | "TGV Atlantique coach 2"; Paul Burton | coach, livery atlantique |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml`, `image.bmp` and the original BMPs, 0.1 m a pixel (power cars 220 x 60 sides, coaches 220 x 50 and 190 x 50). The PSE power car's `index.xml` is a raw `<model>`: a baked polygon list of 200 textured polygons, not a simplemodel. Its shapes are read from the simplemodel `source.xml` beside it (kept here too), which the polygon list was baked from; its `pant1` child (the pantograph, raised and folded as two conditional inlines of one collector) is not kept. The Atlantique power car's `index.xml` is a simplemodel with the same sections, nose and skirts as the PSE's `source.xml`; it differs only on the roof (below). The Atlantique coaches repeat the PSE coaches' XML and layout in another paint.

## Dimensions

- Power car 22.15 m over couplers, 2.814 m wide, 4.10 m high, bogie pivots 14.0 m, bogie wheelbase 3.0 m (fr.wikipedia "TGV Sud-Est": "Empattement M 14,000 m, R 18,700 m", "Empattement du bogie 3,000 m"); 920 mm wheels.
- Trailers 2.904 m wide, 3.42 m high; the end trailers 21.845 m from the coupler to the joint and the intermediate trailers 18.7 m between joints: 2 x 22.15 + 2 x 21.845 + 6 x 18.7 = 200.19 m (the PSE set), with 8 intermediate trailers 237.59 m (the Atlantique's 237.5 m).

## Coordinates and reconstruction

- Power car: source x from the nose tip (0.1 m) to the coupler (22.0 m), stretched by 22.15 / 21.9; body metres `b = 1.0114 * (22.0 - x)`, the nose at +X. Heights are the XML's (the published 4.10 m). Widths scaled by 2.814 / 3.0.
- End coach: source x from its coupler (0) to the joint (21.6 m), stretched by 21.845 / 21.6, its coupler end at +X. Coach: from joint (18.65 m) to joint (0.15 m), stretched by 18.7 / 18.5. Coach heights scaled by 3.42 / 3.6 (0.95), widths by 2.904 / 3.0.
- Section (`alongx`, both clips): the skirt's chamfer from 2.2 m wide at the rail to the wall at 0.9 m, vertical walls to 2.6 m, leaning in to 3.4 / 3.5 m, the roof's shoulders to 4.1 m.
- Power car elevation (`alongz`): the nose cone (tip at 1.3 m, its top to 2.6 m at 2.6 m back), the windscreen's slope to 3.4 m at 3.8 m and 3.6 m at 4.4 m, the roof rising to 3.9 m at 6.2 m and to 4.1 m from 13.2 m; behind that the PSE's pantograph well at 3.7 m from 16.4 m, the Atlantique's raised roof to 18.5 m and 3.9 m behind it. The pointed plan (`alongy`): 0.1 m half width at the tip, 1.0 m at 0.6 m, 1.4 m at 1.8 m, 1.5 m from 2.6 m. Skirts to 0.2 m between and behind the bogies, the plough under the nose.
- Coaches' elevation: the end coach's fairing at 4.1 m by the power car, sloping to 3.6 m at 5.3 m; skirts to 0.2 m between the bogies.
- Paint (side, native rows): PSE: dark orange to 0.9 m, an orange line, white 1.1 to 1.5 m, the grey band to 2.7 m, a white line, light orange to 3.4 m, the grey roof; the nose and cab orange above the white line. Atlantique: silver, a white line, the blue band 1.5 to 2.7 m, a white line, silver, the grey roof; the nose and cab silver.
- Cab side windows, cab door, the PSE's machine-room louvres, the roof grille, the "TGV" lettering (fitted to its native box), the coaches' windows, doors and the end coach's louvred fairing: native pixel boxes.

## Deliberate choices

- The power car's shape follows the livery only on the roof (vlakosimdb's two power cars share the rest); the real Atlantique nose differs in detail.
- One single-arm pantograph, raised, at vlakosimdb's position (19.0 m PSE, 19.5 m Atlantique); vlakosimdb gives each power car one collector.
- Lamps on the nose cone's top after the photographs; the nose BMPs are uniform paint.
- The articulated coaches carry half a Jacobs bogie at each joint (docs/models/foreign-units.md, "How the cars couple"); the end coach's own bogie is at vlakosimdb's 3.05 m from its coupler.
- The cab side windows stay on the cab's vertical wall (columns 38 to 49); the BMP paints them from column 30, on the slope ahead of the wall.

## Measurement record

`native/tgv_loco/landmarks.json` holds 11 native pixel-edge boxes on the PSE power car's side with their model scopes, tolerances, uncertainty and constraints; `baseline.json` is the geometry's measurement when the annotations were fixed. [COMPARISON.md](COMPARISON.md) lists the normalized errors at the model revision; with the length stretch undone the residual is the transfer itself.
