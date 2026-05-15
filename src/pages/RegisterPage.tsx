import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    businessName: '',
    businessType: 'retail',
    phone: '',
    address: '',
    ownerName: '',
    email: '',
    password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      const batch = writeBatch(db);

      // 2. Create Business
      const businessRef = doc(collection(db, 'businesses'));
      const businessId = businessRef.id;
      batch.set(businessRef, {
        name: formData.businessName,
        businessType: formData.businessType,
        phone: formData.phone,
        address: formData.address,
        ownerId: uid,
        ownerEmail: formData.email,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: uid
      });

      // 3. Create User Profile
      const userRef = doc(db, 'users', uid);
      batch.set(userRef, {
        email: formData.email,
        name: formData.ownerName,
        role: 'business_owner',
        businessId: businessId,
        branchId: null,
        status: 'active',
        createdAt: serverTimestamp(),
        createdBy: uid
      });

      await batch.commit();
      setStep(3);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (step === 3) {
    return (
      <div className="min-h-screen flex items-center justify-center relative px-4 overflow-hidden">
        <div className="mesh-gradient" />
        <div className="max-w-md w-full glass rounded-[32px] p-10 text-center shadow-2xl relative z-10 border border-white/10">
          <div className="mx-auto w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Registration Successful!</h1>
          <p className="text-slate-400 mb-8 font-medium">
            Your business <strong className="text-white">{formData.businessName}</strong> has been registered successfully.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative py-12 px-4 overflow-y-auto overflow-hidden">
      <div className="mesh-gradient" />
      
      <div className="max-w-2xl w-full mx-auto relative z-10">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="p-2 bg-blue-600 rounded-xl border border-white/10 shadow-lg shadow-blue-600/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Biashara Yako</h1>
        </div>

        <div className="glass rounded-[40px] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none" />

          <div className="flex items-center gap-4 mb-10 relative z-10">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              step >= 1 ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 border border-white/10"
            )}>1</div>
            <div className="h-px flex-1 bg-white/10"></div>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all",
              step >= 2 ? "bg-blue-600 text-white" : "bg-white/5 text-slate-500 border border-white/10"
            )}>2</div>
          </div>

          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); setStep(2); } : handleRegister} className="space-y-6 relative z-10">
            {step === 1 ? (
              <>
                <h2 className="text-2xl font-bold text-white mb-6 font-serif">Business Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Business Name</label>
                    <input name="businessName" value={formData.businessName} onChange={updateForm} required className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Business Type</label>
                    <select name="businessType" value={formData.businessType} onChange={updateForm} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all">
                      <option value="retail">Retail Shop</option>
                      <option value="restaurant">Restaurant / Cafe</option>
                      <option value="salon">Salon / Spa</option>
                      <option value="other">Other Business</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Phone Number</label>
                  <input name="phone" value={formData.phone} onChange={updateForm} required className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" placeholder="+254..." />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Business Address</label>
                  <input name="address" value={formData.address} onChange={updateForm} required className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                </div>
                <button type="submit" className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all mt-8 group active:scale-[0.98]">
                  Next Step <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-white mb-6 font-serif">Owner Credentials</h2>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Owner Full Name</label>
                  <input name="ownerName" value={formData.ownerName} onChange={updateForm} required className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Email Address</label>
                  <input name="email" type="email" value={formData.email} onChange={updateForm} required className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-blue-400 mb-2 ml-1">Create Password</label>
                  <input name="password" type="password" value={formData.password} onChange={updateForm} required minLength={8} className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-slate-600" />
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="flex gap-4 mt-8">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98]">
                    Back
                  </button>
                  <button type="submit" disabled={loading} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/20 active:scale-[0.98]">
                    {loading ? "Registering..." : "Complete Registration"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        <p className="mt-8 text-center text-slate-500 font-medium">
          Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold ml-1 transition-colors">Sign in here</Link>
        </p>
      </div>
    </div>
  );
}

// Fixed missing import in code above
import { collection } from 'firebase/firestore';
