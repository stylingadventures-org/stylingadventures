// /site/src/logic/dailyTaskLogic.ts

import { coinValues, CoinSources } from './coinRules';

export const DailyTasks = {
  LOGIN: 'login',
  LIKE_ITEM: 'likeItem',
  RATE_OOTD: 'rateOOTD',
  MINI_GAME: 'miniGame',
};

export function getDailyTasks() {
  return [
    {
      id: DailyTasks.LIKE_ITEM,
      label: 'Like an Item in Lala’s Closet',
      coins: coinValues[CoinSources.LIKE_ITEM],
    },
    {
      id: DailyTasks.RATE_OOTD,
      label: 'Rate the Outfit of the Day',
      coins: coinValues[CoinSources.RATE_OOTD],
    },
    {
      id: DailyTasks.MINI_GAME,
      label: 'Play the Fashion Mini-Game',
      coins: coinValues[CoinSources.MINI_GAME],
    },
  ];
}

export function getTaskReward(taskId: string): number {
  switch (taskId) {
    case DailyTasks.LOGIN:
      return coinValues[CoinSources.LOGIN];
    case DailyTasks.LIKE_ITEM:
      return coinValues[CoinSources.LIKE_ITEM];
    case DailyTasks.RATE_OOTD:
      return coinValues[CoinSources.RATE_OOTD];
    case DailyTasks.MINI_GAME:
      return coinValues[CoinSources.MINI_GAME];
    default:
      return 0;
  }
}

export function getStreakBonus(day: number): number {
  return coinValues[CoinSources.STREAK_BONUS][day] || 0;
}
