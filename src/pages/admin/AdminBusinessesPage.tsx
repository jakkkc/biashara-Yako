import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { Business } from '../../types';
import { Building2, Search, CheckCircle2, XCircle, Eye, TrendingUp } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';

export default function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'businesses'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setBusinesses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business)));
    });
    return () => unsubscribe();
  }, []);

  const toggleStatus = async (business: Business) => {
    const newStatus = business.status === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'businesses', business.id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'businesses');
    }
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.ownerEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Business Administration</h1>
          <p className="text-slate-400 font-medium mt-1">Monitor and manage all businesses on the platform.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400/50 w-5 h-5" />
          <input 
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search businesses by name or owner email..."
            className="w-full pl-14 pr-6 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-blue-500/50 outline-none transition placeholder:text-slate-700 font-medium"
          />
        </div>
      </div>

      <div className="glass rounded-[32px] shadow-sm border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Business</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Owner</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Registered</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBusinesses.map(business => (
                <tr key={business.id} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-blue-400 font-black border border-white/5 group-hover:scale-110 transition-transform">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{business.name}</p>
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{business.businessType}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-sm font-medium text-slate-300">{business.ownerEmail}</p>
                  </td>
                  <td className="px-8 py-6 text-sm text-slate-400 font-medium font-mono lowercase">
                    {formatDate(business.createdAt)}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                      business.status === 'active' 
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                        : "bg-red-600/10 text-red-500 border-red-500/20"
                    )}>
                      {business.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => toggleStatus(business)}
                        className={cn(
                          "p-2.5 rounded-xl transition-all border border-white/5 active:scale-95",
                          business.status === 'active' 
                            ? "text-red-400 hover:bg-red-600/20 hover:border-red-500/30" 
                            : "text-blue-400 hover:bg-blue-600/20 hover:border-blue-500/30"
                        )}
                        title={business.status === 'active' ? "Suspend" : "Activate"}
                      >
                        {business.status === 'active' ? <XCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                      </button>
                      <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-slate-400 border border-white/5 hover:border-white/20 active:scale-95" title="View Detail">
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
