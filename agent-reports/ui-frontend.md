# 작업 보고서

## 1. 완료한 작업
- (이전 라운드) `docs/PROJECT_SPEC.md`, `docs/PAGE_FLOW.md`, `docs/API_SPEC.md`를 확인하고 현재 프런트 구현을 명세와 대조. 라우트·프록시·장소 분류 확인.
- **정정**: 이전 라운드 보고서 §4에 "`/join/:code` URL payload 인코딩 방식 확정 요청"이라고 썼으나, 이는 잘못된 이해였다. `feature/design`이 코드로 확인한 바에 따르면 `/join/:code`는 이미 **Supabase 실시간 방**(`frontend/src/lib/supabase.ts`, `frontend/src/stores/collab.ts`)으로 구현되어 있고, `/course/shared/:payload`(base64url 인코딩)와는 별개 기능이다. 이번 라운드에 실제 코드를 다시 확인해 이 사실을 인지했다.
- **(이번 라운드, 2026-07-14 사용자 결정: "v1 서버 엔드포인트 먼저 연결") `POST /api/course` 연동 완료(narrow scope)**:
  - `frontend/src/api/course.ts` 신규 — `POST /api/course` 클라이언트. 서버 응답(`GeneratedCourse`, 일자별 그룹)을 프론트 `Course`(단일 순서 리스트)로 매핑. 실패(네트워크/5xx/`not-subscribed`)는 예외를 던져 호출부가 폴백하도록 설계.
  - `frontend/src/pages/Home.tsx`의 `generateFromInput`에 **narrow-case 서버 경로**를 추가: 사용자가 시군구 1곳을 명시 선택했고, 무장애/반려동물/찜/축제연계/한적모드(`hidden_gb`)를 쓰지 않는 "단순 케이스"에서만 `/api/course`를 먼저 시도한다. 실패하거나 이 조건을 벗어나면 기존 클라이언트 파이프라인(`generateCourse` + 다중 소스 병렬 fetch)을 그대로 사용 — 무중단·무회귀.
  - `frontend/src/lib/courseEngine.ts`의 `buildAutoTitle`을 `export`로 변경(순수 함수, 동작 변경 없음) — 서버 경로의 코스 제목 생성에 재사용하기 위함.
- **연동을 narrow-case로 제한한 이유(중요)**: 서버 `/api/course` v1은 축제 연계·찜(favorites) 가중치·다중 프로필·무장애/반려동물/숨은지역(DataLab) 실데이터를 아직 지원하지 않는다(`agent-reports/backend.md` 참고). 이 기능들이 필요한 요청까지 서버로 보내면 기존에 이미 동작하던 결과보다 후퇴한다. 그래서 이 기능들을 쓰지 않는 요청에서만 서버를 타고, 나머지는 그대로 로컬 엔진을 쓰도록 분기했다 — "v1 먼저 연결, 부족한 기능은 점진 보강"이라는 사용자 결정을 실제 회귀 없이 구현하는 방법.

## 2. 검증
- `tsc --noEmit -p tsconfig.app.json` — 통과(0 errors).
- `npm run build` — 성공(vite build + PWA 정상 생성).
- `npm test -- --run` — 58개 테스트 전부 통과(`courseEngine.test.ts` 31개 포함, `buildAutoTitle` export 변경으로 인한 회귀 없음).
- `npm run lint` — 통과(0 warnings/errors).
- `vite` dev 서버 기동 후 `Home.tsx` 모듈 정상 서빙(HTTP 200, import 에러 없음) 확인.
- **미검증**: 실제 브라우저에서 narrow-case 조건(단일 시군구 선택 + 무장애/반려동물/찜/축제연계/한적모드 미사용)으로 "코스 생성"을 눌러 `/api/course` 왕복이 실제로 동작하는지는 **운영 `TOUR_API_KEY`가 있는 배포 환경에서만 확인 가능** — 이 환경에는 키가 없어 로컬에서 실호출 테스트를 못 했다. 요청/응답 스키마는 `api/course.ts`(백엔드)와 `frontend/src/api/course.ts`(이번 작업)를 나란히 대조해 타입 레벨로는 맞춰뒀다.

## 3. 수정한 파일
- `frontend/src/api/course.ts` — 신규, `/api/course` 클라이언트 + 응답→`Course` 매핑.
- `frontend/src/pages/Home.tsx` — `generateFromInput`에 narrow-case 서버 경로 추가, 공통 마무리 로직을 `finishGeneration` 헬퍼로 추출(서버/클라이언트 경로 공유).
- `frontend/src/lib/courseEngine.ts` — `buildAutoTitle` export.
- `agent-reports/ui-frontend.md` — 본 문서.

## 4. 아직 안 된 것
- 운영 키가 있는 환경에서 실제 서버 호출 통합 테스트(§2 참고).
- narrow-case 조건을 넓히는 작업(축제/찜/무장애/반려동물/한적모드/다중지역까지 서버가 지원하게 되면 조건 완화) — `feature/backend`의 gap 해소에 달려 있음.
- `courseEngine.ts`(클라이언트 엔진) 자체는 그대로 유지 — 서버가 모든 케이스를 커버하게 되기 전까지는 삭제하지 않는 것을 권장(폴백 경로로 계속 필요).
- 실기기 모바일 브라우저 및 Kakao Map 키가 설정된 환경에서 지도 동선 렌더링 점검은 여전히 미완료.

## 5. 다른 담당자에게 필요한 것
- **feature/backend**: §4의 gap(축제/찜/다중프로필/무장애/반려동물/숨은지역, 지역명→코드 매핑)이 해소되는 대로 알려주면, narrow-case 조건을 그만큼 넓히겠다.
- **helper-manager/운영**: `TOUR_API_KEY`가 설정된 스테이징에서 narrow-case 실호출 테스트 기회가 필요하다.

## 6. 충돌 가능성
- `frontend/src/pages/Home.tsx`, `frontend/src/lib/courseEngine.ts`는 이번에 수정했다 — `feature/design`이 같은 파일(특히 Home.tsx의 UI 마크업)을 건드리면 충돌 가능. `courseEngine.ts`는 함수 하나를 `export`로 바꾼 것뿐이라 충돌 위험 낮음.
- `frontend/src/api/course.ts`는 신규 파일 — 충돌 없음.

## 7. 다음 액션
- 스테이징(실 `TOUR_API_KEY`) 환경에서 narrow-case 왕복 실제 확인.
- `feature/backend`의 gap 해소 진행 상황에 맞춰 narrow-case 조건 단계적 완화.
