import { Package, DollarSign, Hash } from 'lucide-react';
import { type UnitDetectionResult } from '@/shared/unitDetection';

interface UnitCountCardProps {
  unitDetection: UnitDetectionResult;
  className?: string;
}

export default function UnitCountCard({ unitDetection, className = '' }: UnitCountCardProps) {
  if (unitDetection.items.length === 0) {
    return null;
  }

  const itemsWithPricing = unitDetection.items.filter(item => item.pricePerUnit !== undefined);
  const totalValue = itemsWithPricing.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${className}`}>
      {/* Header - Black */}
      <div className="bg-black px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-white font-semibold">Unit Count Breakdown</h3>
              <p className="text-white/70 text-xs mt-0.5">{unitDetection.summary}</p>
            </div>
          </div>
          <div className="bg-white/20 px-3 py-1.5 rounded-full">
            <span className="text-white font-bold text-sm">{unitDetection.totalUnits} Units</span>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="p-5">
        <div className="space-y-3">
          {unitDetection.items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <Hash className="w-5 h-5 text-slate-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">
                      {item.quantity} {item.description}
                    </p>
                    {item.confidence === 'high' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 truncate">{item.matchedText}</p>
                </div>
              </div>
              
              {item.pricePerUnit && (
                <div className="text-right ml-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <DollarSign className="w-4 h-4" />
                    <span>{item.pricePerUnit.toLocaleString()}</span>
                    <span className="text-xs text-gray-500">each</span>
                  </div>
                  {item.totalPrice && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      = ${item.totalPrice.toLocaleString()} total
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        {unitDetection.hasUnitPricing && totalValue > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Itemized Total ({itemsWithPricing.length} {itemsWithPricing.length === 1 ? 'item' : 'items'})
              </span>
              <span className="text-lg font-bold text-slate-800">
                ${totalValue.toLocaleString()}
              </span>
            </div>
          </div>
        )}

        {/* Insight */}
        {unitDetection.items.length > 0 && !unitDetection.hasUnitPricing && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Tip:</strong> Ask for per-unit pricing breakdowns to better understand costs and compare with other quotes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
