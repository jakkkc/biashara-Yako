import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Package, Settings, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export const BottomNav: React.FC = () => {
  const { userProfile } = useAuth();
  
  const navItems = [
    { icon: LayoutDashboard, label: 'Home', path: '/dashboard', roles: ['business_owner', 'manager'] },
    { icon: ShoppingCart, label: 'POS', path: '/pos', roles: ['business_owner', 'manager', 'salesperson'] },
    { icon: Package, label: 'Stock', path: '/inventory', roles: ['business_owner', 'manager'] },
    { icon: Users, label: 'Team', path: '/users', roles: ['business_owner', 'manager'] },
    { icon: Settings, label: 'Set', path: '/settings', roles: ['business_owner', 'manager', 'salesperson'] },
  ];

  const filteredItems = navItems.filter(item => 
    !item.roles || (userProfile && item.roles.includes(userProfile.role))
  );

  return (
    <nav className="fixed bottom-0 left-0 right-0 lg:hidden glass border-t border-white/10 px-2 py-2 z-50 flex items-center justify-around">
      {filteredItems.map((item) => (
        <NavLink 
          key={item.path}
          to={item.path}
          className={({ isActive }) => `flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-[10px] uppercase font-bold tracking-wider">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
