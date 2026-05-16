export const SYSTEM_CATEGORIES = [
  'Beverages / Vinywaji',
  'Food / Chakula',
  'Electronics / Elektroniki',
  'Apparel / Mavazi',
  'Beauty & Cosmetics / Vipodozi',
  'Pharmaceuticals / Dawa',
  'Hardware / Vifaa',
  'General / Bidhaa za Jumla'
];

export const EXPENSE_CATEGORIES = [
  { value: 'rent', label: 'Rent / Kodi' },
  { value: 'utilities', label: 'Utilities / Huduma' },
  { value: 'salaries', label: 'Salaries / Mishahara' },
  { value: 'supplies', label: 'Supplies / Bidhaa' },
  { value: 'other', label: 'Other / Zingine' }
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash / Fedha Taslimu', color: '#64748b' },
  { value: 'mpesa', label: 'M-Pesa / Simu', color: '#00a651' },
  { value: 'card', label: 'Card / Kadi', color: '#2563eb' },
  { value: 'credit', label: 'Credit / Mkopo', color: '#d97706' }
] as const;

export const CURRENCIES = [
  { code: 'KES', name: 'Kenyan Shilling (KES)', symbol: 'KES' },
  { code: 'UGX', name: 'Ugandan Shilling (UGX)', symbol: 'UGX' },
  { code: 'TZS', name: 'Tanzanian Shilling (TZS)', symbol: 'TZS' }
];

export const CURRENCY_OPTIONS = CURRENCIES;

// Simple Swahili Dictionary for key labels to fulfill localization
export const SWAHILI_TRANSLATIONS: Record<string, string> = {
  dashboard: 'Mwanzo',
  pos: 'Uuzaji (POS)',
  inventory: 'Ghala (Bidhaa)',
  reports: 'Ripoti',
  expenses: 'Matumizi',
  users: 'Wafanyakazi',
  branches: 'Matawi',
  settings: 'Mipangilio',
  completed: 'Imekamilika',
  voided: 'Imebatilishwa',
  active: 'Inafanya kazi',
  suspended: 'Imesimamishwa',
  inactive: 'Haifanyi kazi',
  pending: 'Inasubiri',
  approved: 'Imeidhinishwa',
  'Today\'s Sales': 'Mauzo ya Leo',
  'This Month\'s Revenue': 'Mapato ya Mwezi huu',
  'Total Products': 'Jumla ya Bidhaa',
  'Low Stock Alerts': 'Tahadhari ya Akiba ya Chini',
  'Pending Expenses': 'Matumizi Yanayosubiri'
};

export function translate(text: string): string {
  return SWAHILI_TRANSLATIONS[text] || text;
}
