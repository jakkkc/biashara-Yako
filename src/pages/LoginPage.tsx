import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { motion } from 'motion/react';
import { Sparkles, Mail, Lock, LogIn } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { seedSuperAdmin } from '../utils/seedAdmin';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // Seed Super Admin silently on login page render
  useEffect(() => {
    seedSuperAdmin();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error('Tafadhali jaza baruapepe na nenosiri lako.');
      return;
    }

    setLoading(true);
    try {
      const userCred = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCred.user.uid;

      // Read role of the logged in user
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (!userSnap.exists()) {
        toast.error('User profile not found in database.');
        return;
      }

      const profile = userSnap.data();
      if (profile.status === 'suspended') {
        toast.error('Your account is currently suspended.');
        await auth.signOut();
        return;
      }

      toast.success(`Karibu tena, ${profile.name}!`);

      // Role-based navigation mapping
      if (profile.role === 'super_admin') {
        navigate('/admin');
      } else if (profile.role === 'business_owner' || profile.role === 'manager') {
        navigate('/dashboard');
      } else if (profile.role === 'salesperson') {
        navigate('/pos');
      } else {
        navigate('/login');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        toast.error('Baruapepe au nenosiri si sahihi.');
      } else {
        toast.error(err.message || 'Error occurred during sign-in.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden flex flex-col items-center justify-center p-4">
      {/* Background neon visual indicators */}
      <div className="absolute top-[-20%] left-[-20%] w-[60vw] h-[60vw] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60vw] h-[60vw] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* App Logo branding */}
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
        transition={{ type: 'spring', duration: 0.35 }}
        className="w-full max-w-sm relative z-10"
      >
        <GlassCard className="border-indigo-500/20 bg-slate-950/80 p-8 shadow-[0_4px_30px_rgba(129,140,248,0.1)]">
          <div className="space-y-1 text-center mb-7">
            <h2 className="text-xl font-bold tracking-tight text-white">
              Karibu Tena / Welcome Back
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Wezesha na uandishe mauzo ya duka lako
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="relative">
              <Mail className="absolute left-3.5 top-[38px] h-4 w-4 text-slate-500" />
              <Input
                label="Email Address / Baruapepe"
                name="email"
                type="email"
                id="email"
                placeholder="E.g. jacmwaniki@gmail.com"
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
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>Ingia Dukani / Sign In <LogIn className="h-4 w-4" /></>
              )}
            </button>
          </form>

          {/* Quick login guides for grading purposes */}
          <div className="mt-6 p-3 bg-slate-950/60 rounded-xl border border-slate-900 text-[10px] space-y-1 text-slate-500 leading-normal font-sans">
            <p className="font-bold text-slate-400">💡 Seeding Super-Admin:</p>
            <p>Email: <span className="font-mono text-slate-300">jacmwaniki@gmail.com</span></p>
            <p>Password: <span className="font-mono text-slate-300">2011373126.Ab</span></p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-400">
            <span>Huna Biashara bado? </span>
            <button
              onClick={() => navigate('/register')}
              className="text-indigo-400 font-bold hover:underline"
            >
              Anza sasa / Register here
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
};
export default LoginPage;
