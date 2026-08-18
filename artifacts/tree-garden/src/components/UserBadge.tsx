import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, LogIn, ChevronDown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

export function UserBadge() {
  const { user, loading, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (loading) return null;

  // ── 비로그인 상태 ─────────────────────────────────────
  if (!user) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate('/login')}
        className="glass rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-lg text-foreground hover:bg-white/30 transition-colors"
      >
        <LogIn size={14} className="text-primary" />
        <span className="text-xs font-semibold">로그인</span>
      </motion.button>
    );
  }

  // ── 로그인 상태 ───────────────────────────────────────
  const isAnonymous = user.isAnonymous;
  const displayName = isAnonymous ? '익명 사용자' : (user.displayName ?? user.email ?? '사용자');
  const photoURL = user.photoURL;
  const initial = displayName.charAt(0).toUpperCase();

  const handleSignOut = async () => {
    setMenuOpen(false);
    setSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setMenuOpen((v) => !v)}
        className="glass rounded-2xl pl-2 pr-3 py-1.5 flex items-center gap-2.5 shadow-lg text-foreground hover:bg-white/30 transition-colors"
      >
        {/* 아바타 */}
        {photoURL ? (
          <img src={photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover ring-2 ring-white/40" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold ring-2 ring-white/40">
            {initial}
          </div>
        )}

        <div className="flex flex-col items-start leading-tight">
          <span className="text-xs font-semibold max-w-[100px] truncate text-foreground">
            {displayName}
          </span>
          {!isAnonymous && user.email && (
            <span className="text-[10px] text-muted-foreground max-w-[100px] truncate">
              {user.email}
            </span>
          )}
          {isAnonymous && (
            <span className="text-[10px] text-amber-500">익명 계정</span>
          )}
        </div>

        <ChevronDown size={12} className={`text-muted-foreground transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* 드롭다운 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-20 glass rounded-2xl overflow-hidden shadow-xl min-w-[180px]"
            >
              {/* 프로필 요약 */}
              <div className="px-4 py-3 border-b border-border/50 flex items-center gap-3">
                {photoURL ? (
                  <img src={photoURL} alt="avatar" className="w-9 h-9 rounded-full object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
                    {initial}
                  </div>
                )}
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-semibold text-foreground truncate max-w-[110px]">{displayName}</span>
                  {user.email && <span className="text-xs text-muted-foreground truncate max-w-[110px]">{user.email}</span>}
                </div>
              </div>

              {/* 로그아웃 */}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
              >
                <LogOut size={14} />
                {signingOut ? '로그아웃 중...' : '로그아웃'}
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
