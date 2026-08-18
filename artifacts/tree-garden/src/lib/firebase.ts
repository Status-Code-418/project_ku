import { initializeApp, getApps } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const app =
  getApps().length === 0
    ? initializeApp({
        databaseURL:
          'https://kuku-543c6-default-rtdb.asia-southeast1.firebasedatabase.app/',
      })
    : getApps()[0];

export const db = getDatabase(app);
