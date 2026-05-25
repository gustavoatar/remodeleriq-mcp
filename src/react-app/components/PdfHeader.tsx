import { FileText, Calendar, Shield } from 'lucide-react';

interface PdfHeaderProps {
  projectType?: string;
  bidTotal?: number;
  contractorName?: string;
}

export function PdfHeader({ projectType, bidTotal, contractorName }: PdfHeaderProps) {
  const dateStr = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatProjectType = (type: string) => {
    return type
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <div className="pdf-header hidden print:block mb-8 pb-6 border-b-2 border-emerald-500">
      {/* Logo & Title Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">RemodelerIQ</h1>
            <p className="text-sm text-slate-500">Bid Analysis Report</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          {dateStr}
        </div>
      </div>

      {/* Project Summary Row */}
      <div className="flex items-center gap-6 text-sm">
        {projectType && (
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            <span className="text-slate-600">Project:</span>
            <span className="font-medium text-slate-900">{formatProjectType(projectType)}</span>
          </div>
        )}
        {bidTotal && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Bid Amount:</span>
            <span className="font-semibold text-slate-900">{formatCurrency(bidTotal)}</span>
          </div>
        )}
        {contractorName && (
          <div className="flex items-center gap-2">
            <span className="text-slate-600">Contractor:</span>
            <span className="font-medium text-slate-900">{contractorName}</span>
          </div>
        )}
      </div>
    </div>
  );
}
