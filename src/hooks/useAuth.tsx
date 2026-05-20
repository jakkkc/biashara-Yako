import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  Auth, 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, query, collection, where, getDocs, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { verifyPassword } from '../utils/hashPassword';

interface AuthContextType {
  user: User | null; // Google user
  profile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithStaff: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isSuperAdmin: boolean;
  impersonate: (businessId: string | null) => void;
  impersonatedId: string | null;
  switchBranch: (branchId: string) => Promise<void>;
  isStaffSession: boolean;
  isLocked: boolean;
  unlock: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SUPER_ADMIN_EMAILS = ['jacmwaniki@gmail.com', 'nexinking01@gmail.com'];
const STAFF_RECOVERY_KEY = 'biashara_staff_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaffSession, setIsStaffSession] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [impersonatedId, setImpersonatedId] = useState<string | null>(localStorage.getItem('biashara_impersonated_id'));

  const unlock = () => setIsLocked(false);

  // Idle detection for PIN lock
  useEffect(() => {
    let idleTimer: any;
    const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

    const resetTimer = () => {
      clearTimeout(idleTimer);
      if (!isLocked) {
        idleTimer = setTimeout(() => {
          if (profile && isStaffSession) {
            setIsLocked(true);
          }
        }, IDLE_TIMEOUT);
      }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => document.removeEventListener(event, resetTimer));
      clearTimeout(idleTimer);
    };
  }, [profile, isStaffSession, isLocked]);

  const impersonate = (id: string | null) => {
    if (id) {
      localStorage.setItem('biashara_impersonated_id', id);
    } else {
      localStorage.removeItem('biashara_impersonated_id');
    }
    setImpersonatedId(id);
  };

  // Try to recover staff session on mount
  useEffect(() => {
    const recoverStaffSession = async () => {
      const saved = localStorage.getItem(STAFF_RECOVERY_KEY);
      if (saved) {
        try {
          const { userId } = JSON.parse(saved);
          const docRef = doc(db, 'users', userId);
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data().isActive) {
            setProfile(snap.data() as UserProfile);
            setIsStaffSession(true);
          } else {
            localStorage.removeItem(STAFF_RECOVERY_KEY);
          }
        } catch (e) {
          localStorage.removeItem(STAFF_RECOVERY_KEY);
        }
      }
      if (!auth.currentUser) {
         setLoading(false);
      }
    };
    recoverStaffSession();
  }, []);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (isStaffSession) return; // Don't override staff session if one exists

      setUser(fbUser);
      
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (fbUser) {
        setLoading(true);
        unsubscribeProfile = onSnapshot(doc(db, 'users', fbUser.uid), (profileDoc) => {
          if (profileDoc.exists()) {
            let data = profileDoc.data() as UserProfile;
            
            if (SUPER_ADMIN_EMAILS.includes(fbUser.email || '') && impersonatedId) {
              data = {
                ...data,
                businessId: impersonatedId,
                role: 'Owner'
              };
            }
            setProfile(data);
          } else if (SUPER_ADMIN_EMAILS.includes(fbUser.email || '')) {
            setProfile({
              id: fbUser.uid,
              businessId: impersonatedId || '',
              role: (impersonatedId ? 'Owner' : 'SuperAdmin') as any,
              displayName: fbUser.displayName || (impersonatedId ? 'Super Admin' : 'Platform Owner'),
              email: fbUser.email,
              isActive: true,
              createdAt: Date.now(),
              createdBy: 'system'
            });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error('Snapshot error:', error);
          setLoading(false);
        });
      } else {
        if (!isStaffSession) {
          setProfile(null);
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, [impersonatedId, isStaffSession]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setIsStaffSession(false);
      localStorage.removeItem(STAFF_RECOVERY_KEY);
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const signInWithStaff = async (username: string, pass: string) => {
    try {
      const q = query(collection(db, 'users'), where('username', '==', username), where('isActive', '==', true));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw new Error('Identity not found or personnel deactivated.');
      }

      const userData = querySnapshot.docs[0].data() as UserProfile;
      const userId = querySnapshot.docs[0].id;

      if (!userData.passwordHash || !userData.salt) {
        throw new Error('Access credentials not initialized for this profile.');
      }

      const isValid = await verifyPassword(pass, userData.salt, userData.passwordHash);
      if (!isValid) {
        throw new Error('Access cipher incorrect.');
      }

      // Update last login
      await setDoc(doc(db, 'users', userId), { lastLogin: Date.now() }, { merge: true });

      const finalProfile = { ...userData, id: userId };
      setProfile(finalProfile);
      setIsStaffSession(true);
      setUser(null); // Explicitly clear Google user
      localStorage.setItem(STAFF_RECOVERY_KEY, JSON.stringify({ userId }));
      
    } catch (error: any) {
       console.error('Staff sign-in error:', error);
       throw error;
    }
  };

  const logout = async () => {
    try {
      if (isStaffSession) {
        localStorage.removeItem(STAFF_RECOVERY_KEY);
        setIsStaffSession(false);
        setProfile(null);
      } else {
        await signOut(auth);
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const switchBranch = async (branchId: string) => {
    if (!profile?.id) return;
    try {
      await setDoc(doc(db, 'users', profile.id), { branchId }, { merge: true });
      setProfile({ ...profile, branchId });
    } catch (error) {
       console.error('Switch branch error:', error);
       throw error;
    }
  };

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(user?.email || '');

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      signInWithGoogle, 
      signInWithStaff, 
      logout, 
      isSuperAdmin, 
      impersonate, 
      impersonatedId, 
      switchBranch,
      isStaffSession,
      isLocked,
      unlock
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
