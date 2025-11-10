// site/src/features/game/useGame.ts
import { useState } from 'react';
export function useGame() {
  const [xp, setXp] = useState(0);
  const [coins, setCoins] = useState(0);
  const [leaderboard, setLeaderboard] = useState<{name:string; score:number}[]>([]);

  const styleIt = (playerName: string, top: string, bottom: string, shoes: string) => {
    const score = (top.length + bottom.length + shoes.length) % 100; // simple local scoring
    setXp(x => x + score);
    setCoins(c => c + Math.floor(score/10));
    setLeaderboard(lb => [{ name: playerName, score }, ...lb].slice(0, 10));
  };

  return { xp, coins, leaderboard, styleIt };
}
