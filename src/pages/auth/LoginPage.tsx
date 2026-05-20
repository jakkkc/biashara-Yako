import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Store, LogIn, User, Lock, Chrome, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'owner' | 'staff'>('owner');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signInWithGoogle, signInWithStaff } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError('');
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError('Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    try {
      await signInWithStaff(username, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Staff authentication failed. Verify your identity and access cipher.');
    } finally {
      setIsLoggingIn(false);
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
        <div className="flex flex-col items-center mb-12">
          <div 
            className="w-20 h-20 bg-gold rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-gold/20 cursor-pointer hover:scale-105 transition-transform"
            onClick={() => navigate('/')}
          >
            <Store className="text-navy w-12 h-12" strokeWidth={2.5} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tighter italic">Enterprise Hub</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Matrix Protocol Activation 2.4</p>
        </div>

        <div className="flex p-1.5 bg-navy rounded-2xl mb-12 border border-slate-800/50">
          <button 
            onClick={() => setLoginType('owner')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              loginType === 'owner' ? 'bg-gold text-navy shadow-xl' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Enterprise Lead
          </button>
          <button 
            onClick={() => setLoginType('staff')}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              loginType === 'staff' ? 'bg-gold text-navy shadow-xl' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Terminal Staff
          </button>
        </div>

        {error && (
          <div className="mb-8 p-5 bg-gold/10 text-gold rounded-2xl text-[10px] font-black border border-gold/20 tracking-wider uppercase">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {loginType === 'owner' ? (
            <motion.div 
              key="owner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="p-6 bg-navy rounded-3xl border border-slate-800/50 text-center">
                 <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed px-4">
                   Owners use high-fidelity Google Identity protocols to manage the entire enterprise network and all subsidiary hubs.
                 </p>
              </div>
              <button 
                onClick={handleGoogleLogin}
                disabled={isLoggingIn}
                className="w-full h-16 flex items-center justify-center gap-4 bg-white text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-100 transition-all disabled:opacity-50 shadow-xl"
              >
                {isLoggingIn ? <Loader2 className="animate-spin text-navy" /> : (
                  <>
                    <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continue as Lead
                  </>
                )}
              </button>

              <div className="text-center pt-8 border-t border-slate-800">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">New Enterprise?</p>
                 <button onClick={() => navigate('/register-business')} className="text-gold font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors underline decoration-gold/30 underline-offset-4">Bootstrap Platform</button>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="staff"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <form onSubmit={handleStaffLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Staff Access Identity (Username)</label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full h-16 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 outline-none transition-all text-white font-black uppercase text-sm tracking-widest"
                      placeholder="e.g. johndoe_sales"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Personnel Cipher (Password)</label>
                  <div className="relative">
                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-16 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:border-gold/50 outline-none transition-all text-white font-black"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={isLoggingIn}
                  className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-gold-light transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-4 disabled:opacity-50 mt-10"
                >
                  {isLoggingIn ? <Loader2 className="animate-spin" /> : <>Activate Terminal <ArrowRight size={20} strokeWidth={3} /></>}
                </button>
              </form>

              <div className="mt-10 p-5 bg-navy rounded-3xl border border-slate-800/50 flex items-start gap-4">
                 <ShieldCheck className="text-gold shrink-0 mt-0.5" size={18} />
                 <p className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">
                   Staff are authenticated locally at their assigned hub terminal. Contact your Enterprise Lead for access ciphers.
                 </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center">
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
      </motion.div>
    </div>
  );
}
