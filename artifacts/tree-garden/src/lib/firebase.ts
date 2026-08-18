import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: 'kuku-543c6.firebaseapp.com',
  projectId: 'kuku-543c6',
  databaseURL:
    'https://kuku-543c6-default-rtdb.asia-southeast1.firebasedatabase.app/',
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getDatabase(app);
export const auth = getAuth(app);
