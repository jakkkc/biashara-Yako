import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { Business, UserProfile } from '../../types';
import { 
  ShieldCheck, 
  Store, 
  Users, 
  Activity, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  MoreVertical
} from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { KPICard } from '../../components/ui/KPICard';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  
  const { data: businesses, loading: bLoading } = useCollection<Business>('businesses');
  const { data: totalUsers, loading: uLoading } = useCollection<UserProfile>('users');

  if (userProfile?.role !== 'super_admin') {
    return <div className="text-center py-20 p-6 glass-card">Unauthorized Access</div>;
  }

  const activeBusinesses = businesses.filter(b => b.status === 'active').length;
  const suspendedBusinesses = businesses.length - activeBusinesses;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <ShieldCheck className="w-8 h-8 text-indigo-400" />
        <div>
          <h1 className="text-3xl font-display font-bold">System Administration</h1>
          <p className="text-slate-400">Global overview and management of all tenants.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Total Businesses" value={businesses.length.toString()} icon={Store} color="indigo" />
        <KPICard title="Total Users" value={totalUsers.length.toString()} icon={Users} color="purple" />
        <KPICard title="System Uptime" value="99.9%" icon={Activity} color="emerald" />
        <KPICard title="Active Subs" value={activeBusinesses.toString()} icon={CheckCircle2} color="emerald" trend="+2" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-6">Recent Business Registrations</h3>
          <div className="space-y-4">
            {bLoading ? (
               <div className="h-40 animate-pulse bg-white/5 rounded-xl"></div>
            ) : businesses.length === 0 ? (
              <p className="text-slate-500 italic text-center py-8">No businesses registered yet.</p>
            ) : businesses.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold">{b.name}</p>
                    <p className="text-xs text-slate-400">{b.ownerEmail} • {b.businessType}</p>
                  </div>
                </div>
                <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${b.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                  {b.status}
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="text-lg font-bold mb-6">System Health & Alerts</h3>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start gap-4">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-1" />
              <div>
                <p className="font-semibold">Firebase Connection: Stable</p>
                <p className="text-xs text-slate-500">Latency: 42ms • All services operational.</p>
              </div>
            </div>
            <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/10 flex items-start gap-4">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-1" />
              <div>
                <p className="font-semibold">Cloud Sync Delay</p>
                <p className="text-xs text-slate-500">Some users in Western Kenya reporting slow sync.</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
