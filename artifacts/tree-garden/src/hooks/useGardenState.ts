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

// ─── hook ────────────────────────────────────────────────
export function useGardenState(uid: string) {
  const [state, setState] = useState<GardenState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Firebase 경로 ─────────────────────────────────────
  const gardenPath = `Users/${uid}/garden`;

  // ── 초기 로드 ─────────────────────────────────────────
  useEffect(() => {
    setReady(false);
    const gardenRef = ref(db, gardenPath);

    get(gardenRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.val() as GardenState;

        // 오프라인 시간 동안 수분 감소 계산
        const hoursPassed = (Date.now() - data.lastSaved) / (1000 * 60 * 60);
        data.waterLevel = Math.max(0, data.waterLevel - Math.floor(hoursPassed * 5));

        // 비료 만료 체크 (24h)
        if (data.fertilizerActive) {
          const fertHours = (Date.now() - data.fertilizerLastUsed) / (1000 * 60 * 60);
          if (fertHours >= 24) data.fertilizerActive = false;
        }

        data.lastSaved = Date.now();
        setState(data);
        update(gardenRef, { waterLevel: data.waterLevel, fertilizerActive: data.fertilizerActive, lastSaved: data.lastSaved });
      } else {
        // 첫 로그인 — 기본 상태로 초기화
        const initial = { ...DEFAULT_STATE, lastSaved: Date.now() };
        set(gardenRef, initial);
        setState(initial);
      }
      setReady(true);
    });
  }, [uid]);

  // ── Firebase 쓰기 헬퍼 ───────────────────────────────
  const persist = useCallback(
    (partial: Partial<GardenState>) => {
      update(ref(db, gardenPath), { ...partial, lastSaved: Date.now() });
    },
    [gardenPath],
  );

  // ── 상태 변경 + 저장 ─────────────────────────────────
  const saveState = useCallback(
    (partial: Partial<GardenState>) => {
      setState((prev) => {
        const next = { ...prev, ...partial, lastSaved: Date.now() };
        persist(partial);
        return next;
      });
    },
    [persist],
  );

  // ── 수분 자동 감소 (앱 열려있는 동안, 12분마다 -1) ──
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.waterLevel <= 0) return prev;
        const next = { ...prev, waterLevel: prev.waterLevel - 1, lastSaved: Date.now() };
        persist({ waterLevel: next.waterLevel });
        return next;
      });
    }, 12 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, persist]);

  // ── 물주기 ────────────────────────────────────────────
  const waterTree = useCallback(() => {
    const now = Date.now();
    const s = stateRef.current;
    const canWater =
      s.waterLastUsed === 0 || now - s.waterLastUsed >= 4 * 60 * 60 * 1000;

    if (!canWater) return;

    let xpGain = 8;
    if (s.fertilizerActive) xpGain *= 2;

    let newXP = s.growthXP + xpGain;
    let newStage = s.growthStage;

    if (newXP >= 100 && s.growthStage < 4) {
      newStage = (s.growthStage + 1) as GrowthStage;
      newXP = newXP - 100;
    } else if (s.growthStage === 4) {
      newXP = Math.min(100, newXP);
    }

    saveState({
      waterLevel: Math.min(100, s.waterLevel + 20),
      waterLastUsed: now,
      growthXP: newXP,
      growthStage: newStage,
    });
  }, [saveState]);

  // ── 비료 ──────────────────────────────────────────────
  const useFertilizer = useCallback(() => {
    const now = Date.now();
    const s = stateRef.current;
    const canFert =
      s.fertilizerLastUsed === 0 ||
      now - s.fertilizerLastUsed >= 5 * 24 * 60 * 60 * 1000;

    if (canFert) saveState({ fertilizerActive: true, fertilizerLastUsed: now });
  }, [saveState]);

  // ── 날씨 ──────────────────────────────────────────────
  const setWeather = useCallback(
    (weather: WeatherType) => saveState({ weather }),
    [saveState],
  );

  return { state, ready, waterTree, useFertilizer, setWeather };
}
