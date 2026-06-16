import { getDb } from "./db";
import { assertSixNumbers } from "./validate";

export type GameMode = "auto" | "manual" | "semi";

export interface GameInput {
  slot?: string | null; // A~E
  mode: GameMode;
  numbers: number[]; // 6개
}

export interface PurchaseInput {
  round: number;
  store_id?: number | null;
  purchase_date?: string | null; // YYYY-MM-DD
  amount?: number;
  memo?: string | null;
  games: GameInput[];
}

/** 구매 1건 + 게임들을 한 트랜잭션으로 저장. purchase id 반환. */
export function createPurchase(input: PurchaseInput): number {
  if (!Number.isInteger(input.round) || input.round < 1)
    throw new Error("회차를 올바르게 입력하세요");
  if (!input.games?.length) throw new Error("게임을 1줄 이상 입력하세요");
  input.games.forEach((g, i) => {
    try {
      assertSixNumbers(g.numbers);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      throw new Error(`${g.slot ?? i + 1}번 게임: ${msg}`);
    }
  });

  const db = getDb();
  const tx = db.transaction((p: PurchaseInput) => {
    const pres = db
      .prepare(
        `INSERT INTO purchases (round, store_id, purchase_date, amount, memo)
         VALUES (@round, @store_id, @purchase_date, @amount, @memo)`
      )
      .run({
        round: p.round,
        store_id: p.store_id ?? null,
        purchase_date: p.purchase_date ?? null,
        amount: p.amount ?? p.games.length * 1000,
        memo: p.memo?.trim() || null,
      });
    const purchaseId = Number(pres.lastInsertRowid);

    const gstmt = db.prepare(
      `INSERT INTO games (purchase_id, slot, mode, n1, n2, n3, n4, n5, n6)
       VALUES (?,?,?,?,?,?,?,?,?)`
    );
    for (const g of p.games) {
      const sorted = [...g.numbers].sort((a, b) => a - b);
      gstmt.run(purchaseId, g.slot ?? null, g.mode, ...sorted);
    }
    return purchaseId;
  });
  return tx(input);
}

export interface PurchaseListRow {
  id: number;
  round: number;
  purchase_date: string | null;
  amount: number;
  store_name: string | null;
  game_count: number;
  created_at: string;
}

export function listPurchases(limit = 50, offset = 0): PurchaseListRow[] {
  return getDb()
    .prepare(
      `SELECT p.id, p.round, p.purchase_date, p.amount, p.created_at,
              s.name AS store_name,
              COUNT(g.id) AS game_count
       FROM purchases p
       LEFT JOIN stores s ON s.id = p.store_id
       LEFT JOIN games g ON g.purchase_id = p.id
       GROUP BY p.id
       ORDER BY p.round DESC, p.id DESC
       LIMIT ? OFFSET ?`
    )
    .all(limit, offset) as PurchaseListRow[];
}

export interface GameRow {
  id: number;
  slot: string | null;
  mode: GameMode;
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
}

export function gamesOfPurchase(purchaseId: number): GameRow[] {
  return getDb()
    .prepare(
      `SELECT id, slot, mode, n1, n2, n3, n4, n5, n6
       FROM games WHERE purchase_id = ? ORDER BY id`
    )
    .all(purchaseId) as GameRow[];
}

export function countPurchases(): number {
  return (
    getDb().prepare("SELECT COUNT(*) c FROM purchases").get() as { c: number }
  ).c;
}

export function totalSpent(): number {
  return (
    getDb().prepare("SELECT COALESCE(SUM(amount),0) s FROM purchases").get() as {
      s: number;
    }
  ).s;
}
