import { TreeScene } from '../components/TreeScene';
import { SidePanel } from '../components/SidePanel';
import { WeatherPanel } from '../components/WeatherPanel';
import { HomeNameBadge } from '../components/HomeNameBadge';
import { UserBadge } from '../components/UserBadge';
import { LoginPromptBanner } from '../components/LoginPromptBanner';
import { useGardenState } from '../hooks/useGardenState';
import { useAuth } from '../contexts/AuthContext';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const { state, ready, waterTree, useFertilizer, setWeather } = useGardenState(
    user?.uid ?? null,
  );

  // Auth 또는 garden 상태 로딩 중
  if (authLoading || !ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="text-5xl animate-pulse">🌱</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen overflow-hidden text-foreground">
      {/* 3D 배경 씬 */}
      <TreeScene state={state} />

      {/* 왼쪽 패널 */}
      <SidePanel
        state={state}
        onWater={waterTree}
        onFertilize={useFertilizer}
      />

      {/* 우측 상단 패널 스택 */}
      <div className="fixed right-6 top-6 flex flex-col items-end gap-2 z-10">
        <UserBadge />
        <HomeNameBadge />
        <WeatherPanel
          weather={state.weather}
          onWeatherChange={setWeather}
        />
      </div>

      {/* 비로그인 로그인 유도 배너 */}
      {!user && <LoginPromptBanner />}
    </div>
  );
}
