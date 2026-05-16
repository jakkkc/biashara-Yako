import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show the install banner prompt on mobile/tablet primarily
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if already installed / standalone
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsVisible(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    await deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`PWA install choice resolved to: ${outcome}`);
    
    // We've used the prompt, and can't use it again
    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && deferredPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 pointer-events-auto"
        >
          {/* Glass Card installation sheet */}
          <div className="glass-card p-5 border-indigo-500/30 flex flex-col gap-4 relative overflow-hidden bg-slate-950/95 shadow-[0_0_30px_rgba(129,140,248,0.2)]">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-emerald-500" />
            
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-start gap-3 mt-1">
              <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                <Download className="h-5 w-5 animate-bounce" />
              </div>
              <div className="flex-1 space-y-0.5">
                <h4 className="text-white font-bold text-sm">
                  Weka Biashara Yako POS
                </h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Add to Home Screen for rapid checkout speeds, offline records, and native full-screen view.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={handleDismiss}
                className="btn-ghost flex-1 py-2 text-xs"
              >
                Leta Baadaye
              </button>
              <button
                onClick={handleInstallClick}
                className="btn-primary flex-1 py-2 text-xs flex items-center justify-center gap-1.5"
              >
                <Download className="h-3.5 w-3.5" /> Weka POS / Install
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default InstallBanner;
