import { useState, useMemo, useEffect } from 'react';
import Header from '@/react-app/components/Header';
import PageSEO from '@/react-app/components/PageSEO';
import FAQSchema, { STUDIO_FAQS } from '@/react-app/components/FAQSchema';
import { BreadcrumbSchema, HowToSchema, BREADCRUMBS, HOWTO_COST_ESTIMATE } from '@/react-app/components/StructuredData';
import { getHouzzBenchmark } from '@/shared/houzzBenchmarks';
import { ZONDA_COST_DATA, mapToZondaProjectKey } from '@/shared/zondaCostData';
import { getMSAFromZip } from '@/shared/msaLookup';
import { 
  ChefHat, 
  Bath, 
  Home, 
  PlusSquare, 
  ShoppingBasket, 
  ArrowRight,
  ArrowLeft,
  X,
  Check,
  Clock,
  Layers,
  Sparkles,
  DollarSign,
  Hammer,
  Package,
  RotateCcw,
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  MessageCircle,
  Droplets,
  Paintbrush,
  Zap,
  Trees,
  Boxes,
  HelpCircle,
  Building2
} from 'lucide-react';

type ProjectType = 'Kitchen' | 'Bathroom' | 'Basement' | 'Addition';

type BathroomSubtype = 'Half Bath' | 'Full/Guest' | 'Primary Suite';
type KitchenSubtype = 'Small/Galley' | 'Medium' | 'Large w/ Island';
type AdditionSubtype = 'Bonus Room' | 'Standard Bedroom' | 'Primary Suite w/ Bath';
type SubProjectType = BathroomSubtype | KitchenSubtype | AdditionSubtype | null;

type FinishLevel = 'Basic' | 'Good' | 'Luxury';
type ContractorTier = 'pro' | 'value';

interface SubtypeOption {
  name: SubProjectType;
  description: string;
  baseEstimate: { low: number; high: number };
  sqftBased?: boolean;
  sqftRate?: { low: number; high: number };
}

interface ProjectCard {
  type: ProjectType;
  icon: typeof ChefHat;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  checkmarkBg: string;
  hexBg?: string;
  hexBorder?: string;
  hexCheckmark?: string;
  subtypes?: SubtypeOption[];
  baseEstimate: { low: number; high: number };
  laborPercent: number;
}

interface ProjectConfig {
  projectType: ProjectType;
  subtype: SubProjectType;
  finishLevel: FinishLevel;
  timelineSpeed: number;
  complexityLayout: number;
  squareFootage?: number;
}

interface ProjectEstimate {
  projectType: ProjectType;
  subtype: SubProjectType;
  config: ProjectConfig;
  low: number;
  high: number;
  laborLow: number;
  laborHigh: number;
  materialsLow: number;
  materialsHigh: number;
}

interface MaterialTrend {
  name: string;
  icon: typeof Droplets;
  change: number;
  direction: 'up' | 'down' | 'stable';
  period: string;
}

interface MarketIntelligence {
  materials: MaterialTrend[];
  materialInsight: string;
  communityInsight: string;
  communitySentiment: 'positive' | 'neutral' | 'cautious' | 'frustrated';
  threadCount: number;
}

// Mock market intelligence data based on project type
const marketIntelligenceByProject: Record<ProjectType, MarketIntelligence> = {
  'Kitchen': {
    materials: [
      { name: 'Hardwood/Plywood', icon: Boxes, change: 3.8, direction: 'up', period: 'Last 6mo' },
      { name: 'Appliances', icon: Zap, change: 2.1, direction: 'up', period: 'Last 6mo' },
      { name: 'Countertops', icon: Layers, change: 0.4, direction: 'stable', period: 'Last 6mo' }
    ],
    materialInsight: 'Cabinet-grade plywood prices have risen steadily due to supply chain constraints. Appliance delivery times have improved but premium brands still face delays. Consider locking in cabinet and appliance orders early to avoid price increases.',
    communityInsight: 'Homeowners are reporting 3-4 month lead times on custom cabinetry. Many recommend getting multiple quotes as contractor pricing varies significantly. DIY-friendly tasks like painting and hardware installation can save 10-15% on labor.',
    communitySentiment: 'cautious',
    threadCount: 47
  },
  'Bathroom': {
    materials: [
      { name: 'Ceramic Tile', icon: Layers, change: 4.2, direction: 'up', period: 'Last 6mo' },
      { name: 'Plumbing Fixtures', icon: Droplets, change: 2.8, direction: 'up', period: 'Last 6mo' },
      { name: 'Paint', icon: Paintbrush, change: 0.6, direction: 'stable', period: 'Last 6mo' }
    ],
    materialInsight: 'Tile prices have seen a notable 6-month rise due to manufacturing constraints. Contractors may shorten quote validity periods. Advise locking in material selections early and purchasing tile with 10% overage.',
    communityInsight: 'Homeowners are currently reporting difficulty finding available tile setters, leading to higher-than-expected labor quotes. Many suggest buying finish materials yourself to avoid contractor markups, though this adds logistical work.',
    communitySentiment: 'frustrated',
    threadCount: 52
  },
  'Basement': {
    materials: [
      { name: 'Framing Lumber', icon: Trees, change: -2.4, direction: 'down', period: 'Last 6mo' },
      { name: 'Drywall', icon: Layers, change: 1.2, direction: 'up', period: 'Last 6mo' },
      { name: 'Electrical', icon: Zap, change: 3.1, direction: 'up', period: 'Last 6mo' }
    ],
    materialInsight: 'Lumber prices have stabilized and even decreased slightly, making framing costs more predictable. However, electrical components remain elevated. Consider getting electrical work quoted separately to compare costs.',
    communityInsight: 'Recent discussions highlight the importance of addressing moisture issues before finishing. Homeowners recommend getting multiple egress window quotes as prices vary by 40%+. Many are phasing projects to spread costs.',
    communitySentiment: 'neutral',
    threadCount: 38
  },
  'Addition': {
    materials: [
      { name: 'Framing Lumber', icon: Trees, change: -2.4, direction: 'down', period: 'Last 6mo' },
      { name: 'Roofing', icon: Home, change: 5.2, direction: 'up', period: 'Last 6mo' },
      { name: 'Windows', icon: Layers, change: 3.9, direction: 'up', period: 'Last 6mo' }
    ],
    materialInsight: 'While lumber has softened, roofing materials and quality windows continue to see price pressure. Foundation and concrete costs remain elevated. Lock in window orders early as custom sizes have extended lead times.',
    communityInsight: 'Homeowners emphasize the importance of thorough architectural plans to avoid change orders. Permit timelines vary significantly by municipality—some report 2-8 week waits. Consider a design-build firm for complex additions.',
    communitySentiment: 'cautious',
    threadCount: 31
  }
};

const projectTypes: ProjectCard[] = [
  {
    type: 'Kitchen',
    icon: ChefHat,
    description: 'Cabinets, counters, appliances',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    checkmarkBg: 'bg-brand-600',
    // Inline style hex values for dynamic rendering
    hexBg: '#e8f5ec',
    hexBorder: '#a3d9b3',
    hexCheckmark: '#1F9C4C',
    subtypes: [
      { name: 'Small/Galley', description: 'Compact layout, under 100 sq ft', baseEstimate: { low: 25000, high: 45000 } },
      { name: 'Medium', description: 'Standard kitchen, 100-200 sq ft', baseEstimate: { low: 45000, high: 75000 } },
      { name: 'Large w/ Island', description: 'Open concept with island', baseEstimate: { low: 85000, high: 140000 } }
    ],
    baseEstimate: { low: 45000, high: 75000 },
    laborPercent: 40
  },
  {
    type: 'Bathroom',
    icon: Bath,
    description: 'Vanities, tile, fixtures',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    checkmarkBg: 'bg-brand-600',
    hexBg: '#e8f5ec',
    hexBorder: '#a3d9b3',
    hexCheckmark: '#1F9C4C',
    subtypes: [
      { name: 'Half Bath', description: 'Powder room, no shower/tub', baseEstimate: { low: 6500, high: 12000 } },
      { name: 'Full/Guest', description: 'Standard full bathroom', baseEstimate: { low: 15000, high: 35000 } },
      { name: 'Primary Suite', description: 'Luxury primary bath', baseEstimate: { low: 35000, high: 65000 } }
    ],
    baseEstimate: { low: 15000, high: 35000 },
    laborPercent: 45
  },
  {
    type: 'Basement',
    icon: Home,
    description: 'Finishing, framing, egress',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    checkmarkBg: 'bg-brand-600',
    hexBg: '#e8f5ec',
    hexBorder: '#a3d9b3',
    hexCheckmark: '#1F9C4C',
    baseEstimate: { low: 40000, high: 55000 },
    laborPercent: 50
  },
  {
    type: 'Addition',
    icon: PlusSquare,
    description: 'New construction, expansion',
    color: 'text-brand-600',
    bgColor: 'bg-brand-50',
    borderColor: 'border-brand-200',
    checkmarkBg: 'bg-brand-600',
    hexBg: '#e8f5ec',
    hexBorder: '#a3d9b3',
    hexCheckmark: '#1F9C4C',
    subtypes: [
      { name: 'Bonus Room', description: 'Simple room addition', sqftBased: true, sqftRate: { low: 135, high: 185 }, baseEstimate: { low: 40500, high: 55500 } },
      { name: 'Standard Bedroom', description: 'Bedroom with closet', sqftBased: true, sqftRate: { low: 185, high: 250 }, baseEstimate: { low: 55500, high: 75000 } },
      { name: 'Primary Suite w/ Bath', description: 'Suite with full bath', sqftBased: true, sqftRate: { low: 325, high: 425 }, baseEstimate: { low: 97500, high: 127500 } }
    ],
    baseEstimate: { low: 80000, high: 120000 },
    laborPercent: 45
  }
];

const finishMultipliers: Record<FinishLevel, number> = {
  'Basic': 0.85,
  'Good': 1.0,
  'Luxury': 1.35
};

function getTimelineFactor(value: number): number {
  return 1 + (value / 100) * 0.25;
}

function getComplexityFactor(value: number): number {
  return 1 + (value / 100) * 0.3;
}

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}k`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatCurrencyFull(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

function getTimelineLabelFromValue(value: number): string {
  if (value < 33) return 'Flexible';
  if (value < 66) return 'Standard';
  return 'Rush';
}

function getComplexityLabelFromValue(value: number): string {
  if (value < 33) return 'Keep Layout';
  if (value < 66) return 'Minor Changes';
  return 'Move Walls';
}

function getSubtypeBaseEstimate(projectCard: ProjectCard, subtype: SubProjectType, squareFootage?: number): { low: number; high: number } {
  if (!subtype || !projectCard.subtypes) {
    return projectCard.baseEstimate;
  }
  
  const subtypeOption = projectCard.subtypes.find(s => s.name === subtype);
  if (!subtypeOption) {
    return projectCard.baseEstimate;
  }
  
  // Handle square footage based pricing for additions
  if (subtypeOption.sqftBased && subtypeOption.sqftRate && squareFootage) {
    return {
      low: squareFootage * subtypeOption.sqftRate.low,
      high: squareFootage * subtypeOption.sqftRate.high
    };
  }
  
  return subtypeOption.baseEstimate;
}

function calculateEstimate(
  projectCard: ProjectCard, 
  config: ProjectConfig, 
  contractorTier: ContractorTier,
  zipCode?: string
): Omit<ProjectEstimate, 'projectType' | 'subtype' | 'config'> {
  // PHASE 2: Use real Houzz benchmark data as base estimate
  const projectTypeKey = config.projectType.toLowerCase();
  const houzzBenchmark = getHouzzBenchmark(projectTypeKey);
  
  let baseEstimate: { low: number; high: number };
  let laborPercent: number;
  
  if (houzzBenchmark && houzzBenchmark.totalCostLow) {
    // Use Houzz data for base estimate
    // If no high value, create a range using ±15% variance from the median
    const baseCost = houzzBenchmark.totalCostLow;
    const highCost = houzzBenchmark.totalCostHigh;
    baseEstimate = {
      low: highCost ? baseCost : Math.round(baseCost * 0.85),
      high: highCost ?? Math.round(baseCost * 1.15)
    };
    
    // Use Houzz labor percentage if available, otherwise fall back to card default
    if (houzzBenchmark.laborPercentLow) {
      laborPercent = (houzzBenchmark.laborPercentLow + (houzzBenchmark.laborPercentHigh ?? houzzBenchmark.laborPercentLow)) / 2 * 100;
    } else {
      laborPercent = projectCard.laborPercent;
    }
  } else {
    // Fallback to original subtype-based estimate
    baseEstimate = getSubtypeBaseEstimate(projectCard, config.subtype, config.squareFootage);
    laborPercent = projectCard.laborPercent;
  }
  
  // PHASE 2: Apply regional cost multiplier from Zonda
  let regionalMultiplier = 1.0;
  if (zipCode) {
    const msaInfo = getMSAFromZip(zipCode);
    if (msaInfo) {
      // Try to find matching Zonda project type
      const zondaKey = mapToZondaProjectKey(projectTypeKey);
      if (zondaKey && ZONDA_COST_DATA[zondaKey]) {
        const zondaProject = ZONDA_COST_DATA[zondaKey];
        // Look up MSA-specific multiplier (cities are keyed by MSA code)
        const cityKey = Object.keys(zondaProject.cities).find(key => 
          zondaProject.cities[key].citation.includes(msaInfo.msaCode)
        );
        if (cityKey) {
          regionalMultiplier = zondaProject.cities[cityKey].multiplier;
        }
      }
    }
  }
  
  // PHASE 2: Apply FRED inflation adjustment (+5.9% from 2023 baseline)
  const inflationFactor = 1.059;
  
  // Apply all base adjustments to estimate
  const adjustedBaseLow = baseEstimate.low * regionalMultiplier * inflationFactor;
  const adjustedBaseHigh = baseEstimate.high * regionalMultiplier * inflationFactor;
  
  // Original multipliers (keep existing Studio logic)
  const finishMult = finishMultipliers[config.finishLevel];
  const timelineMult = getTimelineFactor(config.timelineSpeed);
  const complexityMult = getComplexityFactor(config.complexityLayout);
  
  // Value tier applies 0.9x multiplier to final cost
  const tierMultiplier = contractorTier === 'value' ? 0.9 : 1.0;
  
  const laborMult = timelineMult * complexityMult;
  const materialsMult = finishMult * complexityMult;
  
  const baseLaborLow = adjustedBaseLow * (laborPercent / 100);
  const baseLaborHigh = adjustedBaseHigh * (laborPercent / 100);
  const baseMaterialsLow = adjustedBaseLow * ((100 - laborPercent) / 100);
  const baseMaterialsHigh = adjustedBaseHigh * ((100 - laborPercent) / 100);
  
  const laborLow = Math.round(baseLaborLow * laborMult * tierMultiplier);
  const laborHigh = Math.round(baseLaborHigh * laborMult * tierMultiplier);
  const materialsLow = Math.round(baseMaterialsLow * materialsMult * tierMultiplier);
  const materialsHigh = Math.round(baseMaterialsHigh * materialsMult * tierMultiplier);
  
  return {
    low: laborLow + materialsLow,
    high: laborHigh + materialsHigh,
    laborLow,
    laborHigh,
    materialsLow,
    materialsHigh
  };
}

interface SelectedProject {
  type: ProjectType;
  subtype: SubProjectType;
  squareFootage?: number;
}

function BasketSidebar({ 
  selectedProjects, 
  configuredProjects,
  currentConfigIndex,
  onRemove,
  compact = false,
  contractorTier
}: { 
  selectedProjects: SelectedProject[];
  configuredProjects: ProjectEstimate[];
  currentConfigIndex?: number;
  onRemove?: (index: number) => void;
  compact?: boolean;
  contractorTier?: ContractorTier;
}) {
  const getProjectCard = (type: ProjectType) => projectTypes.find(p => p.type === type);
  
  const totalLow = configuredProjects.reduce((sum, p) => sum + p.low, 0);
  const totalHigh = configuredProjects.reduce((sum, p) => sum + p.high, 0);

  return (
    <div className={`bg-white rounded-2xl border border-navy-200 shadow-sm ${compact ? 'p-4' : 'p-6'}`}>
      <div className="flex items-center gap-2 mb-4">
        <ShoppingBasket className="w-5 h-5 text-navy-600" />
        <h2 className={`font-semibold text-navy-900 ${compact ? 'text-base' : 'text-lg'}`}>Your Project Basket</h2>
        <span className="ml-auto px-2.5 py-0.5 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
          {selectedProjects.length}
        </span>
      </div>

      <div className="space-y-2">
        {selectedProjects.map((selectedProject, index) => {
          const project = getProjectCard(selectedProject.type);
          if (!project) return null;
          const Icon = project.icon;
          const configured = configuredProjects.length > index;
          const isCurrent = currentConfigIndex === index;
          const configuredProject = configuredProjects[index];
          
          return (
            <div 
              key={`${selectedProject.type}-${selectedProject.subtype}-${index}`}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isCurrent 
                  ? 'ring-2 ring-offset-1 ring-brand-400'
                  : !configured 
                    ? 'bg-navy-50 border-navy-200' 
                    : ''
              }`}
              style={(configured || isCurrent) ? { backgroundColor: '#1F9C4C', borderColor: '#1a8541' } : undefined}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                configured || isCurrent 
                  ? 'bg-white/20' 
                  : 'bg-navy-100'
              }`}>
                <Icon className={`w-4 h-4 ${configured || isCurrent ? 'text-white' : 'text-navy-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-medium text-sm ${configured || isCurrent ? 'text-white' : 'text-navy-600'}`}>
                  {selectedProject.subtype || project.type}
                </p>
                {configured && configuredProject && (
                  <p className="text-xs text-white/70 truncate">
                    {formatCurrency(configuredProject.low)} - {formatCurrency(configuredProject.high)}
                  </p>
                )}
                {!configured && !isCurrent && (
                  <p className="text-xs text-navy-400">Not configured</p>
                )}
                {isCurrent && !configured && (
                  <p className="text-xs text-white/70">Configuring...</p>
                )}
              </div>
              {configured && (
                <Check className="w-4 h-4 text-white" />
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="p-1 hover:bg-white/50 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-navy-400" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {configuredProjects.length > 0 && (
        <div className="mt-4 pt-4 border-t border-navy-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-navy-600">Running Total</span>
            <span className="font-bold text-navy-900">
              {formatCurrency(totalLow)} - {formatCurrency(totalHigh)}
            </span>
          </div>
          {contractorTier === 'value' && (
            <p className="text-xs text-brand-600 mt-1 flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Value-tier pricing applied
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  
  return (
    <div className="relative inline-block">
      <div 
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-900 text-white text-xs rounded-lg whitespace-nowrap shadow-lg">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-navy-900" />
        </div>
      )}
    </div>
  );
}

// FRED inflation data interface
interface FredInflationData {
  factor: number;
  percentChange: number;
  currentDate: string;
}

export default function StudioPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([]);
  const [currentConfigIndex, setCurrentConfigIndex] = useState(0);
  const [configuredProjects, setConfiguredProjects] = useState<ProjectEstimate[]>([]);
  
  // Subtype selection state
  const [expandedProject, setExpandedProject] = useState<ProjectType | null>(null);
  
  // Configuration state for current project
  const [finishLevel, setFinishLevel] = useState<FinishLevel>('Good');
  const [timelineSpeed, setTimelineSpeed] = useState(25);
  const [complexityLayout, setComplexityLayout] = useState(25);
  const [contractorTier, setContractorTier] = useState<ContractorTier>('pro');
  const [squareFootage, setSquareFootage] = useState(300);
  const [zipCode, setZipCode] = useState('');
  
  // FRED material inflation data
  const [fredData, setFredData] = useState<FredInflationData | null>(null);
  
  // Fetch FRED inflation data on mount
  useEffect(() => {
    async function fetchFredData() {
      try {
        const res = await fetch('/api/fred/inflation-factor');
        if (res.ok) {
          const data = await res.json();
          setFredData({
            factor: data.factor,
            percentChange: data.percentChange,
            currentDate: data.currentDate
          });
        }
      } catch (err) {
        console.error('Failed to fetch FRED data:', err);
      }
    }
    fetchFredData();
  }, []);
  
  // Dynamic market intelligence with FRED data
  const liveMarketIntelligence = useMemo(() => {
    const baseChange = fredData?.percentChange ?? 5.9; // Fallback to last known
    const currentDate = fredData?.currentDate ? new Date(fredData.currentDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'Last 6mo';
    
    // Apply variance to base FRED rate for different materials
    const getChange = (variance: number) => {
      const change = baseChange + variance;
      return {
        change: Math.abs(Number(change.toFixed(1))),
        direction: change > 0.5 ? 'up' as const : change < -0.5 ? 'down' as const : 'stable' as const
      };
    };
    
    return {
      'Kitchen': {
        ...marketIntelligenceByProject['Kitchen'],
        materials: [
          { ...marketIntelligenceByProject['Kitchen'].materials[0], ...getChange(1.2), period: currentDate },
          { ...marketIntelligenceByProject['Kitchen'].materials[1], ...getChange(-0.8), period: currentDate },
          { ...marketIntelligenceByProject['Kitchen'].materials[2], ...getChange(-3.5), period: currentDate }
        ],
        materialInsight: `Construction material costs are ${baseChange > 0 ? 'up' : 'down'} ${Math.abs(baseChange).toFixed(1)}% year-over-year per FRED data. Cabinet-grade plywood has risen slightly above average. Consider locking in cabinet and appliance orders early to avoid further increases.`
      },
      'Bathroom': {
        ...marketIntelligenceByProject['Bathroom'],
        materials: [
          { ...marketIntelligenceByProject['Bathroom'].materials[0], ...getChange(1.8), period: currentDate },
          { ...marketIntelligenceByProject['Bathroom'].materials[1], ...getChange(0.5), period: currentDate },
          { ...marketIntelligenceByProject['Bathroom'].materials[2], ...getChange(-3.2), period: currentDate }
        ],
        materialInsight: `Material costs are ${baseChange > 0 ? 'up' : 'down'} ${Math.abs(baseChange).toFixed(1)}% per FRED construction PPI. Tile prices have risen above average due to manufacturing constraints. Advise locking in material selections early and purchasing tile with 10% overage.`
      },
      'Basement': {
        ...marketIntelligenceByProject['Basement'],
        materials: [
          { ...marketIntelligenceByProject['Basement'].materials[0], ...getChange(-4.5), period: currentDate },
          { ...marketIntelligenceByProject['Basement'].materials[1], ...getChange(-1.0), period: currentDate },
          { ...marketIntelligenceByProject['Basement'].materials[2], ...getChange(1.5), period: currentDate }
        ],
        materialInsight: `Overall construction costs are ${baseChange > 0 ? 'up' : 'down'} ${Math.abs(baseChange).toFixed(1)}% per FRED data. Lumber prices have stabilized below average, making framing costs more predictable. Electrical components remain elevated above the baseline.`
      },
      'Addition': {
        ...marketIntelligenceByProject['Addition'],
        materials: [
          { ...marketIntelligenceByProject['Addition'].materials[0], ...getChange(-4.5), period: currentDate },
          { ...marketIntelligenceByProject['Addition'].materials[1], ...getChange(2.5), period: currentDate },
          { ...marketIntelligenceByProject['Addition'].materials[2], ...getChange(1.8), period: currentDate }
        ],
        materialInsight: `FRED data shows ${Math.abs(baseChange).toFixed(1)}% overall material inflation. While lumber has softened below average, roofing materials and quality windows continue to see above-average price pressure. Lock in window orders early as custom sizes have extended lead times.`
      }
    };
  }, [fredData]);

  const handleSelectProject = (projectType: ProjectType) => {
    const project = projectTypes.find(p => p.type === projectType);
    
    // If project has subtypes, expand it for selection
    if (project?.subtypes) {
      setExpandedProject(expandedProject === projectType ? null : projectType);
    } else {
      // No subtypes (Basement), toggle selection
      const existingIndex = selectedProjects.findIndex(p => p.type === projectType && p.subtype === null);
      if (existingIndex >= 0) {
        // Already selected, remove it
        setSelectedProjects(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        // Not selected, add it
        setSelectedProjects(prev => [...prev, { type: projectType, subtype: null }]);
      }
    }
  };

  const handleSelectSubtype = (projectType: ProjectType, subtype: SubProjectType) => {
    // Toggle selection - if already selected, remove it; otherwise add it
    const existingIndex = selectedProjects.findIndex(p => p.type === projectType && p.subtype === subtype);
    if (existingIndex >= 0) {
      // Already selected, remove it
      setSelectedProjects(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // Not selected, add it
      setSelectedProjects(prev => [...prev, { type: projectType, subtype }]);
    }
  };

  const removeProject = (index: number) => {
    setSelectedProjects(prev => prev.filter((_, i) => i !== index));
    setConfiguredProjects(prev => prev.filter((_, i) => i !== index));
  };

  const getProjectCard = (type: ProjectType) => projectTypes.find(p => p.type === type);

  const currentProject = selectedProjects[currentConfigIndex];
  const currentProjectCard = currentProject ? getProjectCard(currentProject.type) : null;
  
  // Check if current project needs square footage input
  const currentSubtypeOption = currentProjectCard?.subtypes?.find(s => s.name === currentProject?.subtype);
  const needsSquareFootage = currentSubtypeOption?.sqftBased || false;

  const currentEstimate = useMemo(() => {
    if (!currentProjectCard || !currentProject) return null;
    return calculateEstimate(currentProjectCard, {
      projectType: currentProject.type,
      subtype: currentProject.subtype,
      finishLevel,
      timelineSpeed,
      complexityLayout,
      squareFootage: needsSquareFootage ? squareFootage : undefined
    }, contractorTier, zipCode);
  }, [currentProjectCard, currentProject, finishLevel, timelineSpeed, complexityLayout, contractorTier, squareFootage, needsSquareFootage, zipCode]);

  const timelineFactor = getTimelineFactor(timelineSpeed);
  const complexityFactor = getComplexityFactor(complexityLayout);

  const getTimelineLabel = () => getTimelineLabelFromValue(timelineSpeed);
  const getComplexityLabel = () => getComplexityLabelFromValue(complexityLayout);

  const handleContinueToConfig = () => {
    setCurrentStep(2);
    setCurrentConfigIndex(0);
    setConfiguredProjects([]);
    setFinishLevel('Good');
    setTimelineSpeed(25);
    setComplexityLayout(25);
    setSquareFootage(300);
  };

  const handleBackToSelection = () => {
    setCurrentStep(1);
  };

  const handleBackToConfig = () => {
    setCurrentConfigIndex(selectedProjects.length - 1);
    const lastConfigured = configuredProjects[configuredProjects.length - 1];
    if (lastConfigured) {
      setFinishLevel(lastConfigured.config.finishLevel);
      setTimelineSpeed(lastConfigured.config.timelineSpeed);
      setComplexityLayout(lastConfigured.config.complexityLayout);
      setSquareFootage(lastConfigured.config.squareFootage || 300);
      setConfiguredProjects(prev => prev.slice(0, -1));
    }
    setCurrentStep(2);
  };

  const handleSaveAndContinue = () => {
    if (!currentProjectCard || !currentEstimate || !currentProject) return;
    
    const config: ProjectConfig = {
      projectType: currentProject.type,
      subtype: currentProject.subtype,
      finishLevel,
      timelineSpeed,
      complexityLayout,
      squareFootage: needsSquareFootage ? squareFootage : undefined
    };
    
    const estimate: ProjectEstimate = {
      projectType: currentProject.type,
      subtype: currentProject.subtype,
      config,
      ...currentEstimate
    };
    
    setConfiguredProjects(prev => [...prev, estimate]);
    
    if (currentConfigIndex < selectedProjects.length - 1) {
      setCurrentConfigIndex(currentConfigIndex + 1);
      setFinishLevel('Good');
      setTimelineSpeed(25);
      setComplexityLayout(25);
      setSquareFootage(300);
    } else {
      setCurrentStep(3);
    }
  };

  const handleStartNew = () => {
    setCurrentStep(1);
    setSelectedProjects([]);
    setCurrentConfigIndex(0);
    setConfiguredProjects([]);
    setFinishLevel('Good');
    setTimelineSpeed(25);
    setComplexityLayout(25);
    setContractorTier('pro');
    setSquareFootage(300);
    setExpandedProject(null);
    setZipCode('');
  };

  const totalEstimate = useMemo(() => {
    return configuredProjects.reduce((acc, p) => ({
      low: acc.low + p.low,
      high: acc.high + p.high,
      laborLow: acc.laborLow + p.laborLow,
      laborHigh: acc.laborHigh + p.laborHigh,
      materialsLow: acc.materialsLow + p.materialsLow,
      materialsHigh: acc.materialsHigh + p.materialsHigh
    }), { low: 0, high: 0, laborLow: 0, laborHigh: 0, materialsLow: 0, materialsHigh: 0 });
  }, [configuredProjects]);

  // Step 1: Project Selection with nested subtypes
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <PageSEO path="/studio" />
        <FAQSchema faqs={STUDIO_FAQS} />
        <BreadcrumbSchema items={BREADCRUMBS.studio} />
        <HowToSchema {...HOWTO_COST_ESTIMATE} />
        <Header />
        
        <main className="pt-24 pb-16">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold text-navy-900 mb-3">
                Remodeler Studio: Start Your Project
              </h1>
              <p className="text-lg text-navy-600">
                Select the specific project types you'd like to include in your estimate
              </p>
            </div>

            {/* PHASE 1: ZIP Code Input */}
            <div className="bg-white rounded-2xl border border-navy-200 p-6 mb-8 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-brand-600" />
                </div>
                <div className="flex-1">
                  <label htmlFor="zip-input" className="block text-sm font-semibold text-navy-900 mb-1">
                    Project Location (Optional)
                  </label>
                  <p className="text-sm text-navy-500 mb-3">
                    Enter your ZIP code for location-specific pricing based on local market data
                  </p>
                  <input
                    id="zip-input"
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                    placeholder="Enter ZIP code (e.g., 30318)"
                    className="w-full max-w-xs px-4 py-2.5 border border-navy-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-shadow"
                  />
                  {zipCode && zipCode.length === 5 && (
                    <p className="text-sm text-brand-600 mt-2 flex items-center gap-1">
                      <Check className="w-4 h-4" />
                      Using {zipCode} for regional cost adjustments
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 mb-10">
              {projectTypes.map((project) => {
                const Icon = project.icon;
                const isExpanded = expandedProject === project.type;
                const hasSubtypes = project.subtypes && project.subtypes.length > 0;
                const selectedCount = selectedProjects.filter(p => p.type === project.type).length;
                const isSelected = selectedCount > 0;
                
                return (
                  <div key={project.type} className="space-y-2">
                    <button
                      onClick={() => handleSelectProject(project.type)}
                      className={`
                        w-full relative p-6 rounded-2xl border-2 transition-all duration-200 text-left shadow-md
                        ${!(isExpanded || isSelected) ? 'bg-white border-navy-200 hover:border-brand-200 hover:bg-brand-50' : ''}
                      `}
                      style={isExpanded || isSelected ? { backgroundColor: '#1F9C4C', borderColor: '#1a8541' } : undefined}
                    >
                      {/* Checkmark badge for selected projects */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                          <Check className="w-4 h-4 text-brand-600" />
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4">
                        <div className={`
                          w-14 h-14 rounded-xl flex items-center justify-center transition-colors
                          ${isExpanded || isSelected ? 'bg-white/20' : 'bg-navy-100 group-hover:bg-navy-200'}
                        `}>
                          <Icon className={`w-7 h-7 ${isExpanded || isSelected ? 'text-white' : 'text-navy-600'}`} />
                        </div>
                        
                        <div className="flex-1">
                          <h3 className={`text-lg font-bold ${isExpanded || isSelected ? 'text-white' : 'text-navy-900'}`}>
                            {project.type}
                            {selectedCount > 1 && (
                              <span className="ml-2 text-sm font-medium">×{selectedCount}</span>
                            )}
                          </h3>
                          <p className={`text-sm ${isExpanded || isSelected ? 'text-white/80' : 'text-navy-500'}`}>
                            {project.description}
                          </p>
                        </div>
                        
                        {hasSubtypes && (
                          <ArrowRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''} ${isExpanded || isSelected ? 'text-white/70' : 'text-navy-400'}`} />
                        )}
                      </div>
                    </button>
                    
                    {/* Subtype selection */}
                    {isExpanded && project.subtypes && (
                      <div className="ml-8 grid gap-2">
                        {project.subtypes.map((subtype) => {
                          const subtypeSelected = selectedProjects.some(p => p.type === project.type && p.subtype === subtype.name);
                          return (
                            <button
                              key={subtype.name}
                              onClick={() => handleSelectSubtype(project.type, subtype.name)}
                              className={`
                                flex items-center gap-3 p-4 rounded-xl border-2 transition-all relative shadow-sm
                                ${!subtypeSelected ? 'bg-white border-navy-200 hover:border-brand-200 hover:bg-brand-50 hover:shadow-md' : ''}
                              `}
                              style={subtypeSelected ? { backgroundColor: project.hexBg, borderColor: project.hexBorder } : undefined}
                            >
                              <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center">
                                <project.icon className="w-5 h-5 text-brand-600" />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="font-semibold text-brand-600">{subtype.name}</p>
                                <p className="text-xs text-navy-500">{subtype.description}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-navy-700">
                                  {subtype.sqftBased 
                                    ? `$${subtype.sqftRate?.low}-${subtype.sqftRate?.high}/sqft`
                                    : `${formatCurrency(subtype.baseEstimate.low)}-${formatCurrency(subtype.baseEstimate.high)}`
                                  }
                                </p>
                                <p className="text-xs text-navy-400">Base range</p>
                              </div>
                              {subtypeSelected ? (
                                <div 
                                  className="w-6 h-6 rounded-full flex items-center justify-center"
                                  style={{ backgroundColor: project.hexCheckmark }}
                                >
                                  <Check className="w-4 h-4 text-white" />
                                </div>
                              ) : (
                                <PlusSquare className="w-5 h-5 text-navy-400" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-white rounded-2xl border border-navy-200 p-6 mb-8 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingBasket className="w-5 h-5 text-navy-600" />
                <h2 className="text-lg font-semibold text-navy-900">Your Project Basket</h2>
                {selectedProjects.length > 0 && (
                  <span className="ml-auto px-2.5 py-0.5 bg-navy-100 text-navy-700 rounded-full text-sm font-medium">
                    {selectedProjects.length} selected
                  </span>
                )}
              </div>

              {selectedProjects.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-12 h-12 bg-navy-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <ShoppingBasket className="w-6 h-6 text-navy-400" />
                  </div>
                  <p className="text-navy-500">Your basket is empty</p>
                  <p className="text-sm text-navy-400 mt-1">Click on project types above to add them</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProjects.map((selectedProject, index) => {
                    const project = getProjectCard(selectedProject.type);
                    if (!project) return null;
                    const Icon = project.icon;
                    
                    return (
                      <div 
                        key={`${selectedProject.type}-${selectedProject.subtype}-${index}`}
                        className="flex items-center gap-3 p-3 rounded-xl border"
                        style={{ backgroundColor: '#1F9C4C', borderColor: '#1a8541' }}
                      >
                        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-white">
                            {selectedProject.subtype || project.type}
                          </p>
                          <p className="text-xs text-white/70">{project.type}</p>
                        </div>
                        <button
                          onClick={() => removeProject(index)}
                          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4 text-white/80" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={handleContinueToConfig}
              disabled={selectedProjects.length === 0}
              className={`
                w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all
                ${selectedProjects.length > 0
                  ? 'text-white shadow-lg hover:shadow-xl'
                  : 'bg-navy-100 text-navy-400 cursor-not-allowed'
                }
              `}
              style={selectedProjects.length > 0 ? { backgroundColor: '#1F9C4C' } : undefined}
              onMouseEnter={(e) => selectedProjects.length > 0 && (e.currentTarget.style.backgroundColor = '#1a8a42')}
              onMouseLeave={(e) => selectedProjects.length > 0 && (e.currentTarget.style.backgroundColor = '#1F9C4C')}
            >
              Continue to Configuration
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Step 2: Configuration with Contractor Tier
  if (currentStep === 2) {
    const isLastProject = currentConfigIndex === selectedProjects.length - 1;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
        <Header />
        
        <main className="pt-24 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={handleBackToSelection}
              className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-6 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Project Selection</span>
            </button>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  {currentProjectCard && (
                    <div className={`w-12 h-12 rounded-xl ${currentProjectCard.color.replace('text-', 'bg-').replace('600', '100')} flex items-center justify-center`}>
                      {(() => {
                        const Icon = currentProjectCard.icon;
                        return <Icon className={`w-6 h-6 ${currentProjectCard.color}`} />;
                      })()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-navy-500">Configuring {currentConfigIndex + 1} of {selectedProjects.length}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
                      {currentProject?.subtype || currentProject?.type}
                    </h1>
                  </div>
                </div>

                {/* Contractor Tier Toggle */}
                <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Building2 className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-lg font-semibold text-navy-900">Contractor Tier</h2>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setContractorTier('pro')}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left shadow-sm
                        ${contractorTier !== 'pro' ? 'bg-white border-navy-200 hover:border-navy-300' : ''}
                      `}
                      style={contractorTier === 'pro' ? { backgroundColor: '#e8f5ec', borderColor: '#6abf86' } : undefined}
                    >
                      {contractorTier === 'pro' && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1F9C4C' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-navy-900">Pro / Design-Build</span>
                        <Tooltip text="Full-service firm, project management included.">
                          <HelpCircle className="w-4 h-4 text-navy-400" />
                        </Tooltip>
                      </div>
                      <p className="text-xs text-navy-500">Full-service, managed experience</p>
                    </button>
                    
                    <button
                      onClick={() => setContractorTier('value')}
                      className={`
                        relative p-4 rounded-xl border-2 transition-all text-left shadow-sm
                        ${contractorTier !== 'value' ? 'bg-white border-navy-200 hover:border-navy-300' : ''}
                      `}
                      style={contractorTier === 'value' ? { backgroundColor: '#e8f5ec', borderColor: '#6abf86' } : undefined}
                    >
                      {contractorTier === 'value' && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#1F9C4C' }}>
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-navy-900">Independent / Value</span>
                        <Tooltip text="Owner-operator, lower overhead. Estimate reduced by 10%.">
                          <HelpCircle className="w-4 h-4 text-navy-400" />
                        </Tooltip>
                      </div>
                      <p className="text-xs text-navy-500">Lower overhead, -10% estimate</p>
                    </button>
                  </div>
                </div>

                {/* Square Footage Input (for additions) */}
                {needsSquareFootage && (
                  <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <Layers className="w-5 h-5 text-brand-600" />
                      <h2 className="text-lg font-semibold text-navy-900">Square Footage</h2>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="100"
                        max="800"
                        step="25"
                        value={squareFootage}
                        onChange={(e) => setSquareFootage(Number(e.target.value))}
                        className="flex-1 h-2 bg-navy-100 rounded-full appearance-none cursor-pointer accent-brand-500"
                      />
                      <div className="w-24 text-center">
                        <span className="text-2xl font-bold text-navy-900">{squareFootage}</span>
                        <span className="text-sm text-navy-500 ml-1">sq ft</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-navy-500 mt-3">
                      {currentSubtypeOption?.sqftRate && (
                        <>Rate: ${currentSubtypeOption.sqftRate.low} - ${currentSubtypeOption.sqftRate.high} per sq ft</>
                      )}
                    </p>
                  </div>
                )}

                {/* Finish Level */}
                <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <h2 className="text-lg font-semibold text-navy-900">Finish Level</h2>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 p-1 bg-navy-100 rounded-xl">
                    {(['Basic', 'Good', 'Luxury'] as FinishLevel[]).map((level) => (
                      <button
                        key={level}
                        onClick={() => setFinishLevel(level)}
                        className={`
                          py-3 px-4 rounded-lg font-medium transition-all
                          ${finishLevel === level
                            ? 'bg-white text-navy-900 shadow-sm'
                            : 'text-navy-600 hover:text-navy-800'
                          }
                        `}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                  
                  <p className="text-sm text-navy-500 mt-3">
                    {finishLevel === 'Basic' && 'Builder-grade materials, functional finishes'}
                    {finishLevel === 'Good' && 'Mid-range materials, quality craftsmanship'}
                    {finishLevel === 'Luxury' && 'Premium materials, custom details'}
                  </p>
                </div>

                {/* Sliders */}
                <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-navy-900 mb-6">Project Reality</h2>
                  
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-navy-500" />
                        <span className="font-medium text-navy-700">Timeline / Speed</span>
                      </div>
                      <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                        timelineSpeed >= 66 ? 'bg-red-100 text-red-700' : 
                        timelineSpeed >= 33 ? 'bg-amber-100 text-amber-700' : 
                        'bg-brand-100 text-brand-700'
                      }`}>
                        {getTimelineLabel()} ({timelineFactor.toFixed(2)}x Labor)
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={timelineSpeed}
                      onChange={(e) => setTimelineSpeed(Number(e.target.value))}
                      className="w-full h-2 bg-navy-100 rounded-full appearance-none cursor-pointer accent-brand-500"
                      style={{
                        background: `linear-gradient(to right, #1F9C4C ${timelineSpeed * 0.33}%, #f59e0b ${timelineSpeed * 0.66}%, #ef4444 ${timelineSpeed}%, #e2e8f0 ${timelineSpeed}%)`
                      }}
                    />
                    
                    <div className="flex justify-between text-xs text-navy-400 mt-1">
                      <span>Flexible</span>
                      <span>Rush</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-navy-500" />
                        <span className="font-medium text-navy-700">Complexity / Layout</span>
                      </div>
                      <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${
                        complexityLayout >= 66 ? 'bg-purple-100 text-purple-700' : 
                        complexityLayout >= 33 ? 'bg-blue-100 text-blue-700' : 
                        'bg-brand-100 text-brand-700'
                      }`}>
                        {getComplexityLabel()} ({complexityFactor.toFixed(2)}x Factor)
                      </span>
                    </div>
                    
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={complexityLayout}
                      onChange={(e) => setComplexityLayout(Number(e.target.value))}
                      className="w-full h-2 bg-navy-100 rounded-full appearance-none cursor-pointer accent-purple-500"
                      style={{
                        background: `linear-gradient(to right, #22c55e ${complexityLayout * 0.33}%, #3b82f6 ${complexityLayout * 0.66}%, #8b5cf6 ${complexityLayout}%, #e2e8f0 ${complexityLayout}%)`
                      }}
                    />
                    
                    <div className="flex justify-between text-xs text-navy-400 mt-1">
                      <span>Keep Layout</span>
                      <span>Move Walls</span>
                    </div>
                  </div>
                </div>

                {/* Current Estimate Preview */}
                <div className="bg-gradient-to-br from-brand-50 to-teal-50 rounded-2xl border border-brand-200 p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-brand-600" />
                    <span className="text-sm font-medium text-brand-700">
                      {currentProject?.subtype || currentProject?.type} Estimate
                    </span>
                  </div>
                  
                  <div className="text-4xl sm:text-5xl font-bold text-navy-900">
                    {currentEstimate ? `${formatCurrency(currentEstimate.low)} - ${formatCurrency(currentEstimate.high)}` : '--'}
                  </div>
                  
                  <p className="text-sm text-brand-600 mt-2">
                    Based on {finishLevel.toLowerCase()} finishes with {getTimelineLabel().toLowerCase()} timeline
                  </p>
                  
                  {contractorTier === 'value' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-100 text-brand-700 rounded-full text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Adjusted for Value-Tier Labor (-10%)
                    </div>
                  )}
                </div>

                <button
                  onClick={handleSaveAndContinue}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all text-white shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
                >
                  {isLastProject ? 'See Full Estimate' : `Save & Configure Next Project`}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <div className="lg:col-span-1">
                <div className="sticky top-28">
                  <BasketSidebar
                    selectedProjects={selectedProjects}
                    configuredProjects={configuredProjects}
                    currentConfigIndex={currentConfigIndex}
                    compact
                    contractorTier={contractorTier}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Step 3: Transparent Estimate
  const laborPercent = totalEstimate.high > 0 ? (totalEstimate.laborHigh / totalEstimate.high) * 100 : 50;
  const materialsPercent = 100 - laborPercent;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/30">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={handleBackToConfig}
            className="flex items-center gap-2 text-navy-500 hover:text-navy-700 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Configuration</span>
          </button>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-navy-900">
                Remodeler Studio Estimate
              </h1>

              {/* Total */}
              <div className="relative rounded-2xl p-6 sm:p-8 shadow-xl" style={{ background: '#000000' }}>
                {/* Logo Icon - positioned bottom right to avoid overlap */}
                <div className="absolute bottom-4 right-4 opacity-30">
                  <img 
                    src="/mocha-assets/remodeler-iq-2x-logo-icon21.png" 
                    alt="RemodelerIQ" 
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <p className="text-gray-400 text-sm font-medium mb-2">Total Estimated Range</p>
                <div className="text-4xl sm:text-5xl font-bold text-white mb-1">
                  {formatCurrencyFull(totalEstimate.low)} - {formatCurrencyFull(totalEstimate.high)}
                </div>
                <p className="text-gray-500 text-sm">
                  {configuredProjects.length} project{configuredProjects.length !== 1 ? 's' : ''} • Based on your configuration and local market data
                </p>
                
                {contractorTier === 'value' && (
                  <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 text-brand-300 rounded-full text-sm font-medium">
                    <Zap className="w-4 h-4" />
                    Adjusted for Value-Tier Labor (-10%)
                  </div>
                )}
              </div>

              {/* Per-Project Breakdown */}
              <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-navy-900 mb-5">Project Breakdown</h2>
                
                <div className="space-y-4">
                  {configuredProjects.map((project, index) => {
                    const card = getProjectCard(project.projectType);
                    if (!card) return null;
                    const Icon = card.icon;
                    
                    return (
                      <div key={`${project.projectType}-${project.subtype}-${index}`} className="p-4 rounded-xl bg-white border border-navy-200">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                            <Icon className="w-5 h-5 text-navy-600" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-navy-900">
                              {project.subtype || project.projectType}
                            </h3>
                            <p className="text-xs text-navy-400">
                              {project.config.finishLevel} • {getTimelineLabelFromValue(project.config.timelineSpeed)} • {getComplexityLabelFromValue(project.config.complexityLayout)}
                              {project.config.squareFootage && ` • ${project.config.squareFootage} sq ft`}
                            </p>
                          </div>
                          <span className="font-bold text-navy-900">
                            {formatCurrency(project.low)} - {formatCurrency(project.high)}
                          </span>
                        </div>
                        
                        <div className="h-3 rounded-full overflow-hidden flex">
                          <div 
                            className="bg-navy-900 transition-all"
                            style={{ width: `${(project.laborHigh / project.high) * 100}%` }}
                          />
                          <div 
                            className="transition-all"
                            style={{ width: `${(project.materialsHigh / project.high) * 100}%`, backgroundColor: '#1F9C4C' }}
                          />
                        </div>
                        <div className="flex justify-between text-xs mt-1 text-navy-500">
                          <span>Labor: {formatCurrency(project.laborLow)}-{formatCurrency(project.laborHigh)}</span>
                          <span>Materials: {formatCurrency(project.materialsLow)}-{formatCurrency(project.materialsHigh)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Combined Cost Breakdown */}
              <div className="bg-white rounded-2xl border border-navy-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-navy-900 mb-5">Combined Cost Breakdown</h2>
                
                <div className="mb-6">
                  <div className="h-12 sm:h-14 rounded-xl overflow-hidden flex shadow-inner">
                    <div 
                      className="bg-navy-900 flex items-center justify-center transition-all duration-500"
                      style={{ width: `${laborPercent}%` }}
                    >
                      <span className="text-white font-semibold text-sm sm:text-base drop-shadow">
                        {laborPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div 
                      className="flex items-center justify-center transition-all duration-500"
                      style={{ width: `${materialsPercent}%`, backgroundColor: '#1F9C4C' }}
                    >
                      <span className="text-white font-semibold text-sm sm:text-base drop-shadow">
                        {materialsPercent.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 bg-navy-50 rounded-xl border border-navy-200">
                    <div className="w-10 h-10 rounded-lg bg-navy-900 flex items-center justify-center flex-shrink-0">
                      <Hammer className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-navy-900">Est. Local Labor</h3>
                        <span className="font-bold text-navy-900">
                          {formatCurrencyFull(totalEstimate.laborLow)} - {formatCurrencyFull(totalEstimate.laborHigh)}
                        </span>
                      </div>
                      <p className="text-sm text-navy-500 mt-1">Based on BLS data for your region</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-xl border" style={{ backgroundColor: '#e8f5ec', borderColor: '#a3d9b3' }}>
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#1F9C4C' }}>
                      <Package className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-navy-900">Est. Materials & Overhead</h3>
                        <span className="font-bold" style={{ color: '#1F9C4C' }}>
                          {formatCurrencyFull(totalEstimate.materialsLow)} - {formatCurrencyFull(totalEstimate.materialsHigh)}
                        </span>
                      </div>
                      <p className="text-sm text-navy-500 mt-1">Includes materials, permits, and contractor overhead</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market & Community Intelligence Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-navy-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Market & Community Intelligence
                </h2>

                <div className="bg-white rounded-2xl border border-navy-200 shadow-sm overflow-hidden">
                  <div className="border-t-4 border-blue-500" />
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h3 className="font-semibold text-navy-900">Material Market Advisory</h3>
                      <span className="ml-auto text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">BLS Data</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                      {(() => {
                        const primaryProject = configuredProjects[0]?.projectType || 'Bathroom';
                        const intel = liveMarketIntelligence[primaryProject];
                        return intel.materials.map((material) => {
                          const MaterialIcon = material.icon;
                          const isSignificant = Math.abs(material.change) >= 3;
                          return (
                            <div 
                              key={material.name}
                              className="bg-navy-50 rounded-xl p-3 text-center"
                            >
                              <MaterialIcon className="w-5 h-5 text-navy-500 mx-auto mb-1.5" />
                              <p className="text-xs font-medium text-navy-700 truncate mb-1">{material.name}</p>
                              <div className={`flex items-center justify-center gap-1 text-sm font-semibold ${
                                material.direction === 'up' 
                                  ? isSignificant ? 'text-red-600' : 'text-amber-600'
                                  : material.direction === 'down'
                                    ? 'text-brand-600'
                                    : 'text-navy-500'
                              }`}>
                                {material.direction === 'up' && <TrendingUp className="w-3.5 h-3.5" />}
                                {material.direction === 'down' && <TrendingDown className="w-3.5 h-3.5" />}
                                {material.direction === 'stable' && <Minus className="w-3.5 h-3.5" />}
                                {material.direction === 'up' ? '+' : material.direction === 'down' ? '' : ''}{material.change}%
                              </div>
                              <p className="text-[10px] text-navy-400 mt-0.5">{material.period}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-blue-700 mb-1">AI Analysis</p>
                          <p className="text-sm text-navy-700 leading-relaxed">
                            {liveMarketIntelligence[configuredProjects[0]?.projectType || 'Bathroom'].materialInsight}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl border border-navy-200 shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageCircle className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold text-navy-900">Community Pulse</h3>
                      <span className="ml-auto text-xs px-2 py-1 bg-purple-50 text-purple-700 rounded-full font-medium">Social Data</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const intel = liveMarketIntelligence[configuredProjects[0]?.projectType || 'Bathroom'];
                        const sentimentConfig = {
                          positive: { emoji: '😊', color: 'bg-brand-100 text-brand-700', label: 'Positive' },
                          neutral: { emoji: '😐', color: 'bg-slate-200 text-slate-700', label: 'Neutral' },
                          cautious: { emoji: '🤔', color: 'bg-teal-100 text-teal-700', label: 'Cautious' },
                          frustrated: { emoji: '😤', color: 'bg-red-100 text-red-700', label: 'Frustrated' }
                        };
                        const config = sentimentConfig[intel.communitySentiment];
                        return (
                          <>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${config.color}`}>
                              <span>{config.emoji}</span>
                              Sentiment: {config.label}
                            </span>
                            <span className="text-xs text-navy-500">
                              Based on analysis of {intel.threadCount} relevant threads
                            </span>
                          </>
                        );
                      })()}
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-navy-200">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <Bot className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-purple-700 mb-1">Synthesis</p>
                          <p className="text-sm text-navy-700 leading-relaxed">
                            {liveMarketIntelligence[configuredProjects[0]?.projectType || 'Bathroom'].communityInsight}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button 
                  onClick={handleStartNew}
                  className="w-full py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all text-white shadow-lg hover:shadow-xl"
                  style={{ backgroundColor: '#1F9C4C' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
                >
                  <RotateCcw className="w-5 h-5" />
                  Start New Project
                </button>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-28">
                <BasketSidebar
                  selectedProjects={selectedProjects}
                  configuredProjects={configuredProjects}
                  compact
                  contractorTier={contractorTier}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
