import { motion } from 'framer-motion';
import { Sun, Cloud, CloudRain, Snowflake, RefreshCw } from 'lucide-react';
import { WeatherType, getWeatherLabel, getNextWeather } from '../lib/weatherService';

interface WeatherPanelProps {
  weather: WeatherType;
  onWeatherChange: (w: WeatherType) => void;
}

const ICONS = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  snowy: Snowflake
};

const COLORS = {
  sunny: 'text-amber-500',
  cloudy: 'text-slate-400',
  rainy: 'text-blue-500',
  snowy: 'text-cyan-300'
};

export function WeatherPanel({ weather, onWeatherChange }: WeatherPanelProps) {
  const Icon = ICONS[weather];
  
  return (
    <motion.div 
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="glass rounded-2xl p-3 flex items-center gap-4 shadow-lg text-foreground"
    >
      <div className="flex items-center gap-3 pl-2 pr-1">
        <Icon className={`w-5 h-5 ${COLORS[weather]}`} />
        <span className="font-medium text-sm">{getWeatherLabel(weather)}</span>
      </div>
      
      <div className="w-px h-6 bg-border/50" />
      
      <button 
        onClick={() => onWeatherChange(getNextWeather(weather))}
        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors text-muted-foreground hover:text-foreground"
        title="날씨 변경"
      >
        <RefreshCw size={16} />
      </button>
    </motion.div>
  );
}
