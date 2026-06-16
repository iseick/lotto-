import { getDb } from "./db";

// ⚠️ 아래 통계는 모두 과거 추첨의 사후 집계다. 다음 회차 예측력은 없다.

interface RawDraw {
  n1: number;
  n2: number;
  n3: number;
  n4: number;
  n5: number;
  n6: number;
  bonus: number;
}

async function allDraws(): Promise<RawDraw[]> {
  const db = await getDb();
  const rs = await db.execute("SELECT n1,n2,n3,n4,n5,n6,bonus FROM draws");
  return rs.rows as unknown as RawDraw[];
}

export interface NumberFreq {
  n: number;
  count: number;
}

/** 본번호 1~45 출현 빈도 (보너스 제외). 회차 수도 함께. */
export async function numberFrequencies(): Promise<{
  freqs: NumberFreq[];
  totalDraws: number;
}> {
  const draws = await allDraws();
  const counts = new Array(46).fill(0);
  for (const d of draws) {
    for (const n of [d.n1, d.n2, d.n3, d.n4, d.n5, d.n6]) counts[n]++;
  }
  const freqs: NumberFreq[] = [];
  for (let n = 1; n <= 45; n++) freqs.push({ n, count: counts[n] });
  return { freqs, totalDraws: draws.length };
}

export interface DistroStats {
  totalDraws: number;
  oddAvg: number;
  lowAvg: number;
  sumMin: number;
  sumMax: number;
  sumAvg: number;
  sumBuckets: { label: string; count: number }[];
}

/** 홀짝·고저·합계 분포 요약. */
export async function distroStats(): Promise<DistroStats> {
  const draws = await allDraws();
  const total = draws.length || 1;
  let oddSum = 0;
  let lowSum = 0;
  let sMin = Infinity;
  let sMax = -Infinity;
  let sTotal = 0;

  const buckets = [
    { label: "~100", lo: 0, hi: 100, count: 0 },
    { label: "101~120", lo: 101, hi: 120, count: 0 },
    { label: "121~140", lo: 121, hi: 140, count: 0 },
    { label: "141~160", lo: 141, hi: 160, count: 0 },
    { label: "161~180", lo: 161, hi: 180, count: 0 },
    { label: "181~", lo: 181, hi: Infinity, count: 0 },
  ];

  for (const d of draws) {
    const ns = [d.n1, d.n2, d.n3, d.n4, d.n5, d.n6];
    oddSum += ns.filter((n) => n % 2 === 1).length;
    lowSum += ns.filter((n) => n <= 22).length;
    const sum = ns.reduce((a, b) => a + b, 0);
    sTotal += sum;
    if (sum < sMin) sMin = sum;
    if (sum > sMax) sMax = sum;
    const b = buckets.find((x) => sum >= x.lo && sum <= x.hi);
    if (b) b.count++;
  }

  return {
    totalDraws: draws.length,
    oddAvg: oddSum / total,
    lowAvg: lowSum / total,
    sumMin: draws.length ? sMin : 0,
    sumMax: draws.length ? sMax : 0,
    sumAvg: sTotal / total,
    sumBuckets: buckets.map((b) => ({ label: b.label, count: b.count })),
  };
}
