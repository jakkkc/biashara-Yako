/**
 * Core types for Biashara Yako POS
 */

export type BusinessStatus = 'active' | 'suspended';
export type SubscriptionPlan = 'free' | 'basic' | 'premium';
export type UserRole = 'SuperAdmin' | 'Owner' | 'BranchManager' | 'Salesperson' | 'Cashier' | 'StockController';
export type PaymentMethod = 'Cash' | 'Mpesa' | 'BankTransfer' | 'Credit';
export type SaleStatus = 'completed' | 'pending' | 'refunded';
export type TransferStatus = 'pending' | 'approved' | 'rejected';
export type ShiftStatus = 'open' | 'closed';

export interface Business {
  id: string;
  name: string;
  type: string;
  location: string;
  ownerUid: string;
  ownerEmail: string;
  logoUrl?: string;
  status: BusinessStatus;
  currency: string;
  vatEnabled: boolean;
  vatPercentage: number;
  receiptConfig: {
    logo?: string;
    businessName: string;
    tagline?: string;
    contactInfo?: string;
    footerMessage?: string;
  };
  subscriptionPlan: SubscriptionPlan;
  subscriptionExpiry: number;
  createdAt: number;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  location: string;
  contactNumber: string;
  active: boolean;
  createdAt: number;
}

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  sku: string;
  category: string;
  variants: ProductVariant[];
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  supplierName?: string;
  unitOfMeasure: string;
  createdAt: number;
  updatedAt: number;
  createdBy: string;
}

export interface SaleItem {
  productId: string;
  variantId?: string;
  name: string;
  quantity: number;
  unitPrice: number;
  discount: number; // amount or %
  total: number;
}

export interface Sale {
  id: string;
  businessId: string;
  branchId: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: PaymentMethod;
  mpesaRef?: string;
  customerId?: string;
  status: SaleStatus;
  createdBy: string;
  createdByName: string;
  createdAt: number;
  editedBy?: string;
  editReason?: string;
  editedAt?: number;
  deletedBy?: string;
  deleteReason?: string;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  receiptPhotoUrl?: string;
  loggedBy: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalPurchases: number;
  visitCount: number;
  totalSpent: number;
  creditBalance: number;
  createdAt: number;
}

export interface Supplier {
  id: string;
  businessId: string;
  name: string;
  contactPerson: string;
  phone: string;
  categories: string[];
  createdAt: number;
}

export interface StockTransfer {
  id: string;
  businessId: string;
  fromBranchId: string;
  toBranchId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  requestedBy: string;
  status: TransferStatus;
  approvedBy?: string;
  createdAt: number;
  resolvedAt?: number;
}

export interface Shift {
  id: string;
  businessId: string;
  branchId: string;
  openedBy: string;
  openingFloat: number;
  closedBy?: string;
  expectedCash: number;
  actualCash?: number;
  variance?: number;
  status: ShiftStatus;
  openedAt: number;
  closedAt?: number;
}

export type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'SALE_CREATED' | 'SALE_EDITED' | 'SALE_DELETED' 
  | 'EXPENSE_ADDED' | 'EXPENSE_EDITED' | 'INVENTORY_CHANGED' | 'STOCK_TRANSFER' 
  | 'USER_ADDED' | 'USER_EDITED' | 'USER_DELETED' | 'RECEIPT_EDITED' 
  | 'SETTINGS_CHANGED' | 'BRANCH_ADDED' | 'SHIFT_OPENED' | 'SHIFT_CLOSED';

export interface AuditLog {
  id: string;
  businessId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  branchId?: string;
  performedBy: string;
  performedByName: string;
  details: string; // JSON string or text
  timestamp: number;
}

export interface UserProfile {
  id: string;
  businessId: string;
  branchId?: string;
  role: UserRole;
  displayName: string;
  username?: string; // for staff
  email?: string; // for owners
  passwordHash?: string; // for staff
  salt?: string; // for staff
  isActive: boolean;
  createdAt: number;
  createdBy: string;
  lastLogin?: number;
  mustChangePassword?: boolean;
}

export interface Notification {
  id: string;
  businessId: string;
  targetUserId: string; // 'all' or actual ID
  type: string;
  message: string;
  read: boolean;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetBusinessId: string; // 'all' or actual ID
  createdBy: string;
  createdAt: number;
}

export interface Feedback {
  id: string;
  message: string;
  createdAt: number;
}
