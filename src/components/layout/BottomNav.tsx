import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Settings,
  MoreHorizontal
} from 'lucide-react';

export default function BottomNav() {
  const menuItems = [
    { name: 'Home', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'POS', icon: ShoppingCart, path: '/dashboard/pos' },
    { name: 'Stock', icon: Package, path: '/dashboard/inventory' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-navy/90 backdrop-blur-xl border-t border-slate-800 flex items-center justify-around px-2 z-50 lg:hidden">
      {menuItems.map((item) => (
        <NavLink
          key={item.name}
          to={item.path}
          end={item.path === '/dashboard'}
          className={({ isActive }) => `
            flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all
            ${isActive ? 'text-gold' : 'text-slate-500'}
          `}
        >
          <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
          <span className="text-[10px] font-black uppercase tracking-tighter">{item.name}</span>
          {/* Active Indicator */}
          <NavLink 
            to={item.path} 
            end={item.path === '/dashboard'}
            className={({ isActive }) => isActive ? "absolute bottom-0 w-8 h-1 bg-gold rounded-t-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "hidden"}
          />
        </NavLink>
      ))}
      <button className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-slate-500">
        <MoreHorizontal size={20} />
        <span className="text-[10px] font-black uppercase tracking-tighter">More</span>
      </button>
    </nav>
  );
}
