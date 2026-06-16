// smok95/lotto 회차별 JSON → 정규 draws.csv 생성.
// 사용: node scripts/build-seed-csv.mjs <results_dir> <out_csv>
// 1등 당첨금/당첨자수는 divisions 중 prize(1게임당)가 최대인 항목으로 식별한다.

import fs from "node:fs";
import path from "node:path";

const resultsDir =
  process.argv[2] ?? "data/_import/lotto-main/results";
const outCsv = process.argv[3] ?? "data/seed/draws.csv";

const HEADER =
  "round,draw_date,n1,n2,n3,n4,n5,n6,bonus,first_winners,first_prize,total_sales";

function firstDivision(divisions) {
  if (!Array.isArray(divisions)) return { prize: null, winners: null };
  let best = null;
  for (const d of divisions) {
    if (d && typeof d.prize === "number" && typeof d.winners === "number") {
      if (!best || d.prize > best.prize) best = d;
    }
  }
  return best ?? { prize: null, winners: null };
}

const files = fs
  .readdirSync(resultsDir)
  .filter((f) => /^[0-9]+\.json$/.test(f))
  .sort((a, b) => parseInt(a) - parseInt(b));

const lines = [HEADER];
let count = 0;
for (const f of files) {
  const j = JSON.parse(fs.readFileSync(path.join(resultsDir, f), "utf8"));
  const nums = j.numbers.slice().sort((a, b) => a - b);
  const date = String(j.date).slice(0, 10); // YYYY-MM-DD
  const fd = firstDivision(j.divisions);
  lines.push(
    [
      j.draw_no,
      date,
      ...nums,
      j.bonus_no,
      fd.winners ?? "",
      fd.prize ?? "",
      j.total_sales_amount ?? "",
    ].join(",")
  );
  count++;
}

fs.mkdirSync(path.dirname(outCsv), { recursive: true });
fs.writeFileSync(outCsv, lines.join("\n") + "\n");
console.log(`wrote ${count} rounds → ${outCsv}`);
