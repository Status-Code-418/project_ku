import { useState } from 'react';
import { Check, Copy, ChevronDown, ChevronRight } from 'lucide-react';

// ─────────────────────────────────────────────
// 스키마 데이터
// ─────────────────────────────────────────────
const SCHEMA_SECTIONS = [
  {
    id: 'overview',
    title: '프로젝트 개요',
    content: `프로젝트명: 나무 정원 (Tree Garden)
기술 스택: React + Vite + TypeScript + Three.js + Tailwind CSS v4 + Framer Motion
모노레포 구성: pnpm workspace
  - artifacts/tree-garden    (메인 웹 앱)
  - artifacts/api-server     (Express API 서버)
  - artifacts/mockup-sandbox (UI 컴포넌트 샌드박스)
상태 저장: localStorage (key: "tree-garden-state")
데이터 서버: Firebase Realtime Database
  - URL: https://kuku-543c6-default-rtdb.asia-southeast1.firebasedatabase.app/
  - 경로: home → { name: string }
GitHub: https://github.com/Status-Code-418/project_ku`,
  },
  {
    id: 'structure',
    title: '디렉터리 구조',
    content: `artifacts/tree-garden/
├── src/
│   ├── App.tsx                   # 라우터 루트 (Wouter)
│   ├── main.tsx                  # Vite 앱 진입점
│   ├── index.css                 # Tailwind v4 글로벌 테마
│   ├── pages/
│   │   ├── Home.tsx              # 메인 페이지 (상태 주입 + 레이아웃)
│   │   ├── Admin.tsx             # 관리자 페이지 (/admin)
│   │   └── not-found.tsx         # 404 페이지
│   ├── components/
│   │   ├── TreeScene.tsx         # Three.js 3D 씬 (메인 렌더러)
│   │   ├── SidePanel.tsx         # 물주기/비료 UI 패널 (좌측 플로팅)
│   │   ├── WeatherPanel.tsx      # 날씨 표시/변경 패널 (우측 상단)
│   │   ├── HomeNameBadge.tsx     # Firebase name 실시간 배지
│   │   ├── error-boundary.tsx    # 에러 바운더리
│   │   └── ui/                   # shadcn/Radix 공통 컴포넌트
│   ├── hooks/
│   │   ├── useGardenState.ts     # 전체 게임 상태 관리 훅
│   │   └── useFirebaseHome.ts    # Firebase home 실시간 구독 훅
│   └── lib/
│       ├── firebase.ts           # Firebase 앱 초기화
│       ├── treeGeometry.ts       # 성장 단계별 절차적 나무 생성
│       ├── particleSystems.ts    # 낙엽/비/눈 파티클 시스템
│       ├── weatherEffects.ts     # 날씨별 조명/하늘 색상 설정값
│       ├── weatherService.ts     # 날씨 타입 정의 + KMA API 준비
│       └── utils.ts              # cn() 유틸리티`,
  },
  {
    id: 'types',
    title: '핵심 타입 정의',
    content: `type GrowthStage = 0 | 1 | 2 | 3 | 4;
// 0: 씨앗  1: 새싹  2: 묘목  3: 어린 나무  4: 성숙한 나무

type WeatherType = 'sunny' | 'cloudy' | 'rainy' | 'snowy';

interface GardenState {
  growthStage: GrowthStage;
  growthXP: number;
  waterLevel: number;           // 0 ~ 100
  fertilizerActive: boolean;
  fertilizerLastUsed: number;   // timestamp (ms)
  waterLastUsed: number;        // timestamp (ms)
  weather: WeatherType;
  lastSaved: number;            // timestamp (ms)
}

interface WeatherEffectConfig {
  skyTop: string;               // hex
  skyBottom: string;            // hex
  ambientColor: string;
  ambientIntensity: number;
  directionalColor: string;
  directionalIntensity: number;
}`,
  },
  {
    id: 'game-logic',
    title: '게임 로직',
    content: `// useGardenState.ts
기본 상태: stage=0, XP=0, water=50, sunny

물주기 (waterTree)
  - waterLevel +20
  - growthXP +8  (비료 활성시 +16)
  - 쿨다운: 4시간

비료 (useFertilizer)
  - XP 2배 효과 24시간 지속
  - 쿨다운: 5일

성장 XP 기준 (각 단계 진입점)
  [0, 50, 150, 350, 700]

물 자동 감소
  - 시간 경과에 따라 waterLevel 자동 감소

저장소
  - localStorage key: "tree-garden-state"
  - 자동 저장 (상태 변경마다)`,
  },
  {
    id: 'three',
    title: 'Three.js 씬',
    content: `// TreeScene.tsx
카메라: PerspectiveCamera(45°, position(0,2,8), look-at(0,1,0))
렌더러: WebGLRenderer + PCFSoftShadowMap, pixelRatio ≤ 2

조명
  - AmbientLight
  - DirectionalLight (그림자 지원)

지형: 원형 평면 (ground disc)

나무 (treeGeometry.ts)
  - createTree(stage) → Cylinder(줄기) + Sphere(수관)
  - MeshStandardMaterial 사용 (roughness 지원)
  - 성장 단계 전환: easeOutCubic 크로스스케일 (~320ms)

파티클 (particleSystems.ts)
  - 낙엽 150개 (항상 표시)
  - 날씨에 따라 비 300개 또는 눈 200개 추가

하늘: 반전 구체 + 커스텀 GLSL 그라디언트 셰이더

애니메이션: performance.now() 기반 루프
  - 수관 흔들림
  - 물 부족(< 20%)시 줄기 드루프

WebGL 불가 시: CSS 폴백 (이모지 + 그라디언트 배경)
  - 🌱 새싹  🌿 묘목  🪴 화분  🌳 어린나무  🌲 성숙한나무`,
  },
  {
    id: 'weather',
    title: '날씨 시스템',
    content: `// weatherEffects.ts / weatherService.ts
날씨 순환: sunny → cloudy → rainy → snowy → sunny

WEATHER_CONFIGS
  sunny  : 밝은 하늘 (#87CEEB~#e0f4ff), 강한 조명, 파티클 없음
  cloudy : 회색 하늘, 약한 조명, 파티클 없음
  rainy  : 어두운 하늘, 매우 약한 조명, 비 파티클 300개
  snowy  : 하얀 하늘, 차가운 조명, 눈 파티클 200개

한국어 라벨: 맑음 / 흐림 / 비 / 눈

TODO: KMA API 연동 (weatherService.ts)
  - 환경변수: KMA_API_KEY 필요`,
  },
  {
    id: 'firebase',
    title: 'Firebase 연동',
    content: `// lib/firebase.ts
initializeApp({ databaseURL: '...' })  // databaseURL만으로 초기화

// hooks/useFirebaseHome.ts
onValue(ref(db, 'home'), callback)     // 실시간 구독 (once 아님)

데이터 구조
  home/
    name: string   (예: "하하호호")

표시 위치: 홈 화면 우측 상단 (WeatherPanel 위)
컴포넌트: HomeNameBadge.tsx
  - Framer Motion AnimatePresence 전환 애니메이션
  - glassmorphism 스타일`,
  },
  {
    id: 'style',
    title: 'UI 스타일 시스템',
    content: `// index.css
Tailwind v4 (@import 'tailwindcss')
폰트: Noto Sans KR (300/400/500/600), Google Fonts

라이트 테마 (earth tones)
  --background : 45 30% 95%  (크림)
  --primary    : deep green
  --secondary  : warm earth
  --accent     : moss green

다크 테마: night-garden deep green

커스텀 클래스
  .glass : 반투명 배경 + backdrop-blur-12px + 테두리

body: overflow-hidden (전체화면 3D 씬 대응)

UI 라이브러리: shadcn/Radix UI (전체 컴포넌트 세트)
애니메이션: Framer Motion
아이콘: Lucide React`,
  },
  {
    id: 'deps',
    title: '주요 의존성',
    content: `three: ^0.185.1
react + react-dom: ^18.x
vite + @vitejs/plugin-react
tailwindcss v4 + @tailwindcss/vite
framer-motion
lucide-react
wouter (라우팅)
@tanstack/react-query
firebase
shadcn/Radix UI (전체 세트)
class-variance-authority, clsx, tailwind-merge
recharts, date-fns, sonner, next-themes`,
  },
  {
    id: 'build',
    title: '빌드/환경 설정',
    content: `// vite.config.ts
PORT + BASE_PATH 환경변수 필수 (없으면 throw)
host: 0.0.0.0, strictPort: true
허용 호스트: 모두 허용 (프록시 iframe 대응)
output: dist/public

// tsconfig.json
extends: ../../tsconfig.base.json
module resolution: bundler
@/* → ./src/*
참조: ../../lib/api-client-react

패키지명: @workspace/tree-garden`,
  },
  {
    id: 'todo',
    title: 'TODO / 미완성',
    content: `1. KMA API 연동
   - weatherService.ts의 fetchCurrentWeather() 구현
   - 환경변수: KMA_API_KEY

2. GLB 3D 모델 교체
   - treeGeometry.ts의 createTree() 내 TODO 주석 위치
   - THREE.GLTFLoader로 사용자 제공 GLB 파일 로드

3. Firebase 추가 기능
   - 현재: home/name 실시간 읽기만 구현
   - 추후 확장 가능 (쓰기, 인증 등)`,
  },
];

// ─────────────────────────────────────────────
// 전체 복사용 평문 생성
// ─────────────────────────────────────────────
function buildFullText(): string {
  return SCHEMA_SECTIONS.map(
    (s) => `# ${s.title}\n\n${s.content}`
  ).join('\n\n' + '─'.repeat(60) + '\n\n');
}

// ─────────────────────────────────────────────
// 섹션 컴포넌트
// ─────────────────────────────────────────────
function SchemaSection({
  section,
}: {
  section: (typeof SCHEMA_SECTIONS)[number];
}) {
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(section.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border border-border rounded-2xl overflow-hidden bg-card/60 backdrop-blur-sm">
      {/* 헤더 */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/10 transition-colors text-left"
      >
        <span className="font-semibold text-sm text-foreground">
          {section.title}
        </span>
        {open ? (
          <ChevronDown size={16} className="text-muted-foreground" />
        ) : (
          <ChevronRight size={16} className="text-muted-foreground" />
        )}
      </button>

      {/* 내용 */}
      {open && (
        <div className="border-t border-border px-5 pb-5 pt-4">
          <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap leading-relaxed">
            {section.content}
          </pre>
          <button
            onClick={handleCopy}
            className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            {copied ? (
              <>
                <Check size={12} className="text-green-500" />
                <span className="text-green-500">복사됨</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                섹션 복사
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// 관리자 페이지
// ─────────────────────────────────────────────
export default function Admin() {
  const [allCopied, setAllCopied] = useState(false);

  const handleCopyAll = () => {
    navigator.clipboard.writeText(buildFullText());
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 상단 헤더 */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">관리자 페이지</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            나무 정원 — 개발 스키마 문서
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            ← 홈으로
          </a>
          <button
            onClick={handleCopyAll}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            {allCopied ? (
              <>
                <Check size={13} />
                전체 복사됨!
              </>
            ) : (
              <>
                <Copy size={13} />
                전체 복사
              </>
            )}
          </button>
        </div>
      </header>

      {/* 본문 */}
      <main className="max-w-3xl mx-auto px-6 py-8 space-y-4">
        <p className="text-sm text-muted-foreground">
          아래 스키마 문서를 복사해서 새 개발 라인에 활용하세요.
          섹션별로 개별 복사하거나 우측 상단의{' '}
          <span className="font-medium text-foreground">전체 복사</span> 버튼으로
          한 번에 복사할 수 있습니다.
        </p>

        {SCHEMA_SECTIONS.map((section) => (
          <SchemaSection key={section.id} section={section} />
        ))}
      </main>
    </div>
  );
}
