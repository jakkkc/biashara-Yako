import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  UserPlus, 
  Tag, 
  CreditCard, 
  Smartphone, 
  Banknote,
  X,
  Printer,
  ChevronRight,
  ShoppingCart,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const categories = ['All', 'Beverages', 'Flour', 'Sugar', 'Oil', 'Hygiene', 'Snacks'];

const demoProducts = [
  { id: '1', name: 'Fresh Milk 500ml', price: 120, category: 'Beverages', stock: 45 },
  { id: '2', name: 'Ajab Flour 2kg', price: 180, category: 'Flour', stock: 12 },
  { id: '3', name: 'Kabras Sugar 1kg', price: 155, category: 'Sugar', stock: 30 },
  { id: '4', name: 'Cooking Oil 1L', price: 230, category: 'Oil', stock: 8 },
  { id: '5', name: 'Geisha Soap', price: 85, category: 'Hygiene', stock: 55 },
  { id: '6', name: 'Coca Cola 500ml', price: 70, category: 'Beverages', stock: 100 },
];

export default function POSView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  const filteredProducts = useMemo(() => {
    return demoProducts.filter(p => 
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeCategory]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const total = subtotal; // Simplified for now (no tax/discount logic here yet)

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6 overflow-hidden animate-in fade-in duration-500">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-4">
           <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search products by name or SKU..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-14 pl-12 pr-4 bg-navy-muted border border-slate-800 rounded-2xl focus:border-gold/50 outline-none shadow-sm transition-all text-white"
              />
           </div>
           <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide max-w-full">
              {categories.map(cat => (
                <button 
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all whitespace-nowrap border ${
                    activeCategory === cat 
                      ? 'bg-gold text-navy border-gold shadow-lg shadow-gold/10' 
                      : 'bg-navy-muted text-slate-500 border-slate-800 hover:text-slate-300 hover:border-slate-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
           </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 pb-4 scrollbar-thin scrollbar-thumb-slate-800">
           {filteredProducts.map(product => (
             <motion.button 
               key={product.id}
               whileTap={{ scale: 0.98 }}
               onClick={() => addToCart(product)}
               className="bg-navy-muted p-5 rounded-3xl border border-slate-800 shadow-sm hover:border-slate-700 hover:shadow-xl transition-all text-left flex flex-col group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-2xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="aspect-square bg-navy rounded-2xl mb-4 flex items-center justify-center border border-slate-800 group-hover:border-gold/20 transition-all relative z-10">
                   <Package className="text-slate-700 w-10 h-10 group-hover:text-gold/50 transition-colors" />
                </div>
                <div className="flex-1 relative z-10">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">{product.category}</p>
                   <h3 className="font-bold text-white mb-1.5 line-clamp-2 tracking-tight">{product.name}</h3>
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {product.stock}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-800/50 relative z-10">
                   <span className="font-black text-white text-lg tracking-tight">Ksh {product.price}</span>
                   <div className="w-9 h-9 bg-navy border border-slate-800 rounded-xl flex items-center justify-center text-gold shadow-lg group-hover:bg-gold group-hover:text-navy group-hover:border-gold transition-all">
                      <Plus size={18} strokeWidth={3} />
                   </div>
                </div>
             </motion.button>
           ))}
        </div>
      </div>

      {/* Cart Container */}
      <div className="w-96 bg-navy-muted rounded-3xl border border-slate-800 shadow-2xl flex flex-col shrink-0 overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-navy-muted z-10">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold/10 rounded-xl flex items-center justify-center border border-gold/20">
                 <ShoppingCart className="text-gold w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Cart</h3>
           </div>
           <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-[10px] font-black tracking-widest">{cart.length} ITEMS</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-hide">
           {cart.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50">
                <div className="w-24 h-24 bg-navy rounded-full flex items-center justify-center border border-slate-800 mb-4">
                   <ShoppingCart size={40} />
                </div>
                <p className="font-bold uppercase tracking-widest text-xs">Ready for Sale</p>
             </div>
          ) : (
             cart.map(item => (
               <div key={item.id} className="p-5 bg-navy rounded-2xl border border-slate-800 flex flex-col gap-4 group transition-all hover:border-slate-700">
                  <div className="flex justify-between items-start">
                     <div className="flex-1">
                        <p className="font-bold text-white leading-tight mb-1 tracking-tight">{item.name}</p>
                        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider font-mono">Ksh {item.price} @unit</p>
                     </div>
                     <button onClick={() => updateQty(item.id, -item.qty)} className="text-slate-600 hover:text-red-500 transition-colors p-1">
                        <Trash2 size={16} />
                     </button>
                  </div>
                  <div className="flex items-center justify-between">
                     <div className="flex items-center bg-navy-muted rounded-lg border border-slate-800">
                        <button onClick={() => updateQty(item.id, -1)} className="p-2 text-slate-500 hover:text-gold transition-colors">
                           <Minus size={14} />
                        </button>
                        <span className="w-8 text-center font-bold text-xs text-white">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="p-2 text-slate-500 hover:text-gold transition-colors">
                           <Plus size={14} />
                        </button>
                     </div>
                     <div className="font-black text-gold text-lg tracking-tighter">Ksh {item.price * item.qty}</div>
                  </div>
               </div>
             ))
           )}
        </div>

        {/* Footer info */}
        <div className="p-6 bg-slate-800/10 rounded-t-[32px] border-t border-slate-800 space-y-4">
           <div className="grid grid-cols-2 gap-3">
              <button className="flex items-center justify-center gap-2 py-3 bg-navy border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all font-bold text-[10px] uppercase tracking-widest">
                 <UserPlus size={16} className="text-gold" /> Add Client
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-navy border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all font-bold text-[10px] uppercase tracking-widest">
                 <Tag size={16} className="text-gold" /> Promo
              </button>
           </div>

           <div className="pt-2">
              <div className="flex justify-between text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1.5 px-1">
                 <span>Subtotal</span>
                 <span className="text-slate-300">Ksh {subtotal}</span>
              </div>
              <div className="flex justify-between text-white text-3xl font-black px-1 tracking-tighter">
                 <span>KES</span>
                 <span>{total.toLocaleString()}</span>
              </div>
           </div>

           <button 
             disabled={cart.length === 0}
             onClick={() => setShowCheckout(true)}
             className="w-full bg-gold text-navy h-16 rounded-2xl font-black text-sm tracking-[0.1em] shadow-xl shadow-gold/5 hover:bg-gold-light transition-all disabled:opacity-30 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-3 mt-4"
           >
              PAYMENT PROCESS <ChevronRight size={18} strokeWidth={3} />
           </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowCheckout(false)}
               className="absolute inset-0 bg-navy/80 backdrop-blur-md"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="relative w-full max-w-xl bg-navy-muted rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden"
             >
                <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                   <h3 className="text-2xl font-black text-white italic tracking-tighter">Transaction</h3>
                   <button onClick={() => setShowCheckout(false)} className="p-2 border border-slate-800 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-10">
                   <div className="mb-10 text-center relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/5 blur-3xl rounded-full" />
                      <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-3 relative z-10">Total Payable</p>
                      <h2 className="text-6xl font-black text-white tracking-tighter relative z-10">KES {total.toLocaleString()}</h2>
                   </div>

                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 ml-1">Select Payment System</p>
                   <div className="grid grid-cols-2 gap-5 mb-10">
                      <button className="p-8 border border-slate-800 hover:border-gold/30 rounded-[32px] flex flex-col items-center gap-4 transition-all group bg-navy/30">
                         <div className="w-16 h-16 bg-slate-800/30 rounded-2xl flex items-center justify-center group-hover:bg-gold/10 group-hover:text-gold transition-all text-slate-600 border border-transparent group-hover:border-gold/20">
                           <Banknote size={32} />
                         </div>
                         <span className="font-bold text-xs uppercase tracking-widest text-slate-400 group-hover:text-white">Cash Only</span>
                      </button>
                      <button className="p-8 border-2 border-gold rounded-[32px] flex flex-col items-center gap-4 bg-gold/5 transition-all group shadow-[0_0_40px_rgba(234,179,8,0.05)]">
                         <div className="w-16 h-16 bg-gold rounded-2xl flex items-center justify-center text-navy shadow-lg shadow-gold/20">
                           <Smartphone size={32} strokeWidth={2.5} />
                         </div>
                         <span className="font-bold text-xs uppercase tracking-widest text-white">M-Pesa Express</span>
                      </button>
                   </div>

                   <div className="space-y-4">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Confirmation Details (Reference)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. QXRT0..." 
                        className="w-full h-16 px-6 bg-navy border border-slate-800 focus:border-gold/50 rounded-2xl font-mono uppercase focus:ring-4 focus:ring-gold/5 outline-none text-white text-xl tracking-widest transition-all"
                      />
                   </div>
                </div>

                <div className="p-10 bg-slate-900/40 border-t border-slate-800 flex gap-4">
                   <button className="flex-1 h-16 bg-navy-muted border border-slate-800 rounded-2xl font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                      <Printer size={20} className="text-gold" /> Print Bill
                   </button>
                   <button className="flex-1 h-16 bg-gold text-navy rounded-2xl font-black text-sm tracking-widest hover:bg-gold-light transition-all shadow-xl shadow-gold/10 uppercase">
                      Confirm Sale
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
