import { TreeScene } from '../components/TreeScene';
import { SidePanel } from '../components/SidePanel';
import { WeatherPanel } from '../components/WeatherPanel';
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
      
      <WeatherPanel 
        weather={state.weather} 
        onWeatherChange={setWeather} 
      />
    </div>
  );
}
