import { useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Radar } from 'lucide-react';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface ContractorMarker {
  id: string;
  name: string;
  lat: number;
  lng: number;
  rating?: number;
  tradeCategory?: string;
}

export interface MapBounds {
  center: { lat: number; lng: number };
  radiusMiles: number;
}

interface RadarMapProps {
  center?: { lat: number; lng: number };
  contractors?: ContractorMarker[];
  onMarkerClick?: (contractor: ContractorMarker) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
  isSearching?: boolean;
  /** Frame all markers instead of flying to `center`. For keyword results, which
   *  can be spread nationally and may have no center at all. */
  fitToContractors?: boolean;
  emptyMessage?: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, ch => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] as string
  ));

// ZIP code to approximate coordinates (simplified - will use geocoding API in production)
const ZIP_COORDINATES: Record<string, { lat: number; lng: number; name: string }> = {
  // Georgia
  '30301': { lat: 33.749, lng: -84.388, name: 'Atlanta, GA' },
  '30309': { lat: 33.793, lng: -84.384, name: 'Atlanta, GA' },
  '30318': { lat: 33.793, lng: -84.428, name: 'Atlanta, GA' },
  '30327': { lat: 33.862, lng: -84.424, name: 'Atlanta, GA' },
  '30342': { lat: 33.877, lng: -84.368, name: 'Atlanta, GA' },
  // California
  '90210': { lat: 34.090, lng: -118.406, name: 'Beverly Hills, CA' },
  '94102': { lat: 37.779, lng: -122.419, name: 'San Francisco, CA' },
  '92101': { lat: 32.719, lng: -117.162, name: 'San Diego, CA' },
  // New York
  '10001': { lat: 40.748, lng: -73.993, name: 'New York, NY' },
  '10019': { lat: 40.765, lng: -73.985, name: 'New York, NY' },
  '11201': { lat: 40.693, lng: -73.990, name: 'Brooklyn, NY' },
  // Texas
  '75201': { lat: 32.789, lng: -96.798, name: 'Dallas, TX' },
  '77001': { lat: 29.752, lng: -95.358, name: 'Houston, TX' },
  '78201': { lat: 29.468, lng: -98.525, name: 'San Antonio, TX' },
  // Florida
  '33101': { lat: 25.779, lng: -80.197, name: 'Miami, FL' },
  '32801': { lat: 28.541, lng: -81.379, name: 'Orlando, FL' },
  // Default fallback (center of US)
  'default': { lat: 39.833, lng: -98.583, name: 'United States' },
};

export function getCoordinatesFromZip(zip: string): { lat: number; lng: number; name: string } {
  // Try exact match
  if (ZIP_COORDINATES[zip]) {
    return ZIP_COORDINATES[zip];
  }
  // Try prefix match (first 3 digits)
  const prefix = zip.slice(0, 3);
  for (const [key, value] of Object.entries(ZIP_COORDINATES)) {
    if (key.startsWith(prefix)) {
      return value;
    }
  }
  return ZIP_COORDINATES['default'];
}

// Calculate radius in miles from map bounds
function calculateRadiusFromBounds(map: L.Map): number {
  const bounds = map.getBounds();
  const center = bounds.getCenter();
  const ne = bounds.getNorthEast();
  
  // Calculate distance from center to corner in meters, then convert to miles
  const distanceMeters = center.distanceTo(ne);
  const distanceMiles = distanceMeters / 1609.34;
  
  // Use half the diagonal as search radius, capped between 5-100 miles
  return Math.max(5, Math.min(100, Math.round(distanceMiles * 0.7)));
}

export default function RadarMap({
  center,
  contractors = [],
  onMarkerClick,
  onBoundsChange,
  isSearching = false,
  fitToContractors = false,
  emptyMessage
}: RadarMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const isInitialMoveRef = useRef(true);
  const onBoundsChangeRef = useRef(onBoundsChange);
  const lastSearchCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  
  // Keep ref updated
  useEffect(() => {
    onBoundsChangeRef.current = onBoundsChange;
  }, [onBoundsChange]);

  // Calculate distance between two points in miles
  const getDistanceMiles = useCallback((lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }, []);

  // Handle bounds change (called on map move/zoom)
  const handleBoundsChange = useCallback((map: L.Map) => {
    const mapCenter = map.getCenter();
    const radiusMiles = calculateRadiusFromBounds(map);
    
    const bounds: MapBounds = {
      center: { lat: mapCenter.lat, lng: mapCenter.lng },
      radiusMiles
    };
    
    // Skip showing the button on the initial move when centering on ZIP
    if (isInitialMoveRef.current) {
      isInitialMoveRef.current = false;
      lastSearchCenterRef.current = { lat: mapCenter.lat, lng: mapCenter.lng };
      return;
    }
    
    // Only show search button if a search has already been performed
    // and user moved more than 2 miles from last search
    if (lastSearchCenterRef.current) {
      const distance = getDistanceMiles(
        lastSearchCenterRef.current.lat,
        lastSearchCenterRef.current.lng,
        mapCenter.lat,
        mapCenter.lng
      );
      // Distance tracking kept for potential future use
      void distance;
    }
    
    if (onBoundsChangeRef.current) {
      onBoundsChangeRef.current(bounds);
    }
  }, [getDistanceMiles]);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: center ? [center.lat, center.lng] : [39.833, -98.583],
      zoom: center ? 10 : 4,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Use CartoDB Positron for a clean, modern look
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add moveend listener for bounds-based search
    map.on('moveend', () => {
      handleBoundsChange(map);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [handleBoundsChange]);

  // Update center when ZIP changes (skipped in fit mode — bounds win there)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !center || fitToContractors) return;

    // Mark as initial move so we don't trigger search
    isInitialMoveRef.current = true;
    lastSearchCenterRef.current = { lat: center.lat, lng: center.lng };
    
    // Animate to new center
    map.flyTo([center.lat, center.lng], 10, {
      duration: 1,
    });
  }, [center, fitToContractors]);

  // Update contractor markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach(marker => map.removeLayer(marker));
    markersRef.current = [];

    // Add new markers
    contractors.forEach(contractor => {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            width: 36px;
            height: 36px;
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            border-radius: 50%;
            border: 3px solid white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 14px;
          ">
            ${contractor.rating ? contractor.rating.toFixed(1) : '★'}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const marker = L.marker([contractor.lat, contractor.lng], { icon: customIcon })
        .bindPopup(`
          <div style="padding: 4px;">
            <strong>${escapeHtml(contractor.name)}</strong>
            ${contractor.rating ? `<br><span style="color: #10b981;">★ ${contractor.rating.toFixed(1)}</span>` : ''}
          </div>
        `)
        .addTo(map);

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(contractor));
      }

      markersRef.current.push(marker);
    });

    // Keyword results have no meaningful center, so frame the markers instead.
    if (fitToContractors && markersRef.current.length > 0) {
      isInitialMoveRef.current = true; // programmatic move, not a user pan
      map.fitBounds(L.featureGroup(markersRef.current).getBounds().pad(0.2), { maxZoom: 13 });
    }
  }, [contractors, onMarkerClick, fitToContractors]);

  return (
    <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl overflow-hidden">
      {!center && contractors.length === 0 && (
        <div className="absolute inset-0 z-10 bg-gray-100 flex items-center justify-center">
          <div className="text-center p-8">
            <Radar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">{emptyMessage || 'Enter a ZIP code to search'}</p>
            <p className="text-gray-500 text-sm mt-2">Map will display trusted contractors in your area</p>
          </div>
        </div>
      )}
      {isSearching && (
        <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Searching for trusted PROs...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="absolute inset-0" />
    </div>
  );
}
