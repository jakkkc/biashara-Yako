import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Receipt, 
  Users, 
  Settings, 
  LogOut,
  Store,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const Sidebar: React.FC = () => {
  const { userProfile, signOut, isAdmin } = useAuth();
  
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', roles: ['business_owner', 'manager'] },
    { icon: ShoppingCart, label: 'POS', path: '/pos', roles: ['business_owner', 'manager', 'salesperson'] },
    { icon: Package, label: 'Inventory', path: '/inventory', roles: ['business_owner', 'manager'] },
    { icon: Receipt, label: 'Expenses', path: '/expenses', roles: ['business_owner', 'manager'] },
    { icon: BarChart3, label: 'Reports', path: '/reports', roles: ['business_owner', 'manager'] },
    { icon: Users, label: 'Team', path: '/users', roles: ['business_owner', 'manager'] },
    { icon: Store, label: 'Branches', path: '/branches', roles: ['business_owner'] },
    { icon: Settings, label: 'Settings', path: '/settings', roles: ['business_owner', 'manager', 'salesperson'] },
  ];

  const filteredMenu = menuItems.filter(item => 
    !item.roles || (userProfile && item.roles.includes(userProfile.role))
  );

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-900 flex flex-col hidden lg:flex h-screen sticky top-0 p-4">
      <div className="p-4 mb-8">
        <h1 className="text-xl font-display font-bold text-white tracking-tight">
          NEXUS CORE
        </h1>
        <p className="text-[10px] micro-label !text-indigo-400 mt-1">TERMINAL_V1.0</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {isAdmin && (
          <NavLink 
            to="/admin" 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-slate-900 text-white border border-slate-800' : 'text-slate-500 hover:text-white'}`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-sm font-bold uppercase tracking-tight">System Admin</span>
          </NavLink>
        )}

        {filteredMenu.map((item) => (
          <NavLink 
            key={item.path}
            to={item.path} 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all group ${isActive ? 'bg-slate-900 text-white border border-slate-800 shadow-sm' : 'text-slate-500 hover:text-white'}`}
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'}`} />
                <span className="text-sm font-bold uppercase tracking-tight">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
      
      <div className="p-2 mt-auto">
        <button 
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 border-none w-full rounded-2xl text-slate-600 hover:text-red-400 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          <span>LOGOUT</span>
        </button>
      </div>
    </aside>
  );
};
