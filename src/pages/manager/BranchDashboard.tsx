import React, { useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Sale } from '../../types';
import { ShoppingBag, TrendingUp, Package, AlertTriangle, Users } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export default function BranchDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    todayRevenue: 0,
    monthRevenue: 0,
    lowStockCount: 0,
    salesCount: 0
  });
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!profile?.branchId) return;

    const fetchData = async () => {
      const q = query(collection(db, 'sales'), where('branchId', '==', profile.branchId));
      const snap = await getDocs(q);
      const sales = snap.docs.map(d => d.data() as Sale);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const todaySales = sales.filter(s => s.createdAt.toDate() >= today);
      
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0,0,0,0);
      const monthSales = sales.filter(s => s.createdAt.toDate() >= monthStart);

      const pQ = query(collection(db, 'products'), where('branchId', '==', profile.branchId));
      const pSnap = await getDocs(pQ);
      const lowStockCount = pSnap.docs.filter(d => d.data().quantity <= d.data().lowStockAlert).length;

      setStats({
        todayRevenue: todaySales.reduce((acc, s) => acc + s.total, 0),
        monthRevenue: monthSales.reduce((acc, s) => acc + s.total, 0),
        lowStockCount,
        salesCount: todaySales.length
      });

      if (chartRef.current) drawChart(chartRef.current, sales);
    };

    fetchData();
  }, [profile]);

  const drawChart = (canvas: HTMLCanvasElement, sales: Sale[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const days = 7;
    const data = new Array(days).fill(0);
    const labels = new Array(days).fill('');
    
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      d.setHours(0,0,0,0);
      labels[i] = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayEnd = new Date(d);
      dayEnd.setHours(23,59,59,999);
      data[i] = sales.filter(s => s.createdAt.toDate() >= d && s.createdAt.toDate() <= dayEnd).reduce((acc, s) => acc + s.total, 0);
    }

    const max = Math.max(...data, 1000);
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = (chartWidth / days) * 0.7;
    const spacing = (chartWidth / days);

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    data.forEach((val, i) => {
      const barHeight = (val / max) * chartHeight;
      const x = padding + i * spacing + (spacing - barWidth) / 2;
      const y = height - padding - barHeight;
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barWidth / 2, height - padding + 15);
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Branch Overview</h1>
        <p className="text-slate-400 font-medium mt-1">Real-time performance metrics for your branch.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SmallStatCard title="Today's Revenue" value={formatCurrency(stats.todayRevenue)} icon={TrendingUp} color="bg-blue-600" />
        <SmallStatCard title="Today's Sales" value={stats.salesCount.toString()} icon={ShoppingBag} color="bg-purple-600" />
        <SmallStatCard title="Monthly Total" value={formatCurrency(stats.monthRevenue)} icon={Package} color="bg-indigo-600" />
        <SmallStatCard title="Low Stock Items" value={stats.lowStockCount.toString()} icon={AlertTriangle} color="bg-pink-600" />
      </div>

      <div className="glass p-8 rounded-[32px] shadow-sm relative overflow-hidden">
        <h3 className="text-lg font-bold mb-8 font-serif tracking-tight flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-400" />
          Daily Sales Trend
        </h3>
        <canvas ref={chartRef} width={1000} height={300} className="w-full h-[300px]" />
      </div>
    </div>
  );
}

function SmallStatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-6 rounded-[24px] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-lg", color)}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white tracking-tight">{value}</h4>
    </div>
  );
}
