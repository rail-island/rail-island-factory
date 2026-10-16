# Faccs hopper wagon source references

**Covers** - provenance, coordinate conversion and reconstruction choices.
**Code** - `generator/freightWagons.ts`, `generator/hopperWagons.ts`, `generator/freightWagonParts.ts`, `generator/freightTransfers.ts`, `native/*/landmarks.json`.
**See also** - [photos](PHOTOS.md), [comparison (cd)](COMPARISON.md), [freight wagons](../../docs/models/freight-wagons.md).

## Original evidence

All native files come from `janproch/vlakosimdb` revision `b170acfe6dbd1e8e6f17dd3bfd19bafa3d2fc94f`, directory `db/train/truck/`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's metadata, Windows-1250), the model `index.xml` (the `simplemodel`), its BMPs and any inline sub-model folder. No `_4x` texture was used or copied.

| native folder | vlakosimdb folder | metadata | parameter |
|---|---|---|---|
| `native/n_faccs/` | `n_faccs` | N_Faccs, 38 t, 90 km/h, author Borek Hudak | `livery=cd` (default) |
| `native/viamont_faccs/` | `viamont_faccs` | Viamont_Faccs, "Viamont Faccs", the same geometry in Viamont yellow; z_dec paints -z and z_inc +z | `livery=viamont` |

`veh-faccs-hopper-wagon` uses procedural surfaces and solid-colour materials; nothing reads a database checkout or a texture at run time.

## Coordinates and reconstruction

Source `(x, y, z)` is Factory `(x - centre, y, z)` in metres; the BMP painted by the sixth colorize direction (z_dec, or z_both) is the right (+Z) side, the fifth the left; the side canvas starts at source x = 0, 0.1 m a pixel. See [freight-wagons.md](../../docs/models/freight-wagons.md) for the shared builder and deviations.

- Centre 6.4 m (buffer heads 0 and 12.8 m); bogies at 2.25 and 10.55 m with a 2.0 m wheelbase (axles 1.25, 3.25, 9.55, 11.55 m).
- The hopper is the XML `box`: its section (|z| 0.3 at 1.2 m out to 1.5 m at 2.5..3.0 m, in to 0.8 m at 4.2 m) and its elevation, which flares outward and is concave, so it is two convex clip solids split at 2.1 m. The top is open over the ballast (native y_dec: grey stones over 2.2..10.6 m).
- Underframe 0.2..12.6 m, 0.9..1.2 m; the two discharge chutes (`unload` 4.4..6.2 and 6.6..8.4 m); the end walls and rails (`zab`, `zab2`), the diagonal braces up to the hopper ends (`zeb`) with their steps (`stairs`).
- The stiffeners at 4.0, 6.2, 6.5 and 8.7 m are laid on the hopper's facets (native columns 40, 62, 65, 87).
- Viamont: a black board with VIAMONT in yellow capitals on the upper side (native z_inc columns 67..98 on +z, z_dec 30..61 on -z); the BMP letters are mixed case, the stroke font paints capitals.

## Running number

`31 54 6990 999-0`: the Faccs on the photograph faccs-suchdol.jpg.

## Photographs

Prototype: the CD Faccs (ex CSD Sas) self-discharging ballast hopper, 12.8 m over buffers, end platforms and discharge chutes under the hopper. Confidence: high. See [PHOTOS.md](PHOTOS.md).

## Measurement record

Each compared `native/<key>/landmarks.json` holds the native pixel-edge boxes with their model scopes, tolerances and uncertainty; `baseline.json` is the measurement of the geometry the boxes were first checked against. The annotations were measured after the geometry had been laid out from the XML and the BMP columns, so baseline and final coincide. The `COMPARISON*.md` files list the normalized errors and the signed residual of every box with the model revision. Liveries that share the default's geometry are not measured apart.
