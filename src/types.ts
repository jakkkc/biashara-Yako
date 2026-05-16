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
  createdAt: string;
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
  currency: string;
  status: 'active' | 'suspended';
  createdAt: string;
  createdBy: string;
}

export interface Branch {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  address: string;
  createdAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  category: string;
  sku?: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string;
  image?: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  businessId: string;
  branchId: string;
  userId: string;
  items: SaleItem[];
  total: number;
  discount: number;
  tax: number;
  paymentMethod: string;
  status: 'completed' | 'voided';
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Expense {
  id: string;
  businessId: string;
  branchId: string;
  category: string;
  amount: number;
  description: string;
  userId: string;
  createdAt: string;
}

export interface StockMovement {
  id: string;
  businessId: string;
  productId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  userId: string;
  createdAt: string;
}
