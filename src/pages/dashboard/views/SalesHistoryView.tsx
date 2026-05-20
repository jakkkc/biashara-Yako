import { useState, useEffect } from 'react';
import { 
  History, 
  Search, 
  Download, 
  Filter, 
  Loader2, 
  ChevronRight, 
  User, 
  Store, 
  Calendar,
  Eye
} from 'lucide-react';
import { collection, query, getDocs, orderBy, where, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Sale, Branch } from '../../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function SalesHistoryView() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      if (profile.branchId && !selectedBranchId) {
        setSelectedBranchId(profile.branchId);
      }
      fetchBranches();
      fetchSales();
    }
  }, [profile?.businessId, selectedBranchId]);

  const fetchBranches = async () => {
    try {
      const snapshot = await getDocs(collection(db, `businesses/${profile?.businessId}/branches`));
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Branch));
      setBranches(data);
    } catch (error) {
       console.error(error);
    }
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, `businesses/${profile?.businessId}/sales`),
        orderBy('createdAt', 'desc'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      
      if (selectedBranchId) {
        data = data.filter(s => s.branchId === selectedBranchId);
      } else if (profile?.role !== 'Owner' && profile?.branchId) {
        data = data.filter(s => s.branchId === profile.branchId);
      }
      
      setSales(data);
    } catch (error) {
       console.error('Error fetching sales:', error);
    } finally {
       setLoading(false);
    }
  };

  const filteredSales = sales.filter(sale => 
    sale.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Transaction Ledger</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Strategic audit of enterprise capital flow</p>
        </div>
        <div className="flex gap-3">
           <button className="px-6 py-3 bg-navy-muted border border-slate-800 rounded-2xl text-slate-300 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all flex items-center gap-2">
              <Download size={14} /> Export Logs
           </button>
        </div>
      </div>

      <div className="bg-navy-muted p-4 rounded-3xl border border-slate-800 shadow-sm flex flex-col md:flex-row gap-4">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by transaction ID or operator..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-navy border border-transparent focus:border-slate-700 rounded-2xl text-sm transition-all outline-none text-white"
            />
         </div>
         <div className="flex gap-2">
            {profile?.role === 'Owner' && (
              <select 
                value={selectedBranchId}
                onChange={(e) => setSelectedBranchId(e.target.value)}
                className="px-6 py-2 bg-navy border border-slate-800 rounded-2xl text-slate-400 font-black text-[10px] uppercase tracking-widest outline-none focus:border-gold/30"
              >
                <option value="">All Branches</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            )}
            <button className="px-6 py-2 bg-navy border border-slate-800 rounded-2xl text-slate-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
               <Calendar size={14} /> Date
            </button>
         </div>
      </div>

      <div className="bg-navy-muted rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden">
         {loading ? (
           <div className="py-24 flex flex-col items-center justify-center gap-4">
              <Loader2 className="animate-spin text-gold w-10 h-10" />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Scanning Ledger...</p>
           </div>
         ) : filteredSales.length === 0 ? (
           <div className="py-24 text-center ">
              <History size={48} className="mx-auto text-slate-800 mb-6" />
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest">No active transactions detected</p>
           </div>
         ) : (
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead>
                    <tr className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] border-b border-slate-800">
                       <th className="px-10 py-6">Timestamp / ID</th>
                       <th className="px-6 py-6">Operative</th>
                       <th className="px-6 py-6">Hub Designation</th>
                       <th className="px-6 py-6">Capital Flow</th>
                       <th className="px-6 py-6">Method</th>
                       <th className="px-10 py-6 text-right">Utility</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-800/50">
                    {filteredSales.map((sale) => (
                       <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-10 py-6">
                             <div className="flex flex-col">
                                <span className="text-white font-black text-sm tracking-tight">{new Date(sale.createdAt).toLocaleTimeString()}</span>
                                <span className="text-[9px] font-mono font-bold text-slate-500 tracking-tighter uppercase">{sale.id}</span>
                             </div>
                          </td>
                          <td className="px-6 py-6">
                             <div className="flex items-center gap-2 text-slate-300">
                                <User size={14} className="text-slate-600" />
                                <span className="text-xs font-bold">{sale.userName}</span>
                             </div>
                          </td>
                          <td className="px-6 py-6 font-bold text-xs text-slate-500">
                             {branches.find(b => b.id === sale.branchId)?.name || 'Central Hub'}
                          </td>
                          <td className="px-6 py-6">
                             <span className="text-white font-black text-sm">Ksh {sale.total.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-6">
                             <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${sale.paymentMethod === 'M-Pesa' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-gold/10 border-gold/20 text-gold'}`}>
                                {sale.paymentMethod}
                             </span>
                          </td>
                          <td className="px-10 py-6 text-right">
                             <button className="p-3 bg-navy border border-slate-800 rounded-xl text-slate-600 hover:text-white transition-all">
                                <Eye size={16} />
                             </button>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>
         )}
      </div>
    </div>
  );
}
