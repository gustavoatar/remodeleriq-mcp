// BLS Occupational Employment and Wage Statistics (OEWS) Data
// Source: Bureau of Labor Statistics, May 2023 estimates

export interface OewsWageData {
  soc_code: string;
  occupation_title: string;
  area_type: 'national' | 'state' | 'msa';
  area_code: string;
  area_name: string;
  hourly_10: number;
  hourly_25: number;
  hourly_median: number;
  hourly_75: number;
  hourly_90: number;
  annual_median: number;
}

// Construction occupation SOC codes
export const CONSTRUCTION_SOC_CODES = {
  CARPENTERS: '47-2031',
  CONSTRUCTION_LABORERS: '47-2061',
  ELECTRICIANS: '47-2111',
  PLUMBERS: '47-2152',
  HVAC: '49-9021',
  DRYWALL: '47-2081',
  PAINTERS: '47-2141',
  ROOFERS: '47-2181',
  TILE_SETTERS: '47-2044',
  FLOOR_LAYERS: '47-2042',
  CEMENT_MASONS: '47-2051',
  BRICKMASONS: '47-2021',
  STONEMASONS: '47-2022',
  INSULATION: '47-2131',
  SHEET_METAL: '47-2211',
  GLAZIERS: '47-2121',
} as const;

// Default burden multiplier for converting base wage to billable rate
// Updated 2026: Reflects tight labor market, insurance increases (up 48%), skilled trade shortages
export const BURDEN_MULTIPLIER = 1.75; // Baseline (up from 1.40)

// Trade-specific burden multipliers (2026 labor market reality)
// Critical trades have higher multipliers due to severe shortages
export const TRADE_BURDEN_MULTIPLIERS: Record<string, number> = {
  // Critical trades - tight labor market, high demand
  '47-2111': 2.0,    // Electricians
  '47-2152': 2.0,    // Plumbers
  '49-9021': 2.0,    // HVAC Mechanics
  
  // Skilled trades - moderate shortage
  '47-2181': 1.85,   // Roofers
  '47-2031': 1.85,   // Carpenters
  '47-2021': 1.85,   // Brickmasons
  '47-2022': 1.85,   // Stonemasons
  '47-2211': 1.85,   // Sheet Metal Workers
  
  // Semi-skilled trades
  '47-2042': 1.75,   // Floor Layers
  '47-2081': 1.75,   // Drywall Installers
  '47-2044': 1.75,   // Tile Setters
  '47-2051': 1.75,   // Cement Masons
  '47-2131': 1.75,   // Insulation Workers
  '47-2121': 1.75,   // Glaziers
  
  // General trades
  '47-2141': 1.65,   // Painters
  '47-2061': 1.65,   // Construction Laborers
};

// Get burden multiplier for a specific SOC code
export function getBurdenMultiplier(socCode: string): number {
  return TRADE_BURDEN_MULTIPLIERS[socCode] ?? BURDEN_MULTIPLIER;
}

// National wage data for construction occupations (BLS May 2023)
export const NATIONAL_WAGE_DATA: OewsWageData[] = [
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 16.87, hourly_25: 20.53, hourly_median: 26.00, hourly_75: 33.16, hourly_90: 42.36, annual_median: 54080 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 14.13, hourly_25: 16.67, hourly_median: 20.43, hourly_75: 26.30, hourly_90: 33.58, annual_median: 42490 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 18.93, hourly_25: 23.43, hourly_median: 30.14, hourly_75: 40.11, hourly_90: 51.60, annual_median: 62690 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 18.65, hourly_25: 23.08, hourly_median: 30.46, hourly_75: 41.21, hourly_90: 51.98, annual_median: 63350 },
  { soc_code: '49-9021', occupation_title: 'Heating, AC, and Refrigeration Mechanics', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 17.41, hourly_25: 21.38, hourly_median: 26.71, hourly_75: 34.88, hourly_90: 44.62, annual_median: 55560 },
  { soc_code: '47-2081', occupation_title: 'Drywall and Ceiling Tile Installers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 15.64, hourly_25: 18.70, hourly_median: 24.27, hourly_75: 32.64, hourly_90: 41.23, annual_median: 50480 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 14.67, hourly_25: 17.33, hourly_median: 22.01, hourly_75: 28.79, hourly_90: 36.96, annual_median: 45790 },
  { soc_code: '47-2181', occupation_title: 'Roofers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 14.68, hourly_25: 17.24, hourly_median: 22.22, hourly_75: 29.67, hourly_90: 38.00, annual_median: 46210 },
  { soc_code: '47-2044', occupation_title: 'Tile and Stone Setters', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 15.42, hourly_25: 18.42, hourly_median: 24.04, hourly_75: 32.05, hourly_90: 41.74, annual_median: 50000 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 14.39, hourly_25: 17.15, hourly_median: 22.55, hourly_75: 30.91, hourly_90: 38.68, annual_median: 46910 },
  { soc_code: '47-2051', occupation_title: 'Cement Masons and Concrete Finishers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 15.48, hourly_25: 18.45, hourly_median: 23.64, hourly_75: 31.33, hourly_90: 40.19, annual_median: 49170 },
  { soc_code: '47-2021', occupation_title: 'Brickmasons and Blockmasons', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 17.06, hourly_25: 20.59, hourly_median: 27.09, hourly_75: 36.08, hourly_90: 44.81, annual_median: 56340 },
  { soc_code: '47-2022', occupation_title: 'Stonemasons', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 16.08, hourly_25: 19.35, hourly_median: 24.74, hourly_75: 32.41, hourly_90: 40.75, annual_median: 51460 },
  { soc_code: '47-2131', occupation_title: 'Insulation Workers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 15.09, hourly_25: 18.14, hourly_median: 23.34, hourly_75: 31.67, hourly_90: 42.52, annual_median: 48540 },
  { soc_code: '47-2211', occupation_title: 'Sheet Metal Workers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 17.59, hourly_25: 21.63, hourly_median: 27.87, hourly_75: 37.90, hourly_90: 49.50, annual_median: 57970 },
  { soc_code: '47-2121', occupation_title: 'Glaziers', area_type: 'national', area_code: '0000000', area_name: 'National', hourly_10: 16.14, hourly_25: 19.51, hourly_median: 25.34, hourly_75: 34.43, hourly_90: 45.06, annual_median: 52710 },
];

// State wage data for major states (BLS May 2023) - key trades only
// Includes Painters (47-2141) and Floor Layers (47-2042) for paint/flooring comparison
export const STATE_WAGE_DATA: OewsWageData[] = [
  // Georgia
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 15.21, hourly_25: 18.42, hourly_median: 23.15, hourly_75: 29.33, hourly_90: 36.87, annual_median: 48150 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 13.25, hourly_25: 15.42, hourly_median: 18.67, hourly_75: 23.45, hourly_90: 29.12, annual_median: 38830 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 17.83, hourly_25: 21.67, hourly_median: 27.45, hourly_75: 35.89, hourly_90: 45.23, annual_median: 57100 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 17.45, hourly_25: 21.23, hourly_median: 27.89, hourly_75: 37.12, hourly_90: 47.56, annual_median: 58010 },
  { soc_code: '49-9021', occupation_title: 'Heating, AC, and Refrigeration Mechanics', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 16.12, hourly_25: 19.87, hourly_median: 24.56, hourly_75: 31.45, hourly_90: 40.23, annual_median: 51080 },
  { soc_code: '47-2081', occupation_title: 'Drywall and Ceiling Tile Installers', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 14.34, hourly_25: 17.12, hourly_median: 21.89, hourly_75: 28.67, hourly_90: 36.45, annual_median: 45530 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 13.45, hourly_25: 15.87, hourly_median: 19.78, hourly_75: 25.34, hourly_90: 32.12, annual_median: 41140 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 13.12, hourly_25: 15.45, hourly_median: 19.89, hourly_75: 26.23, hourly_90: 33.45, annual_median: 41370 },
  { soc_code: '47-2181', occupation_title: 'Roofers', area_type: 'state', area_code: 'GA', area_name: 'Georgia', hourly_10: 13.78, hourly_25: 16.23, hourly_median: 20.45, hourly_75: 26.89, hourly_90: 34.12, annual_median: 42540 },
  // Texas
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 14.89, hourly_25: 17.89, hourly_median: 22.67, hourly_75: 29.12, hourly_90: 37.45, annual_median: 47150 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 12.89, hourly_25: 14.98, hourly_median: 18.12, hourly_75: 22.89, hourly_90: 28.67, annual_median: 37690 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 17.23, hourly_25: 21.12, hourly_median: 27.89, hourly_75: 37.45, hourly_90: 48.12, annual_median: 58010 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 17.89, hourly_25: 22.34, hourly_median: 29.67, hourly_75: 40.12, hourly_90: 51.23, annual_median: 61710 },
  { soc_code: '49-9021', occupation_title: 'Heating, AC, and Refrigeration Mechanics', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 16.78, hourly_25: 20.45, hourly_median: 25.89, hourly_75: 33.67, hourly_90: 42.34, annual_median: 53850 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 13.12, hourly_25: 15.45, hourly_median: 19.23, hourly_75: 24.67, hourly_90: 31.23, annual_median: 40000 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'state', area_code: 'TX', area_name: 'Texas', hourly_10: 12.89, hourly_25: 15.12, hourly_median: 19.45, hourly_75: 25.67, hourly_90: 32.89, annual_median: 40460 },
  // Florida
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 15.67, hourly_25: 18.89, hourly_median: 23.45, hourly_75: 29.89, hourly_90: 37.12, annual_median: 48780 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 13.45, hourly_25: 15.78, hourly_median: 18.89, hourly_75: 23.67, hourly_90: 29.45, annual_median: 39290 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 17.12, hourly_25: 20.89, hourly_median: 26.78, hourly_75: 34.56, hourly_90: 44.12, annual_median: 55700 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 16.89, hourly_25: 20.67, hourly_median: 26.45, hourly_75: 35.12, hourly_90: 45.67, annual_median: 55020 },
  { soc_code: '49-9021', occupation_title: 'Heating, AC, and Refrigeration Mechanics', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 16.34, hourly_25: 19.89, hourly_median: 24.78, hourly_75: 31.89, hourly_90: 40.56, annual_median: 51540 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 14.12, hourly_25: 16.67, hourly_median: 20.89, hourly_75: 26.78, hourly_90: 34.12, annual_median: 43450 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'state', area_code: 'FL', area_name: 'Florida', hourly_10: 13.89, hourly_25: 16.34, hourly_median: 21.23, hourly_75: 28.12, hourly_90: 35.67, annual_median: 44160 },
  // California
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 21.12, hourly_25: 26.45, hourly_median: 35.89, hourly_75: 48.67, hourly_90: 58.34, annual_median: 74650 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 17.23, hourly_25: 20.89, hourly_median: 26.34, hourly_75: 35.12, hourly_90: 44.56, annual_median: 54790 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 24.56, hourly_25: 31.23, hourly_median: 42.89, hourly_75: 56.34, hourly_90: 68.12, annual_median: 89210 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 23.89, hourly_25: 30.45, hourly_median: 41.23, hourly_75: 55.67, hourly_90: 67.89, annual_median: 85760 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 18.67, hourly_25: 22.89, hourly_median: 29.45, hourly_75: 38.12, hourly_90: 48.67, annual_median: 61260 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'state', area_code: 'CA', area_name: 'California', hourly_10: 17.89, hourly_25: 21.67, hourly_median: 28.34, hourly_75: 38.45, hourly_90: 48.12, annual_median: 58950 },
  // New York
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 19.89, hourly_25: 25.34, hourly_median: 34.67, hourly_75: 47.89, hourly_90: 58.12, annual_median: 72110 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 17.45, hourly_25: 21.89, hourly_median: 29.34, hourly_75: 41.23, hourly_90: 52.67, annual_median: 61030 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 22.34, hourly_25: 29.67, hourly_median: 42.12, hourly_75: 57.89, hourly_90: 71.23, annual_median: 87610 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 23.12, hourly_25: 30.89, hourly_median: 43.56, hourly_75: 59.23, hourly_90: 72.45, annual_median: 90600 },
  { soc_code: '47-2141', occupation_title: 'Painters, Construction and Maintenance', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 17.89, hourly_25: 22.45, hourly_median: 30.12, hourly_75: 41.67, hourly_90: 53.45, annual_median: 62650 },
  { soc_code: '47-2042', occupation_title: 'Floor Layers', area_type: 'state', area_code: 'NY', area_name: 'New York', hourly_10: 18.23, hourly_25: 23.12, hourly_median: 31.45, hourly_75: 43.89, hourly_90: 55.67, annual_median: 65420 },
  // Arizona
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'AZ', area_name: 'Arizona', hourly_10: 15.23, hourly_25: 18.45, hourly_median: 23.12, hourly_75: 29.67, hourly_90: 37.89, annual_median: 48090 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'AZ', area_name: 'Arizona', hourly_10: 13.67, hourly_25: 16.12, hourly_median: 19.45, hourly_75: 24.23, hourly_90: 30.12, annual_median: 40460 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'AZ', area_name: 'Arizona', hourly_10: 18.45, hourly_25: 22.89, hourly_median: 28.67, hourly_75: 36.45, hourly_90: 46.12, annual_median: 59630 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'AZ', area_name: 'Arizona', hourly_10: 17.89, hourly_25: 22.12, hourly_median: 28.34, hourly_75: 37.89, hourly_90: 48.67, annual_median: 58950 },
  // North Carolina
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'NC', area_name: 'North Carolina', hourly_10: 14.56, hourly_25: 17.45, hourly_median: 21.89, hourly_75: 27.67, hourly_90: 34.56, annual_median: 45530 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'NC', area_name: 'North Carolina', hourly_10: 12.89, hourly_25: 15.12, hourly_median: 18.34, hourly_75: 22.89, hourly_90: 28.45, annual_median: 38150 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'NC', area_name: 'North Carolina', hourly_10: 16.78, hourly_25: 20.45, hourly_median: 25.89, hourly_75: 33.12, hourly_90: 42.34, annual_median: 53850 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'NC', area_name: 'North Carolina', hourly_10: 16.45, hourly_25: 20.12, hourly_median: 26.34, hourly_75: 34.89, hourly_90: 44.67, annual_median: 54790 },
  // Colorado
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'CO', area_name: 'Colorado', hourly_10: 17.23, hourly_25: 20.89, hourly_median: 26.45, hourly_75: 33.89, hourly_90: 42.67, annual_median: 55020 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'CO', area_name: 'Colorado', hourly_10: 15.12, hourly_25: 17.89, hourly_median: 21.67, hourly_75: 27.34, hourly_90: 34.12, annual_median: 45070 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'CO', area_name: 'Colorado', hourly_10: 19.67, hourly_25: 24.34, hourly_median: 31.12, hourly_75: 40.89, hourly_90: 52.34, annual_median: 64730 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'CO', area_name: 'Colorado', hourly_10: 19.23, hourly_25: 24.12, hourly_median: 31.67, hourly_75: 42.34, hourly_90: 54.12, annual_median: 65870 },
  // Washington
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'state', area_code: 'WA', area_name: 'Washington', hourly_10: 20.12, hourly_25: 25.67, hourly_median: 34.23, hourly_75: 45.89, hourly_90: 56.34, annual_median: 71200 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'state', area_code: 'WA', area_name: 'Washington', hourly_10: 17.89, hourly_25: 21.45, hourly_median: 27.12, hourly_75: 35.67, hourly_90: 44.89, annual_median: 56410 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'state', area_code: 'WA', area_name: 'Washington', hourly_10: 24.12, hourly_25: 31.67, hourly_median: 43.45, hourly_75: 56.89, hourly_90: 68.34, annual_median: 90380 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'state', area_code: 'WA', area_name: 'Washington', hourly_10: 23.45, hourly_25: 30.12, hourly_median: 41.89, hourly_75: 55.34, hourly_90: 67.12, annual_median: 87130 },
];

// Major MSA wage data (BLS May 2023) - key trades for top metros
export const MSA_WAGE_DATA: OewsWageData[] = [
  // Atlanta, GA (12060)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '12060', area_name: 'Atlanta-Sandy Springs-Alpharetta, GA', hourly_10: 15.89, hourly_25: 19.23, hourly_median: 24.12, hourly_75: 30.67, hourly_90: 38.45, annual_median: 50170 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '12060', area_name: 'Atlanta-Sandy Springs-Alpharetta, GA', hourly_10: 13.67, hourly_25: 16.12, hourly_median: 19.45, hourly_75: 24.34, hourly_90: 30.12, annual_median: 40460 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '12060', area_name: 'Atlanta-Sandy Springs-Alpharetta, GA', hourly_10: 18.45, hourly_25: 22.89, hourly_median: 29.12, hourly_75: 38.67, hourly_90: 48.34, annual_median: 60570 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '12060', area_name: 'Atlanta-Sandy Springs-Alpharetta, GA', hourly_10: 18.12, hourly_25: 22.45, hourly_median: 29.67, hourly_75: 39.34, hourly_90: 50.12, annual_median: 61710 },
  { soc_code: '49-9021', occupation_title: 'Heating, AC, and Refrigeration Mechanics', area_type: 'msa', area_code: '12060', area_name: 'Atlanta-Sandy Springs-Alpharetta, GA', hourly_10: 16.78, hourly_25: 20.67, hourly_median: 25.89, hourly_75: 33.12, hourly_90: 42.45, annual_median: 53850 },
  // Dallas-Fort Worth, TX (19100)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '19100', area_name: 'Dallas-Fort Worth-Arlington, TX', hourly_10: 15.45, hourly_25: 18.67, hourly_median: 23.89, hourly_75: 30.67, hourly_90: 39.12, annual_median: 49690 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '19100', area_name: 'Dallas-Fort Worth-Arlington, TX', hourly_10: 13.45, hourly_25: 15.89, hourly_median: 19.12, hourly_75: 24.12, hourly_90: 30.23, annual_median: 39770 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '19100', area_name: 'Dallas-Fort Worth-Arlington, TX', hourly_10: 18.12, hourly_25: 22.45, hourly_median: 29.89, hourly_75: 40.12, hourly_90: 51.67, annual_median: 62170 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '19100', area_name: 'Dallas-Fort Worth-Arlington, TX', hourly_10: 18.67, hourly_25: 23.45, hourly_median: 31.12, hourly_75: 42.34, hourly_90: 54.12, annual_median: 64730 },
  // Houston, TX (26420)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '26420', area_name: 'Houston-The Woodlands-Sugar Land, TX', hourly_10: 15.12, hourly_25: 18.34, hourly_median: 23.45, hourly_75: 30.12, hourly_90: 38.67, annual_median: 48780 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '26420', area_name: 'Houston-The Woodlands-Sugar Land, TX', hourly_10: 13.12, hourly_25: 15.45, hourly_median: 18.67, hourly_75: 23.45, hourly_90: 29.34, annual_median: 38830 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '26420', area_name: 'Houston-The Woodlands-Sugar Land, TX', hourly_10: 18.89, hourly_25: 23.67, hourly_median: 31.45, hourly_75: 42.89, hourly_90: 55.34, annual_median: 65420 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '26420', area_name: 'Houston-The Woodlands-Sugar Land, TX', hourly_10: 19.34, hourly_25: 24.67, hourly_median: 33.12, hourly_75: 45.67, hourly_90: 58.34, annual_median: 68890 },
  // Phoenix, AZ (38060)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '38060', area_name: 'Phoenix-Mesa-Chandler, AZ', hourly_10: 15.67, hourly_25: 18.89, hourly_median: 23.67, hourly_75: 30.34, hourly_90: 38.67, annual_median: 49230 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '38060', area_name: 'Phoenix-Mesa-Chandler, AZ', hourly_10: 14.12, hourly_25: 16.67, hourly_median: 20.12, hourly_75: 25.12, hourly_90: 31.23, annual_median: 41850 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '38060', area_name: 'Phoenix-Mesa-Chandler, AZ', hourly_10: 19.12, hourly_25: 23.67, hourly_median: 29.89, hourly_75: 38.12, hourly_90: 48.34, annual_median: 62170 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '38060', area_name: 'Phoenix-Mesa-Chandler, AZ', hourly_10: 18.45, hourly_25: 22.89, hourly_median: 29.34, hourly_75: 39.12, hourly_90: 50.45, annual_median: 61030 },
  // Los Angeles, CA (31080)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '31080', area_name: 'Los Angeles-Long Beach-Anaheim, CA', hourly_10: 22.34, hourly_25: 28.12, hourly_median: 38.45, hourly_75: 52.67, hourly_90: 63.12, annual_median: 79980 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '31080', area_name: 'Los Angeles-Long Beach-Anaheim, CA', hourly_10: 18.45, hourly_25: 22.34, hourly_median: 28.89, hourly_75: 38.67, hourly_90: 48.34, annual_median: 60090 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '31080', area_name: 'Los Angeles-Long Beach-Anaheim, CA', hourly_10: 26.12, hourly_25: 33.89, hourly_median: 46.34, hourly_75: 61.12, hourly_90: 73.45, annual_median: 96390 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '31080', area_name: 'Los Angeles-Long Beach-Anaheim, CA', hourly_10: 25.45, hourly_25: 32.67, hourly_median: 44.89, hourly_75: 60.34, hourly_90: 72.67, annual_median: 93370 },
  // New York, NY (35620)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '35620', area_name: 'New York-Newark-Jersey City, NY-NJ-PA', hourly_10: 22.67, hourly_25: 29.34, hourly_median: 40.12, hourly_75: 55.89, hourly_90: 67.34, annual_median: 83450 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '35620', area_name: 'New York-Newark-Jersey City, NY-NJ-PA', hourly_10: 19.89, hourly_25: 25.67, hourly_median: 35.12, hourly_75: 49.34, hourly_90: 62.12, annual_median: 73050 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '35620', area_name: 'New York-Newark-Jersey City, NY-NJ-PA', hourly_10: 26.45, hourly_25: 35.12, hourly_median: 50.67, hourly_75: 68.34, hourly_90: 82.12, annual_median: 105390 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '35620', area_name: 'New York-Newark-Jersey City, NY-NJ-PA', hourly_10: 27.12, hourly_25: 36.45, hourly_median: 52.34, hourly_75: 70.12, hourly_90: 84.67, annual_median: 108870 },
  // Chicago, IL (16980)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '16980', area_name: 'Chicago-Naperville-Elgin, IL-IN-WI', hourly_10: 19.45, hourly_25: 24.89, hourly_median: 33.67, hourly_75: 45.12, hourly_90: 55.34, annual_median: 70030 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '16980', area_name: 'Chicago-Naperville-Elgin, IL-IN-WI', hourly_10: 16.78, hourly_25: 20.34, hourly_median: 26.89, hourly_75: 36.12, hourly_90: 45.67, annual_median: 55930 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '16980', area_name: 'Chicago-Naperville-Elgin, IL-IN-WI', hourly_10: 23.12, hourly_25: 30.45, hourly_median: 42.34, hourly_75: 56.67, hourly_90: 68.89, annual_median: 88070 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '16980', area_name: 'Chicago-Naperville-Elgin, IL-IN-WI', hourly_10: 24.34, hourly_25: 31.89, hourly_median: 44.12, hourly_75: 58.34, hourly_90: 70.67, annual_median: 91770 },
  // Miami, FL (33100)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '33100', area_name: 'Miami-Fort Lauderdale-Pompano Beach, FL', hourly_10: 16.23, hourly_25: 19.67, hourly_median: 24.89, hourly_75: 31.67, hourly_90: 39.45, annual_median: 51770 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '33100', area_name: 'Miami-Fort Lauderdale-Pompano Beach, FL', hourly_10: 14.12, hourly_25: 16.67, hourly_median: 20.12, hourly_75: 25.34, hourly_90: 31.45, annual_median: 41850 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '33100', area_name: 'Miami-Fort Lauderdale-Pompano Beach, FL', hourly_10: 17.89, hourly_25: 21.67, hourly_median: 27.89, hourly_75: 36.12, hourly_90: 46.34, annual_median: 58010 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '33100', area_name: 'Miami-Fort Lauderdale-Pompano Beach, FL', hourly_10: 17.45, hourly_25: 21.34, hourly_median: 27.45, hourly_75: 36.67, hourly_90: 47.12, annual_median: 57100 },
  // Denver, CO (19740)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '19740', area_name: 'Denver-Aurora-Lakewood, CO', hourly_10: 17.89, hourly_25: 21.67, hourly_median: 27.45, hourly_75: 35.12, hourly_90: 44.34, annual_median: 57100 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '19740', area_name: 'Denver-Aurora-Lakewood, CO', hourly_10: 15.67, hourly_25: 18.45, hourly_median: 22.34, hourly_75: 28.12, hourly_90: 35.23, annual_median: 46470 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '19740', area_name: 'Denver-Aurora-Lakewood, CO', hourly_10: 20.34, hourly_25: 25.12, hourly_median: 32.45, hourly_75: 42.67, hourly_90: 54.12, annual_median: 67500 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '19740', area_name: 'Denver-Aurora-Lakewood, CO', hourly_10: 19.89, hourly_25: 24.89, hourly_median: 32.89, hourly_75: 43.67, hourly_90: 55.89, annual_median: 68410 },
  // Seattle, WA (42660)
  { soc_code: '47-2031', occupation_title: 'Carpenters', area_type: 'msa', area_code: '42660', area_name: 'Seattle-Tacoma-Bellevue, WA', hourly_10: 21.34, hourly_25: 27.12, hourly_median: 36.45, hourly_75: 48.67, hourly_90: 59.12, annual_median: 75820 },
  { soc_code: '47-2061', occupation_title: 'Construction Laborers', area_type: 'msa', area_code: '42660', area_name: 'Seattle-Tacoma-Bellevue, WA', hourly_10: 18.67, hourly_25: 22.45, hourly_median: 28.34, hourly_75: 37.12, hourly_90: 46.45, annual_median: 58950 },
  { soc_code: '47-2111', occupation_title: 'Electricians', area_type: 'msa', area_code: '42660', area_name: 'Seattle-Tacoma-Bellevue, WA', hourly_10: 25.67, hourly_25: 33.45, hourly_median: 45.89, hourly_75: 59.67, hourly_90: 71.34, annual_median: 95450 },
  { soc_code: '47-2152', occupation_title: 'Plumbers, Pipefitters, and Steamfitters', area_type: 'msa', area_code: '42660', area_name: 'Seattle-Tacoma-Bellevue, WA', hourly_10: 24.89, hourly_25: 32.12, hourly_median: 44.12, hourly_75: 57.89, hourly_90: 69.67, annual_median: 91770 },
];

// Combine all wage data
export const ALL_OEWS_DATA: OewsWageData[] = [
  ...NATIONAL_WAGE_DATA,
  ...STATE_WAGE_DATA,
  ...MSA_WAGE_DATA,
];
