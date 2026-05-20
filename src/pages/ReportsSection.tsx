import React, { useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, ArrowDownRight, Award, DollarSign, PieChart as PieIcon, 
  Printer, TrendingDown, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../i18n/context';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase/config';
import { formatCurrency } from '../utils/crypto';
import { Sale, Expense } from '../types';

const COLORS = ['#C5A059', '#1E3A8A', '#065F46', '#D97706', '#7F1D1D', '#5B21B6'];

export default function ReportsSection() {
  const { t } = useI18n();
  const { business } = useAuth();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  const loadData = async () => {
    if (!business?.id) return;
    setLoading(true);
    try {
      const sSnap = await getDocs(collection(db, `businesses/${business.id}/sales`));
      setSales(sSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sale)));

      const eSnap = await getDocs(collection(db, `businesses/${business.id}/expenses`));
      setExpenses(eSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense)));
    } catch(e) {
      console.warn('Reports loading error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [business?.id]);

  // Aggregate stats based on filter
  const filterByDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    
    if (dateRange === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateRange === '7days') {
      const sevenBg = new Date();
      sevenBg.setDate(now.getDate() - 7);
      return d >= sevenBg;
    }
    if (dateRange === '30days') {
      const thirtyBg = new Date();
      thirtyBg.setDate(now.getDate() - 30);
      return d >= thirtyBg;
    }
    return true; // all
  };

  const filteredSales = sales.filter(s => filterByDate(s.createdAt));
  const filteredExpenses = expenses.filter(e => filterByDate(e.createdAt));

  // STAT CALCULATIONS
  const totalSalesVal = filteredSales.reduce((sum, s) => sum + s.total, 0);
  
  // Quick estimation: Cost value of items sold is approx 68% of sales if not stored, otherwise map exact items cost
  // Let's assume a healthy margin calculation: Gross costs are approximately 65% of total sales price value.
  const costOfGoodsSold = totalSalesVal * 0.65;
  const grossProfit = totalSalesVal - costOfGoodsSold;
  const totalExpensesVal = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalExpensesVal;

  // TREND CHART DATA aggregation by Date
  const salesByDate: { [key: string]: { sales: number; expenses: number } } = {};
  
  filteredSales.forEach(s => {
    const key = new Date(s.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!salesByDate[key]) salesByDate[key] = { sales: 0, expenses: 0 };
    salesByDate[key].sales += s.total;
  });

  filteredExpenses.forEach(e => {
    const key = new Date(e.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!salesByDate[key]) salesByDate[key] = { sales: 0, expenses: 0 };
    salesByDate[key].expenses += e.amount;
  });

  const trendData = Object.keys(salesByDate).map(key => ({
    date: key,
    Sales: salesByDate[key].sales,
    Expenses: salesByDate[key].expenses
  })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // PAYMENT SHARE CHART DATA
  const paymentShareMap: { [key: string]: number } = {};
  filteredSales.forEach(s => {
    paymentShareMap[s.paymentMethod] = (paymentShareMap[s.paymentMethod] || 0) + s.total;
  });
  const paymentShareData = Object.keys(paymentShareMap).map(k => ({
    name: k.toUpperCase(),
    value: paymentShareMap[k]
  }));

  // SALES LEADERBOARD BY STAFF
  const staffLeaderboardMap: { [key: string]: number } = {};
  filteredSales.forEach(s => {
    const name = s.createdByName || 'Staff';
    staffLeaderboardMap[name] = (staffLeaderboardMap[name] || 0) + s.total;
  });
  const staffLeaderboardData = Object.keys(staffLeaderboardMap).map(k => ({
    name: k,
    SalesVal: staffLeaderboardMap[k]
  })).sort((a,b) => b.SalesVal - a.SalesVal).slice(0, 5);

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass p-5 rounded-none border border-stone-850">
        {/* Date Selector */}
        <div className="flex bg-[#030303] border border-stone-800 rounded-none p-1 text-[10px] font-mono">
          {[
            { label: 'Leo (Today)', value: 'today' },
            { label: 'Wiki Hii (7 Days)', value: '7days' },
            { label: 'Mwezi Hii (30 Days)', value: '30days' },
            { label: 'Zote (All Time)', value: 'all' }
          ].map((d, idx) => (
            <button
              key={idx}
              onClick={() => setDateRange(d.value as any)}
              className={`px-3 py-1.5 rounded-none font-semibold tracking-wider uppercase text-[9px] transition-all cursor-pointer ${
                dateRange === d.value ? 'bg-[#C5A059] text-black font-bold' : 'text-stone-400 hover:text-white'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        <button 
          onClick={handlePrintReport}
          className="px-4 py-2 bg-[#0F0F10] border border-stone-800 text-stone-300 hover:border-[#C5A059] hover:text-white transition-all text-[9px] uppercase tracking-wider font-semibold font-mono rounded-none flex items-center gap-2 cursor-pointer"
        >
          <Printer className="w-4 h-4 text-[#C5A059]" />
          Print Performance Worksheet
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col justify-center items-center py-20 text-stone-500 font-mono">
          <RefreshCw className="w-6 h-6 animate-spin text-stone-700 mb-2" />
          <span className="text-[10px] uppercase tracking-wider">Assembling ledger records...</span>
        </div>
      ) : (
        <>
          {/* Summary KPI Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none relative overflow-hidden">
              <TrendingUp className="w-8 h-8 text-[#00E676] opacity-5 absolute right-4 top-4" />
              <span className="text-[9px] text-stone-500 uppercase font-mono tracking-widest block">Mauzo (Total Sales)</span>
              <p className="serif text-2xl font-light text-[#C5A059] mt-2 tabular-nums">Ksh {totalSalesVal.toFixed(1)}</p>
              <span className="text-[9px] text-emerald-500 font-mono tracking-wide block mt-1">● Direct revenue flow</span>
            </div>

            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none relative overflow-hidden">
              <TrendingDown className="w-8 h-8 text-red-500 opacity-5 absolute right-4 top-4" />
              <span className="text-[9px] text-stone-500 uppercase font-mono tracking-widest block font-normal">Gharama (Expenses Logged)</span>
              <p className="serif text-2xl font-light text-red-400 mt-2 tabular-nums">Ksh {totalExpensesVal.toFixed(1)}</p>
              <span className="text-[9px] text-stone-400 font-mono tracking-wide block mt-1">Operating branch overheads</span>
            </div>

            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none relative overflow-hidden">
              <DollarSign className="w-8 h-8 text-sky-450 opacity-5 absolute right-4 top-4" />
              <span className="text-[9px] text-stone-500 uppercase font-mono tracking-widest block font-normal">Gross Profit (COGS Estimated)</span>
              <p className="serif text-2xl font-light text-sky-400 mt-2 tabular-nums">Ksh {grossProfit.toFixed(1)}</p>
              <span className="text-[9px] text-sky-500 font-mono tracking-wide block mt-1">35% estimated margins</span>
            </div>

            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none relative overflow-hidden">
              <Award className="w-8 h-8 text-emerald-500 opacity-5 absolute right-4 top-4" />
              <span className="text-[9px] text-stone-500 uppercase font-mono tracking-widest block font-normal">Faida Safi (Net Profit)</span>
              <p className={`serif text-2xl font-light mt-2 tabular-nums ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Ksh {netProfit.toFixed(1)}
              </p>
              <span className="text-[9px] text-stone-500 font-mono tracking-wide block mt-1">True capital growth Index</span>
            </div>
          </div>

          {/* charts bento */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
            
            {/* AREA TREND CHART */}
            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none">
              <h3 className="serif text-xs font-light text-stone-200 mb-6 uppercase tracking-wider">Sales vs Operating Loss Trend</h3>
              <div className="h-64">
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C5A059" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#C5A059" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D97706" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#D97706" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D1D20" />
                      <XAxis dataKey="date" stroke="#787880" fontSize={9} />
                      <YAxis stroke="#787880" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0C0C0D', border: '1px solid #1D1D20', color: '#fff', fontFamily: 'monospace', fontSize: '10px' }} />
                      <Area type="monotone" dataKey="Sales" stroke="#C5A059" fillOpacity={1} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="Expenses" stroke="#D97706" fillOpacity={1} fill="url(#colorExpenses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-stone-500 text-[10px] font-mono uppercase tracking-wider">No trend details logged.</div>
                )}
              </div>
            </div>

            {/* PAYMENT MODE SHARE BAR CHART */}
            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none">
              <h3 className="serif text-xs font-light text-stone-200 mb-6 uppercase tracking-wider">Payment Mode Volumisation Split</h3>
              <div className="h-64">
                {paymentShareData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentShareData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D1D20" />
                      <XAxis dataKey="name" stroke="#787880" fontSize={9} />
                      <YAxis stroke="#787880" fontSize={9} />
                      <Tooltip contentStyle={{ backgroundColor: '#0C0C0D', border: '1px solid #1D1D20', color: '#fff', fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar dataKey="value" fill="#C5A059" radius={[0, 0, 0, 0]}>
                        {paymentShareData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-stone-500 text-[10px] font-mono uppercase tracking-wider">No checkout payment methods split data.</div>
                )}
              </div>
            </div>

            {/* STAFF LEADERBOARD BAR CHART */}
            <div className="bg-[#0F0F10] border border-stone-850 p-5 rounded-none lg:col-span-2">
              <h3 className="serif text-xs font-light text-stone-200 mb-6 uppercase tracking-wider">Staff Sales Performance Leaderboard (Top 5 Checkout Performance)</h3>
              <div className="h-64">
                {staffLeaderboardData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={staffLeaderboardData} onClick={() => {}} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1D1D20" />
                      <XAxis type="number" stroke="#787880" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="#787880" fontSize={9} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: '#0C0C0D', border: '1px solid #1D1D20', color: '#fff', fontFamily: 'monospace', fontSize: '10px' }} />
                      <Bar dataKey="SalesVal" fill="#1E3A8A" radius={[0, 0, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-stone-500 text-[10px] font-mono uppercase tracking-wider">No active staff checkout tracking events logged today.</div>
                )}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}
