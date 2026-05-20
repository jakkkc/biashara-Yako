/**
 * Core types for Biashara Yako POS
 */

export type BusinessStatus = 'active' | 'suspended';
export type SubscriptionPlan = 'Free' | 'Basic' | 'Premium';
export type UserRole = 'SuperAdmin' | 'Owner' | 'BranchManager' | 'Salesperson' | 'Cashier' | 'StockController';
export type PaymentMethod = 'Cash' | 'M-Pesa' | 'Bank Transfer' | 'Credit';
export type SaleStatus = 'completed' | 'refunded';
export type TransferStatus = 'pending' | 'approved' | 'rejected';

export interface Business {
  id: string;
  name: string;
  type: string;
  logoUrl?: string;
  location: string;
  currency: string;
  vatEnabled: boolean;
  vatPercentage: number;
  ownerEmail: string;
  status: BusinessStatus;
  subscription: {
    plan: SubscriptionPlan;
    expiryDate: number; // timestamp
  };
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

export interface UserProfile {
  id: string; // Auth UID
  businessId: string;
  branchId?: string; // Optional for multi-branch owners
  role: UserRole;
  username?: string; // For employees
  displayName: string;
  email?: string; // For owners
  photoUrl?: string;
  lastLogin?: number;
  createdAt: number;
}

export interface Product {
  id: string;
  branchId: string;
  name: string;
  category: string;
  sku: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  reorderLevel: number;
  supplierName?: string;
  createdAt: number;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number; // amount
}

export interface Sale {
  id: string;
  businessId: string;
  branchId: string;
  userId: string;
  userName: string;
  customerId?: string;
  customerName?: string;
  items: SaleItem[];
  subtotal: number;
  vatAmount: number;
  discountTotal: number;
  total: number;
  paymentMethod: PaymentMethod;
  mpesaReference?: string;
  status: SaleStatus;
  createdAt: number;
}

export interface Expense {
  id: string;
  branchId: string;
  category: string;
  amount: number;
  description: string;
  receiptUrl?: string;
  loggedBy: string;
  loggedByName: string;
  createdAt: number;
}

export interface Customer {
  id: string;
  branchId: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  totalSpent: number;
  visitCount: number;
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
  status: TransferStatus;
  requestedBy: string;
  approvedBy?: string;
  createdAt: number;
}

export interface AuditLog {
  id: string;
  businessId: string;
  branchId?: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details: string;
  timestamp: number;
}

export interface Announcement {
  id: string;
  targetedBusinessTypes: string[];
  message: string;
  createdAt: number;
}
