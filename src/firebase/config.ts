import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  projectId: "gen-lang-client-0892408704",
  appId: "1:903894029557:web:7c94a68971ddf999bc21bc",
  apiKey: "AIzaSyCQqEAbOc95uoRzeFjHkKTmxQonlzuqAVg",
  authDomain: "gen-lang-client-0892408704.firebaseapp.com",
  storageBucket: "gen-lang-client-0892408704.firebasestorage.app",
  messagingSenderId: "903894029557"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app, "ai-studio-087e2918-5134-41e3-bfa7-6f538cfb3b03");
export const auth = getAuth(app);
export const storage = getStorage(app);

// Enable Firestore offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.warn("Firestore offline persistence failed: ", err);
});
