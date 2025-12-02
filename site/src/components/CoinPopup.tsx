import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../stores/settingsStore"; // ✅ use hook from central settings store

const coinSound = new Audio("/sounds/coin.wav"); // make sure this path exists or make it dynamic

interface CoinPopupProps {
  show: boolean;
  amount?: number;
  onClose?: () => void;
}

export default function CoinPopup({ show, amount = 10, onClose }: CoinPopupProps) {
  const { settings } = useSettings();
  const soundsEnabled = settings?.soundsEnabled ?? true;
  const animationsEnabled = settings?.animationsEnabled ?? true;

  React.useEffect(() => {
    if (show && soundsEnabled) {
      coinSound.volume = 0.5;
      coinSound
        .play()
        .catch(() => {
          // swallow autoplay / user gesture errors
        });
    }
  }, [show, soundsEnabled]);

  return (
    <AnimatePresence>
      {show &&
        (animationsEnabled ? (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1.05, opacity: 1 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="coin-popup"
          >
            <div className="coin-popup__inner">
              <div className="coin-popup__emoji">🪙</div>
              <div className="coin-popup__text">+{amount} Coins</div>
            </div>
          </motion.div>
        ) : (
          // non-animated fallback when animations are disabled
          <div className="coin-popup">
            <div className="coin-popup__inner">
              <div className="coin-popup__emoji">🪙</div>
              <div className="coin-popup__text">+{amount} Coins</div>
            </div>
          </div>
        ))}
    </AnimatePresence>
  );
}

const styles = `
.coin-popup {
  position: fixed;
  top: 60px;
  right: 20px;
  z-index: 1000;
  background: linear-gradient(135deg, #fde68a, #facc15);
  padding: 10px 16px;
  border-radius: 14px;
  box-shadow: 0 12px 24px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 8px;
  color: #78350f;
  font-weight: 700;
  font-size: 1rem;
}

.coin-popup__emoji {
  font-size: 1.5rem;
}

.coin-popup__text {
  font-size: 0.95rem;
  font-weight: 600;
}
`;

if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.innerHTML = styles;
  document.head.appendChild(styleTag);
}
