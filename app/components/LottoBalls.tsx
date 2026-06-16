// 로또 공식 색상: 1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록.
function ballColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-950";
  if (n <= 20) return "bg-blue-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-neutral-500 text-white";
  return "bg-green-500 text-white";
}

export function Ball({ n, dim = false }: { n: number; dim?: boolean }) {
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${ballColor(
        n
      )} ${dim ? "opacity-40" : ""}`}
    >
      {n}
    </span>
  );
}

export function LottoBalls({
  numbers,
  bonus,
}: {
  numbers: number[];
  bonus?: number | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {numbers.map((n) => (
        <Ball key={n} n={n} />
      ))}
      {bonus != null && (
        <>
          <span className="px-0.5 text-neutral-400">+</span>
          <Ball n={bonus} />
        </>
      )}
    </div>
  );
}
