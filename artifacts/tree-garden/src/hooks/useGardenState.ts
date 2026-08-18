import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, get, set, update } from 'firebase/database';
import { db } from '../lib/firebase';
import { WeatherType } from '../lib/weatherService';

// ─── types ───────────────────────────────────────────────
export type GrowthStage = 0 | 1 | 2 | 3 | 4;

export interface GardenState {
  growthStage: GrowthStage;
  growthXP: number;
  waterLevel: number;
  fertilizerActive: boolean;
  fertilizerLastUsed: number;
  waterLastUsed: number;
  weather: WeatherType;
  lastSaved: number;
}

const DEFAULT_STATE: GardenState = {
  growthStage: 0,
  growthXP: 0,
  waterLevel: 50,
  fertilizerActive: false,
  fertilizerLastUsed: 0,
  waterLastUsed: 0,
  weather: 'sunny',
  lastSaved: Date.now(),
};

const LOCAL_KEY = 'tree-garden-state';

// ─── 공통 수분 감소 / 비료 만료 계산 ───────────────────
function applyPassiveEffects(data: GardenState): GardenState {
  const hoursPassed = (Date.now() - data.lastSaved) / (1000 * 60 * 60);
  const result = { ...data };
  result.waterLevel = Math.max(0, data.waterLevel - Math.floor(hoursPassed * 5));
  if (data.fertilizerActive) {
    const fertHours = (Date.now() - data.fertilizerLastUsed) / (1000 * 60 * 60);
    if (fertHours >= 24) result.fertilizerActive = false;
  }
  result.lastSaved = Date.now();
  return result;
}

// ─── hook ────────────────────────────────────────────────
// uid가 있으면 Firebase, 없으면 localStorage 사용
export function useGardenState(uid?: string | null) {
  const [state, setState] = useState<GardenState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isFirebase = Boolean(uid);

  // ── 초기 로드 ─────────────────────────────────────────
  useEffect(() => {
    setReady(false);

    if (isFirebase && uid) {
      // Firebase 로드
      get(ref(db, `Users/${uid}/garden`)).then((snap) => {
        if (snap.exists()) {
          const loaded = applyPassiveEffects(snap.val() as GardenState);
          setState(loaded);
          update(ref(db, `Users/${uid}/garden`), {
            waterLevel: loaded.waterLevel,
            fertilizerActive: loaded.fertilizerActive,
            lastSaved: loaded.lastSaved,
          });
        } else {
          const initial = { ...DEFAULT_STATE, lastSaved: Date.now() };
          set(ref(db, `Users/${uid}/garden`), initial);
          setState(initial);
        }
        setReady(true);
      });
    } else {
      // localStorage 로드 (비로그인 게스트)
      try {
        const stored = localStorage.getItem(LOCAL_KEY);
        if (stored) {
          const parsed = applyPassiveEffects(JSON.parse(stored) as GardenState);
          localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed));
          setState(parsed);
        }
      } catch {
        /* ignore */
      }
      setReady(true);
    }
  }, [uid, isFirebase]);

  // ── 저장 헬퍼 ────────────────────────────────────────
  const persist = useCallback(
    (partial: Partial<GardenState>) => {
      if (isFirebase && uid) {
        update(ref(db, `Users/${uid}/garden`), { ...partial, lastSaved: Date.now() });
      } else {
        // localStorage: setState 콜백에서 최신 상태를 받아 저장
        setState((prev) => {
          const next = { ...prev, ...partial, lastSaved: Date.now() };
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
          return next;
        });
      }
    },
    [uid, isFirebase],
  );

  const saveState = useCallback(
    (partial: Partial<GardenState>) => {
      if (isFirebase) {
        setState((prev) => ({ ...prev, ...partial, lastSaved: Date.now() }));
        persist(partial);
      } else {
        persist(partial); // localStorage 경로에서 setState 처리
      }
    },
    [isFirebase, persist],
  );

  // ── 수분 자동 감소 ────────────────────────────────────
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.waterLevel <= 0) return prev;
        const next = { ...prev, waterLevel: prev.waterLevel - 1, lastSaved: Date.now() };
        if (isFirebase && uid) {
          update(ref(db, `Users/${uid}/garden`), { waterLevel: next.waterLevel, lastSaved: next.lastSaved });
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        }
        return next;
      });
    }, 12 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, uid, isFirebase]);

  // ── 물주기 ────────────────────────────────────────────
  const waterTree = useCallback(() => {
    const now = Date.now();
    const s = stateRef.current;
    const canWater = s.waterLastUsed === 0 || now - s.waterLastUsed >= 4 * 60 * 60 * 1000;
    if (!canWater) return;

    let xpGain = 8;
    if (s.fertilizerActive) xpGain *= 2;
    let newXP = s.growthXP + xpGain;
    let newStage = s.growthStage;

    if (newXP >= 100 && s.growthStage < 4) {
      newStage = (s.growthStage + 1) as GrowthStage;
      newXP -= 100;
    } else if (s.growthStage === 4) {
      newXP = Math.min(100, newXP);
    }

    saveState({ waterLevel: Math.min(100, s.waterLevel + 20), waterLastUsed: now, growthXP: newXP, growthStage: newStage });
  }, [saveState]);

  // ── 비료 ──────────────────────────────────────────────
  const useFertilizer = useCallback(() => {
    const now = Date.now();
    const s = stateRef.current;
    const canFert = s.fertilizerLastUsed === 0 || now - s.fertilizerLastUsed >= 5 * 24 * 60 * 60 * 1000;
    if (canFert) saveState({ fertilizerActive: true, fertilizerLastUsed: now });
  }, [saveState]);

  // ── 날씨 ──────────────────────────────────────────────
  const setWeather = useCallback((weather: WeatherType) => saveState({ weather }), [saveState]);

  return { state, ready, waterTree, useFertilizer, setWeather };
}
