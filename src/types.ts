import { UserRole } from './context/AuthContext';

export interface Business {
  id: string;
  name: string;
  type: string;
  location: string;
  ownerUid: string;
  ownerEmail: string;
  logoUrl?: string;
  status: 'active' | 'suspended';
  currency: 'KES';
  vatEnabled: boolean;
  vatPercentage: number;
  receiptConfig: {
    logoUrl?: string;
    businessName: string;
    tagline: string;
    contactInfo: string;
    contactInfo2?: string;
    footerMessage: string;
  };
  subscriptionPlan: 'free' | 'basic' | 'premium';
  subscriptionExpiry: string;
  privileges: {
    canEditReceipts: boolean;
    canAddBranches: boolean;
    maxBranches: number;
    maxUsers: number;
  };
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  contactNumber: string;
  active: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  variants?: Array<{ name: string; price: number; stock: number }>;
  unitOfMeasure: 'Piece' | 'Kg' | 'Litre' | 'Pack' | 'Box' | 'Dozen' | 'Other';
  costPrice: number;
  sellingPrice: number;
  stock: number;
  reorderLevel: number;
  supplierName?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: InventoryItem;
  quantity: number;
  variantName?: string;
  unitPrice: number;
  discountAmount?: number; // per item custom discount
}

export interface Sale {
  id: string;
  branchId: string;
  items: Array<{
    itemId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    variantName?: string;
    discount?: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  vat: number;
  total: number;
  paymentMethod: 'Cash' | 'Mpesa' | 'BankTransfer' | 'Credit';
  mpesaRef?: string;
  customerId?: string;
  status: 'completed' | 'pending' | 'refunded';
  createdBy: string; // userId
  createdByName: string;
  createdAt: string;
  editedBy?: string;
  editReason?: string;
  editedAt?: string;
  deletedBy?: string;
  deleteReason?: string;
}

export interface Expense {
  id: string;
  branchId: string;
  category: 'Rent' | 'Utilities' | 'Salaries' | 'Supplies' | 'Transport' | 'Maintenance' | 'Miscellaneous' | string;
  amount: number;
  description: string;
  date: string;
  receiptPhotoUrl?: string;
  loggedBy: string;
  loggedByName: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  totalPurchases: number;
  visitCount: number;
  totalSpent: number;
  creditBalance: number;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phone?: string;
  categories?: string[];
  createdAt: string;
}

export interface StockTransfer {
  id: string;
  fromBranchId: string;
  toBranchId: string;
  items: Array<{
    itemId: string;
    name: string;
    quantity: number;
  }>;
  requestedBy: string;
  requestedByName: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Shift {
  id: string;
  branchId: string;
  openedBy: string; // staff display name
  openingFloat: number;
  closedBy?: string;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  status: 'open' | 'closed';
  openedAt: string;
  closedAt?: string;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  branchId: string;
  performedBy: string;
  performedByName: string;
  details: string; // JSON Stringified
  timestamp: string;
}

export interface UserNotification {
  id: string;
  businessId: string;
  targetUserId: string; // user UID or "all"
  type: 'LOW_STOCK' | 'LARGE_SALE' | 'STOCK_TRANSFER_REQUEST' | 'STOCK_TRANSFER_RESOLVED' | 'SUBSCRIPTION_EXPIRY' | 'ANNOUNCEMENT';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  targetBusinessId: string; // "all" or businessId
  createdBy: string;
  createdAt: string;
}

export interface Feedback {
  id: string;
  message: string;
  createdAt: string;
}
