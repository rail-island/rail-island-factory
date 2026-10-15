# CSD 498.1 - sources

**Covers** - the provenance of `veh-csd-498-1`: the vlakosimdb files, the running number, reference photographs.
**Code** - `generator/steamLocos.ts`, `generator/steamComparison.ts`
**See also** - [steam-locomotives.md](../../docs/models/steam-locomotives.md)

## vlakosimdb

From `janproch/vlakosimdb` at revision `b170acf`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's `index.xml`, Windows-1250), the model `index.xml`, the original BMPs (never the `_4x` remasters) and `landmarks.json`, the native pixel boxes of the comparison (`COMPARISON-<key>.md`).

| key | vlakosimdb folder | used for |
|---|---|---|
| `csd_498_1` | `db/train/loco/steam/csd_498_1` | the locomotive (its texture also paints a tender, not used) |
| `csd_498_1_t` | `db/train/loco/steam/csd_498_1#t` | the tender |

## Dimensions

Class data (cs.wikipedia, Lokomotiva 498.1): 2'D1', drivers 1,830 mm, bogie wheels 880 mm, trailing 1,150 mm, cylinders 500 x 680 mm. The vlakosimdb chimney reaches 5.0 m and is lowered to the repository's 4.7 m envelope.

## Running number

`498.106`: kept by the National Technical Museum (cs.wikipedia, Lokomotiva 498.1).

## Reference photographs

Wikimedia Commons answered HTTP 429 (rate limited) to every image download from the build environment, so no photograph is stored here yet. The files chosen:

| Commons file | author | licence | use |
|---|---|---|---|
| [Skoda 498104 01.jpg](https://commons.wikimedia.org/wiki/File:Skoda_498104_01.jpg) | Herbert Ortner | CC BY 3.0 | 498.104; front, deflectors and running board |
