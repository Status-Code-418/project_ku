import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GardenState } from '../hooks/useGardenState';
import { createTree } from '../lib/treeGeometry';
import { ParticleSystem } from '../lib/particleSystems';
import { WEATHER_CONFIGS } from '../lib/weatherEffects';

interface TreeSceneProps {
  state: GardenState;
}

/** CSS-only fallback when WebGL is unavailable (headless / old GPU) */
function TreeSceneFallback({ state }: TreeSceneProps) {
  const stageEmoji = ['🌱', '🌿', '🪴', '🌳', '🌲'];
  const bgColors: Record<string, string> = {
    sunny: 'from-sky-200 via-yellow-50 to-green-100',
    cloudy: 'from-slate-300 via-slate-100 to-green-100',
    rainy: 'from-slate-500 via-slate-200 to-green-200',
    snowy: 'from-slate-100 via-white to-blue-50',
  };
  const bg = bgColors[state.weather] ?? bgColors.sunny;
  return (
    <div className={`fixed inset-0 w-full h-full bg-gradient-to-b ${bg} flex items-center justify-center -z-10`}>
      <span className="text-[12rem] select-none opacity-80" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.12))' }}>
        {stageEmoji[state.growthStage]}
      </span>
    </div>
  );
}

export function TreeScene({ state }: TreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  // Three.js mutable refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const treeGroupRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<{ leaves?: ParticleSystem, weather?: ParticleSystem }>({});
  
  // Lighting refs for transition
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const topColorRef = useRef(new THREE.Color());
  const bottomColorRef = useRef(new THREE.Color());

  // Initialize Scene
  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0xffffff, 0.02);

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2, 8);
    camera.lookAt(0, 1, 0);
    cameraRef.current = camera;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setWebglFailed(true);
      return;
    }

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // 3. Ground Plane
    const groundGeom = new THREE.CylinderGeometry(4, 4, 0.1, 32);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x8a9a5b });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.position.y = -0.05;
    ground.receiveShadow = true;
    scene.add(ground);

    // 4. Tree Setup (Initial)
    const tree = createTree(state.growthStage);
    scene.add(tree);
    treeGroupRef.current = tree;

    // 5. Particles
    const leaves = new ParticleSystem('leaves', 150);
    scene.add(leaves.points);
    particlesRef.current.leaves = leaves;

    // Sky Background mesh
    const skyGeom = new THREE.SphereGeometry(50, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0x87CEEB) },
        bottomColor: { value: new THREE.Color(0xffeeb0) },
        offset: { value: 2 },
        exponent: { value: 0.6 }
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize( vWorldPosition + offset ).y;
          gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h, 0.0 ), exponent ), 0.0 ) ), 1.0 );
        }
      `,
      side: THREE.BackSide,
    });
    const sky = new THREE.Mesh(skyGeom, skyMat);
    scene.add(sky);
    topColorRef.current = skyMat.uniforms.topColor.value;
    bottomColorRef.current = skyMat.uniforms.bottomColor.value;

    // 6. Animation Loop
    let animationId: number;
    const startTime = performance.now();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const time = (performance.now() - startTime) / 1000;

      // Gentle Tree Sway
      if (treeGroupRef.current) {
        // Find foliage to sway
        treeGroupRef.current.children.forEach(child => {
          if (child instanceof THREE.Mesh && child.geometry instanceof THREE.SphereGeometry) {
            child.rotation.z = Math.sin(time * 0.5) * 0.05;
            child.rotation.x = Math.cos(time * 0.4) * 0.05;
          }
        });
      }

      // Drooping if water is low (<20)
      if (treeGroupRef.current) {
        const targetRotZ = state.waterLevel < 20 ? 0.1 : 0;
        treeGroupRef.current.rotation.z += (targetRotZ - treeGroupRef.current.rotation.z) * 0.05;
      }

      // Update Particles
      if (particlesRef.current.leaves) {
        particlesRef.current.leaves.update(time, state.weather === 'windy' ? 2.5 : 1.0); // Wait, no windy state.
      }
      if (particlesRef.current.weather) {
        particlesRef.current.weather.update(time);
      }

      // Smooth weather transition
      const conf = WEATHER_CONFIGS[state.weather] || WEATHER_CONFIGS.sunny;
      topColorRef.current.lerp(conf.skyTop, 0.02);
      bottomColorRef.current.lerp(conf.skyBottom, 0.02);
      if (scene.fog) scene.fog.color.lerp(conf.skyBottom, 0.02);
      if (ambientLightRef.current) {
        ambientLightRef.current.color.lerp(conf.ambientColor, 0.02);
        ambientLightRef.current.intensity += (conf.ambientIntensity - ambientLightRef.current.intensity) * 0.02;
      }
      if (dirLightRef.current) {
        dirLightRef.current.color.lerp(conf.directionalColor, 0.02);
        dirLightRef.current.intensity += (conf.directionalIntensity - dirLightRef.current.intensity) * 0.02;
      }

      renderer.render(scene, camera);
    };
    
    animate();

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      skyGeom.dispose();
      skyMat.dispose();
      groundGeom.dispose();
      groundMat.dispose();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once for setup

  // Handle Tree Growth Stage Change
  useEffect(() => {
    if (!sceneRef.current || !treeGroupRef.current) return;
    
    // Create new tree
    const newTree = createTree(state.growthStage);
    
    // Preserve droop if any
    newTree.rotation.z = treeGroupRef.current.rotation.z;
    
    // Scale animation setup
    newTree.scale.set(0.1, 0.1, 0.1);
    sceneRef.current.add(newTree);
    
    const oldTree = treeGroupRef.current;
    
    // Simple tween
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.05;
      if (progress >= 1) {
        newTree.scale.set(1, 1, 1);
        if (oldTree) sceneRef.current?.remove(oldTree);
        treeGroupRef.current = newTree;
        clearInterval(interval);
      } else {
        const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
        newTree.scale.set(ease, ease, ease);
        if (oldTree) {
          oldTree.scale.set(1-ease, 1-ease, 1-ease);
        }
      }
    }, 16);

    return () => clearInterval(interval);
  }, [state.growthStage]);

  // Handle Weather Particle changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove old weather particles
    if (particlesRef.current.weather) {
      sceneRef.current.remove(particlesRef.current.weather.points);
      particlesRef.current.weather.points.geometry.dispose();
      (particlesRef.current.weather.points.material as THREE.Material).dispose();
      particlesRef.current.weather = undefined;
    }

    if (state.weather === 'rainy') {
      const rain = new ParticleSystem('rain', 300);
      sceneRef.current.add(rain.points);
      particlesRef.current.weather = rain;
    } else if (state.weather === 'snowy') {
      const snow = new ParticleSystem('snow', 200);
      sceneRef.current.add(snow.points);
      particlesRef.current.weather = snow;
    }

  }, [state.weather]);

  if (webglFailed) {
    return <TreeSceneFallback state={state} />;
  }

  return (
    <div 
      ref={mountRef} 
      className="fixed inset-0 w-full h-full -z-10"
      style={{ background: '#f5f5dc' }}
    />
  );
}
