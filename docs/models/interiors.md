# Vehicle interiors

**Covers** - the generic cabin behind every passenger door: the interior part and how consumers hide it while the doors are shut (`userData.interiors`, the GLB's `extras`), what a cabin holds (floor, ceiling, walls with the windows seen from inside, the doorways' reveals, seat rows clear of the doors, a bus's wheel-arch podiums), how each kit fits one into its body and cuts the doorways, the interior budget, the gap strips on shut leaves, keeping the code out of other bundles, the site's preview and the tests.
**Code** - `generator/interior.ts` (`drawCabin`, `Cabin`, `CabinDoor`, `CabinWindow`, `windowPanes`, `laterWindows`, `clearZones`, `seatRows`, `seatLayout`, `INTERIOR_PALETTE`, `INTERIOR_TRIANGLE_BUDGET`, `CABIN_INSET`), `generator/interiorTable.ts` (`interiorsOf`, `interiorTable`, `isInteriorName`), `generator/meshBuilder.ts` (`interiors`, `interiorTriangleCount`, `exteriorTriangleCount`, `toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/jsModel.ts` (`noInteriors`), `generator/glbTriangles.ts` (`collectTriangles`), `generator/coplanar.ts`, `generator/coachCabin.ts`, `generator/csdCoachParts.ts` (`Coach.bandPiece`, `Coach.door`, `Coach.window`, `Coach.sidePanel`), `generator/dmuKit.ts` (`loft`, `Car.doorways`), `generator/busAssembly.ts` (`busCabin`, `BusDraft.door`), `generator/busBody.ts` (`Shell.doorways`), `generator/sliceLoft.ts` (`loftQuad`), `generator/sliceBody.ts` (`drawShell`, `sliceCabin`), `generator/drVt1816.ts` (`drawCarCabin`), `generator/renderGlbThumb.ts` (`ThumbOptions`), `src/viewerInteriors.ts`, `src/ModelViewer.tsx`, `test/interiors.test.ts`, `test/viewerInteriors.test.ts`, `test/doors.test.ts`
**See also** - [doors.md](doors.md), [animation.md](animation.md), [js-format.md](js-format.md), [export.md](export.md), [buses.md](buses.md), [../site/catalog-site.md](../site/catalog-site.md), [../specs/2026-10-25-vehicle-interiors.md](../specs/2026-10-25-vehicle-interiors.md)

## The idea

Every passenger vehicle that opens its doors ([doors.md](doors.md)) has an interior
behind them: one generic cabin per car. Nothing in it is particular to a design
except the doors. It is drawn only to be seen through an open doorway, so it is
**hidden while every door of its car stands shut**, and then nothing of it is drawn:
no draw call, no triangle. The windows stay opaque.

## The interior part

`drawCabin` draws into the car's interior part, a child part (`MeshCore.spin`) of
the car being drawn, so it moves with its section. The part is named
`interior-<car>` inside a car part (`interior-section1`, `interior-body`), or plain
`interior` outside any part. A car with cabins in several bodies gets `-2`, `-3`
(the Be31's two end vestibules). Part names starting `interior` are reserved for
this.

`interiorsOf(parts, clips)` (`interiorTable.ts`; `MeshBuilder.interiors()` on the
generator's builder) names the door clips that reveal each interior, by part name:

```json
{ "interior-section1": ["doors-left-section1", "doors-right-section1"] }
```

These are the `door` clips of the interior's car (its parent part):
`doors-<side>-<car>`, or `doors-<side>` outside any part. An interior that no door
clip reveals is refused.

- **The JS model** (`toGroup`, through `interiorTable`) builds every interior
  Group with `visible = false` and carries the table as `userData.interiors`. A
  consumer that knows nothing of interiors draws none.
- **The GLB** (in memory: thumbnails, stats, checks) carries the table as the
  scene's `extras.interiors` and marks each interior node `extras.interior`.
  `collectTriangles` leaves those nodes out unless asked (`{ interiors: true }`), so
  the model at rest is the exterior. That covers the thumbnails, `glbStats`, the
  budgets and the z-fighting check of the build.
- **The source tree** (`MeshBuilder.sourceTree`) is the model at rest too. It
  leaves the interiors out, with their triangles' ranges and materials, so its
  ranges still tile the GLB's primitives as `collectTriangles` reads them. The
  site's highlight leaves the interior meshes out of its parts the same way
  (`makeParts`, `src/viewerHighlight.ts`).
- **Triangles.** `triangleCount()` counts everything. `exteriorTriangleCount()` is
  what the design budgets and the catalog's `triangles` count.
  `interiorTriangleCount()` is the rest.

A consumer shows an interior while any of its clips stands above 0, and hides it
once all are shut again. The site does this today. The game does not yet; see
Consumers below.

## The cabin

`drawCabin(m, cabin)` (`interior.ts`) draws a `Cabin` in model coordinates: x0..x1
along the car, `floor` and `ceiling` heights, side walls at |z| = `half`, and its
`doors` (`CabinDoor`: side, x span, threshold and head heights, and the skin's |z|
by height for the reveal).

| Piece | Material | What it is |
| --- | --- | --- |
| floor | `interiorFloor` | one level, facing up |
| ceiling, end walls | `interiorWall` | facing in |
| side walls | `interiorWall` | facing in, open over each doorway; the wall above a door's head and below a raised sill stays. Where the body's bottom edge stands above the floor (a skirt cut away over the wheels), the side and end walls start at that edge (`Cabin.bottom`; the coach kit and the VT 18.16 pass theirs) |
| doorway reveal | `interiorFloor`, `interiorWall` | the threshold, the head and the two jambs from the skin in to the side wall; jambs 3 mm inside the doorway, off the frame's inner walls; a riser up to the floor where a sill lies lower (a step well) |
| windows | `interiorGlass` | each side window's glass seen from inside: a dark pane on the side wall, 4 mm off it and facing in, cut to the wall between floor and ceiling (a double-decker's upper windows stand above the one cabin and get none). The windows stay opaque; the pane is marked glass (`glass: true`), so the game reflects the sky in it like the outside glass |
| seats | `interiorSeat` | a box cushion and a box back per seat group |
| wheel-arch podiums | `interiorWall` | a bus's: a box across the car over each arch, its ends 11 mm outside the arch's notch and its top over the notch's crown, so neither shows inside (`Cabin.housings`; a per-side box is possible too). The floor and the side walls leave out what a podium covers, so a front tyre turning to full lock cuts through nothing |

The windows come from each kit: a bus's from its panes (`BusDraft.pane`), the
slice-lofted sets' and the VT 18.16's from their window lists, all known when the
cabin is drawn (`Cabin.windows`). The coach kit lays its windows after the cabin:
`Coach.window` (and glass laid straight with `Coach.sidePanel`) hands each glass box
to `laterWindows`, which draws its pane into the interior part of the car's cabin
that spans it, the triangles routed there (`MeshCore.drawRouted`). A door leaf's
lights get none.

The materials are shared by every vehicle (`INTERIOR_PALETTE`). The kits that draw
cabins put them in their builder's palette: the coach kit's `Coach` and
`assembleBus`.

**Seats.** The rows stand across the car at a 0.9 m pitch, each 0.55 m long,
spread evenly over the spans between the doors' clear zones. A door's clear zone
is its span plus 0.35 m beyond each jamb, and a door on either side clears the
whole row across the car (`clearZones`, `seatRows`). Every row faces the middle
of the car. A row seats 2+2 where the cabin is wide enough, else 2+1, else 1+1
(`seatLayout`: 0.46 m a seat, at least 0.45 m of aisle). A kit's `room(x0, x1)`
says where the shell holds a row:

- the lowest height it may stand on: the floor, or a wheel arch's top or a skirt
  cut away over the wheels, where the seats then stand on a base;
- the highest it may reach;
- or null where the shell narrows (a nose).

**Insets.** The side walls stand `CABIN_INSET` (47 mm) inside the narrowest skin
between floor and ceiling. The end walls stand the same inside the body's ends.
That is clear of the panels laid on the skin, and an odd figure, so no cabin face
lands on a design's round one. The seats keep 37 mm from the walls.

**Outside the shell.** Floor, ceiling and walls face only inward. Where the cabin
reaches past the shell, nobody outside sees them: a tapered nose, a roof that
falls toward a power car. Only a seat would show there, which is why `room` keeps
seats where the shell holds them. A skirt cut away over the wheels is the
exception: through an open door the far wall would show below the body, so the
walls stop at its bottom edge (`Cabin.bottom`).

**Budget.** At most `INTERIOR_TRIANGLE_BUDGET` = 1,500 triangles per car's
interior, apart from the design's exterior budget. The catalog's cabins hold 56
(the Be31's end vestibules, which have no seats) to about 1,410.

## The kits

Each kit cuts the doorway through its shell over the leaves' box, 2 mm beyond
sill and head, under the door's frame. A bus's doorway is cut 3 cm inside its
leaves instead: its sides lean in under the flat leaves. Each kit draws the frame
round the hole and the cabin behind it.

| Kit | Shell cut | Cabin |
| --- | --- | --- |
| coach kit (`Coach.volume`; trams, CSD and livery coaches, most units) and the railcar kit (`dmuKit.ts` `loft`) | `Volume.openings`, every opening door's leaf box (`doorOpening`, `Car.doorways`, the tram kit's `doorOpenings`, `doorways` in `csdCoaches.ts`). Over them `doorwaySegment` leaves out the side's wall. Over a doorway the piece also leaves out its chords across the body. Elsewhere a volume with openings leaves out the chord at a band boundary between the cabin's floor and ceiling (`bandPiece`, `cabinHeights`): a hidden face that would cut through the cabin. A piece with nothing to leave out is still one `sweep`, so the source tree's ids below the floor and above the ceiling are unchanged | `coachCabin(c, v)` (`coachCabin.ts`): along the whole volume. The floor is at the lowest sill, above the body's bottom at the doors. The ceiling is 0.12 m above the highest head, under the roof. The walls are inside the narrowest skin where the plan keeps 90 % of the full width. Seats go where the skin and the elevation hold them. Floor, ceiling and the reveals stand 3, 6 or 9 mm clear of the shell's chords |
| bus (`busAssembly.ts`) | `BusDraft.door` records the doorway (3 cm inside the leaves' span, sill to head) and draws a frame round the leaves in the door style's `surround`. `drawShell` adds the doorway's cuts and leaves out the side face of the cells over it | `busCabin` per section. A podium stands across the car over each wheel arch, seats on it |
| TGV Duplex, Shinkansen 0 (`sliceBody.ts`) | `drawShell(..., doorways)`: a doorway's ends become stations, and the side's quads keep only their pieces below the sill and above the head (`loftQuad`) | `sliceCabin`, from the end of the nose (Shinkansen) or the whole car |
| DR VT 18.16 (`drVt1816.ts`) | `drawBody(m, p, X, leaves)` through `loftHalves`' `hole` | `drawCarCabin`; the power car's behind its one passenger door |

**Gap strips.** With the shell open behind them, the gaps between shut leaves
would look straight through the car. In the coach kit a leaf with a neighbour
carries a dark `seam` strip behind the 12 mm gap. A bus leaf carries one in its
door's `surround`, behind its 2 cm gap. Either strip reaches 1 cm into the frame
above and below and rides on the leaf, so it moves with it.

**One floor.** A double-deck coach or unit's cabin has a single floor at its
doors' level.

## Bundle size

Every JS model carries the shared runtime (`meshCore.ts`, `threeBuilder.ts`), and
the smallest ones barely beat their GLBs (the catalog sweep's size check). So the
interior code stays out of the runtime. The interior part is an ordinary child
part, and the bookkeeping (`interiors`, the triangle counts, the GLB's marks) is
the generator's `MeshBuilder`'s, which no bundle carries. `toGroup` makes one call
into `interiorTable.ts`. `jsModel.ts`'s `noInteriors` plugin swaps
`interiorTable.ts`, `interior.ts` and `coachCabin.ts` for no-ops in the bundle of
any design that draws no interior. Those are all designs outside the passenger
groups, and any passenger design whose defaults and single-parameter variants draw
none.

## Consumers

- **The site** (`src/viewerInteriors.ts`, `ModelViewer`). An interior is shown
  while any of its doors' sides stands above shut, as **Open left** / **Open right**
  move them, and hidden once **Close** has finished. **Interior on / Interior off**
  shows every cabin with the doors shut. It cuts the model away 2 cm under the
  highest ceiling (a global clipping plane), so the seat layout shows from above.
  The detail page's triangle count is the exterior's. A hidden interior cannot be
  picked.
- **The game** (rail-island-webapp) does not read `userData.interiors` yet: its
  doors open onto an empty, see-through shell until it does. Do not import an
  export with interiors into the game before it hides and shows them.
- **Headless views**: `renderGlbThumb(glb, size, { interiors, cutAbove, xRange, view })`
  renders a posed GLB with its interiors, cut away, a car of a set and another
  viewing direction ([export.md](export.md)).

## Tests

`test/interiors.test.ts` covers:

- the clear zones and the seat rows: no row in a door's zone, on either side;
- a coach's windows, drawn after its cabin, as panes in the cabin's part on its
  far wall (a door leaf's light none), and panes on the cabins of every kit;
- the seat layouts;
- the walls stopping at a body's bottom edge that stands above the floor;
- the hidden interior part, its GLB node mark and scene extras, and its triangles
  left out of the rest model;
- `interior-<car>` revealed by that car's clips only;
- the refusal of an interior no door reveals;
- a regression for the shell chords that cut through the T3's first cabins;
- per passenger design and sampled variant: every door clip reveals an interior,
  each interior within budget, no seat triangle over a door leaf's span, and no
  interior at low detail.

`test/doors.test.ts` covers:

- a coach-kit door, folding or plug, opening onto the cabin's far wall;
- behind every leaf of every passenger design, the first face a renderer shows is
  the cabin's, or a door facing it across the car;
- for every passenger design, rays across each shut door that all meet it (the
  gap strips);
- no z-fighting with the doors half open and open and the interiors shown.

`test/catalogSweep.ts` compares the JS model's triangles, interiors included,
with the GLB's, and checks that the interiors are listed and hidden.
`test/viewerInteriors.test.ts` drives the preview's show and hide, and checks
that the highlight leaves the interiors out.
