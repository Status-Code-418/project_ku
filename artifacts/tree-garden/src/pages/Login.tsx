import { useState } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signInWithGoogle, signInAnonymously, user } = useAuth();
  const [, navigate] = useLocation();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [anonLoading, setAnonLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인된 경우 홈으로
  if (user) {
    navigate('/');
    return null;
  }

  const handleGoogle = async () => {
    try {
      setError(null);
      setGoogleLoading(true);
      await signInWithGoogle();
      navigate('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '로그인에 실패했습니다.';
      // 팝업 차단은 무시
      if (!msg.includes('popup-closed')) setError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAnonymous = async () => {
    try {
      setError(null);
      setAnonLoading(true);
      await signInAnonymously();
      navigate('/');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '시작에 실패했습니다.';
      setError(msg);
    } finally {
      setAnonLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #b7d9b0 0%, #e8f5e1 40%, #c8e6c2 100%)',
      }}
    >
      {/* 배경 원형 장식 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative glass rounded-3xl p-10 w-full max-w-sm shadow-2xl flex flex-col items-center gap-6"
      >
        {/* 로고 */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-6xl select-none">🌱</span>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            나무 정원
          </h1>
          <p className="text-sm text-muted-foreground text-center">
            나만의 나무를 키워보세요
          </p>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* 버튼 영역 */}
        <div className="w-full flex flex-col gap-3">
          {/* Google 로그인 */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading || anonLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {googleLoading ? (
              <Spinner />
            ) : (
              <GoogleIcon />
            )}
            Google로 시작하기
          </button>

          {/* 익명 로그인 */}
          <button
            onClick={handleAnonymous}
            disabled={googleLoading || anonLoading}
            className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-2xl bg-primary text-primary-foreground font-medium text-sm shadow-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {anonLoading ? (
              <Spinner white />
            ) : (
              <span className="text-lg leading-none">👤</span>
            )}
            익명으로 시작하기
          </button>
        </div>

        {/* 익명 안내 */}
        <p className="text-xs text-muted-foreground text-center leading-relaxed">
          익명으로 시작하면 이 기기에서만 나무를 키울 수 있어요.
          <br />
          나중에 Google 계정을 연동해 데이터를 유지할 수 있습니다.
        </p>

        {/* 에러 */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500 text-center"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

// ── 아이콘 ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.7 6c4.5-4.2 7-10.3 7-17.4z"/>
      <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.2z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.7-6c-2 1.4-4.6 2.2-7.5 2.2-6.2 0-11.5-4.2-13.4-9.8l-8.1 6.2C6.6 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

function Spinner({ white }: { white?: boolean }) {
  return (
    <svg
      className={`animate-spin w-4 h-4 ${white ? 'text-white' : 'text-gray-500'}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
