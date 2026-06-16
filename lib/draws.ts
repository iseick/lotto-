import { getDb } from "./db";
import { assertWithBonus } from "./validate";

export interface DrawRow {
  round: number;
  draw_date: string; // YYYY-MM-DD
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number;
  first_winners: number | null;
  first_prize: number | null;
  total_sales: number | null;
}

/** 회차별 당첨 결과 upsert. 트랜잭션으로 일괄 처리. */
export function upsertDraws(rows: DrawRow[]): number {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus,
                        first_winners, first_prize, total_sales)
     VALUES (@round, @draw_date, @n1, @n2, @n3, @n4, @n5, @n6, @bonus,
             @first_winners, @first_prize, @total_sales)
     ON CONFLICT(round) DO UPDATE SET
       draw_date=@draw_date, n1=@n1, n2=@n2, n3=@n3, n4=@n4, n5=@n5, n6=@n6,
       bonus=@bonus, first_winners=@first_winners, first_prize=@first_prize,
       total_sales=@total_sales, fetched_at=datetime('now')`
  );
  const tx = db.transaction((items: DrawRow[]) => {
    for (const r of items) stmt.run(r);
    return items.length;
  });
  return tx(rows);
}

export interface ManualDrawInput {
  round: number;
  draw_date: string;
  numbers: number[]; // 6개
  bonus: number;
  first_winners?: number | null;
  first_prize?: number | null;
  total_sales?: number | null;
}

/** 주간 당첨번호 수동 입력(단일 회차). 번호 무결성 검증 후 upsert. */
export function addManualDraw(input: ManualDrawInput): void {
  if (!Number.isInteger(input.round) || input.round < 1)
    throw new Error("회차를 올바르게 입력하세요");
  if (!input.draw_date) throw new Error("추첨일을 입력하세요");
  assertWithBonus(input.numbers, input.bonus);
  const n = [...input.numbers].sort((a, b) => a - b);
  upsertDraws([
    {
      round: input.round,
      draw_date: input.draw_date,
      n1: n[0],
      n2: n[1],
      n3: n[2],
      n4: n[3],
      n5: n[4],
      n6: n[5],
      bonus: input.bonus,
      first_winners: input.first_winners ?? null,
      first_prize: input.first_prize ?? null,
      total_sales: input.total_sales ?? null,
    },
  ]);
}

export function getDraw(round: number): DrawRow | undefined {
  return getDb()
    .prepare("SELECT * FROM draws WHERE round = ?")
    .get(round) as DrawRow | undefined;
}

export function latestRound(): number {
  const row = getDb()
    .prepare("SELECT MAX(round) AS m FROM draws")
    .get() as { m: number | null };
  return row.m ?? 0;
}

export function countDraws(): number {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS c FROM draws")
    .get() as { c: number };
  return row.c;
}

export function listDraws(limit = 50, offset = 0): DrawRow[] {
  return getDb()
    .prepare("SELECT * FROM draws ORDER BY round DESC LIMIT ? OFFSET ?")
    .all(limit, offset) as DrawRow[];
}
