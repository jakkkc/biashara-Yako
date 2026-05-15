import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { firestore } from "../../services/firestore";
import { Product, SaleItem } from "../../types";
import { Button, Input, Card, Badge } from "../../components/ui";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Wallet, Smartphone, Banknote, Loader2 } from "lucide-react";
import { formatCurrency, cn } from "../../lib/utils";
import toast from "react-hot-toast";
import { query, where } from "firebase/firestore";

export default function POSPage() {
  const { profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card" | "credit">("mpesa");

  useEffect(() => {
    if (profile?.branchId) {
      loadProducts();
    }
  }, [profile]);

  const loadProducts = async () => {
    const q = [where("branchId", "==", profile?.branchId), where("status", "==", "active")];
    const data = await firestore.getAll<Product>("products", q);
    setProducts(data);
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unitPrice }
            : item
        );
      }
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        total: product.sellingPrice
      }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.productId !== id));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.total, 0);
  const tax = subtotal * 0.16; // 16% VAT
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!profile) return;

    setLoading(true);
    try {
      const saleData = {
        businessId: profile.businessId,
        branchId: profile.branchId,
        salespersonId: profile.uid,
        salespersonName: profile.name,
        items: cart,
        subtotal,
        tax,
        discount: 0,
        total,
        paymentMethod,
        status: 'completed' as const,
      };

      await firestore.createSale(saleData);
      toast.success("Sale completed successfully!");
      setCart([]);
      loadProducts(); // Refresh stock levels
    } catch (error: any) {
      toast.error(error.message || "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-160px)] flex flex-col lg:flex-row gap-8">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <Input 
            placeholder="Search products by name or SKU..." 
            className="pl-10 h-14 text-lg"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 pr-2">
          {filteredProducts.map(product => (
            <Card 
              key={product.id} 
              className="cursor-pointer hover:border-emerald-500 transition-all flex flex-col p-4"
              onClick={() => addToCart(product)}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 line-clamp-2 mb-1">{product.name}</h3>
                <p className="text-xs text-slate-500 mb-2">{product.sku || "No SKU"}</p>
                <div className="flex items-center justify-between mt-auto">
                   <span className="text-emerald-600 font-bold">{formatCurrency(product.sellingPrice)}</span>
                   <Badge variant={product.quantity <= (product.lowStockAlert || 5) ? "warning" : "info"}>
                     {product.quantity} {product.unit || "pcs"}
                   </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Cart & Checkout */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6 h-full">
        <Card className="flex-1 flex flex-col p-6 min-h-0">
          <div className="flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-100 pb-4">
            <ShoppingCart size={20} />
            <h2 className="font-bold uppercase tracking-wider text-sm">Active Cart</h2>
            <span className="ml-auto bg-slate-100 px-2 py-0.5 rounded text-xs font-bold">{cart.length} ITEMS</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2 min-h-0">
            {cart.map(item => (
              <div key={item.productId} className="flex gap-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium text-slate-800 leading-tight mb-1">{item.productName}</p>
                  <p className="text-slate-500 text-xs">{formatCurrency(item.unitPrice)}/ea</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-50 rounded-lg p-1">
                    <button onClick={() => updateQty(item.productId, -1)} className="p-1 hover:bg-white rounded"><Minus size={14} /></button>
                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="p-1 hover:bg-white rounded"><Plus size={14} /></button>
                  </div>
                  <button onClick={() => removeFromCart(item.productId)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p>Your cart is empty</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tax (VAT 16%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold text-slate-900 pt-2 border-t border-dashed border-slate-200 uppercase tracking-tight">
              <span>Total</span>
              <span className="text-emerald-600">{formatCurrency(total)}</span>
            </div>
          </div>
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 block">Payment Method</label>
          <div className="grid grid-cols-2 gap-3 mb-6">
             <button 
              onClick={() => setPaymentMethod("mpesa")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                paymentMethod === "mpesa" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
             >
               <Smartphone size={18} />
               M-Pesa
             </button>
             <button 
              onClick={() => setPaymentMethod("cash")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                paymentMethod === "cash" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
             >
               <Banknote size={18} />
               Cash
             </button>
             <button 
              onClick={() => setPaymentMethod("card")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                paymentMethod === "card" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
             >
               <CreditCard size={18} />
               Card
             </button>
             <button 
              onClick={() => setPaymentMethod("credit")}
              className={cn(
                "flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left",
                paymentMethod === "credit" ? "bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm" : "border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
             >
               <Wallet size={18} />
               Credit
             </button>
          </div>

          <Button 
            className="w-full py-6 text-xl font-bold bg-emerald-600 shadow-xl shadow-emerald-200 ring-4 ring-emerald-50 hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
            disabled={loading || cart.length === 0}
            onClick={handleCheckout}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : "COMPLETE SALE"}
          </Button>
        </Card>
      </div>
    </div>
  );
}
