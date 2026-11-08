# Golden Spike 4-4-0 source references

**Covers** - provenance of the Golden Spike 4-4-0 model (`proc-vehicle-american-440`): photographs, published dimensions and running numbers.
**Code** - `generator/usSteam.ts`
**See also** - [the reference](../../docs/models/us-steam.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`), the first three at 1920 px scaled to 1600 px on the long side.
Used for: The National Park Service's replicas of Jupiter (Central Pacific 60) and Union Pacific No. 119 at Golden Spike: the balloon and straight stacks, the headlamps, the cowcatchers, the colours.

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-jupiter-replica.jpg` | Central Pacific locomotive the Jupiter (45492ef1-4ed6-4b7a-914b-04f9ac758094).JPG | https://commons.wikimedia.org/wiki/File:Central_Pacific_locomotive_the_Jupiter_(45492ef1-4ed6-4b7a-914b-04f9ac758094).JPG | NPS Photo | Public domain | Jupiter close side: the cab's window and name board, the funnel, the headlamp's panel, the domes, the red drivers |
| `photo-119-replica.jpg` | Replica of Union Pacific Railroad - 119 steam locomotive (4-4-0) (Golden Spike National Historic Site, Utah, USA) 1 (23194846536).jpg | https://commons.wikimedia.org/wiki/File:Replica_of_Union_Pacific_Railroad_-_119_steam_locomotive_(4-4-0)_(Golden_Spike_National_Historic_Site,_Utah,_USA)_1_(23194846536).jpg | James St. John | CC BY 2.0 | No. 119 front three-quarter: stack, headlamp, bell yoke, domes, the wooden cab's arched windows, cowcatcher, brass cylinders, white tyres |
| `photo-60-and-119-replicas.jpg` | Replicas of Central Pacific Railroad - 60 and Union Pacific Railroad - 119 steam locomotives (4-4-0) (Golden Spike National Historic Site, Utah, USA) (22852991529).jpg | https://commons.wikimedia.org/wiki/File:Replicas_of_Central_Pacific_Railroad_-_60_and_Union_Pacific_Railroad_-_119_steam_locomotives_(4-4-0)_(Golden_Spike_National_Historic_Site,_Utah,_USA)_(22852991529).jpg | James St. John | CC BY 2.0 | Both front ends near side-on: truck wheelbase, cylinder and pilot positions and heights |
| `photo-jupiter-side34.jpg` | Replica of Central Pacific Railroad - 60 steam locomotive (4-4-0) (Golden Spike National Historic Site, Utah, USA) 1 (22825879887).jpg | https://commons.wikimedia.org/wiki/File:Replica_of_Central_Pacific_Railroad_-_60_steam_locomotive_(4-4-0)_(Golden_Spike_National_Historic_Site,_Utah,_USA)_1_(22825879887).jpg | James St. John | CC BY 2.0 | Jupiter and tender, side three-quarter: every height and the positions along the engine (Measurements) |
| `photo-jupiter-front34.jpg` | Replica of Central Pacific Railroad - 60 steam locomotive (4-4-0) (Golden Spike National Historic Site, Utah, USA) 2 (23220025425).jpg | https://commons.wikimedia.org/wiki/File:Replica_of_Central_Pacific_Railroad_-_60_steam_locomotive_(4-4-0)_(Golden_Spike_National_Historic_Site,_Utah,_USA)_2_(23220025425).jpg | James St. John | CC BY 2.0 | Jupiter front three-quarter: the funnel's size, headlamp box and bracket, smokebox plate, cowcatcher, steam chests |
| `photo-jupiter-tender.jpg` | Side view of Central Pacific no. 60 replica, Feb 17.jpg | https://commons.wikimedia.org/wiki/File:Side_view_of_Central_Pacific_no._60_replica,_Feb_17.jpg | An Errant Knight | CC BY-SA 4.0 | Jupiter's tender: the coping with C.P.R.R., the JUPITER panel, scrolls, sill panels, truck boxes |
| `photo-119-domes.jpg` | Closer side view of Union Pacific no. 119 replica, Feb 17.jpg | https://commons.wikimedia.org/wiki/File:Closer_side_view_of_Union_Pacific_no._119_replica,_Feb_17.jpg | An Errant Knight | CC BY-SA 4.0 | No. 119's Russian iron jacket colour, brass steam dome on its maroon base, red sand dome |
| `photo-119-tender.jpg` | Union Pacific No 119 tender replica.jpg | https://commons.wikimedia.org/wiki/File:Union_Pacific_No_119_tender_replica.jpg | National Park Service | Public domain | No. 119's tender: red with gold lining, the coping's UNION PACIFIC R.R., the side medallion, the rear number |
| `photo-119-head-on.jpg` | Union Pacific No. 119 01.jpg | https://commons.wikimedia.org/wiki/File:Union_Pacific_No._119_01.jpg | Farragutful | CC BY-SA 4.0 | No. 119 head-on: the cowcatcher's vee and beam width, smokebox and stack widths, headlamp, flag staffs |

## Published figures

- **Dimensions** - the replicas: 4-4-0, 60 in drivers, about 40 t engine; both met at Promontory Summit on 10 May 1869.
- **Running numbers** - 60 (Jupiter) and 119.

## Measurements

Scaled by the 60 in drivers (the model's published figure; the replicas' own may differ by a few inches):
`photo-jupiter-side34.jpg` gives 102 px/m vertically at the rear driver (156 px over 1.524 m), 110 at the
front driver and 121 at the leading truck's 30 in wheels; along the engine the local scale was taken from
each wheel's width and integrated between them.

- **Heights** (rail = 0) - running board and cab floor 1.78 m; boiler centre 2.0 m, barrel top 2.58 m
  (r 0.58), smokebox r 0.62; cab eave 3.0 m, roof 3.2 m; window 2.27 - 2.9 m; steam dome 3.42 m, its
  whistle 3.8 m; sand dome 3.3 m; bell 3.0 - 3.4 m; headlamp box 2.78 - 3.62 m, its chimney to 4.0 m;
  Jupiter's funnel from 3.3 m (r 0.3) to 4.7 m (r 0.78, 1.5 - 1.6 m across in both Jupiter photos); No. 119's
  stack 4.25 m, r 0.21 (a third of the smokebox's width head-on); cylinder axis 0.88 m, r 0.27, steam chest
  top 1.5 m; pilot beam 1.0 - 1.22 m, 2.5 m wide (2.1 smokebox widths head-on), the vee's outer corners 0.42 m
  and its prow 0.09 m above the rail.
- **Along the engine** (from the front coupler face) - pilot prow 0.2 m; leading truck axles 2.0 and 3.9 m
  (1.9 m: 237 px at 122 px/m in `photo-60-and-119-replicas.jpg`); cylinders 2.5 - 3.5 m between the truck
  wheels; smokebox front 2.0 m with the headlamp ahead of it at 1.3 - 2.0 m; stack 2.7 m; bell 3.5 m
  (No. 119 4.0 m); sand dome 5.1 m (No. 119 5.9 m, just ahead of the steam dome); drivers 6.6 and 8.75 m
  (2.15 m apart, the same in `photo-jupiter-replica.jpg`); steam dome 7.2 m; cab 8.0 - 10.25 m; drawbar 10.7 m.
- **Tender** - about 6.3 m long over its body, 2.6 m wide, sides to 2.38 m, coping to 2.7 m; 33 in wheels on
  two trucks.

