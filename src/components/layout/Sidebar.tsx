import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Receipt, 
  Users, 
  Settings, 
  LogOut, 
  Store,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  FileText,
  BadgeCent,
  ShieldAlert
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const { logout, profile, isSuperAdmin, impersonatedId, impersonate } = useAuth();
  const navigate = useNavigate();

  const menuItems = [
    { name: 'Overview', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'POS', icon: ShoppingCart, path: '/dashboard/pos' },
    { name: 'Inventory', icon: Package, path: '/dashboard/inventory' },
    { name: 'Sales History', icon: Receipt, path: '/dashboard/sales' },
    { name: 'Expenses', icon: BadgeCent, path: '/dashboard/expenses' },
    { name: 'Customers', icon: Users, path: '/dashboard/customers' },
    { name: 'Reports', icon: TrendingUp, path: '/dashboard/reports' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  if (isSuperAdmin) {
    menuItems.unshift({ name: 'Admin Console', icon: ShieldAlert, path: '/admin' });
  }

  const handleBackToAdmin = () => {
    impersonate(null);
    navigate('/admin');
  };

  // Adjust menu based on role if needed
  // ...

  return (
    <div className={`fixed left-0 top-0 h-full bg-navy-muted text-white transition-all duration-300 z-50 flex flex-col border-r border-slate-800 ${collapsed ? 'w-20' : 'w-72'}`}>
      {/* Brand */}
      <div className="h-20 flex items-center px-6 border-b border-slate-800 shrink-0 gap-3">
        <div className="w-10 h-10 bg-gold rounded-lg flex items-center justify-center shadow-lg shadow-gold/20 shrink-0">
          <span className="text-navy font-black text-xl leading-none">B</span>
        </div>
        {!collapsed && (
          <div>
            <h1 className="font-bold text-lg leading-none text-white tracking-tight">Biashara Yako</h1>
            <p className="text-[10px] uppercase tracking-widest text-gold font-semibold mt-0.5">POS System</p>
          </div>
        )}
      </div>

      {/* Menu */}
      <nav className="flex-1 py-6 space-y-2 overflow-y-auto px-4 scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            end={item.path === '/dashboard'}
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-3 rounded-xl transition-all group
              ${isActive 
                ? 'bg-slate-800/50 text-gold border-l-4 border-gold shadow-sm' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'}
            `}
          >
            <item.icon className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
            {!collapsed && <span className="font-medium">{item.name}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 border-t border-slate-800 space-y-4">
        {isSuperAdmin && impersonatedId && (
          <button 
            onClick={handleBackToAdmin}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-gold text-navy font-bold transition-all shadow-lg shadow-gold/10 group"
          >
            <ShieldAlert className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} strokeWidth={2.5} />
            {!collapsed && <span className="font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Admin Return</span>}
          </button>
        )}
        {!collapsed && (
          <div className="bg-navy rounded-xl p-3 border border-slate-800">
            <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Account Owner</p>
            <p className="text-xs font-semibold text-white truncate">{profile?.displayName || 'User'}</p>
            <p className="text-[10px] text-gold truncate">{profile?.email}</p>
          </div>
        )}
        <button 
          onClick={() => logout().then(() => navigate('/'))}
          className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all group"
        >
          <LogOut className={`w-5 h-5 shrink-0 ${collapsed ? 'mx-auto' : ''}`} />
          {!collapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>

      {/* Toggle */}
      <button 
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-24 w-6 h-6 bg-gold rounded-full flex items-center justify-center text-navy shadow-lg"
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>
    </div>
  );
}
