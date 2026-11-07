// The web links of the world fleet's models (docs/models/world-fleet.md, "Web links"),
// spread into MODEL_LINKS (linkTable.ts): each model's Wikipedia article and the Commons
// page of every photograph in its assets/<name>/SOURCES.md. No `node:` imports.

import type { ModelLink } from "./linkTable.ts";

/** Each fleet model's web links: its article first, then its photographs' Commons pages. */
export const FLEET_LINKS: Readonly<Record<string, readonly ModelLink[]>> = {
  "proc-vehicle-addis-ababa-lrt": [
    { title: "Wikipedia: Addis Ababa Light Rail", url: "https://en.wikipedia.org/wiki/Addis_Ababa_Light_Rail" },
    { title: "Wikimedia Commons: Addis Ababa Light Rail vehicle, March 2015.jpg", url: "https://commons.wikimedia.org/wiki/File:Addis_Ababa_Light_Rail_vehicle,_March_2015.jpg" },
  ],
  "proc-vehicle-adl-enviro200": [
    { title: "Wikipedia: Alexander Dennis Enviro200", url: "https://en.wikipedia.org/wiki/Alexander_Dennis_Enviro200" },
    { title: "Wikimedia Commons: Alexander Dennis Enviro 200 demonstrator.JPG", url: "https://commons.wikimedia.org/wiki/File:Alexander_Dennis_Enviro_200_demonstrator.JPG" },
    { title: "Wikimedia Commons: Enviro 200 rear.JPG", url: "https://commons.wikimedia.org/wiki/File:Enviro_200_rear.JPG" },
  ],
  "proc-vehicle-adl-enviro400": [
    { title: "Wikipedia: Alexander Dennis Enviro400", url: "https://en.wikipedia.org/wiki/Alexander_Dennis_Enviro400" },
    { title: "Wikimedia Commons: Stagecoach Yorkshire, Alexander Dennis Enviro400H (12164, YN62 BEY) (8665170139).jpg", url: "https://commons.wikimedia.org/wiki/File:Stagecoach_Yorkshire,_Alexander_Dennis_Enviro400H_(12164,_YN62_BEY)_(8665170139).jpg" },
    { title: "Wikimedia Commons: Alexander Dennis Enviro 400 (16302529900).jpg", url: "https://commons.wikimedia.org/wiki/File:Alexander_Dennis_Enviro_400_(16302529900).jpg" },
  ],
  "proc-vehicle-adl-enviro500": [
    { title: "Wikipedia: Alexander Dennis Enviro500", url: "https://en.wikipedia.org/wiki/Alexander_Dennis_Enviro500" },
    { title: "Wikimedia Commons: KMB LU3721 112.jpg", url: "https://commons.wikimedia.org/wiki/File:KMB_LU3721_112.jpg" },
    { title: "Wikimedia Commons: Open-top Enviro 500 in Washington DC.jpg", url: "https://commons.wikimedia.org/wiki/File:Open-top_Enviro_500_in_Washington_DC.jpg" },
  ],
  "proc-vehicle-aec-mammoth-major": [
    { title: "Wikimedia Commons: AEC Mammoth Major Tanker. - geograph.org.uk - 689148.jpg", url: "https://commons.wikimedia.org/wiki/File:AEC_Mammoth_Major_Tanker._-_geograph.org.uk_-_689148.jpg" },
  ],
  "proc-vehicle-aec-routemaster": [
    { title: "Wikipedia: AEC Routemaster", url: "https://en.wikipedia.org/wiki/AEC_Routemaster" },
    { title: "Wikimedia Commons: AEC Routemaster.JPG", url: "https://commons.wikimedia.org/wiki/File:AEC_Routemaster.JPG" },
    { title: "Wikimedia Commons: Arriva London (SP) Routemaster bus RM6 (VLT 6), route 159 second to last day.jpg", url: "https://commons.wikimedia.org/wiki/File:Arriva_London_(SP)_Routemaster_bus_RM6_(VLT_6),_route_159_second_to_last_day.jpg" },
  ],
  "proc-vehicle-airbus-a220": [
    { title: "Wikipedia: Airbus A220", url: "https://en.wikipedia.org/wiki/Airbus_A220" },
    { title: "Wikimedia Commons: (SGP-Singapore) Air Niugini Airbus A220-300 P2-PGA @ Singapore Airshow 2026-02-07.jpg", url: "https://commons.wikimedia.org/wiki/File:(SGP-Singapore)_Air_Niugini_Airbus_A220-300_P2-PGA_@_Singapore_Airshow_2026-02-07.jpg" },
  ],
  "proc-vehicle-airbus-a300": [
    { title: "Wikipedia: Airbus A300", url: "https://en.wikipedia.org/wiki/Airbus_A300" },
    { title: "Wikimedia Commons: AIRBUS A 300 B (16428835251).jpg", url: "https://commons.wikimedia.org/wiki/File:AIRBUS_A_300_B_(16428835251).jpg" },
  ],
  "proc-vehicle-airbus-a310": [
    { title: "Wikipedia: Airbus A310", url: "https://en.wikipedia.org/wiki/Airbus_A310" },
    { title: "Wikimedia Commons: Airbus A310-300 Air Transat (TSC) C-GLAT - MSN 588 (9510329329).jpg", url: "https://commons.wikimedia.org/wiki/File:Airbus_A310-300_Air_Transat_(TSC)_C-GLAT_-_MSN_588_(9510329329).jpg" },
  ],
  "proc-vehicle-airbus-a320": [
    { title: "Wikipedia: Airbus A320 family", url: "https://en.wikipedia.org/wiki/Airbus_A320_family" },
    { title: "Wikimedia Commons: 14cd - Swissair Airbus A319-112; HB-IPY@ZRH;15.02.1998 (5424583398).jpg", url: "https://commons.wikimedia.org/wiki/File:14cd_-_Swissair_Airbus_A319-112;_HB-IPY@ZRH;15.02.1998_(5424583398).jpg" },
  ],
  "proc-vehicle-airbus-a320neo": [
    { title: "Wikipedia: Airbus A321neo", url: "https://en.wikipedia.org/wiki/Airbus_A321neo" },
    { title: "Wikimedia Commons: 20230602 B-324K at CGO 01.jpg", url: "https://commons.wikimedia.org/wiki/File:20230602_B-324K_at_CGO_01.jpg" },
    { title: "Wikimedia Commons: 4X-AGK Independence Day 09-05-2019b.jpg", url: "https://commons.wikimedia.org/wiki/File:4X-AGK_Independence_Day_09-05-2019b.jpg" },
  ],
  "proc-vehicle-airbus-a330": [
    { title: "Wikipedia: Airbus A330", url: "https://en.wikipedia.org/wiki/Airbus_A330" },
    { title: "Wikimedia Commons: 9K-APF Airbus A330-841 Kuwait Airways Frankfurt 22.6.22 (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:9K-APF_Airbus_A330-841_Kuwait_Airways_Frankfurt_22.6.22_(cropped).jpg" },
  ],
  "proc-vehicle-airbus-a340": [
    { title: "Wikipedia: Airbus A340", url: "https://en.wikipedia.org/wiki/Airbus_A340" },
    { title: "Wikimedia Commons: 18cg - Airlanka Airbus A340-311; 4R-ADA@FRA;01.04.1998 (5445375360).jpg", url: "https://commons.wikimedia.org/wiki/File:18cg_-_Airlanka_Airbus_A340-311;_4R-ADA@FRA;01.04.1998_(5445375360).jpg" },
    { title: "Wikimedia Commons: A- 340- 600 (5811453390).jpg", url: "https://commons.wikimedia.org/wiki/File:A-_340-_600_(5811453390).jpg" },
  ],
  "proc-vehicle-airbus-a350": [
    { title: "Wikipedia: Airbus A350", url: "https://en.wikipedia.org/wiki/Airbus_A350" },
    { title: "Wikimedia Commons: A350XWB-Demo.jpg", url: "https://commons.wikimedia.org/wiki/File:A350XWB-Demo.jpg" },
    { title: "Wikimedia Commons: A350 First Flight - Low pass 02.jpg", url: "https://commons.wikimedia.org/wiki/File:A350_First_Flight_-_Low_pass_02.jpg" },
  ],
  "proc-vehicle-airbus-beluga-xl": [
    { title: "Wikipedia: Airbus BelugaXL", url: "https://en.wikipedia.org/wiki/Airbus_BelugaXL" },
    { title: "Wikimedia Commons: Hamburg-Finkenwerder Airport Airbus Transport International Airbus A330-743L Beluga XL F-GXLH (DSC09365).jpg", url: "https://commons.wikimedia.org/wiki/File:Hamburg-Finkenwerder_Airport_Airbus_Transport_International_Airbus_A330-743L_Beluga_XL_F-GXLH_(DSC09365).jpg" },
  ],
  "proc-vehicle-airbus-h145": [
    { title: "Wikipedia: Eurocopter EC145", url: "https://en.wikipedia.org/wiki/Eurocopter_EC145" },
    { title: "Wikimedia Commons: 121st Medical Company fly UH-72A Lakota helicopters.jpg", url: "https://commons.wikimedia.org/wiki/File:121st_Medical_Company_fly_UH-72A_Lakota_helicopters.jpg" },
  ],
  "proc-vehicle-alexandria-double-deck": [
    { title: "Wikipedia: Trams in Alexandria", url: "https://en.wikipedia.org/wiki/Trams_in_Alexandria" },
    { title: "Wikimedia Commons: Alexandria, Egyiptom 1969. A Saad Zaghloul a Ramleh villamos-v\u00e9g\u00e1llom\u00e1s k\u00f6zel\u00e9ben. Fortepan 58104.jpg", url: "https://commons.wikimedia.org/wiki/File:Alexandria,_Egyiptom_1969._A_Saad_Zaghloul_a_Ramleh_villamos-v%C3%A9g%C3%A1llom%C3%A1s_k%C3%B6zel%C3%A9ben._Fortepan_58104.jpg" },
  ],
  "proc-vehicle-alstom-citadis": [
    { title: "Wikipedia: Citadis", url: "https://en.wikipedia.org/wiki/Citadis" },
    { title: "Wikimedia Commons: 15tenerife tram.jpg", url: "https://commons.wikimedia.org/wiki/File:15tenerife_tram.jpg" },
  ],
  "proc-vehicle-alstom-citadis-x05": [
    { title: "Wikipedia: Citadis", url: "https://en.wikipedia.org/wiki/Citadis" },
    { title: "Wikimedia Commons: Alstom Citadis X05 - 405.jpg", url: "https://commons.wikimedia.org/wiki/File:Alstom_Citadis_X05_-_405.jpg" },
  ],
  "proc-vehicle-alstom-tfs": [
    { title: "Wikimedia Commons: TFS 2042 - Grenoble (mai 2012).jpg", url: "https://commons.wikimedia.org/wiki/File:TFS_2042_-_Grenoble_(mai_2012).jpg" },
  ],
  "proc-vehicle-american-lafrance": [
    { title: "Wikimedia Commons: Glendale-American LaFrance - Foamite 700 Series-1954-2.jpg", url: "https://commons.wikimedia.org/wiki/File:Glendale-American_LaFrance_-_Foamite_700_Series-1954-2.jpg" },
  ],
  "proc-vehicle-amsterdam-9g": [
    { title: "Wikipedia: Trams in Amsterdam", url: "https://en.wikipedia.org/wiki/Trams_in_Amsterdam" },
    { title: "Wikimedia Commons: GVB 9G 790 (Amsterdam tram) at Rembrandtplein on route 14.jpg", url: "https://commons.wikimedia.org/wiki/File:GVB_9G_790_(Amsterdam_tram)_at_Rembrandtplein_on_route_14.jpg" },
  ],
  "proc-vehicle-antonov-an124": [
    { title: "Wikipedia: Antonov An-124 Ruslan", url: "https://en.wikipedia.org/wiki/Antonov_An-124_Ruslan" },
    { title: "Wikimedia Commons: AN124RampDown.JPG", url: "https://commons.wikimedia.org/wiki/File:AN124RampDown.JPG" },
  ],
  "proc-vehicle-antonov-an148": [
    { title: "Wikipedia: Antonov An-148", url: "https://en.wikipedia.org/wiki/Antonov_An-148" },
    { title: "Wikimedia Commons: Air Koryo Antonov An-148-100B.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Koryo_Antonov_An-148-100B.jpg" },
    { title: "Wikimedia Commons: An-158 UR-NTN (6086048444).jpg", url: "https://commons.wikimedia.org/wiki/File:An-158_UR-NTN_(6086048444).jpg" },
  ],
  "proc-vehicle-antonov-an2": [
    { title: "Wikipedia: Antonov An-2", url: "https://en.wikipedia.org/wiki/Antonov_An-2" },
    { title: "Wikimedia Commons: AN2 R.jpeg", url: "https://commons.wikimedia.org/wiki/File:AN2_R.jpeg" },
  ],
  "proc-vehicle-antonov-an225": [
    { title: "Wikipedia: Antonov An-225 Mriya", url: "https://en.wikipedia.org/wiki/Antonov_An-225_Mriya" },
    { title: "Wikimedia Commons: Antonov Design Bureau Antonov An-225 Mriya at Leipzig Halle (EDDP-LEJ).jpg", url: "https://commons.wikimedia.org/wiki/File:Antonov_Design_Bureau_Antonov_An-225_Mriya_at_Leipzig_Halle_(EDDP-LEJ).jpg" },
  ],
  "proc-vehicle-antonov-an24": [
    { title: "Wikipedia: Antonov An-24", url: "https://en.wikipedia.org/wiki/Antonov_An-24" },
    { title: "Wikimedia Commons: Antonov An-24.jpg", url: "https://commons.wikimedia.org/wiki/File:Antonov_An-24.jpg" },
  ],
  "proc-vehicle-ashok-leyland-captain": [
    { title: "Wikimedia Commons: Ashok Leyland Tipper Truck 726.jpg", url: "https://commons.wikimedia.org/wiki/File:Ashok_Leyland_Tipper_Truck_726.jpg" },
  ],
  "proc-vehicle-ashok-leyland-viking": [
    { title: "Wikipedia: Ashok Leyland Viking", url: "https://en.wikipedia.org/wiki/Ashok_Leyland_Viking" },
    { title: "Wikimedia Commons: MTC Bus 21G.JPG", url: "https://commons.wikimedia.org/wiki/File:MTC_Bus_21G.JPG" },
    { title: "Wikimedia Commons: City Bus Hyd.jpg", url: "https://commons.wikimedia.org/wiki/File:City_Bus_Hyd.jpg" },
  ],
  "proc-vehicle-atr-72": [
    { title: "Wikipedia: ATR 72", url: "https://en.wikipedia.org/wiki/ATR_72" },
    { title: "Wikimedia Commons: ATR 3.jpg", url: "https://commons.wikimedia.org/wiki/File:ATR_3.jpg" },
  ],
  "proc-vehicle-autocar-acx-refuse": [
    { title: "Wikimedia Commons: 15 Autocar (6037147668).jpg", url: "https://commons.wikimedia.org/wiki/File:15_Autocar_(6037147668).jpg" },
  ],
  "proc-vehicle-avia-a31": [
    { title: "Wikimedia Commons: Avia A31.JPG", url: "https://commons.wikimedia.org/wiki/File:Avia_A31.JPG" },
  ],
  "proc-vehicle-bac-111": [
    { title: "Wikipedia: BAC One-Eleven", url: "https://en.wikipedia.org/wiki/BAC_One-Eleven" },
    { title: "Wikimedia Commons: BAC 111-510ED 'G-AVMU' (24980480106).jpg", url: "https://commons.wikimedia.org/wiki/File:BAC_111-510ED_%27G-AVMU%27_(24980480106).jpg" },
  ],
  "proc-vehicle-bae-146": [
    { title: "Wikipedia: British Aerospace 146", url: "https://en.wikipedia.org/wiki/British_Aerospace_146" },
    { title: "Wikimedia Commons: Air tanker at Range Fire.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_tanker_at_Range_Fire.jpg" },
  ],
  "proc-vehicle-bedford-tk": [
    { title: "Wikipedia: Bedford TK", url: "https://en.wikipedia.org/wiki/Bedford_TK" },
    { title: "Wikimedia Commons: Bangladesh Police (DMP) Bedford TK wrecker. (31379671166).jpg", url: "https://commons.wikimedia.org/wiki/File:Bangladesh_Police_(DMP)_Bedford_TK_wrecker._(31379671166).jpg" },
  ],
  "proc-vehicle-beech-king-air": [
    { title: "Wikipedia: Beechcraft King Air", url: "https://en.wikipedia.org/wiki/Beechcraft_King_Air" },
    { title: "Wikimedia Commons: Be-e90-070323-a radecki-03.jpg", url: "https://commons.wikimedia.org/wiki/File:Be-e90-070323-a_radecki-03.jpg" },
  ],
  "proc-vehicle-belaz-75710": [
    { title: "Wikipedia: BelAZ 75710", url: "https://en.wikipedia.org/wiki/BelAZ_75710" },
    { title: "Wikimedia Commons: BelAZ 75710 5.png", url: "https://commons.wikimedia.org/wiki/File:BelAZ_75710_5.png" },
  ],
  "proc-vehicle-bell-206": [
    { title: "Wikipedia: Bell 206", url: "https://en.wikipedia.org/wiki/Bell_206" },
    { title: "Wikimedia Commons: A new looking AB206 at Farke airbase. (11278474235).jpg", url: "https://commons.wikimedia.org/wiki/File:A_new_looking_AB206_at_Farke_airbase._(11278474235).jpg" },
  ],
  "proc-vehicle-bell-b60e": [
    { title: "Wikimedia Commons: Bell B25D articulated dump truck (21167094964).jpg", url: "https://commons.wikimedia.org/wiki/File:Bell_B25D_articulated_dump_truck_(21167094964).jpg" },
  ],
  "proc-vehicle-berliet-t100": [
    { title: "Wikipedia: Berliet T100", url: "https://en.wikipedia.org/wiki/Berliet_T100" },
    { title: "Wikimedia Commons: Berliet T100 (vue avant gauche) - Fondation Marius Berliet, octobre 2018.jpg", url: "https://commons.wikimedia.org/wiki/File:Berliet_T100_(vue_avant_gauche)_-_Fondation_Marius_Berliet,_octobre_2018.jpg" },
  ],
  "proc-vehicle-berlin-flexity": [
    { title: "Wikipedia: Flexity Berlin", url: "https://en.wikipedia.org/wiki/Flexity_Berlin" },
    { title: "Wikimedia Commons: Bombardier Flexity Berlin.jpg", url: "https://commons.wikimedia.org/wiki/File:Bombardier_Flexity_Berlin.jpg" },
  ],
  "proc-vehicle-birney-safety-car": [
    { title: "Wikipedia: Birney", url: "https://en.wikipedia.org/wiki/Birney" },
    { title: "Wikimedia Commons: Fort Collins streetcar 21 at City Park (1987).jpg", url: "https://commons.wikimedia.org/wiki/File:Fort_Collins_streetcar_21_at_City_Park_(1987).jpg" },
  ],
  "proc-vehicle-blackpool-balloon": [
    { title: "Wikimedia Commons: Blackpool tram 726 Balloon car.jpg", url: "https://commons.wikimedia.org/wiki/File:Blackpool_tram_726_Balloon_car.jpg" },
  ],
  "proc-vehicle-blackpool-flexity": [
    { title: "Wikipedia: Flexity 2", url: "https://en.wikipedia.org/wiki/Flexity_2" },
    { title: "Wikimedia Commons: Blackpool Transport 003 (9126084712).jpg", url: "https://commons.wikimedia.org/wiki/File:Blackpool_Transport_003_(9126084712).jpg" },
    { title: "Wikimedia Commons: Evergem tram 2017 02.jpg", url: "https://commons.wikimedia.org/wiki/File:Evergem_tram_2017_02.jpg" },
  ],
  "proc-vehicle-blue-bird-vision": [
    { title: "Wikipedia: Blue Bird Vision", url: "https://en.wikipedia.org/wiki/Blue_Bird_Vision" },
    { title: "Wikimedia Commons: 2008 blue bird vision.jpg", url: "https://commons.wikimedia.org/wiki/File:2008_blue_bird_vision.jpg" },
    { title: "Wikimedia Commons: 2020 Blue Bird Vision 142.jpg", url: "https://commons.wikimedia.org/wiki/File:2020_Blue_Bird_Vision_142.jpg" },
  ],
  "proc-vehicle-bn-islander": [
    { title: "Wikipedia: Britten-Norman BN-2 Islander", url: "https://en.wikipedia.org/wiki/Britten-Norman_BN-2_Islander" },
    { title: "Wikimedia Commons: 2006-05-25-172629 Iceland H\u00f3lmahverfi.jpg", url: "https://commons.wikimedia.org/wiki/File:2006-05-25-172629_Iceland_H%C3%B3lmahverfi.jpg" },
  ],
  "proc-vehicle-boeing-314": [
    { title: "Wikipedia: Boeing 314 Clipper", url: "https://en.wikipedia.org/wiki/Boeing_314_Clipper" },
    { title: "Wikimedia Commons: BOAC Boeing Model 314A Clipper on Lagos Lagoon.jpg", url: "https://commons.wikimedia.org/wiki/File:BOAC_Boeing_Model_314A_Clipper_on_Lagos_Lagoon.jpg" },
  ],
  "proc-vehicle-boeing-377": [
    { title: "Wikipedia: Boeing 377 Stratocruiser", url: "https://en.wikipedia.org/wiki/Boeing_377_Stratocruiser" },
    { title: "Wikimedia Commons: 377Transocean (4477474530).jpg", url: "https://commons.wikimedia.org/wiki/File:377Transocean_(4477474530).jpg" },
  ],
  "proc-vehicle-boeing-707": [
    { title: "Wikipedia: Boeing 707", url: "https://en.wikipedia.org/wiki/Boeing_707" },
    { title: "Wikimedia Commons: 1959 Pan America Boeing 707(1).jpg", url: "https://commons.wikimedia.org/wiki/File:1959_Pan_America_Boeing_707(1).jpg" },
    { title: "Wikimedia Commons: 1959 Pan America Boeing 707(3).jpg", url: "https://commons.wikimedia.org/wiki/File:1959_Pan_America_Boeing_707(3).jpg" },
  ],
  "proc-vehicle-boeing-727": [
    { title: "Wikipedia: Boeing 727", url: "https://en.wikipedia.org/wiki/Boeing_727" },
    { title: "Wikimedia Commons: 11gg - Northwest Airlines Boeing 727-251; N203US@FLL;30.01.1998 (8064695962).jpg", url: "https://commons.wikimedia.org/wiki/File:11gg_-_Northwest_Airlines_Boeing_727-251;_N203US@FLL;30.01.1998_(8064695962).jpg" },
    { title: "Wikimedia Commons: AeroSur Boeing 727 Tail (7375662050).jpg", url: "https://commons.wikimedia.org/wiki/File:AeroSur_Boeing_727_Tail_(7375662050).jpg" },
  ],
  "proc-vehicle-boeing-737-200": [
    { title: "Wikipedia: Boeing 737", url: "https://en.wikipedia.org/wiki/Boeing_737" },
    { title: "Wikimedia Commons: 2011-05-19-flughafen-erfurt-by-RalfR-43 737 Air Berlin.jpg", url: "https://commons.wikimedia.org/wiki/File:2011-05-19-flughafen-erfurt-by-RalfR-43_737_Air_Berlin.jpg" },
  ],
  "proc-vehicle-boeing-737-max": [
    { title: "Wikipedia: Boeing 737 MAX", url: "https://en.wikipedia.org/wiki/Boeing_737_MAX" },
    { title: "Wikimedia Commons: 02142019 GOL B738M PR-XMA KMIA NASEDIT (33286349418).jpg", url: "https://commons.wikimedia.org/wiki/File:02142019_GOL_B738M_PR-XMA_KMIA_NASEDIT_(33286349418).jpg" },
    { title: "Wikimedia Commons: 737 MAX 10 Roll Out (Nov 2019) - 003.jpg", url: "https://commons.wikimedia.org/wiki/File:737_MAX_10_Roll_Out_(Nov_2019)_-_003.jpg" },
  ],
  "proc-vehicle-boeing-747-8": [
    { title: "Wikipedia: Boeing 747-8", url: "https://en.wikipedia.org/wiki/Boeing_747-8" },
    { title: "Wikimedia Commons: 747-8I (N6067E) takeoff.jpg", url: "https://commons.wikimedia.org/wiki/File:747-8I_(N6067E)_takeoff.jpg" },
  ],
  "proc-vehicle-boeing-757": [
    { title: "Wikipedia: Boeing 757", url: "https://en.wikipedia.org/wiki/Boeing_757" },
    { title: "Wikimedia Commons: Air Force Boeing 757 in Pegasus Field Antarctica.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Force_Boeing_757_in_Pegasus_Field_Antarctica.jpg" },
    { title: "Wikimedia Commons: Boeing 757-236 G-BNSF Air Europe Newcastle Airport.jpg", url: "https://commons.wikimedia.org/wiki/File:Boeing_757-236_G-BNSF_Air_Europe_Newcastle_Airport.jpg" },
  ],
  "proc-vehicle-boeing-767": [
    { title: "Wikipedia: Boeing 767", url: "https://en.wikipedia.org/wiki/Boeing_767" },
    { title: "Wikimedia Commons: 19-46063 Boeing KC-46A Pegasus USAF RAF Fairford 18.7.22 (52516305561).jpg", url: "https://commons.wikimedia.org/wiki/File:19-46063_Boeing_KC-46A_Pegasus_USAF_RAF_Fairford_18.7.22_(52516305561).jpg" },
    { title: "Wikimedia Commons: Air Canada 767 C-GAUN Gimli Glider.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Canada_767_C-GAUN_Gimli_Glider.jpg" },
  ],
  "proc-vehicle-boeing-777": [
    { title: "Wikipedia: Boeing 777", url: "https://en.wikipedia.org/wiki/Boeing_777" },
    { title: "Wikimedia Commons: 20251024 Boeing 777-36NER(SF) of Kalitta Air (N778CK) on final approach at HKG.jpg", url: "https://commons.wikimedia.org/wiki/File:20251024_Boeing_777-36NER(SF)_of_Kalitta_Air_(N778CK)_on_final_approach_at_HKG.jpg" },
  ],
  "proc-vehicle-boeing-787": [
    { title: "Wikipedia: Boeing 787 Dreamliner", url: "https://en.wikipedia.org/wiki/Boeing_787_Dreamliner" },
    { title: "Wikimedia Commons: Boeing 787 N1015B ANA Airlines (27611880663) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Boeing_787_N1015B_ANA_Airlines_(27611880663)_(cropped).jpg" },
  ],
  "proc-vehicle-boeing-dreamlifter": [
    { title: "Wikipedia: Boeing Dreamlifter", url: "https://en.wikipedia.org/wiki/Boeing_Dreamlifter" },
    { title: "Wikimedia Commons: Boeing, N780BA, B747-409(LCF) Dreamlifter - PAE (19833251496).jpg", url: "https://commons.wikimedia.org/wiki/File:Boeing,_N780BA,_B747-409(LCF)_Dreamlifter_-_PAE_(19833251496).jpg" },
  ],
  "proc-vehicle-bombardier-crj200": [
    { title: "Wikipedia: Bombardier CRJ100/200", url: "https://en.wikipedia.org/wiki/Bombardier_CRJ100%2F200" },
    { title: "Wikimedia Commons: American Eagle operated by SkyWest CRJ-200 (N955SW) (13641859024).jpg", url: "https://commons.wikimedia.org/wiki/File:American_Eagle_operated_by_SkyWest_CRJ-200_(N955SW)_(13641859024).jpg" },
    { title: "Wikimedia Commons: Bombardier CRJ-100 Lufthansa D-ACJJ - MSN 7298 - Now in UTair fleet as VQ-BGU (3238726666).jpg", url: "https://commons.wikimedia.org/wiki/File:Bombardier_CRJ-100_Lufthansa_D-ACJJ_-_MSN_7298_-_Now_in_UTair_fleet_as_VQ-BGU_(3238726666).jpg" },
  ],
  "proc-vehicle-bombardier-crj900": [
    { title: "Wikipedia: Bombardier CRJ700 series", url: "https://en.wikipedia.org/wiki/Bombardier_CRJ700_series" },
    { title: "Wikimedia Commons: AC Jazz CRJ705 YQR.jpg", url: "https://commons.wikimedia.org/wiki/File:AC_Jazz_CRJ705_YQR.jpg" },
  ],
  "proc-vehicle-bombardier-global": [
    { title: "Wikipedia: Bombardier Global 7500", url: "https://en.wikipedia.org/wiki/Bombardier_Global_7500" },
    { title: "Wikimedia Commons: Bd700 (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Bd700_(cropped).jpg" },
  ],
  "proc-vehicle-boston-type-8": [
    { title: "Wikimedia Commons: MBTA Green Line Type 8 in poor condition behind Riverside Carhouse June 2025.jpg", url: "https://commons.wikimedia.org/wiki/File:MBTA_Green_Line_Type_8_in_poor_condition_behind_Riverside_Carhouse_June_2025.jpg" },
  ],
  "proc-vehicle-bristol-lodekka": [
    { title: "Wikipedia: Bristol Lodekka", url: "https://en.wikipedia.org/wiki/Bristol_Lodekka" },
    { title: "Wikimedia Commons: Lodekka Double Decker Dress Shop.jpg", url: "https://commons.wikimedia.org/wiki/File:Lodekka_Double_Decker_Dress_Shop.jpg" },
    { title: "Wikimedia Commons: Bristol Omnibus bus 7283 (HHY 186D), 2012 Bristol Vintage Bus Group open day (2) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Bristol_Omnibus_bus_7283_(HHY_186D),_2012_Bristol_Vintage_Bus_Group_open_day_(2)_(cropped).jpg" },
  ],
  "proc-vehicle-brookville-liberty": [
    { title: "Wikipedia: Brookville Liberty Modern Streetcar", url: "https://en.wikipedia.org/wiki/Brookville_Liberty_Modern_Streetcar" },
    { title: "Wikimedia Commons: Brookville-built car 201804 of OKC Streetcar on 4th St east of Robinson Ave (2021).jpg", url: "https://commons.wikimedia.org/wiki/File:Brookville-built_car_201804_of_OKC_Streetcar_on_4th_St_east_of_Robinson_Ave_(2021).jpg" },
  ],
  "proc-vehicle-brussels-pcc": [
    { title: "Wikipedia: Trams in Brussels", url: "https://en.wikipedia.org/wiki/Trams_in_Brussels" },
    { title: "Wikimedia Commons: L83 PCC7912 Berchem-Shopping.jpg", url: "https://commons.wikimedia.org/wiki/File:L83_PCC7912_Berchem-Shopping.jpg" },
  ],
  "proc-vehicle-bucharest-v3a": [
    { title: "Wikimedia Commons: Tramvai in Bucuresti - panoramio.jpg", url: "https://commons.wikimedia.org/wiki/File:Tramvai_in_Bucuresti_-_panoramio.jpg" },
  ],
  "proc-vehicle-budapest-ganz-uv": [
    { title: "Wikipedia: Ganz UV", url: "https://en.wikipedia.org/wiki/Ganz_UV" },
    { title: "Wikimedia Commons: Lijn47UVwagn.jpg", url: "https://commons.wikimedia.org/wiki/File:Lijn47UVwagn.jpg" },
  ],
  "proc-vehicle-buenos-aires-colectivo": [
    { title: "Wikipedia: Colectivo", url: "https://en.wikipedia.org/wiki/Colectivo" },
    { title: "Wikimedia Commons: Buenos Aires - Colectivo 194 - 120227 142641.jpg", url: "https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Colectivo_194_-_120227_142641.jpg" },
    { title: "Wikimedia Commons: Buenos Aires - Colectivo L\u00ednea 26 - 20130313 124442.jpg", url: "https://commons.wikimedia.org/wiki/File:Buenos_Aires_-_Colectivo_L%C3%ADnea_26_-_20130313_124442.jpg" },
  ],
  "proc-vehicle-buenos-aires-premetro": [
    { title: "Wikipedia: Premetro (Buenos Aires)", url: "https://en.wikipedia.org/wiki/Premetro_(Buenos_Aires)" },
    { title: "Wikimedia Commons: Estaci\u00f3n General Savio (2).JPG", url: "https://commons.wikimedia.org/wiki/File:Estaci%C3%B3n_General_Savio_(2).JPG" },
  ],
  "proc-vehicle-bussing-d2u": [
    { title: "Wikimedia Commons: B\u00fcssing-Anderthalbdecker von 1965 Braunschweig 2015 (Brunswyk).jpg", url: "https://commons.wikimedia.org/wiki/File:B%C3%BCssing-Anderthalbdecker_von_1965_Braunschweig_2015_(Brunswyk).jpg" },
  ],
  "proc-vehicle-byd-k9": [
    { title: "Wikipedia: BYD K series", url: "https://en.wikipedia.org/wiki/BYD_K_series" },
    { title: "Wikimedia Commons: BYD K9 Gemilang, SBS Transit.jpg", url: "https://commons.wikimedia.org/wiki/File:BYD_K9_Gemilang,_SBS_Transit.jpg" },
    { title: "Wikimedia Commons: Keolis Syntus RRReis BYD K9UB 2098 06-10-2022.jpg", url: "https://commons.wikimedia.org/wiki/File:Keolis_Syntus_RRReis_BYD_K9UB_2098_06-10-2022.jpg" },
  ],
  "proc-vehicle-cable-car-dunedin": [
    { title: "Wikipedia: Cable car (railway)", url: "https://en.wikipedia.org/wiki/Cable_car_(railway)" },
    { title: "Wikimedia Commons: Falcon Street steps.jpg", url: "https://commons.wikimedia.org/wiki/File:Falcon_Street_steps.jpg" },
  ],
  "proc-vehicle-caf-urbos": [
    { title: "Wikipedia: CAF Urbos", url: "https://en.wikipedia.org/wiki/CAF_Urbos" },
    { title: "Wikimedia Commons: 19-es villamos (2205).jpg", url: "https://commons.wikimedia.org/wiki/File:19-es_villamos_(2205).jpg" },
  ],
  "proc-vehicle-cairo-cta-bus": [
    { title: "Wikimedia Commons: Cairo bus.jpg", url: "https://commons.wikimedia.org/wiki/File:Cairo_bus.jpg" },
  ],
  "proc-vehicle-canadair-cl415": [
    { title: "Wikipedia: Canadair CL-415", url: "https://en.wikipedia.org/wiki/Canadair_CL-415" },
    { title: "Wikimedia Commons: Bombardier-415 (cropped).JPG", url: "https://commons.wikimedia.org/wiki/File:Bombardier-415_(cropped).JPG" },
  ],
  "proc-vehicle-caravelle": [
    { title: "Wikipedia: Sud Aviation Caravelle", url: "https://en.wikipedia.org/wiki/Sud_Aviation_Caravelle" },
    { title: "Wikimedia Commons: Aero Jet Caravelle; HB-ICJ@ZRH;11.08.1994 (4848256908).jpg", url: "https://commons.wikimedia.org/wiki/File:Aero_Jet_Caravelle;_HB-ICJ@ZRH;11.08.1994_(4848256908).jpg" },
  ],
  "proc-vehicle-cat-797": [
    { title: "Wikipedia: Caterpillar 797", url: "https://en.wikipedia.org/wiki/Caterpillar_797" },
    { title: "Wikimedia Commons: Caterpillar-797-haul-truck-the-big-mining-truck.jpg", url: "https://commons.wikimedia.org/wiki/File:Caterpillar-797-haul-truck-the-big-mining-truck.jpg" },
  ],
  "proc-vehicle-cessna-172": [
    { title: "Wikipedia: Cessna 172", url: "https://en.wikipedia.org/wiki/Cessna_172" },
    { title: "Wikimedia Commons: 1963-Cessna-172D.jpg", url: "https://commons.wikimedia.org/wiki/File:1963-Cessna-172D.jpg" },
  ],
  "proc-vehicle-cessna-caravan": [
    { title: "Wikipedia: Cessna 208 Caravan", url: "https://en.wikipedia.org/wiki/Cessna_208_Caravan" },
    { title: "Wikimedia Commons: 101108-A-5370B-002 AC-208 Hellfire launch (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:101108-A-5370B-002_AC-208_Hellfire_launch_(cropped).jpg" },
  ],
  "proc-vehicle-chausson-aph": [
    { title: "Wikimedia Commons: Chausson APH-1 - SGTE.jpg", url: "https://commons.wikimedia.org/wiki/File:Chausson_APH-1_-_SGTE.jpg" },
  ],
  "proc-vehicle-chicken-bus": [
    { title: "Wikipedia: Bus transport in Central America", url: "https://en.wikipedia.org/wiki/Bus_transport_in_Central_America" },
    { title: "Wikimedia Commons: Colorful Buses in Antigua Guatemala, 2020.jpg", url: "https://commons.wikimedia.org/wiki/File:Colorful_Buses_in_Antigua_Guatemala,_2020.jpg" },
  ],
  "proc-vehicle-christchurch-boon": [
    { title: "Wikipedia: Christchurch tramway system", url: "https://en.wikipedia.org/wiki/Christchurch_tramway_system" },
    { title: "Wikimedia Commons: Christchurch Tram.jpg", url: "https://commons.wikimedia.org/wiki/File:Christchurch_Tram.jpg" },
  ],
  "proc-vehicle-citroen-h-van": [
    { title: "Wikipedia: Citro\u00ebn H Van", url: "https://en.wikipedia.org/wiki/Citro%C3%ABn_H_Van" },
    { title: "Wikimedia Commons: CitroenHYInt.jpg", url: "https://commons.wikimedia.org/wiki/File:CitroenHYInt.jpg" },
  ],
  "proc-vehicle-cobus-3000": [
    { title: "Wikipedia: Cobus Industries", url: "https://en.wikipedia.org/wiki/Cobus_Industries" },
    { title: "Wikimedia Commons: TXL Cobus 2700.jpg", url: "https://commons.wikimedia.org/wiki/File:TXL_Cobus_2700.jpg" },
  ],
  "proc-vehicle-comac-arj21": [
    { title: "Wikipedia: Comac C909", url: "https://en.wikipedia.org/wiki/Comac_C909" },
    { title: "Wikimedia Commons: (SGP-Singapore) Air Central Comac ARJ21-700P2F B-3388 @ Singapore Airshow 2024-02-25.jpg", url: "https://commons.wikimedia.org/wiki/File:(SGP-Singapore)_Air_Central_Comac_ARJ21-700P2F_B-3388_@_Singapore_Airshow_2024-02-25.jpg" },
  ],
  "proc-vehicle-comac-c919": [
    { title: "Wikipedia: Comac C919", url: "https://en.wikipedia.org/wiki/Comac_C919" },
    { title: "Wikimedia Commons: (SGP-Singapore) China Eastern Airlines Comac C919-100ER B-919A @ Singapore Airshow 2024-02-25 (2).jpg", url: "https://commons.wikimedia.org/wiki/File:(SGP-Singapore)_China_Eastern_Airlines_Comac_C919-100ER_B-919A_@_Singapore_Airshow_2024-02-25_(2).jpg" },
  ],
  "proc-vehicle-concorde": [
    { title: "Wikipedia: Concorde", url: "https://en.wikipedia.org/wiki/Concorde" },
    { title: "Wikimedia Commons: 02.03.69 1er vol de Concorde (1969) - 53Fi1931 - cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:02.03.69_1er_vol_de_Concorde_(1969)_-_53Fi1931_-_cropped.jpg" },
  ],
  "proc-vehicle-convair-880": [
    { title: "Wikipedia: Convair 880", url: "https://en.wikipedia.org/wiki/Convair_880" },
    { title: "Wikimedia Commons: Air-to-air with a Convair 880.jpg", url: "https://commons.wikimedia.org/wiki/File:Air-to-air_with_a_Convair_880.jpg" },
  ],
  "proc-vehicle-croydon-cr4000": [
    { title: "Wikipedia: Bombardier CR4000", url: "https://en.wikipedia.org/wiki/Bombardier_CR4000" },
    { title: "Wikimedia Commons: Dashing Through the Snow (crop)- geograph.org.uk - 1624272.jpg", url: "https://commons.wikimedia.org/wiki/File:Dashing_Through_the_Snow_(crop)-_geograph.org.uk_-_1624272.jpg" },
    { title: "Wikimedia Commons: Gravel Hill tram stop - geograph.org.uk - 825646.jpg", url: "https://commons.wikimedia.org/wiki/File:Gravel_Hill_tram_stop_-_geograph.org.uk_-_825646.jpg" },
  ],
  "proc-vehicle-csepel-d450": [
    { title: "Wikimedia Commons: Budapesti Ipari V\u00e1s\u00e1r. Csepel D-450 t\u00edpus\u00fa nyergesvontat\u00f3. Fortepan 77108.jpg", url: "https://commons.wikimedia.org/wiki/File:Budapesti_Ipari_V%C3%A1s%C3%A1r._Csepel_D-450_t%C3%ADpus%C3%BA_nyergesvontat%C3%B3._Fortepan_77108.jpg" },
  ],
  "proc-vehicle-curitiba-biarticulado": [
    { title: "Wikipedia: Rede Integrada de Transporte", url: "https://en.wikipedia.org/wiki/Rede_Integrada_de_Transporte" },
    { title: "Wikimedia Commons: COP8MOP3 2006 Curitiba bus 2.jpg", url: "https://commons.wikimedia.org/wiki/File:COP8MOP3_2006_Curitiba_bus_2.jpg" },
    { title: "Wikimedia Commons: COP8MOP3 2006 Curitiba busstop 2.jpg", url: "https://commons.wikimedia.org/wiki/File:COP8MOP3_2006_Curitiba_busstop_2.jpg" },
  ],
  "proc-vehicle-daewoo-bs106": [
    { title: "Wikipedia: Zyle Daewoo Bus", url: "https://en.wikipedia.org/wiki/Zyle_Daewoo_Bus" },
    { title: "Wikimedia Commons: Daewoo BS106.jpg", url: "https://commons.wikimedia.org/wiki/File:Daewoo_BS106.jpg" },
  ],
  "proc-vehicle-daf-2600": [
    { title: "Wikimedia Commons: DAF 2600 truck - 220505.jpg", url: "https://commons.wikimedia.org/wiki/File:DAF_2600_truck_-_220505.jpg" },
    { title: "Wikimedia Commons: 1963 DAF A 2600 DP pic1.JPG", url: "https://commons.wikimedia.org/wiki/File:1963_DAF_A_2600_DP_pic1.JPG" },
  ],
  "proc-vehicle-daf-cf-refuse": [
    { title: "Wikimedia Commons: DAF CF, North Fremantle, 2020 (02).jpg", url: "https://commons.wikimedia.org/wiki/File:DAF_CF,_North_Fremantle,_2020_(02).jpg" },
  ],
  "proc-vehicle-daf-xf": [
    { title: "Wikipedia: DAF XF", url: "https://en.wikipedia.org/wiki/DAF_XF" },
    { title: "Wikimedia Commons: DAF XF 2017.jpg", url: "https://commons.wikimedia.org/wiki/File:DAF_XF_2017.jpg" },
    { title: "Wikimedia Commons: DAF XF Euro6 510 6X2 FTS (XF 106) 1.jpg", url: "https://commons.wikimedia.org/wiki/File:DAF_XF_Euro6_510_6X2_FTS_(XF_106)_1.jpg" },
  ],
  "proc-vehicle-dalian-tram": [
    { title: "Wikipedia: Dalian Tram", url: "https://en.wikipedia.org/wiki/Dalian_Tram" },
    { title: "Wikimedia Commons: DL2000 & DL7000.jpg", url: "https://commons.wikimedia.org/wiki/File:DL2000_%26_DL7000.jpg" },
  ],
  "proc-vehicle-danfo": [
    { title: "Wikipedia: Danfo", url: "https://en.wikipedia.org/wiki/Danfo" },
    { title: "Wikimedia Commons: The Danfo of Lagos.jpg", url: "https://commons.wikimedia.org/wiki/File:The_Danfo_of_Lagos.jpg" },
  ],
  "proc-vehicle-dassault-falcon-7x": [
    { title: "Wikipedia: Dassault Falcon 7X", url: "https://en.wikipedia.org/wiki/Dassault_Falcon_7X" },
    { title: "Wikimedia Commons: A-0801 ZRH 23.01.25 (54382857643).jpg", url: "https://commons.wikimedia.org/wiki/File:A-0801_ZRH_23.01.25_(54382857643).jpg" },
  ],
  "proc-vehicle-dekotora": [
    { title: "Wikipedia: Dekotora", url: "https://en.wikipedia.org/wiki/Dekotora" },
    { title: "Wikimedia Commons: Ichibanboshi (Dekotora), Fuso T-Series,.jpg", url: "https://commons.wikimedia.org/wiki/File:Ichibanboshi_(Dekotora),_Fuso_T-Series,.jpg" },
  ],
  "proc-vehicle-dennis-fire-engine": [
    { title: "Wikimedia Commons: DennisSabre.JPG", url: "https://commons.wikimedia.org/wiki/File:DennisSabre.JPG" },
  ],
  "proc-vehicle-dennis-trident-hk": [
    { title: "Wikipedia: Dennis Trident 3", url: "https://en.wikipedia.org/wiki/Dennis_Trident_3" },
    { title: "Wikimedia Commons: Atr1 Dennis Trident demonstrator (19894744119).jpg", url: "https://commons.wikimedia.org/wiki/File:Atr1_Dennis_Trident_demonstrator_(19894744119).jpg" },
    { title: "Wikimedia Commons: BCTRANSITDENNISTRIDENT2000.jpg", url: "https://commons.wikimedia.org/wiki/File:BCTRANSITDENNISTRIDENT2000.jpg" },
  ],
  "proc-vehicle-designline-olymbus": [
    { title: "Wikipedia: Environmental Performance Vehicles", url: "https://en.wikipedia.org/wiki/Environmental_Performance_Vehicles" },
    { title: "Wikimedia Commons: EV Uptown.jpg", url: "https://commons.wikimedia.org/wiki/File:EV_Uptown.jpg" },
    { title: "Wikimedia Commons: REEV Right side Photo.jpg", url: "https://commons.wikimedia.org/wiki/File:REEV_Right_side_Photo.jpg" },
  ],
  "proc-vehicle-dh-comet": [
    { title: "Wikipedia: De Havilland Comet", url: "https://en.wikipedia.org/wiki/De_Havilland_Comet" },
    { title: "Wikimedia Commons: BOAC Comet 1952 Entebbe.jpg", url: "https://commons.wikimedia.org/wiki/File:BOAC_Comet_1952_Entebbe.jpg" },
    { title: "Wikimedia Commons: Comet Canopus.jpg", url: "https://commons.wikimedia.org/wiki/File:Comet_Canopus.jpg" },
  ],
  "proc-vehicle-dh-dragon-rapide": [
    { title: "Wikipedia: De Havilland Dragon Rapide", url: "https://en.wikipedia.org/wiki/De_Havilland_Dragon_Rapide" },
    { title: "Wikimedia Commons: Aircraft of the Royal Air Force, 1939-1945- De Havilland Dh.89 Rapide and Dominie. MH4576.jpg", url: "https://commons.wikimedia.org/wiki/File:Aircraft_of_the_Royal_Air_Force,_1939-1945-_De_Havilland_Dh.89_Rapide_and_Dominie._MH4576.jpg" },
  ],
  "proc-vehicle-dhc-beaver": [
    { title: "Wikipedia: De Havilland Canada DHC-2 Beaver", url: "https://en.wikipedia.org/wiki/De_Havilland_Canada_DHC-2_Beaver" },
    { title: "Wikimedia Commons: 600hpDH2.jpg", url: "https://commons.wikimedia.org/wiki/File:600hpDH2.jpg" },
  ],
  "proc-vehicle-dhc-dash8": [
    { title: "Wikipedia: De Havilland Canada Dash 8", url: "https://en.wikipedia.org/wiki/De_Havilland_Canada_Dash_8" },
    { title: "Wikimedia Commons: Air Canada Jazz De Havilland Canada DHC-8-102 Dash 8 C-GANQ 833 (7097889771).jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Canada_Jazz_De_Havilland_Canada_DHC-8-102_Dash_8_C-GANQ_833_(7097889771).jpg" },
  ],
  "proc-vehicle-dhc-twin-otter": [
    { title: "Wikipedia: De Havilland Canada DHC-6 Twin Otter", url: "https://en.wikipedia.org/wiki/De_Havilland_Canada_DHC-6_Twin_Otter" },
    { title: "Wikimedia Commons: Aerov\u00edas DAP-TWIN otter (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Aerov%C3%ADas_DAP-TWIN_otter_(cropped).jpg" },
  ],
  "proc-vehicle-dongfeng-eq140": [
    { title: "Wikipedia: Dongfeng EQ140", url: "https://en.wikipedia.org/wiki/Dongfeng_EQ140" },
    { title: "Wikimedia Commons: Dongfeng EQ155-1 1984-1990.jpg", url: "https://commons.wikimedia.org/wiki/File:Dongfeng_EQ155-1_1984-1990.jpg" },
  ],
  "proc-vehicle-doppelmayr-omega": [
    { title: "Wikipedia: Gondola lift", url: "https://en.wikipedia.org/wiki/Gondola_lift" },
    { title: "Wikimedia Commons: 14-Telef\u00e9rico-La-Paz-nX-3.jpg", url: "https://commons.wikimedia.org/wiki/File:14-Telef%C3%A9rico-La-Paz-nX-3.jpg" },
    { title: "Wikimedia Commons: Yllastunturi Gondola Lifts 20090301.JPG", url: "https://commons.wikimedia.org/wiki/File:Yllastunturi_Gondola_Lifts_20090301.JPG" },
  ],
  "proc-vehicle-douglas-dc10": [
    { title: "Wikipedia: McDonnell Douglas DC-10", url: "https://en.wikipedia.org/wiki/McDonnell_Douglas_DC-10" },
    { title: "Wikimedia Commons: Continental Airlines DC-10.jpg", url: "https://commons.wikimedia.org/wiki/File:Continental_Airlines_DC-10.jpg" },
    { title: "Wikimedia Commons: KC-10 Extender with the 76th Air Refueling Squadron.jpg", url: "https://commons.wikimedia.org/wiki/File:KC-10_Extender_with_the_76th_Air_Refueling_Squadron.jpg" },
  ],
  "proc-vehicle-douglas-dc3": [
    { title: "Wikipedia: Douglas DC-3", url: "https://en.wikipedia.org/wiki/Douglas_DC-3" },
    { title: "Wikimedia Commons: 2022-06-09 Douglas DC-3 of McDonald's at Taupo.jpg", url: "https://commons.wikimedia.org/wiki/File:2022-06-09_Douglas_DC-3_of_McDonald%27s_at_Taupo.jpg" },
  ],
  "proc-vehicle-douglas-dc6": [
    { title: "Wikipedia: Douglas DC-6", url: "https://en.wikipedia.org/wiki/Douglas_DC-6" },
    { title: "Wikimedia Commons: 6609-UAL-DC-6-NorthRampStapletonDEN.jpg", url: "https://commons.wikimedia.org/wiki/File:6609-UAL-DC-6-NorthRampStapletonDEN.jpg" },
  ],
  "proc-vehicle-douglas-dc8": [
    { title: "Wikipedia: Douglas DC-8", url: "https://en.wikipedia.org/wiki/Douglas_DC-8" },
    { title: "Wikimedia Commons: Air Spain Douglas DC-8-21EC-BXR.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Spain_Douglas_DC-8-21EC-BXR.jpg" },
    { title: "Wikimedia Commons: DC-8 Airborne Laboratory in flight over snow-capped Sierra Nevada mountain range.jpg", url: "https://commons.wikimedia.org/wiki/File:DC-8_Airborne_Laboratory_in_flight_over_snow-capped_Sierra_Nevada_mountain_range.jpg" },
  ],
  "proc-vehicle-douglas-dc9": [
    { title: "Wikipedia: McDonnell Douglas DC-9", url: "https://en.wikipedia.org/wiki/McDonnell_Douglas_DC-9" },
    { title: "Wikimedia Commons: Air Canada DC-9-32; CF-TLU@JFK, August 1968.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Canada_DC-9-32;_CF-TLU@JFK,_August_1968.jpg" },
  ],
  "proc-vehicle-dubai-citadis": [
    { title: "Wikipedia: Dubai Tram", url: "https://en.wikipedia.org/wiki/Dubai_Tram" },
    { title: "Wikimedia Commons: Dubai Tram Alstom Citadis 402 at Al Sufouh.jpg", url: "https://commons.wikimedia.org/wiki/File:Dubai_Tram_Alstom_Citadis_402_at_Al_Sufouh.jpg" },
  ],
  "proc-vehicle-duewag-b80": [
    { title: "Wikipedia: Stadtbahnwagen B", url: "https://en.wikipedia.org/wiki/Stadtbahnwagen_B" },
    { title: "Wikimedia Commons: I12 356 Bf Olof-Palme-Allee, ET 7756.jpg", url: "https://commons.wikimedia.org/wiki/File:I12_356_Bf_Olof-Palme-Allee,_ET_7756.jpg" },
  ],
  "proc-vehicle-duewag-gt8": [
    { title: "Wikipedia: Duewag GT8 Typ Freiburg", url: "https://en.wikipedia.org/wiki/Duewag_GT8_Typ_Freiburg" },
    { title: "Wikimedia Commons: Duewag GT8.jpg", url: "https://commons.wikimedia.org/wiki/File:Duewag_GT8.jpg" },
  ],
  "proc-vehicle-duewag-u2": [
    { title: "Wikimedia Commons: DuwagSanDiego.jpg", url: "https://commons.wikimedia.org/wiki/File:DuwagSanDiego.jpg" },
  ],
  "proc-vehicle-durmazlar-silkworm": [
    { title: "Wikimedia Commons: Durmazlar Silkworm near Be\u015fyol T2, January 2026.jpg", url: "https://commons.wikimedia.org/wiki/File:Durmazlar_Silkworm_near_Be%C5%9Fyol_T2,_January_2026.jpg" },
  ],
  "proc-vehicle-electron-t5l64": [
    { title: "Wikipedia: Electrontrans", url: "https://en.wikipedia.org/wiki/Electrontrans" },
    { title: "Wikimedia Commons: Electron T5L64 Franka square 1.JPG", url: "https://commons.wikimedia.org/wiki/File:Electron_T5L64_Franka_square_1.JPG" },
    { title: "Wikimedia Commons: ElectronTramway-in-Lviv.JPG", url: "https://commons.wikimedia.org/wiki/File:ElectronTramway-in-Lviv.JPG" },
  ],
  "proc-vehicle-embraer-bandeirante": [
    { title: "Wikipedia: Embraer EMB 110 Bandeirante", url: "https://en.wikipedia.org/wiki/Embraer_EMB_110_Bandeirante" },
    { title: "Wikimedia Commons: Cook Islands IMG 4970 (8451963059).jpg", url: "https://commons.wikimedia.org/wiki/File:Cook_Islands_IMG_4970_(8451963059).jpg" },
  ],
  "proc-vehicle-embraer-brasilia": [
    { title: "Wikipedia: Embraer EMB 120 Brasilia", url: "https://en.wikipedia.org/wiki/Embraer_EMB_120_Brasilia" },
    { title: "Wikimedia Commons: EC-HTS 2 EMB.120(F) Brazilia Swiftair Cargo PMI 04JUN13 (8953072920).jpg", url: "https://commons.wikimedia.org/wiki/File:EC-HTS_2_EMB.120(F)_Brazilia_Swiftair_Cargo_PMI_04JUN13_(8953072920).jpg" },
  ],
  "proc-vehicle-embraer-e190": [
    { title: "Wikipedia: Embraer E-Jet family", url: "https://en.wikipedia.org/wiki/Embraer_E-Jet_family" },
    { title: "Wikimedia Commons: First Embraer E190 ever built, retired in Kingman, AZ.jpg", url: "https://commons.wikimedia.org/wiki/File:First_Embraer_E190_ever_built,_retired_in_Kingman,_AZ.jpg" },
    { title: "Wikimedia Commons: Hannover Airport Air France Hop Embraer ERJ-170STD F-HBXC (DSC04968).jpg", url: "https://commons.wikimedia.org/wiki/File:Hannover_Airport_Air_France_Hop_Embraer_ERJ-170STD_F-HBXC_(DSC04968).jpg" },
  ],
  "proc-vehicle-embraer-e195-e2": [
    { title: "Wikipedia: Embraer E-Jet E2 family", url: "https://en.wikipedia.org/wiki/Embraer_E-Jet_E2_family" },
    { title: "Wikimedia Commons: EC-NHA Embraer 195-E2 Binter arrecife 29-02-20.jpg", url: "https://commons.wikimedia.org/wiki/File:EC-NHA_Embraer_195-E2_Binter_arrecife_29-02-20.jpg" },
    { title: "Wikimedia Commons: EGLF - Embraer E190-E2 - PR-ZGQ (42923565984).jpg", url: "https://commons.wikimedia.org/wiki/File:EGLF_-_Embraer_E190-E2_-_PR-ZGQ_(42923565984).jpg" },
  ],
  "proc-vehicle-embraer-erj145": [
    { title: "Wikipedia: Embraer ERJ family", url: "https://en.wikipedia.org/wiki/Embraer_ERJ_family" },
    { title: "Wikimedia Commons: 465ka (4263619765).jpg", url: "https://commons.wikimedia.org/wiki/File:465ka_(4263619765).jpg" },
  ],
  "proc-vehicle-embraer-phenom-300": [
    { title: "Wikipedia: Embraer Phenom 300", url: "https://en.wikipedia.org/wiki/Embraer_Phenom_300" },
    { title: "Wikimedia Commons: Embraer Phenom 300 Mockup.jpg", url: "https://commons.wikimedia.org/wiki/File:Embraer_Phenom_300_Mockup.jpg" },
  ],
  "proc-vehicle-faw-j7": [
    { title: "Wikimedia Commons: 20220709 Jiefang J7 truck on Shangdu Road.jpg", url: "https://commons.wikimedia.org/wiki/File:20220709_Jiefang_J7_truck_on_Shangdu_Road.jpg" },
  ],
  "proc-vehicle-faw-jiefang-ca10": [
    { title: "Wikimedia Commons: FAW Jiefang CA10 IAA Transportation 2026 (DSC1066).jpg", url: "https://commons.wikimedia.org/wiki/File:FAW_Jiefang_CA10_IAA_Transportation_2026_(DSC1066).jpg" },
  ],
  "proc-vehicle-fiat-682": [
    { title: "Wikimedia Commons: Fiat 682 1.JPG", url: "https://commons.wikimedia.org/wiki/File:Fiat_682_1.JPG" },
  ],
  "proc-vehicle-flexity-outlook": [
    { title: "Wikipedia: Flexity Outlook", url: "https://en.wikipedia.org/wiki/Flexity_Outlook" },
    { title: "Wikimedia Commons: Bombardier Cityrunner 2020.jpg", url: "https://commons.wikimedia.org/wiki/File:Bombardier_Cityrunner_2020.jpg" },
    { title: "Wikimedia Commons: Flexity outlook 4403 heading south, 2014 08 31 (8) (14918534190).jpg", url: "https://commons.wikimedia.org/wiki/File:Flexity_outlook_4403_heading_south,_2014_08_31_(8)_(14918534190).jpg" },
  ],
  "proc-vehicle-florence-sirio": [
    { title: "Wikipedia: Hitachi Sirio", url: "https://en.wikipedia.org/wiki/Hitachi_Sirio" },
    { title: "Wikimedia Commons: Tramvia firenze sirio.jpg", url: "https://commons.wikimedia.org/wiki/File:Tramvia_firenze_sirio.jpg" },
  ],
  "proc-vehicle-flxible-clipper": [
    { title: "Wikipedia: Flxible", url: "https://en.wikipedia.org/wiki/Flxible" },
    { title: "Wikimedia Commons: 1947 Flxible Clipper.jpg", url: "https://commons.wikimedia.org/wiki/File:1947_Flxible_Clipper.jpg" },
    { title: "Wikimedia Commons: 1955 Ansair Flxible Clipper Bus (30680614642).jpg", url: "https://commons.wikimedia.org/wiki/File:1955_Ansair_Flxible_Clipper_Bus_(30680614642).jpg" },
  ],
  "proc-vehicle-fokker-100": [
    { title: "Wikipedia: Fokker 100", url: "https://en.wikipedia.org/wiki/Fokker_100" },
    { title: "Wikimedia Commons: Fokker 100 (KLM) PH-OFN (10676665315).jpg", url: "https://commons.wikimedia.org/wiki/File:Fokker_100_(KLM)_PH-OFN_(10676665315).jpg" },
  ],
  "proc-vehicle-fokker-50": [
    { title: "Wikipedia: Fokker 50", url: "https://en.wikipedia.org/wiki/Fokker_50" },
    { title: "Wikimedia Commons: Fokker 50 Aero.jpg", url: "https://commons.wikimedia.org/wiki/File:Fokker_50_Aero.jpg" },
  ],
  "proc-vehicle-fokker-f27": [
    { title: "Wikipedia: Fokker F27 Friendship", url: "https://en.wikipedia.org/wiki/Fokker_F27_Friendship" },
    { title: "Wikimedia Commons: 322aa - LAB Fokker F27, CP-2013@CBB,25.09.2004 - Flickr - Aero Icarus.jpg", url: "https://commons.wikimedia.org/wiki/File:322aa_-_LAB_Fokker_F27,_CP-2013@CBB,25.09.2004_-_Flickr_-_Aero_Icarus.jpg" },
  ],
  "proc-vehicle-fokker-f28": [
    { title: "Wikipedia: Fokker F28 Fellowship", url: "https://en.wikipedia.org/wiki/Fokker_F28_Fellowship" },
    { title: "Wikimedia Commons: A-2803 Fokker 28 TNI ANGKATAN UDARA (8391006789).jpg", url: "https://commons.wikimedia.org/wiki/File:A-2803_Fokker_28_TNI_ANGKATAN_UDARA_(8391006789).jpg" },
    { title: "Wikimedia Commons: Air Namibia F28-3000 V5-KEX (6350319131).jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Namibia_F28-3000_V5-KEX_(6350319131).jpg" },
  ],
  "proc-vehicle-ford-cargo": [
    { title: "Wikipedia: Ford Cargo", url: "https://en.wikipedia.org/wiki/Ford_Cargo" },
    { title: "Wikimedia Commons: Ford-Cargo-Pritschenkipper.jpg", url: "https://commons.wikimedia.org/wiki/File:Ford-Cargo-Pritschenkipper.jpg" },
  ],
  "proc-vehicle-ford-model-tt": [
    { title: "Wikipedia: Ford Model TT", url: "https://en.wikipedia.org/wiki/Ford_Model_TT" },
    { title: "Wikimedia Commons: 1919FordModelTT.jpg", url: "https://commons.wikimedia.org/wiki/File:1919FordModelTT.jpg" },
  ],
  "proc-vehicle-ford-transit-mk1": [
    { title: "Wikimedia Commons: Ford Transit (Mk1) (24670303502).jpg", url: "https://commons.wikimedia.org/wiki/File:Ford_Transit_(Mk1)_(24670303502).jpg" },
  ],
  "proc-vehicle-ford-trimotor": [
    { title: "Wikipedia: Ford Trimotor", url: "https://en.wikipedia.org/wiki/Ford_Trimotor" },
    { title: "Wikimedia Commons: Air Zoo December 2019 046 (Ford Tri-Motor).jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Zoo_December_2019_046_(Ford_Tri-Motor).jpg" },
  ],
  "proc-vehicle-foshan-hydrogen": [
    { title: "Wikimedia Commons: Huaian Trams Line 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Huaian_Trams_Line_1.jpg" },
  ],
  "proc-vehicle-freightliner-cascadia": [
    { title: "Wikipedia: Freightliner Cascadia", url: "https://en.wikipedia.org/wiki/Freightliner_Cascadia" },
    { title: "Wikimedia Commons: Walmart Freightliner Cascadia truck - Bainbridge, GA 2026.jpg", url: "https://commons.wikimedia.org/wiki/File:Walmart_Freightliner_Cascadia_truck_-_Bainbridge,_GA_2026.jpg" },
  ],
  "proc-vehicle-fuso-aero-queen": [
    { title: "Wikipedia: Mitsubishi Fuso Aero Bus", url: "https://en.wikipedia.org/wiki/Mitsubishi_Fuso_Aero_Bus" },
    { title: "Wikimedia Commons: H674-06401-Tohoku-PJ-MS86JP.jpg", url: "https://commons.wikimedia.org/wiki/File:H674-06401-Tohoku-PJ-MS86JP.jpg" },
    { title: "Wikimedia Commons: KC-MS822P-Izuhakone-2581.jpg", url: "https://commons.wikimedia.org/wiki/File:KC-MS822P-Izuhakone-2581.jpg" },
  ],
  "proc-vehicle-fuso-canter": [
    { title: "Wikipedia: Mitsubishi Fuso Canter", url: "https://en.wikipedia.org/wiki/Mitsubishi_Fuso_Canter" },
    { title: "Wikimedia Commons: 1976 Mitsubishi Canter (6914979489).jpg", url: "https://commons.wikimedia.org/wiki/File:1976_Mitsubishi_Canter_(6914979489).jpg" },
  ],
  "proc-vehicle-fuso-super-great": [
    { title: "Wikipedia: Mitsubishi Fuso Super Great", url: "https://en.wikipedia.org/wiki/Mitsubishi_Fuso_Super_Great" },
    { title: "Wikimedia Commons: JAL Royal Catering 25 Super Great catering truck.jpg", url: "https://commons.wikimedia.org/wiki/File:JAL_Royal_Catering_25_Super_Great_catering_truck.jpg" },
  ],
  "proc-vehicle-ganz-csmg": [
    { title: "Wikipedia: Ganz CSMG", url: "https://en.wikipedia.org/wiki/Ganz_CSMG" },
    { title: "Wikimedia Commons: 14-05-06-Tram-Budapest-Keleti-p\u00e1lyaudvar-RalfR.jpg", url: "https://commons.wikimedia.org/wiki/File:14-05-06-Tram-Budapest-Keleti-p%C3%A1lyaudvar-RalfR.jpg" },
  ],
  "proc-vehicle-gaz-51": [
    { title: "Wikipedia: GAZ-51", url: "https://en.wikipedia.org/wiki/GAZ-51" },
    { title: "Wikimedia Commons: GAZ-51A (7663537188).jpg", url: "https://commons.wikimedia.org/wiki/File:GAZ-51A_(7663537188).jpg" },
  ],
  "proc-vehicle-gaz-66": [
    { title: "Wikipedia: GAZ-66", url: "https://en.wikipedia.org/wiki/GAZ-66" },
    { title: "Wikimedia Commons: A GAZ-66 truck at Tambov Airshow 2007.jpg", url: "https://commons.wikimedia.org/wiki/File:A_GAZ-66_truck_at_Tambov_Airshow_2007.jpg" },
  ],
  "proc-vehicle-gillig-low-floor": [
    { title: "Wikipedia: Gillig Low Floor", url: "https://en.wikipedia.org/wiki/Gillig_Low_Floor" },
    { title: "Wikimedia Commons: SamTrans 2959, Gillig Low Floor at San Mateo County Fair.jpg", url: "https://commons.wikimedia.org/wiki/File:SamTrans_2959,_Gillig_Low_Floor_at_San_Mateo_County_Fair.jpg" },
    { title: "Wikimedia Commons: DDOT Gillig Low Floor 1218 (ret.) near Rosa Parks TC, Route 9.jpg", url: "https://commons.wikimedia.org/wiki/File:DDOT_Gillig_Low_Floor_1218_(ret.)_near_Rosa_Parks_TC,_Route_9.jpg" },
  ],
  "proc-vehicle-glenelg-h-class": [
    { title: "Wikipedia: H type Adelaide tram", url: "https://en.wikipedia.org/wiki/H_type_Adelaide_tram" },
    { title: "Wikimedia Commons: Adelaide tram 360.jpg", url: "https://commons.wikimedia.org/wiki/File:Adelaide_tram_360.jpg" },
  ],
  "proc-vehicle-gm-new-look": [
    { title: "Wikipedia: GM New Look bus", url: "https://en.wikipedia.org/wiki/GM_New_Look_bus" },
    { title: "Wikimedia Commons: SPEED - Santa Monica Intercity Bus Lines 2525 GM New Look Bus at Tokyo Comic con 2024 (forward-right).jpg", url: "https://commons.wikimedia.org/wiki/File:SPEED_-_Santa_Monica_Intercity_Bus_Lines_2525_GM_New_Look_Bus_at_Tokyo_Comic_con_2024_(forward-right).jpg" },
    { title: "Wikimedia Commons: TTC T6H 5307N Bus 2284.jpg", url: "https://commons.wikimedia.org/wiki/File:TTC_T6H_5307N_Bus_2284.jpg" },
  ],
  "proc-vehicle-gm-scenicruiser": [
    { title: "Wikipedia: PD-4501 Scenicruiser", url: "https://en.wikipedia.org/wiki/PD-4501_Scenicruiser" },
    { title: "Wikimedia Commons: Postcard Greyhound Scenicruiser (6186606307).jpg", url: "https://commons.wikimedia.org/wiki/File:Postcard_Greyhound_Scenicruiser_(6186606307).jpg" },
  ],
  "proc-vehicle-gmunden-vario": [
    { title: "Wikimedia Commons: Gmunden Schloss Weyer Haltestelle.jpg", url: "https://commons.wikimedia.org/wiki/File:Gmunden_Schloss_Weyer_Haltestelle.jpg" },
  ],
  "proc-vehicle-gotha-t2-62": [
    { title: "Wikimedia Commons: Strassenbahn Betrieb, Dessau, Linie 1,with Gotha T2-62 Triebwagen nr 38, Dessau Sued, DDR, May 1990.jpg", url: "https://commons.wikimedia.org/wiki/File:Strassenbahn_Betrieb,_Dessau,_Linie_1,with_Gotha_T2-62_Triebwagen_nr_38,_Dessau_Sued,_DDR,_May_1990.jpg" },
  ],
  "proc-vehicle-gothenburg-m29": [
    { title: "Wikimedia Commons: M29 829, Korsv\u00e4gen, augusti 2012.jpg", url: "https://commons.wikimedia.org/wiki/File:M29_829,_Korsv%C3%A4gen,_augusti_2012.jpg" },
  ],
  "proc-vehicle-gulfstream-g650": [
    { title: "Wikipedia: Gulfstream G650/G700/G800", url: "https://en.wikipedia.org/wiki/Gulfstream_G650%2FG700%2FG800" },
    { title: "Wikimedia Commons: EBACE 2023, Le Grand-Saconnex (EB237513).jpg", url: "https://commons.wikimedia.org/wiki/File:EBACE_2023,_Le_Grand-Saconnex_(EB237513).jpg" },
  ],
  "proc-vehicle-hague-gtl8": [
    { title: "Wikimedia Commons: HTM GTL 3121.JPG", url: "https://commons.wikimedia.org/wiki/File:HTM_GTL_3121.JPG" },
  ],
  "proc-vehicle-havana-camello": [
    { title: "Wikimedia Commons: Autobus de TUSSAM en La Habana.jpg", url: "https://commons.wikimedia.org/wiki/File:Autobus_de_TUSSAM_en_La_Habana.jpg" },
    { title: "Wikimedia Commons: Autobushabana.jpg", url: "https://commons.wikimedia.org/wiki/File:Autobushabana.jpg" },
  ],
  "proc-vehicle-helsinki-artic": [
    { title: "Wikipedia: \u0160koda Artic", url: "https://en.wikipedia.org/wiki/%C5%A0koda_Artic" },
    { title: "Wikimedia Commons: 40T 385 Plze\u0148.jpg", url: "https://commons.wikimedia.org/wiki/File:40T_385_Plze%C5%88.jpg" },
    { title: "Wikimedia Commons: Artic (tram) in Helsinki.jpg", url: "https://commons.wikimedia.org/wiki/File:Artic_(tram)_in_Helsinki.jpg" },
  ],
  "proc-vehicle-helsinki-valmet": [
    { title: "Wikipedia: Valmet Nr I", url: "https://en.wikipedia.org/wiki/Valmet_Nr_I" },
    { title: "Wikimedia Commons: Valmet Nr I Helsinki 125908.jpg", url: "https://commons.wikimedia.org/wiki/File:Valmet_Nr_I_Helsinki_125908.jpg" },
  ],
  "proc-vehicle-hess-lightram": [
    { title: "Wikipedia: Carrosserie Hess", url: "https://en.wikipedia.org/wiki/Carrosserie_Hess" },
    { title: "Wikimedia Commons: Bucharest HESS bus 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Bucharest_HESS_bus_1.jpg" },
  ],
  "proc-vehicle-heuliez-gx337": [
    { title: "Wikimedia Commons: GX337BHNS-PalmExpress1.JPG", url: "https://commons.wikimedia.org/wiki/File:GX337BHNS-PalmExpress1.JPG" },
    { title: "Wikimedia Commons: Heuliez Bus GX 337 ELEC - RATP Bus 92.jpg", url: "https://commons.wikimedia.org/wiki/File:Heuliez_Bus_GX_337_ELEC_-_RATP_Bus_92.jpg" },
  ],
  "proc-vehicle-hino-300": [
    { title: "Wikimedia Commons: Dutro110SDMicrobusCA.jpg", url: "https://commons.wikimedia.org/wiki/File:Dutro110SDMicrobusCA.jpg" },
  ],
  "proc-vehicle-hino-blue-ribbon": [
    { title: "Wikipedia: Hino Blue Ribbon", url: "https://en.wikipedia.org/wiki/Hino_Blue_Ribbon" },
    { title: "Wikimedia Commons: Entetsu bus 173 HINO Blue Ribbon City(KL-HU2PPEE).jpg", url: "https://commons.wikimedia.org/wiki/File:Entetsu_bus_173_HINO_Blue_Ribbon_City(KL-HU2PPEE).jpg" },
    { title: "Wikimedia Commons: Entetsu bus 88 HINO Blue Ribbon HU(KC-HU2PPCE).jpg", url: "https://commons.wikimedia.org/wiki/File:Entetsu_bus_88_HINO_Blue_Ribbon_HU(KC-HU2PPCE).jpg" },
  ],
  "proc-vehicle-hino-profia": [
    { title: "Wikipedia: Hino Profia", url: "https://en.wikipedia.org/wiki/Hino_Profia" },
    { title: "Wikimedia Commons: Profia-dump.jpg", url: "https://commons.wikimedia.org/wiki/File:Profia-dump.jpg" },
  ],
  "proc-vehicle-hiroshima-green-mover": [
    { title: "Wikimedia Commons: Hiroden-5100-2.jpg", url: "https://commons.wikimedia.org/wiki/File:Hiroden-5100-2.jpg" },
  ],
  "proc-vehicle-hondajet": [
    { title: "Wikipedia: Honda HA-420 HondaJet", url: "https://en.wikipedia.org/wiki/Honda_HA-420_HondaJet" },
    { title: "Wikimedia Commons: AERO Friedrichshafen 2018, Friedrichshafen (1X7A4376).jpg", url: "https://commons.wikimedia.org/wiki/File:AERO_Friedrichshafen_2018,_Friedrichshafen_(1X7A4376).jpg" },
  ],
  "proc-vehicle-hong-kong-tram": [
    { title: "Wikipedia: Hong Kong Tramways", url: "https://en.wikipedia.org/wiki/Hong_Kong_Tramways" },
    { title: "Wikimedia Commons: 13-08-09-hongkong-by-RalfR-026.jpg", url: "https://commons.wikimedia.org/wiki/File:13-08-09-hongkong-by-RalfR-026.jpg" },
  ],
  "proc-vehicle-animal-tram-double-deck": [
    { title: "Wikipedia: Horsecar", url: "https://en.wikipedia.org/wiki/Horsecar" },
    { title: "Wikimedia Commons: 20040610 Victor Harbor Tramway.jpg", url: "https://commons.wikimedia.org/wiki/File:20040610_Victor_Harbor_Tramway.jpg" },
  ],
  "proc-vehicle-hs-trident": [
    { title: "Wikipedia: Hawker Siddeley Trident", url: "https://en.wikipedia.org/wiki/Hawker_Siddeley_Trident" },
    { title: "Wikimedia Commons: British Airways Trident3B (7107744185).jpg", url: "https://commons.wikimedia.org/wiki/File:British_Airways_Trident3B_(7107744185).jpg" },
    { title: "Wikimedia Commons: British Airways Trident G-AWZV.jpg", url: "https://commons.wikimedia.org/wiki/File:British_Airways_Trident_G-AWZV.jpg" },
  ],
  "proc-vehicle-hyundai-elec-city": [
    { title: "Wikipedia: Hyundai Elec City", url: "https://en.wikipedia.org/wiki/Hyundai_Elec_City" },
    { title: "Wikimedia Commons: ElecCity RBus 5006 2039.jpg", url: "https://commons.wikimedia.org/wiki/File:ElecCity_RBus_5006_2039.jpg" },
    { title: "Wikimedia Commons: SCTC B0 ElecCity Articulated bus.jpg", url: "https://commons.wikimedia.org/wiki/File:SCTC_B0_ElecCity_Articulated_bus.jpg" },
  ],
  "proc-vehicle-hyundai-universe": [
    { title: "Wikipedia: Hyundai Universe", url: "https://en.wikipedia.org/wiki/Hyundai_Universe" },
    { title: "Wikimedia Commons: Hyundai Universe Space Luxury Front Side.jpg", url: "https://commons.wikimedia.org/wiki/File:Hyundai_Universe_Space_Luxury_Front_Side.jpg" },
    { title: "Wikimedia Commons: Gimpo Bus 3000 - Universe 2019 rear.jpg", url: "https://commons.wikimedia.org/wiki/File:Gimpo_Bus_3000_-_Universe_2019_rear.jpg" },
  ],
  "proc-vehicle-hyundai-xcient": [
    { title: "Wikipedia: Hyundai Xcient", url: "https://en.wikipedia.org/wiki/Hyundai_Xcient" },
    { title: "Wikimedia Commons: Hyundai Xcient 6x2 tractor. Spielvogel.jpg", url: "https://commons.wikimedia.org/wiki/File:Hyundai_Xcient_6x2_tractor._Spielvogel.jpg" },
  ],
  "proc-vehicle-ikarus-260": [
    { title: "Wikipedia: Ikarus 260", url: "https://en.wikipedia.org/wiki/Ikarus_260" },
    { title: "Wikimedia Commons: Ikarus 260 (FKB-536), Tisza Vol\u00e1n, Mak\u00f3 03.jpg", url: "https://commons.wikimedia.org/wiki/File:Ikarus_260_(FKB-536),_Tisza_Vol%C3%A1n,_Mak%C3%B3_03.jpg" },
    { title: "Wikimedia Commons: MVK Ikarus 260.JPG", url: "https://commons.wikimedia.org/wiki/File:MVK_Ikarus_260.JPG" },
  ],
  "proc-vehicle-ikarus-280": [
    { title: "Wikipedia: Ikarus 280", url: "https://en.wikipedia.org/wiki/Ikarus_280" },
    { title: "Wikimedia Commons: Muzeum MHD, Ikarus 280.jpg", url: "https://commons.wikimedia.org/wiki/File:Muzeum_MHD,_Ikarus_280.jpg" },
  ],
  "proc-vehicle-ikarus-55": [
    { title: "Wikipedia: Ikarus 55", url: "https://en.wikipedia.org/wiki/Ikarus_55" },
    { title: "Wikimedia Commons: Ikarus 55, 1971 (6980101314).jpg", url: "https://commons.wikimedia.org/wiki/File:Ikarus_55,_1971_(6980101314).jpg" },
    { title: "Wikimedia Commons: Ikarus 55.JPG", url: "https://commons.wikimedia.org/wiki/File:Ikarus_55.JPG" },
  ],
  "proc-vehicle-ilyushin-il18": [
    { title: "Wikipedia: Ilyushin Il-18", url: "https://en.wikipedia.org/wiki/Ilyushin_Il-18" },
    { title: "Wikimedia Commons: Hans-Grade-Museum 03.jpg", url: "https://commons.wikimedia.org/wiki/File:Hans-Grade-Museum_03.jpg" },
  ],
  "proc-vehicle-ilyushin-il62": [
    { title: "Wikipedia: Ilyushin Il-62", url: "https://en.wikipedia.org/wiki/Ilyushin_Il-62" },
    { title: "Wikimedia Commons: 2013-01-06 Il-62 at Ukraine State Aviation Museum.jpg", url: "https://commons.wikimedia.org/wiki/File:2013-01-06_Il-62_at_Ukraine_State_Aviation_Museum.jpg" },
    { title: "Wikimedia Commons: Air-to-air with a Russian Air Force Ilyushin Il-62M (retouched).jpg", url: "https://commons.wikimedia.org/wiki/File:Air-to-air_with_a_Russian_Air_Force_Ilyushin_Il-62M_(retouched).jpg" },
  ],
  "proc-vehicle-ilyushin-il86": [
    { title: "Wikipedia: Ilyushin Il-86", url: "https://en.wikipedia.org/wiki/Ilyushin_Il-86" },
    { title: "Wikimedia Commons: Airborne command and control aircraft IL-86VKP (2).jpg", url: "https://commons.wikimedia.org/wiki/File:Airborne_command_and_control_aircraft_IL-86VKP_(2).jpg" },
  ],
  "proc-vehicle-ilyushin-il96": [
    { title: "Wikipedia: Ilyushin Il-96", url: "https://en.wikipedia.org/wiki/Ilyushin_Il-96" },
    { title: "Wikimedia Commons: Aeroflot Ilyushin Il-96-300 Petrov.jpg", url: "https://commons.wikimedia.org/wiki/File:Aeroflot_Ilyushin_Il-96-300_Petrov.jpg" },
    { title: "Wikimedia Commons: CU-T1250@PEK (20181107114529).jpg", url: "https://commons.wikimedia.org/wiki/File:CU-T1250@PEK_(20181107114529).jpg" },
  ],
  "proc-vehicle-international-acco": [
    { title: "Wikimedia Commons: 1973 International ACCO Truck (17118626952).jpg", url: "https://commons.wikimedia.org/wiki/File:1973_International_ACCO_Truck_(17118626952).jpg" },
  ],
  "proc-vehicle-international-transtar": [
    { title: "Wikimedia Commons: International cabover (19546477232).jpg", url: "https://commons.wikimedia.org/wiki/File:International_cabover_(19546477232).jpg" },
  ],
  "proc-vehicle-irisbus-citelis": [
    { title: "Wikipedia: Irisbus Citelis", url: "https://en.wikipedia.org/wiki/Irisbus_Citelis" },
    { title: "Wikimedia Commons: VER Ennepetal Irisbus Citelis 100 8033.jpg", url: "https://commons.wikimedia.org/wiki/File:VER_Ennepetal_Irisbus_Citelis_100_8033.jpg" },
  ],
  "proc-vehicle-irizar-i8": [
    { title: "Wikimedia Commons: Irizar i4.jpg", url: "https://commons.wikimedia.org/wiki/File:Irizar_i4.jpg" },
  ],
  "proc-vehicle-istanbul-nostalgic": [
    { title: "Wikipedia: Istanbul nostalgic tramways", url: "https://en.wikipedia.org/wiki/Istanbul_nostalgic_tramways" },
    { title: "Wikimedia Commons: New battery powered Taksim Nostalgic Tram and Taksim Tram stop 02.jpg", url: "https://commons.wikimedia.org/wiki/File:New_battery_powered_Taksim_Nostalgic_Tram_and_Taksim_Tram_stop_02.jpg" },
  ],
  "proc-vehicle-isuzu-elf": [
    { title: "Wikipedia: Isuzu Elf", url: "https://en.wikipedia.org/wiki/Isuzu_Elf" },
    { title: "Wikimedia Commons: 1stElf.jpg", url: "https://commons.wikimedia.org/wiki/File:1stElf.jpg" },
  ],
  "proc-vehicle-isuzu-erga": [
    { title: "Wikipedia: Isuzu Erga", url: "https://en.wikipedia.org/wiki/Isuzu_Erga" },
    { title: "Wikimedia Commons: ERGAEV 202511.jpg", url: "https://commons.wikimedia.org/wiki/File:ERGAEV_202511.jpg" },
    { title: "Wikimedia Commons: Entetsu bus 175 ISUZU ERGA type-B(KL-LV834N1).jpg", url: "https://commons.wikimedia.org/wiki/File:Entetsu_bus_175_ISUZU_ERGA_type-B(KL-LV834N1).jpg" },
  ],
  "proc-vehicle-isuzu-giga": [
    { title: "Wikipedia: Isuzu Giga", url: "https://en.wikipedia.org/wiki/Isuzu_Giga" },
    { title: "Wikimedia Commons: 2025 Isuzu Giga GVW25.jpg", url: "https://commons.wikimedia.org/wiki/File:2025_Isuzu_Giga_GVW25.jpg" },
  ],
  "proc-vehicle-iveco-crossway": [
    { title: "Wikipedia: Irisbus Crossway", url: "https://en.wikipedia.org/wiki/Irisbus_Crossway" },
    { title: "Wikimedia Commons: Irisbus Crossway Penn-ar-Bed \u00e0 Morlaix.JPG", url: "https://commons.wikimedia.org/wiki/File:Irisbus_Crossway_Penn-ar-Bed_%C3%A0_Morlaix.JPG" },
  ],
  "proc-vehicle-iveco-daily": [
    { title: "Wikipedia: Iveco Daily", url: "https://en.wikipedia.org/wiki/Iveco_Daily" },
    { title: "Wikimedia Commons: 2014 Iveco Daily 35 S13 MWB 2.3.jpg", url: "https://commons.wikimedia.org/wiki/File:2014_Iveco_Daily_35_S13_MWB_2.3.jpg" },
  ],
  "proc-vehicle-iveco-s-way": [
    { title: "Wikipedia: Iveco S-Way", url: "https://en.wikipedia.org/wiki/Iveco_S-Way" },
    { title: "Wikimedia Commons: 2019 Iveco S-Way in Madrid.jpg", url: "https://commons.wikimedia.org/wiki/File:2019_Iveco_S-Way_in_Madrid.jpg" },
  ],
  "proc-vehicle-iveco-turbostar": [
    { title: "Wikimedia Commons: Iveco TurboStar 190-38 1994 (9630433709).jpg", url: "https://commons.wikimedia.org/wiki/File:Iveco_TurboStar_190-38_1994_(9630433709).jpg" },
  ],
  "proc-vehicle-jeepney": [
    { title: "Wikipedia: Jeepney", url: "https://en.wikipedia.org/wiki/Jeepney" },
    { title: "Wikimedia Commons: 202403 A jeepney in Makati, Manila.jpg", url: "https://commons.wikimedia.org/wiki/File:202403_A_jeepney_in_Makati,_Manila.jpg" },
    { title: "Wikimedia Commons: Fairview Cubao Jeepney (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Fairview_Cubao_Jeepney_(cropped).jpg" },
  ],
  "proc-vehicle-jelcz-043": [
    { title: "Wikipedia: Jelcz", url: "https://en.wikipedia.org/wiki/Jelcz" },
    { title: "Wikimedia Commons: Jelcz 043 and P01 Pozna\u0144 RB1.JPG", url: "https://commons.wikimedia.org/wiki/File:Jelcz_043_and_P01_Pozna%C5%84_RB1.JPG" },
  ],
  "proc-vehicle-jingle-bus": [
    { title: "Wikipedia: Truck art in South Asia", url: "https://en.wikipedia.org/wiki/Truck_art_in_South_Asia" },
    { title: "Wikimedia Commons: London - Pakistani decorated bus.jpg", url: "https://commons.wikimedia.org/wiki/File:London_-_Pakistani_decorated_bus.jpg" },
  ],
  "proc-vehicle-junkers-ju52": [
    { title: "Wikipedia: Junkers Ju 52", url: "https://en.wikipedia.org/wiki/Junkers_Ju_52" },
    { title: "Wikimedia Commons: AAC.1 F-BBYB STA Ringway 1948 edited-2.jpg", url: "https://commons.wikimedia.org/wiki/File:AAC.1_F-BBYB_STA_Ringway_1948_edited-2.jpg" },
  ],
  "proc-vehicle-kamaz-5320": [
    { title: "Wikimedia Commons: \u0413\u0443\u043b\u044c\u0434\u0430\u043b\u0430, \u0430\u0441\u0441\u0435\u043d\u0438\u0437\u0430\u0442\u043e\u0440 \u041a\u0430\u043c\u0410\u0417-5320.jpg", url: "https://commons.wikimedia.org/wiki/File:%D0%93%D1%83%D0%BB%D1%8C%D0%B4%D0%B0%D0%BB%D0%B0,_%D0%B0%D1%81%D1%81%D0%B5%D0%BD%D0%B8%D0%B7%D0%B0%D1%82%D0%BE%D1%80_%D0%9A%D0%B0%D0%BC%D0%90%D0%97-5320.jpg" },
  ],
  "proc-vehicle-kamaz-54901": [
    { title: "Wikimedia Commons: \u041a\u0410\u041c\u0410\u0417-54901.jpg", url: "https://commons.wikimedia.org/wiki/File:%D0%9A%D0%90%D0%9C%D0%90%D0%97-54901.jpg" },
  ],
  "proc-vehicle-karosa-sm11": [
    { title: "Wikipedia: Karosa \u0160M 11", url: "https://en.wikipedia.org/wiki/Karosa_%C5%A0M_11" },
    { title: "Wikimedia Commons: Bus \u0160M11 Brno(1).jpg", url: "https://commons.wikimedia.org/wiki/File:Bus_%C5%A0M11_Brno(1).jpg" },
  ],
  "proc-vehicle-kei-truck": [
    { title: "Wikimedia Commons: Suzuki Carry 405.JPG", url: "https://commons.wikimedia.org/wiki/File:Suzuki_Carry_405.JPG" },
  ],
  "proc-vehicle-kenworth-c500-log": [
    { title: "Wikimedia Commons: B double logging truck in Australia.jpg", url: "https://commons.wikimedia.org/wiki/File:B_double_logging_truck_in_Australia.jpg" },
  ],
  "proc-vehicle-kenworth-k100": [
    { title: "Wikimedia Commons: Kenworth K100 1973 at Legendy 2019 in Prague.jpg", url: "https://commons.wikimedia.org/wiki/File:Kenworth_K100_1973_at_Legendy_2019_in_Prague.jpg" },
  ],
  "proc-vehicle-kenworth-t680": [
    { title: "Wikimedia Commons: Kenworth T680 in Hesperia, white.JPG", url: "https://commons.wikimedia.org/wiki/File:Kenworth_T680_in_Hesperia,_white.JPG" },
  ],
  "proc-vehicle-kenworth-t909-road-train": [
    { title: "Wikimedia Commons: 00 4591 Road train - Great Northern Highway (Western Australia).jpg", url: "https://commons.wikimedia.org/wiki/File:00_4591_Road_train_-_Great_Northern_Highway_(Western_Australia).jpg" },
  ],
  "proc-vehicle-kenworth-w900": [
    { title: "Wikipedia: Kenworth W900", url: "https://en.wikipedia.org/wiki/Kenworth_W900" },
    { title: "Wikimedia Commons: Haycock Petroleum Kenworth W900L tanker (2).jpg", url: "https://commons.wikimedia.org/wiki/File:Haycock_Petroleum_Kenworth_W900L_tanker_(2).jpg" },
  ],
  "proc-vehicle-king-long-coach": [
    { title: "Wikipedia: King Long", url: "https://en.wikipedia.org/wiki/King_Long" },
    { title: "Wikimedia Commons: King Long KLQ 6118GQ bus in Damascus.JPG", url: "https://commons.wikimedia.org/wiki/File:King_Long_KLQ_6118GQ_bus_in_Damascus.JPG" },
  ],
  "proc-vehicle-kinki-sharyo-lrv": [
    { title: "Wikipedia: Kinki Sharyo", url: "https://en.wikipedia.org/wiki/Kinki_Sharyo" },
    { title: "Wikimedia Commons: Phoenix Kinki Sharyo LRV Cab.jpg", url: "https://commons.wikimedia.org/wiki/File:Phoenix_Kinki_Sharyo_LRV_Cab.jpg" },
  ],
  "proc-vehicle-kolkata-tram": [
    { title: "Wikipedia: Trams in Kolkata", url: "https://en.wikipedia.org/wiki/Trams_in_Kolkata" },
    { title: "Wikimedia Commons: A tram in Calcutta - LIFE.jpg", url: "https://commons.wikimedia.org/wiki/File:A_tram_in_Calcutta_-_LIFE.jpg" },
  ],
  "proc-vehicle-koncar-tmk2200": [
    { title: "Wikipedia: TMK 2200", url: "https://en.wikipedia.org/wiki/TMK_2200" },
    { title: "Wikimedia Commons: Zg tram1-2.jpg", url: "https://commons.wikimedia.org/wiki/File:Zg_tram1-2.jpg" },
  ],
  "proc-vehicle-konstal-105n": [
    { title: "Wikipedia: Konstal 105N", url: "https://en.wikipedia.org/wiki/Konstal_105N" },
    { title: "Wikimedia Commons: 105N Gda\u0144sk.jpg", url: "https://commons.wikimedia.org/wiki/File:105N_Gda%C5%84sk.jpg" },
    { title: "Wikimedia Commons: Konstal 105N Pozna\u0144 RB2.JPG", url: "https://commons.wikimedia.org/wiki/File:Konstal_105N_Pozna%C5%84_RB2.JPG" },
  ],
  "proc-vehicle-kraz-255": [
    { title: "Wikipedia: KrAZ-255", url: "https://en.wikipedia.org/wiki/KrAZ-255" },
    { title: "Wikimedia Commons: Finnish Artillery Museum 009 - KrAZ-255 PMP (26792351279).jpg", url: "https://commons.wikimedia.org/wiki/File:Finnish_Artillery_Museum_009_-_KrAZ-255_PMP_(26792351279).jpg" },
  ],
  "proc-vehicle-ktm-5": [
    { title: "Wikipedia: KTM-5", url: "https://en.wikipedia.org/wiki/KTM-5" },
    { title: "Wikimedia Commons: Tram 71-605 in Yaroslavl 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Tram_71-605_in_Yaroslavl_01.jpg" },
  ],
  "proc-vehicle-kyiv-12": [
    { title: "Wikimedia Commons: \u041a\u0438\u0457\u0432-12.jpg", url: "https://commons.wikimedia.org/wiki/File:%D0%9A%D0%B8%D1%97%D0%B2-12.jpg" },
  ],
  "proc-vehicle-laz-695": [
    { title: "Wikipedia: LAZ-695", url: "https://en.wikipedia.org/wiki/LAZ-695" },
    { title: "Wikimedia Commons: Bus LAZ-695M cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:Bus_LAZ-695M_cropped.jpg" },
    { title: "Wikimedia Commons: LAZ-695N in Chkalovsk.jpg", url: "https://commons.wikimedia.org/wiki/File:LAZ-695N_in_Chkalovsk.jpg" },
  ],
  "proc-vehicle-learjet-35": [
    { title: "Wikipedia: Learjet 35", url: "https://en.wikipedia.org/wiki/Learjet_35" },
    { title: "Wikimedia Commons: LJ-3 LJ35 FinAirForce (6777135457).jpg", url: "https://commons.wikimedia.org/wiki/File:LJ-3_LJ35_FinAirForce_(6777135457).jpg" },
  ],
  "proc-vehicle-let-l410": [
    { title: "Wikipedia: Let L-410 Turbolet", url: "https://en.wikipedia.org/wiki/Let_L-410_Turbolet" },
    { title: "Wikimedia Commons: Green Bird (F-OIXG) (9718636097).jpg", url: "https://commons.wikimedia.org/wiki/File:Green_Bird_(F-OIXG)_(9718636097).jpg" },
  ],
  "proc-vehicle-leyland-atlantean": [
    { title: "Wikipedia: Leyland Atlantean", url: "https://en.wikipedia.org/wiki/Leyland_Atlantean" },
    { title: "Wikimedia Commons: 1016 Leyland PDR1A-1 Atlantean in Junee.jpg", url: "https://commons.wikimedia.org/wiki/File:1016_Leyland_PDR1A-1_Atlantean_in_Junee.jpg" },
    { title: "Wikimedia Commons: Delaine Atlantean 2.jpg", url: "https://commons.wikimedia.org/wiki/File:Delaine_Atlantean_2.jpg" },
  ],
  "proc-vehicle-leyland-national": [
    { title: "Wikipedia: Leyland National", url: "https://en.wikipedia.org/wiki/Leyland_National" },
    { title: "Wikimedia Commons: Hague Bus Museum bus, 1975 Leyland National (27-69-GB), Westnederland 3114, Showbus UK 2002.jpg", url: "https://commons.wikimedia.org/wiki/File:Hague_Bus_Museum_bus,_1975_Leyland_National_(27-69-GB),_Westnederland_3114,_Showbus_UK_2002.jpg" },
    { title: "Wikimedia Commons: Greater Manchester PTE Leyland National at Whitehaven Harbour (geograph 7167138).jpg", url: "https://commons.wikimedia.org/wiki/File:Greater_Manchester_PTE_Leyland_National_at_Whitehaven_Harbour_(geograph_7167138).jpg" },
  ],
  "proc-vehicle-liaz-100": [
    { title: "Wikimedia Commons: LIAZ 110 valn\u00edk Lib\u0161t\u00e1t - 8403.JPG", url: "https://commons.wikimedia.org/wiki/File:LIAZ_110_valn%C3%ADk_Lib%C5%A1t%C3%A1t_-_8403.JPG" },
  ],
  "proc-vehicle-liaz-5292": [
    { title: "Wikipedia: LiAZ-5292", url: "https://en.wikipedia.org/wiki/LiAZ-5292" },
    { title: "Wikimedia Commons: LiAZ-5292.21 17449.jpg", url: "https://commons.wikimedia.org/wiki/File:LiAZ-5292.21_17449.jpg" },
    { title: "Wikimedia Commons: LiAZ-5292 in Moscow 2.jpg", url: "https://commons.wikimedia.org/wiki/File:LiAZ-5292_in_Moscow_2.jpg" },
  ],
  "proc-vehicle-liaz-677": [
    { title: "Wikipedia: LiAZ-677", url: "https://en.wikipedia.org/wiki/LiAZ-677" },
    { title: "Wikimedia Commons: Gagarinsky District bus \u0412677\u041d\u0422750 2023-02 Kosygina Street LiAZ-677M 220.jpg", url: "https://commons.wikimedia.org/wiki/File:Gagarinsky_District_bus_%D0%92677%D0%9D%D0%A2750_2023-02_Kosygina_Street_LiAZ-677M_220.jpg" },
    { title: "Wikimedia Commons: \u041b\u0438\u0410\u0417 677.jpg", url: "https://commons.wikimedia.org/wiki/File:%D0%9B%D0%B8%D0%90%D0%97_677.jpg" },
  ],
  "proc-vehicle-liebherr-ltm": [
    { title: "Wikimedia Commons: Liebherr LTM 1100-5.1.jpg", url: "https://commons.wikimedia.org/wiki/File:Liebherr_LTM_1100-5.1.jpg" },
  ],
  "proc-vehicle-lisbon-remodelado": [
    { title: "Wikipedia: Trams in Lisbon", url: "https://en.wikipedia.org/wiki/Trams_in_Lisbon" },
    { title: "Wikimedia Commons: El\u00e9trico de Lisboa (120FAITH 3364) (37354870041).jpg", url: "https://commons.wikimedia.org/wiki/File:El%C3%A9trico_de_Lisboa_(120FAITH_3364)_(37354870041).jpg" },
  ],
  "proc-vehicle-lm-68": [
    { title: "Wikipedia: LM-68M", url: "https://en.wikipedia.org/wiki/LM-68M" },
    { title: "Wikimedia Commons: Saint Petersburg tram 6249 2012-09 1348918600 Trinity Bridge LM-68.JPG", url: "https://commons.wikimedia.org/wiki/File:Saint_Petersburg_tram_6249_2012-09_1348918600_Trinity_Bridge_LM-68.JPG" },
  ],
  "proc-vehicle-lockheed-constellation": [
    { title: "Wikipedia: Lockheed L-1049 Super Constellation", url: "https://en.wikipedia.org/wiki/Lockheed_L-1049_Super_Constellation" },
    { title: "Wikimedia Commons: Air India L-1049G Super Constellation at Prague Airport.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_India_L-1049G_Super_Constellation_at_Prague_Airport.jpg" },
  ],
  "proc-vehicle-lockheed-electra": [
    { title: "Wikipedia: Lockheed L-188 Electra", url: "https://en.wikipedia.org/wiki/Lockheed_L-188_Electra" },
    { title: "Wikimedia Commons: Atlantic.airlines.electra.g-lofd.arp.jpg", url: "https://commons.wikimedia.org/wiki/File:Atlantic.airlines.electra.g-lofd.arp.jpg" },
  ],
  "proc-vehicle-lockheed-l100": [
    { title: "Wikipedia: Lockheed L-100 Hercules", url: "https://en.wikipedia.org/wiki/Lockheed_L-100_Hercules" },
    { title: "Wikimedia Commons: Air Botswana Cargo Lockheed L-100-30 Hercules (L-382G) Marmet.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Botswana_Cargo_Lockheed_L-100-30_Hercules_(L-382G)_Marmet.jpg" },
  ],
  "proc-vehicle-lockheed-tristar": [
    { title: "Wikipedia: Lockheed L-1011 TriStar", url: "https://en.wikipedia.org/wiki/Lockheed_L-1011_TriStar" },
    { title: "Wikimedia Commons: Air Canada Lockheed L-1011 TriStar CF-TNF 03.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Canada_Lockheed_L-1011_TriStar_CF-TNF_03.jpg" },
    { title: "Wikimedia Commons: Air India Lockheed L-1011-500 TriStar at Lisbon Airport.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_India_Lockheed_L-1011-500_TriStar_at_Lisbon_Airport.jpg" },
  ],
  "proc-vehicle-lohr-car-transporter": [
    { title: "Wikimedia Commons: Chinese car transporter.jpg", url: "https://commons.wikimedia.org/wiki/File:Chinese_car_transporter.jpg" },
  ],
  "proc-vehicle-mack-anthem": [
    { title: "Wikipedia: Mack Anthem", url: "https://en.wikipedia.org/wiki/Mack_Anthem" },
    { title: "Wikimedia Commons: 2025 Mack Anthem 6x4 tractor (Stand Up Sleeper) in Lacquer Red, front right.jpg", url: "https://commons.wikimedia.org/wiki/File:2025_Mack_Anthem_6x4_tractor_(Stand_Up_Sleeper)_in_Lacquer_Red,_front_right.jpg" },
  ],
  "proc-vehicle-mack-b61": [
    { title: "Wikimedia Commons: Mack B61, VCV Australia, Brisbane South Branch, 2023, 04.jpg", url: "https://commons.wikimedia.org/wiki/File:Mack_B61,_VCV_Australia,_Brisbane_South_Branch,_2023,_04.jpg" },
  ],
  "proc-vehicle-mack-granite-dump": [
    { title: "Wikimedia Commons: Mack CV 713 Granite 2007 (9193953079) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Mack_CV_713_Granite_2007_(9193953079)_(cropped).jpg" },
  ],
  "proc-vehicle-magirus-ladder": [
    { title: "Wikimedia Commons: DSC06050 DL, Iveco Magirus 160E30, Feuerwehr der Stadt Wien, Front Right, 2023-10.jpg", url: "https://commons.wikimedia.org/wiki/File:DSC06050_DL,_Iveco_Magirus_160E30,_Feuerwehr_der_Stadt_Wien,_Front_Right,_2023-10.jpg" },
  ],
  "proc-vehicle-magirus-saturn": [
    { title: "Wikimedia Commons: Magirus Deutz Muni front.jpg", url: "https://commons.wikimedia.org/wiki/File:Magirus_Deutz_Muni_front.jpg" },
  ],
  "proc-vehicle-man-cla": [
    { title: "Wikipedia: MAN CLA", url: "https://en.wikipedia.org/wiki/MAN_CLA" },
    { title: "Wikimedia Commons: PNP Man CLA 18.300 Police Truck (Original Work).jpg", url: "https://commons.wikimedia.org/wiki/File:PNP_Man_CLA_18.300_Police_Truck_(Original_Work).jpg" },
  ],
  "proc-vehicle-man-f8": [
    { title: "Wikimedia Commons: MAN F8 M\u00f6belwagen.jpg", url: "https://commons.wikimedia.org/wiki/File:MAN_F8_M%C3%B6belwagen.jpg" },
    { title: "Wikimedia Commons: MAN F8 Koffer.jpg", url: "https://commons.wikimedia.org/wiki/File:MAN_F8_Koffer.jpg" },
  ],
  "proc-vehicle-man-lions-city": [
    { title: "Wikipedia: MAN Lion's City", url: "https://en.wikipedia.org/wiki/MAN_Lion's_City" },
    { title: "Wikimedia Commons: SL MAN Lion's City NL253 Hybrid 4842, T-Centralen, 2019 (01).jpg", url: "https://commons.wikimedia.org/wiki/File:SL_MAN_Lion%27s_City_NL253_Hybrid_4842,_T-Centralen,_2019_(01).jpg" },
    { title: "Wikimedia Commons: Bus 547 Stadtwerke Baden-Baden (MAN Lion's City Hybrid).jpg", url: "https://commons.wikimedia.org/wiki/File:Bus_547_Stadtwerke_Baden-Baden_(MAN_Lion%27s_City_Hybrid).jpg" },
  ],
  "proc-vehicle-man-sl200": [
    { title: "Wikipedia: MAN SL200", url: "https://en.wikipedia.org/wiki/MAN_SL200" },
    { title: "Wikimedia Commons: SL200-hannover.jpg", url: "https://commons.wikimedia.org/wiki/File:SL200-hannover.jpg" },
    { title: "Wikimedia Commons: SL200-weihrauch.jpg", url: "https://commons.wikimedia.org/wiki/File:SL200-weihrauch.jpg" },
  ],
  "proc-vehicle-man-tgl": [
    { title: "Wikimedia Commons: Scania G410 & MAN TGL 12.220, RWG Westerstede-Klamperesch (2023).jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_G410_%26_MAN_TGL_12.220,_RWG_Westerstede-Klamperesch_(2023).jpg" },
    { title: "Wikimedia Commons: MAN TGL Lenz Abschleppdienst.jpg", url: "https://commons.wikimedia.org/wiki/File:MAN_TGL_Lenz_Abschleppdienst.jpg" },
  ],
  "proc-vehicle-marcopolo-paradiso-dd": [
    { title: "Wikipedia: Marcopolo Paradiso", url: "https://en.wikipedia.org/wiki/Marcopolo_Paradiso" },
    { title: "Wikimedia Commons: Paradiso G8 1200 da Ande Transportes.jpg", url: "https://commons.wikimedia.org/wiki/File:Paradiso_G8_1200_da_Ande_Transportes.jpg" },
    { title: "Wikimedia Commons: Paradiso G8 da Transportes \u00danica.jpg", url: "https://commons.wikimedia.org/wiki/File:Paradiso_G8_da_Transportes_%C3%9Anica.jpg" },
  ],
  "proc-vehicle-marcopolo-torino": [
    { title: "Wikimedia Commons: Torino14.JPG", url: "https://commons.wikimedia.org/wiki/File:Torino14.JPG" },
    { title: "Wikimedia Commons: Torino99.JPG", url: "https://commons.wikimedia.org/wiki/File:Torino99.JPG" },
  ],
  "proc-vehicle-matatu": [
    { title: "Wikipedia: Matatu", url: "https://en.wikipedia.org/wiki/Matatu" },
    { title: "Wikimedia Commons: 2022Matatu.jpg", url: "https://commons.wikimedia.org/wiki/File:2022Matatu.jpg" },
    { title: "Wikimedia Commons: Blue Hot Wheels themed matatu in Nairobi.jpg", url: "https://commons.wikimedia.org/wiki/File:Blue_Hot_Wheels_themed_matatu_in_Nairobi.jpg" },
  ],
  "proc-vehicle-maz-500": [
    { title: "Wikipedia: MAZ-500", url: "https://en.wikipedia.org/wiki/MAZ-500" },
    { title: "Wikimedia Commons: MAZ-500 (Belagro-2019) 02.jpg", url: "https://commons.wikimedia.org/wiki/File:MAZ-500_(Belagro-2019)_02.jpg" },
  ],
  "proc-vehicle-mb-actros": [
    { title: "Wikipedia: Mercedes-Benz Actros", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Actros" },
    { title: "Wikimedia Commons: 2018-09-14 (501) Mercedes-Benz Actros 1845 of Pillar trans at ASFINAG Raststation Viehdorf, Austria.jpg", url: "https://commons.wikimedia.org/wiki/File:2018-09-14_(501)_Mercedes-Benz_Actros_1845_of_Pillar_trans_at_ASFINAG_Raststation_Viehdorf,_Austria.jpg" },
    { title: "Wikimedia Commons: Mercedes-Benz Actros (2018) 1Y7A6189.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Actros_(2018)_1Y7A6189.jpg" },
  ],
  "proc-vehicle-mb-arocs": [
    { title: "Wikimedia Commons: MERCEDES-BENZ Arocs 963-8-H, Aasloop.jpg", url: "https://commons.wikimedia.org/wiki/File:MERCEDES-BENZ_Arocs_963-8-H,_Aasloop.jpg" },
  ],
  "proc-vehicle-mb-ecitaro": [
    { title: "Wikipedia: Mercedes-Benz Citaro", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Citaro" },
    { title: "Wikimedia Commons: Mercedes Benz eCitaro bvg Berlin (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes_Benz_eCitaro_bvg_Berlin_(cropped).jpg" },
    { title: "Wikimedia Commons: 2010 09 27 Hannover 151150 (8599634777).jpg", url: "https://commons.wikimedia.org/wiki/File:2010_09_27_Hannover_151150_(8599634777).jpg" },
  ],
  "proc-vehicle-mb-econic": [
    { title: "Wikipedia: Mercedes-Benz Econic", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Econic" },
    { title: "Wikimedia Commons: Freightliner EconicSD - Front and right side IAA 2018.jpg", url: "https://commons.wikimedia.org/wiki/File:Freightliner_EconicSD_-_Front_and_right_side_IAA_2018.jpg" },
  ],
  "proc-vehicle-mb-kurzhauber": [
    { title: "Wikimedia Commons: Mercedes-Benz Kurzhauber IMG 20220508 151720.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Kurzhauber_IMG_20220508_151720.jpg" },
  ],
  "proc-vehicle-mb-l1113": [
    { title: "Wikimedia Commons: Oslo - Mercedes-Benz 1113.jpg", url: "https://commons.wikimedia.org/wiki/File:Oslo_-_Mercedes-Benz_1113.jpg" },
  ],
  "proc-vehicle-mb-ng": [
    { title: "Wikimedia Commons: Mercedes Benz NG 1632.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes_Benz_NG_1632.jpg" },
    { title: "Wikimedia Commons: Mercedes-Benz NG 1632 Sattelschlepper.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_NG_1632_Sattelschlepper.jpg" },
  ],
  "proc-vehicle-mb-o302": [
    { title: "Wikipedia: Mercedes-Benz O302", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_O302" },
    { title: "Wikimedia Commons: Mercedes Benz O302.Behind.JPG", url: "https://commons.wikimedia.org/wiki/File:Mercedes_Benz_O302.Behind.JPG" },
  ],
  "proc-vehicle-mb-o305": [
    { title: "Wikipedia: Mercedes-Benz O305", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_O305" },
    { title: "Wikimedia Commons: Mercedes-Benz O 305 Heppenheim 100 1915.JPG", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_O_305_Heppenheim_100_1915.JPG" },
    { title: "Wikimedia Commons: MBO305-307-Transperth.JPG", url: "https://commons.wikimedia.org/wiki/File:MBO305-307-Transperth.JPG" },
  ],
  "proc-vehicle-mb-o3500": [
    { title: "Wikimedia Commons: Mercedes O3500 mit Anh\u00e4nger 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes_O3500_mit_Anh%C3%A4nger_1.jpg" },
  ],
  "proc-vehicle-mb-o405": [
    { title: "Wikipedia: Mercedes-Benz O405", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_O405" },
    { title: "Wikimedia Commons: Mercedes-Benz O 405 Viernheim 100 2269.jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_O_405_Viernheim_100_2269.jpg" },
    { title: "Wikimedia Commons: Bendybus 21 18s07.JPG", url: "https://commons.wikimedia.org/wiki/File:Bendybus_21_18s07.JPG" },
  ],
  "proc-vehicle-mb-sprinter-minibus": [
    { title: "Wikipedia: Mercedes-Benz Sprinter", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Sprinter" },
    { title: "Wikimedia Commons: 2000 Mercedes-Benz Sprinter 208 CDi MWB 2.1.jpg", url: "https://commons.wikimedia.org/wiki/File:2000_Mercedes-Benz_Sprinter_208_CDi_MWB_2.1.jpg" },
    { title: "Wikimedia Commons: 2006-14 4x4 Mercedes-Benz Sprinter - fr.jpg", url: "https://commons.wikimedia.org/wiki/File:2006-14_4x4_Mercedes-Benz_Sprinter_-_fr.jpg" },
  ],
  "proc-vehicle-mb-tourismo": [
    { title: "Wikipedia: Mercedes-Benz Tourismo", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Tourismo" },
    { title: "Wikimedia Commons: Mercedes-Benz Tourismo, Berlin (20180910 131307).jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Tourismo,_Berlin_(20180910_131307).jpg" },
    { title: "Wikimedia Commons: Mercedes-Benz Tourismo (vue avant) - Trans-Alpes (Saint-Jean-de-Maurienne * \u00e9t\u00e9 2018).jpg", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Tourismo_(vue_avant)_-_Trans-Alpes_(Saint-Jean-de-Maurienne_*_%C3%A9t%C3%A9_2018).jpg" },
  ],
  "proc-vehicle-mb-unimog": [
    { title: "Wikimedia Commons: CCF Unimog U5023 - Elitt (2).jpg", url: "https://commons.wikimedia.org/wiki/File:CCF_Unimog_U5023_-_Elitt_(2).jpg" },
    { title: "Wikimedia Commons: CCF Unimog U5023 - Gimaex.jpg", url: "https://commons.wikimedia.org/wiki/File:CCF_Unimog_U5023_-_Gimaex.jpg" },
  ],
  "proc-vehicle-mb-zetros": [
    { title: "Wikipedia: Mercedes-Benz Zetros", url: "https://en.wikipedia.org/wiki/Mercedes-Benz_Zetros" },
    { title: "Wikimedia Commons: Mercedes-Benz Zetros 1833 at IAA 2014.JPG", url: "https://commons.wikimedia.org/wiki/File:Mercedes-Benz_Zetros_1833_at_IAA_2014.JPG" },
  ],
  "proc-vehicle-mci-d4505": [
    { title: "Wikipedia: MCI D-Series", url: "https://en.wikipedia.org/wiki/MCI_D-Series" },
    { title: "Wikimedia Commons: Greyhound-Bus.jpg", url: "https://commons.wikimedia.org/wiki/File:Greyhound-Bus.jpg" },
    { title: "Wikimedia Commons: MTA MCI D4500CT - Flickr - JLaw45.jpg", url: "https://commons.wikimedia.org/wiki/File:MTA_MCI_D4500CT_-_Flickr_-_JLaw45.jpg" },
  ],
  "proc-vehicle-md-80": [
    { title: "Wikipedia: McDonnell Douglas MD-80", url: "https://en.wikipedia.org/wiki/McDonnell_Douglas_MD-80" },
    { title: "Wikimedia Commons: 21ay - Scandinavian Airlines MD-87; OY-KHI@ZRH;22.04.1998 (5134779519).jpg", url: "https://commons.wikimedia.org/wiki/File:21ay_-_Scandinavian_Airlines_MD-87;_OY-KHI@ZRH;22.04.1998_(5134779519).jpg" },
  ],
  "proc-vehicle-medellin-metrocable": [
    { title: "Wikipedia: Metrocable (Medell\u00edn)", url: "https://en.wikipedia.org/wiki/Metrocable_(Medell%C3%ADn)" },
    { title: "Wikimedia Commons: Metrocablemed.jpg", url: "https://commons.wikimedia.org/wiki/File:Metrocablemed.jpg" },
  ],
  "proc-vehicle-melbourne-b-class": [
    { title: "Wikipedia: B class Melbourne tram", url: "https://en.wikipedia.org/wiki/B_class_Melbourne_tram" },
    { title: "Wikimedia Commons: B1.2001 at Acland Street (B1 Final Farewell Tour).jpg", url: "https://commons.wikimedia.org/wiki/File:B1.2001_at_Acland_Street_(B1_Final_Farewell_Tour).jpg" },
  ],
  "proc-vehicle-melbourne-e-class": [
    { title: "Wikipedia: E class Melbourne tram", url: "https://en.wikipedia.org/wiki/E_class_Melbourne_tram" },
    { title: "Wikimedia Commons: E2.6066 bourke, 2023 (01).jpg", url: "https://commons.wikimedia.org/wiki/File:E2.6066_bourke,_2023_(01).jpg" },
  ],
  "proc-vehicle-melbourne-w-class": [
    { title: "Wikipedia: W class Melbourne tram", url: "https://en.wikipedia.org/wiki/W_class_Melbourne_tram" },
    { title: "Wikimedia Commons: Ballarat tram 661.jpg", url: "https://commons.wikimedia.org/wiki/File:Ballarat_tram_661.jpg" },
  ],
  "proc-vehicle-mil-mi8": [
    { title: "Wikipedia: Mil Mi-8", url: "https://en.wikipedia.org/wiki/Mil_Mi-8" },
    { title: "Wikimedia Commons: Mi-8T 12411 V i PVO VS, august 04, 2008.JPG", url: "https://commons.wikimedia.org/wiki/File:Mi-8T_12411_V_i_PVO_VS,_august_04,_2008.JPG" },
  ],
  "proc-vehicle-milan-ventotto": [
    { title: "Wikipedia: ATM Class 1500", url: "https://en.wikipedia.org/wiki/ATM_Class_1500" },
    { title: "Wikimedia Commons: ATM Car 1813 rainbow livery.jpg", url: "https://commons.wikimedia.org/wiki/File:ATM_Car_1813_rainbow_livery.jpg" },
    { title: "Wikimedia Commons: ATM Class 1500 1661.jpg", url: "https://commons.wikimedia.org/wiki/File:ATM_Class_1500_1661.jpg" },
  ],
  "proc-vehicle-montpellier-citadis": [
    { title: "Wikipedia: Montpellier tramway", url: "https://en.wikipedia.org/wiki/Montpellier_tramway" },
    { title: "Wikimedia Commons: Citadis 401 Tramway de Montpellier ligne T1 2011.jpg", url: "https://commons.wikimedia.org/wiki/File:Citadis_401_Tramway_de_Montpellier_ligne_T1_2011.jpg" },
  ],
  "proc-vehicle-namc-ys11": [
    { title: "Wikipedia: NAMC YS-11", url: "https://en.wikipedia.org/wiki/NAMC_YS-11" },
    { title: "Wikimedia Commons: 'Japan Navy Schedule 21' Atsugi route 4 departure. (8382459963).jpg", url: "https://commons.wikimedia.org/wiki/File:%27Japan_Navy_Schedule_21%27_Atsugi_route_4_departure._(8382459963).jpg" },
  ],
  "proc-vehicle-neoplan-cityliner": [
    { title: "Wikimedia Commons: Lviv Neoplan Cityliner-95.jpg", url: "https://commons.wikimedia.org/wiki/File:Lviv_Neoplan_Cityliner-95.jpg" },
    { title: "Wikimedia Commons: Neoplan Cityliner IAA 2016 (1) Travelarz.JPG", url: "https://commons.wikimedia.org/wiki/File:Neoplan_Cityliner_IAA_2016_(1)_Travelarz.JPG" },
  ],
  "proc-vehicle-neoplan-skyliner": [
    { title: "Wikipedia: Neoplan Skyliner", url: "https://en.wikipedia.org/wiki/Neoplan_Skyliner" },
    { title: "Wikimedia Commons: Neoplan Skyliner 2011 Autobus Oberbayern.jpg", url: "https://commons.wikimedia.org/wiki/File:Neoplan_Skyliner_2011_Autobus_Oberbayern.jpg" },
    { title: "Wikimedia Commons: Flixbus (Vestmotorvejen) in 2019.04.jpg", url: "https://commons.wikimedia.org/wiki/File:Flixbus_(Vestmotorvejen)_in_2019.04.jpg" },
  ],
  "proc-vehicle-new-flyer-xcelsior": [
    { title: "Wikipedia: New Flyer Xcelsior", url: "https://en.wikipedia.org/wiki/New_Flyer_Xcelsior" },
    { title: "Wikimedia Commons: New Flyer Xcelsior.jpg", url: "https://commons.wikimedia.org/wiki/File:New_Flyer_Xcelsior.jpg" },
    { title: "Wikimedia Commons: Xcelsior XE40 at Hillcrest Complex (2024).jpg", url: "https://commons.wikimedia.org/wiki/File:Xcelsior_XE40_at_Hillcrest_Complex_(2024).jpg" },
  ],
  "proc-vehicle-new-orleans-perley-thomas": [
    { title: "Wikipedia: St. Charles Streetcar Line", url: "https://en.wikipedia.org/wiki/St._Charles_Streetcar_Line" },
    { title: "Wikimedia Commons: 426 on StCharles.jpg", url: "https://commons.wikimedia.org/wiki/File:426_on_StCharles.jpg" },
  ],
  "proc-vehicle-new-routemaster": [
    { title: "Wikipedia: New Routemaster", url: "https://en.wikipedia.org/wiki/New_Routemaster" },
    { title: "Wikimedia Commons: London United bus LT86 (LTZ 1086), route 9, 26 October 2013 (1).jpg", url: "https://commons.wikimedia.org/wiki/File:London_United_bus_LT86_(LTZ_1086),_route_9,_26_October_2013_(1).jpg" },
    { title: "Wikimedia Commons: Arriva London bus LT6 (LT12 FHT), route 38, 16 April 2013 (2).jpg", url: "https://commons.wikimedia.org/wiki/File:Arriva_London_bus_LT6_(LT12_FHT),_route_38,_16_April_2013_(2).jpg" },
  ],
  "proc-vehicle-ngong-ping-crystal": [
    { title: "Wikipedia: Ngong Ping 360", url: "https://en.wikipedia.org/wiki/Ngong_Ping_360" },
    { title: "Wikimedia Commons: A cable car of Ngong Ping 360.jpg", url: "https://commons.wikimedia.org/wiki/File:A_cable_car_of_Ngong_Ping_360.jpg" },
    { title: "Wikimedia Commons: Ngong Ping 360 Cabins.JPG", url: "https://commons.wikimedia.org/wiki/File:Ngong_Ping_360_Cabins.JPG" },
  ],
  "proc-vehicle-nottingham-incentro": [
    { title: "Wikipedia: Bombardier Incentro", url: "https://en.wikipedia.org/wiki/Bombardier_Incentro" },
    { title: "Wikimedia Commons: Tram-de-Nantes.jpg", url: "https://commons.wikimedia.org/wiki/File:Tram-de-Nantes.jpg" },
  ],
  "proc-vehicle-nova-lfs": [
    { title: "Wikipedia: Nova Bus LFS", url: "https://en.wikipedia.org/wiki/Nova_Bus_LFS" },
    { title: "Wikimedia Commons: 2012 Novabus LFSA Articulated (5887) lays up at Park Row & Beekman Street.jpg", url: "https://commons.wikimedia.org/wiki/File:2012_Novabus_LFSA_Articulated_(5887)_lays_up_at_Park_Row_%26_Beekman_Street.jpg" },
    { title: "Wikimedia Commons: 9-924 retired 1999 LFS.jpg", url: "https://commons.wikimedia.org/wiki/File:9-924_retired_1999_LFS.jpg" },
  ],
  "proc-vehicle-oslo-sl79": [
    { title: "Wikipedia: SL79", url: "https://en.wikipedia.org/wiki/SL79" },
    { title: "Wikimedia Commons: Brand new SL79 in 1982.jpg", url: "https://commons.wikimedia.org/wiki/File:Brand_new_SL79_in_1982.jpg" },
  ],
  "proc-vehicle-otokar-kent": [
    { title: "Wikipedia: Otokar", url: "https://en.wikipedia.org/wiki/Otokar" },
    { title: "Wikimedia Commons: Otokar kent c.jpg", url: "https://commons.wikimedia.org/wiki/File:Otokar_kent_c.jpg" },
  ],
  "proc-vehicle-pakistani-truck-art": [
    { title: "Wikimedia Commons: Pakistani truck.jpg", url: "https://commons.wikimedia.org/wiki/File:Pakistani_truck.jpg" },
  ],
  "proc-vehicle-paz-672": [
    { title: "Wikipedia: Pavlovo Bus Factory", url: "https://en.wikipedia.org/wiki/Pavlovo_Bus_Factory" },
    { title: "Wikimedia Commons: PAZ-672 at Bronevoy Pereulok 12 in Minsk 24 August 2014.JPG", url: "https://commons.wikimedia.org/wiki/File:PAZ-672_at_Bronevoy_Pereulok_12_in_Minsk_24_August_2014.JPG" },
  ],
  "proc-vehicle-pcc-streamliner": [
    { title: "Wikipedia: PCC streetcar", url: "https://en.wikipedia.org/wiki/PCC_streetcar" },
    { title: "Wikimedia Commons: BostonPictureWindow.jpg", url: "https://commons.wikimedia.org/wiki/File:BostonPictureWindow.jpg" },
  ],
  "proc-vehicle-peak-2-peak": [
    { title: "Wikipedia: Peak 2 Peak Gondola", url: "https://en.wikipedia.org/wiki/Peak_2_Peak_Gondola" },
    { title: "Wikimedia Commons: Telepherique-Canada-Vancouver-Whistler-Blackcomb-200907.jpg", url: "https://commons.wikimedia.org/wiki/File:Telepherique-Canada-Vancouver-Whistler-Blackcomb-200907.jpg" },
    { title: "Wikimedia Commons: Peak 2 Peak Carrier.JPG", url: "https://commons.wikimedia.org/wiki/File:Peak_2_Peak_Carrier.JPG" },
  ],
  "proc-vehicle-pegaso-comet": [
    { title: "Wikimedia Commons: 1974 Pegaso Comet (4520771385).jpg", url: "https://commons.wikimedia.org/wiki/File:1974_Pegaso_Comet_(4520771385).jpg" },
  ],
  "proc-vehicle-pesa-swing": [
    { title: "Wikipedia: Pesa Swing", url: "https://en.wikipedia.org/wiki/Pesa_Swing" },
    { title: "Wikimedia Commons: Cluj-Napoca, PESA 81, 2012.06.07.jpg", url: "https://commons.wikimedia.org/wiki/File:Cluj-Napoca,_PESA_81,_2012.06.07.jpg" },
    { title: "Wikimedia Commons: J26 175 Blvd. Christo Botev, ET 2303.jpg", url: "https://commons.wikimedia.org/wiki/File:J26_175_Blvd._Christo_Botev,_ET_2303.jpg" },
  ],
  "proc-vehicle-peterbilt-379": [
    { title: "Wikipedia: Peterbilt 379", url: "https://en.wikipedia.org/wiki/Peterbilt_379" },
    { title: "Wikimedia Commons: 2003 Peterbilt 379.jpeg", url: "https://commons.wikimedia.org/wiki/File:2003_Peterbilt_379.jpeg" },
  ],
  "proc-vehicle-peterbilt-579": [
    { title: "Wikimedia Commons: U.S. NNSA Armored Peterbilt 579 hauling Safeguards Transporter.jpg", url: "https://commons.wikimedia.org/wiki/File:U.S._NNSA_Armored_Peterbilt_579_hauling_Safeguards_Transporter.jpg" },
  ],
  "proc-vehicle-philadelphia-kawasaki": [
    { title: "Wikipedia: T (SEPTA Metro)", url: "https://en.wikipedia.org/wiki/T_(SEPTA_Metro)" },
    { title: "Wikimedia Commons: SEPTA Route 34 trolley 9107.jpg", url: "https://commons.wikimedia.org/wiki/File:SEPTA_Route_34_trolley_9107.jpg" },
  ],
  "proc-vehicle-pierce-arrow-xt": [
    { title: "Wikimedia Commons: Jackson FD Aerial 1 (1988-89) 105' Pierce Arrow.jpg", url: "https://commons.wikimedia.org/wiki/File:Jackson_FD_Aerial_1_(1988-89)_105%27_Pierce_Arrow.jpg" },
  ],
  "proc-vehicle-pilatus-pc12": [
    { title: "Wikipedia: Pilatus PC-12", url: "https://en.wikipedia.org/wiki/Pilatus_PC-12" },
    { title: "Wikimedia Commons: M-TOMS (6987213780) (3).jpg", url: "https://commons.wikimedia.org/wiki/File:M-TOMS_(6987213780)_(3).jpg" },
  ],
  "proc-vehicle-piper-cherokee": [
    { title: "Wikipedia: Piper PA-28 Cherokee", url: "https://en.wikipedia.org/wiki/Piper_PA-28_Cherokee" },
    { title: "Wikimedia Commons: Enaer T-35 Pill\u00e1n - A742737.jpg", url: "https://commons.wikimedia.org/wiki/File:Enaer_T-35_Pill%C3%A1n_-_A742737.jpg" },
  ],
  "proc-vehicle-plaxton-panorama": [
    { title: "Wikipedia: Plaxton Panorama Elite", url: "https://en.wikipedia.org/wiki/Plaxton_Panorama_Elite" },
    { title: "Wikimedia Commons: Magical Mystery Tour Bedford VAL Plaxton Panorama Elite II.jpg", url: "https://commons.wikimedia.org/wiki/File:Magical_Mystery_Tour_Bedford_VAL_Plaxton_Panorama_Elite_II.jpg" },
    { title: "Wikimedia Commons: Sheffield United Tours preserved coach 1966 AEC Reliance Plaxton Panorama KWE 374D.jpg", url: "https://commons.wikimedia.org/wiki/File:Sheffield_United_Tours_preserved_coach_1966_AEC_Reliance_Plaxton_Panorama_KWE_374D.jpg" },
  ],
  "proc-vehicle-poma-funitel": [
    { title: "Wikipedia: Funitel", url: "https://en.wikipedia.org/wiki/Funitel" },
    { title: "Wikimedia Commons: Funitel 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Funitel_1.jpg" },
    { title: "Wikimedia Commons: Squaw Valley Funitel Olympic Valley.jpg", url: "https://commons.wikimedia.org/wiki/File:Squaw_Valley_Funitel_Olympic_Valley.jpg" },
    { title: "Wikimedia Commons: Funitel Fond.JPG", url: "https://commons.wikimedia.org/wiki/File:Funitel_Fond.JPG" },
  ],
  "proc-vehicle-praga-v3s": [
    { title: "Wikipedia: Praga V3S", url: "https://en.wikipedia.org/wiki/Praga_V3S" },
    { title: "Wikimedia Commons: Mal\u00e1 Mor\u00e1vka - Praga V3S crop.jpg", url: "https://commons.wikimedia.org/wiki/File:Mal%C3%A1_Mor%C3%A1vka_-_Praga_V3S_crop.jpg" },
  ],
  "proc-vehicle-proterra-catalyst": [
    { title: "Wikipedia: Proterra Catalyst", url: "https://en.wikipedia.org/wiki/Proterra_Catalyst" },
    { title: "Wikimedia Commons: King County Metro Proterra Catalyst (24471101374).jpg", url: "https://commons.wikimedia.org/wiki/File:King_County_Metro_Proterra_Catalyst_(24471101374).jpg" },
    { title: "Wikimedia Commons: Proterra electric bus at Eastgate P&R (23516861652).jpg", url: "https://commons.wikimedia.org/wiki/File:Proterra_electric_bus_at_Eastgate_P%26R_(23516861652).jpg" },
  ],
  "proc-vehicle-renault-magnum": [
    { title: "Wikipedia: Renault Magnum", url: "https://en.wikipedia.org/wiki/Renault_Magnum" },
    { title: "Wikimedia Commons: Renault Magnum 385 Ti 1992 (11973865063).jpg", url: "https://commons.wikimedia.org/wiki/File:Renault_Magnum_385_Ti_1992_(11973865063).jpg" },
  ],
  "proc-vehicle-renault-pr100": [
    { title: "Wikipedia: Renault PR100", url: "https://en.wikipedia.org/wiki/Renault_PR100" },
    { title: "Wikimedia Commons: JHM-1980- Berliet PR100 B Toulon.jpg", url: "https://commons.wikimedia.org/wiki/File:JHM-1980-_Berliet_PR100_B_Toulon.jpg" },
  ],
  "proc-vehicle-renault-t": [
    { title: "Wikipedia: Renault Trucks T", url: "https://en.wikipedia.org/wiki/Renault_Trucks_T" },
    { title: "Wikimedia Commons: M Way's \"Princess Amy\" - Renault T-Truck (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:M_Way%27s_%22Princess_Amy%22_-_Renault_T-Truck_(cropped).jpg" },
  ],
  "proc-vehicle-rio-bonde": [
    { title: "Wikipedia: Santa Teresa Tram", url: "https://en.wikipedia.org/wiki/Santa_Teresa_Tram" },
    { title: "Wikimedia Commons: At Rio de Janeiro 2019 466.jpg", url: "https://commons.wikimedia.org/wiki/File:At_Rio_de_Janeiro_2019_466.jpg" },
  ],
  "proc-vehicle-roosevelt-island-tram": [
    { title: "Wikipedia: Roosevelt Island Tramway", url: "https://en.wikipedia.org/wiki/Roosevelt_Island_Tramway" },
    { title: "Wikimedia Commons: Roosevelt Island tramcar 2010.jpg", url: "https://commons.wikimedia.org/wiki/File:Roosevelt_Island_tramcar_2010.jpg" },
    { title: "Wikimedia Commons: New Roosevelt tram fr QBB jeh.jpg", url: "https://commons.wikimedia.org/wiki/File:New_Roosevelt_tram_fr_QBB_jeh.jpg" },
  ],
  "proc-vehicle-rosenbauer-panther": [
    { title: "Wikipedia: Rosenbauer Panther", url: "https://en.wikipedia.org/wiki/Rosenbauer_Panther" },
    { title: "Wikimedia Commons: Flugfeldl\u00f6schfahrzeug Rosenbauer Panther Foam 10, Tag der Feuerwehr, 2024 Stadtw\u00e4ldchen.jpg", url: "https://commons.wikimedia.org/wiki/File:Flugfeldl%C3%B6schfahrzeug_Rosenbauer_Panther_Foam_10,_Tag_der_Feuerwehr,_2024_Stadtw%C3%A4ldchen.jpg" },
  ],
  "proc-vehicle-saab-2000": [
    { title: "Wikipedia: Saab 2000", url: "https://en.wikipedia.org/wiki/Saab_2000" },
    { title: "Wikimedia Commons: ES-NSF Saab 2000 NyxAir VBY.jpg", url: "https://commons.wikimedia.org/wiki/File:ES-NSF_Saab_2000_NyxAir_VBY.jpg" },
  ],
  "proc-vehicle-saab-340": [
    { title: "Wikipedia: Saab 340", url: "https://en.wikipedia.org/wiki/Saab_340" },
    { title: "Wikimedia Commons: JA953A (6977308911).jpg", url: "https://commons.wikimedia.org/wiki/File:JA953A_(6977308911).jpg" },
  ],
  "proc-vehicle-sarajevo-k2yu": [
    { title: "Wikipedia: Trams in Sarajevo", url: "https://en.wikipedia.org/wiki/Trams_in_Sarajevo" },
    { title: "Wikimedia Commons: Tram K2YU Sarajevo BiH.jpg", url: "https://commons.wikimedia.org/wiki/File:Tram_K2YU_Sarajevo_BiH.jpg" },
  ],
  "proc-vehicle-saurer-postbus": [
    { title: "Wikipedia: Saurer", url: "https://en.wikipedia.org/wiki/Saurer" },
    { title: "Wikimedia Commons: Postauto Saurer 3-DUK Alpenwagen IV-U (1964).jpg", url: "https://commons.wikimedia.org/wiki/File:Postauto_Saurer_3-DUK_Alpenwagen_IV-U_(1964).jpg" },
  ],
  "proc-vehicle-scammell-contractor": [
    { title: "Wikimedia Commons: Mk 1 Scammell Contractor - geograph.org.uk - 1291403.jpg", url: "https://commons.wikimedia.org/wiki/File:Mk_1_Scammell_Contractor_-_geograph.org.uk_-_1291403.jpg" },
  ],
  "proc-vehicle-scania-111": [
    { title: "Wikimedia Commons: Scania L111 en Lojsta.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_L111_en_Lojsta.jpg" },
  ],
  "proc-vehicle-scania-citywide": [
    { title: "Wikipedia: Scania Citywide", url: "https://en.wikipedia.org/wiki/Scania_Citywide" },
    { title: "Wikimedia Commons: Heidelberg - Scania Citywide - Viabus - SP-VB 164 - 2016-08-13 18-10-03.jpg", url: "https://commons.wikimedia.org/wiki/File:Heidelberg_-_Scania_Citywide_-_Viabus_-_SP-VB_164_-_2016-08-13_18-10-03.jpg" },
    { title: "Wikimedia Commons: Scania Citywide in Nieder\u00f6sterreich.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_Citywide_in_Nieder%C3%B6sterreich.jpg" },
  ],
  "proc-vehicle-scania-lb141": [
    { title: "Wikimedia Commons: Scania-LBS141-Sattelschlepper.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania-LBS141-Sattelschlepper.jpg" },
    { title: "Wikimedia Commons: Scania LB 141.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_LB_141.jpg" },
  ],
  "proc-vehicle-scania-r": [
    { title: "Wikimedia Commons: Scania R500 mit Holzpelletsbeh\u00e4lter (2021).jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_R500_mit_Holzpelletsbeh%C3%A4lter_(2021).jpg" },
    { title: "Wikimedia Commons: Scania R500 Ballast Tractor Puller 2013 in India 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_R500_Ballast_Tractor_Puller_2013_in_India_01.jpg" },
  ],
  "proc-vehicle-scania-s-v8": [
    { title: "Wikimedia Commons: Scania S730 at Girvan - geograph.org.uk - 6565410.jpg", url: "https://commons.wikimedia.org/wiki/File:Scania_S730_at_Girvan_-_geograph.org.uk_-_6565410.jpg" },
  ],
  "proc-vehicle-setra-s515": [
    { title: "Wikipedia: Setra", url: "https://en.wikipedia.org/wiki/Setra" },
    { title: "Wikimedia Commons: Setra S 515 LE, Busworld Europe 2023, Brussels (P1140119).jpg", url: "https://commons.wikimedia.org/wiki/File:Setra_S_515_LE,_Busworld_Europe_2023,_Brussels_(P1140119).jpg" },
  ],
  "proc-vehicle-shacman-x3000": [
    { title: "Wikimedia Commons: Shacman Zhiyun S300 001.jpg", url: "https://commons.wikimedia.org/wiki/File:Shacman_Zhiyun_S300_001.jpg" },
  ],
  "proc-vehicle-sheffield-supertram": [
    { title: "Wikipedia: South Yorkshire Supertram", url: "https://en.wikipedia.org/wiki/South_Yorkshire_Supertram" },
    { title: "Wikimedia Commons: Siemens-Duewag Supertram LRV.jpg", url: "https://commons.wikimedia.org/wiki/File:Siemens-Duewag_Supertram_LRV.jpg" },
  ],
  "proc-vehicle-shinmaywa-us2": [
    { title: "Wikipedia: ShinMaywa US-2", url: "https://en.wikipedia.org/wiki/ShinMaywa_US-2" },
    { title: "Wikimedia Commons: 9904 Shin Meiwa US-2 JMSDF (7575441596).jpg", url: "https://commons.wikimedia.org/wiki/File:9904_Shin_Meiwa_US-2_JMSDF_(7575441596).jpg" },
  ],
  "proc-vehicle-ship-aframax": [
    { title: "Wikipedia: Aframax", url: "https://en.wikipedia.org/wiki/Aframax" },
    { title: "Wikimedia Commons: Atlas Maritime's Mitera Marigo Aframax Oil Tanker.jpg", url: "https://commons.wikimedia.org/wiki/File:Atlas_Maritime%27s_Mitera_Marigo_Aframax_Oil_Tanker.jpg" },
  ],
  "proc-vehicle-ship-amazon-riverboat": [
    { title: "Wikipedia: Riverboat", url: "https://en.wikipedia.org/wiki/Riverboat" },
    { title: "Wikimedia Commons: A riverboat on the Willamette River, Oregon.jpg", url: "https://commons.wikimedia.org/wiki/File:A_riverboat_on_the_Willamette_River,_Oregon.jpg" },
  ],
  "proc-vehicle-ship-amsterdam-ijveer": [
    { title: "Wikimedia Commons: Amsterdam - Het IJ - GVB Ferry - View SE.jpg", url: "https://commons.wikimedia.org/wiki/File:Amsterdam_-_Het_IJ_-_GVB_Ferry_-_View_SE.jpg" },
  ],
  "proc-vehicle-ship-anchor-handler": [
    { title: "Wikipedia: Anchor handling tug supply vessel", url: "https://en.wikipedia.org/wiki/Anchor_handling_tug_supply_vessel" },
    { title: "Wikimedia Commons: Balder Viking anchor handling.JPG", url: "https://commons.wikimedia.org/wiki/File:Balder_Viking_anchor_handling.JPG" },
  ],
  "proc-vehicle-ship-arktika": [
    { title: "Wikipedia: Arktika-class icebreaker", url: "https://en.wikipedia.org/wiki/Arktika-class_icebreaker" },
    { title: "Wikimedia Commons: 50 Let Pobedy.jpg", url: "https://commons.wikimedia.org/wiki/File:50_Let_Pobedy.jpg" },
  ],
  "proc-vehicle-ship-attenborough": [
    { title: "Wikipedia: RRS Sir David Attenborough", url: "https://en.wikipedia.org/wiki/RRS_Sir_David_Attenborough" },
    { title: "Wikimedia Commons: Launch of RRS Sir David Attenborough 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Launch_of_RRS_Sir_David_Attenborough_01.jpg" },
  ],
  "proc-vehicle-ship-bateau-mouche": [
    { title: "Wikipedia: Bateaux Mouches", url: "https://en.wikipedia.org/wiki/Bateaux_Mouches" },
    { title: "Wikimedia Commons: Bateau mouche jnl 4.jpg", url: "https://commons.wikimedia.org/wiki/File:Bateau_mouche_jnl_4.jpg" },
  ],
  "proc-vehicle-ship-bc-spirit": [
    { title: "Wikipedia: S-class ferry", url: "https://en.wikipedia.org/wiki/S-class_ferry" },
    { title: "Wikimedia Commons: SpiritOfBritishColumbia.jpg", url: "https://commons.wikimedia.org/wiki/File:SpiritOfBritishColumbia.jpg" },
  ],
  "proc-vehicle-ship-bluenose": [
    { title: "Wikipedia: Bluenose II", url: "https://en.wikipedia.org/wiki/Bluenose_II" },
    { title: "Wikimedia Commons: 2022-08-04 01 BLUENOSE II - IMO 5419086 \u2013 off Blue Rocks NS CAN.jpg", url: "https://commons.wikimedia.org/wiki/File:2022-08-04_01_BLUENOSE_II_-_IMO_5419086_%E2%80%93_off_Blue_Rocks_NS_CAN.jpg" },
  ],
  "proc-vehicle-ship-bosphorus-vapur": [
    { title: "Wikipedia: Ferries in Istanbul", url: "https://en.wikipedia.org/wiki/Ferries_in_Istanbul" },
    { title: "Wikimedia Commons: 20131205 Istanbul 172.jpg", url: "https://commons.wikimedia.org/wiki/File:20131205_Istanbul_172.jpg" },
  ],
  "proc-vehicle-ship-cable-layer": [
    { title: "Wikipedia: Cable layer", url: "https://en.wikipedia.org/wiki/Cable_layer" },
    { title: "Wikimedia Commons: 2024-11-26 03 CABLE INNOVATOR - IMO 9101132 \u2013 Victoria, BC CAN.jpg", url: "https://commons.wikimedia.org/wiki/File:2024-11-26_03_CABLE_INNOVATOR_-_IMO_9101132_%E2%80%93_Victoria,_BC_CAN.jpg" },
    { title: "Wikimedia Commons: Cable Ship - Global Sentinel - Tyco Telecom.jpg", url: "https://commons.wikimedia.org/wiki/File:Cable_Ship_-_Global_Sentinel_-_Tyco_Telecom.jpg" },
  ],
  "proc-vehicle-ship-capesize": [
    { title: "Wikipedia: Capesize", url: "https://en.wikipedia.org/wiki/Capesize" },
    { title: "Wikimedia Commons: 140303 Cape Elise - 03.jpg", url: "https://commons.wikimedia.org/wiki/File:140303_Cape_Elise_-_03.jpg" },
  ],
  "proc-vehicle-ship-channel-ropax": [
    { title: "Wikimedia Commons: Spirit of Britain in pursuit.jpg", url: "https://commons.wikimedia.org/wiki/File:Spirit_of_Britain_in_pursuit.jpg" },
    { title: "Wikimedia Commons: SOBArrival.JPG", url: "https://commons.wikimedia.org/wiki/File:SOBArrival.JPG" },
  ],
  "proc-vehicle-ship-chemical-tanker": [
    { title: "Wikipedia: Chemical tanker", url: "https://en.wikipedia.org/wiki/Chemical_tanker" },
    { title: "Wikimedia Commons: STEN AURORA Clyde 2019.jpg", url: "https://commons.wikimedia.org/wiki/File:STEN_AURORA_Clyde_2019.jpg" },
  ],
  "proc-vehicle-ship-crane-vessel": [
    { title: "Wikipedia: SSCV Sleipnir", url: "https://en.wikipedia.org/wiki/SSCV_Sleipnir" },
    { title: "Wikimedia Commons: SLEIPNIR (50504958661).jpg", url: "https://commons.wikimedia.org/wiki/File:SLEIPNIR_(50504958661).jpg" },
  ],
  "proc-vehicle-ship-cutty-sark": [
    { title: "Wikipedia: Cutty Sark", url: "https://en.wikipedia.org/wiki/Cutty_Sark" },
    { title: "Wikimedia Commons: CuttySarkAndHMSWorcester.jpg", url: "https://commons.wikimedia.org/wiki/File:CuttySarkAndHMSWorcester.jpg" },
  ],
  "proc-vehicle-ship-dhow": [
    { title: "Wikipedia: Dhow", url: "https://en.wikipedia.org/wiki/Dhow" },
    { title: "Wikimedia Commons: Another Dhow.JPG", url: "https://commons.wikimedia.org/wiki/File:Another_Dhow.JPG" },
  ],
  "proc-vehicle-ship-drillship": [
    { title: "Wikipedia: Drillship", url: "https://en.wikipedia.org/wiki/Drillship" },
    { title: "Wikimedia Commons: Deep Value Driller docked at Nedrev\u00e5ge.jpg", url: "https://commons.wikimedia.org/wiki/File:Deep_Value_Driller_docked_at_Nedrev%C3%A5ge.jpg" },
  ],
  "proc-vehicle-ship-elbe-paddle": [
    { title: "Wikipedia: S\u00e4chsische Dampfschiffahrt", url: "https://en.wikipedia.org/wiki/S%C3%A4chsische_Dampfschiffahrt" },
    { title: "Wikimedia Commons: Dresden-Kleinzschachwitz, der Raddampfer \"Mei\u00dfen\".jpg", url: "https://commons.wikimedia.org/wiki/File:Dresden-Kleinzschachwitz,_der_Raddampfer_%22Mei%C3%9Fen%22.jpg" },
  ],
  "proc-vehicle-ship-emma-maersk": [
    { title: "Wikipedia: Emma M\u00e6rsk", url: "https://en.wikipedia.org/wiki/Emma_M%C3%A6rsk" },
    { title: "Wikimedia Commons: 2023 Emma Maersk - IMO 9321483 - by 2eight - 9SC4259.jpg", url: "https://commons.wikimedia.org/wiki/File:2023_Emma_Maersk_-_IMO_9321483_-_by_2eight_-_9SC4259.jpg" },
    { title: "Wikimedia Commons: Emma M\u00e6rsk 5.jpg", url: "https://commons.wikimedia.org/wiki/File:Emma_M%C3%A6rsk_5.jpg" },
  ],
  "proc-vehicle-ship-europaschiff": [
    { title: "Wikimedia Commons: Motor cargo ship Cairo.jpg", url: "https://commons.wikimedia.org/wiki/File:Motor_cargo_ship_Cairo.jpg" },
  ],
  "proc-vehicle-ship-expedition-cruise": [
    { title: "Wikipedia: MS Roald Amundsen", url: "https://en.wikipedia.org/wiki/MS_Roald_Amundsen" },
    { title: "Wikimedia Commons: Hurtigrutten Roald amundsen.jpg", url: "https://commons.wikimedia.org/wiki/File:Hurtigrutten_Roald_amundsen.jpg" },
  ],
  "proc-vehicle-ship-feeder-container": [
    { title: "Wikipedia: Feeder ship", url: "https://en.wikipedia.org/wiki/Feeder_ship" },
    { title: "Wikimedia Commons: 2015-02-07 VEGA SCORPIO - IMO 9491599, with tug, BARBADOS II - IMO 9229221.jpg", url: "https://commons.wikimedia.org/wiki/File:2015-02-07_VEGA_SCORPIO_-_IMO_9491599,_with_tug,_BARBADOS_II_-_IMO_9229221.jpg" },
    { title: "Wikimedia Commons: BF Fortaleza (IMO 9130432) River Thames 2020.jpg", url: "https://commons.wikimedia.org/wiki/File:BF_Fortaleza_(IMO_9130432)_River_Thames_2020.jpg" },
  ],
  "proc-vehicle-ship-felucca": [
    { title: "Wikipedia: Felucca", url: "https://en.wikipedia.org/wiki/Felucca" },
    { title: "Wikimedia Commons: Felucca R02.jpg", url: "https://commons.wikimedia.org/wiki/File:Felucca_R02.jpg" },
  ],
  "proc-vehicle-ship-fireboat": [
    { title: "Wikipedia: Fireboat", url: "https://en.wikipedia.org/wiki/Fireboat" },
    { title: "Wikimedia Commons: Excellence Fire Boat No.6.JPG", url: "https://commons.wikimedia.org/wiki/File:Excellence_Fire_Boat_No.6.JPG" },
  ],
  "proc-vehicle-ship-fishing-cutter": [
    { title: "Wikipedia: Bottom trawling", url: "https://en.wikipedia.org/wiki/Bottom_trawling" },
    { title: "Wikimedia Commons: FMIB 36645 Otter trawl.jpeg", url: "https://commons.wikimedia.org/wiki/File:FMIB_36645_Otter_trawl.jpeg" },
  ],
  "proc-vehicle-ship-gondola": [
    { title: "Wikipedia: Gondola", url: "https://en.wikipedia.org/wiki/Gondola" },
    { title: "Wikimedia Commons: Ferri da gondola.jpg", url: "https://commons.wikimedia.org/wiki/File:Ferri_da_gondola.jpg" },
  ],
  "proc-vehicle-ship-handysize": [
    { title: "Wikipedia: Handysize", url: "https://en.wikipedia.org/wiki/Handysize" },
    { title: "Wikimedia Commons: Polish Bulk Carrier Kociewie in the Port of Hamburg.jpg", url: "https://commons.wikimedia.org/wiki/File:Polish_Bulk_Carrier_Kociewie_in_the_Port_of_Hamburg.jpg" },
  ],
  "proc-vehicle-ship-harbour-tug": [
    { title: "Wikipedia: Tugboat", url: "https://en.wikipedia.org/wiki/Tugboat" },
    { title: "Wikimedia Commons: Ship and Tugs Sydney 1942 slnsw.jpg", url: "https://commons.wikimedia.org/wiki/File:Ship_and_Tugs_Sydney_1942_slnsw.jpg" },
    { title: "Wikimedia Commons: Svitzer Tyr - Ystad-2018.jpg", url: "https://commons.wikimedia.org/wiki/File:Svitzer_Tyr_-_Ystad-2018.jpg" },
    { title: "Wikimedia Commons: Svitzer Tyr - - Ystad-2018.jpg", url: "https://commons.wikimedia.org/wiki/File:Svitzer_Tyr_-_-_Ystad-2018.jpg" },
    { title: "Wikimedia Commons: Svitzer Freja tug.jpg", url: "https://commons.wikimedia.org/wiki/File:Svitzer_Freja_tug.jpg" },
    { title: "Wikimedia Commons: MULTRATUG 32 & MARGRETHE MAERSK (48489922037).jpg", url: "https://commons.wikimedia.org/wiki/File:MULTRATUG_32_%26_MARGRETHE_MAERSK_(48489922037).jpg" },
    { title: "Wikimedia Commons: Remorqueur VB MALABATA port de Tanger KAUNAS.jpg", url: "https://commons.wikimedia.org/wiki/File:Remorqueur_VB_MALABATA_port_de_Tanger_KAUNAS.jpg" },
  ],
  "proc-vehicle-ship-heavy-lift": [
    { title: "Wikipedia: Heavy-lift ship", url: "https://en.wikipedia.org/wiki/Heavy-lift_ship" },
    { title: "Wikimedia Commons: MV Blue Marlin carrying USS Cole.jpg", url: "https://commons.wikimedia.org/wiki/File:MV_Blue_Marlin_carrying_USS_Cole.jpg" },
    { title: "Wikimedia Commons: RFA Sir Tristram & MV Dan Lifter late 1982.JPG", url: "https://commons.wikimedia.org/wiki/File:RFA_Sir_Tristram_%26_MV_Dan_Lifter_late_1982.JPG" },
  ],
  "proc-vehicle-ship-hopper-dredger": [
    { title: "Wikipedia: Trailing suction hopper dredger", url: "https://en.wikipedia.org/wiki/Trailing_suction_hopper_dredger" },
    { title: "Wikimedia Commons: 1987 sucker-dredger Beaufort Sea.jpg", url: "https://commons.wikimedia.org/wiki/File:1987_sucker-dredger_Beaufort_Sea.jpg" },
  ],
  "proc-vehicle-ship-hurtigruten": [
    { title: "Wikimedia Commons: MS \"Richard With\" bei den Lofoten (2015).jpg", url: "https://commons.wikimedia.org/wiki/File:MS_%22Richard_With%22_bei_den_Lofoten_(2015).jpg" },
  ],
  "proc-vehicle-ship-icon": [
    { title: "Wikipedia: Icon of the Seas", url: "https://en.wikipedia.org/wiki/Icon_of_the_Seas" },
    { title: "Wikimedia Commons: Icon of the Seas Puerto Rico 2025 (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Icon_of_the_Seas_Puerto_Rico_2025_(cropped).jpg" },
  ],
  "proc-vehicle-ship-ideal-x": [
    { title: "Wikipedia: SS Ideal X", url: "https://en.wikipedia.org/wiki/SS_Ideal_X" },
    { title: "Wikimedia Commons: Ideal X.jpg", url: "https://commons.wikimedia.org/wiki/File:Ideal_X.jpg" },
    { title: "Wikimedia Commons: Type T2-SE-A1 tanker Hat Creek underway at sea on 16 August 1943.jpg", url: "https://commons.wikimedia.org/wiki/File:Type_T2-SE-A1_tanker_Hat_Creek_underway_at_sea_on_16_August_1943.jpg" },
  ],
  "proc-vehicle-ship-incat": [
    { title: "Wikimedia Commons: 1997 WP\u30b7\u30fc\u30d0\u30fc\u30c9.jpg", url: "https://commons.wikimedia.org/wiki/File:1997_WP%E3%82%B7%E3%83%BC%E3%83%90%E3%83%BC%E3%83%89.jpg" },
  ],
  "proc-vehicle-ship-jetfoil": [
    { title: "Wikipedia: Boeing 929 Jetfoil", url: "https://en.wikipedia.org/wiki/Boeing_929_Jetfoil" },
    { title: "Wikimedia Commons: 20091105-TurboJET Urzela.jpg", url: "https://commons.wikimedia.org/wiki/File:20091105-TurboJET_Urzela.jpg" },
  ],
  "proc-vehicle-ship-jp-overnight-ferry": [
    { title: "Wikimedia Commons: \u5927\u962a\u6e2f\u3055\u3093\u3075\u3089\u308f\u3042FT \u521d\u5165\u6e2f.jpg", url: "https://commons.wikimedia.org/wiki/File:%E5%A4%A7%E9%98%AA%E6%B8%AF%E3%81%95%E3%82%93%E3%81%B5%E3%82%89%E3%82%8F%E3%81%82FT_%E5%88%9D%E5%85%A5%E6%B8%AF.jpg" },
  ],
  "proc-vehicle-ship-junk": [
    { title: "Wikipedia: Junk (ship)", url: "https://en.wikipedia.org/wiki/Junk_(ship)" },
    { title: "Wikimedia Commons: Chinese Junk 1848 SLNSW FL8637336.jpg", url: "https://commons.wikimedia.org/wiki/File:Chinese_Junk_1848_SLNSW_FL8637336.jpg" },
  ],
  "proc-vehicle-ship-kettuvallam": [
    { title: "Wikipedia: Kettuvallam", url: "https://en.wikipedia.org/wiki/Kettuvallam" },
    { title: "Wikimedia Commons: Alappuzha Boat Beauty W.jpg", url: "https://commons.wikimedia.org/wiki/File:Alappuzha_Boat_Beauty_W.jpg" },
  ],
  "proc-vehicle-ship-laker": [
    { title: "Wikipedia: Lake freighter", url: "https://en.wikipedia.org/wiki/Lake_freighter" },
    { title: "Wikimedia Commons: AMAnderson.jpg", url: "https://commons.wikimedia.org/wiki/File:AMAnderson.jpg" },
    { title: "Wikimedia Commons: Edmund Fitzgerald, 1971, 3 of 4 (restored; cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Edmund_Fitzgerald,_1971,_3_of_4_(restored;_cropped).jpg" },
  ],
  "proc-vehicle-ship-liberty": [
    { title: "Wikipedia: Liberty ship", url: "https://en.wikipedia.org/wiki/Liberty_ship" },
    { title: "Wikimedia Commons: JeremiahO'Brienbow27may07.jpg", url: "https://commons.wikimedia.org/wiki/File:JeremiahO%27Brienbow27may07.jpg" },
    { title: "Wikimedia Commons: Jeremiah O.Brien 2022-c.jpg", url: "https://commons.wikimedia.org/wiki/File:Jeremiah_O.Brien_2022-c.jpg" },
  ],
  "proc-vehicle-ship-lng-moss": [
    { title: "Wikipedia: LNG carrier", url: "https://en.wikipedia.org/wiki/LNG_carrier" },
    { title: "Wikimedia Commons: 2023-05-20 02 LNG tanker, GULF ENERGY - IMO 7390143.jpg", url: "https://commons.wikimedia.org/wiki/File:2023-05-20_02_LNG_tanker,_GULF_ENERGY_-_IMO_7390143.jpg" },
    { title: "Wikimedia Commons: LNG Carrier DSME.jpg", url: "https://commons.wikimedia.org/wiki/File:LNG_Carrier_DSME.jpg" },
  ],
  "proc-vehicle-ship-lng-qmax": [
    { title: "Wikipedia: Q-Max", url: "https://en.wikipedia.org/wiki/Q-Max" },
    { title: "Wikimedia Commons: Mozah.JPG", url: "https://commons.wikimedia.org/wiki/File:Mozah.JPG" },
  ],
  "proc-vehicle-ship-lobster-boat": [
    { title: "Wikimedia Commons: Lobster boat in marina.jpg", url: "https://commons.wikimedia.org/wiki/File:Lobster_boat_in_marina.jpg" },
  ],
  "proc-vehicle-ship-longtail": [
    { title: "Wikipedia: Long-tail boat", url: "https://en.wikipedia.org/wiki/Long-tail_boat" },
    { title: "Wikimedia Commons: Long-tail boat engine Ko Kai.jpg", url: "https://commons.wikimedia.org/wiki/File:Long-tail_boat_engine_Ko_Kai.jpg" },
  ],
  "proc-vehicle-ship-lpg-carrier": [
    { title: "Wikipedia: Gas carrier", url: "https://en.wikipedia.org/wiki/Gas_carrier" },
    { title: "Wikimedia Commons: Gaschem J\u00fcmme.jpg", url: "https://commons.wikimedia.org/wiki/File:Gaschem_J%C3%BCmme.jpg" },
  ],
  "proc-vehicle-ship-manly-freshwater": [
    { title: "Wikipedia: Freshwater-class ferry", url: "https://en.wikipedia.org/wiki/Freshwater-class_ferry" },
    { title: "Wikimedia Commons: Collaroy Construction.jpg", url: "https://commons.wikimedia.org/wiki/File:Collaroy_Construction.jpg" },
  ],
  "proc-vehicle-ship-msc-gulsun": [
    { title: "Wikipedia: MSC G\u00fcls\u00fcn", url: "https://en.wikipedia.org/wiki/MSC_G%C3%BCls%C3%BCn" },
    { title: "Wikimedia Commons: MSC G\u00dcLSUN (49165782991).jpg", url: "https://commons.wikimedia.org/wiki/File:MSC_G%C3%9CLSUN_(49165782991).jpg" },
    { title: "Wikimedia Commons: MSC G\u00dcLS\u00dcN (48675118678) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:MSC_G%C3%9CLS%C3%9CN_(48675118678)_(cropped).jpg" },
  ],
  "proc-vehicle-ship-narrowboat": [
    { title: "Wikipedia: Narrowboat", url: "https://en.wikipedia.org/wiki/Narrowboat" },
    { title: "Wikimedia Commons: 20110603 Regents Canal narrowboat London 49.jpg", url: "https://commons.wikimedia.org/wiki/File:20110603_Regents_Canal_narrowboat_London_49.jpg" },
  ],
  "proc-vehicle-ship-nile-cruiser": [
    { title: "Wikimedia Commons: Nile cruiser (3646491985).jpg", url: "https://commons.wikimedia.org/wiki/File:Nile_cruiser_(3646491985).jpg" },
  ],
  "proc-vehicle-ship-normandie": [
    { title: "Wikipedia: SS Normandie", url: "https://en.wikipedia.org/wiki/SS_Normandie" },
    { title: "Wikimedia Commons: Postal card of the ocean liner Normandie.jpg", url: "https://commons.wikimedia.org/wiki/File:Postal_card_of_the_ocean_liner_Normandie.jpg" },
  ],
  "proc-vehicle-ship-oasis": [
    { title: "Wikipedia: Oasis-class cruise ship", url: "https://en.wikipedia.org/wiki/Oasis-class_cruise_ship" },
    { title: "Wikimedia Commons: Allure of the Seas (ship, 2010) in Malaga (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:Allure_of_the_Seas_(ship,_2010)_in_Malaga_(cropped).jpg" },
  ],
  "proc-vehicle-ship-ocean-tug": [
    { title: "Wikipedia: Tugboat", url: "https://en.wikipedia.org/wiki/Tugboat" },
    { title: "Wikimedia Commons: Ship and Tugs Sydney 1942 slnsw.jpg", url: "https://commons.wikimedia.org/wiki/File:Ship_and_Tugs_Sydney_1942_slnsw.jpg" },
  ],
  "proc-vehicle-ship-olympic": [
    { title: "Wikipedia: RMS Olympic", url: "https://en.wikipedia.org/wiki/RMS_Olympic" },
    { title: "Wikimedia Commons: Olympic in New York cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:Olympic_in_New_York_cropped.jpg" },
  ],
  "proc-vehicle-ship-panamax-container": [
    { title: "Wikipedia: Panamax", url: "https://en.wikipedia.org/wiki/Panamax" },
    { title: "Wikimedia Commons: Container Ship CMA CGM Theodore Roosevelt in NY Harbor on Sept 7, 2017 (36415318053).jpg", url: "https://commons.wikimedia.org/wiki/File:Container_Ship_CMA_CGM_Theodore_Roosevelt_in_NY_Harbor_on_Sept_7,_2017_(36415318053).jpg" },
  ],
  "proc-vehicle-ship-pctc": [
    { title: "Wikipedia: Roll-on/roll-off", url: "https://en.wikipedia.org/wiki/Roll-on%2Froll-off" },
    { title: "Wikimedia Commons: BYD Hefei, Porto di Livorno, 2025.jpg", url: "https://commons.wikimedia.org/wiki/File:BYD_Hefei,_Porto_di_Livorno,_2025.jpg" },
  ],
  "proc-vehicle-ship-pilot-boat": [
    { title: "Wikipedia: Pilot boat", url: "https://en.wikipedia.org/wiki/Pilot_boat" },
    { title: "Wikimedia Commons: 2pilot-boats hg.jpg", url: "https://commons.wikimedia.org/wiki/File:2pilot-boats_hg.jpg" },
  ],
  "proc-vehicle-ship-polarstern": [
    { title: "Wikipedia: RV Polarstern", url: "https://en.wikipedia.org/wiki/RV_Polarstern" },
    { title: "Wikimedia Commons: Polarstern MOSAiC.jpg", url: "https://commons.wikimedia.org/wiki/File:Polarstern_MOSAiC.jpg" },
  ],
  "proc-vehicle-ship-product-tanker": [
    { title: "Wikipedia: Oil tanker", url: "https://en.wikipedia.org/wiki/Oil_tanker" },
    { title: "Wikimedia Commons: Demonstration against oil tankers on Canadian side of Peace Arch Park, 1970.jpg", url: "https://commons.wikimedia.org/wiki/File:Demonstration_against_oil_tankers_on_Canadian_side_of_Peace_Arch_Park,_1970.jpg" },
  ],
  "proc-vehicle-ship-purse-seiner": [
    { title: "Wikipedia: Seine fishing", url: "https://en.wikipedia.org/wiki/Seine_fishing" },
    { title: "Wikimedia Commons: Drum net seiner.jpg", url: "https://commons.wikimedia.org/wiki/File:Drum_net_seiner.jpg" },
  ],
  "proc-vehicle-ship-push-barge": [
    { title: "Wikipedia: Barge", url: "https://en.wikipedia.org/wiki/Barge" },
    { title: "Wikimedia Commons: Barge, River Thames - geograph.org.uk - 2099639.jpg", url: "https://commons.wikimedia.org/wiki/File:Barge,_River_Thames_-_geograph.org.uk_-_2099639.jpg" },
  ],
  "proc-vehicle-ship-queen-mary-2": [
    { title: "Wikipedia: Queen Mary 2", url: "https://en.wikipedia.org/wiki/Queen_Mary_2" },
    { title: "Wikimedia Commons: 20161001 Queen Mary Aerial 2.jpg", url: "https://commons.wikimedia.org/wiki/File:20161001_Queen_Mary_Aerial_2.jpg" },
  ],
  "proc-vehicle-ship-raketa": [
    { title: "Wikipedia: Raketa (hydrofoil)", url: "https://en.wikipedia.org/wiki/Raketa_(hydrofoil)" },
    { title: "Wikimedia Commons: Kstovo-Volga-Raketa-1380.jpg", url: "https://commons.wikimedia.org/wiki/File:Kstovo-Volga-Raketa-1380.jpg" },
  ],
  "proc-vehicle-ship-reefer": [
    { title: "Wikipedia: Reefer ship", url: "https://en.wikipedia.org/wiki/Reefer_ship" },
    { title: "Wikimedia Commons: BALTIC JASMINE.jpg", url: "https://commons.wikimedia.org/wiki/File:BALTIC_JASMINE.jpg" },
  ],
  "proc-vehicle-ship-rhine-tanker": [
    { title: "Wikipedia: Barge", url: "https://en.wikipedia.org/wiki/Barge" },
    { title: "Wikimedia Commons: AWB Rajawali Natuna.jpg", url: "https://commons.wikimedia.org/wiki/File:AWB_Rajawali_Natuna.jpg" },
  ],
  "proc-vehicle-ship-riva-aquarama": [
    { title: "Wikipedia: Riva Aquarama", url: "https://en.wikipedia.org/wiki/Riva_Aquarama" },
    { title: "Wikimedia Commons: Riva 'Gorgeous' Stern.JPG", url: "https://commons.wikimedia.org/wiki/File:Riva_%27Gorgeous%27_Stern.JPG" },
  ],
  "proc-vehicle-ship-river-cruise": [
    { title: "Wikipedia: River cruise", url: "https://en.wikipedia.org/wiki/River_cruise" },
    { title: "Wikimedia Commons: Ganges Voyger Cruise Ship near Hooghly Imambara 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Ganges_Voyger_Cruise_Ship_near_Hooghly_Imambara_1.jpg" },
  ],
  "proc-vehicle-ship-rnli-shannon": [
    { title: "Wikipedia: Shannon-class lifeboat", url: "https://en.wikipedia.org/wiki/Shannon-class_lifeboat" },
    { title: "Wikimedia Commons: Barmouth lifeboat Ella Larsen.jpg", url: "https://commons.wikimedia.org/wiki/File:Barmouth_lifeboat_Ella_Larsen.jpg" },
  ],
  "proc-vehicle-ship-roro": [
    { title: "Wikipedia: Roll-on/roll-off", url: "https://en.wikipedia.org/wiki/Roll-on%2Froll-off" },
    { title: "Wikimedia Commons: RoRoVera(gwz).jpg", url: "https://commons.wikimedia.org/wiki/File:RoRoVera(gwz).jpg" },
    { title: "Wikimedia Commons: Roll-On Roll-Off (RO-RO) ship, starboard ramp.jpg", url: "https://commons.wikimedia.org/wiki/File:Roll-On_Roll-Off_(RO-RO)_ship,_starboard_ramp.jpg" },
  ],
  "proc-vehicle-ship-sailing-yacht": [
    { title: "Wikipedia: Sloop", url: "https://en.wikipedia.org/wiki/Sloop" },
    { title: "Wikimedia Commons: Bermudian sloops racing.jpg", url: "https://commons.wikimedia.org/wiki/File:Bermudian_sloops_racing.jpg" },
  ],
  "proc-vehicle-ship-sampan": [
    { title: "Wikipedia: Sampan", url: "https://en.wikipedia.org/wiki/Sampan" },
    { title: "Wikimedia Commons: Indonesian Sampan.jpg", url: "https://commons.wikimedia.org/wiki/File:Indonesian_Sampan.jpg" },
  ],
  "proc-vehicle-ship-seawise-giant": [
    { title: "Wikipedia: Seawise Giant", url: "https://en.wikipedia.org/wiki/Seawise_Giant" },
    { title: "Wikimedia Commons: \"Seawise Giant\" - Singapore, 1990.jpg", url: "https://commons.wikimedia.org/wiki/File:%22Seawise_Giant%22_-_Singapore,_1990.jpg" },
  ],
  "proc-vehicle-ship-sedov": [
    { title: "Wikimedia Commons: Sedov, Gdynia, 20090705, 3.jpg", url: "https://commons.wikimedia.org/wiki/File:Sedov,_Gdynia,_20090705,_3.jpg" },
  ],
  "proc-vehicle-ship-self-unloader": [
    { title: "Wikimedia Commons: CarlDBradley ship.jpg", url: "https://commons.wikimedia.org/wiki/File:CarlDBradley_ship.jpg" },
  ],
  "proc-vehicle-ship-shrimp-trawler": [
    { title: "Wikipedia: Trawling", url: "https://en.wikipedia.org/wiki/Trawling" },
    { title: "Wikimedia Commons: Shrimp boats tow fire-resistant oil-containment boom in Gulf of Mexico 2010-05-03 1.jpg", url: "https://commons.wikimedia.org/wiki/File:Shrimp_boats_tow_fire-resistant_oil-containment_boom_in_Gulf_of_Mexico_2010-05-03_1.jpg" },
  ],
  "proc-vehicle-ship-srn4": [
    { title: "Wikipedia: SR.N4", url: "https://en.wikipedia.org/wiki/SR.N4" },
    { title: "Wikimedia Commons: BHC SR.N4 GH-2004.jpg", url: "https://commons.wikimedia.org/wiki/File:BHC_SR.N4_GH-2004.jpg" },
  ],
  "proc-vehicle-ship-ss-great-britain": [
    { title: "Wikipedia: SS Great Britain", url: "https://en.wikipedia.org/wiki/SS_Great_Britain" },
    { title: "Wikimedia Commons: Bristol MMB 43 SS Great Britain.jpg", url: "https://commons.wikimedia.org/wiki/File:Bristol_MMB_43_SS_Great_Britain.jpg" },
  ],
  "proc-vehicle-ship-ss-united-states": [
    { title: "Wikipedia: SS United States", url: "https://en.wikipedia.org/wiki/SS_United_States" },
    { title: "Wikimedia Commons: \"United States\" - Hampton Roads, 1989.jpg", url: "https://commons.wikimedia.org/wiki/File:%22United_States%22_-_Hampton_Roads,_1989.jpg" },
  ],
  "proc-vehicle-ship-star-ferry": [
    { title: "Wikipedia: Star Ferry", url: "https://en.wikipedia.org/wiki/Star_Ferry" },
    { title: "Wikimedia Commons: CELESTIAL STAR.JPG", url: "https://commons.wikimedia.org/wiki/File:CELESTIAL_STAR.JPG" },
  ],
  "proc-vehicle-ship-staten-island": [
    { title: "Wikipedia: Staten Island Ferry", url: "https://en.wikipedia.org/wiki/Staten_Island_Ferry" },
    { title: "Wikimedia Commons: Spirit of America - Staten Island Ferry.jpg", url: "https://commons.wikimedia.org/wiki/File:Spirit_of_America_-_Staten_Island_Ferry.jpg" },
  ],
  "proc-vehicle-ship-stena-hss": [
    { title: "Wikipedia: HSS 1500", url: "https://en.wikipedia.org/wiki/HSS_1500" },
    { title: "Wikimedia Commons: StenaLine-StenaExplorer-DunLoaghaire-2008-04-07 5.jpg", url: "https://commons.wikimedia.org/wiki/File:StenaLine-StenaExplorer-DunLoaghaire-2008-04-07_5.jpg" },
  ],
  "proc-vehicle-ship-stern-trawler": [
    { title: "Wikipedia: Trawler", url: "https://en.wikipedia.org/wiki/Trawler" },
    { title: "Wikimedia Commons: Two trawlers in S\u00e8te.jpg", url: "https://commons.wikimedia.org/wiki/File:Two_trawlers_in_S%C3%A8te.jpg" },
  ],
  "proc-vehicle-ship-sternwheeler": [
    { title: "Wikipedia: Paddle steamer", url: "https://en.wikipedia.org/wiki/Paddle_steamer" },
    { title: "Wikimedia Commons: Great Eastern painting smooth sea-2.jpg", url: "https://commons.wikimedia.org/wiki/File:Great_Eastern_painting_smooth_sea-2.jpg" },
  ],
  "proc-vehicle-ship-superyacht": [
    { title: "Wikipedia: Superyacht", url: "https://en.wikipedia.org/wiki/Superyacht" },
    { title: "Wikimedia Commons: Nord IMO 9853785 S Hamburg 19-09-2021.jpg", url: "https://commons.wikimedia.org/wiki/File:Nord_IMO_9853785_S_Hamburg_19-09-2021.jpg" },
  ],
  "proc-vehicle-ship-supply-vessel": [
    { title: "Wikipedia: Platform supply vessel", url: "https://en.wikipedia.org/wiki/Platform_supply_vessel" },
    { title: "Wikimedia Commons: Crane testing bags on an offshore support vessel.jpg", url: "https://commons.wikimedia.org/wiki/File:Crane_testing_bags_on_an_offshore_support_vessel.jpg" },
  ],
  "proc-vehicle-ship-swiss-paddle": [
    { title: "Wikipedia: Paddle steamer", url: "https://en.wikipedia.org/wiki/Paddle_steamer" },
    { title: "Wikimedia Commons: Dampfschiff Stadt Luzern 1928.jpg", url: "https://commons.wikimedia.org/wiki/File:Dampfschiff_Stadt_Luzern_1928.jpg" },
  ],
  "proc-vehicle-ship-sydney-first-fleet": [
    { title: "Wikipedia: First Fleet-class ferry", url: "https://en.wikipedia.org/wiki/First_Fleet-class_ferry" },
    { title: "Wikimedia Commons: First Fleet-class ferry MV Alexander.jpg", url: "https://commons.wikimedia.org/wiki/File:First_Fleet-class_ferry_MV_Alexander.jpg" },
  ],
  "proc-vehicle-ship-tallink-megastar": [
    { title: "Wikipedia: MS Megastar", url: "https://en.wikipedia.org/wiki/MS_Megastar" },
    { title: "Wikimedia Commons: Megastar departing Tallinn 1 February 2017.jpg", url: "https://commons.wikimedia.org/wiki/File:Megastar_departing_Tallinn_1_February_2017.jpg" },
  ],
  "proc-vehicle-ship-thames-barge": [
    { title: "Wikipedia: Thames sailing barge", url: "https://en.wikipedia.org/wiki/Thames_sailing_barge" },
    { title: "Wikimedia Commons: Barge Race - geograph.org.uk - 595188.jpg", url: "https://commons.wikimedia.org/wiki/File:Barge_Race_-_geograph.org.uk_-_595188.jpg" },
  ],
  "proc-vehicle-ship-towboat": [
    { title: "Wikipedia: Pusher (boat)", url: "https://en.wikipedia.org/wiki/Pusher_(boat)" },
    { title: "Wikimedia Commons: Tow boat La Crosse.jpg", url: "https://commons.wikimedia.org/wiki/File:Tow_boat_La_Crosse.jpg" },
  ],
  "proc-vehicle-ship-triple-e": [
    { title: "Wikipedia: Triple E-class container ship", url: "https://en.wikipedia.org/wiki/Triple_E-class_container_ship" },
    { title: "Wikimedia Commons: MANILA MAERSK at Hamburg.jpg", url: "https://commons.wikimedia.org/wiki/File:MANILA_MAERSK_at_Hamburg.jpg" },
    { title: "Wikimedia Commons: Maersk Majestic.jpg", url: "https://commons.wikimedia.org/wiki/File:Maersk_Majestic.jpg" },
  ],
  "proc-vehicle-ship-valemax": [
    { title: "Wikipedia: Valemax", url: "https://en.wikipedia.org/wiki/Valemax" },
    { title: "Wikimedia Commons: Vale Dalian shipyard 20111226.jpg", url: "https://commons.wikimedia.org/wiki/File:Vale_Dalian_shipyard_20111226.jpg" },
    { title: "Wikimedia Commons: Vale Rio de Janeiro 20120108 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Vale_Rio_de_Janeiro_20120108_01.jpg" },
  ],
  "proc-vehicle-ship-vaporetto": [
    { title: "Wikipedia: Vaporetto", url: "https://en.wikipedia.org/wiki/Vaporetto" },
    { title: "Wikimedia Commons: ACTV 31 at Fondaco dei Tedeschi.jpg", url: "https://commons.wikimedia.org/wiki/File:ACTV_31_at_Fondaco_dei_Tedeschi.jpg" },
  ],
  "proc-vehicle-ship-victory": [
    { title: "Wikipedia: Victory ship", url: "https://en.wikipedia.org/wiki/Victory_ship" },
    { title: "Wikimedia Commons: RedOakVictory-2013-07-20.jpg", url: "https://commons.wikimedia.org/wiki/File:RedOakVictory-2013-07-20.jpg" },
    { title: "Wikimedia Commons: SS AMERICAN VICTORY.JPG", url: "https://commons.wikimedia.org/wiki/File:SS_AMERICAN_VICTORY.JPG" },
  ],
  "proc-vehicle-ship-viking-longship": [
    { title: "Wikipedia: Longship", url: "https://en.wikipedia.org/wiki/Longship" },
    { title: "Wikimedia Commons: DRAKEN HARALD H\u00c5RFAGRE. 9. BORDGANG SNART P\u00c5 PLASS.jpg", url: "https://commons.wikimedia.org/wiki/File:DRAKEN_HARALD_H%C3%85RFAGRE._9._BORDGANG_SNART_P%C3%85_PLASS.jpg" },
  ],
  "proc-vehicle-ship-vlcc": [
    { title: "Wikipedia: Oil tanker", url: "https://en.wikipedia.org/wiki/Oil_tanker" },
    { title: "Wikimedia Commons: Oil pump on an oil tanker.jpg", url: "https://commons.wikimedia.org/wiki/File:Oil_pump_on_an_oil_tanker.jpg" },
  ],
  "proc-vehicle-ship-volga-don": [
    { title: "Wikimedia Commons: Volgo-Don 191 in Butakovskiy Gulf 2016-05-12 Pic 02.JPG", url: "https://commons.wikimedia.org/wiki/File:Volgo-Don_191_in_Butakovskiy_Gulf_2016-05-12_Pic_02.JPG" },
  ],
  "proc-vehicle-ship-voyaging-canoe": [
    { title: "Wikipedia: H\u014dk\u016ble\u02bba", url: "https://en.wikipedia.org/wiki/H%C5%8Dk%C5%ABle%CA%BBa" },
    { title: "Wikimedia Commons: Compartmenthokuleadazeee.jpg", url: "https://commons.wikimedia.org/wiki/File:Compartmenthokuleadazeee.jpg" },
  ],
  "proc-vehicle-ship-wsf-jumbo": [
    { title: "Wikipedia: Jumbo Mark-II-class ferry", url: "https://en.wikipedia.org/wiki/Jumbo_Mark-II-class_ferry" },
    { title: "Wikimedia Commons: MV Tacoma in Puget Sound.jpg", url: "https://en.wikipedia.org/wiki/File:MV_Tacoma_in_Puget_Sound.jpg" },
  ],
  "proc-vehicle-ship-yangtze-cargo": [
    { title: "Wikipedia: Yangtze", url: "https://en.wikipedia.org/wiki/Yangtze" },
    { title: "Wikimedia Commons: Yangtze-Ships.JPG", url: "https://commons.wikimedia.org/wiki/File:Yangtze-Ships.JPG" },
  ],
  "proc-vehicle-siemens-avenio": [
    { title: "Wikipedia: Siemens Avenio", url: "https://en.wikipedia.org/wiki/Siemens_Avenio" },
    { title: "Wikimedia Commons: J27 443 Siemens Avenio f\u00fcr Doha.jpg", url: "https://commons.wikimedia.org/wiki/File:J27_443_Siemens_Avenio_f%C3%BCr_Doha.jpg" },
  ],
  "proc-vehicle-siemens-combino": [
    { title: "Wikipedia: Siemens Combino", url: "https://en.wikipedia.org/wiki/Siemens_Combino" },
    { title: "Wikimedia Commons: Basel combino (1192395101).jpg", url: "https://commons.wikimedia.org/wiki/File:Basel_combino_(1192395101).jpg" },
    { title: "Wikimedia Commons: Combino Erfurt1.JPG", url: "https://commons.wikimedia.org/wiki/File:Combino_Erfurt1.JPG" },
  ],
  "proc-vehicle-siemens-combino-supra": [
    { title: "Wikipedia: Siemens Avenio", url: "https://en.wikipedia.org/wiki/Siemens_Avenio" },
    { title: "Wikimedia Commons: Budapest, Corvin-negyed, villamos, 2.jpg", url: "https://commons.wikimedia.org/wiki/File:Budapest,_Corvin-negyed,_villamos,_2.jpg" },
  ],
  "proc-vehicle-siemens-s70": [
    { title: "Wikipedia: Siemens S700 and S70", url: "https://en.wikipedia.org/wiki/Siemens_S700_and_S70" },
    { title: "Wikimedia Commons: Atlanta Streetcar arriving at King Memorial Stop.jpg", url: "https://commons.wikimedia.org/wiki/File:Atlanta_Streetcar_arriving_at_King_Memorial_Stop.jpg" },
  ],
  "proc-vehicle-siemens-ulf": [
    { title: "Wikimedia Commons: Tramwien ulfA rennerring.jpg", url: "https://commons.wikimedia.org/wiki/File:Tramwien_ulfA_rennerring.jpg" },
  ],
  "proc-vehicle-sikorsky-s92": [
    { title: "Wikipedia: Sikorsky S-92", url: "https://en.wikipedia.org/wiki/Sikorsky_S-92" },
    { title: "Wikimedia Commons: Anduki Airfield 15 October 2022 08.jpg", url: "https://commons.wikimedia.org/wiki/File:Anduki_Airfield_15_October_2022_08.jpg" },
  ],
  "proc-vehicle-singapore-double-deck": [
    { title: "Wikipedia: MAN Lion's City", url: "https://en.wikipedia.org/wiki/MAN_Lion's_City" },
    { title: "Wikimedia Commons: KMB MAN ND323F (A95) 12m (Gemilang Coachwork Bodywork) (51839562546).jpg", url: "https://commons.wikimedia.org/wiki/File:KMB_MAN_ND323F_(A95)_12m_(Gemilang_Coachwork_Bodywork)_(51839562546).jpg" },
    { title: "Wikimedia Commons: SBS Transit MAN A95 (SG5999Z) on Service 7.jpg", url: "https://commons.wikimedia.org/wiki/File:SBS_Transit_MAN_A95_(SG5999Z)_on_Service_7.jpg" },
  ],
  "proc-vehicle-sinotruk-howo": [
    { title: "Wikimedia Commons: Royal Thai Army, Sinotruk Howo 6x6 tractor unit..jpg", url: "https://commons.wikimedia.org/wiki/File:Royal_Thai_Army,_Sinotruk_Howo_6x6_tractor_unit..jpg" },
  ],
  "proc-vehicle-skoda-10t": [
    { title: "Wikipedia: \u0160koda 10 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_10_T" },
    { title: "Wikimedia Commons: DCstreetcar test.JPG", url: "https://commons.wikimedia.org/wiki/File:DCstreetcar_test.JPG" },
    { title: "Wikimedia Commons: PortlandStreetcar5.jpg", url: "https://commons.wikimedia.org/wiki/File:PortlandStreetcar5.jpg" },
  ],
  "proc-vehicle-skoda-13t": [
    { title: "Wikipedia: \u0160koda 13 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_13_T" },
    { title: "Wikimedia Commons: Tram 13T Brno(1).jpg", url: "https://commons.wikimedia.org/wiki/File:Tram_13T_Brno(1).jpg" },
  ],
  "proc-vehicle-skoda-14t": [
    { title: "Wikipedia: \u0160koda 14 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_14_T" },
    { title: "Wikimedia Commons: Praha, Ko\u0161\u00ed\u0159e, Tram \u0160koda 14T.JPG", url: "https://commons.wikimedia.org/wiki/File:Praha,_Ko%C5%A1%C3%AD%C5%99e,_Tram_%C5%A0koda_14T.JPG" },
    { title: "Wikimedia Commons: Skoda 14T 9149.JPG", url: "https://commons.wikimedia.org/wiki/File:Skoda_14T_9149.JPG" },
  ],
  "proc-vehicle-skoda-14tr": [
    { title: "Wikipedia: \u0160koda 14Tr", url: "https://en.wikipedia.org/wiki/%C5%A0koda_14Tr" },
    { title: "Wikimedia Commons: Szeged 5-\u00f6s trolibusz V\u00e9rt\u00f3i \u00fat 2012-02-27 (2).JPG", url: "https://commons.wikimedia.org/wiki/File:Szeged_5-%C3%B6s_trolibusz_V%C3%A9rt%C3%B3i_%C3%BAt_2012-02-27_(2).JPG" },
  ],
  "proc-vehicle-skoda-15t": [
    { title: "Wikipedia: \u0160koda 15 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_15_T" },
    { title: "Wikimedia Commons: Karlovo n\u00e1m\u011bst\u00ed, \u0160koda 15T.jpg", url: "https://commons.wikimedia.org/wiki/File:Karlovo_n%C3%A1m%C4%9Bst%C3%AD,_%C5%A0koda_15T.jpg" },
    { title: "Wikimedia Commons: Palack\u00e9ho n\u00e1m\u011bst\u00ed, \u0160koda 15T.jpg", url: "https://commons.wikimedia.org/wiki/File:Palack%C3%A9ho_n%C3%A1m%C4%9Bst%C3%AD,_%C5%A0koda_15T.jpg" },
  ],
  "proc-vehicle-skoda-15tr": [
    { title: "Wikipedia: \u0160koda 15Tr", url: "https://en.wikipedia.org/wiki/%C5%A0koda_15Tr" },
    { title: "Wikimedia Commons: \u0160koda15trInTallinn.jpg", url: "https://commons.wikimedia.org/wiki/File:%C5%A0koda15trInTallinn.jpg" },
  ],
  "proc-vehicle-skoda-29t": [
    { title: "Wikipedia: \u0160koda 29 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_29_T" },
    { title: "Wikimedia Commons: \u0160koda-29-T.jpg", url: "https://commons.wikimedia.org/wiki/File:%C5%A0koda-29-T.jpg" },
    { title: "Wikimedia Commons: \u0160koda 29 T 7404 at Kr\u00ed\u017ena.jpg", url: "https://commons.wikimedia.org/wiki/File:%C5%A0koda_29_T_7404_at_Kr%C3%AD%C5%BEna.jpg" },
  ],
  "proc-vehicle-skoda-706-rt": [
    { title: "Wikimedia Commons: \u0160koda 706 RT file 02.jpg", url: "https://commons.wikimedia.org/wiki/File:%C5%A0koda_706_RT_file_02.jpg" },
  ],
  "proc-vehicle-skoda-706-rto": [
    { title: "Wikipedia: \u0160koda 706 RTO", url: "https://en.wikipedia.org/wiki/%C5%A0koda_706_RTO" },
    { title: "Wikimedia Commons: Brno, \u0158e\u010dkovice, depozit\u00e1\u0159 TMB, \u0160koda 706 RTO MEX \u010d. 128 (04).jpg", url: "https://commons.wikimedia.org/wiki/File:Brno,_%C5%98e%C4%8Dkovice,_depozit%C3%A1%C5%99_TMB,_%C5%A0koda_706_RTO_MEX_%C4%8D._128_(04).jpg" },
  ],
  "proc-vehicle-solaris-tramino": [
    { title: "Wikipedia: Solaris Tramino", url: "https://en.wikipedia.org/wiki/Solaris_Tramino" },
    { title: "Wikimedia Commons: Braunschweig Emsstra\u00dfe Solaris Tramino 1452.JPG", url: "https://commons.wikimedia.org/wiki/File:Braunschweig_Emsstra%C3%9Fe_Solaris_Tramino_1452.JPG" },
  ],
  "proc-vehicle-solaris-trollino": [
    { title: "Wikipedia: Solaris Trollino", url: "https://en.wikipedia.org/wiki/Solaris_Trollino" },
    { title: "Wikimedia Commons: Solaris Trollino 18AC - Gdynia03.jpg", url: "https://commons.wikimedia.org/wiki/File:Solaris_Trollino_18AC_-_Gdynia03.jpg" },
    { title: "Wikimedia Commons: SolarisT18InTallinn.jpg", url: "https://commons.wikimedia.org/wiki/File:SolarisT18InTallinn.jpg" },
  ],
  "proc-vehicle-solaris-urbino-12e": [
    { title: "Wikimedia Commons: Solaris Urbino 12 electric (2), Warszawa, 2015-08-06.jpg", url: "https://commons.wikimedia.org/wiki/File:Solaris_Urbino_12_electric_(2),_Warszawa,_2015-08-06.jpg" },
  ],
  "proc-vehicle-songthaew": [
    { title: "Wikipedia: Songthaew", url: "https://en.wikipedia.org/wiki/Songthaew" },
    { title: "Wikimedia Commons: Isuzu N-Series songthaew 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Isuzu_N-Series_songthaew_01.jpg" },
  ],
  "proc-vehicle-sor-nb12": [
    { title: "Wikipedia: SOR NB 12", url: "https://en.wikipedia.org/wiki/SOR_NB_12" },
    { title: "Wikimedia Commons: SOR NB 12 n\u00b03613 in Prague.JPG", url: "https://commons.wikimedia.org/wiki/File:SOR_NB_12_n%C2%B03613_in_Prague.JPG" },
    { title: "Wikimedia Commons: SOR TNB 12 3703, Brno, Srbsk\u00e1 02.jpg", url: "https://commons.wikimedia.org/wiki/File:SOR_TNB_12_3703,_Brno,_Srbsk%C3%A1_02.jpg" },
  ],
  "proc-vehicle-stadler-tango": [
    { title: "Wikipedia: Stadler Tango", url: "https://en.wikipedia.org/wiki/Stadler_Tango" },
    { title: "Wikimedia Commons: AB ABe 8-12 Tango auf dem Bahnhofplatz in St. Gallen (2026).jpg", url: "https://commons.wikimedia.org/wiki/File:AB_ABe_8-12_Tango_auf_dem_Bahnhofplatz_in_St._Gallen_(2026).jpg" },
    { title: "Wikimedia Commons: BLT Tango Batteriestrasse.jpg", url: "https://commons.wikimedia.org/wiki/File:BLT_Tango_Batteriestrasse.jpg" },
  ],
  "proc-vehicle-stadler-variobahn": [
    { title: "Wikipedia: Stadler Variobahn", url: "https://en.wikipedia.org/wiki/Stadler_Variobahn" },
    { title: "Wikimedia Commons: Bybanen23.juni2010.jpg", url: "https://commons.wikimedia.org/wiki/File:Bybanen23.juni2010.jpg" },
  ],
  "proc-vehicle-stanserhorn-cabrio": [
    { title: "Wikipedia: Stanserhorn", url: "https://en.wikipedia.org/wiki/Stanserhorn" },
    { title: "Wikimedia Commons: Cabriobahn.jpg", url: "https://commons.wikimedia.org/wiki/File:Cabriobahn.jpg" },
    { title: "Wikimedia Commons: Stanserhorn Seilbahn Cabriogondel 2.JPG", url: "https://commons.wikimedia.org/wiki/File:Stanserhorn_Seilbahn_Cabriogondel_2.JPG" },
  ],
  "proc-vehicle-star-266": [
    { title: "Wikipedia: Star 266", url: "https://en.wikipedia.org/wiki/Star_266" },
    { title: "Wikimedia Commons: STAR 266.jpg", url: "https://commons.wikimedia.org/wiki/File:STAR_266.jpg" },
  ],
  "proc-vehicle-steam-tram": [
    { title: "Wikipedia: Tram engine", url: "https://en.wikipedia.org/wiki/Tram_engine" },
    { title: "Wikimedia Commons: Bruehl Feuriger Elias.jpg", url: "https://commons.wikimedia.org/wiki/File:Bruehl_Feuriger_Elias.jpg" },
  ],
  "proc-vehicle-strasbourg-eurotram": [
    { title: "Wikipedia: Socimi Eurotram", url: "https://en.wikipedia.org/wiki/Socimi_Eurotram" },
    { title: "Wikimedia Commons: Bombardier Eurotram n\u00b01003 CTS Alt Winm\u00e4rik.jpg", url: "https://commons.wikimedia.org/wiki/File:Bombardier_Eurotram_n%C2%B01003_CTS_Alt_Winm%C3%A4rik.jpg" },
  ],
  "proc-vehicle-sugarloaf-bondinho": [
    { title: "Wikipedia: Sugarloaf Cable Car", url: "https://en.wikipedia.org/wiki/Sugarloaf_Cable_Car" },
    { title: "Wikimedia Commons: Bondinho do P\u00e3o de A\u00e7\u00facar by Diego Baravelli.jpg", url: "https://commons.wikimedia.org/wiki/File:Bondinho_do_P%C3%A3o_de_A%C3%A7%C3%BAcar_by_Diego_Baravelli.jpg" },
    { title: "Wikimedia Commons: Cable Car Coming Up to the Sugarloaf Mountain.jpg", url: "https://commons.wikimedia.org/wiki/File:Cable_Car_Coming_Up_to_the_Sugarloaf_Mountain.jpg" },
  ],
  "proc-vehicle-sukhoi-superjet": [
    { title: "Wikipedia: Yakovlev SJ-100", url: "https://en.wikipedia.org/wiki/Yakovlev_SJ-100" },
    { title: "Wikimedia Commons: Air-to-air photo of a Sukhoi Superjet 100 (97004) over Italy.jpg", url: "https://commons.wikimedia.org/wiki/File:Air-to-air_photo_of_a_Sukhoi_Superjet_100_(97004)_over_Italy.jpg" },
  ],
  "proc-vehicle-swiss-standard-tram": [
    { title: "Wikimedia Commons: S02 741 Bw Weissenb\u00fchl, Winterdiensttriebwagen 504.jpg", url: "https://commons.wikimedia.org/wiki/File:S02_741_Bw_Weissenb%C3%BChl,_Winterdiensttriebwagen_504.jpg" },
  ],
  "proc-vehicle-sydney-leyland-atlantean": [
    { title: "Wikipedia: Leyland Atlantean", url: "https://en.wikipedia.org/wiki/Leyland_Atlantean" },
    { title: "Wikimedia Commons: 1016 Leyland PDR1A-1 Atlantean in Junee.jpg", url: "https://commons.wikimedia.org/wiki/File:1016_Leyland_PDR1A-1_Atlantean_in_Junee.jpg" },
    { title: "Wikimedia Commons: Delaine Atlantean 2.jpg", url: "https://commons.wikimedia.org/wiki/File:Delaine_Atlantean_2.jpg" },
  ],
  "proc-vehicle-sydney-r-class": [
    { title: "Wikipedia: R-class Sydney tram", url: "https://en.wikipedia.org/wiki/R-class_Sydney_tram" },
    { title: "Wikimedia Commons: 1740 at Sydney Tramway Museum.jpg", url: "https://commons.wikimedia.org/wiki/File:1740_at_Sydney_Tramway_Museum.jpg" },
  ],
  "proc-vehicle-tata-lpt": [
    { title: "Wikimedia Commons: Horn OK Please Pune (4823687230).jpg", url: "https://commons.wikimedia.org/wiki/File:Horn_OK_Please_Pune_(4823687230).jpg" },
  ],
  "proc-vehicle-tata-starbus": [
    { title: "Wikipedia: Tata Starbus", url: "https://en.wikipedia.org/wiki/Tata_Starbus" },
    { title: "Wikimedia Commons: Tata Marcopolo Green Chandigarh Ind.jpg", url: "https://commons.wikimedia.org/wiki/File:Tata_Marcopolo_Green_Chandigarh_Ind.jpg" },
    { title: "Wikimedia Commons: Best cbd wad.jpg", url: "https://commons.wikimedia.org/wiki/File:Best_cbd_wad.jpg" },
  ],
  "proc-vehicle-tatra-148": [
    { title: "Wikipedia: Tatra 148", url: "https://en.wikipedia.org/wiki/Tatra_148" },
    { title: "Wikimedia Commons: 100RIES 02, Tatra 148 VS1.jpg", url: "https://commons.wikimedia.org/wiki/File:100RIES_02,_Tatra_148_VS1.jpg" },
  ],
  "proc-vehicle-tatra-500-hb": [
    { title: "Wikimedia Commons: Brno, \u0158e\u010dkovice, depozit\u00e1\u0159 TMB, DOD 2013, Tatra 500 HB (16).jpg", url: "https://commons.wikimedia.org/wiki/File:Brno,_%C5%98e%C4%8Dkovice,_depozit%C3%A1%C5%99_TMB,_DOD_2013,_Tatra_500_HB_(16).jpg" },
  ],
  "proc-vehicle-tatra-815": [
    { title: "Wikipedia: Tatra 815", url: "https://en.wikipedia.org/wiki/Tatra_815" },
    { title: "Wikimedia Commons: Tatra-815 6x6 shot 2010.JPG", url: "https://commons.wikimedia.org/wiki/File:Tatra-815_6x6_shot_2010.JPG" },
  ],
  "proc-vehicle-tatra-k2": [
    { title: "Wikipedia: Tatra K2", url: "https://en.wikipedia.org/wiki/Tatra_K2" },
    { title: "Wikimedia Commons: 100RIES 58.jpg", url: "https://commons.wikimedia.org/wiki/File:100RIES_58.jpg" },
    { title: "Wikimedia Commons: Brno, Komensk\u00e9ho n\u00e1m\u011bst\u00ed, Tatra K2YU \u010d. 1131.jpg", url: "https://commons.wikimedia.org/wiki/File:Brno,_Komensk%C3%A9ho_n%C3%A1m%C4%9Bst%C3%AD,_Tatra_K2YU_%C4%8D._1131.jpg" },
  ],
  "proc-vehicle-tatra-phoenix": [
    { title: "Wikipedia: Tatra Phoenix", url: "https://en.wikipedia.org/wiki/Tatra_Phoenix" },
    { title: "Wikimedia Commons: Tatra-158-Phoenix a LIAZ-19.33-SA KAMPA-Doln\u00ed-Brann\u00e1-0397.jpg", url: "https://commons.wikimedia.org/wiki/File:Tatra-158-Phoenix_a_LIAZ-19.33-SA_KAMPA-Doln%C3%AD-Brann%C3%A1-0397.jpg" },
  ],
  "proc-vehicle-tatra-t1": [
    { title: "Wikipedia: Tatra T1", url: "https://en.wikipedia.org/wiki/Tatra_T1" },
    { title: "Wikimedia Commons: Ostrava, Tatra T1 (4) cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:Ostrava,_Tatra_T1_(4)_cropped.jpg" },
  ],
  "proc-vehicle-tatra-t2": [
    { title: "Wikipedia: Tatra T2", url: "https://en.wikipedia.org/wiki/Tatra_T2" },
    { title: "Wikimedia Commons: Historical Tatra T2 tram in Prague.jpg", url: "https://commons.wikimedia.org/wiki/File:Historical_Tatra_T2_tram_in_Prague.jpg" },
    { title: "Wikimedia Commons: Plze\u0148, N\u00e1m\u011bst\u00ed Republiky, Tatra T2 cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:Plze%C5%88,_N%C3%A1m%C4%9Bst%C3%AD_Republiky,_Tatra_T2_cropped.jpg" },
  ],
  "proc-vehicle-tatra-t4": [
    { title: "Wikipedia: Tatra T4", url: "https://en.wikipedia.org/wiki/Tatra_T4" },
    { title: "Wikimedia Commons: 20180714 Leipzig 2107.jpg", url: "https://commons.wikimedia.org/wiki/File:20180714_Leipzig_2107.jpg" },
    { title: "Wikimedia Commons: 3321+3427(2017.07.06)-25- Tatra T4R (35623743411).jpg", url: "https://commons.wikimedia.org/wiki/File:3321%2B3427(2017.07.06)-25-_Tatra_T4R_(35623743411).jpg" },
  ],
  "proc-vehicle-tatra-t5c5": [
    { title: "Wikipedia: Tatra T5C5", url: "https://en.wikipedia.org/wiki/Tatra_T5C5" },
    { title: "Wikimedia Commons: 47-es villamos (4281) 2.jpg", url: "https://commons.wikimedia.org/wiki/File:47-es_villamos_(4281)_2.jpg" },
    { title: "Wikimedia Commons: Budapest Tram.jpg", url: "https://commons.wikimedia.org/wiki/File:Budapest_Tram.jpg" },
  ],
  "proc-vehicle-tesla-semi": [
    { title: "Wikipedia: Tesla Semi", url: "https://en.wikipedia.org/wiki/Tesla_Semi" },
    { title: "Wikimedia Commons: Tesla Semi 5.jpg", url: "https://commons.wikimedia.org/wiki/File:Tesla_Semi_5.jpg" },
  ],
  "proc-vehicle-thomas-saf-t-liner": [
    { title: "Wikipedia: Thomas Saf-T-Liner C2", url: "https://en.wikipedia.org/wiki/Thomas_Saf-T-Liner_C2" },
    { title: "Wikimedia Commons: Evolved Thomas C2.jpg", url: "https://commons.wikimedia.org/wiki/File:Evolved_Thomas_C2.jpg" },
    { title: "Wikimedia Commons: Thomas C2 rear.jpg", url: "https://commons.wikimedia.org/wiki/File:Thomas_C2_rear.jpg" },
  ],
  "proc-vehicle-titlis-rotair": [
    { title: "Wikipedia: Titlis", url: "https://en.wikipedia.org/wiki/Titlis" },
    { title: "Wikimedia Commons: Titlis Rotair.jpg", url: "https://commons.wikimedia.org/wiki/File:Titlis_Rotair.jpg" },
  ],
  "proc-vehicle-toei-9000": [
    { title: "Wikipedia: Toei 9000 series", url: "https://en.wikipedia.org/wiki/Toei_9000_series" },
    { title: "Wikimedia Commons: Toden-9001-9002-00.jpg", url: "https://commons.wikimedia.org/wiki/File:Toden-9001-9002-00.jpg" },
  ],
  "proc-vehicle-tokyu-300": [
    { title: "Wikipedia: Tokyu 300 series", url: "https://en.wikipedia.org/wiki/Tokyu_300_series" },
    { title: "Wikimedia Commons: Model 300-303 of Tokyo Kyuko Kabushikigaisha.JPG", url: "https://commons.wikimedia.org/wiki/File:Model_300-303_of_Tokyo_Kyuko_Kabushikigaisha.JPG" },
  ],
  "proc-vehicle-toronto-clrv": [
    { title: "Wikipedia: Canadian Light Rail Vehicle", url: "https://en.wikipedia.org/wiki/Canadian_Light_Rail_Vehicle" },
    { title: "Wikimedia Commons: 512 ROW at Avenue.jpg", url: "https://commons.wikimedia.org/wiki/File:512_ROW_at_Avenue.jpg" },
  ],
  "proc-vehicle-toronto-flexity": [
    { title: "Wikipedia: Flexity Outlook (Toronto)", url: "https://en.wikipedia.org/wiki/Flexity_Outlook_(Toronto)" },
    { title: "Wikimedia Commons: 20111110streetcar1.jpg", url: "https://commons.wikimedia.org/wiki/File:20111110streetcar1.jpg" },
  ],
  "proc-vehicle-toyama-portram": [
    { title: "Wikimedia Commons: MillionMemorialTLR0606.jpg", url: "https://commons.wikimedia.org/wiki/File:MillionMemorialTLR0606.jpg" },
  ],
  "proc-vehicle-toyota-coaster": [
    { title: "Wikipedia: Toyota Coaster", url: "https://en.wikipedia.org/wiki/Toyota_Coaster" },
    { title: "Wikimedia Commons: Totota Coaster GX XZB70.jpg", url: "https://commons.wikimedia.org/wiki/File:Toyota_Coaster_GX_XZB70.jpg" },
  ],
  "proc-vehicle-translohr": [
    { title: "Wikipedia: Translohr", url: "https://en.wikipedia.org/wiki/Translohr" },
    { title: "Wikimedia Commons: 2019 Medell\u00edn - Tranv\u00eda en la estaci\u00f3n Bicentenario.jpg", url: "https://commons.wikimedia.org/wiki/File:2019_Medell%C3%ADn_-_Tranv%C3%ADa_en_la_estaci%C3%B3n_Bicentenario.jpg" },
    { title: "Wikimedia Commons: 58,300 T6 Translohr n\u00b0622 par Cramos.JPG", url: "https://commons.wikimedia.org/wiki/File:58,300_T6_Translohr_n%C2%B0622_par_Cramos.JPG" },
  ],
  "proc-vehicle-transmilenio": [
    { title: "Wikipedia: TransMilenio", url: "https://en.wikipedia.org/wiki/TransMilenio" },
    { title: "Wikimedia Commons: Articulado de Transmilenio en el Eje Ambiental.JPG", url: "https://commons.wikimedia.org/wiki/File:Articulado_de_Transmilenio_en_el_Eje_Ambiental.JPG" },
  ],
  "proc-vehicle-trieste-opicina": [
    { title: "Wikipedia: Trieste\u2013Opicina tramway", url: "https://en.wikipedia.org/wiki/Trieste%E2%80%93Opicina_tramway" },
    { title: "Wikimedia Commons: Opicina Tramway (3980148206).jpg", url: "https://commons.wikimedia.org/wiki/File:Opicina_Tramway_(3980148206).jpg" },
  ],
  "proc-vehicle-tupolev-tu104": [
    { title: "Wikipedia: Tupolev Tu-104", url: "https://en.wikipedia.org/wiki/Tupolev_Tu-104" },
    { title: "Wikimedia Commons: Aeroflot Tupolev Tu-104A at Arlanda, July 1972.jpg", url: "https://commons.wikimedia.org/wiki/File:Aeroflot_Tupolev_Tu-104A_at_Arlanda,_July_1972.jpg" },
  ],
  "proc-vehicle-tupolev-tu134": [
    { title: "Wikipedia: Tupolev Tu-134", url: "https://en.wikipedia.org/wiki/Tupolev_Tu-134" },
    { title: "Wikimedia Commons: CCCP-45075 Tupolev Tu.124A ( Converted Into 1st Tu.134 Prototype ) (8019060107).jpg", url: "https://commons.wikimedia.org/wiki/File:CCCP-45075_Tupolev_Tu.124A_(_Converted_Into_1st_Tu.134_Prototype_)_(8019060107).jpg" },
  ],
  "proc-vehicle-tupolev-tu144": [
    { title: "Wikipedia: Tupolev Tu-144", url: "https://en.wikipedia.org/wiki/Tupolev_Tu-144" },
    { title: "Wikimedia Commons: 1973 06 Bourget TU144 (13).jpg", url: "https://commons.wikimedia.org/wiki/File:1973_06_Bourget_TU144_(13).jpg" },
    { title: "Wikimedia Commons: Aircraft Mig-21I under the wing of the plane Tu-144 (9678535680).jpg", url: "https://commons.wikimedia.org/wiki/File:Aircraft_Mig-21I_under_the_wing_of_the_plane_Tu-144_(9678535680).jpg" },
  ],
  "proc-vehicle-tupolev-tu154": [
    { title: "Wikipedia: Tupolev Tu-154", url: "https://en.wikipedia.org/wiki/Tupolev_Tu-154" },
    { title: "Wikimedia Commons: Air Koryo, Tupolev Tu-154B, P-552.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Koryo,_Tupolev_Tu-154B,_P-552.jpg" },
    { title: "Wikimedia Commons: Budapest, Aeropark M\u00fazeum, Tupolev-154 B-2 (HA-LCG), 3.jpg", url: "https://commons.wikimedia.org/wiki/File:Budapest,_Aeropark_M%C3%BAzeum,_Tupolev-154_B-2_(HA-LCG),_3.jpg" },
  ],
  "proc-vehicle-turin-2800": [
    { title: "Wikipedia: Trams in Turin", url: "https://en.wikipedia.org/wiki/Trams_in_Turin" },
    { title: "Wikimedia Commons: Torino, se\u011doj en ATM-2800-tramo, 1.jpeg", url: "https://commons.wikimedia.org/wiki/File:Torino,_se%C4%9Doj_en_ATM-2800-tramo,_1.jpeg" },
  ],
  "proc-vehicle-ud-quon": [
    { title: "Wikipedia: UD Quon", url: "https://en.wikipedia.org/wiki/UD_Quon" },
    { title: "Wikimedia Commons: Keisei-driving-school 120 Quon training-truck.jpg", url: "https://commons.wikimedia.org/wiki/File:Keisei-driving-school_120_Quon_training-truck.jpg" },
  ],
  "proc-vehicle-ural-4320": [
    { title: "Wikipedia: Ural-4320", url: "https://en.wikipedia.org/wiki/Ural-4320" },
    { title: "Wikimedia Commons: Ural-4320-armoured-Russian Army.jpg", url: "https://commons.wikimedia.org/wiki/File:Ural-4320-armoured-Russian_Army.jpg" },
  ],
  "proc-vehicle-van-hool-a330": [
    { title: "Wikipedia: Van Hool", url: "https://en.wikipedia.org/wiki/Van_Hool" },
    { title: "Wikimedia Commons: Van Hool A330 7214 auto-\u00e9cole.jpg", url: "https://commons.wikimedia.org/wiki/File:Van_Hool_A330_7214_auto-%C3%A9cole.jpg" },
  ],
  "proc-vehicle-van-hool-astromega": [
    { title: "Wikimedia Commons: DATTCO Van Hool Astromega coach.jpg", url: "https://commons.wikimedia.org/wiki/File:DATTCO_Van_Hool_Astromega_coach.jpg" },
    { title: "Wikimedia Commons: Hato Bus 793 'O Sola Mio Astromega.jpg", url: "https://commons.wikimedia.org/wiki/File:Hato_Bus_793_%27O_Sola_Mio_Astromega.jpg" },
  ],
  "proc-vehicle-van-hool-exquicity": [
    { title: "Wikipedia: Van Hool", url: "https://en.wikipedia.org/wiki/Van_Hool" },
    { title: "Wikimedia Commons: Van Hool ExquiCity 24 METTIS n\u00b01315 P+R Woippy.jpg", url: "https://commons.wikimedia.org/wiki/File:Van_Hool_ExquiCity_24_METTIS_n%C2%B01315_P%2BR_Woippy.jpg" },
  ],
  "proc-vehicle-vanoise-express": [
    { title: "Wikipedia: Vanoise Express", url: "https://en.wikipedia.org/wiki/Vanoise_Express" },
    { title: "Wikimedia Commons: Vanoise Express.jpg", url: "https://commons.wikimedia.org/wiki/File:Vanoise_Express.jpg" },
    { title: "Wikimedia Commons: Vanoise Express 2.jpg", url: "https://commons.wikimedia.org/wiki/File:Vanoise_Express_2.jpg" },
  ],
  "proc-vehicle-vario-lf": [
    { title: "Wikimedia Commons: Vario LF2+.JPG", url: "https://commons.wikimedia.org/wiki/File:Vario_LF2%2B.JPG" },
    { title: "Wikimedia Commons: Vario LF2.E 1401.jpg", url: "https://commons.wikimedia.org/wiki/File:Vario_LF2.E_1401.jpg" },
  ],
  "proc-vehicle-vdl-citea": [
    { title: "Wikipedia: VDL Citea", url: "https://en.wikipedia.org/wiki/VDL_Citea" },
    { title: "Wikimedia Commons: Nobina 845 VDL-Citea LLE-120 Rautatientorilla linjalla 55.jpg", url: "https://commons.wikimedia.org/wiki/File:Nobina_845_VDL-Citea_LLE-120_Rautatientorilla_linjalla_55.jpg" },
    { title: "Wikimedia Commons: VDL Citea SLF-120 Electric in Nes (Ameland).jpg", url: "https://commons.wikimedia.org/wiki/File:VDL_Citea_SLF-120_Electric_in_Nes_(Ameland).jpg" },
  ],
  "proc-vehicle-vickers-vc10": [
    { title: "Wikipedia: Vickers VC10", url: "https://en.wikipedia.org/wiki/Vickers_VC10" },
    { title: "Wikimedia Commons: BAC Super VC10 (48866255332).jpg", url: "https://commons.wikimedia.org/wiki/File:BAC_Super_VC10_(48866255332).jpg" },
  ],
  "proc-vehicle-vickers-viscount": [
    { title: "Wikipedia: Vickers Viscount", url: "https://en.wikipedia.org/wiki/Vickers_Viscount" },
    { title: "Wikimedia Commons: Air Zimbabwe Viscount 1981.jpg", url: "https://commons.wikimedia.org/wiki/File:Air_Zimbabwe_Viscount_1981.jpg" },
  ],
  "proc-vehicle-vienna-e1": [
    { title: "Wikimedia Commons: Wien I Karlsplatz Type E1 4866 26.09.20 JM.jpg", url: "https://commons.wikimedia.org/wiki/File:Wien_I_Karlsplatz_Type_E1_4866_26.09.20_JM.jpg" },
  ],
  "proc-vehicle-vienna-flexity": [
    { title: "Wikimedia Commons: Wien Flexity - tram type D (1).jpg", url: "https://commons.wikimedia.org/wiki/File:Wien_Flexity_-_tram_type_D_(1).jpg" },
  ],
  "proc-vehicle-vityaz-m": [
    { title: "Wikimedia Commons: 71-931M in row.jpg", url: "https://commons.wikimedia.org/wiki/File:71-931M_in_row.jpg" },
  ],
  "proc-vehicle-volgren-optimus": [
    { title: "Wikipedia: Volgren", url: "https://en.wikipedia.org/wiki/Volgren" },
    { title: "Wikimedia Commons: Brisbane Transport Volgren CR224L bodied Scania L94UB CNG.jpg", url: "https://commons.wikimedia.org/wiki/File:Brisbane_Transport_Volgren_CR224L_bodied_Scania_L94UB_CNG.jpg" },
    { title: "Wikimedia Commons: Volgren Toei.jpg", url: "https://commons.wikimedia.org/wiki/File:Volgren_Toei.jpg" },
  ],
  "proc-vehicle-volvo-7900e": [
    { title: "Wikipedia: Volvo 7900", url: "https://en.wikipedia.org/wiki/Volvo_7900" },
    { title: "Wikimedia Commons: Hamburg Hochbahn 7479.jpg", url: "https://commons.wikimedia.org/wiki/File:Hamburg_Hochbahn_7479.jpg" },
    { title: "Wikimedia Commons: BJ63 UJZ on route 9.jpg", url: "https://commons.wikimedia.org/wiki/File:BJ63_UJZ_on_route_9.jpg" },
  ],
  "proc-vehicle-volvo-9700": [
    { title: "Wikipedia: Volvo 9700", url: "https://en.wikipedia.org/wiki/Volvo_9700" },
    { title: "Wikimedia Commons: Savonlinja Volvo B7R 9700S.jpg", url: "https://commons.wikimedia.org/wiki/File:Savonlinja_Volvo_B7R_9700S.jpg" },
    { title: "Wikimedia Commons: Volvo9700H-UG-B11R-Busworld2013.jpg", url: "https://commons.wikimedia.org/wiki/File:Volvo9700H-UG-B11R-Busworld2013.jpg" },
  ],
  "proc-vehicle-volvo-f88": [
    { title: "Wikipedia: Volvo F88", url: "https://en.wikipedia.org/wiki/Volvo_F88" },
    { title: "Wikimedia Commons: 1975 Volvo F88 (PDN 285P) articulated low loader, 2012 HCVS Tyne-Tees Run.jpg", url: "https://commons.wikimedia.org/wiki/File:1975_Volvo_F88_(PDN_285P)_articulated_low_loader,_2012_HCVS_Tyne-Tees_Run.jpg" },
    { title: "Wikimedia Commons: WOV24 29 - Volvo F88.jpg", url: "https://commons.wikimedia.org/wiki/File:WOV24_29_-_Volvo_F88.jpg" },
  ],
  "proc-vehicle-volvo-fh16": [
    { title: "Wikipedia: Volvo FH", url: "https://en.wikipedia.org/wiki/Volvo_FH" },
    { title: "Wikimedia Commons: Volvo FH16 750 mit Saugbaggeraufbau.jpg", url: "https://commons.wikimedia.org/wiki/File:Volvo_FH16_750_mit_Saugbaggeraufbau.jpg" },
    { title: "Wikimedia Commons: Volvo FH16 tow truck, Nufam 2023, Rheinstetten (P1130808).jpg", url: "https://commons.wikimedia.org/wiki/File:Volvo_FH16_tow_truck,_Nufam_2023,_Rheinstetten_(P1130808).jpg" },
  ],
  "proc-vehicle-volvo-fmx-tipper": [
    { title: "Wikimedia Commons: Volvo FMX 420 Tipper.jpg", url: "https://commons.wikimedia.org/wiki/File:Volvo_FMX_420_Tipper.jpg" },
    { title: "Wikimedia Commons: Mittlere Baureihe, Volvo FM und FMX Kipper.jpg", url: "https://commons.wikimedia.org/wiki/File:Mittlere_Baureihe,_Volvo_FM_und_FMX_Kipper.jpg" },
  ],
  "proc-vehicle-volvo-vnl": [
    { title: "Wikimedia Commons: Volvo VNL 860 transporting a Chevrolet Silverado, Essex, Ontario, 2025-08-30 01.jpg", url: "https://commons.wikimedia.org/wiki/File:Volvo_VNL_860_transporting_a_Chevrolet_Silverado,_Essex,_Ontario,_2025-08-30_01.jpg" },
  ],
  "proc-vehicle-vw-constellation": [
    { title: "Wikipedia: Volkswagen Constellation", url: "https://en.wikipedia.org/wiki/Volkswagen_Constellation" },
    { title: "Wikimedia Commons: Volkswagen Constellation, Havana.jpg", url: "https://commons.wikimedia.org/wiki/File:Volkswagen_Constellation,_Havana.jpg" },
  ],
  "proc-vehicle-vw-t1-samba": [
    { title: "Wikipedia: Volkswagen Type 2", url: "https://en.wikipedia.org/wiki/Volkswagen_Type_2" },
    { title: "Wikimedia Commons: 1958 Volkswagen T1 Transporter Kombi bus.jpg", url: "https://commons.wikimedia.org/wiki/File:1958_Volkswagen_T1_Transporter_Kombi_bus.jpg" },
    { title: "Wikimedia Commons: 1964 Volkswagen T1 Transporter Kombi bus (6106456722).jpg", url: "https://commons.wikimedia.org/wiki/File:1964_Volkswagen_T1_Transporter_Kombi_bus_(6106456722).jpg" },
  ],
  "proc-vehicle-western-star-4900": [
    { title: "Wikimedia Commons: Western Star 4900 dumpster truck.jpg", url: "https://commons.wikimedia.org/wiki/File:Western_Star_4900_dumpster_truck.jpg" },
  ],
  "proc-vehicle-white-3000": [
    { title: "Wikimedia Commons: White 3000 - Delivery Truck.jpg", url: "https://commons.wikimedia.org/wiki/File:White_3000_-_Delivery_Truck.jpg" },
  ],
  "proc-vehicle-wroclaw-skoda-16t": [
    { title: "Wikipedia: \u0160koda 16 T", url: "https://en.wikipedia.org/wiki/%C5%A0koda_16_T" },
    { title: "Wikimedia Commons: 16T Wroclaw 3002.jpg", url: "https://commons.wikimedia.org/wiki/File:16T_Wroclaw_3002.jpg" },
  ],
  "proc-vehicle-xian-ma60": [
    { title: "Wikipedia: Xi'an MA60", url: "https://en.wikipedia.org/wiki/Xi'an_MA60" },
    { title: "Wikimedia Commons: B-3706 - Okay Airways - Modern Ark 60 - DLC (9575868910).jpg", url: "https://commons.wikimedia.org/wiki/File:B-3706_-_Okay_Airways_-_Modern_Ark_60_-_DLC_(9575868910).jpg" },
  ],
  "proc-vehicle-yakovlev-yak40": [
    { title: "Wikipedia: Yakovlev Yak-40", url: "https://en.wikipedia.org/wiki/Yakovlev_Yak-40" },
    { title: "Wikimedia Commons: Airstairs on Yak-40 RA-87500.jpg", url: "https://commons.wikimedia.org/wiki/File:Airstairs_on_Yak-40_RA-87500.jpg" },
    { title: "Wikimedia Commons: Eesti Lennundusmuuseum. JAK-40 salong.jpg", url: "https://commons.wikimedia.org/wiki/File:Eesti_Lennundusmuuseum._JAK-40_salong.jpg" },
  ],
  "proc-vehicle-yakovlev-yak42": [
    { title: "Wikipedia: Yakovlev Yak-42", url: "https://en.wikipedia.org/wiki/Yakovlev_Yak-42" },
    { title: "Wikimedia Commons: Yak-42D (5453983163).jpg", url: "https://commons.wikimedia.org/wiki/File:Yak-42D_(5453983163).jpg" },
  ],
  "proc-vehicle-yutong-e12": [
    { title: "Wikipedia: Yutong", url: "https://en.wikipedia.org/wiki/Yutong" },
    { title: "Wikimedia Commons: Autobus YUTONG E10 w Mr\u0105gowie.jpg", url: "https://commons.wikimedia.org/wiki/File:Autobus_YUTONG_E10_w_Mr%C4%85gowie.jpg" },
    { title: "Wikimedia Commons: Yutong, Busworld Europe 2023, Brussels (P1140388).jpg", url: "https://commons.wikimedia.org/wiki/File:Yutong,_Busworld_Europe_2023,_Brussels_(P1140388).jpg" },
  ],
  "proc-vehicle-za-rea-vaya": [
    { title: "Wikipedia: Rea Vaya", url: "https://en.wikipedia.org/wiki/Rea_Vaya" },
    { title: "Wikimedia Commons: Rea Vaya stop in CBD.JPG", url: "https://commons.wikimedia.org/wiki/File:Rea_Vaya_stop_in_CBD.JPG" },
  ],
  "proc-vehicle-zeppelin-nt": [
    { title: "Wikipedia: Zeppelin NT", url: "https://en.wikipedia.org/wiki/Zeppelin_NT" },
    { title: "Wikimedia Commons: 2003-07-26 16-49-36 Germany Baden-W\u00fcrttemberg Unterailingen.JPG", url: "https://commons.wikimedia.org/wiki/File:2003-07-26_16-49-36_Germany_Baden-W%C3%BCrttemberg_Unterailingen.JPG" },
  ],
  "proc-vehicle-zil-130": [
    { title: "Wikipedia: ZIL-130", url: "https://en.wikipedia.org/wiki/ZIL-130" },
    { title: "Wikimedia Commons: ZIL-130 in Dnipropetrovsk.png", url: "https://commons.wikimedia.org/wiki/File:ZIL-130_in_Dnipropetrovsk.png" },
  ],
  "proc-vehicle-ziu-9": [
    { title: "Wikipedia: ZiU-9", url: "https://en.wikipedia.org/wiki/ZiU-9" },
    { title: "Wikimedia Commons: ZiU-682v in Minsk.JPG", url: "https://commons.wikimedia.org/wiki/File:ZiU-682v_in_Minsk.JPG" },
    { title: "Wikimedia Commons: ZiU 9 Athens.jpg", url: "https://commons.wikimedia.org/wiki/File:ZiU_9_Athens.jpg" },
  ],
  "proc-vehicle-zurich-cobra": [
    { title: "Wikimedia Commons: Zurich Be 5-6 Cobra 3002 Letzistrasse.jpg", url: "https://commons.wikimedia.org/wiki/File:Zurich_Be_5-6_Cobra_3002_Letzistrasse.jpg" },
  ],
  "proc-vehicle-zurich-tram-2000": [
    { title: "Wikipedia: Tram 2000", url: "https://en.wikipedia.org/wiki/Tram_2000" },
    { title: "Wikimedia Commons: Bern tram nr 82, Linie 6 to Worb Dorf. july 2011 - Flickr - sludgegulper.jpg", url: "https://commons.wikimedia.org/wiki/File:Bern_tram_nr_82,_Linie_6_to_Worb_Dorf._july_2011_-_Flickr_-_sludgegulper.jpg" },
    { title: "Wikimedia Commons: Colombier-Tram.jpg", url: "https://commons.wikimedia.org/wiki/File:Colombier-Tram.jpg" },
  ],
};
