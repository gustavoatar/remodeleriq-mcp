// Zonda Cost vs. Value 2025 Data
// Source: JLC (Journal of Light Construction) Cost vs. Value Report 2025
// Published by Zonda Media
// Data URL: https://www.jlconline.com/cost-vs-value/2025/

// ============================================================================
// TYPES
// ============================================================================

export interface ZondaProjectCost {
  projectType: string;
  nationalCost: number;
  nationalCitation: string;
  regions: Record<string, ZondaRegionalCost>;
  cities: Record<string, ZondaCityCost>;
}

export interface ZondaRegionalCost {
  cost: number;
  multiplier: number;  // cost / nationalCost
  citation: string;
}

export interface ZondaCityCost {
  cost: number;
  multiplier: number;  // cost / nationalCost
  state: string;
  region: string;
  citation: string;
}

// Region name mapping
export type ZondaRegion = 
  | 'east-south-central'
  | 'east-north-central'
  | 'new-england'
  | 'mountain'
  | 'south-atlantic'
  | 'national';

export const ZONDA_REGION_NAMES: Record<ZondaRegion, string> = {
  'east-south-central': 'East South Central',
  'east-north-central': 'East North Central',
  'new-england': 'New England',
  'mountain': 'Mountain',
  'south-atlantic': 'South Atlantic',
  'national': 'National Average',
};

// State to Zonda region mapping
export const STATE_TO_ZONDA_REGION: Record<string, ZondaRegion> = {
  // East South Central
  'AL': 'east-south-central',
  'KY': 'east-south-central',
  'MS': 'east-south-central',
  'TN': 'east-south-central',
  // East North Central  
  'IL': 'east-north-central',
  'IN': 'east-north-central',
  'MI': 'east-north-central',
  'OH': 'east-north-central',
  'WI': 'east-north-central',
  // New England
  'CT': 'new-england',
  'MA': 'new-england',
  'ME': 'new-england',
  'NH': 'new-england',
  'RI': 'new-england',
  'VT': 'new-england',
  // Mountain
  'AZ': 'mountain',
  'CO': 'mountain',
  'ID': 'mountain',
  'MT': 'mountain',
  'NM': 'mountain',
  'NV': 'mountain',
  'UT': 'mountain',
  'WY': 'mountain',
  // South Atlantic
  'DC': 'south-atlantic',
  'DE': 'south-atlantic',
  'FL': 'south-atlantic',
  'GA': 'south-atlantic',
  'MD': 'south-atlantic',
  'NC': 'south-atlantic',
  'SC': 'south-atlantic',
  'VA': 'south-atlantic',
  'WV': 'south-atlantic',
};

// ============================================================================
// ZONDA COST VS VALUE 2025 DATA
// ============================================================================

const BASE_CITATION = 'https://www.jlconline.com/cost-vs-value/2025';

export const ZONDA_COST_DATA: Record<string, ZondaProjectCost> = {
  // Garage Door Replacement
  'garage-door': {
    projectType: 'Garage Door Replacement',
    nationalCost: 4672,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 4288, multiplier: 0.92, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 4357, multiplier: 0.93, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 4317, multiplier: 0.92, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 4968, multiplier: 1.06, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 5126, multiplier: 1.10, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 4793, multiplier: 1.03, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 4287, multiplier: 0.92, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 4312, multiplier: 0.92, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 4856, multiplier: 1.04, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 4843, multiplier: 1.04, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Entry Door - Steel
  'entry-door-steel': {
    projectType: 'Entry Door Replacement | Steel',
    nationalCost: 2435,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 2319, multiplier: 0.95, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 2339, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 2547, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 2446, multiplier: 1.00, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 2398, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 2264, multiplier: 0.93, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 2277, multiplier: 0.94, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 2549, multiplier: 1.05, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 2340, multiplier: 0.96, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 2425, multiplier: 1.00, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Grand Entrance - Fiberglass
  'grand-entrance': {
    projectType: 'Grand Entrance | Fiberglass',
    nationalCost: 11754,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 10717, multiplier: 0.91, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 11591, multiplier: 0.99, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 11953, multiplier: 1.02, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 11326, multiplier: 0.96, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 11489, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 10399, multiplier: 0.88, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 11056, multiplier: 0.94, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 11957, multiplier: 1.02, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 11187, multiplier: 0.95, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 11849, multiplier: 1.01, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Manufactured Stone Veneer
  'stone-veneer': {
    projectType: 'Manufactured Stone Veneer',
    nationalCost: 11702,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 10858, multiplier: 0.93, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 11193, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 13045, multiplier: 1.11, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 11991, multiplier: 1.02, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 10851, multiplier: 0.93, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 11041, multiplier: 0.94, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 10753, multiplier: 0.92, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 13085, multiplier: 1.12, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 11751, multiplier: 1.00, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 11004, multiplier: 0.94, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Siding - Vinyl
  'siding-vinyl': {
    projectType: 'Siding Replacement | Vinyl',
    nationalCost: 17950,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 14596, multiplier: 0.81, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 19139, multiplier: 1.07, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 17590, multiplier: 0.98, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 16979, multiplier: 0.95, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 16491, multiplier: 0.92, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 13704, multiplier: 0.76, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 17385, multiplier: 0.97, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 17523, multiplier: 0.98, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 19262, multiplier: 1.07, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 17308, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Siding - Fiber Cement
  'siding-fiber-cement': {
    projectType: 'Siding Replacement | Fiber-Cement',
    nationalCost: 21485,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 18260, multiplier: 0.85, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 23515, multiplier: 1.09, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 20678, multiplier: 0.96, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 19455, multiplier: 0.91, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 19628, multiplier: 0.91, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 16366, multiplier: 0.76, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 21212, multiplier: 0.99, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 20568, multiplier: 0.96, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 22427, multiplier: 1.04, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 21316, multiplier: 0.99, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Window Replacement - Vinyl
  'window-vinyl': {
    projectType: 'Window Replacement | Vinyl',
    nationalCost: 22073,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 20328, multiplier: 0.92, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 22054, multiplier: 1.00, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 21922, multiplier: 0.99, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 21165, multiplier: 0.96, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 21629, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 20593, multiplier: 0.93, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 21667, multiplier: 0.98, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 21977, multiplier: 1.00, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 20641, multiplier: 0.94, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 21631, multiplier: 0.98, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Window Replacement - Wood
  'window-wood': {
    projectType: 'Window Replacement | Wood',
    nationalCost: 26781,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 25379, multiplier: 0.95, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 25750, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 27226, multiplier: 1.02, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 26322, multiplier: 0.98, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 26445, multiplier: 0.99, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 25674, multiplier: 0.96, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 25342, multiplier: 0.95, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 27311, multiplier: 1.02, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 25777, multiplier: 0.96, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 26807, multiplier: 1.00, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Roofing - Asphalt Shingles
  'roofing-asphalt': {
    projectType: 'Roofing Replacement | Asphalt Shingles',
    nationalCost: 31871,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 25939, multiplier: 0.81, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 29253, multiplier: 0.92, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 35701, multiplier: 1.12, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 28475, multiplier: 0.89, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 32253, multiplier: 1.01, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 26547, multiplier: 0.83, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 26765, multiplier: 0.84, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 35658, multiplier: 1.12, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 34115, multiplier: 1.07, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 29851, multiplier: 0.94, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Roofing - Metal
  'roofing-metal': {
    projectType: 'Roofing Replacement | Metal',
    nationalCost: 51865,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 41256, multiplier: 0.80, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 47473, multiplier: 0.92, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 56282, multiplier: 1.09, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 46579, multiplier: 0.90, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 50181, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 37819, multiplier: 0.73, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 43529, multiplier: 0.84, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 56042, multiplier: 1.08, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 58352, multiplier: 1.13, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 43826, multiplier: 0.85, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Deck Addition - Wood
  'deck-wood': {
    projectType: 'Deck Addition | Wood',
    nationalCost: 18263,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 16868, multiplier: 0.92, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 18090, multiplier: 0.99, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 20603, multiplier: 1.13, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 18253, multiplier: 1.00, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 18397, multiplier: 1.01, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 14028, multiplier: 0.77, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 17766, multiplier: 0.97, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 20594, multiplier: 1.13, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 16345, multiplier: 0.89, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 17200, multiplier: 0.94, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Deck Addition - Composite
  'deck-composite': {
    projectType: 'Deck Addition | Composite',
    nationalCost: 25096,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 23692, multiplier: 0.94, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 25817, multiplier: 1.03, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 25817, multiplier: 1.03, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 26342, multiplier: 1.05, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 24347, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 21923, multiplier: 0.87, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 25806, multiplier: 1.03, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 25806, multiplier: 1.03, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 23621, multiplier: 0.94, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 24984, multiplier: 1.00, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Backyard Patio
  'backyard-patio': {
    projectType: 'Backyard Patio',
    nationalCost: 51454,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 49085, multiplier: 0.95, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 53455, multiplier: 1.04, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 53455, multiplier: 1.04, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 52218, multiplier: 1.01, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 49982, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 49517, multiplier: 0.96, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'boston-ma': { cost: 53526, multiplier: 1.04, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 50639, multiplier: 0.98, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 50928, multiplier: 0.99, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Minor Kitchen Remodel - Midrange
  'kitchen-minor': {
    projectType: 'Minor Kitchen Remodel | Midrange',
    nationalCost: 28458,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 27034, multiplier: 0.95, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 27005, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 28936, multiplier: 1.02, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 28490, multiplier: 1.00, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 28567, multiplier: 1.00, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 26184, multiplier: 0.92, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 27192, multiplier: 0.96, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 28991, multiplier: 1.02, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 27378, multiplier: 0.96, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 28359, multiplier: 1.00, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Major Kitchen Remodel - Midrange
  'kitchen-major-midrange': {
    projectType: 'Major Kitchen Remodel | Midrange',
    nationalCost: 82793,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 77908, multiplier: 0.94, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 83113, multiplier: 1.00, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 84000, multiplier: 1.01, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 81538, multiplier: 0.98, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 81076, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 74870, multiplier: 0.90, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 83078, multiplier: 1.00, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 84331, multiplier: 1.02, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 81004, multiplier: 0.98, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 79591, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Major Kitchen Remodel - Upscale
  'kitchen-major-upscale': {
    projectType: 'Major Kitchen Remodel | Upscale',
    nationalCost: 164104,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 153105, multiplier: 0.93, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 160333, multiplier: 0.98, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 172718, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 159439, multiplier: 0.97, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 161511, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 149029, multiplier: 0.91, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 160328, multiplier: 0.98, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 173271, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 159892, multiplier: 0.97, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 157713, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Bath Remodel - Midrange
  'bathroom-midrange': {
    projectType: 'Bath Remodel | Midrange',
    nationalCost: 26138,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 23409, multiplier: 0.90, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 24910, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 27559, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 24920, multiplier: 0.95, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 25609, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 21494, multiplier: 0.82, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 24524, multiplier: 0.94, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 27681, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 25551, multiplier: 0.98, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 25304, multiplier: 0.97, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Bath Remodel - Upscale
  'bathroom-upscale': {
    projectType: 'Bath Remodel | Upscale',
    nationalCost: 81612,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 75726, multiplier: 0.93, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 78684, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 83877, multiplier: 1.03, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 79492, multiplier: 0.97, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 80222, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 71410, multiplier: 0.87, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 77841, multiplier: 0.95, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 84165, multiplier: 1.03, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 80577, multiplier: 0.99, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 79717, multiplier: 0.98, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Bath Remodel - Universal Design
  'bathroom-universal': {
    projectType: 'Bath Remodel | Universal Design',
    nationalCost: 42183,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 39243, multiplier: 0.93, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 40855, multiplier: 0.97, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 43119, multiplier: 1.02, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 40482, multiplier: 0.96, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 41203, multiplier: 0.98, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 35549, multiplier: 0.84, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 40212, multiplier: 0.95, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 43256, multiplier: 1.03, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 41882, multiplier: 0.99, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 41047, multiplier: 0.97, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Bathroom Addition - Midrange
  'bathroom-addition-midrange': {
    projectType: 'Bathroom Addition | Midrange',
    nationalCost: 60645,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 54032, multiplier: 0.89, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 57427, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 63783, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 59162, multiplier: 0.98, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 59039, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 50429, multiplier: 0.83, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 56148, multiplier: 0.93, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 64220, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 60310, multiplier: 0.99, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 58363, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Bathroom Addition - Upscale
  'bathroom-addition-upscale': {
    projectType: 'Bathroom Addition | Upscale',
    nationalCost: 111255,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 100404, multiplier: 0.90, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 105577, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 116146, multiplier: 1.04, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 109606, multiplier: 0.99, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 107955, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 95243, multiplier: 0.86, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 103772, multiplier: 0.93, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 116910, multiplier: 1.05, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 111348, multiplier: 1.00, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 106612, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Basement Remodel
  'basement': {
    projectType: 'Basement Remodel',
    nationalCost: 52012,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 44436, multiplier: 0.85, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 49713, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 54505, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 49756, multiplier: 0.96, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 51409, multiplier: 0.99, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 43505, multiplier: 0.84, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 48789, multiplier: 0.94, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 54949, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 51274, multiplier: 0.99, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 49681, multiplier: 0.96, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Primary Suite Addition - Midrange
  'primary-suite-midrange': {
    projectType: 'Primary Suite Addition | Midrange',
    nationalCost: 170517,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 150285, multiplier: 0.88, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 160572, multiplier: 0.94, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 181780, multiplier: 1.07, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 168492, multiplier: 0.99, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 165012, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 143015, multiplier: 0.84, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 153291, multiplier: 0.90, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 183267, multiplier: 1.07, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 172400, multiplier: 1.01, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 162109, multiplier: 0.95, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Primary Suite Addition - Upscale
  'primary-suite-upscale': {
    projectType: 'Primary Suite Addition | Upscale',
    nationalCost: 351613,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 308579, multiplier: 0.88, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 329084, multiplier: 0.94, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 374737, multiplier: 1.07, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 350045, multiplier: 1.00, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 338323, multiplier: 0.96, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 296554, multiplier: 0.84, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 315486, multiplier: 0.90, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 379392, multiplier: 1.08, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 357309, multiplier: 1.02, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 330626, multiplier: 0.94, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Accessory Dwelling Unit (ADU)
  'adu': {
    projectType: 'Accessory Dwelling Unit',
    nationalCost: 166406,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 145541, multiplier: 0.87, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 157758, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 173734, multiplier: 1.04, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 163509, multiplier: 0.98, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 161457, multiplier: 0.97, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 138415, multiplier: 0.83, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 149548, multiplier: 0.90, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 175692, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 170054, multiplier: 1.02, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 158023, multiplier: 0.95, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Backup Power Generator
  'generator': {
    projectType: 'Backup Power Generator',
    nationalCost: 13534,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 11629, multiplier: 0.86, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 12877, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 14292, multiplier: 1.06, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 12481, multiplier: 0.92, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 13561, multiplier: 1.00, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 11857, multiplier: 0.88, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 11662, multiplier: 0.86, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 14548, multiplier: 1.07, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 13872, multiplier: 1.02, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 13130, multiplier: 0.97, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // HVAC Conversion - Electrification
  'hvac-electrification': {
    projectType: 'HVAC Conversion | Electrification',
    nationalCost: 19484,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 17174, multiplier: 0.88, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 18669, multiplier: 0.96, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 22177, multiplier: 1.14, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 17886, multiplier: 0.92, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 19208, multiplier: 0.99, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 17047, multiplier: 0.88, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 18068, multiplier: 0.93, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 22446, multiplier: 1.15, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 19464, multiplier: 1.00, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 18416, multiplier: 0.95, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },

  // Solar Power Installation
  'solar': {
    projectType: 'Solar Power Installation',
    nationalCost: 55937,
    nationalCitation: `${BASE_CITATION}/national/`,
    regions: {
      'east-south-central': { cost: 47784, multiplier: 0.85, citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'east-north-central': { cost: 52869, multiplier: 0.95, citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'new-england': { cost: 58913, multiplier: 1.05, citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'mountain': { cost: 51183, multiplier: 0.92, citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'south-atlantic': { cost: 55673, multiplier: 1.00, citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
    cities: {
      'birmingham-al': { cost: 48660, multiplier: 0.87, state: 'AL', region: 'east-south-central', citation: `${BASE_CITATION}/east-south-central/birmingham-al/` },
      'appleton-wi': { cost: 49258, multiplier: 0.88, state: 'WI', region: 'east-north-central', citation: `${BASE_CITATION}/east-north-central/appleton-wi/` },
      'boston-ma': { cost: 59366, multiplier: 1.06, state: 'MA', region: 'new-england', citation: `${BASE_CITATION}/new-england/boston-ma/` },
      'albuquerque-nm': { cost: 53816, multiplier: 0.96, state: 'NM', region: 'mountain', citation: `${BASE_CITATION}/mountain/albuquerque-nm/` },
      'atlanta-ga': { cost: 55234, multiplier: 0.99, state: 'GA', region: 'south-atlantic', citation: `${BASE_CITATION}/south-atlantic/atlanta-ga/` },
    },
  },
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Get the regional multiplier from Zonda data for a given state
 * Falls back to national (1.0) if state not in mapping
 */
export function getZondaRegionalMultiplier(
  stateCode: string,
  projectKey?: string
): { multiplier: number; region: string; source: 'zonda-region' | 'national' } {
  const region = STATE_TO_ZONDA_REGION[stateCode];
  
  if (!region) {
    return { multiplier: 1.0, region: 'National Average', source: 'national' };
  }
  
  // If a specific project is provided, get project-specific multiplier
  if (projectKey && ZONDA_COST_DATA[projectKey]?.regions[region]) {
    const regionData = ZONDA_COST_DATA[projectKey].regions[region];
    return { 
      multiplier: regionData.multiplier, 
      region: ZONDA_REGION_NAMES[region],
      source: 'zonda-region'
    };
  }
  
  // Calculate average multiplier across all projects for this region
  const projectKeys = Object.keys(ZONDA_COST_DATA);
  let totalMultiplier = 0;
  let count = 0;
  
  for (const key of projectKeys) {
    const regionData = ZONDA_COST_DATA[key].regions[region];
    if (regionData) {
      totalMultiplier += regionData.multiplier;
      count++;
    }
  }
  
  const avgMultiplier = count > 0 ? totalMultiplier / count : 1.0;
  
  return {
    multiplier: Math.round(avgMultiplier * 100) / 100,
    region: ZONDA_REGION_NAMES[region],
    source: 'zonda-region'
  };
}

/**
 * Get project cost from Zonda data with fallback chain:
 * City -> Region -> National
 */
export function getZondaProjectCost(
  projectKey: string,
  stateCode?: string,
  cityKey?: string
): { 
  cost: number; 
  multiplier: number;
  source: 'city' | 'region' | 'national';
  sourceName: string;
  citation: string;
} | null {
  const projectData = ZONDA_COST_DATA[projectKey];
  if (!projectData) return null;
  
  // Try city first
  if (cityKey && projectData.cities[cityKey]) {
    const cityData = projectData.cities[cityKey];
    return {
      cost: cityData.cost,
      multiplier: cityData.multiplier,
      source: 'city',
      sourceName: cityKey.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(', '),
      citation: cityData.citation
    };
  }
  
  // Try region
  if (stateCode) {
    const region = STATE_TO_ZONDA_REGION[stateCode];
    if (region && projectData.regions[region]) {
      const regionData = projectData.regions[region];
      return {
        cost: regionData.cost,
        multiplier: regionData.multiplier,
        source: 'region',
        sourceName: ZONDA_REGION_NAMES[region],
        citation: regionData.citation
      };
    }
  }
  
  // Fall back to national
  return {
    cost: projectData.nationalCost,
    multiplier: 1.0,
    source: 'national',
    sourceName: 'National Average',
    citation: projectData.nationalCitation
  };
}

/**
 * Get all project costs for a state (for comparison)
 */
export function getZondaCostsForState(stateCode: string): Record<string, {
  projectType: string;
  nationalCost: number;
  regionalCost: number;
  multiplier: number;
  region: string;
}> {
  const result: Record<string, any> = {};
  const region = STATE_TO_ZONDA_REGION[stateCode];
  
  for (const [key, data] of Object.entries(ZONDA_COST_DATA)) {
    const regionData = region ? data.regions[region] : null;
    result[key] = {
      projectType: data.projectType,
      nationalCost: data.nationalCost,
      regionalCost: regionData?.cost || data.nationalCost,
      multiplier: regionData?.multiplier || 1.0,
      region: region ? ZONDA_REGION_NAMES[region] : 'National Average'
    };
  }
  
  return result;
}

/**
 * Map internal project type to Zonda project key
 */
export function mapToZondaProjectKey(projectType: string): string | null {
  const type = projectType.toLowerCase().replace(/[_\s]+/g, '-');
  
  const mappings: Record<string, string> = {
    // Bathroom
    'bathroom-remodel': 'bathroom-midrange',
    'bathroom': 'bathroom-midrange',
    'bath': 'bathroom-midrange',
    
    // Kitchen
    'kitchen-remodel': 'kitchen-major-midrange',
    'kitchen': 'kitchen-major-midrange',
    'kitchen-minor': 'kitchen-minor',
    
    // Basement
    'basement-remodel': 'basement',
    'basement': 'basement',
    
    // Roofing
    'roofing': 'roofing-asphalt',
    'roof': 'roofing-asphalt',
    
    // Siding
    'siding': 'siding-vinyl',
    
    // Windows
    'windows-doors': 'window-vinyl',
    'windows': 'window-vinyl',
    
    // HVAC
    'hvac': 'hvac-electrification',
    
    // Decks
    'deck': 'deck-wood',
    
    // ADU
    'home-addition': 'adu',
    'addition': 'adu',
  };
  
  // Direct match
  if (ZONDA_COST_DATA[type]) return type;
  
  // Mapped match
  if (mappings[type]) return mappings[type];
  
  // Partial match
  for (const [pattern, key] of Object.entries(mappings)) {
    if (type.includes(pattern)) return key;
  }
  
  return null;
}
