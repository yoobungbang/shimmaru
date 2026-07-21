# 작업 보고서 (helper-manager) — 6차: "AI 티" 디자인 클린업 완료

## 0. 이번 라운드 배경
사용자가 4가지 "AI가 만든 디자인 티" 패턴을 지적: ① 이모지 아이콘, ② 왼쪽 선 강조 박스, ③ 점+텍스트 상태 뱃지, ④ AI 특유 컬러셋(보라/파랑 그라디언트). `feature/design` 워크트리에서 직접 실행.

## 1. 무엇을 했나
- **이모지 → 아이콘**: 기존에 있던 자체 SVG 아이콘 시스템(`components/icons.tsx`, 24px 그리드·currentColor)을 외부 라이브러리 추가 없이 그대로 확장(~50개 아이콘 신규). 카테고리·테마·동반자·"자리를 지키는 사람"·컬렉터 패스 등 5개 데이터 소스에 `icon` 필드를 추가하고, 이를 소비하는 화면/컴포넌트 약 25개를 전부 갱신. 별점(★☆)·하트(♥♡)도 폰트 의존 글리프라 같이 교체. 챗봇 인사말 등 **4개 언어 번역 문자열**에 박혀있던 이모지도 제거.
  - **의도적 예외**: 캔버스로 그리는 공유카드 이미지 생성기(`courseCard.ts`, `reportCard.ts`)는 SVG를 직접 못 그려서 `emoji` 필드를 보존 — 데이터 정의에 "캔버스 전용" 주석으로 명시.
- **왼쪽 선 강조 박스**: 2곳(`home-teaser__card`, `journal__report-cta`) 전부 발견해 전체 헤어라인 테두리 + 원형 아이콘 배지로 교체.
- **점+텍스트 상태 뱃지**: 축제 상태(`status-badge`+`status-dot`, Festivals/FestivalDetail 중복 구현) 원형 점을 상태별 아이콘으로 교체 + pill 모서리를 완전 캡슐형에서 살짝 각진 모양으로 변경. Collab "Live" 배지의 점도 채운 원 → 속 빈 링으로 모양만 바꿔 처리.
- **컬러셋**: 코드 확인 결과 이미 자체 팔레트("Cursor 시스템" — 따뜻한 크림 캔버스 + 시그니처 오렌지)가 있고 전형적인 AI 보라/파랑 그라디언트가 아니었음 — **추가 작업 불필요, 이미 해결된 상태**로 확인.

## 2. 검증
- `tsc --noEmit`, `npm run build`, `npm run lint` 전부 통과. **기존 테스트 58개 전부 통과**(회귀 없음). dev 서버로 핵심 모듈 정상 서빙 확인.
- 미검증: 실제 브라우저 육안 확인(스크린샷)은 안 함 — 코드/빌드/테스트 레벨만.

## 3. 변경 규모
41개 파일(아이콘 시스템 1, 데이터 정의 5, 화면/컴포넌트 ~25, 스타일 3, i18n 4, 보고서 1). 전부 `feature/design` 워크트리에 uncommitted 상태.

## 4. 충돌 가능성
- **`frontend/src/pages/Home.tsx`, `components/TripChatbot.tsx`가 이번에 대량 수정됨** — `feature/ui-frontend`가 진행 중인 코스 생성 서버 연동(5차 보고서, narrow-case 서버 경로)도 같은 파일들을 건드렸다. 단, design 쪽 변경은 아이콘/마크업 위주라 로직 충돌 가능성은 낮지만, 병합 시 라인 단위 diff 충돌은 날 수 있음 — **두 브랜치 병합 순서를 정해야 함**.
- 카테고리/테마/동반자 등 `constants/*.ts`에 새 `icon` 필드 추가는 기존 필드를 안 건드리는 순수 추가라 충돌 낮음.

## 5. helper-manager 다음 액션 (병합 준비 상태 점검 필요)
지금까지 3개 브랜치가 전부 uncommitted 코드 변경을 갖고 있음:
- `feature/backend`: `api/course.ts`, `api/_lib/**` (신규 파일, 충돌 없음)
- `feature/ui-frontend`: `frontend/src/api/course.ts`(신규), `Home.tsx`/`courseEngine.ts`(narrow-case 서버 연동)
- `feature/design`: 41개 파일(아이콘 시스템, `Home.tsx`/`TripChatbot.tsx` 포함)

**`Home.tsx`를 두 브랜치가 동시에 건드리고 있어 병합 시 조율이 필요합니다.** 다음 중 어떻게 진행할지 결정해 주세요:
1. `feature/design` 변경을 먼저 `dev`에 병합 → `feature/ui-frontend`가 그 위에서 rebase/재적용.
2. `feature/ui-frontend` 변경을 먼저 병합 → `feature/design`이 재적용.
3. helper-manager가 두 워크트리의 `Home.tsx`/`TripChatbot.tsx` 변경을 직접 비교해 수동으로 합친 뒤 `dev`에 병합.

## 6. 지난 라운드 이월 사항 (참고)
- `POST /api/course` narrow-case 연동(5차) — `feature/backend`의 gap(축제/찜/무장애/반려동물/숨은지역) 해소는 아직 대기 중.
- Supabase 운영 배포 확인, 활용신청 상태, PPT/데모 스크립트 — 계속 미해결.
