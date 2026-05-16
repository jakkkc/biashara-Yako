import React from 'react';
import { motion } from 'motion/react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className = '', 
  disabled, 
  onClick, 
  ...props 
}) => {
  let classes = 'btn-primary px-5 py-2.5 rounded-xl transition duration-200 ';
  
  if (variant === 'ghost') {
    classes = 'btn-ghost px-5 py-2.5 rounded-xl transition duration-200 ';
  } else if (variant === 'danger') {
    classes = 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 px-5 py-2.5 rounded-xl transition duration-200 ';
  }

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`${classes} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};
