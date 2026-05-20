import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Package, 
  ShoppingCart, 
  ArrowUpRight, 
  ArrowDownRight,
  Clock,
  MoreVertical,
  Store,
  DollarSign,
  Users,
  BarChart3,
  Loader2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { collection, query, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Sale, Branch, Product, UserProfile } from '../../../types';

const COLORS = ['#eab308', '#334155', '#475569', '#1e293b'];

export default function OverviewView() {
  const [stats, setStats] = useState({
    revenue: 0,
    hubs: 0,
    staff: 0,
    inventory: 0
  });
  const [salesByBranch, setSalesByBranch] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchDashboardData();
    }
  }, [profile?.businessId]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const bizId = profile?.businessId;
      
      // 1. Fetch Sales
      const salesSnap = await getDocs(query(collection(db, `businesses/${bizId}/sales`), limit(500)));
      const sales = salesSnap.docs.map(d => d.data() as Sale);
      const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);

      // 2. Fetch Branches
      const branchesSnap = await getDocs(collection(db, `businesses/${bizId}/branches`));
      const hubsCount = branchesSnap.size;
      const branches = branchesSnap.docs.map(d => d.data() as Branch);

      // 3. Fetch Staff
      // Note: This requires the fixed query from UsersView logic if we wanted filtering, 
      // but for dashboard stats, we can fetch all business users
      const usersSnap = await getDocs(collection(db, 'users'));
      const staffCount = usersSnap.docs.filter(d => d.data().businessId === bizId).length;

      // 4. Group Sales by Branch for Chart
      const branchPerformance = branches.map(b => {
        const branchSales = sales.filter(s => s.branchId === b.id).reduce((acc, s) => acc + s.total, 0);
        return { name: b.name, sales: branchSales };
      });

      setStats({
        revenue: totalRevenue,
        hubs: hubsCount,
        staff: staffCount,
        inventory: 0 // Could fetch inventory too if needed
      });
      setSalesByBranch(branchPerformance.length > 0 ? branchPerformance : [{ name: 'N/A', sales: 0 }]);

    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
         <Loader2 className="animate-spin text-gold w-10 h-10" />
         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest tracking-[0.2em]">Synchronizing matrix peripherals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-white tracking-tighter italic">Enterprise Matrix.</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Consortium Performance Dashboard • v2.4.0</p>
        </div>
        <div className="flex bg-navy-muted p-1.5 rounded-2xl border border-slate-800">
           <button className="px-6 py-2.5 bg-gold text-navy rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Network</button>
           <button className="px-6 py-2.5 text-slate-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Hub Level</button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard title="Global Revenue" value={`KES ${stats.revenue.toLocaleString()}`} change={stats.revenue > 0 ? "+NEW" : "0%"} positive={true} icon={DollarSign} trend="up" />
        <StatCard title="Active Hubs" value={`${stats.hubs} Branches`} icon={Store} trend="up" color="gold" />
        <StatCard title="Staff Strength" value={`${stats.staff} Active`} icon={Users} trend="up" />
        <StatCard title="Growth Vector" value={stats.revenue > 0 ? "LIVE" : "IDLE"} icon={TrendingUp} trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Branch Comparison Area */}
        <div className="lg:col-span-2 bg-navy-muted p-10 rounded-[40px] border border-slate-800 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gold/5 blur-[100px] -mr-40 -mt-40 rounded-full" />
          <div className="flex items-center justify-between mb-12 relative z-10">
            <div>
               <h3 className="text-2xl font-black text-white italic tracking-tighter">Branch Performance Matrix</h3>
               <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Real-time Comparison Across Operational Hubs</p>
            </div>
            <BarChart3 className="text-gold/20" size={32} />
          </div>
          
          <div className="h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesByBranch}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#475569', fontSize: 10, fontWeight: 900, textAnchor: 'middle'}} 
                  dy={15} 
                />
                <YAxis hide />
                <Tooltip 
                   cursor={{ fill: 'rgba(234, 179, 8, 0.05)' }}
                   contentStyle={{ backgroundColor: '#000B1A', borderRadius: '16px', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                />
                <Bar dataKey="sales" radius={[12, 12, 0, 0]} barSize={50}>
                  {salesByBranch.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Sales Mix */}
        <div className="bg-navy-muted p-10 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 blur-[80px] -mr-24 -mt-24" />
          <h3 className="text-2xl font-black text-white italic tracking-tighter mb-2 relative z-10">Revenue Mix</h3>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-12 relative z-10">Consortium Overview</p>
          
          <div className="h-24 flex items-center justify-center">
             <Store size={48} className="text-gold/30 animate-pulse" />
          </div>

          <div className="mt-auto space-y-4 relative z-10">
             <div className="p-6 rounded-[32px] bg-gold/5 border border-gold/10">
                <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                  Consolidated enterprise metrics are updated in real-time across the secure network. 
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive, icon: Icon, color, trend }: any) {
  const isGold = color === 'gold';
  
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-navy-muted p-10 rounded-[40px] border border-slate-800 shadow-xl relative overflow-hidden group hover:border-gold/30 transition-all"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
            isGold 
              ? 'bg-gold/10 text-gold border border-gold/20 shadow-lg shadow-gold/5' 
              : 'bg-navy border border-slate-800 text-slate-500 shadow-inner'
          }`}>
            <Icon size={28} strokeWidth={1.5} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
              positive ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
            }`}>
              {trend === 'up' ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mb-2">{title}</p>
          <h4 className="text-3xl font-black text-white italic tracking-tighter">{value}</h4>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all opacity-0 group-hover:opacity-100" />
    </motion.div>
  );
}
