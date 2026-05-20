import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShieldAlert, 
  BarChart, 
  Settings, 
  Search, 
  ArrowRight,
  Pause,
  Play,
  Trash2,
  ExternalLink,
  Loader2,
  LogOut
} from 'lucide-react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Business, BusinessStatus } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function SuperAdminDashboard() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: '', ownerEmail: '', type: 'Retail' });
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile();
  const { impersonate, impersonatedId, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'businesses'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Business));
      setBusinesses(data);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const provisionBusiness = async () => {
    if (!newBiz.name || !newBiz.ownerEmail) return;
    setLoading(true);
    const id = `BIZ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    try {
      await setDoc(doc(db, 'businesses', id), {
        ...newBiz,
        id,
        status: 'active',
        currency: 'Ksh',
        vatEnabled: true,
        vatPercentage: 16,
        location: 'Default HQ',
        subscription: {
          plan: 'Premium',
          expiryDate: Date.now() + 86400000 * 30
        },
        createdAt: Date.now()
      });
      setIsProvisioning(false);
      fetchBusinesses();
    } catch (error) {
      console.error('Error provisioning:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: BusinessStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await updateDoc(doc(db, 'businesses', id), { status: newStatus });
      setBusinesses(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const deleteBusiness = async (id: string) => {
    if (!window.confirm('Are you absolutely sure?')) return;
    try {
      await deleteDoc(doc(db, 'businesses', id));
      setBusinesses(prev => prev.filter(b => b.id !== id));
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  };

  const handleEnterBusiness = (id: string) => {
    impersonate(id);
    navigate('/dashboard');
  };

  const handleStopImpersonating = () => {
    impersonate(null);
  };

  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-navy flex flex-col lg:flex-row selection:bg-gold/30">
      {/* Admin Sidebar */}
      {!isMobile && (
        <aside className="w-72 bg-navy-muted text-white flex flex-col pt-8 border-r border-slate-800 shrink-0">
          <div className="px-8 mb-12 flex items-center gap-3">
             <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/10">
                <ShieldAlert className="text-navy w-6 h-6" strokeWidth={2.5} />
             </div>
             <span className="text-xl font-black tracking-tighter italic">CONSORTIUM</span>
          </div>
          
          <nav className="flex-1 px-4 space-y-2">
             <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-gold text-navy font-black text-xs uppercase tracking-widest transition-all">
                <LayoutDashboard size={20} /> System Hub
             </button>
             <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all text-left">
                <Store size={20} /> Enterprises
             </button>
             <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all text-left">
                <BarChart size={20} /> Network Intel
             </button>
             <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-500 hover:text-white hover:bg-white/5 font-bold text-xs uppercase tracking-widest transition-all text-left">
                <Settings size={20} /> Core Config
             </button>
          </nav>

          {impersonatedId && (
            <div className="mx-4 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
              <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-2">Impersonation active</p>
              <button 
                onClick={handleStopImpersonating}
                className="w-full py-2 bg-red-500 text-white rounded-lg text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
              >
                <LogOut size={14} /> Exit Mode
              </button>
            </div>
          )}

          <div className="p-8 border-t border-slate-800">
             <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3 font-mono">Consortium lead</p>
             <p className="font-bold text-sm text-white tracking-tight">Jackson Mwaniki</p>
             <p className="text-[11px] text-gold font-bold">jacmwaniki@gmail.com</p>
             <button onClick={() => logout()} className="mt-6 flex items-center gap-2 text-slate-500 hover:text-red-400 transition-colors text-[10px] font-black uppercase tracking-widest">
                <LogOut size={14} /> Terminate Session
             </button>
          </div>
        </aside>
      )}

      {/* Admin Main */}
      <main className={`flex-1 p-6 lg:p-12 overflow-y-auto ${isMobile ? 'pb-24' : ''}`}>
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-12 lg:mb-16">
           <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl lg:text-5xl font-black text-white italic tracking-tighter mb-2">Platform Console</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Managing Biashara Yako architecture</p>
              </div>
              {isMobile && (
                 <button onClick={() => logout()} className="p-3 bg-navy-muted border border-slate-800 rounded-xl text-slate-500 hover:text-red-400">
                    <LogOut size={20} />
                 </button>
              )}
           </div>
           
           <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setIsProvisioning(true)}
                className="h-14 lg:h-16 px-6 lg:px-8 bg-gold text-navy rounded-2xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-xl shadow-gold/10"
              >
                Provision Enterprise <ArrowRight size={16} strokeWidth={3} />
              </button>
              <div className="relative group flex-1">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-gold transition-colors" />
                 <input 
                   type="text" 
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                   placeholder="Discover nodes..." 
                   className="w-full lg:w-96 h-14 lg:h-16 pl-12 pr-6 bg-navy-muted border border-slate-800 rounded-2xl shadow-sm outline-none text-white focus:border-gold/50 transition-all font-medium"
                 />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
           <AdminStatCard title="Global Enterprises" value={businesses.length.toString()} change={`+${businesses.filter(b => b.createdAt > Date.now() - 86400000 * 7).length}`} icon={Store} />
           <AdminStatCard title="Average Revenue" value="Ksh 14k" change="+12%" icon={BarChart} />
           <AdminStatCard title="System Load" value="Optimal" change="99.9%" icon={Users} />
        </div>

        <div className="bg-navy-muted rounded-[30px] lg:rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
           <div className="p-6 lg:p-10 border-b border-slate-800 flex justify-between items-center bg-white/5">
              <h2 className="text-xl lg:text-2xl font-black text-white italic tracking-tighter">Enterprise Registry</h2>
              <button 
                onClick={fetchBusinesses}
                className="text-[10px] font-black text-gold uppercase tracking-[0.2em] hover:text-white transition-colors"
              >
                Refresh
              </button>
           </div>
           
           <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                   <Loader2 className="animate-spin text-gold w-10 h-10" />
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Aggregating records...</p>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                     <tr className="bg-navy text-slate-500 text-[10px] font-black tracking-widest uppercase border-b border-slate-800">
                        <th className="px-6 lg:px-10 py-6">Enterprise</th>
                        <th className="px-6 lg:px-8 py-6">Owner</th>
                        <th className="px-6 lg:px-8 py-6">Status</th>
                        <th className="hidden lg:table-cell px-8 py-6">Operational Date</th>
                        <th className="px-6 lg:px-10 py-6 text-right">Actions</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                     {filteredBusinesses.map((biz) => (
                       <tr key={biz.id} className="hover:bg-white/5 transition-all group">
                          <td className="px-6 lg:px-10 py-8">
                             <p className="font-black text-white text-base lg:text-lg tracking-tight group-hover:text-gold transition-colors">{biz.name}</p>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{biz.type}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-8">
                             <p className="text-sm font-bold text-slate-300 truncate max-w-[150px]">{biz.ownerEmail}</p>
                             <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">{biz.location}</p>
                          </td>
                          <td className="px-6 lg:px-8 py-8">
                             <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${biz.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                                <span className={`hidden sm:inline text-[10px] font-black uppercase tracking-widest ${biz.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
                                   {biz.status}
                                </span>
                             </div>
                          </td>
                          <td className="hidden lg:table-cell px-8 py-8 text-slate-500 font-mono text-xs">
                             {new Date(biz.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-6 lg:px-10 py-8 text-right">
                             <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => handleEnterBusiness(biz.id)}
                                  className="p-3 bg-navy border border-slate-800 text-slate-400 hover:text-gold hover:border-gold/30 rounded-xl transition-all shadow-sm group/btn"
                                  title="Enter Business"
                                >
                                   <ExternalLink size={16} />
                                </button>
                                <button 
                                  onClick={() => toggleStatus(biz.id, biz.status)}
                                  className={`p-3 bg-navy border border-slate-800 rounded-xl transition-all shadow-sm ${
                                    biz.status === 'active' ? 'text-amber-500 hover:border-amber-500/30' : 'text-green-500 hover:border-green-500/30'
                                  }`}
                                  title={biz.status === 'active' ? 'Suspend' : 'Activate'}
                                >
                                   {biz.status === 'active' ? <Pause size={16} /> : <Play size={16} />}
                                </button>
                                <button 
                                  onClick={() => deleteBusiness(biz.id)}
                                  className="hidden sm:block p-3 bg-navy border border-slate-800 text-slate-500 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all shadow-sm"
                                  title="Delete Enterprise"
                                >
                                   <Trash2 size={16} />
                                </button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
                </table>
              )}
           </div>
        </div>
      </main>

      {/* Mobile Impersonation Bar */}
      {isMobile && impersonatedId && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-500 p-4 flex items-center justify-between z-[100] shadow-2xl">
           <div className="flex items-center gap-3">
              <ShieldAlert className="text-white w-5 h-5" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Impersonation Mode Active</span>
           </div>
           <button 
             onClick={handleStopImpersonating}
             className="bg-white text-red-500 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-lg"
           >
             Exit
           </button>
        </div>
      )}

      {/* Provisioning Modal */}
      <AnimatePresence>
        {isProvisioning && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsProvisioning(false)}
              className="absolute inset-0 bg-navy/80 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-navy-muted border border-slate-800 rounded-[30px] lg:rounded-[40px] p-8 lg:p-10 shadow-2xl"
            >
              <h3 className="text-2xl lg:text-3xl font-black text-white italic tracking-tighter mb-2">New Node Initialization</h3>
              <p className="text-slate-500 font-black text-[10px] uppercase tracking-widest mb-8 lg:mb-10">Deploying enterprise to consortium</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Enterprise Designation</label>
                  <input 
                    type="text" 
                    value={newBiz.name}
                    onChange={(e) => setNewBiz({...newBiz, name: e.target.value})}
                    placeholder="e.g. Skyline Logistics"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Lead Operator Email</label>
                  <input 
                    type="email" 
                    value={newBiz.ownerEmail}
                    onChange={(e) => setNewBiz({...newBiz, ownerEmail: e.target.value})}
                    placeholder="operator@nexus.com"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Operational Sector</label>
                  <select 
                    value={newBiz.type}
                    onChange={(e) => setNewBiz({...newBiz, type: e.target.value})}
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl text-white outline-none focus:border-gold/50 appearance-none transition-all"
                  >
                    <option value="Retail">Retail</option>
                    <option value="Wholesale">Wholesale</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Pharmacy">Pharmacy</option>
                  </select>
                </div>
                
                <div className="flex gap-4 pt-6">
                  <button 
                    onClick={() => setIsProvisioning(false)}
                    className="flex-1 h-14 font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-white"
                  >
                    Abort
                  </button>
                  <button 
                    onClick={provisionBusiness}
                    disabled={loading || !newBiz.name || !newBiz.ownerEmail}
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

function AdminStatCard({ title, value, change, icon: Icon }: any) {
  return (
    <div className="bg-navy-muted p-8 lg:p-10 rounded-[30px] lg:rounded-[40px] border border-slate-800 shadow-xl group hover:border-gold/30 transition-all relative overflow-hidden">
       <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all" />
       
       <div className="flex justify-between items-start mb-6 lg:mb-8 relative z-10">
          <div className="w-12 h-12 lg:w-16 lg:h-16 bg-navy border border-slate-800 rounded-2xl flex items-center justify-center text-gold shadow-inner">
             <Icon size={24} lg:size={32} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-black text-green-500 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full uppercase tracking-widest">
             {change}
          </span>
       </div>
       <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-2 relative z-10">{title}</p>
       <h4 className="text-2xl lg:text-4xl font-black text-white italic tracking-tighter relative z-10">{value}</h4>
    </div>
  );
}
