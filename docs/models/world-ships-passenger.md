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
| `veh-ship-staten-island` | Staten Island Ferry | 94.5 x 21.0 x 24.9 | 4.1 (0.1647) | canoe / canoe | 6324 (100) | - |
| `veh-ship-star-ferry` | Star Ferry | 33.8 x 9.1 x 12.0 | 2.4 (0.2) | canoe / canoe | 4200 (98) | - |
| `veh-ship-bc-spirit` | BC Ferries Spirit Class | 167.5 x 32.9 x 34.2 | 6.7 (0.1959) | canoe / canoe | 8396 (98) | - |
| `veh-ship-wsf-jumbo` | Washington Jumbo Mark II | 140.0 x 27.0 x 27.0 | 5.3 (0.1963) | canoe / canoe | 6842 (98) | - |
| `veh-ship-sydney-first-fleet` | Sydney First Fleet Ferry | 25.4 x 7.5 x 9.2 | 1.9 (0.2065) | canoe / canoe | 3131 (98) | - |
| `veh-ship-manly-freshwater` | Manly Freshwater Class | 70.4 x 12.5 x 14.6 | 2.4 (0.1644) | canoe / canoe | 5370 (100) | - |
| `veh-ship-bosphorus-vapur` | Bosphorus Ferry | 70.0 x 12.5 x 15.5 | 2.5 (0.1613) | raked / cruiser | 5279 (89) | - |
| `veh-ship-vaporetto` | Venice Vaporetto | 23.5 x 4.5 x 5.4 | 1.2 (0.2222) | raked / cruiser | 2023 (93) | - |
| `veh-ship-amsterdam-ijveer` | Amsterdam IJ Ferry | 34.0 x 13.0 x 7.4 | 1.5 (0.2027) | barge / sternwheel | 3784 (98) | - |
| `veh-ship-stena-hss` | Stena HSS 1500 | 126.6 x 40.0 x 28.4 | 4.8 (0.169) | raked / transom, twin | 6502 (96) | - |
| `veh-ship-incat` | Incat Wave-Piercer | 98.0 x 26.6 x 23.4 | 3.5 (0.1496) | raked / transom, twin | 6315 (96) | livery: white, blue, red |
| `veh-ship-channel-ropax` | Channel Ro-Pax Ferry | 213.0 x 31.4 x 46.0 | 6.5 (0.1413) | bulbous / transom | 9377 (99) | livery: blue, white, red |
| `veh-ship-tallink-megastar` | Tallink Megastar | 212.0 x 30.6 x 45.0 | 7.1 (0.1578) | bulbous / transom | 9551 (99) | - |
| `veh-ship-jp-overnight-ferry` | Japanese Overnight Ferry | 199.9 x 27.0 x 46.9 | 6.9 (0.1471) | bulbous / transom | 10217 (99) | - |
| `veh-ship-srn4` | SR.N4 Hovercraft | 56.4 x 23.2 x 14.9 | 0.3 (0.0201) | skirt | 2473 (100) | - |
| `veh-ship-raketa` | Raketa Hydrofoil | 27.0 x 5.0 x 7.1 | 1.8 (0.2535) | raked / transom, on foils | 2704 (93) | - |
| `veh-ship-jetfoil` | Boeing Jetfoil | 27.4 x 8.5 x 11.8 | 2.6 (0.2203) | raked / transom, on foils | 3203 (99) | livery: blue, red, green |
| `veh-ship-swiss-paddle` | Swiss Lake Paddle Steamer | 63.5 x 7.8 x 24.5 | 1.6 (0.0652) | plumb / cruiser | 7572 (93) | - |
| `veh-ship-sternwheeler` | Mississippi Sternwheeler | 116.0 x 21.0 x 28.4 | 2.6 (0.0915) | raked / sternwheel | 8187 (93) | - |
| `veh-ship-elbe-paddle` | Elbe Paddle Steamer | 68.7 x 6.9 x 10.6 | 1.0 (0.0943) | plumb / cruiser | 6073 (99) | - |
| `veh-ship-bateau-mouche` | Bateau-Mouche | 55.0 x 10.0 x 6.6 | 1.3 (0.197) | raked / transom | 4433 (93) | - |
| `veh-ship-nile-cruiser` | Nile Cruise Boat | 72.0 x 14.4 x 15.2 | 1.6 (0.1053) | raked / transom | 6767 (93) | - |
| `veh-ship-amazon-riverboat` | Amazon Riverboat | 30.0 x 7.0 x 10.8 | 1.8 (0.1667) | raked / transom | 3941 (93) | colour: blue, green, red, yellow |
| `veh-ship-hurtigruten` | Hurtigruten Coastal Ship | 121.8 x 19.2 x 35.4 | 4.7 (0.1328) | bulbous / transom | 9767 (99) | - |
| `veh-ship-oasis` | Oasis Class Cruise Ship | 362.0 x 47.0 x 75.2 | 9.3 (0.1237) | bulbous / transom | 16878 (93) | - |
| `veh-ship-icon` | Icon Class Cruise Ship | 364.8 x 48.5 x 80.0 | 9.3 (0.1156) | bulbous / transom | 16862 (93) | - |
| `veh-ship-queen-mary-2` | Queen Mary 2 | 345.0 x 41.0 x 63.4 | 10.0 (0.1577) | bulbous / transom | 14881 (99) | - |
| `veh-ship-olympic` | Olympic Class Ocean Liner | 269.0 x 28.2 x 70.0 | 10.5 (0.15) | plumb / cruiser, counter | 19749 (93) | - |
| `veh-ship-ss-united-states` | SS United States | 302.0 x 31.0 x 53.0 | 9.5 (0.1794) | raked / cruiser | 11111 (99) | - |
| `veh-ship-normandie` | SS Normandie | 313.8 x 36.4 x 63.4 | 11.2 (0.1767) | clipper / cruiser | 10157 (99) | - |
| `veh-ship-expedition-cruise` | Expedition Cruise Ship | 140.0 x 23.6 x 37.4 | 5.3 (0.1417) | ice / transom | 9529 (99) | - |
| `veh-ship-river-cruise` | Rhine River Cruise Ship | 135.0 x 11.4 x 12.0 | 1.6 (0.1333) | raked / transom | 7123 (93) | livery: blue, white, red |

Notes:

- **Double-ended ferries** (Staten Island, Star Ferry, BC Spirit, WSF Jumbo Mark II, Sydney
  First Fleet, Manly Freshwater) stand on a canoe-ended hull with a pilothouse at each end and
  no rudder; the Amsterdam IJ ferry is a pontoon with ramps at both ends.
- **Fast craft**: the HSS and the Incat on twin hulls under their deck boxes (the Incat's centre
  bow as a tier between the hulls), the SR.N4 on its skirt with its four propeller pylons, the
  Raketa and the Jetfoil lifted on their foils.
- **Paddle steamers** carry side wheels in their boxes, the sternwheeler a stern wheel on its
  beams behind the transom (the model's length then exceeds the hull's). The Elbe and Swiss
  steamers close their wheels in the paddle item's `casing` (flat outer face, end walls and top,
  its foot over the water) and widen the main deck with its `sponson` guards fore and aft; the
  deck over the casings ("paddle bridge") lies flush with the sun or upper deck. The Elbe
  steamer follows the Dresden (1926): the shaft at 0.67 L, the varnished wheelhouse on the sun
  deck ahead of the white funnel, the funnel mast forward of the casings, the awning over the
  sun deck, green boot-topping. The Swiss steamer follows the Stadt Luzern (1928): the shaft at
  0.41 L, the arched fanlight on the casing, the upper saloon under its flat roof, the
  bridge-deck house and wheelhouse, the white funnel with its black top and red cowls, the
  promenade deck forward on stanchions, two masts raked aft, red-brown boot-topping.
- **Cruise ships** stack glazed decks over the hull-coloured public decks; Icon carries its
  AquaDome forward and the water slides aft. Oasis's open Central Park between two towers is
  drawn as one superstructure with a green strip (approx.).
- **Liners**: Olympic's four funnels (the aft one a dummy), United States's two, Normandie's
  three over her clipper bow and whaleback; Queen Mary 2's funnel and bridge wings.
- **Olympic** (as built, 1911) is measured off the class's profile plan: the hull black up to
  the B deck along the sheer (a `bulwark` over the C deck, so the distant model draws the
  decks as one block), the forecastle and poop with the well decks between them and the
  house, the white B-deck strake flush with the hull, the A-deck promenade open its whole
  length under the boat deck (the cabins set in, their walls in shade, a screen and
  stanchions at the side), the boat deck full width with its six deckhouses, the bridge and
  its wings, sixteen boats on chocks in their davits (four a side forward and aft), the four
  raked funnels standing on the boat deck through their houses with steam pipes and guys,
  the raked masts with the crow's nest and the wireless aerials, the cranes and hatches of
  the wells, forecastle and poop, the docking bridge, the gold line and the counter stern
  (`counter`) over its sternpost and rudder.

The first 21 (the Staten Island ferry to the bateau-mouche) are **detailed ships** (see
"Detail" in [world-ships.md](world-ships.md)): `detailed()` gives every house tier its deck edge
(and its front windows where the front is square), `passengerFittings()` the rubbing fender,
the anchors (at both ends of a double-ended ferry), the bollards and the draft marks; each adds
the railings round its open decks, liferafts and lifeboats, exhaust pipes, radomes and radar
masts, and its own: the ro-pax ships' car deck openings, stern door and rescue boat, the
hovercraft's skirt band, rudders, intakes and bow ramp, the paddle steamers' awnings,
flagstaffs and lifebuoys, the sternwheeler's stack crowns, landing stage and bell, the IJ
ferry's shelters and lamp posts. The other eleven are detailed too: the river boats' promenade rails, loungers and pools; the
Hurtigruten's rails, liferafts and freefall boat; the cruise ships' balcony glass, davits and
radomes; the liners' rows of portholes, boat-deck davits and rails, Olympic's funnel guys, cowl
ventilators, well-deck cranes and aerials; the Amazon boat's canoe on the roof and cargo.

## Sailing ships and small craft (`worldShipsSmall.ts`)

| id | title | L x B x H (m) | draft (draftFrac) | bow / stern | triangles (LOD) | params |
|---|---|---|---|---|---|---|
| `veh-ship-narrowboat` | Canal Narrowboat | 21.0 x 2.1 x 2.8 | 0.6 (0.2182) | raked / cruiser | 2277 (93) | colour: green, red, blue, black |
| `veh-ship-thames-barge` | Thames Sailing Barge | 25.0 x 6.0 x 26.0 | 1.0 (0.0385) | plumb / transom | 3417 (99) | - |
| `veh-ship-dhow` | Dhow | 20.0 x 6.0 x 22.5 | 2.5 (0.1113) | clipper / transom | 3399 (100) | - |
| `veh-ship-junk` | Chinese Junk | 30.0 x 7.0 x 24.5 | 2.5 (0.102) | barge / transom | 3763 (99) | - |
| `veh-ship-felucca` | Felucca | 9.0 x 3.0 x 13.4 | 0.6 (0.0447) | clipper / transom | 2305 (100) | - |
| `veh-ship-kettuvallam` | Kerala Houseboat | 20.0 x 4.5 x 4.3 | 0.8 (0.186) | canoe / canoe | 1568 (98) | - |
| `veh-ship-sedov` | Sedov | 108.0 x 14.6 x 58.0 | 6.3 (0.1086) | clipper / cruiser | 6107 (100) | - |
| `veh-ship-cutty-sark` | Cutty Sark | 64.7 x 11.0 x 46.8 | 6.1 (0.1305) | clipper / cruiser | 8590 (98) | - |
| `veh-ship-bluenose` | Bluenose | 43.6 x 8.2 x 40.2 | 4.8 (0.1194) | clipper / transom | 3977 (81) | - |
| `veh-ship-ss-great-britain` | SS Great Britain | 98.0 x 15.4 x 44.8 | 5.5 (0.1228) | clipper / cruiser | 8561 (100) | - |
| `veh-ship-viking-longship` | Viking Longship | 23.0 x 5.2 x 12.6 | 1.0 (0.0794) | canoe / canoe | 1872 (96) | - |
| `veh-ship-voyaging-canoe` | Polynesian Voyaging Canoe | 18.7 x 5.4 x 13.0 | 0.8 (0.0578) | canoe / canoe, twin | 2378 (98) | - |
| `veh-ship-gondola` | Venetian Gondola | 11.0 x 1.4 x 2.3 | 0.3 (0.1087) | canoe / canoe | 1060 (98) | - |
| `veh-ship-longtail` | Thai Longtail Boat | 10.0 x 1.8 x 2.4 | 0.4 (0.1667) | canoe / transom | 2094 (93) | - |
| `veh-ship-superyacht` | Superyacht | 90.0 x 14.0 x 24.5 | 4.0 (0.1633) | raked / transom | 5730 (93) | colour: white, navy, grey, black |
| `veh-ship-sailing-yacht` | Sailing Yacht | 12.0 x 3.9 x 18.9 | 2.0 (0.1058) | raked / transom, on foils | 1704 (91) | colour: white, navy, red, green |
| `veh-ship-riva-aquarama` | Riva Aquarama | 8.0 x 2.6 x 1.9 | 0.7 (0.3684) | raked / transom | 1547 (93) | - |
| `veh-ship-fishing-cutter` | North Sea Fishing Cutter | 24.0 x 7.0 x 13.6 | 2.8 (0.2059) | raked / cruiser | 2942 (93) | colour: blue, green, red, black |
| `veh-ship-sampan` | Sampan | 7.0 x 2.0 x 1.8 | 0.3 (0.1923) | barge / transom | 2060 (98) | - |

Notes:

- **Tall ships**: Sedov's four masts (three square-rigged with six sails each, the jigger
  gaff-rigged), Cutty Sark's three (measured off the side photographs: fore, main and mizzen
  at 0.34, 0.59 and 0.81 of the hull from the stem; white lower masts and topmasts over
  varnished poles, black tops and yards slung on their masts; fore and main with course,
  double topsails, topgallant and royal, the main a skysail, the mizzen a bare crossjack yard
  under its topsails and the spanker; shrouds with ratlines to deadeyes on the hull side,
  topmast and topgallant shrouds to the tops and crosstrees, backstays, the stays mast to
  mast; bowsprit, jib-boom and flying jib-boom out over the stem head with dolphin striker,
  martingale, bobstays and four jibs on their stays; the Muntz metal bottom, the gilt sheer
  line, the bow and counter scrollwork, Nannie; white-lined bulwarks with a teak cap, open
  rails on the forecastle and the short poop, two teak deckhouses, the boats on the after one
  under davits), Bluenose's
  two gaff masts with topsails and jibs, SS Great Britain's six masts of 1843 as preserved in Bristol (the second
  square-rigged and painted white with black bands, the others gaff-rigged, jibs on the steep
  bowsprit), the round funnel on its casing between masts 2 and 3, the band of painted gunports
  and the gilt trailboards, buff companionways and saloon skylights on the flush deck and boats
  hanging in davits outboard of the bulwark.
- **Traditional craft**: the Thames barge's spritsail, topsail, foresail and mizzen with its
  leeboards; the dhow's and felucca's lateens, the junk's battened sails, the Viking longship's
  square sail and shields, the voyaging canoe's crab-claws on its twin hulls.
- **Detailed tall ships and small craft**: Sedov, Cutty Sark, Bluenose and SS Great Britain
  carry their shrouds, bulwarks, boats, wheels and anchors (the Cutty Sark her figurehead, the
  Bluenose her dories); the longship its clinker lands, oars and sea chests; the voyaging canoe
  its lashings, deck rail and provisions; the houseboat, gondola, longtail, sampan, Riva,
  sailing yacht, superyacht and fishing cutter their seams, gunwales, fittings and gear.
- **Detailed small craft** (see "Detail" in [world-ships.md](world-ships.md)): the narrowboat
  (porthole row, roof vents, plant box and pole, tiller, button fenders, cratch), the Thames
  barge (hatch covers, leeboard winches, windlass, wheel, sprit and vangs, tender), the dhow
  (plank seams, poop rail, transom board, rudder lines, crew shelter, water jars), the junk
  (wales, stern cabin, painted eye, great rudder, battens' sheets) and the felucca (painted
  bands, benches, awning, tiller, stays).
- **Small craft** are held to 4,000 triangles; their JS models (about 47 KB of kit) still stay
  under their GLBs.

## Deviations

- The gondola's hull is drawn symmetric; the real one is asymmetric (its port side fuller).
- Sails are single faces without camber except the square sails' belly; running rigging is left
  out, standing rigging is the forestays and one shroud a side.
- The superyacht, sailing yacht and fishing cutter are generic types of their class.
