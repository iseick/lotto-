import { countDraws, latestRound, listDraws } from "@/lib/draws";
import { countPurchases, totalSpent } from "@/lib/purchases";
import { roiSummary, resultsByRound } from "@/lib/score";
import { LottoBalls } from "./components/LottoBalls";
import { RecommendBox } from "./components/RecommendBox";

export const dynamic = "force-dynamic";

function fmtWon(v: number | null): string {
  if (v == null) return "-";
  return v.toLocaleString("ko-KR") + "원";
}

export default async function Home() {
  const [total, latest, recent, myPurchases, spent, roi, rounds] =
    await Promise.all([
      countDraws(),
      latestRound(),
      listDraws(5),
      countPurchases(),
      totalSpent(),
      roiSummary(),
      resultsByRound(),
    ]);
  const top = recent[0];

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="수집된 회차" value={`${total}회`} />
        <Stat label="최신 회차" value={latest ? `${latest}회` : "-"} />
        <Stat label="내 구매" value={`${myPurchases}건`} />
        <Stat label="누적 지출" value={fmtWon(spent)} />
      </section>

      <RecommendBox />

      {myPurchases > 0 && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-lg font-bold">내 성적 (ROI)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Mini label="누적 당첨금" value={fmtWon(roi.winnings)} />
            <Mini
              label="순손익"
              value={(roi.net >= 0 ? "+" : "") + fmtWon(roi.net)}
              tone={roi.net >= 0 ? "pos" : "neg"}
            />
            <Mini
              label="수익률"
              value={roi.roiPct == null ? "-" : `${roi.roiPct.toFixed(1)}%`}
              tone={roi.roiPct != null && roi.roiPct >= 0 ? "pos" : "neg"}
            />
            <Mini
              label="당첨 게임"
              value={`${roi.winningGames} / ${roi.scoredGames}`}
            />
          </div>

          {rounds.length > 0 && (
            <div className="mt-4 border-t border-neutral-100 pt-3">
              <h3 className="mb-2 text-sm font-medium text-neutral-500">
                회차별 성적
              </h3>
              <ul className="divide-y divide-neutral-100">
                {rounds.slice(0, 8).map((r) => (
                  <li
                    key={r.round}
                    className="flex items-center justify-between py-2 text-sm"
                  >
                    <span className="font-medium">
                      {r.round}회
                      <span className="ml-2 font-normal text-neutral-400">
                        {r.draw_date ?? "추첨 전"}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-neutral-500">
                        {r.best_rank ? `최고 ${r.best_rank}등` : "—"}
                      </span>
                      <span className="font-medium">{fmtWon(r.winnings)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <p className="mt-3 text-xs text-neutral-400">
            ※ 2·3등 당첨금은 회차별 데이터가 없어 미산정(0원 처리)됩니다.
          </p>
        </section>
      )}

      {top && (
        <section className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">
              제 {top.round}회{" "}
              <span className="text-sm font-normal text-neutral-500">
                {top.draw_date}
              </span>
            </h2>
            <span className="text-sm text-neutral-500">최근 당첨번호</span>
          </div>
          <LottoBalls
            numbers={[top.n1, top.n2, top.n3, top.n4, top.n5, top.n6]}
            bonus={top.bonus}
          />
          <div className="mt-4 grid grid-cols-2 gap-2 text-sm text-neutral-600 sm:grid-cols-3">
            <div>
              1등 <b className="text-neutral-900">{top.first_winners ?? "-"}명</b>
            </div>
            <div>
              1등 상금{" "}
              <b className="text-neutral-900">{fmtWon(top.first_prize)}</b>
            </div>
            <div>
              총 판매액{" "}
              <b className="text-neutral-900">{fmtWon(top.total_sales)}</b>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 className="mb-3 text-lg font-bold">최근 회차</h2>
        <ul className="divide-y divide-neutral-100">
          {recent.map((d) => (
            <li
              key={d.round}
              className="flex flex-wrap items-center gap-3 py-2.5"
            >
              <span className="w-20 shrink-0 text-sm font-medium text-neutral-500">
                {d.round}회
              </span>
              <LottoBalls
                numbers={[d.n1, d.n2, d.n3, d.n4, d.n5, d.n6]}
                bonus={d.bonus}
              />
            </li>
          ))}
        </ul>
        <a
          href="/draws"
          className="mt-3 inline-block text-sm text-blue-600 hover:underline"
        >
          전체 당첨번호 보기 →
        </a>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-neutral-400">{hint}</div>}
    </div>
  );
}

function Mini({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pos" | "neg";
}) {
  const color =
    tone === "pos"
      ? "text-green-600"
      : tone === "neg"
        ? "text-red-600"
        : "text-neutral-900";
  return (
    <div className="rounded-lg bg-neutral-50 p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className={`mt-0.5 text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
