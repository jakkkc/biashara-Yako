import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Settings, 
  Save, 
  Building, 
  ShieldCheck, 
  Database,
  Grid,
  Percent,
  Coins,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { CURRENCY_OPTIONS } from '../utils/constants';
import toast from 'react-hot-toast';

export const SettingsPage: React.FC = () => {
  const { user, business } = useAuth();
  const { updateBusinessProfile } = useFirestore();

  // Settings State sheets
  const [form, setForm] = useState({
    name: '',
    taxRate: 16,
    currencyCode: 'KES',
    backupEmail: '',
    address: ''
  });

  const [saving, setSaving] = useState(false);

  // Load initial settings
  useEffect(() => {
    if (business) {
      setForm({
        name: business.name || '',
        taxRate: business.taxRate ?? 16,
        currencyCode: business.currency?.code || 'KES',
        backupEmail: business.backupEmail || '',
        address: business.address || ''
      });
    }
  }, [business]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'taxRate' ? Number(value) : value
    }));
  };

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      toast.error('Business Company name is required.');
      return;
    }

    setSaving(true);
    // Find currency config matching code
    const matchedCoin = CURRENCY_OPTIONS.find((c) => c.code === form.currencyCode) || CURRENCY_OPTIONS[0];

    const updates = {
      name: form.name,
      taxRate: form.taxRate,
      currency: matchedCoin,
      backupEmail: form.backupEmail,
      address: form.address,
      updatedAt: new Date().toISOString()
    };

    const success = await updateBusinessProfile(updates);
    setSaving(false);
    if (success) {
      toast.success('Marekebisho yamehifadhiwa! Business settings saved.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Title blocks */}
      <div className="border-b border-slate-900 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          Mipangilio ya Mfumo / Settings Panel
        </h2>
        <span className="text-[10px] text-slate-500 font-mono">
          Configure tax models, base currency multipliers, and register corporate offices.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Primary form fields (col: 8) */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSaveSubmit}>
            <GlassCard className="border-indigo-500/10 p-5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-900 pb-3">
                <Building className="h-4.5 w-4.5 text-indigo-400" /> Identity Profile
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Registered Company Name"
                  name="name"
                  placeholder="E.g. Mwanyiki General Stores Ltd"
                  value={form.name}
                  onChange={handleTextChange}
                  required
                />

                <Input
                  label="Business Address / Offices"
                  name="address"
                  placeholder="E.g. CBD Nairobi Plaza"
                  value={form.address}
                  onChange={handleTextChange}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Admin Support / Cloud Backup Email"
                  name="backupEmail"
                  type="email"
                  placeholder="E.g. cloud@mwanyiki.com"
                  value={form.backupEmail}
                  onChange={handleTextChange}
                />

                <div>
                  <label htmlFor="currencyCode" className="text-xs font-semibold text-slate-300 block mb-1">
                    Base Store Currency
                  </label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    value={form.currencyCode}
                    onChange={handleTextChange}
                    className="input px-4 py-2.5 bg-slate-950 text-slate-100 text-xs w-full uppercase font-medium border"
                  >
                    {CURRENCY_OPTIONS.map((coin, idx) => (
                      <option key={idx} value={coin.code}>
                        {coin.name} ({coin.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="taxRate" className="text-xs font-semibold text-slate-300 block mb-1">
                  Default Sales Tax Percentage (VAT %)
                </label>
                <div className="flex gap-2.5 items-center">
                  <input
                    id="taxRate"
                    type="number"
                    name="taxRate"
                    min="0"
                    max="100"
                    value={form.taxRate}
                    onChange={handleTextChange}
                    className="input max-w-24 px-4 py-2 text-center text-white"
                  />
                  <span className="text-xs text-slate-400 font-medium">
                    Standard values: <code className="text-indigo-400 font-bold">16%</code> standard VAT for Kenya, <code className="text-indigo-400 font-bold">18%</code> for East Africa, or <code className="text-indigo-400 font-bold">0%</code> if tax-exempt duka.
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-3 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
                >
                  <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Hifadhi Marekebisho / Save Configuration'}
                </button>
              </div>

            </GlassCard>
          </form>
        </div>

        {/* RIGHT COMPONENT: Subscription details guides (col: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="border-indigo-500/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <Database className="h-4.5 w-4.5 text-indigo-400 animate-pulse" /> Tech Specs & License
            </h3>

            <div className="space-y-3 text-xs text-slate-300 font-medium">
              <p className="flex justify-between border-b border-slate-950 pb-2">
                <span className="text-slate-500">Tier License:</span>
                <span className="font-mono text-emerald-400 font-bold">East African Growth Pack</span>
              </p>
              <p className="flex justify-between border-b border-slate-950 pb-2">
                <span className="text-slate-500">Diagnostics Quota:</span>
                <span className="font-mono text-indigo-400 font-bold">Unlimited (Smart Diagnostics)</span>
              </p>
              <p className="flex justify-between pb-1">
                <span className="text-slate-500">Database Engine:</span>
                <span className="font-mono text-white font-semibold">Firestore Cloud Scoped</span>
              </p>
            </div>
          </GlassCard>
        </div>

      </div>

    </div>
  );
};

// Footer Credits Export
export default () => {
  return (
    <>
      <SettingsPage />
      <footer className="text-center py-6 border-t border-slate-900 mt-6 text-[11px] text-slate-500 font-mono">
        <span>© {new Date().getFullYear()} Biashara Yako POS. Developed by{' '}</span>
        <a 
          href="https://nex-chi-six.vercel.app/" 
          target="_blank" 
          referrerPolicy="no-referrer"
          className="text-indigo-400 hover:text-indigo-300 transition underline font-sans font-semibold"
        >
          Munene Jackson Mwaniki from Nex-Ink
        </a>
      </footer>
    </>
  );
};
