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
    <div className="min-h-screen bg-navy flex flex-col items-center py-12 px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full -ml-48 -mb-48 opacity-50" />

      <div className="max-w-xl w-full relative z-10">
        {/* Progress Bar */}
        <div className="flex gap-3 mb-16">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-gold shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-slate-800'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <Briefcase className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight italic">The Foundation</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Initialize your business identity</p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Enterprise Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Modern Hardware & Tools"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none text-white font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Sector of Operation</label>
                  <div className="relative">
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none appearance-none text-white font-bold"
                    >
                      {businessTypes.map(t => <option key={t} value={t} className="bg-navy">{t}</option>)}
                    </select>
                    <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" />
                  </div>
                </div>
                <button 
                  onClick={handleNext}
                  disabled={!formData.name}
                  className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gold-light transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale shadow-xl shadow-gold/10 mt-4"
                >
                  Continue Journey <ChevronRight size={18} strokeWidth={3} />
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
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <MapPin className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight italic">Operations Hub</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Where will you be serving from?</p>
              
              <div className="space-y-8">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Primary Territory (City/Town)</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Nairobi, CBD"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none text-white font-bold transition-all"
                  />
                </div>
                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={handleBack}
                    className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={handleNext}
                    disabled={!formData.location}
                    className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale shadow-xl shadow-gold/10"
                  >
                    Next Phase <ChevronRight size={18} strokeWidth={3} />
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
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <CheckCircle2 className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tight italic">Final Approval</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Review parameters and initiate core</p>
              
              <div className="space-y-8">
                <div className="p-6 rounded-[32px] bg-navy border border-slate-800">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex flex-col">
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxation Profile</span>
                       <span className="text-sm font-bold text-white mt-1">VAT System (KRA Compliant)</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={formData.vatEnabled}
                        onChange={(e) => setFormData({...formData, vatEnabled: e.target.checked})}
                      />
                      <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold peer-checked:after:bg-navy"></div>
                    </label>
                  </div>
                  {formData.vatEnabled && (
                    <div className="flex items-center gap-4 bg-navy-muted p-4 rounded-2xl border border-slate-800/50">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex-1">VAT Threshold</span>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           value={formData.vatPercentage}
                           onChange={(e) => setFormData({...formData, vatPercentage: Number(e.target.value)})}
                           className="w-16 h-10 bg-navy border border-slate-800 rounded-xl text-center font-black text-gold text-lg"
                         />
                         <span className="text-sm font-black text-white">%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 rounded-[32px] bg-gold/5 border border-gold/10">
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest text-center">
                    By initializing, you agree to the consortium operational guidelines. 
                    Your root account will be granted full administrative authority.
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                   <button 
                    onClick={handleBack}
                    className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:text-white transition-all flex items-center justify-center gap-2"
                  >
                    <ChevronLeft size={18} /> Back
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale shadow-xl shadow-gold/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <>BOOT SYSTEM <CheckCircle2 size={18} strokeWidth={3} /></>}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-12 py-8 border-t border-slate-800/50 text-center relative z-10 w-full max-w-xl">
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Empowering Local Commerce</p>
        <div className="text-[10px] font-black uppercase tracking-widest mt-2">
          <span className="text-slate-700">Crafted by</span>{" "}
          <a 
            href="https://nex-chi-six.vercel.app" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-gold hover:text-white transition-colors underline decoration-gold/30 underline-offset-4"
          >
            Jackson Mwaniki Munene
          </a>
        </div>
      </div>
    </div>
  );
}
