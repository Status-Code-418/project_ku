import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import { useLocation } from 'wouter';

export function LoginPromptBanner() {
  const [, navigate] = useLocation();
  const [dismissed, setDismissed] = useState(false);

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-3rem)] max-w-md"
        >
          <div className="glass rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-4">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles size={18} className="text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">로그인하면 더 좋아요</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                어떤 기기에서든 내 나무를 이어서 키울 수 있어요
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                로그인
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-black/5 transition-colors"
                aria-label="닫기"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
