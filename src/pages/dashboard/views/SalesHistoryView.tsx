import { History } from 'lucide-react';

export default function SalesHistoryView() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Sales History</h1>
        <p className="text-slate-500">View and manage all your branch transactions.</p>
      </div>
      <div className="bg-navy-muted p-20 rounded-[40px] border border-dashed border-slate-800 text-center text-slate-500">
         <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-800">
            <History className="text-slate-700 w-8 h-8" />
         </div>
         <p className="font-bold uppercase tracking-widest text-[10px]">No transaction history discovered</p>
         <p className="text-xs mt-2">Complete your first sale in the POS terminal to populate this registry.</p>
      </div>
    </div>
  );
}
