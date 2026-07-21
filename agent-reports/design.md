# 작업 보고서 (design-agent)

## 1. 완료한 작업 (2차 — "AI 티" 4항목 클린업, 사용자 직접 지시)

사용자가 지적한 4가지 "AI가 만든 티가 나는 디자인" 패턴을 실제 코드에서 찾아 정리했다.

### 1-1. 이모지 아이콘 제거 → 기존 커스텀 SVG 아이콘 시스템 확장
- 프로젝트에 이미 `frontend/src/components/icons.tsx`(24px 그리드, 1.75px 스트로크, currentColor)라는 커스텀 아이콘 시스템이 있었다. 이 파일 자체의 주석에 "유니코드 글리프(이모지)는 기기 폰트에 따라 색이 다르게 렌더되어 완성도를 깎는다"는 이유가 이미 적혀 있었음 — 즉 네비게이션 아이콘은 이미 이 원칙으로 만들어졌는데, 본문 콘텐츠 곳곳(퀵칩, 카테고리 배지, 상태 표시, 챗봇 등)에는 여전히 raw 이모지가 남아 있었다.
- **새 아이콘 컴포넌트 약 50개 추가**(react-icons/lucide 같은 외부 라이브러리를 새로 들이지 않고, 이미 있는 사내 시스템을 그대로 확장 — 컨벤션 일치, 의존성 추가 없음).
- 이모지를 실제로 값으로 갖고 있던 5개 데이터 소스에 `icon` 필드를 추가(기존 `emoji` 필드는 캔버스 공유카드 전용으로 보존):
  - `constants/categories.ts` — 카테고리 10종(한옥/템플스테이/서원/사찰/체험/시장/맛집/둘레길/관광지/축제)
  - `constants/themes.ts` — 테마 큐레이션 11종(벚꽃/단풍/설경/야경/일출/아이/부모님/혼자/힐링/미식)
  - `constants/keepers.ts` — "이 자리를 지키는 사람" 10명 페르소나
  - `constants/passes.ts` — 컬렉터 패스 5종(카테고리 재사용으로 처리)
  - `constants/companions.ts` — 동반자 선택지 7종(혼자/친구/연인/아이/부모님/반려동물/무장애)
- 위 데이터를 소비하는 화면/컴포넌트 전부 갱신: `Home`(퀵칩·큐레이션 카드), `Explore`(카테고리 그리드·테마 배너), `CourseResult`, `PlaceDetail`, `Journal`, `Festivals`, `FestivalDetail`, `Report`, `TripChatbot`, `KeeperCard`, `PassProgress`, `CuratedCourses`, `IllustratedMap`(지도 핀), `ContactBlock`, `CollabPanel`, `CollabStart`, `ConquestMap`, `TempleManners`, `RailwayKickoff`, `QuietBadge`, `HanokGlossary`, `Settings`, `ToastHost`, `OfflineBanner`, `AddToHomeDialog`, `FavoriteStar`.
- 별점(★/☆)도 폰트 의존 글리프라 같은 문제가 있어 `StarIcon`(filled prop)으로 교체, 찜/투표 하트(♥/♡)도 `HeartIcon`(filled prop)으로 교체.
- **의도적으로 안 건드린 곳**: `lib/courseCard.ts`, `lib/reportCard.ts`(Canvas 2D로 그리는 공유카드 이미지 생성기) — Canvas는 SVG 컴포넌트를 직접 그릴 수 없어서 `emoji` 문자열 필드를 그대로 씀. 이 두 파일 + `Report.tsx`의 캔버스 카드 호출부 1곳만 예외로 남겨뒀고, 각 데이터 정의에 "캔버스 공유카드 전용" 주석을 달아 이유를 명확히 했다.
- 챗봇 인사말 등 **i18n 번역 문자열에 박혀 있던 이모지**(🙂 👇 ✨)도 4개 언어(ko/en/ja/zh) 전부에서 제거 — 이건 아이콘으로 바꿀 UI 슬롯이 아니라 순수 텍스트라 그냥 삭제.

### 1-2. 왼쪽 선 강조 박스 제거
- `border-l-4 border-l-primary` 패턴 2곳 발견(`home-teaser__card` — 인사이트 티저, `journal__report-cta` — Wrapped 리포트 진입 카드).
- 둘 다 `border`(전체 헤어라인) + 원형 아이콘 배지로 교체. 색은 그대로 두되 "왼쪽에 색 막대" 구조 자체를 없앴다.

### 1-3. 상태 뱃지(점+텍스트 pill) 교체
- `.status-badge` + `.status-dot`(진행중/예정/종료) 패턴이 `Festivals.tsx`, `FestivalDetail.tsx`에 각각 중복 구현되어 있었다.
- 원형 점을 상태별 의미가 다른 아이콘(진행중=반짝임, 예정=달력, 종료=체크)으로 교체하고, pill 모서리도 `rounded-pill`(완전 캡슐형) → `rounded-md`(살짝 각진)로 바꿔 "점+캡슐" 조합 자체를 깼다. 테두리도 색상별로 추가.
- `CollabPanel`의 "Live" 배지(같은 점+텍스트 패턴)도 점을 채운 원 → 속 빈 링(펄스 유지)으로 모양만 바꿔 처리.

### 1-4. 컬러셋
- 코드로 확인한 결과 `tailwind.config.js`에 이미 "Cursor 시스템"이라는 이름의 자체 팔레트가 있었다 — 따뜻한 크림 캔버스(`#f7f7f4`) + 시그니처 오렌지(`#f54e00`, "voltage" 원칙: primary CTA·워드마크에만 희소하게 사용) + warm ink 텍스트. 전형적인 "AI 보라/파랑 그라디언트"가 아니었다.
- 개별 카테고리 배지 색(파랑/보라/에메랄드 등)은 Tailwind 표준 팔레트에서 의미별로 골라 쓴 것이라 일관성이 있음 — 손대지 않았다.
- **결론: 컬러셋 항목은 이미 해결된 상태**였고, 이번 라운드에서 추가 변경 없음.

## 2. 검증
- `tsc --noEmit -p tsconfig.app.json` — 통과(0 errors).
- `npm run build` — 성공(vite build + PWA 정상 생성, 청크 크기 이전과 거의 동일).
- `npm run lint` — 통과(0 warnings/errors).
- `npm test -- --run` — **58개 테스트 전부 통과**(`courseEngine.test.ts` 31개, `categories.test.ts` 10개 포함 — `emoji` 필드를 보존해 기존 테스트 무회귀 확인).
- `vite` dev 서버로 `Home.tsx`, `icons.tsx`, `constants/categories.ts`, `CourseResult.tsx` 등 핵심 모듈이 전부 HTTP 200으로 정상 서빙되는지 확인(모듈 그래프/치명적 import 에러 없음).
- **미검증**: 실제 브라우저에서 새 아이콘들의 시각적 크기·정렬이 의도대로 보이는지는 스크린샷/수동 확인을 못 했다 — 코드 레벨(타입/빌드/테스트)만 확인됨.

## 3. 수정한 파일 (41개)
- 문서: 없음(이번 라운드는 코드 전용).
- 아이콘 시스템: `frontend/src/components/icons.tsx`(약 50개 아이콘 추가).
- 데이터 정의(emoji→icon 필드 추가): `constants/{categories,themes,keepers,passes,companions}.ts`.
- 화면/컴포넌트(이모지 교체): `pages/{Home,Explore,CourseResult,PlaceDetail,Journal,Festivals,FestivalDetail,Report,Settings}.tsx`, `components/{TripChatbot,KeeperCard,PassProgress,CuratedCourses,ContactBlock,CollabPanel,CollabStart,ConquestMap,TempleManners,RailwayKickoff,QuietBadge,HanokGlossary,ToastHost,OfflineBanner,AddToHomeDialog,FavoriteStar,IllustratedMap/IllustratedMap}.tsx`.
- 스타일(왼쪽 바/뱃지 재설계): `styles/{views-1,comp-3,components}.css`.
- i18n: `i18n/locales/{ko,en,ja,zh}.ts`(챗봇 인사말 이모지 제거).
- `agent-reports/design.md` — 본 문서.

## 4. 아직 안 된 것
- 브라우저 육안 확인(스크린샷) — 코드/빌드/테스트 레벨 검증만 완료.
- `lib/courseCard.ts`/`lib/reportCard.ts` 캔버스 공유카드의 이모지는 의도적으로 유지 — 나중에 캔버스에 아이콘 path를 직접 그리는 방식으로 바꾸고 싶다면 별도 작업 필요(이번 범위 밖).
- (1차 라운드 이월) Supabase 운영 배포 확인, PPT/데모 스크립트 등은 여전히 미해결 — 아래 "이전 라운드" 참고.

## 5. 다른 담당자에게 필요한 것
- **feature/ui-frontend**: 이번에 `frontend/src/pages/Home.tsx`, `TripChatbot.tsx` 등 여러 파일을 수정했다. UI 로직도 같은 파일들을 만질 수 있으니, 병합 전에 겹치는 부분(특히 `Home.tsx`의 코스 생성 관련 로직 — 아이콘 교체만 했고 로직은 안 건드림)을 확인해 달라.
- **helper-manager**: 41개 파일 변경 전부 uncommitted 상태로 두었다. `dev` 병합 시점과 순서를 결정해 달라.

## 6. 충돌 가능성
- `frontend/src/pages/Home.tsx` — 이번에 대량 수정(퀵칩 아이콘화, 모달 닫기 버튼 등). `feature/ui-frontend`가 진행 중인 코스 생성 서버 연동 작업과 같은 파일을 건드릴 가능성이 있어 병합 시 라인 단위 충돌 가능 — 단, 내가 건드린 부분은 아이콘/마크업 위주라 로직 충돌 가능성은 낮음.
- `frontend/src/components/TripChatbot.tsx` — 마찬가지로 마크업/아이콘 교체 위주.
- `constants/categories.ts`, `constants/companions.ts` 등 — 새 `icon` 필드 추가는 기존 필드를 안 건드리는 순수 추가라 다른 브랜치와 충돌 가능성 낮음.
- 문서(`docs/*.md`)는 이번 라운드에 손대지 않아 1차 라운드 상태 그대로.

## 7. 다음 액션
- helper-manager가 병합을 진행하기 전, 원한다면 실제 브라우저로 Home/Explore/CourseResult 화면을 한 번 훑어 아이콘 크기·정렬 확인 권장.
- `feature/ui-frontend`와 `Home.tsx`/`TripChatbot.tsx` 변경사항 조율 후 병합.

---

## 이전 라운드 보고서 (1차 — 문서 검증)

### 완료한 작업
- `docs/PROJECT_SPEC.md`, `docs/API_SPEC.md`, `docs/PAGE_FLOW.md`의 "미결 사항" 다수를 실제 코드 확인(Read 전용, 수정 금지 영역 준수)으로 해소.
- 확인 근거: `frontend/src/routes.tsx`, `frontend/src/components/AppShell.tsx`, `frontend/src/pages/{Admin,CourseEdit,CourseShared,CourseJoin}.tsx`, `frontend/src/lib/{courseEngine,share,supabase}.ts`, `frontend/src/stores/collab.ts`, `api/og-image.ts`.
- **핵심 발견**: `/join/:code`(실시간 코스 공동편집)는 `docs/PROJECT_SPEC.md`가 전제한 "DB 없음" 원칙의 유일한 예외로, **Supabase**(익명 인증, RLS로 `shared_courses` 테이블만 허용, Realtime 채널)를 사용한다. `/course/shared/:payload`(단순 링크 공유, 서버 없는 base64url 인코딩)와는 완전히 다른 메커니즘이라 문서에서 분리 서술했다.
- 코스 생성 엔진이 서버 API가 아닌 100% 프론트 로직(`courseEngine.ts`)임을 코드로 확정.
- `/api/og-image` 정확한 요청/응답/보안 스펙(SSRF 방어, 캐시 정책 등) 확정.
- `/admin` 통계가 localStorage 집계뿐 서버 호출 없음을 확정.
- 내비게이션 구조(모바일 하단 탭 6개, 데스크탑 상단 메뉴, 설정 아이콘 분리, 풀스크린 라우트) 확정.
- `docs/JUDGE_APPEAL.md`에 "로그인 없는 실시간 공동편집" 어필 포인트 추가(회원가입 마찰 제거 + graceful 폴백 설계).

### 수정한 파일
- `docs/PROJECT_SPEC.md`, `docs/API_SPEC.md`, `docs/PAGE_FLOW.md`, `docs/JUDGE_APPEAL.md`
