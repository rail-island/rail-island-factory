# Twenty trains each from eight countries

Status: draft
Date: 2026-11-05
Area: rail vehicles (`generator/`, new family modules and kits), loading gauges (`generator/loadingGauge.ts`), OpenTTD facts and ids (`generator/openttdTable.ts`, `generator/openttdIds.json`), text (`text/`), references (`assets/`), tests (`test/`), docs (`docs/models/`)

## User request

Make a plan for adding 20 trains from each of: India, China, the Netherlands, the
United Kingdom, Germany, France, Switzerland and Spain. Follow the last branch, which
adds trains from the US and Japan.

## Context of the change

### The model branch to follow

`claude/sweet-bohr-4td1cq` (not merged yet) adds 14 North American designs in three
commits. Each commit is one family on one kit:

| commit | kit (new) | family module | designs |
|---|---|---|---|
| US hood units | `usHoodKit.ts`, `loadingGauge.ts` | `usDiesels.ts` | GP9, SD40-2, ES44AC, SD70ACe |
| US streamliners | `carbodyKit.ts` (on `sliceBody.ts`) | `usCarbodies.ts` | F7, P42DC, ALC-42, GG1, Acela |
| US steam + Superliner | the existing steam kit | `usSteam.ts` | Big Boy, K4s, J-3a, 4-4-0, Superliner |

What each commit carries, and what each commit in this plan must carry too:

- the designs at their published size on a per-design `loadingGauge`;
- liveries as a `livery` enum; units, tenders and formations as `unit`;
- `game` properties, the OpenTTD entry and presets (`openttdTable.ts`) and their ids
  from `pnpm openttd:ids`;
- titles in `text/verbatim.json`, other new value titles translated into the 13
  phrasebooks (the `translate-text` skill);
- Wikimedia Commons photos in `assets/<name>/` with `SOURCES.md`, and
  `references: "<name>"` on the design;
- a test file per family, a doc per family in `docs/models/`, a row in
  `docs/README.md`, the rows in `docs/models/openttd-figures.md` and `vehicles.md`;
- a dedicated `buildLod` per design;
- images sent to the user: the three-quarter and side views, every livery.

Japan is not on that branch. The branch only adds the `shinkansen` loading gauge
(3.3 x 4.7 m). Master already has the Shinkansen 0 series and the JR KiHa 40, which
also sets the narrow-gauge rule: a vehicle from 1,067 mm track keeps its real body on
the factory's standard-gauge wheelsets.

### What the catalog already has from these countries

| country | designs on master |
|---|---|
| Germany | DB 111, 212, 628 (+ n-Wagen), Dosto, ICE 1, DR 243, DR S-Bahn Berlin, DR VT 18.16, Vectron |
| France | TGV (PSE, Atlantique), TGV Duplex |
| China | MTR M-Train (Hong Kong) |
| India, Netherlands, UK, Switzerland, Spain | none |

None of the lists below repeats one of these. A new livery on an existing design
(for example Ouigo Espana on the TGV Duplex, TGV La Poste) is not counted as a train.

### What counts as a train

One train is one **design**: a locomotive, a unit, or a coach family (one design
whose `unit` covers the classes of cars). A locomotive's tender and the coaches that
form its train belong to the same design (`unit`), as on the US branch. Freight
wagons count only where a country's list names them.

## Running gear and gauge rules

- **Track gauge.** The game has one track gauge. Indian (1,676 mm) and Iberian
  (1,668 mm) broad-gauge vehicles, and the Swiss metre-gauge and Indian 610 mm
  vehicles, keep their real bodies on standard-gauge wheelsets, as the KiHa 40 does.
  The doc for each family says so.
- **Loading gauge.** `uic` stays the default. Indian broad-gauge bodies
  (3.15 - 3.25 m) and Chinese conventional bodies use `us` where they are wider
  than 3.1 m. The CR400 and CRH380 (3.36 m) use `shinkansen`, narrowed like the
  Shinkansen. **Add a `uk` gauge** (W6a, about 2.82 x 3.95 m) so the catalog sweep
  holds British stock to its real, smaller size. `test/loadingGauge.test.ts` pins it.
- **Rack and Talgo.** A rack pinion is drawn but not driven (MGB HGe 4/4 II). The
  Talgo's single, independent wheel pairs between short cars need new articulated
  running gear (the Talgo kit below); test it with `test/railSupports.test.ts`
  and the bogie-pivot bounds.
- **Couplers.** UK, Europe and India use buffers and screw couplings. Indian LHB
  stock and Chinese stock use centre couplers drawn as the US knuckle coupler
  (shared in `usHoodKit.ts`). Units use their own centre couplers, as now.
- Two-pantograph electric locomotives raise one pantograph (the `railroad-vehicle`
  skill). The Swiss and French multi-voltage machines keep the pantograph the
  livery runs under.

## Kits: build once, use in several countries

The plan is ordered so that each kit is built once and then used by every country
that needs it. Most of the new kits are shared across countries:

| kit | new or existing | designs on it |
|---|---|---|
| US hood kit | branch | WDM-2, WDP-4D, WDG-4G (IN); HXN5 (CN) |
| carbody kit (streamlined loft) | branch | DF4, DF11 (CN); NS 1200 (NL); Class 55, 37, 47, 66 (UK); BR 103, 218, V 200 (DE); BB 67400, CC 72000 (FR); Renfe 319, 333 (ES); Vande Bharat ends |
| box-cab kit `boxLocoKit.ts` | existing | WAM-4, WAP-4, WAP-7 (IN); SS1, SS8, HXD1, HXD3D (CN); Class 86 (UK); BR 120, 101, E 18 (DE); BB 9200 (FR); Re 4/4 II, Re 6/6, Ae 6/6, Re 460, RhB Ge 4/4 III (CH); 252, 269, 277 (ES) |
| "nez casse" kit (Arzens's broken nose) | new | CC 6500, CC 40100, BB 22200 (FR); NS 1600/1700 (NL) |
| Alsthom 1950s kit (rounded cab, Co-Co / Bo-Bo) | new | CC 7100 (FR); NS 1100, NS 1300 (NL) |
| Alstom Prima kit | new | BB 27000 (FR); WAG-12B (IN) |
| crocodile kit (hinged frames, centre cab) | new, after the GG1's two driving frames | Ce 6/8 II, RhB Ge 6/6 I (CH); E 94 (DE) |
| Velaro kit | new | ICE 3 (DE), CRH3C (CN), AVE S-103 (ES) |
| Shinkansen-derived HSR noses | new, on `sliceBody.ts` | CRH2A, CRH380A, CR400AF, CR400BF (CN) |
| Talgo kit (short cars, single wheel pairs) | new | S-102, S-106, S-130, Talgo III (ES) |
| Stadler kit (FLIRT, KISS, GTW) | new | FLIRT, KISS (CH); NS Flirt (NL) |
| TGV kit `tgv.ts` | existing | AVE S-100 (ES) |
| ICE 1 kit `ice1.ts` | existing | ICE 2 (DE) |
| double-deck coach kit | existing (`dbDoubleDeck.ts`) | VIRM (NL); Z 20500, Regio 2N, MI 09 (FR); IC 2000, FV-Dosto (CH) |
| steam kit | existing | the 20 steam designs below |
| coach kits (`liveryCoach.ts`, `germanCoaches.ts`) | existing | LHB, ICF (IN); 25T (CN); ICR (NL); Mk1, Mk3, Mk4 (UK); IC Bpmz/Avmz (DE); Corail, Grand Confort, Wagons-Lits (FR); EW IV (CH) |
| EMU/DMU kits (`dmuKit.ts`, `emuClassicKit.ts`, `unitParts.ts`) | existing | the remaining units |

## The trains

Years are the first entry into service, which becomes the OpenTTD introduction year.
Design ids are proposals. They are fixed when a design ships and never renamed after.

### India (Indian Railways)

| # | design (proposed id) | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | WDM-2 (`ir-wdm2`) | diesel Co-Co (ALCO DL560C) | 1962 | IR maroon-cream, blue | US hood |
| 2 | WDP-4D (`ir-wdp4d`) | diesel Bo1-1Bo, two cabs | 2010 | blue-yellow | US hood |
| 3 | WDG-4G (`ir-wdg4g`) | diesel Co-Co (GE Evolution) | 2018 | grey-red | US hood |
| 4 | WAM-4 (`ir-wam4`) | electric Co-Co | 1971 | maroon, blue | box cab |
| 5 | WAP-4 (`ir-wap4`) | electric Co-Co | 1994 | Rajdhani red, Shatabdi blue | box cab |
| 6 | WAP-7 / WAG-9 (`ir-wap7`) | electric Co-Co, `class` value | 2000 | red-white, blue, brown | box cab |
| 7 | WAP-5 (`ir-wap5`) | electric Bo-Bo, aerodynamic nose | 1995 | white-red, Gatimaan | carbody |
| 8 | WAG-12B (`ir-wag12b`) | twin electric Bo-Bo+Bo-Bo | 2017 | grey-red | Prima |
| 9 | WP (`ir-wp`) | steam 4-6-2, bullet nose | 1947 | black, green-yellow | steam |
| 10 | WG (`ir-wg`) | steam 2-8-2 | 1950 | black | steam |
| 11 | Fairy Queen (`eir-fairy-queen`) | steam 2-2-2 | 1855 | preserved | steam |
| 12 | DHR B class (`dhr-b-class`) | 610 mm steam 0-4-0ST | 1889 | blue | steam |
| 13 | Vande Bharat (`ir-vande-bharat`) | EMU, cab and trailers | 2019 | white-blue, saffron-grey | EMU + carbody nose |
| 14 | Namo Bharat (`ncrtc-namo-bharat`) | RRTS EMU | 2023 | Namo Bharat | EMU |
| 15 | Mumbai suburban EMU (`ir-mumbai-emu`) | EMU (Siemens/Bombardier) | 2007 | purple-cream | EMU |
| 16 | MEMU (`ir-memu`) | EMU | 1995 | maroon-cream | EMU |
| 17 | Delhi Metro RS1 (`dmrc-rs1`) | metro | 2002 | steel-red | metro |
| 18 | LHB coaches (`ir-lhb-coach`) | AC 3-tier, AC chair, EOG | 2000 | Rajdhani, Shatabdi, Humsafar, Tejas | coach |
| 19 | ICF coaches (`ir-icf-coach`) | sleeper, general, AC | 1955 | blue, maroon | coach |
| 20 | BOXN / BCNA wagons (`ir-boxn-wagon`) | open and covered freight | 1981 | brown | wagon |

### China (China Railway)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | CR400AF Fuxing (`cr-cr400af`) | HSR EMU | 2017 | red band, gold "Smart" | HSR nose |
| 2 | CR400BF Fuxing (`cr-cr400bf`) | HSR EMU | 2017 | gold band | HSR nose |
| 3 | CRH380A (`cr-crh380a`) | HSR EMU | 2010 | white-blue | HSR nose |
| 4 | CRH2A (`cr-crh2a`) | HSR EMU | 2007 | white-blue | HSR nose |
| 5 | CRH3C (`cr-crh3c`) | HSR EMU | 2008 | white-blue | Velaro |
| 6 | CRH5A (`cr-crh5a`) | HSR EMU | 2007 | white-blue | EMU + carbody nose |
| 7 | CR200J "Green Giant" (`cr-cr200j`) | power car and coaches | 2019 | green, white-red | carbody + coach |
| 8 | HXD1 (`cr-hxd1`) | twin electric 2(Bo-Bo) | 2006 | red | box cab |
| 9 | HXD3D (`cr-hxd3d`) | electric Co-Co | 2013 | red-grey | box cab |
| 10 | SS1 Shaoshan 1 (`cr-ss1`) | electric Co-Co | 1958 | green-yellow | box cab |
| 11 | SS8 Shaoshan 8 (`cr-ss8`) | electric Bo-Bo | 1997 | red-white | box cab |
| 12 | HXN5 (`cr-hxn5`) | diesel Co-Co (GE Evolution) | 2008 | orange | US hood |
| 13 | DF4 Dongfeng 4 (`cr-df4`) | diesel Co-Co | 1969 | orange-white, green | carbody |
| 14 | DF11 Dongfeng 11 (`cr-df11`) | diesel Co-Co | 1992 | red-white | carbody |
| 15 | QJ (`cr-qj`) | steam 2-10-2 | 1956 | black-red | steam |
| 16 | SY (`cr-sy`) | steam 2-8-2 | 1960 | black-red | steam |
| 17 | JS (`cr-js`) | steam 2-8-2 | 1957 | black-red | steam |
| 18 | 25T coaches (`cr-25t-coach`) | soft and hard sleeper, seat, dining | 1999 | white-blue Z express, green 25B | coach |
| 19 | CRH6A (`cr-crh6a`) | intercity EMU | 2014 | white-red | EMU |
| 20 | C70 / P70 wagons (`cr-c70-wagon`) | open and covered freight | 2006 | brown | wagon |

### Netherlands (NS)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | NS 1600 / 1700 (`ns-1700`) | electric B-B, `class` value | 1981 | yellow-grey, NS Intercity | nez casse |
| 2 | NS 1100 (`ns-1100`) | electric B-B | 1950 | blue, yellow-grey | Alsthom 1950s |
| 3 | NS 1300 (`ns-1300`) | electric Co-Co | 1952 | blue, yellow-grey | Alsthom 1950s |
| 4 | NS 1200 (`ns-1200`) | electric Co-Co (Werkspoor/Baldwin) | 1951 | blue, yellow-grey | carbody |
| 5 | NS 2200 (`ns-2200`) | diesel Bo-Bo, centre cab | 1955 | brown, yellow-grey | US hood |
| 6 | NS 3700 (`ns-3700`) | steam 4-6-0 | 1910 | green | steam |
| 7 | Mat '54 "Hondekop" (`ns-mat54`) | EMU | 1954 | green, yellow | EMU |
| 8 | Plan V (`ns-plan-v`) | EMU | 1966 | yellow-grey | EMU |
| 9 | DE-I "Blauwe Engel" (`ns-de1`) | DMU railcar | 1954 | blue | DMU |
| 10 | ICM Koploper (`ns-icm`) | EMU with the raised cab and nose door | 1977 | yellow-blue | EMU + carbody nose |
| 11 | VIRM (`ns-virm`) | double-deck EMU | 1994 | yellow-blue | double-deck |
| 12 | DDZ / mDDM (`ns-ddz`) | double-deck EMU | 1992 | yellow-blue | double-deck |
| 13 | SGM Sprinter (`ns-sgm`) | EMU | 1975 | yellow-blue | EMU |
| 14 | SLT (`ns-slt`) | EMU | 2009 | yellow-blue | EMU |
| 15 | SNG (`ns-sng`) | EMU (CAF Civity) | 2018 | yellow-blue | EMU |
| 16 | ICNG (`ns-icng`) | EMU (Alstom Coradia Stream) | 2023 | yellow-blue | EMU |
| 17 | NS Flirt (`ns-flirt`) | EMU | 2016 | yellow-blue | Stadler |
| 18 | ICR coaches (`ns-icr-coach`) | intercity coaches, driving trailer | 1981 | yellow-grey, yellow-blue | coach |
| 19 | Fyra V250 (`ns-v250`) | HSR EMU | 2012 | Fyra burgundy | HSR nose |
| 20 | Mat '46 (`ns-mat46`) | EMU | 1949 | green, yellow-grey | EMU |

### United Kingdom

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | LNER A4 "Mallard" (`lner-a4`) | streamlined steam 4-6-2 | 1935 | garter blue, LNER green, BR green | steam + carbody casing |
| 2 | LNER A3 "Flying Scotsman" (`lner-a3`) | steam 4-6-2 | 1923 | apple green, BR green | steam |
| 3 | GWR Castle (`gwr-castle`) | steam 4-6-0 | 1923 | GWR green | steam |
| 4 | LMS Black Five (`lms-black-five`) | steam 4-6-0 | 1934 | black | steam |
| 5 | BR 9F (`br-9f`) | steam 2-10-0 | 1954 | black, "Evening Star" green | steam |
| 6 | Stephenson's Rocket (`rocket`) | steam 0-2-2 | 1829 | yellow-white | steam |
| 7 | Class 55 Deltic (`br-class-55`) | diesel Co-Co | 1961 | two-tone green, BR blue | carbody |
| 8 | Class 37 (`br-class-37`) | diesel Co-Co | 1960 | green, BR blue, Railfreight | carbody |
| 9 | Class 47 (`br-class-47`) | diesel Co-Co | 1962 | two-tone green, BR blue, InterCity | carbody |
| 10 | Class 66 (`br-class-66`) | diesel Co-Co | 1998 | EWS, Freightliner, GBRf | carbody |
| 11 | Class 86 (`br-class-86`) | electric Bo-Bo | 1965 | BR blue, InterCity | box cab |
| 12 | InterCity 125 (`br-hst`) | Class 43 power car and Mk3 coaches | 1976 | InterCity Swallow, BR blue-grey, GWR | carbody + coach |
| 13 | InterCity 225 (`br-ic225`) | Class 91, Mk4 coaches, driving trailer | 1988 | InterCity, LNER | box cab + coach |
| 14 | Class 800 IET (`br-class-800`) | bi-mode unit | 2017 | GWR green, LNER Azuma | EMU + carbody nose |
| 15 | Class 390 Pendolino (`br-class-390`) | tilting EMU | 2002 | Virgin, Avanti | EMU + carbody nose |
| 16 | Eurostar e300 (`eurostar-373`) | HSR power car and trailers | 1994 | Eurostar yellow-white, Eurostar 2011 | TGV kit |
| 17 | Class 158 (`br-class-158`) | DMU | 1989 | Regional Railways, Northern | DMU |
| 18 | Class 142 Pacer (`br-class-142`) | railbus | 1985 | Provincial, Northern | DMU |
| 19 | 1938 Stock (`lu-1938-stock`) | tube train | 1938 | London Underground red | metro |
| 20 | Mk1 coaches (`br-mk1-coach`) | open, corridor, brake | 1951 | crimson-cream, maroon, green | coach |

The Eurostar is the archived webapp model `train-emu-eurostar-*`
(docs/models/foreign-units.md), so its mapping goes into the legacy table in the same
change.

### Germany (DB, DR and predecessors)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | ICE 3 (`db-ice3`) | HSR EMU (BR 403) | 2000 | ICE white-red | Velaro |
| 2 | ICE 4 (`db-ice4`) | HSR EMU (BR 412) | 2017 | ICE white-red | EMU + carbody nose |
| 3 | ICE T (`db-ice-t`) | tilting EMU (BR 411) | 1999 | ICE white-red | EMU + carbody nose |
| 4 | ICE 2 (`db-ice2`) | power car, coaches, driving trailer | 1996 | ICE white-red | ICE 1 |
| 5 | BR 103 (`db-103`) | electric Co-Co | 1970 | TEE red-beige, orient red | carbody |
| 6 | BR 101 (`db-101`) | electric Bo-Bo | 1996 | traffic red | box cab |
| 7 | BR 120 (`db-120`) | electric Bo-Bo | 1979 | prototype, traffic red | box cab |
| 8 | BR 218 (`db-218`) | diesel B-B | 1968 | purple-red, orient red, traffic red | carbody |
| 9 | V 200 (`db-v200`) | diesel B-B | 1953 | red | carbody |
| 10 | E 18 (`dr-e18`) | electric 1'Do1' | 1935 | green, red | box cab |
| 11 | E 94 "Deutsches Krokodil" (`dr-e94`) | electric Co'Co' | 1940 | green | crocodile |
| 12 | BR 01 (`drg-01`) | steam 4-6-2 | 1926 | black-red | steam |
| 13 | BR 52 Kriegslok (`dr-52`) | steam 2-10-0 | 1942 | black-red | steam |
| 14 | Prussian P 8 (`kpev-p8`) | steam 4-6-0 | 1906 | black-red | steam |
| 15 | SVT 877 "Fliegender Hamburger" (`drg-svt877`) | diesel railcar | 1933 | violet-cream | carbody + DMU |
| 16 | VT 98 Schienenbus (`db-vt98`) | railbus | 1955 | red | DMU |
| 17 | BR 423 S-Bahn (`db-423`) | EMU | 1998 | S-Bahn red-white | EMU |
| 18 | BR 642 Desiro (`db-642`) | DMU | 2000 | traffic red | DMU |
| 19 | BR 650 RegioShuttle (`db-650`) | DMU | 1996 | traffic red | DMU |
| 20 | IC coaches Avmz / Bpmz (`db-ic-coach`) | intercity coaches | 1971 | TEE / IC red-beige, IC white-red | coach |

The BR 103 and the IC coaches form the TEE Rheingold formation.

### France (SNCF and predecessors)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | CC 6500 (`sncf-cc6500`) | electric C-C | 1969 | Capitole red, Maurienne green, TEE | nez casse |
| 2 | CC 40100 (`sncf-cc40100`) | quadri-current C-C | 1964 | TEE grey-red | nez casse |
| 3 | BB 22200 (`sncf-bb22200`) | electric B-B | 1976 | Beton, En Voyage | nez casse |
| 4 | CC 7100 (`sncf-cc7100`) | electric Co-Co, the 1955 record | 1952 | blue | Alsthom 1950s |
| 5 | BB 9200 (`sncf-bb9200`) | electric B-B | 1957 | blue, Capitole red | box cab |
| 6 | BB 27000 Prima (`sncf-bb27000`) | electric Bo-Bo | 2001 | Fret SNCF | Prima |
| 7 | BB 67400 (`sncf-bb67400`) | diesel B-B | 1969 | blue-white, Multiservice | carbody |
| 8 | CC 72000 (`sncf-cc72000`) | diesel C-C | 1967 | blue-white | carbody |
| 9 | 241 P (`sncf-241p`) | steam 4-8-2 | 1948 | black-green | steam |
| 10 | 141 R "Liberation" (`sncf-141r`) | steam 2-8-2 (US-built) | 1945 | black | steam |
| 11 | X 3800 "Picasso" (`sncf-x3800`) | railcar, offset raised cab | 1950 | red-cream | DMU |
| 12 | X 73500 (`sncf-x73500`) | TER railcar | 1999 | TER regions | DMU |
| 13 | TGV M (`sncf-tgv-m`) | double-deck HSR | 2025 | inOui | double-deck + carbody nose |
| 14 | Z 20500 (`sncf-z20500`) | double-deck EMU (Transilien) | 1988 | Ile-de-France | double-deck |
| 15 | MI 09 (`ratp-mi09`) | double-deck RER EMU | 2011 | Ile-de-France | double-deck |
| 16 | Regio 2N (`sncf-regio2n`) | double-deck EMU | 2014 | TER, Transilien | double-deck |
| 17 | Regiolis (`sncf-regiolis`) | EMU / bi-mode | 2014 | TER regions | EMU |
| 18 | Corail coaches (`sncf-corail-coach`) | VTU, B11tu, driving trailer | 1975 | Corail grey-orange, Teoz | coach |
| 19 | Grand Confort coaches (`sncf-grand-confort`) | first-class TEE coaches | 1970 | Capitole red-grey, Mistral | coach |
| 20 | CIWL Pullman and sleeping car (`ciwl-pullman`) | Orient Express cars | 1929 | CIWL blue, Pullman teak | coach |

### Switzerland (SBB, BLS, RhB, MGB)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | Re 460 (`sbb-re460`) | electric Bo-Bo (Lok 2000) | 1992 | SBB red, advertising-free | carbody |
| 2 | Re 4/4 II (`sbb-re420`) | electric Bo-Bo | 1964 | green, red | box cab |
| 3 | Re 6/6 (`sbb-re620`) | electric Bo-Bo-Bo | 1972 | green, red, SBB Cargo | box cab |
| 4 | Ae 6/6 (`sbb-ae66`) | electric Co-Co, cantonal arms | 1952 | green | box cab |
| 5 | Ce 6/8 II "Krokodil" (`sbb-ce68`) | electric 1'C+C1' | 1919 | brown, green | crocodile |
| 6 | Ae 8/14 "Landi" (`sbb-ae814`) | twin electric | 1939 | green | box cab |
| 7 | RAe TEE II (`sbb-rae-tee`) | electric TEE unit | 1961 | TEE red-beige, SBB grey | EMU + carbody nose |
| 8 | RCe 2/4 "Roter Pfeil" (`sbb-roter-pfeil`) | railcar | 1935 | red | carbody |
| 9 | ICN RABDe 500 (`sbb-icn`) | tilting EMU | 2000 | SBB intercity | EMU |
| 10 | Giruno RABe 501 (`sbb-giruno`) | HSR EMU | 2019 | SBB | EMU + carbody nose |
| 11 | FV-Dosto RABe 502 (`sbb-fv-dosto`) | double-deck EMU | 2018 | SBB | double-deck |
| 12 | FLIRT RABe 523 (`sbb-flirt`) | EMU | 2004 | S-Bahn Zug, Stadtbahn | Stadler |
| 13 | KISS RABe 511 (`sbb-kiss`) | double-deck EMU | 2012 | SBB | Stadler + double-deck |
| 14 | EW IV coaches (`sbb-ew4-coach`) | intercity coaches, driving trailer | 1981 | SBB red-grey | coach |
| 15 | IC 2000 coaches (`sbb-ic2000`) | double-deck coaches | 1997 | SBB | double-deck |
| 16 | RhB Ge 4/4 III (`rhb-ge443`) | metre-gauge electric | 1993 | RhB red, advertising | box cab |
| 17 | RhB Ge 6/6 I "Krokodil" (`rhb-ge66`) | metre-gauge electric | 1921 | brown, green | crocodile |
| 18 | RhB Allegra ABe 8/12 (`rhb-allegra`) | metre-gauge EMU | 2010 | RhB red | EMU |
| 19 | Glacier Express panorama coaches (`glacier-express`) | metre-gauge coaches | 2006 | Glacier Express red-white | coach |
| 20 | MGB HGe 4/4 II (`mgb-hge442`) | metre-gauge rack electric | 1985 | MGB red, Glacier Express | box cab |

### Spain (Renfe)

| # | design | type | year | liveries / units | kit |
|---|---|---|---|---|---|
| 1 | AVE S-100 (`renfe-s100`) | HSR power car and trailers | 1992 | AVE white-grey | TGV kit |
| 2 | AVE S-103 (`renfe-s103`) | HSR EMU (Velaro E) | 2007 | AVE | Velaro |
| 3 | AVE S-102 "Pato" (`renfe-s102`) | HSR power car and Talgo coaches | 2005 | AVE | Talgo + carbody nose |
| 4 | Avril S-106 (`renfe-s106`) | HSR Talgo | 2022 | Avlo purple, AVE | Talgo + carbody nose |
| 5 | Alvia S-130 (`renfe-s130`) | dual-gauge Talgo, power cars | 2007 | Alvia | Talgo + carbody nose |
| 6 | Talgo III (`talgo-iii`) | Talgo coaches | 1964 | Talgo silver-red | Talgo |
| 7 | Renfe 354 "Virgen" (`renfe-354`) | diesel for the Talgo | 1964 | Talgo silver-red | carbody |
| 8 | Renfe S-120 / S-121 (`renfe-s120`) | dual-gauge EMU | 2006 | Alvia, Media Distancia | EMU |
| 9 | Renfe 252 (`renfe-252`) | electric Bo-Bo (EuroSprinter) | 1991 | AVE white, Renfe Mercancias | box cab |
| 10 | Renfe 269 "Japonesa" (`renfe-269`) | electric Bo-Bo | 1973 | Renfe Taxi, Estrella | box cab |
| 11 | Renfe 277 "Inglesa" (`renfe-277`) | electric Co-Co | 1952 | green, Renfe blue | box cab |
| 12 | Renfe 319 (`renfe-319`) | diesel Co-Co (GM) | 1965 | Estrella, Renfe Mercancias | carbody |
| 13 | Renfe 333 (`renfe-333`) | diesel Co-Co | 1974 | Renfe Mercancias, Talgo | carbody |
| 14 | Civia S-463 (`renfe-civia`) | Cercanias EMU | 2003 | Cercanias | EMU |
| 15 | Renfe 446 (`renfe-446`) | Cercanias EMU | 1989 | Cercanias | EMU |
| 16 | Renfe 440 (`renfe-440`) | regional EMU | 1974 | Regionales, Cercanias | EMU |
| 17 | Renfe 592 "Camello" (`renfe-592`) | DMU | 1981 | Regionales | DMU |
| 18 | Renfe 141F "Mikado" (`renfe-141f`) | steam 2-8-2 | 1953 | black | steam |
| 19 | Renfe 242F "Bonita" (`renfe-242f`) | steam 4-8-2 | 1956 | green | steam |
| 20 | Iryo / Frecciarossa 1000 S-109 (`iryo-s109`) | HSR EMU | 2022 | Iryo red | EMU + carbody nose |

## Order of work

Each step is one commit, or a few, with one family on one kit, as on the US branch.
Each step passes `pnpm typecheck`, `pnpm test` (under 5 minutes) and `pnpm build`,
and sends the user images.

0. **Land the US branch** (`claude/sweet-bohr-4td1cq`) on master. Every step below
   uses its `loadingGauge`, carbody kit and shared knuckle coupler.
1. **Test time first.** The suite already takes about 4.5 of its 5 minutes, and
   this plan adds 160 designs to the 133 vehicles. Before the first family:
   measure the time per test file. Then build each design's defaults once for the
   whole run (`test/catalogCache.ts`), give each new family one test file that
   shares its builds, and sample one other combination of a new design where two
   add nothing. Recheck the time after every step. This does not skip any check
   that guards behaviour.
2. **Gauges and the shared kits** that no single country owns: the `uk` gauge; the
   Velaro, Stadler, Talgo, Prima, nez casse, Alsthom 1950s and crocodile kits,
   each landing with its first design.
3. **Countries in this order**, chosen to reuse the kits as early as possible:
   Germany (Velaro, crocodile), France (nez casse, Alsthom, Prima),
   Netherlands (reuses the French kits and Stadler), Switzerland (Stadler,
   crocodile), Spain (Velaro, TGV, Talgo), United Kingdom (`uk` gauge, carbody),
   India (US hood, Prima), China (HSR noses, Velaro, US hood). Within a country,
   work one family at a time: steam, diesels, electrics, units, high-speed, then
   coaches and wagons.
4. **Per country**, about 4 - 6 commits, each with 3 - 6 designs: about 45
   commits for the 160 designs.

## Per-design checklist

- [ ] references in `assets/<name>/` with `SOURCES.md` (Wikimedia Commons, licence)
- [ ] the design at its published length, width, height, axle spacing and wheel size;
      the `loadingGauge` stated
- [ ] liveries (`livery`), units, formations; at most 8 cars in a train
- [ ] `buildLod` from the family's LOD adapter or `lodKit.ts`
- [ ] `game` (weight, power, maxspeed, accel); sounds derived from traction and weight
- [ ] OpenTTD entry and presets; `pnpm openttd:ids`, with `openttdIds.json` committed
- [ ] title in `text/verbatim.json`; new value titles in all 13 phrasebooks
- [ ] family test (dimensions, axles, gauge, collectors, triangle budget)
- [ ] family doc and its `docs/README.md` row; `openttd-figures.md`, `vehicles.md`
- [ ] `pnpm build:models`; the three-quarter view, the side view and every livery
      sent to the user

## Open decisions for the user

- **Country in the catalog.** With ten countries of trains, a `country` field on the
  design (shown as a chip, and as an OpenTTD pack per country) would let players
  find the trains of each country. It is not in this plan's steps. It would be a
  separate spec.
- **Japan.** No Japan branch could be found (only the `shinkansen` gauge on the US
  branch). Should Japan get its own list of 20 in this plan, on the HSR-nose kit?
- **The lists.** Swap any entry before its country starts. Already fixed: freight
  wagons only for India and China, and the Swiss and Indian narrow-gauge stock on
  standard-gauge wheelsets.
