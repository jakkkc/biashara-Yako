import React, { useEffect, useRef, useState } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Sale, Branch } from '../../types';
import { ShoppingBag, TrendingUp, Users, Package, AlertTriangle, Building2 } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';

export default function OwnerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    branchCount: 0,
    lowStockCount: 0,
    todaySales: 0
  });
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!profile?.businessId) return;

    const fetchData = async () => {
      // Branches
      const branchesQ = query(collection(db, 'branches'), where('businessId', '==', profile.businessId));
      const branchesSnap = await getDocs(branchesQ);
      const branchCount = branchesSnap.size;

      // Sales
      const salesQ = query(collection(db, 'sales'), where('businessId', '==', profile.businessId));
      const salesSnap = await getDocs(salesQ);
      const sales = salesSnap.docs.map(doc => doc.data() as Sale);
      
      const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0);
      
      const today = new Date();
      today.setHours(0,0,0,0);
      const todaySales = sales
        .filter(s => s.createdAt.toDate() >= today)
        .reduce((acc, s) => acc + s.total, 0);

      // Low Stock
      const productsQ = query(collection(db, 'products'), where('businessId', '==', profile.businessId));
      const productsSnap = await getDocs(productsQ);
      const lowStockCount = productsSnap.docs.filter(d => {
        const p = d.data();
        return p.quantity <= p.lowStockAlert;
      }).length;

      setStats({ totalRevenue, branchCount, lowStockCount, todaySales });
      
      // Draw Chart
      if (chartRef.current) {
        drawChart(chartRef.current, sales);
      }
    };

    fetchData();
  }, [profile]);

  const drawChart = (canvas: HTMLCanvasElement, sales: Sale[]) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Get last 7 days revenue
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
      
      data[i] = sales
        .filter(s => s.createdAt.toDate() >= d && s.createdAt.toDate() <= dayEnd)
        .reduce((acc, s) => acc + s.total, 0);
    }

    const max = Math.max(...data, 1000);
    const padding = 40;
    const chartHeight = height - padding * 2;
    const chartWidth = width - padding * 2;
    const barWidth = (chartWidth / days) * 0.7;
    const spacing = (chartWidth / days);

    // Draw Axes
    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Draw Bars
    data.forEach((val, i) => {
      const barHeight = (val / max) * chartHeight;
      const x = padding + i * spacing + (spacing - barWidth) / 2;
      const y = height - padding - barHeight;

      // Bar
      ctx.fillStyle = '#10b981'; // emerald-500
      ctx.fillRect(x, y, barWidth, barHeight);
      
      // Label
      ctx.fillStyle = '#64748b'; // slate-500
      ctx.font = '10px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(labels[i], x + barWidth / 2, height - padding + 15);
      
      // Value (on hover or always)
      if (val > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.fillText(Math.round(val/1000) + 'k', x + barWidth / 2, y - 5);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white font-serif tracking-tight">Welcome back, {profile?.name}</h1>
        <p className="text-slate-400 font-medium mt-1">Here's what's happening across your business today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Daily Revenue" 
          value={formatCurrency(stats.todaySales)} 
          description="Total sales today"
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatCard 
          title="Active Branches" 
          value={stats.branchCount.toString()} 
          description="Operational outlets"
          icon={Building2}
          color="bg-purple-600"
        />
        <StatCard 
          title="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          description="Cumulative sales"
          icon={ShoppingBag}
          color="bg-indigo-600"
        />
        <StatCard 
          title="Low Stock" 
          value={stats.lowStockCount.toString()} 
          description="Items needing restock"
          icon={AlertTriangle}
          color="bg-pink-600"
          isAlert={stats.lowStockCount > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass p-8 rounded-[32px] shadow-sm relative overflow-hidden">
          <h3 className="text-lg font-bold mb-8 font-serif tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Revenue Performance (Last 7 Days)
          </h3>
          <canvas 
            ref={chartRef} 
            width={800} 
            height={300} 
            className="w-full h-[300px]"
          />
        </div>

        <div className="glass p-6 rounded-[32px] shadow-sm relative overflow-hidden">
          <h3 className="text-lg font-bold mb-8 font-serif tracking-tight">Quick Actions</h3>
          <div className="space-y-3">
            <ActionButton label="Add New Branch" icon={Building2} onClick={() => {}} />
            <ActionButton label="Register Employee" icon={Users} onClick={() => {}} />
            <ActionButton label="Manage Inventory" icon={Package} onClick={() => {}} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, description, icon: Icon, color, isAlert }: any) {
  return (
    <div className="glass-card p-6 rounded-[24px] shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
      <div className="flex items-start justify-between mb-6">
        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg", color)}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {isAlert && <span className="flex h-3 w-3 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50"></span>}
      </div>
      <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white tracking-tight">{value}</h4>
      <p className="text-[10px] text-slate-500 mt-2 font-medium">{description}</p>
    </div>
  );
}

function ActionButton({ label, icon: Icon, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/30 transition-all group text-left"
    >
      <div className="p-2.5 rounded-xl bg-white/5 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-400 transition-all">
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-sm font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
    </button>
  );
}
