import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc,
  writeBatch,
  serverTimestamp,
  orderBy,
  limit,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';

enum OperationType {
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
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const useCollection = <T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const q = query(collection(db, collectionName), ...constraints);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as T[];
      setData(items);
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.LIST, collectionName);
    });

    return () => unsubscribe();
  }, [collectionName, JSON.stringify(constraints)]);

  return { data, loading, error };
};

export const useDocument = <T = DocumentData>(collectionName: string, documentId: string | null) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    const docRef = doc(db, collectionName, documentId);
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setData({ id: snap.id, ...snap.data() } as T);
      } else {
        setData(null);
      }
      setLoading(false);
    }, (err) => {
      setError(err);
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, `${collectionName}/${documentId}`);
    });

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
};

export const useFirestore = () => {
  const addDocument = async (collectionName: string, data: any) => {
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, collectionName);
    }
  };

  const updateDocument = async (collectionName: string, docId: string, data: any) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${collectionName}/${docId}`);
    }
  };

  const deleteDocument = async (collectionName: string, docId: string) => {
    try {
      const docRef = doc(db, collectionName, docId);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${docId}`);
    }
  };

  const runBatch = async (callback: (batch: any) => Promise<void>) => {
    const batch = writeBatch(db);
    try {
      await callback(batch);
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'batch-operation');
    }
  };

  return {
    addDocument,
    updateDocument,
    deleteDocument,
    runBatch,
  };
};
