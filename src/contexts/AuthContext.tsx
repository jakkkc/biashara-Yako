import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../firebase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  firebaseUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        // Real-time listener for user profile
        const userRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
        });
        
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const idToken = await user.getIdToken();

      // 1. Check for Super Admin promotion
      await fetch('/api/auth/promote-if-super-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      // 2. Check for pending invites
      await fetch('/api/auth/check-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken })
      });

      toast.success('Signed in successfully!');
    } catch (error: any) {
      console.error('Sign-in error:', error);
      toast.error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('Signed out successfully');
    } catch (error: any) {
      toast.error('Failed to sign out');
    }
  };

  const isAdmin = userProfile?.role === 'super_admin';
  const isOwner = userProfile?.role === 'business_owner';

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      userProfile,
      loading,
      signInWithGoogle,
      signOut,
      isAdmin,
      isOwner
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
