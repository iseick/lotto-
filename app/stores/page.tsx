import { listStores } from "@/lib/stores";
import { StoreForm } from "../components/StoreForm";

export const dynamic = "force-dynamic";

export default async function StoresPage() {
  const stores = await listStores();
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">판매점 ({stores.length})</h1>
      <StoreForm />

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        {stores.length === 0 ? (
          <p className="p-5 text-sm text-neutral-500">
            아직 등록된 판매점이 없습니다.
          </p>
        ) : (
          <ul className="divide-y divide-neutral-100">
            {stores.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  {s.address && (
                    <div className="text-xs text-neutral-400">{s.address}</div>
                  )}
                </div>
                <div className="text-right text-sm text-neutral-500">
                  구매 {s.purchase_count}건
                  {s.winnings > 0 ? (
                    <div className="text-xs font-medium text-green-600">
                      당첨 {s.winnings.toLocaleString("ko-KR")}원
                      {s.best_rank ? ` · 최고 ${s.best_rank}등` : ""}
                    </div>
                  ) : (
                    s.first_round && (
                      <div className="text-xs text-neutral-400">
                        최초 {s.first_round}회
                      </div>
                    )
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
