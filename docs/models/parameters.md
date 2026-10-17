# Parametric models

**Covers** - designs with enum parameters: how a design declares them, what the export holds (one GLB per design, built with the defaults), how the meta and catalog entries and the standalone JS model expose them, the site's parameter picker, and the tests.
**Code** - `generator/steamLocos.ts` (`UNIT_PARAM`, `CSD433_PARAMS`), `generator/design.ts` (`ParamSpec`, `resolveParams`, `paramCombinations`, `coverageCombinations`), `generator/village.ts` (the village houses' params), `generator/skyscrapers.ts` (the towers' params), `generator/catalog.ts` (`MetaEntry.params`), `generator/jsModel.ts`, `generator/csdCoaches.ts` (`CLASSIC_GREEN_PARAMS`), `generator/bmoCoach.ts` (`BMO_PARAMS`), `generator/cdGreenWhiteCoach.ts` (`GREEN_WHITE_PARAMS`), `generator/wagons.ts` (`NAS_PARAMS`, `UA_PARAMS`, `EAS_PARAMS`), `generator/cd163Family.ts` (`CD163_PARAMS`, `CD263_PARAMS`), `generator/cd150.ts` (`CD150_PARAMS`), `generator/cd110.ts` (`CD110_PARAMS`), `generator/cd130.ts` (`CD130_PARAMS`), `generator/karosa.ts` (`KAROSA_SHORT_PARAMS`, `KAROSA_LONG_PARAMS`), `generator/emu471.ts` (`CD471_PARAMS`), `generator/emu680.ts` (`CD680_PARAMS`), `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `src/catalogQuery.ts` (`effectiveParams`, `isDefaultParams`), `test/params.test.ts`, `generator/freightWagons.ts` (`SQNS_PARAMS`, `PAO_PARAMS`, `HABIS_PARAMS`), `generator/hopperWagons.ts` (`FACCS_PARAMS`, `FALLS_PARAMS`), `generator/emu451.ts` (`CD451_PARAMS`), `generator/emu460.ts` (`CD460_PARAMS`), `generator/emu470.ts` (`CD470_PARAMS`), `generator/cd704.ts` (`CD704_PARAMS`), `generator/cd742.ts` (`CD742_PARAMS`), `generator/db212.ts` (`DB212_PARAMS`), `generator/cdYCoach.ts` (`CD_Y_PARAMS`), `generator/zsrCoach.ts` (`ZSR_PARAMS`), `generator/uicZCoach.ts` (`UIC_Z_PARAMS`)
**See also** - [export.md](export.md), [js-format.md](js-format.md), [csd-coaches.md](csd-coaches.md), [village.md](village.md), [buses.md](buses.md), [steam-locomotives.md](steam-locomotives.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

Some models are variants of one body: the CSD A and CSD B coaches differ only in
their window layout and class numeral. Rather than ship two models, a design can
declare **enum parameters**, each a stable `name`, a `title`, a list of
`{ value, title }` and a `default`. One design id stands for every combination;
the parameter values pick the variant.

Many designs are parametric. The five village houses carry up to six parameters each
([village.md](village.md)); every parametric vehicle is listed below, its values in
declaration order, the first the default unless noted.

| design | parameters | reference |
|---|---|---|
| `veh-cd-150` | `livery`: cd150, cd151, cd151Cez, zsr350, zsr350No001, zsr350No002, zsr350No003, zsr350No004 | [loco-liveries.md](loco-liveries.md) |
| `veh-cd-163` | `livery`: cd163, cd162, cd162No022, cd163No022, cd163No021, cd362, cd362No054, cd363, cd363No044, cd363No037, cd363No009 | [loco-liveries.md](loco-liveries.md) |
| `veh-cd-230` | `livery`: cd230, cd240, cd240No047, cd340, cd242 | [cd-230.md](cd-230.md) |
| `veh-cd-263` | `livery`: cd263, cd263No015, cd371No002, cd371No005, cd372, db180, dbAg180 | [loco-liveries.md](loco-liveries.md) |
| `veh-csd-classic-green-coach` | `variant`: classA, classB | [csd-coaches.md](csd-coaches.md) |
| `veh-bmo-double-deck-coach` | `livery`: csd, cdBlue, cdBlueGrey, cdRedDoors | [bmo-double-deck.md](bmo-double-deck.md) |
| `veh-cd-green-white-coach` | `variant`: a, ab, b, bee, beel, bds, ds, bdmeer, bdmtee, beeBlue (default b) | [cd-green-white.md](cd-green-white.md) |
| `veh-nas-flat-wagon` | `cargo`: empty, wood, tubes, reels | [wagons.md](wagons.md) |
| `veh-ua-open-wagon` | `cargo`: empty, coal, wood, sand | [wagons.md](wagons.md) |
| `veh-eas-open-wagon` | `cargo`: empty, wood, coal | [wagons.md](wagons.md) |
| `veh-csd-433-0` | `livery`: black, redLining | [steam-locomotives.md](steam-locomotives.md) |
| `veh-csd-475-1` | `unit`: locomotive, tender | [steam-locomotives.md](steam-locomotives.md) |
| `veh-csd-498-1` | `unit`: locomotive, tender | [steam-locomotives.md](steam-locomotives.md) |
| `veh-csd-556-0` | `unit`: locomotive, tender | [steam-locomotives.md](steam-locomotives.md) |
| `veh-csd-636` | `unit`: locomotive, tender | [steam-locomotives.md](steam-locomotives.md) |
| `veh-csd-386` | `unit`: locomotive, tender | [steam-locomotives.md](steam-locomotives.md) |
| `veh-cd-110` | `livery`: cd110, cd111, cd210 | [cz-electrics.md](cz-electrics.md) |
| `veh-cd-130` | `livery`: cd130, cd123, cd123No019 | [cz-electrics.md](cz-electrics.md) |
| `veh-sqns-container-wagon` | `cargo`: empty, maersk | [freight-wagons.md](freight-wagons.md) |
| `veh-pao-flat-wagon` | `cargo`: empty, tubes | [freight-wagons.md](freight-wagons.md) |
| `veh-habis-sliding-wall-wagon` | `livery`: tw1, tw2 | [freight-wagons.md](freight-wagons.md) |
| `veh-faccs-hopper-wagon` | `livery`: cd, viamont | [freight-wagons.md](freight-wagons.md) |
| `veh-falls-hopper-wagon` | `livery`: cd, sd, viamont | [freight-wagons.md](freight-wagons.md) |
| `veh-cd-180` | `livery`: cd180, cd181, cd181Okd, cd182 (default cd181) | [mainline-electrics.md](mainline-electrics.md) |
| `veh-dnt-184-5` | `livery`: dnt1845, dnt1845No1, dnt1845No2 | [mainline-electrics.md](mainline-electrics.md) |
| `veh-db-111` | `livery`: db111, db111Bb, db111S | [mainline-electrics.md](mainline-electrics.md) |
| `veh-dr-243` | `livery`: dr243, db143, db143vr, db112 | [mainline-electrics.md](mainline-electrics.md) |
| `veh-cd-704` | `livery`: cd704, t2380 | [small-diesels.md](small-diesels.md) |
| `veh-cd-742` | `variant`: viamont742, viamont740, cd743 | [small-diesels.md](small-diesels.md) |
| `veh-db-212` | `livery`: oldRed, oceanBlue, trafficRed | [small-diesels.md](small-diesels.md) |
| `veh-karosa-short` | `variant`: b731, b732, c734, lc735, b931, b931e, b951e | [buses.md](buses.md) |
| `veh-karosa-long` | `variant`: b741, b941, b941e, b961 | [buses.md](buses.md) |
| `veh-cd-471` | `unit`: motorCar, trailer, drivingTrailer; `variant`: cd471, cd675 | [czech-emus.md](czech-emus.md) |
| `veh-cd-680` | `unit`: endCar, car683, car685, car686 | [czech-emus.md](czech-emus.md) |
| `veh-cd-750` | `livery`: cd750, cd750No308, cd753, cd754, cd754No013 | [diesel-locos.md](diesel-locos.md) |
| `veh-cd-749` | `livery`: cd749, cd749No264, cd749No121 | [diesel-locos.md](diesel-locos.md) |
| `veh-cd-781` | `livery`: cd781, cd781No462 | [diesel-locos.md](diesel-locos.md) |
| `veh-cd-771` | `livery`: cd771, cd771No235, cd771No421 (default cd771No235) | [diesel-locos.md](diesel-locos.md) |
| `veh-tatra-t3` | `variant`: t3, t3m, t3prototype | [trams.md](trams.md) |
| `veh-tatra-kt8` | `livery`: redWhite, red, modern | [trams.md](trams.md) |
| `veh-metro-81-71` | `unit`: headCar, middleCar | [trams.md](trams.md) |
| `veh-cd-451` | `unit`: motorCar, trailer | [czech-emus-classic.md](czech-emus-classic.md) |
| `veh-cd-460` | `unit`: motorCar, trailer; `livery`: cd, cd003, cd007, csd | [czech-emus-classic.md](czech-emus-classic.md) |
| `veh-cd-470` | `unit`: motorCar, trailer | [czech-emus-classic.md](czech-emus-classic.md) |
| `veh-cd-810` | `livery`: red, yellowBand, blueWhite, ivoryBand | [czech-dmus.md](czech-dmus.md) |
| `veh-cd-812` | `unit`: motorCar, drivingTrailer | [czech-dmus.md](czech-dmus.md) |
| `veh-cd-843` | `unit`: motorCar, drivingTrailer, trailer | [czech-dmus.md](czech-dmus.md) |
| `veh-csd-m131` | `unit`: motorCar, trailer | [czech-dmus.md](czech-dmus.md) |
| `veh-csd-m296` | `variant`: m296, cd853, cd854 | [czech-dmus.md](czech-dmus.md) |
| `veh-db-628` | `unit`: motorCar, bn, abn, bdnrf; `livery`: mint, red | [foreign-units.md](foreign-units.md) |
| `veh-mav-mdmot` | `unit`: motorCar, trailerAx, trailerBx, drivingTrailer | [foreign-units.md](foreign-units.md) |
| `veh-ice-1` | `unit`: powerCar, coach, restaurant | [foreign-units.md](foreign-units.md) |
| `veh-tgv` | `unit`: powerCar, set; `cars`: 1 .. 6, with `unit` set only (default 1); `livery`: pse, atlantique | [foreign-units.md](foreign-units.md) |
| `veh-cd-y-coach` | `variant`: bcc, beer, bnb, wrrm | [czsk-coaches.md](czsk-coaches.md) |
| `veh-zsr-coach` | `variant`: a, ab, b, bh, bds, bdmeer, wrrm, apee (default b) | [czsk-coaches.md](czsk-coaches.md) |
| `veh-uic-z-coach` | `variant`: firstClass, secondClass, restaurant (default secondClass); `operator`: cd, db, obb | [czsk-coaches.md](czsk-coaches.md) |
| `veh-db-dosto` | `variant`: firstClass, secondClass, drivingTrailer (default secondClass) | [german-coaches.md](german-coaches.md) |
| `veh-dr-sbahn-berlin` | `variant`: coach, drivingTrailer | [german-coaches.md](german-coaches.md) |

A variant may change more than
paint: the green and white coach's variants have their own lengths and
layouts, and a `unit` value is a different vehicle. The first was `veh-csd-classic-green-coach` with one parameter:

| name | values | default |
|---|---|---|
| `variant` | `classA` (Class A, 1st class, 9 compartments), `classB` (Class B, 2nd class, 10 compartments) | `classA` |

The ten skyscrapers are also parametric: `size`, `glazing` and `structure`
offer 60 combinations per tower. Twisting Tower adds `twist` (180 combinations);
Terraced Green Tower adds `terraces` and `terraceUse` (720 combinations).
See [skyscrapers.md](skyscrapers.md).

## Declaring parameters

A `ProceduralDesign` (`design.ts`) carries `params?: readonly ParamSpec[]`, and
its `build(params?)` receives the chosen values. The build resolves them with
`resolveParams(specs, given)`: a missing name takes its default, and an unknown
name or a value the enum does not list throws, so a typo never silently builds
the default. `paramCombinations(specs)` lists every combination, the defaults
first; the tests build each one.

```ts
export const CLASSIC_GREEN_PARAMS: readonly ParamSpec[] = [
  { name: "variant", title: "Variant", default: "classA",
    values: [{ value: "classA", title: "Class A" },
             { value: "classB", title: "Class B" }] },
];
export function csdClassicGreenCoach(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(CLASSIC_GREEN_PARAMS, params);
  return yCoach(variant === "classA" ? "A" : "B");
}
```

A parameter may apply to some values of an earlier one only: `when: { name,
values }` (the TGV's `cars`, `when: { name: "unit", values: ["set"] }`). Where the
condition fails the parameter is absent - `resolveParams` drops it (a value given
for it is ignored), `paramCombinations` does not vary it, the site hides its
picker and it is no part of a reference key - so the power car keeps its keys.

A value a design no longer offers can be **retired** rather than dropped:
`retired: { <value>: { <name>: <value>, ... } }` on its parameter maps it to the
values that replace it (the TGV's `unit: coach` and `unit: endCoach` to `{ unit:
set, cars: 1 }`). `resolveParams` reads a retired value as its replacement; it is
in no list, combination or picker. The game resolves a saved map's old key the same
way, without rewriting it.

**Titles are short labels**, because the game shows every value as a button:
at most 16 characters, unique within their parameter, no explanations,
dimensions or source names - "Power car", "Trailer set", "TGV Atlantique",
"CD 163 021", "Logs". A livery is named either by its operator and number or by
its colour, not both. `test/params.test.ts` enforces the length and uniqueness.
A title is display text only: changing it never affects a saved map.

Names are lower camel case (`variant`), values are alphanumeric tokens
(`classA`). Both are contract: a saved map may store them, so treat them like
model ids and never rename a shipped one. A parameter needs at least two values.

## What the export holds

- **One GLB, thumbnail and source tree per design**, built with every parameter at
  its default (`build()` with no argument). There are no per-variant files.
- **The meta entry** (`vehicles.meta.json`, `skyscrapers.meta.json`) and the
  site's `catalog.json` record carry `params`, a copy of the specs. A fixed
  design's entry has no `params` key at all, so its entry is unchanged.
- **The standalone JS model** (`js/<id>.js`) exports `params` (the same specs,
  `[]` for a fixed design) beside its default `build(THREE, params)`, which builds
  any combination: `build(THREE)` is the GLB's model, `build(THREE, { variant: "classB" })`
  the other variant. An invalid value throws.

```js
import build, { params } from "./veh-csd-classic-green-coach.js";
import * as THREE from "three";
scene.add(build(THREE, { variant: "classB" }));
```

The game app can list `params` from the meta entry in its own UI and build a
chosen variant through the JS model; the factory does not publish to the game
(AGENTS.md), so that consumer side is a separate step.

## The site

A parametric model's page shows a **Parameters** block above the side panel's
tabs: one `<select>` per parameter, its default marked. At the defaults the
preview is the GLB. Any other choice is built in the browser by the model's JS
module, fetched once per model and imported from a blob URL, with only the
three.js classes it needs (`ModelViewer.tsx`); the camera keeps its place while
only the parameters change. The thumbnail, the spec list and the source tree
describe the default build, so the Source tab's highlight and picking pause
while another value is chosen. The choice is in the URL as `?p.<name>=<value>`
(only values that differ from the default), so a variant can be linked; an
unknown name or value falls back to the default (`effectiveParams`).

## Tests

**Finish parameters.** A design may name some parameters in `finishParams`:
ones that only recolour it (the village houses' roof and wall colours). They
are ordinary parameters everywhere else; the tests build
`coverageCombinations(params, finishParams)` - every combination of the other
parameters at the default finish, then each other finish value on the default
shape - instead of the full product. A design without `finishParams` is tested
on every combination.

`test/params.test.ts` checks the resolution and enumeration rules, that every
parametric design's enums are well formed, that the meta entries list exactly
the declared parameters, and, for every covered combination of every parametric design:
deterministic GLB bytes, no coplanar overlaps, the rail envelope and budget, and
that the JS model's `build(THREE, combination)` draws the generator's triangles.
`test/catalogQuery.test.ts` covers the URL round trip and the site's fallback to
defaults; `test/csdCoaches.test.ts` the classic coach's two window layouts and
its measured comparison per variant.

The former Nas tram load and Pao Karosa bus load are intentionally omitted. Legacy IDs map to their corresponding empty wagon with scale multiplier 1.

## Low level of detail

Every standalone JS model accepts `build(THREE, params, lod = false)`. Set the third
argument to `true` for its budgeted distant mesh. The factory detail view exposes
this through **Low level of detail** and reports the preview triangle count.
LOD rig posing is static; full-detail GLBs and source trees are unchanged.
See [lod.md](lod.md) for budgets, geometry and verification.
