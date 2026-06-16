import { getDb } from "./db";
import { popularityScore } from "./popularity";

// ⚠️ 추천번호는 당첨 확률을 높이지 못한다(어떤 조합이든 동일).
// 목적: ① 인기조합 회피로 당첨 시 상금 분배 위험↓ ② 사용자가 과의존하는
// 번호/이미 쓴 조합을 피해 커버리지 분산.

export interface RecoSet {
  numbers: number[];
  popularity: number; // 0~100, 낮을수록 비대중적(좋음)
  avoidsOveruse: boolean; // 과의존 번호를 안 쓴 조합인가
}

export interface Recommendation {
  round: number;
  basedOnGames: number;
  overusedAvoided: number[]; // 회피 대상으로 삼은 과의존 번호
  sets: RecoSet[];
}

interface Profile {
  comboSet: Set<string>;
  overuse: Set<number>;
  overuseList: number[];
  totalGames: number;
}

async function userProfile(): Promise<Profile> {
  const db = await getDb();
  const rs = await db.execute("SELECT n1,n2,n3,n4,n5,n6 FROM games");
  const usage = new Array(46).fill(0);
  const comboSet = new Set<string>();
  for (const r of rs.rows) {
    const nums = [r.n1, r.n2, r.n3, r.n4, r.n5, r.n6].map(Number);
    for (const n of nums) usage[n]++;
    comboSet.add([...nums].sort((a, b) => a - b).join("-"));
  }
  // 기대치(슬롯당)의 1.8배 넘게 쓴 번호를 '과의존'으로 본다.
  const slots = rs.rows.length * 6;
  const expected = slots > 0 ? slots / 45 : 0;
  const ranked = Array.from({ length: 45 }, (_, i) => ({
    n: i + 1,
    c: usage[i + 1],
  })).sort((a, b) => b.c - a.c);
  const overuseList = ranked
    .filter((x) => expected > 0 && x.c >= expected * 1.8)
    .slice(0, 6)
    .map((x) => x.n);
  return {
    comboSet,
    overuse: new Set(overuseList),
    overuseList,
    totalGames: rs.rows.length,
  };
}

function randomCombo(): number[] {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = 0; i < 6; i++) {
    const j = i + Math.floor(Math.random() * (45 - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 6).sort((a, b) => a - b);
}

function overlap(a: number[], b: number[]): number {
  const s = new Set(a);
  return b.filter((n) => s.has(n)).length;
}

/** 금주(다음) 회차 추천 조합 생성. */
export async function recommend(count = 5): Promise<Recommendation> {
  const db = await getDb();
  const lr = await db.execute("SELECT MAX(round) AS m FROM draws");
  const round = ((lr.rows[0]?.m as number | null) ?? 0) + 1;

  const prof = await userProfile();

  // 후보 다량 생성 → 점수화(낮을수록 좋음).
  const CAND = 4000;
  const seen = new Set<string>();
  const scored: { nums: number[]; pop: number; overuseHits: number; rank: number }[] =
    [];
  for (let i = 0; i < CAND; i++) {
    const nums = randomCombo();
    const key = nums.join("-");
    if (seen.has(key)) continue;
    seen.add(key);
    if (prof.comboSet.has(key)) continue; // 이미 쓴 조합 제외
    const pop = popularityScore(nums).score;
    const overuseHits = nums.filter((n) => prof.overuse.has(n)).length;
    scored.push({ nums, pop, overuseHits, rank: pop + overuseHits * 8 });
  }
  scored.sort((a, b) => a.rank - b.rank);

  // 상호 다양성 확보(서로 4개 이상 겹치지 않게).
  const picks: typeof scored = [];
  for (const c of scored) {
    if (picks.every((p) => overlap(p.nums, c.nums) <= 3)) picks.push(c);
    if (picks.length >= count) break;
  }

  return {
    round,
    basedOnGames: prof.totalGames,
    overusedAvoided: prof.overuseList,
    sets: picks.map((p) => ({
      numbers: p.nums,
      popularity: p.pop,
      avoidsOveruse: p.overuseHits === 0,
    })),
  };
}
