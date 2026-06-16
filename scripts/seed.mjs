// data/seed/draws.csv → DB(draws 테이블) 일괄 적재. (libSQL)
//   로컬:  node scripts/seed.mjs           → file:data/lotto.db
//   Turso: TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 설정 후 실행 → 원격 DB
import { createClient } from "@libsql/client";
import fs from "node:fs";

const CSV = process.argv[2] ?? "data/seed/draws.csv";
const url = process.env.TURSO_DATABASE_URL ?? "file:data/lotto.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!fs.existsSync(CSV)) {
  console.error(`시드 CSV 없음: ${CSV}`);
  process.exit(1);
}

const db = createClient({ url, authToken });

await db.executeMultiple(`
  CREATE TABLE IF NOT EXISTS draws (
    round INTEGER PRIMARY KEY,
    draw_date TEXT NOT NULL,
    n1 INTEGER NOT NULL, n2 INTEGER NOT NULL, n3 INTEGER NOT NULL,
    n4 INTEGER NOT NULL, n5 INTEGER NOT NULL, n6 INTEGER NOT NULL,
    bonus INTEGER NOT NULL,
    first_winners INTEGER, first_prize INTEGER, total_sales INTEGER,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const SQL = `
  INSERT INTO draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus,
                     first_winners, first_prize, total_sales)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
  ON CONFLICT(round) DO UPDATE SET
    draw_date=excluded.draw_date, n1=excluded.n1, n2=excluded.n2,
    n3=excluded.n3, n4=excluded.n4, n5=excluded.n5, n6=excluded.n6,
    bonus=excluded.bonus, first_winners=excluded.first_winners,
    first_prize=excluded.first_prize, total_sales=excluded.total_sales,
    fetched_at=datetime('now')`;

const num = (v) => (v === "" || v == null ? null : Number(v));
const lines = fs
  .readFileSync(CSV, "utf8")
  .split(/\r?\n/)
  .filter((l) => l.trim());
const start = lines[0].toLowerCase().startsWith("round,") ? 1 : 0;
const rows = lines.slice(start);

const stmts = rows.map((line) => {
  const c = line.split(",").map((s) => s.trim());
  return {
    sql: SQL,
    args: [
      Number(c[0]), c[1],
      Number(c[2]), Number(c[3]), Number(c[4]),
      Number(c[5]), Number(c[6]), Number(c[7]), Number(c[8]),
      num(c[9]), num(c[10]), num(c[11]),
    ],
  };
});

// 원격 부하를 줄이기 위해 청크 단위로 batch.
const CHUNK = 200;
for (let i = 0; i < stmts.length; i += CHUNK) {
  await db.batch(stmts.slice(i, i + CHUNK), "write");
}

const c = await db.execute("SELECT COUNT(*) AS c FROM draws");
console.log(`seeded ${rows.length} rounds → ${url} (총 ${c.rows[0].c}회)`);
