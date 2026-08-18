import { motion, AnimatePresence } from 'framer-motion';
import { useFirebaseHome } from '../hooks/useFirebaseHome';

export function HomeNameBadge() {
  const { data, loading } = useFirebaseHome();

  return (
    <AnimatePresence>
      {!loading && data?.name && (
        <motion.div
          key={data.name}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="glass rounded-2xl px-4 py-2.5 shadow-lg text-foreground"
        >
          <span className="text-sm font-semibold tracking-wide">
            {data.name}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
