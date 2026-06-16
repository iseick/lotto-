import { getDb } from "./db";
import { scoreGame, FIXED_PRIZE } from "./scoring";

/** 등수별 당첨금(1게임당). 1등은 회차 실제 상금, 4·5등은 고정, 2·3등은 미산정(0). */
function prizeFor(rank: number | null, firstPrize: number | null): number {
  if (rank == null) return 0;
  if (rank === 1) return firstPrize ?? 0;
  return FIXED_PRIZE[rank] ?? 0; // 4등 50,000 / 5등 5,000 / 2·3등 0
}

/** 2·3등은 회차별 상금 데이터가 없어 당첨금을 산정하지 못한다(등수만 기록). */
export function isPrizeEstimable(rank: number | null): boolean {
  return rank == null || rank === 1 || rank === 4 || rank === 5;
}

interface DrawRowMin {
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number;
  first_prize: number | null;
}

interface GameRowMin {
  id: number;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
}

/**
 * 해당 회차의 모든 게임을 채점해 results에 upsert.
 * 그 회차 당첨번호(draws)가 없으면 채점 불가 → 0 반환.
 * 당첨번호/구매 등록 양쪽에서 호출(멱등).
 */
export function scoreRound(round: number): number {
  const db = getDb();
  const draw = db
    .prepare(
      "SELECT n1,n2,n3,n4,n5,n6,bonus,first_prize FROM draws WHERE round=?"
    )
    .get(round) as DrawRowMin | undefined;
  if (!draw) return 0;

  const winning = [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6];
  const games = db
    .prepare(
      `SELECT g.id, g.n1, g.n2, g.n3, g.n4, g.n5, g.n6
       FROM games g JOIN purchases p ON p.id = g.purchase_id
       WHERE p.round = ?`
    )
    .all(round) as GameRowMin[];
  if (games.length === 0) return 0;

  const stmt = db.prepare(
    `INSERT INTO results (game_id, round, match_count, bonus_match, rank, prize)
     VALUES (@game_id, @round, @match_count, @bonus_match, @rank, @prize)
     ON CONFLICT(game_id) DO UPDATE SET
       round=@round, match_count=@match_count, bonus_match=@bonus_match,
       rank=@rank, prize=@prize, scored_at=datetime('now')`
  );

  const tx = db.transaction((rows: GameRowMin[]) => {
    for (const g of rows) {
      const s = scoreGame([g.n1, g.n2, g.n3, g.n4, g.n5, g.n6], {
        numbers: winning,
        bonus: draw.bonus,
      });
      stmt.run({
        game_id: g.id,
        round,
        match_count: s.matchCount,
        bonus_match: s.bonusMatch ? 1 : 0,
        rank: s.rank,
        prize: prizeFor(s.rank, draw.first_prize),
      });
    }
    return rows.length;
  });
  return tx(games);
}

/** 구매가 존재하는 모든 회차를 재채점. (CSV 일괄 import 후 등) */
export function scoreAllPurchasedRounds(): number {
  const rounds = getDb()
    .prepare("SELECT DISTINCT round FROM purchases")
    .all() as { round: number }[];
  let n = 0;
  for (const { round } of rounds) n += scoreRound(round);
  return n;
}

export interface GameResult {
  game_id: number;
  match_count: number;
  bonus_match: number;
  rank: number | null;
  prize: number;
}

/** 구매 1건의 게임별 채점 결과 맵(game_id → 결과). 미채점이면 비어 있음. */
export function resultsOfPurchase(purchaseId: number): Map<number, GameResult> {
  const rows = getDb()
    .prepare(
      `SELECT r.game_id, r.match_count, r.bonus_match, r.rank, r.prize
       FROM results r JOIN games g ON g.id = r.game_id
       WHERE g.purchase_id = ?`
    )
    .all(purchaseId) as GameResult[];
  return new Map(rows.map((r) => [r.game_id, r]));
}

export interface RoiSummary {
  spent: number;
  winnings: number;
  scoredGames: number;
  winningGames: number;
  net: number;
  roiPct: number | null; // 수익률 %, 지출 0이면 null
}

/** 전체 ROI 요약(지출 대비 당첨금). */
export function roiSummary(): RoiSummary {
  const db = getDb();
  const spent = (
    db.prepare("SELECT COALESCE(SUM(amount),0) s FROM purchases").get() as {
      s: number;
    }
  ).s;
  const w = db
    .prepare(
      `SELECT COALESCE(SUM(prize),0) winnings,
              COUNT(*) scored,
              COALESCE(SUM(CASE WHEN rank IS NOT NULL THEN 1 ELSE 0 END),0) won
       FROM results`
    )
    .get() as { winnings: number; scored: number; won: number };
  return {
    spent,
    winnings: w.winnings,
    scoredGames: w.scored,
    winningGames: w.won,
    net: w.winnings - spent,
    roiPct: spent > 0 ? (w.winnings / spent) * 100 - 100 : null,
  };
}

export interface RoundResult {
  round: number;
  draw_date: string | null;
  games: number;
  best_rank: number | null;
  winnings: number;
}

/** 회차별 내 적중 요약(구매가 있는 회차만). */
export function resultsByRound(): RoundResult[] {
  return getDb()
    .prepare(
      `SELECT p.round,
              d.draw_date,
              COUNT(g.id) AS games,
              MIN(r.rank) AS best_rank,
              COALESCE(SUM(r.prize),0) AS winnings
       FROM purchases p
       JOIN games g ON g.purchase_id = p.id
       LEFT JOIN results r ON r.game_id = g.id
       LEFT JOIN draws d ON d.round = p.round
       GROUP BY p.round
       ORDER BY p.round DESC`
    )
    .all() as RoundResult[];
}
