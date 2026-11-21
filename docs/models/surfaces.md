# Surfaces

**Covers** - the texture library (the photo sets in `assets/textures/`, their sources and
licence, the 20-set cap, the fetch script), the named surfaces (a photo, its tile and the tint
rule), how a design opts a material into one, the UVs the JS model then carries, the export
(`export/textures/`, `surfaces.meta.json`) and how the game and the site preview bind the photos.
**Code** - `generator/surfaces.ts`, `generator/surfacesExport.ts`, `generator/fetchTextures.ts`,
`generator/threeBuilder.ts`, `src/viewerSurfaces.ts`, `test/surfaces.test.ts`
**See also** - [js-format.md](js-format.md), [export.md](export.md), [sets.md](sets.md), the game's
`docs/rendering/terrain-materials.md` and `docs/rendering/track-surfaces.md`

## The library

`assets/textures/<name>_{albedo,normal,rough,height}.jpg`: 20 photo sets from Poly Haven (CC0), every
map 512 x 512, listed with slug, licence and use in `assets/textures/SOURCES.md`. They are the
only photos the game draws with - terrain, track, roads, structures and any factory design that
names a surface. `MAX_TEXTURES` caps the library at 20 sets: there is no texture compression and
every set costs about 4 MiB of GPU memory with mips, so a new look reuses a photo where it can.
The cap was 16 until `sandstone` and `limestone` were added for rock faces: each reads as its
own stone and no photo in the library stood in for them; it rose to 20 for `tundra` (moss and
lichen over grey stone) and `clay` (red laterite soil), the game's tundra and red-clay terrain,
which re-tinted the soil photo before. The game's terrain binds these four by texture name (its
`render/TerrainTextures.ts`), not through a surface preset; their site texture pages
(`proc-preview-texture-*`) show them.
`TEXTURE_AVERAGE` pins each albedo's mean colour; the test measures the files against it.

`pnpm exec tsx generator/fetchTextures.ts [--maps=albedo,normal,rough,height] [name...]` refetches
sets at 1k and resizes them with sharp; `--maps` limits it to those channels. The committed files
are the library; refresh one only on purpose, review it, and update its average.

### Height maps

`<name>_height.jpg` is Poly Haven's displacement map (`disp`, on some sets `height`), for the
game's terrain: it height-blends its layers by it, as Terrain3D does, so where grass meets rock
the stones and tufts of each photo poke through the other instead of the two fading into each
other (the game's `docs/rendering/renderer.md`). The game packs it into the alpha of its albedo
array, so a height map costs no GPU memory of its own and does not count against `MAX_TEXTURES`.

Two steps turn the scan into a blend height, both in `fetchTextures.ts`:

- **High-pass** (`highPassHeight`): the map minus a wrap-around blur of itself (three box passes of
  radius `HEIGHT_HIGH_PASS_RADIUS`, 12 px). The scans are dominated by broad swells of the ground;
  a blend driven by them pushes a border out in blobs a third of the photo wide, where it should
  follow stones. The blur wraps, so the map stays tileable.
- **Equalize** (`equalizeHeight`): every pixel becomes its rank. Poly Haven scans at very
  different ranges - clay averaged 41, wood 163 - and a set whose heights sat lower would lose every
  border to its neighbour; equalized, every set has the same distribution (mean mid-grey), so a
  border favours no set. `test/surfaces.test.ts` checks every file.

## Named surfaces

`SURFACES` maps a stable id to a preset:

| Field | Meaning |
|---|---|
| `texture` | the photo set |
| `tile` | world units one repeat spans (studs for the game's structures, metres for a design) |
| `tintLift`, `gain` | the tint is the material's colour lifted toward white by `tintLift`, times `gain` - a tint can only darken a photo |
| `balance` | a per-channel multiplier on that tint: it corrects the photo toward the material's colour, so the colour stays the honest one the surface reads as (thumbnails, the far level) while its tones still scale the photo (the `bridge-sandstone`, `-limestone`, `-granite` and `bridge-brick*` presets a masonry arch's swatch picks) |
| `tint` | a fixed linear multiplier instead (an airport's pavement) |
| `fill` | albedo-coloured self-light that keeps detail in shadow |
| `normalScale` | strength of the normal map |
| `flat` | the sRGB colour the surface reads as without its photo (the far band, a headless build) |

The `bridge-*`, `road-*`, `stop-*`, `rail-*`, `tram-tie`, `airport-*`, `dam-*`, `tunnel-portal`,
`gallery-concrete`, `house-plinth` and `river-boulder` presets are what the game binds its own structures (and a rapid's boulders) with;
the `model-*` presets are for factory designs, and the `swatch-*` presets (each photo untinted, four
units a repeat) for the site's texture pages ([previews.md](previews.md)).

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
folder with the game's tint rule, so a design can be checked by eye; under `pnpm dev` the dev
server serves `/surfaces.meta.json` and `/textures/<file>` straight from the generator and
`assets/textures/` ([../site/catalog-site.md](../site/catalog-site.md)).
