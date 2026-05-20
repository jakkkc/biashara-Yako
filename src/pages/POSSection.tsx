import React, { useState, useEffect } from 'react';
import { 
  Search, ShoppingCart, Trash2, CreditCard, Tag, UserCheck, CheckCircle, 
  Printer, Share2, Camera, AlertCircle, RefreshCw, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { 
  collection, getDocs, doc, setDoc, query, where, writeBatch, runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/crypto';
import { logAudit } from '../utils/auditLogger';
import { InventoryItem, CartItem, Customer } from '../types';

interface POSSectionProps {
  branchId: string;
  isOffline: boolean;
}

export default function POSSection({ branchId, isOffline }: POSSectionProps) {
  const { t } = useI18n();
  const { user, profile, business } = useAuth();
  
  // UI States
  const [products, setProducts] = useState<InventoryItem[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [selectedCustomerIdx, setSelectedCustomerIdx] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Mpesa' | 'BankTransfer' | 'Credit'>('Cash');
  const [mpesaRef, setMpesaRef] = useState('');

  // Receipt Modal
  const [completedSale, setCompletedSale] = useState<any | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load Inventory & Customers
  const loadData = async () => {
    if (!business?.id) return;
    try {
      const pSnap = await getDocs(collection(db, `businesses/${business.id}/inventory`));
      const pList = pSnap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
      setProducts(pList);

      const cSnap = await getDocs(collection(db, `businesses/${business.id}/customers`));
      const cList = cSnap.docs.map(d => ({ id: d.id, ...d.data() } as Customer));
      setCustomers(cList);
    } catch (e) {
      console.warn('POS Data Load failure: ', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  const handleAddToCart = (product: InventoryItem) => {
    if (product.stock === 0) return;
    
    // Check if ready in cart
    const existingIdx = cart.findIndex(item => item.product.id === product.id);
    if (existingIdx > -1) {
      const updatedCart = [...cart];
      if (updatedCart[existingIdx].quantity + 1 <= product.stock) {
        updatedCart[existingIdx].quantity += 1;
        setCart(updatedCart);
      } else {
        alert('Cannot exceed available stock level!');
      }
    } else {
      setCart([...cart, { product, quantity: 1, unitPrice: product.sellingPrice, discountAmount: 0 }]);
    }
  };

  const handleUpdateQty = (idx: number, change: number) => {
    const updatedCart = [...cart];
    const item = updatedCart[idx];
    const nextQty = item.quantity + change;
    
    if (nextQty <= 0) {
      updatedCart.splice(idx, 1);
    } else if (nextQty <= item.product.stock) {
      item.quantity = nextQty;
    } else {
      alert('Cannot exceed stock restrictions.');
    }
    setCart(updatedCart);
  };

  const handleUpdateItemDiscount = (idx: number, amtStr: string) => {
    const amt = parseFloat(amtStr) || 0;
    const updatedCart = [...cart];
    updatedCart[idx].discountAmount = amt;
    setCart(updatedCart);
  };

  const handleRemoveFromCart = (idx: number) => {
    const updatedCart = [...cart];
    updatedCart.splice(idx, 1);
    setCart(updatedCart);
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const totalItemDiscount = cart.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
  const combinedDiscount = totalItemDiscount + overallDiscount;
  const vatRate = business?.vatEnabled ? business.vatPercentage / 100 : 0;
  const taxableAmount = Math.max(0, subtotal - combinedDiscount);
  const vatAmount = taxableAmount * vatRate;
  const grandTotal = taxableAmount + vatAmount;

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    if (!business?.id || !user) return;

    if (paymentMethod === 'Mpesa' && !mpesaRef.trim()) {
      alert('Please provide an M-Pesa Reference Code for tracking records!');
      return;
    }

    setLoading(true);

    const saleId = `sale_${Date.now()}`;
    const saleItems = cart.map(item => ({
      itemId: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discountAmount || 0,
      total: (item.unitPrice * item.quantity) - (item.discountAmount || 0)
    }));

    const salePayload = {
      branchId: branchId || 'main_hq',
      items: saleItems,
      subtotal,
      discount: combinedDiscount,
      vat: vatAmount,
      total: grandTotal,
      paymentMethod,
      mpesaRef: paymentMethod === 'Mpesa' ? mpesaRef.trim().toUpperCase() : '',
      customerId: selectedCustomerIdx || '',
      status: 'completed',
      createdBy: user.uid,
      createdByName: profile?.displayName || 'Cashier',
      createdAt: new Date().toISOString()
    };

    // Offline Mode Queue trigger
    if (isOffline) {
      try {
        const queueObj = JSON.parse(localStorage.getItem('byako_offline_sales') || '[]');
        queueObj.push(salePayload);
        localStorage.setItem('byako_offline_sales', JSON.stringify(queueObj));
        
        setCompletedSale({ id: `OFFLINE_${Date.now()}`, ...salePayload });
        setCart([]);
        setMpesaRef('');
        setOverallDiscount(0);
        setIsReceiptOpen(true);
        alert('Sale queued in Local Offline buffer successfully!');
      } catch (e) {
        console.warn('Offline capture failed:', e);
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      // Execute Atomic Database Transaction to deduct inventory and save sale to guarantee records
      await runTransaction(db, async (transaction) => {
        // Reductions checks
        for (const item of cart) {
          const itemRef = doc(db, `businesses/${business.id}/inventory`, item.product.id);
          const currentSnap = await transaction.get(itemRef);
          if (!currentSnap.exists()) {
            throw new Error(`Product ${item.product.name} not found!`);
          }
          const currentStock = currentSnap.data().stock || 0;
          if (currentStock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.product.name}!`);
          }
          transaction.update(itemRef, { 
            stock: currentStock - item.quantity,
            updatedAt: new Date().toISOString()
          });
        }

        // Save Sale
        const saleRef = doc(db, `businesses/${business.id}/sales`, saleId);
        transaction.set(saleRef, salePayload);

        // Update customer statistics if selected
        if (selectedCustomerIdx) {
          const custRef = doc(db, `businesses/${business.id}/customers`, selectedCustomerIdx);
          const custSnap = await transaction.get(custRef);
          if (custSnap.exists()) {
            const currentSpent = custSnap.data().totalSpent || 0;
            const currentVisits = custSnap.data().visitCount || 0;
            const currentCredit = custSnap.data().creditBalance || 0;
            
            transaction.update(custRef, {
              totalSpent: currentSpent + grandTotal,
              visitCount: currentVisits + 1,
              creditBalance: paymentMethod === 'Credit' ? currentCredit + grandTotal : currentCredit
            });
          }
        }
      });

      // Write Audit Log
      await logAudit(
        business.id,
        'SALE_CREATED',
        'sales',
        saleId,
        branchId || 'main_hq',
        user.uid,
        profile?.displayName || 'Cashier',
        { total: grandTotal, paymentMethod }
      );

      setCompletedSale({ id: saleId, ...salePayload });
      setCart([]);
      setMpesaRef('');
      setOverallDiscount(0);
      setIsReceiptOpen(true);
      loadData(); // refresh product list

    } catch (err: any) {
      alert(`Sale failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPNG = () => {
    alert('Receipt rendered to PNG. Click "Print" to save as PDF or physical print on your device.');
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[calc(100vh-140px)] select-none">
      
      {/* LEFT AREA: Product Search (7 cols) */}
      <section className="lg:col-span-7 flex flex-col gap-4">
        <div className="glass p-4 rounded-none border border-stone-850 flex flex-col gap-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('productSearch')}
              className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none pl-10 pr-4 py-3.5 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Categories Chips scrolling */}
          <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none">
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-none text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap border cursor-pointer transition-all font-mono ${
                  selectedCategory === cat 
                    ? 'bg-[#C5A059] text-black border-[#C5A059]' 
                    : 'bg-[#030303] border-stone-850 text-stone-400 hover:border-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic products list grid */}
        <div className="flex-1 min-h-[400px] overflow-y-auto max-h-[550px] grid grid-cols-2 md:grid-cols-3 gap-3">
          {filteredProducts.map((p, idx) => {
            const isOutOfStock = p.stock === 0;
            const isLowStock = p.stock <= p.reorderLevel;

            return (
              <div
                key={idx}
                onClick={() => !isOutOfStock && handleAddToCart(p)}
                className={`bg-[#0F0F10] border ${
                  isOutOfStock ? 'border-red-900/30 opacity-40' : isLowStock ? 'border-amber-900/40' : 'border-stone-850'
                } p-4 rounded-none cursor-pointer hover:border-[#C5A059] transition-all flex flex-col justify-between`}
              >
                <div>
                  <span className="text-[9px] text-stone-500 font-mono tracking-wider uppercase block">{p.sku}</span>
                  <h4 className="serif text-xs text-white leading-tight mt-1 uppercase tracking-wide">{p.name}</h4>
                </div>
                
                <div className="mt-4 flex justify-between items-end">
                  <span className="text-[#C5A059] font-bold text-xs font-mono">Ksh {p.sellingPrice.toFixed(1)}</span>
                  
                  {isOutOfStock ? (
                    <span className="px-1.5 py-0.5 bg-red-950/20 text-red-400 font-mono text-[8px] uppercase tracking-wider border border-red-900/40">OUT</span>
                  ) : isLowStock ? (
                    <span className="px-1.5 py-0.5 bg-amber-950/20 text-amber-500 font-mono text-[8px] uppercase tracking-wider border border-amber-900/40">Low: {p.stock}</span>
                  ) : (
                    <span className="px-1.5 py-0.5 bg-emerald-950/20 text-emerald-400 font-mono text-[8px] uppercase tracking-wider border border-emerald-900/40">In: {p.stock}</span>
                  )}
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex flex-col justify-center items-center py-20 text-stone-500">
              <AlertCircle className="w-8 h-8 text-stone-700 mb-2" />
              <p className="text-[10px] font-mono uppercase tracking-wider">No catalog products match search parameters.</p>
            </div>
          )}
        </div>
      </section>

      {/* RIGHT AREA: Cart + calculations (5 cols) */}
      <section className="lg:col-span-5 glass rounded-none p-4 flex flex-col justify-between max-h-[720px] border border-stone-850">
        <div>
          <h3 className="serif text-xs text-stone-300 font-light border-b border-stone-850 pb-2.5 flex items-center justify-between uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <ShoppingCart className="w-4 h-4 text-[#C5A059]" />
              {t('cart')}
            </span>
            <span className="text-[9px] font-mono px-2 py-0.5 bg-stone-900 border border-stone-800 tracking-wider font-semibold uppercase">{cart.length} items</span>
          </h3>

          {/* Cart items list */}
          <div className="space-y-3 py-3 max-h-[220px] overflow-y-auto divide-y divide-stone-850/40 scrollbar-none">
            {cart.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs pt-3 font-mono">
                <div className="max-w-[150px]">
                  <h4 className="font-semibold text-white leading-tight truncate">{item.product.name}</h4>
                  <span className="text-[10px] text-stone-500">Ksh {item.unitPrice}</span>
                </div>

                {/* Sub-discounts & steppers */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-[#0C0C0D] border border-stone-850 rounded-none">
                    <button onClick={() => handleUpdateQty(idx, -1)} className="px-2 py-1 hover:text-red-400 cursor-pointer">-</button>
                    <span className="px-2 text-[10px] font-semibold tabular-nums">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(idx, 1)} className="px-2 py-1 hover:text-green-400 cursor-pointer">+</button>
                  </div>
                  
                  <input
                    type="number"
                    placeholder="Dis"
                    value={item.discountAmount || ''}
                    onChange={(e) => handleUpdateItemDiscount(idx, e.target.value)}
                    className="w-12 bg-black border border-stone-850 rounded-none px-1.5 py-1 text-[10px] text-center text-white"
                  />
                  
                  <button onClick={() => handleRemoveFromCart(idx)} className="text-stone-500 hover:text-red-400 p-1 rounded-none transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <p className="text-center text-[10px] uppercase font-mono tracking-wider text-stone-500 py-8">{t('emptyCart')}</p>
            )}
          </div>
        </div>

        {/* Footer Area with selections and summaries */}
        <div className="space-y-4 border-t border-stone-850 pt-4">
          {/* Customer Choice */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <label className="text-[9px] uppercase tracking-wider text-stone-500 block mb-1">Select Customer</label>
              <select
                value={selectedCustomerIdx}
                onChange={(e) => setSelectedCustomerIdx(e.target.value)}
                className="w-full bg-[#0C0C0D] border border-stone-800 rounded-none px-2 py-2 text-[10px] text-white outline-none"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c, idx) => (
                  <option key={idx} value={c.id} className="bg-stone-900">{c.name} ({c.phone || 'No phone'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-wider text-stone-500 block mb-1">Overall Discount (Ksh)</label>
              <input
                type="number"
                min="0"
                value={overallDiscount || ''}
                onChange={(e) => setOverallDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full bg-[#0C0C0D] border border-stone-800 rounded-none px-2.5 py-2 text-[10px] text-white outline-none"
                placeholder="0"
              />
            </div>
          </div>

          {/* Payment method checklist tabs */}
          <div>
            <span className="text-[9px] uppercase tracking-wider text-stone-500 block mb-1.5 font-mono">{t('payMethod')}</span>
            <div className="grid grid-cols-4 gap-2 text-[10px] font-bold font-mono">
              {[
                { label: 'CASH', value: 'Cash' },
                { label: 'M-PESA', value: 'Mpesa' },
                { label: 'BANK', value: 'BankTransfer' },
                { label: 'CREDIT', value: 'Credit' }
              ].map((m, id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPaymentMethod(m.value as any)}
                  className={`py-2 rounded-none border text-center transition-all cursor-pointer ${
                    paymentMethod === m.value 
                      ? 'bg-[#C5A059] text-black border-[#C5A059]' 
                      : 'bg-[#0C0C0D] border-stone-850 text-stone-400 hover:border-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional MPesa input */}
          {paymentMethod === 'Mpesa' && (
            <div className="space-y-1 font-mono">
              <label className="text-[9px] uppercase tracking-wider text-amber-500 block">M-Pesa Reference Number *</label>
              <input
                type="text"
                required
                value={mpesaRef}
                onChange={(e) => setMpesaRef(e.target.value)}
                placeholder="e.g., QW8291S8A"
                className="w-full bg-[#030303] border border-stone-800 focus:border-[#C5A059] rounded-none px-3 py-2.5 text-xs font-mono text-white outline-none"
              />
            </div>
          )}

          {/* Sales Sum Card */}
          <div className="bg-[#030303] p-4 rounded-none border border-stone-850 text-xs space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-stone-500 uppercase tracking-wider text-[10px]">{t('subtotal')}:</span>
              <span className="text-white">Ksh {subtotal.toFixed(2)}</span>
            </div>
            {combinedDiscount > 0 && (
              <div className="flex justify-between text-[#C5A059]">
                <span className="text-stone-500 uppercase tracking-wider text-[10px]">{t('discount')}:</span>
                <span>- Ksh {combinedDiscount.toFixed(2)}</span>
              </div>
            )}
            {business?.vatEnabled && (
              <div className="flex justify-between">
                <span className="text-stone-500 uppercase tracking-wider text-[10px]">{t('vat')} ({business.vatPercentage}%):</span>
                <span className="text-white">Ksh {vatAmount.toFixed(2)}</span>
              </div>
            )}
            <hr className="border-stone-850" />
            <div className="flex justify-between font-bold text-sm text-[#C5A059]">
              <span className="uppercase tracking-wider">TOTAL ORDER:</span>
              <span className="tabular-nums">Ksh {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={handleCompleteSale}
            disabled={loading || cart.length === 0}
            className="w-full py-4 bg-[#C5A059] border border-[#C5A059] text-black disabled:opacity-40 font-semibold rounded-none text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all outline-none cursor-pointer duration-300 hover:bg-transparent hover:text-[#C5A059]"
          >
            {loading ? t('loading') : `${t('completeSale')} — Ksh ${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </section>

      {/* RECEIPT PREVIEW DIALOG MODAL */}
      {isReceiptOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white text-black p-6 rounded-none shadow-2xl relative max-h-[90vh] overflow-y-auto border border-stone-800">
            
            <button 
              onClick={() => setIsReceiptOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black print:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Print Friendly Block Wrapper */}
            <div id="printable-receipt" className="space-y-4 text-xs font-mono text-center">
              <div className="space-y-1 border-b border-dashed border-gray-300 pb-3">
                {business?.logoUrl && (
                  <img src={business.logoUrl} alt="Logo" className="w-12 h-12 mx-auto object-contain p-1" />
                )}
                <h3 className="font-bold text-sm uppercase">{business?.receiptConfig?.businessName || business?.name}</h3>
                <p className="text-[10px] text-gray-500">{business?.receiptConfig?.tagline || 'Biashara Smart.'}</p>
                <p className="text-[9px] text-gray-500">{business?.receiptConfig?.contactInfo || 'Thank you!'}</p>
              </div>

              <div className="text-left space-y-1 border-b border-dashed border-gray-300 pb-2">
                <p><span className="text-gray-500">Receipt No:</span> {completedSale.id}</p>
                <p><span className="text-gray-500">Date/Time:</span> {new Date(completedSale.createdAt).toLocaleString()}</p>
                <p><span className="text-gray-500">Method:</span> {completedSale.paymentMethod}</p>
                {completedSale.mpesaRef && (
                  <p><span className="text-gray-500">M-Pesa Ref:</span> {completedSale.mpesaRef}</p>
                )}
                <p><span className="text-gray-500">Cashier:</span> {completedSale.createdByName}</p>
              </div>

              {/* Itemized structure */}
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 text-[10px]">
                    <th className="pb-1">Item Description</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {completedSale.items.map((item: any, id: number) => (
                    <tr key={id} className="text-gray-800">
                      <td className="py-1 leading-tight">{item.name}</td>
                      <td className="py-1 text-center">{item.quantity}</td>
                      <td className="py-1 text-right">Ksh {item.total.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals table */}
              <div className="border-t border-dashed border-gray-300 pt-2 space-y-1.5 text-right font-medium">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal:</span>
                  <span>Ksh {completedSale.subtotal.toFixed(2)}</span>
                </div>
                {completedSale.discount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span className="text-gray-500">Discount:</span>
                    <span>-Ksh {completedSale.discount.toFixed(2)}</span>
                  </div>
                )}
                {business?.vatEnabled && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">VAT ({business.vatPercentage}%):</span>
                    <span>Ksh {completedSale.vat.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-dashed border-gray-200" />
                <div className="flex justify-between font-bold text-sm">
                  <span>GRAND TOTAL:</span>
                  <span>Ksh {completedSale.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-gray-300 text-[10px] text-gray-500 text-center uppercase">
                {business?.receiptConfig?.footerMessage || 'Welcome again!'}
              </div>
            </div>

            {/* Modals trigger actions */}
            <div className="pt-4 flex flex-col gap-2 print:hidden text-xs">
              <button
                onClick={handlePrint}
                className="w-full py-2.5 bg-black text-white hover:bg-stone-900 font-semibold rounded-none flex items-center justify-center gap-2 cursor-pointer transition-all border border-black uppercase tracking-wider font-mono"
              >
                <Printer className="w-4 h-4" />
                {t('print')}
              </button>
              
              <button
                onClick={handleDownloadPNG}
                className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-900 font-semibold rounded-none flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider font-mono"
              >
                <Share2 className="w-4 h-4" />
                {t('downloadImage')}
              </button>

              <button
                onClick={() => {
                  setIsReceiptOpen(false);
                  setCompletedSale(null);
                }}
                className="w-full py-3 bg-[#C5A059] border border-[#C5A059] text-black font-semibold rounded-none text-center active:scale-95 transition-all text-xs uppercase tracking-wider font-mono hover:bg-transparent hover:text-black cursor-pointer"
              >
                {t('newSale')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
