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
  BarChart3
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

const branchPerformance = [
  { name: 'Nairobi CBD', sales: 450000, color: '#eab308' },
  { name: 'Westlands', sales: 280000, color: '#334155' },
  { name: 'Mombasa Rd', sales: 340000, color: '#475569' },
  { name: 'Kisumu Hub', sales: 190000, color: '#1e293b' },
];

const COLORS = ['#eab308', '#334155', '#475569', '#1e293b'];

export default function OverviewView() {
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
        <StatCard title="Global Revenue" value="KES 1.2M" change="+12.5%" positive={true} icon={DollarSign} trend="up" />
        <StatCard title="Active Hubs" value="4 Branches" change="+1 Hub" positive={true} icon={Store} trend="up" color="gold" />
        <StatCard title="Staff Strength" value="12 Active" change="+2 Staff" positive={true} icon={Users} trend="up" />
        <StatCard title="Growth Vector" value="+24.3%" change="+2.1%" positive={true} icon={TrendingUp} trend="up" />
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
              <BarChart data={branchPerformance}>
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
                  {branchPerformance.map((entry, index) => (
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
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-12 relative z-10">Sector Portfolio Distribution</p>
          
          <div className="h-[240px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Retail', value: 450 },
                    { name: 'Wholesale', value: 300 },
                    { name: 'Agrovet', value: 250 },
                  ]}
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={10}
                  dataKey="value"
                  stroke="none"
                >
                  {COLORS.map((color, index) => (
                    <Cell key={`cell-${index}`} fill={color} cornerRadius={12} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#000B1A', borderRadius: '16px', border: '1px solid #1e293b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 space-y-4 relative z-10">
             {[
               { label: 'Retail Operations', color: 'bg-gold', value: '45%' },
               { label: 'Bulk Wholesale', color: 'bg-slate-700', value: '30%' },
               { label: 'Specialized (Agro)', color: 'bg-slate-800', value: '25%' }
             ].map((item, idx) => (
               <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-white tracking-widest">{item.value}</span>
               </div>
             ))}
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
