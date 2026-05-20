import { motion } from 'motion/react';
import { ShoppingCart, BarChart3, Users, Package, ChevronRight, CheckCircle2, Store, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';

const navItems = [
  { name: 'Features', href: '#features' },
  { name: 'Solutions', href: '#solutions' },
  { name: 'How it Works', href: '#how-it-works' },
];

const features = [
  {
    title: 'Real-time Dashboards',
    description: 'Track your sales, expenses, and profit margins instantly across all business locations.',
    icon: BarChart3,
  },
  {
    title: 'Inventory Control',
    description: 'Automated stock tracking with low-stock alerts and transfer management between branches.',
    icon: Package,
  },
  {
    title: 'Employee Management',
    description: 'Role-based access control to secure your operations while empowering your team.',
    icon: Users,
  },
  {
    title: 'Sales & Receipts',
    description: 'Fast POS interface with M-Pesa reference tracking and professional receipt generation.',
    icon: ShoppingCart,
  },
];

const businessTypes = [
  'Bakery', 'Restaurant', 'Retail', 'Wholesale', 'Agrovet', 
  'Pharmacy', 'Hardware', 'Salon', 'Kibanda', 'Supermarket',
  'Electronics', 'Clothes & Fashion'
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-navy text-slate-300">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-navy/80 backdrop-blur-xl z-50 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500">
              <Store className="text-navy w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black text-white tracking-widest italic">BIASHARA YAKO</span>
          </div>
          <div className="hidden md:flex items-center gap-12">
            {navItems.map((item) => (
              <a key={item.name} href={item.href} className="text-slate-500 hover:text-gold transition-all font-bold text-[10px] uppercase tracking-[0.2em] relative group">
                {item.name}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gold transition-all group-hover:w-full" />
              </a>
            ))}
            <Link to="/login" className="bg-gold text-navy px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-gold-light hover:shadow-xl hover:shadow-gold/10 transition-all">
              Launch Console
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-32 px-6 lg:px-12 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gold/5 blur-[120px] rounded-full -mr-96 -mt-96 opacity-50" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full -ml-48 -mb-48 opacity-30" />
        
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-gold-light font-bold text-[10px] uppercase tracking-[0.25em] mb-10 shadow-2xl">
              <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
              Kenyan Enterprise Exclusive
            </div>
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-[0.9] mb-10 tracking-tighter">
              The Standard <br />
              <span className="text-gold italic">of Commerce.</span>
            </h1>
            <p className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Professional Point of Sale architecture designed for the Kenyan merchant. 
              Synchronize inventory, human resources, and revenue intelligence across multiple territories.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <Link to="/login" className="px-10 py-5 bg-gold text-navy rounded-2xl font-black text-xs tracking-widest shadow-2xl shadow-gold/10 hover:bg-gold-light hover:scale-105 transition-all flex items-center justify-center gap-3 uppercase">
                Initialize System <ChevronRight size={20} strokeWidth={3} />
              </Link>
              <Link to="/login" className="px-10 py-5 bg-navy border border-slate-800 text-white rounded-2xl font-black text-xs tracking-widest hover:border-slate-600 hover:bg-white/5 transition-all flex items-center justify-center gap-3 uppercase">
                Agent Login
              </Link>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="flex-1 relative group"
          >
            <div className="relative z-10 rounded-[40px] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-white/5 transform lg:-rotate-2 transition-transform duration-700 group-hover:rotate-0">
              <img 
                src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&q=80&w=1200" 
                alt="POS Dashboard Preview" 
                className="w-full h-auto opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy via-transparent to-transparent opacity-60" />
            </div>
            <div className="absolute -inset-4 bg-gold/5 blur-3xl rounded-[40px] -z-10 group-hover:bg-gold/10 transition-all duration-700" />
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 bg-navy relative border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <h2 className="text-xl font-black text-white italic mb-6 tracking-tight uppercase">Full Suite Intelligence</h2>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">
              Engineered for absolute reliability in high-stakes retail environments.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="p-10 rounded-[40px] bg-navy-muted border border-slate-800 hover:border-gold/30 hover:shadow-2xl hover:shadow-gold/5 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 blur-3xl -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-16 h-16 bg-navy rounded-2xl flex items-center justify-center mb-8 border border-slate-800 group-hover:bg-gold group-hover:border-gold transition-all relative z-10 shadow-inner">
                  <feature.icon className="text-gold group-hover:text-navy w-7 h-7" strokeWidth={1.5} />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 tracking-tight group-hover:text-gold transition-colors">{feature.title}</h3>
                <p className="text-slate-500 group-hover:text-slate-400 leading-relaxed font-medium text-sm">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Solutions Section */}
      <section id="solutions" className="py-32 bg-navy-muted overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
          <div className="flex flex-col lg:flex-row gap-24 items-center">
            <div className="flex-1">
              <h2 className="text-5xl lg:text-7xl font-black text-white mb-10 leading-[0.95] tracking-tighter italic">
                Sectors of <br />
                <span className="text-gold">Excellence.</span>
              </h2>
              <div className="flex flex-wrap gap-4">
                {businessTypes.map((type) => (
                  <span key={type} className="px-6 py-2.5 rounded-full bg-navy/50 border border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:bg-gold hover:text-navy hover:border-gold transition-all cursor-default shadow-sm">
                    {type}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-6 scale-90 lg:scale-100 origin-right">
              <div className="space-y-6 pt-16">
                <div className="h-56 bg-navy rounded-[40px] p-8 border border-slate-800 flex flex-col justify-end hover:border-gold/20 transition-all shadow-2xl">
                   <div className="text-gold font-black uppercase tracking-widest text-xs mb-3 italic">M-Pesa Flow</div>
                   <div className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Digital liquidity management for secure local currency settlement.</div>
                </div>
                <div className="h-72 bg-navy rounded-[40px] p-8 border border-slate-800 flex flex-col justify-between hover:border-gold/20 transition-all shadow-2xl">
                   <Laptop className="text-gold w-10 h-10" />
                   <div>
                     <div className="font-black text-2xl text-white mb-2 tracking-tight italic uppercase">PWA Node</div>
                     <div className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Install as a native module on mobile enterprise devices.</div>
                   </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-72 bg-navy rounded-[40px] p-8 border border-slate-800 flex flex-col justify-between hover:border-gold/20 transition-all shadow-2xl">
                   <CheckCircle2 className="text-green-500 w-10 h-10" />
                   <div>
                     <div className="font-black text-2xl text-white mb-2 tracking-tight italic uppercase">Grid Sync</div>
                     <div className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Offline resilient operational architecture for zero downtime.</div>
                   </div>
                </div>
                <div className="h-56 bg-navy rounded-[40px] p-8 border border-slate-800 flex flex-col justify-end hover:border-gold/20 transition-all shadow-2xl">
                   <div className="text-gold font-black uppercase tracking-widest text-xs mb-3 italic">Network Control</div>
                   <div className="text-[10px] font-bold text-slate-500 leading-relaxed uppercase tracking-widest">Universal hub for multi-branch monitoring and logistics.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-navy border-t border-white/5 relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-gold/5 blur-3xl -mb-32 -mr-32 rounded-full" />
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col md:flex-row justify-between items-center gap-12 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
              <Store className="text-navy w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-xl font-black text-white italic tracking-tighter">BIASHARA YAKO</span>
          </div>
          <div className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
            © 2026 BIASHARA YAKO CONSORTIUM. SECURE OPERATIONS.
          </div>
          <div className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.2em]">
            System Architect:{' '}
            <a 
              href="https://nex-chi-six.vercel.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gold hover:text-white transition-all underline decoration-gold/30 underline-offset-8"
            >
              JACKSON MWANIKI MUNENE
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
