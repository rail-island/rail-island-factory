# World ships: passenger ships and small craft

**Covers** - the 51 passenger ships, sailing ships and small craft of the world fleet: city and car ferries, fast craft, paddle steamers and river boats, coastal and cruise ships, liners, tall ships, traditional craft, yachts and runabouts; their sizes, datums, parameters and deviations.
**Code** - `generator/worldShipsPassenger.ts`, `generator/worldShipsSmall.ts` (on `generator/hullKit.ts`)
**See also** - [world-ships.md](world-ships.md) (the kit, datums, budgets, OpenTTD and checks), [world-ships-cargo.md](world-ships-cargo.md), [world-fleet.md](world-fleet.md)

Sizes are the built model's: length over the hull (a bowsprit or a stern wheel aside), the
moulded beam, the height from the keel to the highest point. The references and figures are
in `assets/ship-<name>/SOURCES.md`.

## Passenger ships (`worldShipsPassenger.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-staten-island` | Staten Island Ferry | 94.5 x 21.0 x 24.9 | 4.1 (0.1647) | canoe / canoe | 2408 (90) | - |
| `veh-ship-star-ferry` | Star Ferry | 33.8 x 9.1 x 12.0 | 2.4 (0.2) | canoe / canoe | 1496 (78) | - |
| `veh-ship-bc-spirit` | BC Ferries Spirit Class | 167.5 x 32.9 x 33.0 | 6.7 (0.203) | canoe / canoe | 3388 (88) | - |
| `veh-ship-wsf-jumbo` | Washington Jumbo Mark II | 140.0 x 27.0 x 26.0 | 5.3 (0.2038) | canoe / canoe | 2530 (88) | - |
| `veh-ship-sydney-first-fleet` | Sydney First Fleet Ferry | 25.4 x 7.5 x 9.2 | 1.9 (0.2065) | canoe / canoe | 1015 (58) | - |
| `veh-ship-manly-freshwater` | Manly Freshwater Class | 70.4 x 12.5 x 13.0 | 2.4 (0.1846) | canoe / canoe | 1878 (68) | - |
| `veh-ship-bosphorus-vapur` | Bosphorus Ferry | 70.0 x 12.5 x 14.5 | 2.5 (0.1724) | raked / cruiser | 1999 (69) | - |
| `veh-ship-vaporetto` | Venice Vaporetto | 23.5 x 4.5 x 4.4 | 1.2 (0.2727) | raked / cruiser | 1015 (73) | - |
| `veh-ship-amsterdam-ijveer` | Amsterdam IJ Ferry | 34.0 x 13.0 x 7.0 | 1.5 (0.2143) | barge / sternwheel | 1516 (78) | - |
| `veh-ship-stena-hss` | Stena HSS 1500 | 126.6 x 40.0 x 21.6 | 4.8 (0.2222) | raked / transom, twin | 3140 (96) | - |
| `veh-ship-incat` | Incat Wave-Piercer | 98.0 x 26.6 x 22.4 | 3.5 (0.1563) | raked / transom, twin | 2989 (96) | livery: white, blue, red |
| `veh-ship-channel-ropax` | Channel Ro-Pax Ferry | 213.0 x 31.4 x 46.0 | 6.5 (0.1413) | bulbous / transom | 4469 (99) | livery: blue, white, red |
| `veh-ship-tallink-megastar` | Tallink Megastar | 212.0 x 30.6 x 45.0 | 7.1 (0.1578) | bulbous / transom | 4499 (89) | - |
| `veh-ship-jp-overnight-ferry` | Japanese Overnight Ferry | 199.9 x 27.0 x 46.9 | 6.9 (0.1471) | bulbous / transom | 4897 (89) | - |
| `veh-ship-srn4` | SR.N4 Hovercraft | 56.4 x 23.2 x 14.9 | 0.3 (0.0201) | skirt | 772 (30) | - |
| `veh-ship-raketa` | Raketa Hydrofoil | 27.0 x 5.0 x 6.3 | 1.8 (0.2857) | raked / transom, on foils | 892 (63) | - |
| `veh-ship-jetfoil` | Boeing Jetfoil | 27.4 x 8.5 x 10.0 | 2.6 (0.26) | raked / transom, on foils | 1159 (73) | livery: blue, red, green |
| `veh-ship-swiss-paddle` | Swiss Lake Paddle Steamer | 62.5 x 7.5 x 12.8 | 1.5 (0.1172) | clipper / cruiser | 2491 (99) | - |
| `veh-ship-sternwheeler` | Mississippi Sternwheeler | 116.0 x 21.0 x 27.4 | 2.6 (0.0949) | raked / sternwheel | 3259 (83) | - |
| `veh-ship-elbe-paddle` | Elbe Paddle Steamer | 68.7 x 6.6 x 10.4 | 0.9 (0.0865) | plumb / cruiser | 2549 (99) | - |
| `veh-ship-bateau-mouche` | Bateau-Mouche | 55.0 x 10.0 x 5.8 | 1.3 (0.2241) | raked / transom | 1977 (63) | - |
| `veh-ship-nile-cruiser` | Nile Cruise Boat | 72.0 x 14.4 x 13.6 | 1.6 (0.1176) | raked / transom | 2811 (73) | - |
| `veh-ship-amazon-riverboat` | Amazon Riverboat | 30.0 x 7.0 x 9.7 | 1.8 (0.1856) | raked / transom | 1915 (93) | colour: blue, green, red, yellow |
| `veh-ship-hurtigruten` | Hurtigruten Coastal Ship | 121.8 x 19.2 x 35.4 | 4.7 (0.1328) | bulbous / transom | 3911 (89) | - |
| `veh-ship-oasis` | Oasis Class Cruise Ship | 362.0 x 47.0 x 72.0 | 9.3 (0.1292) | bulbous / transom | 9700 (93) | - |
| `veh-ship-icon` | Icon Class Cruise Ship | 364.8 x 48.5 x 80.0 | 9.3 (0.1156) | bulbous / transom | 10280 (93) | - |
| `veh-ship-queen-mary-2` | Queen Mary 2 | 345.0 x 41.0 x 59.4 | 10.0 (0.1684) | bulbous / transom | 7067 (79) | - |
| `veh-ship-olympic` | Olympic Class Ocean Liner | 269.0 x 28.2 x 69.7 | 10.5 (0.1506) | plumb / cruiser | 5033 (99) | - |
| `veh-ship-ss-united-states` | SS United States | 302.0 x 31.0 x 52.4 | 9.5 (0.1813) | raked / cruiser | 5121 (79) | - |
| `veh-ship-normandie` | SS Normandie | 313.8 x 36.4 x 63.4 | 11.2 (0.1767) | clipper / cruiser | 4943 (99) | - |
| `veh-ship-expedition-cruise` | Expedition Cruise Ship | 140.0 x 23.6 x 37.4 | 5.3 (0.1417) | ice / transom | 4149 (69) | - |
| `veh-ship-river-cruise` | Rhine River Cruise Ship | 135.0 x 11.4 x 10.2 | 1.6 (0.1569) | raked / transom | 3097 (73) | livery: blue, white, red |

Notes:

- **Double-ended ferries** (Staten Island, Star Ferry, BC Spirit, WSF Jumbo Mark II, Sydney
  First Fleet, Manly Freshwater) stand on a canoe-ended hull with a pilothouse at each end and
  no rudder; the Amsterdam IJ ferry is a pontoon with ramps at both ends.
- **Fast craft**: the HSS and the Incat on twin hulls under their deck boxes (the Incat's centre
  bow as a tier between the hulls), the SR.N4 on its skirt with its four propeller pylons, the
  Raketa and the Jetfoil lifted on their foils.
- **Paddle steamers** carry side wheels in their boxes, the sternwheeler a stern wheel on its
  beams behind the transom (the model's length then exceeds the hull's).
- **Cruise ships** stack glazed decks over the hull-coloured public decks; Icon carries its
  AquaDome forward and the water slides aft. Oasis's open Central Park between two towers is
  drawn as one superstructure with a green strip (approx.).
- **Liners**: Olympic's four funnels (the aft one a dummy), United States's two, Normandie's
  three over her clipper bow and whaleback; Queen Mary 2's funnel and bridge wings.

## Sailing ships and small craft (`worldShipsSmall.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-narrowboat` | Canal Narrowboat | 21.0 x 2.1 x 2.8 | 0.6 (0.2182) | raked / cruiser | 873 (93) | colour: green, red, blue, black |
| `veh-ship-thames-barge` | Thames Sailing Barge | 25.0 x 6.0 x 26.0 | 1.0 (0.0385) | plumb / transom | 995 (69) | - |
| `veh-ship-dhow` | Dhow | 20.0 x 6.0 x 22.5 | 2.5 (0.1113) | clipper / transom | 757 (60) | - |
| `veh-ship-junk` | Chinese Junk | 30.0 x 7.0 x 24.5 | 2.5 (0.102) | barge / transom | 1083 (79) | - |
| `veh-ship-felucca` | Felucca | 9.0 x 3.0 x 13.4 | 0.6 (0.0447) | clipper / transom | 647 (50) | - |
| `veh-ship-kettuvallam` | Kerala Houseboat | 20.0 x 4.5 x 4.3 | 0.8 (0.186) | canoe / canoe | 578 (68) | - |
| `veh-ship-sedov` | Sedov | 108.0 x 14.6 x 58.0 | 6.3 (0.1086) | clipper / cruiser | 2358 (97) | - |
| `veh-ship-cutty-sark` | Cutty Sark | 64.7 x 11.0 x 47.0 | 6.1 (0.1298) | clipper / cruiser | 1882 (90) | - |
| `veh-ship-bluenose` | Bluenose | 43.6 x 8.2 x 40.2 | 4.8 (0.1194) | clipper / transom | 1371 (71) | - |
| `veh-ship-ss-great-britain` | SS Great Britain | 98.0 x 15.4 x 43.8 | 5.5 (0.1256) | clipper / cruiser | 2006 (95) | - |
| `veh-ship-viking-longship` | Viking Longship | 23.0 x 5.2 x 12.6 | 1.0 (0.0794) | canoe / canoe | 648 (46) | - |
| `veh-ship-voyaging-canoe` | Polynesian Voyaging Canoe | 18.7 x 5.4 x 13.0 | 0.8 (0.0578) | canoe / canoe, twin | 1138 (98) | - |
| `veh-ship-gondola` | Venetian Gondola | 11.0 x 1.4 x 2.3 | 0.3 (0.1087) | canoe / canoe | 518 (58) | - |
| `veh-ship-longtail` | Thai Longtail Boat | 10.0 x 1.8 x 2.2 | 0.4 (0.186) | canoe / transom | 684 (93) | - |
| `veh-ship-superyacht` | Superyacht | 90.0 x 14.0 x 24.5 | 4.0 (0.1633) | raked / transom | 2466 (73) | colour: white, navy, grey, black |
| `veh-ship-sailing-yacht` | Sailing Yacht | 12.0 x 3.9 x 18.9 | 2.0 (0.1058) | raked / transom, on foils | 742 (61) | colour: white, navy, red, green |
| `veh-ship-riva-aquarama` | Riva Aquarama | 8.0 x 2.6 x 1.9 | 0.7 (0.3684) | raked / transom | 667 (93) | - |
| `veh-ship-fishing-cutter` | North Sea Fishing Cutter | 24.0 x 7.0 x 13.6 | 2.8 (0.2059) | raked / cruiser | 987 (83) | colour: blue, green, red, black |
| `veh-ship-sampan` | Sampan | 7.0 x 2.0 x 1.8 | 0.3 (0.1944) | barge / transom | 646 (68) | - |

Notes:

- **Tall ships**: Sedov's four masts (three square-rigged with six sails each, the jigger
  gaff-rigged), Cutty Sark's three (the mizzen's spanker in place of the crossjack), Bluenose's
  two gaff masts with topsails and jibs, SS Great Britain's six masts of 1845 (the second
  square-rigged) and funnel.
- **Traditional craft**: the Thames barge's spritsail, topsail, foresail and mizzen with its
  leeboards; the dhow's and felucca's lateens, the junk's battened sails, the Viking longship's
  square sail and shields, the voyaging canoe's crab-claws on its twin hulls.
- **Small craft** are held to 4,000 triangles; their JS models (about 47 KB of kit) still stay
  under their GLBs.

## Deviations

- The gondola's hull is drawn symmetric; the real one is asymmetric (its port side fuller).
- Sails are single faces without camber except the square sails' belly; running rigging is left
  out, standing rigging is the forestays and one shroud a side.
- The superyacht, sailing yacht and fishing cutter are generic types of their class.
