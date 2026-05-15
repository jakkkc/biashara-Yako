import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Branch } from '../../types';
import { Plus, MapPin, Phone, Building2, Search } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function BranchesPage() {
  const { profile } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newBranch, setNewBranch] = useState({
    name: '',
    location: '',
    phone: ''
  });

  useEffect(() => {
    if (!profile?.businessId) return;

    const q = query(
      collection(db, 'branches'),
      where('businessId', '==', profile.businessId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(items);
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'branches'), {
        ...newBranch,
        businessId: profile.businessId,
        status: 'active',
        managerId: null,
        createdAt: serverTimestamp(),
        createdBy: profile.uid
      });
      setShowAddModal(false);
      setNewBranch({ name: '', location: '', phone: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'branches');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Branches</h1>
          <p className="text-slate-400 font-medium mt-1">Manage your business locations and their performance.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[20px] font-bold transition shadow-lg shadow-blue-600/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" /> Add New Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map(branch => (
          <div key={branch.id} className="glass-card p-8 rounded-[32px] border border-white/5 hover:border-blue-500/30 transition-all group relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-500/5 blur-2xl rounded-full" />
            
            <div className="flex items-start justify-between mb-6">
              <div className="bg-white/5 p-4 rounded-2xl group-hover:bg-blue-600/20 text-slate-500 group-hover:text-blue-400 transition-all border border-white/5">
                <Building2 className="w-6 h-6" />
              </div>
              <span className={cn(
                "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                branch.status === 'active' 
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                  : "bg-red-600/10 text-red-500 border-red-500/20"
              )}>
                {branch.status}
              </span>
            </div>
            <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:text-blue-400 transition-colors">{branch.name}</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <MapPin className="w-4 h-4 text-blue-400/50" /> {branch.location}
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
                <Phone className="w-4 h-4 text-blue-400/50" /> {branch.phone}
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Active Location</span>
              <button className="text-xs font-bold text-blue-400 hover:text-blue-300 uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all">View Details</button>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
            
            <h2 className="text-2xl font-bold font-serif mb-8 text-white tracking-tight relative z-10 flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/20 rounded-xl text-blue-400">
                <Building2 className="w-6 h-6" />
              </div>
              Register New Branch
            </h2>
            <form onSubmit={handleAddBranch} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Branch Name</label>
                <input 
                  required
                  value={newBranch.name}
                  onChange={e => setNewBranch({...newBranch, name: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700"
                  placeholder="e.g. Nairobi CBD"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Location / Address</label>
                <input 
                  required
                  value={newBranch.location}
                  onChange={e => setNewBranch({...newBranch, location: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700"
                  placeholder="Street, Building, Floor"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Phone Number</label>
                <input 
                  required
                  value={newBranch.phone}
                  onChange={e => setNewBranch({...newBranch, phone: e.target.value})}
                  className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700"
                  placeholder="+254..."
                />
              </div>
              <div className="flex gap-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[20px] font-bold transition active:scale-[0.98]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-[20px] font-bold transition disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                >
                  {loading ? "Adding..." : "Add Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
