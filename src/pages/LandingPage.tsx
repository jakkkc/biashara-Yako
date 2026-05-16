import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Smartphone, 
  TrendingUp, 
  GitMerge, 
  ShieldCheck, 
  Zap,
  Building,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050510] relative overflow-hidden flex flex-col justify-between select-none">
      
      {/* Decorative Neon Spheres */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Navigation Header */}
      <header className="px-6 md:px-12 h-20 flex items-center justify-between border-b border-slate-900/40 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg tracking-wide text-white bg-gradient-to-r from-indigo-400 via-indigo-200 to-emerald-400 bg-clip-text text-transparent">
            Biashara Yako POS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-semibold text-slate-300 hover:text-white transition px-4 py-2 cursor-pointer"
          >
            Sign In / Ingia
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="hidden sm:inline-flex btn-primary text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
          >
            Sajili Biashara / Register
          </button>
        </div>
      </header>

      {/* Hero section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 md:px-12 py-12 md:py-20 flex flex-col lg:grid lg:grid-cols-12 gap-12 items-center relative z-10 w-full">
        <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
          {/* Swahili Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono tracking-wide uppercase"
          >
            <Zap className="h-3.5 w-3.5" /> SIMAMIA BIASHARA YAKO RAHISI SANA
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]"
          >
            Simamia biashara yako. <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
              Mahali popote.
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-sans"
          >
            The production-grade, multi-tenant SaaS Point of Sale system built for East African retail.
            Track sales in real-time, audit inventories, log expenses, manage branches, and unlock smart automated recommendations.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
          >
            <button
              onClick={() => navigate('/register')}
              className="btn-primary w-full sm:w-auto px-8 py-4 rounded-xl font-bold flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_4px_30px_rgba(99,102,241,0.45)] cursor-pointer"
            >
              Anza Sasa / Get Started <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="btn-ghost w-full sm:w-auto px-8 py-4 rounded-xl font-bold border border-slate-800 text-slate-300 hover:text-white cursor-pointer"
            >
              Sign In to Store / Ingia
            </button>
          </motion.div>

          {/* Core Trust Seals */}
          <div className="pt-8 grid grid-cols-3 gap-4 border-t border-slate-900/60 max-w-lg mx-auto lg:mx-0">
            <div>
              <p className="font-mono text-xl font-bold text-white tracking-tight">Real-time</p>
              <p className="text-xs text-slate-500">Live multi-device</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-emerald-400 tracking-tight">M-Pesa</p>
              <p className="text-xs text-slate-500">Instant validation</p>
            </div>
            <div>
              <p className="font-mono text-xl font-bold text-indigo-400 tracking-tight">Automated</p>
              <p className="text-xs text-slate-500">Smart diagnostics</p>
            </div>
          </div>
        </div>

        {/* Feature Cards Showcase */}
        <div className="lg:col-span-5 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', duration: 0.2 }}
          >
            <GlassCard className="border-indigo-500/10 bg-slate-950/40 p-5">
              <div className="flex gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 h-11 w-11 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">Smart Diagnostics / Ushauri Kiotomatiki</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Get automated performance explanations, profit diagnosis, and low stock predictions.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', duration: 0.2 }}
          >
            <GlassCard className="border-emerald-500/10 bg-slate-950/40 p-5">
              <div className="flex gap-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0 h-11 w-11 flex items-center justify-center">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">M-Pesa & Offline Ready</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    High-contrast layout formatted for small displays. Fully operational even when network fails.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            transition={{ type: 'spring', duration: 0.2 }}
          >
            <GlassCard className="border-indigo-500/10 bg-slate-950/40 p-5">
              <div className="flex gap-4">
                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20 shrink-0 h-11 w-11 flex items-center justify-center">
                  <GitMerge className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white font-bold text-sm">Multi-Branch Scoping</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    Configure multiple stores, allocate unique roles, and monitor cross-branch transaction feeds.
                  </p>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 md:px-12 py-6 border-t border-slate-900/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 relative z-10 w-full select-none">
        <span>© {new Date().getFullYear()} Biashara Yako POS. To use securely globally.</span>
        <span className="text-center sm:text-right font-mono text-[10px] uppercase">
          Created by{' '}
          <a 
            href="https://nex-chi-six.vercel.app/" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition normal-case underline"
          >
            Munene Jackson Mwaniki from Nex-Ink
          </a>
        </span>
      </footer>
    </div>
  );
};
export default LandingPage;
