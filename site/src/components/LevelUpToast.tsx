import { motion, AnimatePresence } from "framer-motion";

export default function LevelUpToast({ show, level }: { show: boolean; level: number }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 20, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 250, damping: 20 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl px-5 py-3 shadow-xl bg-white/90 backdrop-blur border"
        >
          <div className="text-sm">Level up!</div>
          <div className="text-xl font-semibold">You reached level {level} 🎉</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
