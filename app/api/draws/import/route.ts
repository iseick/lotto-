import { NextResponse } from "next/server";
import { parseDrawsCsv } from "@/lib/csv";
import { upsertDraws } from "@/lib/draws";
import { scoreAllPurchasedRounds } from "@/lib/score";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/draws/import
//  - Content-Type: text/csv  → 본문 전체를 CSV로 파싱
//  - 그 외(JSON multipart 미지원) → text 본문을 CSV로 간주
// 응답: { ok, imported }
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (!text.trim()) {
      return NextResponse.json(
        { ok: false, error: "빈 본문" },
        { status: 400 }
      );
    }
    const rows = parseDrawsCsv(text);
    const imported = await upsertDraws(rows);
    const scored = await scoreAllPurchasedRounds();
    return NextResponse.json({ ok: true, imported, scored });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
