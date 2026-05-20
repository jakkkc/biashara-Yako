import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, ChevronRight, ChevronLeft, MapPin, Briefcase, CheckCircle2, Loader2, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { handleFirestoreError, OperationType } from '../../lib/error-handler';
import { Business, UserProfile } from '../../types';

const businessTypes = [
  'Bakery', 'Restaurant', 'Retail', 'Wholesale', 'Agrovet', 'Pharmacy', 'Hardware', 
  'Salon', 'Kibanda', 'Supermarket', 'Electronics', 'Clothes & Fashion', 'Other'
];

export default function RegisterBusinessPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Retail',
    location: '',
    vatEnabled: false,
    vatPercentage: 16,
  });
  const navigate = useNavigate();

  const handleNext = () => setStep(s => s + 1);
  const handleBack = () => setStep(s => s - 1);

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    const businessId = `biz_${Date.now()}`;
    const businessData: Business = {
      id: businessId,
      name: formData.name,
      type: formData.type,
      location: formData.location,
      currency: 'KES',
      vatEnabled: formData.vatEnabled,
      vatPercentage: formData.vatPercentage,
      ownerEmail: auth.currentUser.email || '',
      status: 'active',
      subscription: {
        plan: 'Free',
        expiryDate: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days trial
      },
      createdAt: Date.now(),
    };

    try {
      // 1. Create Business
      const bizPath = `businesses/${businessId}`;
      try {
        await setDoc(doc(db, 'businesses', businessId), businessData);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, bizPath);
      }
      
      // 2. Create User Profile
      const userPath = `users/${auth.currentUser.uid}`;
      const userProfile: UserProfile = {
        id: auth.currentUser.uid,
        businessId: businessId,
        role: 'Owner',
        displayName: auth.currentUser.displayName || 'Owner',
        email: auth.currentUser.email || '',
        photoUrl: auth.currentUser.photoURL || undefined,
        createdAt: Date.now(),
      };
      try {
        await setDoc(doc(db, 'users', auth.currentUser.uid), userProfile);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, userPath);
      }

      // 3. Create Default Branch
      const branchId = `branch_${Date.now()}`;
      const branchPath = `businesses/${businessId}/branches/${branchId}`;
      try {
        await setDoc(doc(db, 'businesses', businessId, 'branches', branchId), {
          id: branchId,
          businessId: businessId,
          name: 'Main Branch',
          location: formData.location,
          active: true,
          createdAt: Date.now(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, branchPath);
      }

      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      // The error is already logged by handleFirestoreError
      alert('Failed to register business. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 italic-sans">
      <div className="max-w-xl w-full">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 flex-1 rounded-full transition-all duration-500 ${step >= s ? 'bg-navy' : 'bg-slate-200'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center mb-6">
                <Briefcase className="text-navy w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-navy mb-2">The Basics</h2>
              <p className="text-slate-500 mb-8">What's your business called and what do you do?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Modern Hardware & Tools"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Business Type</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:outline-none appearance-none"
                  >
                    {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button 
                  onClick={handleNext}
                  disabled={!formData.name}
                  className="w-full h-14 bg-navy text-white rounded-xl font-bold text-lg hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  Continue <ChevronRight size={20} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center mb-6">
                <MapPin className="text-navy w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-navy mb-2">Location</h2>
              <p className="text-slate-500 mb-8">Where is your primary branch located?</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">City / Town</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Nairobi, CBD"
                    className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-navy focus:outline-none"
                  />
                </div>
                <div className="flex gap-4">
                   <button 
                    onClick={handleBack}
                    className="flex-1 h-14 bg-slate-100 text-navy rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!formData.location}
                    className="flex-[2] h-14 bg-navy text-white rounded-xl font-bold text-lg hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    Next <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
            >
              <div className="w-12 h-12 bg-navy/5 rounded-xl flex items-center justify-center mb-6">
                <CheckCircle2 className="text-navy w-6 h-6" />
              </div>
              <h2 className="text-3xl font-bold text-navy mb-2">Final Touches</h2>
              <p className="text-slate-500 mb-8">Confirm your settings and launch your store.</p>
              
              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-semibold text-slate-700">VAT (Tax)</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.vatEnabled}
                        onChange={(e) => setFormData({...formData, vatEnabled: e.target.checked})}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-navy"></div>
                    </label>
                  </div>
                  {formData.vatEnabled && (
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500">VAT Percentage</span>
                      <input 
                        type="number" 
                        value={formData.vatPercentage}
                        onChange={(e) => setFormData({...formData, vatPercentage: Number(e.target.value)})}
                        className="w-20 h-10 px-2 bg-white border border-slate-200 rounded-lg text-center font-bold"
                      />
                      <span className="text-sm font-bold text-slate-700">%</span>
                    </div>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gold/5 border border-gold/10">
                  <p className="text-xs text-gold-light leading-relaxed">
                    By clicking Launch, you'll be redirected to your dashboard. 
                    You can manage employees and branches from the settings menu.
                  </p>
                </div>

                <div className="flex gap-4">
                   <button 
                    onClick={handleBack}
                    className="flex-1 h-14 bg-slate-100 text-navy rounded-xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={20} /> Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] h-14 bg-navy text-white rounded-xl font-bold text-lg hover:bg-navy-light transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-navy/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : 'Launch Store'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
