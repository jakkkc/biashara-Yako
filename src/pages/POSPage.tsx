import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Printer, 
  X, 
  Check, 
  Percent, 
  Sparkles,
  User,
  Phone,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { formatCurrency, formatDateString } from '../utils/formatters';
import { SYSTEM_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

interface CartItem {
  id: string; // product ID
  name: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number; // cart quantity
  stockQty: number; // max available
  unit: string;
}

export const POSPage: React.FC = () => {
  const { user, business, currentBranch } = useAuth();
  const { checkoutSale } = useFirestore();

  // Element Refs for shortcuts focusing
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Synced catalog state
  const [products, setProducts] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Interactive Cart states
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRate] = useState(16); // 16% VAT standard
  const [discountPercent, setDiscountPercent] = useState(0);

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'credit'>('cash');

  // Mobile viewport toggler
  const [mobileCartOpen, setMobileCartOpen] = useState(false);

  // Receipt printable state
  const [printedSale, setPrintedSale] = useState<any | null>(null);

  const currencySymbol = business?.currency?.symbol || 'KES';

  // Keyboard Shortcuts Bindings - CRITICAL IMPROVEMENT 5
  useEffect(() => {
    const handleShortcuts = (e: KeyboardEvent) => {
      // Focus Search: "/"
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }

      // Close receipt view modal: "Escape"
      if (e.key === 'Escape' && printedSale) {
        setPrintedSale(null);
      }
    };

    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [printedSale]);

  // Sync products in real-time
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) return;

    const q = query(
      collection(db, 'products'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const items: any[] = [];
      snap.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setProducts(items);
    }, (err) => {
      console.error('Error loading products for POS Page:', err);
    });

    return () => unsubscribe();
  }, [user, currentBranch]);

  // Catalog selectors
  const filteredProducts = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchText.toLowerCase()) || p.sku.toLowerCase().includes(searchText.toLowerCase());
    const matchCat = selectedCategory === 'All' || p.category.includes(selectedCategory);
    return matchSearch && matchCat;
  });

  // Add Item to Cart
  const handleAddToCart = (prod: any) => {
    if (prod.quantity <= 0) {
      toast.error('Bidhaa imeisha stoki! Product is out of stock.');
      return;
    }

    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === prod.id);
      if (existing) {
        if (existing.quantity >= prod.quantity) {
          toast.error(`Inapatikana stoki ya ${prod.quantity} ${prod.unit} tu kwa ghala.`);
          return prevCart;
        }
        return prevCart.map((item) =>
          item.id === prod.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        return [
          ...prevCart,
          {
            id: prod.id,
            name: prod.name,
            sku: prod.sku,
            category: prod.category,
            buyingPrice: prod.buyingPrice,
            sellingPrice: prod.sellingPrice,
            quantity: 1,
            stockQty: prod.quantity,
            unit: prod.unit || 'Pcs'
          }
        ];
      }
    });

    toast.success(`${prod.name} imeongezwa!`);
  };

  // Modify cart item counts
  const handleUpdateQty = (itemId: string, increment: number) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === itemId) {
            const nextQty = item.quantity + increment;
            if (nextQty > item.stockQty) {
              toast.error(`Haiwezi kuzidi stoki inayopatikana ya ${item.stockQty}.`);
              return item;
            }
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== itemId));
    toast.success('Bidhaa imeondolewa!');
  };

  // Pricing math calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  const discountAmount = (cartSubtotal * discountPercent) / 100;
  const taxableAmount = cartSubtotal - discountAmount;
  const taxAmount = (taxableAmount * taxRate) / 100;
  const cartTotal = taxableAmount + taxAmount;

  // Process checkout write batch
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Pakia bidhaa kwenye toroli ili ulipe.');
      return;
    }

    try {
      const checkoutSnapshot = {
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.name,
          category: item.category,
          unitPrice: item.sellingPrice,
          quantity: item.quantity,
          total: item.sellingPrice * item.quantity
        })),
        subtotal: cartSubtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: cartTotal,
        paymentMethod,
        customerName,
        customerPhone,
        notes: checkoutNotes
      };

      const resultSale = await checkoutSale(checkoutSnapshot);
      if (resultSale) {
        // Clear card states
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCheckoutNotes('');
        setMobileCartOpen(false);

        // Load printable receipt
        setPrintedSale(resultSale);
      }
    } catch (err) {
      console.error('Checkout failure:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Search Header Tool with helper instructions */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Maudhui ya POS (Uuzaji)
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Press <kbd className="bg-slate-900 text-indigo-400 font-bold px-1 rounded">/</kbd> to search catalog • Press <kbd className="bg-slate-900 text-indigo-400 font-bold px-1 rounded">Enter</kbd> to pay
          </span>
        </div>

        {/* Filters and search triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1 md:max-w-xl">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products by Name or SKU / Tafuta..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input pl-10 pr-4 py-3 text-sm text-white w-full border"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input py-3 px-4 text-xs font-semibold uppercase bg-slate-900 border text-slate-300 w-full sm:w-48"
          >
            <option value="All">All Categories</option>
            {SYSTEM_CATEGORIES.map((cat, idx) => (
              <option key={idx} value={cat.split(' / ')[0]}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Split viewport - Desktop features catalog / mobile handles float FAB drawers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Products catalog catalog (col: 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const inStock = p.quantity > 0;
              const cartQty = cart.find(item => item.id === p.id)?.quantity || 0;
              return (
                <motion.div
                  whileTap={{ scale: 0.98 }}
                  key={p.id}
                  onClick={() => inStock && handleAddToCart(p)}
                  className={`relative p-3.5 rounded-2xl border bg-slate-950/40 select-none cursor-pointer group transition ${
                    inStock 
                      ? 'border-slate-900 hover:border-indigo-500/20 hover:bg-slate-900/10' 
                      : 'border-slate-950 opacity-40 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[9px] font-mono tracking-wider font-semibold uppercase text-indigo-400 px-1.5 py-0.5 rounded bg-indigo-500/5 border border-indigo-500/10">
                      {p.category.split(' / ')[0]}
                    </span>
                    <span className={`text-[10px] font-bold font-mono ${p.quantity <= p.lowStockAlert ? 'text-amber-500' : 'text-slate-500'}`}>
                      {inStock ? `${p.quantity} left` : 'Out of stock'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-200 mt-2 truncate line-clamp-1 group-hover:text-white">
                    {p.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 mt-0.5 font-semibold">SKU: {p.sku}</p>

                  <div className="flex items-center justify-between mt-4">
                    <span className="font-mono text-xs font-bold text-slate-100">
                      {formatCurrency(p.sellingPrice, currencySymbol)}
                    </span>
                    {inStock ? (
                      <div className="p-1 px-2 text-[10px] bg-indigo-600 rounded-lg text-white font-bold flex items-center justify-center gap-1">
                        <Plus className="h-3 w-3" /> Add {cartQty > 0 && <span className="bg-white text-indigo-600 rounded-full h-3.5 w-3.5 flex items-center justify-center text-[9px] font-extrabold">{cartQty}</span>}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-red-400 uppercase">Mwisho</span>
                    )}
                  </div>
                </motion.div>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-16 text-center text-slate-500 italic font-medium">
                Hakuna bidhaa inayolingana na maneno hayo katika duka lako kwa sasa.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Static Cart panel (col: 4) */}
        <div className="hidden lg:block lg:col-span-4 self-start space-y-4">
          <GlassCard className="border-indigo-500/10 p-5 space-y-4 max-h-[85vh] flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-indigo-400" /> Shopping Cart / Kikapu
              </h3>
              <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-indigo-400 font-bold">
                {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </span>
            </div>

            {/* Cart list scroll area */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[30vh] pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center bg-slate-950/50 border border-slate-900 p-2.5 rounded-xl text-xs gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-slate-200 font-semibold truncate leading-tight">{item.name}</h4>
                    <span className="text-[9px] font-mono text-slate-500 font-medium">@ {formatCurrency(item.sellingPrice, currencySymbol)}</span>
                  </div>
                  
                  {/* Qty selectors */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQty(item.id, -1)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 cursor-pointer"
                    >
                      <Minus className="h-2.5 w-2.5" />
                    </button>
                    <span className="font-mono font-bold text-xs text-white min-w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQty(item.id, 1)}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 cursor-pointer"
                    >
                      <Plus className="h-2.5 w-2.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemoveFromCart(item.id)}
                    className="p-1.5 rounded-lg bg-red-950/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-500 italic">
                  Kikapu kiko tupu. Bonyeza bidhaa kuiongeza hapa.
                </div>
              )}
            </div>

            {/* Tax & Discount triggers */}
            <div className="border-t border-slate-900 pt-3.5 space-y-2">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 block">DISCOUNT (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="input px-3 py-1.5 text-xs text-white border text-center font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-mono text-slate-500 block">VAT TAX (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={taxRate || ''}
                    onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="input px-3 py-1.5 text-xs text-white border text-center font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Payment methods and customer forms */}
            <form onSubmit={handleCheckoutSubmit} className="border-t border-slate-900 pt-3.5 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <input
                  type="text"
                  placeholder="Customer Name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input px-3 py-1.5 border"
                />
                <input
                  type="text"
                  placeholder="Phone"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="input px-3 py-1.5 border"
                />
              </div>

              {/* Payment Select channels */}
              <div>
                <span className="text-[10px] font-mono text-slate-500 block mb-1">PAYMENT CHANNEL / NJIA LA MALIPO</span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition text-center cursor-pointer ${
                      paymentMethod === 'cash'
                        ? 'bg-slate-900 text-indigo-400 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                    }`}
                  >
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition text-center cursor-pointer ${
                      paymentMethod === 'mpesa'
                        ? 'bg-[#00a651]/10 text-[#00a651] border-[#00a651]/30 shadow-[0_0_10px_rgba(0,166,81,0.1)]'
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                    }`}
                  >
                    M-Pesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition text-center cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'bg-blue-600/10 text-blue-400 border-blue-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-1.5 rounded-lg border text-[10px] font-bold uppercase transition text-center cursor-pointer ${
                      paymentMethod === 'credit'
                        ? 'bg-amber-600/10 text-amber-500 border-amber-500/30'
                        : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-slate-300'
                    }`}
                  >
                    Credit
                  </button>
                </div>
              </div>

              {/* Subtotals summaries */}
              <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-900 space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(cartSubtotal, currencySymbol)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-400 text-xs">
                    <span>Discount:</span>
                    <span>- {formatCurrency(discountAmount, currencySymbol)}</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>VAT ({taxRate}%):</span>
                    <span>{formatCurrency(taxAmount, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold text-sm border-t border-slate-900 pt-1.5">
                  <span>Total Due:</span>
                  <span className="text-indigo-400">{formatCurrency(cartTotal, currencySymbol)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.2)] mt-1"
              >
                Endlelea Malipo / Checkout <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </GlassCard>
        </div>
      </div>

      {/* MOBILE TRIGGER BUTTON FOR CART */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileCartOpen(true)}
          className="p-4 rounded-full bg-indigo-600 text-white shadow-xl border border-indigo-400/20 flex items-center justify-center relative cursor-pointer"
        >
          <ShoppingCart className="h-6 w-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center justify-center animate-bounce">
              {cart.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </motion.button>
      </div>

      {/* MOBILE BOTTOM CART DRAWER SHEET */}
      <AnimatePresence>
        {mobileCartOpen && (
          <div className="lg:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileCartOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Bottom Sheet Cart Container */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-16 left-0 right-0 bg-slate-900 border-t border-indigo-500/20 rounded-t-2xl p-5 max-h-[80vh] overflow-y-auto space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-indigo-400" /> Mobile Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
                </h3>
                <button
                  onClick={() => setMobileCartOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition bg-slate-950 rounded-lg border border-slate-850"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Cart List */}
              <div className="space-y-2 overflow-y-auto max-h-[25vh]">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center bg-slate-950 border border-slate-900 p-2.5 rounded-xl text-xs gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-200 font-semibold truncate leading-tight">{item.name}</h4>
                      <span className="text-[10px] text-slate-500 font-mono">@ {formatCurrency(item.sellingPrice, currencySymbol)}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleUpdateQty(item.id, -1)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 cursor-pointer"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <span className="font-mono font-bold text-xs text-white min-w-5 text-center">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQty(item.id, 1)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 cursor-pointer"
                      >
                        <Plus className="h-2.5 w-2.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1.5 rounded-lg bg-red-950/10 border border-red-500/20 text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="py-12 text-center text-xs text-slate-500 italic">
                    Kikapu kiko tupu. Bonyeza bidhaa kuiongeza hapa.
                  </div>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-800 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 block font-mono">DISCOUNT (%)</label>
                  <input
                    type="number"
                    value={discountPercent || ''}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="input px-3 py-1.5 text-xs text-white border text-center font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-slate-450 block font-mono">VAT (%)</label>
                  <input
                    type="number"
                    value={taxRate || ''}
                    onChange={(e) => setTaxRate(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="input px-3 py-1.5 text-xs text-white border text-center font-mono"
                  />
                </div>
              </div>

              <form onSubmit={handleCheckoutSubmit} className="space-y-3 pt-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="input px-3 py-1.5 border"
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="input px-3 py-1.5 border"
                  />
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block mb-1 font-mono">PAYMENT METHOD</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['cash', 'mpesa', 'card', 'credit'].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method as any)}
                        className={`p-2 rounded-lg border text-[9px] font-bold uppercase transition text-center cursor-pointer ${
                          paymentMethod === method
                            ? method === 'mpesa' 
                              ? 'bg-[#00a651]/15 text-[#00a651] border-[#00a651]/40' 
                              : 'bg-indigo-600/15 text-indigo-400 border-indigo-500/40'
                            : 'bg-slate-950 text-slate-500 border-slate-900'
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sub totals */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-900 space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(cartSubtotal, currencySymbol)}</span>
                  </div>
                  {discountAmount > 0 && <p className="text-red-400 text-right">- {formatCurrency(discountAmount, currencySymbol)}</p>}
                  <div className="flex justify-between text-white font-bold border-t border-slate-900 pt-1">
                    <span>Total Due:</span>
                    <span className="text-indigo-400">{formatCurrency(cartTotal, currencySymbol)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  Sajili Malipo / Complete Checkout <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RISITI PRINTABLE RECEIPT MODAL */}
      <Modal
        isOpen={printedSale !== null}
        onClose={() => setPrintedSale(null)}
        title="Malipo Yamekamilika / Checkout Completed"
      >
        {printedSale && (
          <div className="space-y-6">
            <span className="text-xs text-slate-400 italic font-medium leading-relaxed block text-center">
              Malipo yamekamilika vyema! Gusa chapa risiti ili kutoa karatasi.
            </span>
            
            {/* The printable boundary area matching @media print rules */}
            <div id="receipt-print-area" className="bg-white text-slate-950 p-6 rounded-xl border border-slate-200 text-xs font-mono space-y-4 shadow-sm select-text">
              <div className="text-center space-y-1">
                <h4 className="font-bold text-base uppercase tracking-wide">{business?.name}</h4>
                <p className="text-[10px] text-slate-500">{currentBranch?.name}</p>
                <p className="text-[10px] text-slate-500">{currentBranch?.location} • {currentBranch?.phone}</p>
                <p className="text-[9px] text-slate-400">Tawi: {currentBranch?.id}</p>
              </div>

              <div className="border-t border-b border-dashed border-slate-305 py-2 space-y-0.5 text-[10px] text-slate-600">
                <p className="flex justify-between">
                  <span>RISITI NO:</span>
                  <span className="font-bold text-slate-950">{printedSale.referenceNumber}</span>
                </p>
                <p className="flex justify-between">
                  <span>DATE / SAA:</span>
                  <span>{formatDateString(printedSale.createdAt)}</span>
                </p>
                <p className="flex justify-between">
                  <span>CLERK / MWANDISHA:</span>
                  <span>{printedSale.salespersonName}</span>
                </p>
                <p className="flex justify-between">
                  <span>NJIA YA MALIPO:</span>
                  <span className="uppercase font-bold text-slate-950">{printedSale.paymentMethod}</span>
                </p>
                {(printedSale.customerName || printedSale.customerPhone) && (
                  <p className="flex justify-between border-t border-dashed border-slate-200 mt-1 pt-1">
                    <span>CUSTOMER (MTEJA):</span>
                    <span>{printedSale.customerName || 'N/A'} ({printedSale.customerPhone || 'N/A'})</span>
                  </p>
                )}
              </div>

              {/* Items Table */}
              <div className="space-y-1">
                <p className="font-bold text-[10px] border-b border-dashed border-slate-300 pb-1 flex justify-between uppercase">
                  <span>Item / Bidhaa</span>
                  <span>Qty x Price</span>
                  <span className="text-right">Total</span>
                </p>
                <div className="space-y-1 pb-2 border-b border-dashed border-slate-300">
                  {printedSale.items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between text-[10px] text-slate-955 gap-1">
                      <span className="font-bold truncate max-w-[45%]">{item.productName}</span>
                      <span>{item.quantity} x {item.unitPrice.toFixed(2)}</span>
                      <span className="text-right font-bold">{item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing breakdown */}
              <div className="space-y-1 text-right text-[10px] text-slate-650">
                <p className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{printedSale.subtotal.toFixed(2)}</span>
                </p>
                {printedSale.discount > 0 && (
                  <p className="flex justify-between text-red-500 font-bold">
                    <span>Punguzo (Discount):</span>
                    <span>- {printedSale.discount.toFixed(2)}</span>
                  </p>
                )}
                {printedSale.tax > 0 && (
                  <p className="flex justify-between">
                    <span>VAT (Kodi):</span>
                    <span>{printedSale.tax.toFixed(2)}</span>
                  </p>
                )}
                <p className="flex justify-between font-extrabold text-slate-950 text-sm border-t border-dashed border-slate-300 pt-1.5 mt-1">
                  <span>TOTAL DUE / JUMLA:</span>
                  <span>{currencySymbol} {printedSale.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>
              </div>

              <div className="text-center pt-3 border-t border-dashed border-slate-205 text-[9px] text-slate-500 font-sans tracking-wide leading-normal">
                <p>ASANTE KWA KUFANYA BIASHARA NASI!</p>
                <p>Welcome back! Karibu tena.</p>
                <p className="font-mono text-[7px] text-slate-400 mt-2">Powered by Biashara Yako POS</p>
              </div>
            </div>

            {/* Print and Close controls */}
            <div className="flex gap-2.5">
              <button
                onClick={() => setPrintedSale(null)}
                className="btn-ghost flex-1 py-3 text-xs"
              >
                Close Receipt / Funga
              </button>
              <button
                onClick={handlePrint}
                className="btn-primary flex-1 py-3 text-xs flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.25)]"
              >
                <Printer className="h-4 w-4" /> Chapa Risiti / Print
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Styled Printable Stylesheet wrapper inside DOM */}
      <style>{`
        @media print {
          /* Hide anything else */
          body * {
            visibility: hidden !important;
          }
          /* Specify print boundary */
          #receipt-print-area, #receipt-print-area * {
            visibility: visible !important;
          }
          #receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
        }
      `}</style>

    </div>
  );
};
export default POSPage;
