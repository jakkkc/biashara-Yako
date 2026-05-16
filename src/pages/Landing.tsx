import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  Zap, 
  Smartphone, 
  Users, 
  BarChart3, 
  ArrowRight,
  Store,
  MessageSquareCode
} from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';

export default function Landing() {
  const { firebaseUser, userProfile } = useAuth();

  const ctaPath = !firebaseUser ? '/login' : (userProfile ? '/dashboard' : '/register');

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden">
      {/* Navbar */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 max-w-7xl mx-auto">
        <h1 className="text-2xl font-display font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Biashara Yako
        </h1>
        <Link to={ctaPath} className="btn-primary">
          {firebaseUser ? 'Go to Dashboard' : 'Sign In'}
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative px-6 pt-20 pb-32 max-w-7xl mx-auto text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>
        
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-7xl font-display font-bold mb-6"
        >
          Simamia biashara yako. <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Mahali popote.
          </span>
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10"
        >
          The smart, offline-first POS system built for East African retailers, 
          restaurants, and service providers. Powered by AI insights.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link to="/register" className="btn-primary px-8 py-4 text-lg w-full sm:w-auto">
            Register Business
          </Link>
          <Link to="/login" className="px-8 py-4 text-lg border border-white/10 rounded-xl hover:bg-white/5 transition-all flex items-center gap-2 w-full sm:w-auto">
            Try Demo <ArrowRight className="w-5 h-5" />
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-2 gap-6 h-auto md:h-[600px]">
            <div className="md:col-span-8 md:row-span-1">
              <FeatureCard 
                icon={Zap} 
                title="AI Insights" 
                desc="Get daily AI recommendations on stock levels and pricing strategies based on your sales trends." 
                className="h-full"
              />
            </div>
            <div className="md:col-span-4 md:row-span-1">
              <FeatureCard 
                icon={Smartphone} 
                title="M-Pesa Support" 
                desc="Seamlessly track mobile money payments and reconcile instantly with integrated STK push support." 
                className="h-full bg-indigo-600 border-none !text-white"
                accent
              />
            </div>
            <div className="md:col-span-4 md:row-span-1">
              <FeatureCard 
                icon={Shield} 
                title="Offline First" 
                desc="Keep selling even when the internet is down. Syncs automatically when back online." 
                className="h-full"
              />
            </div>
            <div className="md:col-span-4 md:row-span-1">
              <FeatureCard 
                icon={BarChart3} 
                title="Deep Analytics" 
                desc="Professional reports for VAT, profit/loss, and inventory value." 
                className="h-full"
              />
            </div>
            <div className="md:col-span-4 md:row-span-1">
              <div className="glass-card p-8 flex flex-col justify-center items-center text-center h-full border-dashed border-slate-700 bg-transparent">
                <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                <div className="micro-label">Uptime Reliability</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-white/5 text-center text-slate-500">
        <p>© 2026 Biashara Yako POS. Built for the future of African commerce.</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, className = "", accent = false }: { icon: any, title: string, desc: string, className?: string, accent?: boolean }) {
  return (
    <div className={`glass-card p-8 group hover:border-indigo-500/50 transition-all flex flex-col justify-between ${className}`}>
      <div>
        <div className={`p-3 w-fit rounded-xl mb-6 group-hover:scale-110 transition-transform ${accent ? 'bg-white/20' : 'bg-indigo-500/10'}`}>
          <Icon className={`w-6 h-6 ${accent ? 'text-white' : 'text-indigo-400'}`} />
        </div>
        <h3 className={`text-xl font-display font-bold mb-3 ${accent ? 'text-white' : 'text-white'}`}>{title}</h3>
        <p className={`${accent ? 'text-indigo-100' : 'text-slate-400'} leading-relaxed text-sm`}>{desc}</p>
      </div>
      <div className="mt-6 flex items-center justify-between">
        <span className={`text-[10px] font-mono font-bold tracking-widest uppercase ${accent ? 'text-indigo-200' : 'text-slate-600'}`}>System Ready</span>
        <ArrowRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transition-all ${accent ? 'text-white' : 'text-indigo-400'}`} />
      </div>
    </div>
  );
}
