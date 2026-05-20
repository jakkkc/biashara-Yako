import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword
} from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler';

export type UserRole = 'Owner' | 'BranchManager' | 'Salesperson' | 'Cashier' | 'StockController' | 'SuperAdmin';

export interface UserProfile {
  businessId: string;
  branchId: string;
  role: UserRole;
  displayName: string;
  username?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface BusinessConfig {
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
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  business: BusinessConfig | null;
  loading: boolean;
  isSuperAdmin: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithStaff: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.email === 'jacmwaniki@gmail.com';

  const refreshProfile = async () => {
    if (!auth.currentUser) {
      setProfile(null);
      setBusiness(null);
      return;
    }
    const uid = auth.currentUser.uid;
    try {
      const pDocObj = await getDoc(doc(db, 'users', uid));
      if (pDocObj.exists()) {
        const pData = pDocObj.data() as UserProfile;
        setProfile(pData);

        // Update last login timestamp in the background
        const todayStr = new Date().toISOString();
        await updateDoc(doc(db, 'users', uid), { lastLogin: todayStr });

        if (pData.businessId) {
          const bDocObj = await getDoc(doc(db, 'businesses', pData.businessId));
          if (bDocObj.exists()) {
            setBusiness({ id: bDocObj.id, ...bDocObj.data() } as BusinessConfig);
          } else {
            setBusiness(null);
          }
        } else {
          setBusiness(null);
        }
      } else {
        setProfile(null);
        setBusiness(null);
      }
    } catch (err) {
      console.warn('Could not read user profile from Firestore:', err);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Quick check for super admin
        if (firebaseUser.email === 'jacmwaniki@gmail.com') {
          // Initialize superadmin fallback profile if not exists
          try {
            const adminDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (!adminDoc.exists()) {
              // Super admin profile is virtual
              setProfile({
                businessId: 'admin_tenant',
                branchId: 'admin_branch',
                role: 'SuperAdmin',
                displayName: firebaseUser.displayName || 'Jackson Mwaniki',
                email: firebaseUser.email,
                isActive: true,
                createdAt: new Date().toISOString()
              });
              setLoading(false);
              return;
            }
          } catch(e) {
            console.warn(e);
          }
        }
        await refreshProfile();
      } else {
        setProfile(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error('Google registration failed:', err);
      throw err;
    }
  };

  const loginWithStaff = async (username: string, pass: string) => {
    // Check local failed attempts block
    const blockKey = `fb_block_${username}`;
    const attemptsKey = `fb_attempts_${username}`;
    const blockedUntilStr = localStorage.getItem(blockKey);

    if (blockedUntilStr) {
      const blockedUntil = new Date(blockedUntilStr).getTime();
      const now = new Date().getTime();
      if (now < blockedUntil) {
        const remainingMin = Math.ceil((blockedUntil - now) / 60000);
        throw new Error(`Account blocked. Please try again in ${remainingMin} minutes.`);
      } else {
        localStorage.removeItem(blockKey);
        localStorage.removeItem(attemptsKey);
      }
    }

    const email = `${username.toLowerCase().trim()}@biashara.com`;
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      // Clear attempt logs
      localStorage.removeItem(blockKey);
      localStorage.removeItem(attemptsKey);
    } catch (err: any) {
      // Handle failed attempts increment
      let attempts = parseInt(localStorage.getItem(attemptsKey) || '0', 10);
      attempts += 1;
      localStorage.setItem(attemptsKey, String(attempts));

      if (attempts >= 5) {
        const blockTime = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString();
        localStorage.setItem(blockKey, blockTime);
        throw new Error('Too many failed login attempts! Your account has been locked for 15 minutes.');
      } else {
        throw new Error(`Verify your credentials. ${5 - attempts} attempts left before lockout.`);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      business,
      loading,
      isSuperAdmin,
      loginWithGoogle,
      loginWithStaff,
      logout,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
