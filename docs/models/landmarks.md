# Landmarks

**Covers** - the three procedurally generated secular landmarks (Brandenburg Gate, Louvre Pyramid, White House): what each reproduces, its dimensions, datums, triangle budget and where it departs from its reference.
**Code** - `generator/landmarks.ts`, `test/referenceModels.test.ts`, `test/models.test.ts`
**See also** - [skyscrapers.md](skyscrapers.md) (the mesh builder and its no-z-fighting rule), [source-tree.md](source-tree.md), [export.md](export.md)

## The designs

Each design takes the place of a hand-authored GLB in the webapp's model database
(`rail-island-webapp/db/buildings/glb/<name>.glb`). The procedural version keeps
the reference's axes, its origin (centred on the footprint, base at y = 0) and its
bounding box (`test/referenceModels.test.ts` allows 10 % per axis; all three are
within 1 %). It also keeps the reference's colours and materials. The source photos
are in `assets/<name>/`.

| id | title | reference GLB | photos | size x / y / z (m) | triangles (reference) |
|---|---|---|---|---|---|
| `bld-brandenburg-gate` | Brandenburg Gate | `brandenburg-gate.glb` | `assets/brandenburg-gate/` | 66.1 / 30.3 / 9.8 | about 10 300 (217 392) |
| `bld-louvre-pyramid` | Louvre Pyramid | `louvre-pyramid.glb` | `assets/louvre-pyramid/` | 38.8 / 22.6 / 38.8 | about 1 750 (2 024) |
| `bld-white-house` | White House | `white-house.glb` | `assets/white-house/` | 109.3 / 20.0 / 42.1 | about 19 700 (63 236) |

The budget is the 40 000 triangles that `referenceModels.test.ts` allows for a
building. All three share `LANDMARK_CATALOG`: category `Historical`, city pool
`hist_center`, `defaultScale` 1, CC0 by Rail Island.

## Brandenburg Gate

The long axis is X and the passages run along Z. The quadriga's horses face +Z.

- **Gate**: a granite step (35.2 x 9.6 m) and a sandstone stylobate up to y 1.25.
  There are six piers at x = +-3.7, +-9.25 and +-14.8, which leave five passages; the
  middle one is the widest. Each pier has a light reveal strip and a shallow niche on
  its passage walls. Twelve Doric columns stand in two rows at z = +-3.55, one at
  the front and one at the back of each pier. Each column has a 20-flute tapering
  shaft, three annulets, the echinus and a square abacus, with the abacus top at
  14.63. Each passage has a closed soffit.
- **Entablature**: architrave (14.63-15.73), a frieze with 21 triglyphs on each front
  and 5 on each end, a two-layer cornice up to 18.28.
- **Attic**: a stepped base and a block 29.6 x 7.1 m up to 22.28. Each front carries
  a light inscription panel and two shaded relief panels with raised figures. An
  attic cornice runs to 22.9, and the quadriga plinth (11.4 x 6.9 m) to 23.75.
- **Quadriga** (patina copper, gilt details): four horses abreast at x = +-0.98 and
  +-2.98. Each body is swept from ten-sided oval sections and carries a neck, mane,
  head, ears, a tail and two-segment legs with hooves. The outer two horses raise a
  foreleg. Then come the pole and yoke, a rounded chariot tub with a gilt rim, and
  two spoked wheels with gilt hubs. Victoria stands in the chariot: robe, torso and
  head, spread wings, her right arm raised to the standard, and the standard's gilt
  wreath and cross on top (y 30.34).
- **Wings** (x 17.15-33.05 on both sides): a step and stylobate, a core wall, end
  antae and five Doric columns at both the front and the back. The walls carry shaded
  door and window recesses. On top are the architrave, frieze, cornice and a parapet
  (y 11.0).

## Louvre Pyramid

- **Paving**: a stone slab 38.82 m square and 0.5 m thick.
- **Glazing**: a square pyramid 35.42 m at the base, standing on the paving, apex at
  22.08. Each face is a single glass triangle.
- **Lattice**: on each face, 17 steel members run parallel to each hip, 7 cm proud
  of the glass, which gives the rhombic lattice of the photo with 18 bays along a
  base edge. Member k runs from the base point k/18 to the opposite hip. Heavier ribs
  run along the four hips, and a steel node (y 22.56) sits on top.
- **Sill**: a dark steel frame round the foot of the glass (0.56 m), the grey base
  band of the photo.

## White House

The south front, with its bow and portico, faces +Z; the north portico faces -Z. The
East and West wings run along X.

- **Residence**: a terrace (56.5 x 30.5 m) and a block 52 x 26 m with its wall top
  at 15.4. It has a rusticated ground storey, a string course at 5.3, corner
  pilasters, the main cornice (to 16.5), a lead roof deck and eight chimneys up to
  20.04. A balustrade runs round the roof and over the bow.
- **Windows**: three storeys, 11 bays on the fronts and 5 on the ends; the south
  front leaves out the bays behind the bow. Each window has a white surround, a
  dark sash, muntins and a sill. The main floor alternates triangular and segmental
  pediments, and the top floor has plain lintels. Five windows a storey follow the
  bow.
- **South portico**: the half-round bow (radius 9 about z = 9) stands on a ground
  arcade of seven piers. On the bow are a terrace with balustrades, flights of
  stairs either side, six Ionic columns two storeys high on a radius of 10.7, the
  Truman Balcony at 10.3 and a curved entablature with a roof balustrade
  (to y 18.3, z 21.45).
- **North portico**: a platform, four Ionic columns, pilasters against the wall, the
  entablature, and a pediment with a gable behind it and a recessed tympanum. Also the
  front door with its fanlight, and a hanging lantern.
- **Wings**: a low block (x 26-45) under a cornice. A seven-column Ionic colonnade
  with French doors and a balustrade faces -Z, and windows face +Z. An end pavilion
  (x 45-54.2) has pedimented-lintel windows.

## Deviations

- The horses' muzzles reach z 4.99, against the reference's 4.91 (within tolerance).
- Doric shafts are fluted (the photo); the reference's are smooth. Our Ionic
  capitals are simplified to a rod per volute.
- Some parts the reference has but cannot be seen are left out of ours: the White
  House's bow cornice and bow roof deck, which sit under the south portico's
  entablature. The White House also gains elements its reference lacks: south-side
  windows on the wings, a window at each pavilion's end and the portico stairs.
- The White House wings keep the reference's layout, with the colonnade on the
  north (-Z) side. The real colonnades face the gardens.
- The pyramid's sill is darker than the reference's (from the photo), and its glass
  and lattice keep the reference's colours.

## Procedural export contract

All current export IDs use `proc-building-` or `proc-vehicle-`; source/reference
names in older tables identify the original models. See [legacy-mapping.md](legacy-mapping.md)
for the authoritative ID, scale and runtime conversion contract. Ground vehicles
have no exported `defaultScale`; buildings, aircraft and ships use 1 except the
Eiffel Tower placement exception.
