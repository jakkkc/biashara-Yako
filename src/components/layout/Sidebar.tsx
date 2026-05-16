import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Receipt, 
  Users, 
  GitMerge, 
  Settings, 
  ShieldAlert, 
  ChevronLeft, 
  ChevronRight,
  LogOut,
  Sparkles,
  LayoutDashboard
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { user, business, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hoverExpanded, setHoverExpanded] = useState(false);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const isOwner = user.role === 'business_owner';
  const isManager = user.role === 'manager';
  const isSales = user.role === 'salesperson';

  // Navigation Items with Roles Access Controls
  const navItems = [
    // Main Group
    { 
      label: 'Dashboard / Mwanzo', 
      path: '/dashboard', 
      icon: LayoutDashboard, 
      group: 'main',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    { 
      label: 'POS / Uuzaji', 
      path: '/pos', 
      icon: ShoppingCart, 
      group: 'main',
      visible: !isSuperAdmin
    },
    // Management Group
    { 
      label: 'Inventory / Bidhaa', 
      path: '/inventory', 
      icon: Package, 
      group: 'management',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    { 
      label: 'Reports / Ripoti', 
      path: '/reports', 
      icon: BarChart3, 
      group: 'management',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    { 
      label: 'Expenses / Matumizi', 
      path: '/expenses', 
      icon: Receipt, 
      group: 'management',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    { 
      label: 'Wafanyakazi / Team', 
      path: '/users', 
      icon: Users, 
      group: 'management',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    { 
      label: 'Matawi / Branches', 
      path: '/branches', 
      icon: GitMerge, 
      group: 'management',
      visible: !isSuperAdmin && isOwner
    },
    { 
      label: 'Settings / Mipangilio', 
      path: '/settings', 
      icon: Settings, 
      group: 'management',
      visible: true // All users can manage profile
    },
    // Admin Group
    { 
      label: 'SaaS Admin Panel', 
      path: '/admin', 
      icon: ShieldAlert, 
      group: 'admin',
      visible: isSuperAdmin
    }
  ];

  const visibleItems = navItems.filter(item => item.visible);
  
  // Real active state tracking
  const isActive = (path: string) => location.pathname === path;

  const isCollapsed = collapsed && !hoverExpanded;

  return (
    <aside 
      className={`hidden md:flex flex-col h-screen fixed left-0 top-0 transition-all duration-300 z-40 bg-[#070714]/90 backdrop-blur-md border-r border-white/5 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
      onMouseEnter={() => collapsed && setHoverExpanded(true)}
      onMouseLeave={() => collapsed && setHoverExpanded(false)}
    >
      {/* Brand Logo header */}
      <div className="flex items-center justify-between h-16 border-b border-white/5 px-4">
        <div className="flex items-center gap-3 overflow-hidden select-none">
          <div className="p-2 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          {!isCollapsed && (
            <span className="font-bold text-base tracking-wide text-white whitespace-nowrap bg-gradient-to-r from-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              {isSuperAdmin ? 'Biashara SaaS' : business?.name || 'BiasharaPOS'}
            </span>
          )}
        </div>
        
        {/* Toggle Collapse - Desktop only */}
        {!isCollapsed && collapsed && (
          <button 
            onClick={() => setCollapsed(false)}
            className="hidden lg:block p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}
        {!isCollapsed && !collapsed && (
          <button 
            onClick={() => setCollapsed(true)}
            className="hidden lg:block p-1 text-slate-400 hover:text-white transition"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Main Group */}
        {visibleItems.filter(i => i.group === 'main').length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Main
              </span>
            )}
            {visibleItems.filter(i => i.group === 'main').map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3.5 w-full py-2.5 px-3 rounded-xl transition duration-150 relative ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-indigo-600/25 to-indigo-600/5 text-slate-100 border-l-[3px] border-indigo-500'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Management Group */}
        {visibleItems.filter(i => i.group === 'management').length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                Management
              </span>
            )}
            {visibleItems.filter(i => i.group === 'management').map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3.5 w-full py-2.5 px-3 rounded-xl transition duration-150 relative ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-indigo-600/25 to-indigo-600/5 text-slate-100 border-l-[3px] border-indigo-500'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.path) ? 'text-indigo-400' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
        )}

        {/* Admin Group */}
        {visibleItems.filter(i => i.group === 'admin').length > 0 && (
          <div className="space-y-1">
            {!isCollapsed && (
              <span className="px-3 text-[10px] font-bold tracking-wider text-red-500/80 uppercase font-semibold">
                SaaS Admin
              </span>
            )}
            {visibleItems.filter(i => i.group === 'admin').map((item, idx) => (
              <button
                key={idx}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3.5 w-full py-2.5 px-3 rounded-xl transition duration-150 relative ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-red-600/25 to-transparent text-red-100 border-l-[3px] border-red-500'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-red-400'
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${isActive(item.path) ? 'text-red-400' : 'text-slate-500'}`} />
                {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* Footer metadata user badge */}
      <div className="p-3 border-t border-white/5 space-y-2">
        <div className="flex items-center gap-2 overflow-hidden bg-slate-950/40 p-1.5 rounded-xl border border-white/5">
          <div className="h-8 w-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-600/30 font-bold flex items-center justify-center shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate leading-none mb-1">{user.name}</p>
              <span className="capitalize bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold text-[9px] px-1.5 py-0.5 rounded">
                {user.role.replace('_', ' ')}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3.5 w-full py-2 px-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition cursor-pointer"
        >
          <LogOut className="h-5 w-5 shrink-0 text-slate-500" />
          {!isCollapsed && <span className="text-sm font-medium">Log Out</span>}
        </button>

        {!isCollapsed && (
          <div className="pt-2 text-[10px] text-center text-slate-600 font-mono">
            <span>By </span>
            <a 
              href="https://nex-chi-six.vercel.app/" 
              target="_blank" 
              referrerPolicy="no-referrer"
              className="hover:text-indigo-400 transition underline font-semibold"
            >
              Munene Jackson / Nex-Ink
            </a>
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
