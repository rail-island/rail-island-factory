# CSD M 131.1 Hurvinek source references

**Covers** - provenance, coordinate conversion, the two cars, dimensions and reconstruction choices of `veh-csd-m131`.
**Code** - `generator/dmuM131.ts`, `generator/dmuKit.ts`, `generator/dmuComparison.ts`, `native/csd_m131/landmarks.json`.
**See also** - [comparison (M 131.1)](COMPARISON.md), [photos](PHOTOS.md), [Czech diesel railcars](../../docs/models/czech-dmus.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`:

| folder | vlakosimdb (db/train/dmu/...) | author (index.xml) | `unit` |
|---|---|---|---|
| `native/csd_m131/` | m131/csd_m131 (M 131, 25 t, 155 kW, 80 km/h) | Borek Hudak | motorCar (default) |
| `native/csd_m031/` | m131/csd_m031 (M 031, 15 t, unpowered) | Borek Hudak | trailer |

Each holds `vehicle.xml`, `index.xml` (unchanged) and the original BMPs (0.1 m a pixel).

## Dimensions

CSD M 131.1 (Tatra, 1948-56, 549 built): 12,100 mm over the buffers, 16.6 t (cs.wikipedia "Motorovy vuz M 131.1"). The two-axle trailers that ran with them were the Blm / Clm coaches; vlakosimdb's "M 031" is the M 131 body without the engine, kept as its `unit`.

## Coordinates and reconstruction

- z_both 140 x 50 px on 14 x 5 m, x_both 30 x 50 px. Source x = column / 10, y = 5 - row / 10. The XML runs 0.1 to 11.6 m over the buffers: x is scaled by 12.1 / 11.5 = 1.05217 (`K131`) about 5.85 m.
- Section, plan (both ends rounding in to 1.8 m) and elevation as the XML clips them, except the +X end's full-width plan station, moved from 9.4 to 9.85 m so the +X door does not straddle it (the BMP's door sits on the full-width side).
- The end doors stand 0.1 m proud (XML `dve`, 0.9 to 2.3 m), carried up to 2.75 m where the BMP frames them; the roof radiator (XML `str`, 2.6 to 9.0 m) runs to 9.5 m as the BMP draws it.
- Axles at the XML's 2.3 and 9.0 m (7.05 m apart scaled, 0.35 m off centre, as vlakosimdb has them); 900 mm wheels with leaf springs.

## Running numbers

M 131.1238 (preserved at Luzna u Rakovnika, PHOTOS.md) in the pre-1988 Kryspin designation; the trailer shows vlakosimdb's label, M 031.001 (illustrative).
