import React, { useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection, useFirestore } from '../../hooks/useFirestore';
import { Product, SaleItem } from '../../types';
import { where, orderBy, doc, collection } from 'firebase/firestore';
import { db } from '../../firebase';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CheckCircle2,
  Smartphone,
  Banknote,
  CreditCard,
  ClipboardList,
  ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { GlassCard } from '../../components/ui/GlassCard';
import toast from 'react-hot-toast';
import { ReceiptModal } from './ReceiptModal';

export default function POSPage() {
  const { userProfile } = useAuth();
  const { addDocument, runBatch } = useFirestore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSaleId, setLastSaleId] = useState<string | null>(null);

  const { data: products, loading } = useCollection<Product>('products', [
    where('businessId', '==', userProfile?.businessId),
    orderBy('name', 'asc')
  ]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      toast.error('Out of stock!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.subtotal, 0);

  const completeSale = async () => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    try {
      const saleId = await addDocument('sales', {
        businessId: userProfile?.businessId,
        branchId: userProfile?.branchId || 'main',
        userId: userProfile?.uid,
        items: cart,
        total: cartTotal,
        discount: 0,
        tax: cartTotal * 0.16, // Example 16% VAT
        paymentMethod,
        status: 'completed',
        createdAt: new Date().toISOString()
      });

      // Atomic Stock Update
      await runBatch(async (batch) => {
        cart.forEach(item => {
          const productRef = doc(db, 'products', item.productId);
          // Note: Real implementation should use fieldValue.increment
          // but for this example we'll assume the product object has the current stock
          const prod = products.find(p => p.id === item.productId);
          if (prod) {
            batch.update(productRef, {
              stock: prod.stock - item.quantity,
              updatedAt: new Date().toISOString()
            });
            
            // Log Stock Movement
            const movementRef = doc(collection(db, 'stock_movements'));
            batch.set(movementRef, {
              businessId: userProfile?.businessId,
              productId: item.productId,
              type: 'out',
              quantity: item.quantity,
              reason: 'sale',
              userId: userProfile?.uid,
              createdAt: new Date().toISOString()
            });
          }
        });
      });

      setLastSaleId(saleId || null);
      setShowReceipt(true);
      setCart([]);
      toast.success('Sale completed!');
    } catch (error) {
      console.error('Sale error:', error);
      toast.error('Failed to complete sale');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[calc(100vh-140px)]">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="mb-6 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products by name or SKU..." 
              className="w-full glass-input pl-12 h-12"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
          {loading ? (
            Array(12).fill(0).map((_, i) => <div key={i} className="aspect-square bg-white/5 rounded-2xl animate-pulse"></div>)
          ) : filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              disabled={product.stock <= 0}
              className={`text-left glass-card p-4 flex flex-col hover:border-brand/50 transition-all group relative ${product.stock <= 0 ? 'opacity-50 grayscale' : ''}`}
            >
              {product.stock <= 5 && product.stock > 0 && (
                <span className="absolute top-2 right-2 text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  Low Stock
                </span>
              )}
              <div className="w-full aspect-square bg-slate-800 rounded-xl mb-3 flex items-center justify-center text-slate-600">
                {product.image ? <img src={product.image} className="w-full h-full object-cover rounded-xl" /> : <ShoppingBag className="w-10 h-10" />}
              </div>
              <h3 className="font-bold text-sm line-clamp-2 mb-1 group-hover:text-brand transition-colors">{product.name}</h3>
              <p className="text-xs text-slate-400 mb-2 uppercase tracking-tighter">{product.unit}</p>
              <p className="mt-auto font-display font-bold text-lg text-brand">{formatCurrency(product.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-full lg:w-96 flex flex-col h-full sticky top-0">
        <GlassCard className="flex-1 flex flex-col overflow-hidden max-h-full">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              Current Sale
            </h2>
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-bold">{cart.length} items</span>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center">
                  <Plus className="w-8 h-8 opacity-20" />
                </div>
                <p>Cart is empty</p>
              </div>
            ) : cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{item.name}</p>
                  <p className="text-xs text-slate-500">{formatCurrency(item.price)} each</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/5 rounded-lg">
                    <button onClick={() => updateQuantity(item.productId, -1)} className="p-1 hover:text-red-400 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.productId, 1)} className="p-1 hover:text-indigo-400 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-sm font-bold w-20 text-right">{formatCurrency(item.subtotal)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 pt-0 space-y-6">
            <div className="border-t border-dashed border-white/10 pt-6 space-y-2">
              <div className="flex justify-between text-slate-400 text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
              <div className="flex justify-between text-indigo-400 font-bold text-xl">
                <span>Total</span>
                <span>{formatCurrency(cartTotal)}</span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              <PaymentBtn icon={Banknote} id="cash" label="Cash" active={paymentMethod === 'cash'} onClick={setPaymentMethod} />
              <PaymentBtn icon={Smartphone} id="mpesa" label="M-Pesa" active={paymentMethod === 'mpesa'} onClick={setPaymentMethod} />
              <PaymentBtn icon={CreditCard} id="card" label="Card" active={paymentMethod === 'card'} onClick={setPaymentMethod} />
              <PaymentBtn icon={ClipboardList} id="credit" label="Credit" active={paymentMethod === 'credit'} onClick={setPaymentMethod} />
            </div>

            <button 
              onClick={completeSale}
              disabled={cart.length === 0 || isProcessing}
              className="w-full btn-primary !py-4 flex items-center justify-center gap-2 group"
            >
              {isProcessing ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </GlassCard>
      </div>

      {showReceipt && lastSaleId && (
        <ReceiptModal 
          saleId={lastSaleId} 
          onClose={() => setShowReceipt(false)} 
        />
      )}
    </div>
  );
}

function PaymentBtn({ icon: Icon, id, label, active, onClick }: { icon: any, id: string, label: string, active: boolean, onClick: (id: string) => void }) {
  return (
    <button 
      onClick={() => onClick(id)}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all border ${active ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );
}
