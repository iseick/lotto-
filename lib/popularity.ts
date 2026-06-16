// 인기조합(대중성) 점수 — 순수 함수, DB 불필요.
// 목적: 당첨 확률이 아니라 "당첨 시 상금을 몇 명과 나누는가"를 줄이기 위함.
// 사람들이 많이 고르는 패턴일수록 점수가 높다(= 1등 시 분배 위험 큼).
// ⚠️ 이 점수는 당첨 확률과 무관하다. 추첨은 무작위다.

import { assertSixNumbers } from "./validate";

export interface PopularityFactor {
  key: string;
  label: string;
  hit: boolean;
  weight: number; // 적중 시 가산점
  detail: string;
}

export type PopularityLevel = "독창적" | "보통" | "대중적" | "매우 대중적";

export interface PopularityResult {
  score: number; // 0~100, 높을수록 대중적
  level: PopularityLevel;
  factors: PopularityFactor[];
  advice: string;
}

function longestRun(sorted: number[]): number {
  let best = 1;
  let cur = 1;
  for (let i = 1; i < sorted.length; i++) {
    cur = sorted[i] === sorted[i - 1] + 1 ? cur + 1 : 1;
    if (cur > best) best = cur;
  }
  return best;
}

function isArithmetic(sorted: number[]): boolean {
  const d = sorted[1] - sorted[0];
  if (d === 0) return false;
  for (let i = 2; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] !== d) return false;
  }
  return true;
}

export function popularityScore(numbers: number[]): PopularityResult {
  assertSixNumbers(numbers);
  const nums = [...numbers].sort((a, b) => a - b);

  const factors: PopularityFactor[] = [];
  const add = (
    key: string,
    label: string,
    hit: boolean,
    weight: number,
    detail: string
  ) => factors.push({ key, label, hit, weight, detail });

  // 1) 생일 편중: 31 이하가 많을수록 (생일·기념일로 고름)
  const lowCount = nums.filter((n) => n <= 31).length;
  add(
    "birthday",
    "생일 편중 (31 이하)",
    lowCount >= 5,
    lowCount === 6 ? 28 : lowCount === 5 ? 16 : 0,
    `31 이하 ${lowCount}개${
      lowCount >= 5 ? " — 32~45를 거의 안 써 분배 위험↑" : ""
    }`
  );

  // 2) 연속 번호
  const run = longestRun(nums);
  add(
    "consecutive",
    "연속 번호",
    run >= 3,
    run >= 5 ? 28 : run === 4 ? 20 : run === 3 ? 12 : 0,
    run >= 3 ? `최대 ${run}연속 — 직선 패턴은 인기` : "연속 3개 이상 없음"
  );

  // 3) 끝수 반복 (예: 5,15,25,35)
  const byUnit = new Map<number, number>();
  for (const n of nums) byUnit.set(n % 10, (byUnit.get(n % 10) ?? 0) + 1);
  const maxUnit = Math.max(...byUnit.values());
  add(
    "lastdigit",
    "같은 끝수 반복",
    maxUnit >= 3,
    maxUnit >= 4 ? 18 : maxUnit === 3 ? 10 : 0,
    maxUnit >= 3 ? `끝자리 같은 번호 ${maxUnit}개` : "끝수 분산됨"
  );

  // 4) 등차수열 (예: 2,9,16,23,30,37)
  const arith = isArithmetic(nums);
  add(
    "arithmetic",
    "등차수열",
    arith,
    arith ? 24 : 0,
    arith ? "일정 간격 수열 — 의외로 많이 고름" : "등차수열 아님"
  );

  // 5) 마킹용지 세로줄 (7칸 그리드에서 같은 열 = n%7 동일)
  const byCol = new Map<number, number>();
  for (const n of nums) byCol.set(n % 7, (byCol.get(n % 7) ?? 0) + 1);
  const maxCol = Math.max(...byCol.values());
  add(
    "gridcol",
    "용지 세로줄 패턴",
    maxCol >= 4,
    maxCol >= 5 ? 18 : maxCol === 4 ? 10 : 0,
    maxCol >= 4 ? `같은 세로줄 ${maxCol}개 — 일직선 마킹` : "세로줄 분산됨"
  );

  // 6) 좁은 구간 몰림 (최대-최소 간격이 작음)
  const span = nums[5] - nums[0];
  add(
    "cluster",
    "좁은 구간 몰림",
    span <= 15,
    span <= 10 ? 16 : span <= 15 ? 8 : 0,
    span <= 15 ? `6개가 ${span} 폭에 몰림` : `폭 ${span} — 고르게 분산`
  );

  const raw = factors.reduce((s, f) => s + f.weight, 0);
  const score = Math.min(100, raw);

  const level: PopularityLevel =
    score >= 60
      ? "매우 대중적"
      : score >= 35
        ? "대중적"
        : score >= 15
          ? "보통"
          : "독창적";

  const advice =
    score >= 35
      ? "당첨돼도 상금을 여러 명과 나눌 가능성이 높습니다. 32~45 번호를 섞고 직선·연속 패턴을 피해 보세요."
      : "남들이 잘 안 고르는 조합입니다. (당첨 확률 자체는 어떤 조합이든 동일합니다.)";

  return { score, level, factors, advice };
}
