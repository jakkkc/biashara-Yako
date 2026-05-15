import { Timestamp } from 'firebase/firestore';

export type UserRole = 'super_admin' | 'business_owner' | 'manager' | 'salesperson';
export type UserStatus = 'active' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  businessId: string | null;
  branchId: string | null;
  status: UserStatus;
  createdAt: Timestamp;
  createdBy: string;
}

export interface Business {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  phone: string;
  address: string;
  businessType: string;
  logo?: string;
  status: 'active' | 'suspended';
  createdAt: Timestamp;
  createdBy: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  location: string;
  phone: string;
  managerId: string | null;
  status: 'active' | 'suspended';
  createdAt: Timestamp;
  createdBy: string;
}

export interface Product {
  id: string;
  businessId: string;
  branchId: string;
  name: string;
  sku: string;
  category: string;
  buyingPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  lowStockAlert: number;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  createdBy: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  businessId: string;
  branchId: string;
  salespersonId: string;
  salespersonName: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit';
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status: 'completed' | 'voided';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  category: 'rent' | 'utilities' | 'salaries' | 'supplies' | 'other';
  description: string;
  amount: number;
  date: Timestamp;
  receiptUrl?: string;
  status: 'approved' | 'pending';
  createdAt: Timestamp;
  createdBy: string;
}

export interface StockMovement {
  id: string;
  businessId: string;
  branchId: string;
  productId: string;
  productName: string;
  type: 'restock' | 'sale' | 'adjustment' | 'loss';
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  note: string;
  createdAt: Timestamp;
  createdBy: string;
}
