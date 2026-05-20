import { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Banknote, 
  TrendingUp, 
  History, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { collection, query, getDocs, doc, setDoc, where, orderBy, limit, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';

interface Shift {
  id: string;
  userId: string;
  userName: string;
  branchId: string;
  openingFloat: number;
  closingCash?: number;
  expectedCash?: number;
  variance?: number;
  status: 'open' | 'closed';
  openedAt: number;
  closedAt?: number;
}

export default function ShiftsView() {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [pastShifts, setPastShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [floatAmount, setFloatAmount] = useState(0);
  const [closingAmount, setClosingAmount] = useState(0);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchShifts();
    }
  }, [profile?.businessId, profile?.id]);

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, `businesses/${profile?.businessId}/shifts`),
        where('userId', '==', profile?.id),
        orderBy('openedAt', 'desc'),
        limit(10)
      );
      const snapshot = await getDocs(q);
      const shifts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
      
      const active = shifts.find(s => s.status === 'open');
      setActiveShift(active || null);
      setPastShifts(shifts.filter(s => s.status === 'closed'));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenShift = async () => {
    if (!profile?.businessId) return;
    setLoading(true);
    const id = `SHFT-${Date.now()}`;
    const newShift: Shift = {
      id,
      userId: profile.id,
      userName: profile.displayName || 'Unknown',
      branchId: profile.branchId || 'main',
      openingFloat: floatAmount,
      status: 'open',
      openedAt: Date.now()
    };

    try {
      await setDoc(doc(db, `businesses/${profile.businessId}/shifts`, id), newShift);
      setActiveShift(newShift);
      setShowOpenModal(false);
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!profile?.businessId || !activeShift) return;
    setLoading(true);
    
    try {
      // Fetch sales during this shift to calculate expected cash
      const salesQuery = query(
        collection(db, `businesses/${profile.businessId}/sales`),
        where('userId', '==', profile.id),
        where('createdAt', '>=', activeShift.openedAt)
      );
      const salesSnap = await getDocs(salesQuery);
      const shiftSalesTotal = salesSnap.docs.reduce((acc, doc) => acc + (doc.data().total || 0), 0);
      
      const expectedCash = activeShift.openingFloat + shiftSalesTotal;
      const variance = closingAmount - expectedCash;

      const updatedShift: Partial<Shift> = {
        status: 'closed',
        closedAt: Date.now(),
        closingCash: closingAmount,
        expectedCash,
        variance
      };

      await updateDoc(doc(db, `businesses/${profile.businessId}/shifts`, activeShift.id), updatedShift);
      setActiveShift(null);
      setShowCloseModal(false);
      fetchShifts();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  if (loading && !activeShift && pastShifts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gold w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Shift Management</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Operational Duty Cycles & Cash Reconciliation</p>
        </div>
        {!activeShift && (
          <button 
            onClick={() => setShowOpenModal(true)}
            className="px-8 py-3 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gold-light transition-all shadow-xl shadow-gold/10 flex items-center gap-3"
          >
            <Play size={18} fill="currentColor" /> Open New Shift
          </button>
        )}
      </div>

      {activeShift ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-navy-muted p-10 rounded-[40px] border border-gold/20 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-3xl -mr-32 -mt-32 rounded-full" />
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-gold/10 rounded-2xl flex items-center justify-center border border-gold/20">
                       <Clock className="text-gold w-7 h-7" />
                    </div>
                    <div>
                       <span className="px-3 py-1 bg-gold text-navy rounded-full text-[9px] font-black uppercase tracking-widest mb-2 inline-block">Active Duty</span>
                       <h3 className="text-2xl font-black text-white italic tracking-tight">Current Session Running</h3>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Opened At</p>
                       <p className="text-white font-bold">{new Date(activeShift.openedAt).toLocaleTimeString()}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Personnel</p>
                       <p className="text-white font-bold">{activeShift.userName}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Opening Float</p>
                       <p className="text-gold font-black italic">Ksh {activeShift.openingFloat.toLocaleString()}</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Session Duration</p>
                       <p className="text-white font-bold">{Math.floor((Date.now() - activeShift.openedAt) / 60000)} Mins</p>
                    </div>
                 </div>

                 <button 
                   onClick={() => setShowCloseModal(true)}
                   className="w-full h-16 bg-navy border border-slate-800 rounded-[20px] text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                 >
                    <Square size={18} fill="currentColor" /> Terminate Session & Reconcile
                 </button>
              </div>

              <div className="bg-navy-muted p-10 rounded-[40px] border border-slate-800">
                 <h3 className="text-xl font-black text-white italic tracking-tight mb-6">Security Protocol</h3>
                 <div className="flex items-start gap-4 p-6 bg-navy rounded-3xl border border-slate-800/50">
                    <AlertCircle className="text-gold shrink-0 mt-1" size={20} />
                    <p className="text-slate-500 font-bold text-[10px] uppercase leading-relaxed tracking-widest">
                       All shift activities are logged in the enterprise audit ledger. Do not share terminal access during active sessions. ensure cash reconciliation matches terminal values.
                    </p>
                 </div>
              </div>
           </div>

           <div className="space-y-6">
              <div className="bg-gold p-10 rounded-[40px] text-navy relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-2xl -mr-16 -mt-16 rounded-full" />
                 <p className="text-[10px] font-black uppercase tracking-widest mb-2">Live Cash Expectation</p>
                 <h2 className="text-4xl font-black italic tracking-tighter">Calculating...</h2>
                 <p className="text-[10px] font-bold uppercase opacity-60 mt-4 leading-tight">Based on float + real-time terminal sales influx</p>
              </div>
              <div className="bg-navy-muted p-8 rounded-[40px] border border-slate-800">
                 <div className="flex items-center gap-3 mb-6">
                    <History className="text-slate-700" size={20} />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Session History</span>
                 </div>
                 <div className="space-y-4">
                    {pastShifts.slice(0, 3).map(s => (
                       <div key={s.id} className="p-4 bg-navy rounded-2xl border border-slate-800/50 flex items-center justify-between">
                          <div>
                             <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(s.openedAt).toLocaleDateString()}</p>
                             <p className={`text-xs font-black ${s.variance === 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {s.variance === 0 ? 'Balanced' : `Variance: Ksh ${s.variance}`}
                             </p>
                          </div>
                          <ChevronRight size={16} className="text-slate-800" />
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="bg-navy-muted p-20 rounded-[80px] border border-dashed border-slate-800 text-center flex flex-col items-center">
           <div className="w-24 h-24 bg-navy rounded-[32px] border border-slate-800 flex items-center justify-center mb-8">
              <Square size={40} className="text-slate-800" />
           </div>
           <h2 className="text-3xl font-black text-white italic tracking-tighter mb-4">No Active Session</h2>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-sm leading-relaxed mb-10">
              Your terminal is currently offline. You must open a new shift and provide an opening float to initialize the enterprise POS engine.
           </p>
           <button 
             onClick={() => setShowOpenModal(true)}
             className="px-10 py-5 bg-gold text-navy rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gold/20 hover:scale-105 transition-all flex items-center gap-4"
           >
              Initialize Session <ArrowRight size={20} strokeWidth={3} />
           </button>
        </div>
      )}

      {/* Opening Modal */}
      <AnimatePresence>
        {showOpenModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOpenModal(false)} className="absolute inset-0 bg-navy/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl">
               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <Banknote className="text-gold w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">Opening Float</h3>
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-1">Input initial capital for session start</p>
               </div>
               <div className="space-y-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Currency Quantum (KES)</label>
                     <input 
                       type="number" 
                       value={floatAmount}
                       onChange={(e) => setFloatAmount(Number(e.target.value))}
                       className="w-full h-20 bg-navy border border-slate-800 rounded-3xl text-center text-white font-black text-3xl focus:border-gold outline-none transition-all"
                     />
                  </div>
                  <button 
                    onClick={handleOpenShift}
                    className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gold-light transition-all flex items-center justify-center gap-3"
                  >
                     Authorize Deployment <Play size={18} fill="currentColor" />
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Closing Modal */}
      <AnimatePresence>
        {showCloseModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCloseModal(false)} className="absolute inset-0 bg-navy/80 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative w-full max-w-sm bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl">
               <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                     <Square className="text-red-500 w-8 h-8" fill="currentColor" />
                  </div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight">Shift Reconciliation</h3>
                  <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mt-1">Input final physical cash in drawer</p>
               </div>
               <div className="space-y-6">
                  <div>
                     <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 text-center">Closing Cash (KES)</label>
                     <input 
                       type="number" 
                       value={closingAmount}
                       onChange={(e) => setClosingAmount(Number(e.target.value))}
                       className="w-full h-20 bg-navy border border-slate-800 rounded-3xl text-center text-white font-black text-3xl focus:border-red-500 outline-none transition-all"
                     />
                  </div>
                  <button 
                    onClick={handleCloseShift}
                    className="w-full h-16 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-all flex items-center justify-center gap-3"
                  >
                     Finalize Reconcile <CheckCircle2 size={18} />
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
