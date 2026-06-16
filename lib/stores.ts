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

export async function createStore(input: StoreInput): Promise<number> {
  const name = input.name?.trim();
  if (!name) throw new Error("판매점 이름은 필수입니다");
  const db = await getDb();
  const rs = await db.execute({
    sql: `INSERT INTO stores (name, address, first_round, memo)
          VALUES (?, ?, ?, ?)`,
    args: [
      name,
      input.address?.trim() || null,
      input.first_round ?? null,
      input.memo?.trim() || null,
    ],
  });
  return Number(rs.lastInsertRowid);
}

export interface StoreWithStats extends StoreRow {
  purchase_count: number;
  winnings: number;
  best_rank: number | null;
}

export async function listStores(): Promise<StoreWithStats[]> {
  const db = await getDb();
  const rs = await db.execute(
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
  );
  return rs.rows as unknown as StoreWithStats[];
}

export async function getStore(id: number): Promise<StoreRow | undefined> {
  const db = await getDb();
  const rs = await db.execute({
    sql: "SELECT * FROM stores WHERE id = ?",
    args: [id],
  });
  return rs.rows[0] as unknown as StoreRow | undefined;
}

export async function countStores(): Promise<number> {
  const db = await getDb();
  const rs = await db.execute("SELECT COUNT(*) AS c FROM stores");
  return (rs.rows[0]?.c as number) ?? 0;
}
