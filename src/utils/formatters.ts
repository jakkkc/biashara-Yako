import { format, parseISO } from 'date-fns';

/**
 * Standard currency formatter for East African currencies (KES, UGX, TZS)
 */
export function formatCurrency(amount: number, currency: string = 'KES'): string {
  const numericAmount = typeof amount === 'number' ? amount : 0;
  
  // Format with thousands separator and decimal
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);

  return `${currency} ${formattedNumber}`;
}

/**
 * Format string or Date object into 'dd MMM yyyy' layout
 */
export function formatDateString(date: Date | string | null | undefined): string {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? parseISO(date) : date;
    return format(d, 'dd MMM yyyy');
  } catch (error) {
    try {
      // Fallback
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return String(date);
    }
  }
}

/**
 * Normalise East African phone numbers, defaulting to Kenyan code (+254)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, ''); // strip non-numeric characters
  
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (!cleaned.startsWith('254') && !cleaned.startsWith('256') && !cleaned.startsWith('255')) {
    cleaned = '254' + cleaned;
  }
  
  return `+${cleaned}`;
}

/**
 * Helper to auto-generate sale reference numbers: BYP-YYYYMMDD-XXXX
 */
export function generateSaleReference(): string {
  const dateStr = format(new Date(), 'yyyyMMdd');
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `BYP-${dateStr}-${random}`;
}
