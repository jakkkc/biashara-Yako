import { useAuth } from "../../hooks/useAuth";
import { Link, useNavigate, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  ShoppingBag, 
  Receipt, 
  TrendingUp, 
  LogOut, 
  Menu, 
  X, 
  UserCircle 
} from "lucide-react";
import { useState } from "react";
import { Button } from "../ui";
import { cn } from "../../lib/utils";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out?")) {
      await logout();
      navigate("/login");
    }
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['super_admin', 'business_owner', 'manager'] },
    { name: 'POS', icon: ShoppingBag, href: '/pos', roles: ['manager', 'salesperson'] },
    { name: 'Businesses', icon: Store, href: '/admin/businesses', roles: ['super_admin'] },
    { name: 'Branches', icon: Store, href: '/owner/branches', roles: ['business_owner'] },
    { name: 'Inventory', icon: ShoppingBag, href: '/inventory', roles: ['manager'] },
    { name: 'Sales', icon: Receipt, href: '/sales', roles: ['business_owner', 'manager', 'salesperson'] },
    { name: 'Expenses', icon: TrendingUp, href: '/expenses', roles: ['business_owner', 'manager'] },
    { name: 'Staff', icon: Users, href: '/staff', roles: ['business_owner', 'manager'] },
  ];

  const filteredNav = navItems.filter(item => 
    profile && item.roles.includes(profile.role)
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="bg-white"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out lg:relative lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-emerald-400">Biashara Yako</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            {profile?.role.replace('_', ' ')}
          </p>
        </div>

        <nav className="mt-4 px-4 space-y-1">
          {filteredNav.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors",
                location.pathname === item.href 
                  ? "bg-emerald-600 text-white" 
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={18} />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <UserCircle className="text-slate-400" />
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-slate-400 hover:text-white hover:bg-slate-800 p-0"
            onClick={handleLogout}
          >
            <LogOut size={18} className="mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center px-8 lg:px-12 sticky top-0 z-30">
          <h2 className="text-lg font-semibold text-slate-800">
            {filteredNav.find(item => location.pathname === item.href)?.name || 'Dashboard'}
          </h2>
          <div className="ml-auto flex items-center gap-4">
             {/* Profile Link or other top-right items */}
          </div>
        </header>

        <div className="p-8 lg:p-12">
          {children}
        </div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
