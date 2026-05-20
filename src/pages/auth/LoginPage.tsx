import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Store, LogIn, User, Lock, Chrome, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { signInWithGoogle } = useAuth();
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

  const handleEmployeeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError('');
    
    // Employee login logic will be implemented here
    // For now, placeholder
    setTimeout(() => {
      setError('Employee login system is being initialized. Please use Owner login for now.');
      setIsLoggingIn(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-navy p-4 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gold/5 blur-3xl -mr-48 -mt-48 rounded-full" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 blur-3xl -ml-48 -mb-48 rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-navy-muted rounded-[40px] shadow-2xl p-10 border border-slate-800 relative z-10"
      >
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-gold rounded-[24px] flex items-center justify-center mb-6 shadow-2xl shadow-gold/20">
            <Store className="text-navy w-12 h-12" strokeWidth={2.5} />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tighter italic">Biashara Yako</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Professional POS System</p>
        </div>

        <div className="flex p-1.5 bg-navy rounded-2xl mb-10 border border-slate-800/50">
          <button 
            onClick={() => setLoginType('owner')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              loginType === 'owner' ? 'bg-gold text-navy shadow-lg shadow-gold/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Owner
          </button>
          <button 
            onClick={() => setLoginType('employee')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              loginType === 'employee' ? 'bg-gold text-navy shadow-lg shadow-gold/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Employee
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 text-red-400 rounded-xl text-xs font-bold border border-red-500/20 tracking-tight">
            {error}
          </div>
        )}

        {loginType === 'owner' ? (
          <div className="space-y-6">
            <p className="text-xs text-slate-500 text-center mb-8 px-6 font-medium leading-relaxed">
              Business owners use Google authentication to securely manage their business, branches and inventory.
            </p>
            <button 
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full h-16 flex items-center justify-center gap-4 bg-navy border-2 border-slate-800 rounded-2xl font-black text-white hover:border-gold/30 hover:bg-white/5 transition-all disabled:opacity-50 text-xs uppercase tracking-widest"
            >
              {isLoggingIn ? <Loader2 className="animate-spin text-gold" /> : <Chrome className="text-red-500 w-6 h-6" />}
              Continue with Google
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmployeeLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Account Username</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:outline-none focus:border-gold/50 transition-all text-white font-bold"
                  placeholder="e.g. john_doe"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2.5 ml-1">Staff Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-14 pl-14 pr-6 bg-navy border border-slate-800 rounded-2xl focus:outline-none focus:border-gold/50 transition-all text-white font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-16 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gold-light transition-all shadow-xl shadow-gold/10 flex items-center justify-center gap-2 disabled:opacity-50 mt-8"
            >
              {isLoggingIn ? <Loader2 className="animate-spin" /> : <LogIn className="w-5 h-5 shadow-sm" strokeWidth={3} />}
              Authenticate Access
            </button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] mb-1">Empowering Local Commerce</p>
          <p className="text-[10px] text-slate-500">
            Crafted by <span className="text-gold">Jackson Mwaniki Munene</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
