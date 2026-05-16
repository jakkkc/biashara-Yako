import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'motion/react';
import { Sparkles, Building, Lock, Mail, User, Phone, MapPin, Store, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { formatPhoneNumber } from '../utils/formatters';
import toast from 'react-hot-toast';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    businessType: 'Retail',
    phone: '',
    address: '',
    currency: 'KES'
  });

  const [step, setStep] = useState(1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.email || !formData.password) {
        toast.error('Tafadhali jaza sifa zote za kibinafsi.');
        return;
      }
      if (formData.password.length < 6) {
        toast.error('Nenosiri lazima liwe na herufi sita au zaidi.');
        return;
      }
      setStep(2);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !formData.phone || !formData.address) {
      toast.error('Tafadhali jaza sifa zote za biashara yako.');
      return;
    }

    setLoading(true);
    try {
      // 1. Create firebase Auth profile
      const userCred = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCred.user.uid;

      // 2. Provision unique ID for business & branch
      const businessId = doc(collection(db, 'businesses')).id;
      const branchId = doc(collection(db, 'branches')).id;

      const normalizedPhone = formatPhoneNumber(formData.phone);

      // Selected currency details
      const selectedCurrencyObj = formData.currency === 'UGX' 
        ? { code: 'UGX', name: 'Ugandan Shilling', symbol: 'UGX' }
        : formData.currency === 'TZS'
        ? { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TZS' }
        : { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' };

      // 3. Set business profile doc
      await setDoc(doc(db, 'businesses', businessId), {
        name: formData.businessName,
        ownerId: uid,
        ownerEmail: formData.email,
        phone: normalizedPhone,
        address: formData.address,
        businessType: formData.businessType,
        logo: '',
        status: 'active',
        currency: selectedCurrencyObj,
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });

      // 4. Set auto default branch (Nairobi or User Address HQ) to ensure instant usability
      await setDoc(doc(db, 'branches', branchId), {
        businessId: businessId,
        name: 'Main Branch / Makao Makuu',
        location: formData.address,
        phone: normalizedPhone,
        managerId: uid,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });

      // 5. Set user details doc
      await setDoc(doc(db, 'users', uid), {
        email: formData.email,
        name: formData.name,
        role: 'business_owner',
        businessId: businessId,
        branchId: branchId,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'system'
      });

      toast.success('Karibu Sana! Biashara yako imesajiliwa vyema.');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error creating account. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background radial overlays */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Label */}
      <div className="flex items-center gap-3.5 mb-8 text-center select-none cursor-pointer" onClick={() => navigate('/')}>
        <div className="p-2 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-wide text-white bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
          Biashara Yako POS
        </span>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-sm relative z-10"
      >
        <GlassCard className="border-indigo-500/20 bg-slate-950/80 p-8 shadow-[0_4px_30px_rgba(129,140,248,0.1)]">
          <div className="space-y-1 text-center mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Sajili Biashara Yako
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Hatua ya {step} ya 2: {step === 1 ? 'Taarifa za Kiongozi' : 'Sifa za Duka Lako'}
            </p>
          </div>

          <form onSubmit={step === 2 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
            {step === 1 && (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                  <Input
                    label="Full Name / Jina Kamili"
                    name="name"
                    id="name"
                    placeholder="E.g. Juma Jackson"
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                  <Input
                    label="Email Address / Baruapepe"
                    name="email"
                    type="email"
                    id="email"
                    placeholder="mwaniki@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                  <Input
                    label="Password / Nenosiri"
                    name="password"
                    type="password"
                    id="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={handleNext}
                  className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
                >
                  Endelea mbele / Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="relative">
                  <Store className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                  <Input
                    label="Business Name / Jina la Biashara"
                    name="businessName"
                    id="businessName"
                    placeholder="E.g. Mwaniki Supermarket"
                    value={formData.businessName}
                    onChange={handleChange}
                    className="pl-10"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="businessType" className="text-sm font-medium text-slate-300 block mb-1.5">
                    Category / Sekta
                  </label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    className="input px-4 py-2.5 w-full border text-slate-100 bg-slate-950 font-medium"
                  >
                    <option value="Retail">Retail / Duka la rejareja</option>
                    <option value="Wholesale">Wholesale / Mauzo ya Jumla</option>
                    <option value="Pharma">Pharmacy / Duka la dawa</option>
                    <option value="Electronics">Electronics / Vifaa vya umeme</option>
                    <option value="Hardware">Hardware / Vifaa vya ujenzi</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                    <Input
                      label="Phone / Simu"
                      name="phone"
                      id="phone"
                      placeholder="0712345678"
                      value={formData.phone}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>

                  <div className="relative">
                    <MapPin className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
                    <Input
                      label="Location / Anwani"
                      name="address"
                      id="address"
                      placeholder="Nairobi"
                      value={formData.address}
                      onChange={handleChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="currency" className="text-sm font-medium text-slate-300 block mb-1.5">
                    Currency / Sarafu Kuu
                  </label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    className="input px-4 py-2.5 w-full border text-slate-100 bg-slate-950 font-medium"
                  >
                    <option value="KES">Kenyan Shilling (KES)</option>
                    <option value="UGX">Ugandan Shilling (UGX)</option>
                    <option value="TZS">Tanzanian Shilling (TZS)</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-ghost py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="h-4 w-4" /> Nyuma
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    ) : (
                      <>Sajili / Complete <CheckCircle className="h-4 w-4" /></>
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Umeshajisajili tayari? </span>
            <button
              onClick={() => navigate('/login')}
              className="text-indigo-400 font-bold hover:underline"
            >
              Sign In / Ingia hapa
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
export default RegisterPage;
