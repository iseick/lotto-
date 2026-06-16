import { ollamaModel, ollamaChat } from "./ollama";
import type { Recommendation } from "./recommend";

// 추천 하단 멘트를 로컬 LLM이 작성. Ollama 없으면 null(→ UI는 고정문구 폴백).
// ⚠️ 정직성: 당첨 확률을 높인다는 식의 표현을 절대 못 쓰게 시스템 프롬프트로 제약.

const SYSTEM = `너는 로또 구매 관리 앱의 데이터 분석 도우미다. 추천 번호 하단에 들어갈 짧은 코멘트를 쓴다.
반드시 지킬 규칙:
- 추천 번호가 당첨 확률을 높인다고 말하면 절대 안 된다. 모든 6개 조합의 당첨 확률은 똑같이 1/8,145,060이다.
- "행운의 번호", "잘 나오는 번호", "예측", "적중률" 같은 표현 금지.
- 오직 주어진 데이터(인기조합 점수=대중성, 회피한 과의존 번호, 분산)만 근거로 말한다. 없는 사실을 지어내지 마라.
- 반드시 "당첨 확률 자체는 동일하다"는 취지를 한 번 포함한다.
- 한국어 존댓말, 2문장 이내, 군더더기 없이.`;

export interface RecoComment {
  text: string;
  model: string;
}

export async function generateRecoComment(
  reco: Recommendation
): Promise<RecoComment | null> {
  const model = await ollamaModel();
  if (!model) return null;

  const pops = reco.sets.map((s) => s.popularity);
  const avgPop = pops.length
    ? Math.round(pops.reduce((a, b) => a + b, 0) / pops.length)
    : 0;
  const facts = [
    `대상 회차: ${reco.round}회`,
    `추천 ${reco.sets.length}세트의 인기조합(대중성) 점수: ${pops.join(", ")} (평균 ${avgPop}/100, 낮을수록 비대중적)`,
    `회피한 과의존 번호: ${reco.overusedAvoided.length ? reco.overusedAvoided.join(", ") : "없음"}`,
    `분석에 쓴 내 구매 게임 수: ${reco.basedOnGames}`,
  ].join("\n");

  const user = `아래 데이터로 추천 하단 코멘트를 작성해줘. 데이터 밖의 내용은 쓰지 마.\n\n${facts}`;
  const text = await ollamaChat(model, SYSTEM, user);
  if (!text) return null;
  return { text, model };
}
