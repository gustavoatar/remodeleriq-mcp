// ZIP Code to MSA (Metropolitan Statistical Area) Lookup
// Used for regional wage data lookup from BLS OEWS data
// Phase 1C: County-to-MSA mapping using OMB Crosswalk for Google Places integration

export interface MSAInfo {
  msaCode: string;
  msaName: string;
  state: string;
}

// ============================================================================
// County FIPS to MSA Mapping (OMB Crosswalk)
// Used when Google Places returns administrative_area_level_2 (County)
// Source: OMB Bulletin 20-01, March 2020
// ============================================================================

export interface CountyMSAMapping {
  countyFips: string;
  countyName: string;
  state: string;
  msaCode: string;
  msaName: string;
}

// County name (lowercase) → MSA mapping
// This handles Google Places' administrative_area_level_2 response
export const COUNTY_TO_MSA: Record<string, MSAInfo> = {
  // ===== GEORGIA (Atlanta MSA: 12060) =====
  'fulton county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'dekalb county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'gwinnett county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'cobb county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'clayton county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'cherokee county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'forsyth county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'henry county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'douglas county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'paulding county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'coweta county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'fayette county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'rockdale county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'newton county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'bartow county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'walton county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'hall county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'carroll county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'barrow county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'pickens county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'spalding county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'butts county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'jasper county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'lamar county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'morgan county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'dawson county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'haralson county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'heard county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'meriwether county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  'pike county': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },

  // ===== TEXAS (Dallas MSA: 19100) =====
  'dallas county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'tarrant county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'collin county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'denton county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'ellis county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'johnson county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'kaufman county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'parker county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'rockwall county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'wise county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'hunt county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'hood county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  'somervell county': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },

  // ===== TEXAS (Houston MSA: 26420) =====
  'harris county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'fort bend county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'montgomery county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'brazoria county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'galveston county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'liberty county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'chambers county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'waller county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  'austin county': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },

  // ===== TEXAS (Austin MSA: 12420) =====
  'travis county': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  'williamson county': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  'hays county': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  'bastrop county': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  'caldwell county': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },

  // ===== CALIFORNIA (Los Angeles MSA: 31080) =====
  'los angeles county': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  'orange county': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },

  // ===== CALIFORNIA (San Francisco MSA: 41860) =====
  'san francisco county': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  'alameda county': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  'contra costa county': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  'san mateo county': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  'marin county': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },

  // ===== CALIFORNIA (San Diego MSA: 41740) =====
  'san diego county': { msaCode: '41740', msaName: 'San Diego-Chula Vista-Carlsbad, CA', state: 'CA' },

  // ===== NEW YORK (New York MSA: 35620) =====
  'new york county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'kings county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'queens county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'bronx county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'richmond county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'nassau county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'suffolk county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'westchester county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'rockland county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  'putnam county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },

  // ===== NEW JERSEY (New York MSA: 35620) =====
  'essex county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'hudson county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'bergen county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'passaic county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'union county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'middlesex county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'monmouth county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'ocean county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'morris county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'somerset county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'hunterdon county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  'sussex county': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },

  // ===== ILLINOIS (Chicago MSA: 16980) =====
  'cook county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'dupage county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'lake county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'will county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'kane county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'mchenry county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'kendall county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  'grundy county': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },

  // ===== FLORIDA (Miami MSA: 33100) =====
  'miami-dade county': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  'broward county': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  'palm beach county': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },

  // ===== FLORIDA (Tampa MSA: 45300) =====
  'hillsborough county': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  'pinellas county': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  'pasco county': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  'hernando county': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },

  // ===== FLORIDA (Orlando MSA: 36740) =====
  'orange county, fl': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  'seminole county': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  'osceola county': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  'lake county, fl': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },

  // ===== FLORIDA (Jacksonville MSA: 27260) =====
  'duval county': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  'st. johns county': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  'clay county': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  'nassau county, fl': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  'baker county': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },

  // ===== ARIZONA (Phoenix MSA: 38060) =====
  'maricopa county': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  'pinal county': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },

  // ===== COLORADO (Denver MSA: 19740) =====
  'denver county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'arapahoe county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'jefferson county, co': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'adams county, co': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'douglas county, co': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'broomfield county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'boulder county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'elbert county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'park county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'clear creek county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  'gilpin county': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },

  // ===== WASHINGTON (Seattle MSA: 42660) =====
  'king county': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  'pierce county': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  'snohomish county': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },

  // ===== OREGON (Portland MSA: 38900) =====
  'multnomah county': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  'washington county': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  'clackamas county': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  'yamhill county': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  'columbia county': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },

  // ===== MICHIGAN (Detroit MSA: 19820) =====
  'wayne county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'oakland county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'macomb county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'livingston county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'washtenaw county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'st. clair county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  'lapeer county': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },

  // ===== MINNESOTA (Minneapolis MSA: 33460) =====
  'hennepin county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'ramsey county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'dakota county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'anoka county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'washington county, mn': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'scott county, mn': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'carver county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  'wright county': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },

  // ===== MASSACHUSETTS (Boston MSA: 14460) =====
  'suffolk county, ma': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  'middlesex county, ma': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  'norfolk county': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  'essex county, ma': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  'plymouth county': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },

  // ===== PENNSYLVANIA (Philadelphia MSA: 37980) =====
  'philadelphia county': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  'montgomery county, pa': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  'bucks county': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  'delaware county, pa': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  'chester county': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },

  // ===== DC / Virginia / Maryland (Washington MSA: 47900) =====
  'district of columbia': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  'arlington county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  'fairfax county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  'loudoun county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  'prince william county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  'prince george\'s county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  'montgomery county, md': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  'howard county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  'charles county': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  'frederick county, md': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },

  // ===== NORTH CAROLINA (Charlotte MSA: 16740) =====
  'mecklenburg county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'union county, nc': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'cabarrus county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'gaston county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'iredell county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'lincoln county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  'rowan county': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },

  // ===== TENNESSEE (Nashville MSA: 34980) =====
  'davidson county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'williamson county, tn': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'rutherford county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'sumner county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'wilson county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'maury county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'robertson county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'dickson county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  'cheatham county': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },

  // ===== NEVADA (Las Vegas MSA: 29820) =====
  'clark county': { msaCode: '29820', msaName: 'Las Vegas-Henderson-Paradise, NV', state: 'NV' },
};

// Major MSA codes used in BLS data
export const MSA_CODES = {
  ATLANTA: '12060',
  CHICAGO: '16980',
  DALLAS: '19100',
  DENVER: '19740',
  HOUSTON: '26420',
  LOS_ANGELES: '31080',
  MIAMI: '33100',
  NEW_YORK: '35620',
  PHOENIX: '38060',
  SEATTLE: '42660',
  // Additional metros for expansion
  TAMPA: '45300',
  ORLANDO: '36740',
  JACKSONVILLE: '27260',
  SAN_FRANCISCO: '41860',
  BOSTON: '14460',
  DETROIT: '19820',
  MINNEAPOLIS: '33460',
  SAN_DIEGO: '41740',
  PORTLAND: '38900',
  AUSTIN: '12420',
  CHARLOTTE: '16740',
  NASHVILLE: '34980',
  LAS_VEGAS: '29820',
  PHILADELPHIA: '37980',
  WASHINGTON_DC: '47900',
} as const;

// ZIP Code to MSA mapping - comprehensive coverage of major metros
// Format: ZIP prefix (3-5 digits) → MSA info
const ZIP_TO_MSA_MAP: Record<string, MSAInfo> = {
  // Atlanta, GA (12060) - 300xx-319xx
  '300': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '301': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '302': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '303': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '304': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '305': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '306': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '307': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '308': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '309': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '310': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '311': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  '312': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', state: 'GA' },
  
  // Dallas-Fort Worth, TX (19100) - 750xx-759xx, 760xx-761xx
  '750': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '751': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '752': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '753': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '754': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '755': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '760': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '761': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  '762': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', state: 'TX' },
  
  // Houston, TX (26420) - 770xx-779xx
  '770': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '771': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '772': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '773': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '774': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '775': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '776': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  '777': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', state: 'TX' },
  
  // Austin, TX (12420) - 786xx-787xx
  '786': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  '787': { msaCode: '12420', msaName: 'Austin-Round Rock-Georgetown, TX', state: 'TX' },
  
  // Phoenix, AZ (38060) - 850xx-853xx, 855xx
  '850': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  '851': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  '852': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  '853': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  '855': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', state: 'AZ' },
  
  // Los Angeles, CA (31080) - 900xx-935xx
  '900': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '901': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '902': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '903': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '904': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '905': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '906': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '907': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '908': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '910': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '911': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '912': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '913': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '914': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '915': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '916': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '917': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '918': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '926': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '927': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  '928': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', state: 'CA' },
  
  // San Francisco, CA (41860) - 940xx-949xx
  '940': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '941': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '942': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '943': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '944': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '945': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '946': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '947': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '948': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  '949': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', state: 'CA' },
  
  // San Diego, CA (41740) - 919xx-921xx
  '919': { msaCode: '41740', msaName: 'San Diego-Chula Vista-Carlsbad, CA', state: 'CA' },
  '920': { msaCode: '41740', msaName: 'San Diego-Chula Vista-Carlsbad, CA', state: 'CA' },
  '921': { msaCode: '41740', msaName: 'San Diego-Chula Vista-Carlsbad, CA', state: 'CA' },
  
  // New York, NY (35620) - 100xx-119xx, 070xx-089xx (NJ)
  '100': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '101': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '102': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '103': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '104': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '105': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '106': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '107': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '108': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '109': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '110': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '111': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '112': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '113': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '114': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '115': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '116': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NY' },
  '070': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '071': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '072': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '073': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '074': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '075': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '076': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '077': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '078': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '079': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '088': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  '089': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', state: 'NJ' },
  
  // Chicago, IL (16980) - 600xx-608xx
  '600': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '601': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '602': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '603': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '604': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '605': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '606': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '607': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  '608': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', state: 'IL' },
  
  // Miami, FL (33100) - 330xx-334xx
  '330': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  '331': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  '332': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  '333': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  '334': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', state: 'FL' },
  
  // Tampa, FL (45300) - 335xx-336xx, 346xx
  '335': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  '336': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  '337': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  '346': { msaCode: '45300', msaName: 'Tampa-St. Petersburg-Clearwater, FL', state: 'FL' },
  
  // Orlando, FL (36740) - 327xx-329xx, 347xx
  '327': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  '328': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  '329': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  '347': { msaCode: '36740', msaName: 'Orlando-Kissimmee-Sanford, FL', state: 'FL' },
  
  // Jacksonville, FL (27260) - 320xx-322xx
  '320': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  '321': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  '322': { msaCode: '27260', msaName: 'Jacksonville, FL', state: 'FL' },
  
  // Denver, CO (19740) - 800xx-804xx, 806xx
  '800': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  '801': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  '802': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  '803': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  '804': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  '806': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', state: 'CO' },
  
  // Seattle, WA (42660) - 980xx-984xx
  '980': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  '981': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  '982': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  '983': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  '984': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', state: 'WA' },
  
  // Portland, OR (38900) - 970xx-972xx
  '970': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  '971': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  '972': { msaCode: '38900', msaName: 'Portland-Vancouver-Hillsboro, OR-WA', state: 'OR' },
  
  // Detroit, MI (19820) - 480xx-485xx
  '480': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  '481': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  '482': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  '483': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  '484': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  '485': { msaCode: '19820', msaName: 'Detroit-Warren-Dearborn, MI', state: 'MI' },
  
  // Minneapolis, MN (33460) - 550xx-555xx
  '550': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  '551': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  '553': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  '554': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  '555': { msaCode: '33460', msaName: 'Minneapolis-St. Paul-Bloomington, MN-WI', state: 'MN' },
  
  // Boston, MA (14460) - 010xx-024xx
  '010': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '011': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '012': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '013': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '014': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '015': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '016': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '017': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '018': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '019': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '020': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '021': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '022': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '023': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  '024': { msaCode: '14460', msaName: 'Boston-Cambridge-Newton, MA-NH', state: 'MA' },
  
  // Philadelphia, PA (37980) - 190xx-194xx
  '190': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  '191': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  '192': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  '193': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  '194': { msaCode: '37980', msaName: 'Philadelphia-Camden-Wilmington, PA-NJ-DE-MD', state: 'PA' },
  
  // Washington DC (47900) - 200xx-205xx
  '200': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '201': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '202': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '203': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '204': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '205': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'DC' },
  '206': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  '207': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  '208': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  '209': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'MD' },
  '220': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  '221': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  '222': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  '223': { msaCode: '47900', msaName: 'Washington-Arlington-Alexandria, DC-VA-MD-WV', state: 'VA' },
  
  // Charlotte, NC (16740) - 280xx-282xx
  '280': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  '281': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  '282': { msaCode: '16740', msaName: 'Charlotte-Concord-Gastonia, NC-SC', state: 'NC' },
  
  // Nashville, TN (34980) - 370xx-372xx
  '370': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  '371': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  '372': { msaCode: '34980', msaName: 'Nashville-Davidson--Murfreesboro--Franklin, TN', state: 'TN' },
  
  // Las Vegas, NV (29820) - 889xx-891xx
  '889': { msaCode: '29820', msaName: 'Las Vegas-Henderson-Paradise, NV', state: 'NV' },
  '890': { msaCode: '29820', msaName: 'Las Vegas-Henderson-Paradise, NV', state: 'NV' },
  '891': { msaCode: '29820', msaName: 'Las Vegas-Henderson-Paradise, NV', state: 'NV' },
};

// Extract state from ZIP code (first digit indicates region)
const ZIP_STATE_MAPPING: Record<string, string[]> = {
  '0': ['CT', 'MA', 'ME', 'NH', 'NJ', 'NY', 'PR', 'RI', 'VT', 'VI'],
  '1': ['DE', 'NY', 'PA'],
  '2': ['DC', 'MD', 'NC', 'SC', 'VA', 'WV'],
  '3': ['AL', 'FL', 'GA', 'MS', 'TN'],
  '4': ['IN', 'KY', 'MI', 'OH'],
  '5': ['IA', 'MN', 'MT', 'ND', 'SD', 'WI'],
  '6': ['IL', 'KS', 'MO', 'NE'],
  '7': ['AR', 'LA', 'OK', 'TX'],
  '8': ['AZ', 'CO', 'ID', 'NM', 'NV', 'UT', 'WY'],
  '9': ['AK', 'CA', 'HI', 'OR', 'WA'],
};

/**
 * Look up MSA info from a ZIP code
 * Returns MSA info if found, null otherwise
 */
export function getMSAFromZip(zipCode: string): MSAInfo | null {
  if (!zipCode || zipCode.length < 3) return null;
  
  const zip = zipCode.replace(/\D/g, '').substring(0, 5);
  if (zip.length < 3) return null;
  
  // Try exact 3-digit prefix first
  const prefix3 = zip.substring(0, 3);
  if (ZIP_TO_MSA_MAP[prefix3]) {
    return ZIP_TO_MSA_MAP[prefix3];
  }
  
  return null;
}

/**
 * Get state abbreviation from ZIP code
 * Uses ZIP prefix patterns to determine state
 */
export function getStateFromZip(zipCode: string): string | null {
  if (!zipCode || zipCode.length < 1) return null;
  
  const zip = zipCode.replace(/\D/g, '');
  if (zip.length < 1) return null;
  
  // First, check if we have MSA info (which includes state)
  const msaInfo = getMSAFromZip(zip);
  if (msaInfo) {
    return msaInfo.state;
  }
  
  // Fallback to region-based state guess (not precise)
  const firstDigit = zip[0];
  const possibleStates = ZIP_STATE_MAPPING[firstDigit];
  
  // Return the most likely state for the region (first in list)
  return possibleStates ? possibleStates[0] : null;
}

/**
 * Get all MSA codes that have wage data available
 */
export function getAvailableMSACodes(): string[] {
  return Object.values(MSA_CODES);
}

/**
 * Check if a ZIP code is in a major metro area with MSA data
 */
export function isInMajorMetro(zipCode: string): boolean {
  return getMSAFromZip(zipCode) !== null;
}

// ============================================================================
// County-based MSA Lookup (Phase 1C - Google Places Integration)
// ============================================================================

/**
 * Look up MSA from county name (from Google Places administrative_area_level_2)
 * Handles variations like "Fulton County", "Fulton", "Fulton Co."
 */
export function getMSAFromCounty(countyName: string, stateCode?: string): MSAInfo | null {
  if (!countyName) return null;
  
  // Normalize: lowercase, handle "Co." abbreviation, ensure "county" suffix
  let normalized = countyName.toLowerCase().trim();
  normalized = normalized.replace(/\bco\.?\b/gi, 'county');
  
  // Add "county" if not present
  if (!normalized.includes('county')) {
    normalized = normalized + ' county';
  }
  
  // Try direct lookup
  if (COUNTY_TO_MSA[normalized]) {
    const msaInfo = COUNTY_TO_MSA[normalized];
    // If state provided, verify it matches (handles county name conflicts)
    if (stateCode && msaInfo.state !== stateCode.toUpperCase()) {
      // Look for another entry with matching state
      // Some county names exist in multiple states
      return null;
    }
    return msaInfo;
  }
  
  return null;
}

/**
 * Get MSA using the best available location data
 * Priority: County (most accurate) > ZIP > State
 */
export function getMSABestEffort(options: {
  county?: string;
  stateCode?: string;
  zipCode?: string;
}): MSAInfo | null {
  const { county, stateCode, zipCode } = options;
  
  // 1. Try county lookup first (most accurate for MSA)
  if (county) {
    const countyMSA = getMSAFromCounty(county, stateCode);
    if (countyMSA) return countyMSA;
  }
  
  // 2. Try ZIP lookup
  if (zipCode) {
    const zipMSA = getMSAFromZip(zipCode);
    if (zipMSA) return zipMSA;
  }
  
  // 3. No MSA found - return null (caller should use state-level fallback)
  return null;
}

/**
 * Parse Google Places address components to extract county and state
 */
export interface GooglePlacesLocation {
  county?: string;
  state?: string;
  stateCode?: string;
  postalCode?: string;
  city?: string;
}

export function parseGooglePlacesComponents(
  addressComponents: Array<{ long_name: string; short_name: string; types: string[] }>
): GooglePlacesLocation {
  const result: GooglePlacesLocation = {};
  
  for (const component of addressComponents) {
    if (component.types.includes('administrative_area_level_2')) {
      result.county = component.long_name;
    }
    if (component.types.includes('administrative_area_level_1')) {
      result.state = component.long_name;
      result.stateCode = component.short_name;
    }
    if (component.types.includes('postal_code')) {
      result.postalCode = component.short_name;
    }
    if (component.types.includes('locality')) {
      result.city = component.long_name;
    }
  }
  
  return result;
}
