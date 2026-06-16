import { getDb } from "./db";

export interface StoreRow {
  id: number;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  first_round: number | null;
  memo: string | null;
  created_at: string;
}

export interface StoreInput {
  name: string;
  address?: string | null;
  first_round?: number | null;
  memo?: string | null;
}

export function createStore(input: StoreInput): number {
  const name = input.name?.trim();
  if (!name) throw new Error("판매점 이름은 필수입니다");
  const res = getDb()
    .prepare(
      `INSERT INTO stores (name, address, first_round, memo)
       VALUES (@name, @address, @first_round, @memo)`
    )
    .run({
      name,
      address: input.address?.trim() || null,
      first_round: input.first_round ?? null,
      memo: input.memo?.trim() || null,
    });
  return Number(res.lastInsertRowid);
}

export interface StoreWithStats extends StoreRow {
  purchase_count: number;
  winnings: number;
  best_rank: number | null;
}

export function listStores(): StoreWithStats[] {
  return getDb()
    .prepare(
      `SELECT s.*,
              COUNT(DISTINCT p.id) AS purchase_count,
              COALESCE(SUM(r.prize), 0) AS winnings,
              MIN(r.rank) AS best_rank
       FROM stores s
       LEFT JOIN purchases p ON p.store_id = s.id
       LEFT JOIN games g ON g.purchase_id = p.id
       LEFT JOIN results r ON r.game_id = g.id
       GROUP BY s.id
       ORDER BY s.created_at DESC`
    )
    .all() as StoreWithStats[];
}

export function getStore(id: number): StoreRow | undefined {
  return getDb().prepare("SELECT * FROM stores WHERE id = ?").get(id) as
    | StoreRow
    | undefined;
}

export function countStores(): number {
  return (getDb().prepare("SELECT COUNT(*) c FROM stores").get() as { c: number })
    .c;
}
