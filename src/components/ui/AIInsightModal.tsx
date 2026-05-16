import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, BrainCircuit, RefreshCw } from 'lucide-react';

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  insight: string | null;
  loading: boolean;
  title?: string;
  onRefresh?: () => void;
}

export const AIInsightModal: React.FC<AIInsightModalProps> = ({
  isOpen,
  onClose,
  insight,
  loading,
  title = 'Smart System Insight / Ushauri wa Kiotomatiki',
  onRefresh
}) => {
  const [displayedText, setDisplayedText] = useState('');

  // Typing effect when insight is available
  useEffect(() => {
    if (!insight) {
      setDisplayedText('');
      return;
    }

    setDisplayedText('');
    let i = 0;
    const interval = setInterval(() => {
      setDisplayedText((prev) => prev + insight.charAt(i));
      i++;
      if (i >= insight.length) {
        clearInterval(interval);
      }
    }, 12); // Speed of 12ms per character

    return () => clearInterval(interval);
  }, [insight]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col max-h-[85vh] overflow-hidden z-10"
          >
            {/* Glowing Header */}
            <div className="flex items-center justify-between border-b border-indigo-500/20 p-5 px-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 relative">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-400 to-transparent" />
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-6 w-6 text-indigo-400 animate-pulse" />
                <h3 className="text-lg font-bold tracking-wide text-white flex items-center gap-1.5">
                  {title} <Sparkles className="h-4 w-4 text-amber-400 text-xs" />
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {onRefresh && !loading && (
                  <button
                    onClick={onRefresh}
                    className="p-1.5 rounded-lg bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/20 text-indigo-300 transition"
                    title="Regenerate Insights"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-white transition p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content body */}
            <div className="overflow-y-auto p-6 md:p-8 bg-slate-950/40 text-slate-100 flex-1">
              {loading ? (
                <div className="flex flex-col gap-5 py-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-400" />
                    <span className="text-sm font-mono text-indigo-300 tracking-wider">
                      Smart diagnostics performing analytics... (Inachambua...)
                    </span>
                  </div>
                  {/* Shimmer loading skeletons */}
                  <div className="space-y-3.5">
                    <div className="h-4 w-3/4 bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-full bg-slate-800 rounded animate-pulse" />
                    <div className="h-4 w-5/6 bg-slate-800 rounded animate-pulse" />
                    <div className="h-24 w-full bg-slate-800/50 rounded-lg animate-pulse mt-4 border border-indigo-500/5" />
                  </div>
                </div>
              ) : (
                <div className="prose prose-invert max-w-none text-slate-200 font-sans leading-relaxed text-sm md:text-base selection:bg-indigo-500/40 whitespace-pre-line">
                  {displayedText || 'Analysis complete. Displaying results...'}
                </div>
              )}
            </div>

            {/* Spark Slogan Footer */}
            <div className="border-t border-indigo-500/10 p-4 px-6 bg-slate-900 flex items-center justify-between text-xs text-indigo-400/80 font-semibold tracking-wide">
              <span>Biashara Yako Smart Diagnostics</span>
              <span className="flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full text-[10px] uppercase">
                ✨ Automated Diagnostics
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default AIInsightModal;
