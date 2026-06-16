// 로또 6/45 채점 규칙.

export interface DrawNumbers {
  numbers: number[]; // 당첨 일반번호 6개
  bonus: number;
}

export interface Score {
  matchCount: number; // 일반번호 일치 개수 0~6
  bonusMatch: boolean;
  rank: number | null; // 1~5, null=미당첨
}

/** 등수 판정: 6=1등, 5+보너스=2등, 5=3등, 4=4등, 3=5등. */
export function scoreGame(game: number[], draw: DrawNumbers): Score {
  const winSet = new Set(draw.numbers);
  const matchCount = game.filter((n) => winSet.has(n)).length;
  const bonusMatch = game.includes(draw.bonus);

  let rank: number | null = null;
  if (matchCount === 6) rank = 1;
  else if (matchCount === 5 && bonusMatch) rank = 2;
  else if (matchCount === 5) rank = 3;
  else if (matchCount === 4) rank = 4;
  else if (matchCount === 3) rank = 5;

  return { matchCount, bonusMatch, rank };
}

/** 4~5등 고정 당첨금 (1~3등은 회차별 변동이라 별도 처리). */
export const FIXED_PRIZE: Record<number, number> = {
  4: 50000,
  5: 5000,
};
