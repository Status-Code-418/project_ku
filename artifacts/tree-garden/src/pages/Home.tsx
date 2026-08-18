import { TreeScene } from '../components/TreeScene';
import { SidePanel } from '../components/SidePanel';
import { WeatherPanel } from '../components/WeatherPanel';
import { HomeNameBadge } from '../components/HomeNameBadge';
import { useGardenState } from '../hooks/useGardenState';

export default function Home() {
  const { state, waterTree, useFertilizer, setWeather } = useGardenState();

  return (
    <div className="relative w-full h-screen overflow-hidden text-foreground">
      {/* 3D Background Scene */}
      <TreeScene state={state} />
      
      {/* Floating UI */}
      <SidePanel 
        state={state} 
        onWater={waterTree} 
        onFertilize={useFertilizer} 
      />

      {/* Top-right panel stack */}
      <div className="fixed right-6 top-6 flex flex-col items-end gap-2 z-10">
        <HomeNameBadge />
        <WeatherPanel 
          weather={state.weather} 
          onWeatherChange={setWeather} 
        />
      </div>
    </div>
  );
}
