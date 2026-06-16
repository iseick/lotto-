import { listPurchases, gamesOfPurchase } from "@/lib/purchases";
import { resultsOfPurchase } from "@/lib/score";
import { LottoBalls } from "../components/LottoBalls";
import { RankBadge } from "../components/RankBadge";

export const dynamic = "force-dynamic";

const MODE_LABEL: Record<string, string> = {
  auto: "자동",
  manual: "수동",
  semi: "반자동",
};

export default async function PurchasesPage() {
  const purchases = await listPurchases();
  const details = await Promise.all(
    purchases.map(async (p) => ({
      p,
      games: await gamesOfPurchase(p.id),
      results: await resultsOfPurchase(p.id),
    }))
  );

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">내 구매 ({purchases.length})</h1>
        <a
          href="/purchases/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
        >
          + 구매 등록
        </a>
      </div>

      {purchases.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-white p-5 text-sm text-neutral-500">
          아직 등록된 구매가 없습니다. 오른쪽 위 “구매 등록”으로 추가하세요.
        </p>
      ) : (
        <div className="space-y-3">
          {details.map(({ p, games, results }) => {
            const scored = results.size > 0;
            return (
              <div
                key={p.id}
                className="rounded-xl border border-neutral-200 bg-white p-4"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div className="font-bold">
                    {p.round}회{" "}
                    <span className="font-normal text-neutral-500">
                      · {p.store_name ?? "판매점 미지정"}
                    </span>
                    {!scored && (
                      <span className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-normal text-neutral-500">
                        추첨 전 (미채점)
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-neutral-500">
                    {p.purchase_date ?? ""} · {p.game_count}게임 ·{" "}
                    {p.amount.toLocaleString("ko-KR")}원
                  </div>
                </div>
                <ul className="space-y-1.5">
                  {games.map((g) => {
                    const r = results.get(g.id);
                    return (
                      <li
                        key={g.id}
                        className="flex flex-wrap items-center gap-2"
                      >
                        <span className="w-4 text-xs font-bold text-neutral-400">
                          {g.slot}
                        </span>
                        <span className="w-10 text-xs text-neutral-500">
                          {MODE_LABEL[g.mode] ?? g.mode}
                        </span>
                        <LottoBalls
                          numbers={[g.n1, g.n2, g.n3, g.n4, g.n5, g.n6]}
                        />
                        {r && (
                          <RankBadge
                            rank={r.rank}
                            matchCount={r.match_count}
                            bonusMatch={r.bonus_match === 1}
                            prize={r.prize}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
