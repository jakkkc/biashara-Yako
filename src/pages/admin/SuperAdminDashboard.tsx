import { Card, Badge } from "../../components/ui";

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-sm text-slate-500 font-medium">Total Businesses</p>
          <h3 className="text-3xl font-bold mt-2">24</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-500 font-medium">System Revenue (Today)</p>
          <h3 className="text-3xl font-bold mt-2 text-emerald-600">KES 450,200</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-500 font-medium">Active Branches</p>
          <h3 className="text-3xl font-bold mt-2">142</h3>
        </Card>
      </div>

      <Card className="p-8 text-center text-slate-400 border-dashed border-2 bg-transparent">
        <p>Full Super Admin features (Business Creation, User Management) are available in the management menu.</p>
      </Card>
    </div>
  );
}
