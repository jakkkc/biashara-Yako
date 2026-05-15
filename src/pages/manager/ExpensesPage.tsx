import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types';
import { Plus, TrendingDown, Calendar, FileText, Search } from 'lucide-react';
import { cn, formatCurrency, formatDate } from '../../lib/utils';

export default function ExpensesPage() {
  const { profile } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [newExpense, setNewExpense] = useState({
    category: 'supplies' as Expense['category'],
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (!profile?.branchId) return;

    const q = query(
      collection(db, 'expenses'),
      where('branchId', '==', profile.branchId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setExpenses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    });

    return () => unsubscribe();
  }, [profile]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      await addDoc(collection(db, 'expenses'), {
        ...newExpense,
        date: serverTimestamp(),
        businessId: profile.businessId,
        branchId: profile.branchId,
        status: 'approved',
        createdAt: serverTimestamp(),
        createdBy: profile.uid
      });
      setShowAddModal(false);
      setNewExpense({ category: 'supplies', description: '', amount: 0, date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'expenses');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Expenses</h1>
          <p className="text-slate-400 font-medium mt-1">Track operating costs for your branch.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-4 rounded-[20px] font-bold transition shadow-lg shadow-red-600/20 active:scale-[0.98]"
        >
          <Plus className="w-5 h-5" /> Record Expense
        </button>
      </div>

      <div className="glass rounded-[32px] shadow-sm border border-white/10 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Category</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em]">Description</th>
                <th className="px-8 py-5 text-[10px] font-bold text-blue-400 uppercase tracking-[0.2em] text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.map(expense => (
                <tr key={expense.id} className="hover:bg-white/5 transition group">
                  <td className="px-8 py-5 text-sm text-slate-400 font-medium">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-400/50" />
                      {formatDate(expense.date)}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1.5 rounded-xl bg-red-600/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-sm text-slate-300 font-medium group-hover:text-white transition-colors">
                    {expense.description}
                  </td>
                  <td className="px-8 py-5 text-sm font-black text-red-400 text-right">
                    {formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center z-[100] p-4">
          <div className="glass rounded-[40px] p-10 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
            
            <h2 className="text-2xl font-bold font-serif mb-8 flex items-center gap-3 text-white tracking-tight relative z-10">
              <div className="p-2.5 bg-red-600/20 rounded-xl text-red-500">
                <TrendingDown className="w-6 h-6" />
              </div>
              Record Expense
            </h2>
            <form onSubmit={handleAddExpense} className="space-y-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Category</label>
                <select value={newExpense.category} onChange={e => setNewExpense({...newExpense, category: e.target.value as any})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-red-500/50 outline-none transition appearance-none cursor-pointer">
                  <option value="rent" className="bg-slate-900">Rent</option>
                  <option value="utilities" className="bg-slate-900">Utilities</option>
                  <option value="salaries" className="bg-slate-900">Salaries</option>
                  <option value="supplies" className="bg-slate-900">Supplies</option>
                  <option value="other" className="bg-slate-900">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Description</label>
                <input required value={newExpense.description} onChange={e => setNewExpense({...newExpense, description: e.target.value})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-red-500/50 outline-none transition" placeholder="e.g. Monthly Electricity Bill" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 ml-1">Amount</label>
                <input required type="number" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: Number(e.target.value)})} className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-[20px] text-white focus:ring-2 focus:ring-red-500/50 outline-none transition" />
              </div>
              <div className="flex gap-4 pt-6">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-5 px-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[20px] font-bold transition active:scale-[0.98]">Cancel</button>
                <button type="submit" disabled={loading} className="flex-[2] py-5 px-4 bg-red-600 hover:bg-red-500 text-white rounded-[20px] font-bold transition disabled:opacity-50 shadow-lg shadow-red-600/20 active:scale-[0.98]">{loading ? "Saving..." : "Save Expense"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
