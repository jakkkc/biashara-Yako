import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  setDoc, 
  doc 
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export async function seedSuperAdmin() {
  const adminEmail = 'jacmwaniki@gmail.com';
  const adminPassword = '2011373126.Ab';

  try {
    // 1. Query Firestore users collection for this email to check if document exists
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', adminEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log('Seeding super admin...');
      let uid = '';

      try {
        // Try creating Auth account
        const userCred = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        uid = userCred.user.uid;
        console.log('Auth account created successfully.');
      } catch (authError: any) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log('Auth account already exists. Verifying via sign-in...');
          // Attempt silent sign-in to get uid
          try {
            const userCred = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
            uid = userCred.user.uid;
            // Sign out to not hijack the user's session
            await signOut(auth);
          } catch (signInErr) {
            console.error('Failed silent sign-in to retrieve admin UID:', signInErr);
          }
        } else {
          console.error('Error creating super admin auth account:', authError);
        }
      }

      if (uid) {
        // Write the Firestore document exactly as required
        const adminDoc = {
          email: adminEmail,
          name: 'Super Admin',
          role: 'super_admin',
          businessId: null,
          branchId: null,
          status: 'active',
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        };

        await setDoc(doc(db, 'users', uid), adminDoc);
        console.log('Super admin Firestore document seeded successfully.');
      }
    } else {
      console.log('Super admin document already exists in Firestore.');
    }
  } catch (err) {
    // Fail silently in production, log in dev
    console.error('Error in super admin seed process:', err);
  }
}
