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

const UPSERT_SQL = `
  INSERT INTO draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus,
                     first_winners, first_prize, total_sales)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(round) DO UPDATE SET
    draw_date=excluded.draw_date, n1=excluded.n1, n2=excluded.n2,
    n3=excluded.n3, n4=excluded.n4, n5=excluded.n5, n6=excluded.n6,
    bonus=excluded.bonus, first_winners=excluded.first_winners,
    first_prize=excluded.first_prize, total_sales=excluded.total_sales,
    fetched_at=datetime('now')`;

function upsertArgs(r: DrawRow) {
  return [
    r.round,
    r.draw_date,
    r.n1,
    r.n2,
    r.n3,
    r.n4,
    r.n5,
    r.n6,
    r.bonus,
    r.first_winners,
    r.first_prize,
    r.total_sales,
  ];
}

/** 회차별 당첨 결과 upsert(일괄). */
export async function upsertDraws(rows: DrawRow[]): Promise<number> {
  if (rows.length === 0) return 0;
  const db = await getDb();
  await db.batch(
    rows.map((r) => ({ sql: UPSERT_SQL, args: upsertArgs(r) })),
    "write"
  );
  return rows.length;
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
export async function addManualDraw(input: ManualDrawInput): Promise<void> {
  if (!Number.isInteger(input.round) || input.round < 1)
    throw new Error("회차를 올바르게 입력하세요");
  if (!input.draw_date) throw new Error("추첨일을 입력하세요");
  assertWithBonus(input.numbers, input.bonus);
  const n = [...input.numbers].sort((a, b) => a - b);
  await upsertDraws([
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

export async function getDraw(round: number): Promise<DrawRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM draws WHERE round = ?",
    args: [round],
  });
  return rs.rows[0] as unknown as DrawRow | undefined;
}

export async function latestRound(): Promise<number> {
  const db = await getDb();
  const rs = await db.execute("SELECT MAX(round) AS m FROM draws");
  return (rs.rows[0]?.m as number | null) ?? 0;
}

export async function countDraws(): Promise<number> {
  const db = await getDb();
  const rs = await db.execute("SELECT COUNT(*) AS c FROM draws");
  return (rs.rows[0]?.c as number) ?? 0;
}

export async function listDraws(limit = 50, offset = 0): Promise<DrawRow[]> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM draws ORDER BY round DESC LIMIT ? OFFSET ?",
    args: [limit, offset],
  });
  return rs.rows as unknown as DrawRow[];
}
