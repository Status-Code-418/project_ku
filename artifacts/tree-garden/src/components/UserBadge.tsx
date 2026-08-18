import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'wouter';

export function UserBadge() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!user) return null;

  const isAnonymous = user.isAnonymous;
  const displayName = isAnonymous ? '익명 사용자' : (user.displayName ?? user.email ?? '사용자');
  const photoURL = user.photoURL;

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      setMenuOpen(false);
      await signOut();
      navigate('/login');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setMenuOpen((v) => !v)}
        className="glass rounded-2xl px-3 py-2 flex items-center gap-2.5 shadow-lg text-foreground hover:bg-white/20 transition-colors"
      >
        {/* 아바타 */}
        {photoURL ? (
          <img src={photoURL} alt="avatar" className="w-6 h-6 rounded-full object-cover" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
            <User size={13} className="text-primary" />
          </div>
        )}
        <span className="text-xs font-medium max-w-[100px] truncate">
          {displayName}
        </span>
      </button>

      {/* 드롭다운 메뉴 */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* 백드롭 */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-20 glass rounded-2xl p-2 shadow-xl min-w-[160px]"
            >
              {isAnonymous && (
                <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border/50 mb-1">
                  익명 계정은 이 기기에서만 유지됩니다
                </div>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
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
