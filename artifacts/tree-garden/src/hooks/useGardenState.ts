import { useState, useEffect, useCallback, useRef } from 'react';
import { ref, set, update, onValue } from 'firebase/database';
import { db } from '../lib/firebase';
import { WeatherType } from '../lib/weatherService';

// ─── 공개 타입 ───────────────────────────────────────────────
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

// ─── Firebase 노드 타입 ──────────────────────────────────────
// playdata/{uid}/garden
interface FbGarden {
  growthStage: GrowthStage;
  growthXP: number;
  waterLevel: number;
  weather: WeatherType;
  lastSaved: number;
}
// playdata/{uid}/cooldowns
interface FbCooldowns {
  waterLastUsed: number;
  fertilizerLastUsed: number;
  fertilizerActive: boolean;
}
// playdata/{uid}/stats
interface FbStats {
  totalWatered: number;
  totalFertilized: number;
  joinedAt: number;
  lastActiveAt: number;
}

// ─── 기본값 ──────────────────────────────────────────────────
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

// ─── 유틸 ────────────────────────────────────────────────────
/** 오프라인 경과 시간 기반 수분 감소 / 비료 만료 계산 */
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

/** Firebase 스냅샷(playdata/{uid}) → GardenState 변환 */
function fromFirebaseSnapshot(raw: Record<string, unknown>): GardenState {
  const g = ((raw.garden ?? {}) as Partial<FbGarden>);
  const c = ((raw.cooldowns ?? {}) as Partial<FbCooldowns>);
  return {
    growthStage: g.growthStage ?? DEFAULT_STATE.growthStage,
    growthXP: g.growthXP ?? DEFAULT_STATE.growthXP,
    waterLevel: g.waterLevel ?? DEFAULT_STATE.waterLevel,
    weather: g.weather ?? DEFAULT_STATE.weather,
    lastSaved: g.lastSaved ?? Date.now(),
    fertilizerActive: c.fertilizerActive ?? false,
    fertilizerLastUsed: c.fertilizerLastUsed ?? 0,
    waterLastUsed: c.waterLastUsed ?? 0,
  };
}

// ─── hook ────────────────────────────────────────────────────
/**
 * uid 있음 → Firebase playdata/{uid} 실시간 구독 (DB 우선)
 * uid 없음 → localStorage (비로그인 게스트)
 */
export function useGardenState(uid?: string | null) {
  const [state, setState] = useState<GardenState>(DEFAULT_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const isFirebase = Boolean(uid);

  /** Firebase stats 누적값 추적 (별도 노드라 state에 포함 X) */
  const statsRef = useRef<FbStats>({
    totalWatered: 0,
    totalFertilized: 0,
    joinedAt: Date.now(),
    lastActiveAt: Date.now(),
  });

  /** 최초 1회만 passive effects를 적용하는 플래그 */
  const initializedRef = useRef(false);

  // ── Firebase 실시간 구독 ───────────────────────────────────
  useEffect(() => {
    if (!isFirebase || !uid) return;

    setReady(false);
    initializedRef.current = false;

    const playdataRef = ref(db, `playdata/${uid}`);

    const unsub = onValue(playdataRef, (snap) => {
      const now = Date.now();

      // ── 신규 유저: 초기 데이터 생성 ───────────────────────
      if (!snap.exists()) {
        const garden: FbGarden = {
          growthStage: DEFAULT_STATE.growthStage,
          growthXP: DEFAULT_STATE.growthXP,
          waterLevel: DEFAULT_STATE.waterLevel,
          weather: DEFAULT_STATE.weather,
          lastSaved: now,
        };
        const cooldowns: FbCooldowns = {
          waterLastUsed: 0,
          fertilizerLastUsed: 0,
          fertilizerActive: false,
        };
        const stats: FbStats = {
          totalWatered: 0,
          totalFertilized: 0,
          joinedAt: now,
          lastActiveAt: now,
        };
        set(ref(db, `playdata/${uid}/garden`), garden);
        set(ref(db, `playdata/${uid}/cooldowns`), cooldowns);
        set(ref(db, `playdata/${uid}/stats`), stats);
        // onValue가 데이터 생성 후 다시 발화함
        return;
      }

      const raw = snap.val() as Record<string, unknown>;

      // stats 누적값 갱신 (waterTree/useFertilizer 에서 사용)
      const fbStats = (raw.stats ?? {}) as Partial<FbStats>;
      statsRef.current = {
        totalWatered: fbStats.totalWatered ?? 0,
        totalFertilized: fbStats.totalFertilized ?? 0,
        joinedAt: fbStats.joinedAt ?? now,
        lastActiveAt: fbStats.lastActiveAt ?? now,
      };

      const merged = fromFirebaseSnapshot(raw);

      if (!initializedRef.current) {
        // ── 최초 로드: 오프라인 경과 효과 적용 후 DB 반영 ──
        initializedRef.current = true;
        const applied = applyPassiveEffects(merged);
        setState(applied);

        // 변경된 garden 필드 즉시 반영
        update(ref(db, `playdata/${uid}/garden`), {
          waterLevel: applied.waterLevel,
          lastSaved: applied.lastSaved,
        });

        // 비료가 오프라인 중에 만료된 경우 반영
        if (!applied.fertilizerActive && merged.fertilizerActive) {
          update(ref(db, `playdata/${uid}/cooldowns`), { fertilizerActive: false });
        }

        // 접속 시각 기록
        update(ref(db, `playdata/${uid}/stats`), { lastActiveAt: now });
      } else {
        // ── 실시간 업데이트(다른 기기 포함) ─────────────────
        setState(merged);
      }

      setReady(true);
    });

    return () => {
      unsub();
      initializedRef.current = false;
    };
  }, [uid, isFirebase]);

  // ── 비로그인: localStorage ────────────────────────────────
  useEffect(() => {
    if (isFirebase) return;

    setReady(false);
    try {
      const stored = localStorage.getItem(LOCAL_KEY);
      if (stored) {
        const parsed = applyPassiveEffects(JSON.parse(stored) as GardenState);
        localStorage.setItem(LOCAL_KEY, JSON.stringify(parsed));
        setState(parsed);
      } else {
        const initial = { ...DEFAULT_STATE, lastSaved: Date.now() };
        setState(initial);
      }
    } catch {
      setState({ ...DEFAULT_STATE, lastSaved: Date.now() });
    }
    setReady(true);
  }, [isFirebase]);

  // ── 저장 헬퍼 ────────────────────────────────────────────
  /**
   * GardenState partial을 받아 Firebase 노드별로 분기 저장
   * - garden 노드: growthStage, growthXP, waterLevel, weather
   * - cooldowns 노드: fertilizerActive, fertilizerLastUsed, waterLastUsed
   */
  const persist = useCallback(
    (partial: Partial<GardenState>) => {
      const now = Date.now();

      if (isFirebase && uid) {
        const GARDEN_KEYS = new Set(['growthStage', 'growthXP', 'waterLevel', 'weather']);
        const COOLDOWN_KEYS = new Set(['fertilizerActive', 'fertilizerLastUsed', 'waterLastUsed']);

        const gardenUpdate: Record<string, unknown> = { lastSaved: now };
        const cooldownUpdate: Record<string, unknown> = {};

        for (const [k, v] of Object.entries(partial)) {
          if (GARDEN_KEYS.has(k)) gardenUpdate[k] = v;
          else if (COOLDOWN_KEYS.has(k)) cooldownUpdate[k] = v;
        }

        // 변경이 있는 노드만 업데이트
        update(ref(db, `playdata/${uid}/garden`), gardenUpdate);
        if (Object.keys(cooldownUpdate).length > 0) {
          update(ref(db, `playdata/${uid}/cooldowns`), cooldownUpdate);
        }
      } else {
        // localStorage: 최신 state 기반으로 통합 저장
        setState((prev) => {
          const next = { ...prev, ...partial, lastSaved: now };
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
          return next;
        });
      }
    },
    [uid, isFirebase],
  );

  /** state와 persist를 동시에 처리하는 공통 저장 함수 */
  const saveState = useCallback(
    (partial: Partial<GardenState>) => {
      if (isFirebase) {
        // Firebase: 낙관적 업데이트 후 DB 반영 (onValue가 최종 동기화)
        setState((prev) => ({ ...prev, ...partial, lastSaved: Date.now() }));
        persist(partial);
      } else {
        persist(partial); // localStorage 경로에서 setState 처리
      }
    },
    [isFirebase, persist],
  );

  // ── 수분 자동 감소 (12분마다 -1) ─────────────────────────
  useEffect(() => {
    if (!ready) return;
    const id = setInterval(() => {
      setState((prev) => {
        if (prev.waterLevel <= 0) return prev;
        const next = { ...prev, waterLevel: prev.waterLevel - 1, lastSaved: Date.now() };
        if (isFirebase && uid) {
          update(ref(db, `playdata/${uid}/garden`), {
            waterLevel: next.waterLevel,
            lastSaved: next.lastSaved,
          });
        } else {
          localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
        }
        return next;
      });
    }, 12 * 60 * 1000);
    return () => clearInterval(id);
  }, [ready, uid, isFirebase]);

  // ── 물주기 ────────────────────────────────────────────────
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

    saveState({
      waterLevel: Math.min(100, s.waterLevel + 20),
      waterLastUsed: now,
      growthXP: newXP,
      growthStage: newStage,
    });

    // stats 누적
    if (isFirebase && uid) {
      update(ref(db, `playdata/${uid}/stats`), {
        totalWatered: statsRef.current.totalWatered + 1,
        lastActiveAt: now,
      });
    }
  }, [saveState, isFirebase, uid]);

  // ── 비료 ──────────────────────────────────────────────────
  const useFertilizer = useCallback(() => {
    const now = Date.now();
    const s = stateRef.current;
    const canFert =
      s.fertilizerLastUsed === 0 || now - s.fertilizerLastUsed >= 5 * 24 * 60 * 60 * 1000;
    if (!canFert) return;

    saveState({ fertilizerActive: true, fertilizerLastUsed: now });

    // stats 누적
    if (isFirebase && uid) {
      update(ref(db, `playdata/${uid}/stats`), {
        totalFertilized: statsRef.current.totalFertilized + 1,
        lastActiveAt: now,
      });
    }
  }, [saveState, isFirebase, uid]);

  // ── 날씨 ──────────────────────────────────────────────────
  const setWeather = useCallback((weather: WeatherType) => saveState({ weather }), [saveState]);

  return { state, ready, waterTree, useFertilizer, setWeather };
}
