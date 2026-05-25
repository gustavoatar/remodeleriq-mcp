import { useState, useEffect, useCallback } from 'react';

interface GeolocationState {
  state: string | null;
  stateCode: string | null;
  city: string | null;
  loading: boolean;
  error: string | null;
}

// Map of state names to codes
export const STATE_CODES: Record<string, string> = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

// Cookie helpers
const GEOLOCATION_PERMISSION_COOKIE = 'remodeleriq_geo_permission';
const USER_LOCATION_KEY = 'remodeleriq_user_location';

function setCookie(name: string, value: string, days: number = 365): void {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

// Get state name from code
export function getStateNameFromCode(code: string): string {
  const entry = Object.entries(STATE_CODES).find(([, c]) => c === code);
  return entry ? entry[0].split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'Georgia';
}

/**
 * Get user's saved location from localStorage
 */
export function getUserSavedLocation(): { stateCode: string; stateName: string } | null {
  if (typeof window === 'undefined') return null;
  const saved = localStorage.getItem(USER_LOCATION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save user's location to localStorage
 */
export function saveUserLocation(stateCode: string): void {
  const stateName = getStateNameFromCode(stateCode);
  localStorage.setItem(USER_LOCATION_KEY, JSON.stringify({ stateCode, stateName }));
}

/**
 * Get geolocation permission status from cookie
 */
export function getGeolocationPermission(): 'granted' | 'denied' | 'prompt' | null {
  if (typeof window === 'undefined') return null;
  const permission = getCookie(GEOLOCATION_PERMISSION_COOKIE);
  if (permission === 'granted' || permission === 'denied' || permission === 'prompt') {
    return permission;
  }
  return null;
}

/**
 * Save geolocation permission status to cookie
 */
export function saveGeolocationPermission(status: 'granted' | 'denied' | 'prompt'): void {
  setCookie(GEOLOCATION_PERMISSION_COOKIE, status);
}

/**
 * Hook to detect user's state from geolocation
 * Saves permission status in a cookie and auto-saves detected location
 */
export function useGeolocation(): GeolocationState & { 
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => void;
} {
  const [location, setLocation] = useState<GeolocationState>({
    state: null,
    stateCode: null,
    city: null,
    loading: true,
    error: null
  });
  const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocation not supported'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        // Permission was granted - save to cookie
        saveGeolocationPermission('granted');
        setPermissionStatus('granted');

        try {
          // Use OpenStreetMap's Nominatim for reverse geocoding (free, no API key)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&addressdetails=1`,
            {
              headers: {
                'Accept': 'application/json',
                'User-Agent': 'NailitDIY-App'
              }
            }
          );
          
          if (!response.ok) {
            throw new Error('Geocoding failed');
          }
          
          const data = await response.json();
          const address = data.address || {};
          
          // Extract state from response
          const stateName = address.state || address.region || '';
          const stateCode = STATE_CODES[stateName.toLowerCase()] || null;
          const city = address.city || address.town || address.village || address.county || '';
          
          const detectedLocation = {
            state: stateName || null,
            stateCode: stateCode,
            city: city || null,
            loading: false,
            error: null
          };
          
          setLocation(detectedLocation);

          // Auto-save detected location if we got a valid state
          if (stateCode) {
            saveUserLocation(stateCode);
          }
        } catch {
          setLocation({
            state: null,
            stateCode: null,
            city: null,
            loading: false,
            error: 'Could not determine location'
          });
        }
      },
      (error) => {
        // Permission denied or error
        saveGeolocationPermission('denied');
        setPermissionStatus('denied');
        setLocation({
          state: null,
          stateCode: null,
          city: null,
          loading: false,
          error: error.message
        });
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000 // Cache for 10 minutes
      }
    );
  }, []);

  const requestPermission = useCallback(() => {
    detectLocation();
  }, [detectLocation]);

  // Check permission status on mount
  useEffect(() => {
    const savedPermission = getGeolocationPermission();
    
    if (savedPermission === 'granted') {
      // Already granted - detect location automatically
      setPermissionStatus('granted');
      detectLocation();
    } else if (savedPermission === 'denied') {
      // Previously denied - don't ask again automatically
      setPermissionStatus('denied');
      setLocation(prev => ({ ...prev, loading: false }));
    } else {
      // No saved permission - check browser's permission API if available
      if (navigator.permissions) {
        navigator.permissions.query({ name: 'geolocation' }).then((result) => {
          setPermissionStatus(result.state as 'granted' | 'denied' | 'prompt');
          
          if (result.state === 'granted') {
            // Browser already has permission, detect location
            saveGeolocationPermission('granted');
            detectLocation();
          } else {
            setLocation(prev => ({ ...prev, loading: false }));
          }
        }).catch(() => {
          // Permissions API not available
          setPermissionStatus('prompt');
          setLocation(prev => ({ ...prev, loading: false }));
        });
      } else {
        // No permissions API - will need to request
        setPermissionStatus('prompt');
        setLocation(prev => ({ ...prev, loading: false }));
      }
    }
  }, [detectLocation]);

  return {
    ...location,
    permissionStatus,
    requestPermission
  };
}

/**
 * Hook to manually set state (for testing or user override)
 */
export function useManualState(initialState: string = 'GA') {
  const [stateCode, setStateCode] = useState(initialState);
  
  return {
    stateCode,
    setStateCode,
    stateName: Object.entries(STATE_CODES).find(([, code]) => code === stateCode)?.[0] || 'Georgia'
  };
}

/**
 * Hook to get user's location - prioritizes saved location, falls back to geolocation,
 * then to Cloudflare's server-side geo detection (via /api/geo)
 */
export function useUserLocation(): { 
  stateCode: string | null; 
  stateName: string | null; 
  loading: boolean;
  setLocation: (code: string) => void;
  permissionStatus: 'granted' | 'denied' | 'prompt' | 'unknown';
  requestPermission: () => void;
  detectedFromGeo: boolean;
} {
  const geoLocation = useGeolocation();
  const [savedLocation, setSavedLocation] = useState<{ stateCode: string; stateName: string } | null>(null);
  const [serverGeoLocation, setServerGeoLocation] = useState<{ stateCode: string; stateName: string } | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [serverGeoFetched, setServerGeoFetched] = useState(false);
  
  // Load saved location on mount
  useEffect(() => {
    const saved = getUserSavedLocation();
    if (saved) {
      setSavedLocation(saved);
    }
    setInitialized(true);
  }, []);

  // Fallback to server-side geo when browser geolocation fails or is denied
  useEffect(() => {
    // Only fetch server geo if:
    // 1. We're initialized
    // 2. Browser geolocation isn't loading
    // 3. We don't have a saved location
    // 4. Browser geolocation didn't give us a result
    // 5. We haven't already fetched server geo
    if (initialized && 
        !geoLocation.loading && 
        !savedLocation && 
        !geoLocation.stateCode && 
        !serverGeoFetched) {
      setServerGeoFetched(true);
      
      // Check session cache first
      const cached = sessionStorage.getItem('remodeleriq_geo');
      if (cached) {
        try {
          const data = JSON.parse(cached);
          if (data.detectedState && STATE_CODES[data.detectedState.toLowerCase()] || 
              Object.values(STATE_CODES).includes(data.detectedState)) {
            const stateCode = STATE_CODES[data.detectedState.toLowerCase()] || data.detectedState;
            setServerGeoLocation({
              stateCode,
              stateName: getStateNameFromCode(stateCode)
            });
            return;
          }
        } catch {}
      }
      
      // Fetch from Cloudflare's geo endpoint
      fetch('/api/geo')
        .then(res => res.json())
        .then(data => {
          if (data.detectedState) {
            const stateCode = STATE_CODES[data.detectedState.toLowerCase()] || data.detectedState;
            if (stateCode && stateCode.length === 2) {
              const geoData = {
                stateCode,
                stateName: getStateNameFromCode(stateCode)
              };
              setServerGeoLocation(geoData);
              // Auto-save so we don't need to fetch again
              saveUserLocation(stateCode);
              setSavedLocation(geoData);
            }
          }
        })
        .catch(() => {
          // Silently fail - user can manually select location
        });
    }
  }, [initialized, geoLocation.loading, geoLocation.stateCode, savedLocation, serverGeoFetched]);

  // Update saved location when geolocation detects a new location
  useEffect(() => {
    if (geoLocation.stateCode && !savedLocation && initialized) {
      const newLocation = { 
        stateCode: geoLocation.stateCode, 
        stateName: geoLocation.state || getStateNameFromCode(geoLocation.stateCode) 
      };
      setSavedLocation(newLocation);
    }
  }, [geoLocation.stateCode, geoLocation.state, savedLocation, initialized]);
  
  const setLocation = useCallback((code: string) => {
    saveUserLocation(code);
    setSavedLocation({ stateCode: code, stateName: getStateNameFromCode(code) });
  }, []);
  
  // Determine best available location (no more Georgia fallback!)
  const currentStateCode = savedLocation?.stateCode || geoLocation.stateCode || serverGeoLocation?.stateCode || null;
  const currentStateName = savedLocation?.stateName || geoLocation.state || serverGeoLocation?.stateName || null;
  
  // Still loading if: not initialized, OR (no location and geo still loading), OR (no location and server fetch pending)
  const stillLoading = !initialized || 
    (!currentStateCode && geoLocation.loading) || 
    (!currentStateCode && !serverGeoFetched);
  
  return {
    stateCode: currentStateCode,
    stateName: currentStateName,
    loading: stillLoading,
    setLocation,
    permissionStatus: geoLocation.permissionStatus,
    requestPermission: geoLocation.requestPermission,
    detectedFromGeo: !savedLocation && !!geoLocation.stateCode
  };
}
