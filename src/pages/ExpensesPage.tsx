import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useFirestore } from '../hooks/useFirestore';
import { useAI } from '../hooks/useAI';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  Plus, 
  Sparkles, 
  Receipt, 
  Check, 
  X, 
  AlertTriangle, 
  XCircle,
  FileSpreadsheet,
  BrainCircuit,
  PieChart
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { formatCurrency, formatDateString } from '../utils/formatters';
import { EXPENSE_CATEGORIES } from '../utils/constants';
import toast from 'react-hot-toast';

export const ExpensesPage: React.FC = () => {
  const { user, business, currentBranch } = useAuth();
  const { addExpense, updateExpenseStatus } = useFirestore();
  const { suggestExpenseCategory, loading: aiLoading } = useAI();

  // States
  const [expenses, setExpenses] = useState<any[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);

  // Suggested category details
  const [aiAnalysis, setAiAnalysis] = useState<{ category: string; reason: string; confidence: number } | null>(null);

  // Form states
  const [form, setForm] = useState({
    category: 'supplies' as any,
    description: '',
    amount: 0,
    date: new Date().toISOString().substring(0, 10),
    receiptUrl: ''
  });

  const currencySymbol = business?.currency?.symbol || 'KES';

  // Watch real-time expenses
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) return;

    const q = query(
      collection(db, 'expenses'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      // Sort cron
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setExpenses(list);
    }, (err) => console.error(err));

    return () => unsubscribe();
  }, [user, currentBranch]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: name === 'amount' ? Number(value) : value
    });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || form.amount <= 0) {
      toast.error('Tafadhali jaza kiasi na maelezo sahihi.');
      return;
    }

    const res = await addExpense(form);
    if (res) {
      setAddModalOpen(false);
      setForm({
        category: 'supplies',
        description: '',
        amount: 0,
        date: new Date().toISOString().substring(0, 10),
        receiptUrl: ''
      });
      setAiAnalysis(null);
    }
  };

  // AI OCR expense trigger - CRITICAL IMPROVEMENT 10
  const triggerAICategorySuggestion = async () => {
    if (!form.description) {
      toast.error('Write a brief expense description first (e.g., "Paid electricity token for shop").');
      return;
    }

    try {
      const result = await suggestExpenseCategory(form.description);
      // Expected reply string is JSON, parse safely
      const parsed = JSON.parse(result);
      if (parsed.category) {
        setForm((prev) => ({ ...prev, category: parsed.category }));
        setAiAnalysis({
          category: parsed.category,
          reason: parsed.reason,
          confidence: parsed.confidence || 0.9
        });
        toast.success(`Automated agent suggested category: ${parsed.category}!`);
      }
    } catch (err) {
      console.error('Failed to parse AI category suggestion:', err);
      toast.error('Could not auto-validate category. Please adjust manually.');
    }
  };

  const handleApprove = async (expId: string) => {
    await updateExpenseStatus(expId, 'approved');
  };

  const handleReject = async (expId: string) => {
    // We can delete or toggle offline rejects, let's just approve or set draft
    await updateExpenseStatus(expId, 'pending');
  };

  const isStoreController = user?.role === 'business_owner' || user?.role === 'manager';

  return (
    <div className="space-y-6">
      
      {/* Header toolbars */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Matumizi ya Duka / Expenses Logs
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            Track utilities payments, staff rent costs, and claims pending validation.
          </span>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="btn-primary text-xs font-bold flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
        >
          <Plus className="h-4 w-4" /> Record Expense / Matumizi
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: List details (col: 8) */}
        <div className="lg:col-span-8">
          <GlassCard className="border-indigo-500/10 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Receipt className="h-4.5 w-4.5 text-indigo-400" /> Transaction Ledger
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold pb-2">
                    <th className="py-2.5">Date</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Recorded By</th>
                    <th>Status</th>
                    {isStoreController && <th className="text-right">Audit</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/10 text-slate-300">
                      <td className="py-3.5 font-mono">{formatDateString(exp.date)}</td>
                      <td className="font-semibold text-white max-w-[180px] truncate" title={exp.description}>
                        {exp.description}
                      </td>
                      <td className="capitalize text-slate-400 font-semibold">{exp.category}</td>
                      <td className="font-mono font-bold text-slate-100">{formatCurrency(exp.amount, currencySymbol)}</td>
                      <td className="text-slate-400">{exp.createdBy}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          exp.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {exp.status}
                        </span>
                      </td>
                      {isStoreController && (
                        <td className="text-right">
                          {exp.status === 'pending' ? (
                            <div className="inline-flex gap-1.5">
                              <button
                                onClick={() => handleApprove(exp.id)}
                                className="p-1 rounded bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500 hover:text-white transition cursor-pointer"
                                title="Approve claim"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500 italic">Audited✓</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}

                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 italic font-medium">
                        Hujasajili matumizi yoyote katika tawi hili bado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COMPONENT: Summary Cards breakdowns (col: 4) */}
        <div className="lg:col-span-4 space-y-4">
          <GlassCard className="border-indigo-500/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <PieChart className="h-4.5 w-4.5 text-emerald-400" /> Expense Allocation
            </h3>

            <div className="space-y-3">
              {EXPENSE_CATEGORIES.map((cat, idx) => {
                const totalAmount = expenses
                  .filter((e) => e.category === cat.value && e.status === 'approved')
                  .reduce((sum, e) => sum + e.amount, 0);

                const overallSum = expenses
                  .filter((e) => e.status === 'approved')
                  .reduce((sum, e) => sum + e.amount, 0) || 1;

                const share = (totalAmount / overallSum) * 100;

                return (
                  <div key={idx} className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center text-slate-400 font-medium">
                      <span>{cat.label}</span>
                      <span className="font-mono text-white font-bold">{formatCurrency(totalAmount, currencySymbol)}</span>
                    </div>
                    {/* Progress tracking line */}
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${share}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* RECORD EXPENSE MODAL */}
      <Modal
        isOpen={addModalOpen}
        onClose={() => { setAddModalOpen(false); setAiAnalysis(null); }}
        title="Record Expense / Loga Matumizi"
      >
        <form onSubmit={handleAddSubmit} className="space-y-4 text-sm font-sans text-slate-300">
          
          {/* Description input with AI Suggestion Button */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-sm font-medium text-slate-300">
              Description / Maelezo ya matumizi
            </label>
            <div className="relative">
              <input
                id="description"
                name="description"
                placeholder="E.g. Electricity tokens purchase for HQ branch storage"
                value={form.description}
                onChange={handleFormChange}
                className="input pl-4 pr-32 py-2.5 w-full border text-slate-100"
                required
              />
              <button
                type="button"
                disabled={aiLoading}
                onClick={triggerAICategorySuggestion}
                className="absolute right-1.5 top-1.5 p-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] uppercase flex items-center gap-1.5 transition cursor-pointer"
              >
                {aiLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                ) : (
                  <><BrainCircuit className="h-3 w-3 animate-pulse" /> Suggest Category</>
                )}
              </button>
            </div>
          </div>

          {/* Displays AI categorisation confidence bubble */}
          {aiAnalysis && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-indigo-500/10 border border-indigo-500/20 p-3.5 rounded-xl space-y-1 text-xs"
            >
              <span className="text-indigo-400 font-extrabold flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 animate-spin" /> Category suggested! confidence {Math.round(aiAnalysis.confidence * 10) / 10}
              </span>
              <p className="text-slate-300 leading-normal italic">{aiAnalysis.reason}</p>
            </motion.div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="category" className="text-xs font-semibold text-slate-300 block mb-1">
                Category / Panga kundi
              </label>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleFormChange}
                className="input px-4 py-2.5 w-full bg-slate-950 text-slate-100 font-medium text-xs border uppercase"
              >
                {EXPENSE_CATEGORIES.map((cat, idx) => (
                  <option key={idx} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={`Amount / Kiasi cha malipo (${currencySymbol})`}
              name="amount"
              type="number"
              placeholder="E.g. 1500"
              value={form.amount || ''}
              onChange={handleFormChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date logged"
              name="date"
              type="date"
              value={form.date}
              onChange={handleFormChange}
              required
            />
            <Input
              label="Receipt file (Optional URL)"
              name="receiptUrl"
              placeholder="Http://"
              value={form.receiptUrl}
              onChange={handleFormChange}
            />
          </div>

          <button
            type="submit"
            className="btn-primary w-full py-3.5 rounded-xl font-bold mt-2 cursor-pointer shadow-[0_4px_15px_rgba(99,102,241,0.2)]"
          >
            Sajili Matumizi / Record Expense
          </button>
        </form>
      </Modal>

    </div>
  );
};

// Footer Credits Export
export default () => {
  return (
    <>
      <ExpensesPage />
      <footer className="text-center py-6 border-t border-slate-900 mt-6 text-[11px] text-slate-500 font-mono">
        <span>© {new Date().getFullYear()} Biashara Yako POS. Developed by{' '}</span>
        <a 
          href="https://nex-chi-six.vercel.app/" 
          target="_blank" 
          referrerPolicy="no-referrer"
          className="text-indigo-400 hover:text-indigo-300 transition underline font-sans font-semibold"
        >
          Munene Jackson Mwaniki from Nex-Ink
        </a>
      </footer>
    </>
  );
};
