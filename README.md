# 로또 트래커

매주 새 판매점에서 구매한 로또를 **회차별로 관리**하고, **당첨번호를 수집·자동채점**하며,
구매 패턴과 ROI(지출 대비 회수)를 분석하는 개인용 웹 앱.

> ⚠️ **확률에 대한 솔직한 전제**
> 로또 6/45는 매 회차가 독립적인 무작위 추첨입니다. 어떤 패턴 분석도 **1등 당첨 확률
> (1/8,145,060)을 높이지 못합니다.** 이 앱의 실질 가치는 ① 구매·지출의 체계적 관리,
> ② 자동 채점으로 당첨 누락 방지, ③ **인기 조합 회피**(당첨 시 상금을 덜 나눠 갖도록)
> 입니다. "확률"이 아니라 "관리와 기대 실수령액"을 다룹니다.

## 기술 스택

- **Next.js 16** (App Router, TypeScript) — 웹 UI + API
- **libSQL / Turso** — SQLite 호환 DB. 로컬은 `file:data/lotto.db`, 프로덕션(Vercel)은 Turso
- **Tailwind CSS v4**

## 실행 (로컬)

```bash
npm install
npm run dev        # http://localhost:3000  → file:data/lotto.db 사용

# 과거 전체 회차 백필 (최초 1회)
npm run seed       # data/seed/draws.csv → DB
```

`TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` 환경변수가 없으면 로컬 SQLite 파일을 쓴다(.env.example 참고).

## Vercel 배포

Vercel은 서버리스라 파일 SQLite에 쓸 수 없어 **Turso**(SQLite 호환 클라우드 DB)를 쓴다.

```bash
# 1. Turso DB 생성
turso db create lotto
turso db show lotto --url            # → TURSO_DATABASE_URL
turso db tokens create lotto         # → TURSO_AUTH_TOKEN

# 2. 과거 회차 시드 (Turso로)
TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... npm run seed

# 3. GitHub push 후 Vercel에서 import,
#    환경변수 TURSO_DATABASE_URL / TURSO_AUTH_TOKEN 등록 → Deploy
```

## 데이터 수집 방식 (중요)

동행복권 공식 당첨번호 API(`getLottoNumber`)는 **2026년 1월부터 봇 차단**되어
서버에서 직접 호출하면 메인페이지로 302 리다이렉트됩니다. 그래서:

- **과거 백필**: 공개 데이터셋 [`smok95/lotto`](https://github.com/smok95/lotto)에서 받아
  독립 출처와 교차검증 후 `data/seed/draws.csv`로 적재. (검증: 1204회차 중 1202개 일치,
  불일치 2건은 제3 출처로 smok95가 정확함을 확인)
- **매주 신규**: 추첨(토요일) 후 당첨번호 6개+보너스를 **수동 입력**. 의존성 0, 절대 안 깨짐.

## DB 스키마

| 테이블 | 내용 |
|---|---|
| `draws` | 회차별 공식 당첨번호 6개+보너스, 추첨일, 1등 당첨자수/상금, 총판매액 |
| `stores` | 판매점 마스터 (이름·주소·좌표·최초 방문 회차) |
| `purchases` | 구매 1건(영수증) = 회차 + 판매점 + 금액 |
| `games` | 게임 1줄(1,000원 = 번호 6개), 자동/수동/반자동 |
| `results` | 게임×회차 채점 결과 (일치 개수, 등수, 당첨금) |

## 로드맵

- [x] **1단계 기반** — 스키마, 당첨번호 백필(1228회), import 파이프라인, 대시보드
- [x] **2단계 입력** — 판매점/구매/게임 등록 UI, 주간 당첨번호 수동 입력
- [x] **3단계 채점** — 구매·당첨번호 등록 시 자동 채점, 게임별 등수/당첨금, ROI·회차별 성적
- [x] **4단계 분석** — 인기조합 회피 점수, 번호 빈도·홀짝·합계 분포, 판매점별 적중 통계
- [ ] **5단계 알림** — 추첨 후 채점 결과 알림

## 주요 경로

- `lib/db.ts` — DB 연결 + 스키마(멱등 마이그레이션)
- `lib/draws.ts` — 당첨번호 저장소(upsert/조회)
- `lib/csv.ts` — CSV 파싱/직렬화 + 번호 무결성 검증
- `lib/scoring.ts` — 6/45 등수 판정 규칙
- `app/api/draws/import` — CSV 일괄 import
- `scripts/build-seed-csv.mjs` — smok95 JSON → 정규 CSV
