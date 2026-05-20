import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { updatePassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { user, profile, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && profile && !profile.mustChangePassword && !isSuccess) {
      navigate('/dashboard');
    }
  }, [profile, loading, isSuccess, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8 || !/\d/.test(password)) {
      setError('Password must be at least 8 characters and include one number.');
      return;
    }

    setIsUpdating(true);
    setError('');

    try {
      if (!user) throw new Error('No authenticated user found.');
      
      // 1. Update Auth Password
      await updatePassword(user, password);
      
      // 2. Update Firestore flag
      await setDoc(doc(db, 'users', user.uid), {
        mustChangePassword: false
      }, { merge: true });

      setIsSuccess(true);
      
      // Wait a bit then navigate
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update protocol access cipher.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[160px] rounded-full -mr-96 -mt-96" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 blur-[140px] rounded-full -ml-40 -mb-40" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg bg-navy-muted rounded-[40px] shadow-2xl p-10 lg:p-12 border border-slate-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-20 h-20 bg-gold/10 border border-gold/20 rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-gold/5">
            <Lock className="text-gold w-10 h-10" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">Secure Your Access</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Personal Personnel Protocol Activation</p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="text-green-500 w-8 h-8" />
              </div>
              <p className="text-white font-black text-lg italic tracking-tight">Access Cipher Synchronized</p>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Redirecting to enterprise dashboard...</p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              onSubmit={handleSubmit} 
              className="space-y-6"
            >
              <div className="p-5 bg-navy rounded-3xl border border-slate-800/50 mb-8">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed text-center">
                   This is your first login. You must establish a permanent access cipher before proceeding to the command center.
                 </p>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl text-[10px] font-black border border-red-500/20 tracking-wider uppercase">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Access Cipher</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 outline-none transition-all text-white font-black tracking-widest"
                    placeholder="Min 8 chars, 1 number"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirm Cipher</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full h-16 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 outline-none transition-all text-white font-black tracking-widest"
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isUpdating}
                className="w-full h-18 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gold-light transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-4 disabled:opacity-50 mt-10 active:scale-95"
              >
                {isUpdating ? <Loader2 className="animate-spin" /> : <>Finalize Encryption <ArrowRight size={20} strokeWidth={3} /></>}
              </button>

              <div className="text-center pt-8">
                 <button 
                   type="button"
                   onClick={() => logout()}
                   className="text-slate-600 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors"
                 >
                   Abort Login Sequence
                 </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-slate-800/50 flex flex-col items-center gap-4">
           <div className="flex items-center gap-2 text-slate-700">
             <ShieldCheck size={14} />
             <span className="text-[8px] font-black uppercase tracking-[0.3em]">End-to-End Enterprise Encryption Active</span>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
