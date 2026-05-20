import { useAuth } from '../../../hooks/useAuth';

export default function SettingsView() {
  const { profile } = useAuth();
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Business Settings</h1>
        <p className="text-slate-500">Configure your business, branches, and staff.</p>
      </div>
      <div className="bg-navy-muted rounded-[40px] border border-slate-800 shadow-sm p-10 max-w-2xl">
         <h3 className="text-xl font-bold text-white mb-10 tracking-tight italic">Profile Parameters</h3>
         <div className="space-y-8">
            <div className="flex justify-between border-b border-slate-800/50 pb-5">
               <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Identity</span>
               <span className="font-bold text-white tracking-tight">{profile?.displayName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-5 items-center">
               <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">System Privilege</span>
               <span className="px-4 py-1.5 bg-gold text-navy rounded-xl text-[10px] font-black uppercase tracking-widest">{profile?.role || 'Principal'}</span>
            </div>
            <div className="flex justify-between border-b border-slate-800/50 pb-5">
               <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Consortium ID</span>
               <span className="font-mono text-xs text-gold font-bold">{profile?.businessId || 'BY-SEC-XXXX'}</span>
            </div>
         </div>
      </div>
    </div>
  );
}
