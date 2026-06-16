// data/seed/draws.csv → data/lotto.db (draws 테이블) 일괄 적재.
// dev 서버 없이 백필할 때 사용. 앱의 lib/db.ts 와 동일한 draws DDL 사용(멱등).
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const CSV = process.argv[2] ?? "data/seed/draws.csv";
const DB_PATH = "data/lotto.db";

if (!fs.existsSync(CSV)) {
  console.error(`시드 CSV 없음: ${CSV}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// lib/db.ts 의 draws 정의와 동일.
db.exec(`
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

const text = fs.readFileSync(CSV, "utf8");
const lines = text.split(/\r?\n/).filter((l) => l.trim());
const start = lines[0].toLowerCase().startsWith("round,") ? 1 : 0;

const stmt = db.prepare(
  `INSERT INTO draws (round, draw_date, n1, n2, n3, n4, n5, n6, bonus,
                      first_winners, first_prize, total_sales)
   VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
   ON CONFLICT(round) DO UPDATE SET
     draw_date=excluded.draw_date, n1=excluded.n1, n2=excluded.n2,
     n3=excluded.n3, n4=excluded.n4, n5=excluded.n5, n6=excluded.n6,
     bonus=excluded.bonus, first_winners=excluded.first_winners,
     first_prize=excluded.first_prize, total_sales=excluded.total_sales,
     fetched_at=datetime('now')`
);

const num = (v) => (v === "" || v == null ? null : Number(v));
const tx = db.transaction((rows) => {
  let n = 0;
  for (const line of rows) {
    const c = line.split(",").map((s) => s.trim());
    stmt.run(
      Number(c[0]), c[1],
      Number(c[2]), Number(c[3]), Number(c[4]),
      Number(c[5]), Number(c[6]), Number(c[7]), Number(c[8]),
      num(c[9]), num(c[10]), num(c[11])
    );
    n++;
  }
  return n;
});

const imported = tx(lines.slice(start));
const count = db.prepare("SELECT COUNT(*) c FROM draws").get().c;
console.log(`seeded ${imported} rounds → ${DB_PATH} (총 ${count}회)`);
