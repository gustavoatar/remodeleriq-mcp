/**
 * Lazy-loaded ZIP to MSA/State lookup module
 * 
 * This module is only loaded when ZIP lookup is actually needed,
 * reducing cold start times for requests that don't need geographic data.
 */

export interface MsaInfo {
  msaCode: string;
  msaName: string;
  stateCode: string;
}

export interface ZipLookupResult {
  stateCode: string;
  msaCode?: string;
  msaName?: string;
}

// Lazy singleton for ZIP data
let _zipToMsa: Record<string, MsaInfo> | null = null;
let _zipPrefixToState: Record<string, string> | null = null;

function getZipToMsa(): Record<string, MsaInfo> {
  if (_zipToMsa) return _zipToMsa;
  
  _zipToMsa = {
    // Atlanta Metro (12060)
    '30301': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30302': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30303': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30305': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30306': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30307': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30308': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30309': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30310': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30311': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30312': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30313': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30314': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30315': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30316': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30317': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30318': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30319': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30324': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30326': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30327': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30328': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30329': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30331': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30332': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30334': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30336': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30337': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30338': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30339': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30340': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30341': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30342': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30344': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30345': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30346': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30349': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30350': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30354': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30360': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30363': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    // Alpharetta/Johns Creek/Roswell
    '30004': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30005': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30009': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30022': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30024': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30041': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30043': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30044': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30045': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30046': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30047': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30052': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30058': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30060': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30062': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30064': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30066': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30067': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30068': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30071': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30075': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30076': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30078': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30079': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30080': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30082': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30083': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30084': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30087': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30088': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30092': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30093': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30094': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30096': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30097': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30098': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    '30099': { msaCode: '12060', msaName: 'Atlanta-Sandy Springs-Alpharetta, GA', stateCode: 'GA' },
    // Houston Metro (26420)
    '77001': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77002': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77003': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77004': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77005': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77006': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77007': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77008': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77009': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77010': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77019': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77024': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77025': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77027': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77030': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77042': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77056': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77057': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77063': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77077': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77079': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    '77098': { msaCode: '26420', msaName: 'Houston-The Woodlands-Sugar Land, TX', stateCode: 'TX' },
    // Dallas Metro (19100)
    '75201': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75202': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75204': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75205': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75206': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75207': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75208': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75209': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75214': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75219': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75220': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75225': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75230': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75240': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75248': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    '75252': { msaCode: '19100', msaName: 'Dallas-Fort Worth-Arlington, TX', stateCode: 'TX' },
    // Miami Metro (33100)
    '33101': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33109': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33125': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33126': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33127': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33128': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33129': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33130': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33131': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33132': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33133': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33134': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33135': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33136': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33137': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33138': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33139': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33140': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33141': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    '33142': { msaCode: '33100', msaName: 'Miami-Fort Lauderdale-Pompano Beach, FL', stateCode: 'FL' },
    // Phoenix Metro (38060)
    '85001': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85003': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85004': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85006': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85007': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85008': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85012': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85013': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85014': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85015': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85016': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85018': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85020': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85021': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85022': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85023': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85024': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85028': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85029': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    '85032': { msaCode: '38060', msaName: 'Phoenix-Mesa-Chandler, AZ', stateCode: 'AZ' },
    // Denver Metro (19740)
    '80201': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80202': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80203': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80204': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80205': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80206': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80207': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80209': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80210': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80211': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80212': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80218': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80220': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80222': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    '80224': { msaCode: '19740', msaName: 'Denver-Aurora-Lakewood, CO', stateCode: 'CO' },
    // Los Angeles Metro (31080)
    '90001': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90004': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90005': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90006': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90007': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90010': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90012': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90013': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90014': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90015': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90017': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90019': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90020': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90024': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90025': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90027': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90028': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90029': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90034': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90035': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90036': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90038': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90046': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90048': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90064': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90067': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90068': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90069': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90077': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90210': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    '90212': { msaCode: '31080', msaName: 'Los Angeles-Long Beach-Anaheim, CA', stateCode: 'CA' },
    // San Francisco Metro (41860)
    '94102': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94103': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94104': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94105': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94107': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94108': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94109': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94110': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94111': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94112': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94114': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94115': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94116': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94117': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94118': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94121': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94122': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94123': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94124': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    '94127': { msaCode: '41860', msaName: 'San Francisco-Oakland-Berkeley, CA', stateCode: 'CA' },
    // New York Metro (35620)
    '10001': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10002': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10003': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10004': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10005': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10006': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10007': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10009': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10010': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10011': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10012': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10013': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10014': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10016': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10017': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10018': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10019': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10020': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10021': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10022': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10023': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10024': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10025': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10028': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10029': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10030': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10031': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10032': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    '10033': { msaCode: '35620', msaName: 'New York-Newark-Jersey City, NY-NJ-PA', stateCode: 'NY' },
    // Chicago Metro (16980)
    '60601': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60602': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60603': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60604': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60605': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60606': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60607': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60608': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60609': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60610': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60611': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60612': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60613': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60614': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60615': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60616': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60617': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60618': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60619': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    '60620': { msaCode: '16980', msaName: 'Chicago-Naperville-Elgin, IL-IN-WI', stateCode: 'IL' },
    // Seattle Metro (42660)
    '98101': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98102': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98103': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98104': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98105': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98107': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98109': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98112': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98115': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
    '98116': { msaCode: '42660', msaName: 'Seattle-Tacoma-Bellevue, WA', stateCode: 'WA' },
  };
  
  return _zipToMsa;
}

function getZipPrefixToState(): Record<string, string> {
  if (_zipPrefixToState) return _zipPrefixToState;
  
  _zipPrefixToState = {
    // Georgia (300-319, 398-399)
    '300': 'GA', '301': 'GA', '302': 'GA', '303': 'GA', '304': 'GA', '305': 'GA', '306': 'GA', '307': 'GA', '308': 'GA', '309': 'GA',
    '310': 'GA', '311': 'GA', '312': 'GA', '313': 'GA', '314': 'GA', '315': 'GA', '316': 'GA', '317': 'GA', '318': 'GA', '319': 'GA',
    '398': 'GA', '399': 'GA',
    // Texas (750-799)
    '750': 'TX', '751': 'TX', '752': 'TX', '753': 'TX', '754': 'TX', '755': 'TX', '756': 'TX', '757': 'TX', '758': 'TX', '759': 'TX',
    '760': 'TX', '761': 'TX', '762': 'TX', '763': 'TX', '764': 'TX', '765': 'TX', '766': 'TX', '767': 'TX', '768': 'TX', '769': 'TX',
    '770': 'TX', '771': 'TX', '772': 'TX', '773': 'TX', '774': 'TX', '775': 'TX', '776': 'TX', '777': 'TX', '778': 'TX', '779': 'TX',
    '780': 'TX', '781': 'TX', '782': 'TX', '783': 'TX', '784': 'TX', '785': 'TX', '786': 'TX', '787': 'TX', '788': 'TX', '789': 'TX',
    '790': 'TX', '791': 'TX', '792': 'TX', '793': 'TX', '794': 'TX', '795': 'TX', '796': 'TX', '797': 'TX', '798': 'TX', '799': 'TX',
    // Florida (320-349)
    '320': 'FL', '321': 'FL', '322': 'FL', '323': 'FL', '324': 'FL', '325': 'FL', '326': 'FL', '327': 'FL', '328': 'FL', '329': 'FL',
    '330': 'FL', '331': 'FL', '332': 'FL', '333': 'FL', '334': 'FL', '335': 'FL', '336': 'FL', '337': 'FL', '338': 'FL', '339': 'FL',
    '340': 'FL', '341': 'FL', '342': 'FL', '344': 'FL', '346': 'FL', '347': 'FL', '349': 'FL',
    // California (900-961)
    '900': 'CA', '901': 'CA', '902': 'CA', '903': 'CA', '904': 'CA', '905': 'CA', '906': 'CA', '907': 'CA', '908': 'CA', '909': 'CA',
    '910': 'CA', '911': 'CA', '912': 'CA', '913': 'CA', '914': 'CA', '915': 'CA', '916': 'CA', '917': 'CA', '918': 'CA', '919': 'CA',
    '920': 'CA', '921': 'CA', '922': 'CA', '923': 'CA', '924': 'CA', '925': 'CA', '926': 'CA', '927': 'CA', '928': 'CA',
    '930': 'CA', '931': 'CA', '932': 'CA', '933': 'CA', '934': 'CA', '935': 'CA', '936': 'CA', '937': 'CA', '938': 'CA', '939': 'CA',
    '940': 'CA', '941': 'CA', '942': 'CA', '943': 'CA', '944': 'CA', '945': 'CA', '946': 'CA', '947': 'CA', '948': 'CA', '949': 'CA',
    '950': 'CA', '951': 'CA', '952': 'CA', '953': 'CA', '954': 'CA', '955': 'CA', '956': 'CA', '957': 'CA', '958': 'CA', '959': 'CA',
    '960': 'CA', '961': 'CA',
    // New York (100-149)
    '100': 'NY', '101': 'NY', '102': 'NY', '103': 'NY', '104': 'NY', '105': 'NY', '106': 'NY', '107': 'NY', '108': 'NY', '109': 'NY',
    '110': 'NY', '111': 'NY', '112': 'NY', '113': 'NY', '114': 'NY', '115': 'NY', '116': 'NY', '117': 'NY', '118': 'NY', '119': 'NY',
    '120': 'NY', '121': 'NY', '122': 'NY', '123': 'NY', '124': 'NY', '125': 'NY', '126': 'NY', '127': 'NY', '128': 'NY', '129': 'NY',
    '130': 'NY', '131': 'NY', '132': 'NY', '133': 'NY', '134': 'NY', '135': 'NY', '136': 'NY', '137': 'NY', '138': 'NY', '139': 'NY',
    '140': 'NY', '141': 'NY', '142': 'NY', '143': 'NY', '144': 'NY', '145': 'NY', '146': 'NY', '147': 'NY', '148': 'NY', '149': 'NY',
    // Arizona (850-865)
    '850': 'AZ', '851': 'AZ', '852': 'AZ', '853': 'AZ', '855': 'AZ', '856': 'AZ', '857': 'AZ', '858': 'AZ', '859': 'AZ',
    '860': 'AZ', '863': 'AZ', '864': 'AZ', '865': 'AZ',
    // North Carolina (270-289)
    '270': 'NC', '271': 'NC', '272': 'NC', '273': 'NC', '274': 'NC', '275': 'NC', '276': 'NC', '277': 'NC', '278': 'NC', '279': 'NC',
    '280': 'NC', '281': 'NC', '282': 'NC', '283': 'NC', '284': 'NC', '285': 'NC', '286': 'NC', '287': 'NC', '288': 'NC', '289': 'NC',
    // Colorado (800-816)
    '800': 'CO', '801': 'CO', '802': 'CO', '803': 'CO', '804': 'CO', '805': 'CO', '806': 'CO', '807': 'CO', '808': 'CO', '809': 'CO',
    '810': 'CO', '811': 'CO', '812': 'CO', '813': 'CO', '814': 'CO', '815': 'CO', '816': 'CO',
    // Washington (980-994)
    '980': 'WA', '981': 'WA', '982': 'WA', '983': 'WA', '984': 'WA', '985': 'WA', '986': 'WA', '988': 'WA', '989': 'WA',
    '990': 'WA', '991': 'WA', '992': 'WA', '993': 'WA', '994': 'WA',
    // Illinois (600-629)
    '600': 'IL', '601': 'IL', '602': 'IL', '603': 'IL', '604': 'IL', '605': 'IL', '606': 'IL', '607': 'IL', '608': 'IL', '609': 'IL',
    '610': 'IL', '611': 'IL', '612': 'IL', '613': 'IL', '614': 'IL', '615': 'IL', '616': 'IL', '617': 'IL', '618': 'IL', '619': 'IL',
    '620': 'IL', '622': 'IL', '623': 'IL', '624': 'IL', '625': 'IL', '626': 'IL', '627': 'IL', '628': 'IL', '629': 'IL',
  };
  
  return _zipPrefixToState;
}

/**
 * Look up ZIP code info - returns MSA if available, or infers state from prefix
 */
export function lookupZipInfo(zipCode: string): ZipLookupResult {
  const zipToMsa = getZipToMsa();
  const zipPrefixToState = getZipPrefixToState();
  
  // First try exact ZIP match for MSA
  const msaInfo = zipToMsa[zipCode];
  if (msaInfo) {
    return msaInfo;
  }
  
  // Fall back to state inference from prefix
  const prefix = zipCode.substring(0, 3);
  const stateCode = zipPrefixToState[prefix];
  
  return { stateCode: stateCode || 'US' };
}

/**
 * Check if a ZIP code has MSA data available
 */
export function hasMsaData(zipCode: string): boolean {
  const zipToMsa = getZipToMsa();
  return zipCode in zipToMsa;
}

/**
 * Get state code from ZIP prefix
 */
export function getStateFromZipPrefix(zipPrefix: string): string | undefined {
  const zipPrefixToState = getZipPrefixToState();
  return zipPrefixToState[zipPrefix];
}
