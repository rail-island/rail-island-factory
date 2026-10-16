# Parametric models

**Covers** - designs with enum parameters: how a design declares them, what the export holds (one GLB per design, built with the defaults), how the meta and catalog entries and the standalone JS model expose them, the site's parameter picker, and the tests.
**Code** - `generator/steamLocos.ts` (`UNIT_PARAM`, `CSD433_PARAMS`), `generator/design.ts` (`ParamSpec`, `resolveParams`, `paramCombinations`, `coverageCombinations`), `generator/village.ts` (the village houses' params), `generator/catalog.ts` (`MetaEntry.params`), `generator/jsModel.ts`, `generator/csdCoaches.ts` (`CLASSIC_GREEN_PARAMS`), `generator/bmoCoach.ts` (`BMO_PARAMS`), `generator/cdGreenWhiteCoach.ts` (`GREEN_WHITE_PARAMS`), `generator/wagons.ts` (`NAS_PARAMS`, `UA_PARAMS`, `EAS_PARAMS`), `generator/cd163Family.ts` (`CD163_PARAMS`, `CD263_PARAMS`), `generator/cd150.ts` (`CD150_PARAMS`), `generator/cd110.ts` (`CD110_PARAMS`), `generator/cd130.ts` (`CD130_PARAMS`), `generator/karosa.ts` (`KAROSA_SHORT_PARAMS`, `KAROSA_LONG_PARAMS`), `generator/emu471.ts` (`CD471_PARAMS`), `generator/emu680.ts` (`CD680_PARAMS`), `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `src/catalogQuery.ts` (`effectiveParams`, `isDefaultParams`), `test/params.test.ts`
**See also** - [export.md](export.md), [js-format.md](js-format.md), [csd-coaches.md](csd-coaches.md), [village.md](village.md), [buses.md](buses.md), [steam-locomotives.md](steam-locomotives.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

Some models are variants of one body: the CSD A and CSD B coaches differ only in
their window layout and class numeral. Rather than ship two models, a design can
declare **enum parameters**, each a stable `name`, a `title`, a list of
`{ value, title }` and a `default`. One design id stands for every combination;
the parameter values pick the variant.

Many designs are parametric, among them the locomotives `veh-cd-150`, `veh-cd-163`
and `veh-cd-263` (`livery`, [loco-liveries.md](loco-liveries.md)), `veh-cd-110` and
`veh-cd-130` (`livery`, [cz-electrics.md](cz-electrics.md)),
`veh-csd-classic-green-coach` (below),
`veh-bmo-double-deck-coach` (`livery`: csd, cdBlue, cdBlueGrey, cdRedDoors;
[bmo-double-deck.md](bmo-double-deck.md)), `veh-cd-green-white-coach`
(`variant`: a, ab, b, bee, beel, bds, ds, bdmeer, bdmtee; default b;
[cd-green-white.md](cd-green-white.md)), the three freight wagons with a
`cargo` (default empty; [wagons.md](wagons.md)), and the two Karosa bus families,
`veh-karosa-short` (`variant`: b731, b732, c734, lc735, b931, b931e, b951e) and
`veh-karosa-long` (`variant`: b741, b941, b941e, b961) ([buses.md](buses.md)), the CSD 433.0
(`livery`: black, redLining) and the five steam locomotives with a tender (`unit`: locomotive, the
default, or tender - [steam-locomotives.md](steam-locomotives.md)), and the two Czech electric units,
`veh-cd-471` (`unit`: motorCar, trailer, drivingTrailer; `variant`: cd471, cd675) and `veh-cd-680`
(`unit`: endCar, car683, car685, car686) ([czech-emus.md](czech-emus.md)), and the Czech diesel railcars
`veh-cd-810` (`variant`: cd810, cd812, cd912; `livery`: red, yellowBand, blueWhite, ivoryBand, read by the
810 only), `veh-cd-843` (`unit`: motorCar, drivingTrailer, trailer), `veh-csd-m131` (`unit`: motorCar,
trailer) and `veh-csd-m296` (`variant`: m296, cd853, cd854) ([czech-dmus.md](czech-dmus.md)). The five village houses are
parametric too, with up to six parameters each ([village.md](village.md)). A variant may change more than
paint: the green and white coach's variants have their own lengths and
layouts, and a `unit` value is a different vehicle. The first was `veh-csd-classic-green-coach` with one parameter:

| name | values | default |
|---|---|---|
| `variant` | `classA` (Class A, 1st class, 9 compartments), `classB` (Class B, 2nd class, 10 compartments) | `classA` |

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
    values: [{ value: "classA", title: "Class A (1st class, 9 compartments)" },
             { value: "classB", title: "Class B (2nd class, 10 compartments)" }] },
];
export function csdClassicGreenCoach(params?: ParamValues): MeshBuilder {
  const { variant } = resolveParams(CLASSIC_GREEN_PARAMS, params);
  return yCoach(variant === "classA" ? "A" : "B");
}
```

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
