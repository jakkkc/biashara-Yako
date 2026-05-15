import { Card } from "../../components/ui";

export default function BusinessOwnerDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 border-emerald-100 bg-emerald-50/30">
          <p className="text-sm text-slate-500 font-medium">Business Wide Sales</p>
          <h3 className="text-3xl font-bold mt-2">KES 1.2M</h3>
        </Card>
        <Card className="p-6">
          <p className="text-sm text-slate-500 font-medium">Total Branches</p>
          <h3 className="text-3xl font-bold mt-2">5</h3>
        </Card>
      </div>

      <Card className="p-12 text-center text-slate-400">
        <p>Your business overview and branch performance metrics will appear here.</p>
      </Card>
    </div>
  );
}
