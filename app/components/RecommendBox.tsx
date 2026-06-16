"use client";

import { useEffect, useState, useTransition } from "react";
import { recommendAction } from "../actions";
import { LottoBalls } from "./LottoBalls";
import type { Recommendation } from "@/lib/recommend";

export function RecommendBox() {
  const [reco, setReco] = useState<Recommendation | null>(null);
  const [pending, start] = useTransition();

  function refresh() {
    start(async () => setReco(await recommendAction()));
  }
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="space-y-3 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">
          🎲 금주 추천번호{" "}
          {reco && (
            <span className="text-sm font-normal text-neutral-500">
              {reco.round}회
            </span>
          )}
        </h2>
        <button
          onClick={refresh}
          disabled={pending}
          className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm hover:bg-neutral-50 disabled:opacity-40"
        >
          {pending ? "뽑는 중…" : "다시 추천"}
        </button>
      </div>

      {!reco ? (
        <p className="text-sm text-neutral-400">추천을 생성하는 중…</p>
      ) : (
        <>
          <ul className="space-y-2">
            {reco.sets.map((s, i) => (
              <li
                key={i}
                className="flex flex-wrap items-center gap-3 border-t border-neutral-100 pt-2 first:border-0 first:pt-0"
              >
                <span className="w-5 text-sm font-bold text-neutral-400">
                  {i + 1}
                </span>
                <LottoBalls numbers={s.numbers} />
                <span className="ml-auto flex items-center gap-2 text-xs">
                  <span className="text-neutral-500">
                    대중성 {s.popularity}
                  </span>
                  {s.avoidsOveruse && (
                    <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">
                      분산 ✓
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
            ⚠️ 이 추천은 <b>당첨 확률을 높이지 않습니다</b> (어떤 6개든 확률
            동일). ① 인기조합 점수가 낮아 <b>당첨 시 상금 분배 위험이 적고</b>, ②
            회원님이 자주 쓰는 번호
            {reco.overusedAvoided.length > 0 && (
              <>
                {" "}
                (<b>{reco.overusedAvoided.join(", ")}</b>)
              </>
            )}
            와 이미 산 조합을 피해 <b>분산</b>되도록 고른 것뿐입니다.
            {reco.basedOnGames > 0 && (
              <> (내 {reco.basedOnGames}게임 기준)</>
            )}
          </div>
        </>
      )}
    </section>
  );
}
