import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Store, ChevronRight, ChevronLeft, MapPin, Briefcase, CheckCircle2, Loader2, Upload, DollarSign, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../lib/firebase';
import { Business, UserProfile } from '../../types';

const businessTypes = [
  'Bakery', 'Restaurant', 'Retail', 'Wholesale', 'Agrovet', 'Pharmacy', 'Hardware', 
  'Salon', 'Kibanda', 'Supermarket', 'Electronics', 'Clothes & Fashion', 'Posho Mill', 'Matatu Sacco', 'Other'
];

export default function RegisterBusinessPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    
    try {
      let logoUrl = '';
      if (logoFile) {
        const logoRef = ref(storage, `logos/${auth.currentUser.uid}_${Date.now()}`);
        const uploadResult = await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(uploadResult.ref);
      }

      const businessId = `biz_${Date.now()}`;
      const businessData: Business = {
        id: businessId,
        name: formData.name,
        type: formData.type,
        location: formData.location,
        ownerUid: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email || '',
        logoUrl: logoUrl || undefined,
        status: 'active',
        currency: 'KES',
        vatEnabled: formData.vatEnabled,
        vatPercentage: formData.vatPercentage,
        receiptConfig: {
          businessName: formData.name,
          tagline: 'Smart Business. Real Results.',
        },
        subscriptionPlan: 'free',
        subscriptionExpiry: Date.now() + (30 * 24 * 60 * 60 * 1000), // 30 days trial
        createdAt: Date.now(),
      };

      // 1. Create Business
      await setDoc(doc(db, 'businesses', businessId), businessData);
      
      // 2. Create Default Branch
      const branchId = `branch_${Date.now()}`;
      await setDoc(doc(db, 'businesses', businessId, 'branches', branchId), {
        id: branchId,
        businessId: businessId,
        name: 'Main Branch',
        location: formData.location,
        active: true,
        createdAt: Date.now(),
      });

      // 3. Update/Create User Profile
      const userProfile: UserProfile = {
        id: auth.currentUser.uid,
        businessId: businessId,
        branchId: branchId,
        role: 'Owner',
        displayName: auth.currentUser.displayName || 'Enterprise Lead',
        email: auth.currentUser.email || '',
        isActive: true,
        createdAt: Date.now(),
        createdBy: 'self',
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid), userProfile);

      navigate('/dashboard');
    } catch (err) {
      console.error('Registration failed:', err);
      alert('Failed to register business. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center py-12 px-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gold/5 blur-[100px] rounded-full -ml-48 -mb-48 opacity-50" />

      <div className="max-w-xl w-full relative z-10">
        <div className="flex gap-2 mb-16">
          {[1, 2, 3, 4, 5].map((s) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-700 ${step >= s ? 'bg-gold shadow-[0_0_15px_rgba(234,179,8,0.3)]' : 'bg-slate-800'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800 text-center"
            >
              <div className="w-20 h-20 bg-gold rounded-[24px] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-gold/20">
                <Store className="text-navy w-10 h-10" strokeWidth={2.5} />
              </div>
              <h2 className="text-4xl font-black text-white mb-2 tracking-tighter italic">Welcome to Biashara Yako</h2>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-12 px-6">Initializing your enterprise framework. Let's establish your digital presence.</p>
              
              <button 
                onClick={handleNext}
                className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                Let's Begin <ChevronRight size={18} strokeWidth={3} />
              </button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <Briefcase className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Identity</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Define your operational parameters</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Business Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Modern Hardware & Tools"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none text-white font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Location (City/Town)</label>
                  <input 
                    type="text" 
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    placeholder="e.g. Nairobi, Westlands"
                    className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none text-white font-bold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Enterprise Type</label>
                  <div className="relative">
                    <select 
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="w-full h-14 px-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 focus:outline-none appearance-none text-white font-bold"
                    >
                      {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <ChevronRight size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90" />
                  </div>
                </div>
                <div className="flex gap-4 pt-6">
                  <button onClick={handleBack} className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={18} /> Back</button>
                  <button onClick={handleNext} disabled={!formData.name || !formData.location} className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-gold/10">Next Phase <ChevronRight size={18} strokeWidth={3} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <ImageIcon className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Branding</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Upload your visual identify (optional)</p>
              
              <div className="space-y-8">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-[32px] p-12 bg-navy hover:border-gold/30 transition-all cursor-pointer relative overflow-hidden group">
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                  {logoPreview ? (
                    <img src={logoPreview} alt="Preview" className="w-32 h-32 object-contain rounded-2xl" />
                  ) : (
                    <>
                      <Upload className="text-slate-600 mb-4 group-hover:text-gold transition-colors" size={40} />
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select HQ Logo</p>
                    </>
                  )}
                </div>

                <div className="flex gap-4">
                  <button onClick={handleBack} className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={18} /> Back</button>
                  <button onClick={handleNext} className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-xl">Skip / Next <ChevronRight size={18} strokeWidth={3} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <DollarSign className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Fiscal Config</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Define your local financial parameters</p>
              
              <div className="space-y-6">
                <div className="p-6 rounded-[32px] bg-navy border border-slate-800">
                   <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Default Currency</span>
                      <span className="text-lg font-black text-gold tracking-tight">KES (Kenyan Shilling)</span>
                   </div>
                   <div className="h-px bg-slate-800/50 my-6" />
                   <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taxation Protocol</span>
                        <span className="text-sm font-bold text-white mt-1">VAT Enrollment</span>
                     </div>
                     <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={formData.vatEnabled} onChange={(e) => setFormData({...formData, vatEnabled: e.target.checked})} />
                        <div className="w-14 h-7 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-slate-400 after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gold peer-checked:after:bg-navy"></div>
                     </label>
                   </div>
                   {formData.vatEnabled && (
                     <div className="mt-8 flex items-center gap-4 bg-navy-muted p-4 rounded-2xl border border-slate-800/50">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex-1">VAT Percentage (%)</span>
                        <input type="number" value={formData.vatPercentage} onChange={(e) => setFormData({...formData, vatPercentage: Number(e.target.value)})} className="w-16 h-10 bg-navy border border-slate-800 rounded-xl text-center font-black text-gold text-lg" />
                     </div>
                   )}
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={handleBack} className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={18} /> Back</button>
                  <button onClick={handleNext} className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-xl">Complete Setup <ChevronRight size={18} strokeWidth={3} /></button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div 
              key="step5"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="bg-navy-muted rounded-[40px] p-10 shadow-2xl border border-slate-800"
            >
              <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-gold/20">
                <CheckCircle2 className="text-navy w-8 h-8" strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-white mb-2 tracking-tighter italic">Review & Launch</h2>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-10">Initiate your enterprise infrastructure</p>
              
              <div className="space-y-6">
                <div className="space-y-4 p-6 bg-navy rounded-[32px] border border-slate-800">
                  <div className="flex justify-between border-b border-slate-800/50 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Enterprise</span>
                    <span className="text-sm font-bold text-white uppercase">{formData.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sector</span>
                    <span className="text-sm font-bold text-white">{formData.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/50 pb-4">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Territory</span>
                    <span className="text-sm font-bold text-white">{formData.location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fiscal Enrollment</span>
                    <span className="text-sm font-black text-gold">{formData.vatEnabled ? `VAT ${formData.vatPercentage}%` : 'Standard'}</span>
                  </div>
                </div>

                <div className="p-6 rounded-[32px] bg-gold/5 border border-gold/10 text-center">
                  <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-[0.2em]">Ready for activation. Your root and branch protocols will be initialized upon confirmation.</p>
                </div>

                <div className="flex gap-4 pt-6">
                  <button onClick={handleBack} className="flex-1 h-16 bg-navy border border-slate-800 text-slate-500 rounded-2xl font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><ChevronLeft size={18} /> Back</button>
                  <button onClick={handleSubmit} disabled={loading} className="flex-[2] h-16 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-gold-light transition-all flex items-center justify-center gap-3 shadow-xl shadow-gold/20">
                    {loading ? <Loader2 className="animate-spin" /> : <>LAUNCH ENTERPRISE <ArrowRight size={18} strokeWidth={3} /></>}
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
          <a href="https://nex-chi-six.vercel.app" target="_blank" rel="noopener noreferrer" className="text-gold hover:text-white transition-colors underline decoration-gold/30 underline-offset-4">Jackson Mwaniki Munene</a>
        </div>
      </div>
    </div>
  );
}
