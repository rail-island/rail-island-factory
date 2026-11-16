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
    "The Tatra T3 is a four-axle tram built by CKD Tatra in Prague from 1960. With about 14,000 cars built it is one of the most numerous tram types in the world, and it still runs in Prague, Brno, Ostrava and many cities of the former Eastern Bloc.",
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
};

/** A model's blurb, or undefined. */
export function blurbOf(id: string): string | undefined {
  return BLURBS[id];
}
