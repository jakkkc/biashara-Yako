import React, { useRef } from 'react';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  Layers, 
  ShieldCheck, 
  TrendingUp, 
  Printer, 
  ShoppingBag, 
  ArrowRight, 
  Smartphone, 
  MapPin, 
  Clock, 
  ChevronRight 
} from 'lucide-react';
import { useI18n } from '../i18n/context';

interface LandingPageProps {
  onNavigate: (page: string) => void;
}

const KENYAN_BUSINESS_TYPES = [
  'Bakery', 'Restaurant', 'Retail Store', 'Wholesale', 'Agrovet', 
  'Pharmacy', 'Hardware', 'Salon & Spa', 'Kibanda', 'Supermarket', 
  'Electronics', 'Posho Mill', 'Matatu Sacco', 'Boutique', 'Butchery'
];

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const { t, language, setLanguage } = useI18n();
  const demoSectionRef = useRef<HTMLDivElement>(null);

  const scrollTodo = () => {
    demoSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0C0C0D] text-white selection:bg-[#C5A059] selection:text-[#0C0C0D] font-sans antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-[#0C0C0D]/90 backdrop-blur-md border-b border-[#2C2C2E] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('landing')}>
          <div className="w-10 h-10 border border-[#C5A059] flex items-center justify-center bg-[#161618] transition-transform hover:rotate-12 duration-200">
            <span className="serif text-xl font-bold text-[#C5A059]">V</span>
          </div>
          <div>
            <span className="font-display font-light text-2xl tracking-wide uppercase text-white block">
              {t('appName')}
            </span>
            <span className="text-[9px] text-stone-500 uppercase tracking-[0.25em] block -mt-1 font-mono">
              {t('tagline')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Language Toggle */}
          <div className="bg-[#161618] border border-[#2C2C2E] rounded-md p-1 flex">
            <button 
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                language === 'en' 
                  ? 'bg-[#C5A059] text-black font-semibold' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              EN
            </button>
            <button 
              onClick={() => setLanguage('sw')}
              className={`px-3 py-1 rounded text-xs font-mono transition-all ${
                language === 'sw' 
                  ? 'bg-[#C5A059] text-black font-semibold' 
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              SW
            </button>
          </div>

          <button 
            onClick={() => onNavigate('login')}
            className="hidden sm:inline-block px-4 py-2 text-stone-300 hover:text-[#C5A059] text-xs uppercase tracking-widest font-medium transition-colors"
          >
            {t('login')}
          </button>

          <button 
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 border border-[#C5A059] text-black bg-[#C5A059] text-xs uppercase tracking-widest font-semibold hover:bg-transparent hover:text-[#C5A059] transition-all duration-300 active:scale-95"
          >
            {t('getStarted')}
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative px-4 md:px-8 pt-24 pb-28 flex flex-col items-center text-center overflow-hidden">
        {/* Decorative Grid Lines to mimic Focus Terminal */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#2C2C2E_1px,transparent_1px),linear-gradient(to_bottom,#2C2C2E_1px,transparent_1px)] bg-[size:5rem_5rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 -z-10" />
        
        <motion.a 
          href="https://nex-chi-six.vercel.app/"
          target="_blank"
          rel="noreferrer"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-[#C5A059] hover:bg-white/10 transition-colors mb-8"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#C5A059] animate-pulse" />
          {t('createdBy')}
        </motion.a>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="serif font-light text-4xl sm:text-5xl md:text-7xl tracking-wide uppercase text-white max-w-5xl leading-tight"
        >
          {t('heroTitle')}
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-base sm:text-lg md:text-xl text-stone-400 max-w-2xl font-light leading-relaxed"
        >
          {t('heroSubtitle')}
        </motion.p>

        {/* CTAs */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 flex flex-col sm:flex-row items-center gap-6"
        >
          <button 
            onClick={() => onNavigate('login')}
            className="w-full sm:w-auto px-8 py-4 bg-[#C5A059] text-black text-xs uppercase tracking-widest font-semibold hover:bg-transparent hover:text-[#C5A059] border border-[#C5A059] active:scale-95 transition-all flex items-center justify-center gap-2 duration-300"
          >
            {t('getStarted')}
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button 
            onClick={scrollTodo}
            className="w-full sm:w-auto px-8 py-4 bg-transparent border border-stone-700 text-stone-300 text-xs uppercase tracking-widest font-semibold hover:border-[#C5A059] hover:text-white transition-all flex items-center justify-center gap-2 duration-300"
          >
            {t('seeDemo')}
          </button>
        </motion.div>
      </section>

      {/* Active Business Types Chip Showcase */}
      <section className="py-10 bg-[#0A0A0B] border-y border-[#2C2C2E] overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[10px] text-stone-500 uppercase tracking-[0.3em] font-mono mb-8">
            Supporting all businesses in Kenya
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {KENYAN_BUSINESS_TYPES.map((type, idx) => (
              <span 
                key={idx}
                className="px-5 py-2.5 bg-[#161618]/50 border border-stone-800 rounded-none text-xs font-mono text-stone-300 hover:border-[#C5A059] hover:text-white transition-all duration-300"
              >
                🇰🇪 {type}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[10px] text-[#C5A059] uppercase tracking-[0.3em] font-mono block mb-2">Exclusive Suite</span>
          <h2 className="serif text-4xl sm:text-5xl text-white font-light">
            {t('benefitsTitle')}
          </h2>
          <p className="mt-4 text-stone-400 font-light">
            {t('benefitsDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] mb-6">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b1Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b1Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-[#C5A059] tracking-wider mt-6 block">CORE ALPHA</span>
          </div>

          {/* Card 2 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-stone-850 flex items-center justify-center text-stone-400 mb-6">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b2Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b2Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-stone-500 tracking-wider mt-6 block">OFFLINE REALTIME</span>
          </div>

          {/* Card 3 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-stone-850 flex items-center justify-center text-[#C5A059] mb-6">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b3Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b3Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-[#C5A059] tracking-wider mt-6 block">SECURITY VERIFIED</span>
          </div>

          {/* Card 4 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-stone-850 flex items-center justify-center text-stone-400 mb-6 font-light">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b4Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b4Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-stone-500 tracking-wider mt-6 block">TENANCY SCALE</span>
          </div>

          {/* Card 5 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-stone-850 flex items-center justify-center text-[#C5A059] mb-6">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b5Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b5Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-[#C5A059] tracking-wider mt-6 block">AUDITED MATRIX</span>
          </div>

          {/* Card 6 */}
          <div className="glass p-8 hover:border-[#C5A059]/40 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 border border-stone-850 flex items-center justify-center text-stone-400 mb-6">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="serif text-xl text-white mb-2">{t('b6Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('b6Desc')}</p>
            </div>
            <span className="text-[9px] font-mono text-stone-500 tracking-wider mt-6 block">HARDWARE SYNC</span>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section ref={demoSectionRef} className="bg-[#0A0A0B] py-24 border-y border-[#2C2C2E]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="text-[10px] text-[#C5A059] tracking-[0.3em] font-mono uppercase block mb-2">{t('howItWorks')}</span>
            <h2 className="serif text-4xl sm:text-5xl text-white font-light">
              Three Simple Steps to Begin
            </h2>
            <p className="mt-4 text-stone-400 text-sm font-light">
              {t('howItWorksDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="flex flex-col items-center text-center p-8 glass relative">
              <div className="w-12 h-12 border border-[#C5A059] text-[#C5A059] font-light serif flex items-center justify-center text-xl mb-6 bg-white/5">I</div>
              <h3 className="serif text-xl text-white mb-2">{t('step1Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('step1Desc')}</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 glass relative">
              <div className="w-12 h-12 border border-[#C5A059] text-[#C5A059] font-light serif flex items-center justify-center text-xl mb-6 bg-white/5">II</div>
              <h3 className="serif text-xl text-white mb-2">{t('step2Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('step2Desc')}</p>
            </div>

            <div className="flex flex-col items-center text-center p-8 glass relative">
              <div className="w-12 h-12 border border-[#C5A059] text-[#C5A059] font-light serif flex items-center justify-center text-xl mb-6 bg-white/5">III</div>
              <h3 className="serif text-xl text-white mb-2">{t('step3Title')}</h3>
              <p className="text-xs text-stone-400 leading-relaxed font-light">{t('step3Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-24">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <span className="text-[10px] text-[#C5A059] uppercase tracking-[0.3em] font-mono block mb-2">Merchant Voice</span>
          <h2 className="serif text-4xl sm:text-5xl text-white font-light animate-pulse">
            Trusted by Kenyan Merchants
          </h2>
          <p className="mt-3 text-xs text-stone-400 font-light">
            Real reviews from our early pilot merchants in Nairobi, Kisumu and Mombasa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass p-8 flex flex-col justify-between">
            <p className="text-xs italic text-stone-400 leading-relaxed font-light block">
              "Biashara Yako POS saved me hours of calculation. Balancing the shifts in my Agrovet when offline is now extremely painless. Jackson has delivered a sterling product!"
            </p>
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
              <div className="w-9 h-9 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-mono text-xs">WK</div>
              <div>
                <h4 className="text-xs font-semibold text-white">Wanjala Kimani</h4>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Owner, Kimani Agrovet, Eldoret</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 flex flex-col justify-between">
            <p className="text-xs italic text-stone-400 leading-relaxed font-light block">
              "Setting up separate logins for my cashiers and tracking low stock items immediately in my chemist branches is a dream. Highly recommended!"
            </p>
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
              <div className="w-9 h-9 border border-stone-800 flex items-center justify-center text-stone-400 font-mono text-xs">AO</div>
              <div>
                <h4 className="text-xs font-semibold text-white">Asha Onyango</h4>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Manager, Milele Chemists, Kisumu</p>
              </div>
            </div>
          </div>

          <div className="glass p-8 flex flex-col justify-between">
            <p className="text-xs italic text-stone-400 leading-relaxed font-light block">
              "The ability to print clean receipts and check the net real-time profit straight from my smartphone makes this the best tool for small duka business owners."
            </p>
            <div className="flex items-center gap-4 mt-8 pt-6 border-t border-white/5">
              <div className="w-9 h-9 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] font-mono text-xs">JM</div>
              <div>
                <h4 className="text-xs font-semibold text-white">John Mutua</h4>
                <p className="text-[10px] text-stone-500 uppercase tracking-widest font-mono">Owner, Mutua Wholesalers, Machakos</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0C0C0D] border-t border-[#2C2C2E] px-4 md:px-8 py-14 text-center">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-left">
            <h4 className="serif text-2xl tracking-wide uppercase text-white">{t('appName')}</h4>
            <p className="text-xs text-stone-500 mt-1 uppercase tracking-widest font-mono">{t('tagline')}</p>
          </div>
          
          <div className="flex flex-wrap justify-center gap-6 text-xs text-stone-400 font-mono uppercase tracking-wider">
            <a href="https://nex-chi-six.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-[#C5A059] transition-colors">Portfolio</a>
            <a href="#benefits" className="hover:text-[#C5A059] transition-colors">Features</a>
            <a href="#privacy" className="hover:text-[#C5A059] transition-colors">Privacy Policy</a>
            <a href="#terms" className="hover:text-[#C5A059] transition-colors">Terms of Service</a>
          </div>
        </div>
        
        <hr className="my-10 border-[#2C2C2E]" />
        
        <p className="text-xs text-stone-500 uppercase tracking-widest font-mono">
          <a href="https://nex-chi-six.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-[#C5A059] text-[#C5A059] transition-all font-semibold">
            {t('footerCredit')}
          </a>
        </p>
      </footer>
    </div>
  );
}
