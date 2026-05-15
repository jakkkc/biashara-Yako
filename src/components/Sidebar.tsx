import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  BarChart3, 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard, 
  TrendingDown, 
  Settings,
  Building2,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';

export function Sidebar() {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  const getLinks = () => {
    switch (profile.role) {
      case 'super_admin':
        return [
          { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/admin/businesses', icon: Building2, label: 'Businesses' },
        ];
      case 'business_owner':
        return [
          { to: '/owner/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/owner/branches', icon: Building2, label: 'Branches' },
          { to: '/owner/employees', icon: Users, label: 'Employees' },
          { to: '/owner/inventory', icon: Package, label: 'Inventory' },
          { to: '/owner/reports', icon: BarChart3, label: 'Reports' },
        ];
      case 'manager':
        return [
          { to: '/manager/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
          { to: '/sales/pos', icon: ShoppingBag, label: 'POS' },
          { to: '/manager/sales', icon: CreditCard, label: 'Sales' },
          { to: '/manager/inventory', icon: Package, label: 'Inventory' },
          { to: '/manager/expenses', icon: TrendingDown, label: 'Expenses' },
          { to: '/manager/employees', icon: Users, label: 'Employees' },
          { to: '/manager/reports', icon: BarChart3, label: 'Reports' },
        ];
      case 'salesperson':
        return [
          { to: '/sales/pos', icon: ShoppingBag, label: 'POS' },
          { to: '/sales/my-sales', icon: CreditCard, label: 'My Sales' },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <div className="flex flex-col h-screen w-64 glass-sidebar border-r border-white/5 text-slate-100 relative z-20">
      <div className="p-8">
        <h1 className="text-2xl font-black text-white font-serif tracking-tight">Biashara<span className="text-blue-500">Yako</span></h1>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse" />
          <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Enterprise POS</p>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-5 py-4 text-sm font-bold rounded-2xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.1)]" 
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-100 border border-transparent"
              )
            }
          >
            <link.icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            <span className="flex-1">{link.label}</span>
            <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-40 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3 p-4 glass-card rounded-[24px] mb-4 border border-white/5 shadow-xl">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[1px]">
            <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-white font-black text-sm">
              {profile.name.charAt(0)}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{profile.name}</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mt-1">{profile.role.replace('_', ' ')}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-5 py-4 text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-2xl transition-all border border-transparent hover:border-red-500/20 active:scale-95"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
