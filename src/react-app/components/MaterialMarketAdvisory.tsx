import { useMemo, useState, useEffect, useCallback } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  BarChart3, 
  AlertTriangle, 
  TrendingDown, 
  Sparkles,
  Info,
  Calendar,
  Lightbulb,
  TreePine,
  Square,
  Paintbrush,
  LayoutGrid,
  Blocks,
  Pipette,
  Zap,
  TrendingUp,
  Minus,
  RefreshCw,
  Database
} from 'lucide-react';
import {
  analyzeMaterialTrends,
  generateMarketSummary,
  getChartConfig,
  formatPercentage,
  getSeasonalAlert,
  SOURCING_TIP,
  MATERIAL_DATA,
  HISTORY_MONTHS,
  type MaterialTrend,
  type MarketSummary,
  type ProjectType,
  type SeasonalAlert,
  type MaterialKey
} from '@/shared/materialMarketEngine';

// Icon mapping for dynamic icon rendering
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TreePine,
  Square,
  Paintbrush,
  LayoutGrid,
  Blocks,
  Pipette,
  Zap
};

interface PPIApiResponse {
  success: boolean;
  source: 'cache' | 'cache-stale' | 'fallback' | 'error';
  data: Record<string, { current: number; baseline: number; history: number[] }> | null;
  lastRefresh: string | null;
  needsRefresh: boolean;
  hasApiKey: boolean;
  message?: string;
}

interface MaterialMarketAdvisoryProps {
  projectType?: ProjectType | string;
  className?: string;
}

/**
 * Material Market Advisory Card
 * 
 * Displays BLS PPI data for construction materials with:
 * - Beautiful multi-line trend chart
 * - Square cards with icons for each material
 * - AI-synthesized market summary
 * - Seasonal volatility alerts
 * - Real-time BLS data with monthly caching
 */
export default function MaterialMarketAdvisory({ 
  projectType = 'general',
  className = ''
}: MaterialMarketAdvisoryProps) {
  const [apiData, setApiData] = useState<PPIApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch PPI data from API
  const fetchPPIData = useCallback(async () => {
    try {
      const res = await fetch('/api/ppi/materials');
      const data = await res.json() as PPIApiResponse;
      setApiData(data);
    } catch (error) {
      console.error('Failed to fetch PPI data:', error);
      setApiData({ 
        success: false, 
        source: 'fallback', 
        data: null, 
        lastRefresh: null, 
        needsRefresh: true,
        hasApiKey: false
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPPIData();
  }, [fetchPPIData]);

  // Merge API data with fallback data
  const mergedMaterialData = useMemo(() => {
    if (!apiData?.data) return MATERIAL_DATA;

    const merged = { ...MATERIAL_DATA };
    for (const [key, liveData] of Object.entries(apiData.data)) {
      if (merged[key as MaterialKey]) {
        merged[key as MaterialKey] = {
          ...merged[key as MaterialKey],
          current: liveData.current,
          baseline: liveData.baseline,
          history: liveData.history.length >= 12 ? liveData.history : merged[key as MaterialKey].history
        };
      }
    }
    return merged;
  }, [apiData]);

  // Generate dynamic month labels based on actual data
  const monthLabels = useMemo(() => {
    if (!apiData?.data) return HISTORY_MONTHS;
    
    // Generate last 12 months from current date
    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push(monthStr);
    }
    return months;
  }, [apiData]);

  // Use merged data for analysis
  const trends = useMemo(() => {
    // Temporarily override MATERIAL_DATA for analysis
    const originalData = { ...MATERIAL_DATA };
    Object.assign(MATERIAL_DATA, mergedMaterialData);
    const result = analyzeMaterialTrends(projectType);
    Object.assign(MATERIAL_DATA, originalData);
    return result;
  }, [projectType, mergedMaterialData]);

  const summary = useMemo(() => generateMarketSummary(trends), [trends]);
  const seasonalAlert = useMemo(() => getSeasonalAlert(trends, new Date()), [trends]);
  
  const chartData = useMemo(() => {
    const materials = trends.map(t => t.material);
    return monthLabels.map((month, index) => {
      const dataPoint: Record<string, string | number> = { month };
      materials.forEach(material => {
        const key = material.name.toLowerCase().replace(/\s+/g, '');
        dataPoint[key] = material.history[index] || 0;
      });
      return dataPoint;
    });
  }, [trends, monthLabels]);

  const chartConfig = useMemo(() => getChartConfig(projectType), [projectType]);

  // Determine data source label
  const dataSourceLabel = useMemo(() => {
    if (!apiData) return 'Loading...';
    if (apiData.source === 'cache') return 'Live BLS Data';
    if (apiData.source === 'cache-stale') return 'Cached (Stale)';
    return 'Representative Data';
  }, [apiData]);

  const lastRefreshFormatted = useMemo(() => {
    if (!apiData?.lastRefresh) return null;
    const date = new Date(apiData.lastRefresh);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }, [apiData]);

  return (
    <div className={`bg-white rounded-2xl shadow-sm overflow-hidden ${className}`}>
      {/* Gradient top border */}
      <div className="h-1 bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-500" />
      
      {/* Header */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Materials Market Pulse
              </h3>
              <p className="text-gray-500 text-sm">Price trends for your project materials</p>
            </div>
          </div>
          

        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : (
          <>
            {/* PPI Trend Chart */}
            <PPITrendChart chartData={chartData} chartConfig={chartConfig} />

            {/* Material Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {trends.map((trend) => (
                <MaterialCard key={trend.material.seriesId} trend={trend} />
              ))}
            </div>

            {/* Seasonal Alert */}
            {seasonalAlert.isActive && (
              <SeasonalAlertCard alert={seasonalAlert} />
            )}

            {/* AI Summary */}
            <AISummaryCard summary={summary} />

            {/* Sourcing Tip */}
            <SourcingTipFooter />

            {/* Attribution */}
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                <Database className="w-3 h-3" />
                <span>
                  Data source:{' '}
                  <a 
                    href="https://www.bls.gov/ppi/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    Bureau of Labor Statistics PPI
                  </a>
                  {' • '}
                  <span className={apiData?.source === 'cache' ? 'text-emerald-500 font-medium' : ''}>
                    {dataSourceLabel}
                  </span>
                  {lastRefreshFormatted && (
                    <span className="text-gray-300"> • Last updated {lastRefreshFormatted}</span>
                  )}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * PPI Trend Line Chart
 */
function PPITrendChart({ 
  chartData, 
  chartConfig 
}: { 
  chartData: Record<string, string | number>[];
  chartConfig: ReturnType<typeof getChartConfig>;
}) {
  const [timeRange, setTimeRange] = useState<1 | 3 | 6 | 12>(12);
  
  // Filter chart data based on selected time range
  const filteredChartData = useMemo(() => {
    return chartData.slice(-timeRange);
  }, [chartData, timeRange]);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-4 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-500" />
          {timeRange}-Month PPI Trend
        </h4>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(Number(e.target.value) as 1 | 3 | 6 | 12)}
          className="text-xs font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-gray-600 cursor-pointer hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-colors"
        >
          <option value={12}>12 months</option>
          <option value={6}>6 months</option>
          <option value={3}>3 months</option>
          <option value={1}>1 month</option>
        </select>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={filteredChartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis 
              dataKey="month" 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
            />
            <YAxis 
              tick={{ fontSize: 11, fill: '#6B7280' }}
              tickLine={false}
              axisLine={{ stroke: '#E5E7EB' }}
              width={45}
              tickFormatter={(value) => value.toFixed(0)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white',
                border: '1px solid #E5E7EB',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px'
              }}
              formatter={(value, name) => {
                const config = chartConfig.find(c => c.key === name);
                const displayValue = typeof value === 'number' ? value.toFixed(1) : value;
                return [displayValue, config?.name || name];
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              formatter={(value) => {
                const config = chartConfig.find(c => c.key === value);
                return config?.name || value;
              }}
            />
            {chartConfig.map((config) => (
              <Line
                key={config.key}
                type="monotone"
                dataKey={config.key}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: 'white' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/**
 * Material Square Card with Icon
 */
function MaterialCard({ trend }: { trend: MaterialTrend }) {
  const { material, percentage, status } = trend;
  const isSurge = status.status === 'Surge';
  const isDrop = status.status === 'Drop';
  
  // Get the icon component
  const IconComponent = ICON_MAP[material.icon] || Square;
  
  // Determine trend icon
  const TrendIcon = percentage > 2 ? TrendingUp : percentage < -2 ? TrendingDown : Minus;
  
  return (
    <div 
      className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
        isSurge 
          ? 'bg-red-50 border-red-200 hover:border-red-300' 
          : isDrop 
          ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
          : 'bg-white border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Icon */}
      <div 
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
          isSurge 
            ? 'bg-red-100' 
            : isDrop 
            ? 'bg-emerald-100'
            : 'bg-gray-100'
        }`}
        style={{ 
          backgroundColor: !isSurge && !isDrop ? `${material.color}15` : undefined 
        }}
      >
        <div style={{ color: isSurge ? '#DC2626' : isDrop ? '#059669' : material.color }}>
          <IconComponent className="w-5 h-5" />
        </div>
      </div>
      
      {/* Material Name */}
      <h5 className={`text-sm font-semibold mb-1 ${
        isSurge ? 'text-red-800' : isDrop ? 'text-emerald-800' : 'text-gray-900'
      }`}>
        {material.name}
      </h5>
      
      {/* Percentage Change */}
      <div className="flex items-center gap-1">
        <TrendIcon 
          className={`w-3.5 h-3.5 ${
            isSurge ? 'text-red-500' : isDrop ? 'text-emerald-500' : 'text-gray-400'
          }`} 
        />
        <span 
          className={`text-lg font-bold tabular-nums ${
            isSurge ? 'text-red-600' : isDrop ? 'text-emerald-600' : 'text-gray-700'
          }`}
        >
          {formatPercentage(percentage)}
        </span>
      </div>
      
      {/* Status Badge */}
      <span 
        className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
          isSurge 
            ? 'bg-red-200 text-red-700' 
            : isDrop 
            ? 'bg-emerald-200 text-emerald-700'
            : status.status === 'Rise'
            ? 'bg-teal-100 text-teal-700'
            : 'bg-gray-100 text-gray-600'
        }`}
      >
        {status.status}
      </span>
    </div>
  );
}

/**
 * Seasonal Alert Card
 */
function SeasonalAlertCard({ alert }: { alert: SeasonalAlert }) {
  return (
    <div className="rounded-xl p-4 border bg-emerald-50 border-emerald-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Calendar className="w-5 h-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          <span className="text-sm font-semibold text-emerald-800">
            ⏰ {alert.message}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * AI Summary Card
 */
function AISummaryCard({ summary }: { summary: MarketSummary }) {
  const config = {
    alert: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
      titleColor: 'text-red-800',
      textColor: 'text-red-700'
    },
    opportunity: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      icon: <TrendingDown className="w-5 h-5 text-emerald-500" />,
      titleColor: 'text-emerald-800',
      textColor: 'text-emerald-700'
    },
    observation: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      titleColor: 'text-blue-800',
      textColor: 'text-blue-700'
    }
  };

  const style = config[summary.type];

  return (
    <div className={`rounded-xl p-4 border ${style.bg} ${style.border}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {style.icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className={`text-sm font-semibold ${style.titleColor}`}>
              AI Market Synthesis
            </span>
          </div>
          <p className={`text-sm leading-relaxed ${style.textColor}`}>
            {summary.message}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Sourcing Tip Footer
 */
function SourcingTipFooter() {
  return (
    <div className="rounded-xl p-4 bg-gradient-to-br from-slate-50 to-gray-50 border border-slate-200">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Sourcing Tip
          </span>
          <p className="text-sm text-slate-700 mt-1 leading-relaxed">
            {SOURCING_TIP}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact version for sidebars
 */
export function MaterialMarketAdvisoryCompact({ 
  projectType = 'general',
  className = ''
}: MaterialMarketAdvisoryProps) {
  const trends = useMemo(() => analyzeMaterialTrends(projectType), [projectType]);
  const summary = useMemo(() => generateMarketSummary(trends), [trends]);
  const seasonalAlert = useMemo(() => getSeasonalAlert(trends), [trends]);

  const noteworthyTrends = trends.filter(
    t => t.status.status === 'Surge' || t.status.status === 'Drop'
  );

  if (noteworthyTrends.length === 0 && !seasonalAlert.isActive) {
    return null;
  }

  return (
    <div className={`bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 ${className}`}>
      <div className="h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500" />
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-500" />
          Material Alerts
        </h4>
        
        {noteworthyTrends.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            {noteworthyTrends.map((trend) => {
              const IconComponent = ICON_MAP[trend.material.icon] || Square;
              return (
                <div 
                  key={trend.material.seriesId}
                  className={`flex items-center gap-2 p-2 rounded-lg ${trend.status.bgClass}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <div className="flex-1 min-w-0">
                    <span className={`text-xs block truncate ${
                      trend.status.status === 'Surge' ? 'font-bold text-red-700' : 'font-medium text-gray-700'
                    }`}>
                      {trend.material.name}
                    </span>
                    <span className={`text-sm font-bold ${trend.status.textClass}`}>
                      {formatPercentage(trend.percentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {seasonalAlert.isActive && (
          <p className="text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg mb-3">
            ⏰ {seasonalAlert.message}
          </p>
        )}

        <p className={`text-xs ${
          summary.type === 'alert' ? 'text-red-600' : 
          summary.type === 'opportunity' ? 'text-emerald-600' : 
          'text-gray-500'
        }`}>
          {summary.message}
        </p>
      </div>
    </div>
  );
}
