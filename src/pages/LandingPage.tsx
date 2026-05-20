import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  BarChart3, 
  Store, 
  ArrowRight,
  ShoppingCart,
  Zap,
  Globe
} from 'lucide-react';

import { useIsMobile } from '../hooks/useIsMobile';

export default function LandingPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert("Initializing PWA manifest... Biashara Yako is ready for installation. Use 'Add to Home Screen' in your browser menu to install if you don't see a prompt.");
    }
  };

  return (
    <div className="min-h-screen bg-navy text-white selection:bg-gold/30 overflow-x-hidden">
      {/* Navigation */}
      <nav className="h-24 px-6 lg:px-20 flex items-center justify-between border-b border-slate-800 backdrop-blur-md bg-navy/50 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
            <Store className="text-navy w-6 h-6" strokeWidth={2.5} />
          </div>
          <span className="text-2xl font-black italic tracking-tighter">BIASHARA YAKO</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-4">
          <button 
            onClick={() => navigate('/login')} 
            className="px-3 py-2 text-[10px] sm:text-xs font-black uppercase tracking-widest text-white/70 hover:text-gold transition-colors"
          >
            Sign In
          </button>
          <button 
            onClick={() => navigate('/register-business')}
            className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gold text-navy rounded-xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-xl shadow-gold/10 hover:bg-gold-light transition-all active:scale-95 whitespace-nowrap"
          >
            {isMobile ? 'Launch Hub' : 'Launch Enterprise'}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 lg:pt-32 pb-20 px-6 lg:px-20 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[160px] rounded-full -mr-96 -mt-96 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 blur-[140px] rounded-full -ml-48 -mb-48" />

        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-black uppercase tracking-widest mb-8"
            >
              <Zap size={14} fill="currentColor" /> Optimized for Kenyan Commerce
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl lg:text-8xl font-black italic tracking-tighter mb-8 leading-[0.9]"
            >
              The Smart <span className="text-gold">Hub</span> For Your Business.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-lg lg:text-xl font-medium max-w-2xl mb-12 leading-relaxed"
            >
              Biashara Yako is more than a POS. It's a high-performance architecture to manage inventory, staff, and multi-branch expansions with real-time intelligence.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <button 
                onClick={() => navigate('/register-business')}
                className="h-16 px-10 bg-gold text-navy rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-2xl shadow-gold/20 hover:bg-gold-light transition-all"
              >
                Bootstrap Now <ArrowRight size={18} strokeWidth={3} />
              </button>
              <button 
                onClick={handleInstall}
                className="h-16 px-10 bg-navy-muted border border-slate-800 text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:text-white transition-all flex items-center justify-center gap-3"
              >
                Download PWA <Smartphone size={18} strokeWidth={2} />
              </button>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="flex-1 relative"
          >
            <div className="relative z-10 bg-navy-muted border border-slate-800 rounded-[40px] shadow-2xl overflow-hidden p-3 rotate-2 hover:rotate-0 transition-transform duration-700">
               <div className="bg-navy h-[500px] w-full rounded-[32px] border border-slate-800 overflow-hidden relative group">
                  {/* Mock UI */}
                  <div className="p-8 border-b border-slate-800 flex justify-between items-center">
                     <div className="w-12 h-2 bg-slate-800 rounded-full" />
                     <div className="flex gap-2">
                        <div className="w-4 h-4 bg-red-500/20 rounded-full" />
                        <div className="w-4 h-4 bg-gold/20 rounded-full" />
                     </div>
                  </div>
                  <div className="p-8 space-y-6">
                     <div className="h-12 w-full bg-slate-800/50 rounded-xl animate-pulse" />
                     <div className="grid grid-cols-2 gap-4">
                        <div className="h-32 bg-gold/5 border border-gold/10 rounded-2xl" />
                        <div className="h-32 bg-blue-500/5 border border-blue-500/10 rounded-2xl" />
                     </div>
                     <div className="h-40 w-full bg-slate-800/30 rounded-2xl" />
                  </div>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 lg:py-32 bg-white/5 border-y border-slate-800 px-6 lg:px-20">
         <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <BenefitCard 
              icon={Globe} 
              title="Multi-Tenant" 
              desc="Scale your enterprise across dozens of branches with unified control." 
            />
            <BenefitCard 
              icon={ShieldCheck} 
              title="Military Auth" 
              desc="Google OAuth for owners, lightweight credentials for onsite staff." 
            />
            <BenefitCard 
              icon={BarChart3} 
              title="Live Matrix" 
              desc="Compare branch performance in realtime with high-fidelity charts." 
            />
            <BenefitCard 
              icon={ShoppingCart} 
              title="Offline Sync" 
              desc="Optimized for Kenya's connectivity. Keep selling even when signal drops." 
            />
         </div>
      </section>

      {/* Features Detail */}
      <section className="py-24 px-6 lg:px-20">
         <div className="max-w-4xl mx-auto text-center mb-20">
            <h2 className="text-4xl lg:text-6xl font-black italic tracking-tighter mb-6 underline decoration-gold decoration-4 underline-offset-8">Engineered for Performance.</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">A comprehensive ecosystem for modern retailers</p>
         </div>

         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
            <button 
              onClick={handleInstall}
              className="p-10 bg-navy-muted border border-slate-800 rounded-[50px] group hover:border-gold/30 transition-all text-left"
            >
               <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-gold mb-8 shadow-inner">
                  <Smartphone size={32} />
               </div>
               <h3 className="text-3xl font-black italic text-white mb-4">Installable Android App</h3>
               <p className="text-slate-400 font-medium leading-relaxed">Download Biashara Yako directly to your phone. It functions like a native Android app, giving your staff instant access on the floor.</p>
            </button>
            <button 
              onClick={() => navigate('/register-business')}
              className="p-10 bg-navy-muted border border-slate-800 rounded-[50px] group hover:border-gold/30 transition-all text-left"
            >
               <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center text-gold mb-8 shadow-inner">
                  <Store size={32} />
               </div>
               <h3 className="text-3xl font-black italic text-white mb-4">Launch Hub</h3>
               <p className="text-slate-400 font-medium leading-relaxed">Ready to transform your commerce operations? Initialize your workspace in seconds.</p>
            </button>
         </div>
      </section>

      <footer className="py-20 px-6 lg:px-20 border-t border-slate-800 bg-navy">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                <Store className="text-navy w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-xl font-black italic tracking-tighter">BIASHARA YAKO</span>
            </div>
            <div className="flex flex-col items-center md:items-end gap-2">
              <div className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                 &copy; 2026 Consortium Operations. All Rights Reserved.
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest">
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
      </footer>
    </div>
  );
}

function BenefitCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="group">
       <div className="w-14 h-14 bg-navy border border-slate-800 rounded-2xl flex items-center justify-center text-gold mb-6 shadow-xl group-hover:bg-gold group-hover:text-navy transition-all duration-500">
          <Icon size={24} />
       </div>
       <h4 className="text-xl font-black italic tracking-tight text-white mb-3">{title}</h4>
       <p className="text-slate-500 font-medium text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
