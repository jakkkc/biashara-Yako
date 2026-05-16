import React from 'react';
import { motion } from 'motion/react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  animate?: any;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", animate }) => {
  return (
    <motion.div 
      initial={animate ? { opacity: 0, y: 20 } : false}
      animate={animate ? { opacity: 1, y: 0 } : false}
      className={`glass-card ${className}`}
    >
      {children}
    </motion.div>
  );
};
