# Towers
**Covers** - the eight models in the webapp's Towers group, their parameters, scale conversion and source attribution.
**Code** - `generator/towers.ts`, `generator/towerParts.ts`, `generator/generate.ts`, `test/towers.test.ts`, `assets/tower-*/`
**See also** - [parameters.md](parameters.md), [export.md](export.md), [reproductions.md](reproductions.md)

## Catalog and geometry

All eight existing `tower-*` identifiers are retained, with category `Towers` and
group `towers`. `TOWERS` is registered in the buildings family: the normal build
writes GLBs, standalone parametric JS, thumbnails, source trees, source images,
`skyscrapers.meta.json` and `catalog.json`. No browser-side generator import is needed.
Geometry is deterministic and uses untextured material colours. The source tree
separates structural sections so they can be inspected in the factory.

| Id | Default triangles | Parameters (default first) |
|---|---:|---|
| tower-bell | 1,362 | `storeys`: 3, 4, 5; `roof`: teal, red |
| tower-bigben | 8,104 | `time`: time1010 (10:10), time0300 (3:00) |
| tower-eiffel | 9,458 | fixed landmark |
| tower-radio | 3,132 | `bays`: 8, 6, 10; `dishes`: 2, 0, 4 |
| tower-stone | 2,014 | `storeys`: 3, 2, 4; `banners`: red, blue, none |
| tower-kenney | 476 | `storeys`: 2, 3, 4; `battlements`: 8, 12 |
| tower-transmission | 4,600 | `arms`: 3, 2; `bays`: 6, 5, 7 |
| tower-watch | 2,086 | `storeys`: 3, 2, 4; `banners`: red, blue, none |

10,000 triangles is the ceiling for **every** parameter combination. Simple
stylized towers use less geometry rather than spending the budget on invisible
surfaces. There are 48 parameter combinations across the eight designs.
Unknown parameter names and unsupported values throw through `resolveParams`.

Big Ben has four layered clock faces with radial Roman numerals and matching
hour/minute hands, shaft lancets, projecting stone ribs, corner quoins, a louvred
belfry, pinnacles and a ribbed dark roof. The clock parameter is a static pose,
not an animation. Small facade ornament is planar; silhouette ribs have depth.
The Eiffel Tower has four separate tapered truss piers, curved decorative arches,
three observation levels (the lower two are open-centred walkways), an open upper lattice and antenna. The bell tower keeps
the timber/stone character and steep teal gable of its reference, with an open
belfry and a visible bell. The stone towers keep their square crenellated form;
the watch tower adds its wider base and corner ornaments. The Kenney turret stays
an intentionally simple octagonal drum. Technical towers have individual braces,
microwave dishes or suspended insulator strings, rather than opaque tapered boxes.

## Coordinates and future game import

These sources have incompatible authoring units and several have displaced origins.
The new factory models are in metres, grounded at y=0, with their structural shafts
centred at x=z=0. Asymmetric dishes, banners and stairs can extend the bounds.
`defaultScale = original GLB height * original defaultScale / new default height`
preserves the height of the default model when placed. Increasing storeys or bays
makes a taller tower at the same scale. Footprint proportions are deliberately
reconstructed rather than copying the original coordinate offsets or bounding boxes.

| Id | Original placed height | New default height (metres) |
|---|---:|---:|
| tower-bell | 34.18117 | 24.584785 |
| tower-bigben | 81.52325 | 96 |
| tower-eiffel | 183.02439 | 330 |
| tower-radio | 51.99029 | 37 |
| tower-stone | 41.66234 | 21.6 |
| tower-kenney | 34.69810 | 13.5 |
| tower-transmission | 48.56582 | 38.017048 |
| tower-watch | 55.87389 | 21.6 |

This change builds the factory export only. A later game import must use the new
scale together with the GLB/JS, preserve saved-map ids and reconcile footprint
metadata. In particular, the Eiffel Tower's four-foot `block.rects` from the game
catalog must be checked against the new piers; that game-only field is not part of
the factory's `MetaEntry` contract. Do not replace only the GLB while keeping the
old scale. No webapp asset or catalog entry is modified by the factory build.

## References and licensing

All eight original game GLBs were inspected through the offline renderer and their
world-space bounds measured. Original game thumbnails are saved under each
`assets/tower-*/webapp-reference.webp`; the factory Images tab copies them unchanged.
Each folder includes `attribution.txt`. No additional photograph was downloaded.
These are procedural reinterpretations, not architectural surveys or mesh imports.

| Model | Original author | Original license | Source |
|---|---|---|---|
| Bell Tower | Quaternius | CC0 | https://poly.pizza/m/ux44tbeQvj |
| Big Ben | Daqian Dong | CC-BY 3.0 | https://poly.pizza/m/8PaQZ_nLFIQ |
| Eiffel Tower | Scott Marshall | CC-BY 3.0 | https://poly.pizza/m/aIpJchqtRTg |
| Radio Tower | Poly by Google | CC-BY 3.0 | https://poly.pizza/m/eWEYV9ppUjv |
| Stone Tower | Quaternius | CC0 | https://poly.pizza/m/Rz4U5dZJz8 |
| Stone Turret | Kenney | CC0 | https://poly.pizza/m/5lvG0WtuTU |
| Transmission Tower | iPoly3D | CC0 | https://poly.pizza/m/TYK3rPu7E5 |
| Watch Tower | Quaternius | CC0 | https://poly.pizza/m/cMxuj2gt7D |

The three attributed reconstructions retain CC-BY-3.0 and name the reference author
in exported metadata. The changes are new geometry, palette, detail and parameters.
License: https://creativecommons.org/licenses/by/3.0/ . CC0 references:
https://creativecommons.org/publicdomain/zero/1.0/ .

## Verification

`test/towers.test.ts` fixes coverage of the original eight ids, tests every parameter
combination for finite grounded geometry, the 10k triangle ceiling, determinism and
coplanar material conflicts, and checks default placed heights. The shared
parameter tests compare standalone JS vertices with GLB vertices for every variant.
Run `pnpm typecheck`, `pnpm test`, `pnpm build`; inspect all eight generated thumbnails.
