import { listStores } from "@/lib/stores";
import { latestRound } from "@/lib/draws";
import { todayStr } from "@/lib/dateutil";
import { PurchaseForm } from "../../components/PurchaseForm";

export const dynamic = "force-dynamic";

export default async function NewPurchasePage() {
  const [storeRows, latest] = await Promise.all([listStores(), latestRound()]);
  const stores = storeRows.map((s) => ({ id: s.id, name: s.name }));
  const nextRound = latest + 1;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">구매 등록</h1>
        <a href="/purchases" className="text-sm text-blue-600 hover:underline">
          ← 구매 목록
        </a>
      </div>
      <PurchaseForm
        stores={stores}
        defaultRound={nextRound}
        defaultDate={todayStr()}
      />
    </div>
  );
}
