import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Sale } from '../../types';
import { ShoppingBag, Search, Eye, XCircle, Calendar, CreditCard } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';

export default function SalesHistoryPage({ mySalesOnly }: { mySalesOnly?: boolean }) {
  const { profile } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (!profile?.branchId && profile?.role !== 'super_admin' && profile?.role !== 'business_owner') return;

    let q;
    if (mySalesOnly) {
      q = query(
        collection(db, 'sales'), 
        where('branchId', '==', profile.branchId),
        where('createdBy', '==', profile.uid)
      );
    } else if (profile.role === 'business_owner' || profile.role === 'super_admin') {
      q = query(collection(db, 'sales'), where('businessId', '==', profile.businessId));
    } else {
      q = query(collection(db, 'sales'), where('branchId', '==', profile.branchId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale));
      setSales(items.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    });

    return () => unsubscribe();
  }, [profile]);

  const handleVoidSale = async (saleId: string) => {
    if (!confirm("Are you sure you want to void this sale? Stock will NOT be automatically returned in this version.")) return;
    
    try {
      await updateDoc(doc(db, 'sales', saleId), {
        status: 'voided',
        updatedAt: serverTimestamp()
      });
      setSelectedSale(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'sales');
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Sales History</h1>
          <p className="text-slate-400 font-medium mt-1">View and manage all transactions recorded in this branch.</p>
        </div>
      </div>

      <div className="glass rounded-[32px] shadow-sm border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Date & Time</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Salesperson</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Method</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Total</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sales.map((sale) => (
                <tr key={sale.id} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2 text-sm text-slate-300">
                      <Calendar className="w-4 h-4 text-blue-400/50" />
                      {formatDate(sale.createdAt)}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-400 font-semibold group-hover:text-blue-400 transition-colors">
                    {sale.salespersonName}
                  </td>
                  <td className="px-8 py-5 text-sm">
                    <div className="flex items-center gap-2 text-slate-400 capitalize bg-white/5 px-2 py-1 rounded-lg border border-white/5 w-fit">
                      <CreditCard className="w-4 h-4 text-blue-400/50" />
                      {sale.paymentMethod}
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-white">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="px-8 py-5">
                    <span className={cn(
                      "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border",
                      sale.status === 'completed' 
                        ? "bg-blue-600/10 text-blue-400 border-blue-500/20" 
                        : "bg-red-600/10 text-red-500 border-red-500/20"
                    )}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => setSelectedSale(sale)}
                      className="text-blue-400 hover:text-blue-300 font-bold text-xs uppercase tracking-widest bg-white/5 px-4 py-2 rounded-xl border border-white/5 hover:border-blue-500/30 transition-all"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSale && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
            
            <button 
              onClick={() => setSelectedSale(null)}
              className="absolute right-8 top-8 text-slate-500 hover:text-white transition-colors relative z-20"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <h2 className="text-2xl font-bold font-serif mb-8 text-center text-white tracking-tight relative z-10">Receipt Details</h2>
            
            <div className="space-y-4 border-t border-b border-white/5 py-8 mb-8 relative z-10">
              {selectedSale.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-slate-400">{item.productName} <span className="text-slate-600 ml-1">x{item.qty}</span></span>
                  <span className="text-white font-bold">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 mb-10 relative z-10">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Subtotal</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div className="flex justify-between font-black text-2xl pt-4 border-t border-white/5 text-white tracking-tight">
                <span>Total</span>
                <span className="text-blue-400">{formatCurrency(selectedSale.total)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 relative z-10">
              <button 
                onClick={() => window.print()}
                className="py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[20px] font-bold text-slate-300 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Printer className="w-5 h-5" /> Print
              </button>
              {selectedSale.status !== 'voided' && (
                <button 
                  onClick={() => handleVoidSale(selectedSale.id)}
                  className="py-4 bg-red-600/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-[20px] font-bold transition-all active:scale-[0.98]"
                >
                  Void Sale
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Printer } from 'lucide-react';
