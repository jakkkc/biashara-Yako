import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Calendar, 
  BadgeCent, 
  ArrowUpRight, 
  FileText,
  Filter,
  MoreVertical,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Transport', 'Maintenance', 'Miscellaneous'];

const dummyExpenses = [
  { id: '1', category: 'Rent', amount: 25000, date: '2026-05-15', description: 'May Store Rent', logger: 'Jackson Munene' },
  { id: '2', category: 'Utilities', amount: 4500, date: '2026-05-18', description: 'Electricity bill', logger: 'Jane Doe' },
  { id: '3', category: 'Supplies', amount: 12000, date: '2026-05-19', description: 'Stock restocking packaging', logger: 'Jackson Munene' },
  { id: '4', category: 'Transport', amount: 1500, date: '2026-05-20', description: 'Delivery of milk stock', logger: 'Peter Kimani' },
];

export default function ExpensesView() {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expense Management</h1>
          <p className="text-slate-400">Record and monitor your business operational costs.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 bg-gold text-navy rounded-xl font-bold text-sm hover:bg-gold-light shadow-lg shadow-gold/10 transition-all flex items-center gap-2"
        >
          <Plus size={18} /> Log New Expense
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-6">
          {/* Filters */}
          <div className="bg-navy-muted p-4 rounded-2xl border border-slate-800 shadow-sm flex gap-4">
             <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Search expenses..." 
                  className="w-full h-11 pl-12 pr-4 bg-navy border border-transparent focus:border-slate-700 rounded-xl text-sm transition-all outline-none text-white"
                />
             </div>
             <button className="px-4 py-2 bg-navy border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center gap-2 transition-all">
                <Filter size={18} /> Category
             </button>
             <button className="px-4 py-2 bg-navy border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 font-bold text-sm flex items-center gap-2 transition-all">
                <Calendar size={18} /> This Month
             </button>
          </div>

          {/* Expense List */}
          <div className="bg-navy-muted rounded-3xl border border-slate-800 shadow-sm overflow-hidden">
             <div className="divide-y divide-slate-800/50">
                {dummyExpenses.map((exp) => (
                  <div key={exp.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-all group">
                     <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-navy rounded-2xl flex items-center justify-center text-gold shrink-0 border border-slate-800 transition-all group-hover:border-gold/30">
                           <BadgeCent size={28} />
                        </div>
                        <div>
                           <p className="font-bold text-white text-lg group-hover:text-gold transition-colors">{exp.description}</p>
                           <div className="flex items-center gap-3 mt-1.5">
                              <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-black uppercase tracking-widest">{exp.category}</span>
                              <span className="text-xs text-slate-500 font-bold tracking-tight">By {exp.logger} • {exp.date}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-8">
                        <div className="text-right">
                           <p className="text-xl font-black text-white leading-none mb-1.5 pointer-events-none tracking-tight">Ksh {exp.amount.toLocaleString()}</p>
                           <p className="text-[10px] font-black text-gold bg-gold/10 px-2 py-0.5 rounded tracking-widest uppercase inline-block">PAID</p>
                        </div>
                        <button className="p-2 text-slate-500 hover:text-white transition-colors">
                           <MoreVertical size={20} />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
             <div className="p-6 bg-slate-800/20 border-t border-slate-800 flex justify-center">
                <button className="text-xs font-bold text-slate-500 hover:text-gold transition-all uppercase tracking-widest">View full expense log</button>
             </div>
          </div>
        </div>

        {/* Categories Summary */}
        <div className="space-y-6">
           <div className="bg-navy-muted text-white p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden group">
              <div className="relative z-10">
                 <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1 font-mono">Total Spent 30D</p>
                 <h2 className="text-4xl font-black mb-6 tracking-tight">Ksh 43.1k</h2>
                 <div className="flex items-center gap-2 text-gold font-bold text-xs uppercase tracking-widest">
                    <TrendingUp size={16} /> 4.2% from last month
                 </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 group-hover:bg-gold/10 transition-all" />
           </div>

           <div className="bg-navy-muted p-7 rounded-3xl border border-slate-800 shadow-sm">
              <h3 className="font-bold text-white mb-8 flex items-center gap-2.5">
                 <FileText size={18} className="text-gold" />
                 <span className="tracking-tight">Top Categories</span>
              </h3>
              <div className="space-y-6">
                 {[
                   { name: 'Rent', amount: 25000, pct: 58 },
                   { name: 'Supplies', amount: 12000, pct: 28 },
                   { name: 'Utilities', amount: 4500, pct: 10 },
                   { name: 'Transport', amount: 1500, pct: 4 },
                 ].map(item => (
                   <div key={item.name}>
                      <div className="flex justify-between items-center mb-2.5">
                         <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.name}</span>
                         <span className="text-xs text-white font-black font-mono">Ksh {item.amount}</span>
                      </div>
                      <div className="h-1.5 w-full bg-navy rounded-full overflow-hidden">
                         <div className="h-full bg-gold rounded-full opacity-70" style={{ width: `${item.pct}%` }} />
                      </div>
                   </div>
                 ))}
              </div>
              <button className="w-full mt-10 py-3.5 border border-slate-800 rounded-xl text-slate-500 text-[10px] font-black uppercase tracking-widest hover:border-gold/30 hover:text-gold transition-all">
                 Full Analytics
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}
