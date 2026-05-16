import { format } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'KES') => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (date: string | number | Date, pattern: string = 'PPP') => {
  if (!date) return 'N/A';
  return format(new Date(date), pattern);
};

export const formatRelativeTime = (date: string | number | Date) => {
  if (!date) return 'N/A';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return format(d, 'MMM d, h:mm a');
};
