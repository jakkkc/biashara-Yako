import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { User, Shield, Bell, Moon, Trash2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { userProfile, firebaseUser, signOut } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-display font-bold">Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-2">
          <SettingsTab icon={User} label="Profile" active />
          <SettingsTab icon={Shield} label="Security" />
          <SettingsTab icon={Bell} label="Notifications" />
          <SettingsTab icon={Moon} label="Appearance" />
        </div>

        <div className="md:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <h3 className="text-lg font-bold mb-6">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center text-2xl font-bold text-indigo-400">
                  {userProfile?.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold">{userProfile?.name}</p>
                  <p className="text-sm text-slate-400">{userProfile?.email}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase rounded-full">
                    {userProfile?.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Manager UID</label>
                  <input readOnly value={userProfile?.uid} className="w-full glass-input text-xs opacity-50" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Authentication</label>
                  <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-[10px] font-bold text-emerald-400 uppercase text-center">
                    Verified via Google
                  </div>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-red-500/20">
            <h3 className="text-lg font-bold text-red-400 mb-6 font-display">Danger Zone</h3>
            <div className="space-y-4">
              <button 
                onClick={signOut}
                className="w-full flex items-center justify-between p-4 bg-red-500/5 hover:bg-red-500/10 rounded-xl border border-red-500/10 text-red-400 transition-all"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-bold">Sign Out</p>
                    <p className="text-xs opacity-70">Log out of this session safely.</p>
                  </div>
                </div>
              </button>
              
              {userProfile?.role !== 'super_admin' && (
                <button className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-red-500/10 rounded-xl border border-white/5 hover:border-red-500/20 text-slate-500 hover:text-red-400 transition-all">
                  <div className="flex items-center gap-3">
                    <Trash2 className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-bold">Delete Account</p>
                      <p className="text-xs opacity-70">Permanently remove your business and all data.</p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
      <Icon className="w-5 h-5" />
      <span className="font-semibold">{label}</span>
    </button>
  );
}
