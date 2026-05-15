import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot,
  Timestamp,
  serverTimestamp,
  runTransaction
} from "firebase/firestore";
import { db, auth } from "./firebase";

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const firestore = {
  // Generic CRUD
  async getOne<T>(collectionName: string, id: string): Promise<T | null> {
    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as T;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `${collectionName}/${id}`);
      return null;
    }
  },

  async getAll<T>(collectionName: string, queries: any[] = []): Promise<T[]> {
    try {
      const collRef = collection(db, collectionName);
      const q = query(collRef, ...queries);
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, collectionName);
      return [];
    }
  },

  async create<T>(collectionName: string, data: any): Promise<string> {
    try {
      const collRef = collection(db, collectionName);
      const docRef = await addDoc(collRef, {
        ...data,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, collectionName);
      throw error;
    }
  },

  async update(collectionName: string, id: string, data: any): Promise<void> {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
      throw error;
    }
  },

  // POS specific: Atomic Sale
  async createSale(saleData: any) {
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Check stock for all items
        for (const item of saleData.items) {
          const productRef = doc(db, "products", item.productId);
          const productDoc = await transaction.get(productRef);
          if (!productDoc.exists()) throw new Error(`Product ${item.productId} not found`);
          
          const currentQty = productDoc.data().quantity;
          if (currentQty < item.quantity) {
            throw new Error(`Insufficient stock for ${productDoc.data().name}`);
          }

          // 2. Deduct stock
          transaction.update(productRef, {
            quantity: currentQty - item.quantity,
            updatedAt: serverTimestamp()
          });

          // 3. Log stock movement
          const movementRef = doc(collection(db, "stock_movements"));
          transaction.set(movementRef, {
            businessId: saleData.businessId,
            branchId: saleData.branchId,
            productId: item.productId,
            productName: item.productName,
            type: 'sale',
            quantityBefore: currentQty,
            quantityChanged: -item.quantity,
            quantityAfter: currentQty - item.quantity,
            createdAt: serverTimestamp(),
            createdBy: auth.currentUser?.uid
          });
        }

        // 4. Create Sale record
        const saleRef = doc(collection(db, "sales"));
        transaction.set(saleRef, {
          ...saleData,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          createdBy: auth.currentUser?.uid
        });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "transaction/sale");
      throw error;
    }
  }
};
