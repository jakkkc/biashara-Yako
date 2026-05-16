import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAI } from '../hooks/useAI';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { motion } from 'motion/react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Sparkles, 
  AlertCircle, 
  DollarSign,
  Briefcase,
  Layers,
  FileText,
  Clock
} from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';
import { KPICard } from '../components/ui/KPICard';
import { formatCurrency, formatDateString } from '../utils/formatters';
import { AIInsightModal } from '../components/ui/AIInsightModal';
import toast from 'react-hot-toast';

export const ReportsPage: React.FC = () => {
  const { user, business, currentBranch } = useAuth();
  const { getPLNarration } = useAI();

  // Loading
  const [loading, setLoading] = useState(true);

  // States
  const [sales, setSales] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);

  // Filter
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days'>('30days');

  // AI Summary states
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiModalOpen, setAiModalOpen] = useState(false);

  const currencySymbol = business?.currency?.symbol || 'KES';

  // Listen
  useEffect(() => {
    if (!user || !user.businessId || !currentBranch) return;

    setLoading(true);

    const qSales = query(
      collection(db, 'sales'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const qExpenses = query(
      collection(db, 'expenses'),
      where('businessId', '==', user.businessId),
      where('branchId', '==', currentBranch.id)
    );

    const unsubSales = onSnapshot(qSales, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setSales(list);
    });

    const unsubExpenses = onSnapshot(qExpenses, (snap) => {
      const list: any[] = [];
      snap.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      setExpenses(list);
      setLoading(false);
    });

    return () => {
      unsubSales();
      unsubExpenses();
    };
  }, [user, currentBranch]);

  // Pricing analysis
  const filterByDateRange = (list: any[], dateField: string = 'createdAt') => {
    const limits = {
      today: 1,
      '7days': 7,
      '30days': 30
    }[dateFilter];

    const cutOff = new Date();
    cutOff.setDate(cutOff.getDate() - limits);

    return list.filter((item) => {
      const itemDateStr = item[dateField];
      if (!itemDateStr) return false;
      const d = new Date(itemDateStr);
      return d >= cutOff;
    });
  };

  const filteredSales = filterByDateRange(sales.filter(s => s.status === 'completed'), 'createdAt');
  const filteredExpenses = filterByDateRange(expenses.filter(e => e.status === 'approved'), 'date');

  // Math totals
  const totalRevenue = filteredSales.reduce((sum, s) => sum + s.total, 0);

  // Calculate COGS (Cost of goods sold based on product buying price at snapshot item sales records)
  const totalCOGS = filteredSales.reduce((totalCogs, sale) => {
    const saleItemsCogs = sale.items?.reduce((itemSum: number, item: any) => {
      // Find proportional buying price if logged, or estimate draft cogs around 55%
      const buyingPrice = item.buyingPrice || (item.unitPrice * 0.55);
      return itemSum + (buyingPrice * item.quantity);
    }, 0) || 0;
    return totalCogs + saleItemsCogs;
  }, 0);

  const totalOverheadExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalCOGS - totalOverheadExpenses;
  const isLoss = netProfit < 0;

  // AI Chartered evaluation narration - CRITICAL IMPROVEMENT 4
  const triggerAINarration = async () => {
    setAiModalOpen(true);
    setAiLoading(true);
    try {
      const plDataSummary = {
        revenue: totalRevenue,
        cogs: totalCOGS,
        expenses: totalOverheadExpenses,
        netProfit: netProfit,
        currency: currencySymbol
      };
      const res = await getPLNarration(plDataSummary);
      setAiInsight(res);
    } catch {
      setAiModalOpen(false);
    } finally {
      setAiLoading(false);
    }
  };

  // SVG Area Charts calculation details
  // Map last 7 points for trends
  const trendSales = filteredSales.slice(-7).reverse();
  const maxSaleValue = Math.max(...trendSales.map((s) => s.total), 5000);

  // Points string
  const areaPoints = trendSales.map((sale, idx) => {
    const x = 20 + (idx * 60);
    const y = 110 - (sale.total / maxSaleValue * 70);
    return `${x},${y}`;
  });

  const areaPolyString = areaPoints.join(' ');
  const areaFullString = trendSales.length > 0 
    ? `20,110 ${areaPolyString} ${20 + (trendSales.length-1)*60},110`
    : '';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-800 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-32 bg-slate-800/40 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Title block with date range */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Mipororo na Ripoti / Profit & Loss Sheets
          </h2>
          <span className="text-[10px] text-slate-500 font-medium">
            Analyze income lines, COGS margin leakages, and trigger smart automated financial translation.
          </span>
        </div>

        {/* Filters and AI actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* AI Narration button */}
          <button
            onClick={triggerAINarration}
            className="btn-ghost text-xs text-indigo-400 font-bold border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 flex items-center gap-1.5 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-indigo-400 animate-pulse" /> Automated Auditor (P&L Translator)
          </button>

          {/* Date tabs */}
          <div className="flex border border-slate-800 rounded-xl overflow-hidden text-xs bg-slate-950 bg-opacity-40 select-none">
            {([
              { value: 'today', name: 'Leo / Today' },
              { value: '7days', name: 'Siku 7 / 7 Days' },
              { value: '30days', name: 'Siku 30 / 30 Days' }
            ]).map((t) => (
              <button
                key={t.value}
                onClick={() => setDateFilter(t.value as any)}
                className={`py-2 px-3.5 text-center font-bold font-mono text-[10px] transition uppercase ${
                  dateFilter === t.value
                    ? 'bg-slate-900 text-indigo-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Financial sheets totals KPI grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Revenue (Mauzo ya Jumla)"
          value={formatCurrency(totalRevenue, currencySymbol)}
          subtitle="All transactions of complete status."
          icon={TrendingUp}
          iconColor="text-emerald-400"
        />
        <KPICard
          title="COGS (Dhamana ya Nunua)"
          value={formatCurrency(totalCOGS, currencySymbol)}
          subtitle="Estimated purchase cost of sold items."
          icon={Layers}
          iconColor="text-slate-400"
        />
        <KPICard
          title="General Overhead"
          value={formatCurrency(totalOverheadExpenses, currencySymbol)}
          subtitle="Audited operational branch outflows."
          icon={DollarSign}
          iconColor="text-red-400"
        />
        <KPICard
          title="Net Profit (Ladha safi ya Faida)"
          value={formatCurrency(netProfit, currencySymbol)}
          subtitle="Revenues subtracted by costs and overheads."
          icon={isLoss ? TrendingDown : TrendingUp}
          iconColor={isLoss ? 'text-red-400' : 'text-indigo-400'}
          glowColor={isLoss ? 'group-hover:shadow-[0_0_24px_rgba(239,68,68,0.15)]' : 'group-hover:shadow-[0_0_24px_rgba(99,102,241,0.15)]'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: SVG Area chart trend (col: 8) */}
        <div className="lg:col-span-8">
          <GlassCard className="border-indigo-500/10 p-5">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400 animate-bounce" /> Sales Stream Area Indicator
            </h3>

            <div className="flex items-center justify-center p-4">
              {trendSales.length === 0 ? (
                <div className="py-12 text-center text-slate-500 italic flex flex-col items-center gap-2">
                  <AlertCircle className="h-8 w-8 text-slate-700 animate-pulse" />
                  <span>No finished transaction sales logged in this timeframe.</span>
                </div>
              ) : (
                <div className="w-full">
                  <svg viewBox="0 0 400 130" className="w-full h-40 text-indigo-500">
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Horizontal helper grid grids */}
                    <line x1="10" y1="40" x2="390" y2="40" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="10" y1="75" x2="390" y2="75" stroke="#1e293b" strokeWidth="1" strokeDasharray="2,2" />
                    <line x1="10" y1="110" x2="390" y2="110" stroke="#1e293b" strokeWidth="1" />

                    {/* Area fill */}
                    {areaFullString && (
                      <polygon
                        fill="url(#areaGrad)"
                        points={areaFullString}
                      />
                    )}

                    {/* Line stroke */}
                    {areaPolyString && (
                      <polyline
                        fill="none"
                        stroke="#818cf8"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={areaPolyString}
                      />
                    )}

                    {/* Circles on values */}
                    {trendSales.map((sale, idx) => {
                      const x = 20 + (idx * 60);
                      const y = 110 - (sale.total / maxSaleValue * 70);
                      return (
                        <g key={sale.id}>
                          <circle cx={x} cy={y} r="4" fill="#6366f1" />
                          <title>Ref: {sale.referenceNumber} - Total: {sale.total}</title>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              )}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-3">
              <span>Feeds stream based on dates limit filter</span>
              <span>Workspace active branch</span>
            </div>
          </GlassCard>
        </div>

        {/* RIGHT COMPONENT: Balance details table (col: 4) */}
        <div className="lg:col-span-4">
          <GlassCard className="border-indigo-500/10 p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5 border-b border-slate-900 pb-3">
              <FileText className="h-4.5 w-4.5 text-indigo-400" /> Bookkeeper's Mini Audit
            </h3>

            <div className="space-y-3 font-sans text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Total Complete Orders:</span>
                <span className="font-mono text-white font-bold">{filteredSales.length} items</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Average Cart Ticket:</span>
                <span className="font-mono text-white font-bold">
                  {formatCurrency(filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-400">Overhead claim count:</span>
                <span className="font-mono text-white font-bold">{filteredExpenses.length} claims</span>
              </div>
              <div className="flex justify-between items-center py-1.5 pt-2 font-mono">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">Profit Margin Rate:</span>
                <span className={`text-xs font-bold font-mono ${isLoss ? 'text-red-400' : 'text-indigo-400'}`}>
                  {totalRevenue > 0 ? `${Math.round((netProfit / totalRevenue) * 100)}%` : '0%'}
                </span>
              </div>
            </div>
          </GlassCard>
        </div>

      </div>

      {/* Recipient Smart Diagnostics insight modal */}
      <AIInsightModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        insight={aiInsight}
        loading={aiLoading}
        onRefresh={triggerAINarration}
      />

    </div>
  );
};

// Footer Credits Export
export default () => {
  return (
    <>
      <ReportsPage />
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
