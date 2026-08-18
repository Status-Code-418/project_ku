import { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../lib/firebase';

interface HomeData {
  name?: string;
  [key: string]: unknown;
}

export function useFirebaseHome() {
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const homeRef = ref(db, 'home');

    const unsubscribe = onValue(
      homeRef,
      (snapshot) => {
        setData(snapshot.val() ?? null);
        setLoading(false);
      },
      (error) => {
        console.error('[Firebase] home 읽기 실패:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { data, loading };
}
