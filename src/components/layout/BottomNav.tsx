import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Menu as MenuIcon, 
  X,
  Receipt,
  Users,
  GitMerge,
  Settings,
  LogOut,
  ShieldAlert
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!user) return null;

  const isSuperAdmin = user.role === 'super_admin';
  const isOwner = user.role === 'business_owner';
  const isManager = user.role === 'manager';

  const isActive = (path: string) => location.pathname === path;

  // Tabs
  const tabs = [
    {
      label: 'Home',
      icon: LayoutDashboard,
      path: isSuperAdmin ? '/admin' : (user.role === 'salesperson' ? '/pos' : '/dashboard'),
      visible: true
    },
    {
      label: 'POS',
      icon: ShoppingCart,
      path: '/pos',
      visible: !isSuperAdmin
    },
    {
      label: 'Inventory',
      icon: Package,
      path: '/inventory',
      visible: !isSuperAdmin && (isOwner || isManager)
    },
    {
      label: 'Reports',
      icon: BarChart3,
      path: '/reports',
      visible: !isSuperAdmin && (isOwner || isManager)
    }
  ].filter(t => t.visible);

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-900 h-16 px-4 flex items-center justify-around">
        {tabs.map((tab, idx) => (
          <button
            key={idx}
            onClick={() => {
              setDrawerOpen(false);
              navigate(tab.path);
            }}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
              isActive(tab.path) ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <tab.icon className="h-5.5 w-5.5 shrink-0" />
            <span className="text-[10px] tracking-wide">{tab.label}</span>
          </button>
        ))}

        {/* Menu Tab button to open drawer bottom-sheet */}
        <button
          onClick={() => setDrawerOpen(!drawerOpen)}
          className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition ${
            drawerOpen ? 'text-indigo-400 font-bold' : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <MenuIcon className="h-5.5 w-5.5 shrink-0" />
          <span className="text-[10px] tracking-wide">Menu</span>
        </button>
      </div>

      {/* Drawer bottom-sheet */}
      <AnimatePresence>
        {drawerOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Bottom Sheet Modal content */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-indigo-500/20 rounded-t-2xl max-h-[75vh] min-h-[40vh] overflow-y-auto p-6"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-base">Biashara Yako POS Menu</span>
                  <span className="text-xs text-slate-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded mt-1 max-w-max uppercase font-bold text-[9px]">
                    {user.name} ({user.role.replace('_', ' ')})
                  </span>
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 text-slate-400 hover:text-white transition bg-slate-950 rounded-lg border border-slate-850"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer list grid */}
              <div className="grid grid-cols-2 gap-3 pb-8">
                {isSuperAdmin && (
                  <button
                    onClick={() => { navigate('/admin'); setDrawerOpen(false); }}
                    className="flex flex-col items-center gap-2 p-3.5 bg-red-950/10 border border-red-500/20 text-red-400 rounded-xl"
                  >
                    <ShieldAlert className="h-5 w-5" />
                    <span className="text-xs font-semibold">Admin Panel</span>
                  </button>
                )}

                {!isSuperAdmin && (
                  <>
                    <button
                      onClick={() => { navigate('/dashboard'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      <span className="text-xs font-semibold">Home / Mwanzo</span>
                    </button>
                    
                    <button
                      onClick={() => { navigate('/pos'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      <span className="text-xs font-semibold">POS Checkouts</span>
                    </button>
                  </>
                )}

                {!isSuperAdmin && (isOwner || isManager) && (
                  <>
                    <button
                      onClick={() => { navigate('/inventory'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <Package className="h-5 w-5" />
                      <span className="text-xs font-semibold">Inventory / Ghala</span>
                    </button>
                    
                    <button
                      onClick={() => { navigate('/expenses'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <Receipt className="h-5 w-5" />
                      <span className="text-xs font-semibold">Expenses / Matumizi</span>
                    </button>

                    <button
                      onClick={() => { navigate('/reports'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <BarChart3 className="h-5 w-5" />
                      <span className="text-xs font-semibold">Reports / Ripoti</span>
                    </button>

                    <button
                      onClick={() => { navigate('/users'); setDrawerOpen(false); }}
                      className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                    >
                      <Users className="h-5 w-5" />
                      <span className="text-xs font-semibold">Team / Wafanyakazi</span>
                    </button>
                  </>
                )}

                {isOwner && (
                  <button
                    onClick={() => { navigate('/branches'); setDrawerOpen(false); }}
                    className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                  >
                    <GitMerge className="h-5 w-5" />
                    <span className="text-xs font-semibold">Matawi / Branches</span>
                  </button>
                )}

                <button
                  onClick={() => { navigate('/settings'); setDrawerOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3.5 bg-slate-950 border border-slate-850 text-slate-300 rounded-xl"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-xs font-semibold">Settings / Mipangilio</span>
                </button>

                <button
                  onClick={() => { logout(); setDrawerOpen(false); }}
                  className="flex flex-col items-center gap-2 p-3.5 bg-red-950/10 border border-red-500/20 text-red-400 rounded-xl col-span-2"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="text-xs font-bold">Log Out / Ondoka</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
export default BottomNav;
