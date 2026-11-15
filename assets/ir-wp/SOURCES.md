# IR WP source references

**Covers** - provenance of the IR WP model (`proc-vehicle-ir-wp`): photographs of 7200, 7161 'Akbar', 7043 and other WPs, and the published figures.
**Code** - `generator/inWp.ts`, `generator/worldSteamLocos.ts`
**See also** - [the reference](../../docs/models/india-trains.md)

## Photographs

Downloaded from Wikimedia Commons (`pnpm refs:fetch`). No orthographic side view of a WP is on
Commons: the side is read from the three-quarter views with a projective fit over the drivers
(13 ft coupled wheelbase), the heights from the buffer centres (1.07 m) and the nose's ring
(about 149 px/m at the front of `photo-682-...`).

| file | original | URL | author | licence | use |
|---|---|---|---|---|---|
| `photo-682-indiadelhimuseum-19931226.jpg` | 682 IndiaDelhiMuseum 19931226.jpg | https://commons.wikimedia.org/wiki/File:682_IndiaDelhiMuseum_19931226.jpg | MaltaGC (Nigel Tout) | CC BY-SA 4.0 | 7200 (Baldwin 1947), front three-quarter: axle spacing, boiler height and radius, the running board's S sweep to the buffer beam, cylinders between the bogie wheels, cowcatcher, chrome bands, the low chimney |
| `photo-wp7200.jpg` | WP7200.jpg | https://commons.wikimedia.org/wiki/File:WP7200.jpg | Ramesh Lalwani | CC BY 2.0 | 7200 head-on: the eight-pointed star, headlamp at the nose's point, buffer beam figures "7200 WP" |
| `photo-steam-engine-renamed-akbar.jpg` | Steam Engine renamed Akbar.jpg | https://commons.wikimedia.org/wiki/File:Steam_Engine_renamed_Akbar.jpg | Ramesh Lalwani | CC BY 2.0 | 7161 'Akbar' front: star, handrails rising past the nose, "7161 WP/1" on the beam |
| `photo-a-clw-built-wp-locomotive-christened-as-akbar-now-used-in-st.jpg` | A CLW built WP locomotive christened as Akbar, now used in steam charter runs - Flickr - Dr. Santulan Mahanta.jpg | https://commons.wikimedia.org/wiki/File:A_CLW_built_WP_locomotive_christened_as_Akbar,_now_used_in_steam_charter_runs_-_Flickr_-_Dr._Santulan_Mahanta.jpg | Santulan Mahanta | CC BY 2.0 | 7161 head-on: nose outline and depth, star proportions (long points to the rim, diagonals shorter), cowcatcher grid |
| `photo-a-clw-built-wp-locomotive-now-used-in-steam-charter-runs-fli.jpg` | A CLW built WP locomotive now used in steam charter runs - Flickr - Dr. Santulan Mahanta.jpg | https://commons.wikimedia.org/wiki/File:A_CLW_built_WP_locomotive_now_used_in_steam_charter_runs_-_Flickr_-_Dr._Santulan_Mahanta.jpg | Santulan Mahanta | CC BY 2.0 | 7161 front three-quarter: the green-and-yellow livery (green valance sweep, cylinders, cab and tender, yellow lining, black boiler, black wheels with white tyres), cab roof about level with the boiler top |
| `photo-indian-railways-wp-7043-varanasi.jpg` | Indian Railways WP 7043 Varanasi.jpg | https://commons.wikimedia.org/wiki/File:Indian_Railways_WP_7043_Varanasi.jpg | Hans-Peter Bärtschi | CC BY-SA 4.0 | 7043 in service: the black livery with crimson valance, beam and cylinders |
| `photo-northern-railway-wp.jpg` | Northern Railway WP.tif | https://commons.wikimedia.org/wiki/File:Northern_Railway_WP.tif | Hans-Peter Bärtschi | CC BY-SA 4.0 | in service, front three-quarter: the star on the nose, the chrome rim, the sweep plates |
| `photo-steam-loco-wp-7397-national-rail-museum-new-delhi.jpg` | Steam Loco WP 7397 National Rail Museum New Delhi.JPG | https://commons.wikimedia.org/wiki/File:Steam_Loco_WP_7397_National_Rail_Museum_New_Delhi.JPG | Gryffindor | CC0 | a museum scale model of 7397: the whole side layout (smooth boiler top, low chimney, cab, high rectangular tender on two bogies) |

## Published figures

- **Figures** - Wikipedia, [Indian locomotive class WP](https://en.wikipedia.org/wiki/Indian_locomotive_class_WP): 4-6-2, 5 ft 6 in gauge, drivers 5 ft 7 in (1.702 m), bogie and trailing wheels 3 ft 7 in (1.092 m), 77 ft 5 3/8 in (23.60 m) over the buffers with the tender, boiler 5 ft 11 in diameter, cylinders 20 1/4 x 28 in, 5,500 gallons and 15 tons of coal; power, top speed and first year as the design states them (`generator/inWp.ts`, `generator/worldSteamLocos.ts`, `generator/openttdTable.ts`, [india-trains.md](../../docs/models/india-trains.md)).
