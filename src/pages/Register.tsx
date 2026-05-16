import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { GlassCard } from '../components/ui/GlassCard';
import { BUSINESS_TYPES, CURRENCIES } from '../utils/constants';
import { Lock, Store, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useFirestore } from '../hooks/useFirestore';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function Register() {
  const { firebaseUser, userProfile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const { addDocument } = useFirestore();
  
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: BUSINESS_TYPES[0],
    phone: '',
    address: '',
    currency: CURRENCIES[0].code
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      navigate('/dashboard');
    }
  }, [userProfile, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    
    setIsSubmitting(true);
    try {
      // 1. Create Business
      const businessId = await addDocument('businesses', {
        name: formData.businessName,
        ownerId: firebaseUser.uid,
        ownerEmail: firebaseUser.email,
        phone: formData.phone,
        address: formData.address,
        businessType: formData.businessType,
        currency: formData.currency,
        status: 'active',
        createdBy: firebaseUser.uid
      });

      if (!businessId) throw new Error('Failed to create business');

      // 2. Create User Profile
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        email: firebaseUser.email,
        name: firebaseUser.displayName,
        role: 'business_owner',
        businessId: businessId,
        branchId: null,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });

      toast.success('Business registered successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error('Failed to register business');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!firebaseUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/10 via-slate-950 to-slate-950">
        <GlassCard className="p-10 w-full max-w-md text-center border-slate-800">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-indigo-500/20">
            <Store className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white uppercase tracking-tight">Initialize Workspace</h2>
          <p className="micro-label !text-slate-500 mb-8">Identity Verification Required</p>
          <GoogleSignInButton onClick={signInWithGoogle} />
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 py-20">
      <div className="w-full max-w-3xl">
        <header className="mb-12 flex justify-between items-end pb-4 border-b border-slate-900">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white uppercase">Initialize System</h1>
            <p className="text-slate-500 text-sm mt-1">Configure your business workspace node.</p>
          </div>
          <div className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full text-[10px] font-mono uppercase tracking-widest text-indigo-400 flex items-center font-bold">
            Phase 01 / 02
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <GlassCard className="p-8 border-slate-800">
              <h3 className="micro-label mb-6 text-indigo-400">Admin Identity</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Manager Delegate</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={firebaseUser.displayName || ''} 
                      readOnly 
                      className="w-full glass-input bg-slate-950/50 opacity-60 pr-10 cursor-not-allowed border-slate-900"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Relay Email</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={firebaseUser.email || ''} 
                      readOnly 
                      className="w-full glass-input bg-slate-950/50 opacity-60 pr-10 cursor-not-allowed border-slate-900"
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800" />
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-8 border-slate-800">
              <h3 className="micro-label mb-6 text-indigo-400">Node Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-8">
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Identifier Name *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.businessName}
                    onChange={e => setFormData({...formData, businessName: e.target.value})}
                    placeholder="e.g. Uzuri Coffee Shop"
                    className="w-full glass-input border-slate-800"
                  />
                </div>
                
                <div className="md:col-span-4">
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Service Sector *</label>
                  <select 
                    className="w-full glass-input appearance-none border-slate-800"
                    value={formData.businessType}
                    onChange={e => setFormData({...formData, businessType: e.target.value})}
                  >
                    {BUSINESS_TYPES.map(type => (
                      <option key={type} value={type} className="bg-slate-900">{type}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Communication Relay *</label>
                  <input 
                    required
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    placeholder="+254 7XX XXX XXX"
                    className="w-full glass-input border-slate-800"
                  />
                </div>

                <div className="md:col-span-6">
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Base Currency *</label>
                  <select 
                    className="w-full glass-input appearance-none border-slate-800"
                    value={formData.currency}
                    onChange={e => setFormData({...formData, currency: e.target.value})}
                  >
                    {CURRENCIES.map(item => (
                      <option key={item.code} value={item.code} className="bg-slate-900 font-mono">{item.code} - {item.name}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-12">
                  <label className="text-[10px] font-bold text-slate-600 uppercase mb-2 block">Geospatial Address *</label>
                  <input 
                    required
                    type="text" 
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Physical location, Town"
                    className="w-full glass-input border-slate-800"
                  />
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="flex justify-end pt-8">
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-accent px-16 py-4 text-sm w-full md:w-auto uppercase tracking-widest font-black flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'INITIALIZING...' : (
                <>FINALIZE_WORKSPACE <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
