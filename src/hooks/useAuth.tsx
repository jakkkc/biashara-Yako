import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Auth, 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/error-handler';
import { UserProfile, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  impersonate: (businessId: string | null) => void;
  impersonatedId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAILS = ['jacmwaniki@gmail.com', 'nexinking01@gmail.com'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedId, setImpersonatedId] = useState<string | null>(localStorage.getItem('biashara_impersonated_id'));

  const impersonate = (id: string | null) => {
    if (id) {
      localStorage.setItem('biashara_impersonated_id', id);
    } else {
      localStorage.removeItem('biashara_impersonated_id');
    }
    setImpersonatedId(id);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch profile
        const path = `users/${user.uid}`;
        try {
          const profileDoc = await getDoc(doc(db, 'users', user.uid));
          if (profileDoc.exists()) {
            let data = profileDoc.data() as UserProfile;
            
            // If super admin and impersonating, override businessId
            if (SUPER_ADMIN_EMAILS.includes(user.email || '') && impersonatedId) {
              data = {
                ...data,
                businessId: impersonatedId,
                role: 'Owner' // Force owner role when impersonating
              };
            }
            setProfile(data);
          } else if (SUPER_ADMIN_EMAILS.includes(user.email || '')) {
            // Super Admin might not have a profile, create a dummy one if impersonating
            if (impersonatedId) {
              setProfile({
                id: user.uid,
                businessId: impersonatedId,
                role: 'Owner',
                displayName: user.displayName || 'Super Admin',
                email: user.email,
                createdAt: Date.now()
              });
            } else {
              setProfile({
                id: user.uid,
                businessId: '',
                role: 'SuperAdmin' as any,
                displayName: user.displayName || 'Platform Owner',
                email: user.email,
                createdAt: Date.now()
              });
            }
          } else {
            // New user, trigger registration check if owner
            setProfile(null);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [impersonatedId]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email || '');

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithGoogle, logout, isSuperAdmin, impersonate, impersonatedId }}>
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
