import { useState, useEffect } from 'react';

export interface LocationSavingsData {
  location: string;
  savings: number;
}

// Baseline shown before geo resolves or when the lookup fails. Every savings
// claim on the site must come from this hook (or this constant) so the number
// stays consistent across homepage, banners, and /premium.
export const DEFAULT_SAVINGS = 1258;
export const DEFAULT_LOCATION = 'your area';

// Fetch the location-based savings figure (tiered by metro size, computed
// server-side in /api/geo from shared/locationSavings.ts).
export default function useLocationSavings() {
  const [data, setData] = useState<LocationSavingsData | null>(null);

  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem('remodeleriq_geo');
    if (cached) {
      try {
        setData(JSON.parse(cached));
        return;
      } catch {
        /* corrupt cache — fall through to refetch */
      }
    }

    // Fetch from API
    fetch('/api/geo')
      .then(res => res.json())
      .then(result => {
        const geoData = { location: result.location, savings: result.savings };
        setData(geoData);
        sessionStorage.setItem('remodeleriq_geo', JSON.stringify(geoData));
      })
      .catch(() => {
        // Fallback on error
        setData({ location: DEFAULT_LOCATION, savings: DEFAULT_SAVINGS });
      });
  }, []);

  return data;
}
