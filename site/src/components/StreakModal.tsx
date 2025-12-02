// StreakModal.tsx
import React from "react";
import { useSettings } from "../stores/settingsStore"; // ✅ add settings import

interface StreakModalProps {
  streakCount: number;
  bonusCoins: number;
  onClose: () => void;
}

const StreakModal: React.FC<StreakModalProps> = ({
  streakCount,
  bonusCoins,
  onClose,
}) => {
  // ✅ pull settings from the hook
  const { settings } = useSettings();

  // ✅ safely gate animations
  const animationsEnabled = settings?.animationsEnabled ?? true;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm text-center relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500"
        >
          ✕
        </button>
        <h2 className="text-2xl font-bold mb-2">🔥 {streakCount}-Day Streak!</h2>
        <p className="text-lg mb-4">
          You earned a bonus of +{bonusCoins} coins!
        </p>
        <div
          className={`text-yellow-400 text-4xl ${
            animationsEnabled ? "animate-bounce" : ""
          } mb-2`}
        >
          ✨ +{bonusCoins} ✨
        </div>
        <button
          onClick={onClose}
          className="mt-4 bg-yellow-400 text-white px-4 py-2 rounded"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default StreakModal;
