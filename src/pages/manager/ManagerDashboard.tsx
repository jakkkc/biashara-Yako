import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { firestore } from "../../services/firestore";
import { aiService } from "../../services/ai";
import { Product, Sale, Expense } from "../../types";
import { Card, Button, Badge } from "../../components/ui";
import { cn } from "../../lib/utils";
import { 
  TrendingUp, 
  ShoppingBag, 
  AlertTriangle, 
  Calendar, 
  Sparkles, 
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { formatCurrency, formatDate } from "../../lib/utils";
import { query, where, orderBy, limit } from "firebase/firestore";
import { motion } from "motion/react";

export default function ManagerDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState({
    todaySales: 0,
    monthSales: 0,
    stockAlerts: 0,
    pendingExpenses: 0
  });
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [aiInsights, setAiInsights] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (profile?.branchId) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    const branchId = profile?.branchId;
    
    // Recent Sales
    const salesQ = [
      where("branchId", "==", branchId), 
      orderBy("createdAt", "desc"), 
      limit(5)
    ];
    const s = await firestore.getAll<Sale>("sales", salesQ);
    setRecentSales(s);

    // Stock Alerts
    const products = await firestore.getAll<Product>("products", [where("branchId", "==", branchId)]);
    const alertCount = products.filter(p => p.quantity <= (p.lowStockAlert || 5)).length;

    // TODO: Aggregate real sales for today
    setStats({
      todaySales: s.filter(sale => sale.status === 'completed').reduce((acc, curr) => acc + curr.total, 0),
      monthSales: 125000, // Placeholder
      stockAlerts: alertCount,
      pendingExpenses: 2
    });
  };

  const getAIInsights = async () => {
    setLoadingAi(true);
    try {
      const dataStr = `
        Recent Sales: ${recentSales.map(s => `${s.total} KES via ${s.paymentMethod}`).join(", ")}
        Stock Alerts: ${stats.stockAlerts}
        Business: ${profile?.businessId}
        Branch: ${profile?.branchId}
      `;
      const insight = await aiService.generateInsights(`Provide a quick business snapshot based on this data: ${dataStr}`);
      setAiInsights(insight);
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Today's Sales" 
          value={formatCurrency(stats.todaySales)} 
          change="+12.5%" 
          trend="up" 
          icon={<TrendingUp size={24} />} 
          color="emerald"
        />
        <StatCard 
          title="Monthly Revenue" 
          value={formatCurrency(stats.monthSales)} 
          change="+8.2%" 
          trend="up" 
          icon={<ArrowUpRight size={24} />} 
          color="sky"
        />
        <StatCard 
          title="Stock Alerts" 
          value={stats.stockAlerts.toString()} 
          subtitle="Items low on stock" 
          icon={<AlertTriangle size={24} />} 
          color="amber"
          warning={stats.stockAlerts > 0}
        />
        <StatCard 
          title="Pending Expenses" 
          value={stats.pendingExpenses.toString()} 
          subtitle="Awaiting approval" 
          icon={<Calendar size={24} />} 
          color="rose"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Sales Table */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
             <h3 className="font-bold text-slate-800">Recent Transactions</h3>
             <Button variant="ghost" size="sm" className="text-emerald-600">View All</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Time</th>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Total</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-xs text-slate-500">{formatDate(sale.createdAt)}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-800">{sale.customerName || "Walk-in"}</td>
                    <td className="px-6 py-4">
                      <Badge variant="info">{sale.paymentMethod.toUpperCase()}</Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(sale.total)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-2 h-2 rounded-full", sale.status === 'completed' ? "bg-emerald-500" : "bg-rose-500")} />
                        <span className="text-xs font-medium capitalize">{sale.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* AI Insight Card */}
        <div className="space-y-6">
          <Card className="bg-slate-900 text-white p-8 relative overflow-hidden border-none ring-8 ring-slate-100">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-emerald-400 mb-4">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">AI Insights</span>
              </div>
              <h4 className="text-xl font-bold mb-4">How's your branch doing?</h4>
              
              {aiInsights ? (
                <p className="text-slate-300 text-sm leading-relaxed mb-6 italic">
                  "{aiInsights}"
                </p>
              ) : (
                <p className="text-slate-400 text-sm mb-6">
                  Get a personalized AI analysis of your sales performance and stock levels.
                </p>
              )}

              <Button 
                variant="primary" 
                className="w-full bg-emerald-500 hover:bg-emerald-600 border-none"
                onClick={getAIInsights}
                disabled={loadingAi}
              >
                {loadingAi ? <Loader2 className="animate-spin" /> : "Generate Snapshot"}
              </Button>
            </div>
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-sky-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />
          </Card>

          <Card className="p-6">
            <h4 className="font-bold text-slate-800 mb-4 text-sm uppercase tracking-wider">Inventory Health</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Low Stock Items</p>
                    <p className="text-xs text-slate-500">Action required</p>
                  </div>
                </div>
                <span className="font-bold text-amber-600">{stats.stockAlerts}</span>
              </div>
              <Button variant="outline" className="w-full text-xs h-9">View Stock Report</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, trend, subtitle, icon, color, warning }: any) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600",
    sky: "bg-sky-50 text-sky-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600"
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-xl", colors[color as keyof typeof colors])}>
          {icon}
        </div>
        {change && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1",
            trend === 'up' ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {change}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
           <h3 className={cn("text-2xl font-bold text-slate-900", warning && "text-rose-600")}>{value}</h3>
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </Card>
  );
}

function Loader2({ className }: { className?: string }) {
  return <ShoppingBag className={cn("animate-bounce", className)} />;
}
