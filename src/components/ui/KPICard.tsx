import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  icon: LucideIcon;
  color: 'indigo' | 'purple' | 'pink' | 'emerald' | 'amber';
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, trend, trendUp, icon: Icon, color }) => {
  const colors = {
    indigo: 'from-indigo-500/20 to-indigo-500/5 text-indigo-400 border-indigo-500/20',
    purple: 'from-purple-500/20 to-purple-500/5 text-purple-400 border-purple-500/20',
    pink: 'from-pink-500/20 to-pink-500/5 text-pink-400 border-pink-500/20',
    emerald: 'from-emerald-500/20 to-emerald-500/5 text-emerald-400 border-emerald-500/20',
    amber: 'from-amber-500/20 to-amber-500/5 text-amber-400 border-amber-500/20',
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-6 rounded-3xl border glass bg-gradient-to-br ${colors[color]}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-xl bg-white/5`}>
          <Icon className="w-5 h-5 text-current" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${trendUp ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {trend}
            {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" /> }
          </div>
        )}
      </div>
      <p className="micro-label mb-1">{title}</p>
      <h4 className="text-3xl font-bold font-display tracking-tight text-white">{value}</h4>
    </motion.div>
  );
};
