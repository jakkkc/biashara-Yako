import { useState, useMemo, useEffect } from 'react';
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
  Package,
  Loader2,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { collection, query, getDocs, doc, setDoc, writeBatch, increment } from 'firebase/firestore';
import { db } from '../../../lib/firebase';
import { useAuth } from '../../../hooks/useAuth';
import { Product, Sale } from '../../../types';

const categories = ['All', 'Retail', 'Beverages', 'Agrovet', 'Hygiene', 'Food', 'Other'];

export default function POSView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [mpesaRef, setMpesaRef] = useState('');
  const isMobile = useIsMobile();
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.businessId) {
      fetchProducts();
    }
  }, [profile?.businessId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, `businesses/${profile?.businessId}/inventory`));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      (activeCategory === 'All' || p.category === activeCategory) &&
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, activeCategory, products]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1, price: product.sellingPrice }];
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
  const total = subtotal;

  const handleCompleteSale = async () => {
    if (!profile?.businessId || cart.length === 0) return;
    setIsProcessing(true);
    
    const saleId = `SALE-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const batch = writeBatch(db);

    const saleData = {
      id: saleId,
      businessId: profile.businessId,
      branchId: profile.branchId || 'main',
      userId: profile.id,
      userName: profile.displayName,
      items: cart.map(item => ({
        productId: item.id,
        productName: item.name,
        quantity: item.qty,
        price: item.price,
        discount: 0
      })),
      subtotal,
      vatAmount: 0,
      discountTotal: 0,
      total,
      paymentMethod,
      mpesaReference: paymentMethod === 'M-Pesa' ? mpesaRef : undefined,
      status: 'completed',
      createdAt: Date.now()
    };

    try {
      // 1. Save Sale
      batch.set(doc(db, `businesses/${profile.businessId}/sales`, saleId), saleData);

      // 2. Update Stock Levels
      cart.forEach(item => {
        const productRef = doc(db, `businesses/${profile.businessId}/inventory`, item.id);
        batch.update(productRef, {
          quantity: increment(-item.qty)
        });
      });

      await batch.commit();
      
      setCart([]);
      setShowCheckout(false);
      setMpesaRef('');
      fetchProducts(); // Refresh stock in UI
      alert('Transaction finalized successfully.');
    } catch (error) {
      console.error(error);
      alert('System failure during transaction finalization.');
    } finally {
      setIsProcessing(false);
    }
  };

  const CartUI = () => (
    <div className="flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-navy-muted z-10 shrink-0">
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
             <div className="h-full flex flex-col items-center justify-center text-slate-700 opacity-50 py-20">
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

        <div className="p-6 bg-slate-800/10 border-t border-slate-800 shrink-0">
           <div className="grid grid-cols-2 gap-3 mb-6">
              <button className="flex items-center justify-center gap-2 py-3 bg-navy border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all font-bold text-[10px] uppercase tracking-widest">
                 <UserPlus size={16} className="text-gold" /> Add Client
              </button>
              <button className="flex items-center justify-center gap-2 py-3 bg-navy border border-slate-800 rounded-xl text-slate-500 hover:text-white hover:border-slate-700 transition-all font-bold text-[10px] uppercase tracking-widest">
                 <Tag size={16} className="text-gold" /> Promo
              </button>
           </div>

           <div>
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
             onClick={() => {
               setShowCheckout(true);
               setShowMobileCart(false);
             }}
             className="w-full bg-gold text-navy h-16 rounded-2xl font-black text-sm tracking-[0.1em] shadow-xl shadow-gold/5 hover:bg-gold-light transition-all disabled:opacity-30 disabled:grayscale disabled:shadow-none flex items-center justify-center gap-3 mt-4"
           >
              PAYMENT PROCESS <ChevronRight size={18} strokeWidth={3} />
           </button>
        </div>
    </div>
  );

  return (
    <div className="h-[calc(100vh-140px)] lg:h-full flex gap-6 overflow-hidden animate-in fade-in duration-500 relative">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
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

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 pb-20 lg:pb-4 scrollbar-thin scrollbar-thumb-slate-800">
           {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
                 <Loader2 className="animate-spin text-gold w-10 h-10" />
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Manifesting inventory...</p>
              </div>
           ) : filteredProducts.map(product => (
             <motion.button 
               key={product.id}
               whileTap={{ scale: 0.98 }}
               onClick={() => addToCart(product)}
               className="bg-navy-muted p-4 lg:p-5 rounded-3xl border border-slate-800 shadow-sm hover:border-slate-700 hover:shadow-xl transition-all text-left flex flex-col group relative overflow-hidden"
             >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 blur-2xl -mr-12 -mt-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="aspect-square bg-navy rounded-2xl mb-4 flex items-center justify-center border border-slate-800 group-hover:border-gold/20 transition-all relative z-10">
                   <Package className="text-slate-700 w-8 h-8 lg:w-10 lg:h-10 group-hover:text-gold/50 transition-colors" />
                </div>
                <div className="flex-1 relative z-10">
                   <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1.5">{product.category}</p>
                   <h3 className="font-bold text-white mb-1.5 text-sm lg:text-base line-clamp-2 tracking-tight">{product.name}</h3>
                   <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${product.quantity > product.reorderLevel ? 'bg-green-500' : 'bg-red-500'}`} />
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock: {product.quantity}</p>
                   </div>
                </div>
                <div className="flex items-center justify-between mt-auto pt-5 border-t border-slate-800/50 relative z-10">
                   <span className="font-black text-white text-base lg:text-lg tracking-tight">Ksh {product.sellingPrice}</span>
                   <div className="w-9 h-9 bg-navy border border-slate-800 rounded-xl flex items-center justify-center text-gold shadow-lg group-hover:bg-gold group-hover:text-navy group-hover:border-gold transition-all">
                      <Plus size={18} strokeWidth={3} />
                   </div>
                </div>
             </motion.button>
           ))}
        </div>
      </div>

      {/* Cart Container - Desktop */}
      {!isMobile && (
        <div className="w-96 bg-navy-muted rounded-3xl border border-slate-800 shadow-2xl flex flex-col shrink-0 overflow-hidden">
          <CartUI />
        </div>
      )}

      {/* Mobile Floating Cart Trigger */}
      {isMobile && cart.length > 0 && !showMobileCart && (
        <motion.button 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setShowMobileCart(true)}
          className="fixed bottom-24 right-6 z-40 bg-gold text-navy w-16 h-16 rounded-2xl shadow-2xl flex items-center justify-center"
        >
          <div className="relative">
            <ShoppingCart size={24} strokeWidth={3} />
            <span className="absolute -top-3 -right-3 bg-white text-navy text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-gold shadow-lg">
              {cart.length}
            </span>
          </div>
        </motion.button>
      )}

      {/* Mobile Cart Drawer */}
      <AnimatePresence>
        {isMobile && showMobileCart && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileCart(false)}
              className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 h-[85vh] bg-navy-muted rounded-t-[40px] z-[70] border-t border-slate-800 overflow-hidden shadow-2xl"
            >
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-slate-800 rounded-full mb-4" />
              <div className="pt-4 h-full">
                <CartUI />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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
               className="relative w-full max-w-xl bg-navy-muted rounded-[40px] shadow-2xl border border-slate-800 overflow-hidden max-h-[90vh] flex flex-col"
             >
                <div className="p-8 border-b border-slate-800 flex items-center justify-between shrink-0">
                   <h3 className="text-2xl font-black text-white italic tracking-tighter">Transaction</h3>
                   <button onClick={() => setShowCheckout(false)} className="p-2 border border-slate-800 hover:bg-white/5 rounded-full transition-colors text-slate-500">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-8 lg:p-10 overflow-y-auto">
                   <div className="mb-10 text-center relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-gold/5 blur-3xl rounded-full" />
                      <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mb-3 relative z-10">Total Payable</p>
                      <h2 className="text-5xl lg:text-6xl font-black text-white tracking-tighter relative z-10">KES {total.toLocaleString()}</h2>
                   </div>

                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 ml-1 text-center lg:text-left">Select Payment System</p>
                   <div className="grid grid-cols-2 gap-5 mb-10">
                      <button 
                         onClick={() => setPaymentMethod('Cash')}
                         className={`p-6 lg:p-8 border rounded-[32px] flex flex-col items-center gap-4 transition-all group ${paymentMethod === 'Cash' ? 'border-gold bg-gold/5 shadow-[0_0_40px_rgba(234,179,8,0.05)]' : 'border-slate-800 bg-navy/30 hover:border-gold/30'}`}
                      >
                         <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'Cash' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'bg-slate-800/30 text-slate-600'}`}>
                           <Banknote className="w-6 h-6 lg:w-8 lg:h-8" />
                         </div>
                         <span className={`font-bold text-[10px] lg:text-xs uppercase tracking-widest ${paymentMethod === 'Cash' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>Cash Only</span>
                      </button>
                      <button 
                         onClick={() => setPaymentMethod('M-Pesa')}
                         className={`p-6 lg:p-8 border rounded-[32px] flex flex-col items-center gap-4 transition-all group ${paymentMethod === 'M-Pesa' ? 'border-gold bg-gold/5 shadow-[0_0_40px_rgba(234,179,8,0.05)]' : 'border-slate-800 bg-navy/30 hover:border-gold/30'}`}
                      >
                         <div className={`w-12 h-12 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center transition-all ${paymentMethod === 'M-Pesa' ? 'bg-gold text-navy shadow-lg shadow-gold/20' : 'bg-slate-800/30 text-slate-600'}`}>
                           <Smartphone className="w-6 h-6 lg:w-8 lg:h-8" strokeWidth={2.5} />
                         </div>
                         <span className={`font-bold text-[10px] lg:text-xs uppercase tracking-widest ${paymentMethod === 'M-Pesa' ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>M-Pesa Express</span>
                      </button>
                   </div>

                   {paymentMethod === 'M-Pesa' && (
                     <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">Confirmation Details (Reference)</label>
                        <input 
                          type="text" 
                          value={mpesaRef}
                          onChange={(e) => setMpesaRef(e.target.value)}
                          placeholder="e.g. QXRT0..." 
                          className="w-full h-16 px-6 bg-navy border border-slate-800 focus:border-gold/50 rounded-2xl font-mono uppercase focus:ring-4 focus:ring-gold/5 outline-none text-white text-xl tracking-widest transition-all"
                        />
                     </div>
                   )}
                </div>

                <div className="p-8 lg:p-10 bg-slate-900/40 border-t border-slate-800 flex flex-col lg:flex-row gap-4 shrink-0">
                   <button className="flex-1 h-14 lg:h-16 bg-navy-muted border border-slate-800 rounded-2xl font-bold text-slate-400 hover:text-white hover:border-slate-700 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest">
                      <Printer size={20} className="text-gold" /> Print Bill
                   </button>
                   <button 
                     onClick={handleCompleteSale}
                     disabled={isProcessing || (paymentMethod === 'M-Pesa' && !mpesaRef)}
                     className="flex-[2] h-14 lg:h-16 bg-gold text-navy rounded-2xl font-black text-sm tracking-widest hover:bg-gold-light transition-all shadow-xl shadow-gold/10 uppercase flex items-center justify-center gap-3 disabled:opacity-30"
                   >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <>Authorize Sale <CheckCircle2 size={18} /></>}
                   </button>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
