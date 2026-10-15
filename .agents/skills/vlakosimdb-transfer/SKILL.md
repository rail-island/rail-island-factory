---
name: vlakosimdb-transfer
description: Reconstruct or refine a procedural railway vehicle from vlakosimdb XML and original low-resolution textures. Extract source geometry, build normalized element-comparison tables, optimize the model against them and present before/after measurements and views to the user. Use whenever vlakosimdb is a source for a vehicle model or a proportion correction.
---

# Vlakosimdb model transfer

**Covers** - reference extraction, geometric reconstruction and measurable proportion matching.
**Code** - `generator/cd163.ts`, `assets/cd-163/native/`, `generator/csdCoaches.ts`, `generator/bmoCoach.ts`, `generator/cdGreenWhiteCoach.ts`, `generator/coachTransfers.ts`, `generator/csdCoachComparison.ts`, `test/models.test.ts`, `test/csdCoaches.test.ts`
**See also** - [railroad-vehicle](../railroad-vehicle/SKILL.md), [vehicle reference](../../../docs/models/vehicles.md), [CD 163 source notes](../../../assets/cd-163/SOURCES.md)

Transfer the source vehicle's shape and layout into maintainable procedural
geometry. Do not rely on visual guessing from a perspective preview. All skill
text and repository documentation must remain in English.

## 1. Inspect and preserve the original evidence

- Locate the exact vehicle directory, source revision, `index.xml`, related
  model components and original BMPs. Record provenance and retain the small
  originals in `assets/<vehicle>/` when appropriate.
- Parse XML using its declared encoding; some sources use Windows-1250. Inspect
  geometry/profile definitions, polygon vertices, transforms, clipping shapes,
  material assignments and texture mapping. Resolve referenced components and
  conditions before interpreting a shape.
- **Use the shapes in the XML as the starting point for the body and equipment.**
  Recover cab profiles, roof sections, widths, lower aprons and bogie locations.
  A texture alone cannot establish depth or a surface's inclination. For CD
  163, XML revealed both the upper and lower cab setbacks; modelling only the
  upper setback produced the wrong front silhouette.
- Inspect photographs for curved details, surface orientation, real mechanical
  dimensions and features the raster cannot resolve. Keep engineering dimensions
  such as standard buffer spacing separate from ambiguous painted silhouettes.
- **Never measure from the `_4x` or other upscaled/enhanced textures.** Their
  synthesized details can change windows, lights and gaps. Measure original
  pixel boundaries; nearest-neighbour enlargement is allowed only as a viewing
  aid, without replacing the native coordinates.

## 2. Establish coordinate and view mappings

Read the actual XML mapping instead of assuming image dimensions equal vehicle
bounds. Determine source units, axis directions, origin, handedness, texture
flips, side assignments and per-part transforms. Write the conversion into the
Factory's +X forward, +Y up, +Z right frame explicitly.

For CD 163, `colorize` maps a 30 by 60 front BMP to 3 by 6 m and a 170 by 60
side BMP to 17 by 6 m: one pixel is 0.10 m on both axes. This is an example,
not a database-wide constant. `x_both.bmp` is shared by the ends; `z_dec.bmp`
shows portholes and `z_inc.bmp` shutters. Do not invent missing `x_dec`, `x_inc`
or `z_both` views, or infer the Factory side solely from a filename suffix.

Choose a common physical comparison canvas for source and model. Document any
mirroring and origin translation. Do not crop or rescale each vehicle separately
just to make mismatched proportions look aligned. Keep structural slopes and
paint boundaries distinct: the apparent roof edge can differ between views.

## 3. Create the element-comparison table before adjusting the model

**Create tables for the front and each distinct side view.** Include all relevant
visible elements: cab and door windows, doors, round windows, lights, number
plates, logos, buffers, ploughs, livery boundaries, grilles and roof boxes.
Add equipment or views when needed for the task.

Each row must identify:

- view and element, with a stable annotation ID;
- original-image bounding box in native pixels, using pixel-edge coordinates;
- corresponding named model scope(s) or selected mesh primitives;
- source and model top-left X/Y, width and height as percentages of the same
  canvas, plus signed differences in percentage points;
- uncertainty and any deliberate mechanical constraint.

Define the convention explicitly: origin at the top left, X right, Y down;
`x% = 100*x/W`, `y% = 100*y/H`, `w% = 100*w/W`, `h% = 100*h/H`.
If area is requested, report `w%*h%/100` as bounding-box area, not painted-pixel
or silhouette area. Include the canvas's physical size and any empty space.

Compare like with like: glass against glass, frame against frame, lens against
lens, housing against housing. Split these into separate rows where necessary.
Mark inferred door boundaries, overlapping parts and ambiguous dark silhouettes
as estimates. A 1 by 2 pixel light patch cannot establish the true lens shape.

Measure the model by **orthographic projection of actual mesh vertices**, ideally
using GLB triangles and source-tree scopes. Do not measure a perspective render
or the whole cab's bounds when the requested element is just its glass. State
whether measurements include occluded geometry. Use labelled pixel-grid and
orthographic images to make annotations reviewable.

## 4. Optimize against the table and inspect the result

1. Save the baseline table before editing. Keep its source annotations, view
   mappings and canvas fixed throughout the comparison.
2. Correct the body profiles from XML first, then adjust element position and
   size, connected fittings and paint boundaries. Refit details to modified
   sloped surfaces; moving a window may also require moving its wiper or door.
3. Recompute the table from the rebuilt model. Reduce position and size errors
   for individual elements, not just their centres or an aggregate score.
   Check both ends and both distinct sides.
4. Review orthographic and three-quarter views for floating details, clipping,
   wrong slopes, excessive gaps and distorted silhouettes. A lower table error
   does not by itself establish a convincing model.
5. Iterate until clear features agree within the original raster's meaningful
   resolution and remaining differences have a concrete explanation. State the
   pixel uncertainty in percentage points. Preserve circular equal-size red and
   white lenses, legitimate logo outlines and known mechanical dimensions rather
   than reproducing pixel artifacts.
6. Report mean absolute error for X/Y/width/height with its formula and scope,
   per-view results and material remaining outliers. Do not change annotations,
   omit difficult rows or loosen tolerances to make the score look better.
   If an annotation is found to be wrong, correct it transparently and recompute
   both the baseline and final measurements using that same correction.

For a family of similar vehicles, share one builder and keep one landmark file
per vehicle: the nine CSD coaches (`generator/csdCoachParts.ts`, one
`assets/csd-<name>/native/landmarks.json` each) loft their bodies from the XML
`alongx` section scaled by the `alongy` plan and clamped by the `alongz`
elevation, and lay every measured box on that skin. A colorize paints the faces
whose outward normal opposes its direction, so `z_dec` is the +z side and
`x_dec` the x = 0 end.

The CD 163 calibration reduced mean absolute error across the same 50 boxes
from 1.736 to 0.356 percentage points. This measures those annotations on full
texture canvases, not overall photographic accuracy. Its fixtures in
`assets/cd-163/native/landmarks.json` provide a reusable example.

## 5. Validate, preserve and present

- Follow `railroad-vehicle`, including one raised and one folded pantograph for
  an electric locomotive with two collectors in the default operating pose.
- Preserve original annotations and provenance in the repository. Add regression
  checks against independent source landmarks and meaningful pixel tolerances,
  as well as relevant geometry constraints. Tests must not require a sibling
  database checkout or network access when the small fixtures can be retained.
- Run the required build, type checks and tests; inspect generated thumbnails
  and all relevant views headlessly. Do not commit generated export artifacts.
- **Present the final comparison table to the user**, with before/after errors,
  annotated images, remaining uncertainties and verification results. Provide
  readable tables and links to complete Markdown/HTML/CSV artifacts as useful.
  Include the model revision so the measurements can be traced to the result.
- Update vehicle documentation and source notes. Follow the repository's commit
  and publication instructions; a Factory change does not authorize game import.
