import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with the specific database ID from config
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache()
}, (firebaseConfig as any).firestoreDatabaseId || '(default)');

export const auth = getAuth(app);
