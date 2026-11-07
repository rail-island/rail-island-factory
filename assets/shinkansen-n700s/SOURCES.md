# Shinkansen N700S source references

**Covers** - provenance of the Shinkansen N700S model (`proc-vehicle-shinkansen-n700s`): photographs, measurements and published dimensions.
**Code** - `generator/shinkansen.ts` (`N700S`, `N700S_FACE`, the `N7_*` tables)
**See also** - [the reference](../../docs/models/shinkansen.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), scaled to 1600 px on the long side at most.
The JR Central sets J2, J22 and J30 give the default livery; the JR Kyushu sets Y2 (car 722-8102) and Y4
the `jrKyushu` livery. The body is the same for both, so the side-on photograph of the JR Kyushu end car
also gives the JR Central nose's profile.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-n700s-j2.jpg` | Series-N700S-J2.jpg | https://commons.wikimedia.org/wiki/File:Series-N700S-J2.jpg | MaedaAkihiko | CC BY-SA 4.0 | set J2 from above: the plan of the nose, the canopy's windscreen and side windows, the blue lines and the blade |
| `photo-jr-central-n700s-front-kyoto-20180727.jpg` | JR Central N700S Front Kyoto 20180727.jpg | https://commons.wikimedia.org/wiki/File:JR_Central_N700S_Front_Kyoto_20180727.jpg | Hahifuheho | CC0 | front three-quarter: the snout, the spine, the valleys and the wing crests, the almond headlights, the windscreen |
| `photo-jr-series-n700s-j30-nozomi-4.jpg` | JR Series-N700S-J30 Nozomi-4.jpg | https://commons.wikimedia.org/wiki/File:JR_Series-N700S-J30_Nozomi-4.jpg | MaedaAkihiko | CC BY-SA 4.0 | set J30 head-on three-quarter: the windscreen and side window, the blade's shape, the pantograph covers on the roof |
| `photo-n700s-722-8102-front-side.jpg` | N700S 722-8102 Front-side.jpg | https://commons.wikimedia.org/wiki/File:N700S_722-8102_Front-side.jpg | MaedaAkihiko | CC BY-SA 4.0 | the end car side-on (set Y2): the nose's profile, the canopy's line, the headlight, the crew and passenger doors, the red skirt and line (about 125 px/m on the body's side) |
| `photo-n700sj22.jpg` | N700S系J22編成.jpg | https://commons.wikimedia.org/wiki/File:N700S%E7%B3%BBJ22%E7%B7%A8%E6%88%90.jpg | Santetsu | CC BY 4.0 | set J22 front three-quarter: the face; cars 1 and 2: window size and pitch, 13 windows on the end car, the doors, the band heights, the blade |
| `photo-n700s-y4-kamome-29.jpg` | N700S-Y4 Kamome-29.jpg | https://commons.wikimedia.org/wiki/File:N700S-Y4_Kamome-29.jpg | MaedaAkihiko | CC BY-SA 4.0 | JR Kyushu "Kamome" set Y4: the red lower body, the black canopy, the thin red line, the pantograph's cover |

## Measurements

- **Side photograph** (722-8102): 125 px/m on the body's side (door 243 px tall = 1.95 m; roof 3.6 m over
  the rail at y 745); the nose's centre line lies 1.6 m further from the camera, so lengths along the nose
  were stretched to put the crew door's front edge 9.15 m behind the tip (between the 8.6 m the photo gives
  directly and the 9.6 m the end car's 13 seat rows leave). Measured: tip 1.0 - 1.1 m high; the snout's top
  1.75 m at 1 m and 1.95 m at 2 m behind the tip; the windscreen's foot 2.3 m high 3.9 m behind the tip; the
  canopy 2.9 m high at 5 m, 3.3 m at 7 m, at the roof 9 m behind the tip; headlight 0.35 - 1.2 m behind the
  tip, 1.4 - 1.6 m high; crew door 0.6 m wide, passenger door 0.8 m, sill 1.32 m, head 3.25 m; red skirt to
  0.9 m, its bottom 0.2 - 0.3 m; JR Kyushu's thin red line 1.70 m high, dipping to 1.41 m 5.4 m behind the tip.
- **J22** (cars 1 - 2, about 87 px/m upright, window pitch 42 px = 1.04 m): windows 2.09 - 2.66 m high,
  0.5 m wide, 13 on the end car, 0.87 m behind the front passenger door; wide blue line 1.80 - 2.0 m, thin
  line 1.62 - 1.70 m; the blade from 5.45 m (1.66 m high) to its peak at 8.1 m (2.14 m) and back down to the
  crew door (1.97 m); the wide line's pointed end 0.6 m ahead of the crew door.

- **Windscreen** (J30, `photo-jr-series-n700s-j30-nozomi-4.jpg`, and a close-up crop of it the user sent):
  a grey frame about 2.4 times as wide as it is tall, its top nearly level, its ends rounded; a centre pane a
  little wider at the top than at the bottom, about 0.6 of the frame's width, with no centre pillar and one
  wiper parked from a pivot right of the centre up to the left; a grey pillar each side and a D-shaped side
  pane (about 0.2 of the width each) wrapping round the canopy's corner, darker than the centre pane.

## Published figures

- **Dimensions** - Wikipedia "N700S Series Shinkansen": end car 27.35 m, intermediate 25.0 m, 3.36 m wide, 3.6 m high, nose 10.7 m, bogie centres 17.5 m, 300 km/h (360 km/h tested), from 2020; JR Kyushu's 8000 series for the Nishi Kyushu Shinkansen (2022).
- **Width** - narrowed to 3.24 - 3.28 m (the Shinkansen gauge's 3.3 m; the E6 keeps its own).
