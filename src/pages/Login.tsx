import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { GoogleSignInButton } from '../components/ui/GoogleSignInButton';
import { GlassCard } from '../components/ui/GlassCard';
import { motion } from 'motion/react';

import { ArrowRight } from 'lucide-react';

export default function Login() {
  const { firebaseUser, userProfile, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (firebaseUser) {
      if (userProfile) {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      } else {
        navigate('/register');
      }
    }
  }, [firebaseUser, userProfile, navigate, location]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <h1 className="text-4xl font-display font-bold text-white mb-2 tracking-tight">NEXUS CORE</h1>
          <p className="micro-label !text-indigo-400">Terminal Login Phase</p>
        </div>

        <GlassCard className="p-8 border-slate-800">
          <h2 className="text-xl font-bold mb-6 text-center text-white uppercase tracking-tight">Access Authorized</h2>
          
          <GoogleSignInButton onClick={signInWithGoogle} />
          
          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-sm text-slate-500 mb-2 font-mono">NEW SYSTEM ENTRY?</p>
            <button 
              onClick={() => navigate('/register')}
              className="text-white font-bold text-sm tracking-tight hover:underline flex items-center justify-center gap-2 mx-auto"
            >
              REGISTER_BRANCH <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </GlassCard>

        <p className="mt-8 text-center text-[10px] text-slate-600 uppercase tracking-[0.2em] font-bold font-mono">
          SECURE_CLOUD_POS_NODE
        </p>
      </motion.div>
    </div>
  );
}
