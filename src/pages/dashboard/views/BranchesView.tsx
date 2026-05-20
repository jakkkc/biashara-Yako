import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Plus, 
  MoreVertical, 
  Users, 
  TrendingUp, 
  Settings,
  Trash2,
  Edit2,
  Store,
  Loader2
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';
import { Branch } from '../../../types';

export default function BranchesView() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newBranch, setNewBranch] = useState({ name: '', location: '', code: '' });
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchBranches();
    }
  }, [profile?.businessId]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, `businesses/${profile?.businessId}/branches`));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBranch = async () => {
    if (!profile?.businessId || !newBranch.name) return;
    setLoading(true);
    const id = `BR-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    try {
      await setDoc(doc(db, `businesses/${profile.businessId}/branches`, id), {
        ...newBranch,
        id,
        businessId: profile.businessId,
        createdAt: Date.now(),
        active: true
      });
      setIsAdding(false);
      fetchBranches();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const deleteBranch = async (id: string) => {
    if (!window.confirm('Delete this operational hub? All related staff and inventory mappings will be orphaned.')) return;
    try {
       await deleteDoc(doc(db, `businesses/${profile?.businessId}/branches`, id));
       setBranches(prev => prev.filter(b => b.id !== id));
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <div className="animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div>
           <h1 className="text-4xl font-black text-white italic tracking-tighter mb-2">Operational Hubs</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Managing enterprise coverage and branch scaling</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-14 px-8 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/10 hover:bg-gold-light transition-all"
        >
          Deploy New Hub <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {loading && branches.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center gap-4">
           <Loader2 className="animate-spin text-gold w-10 h-10" />
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning network...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {branches.map(branch => (
              <motion.div 
                key={branch.id} 
                layout
                className="bg-navy-muted rounded-[40px] p-8 border border-slate-800 shadow-xl group hover:border-gold/30 transition-all relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all" />
                 
                 <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center text-gold border border-slate-800 shadow-inner group-hover:scale-110 transition-transform">
                       <Store size={28} strokeWidth={2} />
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => deleteBranch(branch.id)} className="p-3 bg-navy border border-slate-800 rounded-xl text-slate-600 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                 </div>

                 <div className="relative z-10">
                    <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1.5">{branch.location}</p>
                    <h3 className="text-2xl font-black text-white italic tracking-tighter mb-6">{branch.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                       <div className="p-4 bg-navy border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-2 text-slate-500 mb-1">
                             <Users size={12} />
                             <span className="text-[10px] uppercase font-black tracking-widest">Operatives</span>
                          </div>
                          <p className="text-lg font-black text-white">0</p>
                       </div>
                       <div className="p-4 bg-navy border border-slate-800 rounded-2xl">
                          <div className="flex items-center gap-2 text-gold mb-1">
                             <TrendingUp size={12} />
                             <span className="text-[10px] uppercase font-black tracking-widest">Growth</span>
                          </div>
                          <p className="text-lg font-black text-white">Steady</p>
                       </div>
                    </div>

                    <button className="w-full py-4 bg-navy border border-slate-800 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-[0.2em] hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-2">
                       Enter Dashboard <ArrowRight size={14} strokeWidth={3} />
                    </button>
                 </div>
              </motion.div>
           ))}

           {branches.length === 0 && !loading && (
             <div className="col-span-full py-20 flex flex-col items-center justify-center text-center">
                <div className="w-24 h-24 bg-navy-muted rounded-full flex items-center justify-center border border-slate-800 mb-6 text-slate-700">
                   <MapPin size={40} />
                </div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2">No Active Hubs</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-xs leading-relaxed">
                   Your enterprise network is currently empty. Deploy your first operational branch to begin scaling.
                </p>
             </div>
           )}
        </div>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[40px] p-10 shadow-2xl"
            >
              <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">Deploy Operational Hub</h3>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-10">Initializing a new territory in your enterprise network</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Hub Designation (Name)</label>
                  <input 
                    type="text" 
                    value={newBranch.name}
                    onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                    placeholder="e.g. Nairobi CBD Main"
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Geographic Territory</label>
                  <input 
                    type="text" 
                    value={newBranch.location}
                    onChange={(e) => setNewBranch({...newBranch, location: e.target.value})}
                    placeholder="e.g. Westlands, Lower Kabete"
                    className="w-full h-16 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all font-bold"
                  />
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="flex-1 h-14 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={handleAddBranch}
                    disabled={loading || !newBranch.name}
                    className="flex-[2] h-14 bg-gold text-navy rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-gold/10 disabled:opacity-30"
                  >
                    Confirm Deployment
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
