# The standalone JS model format

**Covers** - the model as the export ships it: `export/js/<id>.js`, one ES module with no imports whose
`build(THREE)` returns a `THREE.Group`; how it is bundled, what it contains, how it relates to the build's
in-memory GLB, and the measured sizes.
**Code** - `generator/jsModel.ts`, `generator/threeBuilder.ts`, `generator/meshCore.ts`,
`generator/generate.ts` (`generateJsModels`), `test/jsModel.test.ts`
**See also** - [vehicle-rig.md](vehicle-rig.md), [parameters.md](parameters.md), [export.md](export.md), [skyscrapers.md](skyscrapers.md), [vehicles.md](vehicles.md),
[../site/catalog-site.md](../site/catalog-site.md)

## What it is

A model is a procedural program, so the compact file is the program: `export/js/<id>.js` is the design's own
code, bundled with only the geometry it uses and minified. It is the **only** form of the model the export holds:
the game and the site both build from it, and there is no GLB file. (The build still writes each design to GLB
bytes in memory, for its own analysis - [export.md](export.md).)

```js
import build from "./sky-pyramid.js";
import * as THREE from "three";
scene.add(build(THREE)); // a THREE.Group named after the model id
```

- **No imports.** The three.js namespace is passed in, so the file works with any three.js copy and bundler.
  It needs `Group`, `Mesh`, `BufferGeometry`, `BufferAttribute` and `MeshStandardMaterial`.
- **The Group.** Metres, +Y up, base at y = 0, like the in-memory GLB. One `Mesh` per material in material-name order
  (mesh and material carry the material's name), non-indexed triangle soup with flat per-face normals. Colours
  are the palette's sRGB hex, so three's colour management converts them to the linear value the GLB stores.
  A model with parts (the truck, the buses, [vehicles.md](vehicles.md)) has a `Group` per part, named after it and
  positioned at its pivot, its meshes relative to that pivot - the GLB's nodes, nested as they are (a steered
  wheel inside its body).
- **The rig.** A rigged vehicle's group carries `userData.rig`, and its module also exports `pose`,
  `renderJoint`, `steerAngles`, `steerLock` and `jointTriangles`: the code that turns its wheels, bends its
  sections and re-draws its joints ([vehicle-rig.md](vehicle-rig.md)).
- **Emitters.** A model that smokes, steams or flares carries `userData.emitters`, the mouths of its
  stacks for the parameters it was built with; a fountain carries `userData.fountain`, its pools and
  jets ([emitters.md](emitters.md)).
- **Animations.** The group's `animations` holds the GLB's clips as `THREE.AnimationClip`s (a steam
  locomotive's `running`, the wind turbine's `wind`, the pumpjack's `pumping`, [animation.md](animation.md)),
  and `userData.clipDrives` says what plays each, by clip name: a `time` loop or the `distance` travelled
  at a reference speed. An animated model's namespace also needs `AnimationClip`,
  `QuaternionKeyframeTrack` and `VectorKeyframeTrack`.
- **Parameters.** The module also exports `params`, the design's enum parameters (`[]` for a fixed design),
  and `build(THREE, params)` builds any combination of their values; `build(THREE)` builds the defaults, the
  GLB's model, and an unknown name or value throws ([parameters.md](parameters.md)).
- **Vertex colours and double-sided materials.** A model drawn with `MeshCore.triShaded` (the trees' baked
  light and shade, [trees.md](trees.md)) carries a `color` attribute per mesh and its materials set
  `vertexColors` (the GLB's `COLOR_0`: linear multipliers of the material colour); a material spec with
  `doubleSided` (a palm's fronds) is `THREE.DoubleSide` (the GLB's `doubleSided`), so a namespace passed in
  must carry `DoubleSide`: without it the fronds draw one-sided, visible only from below. Other models are
  unchanged.
- **The coarse level.** A tree's module also exports `buildCoarse(THREE)`, its third and coarsest level
  ([lod.md](lod.md)). The game takes its trees from `woods.js` instead, every species and woods type in one module
  ([trees.md](trees.md)); the per-species files are the catalog's and the site's.
- **Max detail.** A design with `buildMax` exports `buildMax(THREE, params)` and
  `maxTriangleBudget` (10,000). Currently every tree supplies it. It is optional,
  does not change the default `build` or its boolean LOD argument, and sets
  `group.userData.lod` to `"max"`. The site advertises it with `maxDetail: true`.
- **The same triangles.** The positions and normals equal the GLB's, not an approximation: it is the same
  algorithm running on the same geometry code.

## How it is built

`generator/meshCore.ts` holds the geometry: the ring helpers and the primitives (`tri`, `quad`, `cap`, `loft`,
`prism`, `spire`, `sweep`, `box`, `slab`, `facets`), `scope` and `part`. Two classes extend it:

| Class | File | Adds |
|---|---|---|
| `MeshBuilder` | `meshBuilder.ts` | the recorded source tree ([source-tree.md](source-tree.md)) and `toGlb` |
| `MeshBuilder` (lean) | `threeBuilder.ts` | `toGroup(THREE, name)` |

`jsModel.ts` bundles one design with esbuild: an entry imports the design's build function (each design is an
exported function of `skyscrapers.ts` or `vehicles.ts`) and exports `params` and `build(THREE, params)`; a plugin resolves the
design's `./meshBuilder.ts` import to `threeBuilder.ts`, so the recorder and the GLB writer never reach the
file. Output is minified ES2022 with a one-line banner, deterministic, and rewritten only when its text changed.
`pnpm build:models` writes it after the thumbnails (`generateJsModels`) and deletes the file of a dropped design.

A design must therefore stay free of Node-only imports and of anything that differs between runs.

## Sizes

`pnpm build:models` prints JS and gzipped JS per model, and `catalog.json` carries them (`jsUrl`, `jsBytes`,
`jsGzipBytes`); the site's table lists the JS size and the model page both. The GLB columns below were measured
when the export still wrote GLB files, for comparison:

| Model | GLB | GLB gzip | JS | JS gzip |
|---|---|---|---|---|
| veh-american-truck | 356 kB | 31 kB | 11.5 kB | 4.5 kB |
| sky-brick-residential | 214 kB | 17 kB | 5.9 kB | 2.6 kB |
| sky-bullet | 151 kB | 27 kB | 5.3 kB | 2.4 kB |
| sky-pyramid | 36 kB | 4.1 kB | 5.0 kB | 2.2 kB |

Every JS file is about 5-11.5 kB whatever the model, because it is mostly the shared geometry code (about 4 kB);
a design adds a kilobyte or two. The saving is largest for the detailed models and smallest, against gzip, for the
simplest ones. The cost is that the file is code: loading it runs the design (milliseconds) and the consumer
trusts the factory's build.

## Tests

The catalog sweep (`test/catalogSweep.ts`) loads each design's bundle, builds it with the real three.js and compares every triangle
(world space, per material), the colours, the clips and the rig with the design's GLB, and checks the file has no import
and no Node API and is smaller than the equivalent full-detail and LOD GLBs together. `test/jsModel.test.ts` checks that a bundle
is deterministic, that the recorder and GLB writer are absent, and that `generateJsModels` writes, skips and prunes.

## Low level of detail

Every standalone JS model accepts `build(THREE, params, lod = false)`. Set the third
argument to `true` for its budgeted distant mesh. The factory detail view exposes
this through **Low level of detail** and reports the preview triangle count.
LOD rig posing is static; full-detail models and source trees are unchanged.
See [lod.md](lod.md) for budgets, geometry and verification.
