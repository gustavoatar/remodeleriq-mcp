/**
 * Contractor Pulse Module - Entity Fingerprint Parser
 * Extracts and analyzes contractor business data from bid documents
 */

export interface ContractorFingerprint {
  // Business Identity
  legalBusinessName: string | null;
  dbaName: string | null; // "Doing Business As" if different
  
  // License Information
  licenseNumber: string | null;
  licenseType: 'RBCO' | 'RLQA' | 'CR' | 'GC' | 'OTHER' | null; // GA license prefixes
  licenseState: string | null;
  
  // Physical Footprint
  businessAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  
  // Contact Information
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  
  // Extraction Confidence
  confidence: {
    businessName: 'high' | 'medium' | 'low' | 'none';
    license: 'high' | 'medium' | 'low' | 'none';
    address: 'high' | 'medium' | 'low' | 'none';
    contact: 'high' | 'medium' | 'low' | 'none';
  };
}

export interface ContractorPulse {
  fingerprint: ContractorFingerprint;
  
  // Distance Analysis
  distanceAnalysis: {
    contractorZip: string | null;
    projectZip: string | null;
    estimatedMiles: number | null;
    travelPremiumRisk: boolean; // true if > 60 miles
    riskLevel: 'none' | 'low' | 'medium' | 'high';
  };
  
  // Research Readiness
  searchReady: boolean; // Has enough data to search
  searchableFields: string[]; // Which fields can be used for research
}

// Georgia License Prefixes - helps identify license type
export const GA_LICENSE_PREFIXES = {
  RBCO: 'Residential-Basic Contractor',
  RLQA: 'Residential-Light Commercial Contractor',
  CR: 'Certified Residential Contractor',
  GC: 'General Contractor',
  CBC: 'Certified Building Contractor',
  CFC: 'Certified Flooring Contractor',
  CRC: 'Certified Roofing Contractor',
  CPC: 'Certified Plumbing Contractor',
  CEC: 'Certified Electrical Contractor',
} as const;

// State License Verification Info - URLs and agency names by state
export interface StateLicenseInfo {
  stateName: string;
  agencyName: string;
  verifyUrl: string;
  licenseTypes?: string[];
}

export const STATE_LICENSE_INFO: Record<string, StateLicenseInfo> = {
  GA: {
    stateName: 'Georgia',
    agencyName: 'GA Secretary of State',
    verifyUrl: 'https://goals.sos.ga.gov/GASOSOneStop/s/licensee-search',
    licenseTypes: ['RBCO', 'RLQA', 'CR', 'GC', 'CBC', 'CFC', 'CRC', 'CPC', 'CEC'],
  },
  MI: {
    stateName: 'Michigan',
    agencyName: 'MI LARA',
    verifyUrl: 'https://aca-prod.accela.com/MILARA/GeneralProperty/PropertyLookUp.aspx?isLicensee=Y',
    licenseTypes: ['Residential Builder', 'Maintenance & Alteration', 'Residential Builder Salesperson'],
  },
  IL: {
    stateName: 'Illinois',
    agencyName: 'IL IDFPR',
    verifyUrl: 'https://online-dfpr.micropact.com/lookup/licenselookup.aspx',
    licenseTypes: ['Roofing Contractor', 'Plumber', 'Electrician'],
  },
  FL: {
    stateName: 'Florida',
    agencyName: 'FL DBPR',
    verifyUrl: 'https://www.myfloridalicense.com/wl11.asp?mode=0&SID=',
    licenseTypes: ['CGC', 'CCC', 'CRC', 'CBC', 'CAC', 'CMC', 'CFC', 'CPC', 'CUC'],
  },
  CA: {
    stateName: 'California',
    agencyName: 'CA CSLB',
    verifyUrl: 'https://www.cslb.ca.gov/onlineservices/checklicenseII/checklicense.aspx',
    licenseTypes: ['A', 'B', 'C-10', 'C-20', 'C-36', 'C-33', 'C-39', 'C-42', 'C-46'],
  },
  NY: {
    stateName: 'New York',
    agencyName: 'NY Dept of State',
    verifyUrl: 'https://appext20.dos.ny.gov/lcns_public/license_lookup',
    licenseTypes: ['Home Improvement Contractor', 'General Contractor'],
  },
  NJ: {
    stateName: 'New Jersey',
    agencyName: 'NJ Consumer Affairs',
    verifyUrl: 'https://newjersey.mylicense.com/verification/',
    licenseTypes: ['Home Improvement Contractor', 'Electrical Contractor', 'Plumbing Contractor'],
  },
  TX: {
    stateName: 'Texas',
    agencyName: 'TX TDLR',
    verifyUrl: 'https://www.tdlr.texas.gov/LicenseSearch/',
    licenseTypes: ['HVAC', 'Electrician', 'Plumber', 'Air Conditioning'],
  },
  AZ: {
    stateName: 'Arizona',
    agencyName: 'AZ ROC',
    verifyUrl: 'https://roc.az.gov/contractor-search',
    licenseTypes: ['Residential Contractor', 'General Commercial', 'Specialty'],
  },
  AR: {
    stateName: 'Arkansas',
    agencyName: 'AR Contractors Board',
    verifyUrl: 'https://www.aclb.arkansas.gov/license-lookup/',
    licenseTypes: ['Residential', 'Commercial', 'Home Improvement'],
  },
  CO: {
    stateName: 'Colorado',
    agencyName: 'CO DORA',
    verifyUrl: 'https://apps.colorado.gov/dora/licensing/Lookup/LicenseLookup.aspx',
    licenseTypes: ['Electrical', 'Plumbing', 'General Contractor'],
  },
  CT: {
    stateName: 'Connecticut',
    agencyName: 'CT DCP',
    verifyUrl: 'https://www.elicense.ct.gov/Lookup/LicenseLookup.aspx',
    licenseTypes: ['Home Improvement Contractor', 'New Home Construction'],
  },
  DE: {
    stateName: 'Delaware',
    agencyName: 'DE DPRP',
    verifyUrl: 'https://delpros.delaware.gov/OH_VerifyLicense',
    licenseTypes: ['General Contractor', 'HVAC', 'Plumbing', 'Electrical'],
  },
  HI: {
    stateName: 'Hawaii',
    agencyName: 'HI DCCA',
    verifyUrl: 'https://cca.hawaii.gov/pvl/boards/contractor/license_search/',
    licenseTypes: ['General Building', 'General Engineering', 'Specialty'],
  },
  ID: {
    stateName: 'Idaho',
    agencyName: 'ID DBS',
    verifyUrl: 'https://web.dbs.idaho.gov/etrakit/Search/Contractor.aspx',
    licenseTypes: ['Public Works', 'HVAC', 'Plumbing', 'Electrical'],
  },
  IN: {
    stateName: 'Indiana',
    agencyName: 'IN PLA',
    verifyUrl: 'https://mylicense.in.gov/EVerification/Search.aspx',
    licenseTypes: ['Residential', 'Commercial', 'Plumbing', 'Electrical'],
  },
  IA: {
    stateName: 'Iowa',
    agencyName: 'IA DPH',
    verifyUrl: 'https://eservices.iowa.gov/LicensedOccSearch/search',
    licenseTypes: ['Electrical', 'Plumbing', 'HVAC', 'Fire Protection'],
  },
  KS: {
    stateName: 'Kansas',
    agencyName: 'KS Attorney General',
    verifyUrl: 'https://www.kansas.gov/contractor-registration/',
    licenseTypes: ['Roofing', 'HVAC', 'Plumbing', 'Electrical'],
  },
  KY: {
    stateName: 'Kentucky',
    agencyName: 'KY DHBC',
    verifyUrl: 'https://dhbc.ky.gov/Licenses/Pages/Verification.aspx',
    licenseTypes: ['Residential', 'Commercial', 'HVAC', 'Electrical'],
  },
  LA: {
    stateName: 'Louisiana',
    agencyName: 'LA LSLBC',
    verifyUrl: 'https://www.lslbc.louisiana.gov/contractor-search/',
    licenseTypes: ['Residential', 'Commercial', 'Building', 'Specialty'],
  },
  ME: {
    stateName: 'Maine',
    agencyName: 'ME OPR',
    verifyUrl: 'https://www.pfr.maine.gov/ALMSOnline/ALMSQuery/SearchIndividual.aspx',
    licenseTypes: ['Electrician', 'Plumber', 'Oil Burner'],
  },
  MD: {
    stateName: 'Maryland',
    agencyName: 'MD DLLR',
    verifyUrl: 'https://www.dllr.state.md.us/cgi-bin/ElectronicLicensing/OP_Search/OP_search.cgi',
    licenseTypes: ['Home Improvement', 'HVAC', 'Plumbing', 'Electrical'],
  },
  MA: {
    stateName: 'Massachusetts',
    agencyName: 'MA DPL',
    verifyUrl: 'https://www.mass.gov/how-to/check-a-professional-license',
    licenseTypes: ['Construction Supervisor', 'Home Improvement', 'Plumbing', 'Electrical'],
  },
  MN: {
    stateName: 'Minnesota',
    agencyName: 'MN DLI',
    verifyUrl: 'https://www.dli.mn.gov/verify-license',
    licenseTypes: ['Residential Building', 'Remodeler', 'Roofer', 'Electrical'],
  },
  MS: {
    stateName: 'Mississippi',
    agencyName: 'MS SBCR',
    verifyUrl: 'https://www.msboc.us/verify-license/',
    licenseTypes: ['Residential Builder', 'Commercial', 'HVAC', 'Electrical'],
  },
  MO: {
    stateName: 'Missouri',
    agencyName: 'MO DPR',
    verifyUrl: 'https://pr.mo.gov/licensee-search.asp',
    licenseTypes: ['General Contractor', 'Electrical', 'Plumbing', 'HVAC'],
  },
  MT: {
    stateName: 'Montana',
    agencyName: 'MT DLI',
    verifyUrl: 'https://ebiz.mt.gov/pol/search.html',
    licenseTypes: ['Contractor', 'Electrical', 'Plumbing', 'Building'],
  },
  NE: {
    stateName: 'Nebraska',
    agencyName: 'NE DHHS',
    verifyUrl: 'https://www.nebraska.gov/LISSearch/search.cgi',
    licenseTypes: ['Contractor', 'Electrical', 'Plumbing', 'HVAC'],
  },
  NV: {
    stateName: 'Nevada',
    agencyName: 'NV NSCB',
    verifyUrl: 'https://app.nvcontractorsboard.com/Clients/NVSCB/Public/ContractorLicenseSearch.aspx',
    licenseTypes: ['General Building', 'Residential', 'Specialty'],
  },
  NH: {
    stateName: 'New Hampshire',
    agencyName: 'NH OPLC',
    verifyUrl: 'https://forms.nh.gov/licenseverification/',
    licenseTypes: ['Electrical', 'Plumbing', 'Gas Fitting'],
  },
  NM: {
    stateName: 'New Mexico',
    agencyName: 'NM RLD',
    verifyUrl: 'https://www.rld.nm.gov/construction-industries-and-manufactured-housing/cid-license-lookup/',
    licenseTypes: ['General Building', 'Residential', 'Electrical', 'Mechanical'],
  },
  NC: {
    stateName: 'North Carolina',
    agencyName: 'NC LBGC',
    verifyUrl: 'https://www.nclbgc.org/license-search',
    licenseTypes: ['General Contractor', 'Building', 'Residential', 'Public Utilities'],
  },
  ND: {
    stateName: 'North Dakota',
    agencyName: 'ND SOS',
    verifyUrl: 'https://firststop.sos.nd.gov/search/business',
    licenseTypes: ['Contractor', 'Electrical', 'Plumbing'],
  },
  OH: {
    stateName: 'Ohio',
    agencyName: 'OH COM',
    verifyUrl: 'https://elicense.ohio.gov/oh_verifylicense',
    licenseTypes: ['General Contractor', 'HVAC', 'Plumbing', 'Electrical'],
  },
  OK: {
    stateName: 'Oklahoma',
    agencyName: 'OK CIB',
    verifyUrl: 'https://www.ok.gov/cib/License_Lookup/index.html',
    licenseTypes: ['General Contractor', 'Roofing', 'HVAC', 'Electrical'],
  },
  OR: {
    stateName: 'Oregon',
    agencyName: 'OR CCB',
    verifyUrl: 'https://www.oregon.gov/ccb/pages/search.aspx',
    licenseTypes: ['General Contractor', 'Residential', 'Commercial', 'Specialty'],
  },
  PA: {
    stateName: 'Pennsylvania',
    agencyName: 'PA AG',
    verifyUrl: 'https://www.attorneygeneral.gov/protect-yourself/home-improvement/',
    licenseTypes: ['Home Improvement', 'Electrical', 'Plumbing'],
  },
  RI: {
    stateName: 'Rhode Island',
    agencyName: 'RI CRB',
    verifyUrl: 'https://www.crb.ri.gov/licensees/',
    licenseTypes: ['Contractor', 'Residential', 'Commercial'],
  },
  SC: {
    stateName: 'South Carolina',
    agencyName: 'SC LLR',
    verifyUrl: 'https://verify.llronline.com/LicLookup/Contractors/Contractor.aspx',
    licenseTypes: ['General Contractor', 'Residential Builder', 'Mechanical', 'Specialty'],
  },
  SD: {
    stateName: 'South Dakota',
    agencyName: 'SD DLRR',
    verifyUrl: 'https://dlr.sd.gov/electricians/licensing.aspx',
    licenseTypes: ['Electrical', 'Plumbing', 'Contractor'],
  },
  AL: {
    stateName: 'Alabama',
    agencyName: 'AL HBLB',
    verifyUrl: 'https://genconbd.alabama.gov/licensee-search/',
    licenseTypes: ['General Contractor', 'Residential Home Builder', 'Specialty'],
  },
  AK: {
    stateName: 'Alaska',
    agencyName: 'AK DCBPL',
    verifyUrl: 'https://www.prior.commerce.state.ak.us/web/cbpl/lookup.htm',
    licenseTypes: ['General Contractor', 'Residential', 'Specialty', 'Mechanical'],
  },
  TN: {
    stateName: 'Tennessee',
    agencyName: 'TN TNCB',
    verifyUrl: 'https://verify.tn.gov/',
    licenseTypes: ['Contractor', 'Home Improvement', 'HVAC', 'Electrical'],
  },
  UT: {
    stateName: 'Utah',
    agencyName: 'UT DOPL',
    verifyUrl: 'https://secure.utah.gov/llv/search/index.html',
    licenseTypes: ['General Building', 'Residential', 'Electrical', 'Plumbing'],
  },
  VT: {
    stateName: 'Vermont',
    agencyName: 'VT OPR',
    verifyUrl: 'https://www.sec.state.vt.us/professional-regulation.aspx',
    licenseTypes: ['Electrical', 'Plumbing', 'Contractor'],
  },
  VA: {
    stateName: 'Virginia',
    agencyName: 'VA DPOR',
    verifyUrl: 'https://www.dpor.virginia.gov/LicenseLookup',
    licenseTypes: ['Class A Contractor', 'Class B Contractor', 'Class C Contractor', 'Specialty'],
  },
  WA: {
    stateName: 'Washington',
    agencyName: 'WA L&I',
    verifyUrl: 'https://secure.lni.wa.gov/verify/',
    licenseTypes: ['General Contractor', 'Specialty', 'Electrical', 'Plumbing'],
  },
  WV: {
    stateName: 'West Virginia',
    agencyName: 'WV DOL',
    verifyUrl: 'https://labor.wv.gov/Licensing/Pages/default.aspx',
    licenseTypes: ['Contractor', 'Electrical', 'Plumbing', 'HVAC'],
  },
  WI: {
    stateName: 'Wisconsin',
    agencyName: 'WI DSPS',
    verifyUrl: 'https://licensesearch.wi.gov/',
    licenseTypes: ['Dwelling Contractor', 'Electrical', 'Plumbing', 'HVAC'],
  },
  WY: {
    stateName: 'Wyoming',
    agencyName: 'WY DWS',
    verifyUrl: 'https://wyo.gov/state-agencies/department-of-workforce-services',
    licenseTypes: ['Electrical', 'Plumbing', 'Contractor'],
  },
};

// Get license info for a state, with fallback for unsupported states
export function getStateLicenseInfo(stateCode: string | null): StateLicenseInfo | null {
  if (!stateCode) return null;
  const normalized = stateCode.toUpperCase().trim();
  return STATE_LICENSE_INFO[normalized] || null;
}

// Common patterns for license numbers
export const LICENSE_PATTERNS = [
  /\b(RBCO|RLQA|CR|GC|CBC|CFC|CRC|CPC|CEC)[\s\-#]?(\d{4,8})\b/i,
  /\bLicense[\s#:]*(\w{2,6}[\s\-]?\d{4,10})\b/i,
  /\bLic[\s#:]*(\w{2,6}[\s\-]?\d{4,10})\b/i,
  /\bGA[\s\-#]?(\d{6,10})\b/i,
  /\b(GCCO|GCQA|GCQB)[\s\-#]?(\d{4,8})\b/i,
];

// ZIP code distance calculation using Haversine formula
// We use a simple lookup table for US ZIP code coordinates
// This is a simplified version - in production, you'd use a full ZIP database

interface ZipCoordinate {
  lat: number;
  lng: number;
}

// Major metro ZIP code centroids (simplified - covers major areas)
// In production, this would be a full ZIP code database or API call
const ZIP_COORDINATES: Record<string, ZipCoordinate> = {
  // Georgia
  '30301': { lat: 33.7490, lng: -84.3880 }, // Atlanta
  '30303': { lat: 33.7537, lng: -84.3928 },
  '30305': { lat: 33.8387, lng: -84.3858 },
  '30306': { lat: 33.7867, lng: -84.3508 },
  '30308': { lat: 33.7725, lng: -84.3712 },
  '30309': { lat: 33.7987, lng: -84.3876 },
  '30310': { lat: 33.7318, lng: -84.4228 },
  '30311': { lat: 33.7142, lng: -84.4748 },
  '30312': { lat: 33.7423, lng: -84.3801 },
  '30313': { lat: 33.7589, lng: -84.4013 },
  '30314': { lat: 33.7568, lng: -84.4387 },
  '30315': { lat: 33.7003, lng: -84.3873 },
  '30316': { lat: 33.7261, lng: -84.3308 },
  '30317': { lat: 33.7536, lng: -84.3165 },
  '30318': { lat: 33.7905, lng: -84.4385 },
  '30319': { lat: 33.8685, lng: -84.3360 },
  '30324': { lat: 33.8186, lng: -84.3572 },
  '30326': { lat: 33.8499, lng: -84.3624 },
  '30327': { lat: 33.8671, lng: -84.4235 },
  '30328': { lat: 33.9328, lng: -84.3808 },
  '30329': { lat: 33.8234, lng: -84.3215 },
  '30030': { lat: 33.7748, lng: -84.2963 }, // Decatur
  '30032': { lat: 33.7392, lng: -84.2632 },
  '30033': { lat: 33.8092, lng: -84.2825 },
  '30034': { lat: 33.6892, lng: -84.2494 },
  '30035': { lat: 33.7242, lng: -84.2017 },
  '30038': { lat: 33.6782, lng: -84.1529 },
  '30058': { lat: 33.7227, lng: -84.1227 }, // Lithonia
  '30060': { lat: 33.9520, lng: -84.5500 }, // Marietta
  '30062': { lat: 33.9802, lng: -84.4795 },
  '30064': { lat: 33.9217, lng: -84.5670 },
  '30066': { lat: 34.0223, lng: -84.4884 },
  '30067': { lat: 33.9359, lng: -84.4633 },
  '30068': { lat: 33.9744, lng: -84.4349 },
  '30075': { lat: 34.0304, lng: -84.3635 }, // Roswell
  '30076': { lat: 34.0501, lng: -84.3143 },
  '30077': { lat: 34.0176, lng: -84.3517 },
  '30080': { lat: 33.8742, lng: -84.5044 }, // Smyrna
  '30082': { lat: 33.8637, lng: -84.5342 },
  '30083': { lat: 33.7892, lng: -84.2088 }, // Stone Mountain
  '30084': { lat: 33.8573, lng: -84.2177 }, // Tucker
  '30087': { lat: 33.8017, lng: -84.1358 },
  '30092': { lat: 33.9717, lng: -84.2125 }, // Peachtree Corners
  '30093': { lat: 33.9176, lng: -84.2017 }, // Norcross
  '30094': { lat: 33.6117, lng: -84.0042 }, // Conyers
  '30096': { lat: 33.9656, lng: -84.1383 }, // Duluth
  '30097': { lat: 34.0037, lng: -84.1446 },
  '30144': { lat: 34.0393, lng: -84.5753 }, // Kennesaw
  '30152': { lat: 34.0163, lng: -84.6270 },
  '30188': { lat: 34.1042, lng: -84.5197 }, // Woodstock
  '30189': { lat: 34.0995, lng: -84.4792 },
  '30268': { lat: 33.5462, lng: -84.5727 }, // Palmetto
  '30269': { lat: 33.4352, lng: -84.5762 }, // Peachtree City
  '30274': { lat: 33.5887, lng: -84.4217 }, // Riverdale
  '30281': { lat: 33.5152, lng: -84.3485 }, // Stockbridge
  '30291': { lat: 33.5842, lng: -84.3393 }, // Union City
  '30296': { lat: 33.5387, lng: -84.4037 }, // Riverdale
  // '30318' defined above
  '30339': { lat: 33.8692, lng: -84.4685 }, // Atlanta (Vinings)
  '30340': { lat: 33.8973, lng: -84.2523 }, // Doraville
  '30341': { lat: 33.8892, lng: -84.2958 }, // Chamblee
  '30342': { lat: 33.8768, lng: -84.3625 }, // Brookhaven
  '30345': { lat: 33.8517, lng: -84.2837 },
  '30346': { lat: 33.9242, lng: -84.3363 }, // Dunwoody
  '30350': { lat: 33.9767, lng: -84.3375 }, // Sandy Springs
  '30360': { lat: 33.9367, lng: -84.2700 },
  '30501': { lat: 34.3017, lng: -83.8242 }, // Gainesville
  '30518': { lat: 34.1562, lng: -84.0083 }, // Buford
  '30519': { lat: 34.1076, lng: -83.9735 },
  '30542': { lat: 34.2017, lng: -83.8517 }, // Flowery Branch
  '30601': { lat: 33.9517, lng: -83.3575 }, // Athens
  '30606': { lat: 33.9562, lng: -83.4117 },
  '30620': { lat: 33.9792, lng: -83.7017 }, // Bethlehem
  '31201': { lat: 32.8407, lng: -83.6324 }, // Macon
  '31210': { lat: 32.8817, lng: -83.7017 },
  '31401': { lat: 32.0835, lng: -81.0998 }, // Savannah
  '31405': { lat: 32.0542, lng: -81.1277 },
  '31419': { lat: 31.9792, lng: -81.1617 },
  '31901': { lat: 32.4610, lng: -84.9877 }, // Columbus
  '31904': { lat: 32.5117, lng: -84.9517 },
  '30002': { lat: 33.7717, lng: -84.2600 }, // Avondale Estates
  '30021': { lat: 33.7567, lng: -84.2117 }, // Clarkston
  '30040': { lat: 34.1942, lng: -84.1392 }, // Cumming
  '30041': { lat: 34.2337, lng: -84.1317 },
  '30043': { lat: 34.0062, lng: -84.0037 }, // Lawrenceville
  '30044': { lat: 33.9617, lng: -84.0517 },
  '30045': { lat: 33.9862, lng: -83.9617 },
  '30046': { lat: 33.9367, lng: -83.9817 },
  '30047': { lat: 33.8517, lng: -84.0917 }, // Lilburn
  '30052': { lat: 33.8617, lng: -83.9217 }, // Loganville
  '30071': { lat: 33.9367, lng: -84.2017 }, // Norcross
  '30078': { lat: 33.8917, lng: -84.0317 }, // Snellville
  '30079': { lat: 33.7962, lng: -84.2467 }, // Scottdale
  '30088': { lat: 33.8217, lng: -84.1317 }, // Stone Mountain
  '30099': { lat: 34.0017, lng: -84.1417 }, // Duluth PO
  '30101': { lat: 34.2317, lng: -84.7617 }, // Acworth
  '30102': { lat: 34.1017, lng: -84.6517 },
  '30106': { lat: 33.8317, lng: -84.5917 }, // Austell
  '30114': { lat: 34.2117, lng: -84.4817 }, // Canton
  '30115': { lat: 34.2617, lng: -84.4817 },
  '30120': { lat: 34.1617, lng: -84.8017 }, // Cartersville
  '30121': { lat: 34.1817, lng: -84.7817 },
  '30126': { lat: 33.8017, lng: -84.5517 }, // Mableton
  '30127': { lat: 33.9017, lng: -84.6017 }, // Powder Springs
  '30134': { lat: 33.7517, lng: -84.7517 }, // Douglasville
  '30135': { lat: 33.7117, lng: -84.7117 },
  '30168': { lat: 33.8117, lng: -84.5117 }, // Austell
  '30213': { lat: 33.5617, lng: -84.6217 }, // Fairburn
  '30214': { lat: 33.4717, lng: -84.5817 }, // Fayetteville
  '30215': { lat: 33.4217, lng: -84.5217 },
  '30228': { lat: 33.4317, lng: -84.2817 }, // Hampton
  '30236': { lat: 33.5017, lng: -84.2617 }, // Jonesboro
  '30238': { lat: 33.5217, lng: -84.3617 },
  '30248': { lat: 33.3817, lng: -84.1617 }, // Locust Grove
  '30252': { lat: 33.4617, lng: -84.1617 }, // McDonough
  '30253': { lat: 33.4017, lng: -84.0817 },
  '30260': { lat: 33.6017, lng: -84.3317 }, // Morrow
  '30273': { lat: 33.4617, lng: -84.3617 }, // Rex
  '30277': { lat: 33.3617, lng: -84.7417 }, // Tyrone
  '30290': { lat: 33.4517, lng: -84.6017 }, // Tyrone
  '30294': { lat: 33.6217, lng: -84.2617 }, // Ellenwood
};

/**
 * Calculate distance between two ZIP codes using Haversine formula
 * Returns distance in miles, or null if either ZIP is not in our database
 */
export function calculateZipDistance(zip1: string | null, zip2: string | null): number | null {
  if (!zip1 || !zip2) return null;
  
  // Normalize ZIP codes to 5 digits
  const normalizedZip1 = zip1.replace(/\D/g, '').substring(0, 5);
  const normalizedZip2 = zip2.replace(/\D/g, '').substring(0, 5);
  
  const coord1 = ZIP_COORDINATES[normalizedZip1];
  const coord2 = ZIP_COORDINATES[normalizedZip2];
  
  if (!coord1 || !coord2) return null;
  
  // Haversine formula
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLon = toRad(coord2.lng - coord1.lng);
  const lat1 = toRad(coord1.lat);
  const lat2 = toRad(coord2.lat);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return Math.round(R * c);
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Determine travel premium risk level based on distance
 */
export function getTravelRiskLevel(miles: number | null): 'none' | 'low' | 'medium' | 'high' {
  if (miles === null) return 'none';
  if (miles <= 15) return 'none';
  if (miles <= 30) return 'low';
  if (miles <= 60) return 'medium';
  return 'high'; // > 60 miles
}

/**
 * Build ContractorPulse from extracted fingerprint and project ZIP
 */
export function buildContractorPulse(
  fingerprint: ContractorFingerprint,
  projectZip: string | null
): ContractorPulse {
  const contractorZip = fingerprint.zipCode;
  const estimatedMiles = calculateZipDistance(contractorZip, projectZip);
  const riskLevel = getTravelRiskLevel(estimatedMiles);
  
  // Determine what fields are searchable for research
  const searchableFields: string[] = [];
  if (fingerprint.legalBusinessName) searchableFields.push('businessName');
  if (fingerprint.licenseNumber) searchableFields.push('licenseNumber');
  if (fingerprint.phone) searchableFields.push('phone');
  if (fingerprint.businessAddress && fingerprint.city && fingerprint.state) {
    searchableFields.push('address');
  }
  if (fingerprint.email) searchableFields.push('email');
  if (fingerprint.website) searchableFields.push('website');
  
  return {
    fingerprint,
    distanceAnalysis: {
      contractorZip,
      projectZip,
      estimatedMiles,
      travelPremiumRisk: estimatedMiles !== null && estimatedMiles > 60,
      riskLevel,
    },
    searchReady: searchableFields.length >= 2, // Need at least 2 fields for good research
    searchableFields,
  };
}

/**
 * Parse a license number and identify its type
 */
export function parseLicenseNumber(licenseStr: string | null): {
  number: string | null;
  type: ContractorFingerprint['licenseType'];
  state: string | null;
} {
  if (!licenseStr) return { number: null, type: null, state: null };
  
  const cleaned = licenseStr.trim().toUpperCase();
  
  // Check for GA prefixes
  for (const pattern of LICENSE_PATTERNS) {
    const match = cleaned.match(pattern);
    if (match) {
      const prefix = match[1]?.toUpperCase();
      // License number captured in match[2] or match[1]
      
      // Determine type from prefix
      let type: ContractorFingerprint['licenseType'] = 'OTHER';
      if (prefix === 'RBCO') type = 'RBCO';
      else if (prefix === 'RLQA') type = 'RLQA';
      else if (prefix === 'CR' || prefix === 'CRC') type = 'CR';
      else if (prefix === 'GC' || prefix === 'GCCO' || prefix === 'GCQA' || prefix === 'GCQB') type = 'GC';
      
      return {
        number: licenseStr.trim(),
        type,
        state: 'GA', // Assume GA for now
      };
    }
  }
  
  return { number: licenseStr.trim(), type: 'OTHER', state: null };
}
