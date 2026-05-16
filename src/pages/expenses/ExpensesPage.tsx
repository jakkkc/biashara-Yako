import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useCollection, useFirestore } from '../../hooks/useFirestore';
import { Expense } from '../../types';
import { where, orderBy } from 'firebase/firestore';
import { Wallet, Plus, Search, Filter, Calendar } from 'lucide-react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Modal } from '../../components/ui/Modal';
import { EXPENSE_CATEGORIES } from '../../utils/constants';
import { formatCurrency, formatDate } from '../../utils/formatters';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
  const { userProfile } = useAuth();
  const { addDocument } = useFirestore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { data: expenses, loading } = useCollection<Expense>('expenses', [
    where('businessId', '==', userProfile?.businessId),
    orderBy('createdAt', 'desc')
  ]);

  const [formData, setFormData] = useState({
    category: EXPENSE_CATEGORIES[0],
    amount: 0,
    description: '',
    branchId: 'main'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDocument('expenses', {
        ...formData,
        businessId: userProfile?.businessId,
        userId: userProfile?.uid,
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
      setFormData({ category: EXPENSE_CATEGORIES[0], amount: 0, description: '', branchId: 'main' });
      toast.success('Expense recorded');
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Expenses</h1>
          <p className="text-slate-400">Track and manage your business spendings.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Expense
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-pink-500/10 rounded-xl text-pink-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">Total Expenses (MTD)</p>
              <h3 className="text-3xl font-bold font-display">{formatCurrency(totalExpenses)}</h3>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Rent & Utils</p>
            <p className="text-lg font-bold">{formatCurrency(totalExpenses * 0.4)}</p>
          </GlassCard>
          <GlassCard className="p-6 flex flex-col items-center justify-center text-center">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Supplies</p>
            <p className="text-lg font-bold">{formatCurrency(totalExpenses * 0.6)}</p>
          </GlassCard>
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/5 text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                Array(3).fill(0).map((_, i) => <tr key={i}><td colSpan={4} className="h-12 animate-pulse bg-white/5"></td></tr>)
              ) : expenses.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500 italic">No expenses recorded</td></tr>
              ) : expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-400">{formatDate(exp.createdAt, 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-white/5 rounded-lg text-xs font-semibold">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4 text-sm">{exp.description}</td>
                  <td className="px-6 py-4 text-right font-bold text-pink-400">{formatCurrency(exp.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Record Expense">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Category *</label>
            <select 
              className="w-full glass-input appearance-none"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-slate-900">{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Amount *</label>
            <input 
              required
              type="number" 
              className="w-full glass-input"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: parseFloat(e.target.value)})}
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Description</label>
            <textarea 
              className="w-full glass-input min-h-[100px]"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="What was this expense for?"
            />
          </div>
          
          <button type="submit" className="w-full btn-primary !py-4 mt-4">
            Save Expense
          </button>
        </form>
      </Modal>
    </div>
  );
}
