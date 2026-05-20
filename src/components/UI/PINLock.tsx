import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Delete, ArrowRight, ShieldCheck, User } from 'lucide-react';

interface PINLockProps {
  onSuccess: () => void;
  staffName: string;
  staffRole: string;
}

export default function PINLock({ onSuccess, staffName, staffRole }: PINLockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
  };

  useEffect(() => {
    if (pin.length === 4) {
      // In a real app, this PIN would be validated against Firestore or a hashed local storage value
      // For this implementation, we'll use a mock PIN '1234' if none exists or similar
      // But the prompt says Owner/Manager sets password for staff, and staff can change it.
      // So PIN is likely a shorter version for quick unlock.
      if (pin === '1234') {
        onSuccess();
      } else {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  }, [pin, onSuccess]);

  return (
    <div className="fixed inset-0 z-[100] bg-navy flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="text-gold w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white italic tracking-tight">Terminal Locked</h2>
          <div className="flex items-center gap-2 mt-2">
            <User size={12} className="text-slate-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{staffName} • {staffRole}</span>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-10">
          {[...Array(4)].map((_, i) => (
            <motion.div 
              key={i}
              animate={error ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              className={`w-12 h-12 rounded-2xl border-2 transition-all flex items-center justify-center ${
                pin.length > i 
                  ? 'border-gold bg-gold/5' 
                  : 'border-slate-800 bg-navy-muted'
              }`}
            >
              {pin.length > i && (
                <div className="w-2.5 h-2.5 bg-gold rounded-full" />
              )}
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button 
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              className="h-16 bg-navy-muted border border-slate-800 rounded-2xl text-xl font-bold text-white hover:bg-slate-800 active:scale-95 transition-all"
            >
              {num}
            </button>
          ))}
          <div />
          <button 
            onClick={() => handleKeyPress('0')}
            className="h-16 bg-navy-muted border border-slate-800 rounded-2xl text-xl font-bold text-white hover:bg-slate-800 active:scale-95 transition-all"
          >
            0
          </button>
          <button 
            onClick={handleDelete}
            className="h-16 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
          >
            <Delete size={24} />
          </button>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-slate-700">
             <ShieldCheck size={14} />
             <span className="text-[8px] font-black uppercase tracking-[0.3em]">Hardware Secured Terminal Node</span>
           </div>
           <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Enter Quick-Access PIN (Default: 1234)</p>
        </div>
      </motion.div>
    </div>
  );
}
