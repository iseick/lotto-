// 로컬 Ollama 연동 (있을 때만). Vercel 등 서버리스에선 비활성.
// 설정: OLLAMA_HOST(기본 http://localhost:11434), OLLAMA_MODEL(미지정 시 자동 선택)

const HOST = process.env.OLLAMA_HOST ?? "http://localhost:11434";
const FORCED_MODEL = process.env.OLLAMA_MODEL;

/** 사용 가능하면 쓸 모델명, 아니면 null. (Vercel/서버리스에선 항상 null) */
export async function ollamaModel(): Promise<string | null> {
  if (process.env.VERCEL) return null; // 배포본에선 시도하지 않음
  try {
    const res = await fetch(`${HOST}/api/tags`, {
      signal: AbortSignal.timeout(700),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { models?: { name: string }[] };
    const names = (data.models ?? []).map((m) => m.name);
    if (FORCED_MODEL) return FORCED_MODEL;
    return names[0] ?? null;
  } catch {
    return null;
  }
}

/** 단발 채팅. 실패 시 null. */
export async function ollamaChat(
  model: string,
  system: string,
  user: string
): Promise<string | null> {
  try {
    const res = await fetch(`${HOST}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        stream: false,
        think: false,
        options: { temperature: 0.4, num_predict: 220 },
      }),
      signal: AbortSignal.timeout(60000), // 콜드 모델 로드 여유
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { message?: { content?: string } };
    const text = data.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}
