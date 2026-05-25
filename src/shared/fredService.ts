/**
 * FRED (Federal Reserve Economic Data) Service
 * Fetches construction PPI data for inflation adjustment of pricing benchmarks
 * 
 * Series used:
 * - WPUSI012011: Producer Price Index - Construction Materials
 * 
 * Free API key available at: https://fred.stlouisfed.org/docs/api/api_key.html
 */

// FRED series IDs for construction-related indices
export const FRED_SERIES = {
  // Producer Price Index for Construction Materials & Components
  CONSTRUCTION_PPI: 'WPUSI012011',
  // Alternative series if needed:
  // RESIDENTIAL_CONSTRUCTION: 'PCU236236', // Residential building construction
  // NONRES_CONSTRUCTION: 'PCU2362362362', // Nonresidential construction
};

// Year that Houzz/Zonda benchmarks are calibrated to
export const BENCHMARK_BASE_YEAR = 2024;

// FRED API base URL
const FRED_API_BASE = 'https://api.stlouisfed.org/fred';

export interface FredObservation {
  date: string; // YYYY-MM-DD format
  value: number;
}

export interface FredCacheRow {
  series_id: string;
  observation_date: string;
  value: number;
}

export interface InflationAdjustment {
  // Multiply benchmark prices by this factor to get current prices
  factor: number;
  // Percentage change from baseline (e.g., 8.5 means 8.5% inflation)
  percentChange: number;
  // Baseline year used for comparison
  baselineYear: number;
  // Index value at baseline (average of baseline year)
  baselineIndex: number;
  // Most recent index value
  currentIndex: number;
  // Date of most recent observation
  currentDate: string;
  // Human-readable description
  description?: string;
}

interface FredApiResponse {
  observations?: Array<{
    date: string;
    value: string;
  }>;
  error_code?: number;
  error_message?: string;
}

/**
 * Fetch a FRED series for the last 3 years of monthly data
 */
export async function fetchFredSeries(
  apiKey: string,
  seriesId: string
): Promise<FredObservation[]> {
  // Get 3 years of data to have baseline + current
  const endDate = new Date();
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 3);
  
  const startStr = startDate.toISOString().split('T')[0];
  const endStr = endDate.toISOString().split('T')[0];

  const url = new URL(`${FRED_API_BASE}/series/observations`);
  url.searchParams.set('series_id', seriesId);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('file_type', 'json');
  url.searchParams.set('observation_start', startStr);
  url.searchParams.set('observation_end', endStr);
  url.searchParams.set('frequency', 'm'); // Monthly

  const response = await fetch(url.toString());
  
  if (!response.ok) {
    throw new Error(`FRED API error: ${response.status} ${response.statusText}`);
  }

  const data: FredApiResponse = await response.json();
  
  if (data.error_code) {
    throw new Error(`FRED API error ${data.error_code}: ${data.error_message}`);
  }

  if (!data.observations) {
    return [];
  }

  // Filter out missing values (FRED uses '.' for missing data)
  return data.observations
    .filter(obs => obs.value !== '.' && !isNaN(parseFloat(obs.value)))
    .map(obs => ({
      date: obs.date,
      value: parseFloat(obs.value)
    }));
}

/**
 * Calculate inflation adjustment factor from FRED observations
 * Compares baseline year average to most recent value
 */
export function calculateInflationFactor(
  observations: FredObservation[],
  baselineYear: number
): InflationAdjustment {
  if (!observations || observations.length === 0) {
    return {
      factor: 1.0,
      percentChange: 0,
      baselineYear,
      baselineIndex: 100,
      currentIndex: 100,
      currentDate: new Date().toISOString().split('T')[0],
      description: 'No data available - using neutral adjustment'
    };
  }

  // Sort by date ascending
  const sorted = [...observations].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Get baseline year average
  const baselineObs = sorted.filter(obs => 
    new Date(obs.date).getFullYear() === baselineYear
  );
  
  let baselineIndex: number;
  if (baselineObs.length > 0) {
    baselineIndex = baselineObs.reduce((sum, obs) => sum + obs.value, 0) / baselineObs.length;
  } else {
    // Fallback: use earliest available data
    const earliestYear = new Date(sorted[0].date).getFullYear();
    const fallbackObs = sorted.filter(obs => 
      new Date(obs.date).getFullYear() === earliestYear
    );
    baselineIndex = fallbackObs.reduce((sum, obs) => sum + obs.value, 0) / fallbackObs.length;
  }

  // Get most recent value
  const current = sorted[sorted.length - 1];
  const currentIndex = current.value;
  const currentDate = current.date;

  // Calculate factor
  const factor = currentIndex / baselineIndex;
  const percentChange = ((factor - 1) * 100);

  // Generate description
  let description: string;
  if (percentChange > 0) {
    description = `Construction costs up ${percentChange.toFixed(1)}% since ${baselineYear}`;
  } else if (percentChange < 0) {
    description = `Construction costs down ${Math.abs(percentChange).toFixed(1)}% since ${baselineYear}`;
  } else {
    description = `Construction costs stable since ${baselineYear}`;
  }

  return {
    factor: Math.round(factor * 1000) / 1000, // Round to 3 decimal places
    percentChange: Math.round(percentChange * 10) / 10, // Round to 1 decimal place
    baselineYear,
    baselineIndex: Math.round(baselineIndex * 100) / 100,
    currentIndex: Math.round(currentIndex * 100) / 100,
    currentDate,
    description
  };
}

/**
 * Convert FRED observations to database cache rows
 */
export function observationsToCacheRows(
  observations: FredObservation[],
  seriesId: string
): FredCacheRow[] {
  return observations.map(obs => ({
    series_id: seriesId,
    observation_date: obs.date,
    value: obs.value
  }));
}

/**
 * Convert database cache rows back to observations
 */
export function cacheRowsToObservations(
  rows: Array<{ observation_date: string; value: number }>
): FredObservation[] {
  return rows.map(row => ({
    date: row.observation_date,
    value: row.value
  }));
}

/**
 * Apply inflation adjustment to a price
 * Takes a price calibrated to the baseline year and adjusts to current
 */
export function applyInflationAdjustment(
  price: number,
  adjustment: InflationAdjustment | null
): number {
  if (!adjustment || adjustment.factor === 1.0) {
    return price;
  }
  return Math.round(price * adjustment.factor);
}

/**
 * Apply inflation adjustment to a price range
 */
export function applyInflationToRange(
  low: number,
  high: number,
  adjustment: InflationAdjustment | null
): { low: number; high: number } {
  return {
    low: applyInflationAdjustment(low, adjustment),
    high: applyInflationAdjustment(high, adjustment)
  };
}
