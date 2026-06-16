// 로또 공식 색상: 1-10 노랑, 11-20 파랑, 21-30 빨강, 31-40 회색, 41-45 초록.
function ballColor(n: number): string {
  if (n <= 10) return "bg-yellow-400 text-yellow-950";
  if (n <= 20) return "bg-blue-500 text-white";
  if (n <= 30) return "bg-red-500 text-white";
  if (n <= 40) return "bg-neutral-500 text-white";
  return "bg-green-500 text-white";
}

type Mark = "match" | "bonus" | undefined;

export function Ball({
  n,
  dim = false,
  mark,
}: {
  n: number;
  dim?: boolean;
  mark?: Mark;
}) {
  const ring =
    mark === "match"
      ? "ring-2 ring-offset-1 ring-emerald-500"
      : mark === "bonus"
        ? "ring-2 ring-offset-1 ring-amber-400"
        : "";
  return (
    <span
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${ballColor(
        n
      )} ${dim ? "opacity-30" : ""} ${ring}`}
    >
      {n}
    </span>
  );
}

export function LottoBalls({
  numbers,
  bonus,
  winning,
  winningBonus,
}: {
  numbers: number[];
  bonus?: number | null;
  // 비교 모드: 당첨 본번호/보너스를 넘기면 일치 번호를 강조하고 나머지는 흐리게 한다.
  winning?: number[];
  winningBonus?: number | null;
}) {
  const winSet = winning ? new Set(winning) : null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {numbers.map((n) => {
        if (!winSet) return <Ball key={n} n={n} />;
        const hit = winSet.has(n);
        const isBonus = !hit && winningBonus != null && n === winningBonus;
        return (
          <Ball
            key={n}
            n={n}
            dim={!hit && !isBonus}
            mark={hit ? "match" : isBonus ? "bonus" : undefined}
          />
        );
      })}
      {bonus != null && (
        <>
          <span className="px-0.5 text-neutral-400">+</span>
          <Ball n={bonus} />
        </>
      )}
    </div>
  );
}
