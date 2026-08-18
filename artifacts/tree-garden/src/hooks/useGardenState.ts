import { useState, useEffect, useCallback } from 'react';
import { WeatherType } from '../lib/weatherService';

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

const STORAGE_KEY = 'tree-garden-state';

export function useGardenState() {
  const [state, setState] = useState<GardenState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as GardenState;
        
        // Calculate passive water loss (~5 points per hour)
        const hoursPassed = (Date.now() - parsed.lastSaved) / (1000 * 60 * 60);
        const waterLoss = Math.floor(hoursPassed * 5);
        parsed.waterLevel = Math.max(0, parsed.waterLevel - waterLoss);
        
        // Check if fertilizer expired (24h)
        if (parsed.fertilizerActive) {
          const fertHours = (Date.now() - parsed.fertilizerLastUsed) / (1000 * 60 * 60);
          if (fertHours >= 24) {
            parsed.fertilizerActive = false;
          }
        }
        
        parsed.lastSaved = Date.now();
        return parsed;
      }
    } catch (e) {
      console.warn("Failed to parse stored garden state", e);
    }
    return DEFAULT_STATE;
  });

  const saveState = useCallback((newState: Partial<GardenState>) => {
    setState(prev => {
      const updated = { ...prev, ...newState, lastSaved: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Passive water loss timer while app is open (1 point every 12 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.waterLevel <= 0) return prev;
        const updated = { ...prev, waterLevel: Math.max(0, prev.waterLevel - 1), lastSaved: Date.now() };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return updated;
      });
    }, 12 * 60 * 1000); 
    
    return () => clearInterval(interval);
  }, []);

  const waterTree = useCallback(() => {
    const now = Date.now();
    // 4 hour cooldown
    const canWater = (now - state.waterLastUsed) >= 4 * 60 * 60 * 1000 || state.waterLastUsed === 0;
    
    if (canWater) {
      let xpGain = 8;
      if (state.fertilizerActive) xpGain *= 2;
      
      let newXP = state.growthXP + xpGain;
      let newStage = state.growthStage;
      
      if (newXP >= 100 && state.growthStage < 4) {
        newStage = (state.growthStage + 1) as GrowthStage;
        newXP = newXP - 100;
      } else if (state.growthStage === 4) {
        newXP = Math.min(100, newXP);
      }

      saveState({
        waterLevel: Math.min(100, state.waterLevel + 20),
        waterLastUsed: now,
        growthXP: newXP,
        growthStage: newStage
      });
    }
  }, [state, saveState]);

  const useFertilizer = useCallback(() => {
    const now = Date.now();
    // 5 day cooldown
    const canFertilize = (now - state.fertilizerLastUsed) >= 5 * 24 * 60 * 60 * 1000 || state.fertilizerLastUsed === 0;
    
    if (canFertilize) {
      saveState({
        fertilizerActive: true,
        fertilizerLastUsed: now
      });
    }
  }, [state, saveState]);

  const setWeather = useCallback((weather: WeatherType) => {
    saveState({ weather });
  }, [saveState]);
  
  // Debug func
  const addXP = useCallback((amount: number) => {
    let newXP = state.growthXP + amount;
    let newStage = state.growthStage;
    if (newXP >= 100 && state.growthStage < 4) {
        newStage = (state.growthStage + 1) as GrowthStage;
        newXP = newXP - 100;
    } else if (state.growthStage === 4) {
        newXP = Math.min(100, newXP);
    }
    saveState({ growthXP: newXP, growthStage: newStage });
  }, [state, saveState]);

  return {
    state,
    waterTree,
    useFertilizer,
    setWeather,
    addXP // purely for testing/debug if needed
  };
}
