// The web pages a model is built from (docs/site/workshop.md, "Web links"): an
// article, a manufacturer's page, a drawing or a database entry, beside the source
// images its assets/<name>/ folder holds. Keyed by the exported model id (`proc-...`).
// The site shows them on the model page's Sources tab; they are not part of the
// game's meta.
//
// Kept apart from the designs on purpose, like countryTable.ts: a design module is
// bundled into each of its models' JS files, so a field stated there would rewrite
// every model of that module. No `node:` imports.

import { FLEET_LINKS } from "./fleetLinks.ts";

/** One web link of a model. */
export interface ModelLink {
  /** What the page is, as the site shows it: "Wikipedia: Siemens Vectron". */
  title: string;
  /** The page's absolute https URL. */
  url: string;
}

/** Each model's web links, in the order the site lists them. */
export const MODEL_LINKS: Readonly<Record<string, readonly ModelLink[]>> = {
  "proc-vehicle-american-440": [
    { title: "Wikipedia: Jupiter (locomotive)", url: "https://en.wikipedia.org/wiki/Jupiter_(locomotive)" },
    { title: "Wikipedia: Union Pacific No. 119", url: "https://en.wikipedia.org/wiki/Union_Pacific_No._119" },
  ],
  "proc-vehicle-amtrak-acela": [
    { title: "Wikipedia: Acela Express (trainset)", url: "https://en.wikipedia.org/wiki/Acela_Express_(trainset)" },
  ],
  "proc-vehicle-amtrak-superliner": [
    { title: "Wikipedia: Superliner (railcar)", url: "https://en.wikipedia.org/wiki/Superliner_(railcar)" },
  ],
  "proc-vehicle-blue-train-24": [
    { title: "Wikipedia: Blue Train (Japan)", url: "https://en.wikipedia.org/wiki/Blue_Train_(Japan)" },
  ],
  "proc-vehicle-br-class-378": [
    { title: "Wikipedia: British Rail Class 378", url: "https://en.wikipedia.org/wiki/British_Rail_Class_378" },
    { title: "TfL: Class 378 data sheet", url: "https://foi.tfl.gov.uk/FOI-0416-2223/Class%20378%20Data%20Sheet.pdf" },
  ],
  "proc-vehicle-budd-rdc": [
    { title: "Wikipedia: Budd Rail Diesel Car", url: "https://en.wikipedia.org/wiki/Budd_Rail_Diesel_Car" },
  ],
  "proc-vehicle-cta-5000": [
    { title: "Wikipedia: 5000-series (CTA)", url: "https://en.wikipedia.org/wiki/5000-series_(CTA)" },
  ],
  "proc-vehicle-emd-f7": [
    { title: "Wikipedia: EMD F7", url: "https://en.wikipedia.org/wiki/EMD_F7" },
    { title: "The Diesel Shop: EMD F7 data", url: "https://www.thedieselshop.us/Data%20EMD%20F7.HTML" },
  ],
  "proc-vehicle-emd-gp9": [
    { title: "Wikipedia: EMD GP9", url: "https://en.wikipedia.org/wiki/EMD_GP9" },
    { title: "The Diesel Shop: EMD GP9 data", url: "https://www.thedieselshop.us/Data%20EMD%20GP9.HTML" },
  ],
  "proc-vehicle-emd-sd40-2": [
    { title: "Wikipedia: EMD SD40-2", url: "https://en.wikipedia.org/wiki/EMD_SD40-2" },
    { title: "The Diesel Shop: EMD SD40-2 data", url: "https://www.thedieselshop.us/Data%20EMD%20SD40-2.HTML" },
  ],
  "proc-vehicle-emd-sd70ace": [
    { title: "Wikipedia: EMD SD70 series", url: "https://en.wikipedia.org/wiki/EMD_SD70_series" },
    { title: "The Diesel Shop: EMD SD70ACe data", url: "https://www.thedieselshop.us/Data%20EMD%20SD70ACe.HTML" },
  ],
  "proc-vehicle-emd-f40ph": [
    { title: "Wikipedia: EMD F40PH", url: "https://en.wikipedia.org/wiki/EMD_F40PH" },
  ],
  "proc-vehicle-ge-es44ac": [
    { title: "Wikipedia: GE Evolution Series", url: "https://en.wikipedia.org/wiki/GE_Evolution_Series" },
    { title: "American-Rails: GE ES44AC", url: "https://american-rails.com/es44ac.html" },
  ],
  "proc-vehicle-ge-p42dc": [
    { title: "Wikipedia: GE Genesis", url: "https://en.wikipedia.org/wiki/GE_Genesis" },
    { title: "The Diesel Shop: GE P40DC/P42DC data", url: "https://www.thedieselshop.us/Data%20P40_42DC.HTML" },
  ],
  "proc-vehicle-hankyu-9000": [
    { title: "Wikipedia: Hankyu 9000 series", url: "https://en.wikipedia.org/wiki/Hankyu_9000_series" },
  ],
  "proc-vehicle-jnr-103": [
    { title: "Wikipedia: 103 series", url: "https://en.wikipedia.org/wiki/103_series" },
  ],
  "proc-vehicle-jnr-485": [
    { title: "Wikipedia: 485 series", url: "https://en.wikipedia.org/wiki/485_series" },
  ],
  "proc-vehicle-jnr-c62": [
    { title: "Wikipedia: JNR Class C62", url: "https://en.wikipedia.org/wiki/JNR_Class_C62" },
  ],
  "proc-vehicle-jnr-d51": [
    { title: "Wikipedia: JNR Class D51", url: "https://en.wikipedia.org/wiki/JNR_Class_D51" },
  ],
  "proc-vehicle-jnr-dd51": [
    { title: "Wikipedia: JNR Class DD51", url: "https://en.wikipedia.org/wiki/JNR_Class_DD51" },
  ],
  "proc-vehicle-jnr-ef66": [
    { title: "Wikipedia: JNR Class EF66", url: "https://en.wikipedia.org/wiki/JNR_Class_EF66" },
  ],
  "proc-vehicle-jr-e235": [
    { title: "Wikipedia: E235 series", url: "https://en.wikipedia.org/wiki/E235_series" },
  ],
  "proc-vehicle-jr-e259": [
    { title: "Wikipedia: E259 series", url: "https://en.wikipedia.org/wiki/E259_series" },
  ],
  "proc-vehicle-kintetsu-hinotori": [
    { title: "Wikipedia: Kintetsu 80000 series", url: "https://en.wikipedia.org/wiki/Kintetsu_80000_series" },
  ],
  "proc-vehicle-nyc-hudson": [
    { title: "Wikipedia: New York Central Hudson", url: "https://en.wikipedia.org/wiki/New_York_Central_Hudson" },
  ],
  "proc-vehicle-nyc-r160": [
    { title: "Wikipedia: R160 (New York City Subway car)", url: "https://en.wikipedia.org/wiki/R160_(New_York_City_Subway_car)" },
  ],
  "proc-vehicle-odakyu-gse": [
    { title: "Wikipedia: Odakyu 70000 series GSE", url: "https://en.wikipedia.org/wiki/Odakyu_70000_series_GSE" },
  ],
  "proc-vehicle-pioneer-zephyr": [
    { title: "Wikipedia: Pioneer Zephyr", url: "https://en.wikipedia.org/wiki/Pioneer_Zephyr" },
  ],
  "proc-vehicle-prr-gg1": [
    { title: "Wikipedia: Pennsylvania Railroad class GG1", url: "https://en.wikipedia.org/wiki/Pennsylvania_Railroad_class_GG1" },
  ],
  "proc-vehicle-prr-k4s": [
    { title: "Wikipedia: Pennsylvania Railroad class K4", url: "https://en.wikipedia.org/wiki/Pennsylvania_Railroad_class_K4" },
  ],
  "proc-vehicle-sf-cable-car": [
    { title: "Wikipedia: San Francisco cable car system", url: "https://en.wikipedia.org/wiki/San_Francisco_cable_car_system" },
  ],
  "proc-vehicle-shinkansen-100": [
    { title: "Wikipedia: 100 Series Shinkansen", url: "https://en.wikipedia.org/wiki/100_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-500": [
    { title: "Wikipedia: 500 Series Shinkansen", url: "https://en.wikipedia.org/wiki/500_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-700": [
    { title: "Wikipedia: 700 Series Shinkansen", url: "https://en.wikipedia.org/wiki/700_Series_Shinkansen" },
    { title: "Wikipedia: Doctor Yellow", url: "https://en.wikipedia.org/wiki/Doctor_Yellow" },
  ],
  "proc-vehicle-shinkansen-e4": [
    { title: "Wikipedia: E4 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E4_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-e5": [
    { title: "Wikipedia: E5 and H5 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E5_and_H5_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-e6": [
    { title: "Wikipedia: E6 Series Shinkansen", url: "https://en.wikipedia.org/wiki/E6_Series_Shinkansen" },
  ],
  "proc-vehicle-shinkansen-n700s": [
    { title: "Wikipedia: N700S Series Shinkansen", url: "https://en.wikipedia.org/wiki/N700S_Series_Shinkansen" },
  ],
  "proc-vehicle-siemens-alc42": [
    { title: "Wikipedia: Siemens Charger", url: "https://en.wikipedia.org/wiki/Siemens_Charger" },
  ],
  "proc-vehicle-up-big-boy": [
    { title: "Wikipedia: Union Pacific Big Boy", url: "https://en.wikipedia.org/wiki/Union_Pacific_Big_Boy" },
  ],
  "proc-vehicle-us-boxcar": [
    { title: "Wikipedia: Boxcar", url: "https://en.wikipedia.org/wiki/Boxcar" },
  ],
  "proc-vehicle-us-caboose": [
    { title: "Wikipedia: Caboose", url: "https://en.wikipedia.org/wiki/Caboose" },
  ],
  "proc-vehicle-us-well-car": [
    { title: "Wikipedia: Well car", url: "https://en.wikipedia.org/wiki/Well_car" },
  ],
  "proc-vehicle-vectron": [{ title: "Wikipedia: Siemens Vectron", url: "https://en.wikipedia.org/wiki/Siemens_Vectron" }],
  // the eight countries' trains (docs/specs/2026-11-05-trains-of-eight-countries.md): the class's article and the photographs' Commons pages
  "proc-vehicle-br-9f": [{ title: "Wikipedia: BR Standard Class 9F", url: "https://en.wikipedia.org/wiki/BR_Standard_Class_9F" }],
  "proc-vehicle-br-class-142": [{ title: "Wikipedia: British Rail Class 142", url: "https://en.wikipedia.org/wiki/British_Rail_Class_142" }],
  "proc-vehicle-br-class-158": [{ title: "Wikipedia: British Rail Class 158", url: "https://en.wikipedia.org/wiki/British_Rail_Class_158" }],
  "proc-vehicle-br-class-37": [{ title: "Wikipedia: British Rail Class 37", url: "https://en.wikipedia.org/wiki/British_Rail_Class_37" }],
  "proc-vehicle-br-class-390": [{ title: "Wikipedia: British Rail Class 390", url: "https://en.wikipedia.org/wiki/British_Rail_Class_390" }],
  "proc-vehicle-br-class-47": [{ title: "Wikipedia: British Rail Class 47", url: "https://en.wikipedia.org/wiki/British_Rail_Class_47" }],
  "proc-vehicle-br-class-55": [{ title: "Wikipedia: British Rail Class 55", url: "https://en.wikipedia.org/wiki/British_Rail_Class_55" }],
  "proc-vehicle-br-class-66": [{ title: "Wikipedia: British Rail Class 66", url: "https://en.wikipedia.org/wiki/British_Rail_Class_66" }],
  "proc-vehicle-br-class-800": [{ title: "Wikipedia: British Rail Class 800", url: "https://en.wikipedia.org/wiki/British_Rail_Class_800" }],
  "proc-vehicle-br-class-86": [{ title: "Wikipedia: British Rail Class 86", url: "https://en.wikipedia.org/wiki/British_Rail_Class_86" }],
  "proc-vehicle-br-hst": [{ title: "Wikipedia: InterCity 125", url: "https://en.wikipedia.org/wiki/InterCity_125" }],
  "proc-vehicle-br-ic225": [{ title: "Wikipedia: InterCity 225", url: "https://en.wikipedia.org/wiki/InterCity_225" }],
  "proc-vehicle-br-mk1-coach": [{ title: "Wikipedia: British Rail Mark 1", url: "https://en.wikipedia.org/wiki/British_Rail_Mark_1" }, { title: "Wikimedia Commons: BR Mk1 coach 1st class interior.jpg", url: "https://commons.wikimedia.org/wiki/File:BR_Mk1_coach_1st_class_interior.jpg" }],
  "proc-vehicle-ciwl-car": [{ title: "Wikipedia: Compagnie Internationale des Wagons-Lits", url: "https://en.wikipedia.org/wiki/Compagnie_Internationale_des_Wagons-Lits" }, { title: "Wikimedia Commons: CIWL-Logo-bleu.jpg", url: "https://commons.wikimedia.org/wiki/File:CIWL-Logo-bleu.jpg" }],
  "proc-vehicle-cr-cr200j": [{ title: "Wikipedia: China Railway CR200J", url: "https://en.wikipedia.org/wiki/China_Railway_CR200J" }],
  "proc-vehicle-cr-cr400af": [{ title: "Wikipedia: China Railway CR400AF", url: "https://en.wikipedia.org/wiki/China_Railway_CR400AF" }],
  "proc-vehicle-cr-cr400bf": [{ title: "Wikipedia: China Railway CR400BF", url: "https://en.wikipedia.org/wiki/China_Railway_CR400BF" }],
  "proc-vehicle-cr-crh2a": [{ title: "Wikipedia: China Railway CRH2", url: "https://en.wikipedia.org/wiki/China_Railway_CRH2" }],
  "proc-vehicle-cr-crh380a": [{ title: "Wikipedia: China Railway CRH380A", url: "https://en.wikipedia.org/wiki/China_Railway_CRH380A" }],
  "proc-vehicle-cr-crh3c": [{ title: "Wikipedia: China Railway CRH3", url: "https://en.wikipedia.org/wiki/China_Railway_CRH3" }],
  "proc-vehicle-cr-crh5a": [{ title: "Wikipedia: China Railway CRH5", url: "https://en.wikipedia.org/wiki/China_Railway_CRH5" }],
  "proc-vehicle-cr-crh6a": [{ title: "Wikipedia: China Railway CRH6", url: "https://en.wikipedia.org/wiki/China_Railway_CRH6" }],
  "proc-vehicle-cr-df11": [{ title: "Wikipedia: China Railways DF11", url: "https://en.wikipedia.org/wiki/China_Railways_DF11" }],
  "proc-vehicle-cr-df4": [{ title: "Wikipedia: China Railways DF4", url: "https://en.wikipedia.org/wiki/China_Railways_DF4" }],
  "proc-vehicle-cr-hxd1": [{ title: "Wikipedia: China Railways HXD1", url: "https://en.wikipedia.org/wiki/China_Railways_HXD1" }],
  "proc-vehicle-cr-hxd3d": [{ title: "Wikipedia: China Railways HXD3D", url: "https://en.wikipedia.org/wiki/China_Railways_HXD3D" }],
  "proc-vehicle-cr-hxn5": [{ title: "Wikipedia: China Railways HXN5", url: "https://en.wikipedia.org/wiki/China_Railways_HXN5" }],
  "proc-vehicle-cr-js": [{ title: "Wikipedia: China Railways JS", url: "https://en.wikipedia.org/wiki/China_Railways_JS" }, { title: "Wikimedia Commons: JS-5151 (Xi'ang).jpg", url: "https://commons.wikimedia.org/wiki/File:JS-5151_(Xi%27ang).jpg" }],
  "proc-vehicle-cr-qj": [{ title: "Wikipedia: China Railways QJ", url: "https://en.wikipedia.org/wiki/China_Railways_QJ" }, { title: "Wikimedia Commons: China Railways QJ 6200(2).JPG", url: "https://commons.wikimedia.org/wiki/File:China_Railways_QJ_6200(2).JPG" }],
  "proc-vehicle-cr-ss1": [{ title: "Wikipedia: China Railways SS1", url: "https://en.wikipedia.org/wiki/China_Railways_SS1" }],
  "proc-vehicle-cr-ss8": [{ title: "Wikipedia: China Railways SS8", url: "https://en.wikipedia.org/wiki/China_Railways_SS8" }],
  "proc-vehicle-cr-sy": [{ title: "Wikipedia: China Railways SY", url: "https://en.wikipedia.org/wiki/China_Railways_SY" }, { title: "Wikimedia Commons: SY1721 at Tangshan Works.jpg", url: "https://commons.wikimedia.org/wiki/File:SY1721_at_Tangshan_Works.jpg" }],
  "proc-vehicle-db-101": [{ title: "Wikipedia: DB Class 101", url: "https://en.wikipedia.org/wiki/DB_Class_101" }, { title: "Wikimedia Commons: DB 101 115 in Hannover Hbf (2025).jpg", url: "https://commons.wikimedia.org/wiki/File:DB_101_115_in_Hannover_Hbf_(2025).jpg" }, { title: "Wikimedia Commons: DB 101 104-8 abgebügelt in Singen (Hohentwiel).jpg", url: "https://commons.wikimedia.org/wiki/File:DB_101_104-8_abgeb%C3%BCgelt_in_Singen_(Hohentwiel).jpg" }, { title: "Wikimedia Commons: 101 009 Intercity.jpg", url: "https://commons.wikimedia.org/wiki/File:101_009_Intercity.jpg" }, { title: "Wikimedia Commons: L02 428 Bf Leipzig Hbf, 101 013.jpg", url: "https://commons.wikimedia.org/wiki/File:L02_428_Bf_Leipzig_Hbf,_101_013.jpg" }],
  "proc-vehicle-db-103": [{ title: "Wikipedia: DB Class 103", url: "https://en.wikipedia.org/wiki/DB_Class_103" }, { title: "Wikimedia Commons: 103 184 DB nahe Ostermünchen - Bayern (1).JPG", url: "https://commons.wikimedia.org/wiki/File:103_184_DB_nahe_Osterm%C3%BCnchen_-_Bayern_(1).JPG" }, { title: "Wikimedia Commons: DB 103 226 7.JPG", url: "https://commons.wikimedia.org/wiki/File:DB_103_226_7.JPG" }, { title: "Wikimedia Commons: 103-113-7 München Hbf.jpg", url: "https://commons.wikimedia.org/wiki/File:103-113-7_M%C3%BCnchen_Hbf.jpg" }, { title: "Wikimedia Commons: 103 113 Luetzel 03042010.jpg", url: "https://commons.wikimedia.org/wiki/File:103_113_Luetzel_03042010.jpg" }],
  "proc-vehicle-db-120": [{ title: "Wikipedia: DB Class 120", url: "https://en.wikipedia.org/wiki/DB_Class_120" }, { title: "Wikimedia Commons: 120 207-6 Köln, Rhein-Sieg-Express 2013-07-23-01.jpg", url: "https://commons.wikimedia.org/wiki/File:120_207-6_K%C3%B6ln,_Rhein-Sieg-Express_2013-07-23-01.jpg" }, { title: "Wikimedia Commons: Blass - WRS (ex-DB) 120 154 in Karlsruhe Hbf (2025).jpg", url: "https://commons.wikimedia.org/wiki/File:Blass_-_WRS_(ex-DB)_120_154_in_Karlsruhe_Hbf_(2025).jpg" }],
  "proc-vehicle-db-218": [{ title: "Wikipedia: DB Class 218", url: "https://en.wikipedia.org/wiki/DB_Class_218" }, { title: "Wikimedia Commons: DB Baureihe 218 400-0 in München.JPG", url: "https://commons.wikimedia.org/wiki/File:DB_Baureihe_218_400-0_in_M%C3%BCnchen.JPG" }, { title: "Wikimedia Commons: Meiningen Bahnhof DB-Baureihe 218 - 2026-06-26 HBP.jpg", url: "https://commons.wikimedia.org/wiki/File:Meiningen_Bahnhof_DB-Baureihe_218_-_2026-06-26_HBP.jpg" }, { title: "Wikimedia Commons: Baureihe 218 416-6 der Deutschen Bundesbahn (DB).jpg", url: "https://commons.wikimedia.org/wiki/File:Baureihe_218_416-6_der_Deutschen_Bundesbahn_(DB).jpg" }, { title: "Wikimedia Commons: DB 218 209-5 1.jpg", url: "https://commons.wikimedia.org/wiki/File:DB_218_209-5_1.jpg" }, { title: "Wikimedia Commons: Clp 20140819 2531 92 80 1218 137-8 D-DB DB-Museum Koblenz.jpg", url: "https://commons.wikimedia.org/wiki/File:Clp_20140819_2531_92_80_1218_137-8_D-DB_DB-Museum_Koblenz.jpg" }, { title: "Wikimedia Commons: Hindenburgdamm, 218 315-0 mit dem Sylt Shuttle.jpg", url: "https://commons.wikimedia.org/wiki/File:Hindenburgdamm,_218_315-0_mit_dem_Sylt_Shuttle.jpg" }],
  "proc-vehicle-db-423": [{ title: "Wikipedia: DBAG Class 423", url: "https://en.wikipedia.org/wiki/DBAG_Class_423" }, { title: "Wikimedia Commons: Pantograph of a DBAG Class 423.JPG", url: "https://commons.wikimedia.org/wiki/File:Pantograph_of_a_DBAG_Class_423.JPG" }, { title: "Wikimedia Commons: DB 423 S-Bahn Munich S8 Herrsching-Airport (16225832969).jpg", url: "https://commons.wikimedia.org/wiki/File:DB_423_S-Bahn_Munich_S8_Herrsching-Airport_(16225832969).jpg" }],
  "proc-vehicle-db-642": [{ title: "Wikipedia: Siemens Desiro", url: "https://en.wikipedia.org/wiki/Siemens_Desiro" }, { title: "Wikimedia Commons: DBAG-642-RB-73-Pfronten-2022.jpg", url: "https://commons.wikimedia.org/wiki/File:DBAG-642-RB-73-Pfronten-2022.jpg" }, { title: "Wikimedia Commons: DBAG Class 642-control panel.JPG", url: "https://commons.wikimedia.org/wiki/File:DBAG_Class_642-control_panel.JPG" }, { title: "Wikipedia (de): DB-Baureihe 642", url: "https://de.wikipedia.org/wiki/DB-Baureihe_642" }, { title: "Wikimedia Commons: Liesel 28-11-10 642 055-8 im Bahnhof Scharfenstein.JPG", url: "https://commons.wikimedia.org/wiki/File:Liesel_28-11-10_642_055-8_im_Bahnhof_Scharfenstein.JPG" }, { title: "Wikimedia Commons: DB 642 620 in Augsburg Hbf (2014).jpg", url: "https://commons.wikimedia.org/wiki/File:DB_642_620_in_Augsburg_Hbf_(2014).jpg" }],
  "proc-vehicle-db-650": [{ title: "Wikipedia: Stadler Regio-Shuttle RS1", url: "https://en.wikipedia.org/wiki/Stadler_Regio-Shuttle_RS1" }, { title: "Wikimedia Commons: Stadler RS1 railcar driving cab.jpg", url: "https://commons.wikimedia.org/wiki/File:Stadler_RS1_railcar_driving_cab.jpg" }, { title: "Wikimedia Commons: Bwegt SWEG 511 -Stadler Regio-Shuttle RS1 in Offenburg.jpg", url: "https://commons.wikimedia.org/wiki/File:Bwegt_SWEG_511_-Stadler_Regio-Shuttle_RS1_in_Offenburg.jpg" }],
  "proc-vehicle-db-ic-coach": [{ title: "Wikipedia: Intercity (Deutsche Bahn)", url: "https://en.wikipedia.org/wiki/Intercity_(Deutsche_Bahn)" }, { title: "Wikimedia Commons: J24 221 Schönefelder Gruppe, 146 560.jpg", url: "https://commons.wikimedia.org/wiki/File:J24_221_Sch%C3%B6nefelder_Gruppe,_146_560.jpg" }],
  "proc-vehicle-db-ice-t": [{ title: "Wikipedia: ICE T", url: "https://en.wikipedia.org/wiki/ICE_T" }, { title: "Wikipedia (de): DB-Baureihe 411", url: "https://de.wikipedia.org/wiki/DB-Baureihe_411" }, { title: "Wikimedia Commons: ICE-T Kinding.jpg", url: "https://commons.wikimedia.org/wiki/File:ICE-T_Kinding.jpg" }, { title: "Wikimedia Commons: ICE T TZ 1163 -Osteebad Binz-, Frankfurt (LRM 20200520 124004-hdr).jpg", url: "https://commons.wikimedia.org/wiki/File:ICE_T_TZ_1163_-Osteebad_Binz-,_Frankfurt_(LRM_20200520_124004-hdr).jpg" }, { title: "Wikimedia Commons: ICE-T, Ribnitz-Damgarten (LRM 20200219 155154).jpg", url: "https://commons.wikimedia.org/wiki/File:ICE-T,_Ribnitz-Damgarten_(LRM_20200219_155154).jpg" }],
  "proc-vehicle-db-ice2": [{ title: "Wikipedia: ICE 2", url: "https://en.wikipedia.org/wiki/ICE_2" }, { title: "Wikimedia Commons: Ice structure no. 2.jpg", url: "https://commons.wikimedia.org/wiki/File:Ice_structure_no._2.jpg" }, { title: "Wikimedia Commons: IceBlockNearJoekullsarlon.jpg", url: "https://commons.wikimedia.org/wiki/File:IceBlockNearJoekullsarlon.jpg" }],
  "proc-vehicle-db-ice3": [{ title: "Wikipedia: ICE 3", url: "https://en.wikipedia.org/wiki/ICE_3" }, { title: "Wikimedia Commons: Amsterdam ICE 3M 001.JPG", url: "https://commons.wikimedia.org/wiki/File:Amsterdam_ICE_3M_001.JPG" }, { title: "Wikimedia Commons: ICE 3 Oberhaider-Wald-Tunnel.jpg", url: "https://commons.wikimedia.org/wiki/File:ICE_3_Oberhaider-Wald-Tunnel.jpg" }],
  "proc-vehicle-db-ice4": [{ title: "Wikipedia: ICE 4", url: "https://en.wikipedia.org/wiki/ICE_4" }, { title: "Wikipedia (de): DB-Baureihe 412", url: "https://de.wikipedia.org/wiki/DB-Baureihe_412" }, { title: "Wikimedia Commons: Buttenheim DBAG Class 412-20230407-RM-162955.jpg", url: "https://commons.wikimedia.org/wiki/File:Buttenheim_DBAG_Class_412-20230407-RM-162955.jpg" }, { title: "Wikimedia Commons: Fulda Bahnhof DBAG Class 412-20230716-RM-162021.jpg", url: "https://commons.wikimedia.org/wiki/File:Fulda_Bahnhof_DBAG_Class_412-20230716-RM-162021.jpg" }, { title: "Wikimedia Commons: J40 336 Bf Muenchen Hbf, 812.jpg", url: "https://commons.wikimedia.org/wiki/File:J40_336_Bf_M%C3%BCnchen_Hbf,_812.jpg" }, { title: "Wikimedia Commons: DB ICE4 9230 Berlin Ostbahnhof 11 25.jpg", url: "https://commons.wikimedia.org/wiki/File:DB_ICE4_9230_Berlin_Ostbahnhof_11_25.jpg" }, { title: "Wikimedia Commons: Wahnebergen- ICE 4.jpg", url: "https://commons.wikimedia.org/wiki/File:Wahnebergen-_ICE_4.jpg" }, { title: "Wikimedia Commons: 412 002 Koeln-Kalk-Nord 2015-11-09-01.JPG", url: "https://commons.wikimedia.org/wiki/File:412_002_K%C3%B6ln-Kalk-Nord_2015-11-09-01.JPG" }],
  "proc-vehicle-db-v200": [{ title: "Wikipedia: DB Class V 200", url: "https://en.wikipedia.org/wiki/DB_Class_V_200" }, { title: "Wikimedia Commons: DB V 200 007.jpg", url: "https://commons.wikimedia.org/wiki/File:DB_V_200_007.jpg" }, { title: "Wikimedia Commons: 220 026 at Stade.jpg", url: "https://commons.wikimedia.org/wiki/File:220_026_at_Stade.jpg" }, { title: "Wikimedia Commons: Hamburg, German Railways DB Class V 200 red-black and blue-white (SIK 03-018387).jpg", url: "https://commons.wikimedia.org/wiki/File:Hamburg,_German_Railways_DB_Class_V_200_red-black_and_blue-white_(SIK_03-018387).jpg" }],
  "proc-vehicle-db-vt98": [{ title: "Wikipedia: Uerdingen railbus", url: "https://en.wikipedia.org/wiki/Uerdingen_railbus" }, { title: "Wikimedia Commons: Uerdinger Schienenbus Moselweinbahn DB Rheinland-Pfalz.jpg", url: "https://commons.wikimedia.org/wiki/File:Uerdinger_Schienenbus_Moselweinbahn_DB_Rheinland-Pfalz.jpg" }, { title: "Wikimedia Commons: Heidelberg Bahnbetriebswerk Uerdinger Schienenbusse.jpg", url: "https://commons.wikimedia.org/wiki/File:Heidelberg_Bahnbetriebswerk_Uerdinger_Schienenbusse.jpg" }],
  "proc-vehicle-dhr-b-class": [{ title: "Wikipedia: DHR B Class", url: "https://en.wikipedia.org/wiki/DHR_B_Class" }, { title: "Wikimedia Commons: DHR 792 with School Train 05-02-23 02.jpeg", url: "https://commons.wikimedia.org/wiki/File:DHR_792_with_School_Train_05-02-23_02.jpeg" }],
  "proc-vehicle-dmrc-rs1": [{ title: "Wikipedia: Delhi Metro", url: "https://en.wikipedia.org/wiki/Delhi_Metro" }],
  "proc-vehicle-dr-52": [{ title: "Wikipedia: DRB Class 52", url: "https://en.wikipedia.org/wiki/DRB_Class_52" }, { title: "Wikimedia Commons: 52 1360 in Blankenheim (8670435045) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:52_1360_in_Blankenheim_(8670435045)_(cropped).jpg" }, { title: "Wikimedia Commons: DR 52 8177 Berlin Johannisstift 15.03.08.jpg", url: "https://commons.wikimedia.org/wiki/File:DR_52_8177_Berlin_Johannisstift_15.03.08.jpg" }],
  "proc-vehicle-drg-01": [{ title: "Wikipedia: DRG Class 01", url: "https://en.wikipedia.org/wiki/DRG_Class_01" }, { title: "Wikimedia Commons: DRG 01 519 der Eisenbahnfreunde Zollernalb in Konstanz 2022.jpg", url: "https://commons.wikimedia.org/wiki/File:DRG_01_519_der_Eisenbahnfreunde_Zollernalb_in_Konstanz_2022.jpg" }, { title: "Wikimedia Commons: DRG BR 01 Sonderzug mit BLS-Wagen.jpg", url: "https://commons.wikimedia.org/wiki/File:DRG_BR_01_Sonderzug_mit_BLS-Wagen.jpg" }, { title: "Wikimedia Commons: BR 01 005, Seitenansicht.png", url: "https://commons.wikimedia.org/wiki/File:BR_01_005,_Seitenansicht.png" }, { title: "Wikimedia Commons: 01118 Koenigstein.jpg", url: "https://commons.wikimedia.org/wiki/File:01118_Koenigstein.jpg" }, { title: "Wikimedia Commons: 01 118 Frontal.jpg", url: "https://commons.wikimedia.org/wiki/File:01_118_Frontal.jpg" }, { title: "Wikimedia Commons: 01 118 Koenigstein 28052007 02.JPG", url: "https://commons.wikimedia.org/wiki/File:01_118_Koenigstein_28052007_02.JPG" }],
  "proc-vehicle-drg-e18": [{ title: "Wikipedia: DRG Class E 18", url: "https://en.wikipedia.org/wiki/DRG_Class_E_18" }],
  "proc-vehicle-drg-e94": [{ title: "Wikipedia: DRG Class E 94", url: "https://en.wikipedia.org/wiki/DRG_Class_E_94" }, { title: "Wikimedia Commons: German Class 194 279.JPG", url: "https://commons.wikimedia.org/wiki/File:German_Class_194_279.JPG" }],
  "proc-vehicle-drg-svt877": [{ title: "Wikipedia: DRG Class SVT 877", url: "https://en.wikipedia.org/wiki/DRG_Class_SVT_877" }, { title: "Wikimedia Commons: Fliegender Hamburger 03.JPG", url: "https://commons.wikimedia.org/wiki/File:Fliegender_Hamburger_03.JPG" }, { title: "Wikimedia Commons: Dieseltriebwagen der Baureihe 877 Der neue Brockhaus 1938.jpg", url: "https://commons.wikimedia.org/wiki/File:Dieseltriebwagen_der_Baureihe_877_Der_neue_Brockhaus_1938.jpg" }],
  "proc-vehicle-eir-fairy-queen": [{ title: "Wikipedia: Fairy Queen (locomotive)", url: "https://en.wikipedia.org/wiki/Fairy_Queen_(locomotive)" }, { title: "Wikimedia Commons: The Queen in a somewhat dilapidated condition. Nevertheless, my tenth visit was of worth^^ - Flickr - Dr. Santulan Mahanta (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:The_Queen_in_a_somewhat_dilapidated_condition._Nevertheless,_my_tenth_visit_was_of_worth%5E%5E_-_Flickr_-_Dr._Santulan_Mahanta_(cropped).jpg" }],
  "proc-vehicle-eurostar-373": [{ title: "Wikipedia: British Rail Class 373", url: "https://en.wikipedia.org/wiki/British_Rail_Class_373" }],
  "proc-vehicle-glacier-express": [{ title: "Wikipedia: Glacier Express", url: "https://en.wikipedia.org/wiki/Glacier_Express" }, { title: "Wikimedia Commons: CH Landwasser 2.jpg", url: "https://commons.wikimedia.org/wiki/File:CH_Landwasser_2.jpg" }],
  "proc-vehicle-gwr-castle": [{ title: "Wikipedia: GWR 4073 Class", url: "https://en.wikipedia.org/wiki/GWR_4073_Class" }, { title: "Wikimedia Commons: At Didcot Railway Centre 2024 060 - Pendennis Castle.jpg", url: "https://commons.wikimedia.org/wiki/File:At_Didcot_Railway_Centre_2024_060_-_Pendennis_Castle.jpg" }, { title: "Wikimedia Commons: GWR 4073 Class 4079 Pendennis Castle Severn Valley Railway.jpg", url: "https://commons.wikimedia.org/wiki/File:GWR_4073_Class_4079_Pendennis_Castle_Severn_Valley_Railway.jpg" }],
  "proc-vehicle-ir-icf-coach": [{ title: "Wikipedia: ICF coach", url: "https://en.wikipedia.org/wiki/ICF_coach" }],
  "proc-vehicle-ir-lhb-coach": [{ title: "Wikipedia: LHB coach", url: "https://en.wikipedia.org/wiki/LHB_coach" }, { title: "Wikimedia Commons: LHB AC 3 tier coach of Golden Temple Mail.jpg", url: "https://commons.wikimedia.org/wiki/File:LHB_AC_3_tier_coach_of_Golden_Temple_Mail.jpg" }],
  "proc-vehicle-ir-memu": [{ title: "Wikipedia: MEMU", url: "https://en.wikipedia.org/wiki/MEMU" }],
  "proc-vehicle-ir-mumbai-emu": [{ title: "Wikipedia: Mumbai Suburban Railway", url: "https://en.wikipedia.org/wiki/Mumbai_Suburban_Railway" }],
  "proc-vehicle-ir-vande-bharat": [{ title: "Wikipedia: Vande Bharat Express", url: "https://en.wikipedia.org/wiki/Vande_Bharat_Express" }],
  "proc-vehicle-ir-wag12b": [{ title: "Wikipedia: Indian locomotive class WAG-12", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WAG-12" }],
  "proc-vehicle-ir-wam4": [{ title: "Wikipedia: Indian locomotive class WAM-4", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WAM-4" }],
  "proc-vehicle-ir-wap4": [{ title: "Wikipedia: Indian locomotive class WAP-4", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WAP-4" }],
  "proc-vehicle-ir-wap5": [{ title: "Wikipedia: Indian locomotive class WAP-5", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WAP-5" }],
  "proc-vehicle-ir-wap7": [{ title: "Wikipedia: Indian locomotive class WAP-7", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WAP-7" }],
  "proc-vehicle-ir-wdg4g": [{ title: "Wikipedia: Indian locomotive class WDG-4G", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WDG-4G" }],
  "proc-vehicle-ir-wdm2": [{ title: "Wikipedia: Indian locomotive class WDM-2", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WDM-2" }],
  "proc-vehicle-ir-wdp4d": [{ title: "Wikipedia: Indian locomotive class WDP-4", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WDP-4" }],
  "proc-vehicle-ir-wg": [{ title: "Wikipedia: Indian locomotive class WG", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WG" }, { title: "Wikimedia Commons: 745 IndiaBareilly 19931227.jpg", url: "https://commons.wikimedia.org/wiki/File:745_IndiaBareilly_19931227.jpg" }],
  "proc-vehicle-ir-wp": [{ title: "Wikipedia: Indian locomotive class WP", url: "https://en.wikipedia.org/wiki/Indian_locomotive_class_WP" }, { title: "Wikimedia Commons: 682 IndiaDelhiMuseum 19931226.jpg", url: "https://commons.wikimedia.org/wiki/File:682_IndiaDelhiMuseum_19931226.jpg" }],
  "proc-vehicle-iryo-s109": [{ title: "Wikipedia: Frecciarossa 1000", url: "https://en.wikipedia.org/wiki/Frecciarossa_1000" }],
  "proc-vehicle-kpev-p8": [{ title: "Wikipedia: Prussian P 8", url: "https://en.wikipedia.org/wiki/Prussian_P_8" }, { title: "Wikimedia Commons: Prussian Steam Locomotive P 8, 1921.jpg", url: "https://commons.wikimedia.org/wiki/File:Prussian_Steam_Locomotive_P_8,_1921.jpg" }, { title: "Wikimedia Commons: Prussian P 8 locomotive at Camp Williams, Is-sur-Tille, France, 9 June 1919 (111-SC-159680).jpg", url: "https://commons.wikimedia.org/wiki/File:Prussian_P_8_locomotive_at_Camp_Williams,_Is-sur-Tille,_France,_9_June_1919_(111-SC-159680).jpg" }],
  "proc-vehicle-lms-black-five": [{ title: "Wikipedia: LMS Stanier Class 5 4-6-0", url: "https://en.wikipedia.org/wiki/LMS_Stanier_Class_5_4-6-0" }, { title: "Wikimedia Commons: 45163 LMS Stanier 5MT \"Black Five\" 4-6-0.jpg", url: "https://commons.wikimedia.org/wiki/File:45163_LMS_Stanier_5MT_%22Black_Five%22_4-6-0.jpg" }, { title: "Wikimedia Commons: LMS Black Five 45305.jpg", url: "https://commons.wikimedia.org/wiki/File:LMS_Black_Five_45305.jpg" }],
  "proc-vehicle-lner-a3": [{ title: "Wikipedia: LNER Gresley Classes A1 and A3", url: "https://en.wikipedia.org/wiki/LNER_Gresley_Classes_A1_and_A3" }, { title: "Wikimedia Commons: LNER Pacific 4474 on King's Cross turntable (CJ Allen, Steel Highway, 1928).jpg", url: "https://commons.wikimedia.org/wiki/File:LNER_Pacific_4474_on_King%27s_Cross_turntable_(CJ_Allen,_Steel_Highway,_1928).jpg" }],
  "proc-vehicle-lner-a4": [{ title: "Wikipedia: LNER Class A4", url: "https://en.wikipedia.org/wiki/LNER_Class_A4" }, { title: "Wikimedia Commons: Up Capitals Limited express on the ECML at Wymondley, south of Hitchin 2282866.jpg", url: "https://commons.wikimedia.org/wiki/File:Up_Capitals_Limited_express_on_the_ECML_at_Wymondley,_south_of_Hitchin_2282866.jpg" }],
  "proc-vehicle-lu-1938-stock": [{ title: "Wikipedia: London Underground 1938 Stock", url: "https://en.wikipedia.org/wiki/London_Underground_1938_Stock" }],
  "proc-vehicle-mgb-hge442": [{ title: "Wikipedia: HGe 4/4 II", url: "https://en.wikipedia.org/wiki/HGe_4/4_II" }],
  "proc-vehicle-ncrtc-namo-bharat": [{ title: "Wikipedia: Namo Bharat", url: "https://en.wikipedia.org/wiki/Namo_Bharat" }],
  "proc-vehicle-ns-1100": [{ title: "Wikipedia: NS Class 1100", url: "https://en.wikipedia.org/wiki/NS_Class_1100" }, { title: "Wikimedia Commons: NS locomotive 1147 at Eindhoven in 1985, hauling an InterCity train.jpg", url: "https://commons.wikimedia.org/wiki/File:NS_locomotive_1147_at_Eindhoven_in_1985,_hauling_an_InterCity_train.jpg" }],
  "proc-vehicle-ns-1200": [{ title: "Wikipedia: NS Class 1200", url: "https://en.wikipedia.org/wiki/NS_Class_1200" }],
  "proc-vehicle-ns-1300": [{ title: "Wikipedia: NS Class 1300", url: "https://en.wikipedia.org/wiki/NS_Class_1300" }, { title: "Wikimedia Commons: E-loc 1312.jpg", url: "https://commons.wikimedia.org/wiki/File:E-loc_1312.jpg" }],
  "proc-vehicle-ns-1700": [{ title: "Wikipedia: NS Class 1700", url: "https://en.wikipedia.org/wiki/NS_Class_1700" }, { title: "Wikimedia Commons: Bad Bentheim NSI 1744 IC 144 Amsterdam Centraal (52912417034).jpg", url: "https://commons.wikimedia.org/wiki/File:Bad_Bentheim_NSI_1744_IC_144_Amsterdam_Centraal_(52912417034).jpg" }],
  "proc-vehicle-ns-2200": [{ title: "Wikipedia (nl): NS 2200", url: "https://nl.wikipedia.org/wiki/NS_2200" }, { title: "Wikimedia Commons: SHD 2205, Amersfoort (15585871532).jpg", url: "https://commons.wikimedia.org/wiki/File:SHD_2205,_Amersfoort_(15585871532).jpg" }],
  "proc-vehicle-ns-3700": [{ title: "Wikipedia: NS 3700", url: "https://en.wikipedia.org/wiki/NS_3700" }],
  "proc-vehicle-ns-ddz": [{ title: "Wikipedia: NS DDZ", url: "https://en.wikipedia.org/wiki/NS_DDZ" }, { title: "Wikimedia Commons: Olst DDZ 7618 vertrekt als IC 3636 naar Zwolle (36050809785).jpg", url: "https://commons.wikimedia.org/wiki/File:Olst_DDZ_7618_vertrekt_als_IC_3636_naar_Zwolle_(36050809785).jpg" }],
  "proc-vehicle-ns-de1": [{ title: "Wikipedia: Blue Angel (train)", url: "https://en.wikipedia.org/wiki/Blue_Angel_(train)" }],
  "proc-vehicle-ns-flirt": [{ title: "Wikipedia: Stadler FLIRT", url: "https://en.wikipedia.org/wiki/Stadler_FLIRT" }, { title: "Wikimedia Commons: Keolis FLIRT 7407 te Amersfoort (38748360521).jpg", url: "https://commons.wikimedia.org/wiki/File:Keolis_FLIRT_7407_te_Amersfoort_(38748360521).jpg" }],
  "proc-vehicle-ns-icm": [{ title: "Wikipedia: NS Intercity Materieel", url: "https://en.wikipedia.org/wiki/NS_Intercity_Materieel" }, { title: "Wikimedia Commons: Alphen aan den Rijn ICMm 4024 (36649803356).jpg", url: "https://commons.wikimedia.org/wiki/File:Alphen_aan_den_Rijn_ICMm_4024_(36649803356).jpg" }],
  "proc-vehicle-ns-icng": [{ title: "Wikipedia: NS Intercity Nieuwe Generatie", url: "https://en.wikipedia.org/wiki/NS_Intercity_Nieuwe_Generatie" }, { title: "Wikimedia Commons: ICNG 3110.jpg", url: "https://commons.wikimedia.org/wiki/File:ICNG_3110.jpg" }],
  "proc-vehicle-ns-icr-coach": [{ title: "Wikipedia (nl): Intercityrijtuig", url: "https://nl.wikipedia.org/wiki/Intercityrijtuig" }, { title: "Wikimedia Commons: ICR 2e klasse Amsterdam 2017.jpg", url: "https://commons.wikimedia.org/wiki/File:ICR_2e_klasse_Amsterdam_2017.jpg" }],
  "proc-vehicle-ns-mat46": [{ title: "Wikipedia (nl): Mat '46", url: "https://nl.wikipedia.org/wiki/Mat_%2746" }],
  "proc-vehicle-ns-mat54": [{ title: "Wikipedia: NS Mat '54", url: "https://en.wikipedia.org/wiki/NS_Mat_%2754" }, { title: "Wikimedia Commons: Hondekop 386.jpg", url: "https://commons.wikimedia.org/wiki/File:Hondekop_386.jpg" }],
  "proc-vehicle-ns-plan-v": [{ title: "Wikipedia (nl): Mat '64", url: "https://nl.wikipedia.org/wiki/Mat_%2764" }, { title: "Wikimedia Commons: Treinstel type Mat'64 station Haarlem.jpg", url: "https://commons.wikimedia.org/wiki/File:Treinstel_type_Mat%2764_station_Haarlem.jpg" }],
  "proc-vehicle-ns-sgm": [{ title: "Wikipedia: Stadsgewestelijk Materieel", url: "https://en.wikipedia.org/wiki/Stadsgewestelijk_Materieel" }],
  "proc-vehicle-ns-slt": [{ title: "Wikipedia: Sprinter Lighttrain", url: "https://en.wikipedia.org/wiki/Sprinter_Lighttrain" }, { title: "Wikimedia Commons: NS2463 -- 't Harde 20180908.jpg", url: "https://commons.wikimedia.org/wiki/File:NS2463_--_%27t_Harde_20180908.jpg" }],
  "proc-vehicle-ns-sng": [{ title: "Wikipedia: Sprinter New Generation", url: "https://en.wikipedia.org/wiki/Sprinter_New_Generation" }, { title: "Wikimedia Commons: Zutphen SNG (CAF) 2710 - Flickr - Rob Dammers (2).jpg", url: "https://commons.wikimedia.org/wiki/File:Zutphen_SNG_(CAF)_2710_-_Flickr_-_Rob_Dammers_(2).jpg" }],
  "proc-vehicle-ns-v250": [{ title: "Wikipedia: AnsaldoBreda V250", url: "https://en.wikipedia.org/wiki/AnsaldoBreda_V250" }, { title: "Wikimedia Commons: TI ETR 700 002 Desenzano 20240406.jpg", url: "https://commons.wikimedia.org/wiki/File:TI_ETR_700_002_Desenzano_20240406.jpg" }],
  "proc-vehicle-ns-virm": [{ title: "Wikipedia: NS VIRM", url: "https://en.wikipedia.org/wiki/NS_VIRM" }, { title: "Wikimedia Commons: Horst-Sevenum IRM 9585 IC 13553 Venlo (32524093940) (2).jpg", url: "https://commons.wikimedia.org/wiki/File:Horst-Sevenum_IRM_9585_IC_13553_Venlo_(32524093940)_(2).jpg" }],
  "proc-vehicle-ratp-mi09": [{ title: "Wikipedia: MI 09", url: "https://en.wikipedia.org/wiki/MI_09" }, { title: "Wikimedia Commons: Ligne de Nanterre a Sartrouville - Viaduc de Nanterre - MI09 - Avril 2012 (4) cropped.jpg", url: "https://commons.wikimedia.org/wiki/File:Ligne_de_Nanterre_a_Sartrouville_-_Viaduc_de_Nanterre_-_MI09_-_Avril_2012_(4)_cropped.jpg" }],
  "proc-vehicle-renfe-141f": [{ title: "Wikimedia Commons: RENFE 141F-2295 FOTO 110.jpg", url: "https://commons.wikimedia.org/wiki/File:RENFE_141F-2295_FOTO_110.jpg" }, { title: "Wikimedia Commons: RENFE 141F-2295 FOTO 111.jpg", url: "https://commons.wikimedia.org/wiki/File:RENFE_141F-2295_FOTO_111.jpg" }],
  "proc-vehicle-renfe-242f": [{ title: "Wikipedia (de): RENFE-Baureihe 242F", url: "https://de.wikipedia.org/wiki/RENFE-Baureihe_242F" }, { title: "Wikimedia Commons: Museo Ferroviario Delicias - 49785885738.jpg", url: "https://commons.wikimedia.org/wiki/File:Museo_Ferroviario_Delicias_-_49785885738.jpg" }],
  "proc-vehicle-renfe-252": [{ title: "Wikipedia: Renfe Class 252", url: "https://en.wikipedia.org/wiki/Renfe_Class_252" }],
  "proc-vehicle-renfe-269": [{ title: "Wikipedia: Renfe Class 269", url: "https://en.wikipedia.org/wiki/Renfe_Class_269" }],
  "proc-vehicle-renfe-319": [{ title: "Wikipedia: Renfe Class 319", url: "https://en.wikipedia.org/wiki/Renfe_Class_319" }],
  "proc-vehicle-renfe-333": [{ title: "Wikipedia: Renfe Class 333", url: "https://en.wikipedia.org/wiki/Renfe_Class_333" }],
  "proc-vehicle-renfe-354": [{ title: "Wikipedia: Renfe Class 354", url: "https://en.wikipedia.org/wiki/Renfe_Class_354" }],
  "proc-vehicle-renfe-440": [{ title: "Wikipedia (de): Renfe-Baureihe 440", url: "https://de.wikipedia.org/wiki/Renfe-Baureihe_440" }],
  "proc-vehicle-renfe-446": [{ title: "Wikipedia: Renfe Class 446", url: "https://en.wikipedia.org/wiki/Renfe_Class_446" }],
  "proc-vehicle-renfe-592": [{ title: "Wikipedia: Renfe Class 592", url: "https://en.wikipedia.org/wiki/Renfe_Class_592" }],
  "proc-vehicle-renfe-civia": [{ title: "Wikipedia: Civia", url: "https://en.wikipedia.org/wiki/Civia" }],
  "proc-vehicle-renfe-s100": [{ title: "Wikipedia: Renfe Class 100", url: "https://en.wikipedia.org/wiki/Renfe_Class_100" }],
  "proc-vehicle-renfe-s102": [{ title: "Wikipedia: Renfe Class 102", url: "https://en.wikipedia.org/wiki/Renfe_Class_102" }],
  "proc-vehicle-renfe-s103": [{ title: "Wikipedia: Renfe Class 103", url: "https://en.wikipedia.org/wiki/Renfe_Class_103" }],
  "proc-vehicle-renfe-s106": [{ title: "Wikipedia: Talgo AVRIL", url: "https://en.wikipedia.org/wiki/Talgo_AVRIL" }],
  "proc-vehicle-renfe-s120": [{ title: "Wikipedia: Renfe Class 120 / 121", url: "https://en.wikipedia.org/wiki/Renfe_Class_120_/_121" }],
  "proc-vehicle-renfe-s130": [{ title: "Wikipedia: Renfe Class 130", url: "https://en.wikipedia.org/wiki/Renfe_Class_130" }],
  "proc-vehicle-rhb-allegra": [{ title: "Wikipedia: Rhaetian Railway ABe 8/12", url: "https://en.wikipedia.org/wiki/Rhaetian_Railway_ABe_8/12" }, { title: "Wikimedia Commons: RhB ABe 8-12 Allegra in Pontresina.jpg", url: "https://commons.wikimedia.org/wiki/File:RhB_ABe_8-12_Allegra_in_Pontresina.jpg" }],
  "proc-vehicle-rhb-ge443": [{ title: "Wikipedia: Rhaetian Railway Ge 4/4 III", url: "https://en.wikipedia.org/wiki/Rhaetian_Railway_Ge_4/4_III" }],
  "proc-vehicle-rhb-ge66": [{ title: "Wikipedia: Rhaetian Railway Ge 6/6 I", url: "https://en.wikipedia.org/wiki/Rhaetian_Railway_Ge_6/6_I" }],
  "proc-vehicle-rocket": [{ title: "Wikipedia: Stephenson's Rocket", url: "https://en.wikipedia.org/wiki/Stephenson%27s_Rocket" }, { title: "Wikimedia Commons: Stephenson's Rocket drawing.jpg", url: "https://commons.wikimedia.org/wiki/File:Stephenson%27s_Rocket_drawing.jpg" }],
  "proc-vehicle-sbb-ae66": [{ title: "Wikipedia: SBB Ae 6/6", url: "https://en.wikipedia.org/wiki/SBB_Ae_6/6" }],
  "proc-vehicle-sbb-ae814": [{ title: "Wikipedia: SBB Ae 8/14", url: "https://en.wikipedia.org/wiki/SBB_Ae_8/14" }],
  "proc-vehicle-sbb-ce68": [{ title: "Wikipedia: SBB Ce 6/8 II", url: "https://en.wikipedia.org/wiki/SBB_Ce_6/8_II" }],
  "proc-vehicle-sbb-ew4-coach": [{ title: "Wikipedia (de): Einheitswagen (Schweiz, Normalspur)", url: "https://de.wikipedia.org/wiki/Einheitswagen_(Schweiz,_Normalspur)" }],
  "proc-vehicle-sbb-flirt": [{ title: "Wikipedia: Stadler FLIRT", url: "https://en.wikipedia.org/wiki/Stadler_FLIRT" }, { title: "Wikimedia Commons: Keolis FLIRT 7407 te Amersfoort (38748360521).jpg", url: "https://commons.wikimedia.org/wiki/File:Keolis_FLIRT_7407_te_Amersfoort_(38748360521).jpg" }],
  "proc-vehicle-sbb-fv-dosto": [{ title: "Wikipedia (de): SBB RABe 502", url: "https://de.wikipedia.org/wiki/SBB_RABe_502" }, { title: "Wikimedia Commons: SBB RABDe 502 009.jpg", url: "https://commons.wikimedia.org/wiki/File:SBB_RABDe_502_009.jpg" }],
  "proc-vehicle-sbb-giruno": [{ title: "Wikipedia: Stadler SMILE", url: "https://en.wikipedia.org/wiki/Stadler_SMILE" }, { title: "Wikimedia Commons: EC250 \"Giruno\" on test run.jpg", url: "https://commons.wikimedia.org/wiki/File:EC250_%22Giruno%22_on_test_run.jpg" }],
  "proc-vehicle-sbb-ic2000": [{ title: "Wikipedia: IC 2000", url: "https://en.wikipedia.org/wiki/IC_2000" }, { title: "Wikimedia Commons: IC2000 Zürich - Luzern.jpg", url: "https://commons.wikimedia.org/wiki/File:IC2000_Z%C3%BCrich_-_Luzern.jpg" }],
  "proc-vehicle-sbb-icn": [{ title: "Wikipedia: SBB RABDe 500", url: "https://en.wikipedia.org/wiki/SBB_RABDe_500" }, { title: "Wikimedia Commons: RABDe 500 ICN EMU - 54826117727.jpg", url: "https://commons.wikimedia.org/wiki/File:RABDe_500_ICN_EMU_-_54826117727.jpg" }],
  "proc-vehicle-sbb-kiss": [{ title: "Wikipedia: Stadler KISS", url: "https://en.wikipedia.org/wiki/Stadler_KISS" }, { title: "Wikimedia Commons: SŽ 313 018 (53348571407).jpg", url: "https://commons.wikimedia.org/wiki/File:S%C5%BD_313_018_(53348571407).jpg" }],
  "proc-vehicle-sbb-rae-tee": [{ title: "Wikipedia: SBB RAe TEE II", url: "https://en.wikipedia.org/wiki/SBB_RAe_TEE_II" }],
  "proc-vehicle-sbb-re420": [{ title: "Wikipedia: SBB Re 420", url: "https://en.wikipedia.org/wiki/SBB_Re_420" }],
  "proc-vehicle-sbb-re460": [{ title: "Wikipedia: SBB Re 460", url: "https://en.wikipedia.org/wiki/SBB_Re_460" }, { title: "Wikimedia Commons: SBB CFF FFS Re 460 014-4 (16486409645).jpg", url: "https://commons.wikimedia.org/wiki/File:SBB_CFF_FFS_Re_460_014-4_(16486409645).jpg" }],
  "proc-vehicle-sbb-re620": [{ title: "Wikipedia: SBB Re 620", url: "https://en.wikipedia.org/wiki/SBB_Re_620" }],
  "proc-vehicle-sbb-roter-pfeil": [{ title: "Wikipedia: Red Arrow (Swiss train)", url: "https://en.wikipedia.org/wiki/Red_Arrow_(Swiss_train)" }, { title: "Wikimedia Commons: Churchill-Red-Arrow.JPG", url: "https://commons.wikimedia.org/wiki/File:Churchill-Red-Arrow.JPG" }],
  "proc-vehicle-sncf-141r": [{ title: "Wikipedia: SNCF Class 141R", url: "https://en.wikipedia.org/wiki/SNCF_Class_141R" }, { title: "Wikimedia Commons: 141-R-568-a.jpg", url: "https://commons.wikimedia.org/wiki/File:141-R-568-a.jpg" }],
  "proc-vehicle-sncf-241p": [{ title: "Wikipedia: SNCF Class 241P", url: "https://en.wikipedia.org/wiki/SNCF_Class_241P" }, { title: "Wikimedia Commons: SNCF Class 241 P.jpg", url: "https://commons.wikimedia.org/wiki/File:SNCF_Class_241_P.jpg" }, { title: "Wikimedia Commons: SNCF 241P5 Nantes 1969.jpg", url: "https://commons.wikimedia.org/wiki/File:SNCF_241P5_Nantes_1969.jpg" }],
  "proc-vehicle-sncf-bb22200": [{ title: "Wikipedia: SNCF Class BB 22200", url: "https://en.wikipedia.org/wiki/SNCF_Class_BB_22200" }, { title: "Wikimedia Commons: BB22394-Antibes.jpg", url: "https://commons.wikimedia.org/wiki/File:BB22394-Antibes.jpg" }],
  "proc-vehicle-sncf-bb27000": [{ title: "Wikipedia: SNCF Class BB 27000", url: "https://en.wikipedia.org/wiki/SNCF_Class_BB_27000" }, { title: "Wikimedia Commons: SNCF 427020 p1.JPG", url: "https://commons.wikimedia.org/wiki/File:SNCF_427020_p1.JPG" }],
  "proc-vehicle-sncf-bb67400": [{ title: "Wikipedia: SNCF Class BB 67400", url: "https://en.wikipedia.org/wiki/SNCF_Class_BB_67400" }, { title: "Wikimedia Commons: BB 67611 et sa livrée Capitole à Daours (80).jpg", url: "https://commons.wikimedia.org/wiki/File:BB_67611_et_sa_livr%C3%A9e_Capitole_%C3%A0_Daours_(80).jpg" }],
  "proc-vehicle-sncf-bb9200": [{ title: "Wikipedia: SNCF Class BB 9200", url: "https://en.wikipedia.org/wiki/SNCF_Class_BB_9200" }],
  "proc-vehicle-sncf-cc40100": [{ title: "Wikipedia: SNCF CC 40100", url: "https://en.wikipedia.org/wiki/SNCF_CC_40100" }, { title: "Wikimedia Commons: Locomotive CC-40110.jpg", url: "https://commons.wikimedia.org/wiki/File:Locomotive_CC-40110.jpg" }],
  "proc-vehicle-sncf-cc6500": [{ title: "Wikipedia: SNCF Class CC 6500", url: "https://en.wikipedia.org/wiki/SNCF_Class_CC_6500" }, { title: "Wikimedia Commons: CC-6572 Mulhouse FRA 001.JPG", url: "https://commons.wikimedia.org/wiki/File:CC-6572_Mulhouse_FRA_001.JPG" }],
  "proc-vehicle-sncf-cc7100": [{ title: "Wikipedia: SNCF Class CC 7100", url: "https://en.wikipedia.org/wiki/SNCF_Class_CC_7100" }, { title: "Wikimedia Commons: SNCF CC 7102 Pk42 Le Mee sur Seine.jpg", url: "https://commons.wikimedia.org/wiki/File:SNCF_CC_7102_Pk42_Le_Mee_sur_Seine.jpg" }],
  "proc-vehicle-sncf-cc72000": [{ title: "Wikipedia: SNCF Class CC 72000", url: "https://en.wikipedia.org/wiki/SNCF_Class_CC_72000" }, { title: "Wikimedia Commons: Longueau-ftdurail2013-cc 72084.JPG", url: "https://commons.wikimedia.org/wiki/File:Longueau-ftdurail2013-cc_72084.JPG" }],
  "proc-vehicle-sncf-corail-coach": [{ title: "Wikipedia: Corail", url: "https://en.wikipedia.org/wiki/Corail" }],
  "proc-vehicle-sncf-grand-confort": [{ title: "Wikipedia: Grand Confort", url: "https://en.wikipedia.org/wiki/Grand_Confort" }, { title: "Wikimedia Commons: Lounge Library with Modern Classic Furniture.jpg", url: "https://commons.wikimedia.org/wiki/File:Lounge_Library_with_Modern_Classic_Furniture.jpg" }],
  "proc-vehicle-sncf-regio2n": [{ title: "Wikipedia: Regio 2N", url: "https://en.wikipedia.org/wiki/Regio_2N" }, { title: "Wikimedia Commons: Regio2N 003XL en gare de Longueau.jpg", url: "https://commons.wikimedia.org/wiki/File:Regio2N_003XL_en_gare_de_Longueau.jpg" }],
  "proc-vehicle-sncf-regiolis": [{ title: "Wikipedia: Régiolis", url: "https://en.wikipedia.org/wiki/R%C3%A9giolis" }, { title: "Wikimedia Commons: B84549 à Montreuil-Bellay (2) par Cramos.JPG", url: "https://commons.wikimedia.org/wiki/File:B84549_%C3%A0_Montreuil-Bellay_(2)_par_Cramos.JPG" }],
  "proc-vehicle-sncf-tgv-m": [{ title: "Wikipedia: Avelia Horizon", url: "https://en.wikipedia.org/wiki/Avelia_Horizon" }, { title: "Wikimedia Commons: TGM M à gare de Lyon (3) (cropped).jpg", url: "https://commons.wikimedia.org/wiki/File:TGM_M_%C3%A0_gare_de_Lyon_(3)_(cropped).jpg" }],
  "proc-vehicle-sncf-x3800": [{ title: "Wikipedia: SNCF Class X 3800", url: "https://en.wikipedia.org/wiki/SNCF_Class_X_3800" }, { title: "Wikimedia Commons: Mine museum diesel locomotive autorail Picasso X4042 at Petite-Rosselle pic-005.JPG", url: "https://commons.wikimedia.org/wiki/File:Mine_museum_diesel_locomotive_autorail_Picasso_X4042_at_Petite-Rosselle_pic-005.JPG" }],
  "proc-vehicle-sncf-x73500": [{ title: "Wikipedia: A TER", url: "https://en.wikipedia.org/wiki/A_TER" }, { title: "Wikimedia Commons: Moreuil - X73595 en gare.jpg", url: "https://commons.wikimedia.org/wiki/File:Moreuil_-_X73595_en_gare.jpg" }],
  "proc-vehicle-sncf-z20500": [{ title: "Wikipedia: SNCF Class Z 20500", url: "https://en.wikipedia.org/wiki/SNCF_Class_Z_20500" }, { title: "Wikimedia Commons: Z 20500 IDF Mobilités Ligne P.jpg", url: "https://commons.wikimedia.org/wiki/File:Z_20500_IDF_Mobilit%C3%A9s_Ligne_P.jpg" }],
  "proc-vehicle-talgo-iii": [{ title: "Wikipedia: Talgo", url: "https://en.wikipedia.org/wiki/Talgo" }],
  // the world fleet: its articles and its photographs' Commons pages (docs/models/world-fleet.md)
  ...FLEET_LINKS,
};

/** A model's web links; empty when it has none. */
export function linksOf(id: string, table: Readonly<Record<string, readonly ModelLink[]>> = MODEL_LINKS): readonly ModelLink[] {
  return table[id] ?? [];
}

/**
 * What is wrong with the table, one line per problem: a link of a model that does
 * not exist, an empty title, a URL that is not https, or the same URL twice on one model.
 */
export function linkTableProblems(ids: Iterable<string>, table: Readonly<Record<string, readonly ModelLink[]>> = MODEL_LINKS): string[] {
  const known = new Set(ids);
  const out: string[] = [];
  for (const [id, links] of Object.entries(table)) {
    if (!known.has(id)) out.push(`${id}: no such model`);
    const seen = new Set<string>();
    for (const l of links) {
      if (!l.title.trim()) out.push(`${id}: a link without a title (${l.url})`);
      let ok = false;
      try {
        ok = new URL(l.url).protocol === "https:";
      } catch {
        ok = false;
      }
      if (!ok) out.push(`${id}: "${l.url}" is not an https URL`);
      if (seen.has(l.url)) out.push(`${id}: "${l.url}" is listed twice`);
      seen.add(l.url);
    }
  }
  return out;
}
