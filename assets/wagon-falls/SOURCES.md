# Falls hopper wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison (cd)](COMPARISON.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_falls/` | `n_falls` | N_Falls, 37 t, 90 km/h, author Borek Hudak | `livery=cd` (default) |
| `native/sd_falls/` | `sd_falls` | SD_Falls, the same geometry, green and grey | `livery=sd` |
| `native/viamont_falls/` | `viamont_falls` | Viamont_Falls, the same geometry, grey and black; its z_dec paints -z and z_inc +z | `livery=viamont` |

`veh-falls-hopper-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 6.75 m (buffer heads 0 and 13.5 m, XML `nar`); the body 0.3..12.7 m is centred on 6.5 m with the brake platform 12.7..13.2 m beyond it; bogies at 2.45 and 10.55 m with a 2.0 m wheelbase (axles 1.45, 3.45, 9.55, 11.55 m).
- The lower body is two XML `base` halves 0.4..6.1 and 6.9..12.6 m (0.9..2.9 m, |z| 1.5) either side of the centre post; the upper bulge (`box`) 3.0..4.3 m overhangs to 0.1..12.9 m. The top is open over a coal load (native y_dec).
- The ladder and railing at the +x end (`stairs`, `zab`); x_dec paints the -x end, x_inc the +x end.
- Liveries: CD brown; SD green upper bulge with grey lower panels and the green triangle; Viamont grey and black with VIAMONT and VADS.

## Running number

`31 54 6687 815-6`: the Falls on the photographs falls-ostrava-01/02.jpg; every livery carries it.

## Photographs

Prototype: the CD Falls self-discharging coal hopper (ex CSD Wap, group 11), with the brake platform at one end; the SD livery is Severoceske doly's, the Viamont one the private carrier's. Confidence: high. See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
