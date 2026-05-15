import { useAuth } from "../hooks/useAuth";
import SuperAdminDashboard from "./admin/SuperAdminDashboard";
import BusinessOwnerDashboard from "./owner/BusinessOwnerDashboard";
import ManagerDashboard from "./manager/ManagerDashboard";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router";

export default function Dashboard() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
      </div>
    );
  }

  if (profile?.role === 'super_admin') return <SuperAdminDashboard />;
  if (profile?.role === 'business_owner') return <BusinessOwnerDashboard />;
  if (profile?.role === 'manager') return <ManagerDashboard />;
  if (profile?.role === 'salesperson') return <Navigate to="/pos" />;

  return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold text-slate-800">Account Restricted</h2>
      <p className="text-slate-500 mt-2">Please contact your administrator if you believe this is an error.</p>
    </div>
  );
}
