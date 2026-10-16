# CD 810 / 812 / 912 source references

**Covers** - provenance, coordinate conversion, the variants and liveries, dimensions and reconstruction choices of `veh-cd-810`.
**Code** - `generator/dmu810.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/cd_810_1/landmarks.json`.
**See also** - [comparison (810, red)](COMPARISON.md), [photos](PHOTOS.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, one folder each under `native/`:

| folder | vlakosimdb (db/train/dmu/...) | author (index.xml) | model |
|---|---|---|---|
| `native/cd_810_1/` | cd_810#1 (CD 810, 24 t, 155 kW, 80 km/h) | Vojtech Vohlidka | `variant` cd810, `livery` red (the default) |
| `native/cd_810_2/` | cd_810#2 | Vojtech Vohlidka | cd810, yellowBand |
| `native/cd_810_3/` | cd_810#3 | Vojtech Vohlidka | cd810, blueWhite |
| `native/cd_810_4/` | cd_810#4 | Vojtech Vohlidka | cd810, ivoryBand |
| `native/cd_812_613/` | 812/cd_812.613 ("CD Esmeralda", 240 kW) | Borek Hudak | cd812 |
| `native/cd_912_001/` | 812/cd_912.001 ("CD Esmeralda ridici") | Borek Hudak | cd912 |

Each holds `vehicle.xml` (the unchanged Windows-1250 metadata), `index.xml` (the unchanged simplemodel) and the original BMPs (0.1 m a pixel). No 4x texture was used or shipped. db/train/dmu/810/* (the archived 810 #1..#4 and their Baafx / Bix / Bifx trailers) is archived in the game and out of scope.

## Dimensions

- CD 810 (CSD M 152.0): 13,970 mm over the buffers, body 13,103 mm, height 3,500 mm, wheelbase 8,000 mm, wheels 840 mm (cs.wikipedia "Motorovy vuz 810", de.wikipedia "CSD-Baureihe M 152.0", en.wikipedia "CSD Class M 152.0").
- CD 812: 14,470 mm over the buffers, one car rebuilt by Pars nova in 2001 with the Bfbdtanx 792 driving trailer (cs.wikipedia "Motorovy vuz 812"). The 812 / 912 are the concept the 814 / 914 Regionova followed; they are not Regionova themselves.

## Coordinates and reconstruction

- 810: z_dec / z_inc 140 x 40 px on 14 x 4 m, x_both (-X end) and 2x_both (+X end) 30 x 40 px on 3 x 4 m. Source x = column / 10, y = 4 - row / 10. The XML body runs 0.4 to 12.9 m: x is scaled by 13.103 / 12.5 = 1.04824 (`K810`) about the centre 6.65 m; heights and widths are the XML's. The buffers stand 0.43 m off the body to the published 13.97 m.
- 812 / 912: z_dec = z_inc 160 x 60 px on 16 x 6 m, x_both 30 x 60 px (x_dec and x_inc are empty). The XML runs 0 to 15 m over the buffers: x is scaled by 14.47 / 15 (`K812`) about 7.5 m.
- Section (`alongx`), plan (`alongy`) and elevation (`alongz`) as the XML clips them; the 810's end chamfer is eased from 1.0 to 1.25 m half width so the windscreens stay on the body, and its windscreen rake (2.0 to 2.9 m, 0.1 m) carries the panes on a sloped plane under the visor (the XML's second roof clip).
- Axles: the 810's 8.0 m apart (published) on 840 mm wheels; the 812 / 912's at the XML's 3.35 and 11.6 m (7.96 m scaled).

## Running numbers

- red: 810 604-9 (illustrative; M 152.0604 survives in red), yellowBand: 810 225-3 (photographed, PHOTOS.md), blueWhite: 810 472-1 and ivoryBand: 810 509-0 (illustrative numbers in the right series).
- 812 613-8 (photographed), 912 001-5 (vlakosimdb's label, illustrative).
