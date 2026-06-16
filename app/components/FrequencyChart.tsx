import type { NumberFreq } from "@/lib/stats";

function barColor(n: number): string {
  if (n <= 10) return "bg-yellow-400";
  if (n <= 20) return "bg-blue-500";
  if (n <= 30) return "bg-red-500";
  if (n <= 40) return "bg-neutral-500";
  return "bg-green-500";
}

export function FrequencyChart({ freqs }: { freqs: NumberFreq[] }) {
  const max = Math.max(...freqs.map((f) => f.count), 1);
  const min = Math.min(...freqs.map((f) => f.count));
  return (
    <div className="flex items-end gap-[2px] overflow-x-auto pb-1">
      {freqs.map((f) => {
        const h = Math.round((f.count / max) * 96) + 4;
        const hot = f.count === max;
        const cold = f.count === min;
        return (
          <div
            key={f.n}
            className="flex min-w-[15px] flex-1 flex-col items-center gap-1"
            title={`${f.n}번 · ${f.count}회`}
          >
            <span className="text-[9px] text-neutral-400">{f.count}</span>
            <div
              className={`w-full rounded-t ${barColor(f.n)} ${
                hot ? "ring-2 ring-red-400" : ""
              } ${cold ? "opacity-40" : ""}`}
              style={{ height: `${h}px` }}
            />
            <span className="text-[9px] font-medium text-neutral-600">
              {f.n}
            </span>
          </div>
        );
      })}
    </div>
  );
}
