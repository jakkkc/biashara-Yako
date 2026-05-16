import React from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection } from '../../hooks/useFirestore';
import { where, limit, orderBy } from 'firebase/firestore';
import { 
  TrendingUp, 
  ShoppingBag, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight,
  Sparkles
} from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../utils/formatters';
import { KPICard } from '../../components/ui/KPICard';
import { Sale } from '../../types';

export default function Dashboard() {
  const { userProfile } = useAuth();
  
  const { data: recentSales, loading: salesLoading } = useCollection<Sale>('sales', [
    where('businessId', '==', userProfile?.businessId),
    orderBy('createdAt', 'desc'),
    limit(5)
  ]);

  const totalSales = recentSales.reduce((acc, sale) => acc + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Habari, {userProfile?.name.split(' ')[0]}!</h1>
          <p className="text-slate-400">Here is what's happening in your business today.</p>
        </div>
        
        <button className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl hover:bg-indigo-500/20 transition-all">
          <Sparkles className="w-4 h-4" />
          Get AI Insights
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Daily Sales" 
          value={formatCurrency(totalSales)} 
          trend="+12.5%" 
          trendUp={true} 
          icon={TrendingUp} 
          color="indigo" 
        />
        <KPICard 
          title="Transactions" 
          value={recentSales.length.toString()} 
          trend="+3" 
          trendUp={true} 
          icon={ShoppingBag} 
          color="purple" 
        />
        <KPICard 
          title="Expenses" 
          value={formatCurrency(12500)} 
          trend="-2.4%" 
          trendUp={false} 
          icon={Wallet} 
          color="pink" 
        />
        <KPICard 
          title="Cash in Hand" 
          value={formatCurrency(45800)} 
          icon={ArrowUpRight} 
          color="emerald" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Activity */}
        <GlassCard className="lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Recent Sales</h3>
              <p className="text-xs text-slate-500">Live transaction feed from your POS</p>
            </div>
            <button className="text-xs text-indigo-400 font-bold uppercase tracking-wider hover:underline px-3 py-1 bg-indigo-500/10 rounded-full border border-indigo-500/20 transition-colors">View all records</button>
          </div>
          
          <div className="space-y-4">
            {salesLoading ? (
              [1,2,3].map(i => <div key={i} className="h-16 bg-slate-950/50 rounded-2xl animate-pulse"></div>)
            ) : recentSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-2xl">
                <ShoppingBag className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-center text-slate-600 text-sm">No sales recorded yet.</p>
              </div>
            ) : recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 bg-slate-950/30 rounded-2xl border border-slate-800/50 hover:border-indigo-500/30 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{formatCurrency(sale.total)}</p>
                    <p className="text-[10px] micro-label !text-slate-500">{sale.paymentMethod} • {formatRelativeTime(sale.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <span className="text-[10px] font-mono text-slate-600">ID: {sale.id?.slice(-6).toUpperCase()}</span>
                   <ArrowUpRight className="w-4 h-4 text-slate-600" />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* AI Insight Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="p-6 overflow-hidden relative min-h-[280px] flex flex-col justify-between">
            <div className="absolute -top-4 -right-4 p-4 opacity-5">
              <Sparkles className="w-32 h-32 text-indigo-400" />
            </div>
            
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">AI Assistant</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-mono">MODEL: GEMINI-PRO-1.5</p>
              
              <div className="space-y-4 relative">
                <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                  <p className="text-xs font-bold text-indigo-300 mb-1 uppercase tracking-tighter">Restock Alert</p>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    "Milk Pack 1L" is selling 40% faster than usual. Restock suggested.
                  </p>
                </div>
                
                <div className="p-4 bg-slate-950/50 border border-slate-800 rounded-2xl">
                  <p className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-tighter">Peak Time</p>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Your busiest hour is between 4 PM and 6 PM.
                  </p>
                </div>
              </div>
            </div>

            <button className="w-full btn-accent !py-3 text-sm mt-6">
              Detail Insight
            </button>
          </GlassCard>

          <div className="bg-indigo-600 rounded-3xl p-6 relative overflow-hidden h-[180px] flex flex-col justify-between">
            <div className="relative z-10">
              <h4 className="text-white font-bold text-lg">System Health</h4>
              <p className="text-indigo-100 text-xs opacity-80">All services operational</p>
            </div>
            <div className="relative z-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-mono text-white opacity-60">SYNCING_LOCAL_DB...</span>
            </div>
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-3xl shadow-2xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
