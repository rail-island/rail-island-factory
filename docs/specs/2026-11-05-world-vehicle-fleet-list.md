# World vehicle fleet: candidate list

Status: proposed
Date: 2026-11-05
Area: the 510 candidate models of [2026-11-05-world-vehicle-fleet.md](2026-11-05-world-vehicle-fleet.md)

This is a candidate list for review. Each entry is one design and one id. Years, makers and
dimensions are checked against the references when a model is built, and an entry is
corrected or replaced before it ships. **Ids freeze when they ship.** The `kit` column
names the kit option that drives the build. `params` lists the planned enum parameters,
with the default first.

Origins use ISO country codes; `EU` marks a multinational European maker.

## Aircraft (100)

Existing designs not repeated: Aero A.10, A380, 737-800, MD-11, 747-400, Beluga, light
jet, small airplane.

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-boeing-707` | Boeing 707-320 | US | 1959 | 4 wing pods, low wing | livery: Pan Am, Qantas, Lufthansa |
| 2 | `veh-boeing-727` | Boeing 727-200 | US | 1967 | 3 rear engines, T-tail | livery |
| 3 | `veh-boeing-737-200` | Boeing 737-200 | US | 1968 | 2 pods, short gear | livery |
| 4 | `veh-boeing-737-max` | Boeing 737 MAX 8 | US | 2017 | 2 pods, split winglets | livery |
| 5 | `veh-boeing-747-8` | Boeing 747-8 | US | 2011 | 4 pods, hump | variant: passenger, freighter |
| 6 | `veh-boeing-757` | Boeing 757-200 | US | 1983 | 2 pods | livery |
| 7 | `veh-boeing-767` | Boeing 767-300ER | US | 1986 | 2 pods, wide body | livery |
| 8 | `veh-boeing-777` | Boeing 777-300ER | US | 2004 | 2 large pods, six-wheel bogies | livery |
| 9 | `veh-boeing-787` | Boeing 787-9 | US | 2014 | 2 pods, raked wingtips | livery |
| 10 | `veh-douglas-dc8` | Douglas DC-8-63 | US | 1967 | 4 pods, stretched | livery |
| 11 | `veh-douglas-dc9` | McDonnell Douglas DC-9-30 | US | 1967 | 2 rear engines, T-tail | livery |
| 12 | `veh-md-80` | McDonnell Douglas MD-82 | US | 1981 | 2 rear engines, T-tail | livery |
| 13 | `veh-douglas-dc10` | McDonnell Douglas DC-10-30 | US | 1972 | 2 pods + tail engine | livery |
| 14 | `veh-lockheed-tristar` | Lockheed L-1011 TriStar | US | 1972 | 2 pods + S-duct tail | livery |
| 15 | `veh-convair-880` | Convair 880 | US | 1960 | 4 pods | livery |
| 16 | `veh-airbus-a300` | Airbus A300B4 | EU | 1974 | 2 pods, wide body | livery |
| 17 | `veh-airbus-a310` | Airbus A310 | EU | 1983 | 2 pods | livery |
| 18 | `veh-airbus-a320` | Airbus A320 | EU | 1988 | 2 pods, fences | length: A319, A320, A321; livery |
| 19 | `veh-airbus-a320neo` | Airbus A321neo | EU | 2017 | 2 large pods, sharklets | livery |
| 20 | `veh-airbus-a330` | Airbus A330-300 | EU | 1994 | 2 pods | livery |
| 21 | `veh-airbus-a340` | Airbus A340-600 | EU | 2002 | 4 pods | livery |
| 22 | `veh-airbus-a350` | Airbus A350-900 | EU | 2015 | 2 pods, curved wingtips | livery |
| 23 | `veh-airbus-a220` | Airbus A220-300 | CA | 2016 | 2 pods | livery |
| 24 | `veh-concorde` | Concorde | FR/GB | 1976 | ogival delta, droop nose | livery: Air France, British Airways |
| 25 | `veh-caravelle` | Sud Aviation Caravelle | FR | 1959 | 2 rear engines | livery |
| 26 | `veh-dh-comet` | de Havilland Comet 4 | GB | 1958 | buried wing-root engines | livery |
| 27 | `veh-vickers-vc10` | Vickers VC10 | GB | 1964 | 4 rear engines, T-tail | livery |
| 28 | `veh-hs-trident` | Hawker Siddeley Trident | GB | 1964 | 3 rear engines | livery |
| 29 | `veh-bac-111` | BAC One-Eleven | GB | 1965 | 2 rear engines | livery |
| 30 | `veh-bae-146` | BAe 146-200 | GB | 1983 | 4 pods, high wing, T-tail | livery |
| 31 | `veh-fokker-f28` | Fokker F28 Fellowship | NL | 1969 | 2 rear engines | livery |
| 32 | `veh-fokker-100` | Fokker 100 | NL | 1988 | 2 rear engines | livery |
| 33 | `veh-tupolev-tu104` | Tupolev Tu-104 | SU | 1956 | wing-root engines, glazed nose | livery |
| 34 | `veh-tupolev-tu134` | Tupolev Tu-134 | SU | 1967 | 2 rear engines, gear pods | livery: Aeroflot, CSA, Interflug |
| 35 | `veh-tupolev-tu154` | Tupolev Tu-154M | SU | 1972 | 3 rear engines, gear pods | livery |
| 36 | `veh-tupolev-tu144` | Tupolev Tu-144 | SU | 1977 | delta, canards | livery |
| 37 | `veh-ilyushin-il62` | Ilyushin Il-62M | SU | 1967 | 4 rear engines | livery |
| 38 | `veh-ilyushin-il86` | Ilyushin Il-86 | SU | 1980 | 4 pods, wide body | livery |
| 39 | `veh-ilyushin-il96` | Ilyushin Il-96-300 | RU | 1993 | 4 pods | livery |
| 40 | `veh-yakovlev-yak40` | Yakovlev Yak-40 | SU | 1968 | 3 rear engines | livery |
| 41 | `veh-yakovlev-yak42` | Yakovlev Yak-42 | SU | 1980 | 3 rear engines | livery |
| 42 | `veh-sukhoi-superjet` | Sukhoi Superjet 100 | RU | 2011 | 2 pods | livery |
| 43 | `veh-antonov-an148` | Antonov An-148 | UA | 2009 | 2 pods, high wing | livery |
| 44 | `veh-embraer-e190` | Embraer E190 | BR | 2005 | 2 pods | livery |
| 45 | `veh-embraer-e195-e2` | Embraer E195-E2 | BR | 2019 | 2 pods, long wing | livery |
| 46 | `veh-embraer-erj145` | Embraer ERJ 145 | BR | 1997 | 2 rear engines | livery |
| 47 | `veh-bombardier-crj200` | Bombardier CRJ200 | CA | 1992 | 2 rear engines | livery |
| 48 | `veh-bombardier-crj900` | Bombardier CRJ900 | CA | 2003 | 2 rear engines | livery |
| 49 | `veh-comac-c919` | COMAC C919 | CN | 2023 | 2 pods | livery |
| 50 | `veh-comac-arj21` | COMAC ARJ21 | CN | 2016 | 2 rear engines | livery |
| 51 | `veh-namc-ys11` | NAMC YS-11 | JP | 1965 | 2 turboprops, low wing | livery |
| 52 | `veh-atr-72` | ATR 72-600 | FR/IT | 2011 | 2 turboprops, high wing | length: 42, 72; livery |
| 53 | `veh-dhc-dash8` | De Havilland Canada Dash 8 Q400 | CA | 2000 | 2 turboprops, T-tail | livery |
| 54 | `veh-dhc-twin-otter` | DHC-6 Twin Otter | CA | 1966 | 2 turboprops, struts | gear: wheels, floats, skis |
| 55 | `veh-dhc-beaver` | DHC-2 Beaver | CA | 1948 | radial, high wing | gear: wheels, floats |
| 56 | `veh-saab-340` | Saab 340 | SE | 1984 | 2 turboprops, low wing | livery |
| 57 | `veh-saab-2000` | Saab 2000 | SE | 1994 | 2 turboprops, six-blade | livery |
| 58 | `veh-fokker-f27` | Fokker F27 Friendship | NL | 1958 | 2 turboprops, high wing | livery |
| 59 | `veh-fokker-50` | Fokker 50 | NL | 1987 | 2 turboprops, high wing | livery |
| 60 | `veh-embraer-brasilia` | Embraer EMB 120 Brasilia | BR | 1985 | 2 turboprops, T-tail | livery |
| 61 | `veh-embraer-bandeirante` | Embraer EMB 110 Bandeirante | BR | 1973 | 2 turboprops, low wing | livery |
| 62 | `veh-let-l410` | Let L-410 Turbolet | CZ | 1971 | 2 turboprops, high wing | livery |
| 63 | `veh-xian-ma60` | Xian MA60 | CN | 2000 | 2 turboprops, high wing | livery |
| 64 | `veh-antonov-an24` | Antonov An-24 | SU | 1962 | 2 turboprops, high wing | livery |
| 65 | `veh-ilyushin-il18` | Ilyushin Il-18 | SU | 1959 | 4 turboprops | livery |
| 66 | `veh-vickers-viscount` | Vickers Viscount | GB | 1953 | 4 turboprops, oval windows | livery |
| 67 | `veh-lockheed-electra` | Lockheed L-188 Electra | US | 1959 | 4 turboprops | livery |
| 68 | `veh-douglas-dc3` | Douglas DC-3 | US | 1936 | 2 radials, taildragger | livery |
| 69 | `veh-douglas-dc6` | Douglas DC-6B | US | 1951 | 4 radials | livery |
| 70 | `veh-lockheed-constellation` | Lockheed L-1049 Super Constellation | US | 1951 | 4 radials, triple fin | livery |
| 71 | `veh-boeing-377` | Boeing 377 Stratocruiser | US | 1949 | 4 radials, double bubble | livery |
| 72 | `veh-ford-trimotor` | Ford Trimotor | US | 1926 | 3 radials, corrugated skin | - |
| 73 | `veh-junkers-ju52` | Junkers Ju 52/3m | DE | 1932 | 3 radials, corrugated skin | livery |
| 74 | `veh-dh-dragon-rapide` | de Havilland Dragon Rapide | GB | 1935 | biplane, 2 engines | - |
| 75 | `veh-bn-islander` | Britten-Norman Islander | GB | 1967 | 2 pistons, high wing | livery |
| 76 | `veh-pilatus-pc12` | Pilatus PC-12 | CH | 1994 | single turboprop, T-tail | livery |
| 77 | `veh-cessna-172` | Cessna 172 Skyhawk | US | 1956 | single piston, strut high wing | colour |
| 78 | `veh-cessna-caravan` | Cessna 208 Caravan | US | 1985 | single turboprop | gear: wheels, amphibian floats |
| 79 | `veh-piper-cherokee` | Piper PA-28 Cherokee | US | 1961 | single piston, low wing | colour |
| 80 | `veh-beech-king-air` | Beechcraft King Air 350 | US | 1990 | 2 turboprops, T-tail | colour |
| 81 | `veh-antonov-an124` | Antonov An-124 Ruslan | SU | 1986 | 4 pods, high wing, visor nose | livery |
| 82 | `veh-antonov-an225` | Antonov An-225 Mriya | SU | 1988 | 6 pods, twin fin | - |
| 83 | `veh-antonov-an2` | Antonov An-2 | SU | 1949 | biplane, radial | gear: wheels, floats |
| 84 | `veh-lockheed-l100` | Lockheed L-100 Hercules | US | 1965 | 4 turboprops, high wing, ramp | livery |
| 85 | `veh-boeing-dreamlifter` | Boeing 747 Dreamlifter | US | 2007 | 4 pods, swing tail | - |
| 86 | `veh-airbus-beluga-xl` | Airbus BelugaXL | EU | 2020 | 2 pods, bulge, smile livery | - |
| 87 | `veh-canadair-cl415` | Canadair CL-415 | CA | 1994 | flying-boat hull, 2 turboprops | livery |
| 88 | `veh-shinmaywa-us2` | ShinMaywa US-2 | JP | 2007 | flying-boat hull, 4 turboprops | - |
| 89 | `veh-boeing-314` | Boeing 314 Clipper | US | 1939 | flying-boat hull, 4 radials | - |
| 90 | `veh-gulfstream-g650` | Gulfstream G650 | US | 2012 | 2 rear engines, T-tail | colour |
| 91 | `veh-bombardier-global` | Bombardier Global 7500 | CA | 2018 | 2 rear engines, T-tail | colour |
| 92 | `veh-dassault-falcon-7x` | Dassault Falcon 7X | FR | 2007 | 3 rear engines | colour |
| 93 | `veh-learjet-35` | Learjet 35 | US | 1974 | 2 rear engines, tip tanks | colour |
| 94 | `veh-embraer-phenom-300` | Embraer Phenom 300 | BR | 2009 | 2 rear engines, T-tail | colour |
| 95 | `veh-hondajet` | HondaJet HA-420 | JP/US | 2015 | over-wing engine pods | colour |
| 96 | `veh-sikorsky-s92` | Sikorsky S-92 | US | 2004 | rotor kit, wheels | livery: offshore, rescue |
| 97 | `veh-airbus-h145` | Airbus Helicopters H145 | EU | 2014 | rotor kit, skids, fenestron | livery: air ambulance, police |
| 98 | `veh-mil-mi8` | Mil Mi-8 | SU | 1967 | rotor kit, wheels | livery |
| 99 | `veh-bell-206` | Bell 206 JetRanger | US | 1967 | rotor kit, skids | colour |
| 100 | `veh-zeppelin-nt` | Zeppelin NT | DE | 1997 | envelope, vectored props | livery |

## Ships (100)

Existing designs not repeated: cruise ferry, hydrofoil ferry, passenger ferry.

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-ship-triple-e` | Maersk Triple E Class | DK | 2013 | bulbous bow, island bridge, container stacks | load: full, empty |
| 2 | `veh-ship-emma-maersk` | Emma Maersk | DK | 2006 | container stacks, aft bridge | load |
| 3 | `veh-ship-msc-gulsun` | MSC Gulsun Class | CH/KR | 2019 | container stacks, forward bridge | load |
| 4 | `veh-ship-panamax-container` | Panamax Container Ship | - | 1990 | container stacks | load; livery |
| 5 | `veh-ship-feeder-container` | Feeder Container Ship | DE | 2000 | stacks, own cranes | load |
| 6 | `veh-ship-ideal-x` | Ideal X | US | 1956 | converted T2 tanker, deck trailers | - |
| 7 | `veh-ship-vlcc` | Very Large Crude Carrier | - | 2002 | tanker deck, aft house | livery |
| 8 | `veh-ship-seawise-giant` | Seawise Giant | JP | 1979 | tanker deck | - |
| 9 | `veh-ship-aframax` | Aframax Tanker | - | 1990 | tanker deck | livery |
| 10 | `veh-ship-product-tanker` | Product Tanker | - | 2005 | tanker deck, manifold crane | livery |
| 11 | `veh-ship-lng-moss` | Moss LNG Carrier | NO/JP | 1975 | spherical tanks | - |
| 12 | `veh-ship-lng-qmax` | Q-Max LNG Carrier | QA/KR | 2008 | membrane trunk deck | - |
| 13 | `veh-ship-lpg-carrier` | LPG Carrier | - | 2010 | cylindrical tanks | - |
| 14 | `veh-ship-chemical-tanker` | Chemical Tanker | - | 2010 | piping deck | livery |
| 15 | `veh-ship-capesize` | Capesize Bulk Carrier | - | 2010 | hatch covers | livery |
| 16 | `veh-ship-valemax` | Valemax Ore Carrier | BR/CN | 2011 | hatch covers | - |
| 17 | `veh-ship-handysize` | Handysize Bulk Carrier | - | 2010 | hatch covers, four cranes | livery |
| 18 | `veh-ship-laker` | Great Lakes Freighter | US | 1958 | forward and aft houses | livery |
| 19 | `veh-ship-self-unloader` | Self-Unloading Laker | US | 1981 | unloading boom | - |
| 20 | `veh-ship-pctc` | Pure Car and Truck Carrier | NO | 2016 | box hull, stern ramp | livery |
| 21 | `veh-ship-roro` | Ro-Ro Cargo Ship | - | 2000 | stern ramp, trailer deck | livery |
| 22 | `veh-ship-heavy-lift` | Semi-Submersible Heavy-Lift Ship | NL | 2018 | open deck, forward house | load |
| 23 | `veh-ship-reefer` | Refrigerated Cargo Ship | - | 1990 | hatches, derricks | livery |
| 24 | `veh-ship-liberty` | Liberty Ship | US | 1941 | three-island hull, derricks | - |
| 25 | `veh-ship-victory` | Victory Ship | US | 1944 | three-island hull, derricks | - |
| 26 | `veh-ship-cable-layer` | Cable Layer | - | 2015 | carousel, stern sheaves | - |
| 27 | `veh-ship-ocean-tug` | Ocean-Going Tug | NL | 2010 | tug hull, high bridge | livery |
| 28 | `veh-ship-harbour-tug` | Harbour Tug | - | 2005 | tug hull, fenders | livery |
| 29 | `veh-ship-towboat` | Mississippi Towboat | US | 1980 | push knees, tall pilothouse | - |
| 30 | `veh-ship-europaschiff` | Rhine Motor Cargo Vessel | DE/NL | 1960 | barge hull, aft house | load |
| 31 | `veh-ship-rhine-tanker` | Rhine Tanker Barge | NL | 2000 | barge hull, piping | - |
| 32 | `veh-ship-push-barge` | Push Barge | - | 1970 | dumb barge | load |
| 33 | `veh-ship-yangtze-cargo` | Yangtze River Cargo Ship | CN | 2010 | barge hull | load |
| 34 | `veh-ship-volga-don` | Volga-Don River Ship | SU | 1960 | river-sea hull | - |
| 35 | `veh-ship-narrowboat` | Canal Narrowboat | GB | 1900 | narrow hull, cabin | colour |
| 36 | `veh-ship-thames-barge` | Thames Sailing Barge | GB | 1900 | flat hull, spritsail | - |
| 37 | `veh-ship-dhow` | Dhow | AE/OM/TZ | 1900 | lateen sail | - |
| 38 | `veh-ship-junk` | Chinese Junk | CN | 1900 | battened sails | - |
| 39 | `veh-ship-felucca` | Felucca | EG | 1900 | lateen sail, open hull | - |
| 40 | `veh-ship-stern-trawler` | Stern Trawler | NO | 1990 | trawl gantry | livery |
| 41 | `veh-ship-purse-seiner` | Tuna Purse Seiner | - | 2000 | skiff on deck, crow's nest | - |
| 42 | `veh-ship-shrimp-trawler` | Shrimp Trawler | US | 1980 | outriggers | - |
| 43 | `veh-ship-lobster-boat` | Maine Lobster Boat | US | 1980 | small cabin | colour |
| 44 | `veh-ship-arktika` | Arktika Class Icebreaker | RU | 2007 | ice bow, nuclear funnel | - |
| 45 | `veh-ship-polarstern` | Polarstern | DE | 1982 | ice bow, helideck | - |
| 46 | `veh-ship-attenborough` | RRS Sir David Attenborough | GB | 2021 | ice bow, research A-frame | - |
| 47 | `veh-ship-hopper-dredger` | Trailing Suction Hopper Dredger | BE/NL | 2010 | drag arms, hopper | - |
| 48 | `veh-ship-supply-vessel` | Platform Supply Vessel | NO | 2010 | forward house, long deck | livery |
| 49 | `veh-ship-anchor-handler` | Anchor Handling Tug | NO | 2010 | stern roller, towing pins | - |
| 50 | `veh-ship-crane-vessel` | Semi-Submersible Crane Vessel | NL | 2019 | twin pontoons, two cranes | - |
| 51 | `veh-ship-drillship` | Drillship | - | 2010 | derrick, helideck | - |
| 52 | `veh-ship-fireboat` | Fire Fighter | US | 1938 | monitors | - |
| 53 | `veh-ship-rnli-shannon` | RNLI Shannon Class | GB | 2014 | lifeboat hull | - |
| 54 | `veh-ship-pilot-boat` | Pilot Boat | - | 2010 | small cabin | - |
| 55 | `veh-ship-staten-island` | Staten Island Ferry | US | 2004 | double-ended | - |
| 56 | `veh-ship-star-ferry` | Star Ferry | HK | 1958 | double-ended, open deck | - |
| 57 | `veh-ship-bc-spirit` | BC Ferries Spirit Class | CA | 1993 | car ferry | - |
| 58 | `veh-ship-wsf-jumbo` | Washington Jumbo Mark II | US | 1997 | double-ended car ferry | - |
| 59 | `veh-ship-sydney-first-fleet` | Sydney First Fleet Ferry | AU | 1984 | small double-ended | - |
| 60 | `veh-ship-manly-freshwater` | Manly Freshwater Class | AU | 1982 | double-ended | - |
| 61 | `veh-ship-bosphorus-vapur` | Bosphorus Ferry | TR | 1960 | city ferry | - |
| 62 | `veh-ship-vaporetto` | Venice Vaporetto | IT | 1960 | waterbus | - |
| 63 | `veh-ship-amsterdam-ijveer` | Amsterdam IJ Ferry | NL | 2000 | double-ended pontoon | - |
| 64 | `veh-ship-stena-hss` | Stena HSS 1500 | SE | 1996 | catamaran | - |
| 65 | `veh-ship-incat` | Incat Wave-Piercer | AU | 1990 | wave-piercing catamaran | livery |
| 66 | `veh-ship-channel-ropax` | Channel Ro-Pax Ferry | GB | 2011 | car ferry | livery |
| 67 | `veh-ship-tallink-megastar` | Tallink Megastar | EE | 2017 | fast ro-pax | - |
| 68 | `veh-ship-jp-overnight-ferry` | Japanese Overnight Ferry | JP | 2017 | car ferry | - |
| 69 | `veh-ship-srn4` | SR.N4 Hovercraft | GB | 1968 | skirt, four propellers | - |
| 70 | `veh-ship-raketa` | Raketa Hydrofoil | SU | 1957 | foils | - |
| 71 | `veh-ship-jetfoil` | Boeing Jetfoil | US/JP | 1975 | foils, water jets | livery |
| 72 | `veh-ship-swiss-paddle` | Swiss Lake Paddle Steamer | CH | 1928 | side wheels | - |
| 73 | `veh-ship-sternwheeler` | Mississippi Sternwheeler | US | 1975 | stern wheel, twin stacks | - |
| 74 | `veh-ship-elbe-paddle` | Elbe Paddle Steamer | DE | 1926 | side wheels | - |
| 75 | `veh-ship-bateau-mouche` | Bateau-Mouche | FR | 1960 | glazed deck | - |
| 76 | `veh-ship-nile-cruiser` | Nile Cruise Boat | EG | 1990 | river cruiser | - |
| 77 | `veh-ship-kettuvallam` | Kerala Houseboat | IN | 1990 | thatched roof | - |
| 78 | `veh-ship-amazon-riverboat` | Amazon Riverboat | BR | 1990 | open decks, hammocks | colour |
| 79 | `veh-ship-hurtigruten` | Hurtigruten Coastal Ship | NO | 1993 | coastal passenger ship | - |
| 80 | `veh-ship-oasis` | Oasis Class Cruise Ship | US | 2009 | cruise tiers | - |
| 81 | `veh-ship-icon` | Icon Class Cruise Ship | US | 2024 | cruise tiers, dome | - |
| 82 | `veh-ship-queen-mary-2` | Queen Mary 2 | GB | 2004 | liner hull, funnel | - |
| 83 | `veh-ship-olympic` | Olympic Class Ocean Liner | GB | 1911 | four funnels | - |
| 84 | `veh-ship-ss-united-states` | SS United States | US | 1952 | two funnels | - |
| 85 | `veh-ship-normandie` | SS Normandie | FR | 1935 | three funnels, clipper bow | - |
| 86 | `veh-ship-expedition-cruise` | Expedition Cruise Ship | NO | 2019 | ice bow, cruise tiers | - |
| 87 | `veh-ship-river-cruise` | Rhine River Cruise Ship | DE | 2010 | low river hull | livery |
| 88 | `veh-ship-sedov` | Sedov | RU | 1921 | four-masted barque | - |
| 89 | `veh-ship-cutty-sark` | Cutty Sark | GB | 1869 | clipper, square rig | - |
| 90 | `veh-ship-bluenose` | Bluenose | CA | 1921 | schooner | - |
| 91 | `veh-ship-ss-great-britain` | SS Great Britain | GB | 1845 | iron hull, six masts | - |
| 92 | `veh-ship-viking-longship` | Viking Longship | NO | 900 | clinker hull, square sail | - |
| 93 | `veh-ship-voyaging-canoe` | Polynesian Voyaging Canoe | US (HI) | 1976 | twin hulls, crab-claw sails | - |
| 94 | `veh-ship-gondola` | Venetian Gondola | IT | 1900 | asymmetric hull | - |
| 95 | `veh-ship-longtail` | Thai Longtail Boat | TH | 1960 | long shaft engine | - |
| 96 | `veh-ship-superyacht` | Superyacht | NL/DE | 2015 | yacht tiers | colour |
| 97 | `veh-ship-sailing-yacht` | Sailing Yacht | - | 2000 | sloop rig | colour |
| 98 | `veh-ship-riva-aquarama` | Riva Aquarama | IT | 1962 | mahogany runabout | - |
| 99 | `veh-ship-fishing-cutter` | North Sea Fishing Cutter | DE/NL | 1960 | beam trawl booms | colour |
| 100 | `veh-ship-sampan` | Sampan | CN/HK | 1950 | canopy hull | - |

## Buses (100)

Existing designs not repeated: the Karosa short and long families, Karosa Renault City Bus 12M
and 18M, Mercedes-Benz Citaro, O 345 G, Solaris Urbino 15, Bus 1. Trolleybuses (marked
`trolley`) are part of the list (open question 2 of the spec).

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-aec-routemaster` | AEC Routemaster | GB | 1956 | double deck, rear platform | livery: London red, green line |
| 2 | `veh-new-routemaster` | New Routemaster | GB | 2012 | double deck, asymmetric glazing | - |
| 3 | `veh-leyland-atlantean` | Leyland Atlantean | GB | 1958 | double deck, rear engine | livery |
| 4 | `veh-leyland-national` | Leyland National | GB | 1972 | single deck, roof pod | livery |
| 5 | `veh-bristol-lodekka` | Bristol Lodekka | GB | 1949 | double deck, low height | livery |
| 6 | `veh-adl-enviro200` | Alexander Dennis Enviro200 | GB | 2006 | single deck | livery |
| 7 | `veh-adl-enviro400` | Alexander Dennis Enviro400 | GB | 2005 | double deck | livery |
| 8 | `veh-adl-enviro500` | Alexander Dennis Enviro500 | GB | 2002 | tri-axle double deck | livery: Hong Kong, New York, Auckland |
| 9 | `veh-plaxton-panorama` | Plaxton Panorama Elite | GB | 1968 | coach | livery |
| 10 | `veh-mb-o302` | Mercedes-Benz O 302 | DE | 1965 | coach | livery |
| 11 | `veh-mb-o305` | Mercedes-Benz O 305 | DE | 1967 | standard city bus | livery |
| 12 | `veh-mb-o405` | Mercedes-Benz O 405 | DE | 1984 | city bus | length: solo, articulated |
| 13 | `veh-mb-ecitaro` | Mercedes-Benz eCitaro | DE | 2018 | low floor, battery pods | livery |
| 14 | `veh-mb-tourismo` | Mercedes-Benz Tourismo | DE | 1994 | coach | livery |
| 15 | `veh-mb-o3500` | Mercedes-Benz O 3500 | DE | 1949 | bonneted | - |
| 16 | `veh-man-sl200` | MAN SL 200 | DE | 1973 | standard city bus | livery |
| 17 | `veh-man-lions-city` | MAN Lion's City 12 | DE | 2018 | low floor | length: 12, 18 |
| 18 | `veh-neoplan-skyliner` | Neoplan Skyliner | DE | 2004 | double-deck coach (the third generation; the series since 1967) | - |
| 19 | `veh-neoplan-cityliner` | Neoplan Cityliner | DE | 1971 | high-deck coach | - |
| 20 | `veh-setra-s515` | Setra S 515 HD | DE | 2012 | coach | livery |
| 21 | `veh-bussing-d2u` | Bussing D2U | DE | 1951 | double deck | - |
| 22 | `veh-magirus-saturn` | Magirus-Deutz Saturn II | DE | 1956 | bonneted | - |
| 23 | `veh-vw-t1-samba` | Volkswagen Type 2 Samba | DE | 1951 | minibus | colour |
| 24 | `veh-cobus-3000` | Cobus 3000 | DE | 1999 | airport apron bus | livery |
| 25 | `veh-volvo-7900e` | Volvo 7900 Electric | SE | 2018 | low floor | livery |
| 26 | `veh-volvo-9700` | Volvo 9700 | SE | 2001 | coach | livery |
| 27 | `veh-scania-citywide` | Scania Citywide | SE | 2011 | low floor | livery |
| 28 | `veh-van-hool-a330` | Van Hool A330 | BE | 1995 | low floor | livery |
| 29 | `veh-van-hool-exquicity` | Van Hool Exqui.City | BE | 2011 | BRT, faired wheels | livery |
| 30 | `veh-van-hool-astromega` | Van Hool TX Astromega | BE | 2010 | double-deck coach | livery |
| 31 | `veh-vdl-citea` | VDL Citea | NL | 2009 | low floor | livery |
| 32 | `veh-irisbus-citelis` | Irisbus Citelis | FR/IT | 2005 | low floor | livery |
| 33 | `veh-heuliez-gx337` | Heuliez GX 337 | FR | 2013 | low floor | livery |
| 34 | `veh-renault-pr100` | Renault PR100 | FR | 1971 | city bus | livery |
| 35 | `veh-chausson-aph` | Chausson APH | FR | 1950 | bonneted city bus | - |
| 36 | `veh-iveco-crossway` | Iveco Crossway | FR/IT | 2006 | intercity | livery |
| 37 | `veh-irizar-i8` | Irizar i8 | ES | 2014 | coach | livery |
| 38 | `veh-solaris-urbino-12e` | Solaris Urbino 12 Electric | PL | 2013 | low floor, battery pods | livery |
| 39 | `veh-solaris-trollino` | Solaris Trollino 18 | PL | 2001 | articulated, trolley | livery |
| 40 | `veh-jelcz-043` | Jelcz 043 | PL | 1964 | front engine, full front (the 706 RTO under licence), ribbed sides | - |
| 41 | `veh-skoda-706-rto` | Skoda 706 RTO | CZ | 1958 | front engine, rounded full front | livery |
| 42 | `veh-karosa-sm11` | Karosa SM 11 | CZ | 1964 | city bus | livery |
| 43 | `veh-sor-nb12` | SOR NB 12 | CZ | 2010 | low floor | livery |
| 44 | `veh-skoda-14tr` | Skoda 14Tr | CZ | 1982 | trolley | livery |
| 45 | `veh-skoda-15tr` | Skoda 15Tr | CZ | 1988 | articulated, trolley | livery |
| 46 | `veh-ikarus-55` | Ikarus 55 | HU | 1953 | coach, rear engine | - |
| 47 | `veh-ikarus-260` | Ikarus 260 | HU | 1971 | city bus | livery |
| 48 | `veh-ikarus-280` | Ikarus 280 | HU | 1973 | articulated | livery |
| 49 | `veh-laz-695` | LAZ-695 | SU | 1956 | city bus | - |
| 50 | `veh-liaz-677` | LiAZ-677 | SU | 1967 | city bus | - |
| 51 | `veh-liaz-5292` | LiAZ-5292 | RU | 2004 | low floor | - |
| 52 | `veh-paz-672` | PAZ-672 | SU | 1967 | small bus | - |
| 53 | `veh-ziu-9` | ZiU-9 | SU | 1972 | trolley | - |
| 54 | `veh-hess-lightram` | Hess lighTram | CH | 2003 | double articulated, trolley | - |
| 55 | `veh-saurer-postbus` | Saurer L4C Postbus | CH | 1959 | bonneted, alpine | - |
| 56 | `veh-otokar-kent` | Otokar Kent | TR | 2008 | low floor | livery |
| 57 | `veh-gm-new-look` | GM New Look | US | 1959 | fishbowl windscreen | livery |
| 58 | `veh-gm-scenicruiser` | GM Scenicruiser | US | 1954 | split-level coach | - |
| 59 | `veh-mci-d4505` | MCI D4505 | US | 2001 | coach | livery |
| 60 | `veh-flxible-clipper` | Flxible Clipper | US | 1937 | streamlined coach | - |
| 61 | `veh-gillig-low-floor` | Gillig Low Floor | US | 1997 | low floor | livery |
| 62 | `veh-new-flyer-xcelsior` | New Flyer Xcelsior | CA | 2008 | low floor | length: 40 ft, 60 ft |
| 63 | `veh-nova-lfs` | Nova Bus LFS | CA | 1996 | low floor | livery |
| 64 | `veh-proterra-catalyst` | Proterra Catalyst | US | 2014 | composite body | livery |
| 65 | `veh-blue-bird-vision` | Blue Bird Vision | US | 2003 | school bus, conventional | - |
| 66 | `veh-thomas-saf-t-liner` | Thomas Saf-T-Liner C2 | US | 2004 | school bus | - |
| 67 | `veh-chicken-bus` | Guatemalan Camioneta | GT | 1990 | painted school bus, roof rack | colour |
| 68 | `veh-marcopolo-paradiso-dd` | Marcopolo Paradiso G7 1800 DD | BR | 2009 | double-deck coach | livery |
| 69 | `veh-marcopolo-torino` | Marcopolo Torino | BR | 2007 | city bus | livery |
| 70 | `veh-curitiba-biarticulado` | Curitiba Biarticulated Bus | BR | 1992 | double articulated, tube-station doors | - |
| 71 | `veh-transmilenio` | TransMilenio Articulated | CO | 2000 | articulated BRT | - |
| 72 | `veh-buenos-aires-colectivo` | Buenos Aires Colectivo | AR | 1990 | front engine, painted | colour |
| 73 | `veh-havana-camello` | Havana Camello | CU | 1995 | semi-trailer bus | - |
| 74 | `veh-hino-blue-ribbon` | Hino Blue Ribbon | JP | 1982 | city bus | livery |
| 75 | `veh-isuzu-erga` | Isuzu Erga | JP | 2000 | low floor | livery |
| 76 | `veh-fuso-aero-queen` | Mitsubishi Fuso Aero Queen | JP | 1982 | high-deck coach | livery |
| 77 | `veh-toyota-coaster` | Toyota Coaster | JP | 1969 | minibus | colour |
| 78 | `veh-hyundai-universe` | Hyundai Universe | KR | 2006 | coach | livery |
| 79 | `veh-hyundai-elec-city` | Hyundai Elec City | KR | 2017 | low floor, battery | livery |
| 80 | `veh-daewoo-bs106` | Daewoo BS106 | KR | 1991 | city bus | livery |
| 81 | `veh-byd-k9` | BYD K9 | CN | 2010 | low floor, battery | livery |
| 82 | `veh-yutong-e12` | Yutong E12 | CN | 2016 | low floor, battery | livery |
| 83 | `veh-king-long-coach` | King Long XMQ6127 | CN | 2010 | coach | livery |
| 84 | `veh-dennis-trident-hk` | Dennis Trident | GB/HK | 1997 | tri-axle double deck | livery |
| 85 | `veh-singapore-double-deck` | MAN A95 | DE/SG | 2015 | double deck | - |
| 86 | `veh-ashok-leyland-viking` | Ashok Leyland Viking | IN | 1980 | front engine | livery |
| 87 | `veh-tata-starbus` | Tata Starbus | IN | 2007 | city bus | livery |
| 88 | `veh-jeepney` | Philippine Jeepney | PH | 1950 | bonneted jeep body | colour |
| 89 | `veh-songthaew` | Songthaew | TH | 1980 | pickup with benches | colour |
| 90 | `veh-jingle-bus` | Pakistani Jingle Bus | PK | 1970 | truck chassis, decorated | colour |
| 91 | `veh-matatu` | Matatu | KE | 2000 | minibus, graffiti livery | colour |
| 92 | `veh-danfo` | Lagos Danfo | NG | 1990 | VW T3 minibus | - |
| 93 | `veh-cairo-cta-bus` | Cairo Transport Authority Bus | EG | 2009 | city bus | - |
| 94 | `veh-za-rea-vaya` | Rea Vaya BRT Bus | ZA | 2009 | BRT high-floor doors | - |
| 95 | `veh-volgren-optimus` | Volgren Optimus | AU | 2010 | low floor | livery |
| 96 | `veh-designline-olymbus` | Designline Olymbus | NZ | 2004 | low floor | livery |
| 97 | `veh-mb-sprinter-minibus` | Mercedes-Benz Sprinter Minibus | DE | 2006 | van-based | livery |
| 98 | `veh-sydney-leyland-atlantean` | Sydney PTC Atlantean | AU | 1970 | double deck | - |
| 99 | `veh-tatra-500-hb` | Tatra 500 HB | CZ | 1953 | rear engine | - |
| 100 | `veh-kyiv-12` | Kyiv-12 Trolleybus | UA | 1993 | articulated, trolley | - |

## Trucks and lorries (100)

Existing designs not repeated: cistern semi-truck, concrete mixer, reefer semi-truck,
American truck. `semi` is a tractor with a semi-trailer (the `truck`/`trailer` split);
`params: body` picks the semi-trailer or rigid body.

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-scania-r` | Scania R 500 | SE | 2004 | EU cab-over semi | body: curtain, box, tank |
| 2 | `veh-scania-s-v8` | Scania S 730 V8 | SE | 2016 | EU high-roof cab-over semi | body |
| 3 | `veh-scania-lb141` | Scania LB 141 | SE | 1976 | EU cab-over semi | body |
| 4 | `veh-volvo-fh16` | Volvo FH16 | SE | 1993 | EU cab-over semi, heavy haul | body: low loader, curtain |
| 5 | `veh-volvo-f88` | Volvo F88 | SE | 1965 | cab-over semi | body |
| 6 | `veh-volvo-fmx-tipper` | Volvo FMX Tipper | SE | 2010 | 8x4 rigid tipper | - |
| 7 | `veh-mb-actros` | Mercedes-Benz Actros | DE | 2018 | EU cab-over semi, camera mirrors | body |
| 8 | `veh-mb-arocs` | Mercedes-Benz Arocs Tipper | DE | 2013 | 6x4 rigid tipper | - |
| 9 | `veh-mb-unimog` | Mercedes-Benz Unimog U 5023 | DE | 2013 | off-road, portal axles | body: flatbed, snowplough |
| 10 | `veh-mb-kurzhauber` | Mercedes-Benz L 911 | DE | 1959 | bonneted | body: dropside, tipper |
| 11 | `veh-mb-ng` | Mercedes-Benz NG 1632 | DE | 1973 | cab-over semi | body |
| 12 | `veh-man-f8` | MAN F8 | DE | 1967 | cab-over rigid + trailer | body |
| 13 | `veh-man-tgl` | MAN TGL Box Truck | DE | 2005 | distribution rigid | body: box, curtain |
| 14 | `veh-daf-xf` | DAF XF | NL | 2017 | EU cab-over semi | body: container, curtain |
| 15 | `veh-daf-2600` | DAF 2600 | NL | 1962 | cab-over semi | body |
| 16 | `veh-daf-cf-refuse` | DAF CF Refuse Truck | NL | 2001 | rigid refuse body | livery |
| 17 | `veh-iveco-s-way` | Iveco S-Way | IT | 2019 | EU cab-over semi | body |
| 18 | `veh-iveco-turbostar` | Iveco Turbostar | IT | 1984 | cab-over semi | body |
| 19 | `veh-iveco-daily` | Iveco Daily | IT | 1978 | light van | body: van, dropside |
| 20 | `veh-fiat-682` | Fiat 682 | IT | 1952 | bonneted | body |
| 21 | `veh-renault-t` | Renault Trucks T | FR | 2013 | EU cab-over semi | body |
| 22 | `veh-renault-magnum` | Renault Magnum | FR | 1990 | cab-over semi, flat floor | body |
| 23 | `veh-berliet-t100` | Berliet T100 | FR | 1957 | giant off-road | - |
| 24 | `veh-citroen-h-van` | Citroen H Van | FR | 1947 | corrugated van | colour |
| 25 | `veh-pegaso-comet` | Pegaso Comet | ES | 1964 | cab-over rigid | body |
| 26 | `veh-tatra-148` | Tatra 148 | CZ | 1969 | bonneted 6x6 | body: tipper, dropside |
| 27 | `veh-tatra-815` | Tatra 815 | CZ | 1983 | cab-over 8x8 | body: tipper, crane |
| 28 | `veh-tatra-phoenix` | Tatra Phoenix | CZ | 2011 | cab-over 6x6 | body |
| 29 | `veh-avia-a31` | Avia A31 | CZ | 1968 | light cab-over | body |
| 30 | `veh-liaz-100` | Liaz 100 | CZ | 1974 | cab-over semi | body |
| 31 | `veh-praga-v3s` | Praga V3S | CZ | 1953 | bonneted 6x6 | body |
| 32 | `veh-skoda-706-rt` | Skoda 706 RT | CZ | 1957 | cab-over rigid + trailer | body |
| 33 | `veh-star-266` | Star 266 | PL | 1973 | cab-over 6x6 | body |
| 34 | `veh-csepel-d450` | Csepel D-450 | HU | 1960 | bonneted | body |
| 35 | `veh-kamaz-5320` | KamAZ-5320 | SU | 1976 | cab-over rigid | body |
| 36 | `veh-kamaz-54901` | KamAZ-54901 | RU | 2019 | cab-over semi | body |
| 37 | `veh-zil-130` | ZIL-130 | SU | 1964 | bonneted | body: dropside, tanker |
| 38 | `veh-gaz-51` | GAZ-51 | SU | 1946 | bonneted | body |
| 39 | `veh-gaz-66` | GAZ-66 | SU | 1964 | cab-over 4x4 | body |
| 40 | `veh-maz-500` | MAZ-500 | BY | 1965 | cab-over | body |
| 41 | `veh-belaz-75710` | BelAZ 75710 | BY | 2013 | mining dump truck | - |
| 42 | `veh-kraz-255` | KrAZ-255 | UA | 1967 | bonneted 6x6 | body |
| 43 | `veh-ural-4320` | Ural-4320 | RU | 1977 | bonneted 6x6 | body |
| 44 | `veh-bedford-tk` | Bedford TK | GB | 1960 | cab-forward | body |
| 45 | `veh-aec-mammoth-major` | AEC Mammoth Major | GB | 1948 | bonneted 8-wheeler | body |
| 46 | `veh-scammell-contractor` | Scammell Contractor | GB | 1964 | heavy haul tractor | body: low loader |
| 47 | `veh-ford-transit-mk1` | Ford Transit Mk1 | GB | 1965 | van | colour |
| 48 | `veh-dennis-fire-engine` | Dennis Sabre Fire Engine | GB | 1995 | fire body | - |
| 49 | `veh-magirus-ladder` | Magirus Turntable Ladder | DE | 2010 | fire, ladder as part | - |
| 50 | `veh-rosenbauer-panther` | Rosenbauer Panther | AT | 2005 | airport crash tender | - |
| 51 | `veh-liebherr-ltm` | Liebherr LTM 1100 Mobile Crane | DE | 2010 | crane, boom as part | - |
| 52 | `veh-lohr-car-transporter` | Car Transporter | FR | 2010 | car carrier semi | load |
| 53 | `veh-peterbilt-379` | Peterbilt 379 | US | 1987 | US long hood semi | body: dry van, flatbed |
| 54 | `veh-peterbilt-579` | Peterbilt 579 | US | 2012 | US aero hood semi | body |
| 55 | `veh-kenworth-w900` | Kenworth W900 | US | 1961 | US long hood semi | body |
| 56 | `veh-kenworth-t680` | Kenworth T680 | US | 2013 | US aero hood semi | body |
| 57 | `veh-kenworth-k100` | Kenworth K100 | US | 1960 | US cab-over semi | body |
| 58 | `veh-kenworth-c500-log` | Kenworth C500 Log Truck | US/CA | 1970 | log body + pole trailer | - |
| 59 | `veh-kenworth-t909-road-train` | Kenworth T909 Road Train | AU | 2009 | three trailers | load: 2, 3 trailers |
| 60 | `veh-freightliner-cascadia` | Freightliner Cascadia | US | 2007 | US aero hood semi | body |
| 61 | `veh-mack-b61` | Mack B-61 | US | 1953 | bonneted | body |
| 62 | `veh-mack-anthem` | Mack Anthem | US | 2018 | US hood semi | body |
| 63 | `veh-mack-granite-dump` | Mack Granite Dump Truck | US | 2002 | rigid dump | - |
| 64 | `veh-international-transtar` | International Transtar Cabover | US | 1968 | US cab-over semi | body |
| 65 | `veh-international-acco` | International ACCO | AU | 1965 | cab-over | body |
| 66 | `veh-western-star-4900` | Western Star 4900 | US | 1990 | US long hood semi | body |
| 67 | `veh-volvo-vnl` | Volvo VNL 860 | US | 2018 | US aero hood semi | body |
| 68 | `veh-tesla-semi` | Tesla Semi | US | 2022 | centre seat cab | body |
| 69 | `veh-ford-model-tt` | Ford Model TT | US | 1917 | early truck | body |
| 70 | `veh-white-3000` | White 3000 | US | 1949 | early cab-over | body |
| 71 | `veh-autocar-acx-refuse` | Autocar ACX Refuse Truck | US | 2005 | low cab-over refuse | - |
| 72 | `veh-pierce-arrow-xt` | Pierce Arrow XT Fire Engine | US | 2010 | fire body | - |
| 73 | `veh-american-lafrance` | American LaFrance 700 | US | 1947 | fire body, open cab | - |
| 74 | `veh-cat-797` | Caterpillar 797F | US | 2009 | mining dump truck | - |
| 75 | `veh-mb-l1113` | Mercedes-Benz L 1113 | BR | 1969 | bonneted | body |
| 76 | `veh-vw-constellation` | Volkswagen Constellation | BR | 2005 | cab-over | body |
| 77 | `veh-scania-111` | Scania 111 | BR | 1976 | bonneted semi | body |
| 78 | `veh-ford-cargo` | Ford Cargo | BR/GB | 1981 | cab-over | body |
| 79 | `veh-hino-300` | Hino 300 | JP | 1999 | narrow cab-over | body |
| 80 | `veh-hino-profia` | Hino Profia | JP | 1992 | JP cab-over | body |
| 81 | `veh-isuzu-elf` | Isuzu Elf | JP | 1959 | narrow cab-over | body: dropside, box |
| 82 | `veh-isuzu-giga` | Isuzu Giga | JP | 1994 | JP cab-over | body |
| 83 | `veh-fuso-canter` | Mitsubishi Fuso Canter | JP | 1963 | narrow cab-over | body |
| 84 | `veh-fuso-super-great` | Mitsubishi Fuso Super Great | JP | 1996 | JP cab-over semi | body |
| 85 | `veh-ud-quon` | UD Quon | JP | 2004 | JP cab-over | body |
| 86 | `veh-kei-truck` | Kei Truck | JP | 1961 | kei | colour |
| 87 | `veh-dekotora` | Dekotora | JP | 1975 | JP cab-over, art lights | colour |
| 88 | `veh-hyundai-xcient` | Hyundai Xcient | KR | 2013 | cab-over | variant: diesel, fuel cell |
| 89 | `veh-tata-lpt` | Tata LPT 1613 | IN | 1980 | bonneted, painted | colour |
| 90 | `veh-ashok-leyland-captain` | Ashok Leyland Captain | IN | 2010 | cab-over | body |
| 91 | `veh-pakistani-truck-art` | Pakistani Truck Art | PK | 1970 | bonneted, decorated | colour |
| 92 | `veh-faw-jiefang-ca10` | FAW Jiefang CA10 | CN | 1956 | bonneted | body |
| 93 | `veh-faw-j7` | FAW Jiefang J7 | CN | 2018 | cab-over semi | body |
| 94 | `veh-dongfeng-eq140` | Dongfeng EQ140 | CN | 1978 | bonneted | body |
| 95 | `veh-sinotruk-howo` | Sinotruk HOWO A7 | CN | 2007 | cab-over semi | body |
| 96 | `veh-shacman-x3000` | Shacman X3000 | CN | 2012 | cab-over tipper | body |
| 97 | `veh-mb-zetros` | Mercedes-Benz Zetros | DE | 2008 | bonneted off-road | body |
| 98 | `veh-bell-b60e` | Bell B60E | ZA | 2017 | articulated dump truck | - |
| 99 | `veh-man-cla` | MAN CLA | IN | 2006 | cab-over | body |
| 100 | `veh-mb-econic` | Mercedes-Benz Econic | DE | 1998 | low-entry cab | body: refuse, sweeper |

## Trams (100)

Existing designs not repeated: Tatra T3 (three variants), T6A5, KT8D5, KT4, GT4, the
San Francisco cable car. Light-rail vehicles appear only where they run as trams.

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-tatra-t1` | Tatra T1 | CZ | 1952 | rigid, PCC-derived | - |
| 2 | `veh-tatra-t2` | Tatra T2 | CZ | 1955 | rigid | - |
| 3 | `veh-tatra-t4` | Tatra T4D | CZ/DD | 1968 | rigid, narrow | unit: motor car, trailer B4D |
| 4 | `veh-tatra-k2` | Tatra K2 | CZ | 1966 | two sections | livery |
| 5 | `veh-tatra-t5c5` | Tatra T5C5 | CZ/HU | 1979 | rigid, angular | - |
| 6 | `veh-skoda-14t` | Skoda 14T | CZ | 2005 | five sections, Porsche front | - |
| 7 | `veh-skoda-15t` | Skoda 15T ForCity | CZ | 2009 | four sections, pivoting bogies | livery |
| 8 | `veh-skoda-13t` | Skoda 13T | CZ | 2008 | five sections | - |
| 9 | `veh-skoda-29t` | Skoda 29T | CZ/SK | 2015 | five sections | - |
| 10 | `veh-skoda-10t` | Skoda 10T | CZ/US | 2001 | three sections | livery: Portland, Tacoma |
| 11 | `veh-vario-lf` | Vario LF | CZ | 2004 | rigid, low-floor middle | - |
| 12 | `veh-ganz-csmg` | Ganz CSMG | HU | 1967 | two sections | - |
| 13 | `veh-siemens-combino` | Siemens Combino | DE | 1996 | multi-section low floor | length: 3, 5, 7 sections; livery |
| 14 | `veh-siemens-combino-supra` | Siemens Combino Supra | DE/HU | 2006 | nine sections | - |
| 15 | `veh-siemens-avenio` | Siemens Avenio | DE | 2014 | multi-section low floor | livery |
| 16 | `veh-siemens-ulf` | Vienna ULF | AT | 1997 | portal-frame low floor | length: A, B |
| 17 | `veh-vienna-e1` | Vienna Type E1 | AT | 1966 | two sections | unit: motor car, trailer c4 |
| 18 | `veh-vienna-flexity` | Vienna Flexity | AT | 2018 | multi-section low floor | - |
| 19 | `veh-duewag-gt8` | Duewag GT8 | DE | 1956 | three sections | livery |
| 20 | `veh-duewag-u2` | Duewag U2 | DE/CA | 1968 | two sections, high floor | livery: Frankfurt, Edmonton, Calgary |
| 21 | `veh-duewag-b80` | Stadtbahnwagen B | DE | 1973 | two sections, high floor | - |
| 22 | `veh-gotha-t2-62` | Gothawagen T2-62 | DD | 1962 | rigid | unit: motor car, trailer |
| 23 | `veh-berlin-flexity` | Berlin Flexity | DE | 2011 | multi-section low floor | length: short, long |
| 24 | `veh-stadler-variobahn` | Stadler Variobahn | CH/DE | 2002 | multi-section low floor | livery |
| 25 | `veh-stadler-tango` | Stadler Tango | CH | 2009 | multi-section | livery |
| 26 | `veh-zurich-cobra` | Zurich Cobra Be 5/6 | CH | 2001 | five sections | - |
| 27 | `veh-zurich-tram-2000` | Zurich Tram 2000 | CH | 1976 | two sections | - |
| 28 | `veh-swiss-standard-tram` | Swiss Standard Tram | CH | 1940 | rigid | - |
| 29 | `veh-brussels-pcc` | Brussels PCC 7900 | BE | 1971 | three sections | - |
| 30 | `veh-amsterdam-9g` | Amsterdam 9G | NL | 1979 | two sections | - |
| 31 | `veh-hague-gtl8` | HTM GTL8 | NL | 1981 | three sections | - |
| 32 | `veh-lisbon-remodelado` | Lisbon Remodelado | PT | 1936 | rigid, short wheelbase | - |
| 33 | `veh-milan-ventotto` | Milan Ventotto | IT | 1928 | rigid, Peter Witt | - |
| 34 | `veh-florence-sirio` | AnsaldoBreda Sirio | IT | 2002 | multi-section low floor | livery |
| 35 | `veh-alstom-citadis` | Alstom Citadis 402 | FR | 2006 | multi-section low floor | livery: Bordeaux, Dublin, Dubai |
| 36 | `veh-alstom-citadis-x05` | Alstom Citadis X05 | FR | 2016 | multi-section low floor | livery |
| 37 | `veh-alstom-tfs` | Alstom TFS | FR | 1987 | three sections | - |
| 38 | `veh-translohr` | Translohr STE3 | FR | 2006 | guided rubber-tyred | - |
| 39 | `veh-caf-urbos` | CAF Urbos 3 | ES | 2011 | multi-section low floor | livery: Edinburgh, Belgrade, Kaohsiung |
| 40 | `veh-flexity-outlook` | Bombardier Flexity Outlook | CA/BE | 2005 | multi-section low floor | livery |
| 41 | `veh-croydon-cr4000` | Croydon CR4000 | GB | 2000 | three sections | - |
| 42 | `veh-blackpool-balloon` | Blackpool Balloon | GB | 1934 | double deck, rigid | - |
| 43 | `veh-blackpool-flexity` | Blackpool Flexity 2 | GB | 2012 | multi-section low floor | - |
| 44 | `veh-sheffield-supertram` | Sheffield Supertram | GB | 1994 | three sections | - |
| 45 | `veh-nottingham-incentro` | Nottingham Incentro | GB | 2003 | five sections | - |
| 46 | `veh-konstal-105n` | Konstal 105N | PL | 1973 | rigid | - |
| 47 | `veh-pesa-swing` | Pesa Swing | PL | 2011 | multi-section low floor | livery |
| 48 | `veh-solaris-tramino` | Solaris Tramino | PL | 2011 | multi-section low floor | livery |
| 49 | `veh-ktm-5` | KTM-5 | SU | 1969 | rigid, angular | - |
| 50 | `veh-lm-68` | LM-68 | SU | 1968 | rigid | - |
| 51 | `veh-vityaz-m` | 71-931M Vityaz-M | RU | 2017 | three sections | - |
| 52 | `veh-electron-t5l64` | Electron T5L64 | UA | 2014 | five sections | - |
| 53 | `veh-bucharest-v3a` | Bucharest V3A | RO | 1973 | three sections | - |
| 54 | `veh-koncar-tmk2200` | Koncar TMK 2200 | HR | 2005 | five sections | - |
| 55 | `veh-durmazlar-silkworm` | Durmazlar Silkworm | TR | 2013 | multi-section low floor | - |
| 56 | `veh-helsinki-artic` | Transtech Artic | FI | 2013 | three sections | - |
| 57 | `veh-helsinki-valmet` | Valmet Nr I | FI | 1973 | two sections | - |
| 58 | `veh-oslo-sl79` | Oslo SL79 | NO | 1982 | two sections | - |
| 59 | `veh-gothenburg-m29` | Gothenburg M29 | SE | 1969 | rigid | - |
| 60 | `veh-pcc-streamliner` | PCC Streamliner | US | 1936 | rigid, PCC | livery: Pittsburgh, Toronto, Philadelphia |
| 61 | `veh-toronto-clrv` | Toronto CLRV | CA | 1979 | rigid, trolley pole | - |
| 62 | `veh-toronto-flexity` | Toronto Flexity Outlook | CA | 2014 | five sections, pantograph | - |
| 63 | `veh-birney-safety-car` | Birney Safety Car | US | 1916 | rigid, single truck | - |
| 64 | `veh-new-orleans-perley-thomas` | New Orleans Perley Thomas | US | 1923 | rigid, arched roof | - |
| 65 | `veh-boston-type-8` | Boston Type 8 | US | 1999 | two sections | - |
| 66 | `veh-siemens-s70` | Siemens S70 | US | 2003 | three sections | livery |
| 67 | `veh-kinki-sharyo-lrv` | Kinki Sharyo LRV | JP/US | 1996 | two sections, high floor | livery |
| 68 | `veh-brookville-liberty` | Brookville Liberty | US | 2016 | three sections | livery |
| 69 | `veh-philadelphia-kawasaki` | Philadelphia Kawasaki LRV | JP/US | 1981 | rigid (corrected: the K-car is one body) | - |
| 70 | `veh-rio-bonde` | Santa Teresa Bonde | BR | 1896 | open cross-bench | - |
| 71 | `veh-buenos-aires-premetro` | Buenos Aires Premetro | AR | 1987 | rigid | - |
| 72 | `veh-hong-kong-tram` | Hong Kong Tram | HK | 1949 | double deck, narrow | livery: classic, advertising |
| 73 | `veh-hiroshima-green-mover` | Hiroshima Green Mover Max | JP | 2005 | five sections | - |
| 74 | `veh-toei-9000` | Toei 9000 | JP | 2007 | rigid, retro | - |
| 75 | `veh-toyama-portram` | Toyama Portram | JP | 2006 | two sections | livery |
| 76 | `veh-tokyu-300` | Tokyu 300 | JP | 1999 | two sections | livery |
| 77 | `veh-kolkata-tram` | Kolkata Tram | IN | 1940 | rigid, two cars | - |
| 78 | `veh-dalian-tram` | Dalian Tram | CN | 1936 | rigid, wooden body | - |
| 79 | `veh-foshan-hydrogen` | Foshan Hydrogen Tram | CN | 2019 | three sections, no catenary | - |
| 80 | `veh-alexandria-double-deck` | Alexandria Double-Deck Tram | EG | 1995 | double deck | - |
| 81 | `veh-addis-ababa-lrt` | Addis Ababa Light Rail | ET | 2015 | three sections | - |
| 82 | `veh-melbourne-w-class` | Melbourne W Class | AU | 1923 | rigid, drop centre | livery |
| 83 | `veh-melbourne-b-class` | Melbourne B Class | AU | 1984 | two sections | - |
| 84 | `veh-melbourne-e-class` | Melbourne E Class | AU | 2013 | three sections | - |
| 85 | `veh-glenelg-h-class` | Glenelg H Class | AU | 1929 | rigid | - |
| 86 | `veh-sydney-r-class` | Sydney R Class | AU | 1933 | rigid, drop centre (corrected: a closed saloon) | - |
| 87 | `veh-christchurch-boon` | Christchurch Boon Tram | NZ | 1906 | rigid, open ends | - |
| 88 | `veh-horse-tram` | Horse Tram | GB | 1880 | horse as part, open top | - |
| 89 | `veh-steam-tram` | Steam Tram | GB | 1885 | tram engine + trailer | unit: engine, trailer |
| 90 | `veh-cable-car-dunedin` | Dunedin Cable Car | NZ | 1881 | grip car | - |
| 91 | `veh-istanbul-nostalgic` | Istanbul Nostalgic Tram | TR | 1914 | rigid | - |
| 92 | `veh-trieste-opicina` | Trieste Opicina Tram | IT | 1935 | rigid, rack pusher | - |
| 93 | `veh-budapest-ganz-uv` | Ganz UV | HU | 1956 | rigid | - |
| 94 | `veh-wroclaw-skoda-16t` | Skoda 16T | CZ/PL | 2006 | five sections | - |
| 95 | `veh-strasbourg-eurotram` | Strasbourg Eurotram | FR | 1994 | multi-section, bay windows | - |
| 96 | `veh-montpellier-citadis` | Montpellier Citadis 302 | FR | 2000 | multi-section low floor | livery |
| 97 | `veh-gmunden-vario` | Gmunden Traunseetram | AT | 2014 | multi-section, metre gauge | - |
| 98 | `veh-sarajevo-k2yu` | Tatra K2YU | CZ/BA | 1973 | two sections | - |
| 99 | `veh-turin-2800` | Turin Series 2800 | IT | 1958 | articulated | - |
| 100 | `veh-dubai-citadis` | Dubai Tram | AE | 2014 | multi-section, ground power | - |

## Cable car cabins (10)

Existing designs not repeated: aerial tramway car, small gondola, chairlift chair. None of
them has an OpenTTD entry. Each states its `ropeFrac` and `boardFrac`.

| # | id | title | origin | in service | kit | params |
|---|---|---|---|---|---|---|
| 1 | `veh-doppelmayr-omega` | Doppelmayr Omega IV | AT | 2008 | 10-seat gondola | colour |
| 2 | `veh-poma-funitel` | Funitel Cabin | FR | 1990 | funitel, two ropes | - |
| 3 | `veh-peak-2-peak` | Peak 2 Peak Cabin | CA | 2008 | 3S, 28 seats | variant: standard, glass floor |
| 4 | `veh-stanserhorn-cabrio` | Stanserhorn Cabrio | CH | 2012 | double deck, open top | - |
| 5 | `veh-titlis-rotair` | Titlis Rotair | CH | 1992 | rotating floor as part | - |
| 6 | `veh-vanoise-express` | Vanoise Express | FR | 2003 | double-deck aerial tram | - |
| 7 | `veh-roosevelt-island-tram` | Roosevelt Island Tramway | US | 1976 | urban aerial tram | - |
| 8 | `veh-sugarloaf-bondinho` | Sugarloaf Cable Car | BR | 2008 | glazed aerial tram (the current cabins) | - |
| 9 | `veh-medellin-metrocable` | Medellin Metrocable | CO | 2004 | urban gondola | - |
| 10 | `veh-ngong-ping-crystal` | Ngong Ping 360 Cabin | HK | 2006 | gondola, glass floor | variant: standard, crystal |
