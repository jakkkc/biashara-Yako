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
  MoreVertical
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

const dummySalesData = [
  { name: 'Mon', sales: 4000, expenses: 2400 },
  { name: 'Tue', sales: 3000, expenses: 1398 },
  { name: 'Wed', sales: 2000, expenses: 9800 },
  { name: 'Thu', sales: 2780, expenses: 3908 },
  { name: 'Fri', sales: 1890, expenses: 4800 },
  { name: 'Sat', sales: 2390, expenses: 3800 },
  { name: 'Sun', sales: 3490, expenses: 4300 },
];

const dummyPieData = [
  { name: 'Supplies', value: 400 },
  { name: 'Rent', value: 300 },
  { name: 'Salaries', value: 300 },
  { name: 'Transport', value: 200 },
];

const COLORS = ['#eab308', '#334155', '#475569', '#1e293b'];

export default function OverviewView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Business Overview</h1>
          <p className="text-slate-400">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex gap-2">
           <select className="bg-navy-muted border border-slate-800 px-4 py-2.5 rounded-xl text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all appearance-none pr-10 relative">
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
           </select>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Sales (Today)" 
          value="Ksh 42,550" 
          change="+12.5%" 
          positive={true} 
          icon={ShoppingCart} 
        />
        <StatCard 
          title="Monthly Profit" 
          value="Ksh 840,200" 
          change="+8.2%" 
          positive={true} 
          icon={Wallet} 
          color="gold"
        />
        <StatCard 
          title="Net Profit" 
          value="Ksh 32,800" 
          change="+8.4%" 
          positive={true} 
          icon={TrendingUp} 
        />
        <StatCard 
          title="Low Stock Alerts" 
          value="14 Items" 
          subtitle="Requires restock" 
          icon={Package} 
          color="red"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-navy-muted p-8 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gold/5 blur-3xl -mr-32 -mt-32 rounded-full" />
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold text-white">Sales vs Expenses</h3>
            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gold" /> Sales</div>
               <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Expenses</div>
            </div>
          </div>
          <div className="h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dummySalesData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#eab308" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#eab308" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#475569', fontSize: 10, fontWeight: 'bold'}} dx={-10} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                   labelStyle={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#eab308" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#334155" strokeWidth={2} fillOpacity={0} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenses Pie */}
        <div className="bg-navy-muted p-8 rounded-3xl border border-slate-800 shadow-sm flex flex-col">
          <h3 className="text-xl font-bold text-white mb-8">Expense Breakdown</h3>
          <div className="flex-1 flex flex-col justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dummyPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {dummyPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b' }}
                     itemStyle={{ color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-8 space-y-4">
              {dummyPieData.map((item, idx) => (
                <div key={item.name}>
                   <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2">
                         <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx]}} />
                         <span className="text-slate-400 font-bold uppercase tracking-widest">{item.name}</span>
                      </div>
                      <span className="font-bold text-white">Ksh {item.value}k</span>
                   </div>
                   <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gold rounded-full opacity-60" style={{ width: `${(item.value / 400) * 100}%` }} />
                   </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Recent Transactions */}
         <div className="bg-navy-muted rounded-3xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
               <h3 className="text-xl font-bold text-white">Recent Transactions</h3>
               <button className="text-xs font-bold text-gold hover:text-white transition-all uppercase tracking-widest flex items-center gap-1.5">
                  View All Log <ArrowUpRight size={14} />
               </button>
            </div>
            <div className="flex-1 overflow-hidden">
               <table className="w-full text-left">
                  <thead className="bg-slate-800/20 text-[10px] uppercase text-slate-500 font-bold tracking-widest border-b border-slate-800/50">
                     <tr>
                        <th className="px-6 py-4">Transaction ID</th>
                        <th className="px-6 py-4">Date & Time</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-sm">
                     {[1, 2, 3, 4, 5].map((i) => (
                       <tr key={i} className="hover:bg-white/5 transition-all group">
                          <td className="px-6 py-5">
                             <span className="font-mono text-slate-400">#BY-940{i}</span>
                          </td>
                          <td className="px-6 py-5">
                             <div className="flex flex-col">
                                <span className="text-slate-300 font-medium">May 20, 2026</span>
                                <span className="text-[10px] text-slate-500 font-bold">2:30 PM • CASH</span>
                             </div>
                          </td>
                          <td className="px-6 py-5 text-right">
                             <span className="font-bold text-white group-hover:text-gold transition-colors">Ksh 1,450.00</span>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         {/* Top Selling Products */}
         <div className="bg-navy-muted rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
               <h3 className="text-xl font-bold text-white">Top Performance</h3>
               <div className="px-3 py-1 bg-slate-800/50 rounded-lg text-[10px] text-slate-400 font-bold tracking-widest uppercase">7 Days</div>
            </div>
            <div className="p-8 space-y-8">
               {[
                 { name: 'Ajab Flour 2kg', sales: 120, progress: 85, color: '#eab308' },
                 { name: 'Kabras Sugar 1kg', sales: 98, progress: 65, color: '#475569' },
                 { name: 'Fresh Milk 500ml', sales: 74, progress: 45, color: '#334155' },
                 { name: 'Cooking Oil 1L', sales: 42, progress: 30, color: '#1e293b' },
               ].map((product) => (
                 <div key={product.name}>
                    <div className="flex justify-between mb-2.5 items-end">
                       <div>
                          <p className="font-bold text-white mb-0.5">{product.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Fast Moving</p>
                       </div>
                       <span className="text-xs text-gold font-bold">{product.sales} sales</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className="h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                         style={{ width: `${product.progress}%`, backgroundColor: product.color }}
                       />
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, positive, icon: Icon, color, subtitle }: any) {
  const isRed = color === 'red';
  const isGold = color === 'gold';
  
  return (
    <div className="bg-navy-muted p-7 rounded-3xl border border-slate-800 shadow-sm relative overflow-hidden group hover:border-slate-700 transition-all">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
            isRed 
              ? 'bg-red-500/10 text-red-500 border border-red-500/20' 
              : isGold 
                ? 'bg-gold/10 text-gold border border-gold/20 shadow-lg shadow-gold/5' 
                : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            <Icon size={24} />
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${
              positive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
            }`}>
              {positive ? <ArrowUpRight size={10} strokeWidth={3} /> : <ArrowDownRight size={10} strokeWidth={3} />}
              {change}
            </div>
          )}
        </div>
        <div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
          <h4 className="text-3xl font-bold text-white tracking-tight">{value}</h4>
          {subtitle && <p className="text-[10px] text-red-500 font-bold mt-2 uppercase tracking-widest opacity-80">{subtitle}</p>}
        </div>
      </div>
      <div className={`absolute -bottom-1 left-0 right-0 h-1 transition-all ${
        isRed ? 'bg-red-500/20' : isGold ? 'bg-gold/20' : 'bg-slate-700/20'
      }`} />
    </div>
  );
}
