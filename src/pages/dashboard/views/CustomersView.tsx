import { Users } from 'lucide-react';

export default function CustomersView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Customer Management</h1>
        <p className="text-slate-500">Build relationships and track loyalty.</p>
      </div>
      <div className="bg-navy-muted p-20 rounded-[40px] border border-dashed border-slate-800 text-center text-slate-500">
         <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <Users className="text-slate-700 w-8 h-8" />
         </div>
         <p className="font-bold uppercase tracking-widest text-[10px]">Customer database is empty</p>
         <p className="text-xs mt-2">New customers will appear here once they make their first purchase.</p>
      </div>
    </div>
  );
}
