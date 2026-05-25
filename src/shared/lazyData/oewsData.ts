/**
 * Lazy-loaded OEWS (Occupational Employment and Wage Statistics) data module
 * 
 * This module provides lazy access to BLS wage data,
 * only loading the data when it's actually requested.
 */

import { ALL_OEWS_DATA, CONSTRUCTION_SOC_CODES, BURDEN_MULTIPLIER, TRADE_BURDEN_MULTIPLIERS } from '../blsOewsData';
import type { OewsWageData } from '../blsOewsData';

// Re-export types and constants that are always needed
export { CONSTRUCTION_SOC_CODES, BURDEN_MULTIPLIER, TRADE_BURDEN_MULTIPLIERS };
export type { OewsWageData };

// Lazy singleton for filtered/indexed data
let _oewsDataByArea: Map<string, OewsWageData[]> | null = null;
let _oewsDataBySoc: Map<string, OewsWageData[]> | null = null;

/**
 * Get all OEWS data - use sparingly, prefer filtered methods
 */
export function getAllOewsData(): OewsWageData[] {
  return ALL_OEWS_DATA;
}

/**
 * Get OEWS data indexed by area code for fast lookups
 */
function getOewsDataByArea(): Map<string, OewsWageData[]> {
  if (_oewsDataByArea) return _oewsDataByArea;
  
  _oewsDataByArea = new Map();
  for (const wage of ALL_OEWS_DATA) {
    const existing = _oewsDataByArea.get(wage.area_code) || [];
    existing.push(wage);
    _oewsDataByArea.set(wage.area_code, existing);
  }
  
  return _oewsDataByArea;
}

/**
 * Get OEWS data indexed by SOC code for fast lookups
 */
function getOewsDataBySoc(): Map<string, OewsWageData[]> {
  if (_oewsDataBySoc) return _oewsDataBySoc;
  
  _oewsDataBySoc = new Map();
  for (const wage of ALL_OEWS_DATA) {
    const existing = _oewsDataBySoc.get(wage.soc_code) || [];
    existing.push(wage);
    _oewsDataBySoc.set(wage.soc_code, existing);
  }
  
  return _oewsDataBySoc;
}

/**
 * Find wage data for a specific occupation in an area
 */
export function findWageData(socCode: string, areaCode: string): OewsWageData | undefined {
  const byArea = getOewsDataByArea();
  const areaData = byArea.get(areaCode);
  if (!areaData) return undefined;
  
  return areaData.find(w => w.soc_code === socCode);
}

/**
 * Find all wage data for a specific occupation across all areas
 */
export function findWageDataBySoc(socCode: string): OewsWageData[] {
  const bySoc = getOewsDataBySoc();
  return bySoc.get(socCode) || [];
}

/**
 * Find national wage data for a specific occupation
 */
export function findNationalWageData(socCode: string): OewsWageData | undefined {
  const bySoc = getOewsDataBySoc();
  const socData = bySoc.get(socCode);
  if (!socData) return undefined;
  
  return socData.find(w => w.area_type === 'national');
}

/**
 * Get summary stats about OEWS data
 */
export function getOewsDataStats(): { national: number; state: number; msa: number } {
  return {
    national: ALL_OEWS_DATA.filter(w => w.area_type === 'national').length,
    state: ALL_OEWS_DATA.filter(w => w.area_type === 'state').length,
    msa: ALL_OEWS_DATA.filter(w => w.area_type === 'msa').length
  };
}
