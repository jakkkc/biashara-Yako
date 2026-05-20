import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Loader2,
  ArrowRight
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { Branch } from '../../../types';

export default function BranchesView() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [newBranch, setNewBranch] = useState({ name: '', location: '', code: '' });
  const { profile, switchBranch } = useAuth();
  const [counts, setCounts] = useState<Record<string, number>>({});
  const navigate = useNavigate();

  useEffect(() => {
    if (profile?.businessId) {
      fetchBranches();
      fetchPersonnelCounts();
    } else if (!loading && !profile) {
      setLoading(false);
    }
  }, [profile?.businessId]);

  const handleEditBranch = async () => {
    if (!profile?.businessId || !editingBranch) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, `businesses/${profile.businessId}/branches`, editingBranch.id), {
        name: editingBranch.name,
        location: editingBranch.location,
      });
      setEditingBranch(null);
      fetchBranches();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const fetchPersonnelCounts = async () => {
    try {
      const q = query(collection(db, 'users'), where('businessId', '==', profile?.businessId));
      const snap = await getDocs(q);
      const mapping: Record<string, number> = {};
      snap.docs.forEach(d => {
        const bId = d.data().branchId || 'main';
        mapping[bId] = (mapping[bId] || 0) + 1;
      });
      setCounts(mapping);
    } catch (error) {
      console.error(error);
    }
  };

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
      setNewBranch({ name: '', location: '', code: '' });
      fetchBranches();
    } catch (error) {
       console.error(error);
    } finally {
       setLoading(false);
    }
  };

  const deleteBranch = async (id: string, name: string) => {
    if (!window.confirm(`Decommission hub "${name}"? Personnel and inventory mappings will be archived.`)) return;
    try {
       await deleteDoc(doc(db, `businesses/${profile?.businessId}/branches`, id));
       setBranches(prev => prev.filter(b => b.id !== id));
    } catch (error) {
       console.error(error);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
        <div className="space-y-1">
           <div className="inline-flex items-center gap-2 px-3 py-1 bg-gold/10 border border-gold/20 rounded-full text-gold text-[8px] font-black uppercase tracking-widest mb-2">
             <Settings size={10} className="animate-spin-slow" /> Enterprise Network Management
           </div>
           <h1 className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter mb-2">Operational Hubs</h1>
           <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Strategic deployment and multi-territory coordination</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="h-14 px-8 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/10 hover:bg-gold-light transition-all active:scale-95 translate-y-0 hover:-translate-y-1 duration-300"
        >
          Deploy Intelligence Hub <Plus size={18} strokeWidth={3} />
        </button>
      </div>

      {loading && branches.length === 0 ? (
        <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
           <div className="relative">
              <div className="absolute inset-0 bg-gold/20 blur-3xl animate-pulse" />
              <Loader2 className="animate-spin text-gold w-16 h-16 relative z-10" strokeWidth={1.5} />
           </div>
           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] animate-pulse">Syncing Hub Matrix...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {branches.map(branch => {
              const isActive = profile?.branchId === branch.id;
              const staffCount = counts[branch.id] || 0;
              
              return (
                <motion.div 
                  key={branch.id} 
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  className={`bg-navy-muted rounded-[40px] p-8 border transition-all duration-500 relative overflow-hidden group ${
                    isActive ? 'border-gold shadow-[0_0_50px_rgba(234,179,8,0.05)] ring-1 ring-gold/20' : 'border-slate-800 shadow-xl hover:border-gold/30'
                  }`}
                >
                   {/* Background Accents */}
                   <div className={`absolute top-0 right-0 w-48 h-48 blur-[80px] -mr-24 -mt-24 transition-all duration-700 ${
                     isActive ? 'bg-gold/15' : 'bg-gold/5 group-hover:bg-gold/10'
                   }`} />
                   
                   {/* Header */}
                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-500 ${
                        isActive ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'bg-navy text-gold border-slate-800 shadow-inner group-hover:scale-110'
                      }`}>
                         <Store size={32} strokeWidth={isActive ? 2.5 : 2} />
                      </div>
                      <div className="flex items-center gap-2">
                         <button 
                           onClick={() => setEditingBranch(branch)} 
                           className="p-3 bg-navy border border-slate-800 rounded-xl text-slate-600 hover:text-gold hover:border-gold/30 transition-all hover:bg-gold/5"
                         >
                            <Edit2 size={16} />
                         </button>
                         <button 
                           onClick={() => deleteBranch(branch.id, branch.name)} 
                           className="p-3 bg-navy border border-slate-800 rounded-xl text-slate-600 hover:text-red-500 hover:border-red-500/30 transition-all hover:bg-red-500/5"
                         >
                            <Trash2 size={16} />
                         </button>
                      </div>
                   </div>

                   {/* Content */}
                   <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-1.5">
                        <MapPin size={10} className="text-gold/50" />
                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{branch.location}</p>
                      </div>
                      <h3 className="text-3xl font-black text-white italic tracking-tighter mb-6 lg:mb-10 line-clamp-1">{branch.name}</h3>
                      
                      <div className="grid grid-cols-2 gap-4 mb-10">
                         <div className="p-5 bg-navy/50 backdrop-blur-sm border border-slate-800/50 rounded-3xl">
                            <div className="flex items-center gap-2 text-slate-500 mb-2">
                               <Users size={12} />
                               <span className="text-[10px] uppercase font-black tracking-widest">Personnel</span>
                            </div>
                            <p className="text-2xl font-black text-white tracking-widest">{staffCount.toString().padStart(2, '0')}</p>
                         </div>
                         <div className="p-5 bg-navy/50 backdrop-blur-sm border border-slate-800/50 rounded-3xl">
                            <div className="flex items-center gap-2 text-gold mb-2">
                               <TrendingUp size={12} />
                               <span className="text-[10px] uppercase font-black tracking-widest">Status</span>
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest mt-1">Operational</p>
                         </div>
                      </div>

                      <button 
                        disabled={isSwitching !== null}
                        onClick={async () => {
                          if (isActive) return;
                          setIsSwitching(branch.id);
                          try {
                            await switchBranch(branch.id);
                            navigate('/dashboard');
                          } catch (err) {
                            alert('Protocol failure during terminal transition.');
                          } finally {
                            setIsSwitching(null);
                          }
                        }}
                        className={`w-full h-16 rounded-[24px] font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-500 flex items-center justify-center gap-3 active:scale-95 ${
                          isActive 
                            ? 'bg-gold text-navy shadow-2xl shadow-gold/20' 
                            : 'bg-navy border border-slate-800 text-slate-500 hover:text-white hover:border-gold/30 hover:bg-gold/5'
                        }`}
                      >
                         {isSwitching === branch.id ? (
                           <Loader2 className="animate-spin" size={18} />
                         ) : isActive ? (
                           <>Primary Hub Active <ArrowRight className="text-navy/50" size={16} strokeWidth={3} /></>
                         ) : (
                           <>Enter Strategy Hub <ArrowRight size={16} strokeWidth={3} /></>
                         )}
                      </button>
                   </div>
                </motion.div>
              );
           })}

           {branches.length === 0 && !loading && (
             <div className="col-span-full py-32 flex flex-col items-center justify-center text-center">
                <div className="w-32 h-32 bg-navy-muted rounded-full flex items-center justify-center border border-slate-800 mb-10 text-slate-800 relative group">
                   <div className="absolute inset-0 bg-gold/5 rounded-full blur-2xl animate-pulse" />
                   <MapPin size={56} className="relative z-10 group-hover:scale-110 transition-transform duration-700" />
                </div>
                <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Network Zero</h3>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] max-w-sm leading-relaxed px-6">
                  Your strategy board is clear. No active hubs detected in the current cloud region. Initialize your first outpost to begin operations.
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
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-navy/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 70 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 70 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[50px] p-10 lg:p-14 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Strategic Deployment</h3>
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-12">Provisioning a new node in the enterprise mesh</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Hub Identifier (Name)</label>
                    <input 
                      type="text" 
                      value={newBranch.name}
                      onChange={(e) => setNewBranch({...newBranch, name: e.target.value})}
                      placeholder="e.g. ALPHA MAIN STATION"
                      className="w-full h-18 px-8 bg-navy border border-slate-800 rounded-[28px] text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all font-black uppercase text-sm tracking-widest"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Geographical Sector</label>
                    <input 
                      type="text" 
                      value={newBranch.location}
                      onChange={(e) => setNewBranch({...newBranch, location: e.target.value})}
                      placeholder="e.g. UPPER HILL DISTRICT"
                      className="w-full h-18 px-8 bg-navy border border-slate-800 rounded-[28px] text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all font-black uppercase text-sm tracking-widest"
                    />
                  </div>
                  
                  <div className="flex gap-6 pt-10">
                    <button 
                      onClick={() => setIsAdding(false)}
                      className="flex-1 h-16 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
                    >
                      ABORT
                    </button>
                    <button 
                      onClick={handleAddBranch}
                      disabled={loading || !newBranch.name}
                      className="flex-[2] h-18 bg-gold text-navy rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gold/20 hover:bg-gold-light transition-all disabled:opacity-30 disabled:scale-100 active:scale-95"
                    >
                      INITIALIZE CORE
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {editingBranch && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingBranch(null)}
              className="absolute inset-0 bg-navy/95 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 70 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 70 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[50px] p-10 lg:p-14 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-[80px] -mr-32 -mt-32" />
              
              <div className="relative z-10">
                <h3 className="text-4xl font-black text-white italic tracking-tighter mb-4">Reconfigure Hub</h3>
                <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-12">Updating parameters for {editingBranch.name}</p>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Hub Identifier</label>
                    <input 
                      type="text" 
                      value={editingBranch.name}
                      onChange={(e) => setEditingBranch({...editingBranch, name: e.target.value})}
                      className="w-full h-18 px-8 bg-navy border border-slate-800 rounded-[28px] text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all font-black uppercase text-sm tracking-widest"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Geographical Sector</label>
                    <input 
                      type="text" 
                      value={editingBranch.location}
                      onChange={(e) => setEditingBranch({...editingBranch, location: e.target.value})}
                      className="w-full h-18 px-8 bg-navy border border-slate-800 rounded-[28px] text-white outline-none focus:border-gold focus:ring-4 focus:ring-gold/5 transition-all font-black uppercase text-sm tracking-widest"
                    />
                  </div>
                  
                  <div className="flex gap-6 pt-10">
                    <button 
                      onClick={() => setEditingBranch(null)}
                      className="flex-1 h-16 font-black text-[11px] uppercase tracking-[0.2em] text-slate-500 hover:text-white transition-colors"
                    >
                      CANCEL
                    </button>
                    <button 
                      onClick={handleEditBranch}
                      disabled={loading || !editingBranch.name}
                      className="flex-[2] h-18 bg-gold text-navy rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-gold/20 hover:bg-gold-light transition-all disabled:opacity-30 disabled:scale-100 active:scale-95"
                    >
                      UPDATE PARAMETERS
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
