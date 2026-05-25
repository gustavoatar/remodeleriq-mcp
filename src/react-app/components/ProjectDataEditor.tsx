import { useState, useEffect, useMemo } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  Edit3, 
  X, 
  Save,
  Ruler,
  Layers,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MapPin,
  Loader2,
  Info
} from 'lucide-react';
import ConfidenceScoreModal from './ConfidenceScoreModal';

export type FinishLevelOverride = 'basic' | 'good' | 'luxury' | null;

export interface ProjectDataOverrides {
  squareFootage: number | null;
  finishLevel: FinishLevelOverride;
  bidTotal: number | null;
}

interface DetectedData {
  squareFootage: number | null;
  finishLevel: string | null;
  bidTotal: number | null;
  contractorName: string | null;
  projectType: string | null;
}

interface ProjectDataEditorProps {
  detectedData: DetectedData;
  overrides: ProjectDataOverrides;
  onOverridesChange: (overrides: ProjectDataOverrides) => void;
  confidenceScore: number;
  locationInfo?: {
    stateCode?: string;
    stateName?: string;
    zipCode?: string | null;
    city?: string;
  } | null;
  isAnalysisUpdating?: boolean;
}

export default function ProjectDataEditor({
  detectedData,
  overrides,
  onOverridesChange,
  confidenceScore,
  locationInfo,
  isAnalysisUpdating = false
}: ProjectDataEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [localOverrides, setLocalOverrides] = useState<ProjectDataOverrides>(overrides);
  const [showScoreModal, setShowScoreModal] = useState(false);

  // Calculate completeness
  const { completeness, missingItems, hasAllCritical } = useMemo(() => {
    const items = [
      { key: 'bidTotal', label: 'Bid Total', critical: true, detected: detectedData.bidTotal !== null || overrides.bidTotal !== null },
      { key: 'squareFootage', label: 'Square Footage', critical: true, detected: detectedData.squareFootage !== null || overrides.squareFootage !== null },
      { key: 'finishLevel', label: 'Finish Level', critical: false, detected: detectedData.finishLevel !== null || overrides.finishLevel !== null },
      { key: 'projectType', label: 'Project Type', critical: false, detected: detectedData.projectType !== null },
    ];

    const detected = items.filter(i => i.detected).length;
    const missing = items.filter(i => !i.detected);
    const criticalMissing = missing.filter(i => i.critical);
    
    return {
      completeness: Math.round((detected / items.length) * 100),
      missingItems: missing,
      hasAllCritical: criticalMissing.length === 0
    };
  }, [detectedData, overrides]);

  // Auto-expand if there are critical missing items
  useEffect(() => {
    if (!hasAllCritical) {
      setIsExpanded(true);
    }
  }, [hasAllCritical]);

  const handleSave = () => {
    onOverridesChange(localOverrides);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setLocalOverrides(overrides);
    setIsEditing(false);
  };

  // Get effective values (detected or overridden)
  const effectiveSquareFootage = overrides.squareFootage ?? detectedData.squareFootage;
  const effectiveBidTotal = overrides.bidTotal ?? detectedData.bidTotal;
  const effectiveFinishLevel = overrides.finishLevel ?? detectedData.finishLevel;

  const getCompletenessColor = () => {
    if (completeness >= 75) return 'bg-emerald-500';
    if (completeness >= 50) return 'bg-teal-500';
    return 'bg-red-500';
  };

  const getCompletenessTextColor = () => {
    if (completeness >= 75) return 'text-emerald-600';
    if (completeness >= 50) return 'text-teal-600';
    return 'text-red-600';
  };

  return (
    <>
    <ConfidenceScoreModal 
      isOpen={showScoreModal} 
      onClose={() => setShowScoreModal(false)}
      currentScore={confidenceScore}
    />
    <div className="card-glass shadow-lg mb-6 overflow-hidden">
      {/* Header with Progress Bar */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-navy-50 transition-colors"
      >
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            {hasAllCritical ? (
              <div className="p-2 rounded-lg bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-teal-100">
                <AlertCircle className="w-5 h-5 text-teal-600" />
              </div>
            )}
            <div className="text-left">
              <h3 className="font-semibold text-navy-900">Project Data</h3>
              <p className="text-sm text-navy-500">
                {hasAllCritical 
                  ? 'All critical data detected' 
                  : `${missingItems.filter(i => i.critical).length} critical item${missingItems.filter(i => i.critical).length > 1 ? 's' : ''} missing`
                }
              </p>
            </div>
          </div>

          {/* Completeness Bar */}
          <div className="flex-1 max-w-xs hidden sm:block">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-navy-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getCompletenessColor()} transition-all duration-500`}
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <span className={`text-sm font-semibold ${getCompletenessTextColor()}`}>
                {completeness}%
              </span>
            </div>
          </div>

          {/* Location Badge */}
          {locationInfo && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-navy-700">
                {locationInfo.zipCode || locationInfo.stateCode || 'Unknown'}
              </span>
            </div>
          )}

          {/* Confidence Score Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-navy-100 rounded-lg">
            {isAnalysisUpdating ? (
              <>
                <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />
                <span className="text-sm font-medium text-navy-700">Updating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-navy-700">Score: {confidenceScore}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowScoreModal(true);
                  }}
                  className="p-0.5 hover:bg-navy-200 rounded-full transition-colors"
                  title="How is this calculated?"
                >
                  <Info className="w-4 h-4 text-navy-500 hover:text-purple-600" />
                </button>
              </>
            )}
          </div>
        </div>

        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-navy-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-navy-400" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-navy-100">
          {/* Missing Items Alert */}
          {missingItems.length > 0 && !isEditing && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Action Items - Add missing data to improve analysis
              </h4>
              <div className="flex flex-wrap gap-2">
                {missingItems.map(item => (
                  <button
                    key={item.key}
                    onClick={() => setIsEditing(true)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      item.critical 
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                        : 'bg-navy-100 text-navy-600 hover:bg-navy-200 border border-navy-200'
                    }`}
                  >
                    + Add {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Data Display / Edit Form */}
          <div className="mt-4">
            {isEditing ? (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="grid sm:grid-cols-3 gap-4">
                  {/* Square Footage */}
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1.5">
                      <Ruler className="w-4 h-4 inline mr-1" />
                      Square Footage
                    </label>
                    <input
                      type="number"
                      value={localOverrides.squareFootage ?? detectedData.squareFootage ?? ''}
                      onChange={(e) => setLocalOverrides({
                        ...localOverrides,
                        squareFootage: e.target.value ? parseInt(e.target.value) : null
                      })}
                      placeholder="e.g., 150"
                      className="w-full px-3 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    {detectedData.squareFootage && (
                      <p className="text-xs text-navy-400 mt-1">
                        Detected: {detectedData.squareFootage} sq ft
                      </p>
                    )}
                  </div>

                  {/* Bid Total */}
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1.5">
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Bid Total
                    </label>
                    <input
                      type="number"
                      value={localOverrides.bidTotal ?? detectedData.bidTotal ?? ''}
                      onChange={(e) => setLocalOverrides({
                        ...localOverrides,
                        bidTotal: e.target.value ? parseFloat(e.target.value) : null
                      })}
                      placeholder="e.g., 25000"
                      className="w-full px-3 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                    />
                    {detectedData.bidTotal && (
                      <p className="text-xs text-navy-400 mt-1">
                        Detected: ${detectedData.bidTotal.toLocaleString()}
                      </p>
                    )}
                  </div>

                  {/* Finish Level */}
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-1.5">
                      <Layers className="w-4 h-4 inline mr-1" />
                      Finish Level
                      <span className="text-navy-400 font-normal ml-1">(What if?)</span>
                    </label>
                    <select
                      value={localOverrides.finishLevel ?? ''}
                      onChange={(e) => setLocalOverrides({
                        ...localOverrides,
                        finishLevel: e.target.value ? e.target.value as FinishLevelOverride : null
                      })}
                      className="w-full px-3 py-2 border border-navy-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-white"
                    >
                      <option value="">Auto-detect</option>
                      <option value="basic">Basic - Budget finishes</option>
                      <option value="good">Good - Mid-range quality</option>
                      <option value="luxury">Luxury - High-end finishes</option>
                    </select>
                    {detectedData.finishLevel && (
                      <p className="text-xs text-navy-400 mt-1">
                        Detected: {detectedData.finishLevel}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Update Analysis
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 text-navy-600 hover:bg-navy-100 rounded-lg font-medium transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div className="flex flex-wrap items-center gap-4">
                {/* Square Footage */}
                <DataBadge
                  icon={<Ruler className="w-4 h-4" />}
                  label="Sq Ft"
                  value={effectiveSquareFootage ? `${effectiveSquareFootage.toLocaleString()}` : null}
                  isOverridden={overrides.squareFootage !== null}
                />

                {/* Bid Total */}
                <DataBadge
                  icon={<DollarSign className="w-4 h-4" />}
                  label="Bid Total"
                  value={effectiveBidTotal ? `$${effectiveBidTotal.toLocaleString()}` : null}
                  isOverridden={overrides.bidTotal !== null}
                />

                {/* Finish Level */}
                <DataBadge
                  icon={<Layers className="w-4 h-4" />}
                  label="Finish Level"
                  value={effectiveFinishLevel ? effectiveFinishLevel.charAt(0).toUpperCase() + effectiveFinishLevel.slice(1) : null}
                  isOverridden={overrides.finishLevel !== null}
                />

                {/* Edit Button */}
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-3 py-2 text-navy-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg font-medium transition-colors ml-auto"
                >
                  <Edit3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Data</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

function DataBadge({ 
  icon, 
  label, 
  value, 
  isOverridden 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | null;
  isOverridden: boolean;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
      value 
        ? isOverridden
          ? 'bg-purple-50 border-purple-200'
          : 'bg-navy-50 border-navy-200'
        : 'bg-teal-50 border-teal-200 border-dashed'
    }`}>
      <span className={value ? (isOverridden ? 'text-purple-500' : 'text-navy-500') : 'text-teal-500'}>
        {icon}
      </span>
      <div>
        <p className="text-xs text-navy-400">{label}</p>
        <p className={`text-sm font-semibold ${
          value 
            ? isOverridden ? 'text-purple-700' : 'text-navy-900'
            : 'text-teal-600'
        }`}>
          {value ?? 'Not detected'}
        </p>
      </div>
      {isOverridden && (
        <span className="text-xs bg-purple-200 text-purple-700 px-1.5 py-0.5 rounded font-medium">
          edited
        </span>
      )}
    </div>
  );
}

// Helper function to extract detected data from bid content
export function extractDetectedData(bidContent: string, bidTotal: number | null): {
  squareFootage: number | null;
  finishLevel: string | null;
  bidTotal: number | null;
  contractorName: string | null;
  projectType: string | null;
} {
  // Extract square footage - try multiple patterns
  // Look for explicit "X sq ft" patterns first, preferring larger values
  const sqftPatterns = [
    // Explicit measurements with units
    /(\d{1,3}(?:,\d{3})*|\d+)\s*(?:sq\.?\s*ft\.?|square\s*feet|sqft)\b/gi,
    /(\d{1,3}(?:,\d{3})*|\d+)\s*sf\b/gi,
    // Labeled measurements (area, size, room, total)
    /(?:total|project|room|floor|kitchen|bathroom|basement)\s*(?:area|size|space)?[:\s]*(\d{1,3}(?:,\d{3})*|\d+)\s*(?:sq\.?\s*ft\.?|sf|sqft)/gi,
  ];
  
  const foundSqft: number[] = [];
  
  for (const pattern of sqftPatterns) {
    const matches = [...bidContent.matchAll(pattern)];
    for (const match of matches) {
      const numMatch = match[0].match(/(\d{1,3}(?:,\d{3})*|\d+)/);
      if (numMatch) {
        const parsed = parseInt(numMatch[1].replace(/,/g, ''));
        // Only accept reasonable square footage values:
        // - Minimum 75 sq ft (small bathroom or closet)
        // - Maximum 50000 sq ft (large commercial or whole-house)
        // - Ignore very small values like "55 sf" which might be countertop or backsplash area
        if (parsed >= 75 && parsed <= 50000) {
          foundSqft.push(parsed);
        }
      }
    }
  }
  
  // Prefer the largest reasonable square footage found
  // (the project total area is usually larger than individual room areas)
  let squareFootage: number | null = null;
  if (foundSqft.length > 0) {
    // Sort descending and take the largest, but filter out outliers
    foundSqft.sort((a, b) => b - a);
    // Take the largest value that seems reasonable
    squareFootage = foundSqft[0];
  }

  // Detect finish level from keywords
  const luxuryKeywords = /\b(luxury|high-end|premium|designer|custom|marble|granite|quartz|hardwood|porcelain)\b/i;
  const basicKeywords = /\b(basic|budget|economy|standard|laminate|vinyl|builder-grade|entry-level)\b/i;
  
  let finishLevel: string | null = null;
  if (luxuryKeywords.test(bidContent)) {
    finishLevel = 'luxury';
  } else if (basicKeywords.test(bidContent)) {
    finishLevel = 'basic';
  } else if (bidContent.length > 500) {
    // Default to 'good' if we have substantial content but no clear indicators
    finishLevel = 'good';
  }

  // Extract contractor name (look for common patterns)
  let contractorName: string | null = null;
  const namePatterns = [
    /(?:from|contractor|company|submitted by|prepared by)[:\s]+([A-Z][A-Za-z\s&.,]+(?:LLC|Inc|Corp|Co|Construction|Remodeling|Services)?)/i,
    /^([A-Z][A-Za-z\s&.,]+(?:LLC|Inc|Corp|Co|Construction|Remodeling|Services))/m,
  ];
  
  for (const pattern of namePatterns) {
    const match = bidContent.match(pattern);
    if (match && match[1]) {
      contractorName = match[1].trim().substring(0, 50);
      break;
    }
  }

  // Detect project type - expanded patterns
  // Order matters! More specific patterns first, generic patterns last
  const projectTypes: { pattern: RegExp; type: string }[] = [
    // Linear foot projects - check these first (more specific)
    { pattern: /\b(fence|fencing|privacy\s*fence|wood\s*fence|vinyl\s*fence|chain\s*link|picket|post|rail)\b/i, type: 'fence' },
    { pattern: /\b(gutter|gutters|downspout|rain\s*gutter|seamless\s*gutter|gutter\s*guard)\b/i, type: 'gutter' },
    { pattern: /\b(railing|handrail|baluster|banister|stair\s*rail|deck\s*rail|porch\s*rail)\b/i, type: 'railing' },
    { pattern: /\b(retaining\s*wall|retaining|block\s*wall|landscape\s*wall|segmental\s*wall)\b/i, type: 'retaining-wall' },
    // Standard project types
    { pattern: /\b(kitchen|cabinet|countertop|appliance|sink|range|oven|dishwasher|microwave)\b/i, type: 'Kitchen Remodel' },
    { pattern: /\b(bathroom|bath|shower|tub|vanity|toilet|restroom|lavatory)\b/i, type: 'Bathroom Remodel' },
    { pattern: /\b(roof|roofing|shingle|flashing|soffit|fascia)\b/i, type: 'Roofing' },
    { pattern: /\b(deck|patio|outdoor|pergola|porch|gazebo|screened)\b/i, type: 'Deck/Outdoor' },
    { pattern: /\b(window|siding|exterior|vinyl|stucco|brick|facade)\b/i, type: 'Exterior' },
    { pattern: /\b(hvac|heating|cooling|furnace|ac|air\s*condition|heat\s*pump|ductwork|mini\s*split)\b/i, type: 'HVAC' },
    { pattern: /\b(plumb|pipe|water\s*heater|drain|faucet|septic|sewer)\b/i, type: 'Plumbing' },
    { pattern: /\b(electric|wiring|panel|outlet|circuit|breaker|switch|lighting|rewire)\b/i, type: 'Electrical' },
    { pattern: /\b(floor|flooring|hardwood|laminate|vinyl|tile|carpet|lvp|lvt)\b/i, type: 'Flooring' },
    { pattern: /\b(paint|painting|primer|coat|stain|finish)\b/i, type: 'Painting' },
    { pattern: /\b(remodel|renovation|upgrade|improvement|repair|install)\b/i, type: 'General Renovation' },
  ];
  
  // Special handling for basement - detect refinishing vs full remodel
  const isBasement = /\b(basement|foundation|waterproof|crawl\s*space|cellar)\b/i.test(bidContent);
  if (isBasement) {
    // Check for refinishing indicators: flood repair, cosmetic work, refresh, update
    const isRefinishing = /\b(flood|restore|repair|refinish|refresh|update|cosmetic|freshen|repaint|paint|drywall|flooring)\b/i.test(bidContent);
    // Check for full remodel indicators: unfinished space being converted
    const isFullRemodel = /\b(unfinished|convert|finish\s*out|full\s*finish|new\s*basement|buildout)\b/i.test(bidContent);
    
    if (isRefinishing && !isFullRemodel) {
      return {
        squareFootage,
        finishLevel,
        bidTotal,
        contractorName,
        projectType: 'Basement Refinishing'
      };
    } else if (isFullRemodel) {
      return {
        squareFootage,
        finishLevel,
        bidTotal,
        contractorName,
        projectType: 'Basement Remodel'
      };
    } else {
      // Default to refinishing for ambiguous basement projects
      // Full basement buildouts are typically clearly stated
      return {
        squareFootage,
        finishLevel,
        bidTotal,
        contractorName,
        projectType: 'Basement Refinishing'
      };
    }
  }

  let projectType: string | null = null;
  for (const { pattern, type } of projectTypes) {
    if (pattern.test(bidContent)) {
      projectType = type;
      break;
    }
  }

  return {
    squareFootage,
    finishLevel,
    bidTotal,
    contractorName,
    projectType
  };
}
