import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 glass border border-red-500/30 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl shadow-red-500/20 z-[100]"
        >
          <WifiOff className="w-5 h-5 text-red-400" />
          <span className="text-sm font-medium">You are offline. Offline orders will sync when back online.</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
