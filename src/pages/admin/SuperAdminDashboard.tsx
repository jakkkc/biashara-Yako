import React, { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Business, Sale } from '../../types';
import { Building2, TrendingUp, ShoppingBag, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalRevenue: 0,
    totalUsers: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      const bSnap = await getDocs(query(collection(db, 'businesses')));
      const businesses = bSnap.docs.map(d => d.data() as Business);
      
      const uSnap = await getDocs(query(collection(db, 'users')));
      
      const sSnap = await getDocs(query(collection(db, 'sales')));
      const sales = sSnap.docs.map(d => d.data() as Sale);

      setStats({
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter(b => b.status === 'active').length,
        totalRevenue: sales.reduce((acc, s) => acc + s.total, 0),
        totalUsers: uSnap.size
      });
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8 relative z-10">
      <div>
        <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Platform Overview</h1>
        <p className="text-slate-400 font-medium mt-1">Global statistics across all registered businesses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GlobalStatCard title="Total Businesses" value={stats.totalBusinesses.toString()} icon={Building2} color="text-blue-400" bgColor="bg-blue-600/20" />
        <GlobalStatCard title="Active Units" value={stats.activeBusinesses.toString()} icon={CheckCircle} color="text-emerald-400" bgColor="bg-emerald-600/20" />
        <GlobalStatCard title="Platform Revenue" value={formatCurrency(stats.totalRevenue)} icon={TrendingUp} color="text-violet-400" bgColor="bg-violet-600/20" />
        <GlobalStatCard title="Total Users" value={stats.totalUsers.toString()} icon={Users} color="text-orange-400" bgColor="bg-orange-600/20" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card p-10 rounded-[40px] shadow-sm border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-24 -top-24 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full group-hover:bg-blue-500/10 transition-all" />
          <h3 className="text-xl font-bold mb-8 font-serif text-white tracking-tight relative z-10">System Health</h3>
          <div className="space-y-4 relative z-10">
            <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-emerald-600/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-300">Firebase Operations</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Optimal</span>
            </div>
            <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl transition hover:bg-white/10">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
                  <Users className="w-5 h-5" />
                </div>
                <span className="font-bold text-slate-300">User Authentication</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Connected</span>
            </div>
          </div>
        </div>

        <div className="glass-card p-10 rounded-[40px] shadow-sm border border-white/10 relative overflow-hidden flex flex-col justify-center items-center">
          <div className="absolute inset-0 bg-white/[0.02] pointer-events-none" />
          <h3 className="text-xl font-bold mb-8 font-serif text-white tracking-tight absolute top-10 left-10">System Alerts</h3>
          <div className="flex flex-col items-center justify-center space-y-4 opacity-40">
            <div className="p-5 bg-white/5 rounded-full border border-white/5">
              <AlertCircle className="w-12 h-12 text-slate-500" />
            </div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-600">No critical alerts</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GlobalStatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", bgColor, color)}>
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</p>
      <h4 className="text-3xl font-black text-white mt-2 tracking-tight">{value}</h4>
    </div>
  );
}

import { CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
