import { useState } from 'react';
import { X, MessageSquare, Send, CheckCircle } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === null) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, feedback }),
      });

      if (response.ok) {
        setIsSubmitted(true);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTimeout(() => {
      setRating(null);
      setFeedback('');
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
            <MessageSquare className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Share Your Feedback</h2>
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
                Thank you for your feedback!
              </h3>
              <p style={{ color: '#555' }}>We appreciate it.</p>
              <button
                onClick={handleClose}
                className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                style={{ color: '#333' }}
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question 1: Likert Scale */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#333' }}>
                  How likely are you to recommend RemodelerIQ to family and friends?
                </label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: '#555' }}>Not likely</span>
                  <span className="text-xs" style={{ color: '#555' }}>Extremely likely</span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRating(num)}
                      className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        rating === num
                          ? 'text-white shadow-md scale-105'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                      style={rating === num ? { backgroundColor: '#1F9C4C' } : { color: '#555' }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 2: Open Text */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#333' }}>
                  Please tell us more about your experience and how we could improve it.
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Share your thoughts..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 resize-none"
                  style={{ color: '#333' }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={rating === null || isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
                style={{ backgroundColor: rating === null || isSubmitting ? undefined : '#1F9C4C' }}
                onMouseEnter={(e) => { if (rating !== null && !isSubmitting) e.currentTarget.style.backgroundColor = '#1a8a42'; }}
                onMouseLeave={(e) => { if (rating !== null && !isSubmitting) e.currentTarget.style.backgroundColor = '#1F9C4C'; }}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Submitting...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback
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
