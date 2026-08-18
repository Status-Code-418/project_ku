import { motion } from 'framer-motion';
import { Droplet, Sparkles } from 'lucide-react';
import { GardenState, GrowthStage } from '../hooks/useGardenState';
import { useEffect, useState } from 'react';

interface SidePanelProps {
  state: GardenState;
  onWater: () => void;
  onFertilize: () => void;
}

const STAGE_LABELS: Record<GrowthStage, string> = {
  0: "씨앗",
  1: "새싹",
  2: "묘목",
  3: "어린 나무",
  4: "성숙한 나무"
};

export function SidePanel({ state, onWater, onFertilize }: SidePanelProps) {
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Water CD: 4 hours
  const waterCdMs = 4 * 60 * 60 * 1000;
  const waterTimePassed = now - state.waterLastUsed;
  const canWater = state.waterLastUsed === 0 || waterTimePassed >= waterCdMs;
  
  const formatTime = (ms: number) => {
    if (ms <= 0) return '0h 0m';
    const h = Math.floor(ms / (1000 * 60 * 60));
    const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${h}h ${m}m`;
  };

  const waterRemaining = Math.max(0, waterCdMs - waterTimePassed);

  // Fert CD: 5 days
  const fertCdMs = 5 * 24 * 60 * 60 * 1000;
  const fertTimePassed = now - state.fertilizerLastUsed;
  const canFertilize = state.fertilizerLastUsed === 0 || fertTimePassed >= fertCdMs;
  const fertRemaining = Math.max(0, fertCdMs - fertTimePassed);

  return (
    <motion.div 
      initial={{ x: -50, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-6 top-6 bottom-6 w-64 glass rounded-3xl p-6 flex flex-col gap-8 shadow-xl text-foreground z-10"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-medium tracking-tight">나무 정원</h2>
        <p className="text-sm text-muted-foreground">당신의 작은 쉼터</p>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium">수분</span>
          <span className="text-sm font-bold">{state.waterLevel}%</span>
        </div>
        
        {/* Water Progress Bar */}
        <div className="h-4 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
          <motion.div 
            className="h-full bg-blue-400/80 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${state.waterLevel}%` }}
            transition={{ type: "spring", bounce: 0, duration: 1 }}
          />
        </div>

        <button
          onClick={onWater}
          disabled={!canWater}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all ${
            canWater 
            ? 'bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 dark:text-blue-300 cursor-pointer shadow-sm hover:shadow active:scale-95' 
            : 'bg-black/5 dark:bg-white/5 text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Droplet size={18} />
          <span className="font-medium">
            {canWater ? '물 주기' : formatTime(waterRemaining)}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium">영양제</span>
          <span className="text-xs text-muted-foreground">
            {state.fertilizerActive ? '활성화 됨 (2배 성장)' : '비활성'}
          </span>
        </div>
        
        <button
          onClick={onFertilize}
          disabled={!canFertilize || state.fertilizerActive}
          className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl transition-all ${
            canFertilize && !state.fertilizerActive
            ? 'bg-green-50 hover:bg-green-100 text-green-700 dark:bg-green-900/30 dark:hover:bg-green-900/50 dark:text-green-300 cursor-pointer shadow-sm hover:shadow active:scale-95' 
            : 'bg-black/5 dark:bg-white/5 text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Sparkles size={18} />
          <span className="font-medium">
            {state.fertilizerActive ? '효과 적용중' : canFertilize ? '영양제 주기' : formatTime(fertRemaining)}
          </span>
        </button>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <div className="flex justify-between items-end">
          <span className="text-sm font-medium">성장 단계</span>
          <span className="text-sm font-bold text-primary">{STAGE_LABELS[state.growthStage]}</span>
        </div>
        
        <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
          <motion.div 
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${state.growthXP}%` }}
            transition={{ type: "spring", bounce: 0, duration: 1 }}
          />
        </div>
        <div className="text-right text-xs text-muted-foreground">
          {state.growthStage === 4 ? '최대 성장' : `${state.growthXP} / 100 XP`}
        </div>
      </div>
    </motion.div>
  );
}
