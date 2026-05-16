import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'info', children }) => {
  let classes = 'badge-info';
  if (variant === 'success') classes = 'badge-success';
  if (variant === 'warning') classes = 'badge-warning';
  if (variant === 'error') classes = 'badge-error';

  return (
    <span className={`inline-flex items-center text-xs font-semibold ${classes}`}>
      {children}
    </span>
  );
};
export default Badge;
