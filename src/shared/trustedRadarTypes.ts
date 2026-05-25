// Trust Radar - Types and Interfaces

export interface TrustedContractor {
  id: number;
  placeId: string;
  businessName: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  stateCode: string | null;
  zipCode: string | null;
  lat: number | null;
  lng: number | null;
  googleRating: number | null;
  googleReviewCount: number | null;
  bbbGrade: string | null;
  licenseStatus: 'verified' | 'unverified' | 'not_found' | null;
  licenseNumber: string | null;
  tradeCategories: string[];
  cachedAt: string | null;
}

export interface VerificationRequest {
  id: number;
  contractorPlaceId: string;
  businessName: string;
  email: string | null;
  website: string | null;
  phone: string | null;
  stateCode: string | null;
  requestedByIp: string | null;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: string;
}

export interface RadarSearchParams {
  zip: string;
  trade: string;
  radius: 10 | 25 | 50;
}

export interface RadarSearchResult {
  contractors: TrustedContractor[];
  center: { lat: number; lng: number };
  totalFound: number;
  fromCache: boolean;
}

// Trade categories for filtering
export const RADAR_TRADE_CATEGORIES = [
  { id: 'all', label: 'All Trades', googleTypes: [] },
  { id: 'painter', label: 'Painters', googleTypes: ['painter'] },
  { id: 'carpenter', label: 'Carpenters', googleTypes: ['carpenter'] },
  { id: 'plumber', label: 'Plumbers', googleTypes: ['plumber'] },
  { id: 'electrician', label: 'Electricians', googleTypes: ['electrician'] },
  { id: 'handyman', label: 'Handymen', googleTypes: ['handyman'] },
  { id: 'general_contractor', label: 'General Contractors', googleTypes: ['general_contractor', 'roofing_contractor', 'home_improvement_store'] },
  { id: 'hvac', label: 'HVAC', googleTypes: ['hvac_contractor'] },
  { id: 'roofing', label: 'Roofing', googleTypes: ['roofing_contractor'] },
  { id: 'landscaper', label: 'Landscapers', googleTypes: ['landscaper', 'lawn_care_service', 'gardener'] },
] as const;

export type TradeCategory = typeof RADAR_TRADE_CATEGORIES[number]['id'];
