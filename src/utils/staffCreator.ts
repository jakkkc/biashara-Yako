import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { generateSalt, hashPassword } from './crypto';
import { logAudit } from './auditLogger';

const firebaseConfig = {
  projectId: "gen-lang-client-0892408704",
  appId: "1:903894029557:web:7c94a68971ddf999bc21bc",
  apiKey: "AIzaSyCQqEAbOc95uoRzeFjHkKTmxQonlzuqAVg",
  authDomain: "gen-lang-client-0892408704.firebaseapp.com",
  storageBucket: "gen-lang-client-0892408704.firebasestorage.app",
  messagingSenderId: "903894029557"
};

export async function createStaffMember(
  displayName: string,
  username: string,
  pass: string,
  role: string,
  branchId: string,
  businessId: string,
  creatorUid: string,
  creatorName: string
) {
  const normalizedUsername = username.toLowerCase().trim();
  const email = `${normalizedUsername}@biashara.com`;

  // Create unique app name for secondary context to prevent duplicates
  const appName = `BiasharaSecondary_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const secondaryApp = initializeApp(firebaseConfig, appName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const userCred = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const uid = userCred.user.uid;

    await updateProfile(userCred.user, { displayName });

    const salt = await generateSalt();
    const hash = await hashPassword(pass, salt);

    await setDoc(doc(db, 'users', uid), {
      businessId,
      branchId,
      role,
      displayName,
      username: normalizedUsername,
      passwordHash: hash,
      passwordSalt: salt,
      isActive: true,
      createdBy: creatorUid,
      createdAt: new Date().toISOString()
    });

    await logAudit(
      businessId,
      'USER_ADDED',
      'users',
      uid,
      branchId,
      creatorUid,
      creatorName,
      { displayName, username: normalizedUsername, role, branchId }
    );

    return uid;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (err) {
      console.warn('Error cleanup secondary app:', err);
    }
  }
}
export async function resetStaffPassword(
  staffUid: string,
  newPass: string,
  businessId: string,
  branchId: string,
  creatorUid: string,
  creatorName: string,
  staffDisplayName: string
) {
  // Hash the new password and update the user doc properties.
  // Note: Firebase Auth client SDK doesn't allow changing another user's password directly without Admin SDK,
  // but updating the local passwordHash/passwordSalt is fully tracked and allows validation in custom scenarios if needed,
  // we can also update their Auth credentials if we sign them in temporarily or explain the restriction.
  // For standard user updates on this system, we'll assign the hashed credentials to the local document store to be read by the system,
  // and log.
  const salt = await generateSalt();
  const hash = await hashPassword(newPass, salt);

  const userDocRef = doc(db, 'users', staffUid);
  await setDoc(userDocRef, {
    passwordHash: hash,
    passwordSalt: salt
  }, { merge: true });

  await logAudit(
    businessId,
    'PASSWORD_CHANGED',
    'users',
    staffUid,
    branchId || 'global',
    creatorUid,
    creatorName,
    { targetUser: staffDisplayName }
  );
}
