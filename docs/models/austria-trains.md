# Austria's trains

**Covers** - the twenty Austrian designs and how they were made: the OBB Railjet, Talent 4024, Cityjet 4744, 4020, Transalpin 4010, 5047, Desiro 5022, the WESTbahn KISS, the Mariazellerbahn's Himmelstreppe, the CityShuttle double-deck coach and the Nightjet; the 1116 Taurus, 1144, 1142, 1110, 1189 Krokodil, 2016 Hercules, 2043, the Mariazellerbahn's 1099 and the BBO 214 steam engine. The registries, the shared tables they fill and their tests.
**Code** - `generator/atUnits.ts` (`AT_UNITS`), `generator/atLocos.ts` (`AT_LOCOS`), one module per vehicle (`generator/at*.ts`, listed in the two family docs), `test/worldTrainsSuite.ts`, `test/catalogCache.ts` (`KIT_FAMILY_MODULES`)
**See also** - [austria-units.md](austria-units.md), [austria-locos.md](austria-locos.md), [germany-trains.md](germany-trains.md) (the same pass for Germany), [switzerland-trains.md](switzerland-trains.md), [mainline-electrics.md](mainline-electrics.md) (the OBB 1012 and 1040)

The catalog already had the OBB 1012 and 1040 and the Vectron; none is repeated here.
Every design is filed under Austria (`generator/factTable.ts`) and starts as a draft
(docs/site/workshop.md). Each was built from at least three Commons photographs in
`assets/<name>/`, measured in px/m against published figures, and checked against them
in at least three render-and-compare rounds (the detailed-vehicle skill).

## The designs

| id | title | module | details |
|---|---|---|---|
| `proc-vehicle-obb-railjet` | OBB Railjet | `atRailjet.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-4024` | OBB 4024 Talent | `atObb4024.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-4744` | OBB 4744 Cityjet | `atObb4744.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-4020` | OBB 4020 | `atObb4020.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-4010` | OBB 4010 Transalpin | `atObb4010.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-5047` | OBB 5047 | `atObb5047.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-5022` | OBB 5022 Desiro | `atObb5022.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-westbahn-kiss` | WESTbahn KISS | `atWestbahnKiss.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-noevog-himmelstreppe` | Himmelstreppe | `atHimmelstreppe.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-cityshuttle-dd` | OBB CityShuttle double-deck coach | `atCityShuttle.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-nightjet` | OBB Nightjet | `atNightjet.ts` | [austria-units.md](austria-units.md) |
| `proc-vehicle-obb-1116` | OBB 1116 Taurus | `atObb1116.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-1144` | OBB 1144 | `atObb1144.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-1142` | OBB 1142 | `atObb1142.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-1110` | OBB 1110 | `atObb1110.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-1189` | OBB 1189 Krokodil | `atObb1189.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-2016` | OBB 2016 Hercules | `atObb2016.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-2043` | OBB 2043 | `atObb2043.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-obb-1099` | OBB 1099 | `atObb1099.ts` | [austria-locos.md](austria-locos.md) |
| `proc-vehicle-bbo-214` | BBO 214 | `atBbo214.ts` | [austria-locos.md](austria-locos.md) |

## The registries

Each registry imports its vehicles' designs and re-exports every design's build and LOD
functions under their own names: the standalone JS model (`generator/jsModel.ts`
`bundleDesign`) imports them from the design's source module, which for these designs is
the registry. Both registries are kit-family modules (`test/catalogCache.ts`
`KIT_FAMILY_MODULES`): the catalog sweep and the door suite run in full on each module's
first design, and `test/worldTrainsSuite.ts` runs its data checks on every design
(z-fighting, emitters, gauge, budget, length, doors, LOD, country). Its `LENGTHS` table
holds each single vehicle's length over buffers, and its `COUNTRY` prefixes `obb`,
`westbahn`, `noevog` and `bbo` map to Austria.

## Kit changes

Every kit change was additive and proven byte-identical for every other design
(`.agents/skills/detailed-vehicle/scripts/hash.mts`):

- `generator/strokeFont.ts` gained the lower-case `c`, `g`, `h`, `j` and `p` (the Railjet,
  Nightjet and Himmelstreppe lettering); a missing glyph threw before, so no design used them.
- `generator/shinkansen.ts` / `generator/usTransit.ts`: a livery's `endCarDoorsEach`
  (car field `doorBandsEach`) paints an end car's door leaves one by one (WESTbahn KISS).
- `generator/sliceBody.ts` `sliceCabin`: the cabin's width comes only from slices that
  reach its floor, so a door in a double-deck well no longer collapses it (CityShuttle).
