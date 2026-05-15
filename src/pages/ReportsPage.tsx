import React, { useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Sale, Expense } from '../types';
import { BarChart3, TrendingUp, TrendingDown, Download } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';

export default function ReportsPage() {
  const { profile } = useAuth();
  const [data, setData] = useState({ sales: [] as Sale[], expenses: [] as Expense[] });
  const revenueChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      let sQ, eQ;
      if (profile.role === 'business_owner') {
        sQ = query(collection(db, 'sales'), where('businessId', '==', profile.businessId));
        eQ = query(collection(db, 'expenses'), where('businessId', '==', profile.businessId));
      } else {
        sQ = query(collection(db, 'sales'), where('branchId', '==', profile.branchId));
        eQ = query(collection(db, 'expenses'), where('branchId', '==', profile.branchId));
      }

      const [sSnap, eSnap] = await Promise.all([getDocs(sQ), getDocs(eQ)]);
      const sales = sSnap.docs.map(d => d.data() as Sale);
      const expenses = eSnap.docs.map(d => d.data() as Expense);
      
      setData({ sales, expenses });
      if (revenueChartRef.current) drawComparisonChart(revenueChartRef.current, sales, expenses);
    };

    fetchData();
  }, [profile]);

  const drawComparisonChart = (canvas: HTMLCanvasElement, sales: Sale[], expenses: Expense[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const months = 6;
    const revenueData = new Array(months).fill(0);
    const expenseData = new Array(months).fill(0);
    const labels = new Array(months).fill('');

    for (let i = 0; i < months; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (months - 1 - i));
      labels[i] = d.toLocaleDateString('en-US', { month: 'short' });
      
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      revenueData[i] = sales
        .filter(s => s.createdAt.toDate() >= monthStart && s.createdAt.toDate() <= monthEnd)
        .reduce((acc, s) => acc + s.total, 0);
        
      expenseData[i] = expenses
        .filter(e => e.date.toDate() >= monthStart && e.date.toDate() <= monthEnd)
        .reduce((acc, e) => acc + e.amount, 0);
    }

    const max = Math.max(...revenueData, ...expenseData, 5000);
    const padding = 50;
    const chartHeight = height - padding * 2;
    const spacing = (width - padding * 2) / months;

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
      ctx.fillText(label, padding + i * spacing + spacing/2, height - padding + 25);
    });

    // Draw Revenue (Line)
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
    ctx.beginPath();
    revenueData.forEach((val, i) => {
      const x = padding + i * spacing + spacing/2;
      const y = height - padding - (val / max) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      
      // Point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
    });
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Expenses (Line)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    expenseData.forEach((val, i) => {
      const x = padding + i * spacing + spacing/2;
      const y = height - padding - (val / max) * chartHeight;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);
  };

  const totalRev = data.sales.reduce((acc, s) => acc + s.total, 0);
  const totalExp = data.expenses.reduce((acc, e) => acc + e.amount, 0);

  return (
    <div className="space-y-8 relative z-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Financial Reports</h1>
          <p className="text-slate-400 font-medium mt-1">Comprehensive analysis of revenue, expenses and profitability.</p>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-4 rounded-[20px] font-bold transition shadow-lg shadow-blue-600/20 active:scale-[0.98]">
          <Download className="w-5 h-5" /> Export Data
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-600/20 text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Total Revenue</span>
          </div>
          <h4 className="text-3xl font-black text-white tracking-tight">{formatCurrency(totalRev)}</h4>
        </div>
        
        <div className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-red-500/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-600/20 text-red-400 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingDown className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Total Expenses</span>
          </div>
          <h4 className="text-3xl font-black text-white tracking-tight">{formatCurrency(totalExp)}</h4>
        </div>

        <div className="glass-card p-8 rounded-[32px] border border-white/10 relative overflow-hidden group">
          <div className="absolute -right-8 -top-8 w-24 h-24 bg-blue-400/10 blur-3xl rounded-full" />
          <div className="flex items-center gap-4 mb-6">
            <div className={cn("p-3 rounded-2xl group-hover:scale-110 transition-transform", totalRev - totalExp >= 0 ? "bg-emerald-600/20 text-emerald-400" : "bg-red-600/20 text-red-400")}>
              <BarChart3 className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Net Profit</span>
          </div>
          <h4 className="text-3xl font-black text-white tracking-tight">{formatCurrency(totalRev - totalExp)}</h4>
        </div>
      </div>

      <div className="glass-card p-10 rounded-[40px] shadow-sm border border-white/10 relative overflow-hidden">
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex items-center justify-between mb-10 relative z-10">
          <h3 className="text-xl font-bold font-serif text-white tracking-tight">Revenue vs Expenses (Last 6 Months)</h3>
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-4 h-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-1 bg-red-500 rounded-full border border-dashed border-red-500"></div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expenses</span>
            </div>
          </div>
        </div>
        <canvas ref={revenueChartRef} width={1200} height={400} className="w-full h-[400px] relative z-10" />
      </div>
    </div>
  );
}
