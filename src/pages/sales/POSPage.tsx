import React, { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  writeBatch, 
  doc, 
  serverTimestamp, 
  Timestamp,
  increment
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Product, SaleItem, Sale } from '../../types';
import { Plus, Minus, Search, Trash2, Printer, CheckCircle2, ShoppingBag } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

export default function POSPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Sale | null>(null);
  
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(0);

  useEffect(() => {
    if (!profile?.branchId) return;

    const q = query(
      collection(db, 'products'),
      where('branchId', '==', profile.branchId),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(items);
    });

    return () => unsubscribe();
  }, [profile]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.qty >= product.quantity) return prev; // Stock limit reached
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, qty: item.qty + 1, subtotal: (item.qty + 1) * item.unitPrice } 
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        qty: 1,
        unitPrice: product.sellingPrice,
        subtotal: product.sellingPrice
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = Math.max(1, item.qty + delta);
        if (product && newQty > product.quantity) return item;
        return { ...item, qty: newQty, subtotal: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const calculateSubtotal = () => cart.reduce((acc, item) => acc + item.subtotal, 0);
  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    return subtotal - discount + (subtotal * (taxRate / 100));
  };

  const handleCheckout = async (paymentMethod: Sale['paymentMethod']) => {
    if (cart.length === 0 || !profile) return;
    setLoading(true);

    try {
      const total = calculateTotal();
      const saleData = {
        businessId: profile.businessId,
        branchId: profile.branchId,
        salespersonId: profile.uid,
        salespersonName: profile.name,
        items: cart,
        subtotal: calculateSubtotal(),
        discount,
        tax: calculateSubtotal() * (taxRate / 100),
        total,
        paymentMethod,
        status: 'completed',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: profile.uid
      };

      const batch = writeBatch(db);

      // Create Sale
      const saleRef = doc(collection(db, 'sales'));
      batch.set(saleRef, saleData);

      // Update Inventory & Create Stock Movements
      cart.forEach(item => {
        const productRef = doc(db, 'products', item.productId);
        batch.update(productRef, {
          quantity: increment(-item.qty)
        });

        const movementRef = doc(collection(db, 'stock_movements'));
        batch.set(movementRef, {
          businessId: profile.businessId,
          branchId: profile.branchId,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantityChanged: -item.qty,
          createdAt: serverTimestamp(),
          createdBy: profile.uid
        });
      });

      await batch.commit();
      
      const newSale = { id: saleRef.id, ...saleData } as unknown as Sale;
      setShowReceipt(newSale);
      setCart([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'sales');
    } finally {
      setLoading(false);
    }
  };

  if (showReceipt) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] relative z-10">
        <div className="glass p-10 rounded-[40px] shadow-2xl border border-white/10 w-full max-w-md relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-500/20 border border-white/10">
              <CheckCircle2 className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-3xl font-bold font-serif tracking-tight text-white">Sale Completed!</h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">Transaction ID: <span className="text-blue-400">{showReceipt.id}</span></p>
          </div>
          
          <div className="border-t border-b border-white/5 py-6 mb-8 relative z-10">
            {showReceipt.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm mb-2">
                <span className="text-slate-300">{item.productName} <span className="text-slate-500 ml-1">x{item.qty}</span></span>
                <span className="text-white font-medium">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="mt-6 pt-6 border-t border-white/5 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Subtotal</span>
                <span className="text-slate-300">{formatCurrency(showReceipt.subtotal)}</span>
              </div>
              {showReceipt.discount > 0 && (
                <div className="flex justify-between text-sm text-red-400">
                  <span>Discount</span>
                  <span>-{formatCurrency(showReceipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-2xl pt-4 text-white">
                <span>Total</span>
                <span className="text-blue-400">{formatCurrency(showReceipt.total)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <button 
              onClick={() => window.print()}
              className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all font-bold text-slate-300 active:scale-[0.98]"
            >
              <Printer className="w-5 h-5" /> Print
            </button>
            <button 
              onClick={() => setShowReceipt(null)}
              className="py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all font-bold shadow-lg shadow-blue-600/20 active:scale-[0.98]"
            >
              New Sale
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-8 h-[calc(100vh-140px)] relative z-10">
      {/* Product Browser */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-6 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text"
            placeholder="Search products by name or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-14 pr-6 py-5 bg-white/5 border border-white/10 rounded-[24px] text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 backdrop-blur-md shadow-lg transition-all placeholder:text-slate-600"
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.quantity <= 0}
                className={cn(
                  "flex flex-col text-left glass-card p-5 rounded-[24px] border border-white/5 hover:border-blue-500/30 hover:scale-[1.02] transition-all group disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed relative overflow-hidden",
                  product.quantity <= product.lowStockAlert && "border-amber-500/20"
                )}
              >
                <div className="flex-1 relative z-10">
                  <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mb-2 block">{product.sku}</span>
                  <h3 className="font-bold text-slate-100 group-hover:text-blue-400 line-clamp-2 leading-snug transition-colors">{product.name}</h3>
                </div>
                <div className="mt-6 flex items-end justify-between relative z-10">
                  <div className="flex flex-col">
                    <span className="text-lg font-black text-white tracking-tight">{formatCurrency(product.sellingPrice)}</span>
                  </div>
                  <span className={cn(
                    "text-[10px] px-3 py-1.5 rounded-xl font-bold border",
                    product.quantity > product.lowStockAlert 
                      ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                      : "bg-amber-600/10 text-amber-500 border-amber-500/20"
                  )}>
                    {product.quantity} {product.unit}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-[400px] flex flex-col glass rounded-[32px] border border-white/10 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-white/5">
          <h2 className="text-xl font-bold font-serif flex items-center gap-3 text-white tracking-tight">
            <div className="p-2 bg-blue-600/20 rounded-xl text-blue-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            Current Cart
            <span className="ml-auto text-xs bg-white/10 px-3 py-1 rounded-full text-slate-400 font-bold">{cart.length} items</span>
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-600">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <ShoppingBag className="w-10 h-10 opacity-20" />
              </div>
              <p className="font-medium">Your cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.productId} className="flex gap-4 group items-center">
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-200 line-clamp-1 group-hover:text-blue-400 transition-colors">{item.productName}</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">{formatCurrency(item.unitPrice)} per {products.find(p => p.id === item.productId)?.unit || 'unit'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                    <button 
                      onClick={() => updateQty(item.productId, -1)}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-white">{item.qty}</span>
                    <button 
                      onClick={() => updateQty(item.productId, 1)}
                      className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button 
                    onClick={() => removeFromCart(item.productId)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/5 rounded-b-[32px] space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-slate-200">{formatCurrency(calculateSubtotal())}</span>
            </div>
            <div className="flex justify-between text-sm items-center font-medium">
              <span className="text-slate-500">Discount</span>
              <div className="flex items-center gap-1 border-b border-white/10 focus-within:border-blue-500 transition-colors">
                <span className="text-[10px] text-slate-600">KSH</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-16 text-right bg-transparent text-slate-100 focus:outline-none py-1 font-bold"
                />
              </div>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <span className="text-lg font-bold text-white font-serif">Total Amount</span>
              <span className="text-3xl font-black text-blue-400 tracking-tighter">{formatCurrency(calculateTotal())}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => handleCheckout('cash')}
              disabled={loading || cart.length === 0}
              className="py-4 px-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 border border-white/10 active:scale-[0.98]"
            >
              Cash Payment
            </button>
            <button 
              onClick={() => handleCheckout('mpesa')}
              disabled={loading || cart.length === 0}
              className="py-4 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-sm font-bold transition-all disabled:opacity-50 shadow-lg shadow-blue-800/20 active:scale-[0.98]"
            >
              M-Pesa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
