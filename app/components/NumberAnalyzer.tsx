"use client";

import { useMemo, useState } from "react";
import { NumberInputs } from "./NumberInputs";
import { popularityScore } from "@/lib/popularity";

const LEVEL_COLOR: Record<string, string> = {
  독창적: "text-green-600",
  보통: "text-neutral-700",
  대중적: "text-orange-600",
  "매우 대중적": "text-red-600",
};

export function NumberAnalyzer() {
  const [nums, setNums] = useState<string[]>(Array(6).fill(""));

  const result = useMemo(() => {
    const parsed = nums.map((s) => parseInt(s));
    try {
      return popularityScore(parsed);
    } catch {
      return null; // 6개 유효 입력 전
    }
  }, [nums]);

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div>
        <h2 className="font-bold">인기조합 회피 점수</h2>
        <p className="mt-1 text-sm text-neutral-500">
          분석할 번호 6개를 입력하세요. 점수가 높을수록 남들도 많이 고르는 조합 →
          당첨 시 상금 분배 위험이 큽니다.
        </p>
      </div>
      <NumberInputs values={nums} onChange={setNums} />

      {!result ? (
        <p className="text-sm text-neutral-400">
          서로 다른 1~45 번호 6개를 입력하면 분석됩니다.
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <span className="text-4xl font-bold">{result.score}</span>
            <span className="pb-1 text-sm text-neutral-400">/ 100 대중성</span>
            <span
              className={`pb-1 ml-auto text-lg font-bold ${
                LEVEL_COLOR[result.level]
              }`}
            >
              {result.level}
            </span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full ${
                result.score >= 60
                  ? "bg-red-500"
                  : result.score >= 35
                    ? "bg-orange-500"
                    : result.score >= 15
                      ? "bg-neutral-400"
                      : "bg-green-500"
              }`}
              style={{ width: `${result.score}%` }}
            />
          </div>

          <ul className="space-y-1.5 text-sm">
            {result.factors.map((f) => (
              <li key={f.key} className="flex items-start gap-2">
                <span className={f.hit ? "text-red-500" : "text-green-500"}>
                  {f.hit ? "▲" : "○"}
                </span>
                <span className="text-neutral-700">
                  <b>{f.label}</b>{" "}
                  <span className="text-neutral-500">— {f.detail}</span>
                  {f.hit && f.weight > 0 && (
                    <span className="ml-1 text-xs text-red-500">
                      +{f.weight}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">
            💡 {result.advice}
          </p>
        </div>
      )}
    </div>
  );
}
