import { isPrizeEstimable } from "@/lib/score";

const RANK_STYLE: Record<number, string> = {
  1: "bg-amber-100 text-amber-800 border-amber-300",
  2: "bg-orange-100 text-orange-800 border-orange-300",
  3: "bg-rose-100 text-rose-800 border-rose-300",
  4: "bg-sky-100 text-sky-800 border-sky-300",
  5: "bg-emerald-100 text-emerald-800 border-emerald-300",
};

export function RankBadge({
  rank,
  matchCount,
  bonusMatch,
  prize,
}: {
  rank: number | null;
  matchCount: number;
  bonusMatch?: boolean;
  prize?: number;
}) {
  if (rank == null) {
    return (
      <span className="inline-flex items-center rounded-md border border-neutral-200 px-2 py-0.5 text-xs text-neutral-400">
        낙첨 ({matchCount}개)
      </span>
    );
  }
  const prizeText =
    prize != null && isPrizeEstimable(rank)
      ? `${prize.toLocaleString("ko-KR")}원`
      : "당첨금 미산정";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold ${RANK_STYLE[rank]}`}
    >
      {rank}등
      <span className="font-normal opacity-75">
        ({matchCount}개{bonusMatch ? "+보너스" : ""}) · {prizeText}
      </span>
    </span>
  );
}
