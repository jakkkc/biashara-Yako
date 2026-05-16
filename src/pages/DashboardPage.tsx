import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAI } from '../hooks/useAI';
import { useFirestore } from '../hooks/useFirestore';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Users, 
  Sparkles, 
  ArrowUpRight, 
  Receipt, 
  Calendar,
  Building,
  ArrowRight,
  RefreshCw,
  Clock,
  CheckCircle,
  Eye,
  Trash2
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { formatCurrency, formatDateString } from '../utils/formatters';
import { AIInsightModal } from '../components/ui/AIInsightModal';
import { Modal } from '../components/ui/Modal';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

export const DashboardPage: React.FC = () => {
  const { user, business, currentBranch } = useAuth();
  const { getBusinessInsights } = useAI();
  const { voidSale } = useFirestore();

  // Loading indicator for telemetry
  const [loading, setLoading] = useState(true);

  // Synced state arrays
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  // AI Modal states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  // Drilldown Sale Detail Modal
  const [selectedSale, setSelectedSale] = useState<any | null>(null);

  // Compute metrics
  const currencySymbol = business?.currency?.symbol || 'KES';

  // 1. Real-time synchronisation hook
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Queries scoped by active tenant IDs
    const qSales = query(
      collection(db, 'sales'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const qProducts = query(
      collection(db, 'products'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const qExpenses = query(
      collection(db, 'expenses'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const qUsers = query(
      collection(db, 'users'),
      where('businessId', '==', user.businessId)
    );

    // Snapshot readers
    const unsubSales = onSnapshot(qSales, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setSales(list);
    });

    const unsubProducts = onSnapshot(qProducts, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setProducts(list);
    });

    const unsubExpenses = onSnapshot(qExpenses, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setExpenses(list);
    });

    const unsubUsers = onSnapshot(qUsers, (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
      setTeamMembers(list);
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubProducts();
      unsubExpenses();
      unsubUsers();
    };
  }, [user, currentBranch]);

  // AI Insights triggering
  const triggerAIInsights = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const res = await getBusinessInsights(sales, expenses, products);
      setAiInsight(res);
    } catch {
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-80 bg-slate-800/20 rounded-2xl animate-pulse" />
          <div className="h-80 bg-slate-800/20 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  // Calculate stats
  const activeSales = sales.filter((s: any) => s.status === 'completed');
  
  // Today's Sales Revenue
  const today = new Date().toISOString().substring(0, 10);
  const todaySalesAmount = activeSales
    .filter((s: any) => s.createdAt.substring(0, 10) === today)
    .reduce((sum, s) => sum + s.total, 0);

  // Low Inventory Count quantity check
  const lowStockCount = products.filter((p: any) => p.quantity <= (p.lowStockAlert || 5)).length;

  // Active Salespeople active
  const clerksCount = teamMembers.filter(t => t.role === 'salesperson' && t.status === 'active').length;

  // Pending Expense Claims amount
  const pendingExpenseAmount = expenses
    .filter(e => e.status === 'pending')
    .reduce((sum, e) => sum + e.amount, 0);

  // --- SVG charting calculations ---

  // 1. Sales Velocity Day-by-Day (Last 7 Days)
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().substring(0, 10);
  });

  const dayTotals = last7Days.map(dayStr => {
    const dailyTotal = activeSales
      .filter(s => s.createdAt.substring(0, 10) === dayStr)
      .reduce((sum, s) => sum + s.total, 0);
    return dailyTotal;
  });

  const maxDailyTotal = Math.max(...dayTotals, 5000); // safety fallback bounds

  // Generating SVG points for line charts (width 400, height 120, margins 20)
  const linePoints = dayTotals.map((tot, idx) => {
    const x = 30 + (idx * 55);
    const y = 100 - (tot / maxDailyTotal * 80);
    return `${x},${y}`;
  }).join(' ');

  // 2. Category Share bar-metrics
  const categorySummary: Record<string, number> = {};
  activeSales.forEach(s => {
    s.items?.forEach((item: any) => {
      const cat = item.category || 'General';
      categorySummary[cat] = (categorySummary[cat] || 0) + item.total;
    });
  });

  const categoryArray = Object.entries(categorySummary)
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 4); // top 4 categories

  const maxCategoryValue = Math.max(...categoryArray.map(c => c.value), 5000);

  return (
    <div className="space-y-6">
      
      {/* Title block with Swahili labels and live AI trigger button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Mwanzo / Store Dashboard
          </h2>
          <p className="text-xs text-slate-400">
            Real-time shop analysis, live stock velocity, and P&L tracking.
          </p>
        </div>

        {/* Floating Smart Diagnostics button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={triggerAIInsights}
          className="btn-primary py-3 px-5 rounded-xl font-bold flex items-center gap-2 relative overflow-hidden group shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_35px_rgba(99,102,241,0.5)] cursor-pointer"
        >
          {/* Neon moving glow line */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/20 to-emerald-500/10 opacity-30 group-hover:opacity-60 transition" />
          <Sparkles className="h-4.5 w-4.5 text-indigo-300 animate-pulse" />
          <span className="text-xs text-white">Smart Diagnostics / Ushauri Kiotomatiki</span>
        </motion.button>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Today's Sales / Mauzo ya Leo"
          value={formatCurrency(todaySalesAmount, currencySymbol)}
          subtitle={`${activeSales.filter(s => s.createdAt.substring(0, 10) === today).length} purchases successfully.`}
          icon={ShoppingBag}
          iconColor="text-emerald-400"
          glowColor="group-hover:shadow-[0_0_24px_rgba(52,211,153,0.15)]"
        />
        <KPICard
          title="Active Stock Warns"
          value={lowStockCount}
          subtitle="Products below security bounds."
          icon={AlertTriangle}
          iconColor={lowStockCount > 0 ? 'text-amber-400' : 'text-slate-400'}
          glowColor="group-hover:shadow-[0_0_24px_rgba(245,158,11,0.12)]"
        />
        <KPICard
          title="Operating Team"
          value={clerksCount}
          subtitle="Sales clerks logged in today."
          icon={Users}
          iconColor="text-indigo-400"
          glowColor="group-hover:shadow-[0_0_24px_rgba(99,102,241,0.12)]"
        />
        <KPICard
          title="Unapproved Exp claims"
          value={formatCurrency(pendingExpenseAmount, currencySymbol)}
          subtitle="Pending manager consent."
          icon={Receipt}
          iconColor={pendingExpenseAmount > 0 ? 'text-red-400' : 'text-slate-400'}
          glowColor="group-hover:shadow-[0_0_24px_rgba(239,68,68,0.12)]"
        />
      </div>

      {/* Custom SVG Charts Section (To satisfy non-external libraries rule) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SVG Line Chart: Sales velocity last 7 days */}
        <GlassCard className="border-indigo-500/10 flex flex-col justify-between p-5 min-h-[260px] relative">
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Sales Velocity (Nguvu ya Mauzo)</h3>
            </div>
            <span className="text-[10px] font-mono bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase">Last 7 Days</span>
          </div>

          <div className="flex-1 flex items-center justify-center">
            {sales.length === 0 ? (
              <p className="text-xs text-slate-500 italic">Hujafanya mauzo bado katika siku hizi 7.</p>
            ) : (
              <svg viewBox="0 0 400 120" className="w-full h-32 text-indigo-400">
                {/* Horizontal reference lines */}
                <line x1="20" y1="20" x2="380" y2="20" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="60" x2="380" y2="60" stroke="#1e293b" strokeWidth="1" strokeDasharray="3,3" />
                <line x1="20" y1="100" x2="380" y2="100" stroke="#1e293b" strokeWidth="1" />

                {/* The SVG curve path */}
                <polyline
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={linePoints}
                />

                {/* Curve glowing points */}
                {dayTotals.map((tot, idx) => {
                  const x = 30 + (idx * 55);
                  const y = 100 - (tot / maxDailyTotal * 80);
                  return (
                    <g key={idx}>
                      <circle cx={x} cy={y} r="5" fill="#6366f1" className="cursor-help" />
                      <circle cx={x} cy={y} r="9" fill="none" stroke="#818cf850" strokeWidth="2" className="animate-ping" />
                    </g>
                  );
                })}

                {/* X labels (Dates) */}
                {last7Days.map((day, idx) => {
                  const x = 30 + (idx * 55);
                  const displayDay = day.substring(8, 10);
                  const month = day.substring(5, 7);
                  return (
                    <text key={idx} x={x} y="115" textAnchor="middle" fill="#64748b" className="text-[9px] font-mono leading-none">
                      {`${displayDay}/${month}`}
                    </text>
                  );
                })}

                {/* Definitions */}
                <defs>
                  <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#4f46e5" />
                    <stop offset="50%" stopColor="#a855f7" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
            )}
          </div>
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono">
            <span>Peak Day: {formatCurrency(maxDailyTotal, currencySymbol)}</span>
            <span>Live data stream</span>
          </div>
        </GlassCard>

        {/* SVG Horizontal Bar Chart: Category Share of sales */}
        <GlassCard className="border-indigo-500/10 flex flex-col justify-between p-5 min-h-[260px]">
          <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Sales by Section (Mhasibu wa Makundi)</h3>
            </div>
            <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded uppercase">Revenue Share</span>
          </div>

          <div className="flex-1 flex flex-col justify-center gap-4">
            {categoryArray.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center">Rekodi mauzo na bidhaa ili kupata uchambuzi huu.</p>
            ) : (
              categoryArray.map((cat, idx) => {
                const percent = (cat.value / maxCategoryValue) * 100;
                return (
                  <div key={idx} className="space-y-1 w-full font-sans text-xs">
                    <div className="flex items-center justify-between text-slate-300 font-medium">
                      <span className="truncate max-w-[70%]">{cat.category}</span>
                      <span className="font-mono text-white font-semibold">{formatCurrency(cat.value, currencySymbol)}</span>
                    </div>
                    {/* Horizontal Bar */}
                    <div className="w-full h-2.5 bg-slate-900/60 rounded-full overflow-hidden border border-slate-800">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5, delay: idx * 0.1 }}
                        className={`h-full rounded-full ${
                          idx === 0 ? 'bg-[#00a651]' : idx === 1 ? 'bg-indigo-500' : idx === 2 ? 'bg-purple-500' : 'bg-amber-500'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="flex justify-between items-center mt-3 text-[10px] text-slate-500 font-mono">
            <span>Top Branch category feeds</span>
            <span>Total groups active</span>
          </div>
        </GlassCard>

      </div>

      {/* Recents Sales list with drilldown details */}
      <GlassCard className="border-indigo-500/10 p-5 mt-4">
        <div className="flex items-center justify-between mb-4 border-b border-slate-900 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-indigo-400 animate-pulse" />
            <h3 className="text-sm font-bold text-white">Recent Transactions / Mauzo ya Karibuni</h3>
          </div>
          <span className="text-xs text-slate-400">Showing last 5 events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs md:text-sm font-sans">
            <thead>
              <tr className="border-b border-slate-900 text-slate-400 font-semibold">
                <th className="py-2.5">Ref ID</th>
                <th>Time / Saa</th>
                <th>Clerk / Mhudumu</th>
                <th>Total / Mauzo</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {sales.slice(0, 5).map((sale) => (
                <tr key={sale.id} className="hover:bg-slate-900/20 text-slate-300">
                  <td className="py-3 font-mono text-white font-bold">{sale.referenceNumber}</td>
                  <td>{formatDateString(sale.createdAt)}</td>
                  <td>{sale.salespersonName}</td>
                  <td className="font-mono font-bold text-slate-200">{formatCurrency(sale.total, currencySymbol)}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      sale.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {sale.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="inline-flex gap-2">
                      <button
                        onClick={() => setSelectedSale(sale)}
                        className="p-1 px-2.2 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500 hover:text-white transition text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-3 w-3" /> View / Chungunguza
                      </button>
                      {sale.status === 'completed' && (
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to void this transaction?')) {
                              voidSale(sale.id);
                            }
                          }}
                          className="p-1 px-2.2 rounded bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500 hover:text-white transition text-xs flex items-center gap-1.5 cursor-pointer"
                          title="Void Sale"
                        >
                          <Trash2 className="h-3 w-3" /> Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 font-medium italic">
                    Huna mauzo yaliyofanyika bado jana au leo.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Recipient Smart Diagnostics insight modal */}
      <AIInsightModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        insight={aiInsight}
        loading={aiLoading}
        onRefresh={triggerAIInsights}
      />

      {/* Sale drill down modal */}
      <Modal
        isOpen={selectedSale !== null}
        onClose={() => setSelectedSale(null)}
        title={`Transaction Details: ${selectedSale?.referenceNumber}`}
      >
        {selectedSale && (
          <div className="space-y-6 text-sm font-sans text-slate-300">
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold">Keshier / Server</span>
                <span className="font-semibold text-white">{selectedSale.salespersonName}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold">Time recorded</span>
                <span className="font-semibold text-white">{formatDateString(selectedSale.createdAt)}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold">Payment Channel</span>
                <span className="font-semibold text-white capitalize">{selectedSale.paymentMethod}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block uppercase font-bold">Total sum paid</span>
                <span className="font-semibold text-emerald-400 font-mono">{formatCurrency(selectedSale.total, currencySymbol)}</span>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <span className="text-xs text-slate-500 uppercase font-bold block">Purchased Products (Bidhaa Zilizonunuliwa)</span>
              <div className="space-y-2 bg-slate-950/60 p-4 rounded-xl border border-slate-900 font-mono text-xs">
                {selectedSale.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-slate-300">
                    <div className="flex flex-col">
                      <span className="text-slate-200 font-bold">{item.productName}</span>
                      <span className="text-[10px] text-slate-500">{item.quantity} x {formatCurrency(item.unitPrice, currencySymbol)}</span>
                    </div>
                    <span>{formatCurrency(item.total, currencySymbol)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Details */}
            {(selectedSale.customerName || selectedSale.customerPhone) && (
              <div className="bg-indigo-950/20 p-4 rounded-xl border border-indigo-500/10 space-y-1 text-xs">
                <span className="text-xs text-indigo-400 font-bold uppercase block">Customer Profile (Mteja)</span>
                <p className="text-white font-medium">{selectedSale.customerName || 'N/A'}</p>
                <p className="text-slate-400">{selectedSale.customerPhone || 'N/A'}</p>
              </div>
            )}
            
            <div className="flex gap-2.5">
              <button
                onClick={() => setSelectedSale(null)}
                className="btn-ghost w-full py-2.5 text-xs font-semibold cursor-pointer"
              >
                Close Modal
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Footer Credits */}
      <footer className="text-center py-6 border-t border-slate-900 text-[11px] text-slate-500 font-mono">
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

    </div>
  );
};
export default DashboardPage;
