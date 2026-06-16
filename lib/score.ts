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

const RESULT_UPSERT = `
  INSERT INTO results (game_id, round, match_count, bonus_match, rank, prize)
  VALUES (?,?,?,?,?,?)
  ON CONFLICT(game_id) DO UPDATE SET
    round=excluded.round, match_count=excluded.match_count,
    bonus_match=excluded.bonus_match, rank=excluded.rank,
    prize=excluded.prize, scored_at=datetime('now')`;

/**
 * 해당 회차의 모든 게임을 채점해 results에 upsert.
 * 그 회차 당첨번호(draws)가 없으면 0. (당첨번호/구매 등록 양쪽에서 호출, 멱등)
 */
export async function scoreRound(round: number): Promise<number> {
  const db = await getDb();
  const drs = await db.execute({
    sql: "SELECT n1,n2,n3,n4,n5,n6,bonus,first_prize FROM draws WHERE round=?",
    args: [round],
  });
  const draw = drs.rows[0] as unknown as DrawRowMin | undefined;
  if (!draw) return 0;

  const winning = [draw.n1, draw.n2, draw.n3, draw.n4, draw.n5, draw.n6];
  const grs = await db.execute({
    sql: `SELECT g.id, g.n1, g.n2, g.n3, g.n4, g.n5, g.n6
          FROM games g JOIN purchases p ON p.id = g.purchase_id
          WHERE p.round = ?`,
    args: [round],
  });
  const games = grs.rows as unknown as GameRowMin[];
  if (games.length === 0) return 0;

  const stmts = games.map((g) => {
    const s = scoreGame([g.n1, g.n2, g.n3, g.n4, g.n5, g.n6], {
      numbers: winning,
      bonus: draw.bonus,
    });
    return {
      sql: RESULT_UPSERT,
      args: [
        g.id,
        round,
        s.matchCount,
        s.bonusMatch ? 1 : 0,
        s.rank,
        prizeFor(s.rank, draw.first_prize),
      ],
    };
  });
  await db.batch(stmts, "write");
  return games.length;
}

/** 구매가 존재하는 모든 회차를 재채점. (CSV 일괄 import 후 등) */
export async function scoreAllPurchasedRounds(): Promise<number> {
  const db = await getDb();
  const rs = await db.execute("SELECT DISTINCT round FROM purchases");
  let n = 0;
  for (const row of rs.rows) n += await scoreRound(row.round as number);
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
export async function resultsOfPurchase(
  purchaseId: number
): Promise<Map<number, GameResult>> {
  const db = await getDb();
  const rs = await db.execute({
    sql: `SELECT r.game_id, r.match_count, r.bonus_match, r.rank, r.prize
          FROM results r JOIN games g ON g.id = r.game_id
          WHERE g.purchase_id = ?`,
    args: [purchaseId],
  });
  const rows = rs.rows as unknown as GameResult[];
  return new Map(rows.map((r) => [r.game_id, r]));
}

export interface RoiSummary {
  spent: number;
  winnings: number;
  scoredGames: number;
  winningGames: number;
  net: number;
  roiPct: number | null;
}

/** 전체 ROI 요약(지출 대비 당첨금). */
export async function roiSummary(): Promise<RoiSummary> {
  const db = await getDb();
  const srs = await db.execute(
    "SELECT COALESCE(SUM(amount),0) AS s FROM purchases"
  );
  const spent = (srs.rows[0]?.s as number) ?? 0;
  const wrs = await db.execute(
    `SELECT COALESCE(SUM(prize),0) AS winnings,
            COUNT(*) AS scored,
            COALESCE(SUM(CASE WHEN rank IS NOT NULL THEN 1 ELSE 0 END),0) AS won
     FROM results`
  );
  const w = wrs.rows[0] as unknown as {
    winnings: number;
    scored: number;
    won: number;
  };
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
export async function resultsByRound(): Promise<RoundResult[]> {
  const db = await getDb();
  const rs = await db.execute(
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
  );
  return rs.rows as unknown as RoundResult[];
}
