/**
 * ConfidenceIndicator - Reusable component showing data confidence level
 * Used across Price Analysis, Market Comparison, and other data-driven cards
 */

import { useMemo } from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

interface ConfidenceIndicatorProps {
  level: ConfidenceLevel;
  reason?: string;
  compact?: boolean;
  showDescription?: boolean;
}

export function ConfidenceIndicator({ 
  level, 
  reason, 
  compact = false,
  showDescription = true 
}: ConfidenceIndicatorProps) {
  const config = useMemo(() => {
    switch (level) {
      case 'high':
        return {
          label: 'High Confidence',
          description: reason || 'Based on verified local market data',
          color: 'text-emerald-700',
          bg: 'bg-emerald-50',
          dotColor: 'bg-emerald-500',
          icon: ShieldCheck,
          dots: 3
        };
      case 'medium':
        return {
          label: 'Medium Confidence',
          description: reason || 'Based on regional averages',
          color: 'text-amber-700',
          bg: 'bg-amber-50',
          dotColor: 'bg-amber-500',
          icon: Shield,
          dots: 2
        };
      case 'low':
        return {
          label: 'Low Confidence',
          description: reason || 'Limited data - using national averages',
          color: 'text-slate-600',
          bg: 'bg-slate-50',
          dotColor: 'bg-slate-400',
          icon: ShieldAlert,
          dots: 1
        };
    }
  }, [level, reason]);

  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full ${config.bg}`}>
        <Icon className={`w-3 h-3 ${config.color}`} />
        <span className={`text-[10px] font-medium ${config.color}`}>
          {config.label}
        </span>
        <div className="flex items-center gap-0.5">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`w-1.5 h-1.5 rounded-full ${
                i < config.dots ? config.dotColor : 'bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between p-2.5 rounded-lg ${config.bg}`}>
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${config.color}`} />
        <div>
          <span className={`text-xs font-medium ${config.color}`}>
            {config.label}
          </span>
          {showDescription && (
            <p className="text-[10px] text-slate-500 mt-0.5 max-w-[200px]">
              {config.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all ${
              i < config.dots ? config.dotColor : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default ConfidenceIndicator;
