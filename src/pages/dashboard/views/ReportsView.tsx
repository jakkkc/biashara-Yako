import { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  AlertTriangle,
  Download,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Filter
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { collection, query, getDocs, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Sale, Product } from '../../../types';

const COLORS = ['#EAB308', '#3B82F6', '#10B981', '#F43F5E', '#8B5CF6'];

export default function ReportsView() {
  const [period, setPeriod] = useState<'Daily' | 'Weekly' | 'Monthly'>('Daily');
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchData();
    }
  }, [profile?.businessId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch Sales
      const salesSnap = await getDocs(
        query(
          collection(db, `businesses/${profile?.businessId}/sales`),
          orderBy('createdAt', 'desc'),
          limit(100)
        )
      );
      setSales(salesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));

      // Fetch Inventory for some stats
      const invSnap = await getDocs(
        query(collection(db, `businesses/${profile?.businessId}/inventory`))
      );
      setProducts(invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalSales = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const lowStock = products.filter(p => p.quantity <= p.reorderLevel).length;
    const inventoryValue = products.reduce((acc, p) => acc + (p.quantity * p.sellingPrice), 0);
    
    return {
      totalSales,
      lowStock,
      inventoryValue,
      transactionCount: sales.length
    };
  }, [sales, products]);

  const chartData = useMemo(() => {
    // Generate some simple time-series data from sales
    const grouped: any = {};
    sales.forEach(sale => {
      const date = new Date(sale.createdAt).toLocaleDateString();
      grouped[date] = (grouped[date] || 0) + sale.total;
    });

    return Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-7);
  }, [sales]);

  const categoryData = useMemo(() => {
    const counts: any = {};
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="animate-spin text-gold w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">Enterprise Analytics</h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Aggregated Intelligence Retrieval System</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-navy-muted border border-slate-800 rounded-2xl p-1">
             {(['Daily', 'Weekly', 'Monthly'] as const).map(p => (
               <button 
                 key={p}
                 onClick={() => setPeriod(p)}
                 className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === p ? 'bg-gold text-navy shadow-lg shadow-gold/10' : 'text-slate-500 hover:text-white'}`}
               >
                 {p}
               </button>
             ))}
          </div>
          <button className="w-14 h-14 bg-navy-muted border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500 hover:text-white transition-colors">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-navy-muted p-8 rounded-[40px] border border-slate-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-gold/10 border border-gold/20 rounded-2xl flex items-center justify-center">
              <TrendingUp className="text-gold w-6 h-6" />
            </div>
            <div className="flex items-center gap-1 text-green-500 font-black text-[10px]">
              <ArrowUpRight size={14} /> +12.5%
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Gross Revenue</p>
          <h3 className="text-3xl font-black text-white tracking-tighter italic">Ksh {stats.totalSales.toLocaleString()}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-navy-muted p-8 rounded-[40px] border border-slate-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center">
              <Package className="text-blue-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Asset Valuation</p>
          <h3 className="text-3xl font-black text-white tracking-tighter italic">Ksh {stats.inventoryValue.toLocaleString()}</h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-navy-muted p-8 rounded-[40px] border border-slate-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center">
              <AlertTriangle className="text-red-500 w-6 h-6" />
            </div>
            {stats.lowStock > 0 && (
              <div className="px-2 py-1 bg-red-500/20 border border-red-500/20 rounded-lg text-red-500 font-black text-[8px] uppercase tracking-widest">
                Critical
              </div>
            )}
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Deficit Alerts</p>
          <h3 className="text-3xl font-black text-white tracking-tighter italic">{stats.lowStock} <span className="text-sm font-bold text-slate-600 tracking-normal uppercase not-italic">Items</span></h3>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-navy-muted p-8 rounded-[40px] border border-slate-800 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 rounded-full" />
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <DollarSign className="text-emerald-500 w-6 h-6" />
            </div>
          </div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Terminal Activity</p>
          <h3 className="text-3xl font-black text-white tracking-tighter italic">{stats.transactionCount} <span className="text-sm font-bold text-slate-600 tracking-normal uppercase not-italic">Sales</span></h3>
        </motion.div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-navy-muted p-10 rounded-[40px] border border-slate-800 shadow-xl">
           <div className="flex items-center justify-between mb-10">
              <div>
                 <h3 className="text-2xl font-black text-white italic tracking-tighter">Revenue Momentum</h3>
                 <p className="text-slate-600 font-black text-[10px] uppercase tracking-widest mt-1">Timeline analysis of transaction influx</p>
              </div>
              <Filter className="text-slate-800" size={20} />
           </div>
           
           <div className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData}>
                    <defs>
                       <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#EAB308" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#EAB308" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                       dataKey="date" 
                       stroke="#64748b" 
                       fontSize={10} 
                       fontWeight="bold"
                       tickLine={false}
                       axisLine={false}
                       dy={10}
                    />
                    <YAxis 
                       stroke="#64748b" 
                       fontSize={10} 
                       fontWeight="bold"
                       tickLine={false}
                       axisLine={false}
                       tickFormatter={(value) => `Ksh ${value >= 1000 ? (value/1000).toFixed(1)+'k' : value}`}
                    />
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fff'
                       }}
                       cursor={{ stroke: '#EAB308', strokeWidth: 2 }}
                    />
                    <Area 
                       type="monotone" 
                       dataKey="amount" 
                       stroke="#EAB308" 
                       strokeWidth={4}
                       fillOpacity={1} 
                       fill="url(#colorAmount)" 
                    />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-navy-muted p-10 rounded-[40px] border border-slate-800 shadow-xl flex flex-col">
           <div className="mb-10">
              <h3 className="text-2xl font-black text-white italic tracking-tighter text-center">Sector Density</h3>
              <p className="text-slate-600 font-black text-[10px] uppercase tracking-widest mt-1 text-center">Operational footprint by classification</p>
           </div>

           <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                       data={categoryData}
                       cx="50%"
                       cy="50%"
                       innerRadius={80}
                       outerRadius={110}
                       paddingAngle={8}
                       dataKey="value"
                    >
                       {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                       ))}
                    </Pie>
                    <Tooltip 
                       contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          border: '1px solid #1e293b', 
                          borderRadius: '16px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                       }}
                    />
                 </PieChart>
              </ResponsiveContainer>
           </div>

           <div className="grid grid-cols-2 gap-4 mt-8">
              {categoryData.slice(0, 4).map((entry, index) => (
                <div key={entry.name} className="flex flex-col items-center p-4 bg-navy rounded-2xl border border-slate-800">
                   <div 
                      className="w-2 h-2 rounded-full mb-2" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }} 
                   />
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">{entry.name}</span>
                   <span className="text-white font-black">{entry.value} Items</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-navy-muted rounded-[40px] border border-slate-800 shadow-xl overflow-hidden">
         <div className="p-10 flex items-center justify-between border-b border-slate-800">
            <div>
               <h3 className="text-2xl font-black text-white italic tracking-tighter">Terminal Ledger</h3>
               <p className="text-slate-600 font-black text-[10px] uppercase tracking-widest mt-1">Real-time synchronization of enterprise exchanges</p>
            </div>
            <button className="px-6 py-2.5 bg-navy border border-slate-800 rounded-xl text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">
               View All
            </button>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left">
               <thead>
                  <tr className="bg-slate-800/10 text-slate-500 uppercase text-[9px] font-black tracking-[0.3em] border-b border-slate-800">
                     <th className="px-10 py-6">Timestamp</th>
                     <th className="px-6 py-6">Operation ID</th>
                     <th className="px-6 py-6">Personnel</th>
                     <th className="px-6 py-6 text-center">Status</th>
                     <th className="px-10 py-6 text-right">Value</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-800/50">
                  {sales.slice(0, 5).map((sale) => (
                     <tr key={sale.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-10 py-6">
                           <span className="text-slate-400 font-bold text-xs uppercase">{new Date(sale.createdAt).toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-6">
                           <span className="text-white font-mono font-black text-xs tracking-tighter uppercase">{sale.id.split('-').pop()}</span>
                        </td>
                        <td className="px-6 py-6">
                           <span className="text-white font-bold text-sm tracking-tight">{sale.userName}</span>
                        </td>
                        <td className="px-6 py-6 text-center">
                           <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-[9px] font-black uppercase tracking-widest">
                              Authorized
                           </span>
                        </td>
                        <td className="px-10 py-6 text-right">
                           <span className="text-xl font-black text-white italic tracking-tighter">Ksh {sale.total.toLocaleString()}</span>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <div className="p-8 bg-slate-800/10 text-center">
            <span className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">End of Sync Segment</span>
         </div>
      </div>
    </div>
  );
}
