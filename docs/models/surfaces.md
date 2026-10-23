# Surfaces

**Covers** - the texture library (the photo sets in `assets/textures/`, their sources and
licence, the 16-set cap, the fetch script), the named surfaces (a photo, its tile and the tint
rule), how a design opts a material into one, the UVs the JS model then carries, the export
(`export/textures/`, `surfaces.meta.json`) and how the game and the site preview bind the photos.
**Code** - `generator/surfaces.ts`, `generator/surfacesExport.ts`, `generator/fetchTextures.ts`,
`generator/threeBuilder.ts`, `src/viewerSurfaces.ts`, `test/surfaces.test.ts`
**See also** - [js-format.md](js-format.md), [export.md](export.md), [sets.md](sets.md), the game's
`docs/rendering/terrain-materials.md` and `docs/rendering/track-surfaces.md`

## The library

`assets/textures/<name>_{albedo,normal,rough}.jpg`: 15 photo sets from Poly Haven (CC0), every
map 512 x 512, listed with slug, licence and use in `assets/textures/SOURCES.md`. They are the
only photos the game draws with - terrain, track, roads, structures and any factory design that
names a surface. `MAX_TEXTURES` caps the library at 16 sets: there is no texture compression and
every set costs about 4 MiB of GPU memory with mips, so a new look reuses a photo where it can.
`TEXTURE_AVERAGE` pins each albedo's mean colour; the test measures the files against it.

`pnpm exec tsx generator/fetchTextures.ts [name...]` refetches sets at 1k and resizes them with
sharp. The committed files are the library; refresh one only on purpose, review it, and update
its average.

## Named surfaces

`SURFACES` maps a stable id to a preset:

| Field | Meaning |
|---|---|
| `texture` | the photo set |
| `tile` | world units one repeat spans (studs for the game's structures, metres for a design) |
| `tintLift`, `gain` | the tint is the material's colour lifted toward white by `tintLift`, times `gain` - a tint can only darken a photo |
| `tint` | a fixed linear multiplier instead (an airport's pavement) |
| `fill` | albedo-coloured self-light that keeps detail in shadow |
| `normalScale` | strength of the normal map |
| `flat` | the sRGB colour the surface reads as without its photo (the far band, a headless build) |

The `bridge-*`, `road-*`, `stop-*`, `rail-*`, `tram-tie`, `airport-*`, `dam-*`, `tunnel-portal`,
`gallery-concrete` and `house-plinth` presets are what the game binds its own structures with;
the `model-*` presets are for factory designs.

## A design that names a surface

A material built with `surfaceMaterial(id, { color? })` carries `surface` and `surfaceTile`. Its
colour stays the honest flat colour (by default the preset's `flat`, else the photo's average),
so thumbnails, the GLB, the far band and every untextured path read right. `toGroup` then gives
that material's meshes a `uv` attribute - per-triangle box projection in model coordinates, at
`surfaceTile` units per repeat - and lists it in `userData.surfaces` (`{ <material>: <surface> }`).
A design without one is untouched: no UVs, no table. The GLB is written without texture
coordinates; it is in-memory only.

## Export and binding

A whole export copies the library to `export/textures/` and writes `surfaces.meta.json`
(every texture with its files, slug, licence, average and sha256; every surface). The game's
import mirrors both; the game binds a model's photos after it builds it, and its own structures
through the same table. The site preview (`src/viewerSurfaces.ts`) binds them from the export
folder with the game's tint rule, so a design can be checked by eye.
