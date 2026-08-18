// Auto-generated Aug 2026 for the RemodelerIQ Construction Labor Index.
// Sources (all real): BLS OEWS wage estimates (national + 11 MSAs, latest
// published release; 2026 OEWS is not yet published) with per-trade billing
// burden multipliers, and RemodelerIQ's 152-metro regional cost index
// (Zonda-validated). Wages are escalated to 2026 with LABOR_ESCALATION.
// Nothing here is fabricated: the regression uses the 9 metros that have BOTH
// an independent BLS median-wage measurement AND a cost-index value.
//
// Regenerate: see scripts/gen-labor-index.md (queries MAMP + blsOewsData.ts).

export const LABOR_ESCALATION = 1.059; // matches REMODEL_GUIDE_ESCALATION
export const BLS_RELEASE = "BLS OEWS, latest published estimates";
export const INDEX_QUARTER = "Q3 2026";

export interface TradeWage {
  soc: string;
  trade: string;
  p10: number;    // BLS 10th-percentile hourly (base, pre-escalation)
  median: number; // BLS median hourly
  p90: number;    // BLS 90th-percentile hourly
  burden: number; // multiplier: base wage -> billed labor rate
}

// National BLS trade wages (base $/hr), ranked by billed median (median*burden).
export const NATIONAL_TRADES: TradeWage[] = [
  {soc:"47-2152",trade:"Plumber",p10:18.65,median:30.46,p90:51.98,burden:2.00},
  {soc:"47-2111",trade:"Electrician",p10:18.93,median:30.14,p90:51.60,burden:2.00},
  {soc:"49-9021",trade:"HVAC technician",p10:17.41,median:26.71,p90:44.62,burden:2.00},
  {soc:"47-2211",trade:"Sheet metal worker",p10:17.59,median:27.87,p90:49.50,burden:1.85},
  {soc:"47-2021",trade:"Brickmason",p10:17.06,median:27.09,p90:44.81,burden:1.85},
  {soc:"47-2031",trade:"Carpenter",p10:16.87,median:26.00,p90:42.36,burden:1.85},
  {soc:"47-2022",trade:"Stonemason",p10:16.08,median:24.74,p90:40.75,burden:1.85},
  {soc:"47-2121",trade:"Glazier",p10:16.14,median:25.34,p90:45.06,burden:1.75},
  {soc:"47-2081",trade:"Drywall installer",p10:15.64,median:24.27,p90:41.23,burden:1.75},
  {soc:"47-2044",trade:"Tile setter",p10:15.42,median:24.04,p90:41.74,burden:1.75},
  {soc:"47-2051",trade:"Cement mason",p10:15.48,median:23.64,p90:40.19,burden:1.75},
  {soc:"47-2181",trade:"Roofer",p10:14.68,median:22.22,p90:38.00,burden:1.85},
  {soc:"47-2131",trade:"Insulation worker",p10:15.09,median:23.34,p90:42.52,burden:1.75},
  {soc:"47-2042",trade:"Floor layer",p10:14.39,median:22.55,p90:38.68,burden:1.75},
  {soc:"47-2141",trade:"Painter",p10:14.67,median:22.01,p90:36.96,burden:1.65},
  {soc:"47-2061",trade:"General laborer",p10:14.13,median:20.43,p90:33.58,burden:1.65},];

export interface MetroIndex {
  slug: string;
  city: string;
  st: string;
  msa: string;
  index: number; // regional cost index, national = 1.00
}

// 152 metros with their RemodelerIQ regional cost index.
export const METROS: MetroIndex[] = [
  {slug:"san-francisco-ca",city:"San Francisco",st:"CA",msa:"41860",index:1.5000},
  {slug:"san-jose-ca",city:"San Jose",st:"CA",msa:"41940",index:1.4800},
  {slug:"new-york-ny",city:"New York",st:"NY",msa:"35620",index:1.4500},
  {slug:"honolulu-hi",city:"Honolulu",st:"HI",msa:"46520",index:1.4200},
  {slug:"los-angeles-ca",city:"Los Angeles",st:"CA",msa:"31080",index:1.4000},
  {slug:"santa-cruz-ca",city:"Santa Cruz",st:"CA",msa:"42100",index:1.3800},
  {slug:"santa-barbara-ca",city:"Santa Barbara",st:"CA",msa:"42200",index:1.3600},
  {slug:"san-diego-ca",city:"San Diego",st:"CA",msa:"41740",index:1.3500},
  {slug:"seattle-wa",city:"Seattle",st:"WA",msa:"42660",index:1.3500},
  {slug:"santa-rosa-ca",city:"Santa Rosa",st:"CA",msa:"42220",index:1.3200},
  {slug:"washington-dc",city:"Washington",st:"DC",msa:"47900",index:1.3200},
  {slug:"oxnard-ca",city:"Oxnard",st:"CA",msa:"37100",index:1.3000},
  {slug:"riverside-ca",city:"Riverside",st:"CA",msa:"40140",index:1.3000},
  {slug:"salinas-ca",city:"Salinas",st:"CA",msa:"41500",index:1.3000},
  {slug:"boston-ma",city:"Boston",st:"MA",msa:"14460",index:1.2800},
  {slug:"fairbanks-ak",city:"Fairbanks",st:"AK",msa:"21820",index:1.2800},
  {slug:"stockton-ca",city:"Stockton",st:"CA",msa:"44700",index:1.2500},
  {slug:"bridgeport-ct",city:"Bridgeport",st:"CT",msa:"14860",index:1.2400},
  {slug:"vallejo-ca",city:"Vallejo",st:"CA",msa:"46700",index:1.2400},
  {slug:"denver-co",city:"Denver",st:"CO",msa:"19740",index:1.2200},
  {slug:"miami-fl",city:"Miami",st:"FL",msa:"33100",index:1.2200},
  {slug:"new-haven-ct",city:"New Haven",st:"CT",msa:"35300",index:1.2000},
  {slug:"portland-or",city:"Portland",st:"OR",msa:"38900",index:1.2000},
  {slug:"trenton-nj",city:"Trenton",st:"NJ",msa:"45940",index:1.1800},
  {slug:"worcester-ma",city:"Worcester",st:"MA",msa:"49340",index:1.1800},
  {slug:"boulder-co",city:"Boulder",st:"CO",msa:"14500",index:1.1600},
  {slug:"sacramento-ca",city:"Sacramento",st:"CA",msa:"40900",index:1.1600},
  {slug:"philadelphia-pa",city:"Philadelphia",st:"PA",msa:"37980",index:1.1500},
  {slug:"poughkeepsie-ny",city:"Poughkeepsie",st:"NY",msa:"39100",index:1.1400},
  {slug:"baltimore-md",city:"Baltimore",st:"MD",msa:"12580",index:1.1000},
  {slug:"bend-or",city:"Bend",st:"OR",msa:"13460",index:1.1000},
  {slug:"modesto-ca",city:"Modesto",st:"CA",msa:"33700",index:1.1000},
  {slug:"springfield-ma",city:"Springfield",st:"MA",msa:"44140",index:1.1000},
  {slug:"albany-ny",city:"Albany",st:"NY",msa:"10580",index:1.0800},
  {slug:"allentown-pa",city:"Allentown",st:"PA",msa:"10900",index:1.0800},
  {slug:"bellingham-wa",city:"Bellingham",st:"WA",msa:"13380",index:1.0800},
  {slug:"fresno-ca",city:"Fresno",st:"CA",msa:"23420",index:1.0800},
  {slug:"olympia-wa",city:"Olympia",st:"WA",msa:"36500",index:1.0800},
  {slug:"new-orleans-la",city:"New Orleans",st:"LA",msa:"35380",index:1.0700},
  {slug:"reno-nv",city:"Reno",st:"NV",msa:"39900",index:1.0600},
  {slug:"santa-fe-nm",city:"Santa Fe",st:"NM",msa:"42140",index:1.0600},
  {slug:"ann-arbor-mi",city:"Ann Arbor",st:"MI",msa:"11460",index:1.0500},
  {slug:"austin-tx",city:"Austin",st:"TX",msa:"12420",index:1.0500},
  {slug:"chicago-il",city:"Chicago",st:"IL",msa:"16980",index:1.0500},
  {slug:"detroit-mi",city:"Detroit",st:"MI",msa:"19820",index:1.0500},
  {slug:"eugene-or",city:"Eugene",st:"OR",msa:"21660",index:1.0500},
  {slug:"las-vegas-nv",city:"Las Vegas",st:"NV",msa:"29820",index:1.0500},
  {slug:"minneapolis-mn",city:"Minneapolis",st:"MN",msa:"33460",index:1.0500},
  {slug:"nashville-tn",city:"Nashville",st:"TN",msa:"34980",index:1.0500},
  {slug:"salem-or",city:"Salem",st:"OR",msa:"41420",index:1.0500},
  {slug:"hartford-ct",city:"Hartford",st:"CT",msa:"25540",index:1.0400},
  {slug:"providence-ri",city:"Providence",st:"RI",msa:"39300",index:1.0400},
  {slug:"milwaukee-wi",city:"Milwaukee",st:"WI",msa:"33340",index:1.0300},
  {slug:"atlanta-ga",city:"Atlanta",st:"GA",msa:"12060",index:1.0200},
  {slug:"charlottesville-va",city:"Charlottesville",st:"VA",msa:"16820",index:1.0200},
  {slug:"duluth-mn",city:"Duluth",st:"MN",msa:"20260",index:1.0200},
  {slug:"fort-collins-co",city:"Fort Collins",st:"CO",msa:"22660",index:1.0200},
  {slug:"harrisburg-pa",city:"Harrisburg",st:"PA",msa:"25420",index:1.0200},
  {slug:"madison-wi",city:"Madison",st:"WI",msa:"31540",index:1.0200},
  {slug:"rochester-ny",city:"Rochester",st:"NY",msa:"40380",index:1.0200},
  {slug:"rochester-mn",city:"Rochester",st:"MN",msa:"40340",index:1.0200},
  {slug:"dallas-tx",city:"Dallas",st:"TX",msa:"19100",index:1.0000},
  {slug:"green-bay-wi",city:"Green Bay",st:"WI",msa:"24580",index:1.0000},
  {slug:"lancaster-pa",city:"Lancaster",st:"PA",msa:"29540",index:1.0000},
  {slug:"missoula-mt",city:"Missoula",st:"MT",msa:"33540",index:1.0000},
  {slug:"north-port-fl",city:"North Port",st:"FL",msa:"35840",index:1.0000},
  {slug:"orlando-fl",city:"Orlando",st:"FL",msa:"36740",index:1.0000},
  {slug:"pittsburgh-pa",city:"Pittsburgh",st:"PA",msa:"38300",index:1.0000},
  {slug:"raleigh-nc",city:"Raleigh",st:"NC",msa:"39580",index:1.0000},
  {slug:"salt-lake-city-ut",city:"Salt Lake City",st:"UT",msa:"41620",index:1.0000},
  {slug:"spokane-wa",city:"Spokane",st:"WA",msa:"44060",index:1.0000},
  {slug:"syracuse-ny",city:"Syracuse",st:"NY",msa:"45060",index:1.0000},
  {slug:"tampa-fl",city:"Tampa",st:"FL",msa:"45300",index:1.0000},
  {slug:"boise-id",city:"Boise",st:"ID",msa:"14260",index:0.9900},
  {slug:"colorado-springs-co",city:"Colorado Springs",st:"CO",msa:"17820",index:0.9900},
  {slug:"albuquerque-nm",city:"Albuquerque",st:"NM",msa:"10180",index:0.9800},
  {slug:"asheville-nc",city:"Asheville",st:"NC",msa:"11700",index:0.9800},
  {slug:"buffalo-ny",city:"Buffalo",st:"NY",msa:"15380",index:0.9800},
  {slug:"charlotte-nc",city:"Charlotte",st:"NC",msa:"16740",index:0.9800},
  {slug:"greensboro-nc",city:"Greensboro",st:"NC",msa:"24660",index:0.9800},
  {slug:"jacksonville-fl",city:"Jacksonville",st:"FL",msa:"27260",index:0.9800},
  {slug:"phoenix-az",city:"Phoenix",st:"AZ",msa:"38060",index:0.9800},
  {slug:"provo-ut",city:"Provo",st:"UT",msa:"39340",index:0.9800},
  {slug:"richmond-va",city:"Richmond",st:"VA",msa:"40060",index:0.9800},
  {slug:"scranton-pa",city:"Scranton",st:"PA",msa:"42540",index:0.9800},
  {slug:"st-louis-mo",city:"St. Louis",st:"MO",msa:"41180",index:0.9800},
  {slug:"tucson-az",city:"Tucson",st:"AZ",msa:"46060",index:0.9800},
  {slug:"virginia-beach-va",city:"Virginia Beach",st:"VA",msa:"47260",index:0.9800},
  {slug:"billings-mt",city:"Billings",st:"MT",msa:"13740",index:0.9700},
  {slug:"cape-coral-fl",city:"Cape Coral",st:"FL",msa:"15980",index:0.9700},
  {slug:"charleston-sc",city:"Charleston",st:"SC",msa:"16700",index:0.9700},
  {slug:"des-moines-ia",city:"Des Moines",st:"IA",msa:"19780",index:0.9700},
  {slug:"lansing-mi",city:"Lansing",st:"MI",msa:"29620",index:0.9700},
  {slug:"ogden-ut",city:"Ogden",st:"UT",msa:"36260",index:0.9700},
  {slug:"akron-oh",city:"Akron",st:"OH",msa:"10420",index:0.9600},
  {slug:"cincinnati-oh",city:"Cincinnati",st:"OH",msa:"17140",index:0.9600},
  {slug:"cleveland-oh",city:"Cleveland",st:"OH",msa:"17460",index:0.9600},
  {slug:"columbus-oh",city:"Columbus",st:"OH",msa:"18140",index:0.9600},
  {slug:"durham-nc",city:"Durham",st:"NC",msa:"20500",index:0.9600},
  {slug:"grand-rapids-mi",city:"Grand Rapids",st:"MI",msa:"24340",index:0.9600},
  {slug:"houston-tx",city:"Houston",st:"TX",msa:"26420",index:0.9500},
  {slug:"kansas-city-mo",city:"Kansas City",st:"MO",msa:"28140",index:0.9500},
  {slug:"omaha-ne",city:"Omaha",st:"NE",msa:"36540",index:0.9500},
  {slug:"san-antonio-tx",city:"San Antonio",st:"TX",msa:"41700",index:0.9500},
  {slug:"toledo-oh",city:"Toledo",st:"OH",msa:"45780",index:0.9500},
  {slug:"appleton-wi",city:"Appleton",st:"WI",msa:"11540",index:0.9400},
  {slug:"cedar-rapids-ia",city:"Cedar Rapids",st:"IA",msa:"16300",index:0.9400},
  {slug:"deltona-fl",city:"Deltona",st:"FL",msa:"19660",index:0.9400},
  {slug:"indianapolis-in",city:"Indianapolis",st:"IN",msa:"26900",index:0.9400},
  {slug:"lakeland-fl",city:"Lakeland",st:"FL",msa:"29460",index:0.9400},
  {slug:"myrtle-beach-sc",city:"Myrtle Beach",st:"SC",msa:"34820",index:0.9400},
  {slug:"roanoke-va",city:"Roanoke",st:"VA",msa:"40220",index:0.9400},
  {slug:"south-bend-in",city:"South Bend",st:"IN",msa:"43780",index:0.9400},
  {slug:"dayton-oh",city:"Dayton",st:"OH",msa:"19430",index:0.9300},
  {slug:"gainesville-fl",city:"Gainesville",st:"FL",msa:"23540",index:0.9300},
  {slug:"greenville-sc",city:"Greenville",st:"SC",msa:"24860",index:0.9300},
  {slug:"lincoln-ne",city:"Lincoln",st:"NE",msa:"30700",index:0.9300},
  {slug:"savannah-ga",city:"Savannah",st:"GA",msa:"42340",index:0.9300},
  {slug:"winston-salem-nc",city:"Winston-Salem",st:"NC",msa:"49180",index:0.9300},
  {slug:"baton-rouge-la",city:"Baton Rouge",st:"LA",msa:"12940",index:0.9200},
  {slug:"columbia-sc",city:"Columbia",st:"SC",msa:"17900",index:0.9200},
  {slug:"fort-wayne-in",city:"Fort Wayne",st:"IN",msa:"23060",index:0.9200},
  {slug:"knoxville-tn",city:"Knoxville",st:"TN",msa:"28940",index:0.9200},
  {slug:"lexington-ky",city:"Lexington",st:"KY",msa:"30460",index:0.9200},
  {slug:"pensacola-fl",city:"Pensacola",st:"FL",msa:"37860",index:0.9200},
  {slug:"youngstown-oh",city:"Youngstown",st:"OH",msa:"49660",index:0.9200},
  {slug:"chattanooga-tn",city:"Chattanooga",st:"TN",msa:"16860",index:0.9100},
  {slug:"evansville-in",city:"Evansville",st:"IN",msa:"21780",index:0.9100},
  {slug:"huntsville-al",city:"Huntsville",st:"AL",msa:"26620",index:0.9100},
  {slug:"tallahassee-fl",city:"Tallahassee",st:"FL",msa:"45220",index:0.9100},
  {slug:"augusta-ga",city:"Augusta",st:"GA",msa:"12260",index:0.9000},
  {slug:"corpus-christi-tx",city:"Corpus Christi",st:"TX",msa:"18580",index:0.9000},
  {slug:"el-paso-tx",city:"El Paso",st:"TX",msa:"21340",index:0.9000},
  {slug:"fayetteville-nc",city:"Fayetteville",st:"NC",msa:"22180",index:0.9000},
  {slug:"lafayette-la",city:"Lafayette",st:"LA",msa:"29180",index:0.9000},
  {slug:"louisville-jefferson-county-ky",city:"Louisville/Jefferson County",st:"KY",msa:"31140",index:0.9000},
  {slug:"tulsa-ok",city:"Tulsa",st:"OK",msa:"46140",index:0.9000},
  {slug:"wichita-ks",city:"Wichita",st:"KS",msa:"48620",index:0.9000},
  {slug:"fayetteville-ar",city:"Fayetteville",st:"AR",msa:"22220",index:0.8900},
  {slug:"little-rock-ar",city:"Little Rock",st:"AR",msa:"30780",index:0.8900},
  {slug:"mobile-al",city:"Mobile",st:"AL",msa:"33660",index:0.8900},
  {slug:"shreveport-la",city:"Shreveport",st:"LA",msa:"43340",index:0.8900},
  {slug:"springfield-mo",city:"Springfield",st:"MO",msa:"44180",index:0.8900},
  {slug:"waco-tx",city:"Waco",st:"TX",msa:"47380",index:0.8900},
  {slug:"amarillo-tx",city:"Amarillo",st:"TX",msa:"11100",index:0.8800},
  {slug:"jackson-ms",city:"Jackson",st:"MS",msa:"27140",index:0.8800},
  {slug:"lubbock-tx",city:"Lubbock",st:"TX",msa:"31180",index:0.8800},
  {slug:"memphis-tn",city:"Memphis",st:"TN",msa:"32820",index:0.8800},
  {slug:"montgomery-al",city:"Montgomery",st:"AL",msa:"33860",index:0.8800},
  {slug:"oklahoma-city-ok",city:"Oklahoma City",st:"OK",msa:"36420",index:0.8800},
  {slug:"birmingham-al",city:"Birmingham",st:"AL",msa:"13820",index:0.8500},
  {slug:"mcallen-tx",city:"McAllen",st:"TX",msa:"32580",index:0.8500},];

export interface RegPoint {
  city: string;
  index: number;     // cost index (x)
  blsMedian: number; // independently-measured BLS composite median $/hr (y)
}

// The 9 metros with BOTH a real BLS MSA wage measurement and a cost index.
// These are the ONLY points in the validation regression — no derived points.
export const REGRESSION_POINTS: RegPoint[] = [
  {city:"Houston",index:0.95,blsMedian:26.67},
  {city:"Phoenix",index:0.98,blsMedian:25.76},
  {city:"Dallas",index:1.00,blsMedian:26.01},
  {city:"Atlanta",index:1.02,blsMedian:25.65},
  {city:"Chicago",index:1.05,blsMedian:36.76},
  {city:"Miami",index:1.22,blsMedian:25.09},
  {city:"Denver",index:1.22,blsMedian:28.78},
  {city:"Los Angeles",index:1.40,blsMedian:39.64},
  {city:"New York",index:1.45,blsMedian:44.56},];
