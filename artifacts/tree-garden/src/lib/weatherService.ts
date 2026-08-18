export type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

export interface WeatherData {
  type: WeatherType;
  label: string;
}

const WEATHERS: Record<WeatherType, string> = {
  sunny: '맑음',
  cloudy: '흐림',
  rainy: '비',
  snowy: '눈'
};

export async function fetchCurrentWeather(): Promise<WeatherData> {
  // TODO: fetch from KMA API with KMA_API_KEY env var
  // For now, return a random or default weather
  return {
    type: 'sunny',
    label: WEATHERS['sunny']
  };
}

export function getNextWeather(current: WeatherType): WeatherType {
  const types: WeatherType[] = ['sunny', 'cloudy', 'rainy', 'snowy'];
  const currentIndex = types.indexOf(current);
  return types[(currentIndex + 1) % types.length];
}

export function getWeatherLabel(type: WeatherType): string {
  return WEATHERS[type];
}
