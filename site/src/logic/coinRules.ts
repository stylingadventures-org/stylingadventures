// /site/src/logic/coinRules.ts

export const CoinSources = {
  LOGIN: 'login',
  LIKE_ITEM: 'likeItem',
  RATE_OOTD: 'rateOOTD',
  MINI_GAME: 'miniGame',
  STREAK_BONUS: 'streakBonus',
  BADGE: 'badge',
  BESTIE_BONUS: 'bestieBonus',
};

export const coinValues = {
  [CoinSources.LOGIN]: 10,
  [CoinSources.LIKE_ITEM]: 5,
  [CoinSources.RATE_OOTD]: 10,
  [CoinSources.MINI_GAME]: 20,
  [CoinSources.STREAK_BONUS]: {
    7: 25, // Day 7 streak bonus
    14: 50,
    30: 100,
  },
  [CoinSources.BADGE]: {
    firstWeekFan: 50,
    styleChampion: 100,
  },
  [CoinSources.BESTIE_BONUS]: 300,
};
