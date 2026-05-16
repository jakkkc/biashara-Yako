import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Building, 
  Users, 
  GitMerge, 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  Power, 
  ShieldAlert, 
  TrendingUp, 
  CreditCard,
  RefreshCw,
  SearchCode
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { formatCurrency, formatDateString } from '../utils/formatters';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  
  // Local reactive states
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [branchesList, setBranchesList] = useState<any[]>([]);
  const [salesList, setSalesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Admin search state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');

  // Load SaaSwide metadata
  useEffect(() => {
    if (!user || user.role !== 'super_admin') {
      setLoading(false);
      return;
    }

    setLoading(true);

    // 1st connection: Businesses
    const unsubBiz = onSnapshot(collection(db, 'businesses'), (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setBusinesses(items);
    }, (err) => console.error('Admin business load failed:', err));

    // 2nd connection: Users
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setUsersList(items);
    }, (err) => console.error('Admin users load failed:', err));

    // 3rd connection: Branches
    const unsubBranches = onSnapshot(collection(db, 'branches'), (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setBranchesList(items);
    }, (err) => console.error('Admin branches load failed:', err));

    // 4th connection: Sales tracking for platform stats
    const unsubSales = onSnapshot(collection(db, 'sales'), (snap) => {
      const items: any[] = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      setSalesList(items);
      setLoading(false);
    }, (err) => {
      console.error('Admin sales telemetry failed:', err);
      setLoading(false);
    });

    return () => {
      unsubBiz();
      unsubUsers();
      unsubBranches();
      unsubSales();
    };
  }, [user]);

  // Handle business account status toggle
  const toggleBusinessStatus = async (bizId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const bizRef = doc(db, 'businesses', bizId);
    
    try {
      await updateDoc(bizRef, { status: nextStatus });
    } catch (err) {
      console.error('Failed to change business status:', err);
    }
  };

  // Telemetry computation
  const totalVolume = salesList.reduce((acc, sale) => acc + (sale.total || 0), 0);
  const activeCount = businesses.filter(b => b.status === 'active').length;
  const suspendedCount = businesses.filter(b => b.status === 'suspended').length;

  // Filter businesses
  const filteredBusinesses = businesses.filter(biz => {
    const matchesSearch = biz.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          biz.ownerEmail?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          biz.phone?.includes(searchQuery);
    
    const matchesStatus = statusFilter === 'all' || biz.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500" />
        <p className="text-sm text-slate-400 font-mono">Loading SaaS Control panel...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative overflow-hidden" id="saas-admin-page">
      {/* Dynamic Background Glow - Geometric Balance theme */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Header with geometric accent line */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5 relative">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider font-mono">
              System Admin
            </span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white font-sans">
            SaaS Dashboard <span className="font-light text-slate-400">Panel</span>
          </h1>
          <p className="text-xs text-slate-400">
            Control Multi-tenant platforms, suspend defaults, and inspect operational metrics.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="p-2 px-4 rounded-xl bg-slate-900 border border-white/5 text-right font-mono">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Software Version</div>
            <div className="text-sm font-semibold text-slate-300">v1.2.4 (Geometric)</div>
          </div>
        </div>
      </div>

      {/* Grid of metrics matching Recipe 1 & Recipe 11 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Total Businesses" 
          val={businesses.length}
          trend={`Active: ${activeCount} | Suspended: ${suspendedCount}`}
          icon={Building}
          color="indigo"
          id="kpi-biz"
        />
        <KPICard 
          title="Active Users" 
          val={usersList.length}
          trend={`${usersList.filter(u => u.status === 'active').length} users online`}
          icon={Users}
          color="emerald"
          id="kpi-users"
        />
        <KPICard 
          title="Total Branches" 
          val={branchesList.length}
          trend="Across East Africa"
          icon={GitMerge}
          color="sky"
          id="kpi-branches"
        />
        <KPICard 
          title="Total Volume Managed" 
          val={formatCurrency(totalVolume, 'KES')}
          trend={`${salesList.length} cumulative sales`}
          icon={TrendingUp}
          color="purple"
          id="kpi-volume"
        />
      </div>

      {/* Bottom Main Layout Splitting */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (2 cols) - Tenant Management Table */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6 border-white/5" id="business-management-card">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-white tracking-wide">Tenant Control Terminal</h3>
                <p className="text-xs text-slate-400">Search, suspend or restore business databases</p>
              </div>

              {/* Advanced search control bar */}
              <div className="flex flex-col sm:flex-row items-stretch gap-2 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full sm:w-60 pl-9 pr-4 py-1.5 text-xs bg-slate-950/40 rounded-xl border border-white/5 text-slate-300 focus:outline-none focus:border-indigo-500 font-sans"
                    id="biz-search-field"
                  />
                </div>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-1.5 text-xs bg-slate-950/40 rounded-xl border border-white/5 text-slate-300 focus:outline-none focus:border-indigo-500 font-sans cursor-pointer"
                  id="biz-status-filter"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="suspended">Suspended Only</option>
                </select>
              </div>
            </div>

            {/* Table data views */}
            {filteredBusinesses.length === 0 ? (
              <div className="text-center py-12 bg-slate-950/10 rounded-xl border border-dashed border-white/5">
                <SearchCode className="h-10 w-10 text-slate-500 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Hakuna biashara iliyopatikana</p>
                <p className="text-slate-500 text-xs mt-1">Try resetting your search filters or check your spelling.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      <th className="py-3 px-4">Business / Biz Name</th>
                      <th className="py-3 px-4">Owner Contact</th>
                      <th className="py-3 px-4">Branches</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Database Guard</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredBusinesses.map((biz) => {
                      const bizBranches = branchesList.filter(b => b.businessId === biz.id);
                      const isSuspended = biz.status === 'suspended';
                      
                      return (
                        <motion.tr 
                          key={biz.id} 
                          className="hover:bg-white/[0.02] transition-colors"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-200 text-sm">{biz.name}</div>
                            <div className="text-xs text-slate-400 font-mono mt-0.5">{biz.businessType || 'General Retail'}</div>
                          </td>
                          <td className="py-4 px-4 text-xs font-mono">
                            <div className="text-slate-300">{biz.ownerEmail}</div>
                            <div className="text-slate-500 mt-0.5">{biz.phone}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="p-1 px-2.5 rounded-lg bg-slate-950 text-slate-400 font-semibold font-mono text-[10px] border border-white/5">
                              {bizBranches.length} branch{bizBranches.length !== 1 && 'es'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {isSuspended ? (
                              <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-500/10 border border-red-500/20 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md">
                                <AlertTriangle className="h-3 w-3" /> Suspended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold font-mono px-2 py-0.5 rounded-md">
                                <CheckCircle className="h-3 w-3" /> Active
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <button
                              onClick={() => toggleBusinessStatus(biz.id, biz.status)}
                              className={`p-1.5 px-3 rounded-lg text-xs font-mono font-bold inline-flex items-center gap-1.5 transition cursor-pointer ${
                                isSuspended 
                                  ? 'bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-red-500/10 hover:bg-red-500/25 text-red-400 border border-red-500/20'
                              }`}
                              id={`toggle-${biz.id}`}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {isSuspended ? 'Uwezeshe' : 'Usimamishe'}
                            </button>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

        {/* Right Column (1 col) - Platform Telemetry Insights */}
        <div className="space-y-6">
          <GlassCard className="p-6 border-white/5" id="system-security-card">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-indigo-400" />
              <h3 className="text-md font-bold text-white tracking-wide">Platform Auditing</h3>
            </div>
            
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              SaaS Multi-tenant platform handles critical records under complete security protection: (1) Secure Firestore attributes, (2) Closed auth-hijacking loops.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono font-medium">Business Activity Gauge</span>
                  <span className="text-xs text-indigo-400 font-bold font-mono">
                    {businesses.length ? Math.round((activeCount / businesses.length) * 100) : 0}% Active
                  </span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${businesses.length ? (activeCount / businesses.length) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono font-medium">Platform Load Rate</span>
                  <span className="text-xs text-emerald-400 font-bold font-mono">Normal (0.01s)</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '12%' }} />
                </div>
              </div>

              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-400 font-mono font-medium">Software License Revenue</span>
                  <span className="text-xs text-slate-200 font-bold font-mono">KES 24,000 / mo</span>
                </div>
                <div className="flex gap-1.5 items-center mt-1 text-[10px] text-slate-500 font-bold font-mono uppercase">
                  <CreditCard className="h-3.5 w-3.5 text-indigo-400 shrink-0" /> Stripe Integrated
                </div>
              </div>
            </div>
          </GlassCard>

          {/* SaaS Core Architecture Specifications */}
          <GlassCard className="p-6 border-white/5" id="system-details-card">
            <h3 className="text-sm font-bold text-white tracking-wide mb-3 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-emerald-400 shrink-0" /> System Diagnostics
            </h3>
            
            <div className="divide-y divide-white/5 text-xs font-mono">
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Node JS Engine:</span>
                <span className="text-slate-300">v22.x LTS</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Database Engine:</span>
                <span className="text-slate-300">Cloud Firestore</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">Storage Volume:</span>
                <span className="text-slate-300">Enterprise Standard</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-slate-500">East Africa Gate:</span>
                <span className="text-slate-300">Multi-region Global</span>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>
    </div>
  );
};
export default AdminPage;
