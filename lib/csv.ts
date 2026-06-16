import type { DrawRow } from "./draws";

export const DRAWS_CSV_HEADER =
  "round,draw_date,n1,n2,n3,n4,n5,n6,bonus,first_winners,first_prize,total_sales";

/** DrawRow[] → CSV 문자열. */
export function serializeDrawsCsv(rows: DrawRow[]): string {
  const lines = [DRAWS_CSV_HEADER];
  for (const r of rows) {
    lines.push(
      [
        r.round,
        r.draw_date,
        r.n1,
        r.n2,
        r.n3,
        r.n4,
        r.n5,
        r.n6,
        r.bonus,
        r.first_winners ?? "",
        r.first_prize ?? "",
        r.total_sales ?? "",
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

/** CSV 문자열 → DrawRow[]. 헤더 순서는 DRAWS_CSV_HEADER 기준. 잘못된 행은 예외. */
export function parseDrawsCsv(text: string): DrawRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  // 첫 줄이 헤더면 건너뛴다.
  const start = lines[0].toLowerCase().startsWith("round,") ? 1 : 0;
  const rows: DrawRow[] = [];

  for (let i = start; i < lines.length; i++) {
    const c = lines[i].split(",").map((s) => s.trim());
    if (c.length < 9) throw new Error(`CSV ${i + 1}행: 컬럼 수 부족`);
    const num = (v: string) => {
      const n = Number(v);
      if (!Number.isFinite(n)) throw new Error(`CSV ${i + 1}행: 숫자 아님 "${v}"`);
      return n;
    };
    const optNum = (v: string) => (v === "" || v == null ? null : num(v));

    const row: DrawRow = {
      round: num(c[0]),
      draw_date: c[1],
      n1: num(c[2]),
      n2: num(c[3]),
      n3: num(c[4]),
      n4: num(c[5]),
      n5: num(c[6]),
      n6: num(c[7]),
      bonus: num(c[8]),
      first_winners: optNum(c[9] ?? ""),
      first_prize: optNum(c[10] ?? ""),
      total_sales: optNum(c[11] ?? ""),
    };
    validateDraw(row, i + 1);
    rows.push(row);
  }
  return rows;
}

/** 번호 범위/중복/보너스 무결성 검증. */
export function validateDraw(r: DrawRow, lineNo?: number): void {
  const where = lineNo ? `CSV ${lineNo}행(${r.round}회)` : `${r.round}회`;
  const nums = [r.n1, r.n2, r.n3, r.n4, r.n5, r.n6];
  for (const n of [...nums, r.bonus]) {
    if (!Number.isInteger(n) || n < 1 || n > 45)
      throw new Error(`${where}: 번호 범위 오류 ${n}`);
  }
  if (new Set(nums).size !== 6)
    throw new Error(`${where}: 본번호 6개 중복`);
  if (nums.includes(r.bonus))
    throw new Error(`${where}: 보너스가 본번호와 겹침`);
}
