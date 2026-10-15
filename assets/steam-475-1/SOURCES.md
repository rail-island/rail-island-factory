# CSD 475.1 - sources

**Covers** - the provenance of `veh-csd-475-1`: the vlakosimdb files, the running number, reference photographs.
**Code** - `generator/steamLocos.ts`, `generator/steamComparison.ts`
**See also** - [steam-locomotives.md](../../docs/models/steam-locomotives.md)

## vlakosimdb

From `janproch/vlakosimdb` at revision `b170acf`. Each `native/<key>/` holds the unchanged `vehicle.xml` (the folder's `index.xml`, Windows-1250), the model `index.xml`, the original BMPs (never the `_4x` remasters) and `landmarks.json`, the native pixel boxes of the comparison (`COMPARISON-<key>.md`).

| key | vlakosimdb folder | used for |
|---|---|---|
| `csd_475_179_l` | `db/train/loco/steam/csd_475_179#l` | the locomotive (unit locomotive) |
| `csd_475_179_t` | `db/train/loco/steam/csd_475_179#t` | the tender (unit tender) |

## Dimensions

Class data (cs.wikipedia, Lokomotiva 475.1): 2'D1', 15,250 mm, drivers 1,750 mm, bogie wheels 880 mm, trailing 1,150 mm, cylinders 530 x 680 mm. The vlakosimdb body is 12.8 m and its texture paints about 1.45 m coupled wheels at 1.55 m centres; the model keeps that layout and the wheel size it has room for (a 1.75 m wheel would overlap its neighbour).

## Running number

`475.179`: the unit vlakosimdb names.

## Reference photographs

Wikimedia Commons answered HTTP 429 (rate limited) to every image download from the build environment, so no photograph is stored here yet. The files chosen:

| Commons file | author | licence | use |
|---|---|---|---|
| [475.111Luzna2010.jpg](https://commons.wikimedia.org/wiki/File:475.111Luzna2010.jpg) | Tramvajak14 | CC BY-SA 3.0 | 475.111 in Luzna; deflectors, domes and tender |
