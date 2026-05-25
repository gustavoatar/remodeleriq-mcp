import { useState } from 'react';
import { X, Flag, Send, CheckCircle, ChevronDown } from 'lucide-react';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SECTION_OPTIONS = [
  { value: 'bid-analysis', label: 'Bid Analysis' },
  { value: 'market-analysis', label: 'Market Analysis' },
  { value: 'negotiation-recommendation', label: 'Negotiation Recommendation' },
];

export default function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
  const [section, setSection] = useState('');
  const [issue, setIssue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!section || !issue.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/report-issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, issue }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit issue:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTimeout(() => {
      setSection('');
      setIssue('');
      setIsSubmitted(false);
    }, 300);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: '#1F9C4C' }}>
          <div className="flex items-center gap-2 text-white">
            <Flag className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Report an Issue</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: '#333' }}>
                Issue Reported
              </h3>
              <p style={{ color: '#555' }}>Thank you for helping us improve!</p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                style={{ color: '#333' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Section Dropdown */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
                  Select Section
                </label>
                <div className="relative">
                  <select
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 appearance-none cursor-pointer"
                    style={{ color: '#333' }}
                  >
                    <option value="" disabled>Choose a section...</option>
                    {SECTION_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Issue Text */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
                  Tell us about your issue
                </label>
                <textarea
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  rows={5}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
                  style={{ color: '#333' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!section || !issue.trim() || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: (!section || !issue.trim() || isSubmitting) ? undefined : '#1F9C4C' }}
                onMouseEnter={(e) => { if (section && issue.trim() && !isSubmitting) e.currentTarget.style.backgroundColor = '#1a8a42'; }}
                onMouseLeave={(e) => { if (section && issue.trim() && !isSubmitting) e.currentTarget.style.backgroundColor = '#1F9C4C'; }}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Issue
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
