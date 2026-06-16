"use client";

// 6개 번호 입력. 1~45 범위·중복을 실시간으로 표시한다.
export function NumberInputs({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const parsed = values.map((v) => (v === "" ? null : parseInt(v)));
  const counts = new Map<number, number>();
  for (const n of parsed) if (n != null) counts.set(n, (counts.get(n) ?? 0) + 1);

  function isBad(i: number): boolean {
    const n = parsed[i];
    if (n == null) return false;
    if (!Number.isInteger(n) || n < 1 || n > 45) return true;
    return (counts.get(n) ?? 0) > 1; // 중복
  }

  function set(i: number, v: string) {
    const next = [...values];
    next[i] = v.replace(/[^0-9]/g, "").slice(0, 2);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((v, i) => (
        <input
          key={i}
          inputMode="numeric"
          value={v}
          onChange={(e) => set(i, e.target.value)}
          className={`h-11 w-11 rounded-full border text-center text-base font-bold focus:outline-2 focus:outline-blue-500 ${
            isBad(i)
              ? "border-red-400 bg-red-50 text-red-700"
              : "border-neutral-300 bg-white"
          }`}
        />
      ))}
    </div>
  );
}
