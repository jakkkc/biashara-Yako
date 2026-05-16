import { useState } from 'react';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  writeBatch, 
  getDoc,
  increment,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';
import firebaseConfig from '../../firebase-applet-config.json';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { generateSaleReference } from '../utils/formatters';

// Initialize a separate invisible quiet instance to prevent auth hijacking
const quietApp = initializeApp(firebaseConfig, 'SaaSQuietUserCreator');
const quietAuth = getAuth(quietApp);

export function useFirestore() {
  const { user, currentBranch } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Product operations
   */
  const addProduct = async (product: {
    name: string;
    sku: string;
    category: string;
    buyingPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
    lowStockAlert: number;
  }) => {
    if (!user || !user.businessId || !currentBranch) {
      toast.error('No business or branch associated with your account.');
      return;
    }
    setLoading(true);
    const path = 'products';
    try {
      const pDoc = {
        ...product,
        businessId: user.businessId,
        branchId: currentBranch.id,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };
      const res = await addDoc(collection(db, path), pDoc);
      toast.success('Bidhaa imeongezwa! Product added successfully.');
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (productId: string, updates: Partial<{
    name: string;
    sku: string;
    category: string;
    buyingPrice: number;
    sellingPrice: number;
    quantity: number;
    unit: string;
    lowStockAlert: number;
    status: 'active' | 'inactive';
  }>) => {
    setLoading(true);
    const path = `products/${productId}`;
    try {
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, updates);
      toast.success('Bidhaa imesasishwa! Product updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const restockProduct = async (productId: string, additionalQty: number, currentQty: number, note: string) => {
    if (!user || !user.businessId || !currentBranch) return;
    setLoading(true);
    const batch = writeBatch(db);
    try {
      const prodRef = doc(db, 'products', productId);
      batch.update(prodRef, {
        quantity: increment(additionalQty)
      });

      const movementRef = doc(collection(db, 'stock_movements'));
      batch.set(movementRef, {
        businessId: user.businessId,
        branchId: currentBranch.id,
        productId,
        productName: note.split(' - ')[0] || 'Unknown Product',
        type: 'restock',
        quantityBefore: currentQty,
        quantityChanged: additionalQty,
        quantityAfter: currentQty + additionalQty,
        note: note || 'Manual restock',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      });

      await batch.commit();
      toast.success('Stoki imefanikiwa kuongezwa! Restocked successfully.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch/restock');
    } finally {
      setLoading(false);
    }
  };

  const deleteProductDoc = async (productId: string) => {
    setLoading(true);
    const path = `products/${productId}`;
    try {
      await deleteDoc(doc(db, 'products', productId));
      toast.success('Bidhaa imefutwa! Product deleted.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Record Sales atomically using write batches - CRITICAL RULE 4
   */
  const checkoutSale = async (sale: {
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    discount: number;
    tax: number;
    total: number;
    paymentMethod: 'cash' | 'mpesa' | 'card' | 'credit';
    customerName: string;
    customerPhone: string;
    notes: string;
  }) => {
    if (!user || !user.businessId || !currentBranch) {
      toast.error('Session expired. Active branch context required.');
      return;
    }
    setLoading(true);
    const batch = writeBatch(db);
    const newSaleRef = doc(collection(db, 'sales'));
    const saleId = newSaleRef.id;

    try {
      // 1. Log sales details
      const fullSaleDoc = {
        ...sale,
        businessId: user.businessId,
        branchId: currentBranch.id,
        salespersonId: user.uid,
        salespersonName: user.name,
        status: 'completed',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: user.name,
        referenceNumber: generateSaleReference()
      };
      
      batch.set(newSaleRef, fullSaleDoc);

      // 2. Loop products to verify stock & stage batch update
      for (const item of sale.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnapshot = await getDoc(prodRef);
        if (!prodSnapshot.exists()) {
          throw new Error(`Product ${item.productName} not found in inventory.`);
        }
        
        const currentQty = prodSnapshot.data().quantity || 0;
        const newQty = Math.max(0, currentQty - item.quantity);

        // Update product stock balance
        batch.update(prodRef, {
          quantity: newQty
        });

        // Add to stock movement log
        const moveRef = doc(collection(db, 'stock_movements'));
        batch.set(moveRef, {
          businessId: user.businessId,
          branchId: currentBranch.id,
          productId: item.productId,
          productName: item.productName,
          type: 'sale',
          quantityBefore: currentQty,
          quantityChanged: -item.quantity,
          quantityAfter: newQty,
          note: `Sold via sale ${fullSaleDoc.referenceNumber}`,
          createdAt: new Date().toISOString(),
          createdBy: user.name
        });
      }

      await batch.commit();
      toast.success('Malipo yamekamilika! Sale completed.');
      return fullSaleDoc;
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Error executing checkout transaction.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Action: Void a sale
   */
  const voidSale = async (saleId: string) => {
    if (!user) return;
    setLoading(true);
    const batch = writeBatch(db);
    try {
      const saleRef = doc(db, 'sales', saleId);
      const saleSnapshot = await getDoc(saleRef);
      if (!saleSnapshot.exists()) return;
      
      const saleData = saleSnapshot.data();
      if (saleData.status === 'voided') {
        toast.error('Sale is already voided.');
        return;
      }

      // Restore stocks
      for (const item of saleData.items) {
        const prodRef = doc(db, 'products', item.productId);
        const prodSnap = await getDoc(prodRef);
        const currentQty = prodSnap.exists() ? prodSnap.data().quantity : 0;
        const newQty = currentQty + item.quantity;

        batch.update(prodRef, {
          quantity: newQty
        });

        const movementRef = doc(collection(db, 'stock_movements'));
        batch.set(movementRef, {
          businessId: saleData.businessId,
          branchId: saleData.branchId,
          productId: item.productId,
          productName: item.productName,
          type: 'adjustment',
          quantityBefore: currentQty,
          quantityChanged: item.quantity,
          quantityAfter: newQty,
          note: `Stocks restored from voided sale ${saleData.referenceNumber}`,
          createdAt: new Date().toISOString(),
          createdBy: user.name
        });
      }

      batch.update(saleRef, {
        status: 'voided',
        updatedAt: new Date().toISOString()
      });

      await batch.commit();
      toast.success('Mauzo yamefutwa! Sale voided and stock restored.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `sales/${saleId}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Expense operations
   */
  const addExpense = async (expense: {
    category: 'rent' | 'utilities' | 'salaries' | 'supplies' | 'other';
    description: string;
    amount: number;
    date: string;
    receiptUrl: string;
  }) => {
    if (!user || !user.businessId || !currentBranch) return;
    setLoading(true);
    const path = 'expenses';
    try {
      const docData = {
        ...expense,
        businessId: user.businessId,
        branchId: currentBranch.id,
        status: user.role === 'salesperson' ? 'pending' : 'approved',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };
      const res = await addDoc(collection(db, 'expenses'), docData);
      toast.success('Matumizi yamerekodiwa! Expense recorded.');
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const updateExpenseStatus = async (expenseId: string, status: 'approved' | 'pending') => {
    setLoading(true);
    const path = `expenses/${expenseId}`;
    try {
      await updateDoc(doc(db, 'expenses', expenseId), { status });
      toast.success(`Expense status set to ${status}.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Team/User operations (incorporates Quiet Auth Creator)
   */
  const inviteUser = async (member: {
    name: string;
    email: string;
    role: 'manager' | 'salesperson';
    branchId: string;
  }, pass: string) => {
    if (!user || !user.businessId) return;
    setLoading(true);
    try {
      // 1. Create Auth credential quietly
      const userCred = await createUserWithEmailAndPassword(quietAuth, member.email, pass);
      const guestUid = userCred.user.uid;
      
      // Ensure we immediately sign them out of the secondary quiet scope!
      await signOut(quietAuth);

      // 2. Put user record into main Firestore base database
      const profile = {
        email: member.email,
        name: member.name,
        role: member.role,
        businessId: user.businessId,
        branchId: member.branchId,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };

      await setDoc(doc(db, 'users', guestUid), profile);
      toast.success('Mwanachama mpya Amesajiliwa! Team member registered.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error occurred registering user credentials.');
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = async (targetUid: string, updates: Partial<{
    name: string;
    role: 'manager' | 'salesperson';
    branchId: string;
    status: 'active' | 'suspended';
  }>) => {
    setLoading(true);
    const path = `users/${targetUid}`;
    try {
      await updateDoc(doc(db, 'users', targetUid), updates);
      toast.success('Wafanyakazi wamesasishwa! Team member updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Branches operations
   */
  const addBranchDoc = async (branchData: {
    name: string;
    location: string;
    phone: string;
    managerId: string;
  }) => {
    if (!user || !user.businessId) return;
    setLoading(true);
    const path = 'branches';
    try {
      const bDoc = {
        ...branchData,
        businessId: user.businessId,
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: user.name
      };
      const res = await addDoc(collection(db, 'branches'), bDoc);
      toast.success('Tawi jipya limefunguliwa! Branch added.');
      return res;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    } finally {
      setLoading(false);
    }
  };

  const updateBranchDoc = async (branchId: string, updates: Partial<{
    name: string;
    location: string;
    phone: string;
    managerId: string;
    status: 'active' | 'suspended';
  }>) => {
    setLoading(true);
    const path = `branches/${branchId}`;
    try {
      await updateDoc(doc(db, 'branches', branchId), updates);
      toast.success('Tawi limesasishwa! Branch updated.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateBusinessProfile = async (updates: Partial<{
    name: string;
    taxRate: number;
    currency: { code: string; name: string; symbol: string };
    backupEmail: string;
    address: string;
    updatedAt: string;
  }>) => {
    if (!user || !user.businessId) return false;
    setLoading(true);
    const path = `businesses/${user.businessId}`;
    try {
      await updateDoc(doc(db, 'businesses', user.businessId), updates);
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    addProduct,
    updateProduct,
    restockProduct,
    deleteProductDoc,
    checkoutSale,
    voidSale,
    addExpense,
    updateExpenseStatus,
    inviteUser,
    updateUserProfile,
    addBranchDoc,
    updateBranchDoc,
    updateBusinessProfile
  };
}
