# Vehicle rig

**Covers** - what of a vehicle the game may move after loading it: the steered front wheels, an articulated vehicle's sections and the joints (bellows) between them, a rail vehicle's supports and turning bogies; how they are laid out as GLB nodes, the `rig` that names them in the GLB, the meta entry and the JS model, the pose and joint functions the JS model exports, and the model page's Pose sliders.
**Code** - `generator/rig.ts`, `generator/trucks.ts` (`steered`), `generator/meshCore.ts` (`part` with a parent, `bogie`, `axleAt`, the `rig` accessor), `generator/meshBuilder.ts` (`toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/vehicleParts.ts` (`steeredWheels`), `generator/busAssembly.ts`, `generator/tramKit.ts` (`articulate`), `generator/jsModel.ts`, `generator/catalog.ts` (`MetaEntry.rig`), `generator/tgv.ts` (the articulated trailer set), `src/catalogQuery.ts` (`poseControls`, `poseOf`, `steerLockDeg`, `posePreview`, `previewKey`, `pageKey`), `src/ModelDetail.tsx`, `src/ModelViewer.tsx`, `test/rig.test.ts`, `test/railSupports.test.ts`, `test/collision.ts`
**See also** - [vehicles.md](vehicles.md), [buses.md](buses.md), [js-format.md](js-format.md), [export.md](export.md), [../site/catalog-site.md](../site/catalog-site.md)

## The idea

Besides playing clips ([animation.md](animation.md)), the game moves named nodes
directly: it poses an articulated bus as a hinged chain of section nodes with a
bellows re-skinned between them every frame, and turns steered wheels by writing a
node's rotation (rail-island-webapp, `models/ArticulatedBus.ts`).
A factory vehicle is built for exactly that: everything that moves is its own node,
and a `rig` says which.

| What | Nodes | How it moves |
|---|---|---|
| steered wheels | `wheel-front-left` at -Z, `wheel-front-right` at +Z on every road vehicle (a second steered axle's `wheel-front-2-left`, ...), children of the front body's node | each turns about its own +Y; its origin is the wheel's centre (on the steering axis) |
| sections | `section0`, `section1`, ... (the American truck: `truck`, `trailer`) | section i turns about its origin, the hinge with section i - 1, which section i - 1 carries |
| joints | `joint0`, ... between sections i and i + 1 | not rigid: re-drawn between the two sections wherever they are (`renderJoint`) |
| bogies | `bogie0`, `bogie1`, ... on a rail vehicle, top-level nodes | each is placed on the track at its own distance and turned to it; its origin is its centre on the track centre line at axle height |

A rigid vehicle has a body node (`body` for a bus and the mixer) holding the steered
wheels and no sections. A semi-truck is two sections (tractor and trailer, hinged at
the king pin) and no joint. Every road vehicle has a rig - the American truck, the
three trucks reproduced from the game ([trucks.md](trucks.md)) and the buses
([buses.md](buses.md)). Every rail vehicle has one too: its **supports** (below),
and no `steer` (a rail vehicle follows the track). The articulated trams - the
KT8D5, KT4 and GT4 ([trams.md](trams.md)) - the TGV's trailer set
([foreign-units.md](foreign-units.md)) and the VT 18.16's full train, every car a
section on its own two bogies ([dr-vt1816.md](dr-vt1816.md)), also have sections and joints; the site shows
only the joint sliders. The air and water vehicles have none.

## The rig

`VehicleRig` (`generator/rig.ts`), metres and the model frame (+X forward, +Y up, +Z
right), limits in degrees:

```ts
interface VehicleRig {
  supports?: Array<{ x; node?; axles; sections: number[] }>;  // a rail vehicle's, by x
  steer?: { axles: Array<{ nodes: [atMinusZ, atPlusZ]; wheelbase }>; maxAngleDeg; track };
  sections?: Array<{ node; pivot: [x, y, z] }>;      // front first; pivot = the node's rest origin
  joints?: Array<{ node; sections: [front, rear]; front; rear; profile: Array<[z, y]>; folds; depth; material }>;
  maxBendDeg?: number;
}
```

- `steer.axles` lists the steered axles front first (one, or two on the 8x4 mixer),
  each with its two wheel nodes - the one at -Z first - and its `wheelbase`, from the
  axle back to the axle the vehicle turns about (a tandem's middle; an articulated
  bus's front-section axle). `maxAngleDeg` is the front axle's **inner** wheel's lock;
  `track` is the distance between an axle's two steering axes.
- `sections[i].pivot` is section i's hinge with the section ahead (`[0, 0, 0]` for the
  first). For a bus it is the middle of the gap the joint covers, 0.6 m above the
  road; for the truck the king pin.
- A joint is described, not stored: its front and rear faces' x, its inner (valley)
  cross-section, the number of outer ridges and their depth. The GLB holds its rest
  pose, drawn by the same function the game calls.

The rig travels three ways: the GLB's **scene extras** (`scenes[0].extras.rig`,
which three's GLTFLoader puts in `scene.userData.rig`) and the vehicle's **meta
entry** (`vehicles.meta.json`, `rig`) carry the default build's; the JS model's
group carries the rig of the parameters it was built with (`group.userData.rig`) -
a Karosa Long variant's hinge and joint faces are its own. Pose a model with the
rig it carries. A model without one has no `rig` key and unchanged bytes.

## Rail supports and turning bogies

A rail vehicle tells the game where it rides on the track. `rig.supports` lists, by
model x, every point it stands on:

- a **bogie** - two or three axles close together, the four- and six-axle vehicles
  and the Bo'Bo'Bo' DNT 184.5 - with `node` naming its own top-level node, pivoted
  at `(x, axle height, 0)`, `x` the mean of its axles;
- a **lone wheelset** outside any bogie - a two-axle coach, wagon or railcar, a
  small diesel's rigid axles, a steam locomotive's wheelsets - without `node`;
  per section only the outermost two are listed.

`sections` names the sections a support carries: `[0]` on a rigid vehicle, the
section it is drawn in on an articulated one, and two neighbours for a **bogie under
a joint** (the KT8D5's two middle bogies, the TGV set's Jacobs bogies). The game puts
each section on the track by its two outermost supports; a section with fewer hangs
on its joints, and a middle support follows without constraining the body. Each
bogie node is posed on the track at its own distance and turned to it, so on a curve
it turns under the body.

Nothing declares a support by hand. A bogie builder draws inside `m.bogie(fn)`,
which moves every triangle drawn in `fn` into the next `bogie<n>` node (a builder
drawn inside another bogie's is the same bogie; `bogie(fn, { sections })` names a
joint bogie's two sections). A scope named `wheelset` records its axle when it
closes - the centre of its triangles - and `axleAt(x, y)` records one drawn
otherwise (the steam locomotives' wheelset parts, the legacy two-axle wagons'). The
`rig` accessor of the mesh builder then works the supports out from what was drawn,
so a model that draws no wheelset has none and its bytes are unchanged.

A rigid rail vehicle with bogies is a body node named `vehicle` (the JS group: the
body's meshes on the group itself) plus a node per bogie; the GLB writes a
material's triangles node by node, and the source tree's ranges follow
([source-tree.md](source-tree.md)). The distant model (`lowDetail`) has no parts and
no rig: the game turns bogies in the near model only.

## Parts with a parent

The nodes are the mesh builder's parts ([vehicles.md](vehicles.md)). A part may name
a parent - an earlier part - and is then its child node, translated by its pivot
less the parent's:

```ts
m.part("truck", [0, 0, 0], () => tractor(m));
steeredWheels(m, "truck", FRONT_AXLE, AXLE_Y, (s, z0, z1) => wheel(m, FRONT_AXLE, z0, z1, s), [0.86, 1.16]);
m.part("trailer", PIVOT, () => trailer(m));
```

The parts after a parent must all be its descendants until the last one is drawn, so
the drawing order is the node tree's depth-first order - the order the GLB numbers a
material's triangles in, which the source tree's ranges rely on
([source-tree.md](source-tree.md)). `part()` throws otherwise. Each part is still a
top-level scope of the source tree.

## Steering

Every steered wheel aims at one turning centre on the line of the axle the vehicle
turns about (Ackermann): `steerAngles(steer, angle)` gives each axle's pair of Y
rotations, the -Z wheel first, for the angle of a virtual wheel midway along the
front axle - positive counter-clockwise from above, toward -Z, which is a left turn in
the factory's frame for every road vehicle. The inner wheels turn tighter, and a second
steered axle, nearer the turning line, less than the first. `steerLock(steer)` is
the largest such angle, the one that brings the front inner wheel to `maxAngleDeg`. A wheel only ever
turns about its own vertical, so nothing else of it moves: the tyre, disc and hub
stay round its centre. The front wheel arches are long enough for the tyre at lock.

## The hinged chain and the joint

`pose(group, { steer, bend }, rig?)` poses a built model in place - the GLB's scene
or the JS group, both carry the nodes and the rig:

1. turns the steered wheels (`steerAngles`);
2. keeps section 0 where it is - its node's position and yaw, at rest its rest
   place - and lays every section behind it out as a chain: the hinge of section i
   is where section i - 1 now carries it, and section i's yaw is section i - 1's plus
   `bend[i - 1]` (radians, + counter-clockwise from above);
3. re-draws every joint (`renderJoint`). `pose(group, {})` is the rest pose.

The game is expected to pose the sections itself, on the road, as it does today; it
then calls `renderJoint(group, i)` for each joint. That reads the two section nodes'
**world matrices**, so it works however they got there - nested, re-parented into
wrappers, scaled - and writes the joint mesh's positions and normals in place, in
the mesh's own frame: the triangle count never changes, so nothing is re-allocated
per frame.

**Each copy owns its joint.** three's `clone()` shares a geometry between every copy
of a loaded model, and every vehicle bends its own joint, so the first re-draw of a
copy's joint makes the geometry that copy's (`ownGeometry`: a geometry another mesh
already wrote is cloned once; the game's ArticulatedBus clones its bellows for the
same reason). A copy shows the template's joint until its own first re-draw.

### Importing

The game re-encodes every GLB (weld, then meshopt quantization). For a rigged
vehicle that is fine as long as every rig node - the sections, the steered wheels
and the joints - is passed to the encode as a **pivot node**, so quantization does
not move its origin (which is the rotation axis). The joint mesh itself may be
welded and quantized, or moved onto a child node whose matrix carries the
dequantization: `renderJoint` finds the mesh under the joint node, works in that
mesh's frame, and the first time replaces a welded (indexed) or quantized geometry
with a plain float triangle list of the joint's own layout.

`jointTriangles(joint, sections, ma, mb)` is the joint itself, three.js-free: rings
of the cross-section stacked from the front face (t = 0) to the rear face (t = 1),
the odd ones grown outward by `depth` (the ridges, so the accordion reads without a
texture). Every vertex rides **both** sections: its position under the front
section's matrix and under the rear section's, blended by its t. The rings at the two
faces therefore move exactly with their sections, and the ones between fan out on
the outside of a bend and close up on the inside - at any yaw, pitch or roll, with no
gap. This is the game's bellows skin (each vertex rides its section) with the
vertices between the faces blended instead of snapped, a corrugated rubber
material in place of the three textured quads, and any number of sections - a
three-section tram is two joints.

## In the JS model

A rigged model's module (`export/js/<id>.js`, [js-format.md](js-format.md))
exports, beside `build` and `params`:

```js
import build, { pose, renderJoint, steerAngles, steerLock, jointTriangles } from "./veh-karosa-long.js";
const bus = build(THREE, { variant: "b961" });
pose(bus, { steer: 0.3, bend: [-0.5] });  // radians
// or: pose the sections yourself, then
renderJoint(bus, 0);
```

## On the site

A rigged model's page has a **Pose** block above the tabs: a Steering slider
(plus or minus the steering lock, degrees) and one per hinge - "Trailer" for a
semi-truck, "Joint" for a two-section bus, "Joint 1", "Joint 2" beyond. Moving one fetches
the model's JS module once and calls its `pose()` on the preview (the GLB at the
default parameters, the JS build otherwise) with the preview's own rig
(`posePreview`), and only on the model the page shows now (`previewKey`); Reset
returns to rest. The pose is not
in the URL, and the thumbnail, specs and source tree stay the rest pose's. The slider
limits come from the catalog record's `rig` (`poseControls`); `steerLockDeg` repeats
`steerLock`'s formula because the site may import only types from `generator/`, and a
test holds the two equal.

## Tests

`test/rig.test.ts`: Ackermann angles meet at one centre and reach the lock, a second
steered axle aimed at the same centre; a joint stays sealed to both sections under
arbitrary matrices and winds outward; every road vehicle is rigged and steered, the other rigged vehicles
are articulated rail vehicles with sections and joints and no steering; steered
wheels are children of the front body, named `-left` at -Z, mirrored and `track`
apart, axles front first; `pose()` on the JS module turns every wheel by
`steerAngles`, keeps every hinge where both of its sections put it, draws every joint
where `jointTriangles` puts it in world space (inside a scaled, rotated parent too)
and returns to the build's geometry at rest; two copies of a model bend their own
joints; a joint welded, quantized and moved onto a child node, as the game's encode
leaves it, re-draws sealed; the chain follows a moved section 0; a three-section
vehicle, loaded through GLTFLoader, bends at both hinges; every semi-trailer swings
clear of its tractor and every steered tyre clears the body at full lock, checked
triangle against triangle (`test/collision.ts`); the site poses a non-default
variant with its own rig, and its sliders, preview key and arrow keys.
The catalog sweep (`test/catalogSweep.ts`) checks the JS group's `userData.rig` against
the GLB's scene extras and poses every rigged vehicle; `test/export.test.ts` the meta entries' `rig`.

## Low level of detail

Every standalone JS model accepts `build(THREE, params, lod = false)`. Set the third
argument to `true` for its budgeted distant mesh. The factory detail view exposes
this through **Low level of detail** and reports the preview triangle count.
A rigid vehicle's LOD has no rig. An articulated vehicle's LOD keeps its sections
(`section<i>` at the full rig's pivots) and joints (`joint<i>`), and its group
carries a rig of `sections`, `joints` and `maxBendDeg` only, so `pose` and
`renderJoint` bend it as the full model; its bogies and steered wheels do not
turn. Full-detail GLBs and source trees are unchanged.
See [lod.md](lod.md) for budgets, geometry and verification.
