import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

// SQLite 파일은 프로젝트 루트의 data/ 에 저장한다.
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "lotto.db");

let _db: Database.Database | null = null;

/** 싱글턴 DB 핸들. 최초 호출 시 스키마를 보장한다. */
export function getDb(): Database.Database {
  if (_db) return _db;

  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

/** 스키마 생성 (멱등). */
function migrate(db: Database.Database): void {
  db.exec(`
    -- 판매점 마스터. 매주 새 판매점 방문이 핵심이라 별도 관리한다.
    CREATE TABLE IF NOT EXISTS stores (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      address     TEXT,
      lat         REAL,
      lng         REAL,
      first_round INTEGER,                       -- 최초 방문(구매) 회차
      memo        TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(name, address)
    );

    -- 회차별 공식 당첨 결과 (동행복권에서 수집).
    CREATE TABLE IF NOT EXISTS draws (
      round         INTEGER PRIMARY KEY,          -- 회차
      draw_date     TEXT    NOT NULL,             -- 추첨일 YYYY-MM-DD
      n1 INTEGER NOT NULL, n2 INTEGER NOT NULL, n3 INTEGER NOT NULL,
      n4 INTEGER NOT NULL, n5 INTEGER NOT NULL, n6 INTEGER NOT NULL,
      bonus         INTEGER NOT NULL,             -- 보너스 번호
      first_winners INTEGER,                      -- 1등 당첨자 수
      first_prize   INTEGER,                      -- 1등 1게임당 당첨금
      total_sales   INTEGER,                      -- 총 판매금액
      fetched_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- 구매 1건(영수증). 보통 5,000원 = 게임 5개.
    CREATE TABLE IF NOT EXISTS purchases (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      round         INTEGER NOT NULL,             -- 응모(추첨) 회차
      store_id      INTEGER REFERENCES stores(id) ON DELETE SET NULL,
      purchase_date TEXT,                         -- 구매일 YYYY-MM-DD
      amount        INTEGER NOT NULL DEFAULT 5000,
      memo          TEXT,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- 게임 1줄(1,000원 = 번호 6개).
    CREATE TABLE IF NOT EXISTS games (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      slot        TEXT,                           -- A~E
      mode        TEXT NOT NULL DEFAULT 'auto',   -- auto | manual | semi
      n1 INTEGER NOT NULL, n2 INTEGER NOT NULL, n3 INTEGER NOT NULL,
      n4 INTEGER NOT NULL, n5 INTEGER NOT NULL, n6 INTEGER NOT NULL
    );

    -- 게임 × 회차 채점 결과 (게임당 1행).
    CREATE TABLE IF NOT EXISTS results (
      game_id     INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
      round       INTEGER NOT NULL,
      match_count INTEGER NOT NULL,               -- 일반 번호 일치 개수 0~6
      bonus_match INTEGER NOT NULL DEFAULT 0,     -- 보너스 일치 0/1
      rank        INTEGER,                        -- 1~5, NULL=미당첨
      prize       INTEGER NOT NULL DEFAULT 0,     -- 해당 게임 당첨금
      scored_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_purchases_round ON purchases(round);
    CREATE INDEX IF NOT EXISTS idx_games_purchase  ON games(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_results_round    ON results(round);
  `);
}
