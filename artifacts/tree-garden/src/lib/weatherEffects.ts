import * as THREE from 'three';
import { WeatherType } from './weatherService';

export interface WeatherEffectConfig {
  skyTop: THREE.Color;
  skyBottom: THREE.Color;
  ambientColor: THREE.Color;
  ambientIntensity: number;
  directionalColor: THREE.Color;
  directionalIntensity: number;
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherEffectConfig> = {
  sunny: {
    skyTop: new THREE.Color(0x87CEEB),    // bright blue
    skyBottom: new THREE.Color(0xffeeb0), // warm horizon
    ambientColor: new THREE.Color(0xffffff),
    ambientIntensity: 0.6,
    directionalColor: new THREE.Color(0xfffaeb),
    directionalIntensity: 1.0
  },
  cloudy: {
    skyTop: new THREE.Color(0x7a8a99),    // dark grey blue
    skyBottom: new THREE.Color(0xb0bcc2), // light grey
    ambientColor: new THREE.Color(0xffffff),
    ambientIntensity: 0.4,
    directionalColor: new THREE.Color(0xffffff),
    directionalIntensity: 0.2
  },
  rainy: {
    skyTop: new THREE.Color(0x2b3238),    // very dark grey
    skyBottom: new THREE.Color(0x566069), // mid grey
    ambientColor: new THREE.Color(0x8899aa),
    ambientIntensity: 0.3,
    directionalColor: new THREE.Color(0x88aaff),
    directionalIntensity: 0.1
  },
  snowy: {
    skyTop: new THREE.Color(0x9caebc),    // pale cool grey
    skyBottom: new THREE.Color(0xdce7f0), // near white
    ambientColor: new THREE.Color(0xffffff),
    ambientIntensity: 0.7,
    directionalColor: new THREE.Color(0xddeeff),
    directionalIntensity: 0.5
  }
};
