import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { 
  doc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  getDocs 
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import toast from 'react-hot-toast';

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  role: 'super_admin' | 'business_owner' | 'manager' | 'salesperson';
  businessId: string | null;
  branchId: string | null;
  status: 'active' | 'suspended';
  createdAt: string;
  createdBy: string;
}

export interface BusinessDetails {
  id: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  phone: string;
  address: string;
  businessType: string;
  logo: string;
  status: 'active' | 'suspended';
  createdAt: string;
  createdBy: string;
  currency?: { code: string; name: string; symbol: string };
}

export interface BranchDetails {
  id: string;
  businessId: string;
  name: string;
  location: string;
  phone: string;
  managerId: string;
  status: 'active' | 'suspended';
  createdAt: string;
  createdBy: string;
}

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: UserProfile | null;
  business: BusinessDetails | null;
  branches: BranchDetails[];
  currentBranch: BranchDetails | null;
  loading: boolean;
  switchBranch: (branchId: string) => void;
  logout: () => Promise<void>;
  refreshProfile: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [business, setBusiness] = useState<BusinessDetails | null>(null);
  const [branches, setBranches] = useState<BranchDetails[]>([]);
  const [currentBranch, setCurrentBranch] = useState<BranchDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeUser: (() => void) | null = null;
    let unsubscribeBusiness: (() => void) | null = null;
    let unsubscribeBranches: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);

      // Reset states
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeBusiness) unsubscribeBusiness();
      if (unsubscribeBranches) unsubscribeBranches();
      
      setUser(null);
      setBusiness(null);
      setBranches([]);
      setCurrentBranch(null);

      if (!fUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Subscribe to User profile
        const userDocRef = doc(db, 'users', fUser.uid);
        unsubscribeUser = onSnapshot(userDocRef, (snapshot) => {
          if (!snapshot.exists()) {
            console.warn("User document doesn't exist yet.");
            setUser(null);
            setLoading(false);
            return;
          }

          const userData = snapshot.data();
          const profile: UserProfile = {
            uid: fUser.uid,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            businessId: userData.businessId,
            branchId: userData.branchId,
            status: userData.status,
            createdAt: userData.createdAt,
            createdBy: userData.createdBy
          };

          // Account suspension enforcement
          if (profile.status === 'suspended') {
            toast.error('Gusa salama! Your account has been suspended by the administrator.');
            firebaseSignOut(auth);
            setLoading(false);
            return;
          }

          setUser(profile);

          // Subscription to Business Details if applicable
          if (profile.businessId) {
            const bizDocRef = doc(db, 'businesses', profile.businessId);
            if (unsubscribeBusiness) unsubscribeBusiness();
            
            unsubscribeBusiness = onSnapshot(bizDocRef, (bizSnapshot) => {
              if (bizSnapshot.exists()) {
                const bizData = bizSnapshot.data();
                
                if (bizData.status === 'suspended') {
                  toast.error('The business account is suspended. Contact system admin.');
                  firebaseSignOut(auth);
                  setLoading(false);
                  return;
                }

                const biz: BusinessDetails = {
                  id: bizSnapshot.id,
                  name: bizData.name,
                  ownerId: bizData.ownerId,
                  ownerEmail: bizData.ownerEmail,
                  phone: bizData.phone,
                  address: bizData.address,
                  businessType: bizData.businessType,
                  logo: bizData.logo || '',
                  status: bizData.status,
                  createdAt: bizData.createdAt,
                  createdBy: bizData.createdBy,
                  currency: bizData.currency || { code: 'KES', name: 'Kenyan Shilling', symbol: 'KES' }
                };
                setBusiness(biz);

                // Load all branches for this business
                const branchRef = collection(db, 'branches');
                const qBranch = query(branchRef, where('businessId', '==', profile.businessId));
                
                if (unsubscribeBranches) unsubscribeBranches();
                
                unsubscribeBranches = onSnapshot(qBranch, (branchSnapshot) => {
                  const fetchedBranches: BranchDetails[] = [];
                  branchSnapshot.forEach((bDoc) => {
                    const b = bDoc.data();
                    fetchedBranches.push({
                      id: bDoc.id,
                      businessId: b.businessId,
                      name: b.name,
                      location: b.location,
                      phone: b.phone,
                      managerId: b.managerId,
                      status: b.status,
                      createdAt: b.createdAt,
                      createdBy: b.createdBy
                    });
                  });
                  setBranches(fetchedBranches);

                  // Setup current branch selecting logic
                  const activeBranches = fetchedBranches.filter(b => b.status === 'active');
                  if (profile.role === 'salesperson' || profile.role === 'manager') {
                    // Force assigned branch
                    const assigned = fetchedBranches.find(b => b.id === profile.branchId);
                    setCurrentBranch(assigned || null);
                  } else {
                    // Owner can switch, default to first active branch or any
                    const savedBranchId = localStorage.getItem(`current_branch_${profile.businessId}`);
                    const match = fetchedBranches.find(b => b.id === savedBranchId);
                    setCurrentBranch(match || activeBranches[0] || fetchedBranches[0] || null);
                  }
                  
                  setLoading(false);
                }, (err) => {
                  console.error('Error fetching branches in AuthContext:', err);
                  setLoading(false);
                });
              } else {
                setLoading(false);
              }
            }, (err) => {
              console.error('Error fetching business in AuthContext:', err);
              setLoading(false);
            });
          } else {
            // Super Admin or unassociated user
            setLoading(false);
          }
        }, (err) => {
          console.error('Error fetching user document in AuthContext:', err);
          setLoading(false);
        });
      } catch (err) {
        console.error('Error seeding Auth Context listeners:', err);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeBusiness) unsubscribeBusiness();
      if (unsubscribeBranches) unsubscribeBranches();
    };
  }, []);

  const switchBranch = (branchId: string) => {
    if (!user || !user.businessId) return;
    const match = branches.find(b => b.id === branchId);
    if (match) {
      setCurrentBranch(match);
      localStorage.setItem(`current_branch_${user.businessId}`, branchId);
      toast.success(`Switched branch to ${match.name}`);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const refreshProfile = () => {
    // Can trigger if needed
  };

  return (
    <AuthContext.Provider value={{
      firebaseUser,
      user,
      business,
      branches,
      currentBranch,
      loading,
      switchBranch,
      logout,
      refreshProfile
    }}>
      {children}
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
