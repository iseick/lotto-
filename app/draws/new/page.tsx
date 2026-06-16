import { latestRound } from "@/lib/draws";
import { lastSaturdayStr } from "@/lib/dateutil";
import { DrawForm } from "../../components/DrawForm";

export const dynamic = "force-dynamic";

export default function NewDrawPage() {
  const nextRound = latestRound() + 1;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-bold">당첨번호 입력</h1>
        <a href="/draws" className="text-sm text-blue-600 hover:underline">
          ← 당첨번호 목록
        </a>
      </div>
      <p className="text-sm text-neutral-500">
        토요일 추첨 후 공식 당첨번호를 직접 입력합니다. (공식 API 차단으로 수동
        입력)
      </p>
      <DrawForm defaultRound={nextRound} defaultDate={lastSaturdayStr()} />
    </div>
  );
}
