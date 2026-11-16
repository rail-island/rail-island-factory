// A short English text about the real thing a model shows (docs/site/seo-pages.md,
// "Blurbs"): its history and what it is known for, in one to three sentences. The
// model page shows it above the generated facts, and the prerendered page and its
// description carry it, so a search engine reads more than the figures. Optional:
// a model without one gets only the facts. Site-only text, so English only - it is
// not exported to the game, unlike the titles (docs/models/text.md).
//
// Keyed by the exported model id (`proc-...`). Kept apart from the designs on
// purpose, like countryTable.ts: a design module is bundled into each of its
// models' JS files, so a field stated there would rewrite every model of that
// module. State only what the references or a well-known source confirm. ASCII.

export const BLURBS: Readonly<Record<string, string>> = {
  // rail vehicles
  "proc-vehicle-cd-163":
    "Class 163 is a 3 kV DC electric locomotive built by Skoda in Plzen for Czechoslovak and later Czech Railways. With its dual-voltage sister class 363 it hauls regional and long-distance trains across Czechia and Slovakia.",
  "proc-vehicle-cd-680":
    "Class 680 is the Czech Pendolino, a tilting electric unit built by Alstom from the Italian Pendolino family. Its SuperCity trains have linked Prague with Ostrava since 2005.",
  "proc-vehicle-cd-471":
    "The class 471 CityElefant is a double-deck electric unit built by Skoda for Czech Railways from 1997, the mainstay of the suburban services around Prague and Ostrava.",
  "proc-vehicle-cd-781":
    "Class 781, nicknamed Sergej, is the Czechoslovak version of the Soviet M62 diesel locomotive, built in Luhansk from 1966 and used above all for heavy freight.",
  "proc-vehicle-cd-810":
    "Class 810 is a two-axle diesel railcar built by Vagonka Studenka from 1975; several hundred of them served Czechoslovak branch lines.",
  "proc-vehicle-tatra-t3":
    "The Tatra T3 is a four-axle tram built by CKD Tatra in Prague. With about 14,000 cars built it is one of the most numerous tram types in the world, and it still runs in Prague, Brno, Ostrava and many cities of the former Eastern Bloc.",
  "proc-vehicle-tatra-kt4":
    "The Tatra KT4 is a two-section articulated tram built by CKD Tatra from 1974, light and short enough for narrow, hilly streets; most were delivered to East Germany and the Soviet Union.",
  "proc-vehicle-tatra-kt8":
    "The Tatra KT8D5 is a three-section, bidirectional articulated tram built by CKD Tatra from 1984 for busy and hilly routes in Czech and Slovak cities such as Brno, Kosice and Most.",
  "proc-vehicle-skoda-15t":
    "The Skoda 15T ForCity is a fully low-floor articulated tram built by Skoda Transportation, in passenger service in Prague since 2011, with pivoting bogies under a low floor.",
  "proc-vehicle-vectron":
    "The Siemens Vectron is a modular family of electric and diesel locomotives presented in 2010, used by state railways and private freight operators across Europe.",
  "proc-vehicle-tgv":
    "The TGV Sud-Est opened France's first high-speed line, Paris to Lyon, in 1981; that year one of its sets set a world rail speed record of 380 km/h.",
  "proc-vehicle-ice-1":
    "The ICE 1 opened Germany's InterCityExpress service in 1991: two power cars with up to fourteen cars between them, running at up to 280 km/h.",
  "proc-vehicle-shinkansen-0":
    "The 0 series opened the Tokaido Shinkansen between Tokyo and Osaka in 1964, the world's first high-speed railway, at up to 210 km/h. Its bullet nose became the symbol of high-speed rail.",
  "proc-vehicle-shinkansen-n700s":
    "The N700S is JR Central's newest Tokaido Shinkansen train, in service since 2020: sixteen cars, up to 285 km/h, with batteries that can move it without power from the line.",
  "proc-vehicle-cr-cr400af":
    "The Fuxing CR400AF is a Chinese high-speed train built by CRRC Qingdao Sifang, in service since 2017 at up to 350 km/h on lines such as Beijing to Shanghai.",
  "proc-vehicle-eurostar-373":
    "The Class 373 is the first-generation Eurostar train, built by GEC-Alsthom to run through the Channel Tunnel between London, Paris and Brussels from 1994.",
  "proc-vehicle-br-hst":
    "The InterCity 125 is a British diesel high-speed train with a power car at each end. Introduced in 1976, it still holds the world speed record for a diesel train, 238 km/h, set in 1987.",
  "proc-vehicle-br-class-55":
    "The Class 55 Deltic is a British diesel locomotive built by English Electric from 1961, named after its two Napier Deltic engines; 22 of them hauled the East Coast expresses until 1981.",
  "proc-vehicle-lner-a4":
    "The LNER A4 is a streamlined Pacific steam locomotive designed by Nigel Gresley. In 1938 No. 4468 Mallard set the world speed record for steam traction, 126 mph (203 km/h).",
  "proc-vehicle-rocket":
    "Stephenson's Rocket won the Rainhill Trials in 1829 and set the pattern of the steam locomotive with its multi-tube boiler and blast pipe. It was built by Robert Stephenson and Company in Newcastle.",
  "proc-vehicle-up-big-boy":
    "The Union Pacific Big Boy is a 4-8-8-4 articulated steam locomotive built by ALCO from 1941 to haul freight over the Wasatch Range. 25 were built, and No. 4014 returned to service in 2019.",
  "proc-vehicle-prr-gg1":
    "The PRR GG1 is an electric locomotive built for the Pennsylvania Railroad from 1934, its streamlined body styled by Raymond Loewy. 139 were built, and the last ran in regular service in 1983.",
  "proc-vehicle-emd-f7":
    "The EMD F7 is a cab-unit diesel locomotive built by General Motors' Electro-Motive Division from 1949. More than 3,800 cab and booster units were built, and they replaced steam on many North American railroads.",
  "proc-vehicle-sf-cable-car":
    "The San Francisco cable cars are pulled by a cable running under the street, gripped through a slot between the rails. The city's first line opened in 1873, and its system is the last manually operated cable car system in the world.",
  "proc-vehicle-sbb-ce68":
    "The Ce 6/8 II Krokodil is a Swiss electric locomotive built from 1919 for heavy freight over the Gotthard line, named after its long, articulated noses.",
  "proc-vehicle-sbb-re460":
    "The Re 460 is the main electric locomotive of the Swiss Federal Railways, built by SLM with ABB from 1991; 119 of them haul InterCity trains across Switzerland.",
  // road vehicles
  "proc-vehicle-ikarus-280":
    "The Ikarus 280 is an articulated city bus built in Hungary from 1973. Tens of thousands served the cities of the Eastern Bloc.",
  "proc-vehicle-new-routemaster":
    "The New Routemaster is a hybrid double-deck bus built by Wrightbus for London from 2012, with three doors and two staircases, inspired by the original AEC Routemaster.",
  // aircraft
  "proc-vehicle-boeing-747":
    "The Boeing 747-400 is the best-selling version of the wide-body Jumbo Jet, with a two-crew glass cockpit, winglets and a longer upper deck. It entered service with Northwest Airlines in 1989.",
  "proc-vehicle-boeing-737":
    "The Boeing 737-800 is the most-built version of the Next Generation 737, a narrow-body twinjet in service since 1998 and a workhorse of low-cost airlines worldwide.",
  "proc-vehicle-airbus-a380":
    "The Airbus A380 is the largest passenger airliner ever built, a four-engined double-decker that entered service with Singapore Airlines in 2007. Production ended in 2021 after 251 aircraft.",
  "proc-vehicle-mcdonnell-douglas-md11":
    "The McDonnell Douglas MD-11 is a three-engined wide-body airliner developed from the DC-10. It entered service with Finnair in 1990, and most of those still flying are freighters.",
  // ships
  "proc-vehicle-ship-olympic":
    "The Olympic class were the three White Star Line ocean liners built by Harland and Wolff in Belfast: Olympic, which sailed in 1911, Titanic and Britannic.",
  "proc-vehicle-ship-cutty-sark":
    "Cutty Sark is a British tea clipper launched in 1869, one of the fastest sailing ships of her time. She is preserved in dry dock at Greenwich, London.",
  "proc-vehicle-ship-ss-great-britain":
    "SS Great Britain, designed by Isambard Kingdom Brunel and launched in 1843, was the first iron-hulled, screw-propelled steamship to cross the Atlantic. She is preserved in Bristol.",
  // buildings
  "proc-building-tower-eiffel":
    "The Eiffel Tower is the wrought-iron lattice tower on the Champ de Mars in Paris, built by Gustave Eiffel's company for the World's Fair of 1889. It was the tallest structure in the world until 1930.",
  "proc-building-notre-dame":
    "Notre-Dame de Paris is the Gothic cathedral on the Ile de la Cite, built mainly between 1163 and 1345 and known for its twin west towers, flying buttresses and rose windows.",
  "proc-building-tower-bigben":
    "Big Ben is the popular name of the clock tower of the Palace of Westminster in London, completed in 1859 and renamed Elizabeth Tower in 2012; strictly, the name belongs to its great bell.",
  "proc-building-brandenburg-gate":
    "The Brandenburg Gate is the neoclassical gateway in Berlin built from 1788 to 1791 to designs by Carl Gotthard Langhans, crowned by the Quadriga.",
  "proc-building-hist-colosseum":
    "The Colosseum is the elliptical amphitheatre in the centre of Rome, completed in AD 80 under the emperor Titus; it could seat some 50,000 spectators.",
  "proc-building-st-basils-cathedral":
    "St Basil's Cathedral on Red Square in Moscow was built from 1555 to 1561 on the orders of Ivan the Terrible; its painted onion domes make it one of the best-known buildings in Russia.",
  "proc-building-prague-main-station":
    "Prague main station (Praha hlavni nadrazi) is the largest railway station in Prague. Its Art Nouveau building by Josef Fanta was completed in 1909.",
  "proc-building-prague-castle-st-vitus":
    "St Vitus Cathedral is the Gothic cathedral inside Prague Castle, begun in 1344 and completed only in 1929. It holds the tombs of Bohemian kings and the Czech crown jewels.",
  "proc-building-white-house":
    "The White House in Washington, D.C. is the residence and office of the President of the United States, a neoclassical mansion designed by James Hoban and first lived in in 1800.",
  "proc-building-louvre-pyramid":
    "The Louvre Pyramid is the glass and steel entrance to the Louvre museum in Paris, designed by I. M. Pei and completed in 1989.",
  // every other confirmed vehicle, researched against Wikipedia (the model's own links first) and its sister wikis
  "proc-vehicle-adl-enviro400":
    "The Alexander Dennis Enviro400 is a twin-axle low-floor double-decker built in Britain by Alexander Dennis. It replaced the Alexander ALX400, was sold both as an integral bus and as separate body and chassis, offered a BAE Systems hybrid drive, and was succeeded by the Enviro400 MMC.",
  "proc-vehicle-aero-a10":
    "The Aero A.10 was a single-engine biplane airliner and the first commercial aircraft built in Czechoslovakia, with an enclosed cabin for three to five passengers and an open cockpit behind it. Five served Czechoslovak State Airlines on the Prague to Bratislava route until 1928.",
  "proc-vehicle-airbus-beluga":
    "The Airbus A300-600ST Super Transporter, nicknamed Beluga for its resemblance to the whale, is a wide-body freighter derived from the A300-600 to fly outsize aircraft parts such as wings and fuselage sections between Airbus factories. Five were built to replace the ageing Super Guppies.",
  "proc-vehicle-airbus-h145":
    "The Airbus Helicopters H145, formerly the Eurocopter EC145, is a twin-engine light utility helicopter derived from the MBB/Kawasaki BK 117. Seating up to nine passengers, it is marketed for air ambulance, rescue and police work, and the US National Guard flies nearly 500 as the UH-72.",
  "proc-vehicle-alstom-citadis":
    "Citadis is Alstom's family of low-floor trams, with over 8,000 ordered for more than 140 cities. The 402 is its seven-section, fully low-floor second-generation version, running in Bordeaux, Grenoble, Lyon, Paris (line T3), Dubai, Rio de Janeiro and Algiers.",
  "proc-vehicle-american-440":
    "A 4-4-0 American type steam locomotive, the wheel arrangement of Central Pacific's Jupiter and Union Pacific No. 119, which met nose to nose at Promontory Summit, Utah, at the 1869 Golden Spike ceremony completing the first transcontinental railroad.",
  "proc-vehicle-american-truck":
    "A North American semi-trailer truck: a conventional tractor unit, with the engine under a long hood ahead of the cab, pulling a semi-trailer on a fifth-wheel hitch. Most North American trucks use this layout; with eighteen tyres they are known as eighteen-wheelers or big rigs.",
  "proc-vehicle-amtrak-acela":
    "The first-generation trainset of Amtrak's Acela high-speed service on the Northeast Corridor, built by Alstom and Bombardier. Two TGV-derived power cars flank six coaches; at their debut the sets were the fastest trains in the Americas, reaching 240 km/h.",
  "proc-vehicle-amtrak-superliner":
    "A bilevel intercity passenger car built for Amtrak's long-distance trains in the western United States, based on Santa Fe's Budd Hi-Level cars. Pullman-Standard built 284 Superliner I cars, the last passenger cars built by Pullman.",
  "proc-vehicle-animal-bus-knifeboard-omnibus":
    "The knifeboard omnibus was a double-deck horse bus with a long central bench on its open upper deck, where passengers sat back to back facing the sides. Inside, passengers faced each other on two side benches; London's last horse bus ran in 1914.",
  "proc-vehicle-animal-bus-paris-omnibus":
    "The Compagnie generale des omnibus was formed in Paris by merging several urban transport companies and ran the city's horse-drawn omnibuses, later also trying trams, motor buses and trolleybuses. It was absorbed into the STCRP in 1921, a distant ancestor of the RATP.",
  "proc-vehicle-animal-bus-stagecoach":
    "The Concord coach is an American horse-drawn coach built by the Abbot-Downing Company of Concord, New Hampshire, and used as a stagecoach and mail coach. Its body hangs on leather thoroughbraces instead of steel springs, giving a swaying ride suited to rough North American roads.",
  "proc-vehicle-animal-bus-wagonette":
    "A wagonette is a light four-wheeled open carriage drawn by one or two horses, with a front seat for the driver and side benches on which passengers sit face to face after entering from the rear. Wagonettes are still common on the car-free island of Sark.",
  "proc-vehicle-animal-rail-budweis-coach":
    "Passenger coaches on the Budweis-Linz horse railway resembled stagecoaches, seating 6 to 24 people in two classes. The line had 69 of them; passenger service ran only in summer, and the trip between Budweis and Linz took 14 hours.",
  "proc-vehicle-animal-rail-budweis-wagon":
    "The Budweis-Linz-Gmunden horse railway was the second public railway on the European mainland, built mainly to carry salt from the Salzkammergut to Bohemia. Its 762 goods wagons, hauled by some 800 horses, carried salt and timber all year round until 1872.",
  "proc-vehicle-animal-rail-mine-tub":
    "A mine tub, or minecart, is a small wagon on a mine railway used to carry ore and other material won in traditional mining. In modern mines such carts have largely given way to belt conveyors underground and to large dumpers above ground.",
  "proc-vehicle-animal-rail-trolley":
    "A platelayers' trolley is a light hand-propelled rail car, a kind of handcar or draisine, used by track gangs to carry tools and materials for railway maintenance of way. Such cars are moved by their riders or pushed along by people from behind.",
  "proc-vehicle-animal-tram-bobtail":
    "A bobtail car is a small North American streetcar drawn by a single horse or mule. Animal-drawn cars carried city passengers across the United States in the 19th century, and mules were favoured in southern cities such as New Orleans for giving more hours of service a day.",
  "proc-vehicle-animal-tram-closed":
    "A closed horsecar is a single-deck tramcar with an enclosed passenger saloon, pulled along street rails by horses. Cars of this kind ran on city tramways across Europe and North America in the 19th century, before electric traction replaced them.",
  "proc-vehicle-animal-tram-double-deck":
    "Double-deck horse trams carried passengers on many 19th-century street tramways. One of the very few horse tram routes still in public service is at Victor Harbor, South Australia, where Clydesdale horses haul double-deck cars along a causeway to Granite Island.",
  "proc-vehicle-animal-tram-toastrack":
    "A toastrack car is an open-sided tram whose cross benches, set at right angles to the track with no aisle, resemble a toast rack. On tramways of the horse and early electric age such cars, usually roofed and often with reversible seats, were common in warm climates or for summer use.",
  "proc-vehicle-bell-206":
    "The Bell 206 JetRanger is a light two-bladed turbine helicopter developed by Bell from its unsuccessful entry for the US Army's Light Observation Helicopter contest. Marketed commercially as a five-seater, it was later adopted by the Army as the OH-58 Kiowa and led to the LongRanger.",
  "proc-vehicle-blackpool-balloon":
    "The Balloon is a double-deck tram built by English Electric for the Blackpool Tramway, where it formed the backbone of the fleet until the line was converted to modern light rail in 2012. Nine were then rebuilt to meet accessibility rules, and others remain in the heritage fleet.",
  "proc-vehicle-blue-bird-vision":
    "The Blue Bird Vision is a conventional school bus built by Blue Bird Corporation in Fort Valley, Georgia. It was the first cowled-chassis bus built on a chassis designed and made by the bus builder itself, and is sold across North America and exported worldwide.",
  "proc-vehicle-blue-train-24":
    "A series of sleeping cars used on Japan's Blue Trains, the long-distance overnight expresses nicknamed for the blue colour of their coaches. The services were cut back as the Shinkansen and regional airports spread, and the last ran in 2016.",
  "proc-vehicle-bmo-double-deck-coach":
    "Second-class double-deck open coach built by Waggonbau Gorlitz in 1976 for CSD: 50 cars, numbered 101-150, with a low-floor lower deck that eased boarding with prams and bicycles. Known as Bap, later Bmo and Bmto, all passed to Czech Railways and most were modernised after 2000.",
  "proc-vehicle-br-9f":
    "Robert Riddles' 2-10-0 heavy freight locomotive for British Railways, built at Crewe and Swindon; 251 were made. It could reach 90 mph on passenger trains, and No. 92220 Evening Star was the last steam locomotive built by British Railways.",
  "proc-vehicle-br-class-142":
    "Pacer railbus built for British Rail by BREL and Leyland, sharing much with the Leyland National bus. The 96 two-car units ran around Manchester, in the West Country as Skippers and across Northern England until withdrawn in 2020 under accessibility rules.",
  "proc-vehicle-br-class-158":
    "Express Sprinter diesel multiple unit built by BREL at Derby Litchurch Lane to replace older diesel trains on British regional routes. First run by ScotRail, it soon spread to secondary routes across the Midlands, Northern England, Wales and the South West.",
  "proc-vehicle-br-class-37":
    "English Electric Type 3 diesel-electric locomotive ordered under the British Rail Modernisation Plan. Long the main power for InterCity trains in East Anglia and Scotland, many still haul freight and engineering trains; enthusiasts call them tractors for their engine sound.",
  "proc-vehicle-br-class-378":
    "Bombardier Electrostar electric multiple unit designed for the London Overground, with wide metro-style sliding doors and longitudinal seating. All 57 trains were built at Derby and now run as five-car units.",
  "proc-vehicle-br-class-390":
    "Tilting electric train built by Alstom with Fiat Pendolino technology for the West Coast Main Line, now run by Avanti West Coast. Designed for 225 km/h but limited to 200 km/h in service, the units were lengthened from eight cars to nine or eleven.",
  "proc-vehicle-br-class-47":
    "Brush Type 4 diesel-electric locomotive, with 512 built at Brush's Falcon Works and BR's Crewe Works, the most numerous British mainline diesel class. It hauled passenger and freight trains for over 55 years, and some still hold mainline certificates.",
  "proc-vehicle-br-class-66":
    "Six-axle diesel-electric freight locomotive built by General Motors' Electro-Motive Division in London, Ontario, for EWS, whose order for 250 was called the biggest British loco order since steam. It was later sold widely in Europe as the EMD Class 66.",
  "proc-vehicle-br-class-800":
    "Bi-mode multiple unit built by Hitachi for the Intercity Express Programme, able to run under overhead wires or on underfloor diesel generators. Known as the IET with Great Western Railway and as Azuma with LNER, it replaced the InterCity 125 and 225 fleets.",
  "proc-vehicle-br-class-86":
    "Standard electric locomotive of British Rail for the newly electrified West Coast Main Line from London Euston; one hundred were built in 1965-66. Some later worked the Great Eastern Main Line to Norwich, and members served on the main line for up to 55 years.",
  "proc-vehicle-br-ic225":
    "British high-speed push-pull train of a Class 91 electric locomotive, Mark 4 coaches and a driving van trailer, derived from the Advanced Passenger Train. Designed for 225 km/h, it runs InterCity services on the East Coast Main Line from London King's Cross to Leeds and Edinburgh.",
  "proc-vehicle-br-mk1-coach":
    "The first standard carriage design of British Railways, built from 1951 to 1974 for use across all regions and made much stronger than earlier coaches. Later batches rode on Commonwealth bogies; Mk1s now run on charter trains and preserved railways.",
  "proc-vehicle-bristol-lodekka":
    "The Bristol Lodekka was a low-height half-cab double-decker built by Bristol Commercial Vehicles with Eastern Coach Works bodies, the first production bus with step-free access throughout the lower deck. Over 5,000 were built as the standard double-decker of Britain's nationalised bus companies.",
  "proc-vehicle-budd-rdc":
    "A self-propelled stainless-steel diesel railcar, also called the Budd car or Buddliner. Budd built 398 between 1949 and 1962 for rural and commuter lines; it was one of the few diesel multiple units to succeed commercially in North America.",
  "proc-vehicle-bus-1":
    "A bus is a motor vehicle that carries many more passengers than a car, typically 30 to 100, and is most commonly used in public transport. The most common type is the rigid single-decker used on city and suburban routes, with double-deck and articulated buses for heavier loads.",
  "proc-vehicle-bussing-d2u":
    "The Bussing D2U was a two-axle double-decker with a self-supporting body, made possible by Bussing's flat underfloor engine and built for West Berlin with bodies by O&K, DWM and Gaubschat. The 10.3-metre buses were delivered until 1964, and the last was retired in 1978.",
  "proc-vehicle-cabin-classic":
    "A classic aerial tramway cabin. In an aerial tramway, or cable car, the cabin hangs from a carriage running on one or two fixed track ropes and is clamped to a moving haul rope, so it shuttles back and forth between two stations.",
  "proc-vehicle-cablecar-cabin":
    "An aerial tramway car is the large cabin of a cable car that shuttles back and forth between two stations, hanging from one or two fixed track ropes and pulled by a separate haul rope. Its grip stays fixed to the haul rope throughout the ride, unlike a gondola lift's detachable cabins.",
  "proc-vehicle-cd-110":
    "Skoda electric shunting locomotives with a raised centre cab, nicknamed 'zehlicka' (the iron): 52 class 110 engines for 3 kV DC, 35 thyristor-controlled class 111 and 74 class 210 for 25 kV AC, used in yards and on light line work across Czechoslovakia.",
  "proc-vehicle-cd-130":
    "Skoda 3 kV DC Bo'Bo' locomotives of the first generation: 30 class 123 freight engines and 54 mixed-traffic class 130, nicknamed 'hrbata' or 'velbloud' (camel) for the fan housing on the roof. Several ran for industrial and private operators such as Viamont.",
  "proc-vehicle-cd-140":
    "Skoda type 12E, known as 'bobina': 100 built for CSD as class E 499.0, the first electric locomotive built in post-war Czechoslovakia for the new 3 kV DC lines, built with components licensed from Swiss firms Secheron and SLM Winterthur and used on express, passenger and freight trains.",
  "proc-vehicle-cd-150":
    "Skoda-built 3 kV DC express locomotives of 4,000 kW: the 27 class 150 engines were derived from the dual-system 350 'Gorila' by dropping its AC equipment, and Czech Railways rebuilt some as the 160 km/h class 151. Nicknamed 'banan' after the yellow-green paint.",
  "proc-vehicle-cd-169":
    "Skoda type 85E, a single 3 kV DC prototype nicknamed 'asynchron' for its asynchronous traction motors. It was meant to start a third generation of Skoda locomotives (planned class 170), but no series followed; it was only leased to CSD and CD and was later retired.",
  "proc-vehicle-cd-180":
    "Skoda six-axle 3 kV DC freight locomotives: two class 180 prototypes, then 150 class 181 (nicknamed 'sestikolak') and 168 lighter class 182, bought to replace steam on the main line from Prague to Cierna nad Tisou; many still haul heavy freight.",
  "proc-vehicle-cd-230":
    "Skoda's first 25 kV 50 Hz Bo'Bo' family: 110 class 230 locomotives, nicknamed 'laminatka' for their fibreglass body, the faster class 240 (145 built) and three class 340 conversions for the AC border crossings into Austria at Horni Dvoriste and Ceske Velenice.",
  "proc-vehicle-cd-263":
    "Second-generation Skoda locomotives: the 25 kV class 263 'princezna' (12 built) and the dual-system class 372, 35 of which were built for CSD and East Germany's DR (as class 180) for the cross-border line via Decin and Bad Schandau; class 371 is the 160 km/h rebuild.",
  "proc-vehicle-cd-451":
    "The EM 475.1, later Czech Railways class 451, is a Czechoslovak electric multiple unit for high-capacity suburban services, valued for its brisk acceleration and for reversing without shunting. Nicknamed Emilka and, after the look of its front, Zabotlam, it left regular service in 2018.",
  "proc-vehicle-cd-460":
    "The class 460 is a Czechoslovak electric multiple unit built in series by Vagonka Tatra Studenka for regional passenger services. After the split of Czechoslovakia it was used in both successor states, the Czech Republic and Slovakia.",
  "proc-vehicle-cd-470":
    "The class 470 were two prototype double-deck suburban electric units built for Czech Railways by Vagonka Studenka, each with two partly low-floor power cars and three double-deck class 070 trailers. Seating 602, they were later replaced in service by the class 471.",
  "proc-vehicle-cd-704":
    "Small two-axle CKD diesel-electric shunters for station and depot work, built as classes T 234.0, T 237.0 and T 238.0: three prototypes, then 77 in all until 1994. Reliable and economical, they are nicknamed 'Male lego' for their boxy modular shape.",
  "proc-vehicle-cd-710":
    "Diesel-hydraulic locomotive for light shunting and short freight runs, originally class T 334.0. CKD built it in Prague, later Slovak works continued: 475 were made, 99 of them for CSD and the rest for industrial sidings and export to East Germany, Hungary, India and Romania.",
  "proc-vehicle-cd-714":
    "Four-axle diesel locomotives of Czech Railways rebuilt by CKD from the older class 735: two prototypes kept the old cabs and bonnets, while the 58 series engines received new cabs and hoods. A planned further batch of 18 was cancelled when the maker ran into trouble.",
  "proc-vehicle-cd-742":
    "CKD four-axle diesel-electric hood locomotives for freight and shunting: class 742 (494 built, nicknamed 'kocour' or 'bangladeska') grew out of class 740, and ten class 743 followed for the steep Korenov line.",
  "proc-vehicle-cd-749":
    "Diesel-electric locomotives rebuilt by Czech Railways from CKD's class 751 and 752 (T 478.1 and T 478.2), nicknamed Bardotka. Between 1992 and 1996, 60 engines had their steam generators replaced by alternators to heat modern coaches electrically.",
  "proc-vehicle-cd-750":
    "Czech diesel-electric locomotives nicknamed Brejlovec (goggles) for their looks. CKD built the class 753 for express and freight work and the class 754 with electric train heating; in the 1990s over 160 class 753s were rebuilt with heating alternators as class 750.",
  "proc-vehicle-cd-771":
    "Six-axle diesel-electric locomotives for heavy shunting and freight, developed by CKD and built largely by SMZ Dubnica for Czechoslovak State Railways. They were nicknamed Cmelak (bumblebee) after CME3, the designation of the Soviet export version.",
  "proc-vehicle-cd-812":
    "Class 812 is a single prototype railcar of Czech Railways, numbered 812.613 and known as Esmeralda, rebuilt from a class 810 railcar. Experience with it was used to rebuild class 810 railcars into the class 814 Regionova units.",
  "proc-vehicle-cd-843":
    "The class 843 is a Czech diesel railcar built for Czech Railways by Moravskoslezska vagonka, now Skoda Vagonka, in Studenka. Czech Railways has owned and operated all of them from the start, running them on stopping, semi-fast and express trains.",
  "proc-vehicle-cd-green-white-coach":
    "Czech Railways' express and regional coaches inherited from CSD, here in CD's green and white paint: the 24.5 m UIC-Y family of first, second and composite classes, luggage and guard's vans (A, B, AB, BDs, Ds and others) and the longer 26.4 m Bdmtee and BDmeer.",
  "proc-vehicle-cd-y-coach":
    "The UIC type Y is a standardised international express coach based on French proposals, 24.5 m long with end doors and a side corridor. Shorter than type X, it has eight-seat second-class compartments; among others it was built for SNCF and the Danish DSB.",
  "proc-vehicle-chairlift-chair":
    "A chairlift carries skiers and sightseers on open chairs clipped to a continuously circulating steel rope strung between two terminals. It is the main on-hill transport at most ski areas, and a detachable high-speed quad can move about 2,400 people per hour, with larger chairs carrying more.",
  "proc-vehicle-cistern-semi-truck":
    "A tanker semi-truck is a tractor unit hauling a tank semi-trailer that carries liquids or gases such as fuel by road. Tanks may be insulated or pressurised and split into compartments for several loads, and their high centre of gravity and sloshing contents make them prone to rollover.",
  "proc-vehicle-cr-25t-coach":
    "An air-conditioned passenger car of China Railway's 25 series, developed with Bombardier technology for 160 km/h express trains in the national speed-ups. It is the standard car of the Z and T expresses, and a pressurised version runs on the line to Lhasa.",
  "proc-vehicle-cr-c70-wagon":
    "China Railway's 70-tonne freight wagons: the C70 open gondola, which succeeded the C64 and carries coal, ballast, containers and general goods, and the P70 general-purpose boxcar, which superseded the P64 and P65. CRRC has since delivered updated C70E and P70 cars.",
  "proc-vehicle-cr-cr200j":
    "The CR200J is a Fuxing-series train of China Railway, made up of a power car and unpowered passenger cars and jointly designed and built by six CRRC companies. It is the only Fuxing type designed for existing lines rather than new high-speed railways, and its green livery earned it the nickname Green EMU.",
  "proc-vehicle-cr-cr400bf":
    "Fuxing high-speed train developed and built by CRRC Changchun as part of the China Standardized EMU. It cruises at 350 km/h in commercial service, among the fastest conventional trains in the world, and is nicknamed Golden Phoenix.",
  "proc-vehicle-cr-crh2a":
    "Hexie high-speed train based on the Japanese E2-1000 Series Shinkansen, licensed from a consortium of Kawasaki, Mitsubishi Electric and Hitachi. China first bought 60 sets from Kawasaki for 250 km/h service; it was the second Shinkansen design exported.",
  "proc-vehicle-cr-crh380a":
    "Chinese high-speed train developed by CSR from the CRH2 programme and built by CRRC Qingdao Sifang, cruising at 350 km/h. A 16-car set reached 486.1 km/h in a trial run; officially it is the only CRH380 series not based on a foreign design.",
  "proc-vehicle-cr-crh3c":
    "Chinese version of the Siemens Velaro high-speed train, 300 mm wider than the Spanish Velaro E to seat five abreast. It runs on the Beijing-Tianjin intercity railway, the Wuhan-Guangzhou line and other Chinese high-speed lines.",
  "proc-vehicle-cr-crh5a":
    "Hexie high-speed train based on the Italian ETR 600 New Pendolino but built without tilting, for China Railway High-speed in northern China. Its technology was transferred to local manufacturers, and it runs steadily at 250 km/h.",
  "proc-vehicle-cr-crh6a":
    "The CRH6 is a Chinese regional and commuter higher-speed train, designed by CRRC Qingdao Sifang and built by CRRC Nanjing Puzhen at its Jiangmen factory in Guangdong. Unlike other CRH types, most CRH6 trains carry their own names instead of Hexie (Harmony).",
  "proc-vehicle-cr-df11":
    "The Dongfeng 11 is a semi-high-speed diesel-electric passenger locomotive developed by the Qishuyan works for 160 km/h running on the Guangzhou-Shenzhen Railway. Qishuyan built 459 of them before production ended in 2005, and one reached 183 km/h in a test.",
  "proc-vehicle-cr-df4":
    "The Dongfeng 4 is a Chinese diesel-electric locomotive, first built in trial production at the Dalian works before entering batch production. Part of the Dongfeng family of AC-DC electric-transmission diesels, it is planned to remain in China Railway service until 2035.",
  "proc-vehicle-cr-hxd1":
    "The HXD1, also designated DJ4, is a Chinese heavy-duty twin-unit electric freight locomotive of Bo'Bo'+Bo'Bo' arrangement. China Railway ordered 180 in 2004, and later three- and six-section versions were built for the Shenhua Group and China Energy Investment.",
  "proc-vehicle-cr-hxd3d":
    "The HXD3D is a Chinese six-axle electric passenger locomotive built by CRRC Dalian, rated at 7.5 MW from six 1.25 MW Toshiba traction motors. Like the HXD1D, it was developed as a high-power AC locomotive for quasi-high-speed service on China Railway.",
  "proc-vehicle-cr-hxn5":
    "The HXN5 is the Chinese version of the GE ES59ACi Evolution Series diesel-electric freight locomotive, powered by a 4,660 kW GEVO-16 engine. Two were built at Erie, Pennsylvania and the rest assembled by CRRC Qishuyan in Changzhou; an order for 700 was cut to 300 built.",
  "proc-vehicle-cr-js":
    "A 2-8-2 Mikado developed from the JF class for Chinese main-line freight and passenger trains, later shunting and industrial work. 1,916 were built at Dalian, Datong and other works, and the last retired at Sandaoling in 2024, ending regular steam operations in China.",
  "proc-vehicle-cr-qj":
    "A 2-10-2 heavy freight steam locomotive, China's main line freight engine by the 1980s. Datong Locomotive Works built all the production engines, 4,717 in total, and the class worked on until steam ended on China's national network in the early 2000s.",
  "proc-vehicle-cr-ss1":
    "The Shaoshan 1 was China's first mainline electric locomotive, a Co-Co machine for single-phase industrial-frequency AC built by the Zhuzhou Electric Locomotive Works with Soviet help. Its design followed the Soviet N60 (VL60) electric locomotive.",
  "proc-vehicle-cr-ss8":
    "The Shaoshan 8 is a semi-high-speed electric passenger locomotive developed from the SS5 and built by the Zhuzhou Electric Locomotive Works. Locomotive 0001 set a Chinese rail speed record of 239.6 km/h in 1998, and the class hauled through trains into Hong Kong.",
  "proc-vehicle-cr-sy":
    "A 2-8-2 Mikado steam locomotive built mainly at Tangshan for industrial lines in Chinese mines, steel mills and power plants. Over 1,800 were made, the last in 1999, and three were built for American tourist railroads.",
  "proc-vehicle-cruise-ferry":
    "A cruise ferry is a ship that combines a cruise ship with a roll-on/roll-off passenger ferry carrying cars and lorries. Such ships are most common on the Baltic and North Seas, where many passengers ride them for the cruise experience rather than to reach the destination port.",
  "proc-vehicle-csd-386":
    "CSD 386.001, a lighter three-cylinder express locomotive derived from class 387.0, the only one of its class. Built by Skoda in 1927, it was given a streamlined casing in 1937 and became the only streamlined steam locomotive of CSD; the casing was dropped by a 1948 decision.",
  "proc-vehicle-csd-433-0":
    "Four-coupled tank locomotive for CSD branch lines, developed by CKD from the proven class 423.0 with an axle load of only 13 t. All 60 were delivered in 1948 and hauled both passenger and freight trains on local lines.",
  "proc-vehicle-csd-456-0":
    "Four-coupled 1'D2' passenger tank locomotive built by CKD from 1927 for heavy excursion trains out of Prague, notably on the steep line to Benesov. Railwaymen named the 27 engines 'Krasin' after the icebreaker of the 1928 Nobile rescue; the last retired in 1973.",
  "proc-vehicle-csd-475-1":
    "Universal express steam locomotive built by Skoda in Plzen in 1947-1950, nicknamed 'Slechticna' (the noblewoman) for its elegant looks. Of 172 built, the last 25 went to North Korea; the rest hauled long-distance expresses, passenger and fast freight trains.",
  "proc-vehicle-csd-477-0":
    "Four-coupled express tank locomotive for fast suburban passenger trains, nicknamed 'papousek' (parrot). CKD built 60 in 1951-1952 and 1955; it was the last steam locomotive type CKD built for the Czechoslovak State Railways.",
  "proc-vehicle-csd-498-1":
    "The 'Albatros' express locomotives: Skoda built 15 for CSD in 1954 as a stronger version of class 498.0, with the boiler of class 556.0, roller bearings and a mechanical stoker. They hauled the heaviest Prague-Bratislava expresses, and 498.106 set the official Czechoslovak steam record of 162 km/h in 1964.",
  "proc-vehicle-csd-556-0":
    "Heavy freight steam locomotive built by Skoda in Plzen from 1951 to 1958, nicknamed 'stokr'. With 510 built it was the most numerous steam class in Czechoslovakia, hauling the heaviest main-line freight until steam ended in 1981; 556.036 is kept in working order.",
  "proc-vehicle-csd-636":
    "A (1'C)C four-cylinder compound Mallet built by MAVAG in Budapest as Hungarian class 601 for the steep Karlovac-Rijeka line. Six stayed in Czechoslovakia after 1918, numbered 636.0 from 1924; they were the heaviest and most powerful steam locomotives CSD ever owned.",
  "proc-vehicle-csd-balm":
    "A second-class bogie trailer car with rounded ends from the Czechoslovak State Railways (CSD), built to run in trains with railcars. In the coach lettering B stands for second-class seating; the trailer has two side doors and wrap-round end windows.",
  "proc-vehicle-csd-bam":
    "A second-class bogie passenger coach of the Czechoslovak State Railways (CSD), about 22 m long, with end doors, short gangways and a row of twelve windows. In the coach lettering B stands for second-class seating.",
  "proc-vehicle-csd-bdmtee":
    "Open second-class UIC-Z coach, 26.4 m long and rated for 160 km/h, built by VEB Waggonbau Bautzen for CSD. Its entrances are set unusually far in from the coach ends; 320 were made, most passing to Czech Railways and the rest to Slovakia, where they run as Bdtmee.",
  "proc-vehicle-csd-be31":
    "A two-axle second-class passenger coach of the Czechoslovak State Railways (CSD) from the interwar years, with enclosed vestibules at both ends, side and end doors and a toilet. In the coach lettering B stands for second-class seating.",
  "proc-vehicle-csd-bi20":
    "An early two-axle second-class compartment coach of the Czechoslovak State Railways (CSD), of the old pattern with a door to each compartment and open platforms with railings at both ends. In the coach lettering B stands for second-class seating.",
  "proc-vehicle-csd-classic-green-coach":
    "UIC type Y express coach, 24.5 m long, built from 1962 by VEB Waggonbau Bautzen in East Germany to UIC and OSZhD standards and widely used by CSD in first-class (A) and second-class (B) versions. After their origin they are often called Bautzen coaches.",
  "proc-vehicle-csd-dsk":
    "A two-axle luggage van of the Czechoslovak State Railways (CSD), with a planked body, a large sliding door and a guard's lookout. Luggage vans, lettered D, carried passengers' baggage and parcels in passenger trains.",
  "proc-vehicle-csd-m112":
    "A small two-axle steam luggage railcar built by Floridsdorf for the Austrian North Western Railway (class IXb). Three came to CSD, which numbered them M 112.0 from 1925 and used them on branch lines such as Polna-Stoky to Polna and Kutna Hora to Sedlec until 1948.",
  "proc-vehicle-csd-m131":
    "The M 131.1, later class 801 and nicknamed Hurvinek, is a two-axle Czechoslovak railcar built by Tatra Koprivnice and Vagonka Studenka until 1956. With 549 built it was the most numerous CSD railcar until the M 152.0 arrived, and some survive as heritage vehicles.",
  "proc-vehicle-csd-m240":
    "The M 240.0, renumbered class 820 in 1988, is a Czechoslovak diesel railcar built for CSD by Vagonka Tatra Studenka in the first half of the 1960s. After the split of Czechoslovakia the cars passed to Czech Railways and ZSR, and they are no longer in regular service.",
  "proc-vehicle-csd-m296":
    "The M 296.1, later class 853, was a four-axle Czechoslovak railcar built by Vagonka Studenka for international express trains, alongside the domestic M 296.2 (class 852). From 1997 to 2006 the remaining cars were modernised by Pars nova into class 854, each given its own name.",
  "proc-vehicle-csd-t499":
    "CKD's express diesel prototype, nicknamed Kyklop for the single large headlight under its cab window. Only two were built; in a 1976 test the first reached 176 km/h, still the record for a Czech diesel locomotive. The surviving engine was restored to working order in 2015.",
  "proc-vehicle-csd-t679-0":
    "Heavy diesel-electric locomotives built by CKD for Czechoslovak State Railways, 27 of them in the 1960s. Painted orange and nicknamed Pomeranc (orange), they carried steam generators for passenger trains and were among the most powerful and fastest CSD locomotives of their time.",
  "proc-vehicle-cta-5000":
    "The 5000-series cars of the Chicago L, built by Bombardier in Plattsburgh, New York, between 2009 and 2015. The CTA ordered 406 cars in 2006 and 300 more in 2011, taking the total order to 706 cars.",
  "proc-vehicle-curitiba-biarticulado":
    "Curitiba's bi-articulated buses run on the Rede Integrada de Transporte, one of the world's first bus rapid transit systems. Built on Volvo chassis with Marcopolo and Ciferal bodies, each carries up to 270 passengers through five doors and boards level from tube-shaped stations.",
  "proc-vehicle-db-101":
    "A three-phase electric locomotive built by Adtranz to replace the Class 103 as Deutsche Bahn's Intercity flagship; 145 were delivered. The American ALP-46 is derived from it, and it shares its heritage with the Bombardier Traxx.",
  "proc-vehicle-db-103":
    "Deutsche Bundesbahn's 200 km/h express electric locomotive, the backbone of TEE and InterCity services and the railway's flagship until the ICE arrived in 1991. 145 production units were built, and 103 118 reached 283 km/h in a 1985 test run.",
  "proc-vehicle-db-111":
    "Electric Bo'Bo' locomotives of the Deutsche Bundesbahn, successor of the class 110 express engine: 227 were built by Krauss-Maffei with Henschel, Krupp, Siemens, AEG and BBC. They introduced the DB standard driver's cab, whose layout is still used in many DB locomotives.",
  "proc-vehicle-db-120":
    "A Bo-Bo universal electric locomotive for fast passenger and heavy freight trains, one of the first with three-phase motors fed by thyristor power electronics. 65 were built, and the design was the basis for the ICE 1 and ICE 2 power cars.",
  "proc-vehicle-db-212":
    "The V 100.20, later Class 212, was the more powerful main-line variant of the Deutsche Bundesbahn's V 100 diesel family. 381 entered service by 1966; the last left regular DB service in 2004, and several converted units still serve DB Netz tunnel rescue trains.",
  "proc-vehicle-db-218":
    "A four-axle diesel-hydraulic locomotive for passenger and freight trains, the final and most numerous member of the DB V 160 family. Over 400 were built, and it was the backbone of Deutsche Bundesbahn main-line diesel traction until reunification.",
  "proc-vehicle-db-423":
    "A light-weight four-car articulated electric multiple unit for the S-Bahn networks of Munich, Frankfurt and other German cities, with an open interior and three doors on each side of every car. It spawned the related Classes 422, 424, 425/426 and 430.",
  "proc-vehicle-db-628":
    "The class 628 is a two-car diesel multiple unit of a power car and a driving trailer, built in large numbers for the Deutsche Bundesbahn as successor to the Uerdingen railbuses. It ran local trains on branch and secondary main lines across Germany; few remain in Deutsche Bahn service.",
  "proc-vehicle-db-642":
    "Deutsche Bahn's two-car Siemens Desiro Classic diesel multiple unit, used on regional services on non-electrified lines across Germany, notably in Bavaria, Saxony and Thuringia. DB Regio took 234 of them, and Austria's OBB runs a derived version.",
  "proc-vehicle-db-650":
    "A single-car diesel railcar for local lines in Germany and the Czech Republic, recognised by its trapezoidal window frames. Developed by ADtranz and later built by Stadler, around 500 were made for Deutsche Bahn (Class 650) and many private railways.",
  "proc-vehicle-db-dosto":
    "The Double-deck Coach is a bilevel passenger coach used by many European railways and Israel Railways, built over the years by DWA and Waggonbau Goerlitz, Adtranz, Bombardier and Alstom. The current generation runs at up to 200 km/h and seats 100 to 150 passengers per coach.",
  "proc-vehicle-db-ic-coach":
    "The coaches of Deutsche Bundesbahn's Intercity, the express category introduced in 1971 that was Germany's top train service until the ICE arrived. First-class Avmz and second-class Bpmz cars ran in long locomotive-hauled IC trains.",
  "proc-vehicle-db-ice-t":
    "A tilting electric multiple unit of DB Classes 411 and 415, procured to bring near-ICE speeds and comfort to curving conventional lines. Like the ICE 3 it has a lounge behind the driver's cab, separated only by a glass wall, and Austrian OBB also ran three sets.",
  "proc-vehicle-db-ice2":
    "The second series of German Intercity-Express trains: push-pull half-sets of one Class 402 power car, six intermediate cars and a cab car, which can be coupled in pairs. It is cleared for 280 km/h, less with the cab car leading.",
  "proc-vehicle-db-ice3":
    "A Deutsche Bahn high-speed electric multiple unit with its traction motors spread under the whole train rather than in power cars. It runs at up to 300 km/h in Germany, reached 368 km/h in trials, and became the basis of the Siemens Velaro family.",
  "proc-vehicle-db-ice4":
    "Deutsche Bahn's Class 412 Intercity-Express trainset, ordered from Siemens Mobility to replace locomotive-hauled InterCity trains and the older ICE 1 and ICE 2. Known as ICx during procurement, it runs in seven-, twelve- and thirteen-car formations.",
  "proc-vehicle-db-v200":
    "The Deutsche Bundesbahn's first series-built diesel-hydraulic express locomotive, with two V12 engines each driving one bogie. 86 were built, renowned for their reliability, and the design was licensed for British Rail's Warship classes.",
  "proc-vehicle-db-vt98":
    "A light two-axle diesel railbus developed by Waggonfabrik Uerdingen for Deutsche Bundesbahn branch lines, where steam operation was unprofitable. Counting licence builds, 1,492 power cars of the family were made between 1950 and 1971.",
  "proc-vehicle-dhr-b-class":
    "A small 0-4-0 saddle tank locomotive for the 2 ft gauge Darjeeling Himalayan Railway in West Bengal. 34 served the line; a few still haul trains between Darjeeling and Ghum round the Batasia loop, in blue livery with white lining.",
  "proc-vehicle-dmrc-rs1":
    "First-generation broad-gauge trains of the Delhi Metro, supplied for Phase I by Hyundai Rotem, Mitsubishi and MELCO. The stainless-steel cars were built first in South Korea and then by BEML in Bangalore, and opened what became India's busiest metro.",
  "proc-vehicle-dnt-184-5":
    "Skoda type 93E, a 3 kV DC Bo'Bo'Bo' freight locomotive planned to replace classes 181 and 182. Only four were built, for the Nastup Tusimice mines, and they work the Kadan-Tusimice line; until class 380 they were Skoda's most powerful locomotives.",
  "proc-vehicle-doppelmayr-omega":
    "The Omega IV is a gondola lift cabin built by CWA Constructions, a subsidiary of Doppelmayr, for detachable gondola lifts. Nearly 300 serve the Disney Skyliner in Florida, fitted with inward-facing benches and room for strollers to roll in without being folded.",
  "proc-vehicle-dr-243":
    "Universal Bo'Bo' electric locomotive of East Germany's Deutsche Reichsbahn, built by LEW Hennigsdorf; Deutsche Bahn lists it as class 143. With 646 built it counts among the most successful German electric classes; class 112 is its 160 km/h version.",
  "proc-vehicle-dr-52":
    "A simplified 2-10-0 war locomotive (Kriegslok) built in thousands by German and occupied-country works to supply the Eastern Front. After the war it served across Europe; East Germany's DR rebuilt 200 of its engines as the Class 52.80.",
  "proc-vehicle-dr-sbahn-berlin":
    "The Deutsche Reichsbahn's single double-deck coaches were built by Waggonbau Goerlitz, 672 of them including 100 driving trailers, with low entrances for step-free boarding. Used mainly on suburban and S-Bahn services, the coaches for Berlin were delivered in the wine-red and ivory capital livery.",
  "proc-vehicle-dr-vt1816":
    "The VT 18.16, later class 175, is a diesel-hydraulic express multiple unit built by VEB Waggonbau Goerlitz for the international services of the Deutsche Reichsbahn. Its name stood for 1,800 hp and 160 km/h, and it ran to Scandinavia, Austria and Czechoslovakia, notably as the Vindobona via Prague to Vienna.",
  "proc-vehicle-drg-01":
    "A two-cylinder 4-6-2 Pacific, the standard express locomotive of the Deutsche Reichsbahn's unified Einheitslok programme. 231 were built by six works, led by Henschel; in East Germany they hauled Berlin-Dresden express trains until 1977.",
  "proc-vehicle-drg-e18":
    "An electric express locomotive built in Germany and Austria for the Deutsche Reichsbahn, its fastest electric class apart from the E 19. After 1945 most survivors ran for the Deutsche Bundesbahn, with a few at the East German DR and the Austrian OBB.",
  "proc-vehicle-drg-e94":
    "A heavy electric freight locomotive of the Deutsche Reichsbahn, nicknamed the Green Crocodile for its likeness to the Swiss Crocodile. 200 were built, most by AEG and Krauss-Maffei, and they served the DB, DR and Austrian OBB until the late 1980s and 1990s.",
  "proc-vehicle-drg-svt877":
    "Germany's first fast diesel train, a streamlined two-car diesel-electric set built by WUMAG of Gorlitz for the Deutsche Reichsbahn. On the Berlin-Hamburg line it gave what was then the fastest regular railway connection in the world.",
  "proc-vehicle-eas-open-wagon":
    "Eas is the UIC lettering of the standard four-axle high-sided open wagon: E for an ordinary open wagon, a for four axles, s for 100 km/h. Tatra Poprad built many for CSD (national name Uae) in 1979-1984; they carry coal, timber and other bulk loads.",
  "proc-vehicle-eir-fairy-queen":
    "A 2-2-2 broad-gauge steam locomotive built at Leeds for the East Indian Railway Company, numbered 22. In 1998 Guinness World Records certified it as the world's oldest steam locomotive in regular operation, running heritage trains from New Delhi to Alwar.",
  "proc-vehicle-emd-f40ph":
    "A four-axle diesel-electric passenger locomotive built by EMD for Amtrak's short-haul routes. It became the backbone of Amtrak's diesel fleet after the SDP40F failed and was widely used on US commuter railroads and by VIA Rail in Canada.",
  "proc-vehicle-emd-gp9":
    "A four-axle diesel-electric locomotive built by General Motors' Electro-Motive Division, the second model of its General Purpose line. Its sixteen-cylinder engine gave 1,750 hp; over 4,000 were built, including units without cabs known as GP9Bs.",
  "proc-vehicle-emd-sd40-2":
    "A 3,000 hp six-axle C-C diesel-electric freight locomotive from EMD, one of the most successful North American designs: over 4,000 were built from 1972 to 1997 for railroads across the continent.",
  "proc-vehicle-emd-sd70ace":
    "A six-axle AC-traction freight locomotive from EMD's SD70 series, powered by a 16-cylinder 710 two-stroke engine. More than 2,100 were built, and Union Pacific runs several, one of them in Southern Pacific heritage livery.",
  "proc-vehicle-faccs-hopper-wagon":
    "Faccs is the UIC lettering of a four-axle open hopper wagon with controllable gravity discharge (F: special open wagon, cc: low discharge hopper). Czechoslovak examples, nationally named Sas, came from Poprad in 1970 and Studenka in 1977-1982.",
  "proc-vehicle-falls-hopper-wagon":
    "Falls is the UIC lettering of a four-axle open self-discharging hopper wagon (F: special open wagon, ll: loose gravity discharge, s: 100 km/h). CSD's Wap wagons of this type were built at Poprad from 1972 to 1983, and Czech and Slovak owners later rebuilt many.",
  "proc-vehicle-ge-es44ac":
    "A 4,400 hp six-axle AC-traction freight locomotive of GE's Evolution Series, built to meet the US EPA Tier 2 emission standards. It replaced the AC4400CW and was ordered by every Class I freight railroad in North America.",
  "proc-vehicle-ge-p42dc":
    "A passenger diesel locomotive of GE's Genesis series, built for Amtrak and Via Rail in Canada. A total of 321 Genesis units of all models were built between 1992 and 2001, and the P42DC long hauled most of Amtrak's diesel trains.",
  "proc-vehicle-glacier-express":
    "A panoramic coach of the Glacier Express, the Alpine train between Zermatt and St. Moritz run by the Matterhorn Gotthard Bahn and the Rhaetian Railway. Billed as the slowest express train in the world, it crosses the Oberalp Pass and the Landwasser Viaduct in about eight hours.",
  "proc-vehicle-gm-scenicruiser":
    "The GMC PD-4501 Scenicruiser was a three-axle two-level coach built by General Motors for Greyhound Lines, its raised rear deck recalling railroad dome cars. 1,001 were made between 1954 and 1956, and it became an icon of American highway travel into the mid-1970s.",
  "proc-vehicle-gondola-cabin":
    "A small gondola cabin hangs from the continuously circulating steel rope of a gondola lift, which runs between two stations over supporting towers and is driven by a bullwheel in one terminal. Such lifts are common at ski resorts in the Alps, where they are known as telecabines or cabinovie.",
  "proc-vehicle-gwr-castle":
    "Charles Collett's four-cylinder 4-6-0 express locomotive, built at Swindon Works for the Great Western Railway; 171 were built. In 1932 Tregenna Castle averaged 81.68 mph with the Cheltenham Flyer, then regarded as a world record for steam.",
  "proc-vehicle-habis-sliding-wall-wagon":
    "Habis is the UIC lettering of a bogie covered wagon with sliding walls: H for a special covered wagon, a for bogies, i for opening side walls and s for 100 km/h. The sliding walls open the sides of the wagon for loading.",
  "proc-vehicle-hadgs-hopper-wagon":
    "Hadgs is the UIC lettering of a bogie covered hopper wagon for grain: H for a special covered wagon, d for floor discharge traps, g for grain and s for 100 km/h. CSD's version, nationally named Zav, was built at Ceska Lipa from 1965 to 1973.",
  "proc-vehicle-hankyu-9000":
    "An aluminium-bodied eight-car commuter EMU operated by the Osaka-area private railway Hankyu. Eleven sets were built in Hitachi's A-train family for the Kobe, Takarazuka and Minoo lines.",
  "proc-vehicle-hong-kong-tram":
    "Hong Kong Tramways runs a narrow-gauge line on Hong Kong Island between Kennedy Town and Shau Kei Wan, with a branch through Happy Valley. It has the world's largest operating fleet of double-deck trams and uses them exclusively.",
  "proc-vehicle-hydrofoil-ferry":
    "A hydrofoil ferry rides on underwater foils that lift the hull out of the water as it gathers speed, cutting drag and allowing much higher speeds than a conventional boat. Soviet designs such as the Raketa and the Meteor, of which more than 400 were built, gave the Soviet Union the world's largest civil hydrofoil fleet.",
  "proc-vehicle-ikarus-260":
    "The Ikarus 260 is a high-floor three-door city and suburban bus built by Hungary's Ikarus until 2002, the factory's longest-produced model and the one made in the largest numbers. Every Hungarian bus company used it, and the Soviet Union and East Germany were its largest export buyers.",
  "proc-vehicle-ir-boxn-wagon":
    "Standard bogie freight wagons of Indian Railways: the BOXN, a high-sided open wagon with air brakes for coal, iron ore, limestone and other minerals that need no shelter from rain, and the BCNA, a covered bogie wagon mainly for food grains and cement.",
  "proc-vehicle-ir-icf-coach":
    "The standard Indian Railways passenger coach for six decades, built by the Integral Coach Factory in Chennai from a Swiss steel-shell design. More than 54,000 were made until 2018, in brick red, then blue, livery, before LHB coaches took over.",
  "proc-vehicle-ir-lhb-coach":
    "A stainless-steel passenger coach designed by Linke-Hofmann-Busch of Germany and built under licence in India, first for the Shatabdi Express. Rated for 160 km/h and designed to resist telescoping in a collision, it has replaced the older ICF coach across Indian Railways.",
  "proc-vehicle-ir-memu":
    "Mainline Electric Multiple Unit of Indian Railways for short and medium-distance routes beyond the city suburbs. Services began on the Asansol-Adra and Kharagpur-Tata sections, and the trains are built at ICF Chennai and RCF Kapurthala.",
  "proc-vehicle-ir-mumbai-emu":
    "Electric multiple unit of the Mumbai Suburban Railway, whose local trains carry more than 7.5 million commuters a day. The stainless-steel 12-car Siemens rakes, with bigger windows, forced ventilation and GPS passenger information, began on the Western Railway.",
  "proc-vehicle-ir-vande-bharat":
    "Semi-high-speed electric multiple unit trainsets designed and built by the Integral Coach Factory in Chennai for Indian Railways under the Make in India initiative. They reached 183 km/h in trials and run air-conditioned chair car services between cities up to 800 km apart.",
  "proc-vehicle-ir-wag12b":
    "Twin-section 25 kV AC freight electric locomotive developed by Alstom with Indian Railways and built at Madhepura in Bihar. Rated at 12,000 hp, twice the WAG-9, it hauls trains of over 6,000 tonnes on the dedicated freight corridors.",
  "proc-vehicle-ir-wam4":
    "25 kV AC mixed-traffic electric locomotive developed by Chittaranjan Locomotive Works for Indian Railways. 500 were built until 1983, and the class hauled passenger and freight trains for over 50 years and formed the basis of several later classes.",
  "proc-vehicle-ir-wap4":
    "25 kV AC passenger electric locomotive built by Chittaranjan Locomotive Works for Indian Railways. With 778 built until 2015 it was the most numerous Indian passenger electric class until the WAP-7, and almost all remain in mainline service.",
  "proc-vehicle-ir-wap5":
    "High-speed passenger electric locomotive of Indian Railways, the first ten imported from Adtranz in Switzerland and later ones built by Chittaranjan Locomotive Works. In 2014 a WAP-5 set an Indian rail speed record of 160 km/h between Delhi and Agra.",
  "proc-vehicle-ir-wap7":
    "Three-phase 25 kV AC locomotives of Indian Railways: the WAG-9 for freight and the WAP-7, its passenger version with a different gear ratio. The WAP-7 is the most powerful and most numerous passenger locomotive in India, able to haul 24-coach trains at 130 km/h.",
  "proc-vehicle-ir-wdg4g":
    "Dual-cab freight diesel-electric locomotive designed for Indian Railways by GE Transportation on its Evolution Series, with a 12-cylinder GEVO engine. A 13-year contract covers 700 locomotives from a GE-built plant at Marhowrah, replacing older ALCO designs.",
  "proc-vehicle-ir-wdm2":
    "ALCO-designed diesel-electric mixed-traffic locomotive of Indian Railways, built by ALCO and Diesel Locomotive Works in Varanasi. More than 2,700 were built, the most numerous Indian mainline diesel class of its time, and they served for over 60 years.",
  "proc-vehicle-ir-wdp4d":
    "Dual-cab version of the EMD GT46PAC passenger diesel-electric locomotive, built under licence at Banaras Locomotive Works for Indian Railways. With 525 built, it is the most numerous WDP-4 variant and among the fastest diesels in Indian service.",
  "proc-vehicle-ir-wg":
    "A broad-gauge 2-8-2 goods locomotive of Indian Railways, sharing its boiler and motion with the WP. 2,450 were built, most at Chittaranjan Locomotive Works, making it India's most numerous main-line class until the WDM-2 diesel.",
  "proc-vehicle-ir-wp":
    "A broad-gauge 4-6-2 Pacific for Indian passenger expresses, recognised by its bullet-nose smokebox casing, often with a painted star. 755 were built in India, Canada, the USA, Poland and Austria, and it hauled trains such as the Frontier Mail and the Taj Express.",
  "proc-vehicle-jnr-103":
    "A JNR commuter EMU built by several Japanese works, 3,447 cars from 1963 to 1984. It served commuter lines across Japan for decades and some sets still run for JR West and JR Kyushu.",
  "proc-vehicle-jnr-485":
    "The JNR 485 series, a limited express EMU that replaced diesel trains on many routes. About 1,500 cars were built, later run by JR East, JR West and JR Kyushu; the last set, a Joyful Train, was retired in December 2022.",
  "proc-vehicle-jnr-c62":
    "The largest and fastest steam passenger locomotive in Japan, a 4-6-4 designed by Hideo Shima and built with boilers from D52 locomotives. It hauled the Tsubame express; C62 17 set the narrow-gauge steam speed record of 129 km/h in 1954.",
  "proc-vehicle-jnr-d51":
    "A 2-8-2 freight steam locomotive designed by Hideo Shima, the most mass-produced locomotive in Japanese history with 1,115 built by several works. 174 are preserved in Japan, a few of them operational.",
  "proc-vehicle-jnr-dd51":
    "A centre-cab diesel-hydraulic locomotive with two V12 engines, built by Kawasaki Sharyo, Hitachi and Mitsubishi for Japanese National Railways main lines, with more power than the D51 steam class. 649 were built up to 1978, hauling both passenger and freight trains.",
  "proc-vehicle-jnr-ef66":
    "A six-axle Bo-Bo-Bo DC electric locomotive designed for fast container and refrigerated freight trains. Under JNR it also hauled blue train sleepers such as the Hayabusa; 89 were built.",
  "proc-vehicle-jr-e235":
    "A JR East commuter EMU, introduced on the Yamanote Line in Tokyo in 2015 and later in a suburban version on the Sobu Rapid and Yokosuka lines. Built by J-TREC as part of its sustina family, over 1,200 cars have been produced.",
  "proc-vehicle-jr-e259":
    "The E259 series, the JR East EMU that runs the Narita Express between central Tokyo and Narita International Airport. Kinki Sharyo and Tokyu Car built 22 sets, 132 cars, which entered service in October 2009.",
  "proc-vehicle-jr-kiha40":
    "The KiHa 40 series are diesel railcars introduced by Japanese National Railways for non-electrified suburban and rural lines and later run by the JR Group companies. Fuji Heavy Industries and Niigata Tekko built 888 of them, and some went on to Myanmar and Thailand.",
  "proc-vehicle-karosa-long":
    "The Karosa B 741 and its successors B 941 and B 961 were articulated Czech city buses of two rigid sections joined by a pivoting joint, with the rear engine driving only the third axle in a pusher layout. In many towns they replaced the Hungarian Ikarus 280.",
  "proc-vehicle-karosa-renault-citybus-12m":
    "The Citybus 12M was the Czech-built version of the Renault Agora low-floor city bus, made by Karosa in Vysoke Myto. Prague received 321 of these 12-metre buses, and the Agora family as a whole exceeded 11,000 vehicles, with the Paris operator RATP its largest buyer.",
  "proc-vehicle-karosa-renault-citybus-18m":
    "The Citybus 18M was the articulated 18-metre version of the Renault Agora low-floor city bus, built in the Czech Republic by Karosa in Vysoke Myto under the Renault and later Irisbus brands. Prague received 53 of them alongside 321 of the rigid 12-metre version.",
  "proc-vehicle-karosa-short":
    "The Karosa 700 and 900 series were the standard rigid buses of Czechoslovakia and the Czech Republic: the B 731 and B 732 city buses, the C 734 intercity coach and their successors B 931 and B 951. City and intercity versions shared a common frame and semi-self-supporting body.",
  "proc-vehicle-karosa-sm11":
    "The Karosa SM 11 was the standard Czechoslovak city bus of its era, with its engine and automatic gearbox mounted between the axles. About 9,900 were built until 1981, when the B 731 replaced it, and some were exported to Albania, Bulgaria, Hungary, Mongolia, Poland, Vietnam and Romania.",
  "proc-vehicle-kintetsu-hinotori":
    "The Kintetsu 80000 series, a limited express EMU branded Hinotori that entered service in March 2020 on Kintetsu's intercity services. Its name means phoenix; it has a metallic red exterior and premium cars with 1+2 seating.",
  "proc-vehicle-kpev-p8":
    "A 4-6-0 superheated passenger locomotive designed by Robert Garbe for the Prussian state railways, also used on goods trains. Some 3,500 were built for German railways alone, and after the First World War many went abroad as reparations.",
  "proc-vehicle-kvag-gt4":
    "The GT4 is a four-axle articulated tram built by Maschinenfabrik Esslingen, whose first 350 cars went to the Stuttgart tramway operator SSB. Freiburg, Neunkirchen and Reutlingen bought 30 more, and GT4s still run in Iasi, Romania, in Fukui, Japan, and on Stuttgart's heritage lines.",
  "proc-vehicle-legacy-covered-wagon":
    "A covered goods wagon, fully enclosed by sides and a fixed roof to carry moisture-sensitive goods. In the old Czechoslovak lettering Z marked covered wagons, Zaz a bogie wagon with a sliding roof (UIC Taes) and Lp a refrigerated van (UIC Ibops).",
  "proc-vehicle-legacy-heavy-wagon":
    "A heavy low-loading special wagon. In the UIC lettering U marks a special wagon, aa six or more axles, i a low-loading platform and kk the band of its maximum load, so the deck sits low between the bogies for tall and heavy loads.",
  "proc-vehicle-legacy-open-wagon":
    "Vte was the Czechoslovak national name of the two-axle high-sided open wagon lettered Es under the UIC scheme: E for an ordinary open high-sided wagon, s for 100 km/h. CSD bought them from Yugoslavia and Romania and from the Ceska Lipa works.",
  "proc-vehicle-leyland-national":
    "The Leyland National was an integral British single-decker bus built in large numbers at a purpose-built factory in Workington, a joint project of the National Bus Company and British Leyland. Styled by Giovanni Michelotti, it was meant to replace all of British Leyland's rear-engined single-deckers.",
  "proc-vehicle-liaz-677":
    "The LiAZ-677 is a Soviet high-floor city bus built by the Likinsky Bus Plant and mass-produced until 1994. The plant's most popular model and the first Soviet bus with an automatic gearbox, it served urban and suburban routes in almost every city of the Soviet Union.",
  "proc-vehicle-light-jet":
    "A light jet is a small business jet, an aircraft built to carry a few passengers such as business executives faster and more comfortably than airline travel. Business jets of this kind also serve as air ambulances, express parcel carriers and transports for government officials.",
  "proc-vehicle-lms-black-five":
    "William Stanier's mixed-traffic 4-6-0 for the London, Midland and Scottish Railway, the Class 5 known as the Black Five. 842 were built, several worked until the last day of British Railways steam in 1968, and eighteen are preserved.",
  "proc-vehicle-lner-a3":
    "Nigel Gresley's three-cylinder 4-6-2 express locomotive for the LNER East Coast Main Line, including the famous Flying Scotsman. In 1935 A3 Papyrus reached 108 mph, a world record for a non-streamlined locomotive at the time.",
  "proc-vehicle-lu-1938-stock":
    "London Underground tube stock built by Metro-Cammell and Birmingham RC&W, the first with all electrical equipment under the floor. It served several tube lines until 1988, and refurbished sets ran on the Isle of Wight as Class 483 until 2021.",
  "proc-vehicle-mav-mdmot":
    "The MDa, later MDmot, is a diesel-hydraulic railcar with a baggage compartment, developed and built by Ganz-MAVAG in Budapest for the Hungarian State Railways. It worked passenger trains on non-electrified main and branch lines.",
  "proc-vehicle-mb-citaro":
    "The Mercedes-Benz Citaro is a low-floor city bus built by Mercedes-Benz/EvoBus in rigid and articulated forms. It became one of the most widespread buses in Europe and parts of Asia, with more than 55,000 produced by December 2019.",
  "proc-vehicle-mb-citaro-blue":
    "The Citaro, built by EvoBus under the Mercedes-Benz brand, is a low-floor single-decker offered as a rigid or articulated bus. Many operators across Europe and parts of Asia run it in their own liveries, and more than 55,000 had been produced by the end of 2019.",
  "proc-vehicle-mb-o305":
    "The Mercedes-Benz O305 was the Mercedes version of the German VoV standard city bus, built in Mannheim as a complete bus or as a chassis until 1988. Designed as a single-decker, it was later adapted for double-deck and articulated bodies, and other makers built their own versions of the same standard design.",
  "proc-vehicle-mb-o345-g":
    "The O 345 G is the 18-metre articulated version of the Mercedes-Benz O 345, a mid-floor city bus built at Hosdere in Turkey mainly for Eastern European markets. From 2002 the range was renamed Conecto, the articulated model becoming the Conecto G.",
  "proc-vehicle-medellin-metrocable":
    "A gondola lift system built by Poma that extends the Medellin Metro up the steep hillsides of the city's informal settlements. Its Line K was the first cable-propelled urban transit line in South America and the first in the world dedicated to public transport.",
  "proc-vehicle-mercedes-atego-1224":
    "The Mercedes-Benz Atego is Daimler's range of general-purpose rigid trucks for distribution work, offered today from 6.5 to 16 tonnes gross weight with four- or six-cylinder engines. New generations followed in 2004 and 2013.",
  "proc-vehicle-metro-81-71":
    "The 81-717/714 is a Soviet metro train of 81-717 control cars and 81-714 trailers, built by Metrovagonmash in Mytishchi and by Vagonmash in Saint Petersburg. With over 7,000 cars for systems in 11 countries it is the most widespread metro train ever; Prague has run it since 1978.",
  "proc-vehicle-mgb-hge442":
    "Electric locomotive with both adhesion and rack drive for Swiss metre-gauge mountain lines, ordered by the Furka Oberalp Bahn, SBB for the Brunig line and the Brig-Visp-Zermatt-Bahn. Five prototypes were followed by 16 production units.",
  "proc-vehicle-mil-mi8":
    "The Mil Mi-8, NATO name Hip, is a Soviet medium twin-turbine helicopter and the most-produced helicopter in the world, with over 17,000 built for more than 50 countries. Mostly a transport, it also serves as a gunship, airborne command post and reconnaissance aircraft.",
  "proc-vehicle-mixer-truck":
    "A concrete mixer truck, or in-transit mixer, carries ready-mixed concrete to building sites in a revolving drum fitted with a spiral blade: turned one way it keeps the load agitated on the road, turned the other it discharges the concrete down a chute or into a pump.",
  "proc-vehicle-mtr-m-train":
    "The Metro-Cammell EMU, or M-Train, is the oldest type of train on Hong Kong's MTR, with 768 cars built in England by Metro-Cammell and its successors GEC-Alsthom and Alstom. The cars were refurbished by United Goninan between 1998 and 2001.",
  "proc-vehicle-muv-69":
    "The MUV 69 is a motorised track trolley used widely on Czech and Slovak railways: a draisine with a cargo platform, also fitted as a work vehicle with a crane, tipping body, welding set or catenary platform. Around 1,000 were built by the CSD track mechanisation works, later MTH Praha.",
  "proc-vehicle-nas-flat-wagon":
    "Nas was the Czechoslovak national name of the bogie flat wagon lettered Res under the UIC scheme (R: ordinary flat wagon with bogies, e: folding sides). CSD received them from Studenka in 1967-1970 and from Poprad in 1976-1978; such flats suit timber and long steel goods.",
  "proc-vehicle-ncrtc-namo-bharat":
    "Semi-high-speed regional trains of the National Capital Region Transport Corporation, designed by Alstom in Hyderabad and built at Savli in Gujarat. They serve the Delhi-Meerut corridor, India's first regional rapid rail line, with a design speed of 180 km/h.",
  "proc-vehicle-neoplan-skyliner":
    "The Neoplan Skyliner is a multi-axle double-deck luxury touring coach from the German maker Neoplan, grown from Konrad Auwarter's 1960s double-deck bus design. It gave the Neoplan brand its distinctive image across Europe and was also built in the United States as the AN122/3.",
  "proc-vehicle-ngong-ping-crystal":
    "A cabin of Ngong Ping 360, the 5.7 km bicable gondola lift by Leitner on Lantau Island, Hong Kong, linking Tung Chung with the Tian Tan Buddha. Premium Crystal Cabins with glass floors were introduced in 2009.",
  "proc-vehicle-ns-1100":
    "Electric locomotive built by Alsthom for Nederlandse Spoorwegen to a design derived from the French BB 8100, with its buffers mounted on the bogies. It hauled all kinds of trains until the 1600s arrived; after a 1978 accident the class gained a crash-absorbing nose.",
  "proc-vehicle-ns-1200":
    "Electric locomotive of Nederlandse Spoorwegen designed by Baldwin and Westinghouse and built by Werkspoor in Utrecht with Heemaf electrical equipment, partly from Marshall Plan parts. Only 25 were built; five later hauled freight for ACTS.",
  "proc-vehicle-ns-1300":
    "Six-axle Co-Co electric locomotive built by Alstom for Nederlandse Spoorwegen alongside the Class 1100 and based on the SNCF CC 7100. The first opened electric service between Zwolle and Groningen; in the 1980s the class was painted yellow and named after Dutch towns.",
  "proc-vehicle-ns-1700":
    "Family of electric locomotives built by Alstom for Nederlandse Spoorwegen and based on the French BB 7200: 58 locomotives of Class 1600 and 81 of Class 1700. Many work push-pull trains with double-deck or rebuilt InterCity coaches.",
  "proc-vehicle-ns-2200":
    "Diesel-electric Bo-Bo locomotive of Nederlandse Spoorwegen, built to an American Baldwin-Westinghouse design by Allan and Heemaf and by the French MTE group. The 150 locomotives helped retire Dutch steam by 1958 and worked freight and passenger trains until 2003.",
  "proc-vehicle-ns-3700":
    "A 4-6-0 express passenger steam locomotive of the Dutch State Railways, later Nederlandse Spoorwegen, nicknamed Jumbo. 120 were built by Beyer, Peacock, Werkspoor and German works; the last was withdrawn in 1958 and No. 3737 survives at the Spoorwegmuseum.",
  "proc-vehicle-ns-ddz":
    "A double-deck electric multiple unit of the Dutch Railways, rebuilt from 2009 out of DD-AR push-pull coaches built by Talbot, De Dietrich and Adtranz. The modernisation turned the former Sprinter stock into intercity trains, with 240 coaches forming 50 units.",
  "proc-vehicle-ns-de1":
    "A single-car diesel railcar of the Dutch Railways, part of the Plan X family nicknamed Blauwe Engel (Blue Angel) after its original light blue livery. Built by Allan of Rotterdam, 30 DE-1 cars served branch lines in Friesland, Groningen and South Limburg.",
  "proc-vehicle-ns-flirt":
    "Stadler FLIRT electric multiple units bought by Nederlandse Spoorwegen for the Dutch main network, in three-car and four-car versions numbered 2200 and 2500. NS took 58 units, which run at up to 160 km/h.",
  "proc-vehicle-ns-icm":
    "An intercity electric multiple unit of the Dutch Railways built by Talbot, nicknamed Koploper for its walk-through nose that let passengers pass between coupled sets. 144 were built and long served the main intercity routes; refurbished sets are called ICMm.",
  "proc-vehicle-ns-icng":
    "An intercity electric multiple unit of the Dutch Railways, built by Alstom Konstal in Poland on the Coradia Stream platform and nicknamed Wesp (Wasp). 79 sets were ordered, including for the high-speed line from Amsterdam towards Belgium.",
  "proc-vehicle-ns-icr-coach":
    "The Intercityrijtuig, a 26.4 m intercity coach built by Talbot of Aachen for the Dutch Railways and based on the middle cars of the ICM. Versions ran to Belgium, Germany and Luxembourg, and later on the HSL-Zuid high-speed line, until the ICNG replaced them in 2025.",
  "proc-vehicle-ns-mat46":
    "An electric multiple unit of the Dutch Railways, built by Werkspoor, Allan and Beijnes to replace wartime losses and extend electric services. 144 two- and four-car sets were made, nicknamed Muizeneus (mouse nose), and they ran in passenger service until 1983.",
  "proc-vehicle-ns-mat54":
    "A Dutch electric multiple unit known as the Hondekop (Doghead) for its long nose, designed to protect the driver. 153 sets were built by Allan, Beijnes and Werkspoor, including a dual-voltage Benelux version linking Amsterdam with Antwerp and Brussels.",
  "proc-vehicle-ns-plan-v":
    "The two-car Mat '64 stopping-train unit of the Dutch Railways, built mostly by Werkspoor and Talbot; 246 sets made it NS's largest series until the double-deck VIRM. It was the first NS design with sliding doors, and ran in regular service until 2016.",
  "proc-vehicle-ns-sgm":
    "The Stadsgewestelijk Materieel, the original Sprinter: a fast-accelerating electric multiple unit built by Talbot for frequent local services in the Randstad, including the Zoetermeer Stadslijn. 90 units ran from 1975 until the last left service in 2021.",
  "proc-vehicle-ns-slt":
    "The Sprinter Lighttrain, a low-floor electric multiple unit for Dutch stopping services, mainly in the Randstad, derived from the DB Class 425. 69 four-car and 62 six-car units were built, with regenerative braking that feeds power back into the overhead line.",
  "proc-vehicle-ns-sng":
    "The Sprinter New Generation, a low-floor electric multiple unit built by CAF in Spain on its Civity platform for Dutch stopping services. Jacobs bogies give a spacious interior; after a 2020 level-crossing collision its dark blue fronts were repainted yellow.",
  "proc-vehicle-ns-v250":
    "High-speed train designed by Pininfarina and built by AnsaldoBreda for the Fyra service between Amsterdam and Brussels. Withdrawn after only 39 days of full service over safety and structural problems, the 19 sets were later bought by Trenitalia as the ETR 700.",
  "proc-vehicle-ns-virm":
    "A double-deck intercity electric multiple unit of the Dutch Railways, built mostly by Talbot in four- and six-car sets; 178 sets exist, many lengthened from the earlier DD-IRM. It is NS's main intercity train on most of the network.",
  "proc-vehicle-nyc-hudson":
    "The J-3a Super Hudson, the last class of the New York Central's 4-6-4 Hudson passenger locomotives, which hauled the 20th Century Limited and the Empire State Express. Ten were given streamlined shrouds by Henry Dreyfuss.",
  "proc-vehicle-nyc-r160":
    "A New Technology Train subway car for the New York City Subway's B Division, built by Alstom (R160A) and Kawasaki (R160B). With 1,662 cars it is the most numerous car type on the system, known for its FIND route displays.",
  "proc-vehicle-obb-1012":
    "Four-axle universal electric locomotive of the Austrian Federal Railways, built by SGP with Siemens, ELIN and ABB equipment as a prototype successor to class 1044. Only three were made; OBB chose classes 1016 and 1116 for series orders and sold them to Sweden's Hector Rail in 2007.",
  "proc-vehicle-obb-1040":
    "The first electric locomotive built for the Austrian Federal Railways after the Second World War, derived from classes 1045, 1145 and 1245. Floridsdorf and ELIN delivered 16 in two batches, the second with a sleeker body, and they stayed in service until 2003.",
  "proc-vehicle-ocean-liner":
    "An ocean liner is a passenger ship built to carry people, often with mail and cargo, across oceans on a fixed schedule. Liners were the main mode of intercontinental travel from the mid-19th century until airliners displaced them in the 1950s; fast ships raced for the Blue Riband.",
  "proc-vehicle-odakyu-gse":
    "The Odakyu 70000 series GSE, a Romancecar limited express EMU with observation saloons at both ends, running from Shinjuku to Hakone-Yumoto. Two seven-car sets were built by Nippon Sharyo, replacing the 7000 series LSE.",
  "proc-vehicle-pao-flat-wagon":
    "Pao was the Czechoslovak national name of a four-axle flat wagon without sides, 15.24 m over buffers, lettered Smmp under the UIC scheme (S: special flat wagon with bogies, p: no sides). Smichov, Studenka, Ceska Lipa and Kralovopolska built them for CSD from 1950 to 1965.",
  "proc-vehicle-passenger-ferry":
    "A passenger ferry is a boat or ship that carries people across a body of water as part of a regular service. Ferries form part of the public transport of many waterside cities and islands, linking points directly at a much lower capital cost than a bridge or tunnel.",
  "proc-vehicle-pcc-streamliner":
    "The PCC car is a streamlined streetcar developed by the US Presidents' Conference Committee and first built in the 1930s. About 5,000 were built in the United States until 1952, and over 15,000 licensed derivatives in Europe, including the Tatra T3.",
  "proc-vehicle-peak-2-peak":
    "The Peak 2 Peak Gondola is a Doppelmayr 3S tricable gondola at Whistler Blackcomb in British Columbia, the first lift to join Whistler and Blackcomb mountains. Its 3.03 km free span was a world record until 2017, and it runs up to 436 m above the ground.",
  "proc-vehicle-pioneer-zephyr":
    "The stainless-steel streamliner built by Budd for the Burlington Route, the first diesel-powered streamliner in US revenue service. Its 1934 Dawn-to-Dusk dash ran 1,015 miles from Denver to Chicago non-stop; it is preserved in Chicago's Museum of Science and Industry.",
  "proc-vehicle-poma-funitel":
    "A funitel is a gondola lift whose cabins hang from two parallel overhead cables, making them much steadier in high winds than an ordinary gondola. The large cabins carry around 20 to 30 people, usually skiers; the name joins the French words funiculaire and telepherique.",
  "proc-vehicle-praga-rv":
    "The Praga RV was a three-axle Czechoslovak army off-road truck with two driven rear axles, built by Praga in the late 1930s. It carried cargo and troops, towed artillery and served as an ambulance, and was exported to Iran, Peru, Poland, Sweden, Switzerland and Turkey.",
  "proc-vehicle-prr-k4s":
    "The Pennsylvania Railroad's principal mainline passenger steam locomotive, a 4-6-2 Pacific. 425 were built between 1914 and 1928, and they hauled passenger trains across the whole PRR system until 1957.",
  "proc-vehicle-rah-tank-wagon":
    "Rah was a Czechoslovak national name for four-axle tank wagons, lettered Zaes under the UIC scheme (Z: tank wagon, a: four axles, e: heating equipment). Studenka built 400 hl versions in the 1960s for chemicals such as sodium hydroxide, toluene, benzene, solvents and acids.",
  "proc-vehicle-raj-hopper-wagon":
    "Raj was the Czechoslovak national name of a four-axle wagon carrying four 130 hl vessels that are emptied by compressed air, lettered Uacs under the UIC scheme (U: special wagon, c: compressed-air discharge). Poprad built the type 451 for CSD from 1967 to 1987.",
  "proc-vehicle-reefer-semi-truck":
    "A reefer semi-truck is a tractor unit pulling an insulated, refrigerated box semi-trailer that carries perishable freight at low temperatures. Most long-distance refrigerated road transport is done this way, though insulated curtainsider trailers are also common in some countries.",
  "proc-vehicle-rhb-allegra":
    "Three-car dual-voltage metre-gauge multiple unit built by Stadler for the Rhaetian Railway, working the Bernina line, the Arosa line and Landquart-Davos. Fifteen were built, and one set a metre-gauge speed record of 139 km/h in the Vereina Tunnel.",
  "proc-vehicle-rhb-ge443":
    "Metre-gauge Bo-Bo electric locomotive of the Rhaetian Railway, a class of 12 named after small communities in Graubunden. It heads most trains on the Albula line, alone hauls the car trains through the Vereina Tunnel and wears advertising liveries.",
  "proc-vehicle-rhb-ge66":
    "Metre-gauge articulated C-C electric locomotive of the Rhaetian Railway, nicknamed the Rhaetian Crocodile for its likeness to the Gotthard Crocodiles. Fifteen were built and hauled the heaviest trains, including the Glacier Express, until newer classes arrived.",
  "proc-vehicle-roosevelt-island-tram":
    "The aerial tramway across the East River between Manhattan's Upper East Side and Roosevelt Island, the first commuter aerial tramway in the United States. Swiss firm Von Roll built the original line; since a 2010 rebuild its 110-person cabins run independently.",
  "proc-vehicle-sbb-ae66":
    "Heavy six-axle electric locomotive of the Swiss Federal Railways designed for the Gotthard line. The first 25 were named after Swiss cantons and carried their coats of arms and chrome stripes, which earned the class the nickname canton locomotive.",
  "proc-vehicle-sbb-ae814":
    "Gotthard double locomotive of the Swiss Federal Railways, the last of three Ae 8/14 prototypes. Shown at the 1939 Swiss National Exhibition, which gave it the nickname Landi-Lok, it had 8,170 kW and was for a time the most powerful locomotive in the world.",
  "proc-vehicle-sbb-ew4-coach":
    "The Einheitswagen IV, the last generation of the Swiss standard coach, combining traits of the French Corail and the Eurofima coach. 540 were built, mostly for SBB InterCity and InterRegio trains, and about 300 were later upgraded to run at 200 km/h.",
  "proc-vehicle-sbb-flirt":
    "Stadler FLIRT (Fast Light Innovative Regional Train), a low-floor regional multiple unit first developed for the Swiss Federal Railways. The design proved highly adaptable, with more than 2,750 units ordered by operators in 24 countries.",
  "proc-vehicle-sbb-fv-dosto":
    "Double-deck long-distance electric multiple unit built by Bombardier for the Swiss Federal Railways on its Twindexx platform. It was the most expensive order in SBB history; the 62 trains entered service after delays of more than four years, and their tilt system was switched off.",
  "proc-vehicle-sbb-giruno":
    "Stadler SMILE high-speed train, called Giruno by SBB, which Stadler describes as the first single-deck low-floor high-speed train. The 11-car units run through the Gotthard Base Tunnel between Basel or Zurich and Milan at up to 250 km/h.",
  "proc-vehicle-sbb-ic2000":
    "A double-deck intercity coach of the Swiss Federal Railways, the first double-deck train in nationwide service in Switzerland. 341 were built by Schindler and Alstom, with an exterior by Pininfarina matching the Re 460 locomotive, for push-pull trains at up to 200 km/h.",
  "proc-vehicle-sbb-icn":
    "Tilting InterCity electric multiple unit of the Swiss Federal Railways, developed jointly by Bombardier, SBB and Alstom with a Pininfarina body and SIG bogies and tilt system. Forty-four seven-car sets were delivered, in time for Expo.02.",
  "proc-vehicle-sbb-kiss":
    "Stadler KISS bilevel electric multiple unit for commuter and regional traffic, in which passengers board into the lower deck. Around 700 sets had been sold to operators in 14 countries by 2025, among them the Swiss Federal Railways.",
  "proc-vehicle-sbb-rae-tee":
    "First-class-only Trans Europ Express electric multiple unit of the Swiss Federal Railways, built by SIG and MFO to run under four electrification systems on international routes such as the Gottardo. Five sets were built; one, number 1053, is preserved.",
  "proc-vehicle-sbb-re420":
    "Versatile Bo-Bo electric locomotive of the Swiss Federal Railways, built over 21 years until 1985. It is the largest SBB locomotive series and the most common locomotive in Switzerland, now used mainly for freight and some push-pull passenger trains.",
  "proc-vehicle-sbb-re620":
    "Six-axle electric locomotive of the Swiss Federal Railways, built to replace the Ae 6/6 on the Gotthard line and the most modern of the Gotthard locomotives. It rides on three two-axle bogies, and paired with a Re 4/4 II it hauls heavy trains as the Re 10/10.",
  "proc-vehicle-sbb-roter-pfeil":
    "Streamlined railcars built for the Swiss Federal Railways in the 1930s for lightly used lines, which later became popular on charter and special services. The best known is the Churchill Pfeil, a double unit once used by Winston Churchill and still run by SBB Historic.",
  "proc-vehicle-shinkansen-100":
    "The successor to the original 0 series on the Tokaido and Sanyo Shinkansen, with a sharper nose and the first double-deck Shinkansen cars. A total of 1,056 cars in 66 sixteen-car sets were built; the last were withdrawn in 2012.",
  "proc-vehicle-shinkansen-500":
    "JR West's 500 series, designed for 320 km/h and run at 300 km/h on the Tokaido and Sanyo Shinkansen Nozomi services until 2010. Nine sets were built; refurbished, they now run all-stations Kodama services.",
  "proc-vehicle-shinkansen-700":
    "The 700 series, designed jointly by JR Central and JR West for the Tokaido and Sanyo Shinkansen, with a distinctive duck-bill nose. The yellow 923 series Doctor Yellow, based on it, inspects track and overhead wires at full speed.",
  "proc-vehicle-shinkansen-e4":
    "The E4 series Max, a double-deck Shinkansen operated by JR East. Hitachi and Kawasaki built 26 eight-car sets, used to relieve crowding on the Tohoku and Joetsu Shinkansen until 2021.",
  "proc-vehicle-shinkansen-e5":
    "A Shinkansen type built by Hitachi and Kawasaki for JR East and, as the H5, JR Hokkaido. It runs the Hayabusa services from Tokyo at up to 320 km/h and offers a premium Gran Class cabin.",
  "proc-vehicle-shinkansen-e6":
    "The E6 series runs Komachi services on the Akita mini-Shinkansen, coupled to E5 trains between Morioka and Tokyo, where it reaches 320 km/h. It was designed by Ken Okuyama and built by Hitachi and Kawasaki.",
  "proc-vehicle-ship-cable-layer":
    "A cable layer is a deep-sea vessel built to lay underwater cables for telecommunications or electric power. Cable ships are recognised by the large sheaves that guide the cable over the bow or stern; modern ships tend to have stern sheaves only.",
  "proc-vehicle-ship-crane-vessel":
    "Modelled on Sleipnir, the semi-submersible crane vessel of Heerema Marine Contractors built in Singapore by Sembcorp Marine. Its two Huisman cranes lift 10,000 t each, or 20,000 t in tandem, making it the largest crane vessel in the world.",
  "proc-vehicle-ship-elbe-paddle":
    "Modelled on the Dresden, built at the Laubegast shipyard and flagship of the Saechsische Dampfschiffahrt, the oldest and largest paddle steamer fleet in the world. It still carries passengers on the Elbe around Dresden.",
  "proc-vehicle-ship-feeder-container":
    "A feeder ship is a medium-size container vessel, typically carrying 300 to 1,000 TEU, that collects containers from smaller ports and carries them to central hub terminals, where they are transferred to large ocean liners.",
  "proc-vehicle-ship-harbour-tug":
    "A harbour tug manoeuvres large ships by pushing or pulling them, with direct contact or a tow line, in crowded harbours and narrow channels where they cannot safely move under their own power. Many tugs carry water cannons for firefighting.",
  "proc-vehicle-ship-lng-moss":
    "An LNG carrier with Moss-type spherical tanks, which carry liquefied natural gas at about -162 C in self-supporting insulated spheres. Such tanks resist sloshing better than membrane tanks, though membrane designs have since become more common.",
  "proc-vehicle-ship-product-tanker":
    "A product tanker carries refined petroleum products such as fuels from refineries to ports near consuming markets. Product tankers are generally much smaller than the crude tankers that move unrefined oil from oil fields to refineries.",
  "proc-vehicle-ship-swiss-paddle":
    "Modelled on the Stadt Luzern, the flagship paddle steamer of the Lake Lucerne navigation company, built by Gebrueder Sachsenberg of Rosslau and the last steamer built for a Swiss lake. Styled after 1920s ocean liners, it carries up to 1,200 passengers.",
  "proc-vehicle-siemens-alc42":
    "A diesel passenger locomotive of the Siemens Charger family built for Amtrak's long-distance trains. Amtrak ordered 75 in 2018; the first entered service on the Empire Builder in February 2022, one of them painted in the heritage Day 1 livery.",
  "proc-vehicle-siemens-combino":
    "The Combino is a modular, multi-articulated low-floor tram developed by Duewag and Siemens, whose prototype was built in Dusseldorf. Sold to cities in six countries, it alternates wheeled and suspended body sections; a later version corrected faults in the joints between modules.",
  "proc-vehicle-siemens-ulf":
    "The Ultra Low Floor (ULF) tram was built for Vienna by a consortium of Siemens and ELIN and also runs in Oradea, Romania. It has the lowest floor height of any low-floor tram.",
  "proc-vehicle-sikorsky-s92":
    "The Sikorsky S-92 is an American twin-engine medium-lift helicopter developed from the S-70 for the civil and military markets. Developed as oil and gas exploration moved further offshore, it serves offshore operators such as CHC and Bristow and coastguard rescue units, and a VH-92 version flies as Marine One.",
  "proc-vehicle-skoda-14tr":
    "The Skoda 14Tr is a Czechoslovak trolleybus built by Skoda, with 3,263 produced in all. It ran across Czechoslovakia, the Soviet Union and Eastern Europe, Kyiv taking the most at 354, and a version assembled by Electric Transit served Dayton and San Francisco.",
  "proc-vehicle-skoda-15tr":
    "The Skoda 15Tr is an articulated trolleybus, a 17.4-metre four-door version of the Skoda 14Tr, built for up to 145 passengers. 469 went to cities in the Czech Republic, Estonia, Hungary, Iran, Latvia, Lithuania, Slovakia and Ukraine, followed by the modernised 15TrM.",
  "proc-vehicle-skoda-706-rto":
    "The Skoda 706 RTO is a Czechoslovak bus built by Karosa and Skoda on the frame of the Skoda 706 truck, with the engine at the front beside the driver. It was exported to China and North Korea, and the Polish licence version by Jelcz was nicknamed the cucumber.",
  "proc-vehicle-small-airplane":
    "A light aircraft is an aeroplane with a maximum takeoff weight of 5,670 kg or less. Small single-engine types like this are used for private flying, sightseeing, photography, crop dusting and small-scale passenger and freight transport.",
  "proc-vehicle-solaris-urbino-15":
    "The Solaris Urbino 15 is a 15-metre, three-axle low-floor city bus of the Polish Urbino family. It succeeded the Neoplan N4020, was first built by Neoplan Polska and has been produced since 2001 by Solaris Bus & Coach in Bolechowo near Poznan, including a CNG version.",
  "proc-vehicle-sqns-container-wagon":
    "A bogie container flat wagon of the UIC class S, special flat wagons with bogies, built to carry intermodal containers such as a 40 ft box; the s marks approval for 100 km/h.",
  "proc-vehicle-stanserhorn-cabrio":
    "The CabriO on the Stanserhorn above Stans, Switzerland, is the world's first double-deck cable car with an open top deck. Built by Garaventa, each cabin carries 60 passengers, 30 of them in the open air, on a six-minute ride to the summit station.",
  "proc-vehicle-strasbourg-eurotram":
    "The Eurotram is a low-floor tram designed for the Strasbourg network of CTS, built first by Socimi and then by ABB, Adtranz and Bombardier, which sold it as the Flexity Outlook (E). Eurotrams also ran in Milan and on the Porto Metro.",
  "proc-vehicle-sugarloaf-bondinho":
    "The cableway in Rio de Janeiro that climbs from Praia Vermelha via Morro da Urca to the summit of Sugarloaf Mountain. Opened in 1912 as only the third cableway in the world, it featured in the 1979 James Bond film Moonraker.",
  "proc-vehicle-tatra-500-hb":
    "The Tatra 500 HB was a three-axle Czechoslovak mountain bus (HB for horsky bus) with a self-supporting body and a rear air-cooled eight-cylinder Tatra diesel. Karosa built 521, used by CSAD on regular routes, but a rigid drive between the rear axles made it unreliable.",
  "proc-vehicle-tatra-815-tipper":
    "The Tatra 815 is a Czech truck family built on Tatra's backbone tube chassis with swinging half-axles, giving independent suspension and strong off-road ability. Tipper versions are common on construction sites, and the 815 took Karel Loprais to six Dakar Rally wins.",
  "proc-vehicle-tatra-k2":
    "The Tatra K2 was the first production articulated tram built by CKD Tatra, using electrical equipment adapted from the Tatra T3. It was built until 1983, and Brno, its largest operator, rebuilt its fleet with new front ends as the K2R.",
  "proc-vehicle-tatra-t6":
    "The T6A5 is a high-floor, single-ended tram built by CKD Tatra in Prague as the successor to the Tatra T3. Bratislava was the launch customer, followed by Brno, Prague, Ostrava and Kosice, and its wedge-shaped front earned it the nickname Iron.",
  "proc-vehicle-tgv-duplex":
    "The TGV Duplex is a French high-speed train built by Alstom for SNCF, the first TGV with bi-level carriages, seating 508 passengers. A total of 160 trainsets were built in three batches, and it has become one of the workhorses of the TGV fleet.",
  "proc-vehicle-titlis-rotair":
    "The Titlis Rotair is a cable car near Engelberg, Switzerland, running from Stand to the summit station on Titlis. Opened in 1992, it was the world's first cable car with rotating cabins, turning on their own axis during the ride, and its design was copied for Cape Town's Table Mountain cableway.",
  "proc-vehicle-ua-open-wagon":
    "Ua was a Czechoslovak national name for four-axle open wagons lettered Eal under the UIC scheme (E: ordinary open high-sided, a: four axles, l: not tippable), rebuilt in CSD workshops from Vsa hopper-floored wagons by welding their floor flaps shut. They carried bulk loads such as coal and sand.",
  "proc-vehicle-uic-z-coach":
    "UIC type Z coaches are standardised international express coaches that grew out of the air-conditioned Eurofima coaches, with fewer compartments than earlier types in the same overall length. The type is divided into Z1, air-conditioned, and Z2 without air conditioning.",
  "proc-vehicle-us-boxcar":
    "The boxcar is the enclosed North American freight car with sliding side doors, one of the most versatile car types since it can carry most loads. Some have end doors and adjustable bulkheads for loading very large items.",
  "proc-vehicle-us-caboose":
    "A crewed North American railroad car coupled at the rear of a freight train. It sheltered the crew, served as the conductor's office, and its raised cupola let the crew watch the train for shifting loads and overheating axles.",
  "proc-vehicle-us-well-car":
    "A well car carries intermodal containers in a depressed well between its trucks, low enough that two containers can be stacked on each car. Double-stack trains, developed by Southern Pacific and later American President Lines, now carry much North American container traffic.",
  "proc-vehicle-van-hool-exquicity":
    "The Van Hool ExquiCity is a tram-styled bus rapid transit vehicle from the Belgian maker Van Hool, offered as the articulated ExquiCity 18 and the double-articulated ExquiCity 24 with trolley, hybrid, fuel-cell or electric drive. Metz ordered ExquiCity 24 hybrids, and Belfast's Glider runs the 18.",
  "proc-vehicle-vanoise-express":
    "A double-decker aerial cable car built by Poma that links the ski resorts of La Plagne and Les Arcs in the French Alps, joining the Paradiski area. It spans 1,800 m without any supporting pylons, 380 m above the valley.",
  "proc-vehicle-wap-hopper-wagon":
    "Wap was the Czechoslovak national name of a four-axle self-discharging hopper wagon with pneumatically operated flaps, lettered Fall under the UIC scheme (F: special open wagon, l: loose gravity discharge). Studenka and Poprad built the first series from 1950 to 1965.",
  "proc-vehicle-zsr-coach":
    "ZSR, the Slovak railways that took over part of the CSD fleet when Czechoslovakia split, ran locomotive-hauled coaches built to UIC standards. The UIC type Y coach is 24.5 m long with end doors and a side corridor, while the longer type X and Z coaches are 26.4 m.",
  "proc-vehicle-zurich-cobra":
    "The Cobra is an articulated low-floor tram of the Zurich operator VBZ, designed by a consortium of ABB, Pininfarina, Schindler and SIG and built in series by Bombardier. It was the first low-floor tram on the Zurich network and now runs on most of its lines.",
};

/** A model's blurb, or undefined. */
export function blurbOf(id: string): string | undefined {
  return BLURBS[id];
}
