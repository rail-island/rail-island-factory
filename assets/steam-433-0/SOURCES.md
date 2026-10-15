# CSD 433.0 - sources

**Covers** - the provenance of `veh-csd-433-0`: the vlakosimdb files, the running number, reference photographs.
**Code** - `generator/steamLocos.ts`, `generator/steamComparison.ts`
**See also** - [steam-locomotives.md](../../docs/models/steam-locomotives.md)

## vlakosimdb

From `janproch/vlakosimdb` at revision `b170acf`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's `index.xml`, Windows-1250), the model `index.xml`, the original BMPs (never the `_4x` remasters) and `landmarks.json`, the native pixel boxes of the comparison (`COMPARISON-<key>.md`).

| key | vlakosimdb folder | used for |
|---|---|---|
| `csd_433_0` | `db/train/loco/steam/csd_433_0` | the black livery (default) |
| `csd_433_0_2` | `db/train/loco/steam/csd_433_0#2` | the red-lined livery |
| `csd_433` | `db/train/loco/steam/csd_433` | the same locomotive and texture with a simpler XML body; kept for reference, not a separate design |

## Dimensions

Class data (cs.wikipedia, Lokomotiva 433.0): 1'D1' tank, 12,120 mm over buffers, drivers 1,150 mm, carrying wheels 880 mm, cylinders 480 x 570 mm (crank 285 mm).

## Running number

`433.049`: preserved in the Luzna u Rakovnika railway museum (cs.wikipedia, Lokomotiva 433.0).

## Reference photographs

Wikimedia Commons answered HTTP 429 (rate limited) to every image download from the build environment, so no photograph is stored here yet. The files chosen:

| Commons file | author | licence | use |
|---|---|---|---|
| [Mouchnice - vlak 5.jpg](https://commons.wikimedia.org/wiki/File:Mouchnice_-_vlak_5.jpg) | P.matel | CC BY-SA 3.0 | 433.0 in service; side and three-quarter proportions |
