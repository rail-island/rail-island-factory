# The standalone JS model format

**Covers** - the second output of every design: `export/js/<id>.js`, one ES module with no imports whose
`build(THREE)` returns a `THREE.Group`; how it is bundled, what it contains, how it relates to the GLB, and
the measured sizes.
**Code** - `generator/jsModel.ts`, `generator/threeBuilder.ts`, `generator/meshCore.ts`,
`generator/generate.ts` (`generateJsModels`), `test/jsModel.test.ts`
**See also** - [vehicle-rig.md](vehicle-rig.md), [parameters.md](parameters.md), [export.md](export.md), [skyscrapers.md](skyscrapers.md), [vehicles.md](vehicles.md),
[../site/catalog-site.md](../site/catalog-site.md)

## What it is

A model is a procedural program, so the compact file is the program: `export/js/<id>.js` is the design's own
code, bundled with only the geometry it uses and minified. It is written next to the GLB, which stays the game's
import format; nothing in the meta files or the game contract changes.

```js
import build from "./sky-pyramid.js";
import * as THREE from "three";
scene.add(build(THREE)); // a THREE.Group named after the model id
```

- **No imports.** The three.js namespace is passed in, so the file works with any three.js copy and bundler.
  It needs `Group`, `Mesh`, `BufferGeometry`, `BufferAttribute` and `MeshStandardMaterial`.
- **The Group.** Metres, +Y up, base at y = 0, like the GLB. One `Mesh` per material in material-name order
  (mesh and material carry the material's name), non-indexed triangle soup with flat per-face normals. Colours
  are the palette's sRGB hex, so three's colour management converts them to the linear value the GLB stores.
  A model with parts (the truck, the buses, [vehicles.md](vehicles.md)) has a `Group` per part, named after it and
  positioned at its pivot, its meshes relative to that pivot - the GLB's nodes, nested as they are (a steered
  wheel inside its body).
- **The rig.** A rigged vehicle's group carries `userData.rig`, and its module also exports `pose`,
  `renderJoint`, `steerAngles`, `steerLock` and `jointTriangles`: the code that turns its wheels, bends its
  sections and re-draws its joints ([vehicle-rig.md](vehicle-rig.md)).
- **Animations.** The group's `animations` holds the GLB's clips as `THREE.AnimationClip`s (a steam
  locomotive's `running`, [animation.md](animation.md)); an animated model's namespace also needs
  `AnimationClip`, `QuaternionKeyframeTrack` and `VectorKeyframeTrack`.
- **Parameters.** The module also exports `params`, the design's enum parameters (`[]` for a fixed design),
  and `build(THREE, params)` builds any combination of their values; `build(THREE)` builds the defaults, the
  GLB's model, and an unknown name or value throws ([parameters.md](parameters.md)).
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
`pnpm build:models` writes it after the GLBs (`generateJsModels`) and deletes the file of a dropped design.

A design must therefore stay free of Node-only imports and of anything that differs between runs.

## Sizes

`pnpm build:models` prints GLB, gzipped GLB, JS and gzipped JS per model, and `catalog.json` carries them
(`glbBytes`, `glbGzipBytes`, `jsUrl`, `jsBytes`, `jsGzipBytes`); the site's table lists GLB and JS and the model
page lists all four. Measured at the time of writing:

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

`test/jsModel.test.ts` loads each design's bundle, builds it with the real three.js and compares every triangle
(world space, per material), the colours and the part nodes with the design's GLB; checks the file has no import
and no Node API, is smaller than the GLB, is deterministic, and that the recorder and GLB writer are absent; and
that `generateJsModels` writes, skips and prunes.
