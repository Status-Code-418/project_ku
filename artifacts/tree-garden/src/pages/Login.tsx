import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type Tab = 'login' | 'signup';

export default function Login() {
  const { signInWithGoogle, signInAnonymously, signInWithEmail, signUpWithEmail, user } = useAuth();
  const [, navigate] = useLocation();

  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState<'google' | 'anon' | 'email' | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인 상태면 홈으로 (렌더 중 navigate 금지 → useEffect 사용)
  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  if (user) return null;

  const clearError = () => setError(null);

  // ── 에러 메시지 한국어 변환 ──────────────────────────
  const toKorean = (msg: string) => {
    if (msg.includes('user-not-found') || msg.includes('invalid-credential')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (msg.includes('email-already-in-use')) return '이미 사용 중인 이메일입니다.';
    if (msg.includes('weak-password')) return '비밀번호는 6자 이상이어야 합니다.';
    if (msg.includes('invalid-email')) return '올바른 이메일 형식이 아닙니다.';
    if (msg.includes('too-many-requests')) return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
    if (msg.includes('operation-not-allowed')) return '이 로그인 방식이 Firebase에서 비활성화되어 있습니다.';
    if (msg.includes('popup-closed')) return null; // 조용히 무시
    return '오류가 발생했습니다. 다시 시도해주세요.';
  };

  const run = async (key: typeof loading, fn: () => Promise<void>) => {
    clearError();
    setLoading(key);
    try {
      await fn();
      navigate('/');
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e);
      const kr = toKorean(raw);
      if (kr) setError(kr);
    } finally {
      setLoading(null);
    }
  };

  const handleEmail = () => {
    if (!email || !password) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    if (tab === 'signup' && !displayName) { setError('이름을 입력해주세요.'); return; }
    run('email', () =>
      tab === 'login'
        ? signInWithEmail(email, password)
        : signUpWithEmail(email, password, displayName),
    );
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #b7d9b0 0%, #e8f5e1 40%, #c8e6c2 100%)' }}
    >
      {/* 배경 장식 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-green-200/40 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-emerald-200/40 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative glass rounded-3xl p-8 w-full max-w-sm shadow-2xl flex flex-col items-center gap-5"
      >
        {/* 로고 */}
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-5xl select-none">🌱</span>
          <h1 className="text-xl font-bold text-foreground tracking-tight">나무 정원</h1>
          <p className="text-xs text-muted-foreground">나만의 나무를 키워보세요</p>
        </div>

        {/* 탭 */}
        <div className="w-full flex bg-muted/40 rounded-2xl p-1 gap-1">
          {(['login', 'signup'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); clearError(); }}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t
                  ? 'bg-background shadow text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 이메일 폼 */}
        <div className="w-full flex flex-col gap-2.5">
          <AnimatePresence>
            {tab === 'signup' && (
              <motion.input
                key="displayName"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                type="text"
                placeholder="이름"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            )}
          </AnimatePresence>

          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
            className="w-full px-4 py-3 rounded-2xl border border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEmail()}
              className="w-full px-4 py-3 pr-11 rounded-2xl border border-border bg-background/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button
            onClick={handleEmail}
            disabled={loading !== null}
            className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50"
          >
            {loading === 'email'
              ? <Spinner white />
              : tab === 'login' ? '로그인' : '회원가입'}
          </button>
        </div>

        {/* 구분선 */}
        <div className="w-full flex items-center gap-3">
          <div className="flex-1 h-px bg-border/60" />
          <span className="text-xs text-muted-foreground">또는</span>
          <div className="flex-1 h-px bg-border/60" />
        </div>

        {/* 소셜 버튼 */}
        <div className="w-full flex flex-col gap-2">
          <button
            onClick={() => run('google', signInWithGoogle)}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-2xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-medium text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {loading === 'google' ? <Spinner /> : <GoogleIcon />}
            Google로 시작하기
          </button>

          <button
            onClick={() => run('anon', signInAnonymously)}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-5 py-2.5 rounded-2xl bg-muted/50 hover:bg-muted/70 border border-border text-foreground font-medium text-sm transition-all disabled:opacity-50"
          >
            {loading === 'anon' ? <Spinner /> : <span className="text-base leading-none">👤</span>}
            익명으로 시작하기
          </button>
        </div>

        {/* 에러 */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-red-500 text-center w-full"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ── 아이콘 ──────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.4 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.2-.4-4.7H24v8.9h12.7c-.6 3-2.3 5.5-4.9 7.2l7.7 6c4.5-4.2 7-10.3 7-17.4z"/>
      <path fill="#FBBC05" d="M10.6 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.8l8.1-6.2z"/>
      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.7-6c-2 1.4-4.6 2.2-7.5 2.2-6.2 0-11.5-4.2-13.4-9.8l-8.1 6.2C6.6 42.6 14.6 48 24 48z"/>
    </svg>
  );
}

function Spinner({ white }: { white?: boolean }) {
  return (
    <svg className={`animate-spin w-4 h-4 ${white ? 'text-white' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}
