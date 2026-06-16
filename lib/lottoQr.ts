import type { GameMode } from "./purchases";

// 동행복권 로또 용지 QR 파싱.
// QR 내용 예: https://m.dhlottery.co.kr/qr.do?method=winQr&v=0949q142135364044q052330344344...
//   v = {회차4자리}{게임들}{일련번호}
//   각 게임 = 구분자 1글자 + 6개 번호(각 2자리)
//   구분자: q=자동, m=수동, s=반자동

const MODE_MAP: Record<string, GameMode> = {
  q: "auto",
  m: "manual",
  s: "semi",
};

export interface ParsedQr {
  round: number;
  games: { mode: GameMode; numbers: number[] }[];
}

/** QR 문자열(URL 또는 v값) → 회차+게임들. 형식이 아니면 null. */
export function parseLottoQr(text: string): ParsedQr | null {
  if (!text) return null;

  // URL이면 v= 파라미터 추출, 아니면 전체를 v로 본다.
  let v = text.trim();
  const vm = v.match(/[?&]v=([^&\s]+)/i);
  if (vm) v = vm[1];

  // 맨 앞 연속 숫자 = 회차
  const rm = v.match(/^(\d+)/);
  if (!rm) return null;
  const round = parseInt(rm[1].slice(0, 4), 10);
  if (!Number.isFinite(round) || round < 1) return null;

  // 구분자(q/m/s) + 12자리 숫자 = 게임 한 줄
  const games: { mode: GameMode; numbers: number[] }[] = [];
  const re = /([qms])(\d{12})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(v)) !== null) {
    const mode = MODE_MAP[m[1].toLowerCase()] ?? "auto";
    const digits = m[2];
    const numbers: number[] = [];
    for (let i = 0; i < 12; i += 2) numbers.push(parseInt(digits.slice(i, i + 2), 10));
    games.push({ mode, numbers });
  }

  if (games.length === 0) return null;
  return { round, games };
}
