// site/src/components/NewBadgeToast.tsx
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../stores/settingsStore";

export const NewBadgeToast = ({ badge, onClose }) => {
  const { settings } = useSettings();

  useEffect(() => {
    if (!badge) return;
    if (!settings.animationsEnabled) return;

    const audio = new Audio("/sounds/unlock.mp3");
    if (settings.soundsEnabled) {
      audio.play().catch(() => {});
    }

    const timeout = setTimeout(() => {
      onClose?.();
    }, 3000);

    return () => clearTimeout(timeout);
  }, [badge, onClose, settings]);

  if (!badge || !settings.animationsEnabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -30 }}
        transition={{ duration: 0.4 }}
        className="badge-toast"
      >
        <div className="badge-toast__content">
          <img src={`/badges/${badge.id}.png`} alt={badge.label} />
          <div className="badge-toast__label">Unlocked: {badge.label}</div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
