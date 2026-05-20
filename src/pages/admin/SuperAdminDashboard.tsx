import { useState } from 'react';
import { LayoutDashboard, Users, Store, ShieldAlert, BarChart, Settings, Search, MoreVertical } from 'lucide-react';

export default function SuperAdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Admin Sidebar */}
      <aside className="w-72 bg-navy text-white flex flex-col pt-8 border-r border-white/5">
        <div className="px-8 mb-12 flex items-center gap-2">
           <ShieldAlert className="text-gold w-8 h-8" />
           <span className="text-xl font-bold tracking-tight uppercase">Super <span className="text-gold">Admin</span></span>
        </div>
        <nav className="flex-1 px-4 space-y-2">
           <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-gold text-navy font-bold transition-all">
              <LayoutDashboard size={22} /> System Status
           </button>
           <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all text-left">
              <Store size={22} /> Businesses
           </button>
           <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all text-left">
              <BarChart size={22} /> Aggregate Analytics
           </button>
           <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 font-bold transition-all text-left">
              <Settings size={22} /> Platform Settings
           </button>
        </nav>
        <div className="p-8 border-t border-white/5">
           <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-2">Systems Operator</p>
           <p className="font-bold text-sm">Jackson Mwaniki</p>
           <p className="text-xs text-gold">jacmwaniki@gmail.com</p>
        </div>
      </aside>

      {/* Admin Main */}
      <main className="flex-1 p-12">
        <header className="flex justify-between items-center mb-12">
           <div>
              <h1 className="text-4xl font-black text-navy italic">Global Control Center</h1>
              <p className="text-slate-500">Managing the pulse of Biashara Yako platform.</p>
           </div>
           <div className="flex gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <input 
                   type="text" 
                   placeholder="Search businesses..." 
                   className="w-96 h-14 pl-12 pr-4 bg-white border border-slate-200 rounded-2xl shadow-sm outline-none"
                 />
              </div>
           </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
           <AdminStatCard title="Total Businesses" value="128" change="+12" icon={Store} />
           <AdminStatCard title="Total Transactions" value="Ksh 1.2M" change="+450k" icon={BarChart} />
           <AdminStatCard title="Active Users" value="842" change="+24" icon={Users} />
        </div>

        <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-navy">Registered Businesses</h2>
              <button className="text-sm font-bold text-gold">View All</button>
           </div>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                   <tr className="bg-slate-50 text-slate-400 text-[10px] font-black tracking-widest uppercase">
                      <th className="px-8 py-4">Business Name</th>
                      <th className="px-6 py-4">Owner</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Sales</th>
                      <th className="px-8 py-4 text-right">Action</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {[
                     { name: 'Nairobi Groceries', owner: 'john@gmail.com', plan: 'Premium', status: 'Active', sales: 'Ksh 45k' },
                     { name: 'Mombasa Hardware', owner: 'musa@outlook.com', plan: 'Free', status: 'Active', sales: 'Ksh 12k' },
                     { name: 'Nakuru Boutique', owner: 'sarah@gmail.com', plan: 'Basic', status: 'Suspended', sales: 'Ksh 0' },
                   ].map((biz, i) => (
                     <tr key={i} className="hover:bg-slate-50/50 transition-all group">
                        <td className="px-8 py-6 font-bold text-navy">{biz.name}</td>
                        <td className="px-6 py-6 text-slate-500">{biz.owner}</td>
                        <td className="px-6 py-6">
                           <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                             biz.plan === 'Premium' ? 'bg-gold/10 text-gold-light' : 'bg-slate-100 text-slate-400'
                           }`}>
                              {biz.plan}
                           </span>
                        </td>
                        <td className="px-6 py-6">
                           <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${biz.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`} />
                              <span className="text-sm font-medium">{biz.status}</span>
                           </div>
                        </td>
                        <td className="px-6 py-6 font-bold text-navy">{biz.sales}</td>
                        <td className="px-8 py-6 text-right">
                           <button className="p-2 text-slate-300 hover:text-navy hover:bg-slate-100 rounded-xl transition-all">
                              <MoreVertical size={20} />
                           </button>
                        </td>
                     </tr>
                   ))}
                </tbody>
              </table>
           </div>
        </div>
      </main>
    </div>
  );
}

function AdminStatCard({ title, value, change, icon: Icon }: any) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
       <div className="flex justify-between items-start mb-6">
          <div className="w-14 h-14 bg-navy/5 rounded-2xl flex items-center justify-center text-navy">
             <Icon size={28} />
          </div>
          <span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-1 rounded-lg">
             {change}
          </span>
       </div>
       <p className="text-slate-500 font-medium mb-1">{title}</p>
       <h4 className="text-3xl font-black text-navy">{value}</h4>
    </div>
  );
}
