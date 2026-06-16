// 로컬 기준 YYYY-MM-DD 문자열.
export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 오늘 포함, 직전(또는 당일) 토요일 = 가장 최근 추첨일.
export function lastSaturdayStr(d: Date = new Date()): string {
  const copy = new Date(d);
  const diff = (copy.getDay() + 1) % 7; // 토(6) → 0, 일(0) → 1 ...
  copy.setDate(copy.getDate() - diff);
  return todayStr(copy);
}
