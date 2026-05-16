import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassCard';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  trend?: string;
  trendType?: 'up' | 'down';
  glowColor?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-400',
  trend,
  trendType = 'up',
  glowColor = 'group-hover:shadow-[0_0_24px_rgba(129,140,248,0.15)]'
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group"
    >
      <GlassCard className={`relative overflow-hidden transition-all duration-300 ${glowColor} flex flex-col justify-between h-32 p-4`}>
        {/* Glow backdrop decorative bubble */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-emerald-500/0 rounded-full blur-2xl group-hover:scale-125 transition duration-500 pointer-events:none" />

        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1 z-10">
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
              {title}
            </span>
            <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white mt-1">
              {value}
            </span>
          </div>
          <div className={`p-3.5 rounded-xl bg-slate-950/45 border border-slate-800 ${iconColor} flex items-center justify-center z-10`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto z-10">
          <span className="text-xs text-slate-500 truncate max-w-[70%]">
            {subtitle}
          </span>
          {trend && (
            <span className={`text-xs font-medium font-mono ${
              trendType === 'up' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {trend}
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
};
export default KPICard;
