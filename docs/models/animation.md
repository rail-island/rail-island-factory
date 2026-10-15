# Animation

**Covers** - animated models: the mesh builder's animation clips and how they reach the GLB and the JS model, the steam locomotives' `running` clip (wheelsets, rods, Walschaerts valve gear), its timing contract for consumers, the site's Start and Stop buttons, and the tests.
**Code** - `generator/meshCore.ts` (`animate`, `AnimationClipSpec`, `tube`), `generator/meshBuilder.ts` (`toGlb`), `generator/threeBuilder.ts` (`toGroup`), `generator/steamGear.ts` (`RunningGear`, `N_SAMPLES`, `RUNNING_SPEED`, `RUNNING_CLIP`), `generator/glbPose.ts`, `src/ModelViewer.tsx`, `test/animation.test.ts`, `test/steam.test.ts`, `test/jsModel.test.ts`
**See also** - [steam-locomotives.md](steam-locomotives.md), [vehicles.md](vehicles.md) (parts), [export.md](export.md), [js-format.md](js-format.md), [../site/catalog-site.md](../site/catalog-site.md)

## Clips in the mesh builder

A model with parts (`MeshCore.part`: a node per part, translated to its pivot)
may add **animation clips** with `animate({ name, times, tracks })`: shared
sample times from 0, and per track a part (`node`), a `path` - `rotation`
(x, y, z, w quaternions about the part's pivot) or `translation` (the node's
position; at rest, the pivot) - and one value per time. The call refuses an
unknown part, a part name three.js cannot bind (spaces, dots, colons, slashes,
brackets), a values count that does not match the times and times that do not
start at 0 and rise.

- `toGlb` writes each clip as a glTF animation: one SCALAR time accessor (with
  its min and max) shared by a LINEAR sampler per track, channels targeting the
  part nodes. A model without clips has no `animations` key, so every existing
  GLB is byte-identical.
- `toGroup` (the JS model) puts the same clips in the group's `animations` as
  `THREE.AnimationClip`s of `QuaternionKeyframeTrack` and `VectorKeyframeTrack`
  bound to `<part>.quaternion` and `<part>.position` - what GLTFLoader returns
  for the GLB. The three.js namespace handed to an animated model's `build`
  therefore needs those three classes.
- `poseGlb(glb, k)` (`glbPose.ts`) returns the GLB with a clip applied at sample
  `k`, so the tools that read a GLB at rest (coplanar check, stats, renderers)
  can check any frame. The thumbnail, the source tree and the coplanar check of
  the build use the rest pose, sample 0.

## The steam locomotives' running gear

`RunningGear` (`steamGear.ts`) turns a spec - wheels (source x, diameter,
spokes), engines (coupled wheels, the main driver, the cylinder, crank radius,
rest phase, Walschaerts or not) - into parts and the clip **`running`**: one
revolution of the reference wheel (the main driver; a tender's first axle) in
`N_SAMPLES` = 48 steps plus the closing sample.

- **Wheelsets** (`wheelset-1`, ...): axle, both wheels (tyre as a `tube`,
  hub, spokes or disc), and on a coupled wheel its crank pin and counterweight;
  the main driver also carries the return crank. Each turns about its axle,
  clockwise seen from the right (rolling forward). A smaller wheel turns
  `d_ref / d` times per cycle, rounded to a whole number of spoke pitches, and its
  tyre has twice the spokes in facets, so the loop closes on an identical pose.
- **Per engine side** (`-right`, `-left`, plus `-front`/`-rear` on the Mallet):
  `coupling-rod` (translated round the crank circle), `crosshead` (sliding),
  `main-rod`, and with valve gear `eccentric-rod`, `expansion-link` (turning on
  its trunnion), `radius-rod`, `combination-lever`, `union-link` and
  `valve-spindle`. Each rigid link is a part pivoted at one joint, translated and
  turned about Z each sample.
- **Kinematics**: the crank pin runs on its circle (the left side a quarter turn
  behind the right); the crosshead sits a main rod's length from it on the
  cylinder axis; the expansion-link foot is where a circle about the trunnion
  meets one about the return crank; the combination lever's lean and the spindle's
  position are solved by Newton's method so the radius rod and union link keep
  the lengths they have in mid gear. Every link keeps its length at every sample
  (`solvedPoses`, tested).
- The planes of the motion are fixed outward from the wheel (`Z` in
  `steamGear.ts`): tyre, spokes, counterweights, crank boss, coupling rod, main
  rod and crosshead, return crank, eccentric rod, link, radius rod, lever, union
  link - so no two moving faces share a plane in any frame.

## Timing contract

The clip's duration is the time the reference wheel takes to roll its
circumference at **`RUNNING_SPEED` = 5 m/s** (18 km/h): `pi * d / 5` seconds,
0.88 s for 1.4 m drivers. A consumer plays it in a loop at
`timeScale = speed / 5` (metres per second), and the wheels roll without
slipping at any speed; a stationary vehicle stops the action. The tender variant
runs at the same reference speed, so a locomotive and its tender stay in step.
The game does not use the clip yet; importing it is a separate step (AGENTS.md).

## The site

`ModelViewer` reads the clips of the loaded model (`gltf.animations`, or the JS
model's `group.animations` for a non-default parameter choice) and, when there
are any, shows **Start** and **Stop** over the preview. Start plays every clip in
a loop through an `AnimationMixer` and runs a render loop only while it plays;
Stop halts the animation where it is (the render loop ends, the pose stays).
Another model or parameter choice stops it. Highlight and picking keep working,
on the moved parts.

## Tests

`test/animation.test.ts`: the glTF animation layout, no `animations` key without
clips, the `animate` guards, the three.js clip driving the part through an
`AnimationMixer`, `poseGlb`, and the `tube` primitive's face orientation.
`test/steam.test.ts`: per design and parameter combination one `running` clip
whose duration follows the reference wheel, every part but `body` animated,
linear samplers on shared times, a closed loop, every wheelset turning forward a
whole number of spoke pitches per cycle; rod lengths kept at all samples; and at
four samples no z-fighting, no wheel below the rail beyond a facet's sagitta, and
the envelope. `test/jsModel.test.ts` checks that every design's JS model builds
the GLB's clips track for track.
